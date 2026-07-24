import { useSyncExternalStore } from 'react';
import { useAtomValue } from 'jotai';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { onboardingStore } from '@/shared/vypravec/state/onboardingStore';
import { BETA_STAGE_SHORT, BETA_BANNER_DISMISS_KEY } from '@/shared/config/betaStage';
import s from './BetaMarker.module.css';

/**
 * Spec 25.5 ⑤ — trvalý minimální beta štítek pro plochy, kde BetaBanner NENÍ:
 * anonym (banner je jen pro přihlášené), po zavření banneru a layouty bez
 * hlavičky (fullscreen taktická mapa). Mountnutý globálně v main.tsx (mimo
 * router) → nezávislý na layoutu.
 *
 * Gate ZRCADLÍ BetaBanner, aby se signály nezdvojovaly: dokud přihlášenému
 * svítí banner, marker mlčí. Anonym marker vidí vždy. `initHotovo` gate brání
 * bliku u uživatele, který banner zavřel na jiném zařízení.
 *
 * Neinteraktivní (`pointer-events:none` v CSS) — čistě signál, neblokuje
 * ovládání pod sebou (proto bezpečný i přes fullscreen mapu).
 */
export function BetaMarker() {
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const onboarding = useSyncExternalStore(
    onboardingStore.subscribe,
    onboardingStore.getSnapshot,
  );

  if (isAuth) {
    // Přihlášený: dokud neznáme dismiss stav, radši nic (žádný flash).
    if (!onboardingStore.initHotovo) return null;
    // Banner ještě nezavřený → svítí nahoře → marker by zdvojoval.
    if (!onboarding.dismissed.includes(BETA_BANNER_DISMISS_KEY)) return null;
  }

  return (
    <div className={s.marker} role="note" aria-label={`${BETA_STAGE_SHORT} verze`}>
      <span className={s.dot} aria-hidden="true" />
      <span className={s.label}>{BETA_STAGE_SHORT}</span>
    </div>
  );
}
