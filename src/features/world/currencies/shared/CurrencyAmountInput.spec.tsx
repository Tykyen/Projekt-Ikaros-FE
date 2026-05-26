import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencyAmountInput } from './CurrencyAmountInput';
import type { WorldCurrencyItem } from '../types';

const items: WorldCurrencyItem[] = [
  { id: 'a', code: 'ZL', name: 'Zlaťák', symbol: 'Zl', rate: 1.0 },
  { id: 'b', code: 'ST', name: 'Stříbrňák', symbol: 'St', rate: 0.1 },
];

describe('CurrencyAmountInput', () => {
  it('volá onAmountChange při změně čísla', () => {
    const onAmountChange = vi.fn();
    render(
      <CurrencyAmountInput
        amount={100}
        currencyCode="ZL"
        onAmountChange={onAmountChange}
        onCurrencyChange={() => {}}
        items={items}
      />,
    );
    fireEvent.change(screen.getByLabelText('Částka'), {
      target: { value: '250' },
    });
    expect(onAmountChange).toHaveBeenCalledWith(250);
  });

  it('volá onAmountChange("") při vymazání', () => {
    const onAmountChange = vi.fn();
    render(
      <CurrencyAmountInput
        amount={100}
        currencyCode="ZL"
        onAmountChange={onAmountChange}
        onCurrencyChange={() => {}}
        items={items}
      />,
    );
    fireEvent.change(screen.getByLabelText('Částka'), { target: { value: '' } });
    expect(onAmountChange).toHaveBeenCalledWith('');
  });

  it('volá onCurrencyChange při změně select', () => {
    const onCurrencyChange = vi.fn();
    render(
      <CurrencyAmountInput
        amount={50}
        currencyCode="ZL"
        onAmountChange={() => {}}
        onCurrencyChange={onCurrencyChange}
        items={items}
      />,
    );
    fireEvent.change(screen.getByLabelText('Měna'), { target: { value: 'ST' } });
    expect(onCurrencyChange).toHaveBeenCalledWith('ST');
  });

  it('readOnlyAmount → amount input má readonly', () => {
    render(
      <CurrencyAmountInput
        amount={42}
        currencyCode="ZL"
        onAmountChange={() => {}}
        onCurrencyChange={() => {}}
        items={items}
        readOnlyAmount
      />,
    );
    const input = screen.getByLabelText('Částka') as HTMLInputElement;
    expect(input.readOnly).toBe(true);
  });

  it('disabled → oba prvky disabled', () => {
    render(
      <CurrencyAmountInput
        amount={0}
        currencyCode="ZL"
        onAmountChange={() => {}}
        onCurrencyChange={() => {}}
        items={items}
        disabled
      />,
    );
    expect((screen.getByLabelText('Částka') as HTMLInputElement).disabled).toBe(
      true,
    );
    expect(
      (screen.getByLabelText('Měna') as HTMLSelectElement).disabled,
    ).toBe(true);
  });
});
