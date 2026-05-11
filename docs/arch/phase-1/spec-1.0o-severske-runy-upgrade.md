# Spec 1.0o — Severské runy visual upgrade

**Status:** 🟡 Spec ke schválení (2026-05-11)
**Datum:** 2026-05-11
**Rozsah:** FE skin upgrade — `[data-theme="severske-runy"]` izolace, žádný globální dopad
**Repo:** `Projekt-ikaros-FE`, větev `feat/krok-1.0o-severske-runy-upgrade` (vytvoří se při impl plánu)
**Velikost:** odhad ~3 soubory změna (`index.ts`, `decorations.css`, `public/themes/severske-runy/`) + 18 nových assetů (16 AI + 2 user) — ✅ všechny dodány a optimalizovány
**Autor:** PJ + Claude
**Souvisí:** [spec-1.0n-vesmirna-bitva-upgrade.md](spec-1.0n-vesmirna-bitva-upgrade.md) (tier-1 structure precedent), [spec-1.0l-temna-cerven-upgrade.md](spec-1.0l-temna-cerven-upgrade.md) (ADMINISTRACE pravý panel pattern), [spec-1.0k-nemrtvi-upgrade.md](spec-1.0k-nemrtvi-upgrade.md) (skull-arch precedent — explicitně se ODLIŠUJE), [spec-1.0j-hospoda-upgrade.md](spec-1.0j-hospoda-upgrade.md) (wood + iron precedent — explicitně se ODLIŠUJE), [spec-1.0b-theme-visuals.md](spec-1.0b-theme-visuals.md)

**Reference (✅ všechny assety dodány do `assets-source/themes/severske-runy/` + optimalizovány do `public/themes/severske-runy/decor/`):**
- `public/themes/backgrounds/severske-runy.webp` — fjord scenérie s krkavcem na runovém kameni, hory, vesnice, sníh ✅ (existuje, zachováno)
- `logo.png` / `logo.webp` — iron banner: vlevo angel-medallion kruh s frosted Ikaros, vpravo "Projekt Ikaros" iron-banded banner s rampouchy a Norse knot-work ✅ **user dodal**
- `medailon.png` / `medailon.webp` — **rectangular self-framed shield** (vertical, ~3:4 ratio), iron frame s rampouchy + valknut symbols + frosted Ikaros silhouette v ice-blue glow uvnitř ✅ **user dodal**
- `corner-tl.webp` (256×256) — iron-cast vlčí hlava s ice-blue glowing eye + open jaw glow, Norse knot-work base, mirror přes CSS ✅
- `welcome-arch.webp` (1280×720) — dark stained oak arch s iron banding, 2 menší vlčí hlavy v top corners (integrované do archu, eyes glow), 5 rampouchů uprostřed top, carved Younger Futhark runy po inner edges, transparentní centrální oblast ✅
- `wolfshield-divider.webp` (800×100) — horizontal iron strap s 4 raised rivetami na koncích + central bronze medallion s deep-engraved wolf-paw print (sjednocující motiv pravý + levý panel) ✅
- `rune-circle-floor.webp` (1600×400) — horní polovina kruhového runového kamene v podlaze, double-ring outline s 24 vrytými Younger Futhark glyfy, ice-blue glow z run ✅
- `rune-knot-seal.webp` (128×128) — kruhový bronze pečet s Norse interlace knot (Borre/Mammen style), 4 raised rivets na N/E/S/W ✅
- `medailon-frame.webp` (384×384) — bronze heater-shield rám s vrytými runami po obvodu + 3 dark gems (top, lower-left, lower-right místo iron nýtů — ESTHETIC UPGRADE od briefu), transparentní střed ✅
- `icon-*.webp` (10× 96×96) — carved-oak medailon disc s iron rim + 4 raised rivets + ice-blue Younger Futhark runa + piktogram (uvodnik=Raidho+kniha, vytvorit-svet=Thurisaz+kladivo, diskuze=Mannaz+siluety, clanky=Fehu+svitek, galerie=Dagaz+oko, napoveda=Eihwaz+strom, matrix=Othala+síň, novy-svet=Jera+slunce/hory, hospoda=Gebo+roh, chat=Ingwaz+tečka) ✅
- [`docs/arch/phase-1/prompts-1.0o-severske-runy-assets.md`](prompts-1.0o-severske-runy-assets.md) — asset prompty (✅ použito pro generování)

---

## 0. Princip — Carved Saga na konci fjordu

> **Stojíš v mead-hallu na konci fjordu. Venku padá sníh, krkavec sedí na runovém kameni, slunce je nízko nad horami. Tady se rozhoduje, kdo přežije zimu.** Drsná, vážná, ale **obyvatelná** — žije se tam, hoří oheň, ale za stěnou je smrtelná zima. Material nese příběh: každý prvek vypadá, jako by byl vyřezán, vykován nebo vyryt před 1000 lety a uchoval se až dodnes. Není to romantická fantasy (`modre-nebe`), ne mrtvá kostnice (`nemrtvi`), ne česká krčma (`hospoda`), ne lesklý palácový gold (`zlaty-standard`), ne viktoriánská gotika (`temna-cerven`). Tohle je **Carved Saga** — vrstvený, hmotný, ledový sever, vikingové, snaha o přežití.

**Inspirační kotvy:** *God of War: Ragnarök* mead-halls + rune stones × *Skyrim* Whiterun longhouse × *Hellblade: Senua's Sacrifice* Norse moodboard × *Vikings (TV)* Kattegat great hall × *Assassin's Creed Valhalla* longhouses × *Norse archaeology* (Oseberg ship wolf-head posts, Mammen axe runes, Jelling stone).

**NE** clean heraldická Camelot (`modre-nebe`). **NE** krvavá ossuary s lebkami (`nemrtvi`). **NE** krčmářská cedule s brass + burgundy (`hospoda`). **NE** royal luxury black + polished gold (`zlaty-standard`). **NE** viktoriánský barokní salon (`temna-cerven`). **NE** pergamenové iluminace (`pergamen`). **NE** Marvel Thor (clean plate armor + gold). **NE** Disney's Frozen (pastel). **NE** Halloween viking (cartoonish horned helmets). **NE** Warhammer Chaos viking (over-the-top spikes). **NE** flat illustration, **NE** cartoon, **NE** neon glow. Ice-blue je **cold light**, ne neon.

**Strict isolation:** vše scoped přes `[data-theme="severske-runy"]`. Zbylých 20 témat = nulová regrese.

---

## 1. Cíl

