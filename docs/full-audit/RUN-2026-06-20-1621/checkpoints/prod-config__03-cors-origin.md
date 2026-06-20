# prod-config / 03-cors-origin — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Auditor: hloubkový agent oblasti 03.

## Pokrytí

Přečteno HEAD kódu:
- `backend/src/common/config/origins.ts` — nový centrální helper (PC-04/13 oprava)
- `backend/src/main.ts` — REST CORS + static CORS + Swagger gate + tělo limity
- `backend/src/socket-io.adapter.ts` — WS CORS + maxHttpBufferSize
- `backend/src/gateways/base.gateway.ts` — PC-13 fix: žádný cors v dekorátoru
- Všech **14 gateway** souborů (grep `cors` přes `**/*.gateway.ts`) — ověřeno, žádný nedrží `cors:` v `@WebSocketGateway` dekorátoru
- `backend/src/common/config/env.validation.ts` + `.spec.ts` — startup validace + testy
- `backend/src/app.module.ts` — `ConfigModule.forRoot({ validate: validateEnv })`
- `backend/src/modules/mailer/providers/smtp-mailer.provider.ts` — PC-02 fix ověřen
- `docker-compose.prod.yml` — compose env (FRONTEND_URL bez `:?required`)
- Scanner `config.txt` (M-FALLBACK: `FRONTEND_URL` fallbacky na řádcích 62-63)
- Worktree `feat+krok-16b-feature-parity/backend/.../game-events` — žádný gateway soubor, žádné CORS

## Dosažená L vs cílová L

- **Cílová L (oblast 03):** L4 (jádro `OG`/`FB`) — deploy parita 4 zdrojů
- **Dosažená L: L3** — přečteno + kontext dosažitelnosti + ověřena gatednost `localhost:5174`; deployment parita (compose ↔ kód) čtena, živá infra neověřena
- Živá infra (je produkce skutečně `NODE_ENV=production`?) → PROOF-REQUEST (viz níže)

## Nálezy

### ♻️ Opraveny (ověřeno HEAD kódem) — původní PC-04 a PC-13

**PC-04 ✅ OPRAVENO (L3)**
- `localhost:5174` nyní gated na `NODE_ENV !== 'production'` v `origins.ts:12-14`
- V produkci `getAllowedOrigins()` vrátí jen `[FRONTEND_URL ?? 'http://localhost:5173']` bez dev portů
- Osa: `OG`/`FB` · L3 · ♻️

**PC-13 ✅ OPRAVENO (L3)**
- `base.gateway.ts` nedrží `cors:` v `@WebSocketGateway({ namespace: '/' })` (ř. 12-14)
- Všech 13 ostatních gateway: žádný `cors:` v dekorátoru — jen komentář `// PC-13: WS CORS řeší CustomIoAdapter`
- `socket-io.adapter.ts` čte `getAllowedOrigins()` z `origins.ts` — jediný zdroj
- Osa: `OG`/`HD` · L3 · ♻️

---

### 🆕 Nové nálezy

**PC-RUN-03-01 — `FRONTEND_URL` není compose fail-fast: CORS fallback na localhost v prod**
- Kde: `origins.ts:10` + `origins.ts:20` + `docker-compose.prod.yml:95`
- Popis: `getAllowedOrigins()` / `getPrimaryOrigin()` čtou `process.env.FRONTEND_URL ?? 'http://localhost:5173'` přímo (ne ConfigService). `env.validation` řadí `FRONTEND_URL` do `RECOMMENDED_IN_PROD` — tj. jen varuje, neblokuje start. `docker-compose.prod.yml:95` má `FRONTEND_URL: ${FRONTEND_URL}` bez `:?required`. Pokud chybí v deploy env, `origins.ts` vrátí `http://localhost:5173` jako povolený origin → REST + WS + static CORS povolují jen localhost → všechny FE požadavky z `www.projekt-ikaros.com` jsou odmítnuty CORS (funkční blok, ne security bypass).
- Dopad: 🟠 — funkční průlom v prod při chybějícím `FRONTEND_URL` (app nefunguje, tiše se nehlásí při startu)
- Návrh: buď přidat `:?required` v compose pro `FRONTEND_URL` (konzistentní se `JWT_SECRET`), nebo přesunout `FRONTEND_URL` do `REQUIRED_IN_PROD` v `env.validation.ts`. Záleží na filozofii (env.validation.ts:9-13 záměrně neblokuje). Aspoň přidat do compose.
- Vztah: PC-10 (config parita) + PC-24 (meta-kořen compose fail-fast); faseta původního PC-04 zmíněna v plánu oblasti, ale oprava PC-04 řešila jen `:5174` gate, ne chybějící `FRONTEND_URL` fallback.
- L3 · 🆕 · `OG`/`FB`

