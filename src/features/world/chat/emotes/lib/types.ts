/**
 * Krok 6.4 — typy pro per-svět + globální custom emoty.
 *
 * Pojmenování konvence:
 * - `worldId === null` → globální emote (platformový, viditelný napříč světy).
 * - `worldId === string` → per-svět emote (jen členové daného světa).
 *
 * `imageId` = Cloudinary publicId (storage reference). `imageUrl` = plná URL
 * (FE render bez nutnosti znát cloud_name).
 */

export interface WorldEmote {
  id: string;
  worldId: string | null;
  name: string;
  shortcode: string;
  imageId: string;
  imageUrl: string;
  createdBy: string;
  /** D-NEW-emote-categories — volné tagy pro filtraci v admin gridu. */
  tags: string[];
  createdAt: string;
}

/** DTO pro `POST /emotes/:worldId` a `POST /emotes/global`. */
export interface CreateEmoteDto {
  name: string;
  shortcode: string;
  imageId: string;
  imageUrl: string;
  tags?: string[];
}

/** DTO pro `POST /emotes/:worldId/:id/copy`. */
export interface CopyEmoteDto {
  targetWorldId: string;
}

/** Validace shortcode — synchron s BE `Matches(/^[a-z0-9_]{2,32}$/)`. */
export const SHORTCODE_REGEX = /^[a-z0-9_]{2,32}$/;

/** Limity z BE — pro FE counter UX. */
export const EMOTE_LIMIT_PER_WORLD = 100;
export const EMOTE_LIMIT_GLOBAL = 200;
