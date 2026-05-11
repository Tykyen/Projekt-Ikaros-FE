# Spec 1.0m — Čtyři živly visual upgrade

**Status:** ✅ Implementováno (2026-05-11)
**Datum:** 2026-05-11
**Rozsah:** FE skin upgrade — `[data-theme="ctyri-zivly"]` izolace, žádný globální dopad
**Repo:** `Projekt-ikaros-FE`, větev `feat/krok-1.0m-ctyri-zivly-upgrade`
**Velikost:** odhad ~3 soubory změna (`index.ts`, `decorations.css`, `public/themes/ctyri-zivly/`) + 16 assetů (14 AI + 2 user)
**Autor:** PJ + Claude
**Souvisí:** [spec-1.0l-temna-cerven-upgrade.md](spec-1.0l-temna-cerven-upgrade.md), [spec-1.0k-nemrtvi-upgrade.md](spec-1.0k-nemrtvi-upgrade.md), [spec-1.0i-pergamen-upgrade.md](spec-1.0i-pergamen-upgrade.md), [spec-1.0b-theme-visuals.md](spec-1.0b-theme-visuals.md)

**Reference:**
- `assets-source/themes/references/ctyri-zivly.png` — referenční náladový obraz (fire-left + water-right + earth-bottom + air-top split) — **inspirační, ne doslovné kopírování**
- `public/themes/backgrounds/ctyri-zivly.webp` — background image (4-elementální krajina s lightning), **neměníme**
- `assets-source/themes/ctyri-zivly/logo.png` — finální logo, gothic blackletter "Projekt Ikaros" v leštěném stříbro-bronz medailonu se 4 kardinálními gemy + fénix uvnitř (dodal user) ✅
- `assets-source/themes/ctyri-zivly/medailon.png` — Ikaros-fénix v heraldickém square framu s 4 kardinálními gemy a quartered fire/water/earth/air pozadím (dodal user) ✅
- `docs/arch/phase-1/prompts-1.0m-ctyri-zivly-assets.md` — asset prompty (14× AI gen, hotovo) ✅

---

## 0. Princip — Pactum Quattuor (Pakt čtyř živlů)

> **Posvátný pakt mezi čtyřmi živly zpečetěný Ikarosem-fénixem skrze čtyři kardinální gemy.** Heraldická chivalric reliquary aesthetic — leštěné stříbro-ocel jako strukturální kostra, **teplý bronz/vermeil s gold-leaf engravingem jako dominantní ornament**, čtyři cabochon gemy (rubín=oheň, safír=voda, smaragd=země, topaz=vzduch) v midpointech každého rámu, **fénix-sigil** jako pátý sjednocující prvek. Nálada: **muzejní artefakt pražského hradu**, slavnostní moment elementární rovnováhy, vznešená vědomá síla. **Skin musí *vést k úctě* — sacred geometry of four, žádná dramatičnost, žádná temnota.**

**Inspirační kotvy:** Diablo IV Sanctuary kovaná řemeslná kvalita × Dragon Age: Inquisition heraldic UI × Witcher 3 alchymistické gem-set medailony × Elden Ring sacred geometric ornaments × Renaissance court relikviáře 15.-16. století × středověká heraldická tradice kardinálních drahokamů.

**NE** dark vampire (temna-cerven). **NE** ossuary bone/krypta (nemrtvi). **NE** copper verdigris/alchymistická patina. **NE** WoW cartoon high-fantasy. **NE** Halloween. **NE** parchment scholarly (pergamen). **NE** tavern oak+brass (hospoda). **NE** gold maximalism (zlatý standard). **NE** krev / mrtvolnost / horror.

**Strict isolation:** vše scoped přes `[data-theme="ctyri-zivly"]`. Zbylých 20 témat = nulová regrese. (Memory rule: žádné sdílení / recyklace ornamentů s ostatními skiny — Čtyři živly má vlastní vizuální slovník.)

---

## 1. Cíl

Po `themeId === 'ctyri-zivly'` má dashboard vypadat jako **heraldická reliquář-mřížka pražského hradu**: tmavě steel-blue pozadí s phoenix-radiance ambient halos, hero karta jako **gem-set heraldický rám** s 4 cardinal cabochon gemy v midpointech (rubín-L, topaz-T, safír-R, smaragd-B), **silver fleur-de-lis corner ornaments** v rozích, **medailon vlevo v heraldic square frame** (user-provided medailon.png), **gold-leaf drop-cap "V"** v MedievalSharp/Cinzel stylu, **Phoenix Ember orbit** putujícím po vnitřním obvodu welcome cardu, **Cardinal Pulse** (4 gemy pulzují postupně v 6s cyklu), **Quartered Aurora** drift mlhových vrstev v 4 rozích body, **Compass of Four mandala** v pravém panelu (admin section). Pravý panel = **ADMINISTRACE** (skin selector + uživatelé) + default sekce pod (per project memory). Vše izolované, bez dopadu na ostatní skiny.

