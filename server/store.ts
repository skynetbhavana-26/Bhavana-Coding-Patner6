import fs from "fs";
import path from "path";

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: string;
  bio: string;
  skills: string[];
  experienceLevel: "Junior" | "Mid-Level" | "Senior" | "Lead" | "Staff";
  rating: number;
  projectsCount: number;
  connectionsCount: number;
  location: string;
  availability: "Available" | "Busy" | "Looking for Team";
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  portfolioUrl?: string;
  platform?: string;
  version?: string;
  isOnline: boolean;
  verified?: boolean;
  lastActive: number;
}

export interface StoredMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  type: "text" | "code" | "voice" | "image" | "video";
  imageUrl?: string;
  videoUrl?: string;
  edited?: boolean;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
    type?: string;
  };
  codeSnippet?: {
    language: string;
    code: string;
  };
  voiceDuration?: string;
  timestamp: string;
  status: "sent" | "read";
  createdAt: number;
}

export interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted" | "rejected";
  timestamp: string;
  createdAt: number;
}

export interface ServerNotification {
  id: string;
  userId: string;
  type: "like" | "comment" | "message" | "connection_request" | "project_application";
  title: string;
  subtitle: string;
  time: string;
  avatar?: string;
  isRead: boolean;
  actionable?: boolean;
  requesterId?: string;
  createdAt: number;
}

export interface TeamTask {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  updatedAt: number;
}

export interface StoredTeam {
  id: string;
  name: string;
  description: string;
  projectTopic: string;
  avatar: string;
  createdBy: string;
  memberIds: string[];
  tasks: TeamTask[];
  createdAt: number;
}

export interface StoredTeamMessage {
  id: string;
  teamId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  type: "text" | "code" | "voice" | "image" | "video" | "code_file" | "zip";
  imageUrl?: string;
  videoUrl?: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  codeFile?: {
    name: string;
    language: string;
    code: string;
    size?: string;
    linesCount?: number;
  };
  zipFile?: {
    name: string;
    size: string;
    fileCount?: number;
    downloadUrl?: string;
    dataBase64?: string;
  };
  voiceDuration?: string;
  edited?: boolean;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
    type?: string;
  };
  timestamp: string;
  createdAt: number;
}

export interface AppDatabaseState {
  users: Record<string, UserAccount>;
  connections: [string, string][]; // Pairs of connected user IDs
  connectionRequests: ConnectionRequest[];
  messages: StoredMessage[];
  notifications: ServerNotification[];
  teams: StoredTeam[];
  teamMessages: StoredTeamMessage[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "social_network_db.json");

// Initial Seed Users
const INITIAL_USERS: UserAccount[] = [
  {
    id: "bhavana-01",
    name: "Bhavana",
    username: "bhavana_dev",
    email: "skynetbhavana@gmail.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    role: "Game Developer & Designer",
    bio: "Passionate developer who loves creating beautiful, high-performance web & mobile applications.",
    skills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "Python", "UI/UX", "Figma"],
    experienceLevel: "Senior",
    rating: 4.9,
    projectsCount: 12,
    connectionsCount: 0,
    location: "Bangalore, India",
    availability: "Looking for Team",
    githubUrl: "https://github.com/bhavanadev",
    linkedinUrl: "https://linkedin.com/in/bhavana-developer",
    twitterUrl: "https://twitter.com/bhavanacodes",
    portfolioUrl: "https://bhavana.dev",
    platform: "Web & Mobile",
    version: "1.0.0",
    isOnline: false,
    verified: true,
    lastActive: Date.now(),
  },
  {
    id: "latchiya-02",
    name: "Latchiya",
    username: "latchiya_dev",
    email: "latchiya@codingpartner.dev",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    role: "Full Stack & AI Systems Engineer",
    bio: "Passionate about real-time distributed microservices, WebSockets, high-concurrency systems, and AI integrations.",
    skills: ["TypeScript", "React", "Node.js", "WebSockets", "Python", "Docker", "PyTorch"],
    experienceLevel: "Senior",
    rating: 4.95,
    projectsCount: 15,
    connectionsCount: 0,
    location: "Chennai, India",
    availability: "Available",
    githubUrl: "https://github.com/latchiyadev",
    linkedinUrl: "https://linkedin.com/in/latchiya-engineer",
    twitterUrl: "https://twitter.com/latchiyacodes",
    portfolioUrl: "https://latchiya.dev",
    platform: "Full Stack & AI",
    version: "2.0.0",
    isOnline: false,
    verified: true,
    lastActive: Date.now(),
  },
  {
    id: "arjun-01",
    name: "Arjun Dev",
    username: "arjun_fullstack",
    email: "arjun@codingpartner.dev",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    role: "Full Stack Developer",
    bio: "Building scalable cloud architectures and reactive interfaces with Next.js & Go.",
    skills: ["React", "Node.js", "Python", "PostgreSQL", "Docker"],
    experienceLevel: "Senior",
    rating: 4.8,
    projectsCount: 18,
    connectionsCount: 320,
    location: "San Francisco, USA",
    availability: "Available",
    isOnline: true,
    verified: true,
    lastActive: Date.now() - 3600000,
  },
  {
    id: "priya-02",
    name: "Priya Codes",
    username: "priya_design",
    email: "priya@codingpartner.dev",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
    role: "UI/UX & Product Designer",
    bio: "Crafting fluid iOS glassmorphic designs & micro-interaction systems.",
    skills: ["UI/UX", "Figma", "Design Systems", "Tailwind", "Motion"],
    experienceLevel: "Mid-Level",
    rating: 4.9,
    projectsCount: 9,
    connectionsCount: 180,
    location: "London, UK",
    availability: "Busy",
    isOnline: true,
    verified: true,
    lastActive: Date.now() - 7200000,
  }
];

