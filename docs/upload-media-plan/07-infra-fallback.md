# 07 — Infra, fallback, validace, kvóty

> **Otázka:** Drží validace proti podvrženému souboru, neuteče disk fallback, nesedí limity FE↔BE, leakuje EXIF, jde appku zahltit uploadem?

**Stav: 🐛 hotovo** (sweep 2026-06-14) — **UM-06** (disk `local:` orphan + `/static/` veřejný), **UM-07** (žádné magic bytes), **UM-09** (EXIF jen avatary), **UM-12** (limity shodné FE↔BE, drift vyvrácen — jen fragmentace), **UM-14** (žádný pixel limit), **UM-16** ⚖️ (GDrive bloby). Rate-limit jen globální 100/min/IP, žádná storage kvóta. Folder literál → bez traversal. Viz [registr](../upload-media-audit.md).

## Dotčené

- BE: `saveImageToDisk` [`upload.service.ts:331-354`](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L331) · `extractCloudinaryPublicId` [:450](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L450) · `MulterExceptionFilter` · ServeStatic `/static/` (main.ts) · throttler config
- FE: `MAX_*` konstanty roztroušené (viz M-INV matice [00](00-cross-cutting.md))

## Hypotézy

- **K-UM3** 🟠 TV — žádná magic-byte validace (MIME z multipartu, klient-controlled)
- **K-UM5** 🟠 SZ/CT — fragmentace limitů BE 50/10/5 MB × FE 5MB/512KB/10MB → drift (FE limit ≠ BE limit kde?)
- **K-UM7** 🟠 EX — EXIF/GPS strip jen avatary; content/galerie/hero ukládá originál vč. metadat
- **K-UM8** 🟠 FB/OR — disk fallback veřejný přes `/static/`; `local:` publicId se nikdy nemaže (extract→null)
- **K-UM9** 🟡 OR — GDrive migrační URL se nemažou (extract→null)
- **K-UM12** 🟡 SZ — žádný pixel/rozměr limit → dekompresní bomba
- **K-UM15** 🟡 RL — žádná per-user storage kvóta, jen globální IP throttle

## Co ověřit

- [ ] **magic bytes** (M-PROBE) — `evil.html` jako `image/png` projde? (čekám ano → 🟠). Přidat `file-type`/sharp signature check?
- [ ] **limit drift** (M-INV) — pro každý endpoint: FE `MAX` ≤ BE `limits.fileSize`? kde FE > BE → uživatel uvidí 413 až po uploadu (UX) ; kde FE < BE → OK
- [ ] **disk fallback bezpečnost** — `/static/` servíruje cokoliv v `uploads/`? path traversal v `folder` (vždy literál/validovaný ObjectId?)? `local:` bloby leak při delete entity (`extractCloudinaryPublicId`→null) → orphan na disku navždy
- [ ] **EXIF** (M-PROBE) — nahraj JPEG s GPS → uloží se metadata? Cloudinary `image_metadata`/strip? remediace: `transformation:[{flags:'strip_profile'}]` na content cestě
- [ ] **dekomprese** — size limit 10 MB, ale 10000×10000 px PNG projde? Cloudinary limit (25 MP free)? render DoS
- [ ] **rate-limit** (`RL`) — `@Throttle` na upload routách? per-user storage kvóta? (`K-UM15`); upload spam = storage cost
- [ ] **GDrive bloby** (`K-UM9`) — kolik jich v DB (migrace), cleanup mimo Cloudinary
