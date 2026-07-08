import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NaborListek } from './NaborListek';
import type { Nabor } from '@/shared/types';

const nabor: Nabor = {
  id: '1',
  strana: 'hledam-hrace',
  motiv: 'western',
  title: 'Stíny nad Pustinou',
  body: 'Klasické podzemí, hraje se ob víkend.',
  mode: 'zivo',
  place: 'Praha',
  system: 'DrD',
  seatsTotal: 5,
  seatsTaken: 3,
  status: 'open',
  authorId: 'a',
  authorName: 'Krolok',
  createdAtUtc: '2026-07-08T00:00:00Z',
};

describe('NaborListek', () => {
  it('renderuje pole a nese motiv na stabilním atributu', () => {
    render(<NaborListek nabor={nabor} />);
    expect(screen.getByText('Stíny nad Pustinou')).toBeTruthy();
    expect(screen.getByText('Hledám hráče')).toBeTruthy();
    const card = screen.getByText('Stíny nad Pustinou').closest('[data-nabor-card]');
    expect(card?.getAttribute('data-nabor-motiv')).toBe('western');
  });

  it('aplikuje motiv paletu inline (přebíjí globální skin)', () => {
    render(<NaborListek nabor={nabor} />);
    const card = screen.getByText('Stíny nad Pustinou').closest('[data-nabor-card]') as HTMLElement;
    // getTheme(motiv).vars → inline --theme-* na kartě.
    expect(card.style.getPropertyValue('--theme-accent')).not.toBe('');
  });

  it('„Ozvat se" volá callback s náborem', () => {
    const fn = vi.fn();
    render(<NaborListek nabor={nabor} onOzvatSe={fn} />);
    fireEvent.click(screen.getByText('Ozvat se'));
    expect(fn).toHaveBeenCalledWith(nabor);
  });

  it('obsazený lístek ukáže „Obsazeno" místo tlačítka', () => {
    render(<NaborListek nabor={{ ...nabor, seatsTaken: 5 }} />);
    expect(screen.getByText('Obsazeno')).toBeTruthy();
    expect(screen.queryByText('Ozvat se')).toBeNull();
  });
});
