'use client';

import { useRouter } from 'next/navigation';
import { Zap, Play, Trophy, Users, Clock, UserCheck, UserX } from 'lucide-react';

import { Card } from '~/components/ui/Card';
import { Badge } from '~/components/ui/Badge';
import { appStorage } from '~/lib/utils/storage';
import type { LastSession } from '~/types/api';

interface LastSessionCardProps {
  session: LastSession;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'default'; icon: string }> = {
  LOBBY: { label: 'En attente', variant: 'info', icon: '⏳' },
  GENERATING: { label: 'Génération...', variant: 'warning', icon: '🤖' },
  PLAYING: { label: 'En cours', variant: 'success', icon: '🎮' },
  PAUSED: { label: 'En pause', variant: 'warning', icon: '⏸️' },
  RESULTS: { label: 'Terminée', variant: 'default', icon: '🏁' },
};

export function LastSessionCard({ session }: LastSessionCardProps) {
  const router = useRouter();
  const isActive = ['LOBBY', 'GENERATING', 'PLAYING', 'PAUSED'].includes(session.status);
  const isResults = session.status === 'RESULTS';
  const config = STATUS_CONFIG[session.status] || STATUS_CONFIG.RESULTS;

  const getManagerFriendshipIcon = () => {
    switch (session.managerFriendshipStatus) {
      case 'ACCEPTED':
        return <UserCheck size={10} color="#00D397" />;
      case 'PENDING':
        return <Clock size={10} color="#F39C12" />;
      case 'DECLINED':
      case 'BLOCKED':
        return <UserX size={10} color="#FFFFFF40" />;
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
      className="w-full text-left active:opacity-90 hover:opacity-90 transition-opacity cursor-pointer"
    >
      <Card className="overflow-hidden border-0 relative">
        {/* Gradient accent border */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{
            background: isActive
              ? 'linear-gradient(to bottom, #00D397, #00B383)'
              : 'linear-gradient(to bottom, #3E3666, #342D5B)',
          }}
        />

        {/* Header */}
        <div className="flex flex-row items-center justify-between mb-3 pl-3">
          <div className="flex flex-row items-center">
            {isActive ? (
              <div className="w-8 h-8 rounded-lg bg-[#00D39720] flex items-center justify-center mr-2">
                <Zap size={16} color="#00D397" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#3E3666] flex items-center justify-center mr-2">
                <Trophy size={16} color="#FFD700" />
              </div>
            )}
            <p className="text-white font-bold text-base">
              {isActive ? 'Session en cours' : 'Dernière session'}
            </p>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        {/* Room name if linked */}
        {session.roomName && (
          <div className="flex flex-row items-center mb-2 bg-[#3E366640] rounded-lg px-3 py-2 ml-3">
            <span className="text-white/50 text-xs mr-1">📁</span>
            <span className="text-white/70 text-sm">{session.roomName}</span>
          </div>
        )}

        {/* Manager info */}
        <div className="flex flex-row items-center mb-3 pl-3">
          <span className="text-white/40 text-xs">Manager: {session.managerName}</span>
          {managerFriendshipIcon && (
            <span className="ml-1">{managerFriendshipIcon}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-row items-center justify-between pl-3">
          <div className="flex-1">
            {/* Code */}
            <div className="flex flex-row items-center mb-2">
              <span className="text-white/50 text-xs mr-2">Code</span>
              <span className="text-white text-lg font-bold tracking-widest">{session.code}</span>
            </div>

            {/* Stats row */}
            <div className="flex flex-row items-center gap-4">
              {isActive && (
                <>
                  <div className="flex flex-row items-center">
                    <Play size={12} color="#00D397" />
                    <span className="text-white/60 text-xs ml-1">
                      Q{session.currentQuestionIndex}/{session.totalQuestions}
                    </span>
                  </div>
                  <div className="flex flex-row items-center">
                    <Users size={12} color="#FFFFFF" />
                    <span className="text-white/60 text-xs ml-1">
                      {session.playerCount} joueurs
                    </span>
                  </div>
                </>
              )}
              {isResults && (
                <>
                  {session.myRank !== null && (
                    <div className="flex flex-row items-center">
                      <Trophy size={12} color="#FFD700" />
                      <span className="text-white/60 text-xs ml-1">
                        #{session.myRank}/{session.totalPlayers}
                      </span>
                    </div>
                  )}
                  {session.myScore !== null && (
                    <div className="flex flex-row items-center">
                      <Zap size={12} color="#00D397" />
                      <span className="text-[#00D397] text-xs font-semibold ml-1">
                        {session.myScore} pts
                      </span>
                    </div>
                  )}
                  {session.endedAt && (
                    <div className="flex flex-row items-center">
                      <Clock size={12} color="#FFFFFF" />
                      <span className="text-white/50 text-xs ml-1">
                        {new Date(session.endedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* CTA Button */}
          <div
            className={`px-4 py-2.5 rounded-xl ${isActive ? 'bg-[#00D397]' : 'bg-[#3E3666]'}`}
          >
            <span className={`font-bold text-sm ${isActive ? 'text-[#292349]' : 'text-white'}`}>
              {isActive ? 'Rejoindre' : 'Voir'}
            </span>
          </div>
        </div>
      </Card>
    </button>
  );
}
