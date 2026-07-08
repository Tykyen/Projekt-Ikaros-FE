import clsx from 'clsx';
import s from './SupporterBadge.module.css';

type Size = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<Size, number> = { sm: 16, md: 20, lg: 28 };

type Props = {
  size?: Size;
  className?: string;
  title?: string;
};

/**
 * 19.4 (spec-19.4) — odznak podporovatele: „základní obrázek" Ikara v kruhu
 * s prstenem barvy skinu (`--theme-accent`) a jemným svitem. Zobrazuje se u
 * jména místo hvězdičky, když role NEMÁ hvězdu (viz `IdentityBadge`).
 */
export function SupporterBadge({
  size = 'md',
  className,
  title = 'Podporovatel',
}: Props) {
  const px = SIZE_PX[size];
  return (
    <span
      className={clsx(s.badge, className)}
      style={{ width: px, height: px }}
      title={title}
      aria-label={title}
    >
      <img src="/brand/ikaros-seal.webp" alt="" aria-hidden="true" />
    </span>
  );
}
