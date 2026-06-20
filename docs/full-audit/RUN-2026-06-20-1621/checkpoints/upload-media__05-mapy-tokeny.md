# upload-media / 05-mapy-tokeny — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Auditor: hloubkový agent (read-only).

## Pokrytí

Přečteno HEAD kódu:
- BE: `maps.service.ts`, `maps.controller.ts`, `maps.repository.ts`, `map-operations.service.ts` (scan celý), `map-templates.controller.ts`, `map-template.schema.ts`, `map-template.interface.ts`, `map-scene.schema.ts`, `map-scene.interface.ts`, `npc-template-ops.dto.ts`, `world-maps.service.ts`, `world-maps.controller.ts`, `world-hard-delete.service.ts`, `upload.service.ts` (handleMediaOrphaned + deleteImageByUrl), `upload.controller.ts`
- FE: `MapEditorModal.tsx`, `EditSceneModal.tsx`, `MapLibraryModal.tsx`, `MapBackground.tsx`, `useUploadImage.ts`, `types.ts`
- Registr `upload-media-audit.md`, plán `05-mapy-tokeny.md`, `README.md`

## Dosažená L vs cílová L

Cíl oblasti dle plánu: L3 (statická analýza přes vrstvy). Dosaženo: **L3** (přečten celý tok FE→controller→service→event→handler, schema, mapper).

## Nálezy

### UM-05 (původní) — stav po opravě

**`maps.service.deleteScene` → emit `media.orphaned`:** opraveno ✅ (`maps.service.ts:339` emituje blob pozadí).  
**`world-maps.service.remove` → emit `media.orphaned`:** opraveno ✅ (`world-maps.service.ts:185` emituje blob).  
**`world-maps.service.update` replace → emit `media.orphaned`:** opraveno ✅ (`world-maps.service.ts:168-170`).

---

