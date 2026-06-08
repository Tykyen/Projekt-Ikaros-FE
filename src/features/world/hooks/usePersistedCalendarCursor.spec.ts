import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedCalendarCursor } from './usePersistedCalendarCursor';

const FALLBACK = () => ({ year: 2026, monthIndex: 5 });

describe('usePersistedCalendarCursor', () => {
  beforeEach(() => localStorage.clear());

  it('bez uložené hodnoty použije fallback', () => {
    const { result } = renderHook(() =>
      usePersistedCalendarCursor('cal-cursor-w1', FALLBACK),
    );
    expect(result.current[0]).toEqual({ year: 2026, monthIndex: 5 });
  });

  it('uloží změnu do localStorage a načte ji při dalším mountu', () => {
    const { result, unmount } = renderHook(() =>
      usePersistedCalendarCursor('cal-cursor-w1', FALLBACK),
    );
    act(() => result.current[1]({ year: 2039, monthIndex: 0 }));
    expect(JSON.parse(localStorage.getItem('cal-cursor-w1')!)).toEqual({
      year: 2039,
      monthIndex: 0,
    });
    unmount();

    const { result: r2 } = renderHook(() =>
      usePersistedCalendarCursor('cal-cursor-w1', FALLBACK),
    );
    expect(r2.current[0]).toEqual({ year: 2039, monthIndex: 0 });
  });

  it('null klíč → persistence vypnutá, vždy fallback', () => {
    const { result } = renderHook(() =>
      usePersistedCalendarCursor(null, FALLBACK),
    );
    act(() => result.current[1]({ year: 2040, monthIndex: 3 }));
    expect(localStorage.length).toBe(0);
  });

  it('nevalidní uložená hodnota → fallback', () => {
    localStorage.setItem('cal-cursor-w1', '{"year":"x"}');
    const { result } = renderHook(() =>
      usePersistedCalendarCursor('cal-cursor-w1', FALLBACK),
    );
    expect(result.current[0]).toEqual({ year: 2026, monthIndex: 5 });
  });
});
