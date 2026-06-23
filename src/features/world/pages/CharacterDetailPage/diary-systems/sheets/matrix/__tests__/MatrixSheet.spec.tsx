import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MatrixSheet } from '../MatrixSheet';
import type { CharacterDiary } from '../../../../../api/characters.types';

function makeDiary(customData: Record<string, unknown> = {}): CharacterDiary {
  return { id: 'd1', characterId: 'c1', worldId: 'w1', sections: [], customData };
}

const commonProps = {
  worldId: 'w1',
  worldSlug: 'testw',
  characterSlug: 'katerina',
} as const;

/** Sheet používá <Link> (magie 📘) → render v Router contextu. */
function renderSheet(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('MatrixSheet (16.2a HUD)', () => {
  it('Hero: jméno read-only text, Stát/Povolání/Genom/Body osudu editovatelné', () => {
    renderSheet(
      <MatrixSheet {...commonProps} diary={makeDiary({ matrix_name: 'Zara' })} mode="edit" onChange={() => {}} />,
    );
    // jméno = text (ne input)
    expect(screen.getByText('Zara')).toBeInTheDocument();
    expect(screen.queryByLabelText('Jméno')).toBeNull();
    // editovatelná pole
    expect(screen.getByLabelText('Stát')).toBeInTheDocument();
    expect(screen.getByLabelText('Povolání')).toBeInTheDocument();
    expect(screen.getByLabelText('Magický genom')).toBeInTheDocument();
    expect(screen.getByLabelText('Body osudu')).toBeInTheDocument();
  });

  it('Fyzický stav: Životy/Runa/Ochrana/Únava (edit inputy)', () => {
    renderSheet(<MatrixSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />);
    expect(screen.getByLabelText('Životy')).toBeInTheDocument();
    expect(screen.getByLabelText('Runa')).toBeInTheDocument();
    expect(screen.getByLabelText('Ochrana')).toBeInTheDocument();
    expect(screen.getByLabelText('Únava')).toBeInTheDocument();
  });

  it('Penalty readout: život = 1 → postih −2', () => {
    const { container } = renderSheet(
      <MatrixSheet {...commonProps} diary={makeDiary({ matrix_health: '1' })} mode="view" />,
    );
    const badge = container.querySelector('.mx-status .badge');
    expect(badge?.textContent).toBe('−2');
  });

  it('Penalty readout: únava 18 → postih BEZ', () => {
    const { container } = renderSheet(
      <MatrixSheet {...commonProps} diary={makeDiary({ matrix_tiredness: '18' })} mode="view" />,
    );
    const badges = container.querySelectorAll('.mx-status .badge');
    expect(badges[1]?.textContent).toBe('BEZ');
  });

  it('Ochrana track má minimálně 3 segmenty', () => {
    const { container } = renderSheet(
      <MatrixSheet {...commonProps} diary={makeDiary({ matrix_armor: '1' })} mode="view" />,
    );
    const armSegs = container.querySelectorAll('.mx-seg.arm');
    expect(armSegs.length).toBeGreaterThanOrEqual(3);
  });

  it('Přetlaky: 4 typy (Fyzický/Magický/Diplomatický/Technický)', () => {
    renderSheet(<MatrixSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />);
    expect(screen.getByText('Fyzický')).toBeInTheDocument();
    expect(screen.getByText('Magický')).toBeInTheDocument();
    expect(screen.getByText('Diplomatický')).toBeInTheDocument();
    expect(screen.getByText('Technický')).toBeInTheDocument();
  });

  it('Přetlak klik na 3. segment nastaví pressure_physical na 2', () => {
    const onChange = vi.fn();
    renderSheet(<MatrixSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Fyzický 3 z 5'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ matrix_pressure_physical: '2' }),
    });
  });

  it('+ Přidat jazyk vytvoří TagValue {label:"", value:"A1"}', () => {
    const onChange = vi.fn();
    renderSheet(<MatrixSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Přidat jazyk'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        matrix_languages: JSON.stringify([{ label: '', value: 'A1' }]),
      }),
    });
  });

  it('Magie 📘 auto-match: „Ohnivá magie" → odkaz na pravidlo', () => {
    const { container } = renderSheet(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary({ matrix_abilities: JSON.stringify([{ label: 'Ohnivá magie', value: '4' }]) })}
        mode="view"
      />,
    );
    const mag = container.querySelector('.mx-skill__mag');
    expect(mag).not.toBeNull();
    expect(mag?.getAttribute('href')).toBe('/svet/testw/ohniva-magie');
  });

  it('Magie 📘: nemagická schopnost (Hacker) → žádné 📘', () => {
    const { container } = renderSheet(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary({ matrix_abilities: JSON.stringify([{ label: 'Hacker', value: '4' }]) })}
        mode="view"
      />,
    );
    expect(container.querySelector('.mx-skill__mag')).toBeNull();
  });

  it('Aspekt chip: klik na „Vybitý" přepne na „Nabitý"', () => {
    const onChange = vi.fn();
    renderSheet(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary({ matrix_aspects: JSON.stringify([{ label: 'Empatická', value: 'Vybitý' }]) })}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('Vybitý'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        matrix_aspects: JSON.stringify([{ label: 'Empatická', value: 'Nabitý' }]),
      }),
    });
  });

  it('View mode: žádná „+ Přidat" tlačítka, jméno není input', () => {
    renderSheet(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary({ matrix_name: 'Zara' })}
        mode="view"
      />,
    );
    expect(screen.queryByText('+ Přidat jazyk')).not.toBeInTheDocument();
    expect(screen.queryByText('+ Přidat aspekt')).not.toBeInTheDocument();
    expect(screen.queryByText('+ Přidat schopnost')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Stát')).toBeNull(); // view = text, ne input
  });

  it('Body schopností: used = trojúhelník + aspekty nad 3 ×6', () => {
    // abilities: 3→6, 2→3 = 9; aspekty 4 → (4-3)*6 = 6; total 15 / 70
    const { container } = renderSheet(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary({
          matrix_abilityPoints: '70',
          matrix_abilities: JSON.stringify([
            { label: 'Programátor', value: '3' },
            { label: 'Vyjednavač', value: '2' },
          ]),
          matrix_aspects: JSON.stringify([
            { label: 'a', value: 'Vybitý' },
            { label: 'b', value: 'Vybitý' },
            { label: 'c', value: 'Vybitý' },
            { label: 'd', value: 'Vybitý' },
          ]),
        })}
        mode="view"
      />,
    );
    const val = container.querySelector('.mx-budget__val')?.textContent ?? '';
    expect(val).toContain('15');
    expect(val).toContain('70');
  });

  it('Přečerpání: used > strop → warn hláška', () => {
    const { container } = renderSheet(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary({
          matrix_abilityPoints: '5',
          matrix_abilities: JSON.stringify([{ label: 'X', value: '5' }]), // 15 b > 5
        })}
        mode="view"
      />,
    );
    expect(container.querySelector('.mx-budget__warn')).not.toBeNull();
    expect(container.querySelector('.mx-budget__fill.over')).not.toBeNull();
  });

  it('Validace: schopnost s úrovní > počet aspektů → warn + zvýraznění', () => {
    const { container } = renderSheet(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary({
          matrix_abilities: JSON.stringify([{ label: 'X', value: '5' }]),
          matrix_aspects: JSON.stringify([{ label: 'a', value: 'Vybitý' }]), // 1 aspekt < 5
        })}
        mode="view"
      />,
    );
    expect(container.querySelector('.mx-warn')).not.toBeNull();
    expect(container.querySelector('.mx-skill.toohigh')).not.toBeNull();
  });

  it('Tooltip stupně: úroveň 5 → data-tip „5 — Mistr oboru"', () => {
    const { container } = renderSheet(
      <MatrixSheet
        {...commonProps}
        diary={makeDiary({ matrix_abilities: JSON.stringify([{ label: 'X', value: '5' }]) })}
        mode="view"
      />,
    );
    const lvl = container.querySelector('.mx-skill__lvl');
    expect(lvl?.getAttribute('data-tip')).toBe('5 — Mistr oboru');
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
