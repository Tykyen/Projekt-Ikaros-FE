# 03 — Svět: membership & role

Vstup do světa a hierarchie uvnitř. Tady se rozhoduje **kdo je vůbec člen** (a v jaké roli), kdo
smí role měnit, a co může **owner** (zvláštní persona — `world.ownerId`, ne jen PJ role). Silné osy:
`OW` (operace nad **cizím** membershipem / v **cizím** světě — `membershipId`/`worldId` z URL),
`LK` (private svět → 404, ne 403), `BY` (GlobalAdmin + owner bypass), a **transitions** (PJ se
demotuje → stale `isPJ` ve vlastním prohlížeči, RR-3).

**BE:** `worlds` (controller, service, gateway), `universe`, access-requests flow
**FE:** `features/world` (WorldContext, WorldMembershipGuard, MembersTab, WorldStatus), join/access UI

> Sourozenec [bug-plan/06-svet-zaklad](../bug-plan/06-svet-zaklad.md) (SZ-xx) — ten testuje funkčnost;
> tady jde výhradně o **role/oprávnění** hrany. Body se doplňují, neduplikují.

---

## A. Vstup do světa (join / access-request) podle accessMode (`ST` `LK`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| SM-01 | `POST /worlds/:id/join` dle `accessMode`: public → membership Ctenar(1); closed → 403 WORLD_CLOSED; open/private → 400 WORLD_NOT_PUBLIC (musí přes access-request). Stav světa gatuje akci `[auto]` | `ST` | M3 | ⬜ |
| SM-02 | `POST /worlds/:id/access-request` na open/private vytvoří AR; na public/closed? Ověřit, že stav světa rozhoduje konzistentně FE↔BE `[auto]` | `ST` `PA` | M1 | ⬜ |
| SM-03 | Duplicitní join → 409 ALREADY_MEMBER; existující pending AR → 409 PENDING_ACCESS_REQUEST `[auto]` | `PA` | M3 | ⬜ |
| SM-04 | FE: dle `WorldStatus` (non-member / pending-access / member) zobrazí JoinCTA / AccessRequestPending / dashboard. Ověřit, že stav odpovídá BE realitě (žádný falsy u Zadatel) `[auto]` | `ST` `PA` | M1 | ⬜ |
| SM-05 | Private svět bez přístupu: `GET /worlds/slug/:slug` → **404** (ne 403) i pro přihlášeného non-membera. FE `WorldNotFound` `[auto]` | `LK` | M4 | ⬜ |

---

## B. Schvalování access-requestů (`OW` `BY`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| SM-06 | `approve`/`reject`/`cancel` AR → `assertCanModerateAccessRequests` ([worlds.service.ts:898]) = `world.ownerId === userId \|\| GlobalAdmin`. Pozor: **jen owner+admin**, ne každý PJ? Ověřit, zda PomocnyPJ/PJ-non-owner smí moderovat `[auto]` | `OW` `BY` | M1 | ✅ **konzistentní** (owner-only by design): gate=ownerId\|\|admin · WS→user:{ownerId} · list `scopeForUser` = vlastněné světy ([provider:99-102](../Projekt-ikaros/backend/src/modules/worlds/world-access-request.provider.ts#L99)) → ne-owner PJ AR nevidí, žádný approve UI = žádný 403 drift |
| SM-07 | Red-team: approve AR patřící **jinému** světu (`requestId` z cizího světa, `worldId` v URL svůj) → 404. Ověřit cross-world izolaci `[auto]` | `OW` | M8 | ⬜ |
| SM-08 | FE: tlačítka approve/reject vidí jen ten, kdo smí moderovat (owner/admin). Pokud je vidí i PJ-non-owner, ale BE 403 → over-restrikce nebo eskalace dle směru — ověřit paritu `[auto]` | `PA` | M1 | ⬜ |

---

