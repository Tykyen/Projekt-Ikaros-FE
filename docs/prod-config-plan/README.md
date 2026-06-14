# Produkční konfigurace — je nasazení nakonfigurované bezpečně, nebo v něm žijí vývojové hodnoty a díry?

> **Účel:** vzít **celou konfigurační vrstvu** obou repo (FE Vite + BE NestJS) — `.env` proměnné,
> jejich načítání, **CORS a WS origin**, **JWT/refresh secrety**, **storage** (Cloudinary + disk),
> **mailer** (SMTP), **deploy pipeline** (GitHub Actions, Docker) a **dev fallbacky** — a tvrdě ověřit,
> že **produkční běh nepoužívá vývojové, slabé ani placeholder hodnoty** a že žádná brána není v prod
> tiše otevřená. Cílová otázka:
> „když se Ikaros nasadí na ostro — **běží proti produkčním službám s produkčními secrety, uzavřeným
> originem a bez dev bypassů**, nebo někde prosákne `localhost`, prázdný klíč, vypnutá captcha, odkaz na
> mrtvý web nebo secret do veřejného bundlu?"
>
> **Dvanáctý sourozenec** [`bug-plan/`](../bug-plan/README.md), [`ws-contract-plan/`](../ws-contract-plan/README.md),
> [`role-plan/`](../role-plan/README.md), [`form-schema-plan/`](../form-schema-plan/README.md),
> [`cache-plan/`](../cache-plan/README.md), [`state-consistency-plan/`](../state-consistency-plan/README.md),
> [`cascade-delete-plan/`](../cascade-delete-plan/README.md), [`db-integrity-plan/`](../db-integrity-plan/README.md),
> [`seed-scenario-plan/`](../seed-scenario-plan/README.md), [`nav-plan/`](../nav-plan/README.md)
> a [`upload-media-plan/`](../upload-media-plan/README.md). Je to **statický breadth-first sweep jedné
> starosti** (produkční konfigurace) napříč oběma repo — jako předchozích jedenáct — ale s **vlastní
> spustitelnou vrstvou**: tool diffne **tři zdroje env** (kód × deploy × docker), katalogizuje fallbacky
> a boot-probe ověří fail-fast, takže nálezy jsou **strojově prokázané**, ne jen vyčtené.
>
> **Stav:** zahájeno 2026-06-14. Plán napsán, sweep nezačal. Nálezy → [`../prod-config-audit.md`](../prod-config-audit.md) (ID `PC-xx`).

---

## Proč samostatný plán (co ostatní audity míjí)

Předchozích jedenáct auditů řeže systém po **datech, stavu a kódu uvnitř aplikace**: kontrakt API, oprávnění,
tvar formuláře, cache, real-time, mazání, integrita DB, lifecycle, navigace, upload. **Žádný neaudituje
vrstvu *pod* aplikací — runtime konfiguraci, se kterou se proces nastartuje.** A přesně tam žije vlastní
třída chyb, kterou žádný kódový sweep nevidí, protože se projeví **jen v produkčním prostředí** a často
**bez chyby** — jen tiše špatně:

| Slepá skvrna | Příklad reálného rizika v Ikarovi | Dopad |
|---|---|---|
| **Dev bypass aktivní v prod** | `TURNSTILE_SECRET` chybí → captcha guard vrátí `true` → registrace bez captchy | 🔴 spam/bot registrace, žádná chyba |
| **Fallback na localhost** | `BACKEND_BASE_URL ?? 'http://localhost:3000'` → disk-fallback obrázky dostanou `localhost` URL | 🔴 rozbité odkazy v prod, jen tiše |
| **Otevřený/dev origin v prod** | CORS allowlist drží hardcoded `http://localhost:5174` (dev stroj) i v produkci | 🟠 zbytečně povolený origin |
| **Slabý / chybějící secret** | `MEILI_API_KEY ?? ''` → search se připojí bez auth; placeholder JWT secret z `.env.example` | 🔴 neautorizovaný přístup / forgeable token |
| **Odkaz na mrtvý web** | mailer `FRONTEND_URL ?? 'https://newmatrix.patrikzplzne.cz'` → reset hesla vede na **starý .NET server** | 🔴 uživatel skončí na cizím webu |
| **Secret do veřejného bundlu** | cokoli citlivého přes `VITE_*` → Vite to **zapeče do client JS** dostupného komukoli | 🔴 leak klíče |
| **Env drift** | kód čte 35 proměnných, deploy předává 22, `.env.example` deklaruje jiných N → kritická chybí v deployi | 🟠 prod běží degradovaně/spadne |
| **Runtime fail místo fail-fast** | žádné validační schema → chybějící `MONGODB_URI` se projeví až první query, ne při startu | 🟠 částečně nabootovaná app |
| **Sourcemaps / console.log v prod** | Vite default nestripuje → zdrojový kód a debug logy v produkčním bundlu | 🟡 info leak |
| **Config kruh nesedí** | `FRONTEND_URL` (BE) ≠ `VITE_API_URL` (FE) ≠ CORS origin → CORS blok nebo díra | 🟠 app nefunguje / leak |

