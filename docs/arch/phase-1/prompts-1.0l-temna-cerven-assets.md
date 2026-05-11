# Temná červeň skin — asset prompty (1.0l)

> **STAV (2026-05-10):** ⏳ Čeká na vygenerování. **Cílový asset folder:** `assets-source/themes/temna-cerven/`.

Seznam **12 AI assetů** skinu Temná červeň:

**Signature (5):**
- 1× `corner-tl` — master roh hero karty (mirror přes CSS na zbylé 3 rohy)
- 1× `wax-seal` — visící krevní pečeť s otisky tesáků
- 1× `jet-bead-frame` — viktoriánský smuteční jet-bead rámeček okolo medailonu
- 1× `bat-arch` — oblouk z 9 letících netopýrů nad welcome card
- 1× `divider-rose` — horizontální stonek-růže mezi sekcemi v panelech

**Nav ikony (7) — všech 7 sdílí stejný baroque-cartouche frame:**
- `icon-uvodnik` · `icon-vytvorit-svet` · `icon-diskuze` · `icon-clanky` · `icon-galerie` · `icon-napoveda` · `icon-hospoda`

> **Background neměníme** — používáme existující `public/themes/backgrounds/temna-cerven.webp` (gotická katedrála). Skin overlay (damask wallpaper + chandelier glow + film grain + vinyl vignette) jej dostatečně přepíše.
> **Logo + medailon** dodány v `assets-source/themes/temna-cerven/logo.png` + `medailon.png` — bez promptu.

**Koncept:** **Soukromý salón nesmrtelného šlechtice — upír-sběratel.** Za 800 let nasbíral artefakty z různých epoch: křižácké železo, baroque stříbrná čalouněná elegance, viktoriánský jet-bead smutek, krev jako šperk. **Krev jako KLENOT, ne gore.** Atmosféra: opera box / privátní salón, NE kostnice (to je nemrtvi), NE gotická katedrála (to je reference image).

**Generátor:** ChatGPT (GPT-4o image gen) nebo Midjourney v6.1. Output: PNG s alfou, pak `cwebp -q 90 -alpha_q 100`.

**Reference logo + medailon (dodané user):** [`../../../assets-source/themes/temna-cerven/`](../../../assets-source/themes/temna-cerven/) — držet **stejnou paletu, materiály a světelný úhel** jako tyto. Drippy blackletter + železný kříž s hroty + krevní glow uvnitř medailonu.

---

## 🎨 STYLE GUIDE (závazné pro všechny assety)

Nedodržení = inkonzistentní set. ChatGPT/MJ často „uteče" do generic vampire-Halloween nebo sklouzne k cartoon stylu — proto explicitně vyjmenované zákazy.

### Reference look

**Inspirace:**
- *Bram Stoker's Dracula (1992 Coppola)* — krev jako sametová látka, baroque interiéry
- *Interview with the Vampire / Anne Rice* — Lestat de Lioncourt opera box, 18.-19. st. aristokratický dekadenc
- *Castlevania: Symphony of the Night* UI — gotický baroque cartouche
- *Diablo IV* Sanctuary kovaná řemeslná kvalita
- *Albrecht Dürer* engravingy — disciplína linky
- Viktoriánská **mourning jewelry** (jet beads, lacquer)
- **Sedlec NE** — to je nemrtvi (kostnice)

**Cíl:** prvotřídní game UI, **vampire aristocrat collector aesthetic**, painterly rendering, ostrý detail, dignified-decadent mrtvolnost. **Krev jako klenot.** Materiály vypadají jako kdyby byly vyfocené v muzejní vitríně.

**NE:** Halloween dekorace. NE cartoon vampires. NE skull party props. NE neon red. NE rose petal explosions (květinové kýčové). NE ossuary lebky / kosti / femury (to je nemrtvi). NE gold/brass (to je zlatý standard / hospoda). NE pergamen / dřevo (to je pergamen / hospoda). NE teal/green (to je nemrtvi). NE jump-scare horror.

### Klíčové odlišení od ostatních skinů

