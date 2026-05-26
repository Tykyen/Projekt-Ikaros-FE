import type { WorldCurrencyItem } from '../types';

/**
 * Spec 11.4 §4.6 — výpočet nových kurzů při změně základní měny.
 *
 * Důvod, proč funguje: kurz `rate` u currency X znamená "kolik base za 1 X".
 * Pokud nově určím Y jako base, faktor = `1 / yRate` (původní rate Y),
 * pak všechny rate vynásobím faktorem → poměry zachovány, jen jiná referencí
 * měna sedí na 1.0.
 *
 * Příklad: ZL=1, ST=0.1, MD=0.01 → newBase=ST.
 *   faktor = 1 / 0.1 = 10
 *   ZL: 1 × 10 = 10
 *   ST: 0.1 × 10 = 1.0  ✓
 *   MD: 0.01 × 10 = 0.1
 *   Poměr ZL:ST:MD = 10:1:0.1 = 100:10:1 — stejný jako 1:0.1:0.01.
 *
 * @throws Error pokud `newBaseCode` neexistuje v `items`
 * @throws Error pokud nová base má `rate <= 0` (corruptovaná data)
 */
export function recomputeRatesForNewBase(
  items: WorldCurrencyItem[],
  newBaseCode: string,
): WorldCurrencyItem[] {
  const newBase = items.find((i) => i.code === newBaseCode);
  if (!newBase) {
    throw new Error(
      `recomputeRatesForNewBase: měna '${newBaseCode}' v items neexistuje`,
    );
  }
  if (newBase.rate <= 0) {
    throw new Error(
      `recomputeRatesForNewBase: měna '${newBaseCode}' má neplatný kurz (${newBase.rate})`,
    );
  }
  if (newBase.rate === 1.0) {
    // No-op: vybraná měna už je základ.
    return items;
  }
  const factor = 1 / newBase.rate;
  return items.map((item) => ({
    ...item,
    rate: roundRate(item.rate * factor),
  }));
}

/**
 * Zarovná na 6 desetinných míst — drží přesnost dost vysokou aby se poměry
 * nepokazily ani po 2–3 set-as-base cyklech, ale dost nízkou aby BE nevracel
 * `1.0000000000000002` artefakty z double math.
 */
function roundRate(rate: number): number {
  return Math.round(rate * 1_000_000) / 1_000_000;
}

/**
 * Reorder helper — vrátí novou kopii items s `newBaseCode` na pozici 0.
 * Stránka 11.4 dělá tohle ihned po `recomputeRatesForNewBase`, aby base
 * měna byla vždy první v seznamu (UI invariant per spec §4.3).
 */
export function moveBaseToFront(
  items: WorldCurrencyItem[],
  baseCode: string,
): WorldCurrencyItem[] {
  const idx = items.findIndex((i) => i.code === baseCode);
  if (idx <= 0) return items;
  const copy = [...items];
  const [base] = copy.splice(idx, 1);
  copy.unshift(base);
  return copy;
}
