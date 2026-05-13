import { describe, expect, it } from 'vitest';
import { UserRole } from '@/shared/types';
import {
  defaultTabForRole,
  visibleTabsForRole,
} from '../usersPageTabs.helpers';

describe('visibleTabsForRole', () => {
  it('Admin: vidí všech 5 tabů (vč. Audit + Friendship debug)', () => {
    expect(visibleTabsForRole(UserRole.Admin)).toEqual([
      'pratele',
      'uzivatele',
      'zpracovat',
      'audit',
      'friendship-debug',
    ]);
  });

  it('Superadmin: vidí všech 5 tabů (vč. Audit + Friendship debug)', () => {
    expect(visibleTabsForRole(UserRole.Superadmin)).toEqual([
      'pratele',
      'uzivatele',
      'zpracovat',
      'audit',
      'friendship-debug',
    ]);
  });

  it('Ikarus: Přátelé + Uživatelé + Zpracovat (Audit skryt)', () => {
    expect(visibleTabsForRole(UserRole.Ikarus)).toEqual([
      'pratele',
      'uzivatele',
      'zpracovat',
    ]);
  });

  it('SpravceClanku: Přátelé + Uživatelé + Zpracovat', () => {
    expect(visibleTabsForRole(UserRole.SpravceClanku)).toEqual([
      'pratele',
      'uzivatele',
      'zpracovat',
    ]);
  });

  it('SpravceGalerie: Přátelé + Uživatelé + Zpracovat', () => {
    expect(visibleTabsForRole(UserRole.SpravceGalerie)).toEqual([
      'pratele',
      'uzivatele',
      'zpracovat',
    ]);
  });

  it('SpravceDiskuzi: Přátelé + Uživatelé + Zpracovat', () => {
    expect(visibleTabsForRole(UserRole.SpravceDiskuzi)).toEqual([
      'pratele',
      'uzivatele',
      'zpracovat',
    ]);
  });

  it('undefined role (anon edge case): default jako Ikarus', () => {
    expect(visibleTabsForRole(undefined)).toEqual([
      'pratele',
      'uzivatele',
      'zpracovat',
    ]);
  });
});

describe('defaultTabForRole', () => {
  it('všichni: default tab = Uživatelé (přehled adresáře jako vstupní brána)', () => {
    expect(defaultTabForRole(UserRole.Admin)).toBe('uzivatele');
    expect(defaultTabForRole(UserRole.Superadmin)).toBe('uzivatele');
    expect(defaultTabForRole(UserRole.Ikarus)).toBe('uzivatele');
    expect(defaultTabForRole(UserRole.SpravceClanku)).toBe('uzivatele');
    expect(defaultTabForRole(UserRole.SpravceGalerie)).toBe('uzivatele');
    expect(defaultTabForRole(UserRole.SpravceDiskuzi)).toBe('uzivatele');
    expect(defaultTabForRole(undefined)).toBe('uzivatele');
  });
});
