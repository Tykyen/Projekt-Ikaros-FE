# Arabský svět — asset prompty

Prompty pro **14 nových AI assetů** skinu *Arabský svět* (logo + medailon + background = už dodané uživatelem).

**Cíl:** Bagdádsko-perský noční palác — sultánův harém, mašrabíja, mukarnasy, mosazné lucerny, hedvábí, vodní dýmka, mosazná dallah, perské koberce, multifoil mauresque ornamenty se zlatem a drahokamy, růžové okvětní lístky. **NE** Disney Aladdin kreslený styl, **NE** Marrákeš turistická pohlednice (sluneční dvůr), **NE** Alhambra denní vápencová, **NE** generický „orient z AI generátoru" (povrchní arabské cliché), **NE** africké sandstone savana (samostatný skin `africke`).

**Generátor:** ChatGPT (DALL-E 3 / GPT-image) — preferred. Alternativy: Midjourney v6.1, Flux. Output: **PNG s alfa-kanálem** (vyjma `rose-petals-scatter` který může mít částečnou alpha), pak konverze `cwebp -q 90 -alpha_q 100`.

**Reference dodaných materiálů:**
- Logo: [`../../../../assets-source/themes/arabsky-svet/logo.png`](../../../../assets-source/themes/arabsky-svet/logo.png) — horizontální banner z **tmavého ořechového dřeva s multifoil mauresque borderem**, vlevo kulatý medailon s andělím křídlem, vpravo „Projekt Ikaros" v elegantním script fontu, zlato-mosazné ornamenty s **vsazenými drahokamy (rubíny, smaragdy, tyrkysy)**, multi-point hvězdové rohové ornamenty
- Medailon: [`../../../../assets-source/themes/arabsky-svet/medailon.png`](../../../../assets-source/themes/arabsky-svet/medailon.png) — čtvercový rám z **tmavého ořechového dřeva s multifoil (čtyřlistovým) okenním rámem**, zlato-mosazné rohové ornamenty s drahokamy, ažurová geometric mřížka uvnitř, velký cream anděl-křídlo silhouette uprostřed
- Background: [`../../../../assets-source/themes/arabsky-svet/background.png`](../../../../assets-source/themes/arabsky-svet/background.png) — noční palácová scenérie: tyrkysová báň + minarety + krescent + Plejády za soumrakem, mašrabíja rám okolo výhledu, bordó-vínové sametové závěsy po stranách, perské koberce v popředí, mosazné lucerny visící z horních rohů + brass narghile/dallah v dolních rozích, palmy date palm po stranách

**Všechny prompty musí respektovat tyto materiály — stejná paleta dark walnut + multifoil gold + ruby/emerald/turquoise gems + midnight indigo + saffron + pearl ivory + smoke gray + damask rose, stejný „carved patinated brass" styl s vsazenými drahokamy.**

---

## 🎨 STYLE GUIDE (závazné pro všech 14 assetů)

### Reference look

**Inspirace:**
- *Edmund Dulac* iluminace 1001 nocí (zlaté margínalie + sapfír + tyrkys + cinober)
- *Léon Bakst* kostýmní design Ballet Russes (Šeherezáda 1910, smyslnost, hedvábí, zlato)
- Isfahan Šejk Lutfollah mešity (zlato-tyrkysová báň, perská mosaika)
- Topkapi Saray paláce (perforované mašrabíja, mukarnasy, multifoil oblouky)
- Damascus mosaika a inlay (zellige + mother-of-pearl + brass tarsia)
- Perské miniatury (margínalie, drobné figurky, zlato leaf, lapis lazuli)
- *The Thief of Bagdad* (1940) art direction
- *Lawrence of Arabia* (1962) cinematic night shots
- Cairo Mamluk metalwork (gravierovaná mosaz, inlay)

Cíl: **smyslná atmosféra sultánova harému v 1001 nocích**, ručně tepaná texturová hloubka, **NE** plochá vector ilustrace, **NE** Disney Aladdin kreslený styl, **NE** vector clip-art, **NE** flat material design.

### NE absolutně:

