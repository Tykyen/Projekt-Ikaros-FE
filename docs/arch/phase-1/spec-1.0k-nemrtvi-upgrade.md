# Spec 1.0k — Nemrtví visual upgrade

**Status:** ✅ Implementováno
**Datum:** 2026-05-10
**Rozsah:** FE skin upgrade — `[data-theme="nemrtvi"]` izolace, žádný globální dopad
**Repo:** `Projekt-ikaros-FE`, větev `feat/krok-1.0k-nemrtvi-upgrade`
**Velikost:** odhad ~3 soubory změna (`index.ts`, `decorations.css`, `public/themes/nemrtvi/`) + 10 nových assetů
**Autor:** PJ + Claude
**Souvisí:** [spec-1.0i-pergamen-upgrade.md](spec-1.0i-pergamen-upgrade.md) (asset pipeline + corner-ornament pattern), [spec-1.0j-hospoda-upgrade.md](spec-1.0j-hospoda-upgrade.md), [spec-1.0b-theme-visuals.md](spec-1.0b-theme-visuals.md)

**Reference:**
- `assets-source/themes/references/nemrtvi.png` — cílový vzhled (mockup)
- `assets-source/themes/backgrounds/nemrtvi.png` (a `public/themes/backgrounds/nemrtvi.webp`) — background, **neměníme**
- `assets-source/themes/Nemrtví/logo.png` — finální logo (dodal user)
- `assets-source/themes/Nemrtví/medailon.png` — anděl v iron+skull rámu (dodal user)
- `docs/arch/phase-1/prompts-1.0k-nemrtvi-assets.md` — asset prompty (10× AI gen, hotovo)

---

## 0. Princip — opuštěná nekromantická kapitula, svět končí

> **Sedlec Kostnice o půlnoci. Krypta opuštěné nekromantické kapituly, vzduch těžký prachem a fosforeskující teal-green ghost-light. Železo zčernalé časem, kosti vybělené, kámen popraskaný. Nic se nehýbe. Skin musí *dýchat smrtí* — pomalu, oppressively, s end-of-world dread.**

**Inspirační kotvy:** Bloodborne UI/architecture × Dark Souls 3 Cathedral of the Deep × Diablo IV crypts × Sedlec Kostnice (Kutná Hora) × Albrecht Dürer woodcuts × Goya Black Paintings.

**NE** Halloween dekorace. **NE** cartoon kostlivci. **NE** crystal-clear vampire glamour (to je `temna-cerven`). **NE** warm crypt cozy (to je hospoda s teplem ohniště). **NE** klášterní iluminace (to je pergamen). **NE** neon green toxic-waste / fluorescent. **NE** jump-scare horror.

**Strict isolation:** vše scoped přes `[data-theme="nemrtvi"]`. Zbylých 20 témat = nulová regrese. (Memory rule: žádné sdílení / recyklace ornamentů s pergamen, hospoda ani jinými skiny — Nemrtví má vlastní vizuální slovník.)

---

## 1. Cíl

Po `themeId === 'nemrtvi'` má dashboard vypadat dle reference (`nemrtvi.png`): krypta s blackened iron page-frame, welcome card jako oltář v kostnici (skull-arch crown nahoře, medailon vlevo, bone drop-cap na "V"), nav ikony jako kamenné výklenky s ghost-light. Vše izolované, bez dopadu na ostatní skiny.

---

## 2. Kontext / motivace

- Pergamen (1.0i) zavedl asset pipeline a corner-ornament pattern. Hospoda (1.0j) rozšířila na warm-tavern. **Nemrtví je třetí ve "tier-1 produkční kvalitě"** — dark fantasy ossuary jako vizuální opozit pergamenu (warm parchment) i hospody (warm hearth).
- Současný `decorations.css` má jen 22 řádků základu (background tint + card border). Skin viditelně neodlišený — vypadá jako varianta default tématu.
- User chce, aby Nemrtví byl **vizuálně dramatický a smrtelně tichý** — Bloodborne / Dark Souls aesthetic, end-of-world dread, žádný horror-cheese.
- Po dokončení bude **8 skinů** s "asset-grade" upgradem (zlatý standard, sci-fi, bílá, modré nebe, vesmírná loď, příroda, pergamen, hospoda, nemrtví) → projekt bližší dokončené Fázi 1.

---

## 3. Audit současného stavu

