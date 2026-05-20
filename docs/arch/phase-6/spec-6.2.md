# Spec 6.2 — Zprávy ve světovém chatu

**Status:** 🟡 Návrh k odsouhlasení
**Rozsah:** FE (composer + zprávy + per-svět vzhled + optimistic + mentions) + BE (DTO color jako hex, world upload endpoint, `WorldMembership.chatColor/chatFont`, `clientNonce` na message, dice edit guard, mentions detekce + push)
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros`
**Velikost:** odhad ~28 FE souborů / ~2200 ř. + ~10 BE souborů / ~350 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-20
**Souvisí:** [spec-6.1.md](spec-6.1.md), [roadmap-fe.md](../../roadmap-fe.md) (Fáze 6), BE modul `chat`, fáze 4 (`features/chat/` reuse).

> Cíl: světový chat se chová jako **Messenger/Discord per svět** — instantní odeslání, reply, reakce, šepoty, přílohy, edit, NPC, RP datum, mentions, per-svět vzhled mé zprávy (barva + font).

---

## 0. Názvosloví

Dědí z [spec-6.1.md §0](spec-6.1.md) — **kanál** = `ChatGroup` (sbalovací kontejner), **konverzace** = `ChatChannel` (chatovací místnost). Kód/WS držíme na BE názvech.

---

## 1. Cíl

Plný feature set zpráv v `/svet/:worldSlug/chat`:

1. **6.2a** Reply / emoji reakce / whisper (reuse fáze 4).
2. **6.2b** Přílohy (obrázky + dokumenty) přes nový world upload endpoint.
3. **6.2c** Inline editace vlastní zprávy + PJ moderace; dice needitovatelné.
4. **6.2d** RP datum (`YYYY-MM-DD`) — picker v composeru, badge u zprávy.
5. **6.2e** NPC mód (PJ+) — free-text jméno + avatar URL per zpráva.
6. **6.2f** Per-svět vzhled mé zprávy — barva + font v `WorldMembership`, popover v composeru.
7. **6.2g** Custom emote rendering `:shortcode:` (statické fáze 4 + per-svět z 6.4).
8. **6.2h** Optimistic send + retry — zpráva se zobrazí ihned, dedup po WS echo (Discord-like).
9. **6.2i** Mentions `@user` — autocomplete v composeru, push jen mentionovaným.

---

## 2. Kontext / motivace

6.1 dostavělo shell + holé text-only zprávy. Bez 6.2 chat funguje jako pomalá tabule. PJ rozhodnutí (2026-05-20):

- Chat **per svět samostatně** — vlastní barva i font na úrovni `user × world`, ne globální profil.
- Real-time **jako Messenger/Discord** — zpráva zobrazena ihned, ne čekat na server.
- Custom font **dodán v 6.2**, ne dluh.
- Globální chat (`features/chat/`, fáze 4) zůstává oddělený systém — neslučovat.

---

## 3. Audit současného stavu

### 3.1 Backend — co `chat` modul **už umí**

| Endpoint / chování | Stav |
|---|---|
| `POST channels/:id/messages` s `replyToId`, `visibleTo` (whisper), `attachments`, `overrideName/Avatar` (NPC, gated `canManageChat`), `rpDate`, `customFont`, `color`, `isDiceRoll` detekce | ✅ |
| `PATCH messages/:id` — content + `attachmentsToAdd/Remove` (vlastník nebo PJ) | ✅ |
| `PUT messages/:id/reactions/:emoji` — toggle | ✅ |
| `DELETE messages/:id` — soft-delete (vlastník nebo PJ; dice jen PJ) | ✅ |
| WS broadcast `chat.message.created/updated/deleted` | ✅ |
| Whisper visibility filtr (`visibleTo`); PJ vidí všechny šepoty | ✅ |
| `senderName` z `WorldMembership.characterPath` | ✅ |
| Push notifikace všem příjemcům kanálu/whisperu | ✅ (best-effort) |

### 3.2 Backend — nesrovnalosti k opravě v 6.2

| # | Nález | Řešení v 6.2 |
|---|---|---|
| **N1** | [`CreateMessageDto.color`](../../../../Projekt-ikaros/backend/src/modules/chat/dto/create-message.dto.ts) má `@IsIn(['red','blue',...,'default'])` — enum. Schema je volný string, FE 6.1 posílá hex z profilu → BE musí vracet 400, ale nikdo to nezkoušel (color se v 6.1 send mutaci neukládal). | DTO `color?: string` → `@IsHexColor()`. Mazat enum. |
| **N2** | `editMessage` neblokuje `isDiceRoll === true`. Roadmapa říká dice needitovatelné. | Přidat `if (message.isDiceRoll) throw new ForbiddenException(...)` v `editMessage`. |
| **N3** | Žádný upload endpoint pro world chat — global má `POST /global-chat/upload?room=`. | Nový `POST /worlds/:worldId/chat/upload` (reuse Cloudinary infry, folder `world-chat/{worldId}/`). |
| **N4** | Žádné `clientNonce` na `ChatMessage`. Po reconnectu může FE zopakovat send a vzniknou duplikáty. | Aditivní `clientNonce?: string` v DTO/schemat/repository; unique compound index `(channelId, clientNonce)` (sparse). |
| **N5** | Žádný mention parsing v BE — push jde všem příjemcům. Discord/Messenger pingují jen mentionované. | `MENTION_REGEX` v `sendMessage` extrahuje `@username` z content → uložit `mentions: string[]` (userIds). Push: pokud `mentions.length > 0`, jdou priorit jen mentionovaným. |

### 3.3 Frontend — co reuse z fáze 4 (`features/chat/`)

| Komponenta / lib | Reuse | Pozn. |
|---|---|---|
| `MessageItem` | ✅ beze změny | Má `allowReply`/`allowReactions` props — 6.1 si je vypnula, 6.2 přepne na `true`. Rendruje reply citaci, reakce, attachmenty, soft-delete. |
| `MessageAttachments` | ✅ | |
| `EmojiPickerPopover` | ✅ | |
| `parseEmotes` ([emotes.ts](../../../src/features/chat/lib/emotes.ts)) | ✅ | Rozšířit o `worldEmotes` mapu (vstup z 6.4). |
| `guardChatColor` | ✅ | |
| `ChatInput` (fáze 4) | ❌ nepoužít přímo | Je svázaný se `ChatUser[]` z global RoomInfo + `ikaros:whisper` WS. World chat má REST `visibleTo` v DTO. |

### 3.4 Frontend — co dostavět ve `features/world/chat/`

- `ChannelComposer` — rozšířit (ne přepsat): reply bar, attach picker, NPC toggle, RP date picker, vzhled-popover, mention autocomplete.
- `ChannelView` — přepnout `allowReply/Reactions=true`, přidat optimistic insert, retry chip, mention podsvícení.
- Nové: `AppearancePopover`, `MentionAutocomplete`, `NpcOverridePanel`, `RpDateBadge`, `MessageEditInline`, `useOptimisticSend`, `useMembershipAppearance`, `useChannelMembers`, `useMentions`.

---

## 4. Návrh řešení

### 4.1 Struktura souborů (přírůstek nad 6.1)

```
src/features/world/chat/
├── components/
│   ├── ChannelComposer.tsx              # ROZŠÍŘENO — sekce: reply bar, attach, NPC, RP date, vzhled, mentions
│   ├── ChannelComposer.module.css       # ROZŠÍŘENO
│   ├── ChannelView.tsx                  # ROZŠÍŘENO — optimistic insert, retry chip, allowReply=true
│   ├── AppearancePopover.tsx            # 6.2f — barva + font; ukládá do membershipu
│   ├── AppearancePopover.module.css
│   ├── MentionAutocomplete.tsx          # 6.2i — autocomplete @user pod composerem
│   ├── MentionAutocomplete.module.css
│   ├── NpcOverridePanel.tsx             # 6.2e — toggle + (jméno + avatar URL)
│   ├── NpcOverridePanel.module.css
│   ├── RpDateBadge.tsx                  # 6.2d — render badge u zprávy
│   ├── RpDateBadge.module.css
│   └── MessageEditInline.tsx            # 6.2c — inline edit zprávy z MessageItem
├── api/
│   ├── useOptimisticSend.ts             # 6.2h — wraps useSendMessage + cache insert + nonce dedup
│   ├── useEditMessage.ts                # 6.2c — PATCH .../messages/:id
│   ├── useToggleReaction.ts             # 6.2a — PUT .../reactions/:emoji
│   ├── useUploadWorldAttachment.ts      # 6.2b — POST .../upload, multipart
│   ├── useMembershipAppearance.ts       # 6.2f — GET/PATCH membership chatColor/Font
│   ├── useChannelMembers.ts             # 6.2a/i — seznam členů konverzace pro whisper + mentions
│   └── useWorldChat.ts                  # ROZŠÍŘENO — send DTO o reply/whisper/attachments/npc/rpDate/clientNonce/mentions
└── lib/
    ├── chatFonts.ts                     # 6.2f — whitelist 6–8 fontů + @font-face loader
    ├── parseMentions.ts                 # 6.2i — extrakce @user → userIds
    └── nonce.ts                         # 6.2h — uuid v4 client nonce
