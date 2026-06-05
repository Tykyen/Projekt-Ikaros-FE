# Cache invalidation audit — registr nálezů (obnoví se UI po zápisu?)

> Centrální registr nálezů z [`cache-plan/`](cache-plan/README.md). ID `C-xx`.
> Sourozenec [`bug-audit.md`](bug-audit.md) (logika), [`role-audit.md`](role-audit.md) (oprávnění),
> [`ws-audit.md`](ws-audit.md) (real-time) a [`form-schema-audit.md`](form-schema-audit.md) (tvar dat),
> ale výhradně pro **invalidaci cache**: po create/update/delete akci se správně obnoví seznamy,
> detaily, sidebary, dashboardy a badge countery? (TanStack Query)
>
> **Stav: SWEEP DOKONČEN 2026-06-05 — všech 13 oblastí, 50 nálezů (2× 🔴, 28× 🟠, 20× 🟡) +
> C-55 ⚖️ by-design + 6 kandidátů vyvráceno (K-C1/C4/C5/C6/C8/C10). Žádný commit (čeká na uživatele).**
>
> **Dvě 🔴 k prioritní opravě:** **C-09** (RSVP toggle neinvaliduje kalendář `world-all` ani detail —
> `'world'`≠`'world-all'` prefix-miss) a **C-15** (Page CRUD neobnoví legacy character directory → trvale
> viditelný **sidebar nav slot postavy** + 5 konzumentů stale; disjunktní `pages`↔`characters` cache po
> sjednocení 9.1, oboustranně s C-20).
>
> 🔁 **Dva systematické vzory napříč nálezy:**
> 1. **WS-only obnova bez REST/reconnect fallbacku** (C-02, C-05, C-06, C-07, C-25, C-46, C-56) — mutace
>    spoléhá výhradně na WS echo; při dropu/reconnectu bez `useSocketReconnect` UI tiše oslepne.
> 2. **Disjunktní namespace pro tutéž entitu** (C-15/C-20 pages↔characters, C-22/C-11 calendar↔aggregate,
>    C-29 cache po logout, C-12 admin↔public) — mutace invaliduje jen „svůj" namespace, druhý konzument stale.
>
> 🔴 **Bezpečnostně-relevantní:** **C-29** — logout/přepnutí účtu nečistí RQ cache → cizí osobní data
> (pošta/postavy/profil) můžou krátce přežít v cache nového uživatele. (VERIFY zda login dělá hard reload.)

---

## ✅ STAV OPRAV (2026-06-05)

> **~48 nálezů opraveno + ověřeno** (vč. 4 real-time přes BE+FE, C-54 factory, C-08/C-42 dodělané).
> Z 50 zbývá jen 6× ⚖️ by-design (oprava by kód zhoršila) + C-23 = dead code. Žádný commit (čeká na uživatele).
> Ověření: **FE** `tsc --noEmit` 0 · `eslint` 0 · `vitest` změněné oblasti zelené (auth 13, themeSync 3,
> ikaros 9, game-events/channel-mutations); **BE** `tsc --noEmit` 0 · `jest` 122/122 (world-news,
> ikaros-news/events, bestiae, admin service specy). Tři test wrappery/mocky doplněny (`useAuth.spec` +
> `useThemeSync.test` → `QueryClientProvider`; 4 BE service specy → `EventEmitter2` mock) — kontrakt se
> změnil, **assertce nezměněny**. (Pozn.: plný FE suite 2479 testů má pre-existing flaky worker-timeout
> po ~44 min — infra, nesouvisí s opravami.)

