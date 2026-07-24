/**
 * D-053 (2026-05-13) — Cleanup: zúženo na 6 GLOBÁLNÍCH rolí.
 * World role (PJ/Korektor/Hrac/Ctenar/Zadatel) přesunuty do `WorldRole`.
 * BE migrace `migrate:d053` přemapuje historické DB hodnoty 3–7 na 9 (Ikarus).
 */
export enum UserRole {
  Superadmin     = 1,
  Admin          = 2,
  Ikarus         = 9,
  SpravceClanku  = 10,
  SpravceGalerie = 11,
  SpravceDiskuzi = 12,
  /** Spec 15.8 — host (anonym) z guest JWT, bez účtu. Sentinel mimo řadu;
   *  nikdy neprojde role gating. NENÍ přiřaditelná role. Drží se s BE enumem. */
  Guest          = 99,
}

export type DefaultAvatarType = 'male' | 'female' | 'being';

/**
 * D-033 — Granular admin permissions.
 * Defaultně všechny `false`. Nastavovat smí jen Superadmin.
 */
export interface AdminPermissions {
  canManageAdmins: boolean;
  canModerateContent: boolean;
}

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  canManageAdmins: false,
  canModerateContent: false,
};

/**
 * 15.9 — notifikační preference (push). Kopie BE tvaru (oddělená repa,
 * dual-source — měň obě). `undefined` pole = default z kódu (viz
 * `features/notifications/lib/notificationPreferences`).
 */
export interface NotificationPreferences {
  pushEnabled?: boolean;
  worldChat?: boolean;
  worldEvent?: boolean;
  ownDiscussion?: boolean;
  ownContent?: boolean;
  worldNews?: boolean;
  ikarosNews?: boolean;
  hospoda?: boolean;
  adminChat?: boolean;
  posta?: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  displayName?: string;
  avatarUrl?: string;
  profileImageUrl?: string;
  characterPath?: string;
  // 1.3a profil
  city?: string;
  bio?: string;
  defaultAvatarType: DefaultAvatarType;
  characterName?: string;
  characterBio?: string;
  characterAvatarUrl?: string;
  chatColor: string;
  themeId?: string;
  emailVerified: boolean;
  /** 1.7 — kdy byl e-mail naposledy ověřen (po kliku na verifikační link). */
  emailVerifiedAt?: string;
  /** 14.1 — 2FA stav (secret + záložní kódy se na FE NIKDY neposílají). */
  totpEnabled?: boolean;
  twoFactorMethod?: string;
  /** 1.5 D-052 — privacy „neviditelný" mód (skrýt online stav před ostatními). */
  hiddenPresence?: boolean;
  /** D-045 — privacy „skrýt mě v adresáři uživatelů". Admin vidí všechny. */
  hiddenInDirectory?: boolean;
  /** 3.5 D-057 — kdo vidí profil a může psát: `public` (default) | `friends`. */
  profileVisibility?: 'public' | 'friends';
  /** 20C — deklarativní věk (< 15 let). Zapíná v profilu režim ochrany nezletilých. */
  isMinor?: boolean;
  /** 20C — stav souhlasu zákonného zástupce (jen flag; reálný tok = lawyer-pending). */
  parentalConsentStatus?: 'pending' | 'granted' | 'not_required';
  lastLoginAt?: string;
  usernameChangedAt?: string;
  // 1.3b — ban + admin permissions (D-033 granular)
  bannedAt?: string | null;
  bannedBy?: string | null;
  banReason?: string | null;
  /** D-023 — null = trvalý ban. ISO string = datum expirace. */
  bannedUntil?: string | null;
  adminPermissions?: AdminPermissions;
  // 1.3b — pending username change request (z GET /users/me)
  usernameChangeRequest?: UsernameChangeRequest | null;
  // 1.3b — cooldown ze server configu (BE env USERNAME_CHANGE_COOLDOWN_DAYS, default 30)
  usernameChangeCooldownDays?: number;
  // 1.3c — soft delete state (30denní hold, login = reaktivace přes /auth/reactivate-deletion)
  deletionRequestedAt?: string | null;
  deletionReason?: string | null;
  /** Datum, kdy cron provede hard cleanup (deletionRequestedAt + 30d). */
  scheduledHardDeleteAt?: string | null;
  /** Tombstone flag — true znamená anonymizovaný řádek. JwtStrategy nikdy
   * tyhle usery nepustí přes auth, FE by je viděl jen při admin includeDeleted=true. */
  isDeleted?: boolean;
  themeSettings: Record<string, unknown>;
  chatPreferences: Record<string, unknown>;
  /** 15.9 — notifikační preference (push); undefined pole = default z kódu. */
  notificationPreferences?: NotificationPreferences;
  /* themeSettings — viz `UserThemeSettings` (čte se přes cast). */
  favoriteDiscussionIds: string[];
  /** 3.7 — oblíbené (záložky) napříč globálním obsahem */
  favoriteArticleIds?: string[];
  favoriteGalleryIds?: string[];
  /** 3.7 — připnuté do sidebaru (podmnožina oblíbených, max 5/typ) */
  pinnedDiscussionIds?: string[];
  pinnedArticleIds?: string[];
  pinnedGalleryIds?: string[];
  /** 8.3 / D-074 — oblíbené postavy v adresáři per svět. `worldId → slug[]`. */
  favoriteCharacters?: Record<string, string[]>;
  /** 5.2-followup — osobní oblíbené stránky per svět. `worldId → slug[]`, pořadí významné. */
  favoritePageSlugs?: Record<string, string[]>;
  isOnline: boolean;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
  /** 19.4 — freemium status Podporovatel. */
  isSupporter?: boolean;
  supporterSince?: string;
}

/** 8.3 / D-075 — položka v cross-world přehledu „moje postavy" na profilu. */
export interface MyCharacterEntry {
  worldId: string;
  worldName: string;
  worldSlug: string;
  worldImageUrl?: string;
  characterId: string;
  characterSlug: string;
  characterName: string;
  /** @deprecated 9.1 cleanup — BE neposílá. Avatar je v Page přes characterRef. */
  characterImageUrl?: string;
  isNpc: boolean;
  /** Spec 9.2 — `'persona'` (PostavaHrace/NPC) nebo `'location'` (Lokace). */
  kind: 'persona' | 'location';
}

/** 3.7 — návratový tvar `POST /:id/toggle-favorite` */
export interface ToggleFavoriteResponse {
  isFavorite: boolean;
}

/** 3.7 — návratový tvar `POST /:id/toggle-pin` */
export interface TogglePinResponse {
  isPinned: boolean;
}

// 1.3b — Username change request
export type UsernameChangeRequestStatus = 'pending' | 'approved' | 'rejected';

export interface UsernameChangeRequest {
  id: string;
  userId: string;
  requestedUsername: string;
  status: UsernameChangeRequestStatus;
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionReason?: string;
  seenAt?: string;
}

// Admin endpointy (1.3b + 1.3c)
export interface AdminUsersListItem {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  defaultAvatarType: DefaultAvatarType;
  role: UserRole;
  adminPermissions?: AdminPermissions;
  bannedAt?: string | null;
  banReason?: string | null;
  bannedUntil?: string | null;
  pendingUsernameRequest?: {
    id: string;
    requestedUsername: string;
    requestedAt: string;
  } | null;
  // 1.3c — soft delete metadata
  deletionRequestedAt?: string | null;
  deletionReason?: string | null;
  isDeleted?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  /** 19.4 — status Podporovatel (badge v adresáři admina). */
  isSupporter?: boolean;
}

