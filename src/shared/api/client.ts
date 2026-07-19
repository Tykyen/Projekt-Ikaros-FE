import axios, { type AxiosError } from 'axios';
import { toast } from 'sonner';
import { getDefaultStore } from 'jotai';
import { router } from '@/app/router';
import { saveLoginIntent } from '@/shared/lib/loginIntent';
import { accessTokenAtom, refreshTokenAtom } from '@/shared/store/authStore';
import { anonSessionAtom } from '@/features/chat/store/anonSession';
import { backendUnavailableAtom } from '@/shared/store/backendStatus';
import { isBackendUnavailable } from './isBackendUnavailable';
import type { ApiError, RefreshResponse } from '@/shared/types';

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// Detekce výpadku BE (deploy/restart). Práh 2 po sobě jdoucích výpadků →
// jeden náhodný blip nezačerní celou app, ale trvalý výpadek se chytne hned
// (React Query `retry:1` + paralelní dotazy stránky failnou rychle). Reset na
// první úspěšnou odpověď i na první ne-výpadkovou chybu (BE evidentně odpovídá).
const UNAVAILABLE_THRESHOLD = 2;
let consecutiveBackendFailures = 0;

function markBackendDown() {
  consecutiveBackendFailures += 1;
  if (consecutiveBackendFailures >= UNAVAILABLE_THRESHOLD) {
    getDefaultStore().set(backendUnavailableAtom, true);
  }
}

function markBackendUp() {
  consecutiveBackendFailures = 0;
  const store = getDefaultStore();
  if (store.get(backendUnavailableAtom)) {
    store.set(backendUnavailableAtom, false);
  }
}

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

// Request — přidá Bearer token. Členský token má přednost; 15.8 — když chybí,
// použije se guest token (host v Hospodě). Přihlášený nikdy neposílá guest token.
apiClient.interceptors.request.use((config) => {
  const store = getDefaultStore();
  const token = store.get(accessTokenAtom) ?? store.get(anonSessionAtom)?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 23.5 — single-flight refresh: souběžné 401 (paralelní dotazy při načtení
// stránky po expiraci access tokenu) sdílí JEDEN běžící refresh request.
// Bez toho každý 401 rotoval refresh token vlastním voláním → race → BE
// reuse-detection → revoke celé rodiny tokenů → odhlášení aktivního uživatele
// (sliding session nepřežila první expiraci). Toast + logout při failu proběhne
// právě jednou tady; čekající requesty dostanou jen reject.
let refreshPromise: Promise<string> | null = null;

/** Exportováno kvůli testu single-flight chování. */
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    // PC-18: refresh token je v httpOnly cookie → prázdné body + withCredentials.
    // Cookie rozhoduje (po reloadu žádný token v JS, cookie přesto platí).
    refreshPromise = axios
      .post<RefreshResponse>(
        `${apiBase}/api/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then(({ data }) => {
        getDefaultStore().set(accessTokenAtom, data.accessToken);
        return data.accessToken;
      })
      .catch((err: unknown) => {
        // EC-09 (F6): dej uživateli vědět, proč ho to odhlásilo (dřív tichý redirect).
        toast.info('Přihlášení vypršelo, přihlas se prosím znovu.');
        logoutAndRedirectToLogin();
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Response — 401 → pokus o refresh, pak retry. BANNED → instant logout (1.3b)
apiClient.interceptors.response.use(
  (res) => {
    // BE odpovídá → výpadek (pokud běžel) skončil; overlay se schová.
    markBackendUp();
    return res;
  },
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    const data = error.response?.data as ApiError | undefined;
    const code = data?.error?.code;

    // 1.3b — banned user: 401 BANNED z JwtStrategy.validate → logout bez refresh pokusu.
    // (Refresh by selhal stejně, ale instant logout je správnější UX.)
    if (error.response?.status === 401 && code === 'BANNED') {
      logoutAndRedirectToLogin();
      return Promise.reject(error);
    }

    // 1.3c — soft-delete pending nebo hard-deleted: instant logout, žádný refresh.
    // Login flow rozpoznává deletion_pending stav přes status field a otevře
    // ReactivateAccountModal; tady jen vyklidíme session pokud existuje.
    if (
      error.response?.status === 401 &&
      (code === 'DELETED' || code === 'DELETION_PENDING')
    ) {
      logoutAndRedirectToLogin();
      return Promise.reject(error);
    }

    // PT-35e — tokenVersion mismatch (logout-all / změna hesla): relace je
    // revokovaná na serveru. Refresh tokeny jsou revokované taky, takže pokus
    // o refresh by jen oddálil odhlášení o jeden failnutý request — instant
    // logout s vysvětlující hláškou je správné UX.
    if (error.response?.status === 401 && code === 'SESSION_REVOKED') {
      toast.info('Tato relace byla ukončena (odhlášení ze všech zařízení).');
      logoutAndRedirectToLogin();
      return Promise.reject(error);
    }

    // 22.4 vitrína — request BEZ Authorization = skutečný anonym (accessToken
    // je persistovaný v localStorage, guest token v atomu; oba by v hlavičce
    // byly). Anonym nemá co refreshovat — 401 z member-only fetche jen tiše
    // rejectni, ať vitrínového návštěvníka nevykopne toast+redirect na login.
    if (
      error.response?.status === 401 &&
      original &&
      !original.headers?.Authorization
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(original);
      } catch {
        // Toast + logout už proběhly v refreshAccessToken (právě jednou).
        return Promise.reject(error);
      }
    }

    // Výpadek BE (network / 502-504) → po prahu zobraz údržbu místo matoucí
    // chyby na stránce. Jiná chyba (404/403/500…) = BE odpověděl → reset.
    if (isBackendUnavailable(error)) {
      markBackendDown();
    } else {
      markBackendUp();
    }
    return Promise.reject(error);
  },
);

// Parsování BE error message z payloadu (HttpExceptionFilter shape)
export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    const msg = data?.error?.message;
    const first = Array.isArray(msg) ? msg[0] : msg;
    // EC-12 (F6): vynuť string. Primitiva převeď, objekt/null/prázdné → fallback
    // (String(objekt) by dalo „[object Object]", což je horší než axios message).
    if (typeof first === 'string' && first !== '') return first;
    if (typeof first === 'number' || typeof first === 'boolean') return String(first);
    return error.message;
  }
  return 'Neznámá chyba';
}

// Parsování BE error code (doménové, např. 'EMAIL_TAKEN', 'USERNAME_TAKEN')
// pro field-level mapping. Vrací null pokud chybí.
export function parseApiErrorCode(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    const code = data?.error?.code;
    return code != null ? String(code) : null; // EC-12: vynuť string
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
