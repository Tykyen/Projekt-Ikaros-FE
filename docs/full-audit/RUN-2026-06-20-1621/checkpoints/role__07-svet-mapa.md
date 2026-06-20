# role / 07-svet-mapa — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem vyčerpávajícím statickým čtením (M1/M2) všechny soubory záběru:

**BE:**
- `maps.controller.ts` — všechny endpointy, guardy, auth flow
- `maps.service.ts` — `assertCanManage`, `assertStaff`, `findActiveForUser`, `enrichTokens`
- `operations-authorizer.service.ts` — `assertCanDo`, `assertCanDoWorldOp`, `assertCanReadScene`, `assertCanReadSceneLog`, `assertCanReadWorldLog`
- `world-operations.controller.ts` — cross-scene ops
- `maps.gateway.ts` — `map:join`, `map:join-world`, `map:spotlight` WS handlers
- `dungeon-maps.service.ts` / `dungeon-maps.controller.ts` — `assertCanManage` PJ(5)
- `map-operations.service.ts` — orchestrátor

**FE:**
- `TacticalMapView.tsx` — `isPJ`, `isGlobalAdmin`, `canDrag`, `deletable`, spawn, fog, effect, remove token
- `useTokenPermissions.ts` — `canDrag` hook (FE mirror BE)
- `InitiativeBar.tsx` — `canEditInit` logika
- `useTokenUpdate.ts` — `token.update` mutation
- `MapPjPanel.tsx` — `isPjStrict`, scene-create gating R-17
- `TokenHpBar.tsx` / `TokenSprite.tsx` — HP viditelnost (`showHp*` config flags)

## Dosažená L vs cílová L

| Oblast | Cílová L | Dosaženo | Poznámka |
|---|---|---|---|
| MA-01 `assertCanManage` | L2 | **L2** | PJ(5) server-side ✅; FE R-17 zarovnáno |
| MA-02 `assertCanReadScene` | L2 | **L2** | `assertCanReadScene` v `GET /maps/:id` ✅ |
| MA-03 per-player scene assignment | L2 | **L2** | `findActiveForUser` → `currentSceneId` ✅ |
| MA-04 assign = PJ | L2 | **L2** | `assertCanDoWorldOp` member.assign → PomocnyPJ+ ✅ |
| MA-05 `assertCanDo` ownership | L2 | **L2** | `token.characterId !== user.id` → 403 ✅ |
| MA-06 N-26 allowedPlayerFields | L2 | **L2** | `{currentHp, injury, initiative}` ✅ |
| MA-07 N-29 isLocked vlastní token | L2 | **L2** | `token.isLocked` check před field gate ✅ |
| MA-08 red-team pole mimo set | L4 | **L2** | staticky OK; `[auto]` L4 = PROOF-REQUEST |
| MA-09 red-team cizí token | L4 | **L2** | staticky OK; `[auto]` L4 = PROOF-REQUEST |
| MA-10 `assertCanDoWorldOp` | L2 | **L2** | PomocnyPJ+ pro ops; self-unassign výjimka ✅ |
| MA-11 HP visibility | L1 | **L1** | D-MAP-D dluh: `enrichTokens` posílá HP všem bez role-filtru; FE `showHp*` jsou jen config vlaječky, ne role gate — BE neskryje HP pro neoprávněnou roli; **nový nález** |
| MA-12 bestie ownership | L2 | **L2** | `token.characterId !== user.id` → bestie nemá `characterId=userId` → OK ✅ |
| MA-13 token modal limited view | L1 | **L1** | FE `deletable`=PomocnyPJ+; `editable`=canDrag → **parity drift** oproti BE |
| MA-14 `assertCanReadSceneLog` | L2 | **L2** | hráč na vlastní scéně OK; bez currentSceneId → 403 ✅ |
| MA-15 FE operation log UI | L1 | **L1** | neověřeno z FE gating — PROOF-REQUEST |
| MA-16 N-25 dice log | L2 | **L2** | dice log je součástí operation log; `assertCanReadSceneLog` gatuje |
| MA-17 `useTokenPermissions` parita | L2 | **L2 (s nálezem)** | viz R-RUN-01 |
| MA-18 InitiativeBar FE pošle `initiative` | L2 | **L2** | `canEditInit` = isPj OR mySlug; posílá jen init → BE pole OK ✅ |
| MA-19 spawn gating | L2 | **L2** | `handleViewportDragOver/Drop` gatuje `!isPJ → return`; placement mode = PJ ✅ |
| MA-20 dungeon-maps PJ(5) | L2 | **L2** | `assertCanManage` PJ(5) ✅; R-12 opraveno |
| WS `map:join` | L2 | **L2 (s nálezem)** | viz R-RUN-03 |
| WS `map:join-world` | L2 | **L2 (s nálezem)** | viz R-RUN-02 |

