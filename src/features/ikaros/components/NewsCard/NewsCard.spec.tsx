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
  it('karta — titulek, štítek typu, datum a úryvek; autor až v detailu', () => {
    render(<NewsCard news={makeNews()} />);
    expect(screen.getByText('Spuštěna fáze 2')).toBeInTheDocument();
    expect(screen.getByText('Informace')).toBeInTheDocument();
    expect(screen.getByText(/před 2 h/)).toBeInTheDocument();
    // úryvek (plain text z HTML obsahu) je na kartě vidět
    expect(screen.getByText('Detailní obsah novinky.')).toBeInTheDocument();
    // autor je jen v detail-okně, ne na kartě
    expect(screen.queryByText(/— Admin/)).not.toBeInTheDocument();
  });

  it('klik na kartu otevře detail-okno (autor je proof otevření)', async () => {
    render(<NewsCard news={makeNews()} />);
    expect(screen.queryByText(/— Admin/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Otevřít novinku/ }));
    expect(await screen.findByText(/— Admin/)).toBeInTheDocument();
  });

  it('štítek typu dle typu novinky', () => {
    render(<NewsCard news={makeNews({ type: 'warning' })} />);
    expect(screen.getByText('Upozornění')).toBeInTheDocument();
  });

  it('obrázek se vykreslí v médiu karty když má imageUrl', () => {
    const { container } = render(
      <NewsCard news={makeNews({ imageUrl: 'https://cdn/x.png' })} />,
    );
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'https://cdn/x.png',
    );
  });

  it('bez imageUrl ukáže fallback místo obrázku', () => {
    const { container } = render(<NewsCard news={makeNews()} />);
    expect(container.querySelector('img')).toBeNull();
  });
});
