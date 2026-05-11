# Indiánský skin — asset prompty

Prompty pro **13 nových AI assetů** skinu *Strážci horizontu* (logo + medailon + background = už dodané/existují).

**Cíl:** Indiánská prérijní kultura *před* příchodem západu. Žádný saloon, žádné kovbojské motivy, žádné karty. Čisté Native-American prairie spiritualita — tipi, totemy, dreamcatchery, peří, korálky, bizoni, orli, šamanské bubny, petroglyfy.

**Generátor:** ChatGPT (DALL-E 3) — preferred. Alternativy: Midjourney v6.1, Flux. Output: PNG s alfa-kanálem, pak konverze `cwebp -q 90 -alpha_q 100`.

**Reference dodaných materiálů:**
- Logo: [`../../../../assets-source/themes/indiani/logo.png`](../../../../assets-source/themes/indiani/logo.png) — tmavá patinovaná dřevěná cedule, vyřezané tribal ornamenty, železné rohové nýty, anděl s křídly v kruhovém medailonu vlevo
- Medailon: [`../../../../assets-source/themes/indiani/medailon.png`](../../../../assets-source/themes/indiani/medailon.png) — čtvercový dřevěný rám se železnými rohy + nail studs + carved diamond pattern + černý vnitřek s bílou siluetou anděla
- Background: [`../../../backgrounds/indiane.webp`](../../../backgrounds/indiane.webp) — prérie soumrak, hory, totemy, tipi, dreamcatcher

**Všechny prompty musí respektovat tyto materiály — stejná paleta, stejný „carved tribal" styl, stejný typ patinovaného dřeva.**

---

## 🎨 STYLE GUIDE (závazné pro všech 13 assetů)

### Reference look
**Inspirace:** Lakota / Dakota / Cheyenne tradiční umění + moderní fantasy art (Frank Frazetta prairies, Howard Terpning paintings) + Stardew Valley journal artwork. Cíl: autentická spirituální vážnost, ručně malovaná texturová hloubka.

**NE:**
- ❌ Disney Pocahontas / „Hollywood Indian" stereotyp
- ❌ Saloon / Wild West / cowboy / revolver / playing cards
- ❌ Neon turquoise (jen tlumená šalvějová `#5fc8d0`)
- ❌ Vector flat ikony
- ❌ Plastic gloss / chrome reflexe
- ❌ Generický „tribal tattoo" maori/polynéský pattern
- ❌ Bílá kontura kolem objektů
- ❌ Pure black background uvnitř medailonů — vždy tmavá patinovaná dřevěná nebo kožená texture

### Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| **Burnt-earth deep** | `#1a0c04` | nejtmavší partie pozadí, hluboké stíny |
| **Burnt-earth primary** | `#2a1208` | hlavní BG, tmavá zem prérie po soumraku |
| **Wood dark patina** | `#3a1e08` | tmavé patinované dřevo (loga + medailony) |
| **Wood mid warm** | `#5a3318` | středně teplé dřevo, carved okraje |
| **Wood highlight** | `#8a5828` | top-light na dřevě, grain highlights |
| **Iron-stud dark** | `#1a1410` | železné nýty, hluboké partie |
| **Iron-stud highlight** | `#4a4238` | světlejší partie nýtů, top reflex |
| **Buffalo-blood** primary | `#c8501c` | hlavní rust-orange akcent, plamen, krev země |
| **Buffalo-blood bright** | `#e86028` | světlejší partie ohně, hover stavy |
| **Flame** | `#ff8030` | nejteplejší jiskra plamene |
| **Prairie gold** | `#d4a050` | zlatá zoumračná, ornamenty, hvězdy |
| **Prairie gold bright** | `#f0c870` | top jiskra zlata |
| **Sage turquoise** | `#5fc8d0` | šalvějová modrozelená (tlumená!), korálky, pera akcent |
| **Sage turquoise deep** | `#3a8088` | hluboká šalvějová, stíny tyrkysu |
| **Cream leather** | `#f0e0c0` | krémová napnutá kůže (bubny, svitky) |
| **Bone white** | `#e8d8b8` | pictogramy, kosti, lebky |

