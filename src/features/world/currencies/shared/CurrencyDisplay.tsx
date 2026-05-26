import clsx from 'clsx';
import type { WorldCurrencyItem } from '../types';
import { convertAmount, formatCurrency } from './convertAmount';
import s from './CurrencyDisplay.module.css';

interface CurrencyDisplayProps {
  amount: number;
  currencyCode: string;
  items: WorldCurrencyItem[];
  /**
   * Pokud zadané, převede `amount` z `currencyCode` na `convertTo` a zobrazí
   * cílovou hodnotu. V tooltipu zachová originální `{amount} {currencyCode}`.
   */
  convertTo?: string;
  /** Default true. */
  showTooltip?: boolean;
  className?: string;
}

/**
 * Spec 11.4 §4.7b — read-only zobrazení částky v měně.
 *
 * Konzumenti: Shop ceny (11.3c), Character finance / účty (8.x), inventory.
 * V 11.4 ji používá jen tooltip v CurrenciesListSection (base equivalence).
 */
export function CurrencyDisplay({
  amount,
  currencyCode,
  items,
  convertTo,
  showTooltip = true,
  className,
}: CurrencyDisplayProps) {
  const converted =
    convertTo && convertTo !== currencyCode
      ? convertAmount(amount, currencyCode, convertTo, items)
      : null;

  const displayCode = converted !== null ? convertTo! : currencyCode;
  const displayValue = converted !== null ? converted : amount;
  const text = formatCurrency(displayValue, displayCode, items);

  const tooltip =
    showTooltip && converted !== null
      ? `= ${formatCurrency(amount, currencyCode, items)}`
      : undefined;

  return (
    <span className={clsx(s.display, className)} title={tooltip}>
      {text}
    </span>
  );
}
