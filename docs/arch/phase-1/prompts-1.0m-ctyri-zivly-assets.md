# Čtyři živly skin — asset prompty (1.0m)

> **STAV (2026-05-11):** ✅ Všech 14 assetů vygenerováno + finalizováno. **Cílový asset folder:** `assets-source/themes/ctyri-zivly/`.

Seznam **14 AI assetů** skinu Čtyři živly:

**Signature (7):**
- 1× `corner-tl` — master roh hero karty (mirror přes CSS na zbylé 3 rohy)
- 4× `cardinal-{ruby|sapphire|emerald|topaz}` — kardinální cabochon gemy v midpointech stran (oheň/voda/země/vzduch)
- 1× `compass` — Compass of Four mandala (nahrazuje yin-yang z reference image, sedí v admin panelu / pravém panelu)
- 1× `divider-chain` — stříbrný řetěz s gem-clusterem (oddělovač sekcí v panelech)

**Nav ikony (7) — všech 7 sdílí stejný heraldic-shield frame:**
- `icon-uvodnik` · `icon-vytvorit-svet` · `icon-diskuze` · `icon-clanky` · `icon-galerie` · `icon-napoveda` · `icon-hospoda`

> **Background neměníme** — používáme existující `public/themes/backgrounds/ctyri-zivly.webp` (fire-left + water-right + earth-bottom + air-top s lightning). Skin overlay (steel panely + gem-set rámy + Quartered Aurora drift) jej dostatečně utlumí na atmosférický plán.
> **Logo + medailon** dodány v `assets-source/themes/ctyri-zivly/logo.png` + `medailon.png` — bez promptu.

**Koncept:** **"Pactum Quattuor" — Posvátný pakt čtyř živlů zpečetěný Ikarosem-fénixem skrze čtyři kardinální gemy.** Heraldická posvátná chivalry × astrolabe-kompas × klenotnické umění Renaissance dvora — vznešený, jasný, slavnostní moment rovnováhy. **NE temný gothic** (to je nemrtví/temna-cerven), **NE scholarský pergamen** (to je pergamen), **NE útulná taverna** (to je hospoda), **NE alchymistická patina** (verdigris se nehodí — logo+medailon jsou leštěné stříbro-bronz).

**Generátor:** ChatGPT (GPT-4o image gen) nebo Midjourney v6.1. Output: PNG s alfou, pak `cwebp -q 90 -alpha_q 100`.

**Reference logo + medailon (dodané user):** [`../../../assets-source/themes/ctyri-zivly/`](../../../assets-source/themes/ctyri-zivly/) — držet **stejnou paletu, materiály a styl rámu** jako tyto. Leštěné stříbro+bronz s 4 kardinálními gemy v midpointech (rubín-L, topaz-T, safír-R, smaragd-B), fleur-de-lis spike v rozích, fénix jako světelný unifier.

---

## 🎨 STYLE GUIDE (závazné pro všechny assety)

Nedodržení = inkonzistentní set. ChatGPT/MJ často „uteče" do generic high-fantasy nebo sklouzne k cartoon WoW stylu — proto explicitně vyjmenované zákazy.

### Reference look

**Inspirace:**
- *Diablo IV* Sanctuary kovaná řemeslná kvalita (silver-steel, brass inlay)
- *Dragon Age: Inquisition* heraldic UI (gem-set medailony, fleur-de-lis)
- *Witcher 3* alchymistické UI (cabochon gemy v silver settingu)
- *Elden Ring* sacred geometric ornaments (compass, mandala)
- **Renaissance court reliquary** — relikviáře 15.-16. stol. s drahými kameny ve stříbrném setting
- **Cardinal gemstone tradition** — rubín=oheň, safír=voda, smaragd=země, topaz=vzduch (středověká heraldika)
- **NE** dark vampire (temna-cerven), **NE** ossuary bone (nemrtví), **NE** copper verdigris (alchymistický)

**Cíl:** prvotřídní game UI, **heraldic chivalric reliquary aesthetic**, painterly + sharp detail rendering, **leštěné** kovy (NE patina, NE rust), **slavnostní hrdinská záře** (NE temnota, NE dramatic horror). Materiály vypadají jako kdyby byly vyfocené v muzejní vitríně Pražského hradu.

**NE:** generic WoW fantasy. NE cartoon high-fantasy. NE Halloween. NE neon glow. NE patinovaná měď (alchymistický skin pivotnut). NE skull/bone (to je nemrtvi). NE vampire blood (to je temna-cerven). NE dřevo/pergamen (pergamen/hospoda). NE jet-black mourning (temna-cerven). NE krev. NE mrtvolnost. NE drahá lebka.

