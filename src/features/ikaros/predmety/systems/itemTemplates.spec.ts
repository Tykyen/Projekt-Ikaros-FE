/**
 * 21.5e — invarianty šablon předmětů (spec-21.5e §4): 14 systémů, mechanismus
 * druh→skupina polí (weapon/armor/general), unikátní klíče, nabídky selectů.
 */
import { describe, expect, it } from 'vitest';
import {
  ITEM_KINDS,
  ITEM_SYSTEM_TEMPLATES,
  getItemTemplate,
  itemKindGroup,
  validateItemStats,
} from './itemTemplates';

describe('itemTemplates', () => {
  it('pokrývá všech 14 systémů platformy (parity s kouzly/lektvary)', () => {
    const ids = ITEM_SYSTEM_TEMPLATES.map((t) => t.id).sort();
    expect(ids).toEqual(
      [
        'generic',
        'dnd5e',
        'drd16',
        'drd2',
        'drdplus',
        'jad',
        'drdh',
        'pi',
        'matrix',
        'coc',
        'gurps',
        'shadowrun',
        'fae',
        'fate',
      ].sort(),
    );
  });

  it('druh → skupina polí (spec R1): zbraně/zbroje/obecné + fallback', () => {
    expect(itemKindGroup('zbraň')).toBe('weapon');
    expect(itemKindGroup('střelná/vrhací zbraň')).toBe('weapon');
    expect(itemKindGroup('zbroj')).toBe('armor');
    expect(itemKindGroup('štít')).toBe('armor');
    expect(itemKindGroup('nástroj')).toBe('general');
    expect(itemKindGroup('kouzelný předmět')).toBe('general');
    expect(itemKindGroup('vlastní vymyšlený druh')).toBe('general');
    expect(itemKindGroup('ZBRAŇ')).toBe('weapon'); // case-insensitive
  });

  it('getItemTemplate vrací variantu dle druhu a má vždy volné páry (R3)', () => {
    const w = getItemTemplate('drd16', 'zbraň');
    const a = getItemTemplate('drd16', 'zbroj');
    const g = getItemTemplate('drd16', 'nástroj');
    expect(w.fields.some((f) => f.key === 'attack')).toBe(true);
    expect(a.fields.some((f) => f.key === 'quality')).toBe(true);
    expect(g.fields.some((f) => f.key === 'usage')).toBe(true);
    for (const t of [w, a, g]) expect(t.freeform).toBe(true);
  });

  it('getItemTemplate padá na generic pro neznámý systém', () => {
    expect(getItemTemplate('neexistuje', 'zbraň').id).toBe('generic');
  });

  it('klíče polí jsou v rámci varianty unikátní a selecty mají nabídku', () => {
    for (const t of ITEM_SYSTEM_TEMPLATES) {
      for (const group of ['weapon', 'armor', 'general'] as const) {
        const keys = t[group].map((f) => f.key);
        expect(new Set(keys).size, `${t.id}.${group}`).toBe(keys.length);
        for (const f of t[group]) {
          if (f.type === 'select' || f.type === 'multicheck') {
            expect(
              f.options?.length,
              `${t.id}.${group}.${f.key}`,
            ).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('validateItemStats hlásí prázdná povinná pole (drdh zbraň)', () => {
    const t = getItemTemplate('drdh', 'zbraň');
    const errs = validateItemStats(t, { type: 'na blízko' });
    expect(errs.type).toBeUndefined();
    expect(errs.attack).toBeTruthy();
    expect(errs.damage).toBeTruthy();

    const ok = validateItemStats(t, {
      type: 'na blízko',
      attack: '+2',
      damage: '1k6+2',
    });
    expect(Object.keys(ok)).toHaveLength(0);
  });

  it('ITEM_KINDS nabízí základní druhy vč. zbraně a zbroje', () => {
    const labels = ITEM_KINDS.map((k) => k.label);
    expect(labels).toContain('zbraň');
    expect(labels).toContain('zbroj');
    expect(labels).toContain('kouzelný předmět');
  });
});
