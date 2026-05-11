# Plán 1.0q — Africké visual upgrade „Země předků"

**Datum:** 2026-05-11
**Spec:** [`spec-1.0q-africke-upgrade.md`](spec-1.0q-africke-upgrade.md) ✅ schválen
**Asset prompty:** [`../../../public/themes/africke/decor/_asset-prompts.md`](../../../public/themes/africke/decor/_asset-prompts.md) ✅
**Branch:** `main` (přímý commit po dokončení, dle vzoru `1.0p` indián)
**Single PR** — kompletní skin v jednom kroku

---

## 0. Pre-flight ✅

| Item | Status | Poznámka |
|---|---|---|
| 15 PNG v `assets-source/themes/africke/` | ✅ | 13 AI + logo + medailon |
| `npm run themes:optimize` spuštěn | ✅ | 15× webp v `public/themes/africke/decor/` |
| `scripts/finalize-africke-assets.mjs` vytvořen + spuštěn | ✅ | resize na cílové rozměry hotov |
| Background `public/themes/backgrounds/africke.webp` | ✅ | savana scéna, neměníme |
| Thumbnail `public/themes/thumbnails/africke.webp` | ✅ | existuje |
| Layout audit (`IkarosLayout.tsx`) | ✅ | Administrace už podporována vpravo (1.0p), shoda se spec |
| `PanelCorners` injectuje `<CornerOrnament position="tl|tr|bl|br" />` | ✅ | 4 rohy ve všech panelech — hook pro corner-tl asset |
| Frontend-design audit | ✅ | 2026-05-11, vybrána fúze B+C (Velký horizont s vetkanou pamětí) |
| Spec schválen | ✅ | 2026-05-11 |

**Assety hotové (15):**

| Asset | Rozměry | Velikost |
|---|---|---|
| `logo.webp` | original | ✅ |
| `medailon.webp` | original | ✅ |
| `corner-tl.webp` | 256×256 | 12.1 KB |
| `stele-frame.webp` | 1200×500 | 99.9 KB |
| `mudcloth-band.webp` | 1200×48 | 15.2 KB |
| `baobab-corner.webp` | 440×640 | 25.5 KB |
| `acacia-canopy.webp` | 1200×120 | 81.5 KB |
| `monolith-watermark.webp` | 800×600 | 46.8 KB |
| 7× `icon-*.webp` | 96×96 | ~24 KB total |

---

## 1. Kroky implementace

### Krok 1 — Google Fonts: ověřit a doplnit v `index.html`

V [`index.html`](../../../index.html) ověřit, zda existující Google Fonts URL obsahuje 4 nové fonty pro Země předků:

- `Allura` (script logo fallback) — **přidat, pokud chybí**
- `Yeseva+One` (display headings) — **přidat, pokud chybí**
- `Gentium+Plus:wght@400;700` (body) — **přidat, pokud chybí**
- `Italianno` (signature italic) — **přidat, pokud chybí**

**Akce:** Grep `index.html` na tyto family, doplnit chybějící do existující `<link>` URL (mergovat parametry, ne přidat nový tag).

### Krok 2 — `src/themes/themes/africke/index.ts` — kompletní přepis

Velikost: ~200 řádků (z aktuálních 50).

**Co změnit:**

#### 2.1 Header komentář
Brief shrnutí: koncept „Země předků" (Velký horizont s vetkanou pamětí), materiály (sandstone + bronze + kente + mudcloth + adinkra + baobab/acacia silhouette), reference na spec.

#### 2.2 Base properties
- `id: 'africke'` — zachovat
- `name: 'Africké'` → **`'Země předků'`**
- `scope: 'both'` — zachovat
- `atmosphere:` — přepsat na „Země předků — savana za úsvitem, sandstone + carved bronze + kente weave bandy + mudcloth band, monolithy a baobaby na horizontu"
- `reducedMotion: 'heavy'` → **`'safe'`** (4 animace mají reduced-motion fallback)

#### 2.3 Přepsat `vars` — všechny tokens

**Smazat staré legacy `--bg-*`, `--accent-*` přímé hex hodnoty.**

**Nové tokens (skupiny):**

