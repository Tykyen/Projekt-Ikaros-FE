# Vesmírná bitva skin — asset prompty (1.0n)

> **STAV (2026-05-11):** ⏳ Čeká na vygenerování. **Cílový asset folder:** `assets-source/themes/vesmirna-bitva/`.

Seznam **11 AI assetů** skinu Vesmírná bitva:

**Signature (4):**
- 1× `corner-tl` — battle-plate corner bracket s nýty a podpálenými hranami (master TL, mirror přes CSS na zbylé 3 rohy)
- 1× `medailon-frame` — pancéřový rám s nýty a ohořelými rohy okolo medailonu
- 1× `destroyer-schematic` — wireframe top-down destroyer s 3 damage X marks (nad welcome cardem)
- 1× `targeting-reticle` — koncentrické kruhy s crosshair (decorative status strip pod welcome cardem)

**Nav ikony (7) — všech 7 sdílí stejný console-panel button frame:**
- `icon-uvodnik` · `icon-vytvorit-svet` · `icon-diskuze` · `icon-clanky` · `icon-galerie` · `icon-napoveda` · `icon-hospoda`

> **Background neměníme** — používáme existující `public/themes/backgrounds/vesmirna-bitva.webp` (battle scene — viewport okno bitevního křižníku, hořící lodě, plazmové výbuchy, debris). Skin overlay (scanline + grain + alarm glow) jej dostatečně přepíše.
> **Logo + medailon** dodá user v `assets-source/themes/vesmirna-bitva/logo.png` + `medailon.png` — bez promptu.

**Koncept:** **Můstek těžkého bitevního křižníku v akutním boji.** Klaxon vyje, červené nouzové LED bliká, panely jsou pancéřové ocelové desky s nýty a podpálenými hranami, jiskry padají z rohů. *Brutální, nebezpečný, beznadějný* — člověk ví, že může padnout a zemřít, ale dělá svou práci. Tohle není čistý sci-fi hangár, není to elegantní velitelská sálová HUD, není to gotická vesmírná katedrála. Tohle je **damage control v aktivní bitvě**.

**Generátor:** ChatGPT (GPT-4o image gen) nebo Midjourney v6.1. Output: PNG s alfou, pak `cwebp -q 90 -alpha_q 100`.

**Reference logo + medailon (dodá user):** [`../../../assets-source/themes/vesmirna-bitva/`](../../../assets-source/themes/vesmirna-bitva/) — držet **stejnou paletu, materiály a světelný úhel** jako tyto. Stencil "PROJEKT IKAROS" banner + andělský medailon s hellfire-red glow.

---

## 🎨 STYLE GUIDE (závazné pro všechny assety)

Nedodržení = inkonzistentní set. ChatGPT/MJ často „uteče" do generic sci-fi modré (cool blue/cyan) nebo clean futuristic HUD — proto explicitně vyjmenované zákazy.

### Reference look

**Inspirace:**
- *Mass Effect 3* poškozený Normandy bridge — damage panels, red emergency lighting
- *Dead Space 2* USG Ishimura — heavy industrial panels, sparks, scorched metal
- *Battlestar Galactica (2004)* — nouzové LED + klaxony, gritty military feel
- *Helldivers 2* — hazard tlačítka, stenciled warnings, brutalist UI
- *Aliens (1986) Nostromo console* — chunky industrial buttons, monochromatic red
- *Star Citizen* damage states (NE clean state — ten je vesmirna-lod)

**Cíl:** prvotřídní game UI, **battle-station-under-attack aesthetic**, photorealistic damaged-metal rendering, ostrý detail, gritty-but-elegant. **Pancéř, červené emergency světlo, jiskry.** Materiály vypadají jako kdyby byly vyfocené v reálné lodi pod palbou.

