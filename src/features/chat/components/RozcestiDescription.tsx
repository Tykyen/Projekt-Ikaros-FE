import { findPlace } from '../lib/rozcestiPlaces';
import { placeDescription } from '../lib/rozcestiDescriptions';
import type { RoomStyle } from '../lib/types';
import s from './RozcestiDescription.module.css';

export interface RozcestiDescriptionProps {
  style: RoomStyle;
  placeId: string;
  open: boolean;
}

/** Rozbalovací panel (📖) se slovním popisem aktuální lokace. */
export function RozcestiDescription({
  style,
  placeId,
  open,
}: RozcestiDescriptionProps) {
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
