'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { XCircle, Users, Zap, Eye } from 'lucide-react';

import { Avatar } from '~/components/ui/Avatar';
import { BuzzerButton } from '~/components/game/BuzzerButton';
import { ProgressiveQuestionDisplay } from '~/components/game/ProgressiveQuestionDisplay';
import { AnswerChoicesPanel } from '~/components/game/AnswerChoicesPanel';
import { GlobalTimerBar } from '~/components/game/GlobalTimerBar';
import { AnswerRevealOverlay } from '~/components/game/AnswerRevealOverlay';
import { IdentificationQuestionDisplay } from '~/components/game/IdentificationQuestionDisplay';
import { FocusModePanel } from '~/components/game/FocusModePanel';
import { useBuzzStore } from '~/stores/useBuzzStore';
import * as gameApi from '~/lib/api/game';
import { serverNow, syncClock } from '~/lib/game/clock';
import { isAnswering, isBuzzerOpen, queuePositionOf } from '~/lib/game/packet';
import { teamColor, teamColorTint } from '~/lib/game/teamColors';
import { useDeadlineSeconds } from '~/lib/game/useDeadline';
import type { PlayerResponse, TeamResponse } from '~/types/api';

interface ModeratorFreeGameProps {
  sessionId: string;
  myPlayer: PlayerResponse | undefined;
  players: PlayerResponse[];
  teams: TeamResponse[];
  isManager: boolean;
  isSpectator: boolean;
  onAdvanceAfterAllWrong: () => void;
}

/**
 * Vue du mode sans modérateur.
 *
 * Tout l'état de jeu affiché ici vient du dernier `GameStatePacket` appliqué :
 * la phase, la file, qui a la main, l'échéance. Ce composant ne déduit plus
 * rien par lui-même — en particulier il ne considère plus que « le premier de
 * la file » est celui qui répond, divergence qui faisait apparaître le panneau
 * de réponse chez un joueur avant de le lui retirer.
 */
