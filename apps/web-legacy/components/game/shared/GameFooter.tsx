'use client';

import { useState } from 'react';
import { LiveLeaderboard } from '~/components/game/LiveLeaderboard';
import { TeamLeaderboard } from '~/components/game/TeamLeaderboard';
import { ScoreCorrectionSheet } from '~/components/game/ScoreCorrectionSheet';
import { PlayerProfileModal } from '~/components/ui/PlayerProfileModal';
import type { PlayerResponse, TeamResponse } from '~/types/api';

interface GameFooterProps {
  sessionId: string;
  players: PlayerResponse[];
  teams: TeamResponse[];
  isTeamMode: boolean;
  isManager: boolean;
  currentUserId?: string;
}

export function GameFooter({
  sessionId,
  players,
  teams,
  isTeamMode,
  isManager,
  currentUserId,
}: GameFooterProps) {
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);

  return (
    <>
      <div className="px-4 pt-3 pb-12">
        {isTeamMode ? (
          <TeamLeaderboard
            teams={teams}
            players={players}
            currentUserId={currentUserId}
            onCorrectClick={isManager ? () => setShowCorrection(true) : undefined}
          />
        ) : (
          <LiveLeaderboard
            players={players}
            currentUserId={currentUserId}
            onPlayerTap={(p) => p.userId && setProfileUserId(p.userId)}
            onCorrectClick={isManager ? () => setShowCorrection(true) : undefined}
          />
        )}
      </div>

      <PlayerProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      <ScoreCorrectionSheet
        isOpen={showCorrection}
        onClose={() => setShowCorrection(false)}
        players={players}
        sessionId={sessionId}
        currentUserId={currentUserId}
      />
    </>
  );
}
