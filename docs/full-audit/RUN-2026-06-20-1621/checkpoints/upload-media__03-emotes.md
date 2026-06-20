# upload-media / 03-emotes — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Read-only. Cílová hloubka L3 statika.

## Pokrytí

Přečteno:
- BE: `emotes.service.ts`, `emotes.controller.ts`, `custom-emotes.repository.ts`, `custom-emote.schema.ts`, `create-emote.dto.ts`, `update-emote.dto.ts`, `copy-emote.dto.ts`, `emotes.gateway.ts`, `custom-emote.interface.ts`, `custom-emotes-repository.interface.ts`
- BE: `upload.service.ts` (handleMediaOrphaned, assertMagicBytes, uploadImageToFolder), `upload.controller.ts` (content-image endpoint)
- BE: `world-hard-delete.service.ts` (cascade, WORLD_SCOPED_COLLECTIONS)
- FE: `EmoteUploadDialog.tsx`, `validateEmoteFile.ts`, `buildEmoteUrl.ts`, `useUploadImage.ts` (shared), `useCreateEmote.ts`

Ověřeno: magic-byte (assertMagicBytes), rate-limit (Throttle), orphan při delete/update (media.orphaned event), scope auth (assertWorldCanManage / assertGlobalCanManage), kopírování emotů, world-hard-delete cascade, FE↔BE size limit kontrakt, tags field v repository.

## Dosažená L vs cílová L

**Dosaženo L3** (přečten + ověřen guard/MIME/limit napříč vrstvami). Vrstva L4+ (IDOR live test, přímý upload podvrženého souboru, M-ORPHAN Cloudinary sken) vyžaduje živou infru → PROOF-REQUEST.

## Stav oprav z minulého sweepu (2026-06-14)

### UM-04 — ✅ OPRAVENO (blob cleanup při delete/update)
`deleteFromWorld` (řádek 172-174) a `deleteGlobal` (řádek 187-189) emitují `media.orphaned` s `emote.imageUrl`. `applyUpdate` (řádek 253-258) emituje `media.orphaned` se starým URL při výměně obrázku. `upload.service.ts:712` handler `handleMediaOrphaned` existuje a volá `deleteImageByUrl`. Všechny 3 přímé cleanup cesty funkční. ✅

### UM-11 — ✅ OPRAVENO (TOCTOU orphan cleanup)
`cleanupOrphanedImage` (řádek 89-93) emituje `media.orphaned` ve všech konfliktních větvích: limit reached (řádky 102, 135) + shortcode taken (řádky 110, 143). ✅

### UM-10 — ✅ OPRAVENO (rate-limit na content-image)
`upload.controller.ts:137` má `@Throttle({ default: { ttl: 60_000, limit: 20 } })` na `/upload/content-image`. ✅

### UM-07 — ✅ OPRAVENO (magic-byte validace)
`assertMagicBytes` voláno v `uploadImageToFolder` (řádek 379) → pokrývá emote upload cestu. ✅

## Nálezy

### UM-RUN-01 — [DL/OR] Emote blobs při world hard-delete nejsou uklidněny 🆕
**Kde:** `world-hard-delete.service.ts:117` — `safeDelete('custom_emotes', { worldId })` maže dokumenty bez předchozího sběru `imageUrl` hodnot.

**Popis:** `WorldHardDeleteService.hardDelete` na řádku 116-119 provádí `deleteMany` na kolekci `custom_emotes` bez toho, aby předem posbíral všechny `imageUrl` a emitoval `media.orphaned`. Emote blob v Cloudinary zůstane bez odkazu — orphan. Srovnání: world `imageUrl` (řádky 91-101) se uklidí, ale emoty ne. Stránky (`pages`) a novinky (`worldnews`) jsou na tom stejně — ale ty jsou v záběru cascade-delete auditu, ne tohoto.

**Dopad:** Po 30denním recovery okně a hard-delete světa zůstanou v Cloudinary orphaned emote bloby (potenciálně desítky, limit 100/svět). Žádná automatická oprava. Storage leak.

**Návrh:** Před `safeDelete('custom_emotes', ...)` posbírat `imageUrl` přes `find({ worldId }, { projection: { imageUrl: 1 } })` a emitovat `media.orphaned` — vzor totožný s world.imageUrl sběrem na řádku 92-101.

**Závažnost:** 🟠 OR · L3 · 🆕

---

### UM-RUN-02 — [CT/SZ] FE size limit 512 KB pro emoty není enforcovaný na BE 🆕
**Kde:** `validateEmoteFile.ts:18` (FE MAX_EMOTE_BYTES = 512 KB) vs `upload.controller.ts:153` (BE `fileSize: 10 * 1024 * 1024` = 10 MB)

**Popis:** Emoty nahrávají přes `/upload/content-image` (shared endpoint, folder `content`). FE `validateEmoteFile` hlídá 512 KB jako UX guard. BE `content-image` endpoint akceptuje až 10 MB — bez vědomí, že žadatel je emote dialog. Kdokoli s platným JWT může obejít FE guard a nahrát 10 MB PNG jako emote. BE nemá žádnou emote-specifickou size validaci. Kontrakt: FE < BE = drift v neprospěch (FE přísnější, BE laxnější → exploitovatelné curl).

**Dopad:** 10 MB emote → pomalejší WS notifikace (emote:created nese celý objekt s imageUrl), potenciálně DoS Cloudinary upload quotou při spamu. Není RCE, ale obchází storage ochranu.

