import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FavoriteToggle } from '../FavoriteToggle';

describe('FavoriteToggle', () => {
  it('variant button — vykreslí text „Oblíbené"', () => {
    render(
      <FavoriteToggle isFavorite={false} onToggle={() => {}} variant="button" />,
    );
    expect(screen.getByText('Oblíbené')).toBeInTheDocument();
  });

  it('variant icon — bez textu', () => {
    render(
      <FavoriteToggle isFavorite={false} onToggle={() => {}} variant="icon" />,
    );
    expect(screen.queryByText('Oblíbené')).not.toBeInTheDocument();
  });

  it('isFavorite → aria-pressed true + ikona fill', () => {
    const { container } = render(
      <FavoriteToggle isFavorite onToggle={() => {}} />,
    );
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(container.querySelector('svg')).toHaveAttribute(
      'fill',
      'currentColor',
    );
  });

  it('není oblíbené → ikona fill none', () => {
    const { container } = render(
      <FavoriteToggle isFavorite={false} onToggle={() => {}} />,
    );
    expect(container.querySelector('svg')).toHaveAttribute('fill', 'none');
  });

  it('pending → tlačítko disabled', () => {
    render(<FavoriteToggle isFavorite={false} onToggle={() => {}} pending />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('klik volá onToggle', () => {
    const onToggle = vi.fn();
    render(<FavoriteToggle isFavorite={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
