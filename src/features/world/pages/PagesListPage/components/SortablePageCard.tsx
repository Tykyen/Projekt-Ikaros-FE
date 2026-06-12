import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PageDirectoryEntry } from '../../api/pages.types';
import { PageCard } from './PageCard';
import s from './PageCard.module.css';

interface Props {
  entry: PageDirectoryEntry;
  worldSlug: string;
  onToggleFavorite: () => void;
}

/**
 * 5.2-followup — `PageCard` v „Oblíbené" sekci s drag handle pro reorder
 * osobního pořadí (`@dnd-kit`). Handle je activator → klik na kartu (Link)
 * i hvězdu zůstává funkční. Karta je vždy oblíbená (`isFavorite`).
 */
export function SortablePageCard({ entry, worldSlug, onToggleFavorite }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.slug });

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className={s.dragHandle}
      aria-label={`Přesunout ${entry.title}`}
      title="Přetáhni pro změnu pořadí"
      {...attributes}
      {...listeners}
    >
      <GripVertical size={14} aria-hidden />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <PageCard
        entry={entry}
        worldSlug={worldSlug}
        isFavorite
        onToggleFavorite={onToggleFavorite}
        dragHandle={handle}
      />
    </div>
  );
}
