# F12 — Rehost obrázků GDrive → Cloudinary (PODKLADY pro novou diskusi)

> Brief pro novou konverzaci. Kontext: [`HANDOFF.md`](./HANDOFF.md), [`index.md`](./index.md). Paměť: `project_matrix_full_migration`.
> Stav: **NEZAČATO — sběr podkladů hotový, čeká na diskusi → spec → souhlas → impl.**

## Proč to řešíme
Starý Matrix ukládal obrázky postav/stránek jako **Google Drive file ID** v poli `Page.imageUrl`. Ikaros FE ho používá přímo jako `<img src>` (žádná GDrive konverze v kódu — ověřeno, `resolveImage` util neexistuje). → **obrázky jsou teď rozbité** (GDrive ID není platná URL). F12 je **oprava**, ne optimalizace.

## Rozsah (audit migračních dat, `C:\tmp\f4*-*.json`)
| Kde | Počet | Poznámka |
|---|---|---|
| `Page.imageUrl` = GDrive ID | **2389** | všechny **délka 33 znaků** (konzistentní), vzorek `1KTA515jElXiqm6U2nE18SLgX7qKpz_42` |
| `Page.imageUrl` = `true` (boolean!) | 236 | artefakt, NE obrázek — ⚠️ vyřešit (ignorovat? mají obrázek jinde?) |
| `Page.imageUrl` prázdné | 113 | bez obrázku |
| `Page.bigImage` | 0 reálných | jen prázdné/boolean — neřešit |
| inline `<img>` v `content` | 0 | TipTap obsah nemá vložené obrázky |
| `f3-characters` customData obrázky | 0 | postavy nemají obrázek v subdocu |
| `worldsettings.groupImages` (znaky frakcí) | 3 | Evropani/Lumíci/MI6 = GDrive ID (z F-membership, viz handoff) |

**Hlavní práce: 2389 imageUrl + 3 znaky frakcí = ~2392 obrázků k rehostu.**

## Zdroj — Google Drive
- Formát: 33-znakové file ID (`[A-Za-z0-9_-]`).
- Veřejná URL (pokud sdílené): `https://drive.google.com/uc?export=download&id=<ID>` nebo `https://drive.google.com/uc?id=<ID>`.
- ⚠️ **KLÍČOVÁ OTÁZKA: jsou obrázky veřejně sdílené?** Pokud ano → Cloudinary umí upload přímo z URL. Pokud ne → nutný GDrive API + service account (složitější). **Nutno ověřit na vzorku.**

## Cíl — Cloudinary (jak Ikaros hostí, `backend/.../upload/upload.service.ts`)
- `.env CLOUDINARY_URL` = `cloudinary://key:secret@cloud`. SDK `cloudinary.uploader`.
- Upload vrací `secure_url` (`https://res.cloudinary.com/<cloud>/...`) → uloží se do `imageUrl`, + `public_id`.
- 🔴 **POVINNĚ webp** — bez konverze budou obrázky (originály z GDrive: JPG/PNG) **obrovské** = pomalé načítání + drahý traffic. Cloudinary konvertuje při uploadu: `format: 'webp'`. **Nedělat rehost bez webp.** Zvážit i `quality: 'auto'` a horní limit šířky (resize) — viz otázka #3.
- Avatary už vzor mají: `format:'webp'` + `{crop:'fill', gravity:'auto'}` (viz `uploadUserImage`).
- **Cloudinary umí upload z URL přímo:** `cloudinary.uploader.upload('https://drive.google.com/uc?id=<ID>', {folder, format:'webp', quality:'auto'})` → Cloudinary si obrázek stáhne, zkonvertuje na webp a vrátí `secure_url`. Odpadá lokální stahování i konverze.

## Mechanika — ⚠️ JINÁ než dosavadní workflowy
Dosavadní migrace = mongosh přes SSH (jen DB). **F12 potřebuje Node + cloudinary SDK + síť na GDrive/Cloudinary** — mongosh to neumí. Návrh:
- **GitHub Action s Node krokem**: pro každý GDrive ID → `cloudinary.uploader.upload(driveUrl, {folder:'matrix/<...>', format:'webp'})` → posbírat mapu `{oldGDriveId → secure_url}` → mongosh update `Page.imageUrl`.
- Nebo **lokální Node skript** (má cloudinary creds z .env) → vyprodukuje mapu → workflow aplikuje na DB (jako F5 links: gz mapa + mongosh replace).
- **Idempotence**: tag `_migF12` / přeskočit už-Cloudinary URL. **Rollback**: záloha původního imageUrl (`_migImgBefore`).

## Otevřené otázky k diskusi
1. **Veřejnost GDrive** (viz výše) — upload z URL vs GDrive API. **Nejdřív otestovat 1 vzorek.**
2. **Folder strategie** v Cloudinary: `matrix/pages/<slug>`? jeden folder? deterministický `public_id` (idempotence + cleanup)?
3. **webp = DÁNO** (povinné, viz výše). K rozhodnutí už jen: `quality:'auto'`? horní limit šířky (resize na např. 1200px)? Jaké rozměry karty reálně potřebují (avatar vs. velký obrázek)?
4. **236× `imageUrl=true`** — co s tím (vyčistit na prázdné? mají obrázek jinde?).
5. **Mechanika** — GitHub Action Node krok vs lokální skript (kde běží cloudinary upload, kde jsou creds bezpečně).
6. **Rate limity / čas** — 2389 uploadů z URL přes Cloudinary; dávkování, retry, timeout.
7. **Mapy → Atlas** (handoff: „Vzhled/Mapa karty zůstávají; mapy→Atlas") — kde jsou mapové obrázky, souvisí s F12 nebo zvlášť? **Nutno dohledat** (zatím nenalezeny v page datech).
8. **Znaky frakcí (3)** — rehostovat v rámci F12 (`worldsettings.groupImages`).

## Závazná fakta / gotchas (z dosavadní migrace)
- `worldId` v DB = string `"6d6174726978000000000001"` (ne slug, ne ObjectId-typ).
- Server `content`/data = HTML (po opravě #2); obrázky jsou ale v `imageUrl` poli, ne v HTML.
- Workflow: 3 režimy (dry-run/import/rollback), gz data v `migration/`, idempotent + tag, **commit+push já, spouští uživatel**.
- FE deploy: bez `--no-cache`, nginx no-cache index (vyřešeno v F5).
- ⚠️ Mongosh gotcha #3: logiku do IIFE. Mongosh neumí síť → upload musí proběhnout v Node kroku.

## První akce v nové konverzaci
1. **Otestovat veřejnost GDrive**: vzít 1 vzorek ID, zkusit `https://drive.google.com/uc?id=<ID>` + Cloudinary upload z URL. Podle výsledku zvolit cestu (URL vs GDrive API).
2. Rozhodnout folder/public_id strategii + transformace.
3. Spec → souhlas → impl plán → workflow + Node upload.
