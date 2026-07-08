import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GrowthSection } from '../GrowthSection';
import type { GrowthStats } from '../../../api/growth.types';

vi.mock('../../../api/useGrowthStats', () => ({
  useGrowthStats: vi.fn(),
}));

import { useGrowthStats } from '../../../api/useGrowthStats';

const mockGrowth = useGrowthStats as unknown as ReturnType<typeof vi.fn>;

function sample(): GrowthStats {
  return {
    range: { days: 30, generatedAt: '2026-07-08T00:00:00.000Z' },
    funnel: {
      steps: [
        { key: 'registered', total: 50, recent: 8 },
        { key: 'joinedWorld', total: 40, recent: 6 },
        { key: 'character', total: 30, recent: 4 },
        { key: 'action', total: 20, recent: 3 },
        { key: 'dice', total: 12, recent: 2 },
      ],
    },
    retention: {
      activationRate: 0.6,
      stickiness: 0.5,
      wau: 15,
      mau: 30,
      cohorts: [
        { month: '2026-06', registered: 12, active: 6 },
        { month: '2026-07', registered: 8, active: 7 },
      ],
    },
    acquisition: { visitors: 200, signups: 8, signupRate: 0.04 },
  };
}

beforeEach(() => vi.clearAllMocks());

describe('GrowthSection (19.1)', () => {
  it('loading → nadpis + karty se zástupným „—"', () => {
    mockGrowth.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    render(<GrowthSection />);
    expect(screen.getByText('Růst & retence')).toBeDefined();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('data → trychtýř, retenční karty, kohorty, akvizice', () => {
    mockGrowth.mockReturnValue({
      data: sample(),
      isLoading: false,
      isError: false,
    });
    render(<GrowthSection />);
    // funnel milníky
    expect(screen.getByText('Registrovaní')).toBeDefined();
    expect(screen.getByText(/Hází kostkou/)).toBeDefined();
    // retenční karty
    expect(screen.getByText('60 %')).toBeDefined(); // aktivace
    expect(screen.getAllByText('50 %').length).toBeGreaterThan(0); // stickiness (+ kohorta 6/12)
    // kohorty
    expect(screen.getByText('2026-06')).toBeDefined();
    // akvizice
    expect(screen.getByText(/návštěvníků/)).toBeDefined();
    expect(screen.getByText('4 %')).toBeDefined(); // signupRate
  });

  it('error → hláška', () => {
    mockGrowth.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<GrowthSection />);
    expect(screen.getByText(/nepodařilo načíst/)).toBeDefined();
  });

  it('0 registrovaných → empty místo trychtýře', () => {
    const empty = sample();
    empty.funnel.steps = empty.funnel.steps.map((s) => ({
      ...s,
      total: 0,
      recent: 0,
    }));
    empty.retention.cohorts = [];
    mockGrowth.mockReturnValue({
      data: empty,
      isLoading: false,
      isError: false,
    });
    render(<GrowthSection />);
    expect(screen.getByText(/Zatím žádní registrovaní/)).toBeDefined();
  });

  it('přepínač období → hook se přepne na 7 dní', () => {
    mockGrowth.mockReturnValue({
      data: sample(),
      isLoading: false,
      isError: false,
    });
    render(<GrowthSection />);
    fireEvent.click(screen.getByText('7 dní'));
    expect(mockGrowth).toHaveBeenLastCalledWith(7);
  });
});
