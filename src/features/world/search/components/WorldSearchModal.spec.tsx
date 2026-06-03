import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WorldSearchModal } from './WorldSearchModal';
import type { SearchResult } from '../types';

/** 13.1 — render, navigace klikem, keyboard nav (↑/↓ + Enter). */

const useWorldSearchMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('../api/useWorldSearch', () => ({
  useWorldSearch: (p: unknown) => useWorldSearchMock(p),
}));
vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

const results: SearchResult[] = [
  { id: '1', title: 'Neo', slug: 'neo', score: 0.9, providerKey: 'meili', providerName: 'M' },
  { id: '2', title: 'Trinity', slug: 'trinity', score: 0.7, providerKey: 'meili', providerName: 'M' },
];

function renderModal() {
  return render(
    <MemoryRouter>
      <WorldSearchModal open onClose={vi.fn()} worldId="w1" worldSlug="matrix" />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useWorldSearchMock.mockReset();
  navigateMock.mockReset();
});

describe('WorldSearchModal', () => {
  it('bez výsledků ukáže úvodní hint', () => {
    useWorldSearchMock.mockReturnValue({ data: [], isFetching: false });
    renderModal();
    expect(screen.getByText(/Začni psát/i)).toBeInTheDocument();
  });

  it('klik na výsledek naviguje na stránku světa', () => {
    useWorldSearchMock.mockReturnValue({ data: results, isFetching: false });
    renderModal();
    fireEvent.click(screen.getByText('Neo'));
    expect(navigateMock).toHaveBeenCalledWith('/svet/matrix/neo');
  });

  it('keyboard nav: ↓ + Enter naviguje na druhý výsledek', () => {
    useWorldSearchMock.mockReturnValue({ data: results, isFetching: false });
    renderModal();
    const input = screen.getByLabelText(/Hledat stránky/i);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(navigateMock).toHaveBeenCalledWith('/svet/matrix/trinity');
  });
});
