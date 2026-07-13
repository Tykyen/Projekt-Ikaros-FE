/**
 * 21.5a/21.5b — kontrakt vkladu katalogové položky do obchodu světa.
 * `ShopInsertItem` je vstup generického `InsertToShopModal`; mapery per
 * katalog: `plantToShopInsert` (herbář) a `potionToShopInsert` (lektvary).
 */
import type { ImageFit } from '@/shared/lib/imageStyle';
import type { GlobalPlant } from './types';

/** Katalogová položka připravená k vkladu do obchodu (mapují ji volající). */
export interface ShopInsertItem {
  name: string;
  description?: string;
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  suggestedPrice?: number | null;
  /**
   * 21.5f — strukturovaná cena zlaté/stříbrné/měďáky (poměr 1:10:100).
   * Mají-li ji VŠECHNY položky, modal místo jedné výchozí ceny přepočte
   * cenu per položka (`gold + silver/10 + copper/100`) ve zvolené měně.
   */
  priceGsc?: { gold: number; silver: number; copper: number };
}

/** Rostlina herbáře → položka vkladu (souhrn Roste/Použití/Lidová jména). */
export function plantToShopInsert(p: GlobalPlant): ShopInsertItem {
  const parts: string[] = [];
  if (p.habitat?.trim()) parts.push(`Roste: ${p.habitat.trim()}.`);
  if (p.usage?.trim()) parts.push(`Použití: ${p.usage.trim()}.`);
  if (p.aliases?.trim()) parts.push(`Lidová jména: ${p.aliases.trim()}.`);
  return {
    name: p.name,
    description: parts.length ? parts.join(' ') : undefined,
    imageUrl: p.imageUrl,
    imageFocalX: p.imageFocalX,
    imageFocalY: p.imageFocalY,
    imageZoom: p.imageZoom,
    imageFit: p.imageFit,
    suggestedPrice: p.suggestedPrice,
  };
}
