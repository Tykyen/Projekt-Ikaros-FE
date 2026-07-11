# Checkpoint — cache / 11 Notifikace & dashboardy & sidebary

- **Styl:** cache-invalidation (TanStack Query v5), registr `docs/cache-audit.md`, prefix `C-`.
- **Oblast:** `docs/cache-plan/11-notifikace-dashboardy-sidebary.md` (osy `FO` `LC` `KM` `WS`; perspektivy P1/P6/P7).
- **Repo:** FE `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE`. READ-ONLY.
- **Dosažená L:** **L2** (statika M1 + key-match/mount M2 přes grep). Cíl L2+ splněn; runtime (M4→L4) čeká na PROOF.
- **Datum:** 2026-07-11.

## Známé nálezy — re-verifikace (NEhlásit jako nové)

| ID | Stav fixu v kódu | Důkaz |
|---|---|---|
| **C-45** (username req → pending-actions badge) | ✅ opraveno, drží | `useAdminUsers.ts:342` (approve) + `:467` (reject) invalidují `['pending-actions']` |
| **C-46** (bell feed + infinite reconnect) | ⚠️ **částečně** — feed OK, badge-recompute NE (viz C-RUN-2) | `useChatFeed.ts:52-54` + `useEvents.ts:32-34` `useSocketReconnect` → invalidate feed |
| **C-47** (ikaros dashboard Akce/Novinky WS) | ⚠️ **novinky OK, akce NE na dashboardu** (viz C-RUN-1) | `useIkarosNews.ts:24-31` listener+reconnect; `useIkarosEvents.ts:14-20` tamtéž |
| C-04 (world news WS) / C-07 (world unread reconnect) / C-09 (RSVP kalendář) | cross-oblast (03/06/09), konzument reaguje správně | `NewsColumn`→`useWorldNews`, `WorldDashboard:23`→`useWorldChatUnread`(WS sync), `EventsColumn`→`useWorldGameEvents` |

## Nové / re-opened nálezy

### 🔓 C-RUN-1 · `WS`/`FO` 🟡 — C-47 (akce) reálně NEpokrývá dashboardový widget: listener na jiném hooku, než dashboard mountuje
- **Kde:** `src/features/ikaros/pages/DashboardPage/sections/IkarosEventsSection.tsx:16`
  ```ts
  const { data, isError, refetch } = useUpcomingIkarosEvents(3);
  ```
  `useUpcomingIkarosEvents` (`useIkarosEvents.ts:30-40`) je **holý `useQuery`** bez `useSocketEvent`/`useSocketReconnect`. WS listener `ikaros:events:changed` + reconnect (C-47 fix) žije v **`useIkarosEvents()`** (`useIkarosEvents.ts:13-20`), který je mountnutý **jen na `/ikaros/akce`** (`AkcePage.tsx:35`) — grep potvrzuje, že jinde se `useIkarosEvents` nevolá.
- **Důsledek:** na Ikaros úvodníku (`/`) běží u widgetu „Akce" jen `['ikaros-events','upcoming',3]` bez posluchače → broad `invalidateQueries(['ikaros-events'])` z WS eventu se **nikdy nezavolá** (posluchač není zaregistrován). Broadcast `ikaros:events:changed` dopadne do prázdna.
- **Dopad:** cizí admin/Superadmin vytvoří/upraví/smaže akci (nebo RSVP) → dashboardový widget „Akce" drží starý stav do **60s staleTime** / window refocus / F5. Přesně gap, který C-47 měl u akcí zavřít — u novinek zavřený je (`PlatformNewsSection.tsx:15` používá `useIkarosNews()`, který posluchač hostuje), u akcí ne. Tiché, ne destruktivní.
- **Návrh:** buď v `IkarosEventsSection` přidat vlastní `useSocketEvent('ikaros:events:changed', …)` + `useSocketReconnect` (invalidate `['ikaros-events']`), nebo přesunout listener z `useIkarosEvents` do sdíleného root-level hooku (vzor `useChatFeedLive`/`useAdminChatLive` v `IkarosLayout`), aby platil bez ohledu na to, který ikaros-events dotaz je namountovaný. Parita s novinkami.
- **L:** L2 (grep mount-inventura). PROOF-REQUEST M4 níže.

