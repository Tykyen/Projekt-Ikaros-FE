# Spec 1.0i — Pergamen visual upgrade

**Datum:** 2026-05-10
**Status:** ✅ Implementováno
**Audit:** [audit-1.0i-pergamen.md](audit-1.0i-pergamen.md)
**Roadmap:** `docs/roadmap-fe.md` → Fáze 1 → 1.0i (po 1.0h Příroda)
**Závisí na:** 1.0h Příroda ✅ (pattern předlohy + asset pipeline)
**Reference:**
- `assets-source/themes/pergament/logo.png` — finální logo banner (dodáno user)
- `assets-source/themes/pergament/medailon.png` — finální medailon anděla (dodáno user)
- `assets-source/themes/pergament/big-book.png` — velká otevřená kniha (dodáno user)
- `public/themes/backgrounds/pergamen.webp` — ✅ existuje, **neměníme** (rozhodnutí user)
- Mockup: viz obrázek 2 v zadání (knihovní layout)

> **Pozn. k názvu:** uživatel používá termín „Pergament", source folder je `assets-source/themes/pergament/`, ale theme ID v registry je **`pergamen`** (existující) — zachováváme. Source assety přesuneme z `pergament/` do `pergamen/` v rámci impl. plánu.

---

## 0. Princip — klášterní skriptorium s Tolkienovým handcrafted feel

V repu existuje 21 témat. Pergamen drží jediný estetický záměr:

