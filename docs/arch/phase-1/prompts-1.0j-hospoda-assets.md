# Hospoda skin — asset prompty (1.0j)

> **STAV (2026-05-10):** ⏳ čeká na generování. **Asset folder:** `assets-source/themes/hospoda/` (logo + medailon dodává user, 11 AI assetů níže).

Seznam **11 AI assetů** skinu Hospoda:
- 1× corner ornament (TL master, mirror přes CSS na zbylé 3 rohy)
- 7× navigační dřevěné medailony (Úvodník, Vytvořit svět, Diskuze, Články, Galerie, Nápověda, Hospoda)
- 1× decor-table-clutter (atmosférický spodní pás — kostky/mince/mapa)
- 1× iron-clasp-divider (železný pás-oddělovač sekcí)
- 1× brass-stamp-ikaros (mosazné razidlo pro CTA)

> **Background neměníme** (rozhodnutí user) — používáme existující `public/themes/backgrounds/hospoda.webp`.
> **Logo + medailon** dodává user do `assets-source/themes/hospoda/logo.png` + `medailon.png` — bez promptu.

**Styl skinu:** středověká krčma "U Letícího Orla" s warm hearth atmosférou — *tmavý dub + kovaná mosaz + železné pásy + vínová heraldika + krčmářský papír*. Atmosféra žitá, lived-in, kamarádská, s teplem ohniště.

**Generátor:** ChatGPT (GPT-4o image gen) nebo Midjourney v6.1. Output: PNG s alfou, pak `cwebp -q 90 -alpha_q 100`.

**Reference logo + medailon (dodané user):** [`../../../assets-source/themes/hospoda/`](../../../assets-source/themes/hospoda/) — držet **stejnou paletu a světelný úhel** (top-left rim-light) jako tyto.

---

## 🎨 STYLE GUIDE (závazné pro všechny assety)

Nedodržení = inkonzistentní set. ChatGPT/MJ často „uteče" do generic fantasy nebo sklouzne k pergamen-stylu (zlato + vosk) — proto explicitně vyjmenované zákazy.

### Reference look
**Inspirace:** Skyrim Whiterun tavern interior × Witcher 3 Inn at the Crossroads × historické krčmářské cedule 14.–17. století × Stardew Valley Stardrop Saloon (warm cozy palette + hand-painted feel).

**Cíl:** lived-in tavern handcrafted feel, středověká autentičnost, ručně vyřezávané dřevo + tepaná mosaz + kovaná železo.

**NE:** Hogwarts Tří košťata. NE generic D&D inn. NE chrámový gotický chlad. NE Disney medieval kitsch. NE moderní bar / pub. NE Game of Thrones grim dark. NE pergamen / wax seal feel (to je pergamen skin).

### Klíčové odlišení od pergamen skinu

Pergamen = klášterní iluminace = **zlato + vosk + pergamen + jemná pera**.
Hospoda = krčmářská útulnost = **mosaz + železo + dub + kostky/korbele**.

