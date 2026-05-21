import { AlertOctagon } from 'lucide-react';
import { Modal } from '@/shared/ui';
import s from './ConflictModal.module.css';

interface Props {
  open: boolean;
  onRefresh: () => void;
  onOverwrite: () => void;
  onCancel: () => void;
}

/**
 * 7.2k — Modal pro 409 PAGE_CONFLICT (optimistic concurrency).
 * Stránka byla mezitím upravena jiným uživatelem nebo jiným tabem.
 *
 * 3 volby:
 *  • Refresh = znovu načíst aktuální verzi (ztratíš lokální změny)
 *  • Přepsat = poslat update znovu bez `expectedUpdatedAt` (přepíše jejich změny)
 *  • Zrušit = zůstat v editoru s lokálními změnami (user rozhodne ručně)
 */
export function ConflictModal({ open, onRefresh, onOverwrite, onCancel }: Props) {
  return (
    <Modal open={open} onClose={onCancel} title="Konflikt při ukládání" size="md">
      <div className={s.text}>
        <AlertOctagon size={32} aria-hidden className={s.icon} />
        <p>
          Stránka byla mezitím upravena někým jiným (nebo v jiném tabu). Tvé
          lokální změny ještě nejsou uloženy.
        </p>
        <p className={s.hint}>
          Co chceš udělat?
        </p>
        <ul className={s.options}>
          <li>
            <strong>Načíst aktuální verzi</strong> — server data se načte;
            tvé neulozené změny zmizí.
          </li>
          <li>
            <strong>Přepsat</strong> — pošle se tvá verze a přepíše server
            změny. Ujisti se, že to chceš.
          </li>
          <li>
            <strong>Zrušit</strong> — zůstaň v editoru, rozhodni se později
            (lokální draft je v localStorage).
          </li>
        </ul>
      </div>

      <div className={s.actions}>
        <button type="button" onClick={onCancel} className={s.btnSecondary}>
          Zrušit
        </button>
        <button type="button" onClick={onRefresh} className={s.btnSecondary}>
          Načíst aktuální
        </button>
        <button type="button" onClick={onOverwrite} className={s.btnDanger}>
          Přepsat
        </button>
      </div>
    </Modal>
  );
}
