# Spec 26.2 — Kontextový engine + RouteHeaders Tier 0 (Vypravěč MVP‑A, D5)

Stav: schváleno 2026-07-21 (mandát „nejdříve si vše uděláme") · Vazby: `docs/vypravec/04-architektura.md` §2–3, `01-mapa-prostoru.md` §1 (Tier 0 = 25 rout), spec-26.1 (shell)

## Rozsah

„Kde jsem" naplno: registr `RouteHeader` pro všech 25 Tier 0 rout (+ varianty camp2/3, nabory/nova), engine pro výběr hlavičky + role-aware dovětku, render v panelu; **reálné avatary** (Ishida/Joe z 02a assetů) v panelu a na platformním FAB. Mimo rozsah: topiky/kontextové karty (obsahová výroba), persistence (D6), journey (D7–8).

## Rozhodnutí

| # | Rozhodnutí | Proč |
|---|---|---|
| 1 | `RouteHeader { route: RoutePattern; name; blurb; audienceNotes? }` — `route` typované proti registru spec-26.0 | překlep/rename spadne v tsc; dle 04 §2 |
| 2 | Audience dovětek jen ve world scope (z `userRole` prop); platformní notes zatím neplněny | anon/přihlášený rozlišení na platformě zatím nemá obsahovou potřebu; typ je připraven |
| 3 | Hlavička = `blurb` + volitelný dovětek dle audience (aditivní, ne náhrada) | jedna věta pravdy + role-aware špetka; žádné duplicitní texty |
| 4 | Mimo pokryté routy poctivý fallback (per scope replika 8/8b styl) — žádné AI stuby | zásada poctivosti 02 §2 |
| 5 | FAB mimo svět = brand avatar Ishidy (WebP 96/192 + PNG fallback, `<picture>`); ve světě zůstává tokenizovaná silueta Joe | 03 §1; silueta ve světě = theming přes currentColor, obrázek by se s 12 motivy hádal |
| 6 | Panel hlavička: avatar mluvčího dle scope (ishida-avatar / joe-avatar) | postava k hlasu; lazy (`loading="lazy"`) — panel je sám lazy chunk |

## Soubory

- `src/shared/vypravec/registry/types.ts` — `VypravecAudience`, `RouteHeader`
- `src/shared/vypravec/registry/routeHeaders.ts` — ~26 záznamů Tier 0 (hlas: platforma Ishida, svět Joe — dle style-guide 02 §2)
- `src/shared/vypravec/engine/resolveHeader.ts` — `resolveRouteHeader(pathname, ctx)` → `{ name, text } | null`
- Úpravy: `VypravecRoot` (props `world?: {name?, userRole, isPJ}`), `VypravecPanel` (hlavička z enginu + avatar `<picture>`), `VypravecFab` (ikaros = avatar img), `WorldLayout` (předá role)
- Testy: `resolveHeader.spec.ts` (pokrytá routa · audience dovětek · fallback null · varianty camp) + update `vypravecRoot.spec.tsx` (nové texty hlaviček)

## Ověření

Vitest zelené (nové + stávající) · `npm run build` (bundle budget — avatar img jde do lazy panel chunku, na platformní FAB WebP 96 ≈ pár kB eager) · texty hlaviček = podklad k voice pass revizi vlastníkem (ladění vyhrazeno, 02 §2.1 režim „zatím").
