import { describe, it, expect } from 'vitest';
import type { HeadlineNode } from '@/shared/types';
import { WorldRole } from '@/shared/types';
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

  it('Skupiny + Pravidla esenciální (bez id), referenční stránky skrývatelné', () => {
    const nav = buildWorldNav('a', true);
    const info = nav.find((g) => g.label === 'Informace')!;
    const byLabel = (l: string) => info.items!.find((i) => i.label === l)!;
    expect(byLabel('Skupiny').id).toBeUndefined();
    expect(byLabel('Pravidla').id).toBeUndefined();
    expect(byLabel('Magický systém').id).toBe('magicky-system');
    expect(byLabel('Technologie').id).toBe('technologie');
  });

  it('„Informace" = Skupiny + Pravidla + Magický systém + Technologie (bez Přehled/Novinky)', () => {
    const nav = buildWorldNav('a', true, ['Lumíci', 'Evropani']);
    const info = nav.find((g) => g.label === 'Informace')!;
    const labels = info.items!.map((i) => i.label);
    expect(labels).toEqual([
      'Skupiny',
      'Pravidla',
      'Magický systém',
      'Technologie',
    ]);
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

describe('buildWorldNav — role gating položek (N-04/05)', () => {
  const allIds = (nav: ReturnType<typeof buildWorldNav>) =>
    nav.flatMap((g) => (g.items ? g.items.map((i) => i.id) : [g.id]));

  it('default (canAccess ukaž vše) → timeline/pocasi/kalendar přítomné', () => {
    const ids = allIds(buildWorldNav('a', false));
    expect(ids).toContain('timeline');
    expect(ids).toContain('pocasi');
    expect(ids).toContain('kalendar');
  });

  it('Čtenář (< Hrac) → timeline/pocasi/kalendar skryté, mapa (Ctenar) zůstává', () => {
    const ids = allIds(
      buildWorldNav('a', false, [], (min) => WorldRole.Ctenar >= min),
    );
    expect(ids).not.toContain('timeline');
    expect(ids).not.toContain('pocasi');
    expect(ids).not.toContain('kalendar');
    expect(ids).toContain('mapa');
  });

  it('Hráč (Hrac, ne PomocnyPJ) → timeline/pocasi ano, kalendar ne', () => {
    const ids = allIds(
      buildWorldNav('a', false, [], (min) => WorldRole.Hrac >= min),
    );
    expect(ids).toContain('timeline');
    expect(ids).toContain('pocasi');
    expect(ids).not.toContain('kalendar');
  });
});

describe('filterNavByHidden', () => {
  it('skryje položku a vyřadí prázdnou skupinu', () => {
    const nav = buildWorldNav('a', false);
    // skryj vše ve skupině Svět kromě esenciální Stránky → skupina zůstane (Stránky)
    const out = filterNavByHidden(nav, [
      'timeline',
      'mapa',
      'mapy',
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

  it('skryje referenční stránku Informace, esenciály zůstanou', () => {
    const out = filterNavByHidden(buildWorldNav('a', false), ['technologie']);
    const info = out.find((g) => g.label === 'Informace')!;
    const labels = info.items!.map((i) => i.label);
    expect(labels).not.toContain('Technologie');
    expect(labels).toContain('Magický systém');
    expect(labels).toContain('Pravidla'); // esenciál nelze skrýt
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
