/**
 * Drag handle pro kanály a konverzace (krok 6.5a/b; 6.7b zviditelnění).
 *
 * Vizuál = lucide `GripVertical` (⋮⋮), 16 px pro kanál / 14 px pro konverzaci.
 * Trvale viditelný (opacity v CSS, ne hover-only) — pro objevitelnost u hráčů;
 * nese accent barvu svého kanálu (`--g-color` / `--ch-accent`).
 *
 * Forwarded ref + spread `attributes` / `listeners` z `useSortable` (dnd-kit).
 */
import { forwardRef } from 'react';
import { GripVertical } from 'lucide-react';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import clsx from 'clsx';
import s from './DragHandle.module.css';

interface DragHandleProps {
  /** `'group'` = 3 puntíky (kanál), `'channel'` = 2 puntíky (konverzace). */
  kind: 'group' | 'channel';
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  /** ARIA label — „Přesunout kanál X". */
  label: string;
}

export const DragHandle = forwardRef<HTMLButtonElement, DragHandleProps>(
  function DragHandle({ kind, attributes, listeners, label }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={clsx(s.handle, kind === 'channel' && s.small)}
        aria-label={label}
        title={label}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={kind === 'group' ? 16 : 14} aria-hidden="true" />
      </button>
    );
  },
);
