import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import IkarosNewsManagementPage from '../IkarosNewsManagementPage';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from 'sonner';

const apiGet = vi.mocked(api.get);
const apiPost = vi.mocked(api.post);
const apiPatch = vi.mocked(api.patch);
const apiDelete = vi.mocked(api.delete);

function makeNews(overrides: Partial<{ id: string; title: string; content: string; archived: boolean }> = {}) {
  return {
    id: overrides.id ?? 'n1',
    title: overrides.title ?? 'Test novinka',
    content: overrides.content ?? 'Obsah',
    authorId: 'u1',
    authorName: 'Admin',
    createdAtUtc: '2026-05-14T10:00:00Z',
    isActive: true,
    archived: overrides.archived ?? false,
  };
}

function makeWrapper(initialEntry = '/ikaros/novinky') {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('IkarosNewsManagementPage — render & taby', () => {
  it('zobrazí titulek "Správa novinek" a tab Aktivní/Archiv', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/IkarosNews/count') return Promise.resolve({ total: 0 });
      return Promise.resolve([]);
    });
    render(<IkarosNewsManagementPage />, { wrapper: makeWrapper() });
    expect(screen.getByText('Správa novinek')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Aktivní/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Archiv/ })).toBeInTheDocument();
  });

  it('empty state pro tab Aktivní', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/IkarosNews/count') return Promise.resolve({ total: 0 });
      return Promise.resolve([]);
    });
    render(<IkarosNewsManagementPage />, { wrapper: makeWrapper() });
    await waitFor(() =>
      expect(screen.getByText('Žádné aktivní novinky.')).toBeInTheDocument(),
    );
  });

  it('zobrazí badge počty u tabů z count endpointu', async () => {
    apiGet.mockImplementation((url: string, opts?: { params?: { scope?: string } }) => {
      if (url === '/IkarosNews/count') {
        if (opts?.params?.scope === 'active') return Promise.resolve({ total: 12 });
        if (opts?.params?.scope === 'archived') return Promise.resolve({ total: 3 });
        return Promise.resolve({ total: 0 });
      }
      return Promise.resolve([]);
    });
    render(<IkarosNewsManagementPage />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('list zobrazí novinky s autorem a datem', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/IkarosNews/count') return Promise.resolve({ total: 1 });
      if (url === '/IkarosNews') return Promise.resolve([makeNews({ title: 'První novinka' })]);
      return Promise.resolve([]);
    });
    render(<IkarosNewsManagementPage />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getByText('První novinka')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });
});

describe('IkarosNewsManagementPage — create modal', () => {
  it('klik na "+ Nová novinka" otevře create modal', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/IkarosNews/count') return Promise.resolve({ total: 0 });
      return Promise.resolve([]);
    });
    render(<IkarosNewsManagementPage />, { wrapper: makeWrapper() });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Nová novinka' }));
    // Po otevření modalu se musí v dokumentu objevit formulářová pole "Nadpis"
    // a "Obsah" (= NewsFormModal create body).
    expect(screen.getByLabelText('Nadpis')).toBeInTheDocument();
    expect(screen.getByLabelText('Obsah')).toBeInTheDocument();
    // A primární akce "Vytvořit" (rozlišuje od edit "Uložit").
    expect(
      screen.getByRole('button', { name: 'Vytvořit' }),
    ).toBeInTheDocument();
  });
});

describe('IkarosNewsManagementPage — edit', () => {
  it('klik na edit ikonu otevře edit modal s daty', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/IkarosNews/count') return Promise.resolve({ total: 1 });
      if (url === '/IkarosNews')
        return Promise.resolve([makeNews({ title: 'K editaci' })]);
      return Promise.resolve([]);
    });
    render(<IkarosNewsManagementPage />, { wrapper: makeWrapper() });
    const user = userEvent.setup();

    await waitFor(() => screen.getByText('K editaci'));
    await user.click(screen.getByRole('button', { name: 'Upravit' }));

    expect(screen.getByText('Upravit novinku')).toBeInTheDocument();
    expect(screen.getByLabelText('Nadpis')).toHaveValue('K editaci');
  });
});

describe('IkarosNewsManagementPage — archive', () => {
  it('klik na archive ikonu zavolá POST /:id/archive + toast', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/IkarosNews/count') return Promise.resolve({ total: 1 });
      if (url === '/IkarosNews')
        return Promise.resolve([makeNews({ id: 'n-arch' })]);
      return Promise.resolve([]);
    });
    apiPost.mockResolvedValue(makeNews({ id: 'n-arch', archived: true }));
    render(<IkarosNewsManagementPage />, { wrapper: makeWrapper() });
    const user = userEvent.setup();

    await waitFor(() => screen.getByText('Test novinka'));
    await user.click(screen.getByRole('button', { name: 'Archivovat' }));

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith('/IkarosNews/n-arch/archive');
      expect(toast.success).toHaveBeenCalledWith('Novinka archivována.');
    });
  });
});

