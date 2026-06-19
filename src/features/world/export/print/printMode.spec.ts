import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { usePrint, usePrintMode, printModeAtom } from './printMode';

afterEach(() => {
  vi.unstubAllGlobals();
  getDefaultStore().set(printModeAtom, false);
  document.documentElement.removeAttribute('data-printing');
});

describe('usePrint', () => {
  it('zapne print mód, označí cíl a po 2× rAF vytiskne', () => {
    const printSpy = vi.fn();
    vi.stubGlobal('print', printSpy);
    // rAF poběží synchronně → window.print zavolán hned.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });

    const { result } = renderHook(() => ({
      print: usePrint(),
      mode: usePrintMode(),
    }));
    const target = document.createElement('div');

    act(() => result.current.print.triggerPrint(target));

    expect(result.current.mode).toBe(true);
    expect(target.getAttribute('data-print-root')).toBe('');
    expect(document.documentElement.getAttribute('data-printing')).toBe('');
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('po afterprint vrátí stav a uklidí atributy', () => {
    vi.stubGlobal('print', vi.fn());
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });

    const { result } = renderHook(() => ({
      print: usePrint(),
      mode: usePrintMode(),
    }));
    const target = document.createElement('div');

    act(() => result.current.print.triggerPrint(target));
    expect(result.current.mode).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('afterprint'));
    });

    expect(result.current.mode).toBe(false);
    expect(target.hasAttribute('data-print-root')).toBe(false);
    expect(document.documentElement.hasAttribute('data-printing')).toBe(false);
  });
});