> 💡 **Kořen (jako každý audit má jeden):** konfigurace má **čtyři nezávislé zdroje pravdy** a žádný
> spojovací kontrakt — (1) **kód** (`process.env` / `import.meta.env` s `??` fallbacky), (2) **`.env.example`**,
> (3) **GitHub Actions `deploy.yml`** (`vars`/`secrets`), (4) **`docker-compose.prod.yml`**. Drift mezi nimi
> je tichý a kód ho **maskuje fallbackem** — místo aby spadl, tiše použije vývojovou hodnotu. Audit to
> zviditelní strojově (tool diff tří zdrojů + katalog fallbacků + boot-probe) a rozhodne, kde nahradit
> tichý fallback **fail-fast** chováním a zda zavést **env validation schema**.

📚 **Co je „fail-fast" / „dev bypass" / „env validation schema":** *Fail-fast* = aplikace při chybějící
kritické hodnotě **spadne při startu** (jasná chyba) místo aby tiše běžela s defaultem. *Dev bypass* =
podmínka, co v nepřítomnosti konfigurace **vypne bezpečnostní kontrolu** (pohodlné lokálně, fatální v prod).
*Env validation schema* = deklarativní seznam (Joi/zod), který při startu ověří, že všechny povinné
proměnné existují a mají správný tvar.

---

## Prior art (co už existuje a co míjí)

> ⚠️ Část pojistek už **existuje** — stavíme na nich, neduplikujeme.

| Artefakt | Co dělá | Co míjí |
|---|---|---|
| `deploy.yml` pre-deploy validace (BE) | `test -n "$JWT_SECRET"`, `MEILI_MASTER_KEY ≥ 16B` před deployem | jen 3 proměnné; nehlídá **drift** kód↔deploy ani fallbacky v kódu |
| `docker-compose.prod.yml` `${VAR:?required}` | některé proměnné označené jako povinné | jen podmnožina; nekryje kód-level fallbacky (`?? 'localhost'`) |
| JWT `?? throw` fail-fast | `JWT_SECRET`/`JWT_REFRESH_SECRET` házejí při chybění | jen 2 proměnné; ostatní (`FRONTEND_URL`, `BACKEND_BASE_URL`, …) tiše fallbackují |
| [upload-media audit](../upload-media-audit.md) | Cloudinary/disk lifecycle, rate-limit | konfiguraci Cloudinary (klíče, `secure`, base URL) bere jako dané |
| [ws-contract audit] (paměť `project_ws_security_patterns`) | WS identita/room security | WS **origin** a CORS konfiguraci (kde se nastavuje, fallback) |
| paměť `project_deployment_handoff`, `project_smtp_email_setup` | probíhající deploy + SMTP setup | systematickou kontrolu, že nastavení je **kompletní a bezpečné** |

> 💡 **Pozice tohoto auditu:** je to **konfigurační vrstva pod aplikací**, kterou žádný předchozí audit
> nepokrývá. Existující pojistky (`deploy.yml` test, `:?required`) jsou **bodové** — hlídají pár proměnných.
> Tenhle audit dělá **systematický trojzdrojový diff + fallback katalog + boot-probe** napříč VŠEMI ~35
> proměnnými a oběma repo. Sdílené povrchy (Cloudinary lifecycle, WS security, role R-20) **křížově
> odkazuje** (M2), nezdvojuje.

---

## Kontrolní osy (19 — 7 jádrových + 6 hloubkových + 6 nadstavba)