## Nálezy

### R-RUN-01 — FE `token.remove` viditelné hráči (deletable ↔ BE token.remove asymetrie) · `OR` · 🆕

**Kde:** `TacticalMapView.tsx:1355–1357` (`deletable = isGlobalAdmin || PomocnyPJ+`) vs `operations-authorizer.service.ts:104–118` (`token.remove` case: owner check → hráč SMÍ smazat vlastní token).

**Popis:** BE `assertCanDo` povoluje hráči operaci `token.remove` na vlastním tokenu (case na řádku 104–118: jen ownership check + žádný isLocked check). FE naopak skrývá tlačítko „Odstranit z mapy" zcela před hráčem (`deletable = isGlobalAdmin || PomocnyPJ+`). Hráč tedy vidí mapu, vidí svůj token, ale nemá tlačítko na smazání — přestože BE ho pustí.

**Dopad:** `OR` over-restrikce — hráč nemá v UI způsob smazat vlastní token z mapy, ale BE by ho pustil (není to bezpečnostní díra, ale herní feature gap). Matice má `token.remove` pro hráče jako `⛔` (matice sekce G — „Akce / persona" řádek „hráč", sloupec token-remove není definován), takže pokud záměr je „jen PJ může smazat token", pak BE je uvolněnější než spec. Pokud záměr je „hráč smí smazat vlastní token", pak FE blocker.

**Riziko:** Latentní — hráč může poslat ruční API request a token smazat (BE pustí). Není to exploitovatelné útočně, ale jde o nekonzistenci spec/FE/BE.

**Návrh:** Ujasnit záměr: (a) hráč nesmí smazat vlastní token → BE přidat strop (token.remove = PomocnyPJ+), (b) hráč smí → FE odblokovat `deletable` pro vlastní token. Doporučuji (a) — smazání tokenu by mělo být PJ privilegium.

- **Soubor:** `TacticalMapView.tsx:1355` · `operations-authorizer.service.ts:104-118`
- **Dopad:** 🟡 nízká (OR — ne bezpečnostní)
- **L1** staticky

---

### R-RUN-02 — WS `map:join-world` vyžaduje PJ(5), `assertCanDoWorldOp`/log vyžaduje PomocnyPJ(4) — práh drift · `EN` · 🆕

**Kde:** `maps.gateway.ts:157` (`membership.role < WorldRole.PJ`) vs `operations-authorizer.service.ts:215` (`membership.role >= WorldRole.PomocnyPJ`) a `assertCanReadWorldLog:313` (`membership.role < WorldRole.PomocnyPJ → 403`).

**Popis:** WS `map:join-world` handler join room `world-ops:{worldId}` gatuje na `PJ(5)`. Ale `assertCanDoWorldOp` (cross-scene ops) dovoluje `PomocnyPJ(4)+`. Výsledek: PomocnyPJ může posílat cross-scene operace přes REST (`POST /worlds/:id/operations`), ale **nedostane** příslušné WS eventy (`world:operation`) protože není v `world-ops:` roomu. PJ orchestrátor panel pro PomocnyPJ tedy funguje na REST (create/switch scény), ale real-time update cross-scene změn mu nedorazí (musí refresh).