Po `themeId === 'severske-runy'` má dashboard vypadat jako **mead-hall síň na konci fjordu**: studené černo-modré pozadí (`#080c10`), **dark stained oak side panely s iron banding**, **iron-cast vlčí hlavy ve všech 4 rozích každého panelu** (master TL mirror přes CSS) s **ice-blue glowing eyes** (pasivní subtle + intensify na panel hover), **welcome card jako rune-stone deska** (vyleštěný šedý granit, jediný stone surface na stránce — sacred focus), **welcome-arch jako frame** kolem welcome cardu (oak arch s 5 rampouchy + 2 menší vlčí hlavy v rozích archu integrované do assetu), **medailon (orel Ikaros) integrovaný v levé třetině welcome cardu** s **bronze medailon-frame s 3 dark gems** (heater shield silhouette + vyrytými runami po obvodu), **rune-circle-floor pod welcome cardem** (horní polovina kruhu vidět, ice-blue glow z run, breathe 6s synchronizováno s active nav runa breathe), **wolfshield-divider mezi všemi sekcemi panelů** (iron strap + bronze paw-print medailon — sjednocující motiv), **10 carved-oak nav medailonů** s Younger Futhark runami (idle wood + iron rivets, hover = frostbreath mlha z dolní hrany, active = ice-blue glow runa + ice-crackle frosted spider-web), **pomalu padající sníh přes celou stránku** (3 vrstvy parallax, respect reduced-motion), **rune-tally pro notifikace** (vertikální runové čárky místo numerických počtů), **Sancreek display font** pro section headings (woodcut letters, NE button labels). Pravý panel = **ADMINISTRACE "high seat"** (skin selector + uživatelé NAHOŘE pod vlčími hlavami, odchylka od mockupů — z memory `project_admin_panel_decision.md` + Q-6 uživatel) + **MOJE DISKUZE / MOJE SVĚTY** (uprostřed). Top bar zjednodušený: **Pošta + Tyky + Odhlásit** (Uživatelé + Skin selector přesunuty do pravého panelu). Vše izolované, bez dopadu na ostatní skiny.

---

## 2. Kontext / motivace

- Vesmírná bitva (1.0n) zavedla naposled tier-1 produkční skin (battle-station-under-attack). **Severské runy je 12. ve "tier-1 produkční kvalitě"** — Carved Saga aesthetic jako vizuální opozit `hospoda` (warm tavern wood + brass) i `nemrtvi` (ghost-teal ossuary). Plně využívá **dual akcent** (ice-blue + oxidized bronze) — vyhne se kolizi s `vesmirna-lod` (cyan + amber, sci-fi) a `zlaty-standard` (black + polished gold, royal).
- Současný [`decorations.css`](../../../src/themes/themes/severske-runy/decorations.css) má jen ~16 řádků stub (background gradient + 3px card border-radius). Skin viditelně neodlišený — vypadá jako varianta default tématu.
- Současný [`index.ts`](../../../src/themes/themes/severske-runy/index.ts) má základní tokens (`#080c10` bg + `#4ab0d0` ice-blue + `#c08030` warm warning), fonty Cinzel/Uncial Antiqua/Lora. **Uncial Antiqua je keltská, ne severská** — vizuální nesoulad. Q-3 uživatel vybral **Sancreek** jako display (woodcut letters). Chybí materiálové tokens (wood, iron, bronze, stone, ice), chybí asset URLs.
- User explicitně chce *drsný severský vibe* — ledový sever, vikingové, chlad, snaha o přežití, drsná tvrdá země.
- User dodal logo + medailon (založené na poskytnutém mockupu) — oba ve frosted Ikaros iron-banded stylu s rampouchy a valknut symbols.
- Po dokončení bude **12 skinů** s "asset-grade" upgradem (zlatý standard, sci-fi, bílá, modré nebe, vesmírná loď, příroda, pergamen, hospoda, nemrtví, temná červeň, čtyři živly, vesmírná bitva, severské runy) → projekt blíže dokončené Fázi 1.

---

## 3. Audit současného stavu

### 3.1 Theme registry & tokens
- [`src/themes/themes/severske-runy/index.ts`](../../../src/themes/themes/severske-runy/index.ts) — existuje, definuje základní paletu (`#080c10` bg + `#4ab0d0` ice-blue + `#c08030` warm warning), fonty Cinzel + Uncial Antiqua + Lora, thumbnail a background, `reducedMotion: 'safe'`. **Nutné rozšíření palety o materiálové tokens** (wood/iron/bronze/stone) + **změna display fontu z Uncial Antiqua na Sancreek** (Q-3 user) + **přidání asset URLs** (logo, medailon, corner-tl, welcome-arch, atd.).
- Asset URL proměnné chybí — nutné přidat při zavedení assetů.

### 3.2 Decorations
- [`src/themes/themes/severske-runy/decorations.css`](../../../src/themes/themes/severske-runy/decorations.css) — 16 řádků, jen background gradient + 3px card border-radius. **Žádné panely, žádné NavItem styly, žádné dekorace, žádné mikrointerakce.** Skin viditelně nedokončený.

### 3.3 Asset folder
- `assets-source/themes/severske-runy/` — ✅ existuje, obsahuje 18 PNG (16 AI + 2 user)
- `public/themes/backgrounds/severske-runy.webp` — ✅ existuje (fjord scene s krkavcem)
- `public/themes/severske-runy/decor/` — ✅ existuje, 18× webp (16 AI + 2 user, všechny optimalizované přes `optimize-theme-assets.mjs` + `finalize-severske-runy-assets.mjs`)

### 3.4 Konflikt s existujícími skiny

| Aspekt | `hospoda` | `nemrtvi` | `modre-nebe` | `zlaty-standard` | `vesmirna-lod` | **`severske-runy`** |
|---|---|---|---|---|---|---|
| téma | středověká krčma | sedlec kostnice | heraldická Camelot | královský luxus | vojenský hangár | **vikingská mead-hall na fjordu** |
| paleta | brass + burgundy + warm oak | ghost-teal + bone + black | navy + gold + cyan | pure black + polished gold | cyan + amber | **ice-blue + oxidized bronze + iron + dark oak** |
| dominantní materiál | warm oak + brass hardware | bone + stone arches | navy fabric + heraldic gold | pure black + polished gold | clean plate metal | **dark stained oak + iron banding + carved granit** |
| signature ornament | hanging tavern sign + chains | skull-arch + bone divider + ghost-dust | corner ornament + heraldic page frames | gold double-stroke frame + nav end-caps | military plate corner + andel-medallion | **iron-cast vlčí hlavy + welcome-arch + rune-circle-floor + wolfshield-divider** |
| typografie | Pirata One + Almendra + Spectral | UnifrakturCook + New Rocker + Cardo | Cinzel Decorative + Cinzel + Lora | Cinzel Decorative + Cinzel + Lato | Orbitron + Rajdhani + Roboto Condensed | **Cinzel + Sancreek + Lora** |
| světlo | candle warm orange | ghost-teal cold + dust drift | starry night blue + heraldic glow | gold accent on pure black | cool ambient hangar | **ice-blue glow + dim torch warmth in bg only** |
| nálada | jolly tavern feast | death contemplation | heroic chivalry | royal opulence | disciplined calm | **harsh survival, quiet reverence** |
| signature animace | candle pulse + chain sway | ghost-pulse + dust drift | starry shimmer + heraldic glow | gold breathe + nav-end-cap glow | reticle sweep + plate clean shine | **snow fall (3 vrstvy) + breathe rune (4s) + frostbreath hover + ice-crackle active + wolf eye flicker** |

