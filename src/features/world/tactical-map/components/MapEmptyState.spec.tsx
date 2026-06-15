import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { MapEmptyState } from './MapEmptyState';
import { api, apiClient } from '@/shared/api/client';
import { postWorldOperation } from '../api/worldOpsApi';

// Mock useCharacterDirectory — vrátíme controlovaný dataset per test
const mockDirectory = vi.fn();
vi.mock('@/features/world/pages/api/useCharacterDirectory', () => ({
  useCharacterDirectory: (worldId: string) => mockDirectory(worldId),
}));
// Mock useActiveScenes — komponenta jen čte `scenes`; klíč factory ponecháme reálný.
vi.mock('../hooks/useActiveScenes', async (orig) => {
  const actual = await orig<typeof import('../hooks/useActiveScenes')>();
  return {
    ...actual,
    useActiveScenes: () => ({ scenes: [], isLoading: false, refetch: vi.fn() }),
  };
});
vi.mock('@/shared/api/client', () => ({
  api: { post: vi.fn() },
  apiClient: { post: vi.fn() },
}));
vi.mock('../api/worldOpsApi', () => ({ postWorldOperation: vi.fn() }));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function makeWrapperWithQc() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, qc };
}

beforeEach(() => {
  mockDirectory.mockReset();
  mockDirectory.mockReturnValue({ data: [], isLoading: false });
});

describe('MapEmptyState', () => {
  it('default (žádné props) — generic hláška', () => {
    const Wrapper = makeWrapper();
    render(<MapEmptyState />, { wrapper: Wrapper });
    expect(screen.getByText(/Žádná aktivní scéna/i)).toBeInTheDocument();
    expect(screen.getByText(/Vyčkej, až tě PJ přiřadí/i)).toBeInTheDocument();
  });

  it('PJ varianta — render "+ Vytvořit první scénu" CTA', () => {
    const Wrapper = makeWrapper();
    render(<MapEmptyState isPJ worldId="w1" currentUserId="pj1" />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText(/Vytvořit první scénu/i)).toBeInTheDocument();
    expect(screen.getByText(/Žádná scéna v tomto světě/i)).toBeInTheDocument();
  });

  it('PJ NEZOBRAZUJE postavy hráče (jiný workflow)', () => {
    mockDirectory.mockReturnValue({
      data: [
        { id: 'c1', slug: 'c1', name: 'Aragorn', isNpc: false, userId: 'pj1' },
      ],
      isLoading: false,
    });
    const Wrapper = makeWrapper();
    render(<MapEmptyState isPJ worldId="w1" currentUserId="pj1" />, {
      wrapper: Wrapper,
    });
    expect(screen.queryByText('Aragorn')).not.toBeInTheDocument();
  });

  it('hráč s postavami — render karet s jmény', () => {
    mockDirectory.mockReturnValue({
      data: [
        { id: 'c1', slug: 'c1', name: 'Aragorn', isNpc: false, userId: 'h1' },
        { id: 'c2', slug: 'c2', name: 'Goblin', isNpc: true, userId: undefined },
        { id: 'c3', slug: 'c3', name: 'Cizí PC', isNpc: false, userId: 'jiny' },
        { id: 'c4', slug: 'c4', name: 'Gimli', isNpc: false, userId: 'h1' },
      ],
      isLoading: false,
    });
    const Wrapper = makeWrapper();
    render(<MapEmptyState worldId="w1" currentUserId="h1" />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText(/Tvé postavy v tomto světě/i)).toBeInTheDocument();
    expect(screen.getByText('Aragorn')).toBeInTheDocument();
    expect(screen.getByText('Gimli')).toBeInTheDocument();
    // NPC ani cizí PC NEjsou
    expect(screen.queryByText('Goblin')).not.toBeInTheDocument();
    expect(screen.queryByText('Cizí PC')).not.toBeInTheDocument();
  });

  it('hráč bez postav — sekce karet skrytá', () => {
    mockDirectory.mockReturnValue({
      data: [
        { id: 'c1', slug: 'c1', name: 'NPC', isNpc: true, userId: undefined },
      ],
      isLoading: false,
    });
    const Wrapper = makeWrapper();
    render(<MapEmptyState worldId="w1" currentUserId="h1" />, {
      wrapper: Wrapper,
    });
    expect(
      screen.queryByText(/Tvé postavy v tomto světě/i),
    ).not.toBeInTheDocument();
  });

  it('hráč s portrétem — renderuje img', () => {
    mockDirectory.mockReturnValue({
      data: [
        {
          id: 'c1',
          slug: 'c1',
          name: 'S obrázkem',
          isNpc: false,
          userId: 'h1',
          imageUrl: 'http://example.test/p.png',
        },
      ],
      isLoading: false,
    });
    const Wrapper = makeWrapper();
    const { container } = render(
      <MapEmptyState worldId="w1" currentUserId="h1" />,
      { wrapper: Wrapper },
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('http://example.test/p.png');
  });

  it('hráč bez portrétu — fallback ikona', () => {
    mockDirectory.mockReturnValue({
      data: [
        {
          id: 'c1',
          slug: 'c1',
          name: 'Bez obrázku',
          isNpc: false,
          userId: 'h1',
        },
      ],
      isLoading: false,
    });
    const Wrapper = makeWrapper();
    render(<MapEmptyState worldId="w1" currentUserId="h1" />, {
      wrapper: Wrapper,
    });
    // Fallback emoji 👤
    expect(screen.getByText('👤')).toBeInTheDocument();
  });

  // C-25 — po vytvoření scény (PJ CTA) musí mutace invalidovat list aktivních
  // scén (REST fallback k WS), jinak PJ orchestrátor ukazuje prázdno.
  it('C-25 — "Vytvořit první scénu" invaliduje activeScenes list', async () => {
    vi.mocked(api.post).mockResolvedValue({
      id: 's1',
      name: 'Nová scéna',
      worldId: 'w1',
    } as never);
    vi.mocked(apiClient.post).mockResolvedValue({} as never);
    vi.mocked(postWorldOperation).mockResolvedValue(undefined as never);
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    render(<MapEmptyState isPJ worldId="w1" currentUserId="pj1" />, {
      wrapper,
    });
    fireEvent.click(screen.getByText(/Vytvořit první scénu/i));
    await waitFor(() => {
      const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
      expect(keys).toContainEqual(['map', 'world-active-scenes', 'w1']);
    });
  });
});
