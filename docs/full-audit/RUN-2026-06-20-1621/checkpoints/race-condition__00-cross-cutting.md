# race-condition / 00-cross-cutting — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem celou cross-cutting infrastrukturu a produkční kód na HEAD:

- Harness: `race-barrier.ts` (Barrier/Gate/withBarrier/withGate), `app-factory.ts`, `db.ts`, `seed-scenario.ts`
- Všechny 4 spec soubory: `economy.race.e2e-spec.ts`, `economy.model.race.e2e-spec.ts`, `pages.race.e2e-spec.ts`, `roles.race.e2e-spec.ts`, `deletion.race.e2e-spec.ts`, `db-lifecycle.race.e2e-spec.ts`, `maps.race.e2e-spec.ts`
- Produkční kód: `character-accounts.service.ts`, `character-account.repository.ts`, `campaign-purchase.service.ts`, `worlds.service.ts`, `character-subdocs.service.ts`, `pages.service.ts`
- Artefakty M-TLA: `tla/money.tla` (přítomen, bez `.cfg` souboru)
- Stryker: `stryker.conf.json` (přítomen, on-demand)
- Registr: `race-condition-audit.md`

## Dosažená L vs cílová L

Cílová dle README: **Maximum** = Barrier/Gate (L3) + fast-check model (L4-ish) + TLA+ (M-TLA) + Stryker teeth (M-MUT)

Dosaženo:
- Harness infrastruktura: **L3** (race-barrier.ts plně implementován)
- Ekonomika: **L4** (bariéra/gate repro červená, fix prokázán zelená; race 7/7 spec. soubor)
- fast-check model: **L3+** (money.model.race.e2e-spec.ts běží 20 náhodných workloadů, I1 invariant ověřen; I2/I3/I4 uvedeny v plánu, ale testovány jen I1)
- TLA+: **spec sepsána** (money.tla), **bez .cfg souboru** → TLC nespuštěn → PROOF-REQUEST
- Stryker: **config připraven** (stryker.conf.json), **nespuštěn** → PROOF-REQUEST
- Stránky: **L4** (P1/P2/P4 race 5/5)
- Role: **L4** (R2/R3 race 4/4)
- Mazání: **L4** (D1/D2/D3/D6 4/4)

## Nálezy

### Nové nálezy (L1–L3 statická analýza)

RC-RUN-01 — [LU] `changeCurrency(convert:true)` read-modify-write bez session/podmínky
· Kde: `character-accounts.service.ts:227–289`, `character-account.repository.ts:130`
· Dopad: Dva souběžné `adjust` mezi `getAccount(read)` a `replaceMoneyFields($set)` → přepočtené delty vychází ze zastaralého snímku transakcí → výsledný `balance` se liší od `Σ delta` (invariant I1 porušen). Na replSet by `withTransaction` zachytil write-conflict; bez něj (single-instance) k porušení dojde tiše.
· Návrh: Buď obalit do `withTransaction` (vzor `undoLast`), nebo provést přepočet `replaceMoneyFields` jen pokud mezitím nepřibyla transakce (podmíněný filtr na počtu transakcí/updatedAt).
· L1 (hypotéza) — statická analýza; bez barrier/gate repro
· 🆕

RC-RUN-02 — [LU] `addCoOwner` read-then-`$set` celého pole ownerCharacterIds
· Kde: `character-accounts.service.ts:695–706`
· Dopad: Dva souběžné `addCoOwner` jiných postav čtou stejné `ownerCharacterIds`, oba appendují, druhý `$set` přepíše první → jeden co-owner ztracen (tichý lost update). Symetrický problém v `removeCoOwner` (řádky 708–724) a `transferPrimaryOwnership` (731–747).
· Návrh: Atomický `$addToSet`/`$pull` místo `$set` celého pole (analogie RC-E4 inventář → `$push`).
· L1 — statická analýza; bez barrier/gate repro
· 🆕

RC-RUN-03 — [AT] `worlds.service.create` multi-step bez session (DI-04)
· Kde: `worlds.service.ts:324–360`
· Dopad: `worldsRepo.save` → `membershipRepo.save` → `currenciesService.seedForWorld` → `weatherService.seedForWorld` → `calendarConfigService` → všechny bez session. Pád v kroku 2+ → svět vznikne bez membership PJ (osieřelý svět bez správce) nebo bez seedovaných měn/počasí/kalendáře. Toto je zaznamenáno v paměti jako DI-04 (cross-systémový dluh).
· Návrh: Obalit do `withTransaction` (vzor RC-E5) nebo přidat post-create rollback guard (vzor RC-D2 re-check).
· L1 — statická analýza; bez barrier/gate repro. Registrováno v cascade-delete/db-integrity auditu jako DI-04; zde se hlásí z pohledu AT race.
· ♻️ (přesah s DI-04 z db-integrity auditu)

