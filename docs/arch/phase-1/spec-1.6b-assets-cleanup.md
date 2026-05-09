# Spec 1.6b — Cleanup úložiště obrázků

**Status:** Draft — čeká na schválení
**Rozsah:** přesun a deduplikace zdrojových obrázků (PNG) + sjednocení produkčních (WebP)
**Repo:** `Projekt-ikaros-FE`
**Velikost:** ~50 souborů přesun, ~10 KB markdown úprav, žádný kód
**Autor:** PJ + Claude
**Datum:** 2026-05-09
**Souvisí:** [1.6a — feature moduly](spec-1.6a-feature-modules.md), [1.6c — docs/arch cleanup](spec-1.6c-arch-docs-cleanup.md)

---

## 1. Cíl

Sjednotit úložiště obrázků do **dvou úrovní** s jasným pravidlem:

- `assets-source/` = **zdrojové obrázky** (PNG, vysoké rozlišení, neoptimalizované) — vstup pro konverzní skripty.
- `public/` = **produkční obrázky** (WebP, optimalizované) — to, co prohlížeč fakticky stahuje.

Smazat duplicity, přesunout misplaced soubory, zaktualizovat odkazy v markdown a skriptech.

---

## 2. Audit současného stavu

### 2.1 Themes — backgrounds (rozházené)

| Lokace | Soubory | Účel |
|---|---|---|
| `docs/themes/assets/*.png` (root, **české názvy**) | 21 ks (`Afrika.png`, `Modré nebe.png`, `Čtyři živly.png` …) | Legacy referenční obrázky z fáze 1.0 (link z `docs/themes/README.md` tabulky) |
| `docs/themes/assets/backgrounds/*.png` (slug názvy) | 21 ks (`africke.png`, `modre-nebe.png` …) | Zdrojáky pro WebP konverzi (workflow z `PROMPTS-BACKGROUNDS.md` říká `docs/themes/assets/backgrounds/<id>.png`) |
| `public/themes/backgrounds/*.webp` | 21 ks | Produkční WebP — to, co se skutečně používá v UI |

**Problém:** Zdrojáky se nachází v `docs/` (= dokumentace), ne v `assets-source/` (= zdrojáky). PROMPTS workflow byl napsán ad-hoc, struktura nepasuje na zbytek repa.

**Duplicita:** `docs/themes/assets/Modré nebe.png` (legacy) vs `docs/themes/assets/backgrounds/modre-nebe.png` (zdroják). Pravděpodobně stejný obsah, jen jiný název.

### 2.2 Themes — thumbnails

| Lokace | Soubory | Účel |
|---|---|---|
| `docs/themes/assets/thumbnails/` | **prázdné** | Plánovaná lokace pro thumbnail zdrojáky (nikdy se nezaplnila) |
| `public/themes/thumbnails/*.webp` | 21 ks | Produkční thumbnails |

**Otázka:** Odkud se WebP thumbnails generují? Asi přímo z `backgrounds/` přes resize. Skript pravděpodobně neexistuje (1.6b ho zavede, viz sekce 4.4).

### 2.3 Themes — decorations

| Lokace | Soubory | Účel |
|---|---|---|
| `public/themes/modre-nebe/decor/` | dekorační obrázky tématu modre-nebe | Per-theme decorations (zatím jen 1 téma) |

**Stav:** Konzistentní, jen jedno téma má decorations. Nechat.

### 2.4 Default avatary

| Lokace | Soubory | Účel |
|---|---|---|
| `assets-source/default-avatars/` | 3 PNG (`being.png`, `female.png`, `male.png`) | Zdrojáky |
| `public/defaults/avatars/` | 6 WebP (`{being,female,male}.webp` + `{being,female,male}-sm.webp`) | Produkční (full + small variants) |
| `scripts/optimize-default-avatars.mjs` | — | Konverzní skript (PNG → WebP, vytváří -sm) |

**Stav:** Konzistentní, dobrý pattern. **Tento pattern aplikovat na themes.**

### 2.5 Favicon a `src/assets/`

