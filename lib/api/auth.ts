import { apiClient } from './client';
import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  TokenResponse,
  UserResponse,
  VerifyEmailRequest,
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

export async function verifyEmail(token: string): Promise<UserResponse> {
  const res = await apiClient.post<UserResponse>('/api/auth/verify-email', { token } as VerifyEmailRequest);
  return res.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/api/auth/forgot-password', { email } as ForgotPasswordRequest);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post('/api/auth/reset-password', { token, newPassword } as ResetPasswordRequest);
}