| Aspekt | Pergamen | Hospoda | Nemrtví | **Temna-cerven** |
|---|---|---|---|---|
| dominantní materiál | pergamen + zlato | dub + mosaz | blackened iron + bone | **iron + baroque silver + jet + crimson velvet** |
| světlo | warm candle gold | warm hearth amber | cold teal-ghost green | **garnet glow + blood-wax candle** |
| signature ornament | wax seal + corner | iron clasp + brass stamp | skull-arch + bone divider | **bat-arch + thorn-rose divider + iron-cross corner** |
| nálada | scholarly clean | lived-in cozy | dread + smrt + konec světa | **decadent seduction + krev jako klenot** |

### Závazná paleta

```
Pozadí (background):           #0a0307 — #14060a (bordeaux-čerň, WARM undertone — NE cool-green nemrtvi)
Železo (kovaný kříž, rohy):    #2a0c12 (blackened crusader iron s krevní patinou v drážkách)
Baroque stříbro (filigrée):    #a89890 (tarnished silver, jako stříbro 200 let nečistěné)
                               #d4c8be (highlight stříbro)
                               #463a36 (tarnish v drážkách)
Jet beads (smuteční perly):    #08020a (faceted lacquered black, lesklé broušené plochy)
Crimson velvet:                #3a0810 (sametová látka tmavá, viditelná textile pile direction)
Granátový cabochon:            #7e0a1e (jewel-cut blood gem, single highlight)
Granát žhnoucí (active):       #bf1f3a (incandescent — jen oči netopýra, glow uvnitř kartuše)
Krev (wax seal, drip):         #5a0a14 → #a8132e gradient (čerstvá, ne suchá)
Pleť šlechtice (rare):         #e8d6cc (porcelánová, nikdy nevystavená slunci)
```

### Závazné materiály

- **Hlavní rám:** blackened crusader iron (kovaný železný kříž s ostrými hroty — jako medailon dodaný user) — patina, ale ŽÁDNÁ rust orange — jen krevní pigmentace v drážkách
- **Sekundární rám:** tarnished baroque silver (filigrée květinové ornamenty, S-křivky, mušle, rocaille) — viditelný tarnish v hlubších částech
- **Cabochony:** granátové, broušené do hladké hrudky, jediný highlight bod, vnitřní žhnutí
- **Sametová látka:** tmavě crimson, viditelný směr vlasu (textile pile direction), lehké odlesky
- **Jet beads:** fasetované broušené plochy lakované černé, vysoký lesk, malá perla 6-8 fasetována
- **Krev:** lesklá (čerstvá), ne zaschlá; kape pomalu jako těžká kapalina
- **Světlo:** **single dramatic light source z horní třetiny obrazu**, zlatavé teplé jako od svícnu, deep shadows, lehké atmospheric particles (prach v paprsku)

### Závazné nálady

`decadent seduction` · `vampire aristocrat private salon` · `Lestat de Lioncourt` · `Bram Stoker Dracula 1992` · `Castlevania SOTN UI` · `victorian mourning jewelry` · `blood as jewel` · `crusader iron meets baroque silver`

NIKDY: horror-cheesy, Halloween, cartoon, party-skull, neon, jump-scare, rose-petal-kitsch, fluorescent.

### Technické požadavky pro každý asset

- PNG s **transparentním pozadím** (alpha channel) — žádný šedý/bílý fade-out, čistá alpha
- **Bez textu**, bez watermarku, bez rámu navíc kolem obrázku
- Single dramatic light source z horní třetiny, deep shadows
- Painterly + sharp detail rendering (NE 3D render look, NE flat illustration)
- Aspect ratio explicitně uveden u každého promptu

---

## 🔒 STYLE LOCK — vlož jako PRVNÍ zprávu do ChatGPT

Tohle vlož do nového ChatGPT chatu jako úvodní zprávu. ChatGPT-4o si style-lock zapamatuje a všechny následující assety budou stylově sladěné.