| Lokace | Soubory | Účel |
|---|---|---|
| `public/favicon.webp` | 1 | Aktuální favicon |
| `public/favicon.svg` | (smazaný v rozdělaných změnách) | Legacy SVG favicon |
| `public/icons.svg` | 1 | Sprite ikon |
| `src/assets/vite.svg` | 1 | Default Vite logo (nepoužívá se) |

**Problém 1:** `src/assets/vite.svg` je dead asset (bootstrap z Vite template). Smazat.

**Problém 2:** `public/favicon.svg` byl smazán v rozdělaných změnách (`D public/favicon.svg` v git status), `public/favicon.webp` přidán. Pravděpodobně součást 1.0b vizuálních úprav. Nečinit, jen ověřit.

### 2.6 Docs themes — markdown linky

[docs/themes/README.md](docs/themes/README.md) tabulka tématů linkuje na `assets/<id>.png` — tedy na **legacy** referenční (české názvy nebo slug?). Po refactoru je třeba aktualizovat odkazy.

[docs/themes/PROMPTS-BACKGROUNDS.md](docs/themes/PROMPTS-BACKGROUNDS.md) řádek 12 instruuje ukládat do `docs/themes/assets/backgrounds/<id>.png`. Po refactoru aktualizovat na `assets-source/themes/backgrounds/`.

---

## 3. Návrh cílové struktury

```
assets-source/                       ← VŠECHNY zdrojáky (PNG, vysoké rozlišení)
├── default-avatars/                 ← BEZ ZMĚNY
│   ├── being.png
│   ├── female.png
│   └── male.png
└── themes/
    ├── backgrounds/                 ← přesun z docs/themes/assets/backgrounds/
    │   ├── africke.png
    │   ├── arabsky-svet.png
    │   ├── modre-nebe.png
    │   └── … (21 ks)
    └── references/                  ← legacy referenční obrázky z docs/themes/assets/*.png
        ├── modre-nebe.png           ← přejmenováno z "Modré nebe.png"
        ├── zlaty-standard.png       ← přejmenováno z "Zlatý standart.png"
        └── … (21 ks; deduplikovat se backgrounds/ pokud jsou identické)

public/                              ← produkční (WebP)
├── defaults/
│   └── avatars/                     ← BEZ ZMĚNY
│       ├── being.webp
│       ├── being-sm.webp
│       └── … (6 souborů)
├── themes/                          ← BEZ ZMĚNY
│   ├── backgrounds/*.webp           (21 ks)
│   ├── thumbnails/*.webp            (21 ks)
│   └── modre-nebe/decor/            (decorations per-theme)
├── favicon.webp                     ← BEZ ZMĚNY
└── icons.svg                        ← BEZ ZMĚNY

src/assets/                          ← SMAZAT (dead Vite default)
```

### 3.1 Princip: source vs production

- Cokoliv pod `assets-source/` = **vstup pro skript**. Dev nikdy nelinkuje přímo na něj.
- Cokoliv pod `public/` = **statický asset servírovaný Vite/HTTP**. Linky z `<img>`, CSS `url()`, manifest atd.
- `assets-source/` **NEPATŘÍ** do `public/` (Vite by ho zbytečně servíroval) — je to oddělená top-level složka.

### 3.2 `docs/` jako čistá dokumentace

- `docs/themes/*.md` zůstává — popis témat, palety, atmosféra.
- `docs/themes/assets/` **smazat**. Markdown linky se updatují na `../../assets-source/themes/references/<id>.png` (relativní z docs).

---

## 4. Návrh řešení

### 4.1 Přesun zdrojáků

```bash
# Backgrounds: docs/themes/assets/backgrounds/ → assets-source/themes/backgrounds/
mkdir -p assets-source/themes
mv docs/themes/assets/backgrounds assets-source/themes/

# References: docs/themes/assets/*.png → assets-source/themes/references/
# Pozor: české názvy s diakritikou, přejmenovat na slug
mkdir -p assets-source/themes/references
# (per-soubor mapping, viz sekce 4.2)

# Smazat prázdnou: docs/themes/assets/thumbnails/
rmdir docs/themes/assets/thumbnails

# Smazat dead asset: src/assets/vite.svg
rm src/assets/vite.svg
rmdir src/assets  # pokud prázdné
```

