import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import type { PageSection, PageSectionItem } from '../../../api/pages.types';
import s from './editors.module.css';

interface Props {
  sections: PageSection[];
  onChange: (sections: PageSection[]) => void;
}

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Přepočítá `order` dle pořadí v poli — zdroj pravdy je index. */
function reorder(sections: PageSection[]): PageSection[] {
  return sections.map((sec, i) => ({ ...sec, order: i }));
}

/**
 * 8.1 — Editor sekcí s položkami. Sdílený pro deník (8.1b) i výbavu (8.1d).
 * Sekce = název + rich-text obsah + položky `{text, quantity?, note?}`.
 * Pořadí řeší tlačítka ▲▼ (spolehlivé na mobilu i pro a11y).
 */
export function SectionListEditor({ sections, onChange }: Props) {
  const patchSection = (index: number, patch: Partial<PageSection>) =>
    onChange(
      sections.map((sec, i) => (i === index ? { ...sec, ...patch } : sec)),
    );

  const removeSection = (index: number) =>
    onChange(reorder(sections.filter((_, i) => i !== index)));

  const addSection = () =>
    onChange(
      reorder([
        ...sections,
        {
          id: newId(),
          title: '',
          content: '',
          order: sections.length,
          isCollapsed: false,
          items: [],
        },
      ]),
    );

  const moveSection = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(reorder(next));
  };

  const setItems = (index: number, items: PageSectionItem[]) =>
    patchSection(index, { items });

  return (
    <div className={s.stack}>
      {sections.map((section, i) => (
        <div key={section.id} className={s.card}>
          <div className={s.cardHead}>
            <div className={s.moveGroup}>
              <button
                type="button"
                className={s.moveBtn}
                onClick={() => moveSection(i, -1)}
                disabled={i === 0}
                title="Posunout nahoru"
                aria-label="Posunout sekci nahoru"
              >
                <ChevronUp size={14} aria-hidden />
              </button>
              <button
                type="button"
                className={s.moveBtn}
                onClick={() => moveSection(i, 1)}
                disabled={i === sections.length - 1}
                title="Posunout dolů"
                aria-label="Posunout sekci dolů"
              >
                <ChevronDown size={14} aria-hidden />
              </button>
            </div>
            <input
              className={`${s.field} ${s.rowGrow}`}
              value={section.title}
              placeholder="Název sekce"
              aria-label="Název sekce"
              onChange={(e) => patchSection(i, { title: e.target.value })}
            />
            <button
              type="button"
              className={s.iconBtn}
              onClick={() => removeSection(i)}
              title="Smazat sekci"
              aria-label="Smazat sekci"
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </div>

          <RichTextEditor
            value={section.content}
            onChange={(html) => patchSection(i, { content: html })}
            placeholder="Obsah sekce…"
          />

          <ItemListEditor
            items={section.items}
            onChange={(items) => setItems(i, items)}
          />
        </div>
      ))}

      <button type="button" className={s.addBtn} onClick={addSection}>
        <Plus size={13} aria-hidden /> Přidat sekci
      </button>
    </div>
  );
}

function ItemListEditor({
  items,
  onChange,
}: {
  items: PageSectionItem[];
  onChange: (items: PageSectionItem[]) => void;
}) {
  const patch = (index: number, p: Partial<PageSectionItem>) =>
    onChange(items.map((it, i) => (i === index ? { ...it, ...p } : it)));
  const remove = (index: number) =>
    onChange(items.filter((_, i) => i !== index));
  const add = () =>
    onChange([...items, { id: newId(), text: '', quantity: undefined }]);

  return (
    <div className={s.stack}>
      {items.map((item, i) => (
        <div key={item.id} className={s.itemRow}>
          <input
            className={`${s.field} ${s.rowGrow}`}
            value={item.text}
            placeholder="Položka"
            aria-label="Text položky"
            onChange={(e) => patch(i, { text: e.target.value })}
          />
          <input
            className={`${s.field} ${s.fieldNum}`}
            type="number"
            value={item.quantity ?? ''}
            placeholder="ks"
            aria-label="Množství"
            onChange={(e) =>
              patch(i, {
                quantity:
                  e.target.value === ''
                    ? undefined
                    : Number(e.target.value),
              })
            }
          />
          <input
            className={`${s.field} ${s.rowGrow}`}
            value={item.note ?? ''}
            placeholder="Poznámka"
            aria-label="Poznámka k položce"
            onChange={(e) =>
              patch(i, { note: e.target.value || undefined })
            }
          />
          <button
            type="button"
            className={s.iconBtn}
            onClick={() => remove(i)}
            title="Smazat položku"
            aria-label="Smazat položku"
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      ))}
      <button type="button" className={s.addBtn} onClick={add}>
        <Plus size={13} aria-hidden /> Přidat položku
      </button>
    </div>
  );
}
