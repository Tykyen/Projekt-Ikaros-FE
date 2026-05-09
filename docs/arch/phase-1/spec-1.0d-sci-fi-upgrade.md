# Spec 1.0d — Sci-fi visual upgrade

**Datum:** 2026-05-09
**Status:** ⏳ Čeká na schválení
**Roadmap:** `docs/roadmap-fe.md` → Fáze 1 → 1.0d
**Závisí na:** 1.0 (theme infra) ✅, 1.0b (modré nebe luxury vzor) ✅, 1.0c (zlatý standard) ✅
**Reference:** `01 sci-fi current.png` (current), `02 sci-fi cíl.png` (target), nový sci-fi background dodán uživatelem 2026-05-09 10:15

---

## 0. Pracovní princip — isolace per téma

Každé téma se ladí samostatně. **Veškerá změna je scoped přes selektor `[data-theme="sci-fi"]`** v `themes/themes/sci-fi/{index.ts, decorations.css}`. Žádné editace globálních souborů (`IkarosLayout.module.css`, `DashboardPage.module.css`, shared UI).

Architectural base z 1.0b/1.0c se replikuje (luxury tokens schema, glass panely, btn3d override pattern, asset slots), ale **vizuální výsledek je odlišný**: cyan + magenta dual-tone HUD místo zlatého luxury.

**Akcepční podmínka:** po implementaci je modré nebe + zlatý standard + zbylých 18 témat **vizuálně identické** s pre-1.0d stavem (nulová regrese).

---

## 1. Cíl — vizuální popis

Po načtení s `themeId === 'sci-fi'` má dashboard vypadat jako **futuristický velitelský HUD** dle `02 sci-fi cíl.png`:

- **Background** — nový kosmický city + lodě + planeta (uživatelem dodán 2026-05-09)
- **Atmosférický overlay** — tmavý linear gradient + radial cyan a magenta lights (HUD ambient)
- **Panely** — holografické tmavě-navy glass + cyan border + **HUD brackets v rozích** (svorkový tvar `[ ]`)
- **Welcome card** — **CSS-only kruhový hologram badge** vlevo (žádný anděl PNG, čistý radial gradient cyan/magenta) + text vpravo
- **Active nav (Úvodník)** — full cyan-cyan gradient pozadí, jasný cyan glow, levá 3px cyan linka
- **Header logo banner** — sci-fi varianta (asset dodá uživatel) — hexagonální/tech rám
- **Header buttons** — uppercase, větší letter-spacing, cyan border, hover = cyan fill + glow
- **Sekce title** — `━━━ NAVIGACE ━━━` cyan gradient line + cyan text-shadow (žádné `◆` zlaté diamondy z 1.0c)
- **CornerOrnament** — **cyan + magenta dual-tone** body v rozích (alternující barvy: tl/br = cyan, tr/bl = magenta)
- **PJ badge** — cyan chip s glow (žádný zlatý)
- **Welcome heading** — `Vítej v Projektu Ikaros.` s **cyan highlight** (default `--theme-accent-cyan`) a `text-shadow` glow
- **Signature** — script font + cyan glow (totožné s 1.0c, jen cyan barva)

**Mimo rozsah:** nový anděl asset, animované efekty, edit shared komponent, ostatní témata.

---

## 2. Token model — `themes/themes/sci-fi/index.ts`

Plný přepis souboru (současný je z 1.0a baseline — minimální tokeny). Pattern z 1.0c, jen cyan/magenta paleta + sci-fi fonty.

### Luxury tokeny

