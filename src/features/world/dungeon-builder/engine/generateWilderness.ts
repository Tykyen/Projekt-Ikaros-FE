/**
 * 21.3g — procedurální generátor krajiny (třetí generátor stavitele).
 *
 * Deterministický value-noise (fBm) → elevační + vlhkostní mapa →
 * klasifikace terénu (hory > les > kopce > mokřad > louka) → řeka/jezero →
 * cesta hledající nejnižší terén (přes vodu mosty) → volitelná vesnička
 * s poli → dekorace (solo stromy, kameny, tábor) dle zabydlenosti.
 *
 * Žádné Math.random — stejný seed ⇒ stejná krajina.
 */
import type { DungeonCell, DungeonDecoration } from '../types';
import { DUNGEON_LIMITS } from '../types';
import { createEmptyCells } from './model';
import { mulberry32 } from './generate';

export interface WildernessGeneratorParams {
  width: number;
  height: number;
  /** 0–1: lesnatost. */
  forestness: number;
  /** 0–1: hornatost. */
  mountainness: number;
  water: 'auto' | 'yes' | 'no';
  /** Vesnička s poli. */
  settlement: 'auto' | 'yes' | 'no';
  /** 0–1: dekorace (solo stromy, kameny, tábor). */
  furnishing: number;
  seed: number;
}

export interface GeneratedWilderness {
  cells: DungeonCell[][];
  decorations: DungeonDecoration[];
  seed: number;
}