### Materiály — jak je popsat v promptu

**Patinované dřevo (rámy, medailony, nav ikony):**
> *"dark aged hand-carved wood with subtle warm wood-grain texture, deep brown patina (#3a1e08 to #5a3318), top-left rim-light catching highest grain, weathered surface, no plastic gloss, no varnish, hand-carved tribal diamond and zigzag patterns along edges"*

**Železné nýty (rohové studs):**
> *"hand-forged iron studs with dark patina (#1a1410), slightly rusted, top-left rim-light, four small nail heads per corner, weathered industrial look"*

**Carved tribal ornament:**
> *"tribal diamond-zigzag pattern carved into the wood, geometric repetition (small diamonds alternating with crossing lines), shallow relief carving, Lakota-Cheyenne traditional motif, NOT maori, NOT celtic"*

**Napnutá kůže (drum, svitky):**
> *"stretched buffalo or deer hide, cream-tan color (#f0e0c0), subtle natural wrinkles, hand-stitched edges with leather thongs, soft top-light, slightly translucent at edges where stretched thin"*

**Korálky (beads):**
> *"small round seed beads in red, sage turquoise (#5fc8d0), prairie gold (#d4a050), and cream — handcrafted appearance, slightly imperfect spacing, threaded on dark leather cord"*

**Pictogramy (bizon, orel, slunce, had):**
> *"painted pictograph in iron-oxide red (#c8501c) and bone white (#e8d8b8), flat shapes, simplified silhouettes, traditional Plains-Indian rock-art style, slightly worn/faded as if painted by hand on hide"*

**Petroglyfy (na kameni):**
> *"shallow pecked rock-art on weathered sandstone, simplified geometric figures (sun spiral, buffalo, hand-print, antelope), warm earth-tone stone (#8a5828 with darker shadows), authentic Anasazi/Fremont style"*

### Světelný úhel
**Top-left rim-light** (jednotný se všemi ostatními skiny). Ne front-lit, ne flat. Mírný stín na bottom-right pro hloubku.

### Pozadí výstupu
**Transparentní PNG s alfa.** Při generování v ChatGPT zadávat *„transparent background, isolated object, no scene"*.

---

## 📦 ASSET BALÍČEK — 13 promptů

### 1️⃣ `corner-tl.webp` — rohový železný stud + tribal carving

**Rozměry:** 200×200 px (čtverec), PNG → WEBP
**Pozice v UI:** master pro top-left roh panelů. Mirror přes CSS `scaleX/Y` na ostatní 3 rohy.
**Reference:** levý-horní roh dodaného `medailon.png` — přesně tento styl.

