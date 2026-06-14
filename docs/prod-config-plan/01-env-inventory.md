# 01 — Env inventory + validace

> **Osy:** `EV` (env inventory & validation), `ED` (env drift sken).
> **Cílová otázka:** je každá proměnná, kterou kód čte, **deklarovaná** (example + deploy + compose) a
> **validovaná při startu** — nebo selže až runtime / tiše fallbackne?
> **Kořen auditu:** `ConfigModule.forRoot({ isGlobal: true })` ([app.module.ts:61]) **nemá `validationSchema`**.

---

## Povrch

| Co | Kde |
|---|---|
| Config bootstrap | `app.module.ts:61` (`ConfigModule.forRoot`) |
| Přímé `process.env` | `main.ts`, `socket-io.adapter.ts`, `base.gateway.ts`, `redis.module.ts`, `captcha.service.ts`, `embedding-search.service.ts` |
| `ConfigService.get` | většina služeb (auth, mailer, upload, meili, push) |
| `.env.example` (BE) | repo root BE — **inventář dokumentace** |
| `.env.example` / `.env.development` (FE) | `VITE_API_URL` |
| Deklarace pro prod | `.github/workflows/deploy.yml`, `docker-compose.prod.yml` |

Plná master matice → [00-cross-cutting §C](00-cross-cutting.md).

---

## Kontrolní kroky (sweep)

1. **Sestav kanonický seznam čtených env** — grep `process.env\.`, `ConfigService.get`, `import.meta.env.VITE_` přes oba repo. Dedup → ~35 proměnných.
2. **M-ENV trojzdrojový diff** (tool) — kód × `.env.example` × `deploy.yml`+`compose`. Vypiš:
   - **(a) čteno, nepředáno** → prod použije fallback (kandidát 🔴/🟠 dle kritičnosti).
   - **(b) předáno, nečteno** → mrtvá proměnná / přejmenování.
   - **(c) v example, nečteno** → zavádějící dokumentace.
3. **Validace při startu** — ověř, zda existuje `validationSchema`. Neexistuje → `EV` nález: navrhni Joi/zod schema pro **povinné** (`MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, prod URL) s fail-fast.
4. **Fail-fast vs runtime** — pro každou 🔴 proměnnou: padá při startu (good) nebo až při prvním použití (bad)? `MONGODB_URI` chybí → spadne první query, ne boot.

---

## Seed mapping

- **K-PC3** 🟠 `EV` — chybí validation schema → runtime fail. **Hlavní výstup oblasti.**
- **K-PC16** 🟠 `ED`/`DP` — 4-zdroj drift (kód ~35 vs deploy ~22 vs example/compose). M-ENV vyčíslí.

## Pasti

- ⚠️ Compose `:?required` / `:-default` je **čtvrtý** zdroj — diff ho musí zahrnout, jinak falešné poplachy.
- ⚠️ Test-only proměnné (`JEST_WORKER_ID`, `PARITY_REGENERATE`) **nepatří** do prod inventáře — vyfiltrovat.
- ⚠️ `NODE_ENV` čte víc míst různě (`=== 'production'` vs `=== 'test'`) — ověřit konzistenci sémantiky.

## Pozitiva k ověření (neztratit)

- ✅ `JWT_SECRET`/`JWT_REFRESH_SECRET` mají fail-fast (`?? throw`) — vzor, který chybí jinde.
- ✅ `deploy.yml` validuje 3 kritické proměnné před deployem — rozšířit, ne nahradit.
