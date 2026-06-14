# 00 — Cross-cutting: architektura konfigurace, 4 zdroje pravdy, master matice, tooling

> Společný základ pro všechny oblasti. Drží: (A) jak se konfigurace načítá v obou repo, (B) **4 zdroje
> pravdy** a jejich drift, (C) **master matici env proměnných**, (D) **fallback katalog**, (E) **tooling
> spec** (M-ENV / M-FALLBACK / M-SECRET / M-BOOT / M-PARITY).
>
> ⚠️ Tento dokument zapisuje **názvy** proměnných a **fallback řetězce z kódu** (které jsou veřejné v repu).
> **Nikdy** sem nepatří reálné produkční secrety (hodnoty z GitHub Secrets / `.env` na serveru).

---

## A. Architektura načítání konfigurace

### BE (NestJS)
- **ConfigModule** globálně: [`app.module.ts:61`](../../../Projekt-ikaros/backend/src/app.module.ts#L61) → `ConfigModule.forRoot({ isGlobal: true })`.
  - 🔴 **Žádný `validationSchema`** → žádná startup-time validace. Chybějící proměnná se projeví až při prvním čtení (runtime). **Kořen oblasti 01.**
- **Dva vzory čtení** — nekonzistentní:
  - `ConfigService.get<string>('X')` (DI, testovatelné) — většina služeb.
  - `process.env.X` **přímo** — [`main.ts`], [`socket-io.adapter.ts`], [`base.gateway.ts`], [`redis.module.ts`]. Mimo DI, hůř testovatelné, snadný drift.
- **Fail-fast vzor** (jen 2 místa): `?? (() => { throw … })()` pro `JWT_SECRET` ([`auth.module.ts:25`]) a `JWT_REFRESH_SECRET` ([`auth.service.ts:74`]). Vše ostatní **tiše fallbackuje** nebo vrací prázdno.

### FE (Vite)
- **`import.meta.env.VITE_*`** — Vite **zapéká hodnoty do bundlu při buildu** (ne runtime). Změna prostředí = nový build.
- Čtené proměnné: `VITE_API_URL` ([`client.ts:8`](../../src/shared/api/client.ts#L8), [`socket.ts:6`](../../src/features/chat/api/socket.ts#L6)), `VITE_TURNSTILE_SITE_KEY` ([`RegisterModal.tsx:50`]).
- Fallback `?? 'http://localhost:3000'` v `client.ts`/`socket.ts` → při buildu bez `VITE_API_URL` celý FE volá localhost.
- 📚 **Pozn.:** `VITE_TURNSTILE_SITE_KEY` je **veřejný** site-key (patří do frontendu by-design) — není leak. Naopak `TURNSTILE_SECRET` je BE-only secret. Nesmí se zaměnit.

---

## B. Čtyři zdroje pravdy + jejich drift

Konfigurace nemá jeden kontrakt — žije ve **4 nezávislých seznamech**, které se musí shodovat ručně:

| # | Zdroj | Co deklaruje | Drift riziko |
|---|---|---|---|
| 1 | **Kód** (`process.env` / `ConfigService.get` / `import.meta.env`) | co aplikace **reálně čte** (+ fallbacky) | kanonický seznam — vše ostatní se měří proti němu |
| 2 | **`.env.example`** (FE i BE) | co je **zdokumentováno** pro vývojáře | zastarává; chybí nově přidané proměnné |
| 3 | **`deploy.yml`** (`.github/workflows`, FE i BE) | co se **předává do produkce** (`vars` + `secrets`) | čte-ale-nepředáno = prod degraduje/spadne |
| 4 | **`docker-compose.prod.yml`** (BE) | co se **injektuje do kontejneru** (+ `:?required` / `:-default`) | poslední override; může krýt nebo nekrýt kódový fallback |

> 💡 **M-ENV** (tool, oblast tools) tyto 4 seznamy strojově sjednotí a vypíše tři kategorie driftu:
> **(a)** čteno v kódu, ale chybí v deploy/compose → prod použije fallback (často localhost);
> **(b)** v deploy/compose, ale nikde nečteno → mrtvá proměnná / přejmenování;
> **(c)** v `.env.example`, ale nečteno → zavádějící dokumentace.

---

## C. Master matice env proměnných (recon 2026-06-14)

> Inventář z reconu. Sloupce: **Proměnná · Čte (soubor:ř) · Default/fallback · Kryje compose/deploy? · Kritičnost · Osa**.
> Plné ověření (4-zdroj diff) je úkol oblasti 01 — tahle matice je **vstupní hypotéza**, ne verdikt.

### BE — bezpečnost / secrety
| Proměnná | Čte | Default/fallback v kódu | Kryto? | Krit. | Osa |
|---|---|---|---|---|---|
| `JWT_SECRET` | auth.module.ts:25 | **throw** (fail-fast) | deploy ✅ + compose `:?required` | 🔴 | SC |
| `JWT_REFRESH_SECRET` | auth.service.ts:74 | **throw** | deploy ✅ + compose `:?required` | 🔴 | SC |
| `JWT_EXPIRES_IN` | auth.module.ts:30 | `'7d'` | deploy `:-7d` | 🟡 | KR |
| `JWT_REFRESH_TTL_DAYS` | (auth) | `30` | deploy | 🟡 | KR |
| `TURNSTILE_SECRET` | captcha.service.ts:36 | **none → bypass `return true`** | deploy (secret) | 🔴 | SC/FB |
| `VAPID_SUBJECT/PUBLIC_KEY/PRIVATE_KEY` | push.service.ts:30-32 | none → push off (app nepadne) | deploy | 🟠 | SC |

### BE — origin / síť
| Proměnná | Čte | Default/fallback | Kryto? | Krit. | Osa |
|---|---|---|---|---|---|
| `FRONTEND_URL` | main.ts:25, socket-io.adapter.ts:7, base.gateway.ts:11, +12 gateway | `'http://localhost:5173'` (+ hardcoded `:5174`) | deploy/compose | 🔴 | OG/PA |
| `BACKEND_BASE_URL` | upload.service.ts:431 | `'http://localhost:3000'` | deploy/compose | 🔴 | ST/PA |
| `PORT` | main.ts:57 | `3000` | compose | 🟡 | — |
| `REDIS_URL` | redis.module.ts:20, socket-io.adapter.ts:34 | `'redis://localhost:6379'` | compose `redis://redis:6379` | 🟠 | FB |
| `SOCKET_IO_REDIS` | socket-io.adapter.ts:33 | undefined → in-memory | compose `"1"` | 🟠 | FB |

### BE — storage / search / mail
| Proměnná | Čte | Default/fallback | Kryto? | Krit. | Osa |
|---|---|---|---|---|---|
| `MONGODB_URI` | database.module.ts:10 | `'mongodb://localhost:27017/ikaros'` | compose | 🔴 | FB |
| `CLOUDINARY_URL` | upload.service.ts:121 | none → log error, upload→disk | deploy (secret) | 🔴 | ST |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | app.controller.ts:27-29 (healthcheck) | `''` / none | deploy | 🟡 | ST |
| `MEILI_HOST` | meili-search.service.ts:30 | `'http://localhost:7700'` | compose `http://meilisearch:7700` | 🟠 | FB |
| `MEILI_API_KEY` | meili-search.service.ts:31 | `''` | compose `${MEILI_MASTER_KEY}` | 🔴 | SC/ST |
| `SMTP_HOST/USER/PASS` | mailer.module.ts:16, smtp-mailer.provider.ts:35-38 | none → LogMailer | deploy | 🟠 | ML |
| `SMTP_PORT` | smtp-mailer.provider.ts:36 | `587` | deploy | 🟡 | ML/TL |
| `MAIL_FROM` | smtp-mailer.provider.ts:40 | `Projekt Ikaros <${user}>` | deploy | 🟡 | ML |
| `FRONTEND_URL` (mailer odkazy) | smtp-mailer.provider.ts:42 | **`'https://newmatrix.patrikzplzne.cz'`** (mrtvý web) | deploy | 🔴 | ML/PA |

### BE — ostatní (bezpečné defaulty / test-only)
`DELETION_HOLD_DAYS` (30) · `EMBEDDING_*` (true/750/250/cache dir) · `NODE_ENV` · `JEST_WORKER_ID`/`PARITY_REGENERATE` (test-only).

### FE
| Proměnná | Čte | Default/fallback | Build-time? | Krit. | Osa |
|---|---|---|---|---|---|
| `VITE_API_URL` | client.ts:8, socket.ts:6 | `'http://localhost:3000'` | ✅ zapečeno | 🔴 | BL/PA |
| `VITE_TURNSTILE_SITE_KEY` | RegisterModal.tsx:50 | `'1x000…AA'` (veřejný test key) | ✅ zapečeno | 🟡 | BL |
| `FRONTEND_PORT` | docker-compose.yml:12 | `8081` | runtime | 🟡 | DP |

---

## D. Fallback katalog (předběžný — M-FALLBACK ho doplní + ověří dosažitelnost)

> Každý `?? '…'` / `|| '…'` / prázdný default je **potenciálně dev hodnota dosažitelná v prod**. Verdikt
> (🐛 / ⚖️ kryto compose / ✅ bezpečné) padne v `FK` ose. Tabulka řadí podle rizika.

| Fallback v kódu | Soubor:ř | V prod dosažitelný? | Verdikt (hypotéza) |
|---|---|---|---|
| captcha `return true` bez secret | captcha.service.ts:36 | ano, pokud secret chybí | 🔴 K-PC1 |
| `'https://newmatrix.patrikzplzne.cz'` | smtp-mailer.provider.ts:42 | ano, pokud `FRONTEND_URL` chybí v mailer ctx | 🔴 K-PC2 |
| `'http://localhost:5173'` + `'http://localhost:5174'` | main.ts:25-27, socket-io.adapter.ts:7-8 | `:5174` vždy v allowlistu | 🟠 K-PC4 |
| `'http://localhost:3000'` (BACKEND_BASE_URL) | upload.service.ts:431 | ano, pokud chybí | 🟠 K-PC5 |
| `''` (MEILI_API_KEY) | meili-search.service.ts:31 | compose kryje; jinde ne | 🟠 K-PC6 |
| `'http://localhost:3000'` (VITE_API_URL) | client.ts:8, socket.ts:6 | ano, pokud build bez argu | 🟠 K-PC15 |
| `'redis://localhost:6379'`, `'http://localhost:7700'`, `'mongodb://localhost…'` | redis/meili/database | compose kryje | 🟡 K-PC20 (ověř L3) |
| `process.env.FRONTEND_URL` (base.gateway, bez :5174) | base.gateway.ts:11 | dvojí zdroj WS originu | 🟡 K-PC13 |

---

## E. Tooling spec (detail → [tools/prod-config-scan.md](tools/prod-config-scan.md))

| Tool | Vstup | Výstup | Úroveň |
|---|---|---|---|
| **M-ENV** | kód (grep `process.env`/`ConfigService.get`/`import.meta.env`) × `.env.example` × `deploy.yml` × `docker-compose.prod` | 3 drift seznamy (a/b/c z §B) | L2/L4 |
| **M-FALLBACK** | grep `??`/`\|\|` string literály v obou repo | katalog §D + sloupec „kryto compose?" | L2/L3 |
| **M-SECRET** | gitleaks/regex přes strom **+ git log** | hardcoded secrety / placeholdery / entropy | L2/L5 |
| **M-BOOT** | BE `createTestApp` s prázdným/minimálním `.env` | tabulka „padlo fail-fast vs tiše fallbacklo" | L5 |
| **M-PARITY** | FE `VITE_API_URL` ↔ BE `FRONTEND_URL`/CORS ↔ `BACKEND_BASE_URL` | kruh konzistentní? vše `https://`? | L6 |

> 💡 M-ENV + M-FALLBACK jsou kandidáti na **CI guard** (vzor [`scripts/route-audit.mjs`](../../scripts/route-audit.mjs),
> `npm run audit:routes`) — drift a nové dev fallbacky nesmí projít tiše do main.

---

## F. Pasti specifické pro tooling

- **Compose override vs kódový fallback** — `FK` nesmí hlásit `MEILI_HOST` jako 🔴, když ho `docker-compose.prod.yml` přepisuje na `meilisearch:7700`. Tool musí číst i compose, ne jen kód. Nález jen tam, kde **žádný** zdroj fallback nekryje.
- **`deploy.yml` `vars` vs `secrets`** — klasifikace: secret (JWT, SMTP_PASS, CLOUDINARY_URL, VAPID_PRIVATE_KEY, TURNSTILE_SECRET, MEILI_MASTER_KEY) vs var (URL, port, TTL). M-SECRET ověří, že žádný secret není omylem `vars` (vars jsou v logu čitelné).
- **FE build-time vs runtime** — M-PARITY musí číst `VITE_API_URL` z **Dockerfile ARG / deploy var**, ne z runtime `.env` (FE žádný runtime env nemá).
- **Git historie** — M-SECRET sken historie cross-ref [paměť `project_git_history_cleanup`] (FE/BE filter-repo proběhl); ověřit, že žádný secret nezůstal v starých commitech.
- **Sandbox** — boot-probe spouštět s **dummy** env (ne reálnými secrety); cílem je chování (padá/fallbackuje), ne funkční app.
