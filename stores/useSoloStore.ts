import { create } from 'zustand';
import type { SoloQuestionDTO, SoloAnswerRevealResponse } from '~/types/solo';
import * as soloApi from '~/lib/api/solo';

interface SoloState {
  sessionId: string | null;
  currentQuestion: SoloQuestionDTO | null;
  reveal: SoloAnswerRevealResponse | null;
  phase: 'QUESTION' | 'REVEAL' | 'DONE';
  totalQuestions: number;
  correctAnswersSoFar: number;
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  startNewSession: (startData: { sessionId: string; totalQuestions: number; firstQuestion: SoloQuestionDTO }) => void;
  loadSession: (sessionId: string) => Promise<void>;
  answerQuestion: (answer: string, timeSpentMs: number) => Promise<void>;
  advanceQuestion: () => Promise<{ completed: boolean }>;
  resetStore: () => void;
}

export const useSoloStore = create<SoloState>((set, get) => ({
  sessionId: null,
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
      totalQuestions: startData.totalQuestions,
      currentQuestion: startData.firstQuestion,
      reveal: null,
      phase: 'QUESTION',
      correctAnswersSoFar: 0,
      error: null,
    });
  },

  loadSession: async (sessionId) => {
    set({ isLoading: true, error: null });
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
      set({ error: err?.response?.data?.message || 'Erreur de chargement de session' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  answerQuestion: async (answer, timeSpentMs) => {
    const { sessionId, currentQuestion, isSubmitting } = get();
    if (!sessionId || !currentQuestion || isSubmitting) return;

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
