# Plán 6.1 — Světový chat: shell + kanály

Implementační plán k [`spec-6.1.md`](spec-6.1.md). Design → [`design-6.1.md`](design-6.1.md).
Pořadí, file diff, CLI. Čte se po schválení specu, před kódem.

> **Názvosloví** (spec §0): **kanál** = `ChatGroup` (sbalovací kontejner),
> **konverzace** = `ChatChannel` (chatovací místnost). Kód drží BE názvy
> (`ChatChannel`, `channelId`); mění se jen UI popisky.

---

## 0. Pořadí implementace (commity)

Práce na `main` (per `feedback_work_on_main`). Logické dávky:

1. **BE** — repo `Projekt-ikaros`: access filtr + presence + `imageUrl` + `lastMessagePreview` (§1).
2. **FE-a** — doména `world/chat`, types, API vrstva, `WorldChatRoom` skeleton (§2.1–2.3).
3. **FE-b** — sidebar kanálů/konverzací + barevné kódování + náhled zprávy (§2.4).
4. **FE-c** — připínání kanálů (§2.5).
5. **FE-d** — real-time + presence panel (§2.6).
6. **FE-e** — read status + nav badge (§2.7).
7. **FE-f** — zakládání kanálů a konverzací (§2.8).
8. **Skin** — token-level skinování + CSS-only ornamenty (§2.9).
9. `mobil-desktop` audit, `napoveda`, zaškrtnutí roadmapy (§4).

BE musí jít první — FE-d/e na něm závisí. FE-a–c lze dělat paralelně s BE.

---

## 1. Backend (repo `Projekt-ikaros`)

### B1 — Přístup ke kanálům: filtr + role floor  ⚠️ nesrovnalost ze specu §3.3 #1

Dnes `getGroupsWithChannels` vrací **všechny** kanály světa bez ohledu na `accessMode`
→ únik privátních kanálů na FE. Oprava + role floor globálního kanálu:

- `chat.service.ts` `hasChannelAccess` — pro `accessMode: 'all'` přidat podmínku
  `membership.role >= WorldRole.Hrac` (≥ 2) → `Zadatel`/`Ctenar` `all` kanály nevidí
  (rozhodnutí review). `members`/`roles` beze změny.