describe('IkarosNewsManagementPage — unarchive (tab=archived)', () => {
  it('v archive tabu se zobrazí Obnovit ikona a volá unarchive endpoint', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/IkarosNews/count') return Promise.resolve({ total: 1 });
      if (url === '/IkarosNews')
        return Promise.resolve([makeNews({ id: 'n-un', archived: true })]);
      return Promise.resolve([]);
    });
    apiPost.mockResolvedValue(makeNews({ id: 'n-un', archived: false }));

    render(<IkarosNewsManagementPage />, {
      wrapper: makeWrapper('/ikaros/novinky?tab=archived'),
    });
    const user = userEvent.setup();

    await waitFor(() => screen.getByText('Test novinka'));
    await user.click(screen.getByRole('button', { name: 'Obnovit' }));

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith('/IkarosNews/n-un/unarchive');
      expect(toast.success).toHaveBeenCalledWith('Novinka obnovena.');
    });
  });
});

describe('IkarosNewsManagementPage — delete', () => {
  it('klik na trash otevře ConfirmDialog s varováním', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/IkarosNews/count') return Promise.resolve({ total: 1 });
      if (url === '/IkarosNews')
        return Promise.resolve([makeNews({ title: 'Smazat mě' })]);
      return Promise.resolve([]);
    });
    render(<IkarosNewsManagementPage />, { wrapper: makeWrapper() });
    const user = userEvent.setup();

    await waitFor(() => screen.getByText('Smazat mě'));
    await user.click(screen.getByRole('button', { name: 'Smazat' }));

    expect(screen.getByText('Smazat novinku?')).toBeInTheDocument();
    expect(screen.getByText(/nevratná/i)).toBeInTheDocument();
  });

  it('potvrzení v dialogu volá DELETE + toast + uzavře dialog', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/IkarosNews/count') return Promise.resolve({ total: 1 });
      if (url === '/IkarosNews')
        return Promise.resolve([makeNews({ id: 'n-del' })]);
      return Promise.resolve([]);
    });
    apiDelete.mockResolvedValue(undefined);
    render(<IkarosNewsManagementPage />, { wrapper: makeWrapper() });
    const user = userEvent.setup();

    await waitFor(() => screen.getByText('Test novinka'));
    await user.click(screen.getByRole('button', { name: 'Smazat' }));
    // Dialog otevřen — v dialogu je další button "Smazat" (confirm) a "Zrušit".
    const confirmButtons = screen.getAllByRole('button', { name: 'Smazat' });
    // Druhý "Smazat" je v dialogu (první je trash icon v řádku).
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(apiDelete).toHaveBeenCalledWith('/IkarosNews/n-del');
      expect(toast.success).toHaveBeenCalledWith('Novinka smazána.');
    });
  });

  it('zrušení v dialogu nezavolá DELETE', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/IkarosNews/count') return Promise.resolve({ total: 1 });
      if (url === '/IkarosNews') return Promise.resolve([makeNews()]);
      return Promise.resolve([]);
    });
    render(<IkarosNewsManagementPage />, { wrapper: makeWrapper() });
    const user = userEvent.setup();

    await waitFor(() => screen.getByText('Test novinka'));
    await user.click(screen.getByRole('button', { name: 'Smazat' }));
    await user.click(screen.getByRole('button', { name: 'Zrušit' }));

    expect(apiDelete).not.toHaveBeenCalled();
    expect(screen.queryByText('Smazat novinku?')).not.toBeInTheDocument();
  });
});

describe('IkarosNewsManagementPage — paginace', () => {
  it('paginace se ukáže až při total > LIMIT (20)', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/IkarosNews/count') return Promise.resolve({ total: 50 });
      if (url === '/IkarosNews')
        return Promise.resolve(
          Array.from({ length: 20 }, (_, i) =>
            makeNews({ id: `n${i}`, title: `Item ${i}` }),
          ),
        );
      return Promise.resolve([]);
    });
    render(<IkarosNewsManagementPage />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getByText(/Strana 1 \/ 3/)).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /Předchozí/ }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: /Další/ })).not.toBeDisabled();
  });

  it('paginace se NEukáže pokud total <= LIMIT', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/IkarosNews/count') return Promise.resolve({ total: 5 });
      if (url === '/IkarosNews')
        return Promise.resolve([makeNews()]);
      return Promise.resolve([]);
    });
    render(<IkarosNewsManagementPage />, { wrapper: makeWrapper() });
    await waitFor(() => screen.getByText('Test novinka'));
    expect(screen.queryByText(/Strana/)).not.toBeInTheDocument();
  });
});

describe('IkarosNewsManagementPage — tab switching', () => {
  it('klik na tab Archiv updatuje ?tab a změní query parametr', async () => {
    apiGet.mockImplementation((url: string, opts?: { params?: { scope?: string } }) => {
      if (url === '/IkarosNews/count') return Promise.resolve({ total: 0 });
      if (url === '/IkarosNews') {
        expect(['active', 'archived']).toContain(opts?.params?.scope);
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });
    render(<IkarosNewsManagementPage />, { wrapper: makeWrapper() });
    const user = userEvent.setup();

    await user.click(screen.getByRole('tab', { name: /Archiv/ }));
    await waitFor(() => {
      const archivedCall = apiGet.mock.calls.find(
        ([url, opts]) =>
          url === '/IkarosNews' &&
          (opts as { params?: { scope?: string } })?.params?.scope === 'archived',
      );
      expect(archivedCall).toBeDefined();
    });
  });
});
