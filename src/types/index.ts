export enum UserRole {
  Superadmin = 1,
  Admin = 2,
  PJ = 3,
  Korektor = 4,
  Hrac = 5,
  Ctenar = 6,
  Zadatel = 7,
  Zakaz = 8,
  Ikarus = 9,
  SpravceBohu = 10,
  SpravceGalerie = 11,
  SprávceDisukzi = 12,
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
  ikarosSkin?: string;
  themeSettings: Record<string, unknown>;
  chatPreferences: Record<string, unknown>;
  favoriteDiscussionIds: string[];
  isOnline: boolean;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
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
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

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