**Klíčové odlišení od `hospoda`:** Hospoda je **warm tavern** (brass + burgundy + candle); severské runy jsou **cold mead-hall** (ice-blue + bronze + torch only in bg). Sdílíme dřevo, ale: hospoda = warm oak + brass hardware + visící cedule, severské runy = **dark stained oak + iron banding + iron-cast vlčí hlavy** (žádné brass, žádné chains, žádné candles).

**Klíčové odlišení od `nemrtvi`:** Nemrtvi je **ossuary** (lebky lidské + ghost-teal + bone); severské runy jsou **iron + bronze + ice** (vlčí hlavy ne lidské, ice-blue ne ghost-teal). Sdílíme tmavé pozadí, ale tone je radikálně jiný.

**Klíčové odlišení od `modre-nebe`:** Modré nebe je **heraldická Camelot pod hvězdnatým nebem** (navy + heraldic gold + cyan); severské runy jsou **drsné železo na fjordu** (bez heraldiky, bez zlata, bez hvězd). Sdílíme navy bg, ale paleta a materiály jsou jiné.

**Klíčové odlišení od `vesmirna-lod`:** Vesmírná loď má **cyan + amber dual-tone**; severské runy mají **ice-blue + oxidized bronze**. Cyan vs ice-blue se rozlišuje **teplotou** (cyan = 180-190°, ice-blue = 200°). Amber vs bronze se rozlišuje **leskem** (amber = polished/lit, bronze = oxidized/matte). Vesmírná loď je sci-fi, severské runy jsou organické.

### 3.5 Předchozí tier-1 skiny jako pattern předlohy
- [`src/themes/themes/vesmirna-bitva/decorations.css`](../../../src/themes/themes/vesmirna-bitva/decorations.css) — ~750 řádků, structure sekcí 1–23 (background + topbar + side panely + welcome card + nav buttons + cards + ALERT panel + animace + reduced-motion)
- [`src/themes/themes/temna-cerven/decorations.css`](../../../src/themes/themes/temna-cerven/decorations.css) — ~750 řádků, ADMINISTRACE pattern + corner-ornament mirror precedent
- [`src/themes/themes/hospoda/decorations.css`](../../../src/themes/themes/hospoda/decorations.css) — dub + brass pattern, candle pulse precedent
- **Severské runy použijí stejnou strukturu sekcí**, ale s vlastní materiálovou a ornamentální paletou (wood + iron + bronze + stone + ice + snow fall + wolf eyes + frostbreath + ice-crackle).

### 3.6 ADMINISTRACE pravý panel — odchylka od base layoutu
- Per project memory [`project_admin_panel_decision.md`](../../../../../C:/Users/arafo/.claude/projects/c--Matrix-ProjektIkaros-Projekt-ikaros-FE/memory/project_admin_panel_decision.md) + Q-6 uživatel (2026-05-11): **pravý panel obsahuje 3 sekce v pořadí TOP → BOTTOM:**
  1. **ADMINISTRACE "high seat"** (nahoře, pod vlčími hlavami) — Skin selector + Uživatelé (Q-6 user: "Admin nahoře jako high seat — vlčí hlavy = autorita")
  2. **MOJE DISKUZE** (uprostřed)
  3. **MOJE SVĚTY** (dole)
- Non-admin user: ADMINISTRACE sekce se zmenší jen na 1 řádek (skin selector), uživatelé nebudou viditelní → admin sekce zaniká do background, neobtěžuje.

### 3.7 Top bar — odchylka od mockupů
- Mockup ukazoval v top baru: Pošta, Uživatelé, [Skin selector], Tyky, Odhlásit. Per Q-6 + memory: **Uživatelé + Skin selector přesunuty do pravého panelu**.
- Top bar zachovává: **Pošta + Tyky + Odhlásit** (3 položky vpravo nahoře).

---

## 4. Návrh řešení

### 4.1 Background & atmosféra

- **Background image** — `/themes/backgrounds/severske-runy.webp` (✅ existuje, fjord scene — krkavec na runovém kameni, ledové hory, vesnice s dlouhými domy, padající sníh).
- **Atmosférický overlay** — multi-vrstvý gradient pro chlad + hloubku:
  - horní-střední **cold daylight glow** (ice-blue, mild, jako kdyby slunce prosvítalo přes mraky)
  - spodní-levá **hluboký stín** (mead-hall interior, near-black)
  - **vinyl vignette** pro kinematický feel (subtler než vesmirna-bitva — chladná atmosféra, ne dramatická)
  - base darkening (linear-gradient 180deg, mild overlay)
- **🎨 Snow fall overlay** (signature element — pomalý sníh přes celou stránku):
  - **3 vrstvy parallax** (pure CSS, pozadí + střed + popředí), různé rychlosti (60s, 90s, 120s), různé hustoty, různé velikosti vloček (1-3px)
  - každá vrstva je `body::before` / `body::after` / `#root::before` s `background-image` opakovaným SVG snowflake patternem nebo `radial-gradient` tečkami
  - `pointer-events: none`, `z-index: 1` (nad backgroundem, pod panely)
  - **respect reduced-motion** — vypnuto v `prefers-reduced-motion: reduce`
- **🎨 Vignette frame** (subtle) — `body::after` radial-gradient od středu k okrajům, opacity 0.4

### 4.2 Topbar (slim, 56–72px) — zjednodušený

- Pozadí: **dark oak panel s horizontálním iron strap dole** (jako horní trám mead-hallu, ne strop)
- Levá strana: **logo.webp** (iron banner s frosted Ikaros + "Projekt Ikaros") — výška 48-56px
- Pravá strana: **Pošta + Tyky + Odhlásit** (3 položky, ne 5 jako mockup)
  - Pošta = button s iron rivetem + envelope SVG (decentní, nepoužívá nav medailon styl — top bar je jiný level hierarchy)
  - Tyky = user info (avatar + nickname)
  - Odhlásit = button
- **Skin selector + Uživatelé** NEJSOU v top baru → přesunuty do pravého panelu (sekce 4.4)
- **Žádné nav medailony v top baru** — ty patří pouze do levého panelu

### 4.3 Side panely (left + right) — dark oak + iron banding + vlčí hlavy

**Materiály:**
- Pozadí panelu: dark stained oak (linear-gradient `#1a1612` → `#2a2218` → `#1a1612`), saturated vertical woodgrain (CSS via repeating-linear-gradient s very low opacity OR background-image SVG noise)
- **Iron banding** (left + right vertical strips podél hran panelu) — `linear-gradient` černo-šedý s faint bronz highlight
- **Iron banding** (top + bottom horizontal strips) — stejné, méně dramatic

