import { X } from 'lucide-react';
import type { TeamResponse } from '~/types/api';
import { teamColor, teamColorTint } from '~/lib/game/teamColors';

export interface TeamPickerModalProps {
  teams: TeamResponse[];
  targetPlayer: { id: string; name: string } | null;
  isChangingTeam: boolean;
  onAssignTeam: (playerId: string, teamId: string) => void;
  onClose: () => void;
  orbitronClass: string;
  rajdhaniClass: string;
}

export function TeamPickerModal({
  teams,
  targetPlayer,
  isChangingTeam,
  onAssignTeam,
  onClose,
  orbitronClass,
  rajdhaniClass,
}: TeamPickerModalProps) {
  return (
    <div className="fixed inset-0 bg-scrim flex items-end justify-center z-50 backdrop-blur-sm">
      <div className="rounded-t-3xl w-full max-w-[480px] bg-surface border-t border-line animate-[sheetup_.3s_ease-out_both]">
        <div className="px-5 pt-[18px] pb-3 border-b border-line flex items-center justify-between">
          <div>
            <p className={`${orbitronClass} text-txt font-bold text-[15px]`}>Changer d&apos;équipe</p>
            {targetPlayer && (
              <p className={`${rajdhaniClass} text-txt-40 text-[11px] mt-0.5`}>{targetPlayer.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-[34px] h-[34px] rounded-full bg-surface-2 border border-line flex items-center justify-center cursor-pointer text-txt hover:bg-surface-2/80 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-3 flex flex-col gap-2">
          {teams.map((team) => {
            const isCurrent = team.members.some((m) => m.id === targetPlayer?.id);
            return (
              <button
                key={team.id}
                onClick={() => targetPlayer && onAssignTeam(targetPlayer.id, team.id)}
                disabled={isChangingTeam || isCurrent}
                className="flex items-center px-4 py-3.5 rounded-[14px] cursor-pointer transition-opacity disabled:opacity-60"
                style={{
                  background: isCurrent ? teamColorTint(team.color, 12) : 'var(--bg)',
                  border: `1px solid ${isCurrent ? teamColor(team.color) : 'var(--line)'}`,
                }}
              >
                <div
                  className="w-3 h-3 rounded-full mr-3 shrink-0"
                  style={{ background: teamColor(team.color) }}
                />
                <span className={`${rajdhaniClass} flex-1 text-txt font-semibold text-sm text-left`}>{team.name}</span>
                <span className={`${rajdhaniClass} text-txt-40 text-xs`}>
                  {team.members.length} joueur{team.members.length !== 1 ? 's' : ''}
                </span>
                {isCurrent && (
                  <div className="ml-2.5 px-2 py-0.5 rounded-md bg-accent/10">
                    <span className={`${rajdhaniClass} text-[11px] font-semibold text-accent`}>Actuel</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {isChangingTeam && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 0' }}>
            <div style={{ width: 22, height: 22, border: '2.5px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
          </div>
        )}
        <div style={{ height: 28 }} />
      </div>
    </div>
  );
}
