/**
 * Spec 26.5 (D9) — vizuál bubliny u kotvy (03 §3): repliky kurzívou
 * (hlas postavy), max 1 CTA + tiché zavření; role="status" (aria-live polite).
 */
import { useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { bublinaStore } from './bublinaStore';
import { bustaProBublinu } from './bublinaBusty';
import s from './Vypravec.module.css';

export function VypravecBublina() {
  const bublina = useSyncExternalStore(
    bublinaStore.subscribe,
    bublinaStore.getSnapshot,
  );
  const navigate = useNavigate();
  if (!bublina) return null;

  // A11y (nález 7): bublina s akcí = interaktivní skupina (role=group +
  // aria-live, ať čtečka ohlásí text i to, že nabízí akci); čistá oslava/info
  // zůstává status (jen oznámení, auto-hide).
  const maAkci = Boolean(bublina.akce);
  return (
    <div
      className={s.bublina}
      role={maAkci ? 'group' : 'status'}
      aria-live="polite"
      aria-label={maAkci ? 'Vypravěč nabízí akci' : 'Vypravěč'}
    >
      <button
        type="button"
        className={s.bublinaZavrit}
        aria-label="Zavřít"
        onClick={() => bublinaStore.zavrit()}
      >
        ✕
      </button>
      <div className={s.bublinaTelo}>
        {/* D-080c — busta mluvčího dle nálady (oslava/chyba/tip) */}
        <img
          src={bustaProBublinu(bublina.mluvci ?? 'ikaros', bublina)}
          alt=""
          aria-hidden="true"
          className={s.bublinaBusta}
        />
        <p className={s.bublinaText}>{bublina.text}</p>
      </div>
      {bublina.akce && (
        <div className={s.bublinaAkce}>
          <button
            type="button"
            className={s.cta}
            onClick={() => {
              const { to, onClick } = bublina.akce!;
              bublinaStore.interakce();
              if (onClick) onClick();
              else if (to) navigate(to);
            }}
          >
            {bublina.akce.label}
          </button>
          <button
            type="button"
            className={s.ctaTiche}
            onClick={() => bublinaStore.zavrit()}
          >
            Teď ne
          </button>
        </div>
      )}
    </div>
  );
}
