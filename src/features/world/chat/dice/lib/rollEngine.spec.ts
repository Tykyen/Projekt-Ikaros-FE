import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  rollFate,
  rollGenericDice,
  rollPool,
  rollMixedDice,
  rollExplodingD6,
  getOverpressureFromRollTotal,
  secureRandomInt,
} from './rollEngine';

/**
 * Krok 6.3b — testy roll engine. Random source = `secureRandomInt` (D-NEW-
 * dice-secure-rng), který používá `crypto.getRandomValues`. Pro
 * deterministické testy mockujeme `globalThis.crypto.getRandomValues`,
 * aby vracelo zadané Uint32 hodnoty.
 *
 * `secureRandomInt(N)` přečte Uint32 z bufferu a vrátí `value % N` (přes
 * rejection sampling, ale prakticky 1. iterace). Mock seedy jsou tedy
 * přímo target hodnoty, které chceme z `secureRandomInt(N)`.
 */

/** Mock seedy → secureRandomInt vrací postupně `seeds[0], seeds[1], ...`. */
function mockSecureSeeds(seeds: number[]): void {
  let i = 0;
  vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(
    <T extends ArrayBufferView | null>(arr: T): T => {
      if (arr && 'BYTES_PER_ELEMENT' in arr) {
        (arr as unknown as Uint32Array)[0] = seeds[i++] ?? 0;
      }
      return arr;
    },
  );
}

describe('secureRandomInt', () => {
  afterEach(() => vi.restoreAllMocks());

  it('vrací 0 pro max=0', () => {
    expect(secureRandomInt(0)).toBe(0);
  });

  it('rovnoměrně vrací hodnoty v [0, max)', () => {
    mockSecureSeeds([5]);
    expect(secureRandomInt(6)).toBe(5);
  });

  it('modulo bias rejection — drží limity', () => {
    // Pro max=6 je limit 2^32 - (2^32 % 6) = 2^32 - 4. Hodnota nad limit
    // se zahodí a tahá se další seed.
    mockSecureSeeds([0xfffffffe, 0xfffffffd, 0xfffffffc, 3]);
    expect(secureRandomInt(6)).toBe(3);
  });
});

describe('rollFate', () => {
  afterEach(() => vi.restoreAllMocks());

  it('vrátí 4 hody z {−1, 0, 1}', () => {
    mockSecureSeeds([0, 1, 2, 1]); // secureRandomInt(3) → 0, 1, 2, 1
    const r = rollFate();
    expect(r.rolls).toEqual([-1, 0, 1, 0]);
    expect(r.sum).toBe(0);
    expect(r.symbols).toBe('[-] [ ] [+] [ ]');
  });

  it('sum se počítá z faces', () => {
    mockSecureSeeds([2, 2, 2, 2]); // → 1, 1, 1, 1
    const r = rollFate();
    expect(r.sum).toBe(4);
  });
});

describe('rollGenericDice', () => {
  afterEach(() => vi.restoreAllMocks());

  it('d20 vrátí jeden hod v rozsahu 1..20', () => {
    mockSecureSeeds([10]); // secureRandomInt(20) = 10 → roll = 11
    const r = rollGenericDice('d20');
    expect(r.rolls).toEqual([11]);
    expect(r.sum).toBe(11);
    expect(r.symbols).toBe('[11]');
  });

  it('3d6 vrátí 3 hody', () => {
    mockSecureSeeds([0, 3, 5]); // rolls = 1, 4, 6
    const r = rollGenericDice('3d6');
    expect(r.rolls).toEqual([1, 4, 6]);
    expect(r.sum).toBe(11);
  });

  it('d100 vrátí tens + ones, 00+0 = 100', () => {
    mockSecureSeeds([0, 0]); // tens 0, ones 0
    const r = rollGenericDice('d100');
    expect(r.rolls).toEqual([0, 0]);
    expect(r.sum).toBe(100);
  });

  it('d100 normální součet (30 + 7 = 37)', () => {
    mockSecureSeeds([3, 7]); // tens 3*10 = 30, ones 7
    const r = rollGenericDice('d100');
    expect(r.rolls).toEqual([30, 7]);
    expect(r.sum).toBe(37);
  });

  it('regex parsuje "k20" (česká varianta)', () => {
    mockSecureSeeds([19]); // → 20
    const r = rollGenericDice('k20');
    expect(r.rolls).toEqual([20]);
  });
});

