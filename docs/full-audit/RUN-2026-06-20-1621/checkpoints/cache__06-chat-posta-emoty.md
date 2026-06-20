# cache / 06-chat-posta-emoty — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem veškerý chat/pošta/emoty cache kód v HEAD (2026-06-20):

- `src/features/chat/api/useGlobalChat.ts` + `ChatRoom.tsx`
- `src/features/world/chat/api/useWorldChat.ts` + `useChannelMutations.ts`
- `src/features/world/chat/api/useOptimisticSend.ts` + `useMembershipAppearance.ts` + `useChatPrefs.ts`
- `src/features/world/chat/api/useEditMessage.ts` + `useToggleReaction.ts` + `useChannelPresence.ts`
- `src/features/world/chat/components/ChannelView.tsx` + `WorldChatRoom.tsx`
- `src/features/world/chat/emotes/api/` — všech 7 emote hooků (create/delete/update world+global + copy)
- `src/features/ikaros/api/useMail.ts`
- `src/features/chat/api/useSocket.ts` (useSocketReconnect implementace)
- `src/features/world/chat/dice/api/useDiceSkinMapping.ts`
- `src/features/world/pages/WorldEmotesAdminPage/WorldEmotesAdminPage.tsx`
- `src/features/ikaros/pages/IkarosEmotesAdminPage/IkarosEmotesAdminPage.tsx`
- `src/features/chat/pages/RozcestiPage.tsx`
- Specy: `useChannelMutations.spec.tsx`, `useWorldChat.spec.ts`, `useMail.spec.tsx`, `useGlobalChat.spec.tsx`
- Všechny git commity od 2026-06-05 (31 commitů, hlavně dice/kostky + 6.7+6.8 featury)

## Dosažená L vs cílová L

| Oblast | Cíl | Dosaženo | Poznámka |
|---|---|---|---|
| Global chat reconnect (C-05) | L3 | **L3** | test v useGlobalChat.spec.tsx; ChatRoom.tsx:262 useSocketReconnect ✅ |
| Group/channel CRUD (C-06) | L3 | **L3** | test C-06 v useChannelMutations.spec.tsx:181 ✅ |
| World unread reconnect (C-07) | L2 | **L2** | useWorldChat.ts:217-219 ✅ |
| Mail delete scroll (C-08) | L3 | **L3** | test v useMail.spec.tsx:97 ✅; delete surgical OK |
| Emote CRUD | L2 | **L2** | dvojitý zápis setQueryData + WS echo, factory klíče ✅ |
| ChannelView reconnect (🆕) | — | **L1** | re-join room bez history resync — nový nález |
| Mail detail queryFn side-effect (🆕) | — | **L1** | invalidate uvnitř queryFn — nový nález |
| Optimistic send round-trip | L2 | **L2** | swap logic + failed state; bez resync invalidace (by-design 🟡 z orig. sweep) |

Celková cílová L pro oblast: **L2+ (běžné mutace), L3 (destruktivní/optimistic)**.
Dosaženo: L2–L3 pro původní nálezy; 2 nové nálezy na L1.

## Nálezy

### C-RUN-01 — [WS] ChannelView.useSocketReconnect neresyncuje messages cache · 🟠 · 🆕

**Kde:** `src/features/world/chat/components/ChannelView.tsx:258-267`

**Dopad:** Po WS reconnectu `ChannelView` správně znovu joinuje `chat:{channelId}` room a presence, ale **NEinvaliduje** `worldChatKeys(worldId).messages(channelId)`. Zprávy přijaté během výpadku se nikdy nenačtou — uživatel vidí díru v historii bez vědomí. Při dalším F5 se obnoví.

**Kontrast:** `ChatRoom.tsx:278` (global chat, C-05) dělá `invalidate(keys.messages)` správně. World chat tuto fixaci nemá.

```ts
// ChannelView.tsx:258 — chybí invalidate messagesKey
useSocketReconnect(() => {
  const socket = getSocket();
  socket.emit('room:join', `chat:${channelId}`);
  socket.emit('chat:channel:join', { ... });
  // CHYBÍ: void qc.invalidateQueries({ queryKey: messagesKey });
});
```

