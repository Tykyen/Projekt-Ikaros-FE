/**
 * Spec 26.1 — kotva Vypravěče (FAB, pravý dolní roh).
 * Mimo svět mluví Ishida (silueta cylindr), ve světě Joe (silueta lucerna) —
 * placeholder siluety do dodání grafiky (02a). Stav „spí" = jen na zavolání.
 */
import { SiluetaLucerna } from './siluety';
import ishidaAvatarWebp96 from '@/assets/vypravec/ishida-avatar-96.webp';
import ishidaAvatarWebp192 from '@/assets/vypravec/ishida-avatar-192.webp';
import ishidaAvatarPng from '@/assets/vypravec/ishida-avatar.png';
import s from './Vypravec.module.css';

export function VypravecFab({
  scope,
  otevreny,
  spi,
  onClick,
}: {
  scope: 'ikaros' | 'world';
  otevreny: boolean;
  spi?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={s.fab}
      data-spi={spi || undefined}
      data-vypravec-fab=""
      aria-label="Vypravěč — nápověda a průvodce"
      aria-expanded={otevreny}
      aria-haspopup="dialog"
      onClick={onClick}
    >
      {scope === 'world' ? (
        /* ve světě tokenizovaná silueta Joe (currentColor — 12 motivů zdarma) */
        <SiluetaLucerna />
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
