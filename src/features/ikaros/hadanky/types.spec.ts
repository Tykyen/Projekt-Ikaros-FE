/**
 * 21.5d — invarianty typů hádanek: 4 úrovně v pořadí od nejlehčí, labely,
 * bezpečný excerpt zadání (hádanka nemá name — spec R4).
 */
import { describe, expect, it } from 'vitest';
import {
  DIFFICULTY_OPTIONS,
  difficultyLabel,
  riddleExcerpt,
} from './types';

describe('hadanky types', () => {
  it('4 úrovně v pořadí od nejlehčí (spec R2, zadání uživatele)', () => {
    expect(DIFFICULTY_OPTIONS.map((o) => o.id)).toEqual([
      'lehka',
      'stredni',
      'tezka',
      'ultratezka',
    ]);
    expect(DIFFICULTY_OPTIONS.map((o) => o.label)).toEqual([
      'Lehká',
      'Střední',
      'Těžká',
      'Ultratěžká',
    ]);
  });

  it('difficultyLabel je bezpečný pro neznámé/prázdné hodnoty', () => {
    expect(difficultyLabel('tezka')).toBe('Těžká');
    expect(difficultyLabel(undefined)).toBe('');
    expect(difficultyLabel(null)).toBe('');
  });

  it('riddleExcerpt zkracuje a normalizuje bílé znaky', () => {
    expect(riddleExcerpt('Krátká hádanka?')).toBe('Krátká hádanka?');
    expect(riddleExcerpt('  a \n b   c  ', 80)).toBe('a b c');
    const long = 'x'.repeat(100);
    expect(riddleExcerpt(long, 80)).toHaveLength(80);
    expect(riddleExcerpt(long, 80).endsWith('…')).toBe(true);
  });
});
