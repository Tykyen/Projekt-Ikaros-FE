/**
 * 21.5d — Komunitní katalog hádanek: FE typy (mirror BE Riddle + RiddleComment).
 * Bez statblocků a bez obchodu — nejjednodušší knihovna. Identita hádanky =
 * zadání (`question`, žádné `name` — spoiler). Odpověď + nápovědy skrývá FE
 * za spoiler klik.
 */
import type { ImageFit } from '@/shared/lib/imageStyle';

export type RiddleStatus = 'draft' | 'approved';

/** Úroveň obtížnosti — povinná, hlavní filtr (klíč = hodnota v BE). */
export type RiddleDifficulty = 'lehka' | 'stredni' | 'tezka' | 'ultratezka';

/** CZ labely úrovní (pořadí = od nejlehčí). */
export const DIFFICULTY_OPTIONS: { id: RiddleDifficulty; label: string }[] = [
  { id: 'lehka', label: 'Lehká' },
  { id: 'stredni', label: 'Střední' },
  { id: 'tezka', label: 'Těžká' },
  { id: 'ultratezka', label: 'Ultratěžká' },
];

export function difficultyLabel(d?: RiddleDifficulty | null): string {
  return DIFFICULTY_OPTIONS.find((o) => o.id === d)?.label ?? '';
}

/** Zkrácené zadání pro list/breadcrumb (hádanka nemá name). */
export function riddleExcerpt(question: string, max = 80): string {
  const q = question.trim().replace(/\s+/g, ' ');
  return q.length > max ? q.slice(0, max - 1) + '…' : q;
}

/** Globální (komunitní) hádanka. */
export interface GlobalRiddle {
  id: string;
  scope: 'community';
  /** Zadání (identita hádanky). */
  question: string;
  /** Odpověď — zobrazovat jen za spoiler. */
  answer: string;
  /** Postupné nápovědy (0–5). */
  hints: string[];
  difficulty: RiddleDifficulty;
  /** Původ („lidová", „antika — Homér", …). */
  origin?: string;
  /** Poznámka pro PJ / kontext. */
  description?: string;
  tags?: string[];
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  /** 'draft' = knihovna návrhů, 'approved' = schválená knihovna. */
  status: RiddleStatus;
  authorId?: string;
  approvedAt?: string | null;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/** Komentář hádanky — jedna úroveň. */
export interface RiddleComment {
  id: string;
  riddleId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ── Payloady ──
export interface CreateRiddlePayload {
  question: string;
  answer: string;
  hints?: string[];
  difficulty: RiddleDifficulty;
  origin?: string;
  description?: string;
  tags?: string[];
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
}

/** Úprava — mění všechna pole (autor nebo kurátor, žádný statblock split). */
export type UpdateRiddlePayload = Partial<CreateRiddlePayload>;

export interface CreateRiddleCommentPayload {
  content: string;
}

export interface RiddleLibraryFilter {
  status?: RiddleStatus;
  difficulty?: RiddleDifficulty;
  tag?: string;
}
