import { Zap, CheckCircle, XCircle } from 'lucide-react';
import { Avatar } from '~/components/ui/Avatar';
import { teamColor } from '~/lib/game/teamColors';
import type { PlayerResponse, TeamResponse } from '~/types/api';

export interface BuzzQueueViewProps {
  buzzQueue: any[];
  phase: string;
  countdownSeconds: number | null;
  isManager: boolean;
  isValidating: boolean;
  players: PlayerResponse[];
  myPlayerId?: string;
  isTeamMode: boolean;
  teams: TeamResponse[];
  onValidate: (isCorrect: boolean, applyPenalty?: boolean) => void;
  onSetPendingWrong: (pending: { applyPenalty: boolean } | null) => void;
}

export function BuzzQueueView({
  buzzQueue,
  phase,
  countdownSeconds,
  isManager,
  isValidating,
  players,
  myPlayerId,
  isTeamMode,
  teams,
  onValidate,
  onSetPendingWrong,
}: BuzzQueueViewProps) {
  return (
    <div className="px-4 pt-2">
      <div
        className={`rounded-3xl border overflow-hidden ${
          buzzQueue.length > 0 ? 'border-accent bg-accent/5' : 'border-line bg-surface'
        }`}
      >
        {/* Queue Header */}
        <div
          className={`px-4 py-3 border-b ${
            buzzQueue.length > 0 ? 'border-accent/25 bg-accent/10' : 'border-line'
          }`}
        >
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                  buzzQueue.length > 0 ? 'bg-accent' : 'bg-surface-2'
                }`}
              >
                <Zap size={16} className={buzzQueue.length > 0 ? 'text-btn-fg' : 'text-txt-40'} />
              </div>
              <p className="text-txt font-bold text-base">File d'attente</p>
              <div
                className={`px-2.5 py-0.5 rounded-full ml-2 ${
                  buzzQueue.length > 0 ? 'bg-accent' : 'bg-surface-2'
                }`}
              >
                <span
                  className={`font-semibold text-sm ${
                    buzzQueue.length > 0 ? 'text-btn-fg' : 'text-txt'
                  }`}
                >
                  {buzzQueue.length}
                </span>
              </div>
            </div>
            {buzzQueue.length > 0 && (
              <div className="flex flex-row items-center bg-accent/15 px-3 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse" />
                <span className="text-accent text-sm font-medium">En cours</span>
              </div>
            )}
          </div>
        </div>

        {/* Queue List */}
        {buzzQueue.length > 0 ? (
          <div>
            {/* First buzzer */}
            <div className="px-4 py-3 bg-accent/10 border-b border-accent/20">
              <div className="flex flex-row items-center">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mr-3">
                  <span className="font-bold text-btn-fg text-lg">1</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-row items-center gap-2 flex-wrap">
                    <p className="text-txt font-bold text-lg">{buzzQueue[0].playerName}</p>
                    {isTeamMode &&
                      buzzQueue[0].teamName &&
                      (() => {
                        const itemTeamColor = teamColor(
                          teams.find((t) => t.id === buzzQueue[0].teamId)?.color
                        );
                        return (
                          <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `color-mix(in oklab, ${itemTeamColor} 22%, transparent)`,
                              color: itemTeamColor,
                            }}
                          >
                            {buzzQueue[0].teamName}
                          </span>
                        );
                      })()}
                  </div>
                  <p className="text-accent text-sm">En train de répondre</p>
                </div>
                {buzzQueue[0].deltaMs >= 0 && (
                  <div className="flex flex-col items-end">
                    <p className="text-txt font-bold text-base">
                      {buzzQueue[0].deltaMs < 1000
                        ? `${buzzQueue[0].deltaMs}ms`
                        : `${(buzzQueue[0].deltaMs / 1000).toFixed(1)}s`}
                    </p>
                    <p className="text-txt-40 text-xs">réaction</p>
                  </div>
                )}
              </div>

              {/* Buzz countdown */}
              {phase === 'AWAITING_VALIDATION' && countdownSeconds !== null && countdownSeconds > 0 && (
                <div className="mt-3 flex flex-row items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-linear"
                      style={{
                        width: `${(countdownSeconds / 10) * 100}%`,
                        backgroundColor:
                          countdownSeconds <= 3
                            ? 'var(--bad)'
                            : countdownSeconds <= 6
                              ? 'var(--gold)'
                              : 'var(--primary)',
                      }}
                    />
                  </div>
                  <span
                    className="text-sm font-bold tabular-nums w-6 text-right"
                    style={{
                      color:
                        countdownSeconds <= 3
                          ? 'var(--bad)'
                          : countdownSeconds <= 6
                            ? 'var(--gold)'
                            : 'var(--primary)',
                    }}
                  >
                    {countdownSeconds}
                  </span>
                </div>
              )}

              {/* Quick Validation — Manager only */}
              {isManager && phase === 'AWAITING_VALIDATION' && (
                <div className="flex flex-row gap-2 mt-3 relative z-50">
                  <button
                    onClick={() => onValidate(true)}
                    disabled={isValidating}
                    className="flex-1 py-3 rounded-xl bg-accent flex items-center justify-center hover:bg-accent-d transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {isValidating ? (
                      <div className="w-4 h-4 border-2 border-btn-fg border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="flex flex-row items-center">
                        <CheckCircle size={18} className="text-btn-fg" />
                        <span className="text-btn-fg font-bold ml-1.5">Correct</span>
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => onSetPendingWrong({ applyPenalty: false })}
                    disabled={isValidating}
                    className="flex-1 py-3 rounded-xl bg-buzz flex items-center justify-center hover:bg-buzz/90 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <span className="text-white font-bold text-sm">Sans pénalité</span>
                  </button>
                  <button
                    onClick={() => onSetPendingWrong({ applyPenalty: true })}
                    disabled={isValidating}
                    className="px-3 py-3 rounded-xl bg-surface-2 flex items-center justify-center hover:bg-surface-3 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <div className="flex flex-row items-center">
                      <XCircle size={18} color="#FFFFFF" />
                      <span className="text-txt font-bold ml-1.5">Faux avec -</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Other buzzers */}
            {buzzQueue.slice(1).map((item, index) => {
              const qPlayer = players.find((p) => p.id === item.playerId);
              return (
                <div
                  key={item.playerId}
                  className="flex flex-row items-center px-4 py-2.5 border-b border-line last:border-b-0"
                >
                  <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center mr-2 shrink-0">
                    <span className="font-bold text-txt text-xs">{index + 2}</span>
                  </div>
                  <div className="mr-2 shrink-0">
                    <Avatar avatarUrl={qPlayer?.avatarUrl} username={item.playerName} size={30} />
                  </div>
                  <div className="flex-1 flex flex-row items-center gap-2 flex-wrap">
                    <span
                      className={`font-medium ${
                        item.playerId === myPlayerId ? 'text-accent' : 'text-txt-60'
                      }`}
                    >
                      {item.playerName}
                      {item.playerId === myPlayerId && ' (Vous)'}
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
          </div>
        ) : (
          <div className="px-5 py-6 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center mb-2">
              <Zap size={24} color="#FFFFFF40" />
            </div>
            <p className="text-txt-60 text-center text-sm">En attente de buzz...</p>
          </div>
        )}
      </div>
    </div>
  );
}
