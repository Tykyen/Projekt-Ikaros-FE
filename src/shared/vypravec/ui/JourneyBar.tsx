/**
 * Spec 26.4 (D8) — lišta aktivního kroku cesty.
 * Plná lišta (progress kroužek + titul + replika + CTA/Přeskočit/Pauza);
 * na kolizní ploše jen minimalizovaný proužek 32 px (03 §8.3 — sbalení ≠
 * zmizení; instrukce kroku je doručená předem, completion event potvrdí).
 * V jiném světě než contextWorld cesty se lišta sbalí do badge s navigate CTA.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  bazoveId,
  doplnSlug,
  pauzaCesty,
  preskocitKrok,
  type AktivniCesta,
} from '../engine/journeyEngine';
import { POPISKY_CEST } from '../registry/journeys';
import { onboardingStore } from '../state/onboardingStore';
import { zvyrazni } from '../engine/highlight';
import s from './Vypravec.module.css';

export function JourneyBar({
  akt,
  kolizni,
  jinySvet,
  aktualniSlug,
}: {
  akt: AktivniCesta;
  kolizni: boolean;
  /** Uživatel je ve světě ≠ contextWorld cesty (05 §2). */
  jinySvet: boolean;
  /** Slug světa, ve kterém uživatel PRÁVĚ je — fallback pro cesty bez
   *  fixace (worldBinding 'none', např. tm-vycvik). */
  aktualniSlug?: string;
}) {
  const navigate = useNavigate();
  const [rozbalenaVKolizi, setRozbalenaVKolizi] = useState(false);
  // D-080: výška lišty do CSS proměnné — bublina se na mobilu zvedne nad ni
  // (vzor --map-inset-top), místo aby ji překryla.
  const listaRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = listaRef.current;
    const root = document.documentElement;
    root.style.setProperty('--journey-bar-h', `${el?.offsetHeight ?? 0}px`);
    return () => root.style.setProperty('--journey-bar-h', '0px');
  });
  const krok = akt.dalsiKrok;
  if (!krok) return null;
  // Bez slugu by CTA navigovalo na doslovné ':worldSlug' → „Svět nenalezen".
  const slug = akt.contextWorldSlug ?? aktualniSlug;
  const bezSlugu = doplnSlug(krok.cta.to, slug).includes(':worldSlug');
  // D-080: na platformě bez fixace vede CTA aspoň na výběr světa.
  const ctaCil = bezSlugu ? '/ikaros/vesmiry' : doplnSlug(krok.cta.to, slug);
  const ctaLabel = bezSlugu ? 'Vybrat svět' : krok.cta.label;
  const ctaFunkcni = true;
  const pauznuta = Boolean(
    onboardingStore.getSnapshot().journeys[akt.klic]?.pausedAt,
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
        aria-label={`${POPISKY_CEST[akt.cesta.id] ?? akt.cesta.id}: ${text} (${akt.poradi.hotovo}/${akt.poradi.celkem})`}
      >
        <span className={s.mini}>
          {akt.poradi.hotovo}/{akt.poradi.celkem}
        </span>
        {text}
      </button>
    );
  }

  return (
    <div ref={listaRef} className={s.lista} aria-label="Aktivní krok cesty">
      <div className={s.kruh} style={{ ['--prog' as string]: `${progresDeg}deg` }}>
        <span>
          {akt.poradi.hotovo}/{akt.poradi.celkem}
        </span>
      </div>
      <div className={s.listaTexty} role="status">
        <div className={s.listaTitul}>
          {krok.title} <span aria-hidden="true">· ~{krok.estMin} min</span>
        </div>
        <div className={s.listaReplika}>
          {bazoveId(akt.klic) === 'tm-vycvik' && (
            <strong className={s.mluvciLabel}>Měďák · </strong>
          )}
          {krok.narratorLine}
        </div>
      </div>
      <div className={s.listaAkce}>
        {ctaFunkcni && (
          <button
            type="button"
            className={s.cta}
            onClick={() => {
              navigate(ctaCil);
              if (krok.anchor) zvyrazni(krok.anchor); // čeká na mount cíle (retry)
            }}
          >
            {ctaLabel}
          </button>
        )}
        <button
          type="button"
          className={s.ctaTiche}
          onClick={() => preskocitKrok(akt.klic, krok.id)}
        >
          Přeskočit
        </button>
        <button
          type="button"
          className={s.ctaTiche}
          aria-label="Pozastavit cestu"
          title="Pozastavit cestu"
          onClick={() => pauzaCesty(akt.klic, true)}
        >
          ⏸
        </button>
      </div>
    </div>
  );
}
