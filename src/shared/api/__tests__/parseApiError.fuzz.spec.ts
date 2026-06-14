// L8 FUZZ (error-contract audit) — property-based robustnost FE parseru (fast-check).
// Invariant: ať BE pošle COKOLI (libovolně pokřivené tělo), parseApiError VŽDY vrátí
// neprázdný string (nikdy throw, nikdy undefined, nikdy doslovné "[object Object]"),
// a parseApiErrorCode vrátí string|null. Pokrývá tvary, co ručně nevymyslíš.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { parseApiError, parseApiErrorCode } from '../client';

// libovolný JSON-like vstup
const anyJson = fc.anything();

function axiosErr(data: unknown) {
  return { isAxiosError: true, response: { data }, message: 'fallback msg' };
}

describe('parseApiError — FUZZ (∀ pokřivené tělo)', () => {
  // Invariant, který MÁ platit vždy: parser nikdy nethrowne (odolnost vůči pokřivení).
  it('nikdy nethrowne — libovolné response.data', () => {
    fc.assert(
      fc.property(anyJson, (data) => {
        expect(() => parseApiError(axiosErr(data))).not.toThrow();
        expect(() => parseApiErrorCode(axiosErr(data))).not.toThrow();
      }),
      { numRuns: 1000 },
    );
  });

  it('nikdy nethrowne — libovolný ne-axios vstup (null/číslo/objekt/funkce)', () => {
    fc.assert(
      fc.property(anyJson, (x) => {
        expect(() => parseApiError(x)).not.toThrow();
        expect(parseApiErrorCode(x)).toBeNull(); // non-axios větev je deterministická
      }),
      { numRuns: 1000 },
    );
  });

  // Pro tvary, které BE REÁLNĚ posílá (string / string[] / neobalený 500), MUSÍ být string.
  it('reálné tvary (string | string[] stringů | neobalený) → vždy neprázdný string', () => {
    const realShape = fc.oneof(
      fc.record({ error: fc.record({ code: fc.string(), message: fc.string({ minLength: 1 }) }) }),
      fc.record({ error: fc.record({ code: fc.string(), message: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }) }) }),
      fc.record({ statusCode: fc.constant(500), message: fc.string() }), // tvar #3 → fallback
    );
    fc.assert(
      fc.property(realShape, (data) => {
        const out = parseApiError(axiosErr(data));
        expect(typeof out).toBe('string');
        expect(out.length).toBeGreaterThan(0);
      }),
      { numRuns: 1000 },
    );
  });

  // ✅ EC-12 OPRAVENO (F6): message jako ne-string je vynuceno na string (primitiva)
  // nebo padá na fallback (objekt) — nikdy doslovné "[object Object]".
  it('✅ EC-12 OPRAVENO: error.message=[number] → vždy string', () => {
    expect(parseApiError(axiosErr({ error: { code: 'X', message: [42] } }))).toBe('42');
  });

  it('✅ EC-12 OPRAVENO: error.message=objekt → fallback, NE "[object Object]"', () => {
    const out = parseApiError(axiosErr({ error: { code: 'X', message: { a: 1 } } }));
    expect(out).not.toBe('[object Object]');
    expect(out).toBe('fallback msg');
  });
});
