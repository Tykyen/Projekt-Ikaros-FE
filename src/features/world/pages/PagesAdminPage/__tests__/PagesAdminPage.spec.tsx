import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PagesAdminPage from '../PagesAdminPage';
import type { PageDirectoryEntry } from '../../api/pages.types';

const DIRECTORY: PageDirectoryEntry[] = [
  {
    id: 'p1',
    slug: 'aralion',
    title: 'Aralion',
    type: 'Lokace',
    order: 0,
    updatedAt: '2026-05-10T12:00:00.000Z',
  },
  {
    id: 'p2',
    slug: 'noviny-1',
    title: 'Denní zprávy',
    type: 'Noviny',
    order: 1,
    updatedAt: '2026-05-20T12:00:00.000Z',
  },
];

let mockDirectory: PageDirectoryEntry[] = [];
const deleteMutate = vi.fn().mockResolvedValue(undefined);
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('../../api/usePagesDirectory', () => ({
  usePagesDirectory: () => ({ data: mockDirectory, isLoading: false }),
}));
vi.mock('../../api/useDeletePage', () => ({
  useDeletePage: () => ({ mutateAsync: deleteMutate, isPending: false }),
}));
vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({
    worldId: 'w1',
    worldSlug: 'matrix',
    loading: false,
  }),
}));
vi.mock('sonner', () => ({
  toast: {
    success: (m: string) => toastSuccess(m),
    error: (m: string) => toastError(m),
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <PagesAdminPage />
    </MemoryRouter>,
  );
}

describe('PagesAdminPage', () => {
  beforeEach(() => {
    mockDirectory = DIRECTORY;
    deleteMutate.mockClear();
    toastSuccess.mockClear();
    toastError.mockClear();
  });

  it('vykreslí tabulku stránek', () => {
    renderPage();
    expect(screen.getByText('Aralion')).toBeInTheDocument();
    expect(screen.getByText('Denní zprávy')).toBeInTheDocument();
  });

  it('prázdný svět ukáže prázdný stav', () => {
    mockDirectory = [];
    renderPage();
    expect(screen.getByText(/nemá žádné stránky/)).toBeInTheDocument();
  });

  it('hledání filtruje', async () => {
    renderPage();
    await userEvent.type(screen.getByPlaceholderText('Najít stránku…'), 'aral');
    expect(screen.getByText('Aralion')).toBeInTheDocument();
    expect(screen.queryByText('Denní zprávy')).not.toBeInTheDocument();
  });

  it('výběr řádku zobrazí lištu hromadných akcí', async () => {
    renderPage();
    const checkbox = screen.getByRole('checkbox', {
      name: 'Vybrat stránku Aralion',
    });
    await userEvent.click(checkbox);
    expect(screen.getByText(/Vybráno:/)).toBeInTheDocument();
  });

  it('mazání řádku — confirm → mutace', async () => {
    renderPage();
    await userEvent.click(
      screen.getByRole('button', { name: 'Smazat Aralion' }),
    );
    expect(
      await screen.findByText(/bude trvale smazána/),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Smazat' }));
    await waitFor(() =>
      expect(deleteMutate).toHaveBeenCalledWith({
        id: 'p1',
        slug: 'aralion',
      }),
    );
  });

  it('hromadné mazání — vybrat vše → smazat → mutace pro každou', async () => {
    renderPage();
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Vybrat všechny stránky' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Smazat vybrané/ }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Smazat' }));
    await waitFor(() => expect(deleteMutate).toHaveBeenCalledTimes(2));
  });
});
