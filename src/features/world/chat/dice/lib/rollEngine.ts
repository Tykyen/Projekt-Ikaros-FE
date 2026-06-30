/**
 * Krok 6.3b — Roll engine pro hod kostkou.
 *
 * Port `C:/Matrix/Matrix/frontend/src/utils/diceHelpers.ts` s drobnými
 * refactory pro TS-safe / ESM. Pokrývá:
 * - Fate (4dF, hodnoty z {−1, 0, 1})
 * - Generic XdN (`d20`, `d6`, ...)
 * - Pool (`pool-dN` s libovolným počtem)
 * - Mixed (`{ d6: 2, d20: 1 }`)
 * - d100 (tens + ones, 00+0 → 100)
 *
 * Formátovací funkce drží shape zprávy, který BE regex
 * `/^(🎲\s*HOD\s+FATE:|Hod\s+Kostkou)/i` rozpozná.
 *
 * Random source = `secureRandomInt` (crypto.getRandomValues + rejection
 * sampling proti modulo bias). Fallback na `Math.random()` jen pokud
 * Web Crypto API není dostupné (test env bez polyfill).
 */

export type FateFace = -1 | 0 | 1;
export type FateFaceSymbol = '+' | '-' | ' ';

export interface FateRollResult {
  rolls: FateFace[];
  sum: number;
  symbols: string;
}

export type RollKind =
  | 'fate'
  | 'd100'
  | 'd4'
  | 'd6'
  | 'd6+'
  | '2d6+'
  | 'd8'
  | 'd10'
  | 'd12'
  | 'd20'
  | `pool-d${number}`
  | 'mixed';

export interface GenericRollResult {
  rolls: number[];
  sum: number;
  symbols: string;
  type: string;
}

export interface MixedRollResult extends GenericRollResult {
  faceTypes: string[];
}

/**
 * Krok 6.3 D-NEW-dice-secure-rng — kryptograficky robustní generátor s
 * rejection sampling proti modulu bias.
 *
 * `Math.random()` má dvě slabiny:
 * 1. **Prediktabilita** — V8 PRNG je vědomě non-cryptographic; pro RPG
 *    hod kostkou je to jedno, ale PJ chce důkaz „nebylo manipulováno".
 * 2. **Modulo bias** — `Math.floor(Math.random() * N)` přes N které není
 *    mocnina 2 generuje drobně bias k nižším hodnotám (vyšší než dolní
 *    `2^32 / N * N` jsou „přebytek"). Pro N=6 (d6) bias ~10^-9, pro
 *    20-sided d20 podobně. Imperceptibilní, ale auditovaně OK.
 *
 * Tato funkce vrací rovnoměrné int v rozsahu [0, max) s `crypto.
 * getRandomValues` (k dispozici ve všech moderních prohlížečích i Node 19+).
 * Pokud crypto API není dostupné (test env bez polyfill), fallback na
 * `Math.random()` se stejnou semantikou — pro účely jest mocku.
 */
