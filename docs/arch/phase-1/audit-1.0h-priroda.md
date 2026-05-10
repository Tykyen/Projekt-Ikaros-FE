# Audit 1.0h — Příroda skin design audit

**Datum:** 2026-05-09
**Fáze:** mezi spec a impl. plán (memory rule: skin → frontend-design audit)
**Vstupy:** spec-1.0h, _asset-prompts.md, 7 finálních assetů, reference mockup, background, vesmirna-lod pattern.

---

## TL;DR

Skin je **z 80 % ready**. 1 blocker (asset outlier), 7 high změn ve specu/promptech, 5 medium, 4 low. Po vyřešení blockerů a high-priority bodů můžeme jít do impl. plánu.

**Hlavní téma auditu:** assety jsou krásné, ale **`icon-napoveda` vypadá jako 3D render** ne hand-painted storybook (jako ostatní 6) — vyčnívá. Spec má **chybějící token pro corner asset** a několik jemných **mobile/breakpoint mezer**.

---

## 1) Vizuální konzistence assetů (rodina vs. outlier)

| Asset | Styl | Lighting | Paleta | Verdict |
|---|---|---|---|---|
| logo | hand-painted | TL warm gold | smaragd + zlato | ✅ family |
| medailon | hand-painted | TL warm | smaragd + dřevo + cream květy | ✅ family |
| corner-tl | hand-painted, vyšší saturace zelené | TL gold-rim | smaragd (sytý) + cream | ✅ family (mírně sytější) |
| icon-leaf | hand-painted, velký gold outline | TL | smaragd + gold | ✅ family |
| icon-hospoda | hand-painted | TL gold | dřevo + amber + smaragd ivy | ✅ family |
| icon-uvodnik | hand-painted, BUT pečeť obsahuje **2 listy** místo `single ivy-leaf emblem` | TL gold | cream parchment + smaragd | ⚠️ minor odchylka, akceptovat |
| **icon-napoveda** | **3D render look** (ne hand-painted!) | TL+RIM, photoreal | smaragd + bohaté zlato + bohatý ivy arch | ❌ **OUTLIER** |

**Outlier rozbor — `icon-napoveda`:**
- Styl: photorealistic 3D render s detailním zlatým embossem, kontra "hand-painted storybook" prompt
- Knížka **stojí svisle**, ostatní 3 ikony (hospoda, uvodnik, leaf) jsou v náklonu / 3/4 view
- Ivy arch je **2× výraznější** než na corner-tl, působí jako reklamní hero
- Zlatý ?-emboss má **photoreal specular highlight**, ostatní zlaté plochy mají hand-painted brush texture

→ **BLOCKER B1, viz sekce 10**.

---

## 2) Asset → produkční rizika

| # | Riziko | Dopad | Tip |
|---|---|---|---|
| A1 | **icon-leaf** dodán ve velkém rozlišení (~1024×1024); finální 64×64 (a 32×32 pro dense layouts) musí být **explicitně sharpened** při downscale | bez sharpeningu listový žilkování zaniká, gold outline se ztrácí | dvě výstupní velikosti: `icon-leaf-64.webp` + `icon-leaf-32.webp`, sharpen kernel `0.5,1,0.5` před encode |
| A2 | **logo** má bake-in zlatý glow halo v PNG | na temně zelené surface OK; ale na případném světlém variantu by zazářil | OK pro tento skin (skin má jen dark) |
| A3 | **corner-tl** musí mít při použití `transform: scaleX/Y(-1)` **stejné padding od ohyb-roh** ve všech 4 verzích | jinak rohy "drift" mimo rohy panelů | crop master tak, aby pivot ohyb byl přesně v 0,0 (bez transparent margin) |
| A4 | **icon-napoveda** má **portrait poměr** (knížka stojí), ostatní ikony jsou square 1:1 | NavItem ikona slot bude wider/taller — buďto squashed nebo NavItem narušen | regenerace s 3/4 angled view (viz B1) |
| A5 | Všechny assety mají transparent alpha — `cwebp -q 90 -alpha_q 100` OK | žádné | OK |
| A6 | Žádný asset nemá CSS-friendly **9-slice hint** (pro border-image rohy) | corner-tl využijeme jako pseudo-element background-image, ne border-image | OK |

