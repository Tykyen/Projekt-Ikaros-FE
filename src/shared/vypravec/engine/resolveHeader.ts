/**
 * Spec 26.2 — kontextový engine „kde jsem": pathname → RouteHeader + role-aware
 * dovětek. Čistá derivace bez fetchů (04 §3); mimo pokryté routy vrací null —
 * poctivý fallback řeší UI (žádné AI stuby).
 */
import { matchRoutePattern } from '@/app/routeRegistry';
import { WorldRole } from '@/shared/types';
import { ROUTE_HEADERS } from '../registry/routeHeaders';
import type { VypravecAudience } from '../registry/types';

const byRoute = new Map(ROUTE_HEADERS.map((h) => [h.route, h]));

/** Info o světě předávané z WorldLayout mountu (D5 — bez čtení kontextu v shellu). */
export interface VypravecWorldInfo {
  name?: string;
  userRole: WorldRole | null;
  isPJ: boolean;
  /** D7–D8: scope cesty (contextWorldId) + probe gateOpened + deep-linky. */
  worldId?: string;
  worldSlug?: string;
  accessMode?: string;
  publicShowcase?: boolean;
  hasCharacter?: boolean;
}

/** WorldRole → audience (04 §2; Žadatel není audience → čte jako host). */
export function audienceZRole(role: WorldRole | null | undefined): VypravecAudience {
  switch (role) {
    case WorldRole.PJ:
      return 'pj';
    case WorldRole.PomocnyPJ:
      return 'pomocnyPJ';
    case WorldRole.Korektor:
      return 'korektor';
    case WorldRole.Hrac:
      return 'hrac';
    case WorldRole.Ctenar:
      return 'ctenar';
    default:
      return 'anon';
  }
}

export interface ResolvedHeader {
  name: string;
  text: string;
}

export function resolveRouteHeader(
  pathname: string,
  world?: VypravecWorldInfo,
): ResolvedHeader | null {
  const pattern = matchRoutePattern(pathname);
  if (!pattern) return null;
  const header = byRoute.get(pattern);
  if (!header) return null;
  let text = header.blurb;
  if (header.audienceNotes && world !== undefined) {
    const note = header.audienceNotes[audienceZRole(world.userRole)];
    if (note) text += ` ${note}`;
  }
  return { name: header.name, text };
}
