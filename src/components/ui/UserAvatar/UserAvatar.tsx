import { useState } from 'react';
import clsx from 'clsx';
import type { DefaultAvatarType } from '../../../types';
import styles from './UserAvatar.module.css';

type Size = 'sm' | 'md' | 'lg' | 'xl';

interface Props {
  src?: string | null;
  defaultType?: DefaultAvatarType;
  size?: Size;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

const sizePxMap: Record<Size, number> = {
  sm: 32,
  md: 64,
  lg: 96,
  xl: 128,
};

function defaultUrl(type: DefaultAvatarType, size: Size): string {
  const small = size === 'sm' || size === 'md';
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
}: Props) {
  const fallback = defaultUrl(defaultType, size);
  const [errored, setErrored] = useState(false);
  const url = !src || errored ? fallback : src;
  const px = sizePxMap[size];

  return (
    <img
      src={url}
      alt={alt}
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
