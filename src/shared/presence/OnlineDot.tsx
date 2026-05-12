import clsx from 'clsx';
import { usePresenceStatus } from './usePresence';
import s from './OnlineDot.module.css';

interface OnlineDotProps {
  userId: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Spec 1.5 — overlay tečka pro presence stav. Renderuje se absolutně
 * vůči rodičovskému relative wrapperu (zpravidla okolo avatara).
 *
 * D-049 — 3-stavový: online (zelená) / idle (amber) / offline (transparent).
 */
export function OnlineDot({ userId, size = 'md', className }: OnlineDotProps) {
  const status = usePresenceStatus(userId);
  const label =
    status === 'online' ? 'Online' : status === 'idle' ? 'Idle' : 'Offline';
  return (
    <span
      className={clsx(
        s.dot,
        size === 'sm' && s.sm,
        size === 'md' && s.md,
        status === 'online' && s.online,
        status === 'idle' && s.idle,
        status === 'offline' && s.offline,
        className,
      )}
      aria-label={label}
      title={label}
      role="status"
    />
  );
}
