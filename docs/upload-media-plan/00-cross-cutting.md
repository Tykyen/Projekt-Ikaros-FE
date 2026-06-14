# 00 — Cross-cutting: storage architektura, upload inventory matice, validační vrstvy, blob lifecycle, privacy model, tooling

> Globální vrstva pod všemi upload touchpointy. Drží **master matice** (B–D), ze kterých ostatní oblasti řežou svou část. Pořadí ověřování: **A. architektura** → **B. inventory** → **C. validace** → **D. blob lifecycle** → **E. privacy** → **F. tooling**.
>
> **BE:** [`upload.service.ts`](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts) · [`upload.controller.ts`](../../../Projekt-ikaros/backend/src/modules/upload/upload.controller.ts) · users/chat/global-chat/ikaros-gallery controllery · crony
> **FE:** [`cloudinary.ts`](../../src/shared/lib/cloudinary.ts) · [`useUploadImage.ts`](../../src/shared/api/useUploadImage.ts) · upload komponenty (avatar/hero/emote/group/chat)

---

## A. Storage architektura (recon 2026-06-14)

| Prvek | Stav |
|---|---|
| **Provider** | Cloudinary, **jediný účet**, config z `CLOUDINARY_URL` (`cloudinary://key:secret@cloud`), parsováno v konstruktoru [`upload.service.ts:72-96`](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L72) |
| **Folders** | `chat/{worldId}/{channelId}` · `global-chat/{room}` · `world-chat/{worldId}` · `gallery` · `platform` · `content` · `ikaros/users/{userId}/avatar` · `ikaros/users/{userId}/character` |
| **Storage** | multer `memoryStorage()` → buffer → `upload_stream`. Žádný temp soubor na disku (krom fallbacku). |
| **URL forma** | `secure_url` = `https://res.cloudinary.com/{cloud}/...` — **veřejná, bez auth**. Ukládá se do entit jako plain string (`imageUrl`, `avatarUrl`, `attachment.url`). |
| **publicId strategie** | dvojí: **auto** (náhodný, většina) vs **deterministický** `main` + `overwrite:true` (jen avatary) — viz D, klíč pro orphan analýzu |
| **Disk fallback** | `saveImageToDisk` [:331-354](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L331) — při Cloudinary outage zapíše do `backend/uploads/<folder>/`, vrátí URL `BACKEND_BASE_URL/static/...`, publicId `local:<folder>/<file>`. **Jen pro `uploadImageToFolder` cesty** (content/galerie/platform), ne chat/avatar. |
| **Origin guard** | `getCloudinaryBaseUrl()` [:102](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L102) — ověření, že příloha v DTO pochází z našeho cloudu (anti-podstrčení). VERIFY: kdo všechno ho volá. |

---

## B. Upload inventory matice (P1) — `M-INV` master tabulka

> Sestaveno čtením controllerů + service 2026-06-14. **Vzory na první pohled:** SVG všude kromě avatarů · EXIF strip jen avatary · disk fallback jen folder-cesty · `public_id:main` jen avatary · rate-limit nikde override.

| Endpoint | Service | Limit | MIME whitelist | SVG? | Guard | publicId | EXIF strip | Disk FB | Cleanup event |
|---|---|---|---|---|---|---|---|---|---|
| `POST /upload` | `uploadFile` | **50 MB** | `ALLOWED` (img/vid/doc) | ✅ | Jwt + `findChannelForUpload` | auto | ❌ | ❌ | `chat.message.deleted` |
| `POST /upload/image` | `uploadImage`→`platform` | 10 MB | image+**svg** | ✅ | Jwt + **Admin** | auto | ❌ | ✅ | ❌ ruční |
| `POST /upload/content-image` | `uploadContentImage`→`content` | 10 MB | image+**svg** | ✅ | Jwt (**každý**) | auto | ❌ | ✅ | `page.deleted` (jen hero/galerie) |
| `POST /users/me/avatar` | `uploadUserImage` | 5 MB | image (**bez svg**) | ❌ | Jwt (self) | `main` overwrite | ✅ webp+fill | ❌ | `user.deletion.hardDeleted` |
| `POST /users/me/character/avatar` | `uploadUserImage` | 5 MB | image (**bez svg**) | ❌ | Jwt (self) | `main` overwrite | ✅ | ❌ | `character.avatars.removed` |
| `POST /worlds/:id/chat/upload` | `uploadWorldChatFile` | 10 MB | `GLOBAL` (img+doc+**svg**) | ✅ | Jwt + member | auto | ❌ | ❌ | `chat.message.deleted` |
| `POST /global-chat/upload` | `uploadGlobalChatFile` | 10 MB | `GLOBAL` (img+doc+**svg**) | ✅ | Jwt | auto | ❌ | ❌ | cron 2h + `chat.global.message.deleted` |
| `POST /ikaros-gallery` | `uploadGalleryImage`→`gallery` | 10 MB | image+**svg** | ✅ | Jwt | auto | ❌ | ✅ | delete na item |

