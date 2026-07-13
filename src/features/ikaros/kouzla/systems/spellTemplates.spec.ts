/**
 * 21.5c — invarianty šablon kouzel (spec-21.5c §5): škola první a povinná
 * v každém systému, validace povinných polí, čtení volných párů.
 */
import { describe, expect, it } from 'vitest';
import {
  SPELL_SYSTEM_TEMPLATES,
  SPELL_EXTRA_KEY,
  getSpellTemplate,
  spellExtras,
  spellSchool,
  validateSpellStats,
  formatSpellValue,
} from './spellTemplates';

describe('spellTemplates', () => {
  it('každý systém má školu magie jako první povinné pole (spec R2)', () => {
    for (const t of SPELL_SYSTEM_TEMPLATES) {
      const first = t.fields[0];
      expect(first?.key, t.id).toBe('school');
      expect(first?.required, t.id).toBe(true);
    }
  });

  it('pokrývá všech 14 systémů platformy (parity s BESTIE_SYSTEMS)', () => {
    const ids = SPELL_SYSTEM_TEMPLATES.map((t) => t.id).sort();
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

  it('klíče polí jsou v rámci systému unikátní', () => {
    for (const t of SPELL_SYSTEM_TEMPLATES) {
      const keys = t.fields.map((f) => f.key);
      expect(new Set(keys).size, t.id).toBe(keys.length);
    }
  });

  it('select/combo/multicheck s výjimkou volných combo mají nabídku', () => {
    for (const t of SPELL_SYSTEM_TEMPLATES) {
      for (const f of t.fields) {
        if (f.type === 'select' || f.type === 'multicheck') {
          expect(f.options?.length, `${t.id}.${f.key}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('getSpellTemplate padá na generic pro neznámý systém', () => {
    expect(getSpellTemplate('neexistuje').id).toBe('generic');
  });

  it('validateSpellStats hlásí prázdná povinná pole', () => {
    const drd16 = getSpellTemplate('drd16');
    const errs = validateSpellStats(drd16, { school: 'vitální' });
    expect(errs.school).toBeUndefined();
    expect(errs.mana).toBeTruthy();
    expect(errs.range).toBeTruthy();

    const ok = validateSpellStats(drd16, {
      school: 'vitální',
      mana: '6 mágů',
      range: 'dotek',
      scope: 'jedno mrtvé tělo',
      casting: '3 kola',
      duration: 'stále',
    });
    expect(Object.keys(ok)).toHaveLength(0);
  });

  it('validateSpellStats: prázdný multicheck s required nevalidní', () => {
    const t = getSpellTemplate('dnd5e');
    const errs = validateSpellStats(t, { school: 'Zaklínání', level: '' });
    expect(errs.level).toBeTruthy();
  });

  it('spellSchool + spellExtras čtou statblok bezpečně', () => {
    expect(spellSchool({ school: 'Vyvolávání' })).toBe('Vyvolávání');
    expect(spellSchool({})).toBe('');
    expect(spellSchool(undefined)).toBe('');
    expect(
      spellExtras({ [SPELL_EXTRA_KEY]: [{ label: 'Cena', value: '1 bod' }] }),
    ).toEqual([{ label: 'Cena', value: '1 bod' }]);
    expect(spellExtras({ [SPELL_EXTRA_KEY]: 'rozbité' })).toEqual([]);
    expect(spellExtras(undefined)).toEqual([]);
  });

  it('formatSpellValue formátuje checkbox/pole/pole hodnot', () => {
    const chk = { key: 'x', label: 'X', type: 'checkbox' as const };
    expect(formatSpellValue(chk, true)).toBe('ano');
    expect(formatSpellValue(chk, false)).toBe('');
    const multi = { key: 'y', label: 'Y', type: 'multicheck' as const };
    expect(formatSpellValue(multi, ['V', 'S'])).toBe('V, S');
    const txt = { key: 'z', label: 'Z', type: 'text' as const };
    expect(formatSpellValue(txt, ' dotek ')).toBe('dotek');
    expect(formatSpellValue(txt, undefined)).toBe('');
  });
});
