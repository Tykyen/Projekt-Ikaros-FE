# cache / 11-notifikace-dashboardy-sidebary — checkpoint RUN-2026-06-20-1621

## Pokrytí

Přečteny a staticky ověřeny (HEAD):

- `src/features/notifications/api/useChatFeed.ts`
- `src/features/notifications/api/useEvents.ts`
- `src/features/notifications/api/usePush.ts`
- `src/features/notifications/api/usePushSubscriptions.ts`
- `src/features/notifications/components/NotificationCenter.tsx`
- `src/features/notifications/components/PendingTab.tsx`
- `src/features/notifications/components/PushToggle.tsx` / `PushDevicesList.tsx`
- `src/app/layout/IkarosLayout/IkarosLayout.tsx` (celý)
- `src/features/world/pages/WorldDashboardPage/WorldDashboard/WorldDashboard.tsx`
- `src/features/world/pages/WorldDashboardPage/WorldDashboard/columns/{EventsColumn,NewsColumn,FavoritePagesColumn}.tsx`
- `src/features/world/pages/api/useFavoritePages.ts`
- `src/features/world/api/useWorldNews.ts` + `useWorldChat.ts` (unread branch)
- `src/features/world/hooks/useWorldSocket.ts`
- `src/features/ikaros/api/useIkarosNews.ts`
- `src/features/ikaros/api/useIkarosEvents.ts`
- `src/features/ikaros/pages/DashboardPage/sections/{IkarosEventsSection,PlatformNewsSection}.tsx`
- `src/features/admin/users/api/useAdminUsers.ts` (approve/reject username)
- `src/features/users/api/usePendingActions.ts`
- `src/features/ikaros/api/useMail.ts` (useUnreadCount)
- `src/features/notifications/model/centerStore.ts`

Porovnáno s plánem oblasti (sweep 2026-06-05) a registrem (C-45..C-47).

## Dosažená L vs cílová L

Dosaženo **L2** (statická key-match analýza) pro všechny sub-oblasti.  
Cílová L dle plánu: L2+ (osy FO/LC/KM/WS; perspektivy P1/P6/P7).  
L3/L4 (testy, runtime) nevyužity — viz PROOF-REQUEST.

## Nálezy

### Potvrzená stav opravených nálezů (z registru 2026-06-05)

- **C-45 ✅ OPRAVENO** — `useAdminApproveUsernameRequest` (řádek 309–310) i `useAdminRejectUsernameRequest` (řádek 435) invalidují `['pending-actions']`. Parita se sourozenci confirmed L2.
- **C-46 ✅ OPRAVENO** — `useChatFeedLive` (řádek 52–54) a `useEvents` (řádek 29–31) mají `useSocketReconnect` callback invalidující příslušné klíče. Confirmed L2.
- **C-47 ✅ OPRAVENO** — `useIkarosNews` (řádek 24–31) poslouchá `ikaros:news:changed` + reconnect. `useIkarosEvents` (řádek 13–20) poslouchá `ikaros:events:changed` + reconnect. Confirmed L2.

### Nové nálezy

---

**C-RUN-01 · `WS`/`FO` · `useUpcomingIkarosEvents` (dashboard Akce) bez WS listeneru — `ikaros:events:changed` chybí, když AkcePage není mounted**  
- **Kde:** `src/features/ikaros/api/useIkarosEvents.ts:30-40` (`useUpcomingIkarosEvents`) vs `useIkarosEvents` (řádek 10–27)  
- **Problém:** WS listener `ikaros:events:changed` i `useSocketReconnect` callback žijí výhradně v `useIkarosEvents()`, kterou mountuje jen `AkcePage`. Dashboard (`IkarosEventsSection`) používá `useUpcomingIkarosEvents(3)` — bez WS listeneru. Invalidace `KEY = ['ikaros-events']` (prefix) by `upcoming` variantu zasáhla, ALE jen pokud je `useIkarosEvents` mountován. Na domovské stránce (`/`) typicky mountován není → `ikaros:events:changed` event nemá posluchače → `['ikaros-events','upcoming',3]` zůstane stale po změně cizího admina, dokud uživatel nenačte `AkcePage` nebo `staleTime` (60s) nevyprší.  
- **Dopad:** Zhoršuje C-47 fix — cizí admin přidá/upraví/smaže ikaros event, server broadcastuje `ikaros:events:changed`, ale uživatel na dashboardu (bez otevřené AkcePage) čeká na automatický refresh 60s místo real-time obnovy. Vlastní create/update (kliknutím v IkarosEventsSection) stale nezůstane (REST `onSuccess` invaliduje `KEY`). Tichý — uživatel neví.  
- **Trigger:** Jiný admin změní platformovou akci; current user je na `/` (úvodník).  
- **Workaround:** 60s staleTime; nebo otevřít `/ikaros/akce` → mounta `useIkarosEvents` → listener aktivní.  
- **Návrh A (minimální):** Přesunout `useSocketEvent` a `useSocketReconnect` z `useIkarosEvents` do `useUpcomingIkarosEvents` (nebo do samostatného hook `useIkarosEventsLive()`), aby listener fungoval i bez AkcePage. `useUpcomingIkarosEvents` ji pak volat.  
- **Návrh B (symetrický s ikaros-news):** Přidat WS listener přímo do `useUpcomingIkarosEvents` → oba hooky listenují nezávisle (drobná duplicita, ale izolace).  
- **Závažnost:** 🟡 (real-time gap u minority akce, 60s staleTime tlumí; symetrická třída jako C-47, který byl 🟡; C-47 byl opraven ale tato díra zůstala)  
- **L2** · 🆕

