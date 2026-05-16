import { Bookmark } from 'lucide-react';
import clsx from 'clsx';
import s from './FavoriteToggle.module.css';

interface Props {
  /** Je položka v oblíbených uživatele. */
  isFavorite: boolean;
  /** Klik na záložku — caller spustí toggle mutaci. */
  onToggle: () => void;
  /** Probíhá mutace → tlačítko disabled. */
  pending?: boolean;
  /**
   * `button` — ikona + text „Oblíbené" (detailové stránky).
   * `icon` — kompaktní jen ikona (karty / dlaždice).
   */
  variant?: 'button' | 'icon';
  className?: string;
}

/**
 * 3.7 — sdílený přepínač oblíbenosti. Ikona záložky (`Bookmark`), ne hvězda —
 * hvězda je vyhrazená ratingu. Na kartách (`<Link>`) klik `preventDefault` +
 * `stopPropagation`, aby nepropadl do otevření detailu.
 */
export function FavoriteToggle({
  isFavorite,
  onToggle,
  pending,
  variant = 'button',
  className,
}: Props) {
  const label = isFavorite
    ? 'Odebrat z oblíbených'
    : 'Přidat do oblíbených';
  return (
    <button
      type="button"
      className={clsx(
        variant === 'button' ? s.button : s.iconBtn,
        isFavorite && s.active,
        className,
      )}
      disabled={pending}
      aria-pressed={isFavorite}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
    >
      <Bookmark
        size={variant === 'button' ? 14 : 16}
        className={clsx(s.icon, isFavorite && s.iconActive)}
        fill={isFavorite ? 'currentColor' : 'none'}
        aria-hidden
      />
      {variant === 'button' && <span>Oblíbené</span>}
    </button>
  );
}
