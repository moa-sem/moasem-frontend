import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import type { ApiError, ApiResponse } from '../types/common';

// 실기기·에뮬레이터에서 localhost는 기기 자신을 가리키므로 PC의 LAN IP를 써야 한다.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * 에러를 ApiError 형태로 정규화한다.
 *
 * axios 원본 에러를 그대로 흘리면 화면마다 error.response?.data?.code 를 파고들어야 한다.
 * 여기서 형태를 통일해 화면에서는 code로만 분기하면 되게 한다.
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<never>>) => {
    const body = error.response?.data;

    if (body) {
      const apiError: ApiError = {
        code: body.code,
        message: body.message,
        status: error.response?.status,
        errors: body.errors,
      };
      return Promise.reject(apiError);
    }

    // 응답 자체가 없는 경우 — 서버 미기동, 네트워크 끊김, 타임아웃.
    // 백엔드 ErrorCode에 없는 상황이므로 클라이언트 전용 코드를 쓴다.
    const isTimeout = error.code === 'ECONNABORTED';
    const apiError: ApiError = {
      code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: isTimeout
        ? '요청 시간이 초과되었습니다. 다시 시도해주세요.'
        : '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.',
    };
    return Promise.reject(apiError);
  },
);

/**
 * 백엔드는 모든 응답을 ApiResponse로 감싼다. 화면마다 res.data.data 를 파고들지 않도록
 * 여기서 한 번만 벗겨낸다.
 *
 * 인터셉터에서 벗기지 않는 이유는 axios 타입이 인터셉터의 반환값을 AxiosResponse로
 * 고정하고 있어, 거기서 data를 반환하면 실제 값과 선언된 타입이 어긋나기 때문이다.
 */
async function unwrap<T>(request: Promise<AxiosResponse<ApiResponse<T>>>): Promise<T> {
  const response = await request;
  return response.data.data as T;
}

/**
 * 도메인 API 함수는 `api` 대신 이 헬퍼를 사용한다.
 *
 * ```ts
 * export const getReport = (eventId: number) =>
 *   http.get<ReportDetailResponse>(`/api/v1/events/${eventId}/report`);
 * ```
 */
export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    unwrap(api.get<ApiResponse<T>>(url, config)),

  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    unwrap(api.post<ApiResponse<T>>(url, body, config)),

  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    unwrap(api.patch<ApiResponse<T>>(url, body, config)),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    unwrap(api.delete<ApiResponse<T>>(url, config)),
};
