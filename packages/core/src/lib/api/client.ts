import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../utils/storage';
import type { TokenResponse } from '../../types/api';

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────

function getBaseUrl(): string {
  // 1. Vite environment (import.meta.env)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
      // @ts-ignore
      return import.meta.env.VITE_API_URL;
    }
  } catch {}

  // 2. Node / Expo / Next environment
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (process.env.VITE_API_URL) return process.env.VITE_API_URL;
  }

  // 3. Browser runtime domain inference (fallback in production)
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host.endsWith('mouhadev.com') || host.endsWith('xalaat.app')) {
      return 'https://apiquiz.mouhadev.com';
    }
    if (window.location.port === '3000') {
      return 'http://localhost:8090';
    }
  }
  return 'http://localhost:8080';
}

const BASE_URL = getBaseUrl();

// ──────────────────────────────────────────────
// Axios Instance
// ──────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // Augmenté à 30 secondes
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// Instance spécialisée pour les actions rapides (buzzer, validation, etc.)
export const apiClientFast = axios.create({
  baseURL: BASE_URL,
  timeout: 3000, // 3 secondes max pour les actions de gameplay
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// Instance spécialisée pour les opérations longues (génération AI)
export const apiClientLongTimeout = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 minutes pour la génération AI
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// ──────────────────────────────────────────────
// Centralized Token Refresh Logic
// ──────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

async function requestTokenInterceptor(config: InternalAxiosRequestConfig) {
  const token = await tokenStorage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

function createResponseInterceptor(instance: typeof apiClient) {
  return async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;
    if ((status !== 401 && status !== 403) || originalRequest._retry) {
      return Promise.reject(error);
    }

    const url = originalRequest.url ?? '';
    if (url.includes('/api/auth/')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return instance(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        // User is simply not authenticated — no token to refresh, bail silently.
        processQueue(null, null);
        return Promise.reject(error);
      }

      const { data } = await axios.post<TokenResponse>(
        `${BASE_URL}/api/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      );

      await tokenStorage.setAccessToken(data.accessToken);
      processQueue(null, data.accessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      }
      return instance(originalRequest);
    } catch (refreshError) {
      // Real refresh failure (network error, expired refresh token, server rejection…)
      console.error('❌ [ApiClient] Token refresh failed:', refreshError);
      processQueue(refreshError, null);
      await tokenStorage.clearTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  };
}

// Attach shared interceptors to all instances
[apiClient, apiClientFast, apiClientLongTimeout].forEach((instance) => {
  instance.interceptors.request.use(requestTokenInterceptor);
  instance.interceptors.response.use((r) => r, createResponseInterceptor(instance));
});

// ──────────────────────────────────────────────
// WebSocket URL helper
// ──────────────────────────────────────────────

/**
 * Returns the base WebSocket URL for SockJS transport.
 * The WebSocketManager appends /{serverId}/{transportId}/websocket.
 */
export function getWebSocketBaseUrl(): string {
  const wsBase = BASE_URL.replace(/^http/, 'ws');
  return `${wsBase}/ws`;
}

/** @deprecated Use getWebSocketBaseUrl — kept for backward compatibility */
export function getWebSocketUrl(): string {
  return getWebSocketBaseUrl();
}
