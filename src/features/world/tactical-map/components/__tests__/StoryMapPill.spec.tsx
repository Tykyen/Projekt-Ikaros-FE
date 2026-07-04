import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { StoryMapPill } from '../StoryMapPill';

const mapEntry = {
  id: 'm1',
  folderId: null,
  title: 'Mapa světa',
  description: '',
  imageUrl: 'https://cdn/m.png',
  order: 0,
  isPublic: true,
  visibleToPlayerIds: [],
  pins: [],
  linkedSceneId: 's1',
  createdAt: '',
  updatedAt: '',
};

// useWorldMaps používá pilulka i viewer → mock vrací propojenou mapu.
vi.mock('@/features/world/maps/api/useWorldMaps', () => ({
  useWorldMaps: () => ({ data: [mapEntry], isLoading: false }),
}));
vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({
    worldId: 'w',
    worldSlug: 'matrix',
    world: null,
    isPJ: true,
    userRole: null,
    character: null,
    loading: false,
  }),
}));

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('StoryMapPill → viewer', () => {
  it('klik na pilulku otevře interaktivní viewer (portál do body)', () => {
    wrap(<StoryMapPill worldId="w" sceneId="s1" />);

    const btn = screen.getByRole('button', { name: /Příběhová mapa/i });
    expect(btn).toBeTruthy();
    // viewer zatím není otevřený
    expect(screen.queryByText('Poslat do chatu')).toBeNull();

    fireEvent.click(btn);

    // po kliku musí být viewer v DOM: topbar „Poslat do chatu" + název mapy
    expect(screen.getByText('Poslat do chatu')).toBeTruthy();
    expect(screen.getByText('Mapa světa')).toBeTruthy();
  });

  it('bez propojené scény se pilulka nevykreslí', () => {
    wrap(<StoryMapPill worldId="w" sceneId="s2" />);
    expect(screen.queryByText(/Příběhová mapa/i)).toBeNull();
  });
});
