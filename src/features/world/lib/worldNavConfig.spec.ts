import { describe, it, expect } from 'vitest';
import { isNavItemHidden, HIDEABLE_NAV_IDS } from './worldNavConfig';

describe('worldNavConfig', () => {
  it('HIDEABLE_NAV_IDS obsahuje očekávané volitelné položky', () => {
    expect(HIDEABLE_NAV_IDS.has('timeline')).toBe(true);
    expect(HIDEABLE_NAV_IDS.has('mapa')).toBe(true);
    expect(HIDEABLE_NAV_IDS.has('pavucina')).toBe(true);
    expect(HIDEABLE_NAV_IDS.has('kalendar')).toBe(true);
  });

  it('esenciál NENÍ v HIDEABLE_NAV_IDS (defense-in-depth)', () => {
    expect(HIDEABLE_NAV_IDS.has('stranky')).toBe(false);
    expect(HIDEABLE_NAV_IDS.has('novinky')).toBe(false);
    expect(HIDEABLE_NAV_IDS.has('pravidla')).toBe(false);
    expect(HIDEABLE_NAV_IDS.has('')).toBe(false); // Přehled (index)
  });

  describe('isNavItemHidden', () => {
    it('vrátí true pro volitelný item v hiddenNavItems', () => {
      expect(isNavItemHidden('timeline', ['timeline'])).toBe(true);
      expect(isNavItemHidden('mapa', ['mapa', 'timeline'])).toBe(true);
    });

    it('vrátí false pro volitelný item mimo hiddenNavItems', () => {
      expect(isNavItemHidden('timeline', ['mapa'])).toBe(false);
      expect(isNavItemHidden('timeline', [])).toBe(false);
      expect(isNavItemHidden('timeline', undefined)).toBe(false);
    });

    it('vrátí false pro esenciální item I KDYŽ je v hiddenNavItems (defense)', () => {
      expect(isNavItemHidden('stranky', ['stranky'])).toBe(false);
      expect(isNavItemHidden('novinky', ['novinky'])).toBe(false);
    });

    it('vrátí false pro undefined id', () => {
      expect(isNavItemHidden(undefined, ['timeline'])).toBe(false);
    });
  });
});
