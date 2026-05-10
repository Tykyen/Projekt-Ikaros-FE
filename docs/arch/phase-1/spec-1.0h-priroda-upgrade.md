# Spec 1.0h — Příroda visual upgrade

**Datum:** 2026-05-09
**Status:** ✅ Schváleno (po audit-1.0h-priroda.md)
**Audit:** [audit-1.0h-priroda.md](audit-1.0h-priroda.md)
**Roadmap:** `docs/roadmap-fe.md` → Fáze 1 → 1.0h
**Závisí na:** 1.0g vesmirna-lod ✅ (pattern předlohy)
**Reference:**
- `assets-source/themes/references/priroda.png` — cílový mockup (zakletý les, břečťanový rám, anděl medailon)
- `assets-source/themes/backgrounds/priroda.png` — pozadí (temný les + zelené krystaly)
- `assets-source/themes/priroda/logo.png` — finální logo banner
- `assets-source/themes/priroda/medailon.png` — finální medailon anděla

---

## 0. Princip — zakletý prastarý les, ne fantasy RPG menu

V repu existuje 21 témat. Aby `priroda` nepřipomínala `magie` (mystický fialový les) nebo `pergamen` (středověký svitek), držíme se jediného estetického záměru:

> **Zakletý prastarý les při západu slunce — dřevo + břečťan + smaragdové krystaly + zlato kaligrafie. Atmosféra tichá, organická, mírně melancholická, ne pohádková ani temná.**

Inspirace: ilustrace Briana Frouda (Labyrinth, Dark Crystal), Stardew Valley journal frames, Hidden Folks foliage. **NE** WoW night-elf, **NE** Disney Tinkerbell, **NE** generic D&D parchment.

**Strict isolation:** vše scoped přes `[data-theme="priroda"]`. Zbylých 20 témat = nulová regrese. (Memory rule: žádné sdílení/recyklace ornamentů mezi tématy.)

---

## 1. Cíl — vizuální popis (sekce po sekci dle reference)

Po načtení s `themeId === 'priroda'` má dashboard vypadat dle `references/priroda.png`:

### 1.1 Background & atmosféra
- **Background image** — `/themes/backgrounds/priroda.webp` (ze zdroje `assets-source/themes/backgrounds/priroda.png`, převést PNG→WEBP)
- **Atmosférický overlay** — radial zlatý glow 50/0% (sluneční paprsky shora) + radial smaragdový glow 50/100% (krystaly zespodu) + linear darken
- Dominantní barvy: temně zelená `#0d2818`, smaragd `#1f6a3a`, mech `#3d7a35`, zlato `#d4a946`, krémová bílá `#e8d8a0`, dřevo `#3d2914`

### 1.2 Topbar (slim, 56px)
- Pozadí: dřevěná deska s jemným textury wood-grain (CSS gradient, ne raster)
- Logo vlevo (z `logo.png`): šíře `--asset-logo-w: 220px` desktop / `170px` mobile
- Pravé tlačítka (Pošta, Uživatelé, Zlatý standard, Tyky, Odhlásit) — **chamfered dřevěné cedulky** se zlatým rámečkem, **TMAVÝ uppercase text `#3d2914` Cinzel** (audit H8 — krémová proti zlaté = WCAG fail 1.5:1)
- Zlatý standard má rozbalovací caret — zachovat current pattern
- **Pod 768px**: buttony icon-only s `aria-label` (Cinzel uppercase se nevejde — audit H3)
- **Pod 480px**: Tyky + Odhlásit do hamburger menu

