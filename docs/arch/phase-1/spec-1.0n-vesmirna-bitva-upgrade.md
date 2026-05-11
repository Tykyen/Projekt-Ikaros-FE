# Spec 1.0n — Vesmírná bitva visual upgrade

**Status:** ✅ Implementováno (2026-05-11)
**Datum:** 2026-05-11
**Rozsah:** FE skin upgrade — `[data-theme="vesmirna-bitva"]` izolace, žádný globální dopad
**Repo:** `Projekt-ikaros-FE`, větev `feat/krok-1.0n-vesmirna-bitva-upgrade`
**Velikost:** odhad ~3 soubory změna (`index.ts`, `decorations.css`, `public/themes/vesmirna-bitva/`) + 13 nových assetů (11 AI + 2 user) — všechny ✅ dodány
**Autor:** PJ + Claude
**Souvisí:** [spec-1.0l-temna-cerven-upgrade.md](spec-1.0l-temna-cerven-upgrade.md) (corner-ornament + ADMINISTRACE pattern), [spec-1.0m-ctyri-zivly-upgrade.md](spec-1.0m-ctyri-zivly-upgrade.md), [spec-1.0g-vesmirna-lod-upgrade.md](spec-1.0g-vesmirna-lod-upgrade.md) (sci-fi precedent — explicitně se ODLIŠUJE), [spec-1.0b-theme-visuals.md](spec-1.0b-theme-visuals.md)

**Reference (✅ všechny assety dodány do `assets-source/themes/vesmirna-bitva/`):**
- `assets-source/themes/backgrounds/vesmirna-bitva.png` (a `public/themes/backgrounds/vesmirna-bitva.webp`) — battle background (hořící lodě, plazmové výbuchy, viewport okno bitevního křižníku), **user upravil** ✅
- `logo.png` — kombinovaný banner: vlevo angel-medallion kruh s red-LED ringem + anděl s křídly, vpravo angular gunmetal "Projekt Ikaros" stencil banner s rivetami a red highlights ✅
- `medailon.png` — **rectangular self-framed display** (vertical, ~3:4 ratio), pancéřový gunmetal rám s úhlovými rohy + vnitřní red-LED rim + andělský siluet v krevně-červeném glow vnitř ✅
- `corner-tl.png` — battle-damaged L bracket s 5 nýty, lava ember + kouř po vnější hraně, malý red-LED bod v inner corner ✅
- `medailon-frame.png` — **oktagonální pancéřový rám** s 8 nýty, lava ohni ve 4 rozích, vnitřní red-LED rim glow (prázdný střed — průhledný) ✅ **REPURPOSED** → ALERT panel (R1, viz 4.5)
- `destroyer-schematic.png` — top-down wireframe destroyer s 3 X marks v damage zónách ✅
- `targeting-reticle.png` — koncentrické kruhy s crosshair + 4 corner tick brackety + 4 inner lock-on bracket marks ✅
- `icon-*.png` — 7 console-panel button ikon, sdílený gunmetal frame se 4 nýty + spodní red-LED glow + carved symbol ✅
- `docs/arch/phase-1/prompts-1.0n-vesmirna-bitva-assets.md` — asset prompty (✅ použito pro generování)

---

## 0. Princip — můstek bitevního křižníku v akutním boji

> **Jsi *teď* na můstku těžkého křižníku, který právě bere zásahy.** Klaxon vyje, červené nouzové LED bliká, panely jsou pancéřové ocelové desky s nýty a podpálenými hranami, jiskry padají z rohů — *brutální, nebezpečný, beznadějný*. Není to "post-mortem" forenzika (to by byl koncept A), není to čistá vojenská loď v klidovém hangáru (to je `vesmirna-lod`), není to elegantní velitelská sálová HUD (to je `sci-fi`). Tohle je **damage control v aktivní bitvě** — člověk ví, že může padnout a zemřít, ale dělá svou práci.

**Inspirační kotvy:** *Mass Effect 3* poškozený Normandy bridge × *Dead Space 2* USG Ishimura damage panels × *Battlestar Galactica* nouzové LED + klaxony × *Helldivers 2* hazard tlačítka × *Aliens (1986)* nostromo "we're in the shit" feel.

**NE** čistá futuristická loď (`vesmirna-lod`, `sci-fi`). **NE** neon megacity (`kyberpunk`). **NE** post-apokalyptická pustina (`postapo`). **NE** krvavá viktoriánská gotika (`temna-cerven` — má stejnou červeno-černou paletu, ale baroque/silver, ne kovová). **NE** Warhammer 40K cathedral (žádné gotické oblouky, vitráže, sakrální motivy). **NE** crack overlays / shattered glass cliché — damage cítit z **ohořelých hran panelů**, ne z popraskaného skla. **NE** žluto-černá hazard pruhy (Star Citizen / video-game tropy) — paleta je striktně černá + červená + gunmetal.

**Strict isolation:** vše scoped přes `[data-theme="vesmirna-bitva"]`. Zbylých 20 témat = nulová regrese.

---

## 1. Cíl

Po `themeId === 'vesmirna-bitva'` má dashboard vypadat jako **můstek poškozeného bitevního křižníku v akutním boji**: tmavá kovová paluba s "hellfire red" akcenty (`#b8101c` + `#ff5040` plasma highlights), **angular battle-plate panely s nýty a ohořelými hranami**, **alarm pulse animace** přes všechny panel-bordery (1.4s klaxon cyklus), **spark burst** z rohových bracketů (~7s interval), **destroyer schematic strip** nad welcome cardem (wireframe lodi s damage X marks), **medailon vlevo jako self-framed rectangular tactical display** (medailon.png už obsahuje vlastní pancéřový rám s red-LED rim — žádný extra wrapper frame), **heart-monitor divider** (ECG flatline s občasným spike) mezi sekcemi, **decorative status strip** pod welcome cardem s targeting reticle a hlášením "VŠECHNY SYSTÉMY V POHOTOVOSTI", **7 console-panel button ikon** pro nav (gunmetal s nýty + vyrytý symbol + red backlight). Pravý panel = **ADMINISTRACE** (skin selector + uživatelé) + **MOJE DISKUZE / MOJE SVĚTY** + **ALERT panel** ("STANICE POD ÚTOKEM / PRIORITA 1") jako signature 3. sekce specifická pro tento skin, **s velkým oktagonálním medailon-frame.png pancéřovým rámem okolo hazard triangle** (signature emphasis — R1 repurposing). Vše izolované, bez dopadu na ostatní skiny.

---

## 2. Kontext / motivace

- Temná červeň (1.0l), Čtyři živly (1.0m) zavedly poslední iterace asset pipeline + tier-1 produkčního skinu. **Vesmírná bitva je 11. ve "tier-1 produkční kvalitě"** — battle-station-under-attack aesthetic jako vizuální opozit `vesmirna-lod` (clean hangar) i `temna-cerven` (Victorian salon se stejnou červeno-černou paletou).
- Současný [`decorations.css`](../../../src/themes/themes/vesmirna-bitva/decorations.css) má jen ~22 řádků stub (background tint + card border + hover glow). Skin viditelně neodlišený — vypadá jako varianta default tématu.
- Současný [`index.ts`](../../../src/themes/themes/vesmirna-bitva/index.ts) má základní tokens (gradient čerň + bright red `#c01818`, fonty Orbitron/Rajdhani/Roboto Condensed), ale tyto fonty se přesně shodují s `vesmirna-lod` a `sci-fi` — **nedostatečně odlišené**. Chybí materiálové tokens (gunmetal, ember, plasma), chybí asset URLs.
- User explicitně chce *brutální nebezpečný vibe* — battle station under attack feeling, ne abstraktní sci-fi.
- User dodá logo + medailon (založené na poskytnutém screenshotu mockupu).
- Po dokončení bude **11 skinů** s "asset-grade" upgradem (zlatý standard, sci-fi, bílá, modré nebe, vesmírná loď, příroda, pergamen, hospoda, nemrtví, temná červeň, vesmírná bitva) → projekt blíže dokončené Fázi 1.

---

## 3. Audit současného stavu

### 3.1 Theme registry & tokens
- [`src/themes/themes/vesmirna-bitva/index.ts`](../../../src/themes/themes/vesmirna-bitva/index.ts) — existuje, definuje základní paletu (`#050305` bg + `#c01818` bright red, fonty Orbitron + Rajdhani + Roboto Condensed), thumbnail a background, `reducedMotion: 'heavy'`. **Nutné kompletní přepsání palety + fontů + tokens** podle Q&A rozhodnutí (hellfire `#b8101c` + plasma `#ff5040` + gunmetal `#3a3e44` + Saira Stencil One + Chakra Petch + Inter Tight).
- Asset URL proměnné chybí — nutné přidat při zavedení assetů.

### 3.2 Decorations
- [`src/themes/themes/vesmirna-bitva/decorations.css`](../../../src/themes/themes/vesmirna-bitva/decorations.css) — 22 řádků, jen background gradient + 0px card border-radius + hover glow. **Žádné panely, žádné NavItem styly, žádné dekorace, žádné mikrointerakce.** Skin viditelně nedokončený.

### 3.3 Asset folder
- `assets-source/themes/vesmirna-bitva/` — neexistuje (nutno vytvořit)
- `assets-source/themes/backgrounds/vesmirna-bitva.png` — ✅ existuje (battle scene, user upraven)
- `public/themes/backgrounds/vesmirna-bitva.webp` — ✅ existuje (build output)
- `public/themes/vesmirna-bitva/decor/` — neexistuje (nutno vytvořit při WebP konverzi)

