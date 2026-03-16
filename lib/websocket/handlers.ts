import type { WSEvent } from '~/types/websocket';
import type { PlayerResponse } from '~/types/api';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { useGameStore } from '~/stores/useGameStore';
import { useFriendStore } from '~/stores/useFriendStore';

/**
 * Central dispatcher that routes incoming WebSocket events
 * to the correct Zustand store actions.
 */
export function handleWSEvent(event: WSEvent, currentUserId?: string): void {
  switch (event.type) {
    // ─── Lobby ────────────────────────────────
    case 'player_joined': {
      const player: PlayerResponse = {
        id: event.player.userId,
        userId: event.player.userId,
        name: event.player.username,
        score: 0,
        isManager: false,
        isSpectator: event.player.isSpectator,
        teamId: null,
        selectedCategories: [],
        categoryScores: {},
      };
      useBuzzStore.getState().addPlayer(player);
      break;
    }

    case 'player_left':
      useBuzzStore.getState().removePlayer(event.userId);
      break;

    case 'category_selected':
      break;

    case 'team_updated':
      useBuzzStore.getState().setTeams((event as any).teams ?? []);
      break;

    case 'game_starting':
      useBuzzStore.getState().updateStatus('GENERATING');
      break;

    // ─── AI Generation ────────────────────────
    case 'generation_progress':
      break;

    case 'generation_complete':
      useBuzzStore.getState().updateStatus('PLAYING');
      break;

    case 'generation_failed':
      if (!event.usingFallback) {
        useBuzzStore.getState().updateStatus('LOBBY');
      }
      break;

    // ─── Gameplay ─────────────────────────────
    case 'question_start': {
      // orderIndex is always provided by the backend (including MANUAL mode).
      const qIndex = event.question.orderIndex ?? useBuzzStore.getState().questionIndex;
      // Ensure session status is PLAYING — needed for MANUAL mode where no
      // generation_complete event is sent and the lobby waits on this to navigate.
      useBuzzStore.getState().updateStatus('PLAYING');
      // Update BOTH stores — game.tsx reads from useBuzzStore
      useGameStore.getState().setCurrentQuestion(
        event.question,
        qIndex,
        0, // total will be updated from session state
      );
      useBuzzStore.getState().setCurrentQuestion(
        event.question,
        qIndex,
        useBuzzStore.getState().totalQuestions || 0,
      );
      break;
    }

    case 'buzzer_pressed': {
      // STOMP sends the full queue via _fullQueue; sync the entire queue
      const fullQueue = (event as any)._fullQueue as Array<{
        playerId: string;
        playerName: string;
        timeDiffMs: number;
      }> | undefined;

      if (fullQueue) {
        // Full queue sync from STOMP — replace entire buzz queue
        const mappedQueue = fullQueue.map((b) => ({
          playerId: b.playerId,
          playerName: b.playerName,
          timeDiffMs: b.timeDiffMs,
        }));
        useGameStore.getState().setBuzzQueue(mappedQueue);
        useBuzzStore.getState().setBuzzQueue(mappedQueue);
      } else {
        // Legacy single-buzz format — add individual entry
        const buzzItem = {
          playerId: event.userId,
          playerName: event.username,
          timeDiffMs: event.timestamp,
        };
        useGameStore.getState().addToBuzzQueue(buzzItem);
        useBuzzStore.getState().addToBuzzQueue(buzzItem);
      }
      
      // If current user buzzed, mark hasBuzzed in both stores
      if (currentUserId && event.userId === currentUserId) {
        const currentQueue = useGameStore.getState().buzzQueue;
        const userPosition = currentQueue.findIndex(b => b.playerId === currentUserId) + 1;
        useGameStore.getState().setHasBuzzed(true);
        useBuzzStore.getState().setHasBuzzed(true);
        
        if (userPosition > 0) {
          useGameStore.setState({ myQueuePosition: userPosition });
        }
      }
      break;
    }

    case 'buzzer_reset':
      useGameStore.getState().fullBuzzerReset();
      useBuzzStore.getState().fullBuzzerReset();
      break;

    case 'answer_validated':
      // Handle both formats:
      // - Typed: { updatedScores: Record<string, number> }
      // - Backend actual: { playerId, newScore }
      if (event.updatedScores) {
        useBuzzStore.getState().updateScores(event.updatedScores);
      } else if (event.playerId && (event as any).newScore !== undefined) {
        useBuzzStore.getState().updateScores({ [event.playerId]: (event as any).newScore });
      }
      // Correct answer → clear buzz queue in BOTH stores
      // Wrong answer → remove player from queue in BOTH stores
      if (event.isCorrect) {
        useGameStore.getState().clearBuzzQueue();
        useBuzzStore.getState().clearBuzzQueue();
      } else {
        // Remove the player who answered wrong from the queue in BOTH stores
        const newQueue = useGameStore.getState().buzzQueue.filter((b) => b.playerId !== event.playerId);
        useGameStore.getState().setBuzzQueue(newQueue);
        useBuzzStore.getState().setBuzzQueue(newQueue);
        
        // Reset hasBuzzed so the wrong player can buzz again
        if (currentUserId && event.playerId === currentUserId) {
          useGameStore.getState().setHasBuzzed(false);
          useBuzzStore.getState().setHasBuzzed(false);
        }
        
        // Keep buzzer enabled in both stores
        useGameStore.getState().setBuzzerEnabled(true);
        useBuzzStore.getState().setBuzzerEnabled(true);
      }
      break;

    case 'answer_skipped':
      useGameStore.getState().fullBuzzerReset();
      useBuzzStore.getState().fullBuzzerReset();
      break;

    case 'score_updated':
      // Handle both formats:
      // - Typed: { scores: Record<string, number> }
      // - Backend actual: { playerId, newScore }
      if (event.scores) {
        useBuzzStore.getState().updateScores(event.scores);
      } else if ((event as any).playerId && (event as any).newScore !== undefined) {
        useBuzzStore.getState().updateScores({ [(event as any).playerId]: (event as any).newScore });
      }
      break;

    case 'game_paused':
      useGameStore.getState().setPaused(true);
      useBuzzStore.getState().setPaused(true);
      useBuzzStore.getState().updateStatus('PAUSED');
      break;

    case 'game_resumed':
      useGameStore.getState().setPaused(false);
      useBuzzStore.getState().setPaused(false);
      useBuzzStore.getState().updateStatus('PLAYING');
      break;

    // ─── End Game ─────────────────────────────
    case 'game_over':
      useGameStore.getState().setGameOver(true);
      useBuzzStore.getState().setGameOver(true);
      // Handle both formats:
      // - Typed: { finalScores: Record<string, number> }
      // - Backend actual: { rankings: [{player: {id, name}, score, ...}] }
      if (event.finalScores) {
        useBuzzStore.getState().updateScores(event.finalScores);
      } else if ((event as any).rankings) {
        const scores: Record<string, number> = {};
        for (const entry of (event as any).rankings) {
          const id = entry.player?.id || entry.playerId;
          if (id) scores[id] = entry.finalScore ?? entry.score ?? 0;
        }
        useBuzzStore.getState().updateScores(scores);
      }
      useBuzzStore.getState().updateStatus('RESULTS');
      break;

    case 'debts_calculated':
      break;

    // ─── Friends / Notifications ──────────────
    case 'friend_request_received':
      // Refresh pending requests from server to get proper FriendRequestResponse shape
      useFriendStore.getState().fetchPendingRequests();
      break;

    case 'friend_request_accepted':
      useFriendStore.getState().fetchFriends();
      break;

    case 'session_invite_received':
      break;

    case 'player_online':
      useFriendStore.getState().setFriendOnline(event.userId);
      break;

    case 'player_offline':
      useFriendStore.getState().setFriendOffline(event.userId);
      break;

    // ─── Room Events ──────────────────────────
    case 'room_session_started':
      break;

    case 'room_stats_updated':
      break;

    // ─── Full state sync ──────────────────────
    case 'game_state_sync': {
      const sync = event;

      // ── Players (only useBuzzStore holds the player list) ──
      if (sync.players?.length > 0) {
        console.log('[WS sync] players categoryScores:', JSON.stringify(
          sync.players.map((p: any) => ({ name: p.name, categoryScores: p.categoryScores })),
          null, 2
        ));
        useBuzzStore.setState({ players: sync.players });
      }

      // ── Buzz queue (sync both stores) ──
      const serverQueue = (sync.buzzQueue ?? []).map((b) => ({
        playerId: b.playerId,
        playerName: b.playerName,
        timeDiffMs: b.timeDiffMs,
      }));
      useBuzzStore.getState().setBuzzQueue(serverQueue);
      useGameStore.getState().setBuzzQueue(serverQueue);

      // ── Current question (only update if question changed) ──
      if (sync.currentQuestion) {
        const currentId = useBuzzStore.getState().currentQuestion?.id;
        if (currentId !== sync.currentQuestion.id) {
          const idx = sync.session?.currentQuestionIndex ?? 0;
          const total = sync.session?.totalQuestions ?? useBuzzStore.getState().totalQuestions;
          useBuzzStore.getState().setCurrentQuestion(sync.currentQuestion, idx, total);
          useGameStore.getState().setCurrentQuestion(sync.currentQuestion, idx, total);
        }
      }

      // ── Session status ──
      if (sync.session?.status) {
        const status = sync.session.status as any;
        useBuzzStore.getState().updateStatus(status);
        const paused = status === 'PAUSED';
        useBuzzStore.getState().setPaused(paused);
        useGameStore.getState().setPaused(paused);
      }
      break;
    }
  }
}
