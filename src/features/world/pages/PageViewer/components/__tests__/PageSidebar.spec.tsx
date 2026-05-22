import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PageSidebar } from '../PageSidebar';
import type { Page } from '../../../api/pages.types';

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({ worldId: 'w1', worldSlug: 'matrix' }),
}));
// useBrokenLinks volá usePagesDirectory (TanStack Query) — pro tyto testy
// stačí no-op, broken-link detekce má vlastní spec.
vi.mock('../../hooks/useBrokenLinks', () => ({
  useBrokenLinks: () => {},
}));

function makePage(table: Page['table']): Page {
  return {
    id: 'p1',
    slug: 'aralion',
    worldId: 'w1',
    type: 'Lokace',
    title: 'Aralion',
    content: '',
    sections: [],
    galleryImages: [],
    videos: [],
    menu: [],
    plainText: '',
    isWoodWide: false,
    accessRequirements: [],
    order: 0,
    createdAt: '',
    updatedAt: '',
    table,
  };
}

function renderSidebar(page: Page) {
  return render(
    <MemoryRouter>
      <PageSidebar page={page} />
    </MemoryRouter>,
  );
}

describe('PageSidebar — datová tabulka (8.5)', () => {
  it('buňka jako prostý text', () => {
    renderSidebar(
      makePage({
        hasTable: true,
        headers: ['Měna'],
        values: ['Zlaťák'],
      }),
    );
    expect(screen.getByText('Měna')).toBeInTheDocument();
    expect(screen.getByText('Zlaťák')).toBeInTheDocument();
  });

  it('buňka s HTML odkazem se vyrenderuje jako <a>', () => {
    const { container } = renderSidebar(
      makePage({
        hasTable: true,
        headers: ['Hl. město'],
        values: ['<a href="brennor">Brennor</a>'],
      }),
    );
    const link = container.querySelector('td a');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('brennor');
    expect(link?.textContent).toBe('Brennor');
  });

  it('víc odkazů v jedné buňce', () => {
    const { container } = renderSidebar(
      makePage({
        hasTable: true,
        headers: ['Rodina'],
        values: [
          '<a href="jan">Jan Novák</a> a <a href="jana">Jana Nováková</a>',
        ],
      }),
    );
    const links = container.querySelectorAll('td a');
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('jan');
    expect(links[1].getAttribute('href')).toBe('jana');
  });

  it('prázdná hodnota → pomlčka', () => {
    renderSidebar(
      makePage({
        hasTable: true,
        headers: ['Vláda'],
        values: [''],
      }),
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('odkaz i v klíči (header)', () => {
    const { container } = renderSidebar(
      makePage({
        hasTable: true,
        headers: ['<a href="rod">Rod</a>'],
        values: ['Aralionští'],
      }),
    );
    const link = container.querySelector('th a');
    expect(link?.getAttribute('href')).toBe('rod');
  });
});
