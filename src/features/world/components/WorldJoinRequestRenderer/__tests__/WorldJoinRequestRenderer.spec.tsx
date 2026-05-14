import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  WorldJoinRequestLeft,
  WorldJoinRequestMid,
  WorldJoinRequestActions,
} from '../WorldJoinRequestRenderer';
import { api } from '@/shared/api/client';
import type { WorldJoinRequestListItem } from '@/shared/types';

vi.mock('@/shared/api/client', () => ({
  api: { post: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function makeItem(): WorldJoinRequestListItem {
  return {
    membershipId: 'm1',
    worldId: 'w1',
    worldName: 'Šedý hrad',
    worldSlug: 'sedy-hrad',
    requestedAt: new Date(Date.now() - 60_000).toISOString(),
    requester: {
      id: 'u9',
      username: 'frodo',
      avatarUrl: undefined,
    },
  };
}

function Wrapper({ children }: PropsWithChildren) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe('WorldJoinRequestRenderer (Spec 2.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderLeft: avatar img s alt jménem requestera', () => {
    const { container } = render(<WorldJoinRequestLeft item={makeItem()} />, {
      wrapper: Wrapper,
    });
    // UserAvatar rendruje img (s defaultním obrázkem pro being avatar).
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('alt')).toMatch(/frodo/i);
  });

  it('renderMid: username + worldName + link na /info', () => {
    render(<WorldJoinRequestMid item={makeItem()} />, { wrapper: Wrapper });
    expect(screen.getByText('frodo')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Šedý hrad' });
    expect(link.getAttribute('href')).toBe('/svet/w1/info');
  });

  it('Accept volá POST /worlds/:id/join-requests/:m/accept', async () => {
    vi.mocked(api.post).mockResolvedValue({ ok: true });
    const onResolve = vi.fn();
    render(
      <WorldJoinRequestActions
        item={makeItem()}
        onResolve={onResolve}
        isLoading={false}
      />,
      { wrapper: Wrapper },
    );

    fireEvent.click(screen.getByRole('button', { name: /Přijmout/i }));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/worlds/w1/join-requests/m1/accept',
        {},
      );
      expect(onResolve).toHaveBeenCalled();
    });
  });

  it('Reject zobrazí confirm dialog před voláním', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onResolve = vi.fn();
    render(
      <WorldJoinRequestActions
        item={makeItem()}
        onResolve={onResolve}
        isLoading={false}
      />,
      { wrapper: Wrapper },
    );

    fireEvent.click(screen.getByRole('button', { name: /Odmítnout/i }));

    expect(confirmSpy).toHaveBeenCalled();
    // Confirm vrátil false → žádný API call.
    expect(api.post).not.toHaveBeenCalled();
    expect(onResolve).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
