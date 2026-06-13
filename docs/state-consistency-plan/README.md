# Realtime state consistency plán — udělá WS event reálně něco?

> **Účel:** systematicky projít **každý frontendový Socket.IO listener** a ověřit, že přijatý event
> **nejen dorazí, ale opravdu aktualizuje FE stav nebo invaliduje SPRÁVNOU cache** — a tu pravou, ne
> sousední namespace. Cílová otázka u každého eventu:
> „když tenhle event přijde, **změní se to, co má, a uvidí to uživatel bez F5** — i po reconnectu a
> i když ho vyvolal někdo jiný?"
>
> Šestý sourozenec [`bug-plan/`](../bug-plan/README.md) (REST/logika),
> [`ws-contract-plan/`](../ws-contract-plan/README.md) (real-time **kontrakt**: dorazí event?),
> [`role-plan/`](../role-plan/README.md) (oprávnění),
> [`form-schema-plan/`](../form-schema-plan/README.md) (tvar dat) a
> [`cache-plan/`](../cache-plan/README.md) (invalidace po **REST** mutaci). Tenhle plán testuje
> **spojnici WS → stav**: orthogonální vrstvu mezi „event dorazil" (ws) a „cache se obnovila" (cache).
>
> **Stav:** zahájeno 2026-06-13. Nálezy → [`../state-consistency-audit.md`](../state-consistency-audit.md) (ID `S-xx`).

---

## Proč samostatný plán (přesně co ws-plan i cache-plan míjejí)

Dva sousední audity ohraničují tuhle vrstvu z obou stran, ale **ani jeden ji neprochází**:

- **ws-contract-plan** končí u „**event dorazil** se správným payloadem do správného roomu" (osy EX/PL/RM/AU/LC/LK). Co s ním FE udělá **potom**, neřeší.
- **cache-plan** ověřuje „po **REST** mutaci (`useMutation.onSuccess`) se obnoví konzumenti". WS handler je tam jen okrajová osa `WS` (P4 parita) — nekontroluje **každý** listener, jestli vůbec něco dělá.

Mezi nimi je díra: **FE listener přijme reálný event a buď nedělá nic, nebo invaliduje špatný klíč, nebo se efekt nikdy neprovede, protože klient není v roomu / po reconnectu oslepl.** WS kontrakt je zelený, REST cache je zelená, a uživatel přesto kouká na starý stav, dokud nedá F5.

| Slepá skvrna | Příklad reálného rizika v Ikarovi | Dopad |
|---|---|---|
| **Mrtvý listener** — `socket.on` jen `console.log` nebo prázdný efekt | event dorazí, UI se nehne (kandidát: `chat:sound:*` echo bez konzumenta) | 🔴 funkce „nefunguje" bez chyby |
| **Špatný cíl** — invaliduje/`setQueryData` jiný klíč, než kde data žijí | `world:membership:changed` obnoví jen `members`, ne dashboard widget s rolí | 🟠 částečně stale |
| **Efekt se nikdy neprovede** — klient není v roomu, kam BE posílá | event jde do `world:{id}`, ale hráč mimo chat/mapu room nejoinl → no-op | 🟠 „někomu to chodí, někomu ne" |
| **Reconnect gap** — re-join chybí NEBO chybí refetch zmeškaného | 5 s offline → 3 eventy zahozeny → token/seznam zamrzne na předvýpadkovém stavu | 🔴 tichá divergence |
| **Divergence optimistic ↔ echo** — `setQueryData` + WS echo se nezdedupují | odeslaná zpráva se zdvojí / zabliká; selhaná akce drží optimistickou lež | 🟠 falešný stav |
| **Duplicitní handler** — 2 listenery na týž event s konfliktním efektem | `map:reassigned`: callback aplikuje + druhý hook invaliduje → přebití | 🟡 redundance / závod |
| **Mrtvý emit** — BE emituje event, FE nemá žádný listener | navržená real-time funkce, kterou nikdo neposlouchá | 🟡 latentní mezera |