### 1.3 Sidebar levý — NAVIGACE / VESMÍRY / CHAT
- Frame: tmavě hnědý dřevěný panel, břečťanové úponky obtáčející levou hranu (CSS clip-path nebo dekorovaný element, **NE** plná raster ramečky — ty řešíme rohovými assety v 1.4)
- Section title: zlatý uppercase Cinzel, **bez chevronů** (priroda je jemnější než vesmirna-lod), pod ním tenký **CSS-only** zlatý gradient rule (1px linear-gradient s leafy `::before`/`::after` glyphs) — Cinzel nemá `❦` glyph (audit H6)
- NavItem (každá položka):
  - Pozadí v klidu = `linear-gradient` tmavě zelený dřevěný panel s velmi jemným highlightem
  - Před textem = malý zelený lístek (ikona — viz 1.7 Ikony)
  - Aktivní = sytější smaragdový fill + zlatý 2px left border + jemný zlatý glow
  - Hover = mírný posun zlatého glow
  - Text uppercase Cinzel, krémová `#e8d8a0`

### 1.4 Welcome card (centrální panel)
- **Min-height `clamp(420px, 60vh, 720px)`** (audit H2 — fixed 60vh praskne na 1366×720 + taskbar), frame v kaligrafickém dřevěném rámečku s břečťanem v rozích
- Vlevo: **medailon** z `medailon.png` (anděl ve dřevěném rámu s květy) — `--asset-andel-medallion`
- Nahoře nad medailonem: kruhový dekorační uzel z `references/priroda.png` (ten malý medailon s úponky uprostřed nahoře) — **CSS only nebo malý raster** (rozhodne audit)
- Heading: `Vítej v <span class="titleAccent">Projektu Ikaros.</span>` — wrap **už existuje** v [`DashboardPage.tsx:47`](../../../src/features/ikaros/pages/DashboardPage.tsx). Žádný shared edit. Pod `[data-theme="priroda"] .titleAccent` aplikujeme italic Cinzel + zlatou.
- Body text: Lora regular, krémová
- Signature: `Příjemnou zábavu přeji administrátoři.` — IM Fell English italic, zlatá

### 1.5 Sidebar pravý — MOJE DISKUZE / MOJE SVĚTY
- Stejný dřevěný panel pattern jako levý
- Section title v rámečku se zaoblenými rohy + ikona vpravo (komiksový `💬` resp. `🌍` — **CSS pseudo-element** nebo lucide-react ikona se zlatým barvením, NE samostatný asset)
- Item-tlačítka (MATRIX, NOVÝ SVĚT, MATRIX PJ atd.) = **zelené smaragdové cedulky** s lístkem vlevo
- "ZOBRAZIT VŠE →" link link-style zlatý

### 1.6 Novinky panel (dole)
- Stejný dřevěný frame pattern
- Heading "Novinky" se zlatou ikonou (svitek/kniha — viz 1.7)
- Tlačítko "+ PŘIDAT NOVINKU" — zlaté outline + jemný glow

### 1.7 Ikony — strategie

Reference ukazuje **drobný zelený lístek** u každého nav-itemu. Místo 7 jednotlivých rasterových ikon (jako `vesmirna-lod`) jdeme **hybridně**:

- **Default leaf glyph pro všechny nav-itemy** — sdílený lístek ve **2 výstupních velikostech** (audit M3): `icon-leaf-64.webp` (desktop) + `icon-leaf-32.webp` (mobile, sharp downscale)
- **Speciální assety pouze pro 3 položky**:
  - **Hospoda** — pivní korbel s listovým ornamentem
  - **Úvodník** — rozvinutý svitek s pečetí
  - **Nápověda** — kniha s ivy úponkem (audit B1: regenerace s 3/4 angled view + hand-painted)

Prompty pro AI generování těchto assetů → [`_asset-prompts.md`](../../../public/themes/priroda/decor/_asset-prompts.md).

### 1.8 Hover & focus & reduced motion
- Hover: jemný 200ms ease zlatý glow (12px), bez transformace pozice
- Focus ring: zlatý 2px solid + 4px soft halo
- `prefers-reduced-motion: reduce` → glow zachován ale fade-in/out vypnut. Žádné kymácející se větve, žádné padající listy. (Skin je tichý.)

---

## 2. Token model — `themes/themes/priroda/index.ts` (plný přepis)

