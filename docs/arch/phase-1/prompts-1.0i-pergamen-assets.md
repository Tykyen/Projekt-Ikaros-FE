# Pergamen skin — asset prompty (1.0i)

> **STAV (2026-05-10):** ✅ **Všech 11 rasterových assetů dodáno** uživatelem do `assets-source/themes/pergament/`. Iluminované „V" původně bonusový raster — **přepnuto na CSS-only `::first-letter` drop-cap** (rozhodnutí user: jiné assety nedostane). Tento dokument zůstává pro historickou referenci.

Původní seznam **11 AI assetů** skinu Pergamen:
- 1× corner ornament (TL master, mirror přes CSS na zbylé 3 rohy)
- 7× navigační pečetě (Úvodník, Vytvořit svět, Diskuze, Články, Galerie, Nápověda, Hospoda)
- 1× wax seal pro CTA tlačítka
- 1× knižní záložka (rudá hedvábná stuha se střapcem)
- 1× divider seal (mini pečeť pro sekční divider)

> **Background neměníme** (rozhodnutí user) — používáme existující `public/themes/backgrounds/pergamen.webp`.
> **Iluminované „V" neměníme na asset** — implementováno čistě v CSS přes `::first-letter` pseudoelement.

---

## ⚠️ Symbol mapping — důležitá poznámka po dodání

V reálných dodaných assetech jsou symboly `vytvorit-svet` a `clanky` **přehozené** oproti původnímu zadání níže (verze 2026-05-10):

| Soubor | Reálný symbol uvnitř | Původní zadání |
|---|---|---|
| `icon-vytvorit-svet.png` | **svinutý svitek se zlatou stuhou** | quill pen + drop |
| `icon-clanky.png` | **brk s kapkou inkoustu** | scroll + ribbon |

**Rozhodnutí (audit H7):** mapování zachováno — tematicky lepší (svitek = nová kronika světa, brk = psaní článku). Spec aktualizován, ne assety.

