import { describe, it, expect } from 'vitest';
import { cdnSized } from './cdnImage';

const CLOUD =
  'https://res.cloudinary.com/dzht9sebg/image/upload/v1779345925/dice-skins/d20_core_obsidian_20.webp';

describe('cdnSized', () => {
  it('vloží transformaci do cloudinary upload URL', () => {
    expect(cdnSized(CLOUD)).toBe(
      'https://res.cloudinary.com/dzht9sebg/image/upload/w_320,f_auto,q_auto/v1779345925/dice-skins/d20_core_obsidian_20.webp',
    );
  });

  it('respektuje vlastní šířku', () => {
    expect(cdnSized(CLOUD, 160)).toContain('/upload/w_160,f_auto,q_auto/v');
  });

  it('je idempotentní (nezdvojí segment)', () => {
    const once = cdnSized(CLOUD);
    expect(cdnSized(once)).toBe(once);
  });

  it('lokální /textures/ URL nechá beze změny', () => {
    const local = '/textures/d20_core_obsidian_20.webp';
    expect(cdnSized(local)).toBe(local);
  });

  it('undefined projde', () => {
    expect(cdnSized(undefined)).toBeUndefined();
  });

  it('non-cloudinary http URL nechá beze změny', () => {
    const other = 'https://example.com/foo.webp';
    expect(cdnSized(other)).toBe(other);
  });
});
