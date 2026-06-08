# F12 — Rehost obrázků GDrive → Cloudinary (webp)

> Migrace světa **matrix**. Kontext: [`HANDOFF.md`](./HANDOFF.md), [`index.md`](./index.md). Paměť: `project_matrix_full_migration`.
> Stav: **SPEC SCHVÁLENA — čeká na impl plán → kód.**

## Cíl
Opravit rozbité obrázky: starý Matrix uložil do `Page.imageUrl` **Google Drive file ID** (33 znaků), Ikaros FE ho cpe rovnou do `<img src>` → rozbité. F12 nahradí ID veřejnou **Cloudinary webp URL**. Oprava, ne optimalizace.

## Rozsah — ⚠️ z RAW zdroje, ne z transformovaných f4*
Podklady (revize <2026-06-08) počítaly rozsah z **poškozených transformovaných dat** (`f4a/f4b`), kde krok F4 u 236 map/nákresů zahodil GDrive ID a zapsal string `"true"`. **Zdroj pravdy pro F12 = raw export.**

| Zdroj | Počet | Poznámka |
|---|---|---|
| `imageUrl` = GDrive ID (raw) | **3402 stránek** | **3338 unikátních ID** (64 sdílených) |
| z toho dříve „rozbité na `true`" | 236 | raw má platné ID — opraví se jako každé jiné |
| duplicitní slug | 1 (`staty-espada`) | párovat přes gdriveId, ne slug |
| znaky frakcí (`worldsettings.groupImages`) | 3 | Evropani / Lumíci / MI6 |
| **CELKEM k rehostu** | **~3341** | sedí k ~4200 souborů na GDrive (zbytek = avatary/staré verze/nevyužité) |

**Mimo rozsah:** `galleryImages` (vždy prázdné), `bigImage` (jen boolean flag), inline v `content`/`table` (0 — jen odkazy-slugy), avatary uživatelů, přesun map do Atlasu (separátní feature).

## Zdroj pravdy
`C:\tmp\matrix-pages-raw.json` (3540 stránek) → pole `slug` + `imageUrl`. Vyextrahovaný čistý seznam: `C:\tmp\f12-pages.json` = `[{slug, gdriveId}]` (3402).
⚠️ **GDrive ID = stejný tvar jako slug** (33 znaků `[A-Za-z0-9_-]`) → ID brát **jen z hodnoty pole `imageUrl`**, nikdy regexem přes dokument.

## GDrive dostupnost — OVĚŘENO
10/10 vzorků = `HTTP 200` + `image/png` (20 KB–3.3 MB). Obrázky veřejně sdílené → Cloudinary `upload(url)` si je stáhne sám. **Žádný GDrive API / service account.**
- URL: `https://drive.google.com/uc?export=download&id=<ID>`

## Mechanika — 2 fáze (vzor F5: lokální skript → workflow)

### Fáze A — lokální Node skript `migration/f12-upload.mjs`
- Creds z `backend/.env` (`CLOUDINARY_URL` → `new URL()` parse → `cloudinary.config({cloud_name,api_key,api_secret,secure:true})`, vzor [`upload.service.ts`](../../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts)).
- Pro každé `{slug, gdriveId}` z `f12-pages.json`:
  ```
  cloudinary.uploader.upload('https://drive.google.com/uc?export=download&id=<ID>', {
    folder: 'matrix/pages',
    public_id: <gdriveId>,        // deterministický → idempotence + cleanup
    overwrite: true,
    format: 'webp',
    quality: 'auto:good',
    width: 4096, crop: 'limit',   // strop pro rodokmeny/mapy; běžné netknuté
  })
  ```
- Concurrency **6**, retry **3×** s backoff, timeout **60 s**/kus.
- **Resume:** průběžně appenduje výsledky → re-run přeskočí hotové (i přes `overwrite` šetří čas).
- Výstup: `migration/f12-map.json` = `[{slug, gdriveId, secure_url, public_id, width, height}]` (+ `.gz`).
- **3 znaky frakcí** zvlášť → `folder:'matrix/groups'`, public_id = gdriveId.

### Fáze B — mongosh přes SSH (workflow `fix-matrix-images.yml`, 3 režimy)
`dry-run` / `import` / `rollback`. Načte `f12-map.json`. Per Ikaros `page` (worldId `6d6174726978000000000001`):
1. Urči `gdriveId`: validní 33-znak `page.imageUrl` → ten; jinak (`"true"` apod.) → lookup `slug → gdriveId` z mapy.
2. `secure_url = map[gdriveId]`; chybí → log skip.
3. Záloha `_migImgBefore = imageUrl` (jen poprvé, idempotent guard) → `imageUrl = secure_url`, `_migF12 = true`.
- **Idempotence:** skip pokud `imageUrl` už cloudinary URL. **Rollback:** `imageUrl = _migImgBefore`.
- Znaky frakcí: `worldsettings.groupImages.<frakce>` → secure_url z `matrix/groups` mapy.
- Logika do IIFE (mongosh gotcha).

