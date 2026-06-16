import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FACE_ROTATIONS, type DiceGeoType } from './faceRotations';
import { compose, type Mat3, type RotOp, type Axis } from './rotationMath';

/**
 * Krok 6.3-fix2 (dluh D-NEW-dice-facerot-css-drift) — anti-drift brána.
 *
 * `faceRotations.ts` (zdroj pro výpočet TARGETS) a `polyhedralDice.css`
 * (`.dN-face-K`, umístění tváří v 3D) drží TUTÉŽ geometrii dvakrát. Tenhle
 * test porovná rotační část obou — kdokoli změní jen jedno, build spadne
 * (drift přestane být tichý).
 *
 * d6 je mimo (inline v `D6Model.tsx`, ne v CSS) — jednoosé tváře, nízké riziko.
 */

const here = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(
  resolve(here, '../components/models/polyhedralDice.css'),
  'utf8',
);

/** Vytáhne rotace (bez translateZ) z `transform` pravidla `.cls`. */
function cssFaceOps(cls: string): RotOp[] {
  const block = CSS.match(new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  const transform = block.match(/transform:\s*([^;]+);/)?.[1] ?? '';
  const ops: RotOp[] = [];
  const re = /rotate([XYZ])\(\s*(-?[\d.]+)deg\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(transform)) !== null) {
    ops.push([m[1].toLowerCase() as Axis, Number(m[2])]);
  }
  return ops;
}

function matClose(a: Mat3, b: Mat3, eps = 1e-6): boolean {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (Math.abs(a[i][j] - b[i][j]) > eps) return false;
    }
  }
  return true;
}

// Typy, jejichž geometrie žije v CSS `.dN-face-K`.
const CSS_TYPES: DiceGeoType[] = ['d8', 'd10', 'd12', 'd20'];

describe('faceRotations ↔ polyhedralDice.css (anti-drift)', () => {
  CSS_TYPES.forEach((type) => {
    FACE_ROTATIONS[type].forEach((ops, i) => {
      const cls = `${type}-face-${i + 1}`;
      it(`${type} tvář ${i + 1}: faceRotations == CSS .${cls}`, () => {
        const cssOps = cssFaceOps(cls);
        // CSS pravidlo existuje a má rotaci.
        expect(cssOps.length).toBeGreaterThan(0);
        // Stejná orientace (porovnání matic, ne stringů — reprezentace se může lišit).
        expect(matClose(compose(ops), compose(cssOps))).toBe(true);
      });
    });
  });
});
