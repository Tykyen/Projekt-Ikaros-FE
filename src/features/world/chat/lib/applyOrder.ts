/**
 * 6.7b — seřadí položky dle osobního pořadí (`order` = pole id). Položky mimo
 * `order` (nově vzniklé) jdou na konec a mezi sebou drží vstupní pořadí
 * (= globální `order` z BE). Prázdné `order` → vrací vstup beze změny.
 */
export function applyOrder<T>(
  items: T[],
  order: string[],
  idOf: (i: T) => string,
): T[] {
  if (order.length === 0) return items;
  const pos = new Map(order.map((id, i) => [id, i]));
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      const pa = pos.get(idOf(a.item)) ?? Infinity;
      const pb = pos.get(idOf(b.item)) ?? Infinity;
      return pa - pb || a.i - b.i;
    })
    .map((x) => x.item);
}
