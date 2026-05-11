# Spec 1.0l — Temná červeň visual upgrade

**Status:** ✅ Implementováno (2026-05-10)
**Datum:** 2026-05-10
**Rozsah:** FE skin upgrade — `[data-theme="temna-cerven"]` izolace, žádný globální dopad
**Repo:** `Projekt-ikaros-FE`, větev `feat/krok-1.0l-temna-cerven-upgrade`
**Velikost:** odhad ~3 soubory změna (`index.ts`, `decorations.css`, `public/themes/temna-cerven/`) + 12 nových assetů (10 AI + 2 user)
**Autor:** PJ + Claude
**Souvisí:** [spec-1.0k-nemrtvi-upgrade.md](spec-1.0k-nemrtvi-upgrade.md) (asset pipeline + corner-ornament + skull-arch pattern), [spec-1.0i-pergamen-upgrade.md](spec-1.0i-pergamen-upgrade.md), [spec-1.0j-hospoda-upgrade.md](spec-1.0j-hospoda-upgrade.md), [spec-1.0b-theme-visuals.md](spec-1.0b-theme-visuals.md)

**Reference:**
- `assets-source/themes/references/temna-cerven.png` — původní reference (gotická katedrála) — **NESLEDUJEME doslovně** (per user request "nemá vypadat jako reference image")
- `assets-source/themes/backgrounds/temna-cerven.png` (a `public/themes/backgrounds/temna-cerven.webp`) — background image, **neměníme** (skin overlay přepíše dostatečně)
- `assets-source/themes/temna-cerven/logo.png` — finální logo s drippy blackletter "Projekt Ikaros" v iron-cross frame (dodal user) ✅
- `assets-source/themes/temna-cerven/medailon.png` — Ikaros bird v iron-cross frame s krevním glow (dodal user) ✅
- `docs/arch/phase-1/prompts-1.0l-temna-cerven-assets.md` — asset prompty (10× AI gen, hotovo) ✅
- `c:\tmp\temna-cerven-mockup.html` — pracovní mockup s reálnými assety, design audit + legendou

---

## 0. Princip — soukromý salón nesmrtelného šlechtice (upír-sběratel)

> **Salón upíra-aristokrata, který za 800 let nasbíral artefakty z různých epoch.** Tady spolu sedí křižácké železo (rám medailonu, rohy hero karty), baroque tarnishované stříbro (filigrée, tufting, name plates), viktoriánský jet-bead smutek (rámeček medailonu) a granátové cabochony (krev jako klenot). Nálada: opera box / privátní salón, krev jako KLENOT (ne gore), heartbeat tep srdce upíra, padající okvětní lístky růží, kapky krve odkapávající. **Skin musí *svádět ke smrti* — pomalu, dekadenčně, smrtelně klidně.**

**Inspirační kotvy:** Bram Stoker's Dracula (1992 Coppola) × Interview with the Vampire / Lestat de Lioncourt × Castlevania: Symphony of the Night UI × Diablo IV Sanctuary kovaná řemeslná kvalita × Albrecht Dürer engravingy × viktoriánská **mourning jewelry** (jet beads, lakovaná čerň).

**NE** Halloween dekorace. **NE** cartoon vampires. **NE** crystal-clear skull party props. **NE** neon red. **NE** rose-petal-kitsch (kýčové). **NE** ossuary lebky / kosti / femury (to je `nemrtvi`). **NE** gold/brass dominantní (to je `zlatý standard` / `hospoda`). **NE** pergamen / dřevo (to je `pergamen` / `hospoda`). **NE** teal/green (to je `nemrtvi`). **NE** jump-scare horror. **NE** gotická katedrála jako primární prostor (vůči reference image — máme privátní salón).

**Strict isolation:** vše scoped přes `[data-theme="temna-cerven"]`. Zbylých 20 témat = nulová regrese. (Memory rule: žádné sdílení / recyklace ornamentů s pergamen, hospoda, nemrtvi ani jinými skiny — Temná červeň má vlastní vizuální slovník.)

---

## 1. Cíl

Po `themeId === 'temna-cerven'` má dashboard vypadat jako **soukromý sametový salón upíra-aristokrata**: bordeaux-čerň pozadí s damaškovým tapetem, hero karta jako čalouněný oltář s **bat-arch korunou** (9 letících netopýrů) nahoře, **iron-cross-baroque-silver corner ornaments** v rozích, **medailon vlevo v jet-bead viktoriánském smutečním rámu**, **wax-seal s otisky tesáků** visící z levého spodního rohu hero karty, **bone drop-cap "V"** v UnifrakturCook stylu (v Pirata One, ne UnifrakturCook — viz typografie), **fold-line** uprostřed karty (jako složený dopis), **heartbeat pulse** (jeden tep každých ~6.4s), padající **růžové okvětní lístky** (5 staggered, 28–40s), občasná **kapající krev** pod panely. Pravý panel = **ADMINISTRACE** (skin selector + uživatelé) místo defaultního "MOJE DISKUZE / MOJE SVĚTY". Vše izolované, bez dopadu na ostatní skiny.

---

## 2. Kontext / motivace

- Pergamen (1.0i), Hospoda (1.0j) a Nemrtví (1.0k) zavedly asset pipeline + corner-ornament pattern + skull-arch crown pattern. **Temná červeň je 9. ve "tier-1 produkční kvalitě"** — vampire-aristocrat-collector aesthetic jako vizuální opozit nemrtvi (cold ossuary dread) i pergamenu (warm scholarly clean).
- Současný [`decorations.css`](../../../src/themes/themes/temna-cerven/decorations.css) má jen ~22 řádků základu (background tint + card border + hover glow). Skin viditelně neodlišený — vypadá jako varianta default tématu.
- Současný [`index.ts`](../../../src/themes/themes/temna-cerven/index.ts) má základní tokens (gardient bordó-čerň + bright red accent + Lora body), ale **chybí asset URLs**, **chybí materiálové tokens** (silver, jet, velvet, garnet) a typografie (Marcellus SC, IM Fell English) je zastaralá oproti odsouhlasené typografii v mockupu (Pirata One + Cormorant Garamond + Italianno).
- User chce, aby Temná červeň byla **vizuálně dramatická a smrtelně svádivá** — vampire seduction aesthetic, krev jako klenot, žádný horror-cheese.
- Dříve existující `docs/themes/temna-cerven.md` popisuje jednostranný "gotická katedrála + fleur-de-lis" náčrt, který **má být přepsán** podle nového konceptu syntézy materiálů.
- Po dokončení bude **9 skinů** s "asset-grade" upgradem (zlatý standard, sci-fi, bílá, modré nebe, vesmírná loď, příroda, pergamen, hospoda, nemrtví, temná červeň) → projekt blíže dokončené Fázi 1.

---

## 3. Audit současného stavu

