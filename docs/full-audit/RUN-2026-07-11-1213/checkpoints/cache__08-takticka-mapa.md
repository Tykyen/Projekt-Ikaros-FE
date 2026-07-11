# Checkpoint — cache / 08-takticka-mapa

> RUN-2026-07-11-1213 · READ-ONLY hloubkový audit · styl **cache** (registr `docs/cache-audit.md`, prefix `C-`)
> Oblast: `docs/cache-plan/08-takticka-mapa.md` · záběr `src/features/world/tactical-map/{hooks,api,components}/` + `features/world/api/useWeatherGenerators.ts`
> Osy: `OPT` `WS` `FO` `KM` `LC` `DEL` · perspektivy P1/P3/P4/P6.

## Dosažená vs cílová L
- **Dosažená: L2** — statická key-match (M2) + konzumentská inventura (P1) ověřená čtením factory (`mapSceneQueryKey`, `activeScenesQueryKey`) a konzumenta HP baru (`resolveCharacterHp` → `token.characterData.customData`). M-CEN census celé oblasti.
- **Cílová: L3–L4** — vitest invalidační test (M5) pro OPT + runtime multi-client (M4) pro nové C-RUN-08-1 (HP desync) a pro D-08-2/-3/-7. Neproběhlo (read-only, bez runtime).

## Stav známých nálezů (verifikace na HEAD)
- **C-24 🔓 OPRAVENO** — `token.remove` je teď `removeMutation` (optimistic patch + rollback + toast), `TacticalMapView.tsx:762-780`, použití `:2249`. Registr ho už vede jako opravený.
- **C-25 🔓 OPRAVENO** — `assignMutation`/`createScene` (`MapEmptyState.tsx:102-105,143-146`) i panel `mutation` (`MapPjPanel.tsx:158`) invalidují `activeScenesQueryKey`.
- **C-26 🔓 OPRAVENO** — `createSceneMutation` (`MapPjPanel.tsx:227`) používá factory `activeScenesQueryKey`, dead key `['map','world-scenes',…]` pryč.
- **D-08-8 🔓 OPRAVENO** — `useReassignmentListener.ts:30-33` má `useSocketReconnect` (S-RUN-02) → po reconnectu invaliduje `mapSceneQueryKey`. Reconnect re-join mezera uzavřena. `useActiveScenes.ts:76` (W-7) + `useMapWeather.ts:86` (FIX-5) rovněž mají reconnect fallback.
- **D-08-1 ♻️** — `diceMutation` (`useMapScene.ts:133`) stále bez onSettled/resync — by-design (koord. s dice log, dedup po `roll.id`). OK.
- **D-08-2 ♻️** — `moveMutation`/`effectMutation`/`fogMutation`/`broadcastSounds` (`TacticalMapView.tsx:737,805,837,684`) stále optimistic+rollback bez onSettled resync. Nově do rodiny patří **`handleToggleDoor`** (`scene.walls.replace`, `:708-736`) — stejný raw-post + `.catch` rollback bez resync. Spoléhá na WS echo (brush/single-shot). Známý vzor, by-design.
- **D-08-3 ♻️** — inline `combat.turn` (vyřazení tokenu na tahu) `TacticalMapView.tsx:2170-2179` stále `setQueryData` + `void postMapOperation` **bez onError rollback a bez resync**. Nezměněno.
- **D-08-4 ♻️** — `useUpdateGmNotes` (`api/useGmNotes.ts:29-36`) stále set-only bez WS push (per-PJ world-level, druhá karta stale do staleTime 30s). Set-only vzor jinak ✅.
- **D-08-6 ♻️** — `EditSceneModal onSaved` (`MapPjPanel.tsx:536-538`) stále invaliduje **inline literál** `['map','world-active-scenes',worldId]` místo factory `activeScenesQueryKey`. Komentář drift přiznává. Preventivní 🟡, nezměněno.
- **D-08-7 ♻️** — token `move`/`update` bez dedup po id v `applyOperationToScene` (`utils/applyOperationToScene.ts:42-68`); chrání seqNumber gate (`useMapScene.ts:166-203`). Nezměněno.
- **D-08-9 ♻️** — weather dual-source (`useMapWeather.ts:106`, `setAt` klientský čas) — by-design.

## Nové nálezy