// D-024 — Admin audit log
// D-056 — rozšířeno o FRIENDSHIP_COOLDOWN_RESET (admin override per-pair cooldownu)
// D-NEW-INV-CLEANUP (2026-06-27): srovnáno s BE `admin-audit-log.interface.ts`
// (zdroj pravdy) — dřív FE znalo jen 10 akcí, takže DELETE/HARD_DELETE/BULK_*/
// WORLD_ELEVATION_*/ACCOUNT_* z BE se v audit logu zobrazovaly prázdné.
// Pozn.: `FRIENDSHIP_COOLDOWN_RESET` je FE-only (BE ho zatím nikde neemituje) —
// ponecháno; až BE začne logovat reset cooldownu, bude mít label připravený.
export type AdminAuditAction =
  | 'BAN'
  | 'UNBAN'
  | 'ROLE_CHANGE'
  | 'SUPPORTER_GRANT'
  | 'SUPPORTER_REVOKE'
  | 'PERMISSIONS_CHANGE'
  | 'ADMIN_PERMISSIONS_CHANGE'
  | 'USER_CREATE'
  | 'USERNAME_REQUEST_APPROVED'
  | 'USERNAME_REQUEST_REJECTED'
  | 'FRIENDSHIP_COOLDOWN_RESET'
  | 'DELETE'
  | 'UNDELETE'
  | 'DELETION_REACTIVATED'
  | 'HARD_DELETE'
  | 'ACCOUNT_SELF_DELETE_REQUEST'
  | 'ACCOUNT_DELETE_REQUEST'
  | 'ACCOUNT_DELETE_CANCEL'
  | 'ACCOUNT_SELF_REACTIVATE'
  | 'ACCOUNT_HARD_DELETE'
  | 'BULK_BAN'
  | 'BULK_UNBAN'
  | 'BULK_ROLE_CHANGE'
  // Elevation — admin „nahodil"/„složil" pravomoci ve světě.
  | 'WORLD_ELEVATION_ACTIVATED'
  | 'WORLD_ELEVATION_REVOKED'
  // D-067 — audit nad novinkami Ikaros.
  | 'IKAROS_NEWS_ARCHIVE'
  | 'IKAROS_NEWS_UNARCHIVE'
  | 'IKAROS_NEWS_DELETE';

/** D-067 — typ cílové entity audit záznamu. */
export type AuditTargetType = 'user' | 'ikaros-news' | 'world';

export interface AdminAuditLogEntry {
  id: string;
  actorId: string;
  actorUsername: string;
  targetId: string;
  /** Username uživatele nebo název novinky — dle `targetType`. */
  targetUsername: string;
  targetType: AuditTargetType;
  action: AdminAuditAction;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
  createdAt: string;
}

export interface AdminUsernameRequestListItem {
  id: string;
  requestedUsername: string;
  status: UsernameChangeRequestStatus;
  requestedAt: string;
  decidedAt: string | null;
  decisionReason: string | null;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    defaultAvatarType: DefaultAvatarType;
  } | null;
  decidedBy: { id: string; username: string } | null;
}

export interface PublicUser {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  characterPath?: string;
  role: UserRole;
  createdAt: string;
}