> **M-INV jako skript (L2, k postavení):** vytáhnout dvě množiny — (a) BE `@UseInterceptors(FileInterceptor)` + `limits.fileSize` + service whitelist, (b) FE file inputy + lokální `MAX_*` + `accept=`. Diff → drift kandidáti (`CT`). Hranice: statika neuvidí, jestli FE limit < BE limit je záměr (graceful) nebo bug (BE odmítne větší než FE myslí).

**Otevřené řádky matice (doplnit při sweepu):**
- token image upload (taktická mapa) — endpoint? guard? → oblast 05
- bestiar image — sdílí `/upload/content-image`? → oblast 04
- group/channel image — `/upload/content-image` → PATCH group; cleanup? → oblast 04

---

## C. Validační vrstvy (P1, osy `TV`/`SZ`/`IJ`)

Tři nezávislé MIME whitelisty (zdroj driftu):

| Konstanta | Soubor | Pokrývá | SVG | Video |
|---|---|---|---|---|
| `ALLOWED_MIME_TYPES` | [:15](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L15) | `POST /upload` | ✅ | ✅ |
| `GLOBAL_CHAT_ALLOWED_MIME` | [:36](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L36) | global + world chat | ✅ | ❌ |
| `allowedImageTypes` (inline) | [:275](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L275) | content/galerie/platform | ✅ | — |
| `allowedImageTypes` (inline, avatar) | [:388](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L388) | avatar | ❌ | — |

**Co validace dělá:** `whitelist[file.mimetype]` lookup → `UnsupportedMediaTypeException` při miss.
**Co NEdělá (díry):**
- ❌ **magic-byte / file signature** — `file.mimetype` je z multipart Content-Type (klient-controlled). Přejmenuj `evil.html`→`image/png` projde (`K-UM3`).
- ❌ **SVG sanitizace** — svg whitelisted (krom avatarů), `<script>`/`onload` projde syrově (`K-UM1`).
- ❌ **rozměrový/pixel limit** — jen `limits.fileSize` (multer). Dekompresní bomba projde (`K-UM12`).
- ❌ **EXIF strip** — krom avatarů (webp transformace). GPS/PII zůstává (`K-UM7`).
- ❌ **filename sanitizace** — `file.originalname` se ukládá do `attachment.filename` (VERIFY render — XSS přes filename?).

**Multer limity (`SZ`):** size limit per endpoint v `FileInterceptor`; **count limit** — `FileInterceptor` = single file, žádný `FilesInterceptor` zatím (VERIFY). Error → `MulterExceptionFilter` ([filters/multer-exception.filter.ts](../../../Projekt-ikaros/backend/src/modules/upload/filters/multer-exception.filter.ts)) → 413/400.

---

## D. Blob lifecycle matice (P1, osy `DL`/`OR`) — create → replace → delete

> Klíč auditu. **Replace** je slepé místo předchozího [cascade-delete auditu](../cascade-delete-audit.md), který řešil jen *delete*.

| Touchpoint | publicId | Replace orphan? | Delete cleanup |
|---|---|---|---|
| avatar (user/char) | `main` overwrite | ❌ **ne** (přepíše) | `user.deletion.hardDeleted` / `character.avatars.removed` ✅ |
| hero/page image | auto | 🔴 **ano** — PATCH přepíše `imageUrl`, starý blob zůstane | `page.deleted`→`handlePageDeleted` ✅ (delete entity), replace ne |
| page galleryImages[] | auto | 🔴 **ano** — odebrání z pole nemaže blob | `page.deleted` (celé pole) ✅ |
| world imageUrl | auto | 🔴 **ano** | `world.image.removed` (hard-delete) ✅ |
| group/channel image | auto | 🔴 **ano** — `imageUrl:''` jen string | VERIFY (oblast 04) |
| emote image | auto | 🔴 **ano** + TOCTOU orphan | delete emote → blob? (oblast 03) |
| galerie item | auto | — (item immutable, jen smazat+nový) | `deleteImage(publicId)` ✅ (galerie drží publicId!) |
| chat příloha | auto | — (immutable ve zprávě) | `chat.message.deleted` ✅ + cron 2h global |

**Cleanup eventy (6× `@OnEvent`):** `chat.message.deleted` [:501](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L501) · `chat.global.message.deleted` [:513](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L513) · `user.deletion.hardDeleted` [:525](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L525) · `page.deleted` [:537](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L537) · `character.avatars.removed` [:551](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L551) · `world.image.removed` [:563](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L563).