**PC-RUN-03-02 — `origins.ts` čte `process.env` přímo, ne `ConfigService` (ConfigService vs process.env)**
- Kde: `origins.ts:10` + `origins.ts:20`
- Popis: Helper je volán v `main.ts` před/během NestJS bootstrap (CORS setup, static assets) — ConfigService v tu dobu ještě není přístupný jako DI injectable. Přímé `process.env` je tedy záměrné a technicky správné. Nicméně K-PC13 plánoval „sjednotit zdroj originu na ConfigService" — toto nebylo a nemohlo být aplikováno na bootstrapové volání.
- Dopad: 🟡 — není bezpečnostní problém (v `main.ts` context je `process.env` správné); potenciálně matoucí pro budoucí autory (vypadá jako „nepoužívá ConfigService")
- Návrh: doplnit komentář do `origins.ts` že přímé `process.env` je záměrné (DI není dostupné při bootstrap), ne přehlédnutí.
- L1 · 🆕 · `HD`

**PC-RUN-03-03 — `maxHttpBufferSize` 5 MB v WS adapteru konzistentní s body limitem**
- Kde: `socket-io.adapter.ts:22` + `main.ts:48-49`
- Popis: Oblast 03 explicitně vede `maxHttpBufferSize` jako kontrolní bod (konzistence s body limitem oblasti 08). Oba jsou `5mb`. Žádný nález.
- Verdikt: ✅ konzistentní · L1

**PC-RUN-03-04 — `credentials: true` přítomno na všech 3 aktivních vrstvách**
- Kde: `main.ts:67` (REST), `socket-io.adapter.ts:25` (WS), static `/static/` nemá `credentials` (je to statický CORS, ne preflight)
- Popis: REST CORS + WS CORS mají `credentials: true`. Origin není `*` (je explicitní allowlist). Static assets `setHeaders` nastavuje jen `Access-Control-Allow-Origin` + `Cross-Origin-Resource-Policy:cross-origin` — pro statické soubory `credentials` není nutné (žádné cookies).
- Verdikt: ✅ správně nastaveno · L1

**PC-RUN-03-05 — `static /static/` CORS: `getPrimaryOrigin()` vrací jednu hodnotu (správně)**
- Kde: `main.ts:98-104`
- Popis: `setHeaders` callback musí vracet pevnou hodnotu (ne pole), `getPrimaryOrigin()` vrací `string`. Pokud `FRONTEND_URL` chybí → localhost (viz PC-RUN-03-01). Logika je správná, riziko je shodné s PC-RUN-03-01.
- Verdikt: bez samostatného nálezu — krývá PC-RUN-03-01 · L1

## PROOF-REQUEST

**PROOF-03-A — živá infra: je `NODE_ENV=production` v deploy?**
- Potřeba: ověřit, že `docker-compose.prod.yml` skutečně předává `NODE_ENV=production` a že se to projeví v `origins.ts:12` gatu. Staticky přečteno pouze `origins.ts` + compose — live hodnota neověřena.
- Kde: `docker-compose.prod.yml` — hledat `NODE_ENV`; pak `docker inspect` nebo logovat při startu.
- Bloky: L3→L4; bez ověření nelze tvrdit, že `:5174` je v prod skutečně blokován.
- Priorita: střední — riziko existuje jen v edge case (produkce bez `NODE_ENV=production`).

**PROOF-03-B — deploy: předává se `FRONTEND_URL` v GitHub Actions vars?**
- Potřeba: ověřit, že `FRONTEND_URL` je v GitHub Actions vars (`vars.FRONTEND_URL`) a předává se do compose; jinak PC-RUN-03-01 je reálně dosažitelný.
- Kde: `.github/workflows/deploy.yml` — sekce `env:` / compose předávání.
- Bloky: L3→L4 (deploy parita pro tuto proměnnou).
- Priorita: vysoká — přímo podmiňuje funkčnost CORS v produkci.
