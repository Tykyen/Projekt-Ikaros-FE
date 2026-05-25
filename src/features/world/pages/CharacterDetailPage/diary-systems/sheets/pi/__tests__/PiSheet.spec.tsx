import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PiSheet } from '../PiSheet';
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
  characterSlug: 'pi1',
};

describe('PiSheet (8.7j)', () => {
  it('vyrenderuje sekce Aspekty, Konflikty, Cíle, Dovednosti, Deník', () => {
    render(
      <PiSheet
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

  it('PI používá prefix `pi_` (oddělené od fate_)', () => {
    const onChange = vi.fn();
    render(
      <PiSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Nový aspekt'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        pi_aspects: JSON.stringify([{ name: '' }]),
      }),
    });
  });

  it('PI conflict track funguje identicky s Fate (sdílená komponenta)', () => {
    const onChange = vi.fn();
    render(
      <PiSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Stav: Vyřazen'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ pi_conflict: '4' }),
    });
  });

  it('PI a Fate sdílí strukturu, ale data prefix odlišný — žádná kolize', () => {
    // Test že PiSheet inicializovaný s `pi_aspects` v customData zobrazí
    // aspekt, zatímco fate_aspects v customData ignoruje.
    render(
      <PiSheet
        {...commonProps}
        diary={makeDiary({
          pi_aspects: JSON.stringify([{ name: 'Šlechtic z Pluku' }]),
          fate_aspects: JSON.stringify([
            { name: 'Tohle ignorujem (jiný preset)' },
          ]),
        })}
        mode="view"
      />,
    );
    expect(
      screen.getByDisplayValue('Šlechtic z Pluku'),
    ).toBeInTheDocument();
    expect(
      screen.queryByDisplayValue('Tohle ignorujem (jiný preset)'),
    ).not.toBeInTheDocument();
  });

  it('view mode disabluje all', () => {
    render(
      <PiSheet
        {...commonProps}
        diary={makeDiary({
          pi_aspects: JSON.stringify([{ name: 'A1' }]),
        })}
        mode="view"
      />,
    );
    expect(screen.getByLabelText('Jméno postavy')).toBeDisabled();
    expect(screen.queryByText('+ Nový aspekt')).not.toBeInTheDocument();
  });
});