Replikuje luxury token schema z 1.0g (vesmirna-lod). Paleta = smaragd + zlato + dřevo (NE současné olivová `#4a8a30` z minimálního skinu).

### 2.1 Paleta — luxury tokeny

```ts
// Atmosférický overlay
'--theme-bg-overlay':
  'radial-gradient(ellipse at 50% 0%, rgba(212, 169, 70, 0.20) 0%, transparent 55%), ' +
  'radial-gradient(ellipse at 50% 100%, rgba(31, 106, 58, 0.22) 0%, transparent 60%), ' +
  'linear-gradient(180deg, rgba(8, 16, 10, 0.40) 0%, rgba(8, 16, 10, 0.62) 100%)',

// Glass surfaces — temně dřevěné
'--theme-surface':        'rgba(20, 32, 22, 0.82)',
'--theme-surface-strong': 'rgba(12, 22, 14, 0.94)',
'--theme-surface-soft':   'rgba(28, 44, 30, 0.55)',

// Borders — smaragd primary + zlato secondary
'--theme-border':        'rgba(31, 106, 58, 0.72)',
'--theme-border-soft':   'rgba(31, 106, 58, 0.30)',
'--theme-border-gold':   'rgba(212, 169, 70, 0.62)',
'--theme-border-emerald':'rgba(31, 106, 58, 0.55)',

// Text (audit M1: muted #a09060→#b8a070 pro WCAG AA pass)
'--theme-text':       '#e8d8a0',
'--theme-text-muted': '#b8a070',
'--theme-heading':    '#d4a946',
'--theme-text-on-emerald': '#fff8e0',  // NavItem aktivní (audit H1)
'--theme-text-on-gold':    '#3d2914',  // topbar zlaté cedulky (audit H8)

// Accents
'--theme-accent':              '#1f6a3a',  // smaragd
'--theme-accent-bright':       '#3d9a4a',
'--theme-accent-emerald':      '#1f6a3a',
'--theme-accent-gold':         '#d4a946',
'--theme-accent-gold-bright':  '#f0c860',

'--theme-glow-emerald':         'rgba(31, 106, 58, 0.45)',
'--theme-glow-emerald-strong':  'rgba(31, 106, 58, 0.70)',
'--theme-glow-gold':             'rgba(212, 169, 70, 0.42)',
'--theme-glow-gold-strong':      'rgba(212, 169, 70, 0.65)',
'--theme-shadow':                'rgba(4, 8, 6, 0.88)',

'--theme-nav-hover-bg':   'rgba(31, 106, 58, 0.14)',
'--theme-nav-active-bg':
  'linear-gradient(90deg, rgba(31, 106, 58, 0.32) 0%, rgba(20, 32, 22, 0.55) 100%)',
```

### 2.2 Legacy tokeny (mapped na luxury)

```ts
'--bg-primary':    '#081610',
'--bg-secondary':  '#0d2818',
'--bg-card':       'var(--theme-surface)',
'--bg-card-hover': 'var(--theme-surface-soft)',
'--accent':        'var(--theme-accent)',
'--accent-bright': 'var(--theme-accent-bright)',
'--accent-dim':    '#0e3a20',
'--accent-soft':   'var(--theme-border-soft)',
'--text-primary':  'var(--theme-text)',
'--text-secondary':'var(--theme-text-muted)',
'--text-muted':    '#605030',
'--border':        'var(--theme-border-soft)',
'--border-subtle': 'rgba(31, 106, 58, 0.16)',
'--border-strong': 'var(--theme-border)',
'--success':              '#3d9a4a',
'--warning':              '#d4a946',
'--danger':               '#c04030',
'--info':                 'var(--theme-accent)',
'--text-on-accent':       '#e8f0d8',
'--text-on-danger':       '#fff8e0',
'--bg-overlay':           'rgba(8, 16, 10, 0.7)',
// ... soft variants stejný pattern jako vesmirna-lod
```

