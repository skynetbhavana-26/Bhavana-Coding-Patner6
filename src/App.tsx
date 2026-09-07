import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, Monitor, Sparkles, Moon, Sun, RotateCcw, 
  Layers, CheckCircle, Bell, MessageSquare, Users, ExternalLink, User 
} from 'lucide-react';

import { 
  TabType, ScreenType, Developer, Project, ChatMessage, 
  Conversation, AppNotification, FeedPost, WorkspaceTask, ProjectTeam 
} from './types';

import { 
  INITIAL_CURRENT_USER, DEVELOPERS_DATABASE, INITIAL_PROJECTS, 
  INITIAL_CHAT_MESSAGES, INITIAL_CONVERSATIONS, INITIAL_NOTIFICATIONS, 
  INITIAL_FEED_POSTS, INITIAL_WORKSPACE_TASKS 
} from './data/mockData';

import { SplashScreen } from './components/SplashScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { AuthScreen } from './components/AuthScreen';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { DiscoverScreen } from './components/DiscoverScreen';
import { ProjectsScreen } from './components/ProjectsScreen';
import { ConversationsListScreen } from './components/ConversationsListScreen';
import { ChatScreen } from './components/ChatScreen';
import { ProjectChatScreen } from './components/ProjectChatScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { EditProfileModal } from './components/EditProfileModal';
import { NotificationsScreen } from './components/NotificationsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { CreatePostScreen } from './components/CreatePostScreen';
import { DeveloperCardModal } from './components/DeveloperCardModal';
import { WorkspaceModal } from './components/WorkspaceModal';
import { AiChatScreen } from './components/AiChatScreen';
import { AiAskMeButton } from './components/AiAskMeButton';

import { 
  realtimeClient, 
  fetchUsersApi, 
  fetchNotificationsApi, 
  fetchConversationsApi,
  sendConnectRequestApi,
  acceptConnectRequestApi,
  declineConnectRequestApi,
  loginOrRegisterApi,
  updateUserProfileApi,
  fetchTeamsApi,
  createTeamApi,
  deleteTeamApi,
  updateTeamApi,
  fetchTeamMessagesApi,
  editMessageApi,
  unsendMessageApi,
  editTeamMessageApi,
  unsendTeamMessageApi
} from './services/realtime';

// Default initial account template
const DEFAULT_ACCOUNT: Developer = {
  id: 'bhavana-01',
  name: 'Bhavana',
  username: 'bhavana_dev',
  email: 'skynetbhavana@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  role: 'Game Developer & Designer',
  bio: 'Passionate developer creating high-speed interactive web and mobile experiences.',
  skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Python', 'UI/UX', 'Figma'],
  experienceLevel: 'Senior',
  rating: 4.9,
  projectsCount: 12,
  connectionsCount: 0,
  location: 'Bangalore, India',
  availability: 'Looking for Team',
  githubUrl: 'https://github.com/bhavanadev',
  linkedinUrl: 'https://linkedin.com/in/bhavana-developer',
  twitterUrl: 'https://twitter.com/bhavanacodes',
  portfolioUrl: 'https://bhavana.dev',
  platform: 'Web & Mobile',
  version: '1.0.0',
  isOnline: true,
  connectionStatus: 'connected',
  verified: true,
};

// Resolver for current tab's active session
function resolveInitialUser(): Developer {
  if (typeof window === 'undefined') return DEFAULT_ACCOUNT;

  const urlParams = new URLSearchParams(window.location.search);
  const userParam = urlParams.get('user');

  if (userParam) {
    const p = userParam.toLowerCase();
    const match = DEVELOPERS_DATABASE.find(
      (d) => d.id.toLowerCase() === p || d.name.toLowerCase() === p || d.username.toLowerCase() === p
    );
    if (match) {
      sessionStorage.setItem('coding_partner_logged_in_user', JSON.stringify(match));
      return match;
    }
    const cleanId = p.replace(/[^a-z0-9]/g, '_');
    const dynamicFromParam: Developer = {
      id: cleanId,
      name: userParam.charAt(0).toUpperCase() + userParam.slice(1),
      username: cleanId,
      email: `${cleanId}@gmail.com`,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      role: 'Full Stack Developer',
      bio: 'Passionate developer building real-time collaboration experiences.',
      skills: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS'],
      experienceLevel: 'Senior',
      rating: 4.9,
      projectsCount: 1,
      connectionsCount: 0,
      location: 'Remote',
      availability: 'Available',
      isOnline: true,
      verified: true,
      lastActive: Date.now(),
      connectionStatus: 'connected',
    };
    sessionStorage.setItem('coding_partner_logged_in_user', JSON.stringify(dynamicFromParam));
    return dynamicFromParam;
  }

  // Check isolated sessionStorage for this window/tab
  const sessionSaved = sessionStorage.getItem('coding_partner_logged_in_user');
  if (sessionSaved) {
    try {
      const parsed = JSON.parse(sessionSaved);
      if (parsed && parsed.id) {
        const storedAvatar = localStorage.getItem(`coding_partner_avatar_${parsed.id}`);
        if (storedAvatar) parsed.avatar = storedAvatar;
        return parsed;
      }
    } catch (e) {}
  }

  // Check localStorage
  const localSaved = localStorage.getItem('coding_partner_logged_in_user');
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      if (parsed && parsed.id) {
        const storedAvatar = localStorage.getItem(`coding_partner_avatar_${parsed.id}`);
        if (storedAvatar) parsed.avatar = storedAvatar;
        return parsed;
      }
    } catch (e) {}
  }

  // Default initial active user
  const initial = { ...DEFAULT_ACCOUNT };
  const storedDefaultAvatar = localStorage.getItem(`coding_partner_avatar_${initial.id}`);
  if (storedDefaultAvatar) initial.avatar = storedDefaultAvatar;
  sessionStorage.setItem('coding_partner_logged_in_user', JSON.stringify(initial));
  return initial;
}