### 4.2 Mapping české názvy → slug pro `references/`

| Starý (docs/themes/assets/) | Nový (assets-source/themes/references/) |
|---|---|
| `Afrika.png` | `africke.png` |
| `Apokalypsa.png` | `postapo.png` |
| `Arábie.png` | `arabsky-svet.png` |
| `Bílá.png` | `bila.png` |
| `Hospoda.png` | `hospoda.png` |
| `Indiáni.png` | `indiane.png` |
| `Kyberpunk.png` | `kyberpunk.png` |
| `Magie.png` | `magie.png` |
| `Modré nebe.png` | `modre-nebe.png` |
| `Měsíc.png` | `mesic.png` |
| `Nemrtví.png` | `nemrtvi.png` |
| `Pergamen.png` | `pergamen.png` |
| `Příroda.png` | `priroda.png` |
| `Sci-fi.png` | `sci-fi.png` |
| `Severské runy.png` | `severske-runy.png` |
| `Slunce.png` | `slunce.png` |
| `Temná červeň.png` | `temna-cerven.png` |
| `Vesmírná bitva.png` | `vesmirna-bitva.png` |
| `Vesmírná loď.png` | `vesmirna-lod.png` |
| `Zlatý standart.png` | `zlaty-standard.png` |
| `Čtyři živly.png` | `ctyri-zivly.png` |

**Otázka deduplikace:** Pokud `references/<id>.png` je **byte-identický** s `backgrounds/<id>.png` (stejný obrázek, jen jiný název), smazat `references/<id>.png` a v markdown linku odkázat přímo na `backgrounds/<id>.png`. Pokud se liší (např. references jsou pre-cropped náhledy), nechat oba.

**Akční bod implementace:** během provádění specu udělat `Compare-Object (Get-FileHash …) (Get-FileHash …)` per soubor a deduplikovat. Pokud jsou všechny stejné → smazat `references/` úplně.

### 4.3 Skripty na konverzi

Vytvořit `scripts/optimize-theme-backgrounds.mjs` analogicky k `scripts/optimize-default-avatars.mjs`:

```js
// Pseudokód
import sharp from 'sharp';
import { readdir } from 'node:fs/promises';

const SRC = 'assets-source/themes/backgrounds';
const OUT = 'public/themes/backgrounds';
const THUMB_OUT = 'public/themes/thumbnails';

for (const file of await readdir(SRC)) {
  if (!file.endsWith('.png')) continue;
  const slug = file.replace('.png', '');
  await sharp(`${SRC}/${file}`)
    .resize(1920, 1080, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(`${OUT}/${slug}.webp`);
  await sharp(`${SRC}/${file}`)
    .resize(480, 270, { fit: 'cover' })
    .webp({ quality: 70 })
    .toFile(`${THUMB_OUT}/${slug}.webp`);
}
```

Přidat `package.json` script: `"build:theme-assets": "node scripts/optimize-theme-backgrounds.mjs"`.

**Out of scope této specu:** spuštění skriptu na všech 21 zdrojácích a ověření kvality WebP. To je separátní úkol (pravděpodobně 1.6b následný impl. plán nebo manuální dev úkol). **V této spec jen vytvořit skript.**

### 4.4 Update markdown odkazů

**`docs/themes/README.md`** — sekce 2.6:

```diff
- | 1 | `modre-nebe` | Modré nebe | ✅ Popsáno | [modre-nebe.png](assets/modre-nebe.png) |
+ | 1 | `modre-nebe` | Modré nebe | ✅ Popsáno | [modre-nebe.png](../../assets-source/themes/references/modre-nebe.png) |
```

(21 řádků v tabulce + workflow odstavec na začátku.)

**`docs/themes/PROMPTS-BACKGROUNDS.md`** — řádek 12:

