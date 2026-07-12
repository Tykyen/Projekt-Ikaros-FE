import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OverviewTab } from '../OverviewTab';
import { useAdminStats } from '../../../api/useAdminStats';

vi.mock('../../../api/useAdminStats', () => ({
  useAdminStats: vi.fn(),
}));
// 15B.7 — OverviewTab nově embeduje AnalyticsSection (vlastní React Query hook).
// Test je o metrikách z useAdminStats, ne o analytics → stub (jinak „No QueryClient").
vi.mock('../../AnalyticsSection/AnalyticsSection', () => ({
  AnalyticsSection: () => null,
}));
// 19.1/19.2 — stejný důvod pro GrowthSection + CostsSection (React Query hooky).
vi.mock('../../GrowthSection/GrowthSection', () => ({
  GrowthSection: () => null,
}));
vi.mock('../../CostsSection/CostsSection', () => ({
  CostsSection: () => null,
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
  return render(
    <MemoryRouter>
      <OverviewTab />
    </MemoryRouter>,
  );
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
    expect(screen.getByRole('alert')).toBeTruthy();
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
