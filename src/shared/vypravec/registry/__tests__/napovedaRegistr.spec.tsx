/**
 * D-080a (07-migrace-napovedy §3–4) — pojistky dat nápovědy přesunutých
 * do registru Vypravěče: FAQ (faq.tsx) · toolbox (toolbox.tsx) ·
 * anonymní rozcestník (anonStart.ts). Kryje paritu obsahu po přesunu
 * a CI mrtvých odkazů `to` cest toolboxu (07 §3 „Postup").
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { ROUTES } from '@/app/routeRegistry';
import { FAQ_POLOZKY } from '../faq';
import { TOOLBOX_ITEMS, toolboxItemsFor } from '../toolbox';
import { ANON_START_KROKY } from '../anonStart';

describe('registr — FAQ_POLOZKY (D-080a §3)', () => {
  const KATEGORIE = ['ucet', 'komunita', 'svet', 'obecne'] as const;

  it('parita po přesunu: 39 položek ve 4 kategoriích, žádná prázdná', () => {
    expect(FAQ_POLOZKY.length).toBe(39);
    for (const kat of KATEGORIE)
      expect(
        FAQ_POLOZKY.filter((f) => f.cat === kat).length,
        `kategorie ${kat}`,
      ).toBeGreaterThan(0);
    for (const f of FAQ_POLOZKY) {
      expect(KATEGORIE).toContain(f.cat);
      expect(f.q.trim().length, f.q).toBeGreaterThan(0);
      expect(f.a, f.q).toBeTruthy();
    }
  });

  it('otázky jsou unikátní (žádná duplicitní položka po přesunu)', () => {
    const qs = FAQ_POLOZKY.map((f) => f.q);
    expect(new Set(qs).size).toBe(qs.length);
  });

  it('první odpověď (kontextová nápověda) zmiňuje Vypravěče', () => {
    const prvni = FAQ_POLOZKY[0];
    expect(prvni.q).toBe('Kde najdu nápovědu přímo ve světě?');
    render(<MemoryRouter>{prvni.a}</MemoryRouter>);
    expect(screen.getByText('Vypravěč')).toBeInTheDocument();
  });
});

describe('registr — TOOLBOX_ITEMS (D-080a §3)', () => {
  it('parita po přesunu: 14 dlaždic (8 sdílených + 6 PJ-only), unikátní klíče', () => {
    expect(TOOLBOX_ITEMS.length).toBe(14);
    const keys = TOOLBOX_ITEMS.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(toolboxItemsFor(true).length).toBe(14);
    expect(toolboxItemsFor(false).length).toBe(8);
  });

  it('toolboxItemsFor: hráč vidí jen položky s audience hrac', () => {
    for (const it_ of toolboxItemsFor(false))
      expect(it_.audience, it_.key).toContain('hrac');
    // PJ = nadmnožina (vidí vše)
    expect(toolboxItemsFor(true)).toEqual(TOOLBOX_ITEMS);
  });

  it('cesty `to` vedou na existující routy světa (CI mrtvých odkazů)', () => {
    const znameRouty = new Set<string>(ROUTES.map((r) => r.pattern));
    for (const it_ of TOOLBOX_ITEMS) {
      if (!it_.to) continue;
      expect(
        znameRouty.has(`/svet/:worldSlug/${it_.to}`),
        `dlaždice ${it_.key} → /svet/:worldSlug/${it_.to}`,
      ).toBe(true);
    }
  });
});

describe('registr — ANON_START_KROKY (D-080a §4)', () => {
  it('parita po přesunu: 3 kroky s přesnými texty z AnonStartPanel', () => {
    expect(ANON_START_KROKY).toEqual([
      {
        id: 'registrace',
        titulek: 'Zaregistruj se',
        popis: 'Zdarma, během chvilky',
      },
      {
        id: 'vesmiry',
        titulek: 'Vytvoř svůj svět',
        popis: 'Nebo se rozhlédni po vesmírech — jde to i bez účtu',
      },
      {
        id: 'vypravec',
        titulek: 'Pozvi přátele',
        popis: 'Nevíš kudy? Vypravěč tě provede — klepni sem',
      },
    ]);
  });
});