```diff
- 4. Ulož do: `c:\Matrix\ProjektIkaros\Projekt-ikaros-FE\docs\themes\assets\backgrounds\<id>.png`
+ 4. Ulož do: `c:\Matrix\ProjektIkaros\Projekt-ikaros-FE\assets-source\themes\backgrounds\<id>.png`
```

### 4.5 Update kódu

`grep -rn "docs/themes/assets" src/` — pokud nějaký FE kód linkuje (neměl by, vše jde přes `public/themes/`), přepsat. Předpoklad: žádné výsledky.

`grep -rn "src/assets" src/` — odstranit případné importy `vite.svg`. Předpoklad: žádné (jen Vite default v `index.html`, ale vidím že už používáme vlastní favicon).

---

## 5. Out of scope

- **Spuštění konverzního skriptu** na všech 21 backgrounds (ověření vizuální kvality WebP). Pouze skript zavedeme.
- **Optimalizace velikostí** existujících WebP v `public/themes/` (re-quantize, redukce). Samostatný optimalizační pass.
- **Decorations per-theme** (`public/themes/modre-nebe/decor/`) — pattern zůstává.
- **Themes 1.0b vizuální změny** — pokračují samostatně (`spec-1.0b-theme-visuals.md`).

---

## 6. Acceptance kritéria

1. ✅ `assets-source/themes/backgrounds/` obsahuje 21 PNG (slug názvy).
2. ✅ `assets-source/themes/references/` obsahuje 0 nebo 21 PNG (podle deduplikace), všechny slug názvy.
3. ✅ `docs/themes/assets/` smazaná.
4. ✅ `src/assets/` smazaná (nebo prázdná = neexistuje).
5. ✅ `scripts/optimize-theme-backgrounds.mjs` existuje, lintne, importuje `sharp`, není spuštěn (= žádný diff v `public/themes/`).
6. ✅ `package.json` má `build:theme-assets` script.
7. ✅ `docs/themes/README.md` tabulka tématů linkuje na `../../assets-source/themes/references/<slug>.png` (nebo `backgrounds/` pokud references smazané).
8. ✅ `docs/themes/PROMPTS-BACKGROUNDS.md` instrukce ukládá do `assets-source/themes/backgrounds/`.
9. ✅ Build prochází (`npm run build`) — žádný 404 na asset.
10. ✅ `public/themes/`, `public/defaults/`, `public/favicon.webp`, `public/icons.svg` beze změny.
11. ✅ Smoke test: theme switcher v UI funguje, backgrounds + thumbnails se načítají.

---

## 7. Riziko & rollback

| # | Riziko | Mitigace |
|---|---|---|
| 1 | Markdown odkaz v `README.md` se po přesunu rozbije (broken link) | Per-link grep před commitem |
| 2 | Skript `optimize-theme-backgrounds.mjs` neoptimální / vytvoří nekvalitní WebP | Out-of-scope spustit; manual review až potom |
| 3 | České názvy se zlomí na FS rename (Windows kódování) | Použít PowerShell `Move-Item` (UTF-8 safe) místo `mv`; ověřit po každém kroku |
| 4 | Smazaná `src/assets/vite.svg` je referencovaná (`index.html`?) | Grep před smazáním. Předpoklad: ne. |

**Rollback:** všechny operace jsou file moves a markdown editace, plně revertovatelné `git checkout`. Žádná funkční změna v kódu.

---

## 8. Otázky k autorovi

Žádné — autor delegoval rozhodnutí. Volby:

1. **`assets-source/` jako top-level složka** (ne `src/assets-source/` ani `public/source/`) — drží se existujícího pattern z avatarů.
2. **`references/` deduplikace** — během impl. zkontroluju hash. Pokud identické s `backgrounds/`, references smazat úplně (1 zdrojáků místo 2).
3. **Konverzní skript** zavést, ale **nespouštět** v této specu — separátní krok po vizuální review.

---

**Po schválení specu napíšu implementační plán** (PowerShell-safe rename příkazy s diakritikou, hash-based dedup logika, exact diff pro markdown).
