import { findPlace } from '../lib/campPlaces';
import { placeDescription } from '../lib/campDescriptions';
import type { RoomStyle } from '../lib/types';
import s from './CampDescription.module.css';

export interface CampDescriptionProps {
  style: RoomStyle;
  placeId: string;
  open: boolean;
}

/** Rozbalovací panel (📖) se slovním popisem aktuální lokace. */
export function CampDescription({
  style,
  placeId,
  open,
}: CampDescriptionProps) {
  const place = findPlace(style, placeId);
  const text = placeDescription(style, placeId);

  return (
    <div className={open ? s.panelOpen : s.panel} aria-hidden={!open}>
      <div className={s.inner}>
        {place && <h2 className={s.title}>{place.name}</h2>}
        <p className={s.text}>
          {text || 'Popis tohoto místa zatím chybí.'}
        </p>
      </div>
    </div>
  );
}
