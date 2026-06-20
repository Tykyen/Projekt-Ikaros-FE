# log-hygiene / 06-seed-migrace — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Auditor: hloubkový agent (READ-ONLY).

---

## Pokrytí

Prošel jsem **všechny seed/migrace soubory** nalezené v BE repo:

| Soubor | Typ | Loguje |
|---|---|---|
| `database/seed/matrix-world.seed.ts` | `OnApplicationBootstrap` | literály: světové jméno, počty; err → `logError` |
| `modules/pages/rulebook/rulebook-matrix-seed.ts` | `OnApplicationBootstrap` | literál; err → `logError` |
| `modules/world-page-templates/world-page-templates.matrix-seed.ts` | `OnApplicationBootstrap` | počty šablon; `logger.debug` (gated LH-02) |
| `modules/ikaros-categories/article-categories.seed.ts` | `OnApplicationBootstrap` | `cat.key` (statický klíč); err → přímý `logger.error(msg, err.message)` |
| `modules/ikaros-gallery/gallery-categories.seed.ts` | `OnApplicationBootstrap` | `cat.key` (statický klíč); err → přímý `logger.error(msg, err.message)` |
| `modules/ikaros-articles/article-category-slug-migration.ts` | `OnApplicationBootstrap` | `legacy → slug` (statické hodnoty); `logger.debug` (gated); err → přímý `logger.error(msg, err.message)` |
| `modules/pages/pages-world-seed.listener.ts` | `OnEvent('world.created')` | **žádný Logger** — tichý seed; err neodchytáva |
| `modules/universe/seed/matrix-universe.seed.ts` | datový soubor (export konst) | **žádný Logger** — není injectable |
| `modules/users/users.service.ts:88-105` | `onModuleInit` (migrace) | `JSON.stringify(conflicts)` — usernames (LH-08 ⚖️) + počty |

Hledal jsem také:
- matrix user migration script (`MIGRATION_USERS`, bcrypt hash v logu) — **nenalezen v kódu** (byl zřejmě one-off mimo repo nebo nebyl implementován)
- jakékoli `logger.*` volání s `email`, `password`, `hash`, `token` v seed cestách — **žádné**

---

## Dosažená L vs cílová L

| Osa | Cíl | Dosaženo | Metoda |
|---|---|---|---|
| `SEED` | L2–L3 | **L3** | M1 statické čtení všech seed souborů + taint ověření |
| `SEC` | L3 | **L3** | žádné heslo/hash/token v log argumentu; migrace Matrix účtů nenalezena v kódu |
| `PII` | L3 | **L3** | LH-08 ⚖️ by-design (usernames), jinak jen statické klíče/počty |

Živá infra (runtime stdout seed hodin v produkci) → **PROOF-REQUEST** (viz níže).

---

## Nálezy

### LH-RUN-01 — `DBG`/`SEED` — `logger.debug` v boot seed cestách (gated, ale pozor na osy)

**Osa:** `DBG` · **Kde:**
- `world-page-templates.matrix-seed.ts:102` — `this.logger.debug('Matrix svět (slug=matrix) nenalezen — seed šablon přeskočen')`
- `article-category-slug-migration.ts:52` — `this.logger.debug('No legacy article categories to migrate.')`

**Dopad:** Obě volání jsou `OnApplicationBootstrap` → běží při každém startu → volání existuje v **prod runtime cestě** (ne jen test). Díky LH-02 fix (`logLevels: ['log','warn','error']` v prod) jsou debug zprávy **gated** — do prod stdout nedorazí. Ale osa `DBG` říká: „žádný `logger.debug/verbose` v **běhové** cestě." Seed runy jsou běhová cesta při startu.

**Klasifikace:** ♻️ (variant LH-01 systému — debug v prod cestě, ale gated). **L3** (dosažitelnost: prod branch gate zabrání, ale volání existuje). **Sev: 🟢 pozitivní s poznámkou** — gate funguje, ale zbytky zůstávají.

**Návrh:** Zvážit nahrazení `logger.debug` za `logger.log` (informatívní) nebo smazání, aby kód byl čistý i bez level gate. Není kritické — gate stačí.

---

### LH-RUN-02 — `OBJ`/`SEED` — přímý `logger.error(msg, (err as Error).message)` místo `logError` v article/gallery seed a article-category-slug-migration

**Osa:** `OBJ` · **Kde:**
- `article-categories.seed.ts:44` — `this.logger.error(\`Failed to seed article categories: ${(err as Error).message}\`)`
- `gallery-categories.seed.ts:42` — `this.logger.error(\`Failed to seed gallery categories: ${(err as Error).message}\`)`
- `article-category-slug-migration.ts:55` — `this.logger.error(\`Failed article category slug migration: ${(err as Error).message}\`)`

