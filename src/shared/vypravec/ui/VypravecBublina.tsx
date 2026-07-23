/**
 * Spec 26.5 (D9) — vizuál bubliny u kotvy (03 §3): repliky kurzívou
 * (hlas postavy), max 1 CTA + tiché zavření.
 * A11y: obálka je live region (role=status + aria-live) i když je bublina
 * prázdná — čtečka pak spolehlivě ohlásí obsah vložený do už existujícího
 * regionu. (Pozn.: VypravecRoot komponentu montuje jen mimo otevřený panel,
 * takže napříč otevřením/zavřením panelu se region přesto remountuje.)
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
  const maAkci = Boolean(bublina?.akce);

  return (
    <div
      className={s.bublinaRegion}
      role="status"
      aria-live="polite"
      aria-label="Vypravěč"
    >
      {bublina && (
        <div
          className={s.bublina}
          // Bublina s akcí = interaktivní skupina (nález 7).
          role={maAkci ? 'group' : undefined}
          aria-label={maAkci ? 'Vypravěč nabízí akci' : undefined}
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
      )}
    </div>
  );
}
