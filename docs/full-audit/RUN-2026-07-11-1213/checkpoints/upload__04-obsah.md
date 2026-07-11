# Checkpoint — upload-media / 04-obsah

**Oblast:** `docs/upload-media-plan/04-obsah.md` (hero/page/galerie/news/timeline/game-event/group/plants/nabory, replace orphan, kdo smí)
**Styl:** upload-media (registr `docs/upload-media-audit.md`, prefix `UM-`; RUN `UM-RUN`)
**Datum:** 2026-07-11
**Dosažená L:** L3 (replace+delete cesty × 10 entit ověřeny; klíčové 🟠 ověřeny ručně — worlds.service:1744, world-hard-delete BLOB_COLLECTIONS:86).
**Cílová L:** L3.

Přečteno: pages/worlds/chat/world-news/game-events/timeline/ikaros-gallery/plants/nabory service (replace+delete cesty), `world-hard-delete.service.ts` (BLOB_COLLECTIONS:80-95 + projection), `upload.service.ts` listenery, FE `useUploadImage` (2 varianty).

---

## Stav dřívějších oprav (regrese-check — DRŽÍ, největší orphan povrch pokryt)

**UM-03** ✅ generický `media.orphaned` zapojen na REPLACE i DELETE napříč VŠEMI content entitami:

| Entita | replace→`media.orphaned` | delete→cleanup | Důkaz |
|---|---|---|---|
| pages hero + galerie | ✅ hero + galerie diff | ✅ `page.deleted{imageUrl,galleryUrls}` | pages.service |
| worlds imageUrl + themeBg | ✅ oba (worlds.service:698-714) | ⚠️ jen imageUrl (viz UM-RUN-04-01) | worlds.service |
| chat group/channel | ✅ updateGroup/updateChannel | ✅ group+kanály, channel | chat.service |
| world-news | ✅ update | ✅ delete + world-scope | world-news.service |
| game-events | ✅ update | ✅ delete | game-events.service |
| timeline | ✅ update | ✅ delete | timeline.service |
| ikaros-gallery | n/a (DTO bez imageUrl) | ✅ `deleteImage(publicId)` (drží publicId) | ikaros-gallery.service |

- **world-hard-delete** `BLOB_COLLECTIONS` sbírá blob pole PŘED deleteMany (emotes/mapScenes/chatgroups/bestiae/worldMapEntries/worldmemberships/pages/chatchannels/game_events/timeline_events/worldnews/campaignSubjects + pages.galleryImages extraktor). Emituje `media.orphaned`. ✅
- **UM-10** potvrzeno: `content-image` open každému přihlášenému, jen `@Throttle 20/min`, **žádná per-user byte kvóta** (cross-ref UM-RUN-00-02).
- **UM-13** potvrzeno: dva `useUploadImage` — shared `/content-image` (12+ konzumentů) vs legacy `/upload/image` (Admin, volají jen `NewsFormModal.tsx` + `IkarosEventModal.tsx` = admin obsah, gate správný). Kolize názvu = riziko špatného importu (🟡).

---

## Nové nálezy (🆕)

### UM-RUN-04-01 — World `themeBackgroundUrl` leakuje při hard-delete světa (osa DL/OR, 🟠)
- **Kde:** `world-hard-delete.service.ts:139` projekce jen `{imageUrl:1, deletedAt:1}`, emit `world.image.removed` jen pro `imageUrl` (:148-151). `worlds` **není** v `BLOB_COLLECTIONS` → `themeBackgroundUrl` (vlastní Cloudinary blob motivu světa) se nikdy nesbírá.
- **Důkaz:** replace za běhu JE uklizený (`worlds.service.ts:705-711` emituje orphaned pro starý themeBackgroundUrl), ale trvalé smazání světa s vlastním pozadím motivu → blob navždy.
- **Dopad:** 🟠 orphan (1 blob per svět s custom pozadím).
- **Návrh:** přidat `themeBackgroundUrl` do projekce + emit, nebo `worlds:['imageUrl','themeBackgroundUrl']` do BLOB_COLLECTIONS.
- **L:** L3 (BLOB_COLLECTIONS:80-95 přečten ručně — potvrzeno, worlds chybí). Klasifikace: 🆕.

