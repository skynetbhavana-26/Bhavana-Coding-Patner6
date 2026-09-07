import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MessageSquare, Plus, Sparkles, Check, CheckCheck, 
  FolderCode, Users, TrendingUp, X, Code2, ArrowRight,
  Settings, Edit3, Trash2, MoreVertical
} from 'lucide-react';
import { Conversation, Developer, ProjectTeam } from '../types';
import { getAccountAvatar } from '../utils/avatarStorage';
import { TeamProgressGraphCard } from './TeamProgressGraphCard';
import { AiAskMeButton } from './AiAskMeButton';

interface ConversationsListScreenProps {
  conversations: Conversation[];
  teams?: ProjectTeam[];
  developers?: Developer[];
  onSelectConversation: (conv: Conversation) => void;
  onSelectTeam?: (team: ProjectTeam) => void;
  onCreateTeam?: (data: { name: string; projectTopic: string; description: string; memberIds?: string[] }) => void;
  onDeleteTeam?: (teamId: string) => void;
  onUpdateTeam?: (teamId: string, data: { name?: string; projectTopic?: string; description?: string; memberIds?: string[] }) => void;
  onNewChat: () => void;
  onNavigateToAi?: () => void;
  currentUserId?: string;
  isMobileView?: boolean;
}

export const ConversationsListScreen: React.FC<ConversationsListScreenProps> = ({
  conversations,
  teams = [],
  developers = [],
  onSelectConversation,
  onSelectTeam,
  onCreateTeam,
  onDeleteTeam,
  onUpdateTeam,
  onNewChat,
  onNavigateToAi,
  currentUserId,
  isMobileView,
}) => {
  const [chatTab, setChatTab] = useState<'direct' | 'project'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamTopic, setNewTeamTopic] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Group settings & edit state
  const [openSettingsTeamId, setOpenSettingsTeamId] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<ProjectTeam | null>(null);
  const [editName, setEditName] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMemberIds, setEditMemberIds] = useState<string[]>([]);

  // Open Create Team modal and initialize with current user selected
  const handleOpenCreateTeamModal = () => {
    setSelectedMemberIds(currentUserId ? [currentUserId] : []);
    setMemberSearchQuery('');
    setShowCreateTeamModal(true);
  };

  const handleOpenEditTeam = (team: ProjectTeam) => {
    setEditingTeam(team);
    setEditName(team.name);
    setEditTopic(team.projectTopic || '');
    setEditDesc(team.description || '');
    setEditMemberIds(team.members ? team.members.map((m) => m.id) : []);
    setOpenSettingsTeamId(null);
  };

  const handleSaveEditTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !editName.trim()) return;
    onUpdateTeam?.(editingTeam.id, {
      name: editName.trim(),
      projectTopic: editTopic.trim(),
      description: editDesc.trim(),
      memberIds: editMemberIds,
    });
    setEditingTeam(null);
  };

  const handleDeleteTeamClick = (teamId: string) => {
    setOpenSettingsTeamId(null);
    onDeleteTeam?.(teamId);
  };

  const toggleEditMemberSelection = (devId: string) => {
    setEditMemberIds((prev) =>
      prev.includes(devId) ? prev.filter((id) => id !== devId) : [...prev, devId]
    );
  };

  const toggleMemberSelection = (devId: string) => {
    if (devId === currentUserId) return; // Team creator is always included
    setSelectedMemberIds((prev) =>
      prev.includes(devId) ? prev.filter((id) => id !== devId) : [...prev, devId]
    );
  };

  // Filter Direct Conversations
  const filteredConversations = conversations.filter(
    (c) =>
      c.developer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter Project Teams
  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.projectTopic && t.projectTopic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter developers for team member selection
  const filteredDevelopers = developers.filter(
    (d) =>
      d.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      d.role.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      (d.skills && d.skills.some((s) => s.toLowerCase().includes(memberSearchQuery.toLowerCase())))
  );

  const totalUnreadDirect = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !onCreateTeam) return;

    // Ensure creator is always included
    const allMembers = Array.from(
      new Set(currentUserId ? [currentUserId, ...selectedMemberIds] : selectedMemberIds)
    );

    onCreateTeam({
      name: newTeamName.trim(),
      projectTopic: newTeamTopic.trim() || newTeamName.trim(),
      description: newTeamDescription.trim() || 'Collaborative project workspace',
      memberIds: allMembers,
    });

    setNewTeamName('');
    setNewTeamTopic('');
    setNewTeamDescription('');
    setSelectedMemberIds([]);
    setShowCreateTeamModal(false);
  };

  return (
    <div className="w-full pb-28 text-white min-h-[720px] animate-fadeIn">
      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateTeamModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0c101c] border border-white/15 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col no-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <FolderCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Create Project Team</h3>
                    <p className="text-[11px] text-slate-400">Assemble your team & launch a workspace</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateTeamModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTeamSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 no-scrollbar">
                <div>
                  <label className="text-[11px] text-slate-300 font-medium block mb-1">
                    Team Name <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g. DevSync Core Engine"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-medium block mb-1">
                    Project Topic / Mission
                  </label>
                  <input
                    type="text"
                    value={newTeamTopic}
                    onChange={(e) => setNewTeamTopic(e.target.value)}
                    placeholder="e.g. Real-time WebSockets & Data Sync"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-medium block mb-1">
                    Brief Description
                  </label>
                  <textarea
                    rows={2}
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="Describe the sprint goals or architecture..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none transition-colors"
                  />
                </div>

                {/* Team Members Multi-Select with Liquid Glass Boxes */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-xs font-semibold text-white">Select Team Members</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                      {selectedMemberIds.length} selected
                    </span>
                  </div>

                  {/* Member Search filter */}
                  <div className="relative mb-2.5">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="Search registered developers by name or skill..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Registered Users List */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar pr-0.5">
                    {filteredDevelopers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No developers found matching &quot;{memberSearchQuery}&quot;
                      </div>
                    ) : (
                      filteredDevelopers.map((dev) => {
                        const isSelected = selectedMemberIds.includes(dev.id);
                        const isLead = dev.id === currentUserId;

                        return (
                          <div
                            key={dev.id}
                            onClick={() => toggleMemberSelection(dev.id)}
                            className={`flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-cyan-950/20 border-purple-500/50 shadow-md'
                                : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* iOS Liquid Glass Selection Checkbox next to user */}
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200 shrink-0 ${
                                  isSelected
                                    ? 'bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)] border border-cyan-200'
                                    : 'bg-white/[0.08] backdrop-blur-md border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] hover:border-white/40'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
                              </div>

                              {/* Avatar */}
                              <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-white/20">
                                <img
                                  src={getAccountAvatar(dev.id, dev.avatar)}
                                  alt={dev.name}
                                  className="w-full h-full object-cover"
                                />
                                {dev.isOnline && (
                                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-black" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-white truncate">
                                    {dev.name}
                                  </span>
                                  {isLead && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-500/30 text-purple-300 font-mono">
                                      You · Creator
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 truncate block">
                                  {dev.role}
                                </span>
                              </div>
                            </div>

                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                              isSelected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' : 'text-slate-500'
                            }`}>
                              {isSelected ? 'Added' : 'Select'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateTeamModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs text-slate-300 font-medium cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTeamName.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Team ({selectedMemberIds.length})</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="pt-3 pb-2 px-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">Messages</h1>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Real-time developer collaboration channels
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToAi && (
            <AiAskMeButton
              variant="pill"
              onClick={onNavigateToAi}
              className="text-xs"
            />
          )}
          <button
            onClick={chatTab === 'direct' ? onNewChat : handleOpenCreateTeamModal}
            className="p-2 rounded-full liquid-button text-white shadow-md cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            title={chatTab === 'direct' ? 'New Direct Chat' : 'New Project Team'}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Liquid Glass Pill Tab Switcher: Chat | Project Chat (Matches BottomNav UI language) */}
      <div className="px-5 mt-3 mb-2">
        <nav
          aria-label="Chat Top Navigation"
          className="w-full py-1.5 px-2 rounded-full bg-slate-900/60 dark:bg-black/70 backdrop-blur-2xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-between relative select-none"
        >
          {/* Tab 1: Chat */}
          <button
            onClick={() => setChatTab('direct')}
            className="relative flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full cursor-pointer transition-colors duration-200 select-none"
          >
            {chatTab === 'direct' && (
              <motion.div
                layoutId="chatTopLiquidGlassHighlight"
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 32,
                  mass: 0.8,
                }}
                className="absolute inset-0 rounded-full bg-white/[0.14] border border-white/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-md"
              />
            )}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative">
                <MessageSquare
                  className={`w-5 h-5 transition-colors duration-200 ${
                    chatTab === 'direct' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                />
                {totalUnreadDirect > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-pink-500 text-white text-[9px] font-bold shadow-sm">
                    {totalUnreadDirect}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight transition-colors duration-200 ${
                  chatTab === 'direct' ? 'text-white font-semibold' : 'text-slate-400 font-normal'
                }`}
              >
                Direct Chat
              </span>
            </div>
          </button>

          {/* Tab 2: Project Chat */}
          <button
            onClick={() => setChatTab('project')}
            className="relative flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full cursor-pointer transition-colors duration-200 select-none"
          >
            {chatTab === 'project' && (
              <motion.div
                layoutId="chatTopLiquidGlassHighlight"
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 32,
                  mass: 0.8,
                }}
                className="absolute inset-0 rounded-full bg-white/[0.14] border border-white/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-md"
              />
            )}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative">
                <FolderCode
                  className={`w-5 h-5 transition-colors duration-200 ${
                    chatTab === 'project' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                />
                {teams.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-purple-500 text-white text-[9px] font-bold shadow-sm">
                    {teams.length}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight transition-colors duration-200 ${
                  chatTab === 'project' ? 'text-white font-semibold' : 'text-slate-400 font-normal'
                }`}
              >
                Project Teams
              </span>
            </div>
          </button>
        </nav>
      </div>

      {/* Search Input */}
      <div className="px-5 mt-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={chatTab === 'direct' ? 'Search direct conversations...' : 'Search project teams...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 focus:border-purple-400/60 focus:bg-white/[0.09] focus:outline-none text-xs text-white placeholder-slate-400 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
          />
        </div>
      </div>

      {/* ================= TAB 1: DIRECT CHAT ================= */}
      {chatTab === 'direct' && (
        <>
          {/* Online Collaborators Quick Avatars */}
          <div className="mt-4 px-5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-2">
              Online Collaborators
            </span>
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className="flex flex-col items-center gap-1 cursor-pointer shrink-0"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-purple-500/40 p-0.5">
                      <img
                        src={conv.developer.avatar}
                        alt={conv.developer.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    {conv.developer.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#07090e]" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-300 max-w-[56px] truncate font-medium">
                    {conv.developer.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Conversations List */}
          <div className="px-5 mt-5 space-y-2.5">
            {filteredConversations.map((conv) => (
              <motion.div
                key={conv.id}
                whileHover={{ y: -2 }}
                onClick={() => onSelectConversation(conv)}
                className="p-3.5 rounded-2xl liquid-glass border border-white/10 flex items-center justify-between gap-3 hover:border-purple-500/40 transition-all cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-1 ring-white/20">
                    <img
                      src={conv.developer.avatar}
                      alt={conv.developer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {conv.developer.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#07090e]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-white truncate">
                      {conv.developer.name}
                    </h3>
                    <span className="text-[10px] text-slate-400">{conv.lastMessageTime}</span>
                  </div>
                  <p className="text-[11px] text-slate-300/80 truncate mt-1 font-light">
                    {conv.lastMessage}
                  </p>
                </div>

                {/* Unread count badge */}
                {conv.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                    {conv.unreadCount}
                  </span>
                )}
              </motion.div>
            ))}

            {filteredConversations.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                No conversations found. Tap the Discover tab to connect with partners!
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= TAB 2: PROJECT CHAT ================= */}
      {chatTab === 'project' && (
        <div className="px-4 sm:px-5 mt-4 space-y-5 pb-24">
          {/* 1. Team Progress Graph Card (Positioned ABOVE Project Teams Collaboration as requested) */}
          <TeamProgressGraphCard isMobileView={isMobileView} />

          {/* 2. Project Teams Collaboration Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/50 dark:bg-black/60 backdrop-blur-2xl border border-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-white tracking-tight">Project Teams Collaboration</h4>
              <p className="text-xs text-slate-400 mt-0.5 max-w-md leading-relaxed">
                Share source code, ZIP archives, and track team progress in real time.
              </p>
            </div>
            <button
              onClick={handleOpenCreateTeamModal}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Team</span>
            </button>
          </div>

          {/* 3. All Groups Section */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs uppercase tracking-wider text-slate-300 font-bold">
                  All Groups
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-400/20">
                  {filteredTeams.length}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Click settings icon to edit or delete
              </span>
            </div>

            {/* All Groups List with iOS liquid glass outline & hover effect */}
            {filteredTeams.map((team) => {
              const isSettingsOpen = openSettingsTeamId === team.id;

              return (
                <div
                  key={team.id}
                  onClick={() => onSelectTeam && onSelectTeam(team)}
                  className="relative p-4 sm:p-4.5 rounded-3xl bg-slate-900/50 dark:bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-purple-400/50 hover:ring-1 hover:ring-purple-400/30 transition-colors cursor-pointer space-y-3 group select-none"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 p-0.5 flex items-center justify-center shrink-0">
                        {team.avatar ? (
                          <img src={team.avatar} alt={team.name} className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          <FolderCode className="w-6 h-6 text-purple-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {team.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {team.projectTopic || team.description}
                        </p>
                      </div>
                    </div>

                    {/* Right Action Area: Progress Pill + Settings Icon */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{team.completionPercentage}%</span>
                      </div>

                      {/* Settings Icon Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenSettingsTeamId(isSettingsOpen ? null : team.id);
                          }}
                          aria-label={`Settings for ${team.name}`}
                          title="Group Settings"
                          className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.2] border border-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-slate-300" />
                        </button>

                        {/* Dropdown Menu: Edit and Delete (Trash/dustbin) */}
                        <AnimatePresence>
                          {isSettingsOpen && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 5 }}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-10 w-36 py-1.5 px-1 rounded-2xl bg-[#0e1222]/95 border border-white/20 shadow-2xl backdrop-blur-2xl z-40 space-y-0.5"
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenEditTeam(team)}
                                className="w-full px-3 py-2 rounded-xl hover:bg-white/[0.1] text-xs font-medium text-slate-200 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                                <span>Edit Group</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteTeamClick(team.id)}
                                className="w-full px-3 py-2 rounded-xl hover:bg-rose-500/20 text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span>Delete</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${team.completionPercentage}%` }}
                    />
                  </div>

                  {/* Footer: Members and Channel Indicator */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-1.5">
                        {team.members.slice(0, 3).map((m) => (
                          <img
                            key={m.id}
                            src={m.avatar}
                            alt={m.name}
                            className="w-5 h-5 rounded-full ring-1 ring-[#0c101c] object-cover"
                          />
                        ))}
                      </div>
                      <span className="text-[11px]">{team.members.length} collaborators</span>
                    </div>

                    <div className="flex items-center gap-1 text-purple-300 font-medium text-xs">
                      <span>Enter Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTeams.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                <FolderCode className="w-8 h-8 text-slate-500 mx-auto" />
                <p>No project teams found.</p>
                <button
                  onClick={handleOpenCreateTeamModal}
                  className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                >
                  Create the first project team
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      <AnimatePresence>
        {editingTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0c101c] border border-white/15 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col no-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Edit Project Group</h3>
                    <p className="text-[11px] text-slate-400">Update team name, topic & members</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingTeam(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditTeam} className="space-y-4 overflow-y-auto pr-1 flex-1 no-scrollbar">
                <div>
                  <label className="text-[11px] text-slate-300 font-medium block mb-1">
                    Team Name <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. DevSync Core Engine"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-medium block mb-1">
                    Project Topic / Mission
                  </label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    placeholder="e.g. Real-Time Distributed Architecture"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-medium block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Brief description of the collaboration goals..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                {/* Team Members Selection */}
                <div>
                  <label className="text-[11px] text-slate-300 font-medium block mb-1.5">
                    Team Members ({editMemberIds.length})
                  </label>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar pr-0.5">
                    {developers.map((dev) => {
                      const isSelected = editMemberIds.includes(dev.id);
                      return (
                        <div
                          key={dev.id}
                          onClick={() => toggleEditMemberSelection(dev.id)}
                          className={`flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-purple-950/40 border-purple-500/50 shadow-md'
                              : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${
                                isSelected
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-white/[0.08] border border-white/20'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                            </div>
                            <img
                              src={getAccountAvatar(dev.id, dev.avatar)}
                              alt={dev.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{dev.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{dev.role}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingTeam(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-xs font-semibold text-white shadow-md shadow-purple-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
