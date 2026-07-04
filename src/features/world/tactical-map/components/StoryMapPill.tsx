import { useState } from 'react';
import { MapPinned } from 'lucide-react';
import { useWorldMaps } from '@/features/world/maps/api/useWorldMaps';
import { InteractiveMapViewer } from '@/features/world/maps/viewer/InteractiveMapViewer';
import s from './StoryMapPill.module.css';

interface Props {
  worldId: string;
  /** Aktuálně focused scéna hráče/PJ. */
  sceneId: string | null;
}

/**
 * 16.5b — pilulka „Příběhová mapa" v doku taktické mapy. Zobrazí se **jen** když
 * existuje atlas mapa propojená s touto scénou (`linkedSceneId`) a uživatel na ni
 * má přístup (seznam z `useWorldMaps` je už visibility-filtrovaný). Klik otevře
 * interaktivní viewer. Bez propojení se nevykreslí vůbec.
 */
export function StoryMapPill({ worldId, sceneId }: Props) {
  const { data: maps = [] } = useWorldMaps(worldId);
  const [open, setOpen] = useState(false);

  const map = sceneId
    ? (maps.find((m) => m.linkedSceneId === sceneId) ?? null)
    : null;
  if (!map) return null;

  return (
    <>
      <button
        type="button"
        className={s.pill}
        onClick={() => setOpen(true)}
        title={`Otevřít příběhovou mapu „${map.title}"`}
      >
        <MapPinned size={16} aria-hidden className={s.glow} />
        Příběhová mapa
      </button>
      {open && (
        <InteractiveMapViewer
          worldId={worldId}
          mapId={map.id}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
