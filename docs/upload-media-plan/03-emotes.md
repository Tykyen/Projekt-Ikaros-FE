# 03 — Emotes (world + global)

> **Otázka:** Nahraje se jen malý obrázek, neorphanuje při kolizi shortcode, smaže se blob při delete emote / smazání světa?

**Stav: 🐛 hotovo** (sweep 2026-06-14) — **UM-04** 🟠 (3 orphan cesty: delete/update/world-delete bez blob cleanup, žádný `@OnEvent('emote.deleted')`) + **UM-11** 🟡 (TOCTOU upload před shortcode check). Emote jde přes `/upload/content-image` (folder `content`, sdílený). BE nevaliduje 512KB/typ (jen FE+generic 10MB). Viz [registr](../upload-media-audit.md).

## Dotčené

- BE: emotes modul (create/update/delete world + global), `custom_emotes` kolekce (**pozn: `worldId`/`createdBy` jako `ObjectId` — TYPE mina z [db-integrity](../db-integrity-audit.md)**), upload přes `/upload/content-image`?
- FE: [`EmoteUploadDialog.tsx`](../../src/features/world/chat/emotes/components/EmoteUploadDialog.tsx) · [`validateEmoteFile.ts`](../../src/features/world/chat/emotes/lib/validateEmoteFile.ts) (512 KB, png/jpeg/gif/webp) · [`buildEmoteUrl.ts`](../../src/features/world/chat/emotes/lib/buildEmoteUrl.ts) (128×128 fit)

## Hypotézy

- **K-UM11** 🟡 RC — TOCTOU: FE pre-check shortcode kolize + upload, pak BE 409 → obrázek už na Cloudinary = orphan. Komentář v kódu to „akceptuje". Přehodnotit: pořadí upload↔validace prohodit?
- **K-UM4** 🟠 DL — emote update (nový obrázek) → starý blob orphan? emote delete → maže blob?

## Co ověřit

- [ ] kterým endpointem emote uploaduje (`/upload/content-image`? vlastní?) → folder, publicId, cleanup
- [ ] shortcode kolize: jde upload **před** nebo **po** validaci unikátnosti? (kořen orphanu)
- [ ] delete emote → `deleteImage`? smazání světa → cascade maže emote bloby? (cross-ref [cascade-delete](../cascade-delete-audit.md))
- [ ] emote whitelist (512 KB, bez svg) — kde se enforcuje BE? (FE `validateEmoteFile` je jen UX, BE brána?)
- [ ] global emote — kdo smí nahrát (Admin?), kvóta?
- [ ] TYPE mina: `custom_emotes.worldId` ObjectId — ovlivní cascade match při mazání? (sdíleno s db-integrity)