**Návrh:** Buď (a) přidat BE emote-specific size check v `emotes.service.create` (odmítnout imageUrl z Cloudinary přesahující ~512 KB — ale to je ex-post po uploadu), nebo (b) ideálně samostatný `/upload/emote-image` endpoint s multer limit 512 KB + emote-specific MIME whitelist. Varianta b) je čistší: oddělený folder + limit.

**Závažnost:** 🟡 CT/SZ · L3 · 🆕

---

### UM-RUN-03 — [CT/DL] Copy emote sdílí imageUrl — smazání kopie maže shared blob 🆕
**Kde:** `emotes.service.ts:306-314` (copy reuse imageUrl) + `emotes.service.ts:172-174` (deleteFromWorld emituje media.orphaned)

**Popis:** `service.copy()` vytvoří nový emote dokument se STEJNOU `imageUrl` a `imageId` jako zdrojový (řádky 310-311). Neexistuje ref-count ani flag `sharedBlob`. Když pak uživatel smaže zkopírovaný emote, `deleteFromWorld` emituje `media.orphaned` s tím URL → `handleMediaOrphaned` smaže blob z Cloudinary → zdrojový emote má broken image. To samé platí pro globální→world kopii: `deleteGlobal` by smazal sdílený blob.

**Dopad:** Smazání kopie poškodí zdrojový emote (broken image). Obtížně detekovatelné, protože k chybě dojde asynchronně a na zdánlivě nesouvisejícím místě.

**Návrh:** Při copy buď (a) znovu nahrát obrázek na Cloudinary (vlastní blob) — drahé, ale clean; nebo (b) při `media.orphaned` nejdříve ověřit, zda `imageUrl` je stále referencována jinou entitou (`repo.findByImageUrl`); nebo (c) v `copy` nastavit flag `isCopy: true` a v delete skipmout blob cleanup pro kopie. Varianta b) je systémová, ale přidává DB dotaz do critical path.

**Závažnost:** 🟠 DL/OR · L3 · 🆕

---

### UM-RUN-04 — [CT] Tags field ztracen při `repo.create` — tichý field drop 🆕
**Kde:** `custom-emotes.repository.ts:72-79` (`model.create` bez `tags`) vs `custom-emote.schema.ts:29-31` (`@Prop({ type: [String], default: [] })`) vs `emotes.service.ts:123` (`tags: dto.tags ?? []`)

**Popis:** `service.create` předá `tags` do `repo.create(data)`. `repo.create` mapuje pole explicitně — a `tags` chybí na řádcích 72-79. Mongoose schema má `tags` s `default: []`, takže nový dokument bude mít prázdné pole (schema default), i když DTO obsahovalo tagy. Kategorizace emotu je tiše zahozena.

**Dopad:** `CreateEmoteDto.tags` (max 10, validováno BE) se nikdy neuloží → admin grid filtrování po tagách nefunguje pro nově vytvořené emoty. Validace prochází, response vrátí `tags: []` (z toEntity přečte uložený dokument). Funkce `D-NEW-emote-categories` je de-facto nefunkční.

**Návrh:** Přidat `tags: data.tags ?? []` do objektu v `model.create(...)` na řádku 72 repository.

**Závažnost:** 🟠 CT · L3 · 🆕

---

### UM-RUN-05 — [CT] Tags field chybí v `updateById` whitelist 🟡 (spojeno s UM-RUN-04)
**Kde:** `custom-emotes-repository.interface.ts:13-17` (`updateById` Partial Pick chybí `tags`) + `custom-emotes.repository.ts:83-97`

**Popis:** `ICustomEmotesRepository.updateById` přijímá jen `Partial<Pick<..., 'name'|'shortcode'|'imageId'|'imageUrl'>>`. `tags` v Pick chybí. `UpdateEmoteDto` má `tags?: string[]`. Pokud by service chtěla aktualizovat tagy, interface to neumožňuje. Aktuálně `applyUpdate` tagy vůbec neaktualizuje (fields `tags` v `updates` vždy chybí) — takže není způsob, jak opravit špatné tagy na existujícím emotu přes PATCH.

**Dopad:** Tagy jsou write-once (a i to nefunguje — viz UM-RUN-04). Admin bez možnosti editace tagů.

**Návrh:** Přidat `tags` do updateById interface + implementace + applyUpdate.

**Závažnost:** 🟡 CT · L3 · 🆕

## PROOF-REQUEST

**PR-03-A** (L4/L5 — shared blob delete test): Ověřit živě: (1) vytvoř emote A ve světě X, (2) zkopíruj do světa Y → vznikne emote B se stejnou imageUrl, (3) smaž emote B → ověř, zda Cloudinary blob stále existuje nebo byl smazán (broken image na emotu A). Potřebuje živou instanci + Cloudinary Admin API nebo manuální load image po smazání kopie.

**PR-03-B** (L5 — BE size bypass): curl `POST /upload/content-image` s autentizací a souborem 600 KB (`> 512 KB`) → ověřit, zda BE vrátí 200 nebo 413. Očekávání: 200 (BE limit 10 MB) = potvrzení UM-RUN-02.

**PR-03-C** (L4 — tags persistence): Po opravě UM-RUN-04 ověřit e2e: create emote s `tags: ['fantasy']` → GET emotes → ověřit `tags` v response. Aktuálně L3 statika dostatečná pro nález, ale e2e potvrdí opravení.

**PR-03-D** (L5 — world hard-delete blob check): Po world hard-delete ověřit přes Cloudinary Admin API, zda `content/` folder stále obsahuje emote assety světa (M-ORPHAN scan). Vyžaduje Cloudinary Admin API přístup.
