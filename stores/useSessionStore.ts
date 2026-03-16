import { create } from 'zustand';
import type {
  CategoryRequest,
  CreateSessionRequest,
  PlayerResponse,
  QuestionResponse,
  SessionResponse,
  SessionStatus,
} from '~/types/api';
import * as sessionsApi from '~/lib/api/sessions';
import { appStorage } from '~/lib/utils/storage';

interface SessionState {
  // Current session data
  session: SessionResponse | null;
  players: PlayerResponse[];
  questions: QuestionResponse[];
  sessionCode: string | null;

  // Derived
  isManager: boolean;
  
  // Loading states
  isCreating: boolean;
  isJoining: boolean;
  isStarting: boolean;

  // Actions
  createSession: (config: CreateSessionRequest) => Promise<{ sessionId: string; code: string }>;
  joinCheck: (code: string) => Promise<{ sessionId: string; code: string; managerName: string }>;
  joinSession: (sessionId: string, categories: CategoryRequest[], isSpectator: boolean) => Promise<void>;
  fetchSession: (sessionId: string) => Promise<void>;
  startSession: (sessionId: string) => Promise<void>;
  pauseSession: (sessionId: string) => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;

  // State updates (from WebSocket)
  setSession: (session: SessionResponse) => void;
  setPlayers: (players: PlayerResponse[]) => void;
  addPlayer: (player: PlayerResponse) => void;
  removePlayer: (playerId: string) => void;
  setQuestions: (questions: QuestionResponse[]) => void;
  updateStatus: (status: SessionStatus) => void;
  updateScores: (scores: Record<string, number>) => void;

  // Cleanup
  clearState: () => void;
  leaveSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  players: [],
  questions: [],
  sessionCode: null,
  isManager: false,
  isCreating: false,
  isJoining: false,
  isStarting: false,

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
    } catch (error) {
      throw error;
    } finally {
      set({ isCreating: false });
    }
  },

  joinCheck: async (code) => {
    const response = await sessionsApi.joinCheck(code);
    return {
      sessionId: response.session.id,
      code: response.session.code,
      managerName: response.session.managerName,
    };
  },

  joinSession: async (sessionId, categories, isSpectator) => {
    set({ isJoining: true });
    try {
      await sessionsApi.joinSession(sessionId, { categories, isSpectator });
      const sessionDetail = await sessionsApi.getSession(sessionId);
      
      if (!sessionDetail?.session) {
        throw new Error('Invalid session detail structure');
      }
      
      await appStorage.setActiveSession({
        sessionId: sessionDetail.session.id,
        code: sessionDetail.session.code,
      });
      
      set({
        session: sessionDetail.session,
        players: sessionDetail.players || [],
        questions: sessionDetail.questions || [],
        sessionCode: sessionDetail.session.code,
      });
    } catch (error: any) {
      // Special case: if user already in session, try to get session details
      if (error?.response?.status === 409 && error?.response?.data?.error === 'USER_ALREADY_EXISTS') {
        try {
          const detail = await sessionsApi.getSession(sessionId);
          await appStorage.setActiveSession({
            sessionId: detail.session.id,
            code: detail.session.code,
          });
          set({
            session: detail.session,
            players: detail.players || [],
            questions: detail.questions || [],
            sessionCode: detail.session.code,
          });
          return;
        } catch {
          // ignore fetch error
        }
      }
      throw error;
    } finally {
      set({ isJoining: false });
    }
  },

  fetchSession: async (sessionId) => {
    const detail = await sessionsApi.getSession(sessionId);
    set({
      session: detail.session,
      players: detail.players,
      questions: detail.questions,
      sessionCode: detail.session.code,
    });
  },

  startSession: async (sessionId) => {
    set({ isStarting: true });
    try {
      await sessionsApi.startSession(sessionId);
      // Mettre à jour le status local pour déclencher la navigation
      set((state) => ({
        session: state.session ? {
          ...state.session,
          status: 'GENERATING' as const
        } : null
      }));
    } catch (error: any) {
      // Session already started — re-fetch to get real status and trigger navigation
      if (error?.response?.status === 409) {
        try {
          const detail = await sessionsApi.getSession(sessionId);
          set({
            session: detail.session,
            players: detail.players,
            questions: detail.questions,
          });
        } catch {
          // ignore fetch error
        }
        return; // don't re-throw, the useEffect will handle navigation
      }
      throw error;
    } finally {
      set({ isStarting: false });
    }
  },

  pauseSession: async (sessionId) => {
    await sessionsApi.pauseSession(sessionId);
  },

  resumeSession: async (sessionId) => {
    await sessionsApi.resumeSession(sessionId);
  },

  // WebSocket state updaters
  setSession: (session) => set({ session, sessionCode: session.code }),
  setPlayers: (players) => set({ players }),
  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players.filter((p) => p.id !== player.id), player],
    })),
  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    })),
  setQuestions: (questions) => set({ questions }),
  updateStatus: (status) =>
    set((state) => ({
      session: state.session ? { ...state.session, status } : null,
    })),
  updateScores: (scores) =>
    set((state) => ({
      players: state.players.map((p) => ({
        ...p,
        score: scores[p.id] ?? scores[p.userId] ?? p.score,
      })),
    })),

  clearState: () =>
    set({
      session: null,
      players: [],
      questions: [],
      sessionCode: null,
      isManager: false,
    }),

  leaveSession: () => {
    appStorage.clearActiveSession();
    get().clearState();
  },
}));
