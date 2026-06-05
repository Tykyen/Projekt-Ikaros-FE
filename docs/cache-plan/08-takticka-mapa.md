# 08 — Taktická mapa

> **Sweep 2026-06-05.** Cache-invalidation inventura (TanStack Query v5). Read-only.
> Osy: `OPT` `WS` `FO` `KM` `LC` `DEL` · perspektivy P3 (optimistic round-trip) + P4 (WS↔REST parita) + P1 (konzumentská inventura).
> Soubory: `src/features/world/tactical-map/{hooks,api,components}/`. Nálezy → [`../cache-audit.md`](../cache-audit.md) (`C-24…`).
> **Architektonická specifika oblasti** (oproti 03): scéna je **jeden velký RQ záznam** patchovaný in-place
> přes `setQueryData(applyOperationToScene(...))`, ne fan-out přes víc klíčů. WS `map:operation` aplikuje
> patch sekvenčně dle `seqNumber` (gap → catch-up GET); REST mutace = optimistic patch + `invalidate(scene)`.
> Většina „mutací" oblasti jde přes **jeden** queryKey (`mapSceneQueryKey`), takže klasický fan-out problém
> (seznam vs detail) tu z velké části nehrozí — riziko je **OPT** (rollback/resync) a **WS↔REST parita**.

## 1. Konzumentská inventura (P1)

