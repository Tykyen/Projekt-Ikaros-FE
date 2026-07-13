/**
 * 21.2a — deterministický RNG pro generátory (V9: „stejný seed = stejný
 * výsledek"). mulberry32 + xmur3 hash textového seedu; Zipfovo vážení (V2)
 * přes log-uniform výběr ranku (O(1), bez váhových dat).
 */

/** Generátor čísel v [0, 1) — všechny enginy berou tohle, ne Math.random. */
export type Rng = () => number;

/** xmur3 — hash textového seedu na 32bit číslo. */
export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/** mulberry32 — rychlý deterministický PRNG. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFromSeed(seed: string): Rng {
  return mulberry32(hashSeed(seed));
}

/** Náhodný sdílitelný seed (jen pro PRVOTNÍ volbu — pak už vše determinuje). */
export function randomSeedString(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Celé číslo v <min, max> včetně krajů. */
export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Trojúhelníkové rozdělení <min, max> s vrcholem mode. */
export function triangular(
  rng: Rng,
  min: number,
  mode: number,
  max: number,
): number {
  const u = rng();
  const c = (mode - min) / (max - min);
  return u < c
    ? min + Math.sqrt(u * (max - min) * (mode - min))
    : max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

/** Normální rozdělení (Box–Muller). */
export function normal(rng: Rng, mean: number, sd: number): number {
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Uniformní výběr prvku. */
export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * V2 — Zipfův výběr (s≈1): P(rank ≤ k) ≈ ln(k+1)/ln(n+1) → rank losujeme
 * log-uniformně. Seznam MUSÍ být seřazený od nejčastějšího (frequencySorted).
 */
export function pickZipf<T>(rng: Rng, arr: readonly T[]): T {
  const n = arr.length;
  const idx = Math.min(n - 1, Math.floor(Math.exp(rng() * Math.log(n + 1))) - 1);
  return arr[Math.max(0, idx)];
}

/** Vážený výběr z dvojic [hodnota, váha]. */
export function pickWeighted<T>(
  rng: Rng,
  entries: readonly (readonly [T, number])[],
): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = rng() * total;
  for (const [value, w] of entries) {
    roll -= w;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}
