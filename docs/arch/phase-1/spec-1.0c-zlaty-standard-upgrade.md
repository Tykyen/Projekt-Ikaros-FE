# Spec 1.0c — Zlatý standard visual upgrade

**Datum:** 2026-05-09
**Status:** ⏳ Čeká na schválení
**Roadmap:** `docs/roadmap-fe.md` → Fáze 1 → 1.0c
**Závisí na:** 1.0 (theme infrastruktura) ✅, 1.0b (luxusní vizuál pilotu modre-nebe) ✅, 1.1 (IkarosLayout shell) ✅
**Reference:** `01 Zlatý standard.png` (current), `02 cíl.png` (target), nový kosmický background dodán uživatelem 2026-05-09

---

## 0. Strategie a scope

Tato úprava replikuje luxusní vzor `modre-nebe` (spec 1.0b) na téma `zlaty-standard` s úpravami pro paletu „pure black + rich gold + cobalt accent na aktivních stavech".

**Celý zásah je striktně omezen na selektor `[data-theme="zlaty-standard"]`.** Ostatních 20 témat se NEDOTÝKÁ — žádné globální tokeny, žádné globální třídy, žádné změny komponent kromě případného přidání asset slotů (sdílených CSS proměnných, které ostatní témata mohou opt-in použít později).

### Co existuje a opakovaně použijeme
- `IkarosLayout` (header + 3-sloupcový shell, drawer mobile) ✅
- `IkarosCard` (variant `welcome` / `news`, slot `medallion`, slot `header`) ✅
- `CornerOrnament` (SVG, 4 pozice) ✅
- `themes/themes/zlaty-standard/{index.ts, decorations.css}` ✅
- Asset pipeline `npm run themes:optimize` (sharp PNG → WebP) ✅
- `data-frame-panel="sidebar|right|card|novinky"` selektory pro per-theme styling ✅

### Co se mění
- `themes/themes/zlaty-standard/index.ts` — palette (gold + cobalt + glass surfaces), asset slots (logo, andel-medallion), layout chrome proměnné
- `themes/themes/zlaty-standard/decorations.css` — kompletní přepis (glass panely, atmosferický overlay, andel-medallion, header logo, section title diamonds, nav active glow, PJ badge styling)
- `IkarosLayout.tsx` — drobnost: render PJ badge u světa kde user je creator (uvnitř `<NavLink>`/`<Link>` v sidebaru i pravém panelu)
- `IkarosLayout.module.css` — případné drobné úpravy proměnných hlavičky (pokud potřeba)
- Nový adresář `public/themes/zlaty-standard/decor/` se 2 PNG → WebP assety (logo, andel-medallion)

### Co se NEMĚNÍ
- DashboardPage.tsx — strukturně už sedí (welcome card + medallion slot + novinky card s "Přidat novinku" tlačítkem)
- Zbylé komponenty (modaly, formuláře, profil, atd.) — palette zlatého standardu jim funguje, jen se prosvítí přes nové glass panely
- Backend, datové modely, API, routy, texty
- 20 ostatních témat
- Komponenty `IkarosCard`, `CornerOrnament` (jen styly se napojují přes `data-*` atributy)

---

## 1. Cíl

Po načtení s `themeId === 'zlaty-standard'` má stránka vypadat jako **zlatě rámovaný kosmický portál** dle `02 cíl.png`:

- nový kosmický background (centrální věž, planety, oblouky astrolábu) — **prosvítá** přes glass panely
- glass-černé panely sidebaru a pravého panelu se zlatým borderem a inset zlatým glow
- atmosférický tmavý overlay zachovává čitelnost (text-primary `#f0e8d0`)
- welcome card: **anděl medailon vlevo**, text vpravo, signatura ve script fontu
- novinky card: ikona + nadpis + "Přidat novinku" tlačítko vpravo, prázdný stav „Zatím žádné novinky"
- topbar: vyšší, ornátový logo banner místo prostého textu, jednotná zlatě orámovaná tlačítka
- nav položky: tmavé s zlatým borderem, **aktivní = cobalt glow + světlejší text**, hover = zlatý glow
- section title `◆ ━━━ NAVIGACE ━━━ ◆` (diamondy + zlatá linka)
- CornerOrnament: zlatý SVG křížek/diamond v rozích panelů (per-theme variant)
- u světa kde je user PJ → zlatý chip „PJ"

**Mimo rozsah:** animovaný točící se astroláb (pozadí ho má staticky), nové komponenty (welcome panel je IkarosCard variant), externí fonty navíc (Cinzel/Cinzel Decorative/Lato už máme).

---

## 2. Token model — `themes/themes/zlaty-standard/index.ts`

Replika `modre-nebe` token modelu s úpravou: **bg-primary `#050508` (pure black) + accent `#d4a017` (rich gold) + cobalt `#19d6e8` jen na aktivní/highlight stavech**.

