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
  | 'READING'
  | 'BUZZ_WINDOW'
  | 'ANSWERING'
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
  questionId: string;
  questionIndex: number;
  totalQuestions: number;
  revealedWordCount: number;
  serverNowEpochMs: number;
  phaseEndsAtEpochMs: number | null;
  queue: QueueEntry[];
  answeringPlayerId: string | null;
  scores: Record<string, number>;
  reveal: PacketReveal | null;
}

/** Projection du paquet dans le store. */
export interface GameStateSlice {
  stateVersion: number;
  phase: GamePhase;
  packetQuestionId: string | null;
  buzzQueue: QueueEntry[];
  answeringPlayerId: string | null;
  phaseEndsAtEpochMs: number | null;
  reveal: PacketReveal | null;
}

export const initialGameStateSlice: GameStateSlice = {
  // 0 et non -1 : le serveur alloue des versions à partir de 1, donc le premier
  // paquet reçu est toujours strictement supérieur.
  stateVersion: 0,
  phase: 'READING',
  packetQuestionId: null,
  buzzQueue: [],
  answeringPlayerId: null,
  phaseEndsAtEpochMs: null,
  reveal: null,
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
    packetQuestionId: packet.questionId ?? null,
    buzzQueue: normalizeQueue(packet.queue),
    answeringPlayerId: packet.answeringPlayerId ?? null,
    phaseEndsAtEpochMs: packet.phaseEndsAtEpochMs ?? null,
    reveal: packet.reveal ?? null,
  };
}

function normalizeQueue(queue: QueueEntry[] | null | undefined): QueueEntry[] {
  if (!Array.isArray(queue)) return [];
  // Le serveur envoie déjà la file triée par position figée. On retrie par
  // sécurité, mais jamais sur un timestamp : c'est ce recalcul côté lecture qui
  // faisait changer la tête de file après coup.
  return [...queue].sort((a, b) => a.position - b.position);
}

/** Le joueur a-t-il la main pour répondre ? Autorité : le serveur, pas `queue[0]`. */
export function isAnswering(slice: GameStateSlice, myPlayerId: string | undefined): boolean {
  return (
    slice.phase === 'ANSWERING' &&
    !!myPlayerId &&
    slice.answeringPlayerId === myPlayerId
  );
}

/** Position dans la file (1-based), ou null si absent. */
export function queuePositionOf(slice: GameStateSlice, myPlayerId: string | undefined): number | null {
  if (!myPlayerId) return null;
  const index = slice.buzzQueue.findIndex((b) => b.playerId === myPlayerId);
  return index >= 0 ? index + 1 : null;
}

/** Le buzzer est-il ouvert ? Vrai uniquement quand le serveur accepte les buzz. */
export function isBuzzerOpen(slice: GameStateSlice): boolean {
  return slice.phase === 'READING' || slice.phase === 'BUZZ_WINDOW';
}
