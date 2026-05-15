import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { NovinkyPage } from './NovinkyPage';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole, type IkarosNews } from '@/shared/types';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  apiClient: { post: vi.fn() },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// RichTextEditor (TipTap) je v jsdom těžký — náhrada za prostý render obsahu.
vi.mock('@/shared/ui/RichTextEditor', () => ({
  RichTextEditor: ({ value }: { value: string }) => <div>{value}</div>,
}));

const sampleNews: IkarosNews = {
  id: 'n1',
  title: 'První novinka',
  content: '<p>Obsah novinky</p>',
  authorId: 'a1',
  authorName: 'Admin',
  createdAtUtc: new Date().toISOString(),
  archived: false,
  type: 'info',
};

function mockApi(list: IkarosNews[]) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/IkarosNews/count') {
      return Promise.resolve({ total: list.length }) as never;
    }
    return Promise.resolve(list) as never;
  });
}

function renderAs(role: UserRole | null, list: IkarosNews[] = [sampleNews]) {
  mockApi(list);
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = createStore();
  if (role !== null) {
    store.set(currentUserAtom, {
      id: 'u1',
      email: 'x@y.z',
      username: 'tester',
      displayName: 'Tester',
      role,
      defaultAvatarType: 'male',
      chatColor: '#fff',
      emailVerified: true,
    } as never);
  }
  const Wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter>
      <JotaiProvider store={store}>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </JotaiProvider>
    </MemoryRouter>
  );
  return render(<NovinkyPage />, { wrapper: Wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NovinkyPage', () => {
  it('zobrazí nadpis a seznam novinek', async () => {
    renderAs(null);
    expect(
      screen.getByRole('heading', { name: 'Novinky' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('První novinka')).toBeInTheDocument();
  });

  it('anon nevidí tlačítko Nová novinka ani taby', async () => {
    renderAs(null);
    await screen.findByText('První novinka');
    expect(
      screen.queryByRole('button', { name: 'Nová novinka' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('admin vidí Nová novinka + taby Aktivní/Archiv', async () => {
    renderAs(UserRole.Admin);
    await screen.findByText('První novinka');
    expect(
      screen.getByRole('button', { name: 'Nová novinka' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Aktivní/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Archiv/ })).toBeInTheDocument();
  });

  it('admin vidí inline akce na kartě', async () => {
    renderAs(UserRole.Admin);
    await screen.findByText('První novinka');
    expect(screen.getByRole('button', { name: 'Upravit' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Archivovat' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Smazat' })).toBeInTheDocument();
  });

  it('prázdný seznam → empty state', async () => {
    renderAs(null, []);
    expect(
      await screen.findByText('Zatím žádné novinky.'),
    ).toBeInTheDocument();
  });
});
