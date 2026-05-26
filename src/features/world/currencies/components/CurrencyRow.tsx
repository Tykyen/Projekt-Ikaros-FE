import { useState } from 'react';
import { KebabMenu, type KebabMenuItem } from '@/shared/ui/KebabMenu/KebabMenu';
import { Button } from '@/shared/ui/Button/Button';
import type { WorldCurrencyItem } from '../types';
import s from './CurrencyRow.module.css';

interface CurrencyRowProps {
  item: WorldCurrencyItem;
  isBase: boolean;
  canEdit: boolean;
  canAddOrDelete: boolean;
  onEdit: (item: WorldCurrencyItem) => void;
  onDelete: (item: WorldCurrencyItem) => void;
  onSetAsBase: (item: WorldCurrencyItem) => void;
}

/**
 * Spec 11.4 §4.3 — jeden řádek v seznamu měn.
 *
 * Desktop = tabulkový řádek (parent `<table>`). Mobil = karta (CSS @media
 * v ListSection přepne layout). Tato komponenta renderuje `<tr>` —
 * mobilní card variant je řešen overrides v CurrenciesListSection.module.css.
 */
export function CurrencyRow({
  item,
  isBase,
  canEdit,
  canAddOrDelete,
  onEdit,
  onDelete,
  onSetAsBase,
}: CurrencyRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  const items: KebabMenuItem[] = [];
  if (canEdit) {
    items.push({
      key: 'edit',
      label: 'Upravit',
      onClick: () => {
        setMenuOpen(false);
        onEdit(item);
      },
    });
  }
  if (canEdit && !isBase) {
    items.push({
      key: 'set-base',
      label: 'Nastavit jako základ',
      onClick: () => {
        setMenuOpen(false);
        onSetAsBase(item);
      },
    });
  }
  if (canAddOrDelete && !isBase) {
    items.push({
      key: 'delete',
      label: 'Smazat',
      variant: 'danger',
      onClick: () => {
        setMenuOpen(false);
        onDelete(item);
      },
    });
  }

  const showKebab = items.length > 0;

  return (
    <tr className={s.row} data-base={isBase || undefined}>
      <td className={s.cellCode}>
        <span className={s.code}>{item.code}</span>
        {isBase && (
          <span className={s.baseBadge} title="Základní měna (kurz = 1.0)">
            ⚓ základ
          </span>
        )}
      </td>
      <td className={s.cellName}>{item.name}</td>
      <td className={s.cellSymbol}>{item.symbol || '—'}</td>
      <td className={s.cellRate}>{formatRate(item.rate)}</td>
      <td className={s.cellActions}>
        {showKebab && (
          <>
            <Button
              ref={setAnchor}
              variant="ghost"
              size="sm"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={`Akce pro ${item.name}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              ⋯
            </Button>
            <KebabMenu
              anchor={anchor}
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              items={items}
            />
          </>
        )}
      </td>
    </tr>
  );
}

function formatRate(rate: number): string {
  // Drž 4 desetinná místa shodně s BE, ořež trailing zeros
  return new Intl.NumberFormat('cs-CZ', {
    maximumFractionDigits: 6,
  }).format(rate);
}