---

## 3) Token model — diff vs. spec sekce 2

### Chybí ve specu (přidat do `index.ts`)

```ts
// Corner ornament (master)
'--asset-corner':            `url('${decor}/corner-tl.webp')`,
'--asset-corner-size':       '120px',         // desktop default
'--asset-corner-size-mobile':'64px',          // mobile zmenšeno

// Section title decoration (Cinzel nemá ❦ glyph)
'--asset-section-divider':   `url('${decor}/section-divider.svg')`, // 1 SVG decorativní linka
                             // ALT: pure CSS implementation, žádný asset

// NavItem aktivní text barva
'--theme-text-on-emerald':   '#fff8e0',  // krémová proti smaragdovému active fillu

// Frame inner padding standard
'--frame-corner-inset':      '8px',  // jak hluboko corner ornament zasahuje dovnitř panelu
```

### Redundance / pojmenování

| Token | Stav | Doporučení |
|---|---|---|
| `--theme-accent` + `--theme-accent-emerald` | obě `#1f6a3a` | drop `--theme-accent-emerald`, nebo doc rozdíl (semantic vs role) |
| `--theme-glow-emerald` + `--theme-glow-emerald-strong` | OK, dual-strength pattern shodný s vesmirna-lod | ponechat |
| `--theme-text-muted: #a09060` | **WCAG AA fail** na surface (~4.4:1, AA chce 4.5+) | změnit na `#b8a070` (4.7:1) |
| `--text-muted: #605030` | duplikuje muted ale tmavší, působí jako placeholder pro něco | doc nebo drop |

### Nepojmenovaná logická jednotka
Spec popisuje **dřevěný button** v topbaru (Pošta, Uživatelé, …) ale token `--asset-wood-button-bg` chybí. Pokud řešíme čistě CSS gradient, OK. Pokud chce uživatel později PNG cedulky, musí být token předem vyhrazený (audit doporučuje **CSS-only** — méně assetů, lépe scalable).

---

## 4) Layout chrome breakpointy

### Welcome card `min-height: 60vh`

**Problém:** na 1366×768 laptop s task barem → viewport ~720px → welcome 432px. Plus topbar 56px + novinky 200px = 688px. **Vejde se těsně.** Ale na 1280×720 + browser chrome (tabs+url bar 100px) → 620px - 56 - 200 = 364px → welcome jen 364, ale `min-height: 60vh` = 432 → **scroll**, welcome card přepadá.

**Fix:** `min-height: clamp(420px, 60vh, 720px)`. Spec sekci 1.4 update.

### Sidebary 280px × 2

| Viewport | Layout | Stav |
|---|---|---|
| ≥1280 | 280 + center + 280 = OK (~720 center) | ✅ |
| 1024–1279 | 280 + center + 280 = jen ~464 center, hodně cramped | ⚠️ pravý sidebar collapse na drawer |
| 768–1023 | jen levý sidebar visible, pravý do drawer | ⚠️ |
| <768 | oba sidebary do hamburger | ✅ specifikováno |

→ Spec sekce 5 zmiňuje 1024 jako desktop, ale **chybí breakpoint pro 1024–1279** (pravý sidebar má sklouznout do drawer i tady).

### Topbar 56px + 5 buttonů

5 dřevěných cedulek (Pošta, Uživatelé, Zlatý standard caret, Tyky, Odhlásit) v Cinzel uppercase. Cinzel je **wider** než system font → každý button ~120–140px. Plus logo 220px. → **Pod ~860px** topbar přeteče. Tady chybí spec.

→ Spec doplnit: pod 768px → buttony **icon-only** (Cinzel uppercase text v `aria-label`), případně Tyky + Odhlásit do dropdown.

---

## 5) Corner-tl CSS strategie rizika

Strategie: 1 master `corner-tl.webp` + CSS `scaleX/Y(-1)` pro TR/BL/BR.

### Strukturální překážky

