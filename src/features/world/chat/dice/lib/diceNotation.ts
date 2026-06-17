/**
 * Krok 6.3-fix4 — Převod `DicePayload` na dice-box-threejs notaci s
 * PŘEDURČENÝM výsledkem (`@` syntax), aby fyzikální 3D kostka dopadla
 * na hodnotu z payloadu (závazný výsledek z rollEngine/BE, WS shoda).
 *
 * Příklady:
 *   d20=13            → "1d20@13"
 *   pool 3d6=[4,2,6]  → "3d6@4,2,6"
 *   d100 tens80 ones7 → "1d100@80+1d10@7"
 *   mixed d20+d6      → "1d20@13+1d6@4"
 *
 * Fate vrací `null` — Fudge kostku engine nemá, řeší se 2D fallbackem
 * (viz spec 6.3-fix4 §3.5).
 */
import type { DicePayload } from './dicePayload';

const SIDES: Record<string, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
};

/** Normalizace hodnoty tváře pro danou kostku do rozsahu, co engine zobrazí. */
function faceNum(sides: number, raw: number): number {
  const v = Math.round(raw);
  // d10: engine zobrazuje 0..9; hozená „10" = tvář „0".
  if (sides === 10 && v === 10) return 0;
  return v;
}

/** Jedna skupina `kdN@f1,f2,...`. */
function group(sides: number, faces: number[]): string {
  const vals = faces.map((f) => faceNum(sides, Number(f))).join(',');
  return `${faces.length}d${sides}@${vals}`;
}

/**
 * Vrátí notaci pro 3D engine, nebo `null` když typ 3D nepodporujeme
 * (fate) — volající pak použije 2D fallback.
 */
export function payloadToNotation(payload: DicePayload): string | null {
  if (payload.type === 'fate') return null;

  if (payload.type === 'd100') {
    const tens = Math.round(payload.tens); // 0,10,..,90
    const ones = Math.round(payload.ones); // 0..9
    return `1d100@${tens}+1d10@${ones}`;
  }

  if (payload.type === 'mixed') {
    const parts = payload.faces.map((f, i) => {
      const t = (payload.faceTypes[i] || 'd6').toLowerCase();
      const sides = SIDES[t] ?? 6;
      return `1d${sides}@${faceNum(sides, Number(f))}`;
    });
    return parts.join('+');
  }

  if (payload.type.startsWith('pool-d')) {
    const sides = parseInt(payload.type.replace('pool-d', ''), 10);
    if (!sides) return null;
    return group(sides, payload.faces.map(Number));
  }

  const sides = SIDES[payload.type];
  if (!sides) return null;
  return group(sides, payload.faces.map(Number));
}
