import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDensity, DENSITY_THRESHOLDS } from '../hooks/useDensity';

describe('useDensity (9.4)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('default je detail', () => {
    const { result } = renderHook(() =>
      useDensity({ worldId: 'w1', maxEventsPerDay: 0 }),
    );
    expect(result.current.density).toBe('detail');
    expect(result.current.effectiveDensity).toBe('detail');
    expect(result.current.isFallback).toBe(false);
  });

  it('detail → compact fallback při překročení 8 events/den', () => {
    const { result } = renderHook(() =>
      useDensity({ worldId: 'w1', maxEventsPerDay: DENSITY_THRESHOLDS.compact + 1 }),
    );
    expect(result.current.density).toBe('detail');
    expect(result.current.effectiveDensity).toBe('compact');
    expect(result.current.isFallback).toBe(true);
  });

  it('detail → heat fallback při překročení 30 events/den', () => {
    const { result } = renderHook(() =>
      useDensity({ worldId: 'w1', maxEventsPerDay: DENSITY_THRESHOLDS.heat + 1 }),
    );
    expect(result.current.density).toBe('detail');
    expect(result.current.effectiveDensity).toBe('heat');
  });

  it('compact → heat fallback při překročení 30 events/den', () => {
    const { result } = renderHook(() =>
      useDensity({ worldId: 'w1', maxEventsPerDay: 50 }),
    );
    act(() => result.current.setDensity('compact'));
    expect(result.current.effectiveDensity).toBe('heat');
    expect(result.current.isFallback).toBe(true);
  });

  it('forceUserChoice zachová user volbu i přes fallback', () => {
    const { result } = renderHook(() =>
      useDensity({ worldId: 'w1', maxEventsPerDay: 50 }),
    );
    act(() => result.current.setDensity('detail'));
    expect(result.current.effectiveDensity).toBe('heat');
    act(() => result.current.forceUserChoice());
    expect(result.current.effectiveDensity).toBe('detail');
    expect(result.current.forced).toBe(true);
  });

  it('persistuje density per worldId do localStorage', () => {
    const { result, rerender } = renderHook(
      ({ worldId }) => useDensity({ worldId, maxEventsPerDay: 0 }),
      { initialProps: { worldId: 'w1' } },
    );
    act(() => result.current.setDensity('heat'));
    expect(localStorage.getItem('calendar-density-w1')).toBe('heat');

    rerender({ worldId: 'w2' });
    expect(result.current.density).toBe('detail');

    rerender({ worldId: 'w1' });
    expect(result.current.density).toBe('heat');
  });

  it('setDensity resetuje forced flag', () => {
    const { result } = renderHook(() =>
      useDensity({ worldId: 'w1', maxEventsPerDay: 50 }),
    );
    act(() => result.current.setDensity('detail'));
    act(() => result.current.forceUserChoice());
    expect(result.current.forced).toBe(true);
    act(() => result.current.setDensity('compact'));
    expect(result.current.forced).toBe(false);
  });
});
