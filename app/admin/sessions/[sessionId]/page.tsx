'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Square, Users, Trophy, BookOpen, CheckCircle, XCircle } from 'lucide-react';

import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import * as adminApi from '~/lib/api/admin';
import type { AdminSessionDetailResponse, AdminSessionStatus } from '~/types/api';

const STATUS_CONFIG: Record<AdminSessionStatus, { label: string; color: string }> = {
  LOBBY:      { label: 'Lobby',         color: '#00D397' },
  GENERATING: { label: 'Génération...', color: '#FFD700' },
  PLAYING:    { label: 'En cours',      color: '#4A90D9' },
  PAUSED:     { label: 'Pause',         color: '#F39C12' },
  RESULTS:    { label: 'Terminée',      color: '#C0C0C0' },
  CANCELLED:  { label: 'Annulée',       color: '#D5442F' },
};

const DIFFICULTY_CONFIG = {
  EASY:   { label: 'Facile', color: '#00D397' },
  MEDIUM: { label: 'Moyen',  color: '#F39C12' },
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
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<AdminSessionDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStopping, setIsStopping] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('info');

  useEffect(() => {
    adminApi.getAdminSessionDetail(sessionId)
      .then(setSession)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  const handleForceStop = async () => {
    if (!session) return;
    const confirmed = window.confirm(`Forcer l'arrêt de la session ${session.code} ?`);
    if (!confirmed) return;
    setIsStopping(true);
    try {
      await adminApi.forceStopSession(session.id);
      setSession((prev) => prev ? { ...prev, status: 'RESULTS' } : prev);
    } catch {
      window.alert("Impossible d'arrêter la session");
    } finally {
      setIsStopping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#292349] flex items-center justify-center">
        <Spinner text="Chargement..." />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#292349] flex items-center justify-center">
        <p className="text-white/50">Session introuvable</p>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG['RESULTS'];
  const canStop = ['PLAYING', 'PAUSED', 'LOBBY', 'GENERATING'].includes(session.status);
  const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);

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
            <p className="text-white font-bold text-xl tracking-widest">{session.code}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
              >
                {cfg.label}
              </span>
              {session.isTeamMode && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#4A90D920] text-[#4A90D9]">Équipes</span>
              )}
              {session.isPrivate && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFFFFF10] text-white/50">Privée</span>
              )}
            </div>
          </div>
          {canStop && (
            <button
              onClick={handleForceStop}
              disabled={isStopping}
              className="flex items-center gap-1.5 bg-[#D5442F20] px-3 py-2 rounded-xl hover:bg-[#D5442F30] transition-colors disabled:opacity-40"
            >
              <Square size={14} color="#D5442F" />
              <span className="text-[#D5442F] text-xs font-semibold">
                {isStopping ? 'Arrêt...' : 'Forcer arrêt'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#3E3666]">
        {([['info', 'Infos'], ['players', 'Joueurs'], ['questions', 'Questions']] as [Tab, string][]).map(([tab, label]) => (
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
              ['Manager', session.managerUsername],
              ['Salle', session.roomName ?? '—'],
              ['Code salle', session.roomCode ?? '—'],
              ['Mode questions', session.questionMode],
              ['Joueurs', `${session.players.length} / ${session.maxPlayers}`],
              ['Questions', `${session.currentQuestionIndex} / ${session.totalQuestions}`],
              ['Points / bonne réponse', session.pointsPerCorrectAnswer],
              ['Countdown buzz (s)', session.buzzCountdownSeconds],
              ['Dette', session.debtAmount],
              ['Questions / catégorie', session.questionsPerCategory],
              ['Créée', formatDate(session.createdAt)],
              ['Démarrée', formatDate(session.startedAt)],
              ['Terminée', formatDate(session.endedAt)],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between py-2 border-b border-[#3E3666] last:border-0">
                <span className="text-white/50 text-sm">{label}</span>
                <span className="text-white text-sm font-medium">{String(value)}</span>
              </div>
            ))}
          </Card>
        )}

        {/* Players tab */}
        {activeTab === 'players' && (
          <>
            {sortedPlayers.length === 0 ? (
              <Card className="flex items-center justify-center py-10">
                <p className="text-white/50">Aucun joueur</p>
              </Card>
            ) : (
              sortedPlayers.map((player, index) => (
                <Card key={player.id} className="mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#3E3666] flex items-center justify-center shrink-0">
                      <span className="text-white/60 text-xs font-bold">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{player.username}</span>
                        {player.isManager && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[#FFD70020] text-[#FFD700]">Manager</span>
                        )}
                        {player.isSpectator && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[#FFFFFF10] text-white/50">Spectateur</span>
                        )}
                      </div>
                      <span className="text-white/40 text-xs">Rejoint {formatDate(player.joinedAt)}</span>
                    </div>
                    <span className="text-[#00D397] font-bold text-lg">{player.score}</span>
                  </div>
                </Card>
              ))
            )}
          </>
        )}

        {/* Questions tab */}
        {activeTab === 'questions' && (
          <>
            {session.questions.length === 0 ? (
              <Card className="flex items-center justify-center py-10">
                <p className="text-white/50">Aucune question</p>
              </Card>
            ) : (
              session.questions.map((q) => {
                const diff = DIFFICULTY_CONFIG[q.difficulty] ?? DIFFICULTY_CONFIG['MEDIUM'];
                return (
                  <Card key={q.id} className="mb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-xs">#{q.orderIndex + 1}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[#3E3666] text-white/60">{q.category}</span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${diff.color}20`, color: diff.color }}
                        >
                          {diff.label}
                        </span>
                      </div>
                      {q.isSkipped && (
                        <span className="text-xs text-[#F39C12]">Passée</span>
                      )}
                    </div>
                    <p className="text-white text-sm mb-2">{q.text}</p>
                    <div className="flex items-center gap-2 bg-[#00D39710] rounded-lg px-3 py-2">
                      <CheckCircle size={13} color="#00D397" />
                      <span className="text-[#00D397] text-sm font-medium">{q.answer}</span>
                    </div>
                    {q.winnerName && (
                      <div className="flex items-center gap-2 mt-2">
                        <Trophy size={13} color="#FFD700" />
                        <span className="text-[#FFD700] text-xs">Vainqueur : {q.winnerName}</span>
                      </div>
                    )}
                    {q.explanation && (
                      <p className="text-white/40 text-xs mt-2 italic">{q.explanation}</p>
                    )}
                  </Card>
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
