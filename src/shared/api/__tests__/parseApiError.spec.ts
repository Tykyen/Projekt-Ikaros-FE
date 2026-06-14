// M-FE (error-contract audit, 13. styl) — FE strana kontraktu (L5).
// Dokazuje, že parseApiError/parseApiErrorCode přežijí VŠECHNY 4 tvary chyby,
// které BE reálně posílá (potvrzeno M-SHAPE e2e), a nikdy nevrátí undefined/[object Object]/throw.
import { describe, it, expect } from 'vitest';
import { parseApiError, parseApiErrorCode } from '../client';

// mock AxiosError — axios.isAxiosError() kontroluje payload.isAxiosError === true
function axiosErr(data: unknown, message = 'Request failed with status code 500') {
  return { isAxiosError: true, response: { data }, message };
}

describe('parseApiError — robustnost proti všem tvarům chyby', () => {
  // ── tvar #1: aplikační {error:{code,message,timestamp}} ──
  it('tvar #1 (aplikační) → vrátí CS message + doménový kód', () => {
    const e = axiosErr({ error: { code: 'EMAIL_TAKEN', message: 'Email už existuje', timestamp: 'x' } });
    expect(parseApiError(e)).toBe('Email už existuje');
    expect(parseApiErrorCode(e)).toBe('EMAIL_TAKEN');
  });

  // ── tvar #2: validace {error:{code:'BAD_REQUEST', message:string[]}} ──
  it('tvar #2 (validace, string[]) → vrátí PRVNÍ hlášku (ostatní se ztratí — EC-02)', () => {
    const e = axiosErr({
      error: { code: 'BAD_REQUEST', message: ['email must be an email', 'name should not be empty'], timestamp: 'x' },
    });
    expect(parseApiError(e)).toBe('email must be an email'); // jen [0]
    expect(parseApiErrorCode(e)).toBe('BAD_REQUEST'); // generický → bez field-mappingu
  });

  // ── tvar #3: ne-HTTP 500 {statusCode,message} BEZ error wrapperu (EC-01) ──
  it('🐛 tvar #3 (neobalený 500) → data.error chybí → FALLBACK na axios message (EC-01)', () => {
    const e = axiosErr({ statusCode: 500, message: 'Internal server error' });
    // parseApiError nenajde data.error.message → fallback na err.message (technické, EN)
    expect(parseApiError(e)).toBe('Request failed with status code 500');
    expect(parseApiErrorCode(e)).toBeNull(); // žádný kód → FE neumí reagovat
  });

  // ── tvar #4 / non-axios / hrany ──
  it('non-axios Error → "Neznámá chyba", code null', () => {
    expect(parseApiError(new Error('boom'))).toBe('Neznámá chyba');
    expect(parseApiErrorCode(new Error('boom'))).toBeNull();
  });

  it('null / undefined → "Neznámá chyba", code null (žádný throw)', () => {
    expect(parseApiError(null)).toBe('Neznámá chyba');
    expect(parseApiError(undefined)).toBe('Neznámá chyba');
    expect(parseApiErrorCode(null)).toBeNull();
  });

  it('axios error bez response (síťová chyba) → fallback na message', () => {
    const e = { isAxiosError: true, message: 'Network Error' };
    expect(parseApiError(e)).toBe('Network Error');
    expect(parseApiErrorCode(e)).toBeNull();
  });

  it('nikdy nevrátí "[object Object]" ani undefined (message je objekt)', () => {
    const e = axiosErr({ error: { code: 'X', message: { nested: 'oops' }, timestamp: 'x' } });
    const out = parseApiError(e);
    expect(out).not.toBe('[object Object]');
    expect(out).toBeTruthy();
  });

  it('prázdné message → fallback (ne prázdný string)', () => {
    const e = axiosErr({ error: { code: 'X', message: '', timestamp: 'x' } }, 'axios fallback');
    expect(parseApiError(e)).toBe('axios fallback'); // '' je falsy → padá na err.message
  });
});
