import { create } from 'zustand';
import type {
  TrainingSessionResponse,
  TrainingResultResponse,
  TrainingDifficulty,
  TrainingSessionSummary,
} from '~/types/training';
import * as trainingApi from '~/lib/api/training';

/**
 * Store dédié au mode Entraînement v2.
 *
 * Le store ne contient AUCUNE logique métier — il se contente de :
 * 1. Appeler les endpoints backend
 * 2. Stocker l'état reçu du backend
 * 3. Exposer cet état au frontend pour le rendu
 *
 * Toute la logique (progression, validation, scoring, faiblesses)
 * est calculée par le backend.
 */
interface TrainingState {
  // ── Session state (mirrored from backend) ──
  session: TrainingSessionResponse | null;
  result: TrainingResultResponse | null;
  userSessions: TrainingSessionSummary[];

  // ── UI state ──
  isCreating: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  isAdvancing: boolean;
  error: string | null;

  // ── Actions ──
  createSession: (subject: string, difficulty: TrainingDifficulty, durationMinutes: number) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  loadUserSessions: () => Promise<void>;
  advance: () => Promise<void>;
  submitAnswer: (answer: string, timeSpentMs?: number) => Promise<void>;
  loadResult: () => Promise<void>;
  startRemediation: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  session: null,
  result: null,
  userSessions: [] as TrainingSessionSummary[],
  isCreating: false,
  isLoading: false,
  isSubmitting: false,
  isAdvancing: false,
  error: null,
};

export const useTrainingStore = create<TrainingState>((set, get) => ({
  ...initialState,

  createSession: async (subject, difficulty, durationMinutes) => {
    set({ isCreating: true, error: null, result: null });
    try {
      const session = await trainingApi.createSession(subject, difficulty, durationMinutes);
      set({ session, isCreating: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Erreur lors de la création de la session',
        isCreating: false,
      });
      throw err;
    }
  },

  loadSession: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const session = await trainingApi.getSession(sessionId);
      set({ session, isLoading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Erreur de chargement de la session',
        isLoading: false,
      });
      throw err;
    }
  },

  loadUserSessions: async () => {
    try {
      const userSessions = await trainingApi.listSessions();
      set({ userSessions });
    } catch (err: any) {
      console.warn('Failed to load user training sessions', err);
    }
  },

  advance: async () => {
    const { session } = get();
    if (!session) return;

    set({ isAdvancing: true, error: null });
    try {
      const updated = await trainingApi.advance(session.sessionId);
      set({ session: updated, isAdvancing: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || "Erreur lors de l'avancement",
        isAdvancing: false,
      });
      throw err;
    }
  },

  submitAnswer: async (answer, timeSpentMs) => {
    const { session } = get();
    if (!session) return;

    set({ isSubmitting: true, error: null });
    try {
      const updated = await trainingApi.submitAnswer(session.sessionId, answer, timeSpentMs);
      set({ session: updated, isSubmitting: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Erreur lors de la soumission',
        isSubmitting: false,
      });
      throw err;
    }
  },

  loadResult: async () => {
    const { session } = get();
    if (!session) return;

    set({ isLoading: true, error: null });
    try {
      const result = await trainingApi.getResult(session.sessionId);
      set({ result, isLoading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Erreur de chargement des résultats',
        isLoading: false,
      });
      throw err;
    }
  },

  startRemediation: async () => {
    const { session } = get();
    if (!session) return;

    set({ isLoading: true, error: null, result: null });
    try {
      const updated = await trainingApi.startRemediation(session.sessionId);
      set({ session: updated, isLoading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Erreur lors du lancement de la remédiation',
        isLoading: false,
      });
      throw err;
    }
  },

  reset: () => set(initialState),
}));
