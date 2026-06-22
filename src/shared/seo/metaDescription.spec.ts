import { describe, it, expect } from 'vitest';
import { metaDescription } from './metaDescription';

describe('metaDescription', () => {
  it('vrátí undefined pro prázdný / jen-tagový vstup', () => {
    expect(metaDescription(undefined)).toBeUndefined();
    expect(metaDescription(null)).toBeUndefined();
    expect(metaDescription('')).toBeUndefined();
    expect(metaDescription('<p></p>')).toBeUndefined();
  });

  it('stripne HTML na plain text', () => {
    expect(metaDescription('<p>Ahoj <b>světe</b></p>')).toBe('Ahoj světe');
  });

  it('krátký text vrátí beze změny (bez …)', () => {
    expect(metaDescription('Krátký popis')).toBe('Krátký popis');
  });

  it('dlouhý text ořízne a přidá …, bez koncové mezery', () => {
    const long =
      'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod';
    const out = metaDescription(long, 30)!;
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(31);
    expect(out).not.toMatch(/\s…$/);
  });
});
