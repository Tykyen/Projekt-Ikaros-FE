# Upload / media audit — registr nálezů (nahraje se jen co má, zůstane privátní co má, uklidí se po smazání?)

> **11. styl auditu.** Read-only sweep upload/media vrstvy (Cloudinary + disk fallback) napříč FE i BE.
> Recon 2026-06-14. Plán: [`upload-media-plan/`](upload-media-plan/). Cílová otázka v [README](upload-media-plan/README.md).
>
> **Tři kořeny** (z nich padá většina nálezů):
> 1. **Veřejné úložiště** — všechny Cloudinary URL jsou bez auth; žádný signed URL / proxy / token. „Privátní" médium je privátní jen tím, že neznáš link (security by obscurity).
> 2. **Slabá validace** — jen MIME z multipartu (klient-controlled, podvrhnutelný), `image/svg+xml` na whitelistu (XSS vektor), žádné magic-byte / EXIF strip / rozměrový limit.
> 3. **Blob lifecycle ≠ entity lifecycle** — cleanup je event-driven jen na *delete* (6 `@OnEvent`); **replace** obrázku (hero/world/group/galerie/emote) starý blob nechá orphan; žádné ref-counting.

---

## Stav oprav (2026-06-14)

**Opraveno + ověřeno** (BE typecheck ✅ / lint:check ✅ / jest 621 zelených, dotčené moduly): **UM-01, UM-03, UM-04, UM-05, UM-06, UM-07, UM-08, UM-09.**

- **UM-01** — `image/svg+xml` odebráno ze 3 whitelistů (`ALLOWED_MIME_TYPES`/`GLOBAL_CHAT_ALLOWED_MIME`/`uploadImageToFolder`)
- **UM-07** — `assertMagicBytes` (file-signature, bez npm závislosti) ve všech upload cestách
- **UM-09** — EXIF/GPS strip (`flags: strip_profile`) na content/galerie/platform cestě
- **UM-03/04/05** — generický event `media.orphaned` + `@OnEvent` handler v upload.service → úklid starého blobu při **replace i delete** napříč pages (hero+galerie), worlds (imageUrl+themeBackgroundUrl), chat-group, world-news, game-events, emotes (3 cesty), maps scéna, world-maps atlas
- **UM-06** — disk fallback `local:`/`/static/` cleanup v `deleteImageByUrl` (traversal guard)
- **UM-08** — sdílená `assertAttachmentsOrigin` → world-chat `sendMessage` + scheduled zprávy (parita s global-chatem)

**UM-10 částečně opraveno:** `@Throttle` (20/min/IP) na `/upload`, `/upload/image`, `/upload/content-image` — brání storage spamu. Per-user storage **kvóta** (tracking celkové velikosti) zůstává jako budoucí feature (čeká trigger — komerční/multi-tenant provoz).

**UM-02 — AKCEPTOVÁNO ⚖️ (rozhodnutí 2026-06-14, varianta c):** plná ochrana privátních médií nemá rychlou opravu (AKJ obrázky v TipTap HTML → proxy ani signed URL je nezachrání; signed = re-upload ~3000+ migrace + expirace rozbije obsah; proxy = ztráta CDN). **Vědomě přijaté reziduální riziko** — mitigace: publicId 20+ znaků náhodný (enumerace nemožná), únik vyžaduje **aktivní sdílení oprávněným uživatelem** (věc pravidel/ToS, ne technická díra). Plné řešení (signed delivery / proxy+ACL) **tracked jako budoucí práce** → trigger: veřejný/komerční/multi-tenant provoz, kdy obscurity přestane stačit. Viz [dluhy.md](dluhy.md).

**Otevřeno 🟡:** UM-11 (orphan se teď uklidí, ale FE upload-před-validací zůstává), UM-12/13/14/15/16.

> ⚠️ Po BE změnách **nutný restart** (DI graf + nové `@OnEvent` listenery). Git commit nechán uživateli.
> ⚠️ Pre-existující (cizí) fail: `pages-world-seed.listener.spec` „matrix → prázdná Pravidla" — viz [dluhy.md](dluhy.md).

---

## Osy

