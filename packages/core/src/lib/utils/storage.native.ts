// Native storage implementation (iOS & Android)
// Uses expo-secure-store for tokens and AsyncStorage for large/non-sensitive app data

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'buzzmaster_access_token';
const REFRESH_TOKEN_KEY = 'buzzmaster_refresh_token';
const USER_KEY = 'buzzmaster_user';
const ONBOARDING_KEY = 'buzzmaster_onboarding_done';

const ACTIVE_SESSION_KEY = 'buzzmaster_active_session';
const USER_PROFILE_KEY = 'buzzmaster_user_profile';

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },
  async removeAccessToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      // ignore
    }
  },
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },
  async removeRefreshToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      // ignore
    }
  },
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.setAccessToken(accessToken);
    await this.setRefreshToken(refreshToken);
  },
  async clearTokens(): Promise<void> {
    await this.removeAccessToken();
    await this.removeRefreshToken();
  },
  async clearAll(): Promise<void> {
    await this.removeAccessToken();
    await this.removeRefreshToken();
  },
};

export const appStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore
    }
  },

  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async setJSON<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore
    }
  },

  async getUser(): Promise<string | null> {
    return this.getItem(USER_KEY);
  },
  async setUser(user: string): Promise<void> {
    return this.setItem(USER_KEY, user);
  },
  async removeUser(): Promise<void> {
    return this.removeItem(USER_KEY);
  },
  async isOnboardingDone(): Promise<boolean> {
    const val = await this.getItem(ONBOARDING_KEY);
    return val === 'true';
  },
  async setOnboardingDone(): Promise<void> {
    return this.setItem(ONBOARDING_KEY, 'true');
  },

  // Active session (for reconnection)
  getActiveSession: () =>
    appStorage.getJSON<{ sessionId: string; code: string }>(ACTIVE_SESSION_KEY),
  setActiveSession: (data: { sessionId: string; code: string }) =>
    appStorage.setJSON(ACTIVE_SESSION_KEY, data),
  clearActiveSession: () => appStorage.remove(ACTIVE_SESSION_KEY),

  // User profile cache
  getUserProfile: () => appStorage.getJSON(USER_PROFILE_KEY),
  setUserProfile: (profile: unknown) => appStorage.setJSON(USER_PROFILE_KEY, profile),
  clearUserProfile: () => appStorage.remove(USER_PROFILE_KEY),

  async clearAll(): Promise<void> {
    await tokenStorage.clearTokens();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const buzzKeys = keys.filter((k) => k.startsWith('buzzmaster_'));
      if (buzzKeys.length > 0) {
        await AsyncStorage.multiRemove(buzzKeys);
      }
    } catch {
      // ignore
    }
  },
};
