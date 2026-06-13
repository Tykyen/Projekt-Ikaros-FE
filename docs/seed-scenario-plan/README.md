# Seed scenario smoke — projde aplikace celý životní cyklus jako jedna složená zápletka?

> **Účel:** postavit **jeden hlavní automatický průchod aplikací** — lineární zápletku, která vytvoří
> uživatele → svět → člena → stránku → postavu → chat → mapu, ověří oprávnění a nakonec všechno smaže —
> a u **každého přechodu** tvrdě ověřit, že se nevyrobil jen HTTP 200, ale **správný stav napříč celým
> stackem**: tvar entity, všechny side-effecty, žádný orphan, drží oprávnění, uklidí se to. Cílová
> otázka:
> „když projdu aplikaci tak, jak ji projde reálná session — **složí se všechny díly dohromady**, nebo se
> rozpadnou na spáře, kterou žádný izolovaný audit nevidí?"
>
> Devátý sourozenec [`bug-plan/`](../bug-plan/README.md), [`ws-contract-plan/`](../ws-contract-plan/README.md),
> [`role-plan/`](../role-plan/README.md), [`form-schema-plan/`](../form-schema-plan/README.md),
> [`cache-plan/`](../cache-plan/README.md), [`state-consistency-plan/`](../state-consistency-plan/README.md),
> [`cascade-delete-plan/`](../cascade-delete-plan/README.md) a [`db-integrity-plan/`](../db-integrity-plan/README.md).
> **Jako jediný z devíti je SPUSTITELNÝ** — ostatních osm je statická analýza jedné starosti napříč moduly
> (breadth-first sweep). Tenhle jde **depth-first podél kritické cesty** a vyrábí živý **zelený/červený
> signál**, ne statický registr. Je to **integrační zámek**: u každého uzlu znovu ověří přesně tu starost,
> kterou každý předchozí audit řešil izolovaně — ale teprve tady se ukáže, jestli díly **skládají**.
>
> **Stav:** zahájeno 2026-06-13. Plán napsán, scénář nepostaven. Nálezy → [`../seed-scenario-audit.md`](../seed-scenario-audit.md) (ID `SS-xx`).

---

## Proč samostatný plán (co ostatních 8 auditů míjí)

Každý z předchozích osmi auditů řeže systém **vodorovně** — vezme jednu starost (zápis, oprávnění, cache,
real-time, obnovu, mazání, integritu DB) a prožene ji **všemi moduly**. Žádný nejde **svisle**: vzít jednu
reálnou session a projít ji **od první registrace po finální mazání jako jeden řetěz**. A přesně na
**spárách mezi kroky** žije třída chyb, kterou vodorovný sweep z principu nevidí:

| Slepá skvrna | Příklad reálného rizika v Ikarovi | Dopad |
|---|---|---|
| **Side-effect chybí** | svět se vytvoří, ale `world→membership→currencies→calendar` selže na #3 → svět bez kalendáře | 🔴 degradovaný svět, nikdo nevidí |
| **Kompozice selže** | persona stránka tvoří postavu **před** uložením stránky → spadne page save → osiřelá postava+subdocy | 🔴 orphan už při zrodu (DI-04) |
| **Counter drift** | approve hráče nezvedne `playerCount` → „X hráčů" lže od první session (DI-05) | 🟠 lživé číslo |
| **Spára mezi moduly** | přiřazení postavy členovi má vyrobit auto soukromou konverzaci v chatu — vyrobí? | 🟠 chybějící vazba |
| **Selhání uprostřed kaskády** | happy-path NIKDY nespustí failure větev → rollback/atomicita **netestovaná** | 🔴 neznámý stav po pádu |
| **Souběh** | 2 hráči join naráz, double-approve → dvojí membership (unique index drží pod závodem?) | 🟠 duplicita |
| **Tenant leak** | obsah/chat/mapa světa A se zobrazí členovi světa B | 🔴 bezpečnostní leak |
| **Tichý drop** | FE pošle pole, `ValidationPipe whitelist` ho **tiše zahodí** → 200, ale data chybí | 🟠 neviditelná ztráta |
| **Mazání nedotáhne** | smažu svět → zůstanou postavy/bloby/dangling refs → leak navždy | 🔴 trvalý orphan/leak |

