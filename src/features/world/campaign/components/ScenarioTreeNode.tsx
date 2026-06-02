import { useState } from 'react';
import clsx from 'clsx';
import { KebabMenu, type KebabMenuItem } from '@/shared/ui';
import {
  SCENARIO_STATUS_LABELS,
  type ScenarioTreeNode as TreeNode,
} from '../scenarioMeta';
import s from './storyboard.module.css';

/** Jeden řádek stromu „vlákna příběhu". */
export function ScenarioTreeNode({
  node,
  selected,
  readOnly,
  dropHint,
  onSelect,
  menuItems,
  dragHandlers,
}: {
  node: TreeNode;
  selected: boolean;
  readOnly: boolean;
  /** 'before' | 'after' | 'inside' | null — vizuální náznak cíle dropu. */
  dropHint: 'before' | 'after' | 'inside' | null;
  onSelect: () => void;
  menuItems: KebabMenuItem[];
  dragHandlers: {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
  };
}) {
  const { meta } = node;
  const isFolder = meta.kind === 'folder';
  const [kebabAnchor, setKebabAnchor] = useState<HTMLButtonElement | null>(null);
  const [kebabOpen, setKebabOpen] = useState(false);

  return (
    <div
      className={clsx(
        s.nodeRow,
        selected && s.nodeRowOn,
        dropHint === 'inside' && s.nodeDropInside,
        dropHint === 'before' && s.nodeDropBefore,
        dropHint === 'after' && s.nodeDropAfter,
      )}
      style={{ '--sb-depth': node.depth } as React.CSSProperties}
      {...dragHandlers}
    >
      <span className={s.thread} aria-hidden />
      <button type="button" className={s.nodeMain} onClick={onSelect}>
        <span
          className={clsx(s.nodeStatus, s[`status_${meta.status}`])}
          title={SCENARIO_STATUS_LABELS[meta.status]}
          aria-hidden
        />
        <span className={s.nodeIcon} aria-hidden>
          {isFolder ? '📁' : '🎬'}
        </span>
        <span className={s.nodeText}>
          <span className={s.nodeTitle}>
            {node.scenario.title || 'Bez názvu'}
          </span>
          {meta.branchLabel && (
            <span className={s.branchLabel}>↳ {meta.branchLabel}</span>
          )}
        </span>
      </button>
      {!readOnly && menuItems.length > 0 && (
        <>
          <button
            type="button"
            className={s.nodeKebab}
            aria-label={`Akce — ${node.scenario.title}`}
            onClick={(e) => {
              setKebabAnchor(e.currentTarget);
              setKebabOpen(true);
            }}
          >
            ⋮
          </button>
          <KebabMenu
            anchor={kebabAnchor}
            open={kebabOpen}
            onClose={() => setKebabOpen(false)}
            items={menuItems}
            ariaLabel={`Akce — ${node.scenario.title}`}
          />
        </>
      )}
    </div>
  );
}
