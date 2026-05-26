import { describe, expect, it } from 'vitest';
import {
  currencyItemBaseSchema,
  createCurrencyItemSchema,
} from './validation';
import type { WorldCurrencyItem } from './types';

const items: WorldCurrencyItem[] = [
  { id: 'a', code: 'ZL', name: 'Zlatak', symbol: 'Zl', rate: 1.0 },
  { id: 'b', code: 'ST', name: 'Stribrnak', symbol: 'St', rate: 0.1 },
];

describe('currencyItemBaseSchema', () => {
  it('akceptuje valid item', () => {
    const result = currencyItemBaseSchema.safeParse({
      code: 'DK',
      name: 'Drahokam',
      symbol: 'Dk',
      rate: 100,
    });
    expect(result.success).toBe(true);
  });

  it('prevede code na uppercase', () => {
    const result = currencyItemBaseSchema.parse({
      code: 'dk',
      name: 'Drahokam',
      symbol: '',
      rate: 100,
    });
    expect(result.code).toBe('DK');
  });

  it('odmitne code s ne-alfanumerickym znakem', () => {
    const result = currencyItemBaseSchema.safeParse({
      code: 'D-K',
      name: 'Drahokam',
      symbol: '',
      rate: 100,
    });
    expect(result.success).toBe(false);
  });

  it('odmitne code delsi nez 8 znaku', () => {
    const result = currencyItemBaseSchema.safeParse({
      code: 'TOOLONGCODE',
      name: 'X',
      symbol: '',
      rate: 1,
    });
    expect(result.success).toBe(false);
  });

  it('odmitne prazdny name', () => {
    const result = currencyItemBaseSchema.safeParse({
      code: 'DK',
      name: '   ',
      symbol: '',
      rate: 1,
    });
    expect(result.success).toBe(false);
  });

  it('odmitne name delsi nez 40 znaku', () => {
    const result = currencyItemBaseSchema.safeParse({
      code: 'DK',
      name: 'X'.repeat(41),
      symbol: '',
      rate: 1,
    });
    expect(result.success).toBe(false);
  });

  it('odmitne symbol delsi nez 8 znaku', () => {
    const result = currencyItemBaseSchema.safeParse({
      code: 'DK',
      name: 'X',
      symbol: 'TOOOOLONG',
      rate: 1,
    });
    expect(result.success).toBe(false);
  });

  it('akceptuje prazdny symbol', () => {
    expect(
      currencyItemBaseSchema.safeParse({
        code: 'DK',
        name: 'X',
        symbol: '',
        rate: 1,
      }).success,
    ).toBe(true);
  });

  it('odmitne rate <= 0', () => {
    expect(
      currencyItemBaseSchema.safeParse({
        code: 'DK',
        name: 'X',
        symbol: '',
        rate: 0,
      }).success,
    ).toBe(false);
    expect(
      currencyItemBaseSchema.safeParse({
        code: 'DK',
        name: 'X',
        symbol: '',
        rate: -1,
      }).success,
    ).toBe(false);
  });

  it('odmitne rate > 1M', () => {
    expect(
      currencyItemBaseSchema.safeParse({
        code: 'DK',
        name: 'X',
        symbol: '',
        rate: 2_000_000,
      }).success,
    ).toBe(false);
  });
});

describe('createCurrencyItemSchema (uniqueness)', () => {
  it('odmitne duplicitni code (case insensitive)', () => {
    const schema = createCurrencyItemSchema(items);
    const result = schema.safeParse({
      code: 'zl',
      name: 'Zlato',
      symbol: '',
      rate: 2,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/u.? existuje/);
    }
  });

  it('akceptuje stejny code pokud je excludeCode (self-edit)', () => {
    const schema = createCurrencyItemSchema(items, 'ZL');
    const result = schema.safeParse({
      code: 'ZL',
      name: 'Zlatak upraveny',
      symbol: 'Zl',
      rate: 1.0,
    });
    expect(result.success).toBe(true);
  });

  it('akceptuje novy unique code', () => {
    const schema = createCurrencyItemSchema(items);
    const result = schema.safeParse({
      code: 'DK',
      name: 'Drahokam',
      symbol: 'Dk',
      rate: 100,
    });
    expect(result.success).toBe(true);
  });
});