// Auth
export interface LoginRequest {
  /** E-mail (pokud obsahuje @) nebo přezdívka uživatele */
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  // D-010 — GDPR souhlas (povinný checkbox v RegisterModalu)
  acceptedTerms?: boolean;
  /**
   * 20C — deklarativní věk (spec-20C §C2). `true` = uživatel deklaroval < 15 let.
   * MUSÍ se posílat vždy: BE `RegisterDto` má `isMinor` povinné (+ forbidNonWhitelisted),
   * takže chybějící pole = 400. FE ho odvozuje z volby ageBracket v RegisterModalu.
   */
  isMinor: boolean;
  // D-011 — honeypot (skutečný uživatel nevyplňuje, bot ano → BE odmítne)
  hp?: string;
  /** D-011 — Cloudflare Turnstile token (validuje BE proti siteverify). */
  captchaToken?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// 1.3c — login response union: ok = standardní login pair, deletion_pending = nabídka reaktivace
export interface LoginOkResponse extends AuthResponse {
  status: 'ok';
  /**
   * D-034b — pokud login byl reaktivace soft-delete a uživatel měl Pomocné PJ
   * povýšené při delete, BE vrátí promotions. FE zobrazí informační modal.
   */
  revertablePromotions?: Array<{
    worldId: string;
    worldName: string;
    worldSlug: string;
    promotedUserId: string;
    promotedUsername: string;
  }>;
}
export interface LoginDeletionPendingResponse {
  status: 'deletion_pending';
  deletionRequestedAt: string;
  scheduledHardDeleteAt: string;
  deletionReason: string | null;
}
// 14.1 — 2FA: heslo OK, ale chybí druhý faktor (žádný token, jen challengeId).
export interface LoginTotpRequiredResponse {
  status: 'totp_required';
  challengeId: string;
}
export type LoginResponse =
  | LoginOkResponse
  | LoginDeletionPendingResponse
  | LoginTotpRequiredResponse;

// 14.1 — 2FA payloady
export interface LoginTotpRequest {
  challengeId: string;
  /** 6místný TOTP kód NEBO jednorázový záložní kód. */
  code: string;
  trustDevice?: boolean;
}
export interface TotpSetupResponse {
  qrDataUrl: string;
  secret: string;
}
export interface TotpEnableResponse {
  backupCodes: string[];
}
export interface TrustedDeviceView {
  id: string;
  label: string;
  lastUsedAt: string;
  createdAt: string;
  current: boolean;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  avatarUrl?: string;
  characterPath?: string;
  username?: string;
  themeSettings?: Record<string, unknown>;
  chatPreferences?: Record<string, unknown>;
  // 1.3a profil
  city?: string;
  bio?: string;
  defaultAvatarType?: DefaultAvatarType;
  characterName?: string;
  characterBio?: string;
  characterAvatarUrl?: string;
  chatColor?: string;
  themeId?: string;
  // 1.5 D-052 — privacy „neviditelný" mód
  hiddenPresence?: boolean;
  // D-045 — privacy „skrýt mě v adresáři uživatelů"
  hiddenInDirectory?: boolean;
  // 3.5 D-057 — friend-only viditelnost profilu / pošty
  profileVisibility?: 'public' | 'friends';
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// JWT access token payload (dekódovaný)
export interface AccessTokenPayload {
  sub: string;
  email: string;
  username: string;
  role: UserRole;
  characterPath: string;
  iat: number;
  exp: number;
}

// World
/**
 * D-053 (2026-05-13) — Renumber 0–5 + nová `Ctenar` + rename `Pending` → `Zadatel`.
 * BE migrace přemapuje historické DB hodnoty: -1→0, 0→2, 1→3, 2→4, 3→5.
 */
export enum WorldRole {
  Zadatel   = 0,
  Ctenar    = 1,
  Hrac      = 2,
  Korektor  = 3,
  PomocnyPJ = 4,
  PJ        = 5,
}

export interface World {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  genre?: string;
  tones?: string[];
  /** 2.3 — volný text „koho hledáte" pro listing/karty. */
  playersWanted?: string;
  /** 2.3 — multi-select kostek/mechanik (z `CreateWorldPage`). */
  dice?: string[];
  system: string;
  /** 2.3d — technologické pásmo světa (TÚ 0–14); seeduje stránku Technologie. */
  techLevelMin?: number | null;
  techLevelMax?: number | null;
  /** 2.3e — tradice magie světa; seeduje stránku Magický systém. */
  magicTraditions?: string[];
  ownerId: string;
  isActive: boolean;
  /** Soft-delete: !=null = svět je v 30denním okně pro obnovu (Admin). */
  deletedAt?: string | null;
  deletedBy?: string | null;
  accessMode: 'public' | 'private' | 'open' | 'closed';
  /**
   * 22.4 — veřejná výkladní skříň: anonym smí read-only nahlížet do vybraných
   * sekcí (anon = Čtenář). Jen ne-private světy; BE flag auto-shodí při
   * přechodu na private.
   */
  publicShowcase?: boolean;
  playerCount: number;
  /** 2.2 — volitelná max kapacita pro sort "volná místa" + 2.3 wizard. */
  maxPlayers?: number | null;
  /** 5.0 — id sdíleného základu světového motivu (preset nebo 'matrix'). */
  themeId?: string;
  /** 5.0 — custom theme: mapa CSS token → hodnota nad `themeId`. */
  themeOverrides?: Record<string, string>;
  /** 5.0 — custom theme: URL vlastního pozadí světa. */
  themeBackgroundUrl?: string;
  /** 9.2b — slug výchozího kalendáře z multi-config kolekce. */
  defaultCalendarConfigSlug?: string;
  /** 9.2b — společný absDay epoch napříč kalendáři světa. */
  timelineEpoch?: number;
  /** 10.2i — počasí vyslané PJ na taktickou mapu. `null`/`undefined` = žádné. */
  activeMapWeather?: ActiveMapWeather | null;
  /** 10.2j — viditelnost hodů na mapě. */
  diceVisibility?: WorldDiceVisibility;
  createdAt: string;
  updatedAt: string;
  /** Spec 2.4 — populated jen při `GET /worlds/:id` / `GET /worlds/slug/:slug`. */
  owner?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  /**
   * Elevation — pro platform admina: má v tomto světě „nahozené" pravomoci?
   * Read-time enrich z BE (detail světa + /worlds/my). U ne-admina undefined.
   */
  elevated?: boolean;
}

/**
 * 10.2j — viditelnost hodů kostek na taktické mapě (per-world konfigurace PJ).
 */
export interface WorldDiceVisibility {
  showPjRolls: boolean;
  showNpcBestieRolls: boolean;
  showTeammateRolls: boolean;
}

/**
 * 10.2i — počasí vyslané PJ na taktickou mapu světa.
 * `weather` = snapshot generátoru v okamžiku vyslání (drží stav pro pozdější
 * příchozí; živý WS event jen patchuje). `WeatherResult` definován níže.
 */
export interface ActiveMapWeather {
  generatorId: string;
  generatorName: string;
  weather: WeatherResult;
  setAt: string;
}

/** Krok 5.9 — uživatelské doladění vzhledu (jas / kontrast / síla pozadí). */
export interface WorldThemeAdjust {
  brightness?: number;
  contrast?: number;
  bgDim?: number;
}

/**
 * Krok 5.9 — obsah `User.themeSettings`: doladění vzhledu platformy Ikaros.
 * `User.themeSettings` je v typu generický objekt — čte se přes cast.
 */
export interface UserThemeSettings {
  themeId?: string;
  adjust?: WorldThemeAdjust;
  overrides?: Record<string, string>;
  /**
   * Spec 5.9c — velikost celého rozhraní (CSS `zoom`), 1.0–1.5, default 1.
   * Přístupnost (slabší zrak): zvětší text, tlačítka, ikony i odstupy.
   */
  uiScale?: number;
}

export interface WorldMembership {
  id: string;
  userId: string;
  worldId: string;
  role: WorldRole;
  joinedAt: string;
  characterPath?: string;
  group?: string;
  /**
   * World-scoped avatar člena = obrázek přiřazené postavy v tomto světě. BE ho
   * plní z postavy a při odpojení `$unset`-ne; když chybí, `worldMemberAvatar`
   * fallbackuje na `user.avatarUrl`. Viz `worldMemberAvatar.ts`.
   */
  avatarUrl?: string;
  /**
   * 6.8-followup — per-člen avatar vedení. V režimu `individual` vystupuje
   * PJ/Pomocný PJ v chatu i headeru s tímto obrázkem; chybí → fallback na účet.
   */
  pjPersonaAvatarUrl?: string;
  /** 5.3 — AKJ úroveň člena (stupňovaná prověrka viditelnosti stránek). */
  akj?: number;
  /** Krok 5.9 — per-uživatel per-svět doladění vzhledu (přístupnost). */
  themeAdjust?: WorldThemeAdjust;
  themeUserOverrides?: Record<string, string>;
  /**
   * 5.9b — per-člen vlastní motiv světa (override sdíleného `world.themeId`).
   * Platí jen tomuto členovi v tomto světě, nepropisuje se do World. Absent/null
   * = dědí motiv PJ.
   */
  themeId?: string | null;
  /**
   * 5.9b — per-člen vlastní pozadí světa (override `world.themeBackgroundUrl`).
   * Funguje i samostatně nad sdíleným motivem. Absent/null = pozadí z motivu.
   */
  themeBackgroundUrl?: string | null;
  /**
   * 16.2c — per-člen vizuální skin deníku (`scifi`/`fantasy`/`horror`/
   * `steampunk`/`nature`/`minimal`/`retro`). Absent/null = dědí default dle
   * `world.system` (`resolveDefaultSkin`). Self-service přes `members/me/theme`.
   */
  diarySkin?: string | null;
  /**
   * 10.2-prep-1 — aktuální scéna hráče v taktické mapě. `null`/undefined =
   * neassigned (klient zobrazí MapEmptyState). Mění se přes `member.*` ops
   * (PJ-only kromě hráčova self-unassign).
   */
  currentSceneId?: string | null;
  /**
   * 6.7b — osobní pořadí kanálů (`groupId[]`) a konverzací (`groupId → channelId[]`)
   * v sidebaru chatu, per hráč. Chybí = fallback na globální pořadí.
   */
  chatGroupOrder?: string[];
  chatChannelOrder?: Record<string, string[]>;
  /** 6.7c — `groupId` rozbalených kanálů v sidebaru (default: vše sbalené). */
  chatExpandedGroups?: string[];
  /** D-032 — osobní pořadí připnutých konverzací (`channelId[]`), per svět. */
  chatPinnedOrder?: string[];
  /** Poslední otevřená konverzace (cross-device seed). `channelId`. */
  chatLastActiveChannelId?: string;
  /** 5.3 — public summary uživatele; populuje `GET /worlds/:id/members`. */
  user?: {
    id: string;
    username: string;
    avatarUrl?: string;
    /** 6.1d — poslední aktivita; `undefined` u „neviditelného" módu. */
    lastSeenAt?: string;
  };
}

export interface MyWorldEntry {
  world: World;
  membership: WorldMembership;
}

/**
 * 5.3d — AKJ úroveň (stupňovaná „prověrka"). PJ/PomocnyPJ ji libovolně
 * pojmenuje dle světa; `level` řídí, které stránky člen vidí (krok 7.2e).
 */
export interface AkjType {
  key: string;
  name: string;
  level: number;
}

/**
 * Side-task character-tab-visibility — IDs tabů na PostavaLayout kromě `profil`
 * (ten je vždy povinný a v tomto seznamu se neukládá).
 */
export type CharacterTabId =
  | 'denik'
  | 'finance'
  | 'vybava'
  | 'kalendar'
  | 'poznamky';

export const CHARACTER_TAB_IDS: readonly CharacterTabId[] = [
  'denik',
  'finance',
  'vybava',
  'kalendar',
  'poznamky',
] as const;

export interface CharacterTabVisibility {
  PostavaHrace: CharacterTabId[];
  NPC: CharacterTabId[];
}

/**
 * 5.3 — nastavení světa (`GET /worlds/:worldId/settings`). FE čte zejména
 * `customGroups`, `groupColors` (tab Členové) a `akjTypes` (tab AKJ úrovně).
 */
/**
 * 12.2 — uzel vlastní navigace světa (headline builder). `isGroup` rozlišuje
 * dropdown skupinu (`children`) od přímého odkazu (`to`). Max 1 úroveň zanoření.
 */
export interface HeadlineNode {
  id: string;
  label: string;
  isGroup: boolean;
  to?: string;
  children?: HeadlineNode[];
}

/** 12.2 — položka šablony menu. */
export interface MenuTemplateItem {
  label: string;
  href: string;
  order?: number;
}

/** 12.2 — pojmenovaná sada odkazů pro rychlé vložení do vlastní navigace. */
export interface MenuTemplate {
  name: string;
  items: MenuTemplateItem[];
}

/** 12.2 — „Last info" box: oznámení PJ členům světa. `updatedAt` plní server (ISO). */
export interface LastInfo {
  text: string;
  visible: boolean;
  updatedAt: string;
}

/**
 * 6.8 — PJ persona v chatu. Vedení (role ≥ PomocnyPJ) vystupuje pod jednotnou
 * identitou místo přihlašovacího jména. `name=null` → label „PJ";
 * `avatarUrl=null` → fallback iniciála. Render-time, neukládá se do zpráv.
 */
export interface PjChatPersona {
  enabled: boolean;
  name: string | null;
  avatarUrl: string | null;
  /**
   * 6.8-followup — režim vystupování vedení. `unified` = jednotná anonymní „PJ"
   * (default), `individual` = každý PJ/Pomocný PJ pod svou rolí + vlastním avatarem.
   * `undefined` (stará cache) → resolver bere jako `unified`.
   */
  mode?: 'unified' | 'individual';
}

/**
 * 15.4 (E) — výchozí nastavení map světa (PJ nastaví jednou; nová scéna je
 * zdědí, scéna pak může přepsat). Vše optional = bez nastavení → tvrdé defaulty.
 */
export interface MapDefaults {
  gridType?: 'hex' | 'square' | 'none';
  size?: number;
  unitsPerCell?: number;
  unitLabel?: string;
  showScale?: boolean;
  showHpPc?: boolean;
  showHpNpc?: boolean;
  showHpBestie?: boolean;
  allowPlayerDrawing?: boolean;
}

/** 16.1e — výchozí viditelnost HP v combat rosteru chatu (per typ). */
export interface ChatCombatDefaults {
  showHpPc?: boolean;
  showHpNpc?: boolean;
  showHpBestie?: boolean;
}

export interface WorldSettings {
  id: string;
  worldId: string;
  hiddenNavItems: string[];
  customGroups: string[];
  groupColors: Record<string, string>;
  /** Znak skupiny (emblém): název skupiny → url. Zrcadlí se do ikony chat kanálu. */
  groupImages?: Record<string, string>;
  /** 12.2 — vlastní navigace světa (strom skupin + odkazů), aditivní k systémové. */
  customHeadline?: HeadlineNode[];
  /** 12.2 — šablony menu (sady odkazů pro vkládání do navigace). */
  menuTemplates?: MenuTemplate[];
  /** 12.2 — „Last info" box (oznámení PJ). `null` = nenastaveno. */
  lastInfo?: LastInfo | null;
  /** 6.8 — PJ persona v chatu. `null`/`undefined` = nenastaveno (default „PJ"). */
  pjChatPersona?: PjChatPersona | null;
  /** 15.4 (E) — výchozí nastavení map (seed nové scény). `null` = nenastaveno. */
  mapDefaults?: MapDefaults | null;
  /** 16.1e — výchozí viditelnost HP v combat rosteru chatu. `null` = nenastaveno (→ true). */
  chatCombatDefaults?: ChatCombatDefaults | null;
  akjTypes: AkjType[];
  hideDefaultWeather: boolean;
  /** Side-task character-tab-visibility — pokud chybí, FE považuje vše za viditelné. */
  characterTabVisibility?: CharacterTabVisibility;
  /**
   * 9.3 — slug `CalendarConfig` použitý pro datum událostí na časové ose.
   * `null` = fallback na první config světa. Žádný side-effect na
   * `world.defaultCalendarConfigSlug` (ten řídí ostatní moduly).
   */
  timelineCalendarSlug: string | null;
  /**
   * 9.4 dluh #1 — in-game date pro advance-day mechanism (ISO string).
   * `null` = nezahájen herní čas.
   */
  currentInGameDate?: string | null;
  updatedAt: string;
}

/**
 * Spec 3.1b — typ novinky. Určuje barvu nadpisu
 * (info = fialová, warning = červená, system = zelená).
 */
export type IkarosNewsType = 'info' | 'warning' | 'system';

export interface IkarosNews {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAtUtc: string;
  /** Spec 3.1 — revertibilní soft toggle pro archiv. Default `false`. */
  archived: boolean;
  archivedAtUtc?: string;
  archivedByUserId?: string;
  /** Spec 3.1b — typ novinky. Vždy přítomné (BE default `'info'`). */
  type: IkarosNewsType;
  /** Spec 3.1b — URL obrázku nebo `undefined`. */
  imageUrl?: string;
}

/** Spec 3.1 — scope filter pro list/count endpointy. */
export type IkarosNewsScope = 'active' | 'archived' | 'all';

// ─── Spec 3.2 — Ikaros články ────────────────────────────────────────────

export type ArticleStatus = 'Draft' | 'Pending' | 'Published' | 'Rejected';

export interface ArticleRating {
  userId: string;
  stars: number;
  /** 3.4f — jméno recenzenta + volitelný text recenze. */
  userName: string;
  text: string;
  createdAtUtc: string;
}

export interface IkarosArticle {
  id: string;
  title: string;
  /** HTML z TipTap (3.2). */
  content: string;
  /** Slug, ref na `article_categories.key` (3.2a refactor z hardcoded enumu). */
  category: string;
  authorId: string;
  authorName: string;
  /** D-040 — platformový účet autora byl anonymizován; renderer zobrazí „Smazaný účet". */
  authorIsDeleted?: boolean;
  status: ArticleStatus;
  rejectReason?: string;
  ratings: ArticleRating[];
  averageRating: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  publishedAtUtc?: string;
}

export interface ArticleCategory {
  key: string;
  label: string;
  /** Hex barva `#RRGGBB`. */
  color: string;
  order: number;
}

export interface ArticleStats {
  draft: number;
  pending: number;
  published: number;
  rejected: number;
  totalRatings: number;
  averageRating: number;
}

/** Payload karty v Zpracovat tabu (3.2d renderer pro `article_pending_review`). */
export interface ArticleReviewListItem {
  articleId: string;
  title: string;
  /** Prvních 200 znaků obsahu, stripped HTML. */
  preview: string;
  category: string;
  authorId: string;
  authorName: string;
  /** D-040 — platformový účet autora byl anonymizován. */
  authorIsDeleted?: boolean;
  submittedAt: string;
}

// ─── Galerie (3.3) ─────────────────────────────────────────────────────────

export type GalleryStatus = 'Draft' | 'Pending' | 'Published' | 'Rejected';

/**
 * 20D (D1) — self-declared původ obrázku. `none` = běžné dílo, `ai_image` =
 * autor uvedl, že obrázek vytvořila AI (→ AiBadge). Rozšiřitelný enum.
 */
export type GalleryAiOrigin = 'none' | 'ai_image';

export interface GalleryRating {
  userId: string;
  stars: number;
  /** 3.4f — jméno recenzenta + volitelný text recenze. */
  userName: string;
  text: string;
  createdAtUtc: string;
}

export interface IkarosGalleryItem {
  id: string;
  title: string;
  description?: string;
  /** Cloudinary secure_url. */
  imageUrl: string;
  /** Cloudinary public_id (pro mazání assetu). */
  publicId: string;
  /** Rozměry pro masonry aspect-ratio (0 = starý dokument, fallback 1:1). */
  width: number;
  height: number;
  /** Slug, ref na `gallery_categories.key`. */
  category: string;
  authorId: string;
  authorName: string;
  /** D-040 — tombstone overlay v render. */
  authorIsDeleted?: boolean;
  status: GalleryStatus;
  rejectReason?: string;
  ratings: GalleryRating[];
  averageRating: number;
  /** 20D (D1) — self-declared AI původ; `ai_image` zapíná AiBadge. */
  aiOrigin?: GalleryAiOrigin;
  createdAtUtc: string;
  updatedAtUtc: string;
  publishedAtUtc?: string;
}

export interface GalleryCategory {
  key: string;
  label: string;
  /** Hex barva `#RRGGBB`. */
  color: string;
  order: number;
}

export interface GalleryStats {
  draft: number;
  pending: number;
  published: number;
  rejected: number;
  totalRatings: number;
  averageRating: number;
}

/** Payload karty v Zpracovat tabu (3.3b renderer pro `gallery_pending_review`). */
export interface GalleryReviewListItem {
  imageId: string;
  title: string;
  /** Cloudinary URL — FE z ní udělá thumbnail. */
  imageUrl: string;
  category: string;
  authorId: string;
  authorName: string;
  /** D-040 — platformový účet autora byl anonymizován. */
  authorIsDeleted?: boolean;
  submittedAt: string;
}

// ─── Diskuze (3.4) — entity ────────────────────────────────────────────────

export interface IkarosDiscussion {
  id: string;
  title: string;
  description: string;
  /** Vývěska — zvýrazněné oznámení v hlavičce diskuze. */
  bulletin: string;
  creatorId: string;
  creatorName: string;
  /** D-040 — tombstone overlay pro creator. */
  creatorIsDeleted?: boolean;
  isApproved: boolean;
  /** False = uzamčená (přístup jen pro pozvané). */
  isOpen: boolean;
  managerIds: string[];
  invitedUserIds: string[];
  joinRequestIds: string[];
  postCount: number;
  likeCount: number;
  createdAtUtc: string;
  lastActivityUtc: string;
}

export interface IkarosDiscussionPost {
  id: string;
  discussionId: string;
  authorId: string;
  authorName: string;
  /** D-040 — tombstone overlay pro autora postu. */
  authorIsDeleted?: boolean;
  /** HTML z RichTextEditoru. */
  content: string;
  createdAtUtc: string;
}

// ─── Nábory / LFG (19.3) — entity ──────────────────────────────────────────

/** 19.3 — strana náboru: hráč hledá hru, nebo PJ hledá hráče do světa. */
export type NaborStrana = 'hledam-hru' | 'hledam-hrace';

/**
 * 19.3 — motiv lístku = TVAR (12, parita s bestiářem). Nezávislá osa od
 * globálního skinu: motiv řídí jen tvar + signature ornament, barvy/fonty jdou
 * z `--theme-*` aktivního skinu. Hráč si motiv vybírá, PJ dědí motiv světa.
 */
export type NaborMotiv =
  | 'fantasy'
  | 'dark-fantasy'
  | 'vesmir'
  | 'cyberpunk'
  | 'steampunk'
  | 'apokalypsa'
  | 'horor'
  | 'mystery'
  | 'historie'
  | 'moderni'
  | 'western'
  | 'ikaros';

/** Pořadí = pořadí v pickeru; zdroj pravdy pro validaci i UI. */
export const NABOR_MOTIVY: readonly NaborMotiv[] = [
  'fantasy',
  'dark-fantasy',
  'vesmir',
  'cyberpunk',
  'steampunk',
  'apokalypsa',
  'horor',
  'mystery',
  'historie',
  'moderni',
  'western',
  'ikaros',
] as const;

/** Lidský název motivu pro picker. */
export const NABOR_MOTIV_LABELS: Record<NaborMotiv, string> = {
  fantasy: 'Fantasy',
  'dark-fantasy': 'Temná fantasy',
  vesmir: 'Sci-fi / vesmír',
  cyberpunk: 'Cyberpunk',
  steampunk: 'Steampunk',
  apokalypsa: 'Postapokalypsa',
  horor: 'Horor',
  mystery: 'Mysteriózní',
  historie: 'Historie',
  moderni: 'Moderní',
  western: 'Western',
  ikaros: 'Ikaros',
};

/** 19.3 — režim hraní. */
export type NaborMode = 'online' | 'zivo';

/** 19.3 — stav náboru (životnost). Skryté z výchozího filtru: `expired`. */
export type NaborStatus = 'open' | 'closed' | 'expired';

export interface Nabor {
  id: string;
  strana: NaborStrana;
  /** Tvar lístku (viz `NaborMotiv`). */
  motiv: NaborMotiv;
  /** Jen u `hledam-hrace` — propagovaný svět. */
  worldId?: string;
  worldSlug?: string;
  worldName?: string;
  title: string;
  body: string;
  /** Volitelný drobný obrázek (Cloudinary; kvóta 19.2). */
  imageUrl?: string;
  /**
   * 19.3b — RPG systém jako **canonical id** z `PLATFORM_SYSTEMS`
   * (`shared/rpg/systems.ts`), NE volný text. U PJ náboru zdědí z
   * `world.system` přes `resolveSystemId` (world drží „dlouhá" id).
   */
  system?: string;
  /**
   * 19.3b — žánr = **label** z `GENRES` (`shared/rpg/genres.ts`), 11 hodnot
   * bez „Vlastní". U PJ náboru zdědí z `world.genre`. Datová osa pro filtr —
   * neplést s `motiv` (vizuální osa, viz spec 19.3 §12.2).
   */
  genre?: string;
  mode: NaborMode;
  /** Město u `zivo`. */
  place?: string;
  /** Jen `hledam-hrace`. */
  seatsTotal?: number;
  seatsTaken?: number;
  status: NaborStatus;
  authorId: string;
  authorName: string;
  /** D-040 — platformový účet autora anonymizován → renderer „Smazaný účet". */
  authorIsDeleted?: boolean;
  createdAtUtc: string;
  /** Auto-expirace (viz spec 19.3 §6). */
  expiresAtUtc?: string;
}

export interface UpcomingEventDto {
  id: string;
  worldId: string;
  worldName: string;
  worldSlug: string;
  title: string;
  date: string;
  confirmable: boolean;
  myRsvp: 'confirmed' | 'none';
  confirmedCount: number;
}

/** 5.2 — potvrzení účasti na herní akci. */
export interface EventConfirmation {
  userId: string;
  userName: string;
}

/**
 * 9.1-II — komentář pod herní akcí. Root (`parentId: null`) nebo
 * jednoúrovňová odpověď (`parentId === root.id`, BE enforced). Smazaný
 * komentář má `content: ''` + `isDeleted: true` (placeholder v threadu).
 */
export interface EventComment {
  id: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  content: string;
  /** ISO 8601 — vytvoření. */
  createdAt: string;
  /** ISO 8601 nebo null. Pokud non-null → editovaný (zobrazí pill „upraveno"). */
  editedAt: string | null;
  /** emoji → seznam userIds, kteří reagovali. */
  reactions: Record<string, string[]>;
  isDeleted: boolean;
}

/**
 * 5.2 / 9.1 — herní akce světa (`GET /game-events?worldId=`). Plný tvar z BE
 * modulu `game-events`. 9.1-I přidává `imageFocalX/Y` (parita s IkarosEvent).
 *
 * BE neposílá `confirmedCount`/`myRsvp` — FE si je computuje z `confirmedBy`
 * + `currentUserId`.
 */
export interface GameEvent {
  id: string;
  worldId: string;
  title: string;
  date: string;
  description: string;
  imageUrl: string | null;
  /** 9.1-I — focal point obrázku (0–100, default null = 50/50). */
  imageFocalX: number | null;
  imageFocalY: number | null;
  /** 9.5+ — zoom 100–400 %, null = 100. */
  imageZoom?: number | null;
  /** 9.5+ — fit režim ('cover' default, 'contain' = vidět celý). */
  imageFit?: 'cover' | 'contain' | null;
  targetGroup: string | null;
  groupOnly: boolean;
  confirmable: boolean;
  confirmedBy: EventConfirmation[];
  /**
   * 9.1-II — komentáře pod akcí. List endpoint (`GET /game-events?worldId=`)
   * pole nevrací → undefined; detail endpoint (`GET /:id`) vrací plné pole.
   * Karta proto čte přes `event.comments?.length ?? 0`.
   */
  comments?: EventComment[];
  reminderSent: boolean;
  /** 27.1b — zlatá cesta ④: ID scénáře (CampaignScenario), který session hraje. */
  scenarioId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 5.2 — typ oznámení světa (řídí barvu type-proužku v kartě). */
export type WorldNewsType = 'info' | 'alert' | 'system';

/** 5.5b — scope archivu novinek světa. */
export type WorldNewsScope = 'active' | 'archived' | 'all';

/**
 * 5.2 — oznámení světa (`GET /world-news?worldId=`). `worldId: null` =
 * globální oznámení napříč platformou.
 */
export interface WorldNewsItem {
  id: string;
  worldId: string | null;
  title: string;
  content: string;
  /** ISO 8601 UTC. */
  date: string;
  type: WorldNewsType;
  /** Externí URL (legacy). FE preferuje `linkPageSlug` pokud je set. */
  link?: string;
  /** 9.5 — interní link na wiki stránku světa (slug). Priorita před `link`. */
  linkPageSlug?: string | null;
  /** 9.5 — hero obrázek + focal point (parita s GameEvent). */
  imageUrl?: string | null;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  /** 9.5+ — zoom 100–400 %, null = 100. */
  imageZoom?: number | null;
  /** 9.5+ — fit režim ('cover' default, 'contain' = vidět celý). */
  imageFit?: 'cover' | 'contain' | null;
  /** 9.2e — slug kalendáře pro fantasy datum (null = real-world display). */
  calendarConfigId?: string | null;
  /** 9.2e — fantasy datum (preferováno před `date` v UI pokud set). */
  calendarDate?: {
    year: number;
    monthIndex: number;
    day: number;
    hour?: number;
    minute?: number;
  } | null;
  createdBy?: string;
  /** 5.5b — archivovaná novinka (legacy bez pole = false). */
  archived?: boolean;
}

export interface IkarosEventAttendee {
  userId: string;
  userName: string;
}

export interface IkarosEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  imageUrl: string | null;
  imageFocalX: number | null;
  imageFocalY: number | null;
  /** 9.5+ — zoom 100–400 %, null = 100. */
  imageZoom?: number | null;
  /** 9.5+ — fit režim ('cover' default, 'contain' = vidět celý). */
  imageFit?: 'cover' | 'contain' | null;
  confirmable: boolean;
  confirmedCount: number;
  confirmedBy: IkarosEventAttendee[];
  myRsvp: 'confirmed' | 'none';
  authorId: string;
  authorName: string;
  createdAtUtc: string;
  isActive: boolean;
}

// Ikaros Messages (pošta — 3.5)
export interface UnreadCountResponse {
  unreadCount: number;
  /** 13.2b — nepřečtená systémová oznámení (záložka „Události" v centru). */
  systemUnread?: number;
}

export interface IkarosMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  subject: string;
  body: string;
  sentAtUtc: string;
  isRead: boolean;
  deletedBySender: boolean;
  deletedByRecipient: boolean;
  conversationId: string;
  replyToId?: string;
  createdAt: string;
  updatedAt: string;
}

export type MailFolder = 'dorucene' | 'odeslane';

// API error — BE response shape z HttpExceptionFilter
export interface ApiError {
  error: {
    code: string;       // např. 'CONFLICT', 'BAD_REQUEST', 'EMAIL_TAKEN', 'USERNAME_TAKEN'
    message: string | string[];
    timestamp: string;
  };
}

// Doménové error kódy pro registrační flow (1.2)
export type RegisterErrorCode = 'EMAIL_TAKEN' | 'USERNAME_TAKEN';

// Response z GET /auth/check-username a /check-email
export interface AvailabilityResponse {
  available: boolean;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ── Spec 1.4 — Public adresář + veřejný profil + univerzální action queue ───

export interface PublicUserListItem {
  id: string;
  username: string;
  displayName: string | null;
  city: string | null;
  avatarUrl: string | null;
  defaultAvatarType: DefaultAvatarType;
  role: UserRole;
  worldsCount: number;
  createdAt: string;
  /** 19.4 — status Podporovatel + kdy (badge v adresáři + zeď). */
  isSupporter?: boolean;
  supporterSince?: string;
  /** Admin-only flag (jen pokud requester je Admin/Superadmin + includeDeleted=1) */
  pendingDeletion?: boolean;
  /** Admin-only flag (jen pokud requester je Admin/Superadmin + includeDeleted=1) */
  deleted?: boolean;
}

export interface PublicUsersListResponse {
  items: PublicUserListItem[];
  total: number;
}

/** 19.4 — položka zdi podporovatelů (veřejný GET /users/supporters). */
export interface SupporterListItem {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  defaultAvatarType?: DefaultAvatarType;
  supporterSince: string | null;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  displayName: string | null;
  city: string | null;
  bio: string | null;
  avatarUrl: string | null;
  defaultAvatarType: DefaultAvatarType;
  characterName: string | null;
  characterBio: string | null;
  characterAvatarUrl: string | null;
  role: UserRole;
  worldsCount: number;
  createdAt: string;
  /** 19.4 — status Podporovatel + kdy (badge na profilu). */
  isSupporter?: boolean;
  supporterSince?: string;
  /** 1.5 D-050 — kdy byl naposledy aktivní. `null` pro hiddenPresence/tombstone. */
  lastSeenAt: string | null;
  /** 1.4 §15 — poslední přihlášení; přijde JEN platformovému Adminovi. */
  lastLoginAt?: string | null;
  pendingDeletion?: boolean;
  deleted?: boolean;
}

export type PublicUsersSort = 'new' | 'abc';

export interface PublicUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: PublicUsersSort;
  includeDeleted?: boolean;
}

/**
 * Univerzální action queue (Zpracovat tab). Každý typ má provider na BE
 * a renderer-by-type registry na FE. Spec design-1.4 §6.3 mapuje typ →
 * vizuální anatomie.
 */
export enum PendingActionType {
  UsernameRequest = 'username_request',
  FriendRequest = 'friend_request',
  WorldAccessRequest = 'world_access_request',
  /** 15.10 fáze B — cílená pozvánka do světa čekající na přijetí pozvaným. */
  WorldInvite = 'world_invite',
  ArticlePendingReview = 'article_pending_review',
  GalleryPendingReview = 'gallery_pending_review',
  DiscussionPendingReview = 'discussion_pending_review',
  // B4d — `discussion_report` sjednocen do generického `content_report`
  // (modul `moderation`); typ odstraněn.
  DiscussionJoinRequest = 'discussion_join_request',
  /** 20B — generický report napříč plochami (modul `moderation`). */
  ContentReport = 'content_report',
  /** 20B B4 — odvolání proti moderačnímu rozhodnutí (přezkum jiným moderátorem). */
  ModerationAppeal = 'moderation_appeal',
  /** 22.5 — publikované šablony scén čekající na schválení kurátorem. */
  CommunitySceneTemplatePendingReview = 'community_scene_template_pending_review',
}

// ─── Diskuze (3.4) — payloady karet ve Zpracovat tabu ──────────────────────

/** `discussion_pending_review` — diskuze čekající na schválení. */
export interface DiscussionReviewListItem {
  discussionId: string;
  title: string;
  descriptionExcerpt: string;
  creatorId: string;
  creatorName: string;
  /** D-040 — platformový účet creatora byl anonymizován. */
  creatorIsDeleted?: boolean;
  submittedAt: string;
}

// B4d — `DiscussionReportListItem` odstraněn; nahlášené příspěvky přicházejí
// jako generický `ContentReportListItem` (targetType='discussion_post').

/** `discussion_join_request` — žádost o přidání do uzamčené diskuze. */
export interface DiscussionJoinRequestListItem {
  discussionId: string;
  discussionTitle: string;
  userId: string;
  username: string;
}

/**
 * 20B `content_report` — nahlášený obsah (generická moderační fronta modulu
 * `moderation`). Zrcadlí BE `ContentReportListItem`. `reporterName` je `null`,
 * pokud byl report anonymní (identita oznamovatele se moderátorovi nezobrazí).
 */
export interface ContentReportListItem {
  reportId: string;
  /** Hodnota z `ReportTargetType` (viz `@/shared/moderation`). */
  targetType: string;
  targetUrl?: string;
  targetSnapshot: string;
  targetAuthorName: string;
  /** Hodnota z `ReportCategory` (viz `@/shared/moderation`). */
  category: string;
  reason: string;
  reporterName: string | null;
  createdAt: string;
}

/**
 * 20B B4 `moderation_appeal` — odvolání proti moderačnímu rozhodnutí čekající
 * na přezkum jiným moderátorem. Zrcadlí BE queue item. `action`/`targetType`
 * jsou string hodnoty z `ModerationAction`/`ReportTargetType`
 * (viz `@/shared/moderation`), stejný vzor jako `ContentReportListItem`.
 */
export interface AppealReviewListItem {
  appealId: string;
  decisionId: string;
  appellantName: string;
  reason: string;
  action: string;
  targetType: string;
  createdAt: string;
}

/**
 * 22.5 `community_scene_template_pending_review` — publikovaná šablona scény
 * čekající na schválení kurátorem (Zpracovat tab). Zrcadlí BE
 * `SceneTemplateReviewListItem`.
 */
export interface SceneTemplateReviewListItem {
  templateId: string;
  name: string;
  imageUrl: string;
  publicAuthorName: string;
  authorId: string;
  submittedAt: string;
}

export interface PendingActionsCountResponse {
  total: number;
  /**
   * Spec 3.8 — počet pending položek per queue typ. Obsahuje jen typy, které
   * uživatel přes BE `canHandle` vidí → FE z toho odvozuje per-doména badge
   * u nav položek (Diskuze/Články/Galerie) bez vlastní role logiky.
   */
  byType: Partial<Record<PendingActionType, number>>;
}

export interface PendingActionsListResponse<T = unknown> {
  items: T[];
  total: number;
}

// ── Spec 2.4 — World access requests (pre-membership) ─────────────────────

/**
 * Pre-membership entita pro vstup do open/private světů. Žadatel zatím není
 * členem; PJ schvaluje ve Zpracovat tabu (`world_access_request`).
 *
 * Sémantika rolí (PJ 2026-05-14): Žadatel jako role (WorldRole.Zadatel=0) ≠
 * tato entita. Žadatel = člen čekající na postavu (fáze 5+).
 */
export interface WorldAccessRequest {
  id: string;
  worldId: string;
  userId: string;
  requestedAt: string;
}

export interface MyWorldAccessRequest {
  accessRequest: WorldAccessRequest;
  world: {
    id: string;
    name: string;
    slug: string;
    accessMode: World['accessMode'];
  };
}

/** Payload karty v Zpracovat tabu (`world_access_request`). */
export interface WorldAccessRequestListItem {
  accessRequestId: string;
  worldId: string;
  worldName: string;
  worldSlug: string;
  requestedAt: string;
  requester: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  /** 15.10 fáze C — jméno navržené postavy („chce hrát jako …"); jinak žádost o vstup. */
  characterName?: string;
}

/** 15.10 fáze B — pozvánka POZVANÉMU ve Zpracovat tabu (`world_invite`). */
export interface WorldInvitePendingItem {
  inviteId: string;
  worldId: string;
  worldName: string;
  worldSlug: string;
  invitedBy?: { id: string; username: string; avatarUrl?: string };
  createdAt: string;
}

/** 15.10 fáze B — aktivní pozvánka v PJ přehledu světa. `token` jen u odkazu. */
export interface WorldInviteListItem {
  id: string;
  kind: 'user' | 'link';
  status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';
  token?: string;
  invitedUser?: { id: string; username: string; avatarUrl?: string };
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  createdAt?: string;
}

// ── Spec 1.8 — Přátelé ─────────────────────────────────────────────────────

export interface FriendListItem {
  friendshipId: string;
  acceptedAt: string;
  friend: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    defaultAvatarType: DefaultAvatarType;
    role: UserRole;
    city: string | null;
    /** D-NEW-INV-PROFILE — počet světů přítele (BE agregát, bez soft-deleted). */
    worldsCount: number;
    deleted: boolean;
    pendingDeletion: boolean;
  };
}