RC-RUN-04 — [LU] `undoLastOnce` fallback bez session používá full `$set` transactions pole
· Kde: `character-accounts.service.ts:481–503` (fallback volání řádek 471: `return this.undoLastOnce(accountId)` bez session)
· Dopad: Na prostředí bez replica setu (single-instance prod) selže `withTransaction` → `undoLastOnce` se zavolá bez session → read + `$set(transactions.slice(0,-1))` bez ochranné transakce. V okně mezi read a `$set` může `adjust` přidat transakci → vklad zmizí (stejný vzor jako RC-E3 před fixem). Fix RC-E3 (`withTransaction`) chrání jen replSet cestu; fallback (řádek 471) zpátky vrací původní zranitelnost.
· Návrh: Ve fallback cestě použít `$pop: { transactions: 1 }` s `$inc: { balance: -last.delta }` (atomický, bez čtení pole), stejně jak `appendTransaction` používá `$push`+`$inc`.
· L1 — statická analýza; kritičtější než RC-RUN-01 protože se to děje na single-instance (majoritní prod nasazení bez replSet)
· 🆕

RC-RUN-05 — [DP] `refund` – non-atomický stav check PŘED `markRefundedIfActive`
· Kde: `campaign-purchase.service.ts:404–413` (čtení purchase + `status!=='active'` check), `campaign-purchase.service.ts:433`
· Dopad: Brzký `status!=='active'` check (řádek 410) je ne-atomický rychlá pojistka — na ni nelze spoléhat. Atomický fix (`markRefundedIfActive` na řádku 433) je správný. Kombinace ale vytváří dojem, že brzký check CHRÁNÍ — může vést k budoucím regresím, kde vývojář přidá logiku mezi check a `markRefundedIfActive` spoléhající na výsledek brzkého checku.
· Dopad: Architekturální riziko (ne aktuální bug — `markRefundedIfActive` skutečně drží). Kód-smells třída.
· Návrh: Odstranit brzký check nebo ho nahradit komentářem, že jde o `fast-path/hint only` a jediná záruka je atomická.
· L2 — statická analýza (ne aktivní bug, ale architektonické riziko)
· 🆕

RC-RUN-06 — [LU] `fast-check model` pokrývá pouze I1, vynechává I2/I3/I4
· Kde: `economy.model.race.e2e-spec.ts:74–108`
· Dopad: Invarianty I2 (conservation při transferu = Σ balance konstantní), I3 (žádný purchase zpracován 2×), I4 (nákup s kontrolou krytí nesmí jít pod 0) jsou zmíněny v plánu (`00-cross-cutting.md §C`) ale v modelu chybí. Test I1 jednoduše ověřuje `balance = Σ delta` na `adjust/undo` workloadech — transfer a purchase invarianty nejsou pokryty.
· Návrh: Přidat `transfer` a `purchase` commands do fast-check modelu a asertovat I2 (součet zůstatků konstantní) a I4 (žádný záporný zůstatek po purchase).
· L2 (infrastrukturní mezera) — ne bug v produkčním kódu, ale gap v ceiling coverage
· 🆕

### Potvrzené nálezy z registru (♻️ — v pořádku, nereplikuji)

Všech 13 historických nálezů (E1–E5, P1/P2/P4, R2/R3, D1/D2/D3/D6) ověřeno HEAD kódem — fixy jsou na místě (atomické metody, withTransaction, re-check vzory). Žádná regrese.

## PROOF-REQUEST

**PROOF-1 (M-TLA / TLC):** `tla/money.tla` existuje v `docs/race-condition-plan/tla/`, ale chybí `.cfg` soubor (konfigurace TLC: `CONSTANTS Accounts = {a1,a2}, MaxAmount = 10, InitBalance = 100`). TLC nikdy nespuštěn — invarianty `MoneyConserved` a `NoOverdraft` jsou formálně neověřeny. Potřeba:
1. Vytvořit `money.cfg` s konstantami
2. Spustit `tlc money.tla` (TLA+ Toolbox nebo Java CLI)
3. Ověřit zelený run (žádný protipříklad)

**PROOF-2 (M-MUT / Stryker):** `stryker.conf.json` připraven, ale `npx stryker run` nikdy spuštěn dle registru. Scoped na 6 service/repo souborů dotčených race fixy. Bez spuštění zuby unit testů nejsou doloženy mechanicky (jen empiricky red→green z bariéra). Potřeba: `cd backend && npx stryker run` a ověřit skóre mutace ≥ 60 % (threshold `break:0`).

**PROOF-3 (RC-RUN-01 L3):** `changeCurrency(convert:true)` race — Gate na `replaceMoneyFields` s paralelním `adjust` → ověřit, zda `balance ≠ Σ delta` po interleavu. Nelze staticky; vyžaduje race-spec test s barrier/gate.

**PROOF-4 (RC-RUN-02 L3):** `addCoOwner` concurrent race — Barrier na `accountsRepo.update` s 2 souběžnými `addCoOwner` různých postav → ověřit, zda obě postavy zůstanou v `ownerCharacterIds`. Statická analýza (L1) stačí k zapsání nálezu; L3 = barrier repro.

**PROOF-5 (RC-RUN-04 L3):** `undoLastOnce` fallback (non-replSet) — Gate na `accountsRepo.update` + souběžný `adjust` v prostředí bez replSet → ověřit lost-update ve fallback cestě. V testovacím harnessu (vždy replSet) NELZE reprodukovat přímo — vyžaduje test s `replSet:false` nebo mock.