> **Klášterní skriptorium 13. století okem Tolkienova kronikáře — pergamen + tmavé dřevo knižních vazeb + zlatá iluminace + sytě rudý burgundy vosk pečetí. Atmosféra rozjímavá, badatelská, lehce opotřebovaná („handcrafted, ne sterilní"), ne pohádková ani okultní.**

**Inspirační kotvy:** Book of Kells / Lindisfarne Gospel (paleta + iluminované initials) × Tolkienovy ručně psané dopisy a mapy (handcrafted feel, „warm" nedokonalost). **NE** Hogwarts kouzelnické svitky. **NE** generic D&D pergamen. **NE** chrámový gotický chlad bez emoce.

**Strict isolation:** vše scoped přes `[data-theme="pergamen"]`. Zbylých 20 témat = nulová regrese. (Memory rule: žádné sdílení/recyklace ornamentů mezi tématy.)

---

## 1. Cíl — vizuální popis (sekce po sekci dle obrázku 2)

Po načtení s `themeId === 'pergamen'` má dashboard vypadat dle obrázku 2:

### 1.1 Background & atmosféra
- **Background image** — `/themes/backgrounds/pergamen.webp` (✅ **existuje, neměníme** — knihovna se svíčkami, perem, otevřenou knihou)
- **Atmosférický overlay (audit H2):** existující BG je již teplý/oranžový → vyhnout se „double-warm" efektu. Pouze linear darken pro čitelnost UI, žádné radial color tints:
  ```css
  '--theme-bg-overlay':
    'linear-gradient(180deg, rgba(20, 14, 4, 0.55) 0%, rgba(20, 14, 4, 0.72) 100%)'
  ```
- Dominantní barvy: pergamen krém `#e8d8a0`, dřevo tmavé `#3d2914`, zlato `#d4a946`, burgundy `#8a1a10`, inkoust `#1a0e04`

### 1.2 Topbar (slim, 56px)
- Pozadí: tmavě dřevěná deska s wood-grain (CSS gradient)
- Logo vlevo (z `logo.png`): šíře `--asset-logo-w: 240px` desktop / `180px` mobile
- Pravé tlačítka (Pošta, Uživatelé, Zlatý standard, Tyky, Odhlásit) — **dřevěné cedulky se zlatým rámečkem + zlatý uppercase text Cinzel**
- Zlatý standard má rozbalovací caret (existující pattern)
- **Pod 768px**: buttony icon-only s `aria-label`
- **Pod 480px**: Tyky + Odhlásit do hamburger menu

### 1.3 Sidebar levý — NAVIGACE / VESMÍRY / CHAT
- Frame: tmavě hnědý dřevěný panel s ornamentálními rohy (raster `corner-tl.webp` přes 4 rohy via CSS scaleX/Y mirror)
- Section title: zlatý uppercase Cinzel
- **Sekční divider:** zlatý gradient hairline + drobná **červená vosková pečeť** uprostřed (4–6px), CSS-only nebo mini SVG
- NavItem (každá položka):
  - Klid = `linear-gradient` z tmavého dřeva s velmi jemným pergamen highlight
  - Před textem = unikátní pečeť (1 z 7, viz 1.7)
  - Hover = mírný posun pergamenového glow + zlatý glow textu
  - Aktivní = sytější burgundy fill + zlatý 2px left border + zlatý glow
  - Text uppercase Cinzel, krémová `#e8d8a0`

### 1.4 Welcome card (centrální panel)
- **Min-height `clamp(420px, 60vh, 720px)`**
- Dřevěný rámeček s ornamentálními rohy (raster `corner-tl.webp`)
- **Big-book jako decorative layer (audit B1 fix)** — z `big-book.png`:
  - Position: `absolute`, vycentrované za textem
  - Velikost: `width: clamp(420px, 75%, 600px)`, `height: auto`
  - **`opacity: 0.30`** (sníženo z 0.55 — pergamen plocha big-booku jinak vytváří béžovou zónu, krémový text by měl WCAG fail 2.1:1)
  - **`mix-blend-mode: multiply`** (smíchá s tmavým pozadím, zachová kontrast pro krémový text)
  - `z-index: 0`, `pointer-events: none`
  - Mobile (≤768px): `display: none`
- Vlevo medailon z `medailon.png` (anděl v rudém pergamenovém rámu) — `--asset-andel-medallion`, 240×290px desktop / 96×116px mobile (audit M3, sníženo z 120×145)
- Heading: `Vítej v <span class="titleAccent">Projektu Ikaros.</span>` — wrap **už existuje** v [`DashboardPage.tsx:47`](../../../src/features/ikaros/pages/DashboardPage.tsx)
- **🎨 BONUS: Iluminované „V" — CSS-only drop cap (rozhodnutí 2026-05-10: žádný asset)**
  - Implementace: `[data-theme="pergamen"] [class*="welcomeHeading"]::first-letter` — CSS pseudoelement, žádný raster asset
  - Vizuál: velké zlaté „V" ve fontu IM Fell English (script), `font-size: 3.5em`, `float: left`, `padding-right: 8px`, `line-height: 0.85`, `color: var(--theme-accent-gold-bright)`, `text-shadow: 0 0 8px var(--theme-glow-gold)`, jemný `text-stroke: 1px var(--theme-accent-gold)` pro extra váhu
  - Volitelný akcent: `background: radial-gradient(ellipse, var(--theme-glow-burgundy) 0%, transparent 60%)` pod V (subtle burgundy halo)
  - **Žádný split-span needed** — `::first-letter` automaticky stylizuje první písmeno bez DOM změn
  - Mobile (≤768px): `font-size: 2.5em` (mírně zmenšeno, ale zachováno — CSS škáluje plynule)
  - **Pros vs raster:** žádný asset, žádný „dvě V" issue, plně responsive, plně překládatelné, retina-sharp ve všech velikostech
  - **Cons vs raster:** méně dekorativní než Book of Kells iluminace s ornamenty — ale skin má dost ornamentů jinde (corner-tl, pečetě, bookmark)
- Body text: Lora regular, krémová s mírným inkoustovým podtónem
- Signature: `Příjemnou zábavu přejí administrátoři.` — IM Fell English italic, zlatá s glow
- **🎨 BONUS: Knižní záložka (audit B2 fix)** — `bookmark.webp` (rudá hedvábná stuha s zlatým střapcem) visící **zvenku** welcome card vpravo nahoře (closet hanger styl):
  - `position: absolute; top: 24px; right: -16px;` (mimo corner zone, žádná kolize)
  - `width: 48px; height: 160px;`
  - Pure decorative, `pointer-events: none`
  - Mobile (≤768px): hidden (vertical stack nezvládne side-protruding element)

### 1.5 Sidebar pravý — ADMINISTRACE / MOJE SVĚTY / MOJE DISKUZE / OBLÍBENÉ
- **Pozn.** podle memory `project_admin_panel_decision.md`: Uživatelé + Skin selector zůstávají v ADMINISTRACE (pravý panel).
- Stejný dřevěný panel pattern jako levý + corner ornamenty
- Section title v rámečku se zaoblenými rohy + lucide ikona vpravo se zlatým barvením
- Sekční divider: stejný jako v levém sidebaru (gradient + pečeť uprostřed)
- Item-tlačítka (MATRIX, NOVÝ SVĚT, MATRIX PJ atd.) = **pergamenové cedulky** s tmavě dřevěným rámečkem + zlatou kaligrafií
- "ZOBRAZIT VŠE →" link link-style zlatý (**bez wax seal** — audit H5: link nemá „+" akci, wax seal logicky nesedí)
- **🎨 BONUS: Wax seal CTA (audit H5)** — pouze tlačítko „+ PŘIDAT NOVINKU" (pravý panel `rightAddBtn` + Novinky panel) má červený voskový pečetní reliéf vlevo (asset `wax-seal.webp`, **24×24px desktop / 20×20px mobile**) místo „+" symbolu z lucide. Aplikuje se přes `::before` na PŘIDAT NOVINKU tlačítka. Asset má dominantní zlaté „+" uvnitř pečetě (~50% plochy), čitelné i v 24px.

### 1.6 Novinky panel (dole)
- Stejný dřevěný frame pattern + corner ornamenty
- Heading „Novinky" se zlatou ikonou (lucide `BookOpen` se zlatým barvením)
- Tlačítko „+ PŘIDAT NOVINKU" — **wax seal styl** (viz 1.5 bonus)

### 1.7 Ikony — strategie „pečetě"

**7 unikátních pečetí** (jednu na každý nav-key). Jednotný formát = automatická vizuální konzistence.

**Společný formát ikony:**
- Kruhový červený voskový reliéf (`#8a1a10` base, `#a83020` highlight)
- Zlatý reliéf symbolu uvnitř (`#d4a946`)
- Drobná zlatá hairline kolem pečetě
- Background-free PNG (alfa)
- Velikost: 256×256 master, scaled to 22×22 desktop / 18×18 mobile

| `data-nav-key` | Asset | Symbol uvnitř pečetě |
|---|---|---|
| `uvodnik` | `icon-uvodnik.webp` | Otevřená kniha s ornamenty |
| `vytvorit-svet` | `icon-vytvorit-svet.webp` | Svinutý svitek se zlatou stuhou (kronika nového světa) |
| `diskuze` | `icon-diskuze.webp` | Částečně rozvinutý svitek (přepis) |
| `clanky` | `icon-clanky.webp` | Brk s kapkou inkoustu (psaní článku) |
| `galerie` | `icon-galerie.webp` | Iluminovaný rám s krajinou (hrad/strom) |
| `napoveda` | `icon-napoveda.webp` | Velký zlatý otazník nad otevřenou knihou |
| `hospoda` | `icon-hospoda.webp` | Zlatý cínový korbel |

> **Pozn. (audit H7):** symboly `vytvorit-svet` (svitek) a `clanky` (brk) byly v reálných assetech přehozené oproti původnímu spec popisu. **Reálné mapování je tematicky lepší** (svitek = kronika nového světa, brk = psaní článku) — proto zachováno bez změny souborů.

**Zapojení v CSS:** přes `data-nav-key="<key>"` selektory (stejný pattern jako vesmirna-lod a priroda).

### 1.8 Corner ornament

Jeden raster asset `corner-tl.webp` (master TL roh), zrcadleno přes CSS `scaleX/Y` na ostatní 3 rohy. Velikost `--asset-corner-size: 120px` desktop / `64px` mobile.

**Vizuál:** zlatý kovaný rohový ornament v stylu středověké knižní vazby — esovité úponky se zlatými iluminacemi a rudým voskovým detailem. Inspirace Book of Kells initials. NE moderní art-deco, NE keltský uzel.

### 1.9 Drobné polish prvky
- Scrollbar styling: tenký, zlatý palec na dřevěném pozadí
- Focus ring: zlatý 2px outline + glow
- PJ badge (pravý panel): zlatý chip s burgundy inner ring
- Reduced motion: `transition: none` na všem

---

## 2. Asset list & finalizace

### 2.1 Source → public pipeline

Stejný pipeline jako priroda (`scripts/finalize-priroda-assets.mjs`). Vytvoříme `scripts/finalize-pergamen-assets.mjs`:

**Vstup:** `assets-source/themes/pergamen/*.png` (po rename z `pergament/`)
**Výstup:** `public/themes/pergamen/decor/*.webp`

**Kompletní asset list (15 položek) — stav po dodání user (2026-05-10):**

| # | Asset | Source | Status | Rozměry | Cíl |
|---|---|---|---|---|---|
| 1 | Logo banner | `logo.png` | ✅ dodáno | ~540×140 | `decor/logo.webp` |
| 2 | Medailon | `medailon.png` | ✅ dodáno | ~480×580 | `decor/medailon.webp` |
| 3 | Big-book | `big-book.png` | ✅ dodáno | ~600×340 | `decor/big-book.webp` |
| 4 | Background | `pergamen.webp` | ✅ **neměníme** | 1920×1080 | `public/themes/backgrounds/pergamen.webp` (existuje) |
| 5 | Corner TL | `corner-tl.png` | ✅ dodáno | ~600×600 | `decor/corner-tl.webp` |
| 6 | Pečeť — Úvodník | `icon-uvodnik.png` | ✅ dodáno | ~600×600 | `decor/icon-uvodnik.webp` |
| 7 | Pečeť — Vytvořit svět | `icon-vytvorit-svet.png` | ✅ dodáno | ~600×600 | `decor/icon-vytvorit-svet.webp` |
| 8 | Pečeť — Diskuze | `icon-diskuze.png` | ✅ dodáno | ~600×600 | `decor/icon-diskuze.webp` |
| 9 | Pečeť — Články | `icon-clanky.png` | ✅ dodáno | ~600×600 | `decor/icon-clanky.webp` |
| 10 | Pečeť — Galerie | `icon-galerie.png` | ✅ dodáno | ~600×600 | `decor/icon-galerie.webp` |
| 11 | Pečeť — Nápověda | `icon-napoveda.png` | ✅ dodáno | ~600×600 | `decor/icon-napoveda.webp` |
| 12 | Pečeť — Hospoda | `icon-hospoda.png` | ✅ dodáno | ~600×600 | `decor/icon-hospoda.webp` |
| 13 | ~~Iluminované „V"~~ | (CSS-only `::first-letter`) | ✅ **bez assetu** | – | – |
| 14 | **Wax seal CTA** | `wax-seal.png` | ✅ dodáno | ~512×512 | `decor/wax-seal.webp` |
| 15 | **Knižní záložka** | `bookmark.png` | ✅ dodáno | ~310×800 | `decor/bookmark.webp` |
| 16 | Mini divider seal | `divider-seal.png` | ✅ dodáno | ~256×256 | `decor/divider-seal.webp` |

**Všechny rasterové assety jsou dodané (14/14).** Iluminované „V" implementováno čistě CSS přes `::first-letter` — žádný asset potřeba.

### 2.2 Folder rename

Source folder `assets-source/themes/pergament/` → `assets-source/themes/pergamen/` (sjednocení s theme ID). Provede impl. plán v rámci checkpoint #1.

---

## 3. Tokens (CSS vars)

Nahradíme stávající minimalistický `pergamen/index.ts` (40 řádků) plnou luxury sadou (≈115 řádků) podle priroda předlohy.

**Klíčové změny tokenů:**

```ts
const decor = '/themes/pergamen/decor';

'--theme-bg-overlay':
  'radial-gradient(ellipse at 50% 0%, rgba(212, 169, 70, 0.20) 0%, transparent 55%), ' +
  'radial-gradient(ellipse at 50% 100%, rgba(138, 26, 16, 0.18) 0%, transparent 60%), ' +
  'linear-gradient(180deg, rgba(26, 14, 4, 0.42) 0%, rgba(26, 14, 4, 0.66) 100%)',

'--theme-surface':        'rgba(40, 26, 12, 0.84)',
'--theme-surface-strong': 'rgba(28, 18, 8, 0.94)',
'--theme-surface-soft':   'rgba(58, 38, 18, 0.55)',

'--theme-border':         'rgba(212, 169, 70, 0.62)',
'--theme-border-soft':    'rgba(212, 169, 70, 0.30)',
'--theme-border-burgundy':'rgba(138, 26, 16, 0.55)',

'--theme-text':            '#e8d8a0',
'--theme-text-muted':      '#b8a070',
'--theme-heading':         '#d4a946',
'--theme-text-on-gold':    '#3d2914',
'--theme-text-on-burgundy':'#f0e0b8',

'--theme-accent-gold':       '#d4a946',
'--theme-accent-gold-bright':'#f0c860',
'--theme-accent-burgundy':   '#8a1a10',
'--theme-accent-burgundy-bright': '#a83020',

'--theme-glow-gold':         'rgba(212, 169, 70, 0.45)',
'--theme-glow-gold-strong':  'rgba(212, 169, 70, 0.70)',
'--theme-glow-burgundy':     'rgba(138, 26, 16, 0.40)',

'--font-logo':    '"Cinzel", "IM Fell English", Georgia, serif',
'--font-display': '"Cinzel", Georgia, serif',
'--font-body':    '"Lora", "EB Garamond", Georgia, serif',
'--font-script':  '"IM Fell English", "Lora", Georgia, serif',

// Asset URLs
'--asset-logo':              `url('${decor}/logo.webp')`,
'--asset-andel-medallion':   `url('${decor}/medailon.webp')`,
'--asset-bigbook':           `url('${decor}/big-book.webp')`,
'--asset-corner':            `url('${decor}/corner-tl.webp')`,
'--asset-corner-size':       '120px',
'--asset-corner-size-mobile':'64px',
'--frame-corner-inset':      '8px',

// Bonus assets
'--asset-iluminated-v':      `url('${decor}/iluminated-v.webp')`,
'--asset-wax-seal':          `url('${decor}/wax-seal.webp')`,
'--asset-bookmark':          `url('${decor}/bookmark.webp')`,

// 7 unikátních pečetí
'--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
'--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
'--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
'--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
'--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
'--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
'--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,
```

Plus legacy mapping (`--bg-primary`, `--accent`, `--text-primary` atd.) na nové tokeny pro backward kompatibilitu.

---

## 4. Decorations.css (≈650 řádků, scoped)

Plný rewrite `src/themes/themes/pergamen/decorations.css`. **Všechny selektory `[data-theme="pergamen"]`.** Sekce:

1. Background-color fallback
2. Atmosférický overlay (`::before` na shell)
3. Topbar — slim 56px, dřevěná deska + zlatá hairline
4. Logo banner
5. Header buttons — dřevěné cedulky
6. Glass panely — tmavé dřevo + zlatý border + corner ornamenty
7. **Welcome card** — clamp height + **big-book decorative layer** + **iluminované V před nadpisem** + **knižní záložka v rohu**
8. Andel medailon
9. Section title — zlatý Cinzel
10. **Sekční divider — gradient + drobná pečeť uprostřed**
11. NavItem — dřevo gradient + burgundy active fill
12. Pravý panel — ThemeSwitcher trigger + empty hints + **wax seal CTA tlačítka**
13. PJ badge — zlatý + burgundy inner ring
14. Welcome heading + signature — italic IM Fell English se zlatou
15. **Nav ikony — 7 unikátních pečetí přes `data-nav-key`**
16. Novinky panel — wax seal CTA
17. Focus visible — zlatý ring
18. Scrollbar styling
19. Tablet (≤1279px) — menší corner
20. Mobile (≤768px) — corner mobile size, big-book + bookmark hidden, drawer bez corner, header icon-only
21. Reduced motion

---

## 5. Mobil/desktop strategie

- ≥1280px: full layout, big-book viditelný, iluminované V + bookmark visible, corner 120px
- 1024–1279px (tablet): corner 96px na pravém sidebaru, big-book scale 80%
- ≤768px: corner 64px, **big-book hidden**, **bookmark scaled 60% nebo hidden**, **iluminované V scale 70%**, medailon 120×145px, drawer bez corner, header buttons icon-only
- ≤480px: Tyky + Odhlásit do hamburger menu, iluminované V hidden (welcome layout vertical stack)

---

## 6. Acceptance criteria

- [ ] Po `themeId='pergamen'` vypadá dashboard ≈ obrázek 2 (knihovní layout)
- [ ] 7 unikátních pečetí zobrazeno správně přes `data-nav-key` (u každé silueta rozlišitelná v 22×22)
- [ ] Iluminované „V" viditelné před nadpisem jako CSS drop-cap (`::first-letter`, IM Fell English, gold s glow)
- [ ] CSS drop-cap zachová responsivitu (desktop 3.5em → mobile 2.5em)
- [ ] Wax seal CTA **pouze** na „+ PŘIDAT NOVINKU" tlačítkách (ne na ZOBRAZIT VŠE)
- [ ] Knižní záložka visí **zvenku** welcome card vpravo nahoře (closet hanger styl), žádná kolize s corner
- [ ] Big-book viditelný pod textem ve welcome (desktop) **s opacity 0.30 + multiply blend**, hidden mobile
- [ ] **WCAG kontrast krémového textu PŘES big-book overlay ≥4.5:1** (audit B1)
- [ ] Atmosférický overlay = pouze darken, žádné radial color tints (audit H2)
- [ ] Sekční dividery mají drobnou pečeť uprostřed gradientu (`divider-seal.webp`)
- [ ] Logo banner zobrazen v topbaru, fallback (text) skryt
- [ ] Medailon andělé v rudém rámu vlevo welcome card (96×116 mobile)
- [ ] Corner ornamenty na 4 rozích každého panelu, TR/BL/BR mirrorováno přes CSS
- [ ] WCAG AA kontrast splněn (text vs pozadí ≥ 4.5:1, headings ≥ 3:1)
- [ ] Bez animací (`reducedMotion: 'safe'` zachován)
- [ ] Zbylých 20 témat: 0 regresí
- [ ] Mobile-desktop test (skill `mobil-desktop`) na 320/375/768/1024/1280/1440 viewports
- [ ] Folder rename `pergament` → `pergamen` v assets-source nemá broken refs

---

## 7. Out of scope

- Nové stránky / komponenty (jen theme decorations)
- Nové fonts (Cinzel, Lora, IM Fell English už načteny v `theme.css`)
- Refactor pravého panelu (memory: ADMINISTRACE struktura zůstává)
- Animace / parallax / hover transitions nad rámec opacity/glow
- Číslované „strany" v pravém panelu (zmíněno v brainstormu — není ve scope)

---

## 8. Risk register

| Riziko | Pravděpodobnost | Mitigace |
|---|---|---|
| ~~12 AI assetů = nekonzistence~~ | ✅ vyřešeno | Po dodání: 11 z 12 assetů hotové, vysoce konzistentní díky shared formátu pečetí |
| ~~Pečetě v 22×22px nerozlišitelné~~ | ✅ vyřešeno | Po vizuální revizi: siluety silné, každá rozlišitelná |
| ~~Iluminované „V" — „dvě V" + line-break + velikost~~ | ✅ vyřešeno | CSS-only `::first-letter` drop-cap — žádný asset, žádný DOM split, plně responsive |
| ~~Knižní záložka × corner kolize~~ | ✅ vyřešeno | Záložka přesunuta zvenku welcome card (`top: 24px; right: -16px`) |
| Big-book overlay WCAG kontrast (audit B1) | Vysoká | Opacity 0.30 + `mix-blend-mode: multiply`. Pokud po implementaci stále fail, fallback: big-book v dolní třetině (variant C v auditu) |
| Folder rename `pergament`→`pergamen` rozbije nějaké unmerged path | Nízká | Před rename `git status` + grep „pergament" napříč repo |
| Wax seal na CTA buttonu se nevejde do compact pravého panelu | Střední | Fallback: jen left padding + barevný shift (no asset) |
| Existující BG `pergamen.webp` je vizuálně blízko `priroda` BG (rozhodnutí user: neměnit) | Nízká | Diferenciaci zajišťují unikátní ornamenty (pečetě, V, bookmark) — atmosférický overlay v dark redukuje warm shift vs priroda |
| Atmosférický overlay double-warm na warm BG (audit H2) | ✅ vyřešeno | Overlay redukován na pure darken, žádné color tints |

---

## 9. Workflow checkpoint

Tento spec je **draft v3** (po brainstormu + frontend-design auditu + dodání 11/12 assetů). Po souhlasu user pokračujeme:

1. ✅ **Brainstorm + spec v2** (hotovo)
2. ✅ **Frontend-design audit** (hotovo, viz `audit-1.0i-pergamen.md`)
3. ✅ **Spec v3** — fixy auditu aplikovány + iluminated V přepnuto na CSS-only
4. ✅ **Všechny rasterové assety dodané** (14/14)
5. ⏳ **Souhlas user se spec v3** ← jsme zde
6. **Implementační plán** (`plan-1.0i.md`) — pořadí commitů, edit list, test plan
7. **Souhlas s plánem**
8. **Implementace** — finalizační skript → tokens → decorations → mobil-desktop sweep
9. **Verifikace** — manuální QA + screenshoty

---

## Přílohy

- [`prompts-1.0i-pergamen-assets.md`](prompts-1.0i-pergamen-assets.md) — prompty pro ChatGPT/Midjourney na vygenerování 12 chybějících PNG (corner-tl + 7× pečetě + iluminované V + wax seal + bookmark)
