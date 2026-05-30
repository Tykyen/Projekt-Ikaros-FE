import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFogTool } from './useFogTool';

beforeEach(() => {
  localStorage.clear();
});

describe('useFogTool', () => {
  it('default — tool vypnutý, režim odhalit, štětec 1 hex', () => {
    const { result } = renderHook(() => useFogTool());
    expect(result.current.active).toBe(false);
    expect(result.current.mode).toBe('reveal');
    expect(result.current.brushSize).toBe(0);
  });

  it('setActive zapne/vypne tool (session, nepersistuje se)', () => {
    const { result } = renderHook(() => useFogTool());
    act(() => result.current.setActive(true));
    expect(result.current.active).toBe(true);
    // nový mount → active zpět na false (session-only)
    act(() => result.current.setActive(true));
    const { result: r2 } = renderHook(() => useFogTool());
    expect(r2.current.active).toBe(false);
  });

  it('setMode persistuje do localStorage', () => {
    const { result } = renderHook(() => useFogTool());
    act(() => result.current.setMode('fog'));
    expect(result.current.mode).toBe('fog');
    const { result: r2 } = renderHook(() => useFogTool());
    expect(r2.current.mode).toBe('fog');
  });

  it('setBrushSize persistuje do localStorage', () => {
    const { result } = renderHook(() => useFogTool());
    act(() => result.current.setBrushSize(2));
    expect(result.current.brushSize).toBe(2);
    const { result: r2 } = renderHook(() => useFogTool());
    expect(r2.current.brushSize).toBe(2);
  });

  it('poškozený LS záznam → fallback default (žádný throw)', () => {
    localStorage.setItem('ikr-map-fog-mode', '{bad json');
    const { result } = renderHook(() => useFogTool());
    expect(result.current.mode).toBe('reveal');
  });
});
