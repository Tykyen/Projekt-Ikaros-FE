# 11 — Svět: taktická mapa

Taktická mapa je PIXI.js v8 hex-grid canvas s Operations API (seqNumber-based), real-time WS brodcastem, combat trackerem, fog of war, tokenovým systémem (PC/NPC/bestie) a overlayemi (počasí, notebook, zvuk, kostky). Pokrývá BE moduly `maps` a `dungeon-maps` a FE `features/world/tactical-map/`.

**BE:** `maps` (scény, tokeny, operations, fog, combat, library templates), `dungeon-maps` (knihovna map/dungeon builder)
**FE:** `features/world/tactical-map` (TacticalMapView, MapBackground, TokenLayer, FogLayer, EffectsLayer, PingsLayer, InitiativeBar, hooky useMapScene/useMapSocket/useCombat/useMapWeather/usePlacementMode/useViewportPanZoom/useTokenTexture, token-panel BestiePanelView + system-panels, weather, notebook, sound, schemas), `MapPage`, `TacticalMapPage`, `admin/DungeonBuilderPage`

**Routy:** `/svet/:slug/mapa`, `/takticka-mapa`, `/admin/dungeon-builder`

---

## A. Scény & per-player assignment

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SM-A01 | `GET /maps/active?worldId=` vrací scénu dle `WorldMembership.currentSceneId` (ne první `isActive`) `[auto]` | M1 | ⬜ |
| SM-A02 | Při `currentSceneId === null` / neexistující scéna vrací 404 `MAP_NO_ACTIVE_SCENE` `[auto]` | M1 | ⬜ |
| SM-A03 | `findActiveScenesByWorld` vrací všechny scény s `isActive=true` (víc najednou — ne jen první) `[auto]` | M1 | ⬜ |
| SM-A04 | `setActive` přidá `isActive: true` na cílovou scénu, ALE NEROZBÍJÍ ostatní aktivní scény (bug-fix comentár v kódu — uvolněná semantika) `[auto]` | M1 | ⬜ |
| SM-A05 | `scene.deactivate` cascade: všichni hráči s `currentSceneId === sceneId` dostanou `member.unassign` + `map:reassigned {newSceneId: null}` `[auto]` | M1 | ⬜ |
| SM-A06 | Hráč po `map:reassigned {newSceneId: null}` zobrazí `MapEmptyState` (invalidate query → 404 → null scene) `[auto]` | M5 | ⬜ |
| SM-A07 | PJ může pomocí `member.assignToScene` přiřadit konkrétního hráče na libovolnou aktivní scénu `[auto]` | M1 | ⬜ |
| SM-A08 | Hráč s `WorldRole.Hrac` nemůže provést `member.assignToScene` za jiného uživatele (jen self-unassign) `[auto]` | M4 | ⬜ |
| SM-A09 | `GET /maps/:id` pro hráče vrací 403 `MAP_FORBIDDEN_OTHER_SCENE` pokud `currentSceneId !== id` `[auto]` | M4 | ⬜ |
| SM-A10 | FE `ActiveScenesList` renderuje všechny aktivní scény a dovoluje PJ přiřadit k nim hráče `[human]` | M4 | ⬜ |
| SM-A11 | Per-player `playerStates` merge: `scene.playerState {isHidden: null}` smaže per-hráčský override (vrátí se na scéna-default) `[auto]` | M1 | ⬜ |
| SM-A12 | FE `effectiveHidden` / `effectiveLocked` čtou per-player override ?? scéna-default korektně (utils sceneAccess.ts) `[auto]` | M1 | ⬜ |
| SM-A13 | Hráč vidí `MapHiddenOverlay` pokud `effectiveHidden = true`; PJ scénu vidí vždy `[human]` | M4 | ⬜ |

---

