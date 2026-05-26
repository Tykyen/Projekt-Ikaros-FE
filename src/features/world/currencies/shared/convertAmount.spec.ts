import { describe, expect, it } from 'vitest';
import { convertAmount, formatAmount, formatCurrency } from './convertAmount';
import type { WorldCurrencyItem } from '../types';

const items: WorldCurrencyItem[] = [
  { id: 'a', code: 'ZL', name: 'Zlatak', symbol: 'Zl', rate: 1.0 },
  { id: 'b', code: 'ST', name: 'Stribrnak', symbol: 'St', rate: 0.1 },
  { id: 'c', code: 'MD', name: 'Medak', symbol: '', rate: 0.01 },
];

describe('convertAmount', () => {
  it('vraci amount beze zmeny pro from === to', () => {
    expect(convertAmount(42, 'ZL', 'ZL', items)).toBe(42);
  });

  it('prevadi base -> other (ZL -> ST: 1 ZL = 10 ST)', () => {
    expect(convertAmount(1, 'ZL', 'ST', items)).toBe(10);
    expect(convertAmount(5, 'ZL', 'ST', items)).toBe(50);
  });

  it('prevadi other -> base (ST -> ZL: 10 ST = 1 ZL)', () => {
    expect(convertAmount(10, 'ST', 'ZL', items)).toBe(1);
  });

  it('prevadi other -> other pres base (MD -> ST: 10 MD = 1 ST)', () => {
    expect(convertAmount(10, 'MD', 'ST', items)).toBe(1);
  });

  it('vraci null pro neznamy from code', () => {
    expect(convertAmount(1, 'XXX', 'ST', items)).toBeNull();
  });

  it('vraci null pro neznamy to code', () => {
    expect(convertAmount(1, 'ZL', 'YYY', items)).toBeNull();
  });

  it('vraci null pro prazdne items', () => {
    expect(convertAmount(1, 'ZL', 'ST', [])).toBeNull();
  });

  it('paritni test s BE math (round na 4 desetinna mista)', () => {
    // BE: round((amount * fromRate / toRate) * 10000) / 10000
    // 7 ST -> MD: 7 * (0.1 / 0.01) = 70 -> round(70.0000) -> 70
    expect(convertAmount(7, 'ST', 'MD', items)).toBe(70);
    // 1/3 ZL -> ST: round((1/3 * 10) * 10000) / 10000 = 3.3333
    expect(convertAmount(1 / 3, 'ZL', 'ST', items)).toBe(3.3333);
  });
});

describe('formatAmount', () => {
  it('orize trailing zeros (100.0000 -> 100)', () => {
    expect(formatAmount(100)).toBe('100');
  });

  it('zachova vyznamne desetinne cifry (12.5)', () => {
    expect(formatAmount(12.5)).toBe('12,5');
  });

  it('formatuje mala cisla (0.0042)', () => {
    expect(formatAmount(0.0042)).toBe('0,0042');
  });

  it('pouziva cs-CZ tisicovy separator (12345.6789)', () => {
    const result = formatAmount(12345.6789);
    // Intl pouziva U+00A0 (NBSP) jako tisicovy separator; \s matchne i NBSP
    expect(result.replace(/\s+/g, '')).toBe('12345,6789');
  });

  it('respektuje maxDecimals', () => {
    expect(formatAmount(1.23456789, { maxDecimals: 2 })).toBe('1,23');
  });
});

describe('formatCurrency', () => {
  it('zobrazi symbol pokud existuje', () => {
    const result = formatCurrency(100, 'ZL', items);
    expect(result).toBe('100 Zl');
  });

  it('fallbackuje na code pokud symbol je prazdny', () => {
    const result = formatCurrency(50, 'MD', items);
    expect(result).toBe('50 MD');
  });

  it('fallbackuje na code pokud mena v items chybi (defensive)', () => {
    const result = formatCurrency(10, 'XXX', items);
    expect(result).toBe('10 XXX');
  });
});
