# Spec 1.0j — Hospoda visual upgrade

**Status:** 📝 Draft — čeká na souhlas
**Datum:** 2026-05-10
**Rozsah:** FE skin upgrade — `[data-theme="hospoda"]` izolace, žádný globální dopad
**Repo:** `Projekt-ikaros-FE`, větev `feat/krok-1.0j-hospoda-upgrade`
**Velikost:** odhad ~3 soubory změna (`index.ts`, `decorations.css`, `public/themes/hospoda/`) + 11 nových assetů
**Autor:** PJ + Claude
**Souvisí:** [spec-1.0i-pergamen-upgrade.md](spec-1.0i-pergamen-upgrade.md) (předloha pattern + asset pipeline), [spec-1.0h-priroda-upgrade.md](spec-1.0h-priroda-upgrade.md), [spec-1.0b-theme-visuals.md](spec-1.0b-theme-visuals.md)

**Reference:**
- `assets-source/themes/references/hospoda.png` — cílový vzhled (mockup)
- `assets-source/themes/backgrounds/hospoda.png` — background, **neměníme**
- `assets-source/themes/hospoda/logo.png` — finální logo (dodá user)
- `assets-source/themes/hospoda/medailon.png` — heraldický banner s orlem (dodá user)

---

## 0. Princip — žijící krčma s warm hearth atmosférou

> **Středověká krčma "U Letícího Orla" v okamžiku doznívajícího ohně. Krb dohořívá, svíčky doleva, korbel napůl vypitý, kostky ještě teplé od posledního hodu. Skin musí *dýchat* — warm hearth glow zespoda, dubové trámy, kovaná mosaz, vínová heraldika, krčmářský papír s ohnutými rohy.**

**Inspirační kotvy:** Skyrim taverna interior × Witcher 3 hospoda U Tří Sviní × historické krčmářské cedule 14.–17. století × Stardew Valley saloon (warm cozy palette). **NE** Hogwarts Tří košťata. **NE** generic D&D inn. **NE** Disney medieval kitsch. **NE** moderní bar.

**Strict isolation:** vše scoped přes `[data-theme="hospoda"]`. Zbylých 20 témat = nulová regrese. (Memory rule: žádné sdílení / recyklace ornamentů s pergamen ani jinými skiny — hospoda má vlastní vizuální slovník.)

---

## 1. Cíl

Po `themeId === 'hospoda'` má dashboard vypadat dle reference (`hospoda.png`): tmavé dubové panely s mosazným kováním, ohnutý krčmářský papír uprostřed jako welcome card, heraldický banner s orlem místo medailonu, fixní spodní pás s atmosférickým stolem (kostky, mince, mapa), warm hearth pulse zespoda. Vše izolované, bez dopadu na ostatní skiny.

---

## 2. Kontext / motivace

- Pergamen (1.0i) zavedl asset pipeline a corner-ornament pattern. Hospoda je další skin, který tento pattern rozšiřuje.
- Současný `decorations.css` má jen 16 řádků základu (pouze background tint + card frame). Skin neodlišený, vypadá jako varianta default tématu.
- User chce, aby hospoda byla **vizuálně dramatická a žijící** — odlišení od pergamen skinu (oba mají burgundy + parchment, ale jiný feel: pergamen = klášter / hospoda = krčma).
- Po dokončení bude 7 skinů s "asset-grade" upgradem (zlatý standard, sci-fi, bílá, modré nebe, vesmírná loď, příroda, pergamen, hospoda) → projekt bližší dokončené Fázi 1.

---

## 3. Audit současného stavu

### 3.1 Theme registry & tokens
- [`src/themes/themes/hospoda/index.ts`](../../../src/themes/themes/hospoda/index.ts) — existuje, definuje základní paletu (burgundy `#8a1520`, parchment `#e8d4a0`, gold `#c8800a`, dark wood `#3a1e08`), fonty (Almendra logo, Lora display+body), thumbnail a background. **Nutné rozšíření:** dodatečné tokens pro hospoda-specifické materiály (hearth, ale, iron, brass).
- Background `--asset-...` proměnné aktuálně chybí — nutné přidat při zavedení assetů.

