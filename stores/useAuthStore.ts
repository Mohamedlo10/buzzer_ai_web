import { create } from 'zustand';
import type { UserResponse } from '~/types/api';
import * as authApi from '~/lib/api/auth';
import * as usersApi from '~/lib/api/users';
import { tokenStorage, appStorage } from '~/lib/utils/storage';

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string | null, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
  setUser: (user: UserResponse) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ username, password });
      await tokenStorage.setTokens(response.accessToken, response.refreshToken);
      await appStorage.setUserProfile(response.user);
      set({ user: response.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register({ username, email, password });
      await tokenStorage.setTokens(response.accessToken, response.refreshToken);
      await appStorage.setUserProfile(response.user);
      set({ user: response.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        await authApi.logout({ refreshToken }).catch(() => {});
      }
    } finally {
      await appStorage.clearAll();
      set({ user: null, isAuthenticated: false });
    }
  },

  restoreSession: async () => {
    console.log('🔄 [AuthStore] Restoring session...');
    const token = await tokenStorage.getAccessToken();

    if (!token) {
      console.log('❌ [AuthStore] No access token found');
      return false;
    }

    // Restore cached user profile immediately for instant UI
    const cachedUser = await appStorage.getUserProfile() as UserResponse | null;
    if (cachedUser) {
      console.log('✅ [AuthStore] Cached user found, restoring immediately:', cachedUser.username);
      set({ user: cachedUser, isAuthenticated: true });
    }

    // Verify with server in background (also triggers token refresh if needed)
    try {
      const user = await usersApi.getMe();
      await appStorage.setUserProfile(user);
      set({ user, isAuthenticated: true });
      console.log('✅ [AuthStore] Session verified with server for user:', user.username);
      return true;
    } catch (error) {
      console.error('❌ [AuthStore] Server verification failed:', error);
      // If we had a cached user, keep them logged in only if refresh token exists
      const refreshToken = await tokenStorage.getRefreshToken();
      if (cachedUser && refreshToken) {
        console.log('⚠️ [AuthStore] Keeping cached session, server unreachable');
        return true;
      }
      // No cached user or no refresh token — full logout
      await appStorage.clearAll();
      set({ user: null, isAuthenticated: false });
      return false;
    }
  },

  setUser: (user) => set({ user }),
}));
