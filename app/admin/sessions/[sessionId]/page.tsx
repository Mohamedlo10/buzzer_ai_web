'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Square,
  Users,
  Trophy,
  BookOpen,
  CheckCircle,
  XCircle,
  Info,
  Swords,
  Clock,
  Zap,
} from 'lucide-react';

import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import { DataTable, type Column } from '~/components/admin/DataTable';
import {
  getAdminSessionDetail,
  forceStopSession,
} from '~/lib/api/admin';
import type {
  AdminSessionDetailResponse,
  AdminSessionStatus,
  AdminSessionPlayer,
  AdminSessionQuestion,
} from '~/types/api';

const STATUS_CONFIG: Record<
  AdminSessionStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  LOBBY:      { label: 'Lobby',      color: '#00D397', bg: '#00D39720', icon: Users },
  GENERATING: { label: 'Génération', color: '#FFD700', bg: '#FFD70020', icon: Zap },
  PLAYING:    { label: 'En cours',   color: '#4A90D9', bg: '#4A90D920', icon: Swords },
  PAUSED:     { label: 'Pause',      color: '#F39C12', bg: '#F39C1220', icon: Clock },
  RESULTS:    { label: 'Terminée',   color: '#C0C0C0', bg: '#C0C0C020', icon: Trophy },
  CANCELLED:  { label: 'Annulée',    color: '#D5442F', bg: '#D5442F20', icon: XCircle },
};

