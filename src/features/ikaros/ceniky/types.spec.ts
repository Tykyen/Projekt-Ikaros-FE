/**
 * 21.5g — testy měnových helperů ceníků: formatPrice (gsc/usd/credits)
 * a decimalToGsc (usd editor ↔ uložení gold/silver/copper), včetně
 * bezeztrátového round-tripu (přepnutí měny nesmí měnit hodnoty).
 */
import { describe, it, expect } from 'vitest';
import {
  PRICE_LIST_ERA_OTHER,
  decimalToGsc,
  eraOf,
  formatGsc,
  formatPrice,
} from './types';

describe('formatPrice', () => {
  it('gsc (i bez měny) deleguje na formatGsc', () => {
    const p = { gold: 2, silver: 5, copper: 0 };
    expect(formatPrice(p, 'gsc')).toBe(formatGsc(p));
    expect(formatPrice(p, undefined)).toBe('2 zl 5 st');
  });

  it('usd: dolary s centy, tisícový oddělovač, celé bez ".00"', () => {
    expect(formatPrice({ gold: 12, silver: 3, copper: 4 }, 'usd')).toBe(
      '$12.34',
    );
    expect(formatPrice({ gold: 1299, silver: 0, copper: 0 }, 'usd')).toBe(
      '$1,299',
    );
    expect(formatPrice({ gold: 0, silver: 0, copper: 5 }, 'usd')).toBe('$0.05');
    expect(formatPrice({ gold: 3, silver: 9, copper: 0 }, 'usd')).toBe('$3.90');
  });

  it('vše nula = zdarma ve všech měnách', () => {
    const zero = { gold: 0, silver: 0, copper: 0 };
    expect(formatPrice(zero, 'gsc')).toBe('zdarma');
    expect(formatPrice(zero, 'usd')).toBe('zdarma');
    expect(formatPrice(zero, 'credits')).toBe('zdarma');
  });

  it('credits: celé i desetinné kredity', () => {
    expect(formatPrice({ gold: 1234, silver: 0, copper: 0 }, 'credits')).toBe(
      `${(1234).toLocaleString('cs-CZ')} kr`,
    );
    expect(formatPrice({ gold: 5, silver: 2, copper: 5 }, 'credits')).toBe(
      '5,25 kr',
    );
  });
});

describe('decimalToGsc', () => {
  it('rozkládá dolary.centy na gold/silver/copper', () => {
    expect(decimalToGsc(12.34)).toEqual({ gold: 12, silver: 3, copper: 4 });
    expect(decimalToGsc(0.05)).toEqual({ gold: 0, silver: 0, copper: 5 });
    expect(decimalToGsc(1299)).toEqual({ gold: 1299, silver: 0, copper: 0 });
  });

  it('zaokrouhluje float artefakty na centy a odmítá záporné', () => {
    // 0.1 + 0.2 = 0.30000000000000004 — musí dát přesně 30 centů
    expect(decimalToGsc(0.1 + 0.2)).toEqual({ gold: 0, silver: 3, copper: 0 });
    expect(decimalToGsc(-3)).toEqual({ gold: 0, silver: 0, copper: 0 });
  });

  it('round-trip: gsc → desetinná → gsc beze ztráty (přepnutí měny)', () => {
    const cases = [
      { gold: 0, silver: 0, copper: 0 },
      { gold: 12, silver: 3, copper: 4 },
      { gold: 999, silver: 9, copper: 9 },
      { gold: 65000, silver: 0, copper: 1 },
    ];
    for (const p of cases) {
      const decimal = p.gold + (p.silver * 10 + p.copper) / 100;
      expect(decimalToGsc(decimal)).toEqual(p);
    }
  });
});

describe('eraOf', () => {
  it('rozpozná éru podle štítku (case-insensitive, první shoda)', () => {
    expect(eraOf({ tags: ['morvol'] })).toBe('Středověk a fantasy');
    expect(eraOf({ tags: ['Divoký Západ'] })).toBe('Divoký západ');
    expect(eraOf({ tags: ['1. světová'] })).toBe('1. světová válka');
    expect(eraOf({ tags: ['přítomnost'] })).toBe('Přítomnost');
    expect(eraOf({ tags: ['blízká budoucnost'] })).toBe('Blízká budoucnost');
  });

  it('bez érového štítku → Ostatní (i s jinými štítky / bez tags)', () => {
    expect(eraOf({ tags: ['jídlo', 'služby'] })).toBe(PRICE_LIST_ERA_OTHER);
    expect(eraOf({ tags: undefined })).toBe(PRICE_LIST_ERA_OTHER);
  });
});
