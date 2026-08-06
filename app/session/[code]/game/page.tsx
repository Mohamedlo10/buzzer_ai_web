'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Zap } from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { ModeratorFreeGame } from '~/components/game/moderator-free/ModeratorFreeGame';
import { ModeratedGame } from '~/components/game/moderated/ModeratedGame';
import { GameHeader } from '~/components/game/shared/GameHeader';
import { PauseOverlay } from '~/components/game/shared/PauseOverlay';
import { CategoryChangeOverlay } from '~/components/game/shared/CategoryChangeOverlay';
import { GameFooter } from '~/components/game/shared/GameFooter';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { useAuthStore } from '~/stores/useAuthStore';
import { useGameSocket } from '~/lib/websocket/useGameSocket';
import * as gameApi from '~/lib/api/game';
import { appStorage } from '~/lib/utils/storage';
import type { BuzzQueueItem } from '~/types/api';

// Adaptive polling constants
const POLL_WS_CONNECTED_MS = 3000;
const POLL_WS_DISCONNECTED_MS = 2000;

export default function GamePage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = params.code;

  const [isPauseToggling, setIsPauseToggling] = useState(false);
  const [sessionFetched, setSessionFetched] = useState(false);

  const user = useAuthStore((state) => state.user);
  const {
    session,
    players,
    teams,
    currentQuestion,
    questionIndex,
    isPaused,
    setBuzzQueue,
    fetchSession,
    leaveSession,
    pauseSession,
    resumeSession,
    displayRunning,
    globalTimerRemaining,
    globalTimerPaused,
    setDisplayRunning,
  } = useBuzzStore();

  const isManager = session?.managerId === user?.id;
  const isTeamMode = session?.isTeamMode ?? false;
  const currentPlayer = players.find((p) => p.userId === user?.id);
  const isSpectator = currentPlayer?.isSpectator ?? false;

  const sessionMode = session?.sessionMode ?? 'WITH_MODERATOR';
  const isWithoutModerator = sessionMode === 'WITHOUT_MODERATOR';

  const sessionIdRef = useRef(session?.id);
  sessionIdRef.current = session?.id;
  const codeRef = useRef(code);
  codeRef.current = code;

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

      const serverSessionMode = gameState.session.sessionMode as string | undefined;
      if (serverSessionMode) {
        useBuzzStore.setState((state) => ({
          session: state.session
            ? { ...state.session, sessionMode: serverSessionMode as any }
            : state.session,
        }));
      }

      const serverDisplayWordIndex = (gameState as any).displayWordIndex;
      if (serverDisplayWordIndex != null && serverDisplayWordIndex >= 0) {
        const q = gameState.currentQuestion;
        const totalWords = q?.text ? q.text.split(' ').length : 1;
        const currentLocalWordIndex = useBuzzStore.getState().displayWordIndex;
        const isWithoutMod = serverSessionMode === 'WITHOUT_MODERATOR' || isWithoutModerator;
        if (
          serverDisplayWordIndex > currentLocalWordIndex ||
          (serverDisplayWordIndex === 0 &&
            !useBuzzStore.getState().displayRunning &&
            !useBuzzStore.getState().questionFullyDisplayed)
        ) {
          useBuzzStore.setState({
            displayWordIndex: isWithoutMod ? totalWords - 1 : serverDisplayWordIndex,
            displayRunning: isWithoutMod ? false : serverDisplayWordIndex < totalWords - 1,
            ...(isWithoutMod || serverDisplayWordIndex >= totalWords - 1 ? { questionFullyDisplayed: true } : {}),
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

      if (gameState.statePacket) {
        useBuzzStore.getState().applyStatePacket(gameState.statePacket);
      } else {
        setBuzzQueue(gameState.buzzQueue ?? []);
      }

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
        const storeState = useBuzzStore.getState();
        const myPlayer = storeState.players.find((p) => p.userId === user.id);
        const myDirectBuzz = queue.some((b) => b.playerId === myPlayer?.id);
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
  }, [user?.id, setBuzzQueue, isWithoutModerator, router]);

  // WebSocket events
  const { isConnected } = useGameSocket(session?.id || null, {
    onEvent: (event) => {
      switch (event.type) {
        case 'game_over':
          router.replace(`/session/${code}/results`);
          break;
        case 'question_display_resume':
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
    } else if (session?.status === 'CANCELLED') {
      if (session?.roomId) router.replace(`/room/${session.roomId}`);
      else router.replace('/rooms');
    }
  }, [session?.status, session?.roomId, sessionFetched, code]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [isWithoutModerator, displayRunning, isConnected, currentQuestion?.id]);

  // Compteur local du timer global entre les événements WebSocket
  useEffect(() => {
    if (!isWithoutModerator || globalTimerPaused || globalTimerRemaining <= 0) return;
    const t = setTimeout(() => {
      useBuzzStore.setState((s: any) => ({
        globalTimerRemaining: Math.max(0, s.globalTimerRemaining - 1),
      }));
    }, 1000);
    return () => clearTimeout(t);
  }, [isWithoutModerator, globalTimerPaused, globalTimerRemaining]);

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

  const handleAdvanceAfterAllWrong = useCallback(async () => {
    if (!session?.id) return;
    try {
      await gameApi.advanceAfterAllWrong(session.id);
      useBuzzStore.setState({ answerReveal: null });
    } catch (err: any) {
      window.alert(err?.message || 'Action impossible');
    }
  }, [session?.id]);

  if (!session || !currentQuestion) {
    return (
      <SafeScreen>
        <div className="flex-1 flex flex-col justify-center items-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center mb-4">
              <Zap size={40} color="var(--primary)" />
            </div>
            <p className="text-txt font-semibold">Chargement du jeu...</p>
          </div>
        </div>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen className="h-[100dvh] max-h-[100dvh] w-full flex flex-col overflow-hidden relative bg-transparent">
      <GameHeader
        session={session}
        currentQuestion={currentQuestion}
        questionIndex={questionIndex}
        isConnected={isConnected}
        isManager={isManager}
        isSpectator={isSpectator}
        currentPlayer={currentPlayer}
        teams={teams}
      />

      <PauseOverlay
        isPaused={isPaused}
        isManager={isManager}
        isPauseToggling={isPauseToggling}
        onResume={handleResume}
      />

      <CategoryChangeOverlay currentQuestion={currentQuestion} />

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y pb-28">
        {isWithoutModerator ? (
          <div className="px-4 pt-4">
            <ModeratorFreeGame
              sessionId={session.id}
              myPlayer={currentPlayer}
              players={players}
              teams={teams}
              isManager={isManager}
              isSpectator={isSpectator}
              onAdvanceAfterAllWrong={handleAdvanceAfterAllWrong}
            />
          </div>
        ) : (
          <ModeratedGame
            sessionId={session.id}
            isManager={isManager}
            isSpectator={isSpectator}
            currentPlayer={currentPlayer}
            players={players}
            teams={teams}
            isTeamMode={isTeamMode}
            handlePause={handlePause}
            handleResume={handleResume}
            isPauseToggling={isPauseToggling}
          />
        )}

        <GameFooter
          sessionId={session.id}
          players={players}
          teams={teams}
          isTeamMode={isTeamMode}
          isManager={isManager}
          currentUserId={user?.id}
        />
      </div>
    </SafeScreen>
  );
}
