import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import s from './KeyboardShortcutsHelp.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pokud true, „Upravit" shortcut bude v seznamu. */
  canEdit: boolean;
}

const SHORTCUTS: Array<{ keys: string[]; label: string; condition?: keyof Props }> = [
  { keys: ['Ctrl', 'K'], label: 'Otevřít vyhledávání stránek (palette)' },
  { keys: ['F'], label: 'Přidat/odebrat z oblíbených' },
  { keys: ['E'], label: 'Upravit stránku', condition: 'canEdit' },
  { keys: ['G', 'S'], label: 'Přejít na seznam stránek' },
  { keys: ['Esc'], label: 'Zavřít lightbox / paletu / popup' },
  { keys: ['?'], label: 'Zobrazit tuto nápovědu' },
];

/**
 * 7.1k — Help overlay pod klávesou `?`. Stručná tabulka shortcutů.
 */
export function KeyboardShortcutsHelp({ open, onClose, canEdit }: Props) {
  if (!open) return null;

  return createPortal(
    // Backdrop klik = myší zkratka pro zavření; klávesová cesta existuje
    // (zavírací křížek).
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div className={s.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      {/* Obsahový obal: onClick jen stopPropagation; zavření přes křížek. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className={s.panel}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <header className={s.header}>
          <h2>Klávesové zkratky</h2>
          <button type="button" onClick={onClose} aria-label="Zavřít" className={s.closeBtn}>
            <X size={18} aria-hidden />
          </button>
        </header>
        <table className={s.table}>
          <tbody>
            {SHORTCUTS.filter((sc) =>
              !sc.condition ? true : sc.condition === 'canEdit' ? canEdit : true,
            ).map((sc) => (
              <tr key={sc.label}>
                <td className={s.keys}>
                  {sc.keys.map((k, i) => (
                    <span key={i}>
                      <kbd className={s.kbd}>{k}</kbd>
                      {i < sc.keys.length - 1 && <span className={s.keysSep}>+</span>}
                    </span>
                  ))}
                </td>
                <td className={s.desc}>{sc.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={s.note}>
          Shortcuty nefungují, když píšeš v textovém poli.
        </p>
      </div>
    </div>,
    document.body,
  );
}
