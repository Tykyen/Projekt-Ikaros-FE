import { describe, it, expect } from 'vitest';
import { applyFilters, hasActiveFilters } from './applyFilters';
import { EMPTY_FILTERS } from '../components/SoundFiltersBar';
import type { Sound } from '../types';

function make(overrides: Partial<Sound>): Sound {
  return {
    id: 'x',
    worldId: 'w1',
    name: 'Test',
    youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
    mediaType: 'music',
    primaryFunction: 'safe',
    environment: 'neutral',
    emotionalTone: 'calm',
    intensity: 1,
    duration: 0,
    loop: true,
    onsetProfile: 'soft',
    outroProfile: 'fade',
    factionStyle: 'civilian',
    techLevel: 'modern',
    magicLevel: 'none',
    combatEnergy: 'none',
    tags: [],
    notes: '',
    status: 'active',
    proposedBy: null,
    proposedByWorldId: null,
    rejectReason: null,
    createdBy: 'u1',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('applyFilters', () => {
  const list = [
    make({ id: '1', name: 'Bitva u brány', mediaType: 'music', intensity: 5 }),
    make({ id: '2', name: 'Klidný les', mediaType: 'ambient', environment: 'nature', intensity: 2 }),
    make({ id: '3', name: 'Tržiště', tags: ['město', 'dav'], intensity: 3 }),
  ];

  it('bez filtru vrací vše', () => {
    expect(applyFilters(list, EMPTY_FILTERS)).toHaveLength(3);
  });

  it('search hledá v názvu', () => {
    const r = applyFilters(list, { ...EMPTY_FILTERS, search: 'bitva' });
    expect(r.map((s) => s.id)).toEqual(['1']);
  });

  it('search hledá ve štítcích', () => {
    const r = applyFilters(list, { ...EMPTY_FILTERS, search: 'dav' });
    expect(r.map((s) => s.id)).toEqual(['3']);
  });

  it('filtr mediaType', () => {
    const r = applyFilters(list, { ...EMPTY_FILTERS, mediaType: 'ambient' });
    expect(r.map((s) => s.id)).toEqual(['2']);
  });

  it('intensita = minimální práh', () => {
    const r = applyFilters(list, { ...EMPTY_FILTERS, intensity: 3 });
    expect(r.map((s) => s.id).sort()).toEqual(['1', '3']);
  });

  it('kombinace filtrů (AND)', () => {
    const r = applyFilters(list, {
      ...EMPTY_FILTERS,
      mediaType: 'ambient',
      environment: 'nature',
    });
    expect(r.map((s) => s.id)).toEqual(['2']);
  });
});

describe('hasActiveFilters', () => {
  it('false pro prázdné', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });
  it('false jen pro search', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, search: 'x' })).toBe(false);
  });
  it('true pro metadatový filtr', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, mediaType: 'music' })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, intensity: 2 })).toBe(true);
  });
});