### 3.2 Decorations
- [`src/themes/themes/hospoda/decorations.css`](../../../src/themes/themes/hospoda/decorations.css) — 16 řádků, jen jednoduchý background gradient + card border. **Žádné panely, žádné NavItem styly, žádné dekorace, žádné mikrointerakce.** Skin viditelně nedokončený.

### 3.3 Asset folder
- `assets-source/themes/hospoda/` — prázdný (user dodá logo + medailon)
- `assets-source/themes/backgrounds/hospoda.png` — ✅ existuje (krčmářský interiér, krb, sudy, lampy)
- `public/themes/backgrounds/hospoda.webp` — ✅ existuje (build pipeline output)
- `public/themes/hospoda/decor/` — neexistuje (nutno vytvořit)

### 3.4 Předchozí stručný design doc
- [`docs/themes/hospoda.md`](../../themes/hospoda.md) — staří vize (cechovní banner SVG, plakát "DNEŠNÍ SPECIÁL", taverní vyhlášky). **Bude přepsán** podle dnešních rozhodnutí.

### 3.5 Pergamen jako pattern předloha
- [`src/themes/themes/pergamen/decorations.css`](../../../src/themes/themes/pergamen/decorations.css) — 743 řádků, struktura sekcí 1–23 (background overlay → topbar → logo → header buttons → glass panels → corner ornaments → welcome card → medailon → bookmark → section title → NavItem → right panel → PJ badge → first-letter → nav icons → novinky → showmore → focus visible → scrollbar → tablet → mobile → reduced motion → forced colors). **Hospoda použije stejnou strukturu**, ale s vlastní materiálovou a ornamentální paletou.

---

## 4. Návrh řešení

### 4.1 Background & atmosféra
- **Background image** — `/themes/backgrounds/hospoda.webp` (✅ existuje, neměníme)
- **Atmosférický overlay** — pure linear darken pro čitelnost UI (background je teplý/oranžový, vyhnout se "double-warm"):
  ```css
  '--theme-bg-overlay':
    'linear-gradient(180deg, rgba(20, 12, 4, 0.55) 0%, rgba(20, 12, 4, 0.72) 100%)'
  ```
- **🎨 Hearth pulse animace** (signature element):
  - `[data-theme="hospoda"][data-shell="ikaros"]::after` — radial-gradient záře zespoda obrazovky
  - `background: radial-gradient(ellipse at 50% 100%, rgba(255, 178, 96, 0.42) 0%, rgba(255, 112, 40, 0.18) 35%, transparent 65%);`
  - `animation: hearth-breathe 6s ease-in-out infinite;` — opacity 0.55 → 1.0 → 0.55 (efektivně 0.25 → 0.45 reálné opacity)
  - `pointer-events: none; z-index: 0;`
  - **Reduced-motion vypíná** (sekce 4.13)

### 4.2 Topbar (slim, 56px) — solidní těžký dub
- Pozadí: tmavý dubový gradient + viditelná wood-grain texture (CSS only):
  ```css
  background:
    linear-gradient(180deg, #2c1a0a 0%, #1a0e06 100%),
    repeating-linear-gradient(90deg, transparent 0, transparent 40px, rgba(74, 46, 21, 0.08) 40px, rgba(74, 46, 21, 0.08) 41px);
  ```
- **Žádný backdrop-filter** (per brainstorming — solidní těžký dub, žádné prosvítání backgroundu)
- Logo vlevo z `logo.png`: šíře `--asset-logo-w: 240px` desktop / `180px` tablet / `140px` mobile
- **Mosazná hairline** pod topbarem (1px, gradient z `transparent → brass-base #8a6428 → transparent`, opacity 0.55)
- Pravé tlačítka (POŠTA, UŽIVATELÉ, ZLATÝ STANDARD, TYKY, ODHLÁSIT) = **dřevěné cedulky s mosazným okrajem**:
  - Background: tmavý dub gradient
  - Border: 1px brass `#8a6428`
  - Text: amber `#d4a050` uppercase Cinzel Decorative, letter-spacing 0.12em
  - Hover: brass border bright `#d4a050`, text `#ffb260`, jemný brass glow shadow
  - Active state: vínový gradient `#8a1520 → #4a0810` + amber border (administrace zvýraznění)