### 3.4 Konflikt s existujícími sci-fi skiny
- **vesmirna-lod** (1.0g): clean military hangar, cyan/amber dual-tone, plate-metal panely s nýty, 7 military nav ikon, andel-medallion. Sdílí: nýty, kov, vojenský feel. **Odlišení:** vesmirna-lod je *klidný hangár*, vesmirna-bitva je *aktivní bojový můstek pod palbou*. Paleta je radikálně jiná (cyan/amber vs hellfire-red/gunmetal). Vesmirna-lod nemá alarm pulse, spark burst, burned edges, destroyer schematic, ALERT panel.
- **sci-fi** (1.0d): futuristic command HUD, cyan/magenta neon, holographic glass. Sdílí: industrial feel. **Odlišení:** sci-fi je *clean glass*, vesmirna-bitva je *poškozená ocel*. Paleta zcela jiná.
- **zlatý-standard** (1.0c): royal cosmic, black/gold/cobalt. Sdílí: čerň. **Odlišení:** žádné významné překryvy.
- **temna-cerven** (1.0l): Victorian gothic salon, garnet/silver. Sdílí: červeno-černá paleta. **Odlišení:** temna-cerven je *baroque sametový salón s ornamenty* (damask, jet-bead, bat-arch, blackletter písmo); vesmirna-bitva je *kovaný bojový můstek* (rivets, burned edges, stencil písmo). Paleta tone: temna-cerven cool/bordeaux, vesmirna-bitva warm/hellfire.

### 3.5 Předchozí tier-1 skiny jako pattern předlohy
- [`src/themes/themes/temna-cerven/decorations.css`](../../../src/themes/themes/temna-cerven/decorations.css) — ~750 řádků, struktura sekcí 1–23
- [`src/themes/themes/nemrtvi/decorations.css`](../../../src/themes/themes/nemrtvi/decorations.css) — ~700 řádků, blackened iron + bone + ghost-pulse
- [`src/themes/themes/vesmirna-lod/decorations.css`](../../../src/themes/themes/vesmirna-lod/decorations.css) — vojenský hangár pattern, plate-metal corner
- **Vesmírná bitva použije stejnou strukturu sekcí**, ale s vlastní materiálovou a ornamentální paletou (gunmetal + hellfire + plasma + alarm pulse + burned edges + sparks).

### 3.6 ADMINISTRACE pravý panel — odchylka od base layoutu
- Per project memory `project_admin_panel_decision.md` + Q-1 A (2026-05-11): **pravý panel obsahuje 3 sekce:**
  1. **ADMINISTRACE** (nahoře) — skin selector + uživatelé (per memory)
  2. **MOJE DISKUZE / MOJE SVĚTY** (uprostřed) — defaultní base layout
  3. **ALERT panel** (dole) — signature element specifický pro tento skin

---

## 4. Návrh řešení

### 4.1 Background & atmosféra

- **Background image** — `/themes/backgrounds/vesmirna-bitva.webp` (✅ existuje, battle scene — viewport okno bitevního křižníku, hořící lodě, plazmové výbuchy, debris)
- **Atmosférický overlay** — multi-vrstvý kombinovaný gradient pro zesílení battle ambient:
  ```css
  --theme-bg-overlay:
    /* horní-pravá exploze glow (echo z BG) */
    radial-gradient(ellipse 700px 280px at 78% 22%, rgba(255, 80, 64, 0.18), transparent 60%),
    /* spodní-levá hluboký stín (lodní interiér) */
    radial-gradient(ellipse 800px 400px at 18% 85%, rgba(0, 0, 0, 0.7), transparent 70%),
    /* vinyl vignette pro kinematický feel */
    radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0, 0, 0, 0.65) 100%),
    /* base darkening */
    linear-gradient(180deg, rgba(6, 3, 10, 0.40) 0%, rgba(6, 3, 10, 0.55) 100%),
    var(--bg-primary);
  ```
- **🎨 Scanline overlay** (signature element — subtle HUD layer):
  - `body::before` pseudo-element, position fixed, inset 0
  - `background: repeating-linear-gradient(180deg, transparent 0, transparent 3px, rgba(255, 80, 64, 0.02) 3px, rgba(255, 80, 64, 0.02) 4px)`
  - opacity 0.5, mix-blend-mode overlay, pointer-events none, z-index 1000
- **🎨 Film grain overlay** (heavy combat atmosphere):
  - SVG inline pattern `feTurbulence` baseFrequency 0.9, opacity 0.4, mix-blend-mode overlay
  - z-index 1001
- **🎨 Alarm pulse** (signature animation, viz 4.11) — aplikováno na všechny hlavní panely (border + box-shadow)
- **🎨 Spark burst** (doprovodná animace, viz 4.11) — corner brackety, ~7s interval, random delay

### 4.2 Topbar (slim, 56–72px) — gunmetal panel s embedded red LED strip

- Pozadí: tmavý gunmetal gradient s burnt undertone:
  ```css
  background: linear-gradient(180deg, rgba(20, 14, 16, 0.92), rgba(8, 4, 6, 0.96));
  ```
- **Žádný backdrop-filter** (heavy steel bulkhead, ne sklo)
- **Border**: 1px gunmetal `var(--gunmetal-edge)` `rgba(124, 132, 140, 0.32)`
- **🎨 Bottom LED strip** (signature): `::after` pseudo-element, height 2px, full width, background `linear-gradient(90deg, transparent, var(--hellfire-red), var(--plasma), var(--hellfire-red), transparent)`, alarm-pulse opacity 0.4 → 0.9 → 0.4 (1.4s loop)
- **Box-shadow inner**: `inset 0 1px 0 rgba(180, 190, 200, 0.06)` (subtle highlight nahoře) + `inset 0 -2px 6px rgba(0, 0, 0, 0.7)` (deep dock shadow)
- **Box-shadow outer**: `0 14px 30px rgba(0, 0, 0, 0.6)` (gravity)
- Logo vlevo z **`logo.webp`** (kombinovaný banner: vlevo angel-medallion kruh s red-LED ringem + anděl, vpravo angular gunmetal stencil "Projekt Ikaros"): šíře auto, výška `--asset-logo-h: 60px` desktop / `48px` tablet / `40px` mobile
  - **Aspect ratio cca 2.4:1** — širší kvůli levostrannému medailonu
  - filter: `drop-shadow(0 0 14px rgba(184, 16, 28, 0.5))` — hellfire glow (zesiluje red-LED ring v logo medailonu)
  - **Pozn:** logo má baked-in angel-medallion kruh vlevo — proto je `--asset-logo-w` o ~25% širší než temna-cerven (~560px desktop max)
- Pravé tlačítka (POŠTA, UŽIVATELÉ, ZLATÝ STANDARD, TYKY, ODHLÁSIT) = **angular gunmetal name-plates s burnt edge**:
  - Background: `linear-gradient(180deg, #1a1418, #0a0608)` (tmavá ocel)
  - Border: 1px `var(--gunmetal-edge)` (rgba 0.32)
  - **Bottom border 1px burnt gradient** (signature): `border-image: linear-gradient(90deg, transparent, var(--ember-burn), transparent) 1 / 0 0 1px 0`
  - Box-shadow: vnitřní gunmetal highlight nahoře + černý hairline dole + outer drop
  - Text: `var(--text-pale) #d8d2d0` uppercase **Saira Stencil One** 12px, letter-spacing 0.25em
  - Hover: text → `var(--plasma-bright)`, border bright gunmetal, **0 0 18px hellfire glow** outer + 1px hellfire rim inner
  - Active state: `translateY(1px)` (subtle press)
- **Mobile (≤768px)**: ikony only, label hidden přes `aria-label`
- **Mobile (≤480px)**: TYKY + ODHLÁSIT do hamburger drawer

### 4.3 Sidebar levý — NAVIGACE / VESMÍRY / CHAT (a HOSPODA tlačítko)

- Frame: gunmetal panel s **angular battle-plate styling**:
  ```css
  background:
    linear-gradient(180deg, rgba(20, 14, 16, 0.94), rgba(8, 4, 6, 0.96));
  border: 1px solid var(--gunmetal-edge);
  box-shadow:
    inset 0 1px 0 rgba(180, 190, 200, 0.06),
    inset 0 -2px 8px rgba(0, 0, 0, 0.7),
    inset 0 0 0 1px rgba(184, 16, 28, 0.18),
    0 22px 50px rgba(0, 0, 0, 0.6);
  ```
- **🎨 Burned edge bottom** (signature, viz Q5 D): panel má spodní okraj s podpáleným gradientem:
  - `.panel::before` pseudo-element, position absolute, bottom 0, left 0, right 0, height 36px
  - `background: linear-gradient(180deg, transparent, rgba(255, 80, 40, 0.18) 60%, rgba(40, 8, 4, 0.45) 100%)`
  - `mask: linear-gradient(180deg, transparent, black 70%)` (jen spodek)
  - pointer-events none, z-index 0 (pod obsahem)
- **🎨 Battle-plate corner brackety (4 rohy)** — signature element:
  - `<svg class="corner tl/tr/bl/br">` nebo `<img src="corner-tl.webp">` master + CSS scaleX/Y mirror
  - Master `corner-tl.webp` (~1024×1024), CSS scaleX/Y mirror na ostatní 3 rohy
  - Render: 40×40 desktop / 32×32 tablet / 24×24 mobile (corner-anchored s -6px offset)
  - **Filter**: `drop-shadow(0 1px 0 #000) drop-shadow(0 0 8px rgba(184, 16, 28, 0.4))` (hellfire halo)
