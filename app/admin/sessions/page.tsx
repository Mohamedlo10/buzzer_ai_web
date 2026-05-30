'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Activity,
  Eye,
  Square,
  Users,
  Zap,
  Swords,
  Clock,
  Trophy,
  XCircle,
  Search,
  Filter,
  Calendar,
  ChevronRight,
} from 'lucide-react';

import { DataTable, type Column } from '~/components/admin/DataTable';
import { Card } from '~/components/ui/Card';
import {
  getAdminSessions,
  getAdminActiveSessions,
  forceStopSession,
  type SearchSessionsParams,
} from '~/lib/api/admin';
import type {
  AdminSessionSummaryResponse,
  AdminSessionStatus,
  AdminActiveSessionResponse,
} from '~/types/api';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'LOBBY', label: 'Lobby' },
  { value: 'GENERATING', label: 'Génération' },
  { value: 'PLAYING', label: 'En cours' },
  { value: 'PAUSED', label: 'Pause' },
  { value: 'RESULTS', label: 'Terminée' },
  { value: 'CANCELLED', label: 'Annulée' },
];

const STATUS_CONFIG: Record<AdminSessionStatus, { label: string; color: string; bg: string }> = {
  LOBBY:      { label: 'Lobby',      color: '#00D397', bg: '#00D39720' },
  GENERATING: { label: 'Génération', color: '#FFD700', bg: '#FFD70020' },
  PLAYING:    { label: 'En cours',   color: '#4A90D9', bg: '#4A90D920' },
  PAUSED:     { label: 'Pause',      color: '#F39C12', bg: '#F39C1220' },
  RESULTS:    { label: 'Terminée',   color: '#C0C0C0', bg: '#C0C0C020' },
  CANCELLED:  { label: 'Annulée',    color: '#D5442F', bg: '#D5442F20' },
};

function formatShortDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });
}

function isStopable(status: AdminSessionStatus) {
  return ['PLAYING', 'PAUSED', 'LOBBY', 'GENERATING'].includes(status);
}

