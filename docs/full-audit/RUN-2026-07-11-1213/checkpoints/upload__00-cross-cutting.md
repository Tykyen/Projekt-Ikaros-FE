# Checkpoint — upload-media / 00-cross-cutting

**Oblast:** `docs/upload-media-plan/00-cross-cutting.md` (storage architektura · upload inventory matice · validační vrstvy · blob lifecycle · privacy model · tooling)
**Styl:** upload-media (registr `docs/upload-media-audit.md`, prefix `UM-`; RUN prefix `UM-RUN`)
**Datum:** 2026-07-11
**Dosažená L:** L3 (statické čtení + guard/MIME/limit/transformace/config ověřeny napříč vrstvami). M-PROBE/M-ORPHAN NEspuštěno (bez creds).
**Cílová L:** L3.

Přečteno: `upload.service.ts` (852 ř.), `upload.controller.ts` (165 ř.), `images.controller.ts` (29 ř.), grep VŠECH `FileInterceptor`/`FilesInterceptor` napříč BE (10 endpointů), grep `@Throttle` na všech controllerech, grep `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_URL` (env + kód), `.env` (prod), `app.controller.ts:66` healthcheck, `env.validation.ts:33`.

---

## A. Kompletní upload inventář (M-INV refresh 2026-07-11)

| Endpoint | Service | Limit | MIME | Magic | Guard | Throttle | Cleanup |
|---|---|---|---|---|---|---|---|
| `POST /upload` | uploadFile | 50 MB | ALLOWED (img/vid/doc) | ✅ | Jwt + `findChannelForUpload` | 20/min | `chat.message.deleted` |
| `POST /upload/image` | uploadImage→platform | 10 MB | image (bez svg) | ✅ | Jwt + **Admin** (`role>Admin`→403) | 20/min | ruční/`media.orphaned` |
| `POST /upload/content-image` | uploadContentImage→content | 10 MB | image (bez svg) | ✅ | Jwt (**každý**) | 20/min | `media.orphaned`/`page.deleted` |
| `POST /users/me/avatar` | uploadUserImage | 5 MB | image (bez svg) | ✅ | Jwt self | ❌ | `user.deletion.hardDeleted` |
| `POST /users/me/character/avatar` | uploadUserImage | 5 MB | image (bez svg) | ✅ | Jwt self | ❌ | `character.avatars.removed` |
| `POST /chat/upload` (chat.ctrl:428) | uploadWorldChatFile | 10 MB (`ATTACHMENT_MAX_BYTES`) | GLOBAL (img+doc) | ✅ | Jwt + member (`findChannelForUpload`) | ❌ | `chat.message.deleted` |
| `POST /global-chat/upload` | uploadGlobalChatFile | 10 MB | GLOBAL | ✅ | Jwt (non-guest) | ❌ | cron 2h + `chat.global.message.deleted` |
| `POST /platform-chat/channels/:id/upload` | uploadPlatformChatFile | 10 MB | GLOBAL | ✅ | Jwt + Roles (Admin+) | ❌ | `platform-chat.message.deleted` |
| `POST /platform-documents` | uploadPlatformDocument | 30 MB | PDF only | ✅ | Jwt + Admin | 20/min | — |
| `POST /ikaros-gallery` | uploadGalleryImage→gallery | 10 MB | image (bez svg) | ✅ | Jwt | ❌ | `deleteImage(publicId)` |

**Klíčové vzory (drží):** žádný `FilesInterceptor` (vše single-file → count limit = 1 na request, potvrzeno). `assertMagicBytes` ve VŠECH 8 service metodách. SVG mimo všechny 4 whitelisty (UM-01). EXIF strip + `c_limit` jen na `uploadImageToFolder` cestě (content/galerie/platform) — chat cesty NEmají (UM-RUN-07-01/02, viz checkpoint 07).

---

## Nové nálezy (🆕)

### UM-RUN-00-01 — `GET /images/*` proxy rozbitý v produkci (config drift, osa TR/CT)
- **Kde:** `backend/src/modules/images/images.controller.ts:11-14` konstruktor čte `this.configService.get('CLOUDINARY_CLOUD_NAME') ?? ''`; `:22-28` `redirect` → `res.cloudinary.com/${this.cloudName}/image/upload/${path}`.
- **Důkaz:** prod `.env` má JEN `CLOUDINARY_URL` (řádek 13), `CLOUDINARY_CLOUD_NAME` chybí (je jen v `.env.example:36` jako prázdný). `app.controller.ts:66-67` to explicitně komentuje: „PC-11: upload čte JEN CLOUDINARY_URL". `env.validation.ts:33` validuje jen `CLOUDINARY_URL`. → `this.cloudName === ''` v prod → 302 na `https://res.cloudinary.com//image/upload/<path>` (dvojité lomítko, prázdný cloud) → Cloudinary 404.
- **Dopad:** 🟠/🟡 — legacy „zpětná kompatibilita" endpoint (`ApiOperation` to sám říká). Jakýkoli obsah z migrace/staré verze, jehož URL míří na `{BACKEND}/images/...`, je v prod **mrtvý** (broken image). Nový obsah používá přímé `res.cloudinary.com` URL → nedotčen. Bez legacy referencí = 🟡 dead code; s nimi = 🟠 broken render. Navíc endpoint je **bez guardu** (veřejný 302) — potvrzuje UM-02 (veřejné médium), ale sám o sobě jen redirect na cloudinary doménu (path se append k pevné bázi → není open-redirect ven).
- **Návrh:** cloud name je dostupný z `upload.service.getCloudinaryBaseUrl()` / parsuj z `CLOUDINARY_URL` (jako upload.service:144-145). Sjednotit zdroj cloud name na jedno místo; NEbrat z dvou různých env klíčů.
- **L:** L3 (config + kód + healthcheck ověřeny). Klasifikace: 🆕 (v registru není).

