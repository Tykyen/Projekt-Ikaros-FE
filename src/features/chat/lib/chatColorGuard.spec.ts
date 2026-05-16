import { describe, it, expect } from 'vitest';
import { guardChatColor, parseColor } from './chatColorGuard';

// pozadí hospoda theme (--theme-surface)
const DARK_SURFACE = 'rgba(44, 26, 10, 0.92)';
const LIGHT_SURFACE = '#f0deaa';

describe('parseColor', () => {
  it('parsuje #rrggbb', () => {
    expect(parseColor('#ff8800')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('parsuje zkrácený #rgb', () => {
    expect(parseColor('#f80')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('parsuje rgba()', () => {
    expect(parseColor('rgba(44, 26, 10, 0.92)')).toEqual({ r: 44, g: 26, b: 10 });
  });

  it('vrací null pro nesmysl', () => {
    expect(parseColor('není-barva')).toBeNull();
  });
});

describe('guardChatColor', () => {
  it('null/prázdné → fallback', () => {
    expect(guardChatColor(null, DARK_SURFACE)).toBe('var(--theme-text)');
    expect(guardChatColor('', DARK_SURFACE)).toBe('var(--theme-text)');
  });

  it('neparsovatelná barva → fallback', () => {
    expect(guardChatColor('nesmysl', DARK_SURFACE)).toBe('var(--theme-text)');
  });

  it('barva s dostatečným kontrastem zůstane beze změny', () => {
    expect(guardChatColor('#ffffff', DARK_SURFACE)).toBe('#ffffff');
  });

  it('tmavá barva na tmavém pozadí se zesvětlí', () => {
    const out = guardChatColor('#3a2a1a', DARK_SURFACE);
    expect(out).not.toBe('#3a2a1a');
    expect(out).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('světlá barva na světlém pozadí se ztmaví', () => {
    const out = guardChatColor('#fff4d0', LIGHT_SURFACE);
    expect(out).not.toBe('#fff4d0');
    expect(out).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('neznámé pozadí → barva se nechá být', () => {
    expect(guardChatColor('#123456', 'nesmysl')).toBe('#123456');
  });
});