```ts
// Background overlay nad theme.background — radial cyan + magenta ambient
'--theme-bg-overlay':
  'radial-gradient(circle at 22% 18%, rgba(22, 217, 255, 0.20) 0%, transparent 38%), ' +
  'radial-gradient(circle at 82% 76%, rgba(176, 38, 255, 0.16) 0%, transparent 32%), ' +
  'linear-gradient(180deg, rgba(2, 7, 17, 0.42) 0%, rgba(2, 7, 17, 0.62) 100%)',

// Glass surfaces
'--theme-surface':         'rgba(3, 12, 22, 0.78)',
'--theme-surface-strong':  'rgba(2, 8, 16, 0.92)',
'--theme-surface-soft':    'rgba(8, 28, 48, 0.55)',

// Borders — cyan dominantní + magenta secondary
'--theme-border':           'rgba(22, 217, 255, 0.72)',
'--theme-border-soft':      'rgba(22, 217, 255, 0.32)',
'--theme-border-magenta':   'rgba(176, 38, 255, 0.55)',

// Text
'--theme-text':         '#e8f6ff',
'--theme-text-muted':   '#93aebe',
'--theme-heading':      '#7eeaff',

// Accents — cyan primární, magenta secondary
'--theme-accent':          '#16d9ff',
'--theme-accent-bright':   '#7eeaff',
'--theme-accent-cyan':     '#16d9ff',  // alias pro DashboardPage compatibility
'--theme-accent-magenta':  '#b026ff',

// Glow
'--theme-glow-cyan':     'rgba(22, 217, 255, 0.42)',
'--theme-glow-cyan-strong': 'rgba(22, 217, 255, 0.65)',
'--theme-glow-magenta':  'rgba(176, 38, 255, 0.38)',
'--theme-glow-gold':     'rgba(22, 217, 255, 0.42)',  // override gold = cyan v sci-fi
'--theme-shadow':        'rgba(0, 0, 0, 0.85)',

// Nav interactive states
'--theme-nav-hover-bg':   'rgba(22, 217, 255, 0.10)',
'--theme-nav-active-bg':  'linear-gradient(90deg, rgba(22, 217, 255, 0.28) 0%, rgba(5, 18, 32, 0.55) 100%)',
```

### Legacy tokeny (mapování na luxury, pattern z 1.0c)

```ts
'--bg-primary':       '#020711',
'--bg-secondary':     '#04101e',
'--bg-card':          'var(--theme-surface)',
'--bg-card-hover':    'var(--theme-surface-soft)',
'--accent':           'var(--theme-accent)',
'--accent-bright':    'var(--theme-accent-bright)',
'--accent-soft':      'var(--theme-border-soft)',
'--text-primary':     'var(--theme-text)',
'--text-secondary':   'var(--theme-text-muted)',
'--border':           'var(--theme-border-soft)',
'--border-strong':    'var(--theme-border)',
// ... ostatní (success/warning/danger) zachovat z baseline
```

### Typography

```ts
'--font-logo':        '"Orbitron", "Rajdhani", system-ui, sans-serif',
'--font-display':     '"Orbitron", "Rajdhani", system-ui, sans-serif',
'--font-body':        '"Rajdhani", "Inter", system-ui, sans-serif',
'--font-script':      '"Rajdhani", system-ui, sans-serif',  // sci-fi nemá script font, použijeme display italic
```

**3 nové Google Fonty:** Orbitron (display), Rajdhani (body + display fallback). Inter = systémový fallback. **Načítání:** Google Fonts `<link>` v `index.html` ke stávajícím (Cinzel, Lato, Great Vibes). Drobný overhead, ale bez sci-fi fontu téma vizuálně sotva funguje.

### Layout chrome

```ts
'--header-h':    '88px',
'--header-bg':   '#020711',
'--frame-pad-y': '40px',
'--frame-pad-x': '18px',
'--sidebar-w':   '280px',
```

### Asset slots

```ts
const decor = '/themes/sci-fi/decor';

'--asset-logo':           `url('${decor}/logo.webp')`,
'--asset-logo-w':         '260px',
'--asset-logo-w-mobile':  '200px',
'--logo-img-display':     'block',
'--logo-fallback-display':'none',

'--asset-andel-medallion': 'none',  // sci-fi nepoužívá PNG medailon, render je CSS hologram
```

### Atmosféra

```ts
atmosphere: 'Futuristic command HUD — cyan + magenta neon, holographic glass panels, sci-fi typography',
```