- **Mobile (≤768px)**: ikony only, label hidden přes `aria-label`
- **Mobile (≤480px)**: TYKY + ODHLÁSIT do hamburger drawer (existující pattern)

### 4.3 Sidebar levý — NAVIGACE / VESMÍRY / CHAT (a HOSPODA tlačítko)
- Frame: tmavě dubový panel s **vyřezávanými rohy + železným pásem**:
  - Background: `linear-gradient(160deg, rgba(44, 26, 10, 0.92) 0%, rgba(28, 18, 8, 0.96) 100%)`
  - Border: 1px iron-cold `#2a2620`
  - Box-shadow inner: 1px brass `rgba(138, 100, 40, 0.18)` glow
  - Box-shadow outer: deep `0 6px 22px rgba(20, 12, 4, 0.65)`
- **Corner ornaments** (`corner-tl.png` master, mirror přes CSS scaleX/Y na ostatní 3 rohy) — vyřezávaný dub + železný pás + 3 mosazné hřeby
- **Section titles** ("NAVIGACE", "VESMÍRY", "CHAT") — Cinzel Decorative, uppercase, brass `#d4a050` s shadow:
  ```css
  color: var(--theme-accent-brass-shine);
  letter-spacing: 0.20em;
  text-shadow: 0 1px 2px rgba(20, 12, 4, 0.7);
  ```
- **Iron clasp dividery** mezi sekcemi — `iron-clasp-divider.png` (200×24, tenký železný pás + 2 nity), opacity 0.85
- **NavItem** (každá položka):
  - Klid: `linear-gradient(180deg, rgba(44, 26, 10, 0.90) 0%, rgba(28, 18, 8, 0.95) 100%)` + 1px brass border + inset highlight
  - **Žádné mosazné hřeby v rozích** (per brainstorming — vyřezávané dřevo + jen kovaný okraj)
  - Hover: brass border bright `#d4a050`, text `#ffb260`, **brass shine sweep** (CSS animation pseudo-element)
  - Active: vínový fill (`rgba(138, 21, 32, 0.45)`) + 2px amber left border + amber glow + **candle flicker** animation (3s offset glow)
  - Text: Cinzel Decorative uppercase, krémová `#e8d4a0`
  - Před textem: unikátní ikona (1 z 7, viz 4.7)

### 4.4 Welcome card — přibitý krčmářský papír s ohnutými rohy

- **Min-height** `clamp(420px, 60vh, 720px)` (stejně jako pergamen)
- **Materiál**: krčmářský papír, světlý vinttage parchment:
  ```css
  background:
    radial-gradient(ellipse at 50% 35%, #f0deaa 0%, #e0c890 60%, #b89858 100%);
  ```
- **Ohnuté rohy** (CSS-only — pseudo-elements + clip-path nebo background gradients):
  - 4 rohy (TL/TR/BL/BR) mají subtle "ohnutý papír" stín simulovaný `::before` overlay s diagonal gradient
  - Asset-free implementation
- **4 mosazné hřeby v rozích** — `::before/::after` pseudo-elements s circular gradient (no asset)
  - 8px průměr, brass `#8a6428` core + brass-shine `#d4a050` highlight + dark `#1a0e04` shadow
  - Position: `top: 12px; left: 12px;` (a další 3 rohy zrcadlené)
- **Border**: 1px ink-stained `#604030`, žádný brass border (papír je *nalepený*, ne rámovaný)
- **Box-shadow**: deep `0 8px 28px rgba(20, 12, 4, 0.7)` — papír vrhá stín na "stůl"
- **Heraldický banner** vlevo z `medailon.png` (orel na vínovém poli):
  - `width: 250px; height: 340px;` desktop / `100px × 136px` mobile
  - Position: vertikální orientace, vlevo cardu (per reference)
  - **🎨 Banner flutter** mikroanimace — `transform: scaleY(1.0)` → `scaleY(0.985)` → `scaleY(1.0)`, 6s loop, slow ease (subtle, ne agresivní)
  - Drop-shadow: `0 6px 14px rgba(20, 12, 4, 0.6)`
