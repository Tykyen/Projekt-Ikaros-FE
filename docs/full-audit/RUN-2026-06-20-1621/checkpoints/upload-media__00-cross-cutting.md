# upload-media / 00-cross-cutting — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Auditor: plný statický sweep HEAD (BE main 2026-06-20, FE main 2026-06-20).

---

## Pokrytí

### Přečteno (L1-L3 statika)

**BE:**
- `upload.service.ts` (celý, 720+ řádků) — whitelisty, magic-byte, EXIF, assertAttachmentsOrigin, deleteImageByUrl, deleteLocalImageByUrl, všechny @OnEvent handlery
- `upload.controller.ts` — @Throttle dekorátory na 3 endpointech, FileInterceptor limity
- `chat.service.ts:1051-1055` — assertAttachmentsOrigin v sendMessage (UM-08)
- `chat/scheduled-messages.controller.ts:67-71` — assertAttachmentsOrigin v create (UM-08)
- `worlds.service.ts:500-513` — media.orphaned pro world imageUrl + themeBackgroundUrl (UM-03)
- `pages.service.ts:440-451` — media.orphaned pro hero + galleryImages (UM-03)
- `emotes.service.ts:82-127` — media.orphaned při conflict (UM-11), update (UM-04), delete (UM-04)
- `maps.service.ts:330-342` — media.orphaned pro deleteScene (UM-05)
- `world-maps.service.ts:160-188` — media.orphaned pro update + remove (UM-05)
- `chat/chat.service.ts:400-411` — media.orphaned pro group imageUrl replace (UM-03)
- `game-events.service.ts:320-348` — media.orphaned při update + delete (UM-03)
- `ikaros-events.service.ts:133-143` — media.orphaned na hard delete (nový, fb0f8b0)
- `global-chat.controller.ts:127-157` — upload endpoint, bez @Throttle
- `chat.controller.ts:346-383` — world-chat upload, bez @Throttle
- `ikaros-gallery.controller.ts:108-134` — FileInterceptor bez explicit memoryStorage
- `users.controller.ts:84-105` — FileInterceptor bez explicit memoryStorage
- `multer/index.js:12-18` — ověřeno: bez storage/dest → fallback memoryStorage() (řádek 17)
- `chat-attachment.dto.ts` — publicId @IsString() @MaxLength(512), prázdný string projde
- `throttler.config.ts` — global 100/min/IP

**FE:**
- `SendImageToChatDialog.tsx` — imageAttachment() helper, publicId: '' (prázdný), SVG mimeType branch
- `chat/lib/types.ts:28-35` — ChatAttachment interface, publicId: string (required)
- Grep `accept=.*svg` v TSX: jediný výskyt v SendImageToChatDialog (detekce ext z URL, ne nový upload)

### Metody aplikované

M-INV (L2 statický): inventura endpointů × magic-byte × EXIF × @Throttle × media.orphaned callsites.
L1-L3 statika dokončena. L5 (M-PROBE runnable) a M-ORPHAN (Cloudinary Admin API) nevykonány — viz PROOF-REQUEST.

---

## Dosažená L vs cílová L

| Osa | Cílová L | Dosažená L | Poznámka |
|-----|----------|------------|----------|
| TV (MIME/magic/SVG) | L3 | L3 ✅ | svg ven ze 3 whitelistů, magic-byte v každé cestě |
| SZ (size/count) | L3 | L3 ✅ | limity shodné FE↔BE, multer memoryStorage ověřen |
| AU (authorization) | L3 | L3 ✅ |assertAttachmentsOrigin v sendMessage+scheduled; ale viz UM-RUN-01 |
| PV (privacy) | L3 | L3 ✅ | UM-02 akceptováno ⚖️, stav beze změny |
| DL (delete/cleanup) | L3 | L3 ✅ | media.orphaned na 11+ callsites, deleteLocalImageByUrl UM-06 |
| EX (EXIF) | L3 | L3 ✅ | strip_profile na uploadImageToFolder, LIMIT_DIMENSION_TRANSFORM |
| OR (orphan) | L3 | L3 ✅ | ikaros-events nově hard-delete + media.orphaned (fb0f8b0) |
| RL (rate-limit) | L3 | L2 | @Throttle 20/min na /upload 3× OK; global-chat/world-chat upload bez override |
| M-PROBE | L5 | — | PROOF-REQUEST |
| M-ORPHAN | L5 | — | PROOF-REQUEST |

