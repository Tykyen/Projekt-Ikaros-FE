# Race-condition audit — registr nálezů (15. styl)

> Plán: [`race-condition-plan/`](race-condition-plan/README.md). Druhý **spustitelný** audit.
> Souběhovou chybu dokazuje **deterministický interleave** (Barrier/Gate), ne probabilistický `Promise.all`.
> Verdikt vzniká **z běhu** testu: 🐛 test červený dokud bug žije = potvrzený nález; ✅ invariant drží.
>
> **Stav:** zahájeno 2026-06-15. Harness + 4 oblasti hotové. 13 závodů opraveno (E1-E5, P1/P2/P4, R2/R3, D1/D2/D3/D6), 4 hypotézy vyvráceny. Race e2e 26/26.

## Statusy
⬜ netestováno · 🔬 běh probíhá · 🐛 POTVRZENO (test červený) · ✅ invariant drží · ⚖️ by-design · ⏭️ blokované

## Třídy: LU lost-update · TOCTOU check-then-act · DP double-processing · WS write-skew · PH phantom/orphan · CD counter-drift · AT atomicita · SR stale-role

---

## Oblast 01 — Ekonomika

| ID | Třída | Sev | Uzel | Popis | Stav |
|---|---|---|---|---|---|
| RC-E1 | TOCTOU | 🔴 | campaign-purchase.service.ts:144 | balance check read-then-act bez floor → 2 nákupy → záporný zůstatek | 🐛 POTVRZENO (−60) → ✅ **OPRAVENO** (atomický `appendTransactionIfSufficient` `$gte`) |
| RC-E2 | DP | 🔴 | campaign-purchase.service.ts:228 | `status!=='active'` ne-atomický → 2 storna → peníze 2× | 🐛 POTVRZENO (2×) → ✅ **OPRAVENO** (atomický `markRefundedIfActive` flip) |
| RC-E3 | LU | 🟠 | character-accounts.service.ts:410 | `undoLast` read→`$set` slice → vklad mezi read↔write zmizí | 🐛 POTVRZENO (vklad zmizel) → ✅ **OPRAVENO** (`withTransaction` + replSet fallback) |
| RC-E4 | LU | 🟠 | campaign-purchase.service.ts:315 | inventář full `sections` `$set` → 2 nákupy → položka zmizí | 🐛 POTVRZENO (Received:1, položka zmizela) → ✅ **OPRAVENO** (atomický `appendItemToSection` `$push` na sekci/položku přes native driver, ne full-array `$set`; race `RC-E4` 1/1) |
| RC-E5 | AT | 🔴 | campaign-purchase.service.ts | nákup 3 moduly bez tx → pád → položka+peníze pryč, bez storno-záznamu | 🐛 POTVRZENO (pád kroku 3 = balance ↓, 0 purchase logů → peníze pryč, nestornovatelné) → ✅ **OPRAVENO** (3 kroky v `withTransaction` + replSet fallback se SEKVENČNÍ plnou kompenzací i kroku 3; vzor RC-E3; race `RC-E5` 1/1 — tx rollback: `after==before` ∧ purchaseCount 0) |
| RC-E6 | WS | ⚖️ | character-accounts.service.ts:424 | transfer bez balance floor → přečerpání | ⬜ |

**Pozitivní kontroly ✅ (běh 2026-06-15):** baseline 10× `adjust(+1)` → balance 10 (atomický `$inc` drží) · conservation 20× transfer A→B → součet konstantní (`withTransaction` drží). Harness nedává falešně červenou.

**Harness oprava (2026-06-15):** `test/helpers/app-factory.ts` — AppModule se importuje lazy přes `require` až po `process.env.MONGODB_URI` setupu (jinak `ConfigModule.forRoot` zmrazí `.env` localhost při importu → test se připojí na localhost:27017 místo in-memory replSet). **Odblokovává i seed-scenario** (stejný harness).

## Oblast 02 — Stránky

| ID | Třída | Sev | Uzel | Popis | Stav |
|---|---|---|---|---|---|
| RC-P1 | LU | 🟠 | pages.service.ts:302 | optimistic `expectedUpdatedAt` app-level mezi read↔write (ne atomický) → souběžné edity stejné verze obě projdou → tichý lost update | 🐛 POTVRZENO (conflicts=0) → ✅ **OPRAVENO** (atomický `updateIfUnchanged` cond. na `updatedAt`) |
| RC-P2 | LU | 🟠 | pages.service.ts:367 | sekce/akjTabs/granty full-array `$set` → souběžný grant+grant = přístup zmizí | 🐛 POTVRZENO (bez cond. conflicts=0, grant zmizí) → ✅ **KRYTO RC-P1 fixem** (`updateIfUnchanged` cond. na `updatedAt`; editor grant save vždy posílá `expectedUpdatedAt` → 2 souběžné granty stejné verze: 1 projde, 1× 409; race `RC-P2` 1/1). Bez nového produkčního kódu — test guard. |
| RC-P3 | TOCTOU | 🟡 | pages.service.ts (create) | slug `exists` check→save; 2. zápis E11000 | ✅ **DRŽÍ** (dup → čistý 409, 1 stránka, žádné 500; hypotéza vyvrácena) |
| RC-P4 | PH | 🟡 | pages.service.ts:414 | update po delete → `updated!` null jako Page → 200-s-null místo 404 | 🐛 POTVRZENO (200 null) → ✅ **OPRAVENO** (null-guard → 404) |

