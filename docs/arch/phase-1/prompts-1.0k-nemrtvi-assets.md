# Nemrtví skin — asset prompty (1.0k)

> **STAV (2026-05-10):** ✅ 10 AI assetů hotovo. **Asset folder:** `assets-source/themes/nemrtvi/`.

Seznam **10 AI assetů** skinu Nemrtví:
- 1× corner ornament (TL master, mirror přes CSS na zbylé 3 rohy)
- 7× navigační kamenné výklenky s gotickým obloukem (Úvodník, Vytvořit svět, Diskuze, Články, Galerie, Hospoda, Nápověda)
- 1× divider-skull (femur s lebkou — oddělovač sekcí)
- 1× skull-arch (archa lebek nad welcome card)

> **Background neměníme zatím** — používáme existující `public/themes/backgrounds/nemrtvi.webp`. Případnou regeneraci řešíme až po implementaci, pokud paleta nebude sedět.
> **Logo + medailon** dodány v `assets-source/themes/Nemrtví/logo.png` + `medailon.png` — bez promptu.

**Styl skinu:** opuštěná nekromantická kapitula / Sedlec Kostnice o půlnoci — *blackened iron + weathered ivory bone + cracked black stone + teal-ghost-green phosphorescence*. Atmosféra: end-of-world dread, beznaděj, smrt, svět končí.

**Generátor:** ChatGPT (GPT-4o image gen) nebo Midjourney v6.1. Output: PNG s alfou, pak `cwebp -q 90 -alpha_q 100`.

**Reference logo + medailon (dodané user):** [`../../../assets-source/themes/Nemrtví/`](../../../assets-source/themes/Nemrtví/) — držet **stejnou paletu, materiály a světelný úhel** jako tyto.

---

## 🎨 STYLE GUIDE (závazné pro všechny assety)

Nedodržení = inkonzistentní set. ChatGPT/MJ často „uteče" do generic horror nebo sklouzne k Halloween-cheesy / cartoon stylu — proto explicitně vyjmenované zákazy.

### Reference look
**Inspirace:** Bloodborne UI/architecture × Dark Souls 3 cathedral of the Deep × Diablo IV crypts × Sedlec Ossuary (Kutná Hora) × Albrecht Dürer woodcuts × Goya Black Paintings.

**Cíl:** dark fantasy ossuary professional game UI, hopeless end-of-world dread, painterly rendering, dignified-monumentální mrtvolnost.

**NE:** Halloween dekorace. NE cartoon kostlivci. NE crystal-clear vampire glamour (to je `temna-cerven`). NE warm crypt cozy (to je hospoda). NE klášterní iluminace (to je pergamen). NE neon green toxic-waste. NE jump-scare horror. NE plastic skull party props.

### Klíčové odlišení od ostatních skinů

| Aspekt | Pergamen | Hospoda | **Nemrtví** |
|---|---|---|---|
| dominantní materiál | pergamen + zlato | dub + mosaz | **blackened iron + bone** |
| světlo | warm candle gold | warm hearth amber | **cold teal-ghost green** |
| ornament | wax seal | iron clasp | **lebka + femur + nýty** |
| nálada | scholarly clean | lived-in cozy | **dread + smrt + konec světa** |

### Závazná paleta

```
Pozadí (background):       #0c0d0a — #13140f (deep black s lehkým zeleným undertone)
Železo:                    #2a2520 (blackened iron, slight green oxidation)
Kost:                      #cdc098 (weathered ivory, zažloutlá popraskaná)
Akcent (klid):             #5fc8a8 (teal-ghost phosphorescent)
Glow highlight (interakce): #7cffae (radium-bright, jen pro emisi)
Krev (rare):               #7a1814 (oxidovaná stará krev — vosková pečeť)
```

### Závazné materiály

