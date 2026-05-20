# Plán 6.2 — Zprávy ve světovém chatu (implementační)

**Vstup:** [spec-6.2.md](spec-6.2.md), [design-6.2.md](design-6.2.md).
**Datum:** 2026-05-20

Pořadí: **BE foundation → FE infra → FE komponenty per sub-task → integrace → testy → polish**. Každý sub-task má vlastní commit (lokální branch `main` per `feedback_work_on_main`).

---

## 0. Pořadí kroků (high-level)

```
1.  BE foundation      ┐
    ├─ N1/N2 fix       │  blokuje FE optimistic + edit
    ├─ /chat/appearance│  blokuje 6.2f
    ├─ /chat/upload    │  blokuje 6.2b
    ├─ clientNonce     │  blokuje 6.2h
    └─ mentions        │  blokuje 6.2i
                       ┘
2.  FE infra (hooky, lib)
3.  FE sub-tasks 6.2a → 6.2i (v tomto pořadí, ale lze parallel po 6.2a)
4.  Integrace do ChannelComposer + ChannelView (signature line, mody)
5.  Testy (Vitest, Jest, manual smoke)
6.  Polish — mobil-desktop, napoveda, roadmap check
```

---

## 1. Backend foundation (`Projekt-ikaros`)

### 1.1 N1 — `CreateMessageDto.color` na hex

**Soubor:** [`backend/src/modules/chat/dto/create-message.dto.ts`](../../../../Projekt-ikaros/backend/src/modules/chat/dto/create-message.dto.ts)

```diff
-  @IsOptional()
-  @IsIn(['red','blue','green','yellow','purple','orange','pink','cyan','default'])
-  color?: string;
+  @IsOptional()
+  @IsHexColor()
+  color?: string;
```

Smazat `IsIn` z imports. Schéma `chat-message.schema.ts` zůstává volný string (komentář aktualizovat: oba chaty teď hex).

### 1.2 N2 — `editMessage` dice block

**Soubor:** `backend/src/modules/chat/chat.service.ts` — okolo [řádek 693](../../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L693).

```diff
   const message = await this.messageRepo.findById(messageId);
   if (!message || message.isDeleted) throw new NotFoundException({...});
+
+  if (message.isDiceRoll) {
+    throw new ForbiddenException({
+      code: 'CHAT_DICE_NOT_EDITABLE',
+      message: 'Hod kostkou nelze upravovat',
+    });
+  }

   const canEdit = ...;
```

### 1.3 6.2f-BE — `WorldMembership.chatColor` / `chatFont`

**Schema** [`world-membership.schema.ts`](../../../../Projekt-ikaros/backend/src/modules/worlds/schemas/world-membership.schema.ts):

```ts
@Prop({ type: String, default: null }) chatColor: string | null;
@Prop({ type: String, default: null }) chatFont: string | null;
```

**Nový controller method + service** v `chat.controller.ts` / `chat.service.ts`:

```ts
// chat.controller.ts
@Get('appearance')
getAppearance(@Param('worldId') worldId, @CurrentUser() user) {
  return this.chatService.getMembershipAppearance(worldId, user.id);
}

@Patch('appearance')
updateAppearance(
  @Param('worldId') worldId,
  @Body() dto: UpdateAppearanceDto,
  @CurrentUser() user,
) {
  return this.chatService.updateMembershipAppearance(worldId, user.id, dto);
}
```

**Nový DTO** `dto/update-appearance.dto.ts`:

```ts
export class UpdateAppearanceDto {
  @IsOptional() @IsHexColor() chatColor?: string | null;
  @IsOptional() @IsIn([...CHAT_FONT_KEYS, null]) chatFont?: string | null;
}
```

**Service metody** — `chat.service.ts` přidat:

```ts
async getMembershipAppearance(worldId, userId): Promise<{chatColor, chatFont}> { ... }
async updateMembershipAppearance(worldId, userId, dto): Promise<{chatColor, chatFont}> {
  // member-only guard, PATCH na WorldMembership, return updated
}
```