**Dopad:** 🟠 střední — `OR` paritní problém pro PomocnyPJ. Ne bezpečnostní leak, ale real-time UX bloker: PomocnyPJ vidí PJ panel, dělá operace, ale WS eventy (od jiného PJ nebo od sebe samého přes backend) mu nepřijdou. Pravděpodobně přehlédnutý edge case (join-world vznikl pro PJ panel, PomocnyPJ přidán do operations API ale WS handler ne).

**Návrh:** V `maps.gateway.ts` handler `map:join-world` změnit práh z `WorldRole.PJ` na `WorldRole.PomocnyPJ`.

- **Soubor:** `maps.gateway.ts:157` · `operations-authorizer.service.ts:215`
- **Dopad:** 🟠 střední (UX bloker pro PomocnyPJ na WS)
- **L2** staticky

---

### R-RUN-03 — WS `map:join` nekontroluje `currentSceneId` (hra:člen může join cizí scene room) · `OW` `PC` · 🆕

**Kde:** `maps.gateway.ts:101-131` (handleJoin) vs `operations-authorizer.service.ts:242-264` (`assertCanReadScene` — hráč jen pokud `currentSceneId === scene.id`).

**Popis:** REST `GET /maps/:id` volá `assertCanReadScene` — hráč dostane 403 pokud `currentSceneId` nesedí. Ale WS `map:join` kontroluje jen membership ve světě (`findByUserAndWorld !== null`), ne `currentSceneId`. Hráč z jiné (nebo žádné) scény může emitovat `map:join <sceneId>` a join room cizí scény → bude dostávat real-time `map:operation` eventy (pohyby tokenů, fog změny, hp update, dice logy) cizí scény.

**Dopad:** 🟠 střední — P2 path-consistency leak. Hráč může číst real-time stav scény, kam nebyl přiřazen (alternativní WS dveře vs REST gate). Ne přímý secret dump (nemá REST přístup), ale živý WS stream. Zneužití vyžaduje znalost sceneId (člen může sceneId uhodnout z URL nebo z předchozí scény).

**Návrh:** V `map:join` handler doplnit obdobný check jako `assertCanReadScene`: PomocnyPJ+ projde vždy; Hráč jen pokud `membership.currentSceneId === sceneId`. Stejný vzor jako `assertCanReadScene`.

- **Soubor:** `maps.gateway.ts:101-131`
- **Dopad:** 🟠 střední (PC leak — WS join bez scene-assignment check)
- **L2** staticky

---

### R-RUN-04 — HP `enrichTokens` posílá HP všem bez role-filtru (D-MAP-D dluh potvrzen) · `LK` · ♻️

**Kde:** `maps.service.ts:344-397` (`enrichTokens` — vrací `customData/diaryData` každému klientovi bez ohledu na roli); `TokenSprite.tsx:484-489` (`showHp*` flags = config scény, nastavují viditelnost HP baru, ale data jsou v payload).

**Popis:** D-MAP-D ze starého auditu potvrzen kódem: `enrichTokens` přidá do tokenu `characterData.customData` (PC/NPC HP) a `characterData.diaryData` pro VŠECHNY klienty bez role-filtru. FE pak viditelnost HP baru řeší jen přes `showHpPc/Npc/Bestie` config flag — ale data jsou stále v response. Hráč, který pošle raw `GET /maps/:id`, dostane HP PC kolegů i NPC (pokud mu PJ vypnul HP bar UI).

**Dopad:** 🟡 nízká (záměrný dluh D-MAP-D, ne nová bezpečnostní díra; PJ config `showHp*` je jen UI hint, ne access gate). Reálný exploit: hráč čte HP nepřátel z API i když PJ „skryl" HP bar.

**Návrh:** Pokud záměr je hide HP pro hráče, musí se filtrace provést v BE `enrichTokens` na základě role a config. Zatím dluh.

- **Soubor:** `maps.service.ts:373-397` · `TokenSprite.tsx:484-489`
- **Dopad:** 🟡 nízká (pre-existing dluh D-MAP-D)
- **L1** staticky

---

### ✅ Ověřeno bez díry

