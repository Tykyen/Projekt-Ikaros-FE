import { describe, it, expect } from 'vitest';
import { FATE_TARGETS, targetForFate } from './diceTargets';
import { FATE_DICE_SKINS } from './diceSkins';

/**
 * Task I4 (10.2j) — regrese „FATE plus se zobrazoval jako mínus".
 *
 * Šetření ukázalo, že v aktuálním kódu NENÍ inverze plus↔mínus na žádné
 * deterministické cestě (textura, target rotace, naming asset URL). Tento
 * test zamyká ověřené korektní mapování, aby budoucí úprava omylem
 * neprohodila plus a mínus tvář (což byla hlavní hypotéza dluhu).
 *
 * Pokrývá to, co JDE deterministicky testovat:
 *  1. naming kontrakt: `facePlusImg` → asset `_plus`, `faceMinusImg` → `_minus`.
 *  2. target rotace: '+' a '-' míří na PROTILEHLÉ tváře krychle (ry 0 vs 180);
 *     '0' míří na osu X. Geometrii (která tvář je čelně ke kameře) nelze v
 *     jsdom ověřit — ověřeno matematicky mimo test (rotace normál tváří).
 */

describe('FATE plus/mínus mapping (regrese I4)', () => {
  it('facePlusImg ukazuje na _plus asset, faceMinusImg na _minus (žádné prohození)', () => {
    const withTextures = FATE_DICE_SKINS.filter(
      (s) => s.facePlusImg || s.faceMinusImg,
    );
    // Sanity — máme skiny s texturami (jinak test nic netestuje).
    expect(withTextures.length).toBeGreaterThan(0);

    for (const skin of withTextures) {
      if (skin.facePlusImg) {
        expect(
          skin.facePlusImg,
          `skin '${skin.id}' facePlusImg musí odkazovat na _plus asset`,
        ).toMatch(/_plus\.webp(\?|$)/);
        expect(skin.facePlusImg).not.toMatch(/_minus\.webp/);
      }
      if (skin.faceMinusImg) {
        expect(
          skin.faceMinusImg,
          `skin '${skin.id}' faceMinusImg musí odkazovat na _minus asset`,
        ).toMatch(/_minus\.webp(\?|$)/);
        expect(skin.faceMinusImg).not.toMatch(/_plus\.webp/);
      }
    }
  });

  it("FATE_TARGETS: '+' a '-' jsou protilehlé tváře (ry 0 vs 180), '0' je samostatná", () => {
    // '+' = krychle v základní orientaci → čelní (front) tvář s plus texturou.
    expect(FATE_TARGETS['+']).toEqual({ rx: 0, ry: 0, rz: 0 });
    // '-' = otočení o 180° kolem Y → protilehlá (back) tvář s minus texturou.
    expect(FATE_TARGETS['-']).toEqual({ rx: 0, ry: 180, rz: 0 });
    // Plus a minus MUSÍ být protilehlé (rozdíl 180° v ry), ne stejná tvář.
    expect(Math.abs(FATE_TARGETS['+'].ry - FATE_TARGETS['-'].ry)).toBe(180);
    // '0' je na jiné ose (rotace kolem X), ne zaměnitelná s +/-.
    expect(FATE_TARGETS['0']).toEqual({ rx: -90, ry: 0, rz: 0 });
  });

  it('numerické i symbolické formy fate tváře mapují na stejný target', () => {
    expect(targetForFate('+')).toEqual(targetForFate(1));
    expect(targetForFate('-')).toEqual(targetForFate(-1));
    expect(targetForFate('+')).not.toEqual(targetForFate('-'));
  });
});