describe('rollPool', () => {
  afterEach(() => vi.restoreAllMocks());

  it('vrátí přesný počet kostek', () => {
    mockSecureSeeds([0, 1, 2]);
    const r = rollPool(6, 3);
    expect(r.rolls).toHaveLength(3);
    expect(r.type).toBe('pool-d6');
  });
});

describe('rollMixedDice', () => {
  afterEach(() => vi.restoreAllMocks());

  it('mix d6×2 a d20×1 vrátí 3 hody s faceTypes', () => {
    mockSecureSeeds([0, 3, 10]); // d6: 1, 4; d20: 11
    const r = rollMixedDice({ d6: 2, d20: 1 });
    expect(r.rolls).toHaveLength(3);
    expect(r.faceTypes).toEqual(['d6', 'd6', 'd20']);
    expect(r.type).toBe('mixed');
  });

  it('d100 v mixu — počítá s 100 při 00+0', () => {
    mockSecureSeeds([0, 0]); // tens 0, ones 0 → 100
    const r = rollMixedDice({ d100: 1 });
    expect(r.sum).toBe(100);
    expect(r.faceTypes).toEqual(['d100', 'd100']);
  });
});

describe('rollExplodingD6', () => {
  afterEach(() => vi.restoreAllMocks());

  it('bez nafouknutí — jeden hod (3)', () => {
    mockSecureSeeds([2]); // secureRandomInt(6) = 2 → face 3 (≠6, stop)
    const r = rollExplodingD6();
    expect(r.rolls).toEqual([3]);
    expect(r.sum).toBe(3);
    expect(r.type).toBe('d6+');
  });

  it('kaskáda [6, 6, 3] = 15 (6 nafoukne, dál hází)', () => {
    mockSecureSeeds([5, 5, 2]); // faces 6, 6, 3 → třetí ≠6 ukončí
    const r = rollExplodingD6();
    expect(r.rolls).toEqual([6, 6, 3]);
    expect(r.sum).toBe(15);
    expect(r.symbols).toBe('[6, 6, 3]');
  });

  it('tvrdý strop 50 hodů (samé šestky neskončí donekonečna)', () => {
    mockSecureSeeds(Array(60).fill(5)); // vždy face 6
    const r = rollExplodingD6();
    expect(r.rolls).toHaveLength(50);
    expect(r.rolls.every((f) => f === 6)).toBe(true);
  });
});

describe('getOverpressureFromRollTotal', () => {
  it('< 7 → null', () => {
    expect(getOverpressureFromRollTotal(6)).toBeNull();
    expect(getOverpressureFromRollTotal(0)).toBeNull();
    expect(getOverpressureFromRollTotal(-2)).toBeNull();
  });

  it('mapping 7→1, 8→2, 9→3, 10→5, 11→7, 12→9', () => {
    expect(getOverpressureFromRollTotal(7)).toBe(1);
    expect(getOverpressureFromRollTotal(8)).toBe(2);
    expect(getOverpressureFromRollTotal(9)).toBe(3);
    expect(getOverpressureFromRollTotal(10)).toBe(5);
    expect(getOverpressureFromRollTotal(11)).toBe(7);
    expect(getOverpressureFromRollTotal(12)).toBe(9);
  });

  it('13+ → 12 (cap)', () => {
    expect(getOverpressureFromRollTotal(13)).toBe(12);
    expect(getOverpressureFromRollTotal(99)).toBe(12);
  });
});
