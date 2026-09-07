import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, Heart, MessageCircle, Bookmark, Share2, ExternalLink, 
  Github, Linkedin, Twitter, Sparkles, UserPlus, Check, MessageSquare, Clock
} from 'lucide-react';
import { Developer } from '../types';

interface DeveloperCardModalProps {
  developer: Developer | null;
  isOpen: boolean;
  onClose: () => void;
  onConnect: (devId: string) => void;
  onOpenChat: (dev: Developer) => void;
  currentUserId?: string;
}

export const DeveloperCardModal: React.FC<DeveloperCardModalProps> = ({
  developer,
  isOpen,
  onClose,
  onConnect,
  onOpenChat,
  currentUserId,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(14);

  if (!isOpen || !developer) return null;

  const isMe = currentUserId === developer.id;

  const toggleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      {/* Liquid Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm rounded-[32px] bg-[#0c101e]/90 backdrop-blur-2xl border border-white/20 p-6 text-white shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.3)] overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors z-20 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-28 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />

        {/* Side Floating Action Rail (Right) */}
        <div className="absolute right-4 bottom-24 flex flex-col items-center gap-3 z-20">
          <button
            onClick={toggleLike}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className={`p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 transition-transform group-hover:scale-110 ${
              isLiked ? 'text-pink-500 bg-pink-500/20' : 'text-slate-300'
            }`}>
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 font-mono">{likesCount}</span>
          </button>

          {!isMe && (
            <button
              onClick={() => onOpenChat(developer)}
              className="p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:scale-110 transition-transform text-slate-300 hover:text-cyan-300 cursor-pointer"
              title="Open Chat"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:scale-110 transition-transform cursor-pointer ${
              isBookmarked ? 'text-amber-400 bg-amber-400/20' : 'text-slate-300'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={() => alert(`Shared developer card for ${developer.name}!`)}
            className="p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:scale-110 transition-transform text-slate-300 hover:text-white cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Main Card Content */}
        <div className="flex flex-col items-center text-center mt-2 pr-10">
          {/* Avatar with Ring & Online status */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full p-[2.5px] bg-gradient-to-tr from-purple-500 via-pink-500 to-cyan-400 shadow-[0_0_30px_rgba(124,58,237,0.5)]">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#07090e]">
                <img
                  src={developer.avatar}
                  alt={developer.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {developer.isOnline && (
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-[#0c101e]" />
            )}
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5">
            <h2 className="text-xl font-serif font-bold text-white tracking-wide">
              {developer.name}
            </h2>
            {isMe && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/30">
                You
              </span>
            )}
          </div>
          
          <p className="text-xs text-slate-300 font-light mt-0.5">
            {developer.role}
          </p>

          {/* Connection Status Banner */}
          {!isMe && (
            <div className="mt-2.5">
              {developer.connectionStatus === 'connected' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                  Connected Partner
                </span>
              )}
              {developer.connectionStatus === 'pending' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Connection Request Pending
                </span>
              )}
              {developer.connectionStatus === 'received' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Sent you a connection request
                </span>
              )}
            </div>
          )}

          {/* Technical Specs List */}
          <div className="w-full text-left mt-4 space-y-2.5 text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                BIO
              </span>
              <p className="text-slate-200 font-light text-[11px] line-clamp-2">{developer.bio || 'Coding Partner member'}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                  LOCATION
                </span>
                <p className="text-slate-200 font-medium text-[11px]">{developer.location || 'Global'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                  STATUS
                </span>
                <p className="text-emerald-400 text-[11px] font-medium">{developer.isOnline ? 'Active Now 🟢' : 'Offline'}</p>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                STACK
              </span>
              <div className="flex flex-wrap gap-1">
                {developer.skills.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.08] text-slate-200 border border-white/10 font-mono"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Social Icons row */}
          <div className="flex items-center gap-3 mt-4">
            <a
              href={developer.githubUrl || 'https://github.com'}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href={developer.linkedinUrl || 'https://linkedin.com'}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href={developer.twitterUrl || 'https://twitter.com'}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
          </div>

          {/* Primary Action Button: Connect / Chat / Request Pending */}
          <div className="w-full mt-5 space-y-2">
            {!isMe ? (
              <>
                {developer.connectionStatus === 'none' && (
                  <button
                    onClick={() => onConnect(developer.id)}
                    className="w-full py-3 px-4 rounded-xl liquid-button text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(124,58,237,0.4)] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Send Connect Request</span>
                  </button>
                )}

                {developer.connectionStatus === 'pending' && (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-semibold text-amber-300 flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Connect Request Pending...</span>
                  </button>
                )}

                {developer.connectionStatus === 'received' && (
                  <button
                    onClick={() => onConnect(developer.id)}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(16,185,129,0.4)] cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Accept Connection Request</span>
                  </button>
                )}

                {developer.connectionStatus === 'connected' && (
                  <button
                    onClick={() => onOpenChat(developer)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(16,185,129,0.4)] cursor-pointer transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat in Real-Time</span>
                  </button>
                )}
              </>
            ) : (
              <div className="py-2.5 px-4 rounded-xl bg-white/10 text-xs text-slate-300 font-medium">
                This is your active developer profile
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
