/**
 * Krok 6.3d — TARGETS rotace per tvář kostky (slerp cíle).
 *
 * Port `C:/Matrix/Matrix/frontend/src/components/Map/Dice/DiceLogic.ts`.
 * Modely v `models/*.tsx` mapují `faceValue` na index TARGETS pole; rolling
 * scéna interpoluje aktuální quaternion směrem k cílovému, aby výsledná
 * kostka ukázala správnou tvář odpovídající `payload.faces[i]`.
 *
 * Rotace v stupních (rx/ry/rz). Komponenty modelů si je převedou na
 * radiány a quaterniony při použití.
 */

export interface DiceTarget {
  rx: number;
  ry: number;
  rz: number;
}

export const D4_TARGETS: DiceTarget[] = [
  { rx: 0, ry: 0, rz: 0 },
  { rx: -109.5, ry: 60, rz: 0 },
  { rx: -109.5, ry: -60, rz: 0 },
  { rx: -109.5, ry: 180, rz: 0 },
];

export const D6_TARGETS: DiceTarget[] = [
  { rx: 0, ry: 0, rz: 0 },
  { rx: 0, ry: 180, rz: 0 },
  { rx: 0, ry: -90, rz: 0 },
  { rx: 0, ry: 90, rz: 0 },
  { rx: -90, ry: 0, rz: 0 },
  { rx: 90, ry: 0, rz: 0 },
];

export const FATE_TARGETS: Record<string, DiceTarget> = {
  '+': { rx: 0, ry: 0, rz: 0 },
  '1': { rx: 0, ry: 0, rz: 0 },
  '-': { rx: 0, ry: 180, rz: 0 },
  '-1': { rx: 0, ry: 180, rz: 0 },
  '0': { rx: -90, ry: 0, rz: 0 },
};

export const D8_TARGETS: DiceTarget[] = [
  { rx: -35.26, ry: 0, rz: 0 },
  { rx: -35.26, ry: -90, rz: 0 },
  { rx: -35.26, ry: -180, rz: 0 },
  { rx: -35.26, ry: -270, rz: 0 },
  { rx: 144.74, ry: 180, rz: 0 },
  { rx: 144.74, ry: 90, rz: 0 },
  { rx: 144.74, ry: 0, rz: 0 },
  { rx: 144.74, ry: -90, rz: 0 },
];

export const D10_TARGETS: DiceTarget[] = [
  { rx: -43.68, ry: 0, rz: 0 },
  { rx: -43.68, ry: -72, rz: 0 },
  { rx: -43.68, ry: -144, rz: 0 },
  { rx: -43.68, ry: -216, rz: 0 },
  { rx: -43.68, ry: -288, rz: 0 },
  { rx: 136.32, ry: 144, rz: 0 },
  { rx: 136.32, ry: 72, rz: 0 },
  { rx: 136.32, ry: 0, rz: 0 },
  { rx: 136.32, ry: -72, rz: 0 },
  { rx: 136.32, ry: -144, rz: 0 },
];

export const D12_TARGETS: DiceTarget[] = [
  { rx: -90, ry: 0, rz: 0 },
  { rx: -26.565, ry: 0, rz: 180 },
  { rx: -26.565, ry: -72, rz: 180 },
  { rx: -26.565, ry: -144, rz: 180 },
  { rx: -26.565, ry: -216, rz: 180 },
  { rx: -26.565, ry: -288, rz: 180 },
  { rx: 26.565, ry: -36, rz: 0 },
  { rx: 26.565, ry: -108, rz: 0 },
  { rx: 26.565, ry: -180, rz: 0 },
  { rx: 26.565, ry: -252, rz: 0 },
  { rx: 26.565, ry: -324, rz: 0 },
  { rx: 90, ry: 0, rz: 0 },
];

export const D20_TARGETS: DiceTarget[] = [
  { rx: -52.62, ry: 0, rz: 0 },
  { rx: -52.62, ry: -72, rz: 0 },
  { rx: -52.62, ry: -144, rz: 0 },
  { rx: -52.62, ry: -216, rz: 0 },
  { rx: -52.62, ry: -288, rz: 0 },
  { rx: -10.81, ry: 0, rz: 180 },
  { rx: -10.81, ry: -72, rz: 180 },
  { rx: -10.81, ry: -144, rz: 180 },
  { rx: -10.81, ry: -216, rz: 180 },
  { rx: -10.81, ry: -288, rz: 180 },
  { rx: 10.81, ry: -36, rz: 0 },
  { rx: 10.81, ry: -108, rz: 0 },
  { rx: 10.81, ry: -180, rz: 0 },
  { rx: 10.81, ry: -252, rz: 0 },
  { rx: 10.81, ry: -324, rz: 0 },
  { rx: 52.62, ry: -36, rz: 180 },
  { rx: 52.62, ry: -108, rz: 180 },
  { rx: 52.62, ry: -180, rz: 180 },
  { rx: 52.62, ry: -252, rz: 180 },
  { rx: 52.62, ry: -324, rz: 180 },
];

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