```
Budu generovat sérii UI assetů pro stejný dark-vampire-baroque skin "Temná červeň".
Drž tento styl pro VŠECHNY následující obrázky:

KONCEPT: Soukromý salón nesmrtelného šlechtice — upír-sběratel. Za 800 let
nasbíral artefakty: křižácké železo, baroque stříbrnou eleganci, viktoriánský
jet-bead smutek. Krev jako KLENOT, ne gore. Atmosféra: privátní opera box, NE
kostnice, NE Halloween, NE gotická katedrála.

MATERIÁLY:
- Hlavní rám: blackened crusader iron (kovaný železný kříž s ostrými hroty,
  krevní patina v drážkách — NE rust orange, jen tmavě crimson stain)
- Sekundární rám: tarnished baroque silver (filigrée květinové S-křivky,
  rocaille mušle, viditelný tarnish v hlubších částech — jako stříbro 200 let
  nečistěné)
- Cabochony: granát broušený do hladké hrudky, vnitřní žhnutí
- Sametová látka: tmavě crimson, viditelný směr vlasu, lehké odlesky
- Jet beads: fasetované lakované černé, vysoký lesk
- Krev: lesklá čerstvá, kape pomalu jako těžká kapalina (ne zaschlá)

PALETA (striktně dodržuj):
- Pozadí kovových objektů: #0a0307–#14060a (bordeaux-čerň, warm undertone)
- Železo: #2a0c12 (blackened crusader iron)
- Baroque stříbro: #a89890 base, #d4c8be highlight, #463a36 tarnish
- Jet: #08020a (faceted black lacquer)
- Crimson velvet: #3a0810
- Granát: #7e0a1e cabochon, #bf1f3a žhnoucí accent
- Krev: #5a0a14 → #a8132e gradient
- Pleť (rare): #e8d6cc porcelain

NÁLADA: vampire aristocrat collector private salon. Decadent seduction.
Bram Stoker Dracula 1992 / Lestat de Lioncourt / Castlevania SOTN UI /
viktoriánská mourning jewelry / Bloodborne sharp detail.
NIKDY horror-cheesy, NIKDY Halloween, NIKDY cartoon, NIKDY party-skull,
NIKDY neon. Profesionální game UI quality, painterly + sharp detail rendering,
single dramatic light source z horní třetiny, deep shadows, atmospheric particles.

VÝSTUP: PNG s transparentním pozadím (alpha channel), žádný text, žádné
watermarky, žádné rámy navíc kolem obrázku.

Potvrď, že jsi style-lock přečetl, a čekej na první asset prompt.
```

---

## 🖼 SHARED NAV FRAME (referenční popis pro 6 nav ikon)

Všech 7 nav ikon (úvodník, vytvořit svět, diskuze, články, galerie, nápověda, hospoda) sdílí **stejný baroque-cartouche rám**. Tento popis je zopakován v každém z 7 promptů jako konstanta:

```
SHARED NAV FRAME (consistent for all 7 nav icons):
- Vertikálně oválná baroque cartouche frame zabírá celou plochu obrázku
- Vnější obrys: tarnished baroque silver filigrée (S-křivky, rocaille mušle,
  malé květinové úponky)
- V horním vrcholu cartouche: malý blackened iron cross s ostrými hroty,
  uprostřed kříže granátový cabochon (#bf1f3a glowing softly)
- V dolním vrcholu cartouche: jedna kapka krve (#a8132e), právě se chystá
  odkapnout
- Uvnitř cartouche niche: tmavě crimson velvet pozadí (#3a0810) s viditelnou
  pile direction, ambient garnet glow zezadu
- Symbol z následujícího promptu sedí v centru niche, dramaticky osvětlený
  shora
- Jemné krevní patina v drážkách stříbra
```

---

## 1. `corner-tl.webp` — Roh hero karty (TL master, mirror přes CSS na TR/BL/BR)

