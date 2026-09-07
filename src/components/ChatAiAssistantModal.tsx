import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, X, Send, Bot, User, Copy, Check, Share2, 
  Code2, HelpCircle, Bug, FileCode, MessageCircle, Globe2, RefreshCw, Play 
} from 'lucide-react';
import { BrowserPreviewModal } from './BrowserPreviewModal';

interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface ChatAiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareToChat?: (text: string, type?: 'text' | 'code', codeSnippet?: { language: string; code: string }) => void;
  partnerName: string;
}

const QUICK_PROMPTS = [
  { label: '🐞 Debug code', prompt: 'I have a bug in my code. Can you help me find what is wrong and fix it?' },
  { label: '📁 Full code file', prompt: 'Can you generate a complete, production-ready code file with all imports and logic?' },
  { label: '🗣️ Tamil / Tanglish', prompt: 'Deii machan, unala Tamil / Tanglish la fluently pesa mudiyuma? Enaku coding la help venum da.' },
  { label: '👋 Friendly chat', prompt: 'Hey bro! How is it going today? Just wanted to have a friendly chat.' },
];

export const ChatAiAssistantModal: React.FC<ChatAiAssistantModalProps> = ({
  isOpen,
  onClose,
  onShareToChat,
  partnerName,
}) => {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'welcome-ai-1',
      role: 'assistant',
      text: `Vanakkam & Hello! 👋 I'm your Chatbot coding companion and developer partner.\n\nI speak and understand **any language** you prefer — English, தமிழ், Tanglish, Hindi, and more!\n\nHere is how I can help right here inside your chat:\n• **Code & Debugging**: Paste errors or broken logic for clear diagnosis and verified solutions.\n• **Full Code Files**: Ask for full, complete runnable files rather than snippets.\n• **Clarification First**: If a problem is missing context, I'll ask clarifying questions before jumping to assumptions.\n• **Casual & Friendly**: We can chat casually just like developer friends sitting together.\n\nWhat are you working on or thinking about right now?`,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);

  // Live code preview state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const [previewLanguage, setPreviewLanguage] = useState('html');
  const [previewTitle, setPreviewTitle] = useState('Live Web Preview');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: AiMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for multi-turn understanding
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome-ai-1')
        .concat(userMsg)
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
      const replyText = data.reply || "I'm right here! Could you please clarify what you'd like to work on?";

      const aiReply: AiMessage = {
        id: 'ai-' + Date.now(),
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error('AI chat failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-err-' + Date.now(),
          role: 'assistant',
          text: "I ran into a temporary network issue connecting to my brain. Please try asking again in a second!",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareToPartner = (text: string, id: string) => {
    if (!onShareToChat) return;

    // Check if there is a code block inside the text
    const codeMatch = text.match(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/);
    if (codeMatch) {
      const language = codeMatch[1] || 'typescript';
      const code = codeMatch[2].trim();
      onShareToChat(`AI Solution for ${partnerName}:`, 'code', { language, code });
    } else {
      onShareToChat(text, 'text');
    }

    setSharedId(id);
    setTimeout(() => setSharedId(null), 2000);
  };

  // Helper to render markdown text with formatted code blocks
  const renderMessageContent = (text: string, messageId: string) => {
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
        language: match[1] || 'code',
        content: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }

    if (parts.length === 0) {
      return <p className="whitespace-pre-wrap">{text}</p>;
    }

    return (
      <div className="space-y-2.5">
        {parts.map((p, idx) => {
          if (p.type === 'text') {
            return (
              <p key={idx} className="whitespace-pre-wrap leading-relaxed text-xs">
                {p.content}
              </p>
            );
          }

          const codeBlockId = `${messageId}-code-${idx}`;
          return (
            <div
              key={idx}
              className="rounded-xl bg-[#07090f] border border-purple-500/20 overflow-hidden shadow-md my-2"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-purple-950/30 border-b border-purple-500/10 text-[10px] text-purple-300 font-mono">
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3 h-3 text-cyan-400" />
                  {p.language || 'code'}
                </span>
                <div className="flex items-center gap-2.5">
                  {/* Live Run / Preview Button */}
                  <button
                    onClick={() => {
                      setPreviewCode(p.content);
                      setPreviewLanguage(p.language || 'html');
                      setPreviewTitle(`${p.language ? p.language.toUpperCase() : 'Code'} Live Preview`);
                      setPreviewModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-emerald-300 hover:text-emerald-200 transition-colors cursor-pointer"
                    title="Run or preview this code live in sandboxed browser"
                  >
                    <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                    <span className="font-sans font-medium text-[10px]">Run / Preview</span>
                  </button>

                  <button
                    onClick={() => handleCopy(p.content, codeBlockId)}
                    className="flex items-center gap-1 hover:text-white text-slate-300 transition-colors cursor-pointer"
                    title="Copy full code"
                  >
                    {copiedId === codeBlockId ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-sans">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="font-sans">Copy</span>
                      </>
                    )}
                  </button>

                  {onShareToChat && (
                    <button
                      onClick={() => handleShareToPartner(p.content, `${codeBlockId}-share`)}
                      className="flex items-center gap-1 hover:text-white text-purple-300 transition-colors cursor-pointer"
                      title={`Send code into chat with ${partnerName}`}
                    >
                      {sharedId === `${codeBlockId}-share` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-sans">Shared</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3 h-3 text-purple-400" />
                          <span className="font-sans">Share to Chat</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <pre className="p-3 font-mono text-[11px] text-cyan-200 overflow-x-auto leading-relaxed max-h-80 selection:bg-purple-600/40">
                <code>{p.content}</code>
              </pre>
            </div>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-40 flex flex-col bg-[#07090e]/95 backdrop-blur-2xl text-white">
        {/* iOS Liquid Glass Header */}
        <div className="p-3.5 px-4 bg-[#0e1222]/90 backdrop-blur-xl border-b border-purple-500/20 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full liquid-pill flex items-center justify-center border border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-semibold text-white tracking-wide">
                  Chatbot
                </h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-medium">
                  Ask Me
                </span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Globe2 className="w-3 h-3 text-cyan-400 inline" />
                <span>Speaks Tamil, Tanglish, English & any language</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setMessages((prev) => [prev[0]]);
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Clear AI conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Return to partner chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2 px-3 bg-[#0a0d18]/70 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip.prompt)}
              className="px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap bg-white/[0.05] hover:bg-purple-600/30 hover:border-purple-400/40 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer shadow-xs shrink-0"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
          {messages.map((msg) => {
            const isAi = msg.role === 'assistant';

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  {isAi ? (
                    <>
                      <Bot className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-[10px] font-semibold text-purple-300">Chatbot</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-semibold text-indigo-300">You</span>
                      <User className="w-3 h-3 text-indigo-400" />
                    </>
                  )}
                  <span className="text-[9px] text-slate-500 ml-1">{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    isAi
                      ? 'liquid-glass text-slate-100 rounded-tl-xs border border-purple-400/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs shadow-[0_4px_15px_rgba(124,58,237,0.35)] border border-purple-400/30'
                  }`}
                >
                  {renderMessageContent(msg.text, msg.id)}

                  {/* Actions under AI messages */}
                  {isAi && (
                    <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-white/10 text-[10px] text-slate-400">
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Answer</span>
                          </>
                        )}
                      </button>

                      {onShareToChat && (
                        <button
                          onClick={() => handleShareToPartner(msg.text, msg.id + '-share')}
                          className="flex items-center gap-1 hover:text-purple-300 text-purple-400 transition-colors cursor-pointer"
                        >
                          {sharedId === msg.id + '-share' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Sent to Chat</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3 h-3" />
                              <span>Share with {partnerName}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Typing / Thinking indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs text-purple-300 bg-purple-950/30 border border-purple-500/20 px-3 py-2 rounded-xl w-fit"
            >
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[11px]">Chatbot is thinking & writing...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-[#0a0d18]/90 backdrop-blur-xl border-t border-white/10 flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask coding questions in English, தமிழ், Tanglish..."
            className="flex-1 py-2.5 px-4 rounded-2xl bg-white/[0.06] border border-white/15 focus:border-purple-400 focus:bg-white/[0.09] focus:outline-none text-xs text-white placeholder-slate-400 transition-all"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-full liquid-button text-white transition-all ${
              input.trim() && !isLoading
                ? 'scale-100 cursor-pointer shadow-[0_0_15px_rgba(124,58,237,0.5)]'
                : 'opacity-40 cursor-not-allowed'
            }`}
            title="Send to AI"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Sandboxed Interactive Browser Preview Modal */}
        <BrowserPreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          code={previewCode}
          language={previewLanguage}
          title={previewTitle}
        />
      </div>
    </AnimatePresence>
  );
};
