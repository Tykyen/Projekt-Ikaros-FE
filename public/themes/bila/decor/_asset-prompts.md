# Bílá skin — asset prompty

Prompty pro **10 assetů** bílého skinu (image 2 reference: ozdobné stuhy + krystaly + ivory mramor).

**Styl skinu:** éterická mramorová síň — *ivory parchment / cream marble base + warm soft gold filigree borders + tiny light blue crystal jewels*. Vše transparentní, izolované, bez stínů, bez textu.

**Generátor:** Midjourney v6.1 (preferred) nebo Flux/SDXL. Output: PNG s alfa, pak `cwebp -q 90 -alpha_q 100`.

---

## 🎨 STYLE GUIDE

Závazné pro všech 10 assetů. Nedodržení = inkonzistentní set, který bude působit „slátaný" vedle sebe.

### Reference look
Inspirace: **iluminované středověké rukopisy + art-nouveau filigree + elven cathedral** (Tolkien Rivendell, Mucha akcentové linie, Book of Kells corner ornaments). Cíl: aristokratická lehkost, ne těžký gotický kámen.

### Barevná paleta (přesné hex kódy)

| Role | Hex | Použití |
|---|---|---|
| **Ivory base** primary | `#fbf8f1` | hlavní plocha pergamenu/mramoru, světlejší partie |
| **Ivory base** secondary | `#f7f2e8` | drobné stínování pergamenu, hloubka |
| **Warm gold** filigree | `#c7b07a` | linky, vinety, scrollwork, rámy |
| **Warm gold** highlight | `#e8d4a4` | jiskry, krajní lesk na zlatu |
| **Warm gold** shade | `#a89058` | hlubší partie zlata, akcent v dolíku linky |
| **Light blue crystal** | `#9ed4ef` | krystalové drahokamy, čisté faseta |
| **Light blue accent** | `#4f88a8` | hlubší tóny v krystalech, linka kontur |
| **Pure white** sparkle | `#ffffff` | bod-jiskra na krystalu, hlavní reflex |

**Zakázané barvy:**
- ❌ syté žluté (zlato má být *měkké*, ne kanárkové)
- ❌ bronzové / měděné odstíny (jdou do oranžova → posun mimo skin)
- ❌ tyrkysová / cyan (krystaly jsou pale ice-blue, ne tropical)
- ❌ sytě modrá / cobalt (to je jiný skin — modré nebe)
- ❌ černá obrysová linka (vždy gold hairline místo black stroke)

### Materiály — jak je popsat v promptu

**Pergamen / mramor base:**
> *"ivory cream parchment surface (#fbf8f1), softly luminous, faint vellum texture, no harsh wrinkles"*
nebo
> *"polished cream marble (#fbf8f1), subtle veining, translucent quality"*

**Gold filigree:**
> *"warm soft gold (#c7b07a), hairline linework, delicate curling vines and acanthus scrollwork, art-nouveau style, NOT thick or heavy, NOT bronze, NOT yellow"*

**Light blue krystaly:**
> *"pale ice-blue faceted crystal jewel (#9ed4ef) with sharp diamond facets, white sparkle highlight (#ffffff) at the catch-light spot, soft inner glow, jewel-like clarity, NOT cyan, NOT teal, NOT cobalt"*

### Světlo & glow

- Hlavní světlo zleva-shora pod ~30° úhlem (subtle).
- **Krystaly emitují vlastní soft inner glow** → pale blue halo radius ~15% velikosti krystalu, fade to transparent.
- **Zlato má specular highlight** na nejvyšší linii každé linky, ne plochá výplň.
- **Žádný cast shadow** pod objektem. Žádný „ground" element.

### Kompozice — pravidla pro VŠECH 10

