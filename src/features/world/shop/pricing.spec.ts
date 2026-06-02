import { describe, it, expect } from 'vitest';
import {
  effectiveDiscount,
  effectivePrice,
  effectivePriceInCurrency,
} from './pricing';
import type { WorldCurrencyItem } from '@/features/world/currencies/types';

const items: WorldCurrencyItem[] = [
  { id: '1', code: 'ZL', name: 'Zlaťák', symbol: 'Zl', rate: 1 },
  { id: '2', code: 'ST', name: 'Stříbro', symbol: 'St', rate: 0.1 },
];

describe('effectiveDiscount — specificity item > subgroup > group', () => {
  it('položka přebíjí skupinu i podskupinu', () => {
    expect(
      effectiveDiscount(
        { discountPercent: 30 },
        { discountPercent: 10 },
        { discountPercent: 20 },
      ),
    ).toBe(30);
  });

  it('bez slevy položky spadne na podskupinu', () => {
    expect(
      effectiveDiscount(
        { discountPercent: 0 },
        { discountPercent: 10 },
        { discountPercent: 20 },
      ),
    ).toBe(20);
  });

  it('bez slevy položky a podskupiny spadne na skupinu', () => {
    expect(
      effectiveDiscount({ discountPercent: 0 }, { discountPercent: 10 }, null),
    ).toBe(10);
  });

  it('žádná sleva nikde = 0', () => {
    expect(effectiveDiscount({ discountPercent: 0 })).toBe(0);
  });

  it('ořízne mimo 0–100', () => {
    expect(effectiveDiscount({ discountPercent: 150 })).toBe(100);
  });
});

describe('effectivePrice', () => {
  it('aplikuje slevu položky', () => {
    expect(effectivePrice({ price: 100, discountPercent: 20 })).toBe(80);
  });

  it('aplikuje skupinovou slevu když položka nemá vlastní', () => {
    expect(
      effectivePrice({ price: 50, discountPercent: 0 }, { discountPercent: 10 }),
    ).toBe(45);
  });

  it('bez slevy = plná cena', () => {
    expect(effectivePrice({ price: 12.5, discountPercent: 0 })).toBe(12.5);
  });
});

describe('effectivePriceInCurrency — převod pro řazení', () => {
  it('převede cenu po slevě do cílové měny', () => {
    // 100 ZL −20 % = 80 ZL → ST (rate 0.1): 80 * (1/0.1) = 800 ST
    expect(
      effectivePriceInCurrency(
        { price: 100, discountPercent: 20, currencyCode: 'ZL' },
        'ST',
        items,
      ),
    ).toBe(800);
  });

  it('stejná měna = beze změny', () => {
    expect(
      effectivePriceInCurrency(
        { price: 30, discountPercent: 0, currencyCode: 'ZL' },
        'ZL',
        items,
      ),
    ).toBe(30);
  });

  it('neznámá měna položky → null (řadí na konec)', () => {
    expect(
      effectivePriceInCurrency(
        { price: 30, discountPercent: 0, currencyCode: 'XXX' },
        'ZL',
        items,
      ),
    ).toBeNull();
  });
});