```ts
/* ── Background overlay ── */
'--theme-bg-overlay':
  'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(16, 8, 4, 0.45) 100%), linear-gradient(180deg, rgba(16, 8, 4, 0.30) 0%, rgba(16, 8, 4, 0.55) 100%)',

/* ── Surfaces (sandstone panely) ── */
'--theme-surface':        'rgba(58, 30, 8, 0.90)',
'--theme-surface-strong': 'rgba(42, 20, 8, 0.95)',
'--theme-surface-soft':   'rgba(90, 51, 24, 0.55)',

/* ── Earth materials ── */
'--theme-earth-deep':       '#100804',
'--theme-earth-shadow':     '#2a1408',
'--theme-earth-laterite':   '#6a2810',
'--theme-earth-ochre':      '#8a5028',
'--theme-earth-dust':       '#c89878',
'--theme-sand-pale':        '#d4a060',

/* ── Wood (patinated, z medailonu) ── */
'--theme-wood-dark':        '#3a1e08',
'--theme-wood-mid':         '#5a3018',
'--theme-wood-highlight':   '#8a5028',
'--theme-acacia-bark':      '#5a3018',

/* ── Bronze materials (corners) ── */
'--theme-bronze-deep':      '#5a3210',
'--theme-bronze-warm':      '#b87830',
'--theme-bronze-bright':    '#d49850',

/* ── Aged gold (ornamenty, ryté detaily) ── */
'--theme-aged-gold':        '#c8881a',
'--theme-aged-gold-bright': '#e8b840',

/* ── Horizon (úsvit accent) ── */
'--theme-horizon-dawn':     '#f4a050',
'--theme-horizon-sun':      '#ffd078',

/* ── Sky cobalt (rare, pro success states) ── */
'--theme-sky-cobalt':       '#1a3858',

/* ── Cream (text na tmavém) ── */
'--theme-cream':            '#f0e0c0',

/* ── Borders ── */
'--theme-border':           'rgba(138, 80, 40, 0.55)',
'--theme-border-soft':      'rgba(138, 80, 40, 0.28)',
'--theme-border-strong':    'rgba(200, 136, 26, 0.72)',
'--theme-border-bronze':    'var(--theme-bronze-warm)',

/* ── Text ── */
'--theme-text':             '#f0e0c0',
'--theme-text-muted':       '#b08868',
'--theme-heading':          'var(--theme-aged-gold)',
'--theme-text-on-sandstone':'#2a1408',  /* dark text na welcome stéle */
'--theme-text-on-gold':     '#2a1408',

/* ── Accents legacy aliasy ── */
'--theme-accent':           'var(--theme-horizon-dawn)',
'--theme-accent-bright':    'var(--theme-horizon-sun)',
'--theme-accent-gold':      'var(--theme-aged-gold)',
'--theme-accent-gold-bright':'var(--theme-aged-gold-bright)',

/* ── Glows ── */
'--theme-glow-gold':        'rgba(200, 136, 26, 0.45)',
'--theme-glow-gold-strong': 'rgba(232, 184, 64, 0.70)',
'--theme-glow-horizon':     'rgba(244, 160, 80, 0.50)',
'--theme-glow-bronze':      'rgba(184, 120, 48, 0.40)',
'--theme-shadow':           'rgba(16, 8, 4, 0.85)',

/* ── Nav hover/active ── */
'--theme-nav-hover-bg':     'rgba(244, 160, 80, 0.14)',
'--theme-nav-active-bg':
  'linear-gradient(90deg, rgba(244, 160, 80, 0.40) 0%, rgba(42, 20, 8, 0.85) 100%)',

/* ── Legacy tokeny (mapped) ── */
'--bg-primary':       '#100804',
'--bg-secondary':     '#2a1408',
'--bg-card':          'var(--theme-earth-dust)',  /* sandstone welcome */
'--bg-card-hover':    '#d8a888',
'--accent':           'var(--theme-horizon-dawn)',
'--accent-bright':    'var(--theme-horizon-sun)',
'--accent-dim':       '#a86028',
'--accent-soft':      'rgba(244, 160, 80, 0.16)',
'--text-primary':     'var(--theme-text)',
'--text-secondary':   'var(--theme-text-muted)',
'--text-muted':       '#806040',
'--border':           'var(--theme-border-soft)',
'--border-subtle':    'rgba(138, 80, 40, 0.16)',
'--border-strong':    'var(--theme-border-strong)',
'--success':              '#5a8848',
'--success-soft':         'rgba(90, 136, 72, 0.14)',
'--success-soft-border':  'rgba(90, 136, 72, 0.4)',
'--warning':              'var(--theme-aged-gold)',
'--warning-soft':         'rgba(200, 136, 26, 0.14)',
'--warning-soft-border':  'rgba(200, 136, 26, 0.4)',
'--danger':               '#a83828',
'--danger-soft':          'rgba(168, 56, 40, 0.16)',
'--danger-soft-border':   'rgba(168, 56, 40, 0.4)',
'--danger-focus-ring':    'rgba(168, 56, 40, 0.3)',
'--info':                 'var(--theme-sky-cobalt)',
'--text-on-accent':       'var(--theme-cream)',
'--text-on-danger':       '#f0e0c0',
'--bg-overlay':           'rgba(16, 8, 4, 0.72)',
```

