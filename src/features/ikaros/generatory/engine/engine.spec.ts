/**
 * 21.2a — invarianty generovacích enginů: determinismus seedu (V9),
 * Zipf (V2), přechylování (V1), jmenný engine, demografický model (R4).
 */
import { describe, it, expect } from 'vitest';
import { pickZipf, rngFromSeed, triangular } from './random';
import { feminizeSurnameCs, generateNames } from './names';
import {
  applySetDemography,
  defaultParams,
  generateFamily,
  MORTALITY_PRESETS,
} from './demography';
import { nameFamily } from './familyNames';
import type { GlobalNameSet } from '../types';

function testSet(over: Partial<GlobalNameSet> = {}): GlobalNameSet {
  return {
    id: 's1',
    scope: 'community',
    name: 'Testovací',
    category: 'vlastni',
    maleNames: ['Jan', 'Petr', 'Karel', 'Ota'],
    femaleNames: ['Marie', 'Anna', 'Eva', 'Zdislava'],
    surnames: ['Novák', 'Veselý', 'Svoboda', 'Špaček', 'Krejčí', 'Janů'],
    epithets: ['Hrbáč', 'z Lipan'],
    femaleSurnameRule: 'cs',
    frequencySorted: true,
    status: 'approved',
    authorId: 'a',
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

describe('random (V9 seed)', () => {
  it('stejný seed → stejná sekvence, jiný seed → jiná', () => {
    const a1 = Array.from({ length: 10 }, rngFromSeed('abc'));
    const a2 = Array.from({ length: 10 }, rngFromSeed('abc'));
    const b = Array.from({ length: 10 }, rngFromSeed('xyz'));
    expect(a1).toEqual(a2);
    expect(a1).not.toEqual(b);
  });

  it('triangular drží meze', () => {
    const rng = rngFromSeed('t');
    for (let i = 0; i < 500; i++) {
      const v = triangular(rng, 16, 20, 26);
      expect(v).toBeGreaterThanOrEqual(16);
      expect(v).toBeLessThanOrEqual(26);
    }
  });

  it('Zipf preferuje začátek seznamu', () => {
    const rng = rngFromSeed('z');
    const arr = Array.from({ length: 100 }, (_, i) => i);
    const counts = new Array(100).fill(0);
    for (let i = 0; i < 3000; i++) counts[pickZipf(rng, arr)]++;
    const firstTen = counts.slice(0, 10).reduce((a, b) => a + b, 0);
    const lastTen = counts.slice(90).reduce((a, b) => a + b, 0);
    expect(firstTen).toBeGreaterThan(lastTen * 3);
  });
});

describe('names (V1 přechylování + V7 přízviska)', () => {
  it('feminizeSurnameCs — základní pravidla', () => {
    expect(feminizeSurnameCs('Novák')).toBe('Nováková');
    expect(feminizeSurnameCs('Veselý')).toBe('Veselá');
    expect(feminizeSurnameCs('Svoboda')).toBe('Svobodová');
    expect(feminizeSurnameCs('Špaček')).toBe('Špačková');
    expect(feminizeSurnameCs('Krejčí')).toBe('Krejčí');
    expect(feminizeSurnameCs('Janů')).toBe('Janů');
    expect(feminizeSurnameCs('Nováková')).toBe('Nováková');
  });

  it('generuje počet, pohlaví a formát; ženy přechýlené', () => {
    const out = generateNames(rngFromSeed('n'), testSet(), {
      count: 20,
      gender: 'f',
      format: 'full',
    });
    expect(out).toHaveLength(20);
    for (const n of out) {
      expect(n.gender).toBe('f');
      expect(['Marie', 'Anna', 'Eva', 'Zdislava']).toContain(n.given!);
      expect(n.surname).toMatch(/(ová|á|Krejčí|Janů)$/);
    }
  });

  it('sada bez příjmení dává jen křestní; přízviska jdou zapnout', () => {
    const noSurnames = testSet({ surnames: [], surnameNote: 'nemá příjmení' });
    const out = generateNames(rngFromSeed('n2'), noSurnames, {
      count: 5,
      gender: 'm',
      format: 'full',
      withEpithet: true,
    });
    for (const n of out) {
      expect(n.surname).toBeUndefined();
      expect(n.epithet).toBeDefined();
      expect(n.text).toContain(n.epithet!);
    }
  });

  it('determinismus: stejný seed → stejná jména', () => {
    const a = generateNames(rngFromSeed('s'), testSet(), {
      count: 10,
      gender: 'mix',
      format: 'full',
      zipf: true,
    });
    const b = generateNames(rngFromSeed('s'), testSet(), {
      count: 10,
      gender: 'mix',
      format: 'full',
      zipf: true,
    });
    expect(a).toEqual(b);
  });
});

describe('demography (R4 model)', () => {
  it('determinismus: stejný seed → stejná rodina', () => {
    const a = generateFamily(rngFromSeed('fam'), defaultParams());
    const b = generateFamily(rngFromSeed('fam'), defaultParams());
    expect(a).toEqual(b);
  });

  it('porody leží v okně plodnosti a nekončí po smrti matky', () => {
    for (let i = 0; i < 50; i++) {
      const f = generateFamily(rngFromSeed('w' + i), defaultParams());
      for (const ch of f.children) {
        expect(ch.motherAgeAtBirth).toBeGreaterThanOrEqual(16);
        expect(ch.motherAgeAtBirth).toBeLessThanOrEqual(
          Math.min(45, f.mother.ageAtDeath),
        );
      }
      if (f.mother.diedInChildbirthAt !== undefined) {
        expect(f.mother.deathCause).toBe('porod');
        // po porodu, při kterém zemřela, už žádný další porod
        const last = Math.max(...f.children.map((c) => c.birthOrder));
        expect(last).toBe(f.mother.diedInChildbirthAt);
      }
    }
  });

  it('typická dokončená rodina má víc dětí než starý model (průměr > 4)', () => {
    let total = 0;
    let n = 0;
    for (let i = 0; i < 200; i++) {
      const f = generateFamily(rngFromSeed('avg' + i), defaultParams());
      // jen matky, které přežily plodné období (dokončená rodina)
      if (f.mother.ageAtDeath >= 45) {
        total += f.totalBirths;
        n++;
      }
    }
    expect(n).toBeGreaterThan(50);
    expect(total / n).toBeGreaterThan(4);
  });

  it('preset Prosperita má vyšší dožití dětí než Tvrdý svět', () => {
    const survivors = (preset: 'tvrdy' | 'prosperita') => {
      let adult = 0;
      let all = 0;
      for (let i = 0; i < 150; i++) {
        const params = {
          ...defaultParams(),
          ...MORTALITY_PRESETS[preset],
          label: undefined,
        } as ReturnType<typeof defaultParams>;
        const f = generateFamily(rngFromSeed(preset + i), params);
        all += f.children.length;
        adult += f.children.filter((c) => c.fate === 'dospělý').length;
      }
      return adult / all;
    };
    expect(survivors('prosperita')).toBeGreaterThan(survivors('tvrdy') + 0.1);
  });

  it('V6: elfí profil posouvá okno plodnosti a násobí dožití', () => {
    const p = applySetDemography(defaultParams(), {
      lifespanMult: 3,
      fertilityFrom: 40,
      fertilityTo: 150,
    });
    const f = generateFamily(rngFromSeed('elf'), p);
    expect(f.mother.marriageAge).toBeGreaterThanOrEqual(40);
    for (const ch of f.children) {
      expect(ch.motherAgeAtBirth).toBeLessThanOrEqual(150);
    }
  });

  it('V8: víc generací respektuje strop osob', () => {
    const p = { ...defaultParams(), generations: 3 };
    const f = generateFamily(rngFromSeed('gen3'), p);
    let count = 2;
    const walk = (fam: typeof f) => {
      count += fam.children.length;
      for (const ch of fam.children) {
        if (ch.spouse) count++;
        if (ch.family) walk(ch.family);
      }
    };
    walk(f);
    expect(count).toBeLessThanOrEqual(210);
  });

  it('V3: nameFamily pojmenuje všechny a drží patrilineární příjmení', () => {
    const p = { ...defaultParams(), generations: 2 };
    const f = generateFamily(rngFromSeed('names'), p);
    nameFamily(rngFromSeed('names2'), f, testSet());
    expect(f.father.name).toBeTruthy();
    expect(f.mother.name).toBeTruthy();
    const fatherSurname = f.father.name!.split(' ').pop()!;
    for (const ch of f.children) {
      expect(ch.name).toBeTruthy();
      if (ch.gender === 'm') {
        expect(ch.name!.endsWith(fatherSurname)).toBe(true);
        if (ch.family) {
          // synova rodina pokračuje v jeho příjmení
          expect(ch.family.father.name).toBe(ch.name);
        }
      }
      if (ch.spouse) expect(ch.spouse.name).toBeTruthy();
    }
  });
});
