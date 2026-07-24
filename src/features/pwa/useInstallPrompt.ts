import { useCallback, useEffect, useState } from 'react';
import { hasExperiencedValue, getVisitCount, VALUE_EVENT } from './valueGate';

/**
 * Spec 15.1 — logika install hintu PWA.
 *
 * Dvě cesty instalace:
 *  • Android / desktop Chromium → prohlížeč pošle `beforeinstallprompt`, který
 *    zachytíme a vyvoláme vlastním tlačítkem (`install()`).
 *  • iOS Safari → `beforeinstallprompt` NEEXISTUJE; jediná cesta je manuální
 *    „Sdílet → Přidat na plochu", takže ukážeme jen instrukci.
 *
 * Banner se nezobrazí ve standalone režimu (už nainstalováno) ani po dismissnutí
 * (re-nabídka až po REOFFER_DAYS — uživatel si to může rozmyslet, ale neotravujeme).
 */

const DISMISS_KEY = 'pwa:install-dismissed';
const REOFFER_DAYS = 14;

/** Chromium `beforeinstallprompt` (není v lib.dom). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return true; // neznámý formát → ber jako zavřené
    return Date.now() - ts < REOFFER_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari proprietární flag (není v lib.dom typings).
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ se hlásí jako Mac → dorovnáme přes touch body.
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOS;
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(isDismissed);
  const [standalone, setStandalone] = useState(detectStandalone);
  // 25.5 ③ — brána „prožitá hodnota": prompt až po milníku (vstup do světa /
  // zpráva) nebo na 2.+ návštěvě, ne hned po prvním načtení.
  const [experienced, setExperienced] = useState(
    () => hasExperiencedValue() || getVisitCount() >= 2,
  );
  const isIos = detectIos();

  useEffect(() => {
    if (experienced) return; // už odemčeno → listener netřeba
    const onValue = () => setExperienced(true);
    window.addEventListener(VALUE_EVENT, onValue);
    return () => window.removeEventListener(VALUE_EVENT, onValue);
  }, [experienced]);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // potlač default browser mini-infobar
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setStandalone(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === 'accepted') setStandalone(true);
  }, [deferred]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* localStorage nedostupný — banner zmizí jen pro tuto session */
    }
    setDismissed(true);
  }, []);

  // Android/desktop: nativní prompt je k dispozici. iOS: nabízíme jen návod.
  const canPrompt = !!deferred;
  const shouldShow =
    experienced && !standalone && !dismissed && (canPrompt || isIos);

  return { shouldShow, canPrompt, isIos, install, dismiss };
}
