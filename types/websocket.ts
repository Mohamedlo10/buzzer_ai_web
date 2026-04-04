import type { BuzzQueueItem, Difficulty, PlayerResponse, QuestionResponse, SessionStatus } from './api';

// ──────────────────────────────────────────────
// Base WebSocket Message
// ──────────────────────────────────────────────

export interface BaseWSMessage {
  type: string;
  sessionId: string;
}

// ──────────────────────────────────────────────
// Lobby Events
// ──────────────────────────────────────────────

export interface PlayerJoinedEvent extends BaseWSMessage {
  type: 'player_joined';
  player: {
    userId: string;
    username: string;
    avatarUrl?: string | null;
    categories: Array<{ name: string; difficulty: Difficulty; isCustom: boolean }>;
    isSpectator: boolean;
  };
}

export interface PlayerLeftEvent extends BaseWSMessage {
  type: 'player_left';
  userId: string;
}

export interface CategorySelectedEvent extends BaseWSMessage {
  type: 'category_selected';
  userId: string;
  categories: Array<{ name: string; difficulty: Difficulty; isCustom: boolean }>;
}

export interface GameStartingEvent extends BaseWSMessage {
  type: 'game_starting';
}

// ──────────────────────────────────────────────
// AI Generation Events
// ──────────────────────────────────────────────

export interface GenerationProgressEvent extends BaseWSMessage {
  type: 'generation_progress';
  current: number;
  total: number;
  percentage: number;
}

export interface GenerationCompleteEvent extends BaseWSMessage {
  type: 'generation_complete';
  totalQuestions: number;
}

export interface GenerationFailedEvent extends BaseWSMessage {
  type: 'generation_failed';
  error: string;
  usingFallback: boolean;
}

// ──────────────────────────────────────────────
// Gameplay Events
// ──────────────────────────────────────────────

export interface QuestionStartEvent extends BaseWSMessage {
  type: 'question_start';
  question: QuestionResponse;
}

export interface BuzzerPressedEvent extends BaseWSMessage {
  type: 'buzzer_pressed';
  userId: string;
  username: string;
  timestamp: number;
  queuePosition: number;
}

export interface BuzzerResetEvent extends BaseWSMessage {
  type: 'buzzer_reset';
}

export interface BuzzCountdownEvent extends BaseWSMessage {
  type: 'buzz_countdown';
  playerId: string;
  playerName: string;
  durationSeconds: number;
}

export interface AnswerValidatedEvent extends BaseWSMessage {
  type: 'answer_validated';
  playerId: string;
  isCorrect: boolean;
  updatedScores: Record<string, number>;
  nextQuestionIndex?: number;
}

export interface AnswerSkippedEvent extends BaseWSMessage {
  type: 'answer_skipped';
  nextQuestionIndex?: number;
}

export interface ScoreUpdatedEvent extends BaseWSMessage {
  type: 'score_updated';
  scores?: Record<string, number>;
  reason?: 'validation' | 'correction';
  // Score topic format
  playerId?: string;
  newScore?: number;
  event?: 'CORRECT' | 'WRONG' | 'RUBRIQUE_BEATEN';
  debtAmount?: number;
}

export interface GamePausedEvent extends BaseWSMessage {
  type: 'game_paused';
}

export interface GameResumedEvent extends BaseWSMessage {
  type: 'game_resumed';
}

// ──────────────────────────────────────────────
// End Game Events
// ──────────────────────────────────────────────

export interface GameOverEvent extends BaseWSMessage {
  type: 'game_over';
  finalScores: Record<string, number>;
}

export interface DebtsCalculatedEvent extends BaseWSMessage {
  type: 'debts_calculated';
  debts: Array<{
    fromUserId: string;
    fromUsername: string;
    toUserId: string;
    toUsername: string;
    category: string;
    amount: number;
  }>;
}

// ──────────────────────────────────────────────
// Friend / Notification Events
// ──────────────────────────────────────────────

export interface FriendRequestReceivedEvent {
  type: 'friend_request_received';
  fromUserId: string;
  fromUsername: string;
  requestId: string;
}

export interface FriendRequestAcceptedEvent {
  type: 'friend_request_accepted';
  userId: string;
  username: string;
}

export interface SessionInviteReceivedEvent {
  type: 'session_invite_received';
  invitationId: string;
  sessionCode: string;
  senderName: string;
}

export interface PlayerOnlineEvent {
  type: 'player_online';
  userId: string;
}

export interface PlayerOfflineEvent {
  type: 'player_offline';
  userId: string;
}

// ──────────────────────────────────────────────
// Room Events
// ──────────────────────────────────────────────

export interface RoomInviteReceivedEvent {
  type: 'room_invite_received';
  invitationId: string;
  roomId: string;
  roomName: string;
  roomCode: string;
  from: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

export interface RoomSessionStartedEvent {
  type: 'room_session_started';
  roomId: string;
  sessionId: string;
  sessionCode: string;
}

export interface RoomStatsUpdatedEvent {
  type: 'room_stats_updated';
  roomId: string;
}

// ──────────────────────────────────────────────
// Team Events
// ──────────────────────────────────────────────

export interface TeamUpdatedEvent extends BaseWSMessage {
  type: 'team_updated';
  teams: import('./api').TeamResponse[];
}

export interface TeamScoresEvent extends BaseWSMessage {
  type: 'team_scores';
  teams: Array<{
    id: string;
    name: string;
    color: string;
    score: number;
    memberIds: string[];
  }>;
}

// ──────────────────────────────────────────────
// State Sync Event (server-push snapshot)
// ──────────────────────────────────────────────

/**
 * Periodic full-state snapshot pushed by the server every ~10s.
 * Topic: /topic/session/{id}/sync
 * Replaces polling entirely — front syncs stores from this.
 */
export interface GameStateSyncEvent extends BaseWSMessage {
  type: 'game_state_sync';
  session: {
    status: string;
    currentQuestionIndex: number;
    totalQuestions: number;
  };
  currentQuestion: import('./api').QuestionResponse | null;
  players: import('./api').PlayerResponse[];
  buzzQueue: import('./api').BuzzQueueItem[];
}

// ──────────────────────────────────────────────
// Union Type
// ──────────────────────────────────────────────

export type WSEvent =
  // Lobby
  | PlayerJoinedEvent
  | PlayerLeftEvent
  | CategorySelectedEvent
  | GameStartingEvent
  // Generation
  | GenerationProgressEvent
  | GenerationCompleteEvent
  | GenerationFailedEvent
  // Gameplay
  | QuestionStartEvent
  | BuzzerPressedEvent
  | BuzzerResetEvent
  | BuzzCountdownEvent
  | AnswerValidatedEvent
  | AnswerSkippedEvent
  | ScoreUpdatedEvent
  | GamePausedEvent
  | GameResumedEvent
  // Teams
  | TeamUpdatedEvent
  | TeamScoresEvent
  // End
  | GameOverEvent
  | DebtsCalculatedEvent
  // Friends
  | FriendRequestReceivedEvent
  | FriendRequestAcceptedEvent
  | SessionInviteReceivedEvent
  | PlayerOnlineEvent
  | PlayerOfflineEvent
  // Rooms
  | RoomInviteReceivedEvent
  | RoomSessionStartedEvent
  | RoomStatsUpdatedEvent
  // Sync
  | GameStateSyncEvent;
