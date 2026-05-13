import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewsCard } from '../components/NewsCard';
import type { IkarosNews } from '@/shared/types';

function makeNews(overrides: Partial<IkarosNews> = {}): IkarosNews {
  return {
    id: 'n1',
    title: 'Spuštěno fáze 2',
    content:
      'Krátký popis novinky platformy s detaily co je nového a co se chystá.',
    authorId: 'admin1',
    authorName: 'Admin',
    createdAtUtc: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    ...overrides,
  };
}

describe('NewsCard', () => {
  it('vykreslí title, content, autora', () => {
    render(<NewsCard news={makeNews()} />);
    expect(screen.getByText('Spuštěno fáze 2')).toBeInTheDocument();
    expect(
      screen.getByText(/Krátký popis novinky/),
    ).toBeInTheDocument();
    expect(screen.getByText('— Admin')).toBeInTheDocument();
  });

  it('relativní datum (před 2 h)', () => {
    render(<NewsCard news={makeNews()} />);
    expect(screen.getByText(/před 2 h/)).toBeInTheDocument();
  });
});