### 2.3 Typografie

```ts
'--font-logo':    '"Cinzel", "Uncial Antiqua", Georgia, serif',
'--font-display': '"Cinzel", "IM Fell English", Georgia, serif',
'--font-body':    '"Lora", Georgia, serif',
'--font-script':  '"IM Fell English", "Lora", serif',
```

### 2.4 Layout chrome

```ts
'--header-h':            '56px',
'--header-bg':           '#0d2818',
'--frame-pad-y':         '40px',
'--frame-pad-x':         '18px',
'--sidebar-w':           '280px',

'--asset-logo-w':         '220px',
'--asset-logo-w-mobile':  '170px',
'--logo-img-display':     'block',
'--logo-fallback-display':'none',
```

### 2.5 Asset URLs

```ts
const decor = '/themes/priroda/decor';

'--asset-logo':            `url('${decor}/logo.webp')`,
'--asset-andel-medallion': `url('${decor}/medallion.webp')`,

// Corner ornament (audit H1: chyběl ve spec)
'--asset-corner':           `url('${decor}/corner-tl.webp')`,
'--asset-corner-size':      '120px',
'--asset-corner-size-mobile':'64px',
'--frame-corner-inset':     '8px',

// Default leaf pro všechny nav-itemy (audit M3: 2 výstupní velikosti)
'--asset-icon-leaf':        `url('${decor}/icon-leaf-64.webp')`,
'--asset-icon-leaf-mobile': `url('${decor}/icon-leaf-32.webp')`,

// 3 speciální nav ikony
'--asset-icon-hospoda':    `url('${decor}/icon-hospoda.webp')`,
'--asset-icon-uvodnik':    `url('${decor}/icon-uvodnik.webp')`,
'--asset-icon-napoveda':   `url('${decor}/icon-napoveda.webp')`,

// 4 nav-itemy bez vlastního assetu padají na --asset-icon-leaf:
//   Vytvořit svět, Diskuze, Články, Galerie
```

---

## 3. Dekorace — `decorations.css`

Vše pod `[data-theme="priroda"]`. Klíčové pravidla:

- **Corner ornamenty** (audit rozhodnutí Q1) — raster `corner-tl.webp` + 4 absolutní `<i>` divy NEBO výrazný pseudo-element pattern. TL = původní; TR = `scaleX(-1)`; BL = `scaleY(-1)`; BR = `scale(-1,-1)`.
- **Z-index** (audit H7): corner ornaments `z-index: 0` + `pointer-events: none`; panel content `z-index: 1`; focus outline browser default (=2+).
- **Border-radius** panelu = stejný na corner pseudo / wrapper, ať corner respektuje skraje.
- **Mobile corner** (audit H5): `--asset-corner-size-mobile: 64px` + `opacity: 0.7`. **V drawer modu `display: none`**.
- **NavItem aktivní**: smaragd gradient + zlatý 2px left-border + zlatý glow + text `var(--theme-text-on-emerald)`.
- **Buttony Pošta/Uživatelé/...** (audit H8): dřevěná cedulka `linear-gradient` + 1px zlatý outer border + 1px tmavě hnědý inner shadow + **TMAVÝ text `var(--theme-text-on-gold)`** (NE krémový — WCAG fail).
- **Heading "Vítej v Projektu Ikaros."**: wrap `<span class="titleAccent">` **už existuje** v [`DashboardPage.tsx:47`](../../../src/features/ikaros/pages/DashboardPage.tsx). Pod `[data-theme="priroda"] .titleAccent` aplikujeme Cinzel italic + zlatá. Žádný shared edit (audit H10 vyřešen).
- **Section title decoration** (audit H6): místo `❦` (Cinzel nemá) — CSS-only `::after` 1px zlatý gradient rule s leafy pseudo-elementy.
- **Reduced motion** (audit L1): explicit `transition: none` na všechny `:hover` a `:focus-visible` glow shadows.
- **Focus visible na zlatých cedulkách**: fallback `outline: 2px solid var(--theme-accent-emerald)` (audit Accessibility — zlatý outline by zmizel).
- **Scrollbar styling** pro overflow-y panely: `scrollbar-color: var(--theme-accent-gold) var(--theme-surface)` (FF), webkit thumb gold.

