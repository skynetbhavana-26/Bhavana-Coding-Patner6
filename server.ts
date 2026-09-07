import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { EventEmitter } from "events";
import { PassThrough } from "stream";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { socialStore, UserAccount } from "./server/store";
import { AI_SYSTEM_INSTRUCTION, generateSmartChatbotResponse } from "./server/chatbotEngine";

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Track active uploads in real-time so readers can await stream completion with 0ms delay
interface UploadTracker {
  finished: boolean;
  emitter: EventEmitter;
}
const activeUploads = new Map<string, UploadTracker>();

// Increase body limit for uploads
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ extended: true, limit: "150mb" }));

// Global CORS & Cross-Origin-Resource-Policy for video and media playback across iframes & previews
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// Upload directory setup
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Dedicated streaming endpoint for uploaded videos & media with HTTP 206 Range support
app.get("/uploads/:filename", async (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadsDir, filename);

  // If the file is actively being uploaded right now, wait for it to finish
  let active = activeUploads.get(filename);
  if (active && !active.finished) {
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 60000);
      const onFinish = () => { clearTimeout(timer); resolve(); };
      active!.emitter.once("finish", onFinish);
      active!.emitter.once("error", onFinish);
      req.on("close", () => {
        clearTimeout(timer);
        active?.emitter.removeListener("finish", onFinish);
        active?.emitter.removeListener("error", onFinish);
        resolve();
      });
    });
  } else if (!fs.existsSync(filePath)) {
    // Wait for the upload request to arrive and finish (up to 45 seconds)
    const startTime = Date.now();
    while (Date.now() - startTime < 45000) {
      if (req.destroyed || req.closed) break;
      await new Promise((r) => setTimeout(r, 100));

      active = activeUploads.get(filename);
      if (active && !active.finished) {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 60000);
          const onFinish = () => { clearTimeout(timer); resolve(); };
          active!.emitter.once("finish", onFinish);
          active!.emitter.once("error", onFinish);
          req.on("close", () => {
            clearTimeout(timer);
            active?.emitter.removeListener("finish", onFinish);
            active?.emitter.removeListener("error", onFinish);
            resolve();
          });
        });
        break;
      }

      if (fs.existsSync(filePath)) {
        break;
      }
    }
  }

  // If the file still doesn't exist, return 404 text with no-cache so browser media element can retry cleanly
  if (!fs.existsSync(filePath)) {
    res.status(404)
      .setHeader("Content-Type", "text/plain")
      .setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
      .send("Media not found or still processing");
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const ext = path.extname(filename).toLowerCase();
  let contentType = "application/octet-stream";
  if (ext === ".mp4" || ext === ".m4v") contentType = "video/mp4";
  else if (ext === ".webm") contentType = "video/webm";
  else if (ext === ".mov") contentType = "video/mp4"; // Ensure standard decoding on Chrome/Android/Safari
  else if (ext === ".ogv") contentType = "video/ogg";
  else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
  else if (ext === ".png") contentType = "image/png";
  else if (ext === ".webp") contentType = "image/webp";
  else if (ext === ".gif") contentType = "image/gif";

  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=86400");

  if (range && contentType.startsWith("video/")) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).setHeader("Content-Range", `bytes */${fileSize}`).end();
      return;
    }

    const chunksize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType,
    });
    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