- **🎨 Spark burst** z rohových bracketů (viz 4.11) — random 1 ze 4 rohů jiskří každých ~7s
- **🎨 Alarm pulse** na border (viz 4.11) — border-color a outer box-shadow swell v 1.4s klaxon cyklu (subtle, ne přehnaně)
- **Section titles** ("NAVIGACE", "VESMÍRY", "CHAT") — **Saira Stencil One** uppercase 13px, letter-spacing 0.42em, color `var(--gunmetal-bright)`, text-align center
  - **Hellfire dot decorations** kolem titulu — `h3::before/::after` (1px gunmetal-edge gradient lines + `<span class="dot">` 6×6px round hellfire-red s plasma glow uprostřed)
- **🎨 Heart-monitor divider** mezi sekcemi — **SVG inline** (viz Q6 i):
  - Vodorovná flatline (1px hellfire-red horizontal line) přes celou šířku panelu
  - Centrální ECG spike (SVG path: M..L..L..L) animovaný `stroke-dasharray` keyframe — kreslí spike každých 3.6s, plasma glow filter, pak vrací do flatline
  - Height 24px, opacity 0.85
  - **Animace vypnuta** v reduced-motion (zachová se statický flatline + spike rendered)
- **NavItem** (každá položka):
  - Klid: `linear-gradient(180deg, rgba(28, 20, 22, 0.55), rgba(12, 8, 10, 0.55))` + 1px transparent border, **Saira Stencil One** 12px letter-spacing 0.25em
  - Hover: text → `gunmetal-bright`, border-color → `gunmetal-edge`, **inset 1px hellfire rim + 0 0 16px hellfire glow**, console button (před textem) red LED zesílí
  - Active: text → `gunmetal-bright`, background hellfire gradient `rgba(70, 10, 16, 0.7) → rgba(28, 8, 12, 0.85)`, **gunmetal-edge bracket [ ]** kolem položky (`.nav a.active::before` + `::after` — 6×14px borders L/R), console button hellfire-red backlight v plné intenzitě
  - **Žádný shine sweep / candle flicker** (to jsou hospoda/nemrtví signatury) — vesmirna-bitva má **alarm pulse** jako primární motion
  - Před textem: unikátní console-panel button ikona (1 ze 7, viz 4.7) — render přes `data-nav-key` selector + `--asset-icon-*` proměnné

### 4.4 Welcome card — bojový můstek centerpiece

- **Min-height** `clamp(440px, 60vh, 720px)` (mírně vyšší než temna-cerven kvůli destroyer schematic stripu nahoře a decorative status stripu dole)
- **Materiál**: tmavá ocel s glassmorphism:
  ```css
  background:
    linear-gradient(180deg, rgba(22, 14, 18, 0.95), rgba(8, 4, 6, 0.97));
  backdrop-filter: blur(6px) saturate(1.05);
  ```
- **Border**: 1px `var(--gunmetal-edge)`
- **Box-shadow**: `var(--inner-shadow)` (gunmetal highlight + inner deep) + `0 0 0 1px var(--border-hellfire) inset` + `0 28px 70px rgba(0, 0, 0, 0.65)` (deep gravity)
- **🎨 Alarm pulse** (signature): `animation: alarm-pulse 1.4s ease-in-out infinite;`
  - Keyframes: 0%/100% klid (border `var(--gunmetal-edge)`, 0 0 0 1px hellfire-dim), 50% peak (border `var(--hellfire-bright)`, 0 0 28px hellfire glow + 0 0 0 1px plasma rim)
- **🎨 Spark burst** z 4 rohových bracketů (1 ze 4 jiskří každých ~5s) — viz 4.11
- **🎨 Burned edge bottom** stejně jako sidebar (viz 4.3)
- **🎨 Destroyer schematic strip** (signature crown, Q7 B):
  - `::before` pseudo-element nahoře přes celou šířku cardu
  - Asset `destroyer-schematic.webp` (4:1 ratio, 2048×512 master) — wireframe top-down destroyer s **3 červenými X marks** v damage zónách, thin hellfire-red lines na transparent backgroundu
  - Position: `position: absolute; top: -28px; left: 0; right: 0; height: 80px; background-image: var(--asset-destroyer-schematic); background-size: contain; background-position: center top; background-repeat: no-repeat;`
  - Tablet: top: -22px, height: 64px
  - Mobile: top: -16px, height: 48px
  - Filter: `drop-shadow(0 0 12px rgba(184, 16, 28, 0.4))` (subtle hellfire halo)
- **🎨 Battle-plate corner brackety** v rozích cardu (4 rohy, stejně jako sidebar 4.3):
  - Render: 44×44 desktop / 36×36 tablet / 28×28 mobile (welcome card má větší rohy než sidebary)
- **Medailon** vlevo z **`medailon.webp`** (rectangular self-framed tactical display, Ikaros anděl s křídly v krevně-červeném glow vnitř pancéřového rámu s red-LED rimem):
  - `width: 220px; height: 290px;` desktop (rectangular 3:4 ratio — žádný square crop, žádný stretch) / `180px × 235px` tablet / `140px × 185px` mobile
  - Position: vlevo cardu, vertikálně centrováno
  - **Žádný extra wrapper frame** — `medailon.png` už obsahuje vlastní pancéřový rám + nýty + red-LED rim baked-in (asset je self-framed display panel)
  - **`medailon-frame.png` se zde NEPOUŽÍVÁ** — repurposed do ALERT panelu (R1, viz 4.5)
  - Drop-shadow: `filter: drop-shadow(0 0 22px rgba(184, 16, 28, 0.45))` (hellfire halo za displejem, posiluje vnitřní red-LED rim)
  - **Žádná flutter / sway animace** — medailon je *tactical display*, statický (alarm pulse na panelu cardu se přenese skrz)
- **Heading** `Vítej v <span class="em">Projektu Ikaros.</span>`:
  - Wrapper třída: existující `welcomeTitle`
  - Color: `var(--text-pale) #d8d2d0` (popelavá ocel)
  - Font: **Saira Stencil One** 38px desktop / 32px tablet / 26px mobile, letter-spacing 0.06em, line-height 1
  - "Projektu Ikaros." accent: `var(--hellfire-bright) #d4111c`, **text-shadow** `0 0 14px rgba(255, 80, 64, 0.5), 0 2px 0 #000` (plasma glow + carved depth)
- **🎨 Stencil drop-cap "V"** — vesmírná bitva varianta:
  - CSS `.welcomeBody p:first-of-type::first-letter`
  - `font-family: 'Saira Stencil One'`
  - `float: left; font-size: 4.2em; line-height: 0.85; padding: 0.05em 0.10em 0 0;`
  - Color: `var(--hellfire-bright)`
  - Text-shadow multi-stack:
    ```css
    text-shadow:
      0 0 0.04em rgba(0, 0, 0, 1),                    /* outline */
      0 2px 0.06em rgba(0, 0, 0, 0.9),                /* depth */
      0 0 0.25em rgba(184, 16, 28, 0.45),             /* hellfire ambient */
      0 0 0.5em rgba(255, 80, 64, 0.25);              /* plasma halo */
    ```
- **Body paragraphs** — **Inter Tight** regular 400, color `var(--text-pale)`, line-height 1.65, text-align justify
  - `<span class="pi-name">Projekt Ikaros</span>` zvýrazněno: Saira Stencil One, hellfire-bright, 1.1em, text-shadow `0 0 10px rgba(184, 16, 28, 0.4)`
- **Signature** "Příjemnou zábavu přejí administrátoři." — **Special Elite** (damaged typewriter) 22px desktop / 18px mobile, color `var(--ember-burn) #d4202a`, text-shadow `0 0 14px rgba(212, 32, 42, 0.45), 0 1px 0 rgba(0, 0, 0, 0.6)`, letter-spacing 0.03em, text-align center
  - `::before` + `::after` decorative lines: 60px gradient transparent → hellfire-red, margin 14px (jako vyříznuté zápisy v deníku lodi)
- **🎨 Decorative status strip** (Q9 B + Q-17 2026-05-11 — repositioned to HEADER):
  - Po implementaci přesunuto z floating `position: fixed bottom: 12px` (pod welcome cardem) **do hlavičky mezi logo a header buttony** jako flex-fill HUD strip — méně rušivé, líp se integruje do bridge HUD jazyka
  - `<div data-theme-decoration="status-strip">` renderováno v `<header>` po `<Link className={s.logo}>` a před `<HeaderLoggedIn />`
  - CSS: `display: flex; flex: 1 1 0; height: 36px; margin: 0 18px; padding: 0 16px;` — natáhne se mezi logo a pravé buttony
  - Background: `linear-gradient(180deg, rgba(20, 14, 16, 0.85), rgba(8, 4, 6, 0.92))` + 1px gunmetal-edge border + 2px border-radius
  - Box-shadow: inset highlight nahoře + inset shadow dole + inset hellfire rim + outer drop
  - **Vlevo**: `targeting-reticle.webp` 22×22 — koncentrické kruhy s crosshair, animace `reticle-sweep 8s linear infinite` (subtle rotation)
  - **Uprostřed**: text **Saira Stencil One** 12px uppercase letter-spacing 0.5em hellfire-bright — "VŠECHNY SYSTÉMY V POHOTOVOSTI", flex: 1, text-overflow ellipsis
  - **Vpravo**: 2× small hazard chevron (SVG inline triangles, hellfire-red, opacity 0.85) `► ►`
  - **Bottom LED strip** (`::after`) — 1px hellfire-plasma gradient line, `vb-led-pulse 1.4s` animation sync s header alarm pulse
  - **Mobile (≤768px)**: skryté (`display: none`) — v header je málo místa, statický text by zaplnil dostupnou šíři
  - **Žádná typewriter rotace hlášek** — staticky (Q-14 v sekci 9 — možnost rozšíření později)

