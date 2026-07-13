/**
 * 21.5e — mapper předmět → položka vkladu do obchodu (generický
 * `InsertToShopModal` z herbáře, spec R6).
 */
import type { ShopInsertItem } from '../herbar/shopInsert';
import type { GlobalItem } from './types';

export function catalogItemToShopInsert(p: GlobalItem): ShopInsertItem {
  const parts: string[] = [];
  if (p.kind?.trim()) parts.push(`Druh: ${p.kind.trim()}.`);
  if (p.description?.trim()) parts.push(p.description.trim());
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
