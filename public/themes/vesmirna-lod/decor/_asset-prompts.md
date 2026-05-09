# Vesmírná loď — asset prompty

Prompty pro **7 nav ikon** vesmírné lodi (industriální vojenský hangár) — pokrývají kompletně levý sidebar.

**Aktuální stav (2026-05-09):**
- `logo.webp` — ZACHOVAT (uživatel nechce měnit)
- `andel-medallion.webp` — ZACHOVAT (uživatel nechce měnit)
- 7× `icon-*.webp` — **NOVÉ k vygenerování**:
  - `icon-uvodnik.webp` — ÚVODNÍK
  - `icon-vytvorit-svet.webp` — VYTVOŘIT SVĚT
  - `icon-diskuze.webp` — DISKUZE
  - `icon-clanky.webp` — ČLÁNKY
  - `icon-galerie.webp` — GALERIE
  - `icon-napoveda.webp` — NÁPOVĚDA
  - `icon-hospoda.webp` — DIMENZIONÁLNÍ HOSPODA

**Generátor:** Midjourney v6.1 (preferred) nebo Flux/SDXL. Output: PNG s alfa, pak `cwebp -q 90 -alpha_q 100`.

---

## 🎨 STYLE GUIDE

Závazné pro všech 7 ikon. Set musí vypadat z jedné dílny — stejné materiály, stejný úhel světla, stejná tloušťka linek.

### Reference look

Inspirace: **USCSS Nostromo HUD (Alien) + Helldivers operační konzole + EVE Online stanice**. Cíl: vojenský hangár, ne futuristický bridge. Industriální kov, rivety, amber warning accenty na cyan svícení.

### Barevná paleta (přesné hex)

| Role | Hex | Použití |
|---|---|---|
| **Cyan primary** | `#00b8e8` | hlavní svit, glowing parts, energie/světlo |
| **Cyan bright** | `#5dd5ff` | highlight, jiskry, reflex na cyan partiích |
| **Cyan deep** | `#005878` | hloubky, stíny v cyan partiích |
| **Amber warning** | `#e8a020` | varovné akcenty, stencil text, rivet rings |
| **Amber bright** | `#ffc24a` | highlight na amber, jiskra |
| **Steel plate** | `#3a4854` | kovový plát, base shell |
| **Steel dark** | `#1a2530` | hluboké stíny v kovu, panel groove |
| **Steel light** | `#5a6e80` | reflex na hraně kovu |
| **Black accent** | `#0a0e14` | warning stripe černá, kontur deep |

**Zakázané barvy:**
- ❌ Magenta / fialová (to je sci-fi skin teritorium)
- ❌ Gold (nesvítí, je matný kov — to je zlatý standard)
- ❌ Zelená (out of palette)
- ❌ Pure white background (vždy alpha)
- ❌ Sytá červená (rezervováno pro danger states)

### Materiály

**Kov / steel plate:**
> *"brushed steel plate (#3a4854), industrial scratches and panel grooves, slight wear and dirt, military spaceship aesthetic, cool grey-blue tint, NOT chrome, NOT polished mirror, NOT golden"*

**Cyan glow / energie:**
> *"electric cyan blue glow (#00b8e8) emanating softly, with brighter cyan highlight (#5dd5ff) at the brightest spot, soft outer halo fading to transparent, tech HUD energy aesthetic"*

**Amber warning:**
> *"amber industrial warning yellow (#e8a020), used as small accent ring or stencil detail, NOT a full glow, NOT magenta, NOT gold — it's a warning hazard color, military spec"*

**Rivety:**
> *"small metallic rivets (steel screws) flush to the panel surface, 4-6 rivets visible, subtle highlight on top edge"*

### Světlo & glow

- Hlavní směrové světlo zleva-shora pod ~30° úhlem (industrial overhead).
- **Cyan partie emitují vlastní glow** → halo radius ~20% velikosti aktivního prvku, fade to transparent.
- **Amber accenty NESVÍTÍ silně** — jen mírný 0.3 opacity glow, působí jako painted warning marking.
- **Drop-shadow / cast shadow:** žádný. Glow ano.