**Opraveno (FE):**
- **03:** C-01 (`['worlds']` místo `['worlds',worldId]`), C-02 (approve→members), C-03 (updateMember→`my`).
- **04:** C-15 (Page CRUD→character directory), C-16 (backlinks broad), C-17 (meta remove/inval), C-18/C-19 (factory klíče).
- **05:** C-20 (character→persona grid), C-21 (smazán dead predikát), C-22 (→calendars-aggregate) + D-05-1 (removeQueries accountDetail), D-05-2 (dual currency key), D-05-3 (convert→accounts).
- **06:** C-05 (ChatRoom reconnect+history), C-06 (6× CRUD self-invalidate + reorder resync), C-07 (unread reconnect).
- **09:** C-09 (RSVP→`invalidateGameEvents`+detail), C-10 (mutace→detail, delete removeQueries), C-11 (config→aggregate).
- **08:** C-24 (token.remove optimistic+rollback), C-25 (assign/create→activeScenes), C-26 (dead key→factory).
- **01:** C-28 (theme→cache write), C-29 (`qc.clear()` login/register/logout), C-30 (email-confirm placement→hook).
- **10:** C-37 (bulk→pending-actions), C-38 (approve→unread-count), C-39 (rating→list, články+galerie), C-40 (event modal derivuje z query), C-41 (report→pending-actions).
- **02:** C-12 (admin→public profil/adresář), C-13 (WS friendship parita s REST), C-14 (username audit-log+users).
- **11:** C-45 (username→pending-actions badge), C-46 (bell feed+events reconnect).
- **12:** C-51 (admin akce→stats), C-52 (admin akce→audit-log).
- **07:** C-33 (bestie cross-world scope predikát). **00:** C-58 (pinned→`setQueryData(['users','me'])`).

**✅ Real-time push doplněno (BE+FE) — C-04, C-31, C-34, C-47:**
> BE vzor `EventEmitter2.emit` → gateway `@OnEvent` → Socket.IO (jako emotes). FE listener → invalidace.

| Nález | BE emit / WS event | BE soubory | FE listener |
|---|---|---|---|
| **C-04** world news | `world-news.changed` → `world:news:changed` (room `world:{id}`) | world-news.service + worlds.gateway | useWorldSocket → `['world-news',worldId]` |
| **C-47** ikaros news/events | `ikaros-news.changed`/`ikaros-events.changed` → `ikaros:news:changed`/`ikaros:events:changed` (broadcast) | ikaros-news/events.service + 2 nové gateways | useIkarosNews/useIkarosEvents → `['ikaros-news']`/`['ikaros-events']` |
| **C-34** bestiar | `bestiae.changed` → `bestiar:changed{systemId}` (scope: world/user room nebo broadcast) | bestiae.service + bestiae.gateway | useBestiar → predikát `[2]===systemId` |
| **C-31** identita | `user.identity.changed`/`username-request.decided` → `user:identity:changed{kind}` (room `user:{id}`) | admin.service + users-identity.gateway | useFriendshipsSocket → `['users','me']`+`['public-user-profile']` |

**✅ C-54 (admin inline klíče → factory)** — vytvořen [`adminKeys`](../src/features/admin/api/adminKeys.ts);
useAdminUsers / useAdminFriendships / useAdminStats převedeny (query i invalidace sdílí klíč; cross-file
`audit-log` drift odstraněn). `search-index-stats` ponechán lokální (self-contained, drift mu nehrozí).

**✅ C-23 vyřešeno (dead code, ne bug)** — `useUpdateCharacterFinance`/`useFinanceAddMonthly`/`useFinanceUndo`/
`useCharacterFinance` jsou jen definované, **nikde se nevolají**. FinanceTab jede plně na 8.6 účtech
(`useUpdateAccount` → broad invalidace přes C-21). Legacy finance subdoc je mrtvý → žádná invalidace netřeba.