export function secureRandomInt(max: number): number {
  if (max <= 0) return 0;
  if (max > 0x100000000) {
    // Mimo rozsah Uint32 — fallback (v praxi pro RPG nikdy nedosáhneme).
    return Math.floor(Math.random() * max);
  }
  const cryptoApi =
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
      ? globalThis.crypto
      : null;
  if (!cryptoApi) {
    return Math.floor(Math.random() * max);
  }
  // Rejection sampling: použij jen Uint32 hodnoty v rozsahu, který jde
  // beze zbytku rozdělit max. Tím odpadne modulo bias.
  const range = 0x100000000; // 2^32
  const limit = range - (range % max);
  const buf = new Uint32Array(1);
  // Smyčka teoreticky neukončená, prakticky končí po 1 iteraci ve >99,9%
  // případů (limit/range ≈ 1 pro malá max).
  while (true) {
    cryptoApi.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

/** Float v rozsahu [0, 1) — drop-in náhrada za `Math.random()`. */
export function secureRandom(): number {
  return secureRandomInt(0x100000000) / 0x100000000;
}

/** 4dF — 4 kostky s tvářemi {−1, 0, +1}. */
export function rollFate(): FateRollResult {
  const rolls = Array(4)
    .fill(0)
    .map(() => secureRandomInt(3) - 1) as FateFace[];
  // Sum používáme jako `number`; init `0` musí být cast aby TS přijal akumulátor.
  const sum = (rolls as number[]).reduce((a, b) => a + b, 0);
  const symbols = rolls
    .map((r) => (r === 1 ? '[+]' : r === -1 ? '[-]' : '[ ]'))
    .join(' ');
  return { rolls, sum, symbols };
}

/**
 * Generic roll dle stringového typu (`'fate'`, `'d20'`, `'pool-d6'`, `'mixed'`,
 * `'d100'`, `'k20'` atd.). `count` u XdN je odvozený z prefixu (`'3d6'` → 3),
 * jinak `1`.
 */
export function rollGenericDice(type: string): GenericRollResult {
  if (type === 'fate') {
    const f = rollFate();
    return { rolls: f.rolls, sum: f.sum, symbols: f.symbols, type };
  }

  // Eskalující/nafukovací kostky — `+` v typu by neprošel regexem XdN níže a
  // spadl by na default d20. Centralizováno tady, aby je dostal i manuální
  // picker (`performRoll` volá `rollGenericDice`), nejen sheet/deník.
  if (type === 'd6+') return rollExplodingD6();
  if (type === '2d6+') return rollExploding2d6();

  if (type === 'd100' || type === 'k100') {
    const tens = secureRandomInt(10) * 10;
    const ones = secureRandomInt(10);
    const sum = tens === 0 && ones === 0 ? 100 : tens + ones;
    const symbols = `[${tens === 0 ? '00' : tens}], [${ones}]`;
    return { rolls: [tens, ones], sum, symbols, type };
  }

  let count = 1;
  let sides = 20;

  if (type.startsWith('pool-')) {
    // Pro pool default 1 kostka — `rollPool` níže přebírá count zvenčí.
    sides = parseInt(type.replace('pool-d', ''), 10) || 6;
  } else if (type === 'mixed') {
    sides = 20;
  } else {
    const match = type.match(/^(\d*)[dk](\d+)$/i);
    if (match) {
      count = match[1] ? parseInt(match[1], 10) : 1;
      sides = parseInt(match[2], 10);
    }
  }

  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(secureRandomInt(sides) + 1);
  }
  const sum = rolls.reduce((a, b) => a + b, 0);
  const symbols = `[${rolls.join(', ')}]`;

  return { rolls, sum, symbols, type };
}

/**
 * `d6+` — „nafukovací k6" (exploding d6, DrD 1.6): hoď d6; padne-li 6, hoď
 * znovu a přičti; opakuj. Vrací CELOU kaskádu hozených kostek + součet.
 * Tvrdý strop 50 hodů proti teoretické nekonečné smyčce (prakticky 1–3 hody).
 */
export function rollExplodingD6(): GenericRollResult {
  const rolls: number[] = [];
  let face: number;
  do {
    face = secureRandomInt(6) + 1;
    rolls.push(face);
  } while (face === 6 && rolls.length < 50);
  const sum = rolls.reduce((a, b) => a + b, 0);
  return { rolls, sum, symbols: `[${rolls.join(', ')}]`, type: 'd6+' };
}

/**
 * `2d6+` — otevřený / eskalující hod (DrD+). Jiná mechanika než `d6+`:
 * hoď **2k6**; eskaluje **jen na dvojici**:
 * - `2×6` → házej dál po jedné kostce: 4/5/6 → **+1** a pokračuj, 1/2/3 → **stop**.
 * - `2×1` → házej dál po jedné: 1/2/3 → **−1** a pokračuj, 4/5/6 → **stop** (i do záporu).
 *
 * Jiný úvodní hod = prostý součet (žádná eskalace). Pokračovací kostka
 * **nepřičítá svou hodnotu** — určuje jen znaménko kroku (±1) a zda pokračovat
 * (tím se liší od `d6+`, který přičítá celou hozenou hodnotu). Tvrdý strop
 * 50 hodů proti teoretické nekonečné smyčce.
 *
 * `rolls` = `[d1, d2, ...kaskáda]` (vč. závěrečné „stop" kostky) — kvůli 3D
 * vizuálu a rozpisu v dice logu. `sum` = `base ± delta` (NE součet tváří).
 */
export function rollExploding2d6(): GenericRollResult {
  const d1 = secureRandomInt(6) + 1;
  const d2 = secureRandomInt(6) + 1;
  const rolls: number[] = [d1, d2];
  const base = d1 + d2;
  let delta = 0;

  if (d1 === 6 && d2 === 6) {
    let face: number;
    do {
      face = secureRandomInt(6) + 1;
      rolls.push(face);
      if (face >= 4) delta += 1;
    } while (face >= 4 && rolls.length < 50);
  } else if (d1 === 1 && d2 === 1) {
    let face: number;
    do {
      face = secureRandomInt(6) + 1;
      rolls.push(face);
      if (face <= 3) delta -= 1;
    } while (face <= 3 && rolls.length < 50);
  }

  const sum = base + delta;
  return { rolls, sum, symbols: `[${rolls.join(', ')}]`, type: '2d6+' };
}

/** Pool roll s explicitním počtem kostek. */
export function rollPool(sides: number, count: number): GenericRollResult {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(secureRandomInt(sides) + 1);
  }
  const sum = rolls.reduce((a, b) => a + b, 0);
  return {
    rolls,
    sum,
    symbols: `[${rolls.join(', ')}]`,
    type: `pool-d${sides}`,
  };
}