> 💡 **Závěr:** zelený `audit:ws` + zelený cache-audit = „event dorazí a REST mutace obnoví". Neříká
> **nic** o tom, jestli **samotný příchod eventu** něco udělá. Tenhle plán bere každý `socket.on` a ptá
> se: **provede reálný efekt → na správný cíl → doopravdy se spustí → a přežije reconnect?**

---

## Architektura real-time vrstvy Ikara (kde se efekt děje)

| Vrstva | Nástroj | Kde | Role |
|---|---|---|---|
| **Socket singleton** | Socket.IO, namespace `/` | [`socket.ts`](../../src/features/chat/api/socket.ts) | jedna instance pro celou app; `getSocket()` lazy, auth `{ token }` z `accessTokenAtom` |
| **Listener helper** | `useSocketEvent(event, handler)` | [`useSocket.ts`](../../src/features/chat/api/useSocket.ts) | `socket.on`+cleanup, handler v ref, re-registrace na `socketStatusAtom` změnu |
| **Reconnect re-join** | `useSocketReconnect(cb)` | [`useSocket.ts`](../../src/features/chat/api/useSocket.ts) | callback na `'connect'` → **musí** re-joinnout roomy (Socket.IO je po reconnectu zahodí) |
| **Cache efekt** | `qc.invalidateQueries` / `qc.setQueryData` / `qc.removeQueries` | listener hooky | obnova serverového stavu z push eventu |
| **Lokální stav** | `useState` (typing, kicked) / jotai atom (presence, socketStatus) | komponenty / atomy | ephemerální nebo cross-cut stav |
| **Room mapa** | `room:join` / custom `map:join*` emit | listener hooky | určuje, **komu** event reálně dorazí |

> ⚠️ **Klíčová mechanika reconnectu:** Socket.IO po výpadku obnoví **socket**, ale **zahodí všechny
> rooms**. Listener (`useSocketEvent`) přežije (re-registruje se), ale **bez `useSocketReconnect`
> re-joinu klient přestane být v roomu → eventy přestanou chodit tiše**. A i s re-joinem: eventy
> **vyslané během výpadku jsou navždy pryč** — re-join zajistí budoucí, ne zmeškané. Proto kritická
> cesta potřebuje **re-join + refetch** (dohnat mezeru), ne jen re-join.

📚 **Listener vs cache invalidace — dva tvary efektu:** část listenerů dělá `invalidateQueries`
(řekne RQ „zahoď, načti znovu" — bezpečné, ale síťový roundtrip), část `setQueryData` (přímo přepíše
cache z payloadu — rychlé, ale **payload musí mít tvar jako `queryFn`**, jinak UI po příštím refetch
„skočí"). Audit u každého rozhoduje, jestli zvolený tvar sedí na situaci (chat zprávy = `setQueryData`
append/dedup; struktura kanálů = `invalidate` full refetch, BE je autoritativní).

---

## Kontrolní osy (7)

Každý listener se prověřuje podél jedné/více os. U bodu se uvádí osa.

| Osa | Zkr | Otázka | Jak ověřit |
|---|---|---|---|
| **Efekt existuje** | `EF` | Provede listener po přijetí **reálný** state/cache efekt? (ne prázdno / jen `console.log` / jen toast bez obnovy) | čtení těla handleru; census všech `socket.on` |
| **Cíl efektu** | `TG` | Trefí efekt **správný** `queryKey`/atom, kde dotčená data **reálně žijí**? (ne sousední namespace, ne jen seznam bez detailu) | klíč efektu vedle všech konzumentů (cross-ref cache P1) |
| **Doručení do roomu** | `RM` | Je klient **v roomu**, kam BE event posílá? Jinak efekt nikdy nenastane (tichý no-op) | trasování `room:join`; cross-ref [ws-audit](../ws-audit.md) room mapa |
| **Reconnect + gap** | `RJ` | Po reconnectu se room **re-joinne** A klient **dožene zmeškané** (refetch)? Nebo oslepne / zamrzne? | je handler obalený `useSocketReconnect`? je tam refetch fallback? |
| **Konvergence** | `CV` | Optimistic + echo → **jeden** finální stav (dedup dle id/nonce)? idempotence (2× týž event neduplikuje)? ordering? | čtení dedup logiky; round-trip test |
| **Duplicita** | `DUP` | Neposlouchají **2 listenery** týž event s konfliktním/redundantním efektem? | grep event stringu napříč hooky |
| **Mrtvý emit** | `EM` | Emituje BE event, na který FE **nemá** žádný listener? (efekt navržen, chybí konzument) | emit census BE ↔ `socket.on` FE |

