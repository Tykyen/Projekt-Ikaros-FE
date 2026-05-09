import s from './CornerOrnament.module.css';

export type CornerPosition = 'tl' | 'tr' | 'bl' | 'br';

/**
 * Diamantový roh pro luxury panely (gaming-UI inspirace).
 * Rotovaný čtvercový div — působí jako "přibitý" roh panelu.
 *
 * Rodičovský element musí mít `position: relative`.
 */
export function CornerOrnament({ position }: { position: CornerPosition }) {
  return (
    <span
      className={s.ornament}
      data-position={position}
      aria-hidden="true"
    />
  );
}
