import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap } from 'lucide-react-native';
import { ModeratedGame } from '~/components/game/moderated/ModeratedGame';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { useAuthStore } from '~/stores/useAuthStore';
import { useGameSocket } from '~/lib/websocket';
import { useAppStateReconnect } from '~/native/websocket/useAppStateReconnect';
import * as gameApi from '~/lib/api/game';
import { appStorage } from '~/lib/utils/storage';
import { palette } from '~/lib/theme/tokens';

const POLL_WS_CONNECTED_MS = 3000;
const POLL_WS_DISCONNECTED_MS = 2000;

export default function GameScreen() {
  const router = useRouter();
  const { code, sessionId: paramSessionId } = useLocalSearchParams<{
    code: string;
    sessionId?: string;
  }>();

  // Automatic WS reconnect when coming back to foreground
  useAppStateReconnect();

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

  const sessionIdRef = useRef(session?.id);
  sessionIdRef.current = session?.id;
  const codeRef = useRef(code);
  codeRef.current = code;

  // Sync game state from API
  const syncGameState = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    try {
      const gameState = await gameApi.getGameState(sid);

      const serverStatus = gameState.session?.status as string | undefined;
      if (serverStatus === 'RESULTS') {
        useBuzzStore.getState().updateStatus('RESULTS');
        useBuzzStore.getState().setGameOver(true);
        router.replace(`/session/${codeRef.current}/results` as any);
        return;
      }

      if (gameState.statePacket) {
        useBuzzStore.getState().applyStatePacket(gameState.statePacket);
      }
    } catch {
      // ignore
    }
  }, [router]);

  // Load session
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

        router.replace('/(tabs)/rooms');
      } catch {
        router.replace('/(tabs)/rooms');
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
        router.replace('/(tabs)/rooms');
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
          router.replace(`/session/${code}/results` as any);
          break;
      }
    },
    onReconnect: async () => {
      await syncGameState();
    },
  });

  // Polling fallback
  useEffect(() => {
    const interval = setInterval(
      syncGameState,
      isConnected ? POLL_WS_CONNECTED_MS : POLL_WS_DISCONNECTED_MS
    );
    return () => clearInterval(interval);
  }, [isConnected, syncGameState]);

  const handlePause = useCallback(async () => {
    if (!session?.id || isPauseToggling) return;
    setIsPauseToggling(true);
    try {
      await pauseSession(session.id);
    } catch {
      // ignore
    } finally {
      setIsPauseToggling(false);
    }
  }, [session?.id, pauseSession, isPauseToggling]);

  const handleResume = useCallback(async () => {
    if (!session?.id || isPauseToggling) return;
    setIsPauseToggling(true);
    try {
      await resumeSession(session.id);
    } catch {
      // ignore
    } finally {
      setIsPauseToggling(false);
    }
  }, [session?.id, resumeSession, isPauseToggling]);

  const status = session?.status;
  const notStarted = status === 'LOBBY' || status === 'GENERATING' || status === 'CANCELLED';

  if (session && notStarted) {
    return (
      <SafeAreaView className="flex-1 bg-bg px-6 justify-center items-center">
        <View className="flex-col items-center">
          <View className="w-20 h-20 rounded-full bg-accent/15 flex-col items-center justify-center mb-4 border border-line">
            <Zap size={40} color={palette.primary} />
          </View>
          <Text className="text-txt font-semibold text-center mb-4">
            {status === 'GENERATING'
              ? 'Les questions sont en cours de génération…'
              : status === 'CANCELLED'
              ? 'Cette partie a été annulée.'
              : "La partie n'a pas encore été lancée."}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace(`/session/${code}/lobby` as any)}
            activeOpacity={0.8}
            className="px-6 py-3 rounded-full bg-buzz"
          >
            <Text className="text-white font-bold text-sm">
              Retour au lobby
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <SafeAreaView className="flex-1 bg-bg flex-col items-center justify-center">
        <View className="w-20 h-20 rounded-full bg-accent/15 flex-col items-center justify-center mb-4 border border-line">
          <Zap size={40} color={palette.primary} />
        </View>
        <Text className="text-txt font-semibold text-base">
          Chargement du jeu...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
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
    </SafeAreaView>
  );
}
