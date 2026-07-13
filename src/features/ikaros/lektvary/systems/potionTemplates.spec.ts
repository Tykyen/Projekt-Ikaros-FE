/**
 * 21.5b — invarianty šablon lektvarů (spec-21.5b §4): 14 systémů, unikátní
 * klíče, nabídky u select polí, generic fallback. Druh lektvaru je v JÁDRU
 * (ne ve statbloku) — na rozdíl od školy magie u kouzel.
 */
import { describe, expect, it } from 'vitest';
import {
  POTION_KINDS,
  POTION_SYSTEM_TEMPLATES,
  getPotionTemplate,
  validatePotionStats,
} from './potionTemplates';

describe('potionTemplates', () => {
  it('pokrývá všech 14 systémů platformy (parity s kouzly)', () => {
    const ids = POTION_SYSTEM_TEMPLATES.map((t) => t.id).sort();
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

  it('statblok NEMÁ druh (kind je v jádru, spec R2)', () => {
    for (const t of POTION_SYSTEM_TEMPLATES) {
      expect(
        t.fields.some((f) => f.key === 'kind' || f.key === 'school'),
        t.id,
      ).toBe(false);
    }
  });

  it('klíče polí jsou v rámci systému unikátní a selecty mají nabídku', () => {
    for (const t of POTION_SYSTEM_TEMPLATES) {
      const keys = t.fields.map((f) => f.key);
      expect(new Set(keys).size, t.id).toBe(keys.length);
      for (const f of t.fields) {
        if (f.type === 'select' || f.type === 'multicheck') {
          expect(f.options?.length, `${t.id}.${f.key}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('systémy bez pevného statbloku jsou volná šablona (freeform)', () => {
    for (const id of ['generic', 'drdplus', 'drd2', 'coc', 'pi', 'fate', 'fae']) {
      expect(getPotionTemplate(id).freeform, id).toBe(true);
    }
  });

  it('getPotionTemplate padá na generic pro neznámý systém', () => {
    expect(getPotionTemplate('neexistuje').id).toBe('generic');
  });

  it('validatePotionStats hlásí prázdná povinná pole (drd16 formát)', () => {
    const drd16 = getPotionTemplate('drd16');
    const errs = validatePotionStats(drd16, { mana: '7 magů' });
    expect(errs.mana).toBeUndefined();
    expect(errs.materials).toBeTruthy();
    expect(errs.crafting).toBeTruthy();
    expect(errs.duration).toBeTruthy();

    const ok = validatePotionStats(drd16, {
      mana: '7 magů',
      materials: '30 zl',
      crafting: '1 směna',
      duration: 'ihned',
    });
    expect(Object.keys(ok)).toHaveLength(0);
  });

  it('POTION_KINDS nabízí základní druhy vč. léčivého a jedu', () => {
    expect(POTION_KINDS).toContain('léčivý');
    expect(POTION_KINDS).toContain('jed');
  });
});
