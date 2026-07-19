import * as Sentry from '@sentry/react';

let initialized = false;

// LH-13 — scrubber: axios error nese config.headers.Authorization (JWT),
// config.data (na loginu heslo) a response.data; Sentry serializuje enumerable
// pole erroru do eventu → bez scrubberu by JWT/hesla egresovala do agregátoru.
const SENSITIVE_KEY_RE = /authorization|cookie|password|token|secret|api[-_]?key/i;
const SCRUB_MAX_DEPTH = 8;

function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > SCRUB_MAX_DEPTH || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEY_RE.test(k) ? '[scrubbed]' : scrubValue(v, depth + 1);
  }
  return out;
}

/**
 * Monitoring (3. noha, FE) — error tracking do GlitchTip/Sentry + globální
 * záchyt chyb, které dnes MIZÍ (`unhandledrejection`, `window.onerror`) —
 * GlobalErrorBoundary chytá jen render chyby, ne async/event/promise.
 *
 * Init jen když je `VITE_SENTRY_DSN` (prázdné = vypnuto). DSN je veřejný (jde
 * do bundlu) — to je u Sentry/GlitchTip designově OK; odchozí data kryje
 * beforeSend scrubber.
 */
export function initMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (dsn) {
    // Tunnel: adblockery blokují přímé requesty na *.ingest.sentry.io
    // (ERR_BLOCKED_BY_ADBLOCKER) → eventy jdou přes vlastní BE endpoint,
    // který je přepošle. Stejná base logika jako apiClient.
    const apiBase =
      (import.meta.env.VITE_API_URL as string | undefined) ??
      'http://localhost:3000';
    Sentry.init({
      dsn,
      tunnel: `${apiBase}/api/monitoring/tunnel`,
      environment: import.meta.env.PROD ? 'production' : 'development',
      tracesSampleRate: 0,
      // Prohlížečový šum bez diagnostické hodnoty (benigní, chrání kvótu 5k/měs).
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications.',
      ],
      beforeSend(event) {
        if (event.request) event.request = scrubValue(event.request) as typeof event.request;
        if (event.extra) event.extra = scrubValue(event.extra) as typeof event.extra;
        if (event.contexts) event.contexts = scrubValue(event.contexts) as typeof event.contexts;
        return event;
      },
    });
    initialized = true;
  }

  // Globální handlery i bez DSN — aspoň se chyba zaloguje, ne aby zmizela beze stopy.
  window.addEventListener('unhandledrejection', (e) => {
    captureError(e.reason, 'unhandledrejection');
  });
  window.addEventListener('error', (e) => {
    captureError(e.error ?? e.message, 'window.error');
  });
}

export function captureError(err: unknown, context?: string): void {
  if (initialized) {
    Sentry.captureException(err, context ? { tags: { context } } : undefined);
  } else {
    console.error(`[monitoring${context ? ':' + context : ''}]`, err);
  }
}
