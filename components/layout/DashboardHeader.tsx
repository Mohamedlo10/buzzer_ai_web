'use client';

import { useAuthStore } from '~/stores/useAuthStore';
import { Bell, User } from 'lucide-react';

interface DashboardHeaderProps {
  notificationCount?: number;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export function DashboardHeader({
  notificationCount = 0,
  onNotificationPress,
  onProfilePress,
}: DashboardHeaderProps) {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex flex-row items-center justify-between px-4 pb-3 pt-5 bg-[#292349]">
      {/* Logo & Title */}
      <div className="flex flex-row items-center">
        <img
          src="icon.png"
          alt="BuzzMaster"
          className="w-14 h-14 rounded-xl mr-3 object-cover"
        />
        <div>
          <p className="text-white font-bold text-lg">BuzzMaster</p>
          <p className="text-[#00D397] text-xs font-medium">AI Trivia Game</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-row items-center">
        {/* Notification Bell */}
        <button
          onClick={onNotificationPress}
          className="relative px-2 mr-2 text-white hover:text-white/80 transition-colors"
        >
          <Bell size={24} />
          {notificationCount > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-[#D5442F] rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            </span>
          )}
        </button>

        {/* Profile */}
        <button
          onClick={onProfilePress}
          className="w-10 h-10 rounded-full bg-[#342D5B] border border-[#3E3666] flex items-center justify-center overflow-hidden hover:border-[#00D397] transition-colors"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={18} color="#FFFFFF" />
          )}
        </button>
      </div>
    </div>
  );
}

export function WelcomeSection() {
  const user = useAuthStore((state) => state.user);
  const username = user?.username || 'Joueur';
  const hour = new Date().getHours();

  let greeting = 'Bonjour';
  if (hour >= 12 && hour < 18) greeting = 'Bon après-midi';
  else if (hour >= 18) greeting = 'Bonsoir';

  return (
    <div className="px-4 py-4">
      <p className="text-white/60 text-sm font-medium mb-1">{greeting},</p>
      <p className="text-white text-2xl font-bold">{username} 👋</p>
    </div>
  );
}
