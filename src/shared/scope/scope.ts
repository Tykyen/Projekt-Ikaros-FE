/**
 * R3 27.3 — Scope registr A/B/C + scope freeze.
 *
 * SSOT pro klasifikaci viditelné šíře platformy (spec-27.3, lidsky čitelné
 * zrcadlo `docs/scope-registr.md`). Každá plocha s vstupním bodem v UI je:
 *
 *  A = beta core     — certifikováno (zlaté cesty 27.1), default viditelné.
 *  B = preview       — funguje, ale okrajové/hloubkové → `<PreviewBadge>`.
 *  C = skryté (flag) — experimentální/blokované → nav hide + route `flagGate`.
 *
 * PRAVIDLO SCOPE-FREEZE (Etapa III): žádná nová velká doména, dokud A-scope
 * není certifikovaný. Výjimky jen po diskuzi.
 *
 * PŘESUN TIERU = jeden řádek zde:
 *  - do B: přidej klíč do `PREVIEW_FEATURES` (badge se objeví v nav).
 *  - do C: přidej klíč do `HIDDEN_FEATURES` + zajisti gate (world nav filtr
 *    respektuje `id`; platform nav / route dostane `flagGate` dle vzoru 25.8).
 *
 * SCOPED, ne destruktivní: in-world nástroje zavedených PJ se neschovávají
 * flagem (= brát funkce). C se v tomto zátahu používá jen pro už-blokované
 * „RPG systémy" (licence, 25.8 `SystemLanding/flag.ts`) — ten flag zůstává
 * ve svém tiny modulu (bundle-splitting), zde je jen evidován.
 *
 * KLÍČE:
 *  - svět: nav `id` z `buildFullWorldNav` (worldNavConfig).
 *  - platforma: `navKey` (PRIMARY_NAV) nebo room `key` (CHAT_ROOMS).
 */

export type ScopeTier = 'A' | 'B' | 'C';

/**
 * Třída B — viditelné s „Preview" štítkem. Klíč = nav `id` (svět) /
 * `navKey`|room `key` (platforma). Řazeno dle `docs/scope-registr.md`.
 */
export const PREVIEW_FEATURES: ReadonlySet<string> = new Set([
  // Platforma (first-contact okrajová šíře)
  'tvorba', // Společná tvorba (články/galerie/diskuze)
  'nabory', // Hledá se / LFG (19.3)
  'voice', // Voice krčma (17.6; realtime nestabilita)
  'camp1', // Fantasy camp
  'camp2', // Mystery camp
  'camp3', // Sci-fi camp
  // Svět (in-world hloubkové/pokročilé nástroje)
  'timeline', // Časová osa
  'kalendar', // Kalendář
  'pavucina', // Pavučina (graf vztahů)
  'mapa', // Mapa vesmíru (3D)
  'mapy', // Atlas map
  'obchod', // Obchod
  'prevodnik-men', // Převodník měn
  'scenare', // Storyboard
  'pocasi', // Generátor počasí
  'zvuky', // Zvuková databáze
  'dungeon-builder', // Stavitel (21.3)
]);

/**
 * Třída C — skryté za flagem. Aktuálně jen „RPG systémy" (blokované licencí,
 * 25.8). Vlastní přepínač je `SYSTEM_LANDINGS_PUBLIC` v `SystemLanding/flag.ts`
 * (tiny modul kvůli bundle-splittingu) — zde jen evidence pro úplnost registru.
 */
export const HIDDEN_FEATURES: ReadonlySet<string> = new Set([
  'systemy', // RPG systémy — viz SystemLanding/flag.ts
]);

/** True, pokud plocha nese „Preview" štítek (třída B). */
export function isPreview(key: string | undefined): boolean {
  return key !== undefined && PREVIEW_FEATURES.has(key);
}

/** True, pokud je plocha skrytá za flagem (třída C). */
export function isHidden(key: string | undefined): boolean {
  return key !== undefined && HIDDEN_FEATURES.has(key);
}

/** Tier plochy dle registru (A = default, když není v B ani C). */
export function scopeTier(key: string | undefined): ScopeTier {
  if (isHidden(key)) return 'C';
  if (isPreview(key)) return 'B';
  return 'A';
}