### UM-RUN-01 — [DL/OR] `scene.image` operation nemaže starý blob
- **Kde:** `map-operations.service.ts:761-766` (applyAtomic case `scene.image`)
- **Co:** Operace `scene.image` atomicky přepíše `imageUrl` scény (`$set imageUrl`), ale `MapOperationsService` **nemá injektovaný `EventEmitter2`** (ověřeno: žádný `EventEmitter` import/inject v souboru). Starý blob backgroundu zůstane orphan.
- **Toto je hlavní cesta změny pozadí scény** — `EditSceneModal.tsx:63-64` posílá `{ type: 'scene.image', imageUrl }` přes Operations API, ne přes `PUT /maps/:id`. Cesta `PUT /maps/:id → maps.service.replace` rovněž **nemá orphan cleanup** (`:213-225` chybí emit před `repo.replace`), ale je označena jako nový PUT endpoint, méně frekventovaný.
- **Dopad:** Každé přenastavení pozadí scény (běžný PJ flow „nahraj novou mapu") leakne starý Cloudinary blob navždy. Blob má nahodilé public_id (ne `overwrite`), každá změna = permanentní orphan.
- **Návrh:** Do `applyAtomic` case `scene.image` načíst `scene.imageUrl` (snapshot je k dispozici v `apply()` jako lokální var `scene`) a po atomicUpdate emitovat `this.eventEmitter.emit('media.orphaned', { urls: [scene.imageUrl] })`. Injektovat `EventEmitter2` do `MapOperationsService`.
- **L3** · 🆕

---

### UM-RUN-02 — [DL/OR] `map-templates.controller.delete` nemaže blob šablony
- **Kde:** `map-templates.controller.ts:169-189` (`DELETE /map-templates/:id`)
- **Co:** Smazání knihovní šablony mapy volá `this.repo.delete(id)` bez jakéhokoli blob cleanup. `MapTemplate.imageUrl` (required field, `map-template.schema.ts:19`) ukazuje na Cloudinary blob. Šablona je per-PJ (`ownerId`), cross-world → není ve `WORLD_SCOPED_COLLECTIONS`, takže world hard-delete ji také neuklidí.
- **Dopad:** Smazaná šablona = trvalý orphan Cloudinary blob.
- **Návrh:** Před `repo.delete` načíst existing (již se načítá na `:175`) → emitovat `media.orphaned { urls: [existing.imageUrl] }`. Potřeba injektovat `EventEmitter2` do `MapTemplatesController` nebo přesunout logiku do service.
- **L3** · 🆕

---

### UM-RUN-03 — [DL/OR] `map-templates.controller.replace` nemaže starý blob při update
- **Kde:** `map-templates.controller.ts:130-160` (`PUT /map-templates/:id`)
- **Co:** Update šablony mapLibrary (`MapLibraryModal`) načte `existing` (`:137`), pak volá `repo.replace`. Pokud `dto.imageUrl !== existing.imageUrl`, starý blob zůstane orphan — žádný emit `media.orphaned`.
- **Dopad:** PJ přenastaví background šablony → starý blob leak.
- **Návrh:** Analogie UM-RUN-02 — po repo.replace emitovat pokud `dto.imageUrl && existing.imageUrl && dto.imageUrl !== existing.imageUrl`.
- **L3** · 🆕

---

### UM-RUN-04 — [DL/OR] Hard-delete světa nemaže bloby scene backgrounds + world-map images
- **Kde:** `world-hard-delete.service.ts:117-118` + `map-scene.schema.ts`, `world-map-entry.schema.ts`
- **Co:** `WorldHardDeleteService.hardDelete` smaže kolekce `mapScenes` a `worldMaps` pomocí bulk `deleteMany({ worldId })`. Před smazáním **nebere seznam imageUrl** dokumentů a neemituje `media.orphaned`. Výsledek: všechny Cloudinary bloby backgroundů scén a map atlasu světa zůstanou navždy ve Cloudinary.
- **Porovnání:** World's own `imageUrl` se uklidí (`:98-101`), ale scene/worldMap bloby ne.
- **Dopad:** Hard-delete světa (po 30d soft-delete) leakne N Cloudinary blobů (počet scén + počet map atlasu).
- **Návrh:** Před `safeDelete('mapScenes', ...)` projít `mapScenes.find({ worldId }, { imageUrl: 1 })` a emitovat `media.orphaned { urls }`. Stejně pro `worldMaps`. Best-effort, try/catch.
- **L3** · 🆕

---

### UM-RUN-05 — [DL/OR] Scene npcTemplate inline imageUrl bez lifecycle cleanup
- **Kde:** `map-scene.interface.ts:82-85` (`MapSceneNpc.imageUrl?: string`), `map-operations.service.ts` handlers `npcTemplate.add`/`npcTemplate.update`
- **Co:** `MapSceneNpc` (NPC šablona v scéně) má volitelné `imageUrl`. Při `npcTemplate.update` s novým imageUrl (`patch.imageUrl`) starý blob nemaže nikdo (handler jen `$pull`/`$push`/patch v Mixed array). Při `npcTemplate.remove` se odstraní záznam z DB, blob zůstane. Při `deleteScene` se emituje jen `scene.imageUrl`, ne `npcTemplates[*].imageUrl`.
- **Dopad:** Rozsah nižší (NPC imageUrl není povinné, závisí na FE přidání), ale existuje cesta: `npcTemplate.add { template: { imageUrl: ... } }` + `npcTemplate.remove` = orphan.
- **Návrh:** V `applyAtomic` handler `npcTemplate.remove` — lookup `scene.npcTemplates.find(templateId)`, pokud `tpl.imageUrl` → emit `media.orphaned`. V `deleteScene` iterovat `scene.npcTemplates.map(t => t.imageUrl).filter(Boolean)` a přidat do emitu.
- **L3** · 🆕

---

### Pozitiva (anti-nálezy ověřeny)

- **Token imageUrl nemá vlastní blob** — tokeny berou `imageUrl` z `Page.imageUrl` přes `enrichTokens` (`maps.service.ts:361-363`). `toToken` mapper neobsahuje imageUrl (z DB), jen `characterData.imageUrl` je enrich runtime. Token smazání/replace = bez blob lifecycle issue. ✅
- **UM-05 původní opravena**: `deleteScene` emituje `scene.imageUrl` (`:339-341`), `world-maps.service.remove` emituje (`:185-187`), update replace emituje (`:168-170`). ✅
- **Upload kanál scene background**: `useUploadImage → POST /upload/content-image` (JwtAuthGuard, rate-limited 20/min). ✅
- **Scene GET access**: `GET /maps/:id` ověří `authorizer.assertCanReadScene` (`:107`), hráč vidí jen přidělenou scénu. ✅
- **World-maps GET filtrace** `visibleToPlayerIds` server-side bez leaku (`:116`). ✅

## PROOF-REQUEST

| # | Vrstva | Popis |
|---|---|---|
| PR-1 | L4/L5 | Ověřit live: PJ změní background scény (`scene.image` op) → Cloudinary Admin API — starý blob existuje (UM-RUN-01 dokazovat probe) |
| PR-2 | L4/L5 | Ověřit live: PJ smaže šablonu mapy → starý `imageUrl` blob ve Cloudinary stále existuje (UM-RUN-02) |
| PR-3 | L4/L5 | World hard-delete probe — po smazání světa zbývají scene background bloby ve Cloudinary (UM-RUN-04) |

Tyto vrstvy vyžadují živou infrastrukturu (Cloudinary Admin API klíč + testovací data) — označeny jako **PROOF-REQUEST**, ne jako ověřeno.
