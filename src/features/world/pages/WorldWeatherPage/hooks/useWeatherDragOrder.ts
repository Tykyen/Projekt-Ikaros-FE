/**
 * 9.4-I M3.4 — drag-to-reorder generátorů počasí.
 *
 * Wrapper kolem @dnd-kit (PointerSensor + TouchSensor + KeyboardSensor —
 * stejně jako chat ChannelSidebar). Vrací sensory + handleDragEnd, který
 * pošle nové pořadí ID do `useReorderGenerators` mutace s optimistic update
 * (rollback při BE chybě řeší hook sám).
 *
 * Konzument (`WorldWeatherPage`) jen obalí grid do `<DndContext>` +
 * `<SortableContext items={ids}>` a per-card volá `useSortable`.
 */
import { useMemo } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { WeatherGenerator } from '@/shared/types';
import { useReorderGenerators } from '@/features/world/api/useWeatherGenerators';

interface Options {
  worldId: string;
  generators: WeatherGenerator[];
  canManage: boolean;
}

interface Result {
  /** Sensors pro `<DndContext>`. */
  sensors: ReturnType<typeof useSensors>;
  /** Stable array ID v aktuálním pořadí — krmí `<SortableContext items={ids}>`. */
  ids: string[];
  /** Handler pro `onDragEnd` na `<DndContext>`. */
  handleDragEnd: (e: DragEndEvent) => void;
  /** True když probíhá BE mutace — komponenty mohou disablovat drag. */
  isReordering: boolean;
}

export function useWeatherDragOrder({
  worldId,
  generators,
  canManage,
}: Options): Result {
  const reorder = useReorderGenerators(worldId);
  // Touch má long-press (chrání scroll), myš jen distance — stejně jako chat.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = useMemo(() => generators.map((g) => g.id), [generators]);

  const handleDragEnd = (e: DragEndEvent) => {
    if (!canManage) return;
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = ids.indexOf(String(e.active.id));
    const newIdx = ids.indexOf(String(e.over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(ids, oldIdx, newIdx);
    reorder.mutate(reordered);
  };

  return {
    sensors,
    ids,
    handleDragEnd,
    isReordering: reorder.isPending,
  };
}
