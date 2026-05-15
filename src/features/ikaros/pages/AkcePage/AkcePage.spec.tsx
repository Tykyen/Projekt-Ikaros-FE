import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { AkcePage } from './AkcePage';
import { currentUserAtom, accessTokenAtom } from '@/shared/store/authStore';
import { UserRole, type IkarosEvent } from '@/shared/types';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiClient: { post: vi.fn() },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function makeEvent(overrides: Partial<IkarosEvent> = {}): IkarosEvent {
  return {
    id: 'e1',
    title: 'Komunitní schůzka',
    date: new Date().toISOString(),
    description: '',
    imageUrl: null,
    imageFocalX: null,
    imageFocalY: null,
    confirmable: true,
    confirmedCount: 0,
    confirmedBy: [],
    myRsvp: 'none',
    authorId: 'a1',
    authorName: 'Admin',
    createdAtUtc: new Date().toISOString(),
    isActive: true,
    ...overrides,
  };
}

function renderPage(role: UserRole | null, events: IkarosEvent[]) {
  vi.mocked(api.get).mockResolvedValue(events as never);
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = createStore();
  store.set(accessTokenAtom, 'test-token' as never);
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
  return render(<AkcePage />, { wrapper: Wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AkcePage', () => {
  it('zobrazí nadpis Akce a hlavičky dnů v týdnu', () => {
    renderPage(null, []);
    expect(screen.getByRole('heading', { name: 'Akce' })).toBeInTheDocument();
    expect(screen.getByText('Po')).toBeInTheDocument();
    expect(screen.getByText('Ne')).toBeInTheDocument();
  });

  it('akce v aktuálním měsíci se zobrazí jako chip v mřížce', async () => {
    renderPage(null, [makeEvent()]);
    expect(await screen.findByTitle('Komunitní schůzka')).toBeInTheDocument();
  });

  it('navigace „Další měsíc" změní popisek měsíce', () => {
    renderPage(null, []);
    const now = new Date();
    const nextLabel = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
    ).toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
    fireEvent.click(screen.getByLabelText('Další měsíc'));
    expect(screen.getByText(nextLabel)).toBeInTheDocument();
  });

  it('anon nevidí tlačítko Nová akce', () => {
    renderPage(null, []);
    expect(
      screen.queryByRole('button', { name: 'Nová akce' }),
    ).not.toBeInTheDocument();
  });

  it('admin vidí tlačítko Nová akce', () => {
    renderPage(UserRole.Admin, []);
    expect(
      screen.getByRole('button', { name: 'Nová akce' }),
    ).toBeInTheDocument();
  });

  it('klik na akci otevře detail modal', async () => {
    renderPage(null, [makeEvent()]);
    fireEvent.click(await screen.findByTitle('Komunitní schůzka'));
    expect(await screen.findByText('Detail akce')).toBeInTheDocument();
  });
});
