import { describe, it, expect } from 'vitest';
import { resolveAkjTabPage, sortedAkjTabs } from './resolveAkjTab';
import type { Page, AkjTab } from '../../api/pages.types';

const basicPage = {
  id: 'p1',
  slug: 'kral',
  worldId: 'w1',
  type: 'NPC',
  title: 'Král',
  content: '<p>základní bio</p>',
  imageUrl: 'base.png',
  table: { hasTable: true, headers: ['Stav'], values: ['živý'] },
  sections: [],
  galleryImages: [],
  videos: [],
  menu: [],
  plainText: '',
  isWoodWide: false,
  accessRequirements: [],
  order: 0,
  createdAt: '',
  updatedAt: '',
} as unknown as Page;

describe('resolveAkjTabPage', () => {
  it('dědí všechna pole když contentOverride chybí', () => {
    const tab: AkjTab = {
      id: 't1',
      name: 'Dvůr',
      order: 0,
      access: [{ type: 'AKJ', value: '3' }],
    };
    const merged = resolveAkjTabPage(basicPage, tab);
    expect(merged.content).toBe('<p>základní bio</p>');
    expect(merged.imageUrl).toBe('base.png');
    expect(merged.table).toEqual(basicPage.table);
    // accessRequirements = tab.access (kvůli AkjBanner)
    expect(merged.accessRequirements).toEqual([{ type: 'AKJ', value: '3' }]);
    // žádné vnořené záložky
    expect(merged.akjTabs).toBeUndefined();
  });

  it('přepíše jen vyplněná pole, zbytek dědí', () => {
    const tab: AkjTab = {
      id: 't2',
      name: 'Královna',
      order: 1,
      access: [{ type: 'AKJ', value: '5' }],
      contentOverride: {
        content: '<p>tajné odhalení</p>',
        imageUrl: 'secret.png',
      },
    };
    const merged = resolveAkjTabPage(basicPage, tab);
    expect(merged.content).toBe('<p>tajné odhalení</p>');
    expect(merged.imageUrl).toBe('secret.png');
    // table nebyla v override → dědí ze základu
    expect(merged.table).toEqual(basicPage.table);
  });

  it('prázdná override pole dědí ze základu (ne přepíše prázdnem)', () => {
    const tab: AkjTab = {
      id: 't3',
      name: 'Prázdná',
      order: 2,
      access: [],
      contentOverride: {
        imageUrl: '',
        content: '<p></p>',
        table: { hasTable: false, headers: [], values: [] },
      },
    };
    const merged = resolveAkjTabPage(basicPage, tab);
    expect(merged.imageUrl).toBe('base.png');
    expect(merged.content).toBe('<p>základní bio</p>');
    expect(merged.table).toEqual(basicPage.table);
  });
});

describe('sortedAkjTabs', () => {
  it('řadí dle order a nemutuje původní pole', () => {
    const page = {
      ...basicPage,
      akjTabs: [
        { id: 'b', name: 'B', order: 2, access: [] },
        { id: 'a', name: 'A', order: 0, access: [] },
        { id: 'c', name: 'C', order: 1, access: [] },
      ],
    } as Page;
    const sorted = sortedAkjTabs(page);
    expect(sorted.map((t) => t.id)).toEqual(['a', 'c', 'b']);
    expect(page.akjTabs![0].id).toBe('b'); // originál netknutý
  });

  it('prázdné když akjTabs chybí', () => {
    expect(sortedAkjTabs(basicPage)).toEqual([]);
  });
});