### Klíčové odlišení od ostatních skinů

| Aspekt | Pergamen | Hospoda | Nemrtví | Temna-cerven | **Čtyři živly** |
|---|---|---|---|---|---|
| dominantní materiál | pergamen + zlato | dub + mosaz | iron + bone | iron + baroque silver + jet | **leštěné stříbro-ocel + teplý bronz + 4 kardinální cabochony** |
| světlo | warm candle gold | warm hearth amber | cold teal-ghost green | garnet glow + bordeaux | **phoenix radiance gold-white + 4-color gem refraction** |
| signature ornament | wax seal + corner | iron clasp + brass stamp | skull-arch + bone divider | bat-arch + thorn-rose + iron-cross | **kardinální gem-set rámec + Compass of Four + fleur-de-lis spike rohy** |
| nálada | scholarly clean | lived-in cozy | dread + smrt | decadent seduction | **slavnostní pakt + sacred geometry + heroic radiance** |

### Závazná paleta

```
Pozadí (forged steel):         #13141a — #1c1e26 (chladná tmavá ocel s modrým undertone)
Karta (steel plate):           #252830 (deska s broušeným povrchem)
Stříbro leštěné (rámy):        #c8ccd2 base, #e8ecf0 highlight, #5a5e66 shadow
Bronz teplý (lemy):            #b08840 base, #d4a850 highlight, #5a4220 deep
Zlatý leaf (akcenty):          #e8c860 (gold-leaf engraving)
Phoenix radiance (centrum):    #ffe8a8 → #ffd680 (warm white-gold halo)

OHEŇ — Rubín:                  #c8202a cabochon, #f04050 internal incandescent glow
VODA — Safír:                  #2050b0 cabochon, #4080e0 highlight refraction
ZEMĚ — Smaragd:                #2a8050 cabochon, #50b070 highlight
VZDUCH — Topaz:                #e8d480 cabochon (warm crystal), #fff0c0 highlight prism
```

### Závazné materiály

- **Hlavní rám:** **leštěné stříbro-ocel** (sterling silver kvalita, vysoký odraz, ostře broušené plochy) — **ŽÁDNÁ patina**, **ŽÁDNÝ verdigris**, **ŽÁDNÝ tarnish**, jen subtle dust v drážkách. Materiál vypadá jako čerstvě vyleštěné rytířské brnění.
- **Sekundární rám:** **teplý bronz / vermeil** (zlacené stříbro, subtle red-warm undertone) — gold-leaf inlay engraving, fleur-de-lis ornamenty
- **Cabochony:** 4 různé drahokamy, **vždy** broušené do hladké hrudky cabochon (NE faceted), s **jediným highlight bodem** a **vnitřním glow z hloubky kamene** — ne plochá ilustrace, opravdový optický model
  - **Rubín** (oheň): hluboké krevně-červené srdce, vnitřní žhavost
  - **Safír** (voda): hluboké oceánsky-modré srdce, vnitřní cool refraction
  - **Smaragd** (země): hluboké lesní-zelené srdce, jemný emerald-cut hairline crack uvnitř (přírodní vada = pravost)
  - **Topaz** (vzduch): warm-yellow crystal, prism-light refrakce, světelnější než ostatní
- **Fleur-de-lis ornament:** rytířská heraldika, ostře broušená stříbrná spike s gold-leaf středem
- **Phoenix-sigil:** zlatá leaf gravur, fénix v profilu s rozprostřenýma křídly (echo medailonu)
- **Světlo:** **single dramatic light source z horní třetiny obrazu**, neutrálně bílé (NE warm candle, NE cool moonlight) — jako muzejní spotlight, deep shadows, lehké atmospheric particles

### Závazné nálady

`heraldic chivalric reliquary` · `Renaissance court medallion` · `sacred geometry of four elements` · `polished sterling silver + warm bronze` · `cabochon gemstones in silver setting` · `Diablo IV craftsmanship × Witcher alchemy UI × Dragon Age heraldry` · `phoenix as fifth element unifier` · `solemn radiance` · `museum-quality artifact`

NIKDY: WoW cartoon, Halloween, dark horror, vampire blood, ossuary bone, copper verdigris, alchemist tarnish, jump-scare, neon glow, fluorescent palette, gold maximalism (zlatý standard), parchment scholarly (pergamen), tavern wood (hospoda).

