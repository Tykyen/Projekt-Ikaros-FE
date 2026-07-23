/**
 * Spec 26.1 — kotva Vypravěče (FAB, pravý dolní roh).
 * Mimo svět mluví Ishida, ve světě Joe — oba REÁLNÝM avatarem (rozhodnutí
 * vlastníka 2026-07-22 z živého testu: tokenizovaná silueta ve světě
 * nahrazena Joe avatarem; silueta zůstává jen jako koncept pro v2 theming).
 * Stav „spí" = jen na zavolání.
 */
import ishidaAvatarWebp96 from '@/assets/vypravec/ishida-avatar-96.webp';
import ishidaAvatarWebp192 from '@/assets/vypravec/ishida-avatar-192.webp';
import ishidaAvatarPng from '@/assets/vypravec/ishida-avatar.png';
import joeAvatarWebp96 from '@/assets/vypravec/joe-avatar-96.webp';
import joeAvatarWebp192 from '@/assets/vypravec/joe-avatar-192.webp';
import joeAvatarPng from '@/assets/vypravec/joe-avatar.png';
import s from './Vypravec.module.css';

export function VypravecFab({
  scope,
  otevreny,
  spi,
  badge,
  onClick,
}: {
  scope: 'ikaros' | 'world';
  otevreny: boolean;
  spi?: boolean;
  /** Počet nepřečtených změn (03 §3 stav Badge) — 0/undefined = bez tečky. */
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={s.fab}
      data-spi={spi || undefined}
      data-vypravec-fab=""
      aria-label={
        badge
          ? `Vypravěč — nápověda a průvodce (novinky: ${badge})`
          : 'Vypravěč — nápověda a průvodce'
      }
      aria-expanded={otevreny}
      aria-haspopup="dialog"
      onClick={onClick}
    >
      {badge ? <span className={s.fabBadge} aria-hidden="true" /> : null}
      {scope === 'world' ? (
        /* ve světě Joe (avatar; silueta odložena na v2 theming) */
        <picture>
          <source
            type="image/webp"
            srcSet={`${joeAvatarWebp96} 1x, ${joeAvatarWebp192} 2x`}
          />
          <img src={joeAvatarPng} alt="" className={s.fabImg} />
        </picture>
      ) : (
        /* mimo svět brand avatar Ishidy (03 §1) */
        <picture>
          <source
            type="image/webp"
            srcSet={`${ishidaAvatarWebp96} 1x, ${ishidaAvatarWebp192} 2x`}
          />
          <img src={ishidaAvatarPng} alt="" className={s.fabImg} />
        </picture>
      )}
    </button>
  );
}
