import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, Share2, Check, Users, User, Film, Image as ImageIcon, 
  Code2, FileArchive, Send
} from 'lucide-react';
import { Developer, ProjectTeam, ChatMessage } from '../types';

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageToForward: ChatMessage | null;
  currentUserId: string;
  developers: Developer[];
  teams: ProjectTeam[];
  onForwardToDeveloper: (developerId: string, message: ChatMessage) => void;
  onForwardToTeam: (teamId: string, message: ChatMessage) => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  onClose,
  messageToForward,
  currentUserId,
  developers,
  teams,
  onForwardToDeveloper,
  onForwardToTeam,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'direct' | 'teams'>('all');
  const [forwardedIds, setForwardedIds] = useState<Record<string, boolean>>({});

  if (!isOpen || !messageToForward) return null;

  // Filter out the current user from recipients list
  const filteredDevelopers = developers
    .filter((d) => d.id !== currentUserId)
    .filter((d) => 
      !searchQuery || 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredTeams = teams.filter((t) =>
    !searchQuery ||
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.projectTopic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleForwardDev = (devId: string) => {
    if (forwardedIds[`dev_${devId}`]) return;
    onForwardToDeveloper(devId, messageToForward);
    setForwardedIds((prev) => ({ ...prev, [`dev_${devId}`]: true }));
  };

  const handleForwardTeam = (teamId: string) => {
    if (forwardedIds[`team_${teamId}`]) return;
    onForwardToTeam(teamId, messageToForward);
    setForwardedIds((prev) => ({ ...prev, [`team_${teamId}`]: true }));
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-[#0e1220]/95 rounded-3xl border border-white/20 p-5 text-white shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-white">Forward Message</h3>
                <p className="text-[11px] text-slate-400">Send to colleagues or project teams</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Preview of the message being forwarded */}
          <div className="my-3 p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
            {messageToForward.videoUrl && (
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                <Film className="w-5 h-5" />
              </div>
            )}
            {messageToForward.imageUrl && !messageToForward.videoUrl && (
              <img
                src={messageToForward.imageUrl}
                alt="Preview"
                className="w-10 h-10 rounded-xl object-cover border border-white/15 shrink-0"
              />
            )}
            {messageToForward.codeFile && (
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0">
                <Code2 className="w-5 h-5" />
              </div>
            )}
            {messageToForward.zipFile && (
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <FileArchive className="w-5 h-5" />
              </div>
            )}
            {!messageToForward.videoUrl && !messageToForward.imageUrl && !messageToForward.codeFile && !messageToForward.zipFile && (
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                <Send className="w-4 h-4" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-purple-300 font-medium">
                {messageToForward.senderName || (messageToForward.isOutgoing ? 'You' : 'Original Message')}
              </div>
              <div className="text-xs text-slate-200 truncate mt-0.5">
                {messageToForward.text || 
                  (messageToForward.videoUrl ? 'Shared video' : 
                   messageToForward.imageUrl ? 'Shared photo' : 
                   messageToForward.codeFile ? messageToForward.codeFile.name : 
                   messageToForward.zipFile ? messageToForward.zipFile.name : 'Message content')}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people or teams..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400/50"
            />
          </div>

          {/* Category Filter Pills (iOS Liquid Glass design) */}
          <div className="flex items-center gap-1.5 pb-2.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white/[0.05] text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('direct')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                activeFilter === 'direct'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white/[0.05] text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Direct Chats ({filteredDevelopers.length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('teams')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                activeFilter === 'teams'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white/[0.05] text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Project Teams ({filteredTeams.length})</span>
            </button>
          </div>

          {/* Recipients List */}
          <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar pr-1 min-h-[220px]">
            {/* Direct Chats / Developers */}
            {(activeFilter === 'all' || activeFilter === 'direct') && filteredDevelopers.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 px-1 pt-1">
                  Developers
                </div>
                {filteredDevelopers.map((dev) => {
                  const isDone = !!forwardedIds[`dev_${dev.id}`];
                  return (
                    <div
                      key={dev.id}
                      className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.06] transition-colors border border-transparent hover:border-white/10"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={dev.avatar}
                          alt={dev.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate">{dev.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{dev.role}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleForwardDev(dev.id)}
                        disabled={isDone}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-white/10 hover:bg-purple-600 text-white border border-white/15 hover:border-purple-400/50'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Forwarded</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Forward</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Project Teams */}
            {(activeFilter === 'all' || activeFilter === 'teams') && filteredTeams.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 px-1">
                  Project Teams
                </div>
                {filteredTeams.map((team) => {
                  const isDone = !!forwardedIds[`team_${team.id}`];
                  return (
                    <div
                      key={team.id}
                      className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.06] transition-colors border border-transparent hover:border-white/10"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 font-semibold text-xs shrink-0">
                          #
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate">{team.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{team.projectTopic || `${team.members.length} members`}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleForwardTeam(team.id)}
                        disabled={isDone}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-white/10 hover:bg-purple-600 text-white border border-white/15 hover:border-purple-400/50'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Forwarded</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Forward</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredDevelopers.length === 0 && filteredTeams.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No matching recipients found.
              </div>
            )}
          </div>

          {/* Footer Done button */}
          <div className="pt-3 border-t border-white/10 mt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