**Vlčí hlavy v rozích:**
- **4 rohy každého panelu** (top-left, top-right, bottom-left, bottom-right) — `corner-tl.webp` jako master, mirror přes CSS:
  - TL: `transform: none`
  - TR: `transform: scaleX(-1)`
  - BL: `transform: scaleY(-1)`
  - BR: `transform: scaleX(-1) scaleY(-1)`
- Velikost: **80px desktop / 64px tablet / 48px mobile**
- Pozice: přesahují horní/dolní hranu panelu o ~20-30px (dramatický gesture — hlava vykukuje ven)
- Hlavy **hledí dovnitř k centru panelu** (TL hlava hledí doprava, TR hlava hledí doleva)
- **Hover na panel:** Vlčí oči **intensify** (CSS animation, opacity 0.7 → 1.0, 1.5s ease-in, idle 4s breathe, fade-out při unhover). Animation target = `filter: brightness(1.4) drop-shadow(0 0 12px #70d0f0)`.
- **Easter egg:** 1× per session-ish jedna z hlav **mrkne** (eye glow zhasne 120ms). Implementace: CSS animation s velmi dlouhým cyklem (každých ~5min) + `animation-delay` differs per corner, takže blink není synchronizovaný a vypadá náhodně. Nebo skip pokud composer si neřekne (Q-OPEN: open question, viz risk 9.3).

**Wolfshield-divider** mezi sekcemi panelu — viz 4.7.

### 4.4 Pravý panel — ADMINISTRACE "high seat" + MOJE DISKUZE + MOJE SVĚTY

Struktura TOP → BOTTOM:

1. **Vlčí hlavy v rozích nahoře** (corner-tl mirror) + **iron banding** (sdílené se všemi panely)
2. **ADMINISTRACE "high seat"** (Q-6 user)
   - Section heading: **"ADMINISTRACE"** v **Sancreek** display fontu, ice-blue color, all-caps, letter-spacing widely
   - Skin selector dropdown (jako standard `<select>` nebo custom dropdown — viz risk 9.5)
   - Pokud user.role === 'admin' → **Uživatelé** link
   - Pokud user.role !== 'admin' → sekce má jen Skin selector (1 řádek)
3. **wolfshield-divider** (sjednocující motiv)
4. **MOJE DISKUZE**
   - Section heading: "MOJE DISKUZE" v Sancreek, ice-blue
   - Seznam zkratek (link list)
   - `+` button (přidat diskuzi) — iron square s bronze plus
5. **wolfshield-divider**
6. **MOJE SVĚTY**
   - Section heading: "MOJE SVĚTY" v Sancreek
   - Seznam světů
   - `+` button (přidat svět)
   - "Zobrazit vše →" link

**Mobile (≤768px):** Pravý panel collapse pod hlavní obsah (vertikální stack).

### 4.5 Welcome card scénická režie — 3 vrstvy hloubky

**Far layer (parallax 0):** Background image (fjord + krkavec + hory + vesnice + sníh) — viditelný kolem welcome cardu a skrze otevřený arch.

**Mid layer (welcome card frame):** **welcome-arch.webp** — masivní dark oak arch s integrated vlčími hlavami v rozích + 5 rampouchů + carved runes po inner edges. Aspect 16:9, full width welcome card + lehce přesahuje výšku cardu (top arch viditelný nad horní hranou).

**Near layer (welcome card surface):** **Vyleštěný šedý granit** (rune-stone deska) — `linear-gradient` `#2a2e34` → `#383c44` → `#2a2e34`, s **fine grain texture** (subtle SVG noise OR repeating-linear-gradient very low opacity). Tohle je **JEDINÝ stone surface na stránce** — sacred focus. Cards jinde (Novinky, …) zůstávají dark oak.

**Welcome card vnitřní layout:**
- **Levá třetina:** **medailon (orel Ikaros) + medailon-frame**
  - medailon.webp (user supplied — frosted Ikaros shield) je **rectangular self-framed display** — sám obsahuje vlastní iron frame s rampouchy a valknuts. Proto **NEPOTŘEBUJE** medailon-frame.webp obtočený kolem.
  - **medailon-frame.webp** se **REPURPOSE jako separate decorative element** — viz risk 9.4 (alternative: použít medailon-frame jako rám OKOLO orla, ALE medailon už má vlastní frame → konflikt). **Rozhodnutí:** medailon.webp se použije přímo (self-framed), medailon-frame.webp se použije jako **dekorativní element** vpravo dole na welcome cardu NEBO jako separator-decor mezi welcome a Novinky cards. Konkrétní pozice se rozhodne v plan-1.0o po visual testu.
- **Pravé dvě třetiny:** Text "Vítej v Projektu Ikaros…" + paragraph copy
  - Heading: **Sancreek** display font, ice-blue color, all-caps option
  - Body text: Lora, light grey color, 16px desktop / 14px mobile
- **Divider uprostřed cardu** ("Příjemnou zábavu přeji administrátoři"):
  - **Horizontal iron strap** přes celou šířku cardu (CSS `linear-gradient` + box-shadow inset)
  - Uprostřed strapu **rune-knot-seal.webp** (128×128 displayed at ~48-56px)
  - Text "Příjemnou zábavu…" v Lora italic, very low opacity (decentní)

**Rune-circle-floor** (dekor pod welcome card):
- **rune-circle-floor.webp** (1600×400) umístěn full-width pod welcome cardem
- Jen **horní 30-40% výšky kruhu vidět** (zbytek pokračuje pod cardem — z-index manipulace)
- Sub-glow **ice-blue breathe 6s** synchronizovaný s active nav runa breathe (sekce 4.6)
- Mobile: scale 0.5, méně viditelný (nebo skip — viz risk 9.6)

### 4.6 Nav buttons (medailony) — idle/hover/active

10 nav medailonů: 6 levý panel NAVIGACE (uvodnik, vytvorit-svet, diskuze, clanky, galerie, napoveda) + 2 VESMÍRY (matrix, novy-svet) + 1 CHAT + 1 DIMENZIONÁLNÍ HOSPODA.

**Sdílený styl:**
- Asset: 96×96 webp, carved-oak disc s iron rim + 4 raised rivets + Younger Futhark runa + piktogram
- Velikost displayed: **48-56px desktop / 40-48px tablet / 36-40px mobile**
- Pozice v nav row: vlevo, pak text label vpravo
- Label: text v **Lora** (NE Sancreek — labels musí být čitelné), 14-16px

**Idle state:**
- Asset displayed s natural appearance — carved-oak + iron, runa s 30% opacity ice-blue glow (subtle, ne aktivní)
- Hover area: celý nav row (asset + label)

**Hover state:**
- **Frostbreath mlha** — pseudo-element `::after` na nav row, position absolute bottom 0, radial-gradient `rgba(168, 200, 220, 0.4) → transparent`, opacity 0 → 1 přes 1.2s ease-in, pak slow drift up + fade out
- Label text **brighten** na ice-blue
- **Žádný background change na assetu** (asset zůstává stejný — frostbreath je layer nad)

