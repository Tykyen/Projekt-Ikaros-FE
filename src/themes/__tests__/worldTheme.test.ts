import { describe, it, expect } from 'vitest';
import { resolveWorldTheme } from '../worldTheme';
import type { World } from '@/shared/types';

function makeWorld(overrides: Partial<World> = {}): World {
  return {
    id: 'w1',
    name: 'Test',
    slug: 'test',
    system: 'matrix',
    ownerId: 'u1',
    isActive: true,
    accessMode: 'private',
    playerCount: 0,
    createdAt: '2026-05-17',
    updatedAt: '2026-05-17',
    ...overrides,
  };
}

/** Krok 5.7a — vzhled světa je jediný a sdílený (per-uživatel override zrušen). */
describe('resolveWorldTheme', () => {
  it('vrátí themeId ze sdíleného základu World', () => {
    expect(resolveWorldTheme(makeWorld({ themeId: 'ikaros' })).themeId).toBe(
      'ikaros',
    );
  });

  it('fallback na ikaros, když World nemá themeId', () => {
    expect(resolveWorldTheme(makeWorld()).themeId).toBe('ikaros');
  });

  it('null svět → ikaros', () => {
    expect(resolveWorldTheme(null).themeId).toBe('ikaros');
  });

  it('předá custom themeOverrides a themeBackgroundUrl', () => {
    const r = resolveWorldTheme(
      makeWorld({
        themeId: 'ikaros',
        themeOverrides: { '--theme-accent': '#fff' },
        themeBackgroundUrl: '/bg.webp',
      }),
    );
    expect(r.overrides).toEqual({ '--theme-accent': '#fff' });
    expect(r.backgroundUrl).toBe('/bg.webp');
  });
});
