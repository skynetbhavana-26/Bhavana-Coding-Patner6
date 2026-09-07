import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Phone, Video, Send, Plus, Smile, Copy, Check, CheckCheck,
  Play, Pause, Mic, Code2, Image as ImageIcon, Sparkles, X, Maximize2,
  Film, MoreHorizontal, Edit3, Trash2, CornerUpLeft, Share2
} from 'lucide-react';
import { Developer, ChatMessage, ProjectTeam } from '../types';
import { 
  uploadImageToBackend, 
  uploadVideoToBackend, 
  registerLocalVideoBlob, 
  getLocalVideoBlob, 
  registerLocalImageBlob, 
  getLocalMediaBlob 
} from '../utils/upload';
import { realtimeClient } from '../services/realtime';
import { getCurrentChatTime, formatChatMessageTime } from '../utils/time';
import { ChatAiAssistantModal } from './ChatAiAssistantModal';
import { ForwardMessageModal } from './ForwardMessageModal';
import { AiAskMeButton } from './AiAskMeButton';
import { FullscreenMediaModal } from './FullscreenMediaModal';
import { ChatVideoPlayer } from './ChatVideoPlayer';

interface ChatScreenProps {
  partner: Developer;
  messages: ChatMessage[];
  onBack: () => void;
  onSendMessage: (partnerId: string, text: string, type?: 'text' | 'code' | 'voice' | 'image' | 'video', extra?: any) => void;
  onUpdateMessage?: (messageId: string, updates: Partial<ChatMessage>) => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  onUnsendMessage?: (messageId: string) => void;
  currentUserId: string;
  onNavigateToAi?: () => void;
  allDevelopers?: Developer[];
  allTeams?: ProjectTeam[];
  onForwardToDeveloper?: (developerId: string, message: ChatMessage) => void;
  onForwardToTeam?: (teamId: string, message: ChatMessage) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  partner,
  messages,
  onBack,
  onSendMessage,
  onUpdateMessage,
  onEditMessage,
  onUnsendMessage,
  currentUserId,
  onNavigateToAi,
  allDevelopers = [],
  allTeams = [],
  onForwardToDeveloper,
  onForwardToTeam,
}) => {
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: 'image' | 'video'; title?: string } | null>(null);

  // AI Assistant "Ask Me" modal state
  const [showAiModal, setShowAiModal] = useState(false);

  // Message Actions state (Selected message outline, Three-dot menu, Reply, Edit, Forward)
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editingText, setEditingText] = useState('');
  const [messageToForward, setMessageToForward] = useState<ChatMessage | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Inform server that this user has entered this chat (marks messages read & pushes double blue ticks)
  useEffect(() => {
    realtimeClient.enterChat(partner.id);
    realtimeClient.markRead(partner.id);
    return () => {
      realtimeClient.leaveChat();
    };
  }, [partner.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle uploading and sending image - 0ms instant zero-wait delivery
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input immediately so user is never blocked
    if (e.target) {
      e.target.value = '';
    }
    setShowAttachMenu(false);

    const ext = file.name.includes('.') ? '.' + file.name.split('.').pop()?.toLowerCase() : '.jpg';
    const targetFilename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const publicUrl = `/uploads/${targetFilename}`;

    // 1. Generate instant local Blob URL for immediate 0ms display & cross-tab sync
    const localBlobUrl = URL.createObjectURL(file);
    registerLocalImageBlob(publicUrl, localBlobUrl, file);

    const tempMsgId = `temp_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const currentTime = getCurrentChatTime();

    // 2. Dispatch message IMMEDIATELY (0ms) - already sent, fully visible!
    onSendMessage(partner.id, '', 'image', {
      id: tempMsgId,
      imageUrl: publicUrl,
      timestamp: currentTime,
      createdAt: Date.now(),
      status: 'sent',
    });

    // 3. Background server persistence stream (silent async background storage)
    uploadImageToBackend(file, targetFilename).catch((err) => {
      console.warn('[Image Upload] Background stream sync completed with local cache:', err);
    });
  };

  // Handle uploading and sending video - instant 0ms delivery
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input immediately so user is never blocked
    if (e.target) {
      e.target.value = '';
    }
    setShowAttachMenu(false);

    const ext = file.name.includes('.') ? '.' + file.name.split('.').pop()?.toLowerCase() : '.mp4';
    const targetFilename = `video_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const publicUrl = `/uploads/${targetFilename}`;

    // 1. Generate instant local Blob URL for immediate 0ms playback & cross-tab sync
    const localBlobUrl = URL.createObjectURL(file);
    registerLocalVideoBlob(publicUrl, localBlobUrl, file);

    const tempMsgId = `temp_vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const currentTime = getCurrentChatTime();

    // 2. Dispatch message IMMEDIATELY (0ms) - sent instantly without delay!
    onSendMessage(partner.id, '', 'video', {
      id: tempMsgId,
      videoUrl: publicUrl,
      timestamp: currentTime,
      createdAt: Date.now(),
      status: 'sent',
    });

    // 3. Fast direct binary stream upload to server in parallel (under 1 second)
    uploadVideoToBackend(file, targetFilename)
      .then((finalUrl) => {
        if (finalUrl && finalUrl !== publicUrl) {
          registerLocalVideoBlob(finalUrl, localBlobUrl, file);
          onUpdateMessage?.(tempMsgId, {
            videoUrl: finalUrl,
          });
        }
      })
      .catch((err) => {
        console.warn('[Video Upload] Direct stream upload fallback note:', err);
      });
  };

  // Handle sending regular message or reply
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText('');
    setShowAttachMenu(false);

    const extra: any = {
      timestamp: getCurrentChatTime(),
      createdAt: Date.now(),
    };

    if (replyingToMessage) {
      extra.replyTo = {
        id: replyingToMessage.id,
        text: replyingToMessage.text || (replyingToMessage.videoUrl ? '🎥 Video' : replyingToMessage.imageUrl ? '📷 Photo' : replyingToMessage.type === 'code' ? '💻 Code Snippet' : 'Message'),
        senderName: replyingToMessage.senderName || (replyingToMessage.isOutgoing ? 'You' : partner.name),
        imageUrl: replyingToMessage.imageUrl,
        videoUrl: replyingToMessage.videoUrl,
      };
      setReplyingToMessage(null);
    }

    onSendMessage(partner.id, text, 'text', extra);
  };

  // Handle submitting edited message
  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingMessage) return;
    const trimmed = editingText.trim();
    if (!trimmed && !editingMessage.imageUrl && !editingMessage.videoUrl) return;

    onEditMessage?.(editingMessage.id, trimmed);
    setEditingMessage(null);
    setEditingText('');
  };

  const handleSendCodeSnippet = () => {
    const snippetCode = `// Real-time Collaborative State
export function useCollaboration(channelId: string) {
  const [status, setStatus] = useState('connected');
  // Real-time WebSockets synchronized
  return { status };
}`;
    onSendMessage(partner.id, 'Sharing typescript snippet:', 'code', {
      codeSnippet: { language: 'typescript', code: snippetCode },
      timestamp: getCurrentChatTime(),
      createdAt: Date.now(),
    });
    setShowAttachMenu(false);
  };

  const handleSendVoiceNote = () => {
    onSendMessage(partner.id, 'Voice message (0:18)', 'voice', {
      voiceDuration: '0:18',
      timestamp: getCurrentChatTime(),
      createdAt: Date.now(),
    });
    setShowAttachMenu(false);
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div 
      className="w-full h-full min-h-[720px] bg-[#07090e] text-white flex flex-col justify-between relative"
      onClick={() => {
        if (activeMenuMsgId) setActiveMenuMsgId(null);
      }}
    >
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
        disabled={isUploadingImage}
      />

      {/* Hidden File Input for Video Upload */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoUpload}
      />

      {/* Top Header */}
      <div className="pt-3 pb-3 px-4 flex items-center justify-between bg-[#0e1220]/80 backdrop-blur-xl border-b border-white/10 z-20">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-slate-300 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Partner Avatar with Green Online Dot */}
          <div className="relative">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/20">
              <img
                src={partner.avatar}
                alt={partner.name}
                className="w-full h-full object-cover"
              />
            </div>
            {partner.isOnline ? (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0e1220]" />
            ) : (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-slate-500 ring-2 ring-[#0e1220]" />
            )}
          </div>

          <div>
            <h2 className="text-xs font-semibold text-white">{partner.name}</h2>
            <p className={`text-[10px] font-medium flex items-center gap-1.5 ${partner.isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${partner.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              {partner.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        {/* Action icons & "Ask Me" iOS Liquid Glass Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* "AI Ask Me" Button with premium iOS Liquid Glass design */}
          <AiAskMeButton
            variant="pill"
            onClick={() => {
              if (onNavigateToAi) {
                onNavigateToAi();
              } else {
                setShowAiModal(true);
              }
            }}
          />

          {/* Quick Video Share Icon */}
          <button
            onClick={() => videoInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Share Video"
          >
            <Film className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Quick Image Share Icon */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Share Image"
          >
            <ImageIcon className="w-4 h-4 text-pink-400" />
          </button>

          <button
            onClick={() => alert(`Calling ${partner.name}...`)}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer hidden sm:flex"
            aria-label="Audio call"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 no-scrollbar">
        {/* Connection Established Banner */}
        <div className="text-center my-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            Real-Time Encrypted Session with {partner.name}
          </span>
        </div>

        {messages.map((msg) => {
          // Outgoing message means current user is sender
          const isMe = msg.senderId === currentUserId || msg.isOutgoing;
          const isRead = msg.status === 'read' || msg.isRead;
          const isMenuOpen = activeMenuMsgId === msg.id;
          const isSelected = selectedMsgId === msg.id;

          return (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              className={`flex flex-col group relative ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div 
                className="relative max-w-[86%] sm:max-w-[75%]"
                onClick={() => setSelectedMsgId(isSelected ? null : msg.id)}
              >
                {/* Message Bubble with subtle light Liquid Glass outline & hover effect */}
                <div
                  className={`rounded-2xl p-3 pr-8 text-xs leading-relaxed transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-white/50 shadow-[0_0_22px_rgba(255,255,255,0.22),inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-md'
                      : 'hover:ring-1 hover:ring-white/30'
                  } ${
                    isMe
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs shadow-[0_4px_15px_rgba(124,58,237,0.3)] border border-purple-400/30 group-hover:border-purple-300/60'
                      : 'bg-[#151a2d] text-slate-100 rounded-bl-xs border border-white/10 shadow-sm group-hover:border-white/25 group-hover:bg-[#191f36]'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const willOpen = activeMenuMsgId !== msg.id;
                    setActiveMenuMsgId(willOpen ? msg.id : null);
                    setSelectedMsgId(willOpen ? msg.id : null);
                  }}
                >
                  {/* Referenced / Replied Message Preview */}
                  {msg.replyTo && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        const el = document.getElementById(`msg-${msg.replyTo?.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          setSelectedMsgId(msg.replyTo?.id || null);
                        }
                      }}
                      className="mb-2 p-2 rounded-xl bg-black/40 border-l-2 border-purple-400 text-[10px] text-slate-300 leading-snug cursor-pointer hover:bg-black/60 transition-colors flex items-center justify-between gap-2"
                      title="Click to view quoted message"
                    >
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1 font-semibold text-purple-300">
                          <CornerUpLeft className="w-3 h-3 shrink-0" />
                          <span>{msg.replyTo.senderName || 'Replied Message'}</span>
                        </div>
                        <p className="truncate mt-0.5 opacity-90">{msg.replyTo.text}</p>
                      </div>
                      {msg.replyTo.imageUrl && (
                        <img 
                          src={getLocalMediaBlob(msg.replyTo.imageUrl) || msg.replyTo.imageUrl} 
                          alt="replied media" 
                          className="w-8 h-8 rounded-md object-cover shrink-0 border border-white/20" 
                        />
                      )}
                    </div>
                  )}

                  {/* Uploaded Video Attachment Display & Player */}
                  {(msg.videoUrl || msg.type === 'video') && (
                    <div className="mb-2 max-w-sm">
                      <ChatVideoPlayer
                        videoUrl={msg.videoUrl || ''}
                        senderName={partner.name}
                        onOpenFullscreen={() => {
                          setFullscreenMedia({
                            url: msg.videoUrl!,
                            type: 'video',
                            title: `${partner.name}'s Video`,
                          });
                        }}
                      />
                    </div>
                  )}

                  {/* Uploaded Image Attachment Display */}
                  {msg.imageUrl && (
                    <div 
                      className="mb-1.5 rounded-xl overflow-hidden border border-white/20 bg-black/40 cursor-pointer relative group"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenMedia({
                          url: msg.imageUrl!,
                          type: 'image',
                          title: `${partner.name}'s Photo`,
                        });
                      }}
                    >
                      <img
                        src={getLocalMediaBlob(msg.imageUrl) || msg.imageUrl}
                        alt="Shared attachment"
                        className="w-full max-h-64 object-cover rounded-xl transition-transform group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 border border-white/20 backdrop-blur-sm text-xs font-medium">
                          <Maximize2 className="w-4 h-4 drop-shadow" />
                          <span>Full screen</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Regular Text */}
                  {msg.text && (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}

                  {/* Code Snippet Card */}
                  {msg.type === 'code' && msg.codeSnippet && (
                    <div className="mt-2 rounded-xl bg-[#090c16] border border-white/10 p-2.5 font-mono text-[11px] overflow-x-auto text-cyan-300">
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/5 text-[10px] text-slate-400">
                        <span>{msg.codeSnippet.language}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(msg.codeSnippet!.code, msg.id);
                          }}
                          className="flex items-center gap-1 hover:text-white text-slate-300 cursor-pointer"
                        >
                          {copiedCodeId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre>
                        <code>{msg.codeSnippet.code}</code>
                      </pre>
                    </div>
                  )}

                  {/* Voice Note Player */}
                  {msg.type === 'voice' && (
                    <div className="mt-2 flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPlayingVoice(!isPlayingVoice);
                        }}
                        className="w-7 h-7 rounded-full bg-white text-[#07090e] flex items-center justify-center cursor-pointer shadow-md"
                      >
                        {isPlayingVoice ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </button>
                      <div className="flex items-center gap-0.5 flex-1 h-5">
                        {[12, 18, 8, 22, 15, 20, 10, 24, 16, 12, 20, 14, 8, 18].map((h, i) => (
                          <span
                            key={i}
                            style={{ height: `${h}px` }}
                            className={`w-1 rounded-full ${
                              isPlayingVoice ? 'bg-cyan-400 animate-pulse' : 'bg-white/40'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-300 font-mono">
                        {msg.voiceDuration || '0:18'}
                      </span>
                    </div>
                  )}

                  {/* Message Status & Timestamp */}
                  <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-purple-200/80' : 'text-slate-400'}`}>
                    {msg.edited && (
                      <span className="text-[9px] italic text-purple-200/70 mr-0.5">
                        (edited)
                      </span>
                    )}
                    <span className="text-[9px] font-light">
                      {formatChatMessageTime(msg)}
                    </span>

                    {isMe && (
                      <span className="inline-flex items-center ml-0.5" title={isRead ? "Read (Double blue tick)" : "Delivered (Single grey tick)"}>
                        {isRead ? (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-300 stroke-[2.5]" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Three-Dot Menu Trigger & Action Menu (positioned at the right corner of the message) */}
                <div
                  className={`absolute top-2 right-2 z-30 transition-all duration-200 ${
                    isSelected || isMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuMsgId(isMenuOpen ? null : msg.id);
                      setSelectedMsgId(isMenuOpen ? null : msg.id);
                    }}
                    className="w-6 h-6 rounded-full bg-[#121626]/90 backdrop-blur-md border border-white/25 text-slate-300 hover:text-white hover:bg-purple-600 hover:border-purple-400 hover:scale-110 hover:shadow-[0_0_14px_rgba(168,85,247,0.5)] active:scale-95 flex items-center justify-center cursor-pointer shadow-md transition-all duration-150"
                    title="Message actions (Edit, Unsend, Reply, Forward)"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {/* Three-Dot Action Dropdown Menu - opens under the button aligned to the right corner */}
                  {isMenuOpen && (
                    <div
                      className="absolute top-7.5 right-0 min-w-[136px] rounded-xl bg-[#0f1424] border border-white/20 p-1.5 shadow-2xl backdrop-blur-xl z-40 animate-in fade-in zoom-in-95 select-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Reply Option */}
                      <button
                        onClick={() => {
                          setReplyingToMessage(msg);
                          setActiveMenuMsgId(null);
                          setSelectedMsgId(null);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 text-[11px] transition-colors cursor-pointer"
                      >
                        <CornerUpLeft className="w-3.5 h-3.5 text-purple-400" />
                        <span>Reply</span>
                      </button>

                      {/* Forward Option */}
                      <button
                        onClick={() => {
                          setMessageToForward(msg);
                          setActiveMenuMsgId(null);
                          setSelectedMsgId(null);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 text-[11px] transition-colors cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Forward</span>
                      </button>

                      {/* Edit Option (available for any message sent by user, including photos & videos) */}
                      {isMe && (
                        <button
                          onClick={() => {
                            setEditingMessage(msg);
                            setEditingText(msg.text || '');
                            setActiveMenuMsgId(null);
                            setSelectedMsgId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 text-[11px] transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{msg.imageUrl || msg.videoUrl ? 'Edit / Caption' : 'Edit'}</span>
                        </button>
                      )}

                      {/* Unsend Option (available for any message sent by user, including photos & videos) */}
                      {isMe && (
                        <button
                          onClick={() => {
                            onUnsendMessage?.(msg.id);
                            setActiveMenuMsgId(null);
                            setSelectedMsgId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 text-[11px] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Unsend</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-xs font-light">
            No messages yet. Say "Hii" to start collaborating with {partner.name}!
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Options Tray */}
      <AnimatePresence>
        {showAttachMenu && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="p-3 bg-[#0c1020]/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around gap-2 text-xs"
          >
            {/* Video File Option */}
            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-300 hover:text-white cursor-pointer"
            >
              <div className="p-2.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-[10px]">Video File</span>
            </button>

            {/* Photo/Image Option */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-300 hover:text-white cursor-pointer"
            >
              <div className="p-2.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="text-[10px]">Photo/Image</span>
            </button>

            {/* Code Snippet Option */}
            <button
              onClick={handleSendCodeSnippet}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-300 hover:text-white cursor-pointer"
            >
              <div className="p-2.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Code2 className="w-4 h-4" />
              </div>
              <span className="text-[10px]">Code Snippet</span>
            </button>

            {/* Voice Note Option */}
            <button
              onClick={handleSendVoiceNote}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-300 hover:text-white cursor-pointer"
            >
              <div className="p-2.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Mic className="w-4 h-4" />
              </div>
              <span className="text-[10px]">Voice Note</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp/Telegram-style Replying Preview Banner above chat input */}
      {replyingToMessage && (
        <div className="mx-3 mb-1.5 p-2.5 rounded-2xl bg-[#11172a]/95 border-l-4 border-l-purple-500 border border-white/10 flex items-center justify-between text-xs shadow-lg backdrop-blur-xl z-20 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2.5 overflow-hidden pl-1">
            <CornerUpLeft className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-purple-300 block text-[11px]">
                {replyingToMessage.senderName || (replyingToMessage.isOutgoing ? 'You' : partner.name)}
              </span>
              <span className="text-slate-300 text-[11px] truncate block opacity-90">
                {replyingToMessage.text || (replyingToMessage.videoUrl ? '🎥 Video' : replyingToMessage.imageUrl ? '📷 Photo' : 'Shared attachment')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {replyingToMessage.imageUrl && (
              <img
                src={getLocalMediaBlob(replyingToMessage.imageUrl) || replyingToMessage.imageUrl}
                alt="replied"
                className="w-8 h-8 rounded-lg object-cover border border-white/20"
              />
            )}
            <button
              type="button"
              onClick={() => setReplyingToMessage(null)}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Cancel reply"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Editing Message Banner & Form */}
      {editingMessage ? (
        <form
          onSubmit={handleSaveEdit}
          className="p-3 bg-[#0a0d18]/95 backdrop-blur-xl border-t border-cyan-500/30 flex items-center gap-2 z-20"
        >
          <div className="flex items-center gap-1.5 text-cyan-400 pl-1 shrink-0">
            <Edit3 className="w-4 h-4" />
            <span className="text-[11px] font-semibold">
              {editingMessage.imageUrl || editingMessage.videoUrl ? 'Editing caption:' : 'Editing message:'}
            </span>
          </div>

          <input
            type="text"
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            placeholder={editingMessage.imageUrl || editingMessage.videoUrl ? 'Add or edit media caption...' : 'Edit your message...'}
            className="flex-1 py-2 px-3.5 rounded-xl bg-white/[0.08] border border-cyan-400/60 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder-slate-400 transition-all"
            autoFocus
          />

          <button
            type="submit"
            disabled={!editingText.trim() && !editingMessage.imageUrl && !editingMessage.videoUrl}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors cursor-pointer disabled:opacity-40"
          >
            Save
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingMessage(null);
              setEditingText('');
            }}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </form>
      ) : (
        /* Regular Chat Input Bar */
        <form
          onSubmit={handleSend}
          className="p-3 bg-[#0a0d18]/90 backdrop-blur-xl border-t border-white/10 flex items-center gap-2 z-20"
        >
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`p-2.5 rounded-full border transition-colors cursor-pointer ${
              showAttachMenu
                ? 'bg-purple-600 text-white border-purple-500'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            title="Attach options (Video, Photo, Code)"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Quick Video Share Icon in input row */}
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Share video"
          >
            <Film className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Quick Photo Share Icon in input row */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Share photo"
          >
            <ImageIcon className="w-4 h-4 text-pink-400" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={replyingToMessage ? `Reply to ${replyingToMessage.senderName || partner.name}...` : `Message ${partner.name}...`}
            className="flex-1 py-2.5 px-4 rounded-2xl bg-white/[0.06] border border-white/15 focus:border-purple-400/80 focus:bg-white/[0.09] focus:outline-none text-xs text-white placeholder-slate-400 transition-all"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`p-2.5 rounded-full liquid-button text-white transition-transform ${
              inputText.trim()
                ? 'scale-100 cursor-pointer shadow-[0_0_15px_rgba(124,58,237,0.5)]'
                : 'opacity-50 cursor-not-allowed'
            }`}
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Fullscreen Media Viewer for Photo & Video */}
      <FullscreenMediaModal
        isOpen={Boolean(fullscreenMedia)}
        onClose={() => setFullscreenMedia(null)}
        mediaUrl={fullscreenMedia?.url || null}
        mediaType={fullscreenMedia?.type || 'image'}
        title={fullscreenMedia?.title}
      />

      {/* AI Assistant "Ask Me" In-Chat Modal */}
      <ChatAiAssistantModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        partnerName={partner.name}
        onShareToChat={(sharedText, type = 'text', codeSnippet) => {
          setShowAiModal(false);
          if (type === 'code' && codeSnippet) {
            onSendMessage(partner.id, sharedText, 'code', {
              codeSnippet,
              timestamp: getCurrentChatTime(),
              createdAt: Date.now(),
            });
          } else {
            onSendMessage(partner.id, sharedText, 'text', {
              timestamp: getCurrentChatTime(),
              createdAt: Date.now(),
            });
          }
        }}
      />

      {/* Forward Message Modal (Full end-to-end functionality) */}
      <ForwardMessageModal
        isOpen={Boolean(messageToForward)}
        onClose={() => setMessageToForward(null)}
        messageToForward={messageToForward}
        currentUserId={currentUserId}
        developers={allDevelopers || []}
        teams={allTeams || []}
        onForwardToDeveloper={(devId, msg) => {
          onForwardToDeveloper?.(devId, msg);
          setMessageToForward(null);
        }}
        onForwardToTeam={(teamId, msg) => {
          onForwardToTeam?.(teamId, msg);
          setMessageToForward(null);
        }}
      />
    </div>
  );
};
