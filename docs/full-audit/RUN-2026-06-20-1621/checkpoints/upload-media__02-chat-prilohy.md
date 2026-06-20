# upload-media / 02-chat-prilohy — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20
Auditor: hloubkový agent (read-only, statická analýza L1-L3)

## Pokrytí

Prošlo:
- BE: `upload.service.ts` (celý), `upload.controller.ts` (celý), `chat.service.ts` (sendMessage L903-1085, editMessage L1229-1309, deleteMessage L1311-1357, findChannelForUpload L1873-1889, handleWorldDeleted L1891-1903)
- BE: `global-chat.service.ts` (validateAttachments L105-138, onModuleInit, konstruktor), `global-chat.controller.ts` (celý)
- BE: `chat.controller.ts` (uploadAttachment L348-383), `scheduled-messages.controller.ts` (celý), `scheduled-messages.job.ts` (celý)
- BE: `chat-message.repository.ts` (softDeleteByWorldId L163-167, pruneChannel L214-242), `world-hard-delete.service.ts` (celý)
- BE: `clean-messages.job.ts` (celý — pouze global-chat)
- FE: `attachments.ts` (celý), `ChatInput.tsx` (celý), `MessageAttachments.tsx` (celý), `useGlobalChat.ts` (useUploadAttachment), `useUploadWorldAttachment.ts` (celý), `ImageLightbox.tsx` (celý)
- BE: `update-message.dto.ts`, `chat-attachment.dto.ts`
- BE: `throttler.config.ts`

Nevyhodnoceno (chybí live infra):
- Skutečné Cloudinary bloby v `world-chat/` složce
- Skutečné chování Cloudinary `destroy()` při `local:` publicId

## Dosažená L vs cílová L

| Osa | Dosaženo | Cíl |
|-----|----------|-----|
| AU | L3 | L3 |
| DL | L3 | L3 |
| PV | L3 (inherited UM-02) | L3 |
| IJ | L3 | L3 |
| SZ | L3 | L3 |
| CT | L3 | L3 |
| RL | L3 | L3 |

## Nálezy

### Nové nálezy z tohoto runu

