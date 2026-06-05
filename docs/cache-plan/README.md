# Cache invalidation plán — obnoví se UI po zápisu? (TanStack Query)

> **Účel:** systematicky projít **každou mutaci** Ikara (create / update / delete / akce) a ověřit,
> že po jejím úspěchu se **správně obnoví všechny konzumenti** dotčeného zdroje — **seznamy, detaily,
> sidebary, dashboardy, badge countery**. Cílová otázka u každé mutace:
> „když tohle uložím, uvidí uživatel čerstvý stav **všude**, kde se zobrazuje — bez ručního F5?"
>
> Pátý sourozenec [`bug-plan/`](../bug-plan/README.md) (REST/logika),
> [`ws-contract-plan/`](../ws-contract-plan/README.md) (real-time kontrakt),
> [`role-plan/`](../role-plan/README.md) (oprávnění) a
> [`form-schema-plan/`](../form-schema-plan/README.md) (tvar dat). Tenhle plán testuje výhradně
> **invalidaci cache**: orthogonální vrstvu, kterou žádný z předchozích neprochází.
>
> **Stav:** zahájeno 2026-06-05. Nálezy → [`../cache-audit.md`](../cache-audit.md) (ID `C-xx`).

---

## Proč samostatný plán (co bug/role/ws/form-schema i `audit:routes` míjejí)

`npm run audit:routes` páruje jen **existenci** FE volání ↔ BE endpointu. Bug-plan řešil logiku
requestu, role oprávnění, ws real-time kontrakt, form-schema tvar pole. **Ani jeden neověřuje, jestli
se po zápisu obnoví cache na klientu.** Request může projít (200), data se uložit správně (form-schema
OK), oprávnění sedět (role OK) — a uživatel přesto vidí **starý stav**, protože FE neinvalidoval
správný `queryKey`. To je samostatná třída chyb, neviditelná pro všechny předchozí audity.

| Slepá skvrna | Příklad reálného rizika | Dopad |
|---|---|---|
| **Key-mismatch** — invalidační klíč neprefixuje klíč dotazu | mutace volá `invalidate(['worlds'])`, detail běží pod `['world',id]` → **detail se nikdy neobnoví** | 🔴 trvale stale UI |
| **Neúplný fan-out** — invaliduje se seznam, ale ne detail/sidebar/dashboard | RSVP toggle obnoví seznam akcí, ale kalendář + otevřený detail zůstanou stale | 🟠 nekonzistentní UI |
| **Badge/counter drift** — počítadlo z jiného endpointu se neinvaliduje vedle seznamu | přečtu zprávu → seznam se obnoví, **odznak „N nepřečtených" v sidebaru drží číslo** | 🟠 matoucí |
| **Unmount-drop** — invalidace v `mutate(v,{onSuccess})` se zahodí, když komponenta odejde | smaž → naviguj pryč → invalidace seznamu se nikdy nespustí → návrat ukáže smazaný záznam | 🔴 stale po destruktivní akci |
| **Delete→404 refetch** — `invalidate` (ne `remove`) detailu po smazání | po delete se detail **refetchne → 404 → error UI flash** místo čistého odchodu | 🟠 UX |
| **Optimistic bez rollbacku** — `setQueryData` bez `onError` restore | akce selže (409/500) → cache drží **optimistickou lež**, server má jinou pravdu | 🔴 falešný stav |
| **Orphan dotaz** — query klíč, který neinvaliduje žádná mutace | data se obnoví **jen po 30s staleTime nebo F5** → uživatel chvíli vidí staré | 🟡 zpožděný stale |
| **Dead invalidace** — invalidační klíč netrefí žádný dotaz | refactor přejmenoval klíč, invalidace zůstala → **invaliduje do prázdna** | 🟡 latentní (= chybějící obnova) |
| **Dual-cache** — týž fakt v RQ **i** jotai atomu / router loaderu | update profilu obnoví query, ale **jméno v headeru (atom) drží staré** | 🟠 nekonzistence napříč store |
| **WS vs REST nesoulad** — real-time event invaliduje jinou množinu než REST mutace | změna od jiného PJ obnoví míň než vlastní akce → záleží, kdo to udělal | 🟠 |

