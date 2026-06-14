/**
 * NAV audit (10. styl) — render/guard harness.
 *
 * (A) M-MATRIX (L6-matrix): exhaustivní pravdivostní tabulka guardů —
 *     6 guard configů (zrcadlí router.tsx) × 10 identit → přesný výsledek
 *     (p=projde / r=redirect na index / f=403 ForbiddenPage). Tabulka `exp`
 *     je RUČNĚ zapsaný ZÁMĚR (revidovatelný artefakt), ne re-derivace guardu.
 * (B) Ranking důkaz (K-NAV2): RR v7 matchuje podle specificity, ne pořadí.
 * (C) Param-edge: `:slug` matchne libovolný segment (graceful, ne crash/404).
 *
 * Mock vzor převzat z WorldMembershipGuard.spec.tsx.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  Routes,
  Route,
  RouterProvider,
  createMemoryRouter,
} from 'react-router-dom';
import { getDefaultStore } from 'jotai';
import type { ReactNode } from 'react';
import { WorldMembershipGuard } from '@/features/admin/components/WorldMembershipGuard';
import { RoleGuard } from '@/features/admin/components/RoleGuard';
import {
  WorldContext,
  type WorldContextValue,
} from '@/features/world/context/WorldContext';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole, WorldRole, type User } from '@/shared/types';

const store = getDefaultStore();
beforeEach(() => store.set(currentUserAtom, null));

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

function makeCtx(worldRole: WorldRole | null): WorldContextValue {
  return {
    worldId: 'w1',
    worldSlug: 'w1-slug',
    world: null,
    isPJ: worldRole != null && worldRole >= WorldRole.PomocnyPJ,
    userRole: worldRole,
    character: null,
    loading: false,
  };
}

// ── guard configy (zrcadlí router.tsx) ──
const SA_ADMIN = [UserRole.Superadmin, UserRole.Admin];
type GuardFn = (children: ReactNode) => ReactNode;
const memberOnly =
  (min: WorldRole): GuardFn =>
  (children) =>
    (
      <WorldMembershipGuard
        minWorldRole={min}
        fallbackGlobalRoles={SA_ADMIN}
        redirectTo="/svet/:worldSlug"
      >
        {children}
      </WorldMembershipGuard>
    );
const wmg =
  (min: WorldRole): GuardFn =>
  (children) =>
    (
      <WorldMembershipGuard minWorldRole={min} fallbackGlobalRoles={SA_ADMIN}>
        {children}
      </WorldMembershipGuard>
    );
const roleGuard =
  (roles: UserRole[]): GuardFn =>
  (children) =>
    <RoleGuard roles={roles}>{children}</RoleGuard>;

// ── identity (pořadí = sloupce tabulky) ──
interface Identity {
  label: string;
  user: UserRole | null;
  worldRole: WorldRole | null;
}
const IDS: Identity[] = [
  { label: 'anon', user: null, worldRole: null },
  { label: 'Superadmin', user: UserRole.Superadmin, worldRole: null },
  { label: 'Admin', user: UserRole.Admin, worldRole: null },
  { label: 'nečlen (jiný svět)', user: UserRole.Ikarus, worldRole: null },
  { label: 'Zadatel', user: UserRole.Ikarus, worldRole: WorldRole.Zadatel },
  { label: 'Ctenar', user: UserRole.Ikarus, worldRole: WorldRole.Ctenar },
  { label: 'Hrac', user: UserRole.Ikarus, worldRole: WorldRole.Hrac },
  { label: 'Korektor', user: UserRole.Ikarus, worldRole: WorldRole.Korektor },
  { label: 'PomocnyPJ', user: UserRole.Ikarus, worldRole: WorldRole.PomocnyPJ },
  { label: 'PJ', user: UserRole.Ikarus, worldRole: WorldRole.PJ },
];

// p=projde  r=redirect na index  f=403 ForbiddenPage
type Outcome = 'p' | 'r' | 'f';
interface Cfg {
  name: string;
  make: GuardFn;
  exp: Outcome[]; // zarovnané na IDS
}
const CONFIGS: Cfg[] = [
  // router.tsx — memberOnly() default Ctenar: chat/novinky/stranky/postavy/mapa/.../:slug
  { name: 'memberOnly(Ctenar)', make: memberOnly(WorldRole.Ctenar),
    exp: ['r', 'p', 'p', 'r', 'r', 'p', 'p', 'p', 'p', 'p'] },
  // router.tsx:254/256 — timeline, pocasi
  { name: 'memberOnly(Hrac) [timeline/pocasi]', make: memberOnly(WorldRole.Hrac),
    exp: ['r', 'p', 'p', 'r', 'r', 'r', 'p', 'p', 'p', 'p'] },
  // router.tsx:251 — kalendar
  { name: 'memberOnly(PomocnyPJ) [kalendar]', make: memberOnly(WorldRole.PomocnyPJ),
    exp: ['r', 'p', 'p', 'r', 'r', 'r', 'r', 'r', 'p', 'p'] },
  // scenare, denik-pj, admin/stranky (N-07), admin/kalendare (N-08) — bez redirectu → 403
  { name: 'WMG(PomocnyPJ) [scenare/denik-pj/admin-stranky/admin-kalendare]', make: wmg(WorldRole.PomocnyPJ),
    exp: ['f', 'p', 'p', 'f', 'f', 'f', 'f', 'f', 'p', 'p'] },
  // admin/headline (admin/emotes a sablona-deniku jsou nově Settings taby, ne routy)
  { name: 'WMG(PJ) [admin/headline]', make: wmg(WorldRole.PJ),
    exp: ['f', 'p', 'p', 'f', 'f', 'f', 'f', 'f', 'f', 'p'] },
  // router.tsx:194/203/214 — /admin, dungeon-builder, ikaros/admin/emotes
  { name: 'RoleGuard[Sa,Admin]', make: roleGuard(SA_ADMIN),
    exp: ['f', 'p', 'p', 'f', 'f', 'f', 'f', 'f', 'f', 'f'] },
];

function outcomeOf(make: GuardFn, id: Identity): Outcome | '?' {
  store.set(currentUserAtom, id.user == null ? null : makeUser(id.user));
  const { unmount } = render(
    <MemoryRouter initialEntries={['/svet/w1-slug/x']}>
      <WorldContext.Provider value={makeCtx(id.worldRole)}>
        <Routes>
          <Route
            path="/svet/:worldSlug/x"
            element={make(<div>PROTECTED_OK</div>)}
          />
          <Route path="/svet/:worldSlug" element={<div>INDEX_SENTINEL</div>} />
        </Routes>
      </WorldContext.Provider>
    </MemoryRouter>,
  );
  let out: Outcome | '?' = '?';
  if (screen.queryByText('PROTECTED_OK')) out = 'p';
  else if (screen.queryByText('INDEX_SENTINEL')) out = 'r';
  else if (screen.queryByText(/403|odepřen|forbidden/i)) out = 'f';
  unmount();
  return out;
}

describe('NAV M-MATRIX — pravdivostní tabulka guardů (L6)', () => {
  for (const cfg of CONFIGS) {
    describe(cfg.name, () => {
      IDS.forEach((id, i) => {
        it(`${id.label} → ${cfg.exp[i]}`, () => {
          expect(outcomeOf(cfg.make, id)).toBe(cfg.exp[i]);
        });
      });
    });
  }
});

describe('NAV ranking (K-NAV2 mýtus) — RR v7 řadí podle specificity, ne pořadí', () => {
  it('static `pravidla` přebije `:slug`, i když je `:slug` deklarovaný PRVNÍ', () => {
    const r = createMemoryRouter(
      [
        { path: '/svet/:worldSlug/:slug', element: <div>WIKI_VIEWER</div> },
        { path: '/svet/:worldSlug/pravidla', element: <div>PRAVIDLA</div> },
      ],
      { initialEntries: ['/svet/w/pravidla'] },
    );
    render(<RouterProvider router={r} />);
    expect(screen.queryByText('PRAVIDLA')).toBeTruthy();
    expect(screen.queryByText('WIKI_VIEWER')).toBeFalsy();
  });
});

describe('NAV param-edge — `:slug` matchne libovolný segment (graceful)', () => {
  for (const slug of ['ßřčweird', 'a'.repeat(2000), '%20', 'Über-Nach.t']) {
    it(`slug="${slug.slice(0, 12)}…" → wiki, ne 404`, () => {
      const r = createMemoryRouter(
        [
          { path: '/svet/:worldSlug/:slug', element: <div>WIKI_VIEWER</div> },
          { path: '*', element: <div>NOT_FOUND</div> },
        ],
        { initialEntries: [`/svet/w/${encodeURIComponent(slug)}`] },
      );
      render(<RouterProvider router={r} />);
      expect(screen.queryByText('WIKI_VIEWER')).toBeTruthy();
      expect(screen.queryByText('NOT_FOUND')).toBeFalsy();
    });
  }
});
