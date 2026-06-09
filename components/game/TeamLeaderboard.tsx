'use client';

import { Users } from 'lucide-react';
import { Avatar } from '~/components/ui/Avatar';
import type { PlayerResponse, TeamResponse } from '~/types/api';

interface TeamLeaderboardProps {
  teams: TeamResponse[];
  players: PlayerResponse[];
  currentUserId?: string;
  compact?: boolean;
  onCorrectClick?: () => void;
}

export function TeamLeaderboard({
  teams,
  players,
  currentUserId,
  compact = false,
  onCorrectClick,
}: TeamLeaderboardProps) {
  // Compute team standings (sum of members' scores)
  const teamStandings = teams
    .map((t) => {
      const members = players
        .filter((p) => p.teamId === t.id)
        .sort((a, b) => b.score - a.score);
      const totalScore = members.reduce((sum, m) => sum + m.score, 0);
      return { ...t, members, totalScore };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  const maxTotal = teamStandings.length > 0 ? Math.max(1, teamStandings[0].totalScore) : 1;

  return (
    <div className="bg-surface rounded-[20px] border border-line overflow-hidden flex flex-col shrink-0">
      {/* Header */}
      <div className="flex flex-row items-center justify-between px-4 py-3 border-b border-line bg-team/5">
        <div className="flex flex-row items-center gap-2">
          <Users size={16} className="text-team" />
          <span className="text-txt font-bold text-sm">Classement équipes</span>
        </div>
        {onCorrectClick ? (
          <button
            onClick={onCorrectClick}
            type="button"
            className="px-2.5 py-1 rounded-lg bg-energy/10 border border-energy/30 text-energy text-xs font-semibold cursor-pointer hover:bg-energy/20 transition-colors flex items-center gap-1"
          >
            <span>✎</span> Corriger
          </button>
        ) : (
          <span className="text-txt-40 text-xs font-semibold">{teamStandings.length} équipes</span>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col">
        {teamStandings.map((team, index) => {
          const isMyTeam = team.members.some((m) => m.userId === currentUserId);
          const teamColor = team.color ?? '#4A90D9';
          // Width percentage for the progress bar background indicator
          const widthPercent = Math.min(100, Math.round((team.totalScore / maxTotal) * 100));

          return (
            <div
              key={team.id}
              className={`relative px-4 py-3.5 border-b border-line last:border-b-0 flex flex-col overflow-hidden ${
                isMyTeam ? 'bg-team/5' : ''
              }`}
            >
              {/* Progress bar background indicator */}
              <div
                className="absolute bottom-0 left-0 top-0 transition-all duration-500 ease-out pointer-events-none"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: teamColor,
                  opacity: 0.12,
                }}
              />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center min-w-0">
                  {/* Rank Badge */}
                  <span
                    className="w-[26px] h-[26px] rounded-lg flex items-center justify-center mr-2.5 text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: teamColor }}
                  >
                    {index + 1}
                  </span>

                  {/* Dot pastille */}
                  <div
                    className="w-[9px] h-[9px] rounded-full mr-2 shrink-0"
                    style={{ backgroundColor: teamColor }}
                  />
                  
                  {/* Team Name */}
                  <span className="text-txt font-bold text-[14.5px] truncate mr-2">
                    {team.name}
                  </span>
                  
                  {isMyTeam && (
                    <span className="px-2 py-0.5 rounded-full bg-team/10 border border-team/20 text-team text-[9px] font-bold uppercase shrink-0">
                      Mon équipe
                    </span>
                  )}
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <span className="font-display font-semibold text-[19px]" style={{ color: teamColor }}>
                    {team.totalScore}
                  </span>
                  <span className="text-txt-40 text-xs ml-1 font-semibold">pts</span>
                </div>
              </div>

              {/* Members Avatars (if not compact) */}
              {!compact && team.members.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 ml-[36px] relative z-10">
                  <div className="flex items-center -space-x-2">
                    {team.members.map((member) => (
                      <div key={member.id} className="relative rounded-full bg-surface">
                        <Avatar
                          avatarUrl={member.avatarUrl}
                          username={member.name}
                          size={24}
                          borderColor={teamColor}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
