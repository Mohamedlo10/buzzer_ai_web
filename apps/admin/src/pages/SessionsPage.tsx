import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Eye,
  Square,
  Search,
} from 'lucide-react';

import { DataTable, type Column } from '../components/admin/DataTable';
import { Card } from '../components/ui/Card';
import {
  adminApi,
  confirmAsync,
  type AdminSessionSummaryResponse,
  type AdminSessionStatus,
} from '@xalaat/core';

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
  LOBBY: { label: 'Lobby', color: 'var(--primary)', bg: 'rgba(224, 86, 36, 0.125)' },
  GENERATING: { label: 'Génération', color: 'var(--gold)', bg: 'rgba(217, 119, 6, 0.125)' },
  PLAYING: { label: 'En cours', color: 'var(--indigo)', bg: 'rgba(78, 140, 255, 0.125)' },
  PAUSED: { label: 'Pause', color: 'var(--warn)', bg: 'rgba(243, 156, 18, 0.125)' },
  RESULTS: { label: 'Terminée', color: 'var(--silver)', bg: 'rgba(192, 192, 192, 0.125)' },
  CANCELLED: { label: 'Annulée', color: 'var(--bad)', bg: 'rgba(231, 76, 60, 0.125)' },
};

function formatShortDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function isStopable(status: AdminSessionStatus) {
  return ['PLAYING', 'PAUSED', 'LOBBY', 'GENERATING'].includes(status);
}

export function SessionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, _setFromDate] = useState('');
  const [toDate, _setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const params = {
    page,
    size: 15,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
  };

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['adminSessions', params],
    queryFn: () => adminApi.getAdminSessions(params),
  });

  const { data: activeSessions, isLoading: _activeLoading } = useQuery({
    queryKey: ['adminActiveSessions'],
    queryFn: adminApi.getAdminActiveSessions,
    refetchInterval: 10000,
  });

  const stopMutation = useMutation({
    mutationFn: adminApi.forceStopSession,
    onSuccess: (_, _sessionId) => {
      toast.success('Session arrêtée avec succès');
      queryClient.invalidateQueries({ queryKey: ['adminSessions'] });
      queryClient.invalidateQueries({ queryKey: ['adminActiveSessions'] });
    },
    onError: () => {
      toast.error("Impossible d'arrêter la session");
    },
  });

  const handleStop = async (session: AdminSessionSummaryResponse) => {
    const confirmed = await confirmAsync({
      title: "Forcer l'arrêt ?",
      message: `La session ${session.code} sera interrompue pour tous les joueurs.`,
      confirmLabel: 'Arrêter',
      tone: 'warning',
    });
    if (!confirmed) return;
    stopMutation.mutate(session.id);
  };

  const filteredContent = (sessionsData?.content ?? []).filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.code.toLowerCase().includes(q) ||
      (s.managerUsername?.toLowerCase().includes(q) ?? false) ||
      (s.roomName?.toLowerCase().includes(q) ?? false)
    );
  });

  const columns: Column<AdminSessionSummaryResponse>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (s) => <span className="font-bold text-txt text-sm">#{s.code}</span>,
    },
    {
      key: 'sessionMode',
      header: 'Mode',
      render: (s) => (
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-2 text-txt-60">
          {s.sessionMode}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (s) => {
        const conf = STATUS_CONFIG[s.status] ?? {
          label: s.status,
          color: 'var(--txt)',
          bg: 'var(--surface-2)',
        };
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: conf.bg, color: conf.color }}
          >
            {conf.label}
          </span>
        );
      },
    },
    {
      key: 'playerCount',
      header: 'Joueurs',
      render: (s) => (
        <span className="text-sm text-txt">
          {s.playerCount}/{s.maxPlayers}
        </span>
      ),
    },
    {
      key: 'managerUsername',
      header: 'Hôte / Manager',
      render: (s) => <span className="text-sm text-txt-60">{s.managerUsername ?? '—'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (s) => <span className="text-xs text-txt-40">{formatShortDate(s.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/sessions/${s.id}`)}
            className="p-1.5 rounded-lg text-txt-60 hover:text-txt hover:bg-surface-2 transition-colors cursor-pointer"
            title="Détails"
          >
            <Eye size={16} />
          </button>
          {isStopable(s.status) && (
            <button
              onClick={() => handleStop(s)}
              disabled={stopMutation.isPending}
              className="p-1.5 rounded-lg text-bad hover:bg-bad/15 transition-colors cursor-pointer"
              title="Forcer l'arrêt"
            >
              <Square size={16} />
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
          <h1 className="text-txt text-2xl font-bold font-display">Sessions</h1>
          <p className="text-txt-60 text-sm">Surveillance et historique des parties</p>
        </div>
      </div>

      {/* Active Sessions Live Row */}
      {activeSessions && activeSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <h2 className="text-txt font-bold text-sm uppercase tracking-wider">
              En direct ({activeSessions.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSessions.map((session) => (
              <Card
                key={session.id}
                className="cursor-pointer hover:border-host transition-colors p-4"
                onClick={() => navigate(`/sessions/${session.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-txt">#{session.code}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent">
                    {session.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-txt-60">
                  <span>
                    {session.playerCount}/{session.maxPlayers} joueurs
                  </span>
                  <span>
                    Q{session.currentQuestionIndex}/{session.totalQuestions}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-surface p-4 rounded-2xl border border-line">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={16} color="var(--txt-40)" />
          <input
            type="text"
            placeholder="Filtrer par code, hôte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-txt text-sm outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="bg-surface-2 text-txt text-xs font-semibold px-3 py-2 rounded-xl border border-line outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sessions Table */}
      <DataTable
        columns={columns}
        data={filteredContent}
        keyExtractor={(s) => s.id}
        page={page}
        totalPages={sessionsData?.totalPages ?? 1}
        onPageChange={setPage}
        isLoading={sessionsLoading}
        onRowClick={(s) => navigate(`/sessions/${s.id}`)}
      />
    </div>
  );
}
