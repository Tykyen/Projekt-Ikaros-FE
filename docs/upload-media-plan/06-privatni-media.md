# 06 — Privátní média & injekce (bezpečnostní jádro)

> **Otázka:** Je „privátní" médium opravdu nedostupné neoprávněnému, nelze přes upload spustit cizí kód, nelze nahrát za někoho jiného?

**Stav: 🐛 hotovo** (sweep 2026-06-14) — **bezpečnostní jádro; všechny 🔴 hypotézy sneškány na 🟠 po ověření.** **UM-01** 🟠 SVG (FE `<img>` inertní, jen přímá navigace = cross-origin abuse) + **UM-02** 🟠 veřejné privátní médium (žádný signed URL; `images.controller` veřejný redirect potvrzuje) + **UM-10** 🟠 content-image open. Viz [registr](../upload-media-audit.md).

## Hypotézy (jádro auditu)

- **K-UM1** 🔴 IJ — **SVG XSS.** `image/svg+xml` whitelisted ve 3 cestách ([:20](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L20)/[:41](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L41)/[:280](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L280)). SVG s `<script>`/`onload` nahraný jako content/chat/galerie/hero, renderovaný **raw Cloudinary URL** (bez `cloudinaryThumb`) → stored XSS v doméně appky? (závisí na tom, jestli se obrázek servíruje jako `<img>` (bezpečné) nebo přímý navigací/embed (nebezpečné), a jestli Cloudinary servíruje `Content-Type: image/svg+xml`).
- **K-UM2** 🔴 PV — **veřejná URL privátního obsahu** (AKJ obrázek, privátní mapa, privátní zpráva). Žádný signed URL / proxy. Únik linkem = trvalý přístup.
- **K-UM10** 🔴/🟠 AU — `content-image` open-to-any → hostování libovolného obsahu na našem CDN (i SVG payload pro phishing/XSS jinde)

## Co ověřit

- [ ] **SVG render path** — `<img src>` vs navigace/`<object>`/`<iframe>` v: hero ([HeroUploadCard render](../../src/features/world/pages/PageEditor/components/HeroUploadCard.tsx)), chat lightbox ([MessageAttachments](../../src/features/chat/components/MessageAttachments.tsx)), galerie, emote. `<img>` SVG nespustí `<script>` ve většině browserů; přímá navigace ano.
- [ ] **Cloudinary Content-Type pro SVG** — servíruje `image/svg+xml` (spustitelné při navigaci) nebo `text/plain`/`attachment`? f_auto rasterizace?
- [ ] **`cloudinaryThumb` neutralizace** — `f_auto` u SVG ([cloudinary.ts:22](../../src/shared/lib/cloudinary.ts#L22)) → rasterizuje? ale raw render path ho obchází
- [ ] **PV leak test** (M-IDOR) — non-member přímá URL privátní mapy/AKJ obrázku → 200 (leak) vs 403
- [ ] **AU IDOR** — upload za cizí účet/postavu/svět; cizí channelId
- [ ] **rozhodnutí o signed URL / proxy** — cena vs přínos; co MUSÍ být chráněné (AKJ, privátní mapa) vs co je OK veřejné (avatar, world hero)
- [ ] **SVG remediace** — odebrat z whitelistu? sanitizovat (DOMPurify server-side)? force download? `c_limit` rasterizace?
