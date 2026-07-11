# role · 07-svet-mapa — checkpoint

**Dosažená L: L2** (statické čtení obou stran FE+BE, kontraktní parita; bez M8 red-team exekuce a bez M7 gap-fill testu).
**Cílová L:** role body L2+, bezpečnostní osy (`ST`/`OW`/`ES`) L3+, kritické hranice „FE schová → BE musí držet" přes M8 → L4.
**Záběr:** BE `maps` (controller/service/gateway/operations-authorizer/map-operations/world-operations), `dungeon-maps`; FE `tactical-map` (useTokenPermissions, InitiativeBar, MapPjPanel).

---

## 🆕 NOVÉ nálezy

### R-RUN-07-01 🆕 🔴 — `token.move` NEkontroluje per-token `isLocked` (D-066) → FE gating se obejde ruční operací
- **[osa]** `ST` `OW`-scoped · parita (FE schová → BE nedrží)
- **Kde:** BE [operations-authorizer.service.ts:83-109](../../../../Projekt-ikaros/backend/src/modules/maps/operations/operations-authorizer.service.ts#L83) — větev `case 'token.move'`. Ověří ownership (`:91` `token.characterId !== user.id`) a **efektivní scéna/hráč zámek** (`:99-101` `playerStates.isLocked ?? scene.isLocked`), ale **NEkontroluje `token.isLocked`** (per-token D-066 lock). Kontrast: větev `token.update` per-token lock kontroluje ([:142-147](../../../../Projekt-ikaros/backend/src/modules/maps/operations/operations-authorizer.service.ts#L142)).
  - Druhé dveře: DEPRECATED [maps.service.ts:267-317](../../../../Projekt-ikaros/backend/src/modules/maps/maps.service.ts#L289) `moveToken` — jen ownership (`:289`), žádný lock check.
  - Kontrakt: interface [map-scene.interface.ts:126-128](../../../../Projekt-ikaros/backend/src/modules/maps/interfaces/map-scene.interface.ts#L126) explicitně: „D-066 — per-token lock (PJ-only). **Zamčený token hráč nemůže táhnout**, nezávisle na scene.isLocked / playerStates."
  - FE tuto hranu drží: [useTokenPermissions.ts:31](../../../../Projekt-ikaros-FE/src/features/world/tactical-map/hooks/useTokenPermissions.ts#L31) `if (token.isLocked && !isPj && !isGlobalAdmin) return false` (canDrag) — FE zamčený token nepustí, BE ano.
- **Dopad:** Hráč pohne **vlastním per-token-zamčeným** tokenem přes ruční `POST /maps/:id/operations {type:'token.move'}` (nebo legacy `PATCH /maps/:id/move-token`). Per-token lock je PJ nástroj pro „přišpendlení" tokenu (paralýza/hold/past/cutscene) — hráč ho obejde. Třída MA-07/D-066 (isLocked), ale MA-07 byl ověřen (✅L2) jen na **UPDATE** cestě; **MOVE cesta zůstala bez kontroly**. Hráč zámek nemusí ani sundat (`isLocked` není v `allowedPlayerFields` → update 403), stačí přímo move.
- **Návrh:** do `token.move` (i legacy `moveToken`) přidat `if (token.isLocked) throw MAP_OP_FORBIDDEN` (před/vedle effLocked). Sjednotit s `token.update`. Red-team M8: hráč → move na vlastní `isLocked:true` token → 403.
- **L:** L2 (kontrakt přečten obě strany; chybí M8/M7).

### R-RUN-07-02 🆕 🟠 — `token.update` NEkontroluje scéna/hráč `effLocked` (asymetrie proti `token.move`)
- **[osa]** `ST`
- **Kde:** [operations-authorizer.service.ts:126-165](../../../../Projekt-ikaros/backend/src/modules/maps/operations/operations-authorizer.service.ts#L126) `case 'token.update'` kontroluje **jen** per-token `token.isLocked` (`:142`), **ne** efektivní scéna/hráč zámek (`playerStates.isLocked ?? scene.isLocked`), který `token.move` naopak kontroluje. Přesně obrácená mezera než R-RUN-07-01.
- **Dopad:** Když PJ zamkne **celou scénu** (`scene.isLocked`) nebo **konkrétního hráče** (`playerStates.isLocked`), hráč pořád může editovat `currentHp`/`injury`/`initiative` vlastního tokenu (per-token lock není nastaven). P1 sub-matice v plánu (07 ř.43-46) přitom značí tato pole `⛔ˢ` (blokuje stav) i ve sloupci „owner-hráč (zamčený)". FE `useTokenPermissions.canDrag` effLocked drží ([:33](../../../../Projekt-ikaros-FE/src/features/world/tactical-map/hooks/useTokenPermissions.ts#L33)), ale HP/initiative edit jde jinou cestou (InitiativeBar/token modal), která zámek nekontroluje (viz R-RUN-07-04).
- **PROOF-REQUEST:** ujasnit sémantiku — má scéna/hráč `isLocked` mrazit i HP/initiative (pak doplnit effLocked do `token.update`), nebo je scéna-lock **jen** zámek pohybu a HP mrazí výhradně per-token lock (pak opravit P1 sub-matici v plánu, ať neznačí ⛔ˢ)? Rozhoduje, zda je to bug (BE) nebo doc-fix (plán).
- **L:** L2.

### R-RUN-07-03 🆕 🟡 — `token.remove` (hráč, vlastní token) NEkontroluje ani jeden zámek
- **[osa]** `ST`
- **Kde:** [operations-authorizer.service.ts:110-125](../../../../Projekt-ikaros/backend/src/modules/maps/operations/operations-authorizer.service.ts#L110) `case 'token.remove'` = pouze ownership; žádný `effLocked` ani `token.isLocked`. Druhé dveře: legacy [maps.service.ts:319-354](../../../../Projekt-ikaros/backend/src/modules/maps/maps.service.ts#L340) `removeToken` — taky jen ownership.
- **Dopad:** Na zamčené scéně / u per-token-zamčeného **vlastního** tokenu ho hráč přesto smaže z desky. Jen vlastní token (ownership drží) → nízká závažnost, ale nekonzistence s intencí zámku „deska zamrzlá". Move/update zámek (částečně) řeší, remove ne vůbec.
- **Návrh:** aplikovat stejný lock gate (effLocked + token.isLocked) i na `token.remove` — sjednotit tři token větve na jeden lock predikát.
- **L:** L2.

### R-RUN-07-04 🆕 🟡 — FE `InitiativeBar.canEditInit` nekontroluje zámek (nekonzistence s `canDrag`) → zbytečné 403
- **[osa]** `OR` · parita
- **Kde:** FE [InitiativeBar.tsx:111-112](../../../../Projekt-ikaros-FE/src/features/world/tactical-map/components/initiative/InitiativeBar.tsx#L111) `canEditInit = isPj || myCharacterSlugs.includes(token.characterSlug)` — jen ownership, **žádný** `isLocked`/`effectiveLocked`. Přitom sesterský [useTokenPermissions.ts:31,33](../../../../Projekt-ikaros-FE/src/features/world/tactical-map/hooks/useTokenPermissions.ts#L31) (canDrag) oba zámky drží.
- **Dopad:** U **per-token-zamčeného** vlastního PC lišta nabídne edit iniciativy → BE `token.update` odmítne 403 (`token.isLocked`, [:142](../../../../Projekt-ikaros/backend/src/modules/maps/operations/operations-authorizer.service.ts#L142)) → zbytečná chyba (OR směr). FE má dvě odlišné parity vrstvy (canDrag přísný, canEditInit volný).
- **Návrh:** `canEditInit` doplnit o `!token.isLocked && !effectiveLocked(...)` (mirror canDrag). Váže se na rozhodnutí R-RUN-07-02 (effLocked ano/ne).
- **L:** L2.

---

## ♻️ ZNÁMÉ (nehlásím jako nové — evidováno)
- **MA-06/07/08/09** ✅L2 — `allowedPlayerFields` (currentHp/injury/initiative), per-token isLocked na **update**, pole mimo whitelist → 403, cizí token → 403. Kód potvrzen ([:142-163](../../../../Projekt-ikaros/backend/src/modules/maps/operations/operations-authorizer.service.ts#L142)). Pozn.: R-RUN-07-01/03 jsou **nepokryté cesty** téže třídy (move/remove), ne popření MA-07.
- **R-11** ✅ — `GET /maps` teď JWT+staff ([maps.controller.ts:59-72](../../../../Projekt-ikaros/backend/src/modules/maps/maps.controller.ts#L59), `assertStaff` [maps.service.ts:84-98](../../../../Projekt-ikaros/backend/src/modules/maps/maps.service.ts#L84)). Ověřeno drží.
- **R-12** ✅ — `dungeon-maps` read+write vše `assertCanManage` (PJ) ([dungeon-maps.service.ts:30-99](../../../../Projekt-ikaros/backend/src/modules/dungeon-maps/dungeon-maps.service.ts#L30)); class-guard JWT ([controller:38](../../../../Projekt-ikaros/backend/src/modules/dungeon-maps/dungeon-maps.controller.ts#L38)). MA-20 ✅.
- **R-13** ✅ — `world:operation` v PJ-only roomu `world-ops:{id}` ([maps.gateway.ts:188,331](../../../../Projekt-ikaros/backend/src/modules/maps/maps.gateway.ts#L188)); pomlčka rozbíjí generický `room:join`.
- **W-RUN-07-02 / R-RUN-02(6-20) / -03** ✅ — `map:join` gate = PomocnyPJ+ jinak jen `currentSceneId` ([maps.gateway.ts:133-144](../../../../Projekt-ikaros/backend/src/modules/maps/maps.gateway.ts#L133)); `map:ping`/`map:ruler` jen do vlastní scény (`client.rooms.has`); `map:spotlight` PJ-only.
- **D-MAP-D** (přijatý dluh) — `enrichTokens` ([maps.service.ts:386-439](../../../../Projekt-ikaros/backend/src/modules/maps/maps.service.ts#L386)) posílá HP (`customData`) všem; `config.showHpPc/Npc/Bestie` je jen FE-render toggle → skryté HP teče do raw API response hráči přiřazenému na scénu. MA-11/13 = známá chybějící featura, ne nový bug.
- **Combat turn-order** — `assertCanDo` nemá turn gate (hráč koná mimo tah přes API); FE `useTokenPermissions:35-42` gatuje. Už evidováno v **ext-46 game-integrity** (ř.11) jako herní-integrita, ne role. Cross-ref, nezdvojuji.

---

## Pokrytí (matice 07)
- **A. Scéna správa/čtení** (MA-01..04): assertCanManage=PJ ([maps.service.ts:48-76](../../../../Projekt-ikaros/backend/src/modules/maps/maps.service.ts#L48)), assertCanReadScene=member+currentSceneId ([authorizer:277-299](../../../../Projekt-ikaros/backend/src/modules/maps/operations/operations-authorizer.service.ts#L277)), assign=assertCanDoWorldOp PJ-only+self-unassign ([:229-260](../../../../Projekt-ikaros/backend/src/modules/maps/operations/operations-authorizer.service.ts#L229)). ✅ drží.
- **B. Token ops field/state/ownership** (MA-05..10): pokryto výše; R-RUN-07-01/02/03 = mezery lock-checku. token.add/effect/fog/scene/combat → `default:` PJ-only ([:213-217](../../../../Projekt-ikaros/backend/src/modules/maps/operations/operations-authorizer.service.ts#L213)) ✅. worldOp PJ-only ✅.
- **C. HP & viditelnost** (MA-11..13): D-MAP-D známé.
- **D. Logy** (MA-14..16): assertCanReadSceneLog=member+currentSceneId ([:309-331](../../../../Projekt-ikaros/backend/src/modules/maps/operations/operations-authorizer.service.ts#L309)), assertCanReadWorldLog=PomocnyPJ+ ([:339-354](../../../../Projekt-ikaros/backend/src/modules/maps/operations/operations-authorizer.service.ts#L339)) ✅.
- **E. FE parita** (MA-17..19): useTokenPermissions vs assertCanDo — drift v lock-checku (R-RUN-07-01 BE chybí per-token na move; R-RUN-07-04 FE canEditInit bez zámku). Spawn (token.add) PJ-only BE ✅ + FE `isPjStrict` gate ([MapPjPanel.tsx:146,307](../../../../Projekt-ikaros-FE/src/features/world/tactical-map/components/pj-panel/MapPjPanel.tsx#L146)). InitiativeBar posílá `initiative` ∈ allowedPlayerFields ✅ (N-26).
- **F. Dungeon-maps** (MA-20): ✅ (viz R-12).
- **G. Matice persona×akce:** buňky konzistentní s kódem kromě lock-sloupců (R-RUN-07-01..03).

## PROOF-REQUESTy
1. **M8 red-team** (R-RUN-07-01): hráč → `token.move` na vlastní `isLocked:true` token → očekávané 403; dnes projde. + legacy `PATCH /maps/:id/move-token`. → L4.
2. **M8 red-team** (R-RUN-07-03): hráč → `token.remove` na vlastní token na `scene.isLocked` scéně.
3. **Sémantika (R-RUN-07-02):** rozhodnout scéna/hráč `isLocked` = mrazí i HP/initiative? (bug BE vs doc-fix plán + FE canEditInit).
4. **M7 gap-fill:** kontraktní test useTokenPermissions ↔ assertCanDo (lock × ownership × pole) — dnes žádný, drift = N-26/N-29 třída.