// Serve uploaded files statically as fallback
app.use("/uploads", express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", "*");
    const lower = filePath.toLowerCase();
    if (lower.endsWith(".mp4") || lower.endsWith(".m4v") || lower.endsWith(".mov")) {
      res.setHeader("Content-Type", "video/mp4");
    } else if (lower.endsWith(".webm")) {
      res.setHeader("Content-Type", "video/webm");
    }
  }
}));
// Serve public assets statically
app.use(express.static(path.join(process.cwd(), "public")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// File & Image Upload Endpoint (supports Images, ZIPs, Code Files, etc.)
app.post("/api/upload", (req, res) => {
  try {
    const { image, fileData, video, filename: clientFilename } = req.body;
    const payload = fileData || image || video;
    if (!payload) {
      res.status(400).json({ success: false, error: "No file payload provided" });
      return;
    }

    const matches = payload.match(/^data:([A-Za-z0-9-+\/.]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = "bin";

    if (clientFilename && clientFilename.includes(".")) {
      ext = clientFilename.split(".").pop() || "bin";
    }

    if (matches && matches.length === 3) {
      const mime = matches[1].toLowerCase();
      if (mime.includes("zip") || mime.includes("compressed") || mime.includes("octet-stream")) {
        if (!ext || ext === "bin") ext = "zip";
      } else if (mime.includes("png")) ext = "png";
      else if (mime.includes("webp")) ext = "webp";
      else if (mime.includes("gif")) ext = "gif";
      else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
      else if (mime.includes("video/mp4") || mime.includes("mp4")) ext = "mp4";
      else if (mime.includes("video/webm") || mime.includes("webm")) ext = "webm";
      else if (mime.includes("video/quicktime") || mime.includes("mov")) ext = "mov";
      else if (mime.includes("video/ogg")) ext = "ogv";
      else if (mime.includes("video/")) ext = "mp4";
      else if (mime.includes("typescript")) ext = "ts";
      else if (mime.includes("javascript")) ext = "js";
      else if (mime.includes("json")) ext = "json";
      else if (!ext || ext === "bin") ext = "txt";

      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(payload, "base64");
    }

    const cleanBase = (clientFilename || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}_${cleanBase.endsWith("." + ext) ? cleanBase : cleanBase + "." + ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;
    console.log(`[Upload] Saved file to ${filePath} (${publicUrl})`);

    res.json({
      success: true,
      url: publicUrl,
      filename: clientFilename || uniqueName,
      size: buffer.length,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Upload Error]", error);
    res.status(500).json({ success: false, error: error.message || "Failed to upload file" });
  }
});

// High-speed binary streaming upload endpoint (pipes raw file bytes directly to disk with zero Base64 overhead)
app.post("/api/upload-video", (req, res) => {
  try {
    const rawFilename = (req.query.filename as string) || (req.headers["x-filename"] as string) || "video.mp4";
    const extMatch = path.extname(rawFilename).toLowerCase();
    const allowed = [".mp4", ".mov", ".webm", ".mkv", ".m4v", ".ogv", ".avi"];
    const ext = allowed.includes(extMatch) ? extMatch : ".mp4";
    const customName = (req.query.uniqueName as string) || (req.headers["x-unique-name"] as string);
    const uniqueFilename = (customName && /^[a-zA-Z0-9._-]+\.(mp4|mov|webm|mkv|m4v|ogv|avi)$/i.test(customName))
      ? customName
      : `video_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    const tracker: UploadTracker = activeUploads.get(uniqueFilename) || { finished: false, emitter: new EventEmitter() };
    activeUploads.set(uniqueFilename, tracker);

    // If body was already read into a Buffer
    if (Buffer.isBuffer(req.body) && req.body.length > 0) {
      fs.writeFileSync(filePath, req.body);
      tracker.finished = true;
      tracker.emitter.emit("finish");
      setTimeout(() => activeUploads.delete(uniqueFilename), 60000);

      const publicUrl = `/uploads/${uniqueFilename}`;
      res.json({
        success: true,
        url: publicUrl,
        filename: uniqueFilename,
        size: req.body.length,
      });
      return;
    }

    const writeStream = fs.createWriteStream(filePath, { highWaterMark: 1024 * 1024 });
    let bytesReceived = 0;

    req.on("data", (chunk) => {
      bytesReceived += chunk.length;
    });

    req.pipe(writeStream);

    writeStream.on("finish", () => {
      tracker.finished = true;
      tracker.emitter.emit("finish");
      setTimeout(() => activeUploads.delete(uniqueFilename), 60000);

      const publicUrl = `/uploads/${uniqueFilename}`;
      console.log(`[Stream Video Upload] Fast binary stream saved to ${filePath} (${bytesReceived} bytes -> ${publicUrl})`);
      if (!res.headersSent) {
        res.json({
          success: true,
          url: publicUrl,
          filename: uniqueFilename,
          size: bytesReceived,
        });
      }
    });

    writeStream.on("error", (err) => {
      console.error("[Stream Video Upload Error]", err);
      tracker.emitter.emit("error", err);
      activeUploads.delete(uniqueFilename);
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: "Failed to stream video to disk" });
      }
    });

    req.on("error", (err) => {
      console.error("[Stream Video Request Error]", err);
      tracker.emitter.emit("error", err);
      activeUploads.delete(uniqueFilename);
      writeStream.destroy();
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: "Upload request interrupted" });
      }
    });
  } catch (error: any) {
    console.error("[Upload Video Endpoint Error]", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message || "Streaming video failed" });
    }
  }
});

// High-speed binary streaming upload endpoint for images (pipes raw image bytes directly to disk with zero Base64 overhead)
app.post("/api/upload-image", (req, res) => {
  try {
    const rawFilename = (req.query.filename as string) || (req.headers["x-filename"] as string) || "image.jpg";
    const extMatch = path.extname(rawFilename).toLowerCase();
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".bmp"];
    const ext = allowed.includes(extMatch) ? extMatch : ".jpg";
    const customName = (req.query.uniqueName as string) || (req.headers["x-unique-name"] as string);
    const uniqueFilename = (customName && /^[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(customName))
      ? customName
      : `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    if (Buffer.isBuffer(req.body) && req.body.length > 0) {
      fs.writeFileSync(filePath, req.body);
      const publicUrl = `/uploads/${uniqueFilename}`;
      res.json({
        success: true,
        url: publicUrl,
        filename: uniqueFilename,
        size: req.body.length,
      });
      return;
    }

    const writeStream = fs.createWriteStream(filePath, { highWaterMark: 1024 * 1024 });
    let bytesReceived = 0;

    req.on("data", (chunk) => {
      bytesReceived += chunk.length;
    });

    req.pipe(writeStream);

    writeStream.on("finish", () => {
      const publicUrl = `/uploads/${uniqueFilename}`;
      console.log(`[Stream Image Upload] Fast binary stream saved to ${filePath} (${bytesReceived} bytes -> ${publicUrl})`);
      if (!res.headersSent) {
        res.json({
          success: true,
          url: publicUrl,
          filename: uniqueFilename,
          size: bytesReceived,
        });
      }
    });

    writeStream.on("error", (err) => {
      console.error("[Stream Image Upload Error]", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: "Failed to stream image to disk" });
      }
    });

    req.on("error", (err) => {
      console.error("[Stream Image Request Error]", err);
      writeStream.destroy();
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: "Upload request interrupted" });
      }
    });
  } catch (error: any) {
    console.error("[Upload Image Endpoint Error]", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message || "Streaming image failed" });
    }
  }
});

