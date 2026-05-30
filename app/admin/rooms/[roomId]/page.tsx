'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Crown,
  Users,
  Gamepad2,
  Trash2,
  ArrowRightLeft,
  X,
} from 'lucide-react';

import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import * as adminApi from '~/lib/api/admin';
import type { AdminRoomDetailResponse, AdminSessionStatus } from '~/types/api';

const STATUS_CONFIG: Record<AdminSessionStatus, { label: string; color: string }> = {
  LOBBY:      { label: 'Lobby',         color: '#00D397' },
  GENERATING: { label: 'Génération...', color: '#FFD700' },
  PLAYING:    { label: 'En cours',      color: '#4A90D9' },
  PAUSED:     { label: 'Pause',         color: '#F39C12' },
  RESULTS:    { label: 'Terminée',      color: '#C0C0C0' },
  CANCELLED:  { label: 'Annulée',       color: '#D5442F' },
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

type Tab = 'info' | 'members' | 'sessions';

export default function AdminRoomDetailPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState('');

  const { data: room, isLoading } = useQuery({
    queryKey: ['adminRoomDetail', roomId],
    queryFn: () => adminApi.getAdminRoomDetail(roomId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteAdminRoom(roomId),
    onSuccess: () => {
      toast.success('Salle supprimée');
      queryClient.invalidateQueries({ queryKey: ['adminRooms'] });
      router.push('/admin/rooms');
    },
    onError: () => toast.error('Impossible de supprimer la salle'),
  });

  const transferMutation = useMutation({
    mutationFn: (newOwner: string) => adminApi.transferRoomOwnership(roomId, newOwner),
    onSuccess: () => {
      toast.success('Propriété transférée');
      setShowTransferModal(false);
      setNewOwnerId('');
      queryClient.invalidateQueries({ queryKey: ['adminRoomDetail', roomId] });
      queryClient.invalidateQueries({ queryKey: ['adminRooms'] });
    },
    onError: () => toast.error('Impossible de transférer la propriété'),
  });

  const handleDelete = () => {
    if (!window.confirm(`Supprimer la salle "${room?.name}" ? Cette action est irréversible.`)) return;
    deleteMutation.mutate();
  };

  const handleTransfer = () => {
    if (!newOwnerId.trim()) return;
    transferMutation.mutate(newOwnerId.trim());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#292349] flex items-center justify-center">
        <Spinner text="Chargement..." />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#292349] flex items-center justify-center">
        <p className="text-white/50">Salle introuvable</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#292349] flex flex-col">
      {/* Header */}
      <div className="bg-[#292349] pt-6 pb-4 px-4 border-b border-[#3E3666]">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center mr-3 hover:bg-[#3E3666] transition-colors"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          <div className="flex-1">
            <p className="text-white font-bold text-xl">{room.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-white/50 text-xs">Code: {room.code}</span>
              {!room.isActive && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-[#D5442F20] text-[#D5442F]">Inactive</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#3E3666] hover:bg-[#4E4676] text-white/80 hover:text-white transition-colors text-xs font-medium"
            >
              <ArrowRightLeft size={14} />
              Transférer
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#D5442F20] hover:bg-[#D5442F30] text-[#D5442F] transition-colors text-xs font-medium"
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#3E3666]">
        {(['info', 'members', 'sessions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab ? 'text-[#00D397] border-b-2 border-[#00D397]' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {tab === 'info' ? 'Infos' : tab === 'members' ? 'Membres' : 'Sessions'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
        {activeTab === 'info' && (
          <div className="space-y-4">
            <Card>
              {[
                ['Nom', room.name],
                ['Code', room.code],
                ['Description', room.description ?? '—'],
                ['Propriétaire', room.ownerUsername],
                ['Max joueurs', room.maxPlayers],
                ['Membres', room.members.length],
                ['Sessions', room.sessions.length],
                ['Créée', formatDate(room.createdAt)],
                ['Mise à jour', formatDate(room.updatedAt)],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between py-2 border-b border-[#3E3666] last:border-0">
                  <span className="text-white/50 text-sm">{label}</span>
                  <span className="text-white text-sm font-medium">{String(value)}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {activeTab === 'members' && (
          <>
            {room.members.length === 0 ? (
              <Card className="flex items-center justify-center py-10">
                <p className="text-white/50">Aucun membre</p>
              </Card>
            ) : (
              room.members.map((member) => (
                <Card key={member.userId} className="mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#3E3666] flex items-center justify-center shrink-0">
                      <Users size={18} color="#FFFFFF80" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{member.username}</span>
                        {member.isOwner && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#FFD70020] text-[#FFD700] font-medium">
                            <Crown size={12} />
                            Owner
                          </span>
                        )}
                      </div>
                      <span className="text-white/40 text-xs">Rejoint {formatDate(member.joinedAt)}</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </>
        )}

        {activeTab === 'sessions' && (
          <>
            {room.sessions.length === 0 ? (
              <Card className="flex items-center justify-center py-10">
                <p className="text-white/50">Aucune session</p>
              </Card>
            ) : (
              room.sessions.map((s) => {
                const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG['RESULTS'];
                return (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/admin/sessions/${s.id}`)}
                    className="w-full text-left mb-3"
                  >
                    <Card>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold tracking-widest">{s.code}</span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between">
                          <span className="text-white/50 text-xs">Manager</span>
                          <span className="text-white text-xs">{s.managerUsername}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 text-xs">Joueurs</span>
                          <span className="text-white text-xs">{s.playerCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 text-xs">Questions</span>
                          <span className="text-white text-xs">{s.totalQuestions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 text-xs">Créée</span>
                          <span className="text-white text-xs">{formatDate(s.createdAt)}</span>
                        </div>
                      </div>
                    </Card>
                  </button>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Transfer modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-4">
          <div className="absolute inset-0" onClick={() => setShowTransferModal(false)} />
          <div className="relative bg-[#342D5B] rounded-2xl border border-[#3E3666] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Transférer la propriété</h3>
              <button onClick={() => setShowTransferModal(false)} className="p-1 text-white/50 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <label className="text-white/60 text-sm block mb-2">Nouveau propriétaire (userId)</label>
            <input
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              placeholder="ID utilisateur..."
              className="w-full bg-[#292349] text-white px-4 py-3 rounded-xl border border-[#3E3666] focus:border-[#9B59B6] focus:outline-none text-sm mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 py-3 rounded-xl bg-[#3E3666] text-white text-sm font-medium hover:bg-[#4E4676] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleTransfer}
                disabled={!newOwnerId.trim() || transferMutation.isPending}
                className="flex-1 py-3 rounded-xl bg-[#9B59B6] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {transferMutation.isPending ? 'Transfert...' : 'Transférer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
