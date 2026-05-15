import { describe, it, expect } from 'vitest';
import {
  readingTime,
  glyphFor,
  articleNumber,
  categoryByKey,
  categoryStyle,
  formatDateCs,
  stripHtml,
  statusLabel,
  statusColor,
} from './articles';
import type { ArticleCategory } from '@/shared/types';

describe('articles lib', () => {
  describe('readingTime', () => {
    it('prázdný HTML → min 1 min', () => {
      expect(readingTime('')).toBe(1);
    });
    it('200 slov → 1 min', () => {
      const html = '<p>' + 'word '.repeat(200) + '</p>';
      expect(readingTime(html)).toBe(1);
    });
    it('400 slov → 2 min', () => {
      const html = '<p>' + 'word '.repeat(400) + '</p>';
      expect(readingTime(html)).toBe(2);
    });
  });

  describe('glyphFor', () => {
    it('deterministic per ID', () => {
      const g1 = glyphFor('aaaa');
      const g2 = glyphFor('aaaa');
      expect(g1).toBe(g2);
    });
    it('různé IDs → různé glyphs (s vysokou pravděpodobností)', () => {
      const glyphs = new Set([
        glyphFor('a'),
        glyphFor('b'),
        glyphFor('c'),
        glyphFor('d'),
        glyphFor('e'),
        glyphFor('f'),
      ]);
      expect(glyphs.size).toBeGreaterThanOrEqual(2);
    });
    it('vždy z palety ✦ ❦ ❧ ☙', () => {
      const allowed = new Set(['✦', '❦', '❧', '☙']);
      expect(allowed.has(glyphFor('test'))).toBe(true);
    });
  });

  describe('articleNumber', () => {
    it('posledních 4 znaky, uppercase', () => {
      expect(articleNumber('507f1f77bcf86cd799439abc')).toBe('9ABC');
    });
    it('krátké ID → uppercase celé', () => {
      expect(articleNumber('abc')).toBe('ABC');
    });
  });

  describe('categoryByKey', () => {
    const cats: ArticleCategory[] = [
      { key: 'povidky', label: 'Povídky', color: '#64b5f6', order: 0 },
      { key: 'ostatni', label: 'Ostatní', color: '#8b98a5', order: 5 },
    ];

    it('existující key → odpovídající kategorie', () => {
      expect(categoryByKey(cats, 'povidky').label).toBe('Povídky');
    });
    it('neexistující key → fallback ostatni', () => {
      expect(categoryByKey(cats, 'zzz').key).toBe('ostatni');
    });
    it('prázdné categories → hardcoded fallback', () => {
      expect(categoryByKey([], 'cokoliv').key).toBe('ostatni');
    });
  });

  describe('categoryStyle', () => {
    it('undefined → prázdný objekt', () => {
      expect(categoryStyle(undefined)).toEqual({});
    });
    it('s kategorií → --cat-current CSS var', () => {
      const style = categoryStyle({
        key: 'povidky',
        label: 'Povídky',
        color: '#64b5f6',
        order: 0,
      });
      expect((style as Record<string, string>)['--cat-current']).toBe('#64b5f6');
    });
  });

  describe('formatDateCs', () => {
    it('vrací CS locale string', () => {
      const out = formatDateCs('2026-11-12T10:00:00.000Z');
      // Pozn.: locale závisí na CI; test je strukturální (obsahuje rok)
      expect(out).toMatch(/2026/);
    });
  });

  describe('stripHtml', () => {
    it('odstraní tagy', () => {
      expect(stripHtml('<p><strong>Bold</strong> text</p>')).toBe('Bold text');
    });
    it('decoduje entities', () => {
      expect(stripHtml('&quot;Hello&quot;')).toBe('"Hello"');
    });
    it('maxLen ořeže', () => {
      expect(stripHtml('<p>abcdefghij</p>', 5)).toBe('abcde');
    });
    it('collapsuje whitespace', () => {
      expect(stripHtml('<p>a\n\n  b</p>')).toBe('a b');
    });
  });

  describe('statusLabel + statusColor', () => {
    it('všechny status labels CZ', () => {
      expect(statusLabel('Draft')).toBe('Koncept');
      expect(statusLabel('Pending')).toBe('Čeká na schválení');
      expect(statusLabel('Published')).toBe('Publikováno');
      expect(statusLabel('Rejected')).toBe('Zamítnuto');
    });
    it('všechny status colors jako CSS var', () => {
      expect(statusColor('Draft')).toMatch(/^var\(/);
      expect(statusColor('Published')).toMatch(/^var\(/);
    });
  });
});
