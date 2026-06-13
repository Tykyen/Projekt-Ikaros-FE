import { Globe, Lock, Pencil, Trash2, ZoomIn } from 'lucide-react';
import type { WorldMapEntry } from '../types';
import s from './MapCard.module.css';

interface Props {
  map: WorldMapEntry;
  isPJ: boolean;
  editMode: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** 13.4 — karta mapy v atlasu. Náhled + název + popis; PJ vidí chip viditelnosti
 *  a v edit módu akce (přesun / upravit / smazat). */
export function MapCard({
  map,
  isPJ,
  editMode,
  onOpen,
  onEdit,
  onDelete,
}: Props) {
  const visCount = map.visibleToPlayerIds.length;

  return (
    <div className={s.card}>
      <button
        type="button"
        className={s.thumbBtn}
        onClick={onOpen}
        aria-label={`Otevřít mapu ${map.title}`}
      >
        {map.imageUrl ? (
          <img
            src={map.imageUrl}
            alt={map.title}
            className={s.thumb}
            loading="lazy"
          />
        ) : (
          <div className={s.thumbEmpty} aria-hidden />
        )}
        <span className={s.zoom}>
          <ZoomIn size={16} aria-hidden /> Otevřít
        </span>
        {isPJ &&
          (map.isPublic ? (
            <span className={`${s.chip} ${s.chipPublic}`}>
              <Globe size={12} aria-hidden /> Veřejná
            </span>
          ) : (
            <span
              className={s.chip}
              title={`Viditelná ${visCount} hráčům`}
            >
              <Lock size={12} aria-hidden /> {visCount}
            </span>
          ))}
      </button>

      <div className={s.body}>
        <h3 className={s.title}>{map.title}</h3>
        {map.description && <p className={s.desc}>{map.description}</p>}
      </div>

      {isPJ && editMode && (
        <div className={s.actions}>
          <button type="button" onClick={onEdit} aria-label="Upravit mapu">
            <Pencil size={14} aria-hidden />
          </button>
          <button
            type="button"
            className={s.danger}
            onClick={onDelete}
            aria-label="Smazat mapu"
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
