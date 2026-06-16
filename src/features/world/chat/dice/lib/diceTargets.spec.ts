import { describe, it, expect } from 'vitest';
import { FACE_ROTATIONS, type DiceGeoType } from './faceRotations';
import {
  D6_TARGETS,
  D8_TARGETS,
  D10_TARGETS,
  D12_TARGETS,
  D20_TARGETS,
  type DiceTarget,
} from './diceTargets';
import { faceTiltDeg } from './rotationMath';

/**
 * Krok 6.3-fix — anti-regresní brána orientace kostek.
 *
 * Pro každou tvář každého typu musí kostka po usazení do TARGETS ukázat tvář
 * čelem (odklon normály od diváka < 0,5°). Přesně tenhle výpočet odhalil, že
 * D12/D20 dosedaly nakloněné až o 158°. Kdokoli rozhodí geometrii
 * (`faceRotations.ts`) nebo generátor (`rotationMath.ts`), tady to spadne.
 */

const TARGETS: Record<DiceGeoType, DiceTarget[]> = {
  d6: D6_TARGETS,
  d8: D8_TARGETS,
  d10: D10_TARGETS,
  d12: D12_TARGETS,
  d20: D20_TARGETS,
};

const TYPES = Object.keys(FACE_ROTATIONS) as DiceGeoType[];

describe('diceTargets — každá tvář dosedne čelem k divákovi', () => {
  TYPES.forEach((type) => {
    const faces = FACE_ROTATIONS[type];

    it(`${type}: počet TARGETS == počet tváří (${faces.length})`, () => {
      expect(TARGETS[type]).toHaveLength(faces.length);
    });

    faces.forEach((ops, i) => {
      it(`${type} tvář ${i + 1} dosedne < 0,5° od čela`, () => {
        expect(faceTiltDeg(TARGETS[type][i], ops)).toBeLessThan(0.5);
      });
    });
  });
});

describe('diceTargets — regrese dříve rozbitých tváří', () => {
  it('D20 tvář 19 (dříve ~158°) je opravená', () => {
    expect(faceTiltDeg(D20_TARGETS[18], FACE_ROTATIONS.d20[18])).toBeLessThan(
      0.5,
    );
  });

  it('D12 tvář 6 (dříve ~148°) je opravená', () => {
    expect(faceTiltDeg(D12_TARGETS[5], FACE_ROTATIONS.d12[5])).toBeLessThan(0.5);
  });

  it('D6/D8/D10 (dříve OK) zůstávají správně po přepočtu', () => {
    const ok = (['d6', 'd8', 'd10'] as DiceGeoType[]).every((t) =>
      FACE_ROTATIONS[t].every(
        (ops, i) => faceTiltDeg(TARGETS[t][i], ops) < 0.5,
      ),
    );
    expect(ok).toBe(true);
  });
});
