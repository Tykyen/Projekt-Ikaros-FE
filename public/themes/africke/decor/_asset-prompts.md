# Africký skin „Země předků" — asset prompty

Prompty pro **13 nových AI assetů** skinu *Země předků* (logo + medailon = už dodané uživatelem, background + thumbnail = už existují).

**Cíl:** Sub-saharská prastará Afrika — savana za úsvitem, monolithy, baobaby, akácie, pískovec, patinovaný bronz, kente weave, mudcloth (bògòlanfini), Ašanti adinkra symboly. **NE** Marvel Wakanda futurismus, **NE** Disney Lion King, **NE** safari turismus, **NE** arabský palác (severní Afrika je samostatný skin), **NE** indiánská tribal cik-cak (oddělené skin).

**Generátor:** ChatGPT (DALL-E 3 / GPT-image) — preferred. Alternativy: Midjourney v6.1, Flux. Output: **PNG s alfa-kanálem** (vyjma pozadí, které je už existující WEBP), pak konverze `cwebp -q 90 -alpha_q 100`.

**Reference dodaných materiálů:**
- Logo: [`../../../../assets-source/themes/africke/logo.png`](../../../../assets-source/themes/africke/logo.png) — kente weave horizontal banner (vertikální zlato-bronz proužky na tmavém pozadí), vlevo kulatý medailon s andělím křídlem, vpravo „Projekt Ikaros" v elegantním script fontu (Allura styling), zlato-cream rohové ornamenty
- Medailon: [`../../../../assets-source/themes/africke/medailon.png`](../../../../assets-source/themes/africke/medailon.png) — čtvercový rám z **patinovaného tmavého dřeva s carved bronze diamond ornamenty v rozích** (4-point diamond + triangles motiv), tmavý černo-šedý kamenný/leather vnitřek, velký zlato-cream silhouette anděla s velkým křídlem uprostřed
- Background: [`../../../backgrounds/africke.webp`](../../../backgrounds/africke.webp) — savana za úsvitem, baobaby, monolity s tribal carvingem, hliněné nádoby, malé ohniště, akáciové stromy v dálce, dramatická amber obloha

**Všechny prompty musí respektovat tyto materiály — stejná paleta sandstone + bronze + cream, stejný „carved patinated" styl, stejný typ tmavého dřeva s bronze ornamenty.**

---

## 🎨 STYLE GUIDE (závazné pro všech 13 assetů)

### Reference look

**Inspirace:** Sebastião Salgado (Genesis — savana, kmeny, krajiny black-and-white), Ife/Benin bronze sculpture (12.–16. století Nigérie — patinovaný bronz s ručními detaily), Mali Bògòlanfini (mudcloth — hand-painted geometric mud patterns na natural cotton), Ašanti Adinkra (Sankofa, Gye Nyame, Adinkrahene, Akoma — symbolic stamps), Anglické sepia photographs of African landscapes (Burton, Speke 19. století), Stardew Valley journal artwork (organická melancholie, ne kresleně).

Cíl: **autentická spirituální vážnost prastaré země**, ručně vytvořená texturová hloubka, **NE** plochá vector ilustrace, **NE** kreslený styl, **NE** vector clip-art.

### NE absolutně:

- ❌ Marvel Black Panther / Wakanda sci-fi vibes
- ❌ Disney Lion King kresleně-roztomilé tváře
- ❌ Safari tourism cliche (kakhi outfit, jeep, deštníky)
- ❌ Hollywood „tribal warrior" stereotype (přemrštěné perí, války-paint)
- ❌ Arabský palác / arabesque ornamenty (severní Afrika je `arabsky-svet` skin)
- ❌ Indiánské tribal cik-cak diamondy (`indiane` skin), iron-nail studs (`indiane`), Medicine Wheel pictogramy
- ❌ Maori / polynéské tribal tattoo patterns
- ❌ Egyptian hieroglyphs / pyramidové motivy (jiná kultura)
- ❌ Vector flat ikony / Material Design styling
- ❌ Plastic gloss / chrome reflexe / neon glow
- ❌ Pure black background uvnitř ornamentů — vždy tmavá patinovaná dřevěná nebo kamenná textura
- ❌ Bílá kontura kolem objektů
- ❌ Politicky necitlivá karikatura, žádné stereotypní masky-pop
- ❌ AI-typický „purple gradient sunset" — pozadí scén musí být authentic warm amber/ochre

### Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| **Earth deep** | `#100804` | nejhlubší partie pozadí, hluboké stíny |
| **Earth shadow** | `#2a1408` | hlavní BG tón, zem v noci |
| **Earth laterite** | `#6a2810` | red laterit clay, vzácný accent |
| **Wood dark patina** | `#3a1e08` | tmavé patinované dřevo (rámy) |
| **Wood mid warm** | `#5a3018` | středně teplé dřevo, akáciová kůra |
| **Wood highlight** | `#8a5028` | top-light na dřevě, sandstone medium |
| **Earth ochre** | `#8a5028` | ochra, sandstone tone |
| **Earth dust** | `#c89878` | světlý sandstone, prach |
| **Sand pale** | `#d4a060` | nejsvětlejší sandstone, top-rim na kameni |
| **Bronze deep** | `#5a3210` | tmavý bronz patina |
| **Bronze warm** | `#b87830` | hlavní bronz |
| **Bronze bright** | `#d49850` | top reflex bronzu, hover stavy |
| **Aged gold** | `#c8881a` | zoumračné zlato, ornamenty, ryté detaily |
| **Aged gold bright** | `#e8b840` | jiskra zlata |
| **Horizon dawn** | `#f4a050` | úsvit oranžová, hlavní akcent |
| **Horizon sun** | `#ffd078` | slunce nad horizontem, top jiskra |
| **Sky cobalt** | `#1a3858` | rare accent — noční obloha v zenitu (jen pro success states, NE ornamenty) |
| **Cream** | `#f0e0c0` | krémové cream, text na tmavém, silhouette interiéru |
| **Sandstone gradient** | `#c89878 → #8a5028` | welcome stéla, sandstone tablet ikony |

### Materiály — jak je popsat v promptu

**Patinovaný bronz (corner ornaments, frame highlights):**
> *"hand-cast patinated bronze with warm desert tones (#b87830 highlight to #5a3210 shadow), slight green-brown patina in recesses, top-left rim-light catching raised edges, hand-tooled surface with subtle hammer marks, NO mirror polish, NO modern chrome, authentic Ife/Benin bronze sculpture finish 12th-16th century West African style"*

**Pískovec (welcome stéla, sandstone tablet nav ikony):**
> *"weathered sandstone in warm earth tones (top: pale sand #d4a060, bottom: deeper ochre #8a5028), visible natural grain and subtle erosion lines, top-left rim-light, slightly rough surface texture, NO polished marble, NO modern stone, authentic sun-baked African sandstone slab look"*

**Carved relief (engraved into bronze/sandstone):**
> *"shallow-relief engraving carved into the surface, lines slightly darker than surrounding material (etched recess), tool-marked edges, hand-carved appearance with subtle imperfections, NOT laser-cut, NOT precise machine work"*

**Kente weave (background of logo, accent bands):**
> *"hand-loomed West African kente cloth pattern: vertical stripes alternating aged-gold (#c8881a) and bronze-warm (#b87830) on dark earth-shadow (#2a1408) background, irregular weave variation showing hand-craft, slightly textured fabric appearance, narrow strip woven format"*

**Mudcloth band (bògòlanfini horizontal pattern):**
> *"hand-painted Mali bògòlanfini mudcloth pattern in horizontal strip format: bold geometric shapes (triangles, diamonds, zigzags, hash-marks) in aged-gold (#c8881a) and earth-laterite (#6a2810) on dark mud-dyed background (#2a1408), authentic West African Bambara/Mali style, slightly imperfect hand-painted lines, NO precise repetition"*