### Technické požadavky pro každý asset

- PNG s **transparentním pozadím** (alpha channel) — žádný šedý/bílý fade-out, čistá alpha
- **Bez textu**, bez watermarku, bez rámu navíc kolem obrázku
- Single dramatic light source z horní třetiny, deep shadows
- Painterly + sharp detail rendering (NE 3D render look, NE flat illustration, NE cartoon)
- Aspect ratio explicitně uveden u každého promptu
- Gemy musí mít **realistický optický model** (highlight + internal glow + shadow), ne ploché ilustrace

---

## 🔒 STYLE LOCK — vlož jako PRVNÍ zprávu do ChatGPT

Tohle vlož do nového ChatGPT chatu jako úvodní zprávu. ChatGPT-4o si style-lock zapamatuje a všechny následující assety budou stylově sladěné.

```
Budu generovat sérii UI assetů pro stejný heraldický skin "Čtyři živly".
Drž tento styl pro VŠECHNY následující obrázky:

KONCEPT: Posvátný pakt čtyř živlů zpečetěný Ikarosem-fénixem skrze čtyři
kardinální gemy. Heraldická chivalric reliquary aesthetic — vznešený slavnostní
moment rovnováhy. NE temný gothic, NE alchymistická patina, NE WoW cartoon.

MATERIÁLY:
- Hlavní rám: leštěné stříbro-ocel (sterling silver kvalita, vysoký odraz,
  ostře broušené plochy) — ŽÁDNÁ patina, ŽÁDNÝ verdigris, ŽÁDNÝ tarnish.
  Materiál vypadá jako čerstvě vyleštěné rytířské brnění.
- Sekundární rám: teplý bronz / vermeil (zlacené stříbro), gold-leaf inlay
  engraving, fleur-de-lis ornamenty
- Cabochony: 4 různé drahokamy, VŽDY broušené do hladké hrudky cabochon
  (NE faceted), s jediným highlight bodem a vnitřním glow z hloubky kamene
  - Rubín (oheň): hluboké krevně-červené srdce, vnitřní žhavost
  - Safír (voda): hluboké oceánsky-modré srdce, vnitřní cool refraction
  - Smaragd (země): hluboké lesní-zelené srdce, jemný hairline crack uvnitř
  - Topaz (vzduch): warm-yellow crystal, prism-light refrakce
- Fleur-de-lis ornament: rytířská heraldika, ostře broušená stříbrná spike
  s gold-leaf středem
- Phoenix-sigil: zlatá leaf gravur, fénix v profilu s rozprostřenýma křídly
- Světlo: single dramatic light source z horní třetiny, neutrálně bílé jako
  muzejní spotlight, deep shadows, atmospheric dust particles

PALETA (striktně dodržuj):
- Pozadí: #13141a–#1c1e26 (chladná tmavá ocel s modrým undertone)
- Karty: #252830 (steel plate)
- Stříbro: #c8ccd2 base, #e8ecf0 highlight, #5a5e66 shadow
- Bronz: #b08840 base, #d4a850 highlight, #5a4220 deep
- Gold-leaf: #e8c860
- Phoenix radiance: #ffe8a8 → #ffd680
- Rubín: #c8202a base, #f04050 internal glow
- Safír: #2050b0 base, #4080e0 highlight
- Smaragd: #2a8050 base, #50b070 highlight
- Topaz: #e8d480 base, #fff0c0 highlight

NÁLADA: heraldic chivalric reliquary, Renaissance court medallion, sacred
geometry of four elements, museum-quality artifact, solemn radiance.
Inspirace: Diablo IV craftsmanship × Witcher 3 alchemy UI × Dragon Age
Inquisition heraldry × Renaissance reliquaries.

NIKDY: WoW cartoon, Halloween, dark horror, vampire blood, ossuary bone,
copper verdigris, alchemist tarnish, neon glow, gold maximalism, parchment
scholarly, tavern wood.

VÝSTUP: PNG s transparentním pozadím (alpha channel), žádný text, žádné
watermarky, žádné rámy navíc kolem obrázku. Single dramatic light source
z horní třetiny, deep shadows, atmospheric dust particles.

Potvrď, že jsi style-lock přečetl, a čekej na první asset prompt.
```

---

## 🖼 SHARED NAV FRAME (referenční popis pro 7 nav ikon)

Všech 7 nav ikon (úvodník, vytvořit svět, diskuze, články, galerie, nápověda, hospoda) sdílí **stejný heraldic-shield frame**. Tento popis je zopakován v každém z 7 promptů jako konstanta:

