# bug / 11-svet-mapa — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem celou oblast staticky (M1–M5):

**BE (maps modul):**
- `maps.repository.ts` — `toToken` whitelist mapper (B01–B08) ✅
- `maps.service.ts` — findActiveForUser, enrichTokens, moveToken, removeToken (A01–A03, B12–B15, E02–E03) ✅
- `map-operations.service.ts` — applyAtomic všechny typy (B09–B11, C01–C10, D01–D18, J01–J09, K02–K03) ✅
- `operations-authorizer.service.ts` — role gating všechny ops (A08–A09, B12–B15, D15, H07–H08, J10) ✅
- `maps.controller.ts` — HTTP endpoints (A01–A02, SM-A07, J09, J10) ✅
- `maps.gateway.ts` — WS handlery (H01–H20) ✅
- `map-operations.repository.ts` — allocateSeqNumber, findSince (J01, J09) ✅
- `map-templates.controller.ts` — CRUD šablon (G04–G06) ✅
- `dungeon-maps.service.ts` / `controller.ts` — assertCanManage práh (G07–G09) ✅
- `schema-registry.service.ts`, `system-stats-validator.service.ts` (K02–K03) ✅

**FE (tactical-map):**
- `applyOperationToScene.ts` — exhaustive switch, všechny op typy (J06–J08) ✅
- `useMapSocket.ts` — join/leave/reconnect/listeners (H01–H04, H19) ✅
- `useMapScene.ts` — gap detection, catch-up, reconnect (H04–H06) ✅
- `useMapWeather.ts` — room:join, re-join po reconnect (F01–F05, F08–F09) ✅
- `useCombat.ts` — live sort, bench, nextTurn, jumpTo (D07–D12) ✅
- `useReassignmentListener.ts` — invalidate pattern (A06, H20) ✅
- `catchUpScene.ts` — too-big path (H05) ✅
- `sceneAccess.ts` — effectiveHidden/Locked (A12) ✅
- `resolveCharacterHp.ts` — per-system HP mapping (E02) ✅
- `buildSpawnToken.ts` — buildBestieToken, buildPcToken, buildNpcToken (B19–B20) ✅
- `findFirstFreeHex.ts` — spirálový BFS (B18) ✅
- `schemas/registry.ts`, `schemas/bootstrap.ts` (K01) ✅
- `Drd2CombatPanel.tsx` — diary-based HP update (E02, E15) ✅

**Soubory nepokryté (vyžadují živé prostředí):**
- PIXI canvas render: TokenLayer, FogLayer, HexGrid, EffectsLayer (I01–I08, C05–C11, SM-K04–K05)
- Token modal UX (E07–E10, SM-B16–B17, SM-B22)
- Dungeon builder UI (G07, G12)
- Notebook UI (F10–F11), Sound UI (F13), Weather atmosféra (F06–F07)

## Dosažená L vs cílová L

Cílová: L3 (existující testy). Dosaženo:
- Statika (M1): L1 na všech auto bodech — 100 % prošlo
- Kontrakt (M2/M4/M5): L2 na token mapper, role gating, WS listener kontrakt
- Existující testy: ověřit by vyžadovalo spuštění — viz PROOF-REQUEST níže
- Human-only body: ⏭️

## Nálezy

N-SM-01 — [J] `combat.turn` inverse neobsahuje `round` · Kde: `map-operations.service.ts:377–385` · Dopad: Undo `combat.turn` na kola-hranici vrátí `currentTokenId` na předchozí token, ale `round` zůstane inkrementovaný (např. round 1→2, undo → stále round=2). Kolo nejde vrátit zpět. · Návrh: Přidat `round: scene.combat?.round ?? 1` do inverse objektu: `return { type: 'combat.turn', tokenId: prevTokenId, round: combat.round ?? 1 }`. · L1 · 🆕

N-SM-02 — [H] `map:reassigned` potenciální dvojí listener · Kde: `useMapSocket.ts:116–126` + `useReassignmentListener.ts:49` · Dopad: `useMapSocket` má `onReassigned` prop a listener registraci. V současnosti TacticalMapView ho nepoužívá (nepředává `onReassigned` do `useMapScene`/`useMapSocket`), takže double-registration NEVZNIKÁ. Ale stačí jedna změna (přidání `onReassigned` do `useMapScene`) a duplicitní invalidace nastane bez upozornění. · Návrh: Odstranit `onReassigned` logiku z `useMapSocket` (jediný consumer je `useReassignmentListener`) nebo zdokumentovat vzájemné vyloučení. · L1 · 🆕 (riziko, ne aktivní bug)

N-SM-03 — [A] `findActiveByWorld` deprecated metoda stále živá v `MapsService` · Kde: `maps.service.ts:155–163` · Dopad: `findActive` (deprecated, bez per-user resolve) je stále součást service a není označena v controlleru jako odstraněná. Klient z pre-10.2 doby mohl volat `GET /maps/active` bez `userId` kontextu — controller teď vždy volá `findActiveForUser`, takže deprecated metoda je mrtvý kód. Není bezpečnostní riziko (controller ji nevolá), ale zmatek při future refactoru. · Návrh: Odstranit nebo označit `@deprecated` + přidat lint rule pro dead code. · L1 · 🆕 (mrtvý kód / dead code)

