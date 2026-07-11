# Checkpoint — upload-media / 05-mapy-tokeny

**Oblast:** `docs/upload-media-plan/05-mapy-tokeny.md` (mapa background + token image, privátní mapy)
**Styl:** upload-media (registr `docs/upload-media-audit.md`, prefix `UM-`; RUN `UM-RUN`)
**Datum:** 2026-07-11
**Dosažená L:** L3 (delete/replace cesty + cascade + privacy gating ověřeny; `maps.service.replace:260` ověřen ručně).
**Cílová L:** L3.

Přečteno: `maps.service.ts` (deleteScene:381, replace:245, enrichTokens:424), `world-maps.service.ts` (remove:245, update:224, list/stripForPlayer:132), `map-operations.service.ts` (scene.image FIX-31:842), `map-templates` controller+repo, `maps.repository.ts` toToken:173, `world-hard-delete.service.ts` (mapScenes/worldMapEntries v BLOB_COLLECTIONS), `world-maps.controller.ts` assertCanViewAtlas.

---

## Stav dřívějších oprav (regrese-check — UM-05 DRŽÍ)

**UM-05** ✅ `media.orphaned` na všech hlavních delete/replace cestách:
- `maps.service.ts:381-383` `deleteScene` → emit `media.orphaned{urls:[scene.imageUrl]}` (+ `clearSceneForAll` CD-04).
- `world-maps.service.ts:245-247` `remove` → emit pro `prev.imageUrl`; `:224-230` `update` (UM-03) → emit při výměně.
- `map-operations.service.ts:842-844` **FIX-31** `scene.image` op (in-place výměna pozadí, hlavní cesta) → emit pro staré `scene.imageUrl`.

**Cascade** ✅ `mapScenes`, `worldMaps`, `worldMapEntries`, `worldMapFolders`, `mapOperations` ve `WORLD_SCOPED_COLLECTIONS`; `mapScenes:['imageUrl']` + `worldMapEntries:['imageUrl']` v `BLOB_COLLECTIONS`.

**Token** ✅ token NEMÁ vlastní blob — `maps.repository.ts:173-212` `toToken` bez `imageUrl`; obrázek enriched z Page (`maps.service.ts:424` `imageUrl: page?.imageUrl`), „nikdy se neukládá do DB". Žádný dedikovaný token upload endpoint. Mazání tokenu/scény neosiří token-blob.

**Privacy metadata gating** ✅ `world-maps.controller.ts:52/166` `assertCanViewAtlas` (private → jen členové/admin); `world-maps.service.ts:132-151` `list` filtruje `isPublic||visibleToPlayerIds`; `stripForPlayer:158-173` maže tajné piny + visibleToPlayerIds.

---

## Nové nálezy (🆕)

### UM-RUN-05-01 — Sdílený Cloudinary blob mezi `mapScenes` a `mapTemplates` → orphan cleanup zabije blob přežívající šablony (osa DL/OR, 🟠) ⭐
- **Kde:** `map-templates.repository.ts:55-60` `create` ukládá `imageUrl` jako **passthrough string** (žádný re-upload) → šablona sdílí Cloudinary asset se zdrojovou scénou. Symetricky `maps.service.ts:185-198` scéna ze šablony (`templateId`) přebírá `imageUrl` šablony. `upload.service.ts:844-851` `handleMediaOrphaned` smaže KAŽDOU URL **bez ref-countingu**.
- **Důkaz:** hard-delete světa → `collectBlobs('mapScenes',['imageUrl'])` → `media.orphaned` → smaže blob, který cross-world `mapTemplates` (per-owner, mimo cascade) stále používá → rozbitý náhled šablony. Stejně `deleteScene` (UM-05) a `scene.image` op (FIX-31). **Přesně scénář, který měl „šablona přežije smazání světa" vyloučit** — dokument přežije, blob ne.
- **Dopad:** 🟠 — kořen = chybějící reference-counting v orphan cleanup (systémové, viz UM-RUN-00-03 emote copy, stejný vzor).
- **Návrh:** map-template create re-uploadne blob (vlastní publicId), nebo `handleMediaOrphaned` ověří reference před destroy.
- **L:** L3. Klasifikace: 🆕.

### UM-RUN-05-02 — `PUT /maps/:id` (legacy scene replace) neuklízí staré pozadí (osa OR/DL, 🟡)
- **Kde:** `maps.service.ts:245-265` `replace` přepíše scénu vč. `imageUrl` (`repo.replace`, ověřeno ručně — `:260` `this.repo.replace(id, {...dto, worldId})`) **bez** `media.orphaned` emitu. Operations cesta (`scene.image` FIX-31) i `deleteScene` (UM-05) emit mají, legacy `PUT` ne. Endpoint živý (`maps.controller.ts:145-161`).
- **Dopad:** 🟡 — pokud FE mění pozadí přes `PUT /maps/:id` místo scene.image op, starý blob leakne.
- **L:** L3 (replace přečten ručně). Klasifikace: 🆕.

### UM-RUN-05-03 — `map-templates` delete/replace bez `media.orphaned` (osa OR, 🟡)
- **Kde:** `map-templates.controller.ts:174-195` `delete` → `repo.delete` bez eventu; `PUT replace:134-165` při změně imageUrl bez emitu.
- **Dopad:** 🟡 — pokud je blob šablony jediný referent (scéna už smazána), leakne. Kvůli sdílení (UM-RUN-05-01) je „neemitovat" defenzivní, ale bez ref-countingu trvalý zdroj orphanů.
- **L:** L3. Klasifikace: 🆕.

### UM-RUN-05-04 — `npcTemplates[].imageUrl` mimo cleanup whitelist (osa OR, 🟡 nízká jistota)
- **Kde:** `map-scene.interface.ts:143` + `maps.repository.ts:226` `MapSceneNpc.imageUrl`. `deleteScene` emituje jen top-level `scene.imageUrl`; hard-delete `collectBlobs('mapScenes',['imageUrl'])` bere jen top-level pole, **ne vnořené** `npcTemplates[].imageUrl`. `npcTemplate.remove` op (map-operations:1217) také neuklízí.
- **Dopad:** 🟡 — leak JEN pokud je `npcTemplate.imageUrl` dedikovaný upload; dle 3-tier modelu (NPC = reference na Character/Page) spíš sdílená reference → pravděpodobně neškodné. Doporučení: potvrdit původ pole.
- **L:** L2-L3 (field existuje, původ neověřen). Klasifikace: 🆕 nízká jistota.

---

## Prošlé / ověřené OK + potvrzené známé

- **UM-02 🟠 potvrzeno, stále otevřené:** pozadí privátní/tajné mapy (`worldMapEntries.imageUrl` i `!isPublic`/mimo `visibleToPlayerIds`; `mapScenes.imageUrl`) = veřejná `secure_url`, žádný signed/token/expirující URL, žádný per-asset ACL. GET filtruje jen METADATA (které mapy hráč v seznamu vidí), blob veřejně dostupný komukoli s URL. Vyžaduje signed delivery / proxy — beze změny (akceptováno registrem).
- **FIX-16 (cross-world IDOR)** drží: `replace`/`setActive` autorizuje proti `scene.worldId` (ne dto), `assertCanManage`.
