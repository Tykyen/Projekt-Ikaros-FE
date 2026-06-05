# 06 — Chat & pošta & emoty

> **Sweep 2026-06-05.** Cache-invalidation inventura (TanStack Query v5). Read-only.
> Osy: `OPT` `WS` `FO` `CR` `CB` · perspektivy P3 (optimistic round-trip) + P4 (WS↔REST parita).
> Nálezy → [`../cache-audit.md`](../cache-audit.md) (`C-05…C-08` + 🟡 latentní).
> **Stav: ✅ hotovo — 4 nálezy (C-05…C-08, vše 🟠) + 4 🟡 latentní; K-C5 přerámován.**

> ⚠️ **Architektura:** chat hooky jsou většinou **bezstavové wrappery** kolem `api.*` **bez cache
> efektu** — veškerá cache práce je delegovaná na **WS echo handlery v komponentách** (`ChatRoom.tsx`,
> `ChannelView.tsx`, `WorldChatRoom.tsx`). Census tedy NESMÍ číst jen `api/` hooky (vypadaly by jako
> „bez efektu") — inventura zahrnuje i komponenty. Důsledek: **většina obnovy chatu je WS-only, bez
> REST fallbacku** → fragilní při WS výpadku/reconnectu (téma celé oblasti).

## 1. Konzumentská inventura (P1)

**Globální chat:** `['global-chat', room, 'room-info'|'messages'|'environment']` + badge `['global-chat','room-presence-counts']` (factory `chatQueryKeys`, useGlobalChat.ts:21).
**Světový chat (factory `worldChatKeys`):** `['world-chat',w,'groups']` (seznam kanálů) · `['world-chat',w,'messages',ch]` (zprávy) · `['world-chat',w,'unread']` (**badge**) · `['world-chat',w,'search',…]` · `['world-chat',w,'appearance']` (60s, mimo factory) · `['world-chat',w,'presence',ch]` (PJ-only). `usePinnedChannels` = jotai atom (žádné RQ).
**Emoty (factory `emoteKeys`):** `['world-emotes',w]` (5 min) · `['global-emotes']` (5 min).
**Pošta (factory `mailKeys`):** `['mail','unread']` (**badge**, 60s + refetchInterval) · `['mail','inbox'|'sent']` (**infinite**, 30s) · `['mail','detail',id]` · `['mail','conversation',id]`.

## 2. Mutace × konzument (zhuštěně)

| Skupina | obnova přes | cache efekt | osa |
|---|---|---|---|
| Global send/delete/reaction | **WS echo set-only** (id-dedup) | žádný optimistic, žádná invalidate | C-05 |
| World send | `useOptimisticSend` (append→swap) | setQueryData + soft rollback, **bez resync inval.** | 🟡 |
| World edit/delete/reaction | WS echo | — | ✅ |
| World markRead | WS `chat:unread` + lokální set | — | C-07 |
| World group/channel CRUD (6×) | **WS echo only** | ❌ žádný onSuccess, dialogy neinvalidují | C-06 |
| World reorder groups/channels | optimistic + rollback | bez `onSettled` resync | 🟡 |
| Emoty CRUD (7×) | onSuccess setQueryData + WS echo | ✅ (dvojitý zápis, idempotentní) | ✅ |
| Mail send/delete | invalidate inbox+sent+unread(+conversation) | **infinite refetch-all** | C-08 |

## 3. Nálezy

### 🟠 C-05 · `WS`/`KM` · global chat (`ChatRoom`) bez reconnect re-join + history resync (K-C5 přerámován)
- **Místo:** [useGlobalChat.ts:88](../../src/features/chat/api/useGlobalChat.ts#L88) send + handlery `ChatRoom.tsx:124-211`.
- **K-C5 verdikt:** „set-only" je **bezpečné proti optimistické lži** — global chat **nemá optimistic** (render až přes WS echo, komentář ř.87; dedup dle `id`). Žádný `setQueryData` v `onMutate` = není co rollbacknout.
- **Skutečné riziko:** `ChatRoom` **nemá `useSocketReconnect`** (na rozdíl od world `ChannelView.tsx:217`). Po reconnectu se `['global-chat',room,'messages']` **neresyncuje** — set-only handlery jen čekají na nové eventy, history se nerefetchne. Cache uvázne s **dírou** ve zprávách z doby výpadku. Sekundárně: pokud POST projde a echo nikdy nedorazí (race/drop), odesílateli se zpráva nezobrazí (žádný local-echo).
- **Trigger:** WS reconnect / drop v global chatu. **Viditelnost:** tichá díra v historii. **Workaround:** F5. **Návrh:** přidat `useSocketReconnect` → re-join roomu + `invalidate(['global-chat',room,'messages'])`.

### 🟠 C-06 · `WS`/`CB` · group/channel CRUD bez self-invalidace — iniciátor bez WS oslepne
- **Místo:** [useChannelMutations.ts:23-101](../../src/features/world/chat/api/useChannelMutations.ts#L23) (6× create/update/delete group+channel, žádný `onSuccess`); dialogy `GroupDialog.tsx`/`ChannelDialog.tsx` po `mutateAsync` jen `toast`+`onClose`.
- **Rozpor:** obnova sidebaru (`['world-chat',w,'groups']`) závisí **výhradně** na WS echu (`chat:group/channel:*` → `invalidateGroups`, `WorldChatRoom.tsx:122`). Žádný self-fallback.
- **Trigger:** PJ založí/přejmenuje/smaže kanál při WS výpadku — **neuvidí vlastní změnu** (toast přesto „vytvořeno"). **Viditelnost:** kanál se neobjeví, žádná chyba. **Workaround:** F5.
- **VERIFY (eskalace 🔴):** dorazí BE `chat:group/channel:*` echo **i iniciátorovi**? Pokud BE broadcastuje „všem kromě sebe", iniciátor **nikdy** neobnoví bez F5 → 🔴. Cross-ref [`ws-audit.md`](../ws-audit.md).
- **Návrh:** přidat `onSuccess: invalidate(worldChatKeys.groups(w))` do 6 CRUD mutací (idempotentní s WS echem).

### 🟠 C-07 · `FO`/`WS` · world unread badge plně WS-závislý, bez reconnect refetch
- **Místo:** [useWorldChat.ts:203](../../src/features/world/chat/api/useWorldChat.ts#L203) `useUnreadSync` + lokální set v `ChannelView`/`WorldChatRoom`. Message send/delete/edit unread **neinvalidují**.
- **Rozpor:** `['world-chat',w,'unread']` se aktualizuje jen přes `chat:unread` WS event + optimistic lokální set; `useUnreadSync` **nemá reconnect refetch**. Po WS dropu badge drží staré číslo / nenaskočí.
- **Trigger:** příchozí zpráva do nesledované konverzace při WS dropu. **Viditelnost:** badge stale. **Workaround:** F5 (REST seed `useUnread`). **Návrh:** reconnect → `invalidate(worldChatKeys.unread(w))`.
- ✅ **Mail badge** (`['mail','unread']`) je naopak nejúplnější fan-out v oblasti — invaliduje send/delete/detail-read/WS new-message.

### 🟠 C-08 · `CR`/P5 · mail infinite query invaliduje všechny stránky (scroll reset)
- **Místo:** [useMail.ts:110-126](../../src/features/ikaros/api/useMail.ts#L110) send/delete → `invalidate(mailKeys.inbox/sent)`; totéž WS `ikaros:new-message` (ř.33).
- **Rozpor:** `inbox`/`sent` jsou `useInfiniteQuery` → `invalidateQueries` refetchne **všechny dosud načtené stránky** → při hluboko odscrollované schránce reset scroll pozice + náraz na síť (N requestů). Cílený `setQueryData` (removal/prepend jednoho prvku) by byl levnější.
- **Trigger:** smazání/odeslání po naloadování více stránek. **Viditelnost:** flicker / scroll jump / latence. **Závažnost:** 🟠 UX (data správná, jen degradace).

## 4. Latentní / VERIFY (neeskalováno na C-xx)

- **🟡 `OPT` · `useOptimisticSend`** ([:92](../../src/features/world/chat/api/useOptimisticSend.ts#L92)) — append optimistic + soft rollback (`_status:'failed'`, retry UX) OK, ale **bez resync invalidace** (jen swap server response do cache). BE truth se do cache dostane swapem, jen ne přes invalidate; drobný skok avataru/jména možný. ✅L1.
- **🟡 P3 · world dedup vyžaduje `clientNonce` v BE echu** ([ChannelView.tsx:244](../../src/features/world/chat/components/ChannelView.tsx#L244)) — dvoucestný dedup (id + clientNonce) robustní; ale pokud BE u whisper/NPC override `clientNonce` zahodí → dočasné zdvojení do F5. **VERIFY** BE echo kontrakt.
- **🟡 `OPT` · reorder groups/channels** ([useChannelMutations.ts:113](../../src/features/world/chat/api/useChannelMutations.ts#L113)) — klasický optimistic+rollback správně, jen **bez `onSettled` resync** (spoléhá WS `*:reordered`).
- **🟡 `WS` · `useCopyEmote`** ([:30](../../src/features/world/chat/emotes/api/useCopyEmote.ts#L30)) — onSuccess set na cíl jen pokud je v cache; jinak čeká na WS (by-design, ale cizí svět v jiném tabu bez WS → stale).

**Census (M-CEN):** mutace bez efektu (`useUploadAttachment`, `useScheduleMessage`, raw send/delete/reaction global) = **by-design** (upload vrací data pro send; render přes WS echo). ✅ ne nálezy.