| Problém | Dopad | Mitigace |
|---|---|---|
| Panel typicky má jen `::before` + `::after` (2 pseudo-elements) | TL + TR jdou, BL + BR ne | wrap panel do dvojitého `<div>` (outer + inner) → 4 pseudo-elements, NEBO použít 4 absolutní `<i>` ornamenty |
| **Scrollbar collision** v scrollovatelných panelech | TR ornament narazí na scrollbar gutter | `padding-right: calc(scrollbar-gutter + 8px)` na rohových slotech |
| **Focus outline** na nav-itemu může vyletět ven přes corner | corner mlčky překryje focus halo | corner `pointer-events: none` + `z-index: 0`, content `z-index: 1`, focus outline `z-index: 2` |
| **scaleX/Y(-1)** mění normála textury → ASSET musí být **prakticky symetrický** v daném směru | viděno v master corner-tl: ohyb je v upper-left, zbytek volný — OK |
| **Mobile** corner 256px na 360px viewport = 70% panelu | dominuje, "ozdobená pohlednice" feel | `--asset-corner-size-mobile: 64px` |
| **Border-radius panelu** + corner ornament pevný 90° → corner přepadá border-radius | malý vizuální mismatch | corner musí mít stejný `border-radius` jako panel (clip-path nebo border-radius na pseudo) |

### Scrollbar policy
Pravý sidebar a novinky panel **mohou přerůst** výšku. Aktuálně spec **neřeší overflow** styling. Přidat:
- `overflow-y: auto` na panel content area
- `scrollbar-color: var(--theme-accent-gold) var(--theme-surface)` (Firefox)
- `::-webkit-scrollbar-thumb` styled pro WebKit

---

## 6) Mobile / tablet rizika

| # | Riziko | Stav | Fix |
|---|---|---|---|
| M1 | **Břečťan v rozích** na 360px viewport → "pohlednice" | **HIGH** | `--asset-corner-size-mobile: 64px` + opacita 0.7 |
| M2 | **Welcome medailon** 240px desktop → 120px mobile (specifikováno OK), ale **icon-leaf 64px** v navigaci ⇒ 64×64 zabírá hodně, dense menu | **MEDIUM** | mobile NavItem icon = 32×32 (tedy `icon-leaf-32.webp`) |
| M3 | **Logo 170px** mobile + topbar 56px = logo cca 1/3 lišty, zbytek pro hamburger + buttons | OK | OK |
| M4 | **Drawer (collapsed sidebar)** s corner ornamenty působí divně — drawer = clean utility | **HIGH** | corner ornaments **disabled v drawer modu** (`.drawer .panel::before { display: none }`) |
| M5 | **Heading "Vítej v Projektu Ikaros."** Cinzel italic na 360px → break za "v" → Projektu Ikaros na nové řádce s kurzivou | OK ale ošklivé | `text-wrap: balance` (modern browsers) + `<br>` strategy nebo `letter-spacing` na mobile |
| M6 | **Touch target velikost** NavItem na mobile musí být ≥44px | **MEDIUM** | NavItem `min-height: 48px` na mobile |

---

## 7) Accessibility

### Kontrast WCAG AA (normal text 4.5:1, large text 3:1)

| Pár | Ratio | Verdict |
|---|---|---|
| `#e8d8a0` text na `rgba(20, 32, 22, 0.82)` surface | ~9.1:1 | ✅ AAA |
| `#a09060` muted na surface | **~4.4:1** | ❌ AA fail (těsně) |
| `#b8a070` muted (návrh) na surface | ~4.7:1 | ✅ AA |
| `#d4a946` heading (gold) na surface | ~6.8:1 | ✅ AAA |
| `#fff8e0` text na `#1f6a3a` (active NavItem) | ~7.1:1 | ✅ AAA |
| `#e8d8a0` na zlaté `#d4a946` button (Pošta atd.) | **~1.5:1** | ❌ FAIL |
| `#3d2914` text na zlaté button | ~9.0:1 | ✅ AAA — **toto je správná kombo pro buttony** |

→ **Topbar dřevěné/zlaté cedulky musí mít TMAVÝ TEXT (`#3d2914`)**, ne krémový. Spec sekce 1.2 toto explicitně neříká, lze špatně interpretovat.

### Focus outline
- 2px solid `#d4a946` + 4px halo `rgba(212, 169, 70, 0.4)` — **kontrast OK** na všech surfaces
- POZOR: **na zlatých cedulkách** by zlatý focus outline zmizel → fallback `outline: 2px solid #1f6a3a` na `[data-theme="priroda"] .gold-button:focus-visible`