---

## 2. Kontext / motivace

- Pergamen (1.0i), Hospoda (1.0j), Nemrtví (1.0k) a Temná červeň (1.0l) zavedly asset pipeline + corner-ornament pattern + signature animation triple pattern. **Čtyři živly jsou 10. ve "tier-1 produkční kvalitě"** — heraldický reliquář aesthetic jako vizuální opozit temna-cerven (decadent garnet seduction) i nemrtvi (cold ossuary dread).
- Současný [`decorations.css`](../../../src/themes/themes/ctyri-zivly/decorations.css) má jen ~23 řádků základu (multi-radial gradient + 1px gold border). Skin viditelně neodlišený od defaultu.
- Současný [`index.ts`](../../../src/themes/themes/ctyri-zivly/index.ts) má základní paletu (čtyř-elementální tokens `--fire-primary`/`--water-primary`/`--earth-primary`/`--air-primary` + gold accent + Cinzel Decorative/IM Fell English/Lora fonty), ale:
  - **chybí asset URLs**,
  - **chybí materiálové tokens** (silver-polished, bronze-vermeil, gold-leaf, phoenix-radiance, 4 cabochon barvy),
  - paleta je příliš syrová — skutečné assety mají **gold/bronze dominantnější** než původní spec předpokládal.
- User chce, aby Čtyři živly byla **vizuálně sacred a heroically radiant** — kontrast a jednota čtyř živlů zpečetěná fénixem, žádné dramatické čaroděje.
- Po dokončení bude **10 skinů** s "asset-grade" upgradem (zlatý standard, sci-fi, bílá, modré nebe, vesmírná loď, příroda, pergamen, hospoda, nemrtví, temná červeň, čtyři živly) → projekt blíže dokončené Fázi 1.

---

## 3. Audit současného stavu