| Aspekt | Pergamen | Hospoda |
|---|---|---|
| Hlavní kov | soft brushed antique gold (#d4a946) | warm tepaná mosaz (#d4a050) |
| Sekundární kov | žádný | wrought iron (#2a2620) |
| Hlavní material | wax seals + parchment | wood discs + iron straps |
| Atmosféra | tichá knihovna | hlučná hospoda |
| Symboly | iluminované initials, manuscript | tavern objects (mug, dice, lamp) |
| Edge style | jemná zlatá hairline | tepaná mosazná hrana s viditelnou kladívkovou stopou |

### Master barevná paleta (přesné hex kódy)

| Role | Hex | Použití |
|---|---|---|
| **Wood dark** primary | `#2c1a0a` | tmavý dub kotoučů, panelů |
| **Wood mid** | `#4a2e15` | osvětlený dub, středy ornamentů |
| **Wood highlight** | `#7a5028` | top-light na dřevě, kontrast |
| **Brass base** primary | `#8a6428` | mosaz hairline, okraje, kohoutky |
| **Brass shine** | `#d4a050` | top-light na mosazi, jiskra |
| **Brass deep** | `#5a4018` | hluboké brass shadow, recessed |
| **Iron cold** | `#2a2620` | wrought iron straps, hlavičky nytů |
| **Iron warm** | `#3a3128` | osvětlené železo, kovaná textura |
| **Hearth amber** | `#d4944a` | plamen-akcent, lampy, ohniště |
| **Hearth glow** | `#ffb260` | top-light na ohni, jiskra plamene |
| **Hearth flame** | `#ff7028` | jádro plamene (jen pro lampu/svíčku icon) |
| **Banner burgundy** | `#8a1520` | vínová na pivní etiketě, vosková pečeť na dopisu |
| **Banner burgundy bright** | `#b01828` | top-light na vínové |
| **Parch warm** | `#f0deaa` | krčmářský papír, mapa, dopis |
| **Parch aged** | `#e8d4a0` | tmavší aged paper |
| **Ale amber** | `#c0843e` | pivo v korbeli |
| **Ale foam** | `#f4e8c4` | pivní pěna, krémová |
| **Ink black** | `#1a0e04` | hluboké stíny, kresba na dopisu |

**Zakázané barvy:**
- ❌ neonová červená / oranž (oheň je *teplý přírodní*, ne neon)
- ❌ tyrkysová / cyan / fialová (to je magie / sci-fi skin)
- ❌ syté žluté kanárkové (mosaz musí být *teplá*, ne kýčovitě žlutá)
- ❌ čistě bílá zářící (`#ffffff` — kromě malého reflexního bodu na mosazi nebo pivní pěně)
- ❌ černá obrysová linka — vždy brass-deep `#5a4018` nebo iron `#2a2620` hairline místo black stroke
- ❌ zelená (to je priroda skin)
- ❌ modrá (to je modre-nebe / vesmirna-lod skin)
- ❌ **soft brushed antique gold #d4a946** (to je pergamenová zlatá — hospoda používá WARM brass #d4a050, ne stejné!)

### Materiály

**Tmavý dub (kotouče, deska, sud):**
> *"dark aged oak (#2c1a0a base, #4a2e15 mid-tone, #7a5028 top-highlight) with subtle warm wood-grain texture, hand-painted storybook style, soft top-left light catching the highest grain ridges, no plastic gloss, no varnish shine, slightly worn handcrafted feel"*

**Mosaz (okraje, hřeby, kohoutek, razidlo):**
> *"warm tepaná brass (#8a6428 base with #d4a050 top-light highlights and #5a4018 deep recessed shadow), visible hammered/forged texture (small irregular dimples from forging hammer), warm rim-light from top-left, hand-painted storybook style, no chrome reflection, no neon shine, no perfect mirror polish — handcrafted utilitarian metal"*

**Wrought iron (pásy, nity, sponky):**
> *"dark wrought iron (#2a2620 base with #3a3128 worked highlights), visible hammer-strike marks on the surface, slightly irregular thickness suggesting hand-forging, matte finish (no shine), warm top-left rim-light just catching the highest ridges, hand-painted storybook style"*

**Hearth flame / lampa:**
> *"warm amber flame glow (#d4944a core, #ffb260 brightest center, #ff7028 hot edge), gentle radial light, soft halo around the flame, hand-painted storybook style, no harsh sharp edges, no electric blue, no smoke trails"*

**Krčmářský papír (dopis, mapa, etiketa):**
> *"warm cream parchment (#f0deaa primary with #e8d4a0 aged edges and #c8a878 darker stained spots), slight irregular handcut edges, occasional small ink stain or beer ring (subtle), hand-painted storybook style, no harsh shadows"*

**Pivo amber:**
> *"warm amber ale (#c0843e body color, slightly translucent showing slight gradient darker at bottom), small foam crest on top (#f4e8c4 cream foam with subtle bubbles), hand-painted storybook style, no neon, no glow, no carbonation fizz lines"*

### Světelný úhel

**Vždy top-left rim-light.** Stín dolů-vpravo (jemný, nikoli ostrý). Důvod: musí ladit s logem a medailonem (dodanými user) + s pergamen sourozenci, kde je světlo také odshora-zleva.

### Kompozice (pro ikony / medailony)

- Subjekt **centrovaný v rámu**, žádný offset
- **Žádný drop-shadow do rámu** — alfa kanál, finální stín přidá CSS
- **Žádný frame / border** kolem subjektu (kromě dřevěného kotouče u nav medailonů, kde je hairline součást subjektu)
- Subjekt vyplňuje cca **75 % plochy** ikony — okolo je transparentní vzduch

### Co NESMÍ být v žádné ikoně

- ❌ text, písmena, číslice (kromě „IKAROS" na razidle pokud čitelné — viz spec)
- ❌ podpis autora / watermark
- ❌ pixely (vector-clean, ale ne flat — hand-painted)
- ❌ frame / box / border okolo (kromě dřevěného disku u medailonů)
- ❌ sytá svítící glow aura (skin je teplý, ne magický)
- ❌ obličeje, postavy, lebky (kromě portrétu uvnitř rámu pro icon-galerie — viz tam)
- ❌ čistá symetrie — handcrafted znamená *lehkou* nedokonalost (ručně tepaný kov, vyřezávaný dub)
- ❌ wax seal symbolika (to je pergamen-only)
- ❌ illuminated calligraphy (to je pergamen-only)

---

## 📦 ASSET 1/11 — `corner-tl.png` (Master TL roh)

**Účel:** rohový ornament panelů (sidebar, welcome, novinky). 1 master roh, mirror přes CSS scaleX/Y na ostatní 3.
**Cílová cesta:** `public/themes/hospoda/decor/corner-tl.webp`
**Velikost:** 256×256 (transparentní pozadí, alfa)
**Pozice asset:** ornament v levém horním rohu plochy, ostatní 75 % canvas = transparentní

### Prompt
```
A medieval tavern wooden corner brace occupying the top-left corner of a 256x256 square canvas (other 75% of canvas is transparent). The brace is hand-carved dark aged oak (#2c1a0a base, #4a2e15 mid-grain, #7a5028 top-highlight on the carved edges) shaped as an L-bracket reinforcing the corner. Across the brace runs a single wrought iron strap (#2a2620 base with #3a3128 hammered highlights, visible hammer-strike marks) running diagonally inward, riveted to the wood with three brass studs (#8a6428 base with #d4a050 top-light) — one stud near the outer corner, two near the inner end of the strap. The wood shows visible carved grain texture and slight tool marks suggesting handcraft. Warm rim-light from top-left, hand-painted storybook style reminiscent of Skyrim tavern décor and historic medieval ironwork, no harsh shadows, no text or letters, no border around the brace itself, fully transparent background outside the brace shape. --style raw --ar 1:1 --v 6.1
```

### Negative
`flat vector, neon, glow, runes, calligraphy, latin letters, full square frame, four corners (only top-left), photorealistic 3D render, chrome metal, plastic shine, art deco, geometric celtic knot, cyan, purple, green, wax seal, gold leaf, illuminated manuscript, parchment, soft brushed gold #d4a946, pergamen style`

### Schvalovací kritéria
- [ ] Ornament zaujímá pouze TL roh (~25 % plochy), zbytek transparentní
- [ ] Vyřezávaný dub + železný pás + 3 mosazné hřeby — všechny 3 materiály jasně rozlišitelné
- [ ] Hand-carved feel — ne geometricky perfect, lehce nedokonalé proporce
- [ ] Po CSS mirror scaleX(-1) na TR roh nevypadá podivně (asymetrie tvaru zachována, ale ne anti-symetrický motiv)
- [ ] Žádné wax seal nebo gold flourishes (to je pergamen — must look distinctly tavern)

---

## 📦 ASSETS 2–8/11 — 7× NAVIGAČNÍ DŘEVĚNÉ MEDAILONY (sjednocený formát)

**Účel:** 7 unikátních medailonů pro nav-itemy. **Sdílí formát**, mění se symbol vyrytý uvnitř.
**Cílová cesta:** `public/themes/hospoda/decor/icon-<key>.webp`
**Velikost:** 256×256 (transparentní pozadí, alfa)

### Společný formát (závazný pro všech 7)

```
Kruhový dřevěný medailon (cca 80 % plochy canvas, centrovaný).
Wood dark base (#2c1a0a) with subtle wood-grain texture, mid-tone (#4a2e15) ridges, top-highlight (#7a5028) catching the carved edge.
Slightly irregular circular edge (handcarved oak, ne perfect circle).
Tepaná mosazná hairline (#8a6428 base + #d4a050 top-light) okolo medailonu, viditelné kladívkové stopy.
Uvnitř: vyrytý reliéf symbolu — recessed (negative space) ve dřevě, středy reliéfu zvýrazněné mosaznou patinou (#d4a050 jiskra).
Top-left rim-light na dřevě i na mosazi, jemný stín dolů-vpravo (alfa, ne CSS).
Background transparent.
```

### Prompt template (kopíruj a dosaď symbol)

```
A circular hand-carved dark oak medallion (#2c1a0a wood base with #4a2e15 grain texture and #7a5028 top-highlight on carved edges), slightly irregular handcarved circular edge (not perfect circle, occupying about 80% of a 256x256 transparent canvas, centered). A thin warm tepaná brass hairline (#8a6428 with #d4a050 top-light highlights) traces the wooden edge with visible hammer-strike marks. In the center of the wood, a recessed (engraved/embossed-into-wood) symbol of: <SYMBOL>. The recessed symbol's deepest crevices catch warm brass patina highlights (#d4a050 picking out the highest interior ridges of the carving). Warm rim-light from top-left on both wood and brass, hand-painted storybook style reminiscent of Skyrim Whiterun tavern signs and medieval guild medallions, fully transparent background outside the medallion shape, no shadow on the canvas (alpha clean), no text, no letters, no Latin script, no runes, no frame or border outside the brass hairline. --style raw --ar 1:1 --v 6.1
```

### Univerzální negative
`flat vector, neon, glow, drop shadow on canvas, frame outside hairline, watermark, text, runes, latin letters, pixel art, multiple medallions, chrome, plastic shine, cyan, purple, green, wax seal, burgundy red wax, soft brushed antique gold #d4a946, illuminated calligraphy, manuscript marginalia, pergamen style, modern, scifi, cartoon, anime`

---

### 2/11 `icon-uvodnik.png` — Úvodník

**`<SYMBOL>`:**
> *"a hand-forged iron lantern (oil lamp) with a glowing warm amber flame (#d4944a flame core with #ffb260 brightest center) inside its glass panes, lantern body is wrought iron (#2a2620 with #3a3128 highlights), small loop handle on top, lantern hangs slightly tilted at 5 degrees, glowing warm halo around the flame indicating welcoming light"*

**Schvalovací kritérium navíc:** plamen viditelně teplý (amber), ne neon-cyan; lampa kovová (iron), ne stylized cartoon.

---

### 3/11 `icon-vytvorit-svet.png` — Vytvořit svět

**`<SYMBOL>`:**
> *"a quill pen lying diagonally across a small open inkwell (kalamář), the quill feather pointing upper-left to lower-right with visible feather barbs in cream color (#f0deaa), the inkwell is made of dark ceramic with brass rim (#8a6428), a single drop of dark ink visible falling from the quill tip toward the inkwell mouth"*

**Schvalovací kritérium navíc:** brk + kalamář oba viditelné, ne jen jedno; brass rim na inkwellu jasný.

---

### 4/11 `icon-diskuze.png` — Diskuze

**`<SYMBOL>`:**
> *"two pewter beer tankards (korbele) clinking together at slight 3/4 angle in a 'cheers' toast pose, both tankards filled with amber ale (#c0843e) with small foam crests (#f4e8c4) splashing slightly from the impact, dark wooden handles (#3d2914), tankards are made of warm dark pewter (similar dark tones as the wood medallion edge), small foam droplets in the air between them suggesting active toast"*

**Schvalovací kritérium navíc:** dva korbely, ne jeden; viditelné pivo + pěna; impact splash dynamic.

---

### 5/11 `icon-clanky.png` — Články

**`<SYMBOL>`:**
> *"a folded letter or sealed message envelope viewed from the front, the parchment is warm cream (#f0deaa with #e8d4a0 aged edges) folded into a roughly square shape with the flap on top, sealed in the center with a single small burgundy red wax seal (#8a1520 base with #b01828 top-light, slightly irregular melted edge), the wax seal does NOT have any symbol embossed inside (just plain wax dot), warm rim-light from top-left"*

**Schvalovací kritérium navíc:** burgundy wax viditelný (ne zlato!); letter clearly folded; subtle aged texture na pergamenu.

---

### 6/11 `icon-galerie.png` — Galerie

**`<SYMBOL>`:**
> *"a small ornate wooden picture frame (rectangular dark oak #2c1a0a with carved corner flourishes), the frame holds a tiny abstract painted miniature inside — a stylized silhouette of a medieval village or tavern under stars (just a simplified shape silhouette, no detail, painted in dark warm tones #3a2814 against a warm cream background #f0deaa, with one or two tiny warm amber light dots representing tavern windows). The frame has small brass corner accents (#8a6428)"*

**Schvalovací kritérium navíc:** rám i obraz uvnitř — oboje viditelné; obraz je *abstract silhouette*, ne detailní scéna; brass corners visible.

---

### 7/11 `icon-napoveda.png` — Nápověda

**`<SYMBOL>`:**
> *"an open leather-bound book (warm dark brown #4a2e15 cover, cream pages #f0deaa) lying flat with a small lit oil lantern (similar to icon-uvodnik but smaller, simpler) standing on the right page next to it, the lantern's warm amber flame (#d4944a) casts a small warm glow halo onto the open pages, the pages have abstract calligraphic squiggles (no readable text), suggesting reading by lamplight"*

**Schvalovací kritérium navíc:** kniha + lampa oboje viditelné; warm halo z lampy na stránkách; squiggles abstract (no real text).

---

### 8/11 `icon-hospoda.png` — Hospoda

**`<SYMBOL>`:**
> *"a small wooden ale barrel (oak staves #2c1a0a base with #4a2e15 grain and visible iron banding #2a2620 around the top, middle, and bottom) viewed from the side at slight 3/4 angle, with a polished brass spigot/tap (#8a6428 with #d4a050 top-light) protruding from the lower front of the barrel, no liquid pouring (just the barrel and tap idle and ready), barrel is short and wide (cask shape, not tall narrow)"*

**Schvalovací kritérium navíc:** sud (cask shape) + brass kohoutek viditelně rozlišitelné; iron banding (3 pásy minimum); top-light catches the brass tap most strongly.

---

## 📦 ASSET 9/11 — `decor-table-clutter.png` (Atmosférický spodní pás)

**Účel:** dekorativní spodní pás přes celou šířku obrazovky — tavern table after a long night. Kostky, mince, mapa, džbán, kniha, korbel.
**Cílová cesta:** `public/themes/hospoda/decor/decor-table-clutter.webp`
**Velikost:** 1200×120 (transparentní top, **postupný blend do warm tavern floor color**), aspect 10:1

### Prompt
```
A horizontal panoramic decorative strip 1200x120 pixels showing a medieval tavern tabletop scattered with adventurer's gear after a long night of storytelling, viewed from a slightly above-table angle. The composition reads from left to right, scattered evenly across the width:

LEFT SECTION (~0-300px): a single large twenty-sided die (d20) in dark amber resin (#c0843e) lying on its side, with carved numbers visible on the upward faces (numbers can be abstract pip-like marks, not readable digits), a small pile of three gold coins (#d4a050 brass tone) next to it slightly overlapping;

LEFT-CENTER (~300-550px): a partially unrolled vellum map (warm cream parchment #f0deaa with #c8a878 aged edges, abstract painted lines suggesting rivers and mountains, no readable text), one corner held down by a small leather coin pouch (#4a2e15 dark brown leather with brass drawstring tassel #8a6428);

CENTER (~550-800px): an open leather-bound book (#3a2814 cover, cream pages) lying flat with a quill pen resting across the open pages, a small inkwell (dark ceramic with brass rim) next to it;

RIGHT-CENTER (~800-1050px): a half-empty pewter beer tankard (dark pewter with #c0843e amber ale visible inside, small #f4e8c4 foam ring at the rim) tipped slightly toward the camera, with two more scattered gold coins around its base;

RIGHT SECTION (~1050-1200px): a small ceramic jug (warm terracotta brown #6b3a14 with cream rim) and a single tall lit candle in a small brass candleholder (#8a6428) with warm flame (#ffb260) gently flickering.

The tabletop surface fades from FULLY TRANSPARENT at the top edge of the canvas to a warm dark wood tone (#2c1a0a) at the bottom edge — gradient blend over the entire 120px height. All objects sit on this implied wooden tabletop. Soft warm rim-light from upper-left (consistent with rest of skin), as if lit by hearth fire from above-left. Hand-painted storybook style, slightly worn lived-in feel, NO TEXT or numbers or letters anywhere, no harsh shadows, no neon glow on the candle (just warm natural amber). --ar 10:1 --v 6.1
```

### Negative
`text, numbers on the dice (just abstract pips), letters, watermark, modern objects, smartphone, computer, electric bulb, neon, cyan, purple, green, wax seal style, illuminated manuscript ornaments, photorealistic 3D, plastic objects, anime, cartoon`

### Schvalovací kritéria
- [ ] Aspect ratio 10:1 (1200×120) přesně dodrženo
- [ ] Top edge **transparentní** (nebo velmi subtle), bottom edge wood-toned (#2c1a0a)
- [ ] 5 distinct sekcí čitelné (kostky+mince → mapa+váček → kniha+brk → korbel+mince → džbán+svíčka)
- [ ] Žádné texty / čitelné číslice
- [ ] Warm hearth lit feel — top-left light, žádné cyan / cool tones
- [ ] Po CSS `background-position: bottom center` na 100vw width vypadá natural (žádné cropping artefakty na okrajích)

> **Pozn.:** pokud generátor neprodukuje good 10:1 aspect (mnoho modelů preferuje 1:1 nebo 16:9), generuj 1024×128 nebo 1408×128 a v post-procesu trim/scale na 1200×120. Sharp pipeline tohle zvládne.

---

## 📦 ASSET 10/11 — `iron-clasp-divider.png` (Sekční oddělovač)

**Účel:** železný pás-oddělovač mezi sekcemi v panelech (NAVIGACE / VESMÍRY / CHAT, MOJE DISKUZE / MOJE SVĚTY).
**Cílová cesta:** `public/themes/hospoda/decor/iron-clasp-divider.webp`
**Velikost:** 240×32 (transparentní pozadí, alfa)

### Prompt
```
A horizontal wrought iron decorative strap divider 240x32 pixels, transparent background. The iron strap is dark forged metal (#2a2620 base with #3a3128 hammered highlights), occupying the central horizontal band of the canvas (about 20-22 pixels tall), tapering very slightly thinner at the two ends. Visible hammer-strike marks on the surface texture (small irregular dimples). At the LEFT end (around x=24) and the RIGHT end (around x=216), a single round brass rivet head (#8a6428 base with #d4a050 top-light highlight, suggesting a domed forged rivet head ~12px diameter) is fixed through the strap. The strap edges are slightly irregular (handforged, not machine-cut). Warm rim-light from top-left, hand-painted storybook style, no glossy shine, no chrome reflection, fully transparent background above and below the strap, no text, no border around the strap. --ar 15:2 --v 6.1
```

### Negative
`text, letters, runes, gold #d4a946, soft gold, ornate filigree, multiple straps, vertical orientation, frame, glow, neon, plastic, chrome, photorealistic 3D, wax seal, parchment behind, perfect symmetry`

### Schvalovací kritéria
- [ ] Aspect 15:2 (240×32) přesně
- [ ] Horizontální orientace, centrální horizontal band
- [ ] 2 brass nity — left end + right end, jasně viditelné
- [ ] Železo dark + brass nity, NE zlato (musí se distinct od pergamen palety)
- [ ] Po CSS render na width 200px+ vypadá natural

---

## 📦 ASSET 11/11 — `brass-stamp-ikaros.png` (Mosazné razidlo CTA)

**Účel:** mosazné razítko s vyraženým orlem Ikaros — používá se na PŘIDAT NOVINKU + "+" tlačítka v pravém panelu.
**Cílová cesta:** `public/themes/hospoda/decor/brass-stamp-ikaros.webp`
**Velikost:** 128×128 (transparentní pozadí, alfa)

### Prompt
```
A circular forged brass stamp medallion (#8a6428 base with #d4a050 top-light highlights and #5a4018 deep recessed shadow), occupying about 90% of a 128x128 transparent canvas, centered. Slightly irregular circular edge with visible forge-hammer texture. Around the outer perimeter of the stamp, a thin raised brass hairline ring (#d4a050 catching the most light). In the recessed center of the medallion, a stylized embossed silhouette of a flying eagle with wings outstretched (the Ikaros eagle symbol — wings spread in a heraldic pose, head facing left, body and wings cast as a SOLID SILHOUETTE in deeper recessed brass shadow #5a4018, with thin brass highlight tracing the silhouette edges where light catches the raised relief). The eagle silhouette is bold, simple, readable even at small size (24x24px). Warm rim-light from top-left on the brass edges and the raised eagle ridges, hand-painted storybook style reminiscent of medieval guild brewery brand stamps and historic brewery seals. Fully transparent background outside the stamp medallion, no shadow on canvas, no text, no letters, no number, no border outside the hairline. --style raw --ar 1:1 --v 6.1
```

### Negative
`text, letters, numbers, "IKAROS" written, latin script, runes, watermark, gold #d4a946 (must be brass not gold), wax seal, burgundy red, parchment, complex eagle with feather details (must be silhouette only), realistic eagle, multiple eagles, photorealistic 3D, plastic, chrome mirror, cyan, purple, green, glow, neon, modern logo, scifi, illuminated manuscript`

### Schvalovací kritéria
- [ ] Mosaz dominuje (NE zlato — brass tone musí být teplejší / hnědší než pergamenová zlatá)
- [ ] Orel jako **silhouette / silueta** uvnitř — readable i v malém rendering (24×24)
- [ ] Žádný text "IKAROS" nebo jiné písmena
- [ ] Wings outstretched heraldic pose, head facing LEFT (consistency s logem usera kde orel taky letí doleva)
- [ ] Po CSS render 28×28 v UI je orel rozeznatelný — ověřit zoom

---

## 🔁 Shrnutí workflow

1. **Vygeneruj 11 assetů** podle promptů výše. Použij ChatGPT Image (GPT-4o) nebo Midjourney v6.1.
2. **Stáhni jako PNG** s alfou.
3. **Ulož do** `assets-source/themes/hospoda/`:
   - `corner-tl.png` → corner ornament
   - `icon-uvodnik.png`, `icon-vytvorit-svet.png`, `icon-diskuze.png`, `icon-clanky.png`, `icon-galerie.png`, `icon-napoveda.png`, `icon-hospoda.png` → 7 medailonů
   - `decor-table-clutter.png` → spodní pás
   - `iron-clasp-divider.png` → oddělovač
   - `brass-stamp-ikaros.png` → razidlo
4. **Zkontroluj konzistenci** vedle sebe (otevři všech 7 medailonů v file exploreru — vypadají jako stejný řemeslník?). Pokud ne, regeneruj outliers.
5. **Vizuální kontrast s pergamen sourozenci** — otevři pergamen ikony vedle hospoda ikon. Hospoda má být *teplejší / hnědší / mosaznější*, pergamen *zlatější / pečetňovitější*. Pokud se vizuálně překrývají, regeneruj hospoda assety s důrazem na brass + iron + wood (NE wax seal).
6. **Předej Claudovi pro impl. fázi** — automaticky převede PNG → WebP a zapojí do CSS.

---

## ✅ Checklist předání pro Claude (impl. fáze)

- [ ] `corner-tl.png` v `assets-source/themes/hospoda/`
- [ ] 7× `icon-<key>.png` v `assets-source/themes/hospoda/`
- [ ] `decor-table-clutter.png` v `assets-source/themes/hospoda/`
- [ ] `iron-clasp-divider.png` v `assets-source/themes/hospoda/`
- [ ] `brass-stamp-ikaros.png` v `assets-source/themes/hospoda/`
- [ ] Vizuální QA: 7 medailonů vedle sebe vypadá jako 1 set ✅
- [ ] Vizuální QA: hospoda vs pergamen — distinct material vocabulary ✅
- [ ] User logo + medailon (banner) dodány: `logo.png` + `medailon.png`

**Po dodání všech 11 AI assetů + 2 user-supplied asset → Claude pokračuje implementací 1.0j (`plan-1.0j.md`).**

---

## 📋 Tipy pro ChatGPT (GPT-4o image gen)

- **Jeden prompt = jeden asset.** Negeneruj víc assetů v jednom requestu — ztratí se konzistence palety.
- **Začni master corner ornament** (asset 1). Až bude OK, použij ho jako vizuální anchor pro ostatní (řekni ChatGPT: „match the wood + iron + brass material vocabulary from the corner I generated previously").
- **7 medailonů generuj postupně po jednom**, vždy s odkazem na společný formát.
- **Pokud generátor ignoruje barvy** (často!), explicitně řekni: "use these exact hex colors only: #2c1a0a wood, #8a6428 brass, #2a2620 iron — no other colors except where specified for the symbol inside".
- **Pokud generátor přidá frame/border**, doplň do promptu: "the medallion edge IS the only border — no additional frame around the canvas".
- **Pokud generátor produkuje text** (často "TAVERN" nebo "INN" nápisy), regeneruj s důrazným "absolutely NO TEXT or letters anywhere in the image".
- **Pro Midjourney**: použij `--style raw` (vypne stylizaci) a `--ar` argumenty per asset; v6.1 je nejlepší pro hand-painted feel.

## 📋 Tipy pro Claude code (po dodání assetů)

- Sharp pipeline (`scripts/optimize-themes.mjs` nebo podobný) převede PNG → WebP automaticky
- Corner mirror dělá CSS scaleX/Y, nutno generovat **jen 1 master TL roh**, ne 4 varianty
- table-clutter může vyžadovat sharp post-process (resize na 1200×120 přesně) pokud generátor vyrobí jiný aspect