**UM-RUN-01** 🟠 `CT/IJ` — **FE `IMAGE_MIME` + `ACCEPT_ATTR` stále obsahují `image/svg+xml`** přestože BE odebralo SVG z whitelistů (UM-01 fix 2026-06-14). Výsledek: FE uživateli dovolí vybrat SVG, zobrazí náhled (object URL), pak BE vrátí 415 při odeslání — UX failure + zbytečná uživatelova práce. Falešná bezpečnostní iluze (FE říká „je ok", BE zamítne). Kde: `Projekt-ikaros-FE/src/features/chat/lib/attachments.ts:18,31` · Dopad: špatné UX, žádné bezpečnostní okno (BE blokuje), ale matoucí chybová hláška místo validace na FE · Návrh: odebrat `image/svg+xml` z `IMAGE_MIME` a `.svg`/`image/svg+xml` z `ACCEPT_ATTR` · L3 · 🆕

**UM-RUN-02** 🟠 `DL/OR` — **`editMessage` (`attachmentsToAdd`) bez `assertAttachmentsOrigin`** — `sendMessage` volá `uploadService.assertAttachmentsOrigin(dto.attachments, ['world-chat/', 'chat/'])` (L1052), ale `editMessage` přidává `dto.attachmentsToAdd` (L1272) bez jakékoliv origin validace. Útočník s přístupem ke kanálu může přidat do existující zprávy libovolnou cizí URL (tracking pixel, phishing odkaz) editací. Kde: `backend/src/modules/chat/chat.service.ts:1271-1272` · Dopad: bypass origin check přes edit endpoint — podstrčení cizí URL do zprávy · Návrh: přidat `this.uploadService.assertAttachmentsOrigin(dto.attachmentsToAdd, ['world-chat/', 'chat/'])` před L1271 · L3 · 🆕

**UM-RUN-03** 🟠 `DL/OR` — **World-chat Cloudinary bloby neuklidí při hard-delete světa** — `WorldHardDeleteService.hardDelete()` maže všechna `chatmessages` z MongoDB (L117), ale žádný handler v `upload.service` nenaslouchá na `world.hardDeleted`. Všechny přílohy v Cloudinary složce `world-chat/{worldId}/` zůstanou orphaned. `handleWorldDeleted` v `chat.service` jen soft-maže (flag `isDeleted:true`), `chat.message.deleted` se nevolá per-zpráva. Kde: `backend/src/modules/worlds/services/world-hard-delete.service.ts:117`, `backend/src/modules/upload/upload.service.ts` (žádný `@OnEvent('world.hardDeleted')`) · Dopad: Cloudinary storage leak po hard-delete světa (30d okno + cron) · Návrh: přidat `@OnEvent('world.hardDeleted')` handler v upload.service který zavolá Cloudinary `delete_resources_by_prefix('world-chat/{worldId}/')` · L3 · 🆕

**UM-RUN-04** 🟡 `RL` — **Chat upload endpointy bez per-route rate-limit** — `POST /global-chat/upload` a `POST /worlds/:worldId/chat/upload` nemají `@Throttle` override, padají pod globální 100/min/IP. Oproti tomu `POST /upload` (obecný) má explicit `@Throttle({ default: { ttl: 60000, limit: 20 } })`. World-chat endpoint má membership guard (silnější), global-chat má JwtAuthGuard (slabší). Kde: `backend/src/modules/global-chat/global-chat.controller.ts:127` (bez @Throttle), `backend/src/modules/chat/chat.controller.ts:348` (bez @Throttle) · Dopad: 5× volnější limit než dedicated upload endpointy → snadnější storage spam při kompromitovaném tokenu · Návrh: přidat `@Throttle({ default: { ttl: 60000, limit: 20 } })` na oba upload endpointy · L3 · 🆕

**UM-RUN-05** 🟡 `DL/FB` — **`deleteAttachments` neřeší disk-fallback přílohy** — `deleteAttachments()` volá `cloudinary.uploader.destroy(att.publicId)` i pro `local:folder/file.png` publicId (fallback); Cloudinary toto zahodí chybou (best-effort → jen log), ale disk-fallback soubor se nesmaže (potřebuje `deleteLocalImageByUrl`). Dopad je omezený protože Cloudinary fallback nahlásí chybu tichce, ale disk-fallback příloha ostane. Kde: `backend/src/modules/upload/upload.service.ts:623-636` · Dopad: disk-fallback chat přílohy se nečistí při smazání zprávy ani prune · Návrh: v `deleteAttachments` přidat větev pro `local:` publicId volající `deleteLocalImageByUrl(att.url)` · L3 · 🆕

### Potvrzené historické (přeneseno z registru UM-08)

**UM-08** ✅ — origin validace world-chat + scheduled — opraveno 2026-06-14: `assertAttachmentsOrigin` volána v `sendMessage` + `ScheduledMessagesController.create`. Ověřeno L3 přečtením kódu.

### Anti-nálezy (pozitiva, 2026-06-20)

- **SVG whitelist z BE odstraněn** — UM-01 fix ověřen: `ALLOWED_MIME_TYPES`, `GLOBAL_CHAT_ALLOWED_MIME`, `uploadImageToFolder` nemají `image/svg+xml` (L17-51, L366-375).
- **Magic-byte check aktivní** — `assertMagicBytes` volána ve všech 3 upload funkcích: `uploadFile:206`, `uploadGlobalChatFile:265`, `uploadWorldChatFile:317`, `uploadImageToFolder:379`.
- **Filename XSS bezpečný** — `file.originalname` → `attachment.filename` → renderován jako React text node v `MessageAttachments.tsx:57` (`{doc.filename}`) — žádné dangerouslySetInnerHTML.
- **Lightbox SVG bezpečný** — `ImageLightbox` renderuje `<img src={image.url}>` — SVG skripty v `<img>` kontextu nenasedají.
- **World-chat upload gate** — `getMembershipAppearance` → 403 pro nečlena (L1972-1975).
- **Global-chat upload JWT-chráněný** — `@UseGuards(JwtAuthGuard)` na úrovni třídy (L69).
- **Origin check v sendMessage** — `assertAttachmentsOrigin` s prefixes `['world-chat/', 'chat/']` (L1052-1055).
- **Message delete → blob cleanup** — `chat.message.deleted` → `handleMessageDeleted` → `deleteAttachments` (L639-644).
- **Global-chat message delete → blob cleanup** — `chat.global.message.deleted` → `handleGlobalMessageDeleted` (L651-656).
- **Cron prune maže Cloudinary bloby** — `CleanMessagesJob` volá `uploadService.deleteAttachments(attachments)` (clean-messages.job.ts:33-35).
- **Scheduled origin check** — `assertAttachmentsOrigin` v `ScheduledMessagesController.create:68`.
- **Scheduled job jde přes sendMessage** — `sendMessage` volaný z `ScheduledMessagesJob.sendDue:29` → origin check zděděn.
- **Filename inject do ACCEPT_ATTR** — `ACCEPT_ATTR` je atribut input[accept], ne HTML, XSS nevzniká.
- **FE upload-on-send** — přílohy se nahrají až při odeslání zprávy, ne při výběru → žádné orphan bloby z neodeslané zprávy.
- **FE count limit** — `validatePick` (FE) i `validateAttachments` (global-chat BE) oba hlídají max 10 img + 4 doc.
- **Size limit parita** — FE 10 MB (`ATTACHMENT_LIMITS.maxBytes`), BE 10 MB (`ATTACHMENT_MAX_BYTES`) — shodné.

## PROOF-REQUEST

- **PR-01** `M-ORPHAN`: Po hard-delete světa zkontrolovat Cloudinary Admin API zda zůstaly blobs v `world-chat/{deletedWorldId}/` složce. Vyžaduje Cloudinary API klíč + reálný smazaný svět. Ověří závažnost UM-RUN-03. (L5)
- **PR-02** `M-PROBE`: Volat `PATCH /worlds/:wid/chat/messages/:mid` s `attachmentsToAdd: [{url: "https://evil.example.com/pixel.gif", publicId: "evil", type: "image", ...}]` a ověřit, zda BE odmítne nebo přijme. Ověří UM-RUN-02. (L5)
- **PR-03** `M-PROBE`: Ověřit, zda smazání zprávy s disk-fallback přílohou (`local:` publicId) reálně zanechá soubor v `uploads/`. (L5)