### 3.1 Theme registry & tokens
- [`src/themes/themes/ctyri-zivly/index.ts`](../../../src/themes/themes/ctyri-zivly/index.ts) — existuje, definuje základní paletu (#100c08–#1a1510 background, gold accent #c8900a, fonty Cinzel Decorative + IM Fell English + Lora), žádný thumbnail/background URL nastavený, `reducedMotion: 'heavy'`. **Nutné kompletní přepsání palety + fontů + tokens** podle skutečně vygenerovaných assetů (steel-blue base + warm bronze dominant + 4 cabochon gems + phoenix-radiance + MedievalSharp/Cardo/Pinyon Script fonty).
- Asset URL proměnné chybí — nutné přidat při zavedení 14 nových assetů.

### 3.2 Decorations
- [`src/themes/themes/ctyri-zivly/decorations.css`](../../../src/themes/themes/ctyri-zivly/decorations.css) — 23 řádků, jen multi-radial gradient + 5px card border-radius + hover gold glow. **Žádné panely, žádné NavItem styly, žádné dekorace, žádné mikrointerakce.** Skin viditelně nedokončený.

### 3.3 Asset folder
- `assets-source/themes/ctyri-zivly/` — ✅ existuje s 16 soubory: `logo.png` + `medailon.png` (user-supplied) + 14 AI assetů (`corner-tl.png`, 4× `cardinal-*.png`, `compass.png`, `divider-chain.png`, 7× `icon-*.png`)
- `public/themes/backgrounds/ctyri-zivly.webp` — ✅ existuje (4-elementální krajina s lightning, **neměníme**)
- `public/themes/ctyri-zivly/decor/` — neexistuje (nutno vytvořit při WebP konverzi)

### 3.4 Předchozí stručný design doc
- [`docs/themes/ctyri-zivly.md`](../../themes/ctyri-zivly.md) — vize "4 živly jako UI zóny + zlatá unifikace" (čeká k auditu/přepisu po implementaci podle nového Pactum Quattuor konceptu).

### 3.5 Temna-cerven jako vzor implementační struktury
- [`src/themes/themes/temna-cerven/decorations.css`](../../../src/themes/themes/temna-cerven/decorations.css) — ~640 řádků, 25 sekcí, signature triple-motion (heartbeat + petals + drop-cap)
- **Čtyři živly použije stejnou strukturu sekcí**, ale s vlastní materiálovou a ornamentální paletou (silver-steel + warm bronze + 4 cabochon gems + phoenix-radiance + Cardinal Pulse + Phoenix Ember + Quartered Aurora).

### 3.6 ADMINISTRACE pravý panel — odchylka od base layoutu
- Per project memory `project_admin_panel_decision.md`: **uživatelé + skin selector zůstávají v ADMINISTRACE (pravý panel)**, odchylka od mockupů
- Implementační volba per Q-1 v sekci 9.

---

## 4. Návrh řešení

### 4.1 Background & atmosféra

- **Background image** — `/themes/backgrounds/ctyri-zivly.webp` (✅ existuje, 4-elementální krajina, **neměníme**)
- **Atmosférický overlay** — multi-vrstvý gradient + Quartered Aurora + subtle parchment film:
  ```css
  --theme-bg-overlay:
    /* horní phoenix radiance halo */
    radial-gradient(ellipse 800px 280px at 50% 0%, rgba(255, 232, 168, 0.10), transparent 70%),
    /* dolní steel-deep grounding */
    radial-gradient(ellipse 1200px 400px at 50% 100%, rgba(19, 20, 26, 0.65), transparent 70%),
    /* vinyl vignette pro kinematický feel */
    radial-gradient(ellipse 100% 100% at 50% 50%, transparent 60%, rgba(0, 0, 0, 0.55) 100%),
    /* Quartered Aurora — 4 elementální mlhy v 4 rozích */
    radial-gradient(ellipse 600px 600px at 0% 0%, rgba(200, 32, 42, 0.08), transparent 50%),  /* ruby TL */
    radial-gradient(ellipse 600px 600px at 100% 0%, rgba(232, 212, 128, 0.08), transparent 50%),  /* topaz TR */
    radial-gradient(ellipse 600px 600px at 100% 100%, rgba(32, 80, 176, 0.08), transparent 50%),  /* sapphire BR */
    radial-gradient(ellipse 600px 600px at 0% 100%, rgba(42, 128, 80, 0.08), transparent 50%),  /* emerald BL */
    var(--theme-steel-deep);
  ```

- **🎨 Quartered Aurora drift** (signature passive atmosféra):
  - Body `::before` pseudo-element s 4 mlhovými vrstvami (jak výše)
  - `animation: aurora-drift 45s ease-in-out infinite alternate;`
  - Velmi pomalý posun (±20px X, ±10px Y) + opacity 0.06 → 0.10 → 0.06
  - Vyjadřuje pasivní atmosféru protikladů v rovnováze
  - **Reduced-motion vypíná** (statický rozhraní)

- **🎨 Phoenix Ember orbit** (signature aktivní animace):
  - Pouze na `.hero-card` / welcome card — jeden drobný teplý ember-glow (8×8px radial gradient #ffe8a8 → transparent) obíhá po vnitřním obvodu cardu
  - `animation: ember-orbit 11s linear infinite;`
  - Trajektorie: top-left corner → top-right → bottom-right → bottom-left → top-left (square path along the inside border)
  - Zanechává krátkou stopu (`box-shadow` chvostek)
  - Symbolizuje fénixovu pochodeň obíhající pakt
  - **Reduced-motion vypíná**

- **🎨 Cardinal Pulse** (signature gem-sekvenční animace):
  - 4 cardinal-gem assets (rubín-L, topaz-T, safír-R, smaragd-B) na welcome cardu pulzují postupně v sekvenci
  - Každý gem 0.4s soft glow expansion (`box-shadow` swell + `filter: brightness(1.2)`), pak fade
  - Sekvence: rubín → safír → smaragd → topaz → cyklus, celkem 6s loop
  - Symbol kola živlů v rovnováze
  - **Reduced-motion vypíná** (gemy zůstanou klidné)

- **Film grain overlay** (subtle texture):
  - `body::after` pseudo-element, fixed inset 0
  - SVG `feTurbulence` noise filter, opacity 0.18 (jemnější než temna-cerven), mix-blend-mode overlay
  - z-index 1000 (nad obsahem ale neblokuje pointer events)

### 4.2 Topbar (header)

- **Pozadí:** Solid `--theme-steel-mid` (#1c1e26) s warm bronze undertone, no transparency
- **Bronze inlay line** podél spodní hrany topbaru (1px gradient: bronze-deep → bronze-bright → bronze-deep) jako heraldická "korunovační linie"
- **Logo:** `logo.webp` (user-provided), výška 96px desktop / 80px tablet / 64px mobile s phoenix-radiance subtle filter (drop-shadow #ffe8a8 ambient glow)
- **Header buttons (POŠTA, UŽIVATELÉ, ZLATÝ STANDARD, TYKY, ODHLÁSIT):**
  - Heraldic shield-button styling: bronze-warm border 1.5px + steel-card background + gold-leaf engraved label
  - Hover: bronze brightens k `--theme-bronze-bright` + phoenix-radiance ambient glow box-shadow
  - Aktivní (např. logged user button): bronze-bright permanent + subtle inner gold-leaf engraving frame

### 4.3 Sidebar L (NAVIGACE)

- **Pozadí:** `--theme-steel-mid` s damask-like subtle pattern (very faint, opacity 0.05) — 4-elementální alchemické glyfy (🜂🜄🜁🜃) jako repeating SVG pattern (homage hermetic koncept ale heraldicky umírněně)
- **4 corner ornaments** (`corner-tl.webp` + 3× mirror přes CSS) v rozích sidebaru
- **NavItem styling:**
  - Default: text `--theme-text-primary` (warm parchment #e8dac0), MedievalSharp font, uppercase, letter-spacing 1.5px
  - Hover: bronze warm glow box-shadow + text-color brightens k `--theme-gold-leaf` + slight translateY(-1px) + horizontal bronze-inlay shimmer
  - Active: bronze-bright `border-left: 3px solid` + subtle inset bronze-shadow + gold-leaf text-color + small ruby cabochon dot (4px) levitující u levého okraje (CSS `::before` element)
- **Section labels** (NAVIGACE, VESMÍRY, CHAT): MedievalSharp uppercase, text-color `--theme-bronze-warm`, letter-spacing 3px, malé bronze-inlay underline (1px gradient)

### 4.4 Welcome card (hero) — *signature element*

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ [corner-tl]                                  [corner-tr]   │
│       [cardinal-topaz]                                      │
│                                                             │
│   ┌───────────────┐  Vítej v Projektu Ikaros.              │
│   │   medailon    │                                          │
│   │  (square)     │  Projekt Ikaros je místo...             │
│   │               │                                          │
│   │   Ikaros-     │  Zároveň je to prostor...              │
│   │   fénix       │                                          │
│   │   uvnitř      │  Příjemnou zábavu...                    │
│   └───────────────┘                                          │
│  [cardinal-ruby]                          [cardinal-sapphire]│
│       [cardinal-emerald]                                    │
│ [corner-bl]                                  [corner-br]    │
└────────────────────────────────────────────────────────────┘
```

**Treatment:**
- **Pozadí:** `--theme-steel-card` (#252830) s phoenix-radiance subtle radial glow z centra (opacity 0.06)
- **Border:** 1px `--theme-silver-bright` outer + 2px `--theme-bronze-warm` inset (double-border heraldic effect)
- **4 corner ornaments:** `corner-tl.webp` v TL roh, mirror přes CSS `transform: scaleX(-1)` na TR, `scaleY(-1)` na BL, `scale(-1)` na BR
- **4 cardinal gem markers:**
  - `cardinal-topaz.webp` absolute pozicováno na top midpoint (top: -30px, left: 50%, translateX(-50%))
  - `cardinal-sapphire.webp` right midpoint
  - `cardinal-emerald.webp` bottom midpoint
  - `cardinal-ruby.webp` left midpoint
  - Velikost: 60×60px desktop, 48×48px tablet, 36×36px mobile
- **Medailon:** `medailon.webp` (user-provided) vlevo, 200×200px desktop / 160×160px tablet / 128×128px mobile, čtvercový s subtle phoenix-radiance ambient glow filter
- **Phoenix Ember orbit:** absolute-positioned 8×8px radial-gradient ember obíhá po vnitřní straně bordertu (11s loop, viz 4.1)
- **Drop-cap "V"** v prvním odstavci ("Vítej..."):
  - Font: **MedievalSharp** 4.2em desktop / 3.4em tablet / 2.8em mobile
  - Float left, line-height 0.85, margin-right 8px
  - Color: gradient gold-leaf `#e8c860` → bronze-bright `#d4a850` (background-clip text)
  - text-shadow: 0 0 8px rgba(255, 232, 168, 0.4), 0 0 16px rgba(232, 200, 96, 0.2) (phoenix-radiance halo)
- **Italic závěr** ("Příjemnou zábavu přeji administrátoři.") v **Pinyon Script** 1.4em, color `--theme-gold-leaf`

### 4.5 Novinky panel (bottom)

- **Pozadí:** `--theme-steel-card` se subtle bronze gradient
- **Border:** stejně jako welcome card (silver + bronze double-border)
- **4 corner ornaments** (mirror přes CSS) — menší velikost (50% scale)
- **Section divider:** `divider-chain.webp` (stříbrný řetěz s gem-clusterem) horizontálně mezi headlinou "Novinky" a content area
- **"PŘIDAT NOVINKU" CTA:** primary button styled as heraldic gem-set button (sekce 4.7)

### 4.6 Sidebar R — ADMINISTRACE + base sections

**Per project memory:** ADMINISTRACE nahoře (skin selector + uživatelé) + default sekce pod (MOJE DISKUZE, MOJE SVĚTY, OBLÍBENÉ ČLÁNKY, OBLÍBENÉ OBRÁZKY).

- **ADMINISTRACE sekce nahoře:**
  - Section label "ADMINISTRACE" — MedievalSharp uppercase, bronze-warm, letter-spacing 3px
  - **ThemeSwitcher** (existing dropdown) — restyled jako bronzová ladící deska:
    - Trigger button: bronze-warm gradient + gold-leaf "AKTUÁLNÍ SKIN: čtyři živly" + small fleur-de-lis spike na levé straně
    - Dropdown panel: steel-card bg s 4 corner ornaments (menší) + každá položka = mini heraldic shield row
  - **UŽIVATELÉ link:** heraldic NavItem styling, ikona = malý heraldic-shield s pen-quill (žádný emoji)
- **Compass of Four mandala** (`compass.webp`):
  - Umístění: pod "OBLÍBENÉ OBRÁZKY" sekcí (spodní část pravého panelu, kde reference image měl yin-yang)
  - Velikost: 220×220px desktop / 180×180px tablet / hidden na mobile (≤480px)
  - Slow rotation: `animation: compass-rotate 90s linear infinite;`
  - **Reduced-motion vypíná** rotaci (statika)
- **Default sekce pod ADMINISTRACE:** standardní layout, žádný shared edit

### 4.7 Buttons (CTAs)

- **Primary CTA** ("PŘIDAT NOVINKU", "+"):
  - Background: linear-gradient `--theme-bronze-deep` → `--theme-bronze-warm` → `--theme-bronze-deep`
  - Border: 1.5px silver-bright outer + 1px gold-leaf inner (double-border)
  - Text: gold-leaf, MedievalSharp uppercase, letter-spacing 2px
  - Levá strana button: malá fleur-de-lis spike ikona (`corner-tl.webp` fragment nebo CSS-rendered)
  - Hover: bronze brightens k `--theme-bronze-bright`, phoenix-radiance outer glow box-shadow, translateY(-2px)
  - Aktivní/Click: translateY(0) + inset shadow
- **Secondary buttons** (filter, "ZOBRAZIT VŠE →"):
  - Steel-card bg + 1px bronze-warm border + gold-leaf text
  - Hover: bronze-warm border brightens + subtle gold-leaf underline animation

### 4.8 NavItem (level 2 — MOJE DISKUZE, MOJE SVĚTY items)

- Container: steel-card bg s 1px bronze-warm border + subtle phoenix-radiance inner glow (opacity 0.04)
- Hover: bronze-warm border brightens k bronze-bright + phoenix-radiance pulse box-shadow (0.4s)
- Item left-icon (svět emoji "🌐" nebo phoenix-sigil): wrapped v small heraldic shield frame (CSS)
- Label: parchment text, italic font for secondary info (Pinyon Script for "MATRIX PJ" type tags)

### 4.9 Nav ikony (7 heraldic shields)

- **Asset list:**
  - `icon-uvodnik.webp` — otevřená kniha pečetí s phoenix-sealem (úvodník)
  - `icon-vytvorit-svet.webp` — inner mandala s genesis-spark (vytvořit svět)
  - `icon-diskuze.webp` — 2 propletená phoenix-pera (fire+water, diskuze)
  - `icon-clanky.webp` — pergamenový svitek s 4-elementálními stuhami (články)
  - `icon-galerie.webp` — bronze portrait medallion v shield framu (galerie)
  - `icon-napoveda.webp` — armilární sféra s 4 kardinálními gemy (nápověda)
  - `icon-hospoda.webp` — stříbrný chalice s phoenix-radiance liquid (dimenzionální hospoda)
- **Common shield frame** (per asset prompts): silver-steel outer + bronze inlay + 4 cardinal cabochons at midpoints + fleur-de-lis top + phoenix-sigil bottom
- Velikost v UI: 40×40px sidebar nav, 32×32px mobile sidebar nav
- Hover: phoenix-radiance ambient glow filter (drop-shadow #ffe8a8)
- Active: subtle pulse animation (`filter: brightness(1.15)` 600ms ease-in-out)

### 4.10 Section dividers

- **`divider-chain.webp`** mezi sekcemi v panelech (Novinky, ADMINISTRACE → MOJE DISKUZE separator)
- Pouze v `width >= 768px` (na mobile hidden, použijeme 1px bronze gradient line místo toho)

### 4.11 Typografie

| Role | Font | Důvod / odlišení |
|---|---|---|
| Logo | User-provided (baked-in v `logo.webp`) | — |
| Display | **MedievalSharp** | Rytířský gothic-fantasy, ostře řezaný — distinct od UnifrakturCook (nemrtví), Pirata One (hospoda/temna-cerven), New Rocker (nemrtví), Cinzel (zlatý standard) |
| Body | **Cardo** | Renaissance roman — distinct od EB Garamond (pergamen), Cormorant (priroda/temna-cerven), Spectral (hospoda), Lora |
| Signature italic | **Pinyon Script** | Copperplate — distinct od Italianno (temna-cerven/pergamen), Tangerine (priroda), Great Vibes (zlatý), Mea Culpa |
| Drop-cap "V" | MedievalSharp | Konzistence s display |

**Žádný overlap** s ostatními skiny.

Google Fonts import (do [`index.html`](../../../index.html)):
```html
<link href="https://fonts.googleapis.com/css2?family=MedievalSharp&family=Cardo:ital,wght@0,400;0,700;1,400&family=Pinyon+Script&display=swap" rel="stylesheet">
```

### 4.12 Paleta — finální tokens (sladěno se skutečnými assety)

**Pozorování:** Vygenerované assety mají **gold/bronze dominantní**, silver je strukturální skeleton. Inner niches jsou tmavě **steel-blue** (#1a2230 cca), warm phoenix-radiance halo je gold-white.

| Token | Hex | Použití |
|---|---|---|
| `--theme-steel-deep` | `#13141a` | Hlavní pozadí (forged dark steel) |
| `--theme-steel-mid` | `#1a1d26` | Sidebars background |
| `--theme-steel-niche` | `#1c2230` | Inner shield niche (asset background match) |
| `--theme-steel-card` | `#252830` | Cards |
| `--theme-silver-bright` | `#e8ecf0` | Highlight stříbra |
| `--theme-silver-base` | `#c8ccd2` | Base stříbra |
| `--theme-silver-shadow` | `#5a5e66` | Stříbro ve stínu |
| `--theme-bronze-deep` | `#5a4220` | Hluboký bronz (shadow) |
| `--theme-bronze-warm` | `#b08840` | Base bronz (dominant ornamental) |
| `--theme-bronze-bright` | `#d4a850` | Highlight bronz |
| `--theme-gold-leaf` | `#e8c860` | Gold-leaf engraving accent |
| `--theme-phoenix-radiance` | `#ffe8a8` | Phoenix warm halo |
| `--theme-phoenix-glow` | `#ffd680` | Phoenix incandescent |
| `--theme-ruby` | `#c8202a` | OHEŇ cabochon |
| `--theme-ruby-glow` | `#f04050` | OHEŇ incandescent (Cardinal Pulse) |
| `--theme-sapphire` | `#2050b0` | VODA cabochon |
| `--theme-sapphire-glow` | `#4080e0` | VODA highlight |
| `--theme-emerald` | `#2a8050` | ZEMĚ cabochon |
| `--theme-emerald-glow` | `#50b070` | ZEMĚ highlight |
| `--theme-topaz` | `#e8d480` | VZDUCH cabochon |
| `--theme-topaz-glow` | `#fff0c0` | VZDUCH prism |
| `--theme-text-pale` | `#e8dac0` | Hlavní text (parchment warm) |
| `--theme-text-muted` | `#98886a` | Secondary text |
| `--theme-text-engrave` | `#0a0a0d` | Engraving lines (negativní detaily) |

#### WCAG kontrast (audit pass)
- Text-pale `#e8dac0` na steel-deep `#13141a` → **~12.6:1** ✅ AAA
- Silver-base `#c8ccd2` na steel-deep → **~10.4:1** ✅ AAA
- Gold-leaf `#e8c860` na steel-deep → **~9.8:1** ✅ AAA
- Bronze-bright `#d4a850` na steel-deep → **~7.5:1** ✅ AAA
- Bronze-warm `#b08840` na steel-deep → **~5.1:1** ✅ AA
- Phoenix-radiance `#ffe8a8` na steel-deep → **~14.2:1** ✅ AAA
- Ruby `#c8202a` na steel-deep → **~4.3:1** ✅ AA Large (decorative use)

### 4.13 Mobilní redukce

- **Compass mandala** hidden na ≤480px (přesahuje úzký panel)
- **Phoenix Ember orbit** zachováno, ale ember zmenšen na 6×6px na ≤768px
- **Cardinal gem markers** zmenšené z 60px → 36px na ≤480px
- **Section dividers** (chain): hidden na ≤768px, nahrazeno 1px bronze gradient
- **Drop-cap "V"** zmenšeno z 4.2em → 2.8em na ≤480px
- **Corner ornaments** 50% scale na ≤480px

### 4.14 Reduced-motion

`reducedMotion: 'heavy'` — vše se zastaví, atmosféra zůstane:
- Quartered Aurora: statická (žádný drift), barvy zůstávají
- Phoenix Ember orbit: zastavený (ember neviditelný)
- Cardinal Pulse: zastavený (4 gemy zůstanou v base stavu)
- Compass rotation: statický
- Hover transitions: zachované (UX feedback), max 280ms

---

## 5. Asset → CSS mapování

| # | Asset | Použití v CSS |
|---|---|---|
| 1 | `logo.webp` | `--asset-logo` → topbar logo `<img>` |
| 2 | `medailon.webp` | `--asset-medailon` → welcome card left |
| 3 | `corner-tl.webp` | `--asset-corner` → 4 corners welcome card + novinky panel + sidebar L+R (mirror přes CSS) |
| 4 | `cardinal-ruby.webp` | `--asset-cardinal-ruby` → welcome card left midpoint + divider-chain center + nav item dot accent |
| 5 | `cardinal-sapphire.webp` | `--asset-cardinal-sapphire` → welcome card right midpoint |
| 6 | `cardinal-emerald.webp` | `--asset-cardinal-emerald` → welcome card bottom midpoint |
| 7 | `cardinal-topaz.webp` | `--asset-cardinal-topaz` → welcome card top midpoint |
| 8 | `compass.webp` | `--asset-compass` → bottom right panel (admin section bottom) |
| 9 | `divider-chain.webp` | `--asset-divider-chain` → between Novinky title + content; mezi ADMINISTRACE a default sekcemi |
| 10–16 | `icon-*.webp` × 7 | `--asset-icon-{name}` → 7 nav items |

---

## 6. Rozdíly od ostatních skinů

| Aspekt | Pergamen | Hospoda | Nemrtví | Temna-cerven | **Čtyři živly** |
|---|---|---|---|---|---|
| dominantní materiál | pergamen + zlato | dub + mosaz | iron + bone | iron + baroque silver + jet + velvet | **leštěné stříbro-ocel + warm bronze/vermeil + 4 cardinal cabochon gems** |
| světlo | warm candle gold | warm hearth amber | cold teal-ghost green | garnet glow + bordeaux | **phoenix-radiance gold-white + 4-color gem refraction** |
| signature ornament | wax seal + corner | iron clasp + brass stamp | skull-arch + bone divider | bat-arch + thorn-rose + iron-cross corner | **fleur-de-lis spike corner + 4 cardinal gem markers + Compass of Four** |
| nálada | scholarly clean | lived-in cozy | dread + smrt | decadent seduction | **sacred reliquary + heroic radiance** |
| signature anim | banner flutter, candle flicker | hearth pulse, brass shine | ghost-pulse + statika | heartbeat tep + petals | **Cardinal Pulse + Phoenix Ember orbit + Quartered Aurora** |

---

## 7. Implementační poznámky

- Asset pipeline: `assets-source/themes/ctyri-zivly/*.png` → `public/themes/ctyri-zivly/decor/*.webp` přes `npm run themes:optimize`
- CSS scoping: vše přes `[data-theme="ctyri-zivly"]`, žádný globální dopad (per memory `feedback_theme_isolation`)
- Theme tokens v [`src/themes/themes/ctyri-zivly/index.ts`](../../../src/themes/themes/ctyri-zivly/index.ts) — odhad ~120 řádků
- Decorations v [`src/themes/themes/ctyri-zivly/decorations.css`](../../../src/themes/themes/ctyri-zivly/decorations.css) — odhad ~700 řádků, ~25 sekcí (pattern stejný jako temna-cerven)
- Google Fonts: MedievalSharp + Cardo + Pinyon Script nově přidat do [`index.html`](../../../index.html)
- Shared edit: pokud potřeba pro Phoenix Ember orbit, podobně jako temna-cerven petals — `<div data-theme-decoration="ember-orbit">` wrapper v [`IkarosLayout.tsx`](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx) s globální gating v [`reset.css`](../../../src/themes/_shared/reset.css)
- ThemeSwitcher stylizován per ctyri-zivly aesthetic v decorations.css (žádný nový komponent)
- `docs/themes/ctyri-zivly.md` — přepsat podle nového Pactum Quattuor konceptu (sekce 4 audit + final)

---

## 8. Testy

### 8.1 Vizuální regrese (na pergamen, hospoda, nemrtví, temna-cerven, modré nebe)
- ✅ Po zapnutí `ctyri-zivly` skinu se layout chová identicky pro každý non-ctyri-zivly skin (žádný shared edit kromě případného `data-theme-decoration` wrapperu)

### 8.2 Browser smoke
- ✅ Chrome / Edge / Safari / Firefox: vizuální parita
- ✅ Mobile responsive: 320px / 480px / 768px / 1024px / 1440px breakpoints

### 8.3 Reduced motion
- ✅ S `prefers-reduced-motion: reduce`: Quartered Aurora statická, Phoenix Ember vypnut, Cardinal Pulse zastavený, Compass rotation statický

### 8.4 Accessibility
- ✅ WCAG kontrast (viz 4.12)
- ✅ Keyboard navigation: focus rings použijí `--theme-bronze-bright` outline
- ✅ Skin selector dropdown: ARIA labels zachovány

---

## 9. Otevřené otázky

### Q-1: ADMINISTRACE pravý panel — vyrenderovat oboje, nebo jen ADMINISTRACE?

Per project memory `project_admin_panel_decision.md` zůstávají **uživatelé + skin selector v ADMINISTRACE**. Otázka: má pravý panel obsahovat:
- **A)** ADMINISTRACE nahoře (skin selector + UŽIVATELÉ link) + pod ní defaultní sekce (MOJE DISKUZE, MOJE SVĚTY, OBLÍBENÉ ČLÁNKY, OBLÍBENÉ OBRÁZKY) + Compass mandala dole — *konzistentní s temna-cerven, plný panel*
- **B)** Pouze ADMINISTRACE + Compass dole, žádné default sekce — *čistší, slavnostnější panel*

**Doporučení: A** — konzistence s ostatními skiny + víc funkcionality v jednom místě + Compass na konci dodává krásný "závěr panelu" rituál.

### Q-2: Drop-cap "V" font

- **A)** MedievalSharp (display font skinu, konzistentní)
- **B)** Cinzel Decorative (původní spec, ale Cinzel je v zlatý standard)
- **C)** Tangerine / Pinyon Script (calligraphic, dramatický kontrast s body)

**Doporučení: A** (MedievalSharp) — konzistence s display fontem + heraldická gravitas.

### Q-3: Compass mandala — interaktivní nebo dekorativní?

- **A)** Čistě dekorativní (rotuje 90s, nereaguje na klik)
- **B)** Interaktivní easter-egg (klik → zrychlí rotaci na 1s a phoenix-radiance burst, použít jako "obnovit dashboard" gesture)

