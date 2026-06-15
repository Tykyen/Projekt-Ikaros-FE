# 00 — Cross-cutting (harness, interleave primitiva, model, teeth, pasti)

> Společná infrastruktura pro všechny souběhové režimy. Reuse maxima ze
> seed-scenario; přidává jen to, co je pro *deterministický závod* navíc.

---

## A) Reuse ze seed-scenario (nepřepisovat)

| Co | Odkud | Pozn. |
|---|---|---|
| `createTestApp({ replSet: true })` | [`app-factory.ts`](../../../Projekt-ikaros/backend/test/helpers/app-factory.ts) | replica-set → reálné Mongo transakce |
| `buildCanonicalWorld(app, conn)` | [`seed-scenario.ts`](../../../Projekt-ikaros/backend/test/helpers/seed-scenario.ts) | PJ+hráč+svět+membership+persona PC+NPC+chat+scéna |
| `registerUser` / `authHeader` | [`auth.ts`](../../../Projekt-ikaros/backend/test/helpers/auth.ts) | session helpery |
| `WorldRole` numerický enum | seed-scenario.ts | Hrac=2 PomocnyPJ=4 PJ=5 |

⚠️ Ekonomika potřebuje **navíc**: účet (`POST .../characters/:slug/accounts`), shop item
(`POST /api/campaign/shopitems?worldId=`), nákup/storno (`/api/campaign/...`). Tyto helpery žijí přímo ve
spec souboru oblasti 01 (ne v shared builderu — jsou ekonomika-specifické).

---

## B) Interleave primitiva — [`race-barrier.ts`](../../../Projekt-ikaros/backend/test/race/race-barrier.ts)

📚 **Proč ne jen `Promise.all`.** Dvě HTTP volání přes `Promise.all` se *probabilisticky* prokládají na
`await` bodech — někdy okno netrefí → flaky / falešně zelený. Primitiva ho **vynutí**.

### `Barrier(parties, timeoutMs=3000)` — symetrický závod
N volajících se sejde v kritickém bodě a teprve pak pokračují **společně**. Vynutí „oba čtou dřív, než
kdokoli zapíše". **Timeout-fallback** je klíčový: opravený (zelený) kód, kde druhá operace ke kritickému
bodu nikdy nedojde (správně odmítnutá), by jinak zablokoval test na deadlocku → po `timeoutMs` se pustí.

### `Gate` — asymetrický závod
Drží operaci A v bodě X, dokud test nezavolá `open()`. `gate.reached` resolvne při **prvním** `held()` →
test ví, že A dosáhla bodu (po readu, před writem), a teprve pak spustí operaci B. Vynutí „append B
proběhl mezi readem a writem A" (lost-update vzor `undoLast`).

### Zapojení — `withBarrier(target, method, barrier)` / `withGate(target, method, gate)`
Obalí metodu service/repo přes `jest.spyOn`, vloží `barrier.arrive()` / `gate.held()` před originál a vrátí
`restore()` (zavolej v `finally`). 💡 **Volba bodu = volba okna:** gate na `repo.update` drží přesně mezi
service-readem a DB-writem; barrier na `service.adjust` sejde oba odečty po balance-checku.

> ⚠️ **Singleton sdílení:** spy musí sedět na téže instanci, kterou volá produkční kód. `app.get(Service)`
> vrací Nest singleton → `CampaignPurchaseService` volá tutéž instanci `CharacterAccountsService` →
> spy ji zachytí. Ověř, že spy-ovaná metoda není volaná i v setupu (instaluj spy **až po** seed/fund).

---

## C) fast-check model — linearizabilita (M-MODEL)

📚 **Co přidává nad bariéru.** Bariéra testuje *jeden* interleave, který *já* označím za podezřelý.
fast-check `scheduler()` přeskládá rozlití promisů napříč **mnoha** pořadími, a když najde chybu, **scvrkne
ji na minimální repro**. S **modelem** (sekvenční pravda) neověřuje scénář, ale **vlastnost**.

