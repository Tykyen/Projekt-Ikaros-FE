import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { WorldDetailJoinCTA } from '../components/WorldDetailJoinCTA';
import { WorldRole, type World, type WorldMembership } from '@/shared/types';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function makeWorld(accessMode: World['accessMode'] = 'public'): World {
  return {
    id: 'w1',
    name: 'Matrix',
    slug: 'matrix',
    accessMode,
    playerCount: 5,
    system: 'matrix',
    ownerId: 'u1',
    isActive: true,
    favoritePageSlugs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeMembership(role: WorldRole): WorldMembership {
  return {
    id: 'm1',
    userId: 'u2',
    worldId: 'w1',
    role,
    joinedAt: new Date().toISOString(),
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

describe('WorldDetailJoinCTA (Spec 2.4 — 5 stavů)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('anon → "Vstoupit" (otevře login)', () => {
    render(
      <WorldDetailJoinCTA
        world={makeWorld('public')}
        myMembership={null}
        isAuthenticated={false}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('button', { name: /Vstoupit/i })).toBeEnabled();
  });

  it('logged-in + public + ne-member → "Vstoupit" (přímý vstup)', () => {
    render(
      <WorldDetailJoinCTA
        world={makeWorld('public')}
        myMembership={null}
        isAuthenticated={true}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('button', { name: 'Vstoupit' })).toBeEnabled();
  });

  it('logged-in + private + ne-member → "Požádat o vstup"', () => {
    render(
      <WorldDetailJoinCTA
        world={makeWorld('private')}
        myMembership={null}
        isAuthenticated={true}
      />,
      { wrapper: Wrapper },
    );
    expect(
      screen.getByRole('button', { name: /Požádat o vstup/i }),
    ).toBeEnabled();
  });

  it('Zadatel → "Žádost odeslána" disabled', () => {
    render(
      <WorldDetailJoinCTA
        world={makeWorld('private')}
        myMembership={makeMembership(WorldRole.Zadatel)}
        isAuthenticated={true}
      />,
      { wrapper: Wrapper },
    );
    const btn = screen.getByRole('button', { name: /Žádost odeslána/i });
    expect(btn).toBeDisabled();
  });

  it('member (Hrac) → "Vstoupit do hry"', () => {
    render(
      <WorldDetailJoinCTA
        world={makeWorld('public')}
        myMembership={makeMembership(WorldRole.Hrac)}
        isAuthenticated={true}
      />,
      { wrapper: Wrapper },
    );
    expect(
      screen.getByRole('button', { name: /Vstoupit do hry/i }),
    ).toBeEnabled();
  });

  it('closed → "Svět je uzavřen" disabled', () => {
    render(
      <WorldDetailJoinCTA
        world={makeWorld('closed')}
        myMembership={null}
        isAuthenticated={true}
      />,
      { wrapper: Wrapper },
    );
    const btn = screen.getByRole('button', { name: /Svět je uzavřen/i });
    expect(btn).toBeDisabled();
  });
});