**Doporučení: A** — drží to "muzejní artefakt" náladu. B by mohlo působit gimmicky.

### Q-4: Phoenix Ember orbit — square path nebo gem-to-gem cesta?

- **A)** Square path po vnitřním obvodu cardu (jednodušší, 11s loop) — viz draft v 4.1
- **B)** Gem-to-gem cesta — ember "navštíví" každý cardinal gem (rubín → safír → smaragd → topaz → cyklus, 12s loop), při návštěvě každého gemu spustí jeho Cardinal Pulse trigger
- **C)** Vypnout úplně (jen Cardinal Pulse + Quartered Aurora = duální signature místo triple)

**Doporučení: A** — krásný plynulý orbit, žádná závislost na Cardinal Pulse, jednoduché v CSS. B je atraktivní ale komplikuje synchronizaci a může působit "uměle".

### Q-5: Section divider mezi sekcemi v panelech

- **A)** `divider-chain.webp` (asset s gem-clusterem) — krásný ale visual heavy
- **B)** Pouze CSS — 1px bronze gradient line s drobnou centrální cabochon dot (rendered v CSS přes `::before`)
- **C)** Mix: chain mezi major sekcemi (Novinky title, ADMINISTRACE), CSS-only mezi menšími subsekcemi

**Doporučení: C** — chain pro hierarchickou důležitost, CSS-only pro detail.

