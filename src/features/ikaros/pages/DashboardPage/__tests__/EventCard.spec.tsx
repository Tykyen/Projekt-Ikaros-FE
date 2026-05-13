import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { EventCard } from '../components/EventCard';
import type { UpcomingEventDto } from '@/shared/types';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { post: vi.fn() },
}));

function makeEvent(overrides: Partial<UpcomingEventDto> = {}): UpcomingEventDto {
  return {
    id: 'e1',
    worldId: 'w1',
    worldName: 'Matrix',
    worldSlug: 'matrix',
    title: 'Boj o Hradec',
    date: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    confirmable: true,
    myRsvp: 'none',
    confirmedCount: 0,
    ...overrides,
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EventCard', () => {
  it('vykreslí název eventu a název světa', () => {
    render(<EventCard event={makeEvent()} />, { wrapper: Wrapper });
    expect(screen.getByText('Boj o Hradec')).toBeInTheDocument();
    expect(screen.getByText('Matrix')).toBeInTheDocument();
  });

  it('odkaz vede na /svet/:worldId', () => {
    render(<EventCard event={makeEvent()} />, { wrapper: Wrapper });
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/svet/w1');
  });

  it('confirmable=false → žádný RSVP button', () => {
    render(<EventCard event={makeEvent({ confirmable: false })} />, {
      wrapper: Wrapper,
    });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('myRsvp=confirmed → aria-pressed=true', () => {
    render(<EventCard event={makeEvent({ myRsvp: 'confirmed' })} />, {
      wrapper: Wrapper,
    });
    const btn = screen.getByRole('button', { name: /Půjdu/i });
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('klik na RSVP zavolá POST /game-events/:id/confirm bez navigace', async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);
    render(<EventCard event={makeEvent()} />, { wrapper: Wrapper });
    const btn = screen.getByRole('button', { name: /Půjdu/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/game-events/e1/confirm');
    });
  });
});
