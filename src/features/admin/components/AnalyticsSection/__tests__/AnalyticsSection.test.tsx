import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsSection } from '../AnalyticsSection';
import type { AnalyticsSummary } from '../../../api/analytics.types';

vi.mock('../../../api/useAnalyticsSummary', () => ({
  useAnalyticsSummary: vi.fn(),
}));

import { useAnalyticsSummary } from '../../../api/useAnalyticsSummary';

const mockSummary = useAnalyticsSummary as unknown as ReturnType<typeof vi.fn>;

function sample(): AnalyticsSummary {
  return {
    range: { days: 7, from: '2026-06-15', to: '2026-06-22' },
    totals: { views: 100, visitors: 40, anonShare: 0.25 },
    daily: [
      { date: '2026-06-21', views: 30, visitors: 12 },
      { date: '2026-06-22', views: 70, visitors: 28 },
    ],
    topPaths: [
      { path: '/', views: 50 },
      { path: '/svet/aralon', views: 30 },
    ],
    sources: [
      { category: 'search', views: 65 },
      { category: 'direct', views: 35 },
    ],
    generatedAt: '2026-06-22T00:00:00.000Z',
  };
}

beforeEach(() => vi.clearAllMocks());

describe('AnalyticsSection (15B.7)', () => {
  it('loading → karty se zástupným „—"', () => {
    mockSummary.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<AnalyticsSection />);
    expect(screen.getByText('Návštěvnost')).toBeDefined();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('data → karty, top stránky, zdroje', () => {
    mockSummary.mockReturnValue({ data: sample(), isLoading: false, isError: false });
    render(<AnalyticsSection />);
    expect(screen.getByText('100')).toBeDefined(); // views
    expect(screen.getByText('40')).toBeDefined(); // visitors
    expect(screen.getByText('25 %')).toBeDefined(); // anon podíl
    expect(screen.getByText('/svet/aralon')).toBeDefined();
    expect(screen.getByText('Vyhledávač')).toBeDefined();
    expect(screen.getByText('Přímo')).toBeDefined();
  });

  it('error → hláška', () => {
    mockSummary.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<AnalyticsSection />);
    expect(screen.getByText(/nepodařilo načíst/)).toBeDefined();
  });

  it('prázdná data (0 views) → empty hláška, žádný graf', () => {
    const empty: AnalyticsSummary = {
      ...sample(),
      totals: { views: 0, visitors: 0, anonShare: 0 },
      daily: [],
      topPaths: [],
      sources: [],
    };
    mockSummary.mockReturnValue({ data: empty, isLoading: false, isError: false });
    render(<AnalyticsSection />);
    expect(screen.getByText(/Zatím žádná data/)).toBeDefined();
  });

  it('přepínač období → hook se přepne na 30 dní', () => {
    mockSummary.mockReturnValue({ data: sample(), isLoading: false, isError: false });
    render(<AnalyticsSection />);
    fireEvent.click(screen.getByText('30 dní'));
    expect(mockSummary).toHaveBeenLastCalledWith(30);
  });
});
