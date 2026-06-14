# 02 — Chat přílohy (world + global)

> **Otázka:** Smí přílohu nahrát jen člen, dědí příloha ACL zprávy, uklidí se při smazání zprávy / prune / smazání světa?

**Stav: 🐛 hotovo** (sweep 2026-06-14) — **UM-08** 🟠 world-chat+scheduled origin nevaliduje (global ano). Vyvráceno: gate `findChannelForUpload` funguje, cron prune maže bloby, filename React-escaped. Viz [registr](../upload-media-audit.md).

## Dotčené

- BE: `uploadFile` [`upload.service.ts:106`](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L106) (50 MB!) · `uploadGlobalChatFile` [:164](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L164) · `uploadWorldChatFile` [:215](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L215) · `findChannelForUpload` (chat.service) · `getCloudinaryBaseUrl` origin guard [:102](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L102) · clean-messages cron (2h) · `upload.controller.ts` `POST /upload`
- FE: [`ChatInput.tsx`](../../src/features/chat/components/ChatInput.tsx) · [`attachments.ts`](../../src/features/chat/lib/attachments.ts) · [`MessageAttachments.tsx`](../../src/features/chat/components/MessageAttachments.tsx)

## Hypotézy

- **K-UM13** 🟠 AU — gate `findChannelForUpload(channelId, user.id)`: cross-world channelId? race s odchodem ze světa? non-member do globálního?
- **K-UM1** 🔴 IJ — `GLOBAL_CHAT_ALLOWED_MIME` má svg → SVG příloha; render lightbox = raw URL → XSS (sdíleno s oblastí 06)
- privacy: příloha privátní zprávy = veřejná URL (sdíleno s 06, `K-UM2`)

## Co ověřit

- [ ] `POST /upload` má limit **50 MB** vs ostatní chat 10 MB — proč? Která FE cesta ho volá? (`SZ`/`CT`)
- [ ] `findChannelForUpload` — co přesně kontroluje (membership? channel access? PJ bypass?); TOCTOU mezi upload a send
- [ ] origin guard `getCloudinaryBaseUrl` — volá ho **world chat** a **message create**, nebo jen global? (anti-podstrčení mezera)
- [ ] cron prune 2h maže jen **global**? world chat přílohy se prunují? smazání světa → world-chat folder cleanup? (`DL`/`OR`)
- [ ] filename `file.originalname` → `attachment.filename` → render v `MessageAttachments` (XSS přes filename? `IJ`)
- [ ] FE `ATTACHMENT_LIMITS` (10 MB, 10 img, 4 doc) vs BE (50 MB, single file) — count limit jen FE? (`SZ`)
