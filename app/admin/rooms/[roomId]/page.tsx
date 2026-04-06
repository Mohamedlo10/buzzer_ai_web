'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Crown, Users, Gamepad2 } from 'lucide-react';

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

  const [room, setRoom] = useState<AdminRoomDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('info');

  useEffect(() => {
    adminApi.getAdminRoomDetail(roomId)
      .then(setRoom)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [roomId]);

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
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#3E3666]">
        {([['info', 'Infos'], ['members', 'Membres'], ['sessions', 'Sessions']] as [Tab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-[#00D397] border-b-2 border-[#00D397]'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4">
        {/* Info tab */}
        {activeTab === 'info' && (
          <Card>
            {[
              ['Propriétaire', room.ownerUsername],
              ['Description', room.description ?? '—'],
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
        )}

        {/* Members tab */}
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
                        {member.isOwner && <Crown size={14} color="#FFD700" />}
                      </div>
                      <span className="text-white/40 text-xs">Rejoint {formatDate(member.joinedAt)}</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </>
        )}

        {/* Sessions tab */}
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

        <div className="h-8" />
      </div>
    </div>
  );
}
