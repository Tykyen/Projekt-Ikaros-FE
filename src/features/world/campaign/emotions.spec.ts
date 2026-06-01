import { describe, it, expect } from 'vitest';
import {
  EMOTIONS_ORG,
  EMOTIONS_PERSON,
  clampValence,
  defaultValenceFor,
  emotionsFor,
} from './emotions';

describe('emotionsFor — type-aware paleta', () => {
  it('osoba × osoba → paleta osob', () => {
    expect(emotionsFor('PC', 'NPC')).toBe(EMOTIONS_PERSON);
  });

  it('organizace × stát → paleta organizací', () => {
    expect(emotionsFor('ORG', 'STATE')).toBe(EMOTIONS_ORG);
    expect(emotionsFor('FACTION', 'ORG')).toBe(EMOTIONS_ORG);
  });

  it('smíšený pár → sloučená paleta (osoby + org + misc, deduplikováno)', () => {
    const tags = emotionsFor('PC', 'STATE').map((o) => o.tag);
    expect(tags).toContain('láska'); // z osob
    expect(tags).toContain('spojenectví'); // z org
    expect(tags).toContain('domov'); // z misc
    // žádný duplikát
    expect(new Set(tags).size).toBe(tags.length);
  });
});

describe('valence helpers', () => {
  it('defaultValenceFor mapuje tag na valenci', () => {
    expect(defaultValenceFor('láska')).toBe(3);
    expect(defaultValenceFor('válka')).toBe(-3);
    expect(defaultValenceFor('neutralita')).toBe(0);
  });

  it('defaultValenceFor pro neznámý/prázdný tag → 0', () => {
    expect(defaultValenceFor('xyz')).toBe(0);
    expect(defaultValenceFor(undefined)).toBe(0);
  });

  it('clampValence drží rozsah −3..+3 a zaokrouhluje', () => {
    expect(clampValence(5)).toBe(3);
    expect(clampValence(-9)).toBe(-3);
    expect(clampValence(1.4)).toBe(1);
    expect(clampValence(Number.NaN)).toBe(0);
    expect(clampValence(undefined)).toBe(0);
  });
});
