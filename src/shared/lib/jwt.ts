/**
 * Klientský dekód JWT bez verifikace podpisu — určeno pro hydrataci UI stavu
 * (např. zobrazit přezdívku v hlavičce po reloadu stránky).
 *
 * NIKDY se na tento dekód nespoléhej pro autorizační rozhodnutí — token už
 * BE ověřuje při každém requestu. Tady jen čteme payload pro UX.
 */

function base64UrlDecode(input: string): string {
  const padding = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const base64 = (input + padding).replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64);
}

export function decodeJwt<T = Record<string, unknown>>(token: string): T | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as T;
  } catch {
    return null;
  }
}

/** True pokud token je platný formát s `exp` claim v budoucnosti. */
export function isJwtValid(token: string | null): boolean {
  if (!token) return false;
  const payload = decodeJwt<{ exp?: number }>(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  return payload.exp * 1000 > Date.now();
}
