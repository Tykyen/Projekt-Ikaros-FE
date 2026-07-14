/**
 * 21.2a — Generátory: FE typy jmenných sad (mirror BE NameSet).
 * Sada = národ/stát: mužská + ženská jména + příjmení (+ přízviska V7).
 */

export type NameSetStatus = 'draft' | 'approved';
export type NameSetCategory = 'morvol' | 'svet' | 'vlastni';
export type FemaleSurnameRule = 'none' | 'cs';

export const NAME_SET_CATEGORY_LABELS: Record<NameSetCategory, string> = {
  morvol: 'Fantasy (rasy)',
  svet: 'Státy světa',
  vlastni: 'Vlastní',
};

/** V6 — volitelný demografický profil (elfí sada = elfí demografie potomků). */
export interface NameSetDemography {
  /** Násobek lidského dožití. */
  lifespanMult?: number;
  fertilityFrom?: number;
  fertilityTo?: number;
}

export interface GlobalNameSet {
  id: string;
  scope: 'community';
  name: string;
  category: NameSetCategory;
  description?: string;
  /** „Nemá příjmení" / „podle rodiče" (Ogerská, Saimatei). */
  surnameNote?: string;
  tags?: string[];
  maleNames: string[];
  femaleNames: string[];
  surnames: string[];
  epithets: string[];
  femaleSurnameRule: FemaleSurnameRule;
  /** Seznamy seřazené dle četnosti → jde zapnout „běžná jména častěji". */
  frequencySorted: boolean;
  demography?: NameSetDemography | null;
  status: NameSetStatus;
  authorId: string;
  approvedAt?: string | null;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/** Souhrn sady pro list (bez jmenných polí — ta dává až detail). */
export interface NameSetSummary {
  id: string;
  name: string;
  category: NameSetCategory;
  description?: string;
  surnameNote?: string;
  tags?: string[];
  femaleSurnameRule: FemaleSurnameRule;
  frequencySorted: boolean;
  demography?: NameSetDemography | null;
  status: NameSetStatus;
  authorId: string;
  counts: { male: number; female: number; surnames: number; epithets: number };
  createdAt: string;
  updatedAt: string;
}

// ── Payloady ──

export interface CreateNameSetPayload {
  name: string;
  category: NameSetCategory;
  description?: string;
  surnameNote?: string;
  tags?: string[];
  maleNames?: string[];
  femaleNames?: string[];
  surnames?: string[];
  epithets?: string[];
  femaleSurnameRule?: FemaleSurnameRule;
  frequencySorted?: boolean;
  demography?: NameSetDemography;
}

export type UpdateNameSetPayload = Partial<CreateNameSetPayload>;

export interface NameSetsFilter {
  status?: NameSetStatus;
  category?: NameSetCategory;
  tag?: string;
}
