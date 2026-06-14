# 04 — Storage config (Cloudinary, disk, Redis, Meili)

> **Osy:** `ST` (storage config), `FB` (dev fallback), částečně `SC` (Meili klíč).
> **Cílová otázka:** míří storage/search/cache na **produkční služby** se správnými klíči a `secure`
> přenosem — nebo fallbackuje na localhost, prázdný klíč nebo localhost URL v generovaných odkazech?
>
> ⚠️ **Lifecycle** Cloudinary/disk (orphan, cleanup, limity) řeší [upload-media audit](../upload-media-audit.md).
> Tato oblast řeší **jen konfiguraci** — klíče, `secure`, base URL, lokality.

---

## Povrch

| Komponenta | Konfigurace | Kde | Fallback |
|---|---|---|---|
| Cloudinary | `CLOUDINARY_URL` (`cloudinary://key:secret@cloud`) → `cloudinary.config({secure:true})` | upload.service.ts:116-140 | log error, upload→disk |
| Cloudinary healthcheck | `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` **zvlášť** | app.controller.ts:27-29 | `''` |
| Disk fallback | `${BACKEND_BASE_URL}/static/<folder>/...` | upload.service.ts:394-431 | `'http://localhost:3000'` |
| Redis | `REDIS_URL` + `SOCKET_IO_REDIS` | redis.module.ts:20, socket-io.adapter.ts:33 | `'redis://localhost:6379'` / in-memory |
| Meilisearch | `MEILI_HOST` + `MEILI_API_KEY` | meili-search.service.ts:30-31 | `'http://localhost:7700'` / `''` |

---

## Kontrolní kroky (sweep)

1. **Cloudinary `secure:true`** — ověř, že config vynucuje HTTPS delivery ([upload.service.ts:130]). ✅ z reconu.
2. **Healthcheck asymetrie** (K-PC11) — upload čte jen `CLOUDINARY_URL`, healthcheck čte `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` samostatně. Když je nastaven jen `CLOUDINARY_URL`, healthcheck hlásí degraded i když upload funguje (nebo naopak) → klamavý signál.
3. **`BACKEND_BASE_URL` fallback** (K-PC5) — disk-fallback URL = `http://localhost:3000/static/...`. V prod (bez env) by obrázky z disk-fallbacku měly localhost URL → rozbité. Ověř compose/deploy override.
4. **Meili klíč** (K-PC6) — `MEILI_API_KEY ?? ''` → search bez auth. Compose nastaví `${MEILI_MASTER_KEY}` ✅, ale fallback `''` je nebezpečný, pokud compose selže/se obejde. Cross-ref [paměť `project_search_per_world`] (Meili povinný).
5. **Redis/Meili lokality** (K-PC20) — `localhost` fallbacky kryté compose service names (`redis:6379`, `meilisearch:7700`). `L3`: ověř, že žádný jiný spouštěcí mód (mimo compose) nepoužije localhost v prod.
6. **`SOCKET_IO_REDIS`** — undefined → in-memory adapter (single-instance). Prod compose `"1"`. Multi-instance bez Redisu = ztráta WS sync. Cross-ref [state-consistency].

---

## Seed mapping

- **K-PC5** 🟠 `ST`/`FB` — BACKEND_BASE_URL localhost → disk fallback URL.
- **K-PC6** 🟠 `ST`/`SC` — MEILI_API_KEY prázdný default.
- **K-PC11** 🟡 `ST` — healthcheck asymetrie Cloudinary.
- **K-PC20** 🟡 `FB`/`OG` — Redis/Meili/Socket multi-instance degrade.

## Pasti

- ⚠️ Cloudinary klíče se parsují z **URL** (`username`=key, `password`=secret). Healthcheck je čte jako samostatné env → dva zdroje pravdy o stejném secretu.
- ⚠️ Disk fallback je **stejný blob bez CDN** — `secure`/HTTPS závisí na `BACKEND_BASE_URL` schématu (http vs https) → cross-ref `TL` oblast 08.

## Pozitiva k ověření

- ✅ Cloudinary `secure: true` (HTTPS delivery).
- ✅ Compose používá service names (ne localhost) pro Redis/Meili/Mongo.
- ✅ Disk fallback existuje (app funguje při Cloudinary outage) — config gap je jen v base URL.
