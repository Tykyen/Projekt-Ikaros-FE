# Race-condition mini testy — drží invarianty, když dvě operace závodí?

> **Účel:** cílenými **souběžnými** scénáři dokázat (zelená/červená), jestli platforma drží své
> invarianty, když se dvě operace prokládají na nešťastném místě — **paralelní ekonomika**, **souběžné
> úpravy stránky**, **změny rolí** a **mazání entity při otevřeném detailu**. Cílová otázka:
> „když dva požadavky dorazí naráz, **přežije invariant** (peníze se zachovají, zůstatek nejde do mínusu,
> stránka nepřijde o data, svět neztratí PJ, nevznikne osiřelé dítě) — nebo se rozpadne v okně, které
> sekvenční test z principu nikdy nespustí?"
>
> **15. styl auditu.** Sourozenec [`bug-plan/`](../bug-plan/README.md) … [`seed-scenario-plan/`](../seed-scenario-plan/README.md).
> **Druhý SPUSTITELNÝ** audit (vedle seed-scenario) — souběhovou chybu **nelze dokázat staticky**, jen
> reálně závoděným testem, který vyrobí živý zelený/červený signál.
>
> **Stav:** 2026-06-15 — **všechny 4 oblasti zdiagnostikovány a spuštěny.** 6 reálných závodů
> potvrzeno deterministicky a **opraveno** (ekonomika E1-E3, stránky P1+P4, role R2; race testy zelené +
> dotčené unit suite zelené), 1 potvrzen+defer (mazání D3), 4 hypotézy vyvráceny. Harness fix v
> `app-factory.ts` odblokoval i seed-scenario. Zbývá: D3 fix + fast-check model + TLA+ + Stryker teeth.
> Nálezy → [`../race-condition-audit.md`](../race-condition-audit.md) (ID `RC-xx`).

---

## Proč samostatný audit (co ostatních 14 míjí + co dědí ze seed-scenario)

Předchozích 13 statických auditů řeže systém vodorovně (jedna starost × všechny moduly). Seed-scenario
jde svisle podél kritické cesty a má **jednu** osu `RC` (3 mělké checky: double-join / double-approve /
paralelní slug). **Žádný nejde do hloubky na souběh** — a přitom přesně tam žije třída chyb, kterou ani
vodorovný sweep, ani happy-path smoke nevidí:

