import { List, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { PagePicker } from '../components/PagePicker';
import type { MenuItem, PageDirectoryEntry } from '../../api/pages.types';
import s from './MenuPanel.module.css';

interface Props {
  menu: MenuItem[];
  onChange: (menu: MenuItem[]) => void;
  /** Adresář stránek světa pro PagePicker. */
  directory: PageDirectoryEntry[];
}

/**
 * 7.2 — Editor `menu[]` pro typ Seznam. Položka = label + odkaz na stránku
 * tohoto světa (PagePicker). Reorder šipkami. Pokud je label při výběru
 * stránky prázdné, předvyplní se title stránky (auto-label).
 */
export function MenuPanel({ menu, onChange, directory }: Props) {
  const sorted = [...menu].sort((a, b) => a.order - b.order);

  function addItem() {
    onChange([...sorted, { label: '', href: '', order: sorted.length }]);
  }

  function updateItem(idx: number, patch: Partial<MenuItem>) {
    onChange(sorted.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function pickPage(idx: number, slug: string, title: string) {
    const current = sorted[idx];
    const patch: Partial<MenuItem> = { href: slug };
    // Auto-label: jen pokud uživatel nic nevyplnil ručně.
    if (!current.label.trim() && title) patch.label = title;
    updateItem(idx, patch);
  }

  function removeItem(idx: number) {
    onChange(
      sorted.filter((_, i) => i !== idx).map((it, i) => ({ ...it, order: i })),
    );
  }

  function moveItem(idx: number, direction: 'up' | 'down') {
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next.map((it, i) => ({ ...it, order: i })));
  }

  return (
    <CollapsiblePanel
      title="Menu (Seznam)"
      icon={<List size={18} aria-hidden />}
      badge={sorted.length > 0 ? `${sorted.length}` : undefined}
    >
      <p className={s.hint}>
        Položky se zobrazí v levém sloupci ve vieweru. U každé vyber stránku
        tohoto světa, na kterou bude odkazovat.
      </p>

      {sorted.length === 0 ? (
        <div className={s.empty}>
          <p>Menu je prázdné.</p>
        </div>
      ) : (
        <ul className={s.list}>
          {sorted.map((item, idx) => (
            <li key={idx} className={s.row}>
              <input
                type="text"
                value={item.label}
                onChange={(e) => updateItem(idx, { label: e.target.value })}
                placeholder="Název položky"
                className={s.labelInput}
              />
              <PagePicker
                value={item.href}
                onChange={(slug, title) => pickPage(idx, slug, title)}
                directory={directory}
              />
              <div className={s.actions}>
                <button
                  type="button"
                  onClick={() => moveItem(idx, 'up')}
                  disabled={idx === 0}
                  aria-label="Nahoru"
                  className={s.iconBtn}
                >
                  <ArrowUp size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(idx, 'down')}
                  disabled={idx === sorted.length - 1}
                  aria-label="Dolů"
                  className={s.iconBtn}
                >
                  <ArrowDown size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  aria-label="Smazat"
                  className={s.iconBtn}
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={addItem} className={s.addBtn}>
        <Plus size={14} aria-hidden /> Přidat položku
      </button>
    </CollapsiblePanel>
  );
}
