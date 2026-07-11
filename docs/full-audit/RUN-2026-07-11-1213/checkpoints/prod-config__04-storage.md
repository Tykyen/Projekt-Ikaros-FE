# prod-config / 04-storage — checkpoint RUN-2026-07-11-1213

Datum: 2026-07-11. Auditor: hloubkový agent (oblast 04, READ-ONLY). Osy: `ST` `FB` (+`SC` Meili klíč).
Kód = HEAD v `c:/Matrix/ProjektIkaros/Projekt-ikaros/backend`; docs/registr = `Projekt-ikaros-FE`.

## Pokrytí

Přečteno (HEAD):
- `backend/src/modules/upload/upload.service.ts` — Cloudinary config (parse z `CLOUDINARY_URL`, `secure:true`) + disk fallback (`BACKEND_BASE_URL`)
- `backend/src/modules/search/meili-search.service.ts` — `MEILI_HOST` + `MEILI_API_KEY` fallbacky
- `backend/src/modules/search/embedding-search.service.ts` — model URL (patrikzplzne.cz), `EMBEDDING_MODEL_CACHE_DIR`
- `backend/src/modules/search/model-path-resolver.ts` — download/cache mechanika modelů (🆕)
- `backend/src/common/redis/redis.module.ts` — `REDIS_URL` fallback
- `backend/src/socket-io.adapter.ts` — `SOCKET_IO_REDIS` + Redis adapter
- `backend/src/common/throttler/throttler.config.ts` — `THROTTLER_REDIS`
- `backend/src/modules/images/images.controller.ts` — `CLOUDINARY_CLOUD_NAME` druhý zdroj (PC-RUN-01)
- `backend/src/app.controller.ts` — healthcheck (po PC-11)
- `backend/src/common/config/env.validation.ts` — startup validace
- `backend/src/modules/admin/admin-costs.service.ts` — **NOVÝ** 3. konzument `CLOUDINARY_URL`
- `backend/src/common/health/health-monitor.service.ts` — **NOVÝ** MEILI_HOST (cron monitoring)
- `docker-compose.prod.yml`, `.github/workflows/deploy.yml`, `backend/.env.example`

## Dosažená L vs cílová L

| Osa | Cíl (Maximum) | Dosaženo | Poznámka |
|---|---|---|---|
| `ST` storage config | L4 | **L3+** | statika + dosažitelnost; deploy parita čtena (deploy.yml) — potvrdila drift model URL + CLOUDINARY_CLOUD_NAME |
| `FB` fallbacks | L4 | **L3** | compose kryje Redis/Meili/Socket; `BACKEND_BASE_URL`/model URL fallbacky prod-dosažitelné |
| `SC` MEILI_API_KEY | L4 | **L3** | kryto compose `MEILI_MASTER_KEY`; env.validation jen varuje |

Celková L oblasti 04: **L3** (L4 deploy-parita částečně z deploy.yml; L5 boot-probe = PROOF-REQUEST).

## Verdikt: žádná REGRESE (🔓) proti registru. Fixy z 2026-06-14 drží; PC-RUN-01..04 z minulého běhu přetrvávají (♻️); 2 drobné 🆕.

---

## Registrové fixy — stav na HEAD

| ID | Co | Stav HEAD 2026-07-11 |
|---|---|---|
| PC-06 | MEILI_API_KEY `''` | ✅ drží — [meili-search.service.ts:32] default `''`, compose kryje [docker-compose.prod.yml:91] `MEILI_MASTER_KEY:?required` |
| PC-11 | healthcheck Cloudinary lhal | ✅ drží — [app.controller.ts:67] čte `CLOUDINARY_URL` (parita s uploadem) |
| PC-20 | Redis/Meili/Socket localhost | ✅ drží — compose service names `redis:6379`/`meilisearch:7700` + `SOCKET_IO_REDIS:"1"` [88-90] |
| PC-05 | BACKEND_BASE_URL → localhost | ♻️ přetrvává (accepted) — viz níže |
| PC-21 | embedding → starý web | ♻️ přetrvává (D-NEW-PC21, OPS nehotovo) — viz níže |

---

## Nálezy (HEAD 2026-07-11)

### PC-RUN-04 / PC-21 `ST/FB` — embedding modely stále z `patrikzplzne.cz`; deploy.yml override vars ani nešablonuje  ♻️ 🟠  **(nejzávažnější)**
- Kód: `backend/src/modules/search/embedding-search.service.ts:375-401`
  ```
  onnxUrl: this.config.get(..., 'https://www.patrikzplzne.cz/data/matrix_embedding_models/onnx_granite_107/model.onnx'),
  tokenizerUrl: this.config.get(..., 'https://www.patrikzplzne.cz/.../sentencepiece.bpe.model'),
  ```
