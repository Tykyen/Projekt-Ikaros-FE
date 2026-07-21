# Spec 26.0 — Typovaný route registr + parity test (Vypravěč MVP‑A, D1–D2)

Stav: schváleno 2026-07-20 (vlastník: „dej se do spec a implementace") · Vazby: `docs/vypravec/04-architektura.md` §2 (prerekvizita registru topiků), `docs/vypravec/00-vize-a-rozhodnuti.md` §4.1 (D1–D2), roadmap3 fáze 26.

## Cíl

Jediný typovaný zdroj pravdy o FE routách. Vypravěč na něm staví `RoutePattern` (překlep routy v topiku/kotvě/cestě spadne v `tsc -b`), CI validace mrtvých odkazů (06 §7) a kontextový engine („kde jsem" — match pathname → pattern). Parita s `router.tsx` je vynucená testem — registr nemůže tiše zastarat.

## Rozhodnutí

| # | Rozhodnutí | Proč |
|---|---|---|
| 1 | Registr = ručně psaný `as const` seznam v `src/app/routeRegistry.ts`, NE build-time extrakce z router.tsx | extrakce z JSX/route objektů je křehká (guardy jsou elementy); parity test drift chytí stejně spolehlivě a registr unese metadata, která v router.tsx nejsou (scope, guard intent) |
| 2 | Entry: `{ pattern, scope, guard, minWorldRole?, redirectTo? }`; guard/minWorldRole = **deklarovaný záměr** (revidovatelný artefakt, vzor `exp` tabulky M‑MATRIX), parity test vynucuje JEN existenci pattern ↔ router oběma směry | guardy nejde spolehlivě číst z route elementů; jejich chování už kryje `nav-guard-matrix.spec.tsx`; audience-sanity CI přijde v MVP‑B (06 §7) |
| 3 | `RoutePattern` = union string literálů odvozený `(typeof ROUTES)[number]['pattern']` | typová kontrola zadarmo, žádný codegen |
| 4 | `matchRoutePattern(pathname)` — iterace přes `matchPath`, výběr nejspecifičtější shody (více statických segmentů > méně parametrů) | primární API kontextového enginu (D5); react-router `matchPath` neřadí napříč patterny sám |
| 5 | Parity test walkuje **runtime** `router.routes` (import `router` z router.tsx v jsdom — vzor router-schema-gate.spec.tsx); lazy stránky se při walku nenačítají | žádná duplikace parseru; index route → path rodiče; `'*'` (404) mimo registr přes allowlist |
| 6 | Redirect routy (`chat/rozcesti*`) jsou v registru s `redirectTo` | jsou to reálné URL (záložky testerů); Vypravěč na ně nesmí linkovat — CI mrtvých odkazů je pozná |

## Soubory

- **`src/app/routeRegistry.ts`** (nový): `ROUTES` as const · typ `RouteEntry` · `RoutePattern` · `matchRoutePattern()`. Scope: `'ikaros'` (IkarosLayout) · `'world'` (WorldLayout) · `'standalone'` (pop-out karta-tokenu). Guard: `'none' | 'requireAuth' | 'memberOnly' | 'showcaseOrMember' | 'wmg' | 'roleGuard' | 'redirect' | 'flagGate'`.
- **`src/app/__tests__/route-registry-parity.spec.ts`** (nový):
  1. router ⊆ registr (každá routa z walku má entry),
  2. registr ⊆ router (žádný fantom v registru),
  3. patterny unikátní,
  4. `matchRoutePattern`: statická přebije parametrickou (`/svet/w/pravidla` → `pravidla`, ne `:slug`; `/svet/w/karta-tokenu` → standalone; `/ikaros/clanky/novy` → `novy`, ne `:id`), root `/`, neznámá cesta → `null`.

## Mimo rozsah (další dny MVP‑A)

`src/shared/vypravec/**` (D3+), RouteHeaders (D5), kotvy, obsah. Žádná změna chování aplikace — čistě data + testy; `funkce`/`napoveda` se neaktualizují (nic user-facing).

## Ověření

`npx vitest run src/app/__tests__/route-registry-parity.spec.ts src/app/__tests__/nav-guard-matrix.spec.tsx` zelené + `npm run build` (tsc -b) bez nových chyb.