---

## 3. Decorations CSS — `themes/themes/sci-fi/decorations.css`

Plný přepis (současný je minimální 1.0a baseline). ~150 řádků, struktura jako 1.0c, ale s HUD bracket variantou rohů.

### Sekce

1. **Root** — `background-color: #020711`
2. **Atmosférický overlay** — `[data-theme="sci-fi"][data-shell="ikaros"]::before { background: var(--theme-bg-overlay) }`
3. **Glass panely** — `data-frame-panel`:
   - `background: linear-gradient(135deg, rgba(6, 15, 30, 0.85), rgba(2, 6, 12, 0.95))`
   - `backdrop-filter: blur(10px)`
   - `border: 1px solid var(--theme-border)`
   - `border-radius: 4px` (jen drobné zaoblení, ne 22px jako 1.0c — sci-fi je ostřejší)
   - `box-shadow: 0 5px 25px rgba(0,0,0,0.8), inset 0 0 24px rgba(22,217,255,0.06)`
4. **HUD brackets** — `[data-frame-panel]::before` a `::after`:
   - `::before` v top-left rohu: `border-top: 2px solid cyan + border-left: 2px solid cyan`, 30×30px
   - `::after` v bottom-right rohu: `border-bottom: 2px solid cyan + border-right: 2px solid cyan`, 30×30px
   - `box-shadow: 0 0 8px var(--theme-glow-cyan)` na obou
5. **CornerOrnament dual-tone** — `[class*="ornament"]`:
   - `background: var(--theme-accent-cyan)`, `border: 1px solid var(--theme-accent-cyan)`, drop-shadow cyan glow
   - **TR + BL** override na magenta — pomocí `[data-position="tr"]` a `[data-position="bl"]`: `background: var(--theme-accent-magenta)`, glow magenta
6. **Welcome andel medallion → hologram** — `[data-andel-medallion]`:
   - **Skrýt** background-image (CSS hologram nahrazuje PNG)
   - `background:` radial cyan + radial magenta v rozích
   - `border: 1px solid var(--theme-border)`, `border-radius: 50%`
   - `box-shadow: 0 0 28px var(--theme-glow-cyan), inset 0 0 16px var(--theme-glow-magenta)`
   - `width: 200px; height: 200px` (kruh místo 200×215 obdélník)
   - **Cyan diamondy nahoře/dole** zachovat z 1.0c pattern (`::before/::after`), jen barvy cyan
7. **Section title** `[class*="sectionTitle"]`:
   - `color: var(--theme-heading)` (cyan tone)
   - `text-transform: uppercase`, `letter-spacing: 0.18em`
   - `text-shadow: 0 0 10px var(--theme-glow-cyan)`
   - **Žádné `◆` diamondy** (na rozdíl od 1.0c) — section title má jen gradient line z base CSS, který v sci-fi paletě je cyan
8. **Header logo banner** `header [class*="logoImg"]` — analogicky 1.0c (asset slot)
9. **Header buttons** `[class*="headerBtn"]`:
   - `background: linear-gradient(180deg, rgba(8,22,36,0.92), rgba(3,10,18,0.92))`
   - `border: 1px solid var(--theme-border-soft)`
   - hover: `border-color: var(--theme-accent)`, `color: var(--theme-accent-bright)`, `box-shadow: 0 0 12px var(--theme-glow-cyan)`
   - aktivní: `border-color: var(--theme-accent)`, full cyan glow
10. **3D btn3d override** přes CSS proměnné (pattern z 1.0c):
    - default: dark navy gradient + cyan border-soft
    - hover: světlejší navy + cyan border + cyan glow + translateY -2px + cyan text-shadow
    - active: full cyan gradient `rgba(22,217,255,0.20→8,80,100,0.32)` + cyan box-shadow + 3px cyan left bar + bílý text + cyan text-shadow
