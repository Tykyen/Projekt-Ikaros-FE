import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';

// Vitest nemá `globals: true` → @testing-library/react automatický cleanup
// se nespouští. Bez tohoto by se mounty mezi testy hromadily v document.body
// (zvláště pro Modal používající createPortal).
afterEach(() => {
  cleanup();
});

// tiptap BubbleMenu (`@tiptap/react/menus` → `BubbleMenuView`) plánuje
// `setTimeout`, který přežije unmount editoru a v jiném test souboru sáhne na
// `document` až PO jsdom teardownu → `ReferenceError: document is not defined`
// (uncaught → exit 1). Flaky napříč soubory ve vitest shardu (CI linux timing).
// V testech se bublinové menu nezobrazuje (jsdom nemá layout) ani se neověřuje
// (žádný spec neasertuje jeho obsah), takže no-op mock jen odstraní timer.
// FloatingMenu a ostatní exporty ponecháváme reálné.
vi.mock('@tiptap/react/menus', async (orig) => ({
  ...(await orig<typeof import('@tiptap/react/menus')>()),
  BubbleMenu: () => null,
}));

// jsdom nemá ResizeObserver (používá ho MapDock, popovery ad.) — no-op stub,
// testy měří layout jinak (offsetHeight mock / assert na DOM strukturu).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

// D-NEW-register-captcha-tests — Cloudflare Turnstile (`@marsidev/react-turnstile`)
// v jsdom nikdy nedokončí challenge → token nevznikne → submit zůstane disabled
// → RegisterModal testy timeoutují. Mock okamžitě emituje token přes `onSuccess`,
// takže e2e flow (submit + error mapping) je v testech průchozí. V produkci běží
// reálný widget. Globální mock — turnstile používá jen RegisterModal.
vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: React.forwardRef(
    (
      props: { onSuccess?: (token: string) => void },
      ref: React.Ref<{ reset: () => void }>,
    ) => {
      React.useImperativeHandle(ref, () => ({ reset: () => {} }));
      React.useEffect(() => {
        props.onSuccess?.('test-captcha-token');
      }, [props]);
      return React.createElement('div', { 'data-testid': 'turnstile-mock' });
    },
  ),
}));