1. **Centrovaná kompozice** uvnitř canvasu (kromě page-frame-corner-tl, který je anchored top-left).
2. **Padding** = ~10% canvasu na každé straně (objekt nesmí dotýkat hran), výjimka = end-cap, který má 1 hranu „cut" (tam kde se napojuje).
3. **Pozadí: 100% transparent** (alfa = 0). Ne bílé, ne gradient, ne checker. Pure transparent.
4. **Bez stínu pod objektem.** Glow ano (pro krystaly), drop-shadow ne.
5. **Bez textu.** Žádné písmo, žádné runy, žádné latinkové znaky, ani „decorative letters". Hairlines suggesting text na scroll/book musí být *abstract horizontal lines*, ne písmena.
6. **Bez postavy / lidské figury.** Portrait frame je prázdný.
7. **Crisp vector-style edges**, ne airbrush ne painterly. Ikona musí zůstat čitelná i při downscale na 28×28 px.

### Konzistence napříč setem

Všech 10 assetů musí vypadat jako že jsou **z jedné dílny**:
- Stejná tloušťka gold linky napříč ikonami (~2-3% z výšky canvasu)
- Stejný počet krystalů per ikona (1-3, ne víc — jinak vypadá zahlceně)
- Stejný styl scrollwork (acanthus + curling vines, ne geometric / ne tribal)
- Stejný stupeň detailu (medium — ne flat-flat ne hyper-detailed)

### Zákazy (universal negative)

```
text, letters, words, typography, runes, calligraphy, watermark, logo, signature,
solid background, gradient background, opaque background, white background,
checkerboard, drop shadow, cast shadow, ground shadow,
dark colors, black, brown, red, orange, bronze, copper,
saturated yellow, neon, cyan, teal, cobalt blue, navy,
photorealistic skin, realistic flesh, character, person, face, figure, silhouette,
blurry, painterly, abstract expressionism, watercolor,
gritty, distressed, weathered, rusty, broken, cracked,
dark fantasy, gothic horror, demonic, skull, bone,
cyberpunk, sci-fi, technological, mechanical, gear, circuitry,
3D render, plastic, glossy plastic, photographic
```

Tento blok kopíruj jako `--no` nebo do negative-prompt pole MJ/Flux **u každého ze 10 assetů**.

---

## STRUKTURNÍ ASSETY (4)

### 1. `corner-ornament.webp` — Light-blue krystalový diamant

**Účel:** drobný akcent pro `CornerOrnament` komponentu — viditelný krystalek v rohu welcome card a panelů.

**Rozlišení:** 120×120 px (transparent PNG → webp)

**Prompt:**
```
A small luminous light-blue crystal jewel in classic faceted diamond shape,
pale ice-blue color (#9ed4ef) with white sparkling highlights at the center,
delicate warm-gold (#c7b07a) filigree setting around the gem with 4 tiny
curling tendrils, soft inner glow, isolated on pure transparent background,
centered composition, crisp clean vector edges, elegant elven-cathedral
heraldic style, no shadow, jewel-like clarity, ornamental detail piece
--ar 1:1 --style raw --v 6.1
```

**Postprocessing:**
- `cwebp -q 92 -alpha_q 100 corner-ornament.png -o corner-ornament.webp`
- Cílová velikost: <30 KB

---

### 2. `page-frame-corner-tl.webp` — Top-left filigránový roh panelu

**Účel:** velký rohový ornament pro 4 rohy glass panelů (sidebar, right panel, welcome card, novinky). Generujeme **jen TL variantu**, zbylé tři (TR/BL/BR) udělá CSS přes `transform: scaleX(-1)` / `scaleY(-1)` / `scale(-1, -1)`.

**Rozlišení:** 320×320 px (transparent PNG → webp)

**Prompt:**
```
An ornate top-left corner ornament in elegant elven-cathedral style,
ivory cream parchment color (#fbf8f1) as base material with warm soft gold
filigree (#c7b07a) curling vines and acanthus leaves flowing from the
corner inward and downward, three small light-blue faceted crystal jewels
(#9ed4ef) embedded at key intersections of the filigree, delicate vector
linework with hairline gold strokes, subtle inner glow on the crystals,
art-nouveau meets gothic illumination aesthetic, isolated on pure
transparent background, only the top-left quadrant filled (the rest empty
transparent space), crisp clean edges, decorative manuscript border
fragment, no shadow, no background, soft luminous quality
--ar 1:1 --style raw --v 6.1
```

**Důležité:**
- Komposice MUSÍ vycházet z levého horního rohu a klesat dolů + vpravo. Nikdy ne symetrická radialní.
- Zbytek čtverce (pravý + spodní) musí být **prázdný transparent** — jinak nebude flip fungovat.

