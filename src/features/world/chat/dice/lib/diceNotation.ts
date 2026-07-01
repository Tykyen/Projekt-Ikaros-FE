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
 * Fate = Fudge kostka (`4df@1,-1,0,...`) — engine ji umí (symboly −/0/+).
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
  if (payload.type === 'fate') {
    // Fudge kostka (`df`): hodnoty −1/0/+1, symboly −/0/+ kreslí engine.
    const vals = payload.faces
      .map((f) => (f === '+' ? 1 : f === '-' ? -1 : 0))
      .join(',');
    return `${payload.faces.length}df@${vals}`;
  }

  if (payload.type === 'd100') {
    // Dvě viditelné d10 v jedné skupině (`2d10`) — desítková číslice + jednotky.
    const tensDigit = Math.round(payload.tens / 10) % 10; // 0..9
    const ones = Math.round(payload.ones); // 0..9
    return `2d10@${tensDigit},${ones}`;
  }

  if (payload.type === 'mixed') {
    // 3D engine (@drdreo/dice-box-threejs) NEumí PŘEDURČENÉ hodnoty (`@`) pro
    // víc typů kostek v jednom hodu: `parseNotation` volá `split("@")[0]` →
    // bere jen PRVNÍ skupinu (`2d4@…`), zbytek (`+2d6@…`) zahodí (proto se
    // ukázaly jen 2k4). Notace bez `@` (`2d4+2d6`) by hodila všechny, ale s
    // NÁHODNÝMI hodnotami ≠ náš výsledek (3D by lhalo proti readoutu).
    // → mixed bez 3D (`null`); overlay fallback ukáže všechny kostky jako
    //   odznaky v readoutu (správné hodnoty z payloadu).
    return null;
  }

  if (payload.type === 'flat') {
    // GURPS iniciativa (Základní rychlost) — bez kostek, bez 3D.
    return null;
  }

  if (payload.type === '3d6') {
    // GURPS roll-under: 3 fyzické k6 na předurčené tváře.
    return group(6, payload.faces.map(Number));
  }

  if (payload.type === 'd6+' || payload.type === '2d6+') {
    // Nafukovací k6 / otevřený 2k6+: kaskáda hozených d6 (best-effort 3D = N
    // viditelných d6 — pár + eskalace). Hodnota (±1 kroky) je v `total`.
    return group(6, payload.faces.map(Number));
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