## Oblast 03 — Role / členství

| ID | Třída | Sev | Uzel | Popis | Stav |
|---|---|---|---|---|---|
| RC-R1 | TOCTOU/WS | 🟠 | worlds.service.ts:1258 | „svět bez PJ" přes demote | ✅ **DRŽÍ** (owner role immutable → ≥1 PJ vždy; oba demote 403; hypotéza vyvrácena) |
| RC-R2 | CD | 🟡 | worlds.service.ts:1284 | `wasPlayer` ze zastaralého readu → idempotentní role-change → `playerCount` drift | 🐛 POTVRZENO (+2) → ✅ **OPRAVENO** (`updateRoleIfChanged` atomický cond. — inc jen při přechodu) |
| RC-R3 | TOCTOU | 🟠 | worlds.service.ts:1818 | transferOwnership non-atomic read+update + souběžný leave → vlastník bez membershipu | 🐛 POTVRZENO (leave kandidáta mezi read↔write transferu → world.ownerId = ne-člen, vlastník-duch) → ✅ **OPRAVENO** (re-check newOwner membershipu PO zápisu ownerId → při zmizení rollback ownerId+role + 400; vzor RC-D3/D6; race `RC-R3` 1/1) |
| RC-R4 | DP | — | worlds.service.ts (approve) | double-approve | ✅ **DRŽÍ** (1 membership, unique `{userId,worldId}`, žádné 500) |
| RC-R5 | SR | — | service-entry role read | stale-role guard | ✅ pravděpodobně (role čtena fresh per-request, ne z JWT) — analýza |

## Oblast 04 — Mazání při otevřeném detailu

| ID | Třída | Sev | Uzel | Popis | Stav |
|---|---|---|---|---|---|
| RC-D1 | PH | 🟠 | character-subdocs.service.ts (~96) | char delete vs subdoc create (event/lazy) → osiřelý subdoc | 🐛 POTVRZENO (lazy-create getInventory, Received orphan=1) → ✅ **OPRAVENO** (`rollbackIfParentGone` po lazy-create všech 5 subdoc getterů: re-ověř rodiče → orphan smaž + 404; vzor RC-D3; race `RC-D1` 1/1) |
| RC-D2 | PH | 🟠 | pages/characters create | create v soft-smazaném světě (create nečte `isActive`) → dítě v mrtvém světě | 🐛 POTVRZENO (page i char create projde v soft-smazaném světě; kořen = `worldsRepo.findById` BaseMongo NEfiltruje `isActive`) → ✅ **OPRAVENO** (guard `isActive && !deletedAt` v `pages.assertCanWrite` + `characters.assertCanManage` (přidán worldsRepo do CharactersService) + re-check po `pagesRepo.save` pro race okno; race `RC-D2` 4/4) |
| RC-D3 | PH | 🟠 | chat.service.ts:1016 (sendMessage) | channel delete mezi read↔save → osiřelá zpráva | 🐛 POTVRZENO (liveOrphans=1) → ✅ **OPRAVENO** (re-check kanálu po save → soft-delete orphan + 404; race 2/2 + chat unit 156/156) |
| RC-D4 | DP | 🟡 | chat.service.ts (deleteChannel) | double-delete kanálu | ✅ **DRŽÍ** (2× delete → žádné 500, kanál pryč; 2. findById→404) |
| RC-D6 | PH | 🟡 | maps (scene delete) | scéna delete vs assign → dangling `currentSceneId` | 🐛 POTVRZENO (clearSceneForAll proběhne před assign zápisem → dangling=1) → ✅ **OPRAVENO** (`handleAssignToScene`+`handleBulkAssign`: po `setCurrentScene` re-ověř existenci scény → při zmizení vrať membership zpět + 404; race `RC-D6` 1/1). CD-04 `clearSceneForAll` sám TOCTOU okno nekryje. |

---

## Pozitivní kontroly (harness self-test)
| Kontrola | Oblast | Očekáváno |
|---|---|---|
| 10× `adjust(+1)` → balance 10 | 01 | ✅ atomický `$inc` |
| 20× transfer A→B → součet konstantní | 01 | ✅ `withTransaction` |

## Souhrn

**Všechny 4 oblasti zdiagnostikovány. 13 reálných závodů potvrzeno + opraveno (E1/E2/E3/E4/E5, P1/P2/P4, R2/R3, D1/D2/D3/D6), 4 hypotézy vyvráceny (✅ drží).**

