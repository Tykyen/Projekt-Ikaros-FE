/**
 * 21.3f — panel „Klíč mapy": popisy k popiskům (číslo místnosti/budovy →
 * titulek + text pro PJ). Ukládá se s mapou a tiskne pod PNG legendu.
 */
import { X } from 'lucide-react';
import type { DungeonDecoration, DungeonNote } from '../types';
import styles from './GeneratorPanel.module.css';
import own from './NotesPanel.module.css';

export interface NotesPanelProps {
  decorations: DungeonDecoration[];
  notes: DungeonNote[];
  onSetNote: (label: string, title: string, text: string) => void;
  onRemoveNote: (label: string) => void;
  onClose: () => void;
}

/** Popisky z mapy: čísla vzestupně první, pak texty abecedně. */
function mapLabels(decorations: DungeonDecoration[]): string[] {
  const labels = [
    ...new Set(
      decorations
        .filter((d) => d.type === 'label' && d.label?.trim())
        .map((d) => (d.label as string).trim()),
    ),
  ];
  return labels.sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    const aNum = Number.isFinite(na) && a !== '';
    const bNum = Number.isFinite(nb) && b !== '';
    if (aNum && bNum) return na - nb;
    if (aNum) return -1;
    if (bNum) return 1;
    return a.localeCompare(b, 'cs');
  });
}

export function NotesPanel({
  decorations,
  notes,
  onSetNote,
  onRemoveNote,
  onClose,
}: NotesPanelProps): React.ReactElement {
  const labels = mapLabels(decorations);
  const noteFor = (label: string): DungeonNote | undefined =>
    notes.find((n) => n.label === label);
  // Osiřelé poznámky (popisek z mapy zmizel) — nabídnout smazání.
  const orphans = notes.filter((n) => !labels.includes(n.label));

  return (
    <aside className={styles.panel} aria-label="Klíč mapy">
      <div className={styles.header}>
        <h3 className={styles.title}>Klíč mapy</h3>
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Zavřít klíč mapy"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      {labels.length === 0 && orphans.length === 0 ? (
        <p className={styles.hint}>
          Na mapě nejsou žádné popisky. Polož nástrojem „Popisek" čísla nebo
          názvy (generátor čísluje sám) a tady k nim napiš, co v místě je —
          klíč se uloží s mapou a tiskne se pod PNG.
        </p>
      ) : (
        <div className={own.list}>
          {labels.map((label) => {
            const note = noteFor(label);
            return (
              <section key={label} className={own.item}>
                <div className={own.itemHead}>
                  <span className={own.itemLabel}>{label}</span>
                  <input
                    className={own.titleInput}
                    defaultValue={note?.title ?? ''}
                    placeholder="Název (např. Strážnice)"
                    maxLength={120}
                    onBlur={(e) =>
                      onSetNote(label, e.target.value, note?.text ?? '')
                    }
                  />
                </div>
                <textarea
                  className={own.textArea}
                  defaultValue={note?.text ?? ''}
                  placeholder="Text pro PJ — co tu je, kdo tu číhá, co jde najít…"
                  rows={3}
                  maxLength={2000}
                  onBlur={(e) =>
                    onSetNote(label, note?.title ?? '', e.target.value)
                  }
                />
              </section>
            );
          })}
          {orphans.length > 0 && (
            <section className={own.orphans}>
              <h4 className={own.orphansTitle}>Bez popisku na mapě</h4>
              {orphans.map((n) => (
                <div key={n.label} className={own.orphanRow}>
                  <span className={own.itemLabel}>{n.label}</span>
                  <span className={own.orphanText}>{n.title || n.text}</span>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    aria-label={`Smazat poznámku ${n.label}`}
                    onClick={() => onRemoveNote(n.label)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
      <p className={styles.hint}>
        Klíč se ukládá tlačítkem Uložit spolu s mapou (max 200 položek).
      </p>
    </aside>
  );
}
