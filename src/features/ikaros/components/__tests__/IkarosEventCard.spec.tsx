import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import { IkarosEventCard } from '../IkarosEventCard';
import { accessTokenAtom, currentUserAtom } from '@/shared/store/authStore';
import type { IkarosEvent, User } from '@/shared/types';
import { UserRole } from '@/shared/types';

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(() => Promise.resolve(undefined)),
  },
  apiClient: { post: vi.fn() },
}));

function renderCard(event: IkarosEvent, currentUser: User | null = null) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const store = createStore();
  store.set(accessTokenAtom, 'token-x');
  store.set(currentUserAtom, currentUser);
  const Wrapper = ({ children }: PropsWithChildren) => (
    <JotaiProvider store={store}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </JotaiProvider>
  );
  return render(<IkarosEventCard event={event} />, { wrapper: Wrapper });
}

function makeUser(role: UserRole): User {
  return {
    id: 'me',
    username: 'tester',
    displayName: 'Tester',
    role,
  } as User;
}

const baseEvent: IkarosEvent = {
  id: 'e1',
  title: 'Komunitní setkání',
  date: '2030-01-01T18:00:00Z',
  description: 'Popis akce',
  imageUrl: null,
  imageFocalX: null,
  imageFocalY: null,
  confirmable: true,
  confirmedCount: 0,
  confirmedBy: [],
  myRsvp: 'none',
  authorId: 'a',
  authorName: 'Admin',
  createdAtUtc: '2026-05-14T10:00:00Z',
  isActive: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('IkarosEventCard', () => {
  it('renderuje název, popis', () => {
    renderCard(baseEvent);
    expect(screen.getByText('Komunitní setkání')).toBeInTheDocument();
    expect(screen.getByText('Popis akce')).toBeInTheDocument();
  });

  it('confirmable=true → zobrazí RSVP tlačítko', () => {
    renderCard(baseEvent);
    expect(
      screen.getByRole('button', { name: /Zúčastním se/i }),
    ).toBeInTheDocument();
  });

  it('confirmable=false → žádné RSVP tlačítko', () => {
    renderCard({ ...baseEvent, confirmable: false });
    expect(
      screen.queryByRole('button', { name: /Zúčastním se/i }),
    ).not.toBeInTheDocument();
  });

  it('myRsvp=confirmed → tlačítko ukazuje "Účastním se" + aria-pressed=true', () => {
    renderCard({ ...baseEvent, myRsvp: 'confirmed' });
    const btn = screen.getByRole('button', { name: /Účastním se/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('confirmedCount > 0 → zobrazí seznam účastníků', () => {
    renderCard({
      ...baseEvent,
      confirmedCount: 3,
      confirmedBy: [
        { userId: 'u1', userName: 'Alice' },
        { userId: 'u2', userName: 'Bob' },
        { userId: 'u3', userName: 'Cyril' },
      ],
    });
    expect(screen.getByText(/3 účastníků/)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Cyril')).toBeInTheDocument();
  });

  it('confirmedCount=0 → seznam účastníků skryt', () => {
    renderCard(baseEvent);
    expect(screen.queryByText(/účastník/)).not.toBeInTheDocument();
  });

  it('imageUrl null → fallback (žádný <img>)', () => {
    const { container } = renderCard(baseEvent);
    expect(container.querySelector('img')).toBeNull();
  });

  it('imageUrl set → render <img>', () => {
    const { container } = renderCard({
      ...baseEvent,
      imageUrl: 'https://res.cloudinary.com/x/image/upload/test.jpg',
    });
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute(
      'src',
      'https://res.cloudinary.com/x/image/upload/test.jpg',
    );
  });

  it('imageFocalX/Y null → object-position center (50% 50%)', () => {
    const { container } = renderCard({
      ...baseEvent,
      imageUrl: 'https://x/y.jpg',
    });
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.style.objectPosition).toBe('50% 50%');
  });

  it('imageFocalX/Y set → object-position podle focal pointu', () => {
    const { container } = renderCard({
      ...baseEvent,
      imageUrl: 'https://x/y.jpg',
      imageFocalX: 25,
      imageFocalY: 75,
    });
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.style.objectPosition).toBe('25% 75%');
  });

  it('kebab není visible když není přihlášený uživatel', () => {
    renderCard(baseEvent, null);
    expect(
      screen.queryByRole('button', { name: 'Akce' }),
    ).not.toBeInTheDocument();
  });

  it('kebab není visible pro Ikarus (non-admin role)', () => {
    renderCard(baseEvent, makeUser(UserRole.Ikarus));
    expect(
      screen.queryByRole('button', { name: 'Akce' }),
    ).not.toBeInTheDocument();
  });

  it('kebab je visible pro Admina', () => {
    renderCard(baseEvent, makeUser(UserRole.Admin));
    expect(screen.getByRole('button', { name: 'Akce' })).toBeInTheDocument();
  });

  it('Superadmin: kebab → Smazat → confirm → DELETE volá api', async () => {
    const user = userEvent.setup();
    const { api } = await import('@/shared/api/client');
    const deleteSpy = api.delete as unknown as ReturnType<typeof vi.fn>;
    deleteSpy.mockResolvedValueOnce(undefined);

    renderCard(baseEvent, makeUser(UserRole.Superadmin));

    await user.click(screen.getByRole('button', { name: 'Akce' }));
    await user.click(screen.getByRole('menuitem', { name: /Smazat/i }));

    expect(screen.getByText('Smazat akci')).toBeInTheDocument();

    const { within } = await import('@testing-library/react');
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /^Smazat$/ }));

    expect(deleteSpy).toHaveBeenCalledWith('/ikaros-events/e1');
  });
});