```
Asset: top-left corner ornament for the welcome card frame.

Composition: ornament zabírá horní-levý kvadrant obrázku (cca 60% plochy v levém
horním rohu), zbytek je plně transparentní. Bottom-right roh fade do transparency.

Detail:
- Blackened crusader iron L-shaped corner bracket, sharp pointed tips
- Po obvodu obtočená baroque tarnished silver filigrée (S-křivky, rocaille mušle,
  drobné květinové úponky) — jako kdyby šlechta vzala starý křižácký rám
  a vyšperkovala ho stříbrnými ozdobami
- V samotném vrcholu rohu (na pivot pointu): velký granátový cabochon
  (#7e0a1e) s vnitřním žhnutím (#bf1f3a accent)
- Pod granátem visí jedna kapka krve, právě se chystá odkapnout
- Drobné iron krížky v 2-3 strategických bodech filigrée (echo medailonu)
- Krevní patina v drážkách železa (NE rust orange, jen tmavě crimson stain)

Aspect ratio: 1:1 (čtverec, např. 1024×1024).
```

---

## 2. `wax-seal.webp` — Visící krevní pečeť s otisky tesáků

```
Asset: hanging blood-wax seal with fang-bite punctures.

Composition: pečeť visí v horní třetině obrázku z černé hedvábné stuhy,
mírně nakloněná (-8°). Stuha jde od horního okraje obrázku dolů k pečeti.
Pod pečetí mírný stín. Zbytek obrázku transparentní.

Detail:
- Pečeť je velká kruhová placka tekoucího krevního vosku (#5a0a14 v hlubině,
  #a8132e na okraji, lesklý čerstvý povrch)
- Uprostřed pečetě dva otisky tesáků (vampire fang-bite punctures) — dvě úhledné
  oválné prohlubeniny ve vosku, mezi nimi cca 8mm rozestup
- Z punctures vytéká nepatrné množství tmavší krve, pomalu stéká po povrchu pečeti
- Po obvodu pečetě subtle iron filigrée prsten (#2a0c12 s tarnished silver
  highlights) — jako kdyby pečeť byla otisknutá těžkým iron signetem
- Černá hedvábná stuha s lesklými fold lines (žádné satin sheen, jen subtle moiré)
- Single dramatic light source z horního levého rohu, deep shadow vpravo dole

Aspect ratio: 1:1 (1024×1024).
```

---

## 3. `jet-bead-frame.webp` — Viktoriánský jet-bead mourning rámeček (okolo medailonu)

```
Asset: square jet-bead Victorian mourning frame — má obtočit existující medailon.

Composition: čtvercový rám tvořený drobnými fasetovanými jet-beads. Vnitřní
otvor obdélníkový/čtvercový (cca 70% plochy obrázku — TADY se umístí medailon
přes CSS), rám zabírá vnější 15% obvodu. Zbytek transparentní.

Detail:
- Rám tvořen 4 vrstvami drobných (cca 6-8mm) fasetovaných lakovaných black jet
  beads — viktoriánská mourning jewelry technique
- Každý bead má malé highlight body kde se odráží světlo (high gloss)
- V rozích rámu malé baroque silver kovové ozdoby (S-fleur or rocaille shell)
  s tarnish v drážkách
- V centru horní hrany rámu jeden malý granátový cabochon (#7e0a1e) —
  jediný barevný akcent v jinak monochromatickém jet-černém rámu
- Subtle dust particles na povrchu beads (museum quality patina)
- Hluboké stíny mezi řadami beads (deep shadow gaps)

Aspect ratio: 1:1 (1024×1024). Vnitřní otvor 70% plochy s plně transparentním
pozadím (alpha = 0).
```

---

## 4. `bat-arch.webp` — Oblouk z 9 letících netopýrů (signature element nad hero card)

