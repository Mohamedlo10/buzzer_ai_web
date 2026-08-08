import { Hand } from 'lucide-react';
import { Avatar } from '~/components/ui/Avatar';
import { teamColor } from '~/lib/game/teamColors';
import type { PlayerResponse, TeamResponse } from '~/types/api';

export interface BuzzAlertOverlayProps {
  isManager: boolean;
  phase: string;
  firstBuzzer: any;
  buzzQueue: any[];
  players: PlayerResponse[];
  myPlayerId?: string;
  isTeamMode: boolean;
  teams: TeamResponse[];
}

export function BuzzAlertOverlay({
  isManager,
  phase,
  firstBuzzer,
  buzzQueue,
  players,
  myPlayerId,
  isTeamMode,
  teams,
}: BuzzAlertOverlayProps) {
  if (!isManager || phase !== 'AWAITING_VALIDATION' || !firstBuzzer) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 bg-buzz/90 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-4">
            <Hand size={48} color="var(--bad)" />
          </div>
          <p className="text-txt font-bold text-5xl">BUZZ !</p>
          <p className="text-txt-60 text-2xl font-semibold mt-3">{firstBuzzer.playerName}</p>
          <p className="text-txt-60 text-base mt-1">
            A buzzé en{' '}
            {firstBuzzer.deltaMs < 1000
              ? `${firstBuzzer.deltaMs}ms`
              : `${(firstBuzzer.deltaMs / 1000).toFixed(1)}s`}
          </p>
          {buzzQueue.length > 1 && (
            <p className="text-txt-60 text-sm mt-2">
              +{buzzQueue.length - 1} autre{buzzQueue.length > 2 ? 's' : ''} en attente
            </p>
          )}
        </div>
      </div>

      {/* Buzz Queue Detail */}
      <div className="px-4 pb-8">
        <div className="bg-black/40 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-black/30">
            <p className="text-txt font-semibold text-center">File d'attente</p>
          </div>
          {buzzQueue.slice(0, 3).map((item, index) => {
            const qPlayer = players.find((p) => p.id === item.playerId);
            return (
              <div
                key={item.playerId}
                className={`flex flex-row items-center px-4 py-3 border-b border-white/10 ${
                  index === 0 ? 'bg-white/15' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 shrink-0 ${
                    index === 0 ? 'bg-white' : 'bg-white/30'
                  }`}
                >
                  <span
                    className={`font-bold text-xs ${index === 0 ? 'text-buzz' : 'text-txt'}`}
                  >
                    {index + 1}
                  </span>
                </div>
                <div className="mr-2 shrink-0">
                  <Avatar avatarUrl={qPlayer?.avatarUrl} username={item.playerName} size={30} />
                </div>
                <div className="flex-1 flex flex-row items-center gap-2 flex-wrap">
                  <span
                    className={`font-medium ${
                      item.playerId === myPlayerId ? 'text-energy' : 'text-txt'
                    }`}
                  >
                    {item.playerName}
                    {item.playerId === myPlayerId ? ' (Vous)' : ''}
                  </span>
                  {isTeamMode &&
                    item.teamName &&
                    (() => {
                      const itemTeamColor = teamColor(
                        teams.find((t) => t.id === item.teamId)?.color
                      );
                      return (
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `color-mix(in oklab, ${itemTeamColor} 22%, transparent)`,
                            color: itemTeamColor,
                          }}
                        >
                          {item.teamName}
                        </span>
                      );
                    })()}
                </div>
                <span className="text-txt-60 text-sm">
                  {item.deltaMs < 1000
                    ? `${item.deltaMs}ms`
                    : `${(item.deltaMs / 1000).toFixed(1)}s`}
                </span>
              </div>
            );
          })}
          {buzzQueue.length > 3 && (
            <div className="px-4 py-2 bg-black/20">
              <p className="text-txt-40 text-center text-sm">
                +{buzzQueue.length - 3} autres joueurs...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
