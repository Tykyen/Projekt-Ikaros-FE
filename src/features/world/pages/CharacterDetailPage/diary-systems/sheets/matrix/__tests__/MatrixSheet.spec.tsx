import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatrixSheet } from '../MatrixSheet';
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
  characterSlug: 'katerina',
};

describe('MatrixSheet (8.7n)', () => {
  it('vyrenderuje 6 polí overview (Jméno, Stát, Magický gen, Datum, Body schopností, Body osudu)', () => {
    render(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Jméno')).toBeInTheDocument();
    expect(screen.getByLabelText('Stát')).toBeInTheDocument();
    expect(screen.getByLabelText('Magický gen')).toBeInTheDocument();
    expect(screen.getByText('Body schopností:')).toBeInTheDocument();
    expect(screen.getByLabelText('Body osudu')).toBeInTheDocument();
  });

  it('vyrenderuje Fyzický stav s 4 tiles (Životy/Runa/Vesta/Únava)', () => {
    render(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Životy')).toBeInTheDocument();
    expect(screen.getByLabelText('Runa')).toBeInTheDocument();
    expect(screen.getByLabelText('Vesta')).toBeInTheDocument();
    expect(screen.getByLabelText('Únava')).toBeInTheDocument();
  });

  it('Health penalty: život = 1 aktivuje -2 segment (orange)', () => {
    const { container } = render(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary({ matrix_health: '1' })}
        mode="view"
      />,
    );
    const segments = container.querySelectorAll(
      '.mx-stat-block:first-child .mx-penalty-segment',
    );
    expect(segments).toHaveLength(4);
    // -2 segment je index 2
    expect(segments[2].className).toContain('is-active');
    expect(segments[2].className).toContain('mx-penalty-segment--orange');
  });

  it('Tiredness penalty: únava 18 aktivuje „Bez" segment (purple)', () => {
    const { container } = render(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary({ matrix_tiredness: '18' })}
        mode="view"
      />,
    );
    const segments = container.querySelectorAll(
      '.mx-stat-block:last-child .mx-penalty-segment',
    );
    expect(segments).toHaveLength(5);
    expect(segments[3].className).toContain('is-active');
    expect(segments[3].className).toContain('mx-penalty-segment--purple');
  });

  it('Přetlaky: 4 typy (Fyzický/Magický/Diplomatický/Technický)', () => {
    render(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Fyzický')).toBeInTheDocument();
    expect(screen.getByText('Magický')).toBeInTheDocument();
    expect(screen.getByText('Diplomatický')).toBeInTheDocument();
    expect(screen.getByText('Technický')).toBeInTheDocument();
  });

  it('Přetlak klik na segment 2 nastaví matrix_pressure_physical na 2', () => {
    const onChange = vi.fn();
    render(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Fyzický přetlak 3 z 5'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        matrix_pressure_physical: '2',
      }),
    });
  });

  it('+ Přidat jazyk vytvoří TagValue {label:"", value:"C"}', () => {
    const onChange = vi.fn();
    render(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat jazyk'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        matrix_languages: JSON.stringify([{ label: '', value: 'C' }]),
      }),
    });
  });

  it('Magická schopnost: „Ohnivá magie" → renderuje magic 📘 icon', () => {
    const { container } = render(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary({
          matrix_abilities: JSON.stringify([
            { label: 'Ohnivá magie', value: '4' },
          ]),
        })}
        mode="view"
      />,
    );
    expect(container.querySelector('.mx-magic-link')).not.toBeNull();
  });

  it('Aspekt chip: klik na „Vybitý" přepne na „Nabitý"', () => {
    const onChange = vi.fn();
    render(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary({
          matrix_aspects: JSON.stringify([
            { label: 'Empatická', value: 'Vybitý' },
          ]),
        })}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('Vybitý'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        matrix_aspects: JSON.stringify([
          { label: 'Empatická', value: 'Nabitý' },
        ]),
      }),
    });
  });

  it('View mode disabluje vše', () => {
    render(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary({
          matrix_aspects: JSON.stringify([{ label: 'A1', value: 'Nabitý' }]),
        })}
        mode="view"
      />,
    );
    expect(screen.getByLabelText('Jméno')).toBeDisabled();
    expect(screen.queryByText('+ Přidat jazyk')).not.toBeInTheDocument();
    expect(screen.queryByText('+ Přidat aspekt')).not.toBeInTheDocument();
  });

  it('Body schopností auto-počítá used z `matrix_abilities` (triangle sum)', () => {
    // abilities: úroveň 3 → 1+2+3 = 6, úroveň 2 → 1+2 = 3; total = 9 / 70
    render(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary({
          matrix_abilityPoints: '70',
          matrix_abilities: JSON.stringify([
            { label: 'Programátor', value: '3' },
            { label: 'Démonologie', value: '2' },
          ]),
        })}
        mode="view"
      />,
    );
    // remaining = 70 - 9 = 61
    expect(
      screen.getByLabelText('Zbývající body schopností'),
    ).toHaveValue(61);
  });
});

// ── Aliasy v registry ────────────────────────────────────────

describe('Registry aliasy (8.7n)', () => {
  it('`dnd` → DnD 5e preset', async () => {
    const { getDiaryPreset } = await import('../../../registry');
    expect(getDiaryPreset('dnd').id).toBe('dnd5e');
  });

  it('`pribehy_imperia` → PI preset', async () => {
    const { getDiaryPreset } = await import('../../../registry');
    expect(getDiaryPreset('pribehy_imperia').id).toBe('pi');
  });

  it('`pribehy` → PI preset', async () => {
    const { getDiaryPreset } = await import('../../../registry');
    expect(getDiaryPreset('pribehy').id).toBe('pi');
  });

  it('Velká písmena rozpoznána (`MATRIX` → matrix)', async () => {
    const { getDiaryPreset } = await import('../../../registry');
    expect(getDiaryPreset('MATRIX').id).toBe('matrix');
  });

  it('Neznámé ID → generic fallback', async () => {
    const { getDiaryPreset } = await import('../../../registry');
    expect(getDiaryPreset('xyz_neexistuje').id).toBe('generic');
  });
});
