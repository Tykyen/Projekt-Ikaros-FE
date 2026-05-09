# Prompty pro generování dekorativních assetů — `zlaty-standard`

Tento soubor obsahuje **14 ready-to-paste promptů** pro vygenerování všech dekoračních assetů skinu **Zlatý standard**. Každý asset je samostatná sekce s vlastním promptem, vyladěným tak, aby celá sada držela jednotnou stylovou linku, ale **nebyla identická s žádným jiným skinem** (zejména s `modre-nebe`).

---

## Workflow

1. Otevři ChatGPT (DALL·E 3 / GPT-4o / GPT-5 s image generací).
2. **Pro první asset** zkopíruj `## SHARED STYLE GUIDE` blok níže — ať si AI nastaví styl. Pak teprve prompt.
3. Pro každý další asset stačí jen jeho prompt (AI si pamatuje sérii).
4. Stáhni PNG s **transparentním pozadím** (PNG s alpha kanálem).
5. Ulož do: `c:\Matrix\ProjektIkaros\Projekt-ikaros-FE\assets-source\themes\zlaty-standard\<název>.png`
6. Spusť `npm run themes:optimize` — script vygeneruje WEBP do `public/themes/zlaty-standard/decor/`.

---

## Univerzální specifikace

- **Formát:** PNG s **transparentním pozadím** (alpha channel, ne bílá)
- **Cílový vzhled při použití:** WEBP, malé velikosti (32–256 px viditelné), proto **vysoký kontrast a čisté linie**
- **Pozor:** žádný text, žádné slovo „Ikaros" ani jiný nápis v obrázku

---

## SHARED STYLE GUIDE — zkopíruj jako první při zahájení série

```
DESIGN LANGUAGE — "Zlatý standard / Cosmic Royal Portal" skin:

Aesthetic:
- Cosmic royal cathedral × sci-fi observatory
- Sharper geometry than medieval heraldry — pointed gothic-cathedral filigree, narrow tracery, star-burst rays
- Color palette: obsidian black background, rich royal gold (#d4a017 base, #f0c040 highlights), with deep cyan jewel accents (#19d6e8) ONLY at focal nodes (centers of stars, bezel jewels)
- NO warm bronze, NO orange, NO crimson — strictly cold royal gold + cyan
- NO blue sky tones, NO navy — pure obsidian black backdrops only
- Highlights: thin metallic gold rim-light, faint inner shadow under each filigree stroke (engraved feel)
- Tiny 4-point or 8-point stars sprinkled within the filigree as accents
- Cyan jewel facets only — never as line color, only as small radial gem inside an ornament

Distinctness:
- Must NOT look like medieval/heraldic style (no rounded gold flowers, no thick warm bronze, no rope-borders)
- Art-historical anchors: Sainte-Chapelle stained-glass tracery × Mucha Art Nouveau filigree × antique brass orrery / star chart — translated into pure black + gold + single cyan jewel

Line craft:
- 1.5–2 px clean vector strokes, NO painterly fill, NO watercolor wash, NO thick brush strokes
- Faint engraved inner shadow under each filigree stroke (carved-into-metal feel)
- 10 px transparent margin around all ornamental content; do NOT bleed gold into canvas edges

Hard avoid list (negative prompts — apply to every asset):
- NO round heraldic flowers, NO rope-twist borders, NO thick warm bronze tones
- NO painterly watercolor wash, NO flat vector cartoon style
- NO white halo around gold edges, NO checkerboard background
- NO blue/navy sky tones, NO orange, NO crimson, NO purple

Background:
- Always transparent (alpha PNG with proper alpha channel — not white, not black, not checkerboard)
- Never include text, lettering, or wordmarks
- Never include the Ikaros bird logo

I will now generate a coordinated set of 14 decorative assets in this style. Each will be on transparent background.
```

---

# A. PAGE-FRAME ROHY (4 assety)

Velké rohové ornamenty, které se umístí do rohů panelů (sidebar, welcome card, novinky, right). Musí být **mirror sada** — top-left, top-right, bottom-left, bottom-right.

## 1. `page-frame-corner-tl.png`

