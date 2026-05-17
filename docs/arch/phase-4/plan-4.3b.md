# Plán 4.3b — Zprávy: Přílohy

Implementační plán ke [spec-4.3b.md](./spec-4.3b.md). Pořadí: BE → FE
(FE volá nový upload endpoint a posílá `attachments`).

## Část A — Backend (`Projekt-ikaros/backend/src/modules`)

> Samostatný git repozitář — commit zvlášť, jen na vyžádání.

### A1 — Upload service: globální chat
- `upload/upload.service.ts` — nová metoda `uploadGlobalChatFile(file, room)`:
  - MIME whitelist **bez videa** — image (jpeg/png/gif/webp/svg) + document
    (pdf/plain/markdown/msword/docx); jinak `UnsupportedMediaTypeException`.
  - Cloudinary folder `global-chat/<room>`, `resource_type` dle typu.
  - vrací `ChatAttachment`.
- Nový private helper `getCloudinaryBaseUrl()` (z `cloud_name`) — pro validaci
  v A3.

### A2 — Upload endpoint
- `global-chat/global-chat.controller.ts` — `POST /global-chat/upload`:
  - `@UseInterceptors(FileInterceptor('file', { storage: memoryStorage(),
    limits: { fileSize: 10 MB } }))`, `@UseFilters(MulterExceptionFilter)`.
  - `@Query('room')` → `parseRoom`; `file` povinný (`UPLOAD_FILE_REQUIRED`).
  - volá `uploadService.uploadGlobalChatFile(file, room)`.
- `global-chat.module.ts` — doplnit `UploadService` do providerů (resp.
  importovat `UploadModule`), pokud tam ještě není.

### A3 — DTO + validace přílohy
- `dto/chat-attachment.dto.ts` (nový) — zrcadlí `ChatAttachment`:
  `url @IsUrl`, `publicId @IsString`, `type @IsIn(['image','document'])`,
  `mimeType @IsString`, `filename @IsString @MaxLength(255)`,
  `size @IsInt @Max(10MB)`.
- `dto/create-global-message.dto.ts`:
  - `content` → `@IsOptional`, zrušit `@MinLength(1)`, ponechat `@MaxLength`.
  - `+ attachments?: ChatAttachmentDto[]` — `@IsOptional @IsArray
    @ValidateNested({ each: true }) @Type(() => ChatAttachmentDto)`.
- `global-chat.service.ts` — nový private helper
  `validateAttachments(attachments?)`:
  - prázdné → `[]`;
  - každá: `url` začíná Cloudinary base URL účtu **a** `publicId` začíná
    `global-chat/`; `type ∈ {image,document}`;
  - počet: ≤ 10 `image` a ≤ 4 `document`;
  - cokoli mimo → `BadRequestException` (`GLOBAL_CHAT_INVALID_ATTACHMENT` /
    `GLOBAL_CHAT_TOO_MANY_ATTACHMENTS`).

### A4 — Service: sendMessage / sendWhisper
- `sendMessage` — guard: `!dto.content?.trim()` a žádné přílohy →
  `BadRequestException` (`GLOBAL_CHAT_EMPTY_MESSAGE`). `messageRepo.save`
  ukládá `attachments: validateAttachments(dto.attachments)`.
- `sendWhisper` — `+ attachments?` parametr, stejný guard + validace.

### A5 — Whisper gateway
- `global-chat.gateway.ts` `handleWhisper` — payload `+ attachments?:
  ChatAttachment[]`, předat do `sendWhisper`.

### A6 — Úklid Cloudinary (dluh ze specu §5)
- `global-chat.service.ts` `deleteMessage` — do eventu
  `chat.global.message.deleted` přidat `attachments` mazané zprávy; `update`
  navíc nuluje `attachments: []`.
- `upload/upload.service.ts` — `@OnEvent('chat.global.message.deleted')`
  handler maže Cloudinary assety z payloadu (best-effort, log). Stávající
  `chat.message.deleted` handler ponechat.
- `clean-messages.job.ts` — před `pruneChannel` posbírat `attachments`
  expirovaných zpráv a předat do `UploadService` (nová metoda
  `deleteAttachments(attachments[])` nebo emit eventu). Vyžaduje, aby
  `IChatMessageRepository` uměl vrátit mazané zprávy — ověřit `pruneChannel`,
  případně doplnit dotaz na expirované zprávy s `attachments`.

### A7 — Testy + docs
- `upload.service.spec.ts` — `uploadGlobalChatFile` odmítne video/nadlimit.
- `global-chat.service.spec.ts` — `validateAttachments` (cizí url, přespočet,
  špatný typ); `sendMessage` jen s přílohou projde, prázdná zpráva selže;
  `deleteMessage` zahrne `attachments` v eventu.
- `global-chat.gateway.spec.ts` — `handleWhisper` s `attachments`.
- `docs/websocket-api.md` — `ikaros:whisper` payload `+ attachments`;
  doplnit REST `POST /global-chat/upload` do REST sekce, pokud je vedená.

## Část B — Frontend (`Projekt-ikaros-FE`)

### B1 — Typy (`chat/lib/types.ts`)
- Nový `ChatAttachment { url; publicId; type: 'image'|'document';
  mimeType; filename; size }`.
- `ChatMessage` `+ attachments?: ChatAttachment[]`.

### B2 — API (`chat/api/useGlobalChat.ts`)
- `SendMessagePayload` `+ attachments?: ChatAttachment[]`.
- Nový `useUploadAttachment(room)` — `useMutation`, sestaví `FormData`
  (`file`), `POST /global-chat/upload?room=`, vrací `ChatAttachment`.
  (Ověřit, že `api` klient umí multipart; jinak `fetch` přes `apiBaseUrl`
  + auth header — viz vzor v `useGallery` create.)

