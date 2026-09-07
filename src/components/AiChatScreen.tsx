import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Sparkles, Send, Copy, Check, Trash2, 
  Code2, Bug, FileCode, MessageSquare, Terminal, Globe,
  Play, Plus, PanelLeft, Share2, Clock, Search, X
} from 'lucide-react';
import { Developer } from '../types';
import { BrowserPreviewModal } from './BrowserPreviewModal';

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface AiChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: AiMessage[];
}

interface AiChatScreenProps {
  currentUser: Developer;
  onBack: () => void;
  onForwardSnippetToChat?: (snippet: { title: string; language: string; code: string }) => void;
}

const STORAGE_KEY = 'nexora_ai_chat_sessions_v2';

const QUICK_ACTIONS = [
  { 
    id: 'any_website',
    icon: Globe, 
    label: '🌐 Any Web Page / Site', 
    prompt: 'Please write complete, production-ready, beautiful HTML + Tailwind CSS code with responsive design and interactive elements for a: ' 
  },
  { 
    id: 'python',
    icon: Terminal, 
    label: '🐍 Complete Python Module', 
    prompt: 'Please write a complete, high-performance Python 3 module with comprehensive type hints (typing), docstrings, error handling, and a runnable __main__ demonstration for: ' 
  },
  { 
    id: 'full_react',
    icon: FileCode, 
    label: '⚛️ Full React & Tailwind', 
    prompt: 'Please write a complete, production-ready React component with TypeScript interfaces, custom state hooks, and responsive Tailwind CSS styling for: ' 
  },
  { 
    id: 'backend_go_rust',
    icon: Code2, 
    label: '🦀 Go / Rust / C++', 
    prompt: 'Please write a complete, idiomatic, and highly optimized code file in Go or Rust (with proper error handling, zero allocations in hot paths, and complete test cases) for: ' 
  },
  { 
    id: 'debug',
    icon: Bug, 
    label: '🐞 Deep Bug Fixer', 
    prompt: 'I have a bug in my code. Please analyze the root cause, explain why it failed, and provide the 100% complete fixed code without placeholders: ' 
  },
  { 
    id: 'tanglish',
    icon: Globe, 
    label: '🗣️ Tamil / Tanglish Dev', 
    prompt: 'Deii machan, Tamil / Tanglish la fluently pesitu enaku oru super clean coding solution kudu da.' 
  },
];

const createWelcomeMessage = (userName: string): AiMessage => ({
  id: `welcome-${Date.now()}`,
  role: 'assistant',
  text: `Vanakkam & Hello ${userName}! 👋 I am your **Chatbot Pair Programmer & Code Architect**.\n\nI provide **100% complete, fully implemented code** in all major programming languages with production quality, optimal time/space complexity, and zero lazy placeholders.\n\n✨ **Key Capabilities**:\n• 💻 **All Major Languages**: Python, TypeScript, React, Java, C++, Go, Rust, C#, SQL, Bash, Swift, PHP, and more.\n• 📁 **Complete Files Only**: Every response gives you the whole working file with all imports, types, and execution logic.\n• 🌐 **Multilingual & Tanglish**: Ask in English, தமிழ், Tanglish (*"deii machan code eludhu"*), Hindi, or any language.\n• ⚡ **Live Browser Previews**: Run and preview web applications immediately with the **Run / Preview** button.\n\nWhat code are we architecting today?`,
  timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
});