| Slepá skvrna | Příklad v Ikarovi | Dopad |
|---|---|---|
| **Lost update** | dva PJ uloží stejnou stránku → druhý přemaže sekce/AKJ granty prvního | 🟠 tichá ztráta obsahu |
| **TOCTOU overdraft** | 2 nákupy naráz čtou `balance=100`, oba projdou krytím → `$inc -80` 2× → **−60** | 🔴 záporné peníze |
| **Double-processing** | 2 storna téhož nákupu → peníze vráceny **2×** | 🔴 duplikované peníze |
| **Write skew / invariant** | 2 demote naráz → svět zůstane **bez PJ** (žádná „≥1 PJ" pojistka) | 🔴 svět bez správce |
| **Phantom / orphan** | smaž postavu, zatímco vzniká její subdoc → **osiřelý** deník/účet | 🔴 trvalý orphan |
| **Counter drift** | idempotentní role-change 2× → `playerCount` skočí o 2 | 🟠 lživé číslo |
| **Atomicita pod souběhem** | nákup přes 3 moduly bez transakce → položka koupena, peníze pryč, **bez storno-záznamu** | 🔴 nevratný stav |

> 💡 **Pozice:** seed-scenario dokazuje, že **happy-path složí dohromady**. Tenhle dokazuje, že **dva
> happy-path naráz se nerozbijí o sebe**. Reuse jeho harness (replica-set, seed-builder, supertest) — jen
> přidává **deterministický interleave** (Barrier/Gate) + souběhovou **taxonomii** + **teeth** (mutace).

---

## Taxonomie závodů (8 os/tříd)

| Zkr | Třída | Mechanismus | Kde čekáme |
|---|---|---|---|
| **LU** | Lost update | read → modify → write *full-replace*; druhý zápis přemaže první | stránky (sekce/AKJ), `undoLast`, inventář |
| **TOCTOU** | Check-then-act | ověř podmínku → jednej; podmínka se mezitím změní | overdraft (balance check), slug exists, last-PJ |
| **DP** | Double-processing | táž operace proběhne 2× | refund, approve, delete (idempotence) |
| **WS** | Write skew | dva zápisy do různých polí společně poruší invariant | 2 transfery z účtu, 2 demote PJ |
| **PH** | Phantom / orphan | vytvoř dítě, zatímco rodič mizí | subdoc orphan, zpráva do mrtvého kanálu |
| **CD** | Counter drift | `$inc` řízený zastaralým read rozhodnutím | `playerCount` |
| **AT** | Atomicita pod souběhem | multi-step bez transakce → částečný stav | nákup (3 moduly), transfer fallback |
| **SR** | Stale role / authz | guard čte roli, role se mezitím změní | demote-while-acting |

---

## Metody ověření + úrovně jistoty

| Kód | Metoda | Nástroj |
|---|---|---|
| **M-STRESS** | Probabilistický souběh — `Promise.all` ×N stejných requestů | supertest |
| **M-BARRIER** | Deterministický symetrický interleave — N operací se sejde v kritickém bodě | [`race-barrier.ts`](../../../Projekt-ikaros/backend/test/race/race-barrier.ts) `Barrier` |
| **M-GATE** | Deterministický asymetrický interleave — drž A v bodě X, doběhni B, pusť A | `race-barrier.ts` `Gate` |
| **M-DB** | In-process introspekce stavu po závodu (živé `connection`) | mongoose |
| **M-MODEL** | Linearizabilita — náhodné sekvence op vs sekvenční referenční model + shrink | `fast-check` (scheduler/model) |
| **M-TLA** | Vyčerpávající model-check invariantu na úrovni protokolu | TLA+ (zachování peněz) |
| **M-MUT** | Mutace — odeber fix, test musí zčervenat (mají testy zuby?) | `@stryker-mutator` |

| Úroveň | Co znamená | Důkaz |
|---|---|---|
| **L1** | hypotéza závodu sepsaná | nejslabší |
| **L2** | `Promise.all` stres bez nálezu | slabé (možná jen netrefil okno) |
| **L3** | **deterministická bariéra/gate** repro červená / zelená | silné |
| **L4** | + fix nasazen + bariéra zelená | oprava prokázaná |
| **L5-teeth** | mutace potvrdí, že test chybu reálně chytá | důkaz síly testu |

📚 **Proč Node-in-process stačí (a kde nestačí).** Node je single-thread, ale prokládá na `await` bodech —
přesně kde read-modify-write / TOCTOU žije → drtivou většinu našich tříd reprodukuje. `MongoMemoryReplSet`
({count:1}) dává **reálné transakce** (write-conflict abort). **Strop:** nereprodukuje závody vyžadující
skutečný OS-thread paralelismus v DB ani **multi-instance** (víc BE procesů, distribuované zámky — třída
dluhu D-028). Tu odůvodňujeme TLA+ a značíme jako známý limit, nereprodukujeme v paměťovém harnessu.

---

## Cílová varianta: **Maximum**

Bariéra/Gate (levně chytí známé hypotézy) **+** fast-check model (linearizabilita — chytí *neznámé*
interleavy + shrink) **+** Stryker teeth (peníze) **+** TLA+ na zachování peněz. Multi-process =
dokumentovaný limit + volitelný chaos-stres běh.

---

## Index oblastí

| # | Oblast | Jádro povrchu | Třídy |
|---|---|---|---|
| 00 | [Cross-cutting](00-cross-cutting.md) | harness (Barrier/Gate), reuse seed-builder, fast-check model, TLA+, Stryker, pasti | všechny |
| 01 | [Ekonomika](01-ekonomika.md) | nákup / storno / adjust / undo / transfer | TOCTOU · DP · LU · AT · WS |
| 02 | [Stránky](02-stranky.md) | update (sekce/AKJ/granty/slug), persona transition, delete-vs-update | LU · TOCTOU · PH |
| 03 | [Role](03-role.md) | role change, last-PJ invariant, playerCount, approve, transferOwnership | TOCTOU · CD · WS · SR |
| 04 | [Mazání](04-mazani.md) | delete vs create/update child, double-delete, kaskáda vs create | PH · DP |

## Pracovní postup
1. **Harness** — `race-barrier.ts` (Barrier/Gate), reuse `replSet:true` + `buildCanonicalWorld`.
2. **Ekonomika první** — má potvrzené reálné bugy + peníze; bariéra repro → červená.
3. Stránky → Role → Mazání — confirm/refute hypotéz.
4. fast-check model + TLA+ na ekonomiku; Stryker teeth na opravené.
5. Registr `RC-xx` (uzel / třída / repro deterministická? / vratné? / dopad); **fixy gated souhlasem**,
   priorita ekonomika; BE+FE nemíchat.

## Legenda
- ⬜ netestováno · ✅ invariant drží · 🐛 nález → [`../race-condition-audit.md`](../race-condition-audit.md) (`RC-xx`) · ⚖️ by-design · ⏭️ blokované
- `K-RC*` seed kandidát (hypotéza, verdikt až při běhu)
