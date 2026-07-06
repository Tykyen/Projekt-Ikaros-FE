import { useState } from 'react';
import clsx from 'clsx';
import type { DefaultAvatarType } from '@/shared/types';
import styles from './UserAvatar.module.css';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface Props {
  src?: string | null;
  defaultType?: DefaultAvatarType;
  size?: Size;
  alt?: string;
  className?: string;
  onClick?: () => void;
  /**
   * 1.3c — tombstone overlay (smazaný účet).
   * - Vykreslí černou diagonální pásku přes avatar.
   * - Grayscale + brightness 0.6 na samotném obrázku.
   * - `alt` se přepíše na "Smazaný účet".
   */
  deleted?: boolean;
}

const sizePxMap: Record<Size, number> = {
  xs: 20,
  sm: 32,
  md: 64,
  lg: 96,
  xl: 128,
};

function defaultUrl(type: DefaultAvatarType, size: Size): string {
  // xs/sm/md používají 256px webp asset (suffix -sm), lg/xl plnou 512px
  const small = size === 'xs' || size === 'sm' || size === 'md';
  const suffix = small ? '-sm' : '';
  return `/defaults/avatars/${type}${suffix}.webp`;
}

/**
 * UserAvatar — kruhový avatar s fallbackem na default per pohlaví.
 * 1.3a: src null/undefined → fallback `/defaults/avatars/<type>.webp`.
 * 1.3c (budoucí): bude přijímat `deleted` prop pro tombstone overlay.
 */
export function UserAvatar({
  src,
  defaultType = 'male',
  size = 'md',
  alt = '',
  className,
  onClick,
  deleted = false,
}: Props) {
  const fallback = defaultUrl(defaultType, size);
  const [errored, setErrored] = useState(false);
  // FIX-2 — `errored` se bez resyncu nikdy nevrátí zpět: jednou selhané
  // src (starý/rozbitý avatar) natrvalo zafixuje fallback i po změně `src`
  // na platnou URL (výměna avataru, přepnutí mezi uživateli v seznamu…).
  // Adjustment-during-render (ne effect — vyhne se cascading re-renderu).
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setErrored(false);
  }
  const url = !src || errored ? fallback : src;
  const px = sizePxMap[size];
  const effectiveAlt = deleted ? 'Smazaný účet' : alt;

  if (deleted) {
    return (
      <span
        className={clsx(styles.wrap, styles[size], styles.deletedWrap, className)}
        style={{ width: px, height: px }}
        aria-label="Smazaný účet"
      >
        <img
          src={url}
          alt={effectiveAlt}
          width={px}
          height={px}
          className={clsx(styles.avatar, styles[size], styles.deletedImg)}
          onError={() => setErrored(true)}
        />
        <span className={styles.deletedBand} aria-hidden="true" />
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={effectiveAlt}
      width={px}
      height={px}
      className={clsx(styles.avatar, styles[size], className)}
      onError={() => setErrored(true)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    />
  );
}
