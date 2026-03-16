import { apiClient } from './client';
import type {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  TokenResponse,
} from '~/types/api';

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/auth/register', data);
  return res.data;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/auth/login', data);
  return res.data;
}

export async function refreshToken(data: RefreshTokenRequest): Promise<TokenResponse> {
  const res = await apiClient.post<TokenResponse>('/api/auth/refresh', data);
  return res.data;
}

export async function logout(data: RefreshTokenRequest): Promise<void> {
  await apiClient.post('/api/auth/logout', data);
}
