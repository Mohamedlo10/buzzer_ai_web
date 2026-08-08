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
      <div className={`${buttonSize} rounded-full bg-accent/15 flex items-center justify-center`}>
        <UserCheck size={iconSize} className="text-accent" />
      </div>
    );
  }

  // Pending request - show clock
  if (status === 'PENDING') {
    return (
      <div className={`${buttonSize} rounded-full bg-warn/15 flex items-center justify-center`}>
        <Clock size={iconSize} className="text-warn" />
      </div>
    );
  }

  // Declined or Blocked - show disabled state
  if (status === 'DECLINED' || status === 'BLOCKED') {
    return (
      <div className={`${buttonSize} rounded-full bg-surface-2 flex items-center justify-center`}>
        <UserX size={iconSize} className="text-txt-40" />
      </div>
    );
  }

  // No relationship or undefined - show add friend button
  return (
    <button
      onClick={onAddFriend}
      className={`${buttonSize} rounded-full bg-accent flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer`}
    >
      <UserPlus size={iconSize} className="text-btn-fg" />
    </button>
  );
}
