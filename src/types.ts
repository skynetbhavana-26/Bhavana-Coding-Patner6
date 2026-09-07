export type TabType = 'home' | 'explore' | 'projects' | 'messages' | 'profile';

export type ScreenType = 
  | 'splash'
  | 'onboarding'
  | 'auth'
  | 'main'
  | 'chat'
  | 'project_chat'
  | 'ai_chat'
  | 'notifications'
  | 'settings'
  | 'create_post'
  | 'developer_detail'
  | 'workspace';

export interface Developer {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: string;
  bio: string;
  skills: string[];
  experienceLevel: 'Junior' | 'Mid-Level' | 'Senior' | 'Lead' | 'Staff';
  rating: number;
  projectsCount: number;
  connectionsCount: number;
  location: string;
  availability: 'Available' | 'Busy' | 'Looking for Team';
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  portfolioUrl?: string;
  platform?: string;
  version?: string;
  isOnline: boolean;
  connectionStatus: 'none' | 'pending' | 'received' | 'connected';
  verified?: boolean;
  email?: string;
  lastActive?: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  requiredRoles: string[];
  deadline: string;
  teamSize: number;
  currentMembers: number;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  projectType: 'Full Time' | 'Part Time' | 'Open Source';
  createdAt: string;
  starsCount?: number;
  imageUrl?: string;
}

export interface CodeFileAttachment {
  name: string;
  fileName?: string;
  language: string;
  code: string;
  size?: string;
  linesCount?: number;
  uploadedAt?: string;
}

export interface ZipFileAttachment {
  name: string;
  fileName?: string;
  size: string;
  fileSize?: string;
  fileCount?: number;
  downloadUrl?: string;
  dataBase64?: string;
  uploadedAt?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId?: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  isOutgoing: boolean;
  type?: 'text' | 'code' | 'voice' | 'image' | 'video' | 'code_file' | 'zip';
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
  codeFile?: CodeFileAttachment;
  zipFile?: ZipFileAttachment;
  teamId?: string;
  voiceDuration?: string;
  reactions?: { emoji: string; count: number; active: boolean }[];
  isRead?: boolean;
  status?: 'sent' | 'read';
  createdAt?: number;
  isUploading?: boolean;
  uploadProgress?: number;
}

export interface TeamTask {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  updatedAt: number;
}

export interface ProjectTeam {
  id: string;
  name: string;
  description: string;
  projectTopic: string;
  avatar: string;
  createdBy: string;
  members: Developer[];
  tasks?: TeamTask[];
  completionPercentage?: number;
  createdAt: number;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface TeamMemberProgress {
  userId: string;
  name: string;
  userName?: string;
  avatar: string;
  role: string;
  currentTask: string;
  completedTasksCount: number;
  totalTasksCount: number;
  completionPercentage: number;
  tasks: TeamTask[];
  sharedFiles: {
    id?: string;
    name: string;
    type: 'code' | 'zip' | 'image' | 'file';
    time?: string;
    url?: string;
    codeSnippet?: string;
  }[];
  recentActivities?: { id: string; text: string; time: string }[];
}

export interface Conversation {
  id: string;
  developer: Developer;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export interface AppNotification {
  id: string;
  type: 'like' | 'comment' | 'message' | 'connection_request' | 'project_application';
  title: string;
  subtitle: string;
  time: string;
  avatar?: string;
  isRead: boolean;
  actionable?: boolean;
  requesterId?: string;
}

export interface FeedPost {
  id: string;
  author: Developer;
  content: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  tags: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
  timeAgo: string;
}

export interface WorkspaceTask {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  assignee: string;
  priority: 'High' | 'Medium' | 'Low';
}