- **Heading** `Vítej v <span class="titleAccent">Projektu Ikaros.</span>`:
  - Wrapper třída: existující `welcomeTitle`
  - Color: tmavý inkoust `#2a1808`
  - Font: IM Fell English SC (display, slim cap-height)
  - "Projektu Ikaros." accent: vínová `#8a1520` italic IM Fell English script
  - **Text-shadow** subtle: `0 1px 0 rgba(255, 240, 200, 0.4)` (výška papíru)
  - **Žádný drop-cap "V"** (per brainstorming — čistý welcome card, žádné CSS-only V)
- **Body paragraphs** — Lora regular, ink color `#2a1808`
- **Signature** "Příjemnou zábavu přejí administrátoři." — IM Fell English italic, vínová `#8a1520`, mírný shadow
- **Žádný korbel + svíčka decoration** (per brainstorming — čistý card)
- **Žádný knižní záložka** (to je pergamen-only signature)
- **Žádný big-book backdrop** (to je pergamen-only)

### 4.5 Sidebar pravý — ADMINISTRACE / MOJE DISKUZE / MOJE SVĚTY

- Stejný dřevěný panel pattern jako levý (4.3) + corner ornaments + železné spony
- "MOJE DISKUZE" + "MOJE SVĚTY" sekce s **mosazným razidlem** ("+" tlačítko):
  - Asset `brass-stamp-ikaros.png` (64×64 master, render 28×28 v UI) — mosazný kruh s vyraženým orlem
  - Klikem mikrointerakce **scale 0.92 → 1.0** během 150ms (přitisknutí razidla)
  - Border: brass `#8a6428`
  - Box-shadow: brass glow při hover
- "MATRIX PJ" / "NOVÝ SVĚT PJ" tlačítka = dřevěné cedulky s vínovou kapkou (PJ badge) v rohu
- "ZOBRAZIT VŠE →" — **bez razidla** (link, ne action button) — pure brass underline + amber text
- **PJ badge** (`data-pj-badge`) — vínový bg `#8a1520` + brass border + amber text "PJ", subtle brass glow

### 4.6 Novinky panel (dole)

- Materiál: tmavá dubová deska s železnými cvočky (NE krčmářský papír — to je welcome card)
- Background: `linear-gradient(180deg, #2c1a0a 0%, #1a0e06 100%)` + wood-grain repeating overlay
- Border: 1px iron-warm `#3a3128`
- 4 corner ornaments (stejné jako sidebar)
- **Heading "Novinky"** — Cinzel Decorative uppercase, brass `#d4a050`, doprovázený lucide `Newspaper` ikonou s brass barvou
- **Empty state** "Zatím žádné novinky." — Lora italic, parchment-stained `#a08850`, opacity 0.85
- **"PŘIDAT NOVINKU" tlačítko** = dřevěná cedulka + **mosazné razidlo** (sdílený asset s pravým panelem):
  - Background stejný jako NavItem (dřevo)
  - Před textem: razidlo `brass-stamp-ikaros.png` (28×28 desktop / 22×22 mobile) přes `::before`
  - Hover: brass border bright + amber glow text
  - Klik: scale mikrointerakce (přitisknutí)

### 4.7 Navigační ikony — 7 unikátních krčmářských motivů

Stejný pattern jako pergamen (skrýt lucide SVG, render asset přes `data-nav-key` selector + `--asset-icon-*` proměnné):

| Nav-key | Asset | Symbol | Význam |
|---|---|---|---|
| `uvodnik` | `icon-uvodnik.png` | kovaná lampa s teplým světlem | krčmářské vítání |
| `vytvorit-svet` | `icon-vytvorit-svet.png` | brk + kalamář na pergamenu | psaní kroniky |
| `diskuze` | `icon-diskuze.png` | dva ťukající si korbely | konverzace u stolu |
| `clanky` | `icon-clanky.png` | složený dopis s voskovou pečetí | doručené zprávy |
| `galerie` | `icon-galerie.png` | dřevěný portrétní rám | obrazy na stěně |
| `napoveda` | `icon-napoveda.png` | otevřená kniha s lampou | nápovědný svazek |
| `hospoda` | `icon-hospoda.png` | pivní sud s mosazným kohoutem | krčma sama |

Velikost render: 22×22 desktop / 18×18 mobile, `filter: drop-shadow(0 0 3px var(--theme-glow-amber))`

### 4.8 🎨 Spodní pás se stolem (signature decoration)

