/**
 * 10.2l — testy sdílené autosave logiky deníku (papír na mapě i samostatná stránka).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotebookAutosave } from '../useNotebookAutosave';

const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: (...a: unknown[]) => toastError(...a) },
}));

beforeEach(() => {
  vi.useFakeTimers();
  toastError.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('useNotebookAutosave', () => {
  it('initial: content == initialContent, idle, not dirty', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useNotebookAutosave('start', onSave));
    expect(result.current.content).toBe('start');
    expect(result.current.status).toBe('idle');
    expect(result.current.dirty).toBe(false);
  });

  it('setContent → dirty true, neukládá před debounce', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useNotebookAutosave('a', onSave));
    act(() => result.current.setContent('ab'));
    expect(result.current.dirty).toBe(true);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('po debounce 800 ms zavolá onSave a přejde saving→saved→idle', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useNotebookAutosave('a', onSave));
    act(() => result.current.setContent('ab'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(onSave).toHaveBeenCalledWith('ab');
    expect(result.current.status).toBe('saved');
    expect(result.current.dirty).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(result.current.status).toBe('idle');
  });

  it('debounce: rychlé po sobě jdoucí změny uloží jen poslední hodnotu', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useNotebookAutosave('a', onSave));
    act(() => result.current.setContent('ab'));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    act(() => result.current.setContent('abc'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('abc');
  });

  it('flush uloží okamžitě bez čekání na debounce', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useNotebookAutosave('a', onSave));
    act(() => result.current.setContent('ab'));
    await act(async () => {
      result.current.flush();
      await Promise.resolve();
    });
    expect(onSave).toHaveBeenCalledWith('ab');
  });

  it('flush je no-op když není dirty', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useNotebookAutosave('a', onSave));
    act(() => result.current.flush());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('onSave reject → status zpět na idle + toast.error', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useNotebookAutosave('a', onSave));
    act(() => result.current.setContent('ab'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.dirty).toBe(true); // nezapsáno zůstává
    expect(toastError).toHaveBeenCalled();
  });
});
