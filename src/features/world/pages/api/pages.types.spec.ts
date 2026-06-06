import { describe, it, expect } from 'vitest';
import { slugToTitle } from './pages.types';
import { slugify } from '../PageEditor/lib/slugify';

describe('slugToTitle', () => {
  it('pomlčky → mezery, první písmeno velké', () => {
    expect(slugToTitle('kralovna-vil')).toBe('Kralovna vil');
    expect(slugToTitle('hlavni-mesto-aralion')).toBe('Hlavni mesto aralion');
  });

  it('jednoslovný slug', () => {
    expect(slugToTitle('drak')).toBe('Drak');
  });

  it('prázdný / jen pomlčky → prázdný řetězec', () => {
    expect(slugToTitle('')).toBe('');
    expect(slugToTitle('---')).toBe('');
  });

  it('round-trip: slugify(slugToTitle(slug)) === slug', () => {
    for (const slug of ['kralovna-vil', 'drak', 'hlavni-mesto-aralion']) {
      expect(slugify(slugToTitle(slug))).toBe(slug);
    }
  });
});
