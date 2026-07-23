/**
 * Spec 26.1/26.6 — panel Vypravěče (desktop rohový panel / mobilní bottom-sheet).
 * Bloky (03 §8.1): A) „Kde jsem" hlavička · B) „K věci" kontextové karty
 * (max 4 topiky pro routu+publikum) · C) trvalé menu. TopicView s povinnou
 * patičkou zpětné vazby „Pomohlo ti to?" (telemetrie feedback ±).
 * A11y: role dialog (nemodální), focus trap, Esc/focus řeší VypravecRoot.
 */
import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
} from 'react';
import { Link } from 'react-router-dom';
import type { ResolvedHeader } from '../engine/resolveHeader';
import { topikyProRoutu, topikPodleId } from '../registry/topics';
import { NAVODY } from '../registry/navody';
import { hledej } from '../engine/hledani';
import { VypravecChyba } from './VypravecChyba';
import {
  ZMENY,
  oznacZmenyVidene,
  pocetNovychZmen,
} from '../registry/changelog';
import { CESTY } from '../registry/journeys';
import {
  aktualniKlic,
  pauzaCesty,
  postupCesty,
  startCesty,
  zrusitCestu,
} from '../engine/journeyEngine';
import { api } from '@/shared/api';
import { WorldRole, type MyWorldEntry } from '@/shared/types';
import { useAtomValue } from 'jotai';
import { currentUserAtom } from '@/shared/store/authStore';
import { onboardingStore } from '../state/onboardingStore';
import type { HelpTopic } from '../registry/types';
import { doplnSlug } from '../engine/journeyEngine';
import { telemetrie } from '../state/telemetry';
import ishidaAvatarWebp96 from '@/assets/vypravec/ishida-avatar-96.webp';
import ishidaAvatarWebp192 from '@/assets/vypravec/ishida-avatar-192.webp';
import ishidaAvatarPng from '@/assets/vypravec/ishida-avatar.png';
import ishidaVitaWebp from '@/assets/vypravec/ishida-bust-vita-256.webp';
import ishidaVitaPng from '@/assets/vypravec/ishida-bust-vita.png';
import joeAvatarWebp96 from '@/assets/vypravec/joe-avatar-96.webp';
import joeAvatarWebp192 from '@/assets/vypravec/joe-avatar-192.webp';
import joeAvatarPng from '@/assets/vypravec/joe-avatar.png';
import medakAvatarWebp96 from '@/assets/vypravec/medak-avatar-96.webp';
import medakAvatarWebp192 from '@/assets/vypravec/medak-avatar-192.webp';
import medakAvatarPng from '@/assets/vypravec/medak-avatar.png';
import s from './Vypravec.module.css';