**Postprocessing:**
- `cwebp -q 90 -alpha_q 100 page-frame-corner-tl.png -o page-frame-corner-tl.webp`
- Cílová velikost: <120 KB

**Iterační tip:** pokud MJ generuje symetrický roh, přidej `--no symmetry, mirror` a doplň prompt: `composition anchored in upper-left only, lower-right area completely empty`.

---

### 3. `nav-end-cap-l.webp` — Levý konec stuhy/ribbonu

**Účel:** ozdobný end-cap na levé straně nav buttonů (ÚVODNÍK, VYTVOŘIT SVĚT…) a section dividerů (NAVIGACE, VESMÍRY, CHAT). Pravý end-cap udělá CSS přes `transform: scaleX(-1)`.

**Rozlišení:** 96×72 px (poměr 4:3, transparent)

**Prompt:**
```
An ornamental left ribbon end-cap, ivory parchment ribbon (#fbf8f1) tapering
to the right with curling warm gold (#c7b07a) filigree scrollwork at the
left edge, one small light-blue crystal jewel (#9ed4ef) embedded at the tip
of the curl, classic heraldic banner terminator, delicate hairline gold
stroke outline, soft cream gradient body, isolated on pure transparent
background, horizontal orientation, the ribbon points to the right ready
to connect to a flat band, art-nouveau scroll terminator, crisp vector
edges, no shadow, no text, decorative manuscript fragment
--ar 4:3 --style raw --v 6.1
```

**Postprocessing:**
- `cwebp -q 92 -alpha_q 100 nav-end-cap-l.png -o nav-end-cap-l.webp`
- Cílová velikost: <25 KB

**Iterační tip:** pokud generátor vyrobí symetrický kus, řekni `only the left half is decorated, right half is a clean horizontal cut edge`.

---

### 4. *(rezervováno — viz poznámka „Mirror generates"`)*

> CSS používá `nav-end-cap-r.webp` a `page-frame-corner-tr/bl/br.webp` jako **samostatné `--asset-*` proměnné**, ale fyzické soubory NETVOŘÍME — místo toho v `decorations.css` aplikujeme `transform: scaleX(-1)` na element, který používá tl/l asset s pozicí tr/r. To je technicky čistší a šetří payload. (Viz implementační plán.)

---

## NAV IKONY (7)

Společný vizuální DNA pro všech 7:
- **Plochá heraldická ilustrace**, ne 3D render
- **Ivory parchment + warm gold filigree + 1-2 light blue krystaly**
- **Transparent background, izolovaný objekt v centru**
- **Cílová interpretace na 28×28 px** v UI → ikona musí být čitelná i v malém

**Univerzální styl-fragment** (přidávej ke každému prompt):
> `flat heraldic illuminated manuscript icon, ivory parchment base #fbf8f1, warm gold filigree details #c7b07a, accent crystal jewel #9ed4ef, isolated centered composition on pure transparent background, crisp vector edges, no shadow, decorative medieval-elven aesthetic`

---

### 5. `home.webp` — Úvodník 🏠

**Účel:** ikona pro „Úvodník" v navigaci.

**Rozlišení:** 256×256 px (transparent)

**Prompt:**
```
A stylized ornate house icon shaped like a small marble cathedral or elven
chapel, ivory cream walls (#fbf8f1) with warm gold (#c7b07a) filigree
trim around windows and door, pointed roof topped with a small light-blue
crystal jewel (#9ed4ef), tiny gold scroll banner across the foundation,
flat heraldic illuminated manuscript icon style, isolated centered on
pure transparent background, crisp vector edges, soft glow on crystal,
no shadow, no text, decorative medieval-elven aesthetic
--ar 1:1 --style raw --v 6.1
```

**Postprocessing:** `cwebp -q 92 -alpha_q 100 home.png -o home.webp`. Cíl <40 KB.

---

### 6. `compass.webp` — Nápověda 🧭

**Účel:** ikona pro „Nápověda".

**Rozlišení:** 256×256 px

