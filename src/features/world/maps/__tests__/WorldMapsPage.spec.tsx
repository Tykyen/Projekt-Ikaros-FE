import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { WorldMapEntry } from '../types';
import WorldMapsPage from '../WorldMapsPage';

const ctx = vi.hoisted(() => ({ isPJ: true }));
const mapsData = vi.hoisted(() => ({ items: [] as WorldMapEntry[] }));

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({
    worldId: 'w1',
    worldSlug: 's',
    isPJ: ctx.isPJ,
    loading: false,
  }),
}));
vi.mock('../api/useWorldMaps', () => ({
  useWorldMaps: () => ({ data: mapsData.items, isLoading: false }),
}));
vi.mock('../api/useWorldMapMutations', () => ({
  useCreateWorldMap: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateWorldMap: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteWorldMap: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReorderWorldMaps: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('../api/useWorldMapFolders', () => ({
  useWorldMapFolders: () => ({ data: [], isLoading: false }),
}));
vi.mock('../api/useWorldMapFolderMutations', () => ({
  useCreateWorldMapFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateWorldMapFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteWorldMapFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function makeMap(over: Partial<WorldMapEntry> = {}): WorldMapEntry {
  return {
    id: `m-${Math.random()}`,
    folderId: null,
    title: 'Mapa',
    description: '',
    imageUrl: 'https://cdn/m.png',
    order: 0,
    isPublic: false,
    visibleToPlayerIds: [],
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

describe('WorldMapsPage', () => {
  beforeEach(() => {
    ctx.isPJ = true;
    mapsData.items = [];
  });

  it('PJ: prázdný atlas → Upravit; po kliknutí se objeví „Mapa" a „Složka"', () => {
    render(<WorldMapsPage />);
    const editBtn = screen.getByRole('button', { name: 'Upravit' });
    fireEvent.click(editBtn);
    expect(screen.getByRole('button', { name: 'Mapa' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Složka' }),
    ).toBeInTheDocument();
  });

  it('hráč: prázdný atlas → hláška, žádné „Upravit"', () => {
    ctx.isPJ = false;
    render(<WorldMapsPage />);
    expect(
      screen.getByText('Zatím tu pro tebe nic není.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Upravit' }),
    ).not.toBeInTheDocument();
  });

  it('PJ vidí chip viditelnosti na kartě', () => {
    mapsData.items = [makeMap({ id: 'a', title: 'Kontinent', isPublic: true })];
    render(<WorldMapsPage />);
    expect(screen.getByText('Kontinent')).toBeInTheDocument();
    expect(screen.getByText('Veřejná')).toBeInTheDocument();
  });

  it('hráč chip viditelnosti nevidí', () => {
    ctx.isPJ = false;
    mapsData.items = [makeMap({ id: 'a', title: 'Kontinent', isPublic: true })];
    render(<WorldMapsPage />);
    expect(screen.getByText('Kontinent')).toBeInTheDocument();
    expect(screen.queryByText('Veřejná')).not.toBeInTheDocument();
  });
});