- **Asset** `decor-table-clutter.png` (1200×100, transparentní top) — atmosférický stůl: kostky d20, 4–5 zlatých mincí, svinutá mapa, džbán, otevřená kniha s perem, malý korbel
- **Pozice**: `position: fixed; bottom: 0; left: 0; right: 0; height: 100px;`
- **Background-image**: `var(--asset-table-clutter)`, `background-size: cover; background-position: bottom center;`
- **Z-index**: `5` — pod modaly (modaly mají z-index 100+) ale nad běžným contentem
- **Pointer-events**: `none` — pure dekorace
- **Mobile (≤768px)**: `display: none` (per brainstorming — výška viewportu drahá)
- **Tablet (769–1279px)**: `height: 80px` (zmenšené)
- **Body padding-bottom**: `100px` (desktop) / `80px` (tablet) / `0` (mobile) — aby content nebyl pod pásem skrytý

### 4.9 Mikrointerakce & animace

| Element | Animace | Délka | Reduced-motion |
|---|---|---|---|
| Hearth pulse zespoda | radial-gradient opacity 0.55→1.0→0.55 | 6s loop | vypnuto |
| Heraldický banner | scaleY 1.0→0.985→1.0 | 6s loop | vypnuto |
| Active NavItem | candle flicker (offset glow) | 3s loop | vypnuto |
| CTA hover | brass shine sweep (linear-gradient přejíždí přes border) | 800ms one-shot | vypnuto |
| Razidlo CTA klik | scale 0.92→1.0 | 150ms | zachováno (UX feedback) |
| Welcome card → focus | žádné | — | — |

### 4.10 Typografie

| Role | Font | Důvod |
|---|---|---|
| Logo (header) | Almendra (existing) | Středověký serif, baked-in v logo asset |
| Display / heading | **Cinzel Decorative** | Slavnostní vyřezávaný feel |
| Welcome heading | **IM Fell English SC** | Renaissance tavern menu |
| Body | Lora (existing) | Čitelný serif |
| "Krčmářské cedule" (signature) | IM Fell English italic | Ručně psaný feel |
| Body cézlí (popisky) | Lora italic | Intim |

> **Žádný Henny Penny / Caveat Brush** — sice navrhováno v brainstormingu, ale aktuálně bez explicitního použití. Pokud spec rozhodne přidat, doplní se v impl. plánu (jen jeden font, na "Žádné diskuze" empty state).

### 4.11 Theme tokens — rozšíření `index.ts`

Přidá se k existujícím tokens:

```typescript
'--theme-hearth-deep':       '#1a0f06',
'--theme-hearth-wood':       '#2c1a0a',
'--theme-hearth-wood-warm':  '#4a2e15',
'--theme-hearth-bronze':     '#7a5028',
'--theme-hearth-amber':      '#d4944a',
'--theme-hearth-glow':       '#ffb260',
'--theme-hearth-flame':      '#ff7028',

'--theme-parch-warm':        '#f0deaa',
'--theme-parch-aged':        '#e8d4a0',
'--theme-parch-stained':     '#c8a878',

'--theme-banner-burgundy':       '#8a1520',
'--theme-banner-burgundy-bright':'#b01828',

'--theme-ale-foam':  '#f4e8c4',
'--theme-ale-amber': '#c0843e',
'--theme-ale-dark':  '#6b3a14',

'--theme-iron-cold':  '#2a2620',
'--theme-iron-warm':  '#3a3128',

'--theme-brass-base':  '#8a6428',
'--theme-brass-shine': '#d4a050',

/* Asset URLs (vyplní se po dodání assetů) */
'--asset-logo':            'url(/themes/hospoda/decor/logo.webp)',
'--asset-medailon-banner': 'url(/themes/hospoda/decor/medailon.webp)',
'--asset-corner':          'url(/themes/hospoda/decor/corner-tl.webp)',
'--asset-icon-uvodnik':    'url(/themes/hospoda/decor/icon-uvodnik.webp)',
'--asset-icon-vytvorit-svet': 'url(/themes/hospoda/decor/icon-vytvorit-svet.webp)',
'--asset-icon-diskuze':    'url(/themes/hospoda/decor/icon-diskuze.webp)',
'--asset-icon-clanky':     'url(/themes/hospoda/decor/icon-clanky.webp)',
'--asset-icon-galerie':    'url(/themes/hospoda/decor/icon-galerie.webp)',
'--asset-icon-napoveda':   'url(/themes/hospoda/decor/icon-napoveda.webp)',
'--asset-icon-hospoda':    'url(/themes/hospoda/decor/icon-hospoda.webp)',
'--asset-table-clutter':   'url(/themes/hospoda/decor/decor-table-clutter.webp)',
'--asset-iron-clasp':      'url(/themes/hospoda/decor/iron-clasp-divider.webp)',
'--asset-brass-stamp':     'url(/themes/hospoda/decor/brass-stamp-ikaros.webp)',
```

