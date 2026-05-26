import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import { useUserPreferredCurrency } from './useUserPreferredCurrency';
import type { WorldCurrencyItem } from '../types';

const items: WorldCurrencyItem[] = [
  { id: 'a', code: 'ZL', name: 'Zlaťák', symbol: 'Zl', rate: 1.0 },
  { id: 'b', code: 'ST', name: 'Stříbrňák', symbol: 'St', rate: 0.1 },
  { id: 'c', code: 'MD', name: 'Měďák', symbol: 'Md', rate: 0.01 },
];

function makeWrapper() {
  const store = createStore();
  return ({ children }: PropsWithChildren) => (
    <JotaiProvider store={store}>{children}</JotaiProvider>
  );
}

beforeEach(() => {
  // Clean localStorage mezi testy — atomFamily drží references na atomy,
  // ale storage value je stripnutá.
  localStorage.clear();
});

describe('useUserPreferredCurrency', () => {
  it('default resolvedCode = base (první item) když nic není uloženo', () => {
    const { result } = renderHook(() => useUserPreferredCurrency('w1', items), {
      wrapper: makeWrapper(),
    });
    expect(result.current.preferredCode).toBeNull();
    expect(result.current.resolvedCode).toBe('ZL');
    expect(result.current.resolvedItem?.code).toBe('ZL');
  });

  it('setPreferred uloží do localStorage a aktualizuje resolved', () => {
    const { result } = renderHook(() => useUserPreferredCurrency('w1', items), {
      wrapper: makeWrapper(),
    });
    act(() => {
      result.current.setPreferred('ST');
    });
    expect(result.current.preferredCode).toBe('ST');
    expect(result.current.resolvedCode).toBe('ST');
    expect(localStorage.getItem('ikaros.currency.preferred.w1')).toBe('"ST"');
  });

  it('fallback na base když uložená měna není v items (smazaná PJ-em)', () => {
    localStorage.setItem('ikaros.currency.preferred.w1', '"DELETED"');
    const { result } = renderHook(() => useUserPreferredCurrency('w1', items), {
      wrapper: makeWrapper(),
    });
    expect(result.current.preferredCode).toBe('DELETED');
    expect(result.current.resolvedCode).toBe('ZL'); // base fallback
    expect(result.current.resolvedItem?.code).toBe('ZL');
  });

  it('různé worldId mají nezávislou perzistenci', () => {
    const { result: r1 } = renderHook(
      () => useUserPreferredCurrency('w1', items),
      { wrapper: makeWrapper() },
    );
    act(() => {
      r1.current.setPreferred('ST');
    });

    const { result: r2 } = renderHook(
      () => useUserPreferredCurrency('w2', items),
      { wrapper: makeWrapper() },
    );
    expect(r2.current.preferredCode).toBeNull();
    expect(r2.current.resolvedCode).toBe('ZL');
  });

  it('resolvedItem === null + resolvedCode === "" když items je prázdné', () => {
    const { result } = renderHook(() => useUserPreferredCurrency('w1', []), {
      wrapper: makeWrapper(),
    });
    expect(result.current.resolvedItem).toBeNull();
    expect(result.current.resolvedCode).toBe('');
  });
});
