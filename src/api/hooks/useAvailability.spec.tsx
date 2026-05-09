import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useCheckUsername, useCheckEmail } from './useAvailability';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(),
  },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useCheckUsername', () => {
  it('není enabled pro krátký username (< 3 znaky)', async () => {
    const { result } = renderHook(() => useCheckUsername('ab'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle');
    });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('není enabled pro username s @', async () => {
    const { result } = renderHook(() => useCheckUsername('user@bad'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle');
    });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('není enabled pro 32+ znaky', async () => {
    const { result } = renderHook(
      () => useCheckUsername('a'.repeat(33)),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle');
    });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('debounced — rychlé po sobě jdoucí změny vyvolají jen 1 BE volání s poslední hodnotou', async () => {
    vi.useFakeTimers();
    vi.mocked(api.get).mockResolvedValue({ available: true });

    const { rerender } = renderHook(
      ({ value }: { value: string }) => useCheckUsername(value),
      {
        wrapper: makeWrapper(),
        initialProps: { value: 'a' },
      },
    );

    rerender({ value: 'ab' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 'abc' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 'abcd' });

    expect(api.get).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    vi.useRealTimers();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });
    expect(api.get).toHaveBeenCalledWith('/auth/check-username', {
      u: 'abcd',
    });
  });
});

describe('useCheckEmail', () => {
  it('není enabled pro řetězec bez @', async () => {
    const { result } = renderHook(() => useCheckEmail('noatsign'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle');
    });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('není enabled pro krátký vstup (< 5 znaků)', async () => {
    const { result } = renderHook(() => useCheckEmail('a@b'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle');
    });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('debounced — volá BE s poslední hodnotou po 400ms ticha', async () => {
    vi.useFakeTimers();
    vi.mocked(api.get).mockResolvedValue({ available: true });

    const { rerender } = renderHook(
      ({ value }: { value: string }) => useCheckEmail(value),
      {
        wrapper: makeWrapper(),
        initialProps: { value: '' },
      },
    );

    rerender({ value: 'a@b.cc' });
    expect(api.get).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    vi.useRealTimers();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/auth/check-email', {
        e: 'a@b.cc',
      });
    });
  });
});