### Luxury tokeny (nové)

```ts
// Background overlay nad theme.background — tmavší než modre-nebe (cosmic image je jasnější)
'--theme-bg-overlay':
  'linear-gradient(180deg, rgba(2, 4, 8, 0.55) 0%, rgba(2, 4, 8, 0.78) 100%)',

// Glass surfaces — pure black, vyšší opacity (zachovat čitelnost přes detailní background)
'--theme-surface':         'rgba(5, 6, 10, 0.78)',
'--theme-surface-strong':  'rgba(2, 3, 6, 0.92)',
'--theme-surface-soft':    'rgba(15, 12, 5, 0.55)',

// Borders — zlato + cobalt jen subtle pro aktivní state
'--theme-border':       'rgba(212, 160, 23, 0.78)',
'--theme-border-soft':  'rgba(212, 160, 23, 0.32)',
'--theme-border-cyan':  'rgba(25, 214, 232, 0.45)',

// Text
'--theme-text':         '#f0e8d0',
'--theme-text-muted':   '#c4a960',
'--theme-heading':      '#f0c040',

// Accents — cobalt jen highlight, ne hlavní akcent
'--theme-accent':        '#d4a017',
'--theme-accent-bright': '#f0c040',
'--theme-accent-cyan':   '#19d6e8',  // jen aktivní stav, „Projektu Ikaros" highlight v nadpisu

// Glow
'--theme-glow-gold':    'rgba(240, 192, 64, 0.42)',
'--theme-glow-cyan':    'rgba(25, 214, 232, 0.38)',
'--theme-shadow':       'rgba(0, 0, 0, 0.85)',

// Nav interactive states
'--theme-nav-hover-bg':  'rgba(212, 160, 23, 0.08)',
'--theme-nav-active-bg': 'linear-gradient(90deg, rgba(25, 214, 232, 0.18) 0%, rgba(25, 214, 232, 0) 100%)',
```

### Legacy tokeny (existují, namapovat na luxury)

`--bg-card`, `--bg-card-hover`, `--accent`, `--text-primary`, `--border`, `--border-strong` přemapovat na luxury tokeny stejným patternem jako modre-nebe (zachová zpětnou kompatibilitu pro btn3d, IkarosLayout aj.).

### Layout chrome

```ts
'--header-h':    '88px',
'--header-bg':   '#050508',  // splývá s pozadím, žádný hard cut
'--frame-pad-y': '40px',
'--frame-pad-x': '18px',
'--sidebar-w':   '280px',
```

### Asset slots

```ts
const decor = '/themes/zlaty-standard/decor';

'--asset-logo':           `url('${decor}/logo.webp')`,
'--asset-logo-w':         '260px',
'--asset-logo-w-mobile':  '200px',
'--logo-img-display':     'block',
'--logo-fallback-display':'none',

'--asset-andel-medallion': `url('${decor}/andel-medallion.webp')`,
```

### Atmosféra (komentář)

```ts
atmosphere: 'Královský luxus — pure black + rich gold + subtle cobalt accents on active states',
```

### Fonts

Beze změny — `Cinzel Decorative` (logo), `Cinzel` (display), `Lato` (body) už jsou. Pro signaturu „Příjemnou zábavu přeje administrátor" přidat **`--font-script`** (analogicky modre-nebe, font Great Vibes z Google Fonts — **modre-nebe ho už importuje**, takže žádná nová síťová závislost).

```ts
'--font-script': '"Great Vibes", "Brush Script MT", cursive',
```

---

## 3. Decorations CSS — `themes/themes/zlaty-standard/decorations.css`

**Kompletní přepis.** Současný 27řádkový soubor (jen `◆` před nadpisy + button hover) se nahradí komplexnější verzí (replika modre-nebe vzoru, ~120 řádků).

### Sekce

1. **Root** — `background-color: #020308`, fallback pokud background webp nezatáhne
2. **Atmosférický overlay** — `[data-theme="zlaty-standard"][data-shell="ikaros"]::before { background: var(--theme-bg-overlay) }` přes celý viewport
3. **Glass panely** — sidebar, right, card, novinky:
   - `background: var(--theme-surface)`
   - `backdrop-filter: blur(8px)` (jen na panelech, ne na celé stránce — výkonová ochrana)
   - `border: 1px solid var(--theme-border)`
   - `border-radius: 22px`
   - `box-shadow: 0 0 24px rgba(0,0,0,0.6), inset 0 0 18px rgba(212,160,23,0.08)`
4. **Welcome card medallion** — `[data-andel-medallion]`:
   - `width: 200px; height: 215px`
   - `background-image: var(--asset-andel-medallion)`
   - `filter: drop-shadow(0 0 16px var(--theme-glow-gold))`
