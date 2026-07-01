/**
 * GURPS 4E — výpočetní jádro (čisté funkce).
 *
 * Bez Reactu → testovatelné izolovaně a sdílené mezi sheetem, print viewem a
 * (později) combat panelem. Všechny odvozené hodnoty na sheetu jsou "hybrid":
 * komponenta je počítá zde, ale hráč je smí přepsat (override) — viz `GurpsSheet`.
 */

/** Parse celého čísla (fallback při prázdné/nevalidní hodnotě). */
export function int(v: string | number | undefined | null, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? '').trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Parse desetinného čísla (akceptuje čárku i tečku). */
export function num(
  v: string | number | undefined | null,
  fallback = 0,
): number {
  const n =
    typeof v === 'number'
      ? v
      : parseFloat(String(v ?? '').trim().replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

/** Formát čísla s vždy zobrazeným znaménkem (+80 / 0 / −20). */
export function signed(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return '0';
}

// ── Odvozené charakteristiky ──────────────────────────────────────

/** Základní rychlost = (DX + HT) / 4 (ve čtvrtinách, NEzaokrouhluje se). */
export function basicSpeed(dx: number, ht: number): number {
  return (dx + ht) / 4;
}

/** Základní pohyb = floor(rychlost) bez naložení. */
export function basicMove(speed: number): number {
  return Math.max(0, Math.floor(speed));
}

/** Úhyb (Dodge) = floor(rychlost) + 3. */
export function dodge(speed: number): number {
  return Math.floor(speed) + 3;
}

/** Nosnost (Basic Lift) = ST²/5 lb (≥10 zaokr. na celé, jinak na desetiny). */
export function basicLift(st: number): number {
  const bl = (st * st) / 5;
  return bl >= 10 ? Math.round(bl) : Math.round(bl * 10) / 10;
}

/** Řádek tabulky naložení. */
export interface EncRow {
  key: string;
  label: string;
  mult: string;
  limit: number;
  move: number;
  dodge: number;
}

/** 5 úrovní naložení (limity z BL, pohyb ×faktor, úhyb −úroveň). */
export function encTable(st: number, move: number, dodgeVal: number): EncRow[] {
  const bl = basicLift(st);
  const defs: { key: string; label: string; mult: string; m: number; f: number }[] =
    [
      { key: '0', label: 'Žádné (0)', mult: 'BL', m: 1, f: 1 },
      { key: '1', label: 'Lehké (1)', mult: '2×BL', m: 2, f: 0.8 },
      { key: '2', label: 'Střední (2)', mult: '3×BL', m: 3, f: 0.6 },
      { key: '3', label: 'Těžké (3)', mult: '6×BL', m: 6, f: 0.4 },
      { key: '4', label: 'V. těžké (4)', mult: '10×BL', m: 10, f: 0.2 },
    ];
  return defs.map((d, i) => ({
    key: d.key,
    label: d.label,
    mult: d.mult,
    limit: Math.round(bl * d.m),
    move: Math.max(0, Math.floor(move * d.f)),
    dodge: Math.max(1, dodgeVal - i),
  }));
}

// ── Tabulka škod (4E: ST → Úder/Mách) ─────────────────────────────

/** [thrust, swing] pro ST 1–30 (4E Basic Set). Mimo rozsah se clampuje. */
const DAMAGE: Record<number, [string, string]> = {
  1: ['1k-6', '1k-5'],
  2: ['1k-6', '1k-5'],
  3: ['1k-5', '1k-4'],
  4: ['1k-5', '1k-4'],
  5: ['1k-4', '1k-3'],
  6: ['1k-4', '1k-3'],
  7: ['1k-3', '1k-2'],
  8: ['1k-3', '1k-2'],
  9: ['1k-2', '1k-1'],
  10: ['1k-2', '1k'],
  11: ['1k-1', '1k+1'],
  12: ['1k-1', '1k+2'],
  13: ['1k', '2k-1'],
  14: ['1k', '2k'],
  15: ['1k+1', '2k+1'],
  16: ['1k+1', '2k+2'],
  17: ['1k+2', '3k-1'],
  18: ['1k+2', '3k'],
  19: ['2k-1', '3k+1'],
  20: ['2k-1', '3k+2'],
  21: ['2k', '4k-1'],
  22: ['2k', '4k'],
  23: ['2k+1', '4k+1'],
  24: ['2k+1', '4k+2'],
  25: ['2k+2', '5k-1'],
  26: ['2k+2', '5k'],
  27: ['3k-1', '5k+1'],
  28: ['3k-1', '5k+2'],
  29: ['3k', '6k-1'],
  30: ['3k', '6k'],
};

function clampSt(st: number): number {
  if (st < 1) return 1;
  if (st > 30) return 30;
  return st;
}

/** Úder (thrust) pro danou ST. */
export function thrust(st: number): string {
  return DAMAGE[clampSt(Math.round(st))][0];
}

/** Mách (swing) pro danou ST. */
export function swing(st: number): string {
  return DAMAGE[clampSt(Math.round(st))][1];
}

// ── Bodový účet ───────────────────────────────────────────────────

/** Efektivní (override nebo default) hodnoty potřebné pro cenu atributů. */
export interface AttrValues {
  st: number;
  dx: number;
  iq: number;
  ht: number;
  will: number;
  per: number;
  hp: number;
  fp: number;
  speed: number;
  move: number;
}

/**
 * Cena atributů + sekundárních charakteristik (4E per-level ceny).
 * ST 10/lvl, DX 20, IQ 20, HT 10; Will/Per 5 (od IQ); HP 2 (od ST);
 * FP 3 (od HT); rychlost 5/0,25; pohyb 5/lvl (od defaultů).
 */
export function attributeCost(a: AttrValues): number {
  const primary =
    (a.st - 10) * 10 +
    (a.dx - 10) * 20 +
    (a.iq - 10) * 20 +
    (a.ht - 10) * 10;
  const defSpeed = basicSpeed(a.dx, a.ht);
  const defMove = basicMove(defSpeed);
  const secondary =
    (a.will - a.iq) * 5 +
    (a.per - a.iq) * 5 +
    (a.hp - a.st) * 2 +
    (a.fp - a.ht) * 3 +
    Math.round(((a.speed - defSpeed) / 0.25) * 5) +
    (a.move - defMove) * 5;
  return primary + secondary;
}

/** Součet bodů (signed) z pole řádků s klíčem `pts`. */
export function sumPts(rows: { pts?: string }[]): number {
  return rows.reduce((acc, r) => acc + num(r.pts, 0), 0);
}

/** Rozpis bodů postavy. */
export interface PointSummary {
  attributes: number;
  advantages: number;
  disadvantages: number;
  quirks: number;
  skills: number;
  total: number;
}

export function pointSummary(input: {
  attrCost: number;
  advantages: { pts?: string }[];
  disadvantages: { pts?: string }[];
  quirks: { pts?: string }[];
  skills: { pts?: string }[];
}): PointSummary {
  const advantages = sumPts(input.advantages);
  const disadvantages = sumPts(input.disadvantages);
  const quirks = sumPts(input.quirks);
  const skills = sumPts(input.skills);
  return {
    attributes: input.attrCost,
    advantages,
    disadvantages,
    quirks,
    skills,
    total: input.attrCost + advantages + disadvantages + quirks + skills,
  };
}