### 4.5 Sidebar pravý — ADMINISTRACE + MOJE DISKUZE / SVĚTY + ALERT panel (Q-1 A)

**Per project memory `project_admin_panel_decision.md` + Q-1 A (2026-05-11):**

Pravý panel obsahuje **tři sekce** oddělené **heart-monitor dividery**:

1. **ADMINISTRACE** (nahoře) — skin selector + uživatelé (per memory)
2. **MOJE DISKUZE / MOJE SVĚTY** (uprostřed) — defaultní base layout
3. **ALERT panel** (dole) — signature element specifický pro tento skin

- Stejný battle-plate panel pattern jako levý sidebar (4.3) + gunmetal edge + burned edge bottom + battle-plate corner brackety + alarm pulse + spark burst
- **🎨 ADMINISTRACE tag** nahoře (signature element):
  - `<div class="admin-tag">ADMINISTRACE</div>`
  - Background: `linear-gradient(180deg, rgba(70, 10, 16, 0.6), rgba(20, 6, 10, 0.85))` + 1px gunmetal-edge border
  - Text: Saira Stencil One 11px uppercase, letter-spacing 0.5em, `var(--gunmetal-bright)`
  - **Hellfire chevron** ikony po stranách textu (`::before` + `::after`): SVG `►`/`◄`, hellfire-bright color, text-shadow `0 0 6px var(--plasma)`
  - Box-shadow: `0 0 14px rgba(184, 16, 28, 0.2) inset` (subtle hellfire halo)
- **Skin selector** sekce (per temna-cerven Q-2 A pattern):
  - Label "VZHLED (SKIN)" — Saira Stencil One 10px letter-spacing 0.32em, gunmetal-bright color, text-align center
  - **Skin grid 4-column scroll** (`.skin-grid`): aspect-ratio 1:1 swatches, gap 6px, max-height ~200px desktop, `overflow-y: auto` s custom hellfire-red scrollbarem
  - Renderuje **všech 21 skinů** z theme registry
  - Každý swatch: `aspect-ratio: 1/1`, 1px gunmetal-edge border, radial-gradient odpovídající barvám tématu
  - Active swatch (vesmirna-bitva): hellfire-bright border + 0 0 14px hellfire glow + ► překryv uprostřed
  - Hover: `transform: translateY(-1px)` + 0 0 12px gunmetal shadow + tooltip s názvem
  - Klik: aplikuje téma přes `useTheme().setTheme(themeId)`
- **Uživatelé** sekce:
  - Heading "UŽIVATELÉ" — Saira Stencil One 12px letter-spacing 0.4em, gunmetal-bright, hellfire dot decoration
  - **User row** (`.user-row`): flex layout, 1px gunmetal-edge border, padding 8px 10px
  - Avatar: 28×28 round (slightly bevelled), radial-gradient hellfire (bright → deep), 1px gunmetal-edge border, Saira Stencil One 11px iniciála gunmetal-bright
  - Name: Saira Stencil One 11px uppercase letter-spacing 0.2em, text-pale
  - Role badge: Chakra Petch 9px uppercase, padding 2px 6px, hellfire-bright text, 1px hellfire-soft border (SUPER / ADMIN / PJ varianty)
  - **Reálná data** — fetch existing users API (mock pro Storybook story)
- **"SPRAVOVAT VŠE →"** show-all link dole — Saira Stencil One 11px letter-spacing 0.3em, gunmetal-bright, padding 10px, 1px gunmetal-edge border, hover bright + 0 0 16px hellfire glow

#### Pod heart-monitor dividerem — MOJE DISKUZE / MOJE SVĚTY (defaultní base layout)

- **Heart-monitor divider** mezi sekcemi (4.4 + 4.11)
- **MOJE DISKUZE** sekce:
  - Heading: "MOJE DISKUZE" — Saira Stencil One 12px letter-spacing 0.4em, gunmetal-bright, hellfire dot decoration
  - Empty state: "Žádné diskuze" — Inter Tight italic, text-muted
  - "+" CTA — hellfire primary button (`.btn-primary` styling)
- **MOJE SVĚTY** sekce:
  - Heading: "MOJE SVĚTY" — Saira Stencil One 12px letter-spacing 0.4em, gunmetal-bright, hellfire dot decoration
  - World items: row pattern jako uživatelé (1px gunmetal-edge border, padding 8px 10px) + name + PJ badge (hellfire border)
  - "ZOBRAZIT VŠE →" show-all link
  - "+" CTA — hellfire primary button

#### Pod druhým heart-monitor dividerem — ALERT panel (signature element, Q-12 A)

- **Heart-monitor divider** odděluje od MOJE DISKUZE/SVĚTY
- **🎨 ALERT panel container**:
  - `<div class="alert-panel">` s vlastním stylem
  - Background: `linear-gradient(180deg, rgba(70, 10, 16, 0.5), rgba(20, 6, 10, 0.85))` + 1px hellfire-bright border (silnější než ostatní bordery)
  - Box-shadow: `inset 0 0 24px rgba(184, 16, 28, 0.35), 0 0 20px rgba(184, 16, 28, 0.4)` (vnitřní hellfire glow + vnější halo)
  - **Alarm pulse na border + box-shadow** v synchronu s ostatními panely, ale 2× intenzitou (signature emphasis)
**⚠ ALERT panel vyřazen (Q-16, 2026-05-11):** floating ALERT panel s oktagonálním rámem byl po implementaci shledán uživatelem jako **moc rušivý** (pulsoval v dolním pravém rohu napořád, kradl pozornost od hlavního obsahu). Sekce ALERT v pravém sidebaru se odstranila kompletně. `medailon-frame.webp` asset zůstává v `public/themes/vesmirna-bitva/decor/` jako **nepoužitý** (kandidát na repurposing v budoucnu — viz sekce 10 Roadmap).
- **Hlavní text** "ALERT" — Saira Stencil One 18px desktop / 14px mobile, letter-spacing 0.4em, hellfire-bright, text-shadow `0 0 12px var(--plasma)`, text-align center
- **Sub text** "STANICE POD ÚTOKEM" — Saira Stencil One 14px desktop / 11px mobile, letter-spacing 0.35em, gunmetal-bright, text-align center, margin-top 6px
- **Priority badge** "PRIORITA 1" — Chakra Petch 11px letter-spacing 0.4em, hellfire-red, padding 4px 12px, 1px hellfire border, background `rgba(70, 10, 16, 0.7)`, margin-top 10px, text-align center, inline-block
- **Decorative button** "POTVRDIT" (vizuální only, žádná funkce — `aria-disabled="true"` + cursor: not-allowed):
  - Hellfire primary button styling
  - Margin-top 12px
  - **Žádná onClick logika** — pure decoration (sub-text "(decoration / soon)" v title attribute pro accessibility)
  - **Technický dluh:** funkční notifikace (per Q-12 vysvětlení) — viz sekce 10

### 4.6 Novinky panel (dole)

- Materiál: gunmetal panel, **stejný battle-plate styling jako sidebars** (4.3) + gunmetal edge + burned edge bottom + battle-plate corner brackety + alarm pulse + spark burst
- Background: stejný gradient jako sidebars + backdrop-filter: blur(6px) saturate(1.05)
- Border: 1px `var(--gunmetal-edge)`
- **🎨 4 battle-plate corner brackety** — render 32×32 desktop / 28×28 tablet / 22×22 mobile (menší než welcome card)
- **Heading "Novinky"** — **Saira Stencil One** uppercase 18px letter-spacing 0.4em, gunmetal-bright, doprovázený lucide `Newspaper` ikonou s hellfire color
- **Empty state** "Zatím žádné novinky." — Inter Tight italic, text-muted, opacity 0.7
- **"PŘIDAT NOVINKU" tlačítko** — primary hellfire variant (`.btn-primary`):
  - Background: `linear-gradient(180deg, #c8121c, #6e0a14)` (hellfire)
  - Border: 1px `var(--gunmetal-edge)`
  - Text: gunmetal-bright Saira Stencil One uppercase letter-spacing 0.25em
  - Box-shadow inner gunmetal highlight + outer 0 0 24px hellfire glow + deep drop
  - Před textem: lucide `Plus` ikona v gunmetal-bright (žádný custom asset — CSS-only)
  - Hover: brighter hellfire `linear-gradient(180deg, #e8202a, #8a0e1a)` + 0 0 32px brighter glow
  - Klik: scale 0.96 (mikrointerakce 150ms)

### 4.7 Navigační ikony — 7 unikátních console-panel button motivů

Stejný pattern jako temna-cerven + nemrtví (skrýt lucide SVG, render asset přes `data-nav-key` selector + `--asset-icon-*` proměnné):