---

**C-RUN-02 · `LC`/`P7` · `useFavoritePages` — jotai `currentUserAtom` drží stale `favoritePageSlugs` po synchronizaci z jiného zařízení**  
- **Kde:** `src/features/world/pages/api/useFavoritePages.ts:39-42`, `src/shared/store/authStore` (`currentUserAtom`)  
- **Problém:** `FavoritePagesColumn` čte `order` z `profile?.favoritePageSlugs?.[worldId]` kde `profile` pochází z `useMyProfile()` (RQ key `['users','me']`). Toggle/reorder dělá optimistic update `setQueryData(['users','me'])` + `onSettled: invalidate(['users','me'])` → RQ se obnoví. Ale `currentUserAtom` (jotai) se synchronizuje přes `useCurrentUserHydration` bridge, který reaguje na `['users','me']` query data change. Pokud `favoritePageSlugs` v `currentUserAtom` nekoresponduje s `['users','me']` (např. po mezičasové RQ invalidaci z jiného místa nebo po reconnectu bez refetch), IkarosLayout sidebar Oblíbené diskuze/články (`pinnedFirst` čte z `currentUserAtom`) a FavoritePagesColumn (čte přímo z RQ) se mohou rozcházet. Tato nová architektura (post-audit, nahradila `world.favoritePageSlugs` slug-klíč) nebyla v původním plánu ověřena.  
- **Hodnocení:** Latentní, ne aktivní. Bridge `useCurrentUserHydration` propaguje RQ→atom synchronně při refetch. Skutečná díra by nastala jen pokud bridge selhal nebo atom přežil RQ `qc.clear()` (logout). C-29 (logout `qc.clear()`) byl opraven — při logout se RQ čistí. Atom se neresetuje explicitně, ale po logout redirect se komponenty unmountují → atom přežije jen ephemérně.  
- **Závažnost:** 🟡 latentní; nesplňuje threshold pro eskalaci na C-xx (bridge drží ✅ L2 dle původního plánu K-C6). Poznamenáváno pro úplnost.  
- **L2** · 🔓 (otevření latentního, ne nový aktivní nález)

---

### Bez nálezů (ověřeno)

- **Push notifikace** (`usePush`, `usePushSubscriptions`, `useUnsubscribeDevice`): invalidace `pushDeviceKeys.all` po enable/disable/remove → ✅ L2. Oblast nová od posledního auditu (spec 13.2c), ale cache architektura čistá.
- **Bell badge centerBadge** = `chatUnseen + systemUnread`: `chatUnseen` jotai atom se nuluje při otevření centra (NotificationCenter `useEffect open`), `systemUnread` z `['mail','unread']` s 60s interval + WS invalidace — ✅ konzistentní; badge se neresetuje jen při čtení jednotlivých zpráv v EventsTab (bez `mark as read` API, by-design).
- **FavoritePagesColumn** nová architektura (`useFavoritePages` + `['users','me']`): optimistic update s rollbackem + `onSettled invalidate` → ✅ L2. Nahradila původní `world.favoritePageSlugs` + slug klíč — D-11-2 latentní nález z plánu tím odpadl (nová impl. používá `['users','me']` konzistentně).
- **NewsColumn (world dash)** + WS `world:news:changed` via `useWorldSocket`: ✅ C-04 fix confirmed, `useWorldSocket` v `WorldLayout` (mountovaný pro všechny světové stránky) poslouchá a invaliduje `['world-news', worldId]` → drží L2.
- **C-45/C-46/C-47** — všechny tři ověřeny jako opravené (viz výše).

## PROOF-REQUEST

1. **PROOF-REQUEST: C-RUN-01 runtime** (M4) — shodit BE, vytvořit ikaros event z jiného admin účtu (nebo simulovat `ikaros:events:changed` WS emit), ověřit, že dashboard `IkarosEventsSection` se obnoví bez F5 **i když `/ikaros/akce` nikdy nebyla otevřena**. Očekávaný výsledek při nalezené díře: sekce zůstane stale 60s.  
2. **PROOF-REQUEST: push subscriptions** (M4) — ověřit `enable()` → `usePushSubscriptions` se refetchne bez F5; `useUnsubscribeDevice` → seznam se zkrátí okamžitě. (Vyžaduje HTTPS + push-capable browser.)
