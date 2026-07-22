/**
 * Spec 26.1 — panel Vypravěče (desktop rohový panel / mobilní bottom-sheet).
 * Shell BEZ enginu (D5): poctivá hlavička „Kde jsem" per scope + odkaz na
 * plnou nápovědu. Žádné mrtvé položky menu — přibývají až s funkcí.
 * A11y: role dialog (nemodální), focus trap, Esc zavírá (řeší VypravecRoot),
 * po zavření focus zpět na FAB (řeší VypravecRoot).
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ResolvedHeader } from '../engine/resolveHeader';
import ishidaAvatarWebp96 from '@/assets/vypravec/ishida-avatar-96.webp';
import ishidaAvatarWebp192 from '@/assets/vypravec/ishida-avatar-192.webp';
import ishidaAvatarPng from '@/assets/vypravec/ishida-avatar.png';
import joeAvatarWebp96 from '@/assets/vypravec/joe-avatar-96.webp';
import joeAvatarWebp192 from '@/assets/vypravec/joe-avatar-192.webp';
import joeAvatarPng from '@/assets/vypravec/joe-avatar.png';
import s from './Vypravec.module.css';

const AVATARY = {
  ikaros: { webp96: ishidaAvatarWebp96, webp192: ishidaAvatarWebp192, png: ishidaAvatarPng },
  world: { webp96: joeAvatarWebp96, webp192: joeAvatarWebp192, png: joeAvatarPng },
} as const;

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

/** 26.4 — volba persony: jediné auto-otevření panelu vůbec (05 §1). */
const PERSONA_VOLBY: Array<{
  persona: 'pj' | 'hrac' | 'worldbuilder' | null;
  titul: string;
  popis: string;
}> = [
  { persona: 'pj', titul: 'Chci vést hru', popis: 'Založíme ti svět a do 15 minut pozveš první hráče.' },
  { persona: 'hrac', titul: 'Chci hrát', popis: 'Najdeme ti stůl — světy, nábory, nebo rovnou Putyka.' },
  { persona: 'worldbuilder', titul: 'Chci tvořit svět', popis: 'Wiki, mapy a pavučina vztahů — svět i bez hráčů.' },
  { persona: null, titul: 'Jen se rozhlédnu', popis: 'Dobře. Kdybys mě potřeboval, víš, kde mě najdeš.' },
];

export default function VypravecPanel({
  scope,
  worldName,
  header,
  personaVolba,
  onPersona,
  onClose,
}: {
  scope: 'ikaros' | 'world';
  worldName?: string;
  header: ResolvedHeader | null;
  /** true = obsah panelu je volba persony (auto-open po registraci). */
  personaVolba?: boolean;
  onPersona?: (p: 'pj' | 'hrac' | 'worldbuilder' | null) => void;
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
          <span className={s.avatar}>
            <picture>
              <source
                type="image/webp"
                srcSet={`${AVATARY[scope].webp96} 1x, ${AVATARY[scope].webp192} 2x`}
              />
              <img
                src={AVATARY[scope].png}
                alt=""
                loading="lazy"
                className={s.avatarImg}
              />
            </picture>
          </span>
          <div>
            <div className={s.kdeLabel} id="vypravec-kde-jsem">
              {personaVolba ? 'Vítej' : 'Kde jsem'}
            </div>
            <p className={s.kdeText}>
              {personaVolba ? (
                'Zdravím tě, příteli. Jsem Ishida — tohle místo jsem stvořil a znám každý jeho kout. Než vykročíš: chceš vést hru, hrát, nebo tvořit svět?'
              ) : header ? (
                <>
                  <strong>{header.name}</strong> — {header.text}
                </>
              ) : scope === 'world' ? (
                worldName ? (
                  `Jsi ve světě ${worldName}. Tenhle kout nemám zmapovaný ani já — mrkni do plné nápovědy.`
                ) : (
                  'Jsi uvnitř světa. Tenhle kout nemám zmapovaný ani já — mrkni do plné nápovědy.'
                )
              ) : (
                'Jsi na platformě Ikaros. Tenhle kout je neprobádaný i pro mě — nahlédni do plné nápovědy.'
              )}
            </p>
          </div>
        </div>
      </header>

      <div className={s.telo}>
        {personaVolba && onPersona ? (
          <div className={s.personaVolby}>
            {PERSONA_VOLBY.map((v) => (
              <button
                key={v.titul}
                type="button"
                className={s.personaVolba}
                onClick={() => onPersona(v.persona)}
              >
                {v.titul}
                <small>{v.popis}</small>
              </button>
            ))}
          </div>
        ) : (
          <ul className={s.menu}>
            <li>
              <Link to="/ikaros/napoveda" onClick={onClose}>
                <Klic />
                Plná nápověda
              </Link>
            </li>
          </ul>
        )}
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