```
SHARED NAV FRAME (consistent for all 7 nav icons):
- Vertikálně oválný heraldic-shield frame zabírá celou plochu obrázku
- Vnější obrys: leštěné stříbro-ocel s teplým bronzovým lemem (1-2px bronze
  inlay těsně podél vnitřní hrany)
- V horním vrcholu shieldu: malá stříbrná fleur-de-lis spike s gold-leaf středem
- V dolním vrcholu shieldu: malý zlatý fénix-sigil v profilu (rozpřažená křídla,
  3-4mm velikost, gold-leaf gravur)
- V midpointech 4 stran shieldu: 4 mikro cabochony — TOP topaz (#e8d480),
  RIGHT safír (#2050b0), BOTTOM smaragd (#2a8050), LEFT rubín (#c8202a) —
  každý cca 6-8mm, broušený cabochon s vnitřním glow
- Uvnitř shield niche: tmavě steel-blue pozadí (#1c1e26) s phoenix-radiance
  ambient warm halo zezadu (#ffe8a8 z centra niche, fading)
- Symbol z následujícího promptu sedí v centru niche, dramaticky osvětlený
  shora bílým spotlightem
- Drobný dust particles na povrchu stříbra (museum quality)
```

---

## 1. `corner-tl.webp` — Roh hero karty (TL master, mirror přes CSS na TR/BL/BR)

```
Asset: top-left corner ornament for the welcome card frame.

Composition: ornament zabírá horní-levý kvadrant obrázku (cca 60% plochy v levém
horním rohu), zbytek je plně transparentní. Bottom-right roh fade do transparency.

Detail:
- Leštěná stříbro-ocelová L-shaped corner bracket (sterling silver kvalita,
  vysoký odraz)
- Po obvodu obtočená teplý bronzový lem (vermeil) s gold-leaf engraving
  (drobné fleur-de-lis motifs vyryté do bronzu)
- V samotném vrcholu rohu (na pivot pointu): velká stříbrná fleur-de-lis
  spike s gold-leaf středem — hlavní ornament rohu, ostře broušená,
  vyčnívá ven z rámu
- V křížení bracket: malá kulatá stříbrná stud-rosette (jako šroub-ornament)
  s drobným gold-leaf středem
- 2 mikro cabochony usazené v bracket: jeden rubín (#c8202a, na vnější straně)
  a jeden safír (#2050b0, na vnitřní straně) — každý 4-5mm, broušený cabochon
- Subtle dust particles v drážkách (museum quality), ŽÁDNÁ patina,
  ŽÁDNÝ tarnish, ŽÁDNÝ rust
- Single dramatic light source z horního levého rohu, deep shadow vpravo dole

Aspect ratio: 1:1 (čtverec, např. 1024×1024).
```

---

## 2. `cardinal-ruby.webp` — Kardinální rubín (left midpoint, oheň)

```
Asset: round cabochon ruby in silver-bronze setting — sedí na MIDPOINTU LEVÉ STRANY
welcome cardu jako gem-marker pro element OHEŇ.

Composition: kruhový gem-set medailon vyplňuje centrum obrázku (cca 70% plochy),
okolí transparentní. Pohled mírně z 3/4 úhlu, gem mírně vyčnívá ven (3D dojem).

Detail:
- Centrální cabochon rubín: hluboké krevně-červené srdce (#c8202a base,
  #f04050 incandescent glow uvnitř), broušený do hladké hrudky cabochon
  (NE faceted), jediný highlight bod v levém horním kvadrantu povrchu,
  vnitřní žhavost prosvítá z hloubky
- Setting: leštěné stříbro-ocel "claw" prongs (4 prongs držící gem),
  každá prong ostře broušená do bodu
- Vnější prsten settingu: teplý bronz (vermeil) s gold-leaf vyrytým ornamentem
  — drobné plamínkové motifs (echo elementu OHEŇ) vryté do bronzu
- Pod rubínem subtle warm halo (#f04050 ambient glow rozplývá ven)
- Kolem settingu drobné dust particles (museum quality)
- Single dramatic light source z horní třetiny, deep shadow pod settingem

Aspect ratio: 1:1 (např. 768×768). Asset bude na UI cca 60-80px velký.
```

---

## 3. `cardinal-sapphire.webp` — Kardinální safír (right midpoint, voda)