export interface FriendRequestListItem {
  friendshipId: string;
  requestedAt: string;
  direction: 'incoming' | 'outgoing';
  counterpart: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    defaultAvatarType: DefaultAvatarType;
    role: UserRole;
  };
}

export type FriendshipStatusKind =
  | 'none'
  | 'pending_outgoing'
  | 'pending_incoming'
  | 'accepted'
  | 'self'
  | 'cooldown'
  | 'blocked_by_me';

export interface FriendshipStatusResponse {
  kind: FriendshipStatusKind;
  friendshipId?: string;
}

export interface FriendshipDto {
  id: string;
  userAId: string;
  userBId: string;
  requestedById: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: string;
  acceptedAt: string | null;
  updatedAt: string;
}

export interface FriendsListResponse {
  items: FriendListItem[];
  total: number;
}

export interface FriendRequestsListResponse {
  items: FriendRequestListItem[];
  total: number;
}

// ── Spec D-055 — Block flow ────────────────────────────────────────────

export interface BlockedItem {
  friendshipId: string;
  blockedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    defaultAvatarType: DefaultAvatarType;
    role: UserRole;
    deleted: boolean;
  };
}

export interface BlocksListResponse {
  items: BlockedItem[];
  total: number;
}

// ── D-056 — Admin friendship debug ─────────────────────────────────────

