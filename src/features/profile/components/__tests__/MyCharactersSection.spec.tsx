import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MyCharactersSection } from '../MyCharactersSection';

const mockHook = vi.fn();
vi.mock('../../api/useMyCharactersGlobal', () => ({
  useMyCharactersGlobal: () => mockHook(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderSection() {
  return render(
    <MemoryRouter>
      <MyCharactersSection />
    </MemoryRouter>,
  );
}

describe('MyCharactersSection (8.3 / D-075)', () => {
  it('loading — Spinner', () => {
    mockHook.mockReturnValue({ data: undefined, isPending: true, isError: false });
    renderSection();
    expect(screen.getByText(/Načítám/)).toBeInTheDocument();
  });

  it('error — hláška', () => {
    mockHook.mockReturnValue({ data: undefined, isPending: false, isError: true });
    renderSection();
    expect(
      screen.getByText(/Nepodařilo se načíst postavy/),
    ).toBeInTheDocument();
  });

  it('prázdná data — empty state', () => {
    mockHook.mockReturnValue({ data: [], isPending: false, isError: false });
    renderSection();
    expect(
      screen.getByText(/Zatím ti v žádném světě nebyla přidělena postava/),
    ).toBeInTheDocument();
  });

  it('vykreslí list postav s linkem na detail', () => {
    mockHook.mockReturnValue({
      data: [
        {
          worldId: 'w1',
          worldName: 'Matrix',
          worldSlug: 'matrix',
          characterId: 'c1',
          characterSlug: 'frodo',
          characterName: 'Frodo',
          characterImageUrl: undefined,
          isNpc: false,
          kind: 'persona' as const,
        },
      ],
      isPending: false,
      isError: false,
    });
    renderSection();
    expect(screen.getByText('Frodo')).toBeInTheDocument();
    expect(screen.getByText('Matrix')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/svet/matrix/postava/frodo');
  });

  it('badge zobrazí počet postav', () => {
    mockHook.mockReturnValue({
      data: [
        {
          worldId: 'w1',
          worldName: 'A',
          worldSlug: 'a',
          characterId: 'c1',
          characterSlug: 's1',
          characterName: 'N1',
          isNpc: false,
          kind: 'persona' as const,
        },
        {
          worldId: 'w2',
          worldName: 'B',
          worldSlug: 'b',
          characterId: 'c2',
          characterSlug: 's2',
          characterName: 'N2',
          isNpc: false,
          kind: 'persona' as const,
        },
      ],
      isPending: false,
      isError: false,
    });
    renderSection();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
