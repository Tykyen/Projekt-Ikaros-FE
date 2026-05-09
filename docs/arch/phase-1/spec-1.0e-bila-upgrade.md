# Spec 1.0e — Bílá visual upgrade

**Datum:** 2026-05-09
**Status:** ⏳ Čeká na schválení
**Roadmap:** `docs/roadmap-fe.md` → Fáze 1 → 1.0e
**Závisí na:** 1.0 ✅, 1.0b (modré nebe) ✅, 1.0c (zlatý standard) ✅, 1.0d (sci-fi) ✅
**Reference:** `01 bila current.png` (current), `02 bila cíl.png` (target — éterický cathedral / cloister + hory + zámek)

---

## 0. Princip — light mode varianta

Bílá je **fundamentálně odlišná** od dosavadních luxury upgradů (1.0b/c/d):

- Všechny předchozí jsou **dark mode** (cream/gold/cyan na navy/black)
- Bílá je **light mode** — **dark text na cream/white** glass panelech, ivy + crystal estetika

Architectural base (luxury tokens schema, `data-frame-panel`, CornerOrnament, btn3d override pattern, asset slots) **se replikuje**. Inverze je pouze v paletě a glow intenzitě.

**Strict isolation:** vše scoped přes `[data-theme="bila"]`. Modré nebe + zlatý standard + sci-fi + zbylých 17 témat **= nulová regrese**.

---

## 1. Cíl

Po načtení s `themeId === 'bila'` má dashboard vypadat jako **éterická mramorová síň ve výšinách** (image 2):

- Background: cathedral / cloister + bílé sloupy + ivy + hory + zámek v dálce
- Atmosférický overlay — světlý linear gradient + jemný blue radial glow
- Glass panely **cream/ivory** s subtle dark blue borderem + světlý inset shadow
- Welcome medallion: dropnutý PNG (anděl portrétová orientace 0.75:1) + jemný blue glow
- Header logo: dropnutý PNG banner (4.27:1 thin wide)
- Active nav: **světle modrý gradient** (light blue → transparent), subtle blue glow, dark blue text
- Header buttons: cream gradient + dark blue border, hover = subtle blue glow
- Section title: **deep blue text** + light blue gradient line
- CornerOrnament: **modré crystaly** (light blue, viditelné — na rozdíl od skrytých u ostatních témat)
- PJ badge: **light blue chip** s dark blue text
- Text: dark slate (`#2a3540`) na cream — full inverze proti dark themes

**Mimo rozsah:** edit shared komponent, animace, ostatní témata.

---

## 2. Token model — `themes/themes/bila/index.ts` (plný přepis)

### Luxury tokeny (light mode)

```ts
// Background overlay — světlý, lehký zájezd, jemný blue radial
'--theme-bg-overlay':
  'radial-gradient(circle at 50% 30%, rgba(96, 130, 178, 0.10) 0%, transparent 50%), ' +
  'linear-gradient(180deg, rgba(248, 246, 240, 0.30) 0%, rgba(232, 230, 222, 0.45) 100%)',

// Glass surfaces — frosted bílé sklo (Gemini „Divine Light")
'--theme-surface':         'rgba(255, 255, 255, 0.72)',
'--theme-surface-strong':  'rgba(255, 255, 255, 0.92)',
'--theme-surface-soft':    'rgba(245, 248, 252, 0.55)',

// Borders — silver (#d1d1d1) místo gold/warm-gray
'--theme-border':          'rgba(180, 185, 195, 0.62)',
'--theme-border-soft':     'rgba(180, 185, 195, 0.30)',
'--theme-border-blue':     'rgba(91, 170, 225, 0.55)',

// Text — dark slate (full inverze)
'--theme-text':         '#2a3540',
'--theme-text-muted':   '#5a6878',
'--theme-heading':      '#1f4d7a',  // deep blue

// Accents — světle modrý + krémový gold subtle
'--theme-accent':          '#608ab8',
'--theme-accent-bright':   '#8fb4dd',
'--theme-accent-cyan':     '#7eb6e0',
'--theme-accent-magenta':  '#a890c8',  // jen jako velmi jemný secondary

// Glow — světlejší (intenzita 0.20-0.25 vs 0.42 dark themes)
'--theme-glow-cyan':         'rgba(126, 182, 224, 0.25)',
'--theme-glow-cyan-strong':  'rgba(126, 182, 224, 0.42)',
'--theme-glow-magenta':      'rgba(168, 144, 200, 0.20)',
'--theme-glow-gold':         'rgba(180, 155, 105, 0.22)',  // alias kvůli kompatibilitě
'--theme-shadow':            'rgba(80, 90, 110, 0.25)',  // light shadow

// Nav interactive
'--theme-nav-hover-bg':   'rgba(96, 130, 178, 0.06)',
'--theme-nav-active-bg':  'linear-gradient(90deg, rgba(126, 182, 224, 0.30) 0%, rgba(232, 230, 220, 0.40) 100%)',
```