// ==================== REST API ENDPOINTS ====================

// Login or register user dynamically
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, name, avatar, role } = req.body;
    const user = socialStore.loginOrRegister({ email, name, avatar, role });
    
    // Broadcast user presence / update to all clients
    broadcastToAll({
      type: "USER_PRESENCE",
      payload: { userId: user.id, isOnline: true },
    });
    broadcastToAll({
      type: "USER_UPDATED",
      payload: { user },
    });

    res.json({ success: true, user });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get all users/developers with connection status relative to requesting user
app.get("/api/users", (req, res) => {
  const viewerId = (req.query.viewerId as string) || "";
  const users = socialStore
    .getUsers()
    .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0))
    .map((u) => ({
      ...u,
      connectionStatus: viewerId ? socialStore.getConnectionStatus(viewerId, u.id) : "none",
    }));
  res.json({ success: true, users });
});

// Get user profile
app.get("/api/user/:id", (req, res) => {
  const user = socialStore.getUser(req.params.id);
  if (!user) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }
  res.json({ success: true, user });
});

// Update user profile
app.post("/api/user/:id", (req, res) => {
  const userId = req.params.id;
  const existing = socialStore.getUser(userId);
  const updated = socialStore.saveUser({
    ...(existing || {}),
    ...req.body,
    id: userId,
  });
  broadcastToAll({
    type: "USER_UPDATED",
    payload: { user: updated },
  });
  res.json({ success: true, user: updated });
});

// Update user avatar directly
app.post("/api/user/:id/avatar", (req, res) => {
  const userId = req.params.id;
  const { avatar } = req.body;
  if (!avatar) {
    res.status(400).json({ success: false, error: "Avatar URL or data required" });
    return;
  }
  const existing = socialStore.getUser(userId);
  const updated = socialStore.saveUser({
    ...(existing || {}),
    id: userId,
    avatar,
  });
  broadcastToAll({
    type: "USER_UPDATED",
    payload: { user: updated },
  });
  res.json({ success: true, user: updated });
});

// Get notifications for user
app.get("/api/notifications/:userId", (req, res) => {
  const notifs = socialStore.getNotificationsForUser(req.params.userId);
  res.json({ success: true, notifications: notifs });
});

// Mark notification read
app.post("/api/notifications/:id/read", (req, res) => {
  const { userId } = req.body;
  socialStore.markNotificationAsRead(userId, req.params.id);
  res.json({ success: true });
});

// Mark all notifications read
app.post("/api/notifications/read-all", (req, res) => {
  const { userId } = req.body;
  socialStore.markAllNotificationsAsRead(userId);
  res.json({ success: true });
});

