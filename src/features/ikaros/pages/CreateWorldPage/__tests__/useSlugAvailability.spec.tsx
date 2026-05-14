import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useSlugAvailability } from '@/features/world/api/useSlugAvailability';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

function wrapper({ children }: PropsWithChildren) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useSlugAvailability', () => {
  it('prázdný slug → idle (žádný request)', () => {
    const { result } = renderHook(() => useSlugAvailability(''), { wrapper });
    expect(result.current).toBe('idle');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('slug s velkými písmeny → invalid (BE check by selhal)', async () => {
    const { result } = renderHook(() => useSlugAvailability('Velky'), {
      wrapper,
    });
    await waitFor(() => expect(result.current).toBe('invalid'), {
      timeout: 1000,
    });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('volný slug → available po debounce', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ available: true });
    const { result } = renderHook(() => useSlugAvailability('volny'), {
      wrapper,
    });
    await waitFor(() => expect(result.current).toBe('available'), {
      timeout: 2000,
    });
    expect(api.get).toHaveBeenCalledWith('/worlds/slug-available', {
      slug: 'volny',
    });
  });

  it('obsazený slug → taken', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ available: false });
    const { result } = renderHook(() => useSlugAvailability('obsazeny'), {
      wrapper,
    });
    await waitFor(() => expect(result.current).toBe('taken'), {
      timeout: 2000,
    });
  });
});
