import { useSyncExternalStore } from 'react';
import { useAtomValue } from 'jotai';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { onboardingStore } from '@/shared/vypravec/state/onboardingStore';
import { BETA_STAGE_LABEL, BETA_BANNER_DISMISS_KEY } from '@/shared/config/betaStage';
import s from './BetaBanner.module.css';

/**
 * Spec 25.3 — beta rámec: jednorázový dismissable proužek pod hlavičkou.
 *
 * Ohraničuje očekávání (co je beta, co smí být rozbité) a navádí na existující
 * nástroje ve Vypravěči — hlášení chyb (25.1) a changelog. NENÍ nová funkce,
 * jen rozcestník + kontext.
 *
 * - Jen pro přihlášené (anon má vlastní onboarding + patičkový štítek).
 * - Persistence dismissu přes `onboardingStore.dismissed` → cross-device,
 *   BE-synced, přežije reinstal. `initHotovo` gate brání bliku u uživatele,
 *   který banner zavřel na jiném zařízení (lokál ho ještě nezná).
 * - Renderuje se ve flow pod hlavičkou (jako LastInfoBar), ne fixed overlay —
 *   appka nemá globální scroll, overlay by překryl hlavičku.
 */
export function BetaBanner() {
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const onboarding = useSyncExternalStore(
    onboardingStore.subscribe,
    onboardingStore.getSnapshot,
  );

  if (!isAuth) return null;
  // Počkej na doběhnutí GET stavu — jinak by cross-device dismiss problikl.
  if (!onboardingStore.initHotovo) return null;
  if (onboarding.dismissed.includes(BETA_BANNER_DISMISS_KEY)) return null;

  const nahlasitChybu = () =>
    window.dispatchEvent(new Event('vypravec:nahlasit-chybu'));
  const coJeNoveho = () => window.dispatchEvent(new Event('vypravec:otevrit'));
  const zavrit = () => onboardingStore.zavritTip(BETA_BANNER_DISMISS_KEY);

  return (
    <div className={s.bar} role="status" aria-live="polite">
      <span className={s.stamp}>{BETA_STAGE_LABEL}</span>
      <span className={s.text}>
        <strong>Beta verze.</strong> Něco se ještě ladí a může být rozbité. Data
        hlídáme denními zálohami.
      </span>
      <span className={s.actions}>
        <button type="button" className={s.link} onClick={nahlasitChybu}>
          Nahlásit chybu
        </button>
        <button type="button" className={s.link} onClick={coJeNoveho}>
          Co je nového
        </button>
      </span>
      <button
        type="button"
        className={s.close}
        onClick={zavrit}
        aria-label="Rozumím, zavřít"
        title="Rozumím, zavřít"
      >
        ✕
      </button>
    </div>
  );
}
