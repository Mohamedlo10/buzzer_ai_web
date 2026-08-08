import { XCircle, Mic } from 'lucide-react';
import type { PlayerResponse } from '~/types/api';

export interface PlayerActionViewProps {
  isManager: boolean;
  isSpectator: boolean;
  amIAnswering: boolean;
  phase: string;
  answeringPlayer?: PlayerResponse;
  countdownSeconds: number | null;
  answeredWrongThisQuestion: boolean;
}

export function PlayerActionView({
  isManager,
  isSpectator,
  amIAnswering,
  phase,
  answeringPlayer,
  countdownSeconds,
  answeredWrongThisQuestion,
}: PlayerActionViewProps) {
  if (isManager || isSpectator) return null;

  return (
    <div className="px-4 pt-4">
      <div className="flex flex-col gap-3">
        {amIAnswering ? (
          <div className="bg-surface rounded-2xl border border-accent p-3.5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
              <div>
                <p className="text-txt font-bold text-sm">Tu as buzzé ! Réponds à voix haute</p>
                <p className="text-txt-60 text-xs">En attente de la validation du modérateur…</p>
              </div>
            </div>
            {countdownSeconds !== null && countdownSeconds > 0 && (
              <div className="mt-2 flex flex-row items-center gap-3">
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
          </div>
        ) : phase === 'AWAITING_VALIDATION' && answeringPlayer ? (
          <div className="bg-surface rounded-2xl p-4 border border-line flex items-center justify-between">
            <div>
              <p className="text-txt-60 text-xs">En train de répondre</p>
              <p className="text-txt font-bold">{answeringPlayer.name}</p>
            </div>
            {countdownSeconds !== null && countdownSeconds > 0 && (
              <div className="w-10 h-10 rounded-full border-2 border-accent flex items-center justify-center">
                <span className="text-accent font-bold tabular-nums">{countdownSeconds}</span>
              </div>
            )}
          </div>
        ) : answeredWrongThisQuestion ? (
          <div className="bg-buzz/12 border border-buzz/30 rounded-2xl p-3.5 flex items-center gap-3">
            <XCircle size={18} className="text-buzz shrink-0" />
            <div>
              <p className="text-buzz font-bold text-sm">Réponse incorrecte</p>
              <p className="text-txt-60 text-xs">Buzzer désactivé — les autres peuvent répondre</p>
            </div>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl p-5 border border-line flex flex-col items-center text-center">
            <div className="w-[60px] h-[60px] rounded-full bg-accent/13 flex items-center justify-center mb-2.5">
              <Mic size={26} className="text-accent" />
            </div>
            <p className="text-txt font-semibold text-base">Écoute la question…</p>
            <p className="text-txt-60 text-[13px] mt-1">Le modérateur lit la question à voix haute</p>
          </div>
        )}
      </div>
    </div>
  );
}
