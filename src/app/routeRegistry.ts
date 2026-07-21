/**
 * Spec 26.0 — typovaný route registr (Vypravěč MVP-A, D1–D2).
 *
 * Jediný zdroj pravdy o FE routách pro Vypravěče (RoutePattern typ, kontextový
 * engine „kde jsem", CI validace mrtvých odkazů) a budoucí audity.
 *
 * PARITA S router.tsx JE VYNUCENÁ TESTEM (route-registry-parity.spec.ts):
 * přidáš/odebereš routu v router.tsx → parity test spadne, dokud ji nezrcadlíš
 * sem. `guard`/`minWorldRole` jsou DEKLAROVANÝ ZÁMĚR (revidovatelný artefakt,
 * vzor `exp` tabulky nav-guard-matrix) — chování guardů kryje M-MATRIX,
 * parity test hlídá jen existenci pattern ↔ router oběma směry.
 */
import { matchPath } from 'react-router-dom';
import { WorldRole } from '@/shared/types';

/** Kým je routa hlídaná (zrcadlí konstrukce v router.tsx). */
export type RouteGuard =
  | 'none' /* veřejná (anon projde) */
  | 'requireAuth' /* per-route loader → login intent */
  | 'memberOnly' /* WorldMembershipGuard s redirectem na index světa */
  | 'showcaseOrMember' /* 22.4 — člen NEBO veřejná vitrína (read-only) */
  | 'wmg' /* WorldMembershipGuard bez redirectu → 403 ForbiddenPage */
  | 'roleGuard' /* platformový RoleGuard (Sa/Admin) */
  | 'redirect' /* routa jen přesměrovává (legacy URL) */
  | 'flagGate'; /* feature-flag loader (25.8 systemLandingsGate) */

export interface RouteEntry {
  /** Plná cesta vč. úvodního `/` a param segmentů (`:worldSlug`). */
  readonly pattern: string;
  /** Layout scope: ikaros = IkarosLayout, world = WorldLayout, standalone = bez layoutu. */
  readonly scope: 'ikaros' | 'world' | 'standalone';
  readonly guard: RouteGuard;
  /** Jen pro memberOnly/showcaseOrMember/wmg — minimální světová role. */
  readonly minWorldRole?: WorldRole;
  /** Jen pro guard 'redirect' — kam legacy URL vede. */
  readonly redirectTo?: string;
}