export default function AdminSessionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const params: SearchSessionsParams = {
    page,
    size: 15,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
  };

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
  } = useQuery({
    queryKey: ['adminSessions', params],
    queryFn: () => getAdminSessions(params),
  });

  const {
    data: activeSessions,
    isLoading: activeLoading,
  } = useQuery({
    queryKey: ['adminActiveSessions'],
    queryFn: getAdminActiveSessions,
    refetchInterval: 10000,
  });

  const stopMutation = useMutation({
    mutationFn: forceStopSession,
    onSuccess: (_, sessionId) => {
      toast.success('Session arrêtée avec succès');
      queryClient.invalidateQueries({ queryKey: ['adminSessions'] });
      queryClient.invalidateQueries({ queryKey: ['adminActiveSessions'] });
      queryClient.setQueriesData(
        { queryKey: ['adminSessions'] },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map((s: AdminSessionSummaryResponse) =>
              s.id === sessionId ? { ...s, status: 'RESULTS' as AdminSessionStatus } : s
            ),
          };
        }
      );
    },
    onError: () => {
      toast.error("Impossible d'arrêter la session");
    },
  });

  const handleStop = (session: AdminSessionSummaryResponse) => {
    if (!window.confirm(`Forcer l'arrêt de la session ${session.code} ?`)) return;
    stopMutation.mutate(session.id);
  };

  const filteredContent = (sessionsData?.content ?? []).filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.code.toLowerCase().includes(q) ||
      s.managerUsername.toLowerCase().includes(q) ||
      (s.roomName ?? '').toLowerCase().includes(q)
    );
  });

  const columns: Column<AdminSessionSummaryResponse>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '100px',
      render: (row) => (
        <span className="font-bold text-white tracking-wider">{row.code}</span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      width: '130px',
      render: (row) => {
        const cfg = STATUS_CONFIG[row.status];
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: 'managerUsername',
      header: 'Manager',
      render: (row) => row.managerUsername,
    },
    {
      key: 'roomName',
      header: 'Salle',
      render: (row) => row.roomName ?? '—',
    },
    {
      key: 'players',
      header: 'Joueurs',
      width: '90px',
      render: (row) => `${row.playerCount} / ${row.maxPlayers}`,
    },
    {
      key: 'totalQuestions',
      header: 'Questions',
      width: '90px',
      render: (row) => row.totalQuestions,
    },
    {
      key: 'dates',
      header: 'Dates',
      width: '150px',
      render: (row) => (
        <div className="flex flex-col text-xs text-white/60">
          <span>C: {formatShortDate(row.createdAt)}</span>
          {row.startedAt && <span>D: {formatShortDate(row.startedAt)}</span>}
          {row.endedAt && <span>F: {formatShortDate(row.endedAt)}</span>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/sessions/${row.id}`);
            }}
            className="p-1.5 rounded-lg bg-[#3E3666] hover:bg-[#4E4676] transition-colors"
            title="Voir détail"
          >
            <Eye size={14} color="#FFFFFF" />
          </button>
          {isStopable(row.status) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStop(row);
              }}
              disabled={stopMutation.isPending && stopMutation.variables === row.id}
              className="p-1.5 rounded-lg bg-[#D5442F20] hover:bg-[#D5442F30] transition-colors disabled:opacity-40"
              title="Forcer l'arrêt"
            >
              <Square size={14} color="#D5442F" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Sessions</h1>
          <p className="text-white/50 text-sm">Gestion des sessions de jeu</p>
        </div>
      </div>

      {/* Active Sessions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={18} color="#00D397" />
          <h2 className="text-white font-bold">Sessions actives</h2>
          <span className="ml-auto px-2 py-0.5 bg-[#00D39720] text-[#00D397] text-xs rounded-full font-semibold">
            {activeSessions?.length ?? 0} live
          </span>
        </div>
        {activeLoading ? (
          <div className="text-white/50 text-sm">Chargement...</div>
        ) : activeSessions?.length === 0 ? (
          <Card className="flex items-center justify-center py-8">
            <p className="text-white/40 text-sm">Aucune session active</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSessions?.map((s) => (
              <ActiveSessionCard
                key={s.id}
                session={s}
                onClick={() => router.push(`/admin/sessions/${s.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Search size={16} color="#FFFFFF60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par code, manager, salle..."
              className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-white/40"
            />
          </div>
          <div className="h-px lg:h-auto lg:w-px bg-[#3E3666]" />
          <div className="flex items-center gap-2">
            <Filter size={16} color="#FFFFFF60" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="bg-[#292349] text-white text-sm rounded-xl px-3 py-2 border border-[#3E3666] focus:outline-none focus:border-[#9B59B6]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} color="#FFFFFF60" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(0);
              }}
              className="bg-[#292349] text-white text-sm rounded-xl px-3 py-2 border border-[#3E3666] focus:outline-none focus:border-[#9B59B6]"
            />
            <span className="text-white/40 text-sm">à</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(0);
              }}
              className="bg-[#292349] text-white text-sm rounded-xl px-3 py-2 border border-[#3E3666] focus:outline-none focus:border-[#9B59B6]"
            />
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredContent}
        keyExtractor={(row) => row.id}
        page={page}
        totalPages={sessionsData?.totalPages ?? 1}
        onPageChange={(newPage) => setPage(newPage)}
        isLoading={sessionsLoading}
        onRowClick={(row) => router.push(`/admin/sessions/${row.id}`)}
      />

      <div className="text-white/40 text-xs">
        Total : {sessionsData?.totalElements ?? 0} session{sessionsData?.totalElements !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

function ActiveSessionCard({
  session,
  onClick,
}: {
  session: AdminActiveSessionResponse;
  onClick: () => void;
}) {
  const statusColor =
    session.status === 'PLAYING'
      ? '#00D397'
      : session.status === 'PAUSED'
      ? '#F39C12'
      : session.status === 'LOBBY'
      ? '#4A90D9'
      : '#9B59B6';

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:bg-[#3E366630] transition-colors group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: statusColor }}
          />
          <span className="text-white font-bold tracking-wider">#{session.code}</span>
        </div>
        <ChevronRight
          size={16}
          color="#FFFFFF40"
          className="group-hover:text-white transition-colors"
        />
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-white/50">Manager</span>
          <span className="text-white">{session.managerUsername}</span>
        </div>
        {session.roomName && (
          <div className="flex justify-between">
            <span className="text-white/50">Salle</span>
            <span className="text-white">{session.roomName}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-white/50">Joueurs</span>
          <span className="text-white">
            {session.playerCount} / {session.maxPlayers} ({session.connectedPlayers} connectés)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Questions</span>
          <span className="text-white">
            {session.currentQuestionIndex} / {session.totalQuestions}
          </span>
        </div>
      </div>
    </Card>
  );
}