```
Asset: horizontal architectural arch ornament for a welcome panel header.

Composition: graceful pointed-baroque arch tvořen 9 letícími netopýry —
chiroptera v různých polohách křídel, formující dohromady obrysový oblouk.
Centrální velký netopýr na vrcholu (peak), 4 menší po každé straně sestupují
v perspektivě. Pod oblouk (dolní hrana obrázku) plně transparentní.

Detail:
- Centrální velký netopýr (peak): rozpřažená křídla, **granátově žhnoucí oči
  (#bf1f3a)** — radium-bright glow, jediný silně barevný bod celé scény;
  detailní mušelínová struktura křídel, drobné nehty na koncích křídel,
  lesklá černá srst
- 8 menších netopýrů (4 vlevo + 4 vpravo, sestupně menších): klidnější polohy
  křídel, oči jen jemný garnet ambient (NE žhnoucí), zachycené v různých úhlech
  letu — některé s rozevřenými křídly, některé v půl-ohnutí
- Mezi netopýry tenké blackened iron chains (jako kdyby je něco drželo
  v sestavě) — chains připomínají drobné upířího gryfa-šperka
- Subtle baroque silver filigrée mezi řetězy v dolní části oblouku
- V centrálním vrcholu malý zavěšený granátový cabochon nebo wax-blood drop
- Z očí centrálního netopýra slabý ambient garnet glow rozplývá do scény
- Atmospheric particles (jemný prach / dust motes osvícený jeho glowem)

Pod arch: plně transparentní (arch funkce = "koruna" nad welcome cardem).

Aspect ratio: 4:1 (very wide horizontal, např. 2048×512). Pokud ChatGPT
nedovolí, použij 16:9 a arch zabírá horní třetinu, dolní 2/3 transparentní.
```

---

## 5. `divider-rose.webp` — Horizontální stonek-růže mezi sekcemi v panelech

```
Asset: horizontal section divider ornament — a single thorn-rose stem.

Composition: ve středu obrázku horizontálně položený dlouhý stonek tmavě
karmínové růže s ostrymi trny. Uprostřed stonku jedno plně rozkvetlé poupě
růže (full bloom). Levý a pravý konec stonku fade do transparentního pozadí.

Detail:
- Stonek: tmavě crimson-zelený (#3a1810 → #5a0a14), pokrytý ostrymi černými trny
  (cca 6-8 trnů na 12cm délky), drobné lístky tu a tam
- Centrální poupě: plně rozkvetlá tmavě karmínová růže (#7e0a1e v hlubině,
  #a8132e na okrajích lístků), 5-7 vrstev okvětních lístků, sametová textura
- Na jednom z dolních okvětních lístků jedna kapka krve (#a8132e) — právě
  se chystá odkapnout, lesklá fresh blood
- Na konci stonků (vpravo a vlevo): subtle blackened iron clasps
  s drobným granátovým cabochon — jako kovaná pouta drží stonek
- Pozadí: zcela transparentní
- Single dramatic light source shora, deep shadow pod růží

Aspect ratio: 6:2 nebo 8:2 (very wide horizontal, např. 1536×512).
```

---

## 6. `icon-uvodnik.webp` — Úvodník (otevřený pozvánkový dopis s otiskem tesáků)

```
Asset: square baroque-cartouche nav icon, 1:1 aspect.

SHARED NAV FRAME (consistent for all 7 nav icons):
- Vertikálně oválná baroque cartouche frame zabírá celou plochu obrázku
- Vnější obrys: tarnished baroque silver filigrée (S-křivky, rocaille mušle,
  malé květinové úponky)
- V horním vrcholu cartouche: malý blackened iron cross s ostrými hroty,
  uprostřed kříže granátový cabochon (#bf1f3a glowing softly)
- V dolním vrcholu cartouche: jedna kapka krve (#a8132e), právě se chystá
  odkapnout
- Uvnitř cartouche niche: tmavě crimson velvet pozadí (#3a0810) s viditelnou
  pile direction, ambient garnet glow zezadu
- Symbol uvnitř niche dramaticky osvětlený shora

SYMBOL UVNITŘ NICHE: otevřený pergamenový pozvánkový dopis (vellum
invitation card) — bílo-krémový pergamen, mírně zažloutlý, jemné zlomeniny.
Dopis je rozložen jakoby uprostřed četby, jeden roh visí volně. Na něm
**rozlomená krevní pečeť** — pečeť pukla na 2 části, mezi nimi viditelné
**dva otisky tesáků** (vampire fang-bite punctures). Z pečeti vytéká pár kapek
krve. Žádný viditelný text na pergamenu, jen jemné horizontální linie inkoustu
(suggested writing).

Aspect ratio: 1:1 (1024×1024).
```

