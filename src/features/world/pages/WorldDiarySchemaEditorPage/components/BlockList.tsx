import { useState, type KeyboardEvent } from 'react';
import { GripVertical, Plus } from 'lucide-react';
import { Button } from '@/shared/ui';
import type { DiarySchemaBlock } from '../../api/diarySchema.types';
import s from './DiarySchemaEditor.module.css';

interface Props {
  blocks: DiarySchemaBlock[];
  activeId: string | undefined;
  readOnly?: boolean;
  onSelect: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onAdd: () => void;
}

/**
 * 8.5 — levý panel editoru. Drag & drop pořadí přes HTML5 native API
 * (žádná dep). Klávesnice: ArrowUp/Down na řádku přesune blok. Touch fallback:
 * ▲/▼ tlačítka skryté na desktopu, viditelné při `(hover: none)`.
 */
export function BlockList({
  blocks,
  activeId,
  readOnly,
  onSelect,
  onReorder,
  onAdd,
}: Props) {
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  function handleDragStart(idx: number) {
    return (e: React.DragEvent) => {
      if (readOnly) return;
      e.dataTransfer.setData('text/idx', String(idx));
      e.dataTransfer.effectAllowed = 'move';
      setDraggingIdx(idx);
    };
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(toIdx: number) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      const fromStr = e.dataTransfer.getData('text/idx');
      const from = Number(fromStr);
      if (!Number.isNaN(from) && from !== toIdx) {
        onReorder(from, toIdx);
      }
      setDraggingIdx(null);
    };
  }

  function handleKeyDown(idx: number) {
    return (e: KeyboardEvent<HTMLDivElement>) => {
      if (readOnly) return;
      if (e.key === 'ArrowUp' && idx > 0) {
        e.preventDefault();
        onReorder(idx, idx - 1);
      } else if (e.key === 'ArrowDown' && idx < blocks.length - 1) {
        e.preventDefault();
        onReorder(idx, idx + 1);
      }
    };
  }

  const idOf = (b: DiarySchemaBlock) => b.id ?? b.key;

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>Bloky ({blocks.length})</div>
      <div className={s.blockList} role="listbox" aria-label="Bloky deníku">
        {blocks.map((b, idx) => {
          const id = idOf(b);
          const isActive = id === activeId;
          return (
            <div
              key={id}
              role="option"
              aria-selected={isActive}
              tabIndex={0}
              className={`${s.blockRow} ${isActive ? s.active : ''} ${draggingIdx === idx ? s.dragging : ''}`}
              draggable={!readOnly}
              onDragStart={handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={handleDrop(idx)}
              onDragEnd={() => setDraggingIdx(null)}
              onClick={() => onSelect(id)}
              onKeyDown={handleKeyDown(idx)}
            >
              <span className={s.grip} aria-label="Přetáhnout">
                <GripVertical size={14} />
              </span>
              <span className={s.blockLabel}>{b.label || '(bez labelu)'}</span>
              <span className={s.blockTypeChip}>{b.type}</span>
              <span className={s.moveButtons}>
                <button
                  type="button"
                  className={s.moveBtn}
                  aria-label="Posunout nahoru"
                  disabled={readOnly || idx === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorder(idx, idx - 1);
                  }}
                >
                  ▲
                </button>
                <button
                  type="button"
                  className={s.moveBtn}
                  aria-label="Posunout dolů"
                  disabled={readOnly || idx === blocks.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorder(idx, idx + 1);
                  }}
                >
                  ▼
                </button>
              </span>
            </div>
          );
        })}
      </div>
      {!readOnly && (
        <Button
          variant="secondary"
          className={s.addBlockBtn}
          onClick={onAdd}
          aria-label="Přidat blok"
        >
          <Plus size={14} /> Přidat blok
        </Button>
      )}
    </div>
  );
}