---

## Nálezy

### UM-RUN-01 — [AU/DL] assertAttachmentsOrigin rozbíjí SendImageToChatDialog · 🔴 REGRESE · ♻️

**Kde:** `FE: src/features/world/campaign/components/SendImageToChatDialog.tsx:28` × `BE: upload.service.ts:182-188`

**Co:** `imageAttachment()` konstruuje přílohu z holé Cloudinary URL (galerie/scéna drží jen URL, ne publicId) s `publicId: ''`. BE `assertAttachmentsOrigin` zkontroluje `''.startsWith('world-chat/')` → false, `''.startsWith('local:')` → false → hází **400 CHAT_INVALID_ATTACHMENT**. Feature „pošli obrázek scény do chatu" nefunguje na produkci od nasazení UM-08 (commit aba3085, cca 2026-06-14). Dialog existuje od 2026-06-02 (commit 891f8862), byl funkční před UM-08.

**Dopad:** Funkční regrese — PJ nemůže posílat obrázky scén do světového chatu. Scheduled varianta stejná chyba. Chyba je tichá (FE zobrazí toast `parseApiError(e)` = zpráva z BE).

**Návrh:** Dva možné fixy —
(a) BE: `assertAttachmentsOrigin` přidá výjimku pro `publicId: ''` + `att.url.startsWith(base)` = důvěřuj URL bez publicId (slabší security, ale pracuje s existujícími Cloudinary URL)
(b) FE: `imageAttachment()` extrahuje publicId z URL přes `extractCloudinaryPublicId` logiku → pošle skutečný publicId, pak projde `fromCloud` check. Čistší — nerozvolňuje BE kontrolu.

Varianta (b) je správná: `const publicId = url.split('/upload/')[1]?.replace(/^v\d+\//, '').replace(/\.[a-zA-Z0-9]+$/, '') ?? ''` + folder prefix `chat/` nebo `world-chat/` nelze splnit (URL je z folderu `maps/` nebo jiného). Tedy (b) selže na prefix check.
Varianta (a) nebo (c): nová allowed prefix `''` / `(fromCloud && att.publicId === '')` odděleně → OR podmínka `fromKnownCloud` (URL odpovídá Cloudinary base BEZ folder prefixu; umožní re-forwarding existujících assetů).

**Úroveň:** L3 (statická analýza + kontrola volání). **Závažnost: 🔴** (funkční regrese produkční feature).

---

### UM-RUN-02 — [RL] global-chat a world-chat upload bez per-route @Throttle · 🟡 · ♻️ (pre-existing UM-10 gap)

**Kde:** `BE: global-chat.controller.ts:127` a `chat.controller.ts:348` — žádný `@Throttle` dekorátor

**Co:** Endpoints `POST /global-chat/upload` a `POST /worlds/:id/chat/upload` nesou jen globální throttle 100/min/IP (throttler.config.ts:10). Oproti `/upload`, `/upload/image`, `/upload/content-image` (20/min/IP) = 5× volnější limit. World-chat je chráněn member gate (`getMembershipAppearance`), global-chat jen JWT. Storage spam přes global-chat upload = 100 × 10 MB = 1 GB/min/IP teoreticky (Cloudinary bandwidth).

**Dopad:** Nízký v praxi (community malý), ale asymetrie proti záměru UM-10 fixu. Pre-existing gap — registrován původně v UM-10 jako „částečná oprava".

**Návrh:** Přidat `@Throttle({ default: { ttl: 60_000, limit: 20 } })` na oba upload endpointy analogicky k /upload controller.

**Úroveň:** L3. **Závažnost: 🟡** (pre-existing, low-risk).

---

### UM-RUN-03 — [TV] ikaros-gallery.controller a users.controller bez explicitního memoryStorage · 🟢 ANTI-NÁLEZ · ♻️

