import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeUsageSection } from '../ThemeUsageSection';
import type { ThemeUsageStats } from '../../../api/themeUsage.types';

vi.mock('../../../api/useThemeUsageStats', () => ({
  useThemeUsageStats: vi.fn(),
}));

import { useThemeUsageStats } from '../../../api/useThemeUsageStats';

const mock = useThemeUsageStats as unknown as ReturnType<typeof vi.fn>;

function sample(): ThemeUsageStats {
  return {
    generatedAt: '2026-07-15T10:00:00.000Z',
    platformTheme: { total: 20, noChoice: 10, counts: { 'modre-nebe': 5, mesic: 3 } },
    worldTheme: { total: 7, noChoice: 0, counts: { ikaros: 4, fantasy: 2 } },
    memberTheme: { total: 21, noChoice: 20, counts: { fantasy: 1 } },
    diarySkin: { total: 21, noChoice: 13, counts: { scifi: 8 } },
    chatSkin: { total: 21, noChoice: 20, counts: { western: 1 } },
  };
}

beforeEach(() => vi.clearAllMocks());

describe('ThemeUsageSection (20.6)', () => {
  it('loading → nadpis + „Načítám…"', () => {
    mock.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<ThemeUsageSection />);
    expect(screen.getByText('Motivy a skiny')).toBeDefined();
    expect(screen.getByText('Načítám…')).toBeDefined();
  });

  it('error → hláška', () => {
    mock.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<ThemeUsageSection />);
    expect(screen.getByText(/nepodařilo načíst/)).toBeDefined();
  });

  it('data → souhrn kandidátů + tituly dimenzí', () => {
    mock.mockReturnValue({ data: sample(), isLoading: false, isError: false });
    render(<ThemeUsageSection />);
    expect(screen.getByText(/Kandidáti na osekání/)).toBeDefined();
    expect(screen.getByText('Motiv platformy (profil)')).toBeDefined();
    expect(screen.getByText('Skin deníku')).toBeDefined();
    // default odznak u modre-nebe (může být víckrát)
    expect(screen.getAllByText('výchozí').length).toBeGreaterThan(0);
  });

  it('nulové využití → „nevyužité" odznaky přítomné', () => {
    mock.mockReturnValue({ data: sample(), isLoading: false, isError: false });
    render(<ThemeUsageSection />);
    expect(screen.getAllByText('nevyužité').length).toBeGreaterThan(0);
  });
});
