'use client';

import { ArrowLeft, Crown, Eye, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { teamColor, teamColorTint } from '~/lib/game/teamColors';
import type { PlayerResponse, QuestionResponse, SessionResponse, TeamResponse } from '~/types/api';

interface GameHeaderProps {
  session: SessionResponse;
  currentQuestion: QuestionResponse;
  questionIndex: number;
  isConnected: boolean;
  isManager: boolean;
  isSpectator: boolean;
  currentPlayer: PlayerResponse | undefined;
  teams: TeamResponse[];
}

export function GameHeader({
  session,
  currentQuestion,
  questionIndex,
  isConnected,
  isManager,
  isSpectator,
  currentPlayer,
  teams,
}: GameHeaderProps) {
  const router = useRouter();
  const sessionMode = session.sessionMode ?? 'WITH_MODERATOR';
  const isWithoutModerator = sessionMode === 'WITHOUT_MODERATOR';
  const isTeamMode = session.isTeamMode ?? false;

  return (
    <div className="shrink-0 z-20 bg-bg pt-4 pb-3 px-4 border-b border-line">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            if (session.roomId) router.replace(`/room/${session.roomId}`);
            else router.replace('/');
          }}
          className="w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center shrink-0"
        >
          <ArrowLeft size={18} className="text-txt" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-txt font-display font-semibold sm:text-[17px]">
            Question {questionIndex + 1}
            {session.totalQuestions > 0 && (
              <span className="text-txt-40 font-normal"> / {session.totalQuestions}</span>
            )}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-accent' : 'bg-buzz'}`} />
            <span className="text-txt-60 text-[11px]">{isConnected ? 'Connecté' : 'Déconnecté'}</span>
          </div>
        </div>

        {isManager && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-energy/12 border border-energy/30 text-energy text-[10px] font-bold shrink-0">
            <Crown size={10} fill="var(--gold)" color="var(--gold)" />
            {isWithoutModerator ? 'Host' : 'Manager'}
          </span>
        )}
        {isSpectator && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-energy/12 text-energy text-[10px] font-bold shrink-0">
            <Eye size={10} />
            Spectateur
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2.5">
        <span className="px-2 py-1 rounded-full bg-accent/12 border border-accent/30 text-accent text-[11px] font-semibold">
          {currentQuestion.category}
        </span>
        <span className="px-2 py-1 rounded-full bg-surface-2 border border-line text-txt-60 text-[11px] font-semibold">
          {currentQuestion.difficulty}
        </span>
        <span
          className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${
            isWithoutModerator ? 'bg-host/12 border-host/30 text-host' : 'bg-energy/12 border-energy/30 text-energy'
          }`}
        >
          {isWithoutModerator ? 'Sans modérateur' : 'Avec modérateur'}
        </span>
        {isTeamMode && (
          <span className="px-2 py-1 rounded-full bg-team/12 border border-team/30 text-team text-[11px] font-semibold">
            Équipes
          </span>
        )}
        {isTeamMode &&
          currentPlayer?.teamId &&
          (() => {
            const myTeam = teams.find((t) => t.id === currentPlayer.teamId);
            if (!myTeam) return null;
            return (
              <span
                className="px-2 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1"
                style={{
                  backgroundColor: teamColorTint(myTeam.color, 12),
                  borderColor: teamColorTint(myTeam.color, 35),
                  color: teamColor(myTeam.color),
                }}
              >
                <Users size={11} />
                {myTeam.name}
              </span>
            );
          })()}
      </div>
    </div>
  );
}
