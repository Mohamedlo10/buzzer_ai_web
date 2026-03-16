// Web-only storage (no React Native/Expo dependencies)
// Uses localStorage for all storage needs

const ACCESS_TOKEN_KEY = 'buzzmaster_access_token';
const REFRESH_TOKEN_KEY = 'buzzmaster_refresh_token';
const USER_KEY = 'buzzmaster_user';
const ONBOARDING_KEY = 'buzzmaster_onboarding_done';

const ACTIVE_SESSION_KEY = 'buzzmaster_active_session';
const USER_PROFILE_KEY = 'buzzmaster_user_profile';

const isClient = typeof window !== 'undefined';

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    if (!isClient) return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  async setAccessToken(token: string): Promise<void> {
    if (!isClient) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  async removeAccessToken(): Promise<void> {
    if (!isClient) return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken(): Promise<string | null> {
    if (!isClient) return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  async setRefreshToken(token: string): Promise<void> {
    if (!isClient) return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  async removeRefreshToken(): Promise<void> {
    if (!isClient) return;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
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
    if (!isClient) return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export const appStorage = {
  async getItem(key: string): Promise<string | null> {
    if (!isClient) return null;
    return localStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (!isClient) return;
    localStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (!isClient) return;
    localStorage.removeItem(key);
  },

  async getJSON<T>(key: string): Promise<T | null> {
    if (!isClient) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async setJSON<T>(key: string, value: T): Promise<void> {
    if (!isClient) return;
    localStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string): Promise<void> {
    if (!isClient) return;
    localStorage.removeItem(key);
  },

  async getUser(): Promise<string | null> {
    if (!isClient) return null;
    return localStorage.getItem(USER_KEY);
  },
  async setUser(user: string): Promise<void> {
    if (!isClient) return;
    localStorage.setItem(USER_KEY, user);
  },
  async removeUser(): Promise<void> {
    if (!isClient) return;
    localStorage.removeItem(USER_KEY);
  },
  async isOnboardingDone(): Promise<boolean> {
    if (!isClient) return false;
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  },
  async setOnboardingDone(): Promise<void> {
    if (!isClient) return;
    localStorage.setItem(ONBOARDING_KEY, 'true');
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
    if (!isClient) return;
    await tokenStorage.clearTokens();
    const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith('buzzmaster_'));
    keysToRemove.forEach(k => localStorage.removeItem(k));
  },
};