**Styl skinu:** klášterní skriptorium 13. století okem Tolkienova kronikáře — *pergamen + tmavé dřevo + zlatá iluminace + sytě rudý burgundy vosk pečetí*. Atmosféra rozjímavá, badatelská, lehce opotřebovaná („handcrafted, ne sterilní").

**Generátor:** ChatGPT (GPT-4o image gen) nebo Midjourney v6.1. Output: PNG s alfa, pak `cwebp -q 90 -alpha_q 100`.

**Reference logo + medailon + big-book (už hotové):** [`../../../assets-source/themes/pergament/`](../../../assets-source/themes/pergament/) — držet **stejnou paletu a světelný úhel** (top-left rim-light) jako tyto.

---

## 🎨 STYLE GUIDE (závazné pro všechny assety)

Nedodržení = inkonzistentní set. ChatGPT/MJ často „uteče" do generic fantasy — proto explicitně vyjmenované zákazy.

### Reference look
**Inspirace:** Book of Kells (paleta + iluminované initials) × Lindisfarne Gospel (zlatý reliéf) × Tolkienovy ručně psané dopisy a mapy (handcrafted feel, „warm" nedokonalost) × Stardew Valley journal artwork (čitelnost při malé velikosti).

**Cíl:** klášterní rozjímavost, středověká autentičnost, ručně malovaná textura.

**NE:** Hogwarts kouzelnické svitky. NE generic D&D pergamen. NE chrámový gotický chlad. NE moderní art-deco. NE Disney medieval kitsch. NE neonové barvy.

### Master barevná paleta (přesné hex kódy)

| Role | Hex | Použití |
|---|---|---|
| **Pergamen krém** primary | `#e8d8a0` | světlé partie pergamenu, střapcové akcenty |
| **Pergamen tmavý** | `#c4a868` | aged edges pergamenu, stíny |
| **Pergamen ink-stained** | `#a08850` | vnitřní stránka knih, opotřebované partie |
| **Wood dark** | `#3d2914` | tmavé dřevo knižních vazeb, korbel |
| **Wood mid** | `#6a4a28` | světlejší dřevo, středy ornamentů |
| **Wood highlight** | `#8a6840` | top-light na dřevě |
| **Soft gold** primary | `#d4a946` | rámečky, iluminace, zlatá kaligrafie |
| **Gold highlight** | `#f0c860` | jiskra na zlatu, hrana světla |
| **Gold deep** | `#9a7830` | hluboký zlatý důl, hairline outlines |
| **Burgundy wax** primary | `#8a1a10` | voskové pečetě, akcenty |
| **Burgundy bright** | `#a83020` | top-light na vosku |
| **Burgundy deep** | `#601008` | stíny vosku, deep red |
| **Ink black** | `#1a0e04` | středověký inkoust, hluboké stíny |
| **Amber ale** | `#c08a30` | pivo v korbeli (jen pro hospoda pečeť) |

**Zakázané barvy:**
- ❌ neonová červená / oranž (vosk je *přírodní*, sytá ale tlumená)
- ❌ tyrkysová / cyan / fialová (to je magie / sci-fi skin)
- ❌ syté žluté kanárkové (zlato musí být *měkké*, mosazné)
- ❌ čistě bílá zářící (`#ffffff` — kromě malého reflexního bodu na pečeti)
- ❌ černá obrysová linka — vždy zlatá `#9a7830` hairline outline místo black stroke
- ❌ zelená (to je priroda skin)
- ❌ modrá (to je modre-nebe / vesmirna-lod skin)

### Materiály

**Pergamen:**
> *"warm cream parchment with subtle aged texture and slight darker edges, hand-painted, occasional ink-stain or smudge to give handcrafted feel, no harsh shadows"*

**Vosková pečeť (burgundy):**
> *"deep burgundy red wax seal (#8a1a10) with #a83020 top-light catching the highest relief, soft brushed gold (#d4a946) symbol embossed in the center as a low relief, slightly irregular circular edge typical of melted wax (not perfect circle), warm rim-light from top-left, hand-painted storybook style, no glossy plastic shine"*

**Zlato (rámečky, iluminace, kaligrafie):**
> *"soft brushed antique gold (not bright yellow), warm rim-light from top-left, subtle hand-painted brush texture on the metal, no chrome reflection, no neon shine"*

**Dřevo (knižní vazby, rámy):**
> *"dark aged hardwood (#3d2914) with subtle warm wood-grain texture (#6a4a28), hand-painted storybook style, soft top-left light catching the highest grain, no plastic gloss"*

### Světelný úhel

**Vždy top-left rim-light.** Stín dolů-vpravo (jemný, nikoli ostrý). Důvod: musí ladit s logem a medailonem (dodanými user), kde je světlo také odshora-zleva.

### Kompozice (pro ikony / pečetě)

- Subjekt **centrovaný v rámu**, žádný offset
- **Žádný drop-shadow do rámu** — alfa kanál, finální stín přidá CSS
- **Žádný frame / border** kolem subjektu (kromě pečetí kde je hairline okolo součást subjektu)
- Subjekt vyplňuje cca **70 % plochy** ikony — okolo je transparentní vzduch

### Co NESMÍ být v žádné ikoně

- ❌ text, písmena, číslice (kromě iluminovaného „V" assetu a `?` na knize Nápověda)
- ❌ podpis autora / watermark
- ❌ pixely (vector-clean, ale ne flat — hand-painted)
- ❌ frame / box / border okolo (kromě pečetí, viz výše)
- ❌ sytá svítící glow aura (skin je tichý, rozjímavý)
- ❌ obličeje, postavy, lebky (kromě anděla v dodaném medailonu)
- ❌ čistá symetrie — hand-painted znamená *lehkou* nedokonalost

---

## 📦 ASSET 1/12 — `corner-tl.webp` (Master TL roh)

**Účel:** rohový ornament panelů (sidebar, welcome, novinky). 1 master roh, mirror přes CSS scaleX/Y na ostatní 3.
**Cílová cesta:** `public/themes/pergamen/decor/corner-tl.webp`
**Velikost:** 240×240 (transparentní pozadí, alfa)
**Pozice asset:** ornament v levém horním rohu plochy, ostatní 3 rohy plochy = transparentní

### Prompt
```
A medieval illuminated manuscript corner ornament occupying the top-left corner of a 240x240 square canvas (other 75% of canvas is transparent). The ornament features curling vine-like calligraphic flourishes in soft brushed antique gold (#d4a946 with #f0c860 highlights and #9a7830 deep shade), inspired by Book of Kells and Lindisfarne Gospel marginalia. Two or three small burgundy red wax seal accents (#8a1a10 with #a83020 top-light) embedded among the gold curls. Subtle dark wood (#3d2914) underlay visible behind the gold scrollwork in places. Hand-painted storybook style, warm top-left rim-light, no harsh shadows, no text or letters or runes, no frame or border around the ornament itself, fully transparent background outside the corner ornament shape. --style raw --ar 1:1 --v 6.1
```

### Negative
`flat vector, neon, glow, runes, calligraphy text, latin letters, full square frame, four corners (only top-left), photorealistic 3D, chrome metal, plastic shine, art deco, geometric celtic knot, cyan, purple, green`

### Schvalovací kritéria
- [ ] Ornament zaujímá pouze TL roh (~25% plochy), zbytek transparentní
- [ ] Vine-like (vlnící se) ne geometrické — handcrafted feel
- [ ] 2-3 drobné burgundy akcenty mezi zlatem
- [ ] Po CSS mirror scaleX(-1) na TR roh nevypadá podivně (stranově symetrické tvary)

---

## 📦 ASSETS 2-8/12 — 7× NAVIGAČNÍ PEČETĚ (sjednocený formát)

**Účel:** 7 unikátních pečetí pro nav-itemy. **Sdílí formát**, mění se symbol uvnitř.
**Cílová cesta:** `public/themes/pergamen/decor/icon-<key>.webp`
**Velikost:** 256×256 (transparentní pozadí, alfa)

### Společný formát (závazný pro všech 7)

```
Kruhová červená vosková pečeť (cca 80% plochy canvas, centrovaná).
Burgundy wax base (#8a1a10), bright burgundy top-light (#a83020), deep shade dole (#601008).
Slightly irregular circular edge (melted wax, ne perfect circle).
Drobná zlatá hairline (#9a7830) okolo pečetě.
Uvnitř: zlatý reliéf symbolu (#d4a946) embossed jako low relief, ne flat.
Top-left rim-light na vosku i na zlatě, jemný stín dolů-vpravo (alfa, ne CSS).
Background transparent.
```

### Prompt template (kopíruj a dosaď symbol)

```
A circular burgundy red wax seal (deep #8a1a10 base with #a83020 top-light highlight and #601008 shadow on lower-right), slightly irregular melted-wax edge (not perfect circle, occupying about 80% of a 256x256 transparent canvas, centered). A thin soft-gold hairline (#9a7830) traces the wax edge. In the center of the wax, a brushed antique gold (#d4a946 with #f0c860 highlights) low-relief embossed symbol of: <SYMBOL>. Warm rim-light from top-left on both the wax and the gold relief, hand-painted storybook style reminiscent of Book of Kells illuminated initials and Tolkien manuscript wax seals, fully transparent background outside the seal shape, no shadow on the canvas (alpha clean), no text, no letters, no Latin script, no runes, no frame or border. --style raw --ar 1:1 --v 6.1
```

### Univerzální negative
`flat vector, neon, glow, drop shadow on canvas, frame, border, watermark, text, runes, letters, pixel art, multiple seals, chrome, plastic shine, cyan, purple, green, modern, scifi`

---

### 2/12 `icon-uvodnik.webp` — Úvodník

**`<SYMBOL>`:**
> *"a small open book with two visible pages, slightly tilted at 3/4 angle, abstract calligraphic squiggles on the pages (no readable text), book lying flat with both pages spread"*

---

### 3/12 `icon-vytvorit-svet.webp` — Vytvořit svět

**`<SYMBOL>`:**
> *"a quill pen pointing diagonally from upper-left to lower-right, with a small ink droplet falling from the tip, feather has visible barbs"*

---

### 4/12 `icon-diskuze.webp` — Diskuze

**`<SYMBOL>`:**
> *"a rolled parchment letter scroll viewed from the side, slightly unrolled at one end revealing two abstract calligraphic squiggle-lines (no readable text)"*

---

### 5/12 `icon-clanky.webp` — Články

**`<SYMBOL>`:**
> *"a partially unrolled scroll viewed from front-on showing the inside surface, with a horizontal silk ribbon tied around its middle, both rolled ends visible at top and bottom, abstract squiggles on the visible parchment surface (no readable text)"*

---

### 6/12 `icon-galerie.webp` — Galerie

**`<SYMBOL>`:**
> *"a small ornate illuminated manuscript frame (rectangular gold frame with curled corner flourishes), with a tiny abstract painted miniature inside (a stylized tree or castle silhouette, no detail just a shape)"*

---

### 7/12 `icon-napoveda.webp` — Nápověda

**`<SYMBOL>`:**
> *"a small open book (similar to uvodnik but viewed front-on, not 3/4) with a single large stylized question mark in elegant calligraphic gold script floating above the pages, the question mark is the dominant feature"*

---

### 8/12 `icon-hospoda.webp` — Hospoda

**`<SYMBOL>`:**
> *"a small pewter beer tankard viewed from the side at slight 3/4 angle, with a dark wooden handle (#3d2914), amber ale (#c08a30) visible at the brim with a small foam crest (#e8d8a0), no plant or vine decoration"*

---

## 📦 ~~ASSET 9 — iluminated-v.webp~~ (ZRUŠENO 2026-05-10)

> **Tento asset NENÍ potřeba.** Iluminované „V" nahrazeno CSS-only `::first-letter` drop-cap implementací v `decorations.css`. Žádný PNG/WebP soubor se negeneruje. Prompt níže ponechán pro budoucí referenci, kdyby se rozhodlo na raster vrátit.

<details>
<summary>Původní prompt (pro historickou referenci)</summary>

## (deprecated) `iluminated-v.webp` (Bonus: iluminované V)

**Účel:** velké iluminované kapitálum „V" jako první písmeno nadpisu „Vítej v Projektu Ikaros" ve welcome card.
**Cílová cesta:** `public/themes/pergamen/decor/iluminated-v.webp`
**Velikost:** 256×256 (transparentní pozadí, alfa)

### Prompt
```
A large illuminated capital letter "V" in the style of a 9th century Book of Kells initial, occupying about 75% of a 256x256 transparent canvas, centered. The letter "V" is rendered in soft brushed antique gold (#d4a946 with #f0c860 highlights and #9a7830 shade), with intricate hand-painted curling vine-like flourishes extending from the letter's strokes. Inside the negative space of the V (between the two diagonal strokes), a small burgundy red wax-textured background (#8a1a10) with a single tiny gold star or quatrefoil pattern. Two or three small abstract emerald-green or burgundy red dots as accent (NOT bright neon, muted historical pigments). Warm top-left rim-light on the gold, hand-painted storybook style reminiscent of Lindisfarne Gospel and Book of Kells illuminated initials, fully transparent background outside the letter and its flourishes, no shadow on canvas, no other letters or text. --style raw --ar 1:1 --v 6.1
```

### Negative
`flat vector, neon, glow, modern font, sans-serif, multiple letters, sentence, full word, text, runes, frame around, drop shadow on canvas, photorealistic, chrome, plastic, cyan, purple`

### Schvalovací kritéria
- [ ] Tvar písmene „V" jasně rozeznatelný (ne zaniká pod ornamenty)
- [ ] Iluminace v Book of Kells stylu (vlnící se, ne geometrické)
- [ ] Burgundy + zlato dominuje, žádná konkurující barva

</details>

---

## 📦 ASSET 10/12 — `wax-seal.webp` (Bonus: wax seal CTA)

**Účel:** drobný voskový pečetní reliéf vlevo na CTA tlačítkách (PŘIDAT NOVINKU, ZOBRAZIT VŠE).
**Cílová cesta:** `public/themes/pergamen/decor/wax-seal.webp`
**Velikost:** 128×128 (transparentní pozadí, alfa)

### Prompt
```
A small circular burgundy red wax seal (deep #8a1a10 base with #a83020 top-light and #601008 shadow), slightly irregular melted-wax edge, occupying about 80% of a 128x128 transparent canvas, centered. A thin soft-gold hairline (#9a7830) traces the wax edge. In the center, a brushed antique gold (#d4a946) low-relief embossed simple plus sign "+" or four-pointed star, NOT a complex symbol (this is a small CTA decoration, must be readable at 24x24px). Warm top-left rim-light, hand-painted storybook style, fully transparent background outside the seal, no shadow on canvas, no text. --style raw --ar 1:1 --v 6.1
```

### Negative
`flat vector, neon, glow, complex symbol, multiple symbols, text, letters, runes, frame, border, drop shadow on canvas, watermark, chrome, plastic, cyan, purple, green`

### Schvalovací kritéria
- [ ] Symbol uvnitř jednoduchý (+ nebo 4-cípá hvězda) — čitelný i v 24×24
- [ ] Stejný vosk a zlato jako 7 pečetí (vizuální konzistence)

---

## 📦 ASSET 11/12 — `bookmark.webp` (Bonus: knižní záložka)

**Účel:** rudá hedvábná stuha s zlatým střapcem visící z pravého horního rohu welcome card.
**Cílová cesta:** `public/themes/pergamen/decor/bookmark.webp`
**Velikost:** 96×320 (vertical, transparentní pozadí, alfa)

### Prompt
```
A vertical hanging silk ribbon bookmark, viewed straight-on, occupying a 96x320 transparent canvas vertically aligned. The ribbon is deep burgundy red silk (#8a1a10 main, #a83020 highlight where light catches the folds, #601008 shadow), slightly textured fabric appearance, hanging downward with a gentle natural curve (not perfectly straight). The top of the ribbon disappears off the top edge of the canvas (suggesting it's tucked into a book above). At the bottom, a small ornate gold tassel (#d4a946 with #f0c860 highlights and #9a7830 deep shade), with several individual gold threads splaying outward like a small fountain. Warm top-left rim-light on both ribbon and tassel, hand-painted storybook style reminiscent of medieval manuscript bookmarks, fully transparent background outside the ribbon and tassel, no shadow on canvas, no text. --style raw --ar 3:10 --v 6.1
```

### Negative
`flat vector, neon, glow, modern, satin glossy plastic, frame around, multiple ribbons, text, watermark, photorealistic 3D render, drop shadow on canvas, top of ribbon visible (must extend off canvas)`

### Schvalovací kritéria
- [ ] Stuha vertical, mírně natural curve (ne přímka)
- [ ] Horní hrana stuhy mizí mimo canvas (ne ukončená)
- [ ] Zlatý střapec dole detailní, čitelný i v 60% scale (mobile)

---

## 📦 ASSET 12/12 — `divider-seal.webp` (OPTIONAL — mini pečeť pro sekční divider)

**Účel:** drobná pečeť uprostřed gradient line mezi sekcemi (NAVIGACE / VESMÍRY / CHAT).
**Cílová cesta:** `public/themes/pergamen/decor/divider-seal.webp`
**Velikost:** 24×24 (transparentní pozadí, alfa)

> **Pozn.:** tento asset je OPTIONAL — lze nahradit CSS-only `::before` pseudoelementem (kruh `border-radius: 50%; background: var(--theme-accent-burgundy)`) bez nutnosti rasterového assetu. Frontend-design audit rozhodne.

### Prompt
```
A tiny circular burgundy red wax seal (#8a1a10 with #a83020 top-light), occupying about 90% of a 24x24 transparent canvas, centered. Thin gold hairline (#9a7830) around. NO symbol inside (just plain wax circle). Warm top-left rim-light, hand-painted, fully transparent background, no shadow on canvas. --style raw --ar 1:1 --v 6.1
```

### Negative
`text, symbol inside, frame, complex pattern, neon, glow, chrome`

---

## 🔁 Shrnutí workflow

1. **Vygeneruj 11-12 assetů** (11 povinných + 1 optional) podle promptů výše. Použij ChatGPT Image (GPT-4o) nebo Midjourney v6.1.
2. **Stáhni jako PNG** s alfou.
3. **Ulož do** `assets-source/themes/pergament/` (existující folder; rename na `pergamen/` proběhne v impl. plánu):
   - `corner-tl.png` → corner ornament
   - `icon-uvodnik.png`, `icon-vytvorit-svet.png`, `icon-diskuze.png`, `icon-clanky.png`, `icon-galerie.png`, `icon-napoveda.png`, `icon-hospoda.png` → 7 pečetí
   - `iluminated-v.png`, `wax-seal.png`, `bookmark.png` → bonusy
   - (volitelně `divider-seal.png`)
4. **Zkontroluj konzistenci** vedle sebe (otevři všech 7 pečetí v file exploreru — vypadají jako stejný umělec?). Pokud ne, regeneruj outliers.
5. **Předej Claudovi pro impl. fázi** — automaticky převede PNG → WebP a zapojí do CSS.

---

## ✅ Checklist předání pro Claude (impl. fáze) — STAV K 2026-05-10

- [x] Corner `corner-tl.png` v `assets-source/themes/pergament/`
- [x] 7× `icon-<key>.png` v `assets-source/themes/pergament/`
- [~] ~~`iluminated-v.png`~~ — zrušeno, CSS-only řešení
- [x] `wax-seal.png` v `assets-source/themes/pergament/`
- [x] `bookmark.png` v `assets-source/themes/pergament/`
- [x] `divider-seal.png` v `assets-source/themes/pergament/`
- [x] Vizuální QA: 7 pečetí vedle sebe vypadá jako 1 set ✅ (vysoká konzistence díky shared formátu)

**Všechny rasterové assety dodané** → pokračujeme implementací 1.0i.