- `chat.service.ts` — `getGroupsWithChannels(worldId, requester)`: po načtení kanálů
  přefiltrovat přes `hasChannelAccess`; PJ+ (`canManageChat`) vidí **vše** včetně 1:1
  (rozhodnutí „1:1 vidí všichni PJ+"). `Promise.all` nad filtrem.
- `chat.controller.ts` `GET groups` — předat `user`.
- Ověřit ostatní volání `getGroupsWithChannels` (grep) — upravit signaturu.
- `chat.service.spec.ts` — hráč nevidí cizí `members` kanál; Čtenář nevidí `all`
  kanál; PomocnyPJ vidí 1:1 dvou jiných.

### B2 — Presence world chatu  (spec §4.7 A)

Nový **`ChatPresenceService`** (in-memory) — sdílený gateway i controllerem:

- `chat-presence.service.ts` — `Map<channelId, Map<socketId, PresenceUser>>`;
  `PresenceUser = { userId, username, avatarUrl?, worldRole }`; metody
  `join/leave/leaveAll(socketId)/list(channelId)`.
- `chat.gateway.ts`:
  - `@SubscribeMessage('chat:channel:join')` `{ channelId, user }` → `presence.join`,
    broadcast `chat:presence { channelId, userId, username, avatarUrl, worldRole,
    action:'join' }` do `chat:{channelId}`. `worldRole` z membership (kvůli grupování
    panelu dle role — §2.6).
  - `@SubscribeMessage('chat:channel:leave')` `{ channelId }` → analogicky `leave`.
  - `handleDisconnect` → `presence.leaveAll(client.id)` + broadcast `leave` pro
    dotčené konverzace.
- `chat.controller.ts` — `GET channels/:channelId/presence` → `presence.list(id)`
  (za `JwtAuthGuard`, ověřit `hasChannelAccess`).
- `chat.module.ts` — registrovat `ChatPresenceService`.
- Nový `chat-presence.service.spec.ts` — join/leave/leaveAll.
- Aktualizovat `docs/websocket-api.md`.

> Presence drží jen běh procesu (single-instance MVP) — viz riziko ve specu §8.

### B3 — `imageUrl` na `ChatGroup`  (spec §4.7 B)

- `chat-group.schema.ts` — `@Prop({ type: String }) imageUrl?: string`.
- `chat-group.interface.ts` — `imageUrl?: string`.
- `create-group.dto.ts` + `update-group.dto.ts` — `@IsOptional() @IsString() @MaxLength(512) imageUrl?: string`.
- `createGroup`/`updateGroup` — propsat `dto.imageUrl`.
- Obrázek se nahraje **stávajícím** `POST /upload/image` (FE), uložená URL se pošle
  v `imageUrl`. Žádný nový upload endpoint.
- `chat.service.spec.ts` — `imageUrl` projde do kanálu.

### B4 — `lastMessagePreview` na `ChatChannel`  (spec §4.7 E)

- `chat-channel.schema.ts` — `@Prop({ type: String }) lastMessagePreview?: string`.
- `chat-channel.interface.ts` — `lastMessagePreview?: string`.
- `sendMessage` — po uložení zprávy aktualizovat konverzaci: `lastMessagePreview`
  = `content.slice(0, 80)` (u dice/příloh bez textu fallback „🎲 hod" / „📎 příloha"),
  vedle stávajícího `lastMessageAt`.
- `getGroupsWithChannels` pole vrací (už vrací celé `ChatChannel`).
- `chat.service.spec.ts` — `lastMessagePreview` se nastaví po `sendMessage`.

---

## 2. Frontend (repo `Projekt-ikaros-FE`)

Nová doména `src/features/world/chat/`. Reuse z `features/chat/`: `MessageList`,
`MessageItem`, `ChatInput`, `UserList`, `TypingIndicator`, `api/socket.ts`,
`api/useSocket.ts`, `lib/emotes.ts`, `lib/chatColorGuard.ts`, `lib/chatItems.ts`.

### 2.1 Typy — `lib/types.ts`

```ts
export interface ChatGroup { id; worldId; name; order; imageUrl?; }   // = „kanál"
export interface ChatChannel {                                        // = „konverzace"
  id; groupId; worldId; name; isGlobal;
  accessMode: 'all'|'roles'|'members';
  allowedRoles: number[]; allowedMemberIds: string[];
  lastMessageAt?: string; lastMessagePreview?: string; order; type;
}
export interface GroupWithChannels { group: ChatGroup; channels: ChatChannel[]; }
export interface ChannelPresenceUser { userId; username; avatarUrl?; worldRole: number; }
export interface UnreadMap { [channelId: string]: number; }
```

`ChatMessage` pro world chat = reuse typ z `features/chat/lib/types.ts` (fáze 4 ho má;
BE world `ChatMessage` je superset — pole `overrideName`/`rpDate`/`customFont`/
`isDiceRoll` přidá až 6.2).

### 2.2 API vrstva

| Soubor | Obsah |
|---|---|
| `api/useWorldChat.ts` | `useChatGroups(worldId)` → `GET groups`; `useChannelMessages(channelId)` → `GET channels/:id/messages`; `useSendMessage`, `useMarkRead`, `useUnread(worldId)`; `worldChatKeys()` query klíče |
| `api/useChannelPresence.ts` | REST seed `GET channels/:id/presence` + WS `chat:presence` → udržuje seznam |
| `api/usePinnedChannels.ts` | čte `currentUser.chatPreferences.pinnedChannelIds`; `togglePin` → debounced `PATCH /users/me` (**ověřit endpoint** — §5) |
| `api/useChannelMutations.ts` | `useCreateGroup`, `useCreateChannel`, `useUploadGroupImage` (`POST /upload/image`) |

`worldId` / `worldSlug` / `userRole` z `useWorldContext()`.

### 2.3 `WorldChatRoom` — orchestrátor

`components/WorldChatRoom.tsx` — drží stav `activeChannelId`, skládá 3 panely
(hráč 2). Mount: `useChatGroups` + `useUnread`, `emit('room:join','world:'+worldId)`.
Výběr aktivní **konverzace**: poslední otevřená (localStorage per svět) → fallback
první přístupná. WS listenery `chat:group:*` / `chat:channel:*` → invalidace
`useChatGroups`.

`pages/WorldChatPage.tsx` — přepis stubu: `useWorldContext` guard + `<WorldChatRoom/>`.

### 2.4 Sidebar  (6.1b)

| Soubor | Obsah |
|---|---|
| `components/ChannelSidebar.tsx` | pinned sekce + kanály (`ChatGroup`); sbalování per kanál (`useState`) |
| `components/ChannelGroup.tsx` | kanál: hlavička chevron, název, mini-thumb `imageUrl`, barevný hřbet; tlačítko „+ Konverzace" (PJ) |
| `components/ChannelItem.tsx` | konverzace (`ChatChannel`), dvouřádková: ikona `accessMode` + název + unread badge; 2. řádek náhled `lastMessagePreview`; pin toggle, aktivní stav |
| `lib/groupColor.ts` | `groupColorSlot(groupId)` → index 0–5 (hash); 6 slotů `--chat-group-1…6` |

### 2.5 Připínání  (6.1c)

`ChannelItem` 📌 toggle → `usePinnedChannels.togglePin`. Připnuté konverzace v horní
sekci `ChannelSidebar` (řazení dle pořadí v poli). Persist debounced 600 ms.

### 2.6 Real-time + presence  (6.1d)

| Soubor | Obsah |
|---|---|
| `components/ChannelView.tsx` | aktivní konverzace: header (název + nit) + `MessageList` + `ChatInput`; WS room join/leave per konverzace; `chat:message/:deleted/:typing`; `POST read` při otevření |
| `components/ChannelMemberPanel.tsx` | **jen `userRole >= WorldRole.PomocnyPJ`**; roster grupovaný dle world role — 3 sbalovací sekce Vypravěči (PJ+PomocnyPJ) / Korektoři (Korektor) / Ostatní (Hrac+Ctenar+Zadatel); online tečka z `useChannelPresence`; reuse `UserList` (rozšířit o sekce + indikátor) |

`ChannelView` emituje `chat:channel:join`/`:leave` (všichni — i hráč, viz spec §4.4).
`ChatInput` dostane prop `minimal` → skryje whisper/přílohy (zapne 6.2).

### 2.7 Read status  (6.1e)

- Unread: `useUnread` seed + WS `chat:unread` → `worldChatKeys().unread` cache.
- Badge u konverzace v `ChannelItem`; soft-deleted zpráva už řeší `MessageItem` (fáze 4).
- **Nav badge** „Chat" světa — suma unread. Ověřit world nav komponentu (§5),
  napojit přes `useUnread`.

### 2.8 Zakládání kanálů a konverzací  (vtaženo z 6.5)

| Soubor | Obsah |
|---|---|
| `components/CreateGroupDialog.tsx` | titulek „Nový kanál"; název + upload obrázku; `useCreateGroup` + `useUploadGroupImage` |
| `components/CreateChannelDialog.tsx` | titulek „Nová konverzace"; název, kanál, `accessMode`; `roles` → multiselect world rolí, `members` → multiselect členů světa (`useWorldMembers` — ověřit zdroj); akce **„1:1 se všemi hráči"** |

Gating tlačítek: `userRole >= WorldRole.PomocnyPJ`. Reuse `Dialog`/`Modal` ze `shared/ui`.

**Hromadné 1:1** — v `useChannelMutations` funkce `createOneToOneForAll`: načte členy
světa `role >= Hrac`, vyřadí ty, co už mají 1:1 kanál `[PJ, hráč]` (kontrola nad
`useChatGroups` daty), pro zbytek smyčka `POST groups/:id/channels` s
`accessMode:'members'`, `allowedMemberIds:[requesterId, hracId]`. Idempotentní.

### 2.9 Skinování  (design §7)

- CSS moduly per komponenta, **jen `--theme-*` tokeny** → token-level skin zdarma.
- Chat vystaví opt-in proměnné (`--chat-panel-texture` aj.) s fallbackem.
- Signature „nit kanálu": barva kanálu jako `color-mix` → levý seam `ChannelView`,
  focus-ring `ChatInput`, podtržení headeru konverzace.
- Per-skin ornamenty: zatím **CSS-only** (seamy, hřbety). Rastrové textury až po
  dodání assetů autorem ([`skin-asset-prompts.md`](skin-asset-prompts.md)) → doplní
  se do per-skin `decorations.css` v `[data-theme]` scope.

---

## 3. Reuse fáze 4 — beze změny

`MessageList`, `MessageItem`, `ChatInput` (+ prop `minimal`), `UserList`,
`TypingIndicator`, `getSocket`, `useSocketEvent`, `emotes`, `chatColorGuard`,
`chatItems`. **`ChatRoom` (fáze 4) se nesahá** — world chat má vlastní `WorldChatRoom`.

---

## 4. Po implementaci

1. `mobil-desktop` audit — 3-panel → mobil drawer/sheet.
2. `napoveda` — světový chat + role/oprávnění (PJ správa kanálů, presence panel).
3. Roadmapa — zaškrtnout 6.1a–f + audit.
4. `dluhy.md` — zapsat `D-NEW-channel-group-sync` (auto-sync členství družiny ↔
   konverzace), `D-NEW-chat-presence-scale` (in-memory presence × multi-instance),
   `D-NEW-chat-last-seen` (časové štítky offline členů presence panelu).
5. Spec — status → ✅ Hotovo, doplnit §„odchylky ze smoke testu" pokud nějaké.

---

## 5. K ověření během implementace

- **PATCH user endpoint** pro `chatPreferences` — existuje `/users/me`? Pokud ne →
  drobná BE dostavba (jako 4.1 §4.7).
- **World nav komponenta** — kde je položka „Chat" světa, kam pověsit unread badge.
- **`useWorldMembers`** — existuje hook na seznam členů světa (pro `members` picker)?
- **`getGroupsWithChannels` callers** — grep, zda B1 nerozbije jiné volání.
- **`isPJ` vs `userRole`** — presence panel i tlačítka zakládání gatovat explicitně
  `userRole >= WorldRole.PomocnyPJ` (= „všichni PJ+", kryje i 1:1 viditelnost). `isPJ`
  z kontextu nepoužívat, dokud nebude potvrzeno, co přesně znamená.

---

## 6. Test plán

Dle spec §7. Nové soubory: `useWorldChat.spec.ts`, `usePinnedChannels.spec.ts`,
`ChannelSidebar.spec.tsx`, `ChannelItem.spec.tsx` (vč. náhledu zprávy),
`CreateChannelDialog.spec.tsx`, `ChannelMemberPanel.spec.tsx` (grupování dle role),
`groupColor.spec.ts`. BE: `chat-presence.service.spec.ts` + doplnit `chat.service.spec.ts`
(access filtr, `imageUrl`, `lastMessagePreview`).

---

## 7. Odhad

FE ~22 souborů / ~1500 ř. · BE ~7 souborů / ~220 ř. Největší riziko = rozsah (vtažené
zakládání + presence) → dávky §0 jsou samostatně mergovatelné, lze zastavit po FE-e.
