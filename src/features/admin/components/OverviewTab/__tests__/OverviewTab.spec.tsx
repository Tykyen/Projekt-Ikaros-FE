import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithQuery } from '@/shared/test/renderWithQuery';
import { OverviewTab } from '../OverviewTab';
import { useAdminStats } from '../../../api/useAdminStats';

vi.mock('../../../api/useAdminStats', () => ({
  useAdminStats: vi.fn(),
}));
// D-067 — OverviewTab embeduje sekce s vlastními React Query hooky
// (AnalyticsSection, GrowthSection, CostsSection, ThemeUsageSection, …).
// Dřív tu byl ruční `vi.mock` na každou z nich a přidání páté shodilo celý
// soubor na „No QueryClient set". Místo toho: provider z renderWithQuery +
// jeden mock síťové vrstvy, kterou všechny sdílejí. Nikdy nedoručený příslib
// drží sekce v loading stavu → nefetchují, neshodí se a do assertions níže
// nemluví. Nová sekce sem už nic přidávat nemusí.
vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(() => new Promise(() => {})),
    post: vi.fn(() => new Promise(() => {})),
    put: vi.fn(() => new Promise(() => {})),
    patch: vi.fn(() => new Promise(() => {})),
    delete: vi.fn(() => new Promise(() => {})),
  },
}));

const mockHook = vi.mocked(useAdminStats);

const DATA = {
  users: { total: 42, online: 3, newLast7Days: 5, pendingDeletion: 2 },
  worlds: { total: 4 },
  content: { articles: 10, galleryImages: 20, discussions: 7 },
  queue: { pendingUsernameRequests: 1 },
  generatedAt: '2026-06-02T00:00:00.000Z',
};

function renderTab() {
  return renderWithQuery(<OverviewTab />);
}

describe('OverviewTab (12.1 dashboard)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('vykreslí metriky z hooku', () => {
    mockHook.mockReturnValue({
      data: DATA,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useAdminStats>);
    renderTab();
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('20')).toBeTruthy();
    expect(screen.getByText('Aktivní (24 h)')).toBeTruthy();
  });

  it('při chybě ukáže alert (a metriky padají na 0)', () => {
    mockHook.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useAdminStats>);
    renderTab();
    // Hledáme vlastní alert Přehledu, ne „nějaký" — embedované sekce mají
    // při chybě také `role="alert"` a getByRole by na dvou spadl.
    const alerts = screen.getAllByRole('alert');
    expect(
      alerts.some((a) =>
        a.textContent?.includes('Statistiky se nepodařilo načíst'),
      ),
    ).toBe(true);
  });

  it('fronta odkazuje do Zpracovat', () => {
    mockHook.mockReturnValue({
      data: DATA,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useAdminStats>);
    renderTab();
    const link = screen
      .getAllByRole('link')
      .find((a) => a.getAttribute('href')?.includes('tab=zpracovat'));
    expect(link).toBeTruthy();
  });
});
