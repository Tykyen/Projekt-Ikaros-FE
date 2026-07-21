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
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { matchRoutePattern } from '@/app/routeRegistry';
import { KOLIZNI_ROUTY } from '../kolizniRouty';
import { resolveRouteHeader, type VypravecWorldInfo } from '../engine/resolveHeader';
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

  const pattern = matchRoutePattern(pathname);
  const kolizni = pattern != null && KOLIZNI_ROUTY.has(pattern);

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

  if (kolizni || klavesnice) return null;

  return (
    <div ref={fabRef}>
      <VypravecFab
        scope={scope}
        otevreny={otevreny}
        onClick={() => setOtevreny((o) => !o)}
      />
      {otevreny && (
        <Suspense fallback={null}>
          <VypravecPanel
            scope={scope}
            worldName={world?.name}
            header={resolveRouteHeader(pathname, world)}
            onClose={zavrit}
          />
        </Suspense>
      )}
    </div>
  );
}
