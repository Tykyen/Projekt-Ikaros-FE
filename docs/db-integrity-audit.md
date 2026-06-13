# DB integrity audit — registr nálezů (je databáze konzistentní?)

> Centrální registr nálezů z [`db-integrity-plan/`](db-integrity-plan/README.md). ID `DI-xx`.
> Osmý sourozenec [`bug-audit.md`](bug-audit.md), [`ws-audit.md`](ws-audit.md), [`role-audit.md`](role-audit.md),
> [`form-schema-audit.md`](form-schema-audit.md), [`cache-audit.md`](cache-audit.md),
> [`state-consistency-audit.md`](state-consistency-audit.md) a [`cascade-delete-audit.md`](cascade-delete-audit.md).
>
> Výhradně pro **integritu stavu DB**: je to, co teď leží v databázi, vnitřně konzistentní — bez ohledu
> na to, jak se tam dostalo? Tři patra: **strukturální** (drží graf), **sémantické** (data logicky
> možná), **reprezentační** (ID porovnatelná).
>
> **Stav: 2026-06-13 — plán napsán, sweep NEZAČAL.** README + cross-cutting (00) + integrity-scan tool
> hotové; 15 seed kandidátů `K-DIx` z Explore sweepu. Ověření čeká na 1. krok M-TYPE + M-SCAN proti DB.

---

## TL;DR (2026-06-13)

> Plán [`db-integrity-plan/`](db-integrity-plan/README.md) — **14 os ve 3 patrech** (`OR RR DUP WV AT
> IDX` strukturální · `INV CARD STATE SET TEMP` sémantické · `TYPE` reprezentační), 5 perspektiv, 7
> oblastí. **70 kolekcí, FK jako stringy bez DB constraintu → integrita stojí jen na aplikačním kódu.**
>
> ⚠️ **Tři systémové kořeny** (z Explore sweepu, ještě neověřeno scanem):
>
> | ID | Záv. | Osa | Patro | Podstata | Důkaz | Stav |
> |---|---|---|---|---|---|---|
> | **K-DI0** | 🔴 | `TYPE` | 3 | `custom_emotes.worldId/createdBy` = `ObjectId` vs `string` jinde → $lookup/scan tiše lže | custom-emote.schema.ts:4 | ⬜ |
> | **K-DI1** | 🔴 | `WV`/`RR` | 1 | 6+ create services nevaliduje `worldId` existenci → dangling už při zápisu | world-news:93 +5 | ⬜ |
> | **K-DI2** | 🔴 | `RR` | 1 | slug-FK se nepřepisují při rename (characterPath, linked*Slug, linkPageSlug…) | viz oblast 01 | ⬜ |
> | **K-DI4** | 🔴 | `OR` | 1 | migrací nalité orphany (F3/F4/F5 ref na nenamigrované ID) ve světě `matrix` | M-SCAN | ⬜ |
> | **K-DI3** | 🟠 | `DUP`/`IDX` | 1 | očekávaná unikátnost bez DB indexu (měna code, weather name) | oblast 02 | ⬜ |
> | **K-DI6** | 🟠 | `AT` | 1 | kaskádní create bez transakce (world→…→calendar, page→character→subdocs) → partial orphan | worlds.service:329 | ⬜ |
> | **K-DI11** | 🟠 | `CARD` | 2 | postava ≠ přesně 1 subdoc od typu; persona page ⇔ 1 character | M-SCAN | ⬜ |
> | **K-DI13** | 🟠 | `INV` | 2 | `playerCount`≠real; `account.balance`≠Σtx; cross-collection `worldId` shoda | M-SCAN | ⬜ |
> | **K-DI8** | 🟠 | `OR` | 1 | 6 character subdoc kolekcí orphan po hard-delete (přesah CD-09) | M-SCAN | ⬜ |
> | **K-DI5** | 🟡 | `MIR` | 2 | `membership.avatarUrl` stale snapshot (nesync) | oblast 05 | ⬜ |
> | **K-DI7** | 🟡 | `RR` | 1 | `preferredCalendarConfigId`/`calendarConfigId` dangling po smazání kalendáře | M-SCAN | ⬜ |
> | **K-DI9** | 🟡 | `RR` | 1 | chat `allowedMemberIds`/`visibleTo`/`mentions` nevalidované userIds | oblast 01 | ⬜ |
> | **K-DI10** | 🟠 | `SHAPE` | 1 | migrace/staré docy: odebraná pole 9.1 / chybí nová required (`characterRef`,`kind`) | oblast 04 | ⬜ |
> | **K-DI12** | 🟡 | `RR`/`SET` | 1/2 | self-ref stromy: dangling parent / cyklus (folders, shop groups) | M-SCAN | ⬜ |
> | **K-DI14** | 🟡 | `STATE` | 2 | protichůdné flagy: `isNpc`⇔`userId`, `deletedAt`⇔`isActive`, `kind`⇔subdoc | M-SCAN | ⬜ |
>
> 💡 **Systémový kořen (jeden):** cross-collection FK jsou **prosté stringy bez Mongoose `ref:`** →
> MongoDB nevynucuje nic, integritu drží jen aplikační kód — a ten je u **write-validace nejednotný**
> (K-DI1) a u **slug-rename žádný** (K-DI2). + **migrace obešla services úplně** (K-DI4/10).
>
> ⚠️ **Naléhavost:** běží migrace Matrix→Ikaros (F1–F10 nalité). Migrace je hromadný zápis **mimo
> services** → write-validace ji nechytily. Svět `matrix` = reálný terč pro M-SCAN (oblast 04).
>
> 🔬 **První krok = `M-TYPE`** ([`tools/integrity-scan.md`](db-integrity-plan/tools/integrity-scan.md), TYPE blok). Dokud `worldId` není jednotný `string`,
> každé orphan/ref číslo u dotčených kolekcí je nespolehlivé (false-negative). Pak teprve M-SCAN.