`EF` a `RM` jsou **osy úplného selhání** (efekt se vůbec nestane). `TG` je obdoba `KM` z cache-planu,
ale spouštěná **WS eventem** místo REST mutace. `RJ` je **jediná osa, kterou cache-plan nemá hloubkově**
— gap recovery po výpadku. `CV` chytá tichou divergenci optimistic ↔ echo.

> 💡 U `TG` cross-refuj **cache-audit P1 konzumentskou inventuru**: pro každý event už víme, kteří
> konzumenti čtou ten zdroj. Listener musí trefit **jejich průnik**, stejně jako REST mutace. Když WS
> handler invaliduje **míň** než REST `onSuccess` téhož zdroje → změna od cizího klienta obnoví míň než
> vlastní akce (asymetrie „záleží kdo to udělal").

---

## Hloubkové perspektivy (6) — jak hluboko každý listener proklepnout

### P1 — Listener census (osa `EF`/`TG`) — páteř auditu
Vypiš **každý** `socket.on` / `useSocketEvent` v `src/`: `hook:řádek` → event string → **přesný efekt**
(`invalidate(klíč)` / `setQueryData(klíč, jak)` / `useState` / jotai set / **NIC**) → cíl. Řádek bez
reálného efektu = okamžitý kandidát `EF`. Řádek s efektem → ověř cíl proti konzumentům (`TG`).
Inventura existuje (viz níže, ~40 listenerů) — sweep ji potvrzuje proti kódu a doplňuje status.

### P2 — Round-trip (osa `EF`/`TG`/`CV`, metoda M5/M4)
U kritické cesty nestačí „listener vypadá OK". **Vyvolej event** (mock socket emit ve vitest / 2 reální
klienti runtime) → **assertni, že se cache/atom reálně změnila** na očekávaný tvar. To je jediný způsob,
jak chytit `setQueryData` tvar-drift a no-op efekt natvrdo. Cíl: kritické eventy na L4.

### P3 — Reconnect & gap chaos (osa `RJ`) — specialita tohoto plánu
Pro každý listener: (a) je obalený `useSocketReconnect`? (b) re-joinne room po `'connect'`? (c) **dožene
zmeškané** (refetch po re-join), nebo jen čeká na další event? Simuluj `disconnect → BE emit během
výpadku → reconnect` a ověř, že stav **konverguje** k serveru. Broadcast eventy (`/` namespace) re-join
nepotřebují, ale **potřebují refetch** (zmeškaný broadcast je pryč). Private `user:{id}` roomy server
re-joinne sám, ale stejný gap problém. → matice „re-join × refetch" v oblasti 00.

### P4 — Cross-ref ws-audit & cache-audit (osa `RM`/`TG`)
Tenhle plán je **spojnice**, ne ostrov. Pro každý event:
- **RM** ← [ws-audit](../ws-audit.md) room mapa: dorazí klientovi vůbec? (W-7/W-8/W-9 už řešily re-join a fallback)
- **TG** ← [cache-audit](../cache-audit.md) P1: trefuje listener stejné konzumenty jako REST mutace téhož zdroje? (C-xx WS-paritní nálezy)
Když ws-audit říká „dorazí" a cache-audit „REST obnoví X" → tady ověř, že **WS handler obnoví taky X**.

