/**
 * Testy sdíleného bestie view-modelu Shadowrun 6e (math jádro — drift-free
 * mezi mapou a chatem). Pokrývá: damageable fyz. záznamník (zbývá = max −
 * zaplněné), postih do poolů (−1/3 boxy, oba záznamníky), parsing útoků/
 * dovedností/powers, atributy, a toggle patch helpery (count model).
 */
import { describe, it, expect } from 'vitest';
import {
  shadowrunBestieView,
  shadowrunPhysTogglePatch,
  shadowrunStunTogglePatch,
} from '../shadowrunBestieView';

const base = {
  profile: 'Paranormální zvíře · Profil 4',
  'health.max': 11,
  'health.current': 11,
  stun_max: 10,
  stun_cur: 0,
  defense: 9,
  armor: 9,
  movement: 10,
  'initiative.base': 7,
  attr_bod: 5,
  attr_int: 4,
  weapons: [{ name: 'Skus', type: 'Blízko', dmg: '4P', pool: 9 }],
  skills: [{ name: 'Vnímání', attr: 'INT', pool: 7 }],
  powers: [{ name: 'Imunita (oheň)', desc: 'Nezraní ho normální oheň.' }],
};

describe('shadowrunBestieView', () => {
  it('plný záznamník = bez postihu; boxy = max, žádný zaplněný', () => {
    const v = shadowrunBestieView(base);
    expect(v.physMax).toBe(11);
    expect(v.physCur).toBe(11);
    expect(v.woundPen).toBe(0);
    expect(v.physBoxes).toHaveLength(11);
    expect(v.physBoxes.some((b) => b.on)).toBe(false);
  });

  it('zaplněné fyz. boxy = max − current; postih −1 za každé 3', () => {
    const v = shadowrunBestieView({ ...base, 'health.current': 5 }); // 6 zaplněných
    expect(v.physBoxes.filter((b) => b.on)).toHaveLength(6);
    expect(v.woundPen).toBe(2); // floor(6/3)
  });

  it('postih sčítá oba záznamníky (fyz + omráčení)', () => {
    const v = shadowrunBestieView({ ...base, 'health.current': 8, stun_cur: 3 });
    // fyz 3 zaplněné → −1, stun 3 → −1
    expect(v.woundPen).toBe(2);
    expect(v.stunBoxes.filter((b) => b.on)).toHaveLength(3);
  });

  it('parsuje útoky/dovednosti/powers + 8 atributů', () => {
    const v = shadowrunBestieView(base);
    expect(v.weapons[0]).toMatchObject({ name: 'Skus', dmg: '4P', pool: 9 });
    expect(v.skills[0]).toMatchObject({ name: 'Vnímání', attr: 'INT', pool: 7 });
    expect(v.powers[0].name).toBe('Imunita (oheň)');
    expect(v.attrs).toHaveLength(8);
    expect(v.attrs.find((a) => a.code === 'TĚL')?.value).toBe(5);
  });

  it('list zvládne i JSON string (legacy serializace)', () => {
    const v = shadowrunBestieView({ ...base, weapons: JSON.stringify(base.weapons) });
    expect(v.weapons[0].name).toBe('Skus');
  });
});

describe('toggle patch helpery (count model)', () => {
  it('phys: klik na box i zaplní po i+1 (current = max − (i+1))', () => {
    expect(shadowrunPhysTogglePatch(base, 2)).toEqual({ 'health.current': 8 }); // 11 − 3
  });

  it('phys: klik na poslední zaplněný box odškrtne (current roste)', () => {
    const stats = { ...base, 'health.current': 8 }; // 3 zaplněné
    expect(shadowrunPhysTogglePatch(stats, 2)).toEqual({ 'health.current': 9 }); // odškrtne 3. → 2 zaplněné
  });

  it('stun: count model na stun_cur', () => {
    expect(shadowrunStunTogglePatch(base, 1)).toEqual({ stun_cur: 2 });
    expect(shadowrunStunTogglePatch({ ...base, stun_cur: 2 }, 1)).toEqual({ stun_cur: 1 });
  });
});
