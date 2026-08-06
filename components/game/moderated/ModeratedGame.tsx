'use client';

import { useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import {
  Crown,
  Eye,
  EyeOff,
  Users,
  Hand,
  Zap,
  CheckCircle,
  XCircle,
  Mic,
  Target,
  PlayCircle,
  PauseCircle,
  SkipForward,
} from 'lucide-react';

import { Avatar } from '~/components/ui/Avatar';
import { ConfirmModal } from '~/components/ui/ConfirmModal';
import { BuzzerButton } from '~/components/game/BuzzerButton';
import { AnswerRevealOverlay } from '~/components/game/AnswerRevealOverlay';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { getManualQuestions, getSession } from '~/lib/api/sessions';
import * as gameApi from '~/lib/api/game';
import { wsManager } from '~/lib/websocket/WebSocketManager';
import type { ManualQuestion, PlayerResponse, TeamResponse } from '~/types/api';
import { teamColor } from '~/lib/game/teamColors';

// Expandable Card Component
interface ExpandableCardProps {
  icon: ReactNode;
  label: string;
  content: string;
  subContent?: string;
  bgColor: string;
  borderColor: string;
  isBold?: boolean;
}

function ExpandableCard({
  icon,
  label,
  content,
  subContent,
  bgColor,
  borderColor,
  isBold = false,
}: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={`flex-1 ${bgColor} rounded-2xl p-4 border ${borderColor} text-left transition-opacity hover:opacity-90`}
    >
      <div className="flex flex-row items-center mb-2">
        <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center mr-2">
          {icon}
        </div>
        <span className="text-accent text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>

      <p
        className={`text-txt text-base leading-relaxed ${isBold ? 'font-bold' : ''} ${!expanded ? 'line-clamp-6' : ''}`}
      >
        {content}
      </p>

      {subContent && (
        <p className={`text-txt-60 text-xs mt-2 leading-relaxed ${!expanded ? 'line-clamp-4' : ''}`}>
          {subContent}
        </p>
      )}

      {!expanded && (subContent || content.length > 200) && (
        <div className="flex flex-row items-center mt-2">
          <span className="text-accent text-xs font-medium">Voir plus ↓</span>
        </div>
      )}

      {expanded && (
        <div className="flex flex-row items-center mt-2">
          <span className="text-txt-40 text-xs">Cliquez pour réduire ↑</span>
        </div>
      )}
    </button>
  );
}

interface ModeratedGameProps {
  sessionId: string;
  isManager: boolean;
  isSpectator: boolean;
  currentPlayer: PlayerResponse | undefined;
  players: PlayerResponse[];
  teams: TeamResponse[];
  isTeamMode: boolean;
  handlePause: () => Promise<void>;
  handleResume: () => Promise<void>;
  isPauseToggling: boolean;
}

