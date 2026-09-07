import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Settings, Edit3, Star, FolderKanban, Users, 
  ExternalLink, Github, Linkedin, Twitter, Globe, Sparkles, ShieldCheck, Camera, Upload, Loader2, Check
} from 'lucide-react';
import { Developer, Project } from '../types';
import { saveAccountAvatar } from '../utils/avatarStorage';

interface ProfileScreenProps {
  user: Developer;
  projects: Project[];
  onBack: () => void;
  onOpenSettings: () => void;
  onOpenEditProfile: () => void;
  onOpenWorkspace: () => void;
  onUpdateAvatar?: (newUrl: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  projects,
  onBack,
  onOpenSettings,
  onOpenEditProfile,
  onOpenWorkspace,
  onUpdateAvatar,
}) => {
  const [activeTab, setActiveTab] = useState<'Projects' | 'About' | 'Skills'>('Projects');
  const [isUploading, setIsUploading] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleDirectPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 400;
          const canvas = document.createElement('canvas');
          canvas.width = maxDim;
          canvas.height = maxDim;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const minSide = Math.min(img.width, img.height);
            const sx = (img.width - minSide) / 2;
            const sy = (img.height - minSide) / 2;
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxDim, maxDim);
            const optimized = canvas.toDataURL('image/jpeg', 0.88);
            saveAccountAvatar(user.id, optimized);
            onUpdateAvatar?.(optimized);
            setSuccessFeedback('Profile picture updated successfully!');
            setTimeout(() => setSuccessFeedback(null), 3500);

            // Also upload to server in background
            fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: optimized, filename: 'avatar.jpg' }),
            })
              .then((r) => r.json())
              .then((data) => {
                if (data.success && data.url) {
                  saveAccountAvatar(user.id, data.url);
                  onUpdateAvatar?.(data.url);
                }
              })
              .catch(() => {});
          } else {
            const raw = reader.result as string;
            saveAccountAvatar(user.id, raw);
            onUpdateAvatar?.(raw);
            setSuccessFeedback('Profile picture updated successfully!');
            setTimeout(() => setSuccessFeedback(null), 3500);
          }
        } catch {
          const raw = reader.result as string;
          saveAccountAvatar(user.id, raw);
          onUpdateAvatar?.(raw);
          setSuccessFeedback('Profile picture updated successfully!');
          setTimeout(() => setSuccessFeedback(null), 3500);
        } finally {
          setIsUploading(false);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const userProjects = projects.filter((p) => p.ownerId === user.id || p.ownerName === user.name);

  return (
    <div className="w-full pb-28 text-white min-h-[720px]">
      {/* Header matching Screenshot 8 */}
      <div className="pt-3 pb-2 px-5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-300 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">Developer Profile</span>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-300 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Info Header */}
      <div className="flex flex-col items-center px-5 mt-4 text-center">
        {/* Large Avatar with Glow & Online Ring */}
        <div className="relative">
          <div
            className="relative group cursor-pointer"
            onClick={() => avatarInputRef.current?.click()}
            title="Click to choose a new profile picture"
          >
            <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-purple-500 via-pink-500 to-cyan-400 shadow-[0_0_25px_rgba(124,58,237,0.4)]">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#07090e]">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            </div>
            {/* Subtle edit photo overlay on hover */}
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-medium">
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span>Change</span>
                </>
              )}
            </div>
            {/* Green Online status badge */}
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-[#07090e]" />
          </div>

          {/* Visible Camera Icon Button for touch devices & easy clicking */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              avatarInputRef.current?.click();
            }}
            className="absolute -bottom-1 -right-1 p-2 rounded-full bg-purple-600 hover:bg-purple-500 border-2 border-[#07090e] text-white shadow-lg cursor-pointer transition-transform hover:scale-110 flex items-center justify-center z-10"
            title="Change Profile Picture"
            aria-label="Change Profile Picture"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleDirectPhotoUpload}
          />
        </div>

        {/* Success toast / indicator */}
        <AnimatePresence>
          {successFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-3 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-medium flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{successFeedback}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name and Role */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
            {user.name}
          </h1>
          {user.verified && (
            <ShieldCheck className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
          )}
        </div>
        <p className="text-xs text-slate-300 mt-0.5 font-light">{user.role}</p>

        {/* Stats Row in Frosted Liquid Glass Card */}
        <div className="w-full max-w-sm mt-5 py-3.5 px-4 rounded-2xl liquid-glass border border-white/10 grid grid-cols-3 gap-2 divide-x divide-white/10 shadow-lg">
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-white">{user.projectsCount}</span>
            <span className="text-[10px] text-slate-400 font-light mt-0.5">Projects</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-white">{user.connectionsCount}</span>
            <span className="text-[10px] text-slate-400 font-light mt-0.5">Connections</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-base font-bold text-white">{user.rating}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-light mt-0.5">Rating</span>
          </div>
        </div>

        {/* Action Buttons: Edit Profile, Change Photo, Workspace */}
        <div className="w-full max-w-sm mt-4 grid grid-cols-2 gap-2.5">
          <button
            onClick={onOpenEditProfile}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-xs font-semibold text-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-400" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => avatarInputRef.current?.click()}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/40 text-xs font-semibold text-purple-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5 text-purple-300" />
            <span>Change Photo</span>
          </button>
        </div>

        <button
          onClick={onOpenWorkspace}
          className="w-full max-w-sm mt-2.5 py-2.5 px-4 rounded-xl liquid-button text-xs font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(124,58,237,0.35)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>Collaboration Workspace</span>
        </button>
      </div>

      {/* Skills Section matching Screenshot 8 */}
      <div className="px-5 mt-6">
        <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2.5">
          Skills
        </h2>
        <div className="flex flex-wrap gap-2">
          {user.skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-medium text-slate-200 shadow-sm"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* About Me Section matching Screenshot 8 */}
      <div className="px-5 mt-6">
        <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2.5">
          About Me
        </h2>
        <div className="p-4 rounded-2xl liquid-glass border border-white/10 text-xs leading-relaxed text-slate-300 font-light">
          {user.bio}
        </div>
      </div>

      {/* Developer Links / Socials */}
      <div className="px-5 mt-6">
        <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2.5">
          Developer Links
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={user.githubUrl || 'https://github.com'}
            target="_blank"
            rel="noreferrer"
            className="p-3 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-between text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-purple-400" />
              <span>GitHub</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          <a
            href={user.linkedinUrl || 'https://linkedin.com'}
            target="_blank"
            rel="noreferrer"
            className="p-3 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-between text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-cyan-400" />
              <span>LinkedIn</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </div>

      {/* Projects List */}
      <div className="px-5 mt-6">
        <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2.5">
          Active Projects ({userProjects.length})
        </h2>
        <div className="space-y-3">
          {userProjects.map((proj) => (
            <div
              key={proj.id}
              className="p-3.5 rounded-2xl liquid-glass border border-white/10 flex items-center justify-between"
            >
              <div>
                <h3 className="text-xs font-semibold text-white">{proj.title}</h3>
                <p className="text-[10px] text-slate-400 font-light mt-0.5">
                  {proj.technologies.slice(0, 3).join(' • ')}
                </p>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {proj.currentMembers}/{proj.teamSize} Members
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