export const AiChatScreen: React.FC<AiChatScreenProps> = ({
  currentUser,
  onBack,
  onForwardSnippetToChat,
}) => {
  // Chat sessions state
  const [sessions, setSessions] = useState<AiChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved AI chat sessions:', e);
    }
    const initialSession: AiChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [createWelcomeMessage(currentUser.name)],
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || `session-${Date.now()}`;
  });

  // Sidebar toggle state (desktop & mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  const [searchFilter, setSearchFilter] = useState('');

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live code preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const [previewLanguage, setPreviewLanguage] = useState('html');
  const [previewTitle, setPreviewTitle] = useState('Live Web Preview');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get active session
  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  // Persist sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to persist AI chat sessions:', e);
    }
  }, [sessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [activeSessionId]);

  // Handle creating a brand new chat session (just like ChatGPT "+ New chat")
  const handleNewChat = () => {
    const newSession: AiChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [createWelcomeMessage(currentUser.name)],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput('');
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Switch active session
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Delete an individual chat session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      // If only one session left, reset it to new
      const resetSession: AiChatSession = {
        id: `session-${Date.now()}`,
        title: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [createWelcomeMessage(currentUser.name)],
      };
      setSessions([resetSession]);
      setActiveSessionId(resetSession.id);
      return;
    }

    const nextSessions = sessions.filter((s) => s.id !== sessionId);
    setSessions(nextSessions);
    if (activeSessionId === sessionId) {
      setActiveSessionId(nextSessions[0].id);
    }
  };

  // Clear all chat history
  const handleClearAllHistory = () => {
    if (confirm('Clear all AI chat history? This cannot be undone.')) {
      const freshSession: AiChatSession = {
        id: `session-${Date.now()}`,
        title: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [createWelcomeMessage(currentUser.name)],
      };
      setSessions([freshSession]);
      setActiveSessionId(freshSession.id);
    }
  };

  // Send message
  const handleSendMessage = async (customPrompt?: string) => {
    const query = (customPrompt || input).trim();
    if (!query || isLoading || !currentSession) return;

    const userMsg: AiMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
    };

    // Calculate auto title if this is the first user message in the session
    const isFirstUserMessage = !currentSession.messages.some((m) => m.role === 'user');
    const updatedTitle = isFirstUserMessage
      ? query.length > 32
        ? `${query.slice(0, 30)}...`
        : query
      : currentSession.title;

    const updatedSessionMessages = [...currentSession.messages, userMsg];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSession.id
          ? {
              ...s,
              title: updatedTitle,
              updatedAt: Date.now(),
              messages: updatedSessionMessages,
            }
          : s
      )
    );

    if (!customPrompt) setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for the AI endpoint
      const historyPayload = updatedSessionMessages
        .filter((m) => !m.id.startsWith('welcome-'))
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
        }),
      });

      const data = await res.json();
      const reply = data.reply || "I'm ready! Please share what code, algorithm, or feature you'd like to implement.";

      const aiMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? {
                ...s,
                updatedAt: Date.now(),
                messages: [...s.messages, aiMsg],
              }
            : s
        )
      );
    } catch (err) {
      console.error('[AI Chat Error]', err);
      const errAiMsg: AiMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        text: `I encountered a momentary connection issue. Please retry your request!`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? {
                ...s,
                messages: [...s.messages, errAiMsg],
              }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Render markdown text with code block detection, syntax header, line counts & copy button
  const renderMessageContent = (text: string, msgId: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const precedingText = text.substring(lastIndex, match.index);
      if (precedingText) {
        parts.push({ type: 'text', content: precedingText });
      }

      parts.push({
        type: 'code',
        language: match[1] || 'typescript',
        code: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }

    return (
      <div className="space-y-3">
        {parts.map((part, index) => {
          if (part.type === 'code') {
            const blockId = `${msgId}-code-${index}`;
            const lines = (part.code || '').split('\n').length;
            const lang = part.language || 'text';

            return (
              <div
                key={blockId}
                className="my-3 rounded-2xl overflow-hidden border border-white/20 bg-[#05070d]/95 shadow-2xl backdrop-blur-xl"
              >
                {/* Code Block Header (ChatGPT/iOS Liquid Glass Style) */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/[0.06] border-b border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-cyan-300 uppercase tracking-wider ml-1">
                      {lang}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      • {lines} {lines === 1 ? 'line' : 'lines'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Live Run / Preview Button */}
                    <button
                      onClick={() => {
                        setPreviewCode(part.code || '');
                        setPreviewLanguage(lang);
                        setPreviewTitle(`${lang.toUpperCase()} Live Sandbox`);
                        setPreviewModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                      title="Run or preview this code live in sandboxed browser"
                    >
                      <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                      <span>Run / Preview</span>
                    </button>

                    {/* Forward Snippet to Project or Private Chat */}
                    {onForwardSnippetToChat && (
                      <button
                        onClick={() => {
                          onForwardSnippetToChat({
                            title: `${lang.toUpperCase()} Snippet`,
                            language: lang,
                            code: part.code || '',
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Share this code snippet into team or user chat"
                      >
                        <Share2 className="w-3 h-3 text-purple-400" />
                        <span className="hidden sm:inline">Share to Chat</span>
                      </button>
                    )}

                    {/* Copy Full File */}
                    <button
                      onClick={() => copyCode(part.code || '', blockId)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedId === blockId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Code Content */}
                <div className="p-4 overflow-x-auto max-h-[500px] text-xs font-mono text-slate-200 leading-relaxed no-scrollbar select-text bg-[#03050a]/95">
                  <pre>
                    <code>{part.code}</code>
                  </pre>
                </div>
              </div>
            );
          }

          // Plain text formatting (headers, bold, lists)
          return (
            <div key={index} className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap select-text space-y-1.5">
              {part.content?.split('\n\n').map((para, pIdx) => {
                const formatted = para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                return (
                  <p 
                    key={pIdx} 
                    dangerouslySetInnerHTML={{ __html: formatted }} 
                    className="leading-relaxed"
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Filtered session list for chat history
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="w-full h-full min-h-[720px] bg-[#07090e] text-white flex relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ========================================================= */}
      {/* LEFT SIDEBAR: ChatGPT-style "+ New Chat" & Chat History */}
      {/* ========================================================= */}

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-[#0b0e18] border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-ml-72'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.35)]">
              <div className="w-full h-full bg-[#0a0c16] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-300" />
              </div>
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide">Chatbot</h2>
              <p className="text-[10px] text-slate-400">Pair Programmer</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close sidebar"
            >
              <X className="w-4 h-4 lg:hidden" />
              <PanelLeft className="w-4 h-4 hidden lg:block" />
            </button>
          </div>
        </div>

        {/* New Chat Button (ChatGPT Style) */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-between transition-all duration-200 shadow-md shadow-purple-900/30 hover:shadow-purple-700/40 cursor-pointer active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-white" />
              <span>New Chat</span>
            </div>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/90">
              Ctrl+N
            </span>
          </button>
        </div>

        {/* Chat History Search Filter */}
        {sessions.length > 3 && (
          <div className="px-3 pb-2">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 no-scrollbar">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Chat History</span>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No matching chats
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={`group relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/15 border border-purple-500/30 text-white font-medium shadow-[0_2px_10px_rgba(168,85,247,0.15)]'
                      : 'text-slate-300 hover:bg-white/[0.06] hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span className="truncate text-left">{session.title}</span>
                  </div>

                  {/* Delete chat button (revealed on hover or active) */}
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className={`p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 ml-1.5 ${
                      isActive ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10 bg-[#090b14] flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <span className="text-xs font-medium text-slate-200 truncate block">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {currentUser.title || 'Developer'}
              </span>
            </div>
          </div>

          <button
            onClick={handleClearAllHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Clear all chat history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CHAT AREA */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <div className="pt-3 pb-3 px-4 flex items-center justify-between bg-[#0e1220]/85 backdrop-blur-2xl border-b border-white/10 z-20 shadow-md">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle button */}
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              title="Toggle sidebar"
            >
              <PanelLeft className="w-4 h-4 text-purple-400" />
              <span className="text-[11px] hidden sm:inline font-medium">History</span>
            </button>

            {/* "+ New Chat" quick button in header */}
            <button
              onClick={handleNewChat}
              className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Start a new chat"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">New Chat</span>
            </button>

            {/* Current Chat Title */}
            <div className="flex items-center gap-2 ml-1">
              <span className="text-xs font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-xs">
                {currentSession?.title || 'Chatbot'}
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hidden sm:inline">
                All Major Languages
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </button>
          </div>
        </div>

        {/* Quick Prompts Bar (iOS Liquid Glass Pills) */}
        <div className="px-4 py-2.5 bg-[#0b0e1a]/60 backdrop-blur-md border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar z-10">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleSendMessage(action.prompt)}
                className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/15 text-slate-300 hover:text-white text-xs font-medium whitespace-nowrap transition-all duration-200 hover:scale-105 flex items-center gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5 text-purple-400" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar z-10">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                  {!isUser ? (
                    <span className="font-semibold text-purple-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Chatbot
                    </span>
                  ) : (
                    <span className="font-medium text-slate-300">You</span>
                  )}
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[95%] sm:max-w-[88%] rounded-3xl p-4 shadow-xl ${
                    isUser
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-sm shadow-[0_8px_25px_rgba(147,51,234,0.3)]'
                      : 'bg-[#121626]/90 border border-white/15 text-slate-100 rounded-bl-sm backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)]'
                  }`}
                >
                  {renderMessageContent(msg.text, msg.id)}
                </div>
              </motion.div>
            );
          })}

          {/* AI Typing / Generating Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-start"
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-purple-300">
                <Sparkles className="w-3 h-3 animate-spin" />
                <span>Generating complete, optimized solution...</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#121626]/90 border border-white/15 backdrop-blur-xl flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area (ChatGPT Style Floating Bar) */}
        <div className="p-4 bg-[#0a0c16]/90 backdrop-blur-2xl border-t border-white/10 z-20">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2.5 max-w-4xl mx-auto"
          >
            <div className="flex-1 min-h-[48px] max-h-40 rounded-2xl bg-white/[0.06] border border-white/20 p-2.5 focus-within:border-purple-400/60 focus-within:ring-2 focus-within:ring-purple-500/20 backdrop-blur-xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] transition-all flex items-center">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask any question in Python, TypeScript, React, Java, C++, Go, Rust, Tanglish..."
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-400 resize-none focus:outline-none leading-relaxed no-scrollbar"
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-lg shrink-0 ${
                input.trim() && !isLoading
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white hover:scale-105 shadow-[0_4px_20px_rgba(147,51,234,0.4)]'
                  : 'bg-white/10 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-2 text-center text-[10px] text-slate-400">
            Provides complete runnable code files without placeholders • Supports Tanglish & multilingual chat
          </div>
        </div>
      </main>

      {/* Sandboxed Interactive Browser Preview Modal */}
      <BrowserPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        code={previewCode}
        language={previewLanguage}
        title={previewTitle}
      />
    </div>
  );
};