### Jádro (tvrzeno na celé konfigurační ploše)
| Osa | Zkr | Otázka | Cross-ref |
|---|---|---|---|
| **Env inventory & validation** | `EV` | každá `process.env`/`import.meta.env` proměnná je **deklarovaná** (deploy + example) a **validovaná** při startu (ne až runtime) | nový |
| **Secrets** | `SC` | secret (JWT/refresh/API klíč) je **z env**, **silný**, bez **defaultu/placeholderu v kódu**, není v git historii | role · bug |
| **Origin (CORS/WS)** | `OG` | REST + WS + static origin je v prod **uzavřený** na produkční FE; žádný `localhost`/`*`/dev stroj v allowlistu | ws-contract |
| **Fallbacks** | `FB` | žádný `?? 'localhost'` / `\|\| 'default'` / prázdný klíč není v produkci **reálně dosažitelný** (gated nebo nahrazen fail-fast) | nový |
| **Storage config** | `ST` | Cloudinary klíče/`secure`, disk `BACKEND_BASE_URL`, limity správné v prod; healthcheck neklame | upload-media |
| **Mailer config** | `ML` | SMTP host/port/secure/auth + odkazy v mailech míří na **živou produkční** FE URL (ne mrtvý web) | nový |
| **Deploy parity** | `DP` | `deploy.yml` `vars`/`secrets` ↔ kód ↔ `docker-compose.prod` ↔ `.env.example` se **shodují**; pre-deploy validace kryje kritické | nový |

### Hloubka (skok ze čtení na prokázání)
| Osa | Zkr | Konkrétní tah | Co reálně chytí |
|---|---|---|---|
| **Bundle leak (FE)** | `BL` | co všechno končí v `dist/` — `VITE_*` hodnoty, **sourcemaps**, **console.log**; je tam něco citlivého? | leak klíče / zdrojáku do veřejného balíku |
| **Hardening** | `HD` | `NODE_ENV`, `ValidationPipe.forbidNonWhitelisted`, Swagger v prod, `/health` info leak, security headers | otevřené dveře navíc |
| **Rate-limit / DoS gate** | `RL` | Throttler **globálně registrován** v prod? body/WS buffer limit? není dev-disabled? | DoS / spam brána |
| **TLS / transport** | `TL` | `http://` vs `https://` napříč; cookie `secure`+`httpOnly`+`sameSite`; Cloudinary `secure:true`; SMTP `secure` | plaintext / MITM / token leak |
| **Key / TTL rotation** | `KR` | JWT TTL (7d), refresh TTL (30d), min. délka klíče, žádná rotace | dlouhé okno kompromitace |
| **Config parita FE↔BE** | `PA` | kruh `FRONTEND_URL` (BE) ↔ `VITE_API_URL` (FE) ↔ CORS origin ↔ `BACKEND_BASE_URL` je konzistentní | CORS blok / leak / rozbité odkazy |

### Nadstavba (Maximum/Maximum+ — strop hloubky)
| Osa | Zkr | Konkrétní tah | Co reálně chytí |
|---|---|---|---|
| **Env drift sken** | `ED` | strojový diff 4 zdrojů (kód × example × deploy × compose) → čteno-ale-nepředáno / předáno-ale-nečteno | tichá díra v deployi |
| **Fallback katalog** | `FK` | sken všech `?? '...'` / `\|\| '...'` / prázdných defaultů → seznam dev hodnot dosažitelných v prod | maskovaný localhost/http |
| **Secret sken** | `SS` | gitleaks-style sken repo **+ git historie** na hardcoded secrety/placeholdery/nízkou entropii | uniklý klíč v historii |
| **Boot-probe** | `BP` | spusť BE s prázdným/minimálním env → **musí** padnout fail-fast na chybějící secret, ne tiše dev | falešný fail-fast |
| **Config parita guard** | `M-PARITY` | 👑 cross-repo: ověř že FE↔BE config kruh sedí a všechna prod URL jsou `https://` | rozjetý FE↔BE kontrakt |
| **Teeth (mutace)** | `TE` | zmutuj env guard (`?? throw` → `?? 'dev'`, odeber `:?required`) → config testy/probe **musí** zčervenat | audit-divadlo |