```
Asset: round cabochon sapphire in silver-bronze setting — sedí na MIDPOINTU PRAVÉ
STRANY welcome cardu jako gem-marker pro element VODA.

Composition: kruhový gem-set medailon vyplňuje centrum obrázku (cca 70% plochy),
okolí transparentní. Pohled mírně z 3/4 úhlu.

Detail:
- Centrální cabochon safír: hluboké oceánsky-modré srdce (#2050b0 base,
  #4080e0 cool refraction uvnitř), broušený do hladké hrudky cabochon
  (NE faceted), jediný highlight bod v levém horním kvadrantu, vnitřní
  cool refrakce jako kdyby uvnitř plulo světlo skrz hlubinu vody
- Setting: leštěné stříbro-ocel "claw" prongs (4 prongs)
- Vnější prsten settingu: teplý bronz s gold-leaf vyrytým ornamentem
  — drobné vlnkové motifs (echo elementu VODA) vryté do bronzu
- Pod safírem subtle cool halo (#4080e0 ambient glow rozplývá ven)
- Drobné dust particles
- Single dramatic light source z horní třetiny

Aspect ratio: 1:1 (768×768).
```

---

## 4. `cardinal-emerald.webp` — Kardinální smaragd (bottom midpoint, země)

```
Asset: round cabochon emerald in silver-bronze setting — sedí na MIDPOINTU
SPODNÍ STRANY welcome cardu jako gem-marker pro element ZEMĚ.

Composition: kruhový gem-set medailon vyplňuje centrum obrázku (cca 70% plochy),
okolí transparentní. Pohled mírně z 3/4 úhlu.

Detail:
- Centrální cabochon smaragd: hluboké lesní-zelené srdce (#2a8050 base,
  #50b070 highlight), broušený do hladké hrudky cabochon (NE faceted),
  jediný highlight bod v levém horním kvadrantu povrchu
- Uvnitř smaragdu jeden jemný hairline crack (přírodní vada = pravost
  pravého emeraldu — viditelný vlasový praskáč hluboko v kameni)
- Setting: leštěné stříbro-ocel "claw" prongs (4 prongs)
- Vnější prsten settingu: teplý bronz s gold-leaf vyrytým ornamentem
  — drobné lístkové/větvičkové motifs (echo elementu ZEMĚ) vryté do bronzu
- Pod smaragdem subtle green halo (#50b070 ambient glow)
- Drobné dust particles
- Single dramatic light source z horní třetiny

Aspect ratio: 1:1 (768×768).
```

---

## 5. `cardinal-topaz.webp` — Kardinální topaz (top midpoint, vzduch)

```
Asset: round cabochon topaz in silver-bronze setting — sedí na MIDPOINTU HORNÍ
STRANY welcome cardu jako gem-marker pro element VZDUCH.

Composition: kruhový gem-set medailon vyplňuje centrum obrázku (cca 70% plochy),
okolí transparentní. Pohled mírně z 3/4 úhlu.

Detail:
- Centrální cabochon topaz: warm-yellow crystal srdce (#e8d480 base,
  #fff0c0 prism-light refraction), broušený do hladké hrudky cabochon
  (NE faceted), JE SVĚTLEJŠÍ a ČIRŘÍ než ostatní 3 gemy (vzduch = nejlehčí
  element) — kámen je téměř průhledný, vnitřek prozářený
- Uvnitř topazu drobné prism-light refrakce (jemné duhové iridescence
  jak světlo prochází krystalem)
- Setting: leštěné stříbro-ocel "claw" prongs (4 prongs), DROBNĚJŠÍ než
  u ostatních gemů (vzduch = nejjemnější)
- Vnější prsten settingu: teplý bronz s gold-leaf vyrytým ornamentem
  — drobné vlnité větrové swirls (echo elementu VZDUCH) vryté do bronzu
- Pod topazem subtle warm prism halo (#fff0c0 ambient glow rozplývá ven)
- Drobné dust particles plující v halo (jako kdyby je nesl vítr)
- Single dramatic light source z horní třetiny

Aspect ratio: 1:1 (768×768).
```

---

## 6. `compass.webp` — Compass of Four mandala (signature element, nahrazuje yin-yang)

