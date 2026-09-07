import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, SlidersHorizontal, Star, Check, UserPlus, Clock, MessageSquare, Sparkles } from 'lucide-react';
import { Developer } from '../types';

interface DiscoverScreenProps {
  developers: Developer[];
  onSelectDeveloper: (dev: Developer) => void;
  onConnectDeveloper: (devId: string) => void;
  onOpenChatWith: (dev: Developer) => void;
}

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  developers,
  onSelectDeveloper,
  onConnectDeveloper,
  onOpenChatWith,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filterCategories = [
    'All',
    'Frontend',
    'Backend',
    'Full Stack',
    'Flutter',
    'Swift',
    'Kotlin',
    'Python',
    'AI',
    'UI/UX',
    'Remote Collaboration',
  ];

  const filteredDevelopers = developers.filter((dev) => {
    const matchesSearch =
      dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      dev.location.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Frontend') return dev.role.includes('Frontend') || dev.skills.includes('React');
    if (selectedFilter === 'Backend') return dev.role.includes('Backend') || dev.skills.includes('Node.js') || dev.skills.includes('Python');
    if (selectedFilter === 'Full Stack') return dev.role.includes('Full Stack');
    if (selectedFilter === 'UI/UX') return dev.role.includes('UI/UX') || dev.role.includes('Designer');
    if (selectedFilter === 'Python') return dev.skills.includes('Python');
    if (selectedFilter === 'AI') return dev.role.includes('AI') || dev.skills.includes('PyTorch');
    if (selectedFilter === 'Remote Collaboration') return true;

    return dev.skills.some((s) => s.toLowerCase().includes(selectedFilter.toLowerCase()));
  });

  return (
    <div className="w-full pb-28 text-white">
      {/* Header */}
      <div className="pt-3 pb-2 px-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">Discover</h1>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Connect with top developers worldwide
          </p>
        </div>

        {/* AI Smart Match recommendation trigger badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Match Active</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-5 mt-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by skills, roles, technologies..."
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 focus:border-purple-400/60 focus:bg-white/[0.09] focus:outline-none text-xs text-white placeholder-slate-400 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
          />
          <button className="absolute right-3 p-1 text-slate-400 hover:text-white">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="mt-4 px-5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {filterCategories.map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)] border border-purple-400/30'
                    : 'bg-white/[0.06] text-slate-400 hover:text-slate-200 border border-white/10 hover:bg-white/[0.1]'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Developers List matching Screenshot 5 */}
      <div className="mt-5 px-5 space-y-3">
        {filteredDevelopers.map((dev) => (
          <motion.div
            key={dev.id}
            whileHover={{ y: -2 }}
            className="p-3.5 rounded-2xl liquid-glass border border-white/10 flex items-center justify-between gap-3 hover:border-purple-500/30 transition-all cursor-pointer"
            onClick={() => onSelectDeveloper(dev)}
          >
            {/* Avatar & Online Dot */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-1 ring-white/20">
                <img src={dev.avatar} alt={dev.name} className="w-full h-full object-cover" />
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-[#07090e] ${
                  dev.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
            </div>

            {/* Middle Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-semibold text-white truncate">{dev.name}</h3>
                {dev.verified && (
                  <span className="w-3.5 h-3.5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[9px] font-bold">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 truncate mt-0.5 font-light">{dev.role}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                {dev.skills.slice(0, 3).join(' • ')}
              </p>
            </div>

            {/* Right Action & Rating */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-1 text-[11px] text-amber-300 font-medium">
                <Star className="w-3 h-3 fill-current text-amber-400" />
                <span>{dev.rating}</span>
              </div>

              {/* Connect / Connected Button */}
              {dev.connectionStatus === 'connected' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenChatWith(dev);
                  }}
                  className="px-3 py-1 rounded-full text-[11px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 flex items-center gap-1 cursor-pointer transition-all"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Chat</span>
                </button>
              ) : dev.connectionStatus === 'pending' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onConnectDeveloper(dev.id);
                  }}
                  className="px-3 py-1 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Clock className="w-3 h-3" />
                  <span>Pending</span>
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onConnectDeveloper(dev.id);
                  }}
                  className="px-3.5 py-1 rounded-full text-[11px] font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)] hover:brightness-110 flex items-center gap-1 cursor-pointer transition-all"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Connect</span>
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {filteredDevelopers.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            No developers found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};
