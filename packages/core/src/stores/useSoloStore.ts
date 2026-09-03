import { create } from 'zustand';
import type { SoloQuestionDTO, SoloAnswerRevealResponse } from '~/types/solo';
import * as soloApi from '~/lib/api/solo';

interface SoloState {
  sessionId: string | null;
  careerId: string | null;
  planId: string | null;
  currentQuestion: SoloQuestionDTO | null;
  reveal: SoloAnswerRevealResponse | null;
  phase: 'QUESTION' | 'REVEAL' | 'DONE';
  totalQuestions: number;
  correctAnswersSoFar: number;
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  startNewSession: (startData: {
    sessionId: string;
    totalQuestions: number;
    firstQuestion: SoloQuestionDTO;
    careerId?: string | null;
    planId?: string | null;
  }) => void;
  loadSession: (sessionId: string) => Promise<void>;
  answerQuestion: (answer: string, timeSpentMs: number) => Promise<void>;
  advanceQuestion: () => Promise<{ completed: boolean }>;
  resetStore: () => void;
}

export const useSoloStore = create<SoloState>((set, get) => ({
  sessionId: null,
  careerId: null,
  planId: null,
  currentQuestion: null,
  reveal: null,
  phase: 'QUESTION',
  totalQuestions: 0,
  correctAnswersSoFar: 0,
  isSubmitting: false,
  isLoading: false,
  error: null,

  startNewSession: (startData) => {
    set({
      sessionId: startData.sessionId,
      careerId: startData.careerId || null,
      planId: startData.planId || null,
      totalQuestions: startData.totalQuestions,
      currentQuestion: startData.firstQuestion,
      reveal: null,
      phase: 'QUESTION',
      correctAnswersSoFar: 0,
      error: null,
      isLoading: false,
    });
  },

  loadSession: async (sessionId) => {
    // Toute trace de la session précédente est effacée avant l'appel : sinon
    // l'écran affiche l'ancienne question pendant le chargement, et surtout la
    // garde `error && !currentQuestion` ne se déclenche jamais si la reprise
    // échoue — on se retrouve avec une question fantôme qui n'accepte plus
    // aucune réponse.
    set({
      isLoading: true,
      error: null,
      sessionId,
      currentQuestion: null,
      reveal: null,
      phase: 'QUESTION',
      totalQuestions: 0,
      correctAnswersSoFar: 0,
    });
    try {
      const startData = await soloApi.resumeSession(sessionId);
      set({
        sessionId: startData.sessionId,
        totalQuestions: startData.totalQuestions,
        currentQuestion: startData.firstQuestion,
        reveal: null,
        phase: 'QUESTION',
        correctAnswersSoFar: 0, // In backend resume, we don't have cumulative state directly but we will see
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Erreur de chargement de session',
        currentQuestion: null,
      });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  answerQuestion: async (answer, timeSpentMs) => {
    const { sessionId, currentQuestion, isSubmitting, phase } = get();
    if (!sessionId || !currentQuestion || isSubmitting || phase !== 'QUESTION') return;

    set({ isSubmitting: true, error: null });
    try {
      const response = await soloApi.submitAnswer(sessionId, currentQuestion.id, answer, timeSpentMs);
      set({
        reveal: response,
        phase: 'REVEAL',
        correctAnswersSoFar: response.correctAnswersSoFar,
      });
    } catch (err: any) {
      set({ error: err?.response?.data?.message || 'Erreur lors de la soumission de la réponse' });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  advanceQuestion: async () => {
    const { sessionId } = get();
    if (!sessionId) throw new Error('No active session');

    set({ isLoading: true, error: null });
    try {
      const response = await soloApi.nextQuestion(sessionId);
      if (response.completed) {
        set({ phase: 'DONE' });
        return { completed: true };
      } else if (response.question) {
        set({
          currentQuestion: response.question,
          reveal: null,
          phase: 'QUESTION',
        });
        return { completed: false };
      } else {
        throw new Error('Invalid response state from nextQuestion');
      }
    } catch (err: any) {
      set({ error: err?.response?.data?.message || 'Erreur lors du passage à la question suivante' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  resetStore: () => {
    set({
      sessionId: null,
      careerId: null,
      planId: null,
      currentQuestion: null,
      reveal: null,
      phase: 'QUESTION',
      totalQuestions: 0,
      correctAnswersSoFar: 0,
      isSubmitting: false,
      isLoading: false,
      error: null,
    });
  },
}));
