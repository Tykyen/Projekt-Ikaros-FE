# Checkpoint — cache / 06-chat-posta-emoty

> RUN-2026-07-11-1213 · READ-ONLY · styl cache (registr `docs/cache-audit.md`, prefix C-)
> Re-audit oblasti proti HEAD. Baseline sweep = 2026-06-05 (C-05…C-08 + 4 🟡 + K-C5 ⚖️).
> Cíl: potvrdit, že opravy drží (ne 🔓), najít nové (🆕) v kódu přidaném po sweepu.

## Dosažená vs cílová L

- **Cílová:** L1–L3 (statika + key-match + spec).
- **Dosažená:** **L2** plošně (M1 čtení + M2 key-match ruční), **L3** u potvrzených oprav,
  kde existuje zelený spec (`useChannelMutations.spec`, `useMail.spec`, `useWorldChat.spec`,
  `usePinnedChannels.spec`). Runtime (L4) neproveden (read-only, server neběží).

## Potvrzené opravy z 06-05 — DRŽÍ (žádný 🔓 regres)

| Nález | Stav v HEAD | Kotva |
|---|---|---|
| C-05 global chat reconnect | ✅ `useSocketReconnect` → re-join + `invalidate(messages)` | `ChatRoom.tsx:283-300` |
| C-06 group/channel CRUD self-inval | ✅ 6× `onSuccess: invalidate(groups)` + reorder `onSettled` resync | `useChannelMutations.ts:29,51,62,85,107,118,161-166,204-208` |
| C-07 unread reconnect refetch | ✅ `useUnreadSync` → `useSocketReconnect` invalidate unread | `useWorldChat.ts:281-284` |
| C-08 mail infinite scroll reset | ✅ delete = surgical `removeFromPages` (setQueryData) | `useMail.ts:126-141` |
| C-58 pinned atom↔cache | ✅ `setQueryData(['users','me'])` vedle atomu | `usePinnedChannels.ts:45-47` |
| emote CRUD (7×) | ✅ onSuccess setQueryData + WS echo + reconnect (FIX-5) | `useCreateEmote/useUpdateEmote/useDeleteEmote/…`, `useWorldEmotes.ts:71-74`, `useGlobalEmotes.ts:60-62` |

Nový kód po sweepu prověřen a **čistý**: `useChannelCombat.ts` (16.1e — optimistic+rollback+
`onSuccess` invalidate + `useChannelCombatSync` WS+reconnect), `useChatPrefs.ts` (optimistic
`['worlds','my']` + snapshot rollback + unmount flush), `useChannelPresence.ts` (WS mutace cache).

## Nálezy

### 🆕 C-RUN-1 · `OPT`/`WS`/`LC` (P3) · flat messages cache se ořízne na posledních 50 při refetchi base query — zahodí odscrollovanou historii (nová `useLoadOlderMessages`) i failed-optimistic zprávy · 🟠
- **Kde:**
  - `useWorldChat.ts:94-127` `useLoadOlderMessages` — prepend starší dávky do **stejného** ploché-
    ho klíče `['world-chat',w,'messages',ch]` přes `setQueryData`.
  - `useWorldChat.ts:56-69` `useChannelMessages` — base query, **bez** `refetchOnWindowFocus:false`,
    staleTime dědí global 30 s; `queryFn` vrací jen `limit: HISTORY_LIMIT` (50).
  - `main.tsx:26-33` — global config `staleTime 30_000, retry 1`, **`refetchOnWindowFocus` neoverridnutý
    → default `true`** (TanStack v5). Žádný override v celém záběru (grep 0 zásahů).
  - `ChannelView.tsx:296-306` reconnect (W-7/FIX-4) i `ChatRoom.tsx:299` (C-05) volají
    `invalidate(messages)` → refetch base = **replace** celé ploché cache na 50.
  - `useOptimisticSend.ts:113-118` failed zprávy žijí v cache jako `id: local-<nonce>`, `_status:'failed'`.
- **Osy:** dva refetch vektory přepíšou akumulovanou/odscrollovanou cache posledními 50 z BE:
  (a) **C-05/C-07 reconnect invalidate** (vlastní oprava z 06-05 nová interakce s pozdějším load-older),
  (b) **default `refetchOnWindowFocus`** po 30 s staleTime (tab-out → tab-in).
