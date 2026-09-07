import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Bot, Code2, ArrowRight } from 'lucide-react';

interface AiAskMeButtonProps {
  onClick: () => void;
  variant?: 'floating' | 'pill' | 'banner' | 'compact';
  className?: string;
}

export const AiAskMeButton: React.FC<AiAskMeButtonProps> = ({
  onClick,
  variant = 'pill',
  className = '',
}) => {
  if (variant === 'floating') {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Ask Me Assistant"
        className={`fixed bottom-24 right-5 sm:right-8 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/80 dark:bg-black/85 backdrop-blur-2xl border border-white/25 text-white shadow-[0_12px_36px_rgba(124,58,237,0.4),inset_0_1px_1px_rgba(255,255,255,0.4),0_0_0_1px_rgba(255,255,255,0.15)] cursor-pointer group transition-all select-none ${className}`}
      >
        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-sm">
          <div className="w-full h-full rounded-full bg-[#0a0c16] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-black animate-ping" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold tracking-tight bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent group-hover:brightness-110">
            AI Ask Me
          </span>
          <span className="text-[9px] text-purple-300/80 font-normal leading-tight">
            Pair Programmer
          </span>
        </div>
      </motion.button>
    );
  }

  if (variant === 'banner') {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className={`relative overflow-hidden p-3.5 rounded-3xl bg-slate-900/60 dark:bg-black/70 backdrop-blur-2xl border border-white/20 shadow-[0_12px_36px_rgba(124,58,237,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)] cursor-pointer group transition-all ${className}`}
      >
        {/* Specular glass highlight reflection */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-purple-500/20 blur-2xl pointer-events-none group-hover:bg-purple-500/30 transition-all" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#0c0f1d] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
                  AI Ask Me
                </h4>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-medium">
                  iOS Liquid Glass
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-light mt-0.5 leading-snug">
                Ask coding questions in any language • Full working files & pair programming
              </p>
            </div>
          </div>

          <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white/20 border border-white/15 flex items-center justify-center text-slate-300 group-hover:text-white transition-all shrink-0">
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </motion.div>
    );
  }

  // Default 'pill' variant (for headers in ChatScreen, ProjectChatScreen, Top bar)
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`relative px-3.5 py-1.5 rounded-full bg-white/[0.12] hover:bg-white/[0.18] backdrop-blur-2xl border border-white/25 text-white shadow-[0_4px_20px_rgba(124,58,237,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] flex items-center gap-1.5 text-xs font-semibold tracking-tight transition-all cursor-pointer group active:scale-95 select-none ${className}`}
      title="Open AI Ask Me Assistant"
    >
      <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-sm">
        <Sparkles className="w-2.5 h-2.5 text-white animate-pulse" />
      </div>
      <span className="bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent font-medium">
        AI Ask Me
      </span>
    </motion.button>
  );
};
