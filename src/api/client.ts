import axios, { type AxiosError } from 'axios';
import { getDefaultStore } from 'jotai';
import { accessTokenAtom, refreshTokenAtom } from '../store/authStore';
import type { ApiError, RefreshResponse } from '../types';

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: `${apiBase}/api`,
  withCredentials: true,
});

// Request — přidá Bearer token
apiClient.interceptors.request.use((config) => {
  const token = getDefaultStore().get(accessTokenAtom);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response — 401 → pokus o refresh, pak retry
apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const store = getDefaultStore();
      const refreshToken = store.get(refreshTokenAtom);

      if (!refreshToken) {
        store.set(accessTokenAtom, null);
        store.set(refreshTokenAtom, null);
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<RefreshResponse>(
          `${apiBase}/api/auth/refresh`,
          { refreshToken },
        );
        store.set(accessTokenAtom, data.accessToken);
        store.set(refreshTokenAtom, data.refreshToken);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch {
        store.set(accessTokenAtom, null);
        store.set(refreshTokenAtom, null);
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

// Parsování BE error payloadu
export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message[0] : data.message;
    }
    return error.message;
  }
  return 'Neznámá chyba';
}

// Typované metody
export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<T>(url, { params }).then((r) => r.data),
  post: <T>(url: string, data?: unknown) =>
    apiClient.post<T>(url, data).then((r) => r.data),
  put: <T>(url: string, data?: unknown) =>
    apiClient.put<T>(url, data).then((r) => r.data),
  patch: <T>(url: string, data?: unknown) =>
    apiClient.patch<T>(url, data).then((r) => r.data),
  delete: <T>(url: string) =>
    apiClient.delete<T>(url).then((r) => r.data),
};