- ❌ Disney Aladdin (1992) kreslený styl, kulaté tváře, comic outline
- ❌ Marrákeš/Maroko denní sluneční dvůr (riad terakota + olivová zeleň — to je vlastní skin)
- ❌ Alhambra vápencově bílá + chladná denní (jiný typ orient)
- ❌ Mughal Tádž bílý mramor + růžové květy (Indo-Islamic, ne arabský)
- ❌ Pseudoarabská písmena říkající nesmysl (autentická kaligrafie OK ale jen reálné znaky, jinak žádná text)
- ❌ Africké sandstone + savana + adinkra symboly (samostatný skin `africke`)
- ❌ Indiánské tribal cik-cak diamondy + iron-nail studs (samostatný skin `indiane`)
- ❌ Severské oak + ice + wolfshield (samostatný skin `severske-runy`)
- ❌ Hospodská česká heraldika + krčmářský papír (samostatný skin `hospoda`)
- ❌ Pyramidové motivy / egyptské hieroglyfy (jiná kultura)
- ❌ Vector flat ikony / Material Design styling
- ❌ Plastic gloss / chrome reflexe / neon glow / cyberpunk
- ❌ Pure black background uvnitř ornamentů — vždy tmavá ořechové dřevo nebo midnight-indigo textura
- ❌ Bílá kontura kolem objektů
- ❌ Politicky necitlivá karikatura, žádné stereotypní pseudo-arabská písmena
- ❌ Explicitní lidské postavy (žádné konkubíny, žádné tanečnice — sensualita pouze přes objekty)
- ❌ AI-typický „purple gradient sunset" — palace background je už dodaný, ornamenty mají autentické paleta
- ❌ Generický „lampa s kouřem" hookah cliché — buď autentická perská/turecká narghile (vodní dýmka s vázou) nebo dallah (konvice s vysokým hrdlem)

### Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| **Midnight night** | `#0a0e2c` | nejhlubší noc, hluboké stíny |
| **Midnight indigo** | `#0e1a3a` | hlavní panel BG tón, noční obloha |
| **Velvet bordo** | `#5a1828` → `#7a1828` | sametové závěsy, polštáře (z BG) |
| **Damask rose** | `#c8385a` | okvětní lístky růží, ruby crystals |
| **Saffron gold** | `#e8b040` | šafránové zlato, accent flames |
| **Polished gold** | `#e8c060` | leštěné zlato, jiskra ornamentů |
| **Patinated gold** | `#a87830` | patinované zlato, ryté detaily, borders |
| **Dark walnut wood** | `#1a0a08` → `#2a1408` | tmavé ořechové dřevo (rámy logo + medailon) |
| **Brass deep** | `#5a3210` | tmavý mosaz patina |
| **Brass warm** | `#b87830` | hlavní mosaz lucerny + dallah |
| **Brass bright** | `#d49850` | top reflex mosazi, hover stavy |
| **Turquoise mistus** | `#1a8a8a` → `#2ac4c4` | tyrkysové kachle, headlines, báň |
| **Royal purple** | `#4a1850` | rare luxus accent |
| **Ruby crystal** | `#a8283c` | vsazené rubíny v ornamentech |
| **Emerald jewel** | `#1a6a4a` | vsazené smaragdy v ornamentech |
| **Pearl ivory** | `#f0e4c8` | krémový ivory, cream silhouette, text na tmavém |
| **Smoke gray** | `#3a3548` | kouř ribbon z narghile, transparent fade |

### Materiály — jak je popsat v promptu

**Multifoil mauresque gold s vsazenými drahokamy (corner ornaments, frame highlights):**
> *"hand-cast mauresque multifoil ornament in patinated gold (#a87830 base with #d49850 top-left rim-light highlights), featuring inset gemstones: small faceted ruby crystals (#a8283c with bright #d8485c facet highlights), emerald jewels (#1a6a4a with #2a8a6a facets), and tiny turquoise cabochons (#1a8a8a). Multi-point star geometry with 8 lobed petals around a central foil, slight hand-tooled engraving in recesses, NO mirror polish, NO modern chrome finish. Authentic Damascus/Cairo Mamluk metalwork style 13th-15th century. Subtle wear on prominent edges."*

**Mosaz lucerny + dallah + narghile (brass props):**
> *"hand-tepaná mosazná surface with warm brass tones (#b87830 base with #d49850 highlights and #5a3210 deep shadows), engraved/punched perforations forming geometric girih patterns, slight verdigris patina in recesses, NO modern aluminum, NO chrome, authentic Persian/Ottoman 17th-18th century brass craft. Visible hammer-tooled texture, slight asymmetric imperfections suggesting hand-craft."*

