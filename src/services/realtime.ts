import { Developer, ChatMessage, Conversation, AppNotification, ProjectTeam, TeamMemberProgress } from "../types";

export interface RealtimeCallbacks {
  onInitState?: (data: { user: Developer; notifications: AppNotification[]; conversations: Conversation[] }) => void;
  onNewMessage?: (message: ChatMessage) => void;
  onMessageSent?: (message: ChatMessage) => void;
  onMessageEdited?: (message: ChatMessage) => void;
  onMessageUnsent?: (data: { messageId: string; conversationId: string }) => void;
  onMessagesRead?: (data: { readerId: string; partnerId: string; conversationId: string; messageIds: string[] }) => void;
  onNotificationReceived?: (notification: AppNotification) => void;
  onConnectionRequestReceived?: (data: { request: any; fromUser: Developer }) => void;
  onConnectionAccepted?: (data: { partnerId: string; partner: Developer; notification?: AppNotification }) => void;
  onConnectionDeclined?: (data: { targetId: string }) => void;
  onConnectionStatusChanged?: (data: { targetId: string; status: 'none' | 'pending' | 'received' | 'connected' }) => void;
  onUserPresence?: (data: { userId: string; isOnline: boolean }) => void;
  onChatPresence?: (data: { userId: string; isInChat: boolean; isOnline: boolean }) => void;
  onUserUpdated?: (data: { user: Developer }) => void;
  onNewTeamMessage?: (data: { message: ChatMessage; teamId: string }) => void;
  onTeamMessageEdited?: (data: { teamId: string; messageId: string; newText: string; message: any }) => void;
  onTeamMessageUnsent?: (data: { teamId: string; messageId: string }) => void;
  onTeamCreated?: (data: { team: ProjectTeam }) => void;
  onTeamUpdated?: (data: { team: ProjectTeam }) => void;
  onTeamDeleted?: (data: { teamId: string }) => void;
  onTeamProgressUpdated?: (data: { teamId: string; progress: any }) => void;
}

class RealtimeClient {
  private ws: WebSocket | null = null;
  private currentUserId: string | null = null;
  private callbacks: RealtimeCallbacks = {};
  private reconnectTimer: any = null;
  private activePartnerId: string | null = null;
  private isExplicitlyClosed = false;