#### 2.4 Typography tokens

```ts
'--font-logo':           '"Allura", "Pinyon Script", Georgia, serif',
'--font-display':        '"Yeseva One", "Marcellus", Georgia, serif',
'--font-tribal-accent':  '"Yeseva One", "Marcellus", Georgia, serif',
'--font-body':           '"Gentium Plus", "Lora", Georgia, serif',
'--font-script':         '"Italianno", "Allura", Georgia, cursive',
```

#### 2.5 Layout chrome tokens

```ts
'--header-h':              '56px',
'--header-bg':             '#2a1408',
'--frame-pad-y':           '40px',
'--frame-pad-x':           '18px',
'--sidebar-w':             '280px',
'--asset-logo-w':          '360px',
'--asset-logo-w-mobile':   '220px',
'--logo-img-display':      'block',
'--logo-fallback-display': 'none',
```

#### 2.6 Asset URL tokens

```ts
const decor = '/themes/africke/decor';

'--asset-logo':              `url('${decor}/logo.webp')`,
'--asset-andel-medallion':   `url('${decor}/medailon.webp')`,
'--asset-corner':            `url('${decor}/corner-tl.webp')`,
'--asset-corner-size':       '72px',
'--asset-corner-size-mobile':'38px',
'--frame-corner-inset':      '6px',

'--asset-stele-frame':       `url('${decor}/stele-frame.webp')`,
'--asset-mudcloth-band':     `url('${decor}/mudcloth-band.webp')`,
'--asset-baobab-corner':     `url('${decor}/baobab-corner.webp')`,
'--asset-acacia-canopy':     `url('${decor}/acacia-canopy.webp')`,
'--asset-monolith-watermark':`url('${decor}/monolith-watermark.webp')`,

/* 7 nav ikon */
'--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
'--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
'--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
'--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
'--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
'--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
'--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,

/* Inline SVG data-uri adinkra symboly (Sankofa, Gye Nyame, Adinkrahene, Akoma) */
'--asset-adinkra-sankofa':      `url("data:image/svg+xml;utf8,<svg ...>")`,
'--asset-adinkra-gye-nyame':    `url("data:image/svg+xml;utf8,<svg ...>")`,
'--asset-adinkra-adinkrahene':  `url("data:image/svg+xml;utf8,<svg ...>")`,
'--asset-adinkra-akoma':        `url("data:image/svg+xml;utf8,<svg ...>")`,
'--asset-adinkra-active-stamp': 'var(--asset-adinkra-sankofa)',
```

#### 2.7 Top-level theme properties

```ts
fonts: {
  logo: 'Allura',
  display: 'Yeseva One',
  body: 'Gentium Plus',
},
thumbnail: '/themes/thumbnails/africke.webp',
background: '/themes/backgrounds/africke.webp',
decorationsModule: () => import('./decorations.css'),
reducedMotion: 'safe',
```

### Krok 3 — `src/themes/themes/africke/decorations.css` — kompletní přepis

Velikost: ~850–950 řádků (z aktuálních 14).

**Struktura dle indián `decorations.css` (sekce 1–28), s africkou paletou a originálními motivy:**

