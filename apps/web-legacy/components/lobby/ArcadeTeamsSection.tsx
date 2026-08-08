import { Trophy, ChevronRight } from 'lucide-react';
import { Avatar } from '~/components/ui/Avatar';
import type { TeamResponse } from '~/types/api';
import { teamColor } from '~/lib/game/teamColors';

export function ArcadeTeamsSection({
  teams,
  currentPlayerId,
  isManager,
  userId,
  avatarMap,
  onChangeTeam,
  onManagerReassign,
  orbitronClass,
  rajdhaniClass,
}: {
  teams: TeamResponse[];
  currentPlayerId: string | null;
  isManager: boolean;
  userId?: string;
  avatarMap: Record<string, string | null>;
  onChangeTeam: () => void;
  onManagerReassign: (id: string, name: string) => void;
  orbitronClass: string;
  rajdhaniClass: string;
}) {
  return (
    <div className="px-4 pt-5">
      <div className="rounded-[18px] overflow-hidden bg-surface border border-line">
        <div className="px-5 py-3.5 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-team" />
            <span className={`${orbitronClass} text-txt-40 text-[10px] tracking-[0.2em] font-bold`}>ÉQUIPES</span>
          </div>
          {!isManager && (
            <button
              onClick={onChangeTeam}
              className="px-2.5 py-1 rounded-lg bg-team/10 border border-team/15 text-team text-[11px] font-semibold cursor-pointer hover:bg-team/15 transition-colors"
            >
              Changer
            </button>
          )}
        </div>
        {teams.map((team, idx) => (
          <div key={team.id} className={idx < teams.length - 1 ? 'border-b border-line' : ''}>
            <div className="px-5 py-2.5 flex items-center gap-2.5">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background: teamColor(team.color),
                  boxShadow: `0 0 5px ${teamColor(team.color)}`,
                }}
              />
              <span className={`${rajdhaniClass} flex-1 text-txt font-semibold text-sm`}>{team.name}</span>
              <span className={`${rajdhaniClass} text-txt-40 text-xs`}>
                {team.members.length} joueur{team.members.length !== 1 ? 's' : ''}
              </span>
            </div>
            {team.members.map((member) => {
              const isMe = member.id === currentPlayerId;
              return (
                <div
                  key={member.id}
                  className={`px-5 py-1.5 flex items-center gap-2.5 ${isMe ? 'bg-accent/5' : ''}`}
                >
                  <Avatar
                    avatarUrl={member.userId ? (avatarMap[member.userId] ?? member.avatarUrl) : member.avatarUrl}
                    username={member.name}
                    size={26}
                    borderColor={isMe ? 'var(--primary)' : undefined}
                  />
                  <span
                    className={`${rajdhaniClass} flex-1 text-[13px] ${isMe ? 'text-accent font-semibold' : 'text-txt-60'}`}
                  >
                    {member.name}{isMe ? ' (vous)' : ''}
                  </span>
                  {isManager && (
                    <button
                      onClick={() => onManagerReassign(member.id, member.name)}
                      className="w-[26px] h-[26px] rounded-md bg-surface-2 border border-line flex items-center justify-center cursor-pointer hover:bg-surface-2/80 transition-colors text-txt-40"
                    >
                      <ChevronRight size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
