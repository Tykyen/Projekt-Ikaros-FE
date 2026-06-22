import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs } from './Breadcrumbs';

describe('Breadcrumbs', () => {
  it('vykreslí položky; poslední bez odkazu s aria-current="page"', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs
          items={[
            { label: 'Domů', href: '/' },
            { label: 'Články', href: '/ikaros/clanky' },
            { label: 'Můj článek' },
          ]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Domů' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Články' })).toBeInTheDocument();

    const current = screen.getByText('Můj článek');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Můj článek' })).toBeNull();
  });

  it('prázdné items → nic nevykreslí', () => {
    const { container } = render(
      <MemoryRouter>
        <Breadcrumbs items={[]} />
      </MemoryRouter>,
    );
    expect(container.querySelector('nav')).toBeNull();
  });
});