### 4.12 Asset list — **11 nových** + **2 user-supplied**

| # | Asset | Účel | Velikost (master) | Source |
|---|---|---|---|---|
| 1 | `logo.png` | Header logo | per pergamen pattern (~480×96) | **User dodá** |
| 2 | `medailon.png` | Heraldický banner s orlem | ~500×680 (vertical) | **User dodá** |
| 3 | `corner-tl.png` | Master TL roh, mirror na ostatní | 256×256 | **AI gen** |
| 4 | `icon-uvodnik.png` | Lampa s teplým světlem | 128×128 | **AI gen** |
| 5 | `icon-vytvorit-svet.png` | Brk + kalamář | 128×128 | **AI gen** |
| 6 | `icon-diskuze.png` | Dva ťukající korbely | 128×128 | **AI gen** |
| 7 | `icon-clanky.png` | Dopis s voskovou pečetí | 128×128 | **AI gen** |
| 8 | `icon-galerie.png` | Dřevěný portrétní rám | 128×128 | **AI gen** |
| 9 | `icon-napoveda.png` | Otevřená kniha s lampou | 128×128 | **AI gen** |
| 10 | `icon-hospoda.png` | Pivní sud s mosazným kohoutem | 128×128 | **AI gen** |
| 11 | `decor-table-clutter.png` | Atmosférický spodní pás | 1200×120 | **AI gen** |
| 12 | `iron-clasp-divider.png` | Železný pás + 2 nity | 240×32 | **AI gen** |
| 13 | `brass-stamp-ikaros.png` | Mosazné razidlo s orlem | 128×128 | **AI gen** |

**Asset pipeline** (existující `npm run themes:optimize`):
- PNG masters → WebP `cwebp -q 90 -alpha_q 100` → `public/themes/hospoda/decor/*.webp`
- Žádné nové sharp transformace — corner mirror dělá CSS scaleX/Y (per pergamen pattern)

### 4.13 Responsivita (desktop / tablet / mobile)

| Breakpoint | Změny |
|---|---|
| **Desktop** (≥1280px) | Plný layout, banner 250×340, corner 128×128, table-clutter 1200×100, hearth pulse aktivní |
| **Tablet** (1024–1279px) | Corner zmenšený na 96×96, banner zachován, table-clutter 1200×80 |
| **Tablet narrow** (769–1023px) | NavItem padding zúžen, table-clutter zachován |
| **Mobile** (≤768px) | Header buttons icon-only, drawer mode, banner 100×136, corner 64×64, **table-clutter `display: none`**, body padding-bottom = 0 |
| **Mobile small** (≤480px) | TYKY + ODHLÁSIT do hamburger drawer (existující pattern) |

### 4.14 Accessibility

- **Focus visible** — wrapper `:focus-visible` na všech interaktivních prvcích:
  ```css
  outline: none;
  box-shadow:
    0 0 0 2px var(--bg-primary),
    0 0 0 4px var(--theme-accent-brass-shine),
    0 0 14px var(--theme-glow-amber-strong);
  ```
- **Reduced motion** — `@media (prefers-reduced-motion: reduce)` vypne hearth pulse, banner flutter, candle flicker, brass shine sweep. Zachová se jen razidlo scale (UX feedback nutný).
- **Forced colors** — `@media (forced-colors: active)` fallback pro corner ornaments + ikony (`forced-color-adjust: none`)
- **WCAG AA kontrast** — všechny text/bg kombinace ověřit přes `npm run audit:contrast`:
  - Tmavý ink `#2a1808` na parch-warm `#f0deaa` = ✅ ~13:1
  - Brass `#d4a050` na hearth-wood `#2c1a0a` = ✅ ~7.5:1
  - Banner-burgundy `#8a1520` na parch-warm `#f0deaa` = ✅ ~6.8:1