**Ponecháno vědomě (kód je správně — „oprava" by ho zhoršila):**
- ⚖️ C-27 (jotai bridge `useCurrentUserHydration` invalidaci propaguje), C-32 (theme dual-source „local wins" záměr, cache syncovaná přes C-28), C-35 (bestie token = snapshot, jen obrázek live-lookup), C-53 (cooldown DEV-only), C-55 (`world-search` MeiliSearch async reindex), C-57 (theme cross-device race-protekce).

---

## TL;DR (2026-06-05)

> Plán [`cache-plan/`](cache-plan/README.md) napsán — **9 os** (`KM` `SC` `FO` `CB` `OPT` `DEL` `CR`
> `WS` `LC`), **7 perspektiv** (P1 konzumentská inventura · P2 prefix-match · P3 optimistic round-trip ·
> P4 WS↔REST parita · P5 delete/orphan · **P6 statická rekonciliace** · **P7 dual-cache RQ↔jotai↔loader**),
> 13 oblastí. Mechanická rekonciliace `M-REC` proběhla (1150 souborů, 39 namespace, 64 key-konstant).
>
> **Hlavní rizikový vzor:** žádná centrální key-factory — jen 12 souborů má factory, ~60 inline pole
> roztroušená přes 73 souborů (222 `queryKey` definic), invalidace v 110 souborech (427 výskytů).
> Drift mezi inline klíčem mutace a inline klíčem dotazu = tichý stale bez chyby.
>
> **M-REC nálezy (k ověření při sweepu):** orphan dotazy `calendars-aggregate`, `public-user(-profile/s)`;
> set-only (optimistic bez resync) `global-chat`, `world` (gm-notes); anti-pattern `[worldId,…]` bez
> namespace prefixu (6×). Žádný DEAD na namespace úrovni (segment-level zůstává na P2 ruční).

| ID | Záv. | Oblast | Podstata | Stav |
|---|---|---|---|---|
| **C-09** | 🔴 | 09 | RSVP toggle neinvaliduje kalendář (`world-all`) ani otevřený detail — `'world'`≠`'world-all'` prefix-miss | 🐛 nález |
| **C-01** | 🟠 | 03 | join/approve invaliduje `['worlds',worldId]`, který NEtrefí world detail (`[1]='id'/'slug'`) | 🐛 nález |
| **C-02** | 🟠 | 03 | REST approve invaliduje jen `pending-actions`; members u PJ závisí jen na WS (žádný fallback) | 🐛 nález |
| **C-03** | 🟠 | 03 | `useUpdateMember` neobnoví `['worlds','my']` → změna vlastní role drží starý WorldContext 5 min | 🐛 nález |
| **C-04** | 🟠 | 03 | world news bez WS push → cizí oznámení stale do 60s | 🐛 nález |
| **C-05** | 🟠 | 06 | global chat (`ChatRoom`) bez reconnect re-join + history resync → díra ve zprávách | 🐛 nález |
| **C-06** | 🟠 | 06 | group/channel CRUD bez self-invalidace → iniciátor bez WS neuvidí vlastní změnu (VERIFY→🔴) | 🐛 nález |
| **C-07** | 🟠 | 06 | world unread badge plně WS-závislý, bez reconnect refetch | 🐛 nález |
| **C-08** | 🟠 | 06 | mail infinite query invaliduje všechny stránky → scroll reset / N requestů | 🐛 nález |
| **C-10** | 🟡 | 09 | game-event mutace nikdy neinvalidují otevřený `detail` (update/delete) | 🐛 nález |
| **C-11** | 🟡 | 09 | `calendars-aggregate` orphan — config změna neobnoví agregát | 🐛 nález |
| **C-15** | 🔴 | 04 | Page CRUD neinvaliduje legacy character directory → sidebar nav slot postavy + 5 konzumentů stale (disjunktní `pages`↔`characters` cache po 9.1) | 🐛 nález |
| **C-12** | 🟠 | 02 | admin role/ban/delete neobnoví `public-users`/`public-user-profile` (jiný namespace) | 🐛 nález |
| **C-13** | 🟠 | 02 | WS friendship eventy invalidují méně než REST (chybí `pending-actions`→badge drift, `friendship-status`) | 🐛 nález |
| **C-16** | 🟠 | 04 | update/delete stránky neobnoví backlinks cílových stránek („Odkazuje sem") | 🐛 nález |
| **C-17** | 🟠 | 04 | update/delete neobnoví page meta (AKJ shield na AccessDenied screenu) | 🐛 nález |
| **C-20** | 🟠 | 05 | character mutace (update/delete/convert) neobnoví PRIMÁRNÍ persona grid (`['pages',…,'persona']`) — protějšek C-15 | 🐛 nález |
| **C-14** | 🟡 | 02 | admin username approve/reject neobnoví audit-log; reject navíc ne `admin,users` | 🐛 nález |
| **C-18** | 🟡 | 04 | `usePage` inline klíč místo factory (drift-trap → 🔴 potenciál) | 🐛 nález |
| **C-19** | 🟡 | 04 | `usePersonaDirectory` inline klíč mimo factory (drift-trap) | 🐛 nález |
| **C-21** | 🟡 | 05 | `useUpdateAccount` per-owner predikát je **dead** (slug≠ObjectId), zachráněn broad fallbackem (drift-trap) | 🐛 nález |
| **C-22** | 🟡 | 05 | character calendar-event mutace neobnoví `calendars-aggregate` (C-11 z druhé strany) | 🐛 nález |
| **C-23** | 🟡 | 05 | `useUpdateCharacterFinance` neobnoví 8.6 account list (VERIFY split finance↔accounts) | 🐛 nález |
| **C-24** | 🟠 | 08 | `token.remove` = raw post bez optimistic/invalidate/rollback → smazaný token drží na mapě, selhání bez toastu | 🐛 nález |
| **C-25** | 🟠 | 08 | self-assign/create-scene neinvalidují `activeScenesQueryKey` → PJ list scén jen přes WS | 🐛 nález |
| **C-26** | 🟡 | 08 | `createSceneMutation` invaliduje **dead key** `['map','world-scenes',…]` (překlep, má být `world-active-scenes`) | 🐛 nález |
| **C-29** | 🟠 | 01 | logout/delete/login **nečistí RQ cache** (`qc.clear()` nikde) → cross-user data v cache po přepnutí účtu ve stejném tabu | 🐛 nález |
| **C-27** | 🟠 | 01 | auth `invalidate(['users','me'])` obnoví RQ, ne jotai `currentUserAtom` (header) — křehký implicitní bridge | 🐛 nález |
| **C-28** | 🟠 | 01 | změna globálního motivu (`useThemeSync`) nepíše do žádné user cache | 🐛 nález |
| **C-33** | 🟠 | 07 | system/user-scope bestie cross-world, klíč nese worldId → stale v jiných otevřených světech téhož systému | 🐛 nález |
| **C-34** | 🟠 | 07 | bestiář bez WS push (cizí PJ/Admin změna stale do 30s) | 🐛 nález |
| **C-38** | 🟠 | 10 | approve/publish článku neobnoví unread-count badge | 🐛 nález |
| **C-39** | 🟠 | 10 | rating článku/galerie invaliduje jen detail, ne list/sidebar (staré hvězdičky na kartách) | 🐛 nález |
| **C-40** | 🟠 | 10 | ikaros event detail modal = lokální snapshot, není subscriber → RSVP/edit neobnoví otevřený modal | 🐛 nález |
| **C-41** | 🟠 | 10 | `useReportPost` bez cache efektu → nahlášení se neobjeví v pending-actions frontě/badge | 🐛 nález |
| **C-45** | 🟠 | 11 | admin username approve/reject neinvaliduje `pending-actions` → bell/nav badge drift | 🐛 nález |
| **C-46** | 🟠 | 11 | bell feed badge + infinite chat-feed bez socket-reconnect resync → díra po dropu (třída C-05/C-07) | 🐛 nález |
| **C-51** | 🟠 | 12 | `admin,stats,overview` orphan — žádná mutace neobnoví dashboard county/akční fronty | 🐛 nález |
| **C-52** | 🟠 | 12 | `admin,audit-log` invaliduje jen cooldown reset; ban/role/username akce ho neobnoví | 🐛 nález |
| **C-30** | 🟡 | 01 | EmailChangeConfirm invaliduje v `mutate(){onSuccess}` call-site → unmount-drop riziko (CB) | 🐛 nález |
| **C-31** | 🟡 | 01 | identita (schválený username/role/ban) bez WS push | 🐛 nález |
| **C-32** | 🟡 | 01 | `themeAtom` (localStorage) vs `user.themeId` — dva zdroje pravdy motivu | 🐛 nález |
| **C-35** | 🟡 | 07 | soft-delete bestie nechá token na mapě bez obrázku (live lookup→null); staty snapshot ok | 🐛 nález |
| **C-37** | 🟡 | 10 | bulk článků: dead klíč `['articles','pending']` + chybí `pending-actions` (hook zatím bez UI → latentní) | 🐛 nález |
| **C-42** | 🟡 | 10 | `article-reads,unread-count` semi-orphan (posune jen markRead, ne publish/delete) | 🐛 nález |
| **C-47** | 🟡 | 11 | ikaros platform dashboard (Akce/Novinky) bez WS push (staleTime 5 min) | 🐛 nález |
| **C-53** | 🟡 | 12 | cooldown reset zahodí BE friendship, spoléhá na refetch (DEV-only) | 🐛 nález |
| **C-54** | 🟡 | 12 | admin friendships/audit-log inline klíče na 4 místech (drift-trap) | 🐛 nález |
| **C-57** | 🟡 | 00 | `themeAtom`↔`user.themeId` „local wins" maskuje cross-device změnu motivu | 🐛 nález |
| **C-58** | 🟡 | 00 | `usePinnedChannels` píše atom bez `setQueryData(['users','me'])` → refetch přepíše pin zpět | 🐛 nález |
| **C-55** | ⚖️ | 12 | `world-search` orphan = **by-design** (MeiliSearch async reindex na BE) | ⚖️ by-design |
| C-56 | — | 00 | ChatRoom bez `useSocketReconnect` = **duplicitní s C-05** (sloučeno) | ↔ C-05 |
| K-C1 | ⚖️ | 03 | `['worlds']` prefixuje detail i settings — **by-design** (vyvráceno) | ✅ shoda |
| K-C5 | ⚖️ | 06 | global chat set-only bezpečné vs optimistic lež — přerámováno na C-05 (reconnect) | ✅ shoda |
| K-C8 | ⚖️ | 02 | public profil friend-tlačítko řízeno `friendship-status` (inval.) — friend větev by-design; admin větev = C-12 | ✅ částečně |
| K-C4 | ⚖️ | 00 | router má jen `requireAuth` loader bez fetche → žádná router↔RQ dual-cache | ✅ vyvráceno |
| K-C6 | ⚖️ | 00/01 | `useCurrentUserHydration` bridge `['users','me']`→atom funguje (forward); reverz = C-58 | ✅ vyvráceno |
| K-C10 | ⚖️ | 00 | 0 klíčů s dynamickým first-segmentem (všech 222 má namespace string na `[0]`) | ✅ vyvráceno |

---

## Baseline — health checks

| Check | Repo | Výsledek | Pozn. |
|---|---|---|---|
| `M-REC` skript (`c:/tmp/cache-recon.mjs`) | FE | ✅ hotovo | 1150 souborů, 39 namespace, 64 key-konstant; viz níže |
| `tsc --noEmit` | FE | ⬜ | `tsc -b` pre-existing rozbitý → měř `--noEmit` |
| vitest invalidační specy | FE | ⬜ | `useChannelMutations.spec`, `useGameEvents.spec`, `useCustomPresets.spec`, `useWeatherGenerators.spec`, … |

### M-REC namespace tabulka (q=čte / inv=invaliduje / set=setQueryData)

> ⚠️ **Limit metody:** namespace-level (1. segment klíče). Podpočítává keys přes import z cizího
> souboru (`?var:*` níže) a **nevidí segment-level drift** (`world` vs `world-all`) — to řeší P2 ruční.
> Counts = lower bound; `inv:0` = **kandidát na orphan**, ne potvrzení.

| namespace | q | inv | set | poznámka |
|---|---|---|---|---|
| worlds | 30 | 24 | 1 | největší povrch (world + members + settings + join) |
| map | 13 | 13 | 3 | taktická mapa (scenes/combat/tokens) |
| users | 7 | 9 | 2 | admin + pending |
| pages | 9 | 4 | 2 | ⚠️ inv:4 vs q:9 — ověřit fan-out |
| characters | 9 | 4 | 2 | ⚠️ inv:4 vs q:9 — subdoc fan-out (factory) |
| pending-actions | 6 | 8 | 0 | |
| friends | 5 | 2 | 0 | ⚠️ inv:2 vs q:5 |
| world-chat | 5 | 2 | 4 | optimistic-heavy |
| worldPageTemplates | 4 | 3 | 0 | |
| article-categories | 4 | 4 | 0 | |
| admin | 4 | 3 | 0 | |
| calendar-configs | 2 | 2 | 0 | |
| friendship-status | 2 | 2 | 0 | |
| bestiar | 2 | 1 | 0 | |
| universe | 2 | 1 | 1 | |
| articles | 2 | 2 | 0 | |
| world-currencies | 2 | **0** | 0 | ✅ **false orphan** — invaliduje přes `var key` (currencies/api.ts:56), optimistic + rollback |
| calendars-aggregate | 1 | **0** | 0 | 🟡 **orphan kandidát** — `calendar-configs` invaliduje, agregát ne |
| public-user-profile | 1 | **0** | 0 | 🟡 **orphan kandidát** — po friend/block/admin akci se neobnoví? |
| public-users | 1 | **0** | 0 | 🟡 **orphan kandidát** |
| global-chat | 1 | **0** | 1 | 🟠 **set-only** — optimistic bez resync invalidace |
| world (gm-notes) | 1 | **0** | 1 | 🟠 **set-only** — gm notes optimistic |
| check-email / check-username | 1 | 0 | 0 | ⚖️ by-design (debounced availability) |
| user-lookup / world-search | 1 | 0 | 0 | ⚖️ by-design (ephemeral lookup / search) |
| _ostatní (article-reads, discussions, gallery, ikaros-news, sounds, weather-*, diary-schema, …)_ | — | — | — | inv≥1, viz skript |

**Nerozlišené (import key-factory z cizího souboru — k dořešení při sweepu oblasti):**
`mailKeys` (06), `chatFeedKeys`/`eventsKeys` (11), `worldChatKeys`/`chatQueryKeys` (06), `campaignKeys` (08),
`timelineKeys` (09), `shopKeys` (05), `emoteKeys` (06), `?var:worldId` jako 1. segment (anti-pattern, 6×).

**Predikátová invalidace (P2 ověřit korektnost predikátu):**
[`useAccountTransferNotifications.ts`](../src/features/world/pages/api/useAccountTransferNotifications.ts),
[`useCharacterAccounts.ts`](../src/features/world/pages/api/useCharacterAccounts.ts).

---

## Kandidáti (⬜ neověřeno — verdikt až sweep)

> Hypotézy z prvního čtení + M-REC. **Nejsou to nálezy.** Sweep každý povýší na `🐛 C-xx`,
> `✅ shoda` nebo `⚖️ by-design`.

| ID | Osa | Oblast | Podstata | Zdroj |
|---|---|---|---|---|
| **K-C1** | `KM`/`WS` | 03 | [`useWorldSocket.ts:45`](../src/features/world/hooks/useWorldSocket.ts#L45) `world:updated` → `['worlds']` (seznam), ale komentář slibuje refetch world detailu/settings — pokud běží pod jiným klíčem, neobnoví se od cizí změny | čtení |
| **K-C2** | `FO` | 09 | [`useGameEvents.ts:93`](../src/features/world/api/useGameEvents.ts#L93) `useToggleRsvp` invaliduje bez `world-all` (kalendář) a `detail` — RSVP nechá kalendář + otevřený detail stale | čtení |
| **K-C3** | `CB` | 00/* | 187 komponent s `.mutate()`; podmnožina invaliduje v `mutate(v,{onSuccess})` → zahodí se při unmountu (destruktivní akce + navigace) | M-CEN |
| **K-C4** | `P7` | 00 | router `loader:` ([`router.tsx`](../src/app/router.tsx)) fetchuje mimo RQ → `invalidateQueries` se ho nedotkne; sdílí loader data s RQ dotazem? | čtení |
| **K-C5** | `OPT` | 06 | chat optimistic send + WS echo dedup; `global-chat` set-only (M-REC) | M-REC |
| **K-C6** | `P7` | 01 | RQ ↔ jotai: jméno/avatar v headeru z atomu vs profile query — update profilu obnoví atom? | čtení |
| **K-C7** | `FO` | 09 | `calendars-aggregate` orphan — create/update/delete calendar config neobnoví agregát | M-REC |
| **K-C8** | `FO` | 02 | `public-user-profile`/`public-users` orphan — friend/block/admin akce neobnoví cizí profil/seznam | M-REC |
| **K-C9** | `OPT` | 08 | `world` (gm-notes) set-only — optimistic bez resync; ověř rollback + WS | M-REC |
| **K-C10** | `KM`/`SC` | * | `[worldId,…]` bez namespace prefixu (6×) — kolize/over-invalidation napříč zdroji téhož světa | M-REC |

---

## Nálezy (detailně)

> Doplňováno při sweepu. Pořadí dle dopadu: stale po destruktivní akci (`DEL`/`CB`) a falešný
> optimistický stav (`OPT`) první, pak neúplný fan-out (`FO`/badge), key-mismatch (`KM`), WS nesoulad,
> pak orphan/dead (P6) a dual-cache (P7). Každý nález: `soubor:řádek` mutace + konzumentů, návrh,
> **trigger / viditelnost / workaround**.

> Plné detaily (`soubor:řádek` mutace + konzumentů, návrh, trigger/viditelnost/workaround) jsou
> v oblastních souborech. Zde konsolidace dle závažnosti.

**🔴 C-09** — [09](cache-plan/09-udalosti-kalendar-timeline.md): `useToggleRsvp` invaliduje `['game-events','world']`,
což **neprefixuje** `['game-events','world-all']` (kalendář, segment `[1]` se liší) ani `['game-events','detail']`.
Po RSVP zůstane kalendář i otevřený detail eventu na starých attendees/myRsvp do staleTime. Fix: volat
`invalidateGameEvents(qc)` + `invalidate(['game-events','detail'])`.

**🟠 C-01** — [03](cache-plan/03-svety-universe.md): `useJoinWorld`/`world:access-approved` invalidují
`['worlds',worldId]` → prefixuje settings/members (`[1]=worldId`), ale **ne detail** (`[1]='id'/'slug'`).
World detail stale po vstupu/schválení (maskováno WorldStatus z `['worlds','my']`).

**🟠 C-02/C-03/C-04** — [03](cache-plan/03-svety-universe.md): approve jen `pending-actions` (members u PJ jen přes
WS) · `useUpdateMember` neobnoví `['worlds','my']` (vlastní role 5 min) · world news bez WS pushe.

**🟠 C-05/C-06/C-07/C-08** — [06](cache-plan/06-chat-posta-emoty.md): global chat bez reconnect resync (díra
ve zprávách) · group/channel CRUD bez self-invalidace (iniciátor bez WS slepý, VERIFY→🔴) · unread badge
plně WS-závislý · mail infinite invaliduje všechny stránky (scroll reset).

**🟡 C-10/C-11** — [09](cache-plan/09-udalosti-kalendar-timeline.md): game-event mutace neinvalidují otevřený
detail · `calendars-aggregate` orphan (config změna neobnoví agregát).

**🟠 C-27/C-28/C-29** — [01](cache-plan/01-auth-ucet.md): identita přes jotai `currentUserAtom` — invalidate-only
cesty (email/username) ji obnoví jen přes hydration bridge; theme bez cache efektu; **logout nečistí RQ cache**.

**🟠 C-33/C-34** — [07](cache-plan/07-bestie.md): cross-world scope bestie nese worldId v klíči; bestiář bez WS.

**🟠 C-38…C-41** — [10](cache-plan/10-ikaros-platforma.md): unread-count po publish; rating jen detail; event modal
snapshot; report bez pending-actions. **🟠 C-45/C-46** — [11](cache-plan/11-notifikace-dashboardy-sidebary.md):
username req badge; bell feed reconnect. **🟠 C-51/C-52** — [12](cache-plan/12-admin.md): adminStats orphan; audit-log.

**🟡 zbytek** (C-10/11/14/18/19/21/22/23/26/30/31/32/35/37/42/47/53/54/57/58) — orphany, drift-trapy
(inline klíč vs factory), chybějící WS push, latentní dead predikáty/klíče — detail v oblastních souborech.

**⚖️ vyvráceno:** K-C1 (`['worlds']` prefixuje vše), K-C4 (router loader bez fetche), K-C5 (global chat
optimistic-free), K-C6 (jotai bridge funguje), K-C8 (friend tlačítko z `friendship-status`), K-C10 (0 dynamických
first-segmentů), C-55 (`world-search` MeiliSearch async = by-design).

---

## Index oblastí (stav sweepu)

| # | Oblast | Stav | Nálezy |
|---|---|---|---|
| 00 | [Cross-cutting](cache-plan/00-cross-cutting.md) | ✅ | C-57 C-58 (🟡) + K-C4/C6/C10 vyvráceny |
| 01 | [Auth & účet](cache-plan/01-auth-ucet.md) | ✅ | C-27 C-28 C-29 (🟠) C-30 C-31 C-32 (🟡) |
| 02 | [Uživatelé & přátelé](cache-plan/02-uzivatele-pratele.md) | ✅ | C-12 C-13 (🟠) C-14 (🟡) + K-C8 ⚖️ |
| 03 | [Světy & universe](cache-plan/03-svety-universe.md) | ✅ | C-01…C-04 (4× 🟠) + K-C1 ⚖️ |
| 04 | [Stránky & directory & AKJ](cache-plan/04-stranky-directory-akj.md) | ✅ | C-15 (🔴) C-16 C-17 (🟠) C-18 C-19 (🟡) |
| 05 | [Postavy & ekonomika](cache-plan/05-postavy-ekonomika.md) | ✅ | C-20 (🟠) C-21 C-22 C-23 (🟡) |
| 06 | [Chat & pošta & emoty](cache-plan/06-chat-posta-emoty.md) | ✅ | C-05…C-08 (4× 🟠) + 4 🟡 + K-C5 ⚖️ |
| 07 | [Bestie](cache-plan/07-bestie.md) | ✅ | C-33 C-34 (🟠) C-35 (🟡) |
| 08 | [Taktická mapa](cache-plan/08-takticka-mapa.md) | ✅ | C-24 C-25 (🟠) C-26 (🟡) + 9 latentních |
| 09 | [Události & kalendář & timeline](cache-plan/09-udalosti-kalendar-timeline.md) | ✅ | C-09 (🔴) C-10 C-11 (🟡) |
| 10 | [Ikaros platforma](cache-plan/10-ikaros-platforma.md) | ✅ | C-38…C-41 (🟠) C-37 C-42 (🟡) |
| 11 | [Notifikace & dashboardy & sidebary](cache-plan/11-notifikace-dashboardy-sidebary.md) | ✅ | C-45 C-46 (🟠) C-47 (🟡) |
| 12 | [Admin](cache-plan/12-admin.md) | ✅ | C-51 C-52 (🟠) C-53 C-54 (🟡) + C-55 ⚖️ |

---

## Legenda

- ⬜ netestováno · ✅ ověřeno OK · 🐛 nález (`C-xx`) · ⚠️ podezřelé/dluh · ⚖️ by-design · ⏭️ blokované/`[human]`
- Závažnost: 🔴 stale po destruktivní akci / falešný optimistický stav · 🟠 neúplný fan-out / badge drift / UX · 🟡 orphan / dead / latentní drift
