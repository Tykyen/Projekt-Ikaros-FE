# Zadání pro generování materiálů 3D kostek (bez čísel)

**Pro:** generátor obrázků (AI) · **Použije:** dice-box-threejs povrch kostky
**Kam hotové soubory:** `public/dice-box/textures/skins/`

> Engine si **čísla kreslí sám** (v barvě skinu). Materiál = jen **povrch těla kostky**, žádná čísla/symboly/okraje.

---

## 1. Technické parametry (TVRDÁ pravidla)

| Parametr | Hodnota |
|---|---|
| Obsah | **POUZE povrch materiálu** — žádná čísla, symboly, tečky, rámečky, tvar kostky |
| Bezešvost | **Bezešvá / tileable** (dlaždice se opakuje, nesmí být vidět šev) |
| Tvar / poměr | **Čtverec 1:1** |
| Rozlišení | **1024 × 1024 px** |
| Formát | **WebP** (nebo PNG), neprůhledné |
| Osvětlení | **Ploché, rovnoměrné** — žádné zapečené velké stíny, vinětace ani jeden velký odlesk (3D engine si světlo dělá sám) |
| Jas / kontrast | **Střední tón, vyrovnaný jas** — ne moc tmavé (skryje číslo), ne přepálené. Detail materiálu ano (zrno, žíly, šupiny, praskliny), ale celkově rovnoměrná světlost |
| Barva | **Plná, jak má materiál reálně vypadat** (krystal je modrý, dračí šupina zelená…) |

### Volitelně — bump (reliéf)
Pokud umíš, přidej **šedotónovou výškovou mapu** stejného povrchu (bílá = vyvýšené, černá = zahloubené), stejné rozlišení. Dělá to materiál fyzický (dřevo, šupiny, praskliny). Název = stejný + `-bump`.

---

## 2. Paste-ready brief pro generátor

```
Seamless tileable square material texture, 1024x1024, top-down flat even studio lighting,
no numbers, no symbols, no dice shape, no border — ONLY the raw surface of the material.
Medium overall brightness, balanced contrast, fine surface detail. PBR-style albedo /
material swatch. Subject: <POPIS MATERIÁLU>.
```
Do `<POPIS MATERIÁLU>` dosaď konkrétní materiál pro daný skin (viz seznam).

---

## 3. Seznam souborů (22 skinů) — přesné názvy

Ulož jako `<id>.webp` (+ volitelně `<id>-bump.webp`):

| Soubor | Skin (nápověda materiálu) |
|---|---|
| `core-ivory.webp` | leštěná slonovina / kost |
| `core-obsidian.webp` | černý lesklý obsidián |
| `core-wood.webp` | tmavé leštěné dřevo s žilami |
| `core-crystal.webp` | průsvitný modrý krystal / led |
| `core-steampunk.webp` | patinovaný mosaz + ozubení |
| `core-white-gold.webp` | bílý mramor se zlatými žilami |
| `core-black-red.webp` | černý kámen s rudými žilami |
| `core-green-jade.webp` | leštěný zelený nefrit |
| `core-blue-porcelain.webp` | modrobílý porcelán |
| `core-bone.webp` | stará kost / slonovina |
| `elem-fire.webp` | žhnoucí magma / uhlíky |
| `elem-water.webp` | čeřená voda / akvamarín |
| `elem-earth.webp` | hrubý kámen / hlína |
| `drac-crimson.webp` | rudá dračí šupina |
| `drac-emerald.webp` | smaragdová dračí šupina |
| `drac-obsidian.webp` | černá dračí šupina |
| `und-bone.webp` | vybělená kost |
| `und-lich.webp` | nazelenalá nekrotická kost |
| `und-ghost.webp` | průsvitná éterická mlha (světlá) |
| `nat-mosswood.webp` | dřevo porostlé mechem |
| `nat-jade.webp` | surový zelený kámen |
| `nat-porcelain.webp` | krémový porcelán s prasklinkami |

---

## 4. Pozn. (implementace, ne pro generátor)

- Materiál se v enginu skládá s číslem (composite). Proto **střední tón** — tmavý materiál schová světlé číslo a naopak.
- Registrace: descriptor `{ name, composite, source, source_bump }` injektnu přes `DiceColors.getTexture` patch; `source` = `textures/skins/<id>.webp` relativně k `assetPath`.
- Číslo (foreground) řeší `theme_customColorset` z `dice3dThemes.ts` — barvu sladím se skinem zvlášť.
