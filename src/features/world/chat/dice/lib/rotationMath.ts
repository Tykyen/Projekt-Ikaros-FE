/**
 * Krok 6.3-fix — Čisté 3×3 rotační helpery (bez DOM) pro výpočet cílové
 * orientace kostky jako PŘESNÉ inverze rotace tváře.
 *
 * Matice odpovídají 1:1 CSS spec maticím (`rotateX/Y/Z`), takže výsledek
 * platí i v prohlížeči — viz [plan-6.3-fix-dice-orientation.md].
 */

export type Axis = 'x' | 'y' | 'z';
/** Jedna rotace: osa + úhel ve stupních. */
export type RotOp = [Axis, number];
export type Mat3 = number[][];

const d2r = (d: number): number => (d * Math.PI) / 180;
const r2d = (r: number): number => (r * 180) / Math.PI;

export const ID: Mat3 = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

export function matMul(a: Mat3, b: Mat3): Mat3 {
  return a.map((_, i) =>
    b[0].map((__, j) => a[i].reduce((s, _v, k) => s + a[i][k] * b[k][j], 0)),
  );
}

/** Rotační matice kolem osy (stupně). Shodné s CSS `rotateX/Y/Z` maticemi. */
export function rot(axis: Axis, deg: number): Mat3 {
  const c = Math.cos(d2r(deg));
  const s = Math.sin(d2r(deg));
  if (axis === 'x') return [[1, 0, 0], [0, c, -s], [0, s, c]];
  if (axis === 'y') return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
  return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
}

/** Složení rotací v pořadí zápisu (leva = vnější, jako CSS `transform: A B C`). */
export function compose(ops: RotOp[]): Mat3 {
  return ops.reduce<Mat3>((acc, [axis, deg]) => matMul(acc, rot(axis, deg)), ID);
}

export function transpose(m: Mat3): Mat3 {
  return m[0].map((_, j) => m.map((row) => row[j]));
}

export interface EulerXYZ {
  rx: number;
  ry: number;
  rz: number;
}

/**
 * Dekompozice rotační matice na Euler úhly pro pořadí `Rx(rx)·Ry(ry)·Rz(rz)`
 * — tj. přesně to pořadí, v němž konzumenti aplikují `rotateX rotateY rotateZ`.
 * Ošetřen gimbal (ry = ±90°).
 */
export function decomposeXYZ(m: Mat3): EulerXYZ {
  const clamp = (v: number): number => Math.max(-1, Math.min(1, v));
  const ry = Math.asin(clamp(m[0][2]));
  let rx: number;
  let rz: number;
  if (Math.abs(m[0][2]) < 0.99999) {
    rx = Math.atan2(-m[1][2], m[2][2]);
    rz = Math.atan2(-m[0][1], m[0][0]);
  } else {
    // ry ≈ ±90° → osy rx a rz splynou; zafixuj rz = 0.
    rx = Math.atan2(m[2][1], m[1][1]);
    rz = 0;
  }
  return { rx: r2d(rx), ry: r2d(ry), rz: r2d(rz) };
}

/**
 * Cílová orientace kostky pro danou tvář = inverze rotace tváře.
 * Pro rotační (ortogonální) matici platí inverze = transpozice.
 */
export function invertFaceToEuler(faceOps: RotOp[]): EulerXYZ {
  return decomposeXYZ(transpose(compose(faceOps)));
}

/**
 * Test helper — odklon normály tváře od diváka (+Z) po usazení kostky do
 * cílové rotace. 0° = tvář přesně čelem.
 */
export function faceTiltDeg(target: EulerXYZ, faceOps: RotOp[]): number {
  const cube = compose([
    ['x', target.rx],
    ['y', target.ry],
    ['z', target.rz],
  ]);
  const m = matMul(cube, compose(faceOps));
  return r2d(Math.acos(Math.max(-1, Math.min(1, m[2][2]))));
}
