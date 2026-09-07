import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, X, Sparkles, CheckCircle2, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { Project } from '../types';
import { uploadImageToBackend } from '../utils/upload';

interface CreatePostScreenProps {
  onBack: () => void;
  onPostCreated: (project: Project) => void;
  currentUserName: string;
  currentUserAvatar: string;
  currentUserId: string;
}

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  onBack,
  onPostCreated,
  currentUserName,
  currentUserAvatar,
  currentUserId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>(['React', 'Tailwind CSS']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Senior');
  const [projectType, setProjectType] = useState<'Full Time' | 'Part Time' | 'Open Source'>('Open Source');
  const [teamSize, setTeamSize] = useState(4);
  const [deadline, setDeadline] = useState('Dec 15, 2026');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const uploadedUrl = await uploadImageToBackend(file);
      setImageUrl(uploadedUrl);
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const addSkill = () => {
    if (newSkillInput.trim() && !skills.includes(newSkillInput.trim())) {
      setSkills([...skills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newProj: Project = {
        id: 'proj-' + Date.now(),
        title: title.trim(),
        description: description.trim(),
        technologies: skills.length > 0 ? skills : ['TypeScript', 'React'],
        requiredRoles: [experienceLevel + ' Developer', 'Collaborator'],
        deadline: deadline || 'Open',
        teamSize: teamSize,
        currentMembers: 1,
        ownerId: currentUserId,
        ownerName: currentUserName,
        ownerAvatar: currentUserAvatar,
        projectType: projectType,
        createdAt: 'Just now',
        starsCount: 1,
        imageUrl: imageUrl || undefined,
      };

      onPostCreated(newProj);
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="w-full pb-28 text-white min-h-[720px]">
      {/* Header */}
      <div className="pt-3 pb-3 px-5 flex items-center justify-between border-b border-white/5">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-300 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-serif font-bold text-white tracking-wide">Create Post</h1>
        <div className="w-8" />
      </div>

      <form onSubmit={handlePost} className="px-5 mt-5 space-y-5">
        {/* Project Title */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5 ml-1">
            Project Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g. Build a portfolio website or AI Agent"
            required
            className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 focus:border-purple-400 focus:bg-white/[0.09] focus:outline-none text-xs text-white placeholder-slate-500 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
          />
        </div>

        {/* Project Description with Character Count */}
        <div>
          <div className="flex justify-between items-center mb-1.5 ml-1">
            <label className="text-xs font-semibold text-slate-300">Project Description</label>
            <span className="text-[10px] text-slate-400">{description.length}/500</span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="Describe your project vision, target tech stack, and what type of partner you're seeking..."
            rows={4}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 focus:border-purple-400 focus:bg-white/[0.09] focus:outline-none text-xs text-white placeholder-slate-500 transition-all resize-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
          />
        </div>

        {/* Project Mockup / Screenshot Image Upload (Mobile Device Picker) */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5 ml-1">
            Project Screenshot / Image (Optional)
          </label>
          
          {imageUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/40 group">
              <img
                src={imageUrl}
                alt="Uploaded project preview"
                className="w-full h-44 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-medium cursor-pointer border border-white/20 transition-all">
                  <span>Change Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
                    disabled={isUploadingImage}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="px-3 py-1.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : (
            <label className="w-full py-4 px-4 rounded-2xl border border-dashed border-white/20 hover:border-purple-400/60 bg-white/[0.03] hover:bg-white/[0.06] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
                disabled={isUploadingImage}
              />
              <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                {isUploadingImage ? (
                  <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-200">
                  {isUploadingImage ? 'Uploading image to server...' : 'Upload screenshot or mockup'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Tap to select from device gallery or camera
                </p>
              </div>
            </label>
          )}
        </div>

        {/* Required Skills */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5 ml-1">
            Required Skills
          </label>
          <div className="flex flex-wrap gap-2 mb-2.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs flex items-center gap-1.5"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="e.g. Next.js, Python, Swift..."
              className="flex-1 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400"
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-slate-200 flex items-center gap-1 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Skill</span>
            </button>
          </div>
        </div>

        {/* Experience Level Dropdown */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5 ml-1">
            Experience Level
          </label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f1424] border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-purple-400 cursor-pointer"
          >
            <option value="Junior">Junior (1-2 years)</option>
            <option value="Mid-Level">Mid-Level (3-5 years)</option>
            <option value="Senior">Senior (5+ years)</option>
            <option value="Lead">Lead / Architect</option>
          </select>
        </div>

        {/* Project Type Radios */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2 ml-1">
            Project Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Full Time', 'Part Time', 'Open Source'] as const).map((type) => (
              <label
                key={type}
                onClick={() => setProjectType(type)}
                className={`py-2 px-2 rounded-xl text-xs text-center border cursor-pointer transition-all ${
                  projectType === type
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400/40 shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                    : 'bg-white/[0.05] text-slate-400 border-white/10 hover:bg-white/[0.08]'
                }`}
              >
                {type}
              </label>
            ))}
          </div>
        </div>

        {/* Team Size & Target Deadline */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 ml-1">
              Team Size
            </label>
            <input
              type="number"
              min={2}
              max={12}
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 ml-1">
              Deadline
            </label>
            <input
              type="text"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="e.g. Dec 2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl liquid-button font-medium text-white shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>Post Project</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
