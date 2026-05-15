import { useState } from 'react';
import s from './RatingStars.module.css';

interface Props {
  /** Průměrné hodnocení (zobrazené hvězdy když nejde hodnotit). */
  average: number;
  count: number;
  /** Hodnocení přihlášeného uživatele (0 = nehodnotil). */
  myRating?: number;
  /** Pokud zadáno, hvězdy jsou interaktivní. */
  onRate?: (stars: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 3.3d — hvězdičkové hodnocení 1–5. Bez `onRate` jen zobrazuje průměr;
 * s `onRate` je interaktivní (hover + klik). Sdílí ho lightbox i detail.
 */
export function RatingStars({
  average,
  count,
  myRating = 0,
  onRate,
  disabled,
  size = 'md',
}: Props) {
  const [hover, setHover] = useState(0);
  const interactive = !!onRate && !disabled;
  // Interaktivní → ukazuje hover/moje hodnocení; jinak průměr.
  const shown = interactive ? hover || myRating : Math.round(average);

  return (
    <div className={s.wrap}>
      <div
        className={`${s.stars} ${s[size]}`}
        role={interactive ? 'group' : undefined}
        aria-label={
          interactive ? 'Ohodnotit obrázek' : `Průměr ${average} z 5`
        }
      >
        {[1, 2, 3, 4, 5].map((n) =>
          interactive ? (
            <button
              key={n}
              type="button"
              className={n <= shown ? s.starFull : s.starEmpty}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onRate?.(n)}
              aria-label={`${n} z 5`}
            >
              ★
            </button>
          ) : (
            <span
              key={n}
              className={n <= shown ? s.starFull : s.starEmpty}
              aria-hidden
            >
              ★
            </span>
          ),
        )}
      </div>
      <span className={s.meta}>
        {count > 0 ? (
          <>
            <strong>{average.toFixed(1)}</strong>
            <span className={s.count}>
              ({count}×{myRating > 0 ? ` · tvé ${myRating}★` : ''})
            </span>
          </>
        ) : (
          <span className={s.count}>Zatím bez hodnocení</span>
        )}
      </span>
    </div>
  );
}
