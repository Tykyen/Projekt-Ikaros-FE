# tools/nav-scan — `scripts/nav-audit.mjs`

> Statický diff navigačního grafu. Vzor: [`scripts/route-audit.mjs`](../../../scripts/route-audit.mjs)
> (ten řeší **HTTP API** drift; tenhle **client-side routy**). Výstup: `npm run audit:nav`.

## Vstup → výstup

```
PATH-SET  ← src/app/router.tsx        (všechny path, složené dle zanoření, s guard/role/pořadí příznaky)
LINK-SET  ← src/**/*.{ts,tsx}         (to=, navigate(, <Navigate to=>, nav generátory)
                                       mimo *.spec.* / *.test.* / __tests__
─────────────────────────────────────────────────────────────────────
DEAD LINKS    = LINK-SET ∖ PATH-SET   (odkaz nikam → 🟠/🔴)
ORPHAN ROUTY  = PATH-SET ∖ LINK-SET   (routa bez vstupu → 🟡, po whitelistu)
SHADOWED      = routa za catch-all v témže parent stromu → 🔴
PARAM DRIFT   = path :x  vs  useParams().y  (jiný klíč → 🟠)   [volitelně, druhá pasáž]
```

## Extrakce PATH-SET (router.tsx)

- Parsuj strom `createBrowserRouter([...])`. Ideálně **AST** (`@typescript-eslint/parser` nebo `ts` API) —
  regex na vnořeném stromu je křehký (vzor `route-audit.mjs` jede regex jen na ploché `@Get` dekorátory).
- Pro každou routu slož **plnou cestu** podle parent `path` (root `''` → `/svet/:worldSlug` → child).
- Zapiš příznaky: `index?`, `guard` (memberOnly / RoleGuard / requireAuth / žádný), `minWorldRole`/`roles`,
  `isCatchAll` (`*` nebo `:slug`), **pořadové číslo** v rámci parenta (kvůli SHADOWED).

## Extrakce LINK-SET

- **Literály**: `to="/..."`, `to={`...`}`, `navigate('/...')`, `<Navigate to="/...">`.
- **Nav generátory** (nejvíc rizika): `buildWorldNav` / `headlineToNavGroups` / `buildGroupNavEntries` /
  `PRIMARY_NAV` / `CHAT_ROOMS` — vytáhni string literály cest uvnitř (`${b}/chat`, `/ikaros/...`).
- Ulož `{ path, file, line, kind: link|navigate|navConfig }`.

## Normalizace (shodná pro obě množiny — KLÍČOVÉ)

```js
function norm(p) {
  return p
    .replace(/\$\{[^}]+\}/g, ':x')   // ${slug}, ${b}, ${g.key} → :x
    .replace(/:[A-Za-z0-9_]+/g, ':x') // :worldSlug, :groupKey → :x
    .replace(/\?.*$/, '')            // strip query (?tab=moje, ?type=NPC)
    .replace(/#.*$/, '')             // strip hash
    .replace(/\/+$/, '')             // trailing slash
    .replace(/^\//, '');             // leading slash
}
```
> ⚠️ `${b}` (= `/svet/${worldSlug}`) musí expandovat **před** norm, jinak `${b}/chat` → `:x/chat` místo
> `svet/:x/chat`. Buď inline-expanduj známé prefixy, nebo normalizuj router stejně (obě strany `:x`).

## Whitelisty (legitimní orphan / výjimky)

| Kategorie | Příklad | Proč není nález |
|---|---|---|
| index routy | `/svet/:x` (WorldDashboard) | vstup z „Moje světy", ne nav generátor |
| mailové | `reset-password`, `email-verify`, `email-change/confirm` | vstup z e-mailu |
| catch-all | `*`, `:slug` (wiki) | chytá zbytek, nemá mít přímý odkaz |
| deep-link-only | `ikaros/uzivatel/:id` | vstup z proklik avatarů (dynamický `to`) |

## Exit kódy (pro CI guard)

- `0` — 0 dead links, 0 shadowed (orphan jen whitelistované)
- `1` — ≥1 dead link nebo shadowed → CI fail

## Co tool NEUVIDÍ (→ render harness / e2e)

- `navigate(target)` kde `target` je proměnná/prop (ne literál) → render/e2e.
- jestli orphan routa je záměr nebo mrtvý kód → lidský verdikt.
- jestli guard logicky sedí (jen že existuje) → `RG` cross-ref + render negativní test.
