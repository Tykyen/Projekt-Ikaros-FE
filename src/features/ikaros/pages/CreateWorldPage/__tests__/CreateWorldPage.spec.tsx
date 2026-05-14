import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import CreateWorldPage from '../CreateWorldPage';
import { api } from '@/shared/api/client';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
  return render(<CreateWorldPage />, { wrapper: Wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
  // D-NEW-slug-check — default: každý slug volný.
  vi.mocked(api.get).mockImplementation(async (url: string) => {
    if (url === '/worlds/slug-available') return { available: true };
    return null;
  });
});

describe('CreateWorldPage', () => {
  it('submit disabled, dokud nejsou vyplněná povinná pole; po vyplnění minima volá POST /worlds', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      id: 'w1',
      name: 'Můj svět',
      slug: 'muj-svet',
      system: 'matrix',
      ownerId: 'u1',
      isActive: true,
      accessMode: 'private',
      playerCount: 0,
      favoritePageSlugs: [],
      createdAt: '',
      updatedAt: '',
    });

    renderPage();

    const submit = screen.getByRole('button', { name: /Vytvořit svět/ });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Název světa/), {
      target: { value: 'Můj svět' },
    });
    fireEvent.change(screen.getByLabelText(/^Žánr$/), {
      target: { value: 'Fantasy' },
    });

    // Slug availability debounce + fetch → submit enabled až po `available`.
    await waitFor(() => expect(submit).not.toBeDisabled(), {
      timeout: 2000,
    });

    fireEvent.click(submit);

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(api.post).toHaveBeenCalledWith(
      '/worlds',
      expect.objectContaining({
        name: 'Můj svět',
        slug: 'muj-svet',
        genre: 'Fantasy',
        accessMode: 'private',
        system: 'matrix',
        maxPlayers: null,
      }),
    );

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/svet/w1'));
  });

  it('po manuálním editu adresy už auto-derive z názvu nezpřepisuje slug', () => {
    renderPage();

    const nameInput = screen.getByLabelText(/Název světa/);
    const slugInput = screen.getByLabelText(/^Adresa$/);

    fireEvent.change(nameInput, { target: { value: 'První' } });
    expect((slugInput as HTMLInputElement).value).toBe('prvni');

    fireEvent.change(slugInput, { target: { value: 'muj-vlastni' } });
    expect((slugInput as HTMLInputElement).value).toBe('muj-vlastni');

    fireEvent.change(nameInput, { target: { value: 'Druhý název' } });
    expect((slugInput as HTMLInputElement).value).toBe('muj-vlastni');
  });

  it('WORLD_QUOTA_REACHED z BE → specifický toast', async () => {
    const { toast } = await import('sonner');
    vi.mocked(api.post).mockRejectedValueOnce({
      response: {
        data: { error: { code: 'WORLD_QUOTA_REACHED', message: 'limit' } },
      },
    });

    renderPage();
    fireEvent.change(screen.getByLabelText(/Název světa/), {
      target: { value: 'Šestý' },
    });
    fireEvent.change(screen.getByLabelText(/^Žánr$/), {
      target: { value: 'Fantasy' },
    });

    const submit = screen.getByRole('button', { name: /Vytvořit svět/ });
    await waitFor(() => expect(submit).not.toBeDisabled(), { timeout: 2000 });

    fireEvent.click(submit);

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/limitu 5 aktivních světů/),
    );
  });

  it('„Vlastní žánr" odhalí free-text input a posílá jeho hodnotu místo labelu', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      id: 'w2',
      name: 'Test svět',
      slug: 'test-svet',
      system: 'matrix',
      ownerId: 'u1',
      isActive: true,
      accessMode: 'private',
      playerCount: 0,
      favoritePageSlugs: [],
      createdAt: '',
      updatedAt: '',
    });

    renderPage();
    fireEvent.change(screen.getByLabelText(/Název světa/), {
      target: { value: 'Test svět' },
    });
    fireEvent.change(screen.getByLabelText(/^Žánr$/), {
      target: { value: 'Vlastní' },
    });

    const customGenreInput = await screen.findByPlaceholderText(
      /Pojmenuj vlastní žánr/,
    );
    fireEvent.change(customGenreInput, { target: { value: 'Steampunk' } });

    const submit = screen.getByRole('button', { name: /Vytvořit svět/ });
    await waitFor(() => expect(submit).not.toBeDisabled(), { timeout: 2000 });

    fireEvent.click(submit);

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(api.post).toHaveBeenCalledWith(
      '/worlds',
      expect.objectContaining({ genre: 'Steampunk' }),
    );
  });
});
