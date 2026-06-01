import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UniverseSearch } from './UniverseSearch';
import type { UniverseNode } from '../types';

function n(id: string, name: string): UniverseNode {
  return {
    id,
    name,
    color: '#fff',
    size: 5,
    isPublic: true,
    visibleToPlayerIds: [],
  };
}

const nodes = [n('a', 'Alfa'), n('b', 'Beta')];

describe('UniverseSearch', () => {
  it('výběr existujícího jména volá onPick s uzlem', () => {
    const onPick = vi.fn();
    render(<UniverseSearch nodes={nodes} onPick={onPick} />);
    const input = screen.getByPlaceholderText(/Vyhledat/);
    fireEvent.change(input, { target: { value: 'Beta' } });
    expect(onPick).toHaveBeenCalledWith(nodes[1]);
  });

  it('neznámé jméno onPick nevolá', () => {
    const onPick = vi.fn();
    render(<UniverseSearch nodes={nodes} onPick={onPick} />);
    const input = screen.getByPlaceholderText(/Vyhledat/);
    fireEvent.change(input, { target: { value: 'Xyz' } });
    expect(onPick).not.toHaveBeenCalled();
  });
});