---

## Nálezy (`DI-xx`)

> Sweep běží od 2026-06-13 (statické čtení, L2 — M-SCAN counts čekají na DB connection). Tři nálezy
> potvrzeny čtením kódu. ⚠️ **Dvě korekce vůči seedům** (Explore shrnutí přestřelilo, ověřeno v kódu):
> seed `K-DI1` (worldId slepě) reframnut na DI-02 (sekundární refs); `K-DI0` (TYPE 🔴) de-eskalován na DI-01 (🟡).

### DI-01 🟡 `TYPE` — `custom_emotes` FK jako `ObjectId` (konvenční odchylka, ne aktivní bug)

- **Kde:** [`custom-emote.schema.ts:9-10,25-26`](../Projekt-ikaros/backend/src/modules/emotes/schemas/custom-emote.schema.ts#L9) — `worldId`/`createdBy` = `Types.ObjectId`. **Jediná** kolekce s ObjectId FK; grep `Types.ObjectId` i `ref:` přes všechna schémata = 0 jinde → string-FK konvence všude jinde.
- **Co je špatně:** odchylka od konvence. Mongoose **auto-castuje** string→ObjectId u within-collection dotazů → **žádný runtime bug**. Latentní riziko jen u raw `$lookup`/aggregation joinujícího `emotes.worldId` ↔ string FK jiné kolekce bez explicit castu.
- **Dopad na scan:** [`integrity-scan`](db-integrity-plan/tools/integrity-scan.md) `String()`-normalizuje → **není otráven**. (Oprava plánu: „TYPE poisons scan / běží první" platí jen pro naivní scan.)
- **Vratné?** Ano (migrace pole na string). **Návrh:** sjednotit na string kvůli konvenci ([project_be_field_checklist]); nízká priorita.

### DI-02 ⚖️ `RR`/`WV` — sekundární reference se při zápisu neověřují — **NENÍ CHYBA (akceptováno)**

> **Verdikt 2026-06-13 (rozhodnutí uživatele):** ⚖️ **by-design / nebolí.** Dangling interní odkazy
> nemají reálný dopad — FE je řeší gracefully ([CD-07](cascade-delete-audit.md)), neexistující `allowedMemberId`
> se nezmatchuje, `calendarConfigId` má fallback. Fix by vyžadoval cross-module wiring s rizikem pádu
> startu na živé migraci → **rizikovější než problém**. Ponecháno jako akceptovaný stav, neopravuje se.
> _(Detail níže ponechán jako dokumentace povrchu.)_


- **Kde (3 potvrzené výskyty, čteno):**
  - [`world-news.service.ts:101,108`](../Projekt-ikaros/backend/src/modules/world-news/world-news.service.ts#L101) — `linkPageSlug` + `calendarConfigId` bez kontroly.
  - [`timeline.service.ts:168`](../Projekt-ikaros/backend/src/modules/timeline/timeline.service.ts#L168) — `pageSlug` bez kontroly.
  - [`campaign.service.ts:192-193`](../Projekt-ikaros/backend/src/modules/campaign/campaign.service.ts#L192) — `linkedPageSlug` + `linkedCharacterSlug` bez kontroly.
  - [`chat.service.ts:466`](../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L466) — `allowedMemberIds` (userIds) bez kontroly existence/membershipu.
- **Reframe `K-DI1`:** parent `worldId` je u běžných uživatelů ověřen *incidentálně* (`findById` v permission checku, viz world-news :280). Skutečná díra = (a) admin fast-path přeskočí i to, (b) **sekundární refs** (`linkPageSlug`, `calendarConfigId`, `linked*Slug`, `allowedMemberIds`, `preferredCalendarConfigId`), kterých se žádný permission check nedotkne → nikdy nevalidované.
- **Co zůstane:** dangling odkaz na neexistující stránku/kalendář/uživatele **hned při zápisu**. **Kde se projeví:** broken resolve / prázdno při dereferenci.
- **Vratné?** Ano (dočistit / re-link). **Návrh:** helper `assertRefExists(coll, id)` pro sekundární refs (4 potvrzené site sdílí jeden vzor → jedna oprava). Reálné dangling counts dá M-SCAN.
- **⏸️ ODLOŽENO (vědomě) 2026-06-13:** oprava vyžaduje **cross-module DI wiring** do 4 services (import pages/calendar repos) → riziko **circular dep / app-boot pádu**, které neumím ověřit bez spuštění běžící aplikace (a běží **živá migrace**). Navíc reálný dopad je **měkký**: dangling interní odkazy řeší FE **gracefully** ([CD-07](cascade-delete-audit.md), `useBrokenLinks` označí + blokuje klik), `allowedMemberIds` na neexistující usera je **neškodný** (nikdy se nezmatchuje), `calendarConfigId` má fallback. Severita na papíře 🟠, ale fix je rizikovější než problém. Doporučení: až bude možné ověřit běžící app, přidat **non-breaking variantu** (neexistující ref → ulož `null` + log, **nikdy throw**) — neriskne 400 rozbíjející tok.

### DI-03 🟠 `DUP`/`IDX` — očekávaná unikátnost bez DB indexu

- **Kde:** [`world-currencies.schema.ts:10-15`](../Projekt-ikaros/backend/src/modules/world-currencies/schemas/world-currencies.schema.ts#L10) — kódy měn v `items[]` (mixed array; embedded **nelze** indexovat na uniqueness). [`weather-generator.schema.ts:47-61`](../Projekt-ikaros/backend/src/modules/world-weather/schemas/weather-generator.schema.ts#L47) — `name` required, indexy `{worldId}` + `{worldId,displayOrder,createdAt}`, **žádný unique**.
- **Co zůstane:** dvě měny stejného kódu / dva generátory stejného jména per svět. **Kde se projeví:** nejednoznačnost při lookupu podle kódu/jména.
- **Vratné?** Ano (dedup). **Návrh:** weather → `{worldId,name}` unique index **po** dočištění existujících dup (jinak `createIndex` selže); currency code → app-level guard (embedded array nelze indexovat).
- **✅ ČÁSTEČNĚ OPRAVENO 2026-06-13:** currency dup guard v [`world-currencies.service.ts:59`](../Projekt-ikaros/backend/src/modules/world-currencies/world-currencies.service.ts#L59) `updateCurrencies` — in-memory check unikátnosti `code` před upsertem → `BadRequestException CURRENCY_CODE_DUPLICATE` (nejde indexovat embedded pole). +1 jest test. tsc 0, jest 68/68, lint čistý. **Zbývá:** weather generator `{worldId,name}` (potřebuje novou repo metodu + dedup existujících = až s M-SCAN; nižší dopad, name je display).

### DI-04 🟠 `AT` — kaskádní create bez transakce (partial write / orphan)

- **Kde:**
  - [`worlds.service.ts:329-385`](../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L329) — `create`: ~7 zápisů přes 6 kolekcí (`world→membership→currencies→weather→calendar→settings→diaryVersion`) bez session. Svět se tvoří **první** → selhání uprostřed = **neúplný svět** (degradovaný, dočistitelný re-seedem), ne orphan.
  - [`pages.service.ts:209-224`](../Projekt-ikaros/backend/src/modules/pages/pages.service.ts#L209) — persona/Lokace page: `charactersService.create` (emituje `character.created` → subdocs) **pak** `pagesRepo.save`. Dítě **dřív** než rodič → selže-li page save, **postava + subdocs orphan**; retry navíc narazí na `{worldId,slug}` unique → uživatel zaseknutý. **Horší případ.**
- **Co zůstane:** neúplný svět / osiřelá postava+subdocs. **Kde se projeví:** degradovaný svět nebo zablokovaný retry create. **Vratné?** Svět ano (re-seed); orphan postava ano (skript / dočištění). 
- **Návrh:** `pages.create` — pořadí obrátit (page first) nebo try/catch rollback `charactersService` při pádu page save; idempotentní re-run. `worlds.create` — best-effort přijatelný (parent-first), ale doplnit cleanup neúplných světů. Mongo cross-collection transakce vyžaduje replica set (viz fallback vzor membership approve).
- **✅ OPRAVENO 2026-06-13 (pages.create):** [`pages.service.ts:208-258`](../Projekt-ikaros/backend/src/modules/pages/pages.service.ts#L208) — `pagesRepo.save` obaleno try/catch; selže-li PO vytvoření Character (`createdCharacterSlug`), rollback přes `charactersService.delete(slug, worldId)` (emituje `character.deleted` → existující cascade uklidí subdocs), pak rethrow. +2 jest testy (rollback / předaný ref se nemaže). tsc 0, jest 68/68, lint čistý. **Zbývá:** `worlds.create` (parent-first → jen neúplný svět, ne orphan; cleanup neúplných světů — nižší priorita).

### DI-05 🟡 `INV`/`MIR` — `world.playerCount` decrement-only (half-maintained counter)

- **Kde:** [`worlds.service.ts:1627`](../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L1627) — `increment(worldId, 'playerCount', -1)` na opuštění světa (jen role `Hrac`). Init [:334](../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L334) (`dto.playerCount ?? 0`). Grep `playerCount` přes celý worlds modul = **žádný `+1`** (approve/join playerCount netknou). Read serveruje stored hodnotu ([`worlds.repository.ts:217`](../Projekt-ikaros/backend/src/modules/worlds/repositories/worlds.repository.ts#L217)), ne computed.
- **Co je špatně:** counter se snižuje na leave, ale **nezvyšuje na join** → monotónně se rozchází s reálným počtem (může jít do záporu). **Kde se projeví:** lživé „X hráčů" v UI. **Vratné?** Ano (recompute z membershipů).
- **Návrh:** buď `+1` na approve/join (symetrie), nebo zrušit stored counter a počítat z `countMemberships(worldId, role:Hrac)` při čtení (eliminuje drift úplně). Závažnost 🟡 — display, ne logika/access.
- **✅ OPRAVENO 2026-06-13 (rozhodnutí uživatele: `playerCount` = automatický počet, ruční nastavení byl bug → pryč):**
  - **Ruční nastavení odebráno:** `playerCount` smazán z [`create-world.dto.ts`](../Projekt-ikaros/backend/src/modules/worlds/dto/create-world.dto.ts#L38) i [`update-world.dto.ts`](../Projekt-ikaros/backend/src/modules/worlds/dto/update-world.dto.ts#L39) (ValidationPipe whitelist FE-poslaný field tiše zahodí); create inicializuje `playerCount: 0`. (`maxPlayers` = kapacita zůstává ruční, legitimní.)
  - **Auto-counter dokončen:** čtením zjištěno, že žádný membership nevzniká jako `Hrac` (na Hrac se **povyšuje** přes `updateMemberRole`). Doplněna instrumentace [`worlds.service.ts:1257`](../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L1257): povýšení na Hrac → `+1`, degradace z Hrac → `−1` (párově k existujícímu `−1` na leave/remove :1626). Pokrytí úplné (jediná cesta do/z Hrac).
  - +3 jest testy (povýšení/degradace/bez-Hrac). tsc 0, jest 113/113, lint čistý.
  - **⚠️ Zbývá (potřebuje DB):** existující uložené `playerCount` jsou pořád špatné (drift z minulosti) → jednorázový **recompute backfill** (`worlds.playerCount = count(memberships role:Hrac)`) až bude M-SCAN connection. Od teď se ale už nerozjíždí.

### ✅ Refutováno / by-design (seedy ověřené čtením — NEjsou nálezy)

- **K-DI12** `SET` — self-ref cyklus složek atlasu: [`world-maps.service.ts:219-225`](../Projekt-ikaros/backend/src/modules/world-maps/world-maps.service.ts#L219) má self-parent guard + `isDescendant` cyklus guard; delete reparentuje děti ([:274](../Projekt-ikaros/backend/src/modules/world-maps/world-maps.service.ts#L274)). Cyklus ošetřen. _(campaignShopGroups = jen 2 úrovně, strukturálně bez cyklu — doověřit nízká priorita.)_
- **K-DI2** `RR` (rename propagace) — z velké části absorbováno: `characterPath` **se propaguje** ([`worlds.service.ts:1896-1961`](../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L1896), listenery keyed na userId); **page slug je immutable** (update nepřepisuje slug → žádný rename); world slug má `previousSlugs[]` redirect ([:509](../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L509)). Reziduum: calendar-slug rename (neověřeno, nízká priorita). Break slug-FK = jen přes **delete** → pokryto DI-02 + [cascade-delete](cascade-delete-audit.md).
- **K-DI5** `MIR` — `membership.avatarUrl` **se syncuje** s obrázkem postavy (`character.updated` listener nastavuje `avatarUrl: payload.imageUrl`, [`worlds.service.ts:1934`](../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L1934)). „Statický snapshot" z Explore neplatí.

| ID | Záv. | Osa | Patro | Stav |
|---|---|---|---|---|
| DI-01 | 🟡 | `TYPE` | 3 | 🐛 potvrzeno (L2), de-eskalováno z 🔴; oprava nízká priorita |
| DI-02 | ⚖️ | `RR`/`WV` | 1 | ⚖️ **NENÍ CHYBA** (rozhodnutí uživatele — nebolí, FE-mitigováno) |
| DI-03 | 🟠 | `DUP`/`IDX` | 1 | ✅ **currency opraveno** (guard+test); weather zbývá (M-SCAN dedup) |
| DI-04 | 🟠 | `AT` | 1 | ✅ **pages.create opraveno** (rollback+2 testy); worlds.create zbývá |
| DI-05 | 🟡 | `INV`/`MIR` | 2 | ✅ **opraveno** (ruční set pryč + auto +1/−1 +3 testy); backfill zbývá (DB) |
| K-DI2/5/12 | — | — | — | ✅ refutováno / by-design (event-listener sync) |

> **Opraveno 2026-06-13** (BE, ověřeno `tsc` 0 + `jest` 113/113 + `eslint` čistý; **necommitnuto — git ručně**):
> **DI-03** [`world-currencies.service.ts`](../Projekt-ikaros/backend/src/modules/world-currencies/world-currencies.service.ts#L59) dup guard ·
> **DI-04** [`pages.service.ts`](../Projekt-ikaros/backend/src/modules/pages/pages.service.ts#L208) rollback ·
> **DI-05** auto playerCount ([dto](../Projekt-ikaros/backend/src/modules/worlds/dto/create-world.dto.ts#L38) + [updateMemberRole](../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L1257)).
> ⚖️ **DI-02 = není chyba** (akceptováno). DI-01 nízká priorita. **Zbývá (DB):** weather dedup+index, worlds.create cleanup, playerCount backfill.

---

## Zbývá ověřit

- **M-TYPE první** — type detektor přes všechna FK pole; potvrdit `custom_emotes` minu + projít zbytek.
- **M-SCAN** — spustit [`tools/integrity-scan.md`](db-integrity-plan/tools/integrity-scan.md) proti dev/staging, pak svět `matrix` → reálná čísla orphan/dangling/dup/invariant.
- **M-IDX** — `getIndexes()` vs schema (oblast 00/C): existují unique indexy reálně? nese migrace dup, co by `createIndex unique` dnes odmítl?
- **Oblasti 01–06** — sweep po kouskách (NEzastavovat, [project_15_test_styles]): 01 refs · 02 dup · 03 write-prevence · 04 migrace · 05 mirror/shape · 06 invarianty.
- **Přesah s cascade-delete** — `OR`/`RR` sdílené s CD-04/08/09; křížově odkázat (M2), nezdvojovat verdikty.

---

## Legenda

- 🔴 kritická · 🟠 střední · 🟡 nízká · ⚪ kosmetika · ⚖️ by-design / přijatý dluh
- 🐛 potvrzeno · ✅ opraveno/vyvráceno · ⬜ k ověření · `K-DIx` seed kandidát (hypotéza)
- **Patro:** 1 strukturální · 2 sémantické · 3 reprezentační