### B3 — `chat/lib/attachments.ts` (nový)
- `formatBytes(n)` — „1,4 MB" / „820 kB".
- `ATTACHMENT_LIMITS` — `{ maxImages: 10, maxDocs: 4, maxBytes: 10 MB }`.
- `ACCEPTED` — `accept` string + MIME whitelist + `classifyFile(file)` →
  `'image' | 'document' | null`.
- `validatePick(existing, file)` — vrátí chybu (CZ) nebo `null`.

### B4 — `ChatRoom.tsx`
- `const uploadAttachment = useUploadAttachment(room)`.
- `sendPublic(text, attachments)` — `sendMutation.mutate({ content: text,
  color, replyToId: replyTo?.id, attachments })`.
- `sendWhisper(toUserId, text, attachments)` — `ikaros:whisper` emit
  payload `+ attachments`.
- Předat `onUploadAttachment={(f) => uploadAttachment.mutateAsync(f)}` do
  `ChatInput`.

### B5 — `ChatInput.tsx`
- Props `+ onUploadAttachment: (file: File) => Promise<ChatAttachment>`;
  `onSendPublic`/`onSendWhisper` signatura `+ attachments: ChatAttachment[]`.
- Stav `files: File[]`, `uploading: boolean`.
- Tlačítko `Paperclip` + skrytý `<input type="file" multiple accept=…>`;
  výběr → `validatePick` per soubor, validní přidat do `files`.
- Náhledová lišta nad polem (vedle reply lišty): obrázky thumbnail
  (`URL.createObjectURL`), dokumenty chip s ikonou + jméno; „×" odebírá
  (+ `revokeObjectURL`).
- `send()` — async: `uploading=true`, `Promise.all(files.map(
  onUploadAttachment))`, pak `onSendPublic/​Whisper(text, attachments)`;
  úspěch → vyčistit text + `files`; chyba → toast, `files` ponechat.
- Odeslat aktivní při neprázdném textu **nebo** ≥ 1 příloze; během uploadu
  spinner + `disabled`.
- `revokeObjectURL` všech náhledů při odmountování.

### B6 — `MessageAttachments.tsx` (nová komponenta)
- Props `{ attachments: ChatAttachment[] }`.
- Obrázky → mřížka `cloudinaryThumb(url, …)`; klik otevře `Lightbox`
  (lokální stav indexu). Dokumenty → chip: ikona (`FileText`), `filename`
  (ellipsis), `formatBytes(size)`; odkaz `target="_blank" rel="noopener"`.
- `cloudinaryThumb` je v `features/ikaros/lib/gallery` — přesunout do
  `shared/lib` (čistá util, žádná gallery vazba), nebo dočasně importovat
  a založit `dluh`. Rozhodnout dle Lightboxu níže.
- `Lightbox` (`features/ikaros/components/Lightbox`) — ověřit API; je-li
  generické, importovat; jinak přesun do `shared/ui` nebo `dluh`.

### B7 — `MessageItem.tsx`
- Po `<div className={s.body}>` (nad reaction chips) vykreslit
  `{message.attachments?.length > 0 && <MessageAttachments … />}`.
- Smazaná/systémová zpráva: bez příloh (early return už řeší deleted).

### B8 — Testy
- `useGlobalChat.spec.tsx` — `useUploadAttachment` (FormData, room v URL);
  `attachments` v `SendMessagePayload`.
- `attachments.spec.ts` — `formatBytes`, `classifyFile`, `validatePick`
  (limit obrázků/dokumentů, velikost, MIME).
- `ChatInput.spec.tsx` — výběr souboru + náhled + odebrání; odeslání jen
  s přílohou; upload-on-send volá `onUploadAttachment`.
- `MessageAttachments.spec.tsx` — obrázková mřížka, dokument chip, lightbox
  open.

## Část C — Po implementaci
- `socket-contract` skill — `ikaros:whisper` + `attachments`.
- `type-sync` skill — FE/BE `ChatMessage` + `ChatAttachment`.
- `mobil-desktop` audit — náhledová lišta, obrázková mřížka, lightbox.
- `napoveda` skill — chat dostal přílohy.
- `roadmap-fe.md` — 4.3b zaškrtnout.
- `dluhy.md` — uzavřít dluh osiřelých Cloudinary assetů (řešeno A6);
  případně založit dluh za `cloudinaryThumb`/`Lightbox` přesun.
- Spec/plán — `Stav` označit hotové.

## Otevřené body k potvrzení
- **`cloudinaryThumb` + `Lightbox`** jsou dnes v `features/ikaros`. Návrh:
  `cloudinaryThumb` přesunout do `shared/lib/cloudinary.ts` (čistá util);
  `Lightbox` ponechat a importovat cross-feature, pokud je jeho API
  generické — jinak přesun do `shared/ui`. Definitivně po přečtení Lightboxu
  v rámci B6.
- **Multipart v `api` klientu** — pokud `api.post` neumí `FormData`,
  `useUploadAttachment` půjde přes `fetch` se stejným auth headerem jako
  `useGallery` create mutace.

## Stav

- [x] Implementováno (2026-05-17). BE testy 81/81, FE testy 678/678,
  typecheck + build + lint:colors čisté.
- Otevřený bod `Lightbox`: galerijní komponenta je gallery-specific →
  vznikl samostatný generický `ImageLightbox` v `shared/ui`, žádný
  cross-feature import, žádný dluh. `cloudinaryThumb` přesunut do
  `shared/lib/cloudinary.ts` (7 importérů aktualizováno).
- Otevřený bod multipart: `apiClient.post` s `FormData` funguje (vzor
  z `useCreateGalleryImage`), `fetch` nebyl potřeba.
