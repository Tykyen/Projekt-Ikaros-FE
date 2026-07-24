/**
 * Spec 25.5 ③ — brána „prožitá hodnota" pro PWA install prompt.
 *
 * Prompt se nesmí ukázat dřív, než uživatel zažil hodnotu produktu (rešerše:
 * install banner hned po prvním načtení = odhad −5–15 % první konverze).
 * „Hodnota" = buď jednoznačný MILNÍK (vstup do světa / odeslání zprávy →
 * `markValueExperienced`), nebo NÁVRAT (2.+ návštěva → čítač `visits`).
 *
 * Milník během session musí prompt „odemknout" okamžitě → `markValueExperienced`
 * emituje window event `pwa:value-experienced`, na který `useInstallPrompt`
 * naslouchá (jinak by banner naskočil až při náhodném re-renderu).
 */

const VALUE_KEY = 'pwa:value-experienced';
const VISITS_KEY = 'pwa:visits';

/** Event odemčení gate v rámci běžící session (přežije i localStorage výpadek). */
export const VALUE_EVENT = 'pwa:value-experienced';

export function hasExperiencedValue(): boolean {
  try {
    return localStorage.getItem(VALUE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Idempotentně označí, že uživatel zažil hodnotu, a odemkne prompt v session. */
export function markValueExperienced(): void {
  let already = false;
  try {
    already = localStorage.getItem(VALUE_KEY) === '1';
    if (!already) localStorage.setItem(VALUE_KEY, '1');
  } catch {
    // localStorage nedostupný — gate v této session pojede jen přes event níže.
  }
  if (already) return;
  try {
    window.dispatchEvent(new Event(VALUE_EVENT));
  } catch {
    /* SSR / prostředí bez window — ignoruj */
  }
}

export function getVisitCount(): number {
  try {
    const n = Number(localStorage.getItem(VISITS_KEY));
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/** Zvýší čítač návštěv — voláno jednou při startu appky (main.tsx). */
export function bumpVisitCount(): void {
  try {
    localStorage.setItem(VISITS_KEY, String(getVisitCount() + 1));
  } catch {
    /* ignore */
  }
}
