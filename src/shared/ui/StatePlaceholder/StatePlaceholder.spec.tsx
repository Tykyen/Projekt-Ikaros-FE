import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

describe('EmptyState', () => {
  it('hero — render titulku, popisu, ilustrace a role=status', () => {
    const { container } = render(
      <EmptyState
        size="hero"
        illustration="characters"
        title="Družina chybí"
        description="Zatím tu nikdo není."
      />,
    );
    expect(screen.getByText('Družina chybí')).toBeInTheDocument();
    expect(screen.getByText('Zatím tu nikdo není.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/illustrations/states/characters.webp');
  });

  it('inline — ilustrace se NEvykreslí (jen ikona/text)', () => {
    const { container } = render(
      <EmptyState size="inline" illustration="characters" icon={<span>★</span>} title="Prázdno" />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('★')).toBeInTheDocument();
  });

  it('CTA onClick — vyrenderuje button a zavolá handler', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Bez stránek"
        action={{ label: 'Vytvořit stránku', onClick }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Vytvořit stránku' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('CTA s `to` — vyrenderuje odkaz na route', () => {
    render(
      <MemoryRouter>
        <EmptyState title="Bez světů" action={{ label: 'Založit svět', to: '/svet/novy' }} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'Založit svět' });
    expect(link).toHaveAttribute('href', '/svet/novy');
  });
});

describe('ErrorState', () => {
  it('status=403 — default ilustrace, titulek, role=alert', () => {
    const { container } = render(<ErrorState size="hero" status={403} />);
    expect(screen.getByText('Sem nevidíš')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/illustrations/states/forbidden.webp',
    );
  });

  it('status=401 — nabídne přihlášení (forbidden ilustrace)', () => {
    const { container } = render(<ErrorState size="hero" status={401} />);
    expect(screen.getByText('Nejdřív se přihlas')).toBeInTheDocument();
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/illustrations/states/forbidden.webp',
    );
  });

  it('status=404 — text nelže o smazání (leak policy R6)', () => {
    render(<ErrorState size="hero" status={404} />);
    expect(screen.getByText(/sem prostě nevidíš/i)).toBeInTheDocument();
  });

  it('onRetry — CTA „Zkusit znovu" volá handler', () => {
    const onRetry = vi.fn();
    render(<ErrorState status={500} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Zkusit znovu' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('explicitní title/description přebije default statusu', () => {
    render(<ErrorState status={403} title="Vlastní titulek" description="Vlastní popis" />);
    expect(screen.getByText('Vlastní titulek')).toBeInTheDocument();
    expect(screen.getByText('Vlastní popis')).toBeInTheDocument();
    expect(screen.queryByText('Sem nevidíš')).not.toBeInTheDocument();
  });
});
