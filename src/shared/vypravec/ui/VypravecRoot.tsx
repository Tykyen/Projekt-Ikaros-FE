/**
 * Spec 26.1 — VypravecRoot: orchestrace kotvy Vypravěče.
 * Mount: UVNITŘ IkarosLayoutu (scope="ikaros") a WorldLayoutu (scope="world",
 * pod WorldContext providerem) — pop-out /karta-tokenu je mimo layouty,
 * FAB tam automaticky není.
 *
 * Skrytí (03 §5): kolizní routy (typované proti registru spec 26.0) +
 * otevřená mobilní klávesnice (visualViewport heuristika).
 * Zkratka Shift+V (mimo input/textarea/contentEditable), Esc zavírá,
 * po zavření focus zpět na FAB. Panel je lazy — eager jen FAB (siluety = odložený v2 koncept, viz siluety.tsx).
 */
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import {
  currentUserAtom,
  loginModalOpenAtom,
  registerModalOpenAtom,
} from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { matchRoutePattern } from '@/app/routeRegistry';
import { KOLIZNI_ROUTY } from '../kolizniRouty';
import {
  audienceZRole,
  resolveRouteHeader,
  type VypravecWorldInfo,
} from '../engine/resolveHeader';
import { onboardingStore, zapojFlush } from '../state/onboardingStore';
import {
  aktivniCesta,
  aktualniKlic,
  bazoveId,
  postupCesty,
  probeResync,
  startCesty,
  zapojJourneyEngine,
  zkontrolujCekaniHrace,
  zpracujNavstevu,
} from '../engine/journeyEngine';
import { useSocketEvent } from '@/features/chat/api/useSocket';
import { telemetrie, zapojTelemetriiFlush } from '../state/telemetry';
import { zapojChybovouMapu } from '../engine/chybovaMapa';
import { NETRIVIALNI_ROUTY } from '../registry/netrivialniRouty';
import { pocetNovychZmen } from '../registry/changelog';
import { bublinaStore } from './bublinaStore';
import { VypravecBublina } from './VypravecBublina';
import { JourneyBar } from './JourneyBar';
import { VypravecFab } from './VypravecFab';
import { VypravecChyba } from './VypravecChyba';

const VypravecPanel = lazy(() => import('./VypravecPanel'));

/** Otevřená mobilní klávesnice = kolizní plocha (zmenšení viewportu > 150 px). */
function useKlavesniceOtevrena(): boolean {
  const [otevrena, setOtevrena] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let zaklad = vv.height;
    function onResize() {
      if (!vv) return;
      // pinch-zoom není klávesnice; rotace resetuje baseline
      if (vv.scale > 1.05) {
        setOtevrena(false);
        return;
      }
      setOtevrena(zaklad - vv.height > 150);
    }
    function onOrientace() {
      window.setTimeout(() => {
        if (vv) zaklad = vv.height;
        onResize();
      }, 300);
    }
    vv.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onOrientace);
    return () => {
      vv.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrientace);
    };
  }, []);
  return otevrena;
}