**NE:** clean sci-fi (Star Trek bridge — to je sci-fi skin). NE cyan/teal/blue (to je vesmirna-lod). NE pink/magenta neon (to je sci-fi skin). NE gold/brass (to je zlatý standard / hospoda). NE viktoriánský baroque s damask (to je temna-cerven, sdílí červeno-černou paletu, ale úplně jinou materiálovou DNA). NE Warhammer 40K cathedral (gotické oblouky, vitráže, aquila — má vlastní niche, ne tady). NE žluto-černá hazard pruhy (kýčové Star Citizen tropy). NE cartoon, NE Halloween, NE explicitní gore. **NE cracks / shattered glass** (uživatel vybral burned edges, ne praskliny).

### Klíčové odlišení od ostatních skinů

| Aspekt | vesmirna-lod | sci-fi | temna-cerven | **vesmirna-bitva** |
|---|---|---|---|---|
| stav lodi | clean hangár, klid | command HUD, klid | privátní salón | **damage control, aktivní boj** |
| paleta | cyan + amber dual-tone | cyan + magenta neon | bordeaux + silver tarnish | **hellfire red + gunmetal + plasma ember** |
| dominantní materiál | clean plate metal | holographic glass | baroque iron + silver | **battle-scarred gunmetal s podpálením** |
| světlo | cool ambient hangar | neon holographic | candle warm | **red emergency LED + plasma orange sparks** |
| signature ornament | military plate corner | clean HUD glyphs | bat-arch + jet-bead | **battle-plate bracket s nýty + ohořelými rohy** |
| typografie | Orbitron clean | Orbitron clean | Pirata One blackletter | **Saira Stencil One — military stencil** |
| nálada | disciplined calm | optimistic command | decadent seduction | **brutal danger, hopelessness** |

### Závazná paleta

```
Pozadí (background void):       #06030a — #0e0408 (deep void, slight warm undertone)
Bulkhead steel (panel base):    #160a10 — #1c0e14 (warm dark, NE cool blue)
Gunmetal (kovová neutrální):    #3a3e44 (base — battle-scarred plate)
                                #a4acb4 (highlight rim, lehčí gunmetal)
                                #1a1c20 (shadow groove, deep recess)
Hellfire red (primární akcent): #b8101c (primary)
                                #d4111c (hover/active)
                                #e8202a (incandescent, alarm peak)
                                #5a0810 (deep hellfire shadow)
Plasma (sekundární highlight):  #ff5040 (hot edge — plasma fire, glow)
                                #ff7050 (peak — brightest spark)
Ember burn (ohořelé hrany):     #ff5028 (orange-red ember, blends to char)
                                #1a0608 (charred black, edge of burn)
Rivet metal:                    #2a2e34 (recessed dark) → #6a7078 (rim highlight)
Red emergency LED:              #ff2030 (LED filament center, sharp glow)
Text na assetech (žádný!):      — (vše bez textu)
Smoke / wisp:                   rgba(80, 60, 50, 0.4) — tmavá, lehce teplá
```

### Závazné materiály

- **Hlavní materiál:** **battle-scarred gunmetal steel** — tmavá ocel s viditelnou scratched/scuffed texturou, jemné šedo-modré tonality (NE cool blue, jen velmi mírné cooling). Rivets v rozích panelů jsou recessed (vsazené dovnitř), ne vyčnívající.
- **Ohořelé hrany (signature):** orange-red ember gradient (`#ff5028 → #1a0608`) podél vnějších okrajů, jako by panel byl zasažen plasmovou palbou. Lehké wisps tmavého kouře nad nejhoršími částmi. Hrana NENÍ ostrá — je *warped*, *bublinatá*, deformovaná žárem.
- **Rivets (nýty):** přesně kruhové, vsazené, kovové, 4× na corner brackets a 6-8× na medailon-frame. Slabý highlight nahoře (jako od horního světla).
- **Red emergency LED:** ostré bodové světlo (NE široký glow), `#ff2030` core + thin `#ff5040` halo (3-4px), umístěno typicky v notch / recess gunmetal části.
- **Plasma sparks:** jasné body bílé-orange (`#ff7050 → #b8101c → transparent`), motion-blurred směrem nahoru, jako od elektrického zkratu.
- **Wireframe (destroyer + reticle):** thin red lines (`#b8101c`, 1-2px stroke) na pure black background, krátké tick marks, technical blueprint feel.
- **Světlo:** **single dramatic light source z horní třetiny obrazu**, mírně cool (white-ish), ale celkový ambient tlumený do red — pochází z emergency LED ze stran a z bottom. Deep shadows, vysoký kontrast.

