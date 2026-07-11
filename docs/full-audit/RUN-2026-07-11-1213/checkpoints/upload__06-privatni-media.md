# Checkpoint — upload-media / 06-privatni-media

**Oblast:** `docs/upload-media-plan/06-privatni-media.md` (bezpečnostní jádro: signed URL? SVG XSS? IDOR? AKJ obrázky?)
**Styl:** upload-media (registr `docs/upload-media-audit.md`, prefix `UM-`; RUN `UM-RUN`)
**Datum:** 2026-07-11
**Dosažená L:** L3 (whitelist/render-path/signed-URL grep/IDOR napříč povrchy). M-IDOR runtime probe NEspuštěn.
**Cílová L:** L3-L4 (L4 IDOR statická; runtime ne).

Přečteno: `upload.service.ts` whitelisty (SVG mimo všechny 4), `images.controller.ts` (redirect proxy), FE `cloudinary.ts` (cloudinaryThumb f_auto), FE `MessageAttachments.tsx` (render path), grep signed URL/`authenticated`/`type:'private'` napříč BE (0 hitů v upload cestách), IDOR guardy z oblastí 01/02/05.

---

## Verdikt: SVG XSS uzavřeno (UM-01), veřejné médium akceptované (UM-02), IDOR čistý napříč povrchy

Bezpečnostní jádro: dvě původní 🔴 hypotézy zůstávají po ověření dle škály 🟠 (SVG = uzavřeno; PV = akceptované reziduum). Žádný nový 🔴.

## Stav dřívějších oprav (regrese-check — DRŽÍ)

### UM-01 (SVG XSS) — ✅ UZAVŘENO pro nové uploady
- SVG (`image/svg+xml`) odebráno ze VŠECH 4 whitelistů: `ALLOWED_MIME_TYPES:17-33`, `GLOBAL_CHAT_ALLOWED_MIME:39-51`, `uploadImageToFolder allowedImageTypes:489-494`, `uploadUserImage:615-620`. Nový SVG projde jen jako `text/plain`/`text/markdown` (bez magic signatury) — ale ne jako obrázek, `resource_type:'raw'`, Cloudinary neservíruje jako `image/svg+xml` → skript se nespustí.
- **Render path** navíc inertní: FE thumb `cloudinaryThumb` (`cloudinary.ts:11-26`) přidává `f_auto` (rasterizace); `MessageAttachments.tsx:35` obrázky přes `<img src>` (SVG by se nespustil); lightbox raw url taky `<img>`. Historické SVG z doby před fixem (pokud existují) = inertní v `<img>`, spustitelné jen přímou navigací (cross-origin, ne naše session).
- **Verdikt:** vektor uzavřen na vstupu (whitelist) i výstupu (`<img>`/`f_auto`).

### UM-02 (veřejné privátní médium) — 🟠 POTVRZENO, akceptováno (⚖️)
- Grep `authenticated`/`signed_url`/`type:'private'`/`auth_token` napříč BE: **0 hitů** v upload cestách (jediný hit `pages/interfaces/page.interface.ts` = nesouvisející). Potvrzeno: žádný signed URL / proxy s ACL / token nikde.
- Všechny cesty vrací `result.secure_url` = `https://res.cloudinary.com/<cloud>/...` veřejná URL, ukládá se do entit jako plain string.
- **Postižené (potvrzeno napříč oblastmi):** AKJ chráněná záložka `AkjTabContentOverride.imageUrl` (page.interface:160) — obsah záložky gated (403), ale obrázek veřejná URL; privátní mapa background (oblast 05); privátní/whisper chat příloha (oblast 02).
- **Akceptováno registrem** (2026-06-14, varianta c): mitigace = náhodný 20+ znaků publicId (enumerace nemožná), únik vyžaduje aktivní sdílení oprávněným uživatelem. Plné řešení (signed delivery / proxy+ACL) tracked jako budoucí práce. Beze změny.

### IDOR — ✅ čistý napříč povrchy
- Avatar: `/users/me/*` z JWT (oblast 01). Chat: `findChannelForUpload`→cross-world 403 (oblast 02). Mapy: `assertCanManage` proti `scene.worldId` (FIX-16), `assertCanViewAtlas` (oblast 05). Emote: `assertWorldCanManage`/`assertGlobalCanManage` (oblast 03). Content-image: open-to-any by-design (UM-10, autor=hráč), bez entity vazby — ne IDOR (žádná cizí entita se netrefuje).

---

## Nové nálezy (🆕)

Žádný nový v jádru 06. Net-new bezpečnostně-relevantní nález tohoto běhu je **UM-RUN-00-01** (images.controller `/images/*` proxy rozbitý v prod — config drift, čte neexistující `CLOUDINARY_CLOUD_NAME`) — zapsán v checkpointu 00. Z pohledu 06: endpoint je **bez guardu** (veřejný 302), což potvrzuje UM-02 vzor (veřejné médium), ale sám o sobě jen redirect na pevnou cloudinary bázi (path append → není open-redirect ven z cloudinary domény).

---

## Prošlé / ověřené OK

- **Filename bez XSS na FE:** `MessageAttachments.tsx` renderuje `filename` jako React text node / `alt` (escapováno). BE ale ukládá `originalname` raw (oblast 02 UM-RUN-02 drobnost) — obrana jen na FE.
- **`cloudinaryThumb` neutralizace:** `f_auto` rasterizuje potenciální SVG na thumb cestě; hero/page/avatar render sice raw URL, ale SVG už nelze nahrát (UM-01).