**Carved relief (engraved into wood/brass):**
> *"shallow-relief engraving carved into the surface, lines slightly darker than surrounding material (etched recess), tool-marked edges, hand-carved appearance with subtle imperfections, NOT laser-cut, NOT precise machine work"*

**Mukarnas voštinová stalaktitová struktura:**
> *"authentic Islamic mukarnas (muqarnas) honeycomb stalactite cornice: tiered geometric brass corbels descending in stepped formation, each tier offset 30 degrees, individual cells with 5-sided or 8-sided geometric facets, hand-hammered brass surface with #b87830 base color, #d49850 top-light highlights, #5a3210 shadow recesses, traditional Seljuk/Mamluk architectural ornament style, NOT generic „spike pattern", authentic stepped vault construction"*

**Mašrabíja girih perforated pattern (vidí z BG, nebudeme generovat overlay):**
> *(Pouze pro reference — BG už má baked-in mašrabíja rám. Nebudeme generovat overlay asset.)*

**Persian carpet pattern (carpet-strip):**
> *"authentic Persian carpet/kilim narrow horizontal strip edge pattern: hand-knotted wool weave in deep wine-red (#7a1828 base) and burgundy (#5a1828) ground, with traditional Persian motifs in saffron-gold (#e8b040), turquoise (#1a8a8a), and ivory (#f0e4c8) — featuring repeating geometric medallions, boteh (paisley) shapes, simplified mihrab niches along the border. Slight irregularity in knot density suggesting hand-craft, NO machine repetition, authentic Tabriz/Isfahan style 19th century"*

**Rose petals damask (rose-petals-scatter):**
> *"scattered damask rose petals (Rosa damascena) — individual fallen petals in soft organic shapes, deep damask rose color (#c8385a base with #a8283c shadow and #d85878 light highlights), each petal slightly curled, irregular sizes from 8-20px, scattered organically with NO grid pattern, light cast suggesting top-left rim-light, slightly translucent edges, faint shadow underneath suggesting they rest on a surface, authentic botanical accuracy NOT cartoon roses"*

**Mosazná lampa génia (genie-lamp):**
> *"hanging brass genie lamp (Aladdin-style oil lamp) viewed from a slight three-quarter angle, polished brass surface (#b87830 base, #d49850 highlights, #5a3210 shadows) with engraved geometric girih patterns and slight verdigris in recesses, characteristic teardrop/almond body shape, narrow tall spout on the left side, decorative handle on the right (curved), small chain attached at the top connecting to a single ring, slight wear suggesting age, authentic Persian/Ottoman 18th century craft, NOT cartoon Disney version, NOT plastic toy"*

**Caustic glow (light pattern):**
> *"radiating warm light pattern on a surface (as if cast by an oil lamp through perforated brass), soft golden radial gradient with multiple small bright pinpoint spots scattered in the central area (light coming through punched holes), gradient from intense warm gold (#e8c060) in the center fading to transparent edges, slight irregularity suggesting hand-cast unevenness, NOT a perfect radial — organic with subtle warmth variation"*

### Světelný úhel

**Top-left rim-light** (jednotný se všemi ostatními skiny). Ne front-lit, ne flat. Mírný stín na bottom-right pro hloubku. Lucerny mají interní warm glow z perforací.

### Pozadí výstupu

**Transparentní PNG s alfa.** Při generování v ChatGPT zadávat *„fully transparent background, isolated object/element, no scene context, no ground plane"*. Výjimka: `rose-petals-scatter` může mít subtle ground shadow pro pocit „lístky leží na koberci".

---

## 📦 ASSET BALÍČEK — 14 promptů

### 1️⃣ `corner-tl.webp` — Multifoil zlato-mosazný ornament s drahokamy

**Rozměry:** 256×256 px (čtverec)
**Pozice v UI:** master pro top-left roh panelů (sidebary, novinky, welcome card). Mirror přes CSS `scaleX/Y` na ostatní 3 rohy.
**Reference:** levý-horní roh dodaného `medailon.png` — **přesně tento styl, žádná improvizace.**