**Kde:** `BE: ikaros-gallery.controller.ts:112` a `users.controller.ts:87`

**Co:** FileInterceptor bez `storage: memoryStorage()` — vypadá jako risk (disk storage = file.buffer undefined). Ověřeno multer@^2.2.0 source (`node_modules/multer/index.js:17`): bez `storage` ani `dest` → automaticky `memoryStorage()`. Implicit behavior, ale správný.

**Závěr:** Není chyba. Doporučení: explicitní `storage: memoryStorage()` pro čitelnost (ale nenásledovat UM = jen PROOF-REQUEST pro FZ/Stryker mutaci).

---

### Ověřené opravy (drží na HEAD)

| UM-xx | Status | Důkaz |
|-------|--------|-------|
| UM-01 (SVG) | ✅ drží | ALLOWED_MIME_TYPES:22 + GLOBAL_CHAT_ALLOWED_MIME:44 + uploadImageToFolder:368 — komentář záměru, bez image/svg+xml |
| UM-07 (magic-byte) | ✅ drží | MAGIC_SIGNATURES:60-79 + assertMagicBytes:85-93; volají uploadFile:206, uploadGlobalChatFile:265, uploadWorldChatFile:317, uploadImageToFolder:379, uploadUserImage:505 — všechny cesty |
| UM-09 (EXIF strip) | ✅ drží | uploadImageToFolder:397-399 — transformation: [LIMIT_DIMENSION_TRANSFORM, { flags: 'strip_profile' }] |
| UM-14 (pixel limit) | ✅ drží | MAX_IMAGE_DIMENSION=4000, LIMIT_DIMENSION_TRANSFORM:104-109 |
| UM-03 (replace orphan pages/worlds/news/game-events/group) | ✅ drží | 11 callsites nalezeno grepem |
| UM-04 (emote orphan) | ✅ drží | emotes.service.ts:91 (TOCTOU), :173 (update), :188 (update delete), :257 (delete) |
| UM-05 (mapy orphan) | ✅ drží | maps.service.ts:340, world-maps.service.ts:169+186 |
| UM-06 (disk fallback cleanup) | ✅ drží | deleteLocalImageByUrl:582-600, traversal guard :592 |
| UM-08 (origin world-chat+scheduled) | ✅ drží (ale rozbíjí SendImageToChatDialog — viz UM-RUN-01) | chat.service.ts:1052, scheduled-messages.controller.ts:68 |
| UM-10 (rate-limit /upload*) | ✅ částečně drží | upload.controller.ts:44,94,137 — @Throttle 20/min; chat+global-chat upload bez override (UM-RUN-02) |
| ikaros-events hard delete (fb0f8b0) | ✅ nové | ikaros-events.service.ts:141-142 — media.orphaned při delete |

---

## PROOF-REQUEST

### PR-01 — M-PROBE: ověření magic-byte blokování (L5 runnable)

Nahrát přes supertest: (a) `evil.html` s `Content-Type: image/png` → ověřit 415; (b) `evil.svg` s `Content-Type: image/jpeg` → ověřit 415. Bez M-PROBE nelze garantovat, že `assertMagicBytes` buffer check funguje end-to-end při multer stream (buffer mohl být prázdný při chybě). Nutné Cloudinary mock nebo disk-fallback cesta.

### PR-02 — M-ORPHAN: Cloudinary Admin API vs DB reference sken (L5 infra)

Porovnat `cloudinary.api.resources()` všech folderů s referencemi v MongoDB → kvantifikovat počet pre-existujících orphanů (před opravami) a ověřit, že nové replace/delete eventy skutečně likvidují assety. Vyžaduje CLOUDINARY_URL s admin přístupem + živou DB connection.

### PR-03 — UM-RUN-01 reprodukce (L4 runnable)

Ověřit, že `POST /worlds/:id/chat/messages` s `{ attachments: [{ url: 'https://res.cloudinary.com/...', publicId: '', type: 'image', ... }] }` vrátí 400 CHAT_INVALID_ATTACHMENT. Potvrdí, že SendImageToChatDialog je opravdu broken na produkci.
