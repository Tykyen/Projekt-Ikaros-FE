/**
 * Spec 26.1 — panel Vypravěče (desktop rohový panel / mobilní bottom-sheet).
 * Shell BEZ enginu (D5): poctivá hlavička „Kde jsem" per scope + odkaz na
 * plnou nápovědu. Žádné mrtvé položky menu — přibývají až s funkcí.
 * A11y: role dialog (nemodální), focus trap, Esc zavírá (řeší VypravecRoot),
 * po zavření focus zpět na FAB (řeší VypravecRoot).
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SiluetaCylindr, SiluetaLucerna } from './siluety';
import s from './Vypravec.module.css';

/** Mosazný klíč — podpisová odrážka menu (znak Ishidovy organizace). */
function Klic() {
  return (
    <svg
      className={s.klic}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9M18 12v3M21 12v2" />
    </svg>
  );
}

export default function VypravecPanel({
  scope,
  worldName,
  onClose,
}: {
  scope: 'ikaros' | 'world';
  worldName?: string;
  onClose: () => void;
}) {
  const [rozbaleny, setRozbaleny] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Focus trap: fokus dovnitř při otevření, Tab cykluje uvnitř panelu.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const focusables = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
    focusables()[0]?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const els = focusables();
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    root.addEventListener('keydown', onKey);
    return () => root.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      ref={ref}
      className={s.panel}
      data-rozbaleny={rozbaleny || undefined}
      role="dialog"
      aria-labelledby="vypravec-kde-jsem"
    >
      <button
        type="button"
        className={s.madlo}
        aria-label={rozbaleny ? 'Zmenšit panel' : 'Zvětšit panel'}
        onClick={() => setRozbaleny((r) => !r)}
      />
      <header className={s.vstupenka}>
        <div className={s.kdeJsem}>
          <span className={s.avatar} aria-hidden="true">
            {scope === 'world' ? <SiluetaLucerna size={24} /> : <SiluetaCylindr size={24} />}
          </span>
          <div>
            <div className={s.kdeLabel} id="vypravec-kde-jsem">
              Kde jsem
            </div>
            <p className={s.kdeText}>
              {scope === 'world'
                ? worldName
                  ? `Jsi ve světě ${worldName}.`
                  : 'Jsi uvnitř světa.'
                : 'Jsi na platformě Ikaros.'}
            </p>
          </div>
        </div>
      </header>

      <div className={s.telo}>
        <p className={s.poznamka}>
          {scope === 'world'
            ? 'Jsem Joe — tvůj průvodce světy. Učím se mluvit; zatím ti posvítím aspoň na plnou nápovědu.'
            : 'Jsem Ishida — tohle místo jsem stvořil. Učím se mluvit; zatím tě zavedu do plné nápovědy.'}
        </p>
        <ul className={s.menu}>
          <li>
            <Link to="/ikaros/napoveda" onClick={onClose}>
              <Klic />
              Plná nápověda
            </Link>
          </li>
        </ul>
      </div>

      <footer className={s.pata}>
        <span>{scope === 'world' ? 'Joe · Vypravěč' : 'Ishida · Vypravěč'}</span>
        <button type="button" className={s.zavrit} onClick={onClose}>
          Zavřít (Esc)
        </button>
      </footer>
    </div>
  );
}