### Závazné nálady

`battle stations` · `general quarters` · `damage control` · `under fire` · `emergency red lighting` · `industrial brutalism` · `Mass Effect Normandy damaged` · `Dead Space Ishimura` · `Battlestar Galactica gritty` · `cold dread, hot fire`

NIKDY: clean futuristic, peaceful, optimistic, holographic, neon, baroque, gothic cathedral, victorian, Halloween, cartoon, fluorescent.

### Technické požadavky pro každý asset

- PNG s **transparentním pozadím** (alpha channel) — žádný šedý/bílý fade-out, čistá alpha
- **Bez textu**, bez watermarku, bez rámu navíc kolem obrázku
- Single dramatic light source z horní třetiny + secondary red emergency LED ambient
- Photorealistic rendering — **NE flat illustration, NE cartoon, NE 3D render look** (vypadat jako foto reálného poškozeného kovu)
- Aspect ratio explicitně uveden u každého promptu
- Žádné generické "sci-fi blue" světlo — *vždy* warm-red / plasma-orange / gunmetal grey

---

## 🔒 STYLE LOCK — vlož jako PRVNÍ zprávu do ChatGPT

Tohle vlož do nového ChatGPT chatu jako úvodní zprávu. ChatGPT-4o si style-lock zapamatuje a všechny následující assety budou stylově sladěné.

```
Budu generovat sérii UI assetů pro stejný battle-station-under-attack skin
"Vesmírná bitva". Drž tento styl pro VŠECHNY následující obrázky:

KONCEPT: Můstek těžkého bitevního křižníku v aktivním boji. Klaxon vyje,
červené nouzové LED bliká, panely jsou pancéřové ocelové desky s nýty a
podpálenými hranami, jiskry padají z rohů. Brutální, nebezpečný, beznadějný.
NE clean sci-fi (žádné Star Trek bridges). NE cyan/teal/blue. NE neon. NE
viktoriánský baroque. NE gotická katedrála.

MATERIÁLY:
- Hlavní: battle-scarred gunmetal steel (tmavá ocel s scratched/scuffed
  texturou, mírné šedo-modré tonality, NE cool blue)
- Rivets (nýty): kruhové, vsazené (recessed), kovové, slabý highlight nahoře
- Ohořelé hrany (signature): orange-red ember gradient (#ff5028 to #1a0608)
  podél vnějších okrajů, lehké wisps tmavého kouře, warped/bublinaté hrany
- Red emergency LED: ostré bodové světlo (#ff2030 core + #ff5040 halo),
  vsazené do gunmetal notch
- Plasma sparks: jasné body bílé-orange (#ff7050 to #b8101c), motion-blurred
  vzhůru
- Wireframe technical art: thin red lines (#b8101c, 1-2px) na pure black,
  krátké tick marks, blueprint feel

PALETA (závazné, žádné jiné barvy):
- Gunmetal: #3a3e44 base, #a4acb4 highlight, #1a1c20 shadow
- Hellfire red: #b8101c primary, #d4111c hover, #e8202a peak, #5a0810 deep
- Plasma: #ff5040 hot edge, #ff7050 peak
- Ember burn: #ff5028 orange-red, #1a0608 char
- Void background: #06030a — but všechny assety jsou transparent PNG
- ŽÁDNÉ jiné barvy: žádný cyan, žádný magenta, žádný amber, žádné zlato,
  žádné stříbro (jen gunmetal grey)

SVĚTLO: single dramatic light source z horní třetiny obrazu (mírně cool
white-ish), ale celkový ambient tlumený do red — pochází z emergency LED
ze stran a z bottom. Deep shadows, vysoký kontrast.

RENDERING: photorealistic damaged-metal feel (jako foto reálného poškozeného
kovu — NE flat illustration, NE cartoon, NE 3D render look, NE clean
futurismus).

ATMOSFÉRA: battle stations, general quarters, damage control, under fire,
emergency red lighting, industrial brutalism. Mass Effect 3 Normandy damaged,
Dead Space Ishimura, Battlestar Galactica gritty.

KAŽDÝ asset:
- PNG s transparentním pozadím (čistá alpha)
- Bez textu, bez watermarku, bez extra rámu
- Isolated element, žádné scene background
- Aspect ratio dle pokynu

Potvrď, že jsi style locked. Pak ti pošlu první asset.
```

