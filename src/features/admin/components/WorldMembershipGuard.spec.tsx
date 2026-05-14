import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getDefaultStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import { WorldMembershipGuard } from './WorldMembershipGuard';
import {
  WorldContext,
  type WorldContextValue,
} from '@/features/world/context/WorldContext';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole, WorldRole, type User } from '@/shared/types';

function makeUser(role: UserRole): User {
  return {
    id: `u-${role}`,
    email: 't@t.cz',
    username: `user-${role}`,
    role,
    defaultAvatarType: 'being',
    chatColor: '#000',
    emailVerified: true,
    themeSettings: {},
    chatPreferences: {},
    favoriteDiscussionIds: [],
    isOnline: false,
    lastSeenAt: '2026-05-14T00:00:00Z',
    createdAt: '2026-05-14T00:00:00Z',
    updatedAt: '2026-05-14T00:00:00Z',
  };
}

function makeCtx(overrides: Partial<WorldContextValue> = {}): WorldContextValue {
  return {
    worldId: 'w1',
    world: null,
    isPJ: false,
    userRole: null,
    loading: false,
    ...overrides,
  };
}

function makeWrapper(ctx: WorldContextValue) {
  return ({ children }: PropsWithChildren) => (
    <MemoryRouter>
      <WorldContext.Provider value={ctx}>{children}</WorldContext.Provider>
    </MemoryRouter>
  );
}

const store = getDefaultStore();

beforeEach(() => {
  store.set(currentUserAtom, null);
});

describe('WorldMembershipGuard', () => {
  it('loading → ani protected obsah, ani ForbiddenPage (vykresluje Spinner)', () => {
    const { container } = render(
      <WorldMembershipGuard minWorldRole={WorldRole.PJ}>
        <div data-testid="protected">OK</div>
      </WorldMembershipGuard>,
      { wrapper: makeWrapper(makeCtx({ loading: true })) },
    );
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    expect(screen.queryByText(/403|odepřen|forbidden/i)).not.toBeInTheDocument();
    // Spinner je `<span class="spinner …" />` (případně wrap v `div.center`)
    expect(container.querySelector('span[class*="spinner"]')).toBeTruthy();
  });

  it('anon (bez user, bez membership) → ForbiddenPage', () => {
    render(
      <WorldMembershipGuard minWorldRole={WorldRole.PJ}>
        <div data-testid="protected">OK</div>
      </WorldMembershipGuard>,
      { wrapper: makeWrapper(makeCtx()) },
    );
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    expect(screen.getByText(/403|odepřen|forbidden/i)).toBeInTheDocument();
  });

  it('Superadmin projde bez ohledu na membership (fallback)', () => {
    store.set(currentUserAtom, makeUser(UserRole.Superadmin));
    render(
      <WorldMembershipGuard
        minWorldRole={WorldRole.PJ}
        fallbackGlobalRoles={[UserRole.Superadmin, UserRole.Admin]}
      >
        <div data-testid="protected">OK</div>
      </WorldMembershipGuard>,
      { wrapper: makeWrapper(makeCtx()) },
    );
    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });

  it('Admin projde bez ohledu na membership (fallback)', () => {
    store.set(currentUserAtom, makeUser(UserRole.Admin));
    render(
      <WorldMembershipGuard
        minWorldRole={WorldRole.PJ}
        fallbackGlobalRoles={[UserRole.Superadmin, UserRole.Admin]}
      >
        <div data-testid="protected">OK</div>
      </WorldMembershipGuard>,
      { wrapper: makeWrapper(makeCtx()) },
    );
    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });

  it('PJ daného světa projde (membership.role >= minWorldRole)', () => {
    store.set(currentUserAtom, makeUser(UserRole.Ikarus));
    render(
      <WorldMembershipGuard
        minWorldRole={WorldRole.PJ}
        fallbackGlobalRoles={[UserRole.Superadmin, UserRole.Admin]}
      >
        <div data-testid="protected">OK</div>
      </WorldMembershipGuard>,
      { wrapper: makeWrapper(makeCtx({ userRole: WorldRole.PJ })) },
    );
    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });

  it('Hrac daného světa → ForbiddenPage (membership < minWorldRole)', () => {
    store.set(currentUserAtom, makeUser(UserRole.Ikarus));
    render(
      <WorldMembershipGuard
        minWorldRole={WorldRole.PJ}
        fallbackGlobalRoles={[UserRole.Superadmin, UserRole.Admin]}
      >
        <div data-testid="protected">OK</div>
      </WorldMembershipGuard>,
      { wrapper: makeWrapper(makeCtx({ userRole: WorldRole.Hrac })) },
    );
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    expect(screen.getByText(/403|odepřen|forbidden/i)).toBeInTheDocument();
  });

  it('Pending (Žadatel) je implicit deny při minWorldRole=PJ', () => {
    store.set(currentUserAtom, makeUser(UserRole.Ikarus));
    render(
      <WorldMembershipGuard minWorldRole={WorldRole.PJ}>
        <div data-testid="protected">OK</div>
      </WorldMembershipGuard>,
      { wrapper: makeWrapper(makeCtx({ userRole: WorldRole.Zadatel })) },
    );
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });
});
