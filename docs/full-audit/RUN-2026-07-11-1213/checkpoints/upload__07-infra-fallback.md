# Checkpoint — upload-media / 07-infra-fallback

**Oblast:** `docs/upload-media-plan/07-infra-fallback.md` (disk fallback `/static/`, GDrive bloby, rate-limit, magic bytes, EXIF, dekomprese)
**Styl:** upload-media (registr `docs/upload-media-audit.md`, prefix `UM-`; RUN prefix `UM-RUN`)
**Datum:** 2026-07-11
**Dosažená L:** L3 (statické čtení + guard/MIME/limit/transformace ověřeny napříč vrstvami — service ↔ controllery ↔ main.ts). Runnable probe (M-PROBE upload) NEspuštěn.
**Cílová L:** L3.

Přečteno: celý `upload.service.ts` (852 ř.), `upload.controller.ts` (165 ř.), `main.ts` `/static/` blok (80–139), `chat.controller.ts` upload (426–463), `global-chat.controller.ts` upload (161–199), `ikaros-gallery.controller.ts` (100–139) + service:253, grep všech `FileInterceptor`/`@Throttle`/`ATTACHMENT_MAX_BYTES` napříč BE.

---

## Stav dřívějších oprav (regrese-check — vše DRŽÍ)

- **UM-01** ✅ svg mimo všechny 4 whitelisty (`ALLOWED_MIME_TYPES:17`, `GLOBAL_CHAT_ALLOWED_MIME:39`, `uploadImageToFolder:489`, `uploadUserImage:615`).
- **UM-06** ✅ `deleteLocalImageByUrl:704` traversal guard (`filepath.startsWith(root+sep)`), volán z `deleteImageByUrl:700`. `/static/` hlavičky v `main.ts:117-123` (CORP cross-origin, ACAO primary origin).
- **UM-07** ✅ `assertMagicBytes:85` volán ve VŠECH 8 upload service metodách (uploadFile:206, uploadGlobalChatFile:265, uploadPlatformDocument:311, uploadWorldChatFile:382, uploadPlatformChatFile:438, uploadImageToFolder:500, uploadUserImage:626).
- **UM-09/UM-14** ✅ `strip_profile` + `c_limit` (`LIMIT_DIMENSION_TRANSFORM:105`, `MAX_IMAGE_DIMENSION=4000`) v `uploadImageToFolder:518-521`; avatar re-encode webp+fill.
- **UM-10** ✅ `@Throttle 20/min` na `/upload`, `/upload/image`, `/upload/content-image` (controller:44/94/138).
- **UM-16** ⚖️ GDrive: `extractCloudinaryPublicId:678` vrací null pro ne-Cloudinary — beze změny.

---

## Nové nálezy (🆕)

### UM-RUN-07-01 — Chat image přílohy NEstripují EXIF/GPS (osa EX — rozšíření UM-09 na nepokrytou plochu)
- **Kde:** `backend/src/modules/upload/upload.service.ts` — `uploadFile:213`, `uploadGlobalChatFile:270`, `uploadWorldChatFile:387`, `uploadPlatformChatFile:443`. Všechny volají `cloudinary.uploader.upload_stream({ folder, resource_type })` **bez `transformation`** → obrázek se uloží jak přišel, vč. EXIF/GPS/ICC.
- **Důkaz:** EXIF strip (`flags:'strip_profile'`) existuje JEN v `uploadImageToFolder:518-521` (content/galerie/platform) a nepřímo v avataru (`uploadUserImage:639` webp+crop:fill re-encode). UM-09 fix byl vědomě scoped na „content/galerie/platform cestě" (registr, Stav oprav ř. 20/94) — chatové přílohy nikdy nepokryté. Přitom obrázek v chatu = nejčastější místo, kam hráč vloží fotku z mobilu (GPS v EXIF).
- **Dopad:** 🟠 (EX/PV) — fotka sdílená ve světovém/globálním/admin chatu leakne GPS souřadnice (domov) + zařízení/čas každému, kdo přílohu vidí (členové kanálu) i komukoli s Cloudinary URL (veřejné úložiště, kořen č. 1). Přesně privacy třída UM-09, jen na ploše, kterou fix minul. Samotný vizuál je sdílen záměrně; EXIF je neviditelný vedlejší leak.
- **Návrh:** doplnit `transformation:[LIMIT_DIMENSION_TRANSFORM,{flags:'strip_profile'}]` do 4 chat image cest **jen pro `resource_type:'image'`** (dokumenty/PDF/video nechat beze změny). Sjednotit se sdíleným helperem, ať se plocha nerozjede znovu.
- **L:** L3 (transformace ověřena čtením napříč všemi upload cestami). Klasifikace: 🆕 (v registru není; UM-09 explicitně jen content/galerie/platform).