## C. Změna role & skupiny člena (`PA` `OW` `EN`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| SM-09 | `PATCH /worlds/:id/members/:membershipId/role` → `canManageMembers` ([worlds.service.ts:1763]) = GlobalAdmin \|\| role>=PomocnyPJ(4). Hráč/Korektor → 403 `[auto]` | `PA` | M4 | ⬜ |
| SM-10 | **Eskalace přes hodnotu role:** může PomocnyPJ(4) povýšit někoho (i sebe) na PJ(5)? Ověřit strop — staff nesmí udělit vyšší roli, než má sám. Red-team: PATCH role=5 jako PomocnyPJ `[auto]` | `ES` | M8 | 🐛 R-03 (POTVRZENO — bez stropu, viz registr) |
| SM-11 | Role enum mimo 0–5: PATCH role=99 / role=-1 → 400 (ne uložení). `assertMembershipInWorld` ([worlds.service.ts:1183]) + DTO `@IsEnum`/range `[auto]` | `EN` | M1 | ⬜ |
| SM-12 | `:membershipId` + `:worldId` v URL: BE validuje, že membership **patří** do worldId (N-18: `assertMembershipInWorld`). Red-team: cizí membershipId + svůj worldId → 404 `[auto]` | `OW` | M8 | ⬜ |
| SM-13 | `PATCH .../members/:id/akj` (clearance) → `canManageMembers` (PomocnyPJ+). Ověřit, že hráč nezmění svou ani cizí AKJ úroveň `[auto]` | `PA` `OW` | M4 | ⬜ |
| SM-14 | FE `MembersTab` — UI změny role/AKJ/skupiny vidí jen `viewerRole >= PomocnyPJ` ([MembersTab.tsx:56]); GlobalAdmin→PJ mapping je UI only (RM-24) `[auto]` | `PA` `BY` | M1 | ⬜ |

---

## D. Owner — zvláštní persona (`OW` `BY`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| SM-15 | Owner **nesmí odejít** ze světa: `DELETE /worlds/:id/members/:ownMembership` → 400 WORLD_OWNER_CANNOT_LEAVE. FE `MembershipTab` to blokuje (jen sekce „Předat svět"). Obě strany? `[auto]` | `OW` `PA` | M4 | ⬜ |
| SM-16 | `PATCH /worlds/:id/transfer-ownership` → jen owner (nebo Admin?) iniciuje; nový owner musí být člen role Hrac+; po transferu starý owner → PomocnyPJ, nový → PJ. Red-team: non-owner PJ zkusí transfer → 403 `[auto]` | `OW` | M8 | ⬜ |
| SM-17 | `DELETE /worlds/:id` (soft delete) → `assertCanAdminWorld` (PJ \|\| GlobalAdmin). Ověřit, že PomocnyPJ **nesmí** smazat svět `[auto]` | `PA` | M4 | ⬜ |
| SM-18 | Owner ≠ PJ role: owner je vždy PJ membership, ale logika ownershipu je zvlášť (`world.ownerId`). Ověřit, že akce vázané na ownership (transfer, nesmí odejít) **nestačí** mít jen roli PJ bez ownershipu `[auto]` | `OW` `BY` | M1 | ⬜ |

---

## E. Zadatel(0) — pending člen bez přístupu (`PA` `LK`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| SM-19 | Zadatel **je** v DB membership, ale `assertMember` ([worlds.service.ts:1722]) ho odmítá (403 „pending"). Ověřit, že žádný gating ho omylem počítá jako Ctenar `[auto]` | `PA` | M4 | ⬜ |
| SM-20 | FE `useWorldStatus` — Zadatel = `member` nebo `pending`? (bug-plan N-17 = by-design: Zadatel vidí dashboard, herní akce BE 403). Ověřit, že FE dashboard nevolá akce, co Zadatel dostane 403 `[auto]` | `OR` `PA` | M1 | ⬜ |
| SM-21 | `request-character`: Ctenar → Zadatel (idempotent); Hrac+ → 400; non-member → 404. Ověřit přechod role `[auto]` | `ST` | M3 | ⬜ |
| SM-22 | FE `WorldMembersPage` — Zadatel(0) se **nezobrazí** v adresáři členů (není plný člen). Ověřit filtr `[auto]` | `LK` | M1 | ⬜ |