  public connect(userId: string, callbacks: RealtimeCallbacks) {
    this.currentUserId = userId;
    this.callbacks = callbacks;
    this.isExplicitlyClosed = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?userId=${encodeURIComponent(userId)}`;

    console.log(`[WS-Client] Connecting to ${wsUrl}`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`[WS-Client] Connected as user: ${userId}`);
        if (this.activePartnerId) {
          this.enterChat(this.activePartnerId);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleEvent(data);
        } catch (err) {
          console.error("[WS-Client] Failed to parse event", err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn("[WS-Client] Error occurred", err);
      };

      this.ws.onclose = () => {
        console.log("[WS-Client] Disconnected");
        if (!this.isExplicitlyClosed) {
          this.reconnectTimer = setTimeout(() => {
            if (this.currentUserId && !this.isExplicitlyClosed) {
              console.log("[WS-Client] Attempting reconnect...");
              this.connect(this.currentUserId, this.callbacks);
            }
          }, 2000);
        }
      };
    } catch (err) {
      console.error("[WS-Client] Connection setup error", err);
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("[WS-Client] Cannot send, socket not open");
    }
  }

  public enterChat(partnerId: string) {
    this.activePartnerId = partnerId;
    this.send({ type: "ENTER_CHAT", partnerId });
  }

  public leaveChat() {
    this.activePartnerId = null;
    this.send({ type: "LEAVE_CHAT" });
  }

  public sendMessage(
    recipientId: string,
    text: string,
    msgType: "text" | "code" | "voice" | "image" | "video" | "code_file" | "zip" = "text",
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
      codeFile?: any;
      zipFile?: any;
      voiceDuration?: string;
      timestamp?: string;
      createdAt?: number;
    }
  ) {
    const now = new Date();
    const currentTimestamp =
      extra?.timestamp ||
      now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
    const createdAt = extra?.createdAt || now.getTime();

    this.send({
      type: "SEND_MESSAGE",
      recipientId,
      text,
      msgType,
      imageUrl: extra?.imageUrl,
      videoUrl: extra?.videoUrl,
      replyTo: extra?.replyTo,
      codeSnippet: extra?.codeSnippet,
      codeFile: extra?.codeFile,
      zipFile: extra?.zipFile,
      voiceDuration: extra?.voiceDuration,
      timestamp: currentTimestamp,
      createdAt,
    });
  }

  public editMessage(messageId: string, newText: string) {
    this.send({
      type: "EDIT_MESSAGE",
      messageId,
      newText,
    });
  }

  public unsendMessage(messageId: string) {
    this.send({
      type: "UNSEND_MESSAGE",
      messageId,
    });
  }

  public sendTeamMessage(
    teamId: string,
    text: string,
    msgType: "text" | "code" | "voice" | "image" | "video" | "code_file" | "zip" = "text",
    extra?: {
      imageUrl?: string;
      videoUrl?: string;
      replyTo?: any;
      codeSnippet?: { language: string; code: string };
      codeFile?: any;
      zipFile?: any;
      voiceDuration?: string;
      timestamp?: string;
      createdAt?: number;
    }
  ) {
    const now = new Date();
    const currentTimestamp =
      extra?.timestamp ||
      now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
    const createdAt = extra?.createdAt || now.getTime();

    this.send({
      type: "SEND_TEAM_MESSAGE",
      teamId,
      text,
      msgType,
      imageUrl: extra?.imageUrl,
      videoUrl: extra?.videoUrl,
      replyTo: extra?.replyTo,
      codeSnippet: extra?.codeSnippet,
      codeFile: extra?.codeFile,
      zipFile: extra?.zipFile,
      voiceDuration: extra?.voiceDuration,
      timestamp: currentTimestamp,
      createdAt,
    });
  }

  public editTeamMessage(teamId: string, messageId: string, newText: string) {
    this.send({
      type: "EDIT_TEAM_MESSAGE",
      teamId,
      messageId,
      newText,
    });
  }

  public unsendTeamMessage(teamId: string, messageId: string) {
    this.send({
      type: "UNSEND_TEAM_MESSAGE",
      teamId,
      messageId,
    });
  }

  public toggleTeamTask(teamId: string, taskId: string, completed: boolean) {
    this.send({
      type: "TOGGLE_TEAM_TASK",
      teamId,
      taskId,
      completed,
    });
  }

  public deleteTeam(teamId: string) {
    this.send({
      type: "DELETE_TEAM",
      teamId,
    });
  }

  public markRead(partnerId: string) {
    this.send({ type: "MARK_READ", partnerId });
  }

  public sendConnectRequest(toUserId: string) {
    this.send({ type: "SEND_CONNECT_REQUEST", toUserId });
  }

  public acceptConnectRequest(requesterId: string) {
    this.send({ type: "ACCEPT_CONNECT_REQUEST", requesterId });
  }

  public declineConnectRequest(requesterId: string) {
    this.send({ type: "DECLINE_CONNECT_REQUEST", requesterId });
  }

  private handleEvent(data: any) {
    switch (data.type) {
      case "INIT_STATE":
        this.callbacks.onInitState?.(data.payload);
        break;
      case "NEW_MESSAGE":
        this.callbacks.onNewMessage?.(data.payload.message);
        break;
      case "MESSAGE_SENT":
        this.callbacks.onMessageSent?.(data.payload.message);
        break;
      case "MESSAGE_EDITED":
        this.callbacks.onMessageEdited?.(data.payload.message);
        break;
      case "MESSAGE_UNSENT":
        this.callbacks.onMessageUnsent?.(data.payload);
        break;
      case "MESSAGES_READ":
        this.callbacks.onMessagesRead?.(data.payload);
        break;
      case "NOTIFICATION_RECEIVED":
        this.callbacks.onNotificationReceived?.(data.payload.notification);
        break;
      case "CONNECTION_REQUEST_RECEIVED":
        this.callbacks.onConnectionRequestReceived?.(data.payload);
        break;
      case "CONNECTION_ACCEPTED":
        this.callbacks.onConnectionAccepted?.(data.payload);
        break;
      case "CONNECTION_DECLINED":
        this.callbacks.onConnectionDeclined?.(data.payload);
        break;
      case "CONNECTION_STATUS_CHANGED":
        this.callbacks.onConnectionStatusChanged?.(data.payload);
        break;
      case "USER_PRESENCE":
        this.callbacks.onUserPresence?.(data.payload);
        break;
      case "CHAT_PRESENCE":
        this.callbacks.onChatPresence?.(data.payload);
        break;
      case "USER_UPDATED":
        this.callbacks.onUserUpdated?.(data.payload);
        break;
      case "NEW_TEAM_MESSAGE":
        this.callbacks.onNewTeamMessage?.(data.payload);
        break;
      case "TEAM_MESSAGE_EDITED":
        this.callbacks.onTeamMessageEdited?.(data.payload);
        break;
      case "TEAM_MESSAGE_UNSENT":
        this.callbacks.onTeamMessageUnsent?.(data.payload);
        break;
      case "TEAM_CREATED":
        this.callbacks.onTeamCreated?.(data.payload);
        break;
      case "TEAM_UPDATED":
        this.callbacks.onTeamUpdated?.(data.payload);
        break;
      case "TEAM_DELETED":
        this.callbacks.onTeamDeleted?.(data.payload);
        break;
      case "TEAM_PROGRESS_UPDATED":
        this.callbacks.onTeamProgressUpdated?.(data.payload);
        break;
    }
  }
}

export const realtimeClient = new RealtimeClient();

// ==================== REST API CLIENT ====================

export async function fetchUsersApi(viewerId: string): Promise<Developer[]> {
  try {
    const res = await fetch(`/api/users?viewerId=${encodeURIComponent(viewerId)}`);
    const data = await res.json();
    if (data.success) {
      return data.users;
    }
  } catch (e) {
    console.warn("fetchUsersApi error", e);
  }
  return [];
}

export async function fetchNotificationsApi(userId: string): Promise<AppNotification[]> {
  try {
    const res = await fetch(`/api/notifications/${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (data.success) {
      return data.notifications;
    }
  } catch (e) {
    console.warn("fetchNotificationsApi error", e);
  }
  return [];
}

export async function fetchConversationsApi(userId: string): Promise<Conversation[]> {
  try {
    const res = await fetch(`/api/conversations/${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (data.success) {
      return data.conversations;
    }
  } catch (e) {
    console.warn("fetchConversationsApi error", e);
  }
  return [];
}

export async function sendConnectRequestApi(fromUserId: string, toUserId: string) {
  const res = await fetch("/api/connections/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromUserId, toUserId }),
  });
  return res.json();
}

export async function acceptConnectRequestApi(userId: string, requesterId: string) {
  const res = await fetch("/api/connections/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, requesterId }),
  });
  return res.json();
}

export async function declineConnectRequestApi(userId: string, requesterId: string) {
  const res = await fetch("/api/connections/decline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, requesterId }),
  });
  return res.json();
}

export async function loginOrRegisterApi(params: {
  email: string;
  name?: string;
  avatar?: string;
  role?: string;
}): Promise<Developer | null> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (data.success && data.user) {
      return data.user;
    }
  } catch (e) {
    console.warn("loginOrRegisterApi error", e);
  }
  return null;
}

export async function updateUserProfileApi(user: Developer): Promise<Developer | null> {
  try {
    const res = await fetch(`/api/user/${encodeURIComponent(user.id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    const data = await res.json();
    if (data.success && data.user) {
      return data.user;
    }
  } catch (e) {
    console.warn("updateUserProfileApi error", e);
  }
  return null;
}

export async function uploadFileOrMediaApi(params: {
  fileData?: string;
  image?: string;
  filename?: string;
}): Promise<{ success: boolean; url: string; filename: string; size: number } | null> {
  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (data.success) {
      return data;
    }
  } catch (e) {
    console.warn("uploadFileOrMediaApi error", e);
  }
  return null;
}

export async function fetchTeamsApi(userId?: string): Promise<ProjectTeam[]> {
  try {
    const url = userId ? `/api/teams?userId=${encodeURIComponent(userId)}` : "/api/teams";
    const res = await fetch(url);
    const data = await res.json();
    if (data.success && Array.isArray(data.teams)) {
      return data.teams;
    }
  } catch (e) {
    console.warn("fetchTeamsApi error", e);
  }
  return [];
}

export async function fetchTeamApi(id: string): Promise<ProjectTeam | null> {
  try {
    const res = await fetch(`/api/teams/${encodeURIComponent(id)}`);
    const data = await res.json();
    if (data.success && data.team) {
      return data.team;
    }
  } catch (e) {
    console.warn("fetchTeamApi error", e);
  }
  return null;
}

export async function createTeamApi(teamData: {
  name: string;
  description?: string;
  projectTopic?: string;
  avatar?: string;
  createdBy: string;
  memberIds?: string[];
}): Promise<ProjectTeam | null> {
  try {
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(teamData),
    });
    const data = await res.json();
    if (data.success && data.team) {
      return data.team;
    }
  } catch (e) {
    console.warn("createTeamApi error", e);
  }
  return null;
}

export async function deleteTeamApi(teamId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/teams/${encodeURIComponent(teamId)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return !!data.success;
  } catch (e) {
    console.warn("deleteTeamApi error", e);
  }
  return false;
}

export async function updateTeamApi(
  teamId: string,
  teamData: { name?: string; projectTopic?: string; description?: string; memberIds?: string[] }
): Promise<ProjectTeam | null> {
  try {
    const res = await fetch(`/api/teams/${encodeURIComponent(teamId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(teamData),
    });
    const data = await res.json();
    if (data.success && data.team) {
      return data.team;
    }
  } catch (e) {
    console.warn("updateTeamApi error", e);
  }
  return null;
}

export async function fetchTeamMessagesApi(teamId: string): Promise<ChatMessage[]> {
  try {
    const res = await fetch(`/api/teams/${encodeURIComponent(teamId)}/messages`);
    const data = await res.json();
    if (data.success && Array.isArray(data.messages)) {
      return data.messages;
    }
  } catch (e) {
    console.warn("fetchTeamMessagesApi error", e);
  }
  return [];
}

export async function fetchTeamProgressApi(teamId: string): Promise<{
  team: ProjectTeam;
  completionPercentage: number;
  membersProgress: TeamMemberProgress[];
  totalTasks: number;
  completedTasks: number;
  totalSharedFiles: number;
} | null> {
  try {
    const res = await fetch(`/api/teams/${encodeURIComponent(teamId)}/progress`);
    const data = await res.json();
    if (data.success) {
      return {
        team: data.team,
        completionPercentage: data.completionPercentage ?? data.overallPercentage ?? 0,
        membersProgress: data.membersProgress ?? data.members ?? [],
        totalTasks: data.totalTasks ?? 0,
        completedTasks: data.completedTasks ?? 0,
        totalSharedFiles: data.totalSharedFiles ?? 0,
      };
    }
  } catch (e) {
    console.warn("fetchTeamProgressApi error", e);
  }
  return null;
}

export async function toggleTeamTaskApi(teamId: string, taskId: string, completed: boolean) {
  try {
    const res = await fetch(`/api/teams/${encodeURIComponent(teamId)}/tasks/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, completed }),
    });
    return await res.json();
  } catch (e) {
    console.warn("toggleTeamTaskApi error", e);
  }
  return null;
}