| Nav-key | Asset | Symbol | Význam |
|---|---|---|---|
| `uvodnik` | `icon-uvodnik.webp` | gunmetal čtvercový button s nýtem v rohu, centrální vyrytý péro/scroll, slabý hellfire backlight | bojový deník velitele |
| `vytvorit-svet` | `icon-vytvorit-svet.webp` | gunmetal button s vyrytou hvězdou-plus (centrální 4-cípá hvězda s plusem), hellfire LED uprostřed | aktivace nové sektoru |
| `diskuze` | `icon-diskuze.webp` | gunmetal button s vyrytou dvojitou comm-bublinou (radio mic vlnami), hellfire backlight | inter-ship comms |
| `clanky` | `icon-clanky.webp` | gunmetal button s vyrytou open-book ikonou (tactical manual), hellfire podsvit | bojové manuály |
| `galerie` | `icon-galerie.webp` | gunmetal button s vyrytým monitor frame se screenshot lines uvnitř, hellfire LED | tactical surveillance feed |
| `napoveda` | `icon-napoveda.webp` | gunmetal button s vyrytým otazníkem v kruhu (info marker), hellfire backlight | nouzové instrukce |
| `hospoda` | `icon-hospoda.webp` | gunmetal button s vyrytou rocky-glass / tumbler ikonou, hellfire backlight | důstojnická jídelna |

Každý button: 96×96 master, gunmetal grey base (`#3a3e44` → `#1a1e24` gradient), 4 micro-rivets v rozích, centrální vyrytý symbol, **slabý hellfire LED backlight** zespoda (hraje s active state).

Velikost render: **32×32 desktop / 28×28 mobile**, **žádný drop-shadow** (asset má vlastní frame)
Active stav (current page): **scale 1.05 + hellfire glow halo** kolem ikony (`filter: drop-shadow(0 0 6px var(--hellfire-bright))`)

### 4.8 Mikrointerakce & animace

| Element | Animace | Délka | Reduced-motion |
|---|---|---|---|
| **🚨 Alarm pulse** (border + box-shadow) | swell `var(--gunmetal-edge)` → `var(--hellfire-bright)` + hellfire glow | 1.4s loop (klaxon) | **vypnuto** (statický stav: minor hellfire hint na borderu) |
| **✨ Spark burst** (corner brackety) | 4 CSS pseudo-elementy `.spark`, opacity 0 → 0.95 → 0 + translate Y +24px + scale 0.4 → 1.2 → 0 | 1.2s burst, random 1 ze 4 rohů každých ~7s | **vypnuto** |
| **❤️ Heart-monitor ECG spike** | SVG `stroke-dasharray` 0 → full → 0 | 3.6s loop, spike ~0.8s | **vypnuto** (statický flatline + spike rendered) |
| **🎯 Reticle sweep** (status strip) | rotate 360deg | 8s linear infinite | vypnuto |
| **🔺 Triangle flash** (ALERT panel) | fill-opacity 0.15 → 0.45 → 0.15 | 1.4s ease-in-out infinite (sync s alarm pulse) | vypnuto |
| Hover NavItem | inset rim + outer hellfire glow fill | 240ms one-shot | vypnuto |
| Active NavItem | bracket [ ] permanent + LED zesílí | static | static (no anim) |
| Hover button (CTA, header) | gunmetal edge bright + hellfire glow | 200ms one-shot | vypnuto |
| Klik tlačítko | translateY 1px (subtle press) | 150ms | zachováno (UX feedback) |
| Active nav icon | scale 1.05 + hellfire halo | static | static |
| Skin swatch hover | translateY -1px + gunmetal shadow | 240ms | vypnuto (zachová přesun bez transform) |
| Background scanline overlay | static (žádný shift) | — | — |
| Background film grain | static | — | — |

**Žádné swing, sway, flutter, candle flicker, ghost-pulse, brass shine sweep, heartbeat, petal drift, blood drip** — to jsou hospoda/nemrtví/temna-cerven signatury. Vesmirna-bitva má **alarm pulse + spark burst + heart-monitor + reticle sweep + triangle flash** jako five-element battle motion language.

### 4.9 Typografie (Q-2 A)

| Role | Font | Důvod |
|---|---|---|
| Logo (header) | Custom stencil banner (baked-in v `logo.png`) | Stencil "PROJEKT IKAROS" s andělem, dodá user |
| Display / heading | **Saira Stencil One** | Autentický vojenský stencil, ostré hrany, ladí s logem |
| Sub-display / nav labels | **Chakra Petch** | Technický mono-flair, ideal pro HUD readouts a status text |
| Body | **Inter Tight** | Čitelnost pro delší texty, stísněnost (tighter než Inter), bez sci-fi sterility |
| Drop-cap "V" | Saira Stencil One | Konzistence s display |
| Signature damaged-typewriter | **Special Elite** | Damaged typewriter font, jako vojenský zápis na poškozeném teletypu — *thematic perfection* |
| `.pi-name` accent | Saira Stencil One | Hellfire zvýraznění "Projekt Ikaros" v body textu |

**Žádný overlap s ostatními skiny:**
- ❌ Orbitron, Rajdhani, Roboto Condensed → vesmirna-lod, sci-fi, default vesmirna-bitva starý
- ✅ Saira Stencil One — neexistuje overlap
- ✅ Chakra Petch — neexistuje overlap
- ✅ Inter Tight — neexistuje overlap (Inter používají jiné skiny, ale Inter Tight je užší cut)
- ✅ Special Elite — neexistuje overlap

Google Fonts URLs nutno přidat do `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Saira+Stencil+One&family=Chakra+Petch:wght@400;500;600;700&family=Inter+Tight:wght@400;500;600;700&family=Special+Elite&display=swap" rel="stylesheet">
```

### 4.10 Theme tokens — rozšíření `index.ts`

Přepsání existujících tokens (z čerň + `#c01818` na hellfire + gunmetal + plasma + ember) + přidání battle-station materiálových tokens + asset URLs:

