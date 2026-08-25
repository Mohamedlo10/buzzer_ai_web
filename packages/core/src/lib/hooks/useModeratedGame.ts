import { useCallback, useEffect, useState, useRef } from 'react';
import { useBuzzStore } from '~/stores/useBuzzStore';
import * as gameApi from '~/lib/api/game';
import { getManualQuestions, getSession } from '~/lib/api/sessions';
import { serverNow, syncClock } from '~/lib/game/clock';
import { isAnswering, isBuzzerOpen, queuePositionOf } from '~/lib/game/packet';
import { useDeadlineSeconds } from '~/lib/game/useDeadline';
import { useWordReveal } from '~/lib/game/useWordReveal';
import type { ManualQuestion, PlayerResponse, TeamResponse } from '~/types/api';
import { notifyApiError } from '~/lib/ui/notify';

export interface UseModeratedGameOptions {
  sessionId: string;
  isManager: boolean;
  isSpectator: boolean;
  currentPlayer: PlayerResponse | undefined;
  players: PlayerResponse[];
  teams: TeamResponse[];
  isTeamMode: boolean;
}

export function useModeratedGame({
  sessionId,
  isManager,
  isSpectator,
  currentPlayer,
  players,
  teams,
  isTeamMode,
}: UseModeratedGameOptions) {
  const {
    session,
    currentQuestion,
    questionIndex,
    isPaused,
    hasBuzzed,
    answeredWrongThisQuestion,
    setHasBuzzed,
    setAnsweredWrongThisQuestion,
    game,
  } = useBuzzStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [pendingWrong, setPendingWrong] = useState<{ applyPenalty: boolean } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isResettingBuzzer, setIsResettingBuzzer] = useState(false);
  const [manualQuestions, setManualQuestions] = useState<ManualQuestion[]>([]);
  const [showAnswer, setShowAnswer] = useState(true);

  // Verrou local anti-double-appui
  const buzzLockRef = useRef(false);

  // Sync clock for accurate buzz timestamps
  useEffect(() => {
    void syncClock();
  }, []);

  const myPlayerId = currentPlayer?.id;
  const amIAnswering = isAnswering(game, myPlayerId);
  const myQueuePosition = queuePositionOf(game, myPlayerId);
  const buzzerOpen = isBuzzerOpen(game) && !isPaused;

  const answeringPlayer = players.find((p) => p.id === game.answeringPlayerId);

  // Countdown when someone is answering
  const countdownSeconds = useDeadlineSeconds(
    game.phase === 'AWAITING_VALIDATION' ? game.phaseEndsAtEpochMs : null
  );

  const displayedWordCount = useWordReveal(
    game.revealedWordCount,
    game.totalWordCount,
    game.wordRevealStartedAtEpochMs,
    game.wordRevealIntervalMs
  );

  // Reset buzz lock and answering state when question changes
  const wasAnsweringRef = useRef(false);
  useEffect(() => {
    buzzLockRef.current = false;
    wasAnsweringRef.current = false;
  }, [game.packetQuestionId, currentQuestion?.id, questionIndex]);

  // Tracker si ce joueur a répondu faux sur la question courante
  useEffect(() => {
    if (myPlayerId && game.answeringPlayerId === myPlayerId && game.phase === 'AWAITING_VALIDATION') {
      wasAnsweringRef.current = true;
    } else if (wasAnsweringRef.current && game.answeringPlayerId !== myPlayerId) {
      // Ce joueur répondait et n'a plus la main sur la même question -> il a été rejeté (faux)
      setAnsweredWrongThisQuestion(true);
      setHasBuzzed(true);
      buzzLockRef.current = true;
      wasAnsweringRef.current = false;
    }
  }, [game.answeringPlayerId, game.phase, myPlayerId, setAnsweredWrongThisQuestion, setHasBuzzed]);

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
            }))
          );
        })
        .catch(() => {});
    }
  }, [sessionId, isManager, session?.questionMode]);

  const handleBuzz = useCallback(async () => {
    if (!buzzerOpen || buzzLockRef.current || isSpectator) return;
    if (myPlayerId && game.buzzQueue.some((item) => item.playerId === myPlayerId)) return;

    buzzLockRef.current = true;
    setIsSubmitting(true);

    try {
      await gameApi.buzz(sessionId, serverNow(), true);
      setHasBuzzed(true);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        // Le serveur signale que le joueur (ou son équipe) a déjà buzzé sur cette question
        setHasBuzzed(true);
        buzzLockRef.current = true;
      } else {
        buzzLockRef.current = false;
        notifyApiError(err, 'Impossible de buzzer');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, buzzerOpen, isSpectator, myPlayerId, game.buzzQueue, setHasBuzzed]);

  const handleValidate = useCallback(
    async (isCorrect: boolean, applyPenalty: boolean = true) => {
      if (!sessionId || !game.answeringPlayerId || isValidating) return;

      setIsValidating(true);
      try {
        await gameApi.validateAnswer(sessionId, {
          playerId: game.answeringPlayerId,
          isCorrect,
          applyPenalty,
        });
      } catch (err: any) {
        if (err?.response?.status !== 409) {
          notifyApiError(err, 'Action impossible');
        }
      } finally {
        setIsValidating(false);
      }
    },
    [sessionId, game.answeringPlayerId, isValidating]
  );

  const handleSkip = useCallback(async () => {
    if (!sessionId || isSkipping) return;

    setIsSkipping(true);
    try {
      await gameApi.skipQuestion(sessionId);
    } catch (err: any) {
      notifyApiError(err, 'Action impossible');
    } finally {
      setIsSkipping(false);
    }
  }, [sessionId, isSkipping]);

  const handleAdvanceAfterAllWrong = useCallback(async () => {
    if (!sessionId) return;
    try {
      await gameApi.advanceAfterAllWrong(sessionId);
    } catch (err: any) {
      notifyApiError(err, 'Action impossible');
    }
  }, [sessionId]);

  const handleResetBuzzer = useCallback(async () => {
    if (!sessionId || isResettingBuzzer) return;

    setIsResettingBuzzer(true);
    try {
      await gameApi.resetBuzzer(sessionId);
    } catch (err: any) {
      notifyApiError(err, 'Action impossible');
    } finally {
      setIsResettingBuzzer(false);
    }
  }, [sessionId, isResettingBuzzer]);

  const actualHasBuzzed = hasBuzzed || myQueuePosition !== null;
  const amIFirstInQueue = game.buzzQueue.length > 0 && game.buzzQueue[0].playerId === myPlayerId;
  const teamBuzzed = isTeamMode && actualHasBuzzed && myQueuePosition === null && !answeredWrongThisQuestion;
  const firstBuzzer = game.buzzQueue[0];

  return {
    session,
    currentQuestion,
    questionIndex,
    isPaused,
    hasBuzzed,
    answeredWrongThisQuestion,
    game,
    isSubmitting,
    isSkipping,
    showSkipConfirm,
    setShowSkipConfirm,
    pendingWrong,
    setPendingWrong,
    isValidating,
    isResettingBuzzer,
    manualQuestions,
    showAnswer,
    setShowAnswer,
    myPlayerId,
    amIAnswering,
    myQueuePosition,
    buzzerOpen,
    answeringPlayer,
    countdownSeconds,
    displayedWordCount,
    actualHasBuzzed,
    amIFirstInQueue,
    teamBuzzed,
    firstBuzzer,
    handleBuzz,
    handleValidate,
    handleSkip,
    handleAdvanceAfterAllWrong,
    handleResetBuzzer,
  };
}
