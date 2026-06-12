import { Link } from 'react-router-dom';
import { GripVertical, Star } from 'lucide-react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { World } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { usePagesDirectory } from '../../../api/usePagesDirectory';
import { useFavoritePages } from '../../../api/useFavoritePages';
import { DashColumn } from '../components/DashColumn';
import column from './column.module.css';
import s from './FavoritePagesColumn.module.css';

interface Props {
  world: World;
}

/** Jedna oblíbená položka — drag handle (activator) + proklik na stránku. */
function SortableFavoriteItem({
  slug,
  title,
  worldSlug,
}: {
  slug: string;
  title: string;
  worldSlug: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slug });

  return (
    <li
      ref={setNodeRef}
      className={s.item}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className={s.dragHandle}
        aria-label={`Přesunout ${title}`}
        title="Přetáhni pro změnu pořadí"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} aria-hidden />
      </button>
      <Link to={`/svet/${worldSlug}/${slug}`} className={s.itemLink}>
        {title}
      </Link>
    </li>
  );
}

/**
 * 5.2-followup — pravý sloupec dashboardu: **osobní** oblíbené stránky
 * přihlášeného hráče (ne sdílený PJ seznam). Titulky lookup z
 * `usePagesDirectory`, pořadí drží `useFavoritePages` a mění se drag&drop
 * (`@dnd-kit`; klávesová a11y přes `KeyboardSensor`).
 */
export function FavoritePagesColumn({ world }: Props) {
  const { worldSlug } = useWorldContext();
  const { data: directory = [] } = usePagesDirectory(world.id);
  const { order, reorder } = useFavoritePages(world.id);
  const titleBySlug = new Map(directory.map((d) => [d.slug, d.title]));

  // Touch má long-press (chrání scroll), myš jen distance (vzor ChannelSidebar).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    reorder(arrayMove(order, oldIndex, newIndex));
  }

  return (
    <DashColumn
      icon={<Star size={18} />}
      title="Oblíbené stránky"
      footer={
        <Link className={column.moreLink} to={`/svet/${worldSlug}/stranky`}>
          Všechny stránky →
        </Link>
      }
    >
      {order.length === 0 ? (
        <p className={s.empty}>
          Zatím žádné oblíbené stránky.
          <br />
          <span className={s.hint}>Označíš je hvězdičkou u stránek světa.</span>
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <ul className={s.list}>
              {order.map((slug) => (
                <SortableFavoriteItem
                  key={slug}
                  slug={slug}
                  title={titleBySlug.get(slug) ?? slug}
                  worldSlug={worldSlug}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </DashColumn>
  );
}