```typescript
/* ── Background overlay (4-vrstvý gradient) ── */
'--theme-bg-overlay': '<viz 4.1>',

/* ── Scanline overlay pattern ── */
'--theme-scanline-pattern':
  'repeating-linear-gradient(180deg, transparent 0, transparent 3px, rgba(255, 80, 64, 0.02) 3px, rgba(255, 80, 64, 0.02) 4px)',

/* ── Film grain SVG noise ── */
'--theme-grain-pattern': 'url("data:image/svg+xml;utf8,<svg xmlns=...feTurbulence noise...>")',

/* ── Surfaces (battle-plate panely) ── */
'--theme-surface':         'rgba(22, 14, 18, 0.95)',
'--theme-surface-strong':  'rgba(8, 4, 6, 0.97)',
'--theme-surface-soft':    'rgba(28, 18, 22, 0.55)',

/* ── Bulkhead steel (warm undertone — vs vesmirna-lod cool) ── */
'--theme-bulkhead-deep':   '#06030a',
'--theme-bulkhead-mid':    '#0e0408',
'--theme-bulkhead-card':   '#160a10',
'--theme-bulkhead-card-hi':'#1c0e14',

/* ── Hellfire (primární akcent, warm red) ── */
'--theme-hellfire-deep':   '#5a0810',  /* hluboký stín */
'--theme-hellfire':        '#b8101c',  /* primární */
'--theme-hellfire-bright': '#d4111c',  /* hover/active */
'--theme-hellfire-incand': '#e8202a',  /* incandescent, alarm peak */

/* ── Plasma (sekundární highlight, žhnoucí) ── */
'--theme-plasma':          '#ff5040',  /* hot edge */
'--theme-plasma-bright':   '#ff7050',  /* peak */
'--theme-ember-burn':      '#ff5028',  /* burnt edge gradient */

/* ── Gunmetal (kovová neutrální) ── */
'--theme-gunmetal':        '#3a3e44',  /* base */
'--theme-gunmetal-bright': '#a4acb4',  /* highlight */
'--theme-gunmetal-edge':   'rgba(124, 132, 140, 0.32)',
'--theme-gunmetal-shadow': '#1a1c20',

/* ── Text (popelavá ocel, kontrast) ── */
'--theme-text-pale':       '#d8d2d0',
'--theme-text-muted':      '#988a86',
'--theme-text-dim':        '#5a4e4a',
'--theme-heading':         '#d8d2d0',

/* ── Borders ── */
'--theme-border':          'var(--theme-gunmetal-edge)',
'--theme-border-soft':     'rgba(30, 14, 18, 0.5)',
'--theme-border-strong':   '#a4acb4',
'--theme-border-hellfire': 'rgba(184, 16, 28, 0.55)',
'--theme-border-iron':     '#2a0c12',

/* ── Glows & shadows ── */
'--theme-glow-hellfire':        'rgba(184, 16, 28, 0.45)',
'--theme-glow-hellfire-strong': 'rgba(212, 17, 28, 0.7)',
'--theme-glow-plasma':          'rgba(255, 80, 64, 0.55)',
'--theme-shadow':               'rgba(0, 0, 0, 0.85)',
'--theme-inner-shadow':
  'inset 0 1px 0 rgba(180, 190, 200, 0.06), inset 0 -2px 6px rgba(0, 0, 0, 0.7)',

/* ── Nav hover/active ── */
'--theme-nav-hover-bg':    'rgba(184, 16, 28, 0.18)',
'--theme-nav-active-bg':
  'linear-gradient(180deg, rgba(70, 10, 16, 0.7), rgba(28, 8, 12, 0.85))',

/* ── Legacy tokeny (mapped na vesmirna-bitva paletu) ── */
'--bg-primary':       '#06030a',
'--bg-secondary':     '#0e0408',
'--bg-card':          'var(--theme-surface)',
'--bg-card-hover':    'var(--theme-bulkhead-card-hi)',
'--accent':           'var(--theme-hellfire)',
'--accent-bright':    'var(--theme-hellfire-bright)',
'--accent-dim':       'var(--theme-hellfire-deep)',
'--accent-soft':      'rgba(184, 16, 28, 0.18)',
'--text-primary':     'var(--theme-text-pale)',
'--text-secondary':   'var(--theme-text-muted)',
'--text-muted':       'var(--theme-text-dim)',
'--border':           'var(--theme-border)',
'--border-subtle':    'rgba(124, 132, 140, 0.18)',
'--border-strong':    'var(--theme-gunmetal-bright)',
'--success':              '#3ecf8e',
'--success-soft':         'rgba(62, 207, 142, 0.15)',
'--success-soft-border':  'rgba(62, 207, 142, 0.30)',
'--warning':              '#f5a623',
'--warning-soft':         'rgba(245, 166, 35, 0.15)',
'--warning-soft-border':  'rgba(245, 166, 35, 0.30)',
'--danger':               'var(--theme-hellfire-bright)',
'--danger-soft':          'rgba(212, 17, 28, 0.18)',
'--danger-soft-border':   'rgba(212, 17, 28, 0.40)',
'--danger-focus-ring':    'rgba(212, 17, 28, 0.30)',
'--info':                 'var(--theme-gunmetal-bright)',
'--text-on-accent':       '#ffffff',
'--text-on-danger':       '#ffffff',
'--bg-overlay':           'rgba(6, 3, 10, 0.75)',

/* ── Typography ── */
'--font-logo':        'inherit',  /* logo je obrázek, baked-in font */
'--font-display':     '"Saira Stencil One", "Black Ops One", sans-serif',
'--font-sub':         '"Chakra Petch", "Saira", sans-serif',
'--font-body':        '"Inter Tight", "Inter", system-ui, sans-serif',
'--font-script':      '"Special Elite", "Courier Prime", monospace',

/* ── Layout chrome ── */
'--header-h':            '64px',
'--header-bg':           '#0e0408',
'--frame-pad-y':         '40px',
'--frame-pad-x':         '18px',
'--sidebar-w':           '280px',

'--asset-logo-w':         '460px',
'--asset-logo-w-mobile':  '260px',
'--logo-img-display':     'block',
'--logo-fallback-display':'none',

/* ── Asset URLs ── */
'--asset-logo':                 `url('${decor}/logo.webp')`,
'--asset-medailon':             `url('${decor}/medailon.webp')`,        /* rectangular self-framed tactical display */
'--asset-medailon-frame':       `url('${decor}/medailon-frame.webp')`,  /* REPURPOSED → ALERT panel hazard wrapper (R1) */
'--asset-andel-medallion':      `url('${decor}/medailon.webp')`,        /* alias pro layout */

/* Corner ornament (master TL, mirror přes CSS) */
'--asset-corner':               `url('${decor}/corner-tl.webp')`,
'--asset-corner-size':          '44px',   /* welcome card */
'--asset-corner-size-novinky':  '32px',   /* novinky panel */
'--asset-corner-size-side':     '40px',   /* sidebar + right panel */
'--asset-corner-size-mobile':   '28px',   /* všechny na mobile */
'--frame-corner-inset':         '6px',

/* Signature ornaments */
'--asset-destroyer-schematic':  `url('${decor}/destroyer-schematic.webp')`,
'--asset-targeting-reticle':    `url('${decor}/targeting-reticle.webp')`,

/* 7 unikátních console-panel button nav ikon */
'--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
'--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
'--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
'--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
'--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
'--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
'--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,
```

Aktualizace `fonts:` sekce:
```typescript
fonts: {
  logo: 'Saira Stencil One',
  display: 'Saira Stencil One',
  body: 'Inter Tight',
},
```

### 4.11 Signature motion — detail

#### Alarm pulse (klaxon, signature primary)

```css
@keyframes alarm-pulse {
  0%, 100% {
    border-color: var(--theme-gunmetal-edge);
    box-shadow:
      var(--theme-inner-shadow),
      inset 0 0 0 1px rgba(184, 16, 28, 0.15),
      0 22px 50px rgba(0, 0, 0, 0.6);
  }
  50% {
    border-color: var(--theme-hellfire-bright);
    box-shadow:
      var(--theme-inner-shadow),
      inset 0 0 0 1px rgba(255, 80, 64, 0.55),
      0 0 28px var(--theme-glow-hellfire-strong),
      0 22px 50px rgba(0, 0, 0, 0.6);
  }
}

[data-theme="vesmirna-bitva"] .panel,
[data-theme="vesmirna-bitva"] .welcome-card,
[data-theme="vesmirna-bitva"] .novinky {
  animation: alarm-pulse 1.4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  [data-theme="vesmirna-bitva"] .panel,
  [data-theme="vesmirna-bitva"] .welcome-card,
  [data-theme="vesmirna-bitva"] .novinky {
    animation: none;
    border-color: var(--theme-gunmetal-edge);
    box-shadow:
      var(--theme-inner-shadow),
      inset 0 0 0 1px rgba(184, 16, 28, 0.35),  /* statický hint */
      0 22px 50px rgba(0, 0, 0, 0.6);
  }
}
```

#### Spark burst (corner brackets, signature secondary)

```css
@keyframes spark-fly {
  0% { opacity: 0; transform: translate(0, 0) scale(0.4); }
  20% { opacity: 0.95; }
  100% { opacity: 0; transform: translate(var(--spark-x, 12px), 24px) scale(1.2); }
}

[data-theme="vesmirna-bitva"] .panel .spark {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--theme-plasma-bright), var(--theme-ember-burn) 60%, transparent 100%);
  box-shadow: 0 0 4px var(--theme-plasma);
  pointer-events: none;
  opacity: 0;
}

[data-theme="vesmirna-bitva"] .panel .spark.tl { top: 8px; left: 8px; --spark-x: -8px; animation: spark-fly 1.2s ease-out infinite; animation-delay: 0s; }
[data-theme="vesmirna-bitva"] .panel .spark.tr { top: 8px; right: 8px; --spark-x: 8px; animation: spark-fly 1.2s ease-out infinite; animation-delay: 1.8s; }
[data-theme="vesmirna-bitva"] .panel .spark.bl { bottom: 8px; left: 8px; --spark-x: -8px; animation: spark-fly 1.2s ease-out infinite; animation-delay: 3.6s; }
[data-theme="vesmirna-bitva"] .panel .spark.br { bottom: 8px; right: 8px; --spark-x: 8px; animation: spark-fly 1.2s ease-out infinite; animation-delay: 5.4s; }

@media (prefers-reduced-motion: reduce) {
  [data-theme="vesmirna-bitva"] .panel .spark { display: none; }
}
```

Implementace: 4 `<span class="spark tl/tr/bl/br">` injectované do každého `.panel` (sidebar, welcome-card, novinky, right-sidebar). React komponenta `IkarosLayout` přidá tyto spans na renderování panelů — viz 5.3.

#### Heart-monitor divider (SVG inline)

```html
<div class="heart-divider">
  <svg viewBox="0 0 200 24" preserveAspectRatio="none">
    <path d="M0 12 L80 12 L88 12 L92 4 L96 20 L100 8 L104 16 L108 12 L120 12 L200 12"
          stroke="var(--theme-hellfire)" stroke-width="1" fill="none"
          stroke-dasharray="200" stroke-dashoffset="200"
          style="animation: ecg-spike 3.6s ease-in-out infinite;" />
  </svg>
</div>

@keyframes ecg-spike {
  0%, 80%, 100% { stroke-dashoffset: 200; }
  10% { stroke-dashoffset: 0; }
  30% { stroke-dashoffset: 0; opacity: 0.85; }
  50% { opacity: 0.4; }
  70% { stroke-dashoffset: 0; opacity: 0; }
}
```

Reduced-motion: statická flatline s nakresleným spike (`stroke-dashoffset: 0`).

#### Reticle sweep (status strip)

```css
@keyframes reticle-sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

[data-theme="vesmirna-bitva"] .status-strip .reticle {
  animation: reticle-sweep 8s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  [data-theme="vesmirna-bitva"] .status-strip .reticle { animation: none; }
}
```

#### Triangle flash (ALERT panel)

```css
@keyframes triangle-flash {
  0%, 100% { fill-opacity: 0.15; filter: drop-shadow(0 0 8px rgba(255, 80, 64, 0.4)); }
  50% { fill-opacity: 0.45; filter: drop-shadow(0 0 16px rgba(255, 80, 64, 0.7)); }
}

[data-theme="vesmirna-bitva"] .alert-panel .hazard-triangle {
  animation: triangle-flash 1.4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  [data-theme="vesmirna-bitva"] .alert-panel .hazard-triangle { animation: none; fill-opacity: 0.35; }
}
```

### 4.12 Asset list — **13 nových** (11 AI + 2 user) — ✅ všechny dodány