- **Touch target ≥48px** na mobile — NavItem min-height 48px

### 4.15 Performance

- **CSS-only animace** (no JS) — opacity/transform = GPU-friendly
- **WebP assety** s 90 quality + 100 alpha quality — dohromady odhadem 250–350 KB všech 11 assetů
- **Lazy-load** decorations.css (existující pattern přes `decorationsModule: () => import('./decorations.css')`)
- **No backdrop-filter** v topbaru (per brainstorming) → menší GPU stress

---

## 5. Out of scope

- **Background image** — neměníme (`hospoda.webp` zůstává)
- **Logo + medailon** — user dodává, prompty pro tyto **NEPÍŠEME**
- **Plakát "Dnešní speciál"** — vyloučeno z brainstormingu
- **Láhev IKAROS ALE** — vyloučeno z brainstormingu
- **Korbel + svíčka v welcome cardu** — vyloučeno z brainstormingu
- **CSS drop-cap "V"** — pergamen-only signature
- **Big-book backdrop** — pergamen-only signature
- **Knižní záložka** — pergamen-only signature
- **Zvukové efekty** (klink mince, oheň praská) — mimo scope tohoto specu, future enhancement
- **React komponenty** — žádná změna v `CornerOrnament`, `IkarosCard`, `IkarosLayout`, `DashboardPage`, `RightPanel`, `NovinkyPanel` (čisto CSS upgrade přes `[data-theme="hospoda"]`)
- **Backend** — žádný BE dopad

---

## 6. Acceptance kritéria

1. ✅ Po `themeId === 'hospoda'` se aplikuje upgrade — žádný globální dopad
2. ✅ Topbar je solidní těžký dub (no transparency, žádný backdrop-filter)
3. ✅ Logo + heraldický banner zobrazeny per dodané assety usera
4. ✅ Welcome card má světlé krčmářské pozadí, ohnuté rohy (CSS pseudo), 4 mosazné hřeby (CSS pseudo), heraldický banner vlevo
5. ✅ Sidebar levý + pravý + Novinky panel mají dřevěný frame + 4 corner ornaments (mirror)
6. ✅ NavItem má vyřezávané dřevo + mosazný okraj, žádné hřeby v rozích, hover má brass shine sweep, active má amber glow + candle flicker
7. ✅ 7 nav ikon (uvodnik až hospoda) zobrazeno per `--asset-icon-*` proměnné, lucide SVG schované
8. ✅ Iron clasp divider mezi sekcemi v panelech
9. ✅ "PŘIDAT NOVINKU" + "+" v pravém panelu má mosazné razidlo místo lucide Plus, klik mikrointerakce scale
10. ✅ Spodní pás se stolem fixed full-width na desktop/tablet, **hidden na mobile** (≤768px), body má correct padding-bottom
11. ✅ Hearth pulse animace 6s loop běží na desktop/tablet
12. ✅ Banner subtle flutter 6s loop
13. ✅ Mobile (≤768px): topbar icon-only, drawer mode, table-clutter hidden, banner 100×136, corner 64×64
14. ✅ Reduced motion vypne všechny animace kromě razidla
15. ✅ WCAG AA kontrast na všech text/bg kombinacích (`npm run audit:contrast` projde)
16. ✅ Forced colors fallback aktivní
17. ✅ Existing skiny (pergamen, příroda, zlatý standard atd.) **bez regrese** (Storybook gallery vizuální check)
18. ✅ TypeScript build projde (`npm run build`)
19. ✅ Lint projde (`npm run lint`)
20. ✅ `lint:colors` projde (žádné hardcoded barvy mimo `index.ts` tokens — všechno přes `var(--theme-*)`)

---

## 7. Test plán

### 7.1 Automatizované
- `npm run lint` — ESLint clean
- `npm run lint:colors` — žádné hardcoded barvy v decorations.css
- `npm run build` — TS + Vite build clean
- `npm run test` — existing 36 unit testů pro themes (registry, applyTheme, useTheme) musí projít
- `npm run audit:contrast` — WCAG AA pro hospoda theme

