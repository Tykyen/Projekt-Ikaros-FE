# Sci-fi skin — asset prompty

Prompty pro **případnou budoucí regeneraci** assetů sci-fi skinu, pokud by se některý
chtěl upgradovat aby přesněji odpovídal image 2 (HUD command konzole, holografický anděl).

**Aktuální stav (2026-05-09):** všechny assety níže jsou zatím **ponechány** — vizuální
upgrade sci-fi skinu řeší čistě CSS v `decorations.css`. Tento dokument je pojistka
pro budoucnost.

Doporučený generátor: **Midjourney v6** nebo **SDXL/Flux**. Všechny assety v `webp` formátu.

---

## 1. `andel-medallion.webp` — Holografický anděl s HUD ringem

**Účel:** medailon ve welcome card vlevo. Cyan holografický anděl s rozprostřenými křídly v kruhovém HUD framu.

**Cílové rozlišení:** 600×640 px (poměr ~15:16, transparentní pozadí PNG → konvert webp)

**Prompt:**
```
A holographic angel with outstretched wings inside a circular sci-fi HUD ring,
glowing cyan and electric blue energy, transparent translucent body made of
light particles and data streams, intricate technical brackets and arc segments
around the ring, faint scanlines, subtle magenta accent highlights at outer ring,
centered composition, isolated on pure transparent background, no shadow,
crisp clean linework, high detail, holographic projection style, command HUD
overlay aesthetic, futuristic interface element, --ar 15:16 --style raw --v 6
```

**Negative prompt:**
```
solid background, opaque body, realistic flesh, dark angel, demonic, gold,
warm colors, painterly, blurry, photorealistic skin, gradient background,
ground shadow, character silhouette, logo, text, watermark
```

**Postprocessing:**
- Uložit jako PNG s alfa kanálem
- `cwebp -q 90 -alpha_q 100 input.png -o andel-medallion.webp`
- Cílová velikost <300 KB

---

## 2. `logo.webp` — Hex emblem + wing (čistý, bez textu)

**Účel:** topbar logo. **Pouze samotný hex+wing emblem** bez vepsaného "Projekt Ikaros" textu — text se v novém topbaru renderuje samostatně přes CSS jako velký hairline cyan nadpis.

**Cílové rozlišení:** 320×120 px (poměr ~8:3, transparentní pozadí)

**Prompt:**
```
A clean hexagonal sci-fi emblem containing a stylized winged angel silhouette
in the center, glowing cyan and electric blue, intricate technical line details
on hex border, subtle inner glow, holographic energy aesthetic, isolated on
pure transparent background, centered composition, crisp vector-style edges,
minimal magenta accent highlights, futuristic command badge, no text, no letters,
no typography, --ar 8:3 --style raw --v 6
```

**Negative prompt:**
```
text, letters, words, typography, "PROJEKT IKAROS", lettering, font,
solid background, gold, warm colors, photorealistic, blurry, painterly,
gradient background, drop shadow, watermark, logo text
```

**Postprocessing:**
- PNG s alfa
- `cwebp -q 92 -alpha_q 100 input.png -o logo.webp`
- Cílová velikost <100 KB

**Pozn.:** Pokud generátor odmítne vyrobit emblem bez textu, vyrobit větší hex
verzi a v Photoshopu/GIMPu odmaskovat textovou plochu.

---

## 3. `sci-fi.webp` (background) — Futuristic interior s výhledem na město

**Cesta:** `public/themes/backgrounds/sci-fi.webp` (mimo `decor/` adresář)

**Účel:** atmosférický background přes celou viewport. Image 2 ukazuje **interior**
s techno mobiliářem v popředí a městem skrz panoramatické okno v pozadí.

**Cílové rozlišení:** 2560×1440 px (16:9, full HD+)

**Prompt:**
```
Wide cinematic interior shot of a futuristic command lounge, sleek dark
techno-furniture in foreground (low sofas, holographic side tables with
glowing surfaces), panoramic curved window stretching across the back wall
revealing a vast cyberpunk megacity skyline at twilight blue hour, distant
spires and floating vehicles silhouetted against deep navy sky with subtle
cyan and magenta neon ambient glow, atmospheric haze, soft volumetric lighting,
extremely detailed architecture, photorealistic, cinematic depth of field,
moody contemplative mood, cyan and electric blue dominant color palette with
faint magenta highlights on distant signs, no people, --ar 16:9 --style raw --v 6
```

**Negative prompt:**
```
people, characters, daylight, bright sun, warm colors, gold, orange,
cluttered foreground, text, signs with letters, ui overlay, hud elements,
portrait orientation, painterly, abstract, low resolution, blurry
```

**Postprocessing:**
- Stáhnout jako PNG nebo high-quality JPG
- `cwebp -q 85 input.png -o sci-fi.webp`
- Cílová velikost <800 KB
- Ověřit že důležité elementy (okno, město) jsou v ~horní 2/3, spodní 1/3 je
  obvykle skrytá pod welcome cards

---

## 4. Volitelné — micro-asset SVG ornamenty

Tyto se neřeší přes generátor, ale jako inline SVG v `decorations.css` (background-image data: URL).
Uvedeno pro úplnost, kdyby chtěl externí editor:

- **End-bracket marker** pro footer signature: 4× malý magenta diamond glyph,
  jeden vedle druhého, ~60×8 px, používá `var(--theme-accent-magenta)`
- **HUD bracket corner**: L-shape line, 30×30 px, 2px stroke cyan
- **Magenta glow node**: malý kruh 6×6 px, magenta center, transparent edge
  (radial-gradient v CSS)

---

## Iterační doporučení

Pokud generování nesedí na první pokus:
1. **Andel** — variant na `--chaos 30` pokud máš MJ; přidej `god rays`
   pokud chceš víc atmosférický
2. **Logo** — pokud generátor přidává text, zkus `cropped close-up` +
   posttovné odmaskování
3. **Background** — pokud město dominuje moc, přidej `interior in foreground,
   floor visible` + `low camera angle`

Po regeneraci ověř kontrast s welcome cards (anděl nesmí splynout s textem
ani s pozadím).
