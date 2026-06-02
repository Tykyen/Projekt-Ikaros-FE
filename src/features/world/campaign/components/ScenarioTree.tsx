import { Fragment, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Button, Modal, type KebabMenuItem } from '@/shared/ui';
import {
  flattenTree,
  type ScenarioKind,
  type ScenarioTreeNode as TreeNode,
} from '../scenarioMeta';
import { ScenarioTreeNode } from './ScenarioTreeNode';
import { ScenarioTemplatesDialog } from './ScenarioTemplatesDialog';
import type { ScenarioTemplate } from '../scenarioTemplates';
import s from './storyboard.module.css';

export type DropPosition = 'before' | 'after' | 'inside';

interface Props {
  /** Kořenové uzly z `buildTree`. */
  nodes: TreeNode[];
  selectedId: string | null;
  readOnly: boolean;
  onSelect: (id: string) => void;
  onCreate: (parentId: string | null, kind: ScenarioKind) => void;
  onCreateFromTemplate: (template: ScenarioTemplate) => void;
  onDelete: (node: TreeNode) => void;
  onMove: (
    draggedId: string,
    targetId: string | null,
    position: DropPosition,
  ) => void;
}

function dropZone(e: React.DragEvent): DropPosition {
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  if (y < rect.height * 0.28) return 'before';
  if (y > rect.height * 0.72) return 'after';
  return 'inside';
}

export function ScenarioTree({
  nodes,
  selectedId,
  readOnly,
  onSelect,
  onCreate,
  onCreateFromTemplate,
  onDelete,
  onMove,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    pos: DropPosition;
  } | null>(null);
  const [moveNode, setMoveNode] = useState<TreeNode | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const flat = useMemo(() => flattenTree(nodes), [nodes]);

  /** id draggeda + všech jeho potomků (zákaz dropu do sebe / potomka = cyklus). */
  const forbiddenTargets = useMemo(() => {
    if (!dragId) return new Set<string>();
    const byId = new Map(flat.map((n) => [n.scenario.id, n]));
    const out = new Set<string>([dragId]);
    const collect = (node: TreeNode) => {
      for (const c of node.children) {
        out.add(c.scenario.id);
        collect(c);
      }
    };
    const dragged = byId.get(dragId);
    if (dragged) collect(dragged);
    return out;
  }, [dragId, flat]);

  function handleDrop(targetId: string, pos: DropPosition) {
    if (dragId && !forbiddenTargets.has(targetId)) {
      onMove(dragId, targetId, pos);
    }
    setDragId(null);
    setDropTarget(null);
  }

  function dragHandlersFor(node: TreeNode) {
    const id = node.scenario.id;
    return {
      draggable: !readOnly,
      onDragStart: (e: React.DragEvent) => {
        setDragId(id);
        e.dataTransfer.effectAllowed = 'move';
      },
      onDragOver: (e: React.DragEvent) => {
        if (readOnly || !dragId || forbiddenTargets.has(id)) return;
        e.preventDefault();
        const pos = dropZone(e);
        setDropTarget((prev) =>
          prev?.id === id && prev.pos === pos ? prev : { id, pos },
        );
      },
      onDragLeave: () => {
        setDropTarget((prev) => (prev?.id === id ? null : prev));
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        handleDrop(id, dropZone(e));
      },
      onDragEnd: () => {
        setDragId(null);
        setDropTarget(null);
      },
    };
  }

  function menuItemsFor(node: TreeNode): KebabMenuItem[] {
    return [
      {
        key: 'add-scene',
        label: '🎬 Scéna uvnitř',
        onClick: () => onCreate(node.scenario.id, 'scene'),
      },
      {
        key: 'add-folder',
        label: '📁 Složka uvnitř',
        onClick: () => onCreate(node.scenario.id, 'folder'),
      },
      {
        key: 'move',
        label: '↪ Přesunout pod…',
        onClick: () => setMoveNode(node),
      },
      {
        key: 'delete',
        label: 'Smazat',
        variant: 'danger',
        onClick: () => onDelete(node),
      },
    ];
  }

  const renderNodes = (list: TreeNode[]): React.ReactNode =>
    list.map((node) => (
      <Fragment key={node.scenario.id}>
        <ScenarioTreeNode
          node={node}
          selected={node.scenario.id === selectedId}
          readOnly={readOnly}
          dropHint={
            dropTarget?.id === node.scenario.id ? dropTarget.pos : null
          }
          onSelect={() => onSelect(node.scenario.id)}
          menuItems={menuItemsFor(node)}
          dragHandlers={dragHandlersFor(node)}
        />
        {node.children.length > 0 && renderNodes(node.children)}
      </Fragment>
    ));

  return (
    <div className={s.tree}>
      <div className={s.treeHead}>
        <span className={s.treeTitle}>Příběh</span>
        {!readOnly && (
          <div className={s.treeHeadActions}>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onCreate(null, 'folder')}
            >
              + Složka
            </Button>
            <Button size="sm" onClick={() => onCreate(null, 'scene')}>
              + Scéna
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowTemplates(true)}
              title="Vložit scénu z knihovny šablon"
            >
              📑 Z šablony
            </Button>
          </div>
        )}
      </div>

      <div className={s.treeBody}>
        {nodes.length === 0 ? (
          <div className={s.treeEmpty}>
            Začni příběh — vytvoř první akt nebo scénu.
          </div>
        ) : (
          renderNodes(nodes)
        )}
        {/* Drop na konec kořene = přesun na root */}
        {!readOnly && dragId && (
          <div
            className={clsx(s.rootDropZone, dropTarget?.id === '__root__' && s.rootDropOn)}
            onDragOver={(e) => {
              e.preventDefault();
              setDropTarget({ id: '__root__', pos: 'inside' });
            }}
            onDragLeave={() =>
              setDropTarget((prev) => (prev?.id === '__root__' ? null : prev))
            }
            onDrop={(e) => {
              e.preventDefault();
              if (dragId) onMove(dragId, null, 'inside');
              setDragId(null);
              setDropTarget(null);
            }}
          >
            ⤓ Přesunout na kořen
          </div>
        )}
      </div>

      <MoveDialog
        moveNode={moveNode}
        flat={flat}
        onClose={() => setMoveNode(null)}
        onPick={(targetId) => {
          if (moveNode) onMove(moveNode.scenario.id, targetId, 'inside');
          setMoveNode(null);
        }}
      />

      {showTemplates && (
        <ScenarioTemplatesDialog
          open
          onClose={() => setShowTemplates(false)}
          onPick={onCreateFromTemplate}
        />
      )}
    </div>
  );
}

