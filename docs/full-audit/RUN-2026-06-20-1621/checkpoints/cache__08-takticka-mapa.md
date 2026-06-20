# cache / 08-takticka-mapa — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem VEŠKERÝ kód oblasti:
- `hooks/`: useMapScene.ts, useActiveScenes.ts, useCombat.ts, useTokenUpdate.ts, useMapSocket.ts, useReassignmentListener.ts, useMapWeather.ts, useMapTheme.ts
- `api/`: useGmNotes.ts, mapApi.ts, worldOpsApi.ts
- `components/pj-panel/`: MapPjPanel.tsx, MapEmptyState.tsx, MapLibraryModal.tsx, SceneAccessSection.tsx, LoadPreparationDialog.tsx, EditSceneModal (onSaved callback in MapPjPanel)
- `TacticalMapView.tsx` — všechny inline mutace/setQueryData (moveMutation, removeMutation, spawnMutation, effectMutation, fogMutation, broadcastSounds, inline combat.turn)
- Git log post-2026-06-05 — 11 commitů dotklo se tactical-map souborů (identifikace nových cache-relevantních změn)

Metody: M1 (statické čtení) + M2 (key-match simulace) + git-diff verifikace oprav.

## Dosažená L vs cílová L

| Oblast | Dosažená | Cílová |
|---|---|---|
| Statická analýza (M1/M2) | **L2** | L2 |
| Existující testy (M3) | ⬜ nespuštěny | L3 |
| Runtime (M4) | ⬜ živá infra — PROOF-REQUEST | L4 (pro OPT/DEL kritické) |

Statisticky: L2 dosaženo pro všechna ověřitelná tvrzení. Destruktivní a optimistic operace (D-08-2, D-08-3) vyžadují M4 pro L3/L4.

## Nálezy

### Verifikace předchozích nálezů (C-24, C-25, C-26)

**C-24 ✅ OPRAVENO v HEAD** — `token.remove` je nyní `removeMutation` (TacticalMapView.tsx:519-537) se správným optimistic patch + rollback + toast. Volající na line 1513 používá `removeMutation.mutate()`. ♻️

**C-25 ✅ OPRAVENO v HEAD** — `activeScenesQueryKey` invalidován ve všech třech místech:
- MapEmptyState.tsx:86-89 (`assignMutation.onSuccess`) ✅
- MapEmptyState.tsx:126-129 (`mutation.onSuccess` = createScene) ✅
- MapPjPanel.tsx:139-141 (`mutation.onSuccess` = assign self) ✅ ♻️

**C-26 ✅ OPRAVENO v HEAD** — `createSceneMutation.onSuccess` (MapPjPanel.tsx:205-207) používá `activeScenesQueryKey(worldId)` factory, komentář „C-26" potvrzen. ♻️

### Nový nález

**C-RUN-08-01 — `KM`/`LC` · D-08-6 eskalace: EditScene `onSaved` inline literál trvá v HEAD**
- **Kde:** `MapPjPanel.tsx:448` — `queryClient.invalidateQueries({ queryKey: ['map', 'world-active-scenes', worldId] })`
- **Popis:** Komentář na řádku 446 přiznává: „useActiveScenes query key (z hooks/useActiveScenes.ts)" — ale kód je inline literál, ne `activeScenesQueryKey(worldId)` factory import. Dnes se oba shodují (factory = `['map', 'world-active-scenes', worldId]`), ale drift-trap: refactor factory klíče by tuto invalidaci tiše rozbil.
- **Dopad:** 🟡 Latentní drift-trap — žádný současný bug. Při přejmenování factory-klíče `activeScenesQueryKey` bude EditScene `onSaved` invalidovat do prázdna a PJ panel aktivních scén se neobnoví po přejmenování scény (jen přes WS broadcast nebo staleTime 60s). Preventivní.
- **Návrh:** Importovat `activeScenesQueryKey` (už je v souboru importován) a nahradit inline literál: `queryKey: activeScenesQueryKey(worldId)`. Jednořádkový fix.
- **L2** · 🔓 (eskalace z D-08-6 na plný nález)

### Verifikace latentních bodů (D-08-x)

**D-08-1 ✅** — `diceMutation` bez onSettled — záměr potvrzen v kódu, dedup po `roll.id`. ✅

**D-08-2 🟡 TRVÁ** — `moveMutation`/`effectMutation`/`fogMutation`/`broadcastSounds` nemají `onSettled invalidate`. Stav stejný jako sweep 2026-06-05. Záměr (brush spam). PROOF-REQUEST pro M4.

**D-08-3 🟡 TRVÁ** — inline `combat.turn` při vyřazení tokenu na tahu (TacticalMapView.tsx:1429-1443): `queryClient.setQueryData(...)` + `void postMapOperation(...)` bez onError rollback a bez resync. Stav zachován. PROOF-REQUEST pro M4.

**D-08-4 🟡 TRVÁ** — `useGmNotes` bez WS push (per-PJ, edge, záměrně). ✅ strukturálně OK.

**D-08-5 ⚖️** — weather mutace bez cache efektu = by-design (WS push). ✅

**D-08-6 → C-RUN-08-01** (eskalace výše).

**D-08-7 🟡 TRVÁ** — token `move`/`update` nemají dedup po id (chrání seqNumber gate). PROOF-REQUEST.

**D-08-8 ✅ OPRAVENO** — `useReassignmentListener` nyní má `useSocketReconnect` callback (commit 7a5e7a57 „testy", diff potvrzen). ♻️

**D-08-9 🟡 TRVÁ** — weather dual-source + klientský `setAt` čas. Konvergence OK (BE ukládá do World), bez akce.

## PROOF-REQUEST

> Tyto body nelze ověřit staticky (živá infra). Cílová úroveň L4 = M4 runtime.

| PR-xx | Cíl | Scénář | Přijatelný výsledek |
|---|---|---|---|
| **PR-08-1** | D-08-2: move/effect/fog bez onSettled | Posuň token → odpoj socket před WS echem → počkej 10s → zkontroluj stav na mapě | Token/efekt/mlha drží optimistic lokálně, po reconnectu catch-up dorovná (nebo staleTime 30s refetch) |
| **PR-08-2** | D-08-3: inline combat.turn bez rollback | PJ vyřadí token z boje (inCombat=false), ten je zrovna na tahu → POST selže (network off) → zkontroluj `currentTokenId` na iniciativní liště | Bug: liška ukazuje přesunutý `currentTokenId` (setQueryData proběhl), server ne → divergence |
| **PR-08-3** | D-08-7: token move dedup seqNumber | Rychle posuň token dvakrát, první echo přijde opožděně → zkontroluj finální pozici | Token je na druhé (finální) pozici; první echo zahozeno jako duplicate seqNumber |