### UM-RUN-04-02 — Per-člen `themeBackgroundUrl` (5.9b) neuklízený ve 3 cestách (osa OR/DL, 🟠) ⭐
- **Kde:** reálný Cloudinary blob — `MyThemeTab.tsx:94` upload → `/upload/content-image` → `worldmemberships.themeBackgroundUrl` (worlds.service:1744-1745).
  1. **Replace:** `updateMyTheme:1744` přepíše `patch.themeBackgroundUrl` **bez** `media.orphaned` (ověřeno ručně).
  2. **Odchod/odebrání člena:** `world.membership.removed` listenery jen WS gateway + chat.service; **žádný upload listener** nečistí member bloby.
  3. **Hard-delete světa:** `BLOB_COLLECTIONS.worldmemberships = ['avatarUrl','pjPersonaAvatarUrl']` (:86) — `themeBackgroundUrl` **chybí** (ověřeno ručně).
- **Dopad:** 🟠 — násobí se (per-svět × per-člen × každá změna motivu/odchod). Každý člen si mění pozadí → hromada orphanů.
- **Návrh:** emit orphaned v `updateMyTheme`; přidat `themeBackgroundUrl` do BLOB_COLLECTIONS.worldmemberships; account/membership-removed listener.
- **L:** L3 (worlds.service:1744 + BLOB_COLLECTIONS:86 přečteny ručně). Klasifikace: 🆕.

### UM-RUN-04-03 — `WorldSettings.groupImages` (znaky skupin) leakují při hard-delete (osa DL/OR, 🟡)
- **Kde:** `world-settings.schema.ts:15` `groupImages: Record<string,string>` (URL emblémů). `worldsettings` je ve `WORLD_SCOPED_COLLECTIONS` (:67) → smaže se `deleteMany`, ale **není v BLOB_COLLECTIONS** → bloby se neseberou. Replace znaku skupiny také pravděpodobně bez orphan emitu.
- **Dopad:** 🟡 (nižší objem — pár znaků per svět).
- **L:** L3. Klasifikace: 🆕.

### UM-RUN-04-04 — nabory: blob leak (delete + replace + smazání účtu) (osa DL/OR/AU, 🟠) — potvrzuje CD-NEW-4
- **Kde:** `nabory.service.ts:158-162` `delete` → jen `repo.delete(id)`, **žádný blob cleanup / `media.orphaned`**; `patch` imageUrl replace (:149) bez emitu. Kolekce `nabory` **NENÍ** ve `WORLD_SCOPED_COLLECTIONS` ani `BLOB_COLLECTIONS`, přestože má `worldId?` (schema:11) i `imageUrl?` (:16). Žádný `user.deletion.hardDeleted` listener.
- **Dopad:** 🟠 — osiřelé `imageUrl` bloby při každém smazání/výměně + dangling `worldId` po hard-delete světa + bloby autora přežijí smazání účtu (nabory zanikají jen 30d expiry).
- **Návrh:** `nabory` do WORLD_SCOPED + BLOB_COLLECTIONS; `delete`/`patch` emit `media.orphaned`; account listener.
- **L:** L3. Klasifikace: 🆕 (potvrzuje cascade-delete CD-NEW-4 z upload perspektivy).

### UM-RUN-04-05 — plants (herbář): blob leak (update + remove + smazání účtu) (osa DL/OR/AU, 🟠) — potvrzuje CD-NEW-5/CD-PLANT-1
- **Kde:** `plants.service.ts:86-104` `update` (imageUrl replace) bez emitu; `remove:120-135` bez cleanup — **kód to sám přiznává** (:131-133 komentář „úklid osiřelého imageUrl blobu tu ZATÍM neřešíme — herbář nemá napojení na media.orphaned"). Žádný `user.deletion.hardDeleted` listener.
- **Dopad:** 🟠 — `imageUrl` rostliny na Cloudinary při KAŽDÉ výměně i smazání; herbář bez soft-delete → nevratné hned; bloby autora přežijí smazání účtu.
- **Návrh:** vzor bestiae — `update` diff → `media.orphaned`; `remove` → emit; account listener (`findImageUrlsByOwner`+`deleteAllByOwner`).
- **L:** L3. Klasifikace: 🆕 (potvrzuje CD-NEW-5 + vstupní CD-PLANT-1).

---

## Prošlé / ověřené OK

- **ikaros-gallery čistá:** replace nemožný (DTO bez imageUrl), delete přes uložený `publicId`; na smazání účtu záměrně tombstone (D-040) — retence, ne leak.
- Content replace-orphan (UM-03) drží napříč 7 entitami (tabulka výše).