> 💡 **Závěr:** zelený `audit:routes` + zelený form-schema = „request projde a uloží se správně".
> Neříká **nic** o tom, jestli se výsledek objeví na obrazovce. Tenhle plán tlačí kontrolu na
> **konzumentskou stranu cache**: po každém zápisu projít *všechny* mounty, které ten zdroj čtou.

---

## Cache architektura Ikara (kde žije pravda)

| Vrstva | Nástroj | Kde | Role |
|---|---|---|---|
| **REST cache** | TanStack Query v5 | `useQuery`/`useMutation` ve `features/**/api/*.ts` | hlavní zdroj serverového stavu |
| **Query key** | inline pole **nebo** factory | `['ns', id, ...]` inline (~60 souborů) · `*QueryKey.method()` factory (12 souborů) | identita cache záznamu |
| **Real-time invalidace** | Socket.IO → `qc.invalidateQueries` | `useWorldSocket`, `useUniverseSocket`, `useFriendshipsSocket`, … | push obnova z jiného klienta |
| **Optimistic write** | `setQueryData` (+ rollback) | chat send, token update, … | okamžitá odezva před serverem |
| **Klientský stav** | jotai atomy | `authStore` (`accessTokenAtom`, current user), … | mirror části serverového stavu |
| **Router cache** | react-router `loader:` | [`app/router.tsx`](../../src/app/router.tsx) | data fetchovaná **mimo** RQ |

> ⚠️ **Globální config** ([`main.tsx`](../../src/app/main.tsx)): `staleTime: 30_000`, `retry: 1`,
> **žádný `gcTime` override** (default 5 min). Jednotlivé dotazy si staleTime přepisují (10s–60s).
> `staleTime` neřeší invalidaci — jen jak rychle *spontánně* zastarají; invalidace je **explicitní**.

📚 **Klíčová mechanika (TanStack):** `invalidateQueries({ queryKey })` defaultně **prefix-matchuje** —
porovnává pole **prvek po prvku deep-equality**, ne jako řetězec. `['game-events','world']` proto trefí
`['game-events','world',worldId,limit]`, ale **netrefí** `['game-events','world-all',…]` (prvek `[1]`
se liší). Defaultně se refetchnou **jen aktivní (mounted) dotazy**; neaktivní se jen označí stale a
refetchnou se až při příštím mountu. To je obvykle správně, ale u `enabled:false` / role-gated dotazů
se nerefetchne **nic**, dokud `enabled` nepřeskočí na true.

---

## Kontrolní osy (9)

Každá mutace / dotaz se prověřuje podél jedné/více os. U bodu se uvádí osa.

| Osa | Zkr | Otázka | Jak ověřit |
|---|---|---|---|
| **Key-match** | `KM` | Prefixuje invalidační klíč **fakticky** klíč dotazu? | element-po-elementu; singular/plural, segment navíc, překlep, `'x'` vs `'x-all'` |
| **Scope** | `SC` | Je ve klíči správné scope id (`worldId`/`slug`/`id`)? | neinvaliduje moc úzce (jiný scope drží stale) ani moc široko (cross-world / zbytečný refetch) |
| **Fan-out** | `FO` | Invaliduje mutace **všechny** konzumenty zdroje? | seznam + detail + sidebar + dashboard + **parent count/badge** |
| **Callback placement** | `CB` | Žije invalidace v `useMutation({onSuccess})` (přežije unmount) nebo v `mutate(v,{onSuccess})` (zahodí se)? | grep call-site callbacků; destruktivní akce + navigace |
| **Optimistic** | `OPT` | `setQueryData` tvar == `queryFn` tvar? je `onError` rollback (snapshot) + `onSettled` invalidate? | čtení optimistic bloku; error-path resync (409 `expectedUpdatedAt`) |
| **Delete** | `DEL` | Po DELETE `removeQueries(detail)` (ne `invalidate` → 404) + invalidate seznam + odchod z mrtvého detailu? | čtení delete mutace + navigace |
| **Create** | `CR` | Po CREATE se nový záznam dostane do správně **filtrovaného / řazeného / paginovaného / infinite** seznamu? | čtení create + cíl invalidace; `useInfiniteQuery` refetch-all vs append |
| **Real-time** | `WS` | WS-event invalidace pokrývá stejnou množinu jako REST mutace? reconnect re-fetch? | diff WS handleru vs REST `onSuccess`; cross-ref [`ws-audit`](../ws-audit.md) |
| **Lifecycle** | `LC` | `staleTime`/`gcTime` + `enabled`: invalidace označí stale, ale **refetchne se** (mounted / `refetchOnMount`)? orphan po unmountu? | čtení config dotazu + zda je mounted při akci |

