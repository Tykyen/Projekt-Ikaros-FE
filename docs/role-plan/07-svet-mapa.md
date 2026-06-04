# 07 — Svět: taktická mapa

Nejhustší oblast na **field-level** (`allowedPlayerFields` — hráč smí měnit jen podmnožinu polí
tokenu), **state** (`isLocked` — i vlastní token nejde editovat když zamčený), **ownership** (hráč
hýbe jen **svým** tokenem) a **red-team** (operace jdou přes operation API, FE gating obejde ruční
operace). Tady historicky tekly N-26 (hráč nesměl `initiative`), N-29 (hráč editoval HP zamčeného
tokenu — FE gating to měl, BE ne). Autoritativní je `operations-authorizer.service`.

**BE:** `maps` (controller, service, gateway, repository), `world-operations`, `operations-authorizer`,
`dungeon-maps`
**FE:** `features/world/tactical-map` — useTokenPermissions, InitiativeBar, token modaly, scene UI

> Sourozenec [bug-plan/11-svet-mapa](../bug-plan/11-svet-mapa.md). Tady role/field/state/ownership hrany.

---

## A. Scéna — správa & čtení (`PA` `EN`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| MA-01 | `maps.assertCanManage` ([maps.service.ts:41]) = GlobalAdmin \|\| role>=**PJ(5)** → create/update/delete scény. PomocnyPJ → 403 (scény spravuje PJ). Ověřit FE práh `[auto]` | `PA` `EN` | M2 | ⬜ |
| MA-02 | `assertCanReadScene` ([operations-authorizer.service.ts:242]) = GlobalAdmin \|\| member. Každý člen čte přidělenou scénu; Zadatel → 403 `[auto]` | `PA` | M4 | ⬜ |
| MA-03 | Per-player scene assignment (paměť: WorldMembership.currentSceneId). Hráč vidí jen scénu, kam je přiřazen? Ověřit, že nečte cizí aktivní scénu `[auto]` | `OW` `ST` | M1 | ⬜ |
| MA-04 | `assign player to scene` → PJ. Red-team: hráč přiřadí sebe/jiného na scénu → 403 `[auto]` | `PA` | M8 | ⬜ |

---

