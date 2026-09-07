import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Sparkles, X, User, Plus, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { Developer } from '../types';
import { loginOrRegisterApi } from '../services/realtime';

interface AuthScreenProps {
  onSuccess: (user: Developer) => void;
  onBack: () => void;
  currentActiveUserId?: string;
}

interface SavedProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role?: string;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
];

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, onBack, currentActiveUserId }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Full Stack Developer');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [isAddingCustomGoogle, setIsAddingCustomGoogle] = useState(false);
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleRole, setCustomGoogleRole] = useState('Full Stack Developer');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);

  // Load dynamically remembered profiles on this browser/device
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('coding_partner_saved_profiles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((p: SavedProfile) => {
            const custom = localStorage.getItem(`coding_partner_avatar_${p.id}`);
            return custom ? { ...p, avatar: custom } : p;
          });
          setSavedProfiles(mapped);
        }
      }
    } catch (e) {
      console.warn('Could not load saved profiles', e);
    }
  }, []);

  const saveProfileToLocalStorage = (user: Developer) => {
    try {
      const custom = localStorage.getItem(`coding_partner_avatar_${user.id}`);
      const avatarToUse = custom || user.avatar;
      const stored = localStorage.getItem('coding_partner_saved_profiles');
      const list: SavedProfile[] = stored ? JSON.parse(stored) : [];
      const filtered = list.filter((p) => p.id !== user.id && p.email !== user.email);
      const updated = [
        {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: avatarToUse,
          role: user.role,
        },
        ...filtered,
      ].slice(0, 5); // keep up to 5 recent profiles
      localStorage.setItem('coding_partner_saved_profiles', JSON.stringify(updated));
      setSavedProfiles(updated);
    } catch (e) {
      console.warn('Could not save profile to storage', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);

    try {
      const user = await loginOrRegisterApi({
        email: email.trim(),
        name: isSignUp ? fullName.trim() : undefined,
        role: isSignUp ? role.trim() : undefined,
      });

      setIsLoading(false);
      if (user) {
        saveProfileToLocalStorage(user);
        onSuccess(user);
      } else {
        // Fallback dynamic user
        const cleanSlug = email.split('@')[0].replace(/[^a-z0-9]/g, '_');
        const fallbackName =
          fullName.trim() ||
          cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1);

        const dynamicFallback: Developer = {
          id: cleanSlug || 'dev_' + Date.now().toString().slice(-4),
          name: fallbackName,
          username: cleanSlug || 'developer',
          email: email.trim(),
          avatar: selectedAvatar,
          role: role || 'Full Stack Developer',
          bio: 'Passionate developer creating high-impact real-time web applications.',
          skills: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS'],
          experienceLevel: 'Senior',
          rating: 4.9,
          projectsCount: 1,
          connectionsCount: 0,
          location: 'Remote',
          availability: 'Available',
          isOnline: true,
          verified: true,
          lastActive: Date.now(),
          connectionStatus: 'connected',
        };
        saveProfileToLocalStorage(dynamicFallback);
        onSuccess(dynamicFallback);
      }
    } catch (err) {
      setIsLoading(false);
      console.error('Auth error', err);
    }
  };

  const handleSelectGoogleAccount = async (accountEmail: string, accountName: string, accountAvatar?: string, accountRole?: string) => {
    setIsLoading(true);
    setShowGoogleChooser(false);

    try {
      const user = await loginOrRegisterApi({
        email: accountEmail,
        name: accountName,
        avatar: accountAvatar,
        role: accountRole,
      });

      setIsLoading(false);
      if (user) {
        saveProfileToLocalStorage(user);
        onSuccess(user);
      }
    } catch (err) {
      setIsLoading(false);
      console.error('Google auth error', err);
    }
  };

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleName.trim() || !customGoogleEmail.trim()) return;

    setIsLoading(true);
    setShowGoogleChooser(false);

    try {
      const user = await loginOrRegisterApi({
        email: customGoogleEmail.trim(),
        name: customGoogleName.trim(),
        avatar: selectedAvatar,
        role: customGoogleRole.trim() || 'Full Stack Developer',
      });

      setIsLoading(false);
      if (user) {
        saveProfileToLocalStorage(user);
        onSuccess(user);
      }
    } catch (err) {
      setIsLoading(false);
      console.error('Custom Google auth error', err);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[720px] bg-[#07090e] text-white flex flex-col justify-between py-6 px-6 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar with Back Button */}
      <div className="w-full flex items-center justify-between pt-2 z-10">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-300 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">Coding Partner</span>
        <div className="w-8" />
      </div>

      {/* Main Form Content */}
      <div className="w-full max-w-sm mx-auto my-auto z-10 py-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight">
            {isSignUp ? 'Join Coding Partner' : 'Welcome Back!'}
          </h2>
          <p className="text-xs text-slate-400 mt-2 font-light">
            {isSignUp
              ? 'Create your developer profile to start collaborating'
              : 'Sign in to access your profile and live connections'}
          </p>
        </motion.div>

        {/* Google Auth Buttons */}
        <div className="mb-4 space-y-2.5">
          <button
            type="button"
            onClick={() => {
              setIsAddingCustomGoogle(false);
              setShowGoogleChooser(true);
            }}
            className="w-full py-3 px-4 rounded-xl bg-white/[0.09] hover:bg-white/[0.15] border border-white/20 backdrop-blur-md flex items-center justify-center gap-3 text-xs font-semibold text-slate-100 transition-all active:scale-[0.98] cursor-pointer shadow-md group"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
            <span className="group-hover:text-white transition-colors">Continue with Google</span>
          </button>

          {/* Generic "Login with another profile" button */}
          <button
            type="button"
            onClick={() => {
              setIsAddingCustomGoogle(true);
              setShowGoogleChooser(true);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 flex items-center justify-center gap-2 text-xs font-medium text-slate-300 transition-all active:scale-[0.98] cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>Login with another profile</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#07090e] px-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            or with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name when signing up */}
          {isSignUp && (
            <div className="relative">
              <label className="text-xs text-slate-400 font-medium block mb-1 ml-1">Your Full Name</label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required={isSignUp}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 focus:border-purple-400/80 focus:bg-white/[0.09] focus:outline-none text-xs text-white placeholder-slate-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="relative">
            <label className="text-xs text-slate-400 font-medium block mb-1 ml-1">Email</label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 focus:border-purple-400/80 focus:bg-white/[0.09] focus:outline-none text-xs text-white placeholder-slate-500 transition-all"
              />
            </div>
          </div>

          {/* Role when signing up */}
          {isSignUp && (
            <div className="relative">
              <label className="text-xs text-slate-400 font-medium block mb-1 ml-1">Developer Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Full Stack Developer, Frontend, AI Engineer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 focus:border-purple-400/80 focus:bg-white/[0.09] focus:outline-none text-xs text-white placeholder-slate-500 transition-all"
              />
            </div>
          )}

          {/* Password Input */}
          <div className="relative">
            <div className="flex justify-between items-center mb-1 ml-1">
              <label className="text-xs text-slate-400 font-medium">Password</label>
              {!isSignUp && (
                <button type="button" className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors">
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 focus:border-purple-400/80 focus:bg-white/[0.09] focus:outline-none text-xs text-white placeholder-slate-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl liquid-button text-xs font-semibold text-white transition-all shadow-[0_4px_20px_rgba(124,58,237,0.4)] flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>{isSignUp ? 'Create Profile & Sign In' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle between Sign In and Sign Up */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {isSignUp ? (
              <>
                Already have an account? <span className="text-purple-400 font-semibold underline underline-offset-2">Sign In</span>
              </>
            ) : (
              <>
                Don't have an account? <span className="text-purple-400 font-semibold underline underline-offset-2">Sign Up</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Google Account Chooser & "Login with another profile" Modal */}
      <AnimatePresence>
        {showGoogleChooser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-[#0f1422] border border-white/15 p-6 text-white shadow-2xl relative"
            >
              <button
                onClick={() => setShowGoogleChooser(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                  />
                </svg>
                <h3 className="text-base font-semibold text-white">Choose a Google Account</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                to sign in to <strong className="text-white">Coding Partner</strong>
              </p>

              {!isAddingCustomGoogle ? (
                <div className="space-y-2.5">
                  {/* Dynamically remembered accounts from this browser session */}
                  {savedProfiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() =>
                        handleSelectGoogleAccount(p.email, p.name, p.avatar, p.role)
                      }
                      className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-400/50"
                        />
                        <div>
                          <h4 className="text-xs font-semibold text-white">{p.name}</h4>
                          <p className="text-[11px] text-slate-400">{p.email}</p>
                        </div>
                      </div>
                      {currentActiveUserId === p.id && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                          Current
                        </span>
                      )}
                    </button>
                  ))}

                  {/* Generic "Login with another profile" Button */}
                  <button
                    onClick={() => setIsAddingCustomGoogle(true)}
                    className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/15 flex items-center gap-3 text-left transition-all cursor-pointer shadow-sm group"
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        Login with another profile
                      </h4>
                      <p className="text-[11px] text-slate-400 font-light">
                        Sign in with another Google account
                      </p>
                    </div>
                  </button>
                </div>
              ) : (
                /* Dynamic Google Account Sign-In Form */
                <form onSubmit={handleCustomGoogleSubmit} className="space-y-3.5">
                  <div className="text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/10">
                    Enter your Google account details to sign in. You can edit your name, photo, and profile after logging in.
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-medium">Profile Name</label>
                    <input
                      type="text"
                      value={customGoogleName}
                      onChange={(e) => setCustomGoogleName(e.target.value)}
                      placeholder="Your Google profile name"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-medium">Google Email</label>
                    <input
                      type="email"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      placeholder="you@gmail.com"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-medium">Developer Role</label>
                    <input
                      type="text"
                      value={customGoogleRole}
                      onChange={(e) => setCustomGoogleRole(e.target.value)}
                      placeholder="e.g. Full Stack Developer, Frontend, UI/UX"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  {/* Quick Avatar selector */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Initial Profile Photo</label>
                    <div className="flex gap-2">
                      {DEFAULT_AVATARS.slice(0, 5).map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedAvatar(av)}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform cursor-pointer ${
                            selectedAvatar === av ? 'border-cyan-400 scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={av} alt="avatar" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {savedProfiles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomGoogle(false)}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 font-medium"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl liquid-button text-xs font-semibold text-white flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(124,58,237,0.4)]"
                    >
                      <span>Continue with Google</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom bar indicator */}
      <div className="w-32 h-1 bg-white/30 rounded-full mx-auto" />
    </div>
  );
};
