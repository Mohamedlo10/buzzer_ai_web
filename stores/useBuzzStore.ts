import { create } from 'zustand';
import type {
  BuzzQueueItem,
  CategoryRequest,
  CreateSessionRequest,
  PlayerResponse,
  QuestionResponse,
  SessionResponse,
  SessionStatus,
  TeamResponse,
} from '~/types/api';
import * as sessionsApi from '~/lib/api/sessions';
import { appStorage } from '~/lib/utils/storage';

// ─────────────────────────────────────────────────────────────────────────────
// STATE INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

interface BuzzState {
  // Session
  session: SessionResponse | null;
  players: PlayerResponse[];
  questions: QuestionResponse[];
  teams: TeamResponse[];
  sessionCode: string | null;
  isManager: boolean;
  mySelectedCategories: string[]; // local cache — backend doesn't return selected categories in PlayerResponse

  // Game
  currentQuestion: QuestionResponse | null;
  questionIndex: number;
  totalQuestions: number;

  // Buzzer
  buzzQueue: BuzzQueueItem[];
  hasBuzzed: boolean;
  answeredWrongThisQuestion: boolean;
  myQueuePosition: number | null;
  buzzerEnabled: boolean;

  // Rubrique beaten notification
  rubriqueBeatenNotif: { playerId: string; debtAmount: number; at: number } | null;

  // Game control
  isPaused: boolean;
  isGameOver: boolean;

  // Loading states
  isCreating: boolean;
  isJoining: boolean;
  isStarting: boolean;
}

interface BuzzActions {
  // Session actions
  createSession: (config: CreateSessionRequest) => Promise<{ sessionId: string; code: string }>;
  joinCheck: (code: string) => Promise<{ sessionId: string; code: string; managerName: string }>;
  joinSession: (sessionId: string, categories: CategoryRequest[], isSpectator: boolean, isManual?: boolean, teamId?: string | null) => Promise<void>;
  fetchSession: (sessionId: string) => Promise<void>;
  startSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  pauseSession: (sessionId: string) => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;

  // Teams
  setTeams: (teams: TeamResponse[]) => void;

  // Game state updates (WebSocket)
  setCurrentQuestion: (question: QuestionResponse, index: number, total: number) => void;
  addToBuzzQueue: (item: BuzzQueueItem) => void;
  setBuzzQueue: (queue: BuzzQueueItem[]) => void;
  clearBuzzQueue: () => void;
  fullBuzzerReset: () => void;
  setHasBuzzed: (hasBuzzed: boolean) => void;
  setAnsweredWrongThisQuestion: (wrong: boolean) => void;
  setBuzzerEnabled: (enabled: boolean) => void;
  setPaused: (paused: boolean) => void;
  setGameOver: (isOver: boolean) => void;
  addPlayer: (player: PlayerResponse) => void;
  removePlayer: (playerId: string) => void;
  updateScores: (scores: Record<string, number>) => void;
  updateStatus: (status: SessionStatus) => void;

