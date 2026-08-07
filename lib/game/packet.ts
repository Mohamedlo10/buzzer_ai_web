import { observeServerTime } from './clock';

/**
 * Le state packet du mode sans modérateur, et son unique point d'application.
 *
 * Auparavant l'état de jeu était écrit par trois sources concurrentes — les
 * topics WebSocket (dont certains émis en `@Async`, donc sans ordre garanti
 * entre eux), le poll REST toutes les 3 s, et le scheduler de sync toutes les
 * 10 s — aucune ne sachant si elle était plus fraîche que les autres. Une
 * réponse REST partie il y a 2,8 s pouvait écraser une file reçue à l'instant.
 *
 * Désormais tout passe par {@link applyPacket}, et la règle tient en une
 * ligne : on ignore ce qui est déjà appliqué.
 */

export type GamePhase =
  | 'COUNTDOWN'
  | 'QUESTION'
  | 'READING'
  | 'BUZZ_WINDOW'
  | 'AWAITING_VALIDATION'
  | 'REVEAL'
  | 'ADVANCING'
  | 'FINISHED';

export interface QueueEntry {
  playerId: string;
  playerName: string;
  position: number;
  deltaMs: number;
  teamId: string | null;
  teamName: string | null;
}

export interface PacketReveal {
  correctAnswer: string;
  winnerId: string | null;
  winnerName: string | null;
  allAnswersWrong: boolean;
}

export interface GameStatePacket {
  version: number;
  phase: GamePhase;
  sessionId: string;
  sessionMode: 'WITH_MODERATOR' | 'WITHOUT_MODERATOR';
  questionId: string;
  questionIndex: number;
  totalQuestions: number;
  revealedWordCount: number;
  totalWordCount: number;
  wordRevealStartedAtEpochMs: number | null;
  wordRevealIntervalMs: number;
  serverNowEpochMs: number;
  phaseEndsAtEpochMs: number | null;
  queue: QueueEntry[];
  answeringPlayerId: string | null;
  scores: Record<string, number>;
  reveal: PacketReveal | null;
  choices: string[] | null;
  answeredCount: number | null;
  expectedAnswerCount: number | null;
}

/** Projection du paquet dans le store. */
export interface GameStateSlice {
  stateVersion: number;
  phase: GamePhase;
  sessionMode: 'WITH_MODERATOR' | 'WITHOUT_MODERATOR';
  packetQuestionId: string | null;
  buzzQueue: QueueEntry[];
  answeringPlayerId: string | null;
  phaseEndsAtEpochMs: number | null;
  revealedWordCount: number;
  totalWordCount: number;
  wordRevealStartedAtEpochMs: number | null;
  wordRevealIntervalMs: number;
  reveal: PacketReveal | null;
  choices: string[] | null;
  answeredCount: number | null;
  expectedAnswerCount: number | null;
}

export const initialGameStateSlice: GameStateSlice = {
  // 0 et non -1 : le serveur alloue des versions à partir de 1, donc le premier
  // paquet reçu est toujours strictement supérieur.
  stateVersion: 0,
  phase: 'READING',
  sessionMode: 'WITH_MODERATOR',
  packetQuestionId: null,
  buzzQueue: [],
  answeringPlayerId: null,
  phaseEndsAtEpochMs: null,
  revealedWordCount: 0,
  totalWordCount: 0,
  wordRevealStartedAtEpochMs: null,
  wordRevealIntervalMs: 600,
  reveal: null,
  choices: null,
  answeredCount: null,
  expectedAnswerCount: null,
};

/**
 * Applique un paquet s'il est plus récent que l'état courant.
 *
 * @returns la nouvelle tranche d'état, ou `null` si le paquet est périmé ou
 *          dupliqué — auquel cas l'appelant ne doit rien écrire.
 */
export function applyPacket(
  current: Pick<GameStateSlice, 'stateVersion'>,
  packet: GameStatePacket | null | undefined,
): GameStateSlice | null {
  if (!packet || typeof packet.version !== 'number') return null;
  if (packet.version <= current.stateVersion) return null;

  // Ancre d'horloge : gratuite, elle arrive avec chaque paquet.
  observeServerTime(packet.serverNowEpochMs);

  return {
    stateVersion: packet.version,
    phase: packet.phase,
    sessionMode: packet.sessionMode,
    packetQuestionId: packet.questionId ?? null,
    buzzQueue: normalizeQueue(packet.queue),
    answeringPlayerId: packet.answeringPlayerId ?? null,
    phaseEndsAtEpochMs: packet.phaseEndsAtEpochMs ?? null,
    revealedWordCount: packet.revealedWordCount ?? 0,
    totalWordCount: packet.totalWordCount ?? 0,
    wordRevealStartedAtEpochMs: packet.wordRevealStartedAtEpochMs ?? null,
    wordRevealIntervalMs: packet.wordRevealIntervalMs ?? 600,
    reveal: packet.reveal ?? null,
    choices: packet.choices ?? null,
    answeredCount: packet.answeredCount ?? null,
    expectedAnswerCount: packet.expectedAnswerCount ?? null,
  };
}

function normalizeQueue(queue: QueueEntry[] | null | undefined): QueueEntry[] {
  if (!Array.isArray(queue)) return [];
  // Le serveur envoie déjà la file triée par position figée. On retrie par
  // sécurité, mais jamais sur un timestamp : c'est ce recalcul côté lecture qui
  // faisait changer la tête de file après coup.
  return [...queue].sort((a, b) => a.position - b.position);
}

/** En mode Sprint, le joueur peut-il soumettre une réponse ? */
export function canAnswer(slice: GameStateSlice, myChoice: string | null): boolean {
  return slice.phase === 'QUESTION' && myChoice === null;
}

/** Le buzzer est-il ouvert ? (Concerne uniquement le mode avec modérateur) */
export function isBuzzerOpen(slice: GameStateSlice): boolean {
  return slice.phase === 'READING' || slice.phase === 'BUZZ_WINDOW';
}

/** Retourne la position (0-indexed) du joueur dans la file d'attente, ou null. */
export function queuePositionOf(slice: GameStateSlice, playerId: string | undefined | null): number | null {
  if (!playerId) return null;
  const idx = slice.buzzQueue.findIndex((q) => q.playerId === playerId);
  return idx >= 0 ? idx : null;
}

/** Le joueur passé en paramètre est-il en train de répondre ? */
export function isAnswering(slice: GameStateSlice, playerId: string | undefined | null): boolean {
  if (!playerId) return false;
  return slice.phase === 'AWAITING_VALIDATION' && slice.answeringPlayerId === playerId;
}
