import { LayoutGrid, List } from 'lucide-react';
import clsx from 'clsx';
import s from './ViewToggle.module.css';

export type UsersTabView = 'cards' | 'table';

interface ViewToggleProps {
  value: UsersTabView;
  onChange: (next: UsersTabView) => void;
}

/**
 * Spec 1.4 — design §4. Segmented control mezi Karty a Tabulka pro tab
 * Uživatelé. Default je Karty (rychlý vizuální lookup).
 */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className={s.toggle} role="group" aria-label="Přepnout zobrazení">
      <button
        type="button"
        className={clsx(s.button, value === 'cards' && s.buttonActive)}
        aria-pressed={value === 'cards'}
        onClick={() => onChange('cards')}
      >
        <LayoutGrid size={14} aria-hidden="true" />
        Karty
      </button>
      <button
        type="button"
        className={clsx(s.button, value === 'table' && s.buttonActive)}
        aria-pressed={value === 'table'}
        onClick={() => onChange('table')}
      >
        <List size={14} aria-hidden="true" />
        Tabulka
      </button>
    </div>
  );
}
