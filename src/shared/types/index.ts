export enum UserRole {
  Superadmin = 1,
  Admin = 2,
  PJ = 3,
  Korektor = 4,
  Hrac = 5,
  Ctenar = 6,
  Zadatel = 7,
  Ikarus = 9,
  SpravceClanku = 10,
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
export type AdminAuditAction =
  | 'BAN'
  | 'UNBAN'
  | 'ROLE_CHANGE'
  | 'ADMIN_PERMISSIONS_CHANGE'
  | 'USERNAME_REQUEST_APPROVED'
  | 'USERNAME_REQUEST_REJECTED';

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
export enum WorldRole {
  Pending   = -1,
  Hrac      = 0,
  Korektor  = 1,
  PomocnyPJ = 2,
  PJ        = 3,
}

export interface World {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  genre?: string;
  tones?: string[];
  system: string;
  ownerId: string;
  isActive: boolean;
  accessMode: 'public' | 'private' | 'open' | 'closed';
  playerCount: number;
  favoritePageSlugs: string[];
  createdAt: string;
  updatedAt: string;
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
  WorldJoinRequest = 'world_join_request',
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
