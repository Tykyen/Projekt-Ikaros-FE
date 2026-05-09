// Helpery pro post-login deep-link redirect přes sessionStorage.
//
// Save:    `requireAuth` loader (router.tsx) a `logoutAndRedirectToLogin`
//          (api/client.ts) ukládají zamýšlenou cestu před přesměrováním
//          na úvodník s otevřeným LoginModalem.
// Consume: `LoginModal` a `RegisterModal` po úspěšném loginu/registraci
//          čtou + mažou intent a navigují tam.

export const LOGIN_INTENT_KEY = 'ikaros.loginIntent';

// Validuje, že target je bezpečná relativní cesta (žádný open redirect).
function isSafeRelativePath(target: string): boolean {
  return target.startsWith('/') && !target.startsWith('//');
}

// Uloží zamýšlenou cestu do sessionStorage. Pokud je `target` nebezpečný
// nebo rovný `/` (= žádný smysluplný redirect), no-op.
export function saveLoginIntent(target: string): void {
  if (!isSafeRelativePath(target)) return;
  if (target === '/') return;
  sessionStorage.setItem(LOGIN_INTENT_KEY, target);
}

// Vrátí + smaže uloženou cestu. Defensive validace pro případ, že někdo
// sessionStorage manipuloval. Vrací `null` pokud nic není uloženo nebo je
// hodnota nebezpečná.
export function consumeLoginIntent(): string | null {
  const raw = sessionStorage.getItem(LOGIN_INTENT_KEY);
  sessionStorage.removeItem(LOGIN_INTENT_KEY);
  if (raw && isSafeRelativePath(raw)) return raw;
  return null;
}