| Sekce | Obsah |
|---|---|
| 1 | Background overlay (bg-overlay var, radial vignette + linear darken) |
| 2 | Heat shimmer overlay (`::before` shell pseudo, SVG turbulence, 8s, opacity 0.06) |
| 3 | Baobab corner silhouette (`::after` shell pseudo, top-left, opacity 0.18, fixed) |
| 4 | Acacia canopy v topbaru (`> header::after`, acacia-canopy asset, 12s sway) |
| 5 | Dust drift layer (3 SVG inline `background-image` particles, 12s/15s/18s linear) |
| 6 | Topbar styling (sandstone gradient bg, kente hairline gradient pásek pod) |
| 7 | Logo positioning (360/280/220 width) |
| 8 | Header buttons (sandstone tablet style, aged-gold text, Yeseva One) |
| 9 | Sidebar levý — frame (sandstone gradient, earth-ochre border, 4× corner-tl ornament) |
| 10 | Sidebar levý — section titles (Yeseva One uppercase aged-gold + horizon-glow divider) |
| 11 | Sidebar levý — NavItem idle/hover (sandstone tablet, aged-gold text, sunset glow) |
| 12 | Sidebar levý — NavItem **active** (horizon gradient bg, aged-gold + bronze stitch left-border, Sankofa watermark `::after`) |
| 13 | Sidebar pravý — ADMINISTRACE section order (nahoře, Adinkrahene watermark) |
| 14 | Sidebar pravý — Moje diskuze + Moje světy (Akoma watermark per section) |
| 15 | „+" tlačítka (rightAddBtn, addBtn — horizon gradient, Akoma adinkra stamp `::before`) |
| 16 | Welcome card — vyrytá pískovcová stéla (sandstone gradient, monolith watermark BG, mudcloth band bottom, 2× carved bronze diamond ornaments po stranách) |
| 17 | Welcome card — text styling (Yeseva One title dark, earth-laterite titleAccent, Gentium Plus body, Italianno aged-gold signature 30px) |
| 18 | Welcome card — aged-gold hairline pod title |
| 19 | Nav ikony (7 medailonů přes `data-nav-key` mapping, drop-shadow gold glow) |
| 20 | Novinky panel (sandstone, Yeseva One title horizon-dawn, Italianno empty hint) |
| 21 | PJ badge (mosazný štítek, aged-gold gradient, dark text, bronze-warm inset) |
| 22 | Sun ascending one-shot animation pro `[data-divider-key="horizon-glow"]` |
| 23 | Animation keyframes (heat-shimmer, dust-drift, acacia-sway, sun-ascending, adinkra-stamp-feedback) |
| 24 | Reduced-motion fallback (`@media prefers-reduced-motion: reduce`) |
| 25 | Mobile degradace (`@media max-width: 768px`) |
| 26 | Tablet adjustments (`@media min-width: 769px and max-width: 1024px`) |
| 27 | Forced colors (`@media forced-colors: active`) |
| 28 | Scrollbar styling (earth-shadow track, aged-gold thumb) |
| 29 | Focus visible (box-shadow ring horizon-dawn) |

**Klíčové implementační detaily:**

- **Heat shimmer**: inline SVG `<filter id="africke-shimmer"><feTurbulence baseFrequency="0.02" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter>` jako `background-image` na `::before` pseudo, animation přes opacity pulse (NE seed regenerace = GPU heavy)
- **Dust drift**: 3 layered backgrounds s data-uri SVG (small dots opacity 0.15, medium 0.25, large 0.4), `animation: africke-dust-drift Xs linear infinite` přes `background-position`
- **Acacia sway**: `transform: rotate()` 2° cycle, transform-origin top center, 12s ease-in-out
- **Sun ascending**: `@keyframes` 0% → 100% (translateY 20px → 0, opacity 0 → 1), `animation-fill-mode: forwards`, applied 1× via JS toggle nebo `:not(:has(.loaded))` selector (TBD impl detail)
- **Welcome stéla nepulsuje** — záměrně bez animace (signaturní klid)

### Krok 4 — Vývojový server: visual test

1. `npm run dev` — spuštění FE
2. Otevři `http://localhost:5173`, přepni na téma „Země předků" (skin selector v pravém panelu)
3. **Desktop test (1920×1080):**
   - BG savana je vidět + radial vignette
   - Topbar: logo banner kente vlevo, acacia canopy silueta nahoře, sandstone tablet buttony vpravo s aged-gold textem
   - Kente hairline pod topbarem
   - Baobab silueta v levém horním rohu BG (opacity 0.18)
   - Heat shimmer subtle v top 35vh
   - Dust drift částice 3 vrstvy diagonálně
   - Sidebar levý: sandstone panel + 4× carved bronze diamond corners, NAVIGACE/VESMÍRY/CHAT v aged-gold Yeseva One, horizon-glow dividers pod
   - Welcome stéla: sandstone aspect 16:7, monolith watermark center-right, 2× bronze diamond po stranách, mudcloth band dole, title Yeseva One, paragraph Gentium Plus, signature Italianno aged-gold 30px
   - Welcome stéla NEPULSUJE
   - Nav active state: horizon gradient bg + aged-gold/bronze stitch left-border + Sankofa stamp v rohu (opacity 0.18)
   - „+" tlačítka mají Akoma adinkra ikonu, hover scale 1.08
   - Pravý panel: ADMINISTRACE (Adinkrahene watermark) nahoře, Moje diskuze (Akoma) + Moje světy (Akoma) uprostřed
   - Sun ascending animace při prvním načtení (jen 1×)
