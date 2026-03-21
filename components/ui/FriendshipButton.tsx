'use client';

import { UserPlus, UserCheck, Clock, UserX } from 'lucide-react';
import type { FriendshipStatus } from '~/types/api';

interface FriendshipButtonProps {
  status?: FriendshipStatus;
  isCurrentUser?: boolean;
  onAddFriend?: () => void;
  size?: 'sm' | 'md';
}

export function FriendshipButton({
  status,
  isCurrentUser = false,
  onAddFriend,
  size = 'md',
}: FriendshipButtonProps) {
  // Don't show button for self
  if (isCurrentUser || status === 'SELF') return null;

  const buttonSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 14 : 18;

  // Already friends - show checkmark
  if (status === 'ACCEPTED') {
    return (
      <div className={`${buttonSize} rounded-full bg-[#00D39720] flex items-center justify-center`}>
        <UserCheck size={iconSize} color="#00D397" />
      </div>
    );
  }

  // Pending request - show clock
  if (status === 'PENDING') {
    return (
      <div className={`${buttonSize} rounded-full bg-[#F39C1220] flex items-center justify-center`}>
        <Clock size={iconSize} color="#F39C12" />
      </div>
    );
  }

  // Declined or Blocked - show disabled state
  if (status === 'DECLINED' || status === 'BLOCKED') {
    return (
      <div className={`${buttonSize} rounded-full bg-[#3E3666] flex items-center justify-center`}>
        <UserX size={iconSize} color="#FFFFFF40" />
      </div>
    );
  }

  // No relationship or undefined - show add friend button
  return (
    <button
      onClick={onAddFriend}
      className={`${buttonSize} rounded-full bg-[#00D397] flex items-center justify-center hover:bg-[#00D39730] transition-colors cursor-pointer`}
    >
      <UserPlus size={iconSize} color="#00412e" />
    </button>
  );
}