- Compose: `docker-compose.prod.yml:131-134` `${EMBEDDING_GRANITE*_ONNX_URL:-https://www.patrikzplzne.cz/...}` (fallback = stará osobní doména).
- **Zhoršující kontext (nový detail L4):** `deploy.yml:52-82` generuje `.env` z pevné šablony, která `EMBEDDING_GRANITE*_ONNX_URL` / `_TOKENIZER_URL` **VŮBEC neobsahuje** (jsou tam jen `_ENABLED` flagy, ř.76-77). → I kdyby admin nastavil GitHub var, do prod `.env` se nedostane. Compose `:-` fallback je tedy v prod **garantovaná jediná cesta** → sémantické hledání v produkci **vždy** stahuje modely z `patrikzplzne.cz`, dokud se ručně neupraví deploy.yml. `EMBEDDING_GRANITE107/278_ENABLED` default `true` → obě sady URL aktivní.
- Dopad: core search závislý na cizí osobní doméně; když padne → embedding modely se nenačtou (log + degrade), semantic search nedostupný.
- Stav: odpovídá registru PC-21 „kód hotový, zbývá OPS" → [dluhy.md D-NEW-PC21]. Ale deploy-parita ukazuje, že „přepsatelné přes env" v praxi neplatí, dokud deploy.yml šablona nedostane ty vars.
- L4 (deploy parita) · ♻️ · 🟠

### PC-RUN-01 `ST` — `CLOUDINARY_CLOUD_NAME` = druhý, nevalidovaný zdroj cloud name (image proxy)  ♻️ 🟡
- Kde: `backend/src/modules/images/images.controller.ts:12-13` `this.configService.get('CLOUDINARY_CLOUD_NAME') ?? ''`.
- Co: `/api/images/*` (302 redirect proxy, zpětná kompat matrix migrace) staví URL z **oddělené** proměnné, kdežto `UploadService`/`AdminCostsService`/healthcheck čtou cloud name z `CLOUDINARY_URL` (hostname). Dva zdroje pravdy o téže věci.
- Prod dosažitelnost: compose `docker-compose.prod.yml:113` `CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}` **bez `:?`**; deploy.yml:64 `vars.CLOUDINARY_CLOUD_NAME`; env.validation **neuvádí** `CLOUDINARY_CLOUD_NAME` → chybí i varování. Když admin nastaví `CLOUDINARY_URL` ale zapomene var → `[images.controller.ts:26]` redirect na `https://res.cloudinary.com//image/upload/<path>` (prázdný segment = rozbité URL, 302 bez chyby).
- Reinforcement (HEAD): přibyl 3. konzument `CLOUDINARY_URL` ([admin-costs.service.ts:65]) → všichni kromě `images.controller` čtou z `CLOUDINARY_URL`; ta jediná odlišná proměnná je stále images proxy.
- Návrh: čerpat cloud name z `UploadService.getCloudinaryBaseUrl()`/sdíleného parsed configu; nebo `${CLOUDINARY_CLOUD_NAME:?required}` v compose + doplnit do env.validation.
- L3 · ♻️ · 🟡

### PC-RUN-03 `ST` — `EMBEDDING_MODEL_CACHE_DIR` relativní + není volume → efemérní, re-download při každém restartu  ♻️ 🟡
- Kde: `embedding-search.service.ts:58-61` default `'data/model_cache'` (relativní → `/app/data/model_cache` v kontejneru).
- Compose `volumes:` (ř.135-136) mountuje jen `uploads-data:/app/uploads` — model cache **není** persistováno. Restart/nová image = cache pryč → re-download z model URL (viz PC-21) při každém startu. Delší cold start + síťová závislost.
- Návrh: `model-cache:/app/data/model_cache` volume, nebo absolutní cesta přes env.
- L3 · ♻️ · 🟡

### PC-RUN-02 `ST/FB` — `THROTTLER_REDIS` není v compose (multi-instance tiše degraduje)  ♻️ 🟡
- Kde: `throttler.config.ts:31,33`; chybí v `docker-compose.prod.yml`. Nově zdokumentováno v `.env.example:47-49`.
- Default in-memory je pro single-instance **správné**. Při scale-outu 2+ replik bez nastavení = každá instance vlastní rate-limit bucket → limity N× volnější bez varování.
- L3 · ♻️ · 🟡 (by-design single-instance; nízká priorita)

