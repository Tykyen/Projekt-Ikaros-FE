import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { World } from '@/shared/types';
import { WorldLayout } from './WorldLayout';

/**
 * Spec 5.1 — WorldLayout header: accessMode badge, slot postavy,
 * light/full split, chování při chybějícím světě (404).
 */

const useWorldMock = vi.fn();
const useWorldStatusMock = vi.fn();

vi.mock('@/features/world/api/useWorlds', () => ({
  useWorld: (key: string) => useWorldMock(key),
}));
vi.mock('@/features/world/api/useWorldStatus', () => ({
  useWorldStatus: (id: string) => useWorldStatusMock(id),
}));
// 8.3 — slot postavy fetchuje directory; v testu jen prázdný stub,
// aby useQuery nepotřeboval QueryClientProvider.
vi.mock('@/features/world/pages/api/useCharacterDirectory', () => ({
  useCharacterDirectory: () => ({ data: undefined, isLoading: false }),
}));
// 9.3-followup — useWorldSettings stub (filter hiddenNavItems v buildNav).
vi.mock('@/features/world/api/useWorldSettings', () => ({
  useWorldSettings: () => ({ data: undefined, isLoading: false }),
}));
// W-9 — useWorldSocket (WS room + listenery) volá useQueryClient; layout test
// ho neověřuje → no-op stub, aby nepotřeboval QueryClientProvider.
vi.mock('@/features/world/hooks/useWorldSocket', () => ({
  useWorldSocket: () => undefined,
}));

const fakeWorld: World = {
  id: 'w1',
  name: 'Matrix',
  slug: 'matrix',
  genre: 'Sci-fi',
  system: 'd20',
  ownerId: 'owner1',
  isActive: true,
  accessMode: 'public',
  playerCount: 3,
  favoritePageSlugs: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/svet/matrix']}>
      <Routes>
        <Route path="/svet/:worldSlug" element={<WorldLayout />}>
          <Route index element={<div>obsah světa</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WorldLayout — plný header (member)', () => {
  beforeEach(() => {
    useWorldMock.mockReturnValue({ data: fakeWorld, isLoading: false });
    useWorldStatusMock.mockReturnValue({
      status: 'member',
      membership: { role: 1 },
      isLoading: false,
    });
  });

  it('zobrazí slot postavy (fallback na účet)', () => {
    renderLayout();
    // currentUser je v testu null → persona slot fallbackuje na „Účet"
    expect(screen.getByText('Účet')).toBeInTheDocument();
  });

  it('zobrazí nav dropdowny', () => {
    renderLayout();
    // „Informace" je v desktop nav i v mobile draweru → query v rámci <nav>
    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText('Informace')).toBeInTheDocument();
    expect(within(nav).getByText('Kalendář')).toBeInTheDocument();
  });
});

describe('WorldLayout — light header (non-member)', () => {
  beforeEach(() => {
    useWorldMock.mockReturnValue({ data: fakeWorld, isLoading: false });
    useWorldStatusMock.mockReturnValue({
      status: 'non-member',
      membership: null,
      isLoading: false,
    });
  });

  it('nezobrazí nav ani slot postavy', () => {
    renderLayout();
    expect(screen.queryByText('Informace')).not.toBeInTheDocument();
    expect(screen.queryByText('Účet')).not.toBeInTheDocument();
  });
});

describe('WorldLayout — svět nenalezen (404)', () => {
  it('nerenderuje nav, když world chybí', () => {
    useWorldMock.mockReturnValue({ data: null, isLoading: false });
    useWorldStatusMock.mockReturnValue({
      status: 'non-member',
      membership: null,
      isLoading: false,
    });
    renderLayout();
    expect(screen.getByText('Svět nenalezen')).toBeInTheDocument();
    expect(screen.queryByText('Informace')).not.toBeInTheDocument();
  });
});

describe('WorldLayout — loading skeleton', () => {
  it('během načítání nezobrazí název ani nav', () => {
    useWorldMock.mockReturnValue({ data: undefined, isLoading: true });
    useWorldStatusMock.mockReturnValue({
      status: 'non-member',
      membership: null,
      isLoading: true,
    });
    renderLayout();
    expect(screen.queryByText('Matrix')).not.toBeInTheDocument();
    expect(screen.queryByText('Informace')).not.toBeInTheDocument();
  });
});