5. **Section title** `[data-theme="zlaty-standard"] .sectionTitle`:
   - `color: var(--theme-heading)`, `text-transform: uppercase`, `letter-spacing: 0.18em`
   - `::before` = `'◆'` zlatý + zlatá lineární gradient linka vpravo
   - `::after` = zlatá lineární gradient linka vlevo + `'◆'` zlatý
6. **Header logo** `[data-theme="zlaty-standard"] .logoImg`:
   - `width: var(--asset-logo-w)`, `height: var(--header-h)`
   - `background-image: var(--asset-logo)`, `background-size: contain`, `background-position: left center`
   - skrýt `.logoFallback` (display none — token `--logo-fallback-display`)
7. **Header tlačítka** `[data-theme="zlaty-standard"] .headerBtn`:
   - tmavé pozadí `var(--theme-surface-strong)`
   - `border: 1px solid var(--theme-border-soft)`
   - hover: `border-color: var(--theme-border)`, `box-shadow: 0 0 12px var(--theme-glow-gold)`
   - aktivní: `border-color: var(--theme-border-cyan)`, glow cyan
   - uppercase, letter-spacing 0.12em
8. **Nav item** `[data-theme="zlaty-standard"] .navItem`:
   - tmavé pozadí transparent + zlatý border-soft
   - hover: `background: var(--theme-nav-hover-bg)`
   - aktivní (`.navItemActive`): `background: var(--theme-nav-active-bg)`, `border-color: var(--theme-border-cyan)`, `color: var(--theme-text)`, ikona výraznější (cobalt drop-shadow)
9. **CornerOrnament** zlatá variant (SVG fill přes CSS proměnnou — viz Bod 4)
10. **PJ badge** `.pjBadge`:
    - text „PJ", uppercase, font-size 0.7em, padding 2px 6px
    - `background: linear-gradient(180deg, var(--theme-accent-bright), var(--theme-accent))`
    - `color: var(--bg-primary)` (tmavý text na zlatém chipu)
    - `border-radius: 4px`, letter-spacing 0.1em, font-weight 700
    - umístění: vpravo od názvu světa v Link (gap mezi text a badge)
11. **Welcome heading highlight** — span s textem „Projektu Ikaros." dostane `color: var(--theme-accent-cyan)` a `text-shadow: 0 0 12px var(--theme-glow-cyan)` (cobalt highlight z obr. 2)
12. **Signature** — `font-family: var(--font-script)`, italic není potřeba (Great Vibes je už script)

---

## 4. CornerOrnament — per-theme variant

**Otázka pro impl plán:** Jak modre-nebe řeší ornament SVG fill barvu — buď je SVG inline + dědí `currentColor` přes `color: var(--theme-accent)`, NEBO `<CornerOrnament>` přijímá theme variant prop, NEBO se selektorem `[data-theme="..."] svg.cornerOrnament path { fill: ... }`. Při psaní impl. plánu se podívám, jak je to dnes a aplikuju stejný přístup. Žádná změna komponenty — jen CSS.

---

## 5. Komponentové změny — minimální

### `IkarosLayout.tsx`

**Drobnost: PJ badge.** V `SidebarContent` a `RightPanel` u světa, kde `world.creatorId === currentUser.id`, vykreslit `<span className={s.pjBadge}>PJ</span>` za `<span className={s.navItemLabel}>{w.name}</span>`. Vyžaduje:
- `currentUser` z `currentUserAtom` (už importováno v HeaderLoggedIn — přesun na vyšší úroveň)
- pole na `World` typu `creatorId` — **ověřit při impl** že existuje (pokud ne, dluh + neimplementovat PJ badge teď, jen prostor v CSS)

### `DashboardPage.tsx`

Beze změn struktury. Pouze ověřit, že `medallion` slot je vlevo a content vpravo (responsive: na mobilu medailon nahoře, content pod). To už řeší `IkarosCard.module.css` přes `flex-direction: row` desktop / `column` mobil — pokud ne, doladí se v 1.0b kompatibilním způsobem (drobný style tweak v `IkarosCard.module.css`).

### Welcome card highlight

Existující markup:
```tsx
<h2>Vítej v <span className={s.titleAccent}>Projektu Ikaros.</span></h2>
```

`s.titleAccent` (DashboardPage.module.css) musí v zlatém standardu zůstat cyan. Pokud dnes je definován obecně, OK. Pokud per-theme, doladí se v `decorations.css` přes `[data-theme="zlaty-standard"] .titleAccent { color: var(--theme-accent-cyan) }`.

---

## 6. Assety k dodání uživatelem

Uživatel dropne PNG soubory do `assets-source/themes/zlaty-standard/`:

