import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FolderKanban, Plus, Search, Users, Calendar, 
  Sparkles, CheckCircle, ExternalLink, Star 
} from 'lucide-react';
import { Project } from '../types';

interface ProjectsScreenProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onJoinProject: (projectId: string) => void;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({
  projects,
  onSelectProject,
  onCreateProject,
  onJoinProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [joinedProjects, setJoinedProjects] = useState<Record<string, boolean>>({});

  const handleJoin = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setJoinedProjects((prev) => ({ ...prev, [projectId]: true }));
    onJoinProject(projectId);
  };

  const filteredProjects = projects.filter((proj) => {
    const matchesSearch =
      proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.technologies.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedType === 'All') return true;
    return proj.projectType === selectedType;
  });

  return (
    <div className="w-full pb-28 text-white min-h-[720px]">
      {/* Header */}
      <div className="pt-3 pb-2 px-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">Project Hub</h1>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Discover and collaborate on developer ventures
          </p>
        </div>

        <button
          onClick={onCreateProject}
          className="px-3.5 py-1.5 rounded-full liquid-button text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(124,58,237,0.4)]"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="px-5 mt-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by name, technologies..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 focus:border-purple-400/60 focus:bg-white/[0.09] focus:outline-none text-xs text-white placeholder-slate-400 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-4 px-5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {['All', 'Open Source', 'Full Time', 'Part Time'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedType === type
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.5)] border border-purple-400/30'
                  : 'bg-white/[0.06] text-slate-400 hover:text-slate-200 border border-white/10'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      <div className="px-5 mt-5 space-y-4">
        {filteredProjects.map((proj) => {
          const isJoined = joinedProjects[proj.id] || false;

          return (
            <motion.div
              key={proj.id}
              whileHover={{ y: -2 }}
              onClick={() => onSelectProject(proj)}
              className="p-4 rounded-2xl liquid-glass border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer space-y-3"
            >
              {/* Top Row: Title, Type Badge, Members */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-serif font-bold text-white tracking-wide">
                      {proj.title}
                    </h3>
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {proj.projectType}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Initiated by {proj.ownerName} • {proj.createdAt}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono shrink-0">
                  <Users className="w-3 h-3" />
                  <span>{proj.currentMembers}/{proj.teamSize}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                {proj.description}
              </p>

              {/* Technologies */}
              <div className="flex flex-wrap gap-1.5">
                {proj.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="text-[10px] px-2.5 py-0.5 rounded-lg bg-white/[0.06] text-slate-200 border border-white/10 font-mono"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Footer info: Deadline & Join Action */}
              <div className="flex items-center justify-between pt-2.5 border-t border-white/5 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Calendar className="w-3 h-3 text-purple-400" />
                  <span>Deadline: {proj.deadline}</span>
                </div>

                <button
                  onClick={(e) => handleJoin(proj.id, e)}
                  className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isJoined
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'liquid-button text-white shadow-sm'
                  }`}
                >
                  {isJoined ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Joined
                    </span>
                  ) : (
                    'Apply to Join'
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