**Server-side fill v `sendMessage`** — pokud DTO nepošle `color`/`customFont`:

```diff
   const membership = await this.membershipRepo.findByUserAndWorld(...);
+  const color = dto.color ?? membership?.chatColor ?? null;
+  const customFont = dto.customFont ?? membership?.chatFont ?? null;
   ...
-      customFont: dto.customFont ?? null,
-      color: dto.color ?? null,
+      customFont,
+      color,
```

**`CreateMessageDto.customFont`** validátor → `@IsIn(CHAT_FONT_KEYS)`:

Vytvořit shared `backend/src/modules/chat/constants/chat-fonts.ts`:

```ts
export const CHAT_FONT_KEYS = [
  'system','serif','mono','cinzel','caveat','orbitron','cormorant','jbmono',
] as const;
export type ChatFontKey = (typeof CHAT_FONT_KEYS)[number];
```

### 1.4 6.2b-BE — `POST .../chat/upload`

**Soubor:** `chat.controller.ts` přidat metodu (zrcadlí [`global-chat.controller.ts:129`](../../../../Projekt-ikaros/backend/src/modules/global-chat/global-chat.controller.ts#L129)):

```ts
@Post('upload')
@UseFilters(MulterExceptionFilter)
@UseInterceptors(FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: ATTACHMENT_MAX_BYTES },
}))
@ApiConsumes('multipart/form-data')
uploadAttachment(
  @Param('worldId') worldId: string,
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: RequestUser,
) {
  if (!file) throw new BadRequestException({ code: 'UPLOAD_FILE_REQUIRED', ... });
  return this.uploadService.uploadWorldChatFile(file, worldId);
}
```

**`upload.service.ts`** přidat metodu `uploadWorldChatFile(file, worldId)` — Cloudinary folder `world-chat/{worldId}/`. Reuse MIME whitelist a velikostní limit z global.

**Member-only guard:** přidat membership check do service (worldId v URL nestačí — uživatel by mohl nahrávat do cizího světa). Existuje pattern v jiných world controllers (`worldMembershipGuard`).

### 1.5 6.2h-BE — `clientNonce`

**Schema** `chat-message.schema.ts`:

```ts
@Prop({ type: String, default: null }) clientNonce: string | null;
```

A index níže:

```ts
ChatMessageSchema.index(
  { channelId: 1, clientNonce: 1 },
  { unique: true, sparse: true },
);
```

**DTO** `create-message.dto.ts`:

```ts
@IsOptional() @IsUUID() clientNonce?: string;
```

**Service `sendMessage`** — idempotence:

```diff
+  if (dto.clientNonce) {
+    const existing = await this.messageRepo.findByNonce(channelId, dto.clientNonce);
+    if (existing) return existing;  // idempotent retry
+  }
   const message = await this.messageRepo.save({
     ...
+    clientNonce: dto.clientNonce ?? null,
   });
```

**Repository** `chat-message.repository.ts` přidat `findByNonce(channelId, nonce)`.

### 1.6 6.2i-BE — Mentions

**Service `sendMessage`** — extrakce mentions:

```ts
const MENTION_REGEX = /(?:^|\s)@(\w[\w.-]{0,31})/g;
const usernames = [...(dto.content?.matchAll(MENTION_REGEX) ?? [])].map(m => m[1]);
const mentionedUsers = usernames.length
  ? await this.userRepo.findByUsernames(usernames)
  : [];
const mentions = mentionedUsers.map(u => u.id);
```

**Schema** `chat-message.schema.ts`:

```ts
@Prop({ type: [String], default: [] }) mentions: string[];
```

**Repository `UserRepository`** — přidat `findByUsernames(usernames: string[])` pokud neexistuje (case-insensitive). Vrací `[{ id, username }, ...]`.

**Push priority** v `sendMessage`:

```diff
   } else {
-    recipientIds = await this.resolveChannelRecipients(channel, requester.id);
+    if (message.mentions.length > 0) {
+      // Mention-only push (Discord-like)
+      recipientIds = message.mentions.filter(id => id !== requester.id);
+    } else {
+      recipientIds = await this.resolveChannelRecipients(channel, requester.id);
+    }
   }
```

### 1.7 BE testy

| Soubor | Co testovat |
|---|---|
| `chat.service.spec.ts` | hex color uložen; dice edit → 403; `clientNonce` idempotence (2× stejný = 1 zpráva); mention detekce; server-fill z membership |
| `chat.controller.spec.ts` | `/appearance` GET/PATCH; `/upload` 401/403/200; member guard |
| `upload.service.spec.ts` | `uploadWorldChatFile` folder `world-chat/{worldId}/` |
| `chat-message.repository.spec.ts` | `findByNonce` unique sparse |

---

## 2. FE infra (sdílené nástroje)

### 2.1 `chatFonts.ts` + Google Fonts loader

**Nový:** [`src/features/world/chat/lib/chatFonts.ts`](../../../src/features/world/chat/lib/chatFonts.ts) — viz spec §4.7. Export `CHAT_FONTS`, `CHAT_FONT_KEYS`, `getFontStack(key)`.

**`index.html`** — přidat preconnect + Google Fonts link s `latin-ext` subsetem (jediný request, 7 fontů, `display=swap`):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora&family=IBM+Plex+Mono&family=Cinzel&family=Caveat&family=Orbitron&family=Cormorant+Garamond&family=JetBrains+Mono&display=swap&subset=latin-ext" />
```

(`system` font klíč = systémový stack, nepotřebuje load.)

### 2.2 `parseMentions.ts`, `nonce.ts`

**Nový** `src/features/world/chat/lib/parseMentions.ts`:

```ts
const MENTION_REGEX = /(?:^|\s)@(\w[\w.-]{0,31})/g;

export function extractMentionUsernames(text: string): string[] {
  return [...text.matchAll(MENTION_REGEX)].map(m => m[1]);
}

export function renderWithMentions(
  text: string,
  mentionedUserIds: string[],
  usersByUsername: Map<string, { id: string; characterPath?: string }>,
  currentUserId: string,
): ReactNode[] {
  // split text by MENTION_REGEX, wrap matched @username spans
  // - if user.id ∈ mentionedUserIds → class "mention"
  // - if user.id === currentUserId → also class "mentionSelf"
}
```

**Nový** `src/features/world/chat/lib/nonce.ts`:

```ts
export function clientNonce(): string {
  return crypto.randomUUID();
}
```

### 2.3 `useChannelMembers.ts`

**Nový** `src/features/world/chat/api/useChannelMembers.ts`:

```ts
// Členové dané konverzace (whisper picker + mentions autocomplete).
// Server: GET /worlds/:worldId/members → filter dle accessMode konverzace na FE.
// Reuse existing useWorldMembers (pokud existuje), jinak nový endpoint.
export function useChannelMembers(worldId: string, channel: ChatChannel | null) {
  const all = useWorldMembers(worldId);
  return useMemo(() => filterByAccess(all.data, channel), [all.data, channel]);
}
```

Detail filtrování: `accessMode === 'all'` → všichni s rolí ≥ Hrac; `roles` → členové s rolí v `allowedRoles`; `members` → ti, jejichž `userId ∈ allowedMemberIds`.

### 2.4 `useMembershipAppearance.ts`

**Nový** `src/features/world/chat/api/useMembershipAppearance.ts`:

```ts
export function useMembershipAppearance(worldId: string) {
  return useQuery({
    queryKey: ['world-chat', worldId, 'appearance'],
    queryFn: () => api.get<{chatColor: string|null; chatFont: string|null}>(
      `/worlds/${worldId}/chat/appearance`),
    enabled: !!worldId,
  });
}

export function useUpdateAppearance(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { chatColor?: string|null; chatFont?: string|null }) =>
      api.patch(`/worlds/${worldId}/chat/appearance`, dto),
    onSuccess: (data) => qc.setQueryData(['world-chat', worldId, 'appearance'], data),
  });
}
```

### 2.5 `useUploadWorldAttachment.ts`

**Nový** `src/features/world/chat/api/useUploadWorldAttachment.ts` — zrcadlo [`useUploadAttachment`](../../../src/features/chat/api/useGlobalChat.ts):

```ts
export function useUploadWorldAttachment(worldId: string) {
  return useMutation({
    mutationFn: async (file: File): Promise<ChatAttachment> => {
      const form = new FormData(); form.append('file', file);
      const res = await apiClient.post<ChatAttachment>(
        `/worlds/${worldId}/chat/upload`, form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return res.data;
    },
  });
}
```

### 2.6 `useOptimisticSend.ts`, `useEditMessage.ts`, `useToggleReaction.ts`

**Nový** `src/features/world/chat/api/useOptimisticSend.ts` — viz spec §4.9. Wraps `useSendMessage`, vkládá optimistic do cache, swap po response/WS dedup.

**Nový** `src/features/world/chat/api/useEditMessage.ts`:

```ts
export function useEditMessage(worldId: string) {
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      api.patch(`/worlds/${worldId}/chat/messages/${messageId}`, { content }),
  });
}
```

**Nový** `src/features/world/chat/api/useToggleReaction.ts`:

```ts
export function useToggleReaction(worldId: string) {
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      api.put(`/worlds/${worldId}/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {}),
  });
}
```

### 2.7 Rozšířit `useWorldChat.ts` DTO

`SendWorldMessagePayload` rozšířit o `replyToId`, `visibleTo`, `attachments`, `overrideName`, `overrideAvatarUrl`, `rpDate`, `customFont`, `clientNonce`.

`ChatMessage` typ (z `features/chat/lib/types.ts`) rozšířit o `mentions: string[]`, `clientNonce?: string`, `customFont?: string|null`, `overrideName?: string`, `overrideAvatarUrl?: string`, `rpDate?: string`, `_status?: 'pending'|'failed'` (FE-only).

---

## 3. FE komponenty per sub-task

### 3.1 6.2a — Reply / reakce / whisper

**Soubory:**
- ROZŠÍŘENO [`ChannelView.tsx`](../../../src/features/world/chat/components/ChannelView.tsx) — `allowReply={true}`, `allowReactions={true}`, drží `replyTo` state, předá do composeru + `MessageList`.
- ROZŠÍŘENO [`ChannelComposer.tsx`](../../../src/features/world/chat/components/ChannelComposer.tsx) — `replyTo` prop + reply card render (slide-down 120 ms), whisper select dropdown.
- ROZŠÍŘENO `ChannelComposer.module.css` — `.replyCard`, `.replyAvatar`, `.replyName`, `.replyExcerpt`, `.replyCancel`.

**Logika:**
- `ChannelView` listenuje `chat:message:updated` ✓ (už máme) → reakce se aktualizují.
- `onReply` v `MessageItem` → `setReplyTo(msg)` v `ChannelView` → composer.
- Whisper dropdown: `useChannelMembers(worldId, channel)`, searchable nad 10 členů. Select → state `whisperTo: string|null`. Send: `visibleTo: whisperTo ? [whisperTo] : undefined`.
- `onToggleReaction` → `useToggleReaction(worldId).mutate({ messageId, emoji })` → BE → WS update → cache.

**Test:** `ChannelComposer.spec.tsx` — reply card render, × cancel, whisper select. `ChannelView` integrace covered manually.

### 3.2 6.2b — Přílohy

**Soubory:**
- ROZŠÍŘENO `ChannelComposer.tsx` — attach button (📎 razítko), file input ref, picked state, preview lišta.
- ROZŠÍŘENO `ChannelComposer.module.css` — `.attachBar`, `.attachItem`, `.attachThumb`, `.attachRemove`, `.attachLimit`.
- ROZŠÍŘENO `useWorldChat.ts` `SendWorldMessagePayload` o `attachments`.

**Logika:**
- Reuse [`attachments.ts`](../../../src/features/chat/lib/attachments.ts) (`validatePick`, `ACCEPT_ATTR`, `classifyFile`, `ATTACHMENT_LIMITS`).
- Upload-on-send: `Promise.all(picked.map(p => uploadMutation.mutateAsync(p.file)))` → vrátí `ChatAttachment[]`, vložit do DTO.
- Preview lišta: thumbnail pro obrázek (`object-fit: cover`), ikona `FileText` pro doc + filename.
- Per-render limit chip „3/10 obr · 1/4 doc".

**Test:** `ChannelComposer.spec.tsx` přidat case pro picked+send.

### 3.3 6.2c — Inline editace

**Soubory:**
- **NOVÝ** [`src/features/world/chat/components/MessageEditInline.tsx`](../../../src/features/world/chat/components/MessageEditInline.tsx) — textarea + Uložit/Zrušit/Enter/Esc handling.
- **NOVÝ** `MessageEditInline.module.css`.
- ROZŠÍŘENO `ChannelView.tsx` — drží `editingMessageId: string | null`, předá do `MessageList` jako `editingId` prop.
- ROZŠÍŘENO [`MessageItem.tsx`](../../../src/features/chat/components/MessageItem.tsx) (fáze 4) — přidat optional prop `editingId` + `onStartEdit` + `onCancelEdit`. Když `message.id === editingId` → render `MessageEditInline` místo `.content`. Tlačítko ✎ v `actions` se ukáže, pokud `(message.senderId === currentUserId || canDelete) && !message.isDiceRoll`.

⚠️ **Riziko:** rozšířit `MessageItem` (sdílený fáze 4) o edit features = global chat to taky bude mít. To je **OK** — global chat má taky vlastní zprávy a edit je standardní feature. Prop `onStartEdit` = optional, pokud nepředáno (4.x ChatRoom), ✎ se nezobrazí.

**Test:** `MessageEditInline.spec.tsx` — Enter save, Esc cancel, dice block.

### 3.4 6.2d — RP datum

**Soubory:**
- **NOVÝ** `src/features/world/chat/components/RpDateBadge.tsx` — render badge u zprávy (`📅 21. 4. 1453`).
- **NOVÝ** `RpDateBadge.module.css`.
- ROZŠÍŘENO `ChannelComposer.tsx` — razítko 📅 → popover s `<input type="date">`, RP chip vedle razítek (`📅 21. 4. 1453 ×`), state `rpDate: string | null`.
- ROZŠÍŘENO `MessageItem.tsx` — pokud `message.rpDate`, render `RpDateBadge` nad jménem.

**Logika:**
- Send DTO dostane `rpDate: '1453-04-21'` (BE už umí).
- Po sendu rpDate v composeru se vynuluje (ne sticky).
- Lokalizace: `new Intl.DateTimeFormat('cs-CZ', { day:'numeric', month:'long', year:'numeric'}).format(new Date(rpDate))`. Pro historická data 1453 funguje ISO calendar OK.

**Test:** `RpDateBadge.spec.tsx`. Composer test pokrývá ad-hoc.

### 3.5 6.2e — NPC mód

**Soubory:**
- **NOVÝ** `src/features/world/chat/components/NpcOverridePanel.tsx` — toggle + jméno + avatar URL inputy + × OFF.
- **NOVÝ** `NpcOverridePanel.module.css`.
- ROZŠÍŘENO `ChannelComposer.tsx` — razítko 🎭 (jen `canManage` viditelné), drží `npcActive`, `npcName`, `npcAvatarUrl` state, integrace s NpcOverridePanel.
- ROZŠÍŘENO `MessageItem.tsx` — pokud `message.overrideName`, render override identita + `<span class="npcTag" title="...">🎭</span>` vedle jména.

**Logika:**
- `canManage` z `WorldChatRoom` → composer (`canManage: boolean`).
- NPC stav sticky napříč zprávami; reset jen × OFF nebo toggle off.
- Send DTO: pokud `npcActive && (npcName || npcAvatarUrl)` → `overrideName`, `overrideAvatarUrl`. BE validuje role.

**Test:** `NpcOverridePanel.spec.tsx` — toggle, role gating, sticky stav.

### 3.6 6.2f — Per-svět vzhled

**Soubory:**
- **NOVÝ** `src/features/world/chat/components/AppearancePopover.tsx` — live preview, color picker (reuse `HexColorPicker` z `react-colorful`), font radio list, save/cancel/reset.
- **NOVÝ** `AppearancePopover.module.css`.
- ROZŠÍŘENO `ChannelComposer.tsx` — razítko 🎨, otevírá AppearancePopover, použije `useMembershipAppearance(worldId)`.
- ROZŠÍŘENO `MessageItem.tsx` — pokud `message.customFont`, resolvovat přes `getFontStack(key)` → inline `style={{ fontFamily }}` na `.content`.

**Logika:**
- Color picker = stejný `HexColorPicker` jako [ChatColorPicker](../../../src/features/profile/components/ChatColorPicker/ChatColorPicker.tsx). Reset volá `useUpdateAppearance.mutate({ chatColor: null, chatFont: null })`.
- Live preview mock zprávy v popoveru — `<div class="previewMsg" style={{ fontFamily, color }}>Tvá zpráva by vypadala takto…</div>`.
- Warn pod hex inputem — pokud `guardChatColor(color, surfaceColor) !== color` → ⚠ málo čitelná.
- FE pošle DTO `color` jen pokud user nepoužívá membership default (lehčí: vždy posílá z membership, BE má fallback z 1.3).

**Test:** `AppearancePopover.spec.tsx` — color změna mění preview, font radio mění preview, save volá PATCH, reset clear, kontrast warning.

### 3.7 6.2g — Custom emote rendering

**Soubor:**
- ROZŠÍŘENO [`src/features/chat/lib/emotes.ts`](../../../src/features/chat/lib/emotes.ts) — `parseEmotes(text, worldEmotes?: Map<string,string>)`. Pokud `worldEmotes.has(shortcode)`, vloží `<img class="emote" src={url} alt={`:${shortcode}:`} />`.
- ROZŠÍŘENO `MessageItem.tsx` — accept optional `worldEmotes` prop, předá do `parseEmotes`.
- ROZŠÍŘENO `ChannelView.tsx` — `worldEmotes` prop default `undefined` (6.4 ho naplní).
- ROZŠÍŘENO `MessageItem.module.css` — `.emote { height: 1.4em; vertical-align: -0.25em; }`.

**Test:** `emotes.spec.ts` — case s worldEmotes mapou.

### 3.8 6.2h — Optimistic send + retry

**Soubory:**
- **NOVÝ** `src/features/world/chat/api/useOptimisticSend.ts` — viz §2.6.
- ROZŠÍŘENO `ChannelView.tsx` — `send()` volá `useOptimisticSend` místo přímého `sendMutation.mutate`.
- ROZŠÍŘENO `MessageItem.tsx` — props `_status?: 'pending'|'failed'`, `onRetry?`, `onDiscard?`. Render pending dot a failed lišta podle stavu.
- ROZŠÍŘENO `MessageItem.module.css` — `.pending`, `.pendingDot @keyframes pulse`, `.failed`, `.failedBar`, `.retry`, `.discard`.
- ROZŠÍŘENO WS handler `handleMessage` v `ChannelView` — dedup dle `clientNonce`:

```ts
const handleMessage = (m) => {
  if (m.channelId !== channelId) return;
  qc.setQueryData(messagesKey, (old) => {
    const list = old ?? [];
    // dedup by ID
    if (list.some(x => x.id === m.id)) return list;
    // swap by clientNonce (replace optimistic)
    if (m.clientNonce && list.some(x => x.clientNonce === m.clientNonce)) {
      return list.map(x => x.clientNonce === m.clientNonce ? m : x);
    }
    return [...list, m];
  });
};
```

**Test:** `useOptimisticSend.spec.tsx` — pending insert, swap po response, swap po WS, failed retry.

### 3.9 6.2i — Mentions

**Soubory:**
- **NOVÝ** `src/features/world/chat/components/MentionAutocomplete.tsx` — popover, filter, keyboard nav.
- **NOVÝ** `MentionAutocomplete.module.css`.
- ROZŠÍŘENO `ChannelComposer.tsx` — detekce `@` v textarea, otevírá MentionAutocomplete, vkládá `@username `.
- ROZŠÍŘENO `MessageItem.tsx` — accept `mentions: string[]`, `usersByUsername: Map`, render přes `renderWithMentions` z `parseMentions.ts`.
- ROZŠÍŘENO `MessageItem.module.css` — `.mention`, `.mentionSelf`.
- Sidebar: nový **červený dot** na konverzaci s mention-self unread — `ChannelItem` rozšíření, ale to je více logiky, **odsuneme do dluhu** `D-NEW-chat-mention-sidebar-dot` (mention je tagovaný v BE, FE může později).

**Logika:**
- Detekce `@`: textarea caret position + regex backwards na poslední slovo.
- Filter: `username.startsWith(query) || (characterPath?.toLowerCase().includes(query))`.
- Keyboard: ↑/↓/Enter/Tab/Esc handlery, focus drží textarea (popover je portal).
- Render: `renderWithMentions(content, mentions, usersByUsername, currentUserId)`.

**Test:** `MentionAutocomplete.spec.tsx`, `parseMentions.spec.ts`.

---

## 4. Integrace — ChannelComposer + ChannelView

Po dokončení 6.2a–i složit dohromady. **Pořadí v composeru shora dolů:**

```tsx
<div className={s.composer}>
  {replyTo && <ReplyCard ... />}
  {pickedAttachments.length > 0 && <AttachBar ... />}
  <NpcOverridePanel ... />         {/* jen když active */}
  <div className={s.toolbar}>
    <Stamp icon={Paperclip} ... /> {/* attach */}
    <Stamp icon={Theater} ...   /> {/* NPC */}
    <Stamp icon={Calendar} ...  /> {/* RP */}
    <Stamp icon={Palette} ...   /> {/* vzhled */}
    <Stamp icon={AtSign} ...    /> {/* mention hint */}
    {rpDate && <RpDateChip ... />}
  </div>
  <textarea ... />
  <MentionAutocomplete ... />     {/* portal nad caret */}
  <SignatureLine ... />           {/* divider + active modes pásek */}
  <div className={s.modesBar}>
    {activeModes.map(m => <ModeChip ... />)}
  </div>
  <button className={s.send}>Odeslat ▸</button>
</div>
```

`SignatureLine` = 1px element s `background: linear-gradient(90deg, transparent, var(--ch-accent), transparent)` když `activeModes.length > 0`, jinak `background: var(--theme-border-soft)`. Transition 200 ms.

`ModeChip` klikatelný — klik volá `onClear<Mode>` callback (cancel NPC / cancel whisper / cancel RP).

---

## 5. Testy — souhrn

### Vitest (FE)

| Test | Co covered |
|---|---|
| `ChannelComposer.spec.tsx` | toolbar render, razítka, reply card, attach picker, whisper select, RP chip, NPC integrace, send DTO šerování |
| `AppearancePopover.spec.tsx` | color/font UI, preview, save, reset, contrast warn |
| `MentionAutocomplete.spec.tsx` | `@` detekce, filter, keyboard, vložit |
| `NpcOverridePanel.spec.tsx` | toggle, role gating, sticky |
| `MessageEditInline.spec.tsx` | Enter/Esc, save, dice block |
| `RpDateBadge.spec.tsx` | rendering, format `cs-CZ` |
| `useOptimisticSend.spec.tsx` | pending, swap, failed, retry |
| `useChannelMembers.spec.tsx` | filter dle accessMode |
| `useMembershipAppearance.spec.tsx` | query + mutation cache |
| `useUploadWorldAttachment.spec.tsx` | multipart form |
| `parseMentions.spec.ts` | regex edge cases, render escape |
| `chatFonts.spec.ts` | whitelist, getFontStack |
| `emotes.spec.ts` | worldEmotes rozšíření |

### Jest (BE)

| Test | Co covered |
|---|---|
| `chat.service.spec.ts` | hex color, dice edit block, clientNonce idempotence, mention extract, server-fill, push priority |
| `chat.controller.spec.ts` | /appearance, /upload, member guard |
| `upload.service.spec.ts` | `uploadWorldChatFile` folder |
| `chat-message.repository.spec.ts` | `findByNonce` sparse unique |
| `world-membership.repository.spec.ts` | `chatColor`/`chatFont` PATCH |

### Manual smoke (2 prohlížeče × 2 účty)

- Real-time send → příjem do 500 ms.
- Každá feature izolovaně (reply/reakce/whisper/attach/edit/RP/NPC/vzhled/mention).
- Reconnect (toggle WiFi) → idempotent retry.
- Mobil 360×640 a 375×812 — composer kolapse, popovery bottom-sheet.
- Globální chat (`/hospoda`) **netknutý** — barva/font v profilu beze změny.

---

## 6. Polish — finální kroky

1. **`mobil-desktop` skill** — composer rozšíření, popovery, NPC pruh, mention dropdown. Touch terče ≥ 44px.
2. **`napoveda` skill** — sekce „Zprávy ve světovém chatu" v `/ikaros/napoveda` (reply, whisper, NPC, vzhled mé zprávy, mentions, optimistic).
3. **Roadmap check** — zaškrtnout 6.2a–i v [`docs/roadmap-fe.md`](../../roadmap-fe.md).
4. **Dluhy** přes skill `dluh`:
   - `D-NEW-chat-edit-attachments` — edit zpráv neumí přidávat/mazat přílohy.
   - `D-NEW-chat-mention-all` — `@all`/`@here`.
   - `D-NEW-chat-mention-character` — mentions na character names (fáze 8).
   - `D-NEW-chat-mention-sidebar-dot` — červený dot v sidebaru u konverzace s mention-self.

---

## 7. Riziko / rollback per oblast

| Oblast | Pravd. riziko | Mitigace |
|---|---|---|
| `MessageItem` rozšíření o edit/optimistic/mentions = global chat dotyk | Stř. | Všechny nové props **optional**, default chování beze změny → fáze 4 (`ChatRoom`) bez změny chování |
| `clientNonce` sparse index migrace | Nízká | Aditivní index, žádný backfill nutný |
| `WorldMembership.chatColor/chatFont` migrace | Nízká | Aditivní pole, default `null` |
| Google Fonts CDN výpadek | Nízká | `font-display: swap` → fallback stack |
| Optimistic UI desync | Stř. | `clientNonce` BE idempotence + FE WS dedup |
| Mention regex spadne na unicode jména | Stř. | Regex `\w[\w.-]{0,31}` matchuje ASCII login (BE i FE) — character names mimo (dluh) |

**Rollback:** revert per-commit. BE změny aditivní (žádná migrace, žádný drop).

---

## 8. Definice „hotovo"

- [ ] BE: spec §6 body 13 zelený (DTO hex, dice block, membership pole, upload endpoint, clientNonce, mentions).
- [ ] FE: spec §6 body 1–12 zelený (každá feature manuálně ověřena).
- [ ] Vitest + Jest CI zelená.
- [ ] Mobil 360px – desktop 1440px funkční (mobil-desktop audit).
- [ ] Nápověda aktualizována.
- [ ] Roadmapa zaškrtnuta.
- [ ] Dluhy zapsány.
- [ ] Commit/y na main per `feedback_work_on_main`.

---

**Po schválení plánu:** začínám 1.1 (BE N1 hex) → postupně.
