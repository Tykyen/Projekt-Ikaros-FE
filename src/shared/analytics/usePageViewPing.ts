import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { isAuthenticatedAtom } from '@/shared/store/authStore';

/**
 * 15B.7 — page-view ping pro self-hosted analytics (admin Přehled).
 *
 * Fire-and-forget: nikdy nesmí zdržet render ani spadnout. Boty a prerender
 * sidecar (15B.1) odfiltruje BE podle UA — tady se nic neřeší.
 *
 * Soukromí: `sessionId` je anonymní nonce v sessionStorage (per-tab, žádná
 * cookie, žádné PII). Referrer se posílá jen při PRVNÍM pingu session
 * (= externí zdroj návštěvy); interní prokliky pošlou vlastní origin → BE
 * je kategorizuje jako `internal` (jinak by `document.referrer` nálepkoval
 * každou podstránku původním vyhledávačem).
 */
const SID_KEY = 'ik_anon_sid';

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SID_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return 'nostorage'; // privátní režim / blokované storage → stále počítáme view
  }
}

export function usePageViewPing(): void {
  const { pathname } = useLocation();
  const authed = useAtomValue(isAuthenticatedAtom);
  const lastPath = useRef<string | null>(null);
  const firstPing = useRef(true);

  useEffect(() => {
    if (lastPath.current === pathname) return; // dedupe (re-render bez změny routy)
    lastPath.current = pathname;

    const referrer = firstPing.current
      ? document.referrer || undefined
      : window.location.origin;
    firstPing.current = false;

    void api
      .post('/analytics/pageview', {
        path: pathname,
        referrer,
        sessionId: getSessionId(),
        authed,
      })
      .catch(() => {});
  }, [pathname, authed]);
}
