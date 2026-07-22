/**
 * Spec 26.1 — VypravecRoot: orchestrace kotvy Vypravěče.
 * Mount: UVNITŘ IkarosLayoutu (scope="ikaros") a WorldLayoutu (scope="world",
 * pod WorldContext providerem) — pop-out /karta-tokenu je mimo layouty,
 * FAB tam automaticky není.
 *
 * Skrytí (03 §5): kolizní routy (typované proti registru spec 26.0) +
 * otevřená mobilní klávesnice (visualViewport heuristika).
 * Zkratka Shift+V (mimo input/textarea/contentEditable), Esc zavírá,
 * po zavření focus zpět na FAB. Panel je lazy — eager jen FAB + siluety.
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
import { matchRoutePattern } from '@/app/routeRegistry';
import { KOLIZNI_ROUTY } from '../kolizniRouty';
import { resolveRouteHeader, type VypravecWorldInfo } from '../engine/resolveHeader';
import { onboardingStore, zapojFlush } from '../state/onboardingStore';
import {
  aktivniCesta,
  probeResync,
  startCesty,
  zapojJourneyEngine,
  zpracujNavstevu,
} from '../engine/journeyEngine';
import { vypravecEmit } from '../engine/events';
import { telemetrie, zapojTelemetriiFlush } from '../state/telemetry';
import { zapojChybovouMapu } from '../engine/chybovaMapa';
import { NETRIVIALNI_ROUTY } from '../registry/netrivialniRouty';
import { bublinaStore } from './bublinaStore';
import { VypravecBublina } from './VypravecBublina';
import { JourneyBar } from './JourneyBar';
import { VypravecFab } from './VypravecFab';

const VypravecPanel = lazy(() => import('./VypravecPanel'));

/** Otevřená mobilní klávesnice = kolizní plocha (zmenšení viewportu > 150 px). */
function useKlavesniceOtevrena(): boolean {
  const [otevrena, setOtevrena] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const zaklad = vv.height;
    function onResize() {
      if (!vv) return;
      setOtevrena(zaklad - vv.height > 150);
    }
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
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
  const fabRef = useRef<HTMLDivElement>(null);
  const klavesnice = useKlavesniceOtevrena();
  const onboarding = useSyncExternalStore(
    onboardingStore.subscribe,
    onboardingStore.getSnapshot,
  );

  const pattern = matchRoutePattern(pathname);
  const kolizni = pattern != null && KOLIZNI_ROUTY.has(pattern);

  // D6 — init store po idle (GET + backfill + re-POST pending) a flush
  // listenery; obojí idempotentní, dvojí mount (ikaros/world) nevadí.
  useEffect(() => {
    zapojFlush();
    zapojJourneyEngine();
    zapojChybovouMapu();
    zapojTelemetriiFlush();
    let idleId: number | undefined;
    let timerId: number | undefined;
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(() => void onboardingStore.init());
    } else {
      // Safari — requestIdleCallback stále chybí
      timerId = window.setTimeout(() => void onboardingStore.init(), 2000);
    }
    return () => {
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, []);

  // Moment 2 (03 §4): „Poprvé tady?" na whitelistu netriviálních rout —
  // kontrola PŘED záznamem (jinak by routa byla „viděná" dřív, než promluvíme).
  // Odchod z routy tip zavírá bez penalizace (03 §3). Pak záznam + visit kroky.
  useEffect(() => {
    bublinaStore.zmiz();
    if (pattern) {
      const uzVidel = onboardingStore
        .getSnapshot()
        .seenRoutes.includes(pattern);
      if (!uzVidel && NETRIVIALNI_ROUTY.has(pattern) && !kolizni) {
        bublinaStore.show({
          dismissKey: `prvni:${pattern}`,
          text: 'Poprvé tady? Provedu tě.',
          akce: { label: 'Ukaž mi to', onClick: () => setOtevreny(true) },
        });
      }
      onboardingStore.zaznamenejRoutu(pattern);
    }
    zpracujNavstevu(pathname);
  }, [pattern, pathname, kolizni]);

  // D7 — probe rekonsiliace ve world scope (gateOpened z accessMode; slug
  // resync pro deep-linky). Probe = zdroj pravdy, auto-odškrtne i zpětně.
  useEffect(() => {
    if (scope !== 'world' || !world?.worldId) return;
    probeResync({
      worldId: world.worldId,
      worldSlug: world.worldSlug,
      accessMode: world.accessMode,
      isPJ: world.isPJ,
    });
  }, [scope, world?.worldId, world?.worldSlug, world?.accessMode, world?.isPJ]);

  // 26.4 — volba persony: JEDINÉ auto-otevření panelu vůbec (05 §1).
  // Jen čerstvý účet (jeNovy z GET), bez persony, nezavřený dialog, mimo kolizi.
  const [personaVolba, setPersonaVolba] = useState(false);
  const personaAutoOpenRef = useRef(false);
  useEffect(() => {
    return onboardingStore.subscribe(() => {
      if (personaAutoOpenRef.current || !onboardingStore.jeNovy) return;
      const s = onboardingStore.getSnapshot();
      if (s.persona || s.dismissed.includes('persona-dialog')) return;
      personaAutoOpenRef.current = true;
      setPersonaVolba(true);
      setOtevreny(true);
    });
  }, []);

  const navigate = useNavigate();
  const zvolPersonu = useCallback(
    (p: 'pj' | 'hrac' | 'worldbuilder' | null) => {
      onboardingStore.nastavPersonu(p);
      onboardingStore.zavritTip('persona-dialog');
      vypravecEmit('persona.chosen');
      telemetrie('persona_chosen', { refId: p ?? 'rozhlednu' });
      setPersonaVolba(false);
      setOtevreny(false);
      // Volba naviguje na první krok (26.2/26.3 plné cesty = v2; rozcestník
      // MVP): PJ startuje cestu 26.1, hráč jde hledat stůl, tvůrce zakládat.
      if (p === 'pj') startCesty('pj-start');
      else if (p === 'hrac') navigate('/ikaros/vesmiry');
      else if (p === 'worldbuilder') navigate('/ikaros/vytvorit-svet');
    },
    [navigate],
  );

  const zavrit = useCallback(() => {
    setOtevreny(false);
    // focus zpět na vyvolávač (03 §7)
    fabRef.current?.querySelector('button')?.focus();
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
        setOtevreny((o) => {
          if (o) fabRef.current?.querySelector('button')?.focus();
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
        if (kolizni) return; // na kolizní ploše se panel nevnucuje ani zkratkou přes skrytý FAB
        e.preventDefault();
        setOtevreny((o) => !o);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [kolizni]);

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
  if (kolizni || klavesnice) {
    return akt ? <JourneyBar akt={akt} kolizni jinySvet={jinySvet} /> : null;
  }

  return (
    <div ref={fabRef}>
      <VypravecFab
        scope={scope}
        otevreny={otevreny}
        spi={onboarding.mode === 'onCall'}
        onClick={() => setOtevreny((o) => !o)}
      />
      {!otevreny && <VypravecBublina />}
      {akt && !otevreny && (
        <JourneyBar akt={akt} kolizni={false} jinySvet={jinySvet} />
      )}
      {otevreny && (
        <Suspense fallback={null}>
          <VypravecPanel
            scope={scope}
            worldName={world?.name}
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
      )}
    </div>
  );
}