- **Dopad / trigger / viditelnost:** hráč odscrolluje starší historii (nebo dlouhá session > 50 WS zpráv) →
  tab-switch po 30 s **nebo** WS reconnect → skok na posledních 50, scrollback zmizí (nutno znovu scrollovat).
  Zákeřnější: **failed-optimistic zpráva (retry pruh) se tiše ztratí** → uživatel může věřit, že se odeslala.
  Data na BE korektní; jde o read-side ztrátu view + falešný dojem odeslání. **Workaround:** znovu scroll.
- **Návrh:** `refetchOnWindowFocus:false` na `useChannelMessages`/`useChatHistory` (WS je zdroj pravdy)
  + reconnect **merge** (dotáhnout jen zprávy `after` posledního id) místo replace, nebo chránit `local-*`
  zprávy před přepisem. **L2.**

### ♻️ C-RUN-2 · `CR`/`P5` (třída C-08) · `useMessageDetail` invaliduje CELÝ inbox infinite query při každém otevření zprávy · 🟠
- **Kde:** `useMail.ts:71-81` — `queryFn` detailu po `GET /ikaros-messages/:id` (BE označí přečteno)
  volá `invalidate(mailKeys.unread)` **+ `invalidate(mailKeys.inbox)`** (ř.75-76). `inbox` = `useInfiniteQuery`.
- **Rozpor:** přesně symptom C-08 (refetch všech načtených stránek → scroll reset + N requestů), ale na
  **read-path** (otevření zprávy), který se opravou C-08 **neřešil** (fix se týkal jen delete = surgical
  removal). Účel invalidace = přebarvit „přečteno" tečku v seznamu — stačil by cílený `setQueryData`
  flip `isRead` na té jedné zprávě.
- **Trigger:** otevření kterékoli nepřečtené pošty při odscrollovaném inboxu. **Viditelnost:** flicker /
  scroll jump + latence. **Workaround:** není (opakuje se při každém otevření). **Návrh:** surgical
  `setQueryData` (flip `isRead` v `pages`) místo `invalidate(mailKeys.inbox)`; unread badge invalidovat dál.
  **L2.** (Pozn.: WS `ikaros:new-message` na ř.33-34 invaliduje inbox oprávněně — potřebuje novou položku.)

## Pokrytí

- **Pokryto (L2, čteno celé):** global chat (`useGlobalChat.ts`, `ChatRoom.tsx`), world chat
  (`useWorldChat.ts`, `useChannelMutations.ts`, `useOptimisticSend.ts`, `ChannelView.tsx`,
  `WorldChatRoom.tsx`, `useChatPrefs.ts`, `usePinnedChannels.ts`, `useMembershipAppearance.ts`,
  `useEditMessage.ts`, `useToggleReaction.ts`, `useChannelPresence.ts`, `useChannelCombat.ts`),
  emoty (8 hooků `emotes/api/*`), pošta (`useMail.ts`). `main.tsx` global config.
- **Nepokryto / mimo záběr 06 (coverage gap):** **admin chat platforma 20.5** (`src/features/admin/chat/*`
  — `useAdminChat.ts`, `useAdminChatLive.ts`, `useAdminDocuments.ts`, `useAdminTasks.ts`) = nová chat plocha
  přidaná po sweepu, **žádná cache-plan oblast ji nepokrývá** (patří spíš do oblasti 12 admin). Neprověřeno.

## PROOF-REQUESTy

- **PR-1 (C-RUN-1):** runtime M4 — otevřít world chat, odscrollovat starší historii, přepnout tab > 30 s,
  vrátit se → ověřit, zda scrollback zmizí (refetchOnWindowFocus). Totéž vyvolat WS reconnectem. Ověřit
  osud failed-optimistic zprávy po refetchi.
- **PR-2 (C-RUN-2):** runtime M4 / network panel — otevřít nepřečtenou zprávu s ≥ 2 načtenými inbox
  stránkami → počet refetch requestů na `/ikaros-messages/inbox` a scroll pozice.
- **PR-3 (coverage):** samostatný sweep admin chat 20.5 cache (`useAdminChatLive` optimistic/WS parita,
  `useAdminDocuments`/`useAdminTasks` invalidace) — zařadit do oblasti 12, ne 06.

## Shrnutí

2 nálezy: 🆕 C-RUN-1 (🟠 flat cache truncation — load-older scrollback + failed-optimistic mizí při
reconnect/focus refetch), ♻️ C-RUN-2 (🟠 C-08-třída na mail read-path). Žádný 🔓 (C-05…C-08 + C-58 drží).
Coverage gap: admin chat 20.5 nepokrytý. Dosažená L2 (L3 u oprav se specy).
