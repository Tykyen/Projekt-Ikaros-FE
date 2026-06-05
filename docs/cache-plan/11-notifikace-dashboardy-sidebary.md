# 11 — Notifikace & dashboardy & sidebary

> **Sweep 2026-06-05.** Cache-invalidation inventura (TanStack Query v5). Read-only.
> Osy: `FO` `LC` `KM` `WS` · perspektivy P1 (konzumentská inventura) + P6 (rekonciliace) + P7 (RQ↔jotai).
> **Consumer-side cross-feature sweep** — soustředí se na dashboard/sidebar/badge konzumenty a jestli je
> krmí mutace z JINÝCH oblastí. Soubory: `features/notifications/`, `IkarosLayout`, `WorldDashboard/`,
> Ikaros `DashboardPage/`. Nálezy → [`../cache-audit.md`](../cache-audit.md) (`C-45…C-47`).
> **Stav: ✅ hotovo — 3 nové nálezy (C-45 🟠, C-46 🟠, C-47 🟡), zbytek odkazuje na C-04/C-07/C-09/K-C6.**

---

## 0. Scope korekce (zadání vs. realita)

- **`RozcestiPage.tsx` NENÍ cross-world dashboard** — je to atmosférická roleplay chat místnost
  (`ChatRoom` + `RoomEnvironment` přes `setQueryData`, optimistic WS echo). Žádné dashboard widgety ani
  badge countery → mimo tuto oblast (env cache = oblast 06). **Skutečný cross-world souhrn = `ChatFeedTab`**
  (`chat-feed` infinite). Bod níže.
- **Presence panel „Přítomní"** = `ChannelMemberPanel` / `useChannelPresence` ve **world chatu**
  ([`features/world/chat/`](../../src/features/world/chat/components/ChannelMemberPanel.tsx)) → spadá do
  oblasti 06 (chat presence, WS-driven). Není dashboard/sidebar konzument této oblasti. Mimo scope.

---

## 1. Konzumentská inventura (P1) — VŠECHNY dashboard/sidebar widgety + badge countery

### A. Header badge countery (globální, mounted vždy v `IkarosLayout`)

| Konzument | `queryKey` / zdroj | staleTime / enabled | soubor:řádek | Kdo má krmit |
|---|---|---|---|---|
| **Bell badge** = `chatUnseen + systemUnread` | `chatFeedUnseenAtom` (jotai, WS) + `['mail','unread'].systemUnread` | 60s + `refetchInterval:60s`; `!!token` | [IkarosLayout.tsx:617-620](../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L617) | WS `chat:feed:bump` (jotai) · WS `ikaros:new-message` + pošta mutace (unread) |
| **Pošta badge** = `unread.unreadCount` | `['mail','unread']` | 60s + 60s interval; `!!token` | [IkarosLayout.tsx:615](../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L615) | send/delete/read mail (oblast 06) ✅ + WS `ikaros:new-message` ✅ |
| **Nav badge** (Diskuze/Články/Galerie) | `['pending-actions','count'].byType[type]` | 30s; `isAuthenticated` | [IkarosLayout.tsx:197,138](../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L197) | každá schvalovací mutace dané oblasti |
| **Pravý panel badge** (Uživatelé/Přátelé) = `pendingCount.total` | `['pending-actions','count']` | 30s; `!!currentUser` | [IkarosLayout.tsx:396,399](../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L396) | tytéž pending-actions mutace |
| **Chat (N)** = součet room presence | `useRoomPresenceCounts` (REST seed + WS) | — | [IkarosLayout.tsx:189-194](../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L189) | WS presence (oblast 06) |

### B. Notifikační centrum (drawer, mount jen když `open`)