```
Asset: kruhová heraldická kompasová mandala se 4 živly spojenými fénixem v centru.

Composition: velký kruhový kompas zabírá celou plochu obrázku (95% průměru),
okolí transparentní. Pohled přímý frontal (NE perspektiva).

Detail:
- Vnější prsten: leštěné stříbro-ocel se 4 výraznými kardinálními pozicemi
  — N (top): topaz cabochon (#e8d480), E (right): safír (#2050b0),
  S (bottom): smaragd (#2a8050), W (left): rubín (#c8202a) — každý gem
  cca 8-10% průměru kompasu, broušený cabochon s vnitřním glow
- Mezi kardinálními gemy v 4 ordinálních pozicích (NE/SE/SW/NW): malé
  stříbrné fleur-de-lis spike ornamenty s gold-leaf středem
- Druhý vnitřní prsten: teplý bronz (vermeil) s gold-leaf engravingem
  4 alchemických glyfů elementů — 🜂 oheň (W, vedle rubínu), 🜄 voda (E,
  vedle safíru), 🜃 země (S, vedle smaragdu), 🜁 vzduch (N, vedle topazu)
- Vnitřní disk: tmavě steel-blue (#1c1e26) s phoenix-radiance ambient
  warm halo (#ffe8a8 → #ffd680 gradient ze středu)
- V samotném centru: malý zlatý fénix-sigil (gold-leaf gravur) s rozpřaženými
  křídly, profil pohled, cca 25% průměru kompasu — zlatý leaf vyrytý do
  bronze plate, lehce prozářený phoenix-radiance halo zezadu
- 4 jemné stříbrné radiální čáry spojující 4 kardinální gemy do středu
  (jako kompasové paprsky) — propojují každý živel s fénixem-unifierem
- Subtle dust particles po obvodu (museum quality)
- Single dramatic light source z horní třetiny, deep shadows v hloubkách

Aspect ratio: 1:1 (1024×1024).
```

---

## 7. `divider-chain.webp` — Stříbrný řetěz s gem-clusterem (oddělovač sekcí v panelech)

```
Asset: horizontal section divider — silver chain with central gem-cluster.

Composition: ve středu obrázku horizontálně položený jemný stříbrný řetěz.
Uprostřed řetězu jeden centrální gem-cluster (4 mikro cabochony v silver
setting). Levý a pravý konec řetězu fade do transparentního pozadí.

Detail:
- Řetěz: jemný stříbrný oval-link chain (cca 4-5mm link velikost),
  leštěné sterling silver, viditelná individuální očka řetězu,
  drobné highlight body kde se odráží světlo
- Centrální cluster: kruhový stříbro-bronzový rosette (cca 15% celkové
  šířky obrázku), uvnitř 4 mikro cabochony v křížové formaci
  — TOP topaz, RIGHT safír, BOTTOM smaragd, LEFT rubín, každý 4-5mm,
  broušený cabochon
- V samotném centru rosette: malý zlatý phoenix-sigil dot (gold-leaf,
  3-4mm) — echo medailonu
- Vnější obrys rosette: teplý bronz s gold-leaf engravingem drobných
  fleur-de-lis motifs
- Na koncích řetězu (vpravo a vlevo, kde fade do transparentního): malé
  stříbrné T-bar clasps (jako šperkařský zámek)
- Pozadí: zcela transparentní
- Single dramatic light source shora, deep shadow pod řetězem

Aspect ratio: 6:1 nebo 8:1 (very wide horizontal, např. 1536×256).
```

---

## 8. `icon-uvodnik.webp` — Úvodník (otevřená kniha pečetí s phoenix-sealem)

```
Asset: square heraldic-shield nav icon, 1:1 aspect.

SHARED NAV FRAME (consistent for all 7 nav icons):
- Vertikálně oválný heraldic-shield frame zabírá celou plochu obrázku
- Vnější obrys: leštěné stříbro-ocel s teplým bronzovým lemem
- V horním vrcholu shieldu: malá stříbrná fleur-de-lis spike s gold-leaf středem
- V dolním vrcholu shieldu: malý zlatý fénix-sigil v profilu
- V midpointech 4 stran: 4 mikro cabochony — TOP topaz, RIGHT safír,
  BOTTOM smaragd, LEFT rubín
- Uvnitř shield niche: tmavě steel-blue pozadí s phoenix-radiance ambient
  warm halo zezadu

SYMBOL UVNITŘ NICHE: **otevřená rukopisná kniha pečetí** — silnější starý
foliant otevřený na střední dvojstraně, mírně z 3/4 úhlu. Stránky jsou krémově
zlatavé pergamen, na pravé stránce přitisknutá velká kruhová pečeť z teplého
bronzu (vermeil) s reliéfem fénixe (echo medailonu). Levá stránka má drobné
gold-leaf řádky (decorative, ne čitelné — žádný text). Vazba knihy z leštěného
stříbra, na hřbetu drobný cabochon rubín. Z otevřených stránek slabý
phoenix-radiance ambient warm glow vychází vzhůru. Drobné dust particles
v glowu.

Aspect ratio: 1:1 (1024×1024).
```

