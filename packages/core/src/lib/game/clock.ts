import { apiClient } from '../api/client';

/**
 * Synchronisation d'horloge avec le serveur.
 *
 * Le classement des buzz repose sur l'instant d'appui annoncé par le client.
 * Tant que cet instant venait d'un `Date.now()` brut, un joueur dont l'horloge
 * système retardait de quelques secondes gagnait systématiquement tous les
 * duels — et l'ordre de la file pouvait changer rétroactivement quand un buzz
 * au timestamp plus petit arrivait après coup.
 *
 * On mesure donc l'écart entre les deux horloges sur plusieurs allers-retours
 * et on ne transmet que des instants exprimés dans le référentiel serveur. Le
 * serveur les borne ensuite au physiquement possible.
 */

const SAMPLE_COUNT = 5;
/** Au-delà, l'échantillon est trop bruité pour estimer l'offset. */
const MAX_USABLE_RTT_MS = 2000;

let clockOffsetMs = 0;
let synced = false;
let inFlight: Promise<void> | null = null;

interface Sample {
  offsetMs: number;
  rttMs: number;
}

async function takeSample(): Promise<Sample | null> {
  const sentAt = Date.now();
  try {
    const res = await apiClient.get<{ serverEpochMs: number }>('/api/games/time');
    const receivedAt = Date.now();
    const rttMs = receivedAt - sentAt;
    if (rttMs > MAX_USABLE_RTT_MS) return null;
    // On suppose l'aller et le retour symétriques : l'instant serveur observé
    // correspond au milieu de l'aller-retour côté client.
    const clientMidpoint = sentAt + rttMs / 2;
    return { offsetMs: res.data.serverEpochMs - clientMidpoint, rttMs };
  } catch {
    return null;
  }
}

/**
 * Mesure l'offset. Idempotent : les appels concurrents partagent la même
 * mesure, et une session déjà synchronisée ne re-mesure pas.
 */
export async function syncClock(force = false): Promise<void> {
  if (synced && !force) return;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const samples: Sample[] = [];
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const sample = await takeSample();
      if (sample) samples.push(sample);
    }

    if (samples.length > 0) {
      // Médiane plutôt que moyenne : un seul aller-retour ralenti par un pic
      // réseau fausserait la moyenne, pas la médiane.
      const offsets = samples.map((s) => s.offsetMs).sort((a, b) => a - b);
      clockOffsetMs = offsets[Math.floor(offsets.length / 2)];
      synced = true;
    }
    inFlight = null;
  })();

  return inFlight;
}

/** Instant courant exprimé dans le référentiel serveur. */
export function serverNow(): number {
  return Date.now() + clockOffsetMs;
}

/**
 * Recale l'offset à partir de l'ancre portée par chaque state packet.
 *
 * Gratuit — le champ arrive de toute façon — et corrige la dérive d'horloge sur
 * une longue partie sans nouvel aller-retour. On ignore l'écart s'il est
 * absurde : le paquet a pu attendre dans une file réseau, auquel cas
 * `serverNowEpochMs` est déjà périmé à la réception.
 */
export function observeServerTime(serverNowEpochMs: number): void {
  if (!serverNowEpochMs) return;
  const observedOffset = serverNowEpochMs - Date.now();
  if (!synced) {
    clockOffsetMs = observedOffset;
    synced = true;
    return;
  }
  // Correction douce : le paquet a subi une latence inconnue, on ne s'en sert
  // que pour rattraper une dérive lente, jamais pour un saut brutal.
  const drift = observedOffset - clockOffsetMs;
  if (Math.abs(drift) < 5000) {
    clockOffsetMs += drift * 0.1;
  }
}

/** Millisecondes restantes avant une échéance serveur absolue. */
export function msUntil(deadlineEpochMs: number | null | undefined): number {
  if (!deadlineEpochMs) return 0;
  return Math.max(0, deadlineEpochMs - serverNow());
}

export function resetClock(): void {
  clockOffsetMs = 0;
  synced = false;
  inFlight = null;
}
