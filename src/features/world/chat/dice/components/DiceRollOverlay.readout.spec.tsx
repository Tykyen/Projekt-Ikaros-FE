import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Readout, type DiceRollEvent } from './DiceRollOverlay';
import type { DicePayload } from '../lib/dicePayload';

function event(payload: DicePayload): DiceRollEvent {
  return { payload, skinId: null, rollerName: 'Duch', timestamp: 1 };
}

describe('DiceRollOverlay Readout — breakdown rovnice (16.1a)', () => {
  it('s modifierem ukáže součet kostek i velikost schopnosti odděleně', () => {
    const payload: DicePayload = {
      type: 'fate',
      faces: ['-', '0', '0', '0'],
      sum: -1,
      total: 3,
      label: 'Ledový dotek',
      modifier: 4,
    };
    const { getByText } = render(<Readout roll={event(payload)} show />);
    expect(getByText('Ledový dotek')).toBeTruthy();
    expect(getByText('(+4)')).toBeTruthy(); // velikost schopnosti
    expect(getByText('-1')).toBeTruthy(); // součet kostek (hod)
    expect(getByText('+3')).toBeTruthy(); // výsledek
  });

  it('bez modifieru součet kostek NEzdvojuje výsledek (jen total)', () => {
    const payload: DicePayload = {
      type: 'fate',
      faces: ['+', '+', '0', '0'],
      sum: 2,
      total: 2,
      label: 'Test',
      modifier: 0,
    };
    const { queryAllByText } = render(<Readout roll={event(payload)} show />);
    // total renderuje „+2"; pokud by se ukázal i operand součtu, byly by dva.
    expect(queryAllByText('+2')).toHaveLength(1);
  });

  it('show=false → nic se nevykreslí', () => {
    const payload: DicePayload = {
      type: 'fate',
      faces: ['0', '0', '0', '0'],
      sum: 0,
      total: 0,
    };
    const { container } = render(<Readout roll={event(payload)} show={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('8.7q: crit=success → „Fatální úspěch" místo výpočtu', () => {
    const payload = {
      type: 'd20',
      faces: [20],
      sum: 20,
      total: 23,
      label: 'Iniciativa',
      modifier: 3,
      crit: 'success',
    } as DicePayload;
    const { getByText, queryByText } = render(
      <Readout roll={event(payload)} show />,
    );
    expect(getByText('Fatální úspěch')).toBeTruthy();
    // Výpočet (=, total) se NEzobrazí.
    expect(queryByText('=')).toBeNull();
    expect(queryByText('+23')).toBeNull();
  });

  it('8.7q: crit=fail → „Fatální neúspěch"', () => {
    const payload = {
      type: 'd20',
      faces: [1],
      sum: 1,
      total: 4,
      label: 'Iniciativa',
      modifier: 3,
      crit: 'fail',
    } as DicePayload;
    const { getByText } = render(<Readout roll={event(payload)} show />);
    expect(getByText('Fatální neúspěch')).toBeTruthy();
  });

  it('16b DrdH: rozpis útoku — složky se znaménkem + zranění za výsledkem', () => {
    const payload = {
      type: 'd6+',
      faces: [3],
      sum: 3,
      total: 8,
      label: 'Útok: Květinový meč',
      modifier: 5,
      breakdown: [
        { label: 'útoč', value: 6 },
        { label: 'Sil', value: -1 },
      ],
      damage: '+1',
    } as DicePayload;
    const { getByText } = render(<Readout roll={event(payload)} show />);
    expect(getByText('Útok: Květinový meč')).toBeTruthy();
    expect(getByText('útoč +6')).toBeTruthy();
    expect(getByText('Sil −1')).toBeTruthy();
    expect(getByText('hod +3')).toBeTruthy();
    expect(getByText('+8')).toBeTruthy(); // výsledek
    expect(getByText('/ +1')).toBeTruthy(); // zranění
  });

  it('16b DrdH: obrana — breakdown bez zranění (žádné „/")', () => {
    const payload = {
      type: 'd6+',
      faces: [4],
      sum: 4,
      total: 7,
      label: 'Obrana: Štít',
      modifier: 3,
      breakdown: [
        { label: 'obr', value: 2 },
        { label: 'Obr', value: 1 },
      ],
    } as DicePayload;
    const { getByText, queryByText } = render(<Readout roll={event(payload)} show />);
    expect(getByText('obr +2')).toBeTruthy();
    expect(getByText('Obr +1')).toBeTruthy();
    expect(getByText('+7')).toBeTruthy();
    expect(queryByText(/^\//)).toBeNull(); // žádný damage span
  });
});
