# Severské runy skin — asset prompty (1.0o)

> **STAV (2026-05-11):** ⏳ Čeká na vygenerování. **Cílový asset folder:** `assets-source/themes/severske-runy/`.

Seznam **16 AI assetů** skinu Severské runy:

**Signature (6):**
- 1× `corner-tl` — **vlčí hlava iron-cast** (master TL, mirror přes CSS scaleX na zbylé 3 rohy side panelů)
- 1× `wolfshield-divider` — horizontal iron strap s **wolf-paw print medailónem** uprostřed (sjednocující motiv pravý + levý panel)
- 1× `welcome-arch` — masivní **dřevěný arch s runami + ledové rampouchy** (mid-layer welcome cardu, nad fjord scenérií)
- 1× `rune-circle-floor` — **runový kruh** pod welcome cardem (jen horní polovina vidět, ice-blue sub-glow)
- 1× `rune-knot-seal` — **kruhový pečet** pro divider uprostřed welcome cardu („Příjemnou zábavu…")
- 1× `medailon-frame` — **bronzový rám s 3 nýty** kolem orla Ikaros (orel sám dodá user jako `medailon.png`)

**Nav ikony (10) — všech 10 sdílí stejný carved-oak medailon disc s iron rim:**
- `icon-uvodnik` (Raidho + kniha) · `icon-vytvorit-svet` (Thurisaz + kladivo) · `icon-diskuze` (Mannaz + siluety u ohně) · `icon-clanky` (Fehu + svitek) · `icon-galerie` (Dagaz + oko v plameni) · `icon-napoveda` (Eihwaz + Yggdrasil) · `icon-matrix` (Othala + dlouhá síň) · `icon-novy-svet` (Jera + slunce za horami) · `icon-hospoda` (Gebo + drinking horn) · `icon-chat` (Ingwaz + tečka-semínko)

> **Background:** existuje `public/themes/backgrounds/severske-runy.webp` — pokud vyhovuje vizi (fjord + krkavec + hory + vesnice + sníh + runový kámen), nedotýkáme se. Pokud user chce regenerovat, pošle nový do `assets-source/themes/severske-runy/background.png` a my ho zoptimalizujeme.
> **Logo + medailon** dodá user v `assets-source/themes/severske-runy/logo.png` + `medailon.png` — bez promptu. Logo = "Projekt Ikaros" v Cinzel + drobný Ikaros erb. Medailon = orel s rozevřenými křídly v erbu, ice-blue glow.

**Koncept:** **Mead-hall síň na konci fjordu, kde se rozhoduje, kdo přežije zimu.** Ztemnělý dub s iron banding, vlčí hlavy strážící panely jako amulety vikingských chess pieces, vyřezané runové glyfy s ice-blue glow, oxidovaný bronz (nikoli lesklý gold), ledové rampouchy, krkavec na runovém kameni. *Drsná, vážná, ale obyvatelná* — žije se tam, hoří oheň, ale za stěnou je smrtelná zima. Tohle není romantická fantasy (modré nebe), ne mrtvá kostnice (nemrtvi), ne česká krčma (hospoda), ne lesklé zlato (zlatý standard). Tohle je **carved saga** — materiál nese příběh.

**Generátor:** ChatGPT (GPT-4o image gen) nebo Midjourney v6.1. Output: PNG s alfou, pak `cwebp -q 90 -alpha_q 100`.

**Reference logo + medailon (dodá user):** [`../../../assets-source/themes/severske-runy/`](../../../assets-source/themes/severske-runy/) — držet **stejnou paletu, materiály a světelný úhel** jako tyto. Cinzel carved-stone caps + bronzový medailon s ice-blue glow.

---

## 🎨 STYLE GUIDE (závazné pro všechny assety)

Nedodržení = inkonzistentní set. ChatGPT/MJ často „uteče" do generic medieval fantasy (warm brown leather + gold) nebo Halloween viking (cartoonish horned helmet) — proto explicitně vyjmenované zákazy.

### Reference look

**Inspirace:**
- *God of War: Ragnarök* mead-halls + rune stones — heavy carved oak, iron banding, ice-blue runic glow
- *Skyrim* Whiterun longhouse + Bleak Falls Barrow — weathered wood + ice-stone interior
- *Vikings (TV)* Kattegat great hall — dark stained timber, hand-forged iron hardware
- *Hellblade: Senua's Sacrifice* — moody Norse atmosphere, carved runestones, cold breath
- *Assassin's Creed Valhalla* longhouses & runic art — viking shield bosses, wolf head carvings
- *Norse archaeology* — Oseberg ship wolf-head posts, Mammen axe runes, Jelling stone

**Cíl:** prvotřídní game UI, **carved saga aesthetic**, photorealistic weathered-material rendering, ostrý detail, gritty-but-elegant. **Mokré dřevo, kované železo, mech, sníh, runy, oxidovaný bronz, led.** Materiály vypadají, jako by byly skutečně staré 1000+ let — ne nové, ne vyleštěné.

**NE:** clean fantasy (Camelot heraldika — to je modré nebe). NE viktoriánská gotika (to je temna-cerven). NE mrtvé lebky / ossuary (to je nemrtvi). NE krčmářská cedule + brass + burgundy (to je hospoda). NE lesklý gold / royal luxury (to je zlatý standard). NE pergamen + iluminace (to je pergamen). NE Warhammer Fantasy Chaos viking (over-the-top spikes, horned helmets). NE marvelovský Thor (clean plate armor, gold). NE Halloween viking (cartoonish, comic). NE flat illustration, NE cartoon, NE Disney's Frozen pastel. **NE neon glow** — ice-blue je *cold light*, ne neon. **NE warm tones** (gold/amber/copper) — bronz je *oxidovaný, tlumený*, ne lesklý.

### Klíčové odlišení od ostatních skinů

| Aspekt | hospoda | nemrtvi | modre-nebe | zlaty-standard | **severske-runy** |
|---|---|---|---|---|---|
| téma | středověká krčma | sedlec kostnice | heraldická Camelot | královský luxus | **vikingská mead-hall na fjordu** |
| paleta | brass + burgundy | ghost-teal + bone | navy + gold + cyan | pure black + rich gold | **ice-blue + oxidovaný bronz + iron + dark oak** |
| dominantní materiál | warm oak + brass hardware | bone + stone arches | navy fabric + heraldic gold | pure black + polished gold | **dark stained oak + iron banding + carved stone** |
| signature ornament | hanging tavern sign + chains | skull-arch + bone divider | corner ornament + heraldic frames | gold double-stroke frame | **iron-cast vlčí hlavy + wolfshield divider + ledové rampouchy** |
| typografie | Pirata One + Almendra | UnifrakturCook + Cardo | Cinzel Decorative + Cinzel | Cinzel Decorative + Cinzel | **Cinzel + Sancreek woodcut + Lora** |
| světlo | candle warm orange | ghost-teal cold | starry night blue | gold accent on black | **ice-blue glow + dim torch warmth in bg only** |
| nálada | jolly tavern feast | death contemplation | heroic chivalry | royal opulence | **harsh survival, quiet reverence** |

### Závazná paleta

```
Pozadí (background):            #080c10 — #0c1018 (deep cold black-blue)
Card surface (rune-stone):      #2a2e34 — #383c44 (weathered grey granite)
Dark stained oak (panely):      #1a1612 base, #2a2218 mid, #0c0a08 deep shadow
Iron (banding, hardware):       #1a1c20 base, #3a3e44 highlight, #0a0c10 deep
Oxidized bronze (ornaments):    #8a5a2a primary, #a87038 highlight, #5a3818 shadow
                                ⚠️ NE lesklý gold, NE jasný copper — tlumený, patinovaný
Ice-blue (runic glow):          #4ab0d0 base
                                #70d0f0 bright (active state)
                                #205870 dim (idle subtle)
                                #a8d8e8 frost highlight (rampouchy)
Frost white (highlights):       #c8d8e8 (snow, ice surface highlight)
Rune carving (recessed):        #0a0c10 (deep cut into stone/wood, almost black)
Torch ember (only in bg):       #c08030 (very dim, NIKDY na assetu samém)
Wolf eye glow:                  #70d0f0 core, #4ab0d0 halo (8px)
Text na assetech (žádný!):      — (vše bez textu)
Mist / breath wisp:             rgba(168, 200, 220, 0.3) — cold pale blue, semi-transparent
```

### Závazné materiály

- **Dark stained oak (hlavní wood):** Středně tmavý dub s **viditelnými letokruhy**, slightly weathered (mírně sešisované rohy, drobné patiny). Surface je matně-saténový, ne lesklý, jako by ho někdo léta drhnul vlnou. NE light pine, NE warm honey oak. **Mokrá tonalita** — `#1a1612` až `#2a2218`.
- **Iron banding / hardware (signature):** Černý zoxidovaný kov (`#1a1c20`), s decentními bronz highlights na ostřejších hranách (`#a87038`, jen narážkově). Kovaný feel — povrch je **mírně nepravidelný**, kovářské tahy, NE laser-cut precision. Rivets (nýty) jsou **kruhové, raised** (vyčnívající ven, ne recessed), s top-highlight.
- **Carved stone (welcome card surface):** Vyleštěný šedý granit (`#2a2e34` až `#383c44`) s **fine grain texture**, weathered (mírně erodované rohy). Runy a ornamenty jsou **vryté dovnitř** (recessed, deep cut), s `#0a0c10` v hloubce kresby (vrhá vlastní stín). NE smooth marble, NE polished obsidian.
- **Oxidized bronze:** Patinovaný bronz (`#8a5a2a` až `#a87038`), **NE jasný gold, NE polished copper**. Povrch má **drobné zelené patiny** v hlubších částech (jako verdigris, `#5a7838` velmi decentně). Highlights jsou tlumené, ne zrcadlové. Kov vypadá, jako by byl venku 1000 let.
- **Ice / frost (signature):** **Frosted glass / icicle material** — modrobílá průhlednost s **vnitřními bublinkami a fraktálními praskami** (jak skutečný led). Rampouchy mají špičky tmavší (více modrá), spodní část světlejší. Surface je **mokrá, lehce bleskuje** (drobné highlights). NE plastic ice, NE crystal-clear glass — opravdový led má **mlhavou hloubku**.
- **Wolf head iron casting:** Stylizovaná heraldická vlčí hlava v zoxidovaném kovu, **prázdné oči** s ice-blue glow uvnitř (`#70d0f0` core, `#4ab0d0` halo). NE realistic wolf taxidermie, NE cartoon. **Vikingský amulet / chess piece feel** — stylizovaný, ale ne plochý. Inspirace: Mammen axe, Oseberg ship-post.
- **Carved runes (Younger Futhark):** Skutečné historické runy **vyryté hluboko do dřeva/kamene**, ne nakreslené. Cut má `#0a0c10` v hloubce. Když je „aktivní", ice-blue glow vystupuje **zevnitř vrytu**, jako by v něm byl chladný oheň. NE Tolkien-inspired runes, NE elf-runes — autenticky Younger Futhark (16 znaků).
- **Světlo:** **Single dominant light source z horní třetiny** (cold daylight přes okno mead-hallu), secondary **ice-blue ambient glow** z runových prvků zespod. Deep shadows v záhybech dřeva a kovu. NE warm side-lighting (to je hospoda), NE dramatic spotlight (to je vesmirna-bitva).

### Závazné nálady

`harsh winter` · `mead-hall reverence` · `carved saga` · `Norse mythology weight` · `cold breath` · `wolves and ravens watch` · `1000 years old, still standing` · `quiet survival` · `God of War Ragnarök gravity` · `Skyrim Nordic ruin` · `Hellblade Norse moodboard` · `runestone solemnity`

NIKDY: cartoon, comic, Halloween, Marvel Thor, Disney's Frozen, clean Camelot heraldry, jolly tavern, gothic cathedral, viktorián salon, neon, cyberpunk, baroque, ossuary, brass-and-burgundy.

### Technické požadavky pro každý asset

- PNG s **transparentním pozadím** (alpha channel) — žádný šedý/bílý fade-out, čistá alpha
- **Bez textu**, bez watermarku, bez rámu navíc kolem obrázku (mimo signature wolfshield, kde rám JE asset)
- Single dramatic light source z horní třetiny + secondary ice-blue ambient
- Photorealistic rendering — **NE flat illustration, NE cartoon, NE 3D render look** (vypadat jako foto reálného starého kovaného železa / dubu / leptaného kamene)
- Aspect ratio explicitně uveden u každého promptu
- Žádné generické „medieval brown" světlo — *vždy* cold daylight + ice-blue accent

---

## 🔒 STYLE LOCK — vlož jako PRVNÍ zprávu do ChatGPT

Tohle vlož do nového ChatGPT chatu jako úvodní zprávu. ChatGPT-4o si style-lock zapamatuje a všechny následující assety budou stylově sladěné.

```
Budu generovat sérii UI assetů pro stejný viking mead-hall skin
"Severské runy". Drž tento styl pro VŠECHNY následující obrázky:

KONCEPT: Mead-hall síň na konci fjordu, kde se rozhoduje, kdo přežije zimu.
Ztemnělý dub s iron banding, vlčí hlavy strážící panely jako vikingské amulety,
vyřezané runové glyfy s ice-blue glow, oxidovaný bronz (nikoli lesklý gold),
ledové rampouchy, krkavec, runové kameny. Drsná, vážná, ale obyvatelná.
Carved saga aesthetic — materiál nese příběh, vše vypadá 1000 let staré.

NE clean fantasy. NE Marvel Thor. NE Halloween viking (cartoon horned helmets).
NE Disney's Frozen (pastel). NE Camelot heraldry. NE viktoriánská gotika. NE
ossuary / lebky. NE brass + burgundy (jolly tavern). NE lesklý gold / royal
luxury. NE neon. NE warm side-lighting. NE 3D render look. NE flat illustration.

MATERIÁLY:
- Hlavní wood: dark stained oak (#1a1612 — #2a2218), viditelné letokruhy,
  slightly weathered, matně-saténový (NE lesklý, NE light pine, NE honey oak)
- Iron banding/hardware: černý zoxidovaný kov (#1a1c20) s decentními bronz
  highlights, kovaný feel (NE laser-cut), raised rivets (vyčnívající)
- Carved stone (rune-stone surface): vyleštěný šedý granit (#2a2e34 — #383c44),
  fine grain, weathered, runy/ornamenty vryté dovnitř (recessed, deep cut)
- Oxidized bronze: patinovaný bronz (#8a5a2a — #a87038), NE jasný gold, drobné
  zelené verdigris patiny (#5a7838 velmi decentně), tlumené highlights
- Ice/frost: frosted glass s vnitřními bublinkami a fraktálními praskami
  (jak skutečný led), mokrý lesk, mlhavá hloubka
- Wolf head iron casting: stylizovaná heraldická vlčí hlava, zoxidovaný kov,
  prázdné oči s ice-blue glow (#70d0f0 core, #4ab0d0 halo). Vikingský amulet
  feel (Mammen axe, Oseberg ship-post), NE realistic wolf, NE cartoon
- Carved runes: skutečné Younger Futhark glyfy vyryté hluboko do dřeva/kamene,
  ice-blue glow zevnitř vrytu když „aktivní"

PALETA (závazné, žádné jiné barvy):
- Background void: #080c10 — #0c1018 (all assets transparent PNG)
- Dark oak: #1a1612 base, #2a2218 mid, #0c0a08 deep
- Iron: #1a1c20 base, #3a3e44 highlight, #0a0c10 deep
- Stone: #2a2e34 — #383c44 (rune-stone surface)
- Oxidized bronze: #8a5a2a primary, #a87038 highlight, #5a3818 shadow,
  #5a7838 verdigris (decentně)
- Ice-blue: #4ab0d0 base, #70d0f0 active bright, #205870 dim,
  #a8d8e8 frost highlight
- Frost white: #c8d8e8 (snow, ice surface)
- Rune carving recess: #0a0c10 (deep cut shadow)
- ŽÁDNÉ jiné barvy: žádný warm gold/amber/copper (jen patinovaný bronz),
  žádný cyan/magenta/neon, žádný viktoriánský red/silver, žádné jolly
  brass-and-burgundy

SVĚTLO: single dominant cold daylight z horní třetiny (jako přes okno
mead-hallu), secondary ice-blue ambient glow z runových prvků zespod.
Deep shadows v záhybech dřeva a kovu. Vysoký kontrast, gritty.

RENDERING: photorealistic weathered-material feel (jako foto reálného
1000 let starého kovaného železa / dubu / leptaného kamene — NE flat
illustration, NE cartoon, NE clean 3D render).

ATMOSFÉRA: harsh winter, mead-hall reverence, carved saga, Norse
mythology weight, cold breath, wolves and ravens watch, quiet survival.
God of War Ragnarök gravity, Skyrim Nordic ruin, Hellblade Norse moodboard,
Vikings (TV) Kattegat hall, Assassin's Creed Valhalla longhouse.

KAŽDÝ asset:
- PNG s transparentním pozadím (čistá alpha)
- Bez textu, bez watermarku, bez extra rámu
- Isolated element, žádné scene background
- Aspect ratio dle pokynu

Potvrď, že jsi style locked. Pak ti pošlu první asset.
```

---

## 1. `corner-tl.png` — Vlčí hlava iron-cast (master TL)

**Použití:** master roh side panelů (levý + pravý panel) + welcome card. Mirror přes CSS `scaleX(-1)` na TR roh, `scaleY(-1)` na BL atd. Hlava sedí v top-left rohu panelu, hledí dovnitř k centru, lehce přesahuje horní hranu.

**Aspect ratio:** 1:1 (square)
**Velikost:** 1024×1024 px
**Transparent PNG**

```
Heraldic stylized wolf head iron casting, top-left orientation, head facing
RIGHT (looking inward toward the center of the panel it will guard).
Material: dark oxidized iron (#1a1c20 base) with subtle bronze highlights
(#a87038) on the sharpest edges (snout ridge, ear tips, cheekbone). Surface
is hand-forged, slightly irregular, with visible hammer marks — NOT
laser-cut, NOT polished.

The wolf has:
- Open snarling mouth with prominent fangs (3 visible canines)
- Pricked, alert ears (slightly back, aggressive)
- Stylized swirling mane along the back of the head (viking knot-work
  inspired carved patterns)
- HOLLOW empty eye sockets glowing with ICE-BLUE light from within
  (#70d0f0 core, #4ab0d0 halo, 8px glow) — as if cold fire burns inside
  the skull
- Stylized in the manner of an Oseberg ship-post or Mammen axe relief,
  Norse animal art (gripping beast style) — NOT realistic taxidermy,
  NOT cartoon, NOT comic

The head is positioned as if it would attach to a top-left corner of a
wooden panel, with the lower-right portion suggesting it extends down and
right to merge with iron banding. The bottom-right edge of the wolf head
shows slight extension/anchor (subtle iron tab) where it would join the
panel's iron strap — but this anchor is minimal, the focus is the head.

Photorealistic, high detail, front-3/4 view from slightly above, isolated
element, transparent PNG, 1024×1024 px, no background, no text, no logo.

Light: single cold daylight source from top-left (as if from a high
mead-hall window), highlighting the snout ridge and top of the head.
Secondary ice-blue ambient glow from the eye sockets illuminates the
inner snout cavity faintly.

Style: God of War Ragnarök wolf ornament, Skyrim Solitude Bards' College
beast carving, Assassin's Creed Valhalla longhouse post, Vikings (TV)
Kattegat decorative iron. Heavy carved saga aesthetic.
```

---

## 2. `wolfshield-divider.png` — Iron strap s wolf-paw print medailónem

**Použití:** Horizontal divider mezi sekcemi v pravém i levém panelu (Administrace ↔ Moje diskuze ↔ Moje světy ↔ Navigace ↔ Vesmíry ↔ Chat). Sjednocující motiv napříč skinem.

**Aspect ratio:** 8:1 (horizontal strip)
**Velikost:** 1024×128 px
**Transparent PNG**

```
A horizontal iron strap divider, dark oxidized iron (#1a1c20) with subtle
bronze edge highlights (#a87038, faint). The strap extends fully across
the horizontal width, approximately 32-40px thick at the ends, slightly
wider in the middle to accommodate a central medallion. Hand-forged feel
with visible hammer texture, NOT laser-cut.

At each end of the strap (far left and far right), there are 2 raised
rivets (4 total), circular, metallic, slight top-highlight.

In the exact center of the strap, sits a circular medallion (approximately
96px diameter at 1024 width), made of oxidized bronze (#8a5a2a base,
#a87038 highlight, faint #5a7838 verdigris in recesses). The medallion
is slightly raised above the iron strap level, with 4 small bronze rivets
attaching it (N, E, S, W positions).

INSIDE the bronze medallion, deeply ENGRAVED (recessed, #0a0c10 deep cut
shadow): a stylized WOLF PAW PRINT — 3 toe pads in a triangular top
arrangement and 1 larger central pad below. Norse knot-work style (the
pads have subtle interwoven ribbon pattern around them). The paw print is
recessed deeply, with ice-blue ambient glow emanating faintly from the
deepest cuts (#4ab0d0, 30% opacity, very subtle).

Photorealistic, horizontal strip view, isolated element on transparent
background, 1024×128 px, no text, no extra ornament beyond what's described.

Light: cold daylight from top, casting subtle shadow below the strap.
Ice-blue ambient very subtle from paw print recess.

Style: viking shield boss, Mammen axe inlay, Norse knot-work ornament.
Carved saga aesthetic.
```

---

## 3. `welcome-arch.png` — Dřevěný arch s runami + ledové rampouchy

**Použití:** Mid-layer welcome cardu, sedí mezi pozadím (fjord) a samotnou rune-stone deskou welcome cardu. Tvoří „rám" pohledu ven na fjord. Vlčí hlavy v rozích (top-left + top-right) jsou v jednom assetu s archem (NEBO se použije separátně corner-tl mirrored na obě strany — to rozhodneme při impl.).

**Aspect ratio:** 16:9 (wide)
**Velikost:** 2048×1152 px
**Transparent PNG**

```
A massive dark stained oak archway, frontal view, forming an inverted-U
shape that frames an empty central area (the inner area will show a scene
behind it — keep that area FULLY TRANSPARENT). The arch has heavy iron
banding running along its inner edges and at the joints.

Materials:
- Oak posts (left, right, top crossbeam): dark stained, weathered, visible
  woodgrain and letokruhy, matte-satin finish (#1a1612 — #2a2218). The
  wood looks 200+ years old, with subtle wear at the corners.
- Iron banding (signature): along the inner edge of the arch, a continuous
  iron strap (#1a1c20) with raised rivets every ~120px. Subtle bronze edge
  highlights (#a87038, faint). Hand-forged feel.
- Carved runes on the wood (just inboard from the iron banding): a row of
  Younger Futhark runes recessed deeply into the oak (#0a0c10 deep cut
  shadow), running along the inner edge. Faint ice-blue glow from within
  the deepest cuts (#4ab0d0, 30% opacity). Suggest 8-10 runes total
  visible (4-5 per side + 2-3 across top), spaced naturally.

At the TOP-CENTER of the arch (interior of the top crossbeam), 4-6 ICICLES
of varying lengths hang down. Made of frosted glass material with internal
bubbles and fractal cracks, blue-white (#a8d8e8 highlights, #4ab0d0 core,
slight #c8d8e8 frost tip). Wet glossy surface, slightly translucent. The
icicles hang naturally — irregular spacing, varying lengths (40px to 200px),
the longest in the center, shortest at the sides.

At the TOP-LEFT and TOP-RIGHT inner corners of the arch, smaller "fragment"
versions of wolf heads (50% size of the corner-tl asset) are integrated
INTO the iron banding — as if they are part of the structure. They face
inward toward the center. Eyes glow faintly with ice-blue.

The CENTRAL AREA (the "window" framed by the arch) must be FULLY
TRANSPARENT — no scenery, no fill. The arch is just the frame.

The outer edges of the entire arch fade slightly into transparency at
the very corners (for clean compositing with background).

Photorealistic, high detail, frontal view, transparent PNG, 2048×1152 px,
isolated structural element, no text, no extra ornament beyond described.

Light: single cold daylight source from outside (front-center), suggesting
the arch frames a view into a cold landscape. The iron banding catches
highlights on the top edges. Ice-blue ambient from the icicles bottoms and
rune carvings.

Style: Skyrim Whiterun great hall doorway, Hellblade Norse threshold,
God of War Ragnarök mead-hall entrance, Vikings (TV) Kattegat doorway.
Carved saga aesthetic, harsh winter.
```

---

## 4. `rune-circle-floor.png` — Runový kruh pod welcome cardem

**Použití:** Pod welcome cardem na „podlaze", jen horní 30-40 % výšky kruhu je vidět (zbytek pokračuje pod cardem). Full-width banner.

**Aspect ratio:** 4:1 (horizontal banner)
**Velikost:** 2048×512 px
**Transparent PNG**

```
The TOP portion of a large circular runic seal carved into a stone floor,
viewed from a slightly elevated front angle (as if standing in front of
the circle and looking down at it). Only the UPPER 30-40% of the circle
is visible in the frame — the bottom portion extends out of frame (will
be hidden behind the welcome card in compositing).

The circle is approximately 2400px diameter (so only the top ~700px slice
of it is visible in the 2048×512 frame).

The circle is RECESSED into a flat stone floor (#2a2e34 — #383c44
weathered grey granite, fine grain texture, slightly worn). The circle's
outline is a deeply engraved double ring (~12px stroke each, with ~8px
gap between them, #0a0c10 deep cut shadow).

Between the two outer rings, a row of 24 Younger Futhark runes are
carved deeply into the stone, evenly spaced along the entire visible
circumference. Each rune is approximately 36-48px tall, recessed deeply
(#0a0c10 in cuts, ice-blue glow #4ab0d0 from within at 40% opacity).

Inside the inner ring (interior of the circle), 4-6 radiating lines
extend toward the center (which is below frame). These lines are also
carved deeply with subtle ice-blue glow.

The circle has been activated/charged — a soft ice-blue ambient glow
(#4ab0d0, 25% opacity) emanates from the entire circle as if the runes
are slowly breathing light into the stone.

Photorealistic, high detail, transparent PNG, 2048×512 px, isolated
floor element, no text, no extra ornament.

Light: ambient cold daylight from above-front, casting subtle shadows
into the recessed engravings. Ice-blue ambient glow from the runes
themselves illuminates the cuts from within.

Style: Skyrim word wall, Hellblade Norse seal, God of War Ragnarök
runestone floor inlay, Mammen ornament. Carved saga aesthetic.
```

---

## 5. `rune-knot-seal.png` — Pečet do divider uprostřed welcome cardu

**Použití:** Decentní kruhový seal vsazený do horizontálního iron strap divideru uprostřed welcome cardu („Příjemnou zábavu přeji administrátoři"). Stejně velký jako wolfshield-divider medallion, ale s jiným motivem (Norse knot, ne paw).

**Aspect ratio:** 1:1 (square)
**Velikost:** 512×512 px
**Transparent PNG**

```
A circular medallion seal, oxidized bronze (#8a5a2a base, #a87038
highlight, faint #5a7838 verdigris in deep recesses). Approximately
480px diameter centered in the 512×512 frame, with 16px transparent
border for compositing.

The medallion has a slight raised bevel (3D depth, ~6px thick at the
center, tapering to 2px at the edge). 4 small bronze rivets at N, E,
S, W positions just inside the outer edge.

INSIDE the medallion, deeply ENGRAVED (recessed, #0a0c10 deep cut
shadow): a Norse interlace knot pattern — specifically a "Borre style"
or "Mammen style" interwoven ribbon knot forming a roughly square shape
inscribed within the circle. The ribbon weaves under-over itself in a
continuous loop, no beginning or end (eternal knot).

The knot's deepest recesses glow faintly with ice-blue light (#4ab0d0,
30% opacity), as if the seal carries a quiet charge.

Photorealistic, high detail, frontal view, isolated element on
transparent background, 512×512 px, no text.

Light: cold daylight from top-left, casting subtle shadow on the
bottom-right of the medallion bevel. Ice-blue ambient subtle from
knot recess.

Style: Norse viking belt buckle ornament, Mammen Bronze Age inlay,
Borre style knot-work. Carved saga aesthetic.
```

---

## 6. `medailon-frame.png` — Bronzový rám okolo orla Ikaros

**Použití:** Outer frame okolo medailonu (orel Ikaros, dodá user jako separate asset). Asset má průhledný střed (kde sedí orel), vnější rám je oxidovaný bronz s 3 viditelnými iron rivety, které „vsazují" medailon do rune-stone desky welcome cardu.

**Aspect ratio:** 1:1 (square)
**Velikost:** 1024×1024 px
**Transparent PNG** (i ve středu — průhledný kruh kde půjde orel)

```
A heavy oxidized bronze frame surrounding an empty circular cutout in
the center. The outer shape is a slightly bevelled SHIELD form (rounded
top, gentle taper to pointed bottom — heater shield silhouette), the
inner cutout is a perfect CIRCLE (fully transparent in the center — the
frame surrounds nothing).

Material: oxidized bronze (#8a5a2a primary, #a87038 highlight on raised
edges, #5a3818 shadow in recesses), with subtle green verdigris patina
(#5a7838 very faint) in the deepest grooves. Surface is matte, hand-forged,
NOT polished. Visible hammer marks. The bronze looks 1000 years old.

Around the inner circular cutout, a thin recessed border (~6px) of darker
bronze contrasts with the raised outer frame. Around the outer edge of
this inner border, faint Younger Futhark runes are engraved (deep cut,
#0a0c10), approximately 8-12 small runes evenly spaced around the circle.
Subtle ice-blue glow (#4ab0d0, 25% opacity) from within the rune cuts.

THREE prominent IRON rivets (dark oxidized iron #1a1c20, top-highlight
#3a3e44) protrude from the bronze frame: one at the top-center, one at
the lower-left, one at the lower-right. Each rivet is approximately 48px
diameter, clearly raised above the bronze surface, with a subtle shadow
beneath. These rivets are NOT decorative — they look structural, as if
they fasten the bronze medallion to a stone surface behind it.

The four "corners" of the shield silhouette (top-left, top-right, two
lower flanks) have small Norse knot ornament details (engraved, deep
cut, low contrast).

Photorealistic, frontal view, transparent PNG, 1024×1024 px. The CENTER
must be fully transparent (no eagle image inside — just the frame). Outer
area also transparent (isolated element).

Light: cold daylight from top, highlighting the top edge and creating
subtle shadows in the recessed details. Ice-blue ambient very subtle
from rune carvings.

Style: viking shield boss, Mammen Bronze Age inlay, Sutton Hoo
shoulder-clasp aesthetic, Oseberg ship-post ornament. Carved saga
aesthetic, weathered bronze, structural rivets.
```

---

## 7-16. Nav ikony — runové medailony (10× sdílí stejný carved-oak disc s iron rim)

**Použití:** Nav buttony v levém panelu (Navigace 6× + Vesmíry 2× + Chat 1× + Dimenzionální hospoda 1×). Každý asset = kruhový carved-oak disc s iron rim, uvnitř runa Younger Futhark + drobný piktogram za ní jako stín.

**Aspect ratio:** 1:1 (square)
**Velikost:** 512×512 px per ikona
**Transparent PNG**

**Sdílená šablona (vlož jako "base" pro každou ikonu):**

```
SDÍLENÝ ZÁKLAD pro všech 10 nav ikon (tohle je společné pro každou ikonu,
mění se POUZE specifická runa + piktogram uvnitř):

Circular carved-oak medallion disc, approximately 480px diameter centered
in 512×512 frame, with 16px transparent border for compositing.

Disc material: dark stained oak (#1a1612 — #2a2218), visible woodgrain
radiating concentrically from the center, weathered surface, slight wear
at the rim. Matte-satin finish, NOT polished.

Iron rim around the disc: oxidized iron band (#1a1c20 base, faint #a87038
bronze highlights on top edge), approximately 18-24px wide, hand-forged
texture. 4 small raised iron rivets at N, E, S, W positions on the rim.

The disc is slightly recessed in the center (~4-6px sunken), creating a
shallow "bowl" where the runa + piktogram sit. The recess shadow is
#0a0c10 deep.

INSIDE the disc (the recessed center), TWO LAYERS:

Layer 1 (background, dimmer): a small PIKTOGRAM rendered as a subtle
SHADOW behind the runa, approximately 60-70% of the disc's inner diameter,
engraved deeply into the oak (#0a0c10 deep cut, no glow). This is the
"context" symbol, providing meaning to the rune.

Layer 2 (foreground, primary): a single Younger Futhark RUNE carved
deeply into the oak, approximately 40-50% of the disc's inner diameter,
centered. The rune is RECESSED (deep cut, #0a0c10 in cuts), with a faint
ice-blue ambient glow (#4ab0d0, 30% opacity) from within the cuts — as
if the rune carries a quiet charge.

The runa is the dominant visual; the piktogram is subordinate.

Photorealistic, high detail, frontal view, isolated element, transparent
PNG, 512×512 px, no text outside of what's described.

Light: cold daylight from top-left, casting subtle shadow in the recessed
center. Ice-blue ambient from rune cuts.

Style: viking shield boss, carved Norse amulet, Mammen Bronze Age
ornament. Carved saga aesthetic.
```

**Specifické runy + piktogramy (vlož jeden po druhém, vždy s odkazem na sdílený základ):**

### 7. `icon-uvodnik.png` — Raidho + otevřená kniha

```
[Použij sdílený základ pro nav ikonu — carved-oak disc s iron rim,
runa + piktogram uvnitř.]

PIKTOGRAM (Layer 1, dimmer shadow): An open book, viewed from above, two
pages visible, simple line work, no text on pages, just suggestion of pages.

RUNA (Layer 2, dominant): ᚱ Younger Futhark Raidho rune (looks like a
slanted R with a triangle top and a leg). The rune is centered over the
book piktogram.

Sémantika: cesta, příběh, prolog — "začátek cesty" (Úvodník).
```

### 8. `icon-vytvorit-svet.png` — Thurisaz + kovářské kladivo nad kovadlinou

```
[Použij sdílený základ pro nav ikonu.]

PIKTOGRAM (Layer 1, dimmer shadow): A blacksmith's hammer raised above
an anvil, side view, simple silhouette. The anvil is below, hammer above
with handle pointing up-right.

RUNA (Layer 2, dominant): ᚦ Younger Futhark Thurisaz rune (looks like a
vertical line with a triangle pointing right from the middle). The rune
is centered over the hammer/anvil piktogram.

Sémantika: Thor, síla tvoření z chaosu — "tvoření z chaosu" (Vytvořit svět).
```

### 9. `icon-diskuze.png` — Mannaz + dvě siluety u ohně

```
[Použij sdílený základ pro nav ikonu.]

PIKTOGRAM (Layer 1, dimmer shadow): Two human silhouettes facing each
other, seated, with a small flame/fire shape between them at the bottom.
Simple silhouettes, no facial detail.

RUNA (Layer 2, dominant): ᛗ Younger Futhark Mannaz rune (looks like a
modern M with crossed lines — two verticals with diagonal cross). The
rune is centered over the silhouettes.

Sémantika: člověk, lidé — "lidé spolu mluví" (Diskuze).
```

### 10. `icon-clanky.png` — Fehu + svinutý svitek

```
[Použij sdílený základ pro nav ikonu.]

PIKTOGRAM (Layer 1, dimmer shadow): A rolled parchment scroll, partially
unrolled, side view, with visible roll on one end and an unrolled edge
on the other. Simple silhouette.

RUNA (Layer 2, dominant): ᚠ Younger Futhark Fehu rune (looks like an F
with both arms angled upward — vertical line with two slanted lines
extending up-right). The rune is centered over the scroll.

Sémantika: bohatství, paměť — "uchované vědění" (Články).
```

### 11. `icon-galerie.png` — Dagaz + oko v plameni

```
[Použij sdílený základ pro nav ikonu.]

PIKTOGRAM (Layer 1, dimmer shadow): A stylized eye (almond shape with
small circle pupil) surrounded by flame tongues (3-4 flame shapes
radiating outward).

RUNA (Layer 2, dominant): ᛞ Younger Futhark Dagaz rune (looks like a
bowtie or hourglass on its side — two triangles meeting at center
points). The rune is centered over the eye/flame piktogram.

Sémantika: úsvit, zjevení, obraz — "obrazy, vidění" (Galerie).
```

### 12. `icon-napoveda.png` — Eihwaz + strom s kořeny

```
[Použij sdílený základ pro nav ikonu.]

PIKTOGRAM (Layer 1, dimmer shadow): A stylized tree with visible roots
below ground line and branches above. The tree is centered, with a
single trunk dividing into 3-4 branches at top and 3-4 roots at bottom.
Suggests Yggdrasil but simplified.

RUNA (Layer 2, dominant): ᛇ Younger Futhark Eihwaz rune (looks like a
vertical line with two short angled marks — one at top going right,
one at bottom going left). The rune is centered over the tree.

Sémantika: tis, Yggdrasil, strom poznání — "strom poznání, který radí"
(Nápověda).
```

### 13. `icon-matrix.png` — Othala + silueta dlouhé síně

```
[Použij sdílený základ pro nav ikonu.]

PIKTOGRAM (Layer 1, dimmer shadow): A long-house silhouette (viking
longhouse) — elongated horizontal building with gabled roof, simple
silhouette, no doors or windows, just outline. View from front-3/4
angle.

RUNA (Layer 2, dominant): ᛟ Younger Futhark Othala rune (looks like a
diamond on top of a Y — a rhombus with two legs extending down-left
and down-right). The rune is centered over the longhouse.

Sémantika: původ, dědictví, domov — "rodný svět" (Matrix = primární
herní svět).
```

### 14. `icon-novy-svet.png` — Jera + slunce stoupající za horami

```
[Použij sdílený základ pro nav ikonu.]

PIKTOGRAM (Layer 1, dimmer shadow): A sun (half-circle with radiating
short lines) rising behind two mountain peaks. The sun is at the horizon
line, mountains are simplified triangles.

RUNA (Layer 2, dominant): ᛃ Younger Futhark Jera rune (looks like two
interlocking comma shapes — one curving down-right at top, one curving
up-left at bottom, slightly offset). The rune is centered over the sun.

Sémantika: rok, sklizeň, cyklus — "nový cyklus" (Nový svět = nově
přidaný svět).
```

### 15. `icon-hospoda.png` — Gebo + viking drinking horn

```
[Použij sdílený základ pro nav ikonu.]

PIKTOGRAM (Layer 1, dimmer shadow): A viking drinking horn (curved horn
shape, wide opening at one end, pointed tip at the other), side view,
slightly tilted as if held up for a toast.

RUNA (Layer 2, dominant): ᚷ Younger Futhark Gebo rune (looks like a
simple X — two crossing diagonal lines). The rune is centered over
the horn.

Sémantika: dar, sdílení — "sdílení medoviny" (Dimenzionální hospoda).
```

### 16. `![alt text](image.png).png` — Ingwaz + tečka-semínko

```
[Použij sdílený základ pro nav ikonu.]

PIKTOGRAM (Layer 1, dimmer shadow): A single small circular dot in the
center, with very faint concentric ripple ring around it (like a seed
or a single drop in water).

RUNA (Layer 2, dominant): ᛜ Younger Futhark Ingwaz rune (looks like a
rhombus / diamond shape — four lines meeting at four points forming
a square rotated 45°). The rune is centered, the dot/seed is inside
the rhombus.

Sémantika: semínko, čekání, potenciál — "zatím nic, čeká se" (Chat,
when 0 messages).
```

---

## 📦 ROADMAP DODÁNÍ

**Doporučené pořadí generace (od základu k detailu):**

1. **Style-lock zpráva** → potvrdit s ChatGPT
2. **Signature 6 assetů** v pořadí: corner-tl → wolfshield-divider → welcome-arch → rune-circle-floor → rune-knot-seal → medailon-frame
3. **Nav ikony 10×** (lze generovat batch, jeden po druhém s odkazem na sdílený základ)
4. **Volitelně regenerovat background** (pokud aktuální fjord scenérie nevyhovuje)

**Po dodání:** všechny PNG do `assets-source/themes/severske-runy/`, pak `cwebp -q 90 -alpha_q 100` do `public/themes/severske-runy/decor/`.

**Tally:** 6 signature + 10 nav ikon = **16 transparent PNG assetů** (logo + medailon user dodá samostatně, background existuje).

---

## ⚠️ Co rozhodneme PO dodání assetů

Tyto věci nelze rozhodnout dopředu — záleží na výsledku generace:

1. **welcome-arch** — buď drží vlčí hlavy v jednom assetu, nebo budou separate `corner-tl` mirroring. Rozhodneme po vidění výsledku.
2. **rune-circle-floor** — bude SVG nebo PNG? Pokud PNG vychází dobře, zůstaneme u PNG. Pokud kvalita run trpí na malých velikostech, vytvoříme SVG verzi.
3. **icon-chat** — má smysl tuto ikonu vytvořit, nebo CSS-only stačí? Záleží, jestli má sekce CHAT (0) vlastní ikonu, nebo jen heading.
4. **Background regenerace** — pokud aktuální nesedí stylem, vygenerujeme nový s explicitním promptem (krkavec na runovém kameni + fjord + vesnice + sníh).

---

**Po vygenerování všech 16 assetů → pokračujeme spec-driven-development specem.**
