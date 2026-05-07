import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { useTheme } from '../useTheme';
import type { PropsWithChildren } from 'react';

function makeWrapper(store = createStore()) {
  return ({ children }: PropsWithChildren) => (
    <JotaiProvider store={store}>{children}</JotaiProvider>
  );
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('returns DEFAULT_THEME initially', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: makeWrapper() });
    expect(result.current.themeId).toBe('modre-nebe');
  });

  it('setTheme updates the atom synchronously', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: makeWrapper() });
    act(() => {
      result.current.setTheme('temna-cerven');
    });
    expect(result.current.themeId).toBe('temna-cerven');
  });

  it('exposes theme metadata', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: makeWrapper() });
    expect(result.current.theme.name).toBe('Modré nebe');
    expect(result.current.theme.id).toBe('modre-nebe');
  });
});