- **Hlavní rám:** blackened iron (zčernalé kované železo) s nýty v hlavních spojích a plamen-like ornamentem v rozích (jako medailon)
- **Akcenty / symboly:** weathered ivory bone (zažloutlá popraskaná kost — věk, ne čistá bílá)
- **Vnitřní povrchy:** cracked black stone (popraskaný černý kámen, microcracks)
- **Světlo:** phosphorescent teal-green ghost-light prosvítá zevnitř, mlží přes okraje, nikdy ostře saturované

### Závazné nálady

`end-of-world dread` · `hopelessness` · `smrt` · `beznaděj` · `Bloodborne aesthetic` · `Sedlec Ossuary` · `Diablo crypt` · `Dark Souls cathedral`

NIKDY: horror-cheesy, Halloween, cartoon, jump-scare, party-skull, fluorescent-toxic.

### Technické požadavky pro každý asset

- PNG s **transparentním pozadím** (alpha channel)
- **Bez textu**, bez watermarku, bez rámu navíc kolem obrázku
- Single dramatic light source, deep shadows
- Painterly rendering, vysoké detaily
- Aspect ratio explicitně uveden u každého promptu

---

## 🔒 STYLE LOCK — vlož jako PRVNÍ zprávu do ChatGPT

Tohle vlož do nového ChatGPT chatu jako úvodní zprávu. ChatGPT-4o si style-lock zapamatuje a všechny následující assety budou stylově sladěné.

```
Budu generovat sérii UI assetů pro stejný dark-fantasy skin "Nemrtví / Kostnice".
Drž tento styl pro VŠECHNY následující obrázky:

MATERIÁLY:
- Hlavní rám: blackened iron (zčernalé kované železo) s nýty v rozích a plamen-like ornamentem
- Akcenty: weathered ivory bone (zažloutlá popraskaná kost)
- Vnitřní povrchy: cracked black stone (popraskaný černý kámen)
- Světlo: phosphorescent teal-green ghost-light (#5fc8a8) prosvítá zevnitř

PALETA (striktně dodržuj):
- Černá: #0c0d0a, #13140f
- Železo: #2a2520 (blackened iron, slight green oxidation)
- Kost: #cdc098 (weathered ivory)
- Akcent: #5fc8a8 (teal-ghost-green)
- Glow highlight: #7cffae (radium-bright, jen v active/emisích)

NÁLADA: end-of-world dread, hopelessness, smrt, beznaděj. Bloodborne / Dark Souls / Sedlec Ossuary / Diablo aesthetic. NIKDY horror-cheesy, NIKDY Halloween, NIKDY cartoon. Profesionální game UI quality, painterly rendering, single dramatic light source, deep shadows.

VÝSTUP: PNG s transparentním pozadím (alpha channel), žádný text, žádné watermarky, žádné rámy navíc kolem obrázku.

Potvrď, že jsi style-lock přečetl, a čekej na první asset prompt.
```

---

## 1. `corner-tl.webp` — Roh stránky (TL master, mirror přes CSS na TR/BL/BR)

```
Asset: top-left corner ornament for the gothic UI page frame.

Composition: ornament zabírá horní-levý kvadrant obrázku (cca 60% plochy v levém horním rohu), zbytek je plně transparentní. Bottom-right roh fade do transparency.

Detail:
- Blackened iron L-shaped corner bracket s ornamentálním zakončením
- Nýty (rivets) v hlavních spojích
- Ve vrcholu rohu (na pivot pointu, kde se setkávají horní a levá hrana) malá gotická lebka v zažloutlé kosti
- Po obvodu plamen-like flourishes (jako na medailonu, ale menší)
- Z popraskaného železa prosvítá slabá teal-green ghost light

Aspect ratio: 1:1 (čtverec, např. 1024×1024).
```

---

## 2. `divider-skull.webp` — Oddělovač sekcí (femur + lebka)

