import { describe, expect, it } from 'vitest';
import { UserRole } from '@/shared/types';
import {
  defaultTabForRole,
  visibleTabsForRole,
} from '../usersPageTabs.helpers';

const ALL_ROLES = [
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.Ikarus,
  UserRole.SpravceClanku,
  UserRole.SpravceGalerie,
  UserRole.SpravceDiskuzi,
  undefined,
];

describe('visibleTabsForRole (12.1 — zúženo na komunitní taby)', () => {
  it('každá role vidí 3 komunitní taby: Přátelé / Uživatelé / Zpracovat', () => {
    for (const role of ALL_ROLES) {
      const tabs = visibleTabsForRole(role);
      expect(tabs).toContain('pratele');
      expect(tabs).toContain('uzivatele');
      expect(tabs).toContain('zpracovat');
    }
  });

  it('Audit log už NENÍ na /ikaros/uzivatele (přesun pod /admin)', () => {
    for (const role of ALL_ROLES) {
      expect(visibleTabsForRole(role)).not.toContain('audit');
    }
  });

  it('friendship-debug už NENÍ na /ikaros/uzivatele (přesun pod /admin)', () => {
    for (const role of ALL_ROLES) {
      expect(visibleTabsForRole(role)).not.toContain('friendship-debug');
    }
  });

  it('všechny role vidí přesně 3 taby', () => {
    for (const role of ALL_ROLES) {
      expect(visibleTabsForRole(role)).toHaveLength(3);
    }
  });
});

describe('defaultTabForRole', () => {
  it('všichni: default tab = Uživatelé', () => {
    for (const role of ALL_ROLES) {
      expect(defaultTabForRole(role)).toBe('uzivatele');
    }
  });
});
