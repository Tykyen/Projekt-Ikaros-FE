/**
 * 21.5b — mapper lektvar → položka vkladu do obchodu (generický
 * `InsertToShopModal` z herbáře, spec §5).
 */
import type { ShopInsertItem } from '../herbar/shopInsert';
import type { GlobalPotion } from './types';

export function potionToShopInsert(p: GlobalPotion): ShopInsertItem {
  const parts: string[] = [];
  if (p.kind?.trim()) parts.push(`Druh: ${p.kind.trim()}.`);
  if (p.ingredients?.length) {
    const ings = p.ingredients
      .map((i) => (i.amount?.trim() ? `${i.name} (${i.amount.trim()})` : i.name))
      .join(', ');
    parts.push(`Suroviny: ${ings}.`);
  }
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
