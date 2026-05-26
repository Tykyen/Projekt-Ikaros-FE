/**
 * 9.4-I M3.4 — Sortable wrapper kolem `WeatherGeneratorCard`.
 *
 * Volá `useSortable` (dnd-kit) a předává transform style + drag attributes/
 * listeners do Card. Drag handle uvnitř Cardu zatím jen pro `canManage`.
 *
 * Důvod separátní komponenty (vs. useSortable v Card): testování. Card lze
 * unit-testovat bez `<DndContext>` parenta — sortable wrapper se mocku ne-
 * vyžaduje.
 */
import { type CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WeatherGeneratorCard } from './WeatherGeneratorCard';
import type { WeatherGenerator } from '@/shared/types';

interface Props {
  generator: WeatherGenerator;
  canManage: boolean;
  canDelete: boolean;
  disabled: boolean;
  onGenerate: () => void;
  onBroadcast: () => void;
  onEdit: () => void;
  onManual: () => void;
  onDelete: () => void;
  /** 9.4 dluh #2 — otevře historii. */
  onHistory?: () => void;
  /** 9.4 dluh #4 — favorites. */
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  generatePending?: boolean;
}

export function SortableWeatherCard(props: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: props.generator.id,
    disabled: props.disabled || !props.canManage,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <WeatherGeneratorCard
      ref={setNodeRef}
      generator={props.generator}
      canManage={props.canManage}
      canDelete={props.canDelete}
      onGenerate={props.onGenerate}
      onBroadcast={props.onBroadcast}
      onEdit={props.onEdit}
      onManual={props.onManual}
      onDelete={props.onDelete}
      onHistory={props.onHistory}
      isFavorite={props.isFavorite}
      onToggleFavorite={props.onToggleFavorite}
      dragAttributes={attributes}
      dragListeners={listeners}
      dragHandleRef={setActivatorNodeRef}
      generatePending={props.generatePending}
      style={style}
      isDragging={isDragging}
      isOver={isOver}
    />
  );
}
