/**
 * 21.5a — Komunitní (globální) herbář: FE typy (mirror BE Plant community scope).
 * Jednodušší než bestiář — bez per-systém statbloků a bez diskuse.
 */
import type { ImageFit } from '@/shared/lib/imageStyle';

export type PlantStatus = 'draft' | 'approved';

/** Stupeň vzácnosti rostliny (klíč = hodnota v BE). */
export type PlantRarity =
  | 'bezna'
  | 'stredne_bezna'
  | 'stredne_vzacna'
  | 'vzacna'
  | 'velmi_vzacna';

/** CZ labely stupňů vzácnosti (pořadí = od nejběžnější po nejvzácnější). */
export const RARITY_OPTIONS: { id: PlantRarity; label: string }[] = [
  { id: 'bezna', label: 'Běžná' },
  { id: 'stredne_bezna', label: 'Středně běžná' },
  { id: 'stredne_vzacna', label: 'Středně vzácná' },
  { id: 'vzacna', label: 'Vzácná' },
  { id: 'velmi_vzacna', label: 'Velmi vzácná' },
];

export function rarityLabel(rarity?: PlantRarity | null): string {
  return RARITY_OPTIONS.find((r) => r.id === rarity)?.label ?? '';
}

/** Globální (komunitní) rostlina: sdílený katalog bylin a jejich účinků. */
export interface GlobalPlant {
  id: string;
  scope: 'community';
  /** Primární název. */
  name: string;
  /** Lidová jména (volný text). */
  aliases?: string;
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  /** „Roste" — kde se vyskytuje. */
  habitat?: string;
  /** „Použití" — k čemu slouží. */
  usage?: string;
  rarity?: PlantRarity;
  rarityNote?: string;
  description?: string;
  tags?: string[];
  suggestedPrice?: number | null;
  /** 'draft' = knihovna návrhů, 'approved' = schválená knihovna. */
  status: PlantStatus;
  authorId?: string;
  approvedAt?: string | null;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Payloady ──
export interface CreatePlantPayload {
  name: string;
  aliases?: string;
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  habitat?: string;
  usage?: string;
  rarity?: PlantRarity;
  rarityNote?: string;
  description?: string;
  tags?: string[];
  suggestedPrice?: number | null;
}

/** Úprava rostliny — mění všechna pole (autor nebo kurátor). */
export type UpdatePlantPayload = Partial<CreatePlantPayload>;

export interface HerbarLibraryFilter {
  status?: PlantStatus;
  rarity?: PlantRarity;
  tag?: string;
}
