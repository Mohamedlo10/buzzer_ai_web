import { create } from 'zustand';
import type { BuzzQueueItem, QuestionResponse } from '~/types/api';
import * as gameApi from '~/lib/api/game';
import { performanceMonitor } from '~/lib/utils/performance';

interface GameState {
  // Current question
  currentQuestion: QuestionResponse | null;
  questionIndex: number;
  totalQuestions: number;

  // Buzzer
  buzzQueue: BuzzQueueItem[];
  hasBuzzed: boolean;
  myQueuePosition: number | null;
  buzzerEnabled: boolean;

  // Game control
  isPaused: boolean;
  isGameOver: boolean;

  // Actions
  buzz: (sessionId: string) => Promise<void>;
  validateAnswer: (sessionId: string, playerId: string, isCorrect: boolean) => Promise<void>;
  skipQuestion: (sessionId: string) => Promise<void>;
  resetBuzzer: (sessionId: string) => Promise<void>;
  scoreCorrection: (sessionId: string, playerId: string, amount: number, reason: string) => Promise<void>;

  // State updates (from WebSocket)
  setCurrentQuestion: (question: QuestionResponse, index: number, total: number) => void;
  setBuzzQueue: (queue: BuzzQueueItem[]) => void;
  addToBuzzQueue: (item: BuzzQueueItem) => void;
  clearBuzzQueue: () => void;
  fullBuzzerReset: () => void;
  setHasBuzzed: (hasBuzzed: boolean) => void;
  setBuzzerEnabled: (enabled: boolean) => void;
  setPaused: (paused: boolean) => void;
  setGameOver: (isOver: boolean) => void;

  // Reset
  resetGame: () => void;
  
  // Performance monitoring
  getLatencyStats: () => {
    averageLatency: number;
    minLatency: number;
    maxLatency: number;
    recentLatency: number;
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  buzzQueue: [],
  hasBuzzed: false,
  myQueuePosition: null,
  buzzerEnabled: false,
  isPaused: false,
  isGameOver: false,

  buzz: async (sessionId) => {
    // Démarrer le monitoring de performance
    const startTimestamp = performanceMonitor.startBuzzMeasurement();
    const timestamp = Date.now();
    
    // UI optimiste : mettre à jour l'interface immédiatement
    set({
      hasBuzzed: true,
      buzzerEnabled: false,
      myQueuePosition: null, // Position sera mise à jour par le serveur
    });
    
    try {
      const result = await gameApi.buzz(sessionId, timestamp);
      // Terminer le monitoring de performance
      performanceMonitor.completeBuzzMeasurement(startTimestamp, result.serverTimestamp);
      
      // Mettre à jour avec la vraie position de la queue
      set({
        myQueuePosition: result.queuePosition,
      });
    } catch (error) {
      // En cas d'erreur, revenir à l'état précédent
      console.error('❌ [GameStore] Buzz failed:', error);
      set({
        hasBuzzed: false,
        buzzerEnabled: true,
        myQueuePosition: null,
      });
      throw error;
    }
  },

  validateAnswer: async (sessionId, playerId, isCorrect) => {
    await gameApi.validateAnswer(sessionId, { playerId, isCorrect });
  },

  skipQuestion: async (sessionId) => {
    await gameApi.skipQuestion(sessionId);
  },

  resetBuzzer: async (sessionId) => {
    await gameApi.resetBuzzer(sessionId);
  },

  scoreCorrection: async (sessionId, playerId, amount, reason) => {
    await gameApi.scoreCorrection(sessionId, { playerId, amount, reason });
  },

  // WebSocket state updaters
  setCurrentQuestion: (question, index, total) =>
    set({
      currentQuestion: question,
      questionIndex: index,
      totalQuestions: total,
      buzzQueue: [],
      hasBuzzed: false,
      myQueuePosition: null,
      buzzerEnabled: true,
    }),
  setBuzzQueue: (queue) => set({ buzzQueue: queue }),
  addToBuzzQueue: (item) =>
    set((state) => {
      // Prevent duplicate entries (same player can only buzz once per question)
      if (state.buzzQueue.some((b) => b.playerId === item.playerId)) {
        return state;
      }
      return { buzzQueue: [...state.buzzQueue, item] };
    }),
  clearBuzzQueue: () =>
    set({
      buzzQueue: [],
      myQueuePosition: null,
      buzzerEnabled: true,
    }),
  fullBuzzerReset: () =>
    set({
      buzzQueue: [],
      hasBuzzed: false,
      myQueuePosition: null,
      buzzerEnabled: true,
    }),
  setHasBuzzed: (hasBuzzed) => set({ hasBuzzed }),
  setBuzzerEnabled: (enabled) => set({ buzzerEnabled: enabled }),
  setPaused: (paused) => set({ isPaused: paused, buzzerEnabled: !paused }),
  setGameOver: (isOver) =>
    set({ isGameOver: isOver, buzzerEnabled: false }),

  resetGame: () =>
    set({
      currentQuestion: null,
      questionIndex: 0,
      totalQuestions: 0,
      buzzQueue: [],
      hasBuzzed: false,
      myQueuePosition: null,
      buzzerEnabled: false,
      isPaused: false,
      isGameOver: false,
    }),

  getLatencyStats: () => performanceMonitor.getLatencyStats(),
}));
