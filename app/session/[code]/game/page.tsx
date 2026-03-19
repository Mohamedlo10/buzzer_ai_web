'use client';

import { useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Crown,
  Eye,
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
        className={`text-white text-base leading-relaxed ${isBold ? 'font-bold' : ''} ${!expanded ? 'line-clamp-6' : ''}`}
      >
        {content}
      </p>

      {subContent && (
        <p className={`text-white/50 text-xs mt-2 leading-relaxed ${!expanded ? 'line-clamp-4' : ''}`}>
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
          <span className="text-white/40 text-xs">Cliquez pour réduire ↑</span>
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
  const [isSkipping, setIsSkipping] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
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

  const user = useAuthStore((state) => state.user);
  const {
    session,
    players,
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
  } = useBuzzStore();

  const isManager = session?.managerId === user?.id;
  const currentPlayer = players.find((p) => p.userId === user?.id);
  const isSpectator = currentPlayer?.isSpectator ?? false;
  const hasBuzzes = buzzQueue.length > 0;

  const sessionIdRef = useRef(session?.id);
  sessionIdRef.current = session?.id;
  const codeRef = useRef(code);
  codeRef.current = code;

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (buzzOverlayTimeoutRef.current) clearTimeout(buzzOverlayTimeoutRef.current);
      if (categoryOverlayTimeoutRef.current) clearTimeout(categoryOverlayTimeoutRef.current);
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

      if (gameState.players?.length) {
        useBuzzStore.setState({ players: gameState.players });
      }

      if (user?.id && gameState.buzzQueue?.some((b: BuzzQueueItem) => b.playerId === user.id)) {
        useBuzzStore.getState().setHasBuzzed(true);
      }
    } catch {
      // Silently fail
    }
  }, [user?.id, setBuzzQueue]); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket events
  const { isConnected } = useGameSocket(session?.id || null, {
    onEvent: (event) => {
      switch (event.type) {
        case 'buzzer_pressed':
          if (isManager && buzzQueue.length === 0) {
            setShowBuzzOverlay(true);
            if (buzzOverlayTimeoutRef.current) clearTimeout(buzzOverlayTimeoutRef.current);
            buzzOverlayTimeoutRef.current = setTimeout(() => setShowBuzzOverlay(false), 1500);
          }
          break;
        case 'buzzer_reset':
          buzzLockRef.current = false;
          setShowBuzzOverlay(false);
          if (buzzOverlayTimeoutRef.current) {
            clearTimeout(buzzOverlayTimeoutRef.current);
            buzzOverlayTimeoutRef.current = null;
          }
          break;
        case 'answer_validated':
          break;
        case 'game_over':
          router.replace(`/session/${code}/results`);
          break;
      }
    },
    onReconnect: syncGameState,
  });

  // Load session from storage
  useEffect(() => {
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
      } catch {
        // ignore
      }

      await syncGameState();
    };

    loadGameState();
  }, [session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load questions with answers for manager
  useEffect(() => {
    if (!session?.id || !isManager) return;
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
  }, [session?.id, isManager, session?.questionMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Adaptive polling
  useEffect(() => {
    if (!session?.id) return;

    const ms = isConnected ? POLL_WS_CONNECTED_MS : POLL_WS_DISCONNECTED_MS;
    const interval = setInterval(() => {
      syncGameState();
    }, ms);
    return () => clearInterval(interval);
  }, [session?.id, syncGameState, isConnected]);

  // Redirect if not in playing state
  useEffect(() => {
    if (session?.status === 'LOBBY') {
      router.replace(`/session/${code}/lobby`);
    } else if (session?.status === 'GENERATING') {
      router.replace(`/session/${code}/loading`);
    } else if (session?.status === 'RESULTS') {
      router.replace(`/session/${code}/results`);
    }
  }, [session?.status, code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset buzz lock when question changes
  useEffect(() => {
    buzzLockRef.current = false;
  }, [currentQuestion?.id]);

  const handleBuzz = useCallback(async () => {
    if (!session?.id || buzzLockRef.current || isSpectator) return;

    const isInQueue = buzzQueue.some((item) => item.playerId === user?.id);
    if (isInQueue) return;

    buzzLockRef.current = true;
    setIsSubmitting(true);

    try {
      const timestamp = Date.now();
      await gameApi.buzz(session.id, timestamp);
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
  }, [session?.id, buzzQueue, user?.id, isSpectator]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <SafeScreen className="bg-[#292349]">
        <div className="flex-1 flex flex-col justify-center items-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[#00D39720] flex items-center justify-center mb-4">
              <Zap size={40} color="#00D397" />
            </div>
            <p className="text-white font-semibold">Chargement du jeu...</p>
          </div>
        </div>
      </SafeScreen>
    );
  }

  const queuePosition = buzzQueue.findIndex((item) => item.playerId === user?.id);
  const actualHasBuzzed = hasBuzzed || queuePosition >= 0;
  const firstBuzzer = buzzQueue[0];

  return (
    <SafeScreen className="bg-[#292349]">
      {/* Header */}
      <div className="bg-[#292349] pt-6 pb-4 px-4 border-b border-[#3E3666] sticky top-0 z-10">
        <div className="flex flex-row items-center">
          <button
            onClick={() => {
              if (session?.roomId) {
                router.replace(`/room/${session.roomId}`);
              } else {
                router.replace('/');
              }
            }}
            className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center mr-3 hover:bg-[#3E3666] transition-colors"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>

          <div className="flex-1">
            <p className="text-white font-bold text-xl">
              Question {questionIndex + 1}
              {session.totalQuestions > 0 && (
                <span className="text-white/40 text-base font-normal">
                  {' '}/ {session.totalQuestions}
                </span>
              )}
            </p>
            <div className="flex flex-row items-center mt-0.5">
              {isConnected ? (
                <div className="w-2 h-2 rounded-full bg-[#00D397] mr-2" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-[#D5442F] mr-2" />
              )}
              <span className="text-white/60 text-xs">
                {isConnected ? 'Connecté' : 'Déconnecté'}
              </span>
            </div>
          </div>

          {isManager && (
            <div className="flex flex-row items-center bg-[#FFD70020] px-3 py-1.5 rounded-full mr-2">
              <Crown size={12} color="#FFD700" />
              <span className="text-[#FFD700] text-xs font-semibold ml-1">Manager</span>
            </div>
          )}

          {isSpectator && (
            <div className="flex flex-row items-center bg-[#FFD70020] px-3 py-1.5 rounded-full">
              <Eye size={12} color="#FFD700" />
              <span className="text-[#FFD700] text-xs font-semibold ml-1">Spectateur</span>
            </div>
          )}
        </div>

        {/* Category & Difficulty */}
        <div className="flex flex-row items-center mt-3">
          <div className="bg-[#00D39720] px-3 py-1.5 rounded-full border border-[#00D39740]">
            <span className="text-[#00D397] text-sm font-medium">
              {currentQuestion.category}
            </span>
          </div>
          <div className="bg-[#3E3666] px-3 py-1.5 rounded-full ml-2">
            <span className="text-white/60 text-sm">
              {currentQuestion.difficulty}
            </span>
          </div>
        </div>
      </div>

      {/* PAUSE Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-[#342D5B] px-10 py-8 rounded-3xl border-2 border-[#FFD700] flex flex-col items-center animate-in zoom-in-95 duration-200">
            <p className="text-[#FFD700] font-bold text-3xl text-center">PAUSE</p>
            <p className="text-white/60 text-center mt-3">
              Le jeu est en pause
            </p>

            {isManager && (
              <button
                onClick={handleResume}
                disabled={isPauseToggling}
                className="mt-6 px-8 py-4 bg-[#00D397] rounded-2xl hover:bg-[#00B377] transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {isPauseToggling && (
                  <div className="w-4 h-4 border-2 border-[#292349] border-t-transparent rounded-full animate-spin" />
                )}
                <span className="text-[#292349] font-bold text-lg">Reprendre</span>
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
            <p className="text-white/70 text-base font-semibold uppercase tracking-widest mb-2">
              Nouvelle catégorie
            </p>
            <p className="text-white font-bold text-4xl text-center">
              {currentQuestion.category}
            </p>
          </div>
        </div>
      )}

      {/* BUZZ ALERT Overlay — manager only */}
      {isManager && showBuzzOverlay && hasBuzzes && firstBuzzer && (
        <div className="fixed inset-0 z-40 bg-[#D5442F]/90 flex flex-col">
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-4">
                <Hand size={48} color="#D5442F" />
              </div>
              <p className="text-white font-bold text-5xl">BUZZ !</p>
              <p className="text-white/90 text-2xl font-semibold mt-3">
                {firstBuzzer.playerName}
              </p>
              <p className="text-white/60 text-base mt-1">
                A buzzé en {firstBuzzer.timeDiffMs < 1000
                  ? `${firstBuzzer.timeDiffMs}ms`
                  : `${(firstBuzzer.timeDiffMs / 1000).toFixed(1)}s`}
              </p>
              {buzzQueue.length > 1 && (
                <p className="text-white/50 text-sm mt-2">
                  +{buzzQueue.length - 1} autre{buzzQueue.length > 2 ? 's' : ''} en attente
                </p>
              )}
            </div>
          </div>

          {/* Buzz Queue Detail */}
          <div className="px-4 pb-8">
            <div className="bg-black/40 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 bg-black/30">
                <p className="text-white font-semibold text-center">File d'attente</p>
              </div>
              {buzzQueue.slice(0, 3).map((item, index) => (
                <div
                  key={item.playerId}
                  className={`flex flex-row items-center px-4 py-3 border-b border-white/10 ${index === 0 ? 'bg-white/15' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${index === 0 ? 'bg-white' : 'bg-white/30'}`}>
                    <span className={`font-bold ${index === 0 ? 'text-[#D5442F]' : 'text-white'}`}>
                      {index + 1}
                    </span>
                  </div>
                  <span className={`flex-1 font-medium ${item.playerId === user?.id ? 'text-[#FFD700]' : 'text-white'}`}>
                    {item.playerName}
                    {item.playerId === user?.id ? ' (Vous)' : ''}
                  </span>
                  <span className="text-white/60 text-sm">
                    {item.timeDiffMs < 1000
                      ? `${item.timeDiffMs}ms`
                      : `${(item.timeDiffMs / 1000).toFixed(1)}s`}
                  </span>
                </div>
              ))}
              {buzzQueue.length > 3 && (
                <div className="px-4 py-2 bg-black/20">
                  <p className="text-white/40 text-center text-sm">
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
        {/* Question Display — MANAGER ONLY */}
        {isManager && (
          <div className="px-4 pt-4">
            {/* Dashboard Header */}
            <div className="flex flex-row items-center justify-between mb-3">
              <div className="bg-[#342D5B] rounded-2xl px-4 py-2 border border-[#3E3666]">
                <p className="text-white font-bold text-lg">
                  Question {questionIndex + 1}/{session.totalQuestions || '?'}
                </p>
              </div>
              <div className="flex flex-row">
                <div className="bg-[#00D39720] px-3 py-1.5 rounded-full border border-[#00D39740]">
                  <span className="text-[#00D397] text-sm font-medium">
                    {currentQuestion.category}
                  </span>
                </div>
                <div className="bg-[#3E3666] px-3 py-1.5 rounded-full ml-2">
                  <span className="text-white/60 text-sm">
                    {currentQuestion.difficulty}
                  </span>
                </div>
              </div>
            </div>

            {/* Question & Answer Cards */}
            <div className="flex flex-row gap-3 mb-4">
              <ExpandableCard
                key={`q-${currentQuestion.id}`}
                icon={<Mic size={14} color="#00D397" />}
                label="QUESTION"
                content={currentQuestion.text}
                bgColor="bg-[#342D5B]"
                borderColor="border-[#3E3666]"
              />

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
            </div>
          </div>
        )}

        {/* Player View */}
        {!isManager && !isSpectator && (
          <div className="px-4 pt-4">
            <div className="bg-[#342D5B] rounded-3xl p-4 border border-[#3E3666] flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#00D39720] flex items-center justify-center mb-2">
                <Mic size={26} color="#00D397" />
              </div>
              <p className="text-white text-base font-semibold text-center mb-1">
                Écoutez la question...
              </p>
              <p className="text-white/50 text-center">
                {currentQuestion.category} • {currentQuestion.difficulty}
              </p>
            </div>
          </div>
        )}

        {/* Spectator View */}
        {isSpectator && (
          <div className="px-4 pt-4">
            <div className="bg-[#342D5B] rounded-3xl p-8 border border-[#3E3666] flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-[#FFD70020] flex items-center justify-center mb-4">
                <Eye size={32} color="#FFD700" />
              </div>
              <p className="text-[#FFD700] text-xl font-semibold text-center mb-2">
                Mode spectateur
              </p>
              <p className="text-white/50 text-center">
                Vous observez la partie
              </p>
            </div>
          </div>
        )}

        {/* Buzzer — Players only */}
        {!isSpectator && !isManager && (
          <div className="px-4 py-3 flex justify-center">
            <BuzzerButton
              onBuzz={handleBuzz}
              disabled={isSubmitting || isPaused || actualHasBuzzed || answeredWrongThisQuestion}
              hasBuzzed={actualHasBuzzed}
              queuePosition={queuePosition >= 0 ? queuePosition + 1 : null}
            />
          </div>
        )}

        {/* Buzz Queue */}
        <div className="px-4 pt-2">
          <div className={`rounded-3xl border overflow-hidden ${buzzQueue.length > 0 ? 'border-[#00D397] bg-[#00D39708]' : 'border-[#3E3666] bg-[#342D5B]'}`}>
            {/* Queue Header */}
            <div className={`px-4 py-3 border-b ${buzzQueue.length > 0 ? 'border-[#00D39740] bg-[#00D39715]' : 'border-[#3E3666]'}`}>
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${buzzQueue.length > 0 ? 'bg-[#00D397]' : 'bg-[#3E3666]'}`}>
                    <Zap size={16} color={buzzQueue.length > 0 ? '#292349' : '#FFFFFF60'} />
                  </div>
                  <p className="text-white font-bold text-base">File d'attente</p>
                  <div className={`px-2.5 py-0.5 rounded-full ml-2 ${buzzQueue.length > 0 ? 'bg-[#00D397]' : 'bg-[#3E3666]'}`}>
                    <span className={`font-semibold text-sm ${buzzQueue.length > 0 ? 'text-[#292349]' : 'text-white'}`}>{buzzQueue.length}</span>
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
                      <span className="font-bold text-[#292349] text-lg">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-lg">
                        {buzzQueue[0].playerName}
                      </p>
                      <p className="text-[#00D397] text-sm">
                        En train de répondre
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-white font-bold text-lg">
                        {buzzQueue[0].timeDiffMs < 1000
                          ? `${buzzQueue[0].timeDiffMs}ms`
                          : `${(buzzQueue[0].timeDiffMs / 1000).toFixed(1)}s`}
                      </p>
                      <p className="text-white/40 text-xs">reaction</p>
                    </div>
                  </div>

                  {/* Quick Validation — Manager only */}
                  {isManager && (
                    <div className="flex flex-row gap-2 mt-3">
                      <button
                        onClick={() => handleValidate(true)}
                        disabled={isValidating}
                        className="flex-1 py-3 rounded-xl bg-[#00D397] flex items-center justify-center hover:bg-[#00B377] transition-colors disabled:opacity-60"
                      >
                        {isValidating ? (
                          <div className="w-4 h-4 border-2 border-[#292349] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <div className="flex flex-row items-center">
                            <CheckCircle size={18} color="#292349" />
                            <span className="text-[#292349] font-bold ml-1.5">Correct</span>
                          </div>
                        )}
                      </button>
                      <button
                        onClick={() => handleValidate(false, true)}
                        disabled={isValidating}
                        className="flex-1 py-3 rounded-xl bg-[#D5442F] flex items-center justify-center hover:bg-[#B53320] transition-colors disabled:opacity-60"
                      >
                        {isValidating ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <div className="flex flex-row items-center">
                            <XCircle size={18} color="#FFFFFF" />
                            <span className="text-white font-bold ml-1.5">Faux</span>
                          </div>
                        )}
                      </button>
                      <button
                        onClick={() => handleValidate(false, false)}
                        disabled={isValidating}
                        className="px-3 py-3 rounded-xl bg-[#3E3666] flex items-center justify-center hover:bg-[#4E4676] transition-colors disabled:opacity-60"
                      >
                        <span className="text-white/70 text-xs">Sans pénalité</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Other buzzers */}
                {buzzQueue.slice(1).map((item, index) => (
                  <div
                    key={item.playerId}
                    className="flex flex-row items-center px-4 py-2.5 border-b border-[#3E3666] last:border-b-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#3E3666] flex items-center justify-center mr-3">
                      <span className="font-bold text-white text-sm">{index + 2}</span>
                    </div>
                    <div className="flex-1">
                      <span className={`font-medium ${item.playerId === user?.id ? 'text-[#00D397]' : 'text-white/80'}`}>
                        {item.playerName}
                        {item.playerId === user?.id && ' (Vous)'}
                      </span>
                    </div>
                    <span className="text-white/50 text-sm">
                      {item.timeDiffMs < 1000
                        ? `${item.timeDiffMs}ms`
                        : `${(item.timeDiffMs / 1000).toFixed(1)}s`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-6 flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-[#3E3666] flex items-center justify-center mb-2">
                  <Zap size={24} color="#FFFFFF40" />
                </div>
                <p className="text-white/50 text-center text-sm">
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
                className="flex-1 py-3 rounded-xl bg-[#3E3666] flex items-center justify-center hover:bg-[#4E4676] transition-colors disabled:opacity-60"
              >
                {isSkipping ? (
                  <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-white/80 font-medium text-sm">Passer</span>
                )}
              </button>
              <button
                onClick={handleResetBuzzer}
                disabled={buzzQueue.length === 0 || isResettingBuzzer}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-colors ${
                  buzzQueue.length > 0 && !isResettingBuzzer
                    ? 'bg-[#D5442F30] hover:bg-[#D5442F50]'
                    : 'bg-[#3E3666] opacity-50 cursor-not-allowed'
                }`}
              >
                {isResettingBuzzer ? (
                  <div className="w-4 h-4 border-2 border-[#D5442F] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className={`font-medium text-sm ${buzzQueue.length > 0 ? 'text-[#D5442F]' : 'text-white/40'}`}>
                    Reset
                  </span>
                )}
              </button>
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
                    <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${isPaused ? 'border-[#292349]' : 'border-[#FFD700]'}`} />
                  ) : isPaused ? (
                    <>
                      <PlayCircle size={18} color="#292349" className="mr-1.5" />
                      <span className="font-bold text-sm text-[#292349]">Reprendre</span>
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

        {/* Leaderboard */}
        <div className="px-4 pt-3 pb-12">
          <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#3E3666] bg-[#FFD70008]">
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center">
                  <Trophy size={16} color="#FFD700" />
                  <p className="text-white font-bold text-base ml-2">Classement</p>
                </div>
                <span className="text-white/40 text-xs">{players.length} joueurs</span>
              </div>
            </div>

            {/* Top 3 */}
            <div className="flex flex-row px-2 py-2 gap-2 border-b border-[#3E3666]">
              {[...players]
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex-1 rounded-xl p-2.5 ${
                      index === 0 ? 'bg-[#FFD70020] border border-[#FFD70040]' :
                      index === 1 ? 'bg-[#C0C0C020] border border-[#C0C0C040]' :
                      index === 2 ? 'bg-[#CD7F3220] border border-[#CD7F3240]' :
                      'bg-[#3E3666]'
                    }`}
                  >
                    <div className="flex flex-row items-center gap-1.5 mb-1.5">
                      <Avatar
                        avatarUrl={player.avatarUrl}
                        username={player.name}
                        size={28}
                        borderColor={
                          index === 0 ? '#FFD700' :
                          index === 1 ? '#C0C0C0' :
                          '#CD7F32'
                        }
                      />
                      <span className={`font-bold text-xs ${
                        index === 0 ? 'text-[#FFD700]' :
                        index === 1 ? 'text-[#C0C0C0]' :
                        index === 2 ? 'text-[#CD7F32]' :
                        'text-white/60'
                      }`}>#{index + 1}</span>
                    </div>
                    <p className="text-white font-semibold text-xs truncate">
                      {player.name}
                    </p>
                    <p className="text-white/70 text-xs font-medium">{player.score} pts</p>
                    {player.selectedCategories?.length > 0 && (
                      <div className="flex flex-row flex-wrap gap-0.5 mt-1">
                        {player.selectedCategories.map((cat) => (
                          <div key={cat} className="px-1.5 py-0.5 rounded-full bg-[#292349]">
                            <span className="text-white/50 text-[9px] truncate">{cat}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Other players */}
            <div>
              {[...players]
                .sort((a, b) => b.score - a.score)
                .slice(3)
                .map((player, index) => (
                  <div
                    key={player.id}
                    className="flex flex-row items-center px-4 py-2 border-b border-[#3E3666] last:border-b-0"
                  >
                    <span className="text-white/40 text-xs w-6">{index + 4}</span>
                    <Avatar
                      avatarUrl={player.avatarUrl}
                      username={player.name}
                      size={32}
                      borderColor={player.userId === user?.id ? '#00D397' : undefined}
                    />
                    <div className="flex-1 ml-2">
                      <p className={`font-medium text-sm ${player.userId === user?.id ? 'text-[#00D397]' : 'text-white/80'}`}>
                        {player.name}
                      </p>
                      {player.selectedCategories?.length > 0 && (
                        <div className="flex flex-row flex-wrap gap-1 mt-0.5">
                          {player.selectedCategories.map((cat) => (
                            <div key={cat} className="px-2 py-0.5 rounded-full bg-[#3E3666]">
                              <span className="text-white/50 text-[10px]">{cat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-white font-semibold text-sm">{player.score}pts</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
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
