# Příroda skin — asset prompty

Prompty pro **5 nových AI assetů** skinu Příroda (logo + medailon + background = už dodané, jen konverze PNG→WEBP):
- 4 nav ikony (leaf, hospoda, úvodník, nápověda)
- 1 master corner ornament (mirror přes CSS na zbylé 3 rohy)

**Styl skinu:** zakletý prastarý les při západu slunce — *temně zelené dřevo + břečťan + smaragdové krystaly + měkké zlato + krémová bílá*. Vše transparentní, izolované, bez stínů, bez textu, hand-painted storybook.

**Generátor:** Midjourney v6.1 (preferred) nebo Flux/SDXL. Output: PNG s alfa, pak `cwebp -q 90 -alpha_q 100`.

**Reference cíl skinu:** [`../../../assets-source/themes/references/priroda.png`](../../../assets-source/themes/references/priroda.png)
**Reference logo & medailon (už hotové):** [`../../../assets-source/themes/priroda/`](../../../assets-source/themes/priroda/) — držet **stejnou paletu a světelný úhel** (top-left rim-light) jako tyto.

---

## 🎨 STYLE GUIDE

Závazné pro všechny 4 ikony. Nedodržení = inkonzistentní set, který bude vedle sebe vypadat „slátaný".

### Reference look
Inspirace: **Brian Froud (Labyrinth, Dark Crystal) + Stardew Valley journal artwork + Hidden Folks foliage**. Cíl: organická melancholie, tichá magie, ručně malovaná textura, **NE** vector flat icon, **NE** Disney Tinkerbell, **NE** WoW night-elf, **NE** generic D&D pergamen.

### Barevná paleta (přesné hex kódy)

| Role | Hex | Použití |
|---|---|---|
| **Forest deep** primary | `#0d2818` | nejtmavší partie pozadí (nepoužije se v ikonách, jen pro kontext) |
| **Emerald** primary | `#1f6a3a` | hlavní zelená břečťanu/listů |
| **Moss highlight** | `#3d9a4a` | světlejší partie listů, top rim-light |
| **Moss shade** | `#0e3a20` | hluboké stíny v listoví |
| **Wood dark** | `#3d2914` | dřevo korbele, vazba knihy |
| **Wood mid** | `#6a4a28` | světlejší partie dřeva, středy |
| **Wood highlight** | `#8a6840` | top-light na dřevě |
| **Soft gold** primary | `#d4a946` | rámečky, pečetě, ozdobné akcenty |
| **Gold highlight** | `#f0c860` | jiskra na zlatu, hrana světla |
| **Gold shade** | `#9a7830` | hluboký zlatý důl |
| **Cream parchment** | `#e8d8a0` | svitek, světlé partie textur |
| **Amber ale** | `#c08a30` | pivo v korbeli (jen pro hospoda ikonu) |

**Zakázané barvy:**
- ❌ neonová / svítící zelená (Hulk, Slimer) — emerald je *přírodní*, ne radioaktivní
- ❌ tyrkysová / cyan-zelená (to je magie / sci-fi skin)
- ❌ syté žluté kanárkové (zlato musí být *měkké*, mosazné)
- ❌ čistě bílá zářící (krémová `#e8d8a0`, **NE** `#ffffff` — kromě malého reflexního bodu na pečeti)
- ❌ černá obrysová linka — vždy zlatá `#9a7830` hairline outline místo black stroke
- ❌ purpurová / fialová (to je magie skin)

### Materiály — jak je popsat v promptu

**Břečťan / listy:**
- *"deep emerald ivy leaves with subtle gold rim-light from top-left, slightly glossy hand-painted surface, organic curling tendrils, hint of natural matte texture"*
- vyhnout se: glitter, neon glow, plastic shine, geometric stylization

**Dřevo:**
- *"dark aged hardwood with subtle warm wood-grain texture, hand-painted storybook style, soft top-left light catching the highest grain, no plastic gloss"*

**Zlato (pečetě, rámečky, knihovní hřbety):**
- *"soft brushed antique gold (not bright yellow), warm warm rim-light from top-left, subtle hand-painted brush texture on the metal, no chrome reflection, no neon shine"*

**Pergamen (svitek):**
- *"warm cream parchment with subtle aged texture and slight darker edges, hand-painted, no harsh shadows"*

### Světelný úhel
**Vždy top-left rim-light.** Stín dolů-vpravo (jemný, nikoli ostrý). Důvod: musí ladit s logem a medailonem, kde je světlo také odshora-zleva.

