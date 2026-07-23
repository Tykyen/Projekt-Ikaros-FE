/**
 * Spec 26.6 (D11) — FE telemetrie Vypravěče: batch + debounce 5 s,
 * fire-and-forget (ztráta při pádu = přijatelná — na rozdíl od onboarding
 * stavu NEnese pravdu, jen metriky). Flush při pagehide přes keepalive.
 * Anonym se neměří (endpoint je auth-only; funnel počítá jen účty).
 * GDPR: query truncate 200, žádná entity ID (jen route pattern + ref ID).
 */
import { getDefaultStore } from 'jotai';
import { api } from '@/shared/api';
import { currentUserAtom } from '@/shared/store/authStore';

export type TelemetrieEvent =
  | 'persona_chosen'
  | 'journey_started'
  | 'step_done'
  | 'journey_dismissed'
  | 'topic_open'
  | 'search_miss'
  | 'no_topic'
  | 'feedback_plus'
  | 'feedback_minus'
  | 'dismissed';

interface Zaznam {
  event: TelemetrieEvent;
  route?: string;
  refId?: string;
  query?: string;
}

const DEBOUNCE_MS = 5000;
const MAX_BATCH = 50;

const fronta: Zaznam[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function prihlaseny(): boolean {
  return getDefaultStore().get(currentUserAtom) != null;
}

let frontaUid: string | null = null;
/** Fronta patří JEDNÉ identitě — logout/login ji vyprázdní (misattribution). */
function zajistiIdentituFronty(): void {
  const uid = getDefaultStore().get(currentUserAtom)?.id ?? null;
  if (uid !== frontaUid) {
    fronta.length = 0;
    frontaUid = uid;
  }
}

async function odeslat(): Promise<void> {
  zajistiIdentituFronty();
  if (!fronta.length || !prihlaseny()) return;
  const davka = fronta.splice(0, MAX_BATCH);
  try {
    await api.post('/vypravec/telemetry', { events: davka });
  } catch {
    /* fire-and-forget — metriky nejsou pravda, neretryujeme */
  }
}

/** Jediný vstup: zařaď event (truncate + route pattern doplní volající). */
export function telemetrie(
  event: TelemetrieEvent,
  meta: Omit<Zaznam, 'event'> = {},
): void {
  zajistiIdentituFronty();
  if (!prihlaseny()) return;
  fronta.push({
    event,
    ...(meta.route ? { route: meta.route.slice(0, 200) } : {}),
    ...(meta.refId ? { refId: meta.refId.slice(0, 100) } : {}),
    ...(meta.query ? { query: meta.query.slice(0, 200) } : {}),
  });
  if (fronta.length >= MAX_BATCH) {
    if (timer) clearTimeout(timer);
    timer = null;
    void odeslat();
    return;
  }
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void odeslat(), DEBOUNCE_MS);
}

let flushZapojen = false;
/** Best-effort flush při zavírání tabu (keepalive; volá VypravecRoot init). */
export function zapojTelemetriiFlush(): void {
  if (flushZapojen || typeof document === 'undefined') return;
  flushZapojen = true;
  const flush = () => {
    if (!fronta.length || !prihlaseny()) return;
    let token: string | null;
    try {
      token = JSON.parse(localStorage.getItem('ikaros.jwt') ?? 'null');
    } catch {
      return;
    }
    if (!token) return;
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
    const davka = fronta.splice(0, MAX_BATCH);
    void fetch(`${base}/vypravec/telemetry`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ events: davka }),
    }).catch(() => {
      /* fire-and-forget */
    });
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
}
