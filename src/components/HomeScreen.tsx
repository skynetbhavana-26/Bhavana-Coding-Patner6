import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Bell, Search, SlidersHorizontal, Plus, Star, Users, 
  Heart, MessageCircle, Share2, Bookmark, Code, Sparkles, Check
} from 'lucide-react';
import { Developer, Project, FeedPost } from '../types';
import { uploadImageToBackend } from '../utils/upload';
import codingPartnerLogo from '../assets/image.png';

interface HomeScreenProps {
  currentUser: Developer;
  developers: Developer[];
  projects: Project[];
  posts: FeedPost[];
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onSelectDeveloper: (dev: Developer) => void;
  onConnectDeveloper: (devId: string) => void;
  onSelectProject: (project: Project) => void;
  onCreateProjectClick: () => void;
  onSeeAllDevelopers: () => void;
  onSeeAllProjects: () => void;
  onUpdateAvatar?: (newUrl: string) => void;
  onEditProfile?: () => void;
}

function formatLastActive(lastActive?: number, isOnline?: boolean): string {
  if (isOnline) return 'Online now';
  if (!lastActive) return 'Recently';
  const diffSec = Math.floor((Date.now() - lastActive) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentUser,
  developers,
  projects,
  posts,
  unreadNotifsCount,
  onOpenNotifications,
  onSelectDeveloper,
  onConnectDeveloper,
  onSelectProject,
  onCreateProjectClick,
  onSeeAllDevelopers,
  onSeeAllProjects,
  onUpdateAvatar,
  onEditProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({ 'post-2': true });
  const [isUploadingStory, setIsUploadingStory] = useState(false);

  const handleStoryImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateAvatar) return;
    try {
      setIsUploadingStory(true);
      const url = await uploadImageToBackend(file);
      onUpdateAvatar(url);
    } catch (err) {
      console.error('Failed to upload story image', err);
    } finally {
      setIsUploadingStory(false);
      e.target.value = '';
    }
  };

  const toggleLike = (postId: string) => {
    setLikedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Recently Logged-In other developers (sorted by online status, then most recent lastActive)
  const recentlyLoggedInDevelopers = developers
    .filter((d) => d.id !== currentUser.id)
    .sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return (b.lastActive || 0) - (a.lastActive || 0);
    })
    .filter(
      (d) =>
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.technologies.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full pb-28 text-white">
      {/* Top App Bar */}
      <div className="pt-3 pb-2 px-5 flex items-center justify-between">
        {/* Left: Brand Logo & User Name */}
        <div className="flex items-center gap-3">
          <img
            src={codingPartnerLogo}
            alt="Coding Partner Logo"
            className="w-10 h-10 object-contain shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/image.png';
            }}
          />
          <div>
            <h1 className="text-lg md:text-xl font-serif font-bold text-white tracking-tight">
              Hello, {currentUser.name}
            </h1>
            <p className="text-xs text-slate-400 font-light mt-0.5">Ready to code today?</p>
          </div>
        </div>

        {/* Action icons: Notifications & Profile Avatar */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNotifications}
            className="relative p-2.5 rounded-full bg-white/[0.07] border border-white/10 hover:bg-white/[0.12] transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-200" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-pink-500 ring-2 ring-[#07090e] animate-pulse" />
            )}
          </button>

          <button
            onClick={onEditProfile || (() => onSelectDeveloper(currentUser))}
            className="relative w-9 h-9 rounded-full ring-2 ring-purple-500/50 p-0.5 overflow-hidden transition-transform hover:scale-105 cursor-pointer group"
            title="Click to edit your profile"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-full h-full rounded-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-1 ring-[#07090e]" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-5 mt-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search developers, projects..."
            className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 focus:border-purple-400/60 focus:bg-white/[0.09] focus:outline-none text-xs text-white placeholder-slate-400 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
          />
          <button
            onClick={onSeeAllDevelopers}
            className="absolute right-2.5 p-1.5 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Developer Stories Row (Instagram Style) */}
      <div className="mt-4 px-5">
        <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1">
          {/* Your Story with Mobile Image Upload */}
          <label className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group relative">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleStoryImageSelect}
              disabled={isUploadingStory}
            />
            <div className="relative w-14 h-14 rounded-full p-0.5 border border-dashed border-purple-400/80 group-hover:border-purple-300 transition-colors">
              <img
                src={currentUser.avatar}
                alt="Your story"
                className="w-full h-full rounded-full object-cover"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] border border-[#07090e] shadow">
                {isUploadingStory ? '...' : '+'}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Your Story</span>
          </label>

          {/* Connected Developer Stories */}
          {developers.slice(0, 7).map((dev) => (
            <div
              key={dev.id}
              onClick={() => onSelectDeveloper(dev)}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
            >
              <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-purple-500 via-pink-500 to-cyan-400 group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full p-0.5 bg-[#07090e]">
                  <img
                    src={dev.avatar}
                    alt={dev.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-[10px] text-slate-300 max-w-[58px] truncate font-medium">
                {dev.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recently Logged-In Section */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase text-slate-200 flex items-center gap-1.5">
              <span>Recently Logged-In</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-[11px] text-slate-400 font-light">
              Developers who recently logged into the network
            </p>
          </div>
          <button
            onClick={onSeeAllDevelopers}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
          >
            See All
          </button>
        </div>

        {/* Horizontal scroll of recently logged-in developer cards */}
        {recentlyLoggedInDevelopers.length === 0 ? (
          <div className="py-6 px-4 rounded-2xl liquid-glass border border-white/10 text-center">
            <p className="text-xs text-slate-300 font-medium">No other users logged in recently</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Open another browser window or incognito tab to log in as another developer and test live collaboration!
            </p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {recentlyLoggedInDevelopers.map((dev) => {
              const isConnected = dev.connectionStatus === 'connected';
              const isPending = dev.connectionStatus === 'pending';
              const isReceived = dev.connectionStatus === 'received';
              const activeStatus = formatLastActive(dev.lastActive, dev.isOnline);

              return (
                <motion.div
                  key={dev.id}
                  whileHover={{ y: -3 }}
                  onClick={() => onSelectDeveloper(dev)}
                  className="shrink-0 w-36 p-3 rounded-2xl liquid-glass border border-white/10 flex flex-col items-center text-center cursor-pointer group relative overflow-hidden"
                >
                  {/* Status chip */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        dev.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-[8px] font-medium text-slate-400">{activeStatus}</span>
                  </div>

                  <div className="relative w-14 h-14 rounded-full overflow-hidden mt-3 mb-2 ring-2 ring-purple-500/30">
                    <img src={dev.avatar} alt={dev.name} className="w-full h-full object-cover" />
                    {dev.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-black" />
                    )}
                  </div>
                  <h3 className="text-xs font-semibold text-white truncate w-full group-hover:text-purple-300 transition-colors">
                    {dev.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate w-full mt-0.5 font-light">
                    {dev.role}
                  </p>

                  {/* Rating badge */}
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-amber-300 font-medium bg-amber-400/10 px-2 py-0.5 rounded-full">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>{dev.rating}</span>
                  </div>

                  {/* Connection action button */}
                  <div className="w-full mt-2.5">
                    {isConnected ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDeveloper(dev);
                        }}
                        className="w-full py-1 px-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-medium text-emerald-300 flex items-center justify-center gap-1 hover:bg-emerald-500/30 transition-colors"
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Connected</span>
                      </button>
                    ) : isPending ? (
                      <button
                        disabled
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-1 px-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[10px] font-medium text-amber-300 flex items-center justify-center gap-1"
                      >
                        <span>Pending...</span>
                      </button>
                    ) : isReceived ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onConnectDeveloper(dev.id);
                        }}
                        className="w-full py-1 px-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[10px] font-semibold text-black flex items-center justify-center gap-1 transition-colors"
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Accept</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onConnectDeveloper(dev.id);
                        }}
                        className="w-full py-1 px-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-[10px] font-semibold text-white flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Connect</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Projects Section */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase text-slate-200">
            Active Projects
          </h2>
          <button
            onClick={onSeeAllProjects}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
          >
            See All
          </button>
        </div>

        {/* Horizontal list of project cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredProjects.slice(0, 4).map((project) => (
            <motion.div
              key={project.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => onSelectProject(project)}
              className="p-4 rounded-2xl liquid-glass border border-white/10 hover:border-purple-500/40 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-serif font-bold text-white tracking-wide">
                    {project.title}
                  </h3>
                  <p className="text-[11px] text-slate-300/80 mt-1 line-clamp-2 font-light">
                    {project.technologies.slice(0, 3).join(' • ')}
                  </p>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                  {project.currentMembers}/{project.teamSize} Members
                </span>
              </div>

              {/* Technologies chips */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {project.technologies.slice(0, 3).map((tech) => (
                  <span
                    key={tech}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/10 font-mono"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-white/5 text-[11px] text-slate-400">
                <span className="truncate max-w-[140px]">By {project.ownerName}</span>
                <span className="text-purple-400 font-medium hover:underline">View Team →</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Developer Feed Posts */}
      <div className="mt-8 px-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase text-slate-200">
            Developer Feed
          </h2>
        </div>

        <div className="space-y-4">
          {posts.map((post) => {
            const isLiked = likedPosts[post.id] || false;
            return (
              <div
                key={post.id}
                className="p-4 rounded-2xl liquid-glass border border-white/10 space-y-3"
              >
                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => onSelectDeveloper(post.author)}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-white/20"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-white hover:text-purple-300">
                        {post.author.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">{post.author.role} • {post.timeAgo}</p>
                    </div>
                  </div>

                  {post.author.id !== currentUser.id && (
                    <button
                      onClick={() => onConnectDeveloper(post.author.id)}
                      className={`text-[11px] px-3 py-1 rounded-full transition-all cursor-pointer font-medium ${
                        post.author.connectionStatus === 'connected'
                          ? 'bg-white/10 text-emerald-300 border border-emerald-500/30'
                          : post.author.connectionStatus === 'pending'
                          ? 'bg-white/10 text-amber-300 border border-amber-500/30'
                          : 'bg-purple-600/80 hover:bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]'
                      }`}
                    >
                      {post.author.connectionStatus === 'connected' ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3" /> Connected
                        </span>
                      ) : post.author.connectionStatus === 'pending' ? (
                        'Requested'
                      ) : (
                        'Connect'
                      )}
                    </button>
                  )}
                </div>

                {/* Content */}
                <p className="text-xs text-slate-200 leading-relaxed font-light">
                  {post.content}
                </p>

                {/* Code Snippet if present */}
                {post.codeSnippet && (
                  <div className="rounded-xl bg-[#090d18] border border-purple-500/20 p-3 overflow-x-auto text-[11px] font-mono text-cyan-300 shadow-inner">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1.5 mb-1.5 border-b border-white/5">
                      <span className="uppercase">{post.codeSnippet.language}</span>
                      <Code className="w-3 h-3 text-purple-400" />
                    </div>
                    <pre>
                      <code>{post.codeSnippet.code}</code>
                    </pre>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-purple-400 hover:underline">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Action Bar: Like, Comment, Share, Save */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-slate-400">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                        isLiked ? 'text-pink-500' : 'hover:text-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      <span>{post.likes + (isLiked ? 1 : 0)}</span>
                    </button>

                    <button className="flex items-center gap-1.5 text-xs hover:text-white transition-colors cursor-pointer">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments}</span>
                    </button>

                    <button className="text-xs hover:text-white transition-colors cursor-pointer">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button className="text-xs hover:text-white transition-colors cursor-pointer">
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button (+) with liquid glow */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCreateProjectClick}
        aria-label="Create Post or Project"
        className="fixed bottom-24 right-5 z-30 w-13 h-13 rounded-full liquid-button flex items-center justify-center text-white shadow-[0_10px_25px_rgba(124,58,237,0.6)] border border-white/30 cursor-pointer"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </motion.button>
    </div>
  );
};