N-SM-04 — [E] `drdh` a `drd16` systémy chybí v `bootstrapSchemas()` · Kde: `schemas/bootstrap.ts:30–54` a `resolveCharacterHp.ts:71–82` · Dopad: `resolveCharacterHp` má case pro `drdh` i `drd16` (čte `drdh_hp_max`, `hp_max/hp_current`) — to funguje přes diary subdoc, OK. Ale `systemEntitySchemaRegistry` neobsahuje schéma pro tyto systémy → `EntitySchemaForm` / `EntityStatbar` fallbackne na `generic` schéma (ne per-systém). Výsledek: bestie v `drdh`/`drd16` světech dostanou generic token panel, ne specializovaný. Ne crash, ale sub-optimální UX. · Návrh: Přidat token + bestie schéma pro `drdh` a `drd16` do `bootstrap.ts`. · L1 · 🆕

N-SM-05 — [B] `toToken` mapper neobsahuje `playerStates` guard — ale `MapScene.playerStates` je na scéně, ne tokenu. Žádný nový token drift nalezen. Whitelist mapper je kompletní (confirmed: id, characterId, characterSlug, q, r, isNpc, templateId, instanceName, currentHp, maxHp, baseHp, armor, baseArmor, injury, initiative, initiativeBase, inCombat, isLocked, movement, abilities, notes, systemStats, personalDiarySchema, customData — všechny z `MapToken` interface). ✅L1 — není nález, verifikace.

N-SM-06 — [H] `room:join world:{worldId}` ROOM_PATTERN validace · Kde: `app.gateway.ts:16` `/^[a-z]+:[a-zA-Z0-9]+$/` · Stav: worldId = MongoDB ObjectId (hex, jen [a-fA-F0-9]) — ale regex má `[a-zA-Z0-9]+` = matchuje. Ověřeno (`/^[a-z]+:[a-zA-Z0-9]+$/.test('world:507f1f77bcf86cd799439011')` = true). ✅L1 — false alarm, pattern OK.

N-SM-07 — [K] `token.update` hráč nemůže patchovat `systemStats` · Kde: `operations-authorizer.service.ts:145–151` · Dopad: `allowedPlayerFields = {currentHp, injury, initiative}`. Hráč nemůže patchovat `systemStats` přes `token.update`. Toto je záměrné pro PC/NPC (HP jde přes diary subdoc endpoint, viz `Drd2CombatPanel`). Pro bestie tokeny je to irrelevantní (bestie edituje PJ). ✅L1 — architektura správná, není bug.

N-SM-08 — [J] `catchUpScene` gap s 0 operacemi vrátí správné `lastSeqNumber` · Kde: `catchUpScene.ts:24–29` · Detail: Pokud catch-up vrátí 0 operací (jsme synced) a `list.operations.length < limit` (0 < 500), vrátí `{ ...working, lastSeqNumber: list.lastSeqNumber }`. `list.lastSeqNumber` = scény aktuální seqNumber = správné. ✅L1.

## PROOF-REQUEST

**PR-1 (M3 — BE testy):**
```
cd c:/Matrix/ProjektIkaros/Projekt-ikaros/backend
npx jest --maxWorkers=2 --testPathPattern="maps\." --verbose
```
Ověří: combat.start/turn/end precondition checks (D01–D06), fog round-trip (C01–C04), token whitelist mapper (B01–B08), seqNumber atomic allocation (J01–J02), operations authorizer role matice (A08–A09, B12–B15).

**PR-2 (M3 — FE testy):**
```
cd c:/Matrix/ProjektIkaros/Projekt-ikaros-FE
npx vitest run --project '!storybook' --reporter=verbose src/features/world/tactical-map
```
Ověří: applyOperationToScene exhaustive (J06–J08), fog patcher (C02–C04), combat live sort (D07–D09), findFirstFreeHex BFS (B18), screenToHex transformace (I07), catchUpScene too-big path (H05), resolveCharacterHp per-system (E02), sceneAccess effectiveHidden/Locked (A12).

**PR-3 (M3 — N-SM-01 regrese):**
Po případné opravě spustit `jest --testPathPattern=map-operations.service` a ověřit, že `combat.turn` inverse obsahuje `round`.

**PR-4 (PIXI canvas — M7):**
Manuální ověření: PIXI Application se nemountuje pokud `width=0 || height=0 || scene=null` (I01). Nutný reálný browser s DevTools — resize window na 0px width a zkontrolovat, zda canvas zmizí bez erroru.

**PR-5 (WS reconnect — M5):**
Simulovat WS disconnect/reconnect s aktivní scénou (Network tab → offline → online) a ověřit:
- `useMapSocket` re-emituje `map:join` (H03)
- `useMapScene.onReconnect` spustí catchUp (H04)
- `useMapWeather` re-joinne `world:{worldId}` (F02)
- Scéna se zobrazí bez gap.
