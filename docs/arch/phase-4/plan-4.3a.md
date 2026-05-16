# Plán 4.3a — Zprávy: Reply + reakce

Implementační plán ke [spec-4.3a.md](./spec-4.3a.md). Pořadí: BE → FE
(FE závisí na BE eventech). Emoji picker: `frimousse` (headless).

## Část A — Backend (`Projekt-ikaros/backend/src/modules/global-chat`)

> Samostatný git repozitář — commit zvlášť, jen na vyžádání.

### A1 — Reply: DTO + service
- `dto/create-global-message.dto.ts` — `+ replyToId?: string`
  (`@IsOptional @IsString`).
- `global-chat.service.ts` `sendMessage` — nový private helper
  `resolveReply(channelId, replyToId)`:
  - `findById`; vrátit `{}` (fallback) když chybí / `channelId` nesedí /
    `isDeleted` / `isSystem`,
  - jinak `{ replyToId, replyToPreview: content.slice(0,120), replyToSenderName }`.
  - `messageRepo.save` rozšířit o výsledek helperu.
- `sendWhisper` — přijme `replyToId?`, použije stejný helper.

### A2 — Reply: whisper gateway
- `global-chat.gateway.ts` `handleWhisper` — payload `+ replyToId?: string`,
  předat do `sendWhisper`.

### A3 — Reakce: service
- `global-chat.service.ts` `toggleReaction(room, messageId, userId, emoji)`:
  - `getChannelId(room)`, `findById`, ověřit `channelId` + `!isDeleted`
    + `!isSystem`; u whisperu (`visibleTo.length>0`) ověřit
    `visibleTo.includes(userId)` — jinak `NotFoundException` / tichý návrat.
  - klon `reactions`, toggle `userId` v `reactions[emoji]`, prázdné pole
    smazat, `messageRepo.update(messageId, { reactions })`.
  - `eventEmitter.emit('chat.global.message.reaction', { channelId, messageId,
    reactions, visibleTo })`.

### A4 — Reakce: gateway
- `@SubscribeMessage('chat:reaction:toggle')` `handleReaction(payload, client)`:
  - payload `{ room, messageId, emoji }`; `isRoomKey` guard;
    `emoji` neprázdný string, `length <= 16`;
  - `sender = connectedUsers.get(client.id)` → `userId`;
  - `void globalChatService.toggleReaction(...)` (catch + log jako jinde).
- `@OnEvent('chat.global.message.reaction')` `handleReactionEvent`:
  - veřejná (`visibleTo` prázdné) → `server.to('chat:'+channelId)`,
  - whisper → `for (id of visibleTo) server.to('user:'+id)`,
  - event `chat:message:reaction` `{ messageId, channelId, reactions }`.

### A5 — Testy + docs
- `global-chat.service.spec.ts` — `resolveReply` validní/nevalidní (cizí kanál,
  deleted, system, neexistuje); `toggleReaction` add/remove/cleanup; whisper
  reakce odmítne ne-účastníka.
- `global-chat.gateway.spec.ts` — `chat:reaction:toggle` → broadcast scope
  (veřejná vs. whisper).
- `docs/websocket-api.md` — doplnit `chat:reaction:toggle`,
  `chat:message:reaction`; `ikaros:whisper` + `replyToId`.

## Část B — Frontend (`Projekt-ikaros-FE`)

### B0 — Závislost
- `npm i frimousse` — headless emoji picker.

### B1 — Typy (`chat/lib/types.ts`)
- `ChatMessage` + `replyToId?`, `replyToPreview?`, `replyToSenderName?`.
- Nový `ReactionEvent { messageId; channelId; reactions: Record<string,string[]> }`.

### B2 — API (`chat/api/useGlobalChat.ts`)
- `SendMessagePayload` + `replyToId?: string`.
- `useToggleReaction(room)` — vrací `(messageId, emoji) => void`,
  `getSocket().emit('chat:reaction:toggle', { room, messageId, emoji })`.

### B3 — Reply: stav v `ChatRoom.tsx`
- Lokální stav `replyTo: ChatMessage | null`.
- `sendPublic` / `sendWhisper` — přidat `replyToId: replyTo?.id`, po odeslání
  `setReplyTo(null)`.