---

## 7. `icon-vytvorit-svet.webp` — Vytvořit svět (obsidiánový glóbus)

```
Asset: square baroque-cartouche nav icon, 1:1 aspect.

SHARED NAV FRAME (consistent for all 7 nav icons):
- Vertikálně oválná baroque cartouche frame, tarnished silver filigrée
- Top: malý iron cross s granátovým cabochon
- Bottom: jedna kapka krve
- Uvnitř: crimson velvet niche s ambient garnet glow

SYMBOL UVNITŘ NICHE: malý **obsidiánový glóbus** (cca čtvrtina výšky niche)
spočívající na malém **baroque silver pedestalu** (rocaille mušle base).
Glóbus je z lesklého černého obsidiánu — povrch hladký, leštěný, zrcadlově
černý. Skrz povrch glóbu prosvítají **žhnoucí krevní žíly** (#a8132e glowing
veins) — jako kdyby uvnitř glóbu pulsovala krev. Žíly tvoří organický
network — žádné kontinenty, jen anatomicky-zemský feel. Jemný garnet halo
okolo glóbu. Pedestál baroque silver s tarnish v drážkách.

Aspect ratio: 1:1 (1024×1024).
```

---

## 8. `icon-diskuze.webp` — Diskuze (dvě benátské maškarní masky zkřížené)

```
Asset: square baroque-cartouche nav icon, 1:1 aspect.

SHARED NAV FRAME (consistent for all 7 nav icons):
- Vertikálně oválná baroque cartouche frame, tarnished silver filigrée
- Top: malý iron cross s granátovým cabochon
- Bottom: jedna kapka krve
- Uvnitř: crimson velvet niche s ambient garnet glow

SYMBOL UVNITŘ NICHE: dvě benátské maškarní masky zkřížené přes sebe v
úhlu cca 30°.

Maska 1 (vpředu, vlevo-dole): **klasická porcelánová bauta tvář**, bílá
porcelánová pleť (#e8d6cc), zlomená nebo ztichlá expresie, prázdné černé
otvory očí, jemné zlatě-stříbrné okraje. Drobná stužka uvázaná na boku.

Maska 2 (vzadu, vpravo-nahoru): **netopýří půl-maska** (covers eyes only),
černá lakovaná z jet, **rozpřažená netopýří křídla po stranách jako
"obočí" / "rohy"**, **dva malé granátové cabochony jako oči** (#bf1f3a
glowing softly). Aristokraticky elegantní, NE Halloween-cheesy.

Mezi maskami subtle silver chain link je drží propojené. Dramatic light
source shora, deep shadow pod maskami.

Aspect ratio: 1:1 (1024×1024).
```

---

## 9. `icon-clanky.webp` — Články (sametem vázaný deník se sponou)

```
Asset: square baroque-cartouche nav icon, 1:1 aspect.

SHARED NAV FRAME (consistent for all 7 nav icons):
- Vertikálně oválná baroque cartouche frame, tarnished silver filigrée
- Top: malý iron cross s granátovým cabochon
- Bottom: jedna kapka krve
- Uvnitř: crimson velvet niche s ambient garnet glow

SYMBOL UVNITŘ NICHE: **karmínový sametem vázaný deník** (vampire's diary)
zavřený, postavený na hraně knihy nebo mírně otevřený s viditelnou stranou.
Sametová pile direction viditelná na vazbě (#3a0810 tmavě, lesklejší proti
světlu).

- **Těžká stříbrná spona** s ozdobou (tarnished baroque silver, S-fleur
  rocaille pattern) zamykající deník
- **Krvavě červená hedvábná záložka** (#a8132e) vyčuhuje z horní hrany,
  visí dolů přes přední vazbu
- Na sametovém krytu **dva slabé otisky tesáků** (subtle fang-bite
  punctures) — drobné prohlubeniny ve sametu, ne viditelně krvavé,
  jen "byl tu pán"
- Edge stránek zlato-tarnished (foredge gilt patina)
- Drobný granátový cabochon zasazený do středu spony

Aspect ratio: 1:1 (1024×1024).
```