| # | Asset | Účel | Velikost (master) | Source | Final render |
|---|---|---|---|---|---|
| 1 | `logo.png` | Header logo (kombinovaný banner: angel-medallion kruh vlevo + "Projekt Ikaros" stencil banner vpravo) | ~1024×420 (cca 2.4:1) | **✅ User dodal** | h: 60/48/40px |
| 2 | `medailon.png` | Rectangular self-framed tactical display s andělem v krevné-červeném glow | ~768×1024 (3:4 vertical) | **✅ User dodal** | 220×290 desktop |
| 3 | `corner-tl.png` | Battle-plate L bracket s 5 nýty + lava ember + kouř (master TL, mirror přes CSS) | ~1024×1024 | **✅ AI gen** | 44×44 welcome / 32×32 novinky / 40×40 side |
| 4 | `medailon-frame.png` | Oktagonální pancéřový rám s 8 nýty + lava ohni — **REPURPOSED → ALERT panel** (R1) | ~1024×1024 | **✅ AI gen** | 160×160 ALERT desktop / 120×120 mobile |
| 5 | `destroyer-schematic.png` | Top-down wireframe destroyer s 3 X marks | ~2048×512 (4:1) | **✅ AI gen** | h: 80/64/48px nad welcome card |
| 6 | `targeting-reticle.png` | Koncentrické kruhy + crosshair + corner brackety + inner lock-on marks | ~512×512 | **✅ AI gen** | 24×24 status strip |
| 7 | `icon-uvodnik.png` | Console button + carved open-book s quill (kapitánův log) | 1024×1024 | **✅ AI gen** | 32×32 desktop / 28×28 mobile |
| 8 | `icon-vytvorit-svet.png` | Console button + carved 4-point star s plus uvnitř (aktivace sektoru) | 1024×1024 | **✅ AI gen** | 32×32 desktop / 28×28 mobile |
| 9 | `icon-diskuze.png` | Console button + carved double comm-bubble s antennou (inter-ship comms) | 1024×1024 | **✅ AI gen** | 32×32 desktop / 28×28 mobile |
| 10 | `icon-clanky.png` | Console button + carved closed-book s 4-point star emblémem (bojové manuály — sjednoceno s vytvorit-svet emblémem ✨) | 1024×1024 | **✅ AI gen** | 32×32 desktop / 28×28 mobile |
| 11 | `icon-galerie.png` | Console button + carved monitor frame s scan-lines a REC dot (surveillance feed) | 1024×1024 | **✅ AI gen** | 32×32 desktop / 28×28 mobile |
| 12 | `icon-napoveda.png` | Console button + carved otazník v kruhu (nouzové instrukce) | 1024×1024 | **✅ AI gen** | 32×32 desktop / 28×28 mobile |
| 13 | `icon-hospoda.png` | Console button + carved whiskey tumbler s red-glow liquidem (důstojnická jídelna) | 1024×1024 | **✅ AI gen** | 32×32 desktop / 28×28 mobile |