- `ikaros:whisper` emit payload + `replyToId`.
- Předat `replyTo` + `onReply` + `onCancelReply` do `ChatInput`;
  `onReply` do `MessageList` → `MessageItem`.

### B4 — Reakce: WS + cache v `ChatRoom.tsx`
- `useSocketEvent<ReactionEvent>('chat:message:reaction', …)` → v cache
  `keys.messages` nahradit `reactions` u zprávy s daným `id`.
- `toggleReaction = useToggleReaction(room)` — předat do `MessageItem`.

### B5 — `ChatInput.tsx`
- Props `+ replyTo: ChatMessage | null`, `onCancelReply: () => void`.
- Nad polem reply lišta: `↩ {replyTo.senderName}: {úryvek}` + „×"
  (`onCancelReply`). Úryvek ellipsis.
- `send()` beze změny obsahu — reply se připne v `ChatRoom`.

### B6 — `MessageItem.tsx`
- Props `+ onReply`, `+ onJumpToMessage`, `+ onToggleReaction`,
  `+ registerRef(id, el)` (pro scroll-to).
- Citační blok nad obsahem když `replyToId` — `↩ {replyToSenderName}`
  + `replyToPreview`; klik → `onJumpToMessage(replyToId)`.
- Hover/tap akční lišta: `Reply` (→ `onReply(message)`), `SmilePlus`
  (→ otevře emoji popover). Sloučit se stávajícím `Trash2` (`canDelete`).
- Reaction chips pod obsahem — z `message.reactions`; `{emoji} {count}`,
  zvýraznění když `currentUserId` v poli; klik = `onToggleReaction(id, emoji)`.
- Smazaná/systémová zpráva: bez akcí, citace, chipů.

### B7 — `EmojiPickerPopover` (nová komponenta)
- Wrapper nad `frimousse` `EmojiPicker.*` — ostylovaný design tokeny
  (`chat/components/EmojiPickerPopover.tsx` + `.module.css`).
- Desktop: popover ukotvený ke zprávě. Mobil: spodní sheet / plná šířka.
- `onSelect(emoji) => onToggleReaction(messageId, emoji)`.

### B8 — `MessageList.tsx`
- Propagace nových props (`onReply`, `onToggleReaction`, `currentUserId` už je).
- `Map<messageId, HTMLElement>` přes ref callback → `onJumpToMessage(id)`
  scrolluje + krátké zvýraznění (CSS třída na ~1,2 s).

### B9 — Testy
- `MessageItem.spec.tsx` — citace + klik; reaction chips + zvýraznění mého
  userId; akce skryté u deleted/system.
- `ChatInput.spec.tsx` — reply lišta + zrušení.
- `useGlobalChat.spec.tsx` — `useToggleReaction` emit; `replyToId` v payloadu.
- `ChatRoom` — cache update po `chat:message:reaction`.

## Část C — Po implementaci
- `type-sync` skill — ověřit shodu FE/BE `ChatMessage`.
- `mobil-desktop` audit — reply lišta, emoji picker, akční lišta zprávy.
- `napoveda` skill — chat dostal odpovědi + reakce.
- `roadmap-fe.md` — krok 4.3 rozdělit na 4.3a / 4.3b, 4.3a zaškrtnout.
- Spec/plán — `Stav` označit hotové.

## Otevřené body k potvrzení
- `frimousse` lokalizace — picker má anglické názvy kategorií/hledání.
  Návrh: ponechat (malý balík textu, emoji jsou univerzální); český překlad
  jako případný dluh.
- Scroll-to-original mimo načtené okno (zpráva starší než 50 v historii):
  citace zůstane needitovatelná, klik nic neudělá. Bez extra fetch.

## Stav

- [x] Implementováno (2026-05-17). BE testy 49/49, FE chat testy 81/81,
  typecheck + build + lint:colors čisté. `npm i frimousse` vyžadoval
  `--use-system-ca` (lokální proxy s vlastním CA root).
- Odchylka od B7: emoji picker se renderuje přes **portál do `body`**
  s `position: fixed` (ne `absolute` popover). Výpis zpráv má `overflow: auto`
  — absolutní popover by se u krajních zpráv ořízl. Pozice se počítá z
  `getBoundingClientRect()` kotvy a překlápí se nahoru, když se dolů nevejde.