`EV`/`FB`/`ED`/`FK` jsou osy **úplnosti a tichých defaultů** (čte se všechno a nic tiše nefallbackuje?).
`SC`/`SS`/`BP` osy **bezpečnosti secretů** (jsou silné, z env, fail-fast?). `OG`/`TL`/`HD`/`RL` osy
**uzavřenosti běhu** (nejsou otevřené dveře?). `ST`/`ML`/`PA`/`BL` osy **správného směřování** (míří
konfigurace na produkční služby a neuniká do bundlu?). `M-PARITY`/`TE` jsou **nadstavba** — `M-PARITY`
posouvá audit z jednoho repo na **celý stack** (FE↔BE kruh sedí), `TE` dokazuje, že audit **má zuby**.

---

## Metody ověření + úrovně jistoty

| Kód | Metoda | Nástroj |
|---|---|---|
| **M1** | Statické čtení — `main.ts`, ConfigModule, gateway, `client.ts`, `vite.config`, workflows | Read/Grep |
| **M-ENV** | **Trojzdrojový diff** — [`tools/prod-config-scan`](tools/prod-config-scan.md): env čtené v kódu × `.env.example` × `deploy.yml`/`docker-compose.prod` → drift (`ED`) | node skript |
| **M-FALLBACK** | **Fallback katalog** — grep `?? '…'` / `\|\| '…'` přes oba repo → tabulka dev defaultů + verdikt dosažitelnosti v prod (`FK`) | node skript |
| **M-SECRET** | **Secret sken** — gitleaks/regex přes pracovní strom **i git historii** → hardcoded secrety/placeholdery/entropy (`SS`) | gitleaks / regex |
| **M-BOOT** | **Boot-probe** — nastartuj BE s prázdným/minimálním env → zaznamenej co padne fail-fast vs co tiše fallbackne (`BP`) | node + dotenv |
| **M-PARITY** | **FE↔BE config parita** — ověř že `VITE_API_URL` ↔ `FRONTEND_URL`/CORS ↔ `BACKEND_BASE_URL` tvoří konzistentní kruh, vše `https://` | čtení + skript |
| **M-MUT** | **Mutation testing** — zmutuj env guard (`throw`→`fallback`) → config testy/probe musí zčervenat | Stryker |
| **M2** | Cross-ref — sdílené nálezy s [upload-media](../upload-media-audit.md) (ST) / [ws-contract] (OG) / [role](../role-audit.md) (R-20) / paměť deployment/smtp | čtení |

| Úroveň | Co znamená | Důkaz |
|---|---|---|
| **L1** | staticky přečteno — vypadá nakonfigurovaně | nejslabší |
| **L2** | **tool diff/katalog** — env drift (`ED`), fallback katalog (`FK`), secret sken (`SS`) **vyčísleny** | strojový smoke |
| **L3** | + **kontext dosažitelnosti**: je fallback v prod reálně dosažitelný, nebo gated (`NODE_ENV`/`docker-compose` override)? | mechanika |
| **L4** | + **deploy parita**: kód ↔ `.env.example` ↔ `deploy.yml` ↔ `docker-compose.prod` ověřeno do shody; pre-deploy validace kryje kritické | 4 zdroje sjednoceny |
| **L5** | + **boot-probe**: BE nabootován s prázdným env → fail-fast chování empiricky potvrzeno (padá co má, fallbackne co smí) | běhový důkaz |
| **L6** | + **FE↔BE config parita** (`M-PARITY`): kruh ověřen end-to-end, všechna prod URL `https://`, origin matchuje | cross-stack důkaz |
| **L7-teeth** | + **mutation testing**: config testy/probe prokazatelně **zčervenají** při zmutovaném env guardu | důkaz síly testu |

**Cíl (varianta Maximum):** jádro (`EV`/`SC`/`OG`/`FB`/`ST`/`ML`/`DP`) na **L4** (trojzdrojový diff +
deploy parita); `SS` (secret sken historie) a `BP` (boot-probe) na **L5**; `M-ENV`+`M-FALLBACK` jako
**CI guard** (drift se nikdy nevrátí tiše). `BL`/`HD`/`RL`/`TL`/`KR`/`PA` na L2–L3.

**Cíl (varianta Maximum+):** navíc — **L6 FE↔BE config parita** (`M-PARITY` jako cross-repo guard),
celý audit projde **L7-teeth** (mutace env guardu = má zuby). To je strop: hlubší už není kam jít.

---

## Baseline + pasti prostředí