---

## F. Matice persona × akce (membership)

| Akce / persona | guest | Zadatel | Ctenar | Hrac | Korektor | PomocnyPJ | PJ-non-owner | owner(PJ) | Admin/Sa |
|---|---|---|---|---|---|---|---|---|---|
| `GET` private svět detail | 🚫 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST join` (public) | 🔒 | — | — | — | — | — | — | — | ✅ |
| moderovat access-request | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔? | ⛔? | ✅ | ✅ |
| změnit roli člena | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅⁺ | ✅ | ✅ | ✅ |
| změnit AKJ člena | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ | ✅ |
| odejít ze světa | 🔒 | ✅ᵒ | ✅ᵒ | ✅ᵒ | ✅ᵒ | ✅ᵒ | ✅ᵒ | ⛔(owner) | — |
| transfer ownership | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| smazat svět | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |

`⁺` PomocnyPJ — ověřit strop (nesmí udělit PJ, SM-10). `⛔?` — moderace AR možná jen owner+admin (SM-06,
ne každý PJ) → **ověřit**. `✅ᵒ` = jen vlastní membership (cizího odebrat smí jen PomocnyPJ+).

> **Delta parity (membership):**
> - SM-06 moderace AR jen owner+admin? — FE: vidí to PJ? · BE: `ownerId===userId` · **⚠️ ověřit** (PJ-non-owner)
> - SM-10 strop povýšení — **⚠️ red-team** (PomocnyPJ → PJ?)
> - SM-12 cizí membershipId — **✅** (N-18 `assertMembershipInWorld`), potvrdit M8
> - SM-15 owner nesmí odejít — FE blokuje · BE 400 · **✅ parita** (ověřit)
> - ostatní → vyplnit.

---

## Cross-role transitions (temporální) — RR-3 / R3

- **T-1 (stale isPJ):** PJ se přes `transferOwnership` demotuje na PomocnyPJ. `isPJ` ve `WorldLayout`
  ([:298]) je spočítaný při mountu z `membership.role` → vlastní prohlížeč zůstane `isPJ=true` až do
  reloadu. Vidí PJ-only nav, klikne PJ akci → BE 403. **Ověřit:** invaliduje WS/refetch membership po
  transferu i u iniciátora? (bug-audit N-15: `world.membership.changed` payload).
- **T-2 (promote za běhu):** PJ povýší hráče na PomocnyPJ — dostane hráč PJ UI bez reloadu? (real-time
  membership propagace). Pokud ne, over-restrikce do refreshe — akceptovatelné, ověřit.
- **T-3 (demote cizího):** PJ demotuje aktivního PomocnyPJ — jeho otevřené editační UI přestane fungovat
  (BE 403). FE musí 403 ošetřit (toast + refetch), ne spadnout.

---

## Test coverage gaps

- `worlds.gateway` (z bug-planu): chybí test pro `handleMembershipChanged`/`Removed`/`AccessCancelled`.
- `WorldMembershipGuard` — test pro `fallbackGlobalRoles` bez membership a `redirectTo` token.
- Red-team M8: SM-10 (strop povýšení), SM-12 (cizí membershipId), SM-16 (non-owner transfer) — žádný test.
- `assertCanModerateAccessRequests` — test, zda PJ-non-owner smí/nesmí (SM-06 nejasné).

---

## Známá rizika

- **RM3-1 (`OW`/SM-06)** — moderace AR vázaná na `ownerId`, ne na roli PJ. Buď je to záměr (jen owner
  rozhoduje, kdo vstoupí), nebo díra (PJ-non-owner by měl moct). **Produktové rozhodnutí + parita FE.**
- **RM3-2 (`ES`/SM-10)** — pokud `canManageMembers` nemá strop, PomocnyPJ se povýší na PJ → vertikální
  eskalace uvnitř světa. Nutné red-team.
- **RM3-3 (transitions)** — stale `isPJ` (R3/RR-3): kosmetické (BE drží 403), ale matoucí UX a riziko,
  pokud by někde FE rozhodoval bez BE re-checku.