export function ModeratorFreeGame({
  sessionId,
  myPlayer,
  players,
  teams,
  isManager,
  isSpectator,
  onAdvanceAfterAllWrong,
}: ModeratorFreeGameProps) {
  const {
    game,
    currentQuestion,
    myAnswerChoices,
    answerTimeSeconds,
    answerReveal,
    isPaused,
  } = useBuzzStore();

  const [isBuzzing, setIsBuzzing] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [answerResult, setAnswerResult] = useState<'correct' | 'wrong' | null>(null);
  const [showBuzzFlash, setShowBuzzFlash] = useState(false);

  // Verrou local anti-double-appui, réarmé à chaque nouveau tour de buzzer.
  const buzzLockRef = useRef(false);

  const myPlayerId = myPlayer?.id;
  const amIAnswering = isAnswering(game, myPlayerId);
  const myQueuePosition = queuePositionOf(game, myPlayerId);
  const buzzerOpen = isBuzzerOpen(game) && !isPaused;
  const someoneIsAnswering = game.phase === 'ANSWERING' || game.phase === 'BUZZ_WINDOW';

  const globalSecondsLeft = useDeadlineSeconds(
    game.phase === 'READING' ? game.phaseEndsAtEpochMs : null,
  );

  // Synchronisation d'horloge : sans elle, l'instant d'appui envoyé au serveur
  // dépendrait de l'horloge système du navigateur.
  useEffect(() => {
    void syncClock();
  }, []);

  // Nouveau tour : on réarme le buzzer et on efface le résultat précédent.
  useEffect(() => {
    buzzLockRef.current = false;
    setAnswerResult(null);
  }, [game.packetQuestionId]);

  // La phase quitte ANSWERING : le résultat affiché n'a plus lieu d'être.
  useEffect(() => {
    if (game.phase !== 'ANSWERING') setAnswerResult(null);
  }, [game.phase]);

  const handleBuzz = useCallback(async () => {
    if (!buzzerOpen || buzzLockRef.current || isSpectator || !myPlayerId) return;
    if (game.buzzQueue.some((b) => b.playerId === myPlayerId)) return;

    buzzLockRef.current = true;
    setIsBuzzing(true);
    setShowBuzzFlash(true);
    setTimeout(() => setShowBuzzFlash(false), 850);

    try {
      // Instant exprimé dans le référentiel serveur, que le serveur bornera
      // ensuite au physiquement possible.
      await gameApi.buzz(sessionId, serverNow(), true);
    } catch (err: any) {
      // 409 = déjà buzzé, ou fenêtre fermée : l'état fait foi, pas d'alerte.
      if (err?.response?.status !== 409) {
        buzzLockRef.current = false;
      }
    } finally {
      setIsBuzzing(false);
    }
  }, [sessionId, buzzerOpen, isSpectator, myPlayerId, game.buzzQueue]);

  const handleSubmitAnswer = useCallback(
    async (chosenAnswer: string) => {
      if (isSubmittingAnswer) return;
      setIsSubmittingAnswer(true);
      try {
        const result = await gameApi.submitAnswer(sessionId, {
          chosenAnswer,
          questionId: game.packetQuestionId,
        });
        setAnswerResult(result.isCorrect ? 'correct' : 'wrong');
        // On n'efface pas les choix ici : c'est le prochain paquet qui fera
        // sortir de la phase ANSWERING. Le joueur voit donc son propre résultat
        // au lieu que le panneau disparaisse dans le même rendu.
      } catch (err: any) {
        if (err?.response?.status === 409) {
          // L'état a changé sous nos pieds (tour passé, question avancée).
          // On se recale sur le serveur plutôt que de vider l'écran.
          try {
            const state = await gameApi.getGameState(sessionId);
            useBuzzStore.getState().applyStatePacket(state.statePacket);
          } catch {
            /* le prochain paquet WebSocket recalera de toute façon */
          }
        }
      } finally {
        setIsSubmittingAnswer(false);
      }
    },
    [sessionId, isSubmittingAnswer, game.packetQuestionId],
  );

  if (!currentQuestion) return null;

  // ── Mode focus : le joueur a la main ────────────────────────────────────
  if (amIAnswering && myAnswerChoices) {
    return (
      <FocusModePanel
        questionText={currentQuestion.text}
        category={currentQuestion.category}
        choices={myAnswerChoices}
        answerTimeSeconds={answerTimeSeconds}
        deadlineEpochMs={game.phaseEndsAtEpochMs}
        onSubmit={handleSubmitAnswer}
        isSubmitting={isSubmittingAnswer}
        result={answerResult}
      />
    );
  }

  const firstBuzzer = game.buzzQueue[0];
  const answeredWrong =
    !!myPlayerId &&
    game.phase !== 'READING' &&
    !game.buzzQueue.some((b) => b.playerId === myPlayerId) &&
    myQueuePosition === null &&
    buzzLockRef.current;

  return (
    <div className="flex flex-col gap-3">
      {/* Timer global — visible uniquement quand le buzzer est ouvert */}
      {game.phase === 'READING' && game.phaseEndsAtEpochMs && (
        <GlobalTimerBar
          totalSeconds={Math.max(globalSecondsLeft, 1)}
          remainingSeconds={globalSecondsLeft}
          paused={isPaused}
        />
      )}

      {isManager && (
        <div className="bg-host/15 border border-host/25 rounded-xl px-3 py-2">
          <p className="text-host text-xs font-medium text-center">
            🎮 Vous êtes aussi un joueur dans ce mode
          </p>
        </div>
      )}

      {isSpectator && (
        <div className="bg-energy/10 border border-energy/30 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2">
          <Eye size={16} className="text-energy shrink-0" />
          <p className="text-energy text-xs font-semibold text-center">
            Mode spectateur — Vous observez la partie en cours
          </p>
        </div>
      )}

      {/* Énoncé */}
      {currentQuestion.questionType === 'IDENTIFICATION' && currentQuestion.imageUrl ? (
        <IdentificationQuestionDisplay
          imageUrl={currentQuestion.imageUrl}
          category={currentQuestion.category}
          text={currentQuestion.text}
        />
      ) : (
        <div className="relative">
          <ProgressiveQuestionDisplay
            text={currentQuestion.text}
            wordIndex={currentQuestion.text.split(' ').length - 1}
            isRunning={false}
          />
          {someoneIsAnswering && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-bg/80 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-bright" />
              <span className="text-energy text-[10px] font-bold tracking-widest uppercase">
                Pause
              </span>
            </div>
          )}
        </div>
      )}

      {/* Fenêtre de verrouillage : on attend de départager les buzz */}
      {game.phase === 'BUZZ_WINDOW' && (
        <div className="bg-accent/5 border border-accent/25 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
          <div>
            <p className="text-accent font-bold text-sm">Buzz enregistré</p>
            <p className="text-accent/60 text-xs">Départage en cours…</p>
          </div>
        </div>
      )}

      {/* J'ai la main mais les propositions n'ont pas encore arrivé */}
      {amIAnswering && !myAnswerChoices && (
        <div className="bg-accent/5 border border-accent/25 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
          <div>
            <p className="text-accent font-bold text-sm">C'est votre tour !</p>
            <p className="text-accent/60 text-xs">Chargement des choix…</p>
          </div>
        </div>
      )}

      {/* En file d'attente derrière quelqu'un */}
      {myQueuePosition !== null && myQueuePosition > 1 && game.phase === 'ANSWERING' && (
        <div className="bg-surface border border-line rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
            <span className="text-txt font-bold text-sm">#{myQueuePosition}</span>
          </div>
          <div>
            <p className="text-txt font-semibold text-sm">En file d'attente</p>
            <p className="text-txt-60 text-xs">
              Vous répondrez si {firstBuzzer?.playerName} se trompe
            </p>
          </div>
        </div>
      )}

      {/* Quelqu'un d'autre répond */}
      {game.phase === 'ANSWERING' && !amIAnswering && myQueuePosition === null && (
        <div className="bg-surface border border-line rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1 shrink-0">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-txt-60 text-sm">
            <span className="text-txt font-semibold">
              {game.buzzQueue.find((b) => b.playerId === game.answeringPlayerId)?.playerName ??
                firstBuzzer?.playerName}
            </span>{' '}
            répond…
          </p>
        </div>
      )}

      {answeredWrong && (
        <div className="bg-buzz/5 border border-buzz/20 rounded-2xl px-4 py-3 flex items-center gap-3">
          <XCircle size={16} className="text-buzz shrink-0" />
          <p className="text-buzz/80 text-sm font-medium">
            Vous avez déjà répondu faux pour cette question
          </p>
        </div>
      )}

      {/* Buzzer */}
      {!isSpectator && (
        <div className="py-3 flex flex-col items-center">
          <BuzzerButton
            onBuzz={handleBuzz}
            disabled={!buzzerOpen || isBuzzing || buzzLockRef.current}
            hasBuzzed={myQueuePosition !== null || buzzLockRef.current}
            queuePosition={myQueuePosition}
            teamBuzzed={false}
          />
        </div>
      )}

      {/* File d'attente */}
      <div
        className={`rounded-3xl border overflow-hidden ${
          game.buzzQueue.length > 0 ? 'border-accent bg-accent/5' : 'border-line bg-surface'
        }`}
      >
        <div
          className={`px-4 py-3 border-b flex items-center justify-between ${
            game.buzzQueue.length > 0 ? 'border-accent/25 bg-accent/10' : 'border-line'
          }`}
        >
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                game.buzzQueue.length > 0 ? 'bg-accent' : 'bg-surface-2'
              }`}
            >
              <Zap size={16} className={game.buzzQueue.length > 0 ? 'text-btn-fg' : 'text-txt-40'} />
            </div>
            <p className="text-txt font-bold text-base">File d'attente</p>
            <div
              className={`px-2.5 py-0.5 rounded-full ml-2 ${
                game.buzzQueue.length > 0 ? 'bg-accent' : 'bg-surface-2'
              }`}
            >
              <span
                className={`font-semibold text-sm ${
                  game.buzzQueue.length > 0 ? 'text-btn-fg' : 'text-txt'
                }`}
              >
                {game.buzzQueue.length}
              </span>
            </div>
          </div>
        </div>

        {game.buzzQueue.length > 0 ? (
          <div>
            {game.buzzQueue.map((item, index) => {
              const qPlayer = players.find((p) => p.id === item.playerId);
              const hasTurn = item.playerId === game.answeringPlayerId;
              return (
                <div
                  key={item.playerId}
                  className={`flex items-center px-4 py-3 border-b border-line last:border-b-0 ${
                    hasTurn ? 'bg-accent/10' : ''
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center mr-3 shrink-0 ${
                      hasTurn ? 'bg-accent' : 'bg-surface-2'
                    }`}
                  >
                    <span className={`font-bold text-sm ${hasTurn ? 'text-btn-fg' : 'text-txt'}`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="mr-2 shrink-0">
                    <Avatar avatarUrl={qPlayer?.avatarUrl} username={item.playerName} size={30} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-txt font-semibold truncate">
                      {item.playerName}
                      {item.playerId === myPlayerId ? ' (Vous)' : ''}
                    </p>
                    {hasTurn && (
                      <p className="text-accent text-xs flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        Choisit sa réponse
                      </p>
                    )}
                    {item.teamName && (
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: teamColorTint(
                            teams.find((t) => t.id === item.teamId)?.color,
                          ),
                          color: teamColor(teams.find((t) => t.id === item.teamId)?.color),
                        }}
                      >
                        <Users size={10} className="inline mr-1" />
                        {item.teamName}
                      </span>
                    )}
                  </div>
                  {/* Écart avec la tête de file, désormais calculé sur des
                      timestamps bornés et un ordre figé. */}
                  <span className="text-txt-60 text-sm tabular-nums">
                    {index === 0
                      ? '—'
                      : item.deltaMs < 1000
                        ? `+${item.deltaMs}ms`
                        : `+${(item.deltaMs / 1000).toFixed(1)}s`}
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
            <p className="text-txt-60 text-center text-sm">En attente de buzz…</p>
          </div>
        )}
      </div>

      {/* Panneau de réponse en ligne (fallback si le mode focus est indisponible) */}
      {amIAnswering && myAnswerChoices && (
        <AnswerChoicesPanel
          choices={myAnswerChoices}
          answerTimeSeconds={answerTimeSeconds}
          deadlineEpochMs={game.phaseEndsAtEpochMs}
          onSubmit={handleSubmitAnswer}
          isSubmitting={isSubmittingAnswer}
          result={answerResult}
        />
      )}

      {showBuzzFlash && (
        <div className="fixed inset-0 z-30 bg-accent mix-blend-overlay animate-flash pointer-events-none" />
      )}

      {/* Révélation — portée par la phase, plus par un setTimeout local */}
      {answerReveal && game.phase === 'REVEAL' && (
        <AnswerRevealOverlay
          correctAnswer={answerReveal.correctAnswer}
          winnerId={answerReveal.winnerId}
          winnerName={answerReveal.winnerName}
          allAnswersWrong={answerReveal.allAnswersWrong}
          isManager={isManager}
          onDismiss={() => {
            /* la disparition est décidée par le serveur (changement de phase) */
          }}
          onAdvance={onAdvanceAfterAllWrong}
          autoDismissMs={0}
        />
      )}
    </div>
  );
}