- MA-01 `assertCanManage` = PJ(5): `maps.service.ts:43-53` ✅ L2
- MA-02 `assertCanReadScene` + `GET /maps/:id` guard: `maps.controller.ts:96-108` ✅ L2
- MA-03 per-player assignment: `findActiveForUser` → `currentSceneId` L2 ✅
- MA-04 assign = PomocnyPJ+, jen self-unassign pro hráče ✅ L2
- MA-05 ownership: `token.characterId !== user.id` → 403 ✅ L2
- MA-06 N-26 `allowedPlayerFields = {currentHp, injury, initiative}` ✅ L2
- MA-07 N-29 `token.isLocked` blokuje i vlastní token ✅ L2
- MA-08 pole mimo set → `forbidden.filter(k => !set.has(k))` → 403 ✅ L2 (staticky; L4 = PROOF-REQUEST)
- MA-09 cizí token → ownership check ✅ L2 (staticky; L4 = PROOF-REQUEST)
- MA-10 `assertCanDoWorldOp` fog/scene = PomocnyPJ+ ✅ L2
- MA-12 bestie token = vlastník=PJ (žádný `characterId=userId`) ✅ L2
- MA-14 `assertCanReadSceneLog` = hráč na své scéně ✅ L2
- MA-16 dice log přes operation log ✅ L2
- MA-18 `InitiativeBar` → `canEditInit` = isPj OR mySlug; jen `{initiative: value}` patch ✅ L2
- MA-19 spawn = jen PJ (handleViewportDragOver/Drop gate) ✅ L2
- MA-20 dungeon-maps PJ(5): `assertCanManage` ✅ L2 (R-12 opraveno)
- MA-17 `useTokenPermissions`: owner + !isLocked + !effectiveLocked + scene-combat gate → odpovídá BE (s výjimkou R-RUN-01 token.remove)
- Deprecated endpointy `PATCH move-token/remove-token`: FE je nepoužívá (operations API) ✅

## PROOF-REQUEST

### PR-MA-01 — Red-team MA-08: pole mimo allowedPlayerFields na vlastním tokenu
**Co spustit:** POST `/maps/:id/operations` s JWT hráče-ownera + op `{type:"token.update", tokenId:"...", patch:{name:"exploit"}}`.  
**Očekávaný výsledek:** 403 MAP_OP_FORBIDDEN.  
**Proč nestačí statika:** staticky vidím guard (`forbidden.filter`) a je správně, ale red-team ověří, že patch DTO nezahazuje extra klíče dříve než authorizer.  
**Dokazuje:** MA-08 L4 (kritická hrana RMA-1).

### PR-MA-02 — Red-team MA-09: pohyb cizím tokenem
**Co spustit:** POST `/maps/:id/operations` s JWT hráče A + op `{type:"token.move", tokenId:"<token_hraceB>", ...}`.  
**Očekávaný výsledek:** 403 MAP_OP_FORBIDDEN.  
**Dokazuje:** MA-09 L4 (ownership OW).

### PR-MA-03 — Red-team MA-07: operace na zamčeném vlastním tokenu
**Co spustit:** PJ zamkne token (`isLocked=true`), pak hráč-owner pošle `token.update` + `{currentHp: 5}`.  
**Očekávaný výsledek:** 403 MAP_OP_FORBIDDEN (token je zamčen, N-29).  
**Dokazuje:** MA-07 L4.

### PR-MA-04 — WS `map:join` scene-assignment bypass (R-RUN-03)
**Co spustit:** hráč přiřazený na scénu A emituje `map:join <sceneId_B>` přes socket.io.  
**Očekávaný výsledek:** `error` event MAP_FORBIDDEN.  
**Aktuálně:** pravděpodobně join projde (membership check OK, currentSceneId se nekontroluje).  
**Dokazuje:** R-RUN-03 L4.

### PR-MA-05 — PomocnyPJ nedostane WS `world:operation` (R-RUN-02)
**Co spustit:** PomocnyPJ emituje `map:join-world <worldId>`.  
**Očekávaný výsledek:** `error` MAP_FORBIDDEN (aktuální gate PJ(5)).  
**Dokazuje:** R-RUN-02 L4 (PomocnyPJ je blokován z WS, i když REST pustí).
