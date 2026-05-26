/**
 * 9.4-I — Unit testy pro fuzzy filter.
 *
 * Cíl: zaručit, že prázdný query vrátí všechny presety, nonempty vrátí
 * jen ty s match, a že pořadí je deterministické (skóre + sortKey tie-break).
 */
import { describe, it, expect } from 'vitest';
import { fuzzyFilter } from './fuzzySearch';
import type { PresetItem } from './types';
import type { WeatherGeneratorConfig } from '@/shared/types';

function mockItem(
  id: string,
  displayName: string,
  searchCorpus: string,
): PresetItem {
  return {
    id,
    category: 'countries',
    displayName,
    subtitle: '',
    glyph: '🌍',
    description: '',
    metrics: { tempLabel: '0/20 °C' },
    sortKey: id,
    searchCorpus,
    toConfig: () => ({}) as WeatherGeneratorConfig,
    defaultGeneratorName: displayName,
  };
}

const ITEMS: PresetItem[] = [
  mockItem('praha', 'Česko — Praha', 'praha česko evropa'),
  mockItem('brno', 'Česko — Brno', 'brno česko evropa'),
  mockItem('mars', 'Mars: Gale Crater', 'mars gale crater'),
  mockItem('vostok', 'Vostok — Antarktida', 'vostok antarktida'),
  mockItem('forest', 'Mlžné lesy', 'mlzne lesy fantasy'),
];

describe('fuzzyFilter', () => {
  it('prázdný query → vrátí všechny items v původním pořadí', () => {
    const result = fuzzyFilter(ITEMS, '');
    expect(result).toHaveLength(ITEMS.length);
    expect(result[0].id).toBe('praha');
  });

  it('exact match → najde a vrátí jen relevant', () => {
    const result = fuzzyFilter(ITEMS, 'praha');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe('praha');
  });

  it('partial match (substring) → vrátí item', () => {
    const result = fuzzyFilter(ITEMS, 'mar');
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((r) => r.id === 'mars')).toBe(true);
  });

  it('case-insensitive', () => {
    const upper = fuzzyFilter(ITEMS, 'PRAHA');
    const lower = fuzzyFilter(ITEMS, 'praha');
    expect(upper).toHaveLength(lower.length);
    expect(upper[0].id).toBe('praha');
  });

  it('no match → vrátí prázdné pole', () => {
    const result = fuzzyFilter(ITEMS, 'xyzzyx');
    expect(result).toEqual([]);
  });

  it('multi-term query — všechny termy musí být v korpusu', () => {
    const result = fuzzyFilter(ITEMS, 'praha česko');
    expect(result[0].id).toBe('praha');
    expect(result.some((r) => r.id === 'mars')).toBe(false);
  });

  it('word-start match dostane vyšší score než mid-word match', () => {
    const items = [
      mockItem('a', 'Druhotně les', 'druhotne les'), // 'les' uvnitř
      mockItem('b', 'Lesní stezka', 'lesni stezka'), // 'les' na začátku
    ];
    const result = fuzzyFilter(items, 'les');
    expect(result[0].id).toBe('b'); // word-start wins
  });
});
