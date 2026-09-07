import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, User, KeyRound, Shield, Moon, Bell, 
  Globe, HelpCircle, Mail, Info, ChevronRight, LogOut, Check, Camera 
} from 'lucide-react';
import { Developer } from '../types';

interface SettingsScreenProps {
  currentUser?: Developer;
  onBack: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currentUser,
  onBack,
  onEditProfile,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [showModal, setShowModal] = useState<string | null>(null);

  return (
    <div className="w-full pb-28 text-white min-h-[720px]">
      {/* Top Header matching Screenshot 10 */}
      <div className="pt-3 pb-3 px-5 flex items-center justify-between border-b border-white/5">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-slate-300 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-serif font-bold text-white tracking-tight">Settings</h1>
        <div className="w-8" />
      </div>

      <div className="px-5 mt-5 space-y-6">
        {/* User Profile Card */}
        {currentUser && (
          <div
            onClick={onEditProfile}
            className="p-4 rounded-2xl liquid-glass border border-white/10 flex items-center justify-between cursor-pointer group hover:bg-white/[0.04] transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-purple-500 to-cyan-400">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 right-0 p-1 rounded-full bg-purple-600 text-white shadow">
                  <Camera className="w-2.5 h-2.5" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {currentUser.name}
                </h3>
                <p className="text-[11px] text-slate-400">@{currentUser.username}</p>
                <span className="inline-block mt-0.5 text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full font-medium">
                  {currentUser.role}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-cyan-400 font-medium">
              <span>Edit</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Account Section */}
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2 ml-1">
            Account
          </h2>
          <div className="rounded-2xl liquid-glass border border-white/10 overflow-hidden divide-y divide-white/5">
            <button
              onClick={onEditProfile}
              className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-200">Edit Profile</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => alert('Password security dialog: You are authenticated with secure Apple / Google session.')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-200">Change Password</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => alert('Privacy Controls: Developer visibility is currently set to Public & Verified Partners.')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-200">Privacy</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Preferences Section */}
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2 ml-1">
            Preferences
          </h2>
          <div className="rounded-2xl liquid-glass border border-white/10 overflow-hidden divide-y divide-white/5">
            {/* Dark Mode Toggle */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-200 block">Dark Mode</span>
                  <span className="text-[10px] text-slate-400">iOS 26 Liquid Glass Dark</span>
                </div>
              </div>
              <button
                onClick={onToggleDarkMode}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isDarkMode ? 'bg-purple-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  } top-1 absolute`}
                />
              </button>
            </div>

            {/* Push Notifications Toggle */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-200 block">Push Notifications</span>
                  <span className="text-[10px] text-slate-400">Connection requests & messages</span>
                </div>
              </div>
              <button
                onClick={() => setPushEnabled(!pushEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  pushEnabled ? 'bg-purple-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
                    pushEnabled ? 'translate-x-6' : 'translate-x-1'
                  } top-1 absolute`}
                />
              </button>
            </div>

            {/* Language Selector */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-200">Language</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>English</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2 ml-1">
            Support
          </h2>
          <div className="rounded-2xl liquid-glass border border-white/10 overflow-hidden divide-y divide-white/5">
            <button
              onClick={() => alert('Coding Partner FAQ: Real-time messaging, AI recommendations, and Git sync are active.')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-200">Help & FAQ</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => alert('Contact our developer support team at: support@codingpartner.dev')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-200">Contact Us</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => alert('Coding Partner v1.0.0 (Apple iOS 26 Liquid Glass Edition). Built for developers worldwide.')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-200">About App</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-2">
          <button
            onClick={onLogout}
            className="w-full py-3.5 px-4 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