```
Asset: horizontal section divider ornament.

Composition: ve středu obrázku horizontálně položený velký bleached human femur (stehenní kost) v weathered ivory. Uprostřed kosti, kde by byl přirozený "uzel", sedí dramatická gotická lebka, lehce nakloněná. Z očních důlků lebky prosvítá faint teal-green ghost-flame. Konce kosti svírají blackened iron clasps s nýty (jako kovaná pouta).

Délka: kost zabírá horizontálně cca 70% šířky obrázku, levá a pravá strana fade do plné transparency.

Aspect ratio: 8:2 nebo 6:2 (very wide horizontal). Pokud ChatGPT nedovolí takový poměr, použij 16:9 a kost umísti přes celou šířku.
```

---

## 3. `icon-uvodnik.webp` — Úvodník

```
Asset: square gothic nav icon, 1:1 aspect.

Frame (consistent for all 7 nav icons):
- Pointed lancet arch (gotický oblouk) carved z blackened iron a cracked dark stone, zabírá celou plochu obrázku
- Uvnitř archu = niche s teal-green phosphorescent ghost-light glowing softly
- V dolních dvou rozích malé nýty
- Subtle weathered crack textura na kameni

Symbol uvnitř niche: lebka s ivory halo of broken radiating spikes (jakoby "svatý-ale-mrtvý" — saint-but-undead). Lebka je v centru, halo paprsky vyzařují radiálně. Lebka v weathered ivory bone, halo paprsky též kost ale zlomené, popraskané.

Aspect ratio: 1:1 (1024×1024).
```

---

## 4. `icon-vytvorit-svet.webp` — Vytvořit svět

```
Asset: square gothic nav icon, 1:1 aspect.

(Stejný frame jako icon-uvodnik: lancet arch z blackened iron + dark stone, niche s teal-green ghost-light glowing softly, nýty v dolních rozích.)

Symbol uvnitř niche: a skeletal key crafted from a single human finger bone — bow (hlavička) klíče je tvořena gotickým necromantic sigilem s teal-green žhnoucími runami, šaft a teeth (zuby) klíče jsou z popraskané kosti. Klíč stojí vertikálně, mírně nakloněný.

Aspect ratio: 1:1 (1024×1024).
```

---

## 5. `icon-diskuze.webp` — Diskuze

```
Asset: square gothic nav icon, 1:1 aspect.

(Stejný frame jako předchozí: lancet arch, niche s teal-green ghost-light, nýty.)

Symbol uvnitř niche: dvě malé lebky v profilu, otočené proti sobě (jedna zleva, jedna zprava), jejich čelisti pootevřené jako by si šeptaly. Mezi nimi se vznáší tenký pruh teal-green mlhy/dechu (whispered breath as visible vapor). Lebky ve weathered ivory.

Aspect ratio: 1:1 (1024×1024).
```

---

## 6. `icon-clanky.webp` — Články

```
Asset: square gothic nav icon, 1:1 aspect.

(Stejný frame: lancet arch, niche s teal-green ghost-light, nýty.)

Symbol uvnitř niche: otevřený starý grimoár (ancient tome) vázaný v popraskané černé kůži, pootevřený, viditelné dvě stránky se zažloutlým pergamenem. Na pravé stránce vyražená pečeť z červeného vosku ve tvaru lebky-a-zkřížených-kostí (skull and crossbones wax seal). Z knihy stoupá tenký pruh teal-green mlhy.

Aspect ratio: 1:1 (1024×1024).
```

---

## 7. `icon-galerie.webp` — Galerie

```
Asset: square gothic nav icon, 1:1 aspect.

(Stejný frame: lancet arch, niche s teal-green ghost-light, nýty.)

Symbol uvnitř niche: vertikální zrcadlo v bone-frame (rám tvořen propletenými kostmi a obratli, weathered ivory). Sklo zrcadla popraskané do několika střepů; v největším střepu se mihotá lebka jako mizející odraz, mlžné a teal-green tinted.

Aspect ratio: 1:1 (1024×1024).
```

---

## 8. `icon-hospoda.webp` — Hospoda