### 🆕 PC-RUN-11 `ST` — `model-path-resolver.downloadFile` bez kontroly HTTP status / redirectů / integrity  🆕 🟡
- Kde: `backend/src/modules/search/model-path-resolver.ts:33-66`.
- Co: stáhne model přes `http.get`/`https.get`, ale **nekontroluje `res.statusCode`**, **nenásleduje 3xx redirecty**, nemá size/checksum ověření. Když `patrikzplzne.cz` vrátí 404/500/redirect, tělo chybové stránky se zapíše do cache souboru jako „model" a Promise se resolvne úspěšně → `ModelRuntime.initialize()` později spadne (chyceno + zalogováno, model se tiše vypne).
- Amplifikace: kombinace s PC-RUN-03 (efemérní cache) = riziko při KAŽDÉM startu; s PC-21 = závislost na chování cizí domény. Overlap se styly stabilita/upload-media/SSRF (download z env-configurovatelné URL bez validace).
- L2 · 🆕 · 🟡 (robustnost, ne čistá config; přímo zhoršuje PC-21)

### 🆕 PC-RUN-12 `FB` — `BACKEND_BASE_URL ?? 'localhost'` fallback je v compose/deploy cestě mrtvý (empty-string)  🆕 🟡
- Kde: `upload.service.ts:572-574` `config.get('BACKEND_BASE_URL') ?? 'http://localhost:3000'`.
- Co: `??` chytá jen null/undefined. Compose `docker-compose.prod.yml:96` `BACKEND_BASE_URL: ${BACKEND_BASE_URL}` a deploy.yml:57 nastaví klíč **vždy** (na prázdný řetězec, když GitHub var chybí). Prázdný string není nullish → fallback `localhost` **nikdy nefiruje** touto cestou; disk-fallback URL pak = `''/static/...` → bezhostová rozbitá URL (ne `localhost`, jak popisuje PC-05).
- Dopad: shodný závěr jako PC-05 (rozbité disk URL při chybějícím `BACKEND_BASE_URL`), jen forma jiná; env.validation to VARUJE (BACKEND_BASE_URL v RECOMMENDED_IN_PROD). Upřesnění registrového PC-05.
- L3 · 🆕 · 🟡

---

## Pozitiva ověřená na HEAD (✅)

- Cloudinary `secure: true` (HTTPS delivery) — [upload.service.ts:150] i [admin-costs.service.ts:73].
- `CLOUDINARY_URL` = jednotný zdroj pro 3 konzumenty (upload / admin-costs / healthcheck) — konzistentní (jediná výjimka = images.controller, PC-RUN-01).
- Disk-fallback bloby persistovány přes `uploads-data:/app/uploads` volume (compose:136) → přežijí restart (na rozdíl od model cache PC-RUN-03).
- Redis i Meili **bez `ports:` mapování** → nevystaveny na host, jen interní `ikaros-net`; Meili gated `MEILI_MASTER_KEY`.
- `MONGODB_URI` hardcoded interní `mongodb://mongo:27017/ikaros?replicaSet=rs0` (compose:87) — replicaSet pro transakce, neexponováno.
- `MEILI_HOST` konzistentní default `http://localhost:7700` napříč 3 místy (meili-search / app.controller / health-monitor).

---

## PROOF-REQUEST (nedosažitelné staticky)

1. **PROOF-L4-EMBED** — `gh variable list` v prod repu: jsou GitHub vars `EMBEDDING_GRANITE*_ONNX_URL/_TOKENIZER_URL` vůbec definované? (Pozn.: i kdyby ano, deploy.yml je do `.env` nešablonuje → prod stahuje z patrikzplzne.cz.) Ověřit + rozhodnout OPS krok D-NEW-PC21.
2. **PROOF-L4-CLOUD** — `gh variable list`: `CLOUDINARY_CLOUD_NAME` nastaven a shodný s cloud name v `CLOUDINARY_URL` (secret)? Jinak image proxy `/api/images/*` rozbitá.
3. **PROOF-L5-FB** — boot-probe: BE s `BACKEND_BASE_URL=` (prázdné) + `NODE_ENV=production` → ověřit warning (ne throw) + první disk-fallback upload vrátí bezhostovou `/static/...` URL (PC-RUN-12).
4. **PROOF-L5-ST** — boot-probe: BE s `CLOUDINARY_URL=` prázdné → upload padá na disk; `/api/images/*` redirect na `res.cloudinary.com//image/...`.
