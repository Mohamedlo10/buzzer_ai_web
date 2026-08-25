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
    // ─── Canal d'état autoritaire (sans modérateur) ───
    case 'game_state_packet': {
      useBuzzStore.getState().applyStatePacket((event as any).packet);
      break;
    }

    // ─── Lobby ────────────────────────────────
    case 'player_joined': {
      const player: PlayerResponse = {
        id: event.player.userId,
        userId: event.player.userId,
        name: event.player.username,
        avatarUrl: event.player.avatarUrl ?? null,
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

    case 'team_scores': {
      // Server-pushed team score update — merge scores into existing teams
      const updatedTeams: Array<{ id: string; score: number }> = (event as any).teams ?? [];
      useBuzzStore.setState((state) => ({
        teams: state.teams.map((t) => {
          const update = updatedTeams.find((u) => u.id === t.id);
          return update ? { ...t, score: update.score } : t;
        }),
      }));
      break;
    }

    case 'game_starting':
      useBuzzStore.getState().updateStatus('GENERATING');
      break;

    // ─── AI Generation ────────────────────────
    case 'generation_progress':
      break;

    case 'generation_complete':
      useGameStore.getState().setPaused(false);
      useBuzzStore.getState().setPaused(false);
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

    case 'room_invite_received':
      // Toast/notification will be shown by the notification bell in the header
      // The notifications page fetches fresh data when opened
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
  }
}