**Prompt:**
```
An ornate heraldic compass rose, ivory parchment background circle
(#fbf8f1) with warm gold (#c7b07a) filigree compass star pointing in
four directions, delicate gold tick marks around the rim, central pivot
formed by a light-blue faceted crystal (#9ed4ef) catching light, decorative
acanthus scrollwork between the cardinal points, flat heraldic illuminated
manuscript icon style, isolated centered on pure transparent background,
crisp vector edges, soft glow on the crystal pivot, no shadow, no text,
decorative medieval-elven cartographer aesthetic
--ar 1:1 --style raw --v 6.1
```

**Postprocessing:** `cwebp -q 92 -alpha_q 100 compass.png -o compass.webp`. Cíl <40 KB.

---

### 7. `beer.webp` — Hospoda 🍺

**Účel:** ikona pro „Dimenzionální hospoda" (chat). Vědomě **NE pivní krýgl** (skin je elegantní), ale ozdobný kalich/pohár.

**Rozlišení:** 256×256 px

**Prompt:**
```
An ornate ceremonial chalice or goblet, ivory cream cup body (#fbf8f1)
with warm gold (#c7b07a) filigree banding around the rim and pedestal,
two small light-blue crystal jewels (#9ed4ef) embedded on opposite sides
of the cup, gentle pale liquid suggestion inside the cup with a tiny
gold sparkle on the surface, scrollwork base, flat heraldic illuminated
manuscript icon style, isolated centered on pure transparent background,
crisp vector edges, soft inner glow, no shadow, no foam, no beer mug,
no handle, no text, decorative elven-banquet aesthetic
--ar 1:1 --style raw --v 6.1
```

**Postprocessing:** `cwebp -q 92 -alpha_q 100 beer.png -o beer.webp`. Cíl <40 KB.

---

### 8. `plus-star.webp` — Vytvořit svět ✨

**Účel:** ikona pro „Vytvořit svět".

**Rozlišení:** 256×256 px

**Prompt:**
```
An ornate eight-pointed heraldic star, four long warm gold (#c7b07a)
filigree rays alternating with four shorter ivory rays (#fbf8f1), a
luminous light-blue crystal jewel (#9ed4ef) at the very center catching
light with white sparkle highlights, tiny gold filigree curls between
the rays, flat heraldic illuminated manuscript icon style, isolated
centered on pure transparent background, crisp vector edges, soft glow
radiating from the central crystal, no shadow, no text, decorative
celestial-elven aesthetic
--ar 1:1 --style raw --v 6.1
```

**Postprocessing:** `cwebp -q 92 -alpha_q 100 plus-star.png -o plus-star.webp`. Cíl <40 KB.

---

### 9. `scroll.webp` — Diskuze 📜

**Účel:** ikona pro „Diskuze".

**Rozlišení:** 256×256 px

**Prompt:**
```
A partially unrolled ivory parchment scroll (#fbf8f1) shown horizontally
from a slight three-quarter angle, both ends curled into ornate spirals
bound with warm gold (#c7b07a) filigree end-caps, a tiny light-blue
crystal jewel (#9ed4ef) embedded at the center of each spiral cap, faint
gold hairlines suggesting written script across the parchment surface
without forming any actual letters, flat heraldic illuminated manuscript
icon style, isolated centered on pure transparent background, crisp
vector edges, soft glow on crystals, no shadow, no readable text,
decorative medieval-elven scribe aesthetic
--ar 1:1 --style raw --v 6.1
```

**Postprocessing:** `cwebp -q 92 -alpha_q 100 scroll.png -o scroll.webp`. Cíl <40 KB.

**Pozn.:** Pokud generátor přidá čitelné písmo, zopakuj s důrazem `abstract horizontal hairlines only, NO letters, NO words, NO calligraphy`.

---

### 10. `book.webp` — Články 📖

**Účel:** ikona pro „Články".

**Rozlišení:** 256×256 px

