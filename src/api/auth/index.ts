import { http } from '../client';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export const googleLogin = (idToken: string) =>
  http.post<TokenResponse>('/api/v1/auth/google', { idToken });

export const refreshToken = (refreshToken: string) =>
  http.post<TokenResponse>('/api/v1/auth/refresh', { refreshToken });
