import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, CheckSquare, FileText, FolderGit2, Clock, 
  Plus, CheckCircle, Sparkles, MessageSquare 
} from 'lucide-react';
import { WorkspaceTask } from '../types';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: WorkspaceTask[];
  onAddTask: (title: string, priority: 'High' | 'Medium' | 'Low') => void;
  onToggleTaskStatus: (taskId: string) => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onAddTask,
  onToggleTaskStatus,
}) => {
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'tasks' | 'notes' | 'milestones'>('tasks');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [sharedNotes, setSharedNotes] = useState(
    `# Coding Partner - Architectural Milestones 2026\n\n1. Real-time WebSocket Protocol with sub-50ms latency.\n2. Apple iOS 26 Liquid Glass UI kit integration.\n3. Profile picture cloud synchronization & local persistence.\n4. AI Matching recommendation engine for developers.`
  );

  if (!isOpen) return null;

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim(), 'Medium');
    setNewTaskTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-3xl bg-[#0c101d] border border-white/15 p-6 text-white shadow-2xl no-scrollbar flex flex-col justify-between"
      >
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-white">Collaboration Workspace</h2>
                <p className="text-[11px] text-slate-400 font-light">Shared Team Hub • Real-time Sync</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex gap-2 mt-4 p-1 rounded-xl bg-white/[0.04] border border-white/10">
            {[
              { id: 'tasks', label: 'Shared Tasks', icon: CheckSquare },
              { id: 'notes', label: 'Shared Notes', icon: FileText },
              { id: 'milestones', label: 'Timeline', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeWorkspaceTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveWorkspaceTab(tab.id as any)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 my-5 overflow-y-auto no-scrollbar">
          {activeWorkspaceTab === 'tasks' && (
            <div className="space-y-4">
              {/* Add Task Form */}
              <form onSubmit={handleAddTaskSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="New shared team task..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl liquid-button text-xs font-medium text-white flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </form>

              {/* Task Items */}
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleTaskStatus(task.id)}
                    className="p-3 rounded-xl liquid-glass border border-white/10 flex items-center justify-between gap-3 cursor-pointer hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          task.status === 'done'
                            ? 'bg-emerald-500 border-emerald-500 text-black'
                            : 'border-white/30 hover:border-purple-400'
                        }`}
                      >
                        {task.status === 'done' && <CheckCircle className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span
                        className={`text-xs ${
                          task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-400 font-mono">
                        {task.assignee}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          task.priority === 'High'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-cyan-500/20 text-cyan-300'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeWorkspaceTab === 'notes' && (
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium block">
                Collaborative Markdown Scratchpad
              </label>
              <textarea
                value={sharedNotes}
                onChange={(e) => setSharedNotes(e.target.value)}
                rows={10}
                className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-cyan-300 focus:outline-none focus:border-purple-400 resize-none shadow-inner"
              />
            </div>
          )}

          {activeWorkspaceTab === 'milestones' && (
            <div className="space-y-3">
              {[
                { title: 'Phase 1: Architecture & UI Setup', date: 'Done • Sept 2026', completed: true },
                { title: 'Phase 2: Real-time WebSockets & Media Engine', date: 'In Progress • Oct 2026', completed: false },
                { title: 'Phase 3: Public Beta & Global Developer Hackathon', date: 'Upcoming • Nov 2026', completed: false },
              ].map((m, i) => (
                <div key={i} className="p-3 rounded-xl liquid-glass border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white">{m.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{m.date}</p>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                      m.completed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'
                    }`}
                  >
                    {m.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Live Workspace Sync Active</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