| Check | Stav | Pozn. |
|---|---|---|
| BE env validation schema (Joi/zod) | ⬜ **NEEXISTUJE** | kořen — `ConfigModule.forRoot` bez `validationSchema`; runtime fail místo startup |
| Centrální config modul / typed config | ⬜ **NEEXISTUJE** | `process.env` čteno přímo na ~35 místech + `??` fallbacky roztroušené |
| `prod-config-scan.mjs` (3-zdroj diff + fallback katalog) | ⬜ postavit (oblast 00) | rozšiřuje vzor `route-audit.mjs` |
| Boot-probe harness (prázdný env → chování) | ⬜ postavit (oblast 00) | reuse BE jest `createTestApp` vzor |
| gitleaks / secret sken | ⬜ ověřit jestli v repu | `SS` (sken historie) |
| `deploy.yml` pre-deploy validace | ✅ částečně (3 proměnné) | rozšířit na trojzdrojový guard |
| `docker-compose.prod.yml` `${VAR:?required}` | ✅ částečně | nekryje kód-level fallbacky |

⚠️ **Pasti (z paměti + recon):**
- 🔴 **`newmatrix.patrikzplzne.cz` v mailer fallbacku je STARÝ .NET server** ([paměť `project_server_swap`](../../../)) — nový produkční cíl je `www.projekt-ikaros.com`. Fallback ([smtp-mailer.provider.ts:42]) tedy nevede „jen jinam", ale na **mrtvý web se starou DB**. `ML`/`PA` to musí chytit jako 🔴.
- 🔴 **captcha bez `TURNSTILE_SECRET` = bypass** ([captcha.service.ts:36-41]) — vrací `true` + warn. V dev pohodlné, v prod vypnutá captcha. `FB`/`SC`.
- **Vite zapéká `VITE_*` při BUILDU, ne za běhu** ([Dockerfile ARG]) — změna prostředí = nový build. `BL` musí ověřit, že build dostal správné `VITE_API_URL` (jinak runtime fallback `localhost:3000` v [client.ts:8]).
- **FE Dockerfile `ARG VITE_API_URL=` má prázdný default** — build bez předaného argu **tiše** zapeče prázdno → celý FE volá `localhost`. Žádná chyba při buildu.
- **JWT je fail-fast (GOOD), neboural to** ([auth.module.ts:25], [auth.service.ts:74]) — `?? throw`. `SC` ověří, že **žádná** cesta to neobchází defaultem; `TE` zmutuje a ověří, že to test chytí.
- **`docker-compose.prod.yml` některé fallbacky kryje** (`MEILI_HOST: http://meilisearch:7700`, `SOCKET_IO_REDIS: "1"`) — `FK`/`L3` musí rozlišit fallback v kódu vs override v compose; nález jen tam, kde compose **nekryje**.
- **base.gateway.ts čte `process.env.FRONTEND_URL` přímo** (ne ConfigService) a **bez** `localhost:5174` allowlistu → dvojí zdroj WS originu vs `socket-io.adapter.ts`. `OG`/`HD`.
- **FE bez prettieru** ([feedback_fe_no_prettier]) + **BE precommit = typecheck+lint, ne testy** ([feedback_be_precommit_prettier]) — tooling formátuj `eslint --fix`; po BE změně **restart** ([feedback_be_restart_required]).
- **Žádné tajné hodnoty v plánu/registru** — audit pracuje s **názvy** proměnných a **fallback řetězci v kódu**, nikdy nezapisuje reálné produkční secrety do docs.

---

## Seed kandidáti (hypotézy — verdikt až při běhu)

> Běh každý povýší na `🐛 PC-xx`, `✅ shoda` nebo `⚖️ by-design`. Detail → [`../prod-config-audit.md`](../prod-config-audit.md).

