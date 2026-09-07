import React from 'react';
import { motion } from 'motion/react';
import { Home, Search, FolderKanban, MessageSquare, User } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  unreadMessagesCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadMessagesCount,
}) => {
  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Search },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 pointer-events-none">
      {/* iOS Liquid Glass Pill Container */}
      <nav
        aria-label="Bottom Navigation"
        className="pointer-events-auto w-full py-1.5 px-2 rounded-full bg-slate-900/60 dark:bg-black/70 backdrop-blur-2xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-between"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full cursor-pointer transition-colors duration-200 select-none"
            >
              {/* Subtle iOS Liquid Glass active sliding pill - no colorful rainbow, pure liquid glass */}
              {isActive && (
                <motion.div
                  layoutId="liquidGlassHighlight"
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 32,
                    mass: 0.8,
                  }}
                  className="absolute inset-0 rounded-full bg-white/[0.14] border border-white/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-md"
                />
              )}

              {/* Icon & Label */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  />
                  {/* iOS Style Unread message badge */}
                  {tab.id === 'messages' && unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-[#ff3b30] text-[9px] font-bold text-white flex items-center justify-center shadow-sm">
                      {unreadMessagesCount}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] mt-0.5 tracking-tight transition-colors duration-200 ${
                    isActive ? 'text-white font-semibold' : 'text-slate-400 font-normal'
                  }`}
                >
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

