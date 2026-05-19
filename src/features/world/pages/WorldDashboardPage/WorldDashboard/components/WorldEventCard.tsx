import clsx from 'clsx';
import type { GameEvent } from '@/shared/types';
import {
  relativeEventDate,
  isWithin24h,
} from '@/features/world/utils/relativeEventDate';
import s from './WorldEventCard.module.css';

const MONTHS = [
  'led',
  'úno',
  'bře',
  'dub',
  'kvě',
  'čvn',
  'čvc',
  'srp',
  'zář',
  'říj',
  'lis',
  'pro',
];

interface Props {
  event: GameEvent;
}

/**
 * 5.2 — karta herní akce světa: datum-chip + název + počet potvrzených.
 * Akce do 24 h má zvýrazněný chip.
 */
export function WorldEventCard({ event }: Props) {
  const d = new Date(event.date);
  const valid = !Number.isNaN(d.getTime());
  const urgent = valid && isWithin24h(event.date);

  return (
    <article className={s.card} data-elev="card">
      <div className={clsx(s.chip, urgent && s.chipUrgent)}>
        {valid ? (
          <>
            <span className={s.day}>{d.getDate()}</span>
            <span className={s.month}>{MONTHS[d.getMonth()]}</span>
          </>
        ) : (
          <span className={s.month}>?</span>
        )}
      </div>
      <div className={s.body}>
        <h3 className={s.title}>{event.title}</h3>
        <p className={s.meta}>
          {valid ? relativeEventDate(event.date) : 'Termín neznámý'}
          {' · '}
          <span className={s.confirmed}>
            ✓ {event.confirmedBy.length} potvrzeno
          </span>
        </p>
      </div>
    </article>
  );
}