## B. Tokeny (CRUD, whitelist mapper, spawn)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SM-B01 | `toToken` mapper mapuje pole `id`, `characterId`, `characterSlug`, `q`, `r`, `isNpc`, `templateId`, `instanceName` — round-trip bez ztráty `[auto]` | M2 | ⬜ |
| SM-B02 | `toToken` mapper mapuje `currentHp`, `maxHp`, `baseHp`, `armor`, `baseArmor`, `injury` — round-trip bez ztráty `[auto]` | M2 | ⬜ |
| SM-B03 | `toToken` mapper mapuje `initiative`, `initiativeBase`, `inCombat`, `movement` — round-trip bez ztráty `[auto]` | M2 | ⬜ |
| SM-B04 | `toToken` mapper mapuje `abilities: [{name, description}]` — round-trip bez ztráty `[auto]` | M2 | ⬜ |
| SM-B05 | `toToken` mapper mapuje `notes` (per-instance bestie poznámky) — D-066 pattern; GET po write nezahodí `[auto]` | M2 | ⬜ |
| SM-B06 | `toToken` mapper mapuje `isLocked` — D-066 field-drift fix; GET po write nezahodí zámek `[auto]` | M2 | ⬜ |
| SM-B07 | `toToken` mapper mapuje `systemStats` — write do Mixed projde, GET musí pole propustit `[auto]` | M2 | ⬜ |
| SM-B08 | `toToken` mapper mapuje `personalDiarySchema` a `customData` — round-trip bez ztráty `[auto]` | M2 | ⬜ |
| SM-B09 | `token.add` op: BE validuje `systemStats` přes `SystemStatsValidatorService` (soft mode — chybějící schema = skip) `[auto]` | M1 | ⬜ |
| SM-B10 | `token.add` op: BE vyplní default hodnoty z schématu (`result.filled`) pokud schema existuje `[auto]` | M1 | ⬜ |
| SM-B11 | `token.update` op: patch `systemStats` projde strict validací; neznámé klíče BE odmítne `[auto]` | M1 | ⬜ |
| SM-B12 | `token.update` op: hráč smí patchovat jen `currentHp` a `injury` vlastního tokenu `[auto]` | M4 | ⬜ |
| SM-B13 | `token.move` op: hráč nemůže pohnout tokenem jiného hráče `[auto]` | M4 | ⬜ |
| SM-B14 | `token.move` op: zamčená mapa (efektivní `isLocked` pro hráče) vrátí 403 `[auto]` | M4 | ⬜ |
| SM-B15 | `token.remove` op: hráč nemůže odebrat cizí token `[auto]` | M4 | ⬜ |
| SM-B16 | Spawn drag&drop: `screenToHex` převede drop souřadnice (clientX/Y) přesně na cílový hex — ne `(0,0)` `[human]` | M7 | ⬜ |
| SM-B17 | Spawn placement-mode: klik v paletě + klik na hex spawne token přesně na kliknutý hex (ne offset) `[human]` | M7 | ⬜ |
| SM-B18 | Spawn obsazený hex: `findFirstFreeHex` vrátí spirálový BFS nejbližší volný hex od cíle (ne auto `(0,0)`) `[auto]` | M1 | ⬜ |
| SM-B19 | `buildBestieToken` nastaví `abilities`, `notes`, `systemStats` ze snapshot bestie (nezávislá instance, ne ref) `[auto]` | M1 | ⬜ |
| SM-B20 | `buildPcToken` / `buildNpcToken` nastaví `characterId`, `characterSlug`, `isNpc` korektně `[auto]` | M1 | ⬜ |
| SM-B21 | `token.update` optimistic v `applyOperationToScene` patchuje token správně (shallow merge `...patch`) `[auto]` | M1 | ⬜ |
| SM-B22 | Per-scéna whitelist `activeCharacterIds` / `activeBestieIds`: palette zobrazí jen povolené entity `[human]` | M4 | ⬜ |
| SM-B23 | `scene.activeCharacters.add` / `.remove` jsou $addToSet / $pull idempotentní na BE `[auto]` | M1 | ⬜ |

---

