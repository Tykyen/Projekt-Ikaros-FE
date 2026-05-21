/**
 * Drag handle pro kanály a konverzace (krok 6.5a/b, design audit §1).
 *
 * Vizuál = 3 puntíky (pro kanál) / 2 puntíky (pro konverzaci) přes CSS `::before`
 * — méně vizuálního šumu než `GripVertical` z lucide. Vlastní 2×2 px puntíky
 * s box-shadow trikem pro řadu.
 *
 * Forwarded ref + spread `attributes` / `listeners` z `useSortable` (dnd-kit).
 */
import { forwardRef } from 'react';
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
        <span className={s.dots} aria-hidden="true" />
      </button>
    );
  },
);
