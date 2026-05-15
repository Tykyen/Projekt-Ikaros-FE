import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewsCard } from './NewsCard';
import type { IkarosNews } from '@/shared/types';

function makeNews(overrides: Partial<IkarosNews> = {}): IkarosNews {
  return {
    id: 'n1',
    title: 'Spuštěna fáze 2',
    content: '<p>Detailní obsah novinky.</p>',
    authorId: 'admin1',
    authorName: 'Admin',
    createdAtUtc: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    archived: false,
    type: 'info',
    ...overrides,
  };
}

describe('NewsCard', () => {
  it('sbaleno — nadpis, štítek typu, datum; bez obsahu a autora', () => {
    render(<NewsCard news={makeNews()} />);
    expect(screen.getByText('Spuštěna fáze 2')).toBeInTheDocument();
    expect(screen.getByText('Informace')).toBeInTheDocument();
    expect(screen.getByText(/před 2 h/)).toBeInTheDocument();
    expect(screen.queryByText(/Detailní obsah/)).not.toBeInTheDocument();
    expect(screen.queryByText(/— Admin/)).not.toBeInTheDocument();
  });

  it('po kliknutí rozbalí obsah a autora za datem', async () => {
    render(<NewsCard news={makeNews()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText(/Detailní obsah/)).toBeInTheDocument();
    expect(screen.getByText(/— Admin/)).toBeInTheDocument();
  });

  it('aria-expanded reflektuje stav', () => {
    render(<NewsCard news={makeNews()} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('štítek typu + data-type dle typu novinky', () => {
    const { container } = render(
      <NewsCard news={makeNews({ type: 'warning' })} />,
    );
    expect(screen.getByText('Upozornění')).toBeInTheDocument();
    expect(container.querySelector('[data-type="warning"]')).toBeTruthy();
  });

  it('defaultExpanded zobrazí obsah rovnou', async () => {
    render(<NewsCard news={makeNews()} defaultExpanded />);
    expect(await screen.findByText(/Detailní obsah/)).toBeInTheDocument();
  });

  it('obrázek se vykreslí jen pokud novinka má imageUrl', () => {
    const { container } = render(
      <NewsCard news={makeNews({ imageUrl: 'https://cdn/x.png' })} defaultExpanded />,
    );
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'https://cdn/x.png',
    );
  });
});
