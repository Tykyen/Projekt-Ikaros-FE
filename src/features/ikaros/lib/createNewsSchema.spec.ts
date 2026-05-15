import { describe, it, expect } from 'vitest';
import { createNewsSchema } from './createNewsSchema';

describe('createNewsSchema', () => {
  it('přijme validní novinku bez type a imageUrl', () => {
    const r = createNewsSchema.safeParse({ title: 'Nadpis', content: 'Obsah' });
    expect(r.success).toBe(true);
  });

  it('přijme všechny platné typy', () => {
    for (const type of ['info', 'warning', 'system'] as const) {
      expect(
        createNewsSchema.safeParse({ title: 'T', content: 'C', type }).success,
      ).toBe(true);
    }
  });

  it('odmítne neplatný type', () => {
    const r = createNewsSchema.safeParse({
      title: 'T',
      content: 'C',
      type: 'urgent',
    });
    expect(r.success).toBe(false);
  });

  it('přijme imageUrl', () => {
    const r = createNewsSchema.safeParse({
      title: 'T',
      content: 'C',
      imageUrl: 'https://res.cloudinary.com/x/image/upload/v1/a.png',
    });
    expect(r.success).toBe(true);
  });

  it('odmítne prázdný nadpis i obsah', () => {
    expect(
      createNewsSchema.safeParse({ title: '', content: 'C' }).success,
    ).toBe(false);
    expect(
      createNewsSchema.safeParse({ title: 'T', content: '' }).success,
    ).toBe(false);
  });
});
