'use client';

import { useRouter } from 'next/navigation';
import { Bell, ChevronRight } from 'lucide-react';

interface NotificationsBannerProps {
  pendingInvitations: number;
  pendingFriendRequests: number;
}

export function NotificationsBanner({ pendingInvitations, pendingFriendRequests }: NotificationsBannerProps) {
  const router = useRouter();
  const total = pendingInvitations + pendingFriendRequests;
  if (total === 0) return null;

  return (
    <button
      onClick={() => router.push('/notifications')}
      className="w-full text-left flex flex-row items-center gap-3 px-3.5 py-3 bg-surface rounded-2xl hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer"
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-energy/15 text-energy flex items-center justify-center shrink-0">
        <Bell size={20} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-txt font-bold text-sm">Notifications</p>
        <div className="flex flex-row items-center gap-3 mt-0.5">
          {pendingInvitations > 0 && (
            <span className="text-txt-60 text-xs">
              🎮 {pendingInvitations} invitation{pendingInvitations > 1 ? 's' : ''}
            </span>
          )}
          {pendingFriendRequests > 0 && (
            <span className="text-txt-60 text-xs">
              👥 {pendingFriendRequests} demande{pendingFriendRequests > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Badge + Arrow */}
      <div className="w-6 h-6 rounded-full bg-buzz text-white text-[11px] font-bold flex items-center justify-center shrink-0">
        {total > 9 ? '9+' : total}
      </div>
      <ChevronRight size={16} className="text-txt-40 shrink-0" />
    </button>
  );
}
