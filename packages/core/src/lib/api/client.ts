import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '~/lib/utils/storage';
import type { TokenResponse } from '~/types/api';

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

// ──────────────────────────────────────────────
// Axios Instance
// ──────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // Augmenté à 30 secondes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instance spécialisée pour les actions rapides (buzzer, validation, etc.)
export const apiClientFast = axios.create({
  baseURL: BASE_URL,
  timeout: 3000, // 3 secondes max pour les actions de gameplay
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instance spécialisée pour les opérations longues (génération AI)
export const apiClientLongTimeout = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 minutes pour la génération AI
  headers: {
    'Content-Type': 'application/json',
  },
});

// ──────────────────────────────────────────────
// Request Interceptors — attach access token
// ──────────────────────────────────────────────

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccessToken();
  // console.log('🔐 [ApiClient] Making request:', {
  //   method: config.method?.toUpperCase(),
  //   url: `${config.baseURL}${config.url}`,
  //   hasToken: !!token,
  //   tokenPreview: token ? `${token.slice(0, 20)}...` : null
  // });
  
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fast client with minimal logging for performance
apiClientFast.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccessToken();
  // Minimal logging pour les actions rapides
  if (process.env.NODE_ENV === 'development') {
    console.log(`⚡ [Fast] ${config.method?.toUpperCase()} ${config.url}`);
  }
  
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ──────────────────────────────────────────────
// Response Interceptor — refresh on 401
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

apiClient.interceptors.response.use(
  (response) => {
    // console.log('✅ [ApiClient] Request successful:', {
    //   method: response.config.method?.toUpperCase(),
    //   url: response.config.url,
    //   status: response.status
    // });
    return response;
  },
  async (error: AxiosError) => {
    console.error('❌ [ApiClient] Request failed:', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh for 401/403 errors on authenticated requests
    const status = error.response?.status;
    if ((status !== 401 && status !== 403) || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't refresh on auth endpoints themselves
    const url = originalRequest.url ?? '';
    if (url.includes('/api/auth/')) {
      return Promise.reject(error);
    }

    // console.log(`🔄 [ApiClient] Attempting token refresh for ${status} error...`);

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      // console.log('🔄 [ApiClient] Calling refresh endpoint...');
      const { data } = await axios.post<TokenResponse>(
        `${BASE_URL}/api/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      );

      // console.log('✅ [ApiClient] Token refresh successful');
      await tokenStorage.setAccessToken(data.accessToken);

      processQueue(null, data.accessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      console.error('❌ [ApiClient] Token refresh failed:', refreshError);
      processQueue(refreshError, null);
      // Token refresh failed — clear tokens and let the app handle logout
      await tokenStorage.clearTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ──────────────────────────────────────────────
// Setup interceptors for fast client
// ──────────────────────────────────────────────

apiClientFast.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ [Fast] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError) => {
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

    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        await tokenStorage.clearTokens();
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const { data } = await axios.post<TokenResponse>(`${BASE_URL}/api/auth/refresh`, {
        refreshToken,
      });

      await tokenStorage.setAccessToken(data.accessToken);
      
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      }
      return apiClientFast(originalRequest);
    } catch (refreshError) {
      await tokenStorage.clearTokens();
      return Promise.reject(refreshError);
    }
  },
);

// ──────────────────────────────────────────────
// Setup interceptors for long timeout client
// ──────────────────────────────────────────────

apiClientLongTimeout.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccessToken();
  console.log('🔐 [ApiClient-Long] Making request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : null,
  });
  
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClientLongTimeout.interceptors.response.use(
  (response) => {
    console.log('✅ [ApiClient-Long] Request successful:', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  async (error: AxiosError) => {
    console.error('❌ [ApiClient-Long] Request failed:', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    // Same refresh logic as main client
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const longStatus = error.response?.status;
    if ((longStatus !== 401 && longStatus !== 403) || originalRequest._retry) {
      return Promise.reject(error);
    }

    const url = originalRequest.url ?? '';
    if (url.includes('/api/auth/')) {
      return Promise.reject(error);
    }

    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        await tokenStorage.clearTokens();
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const { data } = await axios.post<TokenResponse>(`${BASE_URL}/api/auth/refresh`, {
        refreshToken,
      });

      await tokenStorage.setAccessToken(data.accessToken);
      
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      }
      return apiClientLongTimeout(originalRequest);
    } catch (refreshError) {
      console.error('❌ [ApiClient-Long] Token refresh failed:', refreshError);
      await tokenStorage.clearTokens();
      return Promise.reject(refreshError);
    }
  },
);

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
