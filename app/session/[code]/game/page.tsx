'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Zap } from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { ModeratorFreeGame } from '~/components/game/moderator-free/ModeratorFreeGame';
import { ModeratedGame } from '~/components/game/moderated/ModeratedGame';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { useAuthStore } from '~/stores/useAuthStore';
import { useGameSocket } from '~/lib/websocket/useGameSocket';
import * as gameApi from '~/lib/api/game';
import { appStorage } from '~/lib/utils/storage';

const POLL_WS_CONNECTED_MS = 3000;
const POLL_WS_DISCONNECTED_MS = 2000;

export default function GamePage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const code = params.code;
  const paramSessionId = searchParams.get('sessionId');

  const [isPauseToggling, setIsPauseToggling] = useState(false);
  const [sessionFetched, setSessionFetched] = useState(false);

  const user = useAuthStore((state) => state.user);
  const {
    session,
    players,
    teams,
    currentQuestion,
    fetchSession,
    leaveSession,
    pauseSession,
    resumeSession,
    game,
  } = useBuzzStore();

  const isManager = session?.managerId === user?.id;
  const isTeamMode = session?.isTeamMode ?? false;
  const currentPlayer = players.find((p) => p.userId === user?.id);
  const isSpectator = currentPlayer ? currentPlayer.isSpectator : !isManager;

  const sessionMode = game.sessionMode ?? session?.sessionMode ?? 'WITH_MODERATOR';
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

      // Feed authoritative state packet to store
      if (gameState.statePacket) {
        useBuzzStore.getState().applyStatePacket(gameState.statePacket);
      }
    } catch {
      // Ignore poll failures (e.g., offline)
    }
  }, [router]);

  // Load session from storage
  useEffect(() => {
    setSessionFetched(false);
    if (!code) return;
    if (session && session.code === code) {
      setSessionFetched(true);
      return;
    }

    if (session && session.code !== code) {
      leaveSession();
    }

    const loadSession = async () => {
      try {
        if (paramSessionId) {
          await fetchSession(paramSessionId);
          await appStorage.setActiveSession({
            sessionId: paramSessionId,
            code,
          });
          setSessionFetched(true);
          return;
        }

        const activeSession = await appStorage.getActiveSession();

        if (activeSession?.sessionId && activeSession?.code === code) {
          await fetchSession(activeSession.sessionId);
          setSessionFetched(true);
          return;
        }

        const checkResult = await useBuzzStore.getState().joinCheck(code);
        if (checkResult?.sessionId) {
          await fetchSession(checkResult.sessionId);
          await appStorage.setActiveSession({
            sessionId: checkResult.sessionId,
            code: checkResult.code,
          });
          setSessionFetched(true);
          return;
        }

        router.replace('/rooms');
      } catch {
        router.replace('/rooms');
      }
    };

    loadSession();
  }, [code, paramSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial game state load
  useEffect(() => {
    if (!session?.id) return;

    const loadGameState = async () => {
      try {
        await fetchSession(session.id);
        setSessionFetched(true);
        await syncGameState();
      } catch {
        router.replace('/rooms');
      }
    };

    if (sessionFetched) {
      loadGameState();
    }
  }, [session?.id, sessionFetched, syncGameState, router, fetchSession]);

  // WebSocket events
  const { isConnected } = useGameSocket(session?.id || null, {
    onEvent: (event) => {
      switch (event.type) {
        case 'game_over':
          router.replace(`/session/${code}/results`);
          break;
      }
    },
    onReconnect: async () => {
      await syncGameState();
    },
  });

  // Polling fallback
  useEffect(() => {
    const interval = setInterval(syncGameState, isConnected ? POLL_WS_CONNECTED_MS : POLL_WS_DISCONNECTED_MS);
    return () => clearInterval(interval);
  }, [isConnected, syncGameState]);

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
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y pb-6">
        {isWithoutModerator ? (
          <ModeratorFreeGame
            sessionId={session.id}
            myPlayer={currentPlayer}
            players={players}
            teams={teams}
            isManager={isManager}
            isSpectator={isSpectator}
            onAdvanceAfterAllWrong={handleAdvanceAfterAllWrong}
          />
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
      </div>
    </SafeScreen>
  );
}