### UM-RUN-00-02 — Per-user storage byte kvóta stále chybí (jen rate-limit), osa RL/OR — ⭐ potvrzený otevřený dluh
- **Kde:** žádná kolekce/počítadlo kumulativních uploadovaných bajtů; ověřeno grepem (`quota`/`kvóta`/`storageUsed`/`byteQuota` → jen `worlds.service` supporter world-count kvóta, ne storage).
- **Důkaz:** upload má jen `@Throttle 20/min` (3 `/upload*` routy) a globální 100/min/IP; ostatní upload routy (avatar/chat/gallery/platform-chat) bez per-route throttle. `content-image` = každý přihlášený, 20/min × 10 MB = ~200 MB/min/účet, **bez horního stropu celkového objemu**. FIXES-APPLIED (RUN) storage kvótu neimplementoval; ext-34 anti-abuse ji označil „chybí kumulativní cap … upload byte-kvóta = zvážím / možná dluh".
- **Dopad:** 🟠 storage exhaustion / náklad Cloudinary — přihlášený účet může postupně nahrát neomezený objem (rate-limit brzdí rychlost, ne celek). Shodné s vědomým rozhodnutím UM-10 (kvóta = budoucí feature, trigger komerční/multi-tenant provoz).
- **Návrh:** per-user rolling byte kvóta (ext-34 návrh: non-supporter 200 MB/den, supporter 2 GB/den); počítadlo při každém `upload_stream` success.
- **L:** L3. Klasifikace: ⭐ potvrzený otevřený dluh (UM-10 deferred + ext-34); NEnový, ale re-audit potvrzuje, že nebyl uzavřen.

### UM-RUN-00-03 — `media.orphaned` bez ref-countingu (osa OR/DL) — cross-ref oblast 03
- **Kde:** `upload.service.ts:844-851` `handleMediaOrphaned` → `deleteImageByUrl(url)` bez ověření, zda jiný dokument stejný blob nereferencuje.
- **Důkaz:** `emotes.service.copy:303-311` vytvoří nový emote se **sdíleným** `imageUrl`/`imageId` (nekopíruje blob). Následné `deleteFromWorld`/`applyUpdate` zdroje emitne `media.orphaned` na tu URL → blob zmizí → kopie má broken image. Detail v checkpointu 03 (UM-RUN-03-01).
- **Dopad:** 🟡 — broken image u sdíleného blobu; vyžaduje copy+delete sekvenci; ne security leak. Systémový: `media.orphaned` je „delete pokud si myslím, že už nikdo nedrží", což bez ref-count neplatí u copy.
- **Návrh:** buď copy re-uploadne blob (vlastní publicId), nebo `handleMediaOrphaned` před destroy ověří počet referencí. Nízká priorita.
- **L:** L3. Klasifikace: 🆕.

---

## Prošlé / ověřené OK (regrese-check — vše DRŽÍ)

- **UM-01** ✅ svg mimo 4 whitelisty (`ALLOWED_MIME_TYPES:17`, `GLOBAL_CHAT_ALLOWED_MIME:39`, `uploadImageToFolder:489`, `uploadUserImage:615`).
- **UM-07** ✅ `assertMagicBytes:85` (jpeg/png/gif/webp/pdf/mp4/quicktime/webm/doc/docx) volán ve všech 8 upload metodách. `text/plain`+`text/markdown` vědomě bez signatury (nesou libovolný text; raw resource_type, Cloudinary servíruje ne jako text/html → nízké riziko).
- **UM-08** ✅ `assertAttachmentsOrigin:173` (cloud base + folder prefix nebo `local:`); volán z world-chat + scheduled (viz oblast 02).
- **UM-09/UM-14** ✅ `LIMIT_DIMENSION_TRANSFORM` (`c_limit` 4000px) + `strip_profile` v `uploadImageToFolder:518-521`; avatar webp+crop:fill re-encode.
- **UM-10** ✅ (částečně) `@Throttle 20/min` na 3 `/upload*` routách; byte kvóta zůstává (UM-RUN-00-02).
- **Config:** upload.service parsuje cloud name z `CLOUDINARY_URL` (jediný zdroj v prod). Origin guard `getCloudinaryBaseUrl():163` z téhož.
- **Disk fallback** bezpečný (folder literál, filename `Date.now()-randomBytes`, traversal guard v `deleteLocalImageByUrl:704`).
