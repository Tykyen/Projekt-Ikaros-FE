import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CharacterCard } from '../CharacterCard';
import type { CharacterDirectoryEntry } from '../../../api/characters.types';

function entry(
  over: Partial<CharacterDirectoryEntry> = {},
): CharacterDirectoryEntry {
  return {
    id: '1',
    slug: 'aragorn',
    name: 'Aragorn',
    isNpc: false,
    kind: 'persona',
    imageUrl: 'https://cdn/a.png',
    ...over,
  };
}

describe('CharacterCard — focal avatar', () => {
  it('aplikuje focal point na avatar (object-position)', () => {
    render(
      <MemoryRouter>
        <CharacterCard
          entry={entry({ imageFocalX: 50, imageFocalY: 25 })}
          worldSlug="w"
        />
      </MemoryRouter>,
    );
    const img = document.querySelector('img');
    expect(img?.style.objectPosition).toBe('50% 25%');
  });

  it('bez focal → default střed 50% 50%', () => {
    render(
      <MemoryRouter>
        <CharacterCard entry={entry()} worldSlug="w" />
      </MemoryRouter>,
    );
    const img = document.querySelector('img');
    expect(img?.style.objectPosition).toBe('50% 50%');
  });
});
