import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { MapEmptyState } from './MapEmptyState';

// Mock useCharacterDirectory — vrátíme controlovaný dataset per test
const mockDirectory = vi.fn();
vi.mock('@/features/world/pages/api/useCharacterDirectory', () => ({
  useCharacterDirectory: (worldId: string) => mockDirectory(worldId),
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
});