### Kompozice
- Subjekt **centrovaný v rámu**, žádný offset
- **Žádný drop-shadow do rámu** — alfa kanál, finální stín přidá CSS
- **Žádný frame / border** kolem subjektu (ikony se vkládají do CSS panelu, který má vlastní rám)
- Subjekt vyplňuje cca **70 % plochy** ikony — okolo je transparentní vzduch

### Co NESMÍ být v žádné ikoně
- ❌ text, písmena, číslice (kromě `?` na knize Nápověda)
- ❌ podpis autora / watermark
- ❌ pixely (vector-clean, ale ne flat — hand-painted)
- ❌ frame / box / border okolo
- ❌ sytá svítící glow aura (skin je tichý)
- ❌ obličeje, postavy, lebky

---

## 📦 ASSET 1/4 — `icon-leaf.webp` (2 výstupní velikosti — audit M3)

**Účel:** sdílený default lístek pro 4 nav-itemy bez vlastní ikony (Vytvořit svět, Diskuze, Články, Galerie).

**Generuj 1× ve vysokém rozlišení** (cca 1024×1024), pak **dva výstupy** s explicit sharpeningem:

| Výstup | Velikost | Použití | Encode |
|---|---|---|---|
| `icon-leaf-64.webp` | 64×64 | desktop NavItem | `cwebp -q 90 -alpha_q 100 -sharp_yuv` |
| `icon-leaf-32.webp` | 32×32 | mobile NavItem (audit M2/M4 — touch target > 48px ale ikona menší) | po Lanczos resize + USM `0.5/1/0.5`, pak `cwebp -q 90 -alpha_q 100` |

> Důvod dvou velikostí: hairline gold outline a žilkování listu zaniknou při naivním downscale z 1024 na 32. Mobilní verze potřebuje vlastní render s pre-encoded sharpening, jinak vypadá rozmazaně.

### Prompt (Midjourney v6.1)
```
A single small ivy leaf icon, deep emerald green (#1f6a3a) with moss highlight on top edge (#3d9a4a) and soft gold hairline outline (#9a7830), warm rim-light from top-left, subtle hand-painted brush texture on the leaf surface, slight curl giving organic 3D feel, hand-painted storybook style reminiscent of Brian Froud and Stardew Valley journal artwork, centered composition filling 70% of the canvas, clean fully transparent background (alpha channel), no shadow, no text, no frame, no border, no glow, no aura, simple shape readable at small size --style raw --ar 1:1 --v 6.1
```

### Negative / vyhnout se
`flat vector, neon green, cyan, glow, drop shadow, frame, border, watermark, text, pixel art, low-poly, geometric stylization, multiple leaves, vine, branch, intricate veining that disappears at small size, photorealistic 3D render`

### Schvalovací kritéria
- [ ] Tvar listu čitelný i v 32×32 thumbnailu (test: open ve viewer při 100% zoom)
- [ ] Gold outline `#9a7830` viditelná, ale ne dominantní — listy by měly být zelené, ne zlaté
- [ ] Žilkování zachováno v 64×64, akceptovatelně zjednodušené v 32×32
- [ ] Vedle sebe s ostatními 3 ikonami (hospoda, uvodnik, napoveda) působí jako stejný umělec

---

## 📦 ASSET 2/4 — `icon-hospoda.webp`

**Účel:** nav-item Hospoda (pivní korbel s úponkem).

**Velikost:** 96×96 px, transparentní pozadí.
**Cílová cesta:** `public/themes/priroda/decor/icon-hospoda.webp`

### Prompt
```
A small dark wooden beer tankard icon (#3d2914 wood with #6a4a28 grain), brushed antique soft-gold rim band (#d4a946) at the top, deep amber ale (#c08a30) visible at the brim with a small foam crest (#e8d8a0), one delicate emerald-green ivy tendril (#1f6a3a) curling around the wooden handle with two small leaves, warm rim-light from top-left, hand-painted storybook style reminiscent of Brian Froud and Stardew Valley journal artwork, centered composition filling 70% of the canvas, clean fully transparent background (alpha channel), no shadow, no text, no frame, no border, no glow --style raw --ar 1:1 --v 6.1
```

### Negative
`flat vector, neon, glow, cartoon mug face, googly eyes, foam overflow drips, multiple tankards, table, wood plank background, watermark, text label, pixel art, chrome metal`

---

## 📦 ASSET 3/4 — `icon-uvodnik.webp`

**Účel:** nav-item Úvodník (rozvinutý svitek s pečetí).

**Velikost:** 96×96 px, transparentní pozadí.
**Cílová cesta:** `public/themes/priroda/decor/icon-uvodnik.webp`

