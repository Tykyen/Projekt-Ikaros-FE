# Spec 14.6 — SCA (skenování závislostí) + opt-in Redis throttler

> Fáze 14 · krok 14.6 · [A6 · dopad střední · náklad ~~malý~~ → **střední** (viz nález níže)]
> Status: **✅ implementováno (2026-06-19)** — čeká BE restart/redeploy
> Repozitáře: **oba** (FE `Projekt-ikaros-FE`, BE `Projekt-ikaros/backend`)

## ✅ Implementováno (2026-06-19)

**A1 úklid:** prod high+critical = **0** v obou repo. FE `npm audit fix` (jen lockfile, semver-safe). BE: `multer` override `^2.2.0` (spravil multer DoS + kaskádu 8 NestJS „high"), `nodemailer` `^9.0.1` (`@types` ponechány na 8 — API průnik), `npm audit fix`. Ověřeno FE build + 2812 unit + e2e (1. e2e běh flaky po zátěži stroje → retry zelený, PIXI/render audit fix nedotkl), BE 2163 testů.
**A2 brána:** `npm audit --omit=dev --audit-level=high` v obou `ci.yml` (FE job `frontend-build`, BE `backend-typecheck`) + `.github/dependabot.yml` (oba repo; npm + github-actions, weekly, grouped minor/patch).
**B throttler:** [throttler.config.ts](../../../../Projekt-ikaros/backend/src/common/throttler/throttler.config.ts) `createThrottlerOptions` + `ThrottlerModule.forRootAsync` v app.module; `@nest-lab/throttler-storage-redis@1.2.0`; `THROTTLER_REDIS` v `.env.example`; unit test 4 větve (default / přepínač bez URL / Redis OK / Redis down → fallback). D-028 → Vyřešené.
**Odchylky od návrhu:** balíček = `@nest-lab/throttler-storage-redis` (ne `@nestjs/throttler-storage-redis` — ten pro v6+NestJS11 neexistuje); předáván **URL string** (ne ioredis instance) → service si spravuje vlastní klient (disconnectRequired). Probe = dedikovaný krátký ioredis s `retryStrategy:()=>null` (rychlý boot fallback).

---

## Cíl

Dvě nezávislé části:
- **A — SCA:** automatické hlídání zranitelných balíčků (Dependabot + `npm audit` v CI) v obou repo.
- **B — Redis throttler:** přepínatelný (opt-in) Redis-backed rate-limit pro multi-instance BE, default zůstává in-memory. Uzavírá BE dluh **D-028**.

## Klíčový nález (mění zadání)

Roadmapa řadí krok jako „náklad malý". **Měření `npm audit` 2026-06-19 ukázalo, že obě repo už dnes nesou neopravené zranitelnosti** — bránu nelze zapnout na špinavém stavu, nejdřív úklid:

| | prod-only (runtime) | vč. dev |
|---|---|---|
| **FE** | 6 (3 low, 1 mod, **2 high**) | 17 (+5 critical) |
| **BE** | 15 (4 mod, **11 high**) | 15 |

- **FE high** = `ws` (memory disclosure + DoS) přes socket.io klient. FE **critical jsou jen dev** (vitest browser mode — build toolchain, ne runtime).
- **BE high** = `ws`, `fast-uri`, `form-data`, `multer`, `nodemailer` + NestJS balíčky (transitivně dědí z `ws`/`fast-uri` → spraví se opravou kořene).
- `npm audit fix` **bez `--force`** (jen semver-safe bumpy): FE removed 1/changed 25, BE changed 75 → velká část jde opravit bez breaking changes.

⚠️ Kdyby se brána přidala rovnou na práh `high`, CI obou repo okamžitě zčervená. **Pořadí: A1 úklid → A2 brána.**

---

## Část A — SCA

### A1 — Úklid existujících zranitelností (předpoklad brány)

1. `npm audit fix` (bez `--force`) v obou repo.
2. Ověřit, že nic nerozbil:
   - FE: `npm run build` (tsc -b + vite) + `npm run test:run` + `npm run test:e2e`.
   - BE: `npm run typecheck` + `npm run lint:check` + `npx jest --maxWorkers=2` (plný běh, viz `project_be_test_mongo_flaky`).
3. Re-audit. Co **zbude na prod high+critical** po safe fixu → vyhodnotit jednotlivě:
   - targeted bump (`npm i pkg@safe`), nebo
   - pokud vyžaduje breaking major a fix není reálný hned → **doložená výjimka** (komentář v `dluhy.md` + cílený exclude, ať brána neblokuje na známém přijatém riziku).

> 💡 SSL chyba `unable to verify the first certificate` je lokální Windows specifikum (firemní CA) — řeší `NODE_OPTIONS=--use-system-ca`. **V CI (ubuntu) nevzniká.**

### A2 — CI brána + Dependabot

**`npm audit` krok** do obou `ci.yml`:
```
npm audit --omit=dev --audit-level=high
```
- `--omit=dev` = jen runtime závislosti (dev/build toolchain řeší Dependabot, ne blokace).
- `--audit-level=high` = build selže jen na **high + critical**.
- FE: nový krok v jobu `frontend-build` ([ci.yml](../../../.github/workflows/ci.yml)).
- BE: nový krok v jobu `backend-typecheck` (`working-directory: backend`).
- Spouští se na každý push/PR na `main` (stejně jako zbytek CI).

**`.github/dependabot.yml`** v **obou** repo:
- ekosystémy: `npm` (root; BE = `/backend`) + `github-actions` (hlídá verze samotných workflow akcí).
- rozvrh: `weekly`.
- `open-pull-requests-limit` rozumný (např. 5), aby PR nezahltily.
- Pokrývá i `low`/`moderate`/`dev` zranitelnosti, které brána nezablokuje — řeší se průběžně přes PR.

### A — zodpovězené otevřené otázky
- **Práh, který blokuje build?** → **high na prod** (`--omit=dev --audit-level=high`). Dev critical (vitest) jen přes Dependabot.
- **Report-only fáze?** → ne; místo toho A1 úklid → brána rovnou enforce (deterministické, ne flaky).

---

## Část B — Opt-in Redis throttler (D-028)

### Princip
Přesně podle vzoru `SOCKET_IO_REDIS=1` ([socket-io.adapter.ts:29](../../../../Projekt-ikaros/backend/src/socket-io.adapter.ts)): env přepínač, default vypnuto.

- Nový package: **Redis storage adapter kompatibilní s `@nestjs/throttler` v6** (název ověřit v impl. fázi — v6 API se liší od starších; kandidát `@nest-lab/throttler-storage-redis`).
- `ThrottlerModule.forRoot(...)` → **`forRootAsync`** s podmíněným `storage`:
  - `THROTTLER_REDIS === '1'` **a** `REDIS_URL` přítomné → Redis storage (sdílený bucket napříč instancemi).
  - jinak → undefined storage = **default in-memory** (dnešní chování beze změny).
- **Fallback:** když `THROTTLER_REDIS=1` ale Redis nedostupný/`REDIS_URL` chybí → spadnout na in-memory + `console.warn` (vzor jako `UserBanCacheService`). Throttling nesmí shodit start ani uzavřít endpointy.
- Limity (default 100/min + per-endpoint `@Throttle`) se **nemění** — mění se jen úložiště counteru.
- Vlastní Redis spojení pro throttler (duplicate), ať query-flow neblokuje (vzor: socket adapter má dedicated pub/sub client). Ověřit, zda v6 adapter umí přijmout existující `ioredis` klient z `RedisModule` (`'REDIS'` token) — preferovat reuse před novým spojením, pokud to API dovolí.

### Konfigurace
- `.env.example`: přidat `THROTTLER_REDIS=` (komentář: „1 = Redis-backed throttler pro multi-instance; default in-memory").
- `env.validation.ts`: **nepřidávat** do REQUIRED/RECOMMENDED — je opt-in, default chování je validní (konzistentní s tím, že `SOCKET_IO_REDIS` tam taky není).
- `docker-compose.prod.yml`: Redis service už existuje; přepínač zůstává vypnutý, dokud nepřijde multi-instance deploy.

### B — zodpovězené otevřené otázky
- **Zapínat hned, nebo až při škálování?** → **opt-in, default vypnuto.** Single-instance deploy ho nepotřebuje (overhead + mrtvý kód); aktivuje se env přepínačem až při 2+ replikách.

### B — uzavírá dluh
- BE **D-028** (`docs/dluhy.md` v BE repo): po implementaci přepsat ze stavu „čeká na trigger" na vyřešeno (kód existuje, aktivace = ops). FE křížový odkaz v `docs/dluhy.md` (D-NEW-chat-presence-scale zmiňuje „in-memory rate-limiter D-028") ponechat — presence je samostatný dluh.

---

## Dotčené soubory

**FE:**
- `.github/workflows/ci.yml` — krok `npm audit`.
- `.github/dependabot.yml` — nový.
- `package-lock.json` — A1 úklid (changed by `npm audit fix`).
- `docs/roadmap2.md`, `docs/dluhy.md`, `docs/funkce/*` — dokumentace.

**BE:**
- `.github/workflows/ci.yml` — krok `npm audit`.
- `.github/dependabot.yml` — nový.
- `backend/package.json` + `backend/package-lock.json` — nový throttler-storage package + A1 úklid.
- `backend/src/app.module.ts` — `ThrottlerModule.forRootAsync` s podmíněným storage.
- (příp.) nový `backend/src/common/throttler/throttler-storage.factory.ts` — factory přepínače + fallback.
- `backend/.env.example` — `THROTTLER_REDIS`.
- `backend/docker-compose.prod.yml` — komentář k přepínači (volitelné).
- `backend/test/auth-throttle.e2e-spec.ts` — případně rozšířit o opt-in cestu.

## Rizika
- ⚠️ `npm audit fix` může i bez `--force` posunout minor verzi a změnit chování → proto povinné build+testy v A1.
- ⚠️ BE `jest` plný paralelní běh je flaky na MongoMemoryServer (`project_be_test_mongo_flaky`) → ověřovat `--maxWorkers=2`.
- ⚠️ Po BE změně (throttler/env) nutný **restart** BE (`project_be_restart_required`).
- ⚠️ Po každé BE změně z whitelist ValidationPipe pozor na drop neznámých polí — netýká se tu (jen infra), ale env restart ano.
- 🔀 Verze throttler-storage package musí sednout na `@nestjs/throttler` v6 — špatný balíček = runtime/DI crash. Ověřit `npm view ... peerDependencies` před instalací.

## Plán ověření (před push)
- FE: `npm run build` + `npm run test:run` + `npm run test:e2e` zelené; `npm audit --omit=dev --audit-level=high` exit 0.
- BE: `npm run typecheck` + `npm run lint:check` + `npx jest --maxWorkers=2` zelené; `npm audit --omit=dev --audit-level=high` exit 0.
- Throttler: opt-in cesta otestovaná (env `THROTTLER_REDIS=1` + běžící Redis → 429 stále funguje; bez Redis → fallback in-memory + warn, ne crash).
- CI: po push ověřit, že nové joby/kroky prochází.
