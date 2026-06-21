import { useState } from 'react';
import {
  FileText,
  MapPin,
  Users,
  Sword,
  Coins,
  BookOpen,
  Globe,
  Building2,
  Crown,
  Network,
  Plus,
  Trash2,
  GripVertical,
  type LucideIcon,
} from 'lucide-react';
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
import { Modal, Button } from '@/shared/ui';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import type {
  CreateWorldPageTemplateInput,
  WorldPageTemplate,
  WorldPageTemplateIcon,
} from '@/features/world/pages/api/worldPageTemplates.types';
import s from './TemplateEditorModal.module.css';

const ICONS: Array<{ key: WorldPageTemplateIcon; Comp: LucideIcon }> = [
  { key: 'FileText', Comp: FileText },
  { key: 'MapPin', Comp: MapPin },
  { key: 'Users', Comp: Users },
  { key: 'Sword', Comp: Sword },
  { key: 'Coins', Comp: Coins },
  { key: 'BookOpen', Comp: BookOpen },
  { key: 'Globe', Comp: Globe },
  { key: 'Building2', Comp: Building2 },
  { key: 'Crown', Comp: Crown },
  { key: 'Network', Comp: Network },
];

interface HeaderRow {
  id: string;
  text: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** `null` = create mode. */
  existing: WorldPageTemplate | null;
  /** Keys ostatních šablon (vyloučení sebe sama) — pro validaci unikátnosti. */
  existingKeys: string[];
  onSubmit: (input: CreateWorldPageTemplateInput) => Promise<void>;
  isPending: boolean;
}