> 💡 **Závěr:** osm auditů ověřuje, že každý díl **čte správně izolovaně**. Žádný neověřuje, že **díly
> skládají dohromady v pořadí reálné session** — a že **failure/souběh/izolace/mazání** drží, ne jen
> šťastná cesta. Tahle vrstva je navíc jediná, co po sobě nechá **opakovatelný spustitelný artefakt**
> (zelený = stack reálně funguje top-to-bottom), ne jen dokument.

---

## Spine + assertion lattice (páteř + mřížka tvrzení)

📚 **Dvě osy najednou.** **Páteř** = jedna lineární zápletka (kanonický seed: 1 PJ, 1 hráč, 1 svět,
protékající všemi entitami v pořadí, jak je session použije). **Mřížka** = u **každého uzlu** páteře
tvrdím **13 dimenzí** (osy níže). Páteř dává *smoke* (projde to vůbec?), mřížka dává *hloubku* (a vyrobil
se správný stav?). Osy se **1:1 mapují na předchozích 8 auditů** — proto je tohle integrační zámek, ne
devátý nezávislý sweep.

> ⚠️ **Happy-path ≠ rigor.** Páteř sama je jen smoke. Hloubku dělají osy `FA` (selhání uprostřed), `RC`
> (souběh), `IS` (izolace 2 světů) — ty happy-path **z definice nikdy nespustí**, a přitom přesně tam
> žijí reálné nálezy (atomicita, race, leak). Bez nich je tohle jen hezčí `backend-smoke-test.ts`.

---

## Prior art (co už existuje a co míjí)

> ⚠️ Smoke test už zčásti **existuje** — stavíme na něm, neduplikujeme.