- **K-PC1** `FB`/`SC` 🔴 — captcha bez `TURNSTILE_SECRET` → [captcha.service.ts:36-41] vrací `true` → registrace bez captchy v prod. Dev bypass dosažitelný v prod. Oblast 02/08.
- **K-PC2** `ML`/`PA` 🔴 — mailer `FRONTEND_URL ?? 'https://newmatrix.patrikzplzne.cz'` ([smtp-mailer.provider.ts:42]) → reset-hesla odkazy na **starý .NET server** (server-swap). Nahradit fail-fast/produkční URL. Oblast 05.
- **K-PC3** `EV` 🟠 — žádné env validation schema ([app.module.ts:61] `ConfigModule.forRoot({isGlobal:true})`) → kritická proměnná selže až runtime, ne při startu. Kořen. Oblast 01.
- **K-PC4** `OG`/`FB` 🟠 — CORS+WS allowlist drží hardcoded `http://localhost:5174` (dev stroj) i v prod ([main.ts:27], [socket-io.adapter.ts:8]). Oblast 03.
- **K-PC5** `ST`/`FB` 🟠 — `BACKEND_BASE_URL ?? 'http://localhost:3000'` ([upload.service.ts:431]) → disk-fallback obrázky dostanou localhost URL v prod. Oblast 04.
- **K-PC6** `ST`/`SC` 🟠 — `MEILI_API_KEY ?? ''` ([meili-search.service.ts:31]) → search bez auth při chybějícím env; compose kryje, fallback ne → tichý degrade jinde. Oblast 04.
- **K-PC7** `HD` 🟡 — `ValidationPipe` bez `forbidNonWhitelisted` ([main.ts:20]) → neznámá pole tiše zahozena (forward-compat, ale maskuje drift). Oblast 08.
- **K-PC8** `HD`/`TL` 🟡 — `/health` vrací stav env (cloudinary/vapid degraded) bez auth ([app.controller.ts:46]) → info leak o konfiguraci. Oblast 08.
- **K-PC9** `BL` 🟡 — FE `vite.config.ts` minimální → sourcemaps default + `console.log` nestriped → zdrojový kód a logy v prod bundlu. Oblast 06.
- **K-PC10** `PA` 🟠 — config kruh bez guardu: `FRONTEND_URL`(BE) ↔ `VITE_API_URL`(FE) ↔ CORS ↔ `BACKEND_BASE_URL` musí souhlasit; nic to nehlídá. Oblast 07/00.
- **K-PC11** `ST` 🟡 — healthcheck čte `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` zvlášť, upload jen z `CLOUDINARY_URL` ([app.controller.ts:27-29]) → healthcheck může klamat vs reálný stav uploadu. Oblast 04.
- **K-PC12** `KR` 🟡 — `JWT_EXPIRES_IN` 7d + `JWT_REFRESH_TTL_DAYS` 30d → dlouhá session okna, žádná rotace. Oblast 02/08.
- **K-PC13** `OG`/`HD` 🟡 — [base.gateway.ts:10-13] cors přes přímý `process.env.FRONTEND_URL` (ne ConfigService) bez `:5174` allowlistu → 12+ gateway dědí; dvojí zdroj WS originu. Oblast 03.
- **K-PC14** `SC` ⚖️ — `JWT_SECRET`/`JWT_REFRESH_SECRET` `?? throw` (fail-fast) = GOOD; ověřit že **žádná** cesta to neobchází defaultem; `TE` zmutuje. Oblast 02.
- **K-PC15** `DP`/`BL` 🟠 — FE [Dockerfile:5] `ARG VITE_API_URL=` prázdný default → build bez argu zapeče prázdno → runtime fallback `localhost:3000` ([client.ts:8]) → celý FE volá localhost. Tichý. Oblast 06/07.
- **K-PC16** `ED`/`DP` 🟠 — env drift 4 zdroje: kód čte ~35, `deploy.yml` předává ~22, `.env.example`/`docker-compose.prod` deklarují jinou množinu → M-ENV vyčíslí čteno-ale-nepředáno / předáno-ale-nečteno. Oblast 01/07.
- **K-PC17** `RL` 🟡 — Throttler: globální limit + upload override (recon) — ověřit, že je **globálně registrován** v prod a není dev-disabled; body limit 5mb. Oblast 08.
- **K-PC18** `TL`/`SC` 🟡 — refresh/JWT transport: JWT v localStorage (FE) → XSS expozice; ověřit cookie flags pokud cookie-based; `secure`+`sameSite`. Oblast 02/08.
- **K-PC19** `SS` 🟡 — secret sken: `.env*` v repu? placeholder JWT secret v `.env.example`? secrety v git historii (cross-ref [paměť `project_git_history_cleanup`])? Oblast 02.
- **K-PC20** `FB`/`OG` 🟡 — `REDIS_URL ?? 'redis://localhost:6379'`, `MEILI_HOST ?? 'http://localhost:7700'`, `SOCKET_IO_REDIS` undefined→in-memory → multi-instance/cache tiše degraduje (compose kryje, ověř L3). Cross-ref [state-consistency] Redis adapter. Oblast 04/08.