// ── Registr ───────────────────────────────────────────────────────────────
// Pořadí = pořadí v router.tsx (snadné ruční porovnání při editaci).
export const ROUTES = [
  // IkarosLayout — veřejné
  { pattern: '/', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/vesmiry', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/clanky', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/clanky/novy', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/clanky/:id/upravit', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/clanky/:id', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/galerie', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/galerie/nahrat', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/galerie/:id/upravit', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/galerie/:id', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/tvorba', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/bestiar', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/bestiar/:id', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/herbar', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/herbar/:id', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/lektvary', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/lektvary/:id', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/kouzla', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/kouzla/:id', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/predmety', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/predmety/:id', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/hadanky', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/hadanky/:id', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/ceniky', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/ceniky/:id', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/generatory', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/generatory/sady/:id', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/sceny', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/sceny/:id', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/podzemi', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/podzemi/:dungeonId', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/napoveda', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/podporovatele', scope: 'ikaros', guard: 'none' },
  { pattern: '/ikaros/systemy', scope: 'ikaros', guard: 'flagGate' },
  { pattern: '/ikaros/systemy/:slug', scope: 'ikaros', guard: 'flagGate' },
  { pattern: '/podminky', scope: 'ikaros', guard: 'none' },
  { pattern: '/soukromi', scope: 'ikaros', guard: 'none' },
  { pattern: '/kodex', scope: 'ikaros', guard: 'none' },
  { pattern: '/kontakt', scope: 'ikaros', guard: 'none' },
  { pattern: '/reset-password', scope: 'ikaros', guard: 'none' },
  { pattern: '/email-verify', scope: 'ikaros', guard: 'none' },
  { pattern: '/email-change/confirm', scope: 'ikaros', guard: 'none' },
  // IkarosLayout — chat a chráněné
  { pattern: '/chat', scope: 'ikaros', guard: 'none' },
  { pattern: '/chat/voice', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/chat/camp', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/chat/camp2', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/chat/camp3', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/chat/rozcesti', scope: 'ikaros', guard: 'redirect', redirectTo: '/chat/camp' },
  { pattern: '/chat/rozcesti2', scope: 'ikaros', guard: 'redirect', redirectTo: '/chat/camp2' },
  { pattern: '/chat/rozcesti3', scope: 'ikaros', guard: 'redirect', redirectTo: '/chat/camp3' },
  { pattern: '/ikaros/vytvorit-svet', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/profil', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/uzivatel/:id', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/diskuze', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/diskuze/nova', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/diskuze/:id', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/nabory', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/nabory/nova', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/posta', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/oblibene', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/akce', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/uzivatele', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/invite/:token', scope: 'ikaros', guard: 'requireAuth' },
  { pattern: '/ikaros/novinky', scope: 'ikaros', guard: 'none' },
  { pattern: '/admin', scope: 'ikaros', guard: 'roleGuard' },
  { pattern: '/admin/chat', scope: 'ikaros', guard: 'roleGuard' },
  { pattern: '/ikaros/admin/emotes', scope: 'ikaros', guard: 'roleGuard' },
  // WorldLayout
  { pattern: '/svet/:worldSlug', scope: 'world', guard: 'none' },
  { pattern: '/svet/:worldSlug/chat', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/novinky', scope: 'world', guard: 'showcaseOrMember', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/stranky', scope: 'world', guard: 'showcaseOrMember', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/nova-stranka', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/edit/:slug', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/postavy', scope: 'world', guard: 'showcaseOrMember', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/postava/:slug', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/moje-postava', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/mapa', scope: 'world', guard: 'showcaseOrMember', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/mapy', scope: 'world', guard: 'showcaseOrMember', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/takticka-mapa', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/bestiar', scope: 'world', guard: 'showcaseOrMember', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/kalendar', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.PomocnyPJ },
  { pattern: '/svet/:worldSlug/timeline', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Hrac },
  { pattern: '/svet/:worldSlug/pocasi', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Hrac },
  { pattern: '/svet/:worldSlug/akce', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/pavucina', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/scenare', scope: 'world', guard: 'wmg', minWorldRole: WorldRole.PomocnyPJ },
  { pattern: '/svet/:worldSlug/obchod', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/zvuky', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/podzemi', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Hrac },
  { pattern: '/svet/:worldSlug/podzemi/:dungeonId', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Hrac },
  { pattern: '/svet/:worldSlug/prevodnik-men', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/nastaveni', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/hraci', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/pravidla', scope: 'world', guard: 'showcaseOrMember', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/skupina/:groupKey', scope: 'world', guard: 'memberOnly', minWorldRole: WorldRole.Ctenar },
  { pattern: '/svet/:worldSlug/denik-pj', scope: 'world', guard: 'wmg', minWorldRole: WorldRole.PomocnyPJ },
  { pattern: '/svet/:worldSlug/admin/stranky', scope: 'world', guard: 'wmg', minWorldRole: WorldRole.PomocnyPJ },
  { pattern: '/svet/:worldSlug/admin/kalendare', scope: 'world', guard: 'wmg', minWorldRole: WorldRole.PomocnyPJ },
  { pattern: '/svet/:worldSlug/admin/headline', scope: 'world', guard: 'wmg', minWorldRole: WorldRole.PJ },
  { pattern: '/svet/:worldSlug/:slug', scope: 'world', guard: 'showcaseOrMember', minWorldRole: WorldRole.Ctenar },
  // Standalone (mimo layouty)
  { pattern: '/svet/:worldSlug/karta-tokenu', scope: 'standalone', guard: 'none' },
] as const satisfies readonly RouteEntry[];

/** Union všech route patternů — překlep spadne v `tsc -b`. */
export type RoutePattern = (typeof ROUTES)[number]['pattern'];

/**
 * Najdi nejspecifičtější pattern pro konkrétní pathname (kontextový engine
 * „kde jsem"). `matchPath` neřadí napříč patterny — skóruje se ručně:
 * více statických segmentů vyhrává, při shodě méně parametrů.
 * Vrací `null` pro neznámou cestu (404 / budoucí routa mimo registr).
 */
export function matchRoutePattern(pathname: string): RoutePattern | null {
  let best: RoutePattern | null = null;
  let bestScore = -1;
  for (const { pattern } of ROUTES) {
    if (!matchPath({ path: pattern, end: true }, pathname)) continue;
    const segments = pattern.split('/').filter(Boolean);
    const params = segments.filter((s) => s.startsWith(':')).length;
    const score = (segments.length - params) * 100 - params;
    if (score > bestScore) {
      bestScore = score;
      best = pattern;
    }
  }
  return best;
}
