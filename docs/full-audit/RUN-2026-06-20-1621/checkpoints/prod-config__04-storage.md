# prod-config / 04-storage — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Auditor: hloubkový agent (oblast 04, read-only).

## Pokrytí

Přečteno:
- `backend/src/modules/upload/upload.service.ts` (Cloudinary config + disk fallback)
- `backend/src/modules/search/embedding-search.service.ts` (model URL, cache dir, chunk params)
- `backend/src/modules/search/meili-search.service.ts` (Meili host + key)
- `backend/src/common/redis/redis.module.ts` (REDIS_URL fallback)
- `backend/src/modules/images/images.controller.ts` (CLOUDINARY_CLOUD_NAME fallback → '')
- `backend/src/app.controller.ts` (healthcheck — po opravě PC-11)
- `backend/src/common/config/env.validation.ts` (startupová validace — po opravě PC-03/24)
- `backend/src/app.module.ts` (ConfigModule s validate, ThrottlerModule)
- `backend/src/common/throttler/throttler.config.ts` (THROTTLER_REDIS optionality)
- `backend/src/modules/auth/services/totp-crypto.service.ts` (TOTP_ENC_KEY fail-closed)
- `docker-compose.prod.yml` (kompletní env sekce)
- `docs/prod-config-audit.md` (stav oprav)
- `docs/full-audit/RUN-2026-06-20-1621/scanners/config.txt` (M-ENV + M-FALLBACK výstup)

## Dosažená L vs cílová L

| Osa | Cíl (Maximum) | Dosaženo | Poznámka |
|---|---|---|---|
| `ST` storage config | L4 | **L3** | statika ok; deploy parita: scanner potvrdil drift CLOUDINARY_CLOUD_NAME (viz PC-RUN-01); PROOF-REQUEST L4+ |
| `FB` fallbacks | L4 | **L3** | BACKEND_BASE_URL fallback localhost — compose předává `${BACKEND_BASE_URL}` bez `:?`; env.validation jen varuje → prod-dosažitelný |
| `SC` secrets (MEILI_API_KEY) | L4 | **L3** | kryto compose (`MEILI_MASTER_KEY`), env.validation varuje; PROOF-REQUEST live |

Celková dosažená L oblasti 04: **L3** (statická hloubka + kontext dosažitelnosti; L4 deploy parita + L5 boot-probe = PROOF-REQUEST).

## Nálezy

### Opravené (stav opraveno+ověřeno dle registru 2026-06-14)

| ID | Co bylo | Stav HEAD |
|---|---|---|
| PC-05 | BACKEND_BASE_URL → localhost disk URL | **env.validation VARUJE** v prod (ne throw); compose předává `${BACKEND_BASE_URL}` bez `:?`; fallback localhost stále kódově přítomen ✅ po opravu dle záznamu |
| PC-06 | MEILI_API_KEY '' | env.validation VARUJE; compose kryje MEILI_MASTER_KEY ✅ |
| PC-11 | healthcheck Cloudinary lžal | app.controller.ts:61 čte `CLOUDINARY_URL` ✅ opraveno |
| PC-20 | Redis/Meili/Socket localhost | compose service names + SOCKET_IO_REDIS "1" ✅ |

### Nové / aktualizované nálezy (HEAD 2026-06-20)

**PC-RUN-01** `ST` — **CLOUDINARY_CLOUD_NAME drift: druhý zdroj cloud name mimo upload**
- Kde: `backend/src/modules/images/images.controller.ts:13`
- Co: `ImagesController` čte `CLOUDINARY_CLOUD_NAME ?? ''` samostatně (image-proxy redirect endpoint). `UploadService` parsuje cloud name z `CLOUDINARY_URL` a drží ho v `this.cloudName`. Dvě nezávislé proměnné popisují stejnou věc — `CLOUDINARY_URL` vs `CLOUDINARY_CLOUD_NAME`.
- Stav compose: `docker-compose.prod.yml:109` předává `CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}` bez `:?required` — pokud ho admin nenastaví, image proxy redirectuje na `https://res.cloudinary.com//image/upload/<path>` (prázdný cloud name = rozbité URL). Deploy (`deploy.yml:63`) ho předává jako `var.CLOUDINARY_CLOUD_NAME`.
- Dopad: `/api/images/*` redirect endpoint vrátí rozbité URL bez chyby (302 na neplatnou URL) kdykoli admin nastaví jen `CLOUDINARY_URL` ale zapomene na `CLOUDINARY_CLOUD_NAME`.
- Vzor: původní PC-11 byl drift healthcheck vs upload — toto je drift image-proxy vs upload. Stejná rodina.
- Návrh: `ImagesController` by měl čerpat cloud name z `UploadService.getCloudinaryBaseUrl()` (nebo sdílený parsed config) místo druhé env proměnné. Alternativa: `${CLOUDINARY_CLOUD_NAME:?required}` v compose.
- L2 · 🆕 · 🟡 (funkční risk bez bezpečnostního průlomu; dosažitelné v prod při neúplném deployi)

