import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Zap } from 'lucide-react-native';

import { SprintGame } from '~/components/game/sprint/SprintGame';
import { ModeratedGame } from '~/components/game/moderated/ModeratedGame';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { useAuthStore } from '~/stores/useAuthStore';
import { useGameSocket } from '~/lib/websocket/useGameSocket';
import * as gameApi from '~/lib/api/game';
import { appStorage } from '~/lib/utils/storage';
import { palette, font } from '~/lib/theme/tokens';
import { notifyApiError } from '~/lib/ui/notify';

export default function GamePage() {
  const router = useRouter();
  const { code, sessionId: paramSessionId } = useLocalSearchParams<{ code: string; sessionId?: string }>();

  const [isPauseToggling, setIsPauseToggling] = useState(false);
  const [sessionFetched, setSessionFetched] = useState(false);

  const user = useAuthStore((state) => state.user);
  const {
    session, players, teams, currentQuestion, fetchSession, leaveSession, pauseSession, resumeSession, game, isPaused
  } = useBuzzStore();

  const isManager = session?.managerId === user?.id;
  const isTeamMode = session?.isTeamMode ?? false;
  const currentPlayer =
    players.find((p) => p.userId === user?.id || p.id === user?.id) ||
    (user?.username ? players.find((p) => p.name === user.username) : undefined);
  const isSpectator = Boolean(currentPlayer?.isSpectator);

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
        router.replace(`/session/${codeRef.current}/results` as any);
        return;
      }
      // Sync pause state from server — handles cases where WS event was missed
      if (serverStatus === 'PLAYING' && useBuzzStore.getState().isPaused) {
        useBuzzStore.getState().setPaused(false);
      } else if (serverStatus === 'PAUSED' && !useBuzzStore.getState().isPaused) {
        useBuzzStore.getState().setPaused(true);
      }
      // Sync players and teams if returned
      if (gameState.players && gameState.players.length > 0) {
        useBuzzStore.setState({ players: gameState.players });
      }
      if (gameState.teams && gameState.teams.length > 0) {
        useBuzzStore.setState({ teams: gameState.teams });
      }
      // Sync hasBuzzed state from backend
      if (typeof gameState.hasBuzzed === 'boolean') {
        useBuzzStore.setState({ hasBuzzed: gameState.hasBuzzed });
      }
      // Sync currentQuestion from REST — critical for moderated mode after refresh.
      if (gameState.currentQuestion && !useBuzzStore.getState().currentQuestion) {
        const q = gameState.currentQuestion;
        const idx = (q as any).orderIndex ?? useBuzzStore.getState().questionIndex;
        useBuzzStore.getState().setCurrentQuestion(q, idx, useBuzzStore.getState().totalQuestions || 0);
      }
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
          await appStorage.setActiveSession({ sessionId: paramSessionId, code });
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
          await appStorage.setActiveSession({ sessionId: checkResult.sessionId, code: checkResult.code });
          setSessionFetched(true);
          return;
        }
        router.replace('/(tabs)/rooms');
      } catch {
        router.replace('/(tabs)/rooms');
      }
    };
    loadSession();
  }, [code, paramSessionId]); // eslint-disable-line

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
      if (event.type === 'game_over') {
        router.replace(`/session/${code}/results` as any);
      }
      // Le backend a clos la session pendant qu'on y jouait (arrêt forcé par un admin,
      // par exemple). Le manager émettait déjà cet événement, mais aucun écran ne
      // l'écoutait : la partie restait affichée alors que le serveur ne répondait plus.
      if (event.type === '_session_closed') {
        router.replace(`/session/${code}/results` as any);
      }
    },
    onReconnect: async () => {
      await syncGameState();
    },
  });

  useEffect(() => {
    if (session?.status === 'RESULTS' || game.phase === 'FINISHED') {
      router.replace(`/session/${code}/results` as any);
    }
  }, [session?.status, game.phase, code, router]);

  // Polling de secours UNIQUEMENT pendant une déconnexion WebSocket.
  //
  // L'intervalle s'allonge à chaque tentative (2 s → 4 → 8 → 15, plafonné) au lieu de
  // rester fixe à 2 s : lors d'une panne réseau, tous les clients déconnectés interrogent
  // le serveur en même temps, c'est-à-dire précisément au moment où il est le plus sollicité.
  // La progression reprend celle du backoff de reconnexion STOMP, pour que les deux
  // mécanismes ne se désynchronisent pas.
  useEffect(() => {
    if (isConnected) return;

    const DELAYS_MS = [2000, 4000, 8000, 15000];
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout>;

    const poll = () => {
      syncGameState();
      const delay = DELAYS_MS[Math.min(attempt, DELAYS_MS.length - 1)];
      attempt += 1;
      timer = setTimeout(poll, delay);
    };

    timer = setTimeout(poll, DELAYS_MS[0]);
    return () => clearTimeout(timer);
  }, [isConnected, syncGameState]);

  const handlePause = useCallback(async () => {
    if (!session?.id || isPauseToggling) return;
    setIsPauseToggling(true);
    try {
      await pauseSession(session.id);
    } catch (err: any) {
      notifyApiError(err, 'Impossible de mettre en pause');
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
      notifyApiError(err, 'Impossible de reprendre');
    } finally {
      setIsPauseToggling(false);
    }
  }, [session?.id, resumeSession, isPauseToggling]);

  const handleSkip = useCallback(async () => {
    if (!session?.id) return;
    try {
      await gameApi.skipQuestion(session.id);
    } catch (err: any) {
      notifyApiError(err, 'Impossible de passer la question');
    }
  }, [session?.id]);

  const status = session?.status;
  const notStarted = status === 'LOBBY' || status === 'GENERATING' || status === 'CANCELLED';

  if (session && notStarted) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: palette.primary + '26', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={40} color={palette.primary} />
        </View>
        <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 20, paddingTop: 2 }}>Partie non disponible</Text>
        <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', color: palette.inkSoft, textAlign: 'center', fontSize: 14 }}>
          {session.status === 'RESULTS'
            ? 'La partie est terminée.'
            : "La partie n'a pas encore été lancée."}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace(`/session/${code}/lobby` as any)}
          style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 9999, backgroundColor: palette.primary }}
        >
          <Text style={{ fontFamily: font.nativeFamily.display, color: '#FFFFFF', fontSize: 14, paddingTop: 2 }}>Retour au lobby</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: palette.primary + '26', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Zap size={40} color={palette.primary} />
        </View>
        <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 16, paddingTop: 2 }}>Chargement du jeu...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {isWithoutModerator ? (
        <SprintGame
          sessionId={session.id}
          myPlayer={currentPlayer}
          players={players}
          teams={teams}
          isManager={isManager}
          isSpectator={isSpectator}
          isPaused={isPaused}
          isPauseToggling={isPauseToggling}
          handlePause={handlePause}
          handleResume={handleResume}
          handleSkip={handleSkip}
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
    </View>
  );
}
