# Spec 20.5b — Persistentní unread badge admin chatu

**Stav:** ✅ implementováno (2026-07-05) — ⚠️ **čeká BE restart** + vizuální ověření
**Trigger:** nav položka „Chat správy" má dnes jen efemérní badge (WS-only, reset po reloadu). Chceme badge, který **přežije reload i offline zprávy** — jako per-konverzace unread ve světě.

---

## 1. Problém

Dnešní badge (`adminChatUnseenAtom`, `useAdminChatLive`) je čistě klientský: tiká na WS `platform-chat:activity`, nuluje se při vstupu na /admin/chat, **po reloadu = 0**. Zprávy doručené, když admin appku nemá otevřenou, badge nikdy neukáže. Žádný BE read-state.

## 2. Řešení — reuse world-chat vzoru (BE-backed)

Admin chat už reusuje modul `chat` (zprávy = `ChatMessage`/`chatmessages` s Mongo ObjectId, kanály = `ChatChannel` s markerem `groupId==='__platform_staff__'`). V `chat` modulu existuje **hotová** read-state infra — jen ji zapojíme:

- Kolekce `channelreadstatus` (`{userId, channelId, lastReadMessageId, lastReadAt}`, unique `{userId,channelId}`).
- `IChannelReadStatusRepository` — `upsert(userId, channelId, lastReadMessageId)`, `findByUserAndChannels`.
- `IChatMessageRepository.countAfter(channelId, lastReadId)` = počet zpráv s `_id > ObjectId(lastReadId)` (už injektované v `PlatformChatService`).

## 3. BE změny (`Projekt-ikaros/backend`)

1. **`chat.module.ts`** — přidat `'IChannelReadStatusRepository'` do `exports` (dnes ho ChatModule nevystavuje).
2. **`platform-chat.service.ts`**:
   - Injektovat `@Inject('IChannelReadStatusRepository') readRepo`.
   - `getUnreadCounts(user)` → pro každý přístupný admin kanál `{ channelId, count }` přes `countAfter(channelId, lastReadId)` (lastReadId z `findByUserAndChannels`; bez read statusu → 0, aby staré zprávy nezaplavily nováčka „vše nepřečteno").
   - `markChannelRead(channelId, user)` → `assertAccess` + poslední zpráva kanálu → `readRepo.upsert(user.id, channelId, lastMessage.id)`.
   - V `sendMessage` po vytvoření zprávy: `readRepo.upsert(senderId, channelId, message.id)` — odesílatel nevidí vlastní zprávu jako nepřečtenou.
3. **`platform-chat.controller.ts`** (base `admin-chat`, guard Sa+Admin):
   - `GET admin-chat/unread` → `getUnreadCounts(user)`.
   - `POST admin-chat/channels/:channelId/read` → `markChannelRead(channelId, user)`.

**Bez nové kolekce, bez migrace.** Read-state pro admin kanály koexistuje se světovým v téže kolekci (klíč `channelId` je globálně unikátní).

> ⚠️ **Vyžaduje BE restart** — nový endpoint + injektovaný repo; bez restartu běží starý bundle.

## 4. FE změny (`Projekt-ikaros-FE`)

1. **`api/useAdminChat.ts`**:
   - `useAdminChatUnread()` → `GET /admin-chat/unread`, klíč `adminChatKeys.unread`. Vrací `{channelId, count}[]`.
   - `useMarkAdminChatRead()` → `POST /admin-chat/channels/:id/read`; onSuccess invaliduje `unread`.
2. **Agregátor** `useAdminChatUnreadTotal()` = součet `count` (badge číslo). Seed + WS.
3. **`useAdminChatLive.ts`** (globální, root layout) — přepsat: badge zdroj = `unread` query cache; WS `platform-chat:activity` → `invalidateQueries(unread)` (refetch; admin chat má nízkou frekvenci → reducer netřeba). Odstranit efemérní `adminChatUnseenAtom` z cesty badge.
4. **`AdminChatPage.tsx`** — `useEffect` na aktivní konverzaci → `markRead.mutate(activeConvId)` (vzor `WorldChatRoom`), a při příchozí cizí zprávě do právě sledované konverzace znovu mark-read.
5. **`IkarosLayout.tsx`** — badge „Chat správy" číst z `useAdminChatUnreadTotal()` místo atomu.

## 5. Chování (výsledek)

- Nové admin zprávy → badge naroste, **přežije reload** (BE seed).
- Otevřu konverzaci → ta se označí přečtená (per-kanál, jako svět); ostatní zůstanou.
- Vlastní odeslaná zpráva nezvedne můj vlastní badge.
- Offline zprávy uvidím po dalším loadu (seed z BE).

## 6. Co NEřešíme

- Per-konverzace unread tečky uvnitř AdminChatPage seznamu kanálů (možné rozšíření — BE už vrací per-kanál data, takže levné dodělat později).
- Mention count (world chat má `countMentionsAfter`; admin chat zatím ne).
