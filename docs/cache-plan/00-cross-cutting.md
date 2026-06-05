# 00 — Cross-cutting

> **Sweep 2026-06-05.** Cache-invalidation SYNTÉZA (TanStack Query v5). Read-only.
> Globální vzory, ne jedna feature: queryClient config · router loadery · jotai dual-cache ·
> `[worldId,…]` anti-pattern · factory vs inline census · M-CEN · `useSocketReconnect` pokrytí.
> Osy: `KM` `CB` `SC` `WS` `LC` · perspektivy P2 (prefix-match) + P6 (rekonciliace) + P7 (dual-cache).
> Nálezy → [`../cache-audit.md`](../cache-audit.md) (`C-56…C-60`).
> **Stav: ✅ hotovo — 3 nové nálezy (C-56 🟠, C-57 🟡, C-58 🟡). Verdikty: K-C4 ✅ vyvrácen, K-C6 ✅ vyvrácen (bridge), K-C10 ✅ vyvrácen (žádný first-segment dynamic).**

---

## 1. queryClient config — globální defaulty a důsledky

[`src/app/main.tsx:18-25`](../../src/app/main.tsx#L18)

```ts
new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });
```

| Option | Hodnota | Důsledek pro invalidaci |
|---|---|---|
| `staleTime` | `30_000` (30s) | dotaz je 30s „fresh" → bez invalidace se **nerefetchne** ani při remountu (data považována za aktuální). Jednotlivé dotazy přepisují: 60s (settings, members, world-news, unread, AR), 5 min (worlds), 30s (universe, feed, events). **Invalidaci neřeší** — `invalidateQueries` označí stale bez ohledu na staleTime a refetchne mounted dotazy. staleTime jen určuje, jak dlouho *spontánní* stale netrvá → u orphanů (P6) je 30s–5min „okno slepoty". |
| `gcTime` | **default 5 min** (žádný override) | neaktivní (unmounted) záznam přežívá 5 min → návrat do 5 min ukáže cache; pokud ho mezitím nikdo neinvalidoval, je stale do staleTime/refetchOnMount. Relevantní pro DEL/orphan (P5). |
| `retry` | `1` | mutace **nemají** vlastní `retry` default zde (jen queries) → mutace nezkouší znovu; jejich `onError`/optimistic rollback běží hned. Query se po failu zkusí 1×. |
| `refetchOnWindowFocus` | **default true** (neoverridnuto) | tab-focus refetchne stale dotazy → **tlumí** část orphan/dead nálezů (uživatel se vrátí do tabu → refetch). Nelze na to ale spoléhat při invalidaci v rámci jedné session. VERIFY zda někde vypnuto per-query. |

**Závěr:** žádné globální `gcTime`/`refetchOnMount` override → semantika TanStack defaultů. Invalidace je **explicitní**; staleTime/gcTime jen určují, jak dlouho vydrží *spontánní* stale, než zaberou fallbacky.

---

## 2. Router loadery (K-C4, P7 dual-cache)

[`src/app/router.tsx`](../../src/app/router.tsx) — přečteno celé (359 řádků).

**Inventura všech `loader:` rout:**

| Route (path) | loader | Co fetchuje | Sdílí data s RQ? |
|---|---|---|---|
| `ikaros/clanky/novy` + `:id/upravit` | `requireAuth` | **nic** — jen čte `localStorage('ikaros.jwt')`, redirect na `/?openLogin=1` při absenci | ne |
| `ikaros/clanky/:id` … všechny `loader: requireAuth` (chat, rozcesti×3, vytvorit-svet, profil, uzivatel/:id, diskuze×3, posta, oblibene, akce, uzivatele, admin, admin/dungeon-builder, ikaros/admin/emotes) | `requireAuth` | **nic** (auth gate) | ne |

**Jediný loader v celém routeru je `requireAuth`** ([`router.tsx:124-137`](../../src/app/router.tsx#L124)). Nefetchuje žádná serverová data — pouze synchronně čte JWT z localStorage a buď vrátí `null` (pokračuj), nebo `redirect`. World sub-routes (`/svet/:worldSlug/*`) loadery **nemají vůbec** — gating jde přes `<WorldMembershipGuard>` / `<RoleGuard>` komponenty, ne loader.

### Verdikt K-C4 — ✅ vyvrácen (žádná dual-cache router↔RQ)

Žádný router loader nefetchuje data, která by zrcadlil RQ dotaz. **Neexistuje** scénář „RQ `invalidateQueries` neobnoví loader data". Veškerý serverový stav teče výhradně přes TanStack Query. Router cache drží jen výsledek auth-gate (null/redirect), který je odvozený z `localStorage`, ne z RQ. **Není nález.**

⚠️ Vedlejší (P7, mimo RQ): `requireAuth` čte token z `localStorage('ikaros.jwt')` **přímo** (`JSON.parse`), zatímco appka ho jinde drží přes `accessTokenAtom` (jotai `atomWithStorage` na témž klíči). Při logoutu ([`useAuth.ts:92`](../../src/features/auth/api/useAuth.ts#L92) `set(accessTokenAtom, null)`) jotai localStorage smaže → loader je konzistentní. Latentní jen kdyby někdo měnil token mimo atom — dnes OK.

---

## 3. Jotai dual-cache (K-C6, P7)

Census všech atomů ([`src/shared/store/`](../../src/shared/store/) + grep `atom(` napříč `src/`):

| Atom | soubor:řádek | Zrcadlí server? | RQ protějšek | Dual-cache riziko |
|---|---|---|---|---|
| `currentUserAtom` | [authStore.ts:7](../../src/shared/store/authStore.ts#L7) | **ANO** (User profil) | `['users','me']` | ⚠️ viz níže — **mitigováno bridgem** |
| `accessTokenAtom` / `refreshTokenAtom` | authStore.ts:5-6 | token (ne server entita) | — | ne |
| `pendingLogoutAtom`, `*ModalOpenAtom`, `isAuthenticatedAtom` | authStore.ts:11-37 | UI stav | — | ne |
| `themeAtom` | [themes/state.ts:7](../../src/themes/state.ts#L7) | **ANO** (`user.themeId`) | `['users','me']` (přes `currentUserAtom`) | ⚠️ viz C-57 |
| `worldThemePreviewAtom` / `platformThemePreviewAtom` | themes/state.ts:23,30 | preview (ephemerální) | — | ne |
| `sidebarOpenAtom` | uiStore.ts:3 | UI prefs | — | ne |
| `presenceStatusMapAtom` | shared/presence/store.ts:9 | WS presence (ne RQ) | — | ne (WS-driven) |
| `socketStatusAtom`, `myRoomsAtom` | chat/store/ | socket/UI stav | — | ne |
| `centerOpenAtom`, `centerTabAtom`, `chatFeedUnseenAtom` | notifications/model/centerStore.ts | UI + badge counter | `['chat-feed']` (badge odvozen ručně) | ⚠️ badge drift (oblast 11) |
| `preferredCurrencyAtomFamily` | currencies/shared | klientská preference (localStorage) | — | ne |
| `soundActivatedAtom` / `soundVolumeAtom` / `soundMutedAtom` | sounds/player | UI prefs | — | ne |

**Klíčová mechanika — RQ↔atom bridge ([`useAuth.ts:139-153`](../../src/features/auth/api/useAuth.ts#L139)):**
`useCurrentUserHydration` je mountnut **trvale** v root stromu ([`AuthBootstrap.tsx:25`](../../src/features/auth/components/AuthBootstrap.tsx#L25)). Drží `useQuery(['users','me'])` a `useEffect(() => { if (data) setUser(data) })`. Proto **každá** `invalidateQueries(['users','me'])` → refetch query → nová `data` → effect přepíše `currentUserAtom`. Bridge funguje jednosměrně RQ→atom.

Navíc profilové mutace ([`useProfile.ts`](../../src/features/profile/api/useProfile.ts)) píší **oboje současně**: `setQueryData(['users','me'], data)` + `getDefaultStore().set(currentUserAtom, data)` (řádky 22-23, 56-57, 69-70, 89-90, 102-103). Stejně logout/login [`useAuth.ts:42,64,92`](../../src/features/auth/api/useAuth.ts#L42) a delete account [`useDeleteAccount.ts:77,109`](../../src/features/profile/api/useDeleteAccount.ts#L77).

### Verdikt K-C6 — ✅ vyvrácen (bridge pokrývá fan-out RQ→atom)

Mutace, které jen `invalidateQueries(['users','me'])` (bez ručního `setQueryData`/`set(atom)`) — např. [`useGallery.ts:176`](../../src/features/ikaros/api/useGallery.ts#L176), [`useArticles.ts:202`](../../src/features/ikaros/api/useArticles.ts#L202), [`useDiscussions.ts:177`](../../src/features/ikaros/api/useDiscussions.ts#L177) (favorites), [`useFavoriteCharacters.ts:95`](../../src/features/world/pages/CharactersPage/hooks/useFavoriteCharacters.ts#L95), [`useEmailVerify.ts:11`](../../src/features/auth/api/useEmailVerify.ts#L11), [`useAdminUsers.ts:39,54`](../../src/features/admin/users/api/useAdminUsers.ts#L39) (username change) — **přesto obnoví header/atom** díky permanentnímu bridgi. Header (jméno/avatar z `currentUserAtom`) se po profilové mutaci překreslí. **Není nález** pro hlavní user profil.

⚠️ Reverzní směr (atom→RQ) bridge **nemá**: `usePinnedChannels.ts:39` zapisuje `set(currentUserAtom, { ...cur, chatPreferences })` **přímo** bez `setQueryData(['users','me'])`. Pokud se pak `['users','me']` refetchne (staleTime 30s / focus), vrátí BE stav a může pinned channels přepsat zpět. → **C-58** (latentní).

---

## 4. `[worldId,…]` anti-pattern (K-C10, KM/SC)

Grep `queryKey: [worldId` (přímý dynamický first-segment): **0 výskytů.** Grep `queryKey: [\`` (template literál first-segment): **0 výskytů.** Plný census 222 `queryKey:` definic ([extract](#)): **každý klíč má jako `[0]` namespace string** (`'worlds'`, `'characters'`, `'game-events'`, `'world-news'`, `'pages'`, `'world-chat'`, `'map'`, `'sounds'`, `'accounts'`, `'admin'`, `'friends'`, `'pending-actions'`, `'mail'`, `'universe'`, `'world-search'`, `'calendars-aggregate'`, `'weather-history'`, …).

worldId/id **nikdy** nestojí na `[0]` — vždy `[1]+` za namespacem: `['characters', worldId]`, `['world-news', worldId, …]`, `['worlds', worldId, 'members']`, `['universe', worldId]`, `['pages', worldId, …]`.

### Verdikt K-C10 — ✅ vyvrácen (žádný first-segment-dynamic kolizní klíč)

Kolizní riziko „různé zdroje téhož světa sdílí dynamický prefix" **neexistuje** — namespace izoluje. Naopak: **opačný** vzor je v repu častý a žádoucí — `['worlds', worldId, 'members']` sdílí prefix `['worlds', worldId]` se `settings`, což je záměr (join/access invalidace jedním klíčem trefí oba). To je už zachyceno v oblasti 03 (C-01, D-03-7) jako SC nuance, ne K-C10.

⚠️ Latentní (SC, ne kolize): `['characters', worldId]` (bez dalšího segmentu) je **velmi široký** invalidační klíč — `useDiarySchema.ts:92,160,179` a `useCharacterAccounts.ts:109…272` invalidují celý `['characters', worldId]` → refetchne PC/NPC/detail/directory paletu naráz. Over-invalidation (bezpečné pro cache), ne kolize. Pokrývají oblasti 05/08.

---

## 5. Factory vs inline census (P2)

Factory klíče (drift-safe — query i invalidace volají tutéž funkci):

| Factory | soubor:řádek | Tvar |
|---|---|---|
| `eventsKeys` | [useEvents.ts:10](../../src/features/notifications/api/useEvents.ts#L10) | `['notification-events']` |
| `chatFeedKeys` | [useChatFeed.ts:11](../../src/features/notifications/api/useChatFeed.ts#L11) | `['chat-feed']` |
| `chatQueryKeys(room)` | [useGlobalChat.ts:21](../../src/features/chat/api/useGlobalChat.ts#L21) | per-room |
| `universeQueryKey(worldId)` | [useUniverse.ts:16](../../src/features/world/universe/api/useUniverse.ts#L16) | `['universe', worldId]` |
| `mailKeys` | [useMail.ts:15](../../src/features/ikaros/api/useMail.ts#L15) | `['mail', …]` |
| `worldCurrenciesQueryKey` | [currencies/api.ts:21](../../src/features/world/currencies/api.ts#L21) + **dup** [characters.types.ts:256](../../src/features/world/pages/api/characters.types.ts#L256) | `['currencies', worldId]` |
| `bestiarQueryKey` | [useBestiar.ts:8](../../src/features/world/bestiar/hooks/useBestiar.ts#L8) | per-world+system |
| `customPresetsKey` | [useCustomPresets.ts:14](../../src/features/world/api/useCustomPresets.ts#L14) | per-world |
| `generatorSetsKey` | [useGeneratorSets.ts:21](../../src/features/world/api/useGeneratorSets.ts#L21) | per-world |
| `calendarConfigsKey` | [useCalendarConfigs.ts:13](../../src/features/world/api/useCalendarConfigs.ts#L13) | per-world |
| `weatherGeneratorsKey` / `weatherHistoryKey` | [useWeatherGenerators.ts:24,213](../../src/features/world/api/useWeatherGenerators.ts#L24) | per-world |
| `campaignKeys` | [campaign/api.ts:33](../../src/features/world/campaign/api.ts#L33) | — |
| `worldChatKeys(worldId)` | [useWorldChat.ts:33](../../src/features/world/chat/api/useWorldChat.ts#L33) | per-world |
| `mapSceneQueryKey` / `activeScenesQueryKey` | [useMapScene.ts:40](../../src/features/world/tactical-map/hooks/useMapScene.ts#L40), [useActiveScenes.ts:25](../../src/features/world/tactical-map/hooks/useActiveScenes.ts#L25) | per-world |
| `emoteKeys` | [useWorldEmotes.ts:8](../../src/features/world/chat/emotes/api/useWorldEmotes.ts#L8) | — |
| `shopKeys` | [shop/api.ts:30](../../src/features/world/shop/api.ts#L30) | — |
| `charactersQueryKey` | [characters.types.ts:240](../../src/features/world/pages/api/characters.types.ts#L240) | `['characters', worldId, …]` |
| `diarySchemaQueryKey` | [diarySchema.types.ts:88](../../src/features/world/pages/api/diarySchema.types.ts#L88) | per-world |
| `pagesQueryKey` | [usePage.ts:25](../../src/features/world/pages/api/usePage.ts#L25) | `['pages', worldId, …]` |
| `worldPageTemplatesQueryKey` | [worldPageTemplates.types.ts:51](../../src/features/world/pages/api/worldPageTemplates.types.ts#L51) | — |
| `timelineKeys` | [useTimelineEvents.ts:20](../../src/features/world/pages/TimelinePage/api/useTimelineEvents.ts#L20) | — |

≈ **24 factory definic** (+ `membersQueryKey` lokální v [useCharacterMutations.ts:20](../../src/features/world/pages/api/useCharacterMutations.ts#L20), `worldQueryKey` lokální v [useFavoritePage.ts:17](../../src/features/world/pages/api/useFavoritePage.ts#L17)).

**Inline hotspoty (drift-prone — klíč existuje na ≥2 místech jako literál):**

| Namespace | Inline definice / invalidace na ≥2 místech | Riziko |
|---|---|---|
| `['worlds', …]` | čteno [useWorlds.ts:10,28,45](../../src/features/world/api/useWorlds.ts#L10), [useWorldSettings.ts:11], [useWorldMembers.ts:11], [useMyAccessRequests.ts:14]; invalidováno **~20 souborů** (useUpdateWorld, useWorldJoin, useWorldSocket, MapPjPanel, SceneAccessSection, LoadPreparationDialog, MapEmptyState, MapLibraryModal, useMapWeather setQueriesData, …) — vše inline | 🟡 nejrozsáhlejší inline namespace; drift mezi `['worlds',w,'members']` literály (8+ míst) |
| `['game-events', …]` | čteno [useGameEvents.ts:42,58,82,115,135,192]; invalidováno tamtéž ručně + `invalidateGameEvents()` helper — **inline literály** `'world'`/`'world-all'`/`'upcoming-mine'`/… | 🟠 segment-typo riziko (K-C2, oblast 09); plural/sufix past |
| `['world-news', worldId]` | čteno [useWorldNews.ts:11,34,59]; invalidováno tamtéž 5× inline | 🟡 |
| `['pending-actions']` | invalidováno **~10 souborů** inline (friendships, world access, gallery, articles, discussions, ZpracovatTab) | 🟡 dead-invalidace riziko nízké (1 namespace) |
| `['users','me']` | invalidováno **~10 souborů** inline (profil, gallery/articles/discussions favorites, admin username, email verify, delete, favoriteChars) | 🟡 — ale bridge + jednoduchý klíč → robustní |
| `['characters', worldId]` | invalidováno inline v useDiarySchema, useCharacterAccounts (10×), shop api | 🟡 over-broad (sekce 4) |
| `['map', …]` | inline literály v MapPjPanel (`'world-scenes'` vs `'world-active-scenes'` — **dva různé** tvary) | 🟠 VERIFY drift (oblast 08) |
| `['admin', …]` | useAdminUsers ~15× inline | 🟡 jeden soubor → drift nízký |

**Poměr:** ~24 factory namespaces vs **~73 souborů s inline `queryKey:`** (222 definic celkem). Factory pokrývá per-world doménová data (characters, pages, map, weather, calendar, bestiar, chat); inline dominuje u `worlds`, `game-events`, platform (articles/gallery/discussions/admin) a cross-cutting badge klíčů (`pending-actions`, `users/me`). Největší drift-prone povrch: **`['worlds',…]`** (20 invalidačních míst) a **`['game-events',…]`** (segment-typo).

---

## 6. M-CEN globální census (mutace bez cache efektu)

Metoda: každý `useMutation` má mít ≥1 cache efekt (`invalidateQueries` / `setQueryData` / `removeQueries`) v `onSuccess`/`onSettled`. Mutace bez efektu = kandidát na stale UI (uživatel akci provede, nikde se neprojeví bez F5).

Globální skript nebyl spuštěn (M-REC `[auto]` ještě neběžel — viz README baseline). Per-oblast census byl proveden v dílčích sweepech; známé „čisté" oblasti: 03 (Census čistý). Známí kandidáti z jiných oblastí:

- **C-24** (oblast 08) — `token.remove` / token mutace bez fan-outu (odkaz, ne nový nález).
- `useChangePassword` ([useProfile.ts:33](../../src/features/profile/api/useProfile.ts#L33)) — **by-design** bez cache efektu (PUT 204, jen toast; revokace tokenů řeší BE event-driven, žádná FE cache se nemění). ⚖️ ne nález.

**Doporučení (metodika, ne nález):** spustit M-REC node skript (extrakce všech `queryKey` literálů × všech invalidačních literálů, párování po namespace) pro orphan + dead detekci globálně — to je jediný způsob, jak chytnout dead-invalidace u inline hotspotů ze sekce 5 (`['map','world-scenes']` vs `['map','world-active-scenes']`, `'game-events','upcoming-world'` apod.). Dokud neběží → **VERIFY**.

---

## 7. `useSocketReconnect` pokrytí (WS/LC)

Mechanika ([`useSocket.ts:51-65`](../../src/features/chat/api/useSocket.ts#L51)): Socket.IO po reconnectu zahodí **všechny rooms**; ruční `room:join` se sám neobnoví. `useSocketEvent` ([useSocket.ts:68](../../src/features/chat/api/useSocket.ts#L68)) re-registruje listener na změnu `socketStatusAtom` → **listener přežije** reconnect. Problém je jen **room membership** — bez re-join server do roomu nic neposílá (klient „oslepne" i s živým listenerem).

| WS hook / komponenta | Joinuje room? | Re-join po reconnectu? | soubor:řádek |
|---|---|---|---|
| `useWorldSocket` | `world:{id}` | ✅ `useSocketReconnect` | [useWorldSocket.ts:40](../../src/features/world/hooks/useWorldSocket.ts#L40) |
| `ChannelView` (world chat) | `chat:{channelId}` | ✅ `useSocketReconnect` | [ChannelView.tsx:217](../../src/features/world/chat/components/ChannelView.tsx#L217) |
| `useActiveScenes` | `map:join-world` | ✅ `useSocketReconnect` | [useActiveScenes.ts:76](../../src/features/world/tactical-map/hooks/useActiveScenes.ts#L76) |
| `useUniverseSocket` | `world:{id}` | ✅ inline `socket.on('connect')` (ekvivalent) | [useUniverseSocket.ts:44](../../src/features/world/universe/hooks/useUniverseSocket.ts#L44) |
| `useMapWeather` | `world:{id}` | ✅ inline `socket.on('connect')` | [useMapWeather.ts:83](../../src/features/world/tactical-map/hooks/useMapWeather.ts#L83) |
| **`ChatRoom` (Hospoda/Rozcestí)** | **`chat:{channelId}`** | **❌ žádný re-join** | [ChatRoom.tsx:250](../../src/features/chat/components/ChatRoom.tsx#L250) → **C-56 / cross-ref C-05** |
| `useFriendshipsSocket` | — (jen listener) | n/a — ride `user:{id}` (BE auto-join) | [useFriendshipsSocket.ts:38](../../src/features/friendships/hooks/useFriendshipsSocket.ts#L38) |
| `useWorldAccessSocket` | — | n/a — `user:{id}` | [useWorldAccessSocket.ts:45](../../src/features/world/hooks/useWorldAccessSocket.ts#L45) |
| `useChatFeedLive` | — | n/a — `user:{id}` (signál `chat:feed:bump`) | [useChatFeed.ts:42](../../src/features/notifications/api/useChatFeed.ts#L42) → cross-ref **C-07** |
| `useEvents` | — | n/a — `user:{id}` (`ikaros:new-message`) | [useEvents.ts:26](../../src/features/notifications/api/useEvents.ts#L26) |
| `useUnreadCount` (mail) | — | n/a — `user:{id}`; navíc `refetchInterval 60s` fallback | [useMail.ts:31](../../src/features/ikaros/api/useMail.ts#L31) |
| `useAccountTransferNotifications` | — | n/a — `user:{id}` (`account:transfer:received`) | [useAccountTransferNotifications.ts:21](../../src/features/world/pages/api/useAccountTransferNotifications.ts#L21) |
| `useChannelPresence` | — (jen listener; presence room joinnut chatem) | závisí na `chat:{channelId}` re-join | [useChannelPresence.ts:32](../../src/features/world/chat/api/useChannelPresence.ts#L32) → **závislé na C-56** |
| `useWeatherWsSubscribe` (karty) | — (`world:{id}` joinnut `useWorldSocket`) | dědí re-join z `useWorldSocket` | [useWeatherWsSubscribe.ts:23](../../src/features/world/api/useWeatherWsSubscribe.ts#L23) |
| `ChannelView` group listeners (`chat:channel:*`/`chat:group:*`) | — (ride `world:{id}`) | dědí z `useWorldSocket` | [ChannelView.tsx:122](../../src/features/world/chat/components/ChannelView.tsx#L122) |

**Klíč:** room `user:{id}` se NEjoinuje z FE — BE ho auto-joinne v `handleConnection` (FE nikde neemituje `room:join user:...`, viz grep). Proto pure-listener hooky na `user:{id}` přežijí reconnect **automaticky** (BE re-join při novém handshake). ⚠️ **VERIFY** (BE strana): potvrdit, že gateway `handleConnection` auto-joinne `user:{userId}` i po reconnectu (FE to nepokrývá).

**Mezera:** [`ChatRoom.tsx:250`](../../src/features/chat/components/ChatRoom.tsx#L250) joinuje `chat:{channelId}` (Hospoda + Rozcestí I–III) bez `useSocketReconnect` → po reconnectu room ztracen, listenery žijí, ale `chat:message`/`presence`/`typing` z roomu nepřijdou. To je **C-05** z oblasti 06 (ChatRoom chybí re-join); zde eskalováno jako cross-cutting **C-56** s odkazem na vzorové řešení v `ChannelView`/`useWorldSocket`.

---

## Nálezy

### 🟠 C-56 · `WS`/`LC` · `ChatRoom` (Hospoda/Rozcestí) nemá reconnect re-join `chat:{channelId}` (cross-ref C-05)
- **Místo:** [`ChatRoom.tsx:250`](../../src/features/chat/components/ChatRoom.tsx#L250) `socket.emit('room:join', 'chat:${channelId}')` v `joinRoom`, volaném jen z mount-effectu ([ChatRoom.tsx:285](../../src/features/chat/components/ChatRoom.tsx#L285)). **Žádný `useSocketReconnect`** (na rozdíl od sourozence [`ChannelView.tsx:217`](../../src/features/world/chat/components/ChannelView.tsx#L217)).
- **Rozpor:** po WS reconnectu (drop spojení → connect) Socket.IO zahodí rooms. `useSocketEvent` listenery se přeregistrují (přežijí), ale klient už není v `chat:{channelId}` → server do roomu nic neposílá. `chat:message` / `chat:presence` / `chat:typing` v Hospodě i Rozcestí přestanou chodit.
- **Trigger:** ztráta + obnova spojení (mobilní síť, sleep, server redeploy) při otevřené Hospodě/Rozcestí. Toast „Spojení obnoveno" ([useSocket.ts:29](../../src/features/chat/api/useSocket.ts#L29)) naskočí → uživatel věří, že chat jede.
- **Viditelnost:** tiché oslepnutí — nové zprávy ostatních se neobjeví, presence/typing zamrzne. Vlastní odeslaná zpráva přes REST/optimistic projde (matoucí: „mně to funguje").
- **Workaround:** odejít z místnosti + Vstoupit znovu (re-emit join), nebo F5.
- **Návrh:** přidat `useSocketReconnect(() => { if (channelId && store.get(myRoomsAtom).has(room)) joinRoom-reemit })` — re-emit `room:join chat:${channelId}` + `chat:hospoda:join`/`chat:room:join`. Pozor: re-join nesmí znovu poslat „vchází" hlášku (BE musí dedup, nebo re-emit jen `room:join` bez presence join). Vzor: `ChannelView` re-emituje jen `room:join` ([ChannelView.tsx:219](../../src/features/world/chat/components/ChannelView.tsx#L219)). **Důsledek pro `useChannelPresence`** (oblast 06): presence v Rozcestí závisí na témž roomu → opraví se zároveň.

### 🟡 C-57 · `P7`/`LC` · `themeAtom` ↔ `user.themeId` — local-wins může maskovat cross-device změnu motivu
- **Místo:** [`useThemeSync.ts:40-50`](../../src/themes/useThemeSync.ts#L40). `themeAtom` (localStorage `ikaros.theme`) zrcadlí `user.themeId`. Initial sync: pokud `hadStoredThemeAtMount` (localStorage neprázdné) → **local wins**, push do BE; jinak BE wins.
- **Rozpor:** `initialSynced` ref se nastaví **jednou per mount** ([useThemeSync.ts:27](../../src/themes/useThemeSync.ts#L27)). Když uživatel změní motiv na zařízení B, na zařízení A (s uloženým localStorage) se `user.themeId` přes `currentUserAtom` sice aktualizuje (bridge), ale `useThemeSync` initial sync už proběhl a outbound effect ([useThemeSync.ts:54](../../src/themes/useThemeSync.ts#L54)) reaguje jen na změnu `themeId` (atomu), ne `user.themeId`. → cross-device změna motivu se na A **neprojeví** do reloadu (local localStorage drží starou hodnotu).
- **Trigger:** změna motivu na jiném zařízení/tabu. **Viditelnost:** tichá — vizuální drift mezi zařízeními. **Workaround:** F5 (re-mount → initial sync, ale local-wins ho zase přepíše BE-ward → reálně F5 nepomůže, dokud localStorage drží starou hodnotu). **Závažnost:** 🟡 (kosmetické, by-design „local wins" ochrana proti debounce race).
- **Návrh:** by-design kompromis (chrání proti debounce race, paměť `feedback_theme_isolation`). Pokud cross-device sync motivu má být priorita → přidat reakci na změnu `user.themeId` (ne jen mount). Jinak ponechat + zdokumentovat. **VERIFY** zda je cross-device theme sync požadavek.

### 🟡 C-58 · `P7` · `usePinnedChannels` zapisuje `currentUserAtom` přímo bez `setQueryData(['users','me'])` (reverzní bridge chybí)
- **Místo:** [`usePinnedChannels.ts:39`](../../src/features/world/chat/api/usePinnedChannels.ts#L39) `store.set(currentUserAtom, { ...cur, chatPreferences })` — atom updatován, ale `['users','me']` query cache **ne**.
- **Rozpor:** bridge ([useAuth.ts:150](../../src/features/auth/api/useAuth.ts#L150)) jede jen RQ→atom. Když se `['users','me']` refetchne (staleTime 30s vyprší, window focus, nebo jiná profilová mutace invaliduje) → query data (bez čerstvých `chatPreferences`, pokud BE PATCH ještě nedoběhl / nevrátil) přepíše přes bridge `currentUserAtom` → **pinned channels skočí zpět**. Race: ovlivněno tím, zda `usePinnedChannels` posílá PATCH na BE (VERIFY — soubor čte/zapisuje atom, BE persist nutno ověřit).
- **Trigger:** pin/unpin kanálu, pak focus tabu / 30s prodleva → refetch `/users/me`. **Viditelnost:** pin zmizí/obnoví se „sám". **Workaround:** re-pin. **Závažnost:** 🟡 (úzké, závisí na BE persist timing).
- **Návrh:** po `set(currentUserAtom, …)` přidat i `qc.setQueryData(['users','me'], updated)` (jako [`useProfile.ts:22-23`](../../src/features/profile/api/useProfile.ts#L22) — píše oboje). Tím obě cache zůstanou v sync. **VERIFY** zda hook persistuje na BE (jinak je to i form-schema/bug nález).

---

## Shrnutí vzorů (cross-cutting takeaways)

1. **Router cache není faktor** (K-C4 ✅): jediný loader je `requireAuth`, nefetchuje data. Veškerý serverový stav = TanStack Query. Žádná router↔RQ dual-cache.
2. **RQ↔atom dual-cache je systémově řešen bridgem** (K-C6 ✅): `useCurrentUserHydration` (trvale mountnutý) propaguje `['users','me']` → `currentUserAtom`. Slabina je **reverzní** směr (atom→RQ) — jen `usePinnedChannels` (C-58). Profilové mutace navíc píší obě cache ručně (robustní).
3. **Žádný first-segment-dynamic klíč** (K-C10 ✅): všech 222 klíčů má namespace string na `[0]`. Kolizní riziko neexistuje; naopak over-invalidation (`['characters',worldId]`, `['worlds']`) je častý bezpečný vzor.
4. **Drift-prone povrch = inline klíče u `worlds` (20 invalidačních míst) a `game-events` (segment-typo)**; factory dobře pokrývá per-world doménová data. `worldCurrenciesQueryKey` je definován **2×** (currencies/api.ts + characters.types.ts) — drift kandidát.
5. **Reconnect mezera je jediná `ChatRoom`** (C-56/C-05): pure-listener hooky přežijí díky BE auto-join `user:{id}`; room-joining hooky mají re-join **kromě** globálního/Rozcestí ChatRoomu.
6. **staleTime 30s + refetchOnWindowFocus (default) tlumí** orphan/dead nálezy — ale ne v rámci jedné aktivní session bez focus změny. gcTime 5 min drží unmounted záznamy (relevantní pro DEL/orphan).
7. **VERIFY zbylo:** M-REC globální skript (orphan/dead), BE `user:{id}` auto-join po reconnectu, `usePinnedChannels` BE persist, cross-device theme sync požadavek, `refetchOnWindowFocus` per-query override.