---

## 9. `icon-vytvorit-svet.webp` — Vytvořit svět (4-elementální mandala s genesis-spark)

```
Asset: square heraldic-shield nav icon, 1:1 aspect.

[SHARED NAV FRAME — viz #8]

SYMBOL UVNITŘ NICHE: **stylizovaná malá Compass of Four mandala v okamžiku
genesis** — kruhový stříbrný kompas s 4 mikro cabochony v kardinálních
pozicích (rubín-L, topaz-T, safír-R, smaragd-B), každý gem výrazně glowing
(jako kdyby právě "ožil"). V centru mandaly NE phoenix-sigil, ale velká
phoenix-radiance jiskra (#ffe8a8 → #ffd680 spark) — okamžik zrození nového
světa. 4 jemné stříbrné radiální paprsky vyzařují ze středu k 4 gemům
(spojení živlů s genesis-sparkem). Subtle dust particles oblétávající
v halo. **NE celý compass.webp asset** — tohle je menší stylizace v rámci
nav iconu.

Aspect ratio: 1:1 (1024×1024).
```

---

## 10. `icon-diskuze.webp` — Diskuze (dva propletené fénix-pera v stříbrném křížení)

```
Asset: square heraldic-shield nav icon, 1:1 aspect.

[SHARED NAV FRAME — viz #8]

SYMBOL UVNITŘ NICHE: **dvě propletená phoenix-quill pera křížící se ve středu
shieldu** — jedno pero s ohnivým gradient (rubín-červená → orange tip), druhé
pero s vodním gradient (safír-modrá → cyan tip). Pera jsou stylizovaná phoenix
feathers (NE husí brko), s drobnými gold-leaf detaily na rachis (středovém
stonku). V křížení uprostřed malý stříbrný knot/wrap se 2 mikro cabochony
(jeden rubín, jeden safír) — symbol setkání protikladů v dialogu. Z pér
vychází jemný odpovídající halo (warm pro ohnivé pero, cool pro vodní pero),
spojující se v centru do phoenix-radiance gold halo. Drobné dust particles.

Aspect ratio: 1:1 (1024×1024).
```

---

## 11. `icon-clanky.webp` — Články (svinutý pergamenový svitek s gem-pečetí)

```
Asset: square heraldic-shield nav icon, 1:1 aspect.

[SHARED NAV FRAME — viz #8]

SYMBOL UVNITŘ NICHE: **svinutý pergamenový svitek (NE rozvinutý!) zavázaný
silným bronzovým knotem ze 4 stuh** v 4 elementálních barvách (rudá-oranžová
oheň, modrá voda, zelená země, světle žlutá vzduch — všechny stuhy se
sbíhají do centrální gem-pečetě). Centrální pečeť: kulatý medailon z teplého
bronzu (vermeil) s reliéfem 4-elementální mandaly v miniatuře a centrálním
mikro phoenix-sigil. Pergamen krémově zlatavý, viditelná textura papíru.
Konce svitku z levého a pravého boku trochu odsahují, na pravém konci
vykukuje drobný gold-leaf okraj rytiny (decorative, ne čitelné). Phoenix-
radiance ambient halo zezadu. Drobné dust particles.

Aspect ratio: 1:1 (1024×1024).
```

---

## 12. `icon-galerie.webp` — Galerie (heraldic shield s portrétním medailonem)

```
Asset: square heraldic-shield nav icon, 1:1 aspect.

[SHARED NAV FRAME — viz #8]

SYMBOL UVNITŘ NICHE: **menší heraldic shield-medailon s gravírovaným
portrétním reliéfem** — uvnitř shieldu kruhový medailon z teplého bronzu
s gold-leaf rytým reliéfem stylizovaného renaissance portrétu (profil hlavy
v okraji, NE konkrétní obličej — jen elegantní silhouette s fancy collar
a vlasy). Okolo medailonu jemný stříbrný filigree rám. V 4 rozích kolem
medailonu drobné mikro cabochony (rubín-L, topaz-T, safír-R, smaragd-B).
Z medailonu phoenix-radiance ambient warm halo. Vyobrazení v reliéfu má
vypadat jako muzejní mince nebo cameo. Drobné dust particles.

Aspect ratio: 1:1 (1024×1024).
```