> **Asymetrie:** delete kryje 6 cest, **replace nekryje žádnou** (krom avatarů, kde je řešena `overwrite`). Galerie je jediná, co drží `publicId` v entitě → spolehlivý cleanup; zbytek extrahuje publicId z URL (`extractCloudinaryPublicId`), což **selže pro `local:` a GDrive** (→null) — `K-UM8`/`K-UM9`.

---

## E. Privacy model (P1, osa `PV`) — je „privátní" médium opravdu privátní?

**Fakt:** každá Cloudinary URL je veřejná. Žádný `auth_token`, žádný signed URL s expirací, žádný proxy endpoint s ACL.

| Privátní obsah | Jak je „chráněn" dnes | Riziko |
|---|---|---|
| AKJ chráněná záložka s obrázkem | obsah stránky gated (403), ale obrázek = veřejná URL | 🔴 kdo zná URL, stáhne (`K-UM2`) |
| privátní mapa (`visibleToPlayerIds`) | GET filtruje mapy, ale background URL veřejná | 🔴 leak linkem |
| privátní chat / zpráva | message ACL (jen člen vidí zprávu), ale příloha URL veřejná | 🔴 leak linkem (sdílná závažnost — URL je nepředvídatelná) |
| smazaná zpráva (před cron) | URL stále živá do cleanup | 🟡 okno |

**Mitigace, co existuje:** publicId je náhodný (enumerace nepravděpodobná) — ale to je obscurity, ne access control. Pokud URL unikne (referrer, sdílení, log), je trvale veřejná.

**Řešení (návrh pro fázi oprav, NEdělat teď):** signed delivery URL (Cloudinary `authenticated`/`private` type + token) nebo proxy `/api/media/:id` s ACL. Velký zásah → oblast 06 zhodnotí poměr cena/přínos.

---

## F. Tooling

### M-INV (L2 statický) — inventory diff
Sken BE interceptorů + service whitelistů × FE file inputů + `MAX_*` + `accept=` → matice (B) strojově + drift report (`CT`). Postavit jako `tools/upload-scan.mjs` (vzor [nav-audit.mjs](../nav-plan/00-cross-cutting.md)).

### M-PROBE (L5 runnable) — nahraj podvržené soubory
e2e přes supertest/`createTestApp` ([test/helpers](../../../Projekt-ikaros/backend/test/helpers/app-factory.ts)). Sada útoků:
- `evil.svg` s `<script>alert(1)</script>` → projde whitelistem? (očekáváme 🔴 ano)
- `evil.html` přejmenovaný na `image/png` (MIME spoof) → projde? (`K-UM3`)
- JPEG s GPS EXIF → uloží se s metadaty? (`K-UM7`)
- dekompresní bomba (42 kB → 30000×30000 px) → projde size limitem? (`K-UM12`)
- polyglot (GIF+JS) → typ?

⚠️ Potřebuje Cloudinary creds nebo mock. Bez creds → disk fallback cesta (taky validní test povrchu).

### M-IDOR (L4) — cizí token
Hráč A token zkusí: upload avatara „za" hráče B; GET privátní mapy B; přístup k AKJ obrázku bez clearance. Assert 403/404.

### M-ORPHAN (L5 infra) — Cloudinary Admin API vs DB
`cloudinary.api.resources()` list všech assetů → porovnat s referencemi v DB (`imageUrl`/`avatarUrl`/`attachment.publicId` napříč kolekcemi) → orphan inventory (kvantifikace `OR` leaku + storage cost). Read-only, nemaže.

### FZ / Stryker (L7 teeth)
Fuzz upload payloady (náhodné bajty, hraniční velikosti, malformed multipart) + mutace validačního kódu (`whitelist` lookup, size check) → ověří, že testy validaci opravdu hlídají.

---

## Pasti (recon)

- ⚠️ **Avatar je falešně podezřelý, ale čistý** — vypadá jako orphan/EXIF riziko, ale `overwrite:main` + webp transformace ho řeší. Neutrácet čas, je to anti-nález (zapsat jako pozitivum).
- ⚠️ **`cloudinaryThumb` u SVG** — `f_auto` ([cloudinary.ts:22](../../src/shared/lib/cloudinary.ts#L22)) může SVG rasterizovat (XSS neutralizace) NEBO ne. Ale hero/page/avatar se renderují **raw URL bez `cloudinaryThumb`** → SVG živý. VERIFY oba renderpaths v oblasti 06.
- ⚠️ **`local:` publicId** — `deleteImageByUrl`→`extractCloudinaryPublicId` vrací null pro disk fallback URL → disk bloby se nikdy nemažou. Při delete entity zůstanou. Ne false-negative, reálný leak (`K-UM8`).
- ⚠️ **Explore přestřeluje** — do registru jen přečtené `soubor:řádek`. Hypotézy zůstávají `K-UM`/🟡 dokud neověřeno čtením.
