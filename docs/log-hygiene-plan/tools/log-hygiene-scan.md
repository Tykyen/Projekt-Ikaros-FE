# tools/log-hygiene-scan — spec nástrojů (M-SCAN / M-RUNTIME / M-DOCKER / M-MUT)

> Spustitelná vrstva auditu. Cíl: nálezy **strojově prokázané**, ne vyčtené; M-SCAN kandidát na **CI guard**
> (`npm run audit:logs`, vzor [`scripts/error-contract-scan.mjs`](../../../scripts/error-contract-scan.mjs)).
> Stav: ⬜ nepostaveno (1. krok sweepu). Tento soubor je **spec**, ne implementace.

---

## M-SCAN — katalog log volání + taint klasifikace

**Cíl:** úplný katalog každého log místa + klasifikace argumentu + taint flag (oblast 00 §B/§C; osy
`DBG`/`SEC`/`PII`/`OBJ`/`FMT`).

**Mechanika:** `ts-morph` projekt nad oběma repo (BE `tsconfig`, FE `tsconfig`):
1. Najdi všechny `CallExpression`, kde callee je:
   - `console.(log|debug|info|warn|error|trace|dir|table)`
   - `<x>.logger.(log|debug|verbose|warn|error)` / `Logger.(...)` / `this.logger.(...)`
2. Pro každé volání zaznamenej: **soubor:ř**, **metoda/úroveň**, **počet argumentů**, a pro každý argument
   **třídu** (literál / template s ID / `err.message` / `err` objekt / pojmenovaná proměnná / typ).
3. **Taint flag** (§C pravidlo): argument je `🔴`/`🟠`/`🟡` když pojmenovaný citlivě, typovaný citlivým typem
   (`getType().getText()` matchuje `User|Dto|Entity|Document`), nebo odvozený z `req.body`/`*.passwordHash`/
   token zdroje. Whitelist false-positive (`tokenizer`, `hashtag`, `emailVerified`).
4. Klasifikuj cestu: **běhová** vs **test/seed** (`*.spec.ts`, `*.seed.ts`, `__tests__/`, za
   `PARITY_REGENERATE` gate) → `DBG`/`SEED` rozlišení.

**Výstup:** JSON + MD tabulka `soubor:ř | úroveň | argumenty | taint | cesta`. Sumář: počet log míst, počet
tainted, počet `console.*` v běhové cestě, počet `logger.debug/verbose`.

**CI guard mód (`--check`):** selže, když (a) přibude `console.*` v běhové (ne-test) cestě BE, (b) přibude
log s `🔴` taint argumentem, (c) objeví se `mongoose.set('debug')` / `logger:true` / `debug:true` u
3rd-party (osa `3RD`). Baseline allowlist pro existující (po opravách prázdný).

---

## M-RUNTIME — stdout capture (empirický leak)

**Cíl:** dokázat leak **zachycením reálného stdout**, ne čtením (osy `SEC`/`PII`/`EXC`/`OBJ`; L5/L8).

**Mechanika:** jest e2e přes `createTestApp` (cross-ref [seed-scenario](../../seed-scenario-plan/tools/seed-scenario.md)
— sdílet MongoMemoryReplSet infra):
1. Přesměruj `process.stdout.write`/`process.stderr.write` na buffer **před** bootem appky (NestJS Logger
   píše přímo tam).
2. **Sensitive kanárky** — registrace/login/reset s payloady obsahujícími rozpoznatelné kanárky:
   `password: 'CANARY_PWD_x9'`, `email: 'canary@leak.test'`, token zachycený z reset flow jako
   `CANARY_TOKEN_*`.
3. Projeď **kritické cesty**: register → login → forgot-password → change-email → upload → chat send →
   admin akce.
4. **Fault injection** — mock `MailerService.send`/Mongo query/Cloudinary → throw → vyvolá catch dumpy.
5. **Assert:** zachycený buffer **neobsahuje** žádný kanárek (`CANARY_PWD`, `canary@leak.test`,
   `CANARY_TOKEN`), žádný `passwordHash`, žádný JWT vzor (`eyJ...`). Pokud obsahuje → 🐛 `LH-xx` (do registru
   **jen lokace + typ**, ne hodnota).

**L8 nadstavba:** `fast-check` generuje sensitive-vypadající payloady (e-maily, token-like stringy) přes
endpointy → invariant „nic se neobjeví ve stdout".

**Pasti:** Mongo flaky → `--runInBand`; Logger buffer reset mezi testy; kanárky nikdy = reálná data;
zachycený buffer se **necommituje**.

---

## M-DOCKER — sink scan

**Cíl:** kam log teče a jak dlouho leží (osa `SINK`).

**Vstup:** parse `docker-compose.prod.yml` + `docker-compose.yml`:
- `logging:` blok přítomen? `driver:` (json-file / local / none)? `options.max-size` / `max-file`?
- Per-service (BE, FE/nginx) — má každý rotaci?

**Výstup:** tabulka `service | driver | rotace | verdikt`. Bez `logging:` → default `json-file` bez rotace →
🐛 `SINK` (unbounded). Doporučení: `logging: { driver: json-file, options: { max-size: 10m, max-file: 3 } }`
nebo `local` driver.

---

## M-MUT — teeth (volitelně, po opravách)

**Cíl:** dokázat, že redakce/level gate má zuby (osa `TE`).

**Mutace:** (a) odeber redakci z logger wrapperu (zaloguj `token` napřímo); (b) přepni `NestFactory` level
zpět na default (debug v prod); (c) zapni `mongoose.set('debug', true)`. M-RUNTIME / M-SCAN guard **musí**
zčervenat. Pokud projde → pokrytí je divadlo. Nástroj: Stryker (BE už má devDep z nav-audit Maximum+).

---

## Pořadí stavby

1. **M-SCAN** (nejvyšší hodnota, statické, CI guard kandidát) — katalog + taint.
2. **M-DOCKER** (rychlé, jeden soubor).
3. **M-RUNTIME** (potřebuje createTestApp infra — sdílet se seed-scenario).
4. **M-MUT** (až je co mutovat — po opravách).
