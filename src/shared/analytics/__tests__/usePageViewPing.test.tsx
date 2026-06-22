import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

vi.mock('@/shared/api/client', () => ({
  api: { post: vi.fn(() => Promise.resolve()) },
}));

import { api } from '@/shared/api/client';
import { usePageViewPing } from '../usePageViewPing';

const mockPost = api.post as unknown as ReturnType<typeof vi.fn>;

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={['/ikaros/clanky']}>{children}</MemoryRouter>;
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('usePageViewPing (15B.7)', () => {
  it('odešle jeden ping s aktuální cestou', () => {
    renderHook(() => usePageViewPing(), { wrapper });
    expect(mockPost).toHaveBeenCalledTimes(1);
    const [url, body] = mockPost.mock.calls[0];
    expect(url).toBe('/analytics/pageview');
    expect(body.path).toBe('/ikaros/clanky');
    expect(typeof body.sessionId).toBe('string');
    expect(body.sessionId.length).toBeGreaterThan(0);
  });

  it('sessionId přežije v sessionStorage (stejný nonce)', () => {
    renderHook(() => usePageViewPing(), { wrapper });
    const sid = mockPost.mock.calls[0][1].sessionId;
    expect(sessionStorage.getItem('ik_anon_sid')).toBe(sid);
  });

  it('re-render bez změny cesty → žádný další ping', () => {
    const { rerender } = renderHook(() => usePageViewPing(), { wrapper });
    rerender();
    expect(mockPost).toHaveBeenCalledTimes(1);
  });
});