**Active state (selected nav):**
- **Runa svítí ice-blue** — pseudo-element nebo filter na medailon asset, `filter: brightness(1.5) drop-shadow(0 0 12px #70d0f0)`
- **Breathe animation 4s** — opacity 0.7 → 1.0 → 0.7 nebo `filter: brightness()` modulace
- **Ice-crackle frosted spider-web** — *jednou na click* — SVG mask animation, scale 0 → 1.2 přes 400ms, opacity 1 → 0, jednorázová (ne loop)
  - Implementace: separate `::before` pseudo-element s SVG `data-url` mask, `animation-iteration-count: 1`
  - Reduced-motion: skip (žádný crackle)
- **Label text**: ice-blue, **NE Sancreek** (zachová Lora pro čitelnost), normal weight

**Reduced-motion:**
- Frostbreath skip
- Ice-crackle skip
- Breathe → static brightened state (jako kdyby `0%` keyframe trvalo navždy)

### 4.7 Wolfshield divider

**Použití:** Mezi sekcemi v pravém panelu (ADMINISTRACE ↔ MOJE DISKUZE ↔ MOJE SVĚTY) a v levém panelu (NAVIGACE ↔ VESMÍRY ↔ CHAT/HOSPODA).

**Implementace:**
- Asset: `wolfshield-divider.webp` (800×100) s central wolf-paw bronze medailon + 4 corner rivets
- Display: full width sekce panelu, height ~32-40px desktop / 24-32px mobile
- **Horizontal scale:** asset je 8:1 → ve full-width panelu (~280px sidebar) bude wolf-paw medailon ~36px. Pokud panel narrowwer (mobile), medailon se zmenší proporcionálně.

**Není animovaný** — statický divider, jen sjednocující motiv.

### 4.8 Cards (Novinky, …) — dark oak + iron banding (NE stone)

Jiné cards než welcome card (Novinky, list of diskuze, atd.) jsou **dark stained oak** (NE granit — granit je vyhrazen welcome cardu). Border = **iron banding** kolem (CSS `border-image` nebo pseudo-elements), 4 corner rivets (drobné, bronze).

### 4.9 Mikro-animace

| Animace | Délka | Targets | Reduced-motion |
|---|---|---|---|
| **Snow fall** (3 vrstvy parallax) | 60s, 90s, 120s linear infinite | `body::before`, `body::after`, `#root::before` (pseudo-overlay layers) | DISABLED |
| **Wolf eye breathe** | 4s ease-in-out infinite | `[data-theme="severske-runy"] .panel::before` (wolf eye glow pseudo) | DISABLED → static glow |
| **Wolf eye blink** (easter egg) | velmi dlouhý cyklus | random corner | DISABLED |
| **Active nav runa breathe** | 4s ease-in-out infinite | `.nav-item.active .icon` (filter brightness/drop-shadow) | DISABLED → static brightened |
| **Frostbreath hover** | 1.2s ease-out, jednorázová na hover | `.nav-item:hover::after` | DISABLED |
| **Ice-crackle click** | 400ms ease-out, jednorázová | `.nav-item.just-clicked::before` (state na 400ms) | DISABLED |
| **Rune-circle breathe** | 6s ease-in-out infinite (sync s nav active) | `.welcome-floor::before` (rune-circle-floor) | DISABLED → static glow |

**Žádná `body::after` particles** (sníh je už 3 vrstvy — nepřidávat dál). **Žádné rotation animace** (Carved Saga je statická, ne dynamická).

### 4.10 Rune-tally pro notifikace

Místo numerických počtů nepřečtených zpráv (např. "Chat (3)" nebo "Pošta (5)"):

- **1 zpráva** → 1 vertikální runová čárka `|` (24px tall, ice-blue, 2px stroke)
- **2 zprávy** → 2 čárky `||`
- **3 zprávy** → 3 čárky `|||`
- **4 zprávy** → 4 čárky `||||`
- **5 zpráv** → 4 vertikální čárky + 1 diagonální čárka přes ně (klasický tally, `||||͞`)
- **6-9 zpráv** → 1 plná tally group `||||͞` + 1-4 dalších svislých
- **10+ zpráv** → fallback numeric "10+" v Sancreek

**Implementace:** React komponenta `<RuneTally count={n} />` v `IkarosLayout` nebo přímo v Chat/Pošta sekci. CSS-only render přes flexbox s individuálními `<span>` pro každou čárku.

**Mobile:** Stejný styl, scale 0.75.

### 4.11 Reduced-motion fallback

Per `reducedMotion: 'safe'` v `index.ts` (aktuálně) — drží všechny pohyblivé animace vypnuté:
- Snow fall → DISABLED (žádné vrstvy)
- Wolf eye breathe → static glow (jako `0%` keyframe)
- Wolf eye blink → DISABLED
- Active nav runa breathe → static brightened
- Frostbreath hover → DISABLED
- Ice-crackle click → DISABLED
- Rune-circle breathe → static glow
- Hover transitions (color/border change) → zachovány (300ms je pod limit pro vestibulární reduced-motion)
- Button click feedback (translateY 1px) → zachován (UX feedback klíčový pro accessibility)

### 4.12 Asset list — **18 ✅ dodaných** (16 AI + 2 user)

| # | Asset | Účel | Velikost (final) | Source |
|---|---|---|---|---|
| 1 | `logo.webp` | Header logo (iron banner s frosted Ikaros + "Projekt Ikaros") | trimmed original | ✅ User dodal |
| 2 | `medailon.webp` | Rectangular self-framed shield s frosted Ikaros (welcome card levá třetina) | original | ✅ User dodal |
| 3 | `corner-tl.webp` | Iron-cast vlčí hlava s ice-blue glowing eye (master TL, mirror přes CSS) | 256×256 | ✅ AI gen |
| 4 | `welcome-arch.webp` | Dark oak arch s 2 vlčími hlavami + 5 rampouchů + carved runes (frame welcome card) | 1280×720 | ✅ AI gen |
| 5 | `wolfshield-divider.webp` | Iron strap s bronze paw-print medailon (sjednocující divider) | 800×100 | ✅ AI gen |
| 6 | `rune-circle-floor.webp` | Horní polovina runového kruhu (pod welcome card) | 1600×400 | ✅ AI gen |
| 7 | `rune-knot-seal.webp` | Bronze Norse knot pečet (welcome card vnitřní divider) | 128×128 | ✅ AI gen |
| 8 | `medailon-frame.webp` | Bronze heater-shield rám s runami + 3 dark gems (decorative element) | 384×384 | ✅ AI gen |
| 9 | `icon-uvodnik.webp` | Nav medailon Raidho + kniha | 96×96 | ✅ AI gen |
| 10 | `icon-vytvorit-svet.webp` | Nav medailon Thurisaz + kladivo | 96×96 | ✅ AI gen |
| 11 | `icon-diskuze.webp` | Nav medailon Mannaz + siluety u ohně | 96×96 | ✅ AI gen |
| 12 | `icon-clanky.webp` | Nav medailon Fehu + svitek | 96×96 | ✅ AI gen |
| 13 | `icon-galerie.webp` | Nav medailon Dagaz + oko v plameni | 96×96 | ✅ AI gen |
| 14 | `icon-napoveda.webp` | Nav medailon Eihwaz + Yggdrasil strom | 96×96 | ✅ AI gen |
| 15 | `icon-matrix.webp` | Nav medailon Othala + dlouhá síň | 96×96 | ✅ AI gen |
| 16 | `icon-novy-svet.webp` | Nav medailon Jera + slunce za horami | 96×96 | ✅ AI gen |
| 17 | `icon-hospoda.webp` | Nav medailon Gebo + drinking horn | 96×96 | ✅ AI gen |
| 18 | `icon-chat.webp` | Nav medailon Ingwaz + tečka-semínko | 96×96 | ✅ AI gen |