```
Asset: square gothic nav icon, 1:1 aspect.

(Stejný frame: lancet arch, niche s teal-green ghost-light, nýty.)

Symbol uvnitř niche: středověký cínový tankard (krčmářský pohár) převrácený dnem vzhůru, naprosto prázdný. Z okraje pohárů se vysypává prach a pavučiny. Tankard je popraskaný a oxidovaný. Idea: "mrtví už nepijí". Žádné pivo, žádná pěna, jen prach a opuštění.

Aspect ratio: 1:1 (1024×1024).
```

---

## 9. `icon-napoveda.webp` — Nápověda

```
Asset: square gothic nav icon, 1:1 aspect.

(Stejný frame: lancet arch, niche s teal-green ghost-light, nýty.)

Symbol uvnitř niche: hanging lantern of bone-cage construction (lucerna jejíž stěny jsou tvořeny propletenými žebry kosti, jako kostěná klec). Uvnitř hoří malý teal-green ghost-flame, jasnější než ambient niche light (radium accent #7cffae). Lucerna visí na zčernalém železném řetězu shora.

Aspect ratio: 1:1 (1024×1024).
```

---

## 10. `skull-arch.webp` — Archa lebek nad welcome card

```
Asset: horizontal architectural arch ornament for a welcome panel header.

Composition: graceful pointed-gothic arch tvořen 13-15 weathered human skulls arranged in arch shape (jako Sedlec Ossuary). Lebky propojené blackened iron chains a twisted bone garlands (řetězy z kostí a železa). Ve vrcholu archu (peak) jedna velká centrální lebka s plně rozžhnutými teal-green ghost-flames v očních důlcích (radium-bright #7cffae). Postranní lebky jsou klidné, pouze faint ambient glow.

Pod arch (dolní hrana obrázku) plně transparentní — arch má funkci "korunu" nad welcome cardem.

Aspect ratio: 4:1 (very wide horizontal, např. 1792×448 nebo 2048×512). Pokud ChatGPT nedovolí, použij 16:9 a arch zabírá horní třetinu, dolní 2/3 transparentní.
```

---

## Workflow

1. **Otevři nový chat v ChatGPT** (clean session, žádný předchozí kontext).
2. **Vlož STYLE LOCK** jako první zprávu → počkej na potvrzení.
3. **Postupně vlož prompty 1–10.** Po každém:
   - Vyhodnoť výsledek vůči STYLE GUIDE výše.
   - Pokud se odchýlí (špatná paleta, chybný materiál, horror-cheese), v chatu řekni *"drž STYLE LOCK, paleta sklouzla — regeneruj"* a opakuj.
   - Při větší odchylce (např. 3+ regenerací stejného assetu) → otevři nový chat se STYLE LOCK znovu.
4. **Ulož PNG soubory** do `assets-source/themes/nemrtvi/`:
   - `corner-tl.png`
   - `divider-skull.png`
   - `icon-uvodnik.png`, `icon-vytvorit-svet.png`, `icon-diskuze.png`, `icon-clanky.png`, `icon-galerie.png`, `icon-hospoda.png`, `icon-napoveda.png`
   - `skull-arch.png`
5. **Konverze do .webp** přes finalize script (po vzoru hospody — udělám až při implementaci).
6. **Pokračujeme dalšími design otázkami** (welcome card frame, animace, rozsah).

---

## Acceptance kritéria assetů

Pro každý asset před akceptací zkontroluj:

- [ ] Transparentní pozadí (žádný šedý/bílý "checkerboard" by neměl být viditelný kolem objektu)
- [ ] Paleta sedí (železo zčernalé, ne stříbrné; kost zažloutlá, ne bílá; zelená teal-ghost, ne neon)
- [ ] Materiály konzistentní napříč všemi 10 assety
- [ ] Žádný text, watermark, ani chybný "ChatGPT-style" rám okolo
- [ ] Single light source, deep shadows (ne flat-lit cartoon)
- [ ] Konkrétní asset matchuje svůj prompt (např. icon-hospoda = převrácený tankard, ne pivní korbel vzpřímený)

Pokud asset selže ≥2 kritéria → regeneruj.