**Prompt:**
```
An open ivory leather book (#fbf8f1) viewed from a soft three-quarter angle,
both visible pages cream parchment with faint horizontal gold hairlines
suggesting text but no readable letters, ornate warm gold (#c7b07a)
filigree corners on both page edges, a single light-blue crystal jewel
(#9ed4ef) embedded in the spine binding catching light, gold filigree
trim along the page edges, flat heraldic illuminated manuscript icon
style, isolated centered on pure transparent background, crisp vector
edges, soft glow on the crystal, no shadow, no readable text, no actual
letters, decorative medieval-elven library aesthetic
--ar 1:1 --style raw --v 6.1
```

**Postprocessing:** `cwebp -q 92 -alpha_q 100 book.png -o book.webp`. Cíl <40 KB.

---

### 11. `portraite-frame.webp` — Galerie 🖼

**Účel:** ikona pro „Galerie".

**Rozlišení:** 256×256 px

**Prompt:**
```
An ornate empty portrait frame in vertical orientation, warm gold
(#c7b07a) filigree carved frame with curling acanthus leaves and
scrollwork at all four corners, ivory cream inner mat (#fbf8f1) with a
subtle pale blue gradient suggesting an empty canvas (no subject),
four tiny light-blue crystal jewels (#9ed4ef) embedded one at the center
of each side of the frame, flat heraldic illuminated manuscript icon
style, isolated centered on pure transparent background, crisp vector
edges, soft glow on crystals, no shadow, no portrait subject, no figure,
no face, no text, decorative gallery-elven aesthetic
--ar 1:1 --style raw --v 6.1
```

**Postprocessing:** `cwebp -q 92 -alpha_q 100 portraite-frame.png -o portraite-frame.webp`. Cíl <40 KB.

> ⚠ **Filename typo zachován schválně** — `portraite-frame.webp` (ne `portrait-`) je konvence napříč skiny (modre-nebe, zlaty-standard). Neměnit, jinak se rozbijí CSS hooks.

---

## SUMMARY — co generujeme

| # | Soubor | Rozměr | Cíl velikost |
|---|---|---|---|
| 1 | `corner-ornament.webp` | 120×120 | <30 KB |
| 2 | `page-frame-corner-tl.webp` | 320×320 | <120 KB |
| 3 | `nav-end-cap-l.webp` | 96×72 | <25 KB |
| 4 | `home.webp` | 256×256 | <40 KB |
| 5 | `compass.webp` | 256×256 | <40 KB |
| 6 | `beer.webp` | 256×256 | <40 KB |
| 7 | `plus-star.webp` | 256×256 | <40 KB |
| 8 | `scroll.webp` | 256×256 | <40 KB |
| 9 | `book.webp` | 256×256 | <40 KB |
| 10 | `portraite-frame.webp` | 256×256 | <40 KB |

**Celkový payload: ~440 KB.** Mirror varianty (tr/bl/br corner, nav-end-cap-r) řeší CSS přes `transform: scaleX/Y(-1)` — žádné další soubory.

---

## Workflow generování

1. **MJ v6.1** (Discord nebo web): jet prompt po promptu, vždy 4 varianty, vybrat tu nejčistší.
2. **Upscale** vybraný image (subtle, ne creative).
3. **Background remove** — pokud MJ pozadí stejně udělá nějaké, přes [remove.bg](https://remove.bg) nebo Photoshop magic wand → uložit jako PNG s alfa.
4. **Resize** na cílový rozměr (Photoshop / `magick convert`).
5. **cwebp** příkaz z tabulky.
6. **Validace velikosti** — pokud nad limit, zopakuj `cwebp` s `-q 85` nebo `-q 80`.
7. Soubory ulož do `public/themes/bila/decor/`.

## Konzistence kontroly

Po vygenerování všech assetů srovnej je vedle sebe (např. v Photoshopu jako contact sheet) a ověř:
- Všechny mají **stejný odstín ivory** (#fbf8f1, ne žluté)
- Všechny mají **stejný odstín gold** (#c7b07a, ne sytě žluté ani bronzové)
- Všechny krystaly mají **stejný odstín light blue** (#9ed4ef, ne sytě modré ani tyrkysové)
- Žádný asset nemá `pozadí` — všechny jsou na transparentní šachovnici
- Žádný asset nemá `text` ani čitelné písmo

Pokud se odstíny rozcházejí, v Photoshopu udělej **Hue/Saturation match** přes celý set (`Image > Adjustments > Match Color`).