---

## 10. `icon-galerie.webp` — Galerie (rám s portrétem upíra bez odrazu)

```
Asset: square baroque-cartouche nav icon, 1:1 aspect.

SHARED NAV FRAME (consistent for all 7 nav icons):
- Vertikálně oválná baroque cartouche frame, tarnished silver filigrée
- Top: malý iron cross s granátovým cabochon
- Bottom: jedna kapka krve
- Uvnitř: crimson velvet niche s ambient garnet glow

SYMBOL UVNITŘ NICHE: malý **gold-bone barokní rám** (zlato-tarnished s
bone-ivory inlay flourishes — NE čistě bone) obsahující **portrét džentlmena,
jehož silueta je vidět ale obličej není**. Silueta se ROZPLÝVÁ do dýmu /
mlhy v místě obličeje — viditelné rameno, oblek (cravat, vysoký stojací
límec, frock coat), tvar hlavy, ale obličej a oči chybí — jako kdyby se
rozpustily do mlhy. Klasický **upírský trop „bez odrazu"** (no reflection).

Pozadí portrétu: tmavě bordeaux velvet (#3a0810) s ambient garnet light.
Silueta v tmavších odstínech. Drobné dust particles okolo.

Rám: ornátní baroque s rocaille mušlemi, gold-tarnish s bone inlay
v křivkách filigrée — vypadá staře a museum-quality.

Aspect ratio: 1:1 (1024×1024).
```

---

## 11. `icon-napoveda.webp` — Nápověda (trojramenný kandelábr s krvavými svícemi)

```
Asset: square baroque-cartouche nav icon, 1:1 aspect.

SHARED NAV FRAME (consistent for all 7 nav icons):
- Vertikálně oválná baroque cartouche frame, tarnished silver filigrée
- Top: malý iron cross s granátovým cabochon
- Bottom: jedna kapka krve
- Uvnitř: crimson velvet niche s ambient garnet glow

SYMBOL UVNITŘ NICHE: **trojramenný baroque kandelábr** (three-pronged
candelabra), kovaný z tarnished baroque silver, ornátní base s rocaille
mušlemi, tři ramena rozevřená do trojhranu, na každém rameni jedna **krvavě
červená dripping svíčka** (#5a0a14 vosk, lesklý povrch — NE matný).

Z každé svíčky:
- Jasný plamen (#bf1f3a → #d4c8be ve špičce, jako garnet flame)
- Dripping vosk po straně svíčky stéká dolů (visible drips)
- Jemný kouř (faint smoke wisps) stoupá vzhůru do horní části niche

Centrální (prostřední) svíčka mírně vyšší než postranní. Atmospheric particles
osvícené plameny. Subtle reflection plamenů na tarnished silver kandelábru.

Aspect ratio: 1:1 (1024×1024).
```

---

## 12. `icon-hospoda.webp` — Dimenzionální hospoda (křišťálový pohár krve s portálovým odrazem)

