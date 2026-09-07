import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, Circle, CheckSquare, Square, TrendingUp, 
  Users, FolderCode, FileArchive, Plus, Sparkles, Activity, Clock, 
  FileCode, Layers, Check, Download, Eye, ExternalLink, ChevronDown, Star
} from 'lucide-react';
import { ProjectTeam, TeamMemberProgress, CodeFileAttachment } from '../types';
import { getAccountAvatar } from '../utils/avatarStorage';
import { TeamProgressGraphCard } from './TeamProgressGraphCard';

interface TeamProgressViewProps {
  team: ProjectTeam;
  completionPercentage: number;
  membersProgress: TeamMemberProgress[];
  totalTasks: number;
  completedTasks: number;
  totalSharedFiles: number;
  onToggleTask: (taskId: string, completed: boolean) => void;
  onAddTask: (userId: string, title: string) => void;
  onViewCode?: (codeFile: CodeFileAttachment) => void;
}

export const TeamProgressView: React.FC<TeamProgressViewProps> = ({
  team,
  completionPercentage,
  membersProgress,
  totalTasks,
  completedTasks,
  totalSharedFiles,
  onToggleTask,
  onAddTask,
  onViewCode,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'members' | 'completed' | 'shared'>('overview');
  const [timeframe, setTimeframe] = useState<'This Week' | 'Sprint Goal' | 'All Time'>('This Week');
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [newTaskUser, setNewTaskUser] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleCreateTask = (userId: string) => {
    if (!newTaskTitle.trim()) return;
    onAddTask(userId, newTaskTitle.trim());
    setNewTaskTitle('');
    setNewTaskUser(null);
  };

  // Compile all completed tasks across all team members
  const allCompletedTasks = membersProgress.flatMap((m) =>
    (m.tasks || [])
      .filter((t) => t.completed)
      .map((t) => ({
        ...t,
        assigneeName: m.name || m.userName || 'Member',
        assigneeAvatar: getAccountAvatar(m.userId, m.avatar),
        assigneeRole: m.role || 'Developer',
      }))
  );

  // Compile all shared files across all team members
  const allSharedFiles = membersProgress.flatMap((m) =>
    (m.sharedFiles || []).map((f) => ({
      ...f,
      sharedByName: m.name || m.userName || 'Member',
      sharedByAvatar: getAccountAvatar(m.userId, m.avatar),
    }))
  );

  return (
    <div className="w-full space-y-6 pb-24 text-white animate-fadeIn">
      {/* iOS Liquid Glass Pill Tab Bar — Icon on top / above, Tab name below, Centered and evenly spaced */}
      <div className="w-full py-1.5 px-2 rounded-full bg-slate-900/70 dark:bg-black/80 backdrop-blur-2xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-between gap-1 relative select-none">
        {[
          {
            id: 'overview',
            label: 'Team Graph',
            icon: Activity,
          },
          {
            id: 'members',
            label: `Member Progress (${membersProgress.length})`,
            icon: Users,
          },
          {
            id: 'completed',
            label: `Completed (${allCompletedTasks.length})`,
            icon: CheckCircle2,
          },
          {
            id: 'shared',
            label: `Shared Work (${allSharedFiles.length})`,
            icon: FileCode,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full cursor-pointer transition-colors duration-200 select-none min-w-0"
            >
              {isActive && (
                <motion.div
                  layoutId="activeSubTabPill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-white/[0.14] border border-white/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_2px_10px_rgba(0,0,0,0.35)] backdrop-blur-md"
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-1 text-center w-full">
                <Icon
                  className={`w-4 h-4 transition-colors duration-200 shrink-0 ${
                    isActive ? 'text-purple-300 drop-shadow-[0_0_6px_rgba(192,132,252,0.6)]' : 'text-slate-400 hover:text-slate-200'
                  }`}
                />
                <span
                  className={`text-[10px] sm:text-[11px] leading-tight truncate max-w-full px-0.5 tracking-tight ${
                    isActive ? 'text-white font-semibold' : 'text-slate-400 font-medium'
                  }`}
                >
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ================= 1. PROJECT TEAM UPDATES GRAPH (Matches reference image, statistics removed) ================= */}
      {(activeSubTab === 'overview' || activeSubTab === 'members') && (
        <TeamProgressGraphCard hideStats={true} />
      )}

      {/* ================= 2. MEMBER PROGRESS SECTION ================= */}
      {(activeSubTab === 'overview' || activeSubTab === 'members') && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Member Progress & Sprint Checklist
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {membersProgress.length} active developers
            </span>
          </div>

          <div className="space-y-3">
            {membersProgress.map((member) => (
              <motion.div
                key={member.userId}
                whileHover={{ y: -2 }}
                className="p-5 rounded-3xl liquid-glass border border-white/10 hover:border-purple-500/30 transition-all space-y-3 shadow-lg"
              >
                {/* Member Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-2xl overflow-hidden ring-1 ring-white/20 p-0.5 bg-white/5">
                        <img
                          src={getAccountAvatar(member.userId, member.avatar)}
                          alt={member.name || member.userName}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-[#0c101c]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {member.name || member.userName}
                      </h4>
                      <p className="text-[11px] text-slate-400">{member.role || 'Developer'}</p>
                    </div>
                  </div>

                  {/* Progress Pill */}
                  <div className="flex flex-col items-end">
                    <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 shadow-sm font-mono">
                      <span className="w-2 h-2 rounded-full bg-purple-400 inline-block animate-pulse" />
                      {member.completionPercentage}% Complete
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {member.completedTasksCount}/{member.tasks ? member.tasks.length : 0} tasks done
                    </span>
                  </div>
                </div>

                {/* Animated Gradient Progress Bar */}
                <div className="w-full space-y-1">
                  <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${member.completionPercentage}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 rounded-full"
                    />
                  </div>
                </div>

                {/* Interactive Tasks Checklist */}
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Assigned Sprint Tasks
                    </span>
                    <button
                      onClick={() => setNewTaskUser(newTaskUser === member.userId ? null : member.userId)}
                      className="text-[11px] text-purple-300 hover:text-purple-200 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Task
                    </button>
                  </div>

                  {/* Add Task Input Form */}
                  {newTaskUser === member.userId && (
                    <div className="flex gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/10">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Enter task name..."
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateTask(member.userId)}
                        className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none px-2"
                        autoFocus
                      />
                      <button
                        onClick={() => handleCreateTask(member.userId)}
                        className="px-3 py-1 rounded-lg bg-purple-500 hover:bg-purple-600 text-xs font-semibold text-white cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  )}

                  {/* Task Items */}
                  <div className="space-y-1.5">
                    {member.tasks && member.tasks.length > 0 ? (
                      member.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => onToggleTask(task.id, !task.completed)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                            task.completed
                              ? 'bg-emerald-500/[0.08] border-emerald-500/20 text-slate-300'
                              : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {task.completed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className={`text-xs ${task.completed ? 'line-through text-slate-400' : ''}`}>
                              {task.title}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              task.completed
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-white/[0.08] text-slate-400'
                            }`}
                          >
                            {task.completed ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-500 italic py-1">
                        No sprint tasks assigned yet. Click &quot;Add Task&quot; above.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 3. COMPLETED WORK SECTION ================= */}
      {(activeSubTab === 'overview' || activeSubTab === 'completed') && (
        <div className="p-5 rounded-3xl liquid-glass border border-white/10 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Completed Work & Deliverables</h3>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
              {allCompletedTasks.length} Completed
            </span>
          </div>

          {allCompletedTasks.length > 0 ? (
            <div className="space-y-2">
              {allCompletedTasks.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-emerald-400/40 shrink-0">
                      <img
                        src={item.assigneeAvatar}
                        alt={item.assigneeName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-white block">{item.title}</span>
                      <span className="text-[10px] text-emerald-300/80">
                        Completed by {item.assigneeName} ({item.assigneeRole})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-medium shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Verified</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              No tasks completed yet. Check tasks in the checklist above to record progress!
            </div>
          )}
        </div>
      )}

      {/* ================= 4. SHARED WORK & ASSETS SECTION ================= */}
      {(activeSubTab === 'overview' || activeSubTab === 'shared') && (
        <div className="p-5 rounded-3xl liquid-glass border border-white/10 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderCode className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Shared Work & Project Assets</h3>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
              {allSharedFiles.length} Shared
            </span>
          </div>

          {allSharedFiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allSharedFiles.map((file, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (file.type === 'code' && file.codeSnippet && onViewCode) {
                      onViewCode({
                        fileName: file.name,
                        language: 'typescript',
                        code: file.codeSnippet,
                      });
                    } else if (file.url) {
                      window.open(file.url, '_blank');
                    }
                  }}
                  className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                      {file.type === 'code' ? (
                        <FileCode className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <FileArchive className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-mono font-semibold text-white truncate block">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block">
                        Shared by {file.sharedByName}
                      </span>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-white/5 text-slate-400 group-hover:text-cyan-300 group-hover:bg-cyan-500/20 transition-colors shrink-0">
                    {file.type === 'code' ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              No assets or code files shared yet. Share code or zip bundles directly in Discussion chat!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