**Jádro (7):**
`TV` type validation (MIME/magic/SVG/polyglot) ·
`SZ` size & count (limit FE↔BE, DoS, rozměr/dekomprese) ·
`AU` authorization (kdo smí, IDOR na cizí entitu) ·
`PV` privacy (veřejná URL u privátního obsahu → leak linkem) ·
`DL` delete/cleanup (blob při delete? při replace? orphan? ref-count) ·
`CT` contract drift (FE↔BE limity/typy, duplicitní hooky, centralizace) ·
`TR` transform/render (Cloudinary transformace, fallback, placeholder)

**Hloubka (perspektivy):**
`IJ` injection (SVG XSS, filename, polyglot) ·
`EX` EXIF/metadata leak ·
`OR` orphan/storage leak ·
`RC` race (TOCTOU emote→orphan, dvojí upload) ·
`FB` fallback (disk `/static/` veřejný, `local:` publicId nemazání) ·
`RL` rate-limit/kvóta ·
`MP` mobil (HEIC, foto z fotáku, preview)

**Maximum nadstavba:**
`M-INV` (L2 statický sken matice) ·
`M-PROBE` (L5 runnable — nahraj podvržené soubory) ·
`M-IDOR` (L4 cizí token) ·
`M-ORPHAN` (L5 infra — Cloudinary Admin API vs DB ref) ·
`FZ`/Stryker (L7 teeth)

---

## Závažnost

- 🔴 **leak / XSS / IDOR / privacy průlom** — bezpečnostní dopad, ztráta dat, cizí přístup
- 🟠 **orphan / DoS / drift / chybějící validace** — funkční riziko, náklad, nekonzistence
- 🟡 **dluh / kvóta / kosmetika** — by-design nebo nízký dopad

## Úrovně jistoty

- **L1** přečteno (recon) · **L2** strojový sken (M-INV diff) · **L3** + guard/MIME/limit ověřeno napříč vrstvami · **L4** IDOR / render test · **L5** runnable probe (M-PROBE upload) / infra (M-ORPHAN sken) · **L7** teeth (fuzz/Stryker)

## Stav

- 🟡 hypotéza (seed, neověřeno) · 🐛 potvrzený nález · ⚖️ by-design / přijatelné · ✅ opraveno+ověřeno

---

## Potvrzené nálezy (`UM-xx`)

> Sweep 2026-06-14 (6 paralelních recon agentů + ruční verifikace sporných/nových bodů). **Žádný čistý 🔴** — tři původní 🔴 hypotézy mají po ověření podmínku (únik URL / přímá navigace), reálně 🟠. Severity nenafukována.