---

## 1. `corner-tl.png` — Battle-plate corner bracket (master TL)

**Použití:** master roh hero karty (welcome card + sidebars + novinky panel + ALERT panel). Mirror přes CSS scaleX/scaleY na ostatní 3 rohy.

**Aspect ratio:** 1:1 (square)
**Velikost:** 1024×1024 px
**Transparent PNG**

```
Battle-damaged steel armor plate corner bracket, top-left orientation,
forming an L-shape. Material: dark gunmetal grey (#3a3e44) with subtle
scratched/scuffed texture and faint scuff marks. Two arms: one extending
right horizontally, one extending down vertically, meeting at a 45° miter
bevel at the inner corner.

Along each arm: 2 small visible recessed rivets (4 total), circular,
metallic, slightly highlighted from above. Rivets are vsazené dovnitř,
not protruding.

The outer corner (top-left edge) is BURNED and WARPED — orange-red ember
gradient (#ff5028 fading to deep black #1a0608) bleeds along the outer
edges as if recently impacted by plasma fire. The edge is bubbled,
deformed by heat, NOT a clean cut. Thin wisps of dark smoke trail upward
from the burned area.

At the inner corner notch (where the two arms meet), a faint red
emergency LED light glows (#ff2030 core, #ff5040 halo, 4px), recessed
into a small dark notch.

Photorealistic, high detail, isometric front view, transparent PNG,
1024×1024 px, isolated decor element, no background, no text, no logo.

Style: Mass Effect 3 damaged Normandy bridge corner, Dead Space Ishimura
panel corner, Helldivers 2 industrial bracket. Heavy industrial brutalism.
```

---

## 2. `medailon-frame.png` — Pancéřový rám okolo medailonu

**Použití:** outer frame okolo Ikaros medailonu ve welcome cardu. Asset má průhledný střed (kde sedí medailon), vnější rám je pancéřová deska.

**Aspect ratio:** 1:1 (square)
**Velikost:** 1024×1024 px
**Transparent PNG** (i ve středu — průhledný kruh kde půjde medailon)

```
A heavy gunmetal steel armor frame surrounding an empty circular cutout
in the center. The outer shape is a slightly bevelled OCTAGONAL frame
(8 sides, equal length, mild bevel on each face), the inner cutout is
a perfect CIRCLE (transparent in the center — the frame surrounds nothing).

Material: dark gunmetal grey (#3a3e44 to #1a1c20 gradient with battle-
scarred scratched texture). Visible scuff marks, paint chipped at random
edges revealing slightly lighter metal underneath.

Around the inner circular cutout, RECESSED rivets are placed at 8 cardinal
positions (N, NE, E, SE, S, SW, W, NW), each rivet metallic with subtle
top-highlight. Approximately 24-28 pixel rivets at 1024 size.

The four corners of the octagonal outer shape are BURNED and WARPED —
orange-red ember gradient (#ff5028 fading to #1a0608 char) bleeds inward
from each corner, deformed by plasma fire impact. Thin smoke wisps rise
from the most damaged corners.

Behind/around the inner circular cutout edge, a faint red glow rim
(#b8101c, 6-8px halo) is present — as if a red emergency backlight glows
from inside the medallion socket, illuminating the inner edge.

Photorealistic, frontal view, transparent PNG, 1024×1024 px. The CENTER
must be fully transparent (no background, no medallion image inside —
just the frame). Outer area also transparent (isolated element).

Style: Aliens (1986) Nostromo console panel access port, Helldivers 2
ammunition crate bezel, Mass Effect 3 damaged bulkhead frame. Heavy
industrial, war-weathered.
```

