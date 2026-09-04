// BuzzQueueItem, PlayerResponse et SessionStatus ne sont plus référencés depuis le retrait
// de GameStateSyncEvent, seul type qui les utilisait.
import type { Difficulty, QuestionResponse, UserResponse } from './api';

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



export interface BuzzerResetEvent extends BaseWSMessage {
  type: 'buzzer_reset';
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

/**
 * Contrat serveur — `FriendService`, sur `/queue/user/{id}/notifications` :
 * `{ type: 'FRIEND_REQUEST', from: UserResponse }`.
 *
 * Les champs plats `fromUserId` / `fromUsername` / `requestId` déclarés auparavant ne
 * correspondaient à rien de ce que le backend envoie : l'événement n'était donc jamais
 * produit et les branches correspondantes de `handlers.ts` étaient du code mort.
 */
export interface FriendRequestReceivedEvent {
  type: 'friend_request_received';
  sessionId: string | null;
  from: UserResponse;
}

/** Contrat serveur — `FriendService` : `{ type: 'FRIEND_ACCEPTED', from: UserResponse }`. */
export interface FriendRequestAcceptedEvent {
  type: 'friend_request_accepted';
  sessionId: string | null;
  from: UserResponse;
}

/**
 * Contrat serveur — `InvitationService`, sur `/queue/user/{id}/invitations` :
 * `{ id, sessionCode, sessionId, from, expiresAt }`.
 */
export interface SessionInviteReceivedEvent {
  type: 'session_invite_received';
  sessionId: string | null;
  invitationId: string;
  sessionCode: string;
  /** Nom du joueur qui invite (`Player.getName()` côté serveur). */
  from: string;
  expiresAt: string;
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

export interface RoomMemberPresenceEvent {
  type: 'room_member_presence';
  roomId: string;
  userId: string;
  username: string;
  isOnline: boolean;
}

// ──────────────────────────────────────────────
// Team Events
// ──────────────────────────────────────────────

export interface TeamUpdatedEvent extends BaseWSMessage {
  type: 'team_updated';
  teams: import('./api').TeamResponse[];
}

// TeamScoresEvent retiré : le backend a supprimé /topic/session/{id}/team-scores lors de
// la refonte du canal d'état, et aucune méthode ne publiait plus dessus. Les scores
// d'équipe devront revenir par le paquet d'état versionné, seule source de vérité du jeu.

// GameStateSyncEvent retiré avec le canal /topic/session/{id}/sync.
//
// Le serveur y republiait un instantané complet toutes les 10 à 30 secondes pour chaque
// session active, mais le client ne s'y était jamais abonné : la charge en base était
// payée pour un message que personne ne lisait. La resynchronisation passe par le
// GameStatePacket versionné (`game_state_packet`), qui porte un numéro de version et
// permet donc de rejeter un instantané périmé — ce qu'un second canal ne savait pas faire.

// ──────────────────────────────────────────────
// Sans Modérateur Events
// ──────────────────────────────────────────────

export interface QuestionDisplayResumeEvent extends BaseWSMessage {
  type: 'question_display_resume';
  wordIndex: number;
}



/**
 * Snapshot versionné du mode sans modérateur.
 * Topic: /topic/session/{id}/state
 *
 * Seul message porteur d'état de jeu dans ce mode. Le payload n'est pas
 * remodelé au passage : il est transmis tel quel à `applyStatePacket`, qui
 * applique la garde de version.
 */
export interface GameStatePacketEvent extends BaseWSMessage {
  type: 'game_state_packet';
  packet: import('~/lib/game/packet').GameStatePacket;
}



export interface WordAdvanceEvent extends BaseWSMessage {
  type: 'word_advance';
  wordIndex: number;
  fullyDisplayed: boolean;
}

// ──────────────────────────────────────────────
// Événements internes au transport
// ──────────────────────────────────────────────
//
// Ils ne viennent pas du backend : c'est le WebSocketManager qui les fabrique pour signaler
// l'état de la liaison. Ils étaient jusqu'ici émis en `as any`, donc invisibles du typage —
// un `switch` exhaustif ne pouvait pas les couvrir et une faute de frappe passait inaperçue.
// Le préfixe `_` marque leur nature locale.

/** La liaison STOMP vient de s'ouvrir ou de se fermer. */
export interface ConnectionChangeEvent {
  type: '_connection_change';
  connected: boolean;
}

/** Reconnexion après une coupure : l'écran doit resynchroniser son état auprès du serveur. */
export interface ReconnectedEvent {
  type: '_reconnected';
}

/**
 * Le serveur a refusé la connexion pour une raison d'authentification.
 *
 * Émis quand la frame STOMP ERROR mentionne 401 / Unauthorized. Le manager cesse alors de
 * se reconnecter : sans cet événement, l'interface resterait figée sans explication, ce qui
 * est précisément ce qui arrivait avant le durcissement du CONNECT côté serveur.
 */
export interface AuthErrorEvent {
  type: '_auth_error';
  reason?: string;
}

/** Le backend a clos la session : inutile de se reconnecter, il faut sortir de l'écran. */
export interface SessionClosedEvent {
  type: '_session_closed';
}

/**
 * Décompte avant le démarrage de la partie.
 *
 * Contrat serveur — `WebSocketNotificationService.sendCountdown` :
 * `{ count: n }` à chaque seconde, puis `{ count: 0, event: 'START' }` au démarrage.
 * `event` n'est donc présent que sur la dernière émission.
 */
export interface CountdownEvent {
  type: 'countdown';
  sessionId: string;
  count: number;
  event?: 'START';
}

// ──────────────────────────────────────────────
// Union Type
// ──────────────────────────────────────────────

export type WSEvent =
  // Transport (locaux, jamais émis par le backend)
  | ConnectionChangeEvent
  | ReconnectedEvent
  | AuthErrorEvent
  | SessionClosedEvent
  // Décompte
  | CountdownEvent
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
  | BuzzerResetEvent
  | AnswerValidatedEvent
  | AnswerSkippedEvent
  | ScoreUpdatedEvent
  | GamePausedEvent
  | GameResumedEvent
  // Teams
  | TeamUpdatedEvent
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
  | RoomMemberPresenceEvent
  // Sans Modérateur
  | QuestionDisplayResumeEvent
  | WordAdvanceEvent
  | GameStatePacketEvent;