---

## 4. Assety k vyrobení — prompty pro AI

Uživatel explicitně požádal o samostatný soubor s prompty. **Vyrobíme ho zvlášť:** `public/themes/priroda/decor/_asset-prompts.md` (per pattern už použitý v `vesmirna-lod` a `bila`).

### 4.1 Existující assety (pouze konverze PNG→WEBP)

| Zdroj | Cíl | Poznámka |
|---|---|---|
| `assets-source/themes/priroda/logo.png` | `public/themes/priroda/decor/logo.webp` | quality 92, lossless=false |
| `assets-source/themes/priroda/medailon.png` | `public/themes/priroda/decor/medallion.webp` | quality 92 |
| `assets-source/themes/backgrounds/priroda.png` | `public/themes/backgrounds/priroda.webp` | quality 88, max 1920px wide |
| `assets-source/themes/references/priroda.png` | `public/themes/thumbnails/priroda.webp` | resize 480×270, quality 80 |

### 4.2 Nové assety k AI-generování

| Asset | Cíl | Velikost |
|---|---|---|
| `icon-leaf.webp` | `public/themes/priroda/decor/icon-leaf.webp` | 64×64 |
| `icon-hospoda.webp` | `public/themes/priroda/decor/icon-hospoda.webp` | 96×96 |
| `icon-uvodnik.webp` | `public/themes/priroda/decor/icon-uvodnik.webp` | 96×96 |
| `icon-napoveda.webp` | `public/themes/priroda/decor/icon-napoveda.webp` | 96×96 |
| `corner-tl.webp` (master) | `public/themes/priroda/decor/corner-tl.webp` | 256×256 |

`corner-tl.webp` je jediný master roh — TR/BL/BR generujeme runtime CSS transformem (`scaleX/Y(-1)`).

**Plné prompty + style guide + paleta + negative list + kontrolní seznam:**
[`public/themes/priroda/decor/_asset-prompts.md`](../../../public/themes/priroda/decor/_asset-prompts.md)

> **Pravidlo konzistence:** všechny 4 nové ikony mají stejný light angle (top-left), stejnou barevnou paletu (smaragd + zlato + dřevo) a stejný stylistický charakter (Brian Froud / storybook). Pokud kterákoli z nich vypadá outlier, regenerujeme ji s explicitní referencí na ostatní 3.

---

## 5. Mobile vs desktop (audit H3, H4, H5, M2, M4)

Per project rule (`base.md`): UI funguje na mobilu i desktopu, audit přes skill `mobil-desktop` po implementaci.

| Viewport | Layout |
|---|---|
| **≥1280px** | Full 3-column (levý 280px + center + pravý 280px), corner 120px, leaf 64×64 |
| **1024–1279px** | Pravý sidebar do drawer (audit H4), levý visible, corner 120px |
| **768–1023px** | Levý sidebar do drawer, welcome card full-width, corner 96px |
| **<768px** | Oba sidebary za hamburger, medailon 120px, corner **64px** + opacity 0.7, leaf **32×32**, topbar buttony icon-only s `aria-label` |
| **<480px** | Tyky + Odhlásit do hamburger menu |

Další pravidla:
- **NavItem touch target ≥48px** na mobile (audit M4)
- **Corner ornament v drawer modu `display: none`** (audit H5)
- **Heading wrap**: `text-wrap: balance` aby Cinzel italic neteklo divně
- **Welcome medailon 240px desktop → 120px mobile**, žádný corner ornament v rohu medailonu na mobilu (audit M1)

---

## 6. Mimo rozsah