---

## 3. `destroyer-schematic.png` — Wireframe destroyer s damage X marks

**Použití:** horizontal strip nad welcome cardem. Technical blueprint style — top-down view destroyer ship s viditelnými damage markery.

**Aspect ratio:** 4:1 (horizontal banner)
**Velikost:** 2048×512 px
**Transparent PNG**

```
Top-down technical blueprint schematic of a heavy destroyer-class
spaceship, rendered in THIN red phosphor wireframe lines (#b8101c,
1-2px stroke) on a fully TRANSPARENT background. The ship occupies
the entire horizontal width, centered.

Ship anatomy (top-down view):
- Elongated central hull (front pointing left), approximately 1800 px wide
- Sharp angular pointed bow at the far left
- Wider mid-section with 2 visible engine pods symmetrically placed
- 4 turret mounts (2 forward, 2 aft) shown as small circles with
  protruding lines (cannon barrels)
- Rear engine block at the far right with 3 thrust nozzles

Style: technical blueprint, like a NASA spacecraft cutaway diagram or
an Eve Online hull schematic. Very precise lines, minimal shading, no
fill — purely line art on transparent background. Light section dividers
showing internal compartments (faint 1px lines).

DAMAGE INDICATORS (signature element):
- 3 prominent red X-marks (#d4111c, bold thicker stroke 3-4px) placed
  on damage zones: one on forward hull (front-left third), one on
  mid-section (engine block area), one on aft port side
- Each X-mark has a subtle faded halo (#ff5040, 8-12px blur, 30% opacity)
  suggesting impact damage glow
- Around each X-mark, a few short jagged lines suggesting hull breach
  cracks (NO actual cracks across the ship's wireframe — just damage
  marker accents)

No text, no labels, no compass rose. Just the wireframe + 3 X-marks.

Photorealistic technical illustration aesthetic on transparent background,
4:1 horizontal banner, 2048×512 px, single dramatic light source not
applicable (technical art is flat).

Style: Mass Effect codex ship schematic, Battlestar Galactica DRADIS
display, Eve Online hull layout. Industrial military blueprint.
```

---

## 4. `targeting-reticle.png` — Decorative targeting reticle

**Použití:** vlevo v decorative status stripu pod welcome cardem. Subtle rotující element (CSS animation), takže design musí vypadat dobře v rotaci (radial symmetry preferred).

**Aspect ratio:** 1:1 (square)
**Velikost:** 512×512 px
**Transparent PNG**

```
A tactical targeting reticle / sniper scope crosshair, designed for a
heads-up display. Pure red phosphor line art (#b8101c, 2px stroke) on
fully TRANSPARENT background.

Anatomy:
- Outer ring: thin circle, ~440 px diameter, full red
- Inner ring: thinner concentric circle, ~280 px diameter
- Center crosshair: 4 lines extending from a 16px gap in the center,
  reaching almost to the inner ring (vertical + horizontal cross)
- 4 corner tick marks: short L-shaped marks at the OUTER ring's N, E, S,
  W positions (12-16px ticks pointing outward)
- 8 small tick marks along the outer ring at 45° intervals (NE, SE, SW,
  NW positions) — 6-8px short ticks

The crosshair lines do NOT extend to the very center — there's a small
gap so the target (medallion behind it) remains visible.

Subtle faint glow around the lines (#ff5040, 4-6px blur, 40% opacity)
suggesting backlit phosphor.

Optional: tiny "lock-on" bracket marks at the four cardinal positions
near the inner ring (small angular brackets like in fighter HUD gun sights).

NO numbers, NO compass labels, NO range markers, NO measurement scales.
Pure radial symmetric design.

Photorealistic HUD reticle aesthetic, 512×512 px, transparent PNG,
isolated element.

Style: military fighter HUD gun sight, sniper scope crosshair, Eve Online
target lock indicator. Clean tactical HUD design.
```

