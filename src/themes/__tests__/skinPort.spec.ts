import { describe, it, expect } from 'vitest';
import { THEMES, getTheme, listThemes } from '../registry';
import {
  GENRES,
  themeForGenre,
} from '@/features/ikaros/pages/CreateWorldPage/constants/genres';

/** 16 žánrových skinů portovaných v kroku 5.0g. */
const PORTED_SKINS = [
  'fantasy',
  'heroic',
  'urban-fantasy',
  'soft-sci-fi',
  'biopunk',
  'post-postapo',
  'dystopie',
  'military',
  'psycho',
  'lovecraft',
  'thriller',
  'alt-historie',
  'steampunk',
  'dieselpunk',
  'weird',
  'grimdark',
] as const;

describe('5.0g — port žánrových skinů', () => {
  it('registry má 37 motivů (21 + 16)', () => {
    expect(Object.keys(THEMES)).toHaveLength(37);
  });

  it('všech 16 nových skinů je registrováno (getTheme nevrací fallback)', () => {
    for (const id of PORTED_SKINS) {
      expect(getTheme(id).id).toBe(id);
    }
  });

  it('nové skiny mají scope „world" a jsou v listThemes(world)', () => {
    const worldIds = listThemes('world').map((t) => t.id);
    for (const id of PORTED_SKINS) {
      expect(getTheme(id).scope).toBe('world');
      expect(worldIds).toContain(id);
    }
  });

  it('každý nový skin má neprázdnou vars sadu, název a pozadí', () => {
    for (const id of PORTED_SKINS) {
      const t = getTheme(id);
      expect(t.name.length).toBeGreaterThan(0);
      expect(Object.keys(t.vars).length).toBeGreaterThan(20);
      expect(t.background).toBeTruthy();
      expect(t.thumbnail).toBeTruthy();
    }
  });
});

describe('5.0g — themeForGenre 1:1 (žádné sdílení)', () => {
  it('každý žánr mapuje na motiv, který v registry existuje', () => {
    for (const g of GENRES) {
      expect(getTheme(g.theme).id).toBe(g.theme);
    }
  });

  const cases: [string, string][] = [
    ['Fantasy', 'fantasy'],
    ['Heroic fantasy', 'heroic'],
    ['Urban fantasy', 'urban-fantasy'],
    ['Soft sci-fi', 'soft-sci-fi'],
    ['Biopunk', 'biopunk'],
    ['Post-postapo', 'post-postapo'],
    ['Dystopie', 'dystopie'],
    ['Military', 'military'],
    ['Psychologický horor', 'psycho'],
    ['Lovecraftovský / kosmický horor', 'lovecraft'],
    ['Thriller', 'thriller'],
    ['Alternativní historie', 'alt-historie'],
    ['Steampunk', 'steampunk'],
    ['Dieselpunk', 'dieselpunk'],
    ['Weird fiction', 'weird'],
    ['Grimdark', 'grimdark'],
  ];

  it.each(cases)('žánr „%s" → skin „%s"', (genre, skin) => {
    expect(themeForGenre(genre)).toBe(skin);
  });
});
