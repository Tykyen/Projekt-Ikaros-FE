import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersonaAutocomplete } from './PersonaAutocomplete';
import type { PageDirectoryEntry } from '@/features/world/pages/api/pages.types';

const entries: PageDirectoryEntry[] = [
  {
    id: '1',
    slug: 'stary-kovar',
    title: 'Starý kovář',
    type: 'NPC',
    order: 0,
    updatedAt: '',
    imageUrl: 'http://img/k.png',
  },
  {
    id: '2',
    slug: 'helsing',
    title: 'Helsing',
    type: 'Postava hráče',
    order: 1,
    updatedAt: '',
  },
];

describe('PersonaAutocomplete', () => {
  it('filtruje podle jména diakritika-insensitive', () => {
    // "stary" (bez háčku) musí najít "Starý kovář".
    render(
      <PersonaAutocomplete
        query="stary"
        entries={entries}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Starý kovář')).toBeInTheDocument();
    expect(screen.queryByText('Helsing')).not.toBeInTheDocument();
  });

  it('prázdný dotaz nabídne oba typy (NPC i postavu)', () => {
    render(
      <PersonaAutocomplete
        query=""
        entries={entries}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Starý kovář')).toBeInTheDocument();
    expect(screen.getByText('Helsing')).toBeInTheDocument();
    expect(screen.getByText('NPC')).toBeInTheDocument();
    expect(screen.getByText('postava')).toBeInTheDocument();
  });

  it('výběr řádku vrátí celou entry', () => {
    const onSelect = vi.fn();
    render(
      <PersonaAutocomplete
        query="kov"
        entries={entries}
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    );
    // mousedown (ne click) — komponenta vybírá na mousedown kvůli fokusu pole.
    fireEvent.mouseDown(screen.getByText('Starý kovář'));
    expect(onSelect).toHaveBeenCalledWith(entries[0]);
  });

  it('žádná shoda ukáže prázdný stav', () => {
    render(
      <PersonaAutocomplete
        query="xyzxyz"
        entries={entries}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByText('Žádná postava ani NPC neodpovídá.'),
    ).toBeInTheDocument();
  });
});