`KM` je **nejhlubší osa pro úplnou ztrátu obnovy** (cache obdoba `WL` z form-schema: klíč se mine →
nic se neobnoví). `FO` hlídá **rozsah** obnovy (kolik konzumentů zapomnělo — obdoba `PC` z role-plánu:
„jedny dveře ze čtyř"). `CB` je **mechanika** (kde callback žije) — kolmá na to, *co* invaliduje.

> 💡 U `KM` si všímej **zdroje klíče**: inline pole vs factory. Factory (`charactersQueryKey.detail`)
> je odolná — query i invalidace volají tutéž funkci, drift nemožný. Inline pole na dvou místech =
> latentní drift (refactor jednoho zapomene druhý). Nález „klíče se dnes shodují, ale jsou to dvě
> inline kopie" = preventivní 🟡.

---

## Hloubkové perspektivy (7) — jak hluboko každou mutaci proklepnout

Osy říkají *co* hledat; perspektivy *jak hluboko*. Cílené na hot-spoty, každá vázaná na reálný vzor
z tohoto codebase, ne na teorii.

### P1 — Konzumentská inventura (osa `FO`/`KM`) — páteř auditu
Pro každý **zdroj** (entitu) napřed vypiš **všechny** `queryKey`, které ho čtou — rozdělené na role:
**seznam · detail · sidebar · dashboard widget · badge/counter · search index**. Teprve pak u **každé**
mutace ověř, že invaliduje jejich **průnik**. Vynechaný konzument = stale UI.
- Přímo odpovídá zadání (seznamy / detaily / sidebary / dashboardy).
- Hot-spot: cross-feature konzumenti — postava se čte v `characters` directory, v `members` sidebaru,
  ve world dashboardu (oblíbené), v presence panelu, na mapě (token). Jedna mutace, 5 konzumentů.

### P2 — Prefix-match korektnost (osa `KM`)
Ber invalidační klíč a klíč dotazu **vedle sebe**, porovnej **prvek po prvku**. Pasti:
- `['worlds']` vs `['world', id]` (plural/singular), `'world'` vs `'world-all'` (sufix).
- Segment navíc na straně dotazu, který invalidace nemá (OK — prefix), **vs naopak** (invalidace delší
  než dotaz → netrefí).
- Klíče s **objektem** (`['x', {worldId, filter}]`) — TanStack hashuje s **seřazenými klíči objektu**
  a vynechává `undefined`; ověř, že filtr-objekt nezpůsobí míč mimo.
- `predicate:` invalidace ([`useAccountTransferNotifications`](../../src/features/world/pages/api/useAccountTransferNotifications.ts), [`useCharacterAccounts`](../../src/features/world/pages/api/useCharacterAccounts.ts)) — predikát je **kód** → vlastní bug (špatný index `queryKey[0]`, chybí scope). `exact:true` / `refetchType` flagy.

### P3 — Optimistic round-trip (osa `OPT`)
U `setQueryData` / optimistických updatů ověř **celý cyklus**: `onMutate` (snapshot + optimistic set) →
`onError` (rollback na snapshot) → `onSettled` (invalidate = resync se serverem). Pasti:
- `setQueryData` zapíše **jiný tvar**, než vrací `queryFn` → po příštím refetch UI „skočí".
- **Žádný rollback** → selhání nechá optimistickou lež v cache.
- **Optimistic + WS echo:** pošlu zprávu optimisticky, WS echo přijde a invaliduje → refetch může
  optimistickou zprávu zdvojit/zablikat ([`useOptimisticSend`](../../src/features/world/chat/api/useOptimisticSend.ts)).
- **Error-path resync:** 409 `expectedUpdatedAt` (D-073) — `onError` musí invalidovat/refetchnout, ne
  jen toast, jinak cache drží předkonfliktní stav.

### P4 — WS vs REST parita (osa `WS`)
Pro každý zdroj s real-time eventem porovnej **množinu invalidací** WS handleru vs REST `onSuccess`.
WS by měl obnovit **aspoň tolik** co vlastní akce (změna od jiného klienta není „míň důležitá").
- [`useWorldSocket`](../../src/features/world/hooks/useWorldSocket.ts) `world:updated` → `['worlds']`
  (obnoví seznam — ale detail/settings?). Reconnect re-join + re-fetch (paměť: `useSocketReconnect`).
- Cross-world leak signál: `universe:updated` = signál `{worldId}` bez dat → klient refetchuje
  filtrovaný GET (paměť: `project_universe_ws_signal`). Cross-ref [`ws-audit.md`](../ws-audit.md).

### P5 — Delete/404 & orphan cache (osa `DEL`/`LC`)
- Po DELETE: `removeQueries(detail)` (ne `invalidate` — to by refetchlo 404) **+** invalidate seznam
  **+** navigace pryč z mrtvého detailu. Ověř pořadí (invalidate před navigací neuškodí; navigace bez
  remove nechá orphan).
- **Orphan po unmountu:** `gcTime` default 5 min — záznam přežívá; návrat do 5 min ukáže cache. Pokud
  ho mezitím nikdo neinvalidoval, je **stale** dokud staleTime/refetchOnMount nezaberou.
- `useInfiniteQuery` ([5×](../../src/features/ikaros/api/useMail.ts)) — delete prvku: invalidate
  refetchne **všechny stránky** (reset scrollu) vs cílený `setQueryData` removal.

### P6 — Statická rekonciliace klíčů (mechanická, metoda `M-REC`)
Globální párování **mimo** feature-řez: vyextrahuj **všechny** `queryKey:` literály (konzumenti) a
**všechny** invalidační/`setQueryData`/`removeQueries` literály (zapisovatelé), spáruj podle namespace
(prvního segmentu) + struktury:
- **Orphan dotaz** — namespace, který **čte** ≥1 dotaz, ale **neinvaliduje** žádná mutace → obnova jen
  staleTime/F5. (Někdy záměr — read-only referenční data; ověřit.)
- **Dead invalidace** — invalidační klíč, který **netrefí** žádný `queryKey` → překlep / refactor
  reziduum → invaliduje do prázdna = chybějící obnova.
> 💡 Tahle perspektiva je near-automatovatelná a chytá celou třídu systematicky — doplňuje čtenářské
> P1–P5 globálním pohledem, který feature-řez ze své podstaty nevidí.

### P7 — Dual-cache & cross-store (osa `WS`/`LC` + mimo RQ)
Kde stejný fakt žije ve **víc** cache, ověř, že write obnoví **všechny**:
- **RQ ↔ jotai atom:** current user (`authStore`) zrcadlí profil — update profilu invaliduje query,
  ale obnoví atom (jméno/avatar v headeru)?
- **RQ ↔ router loader:** [`router.tsx`](../../src/app/router.tsx) `loader:` fetchuje mimo RQ →
  `invalidateQueries` se ho **nedotkne**; obnoví ho jen router revalidace. Inventura: které routy mají
  loader a sdílí data s RQ dotazem?
- **RQ ↔ WS optimistic:** viz P3/P4.

### Dopad / závažnost (povinné u každého nálezu — server běží)
Ikaros **běží na serveru s reálnými uživateli**. U každého nálezu uveď **trigger** (jaká akce nechá co
stale), **viditelnost** (vidí uživatel chybu, nebo tiše starý stav?) a **workaround** (obnoví to F5?).
Stale po **destruktivní** akci (smazaný záznam stále v seznamu) a **falešný optimistický stav** (akce
selhala, UI tvrdí úspěch) jsou nejzávažnější — uživatel jedná podle lži.

---

## Inventura mutací (povrch auditu)

Mapováno průzkumem 2026-06-05 (čísla = „k ověření při exekuci").

- **TanStack:** `staleTime 30s` default, `retry 1`, gcTime default 5 min.
- **Invalidace/setQueryData:** **427 výskytů ve 110 souborech.** `queryKey:` definic: **222 ve 73 souborech.**
- **Call-sites mutací:** **425 `.mutate()`/`.mutateAsync()` ve 187 komponentách** (povrch osy `CB`).
- **Key factories:** 12 souborů (`charactersQueryKey`, `useMapScene`, `useBestiar`, `currencies`,
  `usePage`, `useFavoritePage`, `diarySchema`, `worldPageTemplates`, `useGlobalChat`, `useActiveScenes`,
  `useUniverse`, `characters.types`). Zbytek = inline pole (drift-prone).
- **Infinite queries:** 5 (`useMail`, `useChatFeed`, `useEvents`, `useTimelineEvents`, WeatherHistory).
- **Predikátová invalidace:** 2 (`useAccountTransferNotifications`, `useCharacterAccounts`).
- **WS invalidační hooky:** `useWorldSocket`, `useWorldAccessSocket`, `useUniverseSocket`,
  `useFriendshipsSocket`, `useReassignmentListener`, `useMapWeather`, `useChannelPresence`, …
- **Router loadery:** [`router.tsx`](../../src/app/router.tsx) (počet k ověření).

---

## Metody ověření (`[auto]`)

| Kód | Metoda | Nástroj |
|---|---|---|
| **M1** | Statické čtení — mutace `onSuccess` ↔ všechny matching `queryKey` vedle sebe | Read/Grep |
| **M2** | **Key-match simulace** — vezmi invalidační klíč, GREP všechny `queryKey` co prefixuje, porovnej s konzumenty z P1 | Grep |
| **M-REC** | **Statická rekonciliace** — extrakce všech query + invalidačních literálů, párování namespace → orphan + dead | skript (node) |
| **M-CEN** | **Mutation census** — každý `useMutation` má ≥1 cache efekt (`invalidate`/`setQueryData`/`remove`)? mutace bez efektu = kandidát | Grep |
| **M3** | Existující test — spustit relevantní vitest invalidační test (`useChannelMutations.spec`, `useGameEvents.spec`, …) | `vitest` |
| **M4** | **Runtime ověření** — proveď akci v appce, sleduj obnovu UI **bez reloadu** | skill `verify` / `run` |
| **M5** | **Invalidace test (vitest)** — mock mutation → spy na `invalidateQueries` klíč → assert pokrývá konzumenty | `vitest` |
| **M6** | Baseline — `tsc --noEmit`, vitest run, `audit:routes` | npm scripty |

## Úrovně jistoty (L1–L4)

| Úroveň | Co znamená | Důkaz |
|---|---|---|
| **L1** | přečteno (M1) — invalidace *vypadá* správně | nejslabší |
| **L2** | key-match ověřen (M2/M-REC) — klíč prokazatelně prefixuje konzumenty | strukturální |
| **L3** | existující test pokrývá invalidaci a je zelený (M3) | chování zajištěno |
| **L4** | **runtime (M4)** nebo **invalidace test (M5)** prokázal obnovu UI / pokrytí konzumentů | trvalá pojistka |

**Cíl:** běžné mutace na **L2+**; destruktivní akce (`DEL`/`CB`) a optimistické (`OPT`) na **L3+**;
kritické (stale po destruktivní akci, falešný optimistický stav) přes runtime **M4** na **L4**.

---

## Baseline — health checks

| Check | Repo | Stav | Pozn. |
|---|---|---|---|
| `tsc --noEmit` | FE | ⬜ ověřit | `tsc -b`/`build` pre-existing rozbitý (paměť) → měř `--noEmit` |
| vitest (invalidační specy) | FE | ⬜ ověřit | `useChannelMutations.spec`, `useGameEvents.spec`, `useCustomPresets.spec`, … |
| `audit:routes` | FE | ⬜ ověřit | jen existence FE↔BE, **nic o cache** |
| `M-REC` skript | FE | ⬜ spustit | orphan + dead namespace report |

⚠️ **Pasti prostředí (z paměti):**
- FE `tsc -b` rozbitý → `tsc --noEmit` (`project_fe_build_preexisting_errors`).
- FE vitest: `--project '!storybook'`; FE **nikdy prettierem** (`feedback_fe_no_prettier`); eslint `--fix`.
- FE nemá precommit hook — ověřuj ručně (`project_fe_test_precommit`); vitest bez globals (explicit importy), `fireEvent` ne `user-event`.
- WS invalidace závisí na `useSocketReconnect` re-joinu — bez něj klient po reconnectu „oslepne" (`project_ws_security_patterns`, `project_map_world_room_join`).

---

## Seed kandidáti (z prvního čtení — verdikt až při sweepu)

> Hypotézy, ne nálezy. Sweep každý povýší na `🐛 C-xx`, `✅ shoda` nebo `⚖️ by-design`.

- **K-C1** `KM`/`WS` — [`useWorldSocket.ts:45`](../../src/features/world/hooks/useWorldSocket.ts#L45):
  `world:updated` invaliduje `['worlds']` (seznam), komentář ale slibuje „refetch aktivní world query".
  Pokud world detail/settings běží pod klíčem, který `['worlds']` neprefixuje, **neobnoví se** od cizí
  změny. Oblast 03.
- **K-C2** `FO` — [`useGameEvents.ts:93`](../../src/features/world/api/useGameEvents.ts#L93):
  `useToggleRsvp` má ruční seznam invalidací **bez `world-all`** (kalendář 5.5c) a **bez `detail`** —
  na rozdíl od `invalidateGameEvents()` (kompletní). RSVP → kalendář + otevřený detail stale. Oblast 09.
- **K-C3** `CB` — 187 komponent s `.mutate()`; podmnožina invaliduje v `mutate(v,{onSuccess})` →
  zahodí se při unmountu (destruktivní akce + navigace). Census při sweepu. Globální / cross-oblast.
- **K-C4** `P7` — router loadery vs RQ: sdílí nějaký loader data s RQ dotazem? Pokud ano, RQ invalidace
  je netrefí. Oblast 00.
- **K-C5** `OPT` — chat optimistic send + WS echo dedup; token update optimistic. Oblast 06/08.
- **K-C6** `P7` — RQ ↔ jotai: profil (jméno/avatar) v headeru z atomu vs profile query. Oblast 01.

---

## Index oblastí (13)

| # | Oblast | Jádro povrchu | Osy / perspektivy |
|---|---|---|---|
| 00 | [Cross-cutting](00-cross-cutting.md) | queryClient config, factory vs inline, prefix-match semantika, WS vrstva, optimistic vzor, **router loader / jotai dual-cache**, globální M-REC + M-CEN | `KM` `CB` · P2 P6 P7 |
| 01 | [Auth & účet](01-auth-ucet.md) | login/register/logout, profil (jméno/avatar/bio/privacy/theme), email/username change, delete account, **RQ↔jotai header** | `FO` `CB` · P7 |
| 02 | [Uživatelé & přátelé](02-uzivatele-pratele.md) | adminUsers, friendships (+socket), publicUsers, pendingActions, ZpracovatTab, badge žádostí | `FO` `WS` · P1 P4 |
| 03 | [Světy & universe](03-svety-universe.md) | worlds list/detail/settings, members, join/access/removeMember, transfer, theme, universe socket | `KM` `SC` `WS` · P1 P4 |
| 04 | [Stránky & directory & AKJ](04-stranky-directory-akj.md) | pages CRUD, directory, favorites, templates, AKJ types, backlinks, sidebar nav | `FO` `KM` `CR` · P1 |
| 05 | [Postavy & ekonomika](05-postavy-ekonomika.md) | character mutations + subdokumenty, accounts (predikát!), transfer notif, shop, currencies, favorites | `FO` `SC` · P1 P2 |
| 06 | [Chat & pošta & emoty](06-chat-posta-emoty.md) | channels/groups/messages, **optimistic send + WS echo**, presence, emotes, mail (infinite), global chat, unread badge | `OPT` `WS` `FO` · P3 P4 |
| 07 | [Bestie](07-bestie.md) | bestie create/update/clone, bestiar 3-scope list, snapshot semantics | `CR` `SC` · P1 |
| 08 | [Taktická mapa](08-takticka-mapa.md) | scenes, combat, tokens (optimistic), weather, gm-notes, library, presets, active-scenes, reassignment | `OPT` `WS` `FO` · P3 P4 |
| 09 | [Události & kalendář & timeline](09-udalosti-kalendar-timeline.md) | game-events (+comments/rsvp), timeline (infinite), calendar configs, diary schema | `FO` `KM` · P1 P5 |
| 10 | [Ikaros platforma](10-ikaros-platforma.md) | articles (+bulk/categories), discussions, gallery (+categories), ikaros news, ikaros events, dashboard | `FO` `CR` · P1 |
| 11 | [Notifikace & dashboardy & sidebary](11-notifikace-dashboardy-sidebary.md) | useEvents/chatFeed (infinite), notification bell, world dashboard widgety, Rozcesti, presence panel — **consumer-side cross-feature sweep** | `FO` `LC` · P1 P6 |
| 12 | [Admin](12-admin.md) | adminStats, searchIndex, adminFriendships, adminUsers, search staleness | `FO` `KM` · P1 |

---

## Legenda statusů

- ⬜ netestováno
- ✅ ověřeno OK (`✅L2` drží i úroveň jistoty)
- 🐛 nalezen rozpor → [`../cache-audit.md`](../cache-audit.md) (`C-xx`)
- ⚠️ podezřelé / nejisté / dluh
- ⏭️ blokované nebo `[human]`

---

## Pracovní postup

1. **Baseline** — `tsc --noEmit` + vitest invalidační specy + `M-REC` skript; zapsat stav.
2. **M-REC + M-CEN globálně** (P6) — orphan + dead namespace report + mutace bez cache efektu →
   seed konkrétních kandidátů do oblastí.
3. **Konzumentská inventura** (P1) — pro každý zdroj vypiš **všechny** `queryKey` co ho čtou (seznam /
   detail / sidebar / dashboard / badge) s `soubor:řádek`. Chybějící konzument v invalidaci = kandidát.
4. **Oblast po oblasti** — tabulka **mutace × konzument**, buňka = invaliduje? (✅ / ❌ / ⚠️částečně).
   Pod tabulkou **delta** — každá mutace, která nepokrývá všechny konzumenty.
5. **Delta → `C-xx`.** Pořadí dle dopadu: **stale po destruktivní akci** (`DEL`/`CB`) a **falešný
   optimistický stav** (`OPT`) první, pak neúplný fan-out (`FO`/badge), key-mismatch (`KM`), WS nesoulad
   (`WS`), pak orphan/dead (`LC`/P6) a dual-cache (`P7`).
6. **Key-match (M2)** na podezřelé klíče → L2. **Runtime (M4)** na kritické → L4.
7. **Nález → `C-xx`** s `soubor:řádek` mutace + všech konzumentů + návrhem + povinným **triggerem /
   viditelností / workaroundem**; **neopravovat tiše** (pravidlo projektu).
