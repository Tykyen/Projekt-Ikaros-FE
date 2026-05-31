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
