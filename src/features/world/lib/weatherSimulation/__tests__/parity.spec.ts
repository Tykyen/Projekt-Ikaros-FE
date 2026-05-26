import { describe, expect, it } from 'vitest';
import { generateTemperature } from '../varianceModel';
import { PARITY_FIXTURES } from '../__fixtures__/parity-fixtures';

/**
 * PARITY GATE — MIRROR BE testu (backend/src/modules/world-weather/simulation/__tests__/parity.spec.ts).
 *
 * Účel: ověřit, že FE kopie produkuje IDENTICKÝ output jako BE.
 * Pokud testy v BE projdou ale tady ne → drift v simulation logice. Spustit
 *   `ts-node ../Projekt-ikaros/backend/scripts/sync-simulation-to-fe.ts`
 * pro re-sync z BE.
 *
 * NIKDY needituj soubory v této složce přímo — BE je source of truth.
 */

const REGENERATE = process.env.PARITY_REGENERATE === '1';

describe('Variance simulation parity (FE mirror)', () => {
  if (REGENERATE) {
    it.skip('REGENERATE mode — viz console', () => {
      /* noop */
    });
    console.log('\n=== FE PARITY REGENERATE ===');
    for (const fix of PARITY_FIXTURES) {
      const result = generateTemperature(fix.input);
      console.log(
        `${fix.name}:  expectedTemperature: ${result.temperature}, expectedIsAnomaly: ${result.isAnomaly}`,
      );
    }
    return;
  }

  it.each(PARITY_FIXTURES)('$name', (fix) => {
    const result = generateTemperature(fix.input);
    if (fix.expectedTemperature !== 0) {
      expect(Math.abs(result.temperature - fix.expectedTemperature)).toBeLessThanOrEqual(
        0.1,
      );
      expect(result.isAnomaly).toBe(fix.expectedIsAnomaly);
    } else {
      expect(typeof result.temperature).toBe('number');
      expect(Number.isFinite(result.temperature)).toBe(true);
    }
  });
});