**Audit (2026-05-11):**
- ✅ Všech 7 nav ikon má identický gunmetal frame + 4 nýty + spodní red-LED glow — **maximální stylová konzistence**
- ✅ `icon-clanky` (kniha) a `icon-vytvorit-svet` (star) sdílí 4-cípou hvězdu — *bonus internal visual language*
- ✅ `corner-tl` a `medailon-frame` mají identický lava-ember + kouř signature — sjednocený materiálový jazyk
- ✅ `destroyer-schematic` a `targeting-reticle` jsou ve stejné technical wireframe paletě (#b8101c thin red lines)
- ⚠️ `medailon-frame` přepoužitý do ALERT panelu místo wrapperu okolo medailonu (R1) — medailon.png je self-framed display, frame by kolidoval

**CSS/SVG inline (žádný raster):**
- Heart-monitor divider — SVG inline s `<path>` + `<animate>`
- Hazard triangle (ALERT) — SVG inline `<polygon>` + `<text>` "!"
- Hazard chevron (status strip) — SVG inline `<polygon>`
- Hellfire dot decorations (section titles) — pure CSS `<span class="dot">` radial-gradient
- Burned edge bottom — pure CSS `::before` linear-gradient mask
- Scanline overlay — pure CSS `repeating-linear-gradient`

**Asset pipeline** (existující `npm run themes:optimize` po vzoru temna-cerven):
- PNG masters → WebP `cwebp -q 90 -alpha_q 100` → `public/themes/vesmirna-bitva/decor/*.webp`
- Žádné nové sharp transformace — corner mirror dělá CSS scaleX/Y

Vytvoří se **finalize-vesmirna-bitva-assets.mjs** script (per `scripts/finalize-temna-cerven-assets.mjs` pattern).

### 4.13 Responsivita (desktop / tablet / mobile)

| Breakpoint | Změny |
|---|---|
| **Desktop** (≥1280px) | Plný layout, **medailon 220×290** (rectangular 3:4, self-framed), corner-welcome 44×44, corner-novinky 32×32, corner-side 40×40, destroyer-schematic height 80, status-strip 36px, **ALERT medailon-frame 160×160 s hazard triangle 64×64 uvnitř**, alarm pulse aktivní, spark burst aktivní, heart-monitor ECG animace aktivní |
| **Tablet** (1024–1279px) | **Medailon 180×235**, corner-welcome 36×36, corner-side 32×32, destroyer-schematic 64, status-strip 32px, ALERT frame 140×140 |
| **Tablet narrow** (769–1023px) | NavItem padding zúžen, **medailon 160×210**, corners zmenšeny dále, ADMINISTRACE pravý panel collapse pod hlavní obsah, ALERT frame 130×130 |
| **Mobile** (≤768px) | **Medailon 140×185** (centrováno nad textem, ne vlevo), corner-welcome 28×28, corner-side 24×24, destroyer-schematic 48 (nad cardem, ne kryje text), status-strip 28px (compact), **ALERT frame 120×120 s hazard triangle 48×48**, nav ikony 28×28 |
| **Mobile compact** (≤480px) | Stencil drop-cap zmizí (jen normální `::first-letter` velikosti), spark burst frekvence 2× zpomalena, decor reduced, ALERT frame 100×100 |

### 4.14 Reduced-motion

Per `reducedMotion: 'heavy'` v `index.ts` — všechny pohyblivé animace vypnuté:
- Alarm pulse → statický stav (border + box-shadow stojí v "klidovém" frame)
- Spark burst → `display: none` na všech 4 sparcích
- Heart-monitor ECG → statický flatline + spike rendered (žádný drawing)
- Reticle sweep → static (žádná rotace)
- Triangle flash → static fill-opacity 0.35
- Hover transitions → zachovány (200ms je pod limit pro vestibulární reduced-motion)
- Button click (translateY 1px) → zachován (UX feedback klíčový pro accessibility)

---

## 5. Soubory — change summary

### 5.1 Změnit

| Soubor | Změna | Velikost |
|---|---|---|
| `src/themes/themes/vesmirna-bitva/index.ts` | kompletní přepsání tokens + fonts + asset URLs | ~150 řádků (z ~50) |
| `src/themes/themes/vesmirna-bitva/decorations.css` | kompletní přepsání (battle-plate panely, alarm pulse, spark burst, heart-monitor, ALERT panel, nav console buttons, status strip) | ~750 řádků (z ~22) |
| `index.html` | přidat Google Fonts URLs (Saira Stencil One + Chakra Petch + Inter Tight + Special Elite) | +1 link tag |

### 5.2 Vytvořit

| Soubor | Účel |
|---|---|
| `assets-source/themes/vesmirna-bitva/` (složka) | User-supplied logo.png + medailon.png + 11 AI masters |
| `public/themes/vesmirna-bitva/decor/` (složka) | 13× .webp output po npm run themes:optimize |
| `scripts/finalize-vesmirna-bitva-assets.mjs` | WebP konverze pipeline (per `finalize-temna-cerven-assets.mjs` pattern) |
| `docs/arch/phase-1/prompts-1.0n-vesmirna-bitva-assets.md` | 11 AI gen prompts pro ChatGPT |
| `docs/arch/phase-1/plan-1.0n.md` | Implementační plán (po schválení specu) |

### 5.3 Layout komponenta — minor injection sparků

`src/app/layout/IkarosLayout/IkarosLayout.tsx` — přidat 4 `<span class="spark tl|tr|bl|br" aria-hidden>` do každého `.panel` wrapperu (pro vesmirna-bitva spark burst). Implementace v CSS, ale span musí v DOMu být. Alternativa: pseudo-elementy (`::before` + `::after`), ale ty by potřebovaly 4 různé pozice — proto preferujeme reálné DOM nodes.

**Důležité:** spans jsou globálně injectované (do všech themes), ale stylované jen pro `[data-theme="vesmirna-bitva"]` — v ostatních skinech `display: none`. Žádný JS overhead.

### 5.4 Konflikty / dotyky s globálním kódem

- ✅ Theme tokens v `index.ts` — scoped per téma
- ✅ Decorations v `decorations.css` — scoped přes `[data-theme="vesmirna-bitva"]`
- ✅ index.html font links — global (sdílené přes všechny skiny, žádný impact, jen víc požadavků)
- ⚠️ `IkarosLayout.tsx` spark spans — globální DOM injection. Žádný impact na ostatní skiny (CSS-only — `display: none` v ostatních).

---

## 6. Asset prompty

Detail v `docs/arch/phase-1/prompts-1.0n-vesmirna-bitva-assets.md` (vznikne po schválení specu). Náhled prvního prompt (corner bracket):

> **`corner-tl.png`** — *Battle-damaged steel armor plate corner bracket, top-left orientation. Material: dark gunmetal grey (#3a3e44) with subtle scratched texture, 4 small visible rivets along the inner edges (2 per arm), one arm pointing right, one pointing down forming an L-shape with 45° miter at the bend. The outer corner is burned and warped — orange-red ember gradient (#ff5028 to deep black) bleeds along the outer edges as if recently impacted by plasma fire, with thin wisps of dark smoke trailing upward. A faint red emergency LED light glows from inside the inner corner notch. Photorealistic, isometric front view, transparent PNG, 1024×1024 px, isolated decor element, no background, no text.*

Všech 11 promptů má stejnou strukturu: materiál + signature element (rivets / damage / ember burn / LED) + komposice + technické parametry.

---

## 7. CSS variables — kompletní map

Viz sekce 4.10 (~70 nových tokens). Legacy tokens (`--bg-primary`, `--accent`, atd.) jsou re-mapped na `--theme-*` proměnné pro konzistenci.

---

## 8. Test plán

### 8.1 Vizuální regrese (Playwright snapshots)

- Snapshot `/dashboard` v `vesmirna-bitva` skinu (desktop + mobile)
- Snapshot `/profil`, `/diskuze`, `/clanky` (3 typické stránky)
- **Smoke test ostatních 20 skinů** — žádná regrese, screenshots match baseline

### 8.2 Manuální testing

- Desktop (Chrome, Firefox, Safari):
  - Alarm pulse vizuálně synchronní napříč panely
  - Spark burst nepřekáží obsahu (z-index, pointer-events none)
  - Heart-monitor ECG spike kreslí plynule
  - ALERT panel signature visible, attention-grabbing ale ne overwhelming
  - Hover states fungují (button + nav)
  - Skin selector v ADMINISTRACE přepíná na ostatní themes
- Mobile (≤480px):
  - Layout neláme, hamburger menu funguje
  - Destroyer schematic nepřekrývá welcome heading
  - Status strip čitelný (text se nezarovnává mimo)
  - ALERT panel kompaktní ale zřetelný
- Tablet (769–1023px):
  - Pravý panel collapse pod hlavní obsah
  - Layout přechod plynulý

### 8.3 Accessibility

- `prefers-reduced-motion: reduce` — všechny animace vypnuté, jen click feedback zachován
- Color contrast: WCAG AA pro text vs background (`#d8d2d0` na `#06030a` = 12.4:1 ✅, `#d4111c` na `#06030a` = 4.8:1 ✅)
- Focus rings: hellfire-bright border + 2px offset (per existing theme pattern)
- ARIA labels na decorative elements (spark, hazard triangle, reticle) = `aria-hidden="true"`
- ALERT panel "POTVRDIT" button má `aria-disabled="true"` + `tabindex="-1"` + tooltip "Dekorativní — funkční notifikace budou implementovány později"

### 8.4 Performance

- Bundle size impact: nový skin ~+8KB CSS (gzipped ~2KB) + 13 WebP assetů ~150–250KB total
- Lazy load decorations.css (per existing dynamic import pattern) — žádný impact na initial bundle ostatních skinů
- Animation FPS: alarm-pulse + spark burst + heart-monitor ECG simultánně — měřit na low-end mobile, target 60 FPS

---

## 9. Otevřené otázky

| # | Otázka | Status | Návrh |
|---|---|---|---|
| Q-1 | Pravý panel obsah | ✅ A (ADMINISTRACE + DISKUZE/SVĚTY + ALERT) | — |
| Q-2 | Typografie | ✅ A (Saira Stencil + Chakra Petch + Inter Tight) | — |
| Q-3 | Paleta červené | ✅ D (Hellfire `#b8101c` + Plasma `#ff5040`) | — |
| Q-4 | Signature motion | ✅ A (Alarm pulse) + Spark burst | — |
| Q-5 | Damage gimmick | ✅ D (Burned edge borders, no cracks) | — |
| Q-6 | Bracket + divider | ✅ C + i (Battle-plate s nýty + Heart-monitor) | — |
| Q-7 | Welcome crown | ✅ B (Destroyer schematic strip) | — |
| Q-8 | Medailon frame | ✅ C (Pancéřový s nýty + glow rim) | — |
| Q-9 | Status bar | ✅ B (Decorative strip pod welcome cardem, ne fixed) | — |
| Q-10 | Nav ikony | ✅ A (Console panel buttons s nýty) | — |
| Q-11 | Signature script | ✅ C (Special Elite damaged typewriter) | — |
| Q-12 | ALERT panel | ✅ A (Statický dekorativní) | Funkční notifikace = dluh |
| Q-13 | Asset scope | ✅ B (11 AI + 2 user) | — |
| Q-14 | Status strip typewriter rotace hlášek | OTEVŘENO | Předpoklad: **statický text "VŠECHNY SYSTÉMY V POHOTOVOSTI"** v této iteraci. Pokud bys chtěl rotaci, snadný patch po implementaci (cca +20 LOC). |
| Q-15 | Co s `medailon-frame.png` po zjištění že `medailon.png` je self-framed | ✅ R1 (2026-05-11) → ZRUŠENO (Q-16) | medailon-frame.png byl repurposed do ALERT panelu, ale ALERT byl po implementaci vyřazen jako rušivý. Asset nyní **nepoužitý** — kandidát na repurposing později (např. avatar frame v ADMINISTRACE, command crest, nebo decorative emblém v Settings page). |
| Q-16 | ALERT panel po implementaci shledán jako rušivý — vyřadit? | ✅ ANO (2026-05-11) | Floating ALERT panel kompletně odstraněn z `IkarosLayout.tsx` (JSX block) i `decorations.css` (sekce 11 + media queries + keyframes `vb-alarm-pulse-strong` + `vb-triangle-flash`). Skin si zachoval všech 5 ostatních signature elementů. |
| Q-17 | Status strip (VŠECHNY SYSTÉMY V POHOTOVOSTI) přesunout z dolního okraje do hlavičky | ✅ ANO (2026-05-11) | Přesunuto z `position: fixed bottom: 12px` do `<header>` jako flex-fill HUD strip mezi logem a `HeaderLoggedIn` buttony. Lépe integrované, méně rušivé, vizuálně součást bridge HUDu místo plovoucí dekorace. |

---

## 10. Roadmap / následně

### 10.1 Po implementaci 1.0n

- **Aktualizovat `docs/themes/vesmirna-bitva.md`** s finální vizí (po implementaci)
- **Zaškrtnout v `docs/roadmap-fe.md`** položku "11/21 skinů s asset-grade upgrade"
- **Storybook story** pro vesmirna-bitva (per existing pattern)

### 10.2 Technický dluh (skill `dluh`)

- **Funkční notifikace** (Q-12) — ALERT panel je v této iteraci statický dekorativní. Až přijde spec na notifikační infrastrukturu (aggregator endpoint nebo dedicated BE feed), ALERT panel se připojí na real-time data bez nutnosti měnit skin (jen prop drilling do `<AlertPanel data={notifications}>`).
- **Status strip typewriter rotace** (Q-14) — pokud po implementaci budeš chtít rotující hlášky ("WARP-DRIVE: NOMINAL", "ŠTÍTY: 78%", atd.), je to ~+20 LOC patch v `decorations.css` + `IkarosLayout.tsx` (CSS-only animation cyklující content přes `::after` content + keyframes).

### 10.3 Budoucí audit (po dokončení Fáze 1)

- Stejně jako [`audit-1.0i-pergamen.md`](audit-1.0i-pergamen.md) a [`audit-1.0h-priroda.md`](audit-1.0h-priroda.md) — po implementaci provést audit, zda skin opravdu dodává *brutální nebezpečný vibe* a beznaděj, případně iterace na assetech.

---

## 11. Souhrn

**Vesmírná bitva** = **11. tier-1 skin** s vlastním vizuálním slovníkem:
- **Materiál:** gunmetal + hellfire-red + plasma-orange + burned ember edges + lava ohni
- **Signature motion:** alarm pulse (1.4s klaxon) + spark burst (random corner) + heart-monitor ECG + reticle sweep + triangle flash
- **Signature ornaments:** battle-plate L corner brackety s nýty a lava emberem (z `corner-tl.webp` mirrored 4×) + destroyer wireframe schematic strip nad welcome cardem + targeting reticle v status stripu + 7 console-panel button nav ikon
- **Signature display:** rectangular self-framed tactical display medailon (anděl v krevně-červeném glow v pancéřovém rámu s red-LED rimem)
- **Signature panel:** ALERT ("STANICE POD ÚTOKEM / PRIORITA 1") jako 3. sekce pravého sidebaru, s velkým oktagonálním pancéřovým rámem (`medailon-frame.webp`) okolo hazard triangle (R1)
- **Typografie:** Saira Stencil One (display) + Chakra Petch (sub) + Inter Tight (body) + Special Elite (damaged typewriter signature)
- **Atmosféra:** *brutální, nebezpečný, beznadějný* — můstek bitevního křižníku v akutním boji
- **Asset count:** 11 AI gen + 2 user-supplied = 13 nových masters ✅ všechny dodány 2026-05-11
- **Diferenciace:** zásadně odlišený od `vesmirna-lod` (clean hangar cyan/amber), `sci-fi` (clean glass cyan/magenta), `zlatý-standard` (royal black/gold), `temna-cerven` (Victorian baroque red/silver) — nikdo nemá kovový pancéřovaný battle-station-under-attack aesthetic

---

**Příští krok:** Schválení specu → vytvoření `prompts-1.0n-vesmirna-bitva-assets.md` (11 AI promptů) + `plan-1.0n.md` (implementační plán s file-by-file changes) → schválení plánu → kód.