| Soubor | Zdroj v chatu | Cílové umístění po `npm run themes:optimize` |
|---|---|---|
| `andel-medallion.png` | obrázek 1 z msg „Zde máš angel-medailon a horní nadpis" | `public/themes/zlaty-standard/decor/andel-medallion.webp` |
| `logo.png` | obrázek 2 z téže zprávy (banner „Projekt Ikaros") | `public/themes/zlaty-standard/decor/logo.webp` |
| ~~`background.png`~~ | dropnut 2026-05-09 | ✅ `public/themes/backgrounds/zlaty-standard.webp` (285 KB) |

Optimalizační skript `scripts/optimize-theme-assets.mjs` se případně rozšíří o emit do `public/themes/<themeId>/decor/` pokud zdroj je v `assets-source/themes/<themeId>/` (modre-nebe pattern). **Ověřit při impl. plánu** — pokud skript to neumí, řeší se buď ruční sharp příkaz nebo extension skriptu (drobnost ~10 řádků).

---

## 7. Responsive

**Dodržet pravidla z `base.md`:**
- Mobile ≤768px: drawer sidebar, panel pod sebou, medailon nahoře nad textem
- Tablet 769–1024px: 2-sloupcový (sidebar + main), pravý panel pod
- Desktop >1024px: 3-sloupcový plný layout

Layout grid je už v `IkarosLayout.module.css` zařízen — jen se ujistit, že nový background a glass panely na všech breakpointech vypadají správně. Po dokončení implementace **povinně skill `mobil-desktop`** dle `base.md`.

---

## 8. Akcepční kritéria

Implementace je hotová pouze pokud:

1. ✅ Po `?theme=zlaty-standard` (nebo přepnutí v ThemeSwitcher) se stránka vizuálně přibližuje `02 cíl.png`:
   - nový kosmický background prosvítá přes glass panely
   - sidebar + pravý panel mají zlatý border, glass tmavé pozadí, ornátové rohy
   - welcome card má anděl medailon vlevo + text vpravo
   - novinky card má ikona + nadpis + tlačítko „Přidat novinku" vpravo, prázdný stav text
   - nav položky aktivní stav má cobalt glow
   - section title má `◆` diamondy
   - „Projektu Ikaros." v nadpisu má cobalt highlight
   - signatura je v Great Vibes script fontu
   - header logo banner místo prostého textu
2. ✅ Na mobilu (≤768px) se nic nerozbije — drawer sidebar, sloupce pod sebou, čitelné texty, medailon nad textem
3. ✅ Na tabletu i desktopu plně funguje
4. ✅ Ostatních 20 témat je **netknutých** (vizuální regrese 0)
5. ✅ Žádná změna BE, datových modelů, API, rout, textů
6. ✅ Žádné nové globální CSS třídy ani globální `:root` tokeny (vše scoped na `[data-theme="zlaty-standard"]` nebo přes proměnné)
7. ✅ `npm run lint`, `npm run lint:colors`, `npm run test:run`, `npm run build` ✅
8. ✅ `mobil-desktop` skill po implementaci

---

## 9. Otevřené body / risks

| # | Risk | Mitigace |
|---|---|---|
| R1 | `World` entity nemá `creatorId` ve FE typu | Při impl. plánu ověřit; pokud chybí → PJ badge se odloží do dluhu D-XXX, CSS se připraví na future use |
| R2 | `optimize-theme-assets.mjs` neumí decor folder | Ověřit, případně rozšířit skript o ~10 řádků (decor pattern stejný jako modre-nebe) |
| R3 | `backdrop-filter` na slabém HW | Aplikujeme **jen na panely**, ne na fixed overlay; degraduje gracefully (panel zůstane tmavý, jen bez blur) |
| R4 | Background image (285 KB) výrazně tmavší než modre-nebe → glass overlay opacity 0.78 může být moc | Vyladit při impl., případně 0.72 |
| R5 | Cobalt na aktivním stavu může působit „cizorodě" v gold paletě | Pokud po implementaci uživatel řekne ne, fallback na gold-only (drobnost) |
| R6 | `s.titleAccent` v DashboardPage.module.css může být hardcoded barva | Při impl. zkontrolovat a per-theme override v decorations.css |

---

## 10. Po dokončení

- Zaškrtnout v `roadmap-fe.md` — nový bod **1.0c — Zlatý standard visual upgrade**
- Volitelně doplnit `purpose.md`, `decisions.md`, `ai-notes.md`
- Asset references: `assets-source/themes/references/zlaty-standard.png` (current screenshot) zůstává jako baseline; nový background + medallion + logo nahrazují to staré v `public/themes/`
- Případné dluhy v `docs/dluhy.md`

---

**Schválení:** ⏳ Čeká na PJ. Po souhlasu napíšu **`plan-1.0c.md`** s konkrétními file diffy a teprve po jeho schválení začnu kód.
