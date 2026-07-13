/**
 * 21.5f — mapper položka ceníku → položka vkladu do obchodu (generický
 * `InsertToShopModal` z herbáře). Strukturovaná cena jde v `priceGsc` —
 * modal ji přepočte per položka ve zvolené měně (1 zl = 10 st = 100 md).
 */
import type { ShopInsertItem } from '../herbar/shopInsert';
import type { PriceListItem } from './types';

export function cenikItemToShopInsert(it: PriceListItem): ShopInsertItem {
  const parts: string[] = [];
  if (it.description?.trim()) parts.push(it.description.trim());
  if (it.section?.trim()) parts.push(`Sekce: ${it.section.trim()}.`);
  return {
    name: it.name,
    description: parts.length ? parts.join(' ') : undefined,
    imageUrl: it.imageUrl,
    imageFocalX: it.imageFocalX,
    imageFocalY: it.imageFocalY,
    imageZoom: it.imageZoom,
    imageFit: it.imageFit,
    priceGsc: { gold: it.gold, silver: it.silver, copper: it.copper },
  };
}