```
Generate a single ornate decorative CORNER ornament for the TOP-LEFT corner of a panel.
Square canvas 512×512 px, transparent background, alpha channel PNG.

Composition:
- The ornament occupies the top-left ~70% of the canvas, growing INWARD from the top-left corner
- A pointed gothic-cathedral filigree extends along the top edge (~250 px) and along the left edge (~250 px), meeting in the corner with a focal node
- Focal node: an 8-point royal gold starburst with a small deep CYAN jewel at its center (just one cyan dot, ~6 px)
- Filigree: thin tracery lines, sharp angles, 1-2 px wide gold strokes, with tiny 4-point stars dotted along the tracery
- Style: cosmic-cathedral, narrow vertical and horizontal pointed arches, NOT round heraldic flowers
- Color: rich royal gold #d4a017 with bright #f0c040 highlight rim-light, plus that single cyan jewel
- Bottom-right portion of canvas is fully transparent

CONSTRAINTS:
- 512×512 PNG, transparent background (alpha)
- NO text, NO wordmarks, NO Ikaros bird
- NO warm bronze, NO orange, NO blue/navy backdrops
- Use ONLY pure cold royal gold + a single cyan jewel
- Sharp gothic-cathedral filigree, NOT medieval-heraldic flowers
- The remaining ~30% of the canvas (away from top-left) must be empty / transparent
```

## 2. `page-frame-corner-tr.png`

```
Same style and rules as page-frame-corner-tl, but for the TOP-RIGHT corner.
Square canvas 512×512 px, transparent background.

Composition is the horizontal MIRROR of the TL version:
- Ornament grows inward from the top-right corner
- Filigree extends along the top edge and along the right edge, meeting at the top-right with the 8-point starburst + cyan jewel focal node
- Bottom-left ~30% of canvas fully transparent

CONSTRAINTS: same as the TL version (transparent, no text, only royal gold + single cyan jewel, sharp gothic-cathedral filigree).
```

## 3. `page-frame-corner-bl.png`

```
Same style and rules as page-frame-corner-tl, but for the BOTTOM-LEFT corner.
Square canvas 512×512 px, transparent background.

Composition is the vertical MIRROR of the TL version:
- Ornament grows inward from the bottom-left corner
- Filigree extends along the bottom edge and along the left edge, meeting at the bottom-left with the 8-point starburst + cyan jewel focal node
- Top-right ~30% of canvas fully transparent

CONSTRAINTS: same as the TL version.
```

## 4. `page-frame-corner-br.png`

```
Same style and rules as page-frame-corner-tl, but for the BOTTOM-RIGHT corner.
Square canvas 512×512 px, transparent background.

Composition is the diagonal MIRROR of the TL version:
- Ornament grows inward from the bottom-right corner
- Filigree extends along the bottom edge and along the right edge, meeting at the bottom-right with the 8-point starburst + cyan jewel focal node
- Top-left ~30% of canvas fully transparent

CONSTRAINTS: same as the TL version.
```

---

# B. SECTION-TITLE END-CAPS (2 assety)

Drobné horizontální ornamenty, které se připojí na konec linky u sekcí typu `◆ ─── NAVIGACE ─── ◆`.

**Koncepce: konstelace 3 hvězd, ne souvislý filigrán.** Místo heraldického flourishu chceme pocit *„kousek hvězdné mapy"* — drobné hvězdy spojené tenkými konstelačními liniemi, vrcholící v největší hvězdě s cyan briliantem.

## 5. `nav-end-cap-l.png`

```
Generate a small horizontal decorative END-CAP ornament — the LEFT-FACING version.
Canvas 240×80 px, transparent background.

Composition — a "fragment of a star chart" reading from left to right:
- LEFT edge: tiny 4-point gold star (~6 px), faint
- THIN gold constellation line (~1.5 px stroke, slightly broken/dashed feel) connects rightward
- MIDDLE: medium 4-point gold star (~10 px)
- THIN gold constellation line continues rightward
- RIGHT side (focal): largest 8-point gold starburst (~22 px) with a single deep CYAN jewel at its very center (~5 px)
- The ornament "faces left" — focal star on the right end (closer to title text), trailing constellation extends left
- All ornament vertically centered on the 80 px canvas height
- Color: royal gold #d4a017 with #f0c040 rim-light highlights, cyan jewel ONLY in the focal starburst center

Style:
- 1.5–2 px clean vector strokes, sharp angles
- Pointed gothic-cathedral feel — the lines have a faint engraved shadow
- Constellation lines are ELEGANT and SPARSE, not a continuous filigree

AVOID: round heraldic flowers, rope-twist borders, warm bronze tones, painterly wash,
flat vector cartoon style, white halo around gold edges, checkerboard background,
multiple cyan dots (only ONE jewel — at the focal star).

CONSTRAINTS:
- 240×80 PNG with proper alpha channel (true transparency)
- NO text, NO wordmarks, NO Ikaros bird
- Vertically centered, no clipping at edges, ~6 px transparent margin top and bottom
```

## 6. `nav-end-cap-r.png`