4. **Tablet test (1024×768):**
   - Logo 280px ✓
   - Corner-tl 52px ✓
   - Layout zachován ✓
5. **Mobile test (375×667):**
   - Drawer sidebar opens
   - Welcome stéla obdélník (aspect-ratio uvolněn), bronze diamonds po stranách scaled 0.7 nebo skryté (≤480px)
   - Baobab corner skryto
   - Acacia canopy redukováno (height 32px)
   - Dust drift jen 1 vrstva
   - Heat shimmer opacity 0.03
   - Header buttons icon-only
   - Logo 220px
   - Touch targets ≥48px
6. **Reduced-motion test:** `prefers-reduced-motion: reduce` v DevTools → heat-shimmer / dust-drift / acacia-sway / sun-ascending zastaveno
7. **Forced colors test:** Windows high-contrast simulace → corner-tl + stele-frame + medailon + nav ikony + adinkra watermarks zachovány
8. **Smoke test:** přepnout na 3 jiné skiny (hospoda / severske-runy / indiane) → žádná regrese
9. **Lighthouse a11y audit** na africkém skinu → ≥95 score

### Krok 5 — Lint & contrast audit

1. `npm run lint:colors` — žádné hardcoded barvy mimo CSS vars (audit specu sekce 4.13–4.16)
2. `npm run audit:contrast` — všechny WCAG kombinace ≥ AA (predikováno AC-22 dle spec sekce 6)

### Krok 6 — Screenshots na 3 viewportech

Spustit `npm run screenshot:3viewports` (pokud existuje) NEBO ručně přes Playwright:
- `docs/arch/phase-1/_screenshots/africke-mobile-375.png`
- `docs/arch/phase-1/_screenshots/africke-tablet-1024.png`
- `docs/arch/phase-1/_screenshots/africke-desktop-1920.png`
- `docs/arch/phase-1/_screenshots/africke-welcome-zoom.png` (close-up pískovcové stély)
- `docs/arch/phase-1/_screenshots/africke-sidebar-zoom.png` (close-up nav s active state — stitch left-border + Sankofa stamp)

### Krok 7 — Roadmap & dluhy update

1. Zaškrtnout 1.0q v [`docs/roadmap-fe.md`](../../roadmap-fe.md) (pokud existuje + obsahuje 1.0q entry — jinak přidat)
2. Review [`docs/dluhy.md`](../../dluhy.md) — pokud existuje záznam typu „africké skin slabý" / „Cinzel font off-brand", uzavřít

### Krok 8 — Post-impl: doc cleanup

[`docs/themes/africke.md`](../../themes/africke.md) (pokud existuje) — **přepsat** na nové „Země předků", s odkazem na spec-1.0q. Pokud neexistuje, vytvořit volitelně (post-impl, ne v rámci 1.0q PR).

### Krok 9 — Commit & PR

1. `git status` — verify changed files match plan (jen `index.ts`, `decorations.css`, asset file moves, finalize script, doc updates, screenshots)
2. `git add` (specifické soubory, ne `-A`)
3. Commit message:
   ```
   feat(themes/africke): krok 1.0q — Země předků skin upgrade

   - Kompletní přepis index.ts (paleta sandstone + bronze + kente + horizon + aged gold,
     fonty Allura + Yeseva One + Gentium Plus + Italianno, 15 asset URLs + 4 inline adinkra SVG)
   - Kompletní přepis decorations.css (~900 řádků, 29 sekcí dle indián vzoru)
   - Welcome card jako vyrytá pískovcová stéla (statická, signaturní klid) s monolith
     watermark + 2× carved bronze diamonds po stranách + mudcloth band dole
   - Originální motivy: heat shimmer, diagonal dust drift, acacia canopy sway,
     baobab corner silueta, sun ascending one-shot, aged-gold/bronze stitch left-border,
     adinkra watermarks (Sankofa/Gye Nyame/Adinkrahene/Akoma kontextové)
   - 15 assetů v public/themes/africke/decor/ (13 AI + logo + medailon)
   - scripts/finalize-africke-assets.mjs (resize pipeline)
   - ADMINISTRACE pravý panel order (skin + uživatelé nahoře)
   - Mobile fallback: stéla obdélník, baobab + acacia redukováno, dust 1 vrstva,
     heat shimmer redukován, bronze diamonds scaled/skryté
   - Reduced-motion fallback pro všech 4 ambient animací + 1 one-shot
   - Forced colors a11y respektováno
   - Žádný globální dopad — vše scoped [data-theme="africke"]
   ```