### 3.1 Theme registry & tokens
- [`src/themes/themes/temna-cerven/index.ts`](../../../src/themes/themes/temna-cerven/index.ts) — existuje, definuje základní paletu (bordó-čerň, bright red `#bd0016`, fonty MedievalSharp + IM Fell English + Lora), thumbnail a background, `reducedMotion: 'heavy'`. **Nutné kompletní přepsání palety + fontů + tokens** podle Q&A rozhodnutí (granát #7e0a1e + tarnishované stříbro #a89890 + jet #08020a + velvet #3a0810 + Pirata One + Cormorant Garamond + Italianno).
- Asset URL proměnné chybí — nutné přidat při zavedení assetů.

### 3.2 Decorations
- [`src/themes/themes/temna-cerven/decorations.css`](../../../src/themes/themes/temna-cerven/decorations.css) — 22 řádků, jen background gradient + 3px card border-radius + hover glow. **Žádné panely, žádné NavItem styly, žádné dekorace, žádné mikrointerakce.** Skin viditelně nedokončený.

### 3.3 Asset folder
- `assets-source/themes/temna-cerven/` — ✅ existuje s 14 soubory: `logo.png` + `medailon.png` (user-supplied) + 12 AI assetů (`corner-tl.png`, `wax-seal.png`, `jet-bead-frame.png`, `bat-arch.png`, `divider-rose.png`, 7× `icon-*.png`)
- `assets-source/themes/backgrounds/temna-cerven.png` — ✅ existuje (gotická katedrála s rozetovým oknem, červeným ambientem)
- `public/themes/backgrounds/temna-cerven.webp` — ✅ existuje (build pipeline output, **neměníme**)
- `public/themes/temna-cerven/decor/` — neexistuje (nutno vytvořit při WebP konverzi)

### 3.4 Předchozí stručný design doc
- [`docs/themes/temna-cerven.md`](../../themes/temna-cerven.md) — staří vize "gotická katedrála + fleur-de-lis nahrazuje všechny ikony" (čeká k auditu/přepisu po implementaci podle nové syntézy).

### 3.5 Pergamen + Hospoda + Nemrtví jako pattern předlohy
- [`src/themes/themes/pergamen/decorations.css`](../../../src/themes/themes/pergamen/decorations.css) — 743 řádků, struktura sekcí 1–23
- [`src/themes/themes/hospoda/decorations.css`](../../../src/themes/themes/hospoda/decorations.css) — stejná struktura, jiná paleta/materiály
- [`src/themes/themes/nemrtvi/decorations.css`](../../../src/themes/themes/nemrtvi/decorations.css) — implementace per spec 1.0k (~700 řádků, blackened iron + bone + ghost-pulse)
- **Temná červeň použije stejnou strukturu sekcí**, ale s vlastní materiálovou a ornamentální paletou (iron + baroque silver + jet + crimson velvet + garnet + heartbeat).

### 3.6 ADMINISTRACE pravý panel — odchylka od base layoutu
- Per project memory `project_admin_panel_decision.md`: **uživatelé + skin selector zůstávají v ADMINISTRACE (pravý panel)**, odchylka od mockupů ostatních skinů
- Default base layout pravého panelu má "MOJE DISKUZE" + "MOJE SVĚTY" — **temna-cerven mockup explicitně přepisuje** na ADMINISTRACE: skin selector (4 swatche) + UŽIVATELÉ (3+ řádky s rolí).
- **Otevřená otázka:** vyrenderovat oboje (ADMINISTRACE NAHOŘE + původní MOJE DISKUZE/SVĚTY POD), nebo ADMINISTRACE pouze? Předpoklad pro draft: **ADMINISTRACE pouze**, pokud user nechce jinak (Q-1 v sekci 9).

---

## 4. Návrh řešení

### 4.1 Background & atmosféra

- **Background image** — `/themes/backgrounds/temna-cerven.webp` (✅ existuje, gotická katedrála s rozetovým oknem, **neměníme**)
- **Atmosférický overlay** — multi-vrstvý kombinovaný gradient + damask wallpaper + film grain:
  ```css
  --theme-bg-overlay:
    /* horní chandelier glow */
    radial-gradient(ellipse 600px 220px at 50% 0%, rgba(191, 31, 58, 0.16), transparent 70%),
    /* spodní oltářní červeň */
    radial-gradient(ellipse 1200px 500px at 50% 100%, rgba(74, 6, 18, 0.55), transparent 70%),
    /* vinyl-ish vignette pro kinematický feel */
    radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, rgba(0, 0, 0, 0.7) 100%),
    /* damaškový tapet (SVG inline) */
    var(--theme-damask-pattern),
    var(--bg-primary);
  ```
- **🎨 Damask wallpaper** (signature pattern):
  - SVG inline pattern jako `data:image/svg+xml` URL
  - 80×120 tile, opacity 0.32, stroke crimson `#7e0a1e`
  - Aplikováno přes `background-image` na body i panely (multiply blend)
- **🎨 Film grain overlay** (analogová textur):
  - `body::before` pseudo-element, position fixed, inset 0
  - SVG `feTurbulence` noise filter, opacity 0.35, mix-blend-mode overlay
  - z-index 1000 (nad obsahem ale neblokuje pointer events)
- **🎨 Heartbeat tep srdce upíra** (signature animation):
  - Aplikováno na `welcome card` (hero) — jeden lub-DUB pulse cyklus 6.4s
  - Box-shadow swell na 8% (lub) + 14% (dub) keyframe markech
  - Žádný scale/translate (panel se nehýbe, jen "tepe"))
  - **Reduced-motion vypíná** (sekce 4.13)