### P5 — Optimistic dedup (osa `CV`)
Cesty s optimistickým zápisem + WS echem: chat send (`clientNonce`/`m.id` dedup), token apply +
`map:operation` echo. Ověř celý cyklus: optimistic set → echo přijde → **dedup** (ne duplikát) →
selhání → rollback. Cross-ref cache-plan P3.

### P6 — Emit census (osa `EM`, metoda M-EMIT, mechanická)
Vyextrahuj **všechny** BE emit stringy z 12 gatewayů (`server.to(...).emit('x')`, `client.emit('x')`)
→ spáruj s FE `socket.on('x')`. **BE emit bez FE listeneru** = mrtvý emit (navržená funkce bez
konzumenta). Doplňuje `audit:ws` (ten páruje i opačný směr, ale tady chceme explicitní seznam
„emitujeme do prázdna"). Kandidát: `chat:sound:*` echo.

### Dopad / závažnost (povinné u každého nálezu — server běží)
Ikaros **běží s reálnými uživateli**. U každého nálezu uveď **trigger** (jaký event nechá co stale),
**viditelnost** (vidí uživatel chybu, nebo tiše starý stav?), **kdo** (jen cizí změny, nebo i vlastní?)
a **workaround** (spraví to F5 / reconnect?). Nejzávažnější: tichá divergence po reconnectu (`RJ`),
mrtvý listener kritické funkce (`EF`), falešný optimistický stav (`CV`).

---

## Inventura listenerů (povrch auditu)

> Zmapováno průzkumem 2026-06-13 (Explore sweep `src/`). Čísla = „k potvrzení při exekuci".
> **~40 listenerů ve ~25 hoocích/komponentách.** Plný výpis → oblast 00 + per-oblast tabulky.

- **Socket abstrakce:** singleton [`socket.ts`](../../src/features/chat/api/socket.ts); helpery `useSocketEvent` + `useSocketReconnect` [`useSocket.ts`](../../src/features/chat/api/useSocket.ts).
- **Efekt `invalidateQueries`:** worlds/access, ikaros news/events/mail, friendships, bestiar, chat struktura, active-scenes, reassignment.
- **Efekt `setQueryData`:** chat zprávy (global + world), emotes, presence panel, unread, weather (2×).
- **Efekt jotai/useState:** presence map, socketStatus, typing, kicked.
- **Efekt callback (komponenta řeší):** mapové operace (`map:operation/spotlight/pinged/reassigned`).
- **Reconnect re-join ✅:** useWorldSocket, useMapSocket, useMapWeather, useActiveScenes, useUniverseSocket, ChannelView, ChatRoom, useChatFeed, useEvents.
- **Reconnect re-join ❌ (ke zvážení):** useIkarosNews, useIkarosEvents, useMail, useFriendshipsSocket, useWorldAccessSocket, useAccountTransferNotifications, useReassignmentListener, useBestiar.
- **Duplicitní event:** `map:reassigned` (2 hooky), `weather:updated` (2 hooky), `chat:presence` (2 kontexty), `ikaros:new-message` (mail + notifications).

---

## Metody ověření (`[auto]`)

| Kód | Metoda | Nástroj |
|---|---|---|
| **M1** | Statické čtení — tělo listeneru: jaký efekt, na jaký cíl, edge cases | Read/Grep |
| **M-LIS** | **Listener census** — extrakce všech `socket.on`/`useSocketEvent` → event → efekt → cíl | Grep + tabulka |
| **M-EMIT** | **Emit census** — extrakce všech BE emit stringů → spárování s FE `socket.on` → mrtvý emit | Grep (BE+FE) |
| **M2** | Cross-ref — efekt listeneru ↔ konzumenti z [cache-audit](../cache-audit.md) P1; room z [ws-audit](../ws-audit.md) | čtení + diff |
| **M3** | Existující test — gateway/hook spec | `jest`/`vitest` |
| **M5** | **Mock-socket vitest** — emit event do mock socketu → spy/assert na `invalidateQueries` klíč nebo `setQueryData` výsledek | `vitest` |
| **M4** | **Runtime 2 klienti** — klient A udělá akci, klient B sleduje obnovu UI bez reloadu; reconnect chaos | skill `verify`/`run` |
| **M6** | Baseline — `audit:ws`, `tsc --noEmit`, socket specy | npm scripty |

---

## Úrovně jistoty (L1–L8)

Osm vrstev od statiky po formální model. Hloubka **se nerozlévá plošně** — roste s dopadem selhání
(viz „cílová hloubka per oblast" níže).

| Úroveň | Co znamená | Důkaz | Nástroj |
|---|---|---|---|
| **L1** | přečteno (M1) — efekt *vypadá* správně | nejslabší | Read |
| **L2** | cíl ověřen (M2/M-LIS) — klíč prokazatelně trefuje konzumenty, room sedí | strukturální | Grep / cross-ref |
| **L3** | existující test pokrývá efekt a je zelený (M3) | chování zajištěno | jest / vitest |
| **L4** | **round-trip** — mock socket emit → assert změna cache/UI (M5) | deterministická pojistka | vitest mock socket |
| **L5** | **multi-klient E2E** — 2 reální klienti, reálný socket+BE; A udělá akci → B to vidí bez F5 | end-to-end happy path | Playwright (2 contexts) |
| **L6** | **chaos / fault injection** — disconnect / latence / reorder *během* operací → stav konverguje | RJ osa naostro | programový disconnect / toxiproxy |
| **L7** | **property-based stateful** — invariant „∀ sekvence akcí+reconnectů: clientState = serverState po ustálení"; generátor hledá protipříklad | celé třídy race / ordering | fast-check (model-based) |
| **L8** | **formální model (TLA+)** — protokol jako matematika, TLC exhaustivně projde *všechna* prokládání | důkaz konvergence do hranice modelu | TLA+ / TLC → uzemněno do L7 |

⚠️ **L8 verifikuje MODEL, ne kód.** Aby to nebyl artefakt do šuplíku, je svázaný s L7: **každý invariant
a každý protipříklad z TLC se přepíše do property-based testu proti reálným hookům** (viz
[`tla/README.md`](tla/README.md)). Model navrhuje pravidla, kód je musí splnit — a smyčka drží i po refactoru.

📚 **L7 vs L8:** L7 hází náhodné sekvence na *běžící kód* a hledá, kde spadne (empirie na kódu). L8
prozkoumá *všechna* prokládání na *abstraktním modelu* a dokáže, že invariant platí do hranice (N klientů
/ M operací) — důkaz na modelu. Smyčka **L8 → L7** spojuje obojí: formální jistota uzemněná na reálné hooky.

### Cílová hloubka per oblast

| Oblast | Cíl | Proč |
|---|---|---|
| 00 cross-cutting | **L2** (census) + **L8** traceability | inventura + most na formální model |
| 01 presence · 04 emoty · 07 ikaros (čtení) | **L2** | nízký dopad selhání — stačí statika + cíl |
| 02 / 03 chat | **L4–L5** | optimistic dedup (`CV`) + multi-klient (B vidí zprávu) |
| 05 světy / universe / access | **L4** | `TG` nálezy (membership / role) → round-trip |
| **06 taktická mapa (reconnect+operace)** | **L8** | ← **protokol A**: nejvíc stavu, `RJ` osa, formální model + L7 smyčka |
| 07 reconnect gap (news/mail) · 08 friend · 09 transfer | **L7** | `RJ` osa, finanční / sociální dopad → property-based konvergence |

**Pravidlo:** běžné listenery **L2+**; `CV`/`RJ` na **L4+**; **protokol A (mapa reconnect) až L8**
s plnou smyčkou L8→L7; finanční/sociální reconnect (transfer, friend, news) na **L7**.

---

## Baseline — health checks

| Check | Repo | Stav | Pozn. |
|---|---|---|---|
| `npm run audit:ws` | FE | ✅ čistý (dle bug/ws-auditu) | jen parita názvů — nic o efektu |
| `tsc --noEmit` | FE | ⬜ ověřit | `tsc -b`/`build` pre-existing rozbitý (paměť) |
| socket hook specy | FE | 🔴 ~0 dedikovaných (dle ws-plan baseline) | gap-fill M5 cíl |
| `M-LIS` + `M-EMIT` census | FE+BE | ⬜ spustit | listener inventura + mrtvý emit report |

⚠️ **Pasti prostředí (z paměti):**
- Po BE změně gatewaye **nestačí FE refresh** — bez `nest --watch` restartu drží starý bundle ([feedback_be_restart_required]).
- FE `tsc -b` rozbitý → měř `tsc --noEmit` ([project_fe_build_preexisting_errors]).
- FE vitest: `--project '!storybook'`; **nikdy prettierem**, eslint `--fix` ([feedback_fe_no_prettier]); bez globals (explicit importy), `fireEvent` ne `user-event` ([project_fe_test_precommit]).
- Jedna sdílená Socket.IO instance napříč gateway — disconnect ovlivní všechny naráz ([project_ws_security_patterns]).
- Reconnect re-join závisí na `useSocketReconnect`; bez něj klient po výpadku tiše oslepne ([project_map_world_room_join]).

---

## Seed kandidáti (z inventury — verdikt až při sweepu)

> Hypotézy, ne nálezy. Sweep každý povýší na `🐛 S-xx`, `✅ shoda` nebo `⚖️ by-design`.

- **K-S1** `EF`/`EM` — `chat:sound:play/stop`: FE emituje ([`SoundBroadcastButton.tsx:33,45`](../../src/features/world/chat/components/SoundBroadcastButton.tsx#L33)), ale **žádný FE listener na echo** → zvuk slyší jen iniciátor? Ověřit, co BE re-emituje. Oblast 03.
- **K-S2** `DUP` — `map:reassigned` poslouchán **2×**: [`useMapSocket.ts:107`](../../src/features/world/tactical-map/hooks/useMapSocket.ts#L107) (callback) + [`useReassignmentListener.ts:40`](../../src/features/world/tactical-map/hooks/useReassignmentListener.ts#L40) (invalidate) → redundance/přebití. Oblast 06.
- **K-S3** `RJ` — `useIkarosNews`/`useIkarosEvents` **bez `useSocketReconnect`** → broadcast vyslaný během výpadku se nedožene (žádný refetch). Oblast 07.
- **K-S4** `RJ` — `useAccountTransferNotifications` bez reconnect; **finanční** notifikace v `user:{id}` roomu → zmeškaný transfer během výpadku tichý. Oblast 09.
- **K-S5** `RM` — `useActiveScenes` dělá `map:join-world` (custom emit, **ne** `room:join`) → ověřit v BE, že reálně joinne `world:{id}`, jinak `world:operation` nedorazí. Oblast 06.
- **K-S6** `DUP`/`TG` — `weather:updated` poslouchán 2×: [`useMapWeather.ts:112`](../../src/features/world/tactical-map/hooks/useMapWeather.ts#L112) → `['worlds']` vs [`useWeatherWsSubscribe.ts:26`](../../src/features/world/api/useWeatherWsSubscribe.ts#L26) → `['weather-generators']`. Různé cíle — ověřit, že se nepřebíjejí a oba tvary sedí. Oblast 06.
- **K-S7** `TG`/`FO` — `world:membership:changed` invaliduje jen `['worlds',id,'members']` ([`useWorldSocket.ts:65`](../../src/features/world/hooks/useWorldSocket.ts#L65)), **ne** `['worlds']` → změna role člena neobnoví dashboard widget / role gate. Cross-ref cache C-xx. Oblast 05.
- **K-S8** `CV` — chat optimistic send + echo dedup (`clientNonce`/`m.id`) v ChannelView/ChatRoom — konverguje na 1 zprávu? Cross-ref cache P3. Oblast 02/03.
- **K-S9** `RJ` — `useFriendshipsSocket` bez reconnect (private `user:{id}` room) → friend eventy během výpadku se nedoženou (žádost zůstane „neviděná"). Oblast 08.

---

## Index oblastí (10)

| # | Oblast | Jádro povrchu | Osy / perspektivy |
|---|---|---|---|
| 00 | [Cross-cutting](00-cross-cutting.md) | socket singleton, `useSocketEvent`/`useSocketReconnect`, **reconnect × refetch matice**, room mapa, M-LIS + M-EMIT census | `EF` `RJ` `EM` · P1 P3 P6 |
| 01 | [Presence & online](01-presence-online.md) | `presence:snapshot/update` → jotai map, OnlineDot, reconnect re-naplnění | `EF` `RJ` · P1 P3 |
| 02 | [Globální chat](02-global-chat.md) | Hospoda/Rozcestí: message/deleted/reaction/presence/typing, optimistic dedup, kicked | `CV` `TG` · P1 P5 |
| 03 | [World chat & pošta kanálů](03-world-chat.md) | message/updated/deleted, unread, channel/group struktura (invalidate), presence panel, **sound echo** | `CV` `EF` `TG` · P1 P5 P6 |
| 04 | [Emoty](04-emotes.md) | `emote:*` (+`-global`) → `setQueryData` dedup, world vs global scope | `TG` `CV` · P1 |
| 05 | [Světy / universe / access](05-svety-universe-access.md) | `world:updated/news/membership/deleted`, `world:access-*`, `universe:updated` (suspended edit) | `TG` `RM` `RJ` · P1 P4 |
| 06 | [Taktická mapa](06-takticka-mapa.md) | `map:operation/spotlight/pinged/reassigned` (callback), `weather:updated` (2×), `world:operation`/active-scenes, **map:join-world room** | `RM` `DUP` `CV` · P2 P3 |
| 07 | [Ikaros notifikace](07-ikaros-notifikace.md) | `ikaros:news/events:changed` (broadcast, **reconnect?**), `ikaros:new-message` (mail + notifications + chat-feed bump) | `RJ` `DUP` `TG` · P1 P3 |
| 08 | [Přátelství & identita](08-pratelstvi-identita.md) | `friend:request:*/removed/blocked`, `user:identity:changed`, pending-actions badge, reconnect gap | `RJ` `TG` · P1 P3 |
| 09 | [Účty & bestiář & generátory](09-ucty-bestiar-generatory.md) | `account:transfer:received` (reconnect?), `bestiar:changed` (scope), weather-generators subscribe | `RJ` `TG` · P1 |

---

## Legenda statusů

- ⬜ netestováno
- ✅ ověřeno OK (`✅L2` drží i úroveň jistoty)
- 🐛 nalezen rozpor → [`../state-consistency-audit.md`](../state-consistency-audit.md) (`S-xx`)
- ⚠️ podezřelé / nejisté / dluh
- ⏭️ blokované nebo `[human]`

---

## Pracovní postup

1. **Baseline** — `audit:ws` + `tsc --noEmit` + socket specy; `M-LIS` + `M-EMIT` census; zapsat stav.
2. **Listener census (P1)** — potvrdit inventuru proti kódu: každý `socket.on` → event → efekt → cíl s `soubor:řádek`. Mrtvý/no-op = okamžitý kandidát.
3. **Emit census (P6)** — BE emit stringy ↔ FE listenery → mrtvé emity.
4. **Oblast po oblasti** — tabulka **event × efekt × cíl**, ověř `EF` (dělá něco) → `TG` (správný cíl) → `RM` (dorazí) → `RJ` (přežije reconnect). Pod tabulkou **delta**.
5. **Reconnect chaos (P3)** na private/broadcast roomy — matice re-join × refetch.
6. **Round-trip (M5/M4)** na kritické cesty bez pokrytí → L4.
7. **Nález → `S-xx`** s `soubor:řádek` + efektem + cílem + návrhem + povinným **triggerem / viditelností / kdo / workaroundem**; **neopravovat tiše** (pravidlo projektu).
