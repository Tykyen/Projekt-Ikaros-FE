import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PiSheet } from '../PiSheet';
import type { CharacterDiary } from '../../../../../api/characters.types';

// PiSheet je osekaný derivát Matrixu — volá useCharacter (NPC clamp) a
// usePrintMode. V unit testu je mockujeme (žádný QueryClient / print kontext).
vi.mock('@/features/world/export/print', () => ({
  usePrintMode: () => false,
}));
vi.mock('@/features/world/pages/api/useCharacter', () => ({
  useCharacter: () => ({ data: { isNpc: false } }),
}));

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

describe('PiSheet (Příběhy Impéria — Matrix derivát)', () => {
  it('vyrenderuje sekce Fyzický stav, Body schopností, Schopnosti, Aspekty, Poznámky', () => {
    render(
      <PiSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />,
    );
    expect(screen.getByText('Fyzický stav')).toBeInTheDocument();
    expect(screen.getByText(/Body schopností/)).toBeInTheDocument();
    expect(screen.getByText('Schopnosti')).toBeInTheDocument();
    expect(screen.getByText('Aspekty')).toBeInTheDocument();
    expect(screen.getByText('Poznámky')).toBeInTheDocument();
  });

  it('NEMÁ osekané sekce (jazyky, přetlaky, runa, únava)', () => {
    render(
      <PiSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />,
    );
    expect(screen.queryByText('Jazyky')).not.toBeInTheDocument();
    expect(screen.queryByText('Přetlaky')).not.toBeInTheDocument();
    expect(screen.queryByText(/Runa/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Únava/)).not.toBeInTheDocument();
  });

  it('používá prefix `pi_` — přidání schopnosti zapíše pi_abilities', () => {
    const onChange = vi.fn();
    render(
      <PiSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={onChange} />,
    );
    fireEvent.click(screen.getByText('+ Přidat schopnost'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: {
        pi_abilities: JSON.stringify([{ label: '', value: '1' }]),
      },
    });
  });

  it('přidání aspektu zapíše pi_aspects (Vybitý default)', () => {
    const onChange = vi.fn();
    render(
      <PiSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={onChange} />,
    );
    fireEvent.click(screen.getByText('+ Přidat aspekt'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: {
        pi_aspects: JSON.stringify([{ label: '', value: 'Vybitý' }]),
      },
    });
  });

  it('postih za zranění se počítá z životů (2 → −1)', () => {
    render(
      <PiSheet
        {...commonProps}
        diary={makeDiary({ pi_health: '2' })}
        mode="view"
      />,
    );
    expect(screen.getByText('−1')).toBeInTheDocument();
  });

  it('ochrana je jediné políčko — 0 zobrazí „—", 1 „aktivní"', () => {
    const { rerender } = render(
      <PiSheet {...commonProps} diary={makeDiary({ pi_armor: '1' })} mode="view" />,
    );
    expect(screen.getByText('aktivní')).toBeInTheDocument();
    rerender(
      <PiSheet {...commonProps} diary={makeDiary({ pi_armor: '0' })} mode="view" />,
    );
    expect(screen.queryByText('aktivní')).not.toBeInTheDocument();
  });

  it('schopnost zobrazí slovní stupeň přes data-rank (5 → Mistr oboru)', () => {
    const { container } = render(
      <PiSheet
        {...commonProps}
        diary={makeDiary({
          pi_abilities: JSON.stringify([{ label: 'Šerm', value: '5' }]),
        })}
        mode="view"
      />,
    );
    const row = container.querySelector('.pi-skill');
    expect(row?.getAttribute('data-rank')).toBe('5 — Mistr oboru');
  });

  it('view mode: žádné edit prvky (+ Přidat)', () => {
    render(
      <PiSheet
        {...commonProps}
        diary={makeDiary({ pi_abilities: JSON.stringify([{ label: 'A', value: '1' }]) })}
        mode="view"
      />,
    );
    expect(screen.queryByText('+ Přidat schopnost')).not.toBeInTheDocument();
    expect(screen.queryByText('+ Přidat aspekt')).not.toBeInTheDocument();
  });

  it('izolace dat — čte pi_*, ignoruje fate_*', () => {
    render(
      <PiSheet
        {...commonProps}
        diary={makeDiary({
          pi_abilities: JSON.stringify([{ label: 'Šerm', value: '4' }]),
          fate_abilities: JSON.stringify([{ label: 'Cizí', value: '9' }]),
        })}
        mode="view"
      />,
    );
    expect(screen.getByText('Šerm')).toBeInTheDocument();
    expect(screen.queryByText('Cizí')).not.toBeInTheDocument();
  });
});