## Transformace — rozhodnuto
`format:'webp'` (povinné — originály PNG až 3.3 MB) + `quality:'auto:good'` (méně artefaktů na textu map/rodokmenů) + `width:4096, crop:'limit'` (ostré rodokmeny/mapy do 4K, běžné portréty `limit` nezvětší). Po nasazení lze konkrétnímu rodokmenu >4096 px dát výjimku.

## Gotchas
- ⚠️ mongosh neumí síť → upload **musí** v Node fázi A.
- ⚠️ GDrive 429 při 3338 requestech ze stejného Cloudinary IP → pokryje retry.
- ⚠️ `staty-espada` 2× v raw → ve fázi B párovat primárně přes gdriveId z `page.imageUrl`.
- FE deploy: nginx no-cache index (vyřešeno F5); commit+push já, **spouští uživatel**.

## Provedení fáze A (hotovo)
- Síť: **`NODE_OPTIONS=--use-system-ca`** povinné (proxy s vlastní CA, jinak `UNABLE_TO_VERIFY_LEAF_SIGNATURE`).
- Plný běh: **3339 obrázků** (3336 stránek + 3 frakce), 0 nevyřešených failů, ~21 min.
- ⚠️ Cloudinary free **limit 10 MB** na upload z URL → 3 velké originály (11–15 MB) padly. **Fallback v skriptu:** GDrive thumbnail API `?sz=w2560` (extrém ak-47 přes `w1600`) → zmenšený náhled pod limit.
- Úspora webp: 76–94 % (např. 2.8 MB → 323 KB).
- Výstup: `migration/f12-map.json.gz` (167 KB).

## Rozšíření za běhu (objeveno při nasazení)
- **Rozsah z DB, ne z raw:** raw `matrix-pages-raw.json` (3402 stránek) ≠ produkční DB. Filtr fáze B cílí podle **tvaru `imageUrl`** (GDrive ID / "true"), ne `_mig` markeru (ten chytal jen základní pages). DB má 2441 matrix stránek s GDrive obrázkem.
- **NOMAP 2. kolo:** 60 stránek mělo v DB GDrive ID mimo raw (NPC/PC/lokace) → vytaženo z DB (`NOMAP=` diag výpis) a doupploadováno (`--input`). Mapa 3339 → 3398.
- **AKJ záložky:** `Page.akjTabs[].contentOverride.imageUrl` (811 tabů, 646 unik ID) — fáze B původně nesahala. Filtr rozšířen na `$or: [imageUrl, akjTabs.0]` (AKJ-only stub má `imageUrl` prázdné). Doupload 11 → mapa 3409.
- **AKJ "true" záchrana:** 42 AKJ tabů mělo `imageUrl="true"` (bez ID). 10 zachráněno přes `slugify(název)` → stejnojmenná stránka (Zubní víly → zubni-vily).

## Výsledek (nasazeno, fix HOTOVO)
- **Stránky:** 2441 opraveno (jen `mapa-sveta` zbývá — `"true"` bez ID).
- **AKJ:** 811 tabů + 10 "true" zachráněno; 32 zbývá (`"true"` lokační „Utajený archiv", bez ID).
- **Frakce:** 3.
- **K ručnímu úklidu (33):** seznam `migration/f12-zbyva-rucne.txt` (vč. `rodokmen-madregal`). `imageUrl="true"` bez GDrive ID nikde — buď dohledat ve starém Matrixu, nebo vyčistit na prázdné.

## Roadmapa
- [x] A: `migration/f12-upload.mjs` + běh → `f12-map.json.gz` (3409 obrázků)
- [x] B: `migration/f12-images.js` + workflow `fix-matrix-images.yml` (stránky + AKJ + frakce)
- [x] Znaky frakcí (3), NOMAP 2. kolo, AKJ záložky, AKJ-true záchrana
- [x] **Nasazeno přes workflow `fix` — 2441 stránek + 821 AKJ tabů + 3 frakce**
- [ ] (volitelně, uživatel ručně) 33 zbylých `"true"` — dohledat/vyčistit dle `f12-zbyva-rucne.txt`