**Prompt (EN):**
> Square corner ornament, top-left orientation, on fully transparent background. Hand-cast mauresque multifoil L-shaped corner piece in patinated gold-brass tones (#a87830 base with #d49850 top-left rim-light highlights, #5a3210 deep shadow recesses). The ornament features an 8-pointed star (girih khatam) at its outer corner, with three lobed petals (multifoil/quatrefoil leaves) radiating along each inner edge. At the center of the 8-pointed star: a single faceted ruby crystal (#a8283c with bright #d8485c facet highlights). Smaller inset gemstones distributed along the multifoil petals: 2-3 emerald jewels (#1a6a4a with #2a8a6a facets) and 2-3 turquoise cabochons (#1a8a8a). Surface shows hand-tooled engraving with subtle hammer marks, slight verdigris patina in recesses. NO mirror polish, NO modern chrome. Authentic Damascus/Cairo Mamluk metalwork style 13th-15th century. Slight wear on prominent edges. Isolated object on fully transparent background, no shadow on ground, no scene context. 256×256 pixels.

---

### 2️⃣ `mukarnas-cornice.webp` — Mukarnasová římsa horizontální

**Rozměry:** 1920×80 px (široký horizontal, voštinová stalaktitová struktura)
**Pozice v UI:** pod horní hranou topbaru (statická, opacity 0.85 desktop / 0.70 mobile).

**Prompt (EN):**
> Wide horizontal architectural mukarnas (muqarnas) cornice viewed from below, 1920×80 pixels, on fully transparent background. The cornice consists of a repeating honeycomb stalactite pattern — 3 horizontal tiers of geometric brass corbels descending in stepped formation. Each tier contains individual cells with 5-sided or 8-sided geometric facets, offset 30 degrees from the tier above. The structure hangs down from the top edge, with the lowest points reaching 80px height. Material: hand-hammered patinated brass (#b87830 base, #d49850 top-light highlights catching the upper rim of each cell, #5a3210 deep shadow recesses inside each honeycomb cavity). Subtle verdigris in the deepest shadows suggests age. Authentic Seljuk/Mamluk architectural ornament style, NOT generic „spike pattern", NOT cartoon stalactites, NOT plastic. Each cell shows slight hand-craft asymmetry. The bottom edge of each cell catches a faint warm rim-light suggesting downward light. Isolated cornice on fully transparent background, no scene context. 1920×80 pixels.

---

### 3️⃣ `narghile-smoke.webp` — Vertikální vlnitý kouř z vodní dýmky

**Rozměry:** 180×800 px (vertikální, ribbon kouře)
**Pozice v UI:** fixed v pravém dolním rohu viewportu (stoupá nahoru, 8s ease-in-out animace, opacity 0.45).

**Prompt (EN):**
> Vertical wavy smoke ribbon rising upward, 180×800 pixels, on fully transparent background. The smoke is a single organic ribbon emerging from the bottom of the frame, undulating gently as it rises (3-4 gentle S-curves over the full height). Smoke color is cool smoke-gray (#3a3548 base, #5a5868 highlights where light catches the wisps, #1a1828 deepest shadows in the folds). The ribbon starts thicker at the bottom (~80px wide), gradually narrowing and becoming more translucent toward the top (~30px wide at the top edge, ~50% opacity). The top edge fades to fully transparent — the smoke dissipates. Wispy edges show diffusion. NO straight lines, NO geometric — fully organic flowing form like real smoke from incense/water-pipe tobacco. Slight asymmetry in the wave pattern. Subtle internal structure visible (lighter and darker bands suggesting volume). NOT a perfect column — natural irregularity. Isolated smoke ribbon on fully transparent background, no source object, no scene context. 180×800 pixels.

---

### 4️⃣ `genie-lamp.webp` — Visící mosazná lampa génia (Aladdin-style)

**Rozměry:** 180×320 px (vertikální, lampa s řetězem nahoře)
**Pozice v UI:** absolute v pravém horním rohu hlavního panelu, sway animation 14s, mikro-puff kouře 8s.

**Prompt (EN):**
> A hanging brass oil lamp (classic Aladdin-style genie lamp), 180×320 pixels, viewed from a slight three-quarter angle, on fully transparent background. The lamp body is teardrop/almond shaped, polished patinated brass (#b87830 base, #d49850 top-left rim-light highlights, #5a3210 deep shadows in recesses). Surface engraved with shallow-relief geometric girih patterns (8-pointed stars and intersecting lines) covering the body. A narrow tall spout extends from the left side of the body curving slightly upward — the wick opening visible at the spout tip. A decorative curved handle on the right side. A small chain (3-4 visible links) attached at the top center, leading upward to a single small mounting ring at the very top of the frame. Slight verdigris patina in the deepest engraved recesses suggests age. Authentic Persian/Ottoman 18th century brass craft style, NOT Disney cartoon, NOT plastic toy, NOT modern reproduction. Subtle wear on prominent edges. Isolated lamp on fully transparent background, the chain extends to the top of the frame, no scene context, no ground shadow (it's hanging). 180×320 pixels.

---

### 5️⃣ `caustic-glow.webp` — Caustic světelná skvrna pod lampou

**Rozměry:** 400×500 px (organic radial)
**Pozice v UI:** pod genie lampou v pravém horním rohu hlavního panelu, breathe animation 4s.

**Prompt (EN):**
> Radiating warm caustic light pattern as if cast on a surface by an oil lamp through perforated brass shade, 400×500 pixels, on fully transparent background. The light forms a soft elongated patch — wider at the top (where light source would be) narrowing slightly toward the bottom. Center: intense warm gold glow (#e8c060 at peak intensity, fading to #e8b040 at 50% opacity, then to fully transparent at the edges). Scattered throughout the central glow area: 8-12 small bright pinpoint spots where light passes through individual perforations — each spot is sharper than the surrounding diffuse glow, slightly brighter (#f0d880 cores). The shape is NOT a perfect circle — organic with subtle warmth variation, suggesting hand-cast unevenness in the lamp perforations. Edges fade smoothly to fully transparent. NO hard outline, NO geometric shape — pure organic light gradient with scattered hotspots. Isolated on fully transparent background, no source object visible, no surface texture. 400×500 pixels.

---

### 6️⃣ `carpet-strip.webp` — Perský koberec horizontal pásek

**Rozměry:** 1200×60 px (široký horizontal, low-profile)
**Pozice v UI:** dolní hrana welcome card (perský koberec strip).

**Prompt (EN):**
> Wide narrow horizontal Persian carpet border strip, 1200×60 pixels, on fully transparent background. The strip is a hand-knotted wool kilim/Persian rug edge pattern — deep wine-red ground (#7a1828 base with #5a1828 shadows in the weave depths). Pattern foreground: a continuous horizontal repeat of traditional Persian motifs woven in saffron-gold (#e8b040), turquoise (#1a8a8a), and ivory (#f0e4c8) — featuring a sequence of: repeating small geometric medallions (octagonal stars), boteh (paisley) shapes alternating direction, simplified mihrab niche silhouettes along the upper edge, narrow geometric stripes framing the top and bottom. The pattern flows naturally left-to-right without exact mathematical repetition (hand-knotted asymmetry, slight imperfections in line thickness, occasional knot variation). NO perfect symmetry, NO digital precision. Slightly worn appearance suggesting traditional craft. Authentic Tabriz/Isfahan/Kashan style 19th century, NOT Maori, NOT Aztec, NOT generic „tribal pattern". Isolated horizontal carpet strip on fully transparent background, no ground shadow. 1200×60 pixels.

---

### 7️⃣ `icon-uvodnik.webp` — Otevřený iluminovaný manuskript (Šeherezádin svitek)

**Rozměry:** 96×96 px (square, ornament medallion)
**Pozice v UI:** nav item „Úvodník".

**Prompt (EN):**
> Small square ornament medallion, 96×96 pixels, on fully transparent background. The medallion is a slightly weathered square plaque of dark walnut wood (#2a1408 base with #4a2818 grain highlights) with subtly rounded corners and a thin gold (#a87830) inner border frame (~3px). Inside the frame: an open illuminated manuscript viewed from above — two facing pages of cream parchment (#f0e4c8) with slight age-yellowing. The left page shows three lines of decorative pseudo-calligraphic ornament (NOT real text — just abstract decorative flourishes in patinated gold ink #a87830). The right page shows a small illuminated initial letter „V" in damask rose (#c8385a) surrounded by tiny gold leaf flourishes, followed by two more lines of pseudo-calligraphic ornament. The pages have a subtle gold leaf edge at the top corners. The book spine in the center is dark brown leather (#3a1a08) with a single thin gold band. NO real Arabic text (only abstract calligraphic flourishes that suggest writing without forming actual letters). Authentic illuminated manuscript style 15th century Persian/Mamluk, NOT cartoon book, NOT modern paperback. Top-left rim-light catches the top edges of the pages. Isolated medallion on fully transparent background, subtle 1px drop shadow on bottom-right edge of medallion. 96×96 pixels.

---

### 8️⃣ `icon-vytvorit-svet.webp` — Husí brk na hedvábném polštáři

**Rozměry:** 96×96 px
**Pozice v UI:** nav item „Vytvořit svět".

**Prompt (EN):**
> Small square ornament medallion, 96×96 pixels, on fully transparent background. The medallion is dark walnut wood (#2a1408 base) with thin gold inner border (~3px). Inside: a single goose quill pen lying diagonally across a small embroidered silk cushion. The pillow: deep velvet bordo color (#5a1828 base with #7a1828 highlights), gold-thread embroidered geometric pattern visible on the surface (girih star motif in saffron gold #e8b040), gold tassels at the visible corner. The quill: cream-white feather (#f0e4c8 base with #d4c898 darker veins along the spine) angled from upper-left to lower-right, with a polished brass nib (#d49850) at the lower-right tip catching the top-left light. A tiny inkblot of dark ink (#1a0a08) on the cushion near the nib (suggesting recent writing). Authentic Persian/Ottoman scribal style 17th century. NO modern fountain pen, NO ballpoint, NO cartoon quill. Top-left rim-light. Isolated medallion on fully transparent background, subtle 1px drop shadow on bottom-right edge of medallion. 96×96 pixels.

---

### 9️⃣ `icon-diskuze.webp` — Dallah konvice s párou

**Rozměry:** 96×96 px
**Pozice v UI:** nav item „Diskuze".

**Prompt (EN):**
> Small square ornament medallion, 96×96 pixels, on fully transparent background. The medallion is dark walnut wood (#2a1408 base) with thin gold inner border (~3px). Inside: a single brass Arabian coffee pot (dallah) viewed in profile from the side. The dallah has the characteristic shape: a curved tall narrow body, narrow at the base, slightly widening then narrowing toward the top with a tall arched curved spout extending forward (left), a curved handle on the right side, and a domed lid with a finial at the top. Material: polished patinated brass (#b87830 base, #d49850 top-left highlights catching the curve, #5a3210 shadows on the back curve). Engraved shallow-relief geometric girih pattern (small 6-pointed stars) decorates the body. From the top finial: 3-4 wispy vertical lines of pale steam (smoke-gray #3a3548 fading to fully transparent at top) rising upward. Authentic Bedouin/Saudi/Yemeni dallah style, NOT Western teapot, NOT cartoon. Top-left rim-light. Isolated medallion on fully transparent background, subtle 1px drop shadow on bottom-right edge of medallion. 96×96 pixels.

---

### 🔟 `icon-clanky.webp` — Svinutý svitek se sultánskou tugrou pečetidlem

**Rozměry:** 96×96 px
**Pozice v UI:** nav item „Články".

**Prompt (EN):**
> Small square ornament medallion, 96×96 pixels, on fully transparent background. The medallion is dark walnut wood (#2a1408 base) with thin gold inner border (~3px). Inside: a partially rolled cream parchment scroll lying diagonally (upper-left to lower-right). The parchment is age-cream (#f0e4c8 with subtle #d4c898 weathering streaks), the visible flat portion at the center shows three lines of abstract calligraphic flourishes (patinated gold ink #a87830, decorative pseudo-script — NOT real Arabic letters). The right end of the scroll is rolled up. The left end of the scroll is held closed by a wax seal: a round dark crimson wax disc (#7a1828) with a stamped sultanic tugra-like swirl motif (gold ink #e8b040, abstract decorative swirl suggesting calligraphy without forming real letters). A narrow gold ribbon (#e8b040) wraps around the seal. NO real text. Authentic Ottoman/Mamluk sultanic decree style 16th century. Top-left rim-light. Isolated medallion on fully transparent background, subtle 1px drop shadow on bottom-right edge of medallion. 96×96 pixels.

---

### 1️⃣1️⃣ `icon-galerie.webp` — Perská miniatura v multifoil rámu

**Rozměry:** 96×96 px
**Pozice v UI:** nav item „Galerie".

**Prompt (EN):**
> Small square ornament medallion, 96×96 pixels, on fully transparent background. The medallion is dark walnut wood (#2a1408 base) with thin gold inner border (~3px). Inside: a small Persian miniature painting in a multifoil (4-lobed quatrefoil) frame. The frame: polished gold (#a87830 with #d49850 highlights and 4 tiny ruby cabochons #a8283c at the lobe tips). The miniature interior depicts an abstract garden scene at twilight — a small turquoise (#1a8a8a) cypress tree silhouette on the left, a curve of indigo sky (#0e1a3a) above, a small saffron-gold sun-disk (#e8b040) at the upper right setting behind a stylized minaret silhouette (#2a1408), and a thin gold horizontal band at the bottom representing earth. The miniature style is naive-illuminated, with bold flat color planes (NO realistic shading), authentic Persian Safavid period 16th-17th century miniature painting style, NOT photo-realistic, NOT cartoon. Top-left rim-light catches the gold frame's outer edge. Isolated medallion on fully transparent background, subtle 1px drop shadow on bottom-right edge of medallion. 96×96 pixels.

---

### 1️⃣2️⃣ `icon-napoveda.webp` — Olejová lampa génia (Aladdin-style mini)

**Rozměry:** 96×96 px
**Pozice v UI:** nav item „Nápověda".

**Prompt (EN):**
> Small square ornament medallion, 96×96 pixels, on fully transparent background. The medallion is dark walnut wood (#2a1408 base) with thin gold inner border (~3px). Inside: a small Aladdin-style genie oil lamp viewed in profile from the side (resting on an implied surface). The lamp body is teardrop/almond shaped, polished patinated brass (#b87830 base, #d49850 top-left rim-light highlights, #5a3210 shadows). A narrow tall spout extends from the left side curving slightly upward — the wick opening visible at the spout tip. A decorative curved handle on the right side. Surface has shallow-relief geometric girih engraving (small 8-pointed stars). From the spout tip: a tiny wisp of warm flame (#e8b040 fading to #f0c060 at the tip) — suggesting the lamp is lit. Authentic Persian 18th century brass lamp style, NOT Disney cartoon Genie lamp, NOT plastic toy. Top-left rim-light. Isolated medallion on fully transparent background, subtle 1px drop shadow on bottom-right edge of medallion. 96×96 pixels.

---

### 1️⃣3️⃣ `icon-hospoda.webp` — Vodní dýmka (narghile)

**Rozměry:** 96×96 px
**Pozice v UI:** nav item „Dimenzionální hospoda" (zde re-interpretované jako orientální kuřácký salon).

**Prompt (EN):**
> Small square ornament medallion, 96×96 pixels, on fully transparent background. The medallion is dark walnut wood (#2a1408 base) with thin gold inner border (~3px). Inside: a traditional Middle Eastern water-pipe (narghile / hookah / shisha) viewed in profile from the side. The narghile structure (bottom to top): a large bulbous glass vase at the base (clear-blue tinted glass #1a8a8a with reflections, half-filled with translucent water), a slender brass column rising from the center of the vase (#b87830 with #d49850 highlights), a brass bowl at the top of the column (clay tobacco bowl), with a small flat brass charcoal plate above the bowl. A single ornate decorated flexible hose (woven fabric pattern in damask rose #c8385a and gold #e8b040, embroidered) extends from the mid-column down to the lower-right corner of the medallion, ending in a small brass mouthpiece. From the top of the tobacco bowl: a thin wisp of smoke (smoke-gray #3a3548) rising upward. Authentic Turkish/Egyptian/Persian narghile style 19th century, NOT modern shisha bar, NOT cartoon. Top-left rim-light. Isolated medallion on fully transparent background, subtle 1px drop shadow on bottom-right edge of medallion. 96×96 pixels.

---

### 1️⃣4️⃣ `rose-petals-scatter.webp` — Scattered damask rose petals (welcome card BG layer)

**Rozměry:** 800×400 px (horizontal, scattered organic layout)
**Pozice v UI:** background layer welcome card (opacity 0.18, position center-bottom), subtle decoration suggesting petals fell on the floor.

**Prompt (EN):**
> Horizontal layout of scattered damask rose (Rosa damascena) petals on fully transparent background, 800×400 pixels. 18-25 individual fallen rose petals scattered organically across the frame — no grid pattern, no perfect symmetry, just naturally fallen as if recently dropped. Each petal is a soft organic curved shape (NOT a cartoon heart shape — authentic botanical rose petal shape: slightly curled, with subtle vein lines, one edge gently waved). Petal colors vary: most in deep damask rose (#c8385a base with #a8283c shadow folds and #d85878 light highlights on raised areas), a few slightly darker burgundy (#7a1828), occasional lighter pink edges. Petals overlap softly in places (suggesting depth — some on top of others). Sizes vary from 12-30px length. Each petal has a faint soft shadow underneath (subtle, #2a0a18 at 25% opacity) suggesting they rest on an implied surface. Slight light cast from upper-left suggests top-left rim-light. NO stems, NO whole roses, NO leaves — only individual fallen petals. NO cartoon outline, NO flat color — soft botanical realism with subtle vein detail. NOT confetti-pink, NOT Valentine's cartoon pink — authentic dark damask rose color. Fully transparent background between/around petals, no ground texture, no solid background. 800×400 pixels.

---

## 🎯 Konzistenční check (před odevzdáním všech 14 assetů)

Před odevzdáním zkontroluj že **všech 14 assetů**:

1. ✅ Má **transparentní pozadí** (alfa-kanál) — vyjma `rose-petals-scatter` který může mít subtle ground shadow
2. ✅ Používá pouze **schválenou paletu** (sekce „Barevná paleta" výše) — žádné nové barvy
3. ✅ Má **top-left rim-light** (žádný front-lit flat look)
4. ✅ Nepoužívá **Disney cartoon styl**, **flat vector**, **chrome polish**, **neon glow**
5. ✅ Nepoužívá **pseudoarabská písmena** říkající nesmysl (pouze abstraktní decorativní flourishes nebo zcela bez textu)
6. ✅ Drží **autentický Persian/Ottoman/Mamluk style** (NE Marrákeš, NE Alhambra denní, NE Mughal, NE africký, NE indiánský)
7. ✅ Mosaz má **patinovaný vzhled** s hand-tool hammer marks (NE moderní polish)
8. ✅ Dřevo je **tmavé ořechové** (#1a0a08–#2a1408) — NE pískovec, NE světlý dub
9. ✅ Drahokamy jsou **vsazené v zlato-mosazi** s facetami (NE flat solid color)
10. ✅ Žádné explicitní lidské postavy (sensualita pouze přes objekty)

Po dokončení uložit do `assets-source/themes/arabsky-svet/` (PNG s alpha) a spustit konvert pipeline → `public/themes/arabsky-svet/decor/*.webp`.

---

## 🔄 Konvert pipeline (po dodání všech PNG)

```bash
# Pro každý asset: PNG → WEBP kvalita 90, alpha 100
cwebp -q 90 -alpha_q 100 assets-source/themes/arabsky-svet/corner-tl.png \
       -o public/themes/arabsky-svet/decor/corner-tl.webp

# Background může mít vyšší kompresi (větší soubor):
cwebp -q 82 assets-source/themes/arabsky-svet/background.png \
       -o public/themes/backgrounds/arabsky-svet.webp

# Logo a medailon (už dodány):
cwebp -q 92 -alpha_q 100 assets-source/themes/arabsky-svet/logo.png \
       -o public/themes/arabsky-svet/decor/logo.webp
cwebp -q 92 -alpha_q 100 assets-source/themes/arabsky-svet/medailon.png \
       -o public/themes/arabsky-svet/decor/medailon.webp
```

Skript `scripts/finalize-arabsky-svet-assets.mjs` udělá toto všechno najednou — bude vytvořen v impl. fázi.

---

**Status:** ⏳ Čeká na dodání 14 AI gen PNG souborů od uživatele.
**Po dodání:** konvert → `decorations.css` + `index.ts` implementace (`plan-1.0r.md`).
