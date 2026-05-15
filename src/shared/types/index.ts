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
}

export type DefaultAvatarType = 'male' | 'female' | 'being';

/**
 * D-033 — Granular admin permissions.
 * Defaultně všechny `false`. Nastavovat smí jen Superadmin.
 */
export interface AdminPermissions {
  canManageAdmins: boolean;
  canModerateContent: boolean;
  canEditPlatformPages: boolean;
}

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  canManageAdmins: false,
  canModerateContent: false,
  canEditPlatformPages: false,
};

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  displayName?: string;
  avatarUrl?: string;
  profileImageUrl?: string;
  characterPath?: string;
  ikarosSkin?: string;
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
  /** 1.5 D-052 — privacy „neviditelný" mód (skrýt online stav před ostatními). */
  hiddenPresence?: boolean;
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
  favoriteDiscussionIds: string[];
  isOnline: boolean;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

// 1.3b — Username change request
export type UsernameChangeRequestStatus = 'pending' | 'approved' | 'rejected';

export interface UsernameChangeRequest {
  id: string;
  userId: string;
  requestedUsername: string;
  requestedUsernameLower: string;
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
}

// D-024 — Admin audit log
// D-056 — rozšířeno o FRIENDSHIP_COOLDOWN_RESET (admin override per-pair cooldownu)
export type AdminAuditAction =
  | 'BAN'
  | 'UNBAN'
  | 'ROLE_CHANGE'
  | 'ADMIN_PERMISSIONS_CHANGE'
  | 'USERNAME_REQUEST_APPROVED'
  | 'USERNAME_REQUEST_REJECTED'
  | 'FRIENDSHIP_COOLDOWN_RESET';

export interface AdminAuditLogEntry {
  id: string;
  actorId: string;
  actorUsername: string;
  targetId: string;
  targetUsername: string;
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
  // D-011 — honeypot (skutečný uživatel nevyplňuje, bot ano → BE odmítne)
  hp?: string;
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
export type LoginResponse = LoginOkResponse | LoginDeletionPendingResponse;

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  avatarUrl?: string;
  characterPath?: string;
  ikarosSkin?: string;
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
  ikarosSkin: string;
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
  ownerId: string;
  isActive: boolean;
  accessMode: 'public' | 'private' | 'open' | 'closed';
  playerCount: number;
  /** 2.2 — volitelná max kapacita pro sort "volná místa" + 2.3 wizard. */
  maxPlayers?: number | null;
  favoritePageSlugs: string[];
  createdAt: string;
  updatedAt: string;
  /** Spec 2.4 — populated jen při `GET /worlds/:id` / `GET /worlds/slug/:slug`. */
  owner?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

export interface WorldMembership {
  id: string;
  userId: string;
  worldId: string;
  role: WorldRole;
  joinedAt: string;
  characterPath?: string;
  group?: string;
}

export interface MyWorldEntry {
  world: World;
  membership: WorldMembership;
}

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
}

/** Spec 3.1 — scope filter pro list/count endpointy. */
export type IkarosNewsScope = 'active' | 'archived' | 'all';

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
  confirmable: boolean;
  confirmedCount: number;
  confirmedBy: IkarosEventAttendee[];
  myRsvp: 'confirmed' | 'none';
  authorId: string;
  authorName: string;
  createdAtUtc: string;
  isActive: boolean;
}

// Ikaros Messages
export interface UnreadCountResponse {
  unreadCount: number;
  pendingRequestCount: number;
}

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
  /** Admin-only flag (jen pokud requester je Admin/Superadmin + includeDeleted=1) */
  pendingDeletion?: boolean;
  /** Admin-only flag (jen pokud requester je Admin/Superadmin + includeDeleted=1) */
  deleted?: boolean;
}

export interface PublicUsersListResponse {
  items: PublicUserListItem[];
  total: number;
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
  /** 1.5 D-050 — kdy byl naposledy aktivní. `null` pro hiddenPresence/tombstone. */
  lastSeenAt: string | null;
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
  ArticlePendingReview = 'article_pending_review',
  GalleryPendingReview = 'gallery_pending_review',
  DiscussionReport = 'discussion_report',
  DiscussionJoinRequest = 'discussion_join_request',
}

export interface PendingActionsCountResponse {
  total: number;
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
