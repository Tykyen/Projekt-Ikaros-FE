import { describe, it, expect } from 'vitest';
import {
  getVisibleTabs,
  isAllVisible,
  defaultCharacterTabVisibility,
} from './characterTabVisibility';
import { CHARACTER_TAB_IDS, type WorldSettings } from '@/shared/types';

const baseSettings: WorldSettings = {
  id: 's1',
  worldId: 'w1',
  hiddenNavItems: [],
  customGroups: [],
  groupColors: {},
  akjTypes: [],
  hideDefaultWeather: false,
  timelineCalendarSlug: null,
  updatedAt: '',
};

describe('getVisibleTabs', () => {
  it('vrací všechny taby, když settings je undefined', () => {
    const result = getVisibleTabs('Postava hráče', undefined);
    expect(result.size).toBe(CHARACTER_TAB_IDS.length);
    CHARACTER_TAB_IDS.forEach((id) => expect(result.has(id)).toBe(true));
  });

  it('vrací všechny taby, když characterTabVisibility chybí', () => {
    const result = getVisibleTabs('Postava hráče', baseSettings);
    expect(result.size).toBe(CHARACTER_TAB_IDS.length);
  });

  it('respektuje override pro Postavu hráče', () => {
    const result = getVisibleTabs('Postava hráče', {
      ...baseSettings,
      characterTabVisibility: {
        PostavaHrace: ['denik', 'finance'],
        NPC: [...CHARACTER_TAB_IDS],
      },
    });
    expect(result.has('denik')).toBe(true);
    expect(result.has('finance')).toBe(true);
    expect(result.has('poznamky')).toBe(false);
  });

  it('respektuje override pro NPC', () => {
    const result = getVisibleTabs('NPC', {
      ...baseSettings,
      characterTabVisibility: {
        PostavaHrace: [...CHARACTER_TAB_IDS],
        NPC: ['kalendar'],
      },
    });
    expect(result.size).toBe(1);
    expect(result.has('kalendar')).toBe(true);
  });

  it('prázdný list = jen Profil viditelný (Set je prázdný)', () => {
    const result = getVisibleTabs('NPC', {
      ...baseSettings,
      characterTabVisibility: {
        PostavaHrace: [...CHARACTER_TAB_IDS],
        NPC: [],
      },
    });
    expect(result.size).toBe(0);
  });

  it('jiný page.type než PC/NPC → no-op (vrátí vše)', () => {
    const result = getVisibleTabs('Lokace', {
      ...baseSettings,
      characterTabVisibility: {
        PostavaHrace: ['denik'],
        NPC: ['denik'],
      },
    });
    expect(result.size).toBe(CHARACTER_TAB_IDS.length);
  });
});

describe('isAllVisible', () => {
  it('undefined → true (default = vše)', () => {
    expect(isAllVisible(undefined)).toBe(true);
  });

  it('plný list → true', () => {
    expect(isAllVisible([...CHARACTER_TAB_IDS])).toBe(true);
  });

  it('chybí jeden → false', () => {
    expect(isAllVisible(['denik', 'finance'])).toBe(false);
  });

  it('prázdný list → false', () => {
    expect(isAllVisible([])).toBe(false);
  });
});

describe('defaultCharacterTabVisibility', () => {
  it('vrací nový objekt s plnými listy pro PC i NPC', () => {
    const def = defaultCharacterTabVisibility();
    expect(def.PostavaHrace).toEqual([...CHARACTER_TAB_IDS]);
    expect(def.NPC).toEqual([...CHARACTER_TAB_IDS]);
    // Reference nesmí být sdílená — jinak by editace mutovala globální konstantu.
    expect(def.PostavaHrace).not.toBe(CHARACTER_TAB_IDS);
  });
});
