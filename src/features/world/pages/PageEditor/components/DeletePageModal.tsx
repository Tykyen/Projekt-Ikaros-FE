import { useState } from 'react';
import { AlertOctagon, Trash2 } from 'lucide-react';
import { Modal } from '@/shared/ui';
import s from './DeletePageModal.module.css';

interface Props {
  open: boolean;
  pageTitle: string;
  pageSlug: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 7.2 — Confirm modal pro smazání stránky. User musí vepsat slug, aby
 * potvrdil — chrání proti misclick zvlášť na touch zařízeních.
 */
export function DeletePageModal({
  open,
  pageTitle,
  pageSlug,
  isPending,
  onConfirm,
  onCancel,
}: Props) {
  const [confirmation, setConfirmation] = useState('');
  const canConfirm = confirmation.trim() === pageSlug;

  return (
    <Modal open={open} onClose={onCancel} title="Smazat stránku?" size="sm">
      <div className={s.text}>
        <AlertOctagon size={28} aria-hidden className={s.icon} />
        <p>
          Smažeš stránku <strong>{pageTitle}</strong>. Tato akce je nevratná —
          obsah, sekce, tabulka, gallery, videa i přístupová práva budou ztracena.
        </p>
        <p>
          Odkazy z jiných stránek (`[[wikilink]]`) na tuto stránku budou
          přeškrtnuté.
        </p>
        <label className={s.confirm}>
          <span>
            Pro potvrzení napiš slug stránky: <code>{pageSlug}</code>
          </span>
          {/* eslint-disable jsx-a11y/no-autofocus -- autofocus na potvrzovací pole je záměr: modal trapuje fokus */}
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={pageSlug}
            className={s.input}
            autoFocus
          />
          {/* eslint-enable jsx-a11y/no-autofocus */}
        </label>
      </div>

      <div className={s.actions}>
        <button type="button" onClick={onCancel} className={s.btnSecondary}>
          Zrušit
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canConfirm || isPending}
          className={s.btnDanger}
        >
          <Trash2 size={14} aria-hidden />
          {isPending ? 'Mažu…' : 'Smazat trvale'}
        </button>
      </div>
    </Modal>
  );
}
