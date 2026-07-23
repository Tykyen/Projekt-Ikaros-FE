/**
 * Spec 26.4 (D8) — lišta aktivního kroku cesty.
 * Plná lišta (progress kroužek + titul + replika + CTA/Přeskočit/Pauza);
 * na kolizní ploše jen minimalizovaný proužek 32 px (03 §8.3 — sbalení ≠
 * zmizení; instrukce kroku je doručená předem, completion event potvrdí).
 * V jiném světě než contextWorld cesty se lišta sbalí do badge s navigate CTA.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  doplnSlug,
  pauzaCesty,
  preskocitKrok,
  type AktivniCesta,
} from '../engine/journeyEngine';
import { onboardingStore } from '../state/onboardingStore';
import s from './Vypravec.module.css';

export function JourneyBar({
  akt,
  kolizni,
  jinySvet,
}: {
  akt: AktivniCesta;
  kolizni: boolean;
  /** Uživatel je ve světě ≠ contextWorld cesty (05 §2). */
  jinySvet: boolean;
}) {
  const navigate = useNavigate();
  const [rozbalenaVKolizi, setRozbalenaVKolizi] = useState(false);
  const krok = akt.dalsiKrok;
  if (!krok) return null;
  const pauznuta = Boolean(
    onboardingStore.getSnapshot().journeys[akt.cesta.id]?.pausedAt,
  );
  if (pauznuta) return null;

  const progresDeg = Math.round(
    (akt.poradi.hotovo / akt.poradi.celkem) * 360,
  );

  if ((kolizni && !rozbalenaVKolizi) || jinySvet) {
    const text = jinySvet
      ? 'Cesta pokračuje v jiném světě'
      : krok.title;
    return (
      <button
        type="button"
        className={s.prouzek}
        onClick={() => {
          if (jinySvet && akt.contextWorldSlug)
            navigate(`/svet/${akt.contextWorldSlug}`);
          else setRozbalenaVKolizi(true); // 03 §8.3: tap = rozbalení
        }}
        aria-label={`Cesta ${akt.cesta.id}: ${text} (${akt.poradi.hotovo}/${akt.poradi.celkem})`}
      >
        <span className={s.mini}>
          {akt.poradi.hotovo}/{akt.poradi.celkem}
        </span>
        {text}
      </button>
    );
  }

  return (
    <div className={s.lista} aria-label="Aktivní krok cesty">
      <div className={s.kruh} style={{ ['--prog' as string]: `${progresDeg}deg` }}>
        <span>
          {akt.poradi.hotovo}/{akt.poradi.celkem}
        </span>
      </div>
      <div className={s.listaTexty} role="status">
        <div className={s.listaTitul}>
          {krok.title} <span aria-hidden="true">· ~{krok.estMin} min</span>
        </div>
        <div className={s.listaReplika}>{krok.narratorLine}</div>
      </div>
      <div className={s.listaAkce}>
        <button
          type="button"
          className={s.cta}
          onClick={() => navigate(doplnSlug(krok.cta.to, akt.contextWorldSlug))}
        >
          {krok.cta.label}
        </button>
        <button
          type="button"
          className={s.ctaTiche}
          onClick={() => preskocitKrok(akt.cesta.id, krok.id)}
        >
          Přeskočit
        </button>
        <button
          type="button"
          className={s.ctaTiche}
          aria-label="Pozastavit cestu"
          title="Pozastavit cestu"
          onClick={() => pauzaCesty(akt.cesta.id, true)}
        >
          ⏸
        </button>
      </div>
    </div>
  );
}