| Konzument | `queryKey` | typ | soubor:řádek | Kdo má krmit |
|---|---|---|---|---|
| ChatFeedTab (souhrn chatů) | `['chat-feed']` (infinite, PAGE_SIZE 50) | infinite | [useChatFeed.ts:11,21](../../src/features/notifications/api/useChatFeed.ts#L11) | **jen** WS `chat:feed:bump` (invalidate all) |
| EventsTab (systémová oznámení) | `['notification-events']` (infinite, PAGE_SIZE 30) | infinite | [useEvents.ts:11,31](../../src/features/notifications/api/useEvents.ts#L11) | **jen** WS `ikaros:new-message` (`p.system`) → invalidate all |
| PendingTab (schvalovací fronty) | `['pending-actions','count']` | query | [PendingTab.tsx:26](../../src/features/notifications/components/PendingTab.tsx#L26) | každá pending-actions mutace |

> ⚠️ Centrum se mountuje **jen při `open`** (NotificationCenter `if (!open) return null`). Infinite
> dotazy `chat-feed`/`notification-events` tedy běží jen v otevřeném draweru → **LC**: WS invalidace
> je marná, dokud drawer není otevřený; badge u zvonku ale drží jotai atom (přežívá) → badge ano, feed
> až po otevření (refetchOnMount). By-design (drawer-lazy), bez nálezu.

### C. World dashboard (`/svet/:slug`, member view)

| Widget | `queryKey` | soubor:řádek | Kdo má krmit |
|---|---|---|---|
| Dlaždice **Hráči** (count) | `['worlds',worldId,'members']` | [WorldDashboard.tsx:21](../../src/features/world/pages/WorldDashboardPage/WorldDashboard/WorldDashboard.tsx#L21) | member mutace (oblast 03) |
| Dlaždice **Chat** (unread badge) | `useWorldChatUnread` → world-chat unread (WS) | [WorldDashboard.tsx:22](../../src/features/world/pages/WorldDashboardPage/WorldDashboard/WorldDashboard.tsx#L22) | WS `chat:unread` (oblast 06 = **C-07**) |
| **EventsColumn** (Akce, max 3) | `['game-events','world',worldId,3]` | [EventsColumn.tsx:27](../../src/features/world/pages/WorldDashboardPage/WorldDashboard/columns/EventsColumn.tsx#L27) | game-event create/update/delete/RSVP (oblast 09 = **C-09/C-10**) |
| **NewsColumn** (Novinky, max 3) | `['world-news',worldId]` | [NewsColumn.tsx:27](../../src/features/world/pages/WorldDashboardPage/WorldDashboard/columns/NewsColumn.tsx#L27) | world-news mutace ✅ (oblast 03 = **C-04** WS gap) |
| **FavoritePagesColumn** (max 10) | `world.favoritePageSlugs` (z `['worlds','slug',slug]` detail) + `usePagesDirectory(worldId)` (názvy) | [FavoritePagesColumn.tsx:19-22](../../src/features/world/pages/WorldDashboardPage/WorldDashboard/columns/FavoritePagesColumn.tsx#L19) | `useFavoritePage` optimistic set `['worlds','slug',slug]` ✅ |

### D. Ikaros platform dashboard (`/` úvodník)

| Widget | `queryKey` | staleTime | soubor:řádek | Kdo má krmit |
|---|---|---|---|---|
| **IkarosEventsSection** (Akce, max 3) | `['ikaros-events','upcoming',3]` | 60s; `!!token` | [IkarosEventsSection.tsx:16](../../src/features/ikaros/pages/DashboardPage/sections/IkarosEventsSection.tsx#L16) | ikaros-event mutace ✅ (broad `KEY`) — **bez WS** |
| **PlatformNewsSection** (Novinky, max 3) | `['ikaros-news']` | 5 min | [PlatformNewsSection.tsx:15](../../src/features/ikaros/pages/DashboardPage/sections/PlatformNewsSection.tsx#L15) | ikaros-news mutace ✅ (broad `NEWS_KEY`) — **bez WS** |

### E. Right-panel sidebar (Oblíbené diskuze/články/obrázky + Moje světy)

| Widget | zdroj | soubor:řádek | Kdo má krmit |
|---|---|---|---|
| Oblíbené diskuze/články/obrázky | `useMyFavorite*` query `[...KEY,'favorites']` **+** `currentUser.pinned*Ids`/`favorite*Ids` (jotai) | [IkarosLayout.tsx:402-426](../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L402) | toggle-favorite/pin → invalidate `[...KEY,'favorites']` + `['users','me']` ✅ (RQ→atom bridge) |
| Moje světy | `['worlds','my']` | [IkarosLayout.tsx:384](../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L384) | world mutace (oblast 03) |
| Vesmíry (public, levý panel) | `['worlds','public']` | [IkarosLayout.tsx:179](../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L179) | world create/update (oblast 03) |

---

## 2. Klíčový mechanismus — RQ↔jotai bridge (P7) pro sidebar Oblíbené

Sidebar `FavoriteSection` čte pořadí z **`currentUserAtom`** (`pinnedArticleIds`/`favoriteArticleIds`…),
ne z query. Toggle-favorite/pin ([useArticles.ts:200-221](../../src/features/ikaros/api/useArticles.ts#L200))
invaliduje `['users','me']`. Most: [`useCurrentUserHydration`](../../src/features/auth/api/useAuth.ts#L139)
mountuje `['users','me']` query v `AuthBootstrap` a `useEffect(data → setUser(atom))`. Invalidace `users/me`
→ refetch → atom update → sidebar refresh. **Řetěz drží ✅** (L2). Pokrytí RQ↔jotai obecně = **K-C6**
(oblast 01) — zde jen potvrzeno, že favorites variantu most pokrývá.

---

## 3. Cross-feature matice — krmí dashboard/badge mutace z JINÉ oblasti?

| Konzument (oblast 11) | Krmící mutace (zdroj) | Krmí? | Verdikt |
|---|---|---|---|
| EventsColumn (world dash) | game-event RSVP/update/delete (09) | ⚠️ částečně | **C-09** (RSVP `world`≠`world-all`/dash má vlastní `world` klíč — viz pozn.) + **C-10** (detail) |
| NewsColumn (world dash) | world-news create cizím PJ (03) | ⚠️ jen 60s | **C-04** (bez WS) |
| Dlaždice Chat (world dash) | world-chat zpráva (06) | ⚠️ WS-only | **C-07** (badge bez reconnect refetch) |
| Bell badge — systemUnread | admin **username-request** approve/reject (12) | **❌** | **C-45** ↓ |
| Bell badge — chatUnseen / feed | WS reconnect (socket drop) | **❌** | **C-46** ↓ |
| Ikaros dashboard Akce/Novinky | cizí admin create ikaros-news/event (10) | **❌** | **C-47** ↓ (bez WS) |
| Pending badge (bell/nav/panel) | article/gallery/discussion/friend/world-access (02/03/10) | ✅ | broad `['pending-actions']` ✅ |
| FavoritePagesColumn | `useFavoritePage` toggle | ✅ | optimistic set `['worlds','slug',slug]` ✅ |
| Sidebar Oblíbené | toggle-favorite/pin (10) | ✅ | `users/me` + bridge ✅ |

> **Pozn. EventsColumn vs C-09:** dashboard widget běží pod `['game-events','world',worldId,3]`. RSVP
> mutace (`useToggleRsvp`) invaliduje `['game-events','world']` → **prefixuje** widget správně (jen
> kalendář `world-all` mine). Tj. po RSVP se dashboard EventsColumn **obnoví** ✅; stale zůstává jen
> kalendář (`world-all`) + detail — to je přesně **C-09/C-10**, žádný nový nález pro dashboard.

---

## 4. Nálezy

### 🟠 C-45 · `FO`/badge · admin username-request approve/reject neobnoví `pending-actions` (bell/nav badge stale)
- **Mutace:** [useAdminUsers.ts:263-265](../../src/features/admin/users/api/useAdminUsers.ts#L263) (`useAdminApproveUsernameRequest`) a [useAdminUsers.ts:373-375](../../src/features/admin/users/api/useAdminUsers.ts#L373) (`useAdminRejectUsernameRequest`) — invalidují `['admin','username-requests']` (+ approve i `['admin','users']`), **ne** `['pending-actions']`.
- **Konzument:** `['pending-actions','count']` → bell badge (`PendingTab` + `centerBadge` přes `usePendingActionsCount`) a nav/right-panel badge. `PendingActionType.UsernameRequest` je [explicitní typ ve frontě](../../src/features/notifications/components/PendingTab.tsx#L16).
- **Rozpor:** sourozenci (article/gallery/discussion approve, world-access approve, friend accept) všichni invalidují broad `['pending-actions']` — admin username větev jediná ne. Cross-feature: konzument oblasti 11/02 nekrmen mutací oblasti 12. **Není duplicita C-14** (ten řeší jen audit-log + `admin,users` u rejectu) ani C-13 (friendship badge).
- **Trigger:** Admin schválí/odmítne žádost o přezdívku. **Viditelnost:** badge „N ke zpracování" u zvonku + v nav drží staré číslo (počítá i právě vyřízenou žádost); PendingTab řádek „Žádosti o přezdívku" drží starý počet. Toast „schváleno" přesto naskočí. **Workaround:** 30s staleTime / F5 / otevření jiné pending mutace.
- **Návrh:** doplnit do obou `onSuccess` `qc.invalidateQueries({ queryKey: ['pending-actions'] })` (parita se sourozenci). Závažnost 🟠 (badge drift, ne destruktivní; krátký staleTime tlumí).

### 🟠 C-46 · `WS`/`LC` · bell badge + `chat-feed`/`notification-events` bez socket-reconnect resync
- **Místo:** [useChatFeed.ts:42-51](../../src/features/notifications/api/useChatFeed.ts#L42) (`useChatFeedLive`) a [useEvents.ts:26-28](../../src/features/notifications/api/useEvents.ts#L26) — jediný krmič těchto infinite dotazů + bell `chatFeedUnseenAtom` je WS event (`chat:feed:bump` / `ikaros:new-message`). **Žádný `useSocketReconnect` re-fetch** (grep: 0 výskytů ve `features/notifications`).
- **Rozpor:** stejný vzor jako **C-07** (world unread) a **C-05** (global chat) — když socket spadne a reconnectne (síť ale drží, takže RQ `refetchOnReconnect` neskočí), zmeškané `bump`/`new-message` eventy → bell badge podhodnocený a `chat-feed`/`notification-events` feed vynechá zprávy přijaté během výpadku.
- **Trigger:** socket drop/reconnect (backend restart, deploy, mobilní přepnutí sítě bez ztráty IP) za běhu. **Viditelnost:** tichý — zvonek neukáže nové zprávy, drawer při otevření má díru ve feedu. **Workaround:** F5 / 60s staleTime u unread (`mail/unread` interval pomáhá jen systemUnread části, ne chatUnseen jotai badge). **Závažnost:** 🟠 (badge drift + díra ve feedu, ne destruktivní). Cross-ref **C-05/C-07** (stejná třída WS-only bez reconnect).
- **Návrh:** přidat `useSocketReconnect` re-join → po reconnectu `invalidate(['chat-feed'])` + `invalidate(['notification-events'])` + refetch `['mail','unread']`; bell jotai badge resetovat/přepočítat z čerstvého feedu (paměť `project_ws_security_patterns`).

### 🟡 C-47 · `WS`/`FO` · Ikaros platform dashboard (Akce/Novinky) bez real-time pushe (cizí admin)
- **Místo:** `['ikaros-news']` ([useIkarosNews.ts:14](../../src/features/ikaros/api/useIkarosNews.ts#L14), staleTime **5 min**) a `['ikaros-events','upcoming',3]` ([useIkarosEvents.ts:20](../../src/features/ikaros/api/useIkarosEvents.ts#L20), 60s) — žádný WS listener (grep `ikaros:news`/`ikaros:event` v socketech: 0).
- **Rozpor:** vlastní admin mutace invalidují broad `NEWS_KEY`/`KEY` → prefixují dashboard widget správně ✅ (KM ověřeno). Ale **cizí** admin/Superadmin, který přidá novinku/akci, ji ostatní (a i ten samý uživatel v jiné session) na úvodníku neuvidí — u novinek až **5 min** / F5. Přesný protějšek **C-04** (world news) na platformové úrovni.
- **Trigger:** druhý admin vytvoří platformovou novinku/akci. **Viditelnost:** tiše chybí na dashboardu i v list stránce. **Workaround:** 5 min (novinky) / 60s (akce) / F5. **Závažnost:** 🟡 (real-time gap, ne broken invalidace; 5 min staleTime u novinek je ale dlouhý → hraničí s 🟠).
- **Návrh:** buď WS broadcast `ikaros:news:bump`/`ikaros:event:bump` (leak-safe signál → invalidate), nebo snížit `ikaros-news` staleTime z 5 min na ~60s (parita s world-news C-04 / ikaros-events).

---

## 5. Latentní / VERIFY (neeskalováno na C-xx)

- **D-11-1 `LC` 🟡** — Notifikační centrum mountuje feed dotazy jen při `open`. WS invalidace
  `chat-feed`/`notification-events` při zavřeném draweru jen označí stale (refetch až při mountu) — to je
  správně. Bell badge přitom drží `chatFeedUnseenAtom` (jotai přežívá unmount) → badge funguje i zavřený.
  **By-design**, jen důsledek lazy-mountu (souvisí s C-46: badge atom drží číslo, ale feed má díru).
- **D-11-2 `SC` 🟡 (drift-trap)** — `useFavoritePage` ([useFavoritePage.ts:17](../../src/features/world/pages/api/useFavoritePage.ts#L17)) hardcoduje
  `['worlds','slug',worldSlug]`. Pokud by se world dashboard / PageViewer někdy dosáhl přes ObjectId
  route (`['worlds','id',worldId]`), optimistic update FavoritePagesColumn **mine** (jiný `[1]`). Dnes
  favorite endpoint jen na slug routách (komentář v souboru) → latentní, ne aktivní. Příbuzné D-03-7.
- **VERIFY (M4):** C-46 socket-reconnect díra — runtime: shodit BE socket, poslat zprávu z druhé session,
  reconnect klienta, ověřit zda bell badge naskočí bez F5. (Stejná metodika jako C-05/C-07.)

**Census (M-CEN): čistý** — všechny mutace dotčené v oblasti mají cache efekt; gapy jsou WS-parita
(C-46/C-47) a chybějící cross-feature klíč (C-45), ne mutace bez efektu.