### Kompozice — pravidla pro VŠECH 7

1. **Centrovaná kompozice** uvnitř canvasu.
2. **Padding** = ~12% canvasu na každé straně.
3. **Pozadí: 100% transparent** (alfa = 0). Ne bílé, ne gradient.
4. **Bez stínu pod objektem.** Glow ano.
5. **Bez textu / typografie** (kromě explicit povolených stencil glyfů — viz jednotlivé ikony, obvykle jen `?` nebo cislice).
6. **Bez postavy / lidské figury.**
7. **Crisp vector-style edges**, čitelné při downscale na 28×28 px.

### Konzistence napříč setem

- Stejná tloušťka outline (~3% z výšky canvasu)
- **Color ratio 60/30/10** (audit 1.0g): cca **60% steel** (#3a4854 base + steel highlights) / **30% cyan glow** (#00b8e8 + bright variants) / **10% amber accent** (#e8a020). Bez tohoto pravidla MJ drift přes 7 ikon vytvoří nesoulad.
- **Amber max 1 spot per ikona** (audit 1.0g): každá ikona má pouze **JEDEN** amber prvek — buď LED, NEBO rivet ring, NEBO stencil mark, NEBO warning stripe. Ne víc. Cyan je primary, amber je accent.
- Cyan glow přítomen v každé ikoně (alespoň 1 výrazný prvek)
- Stejný úhel světla (zleva-shora)
- Stejný stupeň "wear & tear" (medium — používané, ale udržované, ne zničené)
- Stejný level detailu (medium — ne flat, ne hyper-photoreal)

### Universal negative

```
text, letters, words, typography, runes, calligraphy, watermark, logo, signature,
solid background, gradient background, opaque background, white background, black background,
human figure, character, face, hands, animals, organic creatures,
photorealistic, painterly, blurry, soft focus,
chrome mirror, polished gold, magenta, purple, green, red,
ground shadow, cast shadow, drop shadow, scene environment, sky, floor
```

---

## 1. `icon-uvodnik.webp` — Industrial dock / hangár entry portal

**Účel:** ikona pro nav položku **ÚVODNÍK** (entry point do dashboardu). Symbolika: hangárová brána / dokovací průchod / "domů" v industrial podání.

**Cílové rozlišení:** 256×256 px (1:1, transparent PNG → webp).

**Námět:** Frontální pohled na uzavřená dvojitá hangárová vrata vesmírné lodi. Dvě půlkruhové ocelové brány se setkávají uprostřed s tenkou cyan glow linkou ve štěrbině. Po obvodu rivety. Vrcholový oblouk ohraničen amber warning stripe (krátká diagonální žlutočerná linka v horní části — jako warning sign nad dveřmi).

**Prompt:**
```
A frontal view of closed double hangar doors on a military spaceship,
two semicircular brushed steel panels (#3a4854) meeting at the center
with a thin glowing cyan line (#00b8e8) in the seam radiating soft electric
glow, metallic rivets along the curved edges, amber warning stripe
(#e8a020 with black diagonal hazard pattern) along the top arc as a small
warning sign, industrial military aesthetic, USCSS Nostromo style,
isolated on pure transparent background, no shadow, crisp clean vector edges,
centered composition, NOT futuristic, NOT chrome, NOT golden,
medium detail level, --ar 1:1 --style raw --v 6
```

**Negative:**
```
text, characters, human figure, magenta, purple, gold, chrome, white background,
gradient, painterly, blurry, soft focus, organic, character, ground shadow
```

**Postprocessing:**
```bash
cwebp -q 90 -alpha_q 100 icon-uvodnik.png -o icon-uvodnik.webp
```
Cílová velikost: <30 KB.

---

## 2. `icon-vytvorit-svet.webp` — Industrial planet construction emblem

**Účel:** ikona pro nav **VYTVOŘIT SVĚT**. Symbolika: deploy/build new world — industriální planeta v konstrukčním rámu s `+` markerem.

**Cílové rozlišení:** 256×256 px (1:1).

**Námět:** Stylizovaná planeta (sphere s povrchovými kontinenty / mřížkou) v centru, obklopená polovičním industriálním konstrukčním **steel** rámcem (3 krátké ocelové struts, ne amber). V pravém horním rohu rámu **amber stencil `+`** symbol (jediný amber accent v ikoně — "deploy new" marker). Sphere má cyan glow halo. Po obvodu rámu 4 ocelové rivety.

**Prompt:**
```
A stylized planet sphere with subtle continental grid pattern in cool steel
tones (#3a4854 base, #5a6e80 highlights), centered inside a partial industrial
construction scaffold frame made of cool steel struts (NOT amber), the planet
emits soft cyan glow halo (#00b8e8), a small amber stencil plus sign "+"
(#e8a020) in the top-right corner of the frame as a single "deploy new"
amber accent marker, four small steel rivets along the visible frame edges,
USCSS Nostromo military spaceship aesthetic,
isolated on pure transparent background, no shadow, crisp vector edges,
centered composition, NOT a fantasy globe, NOT a magical orb, NOT chrome,
NOT golden, medium detail level, --ar 1:1 --style raw --v 6
```

**Negative:**
```
text, words, letters except single plus sign, fantasy globe, magic orb,
human figure, magenta, purple, gold, chrome, white background, gradient,
painterly, soft focus, organic, character, ground shadow, clouds, atmosphere
```

**Postprocessing:**
```bash
cwebp -q 90 -alpha_q 100 icon-vytvorit-svet.png -o icon-vytvorit-svet.webp
```
Cílová velikost: <30 KB.

---

## 3. `icon-diskuze.webp` — Military comm headset

**Účel:** ikona pro nav **DISKUZE**. Symbolika: vojenský comm transceiver / headset — chatování přes military comm net.

**Cílové rozlišení:** 256×256 px (1:1).

**Námět:** Vojenský comm headset — sluchátka s mikrofonem na ramínku. Brushed steel + černé polstrování. Mikrofon (boom arm) má na špičce **cyan LED** (active transmit). Na ucho headphone jeden **amber stencil mark** (jediný amber accent v ikoně — abstract industrial markings). 3/4 perspektiva nebo frontální mírně shora. Cyan glow z aktivní LED.

**Prompt:**
```
A military communication headset with brushed steel ear cups (#3a4854) and
black padding, a boom microphone arm extending from one side with a small
glowing cyan LED (#00b8e8) at the microphone tip emitting soft electric
blue light, a single small amber stencil mark (#e8a020) on the side of
the ear cup as the only amber accent in the icon, slight 3/4 perspective
angle, USCSS Nostromo military comm gear aesthetic,
isolated on pure transparent background, no shadow, crisp vector edges,
centered composition, NOT consumer headphones, NOT gaming RGB,
NOT chrome, NOT golden, medium detail level, --ar 1:1 --style raw --v 6
```

**Negative:**
```
text, letters, words, RGB rainbow, gaming, fashion headphones, human ears,
character, magenta, purple, gold, chrome, white background, gradient,
painterly, soft focus, organic, hands, ground shadow
```

**Postprocessing:**
```bash
cwebp -q 90 -alpha_q 100 icon-diskuze.png -o icon-diskuze.webp
```
Cílová velikost: <30 KB.

---

## 4. `icon-clanky.webp` — Industrial datapad with text grid

**Účel:** ikona pro nav **ČLÁNKY**. Symbolika: industriální data pad / clipboard pro zprávy — data terminál s text gridem (ne kniha — to je bila).

**Cílové rozlišení:** 256×256 px (1:1).

**Námět:** Ruční datapad / military clipboard — pravoúhlý kovový rámec s aktivní obrazovkou. Na obrazovce horizontální cyan svítící čáry (4–5 řádků, naznačují text/data, ale nejde o písmena — jen abstract data grid). V horní liště datapadu malá amber stencil čárka (status indicator). Rivety v rozích. Mírně 3/4 angle, jako kdyby se pad držel.

**Prompt:**
```
A military handheld datapad device, rectangular brushed steel frame
(#3a4854) with an active display showing four to five horizontal
cyan glowing data lines (#00b8e8) of varying lengths emitting soft
electric blue light (representing abstract data rows, NOT readable text),
a small amber status indicator stripe (#e8a020) along the top header bar
of the pad, four metallic rivets at frame corners, slight 3/4 perspective
angle, USCSS Nostromo military clipboard aesthetic, isolated on pure
transparent background, no shadow, crisp vector edges, centered composition,
NOT a paper book, NOT a scroll, NOT a tablet computer, NOT chrome,
NOT golden, medium detail level, --ar 1:1 --style raw --v 6
```

**Negative:**
```
text, letters, words, readable typography, paper book, scroll, parchment,
fantasy tome, consumer tablet, iPad, hands, fingers, character, magenta,
purple, gold, chrome, white background, gradient, painterly, organic
```

**Postprocessing:**
```bash
cwebp -q 90 -alpha_q 100 icon-clanky.png -o icon-clanky.webp
```
Cílová velikost: <30 KB.

---

## 5. `icon-galerie.webp` — Industrial monitor wall display

**Účel:** ikona pro nav **GALERIE**. Symbolika: stěnový display / monitor s preview obrázku — industriální CCTV bay.

**Cílové rozlišení:** 256×256 px (1:1).

**Námět:** Wall-mounted monitor / display screen v industriálním kovovém rámu. Na obrazovce abstraktní geometrický motiv připomínající image preview (jednoduchý cyan triangle/horizon shape — naznačuje "image content" bez konkrétního obsahu). Po obvodu rámu rivety. V pravém dolním rohu rámu malá amber LED (record/active). Frontální view.

**Prompt:**
```
A wall-mounted industrial monitor display in a brushed steel frame
(#3a4854), the screen shows an abstract simple geometric image preview —
a soft cyan glowing triangle and horizon line motif (#00b8e8) representing
"image content" without specific subject, soft electric blue glow, four
metallic rivets at frame corners, a small amber LED indicator (#e8a020,
lit) in the bottom-right corner of the frame, frontal flat view,
USCSS Nostromo military CCTV aesthetic, isolated on pure transparent
background, no shadow, crisp vector edges, centered composition,
NOT a TV set, NOT consumer monitor, NOT a photograph, NOT chrome,
NOT golden, medium detail level, --ar 1:1 --style raw --v 6
```

**Negative:**
```
text, letters, words, photograph, real image, scenery, landscape,
human figure, character, TV, consumer monitor, magenta, purple, gold,
chrome, white background, gradient, painterly, organic, ground shadow
```

**Postprocessing:**
```bash
cwebp -q 90 -alpha_q 100 icon-galerie.png -o icon-galerie.webp
```
Cílová velikost: <30 KB.

---

## 6. `icon-napoveda.webp` — Industrial info terminal s `?`

**Účel:** ikona pro nav **NÁPOVĚDA**. Symbolika: data terminal / info konzole se stencil `?`. Industrial pad / monitor.

**Cílové rozlišení:** 256×256 px (1:1).

**Námět:** Industriální data pad nebo malý wall-mounted info terminal, frontální pohled. Obdélníková obrazovka uvnitř kovového rámu. Na obrazovce velký cyan stencil otazník `?` (vector-style, military stencil, ne handwritten). Po obvodu rámu rivety. V pravém horním rohu rámu malá amber LED dioda (ON state).

**Prompt:**
```
A small industrial info terminal mounted on a wall, rectangular display
screen surrounded by a brushed steel frame (#3a4854), screen shows
a large cyan stencil question mark "?" (#00b8e8) in military stencil
typography style, glowing softly with electric blue light, four metallic
rivets at frame corners, a small amber LED indicator (#e8a020, lit) in
the top-right corner of the frame, frontal flat view,
USCSS Nostromo military spaceship console aesthetic,
isolated on pure transparent background, no shadow, crisp vector edges,
centered composition, NOT a sign post, NOT a holographic projection,
NOT futuristic chrome, medium detail level, --ar 1:1 --style raw --v 6
```

**Negative:**
```
words, letters, numbers other than the single question mark, text paragraphs,
human figure, magenta, purple, gold, chrome, white background, gradient,
painterly, soft focus, organic, character, ground shadow, scene environment
```

**Postprocessing:**
```bash
cwebp -q 90 -alpha_q 100 icon-napoveda.png -o icon-napoveda.webp
```
Cílová velikost: <30 KB.

---

## 7. `icon-hospoda.webp` — Industrial messhall mug

**Účel:** ikona pro **DIMENZIONÁLNÍ HOSPODA** — chat hub. Symbolika: vojenský messhall mug, neon-lit beer, social hangár hub.

**Cílové rozlišení:** 256×256 px (1:1).

**Námět (audit 1.0g — recolor):** Statný kovový hrnek (steel tankard, ne porcelán) s těžkým rukojetím. Vrch viditelný, **pivo amber/zlaté uvnitř** (klasická pivní barva, čte se jako pivo) s pěnou. **Cyan glow pouze na rimu hrnku a reflexech rukojeti** — jako kdyby zvenku svítil cyan reflektor messhall. Pivo NESVÍTÍ cyan (původně bylo riziko že se to čte jako toxická chemikálie). Po obvodu hrnku ocelové rivety. Bez dalších amber accentů (pivo samo je amber accent).

**Prompt:**
```
A heavy military steel tankard mug (#3a4854) with sturdy industrial handle,
filled with classic amber-golden beer (#c89030 to #e8a020 gradient) topped
with creamy white foam — the beer reads naturally as beer, NOT glowing,
NOT toxic, NOT cyan-colored, the only cyan element is a soft cyan rim
highlight (#00b8e8) on the metal edge of the mug top and a cyan reflection
on the curved handle as if a messhall cyan light shines on the metal from
outside, brushed metal scratches and wear on the mug body, small steel
rivets on the handle base, 3/4 perspective view, USCSS Nostromo military
messhall aesthetic, isolated on pure transparent background, no shadow,
crisp vector edges, centered composition, NOT a beer glass, NOT a coffee cup,
NOT magical, NOT chrome, NOT golden mug body (only the beer is amber),
medium detail level, --ar 1:1 --style raw --v 6
```

**Negative:**
```
text, words, letters, glass cup, ceramic, magic potion, toxic green liquid,
cyan beer, glowing fluorescent beverage, magenta, purple, gold mug,
chrome, white background, painterly, character, hands, ground shadow
```

**Postprocessing:**
```bash
cwebp -q 90 -alpha_q 100 icon-hospoda.png -o icon-hospoda.webp
```
Cílová velikost: <30 KB.

---

## Pipeline shrnutí

1. Vygeneruj 7 PNG (Midjourney v6.1 → upscale do 1024×1024 → ručně ořež na 256×256 s padding).
2. Ověř transparentní alfu (žádné checker pozadí v exportu).
3. Optimize každý: `cwebp -q 90 -alpha_q 100 <name>.png -o <name>.webp`.
4. Umísti do `public/themes/vesmirna-lod/decor/`.
5. V `themes/themes/vesmirna-lod/index.ts` aktivovat 7 tokenů: `--asset-icon-uvodnik`, `--asset-icon-vytvorit-svet`, `--asset-icon-diskuze`, `--asset-icon-clanky`, `--asset-icon-galerie`, `--asset-icon-napoveda`, `--asset-icon-hospoda`.
6. V `decorations.css` napojit přes selektor `[data-theme="vesmirna-lod"] [data-nav-key="<key>"] [class*="navItemIcon"]` (přesný selektor doladí impl. plán).

---

## Konzistence kontrol — checklist před odsouhlasením

- [ ] Všech 7 ikon má transparentní alfu (žádné bílé/checker pozadí)
- [ ] Stejný úhel světla (zleva-shora ~30°)
- [ ] Stejná barevná paleta (jen povolené hex)
- [ ] Cyan glow + amber accent přítomen v každé
- [ ] Žádný text mimo povolené (jen `?` v napovedu, žádné jiné glyfy)
- [ ] Vector-clean edges — čitelné při 28×28 px
- [ ] Industrial wear medium — ne nové, ne zničené
- [ ] File size <30 KB per ikona
