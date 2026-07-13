import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { PublicProfileActions } from '../PublicProfileActions';

// Friendship API + moderace mockujeme — testujeme jen admin deep-link.
vi.mock('@/features/friendships/api/useFriendshipStatus', () => ({
  useFriendshipStatus: () => ({ data: { kind: 'none' } }),
}));
vi.mock('@/features/friendships/api/useFriendshipMutations', () => ({
  useSendFriendRequest: () => ({ mutate: vi.fn(), isPending: false }),
  useAcceptFriendRequest: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveFriend: () => ({ mutate: vi.fn(), isPending: false }),
  useBlockUser: () => ({ mutate: vi.fn(), isPending: false }),
  useUnblockUser: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/shared/moderation', () => ({
  ReportButton: () => null,
}));

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname + loc.search}</div>;
}

function renderActions(props?: Partial<Parameters<typeof PublicProfileActions>[0]>) {
  return render(
    <MemoryRouter initialEntries={['/ikaros/uzivatel/u1']}>
      <PublicProfileActions
        profileId="u1"
        meId="me"
        isAdmin
        username="FOksiGen"
        {...props}
      />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe('PublicProfileActions — „Otevřít v administraci"', () => {
  it('naviguje na /admin?tab=uzivatele&search=<username>', () => {
    renderActions();
    fireEvent.click(
      screen.getByRole('button', { name: /Otevřít v administraci/ }),
    );
    expect(screen.getByTestId('loc').textContent).toBe(
      '/admin?tab=uzivatele&search=FOksiGen',
    );
  });

  it('username se URL-escapuje', () => {
    renderActions({ username: 'Pan Novák' });
    fireEvent.click(
      screen.getByRole('button', { name: /Otevřít v administraci/ }),
    );
    expect(screen.getByTestId('loc').textContent).toBe(
      '/admin?tab=uzivatele&search=Pan%20Nov%C3%A1k',
    );
  });

  it('na vlastním profilu se tlačítko nezobrazí (§12.3)', () => {
    renderActions({ meId: 'u1' });
    expect(
      screen.queryByRole('button', { name: /Otevřít v administraci/ }),
    ).toBeNull();
  });

  it('non-admin tlačítko nevidí', () => {
    renderActions({ isAdmin: false });
    expect(
      screen.queryByRole('button', { name: /Otevřít v administraci/ }),
    ).toBeNull();
  });
});
