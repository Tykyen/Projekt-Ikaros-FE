import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import { useWorldTheme } from '../useWorldTheme';
import type { World } from '@/shared/types';

function makeWrapper(store = createStore()) {
  return ({ children }: PropsWithChildren) => (
    <JotaiProvider store={store}>{children}</JotaiProvider>
  );
}

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
    favoritePageSlugs: [],
    createdAt: '2026-05-17',
    updatedAt: '2026-05-17',
    ...overrides,
  };
}

describe('useWorldTheme', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('vrátí themeId ze sdíleného základu World', () => {
    const world = makeWorld({ themeId: 'sci-fi' });
    const { result } = renderHook(() => useWorldTheme(world), {
      wrapper: makeWrapper(),
    });
    expect(result.current.themeId).toBe('sci-fi');
    expect(result.current.isOverridden).toBe(false);
  });

  it('fallback na DEFAULT_THEME, když World nemá themeId', () => {
    const { result } = renderHook(() => useWorldTheme(makeWorld()), {
      wrapper: makeWrapper(),
    });
    expect(result.current.themeId).toBe('modre-nebe');
  });

  it('uživatelský override přebije sdílený základ', () => {
    const world = makeWorld({ themeId: 'sci-fi' });
    const { result } = renderHook(() => useWorldTheme(world), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.setOverride('kyberpunk'));
    expect(result.current.themeId).toBe('kyberpunk');
    expect(result.current.isOverridden).toBe(true);
  });

  it('reset() smaže override — návrat na sdílený základ', () => {
    const world = makeWorld({ themeId: 'sci-fi' });
    const { result } = renderHook(() => useWorldTheme(world), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.setOverride('kyberpunk'));
    act(() => result.current.reset());
    expect(result.current.themeId).toBe('sci-fi');
    expect(result.current.isOverridden).toBe(false);
  });

  it('předá custom themeOverrides ze sdíleného základu', () => {
    const world = makeWorld({
      themeId: 'sci-fi',
      themeOverrides: { '--theme-accent': '#fff' },
    });
    const { result } = renderHook(() => useWorldTheme(world), {
      wrapper: makeWrapper(),
    });
    expect(result.current.overrides).toEqual({ '--theme-accent': '#fff' });
  });

  it('null svět → DEFAULT_THEME, setOverride je no-op', () => {
    const { result } = renderHook(() => useWorldTheme(null), {
      wrapper: makeWrapper(),
    });
    expect(result.current.themeId).toBe('modre-nebe');
    act(() => result.current.setOverride('kyberpunk'));
    expect(result.current.themeId).toBe('modre-nebe');
  });
});