/** Výsledek SR-style pool hodu (počítají se úspěchy, ne součet). */
export interface PoolHitsResult {
  /** Hozené tváře (k zobrazení + 3D). */
  rolls: number[];
  /** Počet úspěchů (tvář ≥ threshold, default 5–6). */
  hits: number;
  /** Počet jedniček (glitch kontrola). */
  ones: number;
  /** Glitch = víc než polovina kostek jsou jedničky. */
  glitch: boolean;
  /** Kritický glitch = glitch a zároveň 0 úspěchů. */
  criticalGlitch: boolean;
  /** Práh úspěchu (5 pro SR6). */
  threshold: number;
  type: string;
}

/**
 * Shadowrun-style **pool hod**: hoď `count` × dN, počítej **úspěchy** (tvář ≥
 * `threshold`, SR6 = 5–6), ne součet. **Glitch** = víc než polovina kostek
 * padlo na 1; **kritický glitch** = glitch a 0 úspěchů.
 *
 * Sdílí `secureRandomInt` s ostatními hody. Použitelné i pro jiné success-pool
 * systémy (WoD = d10, threshold 8) přes `sides`/`threshold`.
 */
export function rollPoolHits(
  count: number,
  sides = 6,
  threshold = 5,
): PoolHitsResult {
  const n = Math.max(0, Math.floor(count));
  const rolls: number[] = [];
  for (let i = 0; i < n; i++) rolls.push(secureRandomInt(sides) + 1);
  const hits = rolls.filter((d) => d >= threshold).length;
  const ones = rolls.filter((d) => d === 1).length;
  const glitch = n > 0 && ones > n / 2;
  const criticalGlitch = glitch && hits === 0;
  return { rolls, hits, ones, glitch, criticalGlitch, threshold, type: `pool-d${sides}` };
}

/** Mixed roll — různé počty různých typů kostek v jednom hodu. */
export function rollMixedDice(counts: Record<string, number>): MixedRollResult {
  const rolls: number[] = [];
  const faceTypes: string[] = [];
  let sum = 0;

  const types = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
  const symbolParts: string[] = [];

  for (const t of types) {
    if (counts[t] > 0) {
      const typeRolls: number[] = [];
      const sides = parseInt(t.replace('d', ''), 10);
      for (let i = 0; i < counts[t]; i++) {
        const rolled = secureRandomInt(sides) + 1;
        typeRolls.push(rolled);
        rolls.push(rolled);
        faceTypes.push(t);
      }
      sum += typeRolls.reduce((a, b) => a + b, 0);
      symbolParts.push(`[${typeRolls.join(', ')}] (${t})`);
    }
  }

  if (counts['d100'] > 0) {
    for (let i = 0; i < counts['d100']; i++) {
      const tens = secureRandomInt(10) * 10;
      const ones = secureRandomInt(10);
      const d100Total = tens === 0 && ones === 0 ? 100 : tens + ones;
      rolls.push(tens, ones);
      faceTypes.push('d100', 'd100');
      sum += d100Total;
      symbolParts.push(
        `[${tens === 0 ? '00' : tens}, ${ones}] (d100 = ${d100Total})`,
      );
    }
  }

  if (counts['fate'] > 0) {
    for (let i = 0; i < counts['fate']; i++) {
      const fateResult = rollFate();
      fateResult.rolls.forEach((f) => {
        rolls.push(f);
        faceTypes.push('fate');
      });
      sum += fateResult.sum;
      symbolParts.push(`${fateResult.symbols} (fate)`);
    }
  }

  return {
    rolls,
    sum,
    symbols: symbolParts.join(' '),
    type: 'mixed',
    faceTypes,
  };
}

/**
 * Přetlak — Fate hod ≥ 7 generuje bonusové body dle staré tabulky.
 * Vrací `null` pokud total < 7.
 */
export function getOverpressureFromRollTotal(total: number): number | null {
  if (total < 7) return null;
  if (total === 7) return 1;
  if (total === 8) return 2;
  if (total === 9) return 3;
  if (total === 10) return 5;
  if (total === 11) return 7;
  if (total === 12) return 9;
  return 12; // 13+
}