**Dopad:** Tyto tři seed soubory **neimportují** `logError` helper (LH-01 oprava). Předávají jen `err.message` (string) — NestJS `Logger.error(string)` bez druhého argumentu → žádný celý `err` objekt do logu. Technicky bezpečné. Ale **nedodržují sjednocený vzor** `logError`; pokud se sem v budoucnu přidá druhý argument (stack/trace), nebude normalizován.

**Klasifikace:** 🆕. **L3** (statická analýza + dosažitelnost v prod: ano, `OnApplicationBootstrap`). **Sev: 🟡 střední** — aktuálně bezpečné, ale vzorová nedůslednost (consistency gap, ne aktivní leak).

**Návrh:** Sjednotit s `logError(this.logger, '...', err)` — stejná bezpečnost + budoucí scrubber pokryje automaticky.

---

### LH-RUN-03 — `SEED` — `pages-world-seed.listener.ts` bez try/catch a bez Logger

**Osa:** `SEED`/`EXC` · **Kde:** `pages-world-seed.listener.ts:71` — `handleWorldCreated` nemá try/catch ani Logger

**Dopad:** `@OnEvent('world.created')` handler — pokud seedování stránky selže (DB chyba, duplikát), výjimka probublá do NestJS event emitteru. NestJS `EventEmitter2` v defaultu neodchytí a neloguje event handler výjimky — **pád projde tiše** (nebo skrze top-level handler, pokud je). S `logError` wrapperem by to bylo vidět. Aktuálně: tiché selhání seeda stránek při vytvoření světa.

**Klasifikace:** 🆕. **L2** (staticky viditelné, dosažitelnost zřejmá). **Sev: 🟡 střední** — log hygiene (tiché selhání), ne security leak.

**Návrh:** Přidat `try/catch` s `logError(logger, 'World seed selhal', err)` do `handleWorldCreated`.

---

### LH-RUN-04 — `SEC`/`SEED` — K-LOG13: migrace Matrix účtů (email/heslo/hash) — ABSENT

**Osa:** `SEC`/`SEED` · **Kde:** K-LOG13 hypotéza — „import 22 globálních Matrix účtů" přes `MIGRATION_USERS` secret

**Výsledek:** Žádný migrační skript pro Matrix uživatelské účty nalezen v kódu (žádný `MIGRATION_USERS`, žádný bcrypt seed, žádný one-off import script). Hypotéza K-LOG13 (největší riziko oblasti) je **vyvrácena staticky** — leak sec/hash v logu z migrace neexistuje, protože skript neexistuje (byl zřejmě one-off mimo repo nebo nebyl implementován).

**Klasifikace:** ♻️ (K-LOG13 verdikt: ✅ N/A). **L3** (staticky prohledáno celé BE src/). **Sev: 🟢 pozitivní.**

---

## PROOF-REQUEST

### PR-06-01 — Produkční stdout při seed hodin (runtime ověření)

**Co chybí:** Seed skripty běží `OnApplicationBootstrap` / `onModuleInit` při každém prod startu → jejich log volání jsou **trvalá prod cesta**. Statická analýza potvrzuje jen obsah logu; nelze bez live prostředí ověřit, že v prod stdout skutečně nevyteče nic citlivého (např. Mongo error s `keyValue.email` při fail seeda — `logError` wrapper na 3 seed souborech chybí, viz LH-RUN-02).

**Metoda:** M-RUNTIME stdout capture při simulovaném seeding pádu (fault injection DB error při `article-categories.seed.ts`) → ověřit, že zachycený stdout neobsahuje Mongo `keyValue.email` nebo jiné PII pole.

**Blokující pro:** L5. Současná L = L3 (statická dosažitelnost).

---

## Shrnutí oblasti 06

- K-LOG13 (klíčová hypotéza oblasti) → **✅ N/A** — migration script nenalezen.
- `users.service.ts:95` (`JSON.stringify(conflicts)` usernames) → **⚖️ LH-08 by-design** (platí z předchozího sweepu).
- `matrix-world.seed.ts`, `rulebook-matrix-seed.ts`, `world-page-templates.matrix-seed.ts` → **správně** používají `logError`; logují jen literály/počty.
- 3 seed soubory nepoužívají `logError` wrapper (LH-RUN-02 🟡).
- `pages-world-seed.listener.ts` bez try/catch (LH-RUN-03 🟡).
- 2 `logger.debug` v boot seed cestách — gated LH-02, ale zbytek v kódu (LH-RUN-01 🟢).
