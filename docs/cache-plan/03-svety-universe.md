# 03 — Světy & universe

> **Sweep 2026-06-05.** Cache-invalidation inventura (TanStack Query v5). Read-only.
> Osy: `KM` `SC` `FO` `WS` · perspektivy P1 (konzumentská inventura) + P4 (WS↔REST parita).
> Soubory: `src/features/world/api/`, `…/hooks/`, `…/universe/`. Nálezy → [`../cache-audit.md`](../cache-audit.md) (`C-01…C-04`).
> **Stav: ✅ hotovo — 4 nálezy (C-01…C-04, vše 🟠), K-C1 vyvrácen (⚖️ by-design).**

## 1. Konzumentská inventura (P1)

| Zdroj / entita | `queryKey` | role | staleTime / enabled | soubor:řádek |
|---|---|---|---|---|
| Moje světy (membershipy) | `['worlds','my']` | seznam + odvozený WorldContext (role/slot) | 5 min; `!!token` | [useWorlds.ts:10](../../src/features/world/api/useWorlds.ts#L10) |
| World **detail** | `['worlds', 'id'\|'slug', worldKey]` | **detail** (`World` objekt) | 5 min; `!!worldKey` | [useWorlds.ts:28](../../src/features/world/api/useWorlds.ts#L28) |
| Veřejné světy | `['worlds','public']` | seznam / sidebar (logged-out) | 5 min | [useWorlds.ts:45](../../src/features/world/api/useWorlds.ts#L45) |
| World **settings** | `['worlds', worldId, 'settings']` | config | 60s; `!!worldId` | useWorldSettings.ts:11 |
| **Members** | `['worlds', worldId, 'members']` | seznam (tab Členové) + sidebar presence | 60s; `!!worldId` | useWorldMembers.ts:11 |
| Moje access requesty | `['worlds','my-access-requests']` | seznam / status | 60s; `!!token` | useMyAccessRequests.ts:14 |
| World news (dashboard) | `['world-news', worldId]` | dashboard widget | 60s | useWorldNews.ts:11 |
| World news list / count | `['world-news', worldId, 'list'\|'count', …]` | seznam / badge | — | useWorldNews.ts:34,59 |
| Universe mapa | `['universe', worldId]` (factory) | graf | 30s | useUniverse.ts:16 |

> `useWorldStatus` nemá vlastní query — derivuje z `['worlds','my']` + `['worlds','my-access-requests']`.
> Proto invalidace `my` opraví většinu role/membership UI i bez obnovy world detailu.

## 2. Mutace × konzument matice

| Mutace (soubor:řádek) | my | detail | public | settings | members | AR | pending | placement |
|---|---|---|---|---|---|---|---|---|
| useUpdateWorld `invalidate(['worlds'])` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | config |
| useTransferOwnership `['worlds']` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | config |
| useUpdateMyWorldTheme `['worlds']` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | config |
| useUpdateWorldSettings | — | — | — | ✅ | — | — | — | config |
| useCreateWorld | ✅ | — | ✅ | — | — | — | — | config |
| useUpdateMember `['worlds',w,'members']` | **❌** | — | — | — | ✅ | — | — | config → **C-03** |
| useRemoveMember | ✅ | — | — | — | ✅ | — | — | config |
| useUpdateMemberCharacter | ✅ | — | — | — | ✅ | — | — | config |
| useJoinWorld `['worlds',worldId]`+`my` | ✅ | **❌** | — | ✅ˢ | ✅ˢ | — | — | config → **C-01** |
| useRequestAccess / useCancelAccessRequest | — | — | — | — | — | ✅ | — | config |
| useApproveAccessRequest `['pending-actions']` | **❌** | — | — | — | **❌** | — | ✅ | config → **C-02** |
| useRejectAccessRequest | — | — | — | — | — | — | ✅ | config |
| useUpdateUniverse / useUpdateNodeVisibility | — | — | — | — | — | — | — | `setQueryData(universe)` (D-03-6) |

ˢ = `['worlds',worldId]` prefix-matchuje `settings`/`members` (oba `[1]=worldId`), ale **ne detail** (`[1]='id'/'slug'`).

**WS handlery:** `world:updated`→`['worlds']` (vše) · `world:membership:changed/removed`→`['worlds',w,'members']` · `world:deleted`→toast+navigate · `world:access-approved`→`my-access-requests`+`my`+`['worlds',p.worldId]` · `world:access-requested/cancelled`→`['pending-actions']`.

## 3. Verdikt seed kandidáta K-C1 — ⚖️ by-design

`useWorldSocket.ts:45` `world:updated` → `invalidate(['worlds'])`. Element-po-elementu je `['worlds']`
**nejkratší společný prefix VŠECH** world dotazů (`my`/`id`/`slug`/`public`/`settings`/`members`/`AR`) →
trefí detail i settings korektně. Komentář „refetch aktivní world query" sedí. **Není nález.**
⚠️ Vedlejší (SC): `['worlds']` je velmi široký — invaliduje i cizí světy (klíč nenese worldId). Bezpečné
pro cache (raději moc než málo), jen latentní over-invalidation.

## 4. Nálezy

### 🟠 C-01 · `KM`/`SC` · join/approve invaliduje `['worlds',worldId]`, který NEtrefí world detail
- **Mutace:** [useWorldJoin.ts:15](../../src/features/world/api/useWorldJoin.ts#L15) `invalidate(['worlds', worldId])`; totéž [useWorldAccessSocket.ts:56](../../src/features/world/hooks/useWorldAccessSocket.ts#L56).
- **Konzument:** world detail [useWorlds.ts:28](../../src/features/world/api/useWorlds.ts#L28) `['worlds','id'|'slug',worldKey]`.
- **Rozpor:** `['worlds',worldId]` má `[1]=worldId` (ObjectId), detail má `[1]='id'`/`'slug'` (literál) → `worldId !== 'id'` → **detail se neinvaliduje**. (Settings/members trefí — ty mají `[1]=worldId`.)
- **Trigger:** hráč vstoupí do public světa (join) / žadatel je schválen → zůstane na stránce světa.
- **Viditelnost:** `World` detail (accessMode/membership-dependent sekce, JoinCTA) drží předvstupní stav. **Maskováno** tím, že `useWorldStatus` čte z `['worlds','my']` (to invalidováno je) → většina UI se opraví; čistě detail-query konzumenti ne.
- **Workaround:** F5 / 5 min staleTime.
- **Návrh:** invalidovat `['worlds']` (jako ostatní world mutace) místo `['worlds', worldId]`, nebo přidat oba detail klíče. ⚠️ Pozor na D-03-7 (zúžení na `['worlds',worldId]` detail nikdy netrefí).

### 🟠 C-02 · `FO` · REST approve invaliduje jen `['pending-actions']` — members u PJ závisí jen na WS
- **Mutace:** [useWorldJoin.ts:65](../../src/features/world/api/useWorldJoin.ts#L65) `useApproveAccessRequest.onSuccess` → jen `invalidate(['pending-actions'])`.
- **Rozpor:** neinvaliduje `['worlds',worldId,'members']` ani `['worlds','my']`. PJ, který schválil, vidí nového člena **výhradně** přes WS `world:membership:changed` (useWorldSocket) — žádný REST fallback.
- **Trigger:** approve při odpojeném/degradovaném socketu (nebo když BE neodbroadcastne). **Viditelnost:** nový člen tiše chybí v seznamu členů u PJ (toast „schváleno" přesto naskočí). **Workaround:** F5.
- **Pozn.:** schválený **uživatel** members dostane (WS `access-approved` → `['worlds',p.worldId]` prefix-matchuje members). Nesoulad je per-rola (P4).
- **Návrh:** doplnit do approve `onSuccess` `invalidate(['worlds',worldId,'members'])` (REST fallback nezávislý na WS).

### 🟠 C-03 · `FO` · `useUpdateMember` neobnoví `['worlds','my']` (změna vlastní role)
- **Mutace:** useUpdateMember.ts:35 → jen `['worlds',worldId,'members']`.
- **Rozpor:** sourozenci `useRemoveMember`/`useUpdateMemberCharacter` `['worlds','my']` invalidují, `useUpdateMember` ne. Když PJ změní **vlastní** roli (nebo roli právě přihlášeného v jiné kartě), `useMyWorlds` (membership.role → WorldContext) drží starou roli 5 min.
- **Trigger:** změna vlastní role. **Viditelnost:** UI gating dle role drží starý stav. **Workaround:** F5 / 5 min. **Závažnost:** 🟠 (edge — měnit vlastní roli je vzácné).
- **Návrh:** přidat `invalidate(['worlds','my'])` do `useUpdateMember` (parita se sourozenci).

### 🟠 C-04 · `WS`/`FO` · world news nemá žádný real-time push
- **Místo:** `['world-news', …]` má vlastní namespace, **nesdílí** prefix `['worlds']`; `useWorldSocket` žádný news event neposlouchá.
- **Rozpor:** když PJ přidá oznámení, ostatní členové (dashboard widget) ho neuvidí do staleTime 60s / refetchOnMount. Vlastní mutace news (create/update/delete/archive) invalidují `['world-news',worldId]` správně (prefixuje widget + list + count — ✅ ověřeno KM).
- **Trigger:** cizí PJ vytvoří oznámení. **Viditelnost:** tiše chybí. **Workaround:** 60s / F5. **Závažnost:** 🟠 (krátký staleTime tlumí; jde o real-time gap, ne broken invalidaci).

## 5. Latentní / VERIFY (neeskalováno na C-xx)

- **D-03-6 `OPT` 🟡** — [useUniverse.ts:36,48](../../src/features/world/universe/api/useUniverse.ts#L36) `setQueryData` v `onSuccess` **bez** `onSettled` resync. Není optimistic (zápis až po success, použije vrácený `map`) → žádná lež k rollbacku. Riziko jen pokud PATCH visibility nevrací plnou mapu se strukturou → VERIFY (M4).
- **D-03-7 `SC` 🟡 (drift-trap)** — detail klíč `[1]='id'/'slug'` znamená, že `['worlds',worldId]` detail **nikdy** netrefí. Kdokoli v budoucnu „zoptimalizuje" širokou `['worlds']` invalidaci na `['worlds',worldId]`, tiše rozbije obnovu detailu (→ 🔴). Preventivní poznámka; kořen C-01.

**Census (M-CEN): čistý** — žádná mutace v oblasti bez cache efektu.
