// Pamatování poslední route pro PWA „obnov poslední místo" (side-task 2026-06-24).
//
// Proč localStorage (ne sessionStorage jako loginIntent): sessionStorage zaniká
// se zavřením PWA, takže by cold open z plochy nic neobnovil.
//
// Obnova je úzce gatovaná (applyStartupRestore): JEN cold open nainstalované
// standalone PWA na rootu, pro přihlášeného. Tím rozlišíme:
//   - cold open z plochy (start_url '/') → obnovit
//   - klik „domů" v appce → SPA navigace, tento modul neběží znovu → zůstat
//   - refresh dashboardu → navigation type 'reload' → neobnovovat

const LAST_ROUTE_KEY = 'ikaros.lastRoute';
const JWT_KEY = 'ikaros.jwt';

// Bezpečná relativní cesta (žádný open redirect / absolutní URL).
function isSafeRelativePath(target: string): boolean {
  return target.startsWith('/') && !target.startsWith('//');
}

// Cesty, které nemá smysl obnovovat: root (= výchozí dashboard) a auth-flow
// stránky (na ně by obnova vedla matoucně).
function isBlacklisted(path: string): boolean {
  if (path === '/' || path.startsWith('/?')) return true;
  return /^\/(reset-password|email-verify|email-change)(\/|$|\?)/.test(path);
}

/** Uloží aktuální cestu jako „poslední místo" (volá router.subscribe). */
export function saveLastRoute(path: string): void {
  if (!isSafeRelativePath(path) || isBlacklisted(path)) return;
  try {
    localStorage.setItem(LAST_ROUTE_KEY, path);
  } catch {
    // localStorage plný/nedostupný (privátní režim) → tichý no-op.
  }
}

/** Vyčistí uloženou route (volá explicitní logout — hygiena). */
export function clearLastRoute(): void {
  try {
    localStorage.removeItem(LAST_ROUTE_KEY);
  } catch {
    // no-op
  }
}

function isStandalonePwa(): boolean {
  try {
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  } catch {
    // matchMedia nedostupné → spadni na iOS check
  }
  // iOS Safari nemá display-mode media → vlastní `navigator.standalone`.
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

// Cold open = čerstvé načtení (otevření PWA z plochy). 'reload' (refresh) ani
// 'back_forward' obnovu nespouští.
function isColdOpen(): boolean {
  try {
    const [nav] = performance.getEntriesByType('navigation') as
      | PerformanceNavigationTiming[]
      | [];
    return !nav || nav.type === 'navigate';
  } catch {
    return true;
  }
}

function hasToken(): boolean {
  try {
    const raw = localStorage.getItem(JWT_KEY);
    if (!raw) return false;
    const token: unknown = JSON.parse(raw);
    return typeof token === 'string' && token.length > 0;
  } catch {
    return false;
  }
}

/**
 * Voláno v router.tsx PŘED `createBrowserRouter`. Při cold openu standalone PWA
 * na rootu, je-li uživatel přihlášený s uloženou poslední route, přepíše URL
 * (history.replaceState) → router se inicializuje rovnou tam, bez bliknutí
 * dashboardu. Jinak no-op (běžný prohlížeč, klik domů, refresh, nepřihlášený).
 */
export function applyStartupRestore(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname !== '/') return; // jen z rootu (= start_url PWA)
  if (!isStandalonePwa()) return; // jen nainstalovaná PWA, ne prohlížeč
  if (!isColdOpen()) return; // ne refresh dashboardu
  if (!hasToken()) return; // jen přihlášený
  const last = localStorage.getItem(LAST_ROUTE_KEY);
  if (!last || !isSafeRelativePath(last) || last === '/') return;
  window.history.replaceState(null, '', last);
}
