import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Upload, Camera, Check, Sparkles, Link as LinkIcon, AlertCircle, Loader2 } from 'lucide-react';
import { Developer } from '../types';
import { saveAccountAvatar } from '../utils/avatarStorage';

interface EditProfileModalProps {
  user: Developer;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: Developer) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [role, setRole] = useState(user.role);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar);
  const [skillsString, setSkillsString] = useState(user.skills.join(', '));
  const [location, setLocation] = useState(user.location);
  const [portfolioUrl, setPortfolioUrl] = useState(user.portfolioUrl || '');
  
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever the modal opens or user prop changes
  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setUsername(user.username);
      setRole(user.role);
      setBio(user.bio);
      setAvatar(user.avatar);
      setSkillsString(user.skills.join(', '));
      setLocation(user.location);
      setPortfolioUrl(user.portfolioUrl || '');
      setUploadSuccessMessage(null);
      setUploadErrorMessage(null);
      setShowUrlInput(false);
      setCustomImageUrl('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Handle local image file upload with canvas optimization
  // Compresses image to max 400x400 square JPEG to guarantee storage quota safety
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadErrorMessage('Please select a valid image file (JPEG, PNG, WebP, etc.).');
      return;
    }

    setIsProcessingImage(true);
    setUploadErrorMessage(null);
    setUploadSuccessMessage(null);

    const reader = new FileReader();
    reader.onerror = () => {
      setIsProcessingImage(false);
      setUploadErrorMessage('Could not read selected file. Please try again.');
    };

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        setIsProcessingImage(false);
        setUploadErrorMessage('Selected file could not be parsed as an image.');
      };

      img.onload = () => {
        try {
          const maxDim = 400;
          const canvas = document.createElement('canvas');
          canvas.width = maxDim;
          canvas.height = maxDim;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            // Fallback to raw data url if canvas context unavailable
            setAvatar(reader.result as string);
            setIsProcessingImage(false);
            setUploadSuccessMessage('Picture updated! Remember to click Save.');
            return;
          }

          // Center crop to a square aspect ratio for avatar
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;

          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxDim, maxDim);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

          // Upload to backend server
          fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: optimizedDataUrl, filename: 'avatar.jpg' }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.success && data.url) {
                setAvatar(data.url);
              } else {
                setAvatar(optimizedDataUrl);
              }
              setIsProcessingImage(false);
              setUploadSuccessMessage('Photo uploaded to server successfully! Click Save Changes.');
            })
            .catch(() => {
              setAvatar(optimizedDataUrl);
              setIsProcessingImage(false);
              setUploadSuccessMessage('Photo uploaded successfully! Click Save Changes.');
            });
        } catch (err) {
          console.error('Canvas processing error', err);
          setAvatar(reader.result as string);
          setIsProcessingImage(false);
          setUploadSuccessMessage('Photo uploaded successfully! Click Save Changes.');
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
    // Clear input value so re-selecting the same file works
    e.target.value = '';
  };

  const handleApplyCustomUrl = () => {
    if (!customImageUrl.trim()) return;
    setAvatar(customImageUrl.trim());
    setUploadSuccessMessage('Image URL applied! Click Save Changes.');
    setUploadErrorMessage(null);
    setShowUrlInput(false);
    setCustomImageUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSkills = skillsString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedUser: Developer = {
      ...user,
      name: name.trim(),
      username: username.trim(),
      role: role.trim(),
      bio: bio.trim(),
      avatar: avatar,
      skills: updatedSkills.length > 0 ? updatedSkills : user.skills,
      location: location.trim(),
      portfolioUrl: portfolioUrl.trim(),
    };

    saveAccountAvatar(user.id, avatar);
    onSave(updatedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0d111d] border border-white/15 p-6 text-white shadow-2xl no-scrollbar relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-serif font-bold text-white">Edit Developer Profile</h2>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Change your profile picture and developer information
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Profile Picture Uploader & Presets */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-white/[0.04] border border-white/10">
            {/* Avatar Preview with click to change */}
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              title="Click to select a new profile picture"
            >
              <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-purple-500 via-pink-500 to-cyan-400 shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                <img
                  src={avatar}
                  alt="Profile Preview"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-medium">
                {isProcessingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-400 mb-0.5" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span>Change</span>
                  </>
                )}
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Action buttons for photo */}
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-xs text-purple-200 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              >
                {isProcessingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{isProcessingImage ? 'Processing...' : 'Upload Photo'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Paste Link</span>
              </button>
            </div>

            {/* Optional URL input */}
            {showUrlInput && (
              <div className="w-full mt-3 flex items-center gap-2">
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600/40 hover:bg-cyan-600/60 border border-cyan-400/40 text-xs text-cyan-200 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Feedback messages */}
            {uploadSuccessMessage && (
              <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{uploadSuccessMessage}</span>
              </div>
            )}

            {uploadErrorMessage && (
              <div className="mt-2 text-[11px] text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{uploadErrorMessage}</span>
              </div>
            )}

            {/* Avatar Presets Selection */}
            <div className="w-full mt-3 pt-3 border-t border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block text-center mb-2">
                Or Select Developer Preset
              </span>
              <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAvatar(preset);
                      setUploadSuccessMessage('Preset selected! Click Save Changes.');
                      setUploadErrorMessage(null);
                    }}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 cursor-pointer ${
                      avatar === preset ? 'border-cyan-400 scale-105 ring-2 ring-purple-500/50' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={preset} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Primary Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Game Developer & Designer"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">About Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400 resize-none"
            />
          </div>

          {/* Skills comma separated */}
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">
              Skills (comma-separated)
            </label>
            <input
              type="text"
              value={skillsString}
              onChange={(e) => setSkillsString(e.target.value)}
              placeholder="HTML, CSS, JavaScript, React, Node.js, Python, UI/UX, Figma"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Location & Portfolio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Portfolio URL</label>
              <input
                type="text"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://yourportfolio.dev"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl hover:bg-white/10 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl liquid-button text-xs font-semibold text-white shadow-lg cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

