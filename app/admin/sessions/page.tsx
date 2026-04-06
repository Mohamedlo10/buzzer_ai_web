'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Square, ChevronDown, Users, Zap, Swords, Clock, Trophy, Filter, XCircle, ChevronRight } from 'lucide-react';

import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import * as adminApi from '~/lib/api/admin';
import type { AdminSessionSummaryResponse, AdminSessionStatus } from '~/types/api';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '',           label: 'Tous' },
  { value: 'LOBBY',      label: 'Lobby' },
  { value: 'GENERATING', label: 'Génération' },
  { value: 'PLAYING',    label: 'En cours' },
  { value: 'PAUSED',     label: 'Pause' },
  { value: 'RESULTS',    label: 'Terminée' },
  { value: 'CANCELLED',  label: 'Annulée' },
];

const STATUS_CONFIG: Record<AdminSessionStatus, { label: string; color: string; icon: React.ComponentType<{ size: number; color: string }> }> = {
  LOBBY:      { label: 'Lobby',         color: '#00D397', icon: Users },
  GENERATING: { label: 'Génération...', color: '#FFD700', icon: Zap },
  PLAYING:    { label: 'En cours',      color: '#4A90D9', icon: Swords },
  PAUSED:     { label: 'Pause',         color: '#F39C12', icon: Clock },
  RESULTS:    { label: 'Terminée',      color: '#C0C0C0', icon: Trophy },
  CANCELLED:  { label: 'Annulée',       color: '#D5442F', icon: XCircle },
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<AdminSessionSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [stoppingId, setStoppingId] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const loadSessions = async (pageNum = 0, append = false, status = statusFilter) => {
    try {
      const params: Record<string, unknown> = { page: pageNum, size: 20 };
      if (status) params.status = status;
      const response = await adminApi.getAllSessions(params);
      if (append) {
        setSessions((prev) => [...prev, ...response.content]);
      } else {
        setSessions(response.content);
      }
      setHasMore(!response.last);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(0);
    await loadSessions(0, false, statusFilter);
    setIsRefreshing(false);
  };

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(0);
    setIsLoading(true);
    setShowFilterMenu(false);
    loadSessions(0, false, value);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadSessions(nextPage, true);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 80) {
      handleLoadMore();
    }
  };

  const handleForceStop = async (session: AdminSessionSummaryResponse) => {
    const confirmed = window.confirm(`Forcer l'arrêt de la session ${session.code} ?`);
    if (!confirmed) return;
    setStoppingId(session.id);
    try {
      await adminApi.forceStopSession(session.id);
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, status: 'RESULTS' as AdminSessionStatus } : s))
      );
    } catch {
      window.alert("Impossible d'arrêter la session");
    } finally {
      setStoppingId(null);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeFilterLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'Tous';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#292349] flex items-center justify-center">
        <Spinner text="Chargement des sessions..." />
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
            <p className="text-white font-bold text-xl">Sessions</p>
            <p className="text-white/60 text-xs">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-[#00D397] text-sm font-medium hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-4 py-3 relative">
        <button
          onClick={() => setShowFilterMenu((v) => !v)}
          className="flex items-center gap-2 bg-[#342D5B] border border-[#3E3666] rounded-xl px-4 py-2.5"
        >
          <Filter size={15} color="#FFFFFF80" />
          <span className="text-white text-sm">{activeFilterLabel}</span>
          <ChevronDown size={15} color="#FFFFFF80" />
        </button>

        {showFilterMenu && (
          <div className="absolute top-full left-4 mt-1 bg-[#342D5B] border border-[#3E3666] rounded-xl overflow-hidden z-10 shadow-lg">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleFilterChange(opt.value)}
                className={`w-full text-left px-5 py-3 text-sm hover:bg-white/5 transition-colors ${
                  statusFilter === opt.value ? 'text-[#00D397] font-semibold' : 'text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-4" onScroll={handleScroll}>
        {sessions.length === 0 ? (
          <Card className="flex items-center justify-center py-12">
            <p className="text-white/50">Aucune session trouvée</p>
          </Card>
        ) : (
          sessions.map((session) => {
            const cfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG['RESULTS'];
            const StatusIcon = cfg.icon;
            const canStop = ['PLAYING', 'PAUSED', 'LOBBY', 'GENERATING'].includes(session.status);
            const isStopping = stoppingId === session.id;

            return (
              <Card key={session.id} className="mb-3">
                {/* Top row */}
                <button
                  onClick={() => router.push(`/admin/sessions/${session.id}`)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-lg tracking-widest">{session.code}</span>
                      {session.isTeamMode && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#4A90D920] text-[#4A90D9] font-medium">
                          Équipes
                        </span>
                      )}
                      {session.isPrivate && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFFFFF10] text-white/50 font-medium">
                          Privée
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: `${cfg.color}20` }}
                      >
                        <StatusIcon size={12} color={cfg.color} />
                        <span className="text-xs font-semibold" style={{ color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                      <ChevronRight size={16} color="#FFFFFF40" />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-1 mb-3">
                    <div className="flex justify-between">
                      <span className="text-white/50 text-sm">Manager</span>
                      <span className="text-white text-sm">{session.managerUsername}</span>
                    </div>
                    {session.roomName && (
                      <div className="flex justify-between">
                        <span className="text-white/50 text-sm">Salle</span>
                        <span className="text-white text-sm">{session.roomName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/50 text-sm">Mode</span>
                      <span className="text-white text-sm">{session.questionMode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50 text-sm">Joueurs</span>
                      <span className="text-white text-sm">{session.playerCount} / {session.maxPlayers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50 text-sm">Questions</span>
                      <span className="text-white text-sm">{session.totalQuestions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50 text-sm">Créée</span>
                      <span className="text-white text-sm">{formatDate(session.createdAt)}</span>
                    </div>
                    {session.startedAt && (
                      <div className="flex justify-between">
                        <span className="text-white/50 text-sm">Démarrée</span>
                        <span className="text-white text-sm">{formatDate(session.startedAt)}</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Force stop */}
                {canStop && (
                  <button
                    onClick={() => handleForceStop(session)}
                    disabled={isStopping}
                    className="w-full py-2.5 rounded-xl bg-[#D5442F20] hover:bg-[#D5442F30] transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Square size={14} color="#D5442F" />
                    <span className="text-[#D5442F] text-sm font-semibold">
                      {isStopping ? 'Arrêt en cours...' : "Forcer l'arrêt"}
                    </span>
                  </button>
                )}
              </Card>
            );
          })
        )}

        {hasMore && (
          <button
            onClick={handleLoadMore}
            className="w-full py-3 text-[#00D397] text-sm font-medium hover:opacity-80 transition-opacity mb-4"
          >
            Charger plus
          </button>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
