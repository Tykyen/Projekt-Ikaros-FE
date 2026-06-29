import { describe, it, expect } from 'vitest';
import { resolveCharacterHp } from '../resolveCharacterHp';

describe('resolveCharacterHp — systémy s klasickým HP', () => {
  it('matrix: health z customData, max konstanta 5', () => {
    expect(resolveCharacterHp('matrix', { matrix_health: '2' })).toEqual({
      current: 2,
      max: 5,
    });
  });

  it('matrix: chybějící health → default 5 (plné)', () => {
    expect(resolveCharacterHp('matrix', {})).toEqual({ current: 5, max: 5 });
  });

  it('pi: pi_health z customData, max konstanta 5', () => {
    expect(resolveCharacterHp('pi', { pi_health: '3' })).toEqual({
      current: 3,
      max: 5,
    });
  });

  it('pi: chybějící health → default 5 (plné)', () => {
    expect(resolveCharacterHp('pi', {})).toEqual({ current: 5, max: 5 });
  });

  it('jad: jad_hpCur / jad_hpMax (prefix deníku)', () => {
    expect(
      resolveCharacterHp('jad', { jad_hpCur: '52', jad_hpMax: '71' }),
    ).toEqual({ current: 52, max: 71 });
  });

  it('jad: bez max → null (žádný bar)', () => {
    expect(resolveCharacterHp('jad', { jad_hpCur: '52' })).toBeNull();
  });

  it('jad: legacy klíče bez prefixu (fallback pro starší data)', () => {
    expect(resolveCharacterHp('jad', { hpCur: '5', hpMax: '10' })).toEqual({
      current: 5,
      max: 10,
    });
  });

  it('dnd5e: dnd_hpCur / dnd_hpMax (prefix deníku)', () => {
    expect(
      resolveCharacterHp('dnd5e', { dnd_hpCur: '12', dnd_hpMax: '20' }),
    ).toEqual({ current: 12, max: 20 });
  });

  it('dnd5e: bez max → null (žádný bar)', () => {
    expect(resolveCharacterHp('dnd5e', { dnd_hpCur: '12' })).toBeNull();
  });

  it('dnd5e: legacy klíče bez prefixu (fallback)', () => {
    expect(resolveCharacterHp('dnd5e', { hpCur: '3', hpMax: '8' })).toEqual({
      current: 3,
      max: 8,
    });
  });

  it('coc: hp_cur / hp_max', () => {
    expect(
      resolveCharacterHp('coc', { coc_hp_cur: '7', coc_hp_max: '12' }),
    ).toEqual({ current: 7, max: 12 });
  });

  it('gurps: gurps_hp / gurps_hp_max', () => {
    expect(
      resolveCharacterHp('gurps', { gurps_hp: '9', gurps_hp_max: '11' }),
    ).toEqual({ current: 9, max: 11 });
  });

  it('drdh: drdh_hp / drdh_hp_max', () => {
    expect(
      resolveCharacterHp('drdh', { drdh_hp: '5', drdh_hp_max: '20' }),
    ).toEqual({ current: 5, max: 20 });
  });

  it('drd16: hp_current / hp_max (bez prefixu)', () => {
    expect(
      resolveCharacterHp('drd16', { hp_current: '3', hp_max: '8' }),
    ).toEqual({ current: 3, max: 8 });
  });

  it('current chybí → default = max (plné HP)', () => {
    expect(resolveCharacterHp('dnd5e', { dnd_hpMax: '30' })).toEqual({
      current: 30,
      max: 30,
    });
  });

  it('jad: current chybí → default = max', () => {
    expect(resolveCharacterHp('jad', { jad_hpMax: '40' })).toEqual({
      current: 40,
      max: 40,
    });
  });

  it('podporuje i číselné hodnoty (ne jen string)', () => {
    expect(
      resolveCharacterHp('dnd5e', { dnd_hpCur: 5, dnd_hpMax: 10 }),
    ).toEqual({ current: 5, max: 10 });
  });
});

describe('resolveCharacterHp — systémy bez klasického HP', () => {
  // drd2 je navíc tvrdě vypnuté v HP_BAR_DISABLED_SYSTEMS (TokenSprite).
  // fate (stres) a drdplus (tracker výdrže) nemají current/max → null.
  it.each(['fate', 'drd2', 'drdplus', 'neznamy'])(
    '%s → null (mapování je herní rozhodnutí)',
    (system) => {
      expect(resolveCharacterHp(system, { anything: '5' })).toBeNull();
    },
  );

  it('null systemId / chybějící customData → null', () => {
    expect(resolveCharacterHp(null, { matrix_health: '3' })).toBeNull();
    expect(resolveCharacterHp('matrix', undefined)).toBeNull();
  });
});
