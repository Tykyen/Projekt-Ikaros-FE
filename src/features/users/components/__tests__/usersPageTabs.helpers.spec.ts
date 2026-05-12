import { describe, expect, it } from 'vitest';
import { UserRole } from '@/shared/types';
import {
  defaultTabForRole,
  visibleTabsForRole,
} from '../usersPageTabs.helpers';

describe('visibleTabsForRole', () => {
  it('Admin: vidí všechny 4 taby', () => {
    expect(visibleTabsForRole(UserRole.Admin)).toEqual([
      'pratele',
      'uzivatele',
      'zpracovat',
      'audit',
    ]);
  });

  it('Superadmin: vidí všechny 4 taby', () => {
    expect(visibleTabsForRole(UserRole.Superadmin)).toEqual([
      'pratele',
      'uzivatele',
      'zpracovat',
      'audit',
    ]);
  });

  it('SpravceClanku: jen Přátelé + Zpracovat (skryté Uživatelé + Audit)', () => {
    expect(visibleTabsForRole(UserRole.SpravceClanku)).toEqual([
      'pratele',
      'zpracovat',
    ]);
  });

  it('SpravceGalerie: jen Přátelé + Zpracovat', () => {
    expect(visibleTabsForRole(UserRole.SpravceGalerie)).toEqual([
      'pratele',
      'zpracovat',
    ]);
  });

  it('SpravceDiskuzi: jen Přátelé + Zpracovat', () => {
    expect(visibleTabsForRole(UserRole.SpravceDiskuzi)).toEqual([
      'pratele',
      'zpracovat',
    ]);
  });

  it('PJ: jen Přátelé + Zpracovat', () => {
    expect(visibleTabsForRole(UserRole.PJ)).toEqual(['pratele', 'zpracovat']);
  });

  it('Hrac: jen Přátelé + Zpracovat', () => {
    expect(visibleTabsForRole(UserRole.Hrac)).toEqual(['pratele', 'zpracovat']);
  });

  it('undefined role (anon edge case): default jako Hrac', () => {
    expect(visibleTabsForRole(undefined)).toEqual(['pratele', 'zpracovat']);
  });
});

describe('defaultTabForRole', () => {
  it('Admin/Superadmin: default tab = Uživatelé (jejich primární use-case)', () => {
    expect(defaultTabForRole(UserRole.Admin)).toBe('uzivatele');
    expect(defaultTabForRole(UserRole.Superadmin)).toBe('uzivatele');
  });

  it('Spravce*/PJ/Hrac: default tab = Přátelé', () => {
    expect(defaultTabForRole(UserRole.SpravceClanku)).toBe('pratele');
    expect(defaultTabForRole(UserRole.SpravceGalerie)).toBe('pratele');
    expect(defaultTabForRole(UserRole.SpravceDiskuzi)).toBe('pratele');
    expect(defaultTabForRole(UserRole.PJ)).toBe('pratele');
    expect(defaultTabForRole(UserRole.Hrac)).toBe('pratele');
  });
});
