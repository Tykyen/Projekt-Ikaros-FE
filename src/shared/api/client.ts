import axios, { type AxiosError } from 'axios';
import { getDefaultStore } from 'jotai';
import { router } from '@/app/router';
import { saveLoginIntent } from '@/shared/lib/loginIntent';
import { accessTokenAtom, refreshTokenAtom } from '@/shared/store/authStore';
import type { ApiError, RefreshResponse } from '@/shared/types';

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: `${apiBase}/api`,
  withCredentials: true,
});

// Cleanup tokenů + redirect na úvodník s otevřeným LoginModalem.
// `/login` route neexistuje — login se otvírá modálně přes ?openLogin=1.
function logoutAndRedirectToLogin() {
  const store = getDefaultStore();
  store.set(accessTokenAtom, null);
  store.set(refreshTokenAtom, null);

  saveLoginIntent(window.location.pathname + window.location.search);

  void router.navigate('/?openLogin=1');
}

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
        logoutAndRedirectToLogin();
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
        logoutAndRedirectToLogin();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

// Parsování BE error message z payloadu (HttpExceptionFilter shape)
export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    const msg = data?.error?.message;
    if (msg) {
      return Array.isArray(msg) ? msg[0] : msg;
    }
    return error.message;
  }
  return 'Neznámá chyba';
}

// Parsování BE error code (doménové, např. 'EMAIL_TAKEN', 'USERNAME_TAKEN')
// pro field-level mapping. Vrací null pokud chybí.
export function parseApiErrorCode(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    return data?.error?.code ?? null;
  }
  return null;
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
