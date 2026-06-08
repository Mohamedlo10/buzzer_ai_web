'use client';

import { useRouter } from 'next/navigation';
import { Zap, Play, Trophy, Users, Clock, UserCheck, UserX } from 'lucide-react';

import { appStorage } from '~/lib/utils/storage';
import type { LastSession } from '~/types/api';

interface LastSessionCardProps {
  session: LastSession;
}

const STATUS_CONFIG: Record<string, { label: string; icon: string }> = {
  LOBBY: { label: 'En attente', icon: '⏳' },
  GENERATING: { label: 'Génération...', icon: '🤖' },
  PLAYING: { label: 'En cours', icon: '🎮' },
  PAUSED: { label: 'En pause', icon: '⏸️' },
  RESULTS: { label: 'Terminée', icon: '🏁' },
};

export function LastSessionCard({ session }: LastSessionCardProps) {
  const router = useRouter();
  const isActive = ['LOBBY', 'GENERATING', 'PLAYING', 'PAUSED'].includes(session.status);
  const isResults = session.status === 'RESULTS';
  const config = STATUS_CONFIG[session.status] || STATUS_CONFIG.RESULTS;

  const getManagerFriendshipIcon = () => {
    switch (session.managerFriendshipStatus) {
      case 'ACCEPTED':
        return <UserCheck size={10} className="text-accent" />;
      case 'PENDING':
        return <Clock size={10} className="text-warn" />;
      case 'DECLINED':
      case 'BLOCKED':
        return <UserX size={10} className="text-txt-40" />;
      default:
        return null;
    }
  };

  const handlePress = async () => {
    await appStorage.setActiveSession({
      sessionId: session.id,
      code: session.code,
    });

    switch (session.status) {
      case 'LOBBY':
        router.push(`/session/${session.code}/lobby`);
        break;
      case 'GENERATING':
        router.push(`/session/${session.code}/loading`);
        break;
      case 'PLAYING':
      case 'PAUSED':
        router.push(`/session/${session.code}/game`);
        break;
      case 'RESULTS':
      default:
        router.push(`/session/${session.code}/results`);
    }
  };

  const managerFriendshipIcon = getManagerFriendshipIcon();

  return (
    <button
      onClick={handlePress}
      className="w-full text-left relative overflow-hidden bg-surface border border-line rounded-[20px] py-3.5 px-3.5 pl-[18px] hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer"
    >
      {/* Gradient accent border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          background: isActive
            ? 'linear-gradient(to bottom, #00D397, #00B383)'
            : 'linear-gradient(to bottom, var(--surface-2), var(--surface))',
        }}
      />

      {/* Header */}
      <div className="flex flex-row items-center justify-between mb-3">
        <div className="flex flex-row items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-energy'}`}>
            {isActive ? <Zap size={16} /> : <Trophy size={16} />}
          </div>
          <p className="text-txt font-bold text-[15px]">
            {isActive ? 'Session en cours' : 'Dernière session'}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-surface-2 text-txt-60 text-xs font-semibold">
          {config.icon} {config.label}
        </span>
      </div>

      {/* Room name if linked */}
      {session.roomName && (
        <div className="flex flex-row items-center gap-1.5 mb-2 bg-surface-2/40 rounded-lg px-3 py-2">
          <span className="text-txt-40 text-xs">📁</span>
          <span className="text-txt-60 text-sm">{session.roomName}</span>
        </div>
      )}

      {/* Manager info */}
      <div className="flex flex-row items-center gap-1 mb-3">
        <span className="text-txt-40 text-xs">Manager: {session.managerName}</span>
        {managerFriendshipIcon}
      </div>

      {/* Content */}
      <div className="flex flex-row items-center justify-between">
        <div className="flex-1">
          {/* Code */}
          <div className="flex flex-row items-center gap-2 mb-1.5">
            <span className="text-txt-40 text-xs">Code</span>
            <span className="font-display font-semibold text-base tracking-[0.06em] whitespace-nowrap text-txt">{session.code}</span>
          </div>

          {/* Stats row */}
          <div className="flex flex-row items-center gap-3.5">
            {isActive && (
              <>
                <div className="flex flex-row items-center gap-1">
                  <Play size={12} className="text-accent" />
                  <span className="text-txt-60 text-xs">
                    Q{session.currentQuestionIndex}/{session.totalQuestions}
                  </span>
                </div>
                <div className="flex flex-row items-center gap-1">
                  <Users size={12} className="text-txt" />
                  <span className="text-txt-60 text-xs">
                    {session.playerCount} joueurs
                  </span>
                </div>
              </>
            )}
            {isResults && (
              <>
                {session.myRank !== null && (
                  <span className="text-txt-60 text-xs">🏆 #{session.myRank}/{session.totalPlayers}</span>
                )}
                {session.myScore !== null && (
                  <span className="text-accent text-xs font-bold">⚡ {session.myScore} pts</span>
                )}
                {session.endedAt && (
                  <span className="text-txt-60 text-xs">🕑 {new Date(session.endedAt).toLocaleDateString('fr-FR')}</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <div className={`px-4 py-2.5 rounded-xl font-bold text-sm ${isActive ? 'text-btn-fg' : 'text-txt bg-surface-2'}`} style={isActive ? { background: 'linear-gradient(135deg, #00D397, #00B383)' } : undefined}>
          {isActive ? 'Rejoindre' : 'Voir'}
        </div>
      </div>
    </button>
  );
}