## B. Operace na tokenu — field-level + state + ownership (P1 `ST` `OW`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| MA-05 | `assertCanDo` ([operations-authorizer.service.ts:51]) — token operace: GlobalAdmin/PJ/PomocnyPJ plně; **hráč jen vlastní token** a jen pohyb + `allowedPlayerFields`. Ověřit ownership větev (token owner = userId) `[auto]` | `OW` | M1 | ⬜ |
| MA-06 | **N-26 regrese:** `allowedPlayerFields` musí obsahovat pole, která FE `InitiativeBar` posílá — `currentHp`, `injury`, **`initiative`**. Pokud FE pošle pole mimo seznam → BE 403. Ověřit shodu seznamů FE↔BE `[auto]` | `OR` `ES` | M2 | ⬜ |
| MA-07 | **N-29 regrese:** `assertCanDo` kontroluje per-token `isLocked` — hráč **nesmí** editovat zamčený token, ani vlastní. FE `useTokenPermissions` to gatuje taky. Red-team: hráč pošle operaci na vlastní **zamčený** token → 403 `[auto]` | `ST` `OW` | M8 | ✅L2 BE ([:136](../Projekt-ikaros/backend/src/modules/maps/operations/operations-authorizer.service.ts#L136)) |
| MA-08 | Red-team field-level: hráč pošle operaci měnící pole **mimo** `allowedPlayerFields` (např. `name`, `imageUrl`, `size`) na vlastní token → 403. FE to neukáže, ale BE musí držet `[auto]` | `ES` | M8 | ✅L2 BE ([:145-157](../Projekt-ikaros/backend/src/modules/maps/operations/operations-authorizer.service.ts#L145)) |
| MA-09 | Red-team ownership: hráč pošle pohyb **cizího** tokenu (token owner ≠ userId) → 403 `[auto]` | `OW` | M8 | ✅L2 BE ([:85,:128](../Projekt-ikaros/backend/src/modules/maps/operations/operations-authorizer.service.ts#L85)) |
| MA-10 | `assertCanDoWorldOp` ([:194]) = role>=PJ(5) → globální operace na mapu (fog, scene state). Hráč/PomocnyPJ → 403 `[auto]` | `PA` | M4 | ⬜ |

### P1 sub-matice: pole tokenu × persona

| pole / persona | owner-hráč (odemčený) | owner-hráč (zamčený) | cizí hráč | PomocnyPJ | PJ |
|---|---|---|---|---|---|
| position (move) | ✅ | ⛔ˢ | ⛔ᵒ | ✅ | ✅ |
| `currentHp` | ✅ᶠ | ⛔ˢ | ⛔ᵒ | ✅ | ✅ |
| `injury` | ✅ᶠ | ⛔ˢ | ⛔ᵒ | ✅ | ✅ |
| `initiative` | ✅ᶠ | ⛔ˢ | ⛔ᵒ | ✅ | ✅ |
| `name`/`image`/`size` | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| `isLocked` (zamknout) | ⛔ | ⛔ | ⛔ | ✅ | ✅ |

`ˢ`=blokuje stav (isLocked), `ᵒ`=blokuje ownership, `ᶠ`=jen pole z `allowedPlayerFields`. ⚠️ Holé `✅`
u `name`/`image` pro hráče by byla díra — musí být `⛔` i na vlastním tokenu.

---

## C. HP & viditelnost (`OW` `ST`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| MA-11 | Token HP (paměť: bestie=systemStats snapshot, PC/NPC=diary subdoc). Hráč vidí/mění HP vlastního tokenu; per-scéna visibility toggle (PJ skryje HP). Ověřit, že skryté HP neteče hráči `[auto]` | `LK` `ST` | M1 | ⬜ |
| MA-12 | Bestie token = nezávislá instance (paměť: abilities/notes/health vlastní). Hráč nesmí editovat bestie token (není owner). Red-team `[auto]` | `OW` | M8 | ⬜ |
| MA-13 | Token modal varianty (paměť: PC/NPC/Bestie × pj/owner/limited). Ověřit, že `limited` view neukáže hráči PJ-only data (notes, skryté HP) `[auto]` | `LK` | M1 | ⬜ |

---

## D. Logy scény & světa (`PA` `EN`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| MA-14 | `assertCanReadSceneLog` ([:274]) = role>=**PomocnyPJ(4)**; `assertCanReadWorldLog` ([:304]) = PomocnyPJ+. Hráč → 403 (operation log je staff-only) `[auto]` | `PA` | M4 | ⬜ |
| MA-15 | FE — operation log UI jen PomocnyPJ+. Ověřit, že hráč log nevidí (jinak BE 403/prázdno) `[auto]` | `PA` | M1 | ⬜ |
| MA-16 | **N-25 regrese:** `diceRolls` v `toEntity` mapperu (DD: repo mapper) — log hodů přežije reload. Ne role bug, ale ověřit, že dice log respektuje scene read access `[auto]` | `DD` | M1 | ⬜ |

---

## E. FE gating parita (`PA` `OR`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| MA-17 | `useTokenPermissions` ([useTokenPermissions.ts:20]) — vrací `(token) => boolean` „smí hráč hýbat?". Musí kombinovat: owner && !isLocked && pole ∈ allowedPlayerFields. Parita s BE `assertCanDo` (1:1) `[auto]` | `PA` `OW` `ST` | M2 | ⬜ |
| MA-18 | `InitiativeBar` ([InitiativeBar.tsx]) posílá `initiative` operaci. Musí být v `allowedPlayerFields` (N-26). Ověřit, že FE neposílá pole, co BE odmítne `[auto]` | `OR` | M2 | ⬜ |
| MA-19 | Spawn entity (paměť: spawn-by-cursor, drag&drop) — kdo smí spawnovat? PJ/PomocnyPJ. Hráč nespawnuje. Ověřit gating spawn UI `[auto]` | `PA` | M1 | ⬜ |

---

## F. Dungeon-maps (`PA`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| MA-20 | `dungeon-maps.assertCanManage` ([:27]) = role>=PJ(5). Ověřit, že builder UI je PJ-only `[auto]` | `PA` | M4 | ⬜ |

---

## G. Matice persona × akce (mapa)

| Akce / persona | guest | Zadatel | Ctenar | Hrac | Korektor | PomocnyPJ | PJ | GlobalAdmin |
|---|---|---|---|---|---|---|---|---|
| číst přidělenou scénu | 🚫 | ⛔ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| hýbat **vlastním** tokenem | — | — | ✅ˢ | ✅ˢ | ✅ˢ | ✅ | ✅ | ✅ |
| měnit `currentHp/injury/initiative` vlastní | — | — | ✅ᶠˢ | ✅ᶠˢ | ✅ᶠˢ | ✅ | ✅ | ✅ |
| měnit `name/image/size` tokenu | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| hýbat **cizím** tokenem | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| globální operace (fog/scene) | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| create/edit scénu | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| číst operation log | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| spawn entity | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |

`ˢ`=jen odemčený (isLocked blokuje), `ᶠ`=jen pole z allowedPlayerFields, `ᵒ`=jen vlastní.

> **Delta parity (mapa):**
> - MA-06/18 `allowedPlayerFields` ↔ FE InitiativeBar — **✅** (N-26), potvrdit seznam 1:1
> - MA-07 isLocked vlastní token — **✅** (N-29), potvrdit red-team
> - MA-08 pole mimo seznam — **⚠️ red-team** (name/image na vlastním tokenu)
> - MA-09 cizí token — **⚠️ red-team** (ownership)
> - MA-17 useTokenPermissions ↔ assertCanDo — **kontraktní parita** (1:1 kombinace)
> - ostatní → vyplnit.

---

## Test coverage gaps

- `operations-authorizer` — kompletní matice: pole × isLocked × ownership × role (P1). Klíčové.
- Red-team M8: pole mimo allowedPlayerFields (MA-08), cizí token (MA-09), zamčený vlastní (MA-07).
- FE `useTokenPermissions` ↔ BE `assertCanDo` kontraktní test (drift = N-26/N-29 třída).
- Per-scéna HP visibility (MA-11) — skryté HP neteče hráči.

---

## Známá rizika

- **RMA-1 (`ES`/MA-08)** — **nejkritičtější:** pokud BE `assertCanDo` jen ověří „je owner", ale
  nezkontroluje **které pole** operace mění, hráč přepíše `name`/`image`/cokoli vlastního tokenu mimo
  `allowedPlayerFields`. FE to neukáže → tichá field-level eskalace. Red-team povinný.
- **RMA-2 (`ST`/MA-07)** — isLocked: N-29 fix musí držet pro **vlastní** token (ne jen cizí). Ověřit,
  že ownership větev nepřebije lock check.
- **RMA-3 (`PA`/MA-17)** — `useTokenPermissions` musí být **přesná kopie** logiky `assertCanDo`. Každý
  drift = buď hráč vidí akci co nejde (OR), nebo FE pustí operaci co BE odmítne (zbytečné 403).