## C. Fog of war

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SM-C01 | `fog.set` op persistuje `fogEnabled` + `revealedHexes`; round-trip z Mongo zachovává pole `[auto]` | M1 | ⬜ |
| SM-C02 | `fog.brush` reveal: `$addToSet` přidá jen nové hexy (idempotent); patcher FE zrcadlí chování `[auto]` | M1 | ⬜ |
| SM-C03 | `fog.brush` fog: `$pullAll` odebere hexy; patcher FE zrcadlí `[auto]` | M1 | ⬜ |
| SM-C04 | `fog.brush` inverse: opačný mode se stejnými hexy (přibližné undo) `[auto]` | M1 | ⬜ |
| SM-C05 | PJ vidí fog jako semi-transparent (theme `fogPjFill`); hráč jako opaque `[human]` | M7 | ⬜ |
| SM-C06 | NPC/bestie tokeny ukryté mlhou hráči nezobrazí (`isTokenHiddenByFog` + `isPJ` gate) `[auto]` | M1 | ⬜ |
| SM-C07 | PC tokeny automaticky odhalují hex pod sebou (`effectivelyRevealed` = revealedHexes ∪ PC hexes) `[auto]` | M1 | ⬜ |
| SM-C08 | Fog brush dedup: `lastFogHexRef` zabraňuje redundantnímu `fog.brush` na stejný hex při tažení `[auto]` | M1 | ⬜ |
| SM-C09 | `useFogTool` brushSize ovlivňuje `fogBrushHexes` — větší brush zasáhne víc hexů `[auto]` | M1 | ⬜ |
| SM-C10 | `scene.fog.replace` (load template) atomicky nahradí fog + revealedHexes; inverse zachová předchozí stav `[auto]` | M1 | ⬜ |
| SM-C11 | Fog maskovací vrstva (`FogLayer`) renderuje jen v rámci `mapBounds` pokud jsou k dispozici `[human]` | M7 | ⬜ |

---

## D. Combat tracker & iniciativa

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SM-D01 | `combat.start` validuje, že všechny `orderTokenIds` existují na scéně `[auto]` | M1 | ⬜ |
| SM-D02 | `combat.start` vyhodí `MAP_OP_PRECONDITION_FAILED` pokud boj už běží `[auto]` | M1 | ⬜ |
| SM-D03 | `combat.turn` s explicitním `tokenId`: token musí existovat na scéně (jinak 400) `[auto]` | M1 | ⬜ |
| SM-D04 | `combat.turn` wrap: pokud FE pošle `round+1`, BE uloží správné číslo kola `[auto]` | M1 | ⬜ |
| SM-D05 | `combat.end` vyhodí `MAP_OP_PRECONDITION_FAILED` pokud boj není aktivní `[auto]` | M1 | ⬜ |
| SM-D06 | `combat.reorder` validuje, že `orderTokenIds` je permutace stávajícího `combat.order` (stejná množina i délka) `[auto]` | M1 | ⬜ |
| SM-D07 | FE `useCombat` sortuje `combatants` živě dle `initiative` desc (NE `combat.order` snapshot) `[auto]` | M1 | ⬜ |
| SM-D08 | PC tokeny jsou v `combatants` vždy (bez ohledu na `inCombat`); NPC/bestie jen pokud `inCombat=true` `[auto]` | M1 | ⬜ |
| SM-D09 | `bench` obsahuje jen NPC/bestie s `inCombat=false` (PC tam nikdy nejsou) `[auto]` | M1 | ⬜ |
| SM-D10 | Nový token zařazený do boje (`inCombat=true`) se okamžitě objeví v `combatants` (živý sort) `[human]` | M5 | ⬜ |
| SM-D11 | `nextTurn()` posílá explicitní `tokenId` + `round` (wrap → `round+1`); FE řídí pořadí `[auto]` | M1 | ⬜ |
| SM-D12 | `jumpTo(tokenId)` pošle `combat.turn {tokenId, round: currentRound}` `[auto]` | M1 | ⬜ |
| SM-D13 | Iniciativní lišta: zvýraznění tokenu na řadě (`activeTurnTokenId`), spotlight ring (3 s TTL) `[human]` | M7 | ⬜ |
| SM-D14 | Spotlight WS event `map:spotlight`: PJ emituje, ostatní klienti dostávají — ephemeral ring 3 s `[auto]` | M5 | ⬜ |
| SM-D15 | Spotlight je PJ-only na BE (`WorldRole >= PomocnyPJ` check v gateway) `[auto]` | M4 | ⬜ |
| SM-D16 | `combat.effect.add` / `.remove` persistence: `endOfTurnEffects` v combat subdocu `[auto]` | M1 | ⬜ |
| SM-D17 | FE `applyOperationToScene` pro `combat.start` nastaví `order`, `round=1`, `currentTokenId=orderTokenIds[0]` `[auto]` | M1 | ⬜ |
| SM-D18 | Inverse `combat.start` → `combat.end`; inverse `combat.end` → `combat.start` s předchozím order (nebo null pokud order prázdný) `[auto]` | M1 | ⬜ |

