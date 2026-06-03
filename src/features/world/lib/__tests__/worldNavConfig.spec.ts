import { describe, it, expect } from 'vitest';
import type { HeadlineNode } from '@/shared/types';
import {
  buildWorldNav,
  filterNavByHidden,
  buildFullWorldNav,
  isNavItemHidden,
} from '../worldNavConfig';

describe('buildWorldNav', () => {
  it('PJ-only položky jen pro isPJ', () => {
    const pj = buildWorldNav('a', true);
    const hra = pj.find((g) => g.label === 'Hra')!;
    const ids = hra.items!.map((i) => i.id);
    expect(ids).toContain('denik-pj');
    expect(ids).toContain('scenare');

    const player = buildWorldNav('a', false);
    const hraP = player.find((g) => g.label === 'Hra')!;
    const idsP = hraP.items!.map((i) => i.id);
    expect(idsP).not.toContain('denik-pj');
    expect(idsP).not.toContain('scenare');
  });

  it('esenciály nemají id → nelze skrýt', () => {
    const nav = buildWorldNav('a', true);
    const info = nav.find((g) => g.label === 'Informace')!;
    expect(info.items!.every((i) => i.id === undefined)).toBe(true);
  });

  it('„Informace" = rozbalovací Skupiny + Pravidla (bez Přehled/Novinky)', () => {
    const nav = buildWorldNav('a', true, ['Lumíci', 'Evropani']);
    const info = nav.find((g) => g.label === 'Informace')!;
    const labels = info.items!.map((i) => i.label);
    expect(labels).toEqual(['Skupiny', 'Pravidla']);
    expect(labels).not.toContain('Přehled');
    expect(labels).not.toContain('Novinky');

    const skupiny = info.items!.find((i) => i.label === 'Skupiny')!;
    expect(skupiny.to).toBeUndefined();
    expect(skupiny.children!.map((c) => c.label)).toEqual([
      'Lumíci',
      'Evropani',
      'Nezařazení',
    ]);
    expect(skupiny.children![0]!.to).toBe('/svet/a/skupina/Lum%C3%ADci');
  });
});

describe('filterNavByHidden', () => {
  it('skryje položku a vyřadí prázdnou skupinu', () => {
    const nav = buildWorldNav('a', false);
    // skryj vše ve skupině Svět kromě esenciální Stránky → skupina zůstane (Stránky)
    const out = filterNavByHidden(nav, [
      'timeline',
      'mapa',
      'pavucina',
      'obchod',
    ]);
    const svet = out.find((g) => g.label === 'Svět')!;
    expect(svet.items!.map((i) => i.label)).toEqual(['Stránky']);
  });

  it('skryje top-level Kalendář', () => {
    const out = filterNavByHidden(buildWorldNav('a', false), ['kalendar']);
    expect(out.find((g) => g.label === 'Kalendář')).toBeUndefined();
  });

  it('esenciál bez id se nikdy neskryje', () => {
    expect(isNavItemHidden(undefined, ['x'])).toBe(false);
  });
});

describe('buildFullWorldNav', () => {
  it('připojí vlastní navigaci ZA systémovou', () => {
    const custom: HeadlineNode[] = [
      { id: 'c1', label: 'Moje', isGroup: false, to: '/svet/a/x' },
    ];
    const full = buildFullWorldNav('a', false, [], custom);
    expect(full[full.length - 1]).toEqual({
      id: 'custom:c1',
      label: 'Moje',
      to: '/svet/a/x',
    });
    // systémové skupiny stále na začátku
    expect(full[0]!.label).toBe('Informace');
  });

  it('bez custom headline = jen systémová nav', () => {
    const full = buildFullWorldNav('a', false, [], []);
    const sys = filterNavByHidden(buildWorldNav('a', false), []);
    expect(full).toHaveLength(sys.length);
  });
});