4. Push & PR (pokud workflow vyžaduje PR), jinak direct merge do `main`

---

## 2. Risk mitigace dle spec sekce 12

| Risk | Akce v implementaci |
|---|---|
| UI rám „přerazí" BG savana | Sandstone panely v earth-shadow tónu (sjednocené s BG), border 1px, carving jen v rozích (corner 72px), žádné high-contrast iron-na-dark |
| Text v stéle nečitelný | Sandstone gradient `#c89878 → #8a5028`, dark text `#2a1408` (AAA 7.8 ratio), padding x>y, aspect 16:7 dává prostor |
| Animační chaos — 4 ambient + 1 one-shot | 5 typů s jasnými rolemi (heat / dust / acacia / sun-ascending / stamp-feedback), všechny reduced-motion fallback, dust mobile redukce na 1 vrstvu |
| Aged-gold nízký kontrast na sandstone | Pouze decorative accent (titleAccent) + signature Italianno 30px+ — NIKDY pro body text |
| Heat shimmer GPU heavy | Opacity 0.06, jen 35vh, animace přes opacity (NE seed regen), reduced-motion vypíná |
| Diagonal dust drift performance (3 vrstvy) | Mobile redukce na 1 vrstvu, CSS-only background-position animation (GPU accelerated), žádný JS |
| Konflikt s `indiane` (oba zemité) | Indián = wood + iron + leather (materials), africké = sandstone + bronze + kente (různé materials) — jasná separace |
| Konflikt s `arabsky-svet` | Arabský = palác + arabesque (severní Afrika), africké = savana + sub-saharská (kente + adinkra + mudcloth) — odlišný materiálový jazyk |
| Adinkra necitlivé použití | Universal-symbolic ornamenty (moudrost, kontinuita), opacity 0.08 — decentní, ne ostentativní |
| Welcome stéla statická = nudná | Ambient motion okolo (dust + heat shimmer + acacia sway) dodává život BEZ pulse — záměrná klidná designová volba |
| Asset balík nekonzistentní | ✅ audit hotov, všech 13 AI assetů má sandstone tablet + carved relief + top-left rim-light |

---

## 3. Akceptační kritéria checkpoint

Při dokončení každého kroku ověř proti AC-1 až AC-27 z [`spec-1.0q-africke-upgrade.md`](spec-1.0q-africke-upgrade.md) sekce 10. Pokud AC fails → stop, prokomunikuj uživateli, ne pokračovat.

---

## 4. Post-implementační check-list

- [ ] AC-1 .. AC-27 vše zelené
- [ ] Screenshots × 5 (mobile / tablet / desktop / welcome-zoom / sidebar-zoom) uloženy
- [ ] `npm run lint:colors` projde
- [ ] `npm run audit:contrast` projde
- [ ] Smoke test 3 jiné skiny (hospoda / severske / indiane) → žádná regrese
- [ ] Reduced-motion test projde
- [ ] Forced colors test projde
- [ ] [`docs/roadmap-fe.md`](../../roadmap-fe.md) update
- [ ] [`docs/themes/africke.md`](../../themes/africke.md) přepis / vytvoření (post-impl, volitelné)
- [ ] Commit + push

---

## 5. Mimo scope (explicitně)

- Globální CSS (žádné edity)
- Shell layout komponenty (žádné edity)
- Ostatní 21 skinů (nulová regrese)
- Theme registry [`src/themes/themes/index.ts`](../../../src/themes/themes/index.ts) (africké už registrován)
- TypeScript typy (žádný edit)
- Backend / API změny
- Nové komponenty
- i18n překlady
- Background regeneration (zachováno `africke.webp`)
- Thumbnail regeneration (zachováno `africke.webp`)
- Cleanup `docs/themes/africke.md` (volitelné, post-impl, ne v 1.0q PR)

---

**Status:** 🟡 **Plán ke schválení**. Po souhlasu pokračuji s implementací — pořadí: Krok 1 (fonts) → Krok 2 (index.ts) → Krok 3 (decorations.css) → Krok 4 (dev test) → Krok 5 (lint) → Krok 6 (screenshots) → Krok 7 (roadmap) → Krok 8 (doc cleanup) → Krok 9 (commit).