```
Generate the RIGHT-FACING version of the section-title end-cap.
Canvas 240×80 px, transparent background.

Composition is the HORIZONTAL MIRROR of nav-end-cap-l — a "fragment of a star chart" reading from right to left:
- RIGHT edge: tiny 4-point gold star (~6 px), faint
- Thin gold constellation line connects leftward
- MIDDLE: medium 4-point gold star (~10 px)
- Constellation line continues leftward
- LEFT side (focal): largest 8-point gold starburst (~22 px) with a single deep CYAN jewel at its center
- The ornament "faces right" — focal star on the LEFT end (closer to title text), trailing constellation extends right

All other rules identical to nav-end-cap-l (line craft, avoid list, alpha channel, margins).

NOTE: It is acceptable to mirror nav-end-cap-l in an editor (horizontal flip) instead
of generating from scratch — that guarantees a perfectly symmetric pair.
```

---

# C. ILUMINOVANÉ NAVIGAČNÍ IKONY (7 assetů)

Sada navigačních ikon ve sjednoceném stylu. **Bezel je gothic lancet (hrotnatý oblouk / cathedral window)** — vertikální, špičatý, ne kulatý. Tím se sada okamžitě vizuálně odliší od kulatých bezelů jiných skinů. Ikony budou v UI ~28 px, takže **čitelnost na malé velikosti je kritická** — piktogramy musí být silné a jednoduché.

**Sdílený rámec pro všech 7 ikon (zopakuj v každém promptu nebo nech AI držet styl ze SHARED STYLE GUIDE):**

