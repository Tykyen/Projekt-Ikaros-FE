import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import type { UpcomingEventDto } from '@/shared/types';
import {
  relativeEventDate,
  isWithin24h,
} from '@/features/world/utils/relativeEventDate';
import { useToggleRsvp } from '@/features/world/api/useGameEvents';
import s from './EventCard.module.css';

interface EventCardProps {
  event: UpcomingEventDto;
}

export function EventCard({ event }: EventCardProps) {
  const toggle = useToggleRsvp();
  const isConfirmed = event.myRsvp === 'confirmed';
  const urgent = isWithin24h(event.date);

  function handleToggle(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    toggle.mutate(event.id, {
      onError: () => toast.error('Nepodařilo se změnit RSVP.'),
    });
  }

  return (
    <Link to={`/svet/${event.worldId}`} className={s.card}>
      <span
        className={clsx(s.dateChip, urgent && s.dateChipUrgent)}
        aria-label={`Datum eventu: ${event.date}`}
      >
        {relativeEventDate(event.date)}
      </span>
      <div className={s.body}>
        <p className={s.title}>{event.title}</p>
        <span className={s.world}>{event.worldName}</span>
      </div>
      {event.confirmable && (
        <button
          type="button"
          className={clsx(s.rsvp, isConfirmed && s.rsvpActive)}
          onClick={handleToggle}
          disabled={toggle.isPending}
          aria-pressed={isConfirmed}
        >
          {isConfirmed && <Check size={12} aria-hidden="true" />}
          Půjdu
        </button>
      )}
    </Link>
  );
}