```
Asset: square baroque-cartouche nav icon, 1:1 aspect.

SHARED NAV FRAME (consistent for all 7 nav icons):
- Vertikálně oválná baroque cartouche frame, tarnished silver filigrée
- Top: malý iron cross s granátovým cabochon
- Bottom: jedna kapka krve
- Uvnitř: crimson velvet niche s ambient garnet glow

SYMBOL UVNITŘ NICHE: **křišťálový broušený pohár (chalice)** s baroque
stříbrným stonkem a base. Pohár je v centru niche, mírně z 3/4 úhlu (nebo
profile), aby byly vidět faseta i obsah.

- **Křišťálová miska poháru:** broušená do fasetových ploch (cca 8-12 facet),
  vysoký lesk, na hranách jemný refrakční highlight
- **Uvnitř pohárů: tmavá krev** (#5a0a14 v hlubině, #a8132e na povrchu),
  vyplňuje cca 70% objemu, viditelný mírný meniscus na okraji
- **Stonek:** baroque tarnished silver, ornátní formovaný (rocaille mušle
  v base, S-křivky na stonku)
- V centru stonku **drobný granátový cabochon** (#bf1f3a glowing softly)
  zasazený jako klenot
- **Po straně poháru jedna kapka krve** stéká dolů (lesklá fresh blood,
  visible drip)
- **DIMENZIONÁLNÍ PRVEK:** Na povrchu krve uvnitř poháru se zrcadlí jemný
  **portálový vortex / nebula swirl** — fialovo-granátové mlžné víry
  (#7e0a1e + #bf1f3a) jakoby nad pohárem viselo něco "z jiné dimenze".
  NE doslovně nakreslený portál nad pohárem — POUZE jako odraz na hladině
  krve uvnitř poháru.
- Drobné dust particles okolo, garnet ambient halo

Aspect ratio: 1:1 (1024×1024).
```

---

## Workflow

1. **Otevři nový chat v ChatGPT** (clean session, žádný předchozí kontext).
2. **Vlož STYLE LOCK** jako první zprávu → počkej na potvrzení.
3. **Postupně vlož prompty 1–12.** Po každém:
   - Vyhodnoť výsledek vůči STYLE GUIDE výše.
   - Pokud se odchýlí (špatná paleta, chybný materiál, Halloween-cheese, ossuary lebky, neon glow), v chatu řekni *"drž STYLE LOCK, paleta sklouzla — regeneruj"* a opakuj.
   - Při větší odchylce (např. 3+ regenerací stejného assetu) → otevři nový chat se STYLE LOCK znovu.
4. **Ulož PNG soubory** do `assets-source/themes/temna-cerven/`:
   - `corner-tl.png`
   - `wax-seal.png`
   - `jet-bead-frame.png`
   - `bat-arch.png`
   - `divider-rose.png`
   - `icon-uvodnik.png`, `icon-vytvorit-svet.png`, `icon-diskuze.png`, `icon-clanky.png`, `icon-galerie.png`, `icon-napoveda.png`, `icon-hospoda.png`
5. **Po dodání všech 12 PNG mě upozorni** — projdu je jeden po druhém, řeknu jestli sedí style-lock, a navrhnu regenerace pokud něco neladí.
6. **Až budou všechny assety OK**, pokračujeme dalším krokem (spec-driven-development, finalize-script s konverzí do .webp, implementace).

---

## Acceptance kritéria assetů

Pro každý asset před akceptací zkontroluj:

- [ ] Transparentní pozadí (žádný šedý/bílý "checkerboard" by neměl být viditelný kolem objektu)
- [ ] Paleta sedí (železo blackened crusader v crimson stain, NE rust orange; stříbro tarnished baroque, NE jasně leštěné; granát jewel-cut, NE neon)
- [ ] Materiály konzistentní napříč všemi 12 assety
- [ ] Žádný text, watermark, ani chybný "ChatGPT-style" rám okolo
- [ ] Single dramatic light source z horní třetiny, deep shadows
- [ ] **Žádné ossuary prvky** (lebky, femury, kosti) — to je nemrtvi, NE temna-cerven
- [ ] **Žádné Halloween-cheese** (cartoon vampires, party-skull props, neon)
- [ ] **Žádné gold/brass dominantní barvy** (jen drobné gold-tarnished akcenty u icon-galerie)
- [ ] Konkrétní asset matchuje svůj prompt (např. icon-galerie = silueta bez obličeje, ne plný portrét)
- [ ] **Nav ikony 6-12 sdílí stejný baroque-cartouche frame** (cartouche tvar + iron cross + krevní kapka + velvet niche identické)

Pokud asset selže ≥2 kritéria → regeneruj.