  // Cleanup
  resetGame: () => void;
  leaveSession: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────────────────────

const initialState: BuzzState = {
  session: null,
  players: [],
  questions: [],
  teams: [],
  sessionCode: null,
  isManager: false,
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  buzzQueue: [],
  hasBuzzed: false,
  answeredWrongThisQuestion: false,
  myQueuePosition: null,
  buzzerEnabled: false,
  rubriqueBeatenNotif: null,
  isPaused: false,
  isGameOver: false,
  isCreating: false,
  isJoining: false,
  isStarting: false,
  mySelectedCategories: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────────────

export const useBuzzStore = create<BuzzState & BuzzActions>((set, get) => ({
  ...initialState,

  // ── Session Actions ──
  createSession: async (config) => {
    set({ isCreating: true });
    try {
      const result = await sessionsApi.createSession(config);
      await appStorage.setActiveSession({
        sessionId: result.session.id,
        code: result.session.code,
      });
      set({
        session: result.session,
        players: [result.player],
        questions: [],
        sessionCode: result.session.code,
        isManager: true,
      });
      return { sessionId: result.session.id, code: result.session.code };
    } finally {
      set({ isCreating: false });
    }
  },

  setTeams: (teams) => set({ teams }),

  joinCheck: async (code) => {
    const response = await sessionsApi.joinCheck(code);
    return {
      sessionId: response.session.id,
      code: response.session.code,
      managerName: response.session.managerName,
    };
  },

  joinSession: async (sessionId, categories, isSpectator, isManual = false, teamId?: string | null) => {
    set({ isJoining: true });
    try {
      // In MANUAL mode, categories are ignored by the backend — send empty array
      await sessionsApi.joinSession(sessionId, {
        categories: isManual ? [] : categories,
        isSpectator,
        ...(teamId ? { teamId } : {}),
      });
      // Cache locally — backend doesn't return selected categories in PlayerResponse
      if (!isManual) {
        set({ mySelectedCategories: categories.map(c => c.name) });
      }
      const detail = await sessionsApi.getSession(sessionId);
      if (!detail?.session) throw new Error('Invalid session');

      await appStorage.setActiveSession({
        sessionId: detail.session.id,
        code: detail.session.code,
      });

      set({
        session: detail.session,
        players: detail.players || [],
        questions: detail.questions || [],
        teams: detail.teams || [],
        sessionCode: detail.session.code,
      });
    } catch (error: any) {
      if (error?.response?.status === 409) {
        const detail = await sessionsApi.getSession(sessionId);
        await appStorage.setActiveSession({
          sessionId: detail.session.id,
          code: detail.session.code,
        });
        set({
          session: detail.session,
          players: detail.players || [],
          questions: detail.questions || [],
          teams: detail.teams || [],
          sessionCode: detail.session.code,
        });
        return;
      }
      throw error;
    } finally {
      set({ isJoining: false });
    }
  },

  fetchSession: async (sessionId) => {
    const detail = await sessionsApi.getSession(sessionId);
    // console.log('[fetchSession] players selectedCategories:', JSON.stringify(
    //   detail.players.map(p => ({ name: p.name, selectedCategories: (p as any).selectedCategories })),
    //   null, 2
    // ));
    set({
      session: detail.session,
      players: detail.players,
      questions: detail.questions,
      teams: detail.teams || [],
      sessionCode: detail.session.code,
    });
  },

  startSession: async (sessionId) => {
    set({ isStarting: true });
    try {
      const isManual = get().session?.questionMode === 'MANUAL';
      // AI mode only: set GENERATING optimistically to navigate to loading screen immediately.
      // MANUAL mode: no optimistic update — wait for the WS STATUS:PLAYING event (< 100ms).
      if (!isManual) {
        set((state) => ({
          session: state.session ? { ...state.session, status: 'GENERATING' } : null,
        }));
      }
      await sessionsApi.startSession(sessionId);
      // For both modes, the WS question_start event will update status to PLAYING
      // and trigger navigation from the lobby.
    } catch (error: any) {
      if (error?.response?.status === 409) {
        // Session already started — fetch real status
        const detail = await sessionsApi.getSession(sessionId);
        set({
          session: detail.session,
          players: detail.players,
          questions: detail.questions,
        });
      } else {
        // Revert optimistic GENERATING (AI mode) on failure
        set((state) => ({
          session: state.session ? { ...state.session, status: 'LOBBY' } : null,
        }));
        throw error;
      }
    } finally {
      set({ isStarting: false });
    }
  },

  deleteSession: async (sessionId) => {
    await sessionsApi.deleteSession(sessionId);
    appStorage.clearActiveSession();
    set(initialState);
  },

  pauseSession: async (sessionId) => {
    await sessionsApi.pauseSession(sessionId);
    set({ isPaused: true, buzzerEnabled: false });
  },

  resumeSession: async (sessionId) => {
    await sessionsApi.resumeSession(sessionId);
    set({ isPaused: false, buzzerEnabled: true });
  },

  // ── Game State Updates (WebSocket) ──
  setCurrentQuestion: (question, index, total) =>
    set({
      currentQuestion: question,
      questionIndex: index,
      totalQuestions: total,
      buzzQueue: [],
      hasBuzzed: false,
      answeredWrongThisQuestion: false,
      myQueuePosition: null,
      buzzerEnabled: true,
    }),

  addToBuzzQueue: (item) =>
    set((state) => {
      if (state.buzzQueue.some((b) => b.playerId === item.playerId)) {
        return state;
      }
      return { buzzQueue: [...state.buzzQueue, item] };
    }),

  setBuzzQueue: (queue) => set({ buzzQueue: queue }),

  clearBuzzQueue: () =>
    set({
      buzzQueue: [],
      myQueuePosition: null,
    }),

  fullBuzzerReset: () =>
    set({
      buzzQueue: [],
      hasBuzzed: false,
      answeredWrongThisQuestion: false,
      myQueuePosition: null,
      buzzerEnabled: true,
    }),

  setHasBuzzed: (hasBuzzed) => set({ hasBuzzed }),
  setAnsweredWrongThisQuestion: (wrong) => set({ answeredWrongThisQuestion: wrong }),
  setBuzzerEnabled: (enabled) => set({ buzzerEnabled: enabled }),
  setPaused: (paused) => set({ isPaused: paused, buzzerEnabled: !paused }),
  setGameOver: (isOver) => set({ isGameOver: isOver, buzzerEnabled: false }),

  addPlayer: (player) =>
    set((state) => {
      if (state.players.some((p) => p.userId === player.userId)) return state;
      return { players: [...state.players, player] };
    }),

  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId && p.userId !== playerId),
    })),

  updateScores: (scores) =>
    set((state) => ({
      players: state.players.map((p) => ({
        ...p,
        score: scores[p.id] ?? scores[p.userId] ?? p.score,
      })),
    })),

  updateStatus: (status) =>
    set((state) => ({
      session: state.session ? { ...state.session, status } : null,
    })),

  // ── Cleanup ──
  resetGame: () =>
    set({
      currentQuestion: null,
      questionIndex: 0,
      totalQuestions: 0,
      buzzQueue: [],
      hasBuzzed: false,
      answeredWrongThisQuestion: false,
      myQueuePosition: null,
      buzzerEnabled: false,
      isPaused: false,
      isGameOver: false,
    }),

  leaveSession: () => {
    appStorage.clearActiveSession();
    set(initialState);
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// OPTIMIZED SELECTORS (prevent unnecessary re-renders)
// ─────────────────────────────────────────────────────────────────────────────

export const useSession = () => useBuzzStore((state) => state.session);
export const usePlayers = () => useBuzzStore((state) => state.players);
export const useBuzzQueue = () => useBuzzStore((state) => state.buzzQueue);
export const useCurrentQuestion = () => useBuzzStore((state) => state.currentQuestion);
export const useIsManager = () => useBuzzStore((state) => state.isManager);
export const useHasBuzzed = () => useBuzzStore((state) => state.hasBuzzed);
export const useBuzzerEnabled = () => useBuzzStore((state) => state.buzzerEnabled);
export const useIsPaused = () => useBuzzStore((state) => state.isPaused);
export const useIsGameOver = () => useBuzzStore((state) => state.isGameOver);
export const useLoadingStates = () =>
  useBuzzStore((state) => ({
    isCreating: state.isCreating,
    isJoining: state.isJoining,
    isStarting: state.isStarting,
  }));