### Legacy tokeny (mapping)

```ts
'--bg-primary':       '#f8f6f0',  // cream
'--bg-secondary':     '#eeebe2',
'--bg-card':          'var(--theme-surface)',
'--bg-card-hover':    'var(--theme-surface-soft)',
'--accent':           'var(--theme-accent)',
'--accent-bright':    'var(--theme-accent-bright)',
'--accent-soft':      'var(--theme-border-soft)',
'--text-primary':     'var(--theme-text)',
'--text-secondary':   'var(--theme-text-muted)',
'--text-muted':       '#8a9aab',
'--border':           'var(--theme-border-soft)',
'--border-strong':    'var(--theme-border)',
'--success':          '#3f8a5e',
'--warning':          '#c08020',
'--danger':           '#b04040',
'--info':             'var(--theme-accent)',
'--text-on-accent':   '#ffffff',
'--text-on-danger':   '#ffffff',
// ... ostatní soft borders / overlays
```

### Typography

```ts
'--font-logo':        '"Cinzel Decorative", "Cinzel", Georgia, serif',
'--font-display':     '"Cinzel", "Playfair Display", Georgia, serif',
'--font-body':        '"Lora", "Lato", Georgia, serif',
'--font-script':      '"Great Vibes", cursive',
```

(Stejné jako ostatní luxury — Cinzel + Lora už jsou loadované, žádný další font potřeba.)

### Layout chrome + assety

```ts
'--header-h':         '88px',
'--header-bg':        '#f8f6f0',
'--frame-pad-y':      '40px',
'--frame-pad-x':      '18px',
'--sidebar-w':        '280px',

const decor = '/themes/bila/decor';
'--asset-logo':           `url('${decor}/logo.webp')`,
'--asset-logo-w':         '320px',  // 88×4.27 = 376; 320 fit-by-width
'--asset-logo-w-mobile':  '240px',
'--logo-img-display':     'block',
'--logo-fallback-display':'none',
'--asset-andel-medallion': `url('${decor}/andel-medallion.webp')`,
```

### Atmosféra

```ts
atmosphere: 'Éterická mramorová síň — cream + ivory + jemný light blue, ivy + crystal estetika, light mode',
```

---

## 3. Decorations CSS — `themes/themes/bila/decorations.css` (plný přepis)

Struktura ~140 řádků. 11 sekcí. Pattern z 1.0c/1.0d s **inverzí stínů** + jemnějším glow.

### Sekce

1. **Root** — `background-color: #f8f6f0`
2. **Atmosférický overlay** — `[data-theme="bila"][data-shell="ikaros"]::before`
3. **Glass panely** — sidebar/right/card/novinky:
   - `background: linear-gradient(135deg, rgba(252,250,245,0.85), rgba(238,235,225,0.92))`
   - `backdrop-filter: blur(8px)`
   - `border: 1px solid var(--theme-border)`
   - `border-radius: 18px`
   - `box-shadow: 0 0 0 1px rgba(180,155,105,0.20), inset 0 1px 0 0 rgba(255,255,255,0.6), inset 0 0 22px rgba(0,0,0,0.04), 0 6px 18px rgba(80,90,110,0.18)`
4. **CornerOrnament — VIDITELNÝ jako modré krystaly** (na rozdíl od ostatních témat):
   ```css
   [data-theme="bila"] [class*="ornament"] {
     display: block;  /* override "none" pravidla pokud nějaké zdědíme */
     background: var(--theme-accent-cyan);
     border: 1px solid var(--theme-accent);
     filter: drop-shadow(0 0 4px var(--theme-glow-cyan));
   }
   ```
5. **Welcome andel medallion** — dropnutý PNG (aspect 0.75 = portrétový):
   ```css
   [data-theme="bila"] [data-andel-medallion] {
     width: 200px;
     height: 265px;  /* 200/0.75 ≈ 265, match PNG aspect */
     background-image: var(--asset-andel-medallion);
     ...
     filter: drop-shadow(0 0 14px var(--theme-glow-cyan));
   }
   ```
   Žádné `::before/::after` diamondy (per user removal preference).
6. **Section title** `[class*="sectionTitle"]`:
   - `color: var(--theme-heading)` (deep blue)
   - `text-shadow` jen velmi jemný blue glow
   - Bez `◆` diamondů (jako 1.0d sci-fi)
7. **Header logo banner** — dropnutý PNG (aspect 4.27 = thin wide):
   ```css
   [data-theme="bila"] header [class*="logoImg"] {
     width: var(--asset-logo-w);
     height: var(--header-h);
     background-image: var(--asset-logo);
     background-size: contain;
     filter: drop-shadow(0 0 8px var(--theme-glow-cyan));
   }
   ```
