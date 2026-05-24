import { describe, it, expect } from 'vitest';
import { createGameEventSchema } from '../createGameEventSchema';

describe('createGameEventSchema', () => {
  const base = {
    title: 'Test akce',
    date: '2026-06-01T18:00',
    description: '',
    targetGroup: null,
    groupOnly: false,
    confirmable: true,
  };

  it('akceptuje validní vstup', () => {
    const r = createGameEventSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it('odmítne prázdný title', () => {
    const r = createGameEventSchema.safeParse({ ...base, title: '   ' });
    expect(r.success).toBe(false);
  });

  it('odmítne příliš dlouhý title (>200)', () => {
    const r = createGameEventSchema.safeParse({
      ...base,
      title: 'x'.repeat(201),
    });
    expect(r.success).toBe(false);
  });

  it('odmítne nevalidní date formát', () => {
    const r = createGameEventSchema.safeParse({ ...base, date: '2026-06-01' });
    expect(r.success).toBe(false);
  });

  it('odmítne groupOnly=true bez targetGroup', () => {
    const r = createGameEventSchema.safeParse({
      ...base,
      groupOnly: true,
      targetGroup: null,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].path).toEqual(['targetGroup']);
    }
  });

  it('akceptuje groupOnly=true s targetGroup', () => {
    const r = createGameEventSchema.safeParse({
      ...base,
      groupOnly: true,
      targetGroup: 'Lumíci',
    });
    expect(r.success).toBe(true);
  });

  it('akceptuje extrémně budoucí datum (+50 let — archive policy)', () => {
    const r = createGameEventSchema.safeParse({
      ...base,
      date: '2076-12-31T23:59',
    });
    expect(r.success).toBe(true);
  });
});
