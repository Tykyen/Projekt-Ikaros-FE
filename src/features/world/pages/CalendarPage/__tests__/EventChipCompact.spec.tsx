import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventChipCompact } from '../components/EventChipCompact';

describe('EventChipCompact (9.4)', () => {
  it('vykreslí jako 4px proužek bez textu (jen title attr)', () => {
    render(
      <EventChipCompact
        title="Vesmírná stanice: Savnost"
        color="#7c5cff"
        position="single"
        isWeekRestart={false}
        onClick={() => {}}
      />,
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
    // Bez textového obsahu (children) — proužek jen vizuální.
    expect(btn.textContent).toBe('');
    // Title pro tooltip + aria-label pro a11y.
    expect(btn).toHaveAttribute('title', 'Vesmírná stanice: Savnost');
    expect(btn).toHaveAttribute('aria-label', 'Vesmírná stanice: Savnost');
  });

  it('aria-label pro pokračování multi-day eventu', () => {
    render(
      <EventChipCompact
        title="Krásná elfka"
        color="#ff5cb0"
        position="middle"
        isWeekRestart={false}
        onClick={() => {}}
      />,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label', 'Krásná elfka — pokračování');
    expect(btn).toHaveAttribute('title', 'Krásná elfka — pokračování');
  });

  it('start position je považován za origin (bez pokračování label)', () => {
    render(
      <EventChipCompact
        title="Akce"
        color="#0f0"
        position="start"
        isWeekRestart={false}
        onClick={() => {}}
      />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Akce');
  });

  it('onClick handler volá se po kliknutí', async () => {
    const onClick = vi.fn();
    render(
      <EventChipCompact
        title="x"
        color="#fff"
        position="single"
        isWeekRestart={false}
        onClick={onClick}
      />,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('aplikuje --chip-color CSS proměnnou ze barvy eventu', () => {
    render(
      <EventChipCompact
        title="x"
        color="#abcdef"
        position="single"
        isWeekRestart={false}
        onClick={() => {}}
      />,
    );
    const btn = screen.getByRole('button');
    expect(btn.style.getPropertyValue('--chip-color')).toBe('#abcdef');
  });
});
