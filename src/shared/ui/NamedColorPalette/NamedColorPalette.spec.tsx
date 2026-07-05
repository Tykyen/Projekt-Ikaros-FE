import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NamedColorPalette } from './NamedColorPalette';
import { NAMED_COLORS, readableTextOn } from './palette';

describe('readableTextOn', () => {
  it('světlá barva → tmavý text', () => {
    expect(readableTextOn('#FFFFFF')).toBe('#14100a');
    expect(readableTextOn('#F5A524')).toBe('#14100a'); // jantarová (jas > 0.6)
  });

  it('tmavá/sytá barva → bílý text', () => {
    expect(readableTextOn('#4667E6')).toBe('#ffffff'); // safírová
    expect(readableTextOn('#E5484D')).toBe('#ffffff'); // rubínová
  });

  it('nevalidní vstup → bílý text (fallback, žádný pád)', () => {
    expect(readableTextOn('nope')).toBe('#ffffff');
  });
});

describe('NamedColorPalette', () => {
  it('vykreslí dlaždici pro každou barvu', () => {
    render(<NamedColorPalette onPick={() => {}} />);
    for (const c of NAMED_COLORS) {
      expect(
        screen.getByRole('button', { name: `${c.name} ${c.hex}` }),
      ).toBeInTheDocument();
    }
  });

  it('klik na dlaždici volá onPick s hex velkými písmeny', () => {
    const onPick = vi.fn();
    render(<NamedColorPalette onPick={onPick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Rubínová #E5484D' }));
    expect(onPick).toHaveBeenCalledWith('#E5484D');
  });

  it('value zvýrazní odpovídající dlaždici (aria-pressed), case-insensitive', () => {
    render(<NamedColorPalette value="#e5484d" onPick={() => {}} />);
    expect(
      screen.getByRole('button', { name: 'Rubínová #E5484D' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Zlatá #FBCA3E' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('vlastní label u summary', () => {
    render(<NamedColorPalette onPick={() => {}} label="Barvy skupiny" />);
    expect(screen.getByText('Barvy skupiny')).toBeInTheDocument();
  });
});