```

Reuse z fáze 4 beze změny: `MessageItem`, `MessageAttachments`, `EmojiPickerPopover`, `parseEmotes`, `guardChatColor`, `useSocket`, `getSocket`.

### 4.2 6.2a — Reply / reakce / whisper

**Reply.** `MessageItem` má hotovou citaci. `ChannelView` přepne `allowReply={true}`, drží stav `replyTo: ChatMessage | null`, předá do composeru. Composer renderuje reply bar (jako [ChatInput.tsx:174](../../../src/features/chat/components/ChatInput.tsx#L174)). Send DTO dostane `replyToId`.

**Reakce.** `allowReactions={true}` v `MessageItem` zapne picker. Toggle volá `useToggleReaction` → REST `PUT .../reactions/:emoji`. BE odpoví `chat.message.updated` přes WS → `ChannelView` už listenuje → re-render.

**Whisper.** Composer má dropdown „Komu" — `Všem | → member`. Seznam = `useChannelMembers(channelId)` (členové konverzace dle `accessMode`). Searchable když členů > 10. Send DTO dostane `visibleTo: [memberUserId]` (BE auto-doplní odesílatele). PJ+ vždy vidí všechny šepoty (BE už dělá v `getMessages` filtru).

⚠️ **Whisper × NPC × reply jsou kompozovatelné** — DTO je akumulativní, FE composer drží všechny tři stavy nezávisle. Odeslání zformátuje DTO podle aktivních.

### 4.3 6.2b — Přílohy (obrázky + dokumenty)

**BE — nový endpoint** (`Projekt-ikaros`):

```ts
// chat.controller.ts
@Post('upload')
@UseFilters(MulterExceptionFilter)
@UseInterceptors(FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: ATTACHMENT_MAX_BYTES }, // 10 MB, shared const
}))
uploadAttachment(
  @Param('worldId') worldId: string,
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: RequestUser,
) {
  // member-only guard (memberOnly už dělá worldId v URL)
  return this.uploadService.uploadWorldChatFile(file, worldId);
}
```

`upload.service.ts` dostane metodu `uploadWorldChatFile(file, worldId)` — Cloudinary folder `world-chat/{worldId}/`, same MIME whitelist jako global chat. Limity: 10 MB / soubor, 10 obrázků / 4 dokumenty per zpráva (DTO `attachments` má `@ArrayMaxSize(10)` — kombinovaně).

**FE.** `useUploadWorldAttachment(worldId)` zrcadlí [`useUploadAttachment`](../../../src/features/chat/api/useGlobalChat.ts) z fáze 4. Composer má attach button (paperclip) → file input → preview lišta s × → upload-on-send (až při odeslání, ne při výběru). Reuse [`attachments.ts`](../../../src/features/chat/lib/attachments.ts) (limity, klasifikace).

📚 **Upload-on-send** = soubor se nahraje na Cloudinary až ve chvíli kdy user mačká Send. Pokud user smaže draft, žádné osiřelé soubory na Cloudinary. Důsledek: send má větší latenci, ale optimistic UI to zakryje (6.2h ukáže pending stav).

### 4.4 6.2c — Inline editace zpráv

**BE — `editMessage` guard:**

```ts
if (message.isDiceRoll) {
  throw new ForbiddenException({
    code: 'CHAT_DICE_NOT_EDITABLE',
    message: 'Hod kostkou nelze upravovat',
  });
}
```

**FE — `MessageEditInline`:**
- Klik na „✎" v `MessageItem.actions` → swap body za `<textarea>` s aktuálním content + tlačítka „Uložit / Esc".
- Enter (bez Shift) = uložit, Esc = zrušit.
- `useEditMessage(worldId).mutate({ messageId, content })`.
- BE odpoví, broadcast `chat.message.updated` → `ChannelView` cache update → text se přepíše, `isEdited: true` zobrazí badge `(upraveno)` v `MessageItem`.

Tlačítko „✎" se ukazuje pro: vlastní zprávy bez `isDiceRoll`, **nebo** pro PJ/Admin (moderace). Vlastník po edit cizí zprávy = nemožné (BE blokuje).

⚠️ **Edit attachments v 6.2** — UI jen content. `attachmentsToAdd/Remove` v DTO zatím nepoužíváme. Důvod: edit kompozice je rabbit-hole UX (drag-add, klik-remove, validace limitů znovu) → out of scope, dluh `D-NEW-chat-edit-attachments`.

### 4.5 6.2d — RP datum

**Composer.** Ikona 📅 mezi attach a NPC togglem → otevře HTML5 `<input type="date">` v popoveru, kde lze datum vybrat nebo zrušit. Vybrané datum se ukáže jako chip nad textareou (`📅 21. 4. 1453 ×`). Send DTO dostane `rpDate: '1453-04-21'`. Po sendu se chip vynuluje (datum není sticky).

📚 **`<input type="date">` na rok 1453?** HTML5 date je 100% v pohodě i pro historická data; `min`/`max` ad-hoc nevolíme (světy s alternativní časovou linií). Kalendář světa (fáze 9.2) později nahradí HTML picker custom widgetem; do té doby free-form datum stačí.

**Render.** `MessageItem` props se rozšíří o `rpDate?: string` → renderuje `RpDateBadge` (malý badge nad zprávou: „📅 21. 4. 1453" v drobnějším muted stylu). Lokalizace data přes `Intl.DateTimeFormat('cs-CZ', ...)`.

### 4.6 6.2e — NPC mód

**Composer panel `NpcOverridePanel`** — viditelný **jen pro `PomocnyPJ+`**:
- Toggle „🎭 NPC mód" v hlavičce composeru.
- Po zapnutí pod ním řádek `[jméno NPC] [avatar URL]`.
- Send DTO dostane `overrideName: '...', overrideAvatarUrl: '...'`.
- BE už override gating dělá ([chat.service.ts:540](../../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L540)).
- Stav NPC sticky **napříč zprávami** (PJ často píše víc NPC replik za sebou). Vypne se kliknutím toggle, ne odeslání.

📚 **NPC vs. mentions vs. whisper:** NPC mění zobrazené jméno/avatar, ale `senderId` zůstává PJ. Mentions na NPC nemají smysl — autocomplete bere reálné userIDs. Whisper od NPC = whisper od PJ; příjemce v UI uvidí jméno NPC.

⚠️ **Adresář postav (fáze 8)** — v 6.2 jen free-text. Vstup `avatar URL` validuje FE (URL pattern), neřeší 404. Volba z postav světa se v fázi 8 přidá jako další tab v popoveru.

### 4.7 6.2f — Per-svět vzhled mé zprávy

**Klíčové rozhodnutí:** barva + font patří k `user × world`, ne k uživateli globálně.

**BE — `world-membership.schema.ts`:**

```ts
@Prop({ type: String, default: null })
chatColor: string | null;             // hex, např. '#a78bfa'

