# Spec 1.0h — Příroda visual upgrade

**Datum:** 2026-05-09
**Status:** ⏳ Čeká na schválení
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
- Pravé tlačítka (Pošta, Uživatelé, Zlatý standard, Tyky, Odhlásit) — **chamfered dřevěné cedulky** se zlatým rámečkem, zlatý uppercase text Cinzel
- Zlatý standard má rozbalovací caret — zachovat current pattern

### 1.3 Sidebar levý — NAVIGACE / VESMÍRY / CHAT
- Frame: tmavě hnědý dřevěný panel, břečťanové úponky obtáčející levou hranu (CSS clip-path nebo dekorovaný element, **NE** plná raster ramečky — ty řešíme rohovými assety v 1.4)
- Section title: zlatý uppercase Cinzel, **bez chevronů** (priroda je jemnější než vesmirna-lod), pod ním tenký zlatý ornament `❦` nebo CSS rule s leafy ends
- NavItem (každá položka):
  - Pozadí v klidu = `linear-gradient` tmavě zelený dřevěný panel s velmi jemným highlightem
  - Před textem = malý zelený lístek (ikona — viz 1.7 Ikony)
  - Aktivní = sytější smaragdový fill + zlatý 2px left border + jemný zlatý glow
  - Hover = mírný posun zlatého glow
  - Text uppercase Cinzel, krémová `#e8d8a0`

### 1.4 Welcome card (centrální panel)
- **Min-height 60vh**, frame v kaligrafickém dřevěném rámečku s břečťanem v rozích
- Vlevo: **medailon** z `medailon.png` (anděl ve dřevěném rámu s květy) — `--asset-andel-medallion`
- Nahoře nad medailonem: kruhový dekorační uzel z `references/priroda.png` (ten malý medailon s úponky uprostřed nahoře) — **CSS only nebo malý raster** (rozhodne audit)
- Heading: `Vítej v <span>Projektu Ikaros</span>.` — sériová Cinzel s kurzívnou ozdobou na "Projektu Ikaros" zlatou
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

- **Default leaf glyph pro všechny nav-itemy** — jediný malý SVG/raster lístek, sdílený jako CSS background var (`--asset-icon-leaf`)
- **Speciální assety pouze pro 3 položky** (uživatel explicitně zvažoval):
  - **Hospoda** — pivní korbel s listovým ornamentem
  - **Úvodník** — rozvinutý svitek s pečetí
  - **Nápověda** — kniha s zlatým křížkem nebo otazníkem v rámečku z větviček

Prompty pro AI generování těchto assetů → kapitola 4.

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

// Text
'--theme-text':       '#e8d8a0',
'--theme-text-muted': '#a09060',
'--theme-heading':    '#d4a946',

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

// Default leaf pro všechny nav-itemy
'--asset-icon-leaf':       `url('${decor}/icon-leaf.webp')`,

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

- **Žádné raster border-image** pro panely (pomalé). Místo toho: tmavě zelený surface + 1px smaragd border + corner pseudo-elementy s břečťanovým úponkem (CSS gradient `radial`+`linear` skládaný do tvaru lístku) — pokud audit ukáže že to nestačí, nahradíme malými PNG corner ornamenty (4 unikátní rohy z reference).
- **NavItem aktivní**: smaragd gradient + zlatý 2px left-border + zlatý glow.
- **Buttony Pošta/Uživatelé/...**: dřevěná cedulka pomocí `linear-gradient` + 1px zlatý outer border + 1px tmavě hnědý inner shadow.
- **Heading "Vítej v Projektu Ikaros."**: `Projektu Ikaros` ovinout do `<span>` v existující komponentě `WelcomeHero` (nebo její ekvivalent — viz Open Questions Q3) → CSS nasází zlatou kurzivní Cinzel.
- **Reduced motion**: vypnuté všechny `transition` u glow; `box-shadow` nastaven staticky.

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

### 4.2 Nové assety k AI-generování (prompty níže)

#### `icon-leaf.webp` — default nav ikona (jeden kus, sdílený)
- Velikost: 64×64 px, transparentní pozadí
- Prompt:
  > A single small ivy leaf icon, deep emerald green with subtle gold outline, soft warm rim-light from top-left, hand-painted storybook style (Brian Froud / Hidden Folks), clean transparent background, centered, no shadow, no text, no frame. Slight glossy highlight on the leaf surface. Style consistent with a dark fantasy enchanted forest UI.