| ID | Záv. | Osa | Úroveň | Oblast | Nález | Stav |
|---|---|---|---|---|---|---|
| UM-01 | 🟠 | IJ/TV | L3 | 06 | **SVG whitelist** — `image/svg+xml` na 3 BE whitelistech (chat/content/galerie). FE renderuje přes `<img>` → skript inertní, ALE raw Cloudinary URL při přímé navigaci spustí skript (cross-origin, ne naše session) → hostujeme spustitelný/phishing obsah pod účtem. Avatar bezpečný (bez svg). Fix: odebrat svg z `uploadImageToFolder`+chat whitelistů / `fl_attachment` / sanitizace | 🐛 |
| UM-02 | 🟠 | PV | L3 | 06/05 | **Privátní média = veřejná URL** — AKJ obrázek, privátní mapa background, privátní chat příloha mají veřejnou Cloudinary URL; žádný signed URL/proxy/token. Únik linkem = trvalý přístup. **Akceptováno 2026-06-14** (varianta c) — viz Stav oprav | ⚖️ |
| UM-03 | 🟠 | DL/OR | L3 | 04 | **Replace orphan napříč 5 entitami** — update pages/worlds/chat-group/world-news/game-events nemaže starý blob při změně `imageUrl` (jen `*.deleted` event maže). + `galleryImages[]` odebrání položky. Cleanup je asymetrický: delete kryje, replace ne. Avatar výjimka (`overwrite:main`) | 🐛 |
| UM-04 | 🟠 | DL/OR | L3 | 03 | **Emote orphan — 3 cesty** — `deleteFromWorld`/`deleteGlobal` jen `deleteById`+emit, upload.service NEMÁ `@OnEvent('emote.deleted')`; `applyUpdate` mění imageUrl bez cleanup starého; smazání světa maže `custom_emotes` doc, blob ne | 🐛 |
| UM-05 | 🟠 | DL/OR | L3 | 05 | **Mapy/scény orphan** — `maps.service.deleteScene` + `world-maps.service.remove` bez blob cleanup ani eventu; upload.service nemá `map.deleted` handler. Token image se bere z `characterData.imageUrl` (Page), ne vlastní blob (to OK) | 🐛 |
| UM-06 | 🟠 | FB/OR | L3 | 07 | **Disk fallback orphan + veřejný** — `saveImageToDisk` → `local:` publicId; `extractCloudinaryPublicId`→null pro non-cloudinary → disk bloby se při delete entity NIKDY nemažou. `/static/` servíruje `uploads/` veřejně (CORS FE). Folder je literál → bez path traversal | 🐛 |
| UM-07 | 🟠 | TV | L3 | 07 | **Žádná magic-byte validace** — jen `whitelist[file.mimetype]` lookup, mimetype z multipartu (klient-controlled). `evil.html` jako `image/png` projde | 🐛 |
| UM-08 | 🟠 | AU | L3 | 02 | **World-chat + scheduled origin nevaliduje** — global-chat ověřuje origin příloh (`validateAttachments`), ale `chat.service.ts:1015` + `scheduled-messages.controller.ts:69` ukládají `dto.attachments` syrově → klient podstrčí libovolnou `attachment.url` (cizí/tracking/phishing odkaz) | 🐛 |
| UM-09 | 🟠 | EX | L3 | 07 | **EXIF/GPS strip jen avatary** — content/galerie/platform (`uploadImageToFolder`, `resource_type:'image'` bez transformace) ukládá originál vč. metadat. Hráčova fotka leakne GPS/PII. Avatar výjimka (webp+`crop:fill`) | 🐛 |
| UM-10 | 🟠 | AU/RL | L3 | 06/04 | **content-image open + žádná kvóta** — `POST /upload/content-image` jen `JwtAuthGuard`, žádný role gate / rate-limit per-route / per-user storage kvóta (jen globální 100/min/IP). Každý hráč hostuje 10 MB cokoliv (i SVG payload) | 🐛 |
| UM-11 | 🟡 | RC | L3 | 03 | **Emote TOCTOU orphan** — FE nahraje obrázek PŘED BE `findByShortcode` kolizí → 409 = orphan. Podmnožina UM-04. Fix: upload až po validaci, nebo cleanup při 409 | 🐛 |
| UM-12 | 🟡 | CT | L2 | 07 | **Fragmentace limitů (bez driftu)** — `K-UM5` drift **VYVRÁCEN**: M-INV potvrdil FE↔BE páry shodné (5/10/512KB). Zbývá 🟡 dluh: roztroušené `MAX_*` konstanty bez centralizace | 🐛 |
| UM-13 | 🟡 | CT | L2 | 04 | **Dva `useUploadImage`** — shared `/content-image` vs ikaros legacy `/image` (Admin gate). NewsFormModal/IkarosEventModal volají legacy; de-facto OK (admin-only obsah), ale spoléhá na REST gating místo lokální logiky | 🐛 |
| UM-14 | 🟡 | SZ | L1 | 07 | **Žádný pixel/rozměr limit** — jen `limits.fileSize`; dekompresní bomba (malý soubor, obří canvas) projde → Cloudinary/render zátěž | 🐛 |
| UM-15 | 🟡 | DL/CT | L1 | 01 | **Avatar dangling membership.avatarUrl (hypotéza)** — změna/DELETE `User.characterAvatarUrl` nepropíše do `membership.avatarUrl` napříč světy → dangling broken image. NEJISTÉ — vyžaduje doověření `worlds.service.updateMemberCharacter` plnění | 🟡 |
| UM-16 | 🟡 | OR | L3 | 07 | **GDrive migrační bloby** — nemazány (`extractCloudinaryPublicId`→null), leak v cizím úložišti. Tolerováno by-design (best-effort) | ⚖️ |