/** Touch/přístupný fallback pro re-parent — vyber nového rodiče ze seznamu. */
function MoveDialog({
  moveNode,
  flat,
  onClose,
  onPick,
}: {
  moveNode: TreeNode | null;
  flat: TreeNode[];
  onClose: () => void;
  onPick: (targetId: string | null) => void;
}) {
  const forbidden = useMemo(() => {
    if (!moveNode) return new Set<string>();
    const out = new Set<string>([moveNode.scenario.id]);
    const collect = (n: TreeNode) => {
      for (const c of n.children) {
        out.add(c.scenario.id);
        collect(c);
      }
    };
    collect(moveNode);
    return out;
  }, [moveNode]);

  if (!moveNode) return null;

  return (
    <Modal open={!!moveNode} onClose={onClose} title={`Přesunout „${moveNode.scenario.title}" pod…`}>
      <div className={s.moveList}>
        <button type="button" className={s.moveItem} onClick={() => onPick(null)}>
          📂 Kořen (nejvyšší úroveň)
        </button>
        {flat
          .filter((n) => !forbidden.has(n.scenario.id))
          .map((n) => (
            <button
              key={n.scenario.id}
              type="button"
              className={s.moveItem}
              style={{ paddingLeft: `${0.75 + n.depth * 1}rem` }}
              onClick={() => onPick(n.scenario.id)}
            >
              {n.meta.kind === 'folder' ? '📁' : '🎬'} {n.scenario.title || 'Bez názvu'}
            </button>
          ))}
      </div>
    </Modal>
  );
}
