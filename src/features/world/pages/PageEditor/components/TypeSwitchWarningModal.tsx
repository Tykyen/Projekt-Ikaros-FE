import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/shared/ui';
import type { PageType } from '../../api/pages.types';
import type { LostDataDescriptor } from '../hooks/useTypeSwitchGuard';
import s from './TypeSwitchWarningModal.module.css';

interface Props {
  open: boolean;
  currentType: PageType;
  nextType: PageType | null;
  lostData: LostDataDescriptor[];
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 7.2i — Warning při změně typu, kdy data jiného typu zmizí ze vieweru.
 * Konzervativní default — data v BE zůstávají, jen se nezobrazují.
 * Pokud user vrátí původní type, vše je zpátky.
 */
export function TypeSwitchWarningModal({
  open,
  currentType,
  nextType,
  lostData,
  onConfirm,
  onCancel,
}: Props) {
  if (!nextType) return null;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Změnit typ stránky?"
      size="sm"
    >
      <div className={s.text}>
        <p>
          Měníš typ z <strong>{currentType}</strong> na{' '}
          <strong>{nextType}</strong>. Následující data zůstanou v databázi
          ale ve vieweru se nezobrazí:
        </p>
        <ul className={s.list}>
          {lostData.map((d, i) => (
            <li key={i}>
              <AlertTriangle size={14} aria-hidden className={s.icon} />
              {d.feature}
              {d.count !== undefined && ` (${d.count})`}
            </li>
          ))}
        </ul>
        <p className={s.hint}>
          Pokud se vrátíš na původní typ, data budou zase vidět.
        </p>
      </div>

      <div className={s.actions}>
        <button type="button" onClick={onCancel} className={s.btnSecondary}>
          Zrušit
        </button>
        <button type="button" onClick={onConfirm} className={s.btnPrimary}>
          Přepnout typ
        </button>
      </div>
    </Modal>
  );
}
