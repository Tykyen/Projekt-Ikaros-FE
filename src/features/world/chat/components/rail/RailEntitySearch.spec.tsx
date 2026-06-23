import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

interface PEntry {
  id: string;
  slug: string;
  title: string;
  type: string;
  imageUrl?: string;
}
interface Bes {
  id: string;
  name: string;
}

let mockPersonas: PEntry[] = [];
let mockBestiar: { system: Bes[]; world: Bes[]; user: Bes[] } = {
  system: [],
  world: [],
  user: [],
};

vi.mock('@/features/world/pages/api/usePersonaDirectory', () => ({
  usePersonaDirectory: () => ({ data: mockPersonas }),
}));
vi.mock('@/features/world/bestiar/hooks/useBestiar', () => ({
  useBestiar: () => ({ data: mockBestiar }),
}));

import { RailEntitySearch } from './RailEntitySearch';

describe('RailEntitySearch (16.1c)', () => {
  it('sloučí NPC + bestie, PC vynechá; výběr vrací správný kind', () => {
    mockPersonas = [
      { id: 'p1', slug: 'alice', title: 'Alice', type: 'Postava hráče' },
      { id: 'n1', slug: 'duch', title: 'Duch', type: 'NPC' },
    ];
    mockBestiar = { system: [{ id: 'b1', name: 'Skřet' }], world: [], user: [] };
    const onSelect = vi.fn();
    const { getByLabelText, getByText, queryByText } = render(
      <RailEntitySearch worldId="w1" systemId="matrix" onSelect={onSelect} />,
    );
    fireEvent.focus(getByLabelText('Hledat NPC nebo bestii'));
    expect(getByText('Duch')).toBeTruthy(); // NPC
    expect(getByText('Skřet')).toBeTruthy(); // bestie
    expect(queryByText('Alice')).toBeNull(); // PC vynechán
    fireEvent.mouseDown(getByText('Skřet'));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'bestie' }),
    );
  });

  it('filtr dle jména (diakritika-insensitive)', () => {
    mockPersonas = [{ id: 'n1', slug: 'duch', title: 'Duch', type: 'NPC' }];
    mockBestiar = { system: [{ id: 'b1', name: 'Skřet' }], world: [], user: [] };
    const { getByLabelText, getByText, queryByText } = render(
      <RailEntitySearch worldId="w1" systemId="matrix" onSelect={vi.fn()} />,
    );
    fireEvent.change(getByLabelText('Hledat NPC nebo bestii'), {
      target: { value: 'skr' },
    });
    expect(getByText('Skřet')).toBeTruthy();
    expect(queryByText('Duch')).toBeNull();
  });
});
