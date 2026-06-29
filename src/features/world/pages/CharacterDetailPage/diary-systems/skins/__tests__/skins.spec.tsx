import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  DIARY_SKINS,
  isDiarySkin,
  resolveDefaultSkin,
  DEFAULT_SKIN_BY_SYSTEM,
} from '../registry';
import { DiarySkinSelector } from '../DiarySkinSelector';

describe('skins/registry', () => {
  it('má 8 skinů s unikátními ID a sjednocenými s BE whitelistem', () => {
    expect(DIARY_SKINS).toHaveLength(8);
    const ids = DIARY_SKINS.map((s) => s.id);
    expect(new Set(ids).size).toBe(8);
    expect(ids).toEqual([
      'scifi',
      'fantasy',
      'horror',
      'steampunk',
      'nature',
      'minimal',
      'retro',
      'anime',
    ]);
  });

  it('isDiarySkin: známé ID true, cizí/null/undefined false', () => {
    expect(isDiarySkin('fantasy')).toBe(true);
    expect(isDiarySkin('scifi')).toBe(true);
    expect(isDiarySkin('neexistuje')).toBe(false);
    expect(isDiarySkin(null)).toBe(false);
    expect(isDiarySkin(undefined)).toBe(false);
    expect(isDiarySkin('')).toBe(false);
  });

  it('resolveDefaultSkin: matrix→scifi, drd*/jad→fantasy, coc→horror, jiné→scifi', () => {
    expect(resolveDefaultSkin('matrix')).toBe('scifi');
    expect(resolveDefaultSkin('drd16')).toBe('fantasy');
    expect(resolveDefaultSkin('drdplus')).toBe('fantasy');
    expect(resolveDefaultSkin('drd2')).toBe('fantasy');
    expect(resolveDefaultSkin('jad')).toBe('fantasy');
    expect(resolveDefaultSkin('drdh')).toBe('fantasy');
    expect(resolveDefaultSkin('coc')).toBe('horror');
    expect(resolveDefaultSkin('dnd5e')).toBe('fantasy');
    expect(resolveDefaultSkin('xyz')).toBe('scifi');
  });

  it('resolveDefaultSkin: normalizuje case a prázdný/undef → scifi', () => {
    expect(resolveDefaultSkin('MATRIX')).toBe('scifi');
    expect(resolveDefaultSkin('CoC')).toBe('horror');
    expect(resolveDefaultSkin('')).toBe('scifi');
    expect(resolveDefaultSkin(undefined)).toBe('scifi');
    expect(resolveDefaultSkin(null)).toBe('scifi');
  });

  it('DEFAULT_SKIN_BY_SYSTEM používá jen platná skin ID', () => {
    for (const v of Object.values(DEFAULT_SKIN_BY_SYSTEM)) {
      expect(isDiarySkin(v)).toBe(true);
    }
  });
});

describe('DiarySkinSelector', () => {
  it('zavřené menu: jen tlačítko s aktivním skinem', () => {
    render(<DiarySkinSelector active="scifi" onPick={() => {}} />);
    // aktivní label je v tlačítku (text rozdělený přes emoji+label uzly)
    expect(screen.getByRole('button')).toHaveTextContent('Sci-fi');
    // menu zavřené → žádné menu/položky
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('klik na tlačítko otevře menu se 7 styly', () => {
    render(<DiarySkinSelector active="scifi" onPick={() => {}} />);
    fireEvent.click(screen.getByTitle('Změnit vzhled deníku'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(8);
  });

  it('výběr stylu zavolá onPick s ID a zavře menu', () => {
    const onPick = vi.fn();
    render(<DiarySkinSelector active="scifi" onPick={onPick} />);
    fireEvent.click(screen.getByTitle('Změnit vzhled deníku'));
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Fantasy/ }));
    expect(onPick).toHaveBeenCalledWith('fantasy');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('disabled tlačítko nelze otevřít', () => {
    render(<DiarySkinSelector active="horror" onPick={() => {}} disabled />);
    fireEvent.click(screen.getByTitle('Změnit vzhled deníku'));
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
