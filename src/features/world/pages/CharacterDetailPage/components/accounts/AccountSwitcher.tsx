import { Plus } from 'lucide-react';
import type { CharacterAccount } from '../../../api/characters.types';
import {
  formatCurrency,
  type WorldCurrencyItem,
} from '@/features/world/currencies/shared';
import s from './accounts.module.css';

interface Props {
  accounts: CharacterAccount[];
  activeId: string | null;
  onChange: (id: string) => void;
  onCreate: () => void;
  canCreate: boolean;
  /**
   * Spec 8.x-prep §4.1 — currencies pro `formatCurrency` v dropdown variant.
   * Pokud chybí (legacy callsite), spadne na surový code.
   */
  currencies?: WorldCurrencyItem[];
}

/**
 * 8.6 — Přepínač účtů. Do 4 účtů = horizontal tab list; nad 4 = dropdown.
 * „+ Nový účet" zobrazí jen pokud `canCreate` (omezuje na PJ + vlastník).
 */
export function AccountSwitcher({
  accounts,
  activeId,
  onChange,
  onCreate,
  canCreate,
  currencies = [],
}: Props) {
  if (accounts.length === 0) {
    return (
      <div className={s.switcherEmpty}>
        <p>Žádné účty zatím nejsou.</p>
        {canCreate && (
          <button type="button" className={s.createBtn} onClick={onCreate}>
            <Plus size={14} aria-hidden /> Nový účet
          </button>
        )}
      </div>
    );
  }

  if (accounts.length > 4) {
    return (
      <div className={s.switcherRow}>
        <select
          className={s.switcherSelect}
          value={activeId ?? ''}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Vybrat účet"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label} ({formatCurrency(a.balance, a.currency, currencies)})
            </option>
          ))}
        </select>
        {canCreate && (
          <button type="button" className={s.createBtn} onClick={onCreate}>
            <Plus size={14} aria-hidden /> Nový účet
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={s.switcherRow}>
      <div className={s.switcherTabs} role="tablist">
        {accounts.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={a.id === activeId}
            className={`${s.switcherTab} ${
              a.id === activeId ? s.switcherTabActive : ''
            }`}
            onClick={() => onChange(a.id)}
          >
            {a.label}
            {a.ownerCharacterIds.length > 1 && (
              <span className={s.sharedBadge} title="Sdílený účet">
                ⚭
              </span>
            )}
          </button>
        ))}
      </div>
      {canCreate && (
        <button type="button" className={s.createBtn} onClick={onCreate}>
          <Plus size={14} aria-hidden /> Nový účet
        </button>
      )}
    </div>
  );
}