| Artefakt | Co dělá | Co míjí |
|---|---|---|
| [`scripts/backend-smoke-test.ts`](../../../Projekt-ikaros/scripts/backend-smoke-test.ts) (`npm run smoke:be`) | HTTP black-box: health → 2 useři → svět → page/character/npc/event/timeline/weather/news → role-gating 403 → smaž svět | členství (approve/role/playerCount), **chat, mapa**, mazání jako **kaskáda** (jen „smaž", ne ověření úklidu), **DB-introspekce**, failure/race/izolace |
| [`test/worlds-join.e2e-spec.ts`](../../../Projekt-ikaros/backend/test/worlds-join.e2e-spec.ts) (`npm run test:e2e`) | in-process multi-modul: register → world → join/access-request → approve | vše po approve (page/character/chat/mapa), hloubková tvrzení, mazání |
| [`test/smoke-full-app.e2e-spec.ts`](../../../Projekt-ikaros/backend/test/smoke-full-app.e2e-spec.ts) | jen bootstrap AppModule (60s) | žádný flow |

> 💡 **Pozice tohoto auditu:** (a) **dotáhne lifecycle** (přidá členství/chat/mapu/mazání), (b) přidá
> **hloubkovou mřížku** (SE/AC/IN/CL + deep osy + DB-introspekce po každém kroku), (c) udělá z toho
> **udržovaný auditní artefakt** s registrem. Starý HTTP smoke ponecháme jako doplňkový „reálně zapojený
> stack" check (guardy/pipy proti běžícímu procesu) — cross-ref, ne kopie.

---

## Kontrolní osy (13 — 7 jádrových + 6 hloubkových)

### Jádro (tvrzeno u každého uzlu)
| Osa | Zkr | Otázka | Dědí z auditu |
|---|---|---|---|
| **Shape/existence** | `EX` | vznikla entita se správným tvarem + status code? | form-schema |
| **Side-effects** | `SE` | vznikly **všechny** child/mirror/countery, co krok má vyvolat? | form-schema · db-integrity |
| **Access (negativní)** | `AC` | špatná role → 403/404, leak-safety drží, **R-20** (platform admin nemá moc ve světě) | role · auth-policy |
| **Integrity** | `IN` | po kroku **0 orphanů/dangling**; FK + slug cíle resolvují | db-integrity |
| **Realtime/cache** | `RT` | event/broadcast/invalidace, co krok má vyvolat (přes **výsledek** + wire-level v L5) | ws · state-consistency · cache |
| **Idempotence** | `ID` | re-run scénáře čistý, **deterministický seed**, žádný dup | nový |
| **Cleanup** | `CL` | finální mazání uklidí **celý strom** (orphan/dangling/blob = 0) | cascade-delete |

### Hloubka (skok ze smoke na gauntlet)
| Osa | Zkr | Konkrétní tah | Co reálně chytí |
|---|---|---|---|
| **Fault injection** | `FA` | vynuť throw uprostřed kaskády (page save spadne PO create character) → assert rollback, 0 orphanů | DI-04 fix; happy-path failure větev |
| **Souběh/race** | `RC` | 2 join naráz, double-approve, double-delete, paralelní create stejného slugu | unique index pod závodem (K-DI11-IDX), idempotence |
| **Tenant izolace** | `IS` | **2 světy + 2 PJ** → assert 0 cross-leak (obsah/chat/mapa A neuteče do B) | nejvyšší bezpečnostní vlastnost; 1-světová zápletka ji nechytí |
| **Reverzibilita** | `RB` | create → soft-delete → **restore → assert PLNĚ intaktní** → hard-delete; A→B→A | recovery round-trip (cascade P5), [feedback_persist_across_variants] |
| **Observabilita** | `OB` | hook na logger → fail na error-log nebo **tichý ValidationPipe drop** během happy kroku | „200 ale tiše zahodil pole" ([feedback_be_restart_required]) |
| **Čas/cron** | `TM` | fast-forward hodin → spusť crony: 30d world hard-delete, 24h game-event archive | časově hradlené přechody „později" (project_game_events_archive_policy) |

`EX`/`SE` jsou osy **kompozice** (vyrobilo se to a všechny následky?). `AC`/`IS` osy **bezpečnosti**
(nikdo navíc nesmí). `IN`/`CL` osy **integrity** (žádný orphan teď ani po smazání). `FA`/`RC`/`TM` osy
**nešťastných cest** (selhání, souběh, čas). `RB`/`ID` osy **opakovatelnosti**. `OB` osa **tichých
selhání** (200 to schová).

---

## Hloubkové perspektivy (perspektivy běhu)

### P1 — Kanonický seed-builder (páteř) — fixture jednou, použij všude
Jeden deterministický builder vyrobí **kanonický svět** (PJ + hráč + svět + page + persona page + PC +
NPC + chat group/channel/message + scéna + token + přiřazení). Vrací handle na všechna ID. Tohle je
seed sdílený napříč všemi režimy (happy, fault, race, isolation, parametric). Detail → [oblast 00](00-cross-cutting.md).

### P2 — Per-uzel assertion mřížka — tvrdý důkaz kompozice
Po každém kroku páteře spusť relevantní podmnožinu 13 os: HTTP tvar (`EX`), **přímý dotaz na živé
`connection`** (`SE`/`IN` — child kolekce, countery, kardinalita), negativní volání špatnou rolí (`AC`).
`connection` z [`createTestApp`](../../../Projekt-ikaros/backend/test/helpers/app-factory.ts#L87) dává
in-process přístup k DB → orphan/count tvrzení jsou **L4 už v testu**, ne až externím scanem.

### P3 — Failure & souběh harness (`FA`/`RC`) — gauntlet
`FA`: jest spy na repo/service metodu → `mockRejectedValueOnce` v půlce kaskády → assert konzistentní
stav (rollback nebo žádný partial orphan). `RC`: `Promise.all` paralelních volání téhož endpointu →
assert přesně jeden uspěje / unique index drží. **Vyžaduje `MongoMemoryReplSet`** (transakce) — viz pasti.

### P4 — Tenant izolace (`IS`) — druhá zápletka
Postav **dva** kanonické světy (PJ-A, PJ-B, hráč v jednom). Pro každý read endpoint světa B volaný
identitou ze světa A assert **403/404/prázdno** — nikdy únik obsahu/chatu/mapy/členů. Pokrývá leak-safe
vzory (universe signal, locked AKJ, chat access) v **reálné kompozici**, ne izolovaně.

### P5 — Migrace-parita (`MG`) — nejaktuálnější
Postav **stejný kanonický svět přes importery F1–F12** (zápis mimo services → obešel write-validace) a
prožeň ho **toutéž mřížkou** + diff normalizovaného stavu proti service-buildu. Přímo na živý risk
**K-DI4** (migrace = #1 zdroj orphanů). Terč: svět `matrix`. Detail → oblast 10.

### P6 — Parametrický režim (`PB`) — matice seedů
Prožeň páteř přes `{systém: matrix/dnd} × {access: public/private/closed} × {persona: on/off}`. Chytí
per-system layout přepínání (project_takticka_mapa_multi_system, schema engine) a access-mode větve.
Detail → oblast 11.

### Dopad / závažnost (povinné u každého nálezu)
Ikaros **běží s reálnými uživateli a čerstvě migrovanými daty**. U každého nálezu uveď **na kterém uzlu**
páteře selhal (krok), **kterou osu** porušil (chybí side-effect / leak / orphan / partial po pádu),
**reprodukovatelnost** (deterministicky / jen pod race) a **vratné?**.

---

## Metody ověření + úrovně jistoty

| Kód | Metoda | Nástroj |
|---|---|---|
| **M1** | Statické čtení — controller/service/cascade, co krok má udělat | Read/Grep |
| **M-E2E** | Spuštěný scénář — supertest HTTP přes [`createTestApp`](../../../Projekt-ikaros/backend/test/helpers/app-factory.ts) | jest `test:e2e` |
| **M-DB** | In-process introspekce — dotaz na živé `connection` po každém kroku (orphan/count/kardinalita) | mongoose connection |
| **M-FAULT** | Fault injection — jest spy `mockRejectedValueOnce` v kaskádě → stav po pádu | jest spy |
| **M-RACE** | Souběh — `Promise.all` paralelních volání → unique/idempotence | supertest |
| **M-INFRA** | Reálná docker infra — Cloudinary test-folder / Meili / Redis → blob fakt zmizel | docker + API |
| **M-MUT** | Mutation testing — Stryker zmutuje kód, ověří že scénář zčervená | Stryker |
| **M-MIG** | Migrace-parita — build přes importery, diff vs service-build | migrate skripty |
| **M2** | Cross-ref — sdílené nálezy s [db-integrity](../db-integrity-audit.md)/[cascade](../cascade-delete-audit.md)/[role](../role-audit.md) | čtení |

| Úroveň | Co znamená | Důkaz |
|---|---|---|
| **L1** | scénář napsán — vypadá, že projde | nejslabší |
| **L2** | happy-path zelený — celá linka 200, entity vznikly (**smoke OK**) | průchod prokázán |
| **L3** | + side-effect & negativní tvrzení zelená (`SE`/`AC`/`RT` přes výsledek) | kompozice + bezpečnost |
| **L4** | + **DB-introspekce po každém kroku** (`IN`) + **cleanup verify = 0 orphanů** (`CL`) + `FA`/`RC` zelené | tvrdý integrační důkaz |
| **L5-infra** | běh proti **reálné docker infře** → blob/Meili/Redis side-effect fakt nastal (chytí K-CD1/2/3) | externí pravda |
| **L5-teeth** | **mutation testing** — scénář prokazatelně **zčervená** při zmutovaném kódu | důkaz síly testu |

**Cíl (varianta Maximum):** páteř + jádro na **L4**; `FA`/`RC` na L4 (po replica-set upgradu); blob/`EX`
externí na **L5-infra**; celý scénář projde **L5-teeth** (má zuby). `MG`/`PB` jako samostatné běhy.

---

## Baseline + pasti prostředí

| Check | Repo | Stav | Pozn. |
|---|---|---|---|
| **`MongoMemoryReplSet` místo standalone** | BE test | ⬜ **BLOKER pro `FA`/`RC`** | [`db.ts:11`](../../../Projekt-ikaros/backend/test/helpers/db.ts#L11) = single-node → transakce no-op/throw |
| `socket.io-client` devDep | BE | ⬜ chybí | wire-level `RT` (L5) |
| `@stryker-mutator/core` devDep | BE | ⬜ chybí | `M-MUT` L5-teeth |
| Cloudinary test-folder + cleanup | BE | ⬜ | `M-INFRA` blob pravda; nesmí špinit prod |
| seed-builder fixture | BE test | ⬜ postavit (oblast 00) | kanonický svět, deterministický |
| existující e2e baseline | BE | ✅ [`worlds-join`](../../../Projekt-ikaros/backend/test/worlds-join.e2e-spec.ts) + helpery | vzor pro páteř |

⚠️ **Pasti (z paměti + recon):**
- 🔴 **Replica set:** harness je standalone Mongo → každá cesta s `session.startTransaction()` (membership
  approve, finance transfer, kaskádní fixy [DI-04](../db-integrity-audit.md)) v testu **neběží jako tx**.
  `FA`/`RC` na L4 vyžaduje přepnout `db.ts` na `MongoMemoryReplSet`. **První krok harness upgrade.**
- `ValidationPipe { whitelist: true }` ([`app-factory.ts:83`](../../../Projekt-ikaros/backend/test/helpers/app-factory.ts#L83)) **tiše dropne** neznámá pole → `OB` osa to musí aktivně detekovat (pošli pole navíc → assert chybí v DB).
- Po BE změně **restart**; jest ručně, ne jen precommit ([feedback_be_precommit_prettier]).
- **Page+Character sjednoceny** (9.1) — persona/Lokace page tvoří Character ([project_pages_character_unification], project_lokace_kalendar) → klíčový `SE`/`FA` uzel (oblast 04).
- **R-20** ([project_admin_world_governance]): platform Admin/Superadmin **nemá moc uvnitř světa** → `AC` negativní tvrzení (admin ze světa A neřídí svět B).
- `api.get` obaluje params, mutace berou `worldId` z path/body ([project_api_client_params_contract]) — scénář volá BE přímo (supertest), ne přes FE client; respektovat tvar.
- **Přesah:** `IN`/`CL` sdílí povrch s [db-integrity](../db-integrity-audit.md) (DI-04/05) a [cascade-delete](../cascade-delete-audit.md) (CD-04..10) — scénář je **prokazuje za běhu** (L4 v kompozici), nezdvojovat verdikty, křížově odkázat (M2).

---

## Seed kandidáti (z předchozích auditů na kritické cestě — verdikt až při běhu)

> Hypotézy. Běh každý povýší na `🐛 SS-xx`, `✅ shoda` nebo `⚖️ by-design`. Detail → [`../seed-scenario-audit.md`](../seed-scenario-audit.md).

- **K-SS1** `FA`/`SE` 🔴 — svět: `world→membership→currencies→weather→calendar→settings` bez tx ([DI-04](../db-integrity-audit.md)) → vynuť pád #3, assert úplný-nebo-čistý svět. Oblast 02.
- **K-SS2** `SE`/`INV` 🟠 — approve na Hrac má zvednout `playerCount +1` ([DI-05](../db-integrity-audit.md)); assert counter = real count. Oblast 03.
- **K-SS3** `FA` 🔴 — persona page tvoří Character **před** page save → vynuť pád page save, assert **0 osiřelých postav+subdocs** (DI-04 rollback). Oblast 04.
- **K-SS4** `SE`/`CARD` 🟠 — postava → subdocy (diary/finance/inventory/notes/accounts) **přesně 1× od typu** (K-DI11). Oblast 05.
- **K-SS5** `CL`/`RR` 🔴 — smaž scénu → `membership.currentSceneId` musí být **vyčištěno** (CD-04), jinak hráč na mrtvé mapě. Oblast 07/09.
- **K-SS6** `SE` 🟠 — přiřazení postavy členovi má vyrobit **auto soukromou konverzaci** v kanálu Postavy (chat 6.7); assert vznikla. Oblast 03/06.
- **K-SS7** `RB` 🟠 — soft-delete světa je **recovery-safe** (chat se nemaže destruktivně, [project_world_soft_delete]) → restore → assert PLNĚ intaktní. Oblast 09.
- **K-SS8** `CL` 🔴 — hard-delete světa → [integrity-scan](../db-integrity-plan/tools/integrity-scan.md) podmnožina = **0 orphanů/dangling** (cascade-delete). Oblast 09.
- **K-SS9** `AC` 🔴 — negativní mřížka: Hrac dostane **403** na create obsahu / approve / delete; R-20 (admin cizího světa). Oblast 08.
- **K-SS10** `RC`/`ID` 🟠 — double-join / double-approve / paralelní create slugu → unique index `{userId,worldId}`/`{worldId,slug}` drží (K-DI11-IDX). Oblast 03/05.
- **K-SS11** `IS` 🔴 — 2 světy: žádný obsah/chat/mapa/člen světa A viditelný identitě světa B (0 cross-leak). Oblast 08.
- **K-SS12** `MG` 🔴 — svět postavený importery (mimo services) projde **stejnou mřížku** + diff vs service-build (K-DI4). Oblast 10.
- **K-SS13** `OB` 🟠 — pošli pole navíc → assert `ValidationPipe` ho dropnul tiše + žádný error-log během happy kroku. Oblast 00/all.
- **K-SS14** `TM` 🟡 — fast-forward 30d → world hard-delete cron fires + idempotentní re-run (SH). Oblast 09.

---

## Index oblastí (12)

| # | Oblast | Jádro povrchu | Osy / perspektivy |
|---|---|---|---|
| 00 | [Cross-cutting](00-cross-cutting.md) | harness (replica-set upgrade), seed-builder, assertion helpery, dimension katalog, fault/race/iso mechanika, L5 setup, teardown | všechny · P1 P2 P3 |
| 01 | [Uživatel](01-uzivatel.md) | register PJ+hráč, login, JWT, refresh, self-delete gate | `EX` `AC` `OB` · P2 |
| 02 | [Svět](02-svet.md) | create + **seed side-effecty** (membership/currencies/calendar/settings/diary), atomicita | `SE` `FA` `IN` · P2 P3 |
| 03 | [Člen](03-clen.md) | join/access-request → approve → role Hrac → **playerCount** → přiřazení postavy → auto konverzace | `SE` `RC` `RT` · P2 P3 |
| 04 | [Stránka](04-stranka.md) | create page; **persona/Lokace → character side-effect + rollback** | `SE` `FA` `IN` · P2 P3 |
| 05 | [Postava](05-postava.md) | PC/NPC/Bestie; **subdocy kardinalita 1×**; přiřazení vlastníka | `SE` `CARD` `RC` · P2 |
| 06 | [Chat](06-chat.md) | group(kanál)+channel(konverzace)+message; auto soukromá konverzace; access gating | `SE` `AC` `RT` · P2 P4 |
| 07 | [Mapa](07-mapa.md) | scéna + token + assign (currentSceneId) + HP/visibility | `SE` `RT` `IN` · P2 |
| 08 | [Oprávnění + izolace](08-opravneni-izolace.md) | negativní mřížka (Hrac 403, R-20, leak-safe) + **2 světy cross-leak** | `AC` `IS` · P4 |
| 09 | [Mazání](09-mazani.md) | soft→restore→hard kaskáda; 0 orphanů; per-entita delete; cron fast-forward | `CL` `RB` `TM` · P2 P3 |
| 10 | [Migrace-parita](10-migrace-parita.md) | build přes importery F1–12, diff vs service-build, scan světa matrix | `MG` `IN` · P5 |
| 11 | [Parametrický režim](11-parametricky.md) | matice {systém}×{access}×{persona}, per-system layout | `PB` · P6 |

---

## Legenda statusů

- ⬜ netestováno · ✅ ověřeno OK · 🐛 nález → [`../seed-scenario-audit.md`](../seed-scenario-audit.md) (`SS-xx`) · ⚠️ podezřelé · ⏭️ blokované/`[human]`
- `K-SSx` seed kandidát (hypotéza)

## Pracovní postup

1. **Harness upgrade** — `db.ts` → `MongoMemoryReplSet` (odblokuje `FA`/`RC` tx); přidat `socket.io-client` + Stryker devDeps. Oblast 00.
2. **Seed-builder** — kanonický deterministický svět jako fixture (P1). Oblast 00.
3. **Páteř (L2)** — lineární happy-path průchod 01→09, každý krok 200 + entita vznikla (smoke).
4. **Mřížka (L3→L4)** — per-uzel `SE`/`AC`/`IN` + DB-introspekce; cleanup verify (0 orphanů).
5. **Gauntlet** — `FA` (fault injection), `RC` (race), `IS` (2 světy izolace).
6. **L5** — `M-INFRA` (reálný Cloudinary/Meili blob), `M-MUT` (Stryker — má scénář zuby?).
7. **`MG`/`PB`** — migrace-parita (svět matrix) + parametrická matice.
8. **Nález → `SS-xx`** s **uzel / osa / reprodukce / vratné?**; neopravovat tiše, opravy gated (souhlas).
