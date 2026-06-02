/**
 * Krok 11.3 §4.4 / §5A.2 — výpočet ceny po slevě + převod pro řazení.
 *
 * Sleva: **položka přebíjí skupinu** (specificity item > subgroup > group),
 * nesčítá se. Vždy procenta 0–100. Důvod % (ne absolutní částka): funguje
 * napříč měnami, nerozbije se převodem.
 *
 * ⚠️ FE výsledek je jen optimistic náhled — autoritativní cenu při nákupu
 * počítá BE (N1). Math zrcadlí `convertAmount` (BE `world-currencies`).
 */
import type { ShopItem, ShopGroup } from './types';
import { convertAmount } from '@/features/world/currencies/shared/convertAmount';
import type { WorldCurrencyItem } from '@/features/world/currencies/types';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Efektivní sleva v %: nenulová sleva položky přebíjí podskupinu, ta přebíjí
 * skupinu. `0` na položce = „bez vlastní slevy" → spadne na skupinovou.
 */
export function effectiveDiscount(
  item: Pick<ShopItem, 'discountPercent'>,
  group?: Pick<ShopGroup, 'discountPercent'> | null,
  subgroup?: Pick<ShopGroup, 'discountPercent'> | null,
): number {
  let d = 0;
  if (item.discountPercent > 0) d = item.discountPercent;
  else if (subgroup && subgroup.discountPercent > 0) d = subgroup.discountPercent;
  else if (group && group.discountPercent > 0) d = group.discountPercent;
  return clamp(d, 0, 100);
}

/** Cena po slevě v měně položky, zaokrouhlená na 4 des. místa. */
export function effectivePrice(
  item: Pick<ShopItem, 'price' | 'discountPercent'>,
  group?: Pick<ShopGroup, 'discountPercent'> | null,
  subgroup?: Pick<ShopGroup, 'discountPercent'> | null,
): number {
  const disc = effectiveDiscount(item, group, subgroup);
  const raw = item.price * (1 - disc / 100);
  return Math.round(raw * 10000) / 10000;
}

/**
 * Efektivní cena převedená do `toCode` (pro řazení napříč měnami). `null` =
 * měna položky/cíl chybí v `items` → řadicí kód ji dá na konec.
 */
export function effectivePriceInCurrency(
  item: Pick<ShopItem, 'price' | 'discountPercent' | 'currencyCode'>,
  toCode: string,
  items: WorldCurrencyItem[],
  group?: Pick<ShopGroup, 'discountPercent'> | null,
  subgroup?: Pick<ShopGroup, 'discountPercent'> | null,
): number | null {
  const eff = effectivePrice(item, group, subgroup);
  if (!item.currencyCode) return eff;
  return convertAmount(eff, item.currencyCode, toCode, items);
}