// Send connection request
app.post("/api/connections/request", (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    const result = socialStore.sendConnectionRequest(fromUserId, toUserId);
    
    // Broadcast notification to toUserId's sockets
    sendToUser(toUserId, {
      type: "NOTIFICATION_RECEIVED",
      payload: { notification: result.notification },
    });
    sendToUser(toUserId, {
      type: "CONNECTION_REQUEST_RECEIVED",
      payload: { request: result.request, fromUser: socialStore.getUser(fromUserId) },
    });

    // Notify fromUserId's sockets that status is now pending
    sendToUser(fromUserId, {
      type: "CONNECTION_STATUS_CHANGED",
      payload: { targetId: toUserId, status: "pending" },
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Accept connection request
app.post("/api/connections/accept", (req, res) => {
  try {
    const { userId, requesterId } = req.body;
    const result = socialStore.acceptConnectionRequest(userId, requesterId);

    const user = socialStore.getUser(userId);
    const requester = socialStore.getUser(requesterId);

    // Notify requester
    sendToUser(requesterId, {
      type: "CONNECTION_ACCEPTED",
      payload: {
        partnerId: userId,
        partner: user,
        notification: result.notificationForRequester,
      },
    });

    // Notify user
    sendToUser(userId, {
      type: "CONNECTION_ACCEPTED",
      payload: {
        partnerId: requesterId,
        partner: requester,
      },
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Decline connection request
app.post("/api/connections/decline", (req, res) => {
  try {
    const { userId, requesterId } = req.body;
    socialStore.declineConnectionRequest(userId, requesterId);

    sendToUser(requesterId, {
      type: "CONNECTION_DECLINED",
      payload: { targetId: userId },
    });
    sendToUser(userId, {
      type: "CONNECTION_STATUS_CHANGED",
      payload: { targetId: requesterId, status: "none" },
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get conversations for user
app.get("/api/conversations/:userId", (req, res) => {
  const convs = socialStore.getConversationsSummary(req.params.userId);
  res.json({ success: true, conversations: convs });
});

// Get messages
app.get("/api/messages/:userId/:partnerId", (req, res) => {
  const msgs = socialStore.getMessages(req.params.userId, req.params.partnerId);
  res.json({
    success: true,
    messages: msgs.map((m) => ({
      ...m,
      isOutgoing: m.senderId === req.params.userId,
      isRead: m.status === "read",
    })),
  });
});

// Edit message
app.post("/api/messages/:id/edit", (req, res) => {
  const { senderId, newText } = req.body;
  if (!senderId || typeof newText !== "string") {
    res.status(400).json({ success: false, error: "senderId and newText required" });
    return;
  }
  const msg = socialStore.editMessage(req.params.id, senderId, newText);
  if (!msg) {
    res.status(404).json({ success: false, error: "Message not found or unauthorized" });
    return;
  }
  sendToUser(msg.senderId, {
    type: "MESSAGE_EDITED",
    payload: { message: { ...msg, isOutgoing: true } },
  });
  sendToUser(msg.recipientId, {
    type: "MESSAGE_EDITED",
    payload: { message: { ...msg, isOutgoing: false } },
  });
  res.json({ success: true, message: msg });
});

// Unsend message
app.post("/api/messages/:id/unsend", (req, res) => {
  const { senderId, partnerId } = req.body;
  const result = socialStore.unsendMessage(req.params.id, senderId || "");
  
  if (senderId) {
    sendToUser(senderId, {
      type: "MESSAGE_UNSENT",
      payload: { messageId: req.params.id, conversationId: result?.conversationId },
    });
  }
  const recipient = result?.recipientId || partnerId;
  if (recipient) {
    sendToUser(recipient, {
      type: "MESSAGE_UNSENT",
      payload: { messageId: req.params.id, conversationId: result?.conversationId },
    });
  }
  broadcastToAll({
    type: "MESSAGE_UNSENT",
    payload: { messageId: req.params.id, conversationId: result?.conversationId },
  });
  res.json({ success: true, messageId: req.params.id });
});

// Edit project team message
app.post("/api/teams/:teamId/messages/:messageId/edit", (req, res) => {
  const { teamId, messageId } = req.params;
  const { senderId, newText } = req.body;
  if (!senderId || typeof newText !== "string") {
    res.status(400).json({ success: false, error: "senderId and newText required" });
    return;
  }
  const msg = socialStore.editTeamMessage(teamId, messageId, senderId, newText);
  if (!msg) {
    res.status(404).json({ success: false, error: "Message not found or unauthorized" });
    return;
  }
  broadcastToAll({
    type: "TEAM_MESSAGE_EDITED",
    payload: { teamId, message: msg },
  });
  res.json({ success: true, message: msg });
});

// Unsend project team message
app.post("/api/teams/:teamId/messages/:messageId/unsend", (req, res) => {
  const { teamId, messageId } = req.params;
  const { senderId } = req.body;
  socialStore.unsendTeamMessage(teamId, messageId, senderId || "");
  
  broadcastToAll({
    type: "TEAM_MESSAGE_UNSENT",
    payload: { teamId, messageId },
  });
  
  res.json({ success: true, teamId, messageId });
});

// ==================== CHATBOT PAIR PROGRAMMER API ====================

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string") {
      res.status(400).json({ success: false, error: "Message is required" });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const reply = generateSmartChatbotResponse(message, history);
      res.json({ success: true, reply });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const rawTurns: Array<{ role: "user" | "model"; text: string }> = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-14)) {
        if (item && item.text && typeof item.text === "string") {
          const role = item.role === "assistant" || item.role === "model" ? "model" : "user";
          rawTurns.push({ role, text: item.text.trim() });
        }
      }
    }

    // Append current message
    rawTurns.push({ role: "user", text: message.trim() });

    // Strictly enforce alternating turns for Gemini API
    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
    for (const turn of rawTurns) {
      if (!turn.text) continue;
      if (contents.length > 0 && contents[contents.length - 1].role === turn.role) {
        // Merge consecutive turns of the same role
        contents[contents.length - 1].parts[0].text += `\n\n${turn.text}`;
      } else {
        contents.push({
          role: turn.role,
          parts: [{ text: turn.text }],
        });
      }
    }

    // Ensure contents starts with a user turn
    while (contents.length > 0 && contents[0].role !== "user") {
      contents.shift();
    }

    if (contents.length === 0) {
      contents.push({ role: "user", parts: [{ text: message.trim() }] });
    }

    const MODELS_TO_TRY = [
      "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
      "gemini-flash-latest",
    ];

    let reply = "";

    for (const model of MODELS_TO_TRY) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: AI_SYSTEM_INSTRUCTION,
            temperature: 0.2,
          },
        });
        if (response && response.text) {
          reply = response.text;
          break;
        }
      } catch (err: any) {
        // Log info instead of stderr warning during transient high demand / fallback transitions
        console.log(`[AI Chat] Model ${model} unavailable, switching to next engine option.`);
      }
    }

    if (!reply) {
      console.log("[AI Chat] Generating response via context-aware chatbot engine");
      reply = generateSmartChatbotResponse(message, history);
    }

    res.json({ success: true, reply });
  } catch (error: any) {
    try {
      const fallbackReply = generateSmartChatbotResponse(req.body?.message || "", req.body?.history);
      res.json({ success: true, reply: fallbackReply });
    } catch {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate AI response",
        reply: "I am ready to help you! Please specify what you would like to build.",
      });
    }
  }
});

// ==================== PROJECT TEAMS REST API ====================

// Get all teams or teams for specific user
app.get("/api/teams", (req, res) => {
  const userId = req.query.userId as string | undefined;
  const teams = socialStore.getTeams(userId);
  const expanded = teams.map((t) => ({
    ...t,
    members: t.memberIds.map((mId) => socialStore.getUser(mId)).filter(Boolean),
  }));
  res.json({ success: true, teams: expanded });
});

// Get single team details
app.get("/api/teams/:id", (req, res) => {
  const team = socialStore.getTeam(req.params.id);
  if (!team) {
    res.status(404).json({ success: false, error: "Team not found" });
    return;
  }
  res.json({
    success: true,
    team: {
      ...team,
      members: team.memberIds.map((mId) => socialStore.getUser(mId)).filter(Boolean),
    },
  });
});

// Create new team
app.post("/api/teams", (req, res) => {
  try {
    const { name, description, projectTopic, avatar, createdBy, memberIds } = req.body;
    if (!name || !createdBy) {
      res.status(400).json({ success: false, error: "Name and creator ID required" });
      return;
    }
    const team = socialStore.createTeam({
      name,
      description: description || "",
      projectTopic: projectTopic || name,
      avatar,
      createdBy,
      memberIds: memberIds || [createdBy],
    });

    const expandedTeam = {
      ...team,
      members: team.memberIds.map((mId) => socialStore.getUser(mId)).filter(Boolean),
    };

    broadcastToAll({
      type: "TEAM_CREATED",
      payload: { team: expandedTeam },
    });

    res.json({ success: true, team: expandedTeam });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete team
app.delete("/api/teams/:id", (req, res) => {
  try {
    const teamId = req.params.id;
    const ok = socialStore.deleteTeam(teamId);
    if (!ok) {
      res.status(404).json({ success: false, error: "Team not found" });
      return;
    }
    broadcastToAll({
      type: "TEAM_DELETED",
      payload: { teamId },
    });
    res.json({ success: true, teamId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update team
app.put("/api/teams/:id", (req, res) => {
  try {
    const teamId = req.params.id;
    const { name, description, projectTopic, memberIds } = req.body;
    const updated = socialStore.updateTeam(teamId, { name, description, projectTopic, memberIds });
    if (!updated) {
      res.status(404).json({ success: false, error: "Team not found" });
      return;
    }
    const expandedTeam = {
      ...updated,
      members: updated.memberIds.map((mId) => socialStore.getUser(mId)).filter(Boolean),
    };
    broadcastToAll({
      type: "TEAM_UPDATED",
      payload: { team: expandedTeam },
    });
    res.json({ success: true, team: expandedTeam });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get team messages
app.get("/api/teams/:id/messages", (req, res) => {
  const messages = socialStore.getTeamMessages(req.params.id);
  res.json({ success: true, messages });
});

// Send team message
app.post("/api/teams/:id/messages", (req, res) => {
  try {
    const teamId = req.params.id;
    const { senderId, text, type = "text", imageUrl, codeSnippet, codeFile, zipFile, voiceDuration, timestamp, createdAt } = req.body;
    if (!senderId) {
      res.status(400).json({ success: false, error: "Sender ID required" });
      return;
    }

    const msg = socialStore.addTeamMessage({
      teamId,
      senderId,
      text: text || "",
      type,
      imageUrl,
      codeSnippet,
      codeFile,
      zipFile,
      voiceDuration,
      timestamp,
      createdAt,
    });

    broadcastToAll({
      type: "NEW_TEAM_MESSAGE",
      payload: { message: msg, teamId },
    });

    // Also broadcast progress update in case file was attached
    if (type === "code_file" || type === "zip" || type === "image") {
      const progress = socialStore.getTeamProgress(teamId);
      if (progress) {
        broadcastToAll({
          type: "TEAM_PROGRESS_UPDATED",
          payload: { teamId, progress },
        });
      }
    }

    res.json({ success: true, message: msg });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get team progress & activity
app.get("/api/teams/:id/progress", (req, res) => {
  const progress = socialStore.getTeamProgress(req.params.id);
  if (!progress) {
    res.status(404).json({ success: false, error: "Team not found" });
    return;
  }
  res.json({ success: true, ...progress });
});

// Toggle team task
app.post("/api/teams/:id/tasks/toggle", (req, res) => {
  const { taskId, completed } = req.body;
  const team = socialStore.toggleTeamTask(req.params.id, taskId, completed);
  if (!team) {
    res.status(404).json({ success: false, error: "Team or task not found" });
    return;
  }

  const progress = socialStore.getTeamProgress(req.params.id);
  broadcastToAll({
    type: "TEAM_PROGRESS_UPDATED",
    payload: { teamId: req.params.id, progress },
  });

  res.json({ success: true, team, progress });
});

// Add team task
app.post("/api/teams/:id/tasks", (req, res) => {
  const { userId, title } = req.body;
  const team = socialStore.addTeamTask(req.params.id, userId, title);
  if (!team) {
    res.status(404).json({ success: false, error: "Team not found" });
    return;
  }

  const progress = socialStore.getTeamProgress(req.params.id);
  broadcastToAll({
    type: "TEAM_PROGRESS_UPDATED",
    payload: { teamId: req.params.id, progress },
  });

  res.json({ success: true, team, progress });
});

// ==================== WEBSOCKET SERVER & REAL-TIME ENGINE ====================

interface ClientMeta {
  userId: string;
  activeChatPartnerId?: string | null;
}

const wss = new WebSocketServer({ server, path: "/ws" });
const clientMetaMap = new Map<WebSocket, ClientMeta>();

function sendJson(ws: WebSocket, data: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function sendToUser(userId: string, data: any) {
  for (const [ws, meta] of clientMetaMap.entries()) {
    if (meta.userId === userId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
}

function broadcastToAll(data: any, excludeWs?: WebSocket) {
  for (const [ws] of clientMetaMap.entries()) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
}

function isUserChatActive(recipientId: string, partnerId: string): boolean {
  for (const [, meta] of clientMetaMap.entries()) {
    if (meta.userId === recipientId && meta.activeChatPartnerId === partnerId) {
      return true;
    }
  }
  return false;
}

wss.on("connection", (ws, req) => {
  const urlObj = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
  const userId = urlObj.searchParams.get("userId") || "bhavana-01";

  clientMetaMap.set(ws, { userId, activeChatPartnerId: null });
  socialStore.setUserOnline(userId, true);

  console.log(`[WS] Client connected for user: ${userId}`);

  // Send initial state to the connected client
  const user = socialStore.getUser(userId);
  const notifs = socialStore.getNotificationsForUser(userId);
  const convs = socialStore.getConversationsSummary(userId);

  sendJson(ws, {
    type: "INIT_STATE",
    payload: {
      user,
      notifications: notifs,
      conversations: convs,
    },
  });

  // Broadcast presence update
  broadcastToAll({
    type: "USER_PRESENCE",
    payload: { userId, isOnline: true },
  });

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const meta = clientMetaMap.get(ws);
      if (!meta) return;

      switch (data.type) {
        case "JOIN": {
          if (data.userId) {
            meta.userId = data.userId;
            socialStore.setUserOnline(data.userId, true);
            broadcastToAll({
              type: "USER_PRESENCE",
              payload: { userId: data.userId, isOnline: true },
            });
          }
          break;
        }

        case "ENTER_CHAT": {
          const partnerId = data.partnerId;
          meta.activeChatPartnerId = partnerId;

          // Notify partner that this user is now actively inside this chat screen
          sendToUser(partnerId, {
            type: "CHAT_PRESENCE",
            payload: {
              userId: meta.userId,
              isInChat: true,
              isOnline: true,
            },
          });

          // Inform this user whether partner is currently active in this chat screen
          const partnerInChat = isUserChatActive(partnerId, meta.userId);
          sendToUser(meta.userId, {
            type: "CHAT_PRESENCE",
            payload: {
              userId: partnerId,
              isInChat: partnerInChat,
              isOnline: partnerInChat,
            },
          });

          // Automatically mark unread messages from partner as 'read'
          const updatedIds = socialStore.markMessagesAsRead(meta.userId, partnerId);
          if (updatedIds.length > 0) {
            // Notify partner that messages have been read (single tick -> double blue tick!)
            sendToUser(partnerId, {
              type: "MESSAGES_READ",
              payload: {
                readerId: meta.userId,
                partnerId: meta.userId,
                conversationId: socialStore.getConversationId(meta.userId, partnerId),
                messageIds: updatedIds,
              },
            });
            // Also notify viewer
            sendToUser(meta.userId, {
              type: "MESSAGES_READ",
              payload: {
                readerId: meta.userId,
                partnerId,
                conversationId: socialStore.getConversationId(meta.userId, partnerId),
                messageIds: updatedIds,
              },
            });
          }
          break;
        }

        case "LEAVE_CHAT": {
          const prevPartner = meta.activeChatPartnerId;
          meta.activeChatPartnerId = null;
          if (prevPartner) {
            sendToUser(prevPartner, {
              type: "CHAT_PRESENCE",
              payload: {
                userId: meta.userId,
                isInChat: false,
                isOnline: false,
              },
            });
          }
          break;
        }

        case "SEND_MESSAGE": {
          const { recipientId, text, msgType = "text", imageUrl, videoUrl, replyTo, codeSnippet, codeFile, zipFile, voiceDuration, timestamp, createdAt } = data;
          if (!recipientId) return;

          // Pre-register pending video upload in activeUploads so recipient GET /uploads/:filename waits gracefully without 404
          if (videoUrl && typeof videoUrl === "string" && videoUrl.startsWith("/uploads/")) {
            const vName = path.basename(videoUrl);
            const vPath = path.join(uploadsDir, vName);
            if (!activeUploads.has(vName) && !fs.existsSync(vPath)) {
              activeUploads.set(vName, { finished: false, emitter: new EventEmitter() });
            }
          }

          // Check if recipient currently has chat open with this sender
          const recipientInChat = isUserChatActive(recipientId, meta.userId);
          const initialStatus = recipientInChat ? "read" : "sent";

          const msg = socialStore.addMessage(meta.userId, recipientId, text, msgType, {
            imageUrl,
            videoUrl,
            replyTo,
            codeSnippet,
            voiceDuration,
            initialStatus,
            timestamp,
            createdAt,
          });

          // Attach codeFile or zipFile if present
          if (codeFile) (msg as any).codeFile = codeFile;
          if (zipFile) (msg as any).zipFile = zipFile;

          // 1. Send back to all sender's open tabs/windows
          sendToUser(meta.userId, {
            type: "MESSAGE_SENT",
            payload: {
              message: {
                ...msg,
                isOutgoing: true,
                isRead: msg.status === "read",
              },
            },
          });

          // 2. Send to all recipient's open tabs/windows
          sendToUser(recipientId, {
            type: "NEW_MESSAGE",
            payload: {
              message: {
                ...msg,
                isOutgoing: false,
                isRead: msg.status === "read",
              },
            },
          });

          // If delivered with status 'read' immediately, trigger tick update
          if (initialStatus === "read") {
            sendToUser(meta.userId, {
              type: "MESSAGES_READ",
              payload: {
                readerId: recipientId,
                partnerId: recipientId,
                conversationId: msg.conversationId,
                messageIds: [msg.id],
              },
            });
          }
          break;
        }

        case "EDIT_MESSAGE": {
          const { messageId, newText } = data;
          if (!messageId || typeof newText !== "string") return;
          const msg = socialStore.editMessage(messageId, meta.userId, newText);
          if (msg) {
            sendToUser(msg.senderId, {
              type: "MESSAGE_EDITED",
              payload: { message: { ...msg, isOutgoing: true } },
            });
            sendToUser(msg.recipientId, {
              type: "MESSAGE_EDITED",
              payload: { message: { ...msg, isOutgoing: false } },
            });
          }
          break;
        }

        case "UNSEND_MESSAGE": {
          const { messageId } = data;
          if (!messageId) return;
          const result = socialStore.unsendMessage(messageId, meta.userId);
          if (result) {
            sendToUser(meta.userId, {
              type: "MESSAGE_UNSENT",
              payload: { messageId, conversationId: result.conversationId },
            });
            sendToUser(result.recipientId, {
              type: "MESSAGE_UNSENT",
              payload: { messageId, conversationId: result.conversationId },
            });
          }
          break;
        }

        case "SEND_TEAM_MESSAGE": {
          const { teamId, text, msgType = "text", imageUrl, videoUrl, replyTo, codeSnippet, codeFile, zipFile, voiceDuration, timestamp, createdAt } = data;
          if (!teamId) return;

          // Pre-register pending video upload in activeUploads so recipient GET /uploads/:filename waits gracefully without 404
          if (videoUrl && typeof videoUrl === "string" && videoUrl.startsWith("/uploads/")) {
            const vName = path.basename(videoUrl);
            const vPath = path.join(uploadsDir, vName);
            if (!activeUploads.has(vName) && !fs.existsSync(vPath)) {
              activeUploads.set(vName, { finished: false, emitter: new EventEmitter() });
            }
          }

          const msg = socialStore.addTeamMessage({
            teamId,
            senderId: meta.userId,
            text,
            type: msgType,
            imageUrl,
            videoUrl,
            replyTo,
            codeSnippet,
            codeFile,
            zipFile,
            voiceDuration,
            timestamp,
            createdAt,
          });

          broadcastToAll({
            type: "NEW_TEAM_MESSAGE",
            payload: { message: msg, teamId },
          });

          if (msgType === "code_file" || msgType === "zip" || msgType === "image") {
            const progress = socialStore.getTeamProgress(teamId);
            if (progress) {
              broadcastToAll({
                type: "TEAM_PROGRESS_UPDATED",
                payload: { teamId, progress },
              });
            }
          }
          break;
        }

        case "EDIT_TEAM_MESSAGE": {
          const { teamId, messageId, newText } = data;
          if (!teamId || !messageId || !newText) return;
          const updated = socialStore.editTeamMessage(teamId, messageId, meta.userId, newText);
          if (updated) {
            broadcastToAll({
              type: "TEAM_MESSAGE_EDITED",
              payload: { teamId, messageId, newText, message: updated },
            });
          }
          break;
        }

        case "UNSEND_TEAM_MESSAGE": {
          const { teamId, messageId } = data;
          if (!teamId || !messageId) return;
          const res = socialStore.unsendTeamMessage(teamId, messageId, meta.userId);
          if (res) {
            broadcastToAll({
              type: "TEAM_MESSAGE_UNSENT",
              payload: { teamId, messageId },
            });
          }
          break;
        }

        case "TOGGLE_TEAM_TASK": {
          const { teamId, taskId, completed } = data;
          if (!teamId || !taskId) return;
          socialStore.toggleTeamTask(teamId, taskId, completed);
          const progress = socialStore.getTeamProgress(teamId);
          if (progress) {
            broadcastToAll({
              type: "TEAM_PROGRESS_UPDATED",
              payload: { teamId, progress },
            });
          }
          break;
        }

        case "DELETE_TEAM": {
          const { teamId } = data;
          if (!teamId) return;
          socialStore.deleteTeam(teamId);
          broadcastToAll({
            type: "TEAM_DELETED",
            payload: { teamId },
          });
          break;
        }

        case "MARK_READ": {
          const partnerId = data.partnerId;
          const updatedIds = socialStore.markMessagesAsRead(meta.userId, partnerId);
          if (updatedIds.length > 0) {
            sendToUser(partnerId, {
              type: "MESSAGES_READ",
              payload: {
                readerId: meta.userId,
                partnerId: meta.userId,
                conversationId: socialStore.getConversationId(meta.userId, partnerId),
                messageIds: updatedIds,
              },
            });
            sendToUser(meta.userId, {
              type: "MESSAGES_READ",
              payload: {
                readerId: meta.userId,
                partnerId,
                conversationId: socialStore.getConversationId(meta.userId, partnerId),
                messageIds: updatedIds,
              },
            });
          }
          break;
        }

        case "SEND_CONNECT_REQUEST": {
          const { toUserId } = data;
          try {
            const result = socialStore.sendConnectionRequest(meta.userId, toUserId);
            
            // Notify target user
            sendToUser(toUserId, {
              type: "NOTIFICATION_RECEIVED",
              payload: { notification: result.notification },
            });
            sendToUser(toUserId, {
              type: "CONNECTION_REQUEST_RECEIVED",
              payload: { request: result.request, fromUser: socialStore.getUser(meta.userId) },
            });

            // Notify sender
            sendToUser(meta.userId, {
              type: "CONNECTION_STATUS_CHANGED",
              payload: { targetId: toUserId, status: "pending" },
            });
          } catch (err: any) {
            sendJson(ws, { type: "ERROR", message: err.message });
          }
          break;
        }

        case "ACCEPT_CONNECT_REQUEST": {
          const { requesterId } = data;
          try {
            const result = socialStore.acceptConnectionRequest(meta.userId, requesterId);
            const user = socialStore.getUser(meta.userId);
            const requester = socialStore.getUser(requesterId);

            // Notify requester
            sendToUser(requesterId, {
              type: "CONNECTION_ACCEPTED",
              payload: {
                partnerId: meta.userId,
                partner: user,
                notification: result.notificationForRequester,
              },
            });

            // Notify user
            sendToUser(meta.userId, {
              type: "CONNECTION_ACCEPTED",
              payload: {
                partnerId: requesterId,
                partner: requester,
              },
            });
          } catch (err: any) {
            sendJson(ws, { type: "ERROR", message: err.message });
          }
          break;
        }

        case "DECLINE_CONNECT_REQUEST": {
          const { requesterId } = data;
          try {
            socialStore.declineConnectionRequest(meta.userId, requesterId);
            sendToUser(requesterId, {
              type: "CONNECTION_DECLINED",
              payload: { targetId: meta.userId },
            });
            sendToUser(meta.userId, {
              type: "CONNECTION_STATUS_CHANGED",
              payload: { targetId: requesterId, status: "none" },
            });
          } catch (err: any) {
            sendJson(ws, { type: "ERROR", message: err.message });
          }
          break;
        }
      }
    } catch (e) {
      console.error("[WS] Message parsing error", e);
    }
  });

  ws.on("close", () => {
    const meta = clientMetaMap.get(ws);
    clientMetaMap.delete(ws);

    if (meta) {
      if (meta.activeChatPartnerId) {
        sendToUser(meta.activeChatPartnerId, {
          type: "CHAT_PRESENCE",
          payload: { userId: meta.userId, isInChat: false, isOnline: false },
        });
      }

      // Check if user has any remaining active sockets
      let hasOtherSockets = false;
      for (const [, otherMeta] of clientMetaMap.entries()) {
        if (otherMeta.userId === meta.userId) {
          hasOtherSockets = true;
          break;
        }
      }

      if (!hasOtherSockets) {
        socialStore.setUserOnline(meta.userId, false);
        broadcastToAll({
          type: "USER_PRESENCE",
          payload: { userId: meta.userId, isOnline: false },
        });
      }
    }
    console.log(`[WS] Connection closed for user: ${meta?.userId}`);
  });
});

// Vite Middleware & Static Serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            "**/data/**",
            "**/data/*",
            "**/data/social_network_db.json",
            "**/social_network_db.json",
            "**/public/uploads/**",
            "**/dist/**",
          ],
        },
      },
      appType: "spa",
      plugins: [
        {
          name: "server-ignore-db-updates",
          handleHotUpdate({ file }) {
            if (
              file.includes("social_network_db.json") ||
              file.includes("/data/") ||
              file.includes("\\data\\") ||
              file.includes("/uploads/") ||
              file.includes("\\uploads\\")
            ) {
              return [];
            }
          },
        },
      ],
    });

    // Explicitly unwatch the database and uploads directory from the file watcher
    try {
      vite.watcher.unwatch(path.join(process.cwd(), "data"));
      vite.watcher.unwatch(path.join(process.cwd(), "data", "social_network_db.json"));
      vite.watcher.unwatch(path.join(process.cwd(), "public", "uploads"));
    } catch (e) {
      console.warn("[Vite] Failed to unwatch data directory:", e);
    }

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Coding Partner Server with WebSockets active on http://0.0.0.0:${PORT}`);
  });
}

start();
