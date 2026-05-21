import { useCallback } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Layers,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import type { PageSection } from '../../api/pages.types';
import s from './SectionsPanel.module.css';

interface Props {
  sections: PageSection[];
  onChange: (sections: PageSection[]) => void;
}

/**
 * 7.2d — Collapsible sekce s drag-reorder přes @dnd-kit. Default `isCollapsed: true`
 * (sekce v viewer výchozí state = sbalené).
 *
 * Items v sekci editujeme jako prostý seznam (text + qty + note); reorder items
 * v sekci je low-priority (PJ obvykle nemá 20 items v sekci) → vynecháno v MVP.
 */
export function SectionsPanel({ sections, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = sections.map((sec) => sec.id);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = ids.indexOf(String(active.id));
      const newIdx = ids.indexOf(String(over.id));
      if (oldIdx < 0 || newIdx < 0) return;
      const reordered = arrayMove(sections, oldIdx, newIdx).map(
        (sec, idx) => ({ ...sec, order: idx }),
      );
      onChange(reordered);
    },
    [sections, ids, onChange],
  );

  function addSection() {
    onChange([
      ...sections,
      {
        id: crypto.randomUUID(),
        title: '',
        content: '',
        order: sections.length,
        isCollapsed: true,
        items: [],
      },
    ]);
  }

  function updateSection(id: string, patch: Partial<PageSection>) {
    onChange(sections.map((sec) => (sec.id === id ? { ...sec, ...patch } : sec)));
  }

  function removeSection(id: string) {
    onChange(
      sections
        .filter((sec) => sec.id !== id)
        .map((sec, idx) => ({ ...sec, order: idx })),
    );
  }

  return (
    <CollapsiblePanel
      title="Sekce"
      icon={<Layers size={18} aria-hidden />}
      badge={sections.length > 0 ? `${sections.length}` : undefined}
    >
      {sections.length === 0 ? (
        <div className={s.empty}>
          <p>Žádné sekce. Sekce jsou collapsible bloky pod hlavním obsahem.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className={s.list}>
              {sections.map((sec) => (
                <SortableSectionCard
                  key={sec.id}
                  section={sec}
                  onUpdate={(patch) => updateSection(sec.id, patch)}
                  onRemove={() => removeSection(sec.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <button type="button" onClick={addSection} className={s.addBtn}>
        <Plus size={14} aria-hidden /> Přidat sekci
      </button>
    </CollapsiblePanel>
  );
}

function SortableSectionCard({
  section,
  onUpdate,
  onRemove,
}: {
  section: PageSection;
  onUpdate: (patch: Partial<PageSection>) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={s.card}>
      <div className={s.cardHeader}>
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label="Přesunout sekci"
          className={s.dragHandle}
        >
          <GripVertical size={16} aria-hidden />
        </button>
        <input
          type="text"
          value={section.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Název sekce (např. Historie)"
          className={s.titleInput}
        />
        <label className={s.collapseCheckbox}>
          <input
            type="checkbox"
            checked={section.isCollapsed}
            onChange={(e) => onUpdate({ isCollapsed: e.target.checked })}
          />
          <span>výchozí sbalená</span>
        </label>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Smazat sekci"
          className={s.removeBtn}
        >
          <Trash2 size={14} aria-hidden />
        </button>
      </div>
      <div className={s.cardBody}>
        <RichTextEditor
          value={section.content}
          onChange={(html) => onUpdate({ content: html })}
          placeholder="Obsah sekce…"
          className={s.editor}
        />
        <SectionItems
          items={section.items}
          onChange={(items) => onUpdate({ items })}
        />
      </div>
    </div>
  );
}

function SectionItems({
  items,
  onChange,
}: {
  items: PageSection['items'];
  onChange: (items: PageSection['items']) => void;
}) {
  function add() {
    onChange([
      ...items,
      { id: crypto.randomUUID(), text: '', quantity: undefined, note: '' },
    ]);
  }
  function update(id: string, patch: Partial<PageSection['items'][number]>) {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function remove(id: string) {
    onChange(items.filter((it) => it.id !== id));
  }

  if (items.length === 0) {
    return (
      <button type="button" onClick={add} className={s.itemsAddBtn}>
        <Plus size={12} aria-hidden /> Přidat položku
      </button>
    );
  }

  return (
    <div className={s.itemsWrap}>
      <span className={s.itemsLabel}>Položky</span>
      <ul className={s.itemsList}>
        {items.map((it) => (
          <li key={it.id} className={s.itemRow}>
            <input
              type="text"
              value={it.text}
              onChange={(e) => update(it.id, { text: e.target.value })}
              placeholder="Položka"
              className={s.itemInput}
            />
            <input
              type="number"
              value={it.quantity ?? ''}
              onChange={(e) =>
                update(it.id, {
                  quantity: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="ks"
              className={s.itemQtyInput}
              min={0}
            />
            <input
              type="text"
              value={it.note ?? ''}
              onChange={(e) => update(it.id, { note: e.target.value })}
              placeholder="poznámka"
              className={s.itemNoteInput}
            />
            <button
              type="button"
              onClick={() => remove(it.id)}
              aria-label="Smazat položku"
              className={s.removeBtn}
            >
              <Trash2 size={12} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={add} className={s.itemsAddBtn}>
        <Plus size={12} aria-hidden /> Přidat položku
      </button>
    </div>
  );
}