**PC-RUN-02** `ST/FB` — **THROTTLER_REDIS nepředán v compose — multi-instance degraduje tiše**
- Kde: `backend/src/common/throttler/throttler.config.ts:31`, `docker-compose.prod.yml` (chybí)
- Co: `THROTTLER_REDIS` není v `docker-compose.prod.yml` ani v deploy.yml; M-ENV scanner ho hlásí v sekci (a) „čteno v kódu, ale nepředáno". Default = in-memory. Pro single-instance prod (current setup) je in-memory correct a postačující. Nicméně pokud se BE škáluje na 2+ repliky (bez změny compose), každá instance počítá vlastní rate-limit bucket → reálné limity N× volnější bez jakéhokoli varování.
- Dopad: při scale-out DoS ochrana degraduje tiše. V současném single-instance deployi = ⚖️ by-design, ale bez dokumentace v compose (jen v `.env.example`).
- Návrh: přidat `THROTTLER_REDIS: ${THROTTLER_REDIS:-}` do compose s komentářem; nebo zdokumentovat v DEPLOYMENT.md pro případ scale-out.
- L2 · 🆕 · 🟡 (by-design pro single-instance; riziko jen při scale-out; nízká priorita)

**PC-RUN-03** `ST` — **EMBEDDING_MODEL_CACHE_DIR relativní cesta — prod kontejner závislý na CWD**
- Kde: `backend/src/modules/search/embedding-search.service.ts:58-60`
- Co: `cacheDir = config.get('EMBEDDING_MODEL_CACHE_DIR', 'data/model_cache')` — relativní cesta. V Docker kontejneru `CWD=/app` → cache bude v `/app/data/model_cache`. Tato cesta není pod žádným compose `volumes:` záznamu (jen `uploads-data:/app/uploads`).
- Dopad: při restartu kontejneru (nebo nasazení nové image) se model cache smaže → BE stáhne modely znovu z `patrikzplzne.cz` (nebo configured URL). První start po deployi vždy re-downloaduje. Delší startup time, závislost na síti.
- Návrh: přidat `model-cache:/app/data/model_cache` volume do compose, nebo nastavit absolutní cestu přes env. Alternativa: přijmout jako known behavior (modely se vždy stahují za startu).
- L2 · 🆕 · 🟡 (funkční, ne bezpečnostní; prod dopad = delší cold start + síťová závislost)

**PC-RUN-04** `ST/FB` — **EMBEDDING model URL fallback na patrikzplzne.cz stále dosažitelný přes compose**
- Kde: `docker-compose.prod.yml:121-124`
- Co: compose sice explicitně předává `EMBEDDING_GRANITE*_ONNX_URL` a `EMBEDDING_GRANITE*_TOKENIZER_URL`, ale s `:-` fallbackem na `https://www.patrikzplzne.cz/...`. Scanner config.txt to potvrzuje — compose neodstranil závislost na starém webu, jen ji zpřehlednil. `EMBEDDING_GRANITE107_ENABLED` default `true` → obě URL se použijí.
- Stav: PC-21 byl v registru označen jako „kód hotový (env přidáno do compose + .env.example); zbývá jen OPS krok — nahrát soubory na vlastní hosting → D-NEW-PC21". Ale v HEAD compose url fallback = `patrikzplzne.cz`. Pokud admin nenastaví `EMBEDDING_GRANITE107_ONNX_URL` v GitHub vars, prod stáhne modely z osobní domény. Toto je ♻️ - stav odpovídá registru (D-NEW-PC21 dluh; kódový fix hotový, OPS krok ne).
- Dopad: při chybějících GitHub vars = search závisí na cizí osobní doméně; pokud ta doména padne, embedding search nefunguje (graceful degradace se loguje, ale feature nedostupná).
- L2 · ♻️ · 🟠 (existující nález PC-21 v registru, stav dluh D-NEW-PC21 — OPS nehotovo)

**PC-RUN-05** `ST` — **/health odhaluje přítomnost CLOUDINARY bez autentizace (v prod skrytý, OK)**
- Kde: `backend/src/app.controller.ts:85-99`
- Co: PC-08 opraveno — v prod (`NODE_ENV=production`) vrací jen `{ok: bool}` bez `missing[]`. Ověřeno čtením HEAD. ✅ opraveno, není nový nález.

## PROOF-REQUEST

1. **PROOF-L4-ST** — trojzdrojový deploy parita pro `CLOUDINARY_CLOUD_NAME`: ověřit, že GitHub Actions `vars.CLOUDINARY_CLOUD_NAME` je nastaven v prod a odpovídá cloud name v `CLOUDINARY_URL`. Strojové ověření nemožné bez live infra přístupu — vyžaduje `gh variable list` nebo ruční kontrolu GitHub secrets/vars v Projekt-ikaros repo.

2. **PROOF-L5-FB** — boot-probe: spustit BE s `BACKEND_BASE_URL=` (prázdné) + `NODE_ENV=production` → ověřit, že env.validation vydá varování (ne throw) a BE nastartuje s disk fallback `http://localhost:3000`. Ověřit, že první upload přes disk-fallback skutečně vrátí localhost URL → funkční fail.

3. **PROOF-L5-ST** — boot-probe: spustit BE s `CLOUDINARY_URL=` (prázdné) → ověřit, že `UploadService` loguje error + fallback na disk; `ImagesController` pak redirectuje na `https://res.cloudinary.com//image/...` (prázdný cloud name).

4. **PROOF-L4-EMBED** — ověřit GitHub Actions vars pro `EMBEDDING_GRANITE*_ONNX_URL` / `EMBEDDING_GRANITE*_TOKENIZER_URL` — jsou nastaveny? Nebo prod reálně stahuje z `patrikzplzne.cz`? Vyžaduje `gh variable list` v prod repo.
