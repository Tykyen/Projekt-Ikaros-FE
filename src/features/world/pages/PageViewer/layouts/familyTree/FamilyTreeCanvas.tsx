import { useMemo, useRef, useState, type ReactNode } from 'react';
import type { FamilyPerson, FamilyUnion } from '../../../api/pages.types';
import { computeLinks, contentBounds } from './geometry';
import { usePanZoom } from './usePanZoom';
import { FamilyNode } from './FamilyNode';
import s from './family-tree.module.css';

interface Props {
  people: FamilyPerson[];
  unions: FamilyUnion[];
  mode: 'view' | 'edit';
  selectedId?: string | null;
  /** Náhled: naviguj na stránku. Editor: vyber osobu (otevři panel). */
  onNodeClick?: (id: string) => void;
  /** Editor: živý posun uzlu při tažení. */
  onNodeDragMove?: (id: string, x: number, y: number) => void;
  /** Editor: konec tažení (persist). */
  onNodeDragEnd?: (id: string, x: number, y: number) => void;
  /** Editor: overlay uzlu (mini-tlačítka příbuzných). */
  nodeExtra?: (person: FamilyPerson) => ReactNode;
  /** Editor: tlačítka do toolbaru (Srovnat…). */
  toolbarExtra?: ReactNode;
}

export function FamilyTreeCanvas({
  people,
  unions,
  mode,
  selectedId,
  onNodeClick,
  onNodeDragMove,
  onNodeDragEnd,
  nodeExtra,
  toolbarExtra,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const bounds = useMemo(() => contentBounds(people), [people]);
  const { marriage, links } = useMemo(
    () => computeLinks(people, unions),
    [people, unions],
  );
  const pz = usePanZoom(viewportRef, bounds.width, bounds.height);
  const [dragId, setDragId] = useState<string | null>(null);

  function nodePointerDown(e: React.PointerEvent, person: FamilyPerson) {
    if (mode !== 'edit') return; // náhled řeší klik navigací
    e.stopPropagation(); // neposouvej plátno
    const startX = e.clientX;
    const startY = e.clientY;
    const ox = person.x;
    const oy = person.y;
    const scale = pz.scaleRef.current || 1;
    let moved = false;
    setDragId(person.id);

    function move(ev: PointerEvent) {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 3) {
        moved = true;
      }
      if (moved) {
        onNodeDragMove?.(
          person.id,
          Math.round(ox + (ev.clientX - startX) / scale),
          Math.round(oy + (ev.clientY - startY) / scale),
        );
      }
    }
    function up(ev: PointerEvent) {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setDragId(null);
      if (moved) {
        onNodeDragEnd?.(
          person.id,
          Math.round(ox + (ev.clientX - startX) / scale),
          Math.round(oy + (ev.clientY - startY) / scale),
        );
      } else {
        onNodeClick?.(person.id); // klik bez pohybu = výběr
      }
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  return (
    <div className={s.frame}>
      <div className={s.toolbar}>
        <button type="button" onClick={pz.zoomOut} title="Oddálit" aria-label="Oddálit">
          −
        </button>
        <span className={s.zoomVal}>{Math.round(pz.scale * 100)} %</span>
        <button type="button" onClick={pz.zoomIn} title="Přiblížit" aria-label="Přiblížit">
          +
        </button>
        <span className={s.sep} />
        <button type="button" onClick={pz.reset} title="Vycentrovat" aria-label="Vycentrovat">
          ⟲
        </button>
        {toolbarExtra}
      </div>

      <div
        ref={viewportRef}
        className={`${s.viewport} ${pz.dragging ? s.dragging : ''}`}
        onWheel={pz.onWheel}
        onPointerDown={pz.onPointerDown}
      >
        <div
          className={s.stage}
          style={{
            width: bounds.width,
            height: bounds.height,
            transform: pz.transform,
          }}
        >
          <svg
            className={s.links}
            width={bounds.width}
            height={bounds.height}
            aria-hidden
          >
            <path className={s.marriage} d={marriage} />
            <path d={links} />
          </svg>

          {people.map((p) => {
            const clickable = mode === 'edit' || !!p.pageSlug;
            const cls = [
              s.node,
              clickable ? s.clickable : '',
              selectedId === p.id ? s.selected : '',
              dragId === p.id ? s.dragging : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <FamilyNode
                key={p.id}
                person={p}
                className={cls}
                showLinkBadge={mode === 'view'}
                onPointerDown={
                  mode === 'edit' ? (e) => nodePointerDown(e, p) : undefined
                }
                onClick={
                  mode === 'view' && p.pageSlug
                    ? () => onNodeClick?.(p.id)
                    : undefined
                }
              >
                {mode === 'edit' && nodeExtra?.(p)}
              </FamilyNode>
            );
          })}
        </div>
      </div>

      <div className={s.hint}>Táhni · kolečko = zoom · ⟲ = vycentrovat</div>
    </div>
  );
}
