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
  // 27.1 golden ② — dice picker v chatu vykreslí dlaždice jen když je `dice`
  // neprázdné. Kanonické klíče (worldDiceCatalog) — alias k6/k20 catalog
  // neresolvne → lookup undefined → `.color` crash při renderu DiceButton.
  dice: ['d6', 'd20', 'fate'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-06-19T00:00:00.000Z',
  owner: { id: 'owner-1', username: 'pj' },
};

/** 27.1 golden ① — cílová postava (PostavaHrace) pro cestu postava→deník. */
export const TEST_CHARACTER = {
  id: '6650000000000000000000e1',
  worldId: TEST_WORLD.id,
  slug: 'test-postava',
  name: 'Vlkodav z Černého lesa',
  // Page.type nese DISPLAY hodnotu (PAGE_TYPES.PostavaHrace = 'Postava hráče'),
  // ne URL klíč 'PostavaHrace' — jinak PostavaLayout nedetekuje postavu.
  type: 'Postava hráče' as const,
  ownerUserId: TEST_USER.id,
  isNpc: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-06-19T00:00:00.000Z',
};

/** 27.1 golden ② — deníkový subdoc postavy (jinak DiaryTab hlásí chybu načtení). */
export const TEST_DIARY = {
  characterId: TEST_CHARACTER.id,
  personalDiarySchema: null,
  customData: {},
  sections: [],
};

/**
 * 27.1 golden ② — chat skupina s jednou konverzací. POZOR na tvar: FE čeká
 * `GroupWithChannels[]` = zabalené `{ group, channels }` (ne ploché) — jinak
 * `ChannelSidebar` volá `groupColorVarFor(undefined)` → `.color` crash.
 */
export const TEST_CHAT_CHANNEL = {
  id: '6650000000000000000000f1',
  groupId: '665000000000000000000f01',
  worldId: TEST_WORLD.id,
  name: 'Táborák',
  isGlobal: false,
  accessMode: 'all' as const,
  allowedRoles: [],
  allowedMemberIds: [],
  order: 0,
  type: 'text' as const,
};

export const TEST_CHAT_GROUP = {
  group: {
    id: '665000000000000000000f01',
    worldId: TEST_WORLD.id,
    name: 'Obecné',
    order: 0,
  },
  channels: [TEST_CHAT_CHANNEL],
};

/** Per-svět vzhled zprávy (`GET /chat/appearance` — objekt, ne pole). */
export const TEST_CHAT_APPEARANCE = {
  chatColor: '#a78bfa',
  chatFont: null,
  chatFontSize: null,
  chatSkin: null,
  readerFontOverride: false,
  readerFont: null,
  readerFontSize: null,
  diceSkinMapping: null,
  jailedDiceSkins: [],
};

/** Invite accept odpověď (link i cílená → redirect do světa). */
export const TEST_INVITE_ACCEPT = {
  ok: true,
  worldId: TEST_WORLD.id,
  worldSlug: TEST_WORLD.slug,
  membership: null as unknown,
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
