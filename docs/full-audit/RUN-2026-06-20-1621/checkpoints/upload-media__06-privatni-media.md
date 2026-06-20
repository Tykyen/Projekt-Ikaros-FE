# upload-media / 06-privatni-media — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Auditor: hloubkový sweep L1-L3. Read-only.

## Pokrytí

Kód přečtený / prohledaný:

| Soubor | Co |
|---|---|
| BE `upload.service.ts` | MIME whitelists, magic-byte, SVG, `assertAttachmentsOrigin`, `@OnEvent` handlery |
| BE `upload.controller.ts` | guard, throttle, rate-limit, content-image endpoint |
| BE `images.controller.ts` | public redirect `/images/*` bez JWT guardu |
| BE `images.module.ts` | modul bez guards |
| BE `maps.controller.ts` + `operations-authorizer.service.ts` | scéna read-gate, `assertCanReadScene`, token ops auth |
| BE `maps/schemas/map-scene.schema.ts` | `imageUrl` pole scény |
| BE `world-maps.service.ts` + `world-maps.controller.ts` | atlas viditelnost, `visibleToPlayerIds` strip, orphan cleanup |
| BE `pages.service.ts` (výtah) | `lockedAkjTab`, `filterAkjTabsForViewer`, `assertAccess` |
| FE `cloudinary.ts` | `cloudinaryThumb` + `f_auto` SVG |
| FE `MessageAttachments.tsx` | chat příloha render (`<img>`, `<a href>`) |
| FE `HeroUploadCard.tsx` | hero render (`<img src={value}>`) |
| FE `AkjLockedPanel.tsx` | locked tab render — žádný obsah |
| FE `extensions.ts` | TipTap Image extension, `allowBase64:false` |

## Dosažená L vs cílová L

| Osa | Dosažená | Cílová |
|---|---|---|
| SVG XSS (IJ) | L3 | L3 |
| Privátní média veřejná URL (PV) | L3 | L4 (M-IDOR probe) |
| IDOR upload za cizí entitu (AU) | L3 | L3 |
| content-image open-to-any (AU/RL) | L3 | L3 |
| ImagesController proxy (PV) | L2 | L3 |
| AKJ locked tab leak (PV) | L3 | L3 |

## Nálezy

---

### UM-RUN-01 — [PV] `ImagesController` veřejný redirect bez JWT + bez throttle · Kde: `backend/src/modules/images/images.controller.ts:16-28` · Dopad: `GET /images/*` je unauthenticated 302 redirect na Cloudinary; žádný rate-limit, žádný world membership check. Slouží jako anonymní proxy libovolné cesty → teoreticky enumerate scan Cloudinary folderu (přímé URL stejně veřejné, takže bezpečnostní dopad = 0 navíc oproti přímé Cloudinary URL; ale endpoint zvyšuje útočnou plochu backendu o veřejný nechráněný route + generuje zbytečné BE requesty). · Návrh: buď přidat `@UseGuards(JwtAuthGuard)` (JWT jen pro logování kdo se ptá, ne pro přístup — Cloudinary URL je stejně veřejná), nebo celý modul smazat (FE nevolá `/api/images/*`, jde přímo na `res.cloudinary.com`). · L2 · 🆕

---

### UM-RUN-02 — [PV] AKJ locked tab — `contentOverride` strip ověřen, ale `lockedAkjTab` nestrippuje `sections` ani vlastní `content` · Kde: `backend/src/modules/pages/pages.service.ts:106-113` · Dopad: `lockedAkjTab` vrací explicitní bílý seznam: `{id, name, order, access[AKJ/AKJType], locked:true}`. Tedy `contentOverride`, `sections`, `content` nejsou přítomny — **správně** (žádný obrázek neunikne přes AKJ locked). Jednotkový test to ověřuje (`locked?.contentOverride toBeUndefined`). · Stav: **Čistý** — žádný nález. Verifikace provedena L3 (čtení kódu + test). · L3 · ♻️ (ověřeno, bez nálezu)

---

### UM-RUN-03 — [PV] Scény mapy: `imageUrl` scény dostupná hráči přes `GET /maps/:id` — gated `assertCanReadScene` · Kde: `backend/src/modules/maps/maps.controller.ts:96-108`, `operations-authorizer.service.ts:242-264` · Dopad: hráč smí číst scénu (`imageUrl` = pozadí mapy) JEN pokud `WorldMembership.currentSceneId === scene.id`. Jiná scéna → 403 `MAP_FORBIDDEN_OTHER_SCENE`. Non-member → 403. Global Admin+ bypass. · Stav: **Čistý** — scéna background URL leaků hráčům z jiných scén nebo nečlenům brání gate. · L3 · ♻️

---

