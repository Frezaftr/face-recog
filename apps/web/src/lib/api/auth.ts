import Cookies from 'js-cookie';
import { apiClient } from './client';
import type { AuthResponse, LoginPayload, RegisterPayload } from '@/lib/types';

const TOKEN_KEY = 'access_token';
const TOKEN_EXPIRY_DAYS = 7;

// ── Register ─────────────────────────────────────────────────────────────────
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  persistToken(data.accessToken);
  return data;
}

// ── Login ────────────────────────────────────────────────────────────────────
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  persistToken(data.accessToken);
  return data;
}

// ── Logout ───────────────────────────────────────────────────────────────────
export function logout(): void {
  Cookies.remove(TOKEN_KEY);
}

// ── Token helpers ─────────────────────────────────────────────────────────────
export function persistToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, {
    expires: TOKEN_EXPIRY_DAYS,
    sameSite: 'lax',
    // secure: true  // enable in production behind HTTPS
  });
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