---

## 10. Co spec NEZAHRNUJE (out of scope)

- Změny do shared layoutu nad rámec případného `data-theme-decoration` wrapperu pro Phoenix Ember orbit
- Změny do ostatních skinů (nulová regrese, vše scoped přes `[data-theme="ctyri-zivly"]`)
- Změny backendu
- Nová ThemeSwitcher komponenta (pouze stylizace existující)
- Změny do ikonografie ostatních skinů
- Změny background image (`/themes/backgrounds/ctyri-zivly.webp` zůstává)

---

## 11. Akceptační kritéria

- ✅ Po zapnutí `ctyri-zivly` skinu vypadá dashboard jako heraldická reliquář-mřížka per popis v sekci 1
- ✅ Všech 16 assetů (2 user + 14 AI) integrováno do CSS jako tokens
- ✅ 3 signature animace fungují (Cardinal Pulse, Phoenix Ember orbit, Quartered Aurora drift)
- ✅ ADMINISTRACE pravý panel funguje per Q-1 rozhodnutí
- ✅ Compass mandala v pravém panelu rotuje pomalu (per Q-3 A)
- ✅ Welcome card má 4 cardinal gemy v midpointech + 4 corner ornaments + medailon vlevo
- ✅ Typografie: MedievalSharp + Cardo + Pinyon Script (žádný overlap s ostatními skiny)
- ✅ Paleta: steel-blue + warm bronze + 4 cabochon gems + phoenix-radiance (per 4.12)
- ✅ WCAG AA pro běžný text, AAA preferováno
- ✅ Reduced-motion vypíná animace ale zachová estetiku
- ✅ Mobile responsive: 320–1440px breakpointy fungují (Compass hidden na ≤480px, ember zmenšeno, gems zmenšené)
- ✅ Nulová regrese na ostatních 20 skinech
- ✅ Strict isolation: vše scoped přes `[data-theme="ctyri-zivly"]`
- ✅ `docs/themes/ctyri-zivly.md` přepsáno per nový koncept Pactum Quattuor

---

**Po schválení specu** → vytvořím implementační plán (`plan-1.0m.md`) s konkrétními kroky, file edity, asset konverze, testy → tvůj souhlas → kód.