---

## E. Token HP & token modal

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SM-E01 | Bestie HP čte `token.systemStats["health.current"]` / `["health.max"]` (ne deprecated `currentHp/maxHp`) `[auto]` | M1 | ⬜ |
| SM-E02 | PC/NPC HP čte z `token.characterData.customData` přes `resolveCharacterHp` (enrich z diary subdoc) `[auto]` | M1 | ⬜ |
| SM-E03 | `enrichTokens` v `MapsService` načte diary subdoc a doplní `customData` do `characterData` `[auto]` | M1 | ⬜ |
| SM-E04 | BC fallback v `BestiePanelView`: pokud `systemStats` prázdné, mapuje z fixed polí `currentHp/maxHp/armor/…` `[auto]` | M1 | ⬜ |
| SM-E05 | `health.current` BC normalizace: pokud chybí (staré snapshot), doplní z `health.max` / `currentHp` `[auto]` | M1 | ⬜ |
| SM-E06 | Per-scéna HP bar visibility: `scene.config.showHpPc/showHpNpc/showHpBestie` ovlivňuje render HP baru `[human]` | M7 | ⬜ |
| SM-E07 | Token modal: PC varianta zobrazí deník (DiaryTab) + poznámky (NotesTab) — embed reuse, ne kopie `[human]` | M4 | ⬜ |
| SM-E08 | Token modal: NPC varianta (isNpc=true, není bestie) zobrazí statblok NPC + poznámky `[human]` | M4 | ⬜ |
| SM-E09 | Token modal: bestie varianta (`templateId !== undefined`) zobrazí `BestiePanelView` `[human]` | M4 | ⬜ |
| SM-E10 | Token modal view mode: PJ = plný edit; owner (vlastní postava) = edit HP/injury; ostatní = read-only `[auto]` | M4 | ⬜ |
| SM-E11 | `BestiePanelView` save filtruje `systemStats` přes `systemEntitySchemaRegistry` — neznámé klíče se nepošlou (BE strict mode) `[auto]` | M1 | ⬜ |
| SM-E12 | Bestie `abilities` v tokenu = instance snapshot (ne read-only ref na šablonu); editovatelné nezávisle `[auto]` | M1 | ⬜ |
| SM-E13 | `token.update {notes}` write → GET round-trip zachová `notes` (M2 whitelist mapper test) `[auto]` | M2 | ⬜ |
| SM-E14 | `resolveTokenImage`: bestie bez `characterData` dotahuje obrázek z bestiar cache přes `templateId` `[auto]` | M1 | ⬜ |
| SM-E15 | System combat panels (CocCombatPanel, DndCombatPanel, Drd2CombatPanel, FateCombatPanel, GurpsCombatPanel, MatrixCombatPanel) čtou `systemStats` z tokenu a zobrazí správná pole dle systému `[auto]` | M1 | ⬜ |

---

