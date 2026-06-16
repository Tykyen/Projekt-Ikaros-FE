/**
 * Krok 6.3d / 6.3-fix — TARGETS rotace per tvář kostky (cíl dosednutí).
 *
 * Modely v `models/*.tsx` mapují `faceValue` na index TARGETS pole; rolling
 * scéna i overlay interpolují kostku do cílové rotace, aby ukázala správnou
 * tvář odpovídající `payload.faces[i]`.
 *
 * 6.3-fix: cílová rotace je nově **přesná inverze** rotace tváře
 * (`invertFaceToEuler`), odvozená z jednoho zdroje geometrie
 * `faceRotations.ts`. Dřív ručně psané hodnoty u tváří s `rotateZ(180)`
 * (D12, D20) nebyly inverzí → kostka dosedala nakloněná až o 158°
 * (viz [spec-6.3-fix-dice-orientation.md]). Aplikace `rotateX·rotateY·rotateZ`
 * v konzumentech se nemění — opravily se jen hodnoty.
 *
 * Rotace v stupních (rx/ry/rz), aplikované v pořadí X→Y→Z.
 */

import { FACE_ROTATIONS, type DiceGeoType } from './faceRotations';
import { invertFaceToEuler } from './rotationMath';

export interface DiceTarget {
  rx: number;
  ry: number;
  rz: number;
}

/** Odvodí TARGETS daného typu jako inverzi rotace každé tváře. */
function deriveTargets(type: DiceGeoType): DiceTarget[] {
  return FACE_ROTATIONS[type].map(invertFaceToEuler);
}

/**
 * D4 (tetraedr) — vlastní geometrie. Tetraedr se nečte „tváří čelem", ale
 * stojící na podstavě s číslem u vrcholu, takže metrika inverze tváře sem
 * nepatří. Ponecháno z původního portu (vizuálně OK).
 */
export const D4_TARGETS: DiceTarget[] = [
  { rx: 0, ry: 0, rz: 0 },
  { rx: -109.5, ry: 60, rz: 0 },
  { rx: -109.5, ry: -60, rz: 0 },
  { rx: -109.5, ry: 180, rz: 0 },
];

export const D6_TARGETS: DiceTarget[] = deriveTargets('d6');
export const D8_TARGETS: DiceTarget[] = deriveTargets('d8');
export const D10_TARGETS: DiceTarget[] = deriveTargets('d10');
export const D12_TARGETS: DiceTarget[] = deriveTargets('d12');
export const D20_TARGETS: DiceTarget[] = deriveTargets('d20');

/**
 * Fate — usazuje se čelně ({0,0,0}) a hozenou hodnotu nese přední tvář
 * (viz `FateSkinModel` + `renderModelFor`). Ponecháno beze změny.
 */
export const FATE_TARGETS: Record<string, DiceTarget> = {
  '+': { rx: 0, ry: 0, rz: 0 },
  '1': { rx: 0, ry: 0, rz: 0 },
  '-': { rx: 0, ry: 180, rz: 0 },
  '-1': { rx: 0, ry: 180, rz: 0 },
  '0': { rx: -90, ry: 0, rz: 0 },
};

/** Pomocí `faceValue` (1..N) vybrat TARGETS index. */
export function targetForGeneric(
  type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20',
  faceValue: number,
): DiceTarget {
  const arr =
    type === 'd4'
      ? D4_TARGETS
      : type === 'd6'
        ? D6_TARGETS
        : type === 'd8'
          ? D8_TARGETS
          : type === 'd10'
            ? D10_TARGETS
            : type === 'd12'
              ? D12_TARGETS
              : D20_TARGETS;
  // d10: hodnota 0 = 10-tá tvář (TARGETS index 9).
  const idx =
    type === 'd10' && faceValue === 0 ? 9 : Math.max(0, faceValue - 1);
  return arr[Math.min(idx, arr.length - 1)];
}

export function targetForFate(face: '+' | '-' | '0' | -1 | 0 | 1): DiceTarget {
  return FATE_TARGETS[String(face)] ?? FATE_TARGETS['0'];
}
