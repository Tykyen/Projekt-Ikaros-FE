import { describe, it, expect } from 'vitest';
import { getExtensions } from './extensions';

describe('getExtensions', () => {
  it('bez enableImage neobsahuje Image extension', () => {
    const ext = getExtensions();
    expect(ext.some((e) => e.name === 'image')).toBe(false);
  });

  it('s enableImage obsahuje Image extension', () => {
    const ext = getExtensions({ enableImage: true });
    expect(ext.some((e) => e.name === 'image')).toBe(true);
  });

  it('enableImage:false se chová jako vypnuté', () => {
    const ext = getExtensions({ enableImage: false });
    expect(ext.some((e) => e.name === 'image')).toBe(false);
  });
});
