# Implementační plán 3.5 — Soukromá pošta (`/ikaros/posta`)

**Spec:** [spec-3.5.md](spec-3.5.md)
**Strategie:** commity přímo do `main` v obou repech (konvence 3.x). Každá sub-fáze = zelený commit (testy + build projdou).
**Repa:** `[BE]` = `Projekt-ikaros/backend` · `[FE]` = `Projekt-ikaros-FE`

---

## Ověření před prací (hotovo)

- `world.join.requested` **nemá emittera** (grep) — `handleJoinRequest` v ikaros-messages je mrtvý kód. Moderní world-join: `WorldAccessRequest` + `WorldAccessRequestProvider` (Zpracovat). → Dluh B je bezpečný.
- **Bug navíc:** `getUnreadCount` BE vrací `{ messages, pendingRequests }`, FE typ čeká `{ unreadCount, pendingRequestCount }` → header badge **vždy 0**. Dluh B to opraví sjednocením na `{ unreadCount }`.

---

## Pořadí (11 sub-fází)

### 3.5-a `[BE]` — threading

- `ikaros-message.schema.ts`: `+ conversationId: string`, `+ replyToId?: string`; index `{ conversationId: 1, sentAtUtc: 1 }`.
- `ikaros-message.interface.ts`: + obě pole.
- `create-ikaros-message.dto.ts`: `+ replyToId?: string` (`@IsOptional @IsMongoId`).
- `repository`: `toEntity` čte nová pole; `save` po vložení kořene (`!replyToId`) doplní `conversationId = _id` (`findByIdAndUpdate`); `+ findConversation(conversationId, userId)`.
- `service.create`: bez `replyToId` → kořen; s `replyToId` → načti rodiče, validuj účastníka, převezmi `conversationId`; `+ getConversation(conversationId, userId)` (403 pro cizí).
- `controller`: `+ GET conversation/:conversationId`.
- Spec testy: create kořen / reply / cizí účastník / getConversation řazení + 403.

### 3.5-b `[BE]` — migrace `conversationId`

- `backend/scripts/migrate-message-threads/` — idempotentní, dry-run; všem dokumentům bez `conversationId` nastav `conversationId = _id`.

### 3.5-c `[BE]` — dluh B: úklid legacy world_join

- Odstranit ze schématu: `actionType`, `actionWorldId`, `actionUserId`, `actionResolved` + `actionType` z compound indexu.
- `interface`: pryč `actionType`/`IkarosMessageActionType`/action pole.
- Smazat `resolve-ikaros-message.dto.ts`.
- `service`: smazat `resolve`, `handleJoinRequest`, `JoinRequestedPayload`; `create` neukládá action pole; `getUnreadCount` → `{ unreadCount }`.
- `repository`: smazat `countPendingRequests`, `resolveIfPending`; `countUnreadMessages` bez `actionType` filtru.
- `controller`: smazat `POST :id/resolve`.
- `repo interface` + module — odebrat reference; `WorldMembership`/`membershipRepo` import zůstává jen pokud ho něco používá (po cleanu už ne → odstranit i z modulu/konstruktoru).
- Spec testy aktualizovat (smazat resolve/joinRequest testy).

### 3.5-d `[BE]` — D-057 friend-only privacy

- `user` schema/interface: `+ profileVisibility: 'public' | 'friends'` (default `'public'`).
- `users.service`: profil getter — když cíl `'friends'` a requester ≠ friend, ≠ self, ≠ Admin/Superadmin → 403 `PROFILE_FRIENDS_ONLY`. Friend-check přes `FriendshipsService`.
- profil update DTO přijme `profileVisibility`.
- `ikaros-messages`: import `FriendshipsModule`; `create` — když příjemce `'friends'` a sender ≠ friend, ≠ Admin/Superadmin, a není to reply (`replyToId`) → 403 `RECIPIENT_FRIENDS_ONLY`.
- Spec testy: profil 403/průchod, mail 403/reply výjimka.

### 3.5-e `[BE]` — testy

`cd backend && npm test`. Zelená.

### 3.5-f `[FE]` — dluh A + types

- `src/features/ikaros/api/useMail.ts` — přesun `useUnreadCount` z `chat/api/useMessages.ts`; smazat starý soubor (pokud prázdný).
- `IkarosLayout.tsx` import → `ikaros/api`; `UnreadCountResponse` → `{ unreadCount }`; `totalUnread = unread?.unreadCount ?? 0`.
- `shared/types`: `IkarosMessage`, `MailFolder`, `IkarosConversation`; `UnreadCountResponse` zúžit.

### 3.5-g `[FE]` — useMail hooky

`useInbox`, `useSentMail`, `useMessageDetail`, `useConversation`, `useSendMessage`, `useDeleteMessage` — react-query, invalidace inbox + unread, socket `ikaros:new-message`.

### 3.5-h `[FE]` — MailPage master-detail

`pages/MailPage/` — `MailPage.tsx` (grid split / drill-down, `?slozka=`), `MailList.tsx`, `MailListItem.tsx`, `MailDetail.tsx` (vlákno bublin), `MailPage.module.css`. Smazat starý stub `pages/MailPage.tsx`, upravit `router.tsx` import.

### 3.5-i `[FE]` — RecipientPicker + ComposeModal

`components/RecipientPicker.tsx` (autocomplete `GET /users?q=`, debounce 300 ms), `pages/MailPage/ComposeModal.tsx` (nová zpráva / reply, RHF+Zod). 403 `RECIPIENT_FRIENDS_ONLY` hláška.

### 3.5-j `[FE]` — D-057 profil toggle

Přepínač soukromí v profilu (sekce Bezpečnost / Soukromí). 403 `PROFILE_FRIENDS_ONLY` handling na veřejném profilu.

### 3.5-k — testy + skills + docs

- FE `lint`, `lint:colors`, `test:run`, `build`, `tsc`.
- skill `mobil-desktop` (po UI), skill `napoveda` (HelpPage tab Stránky/FAQ — pošta ✅).
- `roadmap-fe.md` 3.5 odškrtnout; `dluhy.md` uzavřít dluh A, B, D-057.
- `spec-3.5.md` status → hotovo + dílčí `purpose.md`/`decisions.md`/`ai-notes.md` volitelně.

---

## Rizika

- Migrace na ostrých datech — dry-run první; service má fallback (`conversationId ?? _id`) při čtení i bez migrace.
- Dluh B odstraní pole, která mohou mít staré dokumenty — orphan pole jsou neškodná (Mongo schema-less).
- D-057 friend-check přidává DB dotaz na každý profil/send — akceptovatelné, friendships má indexy.