### UM-RUN-04 — [PV] World-maps atlas: hráč dostane `imageUrl` mapy atlas (privátní svět) — stripe `visibleToPlayerIds`, ale `imageUrl` samotná = veřejná Cloudinary URL · Kde: `backend/src/modules/world-maps/world-maps.service.ts:98-117` · Dopad: Atlas mapy jsou filtrovány dle `isPublic || visibleToPlayerIds.includes(userId)` + kaskáda složek. Filtr funguje (hráč nevidí mapu v odpovědi). Ale pokud mu `imageUrl` unikne jinak (zpráva v chatu, podstrčená URL), přímý Cloudinary přístup nezablokovaný — platí stejné přijaté riziko jako UM-02 (ⓘ akceptováno). · Stav: **Čistý** — API-level filtr funguje L3. Přímá URL = UM-02 (⚖️). · L3 · ♻️

---

### UM-RUN-05 — [IJ/PV] SVG whitelist — ověření stavu po opravě UM-01 · Kde: `backend/src/modules/upload/upload.service.ts:17-33` (ALLOWED_MIME_TYPES), `:39-51` (GLOBAL_CHAT_ALLOWED_MIME), `:368-378` (uploadImageToFolder) · Dopad: Všechny 3 whitelisty **neobsahují** `image/svg+xml`. Komentář „UM-01 záměrně vynecháno" v kódu. Oprava z 2026-06-14 je přítomna a platná. · Stav: **Čistý**. · L3 · ♻️

---

### UM-RUN-06 — [AU] `content-image` open-to-any — rate-limit přítomen, world-scope chybí · Kde: `backend/src/modules/upload/upload.controller.ts:135-163` · Dopad: `POST /upload/content-image` má `@Throttle({ default: { ttl: 60_000, limit: 20 } })` (UM-10 oprava). Žádný role gate ani world scope — záměrné (autor článku je hráč). Kdokoliv přihlášený nahraje 10 MB / 20× za minutu / IP. Per-user storage kvóta stále chybí (viz UM-10 ⚖️, UM-15 🟡). · Stav: Nic nového oproti registru. Per-user kvóta = otevřený dluh D-NEW-UM10. · L3 · ♻️

---

### UM-RUN-07 — [IJ] `f_auto` v `cloudinaryThumb` u SVG — SVG jsou blokované uplodem, FE `f_auto` bezpředmětné · Kde: `src/shared/lib/cloudinary.ts:22` · Dopad: SVG jsou blokovány BE whitelistem (UM-RUN-05). `f_auto` u JPEG/PNG/WebP v pořádku. Žádná SVG `<img src>` cesta neexistuje (upload nelze). · Stav: **Čistý**. · L2 · ♻️

---

### UM-RUN-08 — [PV] `images.controller.ts` používá `CLOUDINARY_CLOUD_NAME` (odlišná proměnná od `CLOUDINARY_URL`) · Kde: `backend/src/modules/images/images.controller.ts:12-13` · Dopad: `upload.service.ts` parsuje `CLOUDINARY_URL` (formát `cloudinary://key:secret@cloud`) a extrahuje `cloudName`. `images.controller.ts` naproti tomu čte `CLOUDINARY_CLOUD_NAME` ze `ConfigService` — odlišná proměnná. Pokud tato proměnná v `.env` není, `cloudName = ''` a redirect jde na `https://res.cloudinary.com//image/upload/path` (broken URL, nefunkční proxy). Je to latentní konfigurační drift — redirect endpointu může tiše selhávat v produkci. · Návrh: ověřit zda `CLOUDINARY_CLOUD_NAME` je nastaven v production `.env`; nebo sjednotit parsování z `CLOUDINARY_URL` (jako v upload.service). · L2 · 🆕

---

### UM-RUN-09 — [AU] `assertAttachmentsOrigin` — world-chat a scheduled messages — ověření opravy UM-08 · Kde: `backend/src/modules/upload/upload.service.ts:173-193` · Dopad: `assertAttachmentsOrigin` přijímá `allowedFolderPrefixes` a validuje `att.url.startsWith(base) && att.publicId.startsWith(prefix) || fromDisk`. Metoda existuje a je veřejná — pro ověření volání je nutné prohledat `chat.service.ts`. Nezahrnuto do tohoto čtení (oblast 02), ale dle registru UM-08 „opraveno". · Stav: Registrová oprava přijata jako deklarovaná; pro L4 verify (UM-08) by bylo třeba číst chat.service. · L2 · ♻️

---

## PROOF-REQUEST

1. **PROOF-M-IDOR-01** — Live test: přihlásit se jako non-member světa a GETnout přímou Cloudinary URL AKJ obrázku → očekáváno 200 (UM-02 ⚖️). Potvrdit, že API-level filtr správně vrací 403 / nevydá URL (ověřeno staticky L3, ne L4/L5).

2. **PROOF-ENV-01** — Ověřit v production `.env` / compose, zda `CLOUDINARY_CLOUD_NAME` je nastaven (UM-RUN-08). Pokud ne: redirect je broken v produkci.

3. **PROOF-CHAT-UM08** — Přečíst `chat.service.ts` kolem `sendMessage` a `scheduled-messages.controller.ts` a ověřit, že `assertAttachmentsOrigin` je volána s `allowedFolderPrefixes: ['world-chat/']` — UM-08 deklarovaná oprava.
