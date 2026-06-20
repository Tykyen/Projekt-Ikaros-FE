# Realtime state consistency audit — registr nálezů (WS event → reálný efekt)

> Centrální registr nálezů z [`state-consistency-plan/`](state-consistency-plan/README.md). ID `S-xx`.
> Šestý sourozenec [`bug-audit.md`](bug-audit.md) (logika), [`ws-audit.md`](ws-audit.md) (real-time
> **kontrakt** — dorazí event?), [`role-audit.md`](role-audit.md) (oprávnění),
> [`form-schema-audit.md`](form-schema-audit.md) (tvar dat) a [`cache-audit.md`](cache-audit.md)
> (invalidace po **REST** mutaci).
>
> Výhradně pro **spojnici WS → stav**: udělá přijatý event reálně něco — aktualizuje FE stav nebo
> invaliduje **správnou** cache, a přežije to reconnect?
>
> **Stav: 2026-06-13 — plán napsán · L8 ověřen TLC · seed-sweep hotový · všech 6 nálezů OPRAVENO + ověřeno.**
> Formální pokrytí oblastí 01–09 (L2) a L7 property testy zbývají (volitelné rozšíření jistoty).

---

## TL;DR (2026-06-13)

> Plán [`state-consistency-plan/`](state-consistency-plan/README.md) **založen** — 7 os
> (`EF` `TG` `RM` `RJ` `CV` `DUP` `EM`), 6 perspektiv, **8 úrovní jistoty L1–L8**, 10 oblastí (00–09).
>
> **✅ L8 (TLA+) protokol A `MapReconnect` ověřen** — TLC 2.19: `RefetchOnReconnect=FALSE` → `Convergence
> violated` (4-krokový protipříklad), `TRUE` → drží vč. `Liveness`. **Formální důkaz, že reconnect bez
> refetch nutně diverguje** ([`tla/`](state-consistency-plan/tla/README.md)). → oprava K-S3/K-S4/K-S9.
>
> **✅ Fáze 0 — M-EMIT census hotová.** Baseline: `audit:ws` 0/0, `tsc --noEmit` 0. BE emituje 114,
> FE poslouchá 60 — rozdíl je hlavně `-global` varianty, room-cílení téhož eventu a lifecycle, **ne**
> mrtvé emity. Reálně mrtvé: **2 nálezy** (`S-01`, `S-02`). **K-S1 (sound echo) vyvrácena** — FE listener existuje.
>
> | ID | Záv. | Osa | Oblast | Podstata | Stav |
> |---|---|---|---|---|---|
> | **S-06** | 🟠 | `TG` | 05 | `world:membership:changed` obnoví jen `members`, ale moje role žije v `['worlds','my']` (přes `useWorldStatus`→`WorldContext`) → po změně role PJ UI/gate stale (+`staleTime 5min`) | 🐛 |
> | **S-03** | 🟠 | `RJ` | 09 | `useAccountTransferNotifications` bez `useSocketReconnect` → zmeškaný **finanční** transfer za výpadku tichý (žádný toast ani resync) | 🐛 |
> | **S-04** | 🟡 | `RJ` | 07 | `useIkarosNews` + `useIkarosEvents` bez reconnect refetch; `staleTime 5min` brání i mount-obnově | 🐛 |
> | **S-05** | 🟡 | `RJ` | 08 | `useFriendshipsSocket` (7 listenerů) bez reconnect → zmeškaná žádost/odblok → pending-actions badge drift | 🐛 |
> | **S-01** | 🟡 | `EM` | 06 | `map:member-joined`/`-left` — BE emit do `sceneId`, žádný FE listener (legacy, redundantní s `map:operation`) | 🐛 |
> | **S-02** | 🟡 | `EM`/`EF` | 06 | MapsGateway `error` (8×) — BE `client.emit('error')` při selhání operace, FE bez `socket.on('error')` → ztracená chybová odezva | 🐛 |
>
> 💡 **S-03/S-04/S-05 = třída, kterou L8 dokázal reálnou** (reconnect bez refetch → trvalá divergence).
> Sweep ji lokalizoval na 3 hooky; **oprava je existující vzor** — [`useEvents.ts:29-32`](../../Projekt-ikaros-FE/src/features/notifications/api/useEvents.ts#L29)
> `useSocketReconnect(() => invalidate)` (C-46) má přesně to, co těmto třem chybí. Jednořádkový fix každý.
>
> **✅ Seed-sweep KOMPLETNÍ — všech 9 `K-Sx` vyřešeno:** 4 → nálezy (K-S3→S-04, K-S4→S-03,
> K-S7→S-06, K-S9→S-05), 5 → vyvráceno/by-design (K-S1 sound echo, K-S5 room sedí, K-S2 DUP
> komplementární, K-S6 disjunktní cache, K-S8 chat dedup konverguje — viz Vypořádání). Plus S-01/S-02
> z census. **Celkem 6 nálezů (1× 🟠 `TG` + 1× 🟠 `RJ` + 4× 🟡), žádný 🔴.**
> | **K-S6** | 🟡 | `DUP`/`TG` | 06 | `weather:updated` 2 listenery, různé cíle → ověřit nepřebíjení + tvar | ⬜ |
> | **K-S8** | 🟡 | `CV` | 02/03 | chat optimistic send + echo dedup (`clientNonce`/`m.id`) — konverguje? | ⬜ |

---

## Nálezy (`S-xx`)

### S-01 🟡 `EM` — `map:member-joined` / `map:member-left` mrtvé emity

- **Kde (BE):** [`maps.gateway.ts:285-298`](../../Projekt-ikaros/backend/src/modules/maps/maps.gateway.ts#L285) — `emitMemberJoined` (`:292`) a `emitMemberLeft` (`:297`), oba `this.server.to(sceneId).emit(...)`.
- **Kde (FE):** žádný `socket.on('map:member-joined')` ani `map:member-left` v `src/`.
- **Trigger:** člen vstoupí/opustí scénu → BE broadcastne na `sceneId` room.
- **Viditelnost:** žádná — efekt navržen (PJ orchestrator vizualizace, 10.2-prep-1), ale nikdo ho nekonzumuje. Member stav se na FE čte z `map:operation` logu.
- **Kdo / workaround:** n/a (funkce funguje přes `map:operation`).
- **Dopad:** latentní dluh + zašum (matoucí pro příštího dev: „emit existuje, tak ho asi někdo poslouchá"). Žádná regrese.
- **Návrh:** odstranit oba BE emit helpery (`map:operation` je kanonický zdroj), **nebo** doplnit FE listener, pokud orchestrator panel má z nich těžit. → rozhodnout při fázi oprav. Doporučení: **smazat BE** (méně kódu, jeden zdroj pravdy).

### S-02 🟡 `EM`/`EF` — MapsGateway `error` event bez FE listeneru

- **Kde (BE):** [`maps.gateway.ts`](../../Projekt-ikaros/backend/src/modules/maps/maps.gateway.ts) — `client.emit('error', {...})` na **8 místech** (67, 78, 91, 111, 124, 159, 227, 322): `WS_UNAUTHORIZED`, `MAP_SCENE_NOT_FOUND`, `MAP_FORBIDDEN` aj. při selhání mapové operace / join.
- **Kde (FE):** [`useMapSocket`](../../Projekt-ikaros-FE/src/features/world/tactical-map/hooks/useMapSocket.ts) ani jinde nemá `socket.on('error')`; FE má jen `connect_error` (handshake), ne tenhle aplikační `error`.
- **Trigger:** klient pošle mapovou operaci, na kterou nemá právo / scéna neexistuje / není autentizovaný.
- **Viditelnost:** **tichý no-op** — operace se neprovede a uživatel nedostane strukturovanou zpětnou vazbu (žádný toast „nemáš oprávnění" / „scéna neexistuje").
- **Kdo / workaround:** postižený klient; F5 nepomůže (chybí handler). Optimistický apply na mapě může držet stav, který server odmítl → lokální divergence do příštího refetch.
- **Dopad:** degradovaná chybová odezva na mapě + potenciální optimistic-bez-rollback (cross-ref `CV`, oblast 06).
- **Návrh:** FE doplnit `socket.on('error')` v `useMapSocket` → toast + invalidace dotčené scény (resync po odmítnutém optimistic apply). Ověřit při sweepu 06, zda optimistická operace má rollback.

### S-03 🟠 `RJ` — `useAccountTransferNotifications` bez reconnect refetch (finanční)

- **Kde:** [`useAccountTransferNotifications.ts:24-46`](../../Projekt-ikaros-FE/src/features/world/pages/api/useAccountTransferNotifications.ts#L24) — `useSocketEvent('account:transfer:received', …)`, žádný `useSocketReconnect`. Event jde do `user:{id}` (server po reconnectu re-joinne sám), ale **vyslaný během výpadku je pryč**.
- **Trigger:** příjem převodu peněz, zatímco klient byl offline (reconnect okno).
- **Viditelnost / kdo:** postižený příjemce — **toast nedorazí** a `accounts`/`characters` cache se neobnoví. Zůstatek se srovná až při příštím REST načtení účtu (otevření obrazovky účtu).
- **Workaround:** F5 / navigace na účet. Žádný automatický resync.
- **Dopad:** finanční kontext (ne ztráta dat — server má pravdu), ale zmeškaná real-time notifikace + dočasně stale zůstatek. **L8 `MapReconnect` dokázal tuto třídu obecně.**
- **Návrh:** přidat `useSocketReconnect(() => qc.invalidateQueries({ predicate: accounts }))` dle vzoru [`useEvents.ts:29-32`](../../Projekt-ikaros-FE/src/features/notifications/api/useEvents.ts#L29) (C-46).

### S-04 🟡 `RJ` — `useIkarosNews` + `useIkarosEvents` bez reconnect refetch

- **Kde:** [`useIkarosNews.ts:24-26`](../../Projekt-ikaros-FE/src/features/ikaros/api/useIkarosNews.ts#L24) — `ikaros:news:changed` → invalidate, žádný reconnect. Stejný vzor `useIkarosEvents`. Navíc `staleTime: 5*60_000` → po reconnectu se query nepovažuje za stale, **neobnoví se ani mountem** 5 min.
- **Trigger:** broadcast změny novinek/událostí během výpadku (platform `/` namespace — re-join nepomáhá, broadcast je pryč).
- **Viditelnost / kdo:** všichni klienti — dashboard novinky stale až 5 min po reconnectu.
- **Dopad:** nízký (řídký broadcast, kosmetický obsah), ale je to čistý příklad „broadcast + dlouhý staleTime + žádný reconnect".
- **Návrh:** `useSocketReconnect(() => invalidate(NEWS_KEY))` (a obdoba pro events).

### S-05 🟡 `RJ` — `useFriendshipsSocket` bez reconnect refetch

- **Kde:** [`useFriendshipsSocket.ts:38-85`](../../Projekt-ikaros-FE/src/features/friendships/hooks/useFriendshipsSocket.ts#L38) — **7 listenerů** (`friend:request:*`, `friend:removed`, `friend:blocked`, `user:identity:changed`), žádný `useSocketReconnect`. `user:{id}` room.
- **Trigger:** žádost o přátelství / přijetí / blok / změna identity, zatímco klient offline.
- **Viditelnost / kdo:** příjemce — `pending-actions` badge a `friends`/`friendship-status` zůstanou stale; žádost o přátelství se „neukáže", dokud uživatel neudělá akci spouštějící refetch.
- **Dopad:** sociální, nízký-střední — badge nesedí. `user:identity:changed` (ban/role) je citlivější: zabanovaný klient neobnoví profil real-time.
- **Návrh:** `useSocketReconnect(() => invalidate(['friends'], ['friendship-status'], ['pending-actions'], ['users','me']))`.

> 🔧 **Společný fix S-03/04/05:** jeden vzor (`useSocketReconnect` + invalidate) napříč třemi hooky.
> Vhodné řešit jednou dávkou + jedním vitest (L4) mock-socket-reconnect testem na všechny tři.

### S-06 🟠 `TG` — změna role se neobnoví (membership:changed míří na špatný klíč)

- **Řetěz (FE):** `canManage`/`isPJ`/`userRole` ← [`WorldContext.userRole`](../../Projekt-ikaros-FE/src/features/world/context/WorldContext.tsx#L23) ← [`WorldLayout.tsx:343`](../../Projekt-ikaros-FE/src/app/layout/WorldLayout/WorldLayout.tsx#L343) `membership?.role` ← [`useWorldStatus`](../../Projekt-ikaros-FE/src/features/world/api/useWorldStatus.ts#L25) ← [`useMyWorlds`](../../Projekt-ikaros-FE/src/features/world/api/useWorlds.ts#L7) klíč **`['worlds', 'my']`**, `staleTime: 5*60_000`.
- **Efekt eventu:** [`useWorldSocket.ts:58-66`](../../Projekt-ikaros-FE/src/features/world/hooks/useWorldSocket.ts#L58) `world:membership:changed`/`removed` → invalidate **jen** `['worlds', worldId, 'members']`.
- **Mismatch (`TG`/`KM`):** `['worlds', worldId, 'members']` **neprefixuje** `['worlds', 'my']` (prvek `[1]` = `worldId` vs `'my'`). → `userRole` z `WorldContext` se neobnoví. `staleTime 5min` brání i mount-refetchi.
- **Trigger:** PJ změní roli člena (povýšení Hrac→PomocnyPJ/PJ nebo degradace). Event dorazí do `world:{id}` (klient tam je přes `useWorldSocket` → `RM` OK), ale FE invaliduje špatný klíč.
- **Viditelnost / kdo:** postižený člen — PJ UI (tlačítka „Nová stránka"/editace, PJ panel, mapa orchestrátor, nav PJ-only položky) se **neobjeví/nezmizí** po dobu ~5 min nebo do F5.
- **Dopad:** **není security hole** (BE práva enforcce — degradovaný klikne → 403), ale matoucí UX + povýšený člen je blokován od nástrojů, které už má. Cross-ref cache-audit (membership↔role fan-out).
- **Návrh:** v `useWorldSocket` `invalidateMembers` přidat i `qc.invalidateQueries({ queryKey: ['worlds', 'my'] })` (a zvážit world detail `['worlds','slug'/'id', key]`). Pak `userRole` doteče. Ověřit L4 mock-socket testem.

> 🔧 **Společný fix S-03/04/05:** jeden vzor (`useSocketReconnect` + invalidate) napříč třemi hooky.
> Vhodné řešit jednou dávkou + jedním vitest (L4) mock-socket-reconnect testem na všechny tři.

| ID | Závažnost | Oblast | Osa | Podstata | Stav |
|---|---|---|---|---|---|
| **S-06** | 🟠 | 05 | `TG` | `world:membership:changed` obnoví jen `members`, ne `['worlds','my']` → role/PJ UI stale 5 min | ✅ opraveno |
| **S-03** | 🟠 | 09 | `RJ` | `useAccountTransferNotifications` bez reconnect → zmeškaný finanční transfer tichý | ✅ opraveno |
| **S-04** | 🟡 | 07 | `RJ` | `useIkarosNews`/`Events` bez reconnect + `staleTime 5min` | ✅ opraveno |
| **S-05** | 🟡 | 08 | `RJ` | `useFriendshipsSocket` (7 listenerů) bez reconnect → badge drift | ✅ opraveno |
| **S-01** | 🟡 | 06 | `EM` | `map:member-joined`/`-left` mrtvé emity (legacy, redundantní s `map:operation`) | ✅ opraveno |
| **S-02** | 🟡 | 06 | `EM`/`EF` | MapsGateway `error` (8×) bez FE listeneru → ztracená chybová odezva + možný optimistic-bez-rollback | ✅ opraveno |

> **✅ Opraveno 2026-06-13.** FE (S-02–S-06): `useSocketReconnect`+invalidate vzor (S-03/04/05),
> `['worlds','my']` do `invalidateMembers` (S-06), `socket.on('error')`→toast v `useMapSocket` (S-02);
> eslint 0, tsc 0, build OK. BE (S-01): smazány `emitMemberJoined`/`emitMemberLeft` + volání + mock;
> prettier ok, tsc 0, jest 93/93. **Git ponechán uživateli** ([feedback_git_manual]).

---

## Vypořádání / rozhodnutí

- **K-S1 → ✅ false-positive (sound echo NENÍ mrtvý).** Hypotéza byla, že FE emituje `sound:play/stop`, ale neposlouchá echo. Census ukázal listener: [`SoundNowPlayingBanner.tsx:62-63`](../../Projekt-ikaros-FE/src/features/world/chat/components/SoundNowPlayingBanner.tsx#L62) `useSocketEvent('chat:sound:playing'/'chat:sound:stopped')` (s typy `PlayingEvent`/`StoppedEvent`). Echo funguje, ostatní klienti zvuk dostanou. Uzavřeno.
- **K-S5 → ✅ false-positive (room sedí).** Hypotéza: `useActiveScenes` dělá `map:join-world` (custom emit), ne `room:join`, tak `world:operation` možná nedorazí. Realita: BE handler [`maps.gateway.ts:146-171`](../../Projekt-ikaros/backend/src/modules/maps/maps.gateway.ts#L146) `@SubscribeMessage('map:join-world')` → `client.join('world-ops:${worldId}')`, a `emitWorldOperation` ([:281](../../Projekt-ikaros/backend/src/modules/maps/maps.gateway.ts#L281)) cílí přesně `world-ops:{id}`. Room sedí + reconnect re-join je ([`useActiveScenes.ts:76`](../../Projekt-ikaros-FE/src/features/world/tactical-map/hooks/useActiveScenes.ts#L76)). Záměrný PJ-only room (R-13: pomlčka blokuje generický `room:join` regex = leak-safe). Uzavřeno.
- **K-S2 → ⚖️ by-design (DUP komplementární, ne konflikt).** `map:reassigned` má 2 listenery: [`useReassignmentListener.ts:35`](../../Projekt-ikaros-FE/src/features/world/tactical-map/hooks/useReassignmentListener.ts#L35) invaliduje `mapSceneQueryKey` (refetch nové scény / 404→MapEmptyState) a [`useMapSocket.ts:107`](../../Projekt-ikaros-FE/src/features/world/tactical-map/hooks/useMapSocket.ts#L107) volá `onReassigned` callback (UI přechod). Dva různé efekty na různých vrstvách, nepřebíjejí se. ⚠️ **Drobnost:** `useReassignmentListener` nemá reconnect re-join (`user:{id}` server auto-joinne, ale zmeškaný `map:reassigned` za výpadku → hráč zůstane na staré scéně do mount-refetch). Sdílí kořen s S-03/04/05; nízká, vyřešitelná stejným `useSocketReconnect` vzorem — přidat do dávky.
- **K-S6 → ✅ by-design (disjunktní cache).** `weather:updated` má 2 listenery s **různými cíli**: [`useMapWeather.ts:108`](../../Projekt-ikaros-FE/src/features/world/tactical-map/hooks/useMapWeather.ts#L108) patchuje `['worlds']` (`World.activeMapWeather`, mapová atmosféra) vs [`useWeatherWsSubscribe.ts:33`](../../Projekt-ikaros-FE/src/features/world/api/useWeatherWsSubscribe.ts#L33) patchuje `['weather-generators',worldId]` (karta generátoru). Různé stránky (TacticalMap vs WorldWeatherPage), oba filtrují `worldId` + null guard (N-39/W-6), tvary `setQueryData` sedí. Nepřebíjejí se. Uzavřeno.
- **K-S8 → ✅ by-design (dedup konverguje).** Chat optimistic send + WS echo: [`ChannelView.tsx:276-280`](../../Projekt-ikaros-FE/src/features/world/chat/components/ChannelView.tsx#L276) dělá `id`-dedup (`list.some(x=>x.id===m.id)` → idempotence proti dvojímu echu) **a** `clientNonce` swap (`findIndex(clientNonce)` → optimistic zpráva se nahradí serverovou, ne zdvojí; 6.2h). Konvergence na 1 zprávu OK. → **toto je přesně invariant pro L7 uniqueness/ordering test** (protokol B `ChatDedup`).

---

## Legenda

- 🔴 kritická · 🟠 střední · 🟡 nízká · ⚪ kosmetika · ⚖️ by-design / přijatý dluh
- 🐛 potvrzeno · ✅ opraveno / vyvráceno · ⬜ k ověření · `K-Sx` seed kandidát (hypotéza)

---

## Plný audit RUN 2026-06-20 (FE 2a6c8e1c / BE 9cf98be)

Re-sweep: S-01..06 drží, žádná regrese. 3 nové nálezy stejné třídy `RJ` (reconnect bez refetch) — všechny OPRAVENY vzorem `useSocketReconnect` + invalidate (jako S-05).

- **S-RUN-01 🟡 `RJ` ✅ OPRAVENO** — `useWorldAccessSocket` (žádost/schválení vstupu) bez reconnect refetch. Fix: `useSocketReconnect` → invalidate `pending-actions`/`worlds,my-access-requests`/`worlds,my`/`worlds`. Pojistka: `useWorldAccessSocket.spec.tsx`.
- **S-RUN-02 🟡 `RJ` ✅ OPRAVENO** — `useReassignmentListener` (`map:reassigned`) bez reconnect refetch. Fix: `useSocketReconnect` → invalidate `mapSceneQueryKey`. Pojistka: `useReassignmentListener.spec.tsx`.
- **S-RUN-03 🟡 `RJ` ✅ OPRAVENO** — `useUniverseSocket` re-join bez refetch (zmeškaný `universe:updated` za výpadku). Fix: onConnect invaliduje (mimo edit mód → stale badge). Pojistka: `useUniverseSocket.spec.tsx` (2 testy).
- ⏭️ L8 TLC (mimo ověřený MapReconnect) vyžaduje `+formal`.
