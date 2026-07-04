import { useState } from 'react';
import { Layers, ArrowUpRight, MapPinned } from 'lucide-react';
import { useWorldMaps } from '@/features/world/maps/api/useWorldMaps';
import { InteractiveMapViewer } from '@/features/world/maps/viewer/InteractiveMapViewer';
import type { ChatMapRef } from '../lib/types';
import s from './MapRefCard.module.css';

/**
 * 16.5c — karta poslané interaktivní mapy v chatu. Náhled/piny se dopočítají z
 * živé mapy dle viditelnosti příjemce (leak-safe) — klik otevře viewer. Když
 * mapa zmizí / není dostupná, ukáže se fallback s uloženým názvem.
 */
export function MapRefCard({ mapRef }: { mapRef: ChatMapRef }) {
  const { data: maps = [] } = useWorldMaps(mapRef.worldId);
  const [open, setOpen] = useState(false);
  const map = maps.find((m) => m.id === mapRef.worldMapId) ?? null;

  if (!map) {
    return (
      <div className={`${s.card} ${s.cardDead}`}>
        <span className={s.deadIcon}>
          <Layers size={18} aria-hidden />
        </span>
        <span className={s.meta}>
          <span className={s.title}>{mapRef.title}</span>
          <span className={s.sub}>mapa není dostupná</span>
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className={s.card}
        onClick={() => setOpen(true)}
        title={`Otevřít mapu „${map.title}"`}
      >
        {map.imageUrl ? (
          <span
            className={s.thumb}
            style={{ backgroundImage: `url(${map.imageUrl})` }}
            aria-hidden
          />
        ) : (
          <span className={`${s.thumb} ${s.thumbEmpty}`} aria-hidden>
            <MapPinned size={20} aria-hidden />
          </span>
        )}
        <span className={s.meta}>
          <span className={s.title}>{map.title}</span>
          <span className={s.sub}>
            {map.pins.length}{' '}
            {map.pins.length === 1
              ? 'vlaječka'
              : map.pins.length >= 2 && map.pins.length <= 4
                ? 'vlaječky'
                : 'vlaječek'}{' '}
            · klikací
          </span>
        </span>
        <ArrowUpRight className={s.open} size={18} aria-hidden />
      </button>
      {open && (
        <InteractiveMapViewer
          worldId={mapRef.worldId}
          mapId={map.id}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