### Prompt
```
A small partially unrolled cream parchment scroll (#e8d8a0) with slightly darker aged edges, a deep emerald-green wax seal (#1f6a3a) in the center stamped with a single ivy-leaf emblem, soft brushed-gold edge highlights (#d4a946) on the rolled ends, two delicate ivy tendrils (#1f6a3a) curling out from behind the rolled ends with one small leaf each, warm rim-light from top-left, hand-painted storybook style reminiscent of Brian Froud and Stardew Valley journal artwork, centered composition filling 70% of the canvas, clean fully transparent background (alpha channel), no shadow, no text or letters or runes on the parchment surface, no frame, no border, no glow --style raw --ar 1:1 --v 6.1
```

### Negative
`flat vector, neon, glow, runes, calligraphy text, latin letters, fully unrolled flat, multiple scrolls, table, wax dripping, red seal, gold seal, watermark, pixel art`

---

## 📦 ASSET 4/4 — `icon-napoveda.webp` ⚠️ REGENERACE (audit B1)

**Účel:** nav-item Nápověda (kniha s úponkem břečťanu).

**Velikost:** 96×96 px, transparentní pozadí.
**Cílová cesta:** `public/themes/priroda/decor/icon-napoveda.webp`

> **Pozor — toto je revize promptu.** Předchozí výstup byl photoreal 3D render se vzpřímenou knihou a bohatým ivy archem (outlier vs. ostatní 3 ikony). Tento prompt cílí 3/4 angled view + plochou hand-painted texturu + minimal ivy.

### Prompt (Midjourney v6.1) — revize
```
A small closed leather-bound book icon shown in 3/4 angled view (lying flat at slight angle, similar viewing angle to a tankard or scroll resting on a surface), deep emerald-green leather cover (#1f6a3a) with visible hand-painted brush texture (NOT 3D render, NOT photorealistic), soft matte antique gold (#d4a946) hand-painted spine and four small simple corner brackets (no ornate engraving, no embossed pattern), a single soft matte gold question mark (#d4a946) painted flat on the front cover (no specular highlight, no embossed metallic shine), one delicate emerald-green ivy tendril (#1f6a3a) with three to four leaves curling along the top edge of the book only (NOT a full arch, NOT both sides), warm rim-light from top-left, hand-painted storybook style reminiscent of Brian Froud and Stardew Valley journal artwork, painterly brushwork visible in flat color areas, centered composition filling 70% of the canvas, clean fully transparent background (alpha channel), no shadow under the book, no extra text, no border, no rectangular frame around the icon, no glow, no aura --style raw --ar 1:1 --v 6.1
```

### Negative — rozšíření
`3D render, photorealistic, photoreal, octane render, blender render, cinema 4d, vertical standing book, upright book, book balancing on edge, embossed metallic question mark, specular highlight on gold, chrome reflection, ornate corner mounts, engraved corner brackets, full ivy arch, ivy on both sides of book, ivy frame, dense foliage, multiple ivy branches, scroll, candle, glasses, sword, magic wand, glowing pages, rune symbols, latin letters on cover, exclamation mark, smooth airbrushed gradient, glossy plastic finish, drop shadow, watermark, pixel art`

### Schvalovací kritéria po regeneraci
- [ ] Knížka v náklonu (3/4 view), **ne** vzpřímeně
- [ ] **Žádný photoreal specular** na zlatých prvcích — matný painted gold
- [ ] **Pouze 1 ivy úponek** podél horní hrany (3–4 listy), ne arch / oboustranný
- [ ] Brush texture viditelná v plochých barvách
- [ ] Vedle sebe s `icon-hospoda` a `icon-uvodnik` působí jako **stejný umělec**

> Pokud i druhá iterace má photoreal sklon, doplnit do promptu na začátek: `"watercolor and gouache illustration, traditional storybook book illustration, 1990s childrens book aesthetic, no CGI"`.

---

## 📦 ASSET 5/5 — `corner-tl.webp` (master, mirror přes CSS)

**Účel:** rohový ornament panelů (welcome card, sidebars, novinky panel). Vyrobíme **jeden master** v orientaci top-left, ostatní 3 rohy řešíme CSS transformem (`scaleX(-1)` pro TR, `scaleY(-1)` pro BL, `scale(-1,-1)` pro BR).

**Velikost:** 256×256 px, transparentní pozadí. Ornament obsazuje horní-levý kvadrant (~160×160), zbytek = transparentní vzduch (do něj se vkreslí obsah panelu).
**Cílová cesta:** `public/themes/priroda/decor/corner-tl.webp`