---

## 5-11. Nav ikony (console panel buttons) — sdílený frame

Všech 7 nav ikon sdílí **stejný gunmetal console-panel button frame** — liší se jen vyrytým symbolem ve středu. **Konzistence stylu napříč všemi 7 je kritická** — ChatGPT bude tendence dělat každou jinak. Style lock + jasné instrukce.

### Sdílený frame (popis pro každou ikonu):

```
A square gunmetal steel console button, 1024×1024 px aspect 1:1, with:

- Outer shape: subtly rounded square (8-12 px radius), dark gunmetal
  base (#3a3e44 to #1a1c20 vertical gradient)
- Subtle bevelled edge: 1-2px brighter rim (#5a606a) suggesting raised
  button face
- 4 small recessed rivets in corners (one per corner), metallic, slightly
  highlighted from above
- Battle-scarred surface texture: subtle scratches and scuff marks,
  paint chipped in 2-3 random spots revealing lighter metal underneath
- Faint red emergency backlight glow from the BOTTOM EDGE only
  (#b8101c, 6-8px halo, 50% opacity, fades upward to transparent)
  — as if the button is lit from below by an LED strip
- Central engraved symbol (specific to each icon, see below) — engraved
  INTO the metal surface, slight depth/shadow giving "carved" feel,
  symbol color is subtle gunmetal-bright (#6a7078) with optional
  hellfire-red ambient (#b8101c, 30% opacity glow around symbol)

Transparent PNG, isolated, no background, no text, no surrounding context.

Style: Aliens (1986) Nostromo console buttons, Helldivers 2 stratagem
buttons, Mass Effect 3 omni-tool panel buttons. Heavy industrial.
```

---

### 5. `icon-uvodnik.png` — Velitelův bojový deník

```
[ Použij sdílený frame popis výše. Centrální vyrytý symbol: ]

A simple OPEN BOOK / journal icon, viewed slightly from above (3/4 view),
engraved into the gunmetal surface. The book has visible pages spread
open with subtle horizontal lines suggesting written entries. A small
quill pen rests on the right page.

Symbol occupies center 60% of the button face. Color: gunmetal-bright
engraving (#6a7078) with subtle hellfire-red glow ambient.

Meaning: the captain's combat log.
```

---

### 6. `icon-vytvorit-svet.png` — Aktivace nového sektoru

```
[ Použij sdílený frame popis výše. Centrální vyrytý symbol: ]

A 4-pointed STAR with a small PLUS sign superimposed in the center
(star indicating a new astronomical body, plus indicating "create new").
The star has clean sharp points and slight glow at the center where
the plus sits.

Symbol occupies center 55% of the button face. Color: gunmetal-bright
engraving (#6a7078) with hellfire-red glow at the center where star+plus
meet (brighter than other icons — this is "active creation").

Meaning: activate new sector / create new world.
```

---

### 7. `icon-diskuze.png` — Inter-ship comms

```
[ Použij sdílený frame popis výše. Centrální vyrytý symbol: ]

A double COMM-BUBBLE / radio chat indicator: two overlapping speech
bubbles (one slightly behind the other), each with 3 small horizontal
lines inside suggesting transmitted text. A small radio antenna or
sound-wave arc emanates from one bubble.

Symbol occupies center 60% of the button face. Color: gunmetal-bright
engraving (#6a7078) with subtle hellfire-red glow ambient.

Meaning: inter-ship communications, crew chat.
```

---

### 8. `icon-clanky.png` — Bojové manuály