| Oblast | Nálezy | Stav |
|---|---|---|
| 01 Ekonomika | E1🔴 overdraft · E2🔴 double-refund · E3🟠 undo lost-update · E4🟠 inventář lost-update · **E5🔴 nákup bez atomicity (peníze pryč bez storno-logu)** | ✅ **opraveno** (race 7/7: +RC-E5 `withTransaction` nákupu + replSet fallback; unit 13/13 campaign) |
| 02 Stránky | P1🟠 optimistic-lock lost-update · P2🟠 grant lost-update (kryto P1 fixem) · P4🟡 200-null po delete · (P3 ✅ vyvráceno) | ✅ **opraveno** (race 5/5) |
| 03 Role | R2🟡 playerCount drift · **R3🟠 transferOwnership TOCTOU (vlastník-duch)** · (R1✅ owner-immutable, R4✅ unique index vyvráceny) | ✅ **opraveno** (race 4/4: +RC-R3 re-check po zápisu ownerId; worlds unit) |
| 04 Mazání | D1🟠 orphan subdoc · **D2🟠 create v soft-smazaném světě (phantom dítě)** · D3🟠 orphan zpráva · D6🟡 dangling currentSceneId | ✅ **opraveno** (race: +RC-D2 guard `isActive` v pages+characters create + re-check po save; db-lifecycle 4/4; pages unit 48/48, characters unit 29/29) |

**Třetí vlna (2026-06-15, tento průchod):** RC-E5/R3/D2 doplněny — všechny 3 prokázány **red→green** (deterministický repro červený před fixem). Celková race e2e suite **26/26** (7 specs), dotčené unit specy zelené (campaign 13/13, pages 48/48, characters 29/29, worlds+subdocs+accounts 200/200), `nest build` + `eslint` čisté.

**RC-E5 — jak transakce zachovává peníze (k osobnímu ověření):** nákup = 3 zápisy přes 3 kolekce — (1) `$push` položky do inventáře, (2) atomický odečet z účtu (`appendTransactionIfSufficient`, `$gte` floor), (3) `create` purchase logu. Všechny 3 běží v jediné `session.withTransaction(...)` se sdílenou session (každá repo metoda dostala `session?` param). MongoDB transakce commitne BUĎ všechny 3, NEBO žádný. Pád kdekoli (vč. selhání kroku 3) → `withTransaction` abort → **odečet z účtu se rollbackne** (`after === before`) **a purchase log nevznikne** (`count 0`) — ověřeno v testu `RC-E5`. Bez replica setu (single-instance prod) `withTransaction` hodí „Transaction numbers…" → fallback na sekvenční cestu s **plnou kompenzací**: když selže krok (3) purchase log, vrátí se peníze kompenzačním kreditem (`adjust(+paidAmount)`) + odebere se položka z inventáře → žádný stav „peníze odečteny, ale bez logu na storno". Peníze se tak ani neztratí, ani neduplikují v obou prostředích.

**Druhá vlna (2026-06-15, tento průchod):** RC-E4/P2/D1/D6 doplněny — všechny 4 prokázány **red→green** (dočasné vypnutí fixu = červená, fix = zelená). Celková race e2e suite **20/20** (6 specs), dotčené unit specy **377/377** (campaign+subdocs+maps+pages), `nest build` + `eslint` čisté. Společný kořen beze změny: read-modify-write / TOCTOU bez atomické DB podmínky → atomický `$push` (E4), conditional `updateIfUnchanged` (P2), re-check rodiče/cíle po zápisu (D1/D6).

**Společný kořen napříč všemi opravami:** read-modify-write / check-then-act **bez atomické DB podmínky**. Fix vzor = jedno atomické `findOneAndUpdate` s podmínkou ve filtru (`$gte` balance / `status:'active'` / `updatedAt:expected` / `role:{$ne}`) nebo `withTransaction`.

**Harness bonus:** opraven sdílený `app-factory.ts` (lazy `require` AppModule) → **odblokoval i seed-scenario audit** (nikdy neběžel kvůli `.env` localhost freeze při importu).

**Ceiling enhancements — HOTOVO:** ✅ D3 fix · ✅ fast-check linearizabilita model (`economy.model.race.e2e-spec.ts`, 20 náhodných workloadů, invariant `balance=Σdelta`) · ✅ TLA+ spec zachování peněz (`tla/money.tla`, on-demand TLC) · ✅ Stryker config (`backend/stryker.conf.json`, on-demand unit-level; full e2e mutace neproveditelná — zuby race testů doloženy empiricky red→green). **Všech 7 potvrzených závodů opraveno.**

⚠️ **Po BE fixech nutný restart** (dev server drží starý bundle, [feedback_be_restart_required]). **Git na uživateli** ([feedback_git_manual]) — necommitnuté produkční změny: campaign-purchase + character-accounts (+repo/interface) · pages.service (+repo/interface) · worlds.service (+membership repo/interface) · 3 unit specy · test/race/* · test/helpers/app-factory.ts.
