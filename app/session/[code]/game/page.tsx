'use client';

import { useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Crown,
  Eye,
  EyeOff,
  Users,
  Hand,
  Trophy,
  Zap,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Mic,
  Target,
  PlayCircle,
  PauseCircle,
  Layers,
  SkipForward,
} from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { Avatar } from '~/components/ui/Avatar';
import { ConfirmModal } from '~/components/ui/ConfirmModal';
import { BuzzerButton } from '~/components/game/BuzzerButton';
import { ProgressiveQuestionDisplay } from '~/components/game/ProgressiveQuestionDisplay';
import { AnswerChoicesPanel } from '~/components/game/AnswerChoicesPanel';
import { GlobalTimerBar } from '~/components/game/GlobalTimerBar';
import { AnswerRevealOverlay } from '~/components/game/AnswerRevealOverlay';
import { IdentificationQuestionDisplay } from '~/components/game/IdentificationQuestionDisplay';
import { LiveLeaderboard } from '~/components/game/LiveLeaderboard';
import { TeamLeaderboard } from '~/components/game/TeamLeaderboard';
import { FocusModePanel } from '~/components/game/FocusModePanel';
import { ScoreCorrectionSheet } from '~/components/game/ScoreCorrectionSheet';
import { PlayerProfileModal } from '~/components/ui/PlayerProfileModal';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { useAuthStore } from '~/stores/useAuthStore';
import { useGameSocket } from '~/lib/websocket/useGameSocket';
import { getManualQuestions, getSession } from '~/lib/api/sessions';
import * as gameApi from '~/lib/api/game';
import { appStorage } from '~/lib/utils/storage';
import type { BuzzQueueItem, ManualQuestion } from '~/types/api';

// Adaptive polling constants
const POLL_WS_CONNECTED_MS = 3000;
const POLL_WS_DISCONNECTED_MS = 2000;

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
        <div className="w-7 h-7 rounded-lg bg-[#00D39720] flex items-center justify-center mr-2">
          {icon}
        </div>
        <span className="text-[#00D397] text-xs font-semibold uppercase tracking-wide">{label}</span>
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
          <span className="text-[#00D397] text-xs font-medium">Voir plus ↓</span>
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