## F. Weather / notebook / sound overlay na mapě

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SM-F01 | `useMapWeather` joinuje `world:{worldId}` room (přes `socket.emit("room:join", ...)`) — hráč dostává `weather:updated` event `[auto]` | M5 | ⬜ |
| SM-F02 | Po WS reconnectu `useMapWeather` re-joinuje `world:{worldId}` room (re-join v `onConnect` handleru) `[auto]` | M5 | ⬜ |
| SM-F03 | `weather:updated` patch World query cache správně pro `worldId === payload.worldId` `[auto]` | M5 | ⬜ |
| SM-F04 | `weather:updated {weather: null}` odstraní overlay (PJ vypnul počasí) `[auto]` | M5 | ⬜ |
| SM-F05 | Per-user `fxEnabled` toggle persistuje v localStorage (`ikr-map-weather-fx`) `[auto]` | M1 | ⬜ |
| SM-F06 | `MapWeatherAtmosphere` renderuje správný weather effect (déšť/sníh/mlha/bouřka) dle `weather.kind` `[human]` | M7 | ⬜ |
| SM-F07 | `MapWeatherPanel` je PJ-only (set/clear weather) — hráč vidí panel bez editace `[human]` | M4 | ⬜ |
| SM-F08 | BE `maps.gateway` emituje `weather:updated` do `world:{worldId}` room (přes `@OnEvent('weather.updated')`) `[auto]` | M5 | ⬜ |
| SM-F09 | `useMapWeather` rozlišuje `room:join` (přes neutrální handler, ne `map:join-world`) — všichni membři mohou dostávat počasí `[auto]` | M5 | ⬜ |
| SM-F10 | Notebook PJ: `useGmNotes` + `useUpdateGmNotes` čte/zapisuje per-PJ world GM notes `[human]` | M4 | ⬜ |
| SM-F11 | Notebook hráč: `useCharacterNotes` + `useUpdateCharacterNotes` čte/zapisuje notes postavy `[human]` | M4 | ⬜ |
| SM-F12 | `hasNotebook` = PJ nebo hráč s přiřazenou postavou (`playerSlug[0]`) — jinak tlačítko se nezobrazí `[auto]` | M1 | ⬜ |
| SM-F13 | Sound overlay: `sound.playlist` op nastaví `activeSoundIds`; `SceneSoundPlayer` přehraje zvuky `[human]` | M5 | ⬜ |
| SM-F14 | `AmbientSoundPanel` broadcast zvuku: optimistic apply + rollback při chybě (stejný pattern jako effectMutation) `[auto]` | M1 | ⬜ |
| SM-F15 | Zvuk přežije reconnect — `activeSoundIds` jsou součástí scény, takže catch-up je správný `[auto]` | M5 | ⬜ |

---

## G. Knihovna map & dungeon builder

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SM-G01 | `MapLibraryModal` list template: GET `/api/map-templates` vrací šablony dostupné PJ `[human]` | M4 | ⬜ |
| SM-G02 | Load template: sekvenční emitování 7 ops (`scene.image`, `scene.config`, `scene.fog.replace`, `scene.effects.replace`, `scene.npc-templates.replace`, `scene.tokens.replace-npc`, `scene.sounds.set`) `[auto]` | M1 | ⬜ |
| SM-G03 | Load template zachová PC tokeny (BE `scene.tokens.replace-npc` filtruje jen isNpc; PC zůstanou) `[auto]` | M1 | ⬜ |
| SM-G04 | Uložení aktuální scény jako template: POST `/api/map-templates` (bez PC tokenů) `[auto]` | M1 | ⬜ |
| SM-G05 | Smazání template: DELETE `/api/map-templates/:id` (jen PJ / Sa) `[auto]` | M4 | ⬜ |
| SM-G06 | `MapTemplate` `ownerId` = userId PJ, kteří šablonu vytvořili — cross-world (sdílené mezi světy) `[auto]` | M1 | ⬜ |
| SM-G07 | `DungeonBuilderPage` (`/admin/dungeon-builder`): CRUD dungeon-map (pouze Sa/Admin nebo PJ světa) `[human]` | M4 | ⬜ |
| SM-G08 | `dungeon-maps.service.assertCanManage` vyžaduje `WorldRole.PJ` (ne `PomocnyPJ`) — zkontroluj správnost prahu `[auto]` | M4 | ⬜ |
| SM-G09 | Export scene jako template: `DungeonMapsService.exportAsTemplate` vytvoří `MapTemplate` ze scene snapshot `[auto]` | M1 | ⬜ |
| SM-G10 | Export scene as template BC: PC tokeny jsou vyloučeny ze snapshot (server-side) `[auto]` | M1 | ⬜ |
| SM-G11 | Inverse `scene.fog.replace` zachová původní `fogEnabled` + `revealedHexes` (undo load template) `[auto]` | M1 | ⬜ |
| SM-G12 | `LoadPreparationDialog` (svět má uloženou přípravu): load aplikuje template sekvenci správně `[human]` | M7 | ⬜ |

---

