import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link2 } from 'lucide-react';
import { listMapScenes } from '@/features/world/tactical-map/api/mapApi';
import s from './viewer.module.css';

interface Props {
  worldId: string;
  /** Aktuálně propojená scéna mapy. */
  currentSceneId: string | null;
  anchorRect: DOMRect;
  onSave: (sceneId: string | null) => void;
  onClose: () => void;
}

/**
 * 16.5b — výběr propojené taktické scény (1:1). Zdroj = všechny scény světa
 * (`listMapScenes`). Uloží se do `WorldMapEntry.linkedSceneId`.
 */
export function SceneLinkPopover({
  worldId,
  currentSceneId,
  anchorRect,
  onSave,
  onClose,
}: Props) {
  const { data: scenes = [] } = useQuery({
    queryKey: ['map', 'world-scenes', worldId],
    queryFn: () => listMapScenes(worldId),
    enabled: !!worldId,
    staleTime: 60_000,
  });
  const [sel, setSel] = useState<string>(currentSceneId ?? '');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);

  const width = 268;
  const left = Math.max(
    8,
    Math.min(anchorRect.left, window.innerWidth - width - 8),
  );

  return (
    <div
      ref={ref}
      className={s.popover}
      style={{ left, top: anchorRect.bottom + 6 }}
    >
      <div className={s.popHead}>Propojená taktická scéna (jen jedna)</div>
      <div className={s.field}>
        <select
          className={s.select}
          value={sel}
          onChange={(e) => setSel(e.target.value)}
          data-native-select
        >
          <option value="">— nepropojeno —</option>
          {scenes.map((sc) => (
            <option key={sc.id} value={sc.id}>
              {sc.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className={`${s.btn} ${s.btnPrimary}`}
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => onSave(sel || null)}
      >
        <Link2 size={14} aria-hidden /> Uložit propojení
      </button>
    </div>
  );
}