- **🎨 Padající okvětní lístky růží** (slow drift):
  - 5 CSS pseudo-elementů (`.petal:nth-child(1..5)`) v `body > .petals`
  - Každý lístek: 10×14px ellipse s radial-gradient (#bf1f3a → #4a0612), border-radius asymetrický pro tvar petal
  - `animation: drift linear infinite;` 28–40s, staggered start delay (-3s, -10s, -18s, -7s, -22s)
  - Drift trajektorie: top -20px → bottom 110vh, translate X +70px, rotate 540°
  - opacity 0 → 0.6 → 0 (fade in, stable, fade out)
  - `pointer-events: none; z-index: 999;`
  - **Reduced-motion vypíná**
- **🎨 Blood drip pod panely** (occasional drop):
  - `.drip` pseudo-element na `welcome card`, `news panel`, `sidebars` (4 panely celkem)
  - Pozice: `bottom: -8px; left: 50%; transform: translateX(-50%);`
  - 6×14px droplet shape (radial-gradient #bf1f3a → #4a0612, asymetrický border-radius)
  - `animation: drip 5s ease-in infinite;`
  - Opacity timing: 0% (idle) → 70% (kapka se objeví) → 95% (spadla, scaleY 1.6, translateY 16px)
  - **Reduced-motion vypíná** (`display: none`)

### 4.2 Topbar (slim, 56–72px) — solidní zčernalý kov s tuftingem

- Pozadí: tmavý gradient bez transparency, krevní undertone:
  ```css
  background: linear-gradient(180deg, rgba(35, 12, 18, 0.8), rgba(15, 5, 9, 0.92));
  ```
- **Žádný backdrop-filter** (heavy iron page-chrome)
- **Border**: 1px tarnished silver `var(--silver-tarnish)` `rgba(168, 152, 144, 0.28)`
- **Box-shadow inner**: `inset 0 1px 0 rgba(212, 200, 190, 0.06)` (subtle highlight nahoře) + `inset 0 0 0 1px rgba(126, 10, 30, 0.18)` (krevní rim)
- **Box-shadow outer**: `0 14px 30px rgba(0, 0, 0, 0.55)` (deep gravitas)
- **🎨 Tufting buttons** na koncích topbaru (signature element):
  - `.topbar::before` (left: 8px) + `.topbar::after` (right: 8px)
  - 6×6px radial-gradient silver (silver-bright → silver-shadow)
  - `box-shadow: 0 0 0 1px rgba(0,0,0,.6), 0 0 4px rgba(212,200,190,.3)` (lesklý chromový knoflík)
- Logo vlevo z **`logo.png`** (drippy blackletter "Projekt Ikaros" baked-in horizontal banner): šíře auto, výška `--asset-logo-h: 56px` desktop / `46px` tablet / `38px` mobile
  - filter: `drop-shadow(0 0 14px rgba(191, 31, 58, .45))` — krevní glow
- Pravé tlačítka (POŠTA, UŽIVATELÉ, ZLATÝ STANDARD, TYKY, ODHLÁSIT) = **stříbrné name-plates**:
  - Background: `linear-gradient(180deg, #1d0911, #100509)` (tmavé bordeaux)
  - Border: 1px `var(--silver-tarnish)` (rgba 0.28)
  - Box-shadow: vnitřní silver highlight nahoře + černý hairline dole + outer drop
  - Text: `var(--text-pale) #e8d6cc` uppercase **Pirata One** 12px, letter-spacing 0.25em
  - **Thin silver bracket pod textem** (`.btn::after`) — 1px gradient line `transparent → silver-tarnish → transparent`, opacity 0.35 (jako rytá tabulka jména na opera-boxu)
  - Hover: text → `var(--silver-bright)`, border bright silver, **0 0 18px granátový glow** outer + 1px granátový rim inner
  - Active state: `translateY(1px)` (subtle press)
- **Mobile (≤768px)**: ikony only, label hidden přes `aria-label`
- **Mobile (≤480px)**: TYKY + ODHLÁSIT do hamburger drawer (existující pattern)

### 4.3 Sidebar levý — NAVIGACE / VESMÍRY / CHAT (a HOSPODA tlačítko)

- Frame: tmavá kamenná deska s **tarnished silver edge** + **damask wallpaper** uvnitř:
  ```css
  background:
    linear-gradient(180deg, rgba(28, 8, 14, 0.92), rgba(14, 5, 9, 0.95)),
    var(--theme-damask-pattern);
  background-size: auto, 60px 90px;
  background-blend-mode: normal, multiply;
  border: 1px solid var(--silver-tarnish);
  box-shadow:
    inset 0 1px 0 rgba(212, 200, 190, 0.08),
    inset 0 -2px 6px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(126, 10, 30, 0.55) inset,
    0 22px 50px rgba(0, 0, 0, 0.55);
  ```
- **🎨 Tufting buttons (4 rohy)** — signature čalouněný styling (panel jako sametové křeslo):
  - `.panel::before` (top-left), `.panel::after` (top-right), `.panel > .tuft-1` (bottom-left), `.panel > .tuft-2` (bottom-right)
  - 7×7px radial silver (silver-bright → silver-shadow), `box-shadow: 0 0 0 1px rgba(0,0,0,.7), 0 0 0 3px rgba(126,10,30,.3), inset 0 -1px 1px rgba(0,0,0,.6)` (lesklý knoflík se sametovým halo)
- **🎨 Drip** pod panelem — `.panel > .drip` (viz 4.1)
- **Section titles** ("NAVIGACE", "VESMÍRY", "CHAT") — **Pirata One** uppercase 12px, letter-spacing 0.4em, color `var(--silver-tarnish)`, text-align center
  - **Garnet cabochon decorations** kolem titulu — `h3::before/::after` (1px silver-tarnish gradient lines + `<span class="gem">` 7×7px radial garnet uprostřed)
- **🎨 Divider-rose** mezi sekcemi — `divider-rose.png` (stonek-růže asset), opacity 0.95, height 28px desktop / 24px tablet / 20px mobile, scaled `width: 100%`
- **NavItem** (každá položka):
  - Klid: `linear-gradient(180deg, rgba(35,12,18,0.55), rgba(14,5,9,0.55))` + 1px transparent border, **Pirata One** 12px letter-spacing 0.25em
  - Hover: text → `silver-bright`, border-color → `silver-tarnish`, **inset 1px granátový rim + 0 0 16px granátový glow**
  - Active: text → `silver-bright`, background krevní gradient `rgba(74,6,18,.7) → rgba(30,6,12,.85)`, **silver-tarnish bracket [ ]** kolem položky (`.nav a.active::before` + `::after` — 6×14px borders L/R), nav ikona svítí granátově (`filter: drop-shadow(0 0 4px var(--garnet-incand))`)
  - **Žádný shine sweep / candle flicker** (to jsou hospoda/nemrtví signatury) — temna-cerven má **heartbeat tep** jako primární motion
  - Před textem: unikátní ikona (1 ze 7, viz 4.7) — render přes `data-nav-key` selector + `--asset-icon-*` proměnné

### 4.4 Welcome card — čalouněný oltář s bat-arch korunou (signature centerpiece)

- **Min-height** `clamp(420px, 60vh, 720px)` (stejně jako pergamen/hospoda/nemrtvi)
- **Materiál**: tmavá kamenná deska s damask + glassmorphism:
  ```css
  background:
    linear-gradient(180deg, rgba(28, 9, 15, 0.94), rgba(14, 5, 9, 0.96)),
    var(--theme-damask-pattern);
  background-size: auto, 80px 120px;
  background-blend-mode: normal, multiply;
  backdrop-filter: blur(8px) saturate(1.05);
  ```
- **Border**: 1px `var(--silver-tarnish)`
- **Box-shadow**: `var(--inner-shadow)` (silver highlight + inner deep) + `0 0 0 1px var(--border-garnet) inset` + `0 28px 70px rgba(0,0,0,0.6)` (deep gravitas)
- **🎨 Heartbeat animation** (signature): `animation: heartbeat 6.4s ease-in-out infinite;`
  - Keyframes: 0%/18%/100% klid, 8% lub-pulse (granátový rim 0.7 + 28px granet glow), 14% dub-pulse (silver rim 0.4 + 22px subtle glow)
- **🎨 Bat-arch crown** (signature element, analog skull-arch nemrtví):
  - `::before` pseudo-element nahoře přes celou šířku cardu
  - Asset `bat-arch.webp` (4:1 ratio, 9 letících netopýrů, centrální větší se žhnoucíma očima)
  - Position: `position: absolute; top: -32px; left: 0; right: 0; height: 96px; background-image: var(--asset-bat-arch); background-size: contain; background-position: center top; background-repeat: no-repeat;`
  - Tablet: top: -24px, height: 72px
  - Mobile: top: -16px, height: 56px
  - **Bottom otevřeno** (žádný mirror dolů — dramatický vstup do salónu)
- **🎨 Iron-cross-baroque-silver corner ornaments** v rozích cardu (4 rohy):
  - `<svg class="corner tl/tr/bl/br">` SVG s `<use href="#ironcross">` symbol nebo `<img src="corner-tl.webp">` master + CSS scaleX/Y mirror
  - Master `corner-tl.webp` (~1024×1024), CSS scaleX/Y mirror na ostatní 3
  - Rozměr render: 36×36 desktop / 32×32 tablet / 24×24 mobile (corner-anchored s -8px offset pro vystouplý look)
  - **Filter**: `drop-shadow(0 1px 0 #000) drop-shadow(0 0 6px rgba(168,19,46,.35))` (granátový halo)
- **🎨 Fold-line uprostřed cardu** (signature element — jako složený dopis):
  - `::before` pseudo-element přes celou výšku cardu uprostřed
  - 1px gradient line (silver-tarnish opacity 0.18 + black opacity 0.5) — vypadá jako záhyb papíru
  - `top: 18px; bottom: 18px;` (nedotahuje k okrajům)
- **🎨 Wax seal s otisky tesáků** visící z levého spodního rohu cardu:
  - `<div class="seal">` umístěn `position: absolute; bottom: -18px; left: 36px; transform: rotate(-8deg);`
  - 64×64px round, asset `wax-seal.webp` background-image (preferred) NEBO CSS-only fallback (radial-gradient + ::after symbol + ::before fang-bite punctures)
  - Box-shadow: 0 6px 16px rgba(0,0,0,.7) (visí v prostoru)
- **Medailon** vlevo z **`medailon.png`** (Ikaros bird v iron-cross frame s krevním glow):
  - `width: 220px; height: 220px;` desktop / `180px × 180px` tablet / `140px × 140px` mobile
  - Position: vlevo cardu, vertikálně centrováno
  - Wrapper `.portrait` s **`jet-bead-frame.webp`** jako outer mourning frame:
    - `.portrait::before` pseudo-element s asset jako background, mask radial-gradient (čtvercový rám, transparent center)
    - Inset -18px okolo medailonu (jet-bead frame visí kolem)
  - Drop-shadow: `filter: drop-shadow(0 0 22px rgba(168, 19, 46, .45))` (granátový halo)
  - **Žádná flutter / sway animace** — medailon je *jet-bead relikvie*, statika
- **Heading** `Vítej v <span class="em">Projektu Ikaros.</span>`:
  - Wrapper třída: existující `welcomeTitle`
  - Color: `var(--text-pale) #e8d6cc` (porcelánová pleť)
  - Font: **Pirata One** 38px desktop / 32px tablet / 26px mobile, letter-spacing 0.05em, line-height 1
  - "Projektu Ikaros." accent: `var(--garnet-bright) #a8132e`, **text-shadow** `0 0 14px rgba(168,19,46,.5), 0 2px 0 #000` (krevní glow + carved depth)
- **🎨 Bone drop-cap "V"** — *vampire-aristokrat varianta*:
  - CSS `.welcomeBody p:first-of-type::first-letter`
  - `font-family: 'Pirata One'` (synchronní s display fontem)
  - `float: left; font-size: 4.2em; line-height: 0.85; padding: 0.05em 0.10em 0 0;`
  - Color: `var(--garnet-bright)` granátový
  - Text-shadow multi-stack:
    ```css
    text-shadow:
      0 0 0.04em rgba(0, 0, 0, 1),                    /* outline */
      0 2px 0.06em rgba(0, 0, 0, 0.9),                /* depth */
      0 0 0.25em rgba(168, 19, 46, 0.35),             /* garnet ambient */
      0 0 0.5em rgba(74, 6, 18, 0.25);                /* deep blood halo */
    ```
- **Body paragraphs** — **Cormorant Garamond** italic-prone, color `var(--text-pale)`, line-height 1.65, text-align justify
  - `<span class="pi-name">Projekt Ikaros</span>` zvýrazněno: Pirata One, garnet-bright, 1.2em, text-shadow `0 0 10px rgba(168,19,46,.4)`
- **Signature** "Příjemnou zábavu přejí administrátoři." — **Italianno** 32px desktop / 26px mobile, color `var(--ink-blood) #9b1226`, text-shadow `0 0 14px rgba(155,18,38,.45)`, letter-spacing 0.03em, text-align center
  - `::before` + `::after` decorative lines: 60px gradient transparent → garnet, margin 14px

### 4.5 Sidebar pravý — ADMINISTRACE + MOJE DISKUZE / SVĚTY (Q-1 B)

**Per project memory `project_admin_panel_decision.md` + Q-1 B (2026-05-10):**

Pravý panel obsahuje **dvě sekce** oddělené `divider-rose`:

1. **ADMINISTRACE** (nahoře) — skin selector + uživatelé (per memory)
2. **MOJE DISKUZE / MOJE SVĚTY** (dole, pod stříbrným oddělovačem) — defaultní base layout (zachová konzistenci s ostatními skiny)

- Stejný čalouněný panel pattern jako levý (4.3) + tarnished silver edge + damask + tufting buttons + drip + divider-rose mezi sekcemi
- **🎨 ADMINISTRACE tag** nahoře (signature element):
  - `<div class="admin-tag">ADMINISTRACE</div>`
  - Background: `linear-gradient(180deg, rgba(74,6,18,.6), rgba(20,6,10,.85))` + 1px silver border
  - Text: Pirata One 11px uppercase, letter-spacing 0.5em, `var(--silver-bright)`
  - **Granátové ⚜ ikony** po stranách textu (`::before` + `::after`): garnet-bright color, text-shadow `0 0 6px var(--garnet-incand)`
  - Box-shadow: `0 0 14px rgba(168,19,46,.2) inset` (subtle granátový halo)
- **Skin selector** sekce (Q-2 A):
  - Label "Vzhled (skin)" — Pirata One 10px letter-spacing 0.3em, silver-tarnish color, text-align center
  - **Skin grid 4-column scroll** (`.skin-grid`): aspekt-ratio 1:1 swatches, gap 6px, max-height ~200px desktop, `overflow-y: auto` s custom granátovým scrollbarem
  - Renderuje **všech 21 skinů** z theme registry (current + 20 dalších) — umožní rychlou změnu na cokoliv bez navigace mimo dashboard
  - Každý swatch: `aspect-ratio: 1/1`, 1px silver-tarnish border, radial-gradient odpovídající barvám tématu (čerpáno z `theme.vars['--bg-primary']` + `theme.vars['--accent']`)
  - Active swatch (aktuální skin = temna-cerven): garnet-bright border + 0 0 14px granet glow + ⚜ překryv uprostřed
  - Hover: `transform: translateY(-1px)` + 0 0 12px silver shadow + tooltip s názvem tématu
  - Klik: aplikuje téma přes `useTheme().setTheme(themeId)`
- **Uživatelé** sekce:
  - Heading "Uživatelé" — Pirata One 12px letter-spacing 0.4em, silver-tarnish, garnet cabochon decoration (jako sekce v levém panelu)
  - **User row** (`.user-row`): flex layout, 1px silver border, padding 8px 10px
  - Avatar: 28×28 round, radial-gradient garnet (bright → deep), 1px silver-tarnish border, Pirata One 11px iniciála silver-bright
  - Name: Pirata One 11px uppercase letter-spacing 0.2em, text-pale
  - Role badge: Pirata One 9px uppercase, padding 2px 6px, garnet-bright text, 1px granet-soft border (SUPER / ADMIN / PJ varianty)
  - **Reálná data** — fetch existing users API (mock pro Storybook story)
- **"SPRAVOVAT VŠE →"** show-all link dole — Pirata One 11px letter-spacing 0.3em, silver-tarnish, padding 10px, 1px silver-tarnish border, hover bright silver + 0 0 16px granátový glow

#### Pod stříbrným oddělovačem — MOJE DISKUZE / MOJE SVĚTY (defaultní base layout)

- **Stříbrný oddělovač** mezi ADMINISTRACE a MOJE DISKUZE — `divider-rose.png` opacity 0.95, height 28px, scaled width 100%
- **MOJE DISKUZE** sekce:
  - Heading: "Moje diskuze" — Pirata One 12px letter-spacing 0.4em, silver-tarnish, garnet cabochon decoration
  - Empty state: "Žádné diskuze" — Cormorant Garamond italic, text-muted
  - "+" CTA — granátový primary button (`.btn-primary` styling)
- **MOJE SVĚTY** sekce:
  - Heading: "Moje světy" — Pirata One 12px letter-spacing 0.4em, silver-tarnish, garnet cabochon decoration
  - World items: stejný row pattern jako uživatelé v ADMINISTRACE (1px silver border, padding 8px 10px) + name + PJ badge (granátový border)
  - "ZOBRAZIT VŠE →" show-all link
  - "+" CTA — granátový primary button
- **Žádné corner ornaments** na panelu (jen welcome card má corner-tl)
- Layout: ADMINISTRACE zabírá ~40-45% výšky pravého panelu, MOJE DISKUZE/SVĚTY zbylých ~55-60%

### 4.6 Novinky panel (dole)

- Materiál: tmavá kamenná deska, **stejný čalouněný styling jako levý/pravý sidebar** (4.3) + damask + tarnished silver edge + tufting + drip
- Background: stejný damask gradient jako sidebars + backdrop-filter: blur(8px) saturate(1.05)
- Border: 1px `var(--silver-tarnish)`
- **🎨 4 corner-tl ornaments** (mirror, stejně jako welcome card) — render 28×28 desktop / 24×24 tablet / 20×20 mobile (menší než welcome card)
- **Heading "Novinky"** — **Pirata One** uppercase 18px letter-spacing 0.4em, silver-bright, doprovázený 📖 emoji nebo lucide `Book` ikonou s garnet color
- **Empty state** "Zatím žádné novinky." — Cormorant Garamond italic, text-muted, opacity 0.7
- **"PŘIDAT NOVINKU" tlačítko** — primary granátový variant (`.btn-primary`):
  - Background: `linear-gradient(180deg, #a01029, #5a081a)` (granátový)
  - Border: 1px `var(--silver-tarnish)`
  - Text: silver-bright Pirata One uppercase letter-spacing 0.25em
  - Box-shadow inner silver highlight + outer 0 0 24px granátový glow + deep drop
  - Před textem: lucide `Plus` ikona v silver-bright (žádný custom asset — CSS-only)
  - Hover: brighter granet `linear-gradient(180deg, #c8133a, #6e0a20)` + 0 0 32px brighter glow
  - Klik: scale 0.96 (mikrointerakce 150ms)

### 4.7 Navigační ikony — 7 unikátních vampire-collector motivů

Stejný pattern jako pergamen + hospoda + nemrtví (skrýt lucide SVG, render asset přes `data-nav-key` selector + `--asset-icon-*` proměnné):

| Nav-key | Asset | Symbol | Význam |
|---|---|---|---|
| `uvodnik` | `icon-uvodnik.png` | otevřený pergamenový dopis s rozlomenou krevní pečetí + dvěma otisky tesáků | host přijal pozvání |
| `vytvorit-svet` | `icon-vytvorit-svet.png` | obsidiánový glóbus s žhnoucími krevními žilami na baroque silver pedestalu | upírovo panství |
| `diskuze` | `icon-diskuze.png` | dvě benátské masky zkřížené (porcelánová bauta + netopýří půl-maska s granátovými očima) | maškarní bál konverzace |
| `clanky` | `icon-clanky.png` | karmínový sametem vázaný deník se stříbrnou sponou + krvavou záložkou + otisky tesáků na sametu | upírovy memoáry |
| `galerie` | `icon-galerie.png` | gold-bone barokní rám se siluetou džentlmena rozplývající se do dýmu (no reflection) | portrét bez odrazu |
| `napoveda` | `icon-napoveda.png` | trojramenný baroque kandelábr se třemi krvavě červenými dripping svícemi + jemný kouř | světlo, které vede |
| `hospoda` | `icon-hospoda.png` | křišťálový broušený pohár krve s baroque silver stonkem + granátem + dimenzionální nebula odraz | vampire interdimensional tavern |

Velikost render: **28×28 desktop / 24×24 mobile**, **žádný drop-shadow** (asset má vlastní baroque cartouche frame s glow)
Active stav (current page): **scale 1.05 + granátový glow halo** kolem ikony (`filter: drop-shadow(0 0 6px var(--garnet-incand))`)

### 4.8 Mikrointerakce & animace

| Element | Animace | Délka | Reduced-motion |
|---|---|---|---|
| Heartbeat tep (welcome card) | box-shadow lub-DUB swell | 6.4s loop | vypnuto (statický) |
| Padající okvětní lístky růží | 5 staggered linear drift | 28–40s loop | vypnuto |
| Blood drip pod panely | scaleY swell + translateY + fade | 5s loop, 4 panely | vypnuto |
| Hover NavItem | inset rim + outer granátový glow fill | 240ms one-shot | vypnuto |
| Active NavItem | bracket [ ] permanent + ikona granet glow | static | static (no anim) |
| Hover button (CTA, header) | silver edge bright + granátový glow | 200ms one-shot | vypnuto |
| Klik tlačítko | translateY 1px (subtle press) | 150ms | zachováno (UX feedback) |
| Active nav icon | scale 1.05 + granátový halo | static | static |
| Skin swatch hover | translateY -1px + silver shadow | 240ms | vypnuto (zachová přesun bez transform) |
| Welcome card → focus | žádné | — | — |

**Žádné swing, sway, flutter, candle flicker, ghost-pulse, brass shine sweep** — to jsou pergamen/hospoda/nemrtví signatury. Temna-cerven má **heartbeat + drip + petals** jako triple-signature motion language.

### 4.9 Typografie

| Role | Font | Důvod |
|---|---|---|
| Logo (header) | Custom blackletter (baked-in v `logo.png`) | Drippy blood blackletter, dodáno user |
| Display / heading | **Pirata One** | Drippy blackletter Google Font, sjednocuje s logo aestheticky (oba "drippy") |
| Sub-display / nav labels | **Marcellus SC** | Vyryté roman small caps, jako name plates v opera-boxu |
| Body | **Cormorant Garamond** (regular + italic) | Didone-serif elegance, knižní styl s vysokým kontrastem osy |
| Drop-cap "V" | Pirata One | Konzistence s display |
| Signature italic (administrátoři) | **Italianno** | Copperplate cursive, jako podpis krví |
| `.pi-name` accent | Pirata One | Granátové zvýraznění "Projekt Ikaros" v body textu |

**Žádný overlap s ostatními skiny:**
- ❌ Petit Formal Script, EB Garamond → pergamen
- ❌ Almendra, Spectral, Pirata One → ⚠️ HOSPODA má Pirata One v základu! **Konflikt**.
  - **Mitigace:** Hospoda používá Pirata One pro Headings (per docs/themes/hospoda.md), Temna-cerven používá Pirata One pro display + drop-cap. Oba jsou drippy blackletter. **Lze to akceptovat** (font není nemrtvi-exklusivní jako UnifrakturCook), ale za zvážení: alternativa **Eater** (Google Fonts) pro temna-cerven, ještě hororovější. Předpoklad pro draft: **ponechat Pirata One v obou** s tím, že hospoda + temna-cerven jsou dva různé skiny + různé materiálové prostředí (Q-3 v sekci 9).
- ❌ UnifrakturCook, New Rocker, IM Fell DW Pica → nemrtví
- ❌ Cormorant Garamond? → ⚠️ PŘÍRODA má Cormorant! **Konflikt**.
  - Příroda používá Cormorant pro display heading (per docs/themes/priroda.md). Temna-cerven používá pro body. **Lze to akceptovat** (různé použití, různé prostředí). Alternativa pro temna-cerven body: **EB Garamond** (ale to je pergamen). **Spectral** (ale to je hospoda). **Crimson Pro** (volné). Předpoklad: **ponechat Cormorant Garamond pro temna-cerven body** (Q-3 v sekci 9).
- ❌ Cinzel*, Lato, Great Vibes → zlatý standard
- ✅ Marcellus SC — neexistuje overlap
- ✅ Italianno — neexistuje overlap

Google Fonts URLs nutno přidat do `index.html` (per existující pattern):
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,600&family=Marcellus+SC&family=Pirata+One&family=Italianno&display=swap" rel="stylesheet">
```
(Pirata One už načtený přes hospodu — nezdvojuje se.)

### 4.10 Theme tokens — rozšíření `index.ts`

Přepsání existujících tokens (z bordó-čerň + bright-red na granát + tarnishované stříbro + jet + velvet) + přidání baroque-style materiálových tokens + asset URLs:

```typescript
'--bg-primary':       '#0a0307',     // bordeaux-čerň (warm undertone)
'--bg-secondary':     '#110509',     // sidebars background
'--bg-card':          '#16070c',     // cards
'--bg-card-hover':    '#1d0a11',
'--accent':           '#7e0a1e',     // granát primární
'--accent-bright':    '#a8132e',     // granát hover
'--accent-incand':    '#bf1f3a',     // granát žhnoucí (heartbeat, halo)
'--accent-dim':       '#4a0612',     // granát hluboký (stín)
'--accent-soft':      'rgba(126, 10, 30, 0.20)',
'--text-primary':     '#e8d6cc',     // porcelánová pleť šlechtice
'--text-secondary':   '#a08070',     // bledá
'--text-muted':       '#5a3838',     // vybledlá
'--border':           '#2a0c12',     // fine border
'--border-subtle':    '#180404',
'--border-strong':    '#a89890',     // tarnished silver rim
'--success':          '#3ecf8e',     // (default — temna-cerven nemá vlastní success barvu, jen banker)
'--warning':          '#f5a623',
'--danger':           '#a8132e',     // garnet bright (přepsaná z #e02030)
'--info':             '#a89890',     // tarnished silver
'--text-on-accent':   '#ffffff',
'--text-on-danger':   '#ffffff',
'--bg-overlay':       'rgba(10, 3, 7, 0.7)',
'--success-soft':         'rgba(62, 207, 142, 0.15)',
'--success-soft-border':  'rgba(62, 207, 142, 0.30)',
'--warning-soft':         'rgba(245, 166, 35, 0.15)',
'--warning-soft-border':  'rgba(245, 166, 35, 0.30)',
'--danger-soft':          'rgba(168, 19, 46, 0.18)',
'--danger-soft-border':   'rgba(168, 19, 46, 0.40)',
'--danger-focus-ring':    'rgba(168, 19, 46, 0.30)',

/* Theme-specific (vampire-collector signature) */
'--theme-bordeaux-deep':   '#0a0307',
'--theme-bordeaux-mid':    '#110509',
'--theme-garnet-deep':     '#4a0612',
'--theme-garnet':          '#7e0a1e',
'--theme-garnet-bright':   '#a8132e',
'--theme-garnet-incand':   '#bf1f3a',
'--theme-rose-blush':      '#c2596f',
'--theme-silver-tarnish':  '#a89890',
'--theme-silver-bright':   '#d4c8be',
'--theme-silver-shadow':   '#463a36',
'--theme-jet':             '#08020a',
'--theme-velvet-crimson':  '#3a0810',
'--theme-text-pale':       '#e8d6cc',
'--theme-ink-blood':       '#9b1226',
'--theme-border-silver':   'rgba(168, 152, 144, 0.28)',
'--theme-border-garnet':   'rgba(126, 10, 30, 0.55)',
'--theme-glass-back':      'rgba(20, 6, 12, 0.76)',
'--theme-damask-pattern':  'url("data:image/svg+xml;utf8,<svg xmlns=...damask svg...>")',  // viz 4.1

/* Fonts */
'--font-logo':        'inherit',  // logo je obrázek, baked-in font
'--font-display':     '"Pirata One", "UnifrakturCook", Georgia, serif',
'--font-sub':         '"Marcellus SC", Georgia, serif',
'--font-body':        '"Cormorant Garamond", Georgia, serif',
'--font-script':      '"Italianno", "Pinyon Script", cursive',

/* Asset URLs */
'--asset-logo':              'url(/themes/temna-cerven/decor/logo.webp)',
'--asset-medailon':          'url(/themes/temna-cerven/decor/medailon.webp)',
'--asset-corner':            'url(/themes/temna-cerven/decor/corner-tl.webp)',
'--asset-wax-seal':          'url(/themes/temna-cerven/decor/wax-seal.webp)',
'--asset-jet-bead-frame':    'url(/themes/temna-cerven/decor/jet-bead-frame.webp)',
'--asset-bat-arch':          'url(/themes/temna-cerven/decor/bat-arch.webp)',
'--asset-divider-rose':      'url(/themes/temna-cerven/decor/divider-rose.webp)',
'--asset-icon-uvodnik':      'url(/themes/temna-cerven/decor/icon-uvodnik.webp)',
'--asset-icon-vytvorit-svet':'url(/themes/temna-cerven/decor/icon-vytvorit-svet.webp)',
'--asset-icon-diskuze':      'url(/themes/temna-cerven/decor/icon-diskuze.webp)',
'--asset-icon-clanky':       'url(/themes/temna-cerven/decor/icon-clanky.webp)',
'--asset-icon-galerie':      'url(/themes/temna-cerven/decor/icon-galerie.webp)',
'--asset-icon-napoveda':     'url(/themes/temna-cerven/decor/icon-napoveda.webp)',
'--asset-icon-hospoda':      'url(/themes/temna-cerven/decor/icon-hospoda.webp)',
```

Aktualizace `fonts:` sekce:
```typescript
fonts: {
  logo: 'Pirata One',
  display: 'Pirata One',
  body: 'Cormorant Garamond',
},
```

### 4.11 Asset list — **12 nových** (10 AI + 2 user)

| # | Asset | Účel | Velikost (master) | Source |
|---|---|---|---|---|
| 1 | `logo.png` | Header logo (drippy blackletter "Projekt Ikaros" v iron frame) | ~600×183 (horizontal banner) | **User dodal** ✅ |
| 2 | `medailon.png` | Ikaros bird v iron-cross frame s krevním glow | ~600×740 (vertical) | **User dodal** ✅ |
| 3 | `corner-tl.png` | Master TL roh, mirror na ostatní (iron+baroque silver+granát+drip) | ~1024×1024 | **AI gen** ✅ |
| 4 | `wax-seal.png` | Visící krevní pečeť s otisky tesáků | ~1024×1024 | **AI gen** ✅ |
| 5 | `jet-bead-frame.png` | Viktoriánský smuteční jet-bead rámeček okolo medailonu | ~1024×1024 | **AI gen** ✅ |
| 6 | `bat-arch.png` | Oblouk z 9 letících netopýrů nad welcome card | ~2048×512 (4:1) | **AI gen** ✅ (drobná deviace na vnějších netopýrech, akceptováno) |
| 7 | `divider-rose.png` | Horizontální stonek-růže mezi sekcemi v panelech | ~1536×512 (6:2) | **AI gen** ✅ |
| 8 | `icon-uvodnik.png` | Otevřený dopis s krevní pečetí | 1024×1024 | **AI gen** ✅ |
| 9 | `icon-vytvorit-svet.png` | Obsidiánový glóbus s krevními žilami | 1024×1024 | **AI gen** ✅ |
| 10 | `icon-diskuze.png` | Dvě benátské masky zkřížené | 1024×1024 | **AI gen** ✅ |
| 11 | `icon-clanky.png` | Karmínový sametový deník | 1024×1024 | **AI gen** ✅ |
| 12 | `icon-galerie.png` | Silueta džentlmena bez obličeje | 1024×1024 | **AI gen** ✅ |
| 13 | `icon-napoveda.png` | Trojramenný kandelábr s krvavými svícemi | 1024×1024 | **AI gen** ✅ |
| 14 | `icon-hospoda.png` | Křišťálový pohár krve s dimenzionálním vortex odrazem | 1024×1024 | **AI gen** ✅ |

**Asset pipeline** (existující `npm run themes:optimize` po vzoru hospody/nemrtvi):
- PNG masters → WebP `cwebp -q 90 -alpha_q 100` → `public/themes/temna-cerven/decor/*.webp`
- Žádné nové sharp transformace — corner mirror dělá CSS scaleX/Y (per pergamen pattern)

Vytvoří se **finalize-temna-cerven-assets.mjs** script (per `scripts/finalize-nemrtvi-assets.mjs` pattern).

### 4.12 Responsivita (desktop / tablet / mobile)

| Breakpoint | Změny |
|---|---|
| **Desktop** (≥1280px) | Plný layout, medailon 220×220, jet-bead-frame +18px, corner-welcome 36×36, corner-novinky 28×28, bat-arch 96 výška, heartbeat aktivní, petals 5 staggered, drip 4 panely |
| **Tablet** (1024–1279px) | Medailon 180×180, jet-bead-frame +14px, corner-welcome 32×32, corner-novinky 24×24, bat-arch 72 výška, petals 3 (snížený count) |
| **Tablet narrow** (769–1023px) | NavItem padding zúžen, medailon 160×160, corners zmenšeny dále, ADMINISTRACE pravý panel collapse pod hlavní obsah |
| **Mobile** (≤768px) | Header buttons icon-only, drawer mode, medailon 140×140, jet-bead-frame +10px, corner-welcome 24×24, corner-novinky 20×20, bat-arch 56 výška, petals 2 (subtle), drip jen na hero (ostatní hidden) |
| **Mobile small** (≤480px) | TYKY + ODHLÁSIT do hamburger drawer (existující pattern), petals hidden, fold-line hidden |

### 4.13 Accessibility

- **Focus visible** — wrapper `:focus-visible` na všech interaktivních prvcích:
  ```css
  outline: none;
  box-shadow:
    0 0 0 2px var(--bg-primary),
    0 0 0 4px var(--theme-garnet-incand),
    0 0 14px var(--accent-soft);
  ```
- **Reduced motion** — `@media (prefers-reduced-motion: reduce)` vypne heartbeat, petals, drip, hover edge-light. Zachová se jen klik translateY (UX feedback nutný). `reducedMotion: 'heavy'` v theme registry je už nastaveno.
- **Forced colors** — `@media (forced-colors: active)` fallback pro corner ornaments + ikony (`forced-color-adjust: none`)
- **WCAG AA kontrast** — všechny text/bg kombinace ověřit přes `npm run audit:contrast`:
  - Text-pale `#e8d6cc` na bordeaux-deep `#0a0307` = ✅ ~13.5:1
  - Garnet-bright `#a8132e` na bordeaux-deep `#0a0307` = ⚠️ ~4.8:1 (AA pro text >18px, AA Large; pod AAA — akceptovatelné jako accent, ne jako body)
  - Silver-tarnish `#a89890` na bordeaux-deep `#0a0307` = ✅ ~7.6:1
  - Silver-bright `#d4c8be` na bordeaux-deep `#0a0307` = ✅ ~12.4:1
  - Ink-blood `#9b1226` na bordeaux-deep `#0a0307` = ⚠️ ~4.0:1 (signature italic, mírně pod AA — administrátorský podpis je dekorativní, akceptovatelné s textovou alternativou)
- **Touch target ≥48px** na mobile — NavItem min-height 48px

### 4.14 Performance

- **CSS-only animace** (no JS) — opacity/transform/box-shadow = GPU-friendly
  - Výjimka: heartbeat na welcome card je box-shadow animation → mírně dražší než transform, ale akceptovatelné (1 element, 6.4s loop, low frequency)
- **WebP assety** s 90 quality + 100 alpha quality — odhad ~700–1100 KB všech 14 assetů (logo + medailon + 12 AI)
- **Lazy-load** decorations.css (existující pattern přes `decorationsModule: () => import('./decorations.css')`)
- **No backdrop-filter na topbaru** (heavy iron) → menší GPU stress
- **backdrop-filter na welcome card + novinky panel + sidebars** — akceptovatelný GPU cost (4 panely)
- **Petals**: 5 elementů s linear animation = velmi nízký GPU cost. Mobile snížený na 2.
- **Damask SVG pattern**: inline data: URL — žádný extra HTTP request, jednorázově parsed

---

## 5. Out of scope

- **Background image** — neměníme (`temna-cerven.webp` zůstává, gotická katedrála s rozetovým oknem; skin overlay přepíše dostatečně)
- **Logo + medailon** — user dodal, prompty pro tyto **NEPÍŠEME**
- **Sound effects** (heartbeat audio, blood drip splash, organ chord) — mimo scope, future enhancement
- **3D parallax** na bat-arch (netopýři v různých depth layerech) — mimo scope
- **Rose petal pause-on-hover** — mimo scope
- **Atmospheric clutter strip** (jako hospoda decor-table-clutter) — ne pro temna-cerven (heartbeat + petals + drip jsou dost)
- **Animated wax seal** (pečeť kape v reálném čase) — mimo scope, statický asset stačí
- **Knižní záložka / bookmark** — pergamen-only signature
- **Big-book backdrop** — pergamen-only signature
- **Plakát "Dnešní speciál" / heraldic banner stand-alone** — hospoda-only signatury
- **Skull-arch** — nemrtví-only (temna-cerven má bat-arch)
- **Ghost-pulse** — nemrtví-only (temna-cerven má heartbeat)
- **Zvukové efekty** — mimo scope, future enhancement
- **React komponenty** — žádná změna v `CornerOrnament`, `IkarosCard`, `IkarosLayout`, `DashboardPage`, `RightPanel`, `NovinkyPanel` (čisto CSS upgrade přes `[data-theme="temna-cerven"]`)
- **Backend** — žádný BE dopad
- **ADMINISTRACE pravý panel logika** — předpokládáme že existuje `RightPanel` slot system a admin obsah lze podsunout přes existující infrastrukturu

---

## 6. Acceptance kritéria

1. ✅ Po `themeId === 'temna-cerven'` se aplikuje upgrade — žádný globální dopad
2. ✅ Topbar je solidní zčernalý kov (no transparency, žádný backdrop-filter), s tufting buttons na koncích
3. ✅ Logo + medailon zobrazeny per dodané assety usera (logo s krevním glow, medailon obtočen jet-bead frame)
4. ✅ Welcome card má dark-glassmorphism + damask wallpaper, **bat-arch crown** nahoře, 4 corner-tl ornaments (mirror), garnet drop-cap "V" v Pirata One, medailon vlevo v jet-bead frame, **wax-seal s otisky tesáků** visící z levého spodního rohu (-8°), **fold-line** uprostřed, **heartbeat tep** 6.4s loop
5. ✅ Sidebar levý + pravý + ADMINISTRACE = čalouněné panely (damask + tufting buttons + drip + tarnished silver edge), divider-rose mezi sekcemi (žádné corner ornaments na panelech)
6. ✅ Pravý panel = **ADMINISTRACE nahoře** (skin selector grid s **21 swatches scroll** + uživatelé s rolí badges) + **divider-rose oddělovač** + **MOJE DISKUZE / MOJE SVĚTY pod** (defaultní base layout per Q-1 B)
7. ✅ Novinky panel = damask glassmorphism + 4 corner-tl ornaments (menší než welcome card)
8. ✅ NavItem má čalouněný styling, hover má inset granátový rim + outer glow (žádný shine sweep), active má **silver bracket [ ]** + ikona granet glow (statika)
9. ✅ 7 nav ikon (uvodnik až hospoda) zobrazeno per `--asset-icon-*` proměnné, lucide SVG schované
10. ✅ Divider-rose mezi sekcemi v panelech
11. ✅ "PŘIDAT NOVINKU" + "+" v pravém panelu = granátový primary button (granátový gradient + silver border + outer granet glow), klik mikrointerakce translateY 1px
12. ✅ **Heartbeat animation** 6.4s loop běží na welcome card (lub-DUB box-shadow swell)
13. ✅ **Padající okvětní lístky růží** 5 staggered (28–40s, mobile 2 staggered), z-index 999
14. ✅ **Blood drip** pod 4 panely 5s loop (mobile jen hero)
15. ✅ **Damask wallpaper** SVG inline aplikováno na body + panely (multiply blend, opacity 0.32)
16. ✅ **Film grain** SVG noise overlay 35% opacity, mix-blend overlay
17. ✅ Mobile (≤768px): topbar icon-only, drawer mode, medailon 140×140, corner-welcome 24×24, drip jen na hero
18. ✅ Reduced motion vypne všechny animace kromě klik translateY
19. ✅ WCAG AA kontrast na všech text/bg kombinacích (`npm run audit:contrast` projde — ink-blood signature je text-decorative, body text v text-pale prochází AAA)
20. ✅ Forced colors fallback aktivní
21. ✅ Existing skiny (pergamen, hospoda, příroda, zlatý standard, nemrtví, atd.) **bez regrese** (Storybook gallery vizuální check)
22. ✅ TypeScript build projde (`npm run build`)
23. ✅ Lint projde (`npm run lint`)
24. ✅ `lint:colors` projde (žádné hardcoded barvy mimo `index.ts` tokens — všechno přes `var(--theme-*)` nebo `var(--*)`)

---

## 7. Test plán

### 7.1 Automatizované
- `npm run lint` — ESLint clean
- `npm run lint:colors` — žádné hardcoded barvy v decorations.css
- `npm run build` — TS + Vite build clean
- `npm run test` — existing 36+ unit testů pro themes (registry, applyTheme, useTheme) musí projít
- `npm run audit:contrast` — WCAG AA pro temna-cerven theme (ink-blood signature whitelisted jako decorative)

### 7.2 Smoke test (manuální)
1. **Storybook gallery** — `npm run storybook` → Themes → Gallery → All Themes — temna-cerven vypadá per mockup, ostatní 21 skinů beze změny
2. **Live dashboard** — switch do temna-cerven skinu, ověřit:
   - Topbar solid blackened metal s tufting buttons na rozích
   - Logo + medailon zobrazeny (medailon obtočen jet-bead frame)
   - Welcome card má bat-arch crown nahoře, 4 corner-tl rohy, garnet drop-cap "V", wax-seal visící vlevo dole, fold-line uprostřed
   - Heartbeat tep welcome cardu vidět (subtle box-shadow swell každých 6.4s)
   - Padající okvětní lístky růží 5 staggered
   - Sidebary mají čalouněný frame + tufting + divider-rose mezi sekcemi
   - Blood drip pod panely občas spadne
   - NavItem hover (granátový rim glow) / active (silver bracket [ ] + ikona granet glow)
   - 7 nav ikon viditelných místo lucide
   - **Pravý panel = ADMINISTRACE** (skin selector grid + uživatelé s rolí badges)
   - "+" CTA + klik mikrointerakce
   - Damask wallpaper subtle visible na pozadí
3. **Responsivita** (Chrome DevTools):
   - 1920×1080 (desktop) — plný layout, 5 petals
   - 1280×800 (laptop) — plný layout
   - 1024×768 (tablet) — corners zmenšeny, 3 petals
   - 768×1024 (tablet portrait) — drawer mode, ADMINISTRACE collapse
   - 414×896 (mobile L) — petals 2, drip jen na hero, medailon 140×140
   - 320×568 (mobile S) — hamburger menu, petals hidden, fold-line hidden
4. **Reduced motion** (system preference) — heartbeat/petals/drip/hover-glow vypnuté, klik translateY zachováno
5. **Forced colors** (Windows high contrast) — UI funkční, ornamenty neztrácí význam
6. **Mobil-desktop skill** — po dokončení spustit per project rule

---

## 8. Riziko & rollback

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|---|---|---|---|
| Heartbeat tep welcome cardu vypadá rušivě (zaboří se uživateli do hlavy) | střední | nízká | Subtle box-shadow only (no scale/translate), 6.4s je dost pomalé. Live test; pokud rušivé, prodloužit na 8s nebo zmenšit lub-pulse intensity |
| 5 padajících okvětních lístků = visual noise pro 'serious work' | střední | nízká | Subtle opacity 0.55 + slow speeds + petals hidden v reduced-motion. Test na "vážnou práci" use case (psaní článku) — pokud rušivé, snížit na 3 petals nebo přidat user toggle |
| Damask wallpaper ruší pozadí background image | střední | nízká | Damask multiply blend + opacity 0.32 → low contrast. Pokud ruší, snížit na 0.20 nebo aplikovat jen na panely (ne na body) |
| Bat-arch s vnějšími "fluffy" netopýry vypadá nesourodě s ostatními assety | nízká | střední | User akceptoval at-as-is. Pokud po implementaci vypadá fakt rušivě, regen v 1.0l-fix specu |
| Pirata One overlap s hospodou způsobí "stejnou náladu" mezi hospoda + temna-cerven | nízká | nízká | Hospoda je teplá warm-tavern, temna-cerven je cold vampire-salon. Materiál + paleta jsou kompletně různé. Font sám neurčuje atmosféru — kontext ano. **Akceptovatelné.** Pokud user chce strict no-overlap, alternativa **Eater** (Q-3) |
| Cormorant Garamond overlap s přírodou — knižní serif body — způsobí "stejnou knižní atmosféru" mezi příroda + temna-cerven | nízká | nízká | Příroda používá Cormorant pro display, temna-cerven pro body. Různé použití. **Akceptovatelné.** |
| Glassmorphism na 4 panelech (welcome + novinky + 2 sidebars) způsobí GPU strain při kombinaci s heartbeat + petals + drip | střední | střední | Heartbeat = 1 element box-shadow. Petals = 5 elementů linear translate. Drip = 4 elementy fade. Glassmorphism 4 panelů = base cost. Test na low-end mobile (Pixel 5, iPhone SE 2020). Pokud problém, vypnout backdrop-filter na sidebars |
| Skin selector grid v ADMINISTRACE 21 swatches je moc + scroll v pravém panelu | střední | střední | Per Q-2 A scroll grid `max-height: 200px`, custom granátový scrollbar. Test usability — pokud rušivé, fallback na 8 favorited s "VÍCE" toggle |
| Jet-bead frame okolo medailonu má transparent center — pokud asset má pevné pozadí, mediailon nebude vidět | nízká | střední | Asset jet-bead-frame.png byl vygenerován s explicit transparent center per prompt. **Verified v auditu.** |
| Wax-seal visící z hero (-8° rotation) může na mobile přesahovat mimo card | střední | nízká | Test mobile, pokud přesahuje, hide on `<480px` nebo zmenšit + reposition |
| Heartbeat box-shadow swell způsobí layout reflow | nízká | vysoká | Box-shadow nezpůsobuje reflow (jen paint), `will-change: box-shadow` na welcome cardu pro GPU layer. Test perf. |
| Asset pipeline `cwebp` selže na novém masteru | nízká | střední | Pergamen + hospoda + nemrtví pipeline funguje, pattern stejný |

**Rollback plán** — git revert PR; pokud už mergeováno, nový PR co vrací `decorations.css` a `index.ts` na předchozí stav (22 + 51 řádků). Žádný BE / data dopad.

---

## 9. Otázky k autorovi

Všechny otázky odpovězeny v Q&A 1–3 (2026-05-10):

- ✅ **Q-1 B** — Pravý panel: ADMINISTRACE nahoře + **MOJE DISKUZE / MOJE SVĚTY pod** (oddělené `divider-rose`). User dostane zachovanou konzistenci s ostatními skiny + admin tooling navrch.
- ✅ **Q-2 A** — Skin selector: **scroll grid s všemi 21 skiny** (4 sloupce, max-height ~200px, custom granátový scrollbar), umožňuje rychlou změnu na cokoliv bez navigace mimo dashboard.
- ✅ **Q-3 A** — Akceptovat font overlap: Pirata One sdílen s hospodou (různé use case + materiálové prostředí), Cormorant Garamond sdílen s přírodou (různé use case — display vs body). **Žádný přepis na Eater / Crimson Pro.**

---

## 📋 Po schválení specu — další kroky

1. **Implementační plán** — `phase-1/plan-1.0l.md` s konkrétními file diffs, CSS snippets, testovacími kroky
2. **Implementace** (single PR — minimální scope per existující skin upgrade pattern):
   - Asset finalize script (`scripts/finalize-temna-cerven-assets.mjs`) → 12 PNG → 12 WebP v `public/themes/temna-cerven/decor/`
   - `index.ts` přepsání tokens + fonts + asset URLs
   - `decorations.css` přepsání (z 22 řádků na ~750+ řádků per pergamen pattern)
   - Google Fonts URLs do `index.html` (Marcellus SC + Italianno; Pirata One + Cormorant Garamond už načteny přes hospoda/přírodu)
   - Storybook check + WCAG audit
   - **Mobil-desktop skill** spuštění po dokončení (per project rule)
3. **Aktualizace `docs/themes/temna-cerven.md`** — přepis starého náčrtu na nový vampire-collector synthesis konceptový dokument
4. **Aktualizace `docs/themes/README.md`** — změna stavu z "⏳ Čeká na obrázek" na "✅ 1.0l upgrade hotový"

**Autor čeká na schválení této specifikace.** Q&A vyřešeny 2026-05-10 (Q-1 B / Q-2 A / Q-3 A).