### ♻️ C-RUN-2 · `WS`/`LC` 🟡 — C-46 rezidua: reconnect obnoví feed, ale NEpřepočítá bell badge (`chatFeedUnseenAtom`)
- **Kde:** `useChatFeed.ts:52-54` reconnect invaliduje jen `chatFeedKeys.all` (feed). Bell badge `chatUnseen` čte `chatFeedUnseenAtom` (`centerStore.ts:16`) — ryze klientský čítač, tiká jen na `chat:feed:bump` při zavřeném draweru (`useChatFeed.ts:49`), nuluje se při otevření (`NotificationCenter.tsx:40-42`). Reconnect handler ho **netiká ani nepřepočítá**.
- **Dopad:** po socket dropu (deploy/BE restart/přepnutí sítě bez ztráty IP) jsou zmeškané `chat:feed:bump` navždy pryč z čítače → bell badge **podhodnocený** o zprávy přijaté během výpadku (feed v draweru je ale po reconnectu správný — díra zavřená). systemUnread půlka badge se sama zhojí přes `useUnreadCount` `refetchInterval:60_000` (`useMail.ts:43`), chatUnseen jotai půlka ne.
- **Vztah:** je to nedokončená část **návrhu C-46** („bell jotai badge resetovat/přepočítat z čerstvého feedu"). Klasifikováno ♻️ (známý C-46 částečně otevřený), **ne nový C-xx**. Přepočet je navíc netriviální (žádná serverová pravda „unseen od posledního otevření"), takže hraničí s by-design limitem ephemeral čítače.
- **Návrh (pokud eskalace):** buď BE-backed „unseen chat feed" count (jako admin-chat unread), nebo po reconnectu čítač resetovat na 0 (konzervativní — spíš podhodnotit než zmást). Jinak ponechat vědomě jako limit designu.
- **L:** L2.

## Latentní / VERIFY (neeskalováno)

- **D-11-3 `WS`/`FO` 🟡** — pending-actions badge (`usePendingActions.ts:13`, `['pending-actions','count']`, staleTime 30s) nemá WS ani reconnect. Vlastní akce ho invalidují (✅, vč. C-45). Ale **cizí moderátor** vyřídí frontu → můj badge/`PendingTab` drží starý (přepočítaný) count do 30s + refocus (multi-aktér moderace). Původní oblast 11 to nevlajkovala (own-action coverage ✅); self-heal přes `refetchOnWindowFocus`. Ponecháno jako latent, konzistentní s plánem.
- **D-11-2 `SC` 🟡 (z plánu)** — `useFavoritePage` hardcoduje `['worlds','slug',worldSlug]`; latentní drift, dnes jen slug routy. Nezměněno.
- **Admin chat badge „Chat správy"** (`useAdminChatLive.ts:35-36`) — WS `platform-chat:activity` + `useSocketReconnect` ✅ plně kryté (kontrast s C-RUN-1). Bez nálezu.

## Pokrytí

- **Přečteno do L2:** `notifications/api/{useChatFeed,useEvents}.ts`, `notifications/components/{PendingTab,NotificationCenter}.tsx`, `notifications/model/centerStore.ts`; `app/layout/IkarosLayout/IkarosLayout.tsx` (všichni badge konzumenti: bell, pošta, nav pending, right-panel pending, chat presence, admin-chat); `WorldDashboard.tsx` + `columns/{EventsColumn,NewsColumn}.tsx`; `ikaros/pages/DashboardPage/sections/{IkarosEventsSection,PlatformNewsSection}.tsx`; feedery `usePendingActions.ts`, `useMail.ts`, `useIkarosNews.ts`, `useIkarosEvents.ts`, `useAdminChat.ts`, `useAdminChatLive.ts`, `useWorldChat`(useWorldChatUnread).
- **Grep mount-inventura:** `useIkarosEvents`/`useUpcomingIkarosEvents`, `useIkarosNews` — potvrzena separace listeneru od dashboard konzumenta (kořen C-RUN-1).
- **Nezaostřeno (nízké riziko, konzumují už prověřené hooky):** `ChatFeedTab`, `EventsTab`, `FavoritePagesColumn` (plán ✅ bridge), `usePush`.

## PROOF-REQUESTy

- **PROOF M4 (C-RUN-1) → L4:** dvě session, session A na Ikaros úvodníku (`/`), session B (admin) vytvoří platformovou akci. Ověřit, že widget „Akce" v A se **neobnoví bez F5** (potvrzení gapu). Pak stejný test pro „Novinky" — musí se obnovit (C-47 novinky). Metodika = C-04/C-47.
- **PROOF M4 (C-RUN-2) → L4:** shodit BE socket, z druhé session poslat chat zprávu (do světa, kde je A členem), reconnect klienta A se zavřeným centrem; ověřit, zda bell badge naskočí o zmeškanou zprávu (očekávání: NEnaskočí; feed v draweru po otevření ano). Metodika = C-46 VERIFY (M4).

## Census (M-CEN)

Čistý pro mutace uvnitř oblasti. Gapy jsou WS-parita / mount-placement (C-RUN-1) a ephemeral-badge reconnect (C-RUN-2), ne mutace bez cache efektu.
