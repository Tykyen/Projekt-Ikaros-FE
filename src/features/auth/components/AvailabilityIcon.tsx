import s from './AvailabilityIcon.module.css';

export type AvailabilityStatus =
  | 'idle'
  | 'loading'
  | 'available'
  | 'unavailable';

interface Props {
  status: AvailabilityStatus;
}

export function AvailabilityIcon({ status }: Props) {
  if (status === 'idle') return null;

  if (status === 'loading') {
    return (
      <span
        className={s.icon}
        data-status="loading"
        aria-label="Ověřuji dostupnost"
        role="status"
      >
        <span className={s.spinner} />
      </span>
    );
  }

  if (status === 'available') {
    return (
      <span
        className={s.icon}
        data-status="available"
        aria-label="K dispozici"
      >
        ✓
      </span>
    );
  }

  return (
    <span
      className={s.icon}
      data-status="unavailable"
      aria-label="Obsazené"
    >
      ✗
    </span>
  );
}
