import { describe, it, expect } from 'vitest';
import { isBackendUnavailable } from './isBackendUnavailable';

const axiosErr = (over: Record<string, unknown>) => ({
  isAxiosError: true,
  ...over,
});

describe('isBackendUnavailable', () => {
  it('network error (žádná response) → true (BE neodpověděl)', () => {
    expect(
      isBackendUnavailable(axiosErr({ response: undefined, code: 'ERR_NETWORK' })),
    ).toBe(true);
  });

  it('502 / 503 / 504 (proxy hlásí down upstream) → true', () => {
    for (const status of [502, 503, 504]) {
      expect(isBackendUnavailable(axiosErr({ response: { status } }))).toBe(true);
    }
  });

  it('400 / 403 / 404 / 500 (BE odpověděl) → false', () => {
    for (const status of [400, 403, 404, 500]) {
      expect(isBackendUnavailable(axiosErr({ response: { status } }))).toBe(false);
    }
  });

  it('ne-axios chyba → false', () => {
    expect(isBackendUnavailable(new Error('boom'))).toBe(false);
    expect(isBackendUnavailable(null)).toBe(false);
    expect(isBackendUnavailable(undefined)).toBe(false);
  });
});