### 7.2 Smoke test (manuální)
1. **Storybook gallery** — `npm run storybook` → Themes → Gallery → All Themes — hospoda vypadá per reference, ostatní 20 skinů beze změny
2. **Live dashboard** — switch do hospoda skinu, ověřit:
   - Topbar solid dub, mosaz hairline
   - Logo + banner zobrazeny
   - Welcome card má ohnuté rohy + 4 hřeby + banner vlevo + tmavý text
   - Sidebary mají dřevěný frame + 4 corner ornaments
   - NavItem hover/active stavy
   - Razidla na "+" tlačítkách + klik mikrointerakce
   - Spodní pás se stolem na desktop
   - Hearth pulse subtle viditelný
3. **Responsivita** (Chrome DevTools):
   - 1920×1080 (desktop) — plný layout
   - 1280×800 (laptop) — plný layout
   - 1024×768 (tablet) — table-clutter zachován, corner zmenšen
   - 768×1024 (tablet portrait) — drawer mode
   - 414×896 (mobile L) — table-clutter hidden, banner 100×136
   - 320×568 (mobile S) — hamburger menu
4. **Reduced motion** (system preference) — všechny animace zastavené, razidlo zachováno
5. **Forced colors** (Windows high contrast) — UI funkční, ornamenty neztrácí význam

---

## 8. Riziko & rollback

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|---|---|---|---|
| User dodá medailon kruhový místo bannerového | střední | střední — banner je signature element | Před implementací ověřit dodaný asset; pokud kruh, upgrade specu nebo CSS konvert na vertikální orientaci |
| Hearth pulse "double-warm" nad teplým backgroundem | nízká | nízká — over-saturated dolní hrana | Overlay testovat v dev; opacity tunning podle vizuálního výsledku |
| AI generované assety mají generic look | střední | vysoký | Detailní prompty s explicit "NE" zákazy (per pergamen pattern); 2–3 iterace per asset |
| Spodní pás `position: fixed` překrývá content scroll bar nebo sticky elementy | nízká | nízká | `z-index: 5`, `pointer-events: none`, body `padding-bottom: 100px` — testovat na všech rozlišeních |
| Banner flutter animation způsobí motion sickness | velmi nízká | nízká | Subtle (scaleY ±1.5%), 6s slow ease, vypnuto v reduced-motion |
| Asset pipeline (sharp WebP) selže na novém masteru | nízká | střední | Pergamen pipeline funguje, pattern stejný |

**Rollback plán** — git revert PR; pokud už mergeováno, nový PR co vrací `decorations.css` a `index.ts` na předchozí stav (16 řádků). Žádný BE / data dopad.

---

## 9. Otázky k autorovi

Žádné, autor delegoval. Klíčová rozhodnutí přes brainstorming (2026-05-10):

- ✅ Heraldický banner místo medailonu (signature element)
- ✅ Spodní pás se stolem fixní full-width zespoda viewportu, mobile hidden
- ✅ Hearth pulse animace 6s loop, opacity 0.25–0.45 (střední intenzita)
- ✅ Topbar = solidní těžký dub, no transparency
- ✅ NavItemy = vyřezávané dřevo + mosazný okraj, bez hřebů
- ✅ Welcome card = přibitý krčmářský papír, ohnuté rohy (CSS), 4 mosazné hřeby (CSS)
- ✅ Primary CTA = mosazné razidlo s orlem (asset)
- ✅ Iron clasps = tenký železný pás + 2 nity (jednoduchý asset)
- ✅ Plakát + láhev + korbel/svíčka v cardu = vyloučeno
- ✅ Mobile table-clutter = skryto

---

## 📋 Po schválení specu — další kroky

1. **Asset prompty** — `phase-1/prompts-1.0j-hospoda-assets.md` s detailními ChatGPT/Midjourney prompty pro 11 AI assetů (style guide, paleta, "NE" zákazy, asset-by-asset prompty per pergamen pattern)
2. **Implementační plán** — `phase-1/plan-1.0j.md` s konkrétními file diffs, CSS snippets, testovacími kroky
3. **Implementace** — po souhlasu s plánem: `index.ts` rozšíření + `decorations.css` přepsání + asset pipeline + Storybook check + WCAG audit

**Autor čeká na schválení této specifikace.**