export interface AdminFriendshipView {
  id: string;
  userAId: string;
  userBId: string;
  userAUsername: string | null;
  userBUsername: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  requestedById: string;
  blockedById: string | null;
  lastDeclinedAt: string | null;
  lastDeclinedById: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFriendshipByPairResponse {
  friendship: AdminFriendshipView | null;
}

export interface AdminFriendshipsListResponse {
  items: AdminFriendshipView[];
  total: number;
}

// ── 9.4-I — Počasí (World Weather) ─────────────────────────────────────

/**
 * 9.4-I — typ počasí. Mirror BE `WeatherTypeEntry['type']`.
 * `custom` je escape hatch pro fictional zóny (magie, sci-fi).
 */
export type WeatherType =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'storm'
  | 'snow'
  | 'fog'
  | 'custom';

export interface WeatherTypeEntry {
  type: WeatherType;
  label: string;
  icon: string;
  /** Pravděpodobnost v % (suma napříč `weatherTypes` = 100). */
  probability: number;
  /** [min, max] oktas (0-8) — pokrytí oblohy. */
  cloudRange: [number, number];
  /** [min, max] mm srážek. */
  precipRange: [number, number];
}

export interface CustomFieldConfig {
  label: string;
  possibleValues: string[];
  probability: number;
}

/**
 * 9.4-I — Köppen-Geiger zóna. Mirror BE + FE simulation modul.
 * `EXTRATERRESTRIAL` (Mars/Měsíc/...) a `CONTROLLED` (stanice/kupole) bypass standardní Köppen.
 */
export type KoppenZone =
  | 'Af'
  | 'Am'
  | 'Aw'
  | 'BWh'
  | 'BWk'
  | 'BSh'
  | 'BSk'
  | 'Csa'
  | 'Csb'
  | 'Cfa'
  | 'Cfb'
  | 'Dfa'
  | 'Dfb'
  | 'Dfc'
  | 'ET'
  | 'EF'
  | 'EXTRATERRESTRIAL'
  | 'CONTROLLED';

export interface WeatherGeneratorConfig {
  tempMin: number;
  tempMax: number;
  tempUnit: 'C' | 'F';
  weatherTypes: WeatherTypeEntry[];
  windMin: number;
  windMax: number;
  windGustMultiplier: number;
  pressureMin: number;
  pressureMax: number;
  humidityMin: number;
  humidityMax: number;
  customFields: CustomFieldConfig[];
  /** 9.4-I — měsíční průměry pro variance model. Délka = počet měsíců v calendar (12 default). */
  monthlyTemps?: number[];
  /** 9.4-I — měsíční std dev. Pokud chybí, fallback `KOPPEN_STDDEV[climateZone]`. */
  monthlyStdDev?: number[];
  /** 9.4-I — Köppen zóna pro Markov persistence + std dev. */
  climateZone?: KoppenZone;
}

export interface WeatherExtra {
  label: string;
  value: string;
  description?: string;
}

/**
 * 9.4-I — výsledek vygenerování / ručního nastavení počasí.
 * Mirror BE `WeatherResult` (Date → ISO string na FE).
 */
export interface WeatherResult {
  /** ISO timestamp (BE Date → JSON string). */
  generatedAt: string;
  isManual: boolean;
  temperature: number;
  tempUnit: string;
  weatherType: string;
  weatherIcon: string;
  cloudiness: { value: string; description: string };
  precipitation: { value: string; description: string };
  wind: { speed: number; gusts: number; unit: 'kmh' };
  pressure: { value: number; trend: string };
  humidity: number;
  extras: WeatherExtra[];
  narrativeText?: string | null;
  /** 9.4-I — variance metadata pro UI (anomaly chip + expected vs actual). */
  isAnomaly?: boolean;
  anomalyType?: 'heat_wave' | 'cold_snap' | 'severe_storm' | null;
  expectedAvg?: number | null;
  /** 9.4-I — calendar context (custom world calendar or Gregorian fallback). */
  calendarMonth?: { name: string; index: number; total: number } | null;
  /**
   * 9.4 — In-game datum/čas s kterým bylo počasí vygenerováno.
   * UI Card zobrazuje hour:minute místo real-world `generatedAt`.
   * `null` pokud svět nemá nastavený `worldSettings.currentInGameDate`.
   * ISO string (BE serializes Date jako string).
   */
  inGameDate?: string | null;
  /**
   * 9.4-J — `true` když config neměl `monthlyTemps` a BE musel použít synth
   * fallback. FE zobrazí banner „Opravit klimat" v Edit modalu generátoru.
   */
  climateModelMissing?: boolean;
}

export interface WeatherGenerator {
  id: string;
  worldId: string;
  name: string;
  description?: string;
  config: WeatherGeneratorConfig;
  currentWeather?: WeatherResult;
  /** ISO timestamps (BE Date → JSON string). */
  createdAt: string;
  updatedAt: string;
  /** 9.4-I — sdílené pořadí v gridu generátorů. */
  displayOrder: number;
}

/**
 * 9.4-dluh — Custom weather preset (per-world scoped snapshot).
 *
 * PJ může uložit aktuální generator config jako preset pro znovupoužití
 * při tvorbě dalších generátorů (např. „Severní lesy mého světa").
 * Config je immutable — editují se jen name/description/emoji.
 */
export interface CustomWeatherPreset {
  id: string;
  worldId: string;
  name: string;
  description?: string;
  emoji?: string;
  config: WeatherGeneratorConfig;
  /** UserID PJ který preset vytvořil. */
  createdBy: string;
  /** Counter — increment při „Použít" v wizardu. */
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 9.4 — Generator Set (kolekce presetů pro batch-create generátorů).
 *
 * PJ stiskne 1 tlačítko „Použít set" → BE vytvoří N generátorů najednou
 * podle items[]. Globální sety (sourceLevel: GLOBAL) jsou FE-static, custom
 * sety (sourceLevel: WORLD) jsou per-world v BE.
 */
export interface WeatherGeneratorSetItem {
  /**
   * Canonical preset ID z `buildAllPresetItems` (např. `city:Evropa:Česko:Praha`,
   * `archetype:cfb-oceanic`, `extreme:naica`, `custom:<id>`).
   */
  presetId: string;
  /** Jméno generátoru, pod kterým bude vytvořen ve světě. */
  generatorName: string;
  /** Volitelný popis (overrides default). */
  description?: string;
}

export interface WeatherGeneratorSet {
  id: string;
  worldId: string;
  name: string;
  description?: string;
  emoji?: string;
  items: WeatherGeneratorSetItem[];
  createdBy: string;
  /** Counter — increment při „Použít" applyu. */
  appliedCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload pro `POST /weather-sets/:id/apply` — resolved items.
 * FE rozresolvuje presetId → config přes `resolveSetItems` a pošle BE už
 * connect-and-ready data pro batch insertCount generátorů.
 */
export interface ResolvedSetItem {
  name: string;
  description?: string;
  config: WeatherGeneratorConfig;
}

/** 9.4-I — broadcast payload (chat kanál nebo mapa). */
export interface BroadcastWeatherInput {
  target: 'chat' | 'map';
  /** Vyžadováno pro `target: 'chat'`. */
  channelId?: string;
  /** Volitelná zpráva nad weather block. */
  message?: string;
}

/** 9.4 dluh #2 — historie počasí (snapshot persistence). */
export type WeatherHistoryTrigger = 'generate' | 'manual' | 'advance-day';

export interface WeatherHistoryEntry {
  id: string;
  worldId: string;
  generatorId: string;
  weather: WeatherResult;
  /** ISO timestamp (BE Date → JSON string), null pokud trigger != advance-day. */
  inGameDate: string | null;
  trigger: WeatherHistoryTrigger;
  /** ISO timestamp kdy byl snapshot zaznamenán. */
  recordedAt: string;
}

/** 9.4 dluh #1 — odpověď z advance-day endpointu. */
export interface AdvanceDayResult {
  /** ISO timestamp nové in-game date. */
  newInGameDate: string;
  monthIndex: number;
  monthName: string;
  day: number;
  year: number;
  updatedGenerators: WeatherGenerator[];
}

/**
 * 9.4 — Explicit set in-game date (PJ vyplní rok/měsíc/den).
 *
 * `year` může být negativní (BCE). `monthIndex` je 0-based (Gregorian 0..11,
 * custom kalendář 0..N-1). `day` je 1-based.
 *
 * `regenerateAll: true` (default v UI) → BE vygeneruje weather pro všechny
 * generátory s novým datem (best-effort — selhání jednoho nezablokuje set).
 */
export interface SetInGameDateInput {
  year: number;
  monthIndex: number;
  day: number;
  /** Hodina (0-23). Optional, default 12 (poledne). */
  hour?: number;
  /** Minuta (0-59). Optional, default 0. */
  minute?: number;
  regenerateAll?: boolean;
}

export interface SetInGameDateResult {
  settings: WorldSettings;
  regenerated: WeatherGenerator[];
}
