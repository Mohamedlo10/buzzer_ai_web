'use client';

import { User, Check, X, Clock } from 'lucide-react';

import { Card } from '~/components/ui/Card';
import type { FriendRequestResponse, SentFriendRequestResponse } from '~/types/api';

interface ReceivedRequestCardProps {
  type: 'received';
  request: FriendRequestResponse;
  onAccept: () => void;
  onDecline: () => void;
}

interface SentRequestCardProps {
  type: 'sent';
  request: SentFriendRequestResponse;
  onCancel: () => void;
}

type FriendRequestCardProps = ReceivedRequestCardProps | SentRequestCardProps;

export function FriendRequestCard(props: FriendRequestCardProps) {
  if (props.type === 'sent') {
    const { request, onCancel } = props;
    return (
      <Card className="mb-3">
        <div className="flex flex-row items-center">
          <div className="w-12 h-12 rounded-full bg-[#3E3666] flex items-center justify-center mr-3 shrink-0">
            <User size={24} color="#FFFFFF" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold">{request.receiver.username}</p>
            <div className="flex flex-row items-center gap-1 mt-0.5">
              <Clock size={12} color="#FFFFFF60" />
              <p className="text-white/50 text-sm">Demande envoyée</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-full bg-[#3E3666] flex items-center justify-center hover:bg-[#D5442F30] transition-colors cursor-pointer"
          >
            <X size={18} color="#FFFFFF80" />
          </button>
        </div>
      </Card>
    );
  }

  const { request, onAccept, onDecline } = props;
  return (
    <Card className="mb-3">
      <div className="flex flex-row items-center">
        <div className="w-12 h-12 rounded-full bg-[#3E3666] flex items-center justify-center mr-3 shrink-0">
          <User size={24} color="#FFFFFF" />
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold">{request.requester.username}</p>
          <p className="text-white/50 text-sm">Vous a envoyé une demande</p>
        </div>
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
