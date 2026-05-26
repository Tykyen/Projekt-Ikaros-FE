import clsx from 'clsx';
import { CurrencySelect } from './CurrencySelect';
import type { WorldCurrencyItem } from '../types';
import s from './CurrencyAmountInput.module.css';

interface CurrencyAmountInputProps {
  amount: number | '';
  currencyCode: string;
  onAmountChange: (amount: number | '') => void;
  onCurrencyChange: (code: string) => void;
  items: WorldCurrencyItem[];
  /** Pokud true, amount input je read-only (např. cíl převodu). */
  readOnlyAmount?: boolean;
  /** Disabled jak amount, tak select. */
  disabled?: boolean;
  amountAriaLabel?: string;
  currencyAriaLabel?: string;
  className?: string;
  /** Pro `step` na number inputu (default 0.01). */
  amountStep?: number;
  /** Pro min hodnotu (default 0). */
  amountMin?: number;
}

/**
 * Spec 11.4 §4.7b — combo number input + currency select.
 *
 * Reuse: stránka převodníku (4.2 — `from` i `to` řádek), Character finance
 * transakce (8.x), shop search-by-price filter (možnost).
 */
export function CurrencyAmountInput({
  amount,
  currencyCode,
  onAmountChange,
  onCurrencyChange,
  items,
  readOnlyAmount,
  disabled,
  amountAriaLabel = 'Částka',
  currencyAriaLabel = 'Měna',
  className,
  amountStep = 0.01,
  amountMin = 0,
}: CurrencyAmountInputProps) {
  return (
    <div className={clsx(s.wrap, className)}>
      <input
        type="number"
        inputMode="decimal"
        className={s.amount}
        value={amount}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            onAmountChange('');
            return;
          }
          const num = Number(raw);
          if (Number.isFinite(num)) onAmountChange(num);
        }}
        readOnly={readOnlyAmount}
        disabled={disabled}
        step={amountStep}
        min={amountMin}
        aria-label={amountAriaLabel}
      />
      <CurrencySelect
        className={s.select}
        value={currencyCode}
        onChange={onCurrencyChange}
        items={items}
        disabled={disabled}
        ariaLabel={currencyAriaLabel}
      />
    </div>
  );
}
