import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEffectTool } from './useEffectTool';

beforeEach(() => {
  localStorage.clear();
});

describe('useEffectTool', () => {
  it('default — žádný aktivní nástroj, 2 výchozí rings', () => {
    const { result } = renderHook(() => useEffectTool());
    expect(result.current.activeTool).toBeNull();
    expect(result.current.explosionRings).toHaveLength(2);
    expect(result.current.explosionVariant).toBe('fire');
  });

  it('setTool nastaví nástroj', () => {
    const { result } = renderHook(() => useEffectTool());
    act(() => result.current.setTool('barrier'));
    expect(result.current.activeTool).toBe('barrier');
  });

  it('setSelectedColor persistuje do localStorage', () => {
    const { result } = renderHook(() => useEffectTool());
    act(() => result.current.setSelectedColor('rgba(1,2,3,0.5)'));
    expect(result.current.selectedColor).toBe('rgba(1,2,3,0.5)');
    // Nový hook (nový mount) načte z LS
    const { result: r2 } = renderHook(() => useEffectTool());
    expect(r2.current.selectedColor).toBe('rgba(1,2,3,0.5)');
  });

  it('explosion rings — přidání zachová sekvenční radius', () => {
    const { result } = renderHook(() => useEffectTool());
    act(() => result.current.setExplosionRings([{ radius: 0, damage: 5 }]));
    act(() =>
      result.current.setExplosionRings([
        { radius: 0, damage: 5 },
        { radius: 1, damage: 2 },
      ]),
    );
    expect(result.current.explosionRings.map((r) => r.radius)).toEqual([0, 1]);
  });

  it('guma je samostatný nástroj (erase)', () => {
    const { result } = renderHook(() => useEffectTool());
    act(() => result.current.setTool('erase'));
    expect(result.current.activeTool).toBe('erase');
    act(() => result.current.setTool(null));
    expect(result.current.activeTool).toBeNull();
  });

  it('poškozený LS záznam → fallback default (žádný throw)', () => {
    localStorage.setItem('ikr-map-effect-barrierDC', '{bad json');
    const { result } = renderHook(() => useEffectTool());
    expect(result.current.barrierDC).toBe(10);
  });
});
