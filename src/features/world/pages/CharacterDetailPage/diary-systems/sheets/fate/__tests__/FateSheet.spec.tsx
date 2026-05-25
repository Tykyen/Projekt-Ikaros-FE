import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FateSheet } from '../FateSheet';
import type { CharacterDiary } from '../../../../../api/characters.types';

function makeDiary(
  customData: Record<string, unknown> = {},
): CharacterDiary {
  return {
    id: 'd1',
    characterId: 'c1',
    worldId: 'w1',
    sections: [],
    customData,
  };
}

const commonProps = {
  worldId: 'w1',
  worldSlug: 'testw',
  characterSlug: 'fate1',
};

describe('FateSheet (8.7i)', () => {
  it('vyrenderuje 4 hlavní sekce (Aspekty, Konflikty, Cíle, Dovednosti, Deník)', () => {
    render(
      <FateSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Aspekty')).toBeInTheDocument();
    expect(
      screen.getByText('Sekvenční konflikty (Stav)'),
    ).toBeInTheDocument();
    expect(screen.getByText('Cíle')).toBeInTheDocument();
    expect(screen.getByText('Dovednosti')).toBeInTheDocument();
    expect(screen.getByText('Deník / Poznámky')).toBeInTheDocument();
  });

  it('Conflict track má 5 stavů (V pořádku → Vyřazen)', () => {
    render(
      <FateSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    ['V pořádku', 'Lehké zranění', 'Těžší zranění', 'Vážnější násl.', 'Vyřazen'].forEach(
      (l) => {
        expect(screen.getByText(l)).toBeInTheDocument();
      },
    );
  });

  it('+ Nový aspekt vyvolá onChange s fate_aspects', () => {
    const onChange = vi.fn();
    render(
      <FateSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Nový aspekt'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        fate_aspects: JSON.stringify([{ name: '' }]),
      }),
    });
  });

  it('klik na conflict state nastaví fate_conflict', () => {
    const onChange = vi.fn();
    render(
      <FateSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Stav: Lehké zranění'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ fate_conflict: '1' }),
    });
  });

  it('skill pip click vyvolá onChange s aktualizovaným val', () => {
    const onChange = vi.fn();
    render(
      <FateSheet
        {...commonProps}
        diary={makeDiary({
          fate_skills: JSON.stringify([
            { name: 'Boj', val: '0', note: '' },
          ]),
        })}
        mode="edit"
        onChange={onChange}
      />,
    );
    // Najdi první pip (Boj pip 1 z 6)
    fireEvent.click(screen.getByLabelText('Boj pip 1 z 6'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        fate_skills: JSON.stringify([
          { name: 'Boj', val: '1', note: '' },
        ]),
      }),
    });
  });

  it('view mode disabluje vše', () => {
    render(
      <FateSheet
        {...commonProps}
        diary={makeDiary()}
        mode="view"
      />,
    );
    expect(screen.getByLabelText('Jméno postavy')).toBeDisabled();
    expect(screen.queryByText('+ Nový aspekt')).not.toBeInTheDocument();
  });
});
