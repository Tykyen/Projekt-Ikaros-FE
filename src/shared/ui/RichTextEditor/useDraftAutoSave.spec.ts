import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDraftAutoSave } from './useDraftAutoSave';

describe('useDraftAutoSave', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('bez key → žádný auto-save efekt', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDraftAutoSave(undefined, value),
      { initialProps: { value: '<p>x</p>' } },
    );
    expect(result.current.hasUnsavedLocal).toBe(false);
    expect(result.current.restoreCandidate).toBe(null);
    rerender({ value: '<p>changed</p>' });
    act(() => vi.advanceTimersByTime(5000));
    expect(localStorage.length).toBe(0);
  });

  it('change po 3s → uloženo do localStorage', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDraftAutoSave('test-key', value),
      { initialProps: { value: '<p>original</p>' } },
    );
    expect(result.current.hasUnsavedLocal).toBe(false);
    rerender({ value: '<p>edited</p>' });
    expect(result.current.hasUnsavedLocal).toBe(true);
    expect(localStorage.getItem('test-key')).toBe(null); // not yet
    act(() => vi.advanceTimersByTime(3000));
    expect(localStorage.getItem('test-key')).toBe('<p>edited</p>');
  });

  it('debounce — rychlé změny → jen poslední uložená', () => {
    const { rerender } = renderHook(
      ({ value }) => useDraftAutoSave('k1', value),
      { initialProps: { value: '<p>a</p>' } },
    );
    rerender({ value: '<p>ab</p>' });
    act(() => vi.advanceTimersByTime(1500));
    rerender({ value: '<p>abc</p>' });
    act(() => vi.advanceTimersByTime(1500));
    rerender({ value: '<p>abcd</p>' });
    act(() => vi.advanceTimersByTime(3000));
    expect(localStorage.getItem('k1')).toBe('<p>abcd</p>');
  });

  it('mount s existujícím local draftem → restoreCandidate', () => {
    localStorage.setItem('k2', '<p>draft</p>');
    const { result } = renderHook(() =>
      useDraftAutoSave('k2', '<p>original</p>'),
    );
    expect(result.current.restoreCandidate).toBe('<p>draft</p>');
  });

  it('mount s local draftem stejným jako initial → null', () => {
    localStorage.setItem('k3', '<p>same</p>');
    const { result } = renderHook(() => useDraftAutoSave('k3', '<p>same</p>'));
    expect(result.current.restoreCandidate).toBe(null);
  });

  it('clearLocalDraft → odstraní z localStorage', () => {
    localStorage.setItem('k4', '<p>x</p>');
    const { result } = renderHook(() => useDraftAutoSave('k4', '<p>orig</p>'));
    expect(localStorage.getItem('k4')).toBe('<p>x</p>');
    act(() => result.current.clearLocalDraft());
    expect(localStorage.getItem('k4')).toBe(null);
    expect(result.current.restoreCandidate).toBe(null);
  });

  it('custom debounceMs', () => {
    const { rerender } = renderHook(
      ({ value }) => useDraftAutoSave('k5', value, { debounceMs: 500 }),
      { initialProps: { value: '<p>a</p>' } },
    );
    rerender({ value: '<p>b</p>' });
    act(() => vi.advanceTimersByTime(500));
    expect(localStorage.getItem('k5')).toBe('<p>b</p>');
  });
});
