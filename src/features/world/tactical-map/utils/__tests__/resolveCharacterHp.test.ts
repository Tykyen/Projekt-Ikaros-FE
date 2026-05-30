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

  it('dnd5e: currentHP / maxHP', () => {
    expect(
      resolveCharacterHp('dnd5e', { dnd_currentHP: '14', dnd_maxHP: '28' }),
    ).toEqual({ current: 14, max: 28 });
  });

  it('dnd5e: bez maxHP → null (žádný bar)', () => {
    expect(resolveCharacterHp('dnd5e', { dnd_currentHP: '14' })).toBeNull();
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
    expect(resolveCharacterHp('dnd5e', { dnd_maxHP: '30' })).toEqual({
      current: 30,
      max: 30,
    });
  });

  it('podporuje i číselné hodnoty (ne jen string)', () => {
    expect(
      resolveCharacterHp('dnd5e', { dnd_currentHP: 5, dnd_maxHP: 10 }),
    ).toEqual({ current: 5, max: 10 });
  });
});

describe('resolveCharacterHp — systémy bez klasického HP', () => {
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