## H. WS real-time & reconnect

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SM-H01 | `useMapSocket` emituje `map:join sceneId` při mountu (nebo při změně sceneId) `[auto]` | M5 | ⬜ |
| SM-H02 | `useMapSocket` emituje `map:leave sceneId` při unmountu (cleanup) `[auto]` | M5 | ⬜ |
| SM-H03 | Po WS reconnectu `useMapSocket` re-emituje `map:join sceneId` (`connect` event handler) `[auto]` | M5 | ⬜ |
| SM-H04 | Po WS reconnectu `useMapScene.onReconnect` spustí `catchUpScene` (forced catch-up) `[auto]` | M5 | ⬜ |
| SM-H05 | `catchUpScene`: pokud `gap > threshold` (too-big) → full refetch místo replay `[auto]` | M5 | ⬜ |
| SM-H06 | `map:operation` handler: seqNumber === expected → happy-path apply; seqNumber > expected → catch-up; seqNumber < expected → duplicate skip `[auto]` | M5 | ⬜ |
| SM-H07 | BE `map:join` handler validuje, že user je member daného světa (jinak `MAP_FORBIDDEN`) `[auto]` | M5 | ⬜ |
| SM-H08 | BE `map:join-world` handler validuje `WorldRole >= PomocnyPJ` (PJ-only room) `[auto]` | M5 | ⬜ |
| SM-H09 | BE `handleConnection` JWT validace: chybějící / neplatný token → `WS_UNAUTHORIZED` error, `data.user` zůstane undefined `[auto]` | M5 | ⬜ |
| SM-H10 | Legacy subscribe handlery (`map:token-moved`, `map:config-updated`, `map:fog-updated`, …) zachovány — paralelní emit pro přechodové FE klienty `[auto]` | M5 | ⬜ |
| SM-H11 | `map:operation` broadcast se emituje AŽ po DB commit (`atomicUpdate` + seqNumber allocate + log append) `[auto]` | M5 | ⬜ |
| SM-H12 | `emitReassigned` cílí room `user:{userId}` (private), ne broadcast scény `[auto]` | M5 | ⬜ |
| SM-H13 | `emitWorldOperation` cílí room `world:{worldId}` (PJ orchestrator panel) `[auto]` | M5 | ⬜ |
| SM-H14 | Weather event (`weather:updated`) jde do `world:{worldId}` room (všichni membři, ne jen PJ) — FE weather hook joinuje přes `room:join` (neutrální) `[auto]` | M5 | ⬜ |
| SM-H15 | `map:ping` broadcast: BE `handlePing` emituje `map:pinged` na room scény (všichni ji dostanou) `[auto]` | M5 | ⬜ |
| SM-H16 | FE double-tap detekce pinů: `isDoubleTap` dle timestamp + vzdálenost; ne `onDoubleClick` (nepolehlivý na touch) `[auto]` | M1 | ⬜ |
| SM-H17 | Dice roll WS: `map:dice-rolled` legacy handler i nový `dice.roll` op přes `map:operation` — oba zpracované bez duplikace `[auto]` | M5 | ⬜ |
| SM-H18 | `map:spotlight` requiruje auth (gateway `requireAuth` guard) — socket bez `data.user` dostane error `[auto]` | M5 | ⬜ |
| SM-H19 | WS reconnect re-join scenId a world room: `useMapSocket` drží sceneId join, `useMapWeather` drží world room join — oba hooky mají vlastní `connect` handler `[auto]` | M5 | ⬜ |
| SM-H20 | `map:reassigned` listener v `useReassignmentListener` a ZÁROVEŇ v `useMapSocket` — riziko double-registrace bez deduplikace; ověřit, že jeden handler invaliduje query jednou `[auto]` | M5 | ⬜ |

---

