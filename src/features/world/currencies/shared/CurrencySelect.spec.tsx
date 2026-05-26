import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencySelect } from './CurrencySelect';
import type { WorldCurrencyItem } from '../types';

const items: WorldCurrencyItem[] = [
  { id: 'a', code: 'ZL', name: 'Zlaťák', symbol: 'Zl', rate: 1.0 },
  { id: 'b', code: 'ST', name: 'Stříbrňák', symbol: 'St', rate: 0.1 },
  { id: 'c', code: 'MD', name: 'Měďák', symbol: '', rate: 0.01 },
];

describe('CurrencySelect', () => {
  it('renderuje option pro každou měnu', () => {
    render(<CurrencySelect value="ZL" onChange={() => {}} items={items} />);
    expect(screen.getByText(/ZL Zl — Zlaťák/)).toBeInTheDocument();
    expect(screen.getByText(/ST St — Stříbrňák/)).toBeInTheDocument();
    expect(screen.getByText(/MD — Měďák/)).toBeInTheDocument();
  });

  it('volá onChange při změně value', () => {
    const onChange = vi.fn();
    render(<CurrencySelect value="ZL" onChange={onChange} items={items} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ST' } });
    expect(onChange).toHaveBeenCalledWith('ST');
  });

  it('filterBy schová položky které nesplňují podmínku', () => {
    render(
      <CurrencySelect
        value="ST"
        onChange={() => {}}
        items={items}
        filterBy={(i) => i.code !== 'ZL'}
      />,
    );
    expect(screen.queryByText(/Zlaťák/)).not.toBeInTheDocument();
    expect(screen.getByText(/Stříbrňák/)).toBeInTheDocument();
  });

  it('showSymbol=false skryje symbol', () => {
    render(
      <CurrencySelect
        value="ZL"
        onChange={() => {}}
        items={items}
        showSymbol={false}
      />,
    );
    expect(screen.getByText('ZL — Zlaťák')).toBeInTheDocument();
    expect(screen.queryByText(/ZL Zl/)).not.toBeInTheDocument();
  });

  it('disabled když items je prázdné, vykreslí placeholder option', () => {
    render(<CurrencySelect value="" onChange={() => {}} items={[]} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