### Prompt (Midjourney v6.1)
```
A decorative L-shaped ivy corner ornament anchored at the upper-left, deep emerald-green ivy stem (#1f6a3a) wrapping along the top edge for ~120px and along the left edge for ~120px, six to eight emerald-green ivy leaves (#1f6a3a with #3d9a4a top highlights) of varied sizes scattered along the stem, three small five-petal cream-white wildflowers (#e8d8a0 petals with soft #d4a946 gold center) tucked among the leaves, the inside of the L (lower-right) is fully empty transparent, soft brushed-gold thin highlight along the main stem (#d4a946), warm rim-light from upper-left, hand-painted storybook style reminiscent of Brian Froud and Stardew Valley journal artwork, organic asymmetric arrangement, clean fully transparent background (alpha channel), no shadow, no text, no frame, no border, no glow, no full panel border --style raw --ar 1:1 --v 6.1
```

### Negative
`flat vector, neon, glow, symmetric perfect arrangement, full rectangular frame, full panel border, closed loop wreath, vector clipart, multiple separate corners, drop shadow, watermark, text, pixel art, cartoon flowers with faces`

### CSS strategie použití (pro kontext)
```css
[data-theme="priroda"] .panel::before { /* TL */
  background-image: url('corner-tl.webp');
}
[data-theme="priroda"] .panel::after { /* TR */
  background-image: url('corner-tl.webp');
  transform: scaleX(-1);
}
/* BL + BR řešeny dalšími pseudo-prvky / CSS-grid overlay */
```

### Kontrola: 4 rohy vedle sebe (mock)
Po vygenerování si ulož 4 verze (TL, TL-flipX, TL-flipY, TL-flip-XY) vedle sebe na jeden screenshot. Pokud to vypadá jako 4 různé květiny / různý poměr listů → master má příliš asymetrický focal point a regenerujeme s důrazem na "evenly distributed leaves and one flower in upper-left, one mid-stem, one near corner pivot".

---

## 🔄 Postup po vygenerování

1. Stáhni PNG s alfa kanálem (cca 1024×1024 px ze MJ).
2. Zkontroluj proti style guide:
   - barva, světelný úhel (top-left), styl (hand-painted), žádný frame/text/glow.
   - **Vedle sebe** s logem a medailonem (`assets-source/themes/priroda/`) — musí vypadat jako rodina, ne 4 různí umělci.
3. Pokud OK → resize:
   - `icon-leaf.png` → 64×64
   - icon-hospoda/uvodnik/napoveda → 96×96
   - `corner-tl.png` → 256×256
4. Konverze:
   ```
   cwebp -q 90 -alpha_q 100 icon-leaf.png -o icon-leaf.webp
   cwebp -q 90 -alpha_q 100 icon-hospoda.png -o icon-hospoda.webp
   cwebp -q 90 -alpha_q 100 icon-uvodnik.png -o icon-uvodnik.webp
   cwebp -q 90 -alpha_q 100 icon-napoveda.png -o icon-napoveda.webp
   cwebp -q 90 -alpha_q 100 corner-tl.png -o corner-tl.webp
   ```
5. Vlož do `public/themes/priroda/decor/`.
6. **Commit** = `chore(themes/priroda): add nav-icon assets`.

---

## ✅ Kontrolní seznam před schválením assetu

Pro každou ze 4 ikon:

- [ ] Top-left rim-light shoduje se s `logo.png` a `medailon.png`
- [ ] Paleta dodržena (žádný neon, žádná cyan, žádná fialová)
- [ ] Žádný text/písmena (kromě `?` na knize)
- [ ] Žádný frame/border kolem subjektu
- [ ] Žádný drop-shadow zapečený do PNG (alpha-čistý)
- [ ] Subjekt vyplňuje cca 70 % plochy
- [ ] Vedle sebe (4 ikony jeden screenshot) působí jako rodina
- [ ] Webp velikost <20 KB / ikona

---

## 🛠️ Konverze už dodaných assetů (PNG → WEBP)

Pro úplnost — tyto 4 už máš jako PNG, jen potřebují konverzi do `public/themes/priroda/`:

| Zdroj | Cíl | Příkaz |
|---|---|---|
| `assets-source/themes/priroda/logo.png` | `public/themes/priroda/decor/logo.webp` | `cwebp -q 92 -alpha_q 100 logo.png -o logo.webp` |
| `assets-source/themes/priroda/medailon.png` | `public/themes/priroda/decor/medallion.webp` | `cwebp -q 92 -alpha_q 100 medailon.png -o medallion.webp` |
| `assets-source/themes/backgrounds/priroda.png` | `public/themes/backgrounds/priroda.webp` | `cwebp -q 88 priroda.png -o priroda.webp` (resize na max 1920px wide předtím) |
| `assets-source/themes/references/priroda.png` | `public/themes/thumbnails/priroda.webp` | resize na 480×270, pak `cwebp -q 80` |