export default function App() {
  // Screen and Tab state
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isDeviceFrame, setIsDeviceFrame] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Tab/Window isolated session state - automatically identifies currently logged-in account
  const [currentUser, setCurrentUser] = useState<Developer>(resolveInitialUser);

  // Community Developers state - merges registered profiles with initial community developers
  const [developers, setDevelopers] = useState<Developer[]>(() => {
    try {
      const savedProfilesRaw = localStorage.getItem('coding_partner_saved_profiles');
      if (savedProfilesRaw) {
        const savedProfiles: any[] = JSON.parse(savedProfilesRaw);
        const savedDevs: Developer[] = savedProfiles.map((p) => ({
          id: p.id,
          name: p.name,
          username: p.username || p.name.toLowerCase().replace(/\s+/g, '_'),
          role: p.role || 'Full Stack Engineer',
          avatar: p.avatar,
          bio: p.bio || 'Coding Partner member',
          skills: p.skills || ['TypeScript', 'React', 'Node.js'],
          experienceLevel: p.experienceLevel || 'Senior',
          rating: p.rating || 4.9,
          projectsCount: p.projectsCount || 8,
          connectionsCount: p.connectionsCount || 24,
          location: p.location || 'Remote',
          availability: p.availability || 'Available',
          connectionStatus: p.connectionStatus || 'connected',
          isOnline: true,
          email: p.email || '',
        }));

        const combined = [...savedDevs];
        DEVELOPERS_DATABASE.forEach((d) => {
          if (!combined.some((c) => c.id === d.id || c.name.toLowerCase() === d.name.toLowerCase())) {
            combined.push(d);
          }
        });
        return combined;
      }
    } catch (e) {}
    return DEVELOPERS_DATABASE;
  });

  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>(INITIAL_FEED_POSTS);
  const [workspaceTasks, setWorkspaceTasks] = useState<WorkspaceTask[]>(INITIAL_WORKSPACE_TASKS);

  // Project Teams state
  const [teams, setTeams] = useState<ProjectTeam[]>([]);
  const [activeTeam, setActiveTeam] = useState<ProjectTeam | null>(null);
  const [teamMessages, setTeamMessages] = useState<Record<string, ChatMessage[]>>({});

  // Active chat partner
  const [activeChatPartner, setActiveChatPartner] = useState<Developer>(() => {
    return (
      DEVELOPERS_DATABASE.find((d) => d.id !== currentUser.id) ||
      DEVELOPERS_DATABASE[0] ||
      currentUser
    );
  });

  // Modal states
  const [selectedDeveloperForModal, setSelectedDeveloperForModal] = useState<Developer | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-updating local time clock
  const [currentLocalTime, setCurrentLocalTime] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentLocalTime(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Automatic identification and login for the current account
  const handleAuthSuccess = (user: Developer) => {
    const customAvatar = localStorage.getItem(`coding_partner_avatar_${user.id}`);
    const resolvedUser = customAvatar ? { ...user, avatar: customAvatar } : user;
    sessionStorage.setItem('coding_partner_logged_in_user', JSON.stringify(resolvedUser));
    localStorage.setItem('coding_partner_logged_in_user', JSON.stringify(resolvedUser));
    setCurrentUser(resolvedUser);

    // Pick appropriate active partner dynamically
    const otherDev =
      developers.find((d) => d.id !== user.id) ||
      DEVELOPERS_DATABASE.find((d) => d.id !== user.id) ||
      resolvedUser;
    setActiveChatPartner(otherDev);

    setCurrentScreen('main');
    setActiveTab('home');
    showToast(`Logged in as ${resolvedUser.name}`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('coding_partner_logged_in_user');
    localStorage.removeItem('coding_partner_logged_in_user');
    setCurrentScreen('auth');
    showToast('Logged out successfully');
  };

  // Real-Time WebSocket & Server Synchronization Lifecycle
  useEffect(() => {
    sessionStorage.setItem('coding_partner_logged_in_user', JSON.stringify(currentUser));

    // 1. Initial REST API Hydration
    fetchUsersApi(currentUser.id).then((users) => {
      if (users && users.length > 0) {
        const mappedUsers = users.map((u) => {
          const userAvatar = localStorage.getItem(`coding_partner_avatar_${u.id}`);
          return userAvatar ? { ...u, avatar: userAvatar } : u;
        });
        setDevelopers(mappedUsers);
        // If current user is in server list, sync updated profile info
        const me = mappedUsers.find((u) => u.id === currentUser.id);
        if (me) {
          setCurrentUser((prev) => ({ ...prev, ...me }));
        }
      }
    });

    fetchNotificationsApi(currentUser.id).then((notifs) => {
      if (notifs) setNotifications(notifs);
    });

    fetchConversationsApi(currentUser.id).then((convs) => {
      if (convs) setConversations(convs);
    });

    fetchTeamsApi().then((teamsList) => {
      if (teamsList) {
        setTeams(teamsList);
      }
    });

    // 2. Connect WebSocket with event listeners
    realtimeClient.connect(currentUser.id, {
      onInitState: (data) => {
        if (data.user) {
          setCurrentUser((prev) => ({ ...prev, ...data.user }));
        }
        if (data.notifications) {
          setNotifications(data.notifications);
        }
        if (data.conversations) {
          setConversations(data.conversations);
        }
      },

      onNewMessage: (newMsg) => {
        console.log('[App] onNewMessage received:', newMsg);
        setConversations((prev) => {
          const partnerId = newMsg.senderId === currentUser.id ? newMsg.recipientId : newMsg.senderId;
          const existing = prev.find((c) => c.developer.id === partnerId);
          if (existing) {
            return prev.map((c) => {
              if (c.developer.id === partnerId) {
                // Avoid duplicates (by id or identical videoUrl/imageUrl from same sender)
                const exists = c.messages.some(
                  (m) =>
                    m.id === newMsg.id ||
                    (newMsg.videoUrl && m.videoUrl === newMsg.videoUrl && m.senderId === newMsg.senderId) ||
                    (newMsg.imageUrl && m.imageUrl === newMsg.imageUrl && m.senderId === newMsg.senderId)
                );
                const updatedMessages = exists ? c.messages : [...c.messages, newMsg];
                return {
                  ...c,
                  lastMessage: newMsg.type === 'image' ? '📷 Shared an image' : newMsg.type === 'video' ? '🎥 Shared a video' : newMsg.text,
                  lastMessageTime: newMsg.timestamp,
                  unreadCount: currentScreen === 'chat' && activeChatPartner.id === partnerId ? 0 : c.unreadCount + 1,
                  messages: updatedMessages,
                };
              }
              return c;
            });
          } else {
            // New conversation partner
            const dev = developers.find((d) => d.id === partnerId) || {
              id: partnerId,
              name: newMsg.senderName,
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
              role: 'Developer',
              bio: '',
              skills: ['React'],
              experienceLevel: 'Senior',
              rating: 4.9,
              projectsCount: 1,
              connectionsCount: 1,
              location: 'Remote',
              availability: 'Available',
              isOnline: true,
              connectionStatus: 'connected',
            };
            return [
              {
                id: `conv_${partnerId}`,
                developer: dev as Developer,
                lastMessage: newMsg.type === 'image' ? '📷 Shared an image' : newMsg.type === 'video' ? '🎥 Shared a video' : newMsg.text,
                lastMessageTime: newMsg.timestamp,
                unreadCount: 1,
                messages: [newMsg],
              },
              ...prev,
            ];
          }
        });

        // If not looking at that chat, trigger visual toast notification
        if (currentScreen !== 'chat' || activeChatPartner.id !== newMsg.senderId) {
          showToast(`💬 ${newMsg.senderName}: ${newMsg.type === 'image' ? 'Sent a photo' : newMsg.type === 'video' ? 'Shared a video' : newMsg.text}`);
        }
      },

      onMessageSent: (sentMsg) => {
        setConversations((prev) => {
          const partnerId = sentMsg.recipientId || activeChatPartner.id;
          const existing = prev.find((c) => c.developer.id === partnerId);
          const label = sentMsg.type === 'image' ? '📷 Shared an image' : sentMsg.type === 'video' ? '🎥 Shared a video' : sentMsg.text;
          if (existing) {
            return prev.map((c) => {
              if (c.developer.id === partnerId) {
                const exists = c.messages.some((m) => m.id === sentMsg.id);
                let updatedMessages;
                if (exists) {
                  updatedMessages = c.messages.map((m) => (m.id === sentMsg.id ? { ...m, ...sentMsg } : m));
                } else {
                  // Reconcile optimistic temp message
                  const tempIndex = c.messages.findIndex(
                    (m) =>
                      (m.id.startsWith('temp_') || m.id.startsWith('vid_') || m.id.startsWith('img_')) &&
                      m.senderId === sentMsg.senderId &&
                      (sentMsg.videoUrl && m.videoUrl ? m.videoUrl === sentMsg.videoUrl : true) &&
                      (sentMsg.imageUrl && m.imageUrl ? m.imageUrl === sentMsg.imageUrl : true) &&
                      Math.abs((m.createdAt || 0) - (sentMsg.createdAt || 0)) < 40000
                  );
                  if (tempIndex !== -1) {
                    updatedMessages = [...c.messages];
                    updatedMessages[tempIndex] = {
                      ...c.messages[tempIndex],
                      ...sentMsg,
                      videoUrl: sentMsg.videoUrl || c.messages[tempIndex].videoUrl,
                      imageUrl: sentMsg.imageUrl || c.messages[tempIndex].imageUrl,
                    };
                  } else {
                    // Check if message with identical videoUrl or imageUrl was already registered
                    const dupIdx = sentMsg.videoUrl
                      ? c.messages.findIndex((m) => m.videoUrl === sentMsg.videoUrl && m.senderId === sentMsg.senderId)
                      : sentMsg.imageUrl
                      ? c.messages.findIndex((m) => m.imageUrl === sentMsg.imageUrl && m.senderId === sentMsg.senderId)
                      : -1;
                    if (dupIdx !== -1) {
                      updatedMessages = [...c.messages];
                      updatedMessages[dupIdx] = {
                        ...c.messages[dupIdx],
                        ...sentMsg,
                      };
                    } else {
                      updatedMessages = [...c.messages, sentMsg];
                    }
                  }
                }
                return {
                  ...c,
                  lastMessage: label,
                  lastMessageTime: sentMsg.timestamp,
                  messages: updatedMessages,
                };
              }
              return c;
            });
          } else {
            return [
              {
                id: `conv_${partnerId}`,
                developer: activeChatPartner,
                lastMessage: label,
                lastMessageTime: sentMsg.timestamp,
                unreadCount: 0,
                messages: [sentMsg],
              },
              ...prev,
            ];
          }
        });
      },

      onMessageEdited: (editedMsg) => {
        setConversations((prev) =>
          prev.map((conv) => {
            const hasMsg = conv.messages.some((m) => m.id === editedMsg.id);
            if (!hasMsg) return conv;
            const updated = conv.messages.map((m) => (m.id === editedMsg.id ? { ...m, ...editedMsg } : m));
            const last = updated[updated.length - 1];
            return {
              ...conv,
              messages: updated,
              lastMessage: last ? (last.type === 'image' ? '📷 Shared an image' : last.type === 'video' ? '🎥 Shared a video' : last.text) : conv.lastMessage,
            };
          })
        );
      },

      onMessageUnsent: (data) => {
        setConversations((prev) =>
          prev.map((conv) => {
            const hasMsg = conv.messages.some((m) => m.id === data.messageId);
            if (!hasMsg) return conv;
            const filtered = conv.messages.filter((m) => m.id !== data.messageId);
            const last = filtered[filtered.length - 1];
            return {
              ...conv,
              messages: filtered,
              lastMessage: last ? (last.type === 'image' ? '📷 Shared an image' : last.type === 'video' ? '🎥 Shared a video' : last.text) : '',
              lastMessageTime: last ? last.timestamp : conv.lastMessageTime,
            };
          })
        );
      },

      // Ticks Status Update: Single grey tick -> Double blue tick in real time!
      onMessagesRead: (data) => {
        console.log('[App] onMessagesRead received:', data);
        setConversations((prev) =>
          prev.map((conv) => {
            return {
              ...conv,
              messages: conv.messages.map((m) => {
                if (data.messageIds.includes(m.id)) {
                  return { ...m, status: 'read', isRead: true };
                }
                return m;
              }),
            };
          })
        );
      },

      onNotificationReceived: (notification) => {
        console.log('[App] onNotificationReceived:', notification);
        setNotifications((prev) => [notification, ...prev]);
        showToast(`🔔 ${notification.title}: ${notification.subtitle}`);
      },

      onConnectionRequestReceived: (data) => {
        console.log('[App] onConnectionRequestReceived:', data);
        setDevelopers((prev) =>
          prev.map((d) => (d.id === data.fromUser.id ? { ...d, connectionStatus: 'received' } : d))
        );
        showToast(`🤝 Connection request from ${data.fromUser.name}!`);
      },

      onConnectionAccepted: (data) => {
        console.log('[App] onConnectionAccepted:', data);
        setDevelopers((prev) =>
          prev.map((d) => (d.id === data.partnerId ? { ...d, connectionStatus: 'connected' } : d))
        );
        setCurrentUser((prev) => ({ ...prev, connectionsCount: prev.connectionsCount + 1 }));
        showToast(`🎉 Connected with ${data.partner?.name || 'developer'}! You can now chat in real-time.`);
      },

      onConnectionDeclined: (data) => {
        setDevelopers((prev) =>
          prev.map((d) => (d.id === data.targetId ? { ...d, connectionStatus: 'none' } : d))
        );
      },

      onConnectionStatusChanged: (data) => {
        setDevelopers((prev) =>
          prev.map((d) => (d.id === data.targetId ? { ...d, connectionStatus: data.status } : d))
        );
      },

      onUserPresence: (data) => {
        setDevelopers((prev) =>
          prev.map((d) => (d.id === data.userId ? { ...d, isOnline: data.isOnline } : d))
        );
        setActiveChatPartner((prev) => (prev.id === data.userId ? { ...prev, isOnline: data.isOnline } : prev));
      },

      onChatPresence: (data) => {
        setDevelopers((prev) =>
          prev.map((d) => (d.id === data.userId ? { ...d, isOnline: data.isOnline } : d))
        );
        setActiveChatPartner((prev) => (prev.id === data.userId ? { ...prev, isOnline: data.isOnline } : prev));
      },

      onUserUpdated: (data) => {
        const updated = data.user;
        if (!updated) return;
        setDevelopers((prev) =>
          prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
        );
        if (currentUser.id === updated.id) {
          setCurrentUser((prev) => ({ ...prev, ...updated }));
        }
        setTeams((prev) =>
          prev.map((t) => ({
            ...t,
            members: t.members.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)),
          }))
        );
        setActiveTeam((prev) =>
          prev
            ? {
                ...prev,
                members: prev.members.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)),
              }
            : prev
        );
        setConversations((prev) =>
          prev.map((c) =>
            c.developer.id === updated.id
              ? { ...c, developer: { ...c.developer, avatar: updated.avatar, name: updated.name } }
              : c
          )
        );
      },

      onNewTeamMessage: (data) => {
        setTeamMessages((prev) => {
          const list = prev[data.teamId] || [];
          // Avoid duplicates by id or identical videoUrl/imageUrl from the same sender
          if (
            list.some(
              (m) =>
                m.id === data.message.id ||
                (data.message.videoUrl && m.videoUrl === data.message.videoUrl && m.senderId === data.message.senderId) ||
                (data.message.imageUrl && m.imageUrl === data.message.imageUrl && m.senderId === data.message.senderId)
            )
          ) {
            return prev;
          }
          // Reconcile optimistic team message
          const tempIdx = list.findIndex(
            (m) =>
              (m.id.startsWith('temp_team_') || m.id.startsWith('vid_team_') || m.id.startsWith('temp_') || m.id.startsWith('img_')) &&
              m.senderId === data.message.senderId &&
              (data.message.videoUrl && m.videoUrl ? m.videoUrl === data.message.videoUrl : true) &&
              (data.message.imageUrl && m.imageUrl ? m.imageUrl === data.message.imageUrl : true) &&
              Math.abs((m.createdAt || 0) - (data.message.createdAt || 0)) < 40000
          );
          if (tempIdx !== -1) {
            const copy = [...list];
            copy[tempIdx] = {
              ...copy[tempIdx],
              ...data.message,
              videoUrl: data.message.videoUrl || copy[tempIdx].videoUrl,
              imageUrl: data.message.imageUrl || copy[tempIdx].imageUrl,
            };
            return { ...prev, [data.teamId]: copy };
          }
          return { ...prev, [data.teamId]: [...list, data.message] };
        });
        if (currentScreen !== 'project_chat' || activeTeam?.id !== data.teamId) {
          showToast(`💬 Project #${data.teamId}: ${data.message.senderName}: ${data.message.text || (data.message.type === 'video' ? 'Shared a video' : 'Shared attachment')}`);
        }
      },

      onTeamMessageEdited: (data) => {
        setTeamMessages((prev) => {
          const list = prev[data.teamId] || [];
          return {
            ...prev,
            [data.teamId]: list.map((m) =>
              m.id === data.messageId ? { ...m, ...(data.message || {}), text: data.newText || data.message?.text || m.text, edited: true } : m
            ),
          };
        });
      },

      onTeamMessageUnsent: (data) => {
        setTeamMessages((prev) => {
          const list = prev[data.teamId] || [];
          return {
            ...prev,
            [data.teamId]: list.filter((m) => m.id !== data.messageId),
          };
        });
      },

      onTeamCreated: (data) => {
        setTeams((prev) => [data.team, ...prev]);
        showToast(`🎉 New Project Team: ${data.team.name}!`);
      },

      onTeamUpdated: (data) => {
        setTeams((prev) => prev.map((t) => (t.id === data.team.id ? data.team : t)));
        setActiveTeam((prev) => (prev?.id === data.team.id ? data.team : prev));
      },

      onTeamDeleted: (data) => {
        setTeams((prev) => prev.filter((t) => t.id !== data.teamId));
        setActiveTeam((prev) => (prev?.id === data.teamId ? null : prev));
        if (currentScreen === 'project_chat' && activeTeam?.id === data.teamId) {
          setCurrentScreen('main');
          setActiveTab('messages');
        }
      },

      onTeamProgressUpdated: (data) => {
        const pct = data.progress?.completionPercentage ?? 0;
        setTeams((prev) =>
          prev.map((t) => (t.id === data.teamId ? { ...t, completionPercentage: pct } : t))
        );
        setActiveTeam((prev) =>
          prev && prev.id === data.teamId
            ? { ...prev, completionPercentage: pct }
            : prev
        );
      },
    });

    return () => {
      realtimeClient.disconnect();
    };
  }, [currentUser.id]);

  // Handle Send Connection Request
  const handleConnectDeveloper = (devId: string) => {
    // Optimistic UI update
    setDevelopers((prev) =>
      prev.map((dev) => (dev.id === devId ? { ...dev, connectionStatus: 'pending' } : dev))
    );

    const dev = developers.find((d) => d.id === devId);
    realtimeClient.sendConnectRequest(devId);
    sendConnectRequestApi(currentUser.id, devId).catch((e) => console.warn(e));

    showToast(`Connection request sent to ${dev ? dev.name : 'developer'}!`);
  };

  // Handle Accept Connection Request
  const handleAcceptConnectionRequest = (notifId: string, requesterId?: string) => {
    if (!requesterId) return;

    // Optimistically update notifications
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, actionable: false, isRead: true } : n))
    );

    // Optimistically update developer status
    setDevelopers((prev) =>
      prev.map((d) => (d.id === requesterId ? { ...d, connectionStatus: 'connected' } : d))
    );
    setCurrentUser((prev) => ({ ...prev, connectionsCount: prev.connectionsCount + 1 }));

    realtimeClient.acceptConnectRequest(requesterId);
    acceptConnectRequestApi(currentUser.id, requesterId).catch((e) => console.warn(e));

    const dev = developers.find((d) => d.id === requesterId);
    showToast(`Connected with ${dev ? dev.name : 'developer'}! Chat is now unlocked.`);
  };

  // Handle Decline Connection Request
  const handleDeclineConnectionRequest = (notifId: string) => {
    const notif = notifications.find((n) => n.id === notifId);
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    if (notif?.requesterId) {
      realtimeClient.declineConnectRequest(notif.requesterId);
      declineConnectRequestApi(currentUser.id, notif.requesterId).catch((e) => console.warn(e));
      setDevelopers((prev) =>
        prev.map((d) => (d.id === notif.requesterId ? { ...d, connectionStatus: 'none' } : d))
      );
    }
    showToast('Connection request declined.');
  };

  // Open Chat with Developer
  const handleOpenChatWith = (partner: Developer) => {
    setActiveChatPartner(partner);
    setSelectedDeveloperForModal(null);
    setCurrentScreen('chat');
  };

  // Send Message in Direct Chat (text, image, video, code, voice, code_file, zip)
  const handleSendMessage = (
    partnerId: string,
    text: string,
    type: 'text' | 'code' | 'voice' | 'image' | 'video' | 'code_file' | 'zip' = 'text',
    extra?: any
  ) => {
    const tempId = extra?.id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowTime = extra?.timestamp || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: currentUser.id,
      recipientId: partnerId,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text,
      type,
      timestamp: nowTime,
      createdAt: Date.now(),
      status: 'sent',
      isOutgoing: true,
      ...extra,
    };

    const label = type === 'image' ? '📷 Shared an image' : type === 'video' ? '🎥 Shared a video' : text;

    // Instant 0ms optimistic local update
    setConversations((prev) => {
      const existing = prev.find((c) => c.developer.id === partnerId);
      if (existing) {
        return prev.map((c) => {
          if (c.developer.id === partnerId) {
            return {
              ...c,
              lastMessage: label,
              lastMessageTime: nowTime,
              messages: [...c.messages, optimisticMsg],
            };
          }
          return c;
        });
      } else {
        return [
          {
            id: `conv_${partnerId}`,
            developer: activeChatPartner,
            lastMessage: label,
            lastMessageTime: nowTime,
            unreadCount: 0,
            messages: [optimisticMsg],
          },
          ...prev,
        ];
      }
    });

    // Transmit to server via WebSocket (unless local background upload is actively in progress)
    if (!extra?.isLocalUploading) {
      realtimeClient.sendMessage(partnerId, text, type, extra);
    }
  };

  const handleUpdateMessage = useCallback((partnerId: string, messageId: string, updates: Partial<ChatMessage>) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.developer.id === partnerId) {
          return {
            ...c,
            messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
          };
        }
        return c;
      })
    );
  }, []);

  const handleEditMessage = (messageId: string, newText: string) => {
    setConversations((prev) =>
      prev.map((conv) => {
        const hasMsg = conv.messages.some((m) => m.id === messageId);
        if (!hasMsg) return conv;
        const updated = conv.messages.map((m) => (m.id === messageId ? { ...m, text: newText, edited: true } : m));
        return {
          ...conv,
          messages: updated,
        };
      })
    );
    realtimeClient.editMessage(messageId, newText);
    editMessageApi(messageId, currentUser.id, newText).catch((e) => console.warn(e));
  };

  const handleUnsendMessage = (messageId: string) => {
    setConversations((prev) =>
      prev.map((conv) => {
        const hasMsg = conv.messages.some((m) => m.id === messageId);
        if (!hasMsg) return conv;
        const filtered = conv.messages.filter((m) => m.id !== messageId);
        const last = filtered[filtered.length - 1];
        return {
          ...conv,
          messages: filtered,
          lastMessage: last ? (last.type === 'image' ? '📷 Shared an image' : last.type === 'video' ? '🎥 Shared a video' : last.text) : '',
          lastMessageTime: last ? last.timestamp : conv.lastMessageTime,
        };
      })
    );
    realtimeClient.unsendMessage(messageId);
    unsendMessageApi(messageId, currentUser.id).catch((e) => console.warn(e));
    showToast('Message unsent');
  };

  // Open Project Team Chat Room
  const handleSelectTeam = async (team: ProjectTeam) => {
    setActiveTeam(team);
    setCurrentScreen('project_chat');
    try {
      const msgs = await fetchTeamMessagesApi(team.id);
      if (msgs) {
        setTeamMessages((prev) => ({ ...prev, [team.id]: msgs }));
      }
    } catch (e) {
      console.warn('Failed to load team messages', e);
    }
  };

  // Send Message in Project Team Chat (text, image, video, code file, zip)
  const handleSendTeamMessage = (
    teamId: string,
    text: string,
    type: 'text' | 'code' | 'voice' | 'image' | 'video' | 'code_file' | 'zip' = 'text',
    extra?: any
  ) => {
    const tempId = extra?.id || `temp_team_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowTime = extra?.timestamp || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text,
      type,
      timestamp: nowTime,
      createdAt: Date.now(),
      status: 'sent',
      isOutgoing: true,
      ...extra,
    };

    // Instant 0ms optimistic local update
    setTeamMessages((prev) => {
      const currentList = prev[teamId] || [];
      return {
        ...prev,
        [teamId]: [...currentList, optimisticMsg],
      };
    });

    if (!extra?.isLocalUploading) {
      realtimeClient.sendTeamMessage(teamId, text, type, extra);
    }
  };

  const handleUpdateTeamMessage = useCallback((teamId: string, messageId: string, updates: Partial<ChatMessage>) => {
    setTeamMessages((prev) => {
      const currentList = prev[teamId] || [];
      return {
        ...prev,
        [teamId]: currentList.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
      };
    });
  }, []);

  const handleEditTeamMessage = (teamId: string, messageId: string, newText: string) => {
    setTeamMessages((prev) => {
      const list = prev[teamId] || [];
      return {
        ...prev,
        [teamId]: list.map((m) => (m.id === messageId ? { ...m, text: newText, edited: true } : m)),
      };
    });
    realtimeClient.editTeamMessage(teamId, messageId, newText);
    editTeamMessageApi(teamId, messageId, currentUser.id, newText);
  };

  const handleUnsendTeamMessage = (teamId: string, messageId: string) => {
    setTeamMessages((prev) => {
      const list = prev[teamId] || [];
      return {
        ...prev,
        [teamId]: list.filter((m) => m.id !== messageId),
      };
    });
    realtimeClient.unsendTeamMessage(teamId, messageId);
    unsendTeamMessageApi(teamId, messageId, currentUser.id);
    showToast('Team message unsent');
  };

  const handleForwardToDeveloper = (targetDevId: string, message: ChatMessage) => {
    handleSendMessage(
      targetDevId,
      message.text || '',
      message.type || 'text',
      {
        imageUrl: message.imageUrl,
        videoUrl: message.videoUrl,
        codeSnippet: message.codeSnippet,
        codeFile: message.codeFile,
        zipFile: message.zipFile,
        voiceDuration: message.voiceDuration,
      }
    );
    const targetDev = developers.find((d) => d.id === targetDevId);
    showToast(`Message forwarded to ${targetDev?.name || 'developer'}`);
  };

  const handleForwardToTeam = (targetTeamId: string, message: ChatMessage) => {
    handleSendTeamMessage(
      targetTeamId,
      message.text || '',
      (message.type as any) || 'text',
      {
        imageUrl: message.imageUrl,
        videoUrl: message.videoUrl,
        codeSnippet: message.codeSnippet,
        codeFile: message.codeFile,
        zipFile: message.zipFile,
        voiceDuration: message.voiceDuration,
      }
    );
    const targetTeam = teams.find((t) => t.id === targetTeamId);
    showToast(`Message forwarded to team "${targetTeam?.name || 'team'}"`);
  };

  // Create Project Team
  const handleCreateTeam = async (data: { name: string; projectTopic: string; description: string; memberIds?: string[] }) => {
    try {
      const memberIds = data.memberIds && data.memberIds.length > 0
        ? Array.from(new Set([currentUser.id, ...data.memberIds]))
        : [currentUser.id];

      const createdTeam = await createTeamApi({
        name: data.name,
        projectTopic: data.projectTopic,
        description: data.description,
        createdBy: currentUser.id,
        memberIds: memberIds,
      });
      if (createdTeam) {
        setTeams((prev) => [createdTeam, ...prev]);
        setActiveTeam(createdTeam);
        setCurrentScreen('project_chat');
        showToast(`Team "${createdTeam.name}" created with ${memberIds.length} members!`);
      }
    } catch (e) {
      console.error('Failed to create team', e);
    }
  };

  // Delete Project Team (Real-time and persistent)
  const handleDeleteTeam = async (teamId: string) => {
    const teamToDelete = teams.find((t) => t.id === teamId);
    const teamName = teamToDelete?.name || 'Project Team';

    // Optimistic UI update
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    if (activeTeam?.id === teamId) {
      setActiveTeam(null);
      if (currentScreen === 'project_chat') {
        setCurrentScreen('main');
        setActiveTab('messages');
      }
    }

    // Realtime WebSocket broadcast & API call
    realtimeClient.deleteTeam(teamId);
    try {
      await deleteTeamApi(teamId);
      showToast(`Group "${teamName}" deleted.`);
    } catch (err) {
      console.error('Failed to delete team via API', err);
    }
  };

  // Update Project Team
  const handleUpdateTeam = async (
    teamId: string,
    data: { name?: string; projectTopic?: string; description?: string; memberIds?: string[] }
  ) => {
    try {
      const updated = await updateTeamApi(teamId, data);
      if (updated) {
        setTeams((prev) => prev.map((t) => (t.id === teamId ? updated : t)));
        if (activeTeam?.id === teamId) {
          setActiveTeam(updated);
        }
        showToast(`Group "${updated.name}" updated!`);
      }
    } catch (err) {
      console.error('Failed to update team', err);
    }
  };

  // Active messages for the active chat partner
  const activeConversation = conversations.find((c) => c.developer.id === activeChatPartner.id);
  const activeMessages = activeConversation ? activeConversation.messages : [];

  // Notifications & Messages Counts
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;
  const unreadMessagesCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Profile save handler - guarantees isolated storage per account
  const handleSaveProfile = async (updatedUser: Developer) => {
    setCurrentUser(updatedUser);
    sessionStorage.setItem('coding_partner_logged_in_user', JSON.stringify(updatedUser));
    localStorage.setItem('coding_partner_logged_in_user', JSON.stringify(updatedUser));

    // Save account-specific avatar to isolate from all other accounts
    if (updatedUser.avatar) {
      localStorage.setItem(`coding_partner_avatar_${updatedUser.id}`, updatedUser.avatar);
    }

    // Update in remembered profiles list in localStorage
    try {
      const stored = localStorage.getItem('coding_partner_saved_profiles');
      const list = stored ? JSON.parse(stored) : [];
      const updatedList = list.map((p: any) =>
        p.id === updatedUser.id
          ? { ...p, name: updatedUser.name, avatar: updatedUser.avatar, email: updatedUser.email, role: updatedUser.role }
          : p
      );
      localStorage.setItem('coding_partner_saved_profiles', JSON.stringify(updatedList));
    } catch (e) {}

    setDevelopers((prev) =>
      prev.map((d) => (d.id === updatedUser.id ? { ...d, ...updatedUser } : d))
    );

    // Update members inside all teams
    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        members: t.members.map((m) => (m.id === updatedUser.id ? { ...m, ...updatedUser } : m)),
      }))
    );

    // Update active team if loaded
    setActiveTeam((prev) =>
      prev
        ? {
            ...prev,
            members: prev.members.map((m) => (m.id === updatedUser.id ? { ...m, ...updatedUser } : m)),
          }
        : prev
    );

    // Update posts authored by this user
    setPosts((prev) =>
      prev.map((p) =>
        p.author.id === updatedUser.id
          ? { ...p, author: { ...p.author, name: updatedUser.name, avatar: updatedUser.avatar } }
          : p
      )
    );

    // Update direct chat conversations with this user
    setConversations((prev) =>
      prev.map((c) =>
        c.developer.id === updatedUser.id
          ? { ...c, developer: { ...c.developer, name: updatedUser.name, avatar: updatedUser.avatar } }
          : c
      )
    );

    showToast('Profile updated!');

    // Persist to backend server so other devices/tabs see updated name, avatar, bio, skills
    try {
      await updateUserProfileApi(updatedUser);
    } catch (err) {
      console.warn('Could not persist profile to server', err);
    }
  };

  // Feed Post Created handler
  const handlePostCreated = (newPost: FeedPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setCurrentScreen('main');
    setActiveTab('home');
    showToast('Post published to developer feed!');
  };

  // Project Join handler
  const handleJoinProject = (project: Project) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id
          ? { ...p, currentMembers: Math.min(p.teamSize, p.currentMembers + 1) }
          : p
      )
    );
    showToast(`Application submitted to join "${project.title}"!`);
  };

  // Workspace task handlers
  const handleAddWorkspaceTask = (task: WorkspaceTask) => {
    setWorkspaceTasks((prev) => [task, ...prev]);
    showToast(`Added sprint task: ${task.title}`);
  };

  const handleToggleTaskStatus = (taskId: string) => {
    setWorkspaceTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: t.status === 'done' ? 'in_progress' : 'done',
              completed: t.status !== 'done',
            }
          : t
      )
    );
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-[#04060a]' : 'bg-[#0f121d]'} text-white flex flex-col items-center justify-start antialiased relative selection:bg-purple-500/30 selection:text-white font-sans transition-colors duration-300`}>
      {/* Top Showcase Toolbar */}
      <header className="w-full max-w-5xl pt-3 pb-2 px-4 flex items-center justify-between z-40 border-b border-white/10 backdrop-blur-md sticky top-0 bg-[#04060a]/90">
        {/* Brand & Active Account Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-[0_0_15px_rgba(124,58,237,0.5)]">
            <div className="w-full h-full bg-[#07090e] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-300 bg-clip-text text-transparent flex items-center gap-1.5">
              <span>Coding Partner</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                Real-Time
              </span>
            </h1>
          </div>
        </div>

        {/* Screen Quick Jumper Dropdown & Controls */}
        <div className="flex items-center gap-2">
          {/* Top Bar Liquid Glass AI Ask Me Quick Launch */}
          <AiAskMeButton
            variant="compact"
            onClick={() => setCurrentScreen('ai_chat')}
            className="hidden sm:inline-flex"
          />

          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-300">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={currentScreen === 'main' ? activeTab : currentScreen}
              onChange={(e) => {
                const val = e.target.value;
                if (['home', 'explore', 'projects', 'messages', 'profile'].includes(val)) {
                  setCurrentScreen('main');
                  setActiveTab(val as TabType);
                } else if (val === 'developer_card') {
                  setSelectedDeveloperForModal(developers[0] || currentUser);
                } else {
                  setCurrentScreen(val as ScreenType);
                }
              }}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="splash" className="bg-[#0f1424]">1. Splash Screen</option>
              <option value="onboarding" className="bg-[#0f1424]">2. Onboarding Screen</option>
              <option value="auth" className="bg-[#0f1424]">3. Login / Sign Up</option>
              <option value="home" className="bg-[#0f1424]">4. Home Screen</option>
              <option value="explore" className="bg-[#0f1424]">5. Discover / Explore</option>
              <option value="create_post" className="bg-[#0f1424]">6. Create Post Screen</option>
              <option value="chat" className="bg-[#0f1424]">7. Chat Screen</option>
              <option value="project_chat" className="bg-[#0f1424]">8. Team Project Chat</option>
              <option value="ai_chat" className="bg-[#0f1424]">9. ✨ AI Ask Me Screen</option>
              <option value="profile" className="bg-[#0f1424]">10. Profile Screen</option>
              <option value="notifications" className="bg-[#0f1424]">11. Notifications Screen</option>
              <option value="settings" className="bg-[#0f1424]">12. Settings Screen</option>
              <option value="developer_card" className="bg-[#0f1424]">13. Developer Card Screen</option>
            </select>
          </div>

          {/* Device Frame View Toggle */}
          <button
            onClick={() => setIsDeviceFrame(!isDeviceFrame)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-xs"
            title={isDeviceFrame ? 'Switch to Fluid Desktop View' : 'Switch to iPhone Frame'}
          >
            {isDeviceFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4 text-purple-400" />}
            <span className="hidden md:inline">{isDeviceFrame ? 'Full View' : 'Phone View'}</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Toggle Dark / Light Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex justify-center items-center py-4 sm:py-8 px-2 sm:px-4 w-full">
        {/* Device Frame Wrapper or Fluid Screen */}
        <div
          className={`transition-all duration-300 relative ${
            isDeviceFrame
              ? 'w-full max-w-[412px] h-[860px] rounded-[52px] bg-[#07090e] border-[10px] border-[#181d30] shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.15)] overflow-hidden flex flex-col'
              : 'w-full max-w-2xl min-h-[800px] rounded-3xl bg-[#07090e] border border-white/10 shadow-2xl overflow-hidden flex flex-col'
          }`}
        >
          {/* Dynamic Island & Status Bar */}
          <div className="pt-3 px-6 sm:px-7 flex items-center justify-between z-30 select-none pointer-events-none shrink-0 bg-transparent">
            <span className="text-[13px] font-semibold text-white font-mono tracking-tight">{currentLocalTime}</span>

            {/* Dynamic Island Capsule */}
            <div className="w-24 h-5 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500/80 mr-2 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-cyan-400/80" />
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-1.5 text-white">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z" />
              </svg>
              <div className="w-5 h-2.5 rounded-sm border border-white flex items-center p-0.5">
                <div className="w-full h-full bg-white rounded-xs" />
              </div>
            </div>
          </div>

          {/* Active Screen View */}
          <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
            <AnimatePresence mode="wait">
              {currentScreen === 'splash' && (
                <motion.div
                  key="splash"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <SplashScreen
                    onComplete={() => setCurrentScreen('onboarding')}
                    onSkip={() => setCurrentScreen('main')}
                  />
                </motion.div>
              )}

              {currentScreen === 'onboarding' && (
                <motion.div
                  key="onboarding"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full h-full"
                >
                  <OnboardingScreen
                    onGetStarted={() => setCurrentScreen('auth')}
                    onLoginClick={() => setCurrentScreen('auth')}
                  />
                </motion.div>
              )}

              {currentScreen === 'auth' && (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full h-full"
                >
                  <AuthScreen
                    currentActiveUserId={currentUser.id}
                    onSuccess={(user) => handleAuthSuccess(user)}
                    onBack={() => setCurrentScreen('onboarding')}
                  />
                </motion.div>
              )}

              {currentScreen === 'main' && (
                <motion.div
                  key="main-screen"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full flex flex-col relative"
                >
                  <div className="flex-1 w-full">
                    {activeTab === 'home' && (
                      <HomeScreen
                        currentUser={currentUser}
                        developers={developers}
                        projects={projects}
                        posts={posts}
                        unreadNotifsCount={unreadNotifsCount}
                        onOpenNotifications={() => setCurrentScreen('notifications')}
                        onSelectDeveloper={(dev) => setSelectedDeveloperForModal(dev)}
                        onConnectDeveloper={handleConnectDeveloper}
                        onSelectProject={(project) => {
                          showToast(`Selected project "${project.title}"`);
                          setActiveTab('projects');
                        }}
                        onCreateProjectClick={() => setCurrentScreen('create_post')}
                        onSeeAllDevelopers={() => setActiveTab('explore')}
                        onSeeAllProjects={() => setActiveTab('projects')}
                        onUpdateAvatar={(newUrl) => {
                          const updated = { ...currentUser, avatar: newUrl };
                          handleSaveProfile(updated);
                          showToast('Profile photo updated successfully!');
                        }}
                        onEditProfile={() => setIsEditProfileOpen(true)}
                      />
                    )}

                    {activeTab === 'explore' && (
                      <DiscoverScreen
                        developers={developers.filter((d) => d.id !== currentUser.id)}
                        onSelectDeveloper={(dev) => setSelectedDeveloperForModal(dev)}
                        onConnectDeveloper={handleConnectDeveloper}
                        onOpenChatWith={handleOpenChatWith}
                      />
                    )}

                    {activeTab === 'projects' && (
                      <ProjectsScreen
                        projects={projects}
                        onSelectProject={(p) => showToast(`Selected "${p.title}"`)}
                        onCreateProject={() => setCurrentScreen('create_post')}
                        onJoinProject={handleJoinProject}
                      />
                    )}

                    {activeTab === 'messages' && (
                      <ConversationsListScreen
                        conversations={conversations}
                        teams={teams}
                        developers={[currentUser, ...developers.filter((d) => d.id !== currentUser.id)]}
                        onSelectConversation={(conv) => handleOpenChatWith(conv.developer)}
                        onSelectTeam={handleSelectTeam}
                        onCreateTeam={handleCreateTeam}
                        onDeleteTeam={handleDeleteTeam}
                        onUpdateTeam={handleUpdateTeam}
                        onNewChat={() => setActiveTab('explore')}
                        onNavigateToAi={() => setCurrentScreen('ai_chat')}
                        currentUserId={currentUser.id}
                        isMobileView={isDeviceFrame}
                      />
                    )}

                    {activeTab === 'profile' && (
                      <ProfileScreen
                        user={currentUser}
                        projects={projects}
                        onBack={() => setActiveTab('home')}
                        onOpenSettings={() => setCurrentScreen('settings')}
                        onOpenEditProfile={() => setIsEditProfileOpen(true)}
                        onOpenWorkspace={() => setIsWorkspaceOpen(true)}
                        onUpdateAvatar={(newAvatar) => {
                          const updated = { ...currentUser, avatar: newAvatar };
                          handleSaveProfile(updated);
                        }}
                      />
                    )}
                  </div>

                  {/* Floating Pill Bottom Navigation Bar */}
                  <BottomNav
                    activeTab={activeTab}
                    onTabChange={(tab) => setActiveTab(tab)}
                    unreadMessagesCount={unreadMessagesCount}
                  />
                </motion.div>
              )}

              {currentScreen === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full h-full"
                >
                  <ChatScreen
                    partner={activeChatPartner}
                    messages={activeMessages}
                    onBack={() => {
                      setCurrentScreen('main');
                      setActiveTab('messages');
                    }}
                    onSendMessage={handleSendMessage}
                    onUpdateMessage={(messageId, updates) => handleUpdateMessage(activeChatPartner.id, messageId, updates)}
                    onEditMessage={handleEditMessage}
                    onUnsendMessage={handleUnsendMessage}
                    currentUserId={currentUser.id}
                    onNavigateToAi={() => setCurrentScreen('ai_chat')}
                    allDevelopers={developers}
                    allTeams={teams}
                    onForwardToDeveloper={handleForwardToDeveloper}
                    onForwardToTeam={handleForwardToTeam}
                  />
                </motion.div>
              )}

              {currentScreen === 'project_chat' && activeTeam && (
                <motion.div
                  key="project_chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full h-full"
                >
                  <ProjectChatScreen
                    team={activeTeam}
                    messages={teamMessages[activeTeam.id] || []}
                    currentUser={currentUser}
                    onBack={() => {
                      setCurrentScreen('main');
                      setActiveTab('messages');
                    }}
                    onSendTeamMessage={handleSendTeamMessage}
                    onUpdateTeamMessage={(messageId, updates) => handleUpdateTeamMessage(activeTeam.id, messageId, updates)}
                    onEditTeamMessage={handleEditTeamMessage}
                    onUnsendTeamMessage={handleUnsendTeamMessage}
                    onNavigateToAi={() => setCurrentScreen('ai_chat')}
                    allDevelopers={developers}
                    allTeams={teams}
                    onForwardToDeveloper={handleForwardToDeveloper}
                    onForwardToTeam={handleForwardToTeam}
                  />
                </motion.div>
              )}

              {currentScreen === 'ai_chat' && (
                <motion.div
                  key="ai_chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full h-full"
                >
                  <AiChatScreen
                    currentUser={currentUser}
                    onBack={() => {
                      setCurrentScreen('main');
                    }}
                    onForwardSnippetToChat={(snippet) => {
                      if (activeChatPartner) {
                        handleSendMessage(
                          activeChatPartner.id,
                          `Here is the complete code from AI Assistant:\n\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``,
                          'code',
                          {
                            codeSnippet: { language: snippet.language, code: snippet.code },
                          }
                        );
                        setCurrentScreen('chat');
                        showToast(`Code forwarded to ${activeChatPartner.name}`);
                      } else {
                        setCurrentScreen('main');
                        setActiveTab('messages');
                        showToast('Select a conversation to share the code');
                      }
                    }}
                  />
                </motion.div>
              )}

              {currentScreen === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full h-full"
                >
                  <NotificationsScreen
                    notifications={notifications}
                    onBack={() => setCurrentScreen('main')}
                    onAcceptRequest={handleAcceptConnectionRequest}
                    onDeclineRequest={handleDeclineConnectionRequest}
                    onMarkAllAsRead={() => {
                      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                      showToast('All notifications marked as read.');
                    }}
                    onSelectNotification={(notif) => {
                      if (notif.type === 'message' && notif.requesterId) {
                        const partner = developers.find((d) => d.id === notif.requesterId) || activeChatPartner;
                        handleOpenChatWith(partner);
                      } else if (notif.requesterId) {
                        const dev = developers.find((d) => d.id === notif.requesterId);
                        if (dev) setSelectedDeveloperForModal(dev);
                      }
                    }}
                  />
                </motion.div>
              )}

              {currentScreen === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full h-full"
                >
                  <SettingsScreen
                    currentUser={currentUser}
                    onBack={() => setCurrentScreen('main')}
                    onEditProfile={() => setIsEditProfileOpen(true)}
                    onLogout={handleLogout}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                  />
                </motion.div>
              )}

              {currentScreen === 'create_post' && (
                <motion.div
                  key="create_post"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full h-full"
                >
                  <CreatePostScreen
                    onBack={() => setCurrentScreen('main')}
                    onPostCreated={handlePostCreated}
                    currentUserName={currentUser.name}
                    currentUserAvatar={currentUser.avatar}
                    currentUserId={currentUser.id}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Developer Card Modal */}
      <DeveloperCardModal
        developer={selectedDeveloperForModal}
        isOpen={Boolean(selectedDeveloperForModal)}
        onClose={() => setSelectedDeveloperForModal(null)}
        onConnect={(devId) => {
          handleConnectDeveloper(devId);
          setSelectedDeveloperForModal((prev) => (prev ? { ...prev, connectionStatus: 'pending' } : null));
        }}
        onOpenChat={(dev) => handleOpenChatWith(dev)}
        currentUserId={currentUser.id}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        user={currentUser}
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSave={handleSaveProfile}
      />

      {/* Collaboration Workspace Modal */}
      <WorkspaceModal
        isOpen={isWorkspaceOpen}
        onClose={() => setIsWorkspaceOpen(false)}
        tasks={workspaceTasks}
        onAddTask={handleAddWorkspaceTask}
        onToggleTaskStatus={handleToggleTaskStatus}
      />


      {/* Floating Interactive Toast Notifications */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 py-2.5 px-4 rounded-full bg-[#161a2e]/95 backdrop-blur-2xl border border-cyan-400/50 text-white text-xs font-medium shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