- Změna `IkarosLayout`, `IkarosCard`, `CornerOrnament` — sdílené komponenty NEEDITUJEME (memory rule: theme úpravy scoped na `[data-theme]`)
- Animace (padající listy, světlušky, kymácející se větve) — out of scope, skin je staticky tichý
- Edit ostatních 20 témat — nulová regrese je požadavek, ne feature
- Refactor existujícího `priroda` index.ts paletu zachovat? — **NE**, plný přepis (současná olivová paleta neodpovídá referenci)

---

## 7. Rozhodnutí (původní open questions)

1. **Q1 — corner ornamenty** ✅ RASTER. Vyrábíme **1 master `corner-tl.webp`**, ostatní 3 rohy přes CSS `transform: scaleX/Y(-1)`. Prompt v `_asset-prompts.md`.
2. **Q2 — default leaf** ✅ **1 sdílený `icon-leaf` + 3 speciální** (hospoda, úvodník, nápověda). 4 nav-itemy bez vlastní ikony (Vytvořit svět, Diskuze, Články, Galerie) padají na sdílený leaf.
3. **Q3 — heading wrap** ✅ **Wrap už existuje** v [`DashboardPage.tsx:47`](../../../src/features/ikaros/pages/DashboardPage.tsx) jako `<span className={s.titleAccent}>`. Žádný shared edit. Stačí pod `[data-theme="priroda"] .titleAccent { … }` v `decorations.css`.
4. **Q4 — chat / hospoda** ✅ Přesně dle reference: CHAT (0) + DIMENZIONÁLNÍ HOSPODA jako 2 spodní položky levého sidebaru, žádný nový section title.

---

## 7b. Performance & FOUC (audit M2)

- **8 WebP assetů** (~125 kb decor + ~280 kb background) — OK na 4G < 0.5 s
- **FOUC při theme switch** — preload target backgroundu před `data-theme` flip:
  ```ts
  // V theme switcheru: před setData-theme
  const img = new Image();
  img.src = nextTheme.background;
  img.onload = () => document.documentElement.dataset.theme = nextThemeId;
  ```
- **decorationsModule** lazy import (existuje v Theme typu) — žádná akce
- **Asset weight target**: ikona < 12 kb / kus, corner < 25 kb, logo < 35 kb, medailon < 40 kb
- **Composite layers**: `will-change: auto` (default), žádný `transform` GPU promote pro corner ornaments

---

## 8. Definition of Done (akceptační kritéria)

- [ ] `[data-theme="priroda"]` na dashboardu vypadá vizuálně shodně s `references/priroda.png` (±10%)
- [ ] Všech 20 ostatních témat se nezměnilo (vizuální regrese test, screenshot diff)
- [ ] Všechny tokeny v `index.ts` mají hodnoty (žádné `var(--undefined)`)
- [ ] Všechny assety dostupné na běhu (`/themes/priroda/decor/*.webp` + `/themes/backgrounds/priroda.webp` + `/themes/thumbnails/priroda.webp`)
- [ ] Mobil + desktop projde audit `mobil-desktop` skillu
- [ ] `prefers-reduced-motion: reduce` neukazuje žádnou animaci
- [ ] WCAG AA kontrast na všech text-on-surface kombinacích
- [ ] Žádný shared komponent needitován (potvrzení `git diff src/shared` + `src/app/layout` = empty pro tento commit)

---

## Postup po schválení

1. **Frontend-design audit** (memory rule: skin → vždy frontend-design audit mezi spec a impl. plán)
2. **Implementační plán** `plan-1.0h.md` — souborový rozpis, pořadí kroků, riziková místa
3. **Schválení plánu**
4. **Generování AI assetů** dle promptů v sekci 4.2 (uživatel spustí externě, dodá soubory)
5. **Konverze PNG→WEBP** pro logo + medailon + background + thumbnail
6. **Implementace** — `index.ts` přepis, `decorations.css` přepis
7. **Audit `mobil-desktop`**
8. **Commit + DoD checklist**