### Reduced motion
Spec říká "žádné animace". Ale **glow je transition** (200ms). Reduced-motion = `transition: none` na všechny `:hover` a `:focus` glow. Spec to nezmiňuje explicitně — doplnit.

---

## 8) Performance

### Asset weight estimate

| Asset | Velikost | WebP est. |
|---|---|---|
| logo | 600×190 | ~30 kb |
| medailon | 500×600 | ~38 kb |
| corner-tl | 256×256 | ~22 kb |
| icon-leaf | 64×64 | ~5 kb |
| icon-leaf-32 | 32×32 | ~2 kb |
| icon-hospoda | 96×96 | ~9 kb |
| icon-uvodnik | 96×96 | ~9 kb |
| icon-napoveda | 96×96 | ~10 kb |
| **Total decor** | | **~125 kb** |
| background | 1920×1080 | ~280 kb |
| thumbnail | 480×270 | ~22 kb |

→ **~427 kb na full skin** = OK (3G 1 sec, 4G <0.5 sec).

### FOUC při theme switch

Aktuální mechanizmus:
- `data-theme` atribut na `<html>` se mění
- `decorationsModule` (lazy CSS import) se musí stáhnout po změně
- Background-image fetch začne až po CSS load → **2 frame flash**

**Tip:**
1. Preload background pro **default** theme přes `<link rel="preload" as="image">` v `index.html`
2. Po user theme change → **JS preload** target backgroundu před `data-theme` flip
3. Decoration CSS modules už lazy importované — OK

→ Spec sekce 8 chybí FOUC strategy. Doplnit.

### Composite layers
- corner ornaments jako pseudo-element backgrounds = **paint cost**
- 4× 256×256 ornament + parent panel re-layouting = ~2ms paint na desktop, ~8ms mobile
- → `will-change: auto` (default), **NE** `will-change: transform` (zbytečné GPU memory)

---

## 9) Risks / missing — co spec přehlíží

| # | Issue | Priority |
|---|---|---|
| R1 | **Theme switcher thumbnail** explicitně listed (sekce 4.1 specu OK) | LOW (OK) |
| R2 | **`reducedMotion: 'safe'`** v `prirodaTheme` objektu — spec sekce 2 nezmiňuje, ale `vesmirna-lod` má → musí být v `index.ts` | HIGH |
| R3 | **Section title decoration** (sekce 1.3 zmiňuje `❦`) — Cinzel nemá tento glyph | HIGH — alternativně CSS `linear-gradient` rule s leafy ends |
| R4 | **Z-index management** corner ornaments vs content — explicitně neznámý | HIGH |
| R5 | **Heading wrap span** — sdílený `WelcomeHero` edit (Q3) je **explicitně shared edit**, memory rule říká "žádné globální/shared edity bez souhlasu". Souhlas není formálně dán (jen "na tobě") | HIGH — explicitní commit message a defenzivní guard |
| R6 | **Skinová izolace test** — neexistuje regrese-test pro 20 zbylých témat | MEDIUM — manuální QA list v plánu 1.0h |
| R7 | **OG image / favicon** — out of scope pro skin (per-app) | NA |
| R8 | **Print styles** — nejsou themed | NA |
| R9 | **Hospoda + Úvodník + Nápověda jako nav items** — předpokládáme že existují v aktuálním NavConfig. Pokud ne, nový NavConfig je out-of-scope tohoto skinu | MEDIUM — verify v impl. plánu |
| R10 | **Error/loading states** stylování pod `[data-theme="priroda"]` — error toast, loading spinner | MEDIUM — fallback na `--theme-accent` OK, no extra |
| R11 | **Theme switcher dropdown** — který skin se zobrazí jako "Příroda"? Thumbnail + name. Spec toto zmiňuje (`thumbnail: '/themes/thumbnails/priroda.webp'`) | LOW (OK) |
| R12 | **Animation budget audit** — spec říká "skin staticky tichý". OK — žádné `@keyframes` v decorations.css. | OK |

---

## 10) Actionable change requests (priority sorted)