const AVATARY = {
  ikaros: { webp96: ishidaAvatarWebp96, webp192: ishidaAvatarWebp192, png: ishidaAvatarPng },
  world: { webp96: joeAvatarWebp96, webp192: joeAvatarWebp192, png: joeAvatarPng },
  // Taktická mapa = Měďákovo cvičiště (02 §1.5) — mluví a podepisuje se on.
  tm: { webp96: medakAvatarWebp96, webp192: medakAvatarWebp192, png: medakAvatarPng },
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

// MVP-B: lazy taháky per topik — cache na úrovni modulu, ať má komponenta
// stabilní identitu napříč rendery (jinak Suspense bliká a hooks warning).
const tahakCache = new Map<
  string,
  ComponentType<{ audience: import('../registry/types').VypravecAudience }>
>();
function tahakPro(topik: HelpTopic) {
  if (!topik.bodyComponent) return null;
  let c = tahakCache.get(topik.id);
  if (!c) {
    c = lazy(topik.bodyComponent);
    tahakCache.set(topik.id, c);
  }
  return c;
}

function TopicView({
  topik,
  worldSlug,
  audience,
  onZpet,
  onClose,
}: {
  topik: HelpTopic;
  worldSlug?: string;
  audience: string;
  onZpet: () => void;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState<'ano' | 'ne' | null>(null);
  const Tahak = tahakPro(topik);
  return (
    <div>
      <button type="button" className={s.zpet} onClick={onZpet}>
        ← Zpět
      </button>
      <h2 className={s.topikTitul}>{topik.title}</h2>
      {topik.body.odstavce.map((o) => (
        <p key={o.slice(0, 24)} className={s.topikOdstavec}>
          {o}
        </p>
      ))}
      {topik.body.kroky && (
        <ol className={s.topikKroky}>
          {topik.body.kroky.map((k) => (
            <li key={k.slice(0, 24)}>{k}</li>
          ))}
        </ol>
      )}
      {Tahak && (
        <VypravecChyba
          naChybu={(zkusZnovu) => (
            <p className={s.topikOdstavec} role="alert">
              Tahák se nepodařilo načíst — zkontroluj připojení.{' '}
              <button
                type="button"
                className={s.ctaTiche}
                onClick={() => {
                  tahakCache.delete(topik.id); // rejected import necachovat
                  zkusZnovu();
                }}
              >
                Zkusit znovu
              </button>
            </p>
          )}
        >
          <Suspense
            fallback={<p className={s.topikOdstavec}>Načítám tahák…</p>}
          >
            {/* eslint-disable-next-line react-hooks/static-components -- identita je stabilní: tahakPro čte modulovou cache per topik.id */}
            <Tahak
              audience={audience as import('../registry/types').VypravecAudience}
            />
          </Suspense>
        </VypravecChyba>
      )}
      {topik.minAudienceNote && (
        <p className={s.poznamka}>{topik.minAudienceNote}</p>
      )}
      {topik.akce
        ?.filter((a) => worldSlug || !a.to.includes(':worldSlug'))
        .map((a) => (
        <Link
          key={a.to}
          to={doplnSlug(a.to, worldSlug)}
          className={s.topikAkce}
          onClick={onClose}
        >
          {a.label} →
        </Link>
      ))}
      <div className={s.feedback}>
        {feedback === null ? (
          <>
            <span>Pomohlo ti to?</span>
            <button
              type="button"
              className={s.ctaTiche}
              onClick={() => {
                telemetrie('feedback_plus', { refId: topik.id });
                setFeedback('ano');
              }}
            >
              Ano
            </button>
            <button
              type="button"
              className={s.ctaTiche}
              onClick={() => {
                telemetrie('feedback_minus', { refId: topik.id });
                setFeedback('ne');
              }}
            >
              Ne
            </button>
          </>
        ) : feedback === 'ano' ? (
          <span>Dobře. Kdykoli znovu.</span>
        ) : (
          <span>
            Rozumím.{' '}
            <Link to="/ikaros/napoveda" onClick={onClose}>
              Zkus plnou nápovědu
            </Link>{' '}
            — a já to předám dál.
          </span>
        )}
      </div>
    </div>
  );
}

/** Menu Cesty (05 §2): obnova/pauza/zrušení kdykoli; žádný guilt-trip. */
function CestyView({ onZpet }: { onZpet: () => void }) {
  const stav = useSyncExternalStore(
    onboardingStore.subscribe,
    onboardingStore.getSnapshot,
  );
  // Anonym cestu startovat nesmí — login by ji zahodil (journeys se nemergují).
  const prihlasen = useAtomValue(currentUserAtom) != null;
  // D-079: PJ/WB s vlastními světy si při startu 'creates' cesty vybere svět
  // (probe by jinak zafixoval PRVNÍ navštívený). Lazy api.get až při kliku —
  // shell nesmí záviset na QueryClientProvideru.
  const [vyberSvetaPro, setVyberSvetaPro] = useState<string | null>(null);
  const [vlastniSvety, setVlastniSvety] = useState<
    { id: string; slug?: string; name: string }[]
  >([]);
  async function klikZacit(cestaId: string, binding?: string): Promise<void> {
    if (binding === 'creates') {
      try {
        const data = await api.get<MyWorldEntry[]>('/worlds/my');
        const vlastni = (Array.isArray(data) ? data : [])
          .filter((e) => e.membership?.role === WorldRole.PJ)
          .map((e) => ({
            id: e.world.id,
            slug: e.world.slug,
            name: e.world.name,
          }));
        if (vlastni.length > 0) {
          setVlastniSvety(vlastni);
          setVyberSvetaPro(cestaId);
          return;
        }
      } catch {
        /* nedostupné → start bez výběru (probe doladí později) */
      }
    }
    startCesty(cestaId);
  }
  const POPISKY: Record<string, string> = {
    'pj-start': 'PJ Start — od nuly k první zprávě ve vlastním světě',
    'hrac-start': 'Cesta hráče — najdi stůl a ozvi se',
    'wb-start': 'Cesta tvůrce — ateliér, wiki, Pavučina, výkladní skříň',
    'tm-vycvik': 'Výcvik taktické mapy — Měďákův dril pro PJ',
  };
  return (
    <div>
      <button type="button" className={s.zpet} onClick={onZpet}>
        ← Zpět
      </button>
      <div className={s.personaVolby}>
        {Object.values(CESTY)
          // tm-vycvik je PJ dril (BE ops PJ-only) — hráči by měl věčných 0/5.
          .filter(
            (c) =>
              c.id !== 'tm-vycvik' ||
              stav.persona === 'pj' ||
              Boolean(stav.journeys[aktualniKlic('pj-start')]),
          )
          .map((c) => {
          const prog = stav.journeys[aktualniKlic(c.id)];
          const { hotovo, celkem } = postupCesty(c.id);
          const bezi = prog && !prog.dismissedAt && hotovo < celkem;
          const pauznuta = Boolean(bezi && prog?.pausedAt);
          const dokoncena = prog && !prog.dismissedAt && hotovo >= celkem;
          return (
            <div key={c.id} className={s.personaVolba}>
              {POPISKY[c.id] ?? c.id}
              <small>
                {dokoncena
                  ? 'Dokončeno ✓'
                  : bezi
                    ? `Krok ${hotovo + 1} z ${celkem}${pauznuta ? ' · pozastaveno' : ''}`
                    : `~${c.estimateMin} min`}
              </small>
              <div className={s.bublinaAkce}>
                {!prog || prog.dismissedAt ? (
                  prihlasen ? (
                    vyberSvetaPro === c.id ? (
                      // D-079: výběr světa před startem 'creates' cesty
                      <div className={s.vyberSveta}>
                        <small>Ke kterému světu cestu připnout?</small>
                        {vlastniSvety.map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            className={s.ctaTiche}
                            onClick={() => {
                              startCesty(c.id, { id: w.id, slug: w.slug });
                              setVyberSvetaPro(null);
                            }}
                          >
                            {w.name}
                          </button>
                        ))}
                        <button
                          type="button"
                          className={s.cta}
                          onClick={() => {
                            startCesty(c.id);
                            setVyberSvetaPro(null);
                          }}
                        >
                          Založím nový svět
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={s.cta}
                        onClick={() => void klikZacit(c.id, c.worldBinding)}
                      >
                        Začít
                      </button>
                    )
                  ) : (
                    <small>Cesty jsou pro přihlášené — vytvoř si účet.</small>
                  )
                ) : dokoncena ? null : (
                  <>
                    <button
                      type="button"
                      className={s.cta}
                      onClick={() => pauzaCesty(c.id, !pauznuta)}
                    >
                      {pauznuta ? 'Pokračovat' : 'Pozastavit'}
                    </button>
                    <button
                      type="button"
                      className={s.ctaTiche}
                      onClick={() => zrusitCestu(c.id)}
                    >
                      Zrušit cestu
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function VypravecPanel({
  scope,
  worldName,
  worldSlug,
  pattern,
  audience,
  header,
  personaVolba,
  onPersona,
  onClose,
}: {
  scope: 'ikaros' | 'world';
  worldName?: string;
  worldSlug?: string;
  /** Route pattern pro nabídku topiků (blok B). */
  pattern: string | null;
  /** Publikum (audienceZRole / anon / prihlaseny). */
  audience: string;
  header: ResolvedHeader | null;
  /** true = obsah panelu je volba persony (auto-open po registraci). */
  personaVolba?: boolean;
  onPersona?: (p: 'pj' | 'hrac' | 'worldbuilder' | null) => void;
  onClose: () => void;
}) {
  const [rozbaleny, setRozbaleny] = useState(false);
  const [topikId, setTopikId] = useState<string | null>(null);
  const [pohled, setPohled] = useState<'domu' | 'navody' | 'cesty' | 'zmeny'>(
    'domu',
  );
  // S2 „Zeptat se" — fulltext nad topiky+návody (engine/hledani).
  const [dotaz, setDotaz] = useState('');
  const nalezy = dotaz.trim().length >= 2 ? hledej(dotaz, audience) : [];
  // Neúspěšné hledání hlásíme s prodlevou (až když uživatel dopsal).
  useEffect(() => {
    if (dotaz.trim().length < 3 || nalezy.length > 0) return;
    const t = setTimeout(
      () => telemetrie('search_miss', { query: dotaz.trim().slice(0, 100) }),
      1200,
    );
    return () => clearTimeout(t);
  }, [dotaz, nalezy.length]);
  // S3 badge „Co je nového" — po otevření pohledu se přepočítá na 0.
  const [zmenBadge, setZmenBadge] = useState(pocetNovychZmen);
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
      ).filter((el) => el.offsetParent !== null); // skryté madlo na desktopu
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

  const topik = topikId
    ? (topikPodleId(topikId) ?? NAVODY.find((n) => n.id === topikId))
    : undefined;
  // Bez řezu — panel scrolluje; slice(0,4) zabíjel PJ topiky na dashboardu.
  const karty = topikyProRoutu(pattern, audience);

  function otevriTopik(id: string) {
    setTopikId(id);
    telemetrie('topic_open', { refId: id, route: pattern ?? undefined });
  }

  // 05 §7 — režim pro patičku (subscription: přepnutí se hned propíše).
  const rezim = useSyncExternalStore(
    onboardingStore.subscribe,
    () => onboardingStore.getSnapshot().mode,
  );

  // Mluvčí dle plochy: TM = Měďák, jinak scope (svět Joe / platforma Ishida).
  const naTM = pattern === '/svet/:worldSlug/takticka-mapa';
  const mluvci = naTM ? 'tm' : scope;

  return (
    <div
      ref={ref}
      className={s.panel}
      data-rozbaleny={rozbaleny || personaVolba || undefined}
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
          <span className={s.avatar} data-vita={personaVolba || undefined}>
            {personaVolba ? (
              /* uvítání = vita busta (smeknutí) místo malého avataru */
              <picture>
                <source type="image/webp" srcSet={ishidaVitaWebp} />
                <img src={ishidaVitaPng} alt="" loading="lazy" className={s.avatarImg} />
              </picture>
            ) : (
              <picture>
                <source
                  type="image/webp"
                  srcSet={`${AVATARY[mluvci].webp96} 1x, ${AVATARY[mluvci].webp192} 2x`}
                />
                <img
                  src={AVATARY[mluvci].png}
                  alt=""
                  loading="lazy"
                  className={s.avatarImg}
                />
              </picture>
            )}
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
        ) : topik ? (
          <TopicView
            topik={topik}
            worldSlug={worldSlug}
            audience={audience}
            onZpet={() => setTopikId(null)}
            onClose={onClose}
          />
        ) : pohled === 'cesty' ? (
          <CestyView onZpet={() => setPohled('domu')} />
        ) : pohled === 'zmeny' ? (
          <div>
            <button
              type="button"
              className={s.zpet}
              onClick={() => setPohled('domu')}
            >
              ← Zpět
            </button>
            <div className={s.sekceLabel}>Co je nového</div>
            {ZMENY.map((z) => (
              <div key={z.id} className={s.zmena}>
                <div className={s.zmenaDatum}>{z.datum}</div>
                <div className={s.zmenaTitul}>{z.titul}</div>
                <p className={s.topikOdstavec}>{z.popis}</p>
                {z.to && (
                  <Link to={z.to} className={s.topikAkce} onClick={onClose}>
                    Vyzkoušet →
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : pohled === 'navody' ? (
          <div>
            <button
              type="button"
              className={s.zpet}
              onClick={() => setPohled('domu')}
            >
              ← Zpět
            </button>
            <div className={s.sekceLabel}>Návody — jeden úkol do 5 minut</div>
            <div className={s.personaVolby}>
              {NAVODY.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={s.personaVolba}
                  onClick={() => otevriTopik(n.id)}
                >
                  {n.title}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <input
              type="search"
              className={s.hledani}
              placeholder="Zeptat se — např. „jak pozvat hráče“"
              aria-label="Zeptat se Vypravěče"
              value={dotaz}
              onChange={(e) => setDotaz(e.target.value)}
            />
            {dotaz.trim().length >= 2 && (
              <>
                <div className={s.sekceLabel}>
                  {nalezy.length
                    ? scope === 'world'
                      ? 'Našla jsem'
                      : 'Našel jsem'
                    : scope === 'world'
                      ? 'Nic jsem nenašla'
                      : 'Nic jsem nenašel'}
                </div>
                {nalezy.length === 0 && (
                  <p className={s.topikOdstavec}>
                    Zkus to jinými slovy, nebo otevři Plnou nápovědu níže —
                    tvůj dotaz si zapisuju, ať příště odpovím líp.
                  </p>
                )}
                <div className={s.personaVolby}>
                  {nalezy.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={s.personaVolba}
                      onClick={() => otevriTopik(n.id)}
                    >
                      {n.title}
                      <small>{n.typ === 'navod' ? 'Návod' : 'Nápověda'}</small>
                    </button>
                  ))}
                </div>
              </>
            )}
            {karty.length > 0 && dotaz.trim().length < 2 && (
              <>
                <div className={s.sekceLabel}>K věci</div>
                <div className={s.personaVolby}>
                  {karty.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      className={s.personaVolba}
                      onClick={() => otevriTopik(k.id)}
                    >
                      {k.title}
                    </button>
                  ))}
                </div>
              </>
            )}
            <ul className={s.menu}>
              <li>
                <button
                  type="button"
                  className={s.menuTlacitko}
                  onClick={() => setPohled('cesty')}
                >
                  <Klic />
                  Cesty
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={s.menuTlacitko}
                  onClick={() => setPohled('navody')}
                >
                  <Klic />
                  Návody
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={s.menuTlacitko}
                  onClick={() => {
                    oznacZmenyVidene();
                    setZmenBadge(0);
                    setPohled('zmeny');
                  }}
                >
                  <Klic />
                  Co je nového
                  {zmenBadge > 0 && (
                    <span className={s.zmenBadge} aria-label={`${zmenBadge} nových`}>
                      {zmenBadge}
                    </span>
                  )}
                </button>
              </li>
              <li>
                <Link to="/ikaros/napoveda" onClick={onClose}>
                  <Klic />
                  Plná nápověda
                </Link>
              </li>
            </ul>
          </>
        )}
      </div>

      <footer className={s.pata}>
        <span>
          {naTM
            ? 'Měďák · Vypravěč'
            : scope === 'world'
              ? 'Joe · Vypravěč'
              : 'Ishida · Vypravěč'}
        </span>
        {/* 05 §7 — přepínač režimu: z auto-tichého MUSÍ vést cesta zpět. */}
        <button
          type="button"
          className={s.zavrit}
          onClick={() =>
            onboardingStore.nastavRezim(
              rezim === 'onCall' ? 'active' : 'onCall',
            )
          }
        >
          {rezim === 'onCall' ? 'Probudit rady' : 'Jen na zavolání'}
        </button>
        <button type="button" className={s.zavrit} onClick={onClose}>
          Zavřít (Esc)
        </button>
      </footer>
    </div>
  );
}