### 3.1 Theme registry & tokens
- [`src/themes/themes/nemrtvi/index.ts`](../../../src/themes/themes/nemrtvi/index.ts) — existuje, definuje základní paletu (toxic green `#30c060`, dark `#0a0c08`, fonty MedievalSharp + Cinzel + Lora), thumbnail a background, `reducedMotion: 'heavy'`. **Nutné kompletní přepsání palety + fontů + tokens** podle Q&A rozhodnutí (teal-ghost #5fc8a8 + radium-bright #7cffae + UnifrakturCook + New Rocker + IM Fell DW Pica).
- Asset URL proměnné chybí — nutné přidat při zavedení assetů.

### 3.2 Decorations
- [`src/themes/themes/nemrtvi/decorations.css`](../../../src/themes/themes/nemrtvi/decorations.css) — 22 řádků, jen background gradient + 2px card border + hover glow. **Žádné panely, žádné NavItem styly, žádné dekorace, žádné mikrointerakce.** Skin viditelně nedokončený.

### 3.3 Asset folder
- `assets-source/themes/Nemrtví/` — ✅ existuje s 12 soubory: `logo.png` + `medailon.png` (user-supplied) + 10 AI assetů (`corner-tl.png`, `divider-skull.png`, 7× `icon-*.png`, `skull-arch.png`)
- `assets-source/themes/backgrounds/nemrtvi.png` — ✅ existuje
- `public/themes/backgrounds/nemrtvi.webp` — ✅ existuje (build pipeline output, paleta sladěná s novým asset setem — neměníme)
- `public/themes/nemrtvi/decor/` — neexistuje (nutno vytvořit při WebP konverzi)

### 3.4 Předchozí stručný design doc
- [`docs/themes/nemrtvi.md`](../../themes/nemrtvi.md) — staří vize (čeká k auditu/přepisu po implementaci).

### 3.5 Pergamen + Hospoda jako pattern předlohy
- [`src/themes/themes/pergamen/decorations.css`](../../../src/themes/themes/pergamen/decorations.css) — 743 řádků, struktura sekcí 1–23 (background overlay → topbar → logo → header buttons → glass panels → corner ornaments → welcome card → medailon → bookmark → section title → NavItem → right panel → PJ badge → first-letter → nav icons → novinky → showmore → focus visible → scrollbar → tablet → mobile → reduced motion → forced colors)
- [`src/themes/themes/hospoda/decorations.css`](../../../src/themes/themes/hospoda/decorations.css) — stejná struktura, jiná paleta/materiály
- **Nemrtví použije stejnou strukturu**, ale s vlastní materiálovou a ornamentální paletou (blackened iron + bone + ghost-green).

---

## 4. Návrh řešení

### 4.1 Background & atmosféra

- **Background image** — `/themes/backgrounds/nemrtvi.webp` (✅ existuje, sladěn s novými assety, **neměníme**)
- **Atmosférický overlay** — pure linear darken pro čitelnost UI (background je už dark, jen mírné dodání kontrastu):
  ```css
  '--theme-bg-overlay':
    'linear-gradient(180deg, rgba(8, 10, 8, 0.45) 0%, rgba(8, 10, 8, 0.65) 100%)'
  ```
- **🎨 Ghost-pulse animace** (signature element):
  - `[data-theme="nemrtvi"][data-shell="ikaros"]::after` — radial-gradient teal-green záře z horní třetiny obrazovky (ne zespoda jako hospoda — hospoda má ohniště dole, nemrtví má ghost-light shora jako ze zatuchlé kapituly)
  - `background: radial-gradient(ellipse at 50% 25%, rgba(95, 200, 168, 0.22) 0%, rgba(95, 200, 168, 0.08) 35%, transparent 65%);`
  - `animation: ghost-breathe 8s ease-in-out infinite;` — opacity 0.6 → 1.0 → 0.6 (efektivně 0.13 → 0.22 reálné opacity — sotva znatelné, "krypta dýchá ve spánku")
  - `pointer-events: none; z-index: 0;`
  - **Reduced-motion vypíná** (sekce 4.13)
- **🎨 Drifting dust motes** (subtle CSS particles):
  - 3 částice, `position: fixed`, `pointer-events: none`, opacity 0.15
  - `animation: dust-drift 30s linear infinite;` (s offsetem -10s, -20s pro stagger)
  - Ve `@media (prefers-reduced-motion: reduce)` skryto

### 4.2 Topbar (slim, 56px) — solidní zčernalé železo

- Pozadí: tmavý gradient bez transparency (page-chrome je neprůhledný, krypta-gravitas):
  ```css
  background:
    linear-gradient(180deg, #13140f 0%, #0c0d0a 100%);
  ```
- **Žádný backdrop-filter** (per Q&A — heavy iron, žádné prosvítání)
- **Iron-cold hairline** pod topbarem (1px, gradient `transparent → #2a2520 → transparent`, opacity 0.7)
- Logo vlevo z `logo.png` (horizontal banner s baked-in textem): šíře `--asset-logo-w: 460px` desktop / `360px` tablet / `260px` mobile
- Pravé tlačítka (POŠTA, UŽIVATELÉ, ZLATÝ STANDARD, TYKY, ODHLÁSIT) = **kamenné cedule s iron-cold okrajem**:
  - Background: `linear-gradient(180deg, #1a1b16 0%, #0e0f0c 100%)`
  - Border: 1px iron `#2a2520`
  - Text: weathered ivory `#cdc098` uppercase **New Rocker**, letter-spacing 0.10em
  - Hover: iron border → teal-ghost `#5fc8a8`, text → radium-bright `#7cffae`, **edge-light teal glow** (no warm shine, cold pulse)
  - Active state (administrace): teal-ghost border permanentní + radium-bright text + slabší glow trvalý
- **Mobile (≤768px)**: ikony only, label hidden přes `aria-label`
- **Mobile (≤480px)**: TYKY + ODHLÁSIT do hamburger drawer (existující pattern)

### 4.3 Sidebar levý — NAVIGACE / VESMÍRY / CHAT (a HOSPODA tlačítko)

- Frame: tmavá kamenná deska s **blackened iron edge** (per Q&A 8B — žádný corner-tl asset zde, jen CSS edge):
  - Background: `linear-gradient(160deg, rgba(20, 22, 18, 0.92) 0%, rgba(12, 14, 12, 0.96) 100%)`
  - Border: 1px iron `#2a2520`
  - Box-shadow inner: 1px ghost-green `rgba(95, 200, 168, 0.10)` (subtle inner rim)
  - Box-shadow outer: deep `0 6px 22px rgba(0, 0, 0, 0.65)`
- **Section titles** ("NAVIGACE", "VESMÍRY", "CHAT") — **New Rocker** uppercase, weathered ivory s text-shadow:
  ```css
  color: var(--theme-text-bone);
  letter-spacing: 0.18em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85), 0 0 8px rgba(95, 200, 168, 0.15);
  ```
- **Divider-skull** mezi sekcemi — `divider-skull.png` (femur + skull asset), opacity 0.85, height 24px, scaled `width: 100%`
- **NavItem** (každá položka):
  - Klid: `linear-gradient(180deg, rgba(20, 22, 18, 0.90) 0%, rgba(12, 14, 12, 0.95) 100%)` + 1px iron border + inset highlight rgba(95, 200, 168, 0.06)
  - Hover: iron border → teal-ghost `#5fc8a8`, text → radium-bright, **edge-light teal glow** (no shine sweep — žádný warm-feel, jen cold edge pulse)
  - Active: teal-ghost left border 2px + **recess-into-stone** efekt (inset shadow, jako by se ikona zatlačila do kamene):
    ```css
    box-shadow:
      inset 0 0 12px rgba(95, 200, 168, 0.25),
      inset 2px 0 0 #5fc8a8;
    background: linear-gradient(180deg, rgba(8, 10, 8, 0.95) 0%, rgba(4, 6, 4, 0.98) 100%);
    ```
    + radium-bright text + subtle ghost-green text-shadow
  - Text: **New Rocker** uppercase, weathered ivory `#cdc098`
  - Před textem: unikátní ikona (1 z 7, viz 4.7)
- **Žádný candle flicker / warm pulse** (to je hospoda) — active stav je *static* s permanent glow

### 4.4 Welcome card — oltář v kostnici (signature centerpiece)

- **Min-height** `clamp(420px, 60vh, 720px)` (stejně jako pergamen/hospoda)
- **Materiál**: tmavá kamenná deska s glassmorphism prosvítajícím skrz background:
  ```css
  background:
    linear-gradient(160deg, rgba(20, 22, 18, 0.86) 0%, rgba(12, 14, 12, 0.92) 100%);
  backdrop-filter: blur(8px) saturate(1.05);
  ```
- **Border**: 1px iron `#2a2520`
- **Box-shadow**: deep `0 8px 28px rgba(0, 0, 0, 0.75)` + inset `0 0 16px rgba(95, 200, 168, 0.08)` (subtle ghost rim)
- **🎨 Skull-arch crown** (signature element, per Q&A 7b A):
  - `::before` pseudo-element nahoře přes celou šířku cardu
  - Asset `skull-arch.webp` (4:1 ratio, weathered skulls + iron chains + central skull s teal-flames)
  - Position: `position: absolute; top: -32px; left: 0; right: 0; height: 96px; background-image: var(--asset-skull-arch); background-size: contain; background-position: center top; background-repeat: no-repeat;`
  - Tablet: top: -24px, height: 72px
  - Mobile: top: -16px, height: 56px
  - **Bottom otevřeno** (per Q&A 7b A — žádný mirror dolů, "vstup do krypty / nekonečná hloubka")
- **🎨 Corner-tl ornaments** v rozích cardu (per Q&A 8B — welcome + novinky):
  - `::after` + 3 další pseudo-elementy (nebo SVG mask) pro 4 rohy
  - Master `corner-tl.webp` (256×256), CSS scaleX/Y mirror na ostatní 3
  - Rozměr render: 96×96 desktop / 72×72 tablet / 56×56 mobile
  - Position: top: 8px / right: 8px / bottom: 8px / left: 8px (corner-anchored)
  - Pattern per pergamen 1.0i — 1 asset, 4 rendery přes CSS transform
- **Medailon** vlevo z `medailon.png` (anděl v iron-skull rámu):
  - `width: 280px; height: 340px;` desktop / `200px × 240px` tablet / `120px × 144px` mobile
  - Position: vlevo cardu, vertikálně centrováno
  - **Žádná flutter / sway animace** — medailon je *kamenný relief*, statika (per Q&A 9 A)
  - Drop-shadow: `0 6px 14px rgba(0, 0, 0, 0.7)`
  - Subtle ghost-glow: `filter: drop-shadow(0 0 12px rgba(95, 200, 168, 0.15))`
- **Heading** `Vítej v <span class="titleAccent">Projektu Ikaros.</span>`:
  - Wrapper třída: existující `welcomeTitle`
  - Color: weathered ivory `#cdc098`
  - Font: **IM Fell English SC** — počkej, korigováno: pro Nemrtví podle Q&A je display **New Rocker**, body **IM Fell DW Pica**. Welcome heading bude **New Rocker**.
  - "Projektu Ikaros." accent: radium-bright `#7cffae` italic, slight ghost-glow text-shadow
  - **Text-shadow**: `0 2px 4px rgba(0, 0, 0, 0.85), 0 0 14px rgba(95, 200, 168, 0.25)` (carved-into-stone + ghost emanation)
- **🎨 Bone drop-cap "V"** (per Q&A 7c A):
  - CSS `.welcomeBody p:first-of-type::first-letter`
  - `font-family: 'UnifrakturCook'` (logo font — gravitas)
  - `float: left; font-size: 4.2em; line-height: 0.85; padding: 0.05em 0.10em 0 0;`
  - Color: weathered ivory `#cdc098`
  - Text-shadow: bone-shaped (multi-stack):
    ```css
    text-shadow:
      0 0 0.04em rgba(0, 0, 0, 1),                   /* outline */
      0 2px 0.06em rgba(0, 0, 0, 0.9),               /* depth shadow */
      0 0 0.25em rgba(95, 200, 168, 0.35),           /* ghost ambient */
      0 0 0.5em rgba(95, 200, 168, 0.15);            /* ghost halo */
    ```
  - **Original ne-pergamenový pattern** (pergamen má zlatý gradient drop-cap; nemrtví má bone-ivory + ghost-glow)
- **Body paragraphs** — **IM Fell DW Pica** regular, weathered ivory `#cdc098`, line-height 1.65
- **Signature** "Příjemnou zábavu přejí administrátoři." — IM Fell DW Pica italic, teal-ghost `#5fc8a8`, mírný shadow

### 4.5 Sidebar pravý — ADMINISTRACE / MOJE DISKUZE / MOJE SVĚTY

- Stejný kamenný panel pattern jako levý (4.3) + iron edge + divider-skull mezi sekcemi
- **Žádné corner ornamenty na panelu** (per Q&A 8B — jen welcome + novinky)
- "MOJE DISKUZE" + "MOJE SVĚTY" sekce s **iron-bound "+" tlačítkem** (žádný brass-stamp asset jako hospoda — nemrtví má lightweight CSS-only tlačítka):
  - Background: gradient iron se subtle teal-green inner shadow
  - Border: 1px iron `#2a2520`
  - Hover: teal-ghost border + radium-bright glow
  - Klik mikrointerakce **scale 0.92 → 1.0** během 150ms (UX feedback, zachováno i v reduced-motion)
  - Symbol "+" v New Rocker, weathered ivory
- "MATRIX PJ" / "NOVÝ SVĚT PJ" tlačítka = stone tablet styling + **PJ badge** v rohu
- "ZOBRAZIT VŠE →" — pure text link, teal-ghost color s underline na hover
- **PJ badge** (`data-pj-badge`) — bg `#1a1b16` + 1px teal-ghost border + radium-bright text "PJ", subtle ghost glow
- **ADMINISTRACE sekce** (per project memory — uživatelé + skin selector v pravém panelu):
  - Stejný stone-tablet styling jako MOJE DISKUZE
  - "UŽIVATELÉ" + "SKIN" jako buttons s NavItem-like behavior
  - Žádné odlišné rámování — visuální konzistence s ostatními pravými panely

### 4.6 Novinky panel (dole)

- Materiál: tmavá kamenná deska, **stejný stone styling jako welcome card** (per Q&A 8B — corner ornaments na obou)
- Background: `linear-gradient(180deg, rgba(20, 22, 18, 0.86) 0%, rgba(12, 14, 12, 0.92) 100%)` + backdrop-filter
- Border: 1px iron `#2a2520`
- **🎨 4 corner-tl ornaments** (mirror, stejně jako welcome card) — render 80×80 desktop / 64×64 tablet / 48×48 mobile (menší než welcome card)
- **Heading "Novinky"** — **New Rocker** uppercase, weathered ivory `#cdc098`, doprovázený lucide `Newspaper` ikonou s teal-ghost barvou
- **Empty state** "Zatím žádné novinky." — IM Fell DW Pica italic, teal-ghost `#5fc8a8` opacity 0.7
- **"PŘIDAT NOVINKU" tlačítko** — stejný stone-tablet button styling jako "+":
  - Background gradient iron + teal-ghost inner shadow
  - Před textem: lucide `Plus` ikona v teal-ghost (žádný custom asset — CSS-only)
  - Hover: teal-ghost border bright + radium-bright glow text
  - Klik: scale mikrointerakce (přitisknutí)

### 4.7 Navigační ikony — 7 unikátních ossuary motivů

Stejný pattern jako pergamen + hospoda (skrýt lucide SVG, render asset přes `data-nav-key` selector + `--asset-icon-*` proměnné):

| Nav-key | Asset | Symbol | Význam |
|---|---|---|---|
| `uvodnik` | `icon-uvodnik.png` | lebka s ivory halo (saint-but-undead) | krypta vítá |
| `vytvorit-svet` | `icon-vytvorit-svet.png` | bone-key s necromantic sigilem | otevřít nový svět |
| `diskuze` | `icon-diskuze.png` | dvě lebky šeptající si v teal-mlze | konverzace mrtvých |
| `clanky` | `icon-clanky.png` | grimoár s wax seal lebkou | doručené listiny |
| `galerie` | `icon-galerie.png` | bone-frame mirror s lebkou v reflexi | obrazy duší |
| `napoveda` | `icon-napoveda.png` | bone-cage lantern s ghost-flame | světlo v temnotě |
| `hospoda` | `icon-hospoda.png` | opuštěný cínový tankard s pavučinami | mrtví už nepijí |

Velikost render: 26×26 desktop / 22×22 mobile, **žádný drop-shadow** (asset má vlastní rim-light + niche)
Active stav (current page): **scale 1.05 + radium-bright glow halo** kolem ikony

### 4.8 🎨 CSS-only votive candles (volitelná atmosféra)

Per Q&A 5b B — žádný asset, **CSS-only SVG flame** v 2 výklencích po stranách welcome card:

- 2 pseudo-elements (`::before` na nějakém wrapperu nebo standalone div) — každá svíce visí ze stropu na CSS-drawn iron chain
- Plamen: SVG path s `fill: url(#ghost-flame-gradient)` — gradient teal-ghost → radium-bright
- **Žádný sway / flicker** (per Q&A 9A — statika; krypta nedýchá svíčkami, dýchá ghost-pulsem)
- **Tablet (≤1023px)**: skryto (visual noise reduction)
- **Mobile (≤768px)**: skryto

> **Decision**: zatím **out of scope tohoto specu** — implementace bez votive candles, otestujeme jak welcome card vypadá s jen skull-arch + corner-tl + medailon. Pokud bude působit "prázdně", přidáme votive candles v follow-up. Skull-arch + 4 corners + medailon mohou být dramaticky dost samy o sobě.

### 4.9 Mikrointerakce & animace

| Element | Animace | Délka | Reduced-motion |
|---|---|---|---|
| Ghost-pulse zhora | radial-gradient opacity 0.6→1.0→0.6 | 8s loop | vypnuto |
| Drifting dust motes | linear translate Y + slight X | 30s loop, 3 staggered | vypnuto |
| Hover NavItem | edge-light teal-glow fill (no sweep) | 300ms one-shot | vypnuto |
| Active NavItem | recess-into-stone (inset shadow) | static | static (no anim) |
| Hover button (CTA, header) | edge-light teal pulse | 300ms one-shot | vypnuto |
| Klik tlačítko | scale 0.92→1.0 | 150ms | zachováno (UX feedback) |
| Active nav icon | scale 1.05 + ghost-glow halo | static | static |
| Welcome card → focus | žádné | — | — |

**Žádné swing, sway, flutter, candle flicker, brass shine sweep** — to jsou pergamen/hospoda signatury. Nemrtví je **statický** (per Q&A 9A — "krypta dýchá pomalu, jako by spala").

### 4.10 Typografie

| Role | Font | Důvod |
|---|---|---|
| Logo (header) | UnifrakturCook | Blackletter, baked-in v logo asset |
| Display / heading | **New Rocker** | Dark Souls / Bloodborne UI font, gotický blackletter s broken serifs |
| Body | **IM Fell DW Pica** | Old letterpress s ink-bleed, "kniha co prožila staletí v kryptě" |
| Drop-cap "V" | UnifrakturCook | Gravitas, harmonizuje s logem |
| Signature italic | IM Fell DW Pica italic | Intimní mortuální tón |

**Žádný overlap s ostatními skiny:**
- ❌ Petit Formal Script, EB Garamond → pergamen
- ❌ Almendra, Spectral, Pirata One, Henny Penny → hospoda
- ❌ Cormorant Garamond, Crimson Text, Tangerine → příroda
- ❌ Cinzel*, Lato, Great Vibes → zlatý standard

Google Fonts URLs nutno přidat do `index.html` (per existující pattern).

### 4.11 Theme tokens — rozšíření `index.ts`

Přepsání existujících tokens (z toxic-green na teal-ghost) + přidání hospoda-style materiálových tokens + asset URLs:

```typescript
'--bg-primary':       '#0c0d0a',     // obsidián, lehký zelený undertone
'--bg-secondary':     '#13140f',     // midnight slate
'--bg-card':          '#15140e',     // very dark stone-iron
'--bg-card-hover':    '#1c1b14',
'--accent':           '#5fc8a8',     // teal-ghost (klid)
'--accent-bright':    '#7cffae',     // radium-bright (hover/active emise)
'--accent-dim':       '#2a6856',     // lichen-verdigris
'--accent-soft':      'rgba(95, 200, 168, 0.18)',
'--text-primary':     '#cdc098',     // weathered ivory
'--text-secondary':   '#807968',     // popel
'--text-muted':       '#3a3528',
'--border':           '#2a2520',     // blackened iron
'--border-subtle':    '#1a1b16',
'--border-strong':    '#5fc8a8',     // teal-ghost rim
'--success':          '#7cffae',
'--warning':          '#cdc098',
'--danger':           '#7a1814',     // oxidovaná stará krev
'--info':             '#5fc8a8',
'--text-on-accent':   '#0a0c08',
'--text-on-danger':   '#ffffff',
'--bg-overlay':       'rgba(0, 0, 0, 0.7)',
'--success-soft':         'rgba(124, 255, 174, 0.14)',
'--success-soft-border':  'rgba(124, 255, 174, 0.4)',
'--warning-soft':         'rgba(205, 192, 152, 0.16)',
'--warning-soft-border':  'rgba(205, 192, 152, 0.4)',
'--danger-soft':          'rgba(122, 24, 20, 0.18)',
'--danger-soft-border':   'rgba(122, 24, 20, 0.4)',
'--danger-focus-ring':    'rgba(122, 24, 20, 0.3)',

/* Theme-specific (hospoda-pattern) */
'--theme-iron-cold':       '#2a2520',
'--theme-iron-warm':       '#3a3128',
'--theme-bone-ivory':      '#cdc098',
'--theme-bone-ivory-bright':'#e8d8a8',
'--theme-stone-deep':      '#0c0d0a',
'--theme-stone-mid':       '#13140f',
'--theme-ghost-teal':      '#5fc8a8',
'--theme-ghost-radium':    '#7cffae',
'--theme-ghost-soft':      'rgba(95, 200, 168, 0.22)',
'--theme-blood-rust':      '#7a1814',

/* Fonts */
'--font-logo':        '"UnifrakturCook", "UnifrakturMaguntia", Georgia, serif',
'--font-display':     '"New Rocker", "MedievalSharp", Georgia, serif',
'--font-body':        '"IM Fell DW Pica", "IM Fell English", Georgia, serif',

/* Asset URLs */
'--asset-logo':              'url(/themes/nemrtvi/decor/logo.webp)',
'--asset-medailon':          'url(/themes/nemrtvi/decor/medailon.webp)',
'--asset-corner':            'url(/themes/nemrtvi/decor/corner-tl.webp)',
'--asset-divider-skull':     'url(/themes/nemrtvi/decor/divider-skull.webp)',
'--asset-skull-arch':        'url(/themes/nemrtvi/decor/skull-arch.webp)',
'--asset-icon-uvodnik':      'url(/themes/nemrtvi/decor/icon-uvodnik.webp)',
'--asset-icon-vytvorit-svet':'url(/themes/nemrtvi/decor/icon-vytvorit-svet.webp)',
'--asset-icon-diskuze':      'url(/themes/nemrtvi/decor/icon-diskuze.webp)',
'--asset-icon-clanky':       'url(/themes/nemrtvi/decor/icon-clanky.webp)',
'--asset-icon-galerie':      'url(/themes/nemrtvi/decor/icon-galerie.webp)',
'--asset-icon-napoveda':     'url(/themes/nemrtvi/decor/icon-napoveda.webp)',
'--asset-icon-hospoda':      'url(/themes/nemrtvi/decor/icon-hospoda.webp)',
```

Aktualizace `fonts:` sekce:
```typescript
fonts: {
  logo: 'UnifrakturCook',
  display: 'New Rocker',
  body: 'IM Fell DW Pica',
},
```

### 4.12 Asset list — **10 nových** + **2 user-supplied**

| # | Asset | Účel | Velikost (master) | Source |
|---|---|---|---|---|
| 1 | `logo.png` | Header logo | 1500×280 (horizontal banner) | **User dodal** ✅ |
| 2 | `medailon.png` | Anděl v iron-skull rámu | ~600×740 (vertical) | **User dodal** ✅ |
| 3 | `corner-tl.png` | Master TL roh, mirror na ostatní | ~1024×1024 | **AI gen** ✅ |
| 4 | `divider-skull.png` | Femur + lebka oddělovač | ~1500×400 (wide) | **AI gen** ✅ |
| 5 | `skull-arch.png` | Archa lebek nad welcome card | ~2048×512 (4:1) | **AI gen** ✅ |
| 6 | `icon-uvodnik.png` | Lebka s ivory halo | 1024×1024 | **AI gen** ✅ |
| 7 | `icon-vytvorit-svet.png` | Bone-key s sigilem | 1024×1024 | **AI gen** ✅ |
| 8 | `icon-diskuze.png` | Dvě lebky v teal-mlze | 1024×1024 | **AI gen** ✅ |
| 9 | `icon-clanky.png` | Grimoár s wax seal | 1024×1024 | **AI gen** ✅ |
| 10 | `icon-galerie.png` | Bone-frame mirror | 1024×1024 | **AI gen** ✅ |
| 11 | `icon-napoveda.png` | Bone-cage lantern | 1024×1024 | **AI gen** ✅ |
| 12 | `icon-hospoda.png` | Opuštěný tankard | 1024×1024 | **AI gen** ✅ (drobná deviace, akceptováno) |

**Asset pipeline** (existující `npm run themes:optimize` po vzoru hospody):
- PNG masters → WebP `cwebp -q 90 -alpha_q 100` → `public/themes/nemrtvi/decor/*.webp`
- Žádné nové sharp transformace — corner mirror dělá CSS scaleX/Y (per pergamen pattern)

Vytvoří se **finalize-nemrtvi-assets.mjs** script (per `scripts/finalize-hospoda-assets.mjs` pattern).

### 4.13 Responsivita (desktop / tablet / mobile)

| Breakpoint | Změny |
|---|---|
| **Desktop** (≥1280px) | Plný layout, medailon 280×340, corner-welcome 96×96, corner-novinky 80×80, skull-arch 96 výška, ghost-pulse aktivní, dust motes aktivní |
| **Tablet** (1024–1279px) | Medailon 220×268, corner-welcome 80×80, corner-novinky 64×64, skull-arch 80 výška, votive candles hidden |
| **Tablet narrow** (769–1023px) | NavItem padding zúžen, medailon 200×240, corners zmenšeny dále |
| **Mobile** (≤768px) | Header buttons icon-only, drawer mode, medailon 120×144, corner-welcome 56×56, corner-novinky 48×48, skull-arch 56 výška, dust motes hidden |
| **Mobile small** (≤480px) | TYKY + ODHLÁSIT do hamburger drawer (existující pattern) |

### 4.14 Accessibility

- **Focus visible** — wrapper `:focus-visible` na všech interaktivních prvcích:
  ```css
  outline: none;
  box-shadow:
    0 0 0 2px var(--bg-primary),
    0 0 0 4px var(--theme-ghost-radium),
    0 0 14px var(--theme-ghost-soft);
  ```
- **Reduced motion** — `@media (prefers-reduced-motion: reduce)` vypne ghost-pulse, dust motes, hover edge-light. Zachová se jen klik scale (UX feedback nutný). `reducedMotion: 'heavy'` v theme registry je už nastaveno.
- **Forced colors** — `@media (forced-colors: active)` fallback pro corner ornaments + ikony (`forced-color-adjust: none`)
- **WCAG AA kontrast** — všechny text/bg kombinace ověřit přes `npm run audit:contrast`:
  - Weathered ivory `#cdc098` na obsidián `#0c0d0a` = ✅ ~10.8:1
  - Teal-ghost `#5fc8a8` na obsidián `#0c0d0a` = ✅ ~9.2:1
  - Radium-bright `#7cffae` na obsidián `#0c0d0a` = ✅ ~13.5:1
- **Touch target ≥48px** na mobile — NavItem min-height 48px

### 4.15 Performance

- **CSS-only animace** (no JS) — opacity/transform = GPU-friendly
- **WebP assety** s 90 quality + 100 alpha quality — dohromady odhadem 600–900 KB všech 12 assetů (logo + medailon + 10 AI)
- **Lazy-load** decorations.css (existující pattern přes `decorationsModule: () => import('./decorations.css')`)
- **No backdrop-filter na topbaru** (per design — heavy iron) → menší GPU stress
- **backdrop-filter na welcome card + novinky panel** — akceptovatelný GPU cost (jen 2 panely)

---

## 5. Out of scope

- **Background image** — neměníme (`nemrtvi.webp` zůstává, paleta sladěná)
- **Logo + medailon** — user dodal, prompty pro tyto **NEPÍŠEME**
- **Votive candles** — zatím out of scope (case-by-case po implementaci, viz 4.8)
- **Atmospheric clutter strip** (jako hospoda decor-table-clutter) — ne pro nemrtví (ossuary nepotřebuje pevný clutter, dust motes + ghost-pulse jsou dost)
- **Brass-stamp CTA** — ne pro nemrtví (CSS-only buttony per 4.5)
- **Knižní záložka / bookmark** — pergamen-only signature
- **Big-book backdrop** — pergamen-only signature
- **Plakát "Dnešní speciál" / heraldic banner stand-alone** — hospoda-only signatury
- **Zvukové efekty** (kapající voda, vzdálené chrastění kostí) — mimo scope, future enhancement
- **React komponenty** — žádná změna v `CornerOrnament`, `IkarosCard`, `IkarosLayout`, `DashboardPage`, `RightPanel`, `NovinkyPanel` (čisto CSS upgrade přes `[data-theme="nemrtvi"]`)
- **Backend** — žádný BE dopad

---

## 6. Acceptance kritéria

1. ✅ Po `themeId === 'nemrtvi'` se aplikuje upgrade — žádný globální dopad
2. ✅ Topbar je solidní zčernalé železo (no transparency, žádný backdrop-filter)
3. ✅ Logo + medailon zobrazeny per dodané assety usera
4. ✅ Welcome card má dark-stone glassmorphism, **skull-arch crown** nahoře, 4 corner-tl ornaments (mirror), bone drop-cap "V", medailon vlevo
5. ✅ Sidebar levý + pravý + ADMINISTRACE = stone panely + iron edge + divider-skull mezi sekcemi (žádné corner ornaments)
6. ✅ Novinky panel = stone glassmorphism + 4 corner-tl ornaments (menší než welcome card)
7. ✅ NavItem má stone-tablet styling, hover má edge-light teal-glow (žádný shine sweep), active má recess-into-stone + radium-bright glow (statika, žádný flicker)
8. ✅ 7 nav ikon (uvodnik až hospoda) zobrazeno per `--asset-icon-*` proměnné, lucide SVG schované
9. ✅ Divider-skull mezi sekcemi v panelech
10. ✅ "PŘIDAT NOVINKU" + "+" v pravém panelu = CSS-only stone-tablet button (žádný custom asset), klik mikrointerakce scale
11. ✅ Ghost-pulse animace 8s loop běží na desktop/tablet shora (radial gradient z horní třetiny)
12. ✅ Drifting dust motes 3 částice 30s loop, opacity 0.15 (subtle)
13. ✅ Mobile (≤768px): topbar icon-only, drawer mode, medailon 120×144, corner-welcome 56×56, dust motes hidden
14. ✅ Reduced motion vypne všechny animace kromě klik scale
15. ✅ WCAG AA kontrast na všech text/bg kombinacích (`npm run audit:contrast` projde)
16. ✅ Forced colors fallback aktivní
17. ✅ Existing skiny (pergamen, hospoda, příroda, zlatý standard atd.) **bez regrese** (Storybook gallery vizuální check)
18. ✅ TypeScript build projde (`npm run build`)
19. ✅ Lint projde (`npm run lint`)
20. ✅ `lint:colors` projde (žádné hardcoded barvy mimo `index.ts` tokens — všechno přes `var(--theme-*)` nebo `var(--*)`)

---

## 7. Test plán

### 7.1 Automatizované
- `npm run lint` — ESLint clean
- `npm run lint:colors` — žádné hardcoded barvy v decorations.css
- `npm run build` — TS + Vite build clean
- `npm run test` — existing 36+ unit testů pro themes (registry, applyTheme, useTheme) musí projít
- `npm run audit:contrast` — WCAG AA pro nemrtvi theme

### 7.2 Smoke test (manuální)
1. **Storybook gallery** — `npm run storybook` → Themes → Gallery → All Themes — nemrtvi vypadá per reference, ostatní 21 skinů beze změny
2. **Live dashboard** — switch do nemrtvi skinu, ověřit:
   - Topbar solid blackened iron, iron hairline
   - Logo + medailon zobrazeny
   - Welcome card má skull-arch crown nahoře, 4 corner-tl rohy, bone drop-cap "V"
   - Sidebary mají stone-tablet frame + divider-skull mezi sekcemi
   - NavItem hover (teal edge-light) / active (recess-into-stone + radium glow)
   - 7 nav ikon viditelných místo lucide
   - "+" CTA + klik mikrointerakce
   - Ghost-pulse subtle visible shora
   - Dust motes drifting
3. **Responsivita** (Chrome DevTools):
   - 1920×1080 (desktop) — plný layout
   - 1280×800 (laptop) — plný layout
   - 1024×768 (tablet) — corners zmenšeny
   - 768×1024 (tablet portrait) — drawer mode
   - 414×896 (mobile L) — dust motes hidden, medailon zmenšen
   - 320×568 (mobile S) — hamburger menu
4. **Reduced motion** (system preference) — všechny animace zastavené, klik scale zachováno
5. **Forced colors** (Windows high contrast) — UI funkční, ornamenty neztrácí význam
6. **Mobil-desktop skill** — po dokončení spustit per project rule

---

## 8. Riziko & rollback

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|---|---|---|---|
| Skull-arch asset crown na welcome cardu vypadá pohřebně-až-moc (over-the-top) | nízká | nízká | Live test; pokud přespíli, zmenšit výšku z 96 na 72px desktop |
| Glassmorphism na welcome + novinky způsobí GPU strain při kombinaci s ghost-pulse | nízká | střední | Ghost-pulse je jen 1 element s opacity, glassmorphism jen 2 panely → akceptovatelné. Test na low-end mobile. |
| Ghost-pulse "double-green" nad backgroundem co už má teal-flames | střední | nízká | Subtle opacity 0.13–0.22 + radial-gradient z horní třetiny (background má zelenou v dolní polovině) → minimální překryv |
| Bone drop-cap "V" vypadá generic vs. pergamen "V" | střední | nízká | Multi-stack text-shadow s ghost-glow + UnifrakturCook je vizuálně dost odlišný od pergamen Petit Formal Script |
| `IM Fell DW Pica` body font je s ink-bleed příliš obtížně čitelný v malých velikostech | střední | střední | Test na 14px+; pokud problém, fallback na `IM Fell English` (cleaner cut) nebo zvýšit `font-size` o 1px |
| Asset pipeline `cwebp` selže na novém masteru | nízká | střední | Pergamen + hospoda pipeline funguje, pattern stejný |

**Rollback plán** — git revert PR; pokud už mergeováno, nový PR co vrací `decorations.css` a `index.ts` na předchozí stav (22 + 51 řádků). Žádný BE / data dopad.

---

## 9. Otázky k autorovi

Žádné — všechny klíčové otázky odpovězeny v Q&A 1–10 (2026-05-10):

- ✅ Q1 Concept: KOSTNICE (Ossuary) — bones-as-architecture, ghost-green, statika
- ✅ Q2 Logo font: UnifrakturCook
- ✅ Q3 Palette: Hybrid teal-ghost (#5fc8a8) klid / radium-bright (#7cffae) hover/active
- ✅ Q4 Display: New Rocker, Body: IM Fell DW Pica
- ✅ Q5a 10 assetů MVP set
- ✅ Q5b CSS-only votive (zatím out of scope této specu)
- ✅ Q5c Skull-arch jako asset (ne CSS-repeat)
- ✅ Q6 icon-hospoda akceptováno as-is
- ✅ Q7a B — corner ornaments na inner cards (welcome + novinky), ne page-frame
- ✅ Q7b A — skull-arch top only ("vstup do krypty")
- ✅ Q7c A — bone drop cap "V"
- ✅ Q8 B — corner-tl na welcome + novinky
- ✅ Q9 A — minimální motion (ghost-pulse + dust + hover edge-light)
- ✅ Q10 A — single PR, kompletní skin v jednom kroku

---

## 📋 Po schválení specu — další kroky

1. **Implementační plán** — `phase-1/plan-1.0k.md` s konkrétními file diffs, CSS snippets, testovacími kroky
2. **Implementace** (single PR per Q10 A):
   - Asset finalize script (`scripts/finalize-nemrtvi-assets.mjs`) → 10 PNG → 10 WebP v `public/themes/nemrtvi/decor/`
   - `index.ts` přepsání tokens + fonts + asset URLs
   - `decorations.css` přepsání (z 22 řádků na ~700+ řádků per pergamen pattern)
   - Google Fonts URLs do `index.html` (UnifrakturCook + New Rocker + IM Fell DW Pica)
   - Storybook check + WCAG audit
   - **Mobil-desktop skill** spuštění po dokončení (per project rule)

**Autor čeká na schválení této specifikace.**
