// ── API error shape ───────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
  path?: string;
}

export interface ApiSuccessResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiError;