#### `icon-hospoda.webp` — pivní korbel (Hospoda)
- Velikost: 96×96 px, transparentní pozadí
- Prompt:
  > A small wooden beer tankard with golden rim and small ivy leaf wrapping around the handle, deep amber ale visible at the top, hand-painted storybook style (Brian Froud / Stardew Valley), warm gold rim-light, clean transparent background, centered icon, no text, no shadow, no frame. Color palette: dark wood brown, amber gold, emerald green ivy. Style consistent with a dark fantasy enchanted forest UI.

#### `icon-uvodnik.webp` — svitek s pečetí (Úvodník)
- Velikost: 96×96 px, transparentní pozadí
- Prompt:
  > A small unrolled parchment scroll with a dark green wax seal in the center stamped with a leaf-shaped emblem, soft golden edges of the parchment, two ivy tendrils curling around the rolled ends, hand-painted storybook style (Brian Froud), warm rim-light, clean transparent background, centered icon, no text on the parchment, no shadow, no frame. Color palette: cream parchment, emerald green seal, gold accents. Style consistent with a dark fantasy enchanted forest UI.

#### `icon-napoveda.webp` — kniha v rámečku z větviček (Nápověda)
- Velikost: 96×96 px, transparentní pozadí
- Prompt:
  > A small closed leather-bound spellbook with a golden question mark embossed on the cover, framed by two small intertwined ivy branches forming an arch above it, hand-painted storybook style (Brian Froud), warm gold rim-light, clean transparent background, centered icon, no text apart from the question mark, no shadow, no frame. Color palette: dark green leather, brushed gold, emerald ivy. Style consistent with a dark fantasy enchanted forest UI.

> **Pravidlo konzistence:** všechny 4 nové ikony mají stejný light angle (top-left), stejnou barevnou paletu (smaragd + zlato + dřevo) a stejný stylistický charakter (Brian Froud / storybook). Pokud kterákoli z nich vypadá outlier, regenerujeme ji s explicitní referencí na ostatní 3.

---

## 5. Mobile vs desktop

Per project rule (`base.md`): UI funguje na mobilu i desktopu, audit přes skill `mobil-desktop` po implementaci.

- **Desktop ≥1024px** — full layout dle reference (3 sloupce: levý sidebar 280px, střed flex, pravý sidebar 280px)
- **Tablet 768–1023px** — pravý sidebar collapsuje do drawer / pod welcome card; logo `--asset-logo-w-mobile`
- **Mobile <768px** — oba sidebary za hamburger, welcome card full-width, medailon zmenšen na 120px
- Břečťanové úponky v rozích panelů — na mobilu zmenšit na 50% (jinak působí těžce)
- Topbar buttony — na mobilu pouze ikona (text v `aria-label`)

---

## 6. Mimo rozsah

- Změna `IkarosLayout`, `IkarosCard`, `CornerOrnament` — sdílené komponenty NEEDITUJEME (memory rule: theme úpravy scoped na `[data-theme]`)
- Animace (padající listy, světlušky, kymácející se větve) — out of scope, skin je staticky tichý
- Edit ostatních 20 témat — nulová regrese je požadavek, ne feature
- Refactor existujícího `priroda` index.ts paletu zachovat? — **NE**, plný přepis (současná olivová paleta neodpovídá referenci)

---

## 7. Open questions (čekají na odpověď před fází impl-plan)

1. **Q1 — corner ornamenty rohů panelů**: pokud CSS-only břečťan v rozích nedá dostatek "kouzla", vyrobíme 4 unikátní raster rohy (TL, TR, BL, BR) jako `corner-tl.webp` … atd.? Nebo necháme čistě CSS?
2. **Q2 — "Default leaf" ikona pro 4 zbylé nav-itemy**: stačí jedna sdílená ikona, nebo chceš pro každý nav-item vlastní (Vytvořit svět = klíček, Diskuze = bublina, Články = svitek, Galerie = rámeček)? Pozn. svitek už máme pro Úvodník, mohli bychom kolidovat.
3. **Q3 — heading wrapping**: `WelcomeHero` (nebo její ekvivalent) má `<h1>Vítej v <span>Projektu Ikaros</span>.</h1>`? Pokud ne, je úprava této shared komponenty pro nás přípustná, nebo to obejdeme čistě CSS pseudo-elementem?
4. **Q4 — chat / hospoda v levém sidebaru**: aktuálně levý sidebar má sekci "CHAT (0)" + "DIMENZIONÁLNÍ HOSPODA". Necháváme přesně dle reference, nebo má hospoda vlastní section title?

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