**Audit (2026-05-11):**
- ✅ Všech 10 nav ikon má identický carved-oak frame + iron rim + 4 rivets — **maximální stylová konzistence**
- ✅ `welcome-arch` má integrované vlčí hlavy v rozích (nebude potřeba mirror corner-tl na welcome card)
- ✅ `medailon-frame` má dark gems místo iron rivets — esthetic upgrade od briefu, akceptováno
- ✅ Všechny assety sdílí Norse knot-work motif (vlčí hlavy, dividers, frame) — sjednocený materiálový jazyk

**Pipeline:**
- PNG masters v `assets-source/themes/severske-runy/` → WebP přes `npm run themes:optimize` (`optimize-theme-assets.mjs`) → pass-through `public/themes/severske-runy/decor/*.webp`
- Resize na cílové rozměry přes `scripts/finalize-severske-runy-assets.mjs` (✅ vytvořeno + spuštěno)

### 4.13 Responsivita (desktop / tablet / mobile)

| Breakpoint | Změny |
|---|---|
| **Desktop** (≥1280px) | Plný layout, corner-tl vlčí hlavy 80px, welcome-arch full visible (top arch above card), rune-circle-floor 30-40% visible pod card, nav medailony 48-56px, wolfshield-divider 32-40px height, snow fall všechny 3 vrstvy aktivní |
| **Tablet** (1024–1279px) | Corner-tl 64px, welcome-arch slightly cropped vertikálně (top arch méně viditelný), nav medailony 44-48px, wolfshield-divider 28-32px |
| **Tablet narrow** (769–1023px) | Corner-tl 56px, ADMINISTRACE pravý panel zachován (zatím desktop layout — pokud narrow → collapse pod main), rune-circle-floor scale 0.7, nav medailony 40px |
| **Mobile** (≤768px) | Corner-tl 48px, welcome-arch crop nebo replace fallback (CSS-only border ornament), rune-circle-floor scale 0.5 nebo skip, nav medailony 36-40px, snow fall **1 vrstva místo 3** (performance), wolfshield-divider 24-28px |
| **Mobile compact** (≤480px) | Corner-tl 40px, welcome-arch replaced s CSS-only border (iron-banded), rune-circle-floor skip, nav medailony 32-36px, snow fall skip (performance) |

### 4.14 Index.ts tokens — kompletní map

```
// Vars (klíčové, ne kompletní seznam):
--bg-primary:       #080c10  (deep cold black-blue)
--bg-secondary:     #0c1018
--bg-card:          #101520  (cards jiné než welcome)
--bg-card-hover:    #161e28
--bg-card-stone:    #2a2e34  (welcome card stone)
--bg-card-stone-2:  #383c44  (welcome card stone gradient)

// Akcent: dual
--accent:           #4ab0d0  (ice-blue primary)
--accent-bright:    #70d0f0  (ice-blue active/hover)
--accent-dim:       #205870  (ice-blue idle subtle)
--accent-soft:      rgba(74, 176, 208, 0.16)
--accent-bronze:    #8a5a2a  (oxidized bronze primary) ← NEW
--accent-bronze-bright: #a87038  (bronze highlight) ← NEW
--accent-bronze-dim:    #5a3818  (bronze shadow) ← NEW

// Materials (nové) ← NEW
--mat-oak:          #1a1612  (dark stained oak base)
--mat-oak-mid:      #2a2218  (oak woodgrain mid)
--mat-oak-deep:     #0c0a08  (oak shadow)
--mat-iron:         #1a1c20  (black oxidized iron)
--mat-iron-highlight: #3a3e44  (iron edge highlight)
--mat-iron-deep:    #0a0c10  (iron recess shadow)
--mat-frost:        #c8d8e8  (snow / frost highlight)
--mat-rune-recess:  #0a0c10  (deep cut rune shadow)

// Text
--text-primary:     #c8d8e8
--text-secondary:   #5888a8
--text-muted:       #304050
--text-on-accent:   #04101a
--text-on-bronze:   #1a1612

// Borders
--border:           #3a4858
--border-subtle:    #202830
--border-strong:    #4ab0d0  (ice-blue)
--border-bronze:    #8a5a2a  (bronze) ← NEW

// Standard
--success:          #3ecf8e
--warning:          #c08030  (zachováno)
--danger:           #c04040
--info:             #4ab0d0
--bg-overlay:       rgba(0, 4, 8, 0.7)

// Fonty (změna)
--font-logo:        "Cinzel", Georgia, serif (zachováno)
--font-display:     "Sancreek", "MedievalSharp", Georgia, serif (změna z Uncial Antiqua) ← NEW
--font-body:        "Lora", "EB Garamond", Georgia, serif (zachováno)

// Asset URLs ← NEW
--asset-corner-tl:           url("/themes/severske-runy/decor/corner-tl.webp")
--asset-welcome-arch:        url("/themes/severske-runy/decor/welcome-arch.webp")
--asset-wolfshield-divider:  url("/themes/severske-runy/decor/wolfshield-divider.webp")
--asset-rune-circle-floor:   url("/themes/severske-runy/decor/rune-circle-floor.webp")
--asset-rune-knot-seal:      url("/themes/severske-runy/decor/rune-knot-seal.webp")
--asset-medailon-frame:      url("/themes/severske-runy/decor/medailon-frame.webp")
--asset-medailon:            url("/themes/severske-runy/decor/medailon.webp")
--asset-logo:                url("/themes/severske-runy/decor/logo.webp")
--asset-icon-uvodnik:        url("/themes/severske-runy/decor/icon-uvodnik.webp")
// ... atd. pro všech 10 nav ikon
```

### 4.15 Font loading