**Adinkra symbols (Ašanti symbolic stamps — pro nav ikony):**
> *"authentic Ašanti adinkra symbol carved/stamped in shallow relief, simplified geometric form, traditional Akan symbol-language, NO modern reinterpretation, NO cartoon style"*
> - Sankofa: stylized bird with head turned backward holding an egg (symbol of „looking back to move forward")
> - Gye Nyame: stylized supreme being symbol (curved spiral with crossbars, „except God")
> - Adinkrahene: three concentric circles (chief of adinkra symbols, „leadership/greatness")
> - Akoma: heart-shape with patterned interior („patience and endurance")

**Baobab silhouette:**
> *"silhouette of an ancient baobab tree (Adansonia digitata): thick massive trunk, spreading short stubby branches reaching upward like roots, NO leaves visible, distinctive bottle-shape trunk, weathered character of 1000-year-old tree, dark earth-shadow silhouette against transparent background"*

**Acacia silhouette:**
> *"silhouette of African flat-top acacia (Acacia tortilis or umbrella thorn): horizontal canopy of fine zigzag branches spreading wide, slender trunk, characteristic flat-top umbrella shape, NO heavy leaves, just branching structure, dark earth-shadow silhouette against transparent background"*

**Monolith with carved markings:**
> *"weathered standing sandstone monolith (megalith), roughly rectangular stone slab 2-3m tall, surface engraved with simple geometric tribal markings (concentric circles, parallel lines, spirals — NOT specific adinkra, NOT specific cultural symbols), warm sandstone color (#8a5028 with #d4a060 highlights), top-left rim-light catching the raised carved relief, weathered surface with subtle erosion, ancient mysterious presence"*

### Světelný úhel

**Top-left rim-light** (jednotný se všemi ostatními skiny). Ne front-lit, ne flat. Mírný stín na bottom-right pro hloubku. Akce ohně/slunce zespoda jen u explicitních „fire" assetů.

### Pozadí výstupu

**Transparentní PNG s alfa.** Při generování v ChatGPT zadávat *„fully transparent background, isolated object/element, no scene context, no ground plane"*.

---

## 📦 ASSET BALÍČEK — 13 promptů

### 1️⃣ `corner-tl.webp` — Carved bronze diamond corner ornament

**Rozměry:** 256×256 px (čtverec)
**Pozice v UI:** master pro top-left roh panelů (sidebary, novinky, welcome stéla boční ornamenty). Mirror přes CSS `scaleX/Y` na ostatní 3 rohy.
**Reference:** levý-horní roh dodaného `medailon.png` — **přesně tento styl, žádná improvizace.**

**Prompt (EN):**
> Square corner ornament, top-left orientation, on fully transparent background. Hand-cast patinated bronze L-shaped corner piece in warm desert tones (#b87830 highlight transitioning to #5a3210 in shadow), featuring an authentic West African 4-point diamond motif: a central solid diamond (rhombus) flanked by two smaller triangles pointing outward along each edge, with shallow-relief engraved geometric lines connecting them. Subtle slight green-brown patina in recesses, top-left rim-light catches raised edges in bronze-bright (#d49850), hand-tooled surface with visible hammer marks, NO mirror polish, NO modern chrome finish. Authentic Ife/Benin bronze sculpture style 12th-16th century. Slight wear on prominent edges. Isolated object on fully transparent background, no shadow on ground, no scene context. 256×256 pixels.

---

### 2️⃣ `stele-frame.webp` — Pískovcová stéla rám (volitelný — lze nahradit CSS)

**Rozměry:** 1200×500 px (horizontální obdélník, aspect 16:7)
**Pozice v UI:** rám welcome cardu (vyrytá pískovcová stéla). Pokud bude CSS-only sandstone sufficient, asset je optional.

**Prompt (EN):**
> Wide horizontal weathered sandstone slab frame, 1200×500 pixels, on fully transparent background. Outer rim of the slab: a thick frame (60px wide) of warm sandstone, top edge in pale sand (#d4a060), bottom edge in deeper ochre (#8a5028), with visible natural grain, subtle erosion lines, and slight color variation suggesting sun-bleaching. The center is a clean rectangular opening (cutout) showing transparency — this is where text will be rendered. Top-left rim-light catches the highest portions of the slab. Subtle weathering on corners suggesting age. NO carved decorations on the frame itself (corners are added separately as bronze ornaments). Authentic sun-baked African sandstone slab look, NO polished marble, NO modern stone, NO sharp machine edges. Isolated object, fully transparent center and background, no ground shadow. 1200×500 pixels.

---

### 3️⃣ `mudcloth-band.webp` — Mudcloth horizontal band

**Rozměry:** 1200×48 px (široký horizontální pásek, low-profile)
**Pozice v UI:** dolní hrana welcome stély (vetkaná paměť předků), případně horní okraj novinek panelu.

**Prompt (EN):**
> Wide narrow horizontal band of hand-painted Mali bògòlanfini mudcloth pattern, 1200×48 pixels, on fully transparent background. Background of the band: dark mud-dyed cotton in earth-shadow tone (#2a1408). Foreground pattern: a continuous horizontal repeat of bold authentic West African Bambara/Mali geometric symbols painted in aged-gold (#c8881a) and earth-laterite (#6a2810) — including a sequence of: small solid triangles pointing alternately up/down, diamond shapes, parallel zigzag lines, short hash marks, and small concentric squares. The pattern flows naturally left-to-right without exact mathematical repetition (hand-painted asymmetry, slight imperfections in line thickness). NO perfect symmetry, NO digital precision. Slightly worn appearance suggesting traditional craft. Authentic Mali Bògòlanfini style, NOT Maori, NOT Aztec, NOT generic „tribal pattern". Isolated horizontal band on fully transparent background, no ground shadow. 1200×48 pixels.

---

### 4️⃣ `baobab-corner.webp` — Silueta baobab (left-top BG corner)

**Rozměry:** 440×640 px (vertikální, jen kmen + horní větvení)
**Pozice v UI:** decentní silueta v levém horním rohu BG (opacity 0.18, statická, skryto mobile).

**Prompt (EN):**
> Vertical silhouette of an ancient African baobab tree (Adansonia digitata) viewed from a slight low angle, 440×640 pixels, on fully transparent background. The trunk is massive, thick, and distinctively bottle-shaped — wider at the base, narrowing slightly toward the crown. Upper third shows characteristic short stubby branches reaching upward like exposed roots (the baobab is called „upside-down tree"). NO leaves visible — only the branching structure. The trunk surface shows weathered character of 1000-year-old tree: irregular bulges, vertical fissures, knots. The silhouette should be solid dark earth-shadow color (#2a1408) — a flat fill silhouette, not photographic detail, suitable for opacity overlay in UI. The shape must be clearly recognizable as baobab (not generic tree). Slight top-left rim-light is OPTIONAL (1px brighter edge in wood-highlight #8a5028) for subtle definition. Isolated silhouette on fully transparent background. NO ground, NO horizon line, NO additional elements. 440×640 pixels.

---

### 5️⃣ `acacia-canopy.webp` — Akáciová koruna horizontal strip

**Rozměry:** 1200×120 px (široký horizontal, jen větvení, žádné listí)
**Pozice v UI:** top of topbar (acacia sway animation, 12s, 2° rotation).

**Prompt (EN):**
> Wide horizontal silhouette of an African flat-top acacia tree canopy (Acacia tortilis, „umbrella thorn"), viewed from underneath looking up, 1200×120 pixels, on fully transparent background. The canopy consists of a delicate network of fine zigzag branches spreading horizontally across the entire width, with a characteristic flat-top umbrella shape — wider at the center, gradually thinning toward the edges. NO heavy leaves, NO dense foliage — just the bare structural network of fine wiry branches. A subtle thin slender trunk visible in the lower-center providing structural anchor (about 8% of total height). Silhouette is solid dark wood-mid (#5a3018) — a flat fill, not photographic detail, suitable for opacity overlay in UI. Slightly thicker branches in the center, thinning toward the edges. NO bird, NO sun, NO additional context. Isolated silhouette on fully transparent background. 1200×120 pixels.

---

### 6️⃣ `monolith-watermark.webp` — Silueta monolitu jako watermark

**Rozměry:** 800×600 px (horizontal/vertical orientation)
**Pozice v UI:** pozadí welcome stély (opacity 0.12, position center-right).

**Prompt (EN):**
> A single weathered standing sandstone monolith (megalith), roughly rectangular stone slab approximately 2.5m tall, viewed from a slight three-quarter angle, 800×600 pixels, on fully transparent background. The monolith's surface is engraved with simple ancient tribal markings: 3-4 concentric circles in the upper third, a few parallel horizontal lines in the middle, a single spiral in the lower third — NOT specific adinkra symbols, NOT specific cultural symbols, just generic ancient ceremonial markings. Stone color is warm sandstone (#8a5028 base with #d4a060 highlights catching top-left rim-light, #5a3018 shadows in recesses). The carved markings appear in slightly darker engraved relief (#5a3018). Surface shows weathering: subtle erosion, hairline cracks, slight moss/lichen patina at the base. Top of the monolith is slightly irregular (not perfectly flat — natural break). The silhouette should be primarily mid-tone — designed for use as 12% opacity background watermark. NO ground plane, NO scene context, just the standing stone. Isolated object on fully transparent background, no shadow on ground. 800×600 pixels.

---

### 7️⃣ `icon-uvodnik.webp` — Vycházející slunce nad horizontem (sandstone tablet)

**Rozměry:** 96×96 px (square sandstone tablet)
**Pozice v UI:** nav item „Úvodník".

**Prompt (EN):**
> Small square sandstone tablet, 96×96 pixels, on fully transparent background. The tablet is a slightly weathered square slab of warm sandstone (top in pale sand #d4a060, bottom in deeper ochre #8a5028) with subtly rounded corners and slight edge wear, top-left rim-light catching the highest grain. Engraved into the tablet surface in shallow relief: a stylized **rising sun** — a semicircle (sun emerging from below) at the bottom-center with 7 radiating ray-lines extending upward and outward, each ray ending in a small triangle tip. Below the semicircle, a single horizontal line representing the horizon. The engraved lines appear in slightly darker recess (#5a3018 to bronze-deep #5a3210), with top-left rim-light giving 3D depth to the carving. The sun engraving is centered, occupying ~70% of the tablet's interior. NO color paint on the engraving (just relief). Hand-carved appearance with slight imperfections. Isolated tablet on fully transparent background, subtle 1px drop shadow on bottom-right edge of tablet for slight depth. 96×96 pixels.

---

### 8️⃣ `icon-vytvorit-svet.webp` — Baobab silueta (sandstone tablet)

**Rozměry:** 96×96 px
**Pozice v UI:** nav item „Vytvořit svět" (baobab = strom života, stvoření).

**Prompt (EN):**
> Small square sandstone tablet, 96×96 pixels, on fully transparent background. Same sandstone tablet base as icon-uvodnik (top: pale sand #d4a060, bottom: ochre #8a5028, slightly rounded corners, top-left rim-light, subtle edge wear). Engraved into the tablet surface in shallow relief: a stylized **baobab tree silhouette** — massive bottle-shaped trunk centered on the tablet, with 5 short stubby branches reaching upward like exposed roots at the top (characteristic baobab „upside-down tree" look). NO leaves. The trunk shows 2-3 vertical fissure lines suggesting bark texture. The engraving fills about 75% of the tablet interior, centered. Lines are slightly darker recess (#5a3018), with top-left rim-light giving subtle 3D depth. Hand-carved style, slight imperfections. Isolated tablet on fully transparent background, 1px drop shadow bottom-right. 96×96 pixels.

---

### 9️⃣ `icon-diskuze.webp` — Akoma adinkra (sandstone tablet)

**Rozměry:** 96×96 px
**Pozice v UI:** nav item „Diskuze" (Akoma = „srdce, trpělivost a vytrvalost", symbol diskuze a porozumění).

**Prompt (EN):**
> Small square sandstone tablet, 96×96 pixels, on fully transparent background. Same sandstone tablet base (pale sand top to ochre bottom, slightly rounded corners, top-left rim-light). Engraved into the surface in shallow relief: an **authentic Ašanti Akoma adinkra symbol** — a stylized heart shape (not Western heart, but African adinkra Akoma: a rounded heart-form with bulbous top lobes joined at center, slightly elongated downward into a pointed base). The heart's interior is filled with a small concentric heart-line (2-3px inset from outer edge) and a vertical centerline dividing it. The engraving is centered, occupying ~65% of the tablet interior. Lines in darker recess (#5a3018), top-left rim-light gives 3D depth. NO color painted on the symbol. Authentic Akan adinkra style, NOT Western Valentine's heart, NOT cartoon. Isolated tablet on fully transparent background, 1px drop shadow bottom-right. 96×96 pixels.

---

### 🔟 `icon-clanky.webp` — Papyrus svitek (sandstone tablet)

**Rozměry:** 96×96 px
**Pozice v UI:** nav item „Články".

**Prompt (EN):**
> Small square sandstone tablet, 96×96 pixels, on fully transparent background. Same sandstone tablet base. Engraved into the surface in shallow relief: a stylized **horizontal unrolled scroll** — a long rectangular shape with both ends slightly curled (rolled portions), horizontal lines suggesting written text inside (4-5 short parallel lines occupying the middle of the scroll, mimicking script). The scroll is depicted in side perspective, slightly tilted (about 10°) for visual interest, centered on the tablet, occupying ~70% of the interior. The rolled ends show subtle hatching to suggest paper/papyrus thickness. NO actual readable text, just decorative line-marks. Engraved lines in darker recess (#5a3018), top-left rim-light. Hand-carved style. Isolated tablet on fully transparent background, 1px drop shadow bottom-right. 96×96 pixels.

---

### 1️⃣1️⃣ `icon-galerie.webp` — Stylizované africké oko (sandstone tablet)

**Rozměry:** 96×96 px
**Pozice v UI:** nav item „Galerie".

**Prompt (EN):**
> Small square sandstone tablet, 96×96 pixels, on fully transparent background. Same sandstone tablet base. Engraved into the surface in shallow relief: a stylized **African ceremonial eye** — an almond-shaped eye outline (not Egyptian Eye of Horus, NOT Wedjat — a generic almond shape), with a circular iris in the center and a small circular pupil within the iris. Above the eye, three short radiating lines suggesting eyelashes or sun rays (decorative, sparse). Below the eye, a single curved horizontal line suggesting a cheekbone or ground reference. The composition is centered on the tablet, occupying ~65% of the interior. NO heavy makeup lines, NO Egyptian-specific markings. Engraved lines in darker recess (#5a3018), top-left rim-light. Hand-carved authentic appearance. Isolated tablet on fully transparent background, 1px drop shadow bottom-right. 96×96 pixels.

---

### 1️⃣2️⃣ `icon-napoveda.webp` — Sankofa adinkra (sandstone tablet)

**Rozměry:** 96×96 px
**Pozice v UI:** nav item „Nápověda" (Sankofa = „vrať se a vezmi" — návrat k pramenům moudrosti, perfektní pro help/nápovědu).

**Prompt (EN):**
> Small square sandstone tablet, 96×96 pixels, on fully transparent background. Same sandstone tablet base. Engraved into the surface in shallow relief: an **authentic Ašanti Sankofa adinkra symbol** — a stylized bird standing in profile facing left, with its head dramatically turned 180° backward over its body, holding a small egg/seed in its beak. The bird's body has flowing curves (NOT realistic bird, but symbolic adinkra style with simplified rounded forms). The bird is centered on the tablet, occupying ~70% of the interior. The bird's wing has a single decorative spiral or curl. NO color paint, just relief. Lines in darker recess (#5a3018), top-left rim-light giving 3D depth. Authentic Akan/Ašanti adinkra style — recognizable as Sankofa to those who know the symbol. Isolated tablet on fully transparent background, 1px drop shadow bottom-right. 96×96 pixels.

---

### 1️⃣3️⃣ `icon-hospoda.webp` — Ohniště se 3 kameny (sandstone tablet)

**Rozměry:** 96×96 px
**Pozice v UI:** nav item „Hospoda" (Dimenzionální hospoda — ohniště jako střed setkávání).

**Prompt (EN):**
> Small square sandstone tablet, 96×96 pixels, on fully transparent background. Same sandstone tablet base. Engraved into the surface in shallow relief: a stylized **traditional African three-stone fire pit (jiko)** — three rounded stones arranged in a triangle (one at bottom-left, one at bottom-right, one at the back-top center) with simple stylized flames rising between them (3-4 wavy flame-lines extending upward from the center, slightly asymmetric). NO logs, NO cauldron, NO modern fire pit. Just the three stones and stylized flames. The composition is centered on the tablet, occupying ~75% of the interior. The stones are circular in shape with subtle horizontal hatching for texture. Engraved lines in darker recess (#5a3018), top-left rim-light gives 3D depth. Hand-carved authentic look. Isolated tablet on fully transparent background, 1px drop shadow bottom-right. 96×96 pixels.

---

## 🧾 KONVERZE PNG → WEBP

Po vygenerování všech 13 PNG s alfa (uložte do `assets-source/themes/africke/` jako workspace):

```powershell
# V adresáři assets-source\themes\africke\
foreach ($file in Get-ChildItem *.png) {
  cwebp -q 90 -alpha_q 100 $file.Name -o ($file.BaseName + ".webp")
}

# Pak přesun všech .webp do public/themes/africke/decor/
Move-Item *.webp ..\..\..\public\themes\africke\decor\ -Force
```

Alternativně přes `scripts/finalize-africke-assets.mjs` (bude vytvořen v rámci impl plánu — sharp.js resize + WEBP convert s `alpha_quality 100, quality 90, effort 6`).

Cílový adresář: `public/themes/africke/decor/`

---

## 📋 CHECKLIST PŘED IMPLEMENTACÍ

**User assety (✅ dodáno):**
- [x] `logo.png` → `logo.webp` (~1200×280) — kente weave banner s Allura script „Projekt Ikaros"
- [x] `medailon.png` → `medailon.webp` (~600×600) — patinované dřevo s carved bronze diamond corners

**AI gen assety (⏳ TODO):**
- [ ] `corner-tl.webp` (256×256) — carved bronze diamond corner ornament
- [ ] `stele-frame.webp` (1200×500) — pískovcová stéla rám *(volitelné — lze nahradit CSS)*
- [ ] `mudcloth-band.webp` (1200×48) — bògòlanfini horizontal band
- [ ] `baobab-corner.webp` (440×640) — silueta baobab pro BG levý horní roh
- [ ] `acacia-canopy.webp` (1200×120) — silueta akáciových větví v topbaru
- [ ] `monolith-watermark.webp` (800×600) — silueta monolitu pro welcome stélu BG
- [ ] `icon-uvodnik.webp` (96×96) — vycházející slunce nad horizontem (sandstone tablet)
- [ ] `icon-vytvorit-svet.webp` (96×96) — baobab silueta (sandstone tablet)
- [ ] `icon-diskuze.webp` (96×96) — Akoma adinkra (sandstone tablet)
- [ ] `icon-clanky.webp` (96×96) — papyrus svitek (sandstone tablet)
- [ ] `icon-galerie.webp` (96×96) — africké ceremoniální oko (sandstone tablet)
- [ ] `icon-napoveda.webp` (96×96) — Sankofa adinkra (sandstone tablet)
- [ ] `icon-hospoda.webp` (96×96) — three-stone fire pit (sandstone tablet)

**Celkem 13 PNG → WEBP**, odhad ~350 KB po optimalizaci.

---

## 🎯 ORIGINALITY GUARANTEE — co tento balík odlišuje od ostatních skinů

| Skin | Materiál corner | Material welcome | Decor pásek | Asset signature |
|------|-----------------|------------------|-------------|-----------------|
| **africke (Země předků)** | **Carved bronze diamond** | **Vyrytá pískovcová stéla** | **Mudcloth band** | Baobab + acacia silhouette, Sankofa/Akoma adinkra, monolith watermark |
| indiane (Strážci horizontu) | Iron L-bracket + nail studs | Oválný šamanský buben | Petroglyph divider | Drum pictograph, feather stamp, fire stones |
| severske-runy | Wolfshield iron | Rune-stone tablet | Wolfshield divider | Rune circle, knot seal, welcome arch |
| nemrtvi | Skull-stone iron | Bone tablet | Skull divider | Skull arch |
| hospoda | Brass + iron clasp | Wooden tavern board | Beer foam | Brass stamp, table clutter |

**Žádný překryv materiálů, ornamentů, symbolů ani siluet.** Adinkra symboly jsou unikátní pro africké, baobab + acacia siluety nenajdou paralelu nikde jinde, mudcloth band není iron-banded ani beer-foam.

---

**Status:** ⏳ **Prompty hotové.** Připraveno pro uživatele k generování v ChatGPT / DALL-E 3 / Midjourney.

Po dodání všech 13 PNG → spustit `scripts/finalize-africke-assets.mjs` → impl plán `plan-1.0q.md`.