> Each icon is a 256×256 PNG with proper alpha-channel transparency. Each pictogram is enclosed in a **GOTHIC LANCET BEZEL** — a tall vertical pointed-arch shape (cathedral-window silhouette), approx. 180 px tall × 120 px wide, centered on the canvas. Bezel = a 4–5 px clean royal gold stroke (#d4a017 base with #f0c040 rim-light highlights), describing the lancet outline (vertical sides curving inward at the top to a sharp central point). At the very TIP / apex of the lancet sits a single deep CYAN jewel (#19d6e8, ~10 px facet). At the bottom edge of the lancet, a tiny 3-point mini star-burst etching as a "base ornament." Inside the lancet shape sits a clean gold pictogram on transparent background. Sharp cosmic-cathedral style — narrow vertical proportions. Pictogram must remain legible at 28 px display size — strong silhouette, no thin spaghetti lines.
>
> AVOID (per icon): round bezel rings (lancet only), rope-twist borders, warm bronze, painterly wash, flat cartoon, multiple cyan jewels (only one — at the apex), text, lettering, wordmarks.

## 7. `home.png` (Úvodník)

```
[shared lancet bezel frame as above]

Pictogram: a STYLIZED PORTAL ARCH (a smaller lancet shape inside the bezel) with a single 8-point star floating in its center — symbolizing "the gateway into the realm." NOT a literal cathedral building; the cathedral motif belongs on the background, not duplicated here. Just an arch silhouette + a star inside. Symmetrical, vertical.

CONSTRAINTS:
- 256×256 PNG with proper alpha transparency
- Gothic lancet bezel (NOT a circle), single cyan jewel at the apex
- Pictogram readable at 28 px — strong silhouette
- AVOID: literal cathedral building, brick textures, warm bronze, blue sky tones
- Cold royal gold + single cyan jewel only
```

## 8. `plus-star.png` (Vytvořit svět)

```
[shared lancet bezel frame as above]

Pictogram: a LARGE 8-POINT GOLD STARBURST centered inside the lancet, with a clean gold PLUS (+) symbol overlaid at its very center. The plus uses slightly thicker strokes than the star rays so it reads clearly at small sizes. The star rays alternate long/short for a "compass-rose" feel rather than uniform spokes. Symbol of "create a new world."

CONSTRAINTS: 256×256 PNG, alpha transparent, gothic lancet bezel + cyan jewel at apex, alternating long/short rays, gold + cyan only.
```

## 9. `scroll.png` (Diskuze)

```
[shared lancet bezel frame as above]

Pictogram: an open ornamental SCROLL (vertical parchment), both ends rolled — but the scroll body shows a tiny CONSTELLATION (3 small 4-point stars connected by a thin gold line) instead of text or seal. Reads as a "celestial dispatch." The scroll is shown frontally, vertical orientation, fitting the lancet shape.

CONSTRAINTS: 256×256 PNG, alpha transparent, gothic lancet bezel + cyan jewel at apex, gold + cyan only. NO actual letters or runes — only the 3-star constellation pattern.
```

## 10. `book.png` (Články)

```
[shared lancet bezel frame as above]

Pictogram: an OPEN BOOK shown frontally inside the lancet, two pages visible. Each page bears a tiny CONSTELLATION (2–3 small 4-point stars connected by a thin gold line) instead of text — pages are "celestial maps." A larger 4-point star hovers just above the spine between the pages. Clean gold linework, strong silhouette of the book.

CONSTRAINTS: 256×256 PNG, alpha transparent, gothic lancet bezel + cyan jewel at apex, gold + cyan only. NO text on the pages — only constellation patterns.
```

## 11. `portraite-frame.png` (Galerie)

```
[shared lancet bezel frame as above]

Pictogram: a SMALL LANCET-SHAPED PICTURE FRAME (mini cathedral-window) inside the bezel — i.e., echoing the bezel shape inward. The frame edge has the same pointed-gothic filigree as the skin. Inside the inner lancet, ONE 4-point gold star as "the portrait." Reads as "gallery / illuminated portraits."

CONSTRAINTS: 256×256 PNG, alpha transparent, gothic lancet bezel + cyan jewel at apex, inner pictogram is itself a smaller lancet shape, gold + cyan only.
```

## 12. `compass.png` (Nápověda)

```
[shared lancet bezel frame as above]

Pictogram: a STYLIZED COMPASS ROSE — four cardinal points (N/E/S/W) with the NORTH arm visibly elongated and topped with a small 4-point gold star. Between the cardinal arms sit four shorter intercardinal rays (NE/SE/SW/NW) — half the length, no star. Symmetric, "guiding star" feel. Symbol of "guidance / help."

NOTE: This is a SIMPLE compass star — NOT a full astrolabe with rings, NOT a planisphere. Just a clean directional rose with an emphasized north-star.

CONSTRAINTS: 256×256 PNG, alpha transparent, gothic lancet bezel + cyan jewel at apex, gold + cyan only. NO concentric rings, NO numbered scales.
```

## 13. `beer.png` (Dimenzionální hospoda)

```
[shared lancet bezel frame as above]

Pictogram: an ornamental GOTHIC GRAIL / CHALICE (cosmic-luxurious, NOT a foamy beer mug) shown frontally inside the lancet — slim stem, wide cup, pointed-gothic etching on the cup body. Above the rim, a single small 4-point gold star as a "celestial offering" (replacing the typical foam head). Strong silhouette, reads at 28 px.

NOTE: filename is `beer.png` (matches the lucide-beer icon swap in CSS) but the visual is a gothic CHALICE / grail — NOT a literal beer tankard.

CONSTRAINTS: 256×256 PNG, alpha transparent, gothic lancet bezel + cyan jewel at apex, gold + cyan only. NO foam, NO suds, NO rustic-medieval mug — gothic chalice silhouette only.
```

---

# D. WELCOME MEDALLION (1 asset)

Velký dekorativní medailon vlevo na welcome kartě (cca 240 px viditelně, ale generujeme ve vyšší kvalitě).

## 14. `andel-medallion.png`

```
Generate a large ornate MEDALLION featuring a stylized angelic figure in a cosmic portal.
Square canvas 512×512 px, transparent background.

Composition:
- Outer ring: an ornate gold bezel with sharp pointed-gothic filigree, four small CYAN jewels placed at 12, 3, 6 and 9 o'clock positions
- Inside the medallion: a stylized golden angelic figure (silhouette with wings extended), centered, set against a deep cosmic dark interior with subtle gold star-points scattered around
- The figure is rendered in gold linework / gold leaf style — graceful, vertical, hieratic — looking forward
- Subtle radial gold glow behind the figure, fading into the dark interior
- The whole medallion has the "cosmic royal portal" feel — austere, prestigious, slightly mystical
- Outer canvas (corners, outside the circular bezel) is fully transparent

CONSTRAINTS:
- 512×512 PNG, transparent background (alpha)
- NO text, NO wordmarks, NO Ikaros bird
- The angelic figure is original — NOT the Ikaros project bird
- Color: royal gold #d4a017 with #f0c040 highlights, deep obsidian black interior, four cyan jewels on the bezel
- NO warm bronze, NO orange, NO blue/navy backdrops
- Sharp pointed-gothic filigree on the bezel, NOT round heraldic flowers
- The figure must remain recognizable when scaled to 240 px display size
```

---

# Co dál

Až budeš mít všech **14 PNG** v `assets-source/themes/zlaty-standard/`:

1. Spusť `npm run themes:optimize` — vygeneruje optimalizované WEBP do `public/themes/zlaty-standard/decor/`.
2. Dej vědět — sepíšu detailní implementační plán pro `index.ts` + `decorations.css` (přesné proměnné, scoped CSS, responzivita).
3. Po odsouhlasení plán implementuji.

Pokud některý asset nedopadne (nejde mu styl, nesedí kompozice), klidně mi pošli o něj zpětnou vazbu a upravím prompt.