export async function addTeamTaskApi(teamId: string, userId: string, title: string) {
  try {
    const res = await fetch(`/api/teams/${encodeURIComponent(teamId)}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, title }),
    });
    return await res.json();
  } catch (e) {
    console.warn("addTeamTaskApi error", e);
  }
  return null;
}

export async function editMessageApi(messageId: string, senderId: string, newText: string) {
  try {
    const res = await fetch(`/api/messages/${encodeURIComponent(messageId)}/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId, newText }),
    });
    return await res.json();
  } catch (e) {
    console.warn("editMessageApi error", e);
  }
  return null;
}

export async function unsendMessageApi(messageId: string, senderId: string) {
  try {
    const res = await fetch(`/api/messages/${encodeURIComponent(messageId)}/unsend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId }),
    });
    return await res.json();
  } catch (e) {
    console.warn("unsendMessageApi error", e);
  }
  return null;
}

export async function editTeamMessageApi(teamId: string, messageId: string, senderId: string, newText: string) {
  try {
    const res = await fetch(`/api/teams/${encodeURIComponent(teamId)}/messages/${encodeURIComponent(messageId)}/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId, newText }),
    });
    return await res.json();
  } catch (e) {
    console.warn("editTeamMessageApi error", e);
  }
  return null;
}

export async function unsendTeamMessageApi(teamId: string, messageId: string, senderId: string) {
  try {
    const res = await fetch(`/api/teams/${encodeURIComponent(teamId)}/messages/${encodeURIComponent(messageId)}/unsend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId }),
    });
    return await res.json();
  } catch (e) {
    console.warn("unsendTeamMessageApi error", e);
  }
  return null;
}

export async function askAiApi(
  message: string,
  history?: { role: "user" | "model"; text: string }[]
): Promise<{ success: boolean; reply: string; error?: string }> {
  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });
    const data = await res.json();
    return data;
  } catch (e: any) {
    console.warn("askAiApi error", e);
    return {
      success: false,
      reply: "I had trouble connecting with the AI engine. Please check your connection and try again.",
      error: e.message,
    };
  }
}


