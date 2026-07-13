import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import PlatformAdminPage from '../PlatformAdminPage';

// Těžké taby mockujeme — testujeme jen logiku hubu (default tab, přepínání, URL).
vi.mock('../../components/OverviewTab/OverviewTab', () => ({
  OverviewTab: () => <div>PŘEHLED PANEL</div>,
}));
vi.mock('../../components/UsersAdminTab/UsersAdminTab', () => ({
  UsersAdminTab: () => <div>UŽIVATELÉ PANEL</div>,
}));
vi.mock('../../users/components/AuditLogTab/AuditLogTab', () => ({
  AuditLogTab: () => <div>AUDIT PANEL</div>,
}));
vi.mock(
  '@/features/users/components/tabs/FriendshipDebugTab/FriendshipDebugTab',
  () => ({
    FriendshipDebugTab: () => <div>DEBUG PANEL</div>,
  }),
);

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PlatformAdminPage />
    </MemoryRouter>,
  );
}

describe('PlatformAdminPage (12.1 hub)', () => {
  it('vykreslí základní admin taby (Přehled/Uživatelé/Audit) + DEV debug', () => {
    renderAt('/admin');
    const tabs = screen.getAllByRole('tab');
    // 3 produkční taby + Friendship debug jen v DEV buildu.
    expect(tabs.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole('tab', { name: /Přehled/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Uživatelé/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Audit/ })).toBeTruthy();
  });

  it('default (bez ?tab) ukáže Přehled', () => {
    renderAt('/admin');
    expect(screen.getByText('PŘEHLED PANEL')).toBeTruthy();
  });

  it('?tab=uzivatele ukáže správu uživatelů', () => {
    renderAt('/admin?tab=uzivatele');
    expect(screen.getByText('UŽIVATELÉ PANEL')).toBeTruthy();
  });

  it('?tab=audit ukáže audit log', () => {
    renderAt('/admin?tab=audit');
    expect(screen.getByText('AUDIT PANEL')).toBeTruthy();
  });

  it('neznámý tab spadne na Přehled', () => {
    renderAt('/admin?tab=nesmysl');
    expect(screen.getByText('PŘEHLED PANEL')).toBeTruthy();
  });

  it('klik na tab Uživatelé přepne panel', () => {
    renderAt('/admin');
    fireEvent.click(screen.getByRole('tab', { name: /Uživatelé/ }));
    expect(screen.getByText('UŽIVATELÉ PANEL')).toBeTruthy();
  });

  it('přepnutí tabu zahodí ?search= (prefill z profilu nepatří jinam)', () => {
    function LocationProbe() {
      const loc = useLocation();
      return <div data-testid="loc">{loc.search}</div>;
    }
    render(
      <MemoryRouter initialEntries={['/admin?tab=uzivatele&search=Foo']}>
        <PlatformAdminPage />
        <LocationProbe />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('tab', { name: /Přehled/ }));
    expect(screen.getByTestId('loc').textContent).toBe('?tab=prehled');
  });
});