### C-RUN-08-1 · 🟡 · `FO`/`WS`/P1 · Editace PC/NPC HP z combat panelu neobnoví token HP bar na mapě u ostatních klientů
- **Kde (mutace):** `useUpdateCharacterDiary` — `src/features/world/pages/api/useCharacterMutations.ts:177-190`; `onSuccess` dělá **jen** `qc.setQueryData(charactersQueryKey.subdoc(worldId,slug,'diary'), diary)` → **žádná** invalidace `mapSceneQueryKey`, **žádná** map operace (žádný `map:operation` WS broadcast do scene roomu).
- **Kde (volání z mapy):** všechny system combat panely — `GurpsCombatPanel.tsx:97`, `CocCombatPanel.tsx:222,232`, `Drd16CombatPanel.tsx:100`, `DndCombatPanel.tsx:109`, `Drd2/Drdh/DrdPlus/Shadowrun/Fate/Jad/Matrix/Pi CombatPanel` (grep `useUpdateCharacterDiary` v `components/token-panel/system-panels/`).
- **Kde (konzument):** token HP bar čte **scene snapshot** `token.characterData.customData` — `utils/resolveCharacterHp.ts:39-141` (komentář: „Data jsou na tokenu z BE enrichu… není potřeba extra fetch"). Diary = zdroj pravdy, snapshot je read-time enrich.
- **Dopad:** PJ/hráč sníží HP postavy v combat panelu → zapíše se do diary, ale token HP bar na ploše zůstane **stale pro VŠECHNY ostatní klienty** (staleTime scény 30 s; obnoví se až refetchem scény — tj. při dalším `map:operation` invalidate, focus/mount, nebo reconnect catch-up). Za aktivního boje (časté move/turn ops → `useCombat`/`useTokenUpdate` onSuccess invaliduje scénu) se dorovná rychle; v tiché výměně jen-HP (bez jiných ops) drží starý bar dlouho. Editující klient: **Coc/Gurps** si to propíšou lokálně (`syncTokenHp` — `CocCombatPanel.tsx:158-179`, `GurpsCombatPanel.tsx:187-208`), **ostatní systémy (Drd16/Drd2/Drdh/DrdPlus/Dnd/Jad/Shadowrun/Fate/Matrix/Pi) nemají syncTokenHp** → i editující klient vidí starý bar do refetche. Navíc `syncTokenHp` je `setQueryData` bez rollbacku → při selhání diary PATCH (jen toast) drží optimistickou HP hodnotu do refetche.
- **Trigger/viditelnost/workaround:** trigger = úprava HP PC/NPC z tokenového combat panelu na mapě · viditelnost = tichý stale HP bar (ne chyba) · workaround = jakákoli další scene op / F5 / 30 s staleTime.
- **Návrh:** buď (a) po `useUpdateCharacterDiary` v mapovém kontextu poslat `token.update` map operaci na `characterData.customData` (WS parita — dorovná všechny), nebo (b) sjednotit `syncTokenHp` do všech systémů + doplnit invalidaci `mapSceneQueryKey` v combat panelech (obnoví aspoň editujícího a při refetchi ostatní). Preferováno (a) — reálný multi-client sync HP baru.
- **Klasifikace:** 🆕 (v registru ani v §08 census není; cross-feature konzument oblast 05 diary ↔ oblast 08 scene snapshot — přesně P1 hot-spot „postava se čte na mapě jako token"). Osa `FO`+`WS`.
- **L:** L2 (statika: trasa mutace→konzument ověřena). Cíl L4 (runtime 2 klienti: uprav HP → sleduj druhý bar).

## Pokrytí (M-CEN census oblasti)
- **Mutace přes `mapSceneQueryKey`/ops:** move/effect/fog/sounds/door (optimistic+rollback, bez resync = D-08-2 rodina), token.update (`useTokenUpdate` — optimistic+rollback+gated invalidate ✅), remove (C-24 ✅), spawn (invalidate ✅), combat (`useCombat` optimistic+invalidate ✅), dice (D-08-1), palette activeOp PC/NPC/Bestie (`scene.activeCharacters/Bestie.add/remove` → invalidate; `applyOperationToScene:255-286` je patchuje ✅), inline combat.turn (D-08-3), clear-scene (`MapPjPanel.tsx:568` raw post + invalidate ✅), import UVTT (`useImportUvttScene.ts:85-89` scene+activeScenes+members ✅).
- **Scene-list / members mutace:** MapEmptyState/MapPjPanel assign+create (C-25 ✅), deactivate (úplné ✅), SceneAccessSection + AccessBoard (`:37-47`/`:46-51` scene+members+activeScenes ✅), LoadPrep apply (`LoadPreparationDialog.tsx:169-178` úplné ✅), MapLibrary load/save/delete (`:122-166` ✅), EditScene onSaved (D-08-6 drift).
- **Weather:** `useBroadcastWeather`/`useClearMapWeather` bez cache efektu (D-08-5 by-design, WS push `weather:updated` + FIX-5 reconnect ✅).
- **Read-only / bez mutací:** tokens/ (TokenHpBar/TokenLayer/TokenDiaryTab/TokenNotesTab), notebook/, sound/ (delegují na broadcastSounds), useMapDiceRoll (jen sestaví op), useEntitySchemaVersions (query).
- `applyOperationToScene` op coverage kompletní (exhaustive `never` check `:423-428`) — WS patch pokrývá všechny op typy vč. active-set/walls/lights/sounds.

## PROOF-REQUESTy
- **PR-1 (C-RUN-08-1, M4 runtime):** 2 klienti na téže scéně, PC token s HP barem. Klient A (PJ) sníží HP v combat panelu bez jiné akce. Ověř: aktualizuje se bar u klienta B do <2 s? (očekávání: NE, stale do 30 s / další op). Zopakuj pro Coc/Gurps (editor A vidí lokálně) vs Drd16/Dnd (editor A také stale).
- **PR-2 (C-RUN-08-1, M5 test):** vitest — spy `invalidateQueries`/broadcast po `useUpdateCharacterDiary`: neobsahuje `mapSceneQueryKey` ani token op → potvrzení chybějícího fan-outu na scene snapshot.
- **PR-3 (D-08-3, M4):** PJ vyřadí token zrovna „na tahu" + vynuť selhání POST → drží se posunuté `currentTokenId` v cache proti serveru? (rollback chybí).
- **PR-4 (D-08-2/-7, M4):** rychlý dvojitý move + drop WS echa před dorovnáním → stav drží / neskočí zpět (seqNumber gate).

## Shrnutí
Oblast od sweepu 2026-06-05 **zlepšena**: C-24/25/26 opraveny, reconnect re-join mezery (D-08-8) uzavřeny. Přetrvávají známé latentní 🟡 (D-08-2/-3/-4/-6/-7, by-design/preventivní). **1 nový nález** C-RUN-08-1 (🟡, cross-feature diary HP → map token snapshot desync).