export default function GamePage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = params.code;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [answerSubmitResult, setAnswerSubmitResult] = useState<'correct' | 'wrong' | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [pendingWrong, setPendingWrong] = useState<{ applyPenalty: boolean } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isResettingBuzzer, setIsResettingBuzzer] = useState(false);
  const [isPauseToggling, setIsPauseToggling] = useState(false);
  const [showBuzzOverlay, setShowBuzzOverlay] = useState(false);
  const [showCategoryOverlay, setShowCategoryOverlay] = useState(false);
  const buzzLockRef = useRef(false);
  const buzzOverlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const categoryOverlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevCategoryRef = useRef<string | null>(null);
  const [manualQuestions, setManualQuestions] = useState<ManualQuestion[]>([]);
  const [showAnswer, setShowAnswer] = useState(true);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [showBuzzFlash, setShowBuzzFlash] = useState(false);
  const [sessionFetched, setSessionFetched] = useState(false);

  // Buzz countdown state
  const [countdown, setCountdown] = useState<{ playerId: string; seconds: number } | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const user = useAuthStore((state) => state.user);
  const {
    session,
    players,
    teams,
    currentQuestion,
    questionIndex,
    buzzQueue,
    isPaused,
    hasBuzzed,
    answeredWrongThisQuestion,
    setHasBuzzed,
    setBuzzQueue,
    fetchSession,
    leaveSession,
    pauseSession,
    resumeSession,
    displayWordIndex,
    displayRunning,
    myAnswerChoices,
    answerTimeSeconds,
    globalTimerRemaining,
    globalTimerTotal,
    globalTimerPaused,
    answerReveal,
    setQuestionFullyDisplayed,
    setDisplayRunning,
    clearAnswerChoices,
  } = useBuzzStore();


  const isManager = session?.managerId === user?.id;
  const isTeamMode = session?.isTeamMode ?? false;
  const currentPlayer = players.find((p) => p.userId === user?.id);
  const isSpectator = currentPlayer?.isSpectator ?? false;
  const hasBuzzes = buzzQueue.length > 0;

  const sessionMode = session?.sessionMode ?? 'WITH_MODERATOR';
  const isWithoutModerator = sessionMode === 'WITHOUT_MODERATOR';
  const amIFirstInQueue = buzzQueue.length > 0 && buzzQueue[0].playerId === currentPlayer?.id;
  const someoneIsAnswering = isWithoutModerator && buzzQueue.length > 0;
  // game_choices arrive via queue privée → le serveur ne l'envoie qu'au premier de la file
  const answerPanelVisible = isWithoutModerator && !!myAnswerChoices;

  // Team leaderboard computed from players (since GameStateResponse doesn't include teams)
  const teamLeaderboard = isTeamMode
    ? [...new Map(
        players
          .filter((p) => p.teamId)
          .map((p) => {
            const team = teams.find((t) => t.id === p.teamId);
            return [p.teamId!, { teamId: p.teamId!, teamName: team?.name ?? 'Équipe', teamColor: team?.color ?? null }];
          })
      ).values()].map(({ teamId, teamName, teamColor }) => {
        const members = players.filter((p) => p.teamId === teamId);
        const totalScore = members.reduce((sum, p) => sum + p.score, 0);
        return { teamId, teamName, teamColor, members, totalScore };
      }).sort((a, b) => b.totalScore - a.totalScore)
    : [];

  const sessionIdRef = useRef(session?.id);
  sessionIdRef.current = session?.id;
  const codeRef = useRef(code);
  codeRef.current = code;

  // Countdown helpers
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
      if (categoryOverlayTimeoutRef.current) clearTimeout(categoryOverlayTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Category change overlay
  useEffect(() => {
    if (!currentQuestion?.category) return;
    const prev = prevCategoryRef.current;
    prevCategoryRef.current = currentQuestion.category;
    if (prev === null) return;
    if (prev === currentQuestion.category) return;

    setShowCategoryOverlay(true);
    if (categoryOverlayTimeoutRef.current) clearTimeout(categoryOverlayTimeoutRef.current);
    categoryOverlayTimeoutRef.current = setTimeout(() => setShowCategoryOverlay(false), 2500);
  }, [currentQuestion?.category]);

  // Re-sync game state from API
  const syncGameState = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    try {
      const gameState = await gameApi.getGameState(sid);

      const serverStatus = gameState.session.status as string | undefined;
      if (serverStatus === 'RESULTS') {
        useBuzzStore.getState().updateStatus('RESULTS');
        useBuzzStore.getState().setGameOver(true);
        router.replace(`/session/${codeRef.current}/results`);
        return;
      }

      // Propager sessionMode depuis le payload de getGameState
      const serverSessionMode = gameState.session.sessionMode as string | undefined;
      if (serverSessionMode) {
        useBuzzStore.setState((state) => ({
          session: state.session
            ? { ...state.session, sessionMode: serverSessionMode as any }
            : state.session,
        }));
      }

      // Restore word index from server state on reconnect
      const serverDisplayWordIndex = (gameState as any).displayWordIndex;
      if (serverDisplayWordIndex != null && serverDisplayWordIndex >= 0) {
        const q = gameState.currentQuestion;
        const totalWords = q?.text ? q.text.split(' ').length : 1;
        const currentLocalWordIndex = useBuzzStore.getState().displayWordIndex;
        if (
          serverDisplayWordIndex > currentLocalWordIndex ||
          (serverDisplayWordIndex === 0 &&
            !useBuzzStore.getState().displayRunning &&
            !useBuzzStore.getState().questionFullyDisplayed)
        ) {
          useBuzzStore.setState({
            displayWordIndex: serverDisplayWordIndex,
            displayRunning: serverDisplayWordIndex < totalWords - 1,
            ...(serverDisplayWordIndex >= totalWords - 1 ? { questionFullyDisplayed: true } : {}),
          });
        }
      }

      if (gameState.currentQuestion) {
        const currentId = useBuzzStore.getState().currentQuestion?.id;
        if (currentId !== gameState.currentQuestion.id) {
          useBuzzStore.getState().setCurrentQuestion(
            gameState.currentQuestion,
            (gameState.session.currentQuestionIndex as number) ?? 0,
            (gameState.session.totalQuestions as number) ?? 0,
          );
        }
      }

      setBuzzQueue(gameState.buzzQueue ?? []);

      // Restore pending answer choices only if none are showing yet (reconnect case only, not during polls)
      if (gameState.pendingChoices?.length && !useBuzzStore.getState().myAnswerChoices) {
        useBuzzStore.setState({
          myAnswerChoices: gameState.pendingChoices,
          myAnswerQuestionId: gameState.currentQuestion?.id ?? null,
          answerTimeSeconds: gameState.pendingAnswerTimeSeconds ?? 15,
        });
      }

      if (gameState.players?.length) {
        useBuzzStore.setState({ players: gameState.players });
      }

      if (gameState.teams?.length) {
        useBuzzStore.getState().setTeams(gameState.teams);
      }

      if (gameState.hasBuzzed) {
        useBuzzStore.getState().setHasBuzzed(true);
      } else if (user?.id) {
        const queue: BuzzQueueItem[] = gameState.buzzQueue ?? [];
        const myDirectBuzz = queue.some((b) => b.playerId === myPlayer?.id);
        const storeState = useBuzzStore.getState();
        const myPlayer = storeState.players.find((p) => p.userId === user.id);
        const myTeamBuzz =
          !myDirectBuzz &&
          storeState.session?.isTeamMode === true &&
          myPlayer?.teamId != null &&
          queue.some((b) => b.teamId === myPlayer.teamId);
        if (myDirectBuzz || myTeamBuzz) {
          useBuzzStore.getState().setHasBuzzed(true);
        }
      }
    } catch {
      // Silently fail
    }
  }, [user?.id, setBuzzQueue]); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket events
  const { isConnected } = useGameSocket(session?.id || null, {
    onEvent: (event) => {
      switch (event.type) {
        case 'buzz_countdown':
          startCountdown(event.playerId, event.durationSeconds);
          break;
        case 'buzzer_pressed':
          if (isManager && buzzQueue.length === 0) {
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
        case 'game_over':
          router.replace(`/session/${code}/results`);
          break;
        case 'question_display_resume':
          // Ne pas écraser displayWordIndex — reprendre depuis la position locale
          setDisplayRunning(true);
          break;
        case 'question_timer':
          useBuzzStore.setState({
            globalTimerRemaining: event.remainingSeconds,
            globalTimerPaused: event.paused,
            globalTimerTotal: useBuzzStore.getState().globalTimerTotal || event.remainingSeconds,
          });
          break;
      }
    },
    onReconnect: async () => {
      await syncGameState();
      // Infer countdown from buzzQueue on reconnect (backend won't re-send buzz-countdown)
      const state = useBuzzStore.getState();
      const isWithoutMod = state.session?.sessionMode === 'WITHOUT_MODERATOR';
      if (state.buzzQueue.length > 0 && !isWithoutMod) {
        const duration = state.session?.buzzCountdownSeconds ?? 10;
        startCountdown(state.buzzQueue[0].playerId, duration);
      }
    },
  });

  // Load session from storage
  useEffect(() => {
    setSessionFetched(false);
    if (!code) return;
    if (session && session.code === code) return;

    if (session && session.code !== code) {
      leaveSession();
    }

    const loadSession = async () => {
      try {
        const activeSession = await appStorage.getActiveSession();

        if (activeSession?.sessionId && activeSession?.code === code) {
          await fetchSession(activeSession.sessionId);
          setSessionFetched(true);
          return;
        }

        router.replace('/');
      } catch {
        router.replace('/');
      }
    };

    loadSession();
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial game state load
  useEffect(() => {
    if (!session?.id) return;

    const loadGameState = async () => {
      try {
        await fetchSession(session.id);
        setSessionFetched(true);
      } catch {
        // ignore
      }

      await syncGameState();
    };

    loadGameState();
  }, [session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load questions with answers for manager (only in WITH_MODERATOR mode)
  useEffect(() => {
    if (!session?.id || !isManager || isWithoutModerator) return;
    if (session.questionMode === 'MANUAL') {
      getManualQuestions(session.id).then(setManualQuestions).catch(() => { });
    } else {
      getSession(session.id).then((detail) => {
        const sorted = [...detail.questions].sort((a, b) => a.orderIndex - b.orderIndex);
        setManualQuestions(sorted.map((q) => ({
          text: q.text,
          answer: q.answer ?? '',
          explanation: q.explanation ?? '',
        })));
      }).catch(() => { });
    }
  }, [session?.id, isManager, isWithoutModerator, session?.questionMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Adaptive polling
  useEffect(() => {
    if (!session?.id) return;

    const ms = isConnected ? POLL_WS_CONNECTED_MS : POLL_WS_DISCONNECTED_MS;
    const interval = setInterval(() => {
      syncGameState();
    }, ms);
    return () => clearInterval(interval);
  }, [session?.id, syncGameState, isConnected]);

  // Redirect if not in playing state — wait for a fresh fetch before acting on status
  useEffect(() => {
    if (!sessionFetched) return;
    if (session?.status === 'LOBBY') {
      router.replace(`/session/${code}/lobby`);
    } else if (session?.status === 'GENERATING') {
      router.replace(`/session/${code}/loading`);
    } else if (session?.status === 'RESULTS') {
      router.replace(`/session/${code}/results`);
    }
  }, [session?.status, sessionFetched, code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset buzz lock and countdown when question changes
  useEffect(() => {
    buzzLockRef.current = false;
    stopCountdown();
  }, [currentQuestion?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Side-effects when question changes — display state is already reset atomically
  // inside setCurrentQuestion (store). Do NOT reset displayWordIndex/displayRunning here:
  // word_advance events from the server may have already advanced the index by the time
  // this effect fires (React commit phase), which would cause a visible restart.
  useEffect(() => {
    if (currentQuestion) {
      setQuestionFullyDisplayed(currentQuestion.questionType === 'IDENTIFICATION');
      setAnswerSubmitResult(null);
    }
  }, [currentQuestion?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fallback word-advance au rythme du serveur (600ms/mot) quand WS est déconnecté
  useEffect(() => {
    if (!isWithoutModerator || !displayRunning || isConnected) return;
    if (!currentQuestion) return;
    const totalWords = currentQuestion.text.split(' ').length;
    const interval = setInterval(() => {
      const current = useBuzzStore.getState().displayWordIndex;
      const next = current + 1;
      if (next >= totalWords - 1) {
        useBuzzStore.setState({ displayWordIndex: totalWords - 1, displayRunning: false, questionFullyDisplayed: true });
        clearInterval(interval);
      } else {
        useBuzzStore.setState({ displayWordIndex: next });
      }
    }, 600);
    return () => clearInterval(interval);
  }, [isWithoutModerator, displayRunning, isConnected, currentQuestion?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compteur local du timer global entre les événements WebSocket
  useEffect(() => {
    if (!isWithoutModerator || globalTimerPaused || globalTimerRemaining <= 0) return;
    const t = setTimeout(() => {
      useBuzzStore.setState((s: any) => ({
        globalTimerRemaining: Math.max(0, s.globalTimerRemaining - 1),
      }));
    }, 1000);
    return () => clearTimeout(t);
  }, [isWithoutModerator, globalTimerPaused, globalTimerRemaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBuzz = useCallback(async () => {
    if (!session?.id || buzzLockRef.current || isSpectator) return;

    const isInQueue = buzzQueue.some((item) => item.playerId === currentPlayer?.id);
    if (isInQueue) return;

    buzzLockRef.current = true;
    setIsSubmitting(true);

    try {
      const timestamp = Date.now();
      const fullyDisplayed = useBuzzStore.getState().questionFullyDisplayed;
      await gameApi.buzz(session.id, timestamp, fullyDisplayed);
      setHasBuzzed(true);
      if (isWithoutModerator) {
        setShowBuzzFlash(true);
        setTimeout(() => setShowBuzzFlash(false), 850);
      }
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
  }, [session?.id, buzzQueue, user?.id, isSpectator]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmitAnswer = useCallback(async (chosenAnswer: string) => {
    if (!session?.id || isSubmittingAnswer) return;
    const isTimeout = chosenAnswer === '__timeout__';
    setIsSubmittingAnswer(true);
    setAnswerSubmitResult(null);
    try {
      // On timeout, submit an empty answer so the backend marks it as wrong and advances the queue
      const result = await gameApi.submitAnswer(session.id, { chosenAnswer: isTimeout ? '' : chosenAnswer });
      if (!isTimeout) {
        setAnswerSubmitResult(result.isCorrect ? 'correct' : 'wrong');
      }
      clearAnswerChoices();
    } catch {
      clearAnswerChoices();
    } finally {
      setIsSubmittingAnswer(false);
    }
  }, [session?.id, isSubmittingAnswer, clearAnswerChoices]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleValidate = useCallback(async (isCorrect: boolean, applyPenalty: boolean = true) => {
    if (!session?.id || !buzzQueue[0] || isValidating) return;

    setIsValidating(true);
    try {
      await gameApi.validateAnswer(session.id, {
        playerId: buzzQueue[0].playerId,
        isCorrect,
        applyPenalty,
      });
    } catch (err: any) {
      window.alert(err?.message || 'Action impossible');
    } finally {
      setIsValidating(false);
    }
  }, [session?.id, buzzQueue, isValidating]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSkip = useCallback(async () => {
    if (!session?.id || isSkipping) return;

    setIsSkipping(true);
    try {
      await gameApi.skipQuestion(session.id);
    } catch (err: any) {
      window.alert(err?.message || 'Action impossible');
    } finally {
      setIsSkipping(false);
    }
  }, [session?.id, isSkipping]);

  const handleAdvanceAfterAllWrong = useCallback(async () => {
    if (!session?.id) return;
    try {
      await gameApi.advanceAfterAllWrong(session.id);
      useBuzzStore.setState({ answerReveal: null });
    } catch (err: any) {
      window.alert(err?.message || 'Action impossible');
    }
  }, [session?.id]);

  const handleResetBuzzer = useCallback(async () => {
    if (!session?.id || isResettingBuzzer) return;

    setIsResettingBuzzer(true);
    try {
      await gameApi.resetBuzzer(session.id);
    } catch (err: any) {
      window.alert(err?.message || 'Action impossible');
    } finally {
      setIsResettingBuzzer(false);
    }
  }, [session?.id, isResettingBuzzer]);

  const handleScoreCorrection = useCallback(async (playerId: string, points: number, reason: string) => {
    if (!session?.id) return;

    try {
      await gameApi.scoreCorrection(session.id, {
        playerId,
        amount: points,
        reason,
      });
    } catch (err: any) {
      window.alert(err?.message || 'Correction impossible');
    }
  }, [session?.id]);

  const handlePause = useCallback(async () => {
    if (!session?.id || isPauseToggling) return;
    setIsPauseToggling(true);
    try {
      await pauseSession(session.id);
    } catch (err: any) {
      window.alert(err?.message || 'Impossible de mettre en pause');
    } finally {
      setIsPauseToggling(false);
    }
  }, [session?.id, pauseSession, isPauseToggling]);

  const handleResume = useCallback(async () => {
    if (!session?.id || isPauseToggling) return;
    setIsPauseToggling(true);
    try {
      await resumeSession(session.id);
    } catch (err: any) {
      window.alert(err?.message || 'Impossible de reprendre');
    } finally {
      setIsPauseToggling(false);
    }
  }, [session?.id, resumeSession, isPauseToggling]);

  if (!session || !currentQuestion) {
    return (
      <SafeScreen>
        <div className="flex-1 flex flex-col justify-center items-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[#00D39720] flex items-center justify-center mb-4">
              <Zap size={40} color="#00D397" />
            </div>
            <p className="text-txt font-semibold">Chargement du jeu...</p>
          </div>
        </div>
      </SafeScreen>
    );
  }

  if (answerPanelVisible && myAnswerChoices && currentQuestion) {
    const words = currentQuestion.text.split(' ');
    const partialText = words.slice(0, displayWordIndex + 1).join(' ');

    return (
      <FocusModePanel
        questionText={partialText}
        category={currentQuestion.category}
        choices={myAnswerChoices}
        answerTimeSeconds={answerTimeSeconds}
        onSubmit={handleSubmitAnswer}
        isSubmitting={isSubmittingAnswer}
        result={answerSubmitResult}
      />
    );
  }

  // playerId dans buzzQueue = Player entity ID (pas User entity ID)
  const queuePosition = buzzQueue.findIndex((item) => item.playerId === currentPlayer?.id);
  const actualHasBuzzed = hasBuzzed || queuePosition >= 0;
  const firstBuzzer = buzzQueue[0];

  // In team mode, hasBuzzed may be true because a teammate buzzed (not this player)
  const teamBuzzed =
    isTeamMode &&
    actualHasBuzzed &&
    queuePosition < 0 &&
    !answeredWrongThisQuestion;

  return (
    <SafeScreen>
      {/* Header */}
      <div className="bg-bg pt-6 pb-3 px-4 border-b border-line sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (session?.roomId) router.replace(`/room/${session.roomId}`);
              else router.replace('/');
            }}
            className="w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center shrink-0"
          >
            <ArrowLeft size={18} className="text-txt" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-txt font-display font-semibold sm:text-[17px]">
              Question {questionIndex + 1}
              {session.totalQuestions > 0 && (
                <span className="text-txt-40 font-normal"> / {session.totalQuestions}</span>
              )}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-accent' : 'bg-buzz'}`} />
              <span className="text-txt-60 text-[11px]">{isConnected ? 'Connecté' : 'Déconnecté'}</span>
            </div>
          </div>

          {isManager && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-energy/12 border border-energy/30 text-energy text-[10px] font-bold shrink-0">
              <Crown size={10} fill="#FFD700" color="#FFD700" />
              {isWithoutModerator ? 'Host' : 'Manager'}
            </span>
          )}
          {isSpectator && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-energy/12 text-energy text-[10px] font-bold shrink-0">
              <Eye size={10} />
              Spectateur
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2.5">
          <span className="px-2 py-1 rounded-full bg-accent/12 border border-accent/30 text-accent text-[11px] font-semibold">
            {currentQuestion.category}
          </span>
          <span className="px-2 py-1 rounded-full bg-surface-2 border border-line text-txt-60 text-[11px] font-semibold">
            {currentQuestion.difficulty}
          </span>
          <span className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${
            isWithoutModerator ? 'bg-host/12 border-host/30 text-host' : 'bg-energy/12 border-energy/30 text-energy'
          }`}>
            {isWithoutModerator ? 'Sans modérateur' : 'Avec modérateur'}
          </span>
          {isTeamMode && (
            <span className="px-2 py-1 rounded-full bg-team/12 border border-team/30 text-team text-[11px] font-semibold">
              Équipes
            </span>
          )}
          {isTeamMode && currentPlayer?.teamId && (() => {
            const myTeam = teams.find(t => t.id === currentPlayer.teamId);
            if (!myTeam) return null;
            return (
              <span
                className="px-2 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1"
                style={{
                  backgroundColor: `color-mix(in oklab, ${myTeam.color ?? '#4A90D9'} 12%, transparent)`,
                  borderColor: `color-mix(in oklab, ${myTeam.color ?? '#4A90D9'} 35%, transparent)`,
                  color: myTeam.color ?? '#4A90D9',
                }}
              >
                <Users size={11} />
                {myTeam.name}
              </span>
            );
          })()}
        </div>
      </div>


      {/* Global Timer — Sans Modérateur, sticky sous le header */}
      {isWithoutModerator && globalTimerTotal > 0 && (
        <div className="sticky top-[88px] z-10 px-4 py-1.5 bg-bg border-b border-line">
          <GlobalTimerBar
            totalSeconds={globalTimerTotal}
            remainingSeconds={globalTimerRemaining}
            paused={globalTimerPaused}
          />
        </div>
      )}

      {/* PAUSE Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-surface px-10 py-8 rounded-3xl border-2 border-[#FFD700] flex flex-col items-center animate-in zoom-in-95 duration-200">
            <p className="text-[#FFD700] font-bold text-3xl text-center">PAUSE</p>
            <p className="text-txt-60 text-center mt-3">
              Le jeu est en pause
            </p>

            {isManager && (
              <button
                onClick={handleResume}
                disabled={isPauseToggling}
                className="mt-6 px-8 py-4 bg-[#00D397] rounded-2xl hover:bg-[#00B377] transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {isPauseToggling && (
                  <div className="w-4 h-4 border-2 border-btn-fg border-t-transparent rounded-full animate-spin" />
                )}
                <span className="text-btn-fg font-bold text-lg">Reprendre</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* CATEGORY CHANGE Overlay */}
      {showCategoryOverlay && currentQuestion && (
        <div className="fixed inset-0 z-40 bg-[#4A90D9]/90 flex items-center justify-center">
          <div className="flex flex-col items-center px-6 animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-4">
              <Layers size={48} color="#4A90D9" />
            </div>
            <p className="text-txt-60 text-base font-semibold uppercase tracking-widest mb-2">
              Nouvelle catégorie
            </p>
            <p className="text-txt font-bold text-4xl text-center">
              {currentQuestion.category}
            </p>
          </div>
        </div>
      )}

      {/* BUZZ ALERT Overlay — manager only (not in without-moderator mode) */}
      {isManager && !isWithoutModerator && showBuzzOverlay && hasBuzzes && firstBuzzer && (
        <div className="fixed inset-0 z-40 bg-[#D5442F]/90 flex flex-col">
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-4">
                <Hand size={48} color="#D5442F" />
              </div>
              <p className="text-txt font-bold text-5xl">BUZZ !</p>
              <p className="text-txt-60 text-2xl font-semibold mt-3">
                {firstBuzzer.playerName}
              </p>
              <p className="text-txt-60 text-base mt-1">
                A buzzé en {firstBuzzer.timeDiffMs < 1000
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
                    className={`flex flex-row items-center px-4 py-3 border-b border-white/10 ${index === 0 ? 'bg-white/15' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 shrink-0 ${index === 0 ? 'bg-white' : 'bg-white/30'}`}>
                      <span className={`font-bold text-xs ${index === 0 ? 'text-[#D5442F]' : 'text-txt'}`}>
                        {index + 1}
                      </span>
                    </div>
                    <div className="mr-2 shrink-0">
                      <Avatar
                        avatarUrl={qPlayer?.avatarUrl}
                        username={item.playerName}
                        size={30}
                      />
                    </div>
                    <div className="flex-1 flex flex-row items-center gap-2 flex-wrap">
                      <span className={`font-medium ${item.playerId === currentPlayer?.id ? 'text-[#FFD700]' : 'text-txt'}`}>
                        {item.playerName}
                        {item.playerId === currentPlayer?.id ? ' (Vous)' : ''}
                      </span>
                      {isTeamMode && item.teamName && (() => {
                        const teamColor = teams.find((t) => t.id === item.teamId)?.color ?? '#4A90D9';
                      return (
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `color-mix(in oklab, ${teamColor} 22%, transparent)`,
                            color: teamColor,
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
              );})}
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

      {/* Scrollable Content */}
      <div className="overflow-y-auto">
        {/* Question Display — MANAGER ONLY (not in without-moderator mode) */}
        {isManager && !isWithoutModerator && (
          <div className="px-4 pt-4">
            {/* Dashboard Header */}
            {/* <div className="flex flex-row items-center justify-between mb-3">
              <div className="bg-surface rounded-2xl px-4 py-2 border border-line">
                <p className="text-txt font-bold text-lg">
                  Question {questionIndex + 1}/{session.totalQuestions || '?'}
                </p>
              </div>
              <div className="flex flex-row">
                <div className="bg-[#00D39720] px-3 py-1.5 rounded-full border border-[#00D39740]">
                  <span className="text-[#00D397] text-sm font-medium">
                    {currentQuestion.category}
                  </span>
                </div>
                <div className="bg-surface-2 px-3 py-1.5 rounded-full ml-2">
                  <span className="text-txt-60 text-sm">
                    {currentQuestion.difficulty}
                  </span>
                </div>
              </div>
            </div> */}

            {/* Question & Answer Cards */}
            <div className="flex flex-row gap-3 mb-4">
              <ExpandableCard
                key={`q-${currentQuestion.id}`}
                icon={<Mic size={14} color="#00D397" />}
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
                  {showAnswer ? <EyeOff size={11} color="#FFFFFF80" /> : <Eye size={11} color="#FFFFFF80" />}
                  <span className="text-txt-60 text-xs">{showAnswer ? 'Masquer' : 'Afficher'}</span>
                </button>
                {showAnswer ? (
                  <ExpandableCard
                    key={`a-${currentQuestion.id}`}
                    icon={<Target size={14} color="#00D397" />}
                    label="RÉPONSE"
                    content={currentQuestion.answer || manualQuestions[questionIndex]?.answer || '...'}
                    subContent={currentQuestion.explanation || manualQuestions[questionIndex]?.explanation || undefined}
                    bgColor="bg-[#00D39710]"
                    borderColor="border-[#00D39740]"
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

        {/* Player View — also shown to manager in without-moderator mode */}
        {(!isManager || isWithoutModerator) && !isSpectator && (
          <div className="px-4 pt-4">
            {isWithoutModerator ? (
              <div className="flex flex-col gap-3">

                {/* Info manager en mode sans modérateur */}
                {isManager && isWithoutModerator && (
                  <div className="bg-[#8B5CF620] border border-[#8B5CF640] rounded-xl px-3 py-2">
                    <p className="text-[#8B5CF6] text-xs font-medium text-center">
                      🎮 Vous êtes aussi un joueur dans ce mode
                    </p>
                  </div>
                )}

                {/* ── Question display (progressive or identification) ── */}
                {currentQuestion?.questionType === 'IDENTIFICATION' && currentQuestion.imageUrl ? (
                  <IdentificationQuestionDisplay
                    imageUrl={currentQuestion.imageUrl}
                    category={currentQuestion.category}
                    text={currentQuestion.text}
                  />
                ) : (
                  <div className="relative">
                    <ProgressiveQuestionDisplay
                      text={currentQuestion.text}
                      wordIndex={displayWordIndex}
                      isRunning={displayRunning && !someoneIsAnswering}
                    />
                    {/* Indicateur pause quand quelqu'un répond */}
                    {someoneIsAnswering && (
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-bg/80 px-2 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                        <span className="text-[#FFD700] text-[10px] font-bold tracking-widest uppercase">Pause</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── C'est votre tour : chargement des choix ── */}
                {amIFirstInQueue && !myAnswerChoices && (
                  <div className="bg-[#00D39712] border border-[#00D39740] rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#00D397] border-t-transparent rounded-full animate-spin shrink-0" />
                    <div>
                      <p className="text-[#00D397] font-bold text-sm">C'est votre tour !</p>
                      <p className="text-[#00D397]/60 text-xs">Chargement des choix...</p>
                    </div>
                  </div>
                )}

                {/* ── Choix de réponse pour le 1er de la file ── */}
                {answerPanelVisible && myAnswerChoices && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-[#00D397] animate-pulse" />
                      <p className="text-[#00D397] text-xs font-bold tracking-widest uppercase">
                        C'est votre tour — choisissez
                      </p>
                    </div>
                    <AnswerChoicesPanel
                      choices={myAnswerChoices}
                      answerTimeSeconds={answerTimeSeconds}
                      onSubmit={handleSubmitAnswer}
                      isSubmitting={isSubmittingAnswer}
                      result={answerSubmitResult}
                    />
                  </div>
                )}

                {/* ── En file d'attente (position 2+) ── */}
                {queuePosition > 0 && (
                  <div className="bg-surface border border-line rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                      <span className="text-txt font-bold text-sm">#{queuePosition + 1}</span>
                    </div>
                    <div>
                      <p className="text-txt font-semibold text-sm">En file d'attente</p>
                      <p className="text-txt-60 text-xs">
                        Vous répondrez si {buzzQueue[0]?.playerName} se trompe
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Quelqu'un répond (pas dans la file) ── */}
                {someoneIsAnswering && !actualHasBuzzed && !answeredWrongThisQuestion && (
                  <div className="bg-surface border border-line rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className="flex gap-1 shrink-0">
                      {[0,1,2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    <p className="text-txt-60 text-sm">
                      <span className="text-txt font-semibold">{buzzQueue[0].playerName}</span> répond...
                    </p>
                  </div>
                )}

                {/* ── A déjà faux ce tour ── */}
                {answeredWrongThisQuestion && (
                  <div className="bg-[#D5442F12] border border-[#D5442F30] rounded-2xl px-4 py-3 flex items-center gap-3">
                    <XCircle size={16} className="text-[#D5442F] shrink-0" />
                    <p className="text-[#D5442F]/80 text-sm font-medium">
                      Vous avez déjà répondu faux pour cette question
                    </p>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* WITH_MODERATOR: écoute ou statut post-buzz */}
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
            )}
          </div>
        )}

        {/* Spectator View */}
        {isSpectator && (
          <div className="px-4 pt-4">
            <div className="bg-surface rounded-3xl p-8 border border-line flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-[#FFD70020] flex items-center justify-center mb-4">
                <Eye size={32} color="#FFD700" />
              </div>
              <p className="text-[#FFD700] text-xl font-semibold text-center mb-2">
                Mode spectateur
              </p>
              <p className="text-txt-60 text-center">
                Vous observez la partie
              </p>
            </div>
          </div>
        )}

        {/* Buzzer — Players + manager in without-moderator mode */}
        {/* Caché si le joueur a ses choix affichés (l'AnswerChoicesPanel les remplace) */}
        {!isSpectator && (!isManager || isWithoutModerator) && !answerPanelVisible && (
          <div className="px-4 py-3 flex flex-col items-center">
            <BuzzerButton
              onBuzz={handleBuzz}
              disabled={isSubmitting || isPaused || actualHasBuzzed || answeredWrongThisQuestion}
              hasBuzzed={actualHasBuzzed}
              queuePosition={queuePosition >= 0 ? queuePosition + 1 : null}
              teamBuzzed={teamBuzzed}
            />
            {teamBuzzed && firstBuzzer && (() => {
              const teamColor = teams.find((t) => t.id === firstBuzzer.teamId)?.color ?? '#4A90D9';
              return (
                <div
                  className="mt-2 w-full max-w-sm rounded-2xl p-4 border flex items-center gap-3 animate-[rise_0.25s_both]"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${teamColor} 10%, var(--surface))`,
                    borderColor: teamColor,
                  }}
                >
                  <div
                    className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `color-mix(in oklab, ${teamColor} 20%, transparent)` }}
                  >
                    <Users size={14} style={{ color: teamColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-txt font-bold text-[13.5px] leading-tight">
                      Votre équipe a déjà buzzé
                    </p>
                    <p className="text-txt-60 text-xs mt-0.5 truncate">
                      <strong>{firstBuzzer.playerName}</strong> répond pour {firstBuzzer.teamName || 'votre équipe'}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Buzz Queue */}
        <div className="px-4 pt-2">
          <div className={`rounded-3xl border overflow-hidden ${buzzQueue.length > 0 ? 'border-[#00D397] bg-[#00D39708]' : 'border-line bg-surface'}`}>
            {/* Queue Header */}
            <div className={`px-4 py-3 border-b ${buzzQueue.length > 0 ? 'border-[#00D39740] bg-[#00D39715]' : 'border-line'}`}>
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${buzzQueue.length > 0 ? 'bg-[#00D397]' : 'bg-surface-2'}`}>
                    <Zap size={16} className={buzzQueue.length > 0 ? 'text-btn-fg' : 'text-txt-40'} />
                  </div>
                  <p className="text-txt font-bold text-base">File d'attente</p>
                  <div className={`px-2.5 py-0.5 rounded-full ml-2 ${buzzQueue.length > 0 ? 'bg-[#00D397]' : 'bg-surface-2'}`}>
                    <span className={`font-semibold text-sm ${buzzQueue.length > 0 ? 'text-btn-fg' : 'text-txt'}`}>{buzzQueue.length}</span>
                  </div>
                </div>
                {buzzQueue.length > 0 && (
                  <div className="flex flex-row items-center bg-[#00D39720] px-3 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-[#00D397] mr-2 animate-pulse" />
                    <span className="text-[#00D397] text-sm font-medium">En cours</span>
                  </div>
                )}
              </div>
            </div>

            {/* Queue List */}
            {buzzQueue.length > 0 ? (
              <div>
                {/* First buzzer */}
                <div className="px-4 py-3 bg-[#00D39715] border-b border-[#00D39730]">
                  <div className="flex flex-row items-center">
                    <div className="w-12 h-12 rounded-full bg-[#00D397] flex items-center justify-center mr-3">
                      <span className="font-bold text-btn-fg text-lg">1</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-row items-center gap-2 flex-wrap">
                        <p className="text-txt font-bold text-lg">
                          {buzzQueue[0].playerName}
                        </p>
                        {isTeamMode && buzzQueue[0].teamName && (() => {
                          const teamColor = teams.find((t) => t.id === buzzQueue[0].teamId)?.color ?? '#4A90D9';
                          return (
                            <span
                              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `color-mix(in oklab, ${teamColor} 22%, transparent)`,
                                color: teamColor,
                              }}
                            >
                              {buzzQueue[0].teamName}
                            </span>
                          );
                        })()}
                      </div>
                      {isWithoutModerator ? (
                        <p className="text-[#00D397] text-sm flex items-center gap-1.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00D397] animate-pulse" />
                          Choisit sa réponse
                        </p>
                      ) : (
                        <p className="text-[#00D397] text-sm">En train de répondre</p>
                      )}
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

                  {/* Buzz countdown — WITH_MODERATOR uniquement */}
                  {!isWithoutModerator && countdown && countdown.playerId === buzzQueue[0].playerId && (
                    <div className="mt-3 flex flex-row items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-linear"
                          style={{
                            width: `${(countdown.seconds / 10) * 100}%`,
                            backgroundColor: countdown.seconds <= 3 ? '#D5442F' : countdown.seconds <= 6 ? '#FFD700' : '#00D397',
                          }}
                        />
                      </div>
                      <span
                        className="text-sm font-bold tabular-nums w-6 text-right"
                        style={{ color: countdown.seconds <= 3 ? '#D5442F' : countdown.seconds <= 6 ? '#FFD700' : '#00D397' }}
                      >
                        {countdown.seconds}
                      </span>
                    </div>
                  )}

                  {/* Quick Validation — Manager only (not in without-moderator mode) */}
                  {isManager && !isWithoutModerator && (
                    <div className="flex flex-row gap-2 mt-3">
                      <button
                        onClick={() => handleValidate(true)}
                        disabled={isValidating}
                        className="flex-1 py-3 rounded-xl bg-[#00D397] flex items-center justify-center hover:bg-[#00B377] transition-colors disabled:opacity-60"
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
                        className="flex-1 py-3 rounded-xl bg-[#D5442F] flex items-center justify-center hover:bg-[#B53320] transition-colors disabled:opacity-60"
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
                        <Avatar
                          avatarUrl={qPlayer?.avatarUrl}
                          username={item.playerName}
                          size={30}
                        />
                      </div>
                      <div className="flex-1 flex flex-row items-center gap-2 flex-wrap">
                        <span className={`font-medium ${item.playerId === currentPlayer?.id ? 'text-[#00D397]' : 'text-txt-60'}`}>
                          {item.playerName}
                          {item.playerId === currentPlayer?.id && ' (Vous)'}
                        </span>
                        {isTeamMode && item.teamName && (() => {
                          const teamColor = teams.find((t) => t.id === item.teamId)?.color ?? '#4A90D9';
                        return (
                          <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `color-mix(in oklab, ${teamColor} 22%, transparent)`,
                              color: teamColor,
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
                );})}
              </div>
            ) : (
              <div className="px-5 py-6 flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center mb-2">
                  <Zap size={24} color="#FFFFFF40" />
                </div>
                <p className="text-txt-60 text-center text-sm">
                  En attente de buzz...
                </p>
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
              {!isWithoutModerator && (
                <button
                  onClick={handleResetBuzzer}
                  disabled={buzzQueue.length === 0 || isResettingBuzzer}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-colors ${
                    buzzQueue.length > 0 && !isResettingBuzzer
                      ? 'bg-[#D5442F30] hover:bg-[#D5442F50]'
                      : 'bg-surface-2 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {isResettingBuzzer ? (
                    <div className="w-4 h-4 border-2 border-[#D5442F] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className={`font-medium text-sm ${buzzQueue.length > 0 ? 'text-[#D5442F]' : 'text-txt-40'}`}>
                      Reset
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={isPaused ? handleResume : handlePause}
                disabled={isPauseToggling}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-colors disabled:opacity-60 ${
                  isPaused
                    ? 'bg-[#00D397] hover:bg-[#00B377]'
                    : 'bg-[#FFD70030] border border-[#FFD70050] hover:bg-[#FFD70050]'
                }`}
              >
                <div className="flex flex-row items-center justify-center">
                  {isPauseToggling ? (
                    <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${isPaused ? 'border-btn-fg' : 'border-[#FFD700]'}`} />
                  ) : isPaused ? (
                    <>
                      <PlayCircle size={18} className="text-btn-fg mr-1.5" />
                      <span className="font-bold text-sm text-btn-fg">Reprendre</span>
                    </>
                  ) : (
                    <>
                      <PauseCircle size={18} color="#FFD700" className="mr-1.5" />
                      <span className="font-bold text-sm text-[#FFD700]">Pause</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Live Leaderboard */}
        <div className="px-4 pt-3 pb-12">
          {isTeamMode ? (
            <TeamLeaderboard
              teams={teams}
              players={players}
              currentUserId={user?.id}
              onCorrectClick={isManager ? () => setShowCorrection(true) : undefined}
            />
          ) : (
            <LiveLeaderboard
              players={players}
              currentUserId={user?.id}
              onPlayerTap={(p) => p.userId && setProfileUserId(p.userId)}
              onCorrectClick={isManager ? () => setShowCorrection(true) : undefined}
            />
          )}
        </div>
      </div>
      {/* Buzz flash overlay — sans modérateur */}
      {showBuzzFlash && isWithoutModerator && (
        <div className="fixed inset-0 z-30 bg-accent mix-blend-overlay animate-flash pointer-events-none" />
      )}

      <PlayerProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      <ScoreCorrectionSheet
        isOpen={showCorrection}
        onClose={() => setShowCorrection(false)}
        players={players}
        sessionId={session?.id || ''}
        currentUserId={user?.id}
      />

      {/* Answer Reveal Overlay — mode sans modérateur */}
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
        message={pendingWrong?.applyPenalty
          ? `${buzzQueue[0]?.playerName ?? 'Le joueur'} sera pénalisé et retiré de la file d'attente.`
          : `${buzzQueue[0]?.playerName ?? 'Le joueur'} sera retiré de la file sans perdre de points.`}
        confirmLabel={pendingWrong?.applyPenalty ? 'Faux' : 'Sans pénalité'}
        cancelLabel="Annuler"
        confirmColor="#D5442F"
        icon={<XCircle size={24} color="#D5442F" />}
        onConfirm={() => { const p = pendingWrong; setPendingWrong(null); if (p) handleValidate(false, p.applyPenalty); }}
        onCancel={() => setPendingWrong(null)}
      />
      <ConfirmModal
        open={showSkipConfirm}
        title="Passer la question ?"
        message="Cette question sera ignorée et vous passerez à la suivante. Cette action est irréversible."
        confirmLabel="Passer"
        cancelLabel="Annuler"
        confirmColor="#FFD700"
        icon={<SkipForward size={24} color="#FFD700" />}
        onConfirm={() => { setShowSkipConfirm(false); handleSkip(); }}
        onCancel={() => setShowSkipConfirm(false)}
      />
    </SafeScreen>
  );
}
