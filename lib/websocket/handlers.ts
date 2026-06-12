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
        teamId?: string | null;
        teamName?: string | null;
      }> | undefined;

      if (fullQueue) {
        // Full queue sync from STOMP — replace entire buzz queue
        const mappedQueue = fullQueue.map((b) => ({
          playerId: b.playerId,
          playerName: b.playerName,
          timeDiffMs: b.timeDiffMs,
          teamId: b.teamId ?? null,
          teamName: b.teamName ?? null,
        }));
        useGameStore.getState().setBuzzQueue(mappedQueue);
        useBuzzStore.getState().setBuzzQueue(mappedQueue);
      } else {
        // Legacy single-buzz format — add individual entry
        const buzzItem = {
          playerId: event.userId,
          playerName: event.username,
          timeDiffMs: event.timestamp,
          teamId: null,
          teamName: null,
        };
        useGameStore.getState().addToBuzzQueue(buzzItem);
        useBuzzStore.getState().addToBuzzQueue(buzzItem);
      }

      // Mark hasBuzzed — team-aware: also flag if a teammate is in the queue
      if (currentUserId) {
        const buzzState = useBuzzStore.getState();
        const currentQueue = buzzState.buzzQueue;
        // playerId dans buzzQueue = Player entity ID → chercher via userId
        const myPlayer = buzzState.players.find((p) => p.userId === currentUserId);
        const myPlayerId = myPlayer?.id;

        const myBuzz = !!myPlayerId && currentQueue.some((b) => b.playerId === myPlayerId);
        const teamBuzz =
          !myBuzz &&
          buzzState.session?.isTeamMode === true &&
          myPlayer?.teamId != null &&
          currentQueue.some((b) => b.teamId === myPlayer.teamId);

        if (myBuzz || teamBuzz) {
          useGameStore.getState().setHasBuzzed(true);
          useBuzzStore.getState().setHasBuzzed(true);
          const userPosition = currentQueue.findIndex((b) => b.playerId === myPlayerId) + 1;
          if (userPosition > 0) {
            useGameStore.setState({ myQueuePosition: userPosition });
          }
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
        
        // Mark the wrong player as blocked for the rest of this question.
        // This survives buzzer_reset (fullBuzzerReset) which would otherwise
        // clear hasBuzzed and re-enable the button on their UI.
        // Note: event.playerId is a Player entity ID in answer_validated (mode WITH_MODERATOR),
        // so we look up the matching player in the store.
        if (currentUserId && event.playerId) {
          const myPlayer = useBuzzStore.getState().players.find((p) => p.userId === currentUserId);
          if (myPlayer && event.playerId === myPlayer.id) {
            useBuzzStore.getState().setAnsweredWrongThisQuestion(true);
          }
        }
        // Re-enable the buzzer for OTHER players who haven't buzzed yet.
        useGameStore.getState().setBuzzerEnabled(true);
        useBuzzStore.getState().setBuzzerEnabled(true);
      }
      break;

    case 'answer_skipped':
      useGameStore.getState().fullBuzzerReset();
      useBuzzStore.getState().fullBuzzerReset();
      break;

    case 'score_updated': {
      const scoreEvent = event as any;
      // Update score regardless of sub-event type
      if (scoreEvent.scores) {
        useBuzzStore.getState().updateScores(scoreEvent.scores);
      } else if (scoreEvent.playerId && scoreEvent.newScore !== undefined) {
        useBuzzStore.getState().updateScores({ [scoreEvent.playerId]: scoreEvent.newScore });
      }
      // Mode sans modérateur : marquer le joueur comme ayant répondu faux
      // (answer_validated n'est pas envoyé en mode WITHOUT_MODERATOR)
      if (scoreEvent.event === 'WRONG' && currentUserId && scoreEvent.playerId === currentUserId) {
        useBuzzStore.getState().setAnsweredWrongThisQuestion(true);
      }
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

    // ─── Sans Modérateur ─────────────────────
    case 'word_advance': {
      // Discard stale events from a previous question's display scheduler
      const eventQuestionId = (event as any).questionId;
      if (eventQuestionId) {
        const currentId = useBuzzStore.getState().currentQuestion?.id;
        if (currentId && eventQuestionId !== currentId) break;
      }
      useBuzzStore.setState({
        displayWordIndex: event.wordIndex,
        displayRunning: !event.fullyDisplayed,
        ...(event.fullyDisplayed ? { questionFullyDisplayed: true } : {}),
      });
      break;
    }

    case 'question_display_resume': {
      // Reprendre depuis la position courante (displayWordIndex) — ne pas réinitialiser à 0
      useBuzzStore.setState({ displayRunning: true });
      break;
    }

    case 'question_timer': {
      const currentTotal = (useBuzzStore.getState() as any).globalTimerTotal;
      const newTotal = !currentTotal || event.remainingSeconds > currentTotal
        ? event.remainingSeconds
        : currentTotal;

      useBuzzStore.setState({
        globalTimerRemaining: event.remainingSeconds,
        globalTimerPaused: event.paused,
        globalTimerTotal: newTotal,
      });
      break;
    }

    case 'answer_reveal': {
      const isAllWrong = !!(event as any).allAnswersWrong;
      useBuzzStore.setState({
        answerReveal: {
          correctAnswer: event.correctAnswer,
          winnerId: event.winnerId,
          winnerName: event.winnerName,
          allAnswersWrong: isAllWrong,
        },
      });
      // Auto-clear après 4s seulement si pas le cas "tous faux" (celui-ci attend le manager)
      if (!isAllWrong) {
        setTimeout(() => {
          useBuzzStore.setState({ answerReveal: null });
        }, 4000);
      }
      break;
    }

    case 'game_choices': {
      // Calculer le temps restant réel en tenant compte du délai réseau
      const startedAtMs = (event as any).startedAtMs ?? Date.now();
      const networkDelayMs = Date.now() - startedAtMs;
      const actualRemaining = Math.max(3, event.answerTimeSeconds - Math.floor(networkDelayMs / 1000));
      useBuzzStore.setState({
        myAnswerChoices: event.choices,
        myAnswerQuestionId: event.questionId,
        answerTimeSeconds: actualRemaining,
      });
      break;
    }

    // ─── Full state sync ──────────────────────
    case 'game_state_sync': {
      const sync = event;

      // ── Players (only useBuzzStore holds the player list) ──
      if (sync.players?.length > 0) {
        useBuzzStore.setState({ players: sync.players });
      }

      // ── Buzz queue (sync both stores) ──
      const serverQueue = (sync.buzzQueue ?? []).map((b) => ({
        playerId: b.playerId,
        playerName: b.playerName,
        timeDiffMs: b.timeDiffMs,
        teamId: b.teamId ?? null,
        teamName: b.teamName ?? null,
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
        } else {
          // Question is the same, sync displayWordIndex if available
          const serverDisplayWordIndex = (sync as any).displayWordIndex;
          if (serverDisplayWordIndex != null && serverDisplayWordIndex >= 0) {
            const q = sync.currentQuestion;
            const totalWords = q.text ? q.text.split(' ').length : 1;
            const currentLocalWordIndex = useBuzzStore.getState().displayWordIndex;
            const isWithoutMod = (sync.session as any)?.sessionMode === 'WITHOUT_MODERATOR' || useBuzzStore.getState().session?.sessionMode === 'WITHOUT_MODERATOR';
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
        }
      }

      // ── Session status + sessionMode (propagés dans le sync) ──
      if (sync.session?.status) {
        const status = sync.session.status as any;
        useBuzzStore.getState().updateStatus(status);
        const paused = status === 'PAUSED';
        useBuzzStore.getState().setPaused(paused);
        useGameStore.getState().setPaused(paused);
      }

      // Mettre à jour sessionMode si le sync le contient
      const syncSessionMode = (sync.session as any)?.sessionMode;
      if (syncSessionMode) {
        useBuzzStore.setState((state) => ({
          session: state.session ? { ...state.session, sessionMode: syncSessionMode } : state.session,
        }));
      }
      break;
    }
  }
}