**Prompt (EN):**
> Square corner ornament, top-left view, on transparent background. Heavy dark patinated hand-carved wood corner piece in deep brown (#3a1e08), with a wrought-iron L-shaped bracket with 4 hand-forged round nail studs (#1a1410) in the corner. The wood is carved with shallow-relief Lakota-Cheyenne tribal diamond-zigzag pattern running along both edges meeting at the corner. Top-left rim-light catches the highest grain in warm wood-highlight (#8a5828). Weathered surface, subtle warm wood-grain texture, NO varnish gloss, NO modern hardware. Isolated object on fully transparent background, no shadow on ground. Authentic Plains-Indian craftsman style. 200×200 pixels.

---

### 2️⃣ `medailon-frame.webp` — kruhový dřevěný rám pro welcome buben

**Rozměry:** 800×600 px (horizontální oval ~4:3), PNG → WEBP
**Pozice v UI:** rám kolem welcome card (šamanský buben). Vnitřek **transparentní** (CSS přidá kůži + text).
**Reference:** vzít čtvercový tvar z dodaného `medailon.png`, ale **transformovat na oválný/kruhový rám** se stejnými materiály (dřevo + železné rohy + nail studs + tribal carving).

**Prompt (EN):**
> Horizontal oval (4:3 ratio) wooden frame for a shaman's drum, viewed straight-on, on transparent background. Deep patinated hand-carved dark wood (#3a1e08) with subtle wood grain and warm top-left rim-light (#8a5828). Along the outer edge: continuous Lakota-Cheyenne tribal diamond-zigzag pattern carved in shallow relief. Four wrought-iron mounting brackets at 12, 3, 6, 9 o'clock positions, each with 3 hand-forged nail studs (#1a1410). The frame is ~80px thick. Inside the oval: completely transparent (the drum skin will be added separately in CSS). Weathered, authentic, no varnish, no plastic gloss. Plains-Indian craftsman style. Isolated on fully transparent background. 800×600 pixels.

---

### 3️⃣ `icon-uvodnik.webp` — Vycházející slunce

**Rozměry:** 128×128 px (square), PNG → WEBP
**Pozice:** nav item „ÚVODNÍK"
**Symbolika:** počátek, světlo, nový den

**Prompt (EN):**
> Circular wooden medallion icon, 128×128 pixels, on transparent background. Dark patinated hand-carved wood disc (#3a1e08) with thin tribal diamond-zigzag border along the rim, four tiny iron nail studs at compass points (N/E/S/W). Center of medallion: a stylized rising sun pictograph in iron-oxide red (#c8501c) and prairie gold (#d4a050) — semicircle of the sun on the horizon with five radiating rays, painted in traditional Plains-Indian rock-art style (flat shapes, slightly worn, hand-painted look). Soft top-left rim-light. Isolated, NO white outline, NO modern logo style. Authentic, hand-crafted, weathered.

---

### 4️⃣ `icon-vytvorit-svet.webp` — Tipi

**Rozměry:** 128×128 px
**Symbolika:** stavění, založení, domov

**Prompt (EN):**
> Circular wooden medallion icon, 128×128 pixels, transparent background. Dark patinated wood disc (#3a1e08), tribal zigzag rim, four iron nail studs at N/E/S/W. Center pictograph: a tipi (cone-shaped tent) in cream hide color (#f0e0c0) with crossed wooden poles emerging from the top, painted decoration of a simple red sun on the side (#c8501c), small entrance flap at bottom. Traditional Plains-Indian style, hand-painted, slightly worn. Top-left rim-light. Isolated, no white outline.

---

### 5️⃣ `icon-diskuze.webp` — Kruh rady (council circle)

**Rozměry:** 128×128 px
**Symbolika:** shromáždění, rozhovor, kmenová rada

**Prompt (EN):**
> Circular wooden medallion icon, 128×128 pixels, transparent background. Dark patinated wood disc (#3a1e08), tribal zigzag rim, four iron nail studs at N/E/S/W. Center pictograph: top-down view of a council circle — 6-8 small simplified human figures (silhouettes) seated in a ring around a central campfire (red-orange flame #c8501c with prairie-gold #d4a050 sparks). Figures in cream/bone white (#e8d8b8), flat shapes, traditional rock-art style. Top-left rim-light on the wood. Isolated, no white outline.

---

### 6️⃣ `icon-clanky.webp` — Kožený svitek / story-stick

**Rozměry:** 128×128 px
**Symbolika:** příběhy, zapsaná moudrost

**Prompt (EN):**
> Circular wooden medallion icon, 128×128 pixels, transparent background. Dark patinated wood disc (#3a1e08), tribal zigzag rim, four iron nail studs at N/E/S/W. Center: a partially-unrolled leather scroll in cream-tan (#f0e0c0) tied with a leather cord, with three small painted pictographs visible on the unrolled section — a buffalo silhouette, a sun spiral, and a hand-print, all in iron-oxide red (#c8501c). Authentic Plains-Indian winter-count style. Hand-painted feel, slightly worn. Top-left rim-light. Isolated.

---

### 7️⃣ `icon-galerie.webp` — Petroglyf

**Rozměry:** 128×128 px
**Symbolika:** obrazy, vyrytá paměť

**Prompt (EN):**
> Circular wooden medallion icon, 128×128 pixels, transparent background. Dark patinated wood disc (#3a1e08), tribal zigzag rim, four iron nail studs at N/E/S/W. Center: a small rectangular slab of weathered sandstone (warm earth-tone #8a5828) with three petroglyphs pecked into the surface — a spiral sun symbol, a stylized antelope silhouette, and a hand-print — all in slightly darker engraved relief (#5a3318). Authentic Anasazi/Fremont rock-art style. Top-left rim-light on both wood and stone. Isolated.

---

### 8️⃣ `icon-napoveda.webp` — Sova (moudrost)

**Rozměry:** 128×128 px
**Symbolika:** vědění, noční průvodce, nápověda

**Prompt (EN):**
> Circular wooden medallion icon, 128×128 pixels, transparent background. Dark patinated wood disc (#3a1e08), tribal zigzag rim, four iron nail studs at N/E/S/W. Center: a stylized owl pictograph in cream-bone (#e8d8b8) with iron-oxide red (#c8501c) feather details and prairie-gold (#d4a050) round eyes, perched facing forward. Traditional Plains-Indian symbolic art style, flat shapes, slightly worn hand-painted look. Top-left rim-light on the wood. Isolated, no white outline.

---

### 9️⃣ `icon-hospoda.webp` — Táborový oheň

**Rozměry:** 128×128 px
**Symbolika:** shromaždiště, oheň komunity (analogie „hospoda" → „kruh ohně")
**Pozn.:** název klíče zůstává `hospoda` kvůli kompatibilitě napříč skiny.

**Prompt (EN):**
> Circular wooden medallion icon, 128×128 pixels, transparent background. Dark patinated wood disc (#3a1e08), tribal zigzag rim, four iron nail studs at N/E/S/W. Center: a campfire pictograph — three crossed wooden logs (dark wood #5a3318) at the base with bright flames rising above in flame-orange (#ff8030), buffalo-blood red (#c8501c), and prairie-gold (#d4a050) sparks. Glowing embers at the base. Traditional rock-art simplified style. Top-left rim-light. Isolated.

---

### 🔟 `drum-pictograph.webp` — Pictogramy uvnitř bubnu

**Rozměry:** 720×540 px (horizontální oval, mírně menší než `medailon-frame`)
**Pozice:** překryv uvnitř welcome bubnu, **pod text vrstvou** — tvoří „napnutou kůži s pictogramy"
**Pozn.:** Pictogramy musí být **subtle / faded**, aby text byl čitelný přes ně (opacity ~0.45 v CSS).

**Prompt (EN):**
> Horizontal oval stretched buffalo hide drum-skin viewed straight-on, cream-tan color (#f0e0c0) with natural slight wrinkles and weathered patina. On the hide surface: four faded hand-painted Plains-Indian pictographs in iron-oxide red (#c8501c) and bone-white (#e8d8b8), arranged in the four cardinal Medicine Wheel positions:
> - NORTH (top center): stylized wolf silhouette
> - EAST (right center): eagle in flight with spread wings
> - SOUTH (bottom center): coiled serpent
> - WEST (left center): standing buffalo
>
> All pictographs slightly worn, painted in flat shapes traditional rock-art style, faded as if 100 years old. Center of the drum-skin: a small spiral sun symbol in prairie-gold (#d4a050). Soft top-left light. No frame (frame is a separate asset). Transparent background outside the oval. 720×540 pixels.

---

### 1️⃣1️⃣ `decor-fire-stones.webp` — Kruh kamenů s ohněm

**Rozměry:** 1200×300 px (široký horizontální, low-profile)
**Pozice:** dekorativní pásek dolního okraje obrazovky (jako hospoda má `decor-table-clutter`)

**Prompt (EN):**
> Wide low horizontal scene, 1200×300 pixels, transparent background. Foreground: a ring of 8-10 weathered prairie stones in warm earth-tones (#5a3318 to #8a5828) arranged in a fire-circle, viewed from a slight elevated angle. Inside the circle: a low burning campfire with flames in buffalo-blood red (#c8501c), flame-orange (#ff8030), and prairie-gold (#d4a050) sparks rising. Glowing embers at the base. Small wisps of warm smoke curling up. Scattered around the stones: 2-3 small bone fragments, a few wild prairie grass tufts, a single eagle feather lying on the ground. Authentic, weathered, hand-crafted feel. Top-left rim-light on stones. Cinematic dusk lighting. Isolated on fully transparent background — no ground plane, no scene context.

---

### 1️⃣2️⃣ `feather-stamp.webp` — Stylizované pero

**Rozměry:** 128×128 px (square)
**Pozice:** ikona uvnitř „+" tlačítek (PŘIDAT NOVINKU / PŘIDAT SVĚT) — analogie hospoda `brass-stamp`

**Prompt (EN):**
> Single stylized eagle feather, 128×128 pixels, transparent background, vertical orientation. Feather painted in iron-oxide red (#c8501c) at the tip transitioning down to cream-bone (#e8d8b8) in the middle with dark patina (#3a1e08) at the base. A small leather cord wraps the base with three sage-turquoise seed beads (#5fc8d0). Slight curve, hand-crafted, slightly worn. Top-left rim-light. Authentic Plains-Indian ceremonial feather style, NOT Hollywood headdress. No white outline. Isolated.

---

### 1️⃣3️⃣ `petroglyph-divider.webp` — Vyřezané glyfy na kameni

**Rozměry:** 800×80 px (široký, štíhlý)
**Pozice:** section divider mezi sekcemi v sidebaru (NAVIGACE / VESMÍRY / CHAT)

**Prompt (EN):**
> A horizontal weathered sandstone slab, 800×80 pixels, in warm earth-tone (#8a5828 with darker patina #5a3318), with shallow pecked petroglyphs in a row across the surface. Petroglyphs from left to right: spiral sun, stylized buffalo, hand-print, eagle with spread wings, antelope. All pecked in slightly darker engraved relief (#3a1e08), authentic Anasazi/Fremont rock-art style, slightly worn. Top-left rim-light. The stone has natural irregular edges (not a clean rectangle). Isolated on fully transparent background.

---

## 🧾 KONVERZE PNG → WEBP

Po vygenerování všech 13 PNG s alfa:

```powershell
# V adresáři public\themes\indiane\decor\
foreach ($file in Get-ChildItem *.png) {
  cwebp -q 90 -alpha_q 100 $file.Name -o ($file.BaseName + ".webp")
}
```

Cílový adresář: `public/themes/indiane/decor/`

---

## 📋 CHECKLIST PŘED IMPLEMENTACÍ

- [ ] `corner-tl.webp` (200×200)
- [ ] `medailon-frame.webp` (800×600, oval, transparent inside)
- [ ] `icon-uvodnik.webp` (128×128, slunce)
- [ ] `icon-vytvorit-svet.webp` (128×128, tipi)
- [ ] `icon-diskuze.webp` (128×128, council circle)
- [ ] `icon-clanky.webp` (128×128, scroll)
- [ ] `icon-galerie.webp` (128×128, petroglyph)
- [ ] `icon-napoveda.webp` (128×128, owl)
- [ ] `icon-hospoda.webp` (128×128, campfire)
- [ ] `drum-pictograph.webp` (720×540, 4 medicine wheel pictogramy)
- [ ] `decor-fire-stones.webp` (1200×300)
- [ ] `feather-stamp.webp` (128×128)
- [ ] `petroglyph-divider.webp` (800×80)

---

## 🎯 KONZISTENCE BALÍKU

**Co musí být stejné napříč všemi 13 assety:**
1. Tmavé patinované dřevo `#3a1e08` jako base materiál (pokud asset obsahuje dřevo)
2. Tribal zigzag-diamond carving v okrajích (Lakota-Cheyenne styl, NE maori/celtic)
3. Železné nail studs `#1a1410` na rozích / orientačních bodech
4. Top-left rim-light (jednotný světelný úhel)
5. Buffalo-blood `#c8501c` jako primární akcent
6. Cream-bone `#f0e0c0` až `#e8d8b8` pro pictogramy
7. Sage turquoise `#5fc8d0` **VZÁCNĚ** (jen detail v korálcích / per)
8. Žádné moderní prvky, žádné vector flat, žádný plastic gloss
9. **Transparent background** — všechny assety musí být izolované
10. Autentický „hand-crafted, weathered, 100 let starý" feel