---

## Seed kandidáti (`K-UMx`) — hypotézy → verdikty

> **Sweep uzavřen 2026-06-14.** Verdikty: K-UM1→**UM-01** (🔴→🟠 sneškáno) · K-UM2→**UM-02** (🔴→🟠) · K-UM3→**UM-07** · K-UM4→**UM-03** · K-UM5→**UM-12** (drift VYVRÁCEN, zbývá fragmentace) · K-UM6→**UM-13** · K-UM7→**UM-09** · K-UM8→**UM-06** · K-UM9→**UM-16** (⚖️) · K-UM10→**UM-10** (🔴→🟠) · K-UM11→**UM-04+UM-11** · K-UM12→**UM-14** · K-UM13→**vyvráceno** (gate funguje, viz pozitiva) · K-UM14→**UM-03** (group součást replace orphan) · K-UM15→**UM-10**. Nový mimo seed: **UM-05** (mapy), **UM-08** (origin spoofing), **UM-15** (avatar dangling).

| ID | Záv. | Osa | Oblast | Hypotéza | Důkaz z reconu (L1) |
|---|---|---|---|---|---|
| K-UM1 | 🔴 | IJ/TV | 06 | `image/svg+xml` na whitelistu → SVG s `<script>` servírovaný přímou Cloudinary URL = stored XSS | 3 whitelisty: [:20](../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L20), [:41](../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L41) (chat!), [:280](../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L280); avatar [:388](../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L388) ho NEmá |
| K-UM2 | 🔴 | PV | 06/05 | Privátní mapa / AKJ obrázek = veřejná Cloudinary URL → leak přímým linkem komukoliv | žádný signed URL; `secure_url` se ukládá do entit jako plain |
| K-UM3 | 🟠 | TV | 07 | Žádná magic-byte/signature validace — jen `ALLOWED_MIME_TYPES[file.mimetype]` lookup, mimetype z multipartu (klient) | [:111](../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L111), [:282](../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L282) |
| K-UM4 | 🟠 | DL/OR | 04 | **Replace** obrázku s auto-public_id (hero/world/group/galerie/emote) → starý blob orphan (jen delete entity emituje cleanup event) | replace přepíše jen `imageUrl` string; avatar je výjimka (`overwrite:true` [:408](../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L408)) |
| K-UM5 | 🟠 | SZ/CT | 07 | Fragmentace limitů: BE 50/10/5 MB, FE 5MB/512KB/10MB roztroušené → drift | BE [controller:63](../Projekt-ikaros/backend/src/modules/upload/upload.controller.ts#L63)=50MB, [:110](../Projekt-ikaros/backend/src/modules/upload/upload.controller.ts#L110)/[:150](../Projekt-ikaros/backend/src/modules/upload/upload.controller.ts#L150)=10MB; FE viz oblast 07 |
| K-UM6 | 🟡 | CT | 04 | Dva `useUploadImage` (`/content-image` shared vs `/image` ikaros legacy) | [shared](../src/shared/api/useUploadImage.ts) vs `features/ikaros/api/useUploadImage.ts` |
| K-UM7 | 🟠 | EX | 07 | Žádný EXIF/GPS strip u content/galerie/hero (`resource_type:'image'` bez transformace) → selfie hráče leakne polohu | avatar je výjimka — webp+fill strip [:410](../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L410) |
| K-UM8 | 🟠 | FB/OR | 07 | Disk fallback veřejný přes `/static/`; `local:` publicId se NIKDY nemaže (`extractCloudinaryPublicId`→null) | fallback [:331](../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L331), extract [:451](../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L451) (jen `res.cloudinary.com`) |
| K-UM9 | 🟡 | OR | 07 | GDrive migrační URL se nemažou (→null), leak v cizím úložišti (jiný problém než Cloudinary) | extract vrací null pro ne-Cloudinary |
| K-UM10 | 🟠 | AU | 06/04 | `POST /upload/content-image` jen `JwtAuthGuard`, žádná vazba na entitu, žádný rate-limit → storage spam + hosting libovolného (i SVG) obsahu | [controller:134](../Projekt-ikaros/backend/src/modules/upload/upload.controller.ts#L134) (bez admin gate, záměr — autor je hráč) |
| K-UM11 | 🟡 | RC | 03 | TOCTOU emote shortcode kolize → upload proběhne, pak 409 → orphan (známý, „akceptovaný" — přehodnotit) | FE pre-check + BE 409 backstop |
| K-UM12 | 🟡 | SZ | 07 | Žádný rozměrový/px limit → dekompresní bomba (malý soubor, obří canvas) Cloudinary/render DoS | jen `limits.fileSize`, žádný pixel check |
| K-UM13 | 🟠 | AU | 02 | Chat upload `findChannelForUpload(channelId, user.id)` — ověřit gate (race s odchodem ze světa, cross-world channelId) | [controller:81](../Projekt-ikaros/backend/src/modules/upload/upload.controller.ts#L81) |
| K-UM14 | 🟠 | DL | 04 | Group image „delete" = `imageUrl:''` na FE → maže BE starý blob, nebo orphan? | GroupDialog `removeImage`→`imageUrl:''` |
| K-UM15 | 🟡 | RL | 07 | Jen globální throttle (100/min/IP), žádná per-user storage kvóta → storage exhaustion | žádný `@Throttle` override na upload routách (VERIFY) |

---

## Pozitiva / anti-nálezy (ověřeno 2026-06-14 — neztrácet)

- **Avatar pipeline bezpečná:** webp + `crop:fill` strip EXIF, `public_id:'main' overwrite` žádný orphan, whitelist bez SVG. [:383-434](../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L383)
- **IDOR čistý:** všechny avatar endpointy `/users/me/*` berou userId z JWT (`user.id`), ne z parametru → nelze nahrát za cizí účet. [users.controller.ts:84-146](../Projekt-ikaros/backend/src/modules/users/users.controller.ts#L84)
- **Chat upload gate funguje** (K-UM13 vyvráceno): `findChannelForUpload`→`hasChannelAccess` ověří membership+role+access; cross-world channelId → 403 (channel.worldId vázán na membership). [chat.service.ts:1783](../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L1783)
- **Global-chat origin validace:** `validateAttachments` ověří `att.url.startsWith(cloudinaryBase)` + folder prefix. [global-chat.service.ts:65](../Projekt-ikaros/backend/src/modules/global-chat/global-chat.service.ts#L65) — ale world-chat/scheduled NE → **UM-08**.
- **Filename bez XSS:** `file.originalname`→`attachment.filename` renderováno jako React text node (escapováno), ne HTML. [MessageAttachments.tsx](../Projekt-ikaros-FE/src/features/chat/components/MessageAttachments.tsx)
- **FE↔BE limity shodné** (M-INV): žádný pár kde FE > BE. Drift K-UM5 vyvrácen (zbývá jen fragmentace → UM-12).
- **Delete cleanup funguje** (kde existuje): `page.deleted`/`world.image.removed`/`character.avatars.removed`/`*.message.deleted`/`user.deletion.hardDeleted` — 6 `@OnEvent`, vše best-effort `try/catch`. Cron prune global chatu maže i Cloudinary bloby. [:501-566](../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L501)
- **Chat MIME zúžen** bez videa (`GLOBAL_CHAT_ALLOWED_MIME`). [:36](../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L36)

## Souhrn sweepu

**16 nálezů:** 10× 🟠 (UM-01..10), 5× 🟡 (UM-11..15), 1× ⚖️ (UM-16). Žádný 🔴. **Dva systémové kořeny dominují:** (a) **replace/delete orphan** — 6 z 16 nálezů (UM-03/04/05/06 + dílem 11/16); blob lifecycle nesleduje entitu při edit. (b) **veřejné úložiště** — UM-01/02/08/10; žádná čtecí access vrstva.

**Doporučené pořadí oprav** (až po schválení): UM-03+04+05 (orphan, 1 vzor — `deleteImageByUrl` na starém URL při replace/delete + emit) → UM-08 (origin validace world-chat, sjednotit s global) → UM-01+09 (svg ven z whitelistu + EXIF strip na content cestě, 1 místo `uploadImageToFolder`) → UM-06 (local cleanup) → UM-02 (signed URL, velký zásah, samostatně).
