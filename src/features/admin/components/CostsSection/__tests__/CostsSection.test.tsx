import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CostsSection } from '../CostsSection';
import type { CostStats } from '../../../api/costs.types';

vi.mock('../../../api/useCostStats', () => ({
  useCostStats: vi.fn(),
}));

import { useCostStats } from '../../../api/useCostStats';

const mockCosts = useCostStats as unknown as ReturnType<typeof vi.fn>;

function sample(overrides: Partial<CostStats> = {}): CostStats {
  return {
    generatedAt: '2026-07-08T00:00:00.000Z',
    blobs: {
      total: 21,
      byType: [
        { type: 'gallery', count: 5 },
        { type: 'pages', count: 6 },
      ],
      topWorlds: [{ worldId: 'w1', worldName: 'Aralon', count: 8 }],
    },
    measuredBytes: { chatAttachments: 1048576, adminDocuments: 0 },
    cloudinary: { available: false },
    ai: { available: false },
    ...overrides,
  };
}

beforeEach(() => vi.clearAllMocks());

describe('CostsSection (19.2)', () => {
  it('data → počty blobů, typy, top světy, měřené byty', () => {
    mockCosts.mockReturnValue({
      data: sample(),
      isLoading: false,
      isError: false,
    });
    render(<CostsSection />);
    expect(screen.getByText('Náklady')).toBeDefined();
    expect(screen.getByText('21')).toBeDefined(); // celkem
    expect(screen.getByText('Galerie')).toBeDefined();
    expect(screen.getByText('Aralon')).toBeDefined();
    expect(screen.getByText(/1,0 MB/)).toBeDefined(); // chat přílohy 1 MiB
  });

  it('Cloudinary available:false → hláška o nedostupnosti', () => {
    mockCosts.mockReturnValue({
      data: sample(),
      isLoading: false,
      isError: false,
    });
    render(<CostsSection />);
    expect(screen.getByText(/Cloudinary usage nedostupné/)).toBeDefined();
  });

  it('Cloudinary available:true → karty úložiště/přenos', () => {
    mockCosts.mockReturnValue({
      data: sample({
        cloudinary: {
          available: true,
          storageBytes: 5 * 1024 * 1024 * 1024,
          bandwidthBytes: 1024 * 1024,
          transformations: 42,
          credits: { used: 3, limit: 25 },
          plan: 'Free',
        },
      }),
      isLoading: false,
      isError: false,
    });
    render(<CostsSection />);
    expect(screen.getByText('Úložiště')).toBeDefined();
    expect(screen.getByText(/5,0 GB/)).toBeDefined();
    expect(screen.getByText('Kredity')).toBeDefined();
  });

  it('error → hláška', () => {
    mockCosts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<CostsSection />);
    expect(screen.getByText(/nepodařilo načíst/)).toBeDefined();
  });

  it('AI placeholder je vždy vidět', () => {
    mockCosts.mockReturnValue({
      data: sample(),
      isLoading: false,
      isError: false,
    });
    render(<CostsSection />);
    expect(screen.getByText(/AI zatím nezavedeno/)).toBeDefined();
  });
});
