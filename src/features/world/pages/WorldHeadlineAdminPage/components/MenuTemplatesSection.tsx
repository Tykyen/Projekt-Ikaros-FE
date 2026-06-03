import { Plus, Trash2, CornerDownLeft } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsPanel } from '@/features/world/pages/WorldSettingsPage/components/SettingsPanel';
import type { HeadlineNode, MenuTemplate } from '@/shared/types';
import { makeNodeId } from '@/features/world/lib/headlineNav';
import { LinkTargetEditor } from './LinkTargetEditor';
import s from './MenuTemplatesSection.module.css';

interface Props {
  worldId: string;
  worldSlug: string;
  value: MenuTemplate[];
  onChange: (next: MenuTemplate[]) => void;
  /** Vloží šablonu jako novou skupinu do vlastní navigace. */
  onInsert: (group: HeadlineNode) => void;
}

/** Převede šablonu na skupinový uzel navigace (1 úroveň odkazů). */
function templateToGroup(t: MenuTemplate): HeadlineNode {
  return {
    id: makeNodeId(),
    label: t.name || 'Šablona',
    isGroup: true,
    children: t.items.map((i) => ({
      id: makeNodeId(),
      label: i.label,
      isGroup: false,
      to: i.href,
    })),
  };
}

/**
 * 12.2 — šablony menu = pojmenované sady odkazů. Tlačítko „Vložit do navigace"
 * rozbalí šablonu jako novou skupinu do vlastní navigace (produktivita, ne
 * další render surface).
 */
export function MenuTemplatesSection({
  worldId,
  worldSlug,
  value,
  onChange,
  onInsert,
}: Props) {
  const patch = (idx: number, next: Partial<MenuTemplate>) =>
    onChange(value.map((t, i) => (i === idx ? { ...t, ...next } : t)));

  return (
    <SettingsPanel
      title="Šablony menu"
      description="Připrav si pojmenované sady odkazů a vlož je jedním klikem jako skupinu do vlastní navigace."
      action={
        <button
          type="button"
          className={s.addBtn}
          onClick={() =>
            onChange([...value, { name: 'Nová šablona', items: [] }])
          }
        >
          <Plus size={14} /> Šablona
        </button>
      }
    >
      {value.length === 0 ? (
        <p className={s.empty}>Žádné šablony. Vytvoř první tlačítkem výše.</p>
      ) : (
        <ul className={s.list}>
          {value.map((t, idx) => (
            <li key={idx} className={s.template}>
              <div className={s.templateHead}>
                <input
                  type="text"
                  className={s.nameInput}
                  value={t.name}
                  onChange={(e) => patch(idx, { name: e.target.value })}
                  aria-label="Název šablony"
                  placeholder="Název šablony"
                />
                <button
                  type="button"
                  className={s.insertBtn}
                  disabled={t.items.length === 0}
                  onClick={() => {
                    onInsert(templateToGroup(t));
                    toast.success(`Šablona „${t.name}" vložena do navigace.`);
                  }}
                  title="Vložit do navigace"
                >
                  <CornerDownLeft size={14} /> Vložit
                </button>
                <button
                  type="button"
                  className={s.deleteBtn}
                  onClick={() => onChange(value.filter((_, i) => i !== idx))}
                  aria-label="Smazat šablonu"
                  title="Smazat šablonu"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className={s.items}>
                {t.items.map((item, ii) => (
                  <div key={ii} className={s.item}>
                    <input
                      type="text"
                      className={s.itemLabel}
                      value={item.label}
                      onChange={(e) =>
                        patch(idx, {
                          items: t.items.map((x, j) =>
                            j === ii ? { ...x, label: e.target.value } : x,
                          ),
                        })
                      }
                      aria-label="Název položky"
                      placeholder="Název"
                    />
                    <LinkTargetEditor
                      worldId={worldId}
                      worldSlug={worldSlug}
                      value={item.href}
                      onChange={(href) =>
                        patch(idx, {
                          items: t.items.map((x, j) =>
                            j === ii ? { ...x, href } : x,
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      className={s.deleteBtn}
                      onClick={() =>
                        patch(idx, {
                          items: t.items.filter((_, j) => j !== ii),
                        })
                      }
                      aria-label="Smazat položku"
                      title="Smazat"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={s.addItemBtn}
                  onClick={() =>
                    patch(idx, {
                      items: [...t.items, { label: 'Nový odkaz', href: '' }],
                    })
                  }
                >
                  <Plus size={14} /> Položka
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SettingsPanel>
  );
}
