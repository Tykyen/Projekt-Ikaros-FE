import { forwardRef, type SelectHTMLAttributes } from 'react';
import clsx from 'clsx';
import type { WorldCurrencyItem } from '../types';
import s from './CurrencySelect.module.css';

interface CurrencySelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (code: string) => void;
  items: WorldCurrencyItem[];
  /** Zobrazit symbol vedle code? Default true. */
  showSymbol?: boolean;
  /** Filter pro užší výběr (např. „jen ne-base měny"). */
  filterBy?: (item: WorldCurrencyItem) => boolean;
  ariaLabel?: string;
}

/**
 * Spec 11.4 §4.7b — sdílený currency select.
 *
 * Reuse: stránka převodníku (11.4), Shop switcher preferované měny (11.3c),
 * AccountPanel měna účtu (8.x), kdekoli kde uživatel vybírá měnu.
 *
 * Implementace = nativní `<select>` (jednoduchost > knihovny, accessibility
 * zdarma, mobil-friendly native picker).
 */
export const CurrencySelect = forwardRef<HTMLSelectElement, CurrencySelectProps>(
  (
    {
      value,
      onChange,
      items,
      showSymbol = true,
      filterBy,
      ariaLabel = 'Vyber měnu',
      className,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const visible = filterBy ? items.filter(filterBy) : items;
    return (
      <select
        ref={ref}
        className={clsx(s.select, className)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || visible.length === 0}
        aria-label={ariaLabel}
        {...rest}
      >
        {visible.length === 0 && <option value="">—</option>}
        {visible.map((item) => {
          const sym = showSymbol && item.symbol?.trim() ? ` ${item.symbol}` : '';
          return (
            <option key={item.code} value={item.code}>
              {item.code}
              {sym} — {item.name}
            </option>
          );
        })}
      </select>
    );
  },
);
CurrencySelect.displayName = 'CurrencySelect';