```
[ Použij sdílený frame popis výše. Centrální vyrytý symbol: ]

A CLOSED BOOK / tactical manual icon, viewed from a slight angle (3/4
view from front). The book has a thick spine visible on the left, a
small icon embossed on the front cover (a simple stylized military
emblem — like a 4-point star or chevron), and visible page edges on
the right side.

Symbol occupies center 60% of the button face. Color: gunmetal-bright
engraving (#6a7078) with subtle hellfire-red glow ambient.

Meaning: tactical manuals / articles archive.

DISTINCT from icon-uvodnik (open book/log): this is a CLOSED book/manual.
```

---

### 9. `icon-galerie.png` — Tactical surveillance feed

```
[ Použij sdílený frame popis výše. Centrální vyrytý symbol: ]

A small RECTANGULAR MONITOR / display frame icon (landscape orientation,
slight 3D depth), with 4-5 short horizontal scan-lines inside the screen
suggesting a live video feed. A tiny "REC" dot in one corner (top-right
of the inner frame). The monitor has small visible corner brackets like
a tactical HUD frame.

Symbol occupies center 60% of the button face. Color: gunmetal-bright
engraving (#6a7078) with subtle hellfire-red glow inside the screen
area (#b8101c, 30% opacity).

Meaning: tactical surveillance feed / image gallery.
```

---

### 10. `icon-napoveda.png` — Nouzové instrukce

```
[ Použij sdílený frame popis výše. Centrální vyrytý symbol: ]

A QUESTION MARK enclosed in a CIRCLE — the question mark is the main
focus, bold and clear, the circle around it is thin. The question mark
has slight depth/carved feel. The circle has a small notch at the
bottom suggesting a tactical info-marker frame.

Symbol occupies center 55% of the button face. Color: gunmetal-bright
engraving (#6a7078) with hellfire-red glow ambient.

Meaning: emergency instructions / help.
```

---

### 11. `icon-hospoda.png` — Důstojnická jídelna

```
[ Použij sdílený frame popis výše. Centrální vyrytý symbol: ]

A WHISKEY TUMBLER / rocks glass icon (short cylindrical glass), viewed
from a slight 3/4 angle. The glass has visible thick bottom (suggesting
heavy-bottomed crystal), with 2-3 subtle horizontal lines indicating
liquid level inside (filled about 60%).

Symbol occupies center 55% of the button face. Color: gunmetal-bright
engraving (#6a7078). The liquid area inside the glass has a subtle
hellfire-red ambient glow (#b8101c, 30% opacity, like the glass holds
a red liquid catching the emergency lighting).

Meaning: officer's mess / dimensional tavern.
```

---

## 📋 Workflow

1. **Otevři ChatGPT (GPT-4o image)** nebo Midjourney v6.1
2. **Vlož STYLE LOCK** (sekce výše) — ChatGPT potvrdí style locked
3. **Generuj asset po assetu** v pořadí 1-11 (corner bracket nejdřív — etabluje materiál pro zbytek)
4. **Po každém:** porovnej s palette/material spec, případně regen s upřesněním
5. **Ulož do** `assets-source/themes/vesmirna-bitva/` jako `corner-tl.png`, `medailon-frame.png`, atd.
6. **Jakmile dodáš všech 11 + logo + medailon:** doladím spec na reálné rozměry/kompozice, napíšu impl. plán, schválíš, implementuju.

## ⚠️ Časté problémy s ChatGPT

- **Sklouzne k cool blue** — explicitně připomeň "NO cyan, NO blue, warm red only"
- **Udělá clean futuristic** — připomeň "battle-damaged, scuffed, scratched, NOT clean"
- **Dá ikonu plný symbol bez frame** — připomeň "the gunmetal console button frame is required, symbol engraved INTO the surface"
- **Inkonzistentní mezi ikonami** — vždy připomeň "same frame as previous icons, only the engraved symbol changes"
- **Dá pozadí scéna místo transparent** — připomeň "transparent PNG, isolated element, no background scene"

Pokud nějaký asset vyjde špatně, lépe regen než pokračovat — nekonzistentní asset rozbije celý skin.