| Zdroj / entita | `queryKey` | role | staleTime / enabled | soubor:řádek |
|---|---|---|---|---|
| **Aktivní scéna** (per-user) | `['map','active',worldId]` (factory `mapSceneQueryKey`) | hlavní render mapy (tokens/effects/fog/combat/dice/sounds) | 30s; `!!worldId` | [useMapScene.ts:40,92](../../src/features/world/tactical-map/hooks/useMapScene.ts#L40) |
| **Aktivní scény** (world list) | `['map','world-active-scenes',worldId]` (factory `activeScenesQueryKey`) | PJ orchestrator list + empty-state self-assign + SceneAccessSection | 60s; `!!worldId && enabled` | [useActiveScenes.ts:25,43](../../src/features/world/tactical-map/hooks/useActiveScenes.ts#L25) |
| **Combat** | — (derivát `scene.combat` + `scene.tokens`) | iniciativní lišta | — (žije ve scene query) | [useCombat.ts:54,61](../../src/features/world/tactical-map/hooks/useCombat.ts#L54) |
| **Tokens** | — (derivát `scene.tokens`) | TokenLayer, InitiativeBar, TokenInfoPanel | — | scene query |
| **Weather** (mapa) | čte `world.activeMapWeather` z **`['worlds','id'\|'slug',key]`** (WorldContext) | MapWeatherPanel + MapWeatherAtmosphere | 5 min (world detail) | [useMapWeather.ts:58,129](../../src/features/world/tactical-map/hooks/useMapWeather.ts#L58) |
| **GM notes** (PJ deník) | `['world',worldId,'gm-notes']` | MapNotebookOverlay (PJ) | 30s; `!!worldId && isPJ` | [useGmNotes.ts:17,21](../../src/features/world/tactical-map/api/useGmNotes.ts#L17) |
| Character notes (hráč deník) | `['characters',slug,'notes'…]` (jiná feature) | MapNotebookOverlay (hráč) | viz oblast 05 | useCharacterSubdocs |
| **Map templates** (knihovna) | `['map-templates']` | MapLibraryModal | default 30s | [MapLibraryModal.ts:71](../../src/features/world/tactical-map/components/pj-panel/MapLibraryModal.tsx#L71) |
| Members (cross-ref 03) | `['worlds',worldId,'members']` | AccessBoard + reassignment side-effect | 60s | useWorldMembers |
| Bestiar (cross-ref 07) | `bestiarQueryKey(worldId,systemId)` | token image lookup (resolveTokenImage) | viz 07 | useBestiar |
| LoadPrep PC/NPC | `['worlds',w,'characters','players'\|'all']` | LoadPreparationDialog select | `!!worldId` | [LoadPreparationDialog.ts:44,50](../../src/features/world/tactical-map/components/pj-panel/LoadPreparationDialog.tsx#L44) |
| Campaign scénáře (cross-ref 11.2) | `campaignKeys.scenarios(worldId)` | LoadPrep | viz campaign | LoadPreparationDialog |

> ⚠️ **Klíčový vzor:** `useMapScene` query je `['map','active',worldId]`, **NE** per-sceneId. Per-user resolve
> přes `GET /maps/active` vrátí scénu dle `membership.currentSceneId`. Všechny optimistic patche i WS aplikace
> míří na tento **jeden** klíč. `activeScenesQueryKey` je **paralelní** klíč (PJ list) → invalidace scény
> NEobnoví list a naopak (správně — různé zdroje; jen mutace, co mění oboje, musí invalidovat oba, viz matice).

## 2. Mutace × konzument matice

Sloupce: **scene** = `mapSceneQueryKey` · **act.scenes** = `activeScenesQueryKey` · **members** = `['worlds',w,'members']` · **OPT** = optimistic+rollback · **resync** = `onSettled/onSuccess invalidate`.

| Mutace (soubor:řádek) | scene | act.scenes | members | OPT | resync | pozn. |
|---|---|---|---|---|---|---|
| `diceMutation` [useMapScene.ts:122](../../src/features/world/tactical-map/hooks/useMapScene.ts#L122) | ✅ patch | — | — | ✅ rollback | **❌ žádný onSettled** | viz **D-08-1** (záměr — koord. s dice log) |
| `useTokenUpdate` [useTokenUpdate.ts:16](../../src/features/world/tactical-map/hooks/useTokenUpdate.ts#L16) | ✅ patch | — | — | ✅ rollback | ✅ onSuccess invalidate (gate `skipInvalidate`) | parita queryFn ✅ |
| `useCombat.opMutation` [useCombat.ts:77](../../src/features/world/tactical-map/hooks/useCombat.ts#L77) | ✅ patch | — | — | ✅ rollback | ✅ onSuccess invalidate | start/turn/end |
| `moveMutation` [TacticalMapView.tsx:491](../../src/features/world/tactical-map/TacticalMapView.tsx#L491) | ✅ patch | — | — | ✅ rollback+toast | **❌ žádný resync** | viz **D-08-2** |
| `effectMutation` [TacticalMapView.tsx:536](../../src/features/world/tactical-map/TacticalMapView.tsx#L536) | ✅ patch | — | — | ✅ rollback+toast | **❌ žádný resync** | brush spam → WS dorovná |
| `fogMutation` [TacticalMapView.tsx:568](../../src/features/world/tactical-map/TacticalMapView.tsx#L568) | ✅ patch | — | — | ✅ rollback+toast | **❌ žádný resync** | brush spam → WS dorovná |
| `broadcastSounds` [TacticalMapView.tsx:470](../../src/features/world/tactical-map/TacticalMapView.tsx#L470) | ✅ patch | — | — | ✅ rollback+toast (ruční `.catch`) | **❌ žádný resync** | ne useMutation (raw post) |
| `spawnMutation` (token.add) [TacticalMapView.tsx:516](../../src/features/world/tactical-map/TacticalMapView.tsx#L516) | — | — | — | ❌ (záměr — BE přepíše ID) | ✅ onSuccess invalidate | |
| inline `combat.turn` (vyřazení na tahu) [TacticalMapView.tsx:1379](../../src/features/world/tactical-map/TacticalMapView.tsx#L1379) | ✅ setQueryData | — | — | **❌ žádný rollback** | **❌ žádný resync** | viz **D-08-3** |
| inline `token.remove` (delete token) [TacticalMapView.tsx:1462](../../src/features/world/tactical-map/TacticalMapView.tsx#L1462) | **❌ nic** | — | — | ❌ | ❌ | viz **C-24** (raw post, žádný cache efekt) |
| `useUpdateGmNotes` [useGmNotes.ts:29](../../src/features/world/tactical-map/api/useGmNotes.ts#L29) | — | — | — | ❌ (set-only) | `setQueryData(notes)` | viz **D-08-4** (K-C9) |
| EmptyState `assignMutation` [MapEmptyState.tsx:70](../../src/features/world/tactical-map/components/MapEmptyState.tsx#L70) | ✅ inval | **❌** | ✅ inval | ❌ | ✅ | viz **C-25** |
| EmptyState `createScene` [MapEmptyState.tsx:89](../../src/features/world/tactical-map/components/MapEmptyState.tsx#L89) | ✅ inval | **❌** | ✅ inval | ❌ | ✅ | viz **C-25** |
| PjPanel `mutation` (assign self) [MapPjPanel.tsx:133](../../src/features/world/tactical-map/components/pj-panel/MapPjPanel.tsx#L133) | ✅ inval | **❌** | ✅ inval | ❌ | ✅ | viz **C-25** |
| PjPanel `deactivateMutation` [MapPjPanel.tsx:152](../../src/features/world/tactical-map/components/pj-panel/MapPjPanel.tsx#L152) | ✅ inval | ✅ inval | ✅ inval | ❌ | ✅ | ✅ úplné |
| PjPanel `createSceneMutation` [MapPjPanel.tsx:177](../../src/features/world/tactical-map/components/pj-panel/MapPjPanel.tsx#L177) | ✅ inval | **❌ dead key** | ✅ inval | ❌ | ✅ | viz **C-26** |
| PjPanel EditScene `onSaved` [MapPjPanel.tsx:438](../../src/features/world/tactical-map/components/pj-panel/MapPjPanel.tsx#L438) | ✅ inval | ✅ inval (inline literál) | — | ❌ | ✅ | ⚠ inline literál drift (D-08-6) |
| PjPanel ClearScene `onConfirm` [MapPjPanel.tsx:474](../../src/features/world/tactical-map/components/pj-panel/MapPjPanel.tsx#L474) | ✅ inval | — | — | ❌ | ✅ | raw post + inval |
| LibraryModal `loadMutation` [MapLibraryModal.tsx:87](../../src/features/world/tactical-map/components/pj-panel/MapLibraryModal.tsx#L87) | ✅ inval | ✅ inval | ✅ inval | ❌ | ✅ | ✅ úplné |
| LibraryModal `saveMutation` [MapLibraryModal.tsx:140](../../src/features/world/tactical-map/components/pj-panel/MapLibraryModal.tsx#L140) | — | — | — | ❌ | ✅ `['map-templates']` | ✅ |
| LibraryModal `deleteMutation` [MapLibraryModal.tsx:163](../../src/features/world/tactical-map/components/pj-panel/MapLibraryModal.tsx#L163) | — | — | — | ❌ | ✅ `['map-templates']` | ✅ (DEL — invalidate list je OK, žádný detail key) |
| SceneAccessSection `mutation` [SceneAccessSection.tsx:35](../../src/features/world/tactical-map/components/pj-panel/SceneAccessSection.tsx#L35) | ✅ inval | ✅ inval | ✅ inval | ❌ | ✅ | ✅ úplné |
| LoadPrep `apply` [LoadPreparationDialog.tsx:110](../../src/features/world/tactical-map/components/pj-panel/LoadPreparationDialog.tsx#L110) | ✅ inval | ✅ inval | ✅ inval + campaign | ❌ | ✅ | ✅ úplné |
| `useBroadcastWeather` [useWeatherGenerators.ts:143](../../src/features/world/api/useWeatherGenerators.ts#L143) | — | — | — | ❌ | **❌ žádný cache efekt** | viz **D-08-5** (WS push) |
| `useClearMapWeather` [useWeatherGenerators.ts:158](../../src/features/world/api/useWeatherGenerators.ts#L158) | — | — | — | ❌ | **❌ žádný cache efekt** | viz **D-08-5** (WS push) |

**WS handlery:**
- `map:operation` → patch `mapSceneQueryKey` přes `applyOperationToScene` (sekvenční dle seqNumber; gap → `catchUpScene` GET; too-big → full refetch) — [useMapScene.ts:150](../../src/features/world/tactical-map/hooks/useMapScene.ts#L150).
- `connect` (reconnect) → re-join scene room (`map:join`) + forced catch-up — [useMapSocket.ts:77](../../src/features/world/tactical-map/hooks/useMapSocket.ts#L77), [useMapScene.ts:192](../../src/features/world/tactical-map/hooks/useMapScene.ts#L192).
- `world:operation` (`op.type` `member.*`) → `invalidate(activeScenesQueryKey)` + reconnect re-join `map:join-world` — [useActiveScenes.ts:53,76](../../src/features/world/tactical-map/hooks/useActiveScenes.ts#L53).
- `map:reassigned` (private) → `invalidate(mapSceneQueryKey)` — [useReassignmentListener.ts:30](../../src/features/world/tactical-map/hooks/useReassignmentListener.ts#L30).
- `weather:updated` (room `world:{worldId}`) → `setQueriesData(['worlds'])` patch `activeMapWeather` + reconnect re-join `room:join` — [useMapWeather.ts:78,94](../../src/features/world/tactical-map/hooks/useMapWeather.ts#L78).
- `map:spotlight` / `map:pinged` → ephemeral lokální state (mimo RQ, OK).

---

## 3. Ověření konkrétních bodů zadání

### K-C9 — `useGmNotes` set-only (bod 1) → ⚖️ by-design, drobné latentní riziko (D-08-4)
- **Optimistic?** NE. `mutationFn` PATCH proběhne první, `setQueryData(notes)` v `onSuccess` zapíše **server response** (ne lokální guess). Žádná „optimistická lež" v mezičase — UI ukazuje starý obsah do success.
- **onError rollback?** Žádný nepotřebuje — když není optimistic set, není co rollbacknout. Při chybě cache drží předchozí (server) stav. ✅
- **resync?** `setQueryData` zapisuje **přesně to, co vrací PATCH** (`WorldGmNotes`), takže tvar == `queryFn` (`api.get<WorldGmNotes>`). Žádný refetch netřeba. ✅
- **Může uváznout na lži?** NE — žádný optimistic stav. Jediná slabina: **chybí WS push** (per-PJ world-level, sdílí jen vlastní PJ napříč kartami/zařízeními → druhá karta vidí starý obsah do staleTime 30s). Edge (jeden PJ, dvě karty). → **D-08-4 🟡**.
- **Verdikt:** mechanická hypotéza „set-only bez invalidate" je **správně by-design** (server-truth set), NE bug.

### Token optimistic — `useTokenUpdate` (bod 2) → ✅ kompletní round-trip
- `onMutate` snapshot (`prev = getQueryData`) + optimistic `setQueryData(applyOperationToScene(prev, token.update))` ✅
- `onError` rollback na `ctx.prev` (guard `!== undefined`) ✅
- `onSuccess` `invalidateQueries(scene)` = resync — **ALE** gated `skipInvalidate` flag ([useTokenUpdate.ts:53](../../src/features/world/tactical-map/hooks/useTokenUpdate.ts#L53)). Záměr: u iniciativního hodu běží paralelní `dice.roll` optimistic, invalidate refetch by sestřelil nepersistovaný hod. Legitimní; WS broadcast pokryje resync.
- **Tvar `setQueryData` == `queryFn`?** ✅ — patcher produkuje `MapScene` se stejnou strukturou jako `getActiveMapScene`.
- **WS echo dedup (vlastní vs cizí pohyb)?** ⚠️ **Token ops (move/update) NEmají dedup po id** — na rozdíl od `effect.add` (dedup po `e.id`) a `dice.roll` (dedup po `roll.id`). U `token.update` je to idempotentní (`{...token, ...patch}` se stejným patchem → stejný výsledek), takže echo neuškodí. Ale spoléhá to na **sekvenční seqNumber gate** v `onOperation` (echo vlastní op má seqNumber, který `applyOperationToScene` aplikuje znovu → idempotentní pro update, **NE pro `token.move` při zpozdním echu**: pokud token mezitím posunu znovu, staré echo by ho mohlo vrátit — ale seqNumber gate `payload.seqNumber === expectedSeq` to chrání, duplicate seqNumber `< expectedSeq` se ignoruje). → viz **D-08-7 🟡** (verify race).

### WS↔REST parita (bod 3, P4) → většinou ✅, asymetrie u optimistic mutací
- **scene** (token/effect/fog/combat): REST = optimistic patch + (někdy) invalidate; WS = patch přes stejný `applyOperationToScene`. **Parita držena** — obě cesty produkují identický stav. Reconnect: `map:join` re-join + forced catch-up ✅. ⚠ ale REST optimistic mutace (move/effect/fog/sounds) **nemají onSettled resync** → spoléhají 100% na WS echo (viz D-08-2). Pokud WS echo nedorazí (broadcast drop) a klient nedostane žádný další op, optimistic patch **nikdy** nedostane server potvrzení → drží lokální (správný) stav, ale bez verifikace. Tlumeno staleTime 30s + reconnect catch-up.
- **combat**: ✅ má onSuccess invalidate (resync) — robustnější než move/effect/fog.
- **weather**: REST mutace (broadcast/clear) **nemají žádný cache efekt** (D-08-5) → obnova jde **výhradně** přes WS `weather:updated` push do `world:{worldId}` roomu. Reconnect re-join `room:join` ✅.
- **reassignment**: WS `map:reassigned` → invalidate scene; REST self-assign (PjPanel/EmptyState) → invalidate scene+members. Parita ✅. Reconnect re-join řeší `useActiveScenes` (`map:join-world`), ale **`map:reassigned` je private `user:{userId}` room** — re-join toho roomu po reconnectu **nikde nevidím** (chat socket pravděpodobně auto-joinuje user room při auth). → **D-08-8 🟡 VERIFY**.

### Weather cross-ref oblast 09 (bod 4) → ✅ ověřeno, WS push funguje
- `useBroadcastWeather`/`useClearMapWeather` skutečně **bez RQ efektu** (potvrzeno [useWeatherGenerators.ts:143,158](../../src/features/world/api/useWeatherGenerators.ts#L143)).
- `useMapWeather` to **chytá přes WS** ([useMapWeather.ts:94-116](../../src/features/world/tactical-map/hooks/useMapWeather.ts#L94)): listener `weather:updated` → `setQueriesData({queryKey:['worlds']}, old => old.id===worldId ? {...old, activeMapWeather: next} : old)`. WorldContext `world` pochází z `useWorld(slug)` = `['worlds','slug'|'id',key]` (World objekt), který `['worlds']` prefix-matchuje → panel + atmosféra se překreslí. **Funguje.** ✅
- `weather:null` (PJ clear) → `next = null` → `activeMapWeather: null` → efekty zmizí. ✅
- ⚠ **2 latentní slabiny** (D-08-9): (a) `setAt: new Date().toISOString()` je **klientský čas** (ne server) — kosmetické. (b) **dual-source riziko**: weather žije v `world.activeMapWeather` (World detail query). Pokud se mezitím refetchne world detail (5min staleTime / refetchOnMount), dostane **server** `activeMapWeather`, který je po REST broadcast/clear čerstvý (BE ukládá do `World`) → konvergence OK. Ale list queries (`['worlds','my']` → `World[]`) `setQueriesData` callback dostane taky — `old.id` je na **poli** `undefined` → vrací `old` beze změny ✅ (žádný damage).

### Census (bod 5) — mutace bez cache efektu
- **C-24** 🟠 — inline `token.remove` ([TacticalMapView.tsx:1462](../../src/features/world/tactical-map/TacticalMapView.tsx#L1462)) = raw `postMapOperation` bez optimistic patch, bez invalidate, bez rollback. Detaily níže.
- **D-08-5** — `useBroadcastWeather`/`useClearMapWeather` bez cache efektu (by-design, WS push).
- **D-08-1** — `diceMutation` bez onSettled (by-design, koordinace s dice log).
- Zbytek mutací má ≥1 cache efekt.

---

## 4. Nálezy

### 🟠 C-24 · `OPT`/`DEL`/P3 · `token.remove` (smazání tokenu) = raw post bez jakéhokoli cache efektu
- **Místo:** [TacticalMapView.tsx:1458-1466](../../src/features/world/tactical-map/TacticalMapView.tsx#L1458) — tlačítko „Odstranit z mapy" v TokenInfoPanel:
  `void postMapOperation(scene.id, { type:'token.remove', tokenId }); setOpenedTokenId(null);`
- **Rozpor:** žádný optimistic patch, žádný `invalidate(scene)`, žádný `onError`. Na rozdíl od sourozenců (move/effect/fog mají optimistic+rollback; spawn má invalidate). Token v cache mizí **výhradně** až dorazí WS echo `map:operation token.remove`.
- **Trigger:** PJ smaže token. **Viditelnost:** token **zůstane na mapě** dokud nedorazí WS broadcast (typicky pár ms — ale při degradovaném/odpojeném socketu **vůbec**, nebo s viditelným zpožděním). Modal se zavře (`setOpenedTokenId(null)`) → vznikne dojem „smazáno", ale token na ploše drží. Při **selhání POST** (403/500) není žádný toast ani rollback — token zůstane a uživatel nemá zpětnou vazbu, že akce selhala.
- **Workaround:** přepnutí scény / F5 / další op (vyvolá patch).
- **Návrh:** převést na `useMutation` se stejným vzorem jako `moveMutation` (optimistic `applyOperationToScene` token.remove + `onError` rollback + toast + `onSuccess invalidate(scene)`), nebo aspoň optimistic `setQueryData` + `.catch` rollback jako `broadcastSounds`. Minimálně přidat error toast.

### 🟠 C-25 · `WS`/`FO` · self-assign / create-scene neinvalidují `activeScenesQueryKey` (PJ list zamrzne)
- **Místa:**
  - [MapEmptyState.tsx:79-86](../../src/features/world/tactical-map/components/MapEmptyState.tsx#L79) `assignMutation.onSuccess` → invaliduje `mapSceneQueryKey` + `['worlds',w,'members']`, **NE** `activeScenesQueryKey`.
  - [MapEmptyState.tsx:115-123](../../src/features/world/tactical-map/components/MapEmptyState.tsx#L115) `createScene.onSuccess` → totéž (chybí act.scenes).
  - [MapPjPanel.tsx:135-139](../../src/features/world/tactical-map/components/pj-panel/MapPjPanel.tsx#L135) `mutation.onSuccess` (assign self z panelu) → `members` + `mapSceneQueryKey`, **NE** `activeScenesQueryKey`.
- **Rozpor:** `activeScenesQueryKey` (`['map','world-active-scenes',worldId]`) je **vlastní namespace** — `mapSceneQueryKey` (`['map','active',worldId]`) ho NEprefixuje (`[1]` se liší: `'active'` vs `'world-active-scenes'`). PJ orchestrator list aktivních scén se po self-assign / create-scene neobnoví z REST.
- **Maskováno:** WS `world:operation` (`member.assignToScene` → `member.*`) invaliduje `activeScenesQueryKey` ([useActiveScenes.ts:59-64](../../src/features/world/tactical-map/hooks/useActiveScenes.ts#L59)) → list se obnoví **přes WS**. Stejně tak `createScene` aktivuje scénu → BE pravděpodobně broadcastne. Takže nejde o trvalý stale, ale o **WS-dependent** obnovu (stejný vzor jako C-02 v oblasti 03).
- **Trigger:** self-assign / vytvoření scény při odpojeném/degradovaném socketu. **Viditelnost:** PJ panel „Aktivní scény" drží starý seznam / starý `currentSceneId` highlight; nová scéna se neobjeví v listu (ale `useMapScene` se loadne, takže mapa jede). **Workaround:** F5 / 60s staleTime / další WS event.
- **Pozn.:** sourozenci to dělají správně — `deactivateMutation`, `LibraryModal.loadMutation`, `SceneAccessSection`, `LoadPrep.apply` všechny invalidují `activeScenesQueryKey`. Tři assign/create místa jsou odchylka.
- **Návrh:** doplnit `invalidate(activeScenesQueryKey(worldId))` do `onSuccess` ve všech třech (REST fallback nezávislý na WS).

### 🟡 C-26 · `KM` · `createSceneMutation` invaliduje **dead key** `['map','world-scenes',worldId,'active']`
- **Místo:** [MapPjPanel.tsx:202-204](../../src/features/world/tactical-map/components/pj-panel/MapPjPanel.tsx#L202) — `void invalidate({ queryKey: ['map','world-scenes',worldId,'active'] })`.
- **Rozpor:** **žádný dotaz** neběží pod tímto klíčem. Factory list aktivních scén je `['map','world-active-scenes',worldId]` (`activeScenesQueryKey`), list všech scén `listMapScenes` nemá vlastní `useQuery`. `['map','world-scenes',…]` je **překlep/reziduum refactoru** → invaliduje do prázdna.
- **Trigger:** PJ „+ Nová" v panelu. **Viditelnost:** list aktivních scén v panelu se **z REST neobnoví** (dead key netrefí `world-active-scenes`); maskováno WS broadcast (jako C-25). Dvojitý problém: i kdyby chtěl invalidovat list, mine ho.
- **Workaround:** F5 / WS / staleTime.
- **Návrh:** nahradit za `activeScenesQueryKey(worldId)` (= sloučí s opravou C-25 pro toto místo).

---

## 5. Latentní / VERIFY (neeskalováno na C-xx)

- **D-08-1 `OPT` ⚖️ by-design** — `diceMutation` ([useMapScene.ts:122](../../src/features/world/tactical-map/hooks/useMapScene.ts#L122)) má onMutate+onError, **bez onSettled/onSuccess resync**. Záměr (komentář + parita s `skipInvalidate` u tokenUpdate): invalidate refetch by sestřelil nepersistovaný hod z logu při paralelní op. WS broadcast `dice.roll` (dedup po `roll.id`) dorovná. Žádná lež k rollbacku po success (optimistic přidání + idempotentní dedup). ✅

- **D-08-2 `OPT`/`WS` 🟡** — `moveMutation`/`effectMutation`/`fogMutation`/`broadcastSounds` ([TacticalMapView.tsx:491,536,568,470](../../src/features/world/tactical-map/TacticalMapView.tsx#L491)) mají optimistic+rollback, **ale žádný onSettled invalidate** (resync). Po úspěšném POST cache drží **optimistický** výsledek, server potvrzení přijde jen přes WS echo. Pokud WS echo dropne (a žádný další op nepřijde), klient nikdy nedostane server-truth — drží lokální patch bez verifikace. Tlumeno: optimistic patch == BE transformace (applyOperationToScene mirror), staleTime 30s, reconnect catch-up. Riziko reálné jen při ztrátě broadcastu + následné divergenci. Záměr u brush (spam ops). VERIFY (M4): smaž/posuň → odpoj socket před echem → stav drží? Zvážit `onSettled` invalidate u single-shot mutací (move), ponechat brush bez.

- **D-08-3 `OPT` 🟡** — inline `combat.turn` při „vyřazení tokenu na tahu" ([TacticalMapView.tsx:1379-1394](../../src/features/world/tactical-map/TacticalMapView.tsx#L1379)): `setQueryData(applyOperationToScene)` + `void postMapOperation` **bez onError rollback a bez resync**. Pokud POST selže, cache drží posunuté „na tahu" (`currentTokenId`), ale server ne → divergence iniciativy. Edge (PJ vyřadí token zrovna na tahu + POST selže). VERIFY. Návrh: obalit do `tokenUpdate`/`opMutation` vzoru, nebo `.catch` rollback.

- **D-08-4 `WS` 🟡 (K-C9 follow-up)** — `useGmNotes` ([useGmNotes.ts](../../src/features/world/tactical-map/api/useGmNotes.ts)) bez WS push. Per-PJ world-level deník → druhá karta/zařízení téhož PJ vidí starý obsah do staleTime 30s. Edge. Set-only vzor je jinak ✅ (viz §3 K-C9).

- **D-08-5 `WS` ⚖️ by-design** — `useBroadcastWeather`/`useClearMapWeather` bez cache efektu — záměr: obnova přes WS `weather:updated` push (ověřeno funkční, §3 bod 4). Není bug; jen pozn. že **bez WS** by se počasí na mapě nezměnilo (mutace samotná nic neinvaliduje, world detail by se obnovil až refetchem). Cross-ref oblast 09.

- **D-08-6 `KM` 🟡 (drift-trap)** — EditScene `onSaved` ([MapPjPanel.tsx:444](../../src/features/world/tactical-map/components/pj-panel/MapPjPanel.tsx#L444)) invaliduje `activeScenesQueryKey` jako **inline literál** `['map','world-active-scenes',worldId]` místo factory (komentář to přiznává: „query key z hooks/useActiveScenes.ts"). Dnes se shoduje; refactor factory by tohle minul → tichá dead invalidace. Preventivní — použít factory.

- **D-08-7 `WS` 🟡 VERIFY** — token `move`/`update` ops **nemají dedup po id** v `applyOperationToScene` (na rozdíl od effect/dice). Chrání je sekvenční seqNumber gate (`=== expectedSeq`; `< expectedSeq` ignorováno). Pozdní/reorderované echo vlastní `token.move` by teoreticky mohlo „vrátit" token, ale gate by ho měl zahodit jako duplicate. VERIFY (M4): rychlý dvojitý move téhož tokenu při WS lagu — neskočí zpět?

- **D-08-8 `WS` 🟡 VERIFY** — `map:reassigned` je private `user:{userId}` room. `useReassignmentListener` po reconnectu **explicitně nere-joinuje** user room (na rozdíl od `useMapScene`/`useActiveScenes`/`useMapWeather`, které re-join řeší). Pokud chat socket auto-nejoinuje `user:{userId}` po reconnectu, hráč přesunutý PJem během výpadku **nedostane** reassign event → drží starou/mrtvou scénu. (paměť `project_map_world_room_join`: ruční room:join nutně s useSocketReconnect.) VERIFY: kde se joinuje user room + zda přežije reconnect.

- **D-08-9 `LC`/P7 🟡** — weather žije v `world.activeMapWeather` (World detail query, dual-purpose). `setAt` z WS patche je **klientský** čas (kosmetické). `setQueriesData(['worlds'])` korektně skipuje list queries (`old.id` undefined na poli). Konvergence se serverem OK (BE ukládá do World, refetch dorovná). Bez akce; jen evidence dual-source.

**Census (M-CEN):** **1 mutace bez cache efektu → C-24** (`token.remove`). 2 weather mutace bez efektu = by-design WS push (D-08-5). Zbytek pokryt.

**Reconnect / catch-up (LC):** robustní — `useMapScene` forced catch-up po reconnectu ([useMapScene.ts:192](../../src/features/world/tactical-map/hooks/useMapScene.ts#L192)), gap-detection (`> expectedSeq` → catch-up GET, `too-big` → full refetch), `useActiveScenes`/`useMapWeather` re-join roomů po `connect`. Jediná mezera = D-08-8 (user room re-join u reassignment).