## I. PIXI async init & viewport

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SM-I01 | PIXI `<Application>` mountuje POUZE pokud `width > 0 && height > 0 && scene !== null` (async init race guard) `[auto]` | M1 | ⬜ |
| SM-I02 | Canvas resize: `app.renderer.resize(width, height)` voláno při každé změně `useViewportSize` (fullscreen / devtools) `[auto]` | M1 | ⬜ |
| SM-I03 | Auto-fit při fullscreenu: spustí se při každé změně rozměru viewportu pomocí `fitToViewport(mapBounds, width, height)` `[auto]` | M1 | ⬜ |
| SM-I04 | `extend({ Container, Graphics, Sprite, Text })` registruje všechny PIXI třídy použité v JSX `[auto]` | M1 | ⬜ |
| SM-I05 | Pan/zoom persistuje v localStorage (250ms debounce); per-scéna klíč dle `scene.id` `[auto]` | M1 | ⬜ |
| SM-I06 | Pointer events na `viewportRef`: wheel/pointerdown na element, pointermove/pointerup/cancel na window (continuous drag mimo viewport) `[auto]` | M1 | ⬜ |
| SM-I07 | `screenToMap` a `screenToHex` převody respektují aktuální `zoom`, `offsetX`, `offsetY` z `useViewportPanZoom` `[auto]` | M1 | ⬜ |
| SM-I08 | `useViewportPanZoom` suppressuje left-pan pokud `effectTool.activeTool !== null` nebo `placement.state.active` nebo `fogTool.active` `[auto]` | M1 | ⬜ |

---

## J. Operations API (seqNumber, inverse, undo)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SM-J01 | `seqNumber` se inkrementuje atomicky (`$inc` přes opsRepo) pouze po úspěšném DB apply `[auto]` | M1 | ⬜ |
| SM-J02 | Pokud `applyAtomic` vyhodí (kromě MAP_OP_NOOP), seqNumber se nealokuje (gap v sekvenci je akceptovaný) `[auto]` | M1 | ⬜ |
| SM-J03 | `applied: false` (MAP_OP_NOOP pro `scene.deactivate` na neaktivní scéně) vrací 200 bez log/broadcast `[auto]` | M1 | ⬜ |
| SM-J04 | Inverse pro `token.update`: staré hodnoty patchovaných klíčů z snapshotu (delta inverse, ne full replace) `[auto]` | M1 | ⬜ |
| SM-J05 | Inverse pro `scene.deactivate`: null (undo by potřeboval re-assign; post-MVP) — server to nenazývá chybou `[auto]` | M1 | ⬜ |
| SM-J06 | FE `applyOperationToScene` pokrývá VŠECHNY typy ops z `MapOperation` discriminated union (exhaustive check) `[auto]` | M1 | ⬜ |
| SM-J07 | FE patcher `effect.add` idempotentní: duplicate id → replace (WS broadcast TÉŽE optimistic op) `[auto]` | M1 | ⬜ |
| SM-J08 | FE patcher `dice.roll` idempotentní: duplicate roll.id → no-op (optimistic + WS broadcast dedup) `[auto]` | M1 | ⬜ |
| SM-J09 | `GET /maps/:id/operations?since=N` vrací správnou slice od `since+1` do `limit` `[auto]` | M1 | ⬜ |
| SM-J10 | Hráč nemůže GETnout operations jiné scény než vlastní `currentSceneId` (assertCanReadSceneLog) `[auto]` | M4 | ⬜ |

---

## K. Schema engine & multi-system

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SM-K01 | `systemEntitySchemaRegistry` na FE registruje schémata pro všechny systémy (drd2, coc, dnd5e, fate, gurps, matrix) `[auto]` | M1 | ⬜ |
| SM-K02 | `schema-registry.service.ts` na BE registruje `token` schema pro každý systém (soft mode — chybějící = skip) `[auto]` | M1 | ⬜ |
| SM-K03 | `system-stats-validator.service.ts`: `validateForCreate` vyplní defaults; `validateForPatch` je strict (neznámé klíče = chyba) `[auto]` | M1 | ⬜ |
| SM-K04 | `EntitySchemaForm` dynamicky renderuje pole dle per-system schema (sekce, field typy boolean/enum/number/text/computed/list) `[human]` | M7 | ⬜ |
| SM-K05 | `EntityStatbar` renderuje filled HP bary dle `showStatbar` konfigurace schématu `[human]` | M7 | ⬜ |
| SM-K06 | `ComputedField` vyhodnocuje formula výraz (`formula.ts`) dle jiných polí v `systemStats` `[auto]` | M1 | ⬜ |
| SM-K07 | Změna `world.system` přepíná schéma layoutu pro všechny tokeny; per-system panels renderují správná pole `[human]` | M7 | ⬜ |

