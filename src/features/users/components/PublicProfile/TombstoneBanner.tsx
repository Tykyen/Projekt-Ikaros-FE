import clsx from 'clsx';
import s from './PublicProfile.module.css';

interface Props {
  variant: 'pending' | 'deleted';
}

/**
 * Spec 1.4 — admin overlay nad tombstone profilem. Běžný uživatel ho neuvidí
 * (BE vrátí 404 dřív).
 */
export function TombstoneBanner({ variant }: Props) {
  return (
    <div
      role="alert"
      className={clsx(
        s.tombstoneBanner,
        variant === 'deleted' && s.tombstoneBannerDeleted,
      )}
    >
      {variant === 'deleted' ? 'Účet smazán' : 'Pending deletion'}
    </div>
  );
}