### 🔴 BLOCKER (impl. plán nezačne dokud nevyřešeno)

- ~~**[B1] Regenerace `icon-napoveda.webp`**~~ — **AKCEPTOVÁNO uživatelem 2026-05-09.** Current 3D-render asset zůstává. Updated prompt v `_asset-prompts.md` ponechán pro budoucí iteraci, pokud by to přestalo vyhovovat.

### 🟠 HIGH (musí být ve specu před impl. plánem)

- **[H1]** Token model: přidat `--asset-corner`, `--asset-corner-size`, `--asset-corner-size-mobile`, `--theme-text-on-emerald`, `--frame-corner-inset` do spec sekce 2.
- **[H2]** Welcome `min-height` změnit `60vh` → `clamp(420px, 60vh, 720px)` v spec sekci 1.4.
- **[H3]** Topbar mobile breakpoint: pod 768px buttony icon-only s `aria-label`. Pod 480px: Tyky + Odhlásit do hamburger. Doplnit do spec sekce 5.
- **[H4]** Tablet (1024–1279): pravý sidebar do drawer. Doplnit do spec sekce 5.
- **[H5]** Corner ornament mobile: `--asset-corner-size-mobile: 64px` + `opacity: 0.7`. **V drawer mode `display: none`**. Doplnit do spec sekce 1 a 5.
- **[H6]** Section title `❦` decoration → CSS-only (linear gradient line with `::before`/`::after` leaf glyphs from icon-leaf-mini). Cinzel nemá tento unicode glyph. Spec sekce 1.3 update.
- **[H7]** Z-index management: explicitně do spec sekce 3:
  ```
  Corner ornaments: z-index 0, pointer-events: none
  Panel content:    z-index 1
  Focus outline:    z-index 2 (browser default)
  ```
- **[H8]** Topbar dřevěné cedulky **TMAVÝ text** `#3d2914`, ne krémový. Spec sekce 1.2 explicitně.
- **[H9]** `reducedMotion: 'safe'` přidat do `prirodaTheme` v spec sekce 2.
- ~~**[H10]** Q3 (WelcomeHero `<span class="hero-accent">` edit)~~ — **VYŘEŠENO**, wrap už existuje v `DashboardPage.tsx:47` jako `<span className={s.titleAccent}>`. Stačí přidat `[data-theme="priroda"] .titleAccent { … }` do `decorations.css`. Žádný shared edit, žádný souhlas potřeba.

### 🟡 MEDIUM

- **[M1]** `--theme-text-muted` `#a09060` → `#b8a070` (WCAG AA pass).
- **[M2]** FOUC mitigation: JS preload theme background před `data-theme` flip. Spec sekce 8 doplnit.
- **[M3]** `icon-leaf` 2 výstupní velikosti: `icon-leaf-32.webp` + `icon-leaf-64.webp` s explicit sharpening. Spec sekce 4.2 update.
- **[M4]** Mobile NavItem touch target ≥48px. Spec sekce 5.
- **[M5]** Verify nav config: existují items "Hospoda", "Úvodník", "Nápověda" v aktuálním nav configu? Pokud ne — out-of-scope tohoto skinu, dokumentovat.
- **[M6]** `--theme-accent-emerald` redundant s `--theme-accent` — drop nebo doc.

### 🟢 LOW

- **[L1]** Reduced motion explicit transition list v decorations.css komentář.
- **[L2]** `icon-uvodnik` pečeť obsahuje 2 listy místo 1 emblému — **akceptovat** (drobnost, regenerace nestojí za to).
- **[L3]** `icon-hospoda` pěna výraznější než spec ("small foam crest") — **akceptovat**.
- **[L4]** Scrollbar styling pro overflow-y panely (corner ornament collision) — viz sekce 5.

---

## 11) Souhrn — co teď potřebujeme od uživatele

1. **B1 — souhlas s regenerací `icon-napoveda`** (s update promptem výše).
2. **H10 — výslovný souhlas s edit `WelcomeHero`** (přidání `<span class="hero-accent">`).
3. Po vyřešení 1+2 → **update specu s H1–H9 + M1–M6**, **update _asset-prompts.md**, pak **impl. plán 1.0h**.

Bez B1 a H10 plán nestartuje.