function freshRow(text = ''): HeaderRow {
  return { id: `h-${Math.random().toString(36).slice(2, 10)}`, text };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/**
 * 8.1d — Modal pro create / edit šablony stránky. Pole: label (povinné),
 * key (auto z label, ručně editovatelné), defaultTitle, icon (radio set
 * 10 Lucide), headers (drag-reorder řádky).
 */
export function TemplateEditorModal({
  open,
  onClose,
  existing,
  existingKeys,
  onSubmit,
  isPending,
}: Props) {
  const [label, setLabel] = useState('');
  const [keySlug, setKeySlug] = useState('');
  const [keyManual, setKeyManual] = useState(false);
  const [defaultTitle, setDefaultTitle] = useState('');
  const [icon, setIcon] = useState<WorldPageTemplateIcon>('FileText');
  const [rows, setRows] = useState<HeaderRow[]>([freshRow()]);
  // 15.5 — obsahová osnova (TipTap HTML) vkládaná do page.content při create.
  const [outline, setOutline] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Hydrate při otevření.
  // Hydrate při otevření — R19 adjustment-during-render (open je primitivní).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && existing) {
      setLabel(existing.label);
      setKeySlug(existing.key);
      setKeyManual(true);
      setDefaultTitle(existing.defaultTitle ?? '');
      setIcon((existing.icon as WorldPageTemplateIcon) ?? 'FileText');
      setRows(
        existing.headers.length > 0
          ? existing.headers.map((h) => freshRow(h))
          : [freshRow()],
      );
      setOutline(existing.contentOutline ?? '');
    } else if (open) {
      setLabel('');
      setKeySlug('');
      setKeyManual(false);
      setDefaultTitle('');
      setIcon('FileText');
      setRows([freshRow()]);
      setOutline('');
    }
    if (open) setError(null);
  }

  function onLabelChange(v: string) {
    setLabel(v);
    if (!keyManual && !existing) {
      setKeySlug(slugify(v));
    }
  }

  function addRow() {
    setRows([...rows, freshRow()]);
  }

  function updateRow(id: string, text: string) {
    setRows(rows.map((r) => (r.id === id ? { ...r, text } : r)));
  }

  function removeRow(id: string) {
    setRows(rows.filter((r) => r.id !== id));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = rows.findIndex((r) => r.id === active.id);
    const newIdx = rows.findIndex((r) => r.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    setRows(arrayMove(rows, oldIdx, newIdx));
  }

  async function handleSubmit() {
    const cleanedLabel = label.trim();
    const cleanedKey = keySlug.trim();
    const headers = rows.map((r) => r.text.trim()).filter((h) => h.length > 0);

    if (!cleanedLabel) {
      setError('Vyplň název šablony.');
      return;
    }
    if (!cleanedKey || !/^[a-z0-9-]+$/.test(cleanedKey)) {
      setError(
        'Klíč musí být slug — jen malá písmena, čísla a pomlčky.',
      );
      return;
    }
    if (existingKeys.includes(cleanedKey)) {
      setError('Šablona s tímto klíčem už ve světě existuje.');
      return;
    }
    if (headers.length === 0) {
      setError('Šablona musí mít alespoň jednu hlavičku.');
      return;
    }
    setError(null);
    await onSubmit({
      key: cleanedKey,
      label: cleanedLabel,
      headers,
      defaultTitle: defaultTitle.trim() || undefined,
      contentOutline: outline.trim() || undefined,
      icon,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? `Upravit šablonu „${existing.label}"` : 'Nová šablona'}
      size="md"
    >
      <div className={s.form}>
        <label className={s.field}>
          <span className={s.label}>Název *</span>
          <input
            type="text"
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder="Např. Postava, Stát…"
            className={s.input}
            maxLength={120}
          />
        </label>

        <label className={s.field}>
          <span className={s.label}>
            Klíč *{' '}
            <small className={s.hint}>
              slug v URL/DB; auto z názvu, lze ručně přepsat
            </small>
          </span>
          <input
            type="text"
            value={keySlug}
            onChange={(e) => {
              setKeyManual(true);
              setKeySlug(e.target.value);
            }}
            placeholder="postava"
            className={s.input}
            pattern="[a-z0-9-]+"
            maxLength={64}
          />
        </label>

        <label className={s.field}>
          <span className={s.label}>Titul tabulky (volitelné)</span>
          <input
            type="text"
            value={defaultTitle}
            onChange={(e) => setDefaultTitle(e.target.value)}
            placeholder="Např. Profil postavy"
            className={s.input}
            maxLength={120}
          />
        </label>

        <div className={s.field}>
          <span className={s.label}>Ikona</span>
          <div className={s.iconGrid} role="radiogroup" aria-label="Ikona">
            {ICONS.map(({ key, Comp }) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={icon === key}
                className={`${s.iconBtn} ${icon === key ? s.iconBtnActive : ''}`}
                onClick={() => setIcon(key)}
                title={key}
              >
                <Comp size={18} aria-hidden />
              </button>
            ))}
          </div>
        </div>

        <div className={s.field}>
          <span className={s.label}>
            Hlavičky *{' '}
            <small className={s.hint}>
              v editoru stránky budou tyto klíče v levém sloupci tabulky
            </small>
          </span>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={rows.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className={s.headerRows}>
                {rows.map((row) => (
                  <SortableHeaderRow
                    key={row.id}
                    row={row}
                    onChange={(text) => updateRow(row.id, text)}
                    onRemove={() => removeRow(row.id)}
                    canRemove={rows.length > 1}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <button type="button" onClick={addRow} className={s.addRowBtn}>
            <Plus size={14} aria-hidden /> Přidat hlavičku
          </button>
        </div>

        <div className={s.field}>
          <span className={s.label}>
            Osnova obsahu (volitelné){' '}
            <small className={s.hint}>
              předvyplní textové tělo nové stránky — jen když je prázdné
            </small>
          </span>
          <RichTextEditor
            value={outline}
            onChange={setOutline}
            maxLength={100_000}
            placeholder="Nadpisy a návodné prompty (např. Vzhled, Motivace, Tajemství…)"
            className={s.outlineEditor}
          />
        </div>

        {error && <p className={s.error}>{error}</p>}

        <div className={s.actions}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Zrušit
          </Button>
          <Button
            type="button"
            size="sm"
            loading={isPending}
            onClick={handleSubmit}
          >
            {existing ? 'Uložit změny' : 'Vytvořit šablonu'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function SortableHeaderRow({
  row,
  onChange,
  onRemove,
  canRemove,
}: {
  row: HeaderRow;
  onChange: (text: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={s.headerRow}>
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label="Přesunout hlavičku"
        className={s.dragHandle}
      >
        <GripVertical size={14} aria-hidden />
      </button>
      <input
        type="text"
        value={row.text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Např. Hlavní město"
        className={s.headerInput}
        maxLength={120}
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Smazat hlavičku"
        className={s.removeRowBtn}
      >
        <Trash2 size={14} aria-hidden />
      </button>
    </div>
  );
}