11. **PJ badge** — cyan chip:
    - `background: linear-gradient(180deg, var(--theme-accent-bright), var(--theme-accent))`
    - `color: var(--bg-primary)` (tmavý text)
    - `box-shadow: 0 0 8px var(--theme-glow-cyan)`
12. **Welcome heading** `[class*="welcomeTitle"]` — beze změny font-size (zachovat globální `--text-2xl`); text-shadow přes `[class*="titleAccent"]` cyan glow
13. **Reduced motion safe** — totéž jako 1.0c

---

## 4. Komponentové změny — minimální (jako 1.0c)

### `IkarosLayout.tsx`

**Beze změny.** PJ badge logic z 1.0c funguje univerzálně (`data-pj-badge`).

### `DashboardPage.tsx`

**Beze změny.** Welcome card markup `<IkarosCard variant="welcome" medallion={...}>` se v sci-fi vykreslí stejně, jen CSS přebije medallion na hologram.

### `IkarosCard`, `CornerOrnament`, `UserAvatar`

**Beze změny.** Vše přes scoped CSS.

### Globální `index.html`

**Drobnost — Google Fonts link.** Přidat Orbitron + Rajdhani. **JEDINÁ globální změna** v této specu, je to nutná — Google Fonts musí být načteny v `<head>`. Mimo `[data-theme]` selektor, ale efektivně neutrální (jiné fonty se z `index.html` taky načítají).

**FLAGOVÁNO:** ano, je to globální `<link>` tag. Loadne dva nové fonty pro celou apku. **Risk:** ostatní témata stejné fonty nepoužijí (jejich `--font-*` vars je neuvedou) → načteno marně. **Mitigace:** `display=swap` parametr, gzip, drobný overhead (~30 KB obě fonty). Pokud uživatel chce, dáme `<link>` jen za `[data-theme="sci-fi"]` ale to vyžaduje JS injekci runtime — větší komplexnost než worth.

---

## 5. Assety k dodání uživatelem

| Soubor | Status | Cíl po `themes:optimize` |
|---|---|---|
| `assets-source/themes/backgrounds/sci-fi.png` | ✅ Dropnut 2026-05-09 10:15 | `public/themes/backgrounds/sci-fi.webp` |
| `assets-source/themes/sci-fi/logo.png` | ⏳ Čeká | `public/themes/sci-fi/decor/logo.webp` |
| `assets-source/themes/sci-fi/andel-medallion.png` | ⏳ Čeká *(opcionální — sci-fi má CSS hologram, ale pokud user pošle anděla, použije se jako fallback / alternative)* | `public/themes/sci-fi/decor/andel-medallion.webp` |

**Otázka pro user-a:** sci-fi anděl medailon — chceš:
- **(I)** CSS hologram (žádný PNG, čistý cyan/magenta radial badge) — dle Gemini briefu, méně asset overhead
- **(II)** Sci-fi PNG anděl (modrá/cyan stylizace) — dle uživatelova "pošlu ti jak anděla tak horní logo"

Pokud (II), wirovat přes `--asset-andel-medallion: url('${decor}/andel-medallion.webp')` v `index.ts` a v `decorations.css` ponechat PNG render (skipnout CSS hologram).

---

## 6. Responsive

Identické s 1.0c:
- Mobile ≤768px: drawer sidebar, panely pod sebou, medailon nahoře nad textem
- Tablet 769–1024px: 2-sloupcový (sidebar + main), pravý panel pod
- Desktop >1024px: 3-sloupcový plný layout
- HUD brackets na všech breakpointech (CSS `::before/::after` neovlivňuje layout)
- Po implementaci povinný skill `mobil-desktop`

---

## 7. Akcepční kritéria

1. ✅ Po přepnutí na sci-fi vypadá vizuálně blízko `02 sci-fi cíl.png`:
   - nový kosmický city background prosvítá
   - panely jsou ostřejší (border-radius 4px) s HUD brackets v levém-horním + pravém-dolním rohu
   - dominantní cyan + magenta accent
   - Orbitron / Rajdhani fonty
   - aktivní Úvodník = silný cyan glow + cyan gradient pozadí
   - welcome hologram (CSS) nebo nový PNG anděl (dle volby)
   - PJ badge cyan chip
   - žádné zlato
