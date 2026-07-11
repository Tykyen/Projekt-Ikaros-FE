import * as Sentry from '@sentry/react';

let initialized = false;

/**
 * Monitoring (3. noha, FE) — error tracking do GlitchTip/Sentry + globální
 * záchyt chyb, které dnes MIZÍ (`unhandledrejection`, `window.onerror`) —
 * GlobalErrorBoundary chytá jen render chyby, ne async/event/promise.
 *
 * Init jen když je `VITE_SENTRY_DSN` (prázdné = vypnuto). DSN je veřejný (jde
 * do bundlu) — to je u Sentry/GlitchTip designově OK.
 */
export function initMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (dsn) {
    Sentry.init({
      dsn,
      environment: import.meta.env.PROD ? 'production' : 'development',
      tracesSampleRate: 0,
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
