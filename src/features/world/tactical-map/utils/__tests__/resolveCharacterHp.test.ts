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

  it('gurps: bez hp_max → fallback na gurps_st (HP = ST, auto-default se neukládá)', () => {
    expect(resolveCharacterHp('gurps', { gurps_st: '10' })).toEqual({
      current: 10,
      max: 10,
    });
  });

  it('gurps: current chybí → default = max', () => {
    expect(
      resolveCharacterHp('gurps', { gurps_st: '12', gurps_hp_max: '12' }),
    ).toEqual({ current: 12, max: 12 });
  });

  it('drdh: drdh_hp / drdh_hp_max', () => {
    expect(
      resolveCharacterHp('drdh', { drdh_hp: '5', drdh_hp_max: '20' }),
    ).toEqual({ current: 5, max: 20 });
  });

  it('drdh: bez max → null (žádný bar)', () => {
    expect(resolveCharacterHp('drdh', { drdh_hp: '5' })).toBeNull();
  });

  it('drdh: current chybí → default = max (plné HP)', () => {
    expect(resolveCharacterHp('drdh', { drdh_hp_max: '28' })).toEqual({
      current: 28,
      max: 28,
    });
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

  it('fate: stres boxy — current = nezaškrtnuté / max = celkem', () => {
    const stress = JSON.stringify([
      { size: 1, on: true },
      { size: 2, on: false },
      { size: 3, on: false },
    ]);
    expect(resolveCharacterHp('fate', { fate_stress: stress })).toEqual({
      current: 2,
      max: 3,
    });
  });

  it('fae: bez stresu → default 3 boxy (plné)', () => {
    expect(resolveCharacterHp('fae', {})).toEqual({ current: 3, max: 3 });
  });

  it('fae: stres jako pole (ne JSON string)', () => {
    expect(
      resolveCharacterHp('fae', { fae_stress: [{ on: true }, { on: true }] }),
    ).toEqual({ current: 0, max: 2 });
  });

  it('drdplus: mez zranění − zaplněné rány', () => {
    expect(
      resolveCharacterHp('drdplus', {
        drdp_zraneni_mez: '10',
        drdp_zraneni_val: '3',
      }),
    ).toEqual({ current: 7, max: 10 });
  });

  it('drdplus: bez ran → plná mez', () => {
    expect(resolveCharacterHp('drdplus', { drdp_zraneni_mez: '12' })).toEqual({
      current: 12,
      max: 12,
    });
  });

  // SR6 HP bar = fyzický záznamník: max = 8 + ⌈Tělo/2⌉, zbývá = max − zranění.
  it('shadowrun: max = 8 + ⌈Tělo/2⌉, zbývá = max − sr_cond_phys', () => {
    // Tělo 4 → max 10; 3 boxy zranění → zbývá 7.
    expect(
      resolveCharacterHp('shadowrun', { sr_attr_bod: '4', sr_cond_phys: '3' }),
    ).toEqual({ current: 7, max: 10 });
  });

  it('shadowrun: liché Tělo → ⌈/2⌉ (Tělo 5 → max 11)', () => {
    expect(
      resolveCharacterHp('shadowrun', { sr_attr_bod: '5', sr_cond_phys: '0' }),
    ).toEqual({ current: 11, max: 11 });
  });

  it('shadowrun: bez dat → min track 8 (plný)', () => {
    expect(resolveCharacterHp('shadowrun', {})).toEqual({ current: 8, max: 8 });
  });
});

describe('resolveCharacterHp — systémy bez klasického HP', () => {
  // drd2 = 3 zdroje (Tělo/Duše/Vliv), navíc tvrdě vypnuté v HP_BAR_DISABLED_SYSTEMS.
  // fate/fae (stres) i drdplus (mez zranění) UŽ bar mají (viz výše) — jediná
  // výjimka je drd2 (+ neznámý systém).
  it.each(['drd2', 'neznamy'])(
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
