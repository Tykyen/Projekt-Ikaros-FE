/**
 * Pure currency utils — sdílená vrstva (spec 11.4 §4.7b).
 *
 * Konzumenti: stránka 11.4 (převodník), budoucí Shop (11.3c), Character
 * finance (8.x), inventory. Žije v `shared/`, exportuje se přes barrel.
 */

import type { WorldCurrencyItem } from '../types';

/**
 * Klient-side mirror BE matematiky (`world-currencies.service.ts:87–88`):
 *   raw = amount * (fromRate / toRate)
 *   result = round(raw * 10000) / 10000
 *
 * Vrací `null` pokud `fromCode` / `toCode` neexistuje v `items`.
 * Pro `fromCode === toCode` vrací `amount` bezešvě (žádný rounding).
 *
 * Účel: instant optimistic preview v UI bez BE round-tripu. Pokud konzument
 * potřebuje autoritativní výsledek (např. transakce), volá BE `POST .../convert`.
 */
export function convertAmount(
  amount: number,
  fromCode: string,
  toCode: string,
  items: WorldCurrencyItem[],
): number | null {
  if (fromCode === toCode) return amount;
  const from = items.find((i) => i.code === fromCode);
  const to = items.find((i) => i.code === toCode);
  if (!from || !to) return null;
  if (to.rate === 0) return null;
  const raw = amount * (from.rate / to.rate);
  return Math.round(raw * 10000) / 10000;
}

/**
 * Číslo formátované v cs-CZ s ořezem trailing zeros.
 * `100.0000` → `"100"`, `12.5000` → `"12,5"`, `0.0042` → `"0,0042"`.
 */
export function formatAmount(
  value: number,
  opts: { maxDecimals?: number } = {},
): string {
  const max = opts.maxDecimals ?? 4;
  return new Intl.NumberFormat('cs-CZ', {
    maximumFractionDigits: max,
    useGrouping: true,
  }).format(value);
}

/**
 * `{amount} {symbol}` — symbol s fallbackem na `code`, pokud měna nemá
 * vyplněný symbol (BE povoluje prázdný string). Pokud měna v `items` chybí,
 * vrátíme čisté `{amount} {code}` (defensive — konzument může mít stale data).
 */
export function formatCurrency(
  amount: number,
  code: string,
  items: WorldCurrencyItem[],
): string {
  const cur = items.find((i) => i.code === code);
  const sym = cur?.symbol?.trim() || code;
  return `${formatAmount(amount)} ${sym}`;
}

/**
 * Pure helper — vrátí symbol měny (s fallbackem na code). Konzumenti, kteří
 * chtějí jen suffix do inputu (např. „Částka [..........] ZL"), si vytáhnou
 * sám symbol bez formátování amountu.
 */
export function getCurrencySymbol(
  code: string,
  items: WorldCurrencyItem[],
): string {
  const cur = items.find((i) => i.code === code);
  return cur?.symbol?.trim() || code;
}