const INITIAL_TEAMS: StoredTeam[] = [
  {
    id: "team_cloud_infra",
    name: "DevSync Cloud Architecture",
    description: "Building low-latency WebSocket clustering, live state sync, and container orchestration.",
    projectTopic: "High-Concurrency Real-time Sync",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
    createdBy: "bhavana-01",
    memberIds: ["bhavana-01", "latchiya-02", "arjun-01"],
    tasks: [
      { id: "task_1", userId: "bhavana-01", title: "Implement distributed WebSocket channels", completed: true, updatedAt: Date.now() - 3600000 },
      { id: "task_2", userId: "bhavana-01", title: "Setup liquid glass progress visualizer", completed: true, updatedAt: Date.now() - 1800000 },
      { id: "task_3", userId: "bhavana-01", title: "End-to-end multi-tab session tests", completed: false, updatedAt: Date.now() },
      { id: "task_4", userId: "latchiya-02", title: "Benchmarking message throughput", completed: true, updatedAt: Date.now() - 5000000 },
      { id: "task_5", userId: "latchiya-02", title: "Implement code file syntax runner sandbox", completed: true, updatedAt: Date.now() - 1000000 },
      { id: "task_6", userId: "latchiya-02", title: "Integrate ZIP bundle extraction & downloads", completed: false, updatedAt: Date.now() },
      { id: "task_7", userId: "arjun-01", title: "Docker container deployment pipelines", completed: true, updatedAt: Date.now() - 7200000 },
      { id: "task_8", userId: "arjun-01", title: "PostgreSQL read-replica synchronization", completed: false, updatedAt: Date.now() },
    ],
    createdAt: Date.now() - 86400000,
  },
  {
    id: "team_ai_agents",
    name: "AI Code Assistant Hub",
    description: "Developing intelligent code analysis tools, real-time code runner, and project bundle visualizers.",
    projectTopic: "AI Developer Tooling",
    avatar: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&auto=format&fit=crop&q=80",
    createdBy: "latchiya-02",
    memberIds: ["latchiya-02", "bhavana-01", "priya-02"],
    tasks: [
      { id: "task_ai_1", userId: "latchiya-02", title: "Setup Gemini tokenizer & stream parsers", completed: true, updatedAt: Date.now() - 12000000 },
      { id: "task_ai_2", userId: "latchiya-02", title: "Code execution sandbox with error trapping", completed: true, updatedAt: Date.now() - 3000000 },
      { id: "task_ai_3", userId: "bhavana-01", title: "Design iOS liquid glass code viewer cards", completed: true, updatedAt: Date.now() - 4000000 },
      { id: "task_ai_4", userId: "bhavana-01", title: "Dynamic team progress calculations", completed: false, updatedAt: Date.now() },
      { id: "task_ai_5", userId: "priya-02", title: "Design responsive team update cards", completed: true, updatedAt: Date.now() - 8000000 },
    ],
    createdAt: Date.now() - 172800000,
  }
];

const INITIAL_TEAM_MESSAGES: StoredTeamMessage[] = [
  {
    id: "tmsg_1",
    teamId: "team_cloud_infra",
    senderId: "latchiya-02",
    senderName: "Latchiya",
    senderAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    text: "Welcome to the DevSync Cloud Architecture channel! Let's align on real-time channels and zip bundle exports.",
    type: "text",
    timestamp: "10:15 AM",
    createdAt: Date.now() - 7200000,
  },
  {
    id: "tmsg_2",
    teamId: "team_cloud_infra",
    senderId: "latchiya-02",
    senderName: "Latchiya",
    senderAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    text: "Here is the WebSocket channel heartbeat engine component. You can view and run it directly in the code runner:",
    type: "code_file",
    codeFile: {
      name: "ChannelManager.tsx",
      language: "typescript",
      linesCount: 28,
      size: "1.4 KB",
      code: `import React, { useState, useEffect } from 'react';

// Live WebSocket State Manager
export function ChannelManager() {
  const [activeConnections, setActiveConnections] = useState(14);
  const [latencyMs, setLatencyMs] = useState(24);

  useEffect(() => {
    const timer = setInterval(() => {
      setLatencyMs(Math.floor(18 + Math.random() * 12));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', background: '#0a0d18', color: '#fff', borderRadius: 12 }}>
      <h3 style={{ color: '#a855f7' }}>⚡ Active Channel Manager</h3>
      <p>Status: <span style={{ color: '#10b981' }}>Connected (Healthy)</span></p>
      <p>Peers Connected: <strong>{activeConnections}</strong></p>
      <p>Real-time Latency: <strong>{latencyMs}ms</strong></p>
      <button 
        style={{ padding: '8px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
        onClick={() => setActiveConnections(c => c + 1)}
      >
        Ping New Node
      </button>
    </div>
  );
}`
    },
    timestamp: "10:22 AM",
    createdAt: Date.now() - 5400000,
  },
  {
    id: "tmsg_3",
    teamId: "team_cloud_infra",
    senderId: "bhavana-01",
    senderName: "Bhavana",
    senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    text: "Awesome! I've packaged the complete microservice setup and client SDK into a project ZIP file for download:",
    type: "zip",
    zipFile: {
      name: "devsync-core-bundle-v1.zip",
      size: "2.8 MB",
      fileCount: 16,
      downloadUrl: "/uploads/devsync-core-bundle-v1.zip",
    },
    timestamp: "10:35 AM",
    createdAt: Date.now() - 3600000,
  }
];

