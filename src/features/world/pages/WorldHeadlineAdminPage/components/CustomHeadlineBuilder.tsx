import {
  ChevronDown,
  ChevronUp,
  FolderPlus,
  Link2,
  Plus,
  Trash2,
} from 'lucide-react';
import { SettingsPanel } from '@/features/world/pages/WorldSettingsPage/components/SettingsPanel';
import type { HeadlineNode } from '@/shared/types';
import {
  addGroup,
  addLink,
  moveNode,
  removeNode,
  renameNode,
  setNodeTo,
} from '@/features/world/lib/headlineNav';
import { LinkTargetEditor } from './LinkTargetEditor';
import s from './CustomHeadlineBuilder.module.css';

interface Props {
  worldId: string;
  worldSlug: string;
  value: HeadlineNode[];
  onChange: (next: HeadlineNode[]) => void;
}

/**
 * 12.2 — builder vlastní navigace světa. Top-level uzly = skupiny (dropdown,
 * 1 úroveň odkazů) nebo přímé odkazy. Řazení tlačítky ↑/↓ (touch-safe).
 * Tato navigace se v horní liště PŘIDÁ za systémovou (aditivní).
 */
export function CustomHeadlineBuilder({
  worldId,
  worldSlug,
  value,
  onChange,
}: Props) {
  const linkEditor = (node: HeadlineNode) => (
    <LinkTargetEditor
      worldId={worldId}
      worldSlug={worldSlug}
      value={node.to ?? ''}
      onChange={(to) => onChange(setNodeTo(value, node.id, to))}
    />
  );

  const reorderBtns = (id: string) => (
    <div className={s.reorder}>
      <button
        type="button"
        className={s.iconBtn}
        onClick={() => onChange(moveNode(value, id, -1))}
        aria-label="Posunout nahoru"
        title="Nahoru"
      >
        <ChevronUp size={15} />
      </button>
      <button
        type="button"
        className={s.iconBtn}
        onClick={() => onChange(moveNode(value, id, 1))}
        aria-label="Posunout dolů"
        title="Dolů"
      >
        <ChevronDown size={15} />
      </button>
    </div>
  );

  return (
    <SettingsPanel
      title="Vlastní navigace"
      description="Přidej do horní lišty vlastní skupiny a odkazy. Zobrazí se za systémovou navigací. Skupina je rozbalovací menu, odkaz je přímé tlačítko."
      action={
        <div className={s.headActions}>
          <button
            type="button"
            className={s.addBtn}
            onClick={() => onChange(addGroup(value, 'Nová skupina'))}
          >
            <FolderPlus size={14} /> Skupina
          </button>
          <button
            type="button"
            className={s.addBtn}
            onClick={() => onChange(addLink(value, 'Nový odkaz', '', null))}
          >
            <Link2 size={14} /> Odkaz
          </button>
        </div>
      }
    >
      {value.length === 0 ? (
        <p className={s.empty}>
          Zatím žádné vlastní položky. Přidej skupinu nebo odkaz tlačítky výše.
        </p>
      ) : (
        <ul className={s.tree}>
          {value.map((node) => (
            <li key={node.id} className={s.node}>
              <div className={s.row}>
                {reorderBtns(node.id)}
                <span
                  className={node.isGroup ? s.badgeGroup : s.badgeLink}
                  aria-hidden
                >
                  {node.isGroup ? 'Skupina' : 'Odkaz'}
                </span>
                <input
                  type="text"
                  className={s.labelInput}
                  value={node.label}
                  onChange={(e) =>
                    onChange(renameNode(value, node.id, e.target.value))
                  }
                  aria-label="Název položky"
                  placeholder="Název"
                />
                <button
                  type="button"
                  className={s.deleteBtn}
                  onClick={() => onChange(removeNode(value, node.id))}
                  aria-label="Smazat"
                  title="Smazat"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {!node.isGroup && (
                <div className={s.targetRow}>{linkEditor(node)}</div>
              )}

              {node.isGroup && (
                <div className={s.children}>
                  {(node.children ?? []).map((child) => (
                    <div key={child.id} className={s.childNode}>
                      <div className={s.row}>
                        {reorderBtns(child.id)}
                        <input
                          type="text"
                          className={s.labelInput}
                          value={child.label}
                          onChange={(e) =>
                            onChange(renameNode(value, child.id, e.target.value))
                          }
                          aria-label="Název odkazu"
                          placeholder="Název odkazu"
                        />
                        <button
                          type="button"
                          className={s.deleteBtn}
                          onClick={() => onChange(removeNode(value, child.id))}
                          aria-label="Smazat odkaz"
                          title="Smazat"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className={s.targetRow}>{linkEditor(child)}</div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={s.addChildBtn}
                    onClick={() =>
                      onChange(addLink(value, 'Nový odkaz', '', node.id))
                    }
                  >
                    <Plus size={14} /> Odkaz do skupiny
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </SettingsPanel>
  );
}
