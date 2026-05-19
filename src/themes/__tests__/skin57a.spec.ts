import { describe, it, expect } from 'vitest';
import { THEMES, getTheme, listThemes } from '../registry';
import {
  GENRES,
  themeForGenre,
} from '@/features/ikaros/pages/CreateWorldPage/constants/genres';

/** Krok 5.7 — reforma vzhledů světa (infrastruktura 5.7a + žánrové skiny 5.7b+). */
describe('5.7 — theme registry po reformě', () => {
  it('21 platformových motivů (neměnné)', () => {
    expect(listThemes('platform')).toHaveLength(21);
  });

  it('world skiny: ikaros (výchozí) + žánrové', () => {
    const world = listThemes('world').map((t) => t.id);
    expect(world).toContain('ikaros');
    expect(world).toContain('fantasy');
    expect(world).toContain('dark-fantasy');
    expect(world).toContain('vesmir');
    expect(world).toContain('cyberpunk');
    expect(world).toContain('steampunk');
    expect(world).toContain('apokalypsa');
    expect(world).toContain('horor');
    expect(world).toContain('mystery');
    expect(world).toContain('historie');
    expect(world).toContain('moderni');
    expect(world).toContain('western');
    // 12 world skinů: ikaros + 11 žánrových.
    expect(world).toHaveLength(12);
  });

  it('THEMES = platform + world', () => {
    expect(Object.keys(THEMES)).toHaveLength(
      listThemes('platform').length + listThemes('world').length,
    );
  });

  it('world-only skiny z 5.0g (nereusnuté slugy) zůstaly smazané', () => {
    for (const id of ['heroic', 'grimdark', 'lovecraft', 'weird', 'psycho']) {
      expect(getTheme(id).id).not.toBe(id); // fallback, ne sám sebe
    }
  });

  it('skin ikaros — scope world, Matrix rain efekt, pozadí', () => {
    const t = getTheme('ikaros');
    expect(t.scope).toBe('world');
    expect(t.effect).toBe('matrix-rain');
    expect(t.background).toBeTruthy();
  });

  it('skin fantasy — scope world, pozadí, bez efektu', () => {
    const t = getTheme('fantasy');
    expect(t.id).toBe('fantasy');
    expect(t.scope).toBe('world');
    expect(t.background).toBeTruthy();
    expect(t.effect).toBeUndefined();
    expect(Object.keys(t.vars).length).toBeGreaterThan(20);
  });
});

describe('5.7 — wizard žánrů (11 + Vlastní)', () => {
  it('GENRES má 11 žánrů', () => {
    expect(GENRES).toHaveLength(11);
  });

  it('každý žánr míří na existující world skin', () => {
    for (const g of GENRES) {
      const t = getTheme(g.theme);
      expect(t.id).toBe(g.theme);
      expect(t.scope).toBe('world');
    }
  });

  it('themeForGenre — všech 11 žánrů 1:1 na vlastní skin, neznámý → ikaros', () => {
    expect(themeForGenre('Fantasy')).toBe('fantasy');
    expect(themeForGenre('Dark Fantasy')).toBe('dark-fantasy');
    expect(themeForGenre('Sci-Fi')).toBe('vesmir');
    expect(themeForGenre('Cyberpunk')).toBe('cyberpunk');
    expect(themeForGenre('Steampunk')).toBe('steampunk');
    expect(themeForGenre('Post-apokalypsa')).toBe('apokalypsa');
    expect(themeForGenre('Horor')).toBe('horor');
    expect(themeForGenre('Mystery')).toBe('mystery');
    expect(themeForGenre('Historický')).toBe('historie');
    expect(themeForGenre('Současnost')).toBe('moderni');
    expect(themeForGenre('Western')).toBe('western');
    expect(themeForGenre('Neznámý žánr')).toBe('ikaros');
    expect(themeForGenre(undefined)).toBe('ikaros');
  });
});
