/** Typed calls for staff authentication: /api/auth/login, logout, change-password, me. */
import type { AdminRole } from '../../types/cms';
import type { ChangePasswordRequest, LoginRequest, LoginResponse, SafeUser } from '../../server/contracts';
import { apiGet, apiPost, type ApiResult } from './client';

export const postLogin = (username: string, password: string, expectedRole?: AdminRole): Promise<ApiResult<LoginResponse>> =>
  apiPost<LoginResponse>('/api/auth/login', { username, password, expectedRole } satisfies LoginRequest);

export const postLogout = (): Promise<ApiResult<{ ok: true }>> => apiPost<{ ok: true }>('/api/auth/logout');

export const postChangePassword = (
  currentPassword: string,
  newPassword: string
): Promise<ApiResult<{ ok: true; mustChangePassword: boolean }>> =>
  apiPost<{ ok: true; mustChangePassword: boolean }>('/api/auth/change-password', {
    currentPassword,
    newPassword,
  } satisfies ChangePasswordRequest);

export interface MeResponse {
  ok: true;
  user: SafeUser;
  mustChangePassword: boolean;
}

export const fetchMe = (): Promise<ApiResult<MeResponse>> => apiGet<MeResponse>('/api/auth/me');