export function ModeratedGame({
  sessionId,
  isManager,
  isSpectator,
  currentPlayer,
  players,
  teams,
  isTeamMode,
  handlePause,
  handleResume,
  isPauseToggling,
}: ModeratedGameProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [pendingWrong, setPendingWrong] = useState<{ applyPenalty: boolean } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isResettingBuzzer, setIsResettingBuzzer] = useState(false);
  const [showBuzzOverlay, setShowBuzzOverlay] = useState(false);
  const buzzLockRef = useRef(false);
  const buzzOverlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [manualQuestions, setManualQuestions] = useState<ManualQuestion[]>([]);
  const [showAnswer, setShowAnswer] = useState(true);

  // Buzz countdown state
  const [countdown, setCountdown] = useState<{ playerId: string; seconds: number } | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    session,
    currentQuestion,
    questionIndex,
    buzzQueue,
    isPaused,
    hasBuzzed,
    answeredWrongThisQuestion,
    setHasBuzzed,
    answerReveal,
    setQuestionFullyDisplayed,
  } = useBuzzStore();

  const startCountdown = useCallback((playerId: string, durationSeconds: number) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdown({ playerId, seconds: durationSeconds });
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (!prev || prev.seconds <= 1) {
          clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = null;
          return prev ? { ...prev, seconds: 0 } : null;
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
  }, []);

  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (buzzOverlayTimeoutRef.current) clearTimeout(buzzOverlayTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const isManagerRef = useRef(isManager);
  isManagerRef.current = isManager;
  const buzzQueueRef = useRef(buzzQueue);
  buzzQueueRef.current = buzzQueue;

  useEffect(() => {
    const unsubscribe = wsManager.subscribe((event: any) => {
      if (event.type === '_reconnected') {
        const state = useBuzzStore.getState();
        if (state.buzzQueue.length > 0) {
          const duration = state.session?.buzzCountdownSeconds ?? 10;
          startCountdown(state.buzzQueue[0].playerId, duration);
        }
        return;
      }
      switch (event.type) {
        case 'buzz_countdown':
          startCountdown(event.playerId, event.durationSeconds);
          break;
        case 'buzzer_pressed':
          if (isManagerRef.current && buzzQueueRef.current.length === 0) {
            setShowBuzzOverlay(true);
            if (buzzOverlayTimeoutRef.current) clearTimeout(buzzOverlayTimeoutRef.current);
            buzzOverlayTimeoutRef.current = setTimeout(() => setShowBuzzOverlay(false), 1500);
          }
          break;
        case 'buzzer_reset':
          stopCountdown();
          buzzLockRef.current = false;
          setShowBuzzOverlay(false);
          if (buzzOverlayTimeoutRef.current) {
            clearTimeout(buzzOverlayTimeoutRef.current);
            buzzOverlayTimeoutRef.current = null;
          }
          break;
        case 'answer_validated':
          if (event.isCorrect) stopCountdown();
          break;
      }
    });
    return () => unsubscribe();
  }, [startCountdown, stopCountdown]);

  // Reset buzz lock and countdown when question changes
  useEffect(() => {
    buzzLockRef.current = false;
    stopCountdown();
  }, [currentQuestion?.id, stopCountdown]);

  useEffect(() => {
    if (currentQuestion) {
      setQuestionFullyDisplayed(currentQuestion.questionType === 'IDENTIFICATION');
    }
  }, [currentQuestion?.id, currentQuestion, setQuestionFullyDisplayed]);

  // Load questions with answers for manager
  useEffect(() => {
    if (!sessionId || !isManager) return;
    if (session?.questionMode === 'MANUAL') {
      getManualQuestions(sessionId).then(setManualQuestions).catch(() => {});
    } else {
      getSession(sessionId)
        .then((detail) => {
          const sorted = [...detail.questions].sort((a, b) => a.orderIndex - b.orderIndex);
          setManualQuestions(
            sorted.map((q) => ({
              text: q.text,
              answer: q.answer ?? '',
              explanation: q.explanation ?? '',
            })),
          );
        })
        .catch(() => {});
    }
  }, [sessionId, isManager, session?.questionMode]);

  const handleBuzz = useCallback(async () => {
    if (!sessionId || buzzLockRef.current || isSpectator) return;

    const isInQueue = buzzQueue.some((item) => item.playerId === currentPlayer?.id);
    if (isInQueue) return;

    buzzLockRef.current = true;
    setIsSubmitting(true);

    try {
      const timestamp = Date.now();
      const fullyDisplayed = useBuzzStore.getState().questionFullyDisplayed;
      await gameApi.buzz(sessionId, timestamp, fullyDisplayed);
      setHasBuzzed(true);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setHasBuzzed(true);
      } else {
        buzzLockRef.current = false;
        window.alert(err?.message || 'Impossible de buzzer');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, buzzQueue, currentPlayer?.id, isSpectator, setHasBuzzed]);

  const handleValidate = useCallback(
    async (isCorrect: boolean, applyPenalty: boolean = true) => {
      if (!sessionId || !buzzQueue[0] || isValidating) return;

      setIsValidating(true);
      try {
        await gameApi.validateAnswer(sessionId, {
          playerId: buzzQueue[0].playerId,
          isCorrect,
          applyPenalty,
        });
      } catch (err: any) {
        window.alert(err?.message || 'Action impossible');
      } finally {
        setIsValidating(false);
      }
    },
    [sessionId, buzzQueue, isValidating],
  );

  const handleSkip = useCallback(async () => {
    if (!sessionId || isSkipping) return;

    setIsSkipping(true);
    try {
      await gameApi.skipQuestion(sessionId);
    } catch (err: any) {
      window.alert(err?.message || 'Action impossible');
    } finally {
      setIsSkipping(false);
    }
  }, [sessionId, isSkipping]);

  const handleAdvanceAfterAllWrong = useCallback(async () => {
    if (!sessionId) return;
    try {
      await gameApi.advanceAfterAllWrong(sessionId);
      useBuzzStore.setState({ answerReveal: null });
    } catch (err: any) {
      window.alert(err?.message || 'Action impossible');
    }
  }, [sessionId]);

  const handleResetBuzzer = useCallback(async () => {
    if (!sessionId || isResettingBuzzer) return;

    setIsResettingBuzzer(true);
    try {
      await gameApi.resetBuzzer(sessionId);
    } catch (err: any) {
      window.alert(err?.message || 'Action impossible');
    } finally {
      setIsResettingBuzzer(false);
    }
  }, [sessionId, isResettingBuzzer]);

  if (!currentQuestion) return null;

  const hasBuzzes = buzzQueue.length > 0;
  const firstBuzzer = buzzQueue[0];
  const queuePosition = buzzQueue.findIndex((item) => item.playerId === currentPlayer?.id);
  const actualHasBuzzed = hasBuzzed || queuePosition >= 0;
  const amIFirstInQueue = buzzQueue.length > 0 && buzzQueue[0].playerId === currentPlayer?.id;

  const teamBuzzed =
    isTeamMode && actualHasBuzzed && queuePosition < 0 && !answeredWrongThisQuestion;

  return (
    <>
      {/* BUZZ ALERT Overlay — manager only */}
      {isManager && showBuzzOverlay && hasBuzzes && firstBuzzer && (
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
                {firstBuzzer.timeDiffMs < 1000
                  ? `${firstBuzzer.timeDiffMs}ms`
                  : `${(firstBuzzer.timeDiffMs / 1000).toFixed(1)}s`}
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
                          item.playerId === currentPlayer?.id ? 'text-energy' : 'text-txt'
                        }`}
                      >
                        {item.playerName}
                        {item.playerId === currentPlayer?.id ? ' (Vous)' : ''}
                      </span>
                      {isTeamMode &&
                        item.teamName &&
                        (() => {
                          const itemTeamColor = teamColor(
                            teams.find((t) => t.id === item.teamId)?.color,
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
                      {item.timeDiffMs < 1000
                        ? `${item.timeDiffMs}ms`
                        : `${(item.timeDiffMs / 1000).toFixed(1)}s`}
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
      )}

      {/* Question Display — MANAGER ONLY */}
      {isManager && (
        <div className="px-4 pt-4">
          <div className="flex flex-row gap-3 mb-4">
            <ExpandableCard
              key={`q-${currentQuestion.id}`}
              icon={<Mic size={14} color="var(--primary)" />}
              label="QUESTION"
              content={currentQuestion.text}
              bgColor="bg-surface"
              borderColor="border-line"
            />

            <div className="flex-1 flex flex-col">
              <button
                onClick={() => setShowAnswer((v) => !v)}
                className="flex flex-row items-center gap-1 self-end mb-1 px-2 py-0.5 rounded-full bg-surface-2 hover:opacity-80 transition-opacity"
              >
                {showAnswer ? (
                  <EyeOff size={11} color="#FFFFFF80" />
                ) : (
                  <Eye size={11} color="#FFFFFF80" />
                )}
                <span className="text-txt-60 text-xs">{showAnswer ? 'Masquer' : 'Afficher'}</span>
              </button>
              {showAnswer ? (
                <ExpandableCard
                  key={`a-${currentQuestion.id}`}
                  icon={<Target size={14} color="var(--primary)" />}
                  label="RÉPONSE"
                  content={currentQuestion.answer || manualQuestions[questionIndex]?.answer || '...'}
                  subContent={
                    currentQuestion.explanation ||
                    manualQuestions[questionIndex]?.explanation ||
                    undefined
                  }
                  bgColor="bg-accent/5"
                  borderColor="border-accent/25"
                  isBold
                />
              ) : (
                <div className="flex-1 bg-surface-2/40 rounded-2xl border border-dashed border-line flex items-center justify-center min-h-[80px]">
                  <EyeOff size={20} color="#FFFFFF30" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Player View */}
      {!isManager && !isSpectator && (
        <div className="px-4 pt-4">
          <div className="flex flex-col gap-3">
            {amIFirstInQueue && !answeredWrongThisQuestion ? (
              <div className="bg-surface rounded-2xl border border-accent p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
                <div>
                  <p className="text-txt font-bold text-sm">Tu as buzzé ! Réponds à voix haute</p>
                  <p className="text-txt-60 text-xs">En attente de la validation du modérateur…</p>
                </div>
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
      )}

      {/* Spectator View */}
      {isSpectator && (
        <div className="px-4 pt-4">
          <div className="bg-surface rounded-3xl p-8 border border-line flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-energy/15 flex items-center justify-center mb-4">
              <Eye size={32} color="var(--gold)" />
            </div>
            <p className="text-energy text-xl font-semibold text-center mb-2">Mode spectateur</p>
            <p className="text-txt-60 text-center">Vous observez la partie</p>
          </div>
        </div>
      )}

      {/* Buzzer Button */}
      {!isSpectator && !isManager && (
        <div className="px-4 py-3 flex flex-col items-center">
          <BuzzerButton
            onBuzz={handleBuzz}
            disabled={isSubmitting || isPaused || actualHasBuzzed || answeredWrongThisQuestion}
            hasBuzzed={actualHasBuzzed}
            queuePosition={queuePosition >= 0 ? queuePosition + 1 : null}
            teamBuzzed={teamBuzzed}
          />
          {teamBuzzed &&
            firstBuzzer &&
            (() => {
              const itemTeamColor = teamColor(
                teams.find((t) => t.id === firstBuzzer.teamId)?.color,
              );
              return (
                <div
                  className="mt-2 w-full max-w-sm rounded-2xl p-4 border flex items-center gap-3 animate-[rise_0.25s_both]"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${itemTeamColor} 10%, var(--surface))`,
                    borderColor: itemTeamColor,
                  }}
                >
                  <div
                    className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${itemTeamColor} 20%, transparent)`,
                    }}
                  >
                    <Users size={14} style={{ color: itemTeamColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-txt font-bold text-[13.5px] leading-tight">
                      Votre équipe a déjà buzzé
                    </p>
                    <p className="text-txt-60 text-xs mt-0.5 truncate">
                      <strong>{firstBuzzer.playerName}</strong> répond pour{' '}
                      {firstBuzzer.teamName || 'votre équipe'}
                    </p>
                  </div>
                </div>
              );
            })()}
        </div>
      )}

      {/* Buzz Queue */}
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
                            teams.find((t) => t.id === buzzQueue[0].teamId)?.color,
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
                  {buzzQueue[0].timeDiffMs >= 0 && (
                    <div className="flex flex-col items-end">
                      <p className="text-txt font-bold text-base">
                        {buzzQueue[0].timeDiffMs < 1000
                          ? `${buzzQueue[0].timeDiffMs}ms`
                          : `${(buzzQueue[0].timeDiffMs / 1000).toFixed(1)}s`}
                      </p>
                      <p className="text-txt-40 text-xs">réaction</p>
                    </div>
                  )}
                </div>

                {/* Buzz countdown */}
                {countdown && countdown.playerId === buzzQueue[0].playerId && (
                  <div className="mt-3 flex flex-row items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-linear"
                        style={{
                          width: `${(countdown.seconds / 10) * 100}%`,
                          backgroundColor:
                            countdown.seconds <= 3
                              ? 'var(--bad)'
                              : countdown.seconds <= 6
                                ? 'var(--gold)'
                                : 'var(--primary)',
                        }}
                      />
                    </div>
                    <span
                      className="text-sm font-bold tabular-nums w-6 text-right"
                      style={{
                        color:
                          countdown.seconds <= 3
                            ? 'var(--bad)'
                            : countdown.seconds <= 6
                              ? 'var(--gold)'
                              : 'var(--primary)',
                      }}
                    >
                      {countdown.seconds}
                    </span>
                  </div>
                )}

                {/* Quick Validation — Manager only */}
                {isManager && (
                  <div className="flex flex-row gap-2 mt-3">
                    <button
                      onClick={() => handleValidate(true)}
                      disabled={isValidating}
                      className="flex-1 py-3 rounded-xl bg-accent flex items-center justify-center hover:bg-accent-d transition-colors disabled:opacity-60"
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
                      onClick={() => setPendingWrong({ applyPenalty: false })}
                      disabled={isValidating}
                      className="flex-1 py-3 rounded-xl bg-buzz flex items-center justify-center hover:bg-accent-d transition-colors disabled:opacity-60"
                    >
                      <span className="text-txt-60 text-xs">Sans pénalité</span>
                    </button>
                    <button
                      onClick={() => setPendingWrong({ applyPenalty: true })}
                      disabled={isValidating}
                      className="px-3 py-3 rounded-xl bg-surface-2 flex items-center justify-center hover:bg-surface-2 transition-colors disabled:opacity-60"
                    >
                      <div className="flex flex-row items-center">
                        <XCircle size={18} color="#FFFFFF" />
                        <span className="text-txt font-bold ml-1.5">Faux avec - </span>
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
                          item.playerId === currentPlayer?.id ? 'text-accent' : 'text-txt-60'
                        }`}
                      >
                        {item.playerName}
                        {item.playerId === currentPlayer?.id && ' (Vous)'}
                      </span>
                      {isTeamMode &&
                        item.teamName &&
                        (() => {
                          const itemTeamColor = teamColor(
                            teams.find((t) => t.id === item.teamId)?.color,
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
                      {item.timeDiffMs < 1000
                        ? `${item.timeDiffMs}ms`
                        : `${(item.timeDiffMs / 1000).toFixed(1)}s`}
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

      {/* Manager Secondary Controls */}
      {isManager && (
        <div className="px-4 pt-3">
          <div className="flex flex-row gap-2">
            <button
              onClick={() => setShowSkipConfirm(true)}
              disabled={isSkipping}
              className="flex-1 py-3 rounded-xl bg-surface-2 flex items-center justify-center hover:bg-surface-2 transition-colors disabled:opacity-60"
            >
              {isSkipping ? (
                <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-txt-60 font-medium text-sm">Passer</span>
              )}
            </button>
            <button
              onClick={handleResetBuzzer}
              disabled={buzzQueue.length === 0 || isResettingBuzzer}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-colors ${
                buzzQueue.length > 0 && !isResettingBuzzer
                  ? 'bg-buzz/20 hover:bg-buzz/30'
                  : 'bg-surface-2 opacity-50 cursor-not-allowed'
              }`}
            >
              {isResettingBuzzer ? (
                <div className="w-4 h-4 border-2 border-buzz border-t-transparent rounded-full animate-spin" />
              ) : (
                <span
                  className={`font-medium text-sm ${
                    buzzQueue.length > 0 ? 'text-buzz' : 'text-txt-40'
                  }`}
                >
                  Reset
                </span>
              )}
            </button>
            <button
              onClick={isPaused ? handleResume : handlePause}
              disabled={isPauseToggling}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-colors disabled:opacity-60 ${
                isPaused
                  ? 'bg-accent hover:bg-accent-d'
                  : 'bg-energy/20 border border-energy/30 hover:bg-energy/30'
              }`}
            >
              <div className="flex flex-row items-center justify-center">
                {isPauseToggling ? (
                  <div
                    className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                      isPaused ? 'border-btn-fg' : 'border-energy'
                    }`}
                  />
                ) : isPaused ? (
                  <>
                    <PlayCircle size={18} className="text-btn-fg mr-1.5" />
                    <span className="font-bold text-sm text-btn-fg">Reprendre</span>
                  </>
                ) : (
                  <>
                    <PauseCircle size={18} color="var(--gold)" className="mr-1.5" />
                    <span className="font-bold text-sm text-energy">Pause</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Révélation */}
      {answerReveal && (
        <AnswerRevealOverlay
          correctAnswer={answerReveal.correctAnswer}
          winnerId={answerReveal.winnerId}
          winnerName={answerReveal.winnerName}
          allAnswersWrong={answerReveal.allAnswersWrong}
          isManager={isManager}
          onDismiss={() => useBuzzStore.setState({ answerReveal: null })}
          onAdvance={handleAdvanceAfterAllWrong}
        />
      )}

      <ConfirmModal
        open={pendingWrong !== null}
        title={pendingWrong?.applyPenalty ? 'Faux avec pénalité ?' : 'Faux sans pénalité ?'}
        message={
          pendingWrong?.applyPenalty
            ? `${buzzQueue[0]?.playerName ?? 'Le joueur'} sera pénalisé et retiré de la file d'attente.`
            : `${buzzQueue[0]?.playerName ?? 'Le joueur'} sera retiré de la file sans perdre de points.`
        }
        confirmLabel={pendingWrong?.applyPenalty ? 'Faux' : 'Sans pénalité'}
        cancelLabel="Annuler"
        confirmColor="var(--bad)"
        icon={<XCircle size={24} color="var(--bad)" />}
        onConfirm={() => {
          const p = pendingWrong;
          setPendingWrong(null);
          if (p) handleValidate(false, p.applyPenalty);
        }}
        onCancel={() => setPendingWrong(null)}
      />
      <ConfirmModal
        open={showSkipConfirm}
        title="Passer la question ?"
        message="Cette question sera ignorée et vous passerez à la suivante. Cette action est irréversible."
        confirmLabel="Passer"
        cancelLabel="Annuler"
        confirmColor="var(--gold)"
        icon={<SkipForward size={24} color="var(--gold)" />}
        onConfirm={() => {
          setShowSkipConfirm(false);
          handleSkip();
        }}
        onCancel={() => setShowSkipConfirm(false)}
      />
    </>
  );
}