- **Cinzel** (logo) — ✅ existuje v `index.html` font links (sdílené s ostatními skiny)
- **Sancreek** (display) — **NUTNO PŘIDAT** do `index.html` font links (`<link href="https://fonts.googleapis.com/css2?family=Sancreek&display=swap" rel="stylesheet">`)
- **Lora** (body) — ✅ existuje (sdílené)

⚠️ **Sancreek riziko:** Sancreek je woodcut letters, **funguje skvěle pro big headings, ale ne pro body text** (čitelnost trpí). V tomto skinu Sancreek **POUZE pro section headings** (NAVIGACE, VESMÍRY, ADMINISTRACE, MOJE DISKUZE, MOJE SVĚTY, CHAT, welcome card heading "Vítej v Projektu Ikaros"). NIKDY pro:
- Nav button labels (Lora)
- Body paragraph text (Lora)
- Card content (Lora)

---

## 5. Soubory — change summary

### 5.1 Změnit

| Soubor | Změna | Velikost |
|---|---|---|
| `src/themes/themes/severske-runy/index.ts` | rozšíření tokens (material vars + asset URLs) + změna display fontu (Uncial Antiqua → Sancreek) | ~120 řádků (z ~50) |
| `src/themes/themes/severske-runy/decorations.css` | kompletní přepsání (panely + vlčí hlavy + welcome card stone + welcome-arch + rune-circle-floor + nav medailony + wolfshield divider + snow fall + frostbreath + ice-crackle + breathe + rune-tally + reduced-motion) | ~700-800 řádků (z ~16) |
| `index.html` | přidat Google Fonts URL pro Sancreek | +1 link tag |

### 5.2 Vytvořit

| Soubor | Účel |
|---|---|
| `docs/arch/phase-1/plan-1.0o.md` | Implementační plán (po schválení specu) |
| `src/shared/ui/RuneTally/RuneTally.tsx` | React komponenta pro rune-tally notifikace | (volitelné, lze i CSS-only) |

### 5.3 Layout komponenta — žádný global injection nutný

Per memory feedback `feedback_theme_isolation.md`: **NEPONAUVEDAT** globální DOM změny do `IkarosLayout`. Vše dělá CSS přes scoped `[data-theme="severske-runy"]` selektory.

Rune-tally: pokud bude komponenta, použije se v Chat/Pošta UI sekcích (které jsou už shared) — tam ji renderuje samostatně podle theme.

### 5.4 Konflikty / dotyky s globálním kódem

- ✅ Theme tokens v `index.ts` — scoped per téma
- ✅ Decorations v `decorations.css` — scoped přes `[data-theme="severske-runy"]`
- ✅ index.html font links — global (sdílené přes všechny skiny, žádný impact, jen víc požadavků na Sancreek font load)
- ⚠️ Pravý panel ADMINISTRACE "high seat" struktura — pokud `IkarosLayout` má fixed pořadí sekcí, může vyžadovat **CSS re-order** přes `order:` v flexbox, ne DOM změnu. Per memory: žádné DOM změny v shared layoutu.
- ✅ Žádné nové globální komponenty (RuneTally je opt-in).

---

## 6. Asset prompty

Detail v [`docs/arch/phase-1/prompts-1.0o-severske-runy-assets.md`](prompts-1.0o-severske-runy-assets.md) (✅ vytvořeno + použito pro generaci všech 16 AI assetů).

---

## 7. Test plán

### 7.1 Vizuální regrese (manuální)

- Snapshot `/dashboard` v `severske-runy` skinu (desktop 1920×1080 + mobile 375×667)
- Snapshot `/profil`, `/diskuze`, `/clanky` (3 typické stránky)
- **Smoke test ostatních 20 skinů** — žádná regrese (vizuální spot-check, ne pixel-perfect)

### 7.2 Manuální testing

**Desktop (Chrome, Firefox, Safari):**
- [ ] Vlčí hlavy ve všech 4 rozích každého panelu (top-left, top-right, bottom-left, bottom-right)
- [ ] Hover na panel → vlčí oči intensify, unhover → fade
- [ ] Welcome card má arch s rampouchy nad sebou + medailon vlevo + paragraph vpravo
- [ ] Rune-circle-floor pod welcome cardem (horní polovina viditelná, ice-blue glow)
- [ ] Nav buttons — idle wood + iron rivets, hover frostbreath, active runa svítí + breathe
- [ ] Wolfshield divider mezi sekcemi v levém i pravém panelu
- [ ] Pravý panel: ADMINISTRACE nahoře (skin selector + uživatelé pro admina) → wolfshield → MOJE DISKUZE → wolfshield → MOJE SVĚTY
- [ ] Top bar: Pošta + Tyky + Odhlásit (ne uživatelé, ne skin selector)
- [ ] Snow fall přes celou stránku, 3 vrstvy parallax viditelné
- [ ] Sancreek font na section headings, Lora na body
- [ ] Rune-tally místo numerických počtů u Chat / Pošta
- [ ] Click na nav button → ice-crackle animation jednorázová, ne loop

**Mobile (iOS Safari, Android Chrome):**
- [ ] Pravý panel collapse pod hlavní obsah
- [ ] Welcome arch responsive (crop nebo fallback)
- [ ] Nav medailony 36-40px
- [ ] Snow fall 1 vrstva (performance)
- [ ] Wolfshield divider proporcionální
- [ ] Rune-tally čitelný, ne přeplněný

**Accessibility:**
- [ ] `prefers-reduced-motion: reduce` — snow fall + frostbreath + crackle + breathe + blink všechno vypnuté
- [ ] Kontrast text vs background (WCAG AA — ice-blue na dark oak: ratio min 4.5:1)
- [ ] Keyboard navigation funguje na všech buttonech
- [ ] Focus indikátor viditelný (focus ring v ice-blue)

**Performance:**
- [ ] Lighthouse perf score ≥ 85 desktop, ≥ 75 mobile
- [ ] Cumulative Layout Shift < 0.1
- [ ] Total asset payload < 2 MB (16 AI assetů + 2 user = ~600 KB total per audit)

---

## 8. Akceptační kritéria

- [ ] Skin viditelně odlišný od `hospoda`, `nemrtvi`, `modre-nebe`, `zlaty-standard`, `vesmirna-lod`, `temna-cerven` (vizuální spot-check)
- [ ] Vlčí hlavy ve všech rozích panelů + welcome card má integrované vlčí hlavy v archu
- [ ] Welcome card používá granit stone surface (jediný stone na stránce)
- [ ] Všechny nav medailony mají identický styl (carved-oak + iron rim + 4 rivets)
- [ ] Wolfshield divider sjednocuje pravý + levý panel
- [ ] Snow fall funguje 3-vrstvý parallax, respect reduced-motion
- [ ] ADMINISTRACE v pravém panelu nahoře (high seat)
- [ ] Top bar je Pošta + Tyky + Odhlásit (3 položky)
- [ ] Sancreek font načten + používán pro headings
- [ ] Rune-tally implementován pro Chat / Pošta notifikace
- [ ] Žádná regrese v 20 ostatních skinech (smoke test)
- [ ] Mobile + desktop fully responsive
- [ ] Reduced-motion fallback funguje
- [ ] Performance OK (Lighthouse ≥ 85 desktop)