### UM-RUN-07-02 — Chat image přílohy NEmají rozměrový strop (osa SZ — rozšíření UM-14)
- **Kde:** tytéž 4 chat image cesty (viz 07-01). Bez `c_limit`/`LIMIT_DIMENSION_TRANSFORM`.
- **Důkaz:** `MAX_IMAGE_DIMENSION=4000` `c_limit` opět jen v `uploadImageToFolder:519`. Multer strop chat příloh je `ATTACHMENT_MAX_BYTES = 10 MB` (chat.controller:46, global-chat.controller:48) — malý silně komprimovaný PNG/WebP může nést gigapixel canvas pod 10 MB.
- **Dopad:** 🟡 (SZ/dekomprese) — dekompresní bomba přes chat přílohu → Cloudinary transform/render zátěž. Nižší než 07-01 (Cloudinary má vlastní 25 MP free strop jako backstop), ale nekonzistentní s content cestou.
- **Návrh:** společný s 07-01 (stejná transformace přidá i strop).
- **L:** L3. Klasifikace: 🆕 (rozšíření UM-14 na chat plochu).

---

## Drobnost / potvrzený dluh (bez elevace)

- **Per-route rate-limit chybí na chat/gallery/avatar upload endpointech** — `chat.controller.ts:428` (world upload), `global-chat.controller.ts:161`, `ikaros-gallery.controller.ts:110`, `users.controller.ts:102/133` (avatar) **nemají `@Throttle`** → jen globální 100/min/IP. UM-10 fix scoped na 3 `/upload*` routy. Ploška je gate-ovaná (world upload = member-only `getMembershipAppearance:461`; global = non-guest `:186`; avatar = `/users/me/*` JWT), takže spam je vázaný na účet, ne anonym. Konzistentní s vědomým rozhodnutím UM-10 (kvóta = budoucí feature). 🟡 dluh, neelevovat.
- Poznámka: `platform-documents.controller.ts:62` MÁ `@Throttle 20/min` (na rozdíl od chat/gallery) — nekonzistence, ne díra.

## Prošlé / ověřené OK

- **Disk fallback bezpečný:** `saveImageToDisk:558` folder je literál (`gallery`/`platform`/`content`) nebo validovaný segment; filename `Date.now()-randomBytes(6)` → bez traversal; cleanup přes `deleteLocalImageByUrl` s guardem (UM-06). `/static/` servíruje `uploads/` s CORP cross-origin (WebGL textury) — veřejné by-design, akceptováno (UM-06/kořen č. 1).
- **Magic bytes:** `MAGIC_SIGNATURES:60` pokrývá jpeg/png/gif/webp/pdf/mp4/quicktime/webm/doc/docx; text/* vědomě bez signatury; buffer < 12 B → 415. Volán ve všech cestách.
- **Limity FE↔BE:** BE multer 50/30/10/10/10/5 MB (upload:63 / platform-doc:67 / upload-image:111 / content-image:154 / chat:432 / avatar:102). Chat 10 MB = `ATTACHMENT_MAX_BYTES` sdílená konstanta (3 kopie, hodnota shodná). Drift nevyvrácen znovu — M-INV z 2026-06-14 platí (UM-12).
- **Gallery pipeline:** `ikaros-gallery.service.ts:253` → `uploadGalleryImage` → `uploadImageToFolder('gallery')` → strip+limit+magic OK (na rozdíl od chatu).
- **`assertAttachmentsOrigin:173`** — cloud base + folder prefix nebo `local:` fallback; volán z world-chat + scheduled (UM-08 drží).