class SocialStore {
  private state: AppDatabaseState;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): AppDatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && parsed.users) {
          // Ensure default users exist
          for (const u of INITIAL_USERS) {
            if (!parsed.users[u.id]) {
              parsed.users[u.id] = u;
            }
          }
          if (!parsed.teams || parsed.teams.length === 0) {
            parsed.teams = INITIAL_TEAMS;
          }
          if (!parsed.teamMessages || parsed.teamMessages.length === 0) {
            parsed.teamMessages = INITIAL_TEAM_MESSAGES;
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn("[DB] Failed to load db file, initializing defaults", err);
    }

    const defaultUsers: Record<string, UserAccount> = {};
    INITIAL_USERS.forEach((u) => {
      defaultUsers[u.id] = u;
    });

    return {
      users: defaultUsers,
      connections: [],
      connectionRequests: [],
      messages: [],
      notifications: [],
      teams: INITIAL_TEAMS,
      teamMessages: INITIAL_TEAM_MESSAGES,
    };
  }

  private isSaving = false;

  private persist() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      if (this.isSaving) return;
      this.isSaving = true;
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        const data = JSON.stringify(this.state, null, 2);
        fs.writeFileSync(DB_FILE, data, "utf-8");
      } catch (err) {
        console.error("[DB] Persist error", err);
      } finally {
        this.isSaving = false;
      }
    }, 300);
  }

  public getConversationId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join("___");
  }

  // Users
  public getUsers(): UserAccount[] {
    return Object.values(this.state.users);
  }

  public getUser(userId: string): UserAccount | null {
    return this.state.users[userId] || null;
  }

  public loginOrRegister(data: {
    email: string;
    name?: string;
    avatar?: string;
    role?: string;
  }): UserAccount {
    const emailNorm = (data.email || "").trim().toLowerCase();
    const nameInput = (data.name || "").trim();

    // Check if user exists by exact email, id, or username
    for (const u of Object.values(this.state.users)) {
      if (
        (emailNorm && u.email.toLowerCase() === emailNorm) ||
        (nameInput && u.name.toLowerCase() === nameInput.toLowerCase())
      ) {
        u.isOnline = true;
        u.lastActive = Date.now();
        // If avatar or role was provided and not previously customized, optionally update
        if (data.avatar && (!u.avatar || u.avatar.includes('placeholder'))) {
          u.avatar = data.avatar;
        }
        this.persist();
        return u;
      }
    }

    // Determine name and unique id dynamically
    const computedName =
      nameInput ||
      (emailNorm
        ? emailNorm.split("@")[0].charAt(0).toUpperCase() + emailNorm.split("@")[0].slice(1)
        : "Developer");
    const baseSlug = emailNorm
      ? emailNorm.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "_")
      : computedName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const id = this.state.users[baseSlug]
      ? `${baseSlug}_${Date.now().toString().slice(-4)}`
      : baseSlug;

    // Diverse fallback avatar presets
    const AVATAR_SEEDS = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    ];
    const hashIndex = Math.abs(id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % AVATAR_SEEDS.length;
    const avatar = data.avatar || AVATAR_SEEDS[hashIndex];

    const newUser: UserAccount = {
      id,
      name: computedName,
      username: baseSlug,
      email: data.email || `${baseSlug}@codingpartner.dev`,
      avatar,
      role: data.role || "Full Stack Developer",
      bio: "Passionate developer creating high-impact real-time web applications.",
      skills: ["React", "TypeScript", "Node.js", "Tailwind CSS"],
      experienceLevel: "Senior",
      rating: 4.9,
      projectsCount: 1,
      connectionsCount: 0,
      location: "Remote",
      availability: "Available",
      isOnline: true,
      verified: true,
      lastActive: Date.now(),
    };

    this.state.users[id] = newUser;
    this.persist();
    return newUser;
  }

  public setUserOnline(userId: string, isOnline: boolean) {
    if (this.state.users[userId]) {
      const prevOnline = this.state.users[userId].isOnline;
      this.state.users[userId].isOnline = isOnline;
      this.state.users[userId].lastActive = Date.now();
      if (prevOnline !== isOnline) {
        this.persist();
      }
    }
  }

  public saveUser(user: Partial<UserAccount> & { id: string }): UserAccount {
    const existing = this.state.users[user.id] || {
      id: user.id,
      name: user.name || "Developer",
      username: user.username || user.id,
      email: user.email || `${user.id}@codingpartner.dev`,
      avatar: user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      role: user.role || "Full Stack Developer",
      bio: user.bio || "",
      skills: user.skills || ["React", "TypeScript"],
      experienceLevel: "Senior",
      rating: 4.9,
      projectsCount: 1,
      connectionsCount: 0,
      location: "Remote",
      availability: "Available",
      isOnline: true,
      verified: true,
      lastActive: Date.now(),
    };

    const updated: UserAccount = {
      ...existing,
      ...user,
      lastActive: Date.now(),
    };

    this.state.users[user.id] = updated;

    // Update avatar and name across team messages if sent by this user
    if (this.state.teamMessages) {
      this.state.teamMessages.forEach((m) => {
        if (m.senderId === user.id) {
          if (user.avatar) m.senderAvatar = user.avatar;
          if (user.name) m.senderName = user.name;
        }
      });
    }

    // Update avatar and name across direct messages if sent by this user
    if (this.state.messages) {
      this.state.messages.forEach((m) => {
        if (m.senderId === user.id) {
          if (user.avatar) m.senderAvatar = user.avatar;
          if (user.name) m.senderName = user.name;
        }
      });
    }

    this.persist();
    return updated;
  }

  // Connections
  public areConnected(userId1: string, userId2: string): boolean {
    if (userId1 === userId2) return true;
    return this.state.connections.some(
      ([a, b]) => (a === userId1 && b === userId2) || (a === userId2 && b === userId1)
    );
  }

  public getConnectionStatus(viewerId: string, targetId: string): "none" | "pending" | "received" | "connected" {
    if (viewerId === targetId) return "connected";
    if (this.areConnected(viewerId, targetId)) return "connected";

    const outgoing = this.state.connectionRequests.find(
      (r) => r.fromUserId === viewerId && r.toUserId === targetId && r.status === "pending"
    );
    if (outgoing) return "pending";

    const incoming = this.state.connectionRequests.find(
      (r) => r.fromUserId === targetId && r.toUserId === viewerId && r.status === "pending"
    );
    if (incoming) return "received";

    return "none";
  }

  public getConnectedUserIds(userId: string): string[] {
    const list: string[] = [];
    for (const [a, b] of this.state.connections) {
      if (a === userId) list.push(b);
      else if (b === userId) list.push(a);
    }
    return list;
  }

  public sendConnectionRequest(fromUserId: string, toUserId: string): {
    request: ConnectionRequest;
    notification: ServerNotification;
  } {
    if (this.areConnected(fromUserId, toUserId)) {
      throw new Error("Users are already connected");
    }

    const existing = this.state.connectionRequests.find(
      (r) => r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === "pending"
    );
    if (existing) {
      // Find corresponding notification
      const notif = this.state.notifications.find((n) => n.requesterId === fromUserId && n.userId === toUserId);
      return { request: existing, notification: notif! };
    }

    const fromUser = this.getUser(fromUserId);
    const toUser = this.getUser(toUserId);
    if (!fromUser || !toUser) {
      throw new Error("Invalid user ID");
    }

    const request: ConnectionRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fromUserId,
      toUserId,
      status: "pending",
      timestamp: "Just now",
      createdAt: Date.now(),
    };
    this.state.connectionRequests.push(request);

    // Create targeted notification for toUserId
    const notification: ServerNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: toUserId,
      type: "connection_request",
      title: "New Connection Request",
      subtitle: `${fromUser.name} sent you a connection request.`,
      time: "Just now",
      avatar: fromUser.avatar,
      isRead: false,
      actionable: true,
      requesterId: fromUserId,
      createdAt: Date.now(),
    };
    this.state.notifications.unshift(notification);

    this.persist();
    return { request, notification };
  }

  public acceptConnectionRequest(userId: string, requesterId: string): {
    success: boolean;
    notificationForRequester: ServerNotification;
  } {
    const req = this.state.connectionRequests.find(
      (r) => r.fromUserId === requesterId && r.toUserId === userId && r.status === "pending"
    );
    if (req) {
      req.status = "accepted";
    }

    // Add connection pair if not present
    if (!this.areConnected(userId, requesterId)) {
      this.state.connections.push([userId, requesterId]);
    }

    // Update connections counts
    if (this.state.users[userId]) {
      this.state.users[userId].connectionsCount = this.getConnectedUserIds(userId).length;
    }
    if (this.state.users[requesterId]) {
      this.state.users[requesterId].connectionsCount = this.getConnectedUserIds(requesterId).length;
    }

    // Mark recipient's notification as non-actionable and read
    this.state.notifications.forEach((n) => {
      if (n.userId === userId && n.requesterId === requesterId && n.type === "connection_request") {
        n.actionable = false;
        n.isRead = true;
        n.subtitle = `You and ${this.getUser(requesterId)?.name || "developer"} are now connected.`;
      }
    });

    // Create confirmation notification for requester
    const currentUser = this.getUser(userId);
    const requester = this.getUser(requesterId);

    const notificationForRequester: ServerNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: requesterId,
      type: "connection_request",
      title: "Connection Accepted! 🎉",
      subtitle: `${currentUser?.name || "Developer"} accepted your connection request. You can now chat!`,
      time: "Just now",
      avatar: currentUser?.avatar,
      isRead: false,
      actionable: false,
      requesterId: userId,
      createdAt: Date.now(),
    };
    this.state.notifications.unshift(notificationForRequester);

    this.persist();
    return { success: true, notificationForRequester };
  }

  public declineConnectionRequest(userId: string, requesterId: string) {
    const req = this.state.connectionRequests.find(
      (r) => r.fromUserId === requesterId && r.toUserId === userId && r.status === "pending"
    );
    if (req) {
      req.status = "rejected";
    }
    // Remove actionable notification
    this.state.notifications = this.state.notifications.filter(
      (n) => !(n.userId === userId && n.requesterId === requesterId && n.type === "connection_request")
    );
    this.persist();
  }

  // Notifications
  public getNotificationsForUser(userId: string): ServerNotification[] {
    return this.state.notifications.filter((n) => n.userId === userId);
  }

  public markNotificationAsRead(userId: string, notifId: string) {
    this.state.notifications.forEach((n) => {
      if (n.userId === userId && n.id === notifId) {
        n.isRead = true;
      }
    });
    this.persist();
  }

  public markAllNotificationsAsRead(userId: string) {
    this.state.notifications.forEach((n) => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
    this.persist();
  }

  // Messages
  public getMessages(userId1: string, userId2: string): StoredMessage[] {
    const convId = this.getConversationId(userId1, userId2);
    return this.state.messages.filter((m) => m.conversationId === convId);
  }

  public getConversationsSummary(userId: string) {
    const connectedIds = this.getConnectedUserIds(userId);
    // Also include any user who has messages with this user
    const interactedUserIds = new Set<string>(connectedIds);
    for (const m of this.state.messages) {
      if (m.senderId === userId) interactedUserIds.add(m.recipientId);
      if (m.recipientId === userId) interactedUserIds.add(m.senderId);
    }

    const conversations = [];
    for (const partnerId of interactedUserIds) {
      const partner = this.getUser(partnerId);
      if (!partner) continue;

      const msgs = this.getMessages(userId, partnerId);
      const lastMsg = msgs[msgs.length - 1];
      const unreadCount = msgs.filter((m) => m.recipientId === userId && m.status === "sent").length;

      conversations.push({
        id: this.getConversationId(userId, partnerId),
        developer: {
          ...partner,
          connectionStatus: this.getConnectionStatus(userId, partnerId),
        },
        lastMessage: lastMsg ? (lastMsg.type === "image" ? "📷 [Image]" : lastMsg.text) : "Started connection",
        lastMessageTime: lastMsg ? lastMsg.timestamp : "Recently",
        unreadCount,
        messages: msgs.map((m) => ({
          ...m,
          isOutgoing: m.senderId === userId,
          isRead: m.status === "read",
        })),
      });
    }

    return conversations;
  }

  public addMessage(
    senderId: string,
    recipientId: string,
    text: string,
    type: "text" | "code" | "voice" | "image" | "video" = "text",
    extra?: {
      imageUrl?: string;
      videoUrl?: string;
      replyTo?: {
        id: string;
        text: string;
        senderName: string;
        type?: string;
      };
      codeSnippet?: { language: string; code: string };
      voiceDuration?: string;
      initialStatus?: "sent" | "read";
      timestamp?: string;
      createdAt?: number;
    }
  ): StoredMessage {
    const sender = this.getUser(senderId);
    const now = new Date();
    const timestamp =
      extra?.timestamp ||
      now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
    const createdAt = extra?.createdAt || Date.now();

    // Prevent duplicate video or image messages from being saved within 30 seconds
    if (extra?.videoUrl || extra?.imageUrl) {
      const existing = this.state.messages.find(
        (m) =>
          m.senderId === senderId &&
          m.recipientId === recipientId &&
          ((extra.videoUrl && m.videoUrl === extra.videoUrl) || (extra.imageUrl && m.imageUrl === extra.imageUrl)) &&
          Math.abs((m.createdAt || 0) - createdAt) < 30000
      );
      if (existing) {
        return existing;
      }
    }

    const msg: StoredMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId: this.getConversationId(senderId, recipientId),
      senderId,
      recipientId,
      senderName: sender ? sender.name : "User",
      text,
      type,
      imageUrl: extra?.imageUrl,
      videoUrl: extra?.videoUrl,
      replyTo: extra?.replyTo,
      codeSnippet: extra?.codeSnippet,
      voiceDuration: extra?.voiceDuration,
      timestamp,
      status: extra?.initialStatus || "sent",
      createdAt,
    };

    this.state.messages.push(msg);

    // If unread, also create message notification for recipient
    if (msg.status === "sent") {
      let subtitleText = text;
      if (type === "image") subtitleText = "📷 Sent an image";
      else if (type === "video") subtitleText = "🎥 Sent a video";
      else if (type === "code") subtitleText = "💻 Shared code snippet";
      else if (type === "voice") subtitleText = "🎤 Sent a voice message";

      this.state.notifications.unshift({
        id: `notif_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: recipientId,
        type: "message",
        title: `New message from ${sender?.name || "Partner"}`,
        subtitle: subtitleText,
        time: "Just now",
        avatar: sender?.avatar,
        isRead: false,
        actionable: false,
        requesterId: senderId,
        createdAt: Date.now(),
      });
    }

    this.persist();
    return msg;
  }

  public editMessage(messageId: string, senderId: string, newText: string): StoredMessage | null {
    const msg = this.state.messages.find((m) => m.id === messageId);
    if (!msg) return null;
    if (senderId && msg.senderId !== senderId && msg.senderId.toLowerCase() !== senderId.toLowerCase()) return null;
    msg.text = newText;
    msg.edited = true;
    this.persist();
    return msg;
  }

  public unsendMessage(messageId: string, senderId?: string): { success: boolean; conversationId: string; recipientId: string } | null {
    const index = this.state.messages.findIndex((m) => m.id === messageId);
    if (index === -1) return null;
    const msg = this.state.messages[index];
    if (senderId && 
        msg.senderId !== senderId && 
        msg.recipientId !== senderId &&
        msg.senderId.toLowerCase() !== senderId.toLowerCase() &&
        msg.recipientId?.toLowerCase() !== senderId.toLowerCase()) {
      return null;
    }
    const conversationId = msg.conversationId;
    const recipientId = msg.recipientId;
    this.state.messages.splice(index, 1);
    this.persist();
    return { success: true, conversationId, recipientId };
  }

  public markMessagesAsRead(viewerId: string, partnerId: string): string[] {
    const convId = this.getConversationId(viewerId, partnerId);
    const updatedIds: string[] = [];

    this.state.messages.forEach((m) => {
      // If viewer is recipient, and message was sent by partner with status 'sent', mark as 'read'
      if (m.conversationId === convId && m.recipientId === viewerId && m.status === "sent") {
        m.status = "read";
        updatedIds.push(m.id);
      }
    });

    // Mark message notifications from this partner as read
    this.state.notifications.forEach((n) => {
      if (n.userId === viewerId && n.requesterId === partnerId && n.type === "message") {
        n.isRead = true;
      }
    });

    if (updatedIds.length > 0) {
      this.persist();
    }
    return updatedIds;
  }

  // ==========================================
  // PROJECT TEAMS & COLLABORATION
  // ==========================================

  public getTeams(userId?: string): StoredTeam[] {
    if (!this.state.teams) this.state.teams = [];
    if (!userId) return this.state.teams;
    const userTeams = this.state.teams.filter((t) => t.memberIds.includes(userId));
    return userTeams.length > 0 ? userTeams : this.state.teams;
  }

  public getTeam(teamId: string): StoredTeam | undefined {
    return this.state.teams?.find((t) => t.id === teamId);
  }

  public createTeam(data: {
    name: string;
    description: string;
    projectTopic: string;
    avatar?: string;
    createdBy: string;
    memberIds: string[];
  }): StoredTeam {
    if (!this.state.teams) this.state.teams = [];
    const members = Array.from(new Set([data.createdBy, ...data.memberIds]));
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Default dynamic tasks for new team
    const initialTasks: TeamTask[] = [];
    members.forEach((mId, idx) => {
      initialTasks.push({
        id: `task_${teamId}_${idx}_1`,
        userId: mId,
        title: `Architecture spec & system setup for ${data.projectTopic || data.name}`,
        completed: true,
        updatedAt: Date.now() - 3600000,
      });
      initialTasks.push({
        id: `task_${teamId}_${idx}_2`,
        userId: mId,
        title: `Core module implementation & integration`,
        completed: false,
        updatedAt: Date.now(),
      });
      initialTasks.push({
        id: `task_${teamId}_${idx}_3`,
        userId: mId,
        title: `Unit tests, code review & ZIP bundle verification`,
        completed: false,
        updatedAt: Date.now(),
      });
    });

    const newTeam: StoredTeam = {
      id: teamId,
      name: data.name,
      description: data.description,
      projectTopic: data.projectTopic || "Software Development",
      avatar: data.avatar || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80",
      createdBy: data.createdBy,
      memberIds: members,
      tasks: initialTasks,
      createdAt: Date.now(),
    };

    this.state.teams.unshift(newTeam);

    // Add initial system greeting message
    if (!this.state.teamMessages) this.state.teamMessages = [];
    const creator = this.getUser(data.createdBy);
    this.state.teamMessages.push({
      id: `tmsg_${Date.now()}_init`,
      teamId,
      senderId: data.createdBy,
      senderName: creator?.name || "Team Lead",
      senderAvatar: creator?.avatar,
      text: `🚀 Created project team "${data.name}". Welcome everyone! Let's build together.`,
      type: "text",
      timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      createdAt: Date.now(),
    });

    this.persist();
    return newTeam;
  }

  public deleteTeam(teamId: string): boolean {
    if (!this.state.teams) return false;
    const initialLen = this.state.teams.length;
    this.state.teams = this.state.teams.filter((t) => t.id !== teamId);
    if (this.state.teamMessages) {
      this.state.teamMessages = this.state.teamMessages.filter((m) => m.teamId !== teamId);
    }
    const deleted = this.state.teams.length < initialLen;
    if (deleted) {
      this.persist();
    }
    return deleted;
  }

  public updateTeam(
    teamId: string,
    updates: {
      name?: string;
      description?: string;
      projectTopic?: string;
      memberIds?: string[];
      avatar?: string;
    }
  ): StoredTeam | null {
    if (!this.state.teams) return null;
    const team = this.state.teams.find((t) => t.id === teamId);
    if (!team) return null;

    if (updates.name !== undefined) team.name = updates.name;
    if (updates.description !== undefined) team.description = updates.description;
    if (updates.projectTopic !== undefined) team.projectTopic = updates.projectTopic;
    if (updates.avatar !== undefined) team.avatar = updates.avatar;
    if (updates.memberIds !== undefined) {
      team.memberIds = Array.from(new Set([...updates.memberIds]));
    }

    this.persist();
    return team;
  }

  public addTeamMessage(data: {
    teamId: string;
    senderId: string;
    text: string;
    type?: "text" | "code" | "voice" | "image" | "video" | "code_file" | "zip";
    imageUrl?: string;
    videoUrl?: string;
    codeSnippet?: { language: string; code: string };
    codeFile?: { name: string; language: string; code: string; size?: string; linesCount?: number };
    zipFile?: { name: string; size: string; fileCount?: number; downloadUrl?: string; dataBase64?: string };
    voiceDuration?: string;
    replyTo?: {
      id: string;
      text: string;
      senderName: string;
      type?: string;
    };
    timestamp?: string;
    createdAt?: number;
  }): StoredTeamMessage {
    if (!this.state.teamMessages) this.state.teamMessages = [];
    const sender = this.getUser(data.senderId);
    const now = new Date();
    const timestamp =
      data.timestamp ||
      now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
    const createdAt = data.createdAt || Date.now();

    // Prevent duplicate video or image messages from being saved within 30 seconds
    if (data.videoUrl || data.imageUrl) {
      const existing = this.state.teamMessages.find(
        (m) =>
          m.teamId === data.teamId &&
          m.senderId === data.senderId &&
          ((data.videoUrl && m.videoUrl === data.videoUrl) || (data.imageUrl && m.imageUrl === data.imageUrl)) &&
          Math.abs((m.createdAt || 0) - createdAt) < 30000
      );
      if (existing) {
        return existing;
      }
    }

    const msg: StoredTeamMessage = {
      id: `tmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      teamId: data.teamId,
      senderId: data.senderId,
      senderName: sender?.name || "Team Member",
      senderAvatar: sender?.avatar,
      text: data.text,
      type: data.type || "text",
      imageUrl: data.imageUrl,
      videoUrl: data.videoUrl,
      codeSnippet: data.codeSnippet,
      codeFile: data.codeFile,
      zipFile: data.zipFile,
      voiceDuration: data.voiceDuration,
      replyTo: data.replyTo,
      timestamp,
      createdAt,
    };

    this.state.teamMessages.push(msg);

    // If a code file or ZIP file was shared, record as task/activity
    const team = this.getTeam(data.teamId);
    if (team) {
      if (data.type === "code_file" && data.codeFile) {
        team.tasks.push({
          id: `task_auto_${Date.now()}`,
          userId: data.senderId,
          title: `Shared code component: ${data.codeFile.name}`,
          completed: true,
          updatedAt: Date.now(),
        });
      } else if (data.type === "zip" && data.zipFile) {
        team.tasks.push({
          id: `task_auto_${Date.now()}`,
          userId: data.senderId,
          title: `Shared project bundle: ${data.zipFile.name}`,
          completed: true,
          updatedAt: Date.now(),
        });
      }
    }

    this.persist();
    return msg;
  }

  public editTeamMessage(teamId: string, messageId: string, senderId: string, newText: string): StoredTeamMessage | null {
    if (!this.state.teamMessages) return null;
    const msg = this.state.teamMessages.find((m) => m.id === messageId && m.teamId === teamId);
    if (!msg) return null;
    if (senderId && msg.senderId !== senderId && msg.senderId.toLowerCase() !== senderId.toLowerCase()) return null;
    msg.text = newText;
    msg.edited = true;
    this.persist();
    return msg;
  }

  public unsendTeamMessage(teamId: string, messageId: string, senderId?: string): { success: boolean; teamId: string } | null {
    if (!this.state.teamMessages) return null;
    const index = this.state.teamMessages.findIndex((m) => m.id === messageId && m.teamId === teamId);
    if (index === -1) return null;
    const msg = this.state.teamMessages[index];
    if (senderId && msg.senderId !== senderId && msg.senderId.toLowerCase() !== senderId.toLowerCase()) return null;
    this.state.teamMessages.splice(index, 1);
    this.persist();
    return { success: true, teamId };
  }

  public getTeamMessages(teamId: string): StoredTeamMessage[] {
    if (!this.state.teamMessages) this.state.teamMessages = [];
    return this.state.teamMessages.filter((m) => m.teamId === teamId);
  }

  public toggleTeamTask(teamId: string, taskId: string, completed: boolean): StoredTeam | null {
    const team = this.getTeam(teamId);
    if (!team) return null;
    const task = team.tasks.find((t) => t.id === taskId);
    if (task) {
      task.completed = completed;
      task.updatedAt = Date.now();
      this.persist();
    }
    return team;
  }

  public addTeamTask(teamId: string, userId: string, title: string): StoredTeam | null {
    const team = this.getTeam(teamId);
    if (!team) return null;
    team.tasks.push({
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      userId,
      title,
      completed: false,
      updatedAt: Date.now(),
    });
    this.persist();
    return team;
  }

  public getTeamProgress(teamId: string): {
    team: StoredTeam;
    overallPercentage: number;
    completionPercentage: number;
    members: any[];
    membersProgress: any[];
    totalTasks: number;
    completedTasks: number;
    totalSharedFiles: number;
  } | null {
    const team = this.getTeam(teamId);
    if (!team) return null;

    const messages = this.getTeamMessages(teamId);

    const membersProgress = team.memberIds.map((mId) => {
      const user = this.getUser(mId);
      const userTasks = team.tasks.filter((t) => t.userId === mId);
      const completedTasks = userTasks.filter((t) => t.completed);

      // Files and Code shared by this user
      const userMessages = messages.filter((m) => m.senderId === mId);
      const sharedFiles: { id: string; name: string; type: 'code' | 'zip' | 'image' | 'file'; time: string; url?: string }[] = [];

      userMessages.forEach((m) => {
        if (m.type === "code_file" && m.codeFile) {
          sharedFiles.push({
            id: m.id,
            name: m.codeFile.name,
            type: "code",
            time: m.timestamp,
          });
        } else if (m.type === "zip" && m.zipFile) {
          sharedFiles.push({
            id: m.id,
            name: m.zipFile.name,
            type: "zip",
            time: m.timestamp,
            url: m.zipFile.downloadUrl,
          });
        } else if (m.type === "image" && m.imageUrl) {
          sharedFiles.push({
            id: m.id,
            name: "Project Design Asset",
            type: "image",
            time: m.timestamp,
            url: m.imageUrl,
          });
        }
      });

      // Recent activities
      const recentActivities: { id: string; text: string; time: string }[] = [];
      completedTasks.slice(-3).forEach((t) => {
        recentActivities.push({
          id: t.id,
          text: `Completed: ${t.title}`,
          time: "Recently",
        });
      });
      sharedFiles.slice(-2).forEach((f) => {
        recentActivities.push({
          id: f.id,
          text: `Shared ${f.type.toUpperCase()}: ${f.name}`,
          time: f.time,
        });
      });

      // Dynamic calculation of percentage based on completed tasks & deliverables
      const totalWeight = Math.max(userTasks.length + sharedFiles.length, 1);
      const completedCount = completedTasks.length + sharedFiles.length;
      const rawPct = Math.round((completedCount / totalWeight) * 100);
      const completionPercentage = Math.min(100, Math.max(0, rawPct));

      const activeTask = userTasks.find((t) => !t.completed);

      return {
        userId: mId,
        name: user?.name || "Developer",
        userName: user?.name || "Developer",
        avatar: user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
        role: user?.role || "Team Developer",
        currentTask: activeTask ? activeTask.title : (userTasks.length > 0 ? "All sprint tasks completed" : "Ready for tasks"),
        completedTasksCount: completedTasks.length,
        totalTasksCount: userTasks.length,
        completionPercentage,
        tasks: userTasks,
        sharedFiles,
        recentActivities,
      };
    });

    const totalPct = membersProgress.reduce((acc, m) => acc + m.completionPercentage, 0);
    const overallPercentage = Math.round(totalPct / Math.max(membersProgress.length, 1));
    const totalTasks = team.tasks.length;
    const completedTasks = team.tasks.filter((t) => t.completed).length;
    const totalSharedFiles = messages.filter((m) => m.type === "code_file" || m.type === "zip" || m.type === "image").length;

    return {
      team,
      overallPercentage,
      completionPercentage: overallPercentage,
      members: membersProgress,
      membersProgress,
      totalTasks,
      completedTasks,
      totalSharedFiles,
    };
  }
}

export const socialStore = new SocialStore();