export function VypravecRoot({
  scope,
  world,
}: {
  scope: 'ikaros' | 'world';
  world?: VypravecWorldInfo;
}) {
  const { pathname } = useLocation();
  const [otevreny, setOtevreny] = useState(false);
  // 25.1 — počáteční pohled panelu (např. 'chyba' z odkazu „Nahlásit chybu").
  const [initialView, setInitialView] = useState<'chyba' | undefined>(undefined);
  const fabRef = useRef<HTMLDivElement>(null);
  /** Prvek s fokusem v okamžiku otevření — sem ho po zavření vracíme (nález 8). */
  const vyvolavacRef = useRef<HTMLElement | null>(null);
  const klavesnice = useKlavesniceOtevrena();
  const onboarding = useSyncExternalStore(
    onboardingStore.subscribe,
    onboardingStore.getSnapshot,
  );

  const pattern = matchRoutePattern(pathname);
  const kolizni = pattern != null && KOLIZNI_ROUTY.has(pattern);

  // D6 — init store po idle (GET + backfill + re-POST pending) a flush
  // listenery; idempotentní, dvojí mount (ikaros/world) nevadí.
  // ZÁVISLOST na identitě: login přes modal layout NEremountuje — bez ní by
  // idle callback proběhl ještě jako anonym a init po přihlášení už nikdy
  // (persona dialog by se neukázal do reloadu).
  const uzivatel = useAtomValue(currentUserAtom);
  const userId = uzivatel?.id ?? null;
  // Esc nesmí zavřít panel, když je NAD ním modal (registrace/login) — nález 13.
  // Oba hooky bezpodmínečně (rules-of-hooks), pak zkombinovat.
  const loginModalOtevren = useAtomValue(loginModalOpenAtom);
  const registerModalOtevren = useAtomValue(registerModalOpenAtom);
  const modalNad = loginModalOtevren || registerModalOtevren;
  // Platformní Admin/Superadmin → audience 'admin' (role.admin-elevace aj.)
  const jePlatformniAdmin =
    uzivatel != null && uzivatel.role <= UserRole.Admin;
  // N8 — fronta bublin nesmí přetéct k jinému účtu (logout/login bez reloadu).
  const minulyUserId = useRef<string | null>(userId);
  useEffect(() => {
    if (minulyUserId.current !== userId) {
      minulyUserId.current = userId;
      bublinaStore.vycistiProUzivatele();
    }
  }, [userId]);

  // Kritik úplnosti: fronta bublin je singleton bez worldId — přechod mezi
  // světy ji nesmí přenést (světová bublina z A by promluvila v B).
  const minulyWorldId = useRef(world?.worldId);
  useEffect(() => {
    if (minulyWorldId.current !== world?.worldId) {
      minulyWorldId.current = world?.worldId;
      bublinaStore.vycistiFrontu();
    }
  }, [world?.worldId]);

  useEffect(() => {
    zapojFlush();
    zapojJourneyEngine();
    zapojChybovouMapu();
    zapojTelemetriiFlush();
    if (!userId) return;
    let idleId: number | undefined;
    let timerId: number | undefined;
    if (typeof window.requestIdleCallback === 'function') {
      // timeout: bez něj rIC hladoví, když stránka není nikdy idle
      // (např. reconnect smyčka WS) — persona dialog by se neukázal.
      idleId = window.requestIdleCallback(() => void onboardingStore.init(), {
        timeout: 3000,
      });
    } else {
      // Safari — requestIdleCallback stále chybí
      timerId = window.setTimeout(() => void onboardingStore.init(), 2000);
    }
    return () => {
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, [userId]);

  // Moment 2 (03 §4): „Poprvé tady?" na whitelistu netriviálních rout —
  // kontrola PŘED záznamem (jinak by routa byla „viděná" dřív, než promluvíme).
  // Odchod z routy tip zavírá bez penalizace (03 §3). Pak záznam + visit kroky.
  useEffect(() => {
    bublinaStore.nastavKolizni(kolizni); // fronta oslav/tipů (03 §5)
    bublinaStore.nastavScope(scope); // mluvčí fronty (Joe ≠ Ishida)
    bublinaStore.nastavMluvci(
      pattern === '/svet/:worldSlug/takticka-mapa' ? 'tm' : scope,
    ); // busta bubliny (TM = Měďák)
    bublinaStore.zavriPriOdchodu(pathname); // příchozí bublinu nezabíjet (C1)
    if (pattern) {
      const uzVidel = onboardingStore
        .getSnapshot()
        .seenRoutes.includes(pattern);
      // U přihlášeného čekej na init (server zná seen/dismissed z jiných
      // zařízení) — jinak „Poprvé tady?" lže prvních pár sekund.
      const initOk = !userId || onboardingStore.initHotovo;
      if (initOk && !uzVidel && NETRIVIALNI_ROUTY.has(pattern) && !kolizni) {
        bublinaStore.show({
          dismissKey: `prvni:${pattern}`,
          jenTed: true, // deixe „tady" — jinde by lhala
          text: 'Poprvé tady? Provedu tě.',
          akce: { label: 'Ukaž mi to', onClick: () => setOtevreny(true) },
        });
      }
      // Záznam až po initu — jinak deep-link během čekání na server routu
      // „spálí" a jediná šance na tip navždy propadne (revize 07/23).
      if (initOk) onboardingStore.zaznamenejRoutu(pattern);
    }
    zpracujNavstevu(pathname);
  }, [pattern, pathname, kolizni, userId, onboarding, scope]);

  // D7 — probe rekonsiliace ve world scope (gateOpened z accessMode; slug
  // resync pro deep-linky). Probe = zdroj pravdy, auto-odškrtne i zpětně.
  useEffect(() => {
    if (scope !== 'world' || !world?.worldId) return;
    probeResync({
      worldId: world.worldId,
      worldSlug: world.worldSlug,
      accessMode: world.accessMode,
      isPJ: world.isPJ,
      isOwner: world.isOwner,
      publicShowcase: world.publicShowcase,
      hasNpcPage: world.hasNpcPage,
    });
    zkontrolujCekaniHrace({
      worldId: world.worldId,
      hasCharacter: world.hasCharacter,
    });
  }, [
    scope,
    world?.worldId,
    world?.worldSlug,
    world?.accessMode,
    world?.isPJ,
    world?.isOwner,
    world?.publicShowcase,
    world?.hasCharacter,
    world?.hasNpcPage,
    // Probe znovu i po doběhnutí initu (2. zařízení — stav dorazí až PO mountu).
    onboarding,
  ]);

  // Čekací stav hráče i NA PLATFORMĚ (bez ctx = jen timeout 7 dní) — hráč
  // v soukromém světě se do world scope nedostane (revize 07/23, nález 11).
  useEffect(() => {
    if (scope === 'world') return;
    zkontrolujCekaniHrace();
  }, [scope, onboarding]);

  // Replika 9 (02 §2.1) — předávací beat Ishida→Joe při PRVNÍM vstupu do
  // světa. Jednorázový: zapisuje se hned po show (bez dismissKey na bublině,
  // ať projde i frontou z kolizní plochy).
  useEffect(() => {
    if (scope !== 'world' || !userId || !onboardingStore.initHotovo) return;
    if (onboarding.backfilled) return; // veterán světy zná — beat je pro nováčky
    if (onboarding.dismissed.includes('predani-joe')) return;
    bublinaStore.show({
      text: 'Ishida: „Tady moje chodby končí. Tohle je Joe — uvnitř tě povede ona." Joe: „Vítej. Posvítíme na to spolu."',
      // Konzumace až při SKUTEČNÉM zobrazení — fronta/přepis beat nespálí (N1/N2).
      priZobrazeni: () => onboardingStore.zavritTip('predani-joe'),
    });
  }, [scope, userId, onboarding]);

  // Rozhodnutí 13 (00 §3) — veterán (backfill) nedostane persona dialog;
  // místo něj jednorázová nabídka provedení novinkami.
  useEffect(() => {
    // Jen platforma — mluví Ishida („příteli"); ve světě by beat kolidoval s Joe.
    if (scope !== 'ikaros' || !userId || !onboarding.backfilled) return;
    if (onboarding.dismissed.includes('veteran-intro')) return;
    bublinaStore.show({
      dismissKey: 'veteran-intro',
      text: 'Vidím, že to tu znáš, příteli. Přesto je tu pár novinek — kdybys chtěl, provedu tě.',
      akce: { label: 'Chci provést', onClick: () => setOtevreny(true) },
    });
  }, [scope, userId, onboarding]);

  // Řetězení cest (revize 07/23): dokončený pj-start → tip na Měďákův
  // výcvik při návštěvě dashboardu vlastního světa. Jednorázový dismiss.
  useEffect(() => {
    if (scope !== 'world' || !userId || !world?.isOwner) return;
    if (pattern !== '/svet/:worldSlug') return;
    if (onboarding.dismissed.includes('tip-medak')) return;
    const pj = postupCesty('pj-start');
    if (pj.celkem === 0 || pj.hotovo < pj.celkem) return;
    if (onboarding.journeys[aktualniKlic('tm-vycvik')]) return; // už zná
    bublinaStore.show({
      dismissKey: 'tip-medak',
      text: 'Svět stojí. Na cvičišti čeká Měďák — výcvik taktické mapy, pět rozkazů.',
      akce: {
        label: 'Nastoupit',
        onClick: () => {
          startCesty('tm-vycvik');
          setOtevreny(false);
        },
      },
    });
  }, [scope, userId, world?.isOwner, pattern, onboarding]);

  // „Vítej zpět" (revize 07/23, jen in-app — žádný push): ≥7 dní ticha →
  // 1× bublina s novinkami. lastActive se razítkuje lokálně při navigaci.
  useEffect(() => {
    if (!userId) return;
    try {
      const klic = `vypravec:lastActive:${userId}`;
      const minule = Number(localStorage.getItem(klic) ?? '0');
      const ted = Date.now();
      localStorage.setItem(klic, String(ted));
      if (!minule || ted - minule < 7 * 24 * 3600 * 1000) return;
      if (sessionStorage.getItem('vypravec:vitej-zpet')) return;
      bublinaStore.show({
        text: 'Vítej zpět. Zatímco jsi byl pryč, pár věcí se pohnulo — provedu tě?',
        akce: { label: 'Co je nového', onClick: () => setOtevreny(true) },
        priZobrazeni: () => {
          try {
            sessionStorage.setItem('vypravec:vitej-zpet', '1');
          } catch {
            /* noop */
          }
        },
      });
    } catch {
      /* private mode — bez uvítání */
    }
  }, [userId]);

  // 05 §2 — „Pokračujeme?": pauznutá nedokončená cesta nemá lištu; 1× za
  // session ji připomeneme (aktivní cesty lišta pokrývá sama).
  useEffect(() => {
    if (!userId || !onboardingStore.initHotovo) return;
    if (aktivniCesta()) return; // běžící cesta má JourneyBar
    const s = onboardingStore.getSnapshot();
    const pauznuta = Object.entries(s.journeys).find(([jId, p]) => {
      if (!p.pausedAt || p.dismissedAt) return false;
      // Cross-device merge umí pauznutou cestu dokončit — tu nenabízet (N11).
      const postup = postupCesty(bazoveId(jId));
      return postup.celkem > 0 && postup.hotovo < postup.celkem;
    });
    if (!pauznuta) return;
    try {
      if (sessionStorage.getItem('vypravec:navrat-nabidnut')) return;
    } catch {
      return;
    }
    bublinaStore.show({
      text: 'Máš rozdělanou cestu. Pokračujeme, kde jsme skončili?',
      akce: { label: 'Pokračovat', onClick: () => setOtevreny(true) },
      priZobrazeni: () => {
        try {
          sessionStorage.setItem('vypravec:navrat-nabidnut', '1');
        } catch {
          /* noop */
        }
      },
    });
  }, [userId, onboarding]);

  // v2 — cross-device sync: jiné zařízení PATCHlo → signál bez dat → re-GET.
  useSocketEvent('onboarding:updated', () => void onboardingStore.resync());

  // 26.4 — volba persony: JEDINÉ auto-otevření panelu vůbec (05 §1).
  // Jen čerstvý účet (jeNovy z GET), bez persony, nezavřený dialog, mimo kolizi.
  const [personaVolba, setPersonaVolba] = useState(false);
  const personaAutoOpenRef = useRef(false);
  useEffect(() => {
    const zkus = () => {
      if (personaAutoOpenRef.current || !onboardingStore.jeNovy) return;
      const s = onboardingStore.getSnapshot();
      if (s.persona || s.dismissed.includes('persona-dialog')) return;
      // Nevnucovat: kolizní plocha / klávesnice / rozepsaný vstup (03 §4).
      const el = document.activeElement as HTMLElement | null;
      const pise =
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable);
      const vzor = matchRoutePattern(window.location.pathname);
      if ((vzor && KOLIZNI_ROUTY.has(vzor)) || pise) return; // zkusí se znovu
      personaAutoOpenRef.current = true;
      setPersonaVolba(true);
      setOtevreny(true);
    };
    const odhlasit = onboardingStore.subscribe(zkus);
    zkus();
    return odhlasit;
  }, [pathname]);

  const navigate = useNavigate();
  const zvolPersonu = useCallback(
    (p: 'pj' | 'hrac' | 'worldbuilder' | null) => {
      onboardingStore.nastavPersonu(p);
      onboardingStore.zavritTip('persona-dialog');
      // (persona.chosen event nemá konzumenta — cestu startuje startCesty,
      //  událost pokrývá telemetrie; audit-podpis nález 16)
      telemetrie('persona_chosen', { refId: p ?? 'rozhlednu' });
      setPersonaVolba(false);
      setOtevreny(false);
      // Volba naviguje na první krok (26.2/26.3 plné cesty = v2; rozcestník
      // MVP): PJ startuje cestu 26.1, hráč jde hledat stůl, tvůrce zakládat.
      if (p === 'pj') startCesty('pj-start');
      else if (p === 'hrac') {
        startCesty('hrac-start');
        navigate('/ikaros/vesmiry');
      } else if (p === 'worldbuilder') {
        startCesty('wb-start');
        navigate('/ikaros/vytvorit-svet');
      }
    },
    [navigate],
  );

  // Nález 8: fokus po zavření zpět na vyvolávač; na kolizní ploše FAB
  // v DOM není → padal na <body>. Fallback FAB → body (vždy fokusovatelné).
  const vratFocus = useCallback(() => {
    const v = vyvolavacRef.current;
    // isConnected: odmountovaný vyvolávač (WS re-render seznamu) → .focus()
    // je no-op a fokus spadne na body; míříme přímo na FAB (data-atribut,
    // ne první button v obalu — ten obsahuje i panel). (adverz. verifikace)
    const cil =
      v && v.isConnected
        ? v
        : (document.querySelector<HTMLElement>('[data-vypravec-fab]') ??
          document.body);
    cil.focus?.();
  }, []);
  const zavrit = useCallback(() => {
    setOtevreny(false);
    setInitialView(undefined); // příští otevření začne na domovském pohledu
    vratFocus();
  }, [vratFocus]);

  // Vstup z mobilního draweru / "?" (03 §5) — otevře panel i na kolizní ploše.
  // 25.1 — `vypravec:nahlasit-chybu` otevře rovnou formulář hlášení (z FAQ/nápovědy).
  useEffect(() => {
    function onOtevrit() {
      vyvolavacRef.current = document.activeElement as HTMLElement | null;
      setInitialView(undefined);
      setOtevreny(true);
    }
    function onNahlasit() {
      vyvolavacRef.current = document.activeElement as HTMLElement | null;
      setInitialView('chyba');
      setOtevreny(true);
    }
    window.addEventListener('vypravec:otevrit', onOtevrit);
    window.addEventListener('vypravec:nahlasit-chybu', onNahlasit);
    return () => {
      window.removeEventListener('vypravec:otevrit', onOtevrit);
      window.removeEventListener('vypravec:nahlasit-chybu', onNahlasit);
    };
  }, []);

  // Odchod z routy zavírá panel (kontext se změnil) — render-phase adjustment,
  // ne effect (react-hooks/set-state-in-effect).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOtevreny(false);
  }

  // Esc + Shift+V (mimo aktivní vstup — otevřený input je „aktivní práce").
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (modalNad) return; // modal nad panelem si Esc zpracuje sám
        setOtevreny((o) => {
          if (o) vratFocus();
          return false;
        });
        return;
      }
      if (e.key === 'V' && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const t = e.target as HTMLElement | null;
        if (
          t &&
          (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
        )
          return;
        // Shift+V je EXPLICITNÍ pull — funguje i na kolizní ploše (03 §5)
        e.preventDefault();
        vyvolavacRef.current = document.activeElement as HTMLElement | null;
        setInitialView(undefined);
        setOtevreny((o) => !o);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [vratFocus, modalNad]);

  // Aktivní cesta — derivace ze snapshotu (onboarding je dependency renderu).
  void onboarding;
  const akt = aktivniCesta();
  const jinySvet = Boolean(
    scope === 'world' &&
      akt?.contextWorldId &&
      world?.worldId &&
      world.worldId !== akt.contextWorldId,
  );

  // Kolizní plocha / klávesnice: FAB+panel skryté, ale lišta cesty se SBALÍ
  // do proužku, nikdy nezmizí (03 §8.3 — poslední instrukce nesmí zmizet
  // v místě činu).
  if ((kolizni || klavesnice) && !otevreny) {
    // Chybová vysvětlení se ukazují i tady (kontext chyby) — oslavy/tipy
    // drží bublinaStore ve frontě na klidnou plochu (03 §5).
    return (
      <>
        <VypravecBublina />
        {akt && <JourneyBar akt={akt} kolizni jinySvet={jinySvet} aktualniSlug={world?.worldSlug} />}
      </>
    );
  }

  return (
    <div ref={fabRef}>
      {/* Na kolizní ploše (TM/chat) FAB nikdy — ani s otevřeným panelem
          (kánon 02 §1.3; Joe avatar nemá co dělat na Měďákově cvičišti). */}
      {!kolizni && !klavesnice && (
        <VypravecFab
          scope={scope}
          otevreny={otevreny}
          spi={onboarding.mode === 'onCall'}
          badge={userId ? pocetNovychZmen() : 0}
          onClick={() => {
            vyvolavacRef.current =
              fabRef.current?.querySelector<HTMLElement>('button') ?? null;
            setInitialView(undefined);
            setOtevreny((o) => !o);
          }}
        />
      )}
      {!otevreny && <VypravecBublina />}
      {akt && !otevreny && (
        <JourneyBar akt={akt} kolizni={false} jinySvet={jinySvet} aktualniSlug={world?.worldSlug} />
      )}
      {otevreny && (
        <VypravecChyba
          naChybu={() => (
            <div role="alert" className="vypravec-highlight">
              Vypravěče se nepodařilo načíst — zkus obnovit stránku.
            </div>
          )}
        >
        <Suspense fallback={null}>
          <VypravecPanel
            scope={scope}
            worldName={world?.name}
            worldSlug={world?.worldSlug}
            worldId={world?.worldId}
            initialView={initialView}
            pattern={pattern}
            audience={
              jePlatformniAdmin
                ? 'admin'
                : scope === 'world'
                  ? audienceZRole(world?.userRole)
                  : userId
                    ? 'prihlaseny'
                    : 'anon'
            }
            header={resolveRouteHeader(pathname, world)}
            personaVolba={personaVolba}
            onPersona={zvolPersonu}
            onClose={() => {
              if (personaVolba) {
                // zavření bez volby = dismiss (nikdy víc auto-open; 04 §5.4)
                onboardingStore.zavritTip('persona-dialog');
                setPersonaVolba(false);
              }
              zavrit();
            }}
          />
        </Suspense>
        </VypravecChyba>
      )}
    </div>
  );
}
