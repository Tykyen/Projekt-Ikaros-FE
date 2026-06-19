/**
 * 14.5 — fixtures pro E2E smoke. Plain objekty (žádné `@/` aliasy — Playwright
 * transpiluje testy mimo Vite, alias by neresolvoval). Tvary zrcadlí
 * `src/shared/types` + `tactical-map/types`; drží se minima, které render
 * happy-path (login → svět → mapa) potřebuje.
 */

/**
 * Fake JWT: hlavička.payload.podpis. FE `isJwtValid` (src/shared/lib/jwt.ts)
 * jen dekóduje payload a kontroluje `exp` v budoucnu — podpis se neověřuje
 * (to dělá BE, který je tu mockovaný). `exp` = rok 2100, ať token nikdy
 * nevyprší během běhu testu.
 */
function makeFakeJwt(sub: string): string {
  const b64 = (obj: Record<string, unknown>): string =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');
  const header = b64({ alg: 'HS256', typ: 'JWT' });
  const payload = b64({ sub, exp: 4102444800 }); // 2100-01-01
  return `${header}.${payload}.e2e-fake-signature`;
}

export const TEST_USER = {
  id: '6650000000000000000000a1',
  email: 'hrac@test.cz',
  username: 'testhrac',
  displayName: 'Test Hráč',
  role: 9, // UserRole.Ikarus
  defaultAvatarType: 'being',
  chatColor: '#a78bfa',
  emailVerified: true,
  isOnline: true,
  lastSeenAt: '2026-06-19T00:00:00.000Z',
  themeSettings: {},
  chatPreferences: {},
  favoriteDiscussionIds: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-06-19T00:00:00.000Z',
};

export const FAKE_JWT = makeFakeJwt(TEST_USER.id);

export const TEST_SCENE = {
  id: '6650000000000000000000c1',
  worldId: '6650000000000000000000b1',
  name: 'Testovací scéna',
  imageUrl: '', // bez pozadí → render jen hex grid (canvas přesto naběhne)
  config: { size: 40, originX: 0, originY: 0, showGrid: true },
  tokens: [],
  npcTemplates: [],
  effects: [],
  fogEnabled: false,
  revealedHexes: [],
  isActive: true,
  isHidden: false,
  isLocked: false,
  playerStates: [],
  activeSoundIds: [],
  lastSeqNumber: 0,
  activeCharacterIds: [],
  activeBestieIds: [],
};

export const TEST_WORLD = {
  id: TEST_SCENE.worldId,
  name: 'Testovací svět',
  slug: 'testovaci-svet',
  description: 'Smoke-test svět',
  system: 'drd2',
  ownerId: 'owner-1',
  isActive: true,
  accessMode: 'public' as const,
  playerCount: 1,
  maxPlayers: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-06-19T00:00:00.000Z',
  owner: { id: 'owner-1', username: 'pj' },
};

export const TEST_MEMBERSHIP = {
  id: '6650000000000000000000d1',
  userId: TEST_USER.id,
  worldId: TEST_WORLD.id,
  role: 5, // WorldRole.PJ — projde memberOnly guard i showFullNav
  joinedAt: '2026-01-01T00:00:00.000Z',
  currentSceneId: TEST_SCENE.id, // bez něj by /maps/active vrátil 404 → EmptyState
};

/** `GET /worlds/my` → membership pro guard (`useWorldStatus` čte odsud). */
export const TEST_MY_WORLD_ENTRY = {
  world: TEST_WORLD,
  membership: TEST_MEMBERSHIP,
};

/** `POST /auth/login` úspěšná odpověď (`LoginOkResponse`). */
export const LOGIN_RESPONSE = {
  status: 'ok' as const,
  accessToken: FAKE_JWT,
  refreshToken: FAKE_JWT,
  user: TEST_USER,
};
