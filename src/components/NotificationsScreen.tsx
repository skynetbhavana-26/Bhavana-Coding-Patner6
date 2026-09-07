import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Heart, MessageSquare, UserPlus, Check, X, 
  Sparkles, FolderKanban, CheckCheck 
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsScreenProps {
  notifications: AppNotification[];
  onBack: () => void;
  onAcceptRequest: (notifId: string, requesterId?: string) => void;
  onDeclineRequest: (notifId: string) => void;
  onMarkAllAsRead: () => void;
  onSelectNotification: (notif: AppNotification) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications,
  onBack,
  onAcceptRequest,
  onDeclineRequest,
  onMarkAllAsRead,
  onSelectNotification,
}) => {
  return (
    <div className="w-full pb-28 text-white min-h-[720px]">
      {/* Top Header matching Screenshot 9 */}
      <div className="pt-3 pb-3 px-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-slate-300 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-serif font-bold text-white tracking-tight">
            Notifications
          </h1>
        </div>

        <button
          onClick={onMarkAllAsRead}
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark Read</span>
        </button>
      </div>

      {/* Notifications List matching Screenshot 9 */}
      <div className="px-5 mt-4 space-y-3">
        {notifications.map((notif) => {
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onSelectNotification(notif)}
              className={`p-3.5 rounded-2xl liquid-glass border transition-all cursor-pointer ${
                notif.isRead
                  ? 'border-white/5 opacity-85'
                  : 'border-purple-500/30 shadow-[0_4px_20px_rgba(124,58,237,0.15)]'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar with type badge */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden ring-1 ring-white/20">
                    <img
                      src={notif.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                      alt="Notification avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Badge icon */}
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0d1020] border border-white/20 flex items-center justify-center">
                    {notif.type === 'like' && <Heart className="w-2.5 h-2.5 text-pink-500 fill-current" />}
                    {notif.type === 'comment' && <MessageSquare className="w-2.5 h-2.5 text-cyan-400" />}
                    {notif.type === 'message' && <MessageSquare className="w-2.5 h-2.5 text-purple-400" />}
                    {notif.type === 'connection_request' && <UserPlus className="w-2.5 h-2.5 text-emerald-400" />}
                    {notif.type === 'project_application' && <FolderKanban className="w-2.5 h-2.5 text-amber-400" />}
                  </span>
                </div>

                {/* Text info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-white line-clamp-1">
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                      {notif.time}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 font-light mt-0.5 line-clamp-2">
                    {notif.subtitle}
                  </p>

                  {/* Actionable buttons for Connection Requests */}
                  {notif.actionable && (
                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcceptRequest(notif.id, notif.requesterId);
                        }}
                        className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Accept</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeclineRequest(notif.id);
                        }}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 hover:bg-white/15 text-slate-300 flex items-center gap-1 cursor-pointer transition-all border border-white/10"
                      >
                        <X className="w-3 h-3" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {notifications.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs font-light">
            No notifications at the moment.
          </div>
        )}
      </div>
    </div>
  );
};