---

## 9. Riskové oblasti

### 9.1 Sancreek font + carved oak texture — čitelnost section headings

**Riziko:** Sancreek je woodcut letters s velkou variabilitou tahů. Na dark oak pozadí může být **málo čitelný** na malých velikostech (mobile section headings).

**Mitigace:**
- Sancreek **POUZE pro big headings** (24px+), ne pro smaller text
- Color = ice-blue (vysoký kontrast vůči dark oak)
- Fallback: MedievalSharp (čitelnější, ale méně original) v případě fallback chain failure
- Test: na mobile (12px-16px) zkouknout, jestli Sancreek nedrtí — pokud ano, downgrade na **Cinzel** pro section headings na mobile

### 9.2 Performance — snow fall 3 vrstvy

**Riziko:** 3 vrstvy snow fall s `background-image` repeated SVG patternem mohou na slabších mobilních zařízeních způsobit jank.

**Mitigace:**
- Mobile (≤768px) → **1 vrstva** místo 3
- Mobile compact (≤480px) → **skip snow fall** (přidat skip class via `@media`)
- Použít `will-change: background-position` jen na aktivních vrstvách
- Vyhnout se `filter` na animovaných vrstvách (drahá rasterizace)
- Reduced-motion → DISABLED

### 9.3 Wolf eye blink easter egg — implementační složitost

**Riziko:** Náhodné blink jedné z 4 vlčích hlav v panelu může být **komplexní CSS-only** (potřebuje random timing).

**Mitigace:**
- **MVP impl:** SKIP easter egg blink — jen pasivní glow + hover intensify
- **Future enhancement:** přidat `animation-delay` s velkými hodnotami (např. 5min + offset per corner) → simuluje random blink
- Alternativně: JS-driven (intervalem) — ALE z memory: žádný globální JS injection. → MVP skip.

### 9.4 Medailon-frame.webp — kde ho použít

**Riziko:** Brief plánoval medailon-frame OKOLO medailonu (orla), ALE user-supplied medailon.webp už má vlastní iron frame (rectangular self-framed shield). Frame okolo by **kolidoval**.

**Mitigace:**
- **MVP rozhodnutí:** medailon-frame.webp se NEPOUŽIJE jako wrapper okolo medailonu.
- **Alternativa A:** Použít medailon-frame jako **dekorativní element** vpravo dole na welcome cardu (vedle "Příjemnou zábavu…" textu).
- **Alternativa B:** Použít medailon-frame jako **separator-decor** mezi welcome card a Novinky card.
- **Alternativa C:** Skip medailon-frame ve V1 (asset zůstává, ale není referencován v CSS).
- **Doporučení:** Alternativa A — bronze shield s runami je krásný a zaslouží viditelnost. Konkrétní pozice se rozhodne v plan-1.0o po visual testu na real componentě.

### 9.5 Skin selector — design

**Riziko:** Standard `<select>` dropdown vypadá na tomto skinu **kýčově** (browser native styling). Mockup ukazuje vlastní pull-down.

**Mitigace:**
- **MVP:** Reuse existující skin selector komponenty (sdílený, žádný theme-specific design)
- **Future:** Custom dropdown jako "rune scroll" (vertikální runový pruh) — zmíněno v frontend-design briefu jako bonus 6, ale **out of scope V1**.

### 9.6 Rune-circle-floor — mobile visibility

**Riziko:** Rune-circle-floor je 1600×400 banner. Na mobile (375px wide) bude **velmi malý** (scale 0.23) → nečitelné runy.

**Mitigace:**
- Mobile (≤768px) → scale 0.5 (akceptovatelná velikost), runy jsou decorace, ne sémantika
- Mobile compact (≤480px) → **skip** rune-circle-floor (`display: none`)
- Zachovat ice-blue ambient glow pod welcome cardem (CSS `box-shadow` na cardu místo image)

### 9.7 Iron-cast vlčí hlavy přesahující panel — clip vs overflow

**Riziko:** Vlčí hlavy v rozích panelů přesahují horní/dolní hranu panelu o 20-30px (dramatický gesture). Pokud má panel `overflow: hidden` (typicky kvůli border-radius), hlavy se **oříznou**.

**Mitigace:**
- Panel CSS: `overflow: visible` pro `[data-theme="severske-runy"]` (může dotknout layoutu — testovat)
- Alternativa: použít `position: absolute` na vlčí hlavy s posunem ven z panelu — vyžaduje absolute parent context
- Test: zkontrolovat, že žádný globální `IkarosLayout` styling nepřebíjí `overflow: visible`

### 9.8 Pravý panel "high seat" struktura — DOM vs CSS order

**Riziko:** Pokud `IkarosLayout` má fixed pořadí sekcí (MOJE DISKUZE → MOJE SVĚTY → ADMINISTRACE), nemůžeme přesouvat DOM. CSS `order:` v flexbox řeší to bez DOM change.

**Mitigace:**
- **MVP:** Použít `order:` v flexbox přes scoped CSS — ADMINISTRACE dostane `order: 1`, MOJE DISKUZE `order: 2`, MOJE SVĚTY `order: 3`.
- Test: že screen readers respektují DOM order, ne visual order (a11y check — pokud problém, je nutná global layout změna což porušuje memory feedback).

### 9.9 prefers-reduced-motion: 'safe' vs 'heavy'

**Riziko:** Aktuální stub má `reducedMotion: 'safe'`. Carved Saga má SNOW + breathe + frostbreath + crackle — to je **víc než safe**.

**Mitigace:**
- **Zvýšit na `reducedMotion: 'gentle'` nebo `'heavy'`** v `index.ts` — viz spec 1.0b
- Reduced-motion fallback striktně dodržet (sekce 4.11)

---

## 10. Out of scope (V1 → future)

- **Krkavec sleduje scroll** (frontend-design WOW #4) — vyžaduje JS / scroll-driven animation API, OUT V1
- **Rune scroll skin selector** (frontend-design bonus 6) — custom dropdown s rune-scroll animation, OUT V1
- **Wolf eye blink easter egg** — pure CSS random je hacky, OUT V1, future enhancement
- **Mlha z dveří mead-hallu v pozadí** (frontend-design parallax bonus) — vyžaduje complex bg manipulation, OUT V1

---

## 11. Schválení

- [ ] User schvaluje princip Carved Saga + 7 závazných rozhodnutí (Q-1 až Q-6)
- [ ] User schvaluje asset audit (18 assetů, žádný regenerát nepotřeba)
- [ ] User schvaluje 9 riskových oblastí s navrženou mitigací
- [ ] User schvaluje out-of-scope V1 list

**Po schválení specu → impl plán [`plan-1.0o.md`](plan-1.0o.md).**