@Prop({ type: String, default: null })
chatFont: string | null;              // klíč z whitelistu (CHAT_FONTS)
```

**BE — endpointy** (rozhodnutí: vlastní mini-controller pro per-svět chat appearance, ať to není zamíchané s membership management endpointy admin panelu):

```
GET    /worlds/:worldId/chat/appearance         → { chatColor, chatFont }
PATCH  /worlds/:worldId/chat/appearance         → body { chatColor?, chatFont? }
```

Guard `memberOnly`. PATCH validuje hex pro color, `@IsIn(CHAT_FONT_KEYS)` pro font.

**BE — `CreateMessageDto`:**

- `color?: string` → `@IsHexColor()` (řeší N1).
- `customFont?: string` → `@IsIn(CHAT_FONT_KEYS)` (whitelist).
- **Server-side fill from membership** — pokud DTO `color`/`customFont` nepřijde, `sendMessage` doplní z `membership.chatColor` / `membership.chatFont`. FE pak nemusí color/font v DTO posílat → menší payload.

**FE — `AppearancePopover`:**
- Tlačítko 🎨 (paleta) v levé části composeru → popover.
- Sekce **Barva**: `<HexColorPicker>` (existující komponenta z [ChatColorPicker](../../../src/features/profile/components/ChatColorPicker/ChatColorPicker.tsx)) + live preview chat-bubble se vzorovou zprávou („Tvá zpráva by vypadala takto.").
- Sekce **Font**: radio list `chatFonts.ts` whitelist (6–8 fontů). Preview se mění současně s výběrem.
- Tlačítka „Uložit / Zrušit" → PATCH membership, optimistic update, toast.
- **Reset** — „Použít výchozí" (uloží `null` → BE bere `User.chatColor` / system font fallback).

**FE — `chatFonts.ts`:**

```ts
export const CHAT_FONTS = [
  { key: 'system', label: 'Systémový',     stack: 'system-ui, -apple-system, sans-serif' },
  { key: 'serif',  label: 'Patkový',        stack: '"Lora", Georgia, serif' },
  { key: 'mono',   label: 'Strojopis',      stack: '"IBM Plex Mono", monospace' },
  { key: 'cinzel', label: 'Středověký',     stack: '"Cinzel", serif' },
  { key: 'caveat', label: 'Rukopis',        stack: '"Caveat", cursive' },
  { key: 'orbitron', label: 'Futuristický', stack: '"Orbitron", sans-serif' },
  { key: 'cormorant', label: 'Knižní',      stack: '"Cormorant Garamond", serif' },
  { key: 'jbmono', label: 'Kód',            stack: '"JetBrains Mono", monospace' },
] as const;
export const CHAT_FONT_KEYS = CHAT_FONTS.map(f => f.key);
```

Tyto fonty se loadnou jednou v `index.html` (Google Fonts CDN `<link>`) — preload jen `latin-ext` subset. ~50 kB celkem.

**FE — `MessageItem` rozšíření:**
- Props `customFont?: string` (klíč). Resolve přes `chatFonts.ts` → `font-family` inline na `.content`.
- `color` už `MessageItem` umí (z 4.x).

📚 **Per-svět vs. globální:** v profilu (`/ikaros/profil` Vzhled) zůstává `User.chatColor` (jen pro globální chat). Ve světovém chatu uživatel vidí svůj globální color jen jako fallback, dokud si v daném světě nenastaví vlastní.

### 4.8 6.2g — Custom emote rendering

**FE.** `parseEmotes` v [emotes.ts](../../../src/features/chat/lib/emotes.ts) už nahrazuje `:smile:` atd. statickou sadou. Rozšířit signaturu:

```ts
export function parseEmotes(
  text: string,
  worldEmotes?: Map<string, string>, // shortcode → imageUrl
): ReactNode[];
```

`MessageItem` dostane `worldEmotes` prop (zatím undefined; 6.4 ho naplní z `useWorldEmotes(worldId)`). Render: pokud worldEmotes obsahuje shortcode, vloží `<img class="emote" src={url} alt={`:${shortcode}:`} />`; jinak fallback na statickou sadu.

CSS: `.emote { height: 1.4em; vertical-align: -0.25em; }` (Discord-like inline rendering, ne block).

### 4.9 6.2h — Optimistic send + retry (Discord-like)

**FE — `useOptimisticSend(worldId, channelId)`:**

```ts
function send(payload: SendPayload) {
  const clientNonce = uuid();
  const optimistic: ChatMessage = {
    id: `local-${clientNonce}`,
    channelId,
    senderId: currentUser.id,
    senderName: membership.characterPath ?? currentUser.username,
    content: payload.content,
    color: membership.chatColor ?? currentUser.chatColor,
    customFont: membership.chatFont,
    createdAt: new Date().toISOString(),
    isEdited: false,
    isDeleted: false,
    reactions: {},
    attachments: payload.attachments ?? [],
    clientNonce,
    /* … */
    _status: 'pending', // FE-only field
  };
  qc.setQueryData(messagesKey, (old) => [...(old ?? []), optimistic]);

  api.post(...).then((server) => {
    qc.setQueryData(messagesKey, (old) =>
      old.map((m) => (m.clientNonce === clientNonce ? server : m))
    );
  }).catch(() => {
    qc.setQueryData(messagesKey, (old) =>
      old.map((m) => m.clientNonce === clientNonce ? { ...m, _status: 'failed' } : m)
    );
  });
}
```

**WS dedup.** `handleMessage` v `ChannelView` už dedupuje dle `id`. Přidat dedup dle `clientNonce` — pokud přichozí zpráva má nonce shodný s existujícím `local-*`, swap zpráv, ne push.

**BE — `clientNonce` field.**
- DTO `CreateMessageDto.clientNonce?: string` (`@IsOptional() @IsUUID()`).
- Schema `ChatMessageSchemaClass.clientNonce?: string`.
- Repo `save`: pokud `clientNonce` přijde, vložit do save.
- Sparse unique index `{ channelId: 1, clientNonce: 1 }` — pokud BE dostane stejné nonce dvakrát (FE retry po WS dropu), Mongo vrátí duplicate key → service to převede na 200 OK s existující zprávou (idempotence).

**FE — `MessageItem` rozšíření:**
- Pokud `_status === 'pending'` → opacity 0.6, malý spinner vpravo.
- Pokud `_status === 'failed'` → červený border + chip „Nepodařilo se odeslat. **Znovu** | **Smazat**".

📚 **Proč `clientNonce` a ne timestamp:** dva uživatelé můžou poslat zprávu v stejnou ms; nonce je vždy unique. Plus chrání proti retry po reconnectu.

### 4.10 6.2i — Mentions `@user`

**FE — `MentionAutocomplete`:**
- V composeru během psaní detekce `@` (regex `(?:^|\s)@(\w*)$` na pozici kurzoru) → otevře popover nad textareou se seznamem `useChannelMembers` filtrovaným prefixem.
- ↑/↓ navigace, Enter/Tab vloží `@username `, Esc zavře.
- Render mentions v `MessageItem.content` — `parseMentions(content, mentionedUserIds)` vrátí pole React nodes; `@username` se obalí do `<span class="mention">@username</span>`. Pokud mention míří na aktuálního usera → `<span class="mentionSelf">…</span>` (akcent).

**BE — detekce v `sendMessage`:**

```ts
const MENTION_REGEX = /(?:^|\s)@(\w[\w.-]{0,31})/g;
const mentionedUsernames = [...dto.content?.matchAll(MENTION_REGEX) ?? []]
  .map(m => m[1]);
