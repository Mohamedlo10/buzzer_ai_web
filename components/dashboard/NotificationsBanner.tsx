'use client';

import { useRouter } from 'next/navigation';
import { Bell, ChevronRight } from 'lucide-react';

import { Card } from '~/components/ui/Card';

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
      className="w-full text-left active:opacity-90 hover:opacity-90 transition-opacity cursor-pointer"
    >
      <Card className="border-[#FFD70030] bg-[#342D5B]">
        <div className="flex flex-row items-center">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-[#FFD70015] flex items-center justify-center mr-3 shrink-0">
            <Bell size={20} color="#FFD700" />
          </div>

          {/* Text */}
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Notifications</p>
            <div className="flex flex-row items-center gap-3 mt-0.5">
              {pendingInvitations > 0 && (
                <span className="text-white/60 text-xs">
                  🎮 {pendingInvitations} invitation{pendingInvitations > 1 ? 's' : ''}
                </span>
              )}
              {pendingFriendRequests > 0 && (
                <span className="text-white/60 text-xs">
                  👥 {pendingFriendRequests} demande{pendingFriendRequests > 1 ? 's' : ''} d&apos;ami
                </span>
              )}
            </div>
          </div>

          {/* Badge + Arrow */}
          <div className="flex flex-row items-center">
            <div className="bg-[#D5442F] w-6 h-6 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs font-bold">{total > 9 ? '9+' : total}</span>
            </div>
            <ChevronRight size={16} color="#FFFFFF" />
          </div>
        </div>
      </Card>
    </button>
  );
}
