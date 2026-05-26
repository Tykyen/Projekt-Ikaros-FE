import { describe, expect, it } from 'vitest';
import { recomputeRatesForNewBase, moveBaseToFront } from './setAsBase';
import type { WorldCurrencyItem } from '../types';

const fantasy: WorldCurrencyItem[] = [
  { id: 'a', code: 'ZL', name: 'Zlaťák', symbol: 'Zl', rate: 1.0 },
  { id: 'b', code: 'ST', name: 'Stříbrňák', symbol: 'St', rate: 0.1 },
  { id: 'c', code: 'MD', name: 'Měďák', symbol: 'Md', rate: 0.01 },
];

describe('recomputeRatesForNewBase', () => {
  it('přepočítá kurzy: ZL→ST jako nová base', () => {
    const result = recomputeRatesForNewBase(fantasy, 'ST');
    const find = (c: string) => result.find((i) => i.code === c)?.rate;
    expect(find('ZL')).toBe(10);
    expect(find('ST')).toBe(1);
    expect(find('MD')).toBe(0.1);
  });

  it('zachová poměry mezi měnami (1 ZL = 10 ST = 100 MD před i po)', () => {
    const before = fantasy.find((i) => i.code === 'ZL')!.rate / fantasy.find((i) => i.code === 'ST')!.rate;
    const after = recomputeRatesForNewBase(fantasy, 'ST');
    const afterRatio = after.find((i) => i.code === 'ZL')!.rate / after.find((i) => i.code === 'ST')!.rate;
    expect(after.length).toBe(3);
    expect(afterRatio).toBeCloseTo(before, 6);
  });

  it('2 měny: ZL=1, GD=5 → newBase=GD → ZL=0.2, GD=1', () => {
    const items: WorldCurrencyItem[] = [
      { id: 'a', code: 'ZL', name: 'Zlaťák', symbol: 'Zl', rate: 1.0 },
      { id: 'b', code: 'GD', name: 'Gold', symbol: 'Gd', rate: 5.0 },
    ];
    const result = recomputeRatesForNewBase(items, 'GD');
    expect(result.find((i) => i.code === 'GD')?.rate).toBe(1);
    expect(result.find((i) => i.code === 'ZL')?.rate).toBe(0.2);
  });

  it('no-op když nová base už má rate=1.0', () => {
    const result = recomputeRatesForNewBase(fantasy, 'ZL');
    expect(result).toBe(fantasy); // stejná reference (no-op)
  });

  it('throw když newBaseCode neexistuje', () => {
    expect(() => recomputeRatesForNewBase(fantasy, 'XXX')).toThrow(
      /neexistuje/,
    );
  });

  it('throw když nová base má rate <= 0 (corrupted data)', () => {
    const bad: WorldCurrencyItem[] = [
      ...fantasy,
      { id: 'x', code: 'BAD', name: 'Bad', symbol: 'X', rate: 0 },
    ];
    expect(() => recomputeRatesForNewBase(bad, 'BAD')).toThrow(/neplatný kurz/);
  });

  it('nezmění name/symbol/code, jen rate', () => {
    const result = recomputeRatesForNewBase(fantasy, 'ST');
    expect(result[0].name).toBe('Zlaťák');
    expect(result[0].symbol).toBe('Zl');
    expect(result[0].code).toBe('ZL');
    expect(result[0].id).toBe('a');
  });
});

describe('moveBaseToFront', () => {
  it('přesune base z prostředku na začátek', () => {
    const result = moveBaseToFront(fantasy, 'ST');
    expect(result.map((i) => i.code)).toEqual(['ST', 'ZL', 'MD']);
  });

  it('no-op když base už je první', () => {
    const result = moveBaseToFront(fantasy, 'ZL');
    expect(result).toBe(fantasy);
  });

  it('no-op když baseCode neexistuje (defensive)', () => {
    const result = moveBaseToFront(fantasy, 'XXX');
    expect(result).toBe(fantasy);
  });
});