const mentioned = await this.userRepo.findByUsernames(mentionedUsernames);
const mentions = mentioned.map(u => u.id);
```

Uložit do `ChatMessage.mentions: string[]`. Push priorita: pokud `mentions.length > 0`, push jde **jen mentionovaným** (s tagem „mention"). Bez mention push jde všem příjemcům (chování 6.1, opt-out později).

⚠️ **`@all` / `@here`** — out of scope (Discord-like rozšíření, dluh `D-NEW-chat-mention-all`).

📚 **Mentions matchují `username`, ne `characterPath`** — proto je `@franta` (login), ne `@Frantíkův synek`. Pokud chceme matchovat i character names, dluh.

### 4.11 Datový tok send (kompletní)

1. User mačká Enter v composeru.
2. FE: `useOptimisticSend.send(payload)` → vloží optimistic zprávu do cache (`_status: pending`).
3. FE: `api.post('/messages', { ...payload, clientNonce })`.
4. BE: validuje, ukládá s `clientNonce`, detekuje mentions, broadcast `chat.message.created` všem klientům v `chat:{channelId}` room.
5. FE odesílatele: response z POSTu přijde dřív než WS echo (běžně) → swap optimistic za real (match `clientNonce`).
6. FE odesílatele: WS `chat:message` přijde → dedup (zpráva už v cache podle ID i nonce) → no-op.
7. FE ostatní: WS `chat:message` přijde → push do cache, render.

Retry: pokud POST `catch` → `_status: failed` → user mačká Znovu → stejný `clientNonce` re-poslán → BE idempotentní (sparse unique).

---

## 5. Out of scope

- **Edit attachments** (add/remove při edit) → dluh `D-NEW-chat-edit-attachments`.
- **Read receipts per zprávu** (Messenger seen) — máme `markAsRead` per kanál (Discord-style). Per-message viewer není MVP.
- **Pin zprávy** → mimo MVP.
- **Threads** → mimo MVP.
- **Edit history viewer** → máme jen `isEdited` badge, full history viewer nemá MVP.
- **`@all` / `@here` mentions** → dluh `D-NEW-chat-mention-all`.
- **Character-name mentions** (@postava) → dluh `D-NEW-chat-mention-character` (fáze 8).
- **NPC výběr z adresáře postav** → fáze 8.
- **RP datum napojené na kalendář světa** → fáze 9.2.
- **Custom font runtime injection** — držíme whitelist (varianta A), žádné Google Fonts ad-hoc URL.
- **Dice picker / engine** → 6.3.
- **Per-svět emote upload UI** → 6.4 (6.2g jen rendering).

---

## 6. Acceptance kritéria

1. **Reply** funguje — klik na ✎/Reply v `MessageItem` otevře reply bar; po Send se zpráva pošle s `replyToId`; v UI se renderuje citace nad zprávou; klik na citaci scrolluje k originálu.
2. **Reakce** — picker po `SmilePlus`, REST `PUT .../reactions/:emoji`, WS update, toggle funguje, chip „2× 👍" s `chipMine` highlightem pro vlastní reakci.
3. **Whisper** — dropdown s členy konverzace; výběr → composer placeholder „Šeptaná zpráva…"; send pošle `visibleTo: [memberId]`; příjemce vidí `[šepot od X]`, ostatní zprávu nevidí; PJ vidí všechny šepoty.
4. **Přílohy** — paperclip → file picker → preview lišta → Send nahraje na BE `world-chat/{worldId}/...` → render `MessageAttachments` v zprávě; limity 10 MB, 10 img + 4 doc.
5. **Editace** — klik na ✎ vlastní zprávy → inline textarea → Enter uloží → BE PATCH → WS update → text se přepíše + badge `(upraveno)`; dice editace zakázaná (BE 403, FE skryje ✎).
6. **RP datum** — picker v composeru, datum se zformátuje na chip, Send pošle `rpDate`; v zprávě `RpDateBadge` „📅 21. 4. 1453".
7. **NPC mód** — viditelný jen `PomocnyPJ+`; toggle + jméno + avatar URL; Send pošle override; zpráva se zobrazí pod NPC identitou; sticky napříč zprávami; vypne se klikem toggle.
8. **Per-svět vzhled** — 🎨 popover, color picker + 8 fontů, live preview; Uložit → PATCH `/chat/appearance` → další zprávy nesou novou identitu; reset funguje; barva/font nepřetékají do globálního chatu.
9. **Custom emote rendering** — `:smile:` se nahradí emoji; per-svět emote (mock map) se nahradí `<img>`.
10. **Optimistic send** — po Enter se zpráva objeví ihned se `_status: pending`; po BE response se status zmizí; pokud send selže, červený border + Znovu/Smazat; retry je idempotentní.
11. **Mentions** — `@` v composeru otevře autocomplete; výběr vloží `@username `; v `MessageItem` se mention podsvítí; mentioned user dostane push se značkou „mention"; ostatní příjemci ne (pokud `mentions.length > 0`).
12. **Real-time** — odeslání A → příjem B do 500 ms při WS spojení; reconnect po výpadku znovu doručí (BE idempotence přes `clientNonce`).
13. **BE consistency** — `CreateMessageDto.color` je `@IsHexColor()`; dice nelze editovat (`CHAT_DICE_NOT_EDITABLE`); `WorldMembership` má `chatColor` + `chatFont`; `world-chat/upload` endpoint existuje; `clientNonce` unique index v Mongo.
14. **mobil-desktop** audit hotov — composer kolaps mobilu (sekundární tlačítka pod přetékajícím „+" menu).
15. **napoveda** aktualizována — sekce „Zprávy" v `/ikaros/napoveda` (reply, whisper, NPC, vzhled mé zprávy, mentions).

---

## 7. Test plán

### Automated (Vitest + RTL)

- `useOptimisticSend.spec.ts` — optimistic insert, swap po response, swap po WS echo, failed retry, nonce dedup.
- `MessageEditInline.spec.tsx` — Enter/Esc, save, PATCH call, dice block.
- `AppearancePopover.spec.tsx` — color/font výběr, save, reset.
- `MentionAutocomplete.spec.tsx` — `@` detection, filter dle prefixu, Enter vloží, Esc zavře.
- `NpcOverridePanel.spec.tsx` — toggle, gating dle role.
- `parseMentions.spec.ts` — `@user` regex, `@user.dot`, vícenásobné mentions, escape.
- `chatFonts.spec.ts` — whitelist klíčů, stack fallbacky.
- `useUploadWorldAttachment.spec.ts` — multipart payload.
- `parseEmotes.spec.ts` — rozšířit o worldEmotes map.

### Automated (Jest BE)

- `chat.service.spec.ts` — dice edit block, mention detekce, clientNonce idempotence (2x stejný nonce → 1 zpráva).
- `chat.controller.spec.ts` — `/upload` endpoint guard (member-only), `/appearance` PATCH validace.
- `upload.service.spec.ts` — `uploadWorldChatFile` folder layout.
- `world-membership.repository.spec.ts` — `chatColor`/`chatFont` PATCH.

### Manual smoke (2 prohlížeče × 2 účty)

- Send → instant zobrazení; B vidí do 500 ms.
- Reply / Reakce / Whisper / Edit / Attach / NPC / RP datum / Vzhled / Mention — každá feature izolovaně.
- Reconnect (vypnout/zapnout WiFi) → retry doručí zprávu jednou.
- Mobil 375 × 667 — composer kolapse, popovery nepřetékají viewport.
- Globální chat (`/hospoda`) **není ovlivněn** — barva/font globálně beze změny.

---

## 8. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| Optimistic UI desync (FE řekne sent, BE odmítl) | Stř. | User vidí zprávu, server ji nemá | Catch v `useOptimisticSend` přepne na `failed`, retry button |
| `clientNonce` index migrace na produkční DB | Nízká | Pomalá migrace | Sparse index, run na startup migrations |
| Whitelist 8 fontů × 12 skinů → konflikt s tematickým fontem skinu | Stř. | Hluk v UI | Skin font nepřebíjí — `font-family` na `.content` je inline, vyhrává |
| Mentions push spam | Stř. | Notifikace flood | Push jen mentioned, ne všem; opt-out per kanál v dluhu |
| Edit attachments missing | Nízká | Drobná UX díra | Dluh `D-NEW-chat-edit-attachments` |
| Race optimistic + WS echo | Stř. | Duplikát v UI | Dedup dle `clientNonce` v `handleMessage` |
| Upload endpoint chybný folder | Nízká | Cloudinary bordel | Test `upload.service.spec.ts` ověří folder |
| Per-svět color/font v globálním chatu | Nízká | Identity leak | `features/chat/` (global) nečte z membership — explicitní oddělení |

**Rollback:** revert. `WorldMembership.chatColor/chatFont` defaultně `null` (aditivní), `clientNonce` aditivní, `mentions` aditivní. Žádná migrace dat nutná.

---

## 9. Otázky / rozhodnutí

Rozhodnuto v brainstormu (2026-05-20):

- ✅ Per-svět color + font v `WorldMembership`, ne v `User`.
- ✅ Font whitelist (varianta A) — 8 Google Fontů, latin-ext subset.
- ✅ Custom font součást 6.2 (ne dluh).
- ✅ Optimistic send + `clientNonce` do 6.2 (sub-task 6.2h).
- ✅ Mentions `@user` do 6.2 (sub-task 6.2i).
- ✅ Read receipts per zprávu / pin / threads — mimo MVP.
- ✅ DTO `color` → hex (řeší N1); enum smazat.

K potvrzení ve spec review:

- **Popover „Vzhled" v composeru** vs. samostatná stránka `/svet/:slug/profil` (kterou nemáme). Návrh: popover v composeru, profil přijde později.
- **Server-side fill** color/font z membershipu když DTO nepošle — OK?
- **Mention regex** `@\w[\w.-]{0,31}` (username, žádné mezery) — OK?

---

**Po schválení specu:** `frontend-design` audit (composer rozšíření, popover Vzhled, mention autocomplete, NPC panel, RP picker, optimistic chip) → implementační plán `plan-6.2.md`.
