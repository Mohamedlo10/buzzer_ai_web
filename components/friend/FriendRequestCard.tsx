'use client';

import { User, Check, X } from 'lucide-react';

import { Card } from '~/components/ui/Card';
import type { FriendRequestResponse } from '~/types/api';

interface FriendRequestCardProps {
  request: FriendRequestResponse;
  onAccept: () => void;
  onDecline: () => void;
}

export function FriendRequestCard({ request, onAccept, onDecline }: FriendRequestCardProps) {
  const otherUser = request.requester;

  return (
    <Card className="mb-3">
      <div className="flex flex-row items-center">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-[#3E3666] flex items-center justify-center mr-3 shrink-0">
          <User size={24} color="#FFFFFF" />
        </div>

        {/* Info */}
        <div className="flex-1">
          <p className="text-white font-semibold">{otherUser.username}</p>
          <p className="text-white/50 text-sm">Vous a envoyé une demande</p>
        </div>

        {/* Actions */}
        <div className="flex flex-row">
          <button
            onClick={onAccept}
            className="w-10 h-10 rounded-full bg-[#00D397] flex items-center justify-center mr-2 hover:bg-[#00C085] transition-colors cursor-pointer"
          >
            <Check size={20} color="#292349" />
          </button>
          <button
            onClick={onDecline}
            className="w-10 h-10 rounded-full bg-[#D5442F] flex items-center justify-center hover:bg-[#C03020] transition-colors cursor-pointer"
          >
            <X size={20} color="#FFFFFF" />
          </button>
        </div>
      </div>
    </Card>
  );
}