const DIFFICULTY_CONFIG = {
  EASY:   { label: 'Facile',    color: '#00D397' },
  MEDIUM: { label: 'Moyen',     color: '#F39C12' },
  HARD:   { label: 'Difficile', color: '#D5442F' },
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

type Tab = 'info' | 'players' | 'questions';

export default function AdminSessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const sessionId = params.sessionId as string;

  const [activeTab, setActiveTab] = useState<Tab>('info');

  const {
    data: session,
    isLoading,
  } = useQuery({
    queryKey: ['adminSessionDetail', sessionId],
    queryFn: () => getAdminSessionDetail(sessionId),
  });

  const stopMutation = useMutation({
    mutationFn: forceStopSession,
    onSuccess: () => {
      toast.success('Session arrêtée avec succès');
      queryClient.invalidateQueries({ queryKey: ['adminSessionDetail', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['adminSessions'] });
      queryClient.invalidateQueries({ queryKey: ['adminActiveSessions'] });
    },
    onError: () => {
      toast.error("Impossible d'arrêter la session");
    },
  });

  const handleForceStop = () => {
    if (!session) return;
    if (!window.confirm(`Forcer l'arrêt de la session ${session.code} ?`)) return;
    stopMutation.mutate(session.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner text="Chargement..." />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-txt-60">Session introuvable</p>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG['RESULTS'];
  const canStop = ['PLAYING', 'PAUSED', 'LOBBY', 'GENERATING'].includes(session.status);
  const StatusIcon = cfg.icon;

  const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);
  const rankedPlayers = sortedPlayers.map((p, i) => ({ ...p, rank: i + 1 }));

  const playerColumns: Column<AdminSessionPlayer & { rank: number }>[] = [
    {
      key: 'rank',
      header: '#',
      width: '50px',
      render: (row) => (
        <span className={`text-xs font-bold ${
          row.rank === 1 ? 'text-[#FFD700]' :
          row.rank === 2 ? 'text-[#C0C0C0]' :
          row.rank === 3 ? 'text-[#CD7F32]' :
          'text-txt-60'
        }`}>
          #{row.rank}
        </span>
      ),
    },
    {
      key: 'username',
      header: 'Joueur',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-txt font-medium">{row.username}</span>
          {row.isManager && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[#FFD70020] text-[#FFD700]">Manager</span>
          )}
          {row.isSpectator && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[#FFFFFF10] text-txt-60">Spectateur</span>
          )}
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      width: '80px',
      render: (row) => <span className="text-[#00D397] font-bold">{row.score}</span>,
    },
    {
      key: 'joinedAt',
      header: 'Rejoint',
      width: '130px',
      render: (row) => <span className="text-txt-60 text-xs">{formatDate(row.joinedAt)}</span>,
    },
  ];

  const questionColumns: Column<AdminSessionQuestion>[] = [
    {
      key: 'orderIndex',
      header: '#',
      width: '50px',
      render: (row) => <span className="text-txt-60 text-xs">#{row.orderIndex + 1}</span>,
    },
    {
      key: 'category',
      header: 'Catégorie',
      width: '120px',
      render: (row) => (
        <span className="text-xs px-2 py-0.5 rounded bg-surface-2 text-txt-60">{row.category}</span>
      ),
    },
    {
      key: 'difficulty',
      header: 'Difficulté',
      width: '100px',
      render: (row) => {
        const diff = DIFFICULTY_CONFIG[row.difficulty] ?? DIFFICULTY_CONFIG['MEDIUM'];
        return (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${diff.color}20`, color: diff.color }}
          >
            {diff.label}
          </span>
        );
      },
    },
    {
      key: 'text',
      header: 'Question',
      render: (row) => (
        <span className="text-txt text-sm line-clamp-2">{row.text}</span>
      ),
    },
    {
      key: 'answer',
      header: 'Réponse',
      width: '150px',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <CheckCircle size={12} color="#00D397" />
          <span className="text-[#00D397] text-sm font-medium truncate">{row.answer}</span>
        </div>
      ),
    },
    {
      key: 'winner',
      header: 'Vainqueur',
      width: '130px',
      render: (row) =>
        row.winnerName ? (
          <div className="flex items-center gap-1.5">
            <Trophy size={12} color="#FFD700" />
            <span className="text-[#FFD700] text-xs">{row.winnerName}</span>
          </div>
        ) : row.isSkipped ? (
          <span className="text-[#F39C12] text-xs">Passée</span>
        ) : (
          <span className="text-txt/30 text-xs">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/sessions')}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-txt text-2xl font-bold tracking-wider">#{session.code}</h1>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: cfg.bg, color: cfg.color }}
              >
                <StatusIcon size={12} />
                {cfg.label}
              </span>
              {session.isTeamMode && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#4A90D920] text-[#4A90D9]">Équipes</span>
              )}
              {session.isPrivate && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFFFFF10] text-txt-60">Privée</span>
              )}
            </div>
            <p className="text-txt-60 text-sm mt-0.5">
              Manager : <span className="text-txt-60">{session.managerUsername}</span>
              {' · '}
              Créée : {formatDate(session.createdAt)}
            </p>
          </div>
        </div>
        {canStop && (
          <button
            onClick={handleForceStop}
            disabled={stopMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-[#D5442F20] rounded-xl hover:bg-[#D5442F30] transition-colors disabled:opacity-40"
          >
            <Square size={14} color="#D5442F" />
            <span className="text-[#D5442F] text-sm font-semibold">
              {stopMutation.isPending ? 'Arrêt...' : 'Forcer arrêt'}
            </span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line">
        {([
          ['info', 'Infos', Info],
          ['players', `Joueurs (${session.players.length})`, Users],
          ['questions', `Questions (${session.questions.length})`, BookOpen],
        ] as [Tab, string, React.ElementType][]).map(([tab, label, Icon]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-[#00D397] border-b-2 border-[#00D397]'
                : 'text-txt-60 hover:text-txt-60'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              title="Général"
              rows={[
                ['Statut', cfg.label],
                ['Code', session.code],
                ['Mode questions', session.questionMode],
                ['Privée', session.isPrivate ? 'Oui' : 'Non'],
                ['Mode équipe', session.isTeamMode ? 'Oui' : 'Non'],
              ]}
            />
            <InfoCard
              title="Paramètres"
              rows={[
                ['Joueurs max', String(session.maxPlayers)],
                ['Questions', `${session.totalQuestions}`],
                ['Questions / catégorie', String(session.questionsPerCategory)],
                ['Points / bonne réponse', String(session.pointsPerCorrectAnswer)],
                ['Countdown buzz', `${session.buzzCountdownSeconds}s`],
                ['Dette', String(session.debtAmount)],
              ]}
            />
            <InfoCard
              title="Progression"
              rows={[
                ['Question courante', `${session.currentQuestionIndex} / ${session.totalQuestions}`],
                ['Joueurs', `${session.players.length} / ${session.maxPlayers}`],
              ]}
            />
            <InfoCard
              title="Dates"
              rows={[
                ['Créée', formatDate(session.createdAt)],
                ['Démarrée', formatDate(session.startedAt)],
                ['Terminée', formatDate(session.endedAt)],
              ]}
            />
            {session.roomName && (
              <InfoCard
                title="Salle"
                rows={[
                  ['Nom', session.roomName],
                  ['Code', session.roomCode ?? '—'],
                ]}
              />
            )}
          </div>
        )}

        {activeTab === 'players' && (
          <DataTable
            columns={playerColumns}
            data={rankedPlayers}
            keyExtractor={(row) => row.id}
            isLoading={false}
          />
        )}

        {activeTab === 'questions' && (
          <DataTable
            columns={questionColumns}
            data={session.questions}
            keyExtractor={(row) => row.id}
            isLoading={false}
          />
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <Card>
      <h3 className="text-txt font-bold mb-3">{title}</h3>
      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-txt-60">{label}</span>
            <span className="text-txt font-medium">{value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