**Trigger:** WS výpadek ≥1s v world chatu; přijdou zprávy od jiných hráčů.
**Viditelnost:** Tichá díra v historii — uživatel nevidí zprávy ze doby výpadku.
**Workaround:** F5.
**Návrh:** Přidat `void qc.invalidateQueries({ queryKey: messagesKey })` do reconnect callbacku v `ChannelView.tsx`.
**L1** (statické čtení, neověřeno runtime)

---

### C-RUN-02 — [LC] useMessageDetail: invalidate uvnitř queryFn → kaskádový refetch · 🟡 · 🆕

**Kde:** `src/features/ikaros/api/useMail.ts:73-77`

**Dopad:** `invalidateQueries` volaná **uvnitř queryFn** se spustí při každém fetchování detailu — nejen při prvním otevření, ale i při background refetch (default staleTime 30s), window focus refetch, atd. Každé takové spuštění způsobí re-fetch `mailKeys.inbox` (infinite query → N stránek). Pokud je detail view mounted déle, vzniká tichá síťová kaskáda: detail refetch → invalidate inbox → inbox refetch → (při background focus opět) detail refetch → …

```ts
// useMail.ts:73-77 — queryFn není čistá (side-effect)
queryFn: async () => {
  const msg = await api.get<IkarosMessage>(`/ikaros-messages/${id}`);
  void qc.invalidateQueries({ queryKey: mailKeys.unread });   // každý refetch!
  void qc.invalidateQueries({ queryKey: mailKeys.inbox });    // každý refetch!
  return msg;
},
```

**Trigger:** Uživatel nechá otevřenou detail zprávu >30s (nebo tab fokus po dobu čtení).
**Viditelnost:** Zbytečné síťové požadavky; výkonnostní degradace při hlubší schránce. Data správná.
**Workaround:** žádný (automatický).
**Návrh:** Přesunout invalidaci do `onSuccess` callback query (nebo použít `useEffect` s ref na first-run flag). `onSuccess` v `useQuery` není v TanStack v5 doporučeno — správný vzor je spustit invalidaci mimo queryFn (např. při mountu přes `useEffect` + guard `hasBeenRead`). Alternativně: přidat `staleTime: Infinity` na detail + `gcTime` nastavit rozumně, a přesunout read-tracking na markRead mutaci.
**L1** (statické čtení)

---

## Verifikace původních nálezů (C-05..C-08)

| ID | Status v HEAD | Ověření |
|---|---|---|
| C-05 global chat reconnect | ✅ OPRAVENO | ChatRoom.tsx:260-279 má useSocketReconnect + invalidate messages |
| C-06 group/channel CRUD self-invalidate | ✅ OPRAVENO | useChannelMutations.ts: 6× onSuccess + reorder onSettled; spec test L3 |
| C-07 unread badge reconnect | ✅ OPRAVENO | useWorldChat.ts:217-219 useSocketReconnect → invalidate unread |
| C-08 mail infinite scroll reset | ✅ ČÁSTEČNĚ | delete: surgical setQueryData ✅; send: stále invalidate inbox+sent (scroll reset při odeslání — by-design nebo přijatelné 🟡) |

## Latentní z orig. sweep — stav

- 🟡 `useOptimisticSend` bez resync invalidace — stav beze změny, bez tvar-skoku (by-design)
- 🟡 `useCopyEmote` cílový svět bez cache v tabu — beze změny (by-design)
- 🟡 reorder `onSettled` resync — OPRAVENO (useReorderGroups/useReorderChannels.onSettled invalidates)
- 🟡 dedup `clientNonce` VERIFY — ChannelView.tsx:284-291 má dedup správně

## PROOF-REQUEST

- **PR-1** `C-RUN-01` (🟠): Runtime ověření (M4) — `ChannelView` po WS dropu + reconnect: zaznamej zprávu od jiného hráče v době výpadku, ověř zda se zobrazí bez F5. Živá infrastruktura nutná.
- **PR-2** `C-RUN-02` (🟡): Síťový monitoring (M4) — otevřít detail zprávy a sledovat network tab 60s — počet GET `/ikaros-messages/{id}` + GET `/ikaros-messages/inbox`. Živá infrastruktura nutná.