---

## Test coverage gaps

- **PIXI/canvas render**: TokenLayer, HexGrid, MapBackground, FogLayer, EffectsLayer, PingsLayer — žádný automatický test (PIXI nezní v jsdom); jen manuální ověření.
- **PIXI async init race**: pouze komentář v kódu, žádný test; regression risk při upgradu @pixi/react.
- **A* pathfinding**: spec zmiňuje jako součást 9 principů, ale v kódu nenalezen `astar` modul — chybí implementace nebo test.
- **Undo stack FE**: Operations API vrací `inverse`; FE neimplementuje undo buffer / UI pro zpětkový hod — žádný test.
- **Sprite atlas**: spec princip č. 6; v kódu není implementace — chybí nebo odkládá.
- **WS reconnect E2E**: `useMapSocket` reconnect (re-join + catch-up) má unit test, ale žádný integrační test s reálným socket.io serverem.
- **Dungeon builder**: `DungeonBuilderPage` nemá spec test; `dungeon-maps.service.spec.ts` existuje (1 soubor).
- **Token modal 3×3**: `BestiePanelView.spec.tsx` existuje; PC a NPC varianty nemají spec test pro view-mode gating.
- **`enrichTokens` diary race**: paralelní `Promise.all` pro slugy — pokud jeden slug chybí, zbytek se enrichuje korektně, ale není test pro partial failure.
- **`catchUpScene` too-big path**: unit test chybí; jen unhappy path unit pro catchUp.
- **Weather atmosféra unit**: `MapWeatherAtmosphere.test.tsx` existuje; BE event-to-WS-to-cache end-to-end není.
- **System panels (6 systémů)**: `*CombatPanel.spec.tsx` existuje pro všechny — zkontrolovat, zda testují `systemStats` cestu (ne jen BC `currentHp`).

---

## Známá rizika

- **Whitelist mapper drift (M2 — KRITICKÉ)**: `toToken` mapper je explicitní whitelist. Každé nové pole přidané do `MapToken` interface musí být ručně přidáno i do `toToken`. Historie: `isLocked` (D-066), `notes`, `systemStats` — všechny driftly. Riziko se zvyšuje při každém schema-engine rozšíření. Test existence nový pole není automatizovaný (jen `maps.repository.spec.ts` pro D-066).
- **PIXI async init race**: podmínka `width > 0 && height > 0 && scene !== null` před mountem `<Application>` brání prázdnému canvas, ale je křehká vůči race kde `scene` přijde dřív než `width/height` (pomalý `ResizeObserver`). Při upgradu @pixi/react v8→v9 se pravidlo může změnit.
- **WS room:join vs map:join-world pro počasí**: `useMapWeather` joinuje přes `socket.emit("room:join", ...)` — tento event NENÍ standardní socket.io a musí ho server obsluhovat. Pokud server handler pro `room:join` chybí nebo změní název, hráči přestanou dostávat `weather:updated` beze zjevné chyby (tiché selhání).
- **`map:reassigned` double-listener**: event zpracovává jak `useReassignmentListener` (invalidate query), tak `useMapSocket` (jako WS subscriber). Pokud se oba zaregistrují na stejném socketu pro jednoho komponentového stromu, invalidace může proběhnout dvakrát — za normálního provozu bez efektu, ale v edge-case (rychlý reassign) může způsobit race se stale cache.
- **enrichTokens N+1 pattern**: `enrichTokens` volá `findBySlugAndWorld` + `findBySlugAndWorld` (Page) + `findByCharacterId` (diary) pro KAŽDÝ unikátní slug paralelně. Pro scénu se 30+ tokeny (běžný combat) = 90+ DB dotazů per GET. Bez DataLoader / batch risk performance degradace nebo timeout.
- **`combat.turn` bez tokenId (legacy auto-next)**: BE fallback dle `combat.order` array je zachován pro BC. Pokud FE z jakéhokoli důvodu nepošle explicitní `tokenId`, server použije zastaralý order (ne živý sort) → jiný token na řadě než ukazuje lišta. Riziko pokud FE hook `nextTurn()` selhá a fallback se aktivuje tiše.
