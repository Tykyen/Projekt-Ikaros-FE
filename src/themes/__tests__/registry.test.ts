import { describe, it, expect } from 'vitest';
import { THEMES, DEFAULT_THEME, getTheme, listThemes } from '../registry';

describe('registry', () => {
  it('exports DEFAULT_THEME = modre-nebe', () => {
    expect(DEFAULT_THEME).toBe('modre-nebe');
  });

  it('THEMES contains modre-nebe entry', () => {
    expect(THEMES['modre-nebe']).toBeDefined();
    expect(THEMES['modre-nebe']!.id).toBe('modre-nebe');
  });

  it('getTheme returns the theme for valid id', () => {
    expect(getTheme('modre-nebe').id).toBe('modre-nebe');
  });

  it('getTheme falls back to DEFAULT_THEME for invalid id', () => {
    expect(getTheme('neexistuje').id).toBe(DEFAULT_THEME);
  });

  it('listThemes returns array of all themes', () => {
    const all = listThemes();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((t) => typeof t.id === 'string')).toBe(true);
  });

  it('listThemes filters by scope', () => {
    const both = listThemes('both');
    expect(both.every((t) => t.scope === 'both')).toBe(true);
  });

  it("listThemes('world') vrací motivy world + both (krok 5.0)", () => {
    const world = listThemes('world');
    expect(world.length).toBeGreaterThan(0);
    expect(world.every((t) => t.scope === 'world' || t.scope === 'both')).toBe(
      true,
    );
  });

  it('every theme has required CSS variables', () => {
    const required = [
      '--bg-primary', '--bg-secondary', '--bg-card', '--bg-card-hover',
      '--accent', '--accent-bright', '--accent-dim',
      '--text-primary', '--text-secondary', '--text-muted',
      '--border', '--border-strong',
      '--success', '--warning', '--danger', '--info',
    ];
    for (const theme of Object.values(THEMES)) {
      for (const key of required) {
        expect(theme.vars[key], `${theme.id} missing ${key}`).toBeDefined();
      }
    }
  });
});