---

## 13. `icon-napoveda.webp` — Nápověda (armilární sféra / astrolabe)

```
Asset: square heraldic-shield nav icon, 1:1 aspect.

[SHARED NAV FRAME — viz #8]

SYMBOL UVNITŘ NICHE: **malá armilární sféra (astrolabe)** — kovová
3D mřížka 4 propletených stříbrných prstenů (rovník + 2 meridiány + ekliptika)
s drobným teplým bronzovým středovým "earth orb" uprostřed. Na vnějším
prstenu jemné gold-leaf gradace (decorative, ne čitelné). V 4 kardinálních
průsečících prstenů 4 mikro cabochony (rubín-L, topaz-T, safír-R, smaragd-B
— jako orientační hvězdy). Z centrální orb phoenix-radiance ambient warm
halo. Sféra je mírně z 3/4 úhlu (3D dojem). Symbol orientace, vědění,
univerzální mapy. Drobné dust particles.

Aspect ratio: 1:1 (1024×1024).
```

---

## 14. `icon-hospoda.webp` — Dimenzionální hospoda (alchymistický pohár s fénixovou párou)

```
Asset: square heraldic-shield nav icon, 1:1 aspect.

[SHARED NAV FRAME — viz #8]

SYMBOL UVNITŘ NICHE: **vysoký leštěný stříbrný pohár (chalice) baroque tvaru**
s teplým bronzovým stonkem a rozšířenou base. Pohár stojí v centru niche,
mírně z 3/4 úhlu. Uvnitř pohárů NE krev (to je temna-cerven), NE pivo
(to je hospoda), ale **phoenix-radiance ohnivá kapalina** (#ffe8a8 → #ffd680
glowing liquid) vyplňující 70% objemu. Z hladiny stoupá jemná zlatavá pára
(phoenix-radiance vapor) tvořící drobnou phoenix-silhouette siluetu vzhůru
v páře. Na stonku poháru centrální mikro phoenix-sigil (gold-leaf gravur).
V base poháru 4 mikro cabochony usazené v křížové formaci (rubín-vzadu,
topaz-přední, safír-pravo, smaragd-vlevo) — jako kdyby pohár drží energii
všech 4 živlů. Drobné dust particles plující v páře.

Aspect ratio: 1:1 (1024×1024).
```

---

## ✅ Workflow generování

1. **Vlož STYLE LOCK** (sekce „🔒 STYLE LOCK") jako první zprávu do nového ChatGPT chatu. Počkej na potvrzení.
2. **Generuj jeden asset za druhým** — vždy zkopíruj kompletní prompt z dané sekce (#1–#14). U nav ikon (#8–#14) ChatGPT už zná SHARED NAV FRAME ze style locku, takže stačí poslat blok s `[SHARED NAV FRAME — viz #8]` reference + symbol-popis.
3. **Stáhni PNG** s alpha channelem do `assets-source/themes/ctyri-zivly/<nazev>.png`.
4. **Konverze na webp:** `npm run themes:optimize` (existující skript) konvertuje PNG → webp.
5. **Cílový output:** `public/themes/ctyri-zivly/decor/<nazev>.webp`.

## 📦 Finální checklist (16 souborů celkem)

```
public/themes/ctyri-zivly/decor/
├── logo.webp                    ← user-provided (existing PNG)
├── medailon.webp                ← user-provided (existing PNG)
├── corner-tl.webp               ← prompt #1
├── cardinal-ruby.webp           ← prompt #2
├── cardinal-sapphire.webp       ← prompt #3
├── cardinal-emerald.webp        ← prompt #4
├── cardinal-topaz.webp          ← prompt #5
├── compass.webp                 ← prompt #6
├── divider-chain.webp           ← prompt #7
├── icon-uvodnik.webp            ← prompt #8
├── icon-vytvorit-svet.webp      ← prompt #9
├── icon-diskuze.webp            ← prompt #10
├── icon-clanky.webp             ← prompt #11
├── icon-galerie.webp            ← prompt #12
├── icon-napoveda.webp           ← prompt #13
└── icon-hospoda.webp            ← prompt #14
```

---

**Po vygenerování všech 14 assetů a jejich uložení do `assets-source/themes/ctyri-zivly/`** — pošli mi zprávu, pokračujeme na spec dokument (`spec-1.0m-ctyri-zivly-upgrade.md`) → souhlas → implementační plán → kód.