/** Celočíselný hash → [0,1) — mřížkové body value-noise. */
const hash2 = (x: number, y: number, seed: number): number => {
  let h = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const smooth = (t: number): number => t * t * (3 - 2 * t);

/** Bilineárně interpolovaný value-noise na mřížce o kroku `scale`. */
const valueNoise = (
  x: number,
  y: number,
  scale: number,
  seed: number,
): number => {
  const gx = x / scale;
  const gy = y / scale;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const tx = smooth(gx - x0);
  const ty = smooth(gy - y0);
  const v00 = hash2(x0, y0, seed);
  const v10 = hash2(x0 + 1, y0, seed);
  const v01 = hash2(x0, y0 + 1, seed);
  const v11 = hash2(x0 + 1, y0 + 1, seed);
  const a = v00 + (v10 - v00) * tx;
  const b = v01 + (v11 - v01) * tx;
  return a + (b - a) * ty;
};

/** fBm — 3 oktávy value-noise. */
const fbm = (x: number, y: number, seed: number): number =>
  0.55 * valueNoise(x, y, 12, seed) +
  0.3 * valueNoise(x, y, 6, seed ^ 0x9e3779b9) +
  0.15 * valueNoise(x, y, 3, seed ^ 0x85ebca6b);

const clampDim = (n: number): number =>
  Math.max(12, Math.min(100, Math.round(n)));

export function generateWilderness(
  params: WildernessGeneratorParams,
): GeneratedWilderness {
  const w = clampDim(params.width);
  const h = clampDim(params.height);
  const forestness = Math.max(0, Math.min(1, params.forestness));
  const mountainness = Math.max(0, Math.min(1, params.mountainness));
  const furnishing = Math.max(0, Math.min(1, params.furnishing));
  const rng = mulberry32(params.seed);
  const seedE = params.seed ^ 0x1234abcd;
  const seedM = params.seed ^ 0x0badf00d;

  const cells = createEmptyCells(w, h);
  const at = (x: number, y: number): DungeonCell | undefined =>
    y >= 0 && y < h && x >= 0 && x < w ? cells[y][x] : undefined;
  const set = (x: number, y: number, type: DungeonCell['type']): void => {
    if (at(x, y)) cells[y][x] = { type };
  };
  const is = (x: number, y: number, type: DungeonCell['type']): boolean =>
    at(x, y)?.type === type;
  const elev = (x: number, y: number): number => fbm(x, y, seedE);

  // ── 1) Klasifikace terénu (hory > les > kopce > mokřad > louka) ────────
  const mountainThr = 1 - mountainness * 0.42;
  const forestThr = 1 - forestness * 0.52;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const e = elev(x, y);
      const m = fbm(x, y, seedM);
      if (mountainness > 0 && e > mountainThr) set(x, y, 'mountain');
      else if (forestness > 0 && m > forestThr) set(x, y, 'forest');
      else if (mountainness > 0 && e > mountainThr - 0.09) set(x, y, 'hill');
      else if (m > 0.82 && e < 0.38) set(x, y, 'swamp');
      // jinak louka (empty)
    }
  }

  // ── 2) Voda: řeka po spádu (meandr) + případné jezírko ─────────────────
  const hasWater =
    params.water === 'yes' || (params.water === 'auto' && rng() < 0.55);
  if (hasWater) {
    const vertical = rng() < 0.5;
    const span = vertical ? h : w;
    const across = vertical ? w : h;
    let pos = Math.round(across * (0.3 + rng() * 0.4));
    for (let t = 0; t < span; t++) {
      for (let k = 0; k < 2; k++) {
        if (vertical) set(pos + k, t, 'water');
        else set(t, pos + k, 'water');
      }
      // Táhni k nižšímu terénu (řeka teče údolím), s meandrem.
      const [ax, ay] = vertical ? [pos, t + 1] : [t + 1, pos];
      const eLeft = elev(vertical ? ax - 1 : ax, vertical ? ay : ay - 1);
      const eRight = elev(vertical ? ax + 1 : ax, vertical ? ay : ay + 1);
      if (rng() < 0.45) pos += eLeft < eRight ? -1 : 1;
      else if (rng() < 0.2) pos += rng() < 0.5 ? -1 : 1;
      pos = Math.max(1, Math.min(across - 3, pos));
    }
    // Jezírko: blob 2–3 buňky v nejnižším rohu kvadrantu.
    if (rng() < 0.5) {
      const lx = Math.round(w * (0.2 + rng() * 0.6));
      const ly = Math.round(h * (0.2 + rng() * 0.6));
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (Math.abs(dx) + Math.abs(dy) < 2 && !is(lx + dx, ly + dy, 'mountain'))
            set(lx + dx, ly + dy, 'water');
    }
  }

  // ── 3) Cesta: greedy chůze zleva doprava po nejnižším terénu ───────────
  const paveAt = (x: number, y: number): void => {
    const t = at(x, y)?.type;
    if (!t) return;
    set(x, y, t === 'water' ? 'bridge' : 'street');
  };
  const roadY: number[] = [];
  {
    let y = Math.round(h * (0.35 + rng() * 0.3));
    for (let x = 0; x < w; x++) {
      // Vyber dalšího souseda s nejnižší „cenou" (hora = drahá, jitter meandr).
      const cost = (yy: number): number => {
        if (yy < 1 || yy > h - 2) return Infinity;
        const t = at(x, yy)?.type;
        const terrain = t === 'mountain' ? 3 : t === 'swamp' ? 0.6 : 0;
        return elev(x, yy) + terrain + rng() * 0.15;
      };
      const candidates = [y - 1, y, y + 1];
      y = candidates.reduce((best, c) => (cost(c) < cost(best) ? c : best), y);
      paveAt(x, y);
      roadY.push(y);
    }
  }

  // ── 4) Vesnička s poli u cesty ──────────────────────────────────────────
  const hasSettlement =
    params.settlement === 'yes' ||
    (params.settlement === 'auto' && rng() < 0.6);
  const decorations: DungeonDecoration[] = [];
  let decSeq = 0;
  const occupied = new Set<string>();
  const addDec = (
    type: DungeonDecoration['type'],
    x: number,
    y: number,
    label?: string,
  ): void => {
    if (decorations.length >= DUNGEON_LIMITS.maxDecorations) return;
    const key = `${x},${y}`;
    if (occupied.has(key) || !at(x, y)) return;
    occupied.add(key);
    decorations.push({
      id: `wild-${decSeq++}`,
      type,
      cellX: x,
      cellY: y,
      rotation: 0,
      ...(label !== undefined ? { label } : {}),
    });
  };

  if (hasSettlement) {
    const vx = Math.round(w * (0.35 + rng() * 0.3));
    const vy = roadY[vx] ?? Math.round(h / 2);
    let houseNo = 0;
    const tryHouse = (hx: number, hy: number): void => {
      // Domek 2×2 na louce/poli/kopci (ne v horách/vodě/cestě).
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const t = at(hx + dx, hy + dy)?.type;
          if (t !== 'empty' && t !== 'field' && t !== 'hill' && t !== 'forest')
            return;
        }
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) set(hx + dx, hy + dy, 'building');
      houseNo++;
      addDec('label', hx, hy, String(houseNo));
    };
    const houses = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < houses; i++) {
      const side = rng() < 0.5 ? -3 : 2;
      tryHouse(vx - 4 + Math.floor(rng() * 8), vy + side - Math.floor(rng() * 2));
    }
    // Pole v okolí vesnice (obdélníčky na louce).
    const patches = 2 + Math.floor(rng() * 3);
    for (let p = 0; p < patches; p++) {
      const px = vx - 8 + Math.floor(rng() * 16);
      const py = vy - 6 + Math.floor(rng() * 12);
      const pw = 3 + Math.floor(rng() * 3);
      const ph = 2 + Math.floor(rng() * 3);
      for (let dy = 0; dy < ph; dy++)
        for (let dx = 0; dx < pw; dx++)
          if (is(px + dx, py + dy, 'empty')) set(px + dx, py + dy, 'field');
    }
  }

  // ── 5) Dekorace dle zabydlenosti ────────────────────────────────────────
  if (furnishing > 0) {
    let campPlaced = false;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        if (!is(x, y, 'empty')) continue;
        const roll = rng();
        if (roll < furnishing * 0.045) {
          // Solo stromy/keře/kameny na loukách; občas tábor u cesty.
          const nearRoad =
            is(x, y - 1, 'street') ||
            is(x, y + 1, 'street') ||
            is(x - 1, y, 'street') ||
            is(x + 1, y, 'street');
          if (!campPlaced && nearRoad && rng() < 0.12) {
            addDec('ohniste', x, y);
            addDec('stan', x + 1, y);
            campPlaced = true;
          } else {
            const r = rng();
            addDec(r < 0.5 ? 'strom' : r < 0.8 ? 'ker' : 'sut', x, y);
          }
        }
      }
    }
  }

  return { cells, decorations, seed: params.seed };
}