8. **3D btn3d override (light mode)**:
   - default: `--btn-bg-1: rgba(248,246,240,0.85)`, `--btn-bg-2: rgba(232,230,220,0.92)`, dark blue border-soft, dark text
   - hover: cream brighter + blue border + light blue glow + translateY -2px
   - active/selected: `--btn-bg-1: rgba(126,182,224,0.30)`, light blue gradient pozadí, deep blue text, subtle cyan glow + 3px blue left bar
9. **Header buttons** — uppercase, letter-spacing, light bg, dark text
10. **PJ badge** — light blue chip:
    ```css
    [data-theme="bila"] [data-pj-badge] {
      background: linear-gradient(180deg, var(--theme-accent-bright), var(--theme-accent));
      color: #ffffff;
      border: 1px solid var(--theme-accent);
      box-shadow: 0 0 6px var(--theme-glow-cyan), inset 0 1px 0 0 rgba(255,255,255,0.4);
    }
    ```
11. **Welcome heading title accent** — deep blue color + jemný blue text-shadow (scoped `[class*="titleAccent"]`)
12. **Tyky avatar v hlavičce** — scoped `[class*="headerBtn"] [class*="avatar"]` 18×18px (stejný D-021 fix)
13. **Reduced motion safe**

---

## 4. Komponentové změny — žádné

`IkarosLayout.tsx`, `DashboardPage.tsx`, `IkarosCard`, `CornerOrnament`, `UserAvatar` — **beze změny**. Vše přes scoped CSS + tokeny.

`index.html` — **beze změny** (Cinzel + Lora už jsou; žádný nový font).

---

## 5. Assety — dodané uživatelem 2026-05-09

| Soubor | Status | Cíl po `themes:optimize` |
|---|---|---|
| `assets-source/themes/backgrounds/bila.png` | ✅ Existuje | `public/themes/backgrounds/bila.webp` (regen) |
| `assets-source/themes/bila/logo.png` (1293×303, alpha) | ✅ Dropnut | `public/themes/bila/decor/logo.webp` (pass-through) |
| `assets-source/themes/bila/andel-medallion.png` (1086×1448, no alpha) | ✅ Dropnut | `public/themes/bila/decor/andel-medallion.webp` (auto-detect chroma-key) |

**Pozn k medailonu:** PNG je 0.75:1 (portrétový), zatímco zlatý standard medailon byl 1:1. Upravím width/height v decorations.css na 200×265 (match aspect).

**Pozn k logu:** aspect 4.27:1 (thin wide jako sci-fi). Box 320×88 → image fit-to-width 320, height 320/4.27 = 75px (padded vertically inside header). Pokud bude logo malé, doladíme `--header-h` výš.

---

## 6. Akcepční kritéria

1. ✅ Po přepnutí na bílou vypadá blízko `02 bila cíl.png`:
   - background prosvítá éterický cathedral
   - cream glass panely s krystalovými diamondy v rozích (modré)
   - dark text na light bg (full inverze)
   - active nav = světle modrý gradient + subtle blue glow
   - PJ badge light blue chip
2. ✅ **Modré nebe + zlatý standard + sci-fi + 17 ostatních = nulová vizuální regrese**
3. ✅ Mobil 375 / tablet 768 / desktop 1440 funkční
4. ✅ Žádná změna BE / API / shared / globálních CSS
5. ✅ `lint`, `lint:colors`, `audit:contrast` (hlavně contrast — light mode = dark text na cream musí projít WCAG AA), `test:run`, `build`
6. ✅ Skill `mobil-desktop`

---

## 7. Risks

| # | Risk | Mitigace |
|---|---|---|
| R1 | WCAG AA contrast pro dark text na cream | Token `--theme-text: #2a3540` na `#f8f6f0` = ratio ~12:1 ✅ (well over 4.5:1) |
| R2 | Glow intensity 0.25 může být moc subtle nebo moc silný | Iterate after impl (jako u zlatého standardu) |
| R3 | Anděl PNG aspect 0.75 = portrétový, nesedí 200×215 | Adjust v decorations.css na 200×265 |
| R4 | Logo aspect 4.27 — možná malý při 88px height | Pokud user řekne "malý", bumpu `--header-h` (jako u sci-fi) |
| R5 | CornerOrnament viditelný — uživatel je u ostatních skryl, může chtít stejně i u bílé | Pokud user řekne "skryj je", changne se `display: none` jako u ostatních |
| R6 | Background asset při timestampu 08:03 možná není ten cathedral z chatu | Spustím optimize a uvidím; pokud je to staré modré pozadí, požádám user dropnout znovu |

---

## 8. Co NEDĚLÁM

- ❌ Edit shared komponent / globálních CSS modulů
- ❌ Globální tokeny
- ❌ Animace
- ❌ Ostatní témata
- ❌ Změna BE / API
- ❌ Nové fonty / nové skripty

---

**Schválení:** ⏳ Čeká na PJ.