---

## Index oblastí (9)

| # | Oblast | Jádro povrchu | Osy |
|---|---|---|---|
| 00 | [Cross-cutting](00-cross-cutting.md) | config loading (BE ConfigModule / FE import.meta.env), env master matice (FE+BE), 4 zdroje pravdy, fallback katalog, tooling | všechny |
| 01 | [Env inventory + validace](01-env-inventory.md) | kompletní env tabulka (kdo čte / default / kritičnost / kde deklarovaná), validační schema (chybí), fail-fast vs runtime | `EV` `ED` |
| 02 | [Secrets](02-secrets.md) | JWT/refresh (fail-fast), captcha, VAPID, MEILI, Cloudinary; default/placeholder v kódu, entropy, git historie | `SC` `SS` |
| 03 | [CORS + WS origin](03-cors-origin.md) | REST `main.ts` · WS `socket-io.adapter` + `base.gateway` · static `/static/`; localhost v allowlistu, ConfigService vs process.env | `OG` `FB` |
| 04 | [Storage config](04-storage.md) | Cloudinary URL parsing · disk `BACKEND_BASE_URL` · limity · healthcheck asymetrie · Redis/Meili lokality | `ST` `FB` |
| 05 | [Mailer config](05-mailer.md) | SMTP host/port/secure/auth · `FRONTEND_URL` odkazy → mrtvý web · `MAIL_FROM` · LogMailer fallback | `ML` `PA` |
| 06 | [FE bundle + build](06-fe-bundle.md) | `VITE_*` leak do bundlu · sourcemaps · console.log · Turnstile test key · Dockerfile ARG prázdný | `BL` `DP` |
| 07 | [Deploy parity](07-deploy-parity.md) | GitHub Actions FE+BE · docker-compose.prod · Dockerfile · pre-deploy validace · vars vs secrets klasifikace · config kruh | `DP` `PA` `ED` |
| 08 | [Hardening](08-hardening.md) | `NODE_ENV` · ValidationPipe `forbidNonWhitelisted` · Swagger v prod · `/health` leak · security headers (nginx) · Throttler · TLS/cookie · JWT TTL | `HD` `RL` `TL` `KR` |
| — | [tools/prod-config-scan](tools/prod-config-scan.md) | M-ENV (3-zdroj diff) · M-FALLBACK (katalog) · M-SECRET · M-BOOT (probe) · M-PARITY | nadstavba |

---

## Legenda statusů

- ⬜ netestováno · ✅ ověřeno OK · 🐛 nález → [`../prod-config-audit.md`](../prod-config-audit.md) (`PC-xx`) · ⚠️ podezřelé · ⏭️ blokované/`[human]`
- `K-PCx` seed kandidát (hypotéza)

## Pracovní postup

1. **Tooling** — postav [`tools/prod-config-scan`](tools/prod-config-scan.md): (a) M-ENV trojzdrojový diff (kód × example × deploy/compose), (b) M-FALLBACK katalog `??`/`||` defaultů, (c) M-SECRET sken stromu+historie (L2). Oblast 00.
2. **Boot-probe** — harness, co nabootuje BE s prázdným/minimálním env a zaznamená fail-fast vs tichý fallback (L5). Oblast 00.
3. **Sweep jádra (L2→L4)** — oblasti 01–05: env inventory → secrets → CORS/WS → storage → mailer; každá osa scanem + deploy paritou.
4. **Hloubka (L3→L5)** — oblast 06: FE bundle leak; oblast 08: hardening; secret sken historie (`SS`) + boot-probe (`BP`).
5. **Maximum+ (L6→L7)** — oblast 07: **FE↔BE config parita** (`M-PARITY`, 👑, L6); mutace env guardu (`TE`, L7-teeth).
6. **CI guard** — `prod-config-scan.mjs` (M-ENV + M-FALLBACK) do CI/precommit, aby drift a nové dev fallbacky nikdy nevrátily tiše.
7. **Nález → `PC-xx`** s **osa / soubor:řádek / fallback hodnota / je dosažitelný v prod? / vratné?**; neopravovat tiše, opravy gated (souhlas). Secrety v docs **jen názvem**, nikdy hodnotou.