```ts
// Návrh: model = referenční účet { balance, txCount }. Příkazy = adjust/transfer/undo/purchase.
// fc.assert(fc.asyncProperty(fc.scheduler(), fc.commands(...), async (s, cmds) => {
//   spusť cmds přes scheduler s (náhodné prokládání), pak assert:
//   real.balance === model.balance && real.balance === Σ real.transactions.delta
// }))
```

Invarianty (musí platit po **libovolném** prokládání):
- **I1** `balance === Σ transactions.delta` (žádný drift mezi součtem a uloženým zůstatkem)
- **I2** zachování při transferu: `Σ balance napříč účty` konstantní
- **I3** žádná „active" transakce/nákup nesmí být zpracován dvakrát (idempotence)
- **I4** krytí: nákup s kontrolou krytí nesmí dostat zůstatek pod 0

> Nejsilnější **na úrovni service** (řídím promisy přímo). HTTP `Promise.all` zůstává pro integrační vrstvu.

---

## D) TLA+ — zachování peněz (M-TLA)

Repo už TLA+ použil ([state-consistency MapReconnect]). Namodeluj protokol `transfer` + `purchase` jako
stavový stroj se 2 účty a model-checkni invariant **MoneyConserved** + **NoOverdraft** přes *všechna*
prokládání. Dokazuje matematiku (ne kód) → doplněk code-testů, pokrývá i multi-instance, který harness
nereprodukuje. Spec → `tla/money.tla` (mimo build).

---

## E) Stryker teeth (M-MUT) — realita

Config: [`backend/stryker.conf.json`](../../../Projekt-ikaros/backend/stryker.conf.json) (on-demand, scoped
na dotčené service/repo soubory, jest unit runner). `npx stryker run`.

⚠️ **Poctivé omezení:** mutace přes **e2e race** testy je neproveditelná — každý mutant vyžaduje boot
in-memory replica setu (×stovky mutantů = hodiny). Stryker config proto cílí **unit** specy (rychlé) →
ověří zuby UNIT testů (logika fixů), ne přímo race e2e.

✅ **Zuby RACE e2e testů jsou doloženy EMPIRICKY** (= přesně to, co Stryker simuluje): **každý `🐛` test
byl ČERVENÝ před svým fixem a ZELENÝ po něm** — zaznamenáno v [registru](../race-condition-audit.md)
(E1 −60, E2 ok=2, E3 vklad zmizel, P1 conflicts=0, P4 200-null, R2 +2, D3 liveOrphans=1). Bariéra/Gate
navíc cílí přesně buggy DB cestu (`update`/`save`), takže návrat k ní (regrese) test znovu rozčervená.

✅ **fast-check model** ([`economy.model.race.e2e-spec.ts`](../../../Projekt-ikaros/backend/test/race/economy.model.race.e2e-spec.ts))
běží 20 náhodných souběžných workloadů a tvrdí invariant `balance = Σ delta` — chytá i interleavy mimo
ručně psané scénáře (zelený = atomické fixy drží pod libovolným prokládáním).

---

## F) Pasti prostředí

- 🔴 **replSet boot pomalý** → `beforeAll` 180 s, jeden sdílený svět per `describe` (ne per-test fresh DB).
- **Spy v setupu:** instaluj `withBarrier`/`withGate` **až po** seed/fund (jinak zachytí i přípravné adjust).
- **Timeout-fallback bariéry** (3 s): zelený běh, kde druhá strana nedorazí, projde — ne deadlock.
- **Po BE změně restart** (fix se neprojeví bez restartu / `nest --watch`) — [feedback_be_restart_required].
- **Fixy peněžní cesty:** atomický conditional update / `$inc` floor / `withTransaction` — gated souhlasem,
  BE+FE nemíchat. Vzor transakce: `character-accounts.service.transfer` (`withTransaction` + replSet fallback).
- **Přesah s db-integrity / cascade-delete:** PH (orphan na závodu) sdílí povrch — křížově odkázat, nezdvojovat.
- **By-design verdikty:** transfer bez balance floor (E6) může být záměr (PJ smí mínus) → ⚖️, ne 🐛, dokud
  uživatel nepotvrdí. Verdikt vždy z běhu + záměru v kódu/spec, ne z prvního dojmu.
