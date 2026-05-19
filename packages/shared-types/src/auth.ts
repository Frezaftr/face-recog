// ── Auth types ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  iat?: number;
  exp?: number;
}