2. ✅ **Zlatý standard + modré nebe + zbylých 18 témat = nulová vizuální regrese** (manuální sweep ThemeSwitcher)
3. ✅ Mobil 375px / tablet 768px / desktop 1440px funkční
4. ✅ Žádná změna BE / API / typů / komponent
5. ✅ Žádná globální CSS změna kromě `index.html` Google Fonts link (flagováno v §4)
6. ✅ `lint`, `lint:colors`, `audit:contrast`, `test:run`, `build` ✅
7. ✅ Skill `mobil-desktop` po implementaci

---

## 8. Risks / open

| # | Risk | Mitigace |
|---|---|---|
| R1 | `backdrop-filter: blur(10px)` na 4 panelech + radial overlay = výkon na slabém HW | Stejné jako 1.0c — degraduje gracefully, panely zůstanou cyan glass bez blur |
| R2 | Sci-fi fonty Google Fonts overhead ~30 KB pro všechna témata | Akcept — `display=swap`, gzip; alternativní lazy-load by vyžadoval runtime JS injekci, complexity > benefit |
| R3 | HUD brackets (`::before/::after` panel) = pseudo-elementy jsou už použity v base `.sectionTitle::before/::after` na gradient line. Konflikt? | `[data-frame-panel]::before` vs `.sectionTitle::before` — různé selektory, žádný konflikt |
| R4 | `CornerOrnament` má `data-position`. Přebití barvy přes `[data-position="tr"]` matchuje **všechny** CornerOrnamenty na stránce. Nebude problém? | Akcept — všechny ornamenty v sci-fi mají dual-tone, konzistence |
| R5 | Welcome card medallion → CSS hologram **skryje** `background-image: var(--asset-andel-medallion)` z DashboardPage struktury | Override `background: ...` v `[data-theme="sci-fi"] [data-andel-medallion]` přebije; `background-image: none !important` jistota |
| R6 | Magenta accent může být moc křiklavý | Subjektivní; iterace po implementaci. Plán §0 (1.0c style) počítá s ladění |
| R7 | Section title v sci-fi má jen line bez `◆` diamondů. Base CSS v `IkarosLayout.module.css` `.sectionTitle::before/::after` má gradient line s `--theme-accent` proměnnou → automaticky cyan. | Žádná akce, base CSS funguje |

---

## 9. Po dokončení

- Zaškrtnout v `roadmap-fe.md` — přidat řádek **1.0d — Sci-fi visual upgrade ✅**
- Případné dluhy v `docs/dluhy.md`
- Volitelně `purpose.md` / `decisions.md` / `ai-notes.md`

---

## 10. Co NEDĚLÁM

- ❌ Replikace 1.0c na ostatních 18 témat
- ❌ Změna BE / API / datových modelů
- ❌ Edit shared komponent (`IkarosCard`, `CornerOrnament`, `UserAvatar`, `IkarosLayout`)
- ❌ Edit globálních CSS modulů (`IkarosLayout.module.css`, `DashboardPage.module.css`)
- ❌ Animace (statický HUD, prefers-reduced-motion safe)
- ❌ Smazání zlatého standardu nebo jiných témat
- ❌ Globální `:root { --cyan: ... }` tokeny (vše per-theme)
- ❌ Nové utility třídy `.tech-panel` apod. (přes `data-frame-panel` selektor)

---

**Schválení:** ⏳ Čeká na PJ. Po souhlasu napíšu **`plan-1.0d.md`** s konkrétními diffy. Po jeho schválení teprve kód.

**Jediná otevřená otázka pro tebe:** §5 — anděl medailon (I) CSS hologram, nebo (II) PNG sci-fi anděl od tebe? Pokud (II), pošli `andel-medallion.png` do `assets-source/themes/sci-fi/`.
