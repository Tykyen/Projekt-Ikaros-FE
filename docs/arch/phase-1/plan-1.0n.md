# Plán 1.0n — Vesmírná bitva visual upgrade

**Datum:** 2026-05-11
**Status:** ✅ Implementováno (2026-05-11)
**Spec:** [`spec-1.0n-vesmirna-bitva-upgrade.md`](spec-1.0n-vesmirna-bitva-upgrade.md) ✅
**Asset prompty:** [`prompts-1.0n-vesmirna-bitva-assets.md`](prompts-1.0n-vesmirna-bitva-assets.md) ✅
**Pořadí prací:** Pre-flight → Asset pipeline → Tokens → Decorations → Animace → Mobile breakpoints → A11y polish → Test sweep
**Branch:** `feat/krok-1.0n-vesmirna-bitva-upgrade`
**Single PR** — kompletní skin v jednom kroku

---

## 0. Pre-flight

### 0.1 Vstupní assety — ✅ všechny dodány 2026-05-11

| Asset | Status | Zdroj | Cílové rozměry |
|---|---|---|---|
| `logo.png` | ✅ user dodal | `assets-source/themes/vesmirna-bitva/logo.png` | zachovat orig (~1024×420, 2.4:1) — auto-trim přes optimize script |
| `medailon.png` | ✅ user dodal | `…/medailon.png` | zachovat orig (~768×1024, 3:4) |
| `corner-tl.png` | ✅ AI gen | `…/corner-tl.png` | resize 256×256 |
| `medailon-frame.png` | ✅ AI gen | `…/medailon-frame.png` | resize 384×384 (větší, jako hero v ALERT) |
| `destroyer-schematic.png` | ✅ AI gen | `…/destroyer-schematic.png` | resize 1600×400 |
| `targeting-reticle.png` | ✅ AI gen | `…/targeting-reticle.png` | resize 128×128 |
| `icon-uvodnik.png` | ✅ AI gen | `…/icon-uvodnik.png` | resize 96×96 |
| `icon-vytvorit-svet.png` | ✅ AI gen | `…/icon-vytvorit-svet.png` | resize 96×96 |
| `icon-diskuze.png` | ✅ AI gen | `…/icon-diskuze.png` | resize 96×96 |
| `icon-clanky.png` | ✅ AI gen | `…/icon-clanky.png` | resize 96×96 |
| `icon-galerie.png` | ✅ AI gen | `…/icon-galerie.png` | resize 96×96 |
| `icon-napoveda.png` | ✅ AI gen | `…/icon-napoveda.png` | resize 96×96 |
| `icon-hospoda.png` | ✅ AI gen | `…/icon-hospoda.png` | resize 96×96 |

**Background** `public/themes/backgrounds/vesmirna-bitva.webp` ✅ existuje, **neměníme**.
**Thumbnail** `public/themes/thumbnails/vesmirna-bitva.webp` ✅ existuje (vygenerováno z reference).

### 0.2 Folder convention ✅ OK

Source folder má lowercase slug: `assets-source/themes/vesmirna-bitva/` (✅ správně).

### 0.3 Verifikace v kódu — **žádný shared edit**

Layout selectors (existují, stejné jako temna-cerven 1.0l):

- [x] `data-theme="vesmirna-bitva"` na root — [`IkarosLayout.tsx:376`](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L376)
- [x] `data-shell="ikaros"` — [`IkarosLayout.tsx:377`](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L377)
- [x] `data-frame-panel="sidebar|right"` — existuje (řádky 398, 409, 423)
- [x] `data-nav-key="<key>"` — [`IkarosLayout.tsx:83,150`](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L83)
- [x] `CornerOrnament` komponenta s `data-position="tl|tr|bl|br"` — [`CornerOrnament.tsx`](../../../src/shared/ui/CornerOrnament/CornerOrnament.tsx)
- [x] `PanelCorners` injectuje 4 rohy do každého panelu — [`IkarosLayout.tsx:39-48`](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L39)
- [x] `data-pj-badge` — existuje
- [x] Skin selector pattern — `ThemeSwitcher` komponent existuje, použijeme **stejný pattern jako temna-cerven 1.0l** (žádný nový shared komponent)

**Klíčové rozhodnutí:** spark burst se implementuje jako **CSS `::before` pseudo-element na `CornerOrnament[data-position]`** (4 rohy už existují, žádná injection do layoutu). Reduced-motion = `display: none` na pseudo-elementy.

### 0.4 Audit existujícího skin selector

Použijeme **stejný komponent jako temna-cerven** (per spec 4.5). Pokud `ThemeSwitcher` v `src/themes/ThemeSwitcher.tsx` má grid mode, použít ten. Pokud ne, fallback na stejný inline render jako temna-cerven (grid 4-col scroll, 21 swatches).

### 0.5 **Žádný edit** v shared komponentách

Per spec 5 (Out of scope) — žádná React komponenta se nemodifikuje. Čistá CSS úprava přes `[data-theme="vesmirna-bitva"]` selector.

**Spark burst** = pure CSS přes existující `CornerOrnament[data-position]` spans (4 rohy už existují).

### 0.6 Font dostupnost

Verifikovat v [`index.html`](../../../index.html), které fonty jsou loaded. Per spec 4.9, vesmirna-bitva potřebuje **4 fonty**:

| Font | Status v index.html | Akce |
|---|---|---|
| **Saira Stencil One** | ❌ NENÍ načten | **přidat** do Google Fonts URL |
| **Chakra Petch** | ❌ NENÍ načten | **přidat** do Google Fonts URL |
| **Inter Tight** | ❌ NENÍ načten | **přidat** do Google Fonts URL |
| **Special Elite** | ❌ NENÍ načten | **přidat** do Google Fonts URL |

**Akce:** přidat všechny 4 fonty do existující Google Fonts `<link>` URL v `index.html`.

**Diff (abecedně mezi existující rodiny):**
```diff
+ &family=Chakra+Petch:wght@400;500;600;700
+ &family=Inter+Tight:wght@400;500;600;700
+ &family=Saira+Stencil+One
+ &family=Special+Elite
```

### 0.7 Akcepční podmínka regrese

20 ostatních témat **vizuálně identické** s pre-1.0n. Verifikace: `npm run dev` → manuálně cyklit dropdown switcher přes všech 21 témat → screenshot porovnání s pre-merge baseline.

---

## 1. Asset pipeline

### 1.1 Optimize → WebP

```powershell
npm run themes:optimize
```

Tento příkaz:
- Auto-detekuje všechny `assets-source/themes/vesmirna-bitva/*.png`
- Konvertuje na WebP (quality 85, alphaQuality 100)
- Logo (`logo.png`) projde chroma-key + auto-trim
- Output: `public/themes/vesmirna-bitva/decor/*.webp`

**Očekávaný output 13 souborů:**
```
public/themes/vesmirna-bitva/decor/
  logo.webp             (auto-trimmed)
  medailon.webp
  corner-tl.webp
  medailon-frame.webp
  destroyer-schematic.webp
  targeting-reticle.webp
  icon-uvodnik.webp
  icon-vytvorit-svet.webp
  icon-diskuze.webp
  icon-clanky.webp
  icon-galerie.webp
  icon-napoveda.webp
  icon-hospoda.webp
```

### 1.2 Finalize — resize na finální rozměry

Vytvořit `scripts/finalize-vesmirna-bitva-assets.mjs` (per `finalize-temna-cerven-assets.mjs` pattern):

```javascript
import sharp from 'sharp';
import path from 'node:path';
import { stat, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const DECOR = path.resolve('public/themes/vesmirna-bitva/decor');

const TASKS = [
  { in: 'corner-tl.webp',          out: 'corner-tl.webp',          w: 256,  h: 256 },
  { in: 'medailon-frame.webp',     out: 'medailon-frame.webp',     w: 384,  h: 384 },
  { in: 'destroyer-schematic.webp',out: 'destroyer-schematic.webp',w: 1600, h: 400, fit: 'contain', sharper: true },
  { in: 'targeting-reticle.webp',  out: 'targeting-reticle.webp',  w: 128,  h: 128 },
  { in: 'icon-uvodnik.webp',       out: 'icon-uvodnik.webp',       w: 96,   h: 96 },
  { in: 'icon-vytvorit-svet.webp', out: 'icon-vytvorit-svet.webp', w: 96,   h: 96 },
  { in: 'icon-diskuze.webp',       out: 'icon-diskuze.webp',       w: 96,   h: 96 },
  { in: 'icon-clanky.webp',        out: 'icon-clanky.webp',        w: 96,   h: 96 },
  { in: 'icon-galerie.webp',       out: 'icon-galerie.webp',       w: 96,   h: 96 },
  { in: 'icon-napoveda.webp',      out: 'icon-napoveda.webp',      w: 96,   h: 96 },
  { in: 'icon-hospoda.webp',       out: 'icon-hospoda.webp',       w: 96,   h: 96 },
];
// (logo + medailon ponecháváme v orig rozměrech — logo má baked-in text + medailon je
// rectangular display, downscale by rozmazal detail)
```

**Spuštění:**
```powershell
node scripts/finalize-vesmirna-bitva-assets.mjs
```

**Verifikace:** každý finalized asset by měl být ~10–60 KB (per temna-cerven precedent).

---

## 2. Tokens — `src/themes/themes/vesmirna-bitva/index.ts`

**Kompletní přepsání** existujícího ~50řádkového stubu na ~150řádkový full tokens map per spec 4.10.

### 2.1 Změny

- Přepsat všech ~10 existujících tokens (`--bg-primary`, `--accent`, atd.) na nové hellfire/gunmetal hodnoty
- Přidat ~30 `--theme-*` materiálových tokens (gunmetal, hellfire, plasma, ember, glow, surfaces, borders)
- Přidat 13 `--asset-*` URL tokens
- Aktualizovat `fonts:` sekci na Saira Stencil One / Inter Tight
- Zachovat `reducedMotion: 'heavy'`

### 2.2 Validační check

Po přepsání:
- TypeScript build pass (`npm run typecheck`)
- Theme registry stále importuje `vesmirnaBitvaTheme` bez chyby
- Žádný breaking change v signature (Theme type)

---

## 3. Decorations — `src/themes/themes/vesmirna-bitva/decorations.css`

**Kompletní přepsání** existujícího ~22řádkového stubu na ~750 řádků CSS scoped přes `[data-theme="vesmirna-bitva"]`.

### 3.1 Struktura souboru (sekce, pořadí)

```css
/* ── 1. Background & atmosphere (overlay, scanline, grain) ── */
/* ── 2. Header / topbar (logo, name-plate buttons) ── */
/* ── 3. Sidebar (left) — section titles, NavItem, dividers ── */
/* ── 4. Welcome card (battle-plate frame, destroyer-schematic, medailon, drop-cap, signature) ── */
/* ── 5. Decorative status strip (targeting reticle + text + chevrons) ── */
/* ── 6. Right panel — ADMINISTRACE + DISKUZE/SVĚTY + ALERT ── */
/* ── 7. Novinky panel ── */
/* ── 8. Nav console-button icons (7 assets, per data-nav-key) ── */
/* ── 9. Buttons (CTA, header buttons) ── */
/* ── 10. Forms / inputs (consistent battle-plate styling) ── */
/* ── 11. CornerOrnament — battle-plate s nýty + lava ember ── */
/* ── 12. Heart-monitor divider (SVG inline + CSS animation) ── */
/* ── 13. Animace: alarm-pulse, spark-fly, reticle-sweep, triangle-flash, ecg-spike ── */
/* ── 14. Reduced-motion overrides ── */
/* ── 15. Responsive breakpoints (desktop/tablet/mobile) ── */
```

### 3.2 Implementační hot-points

#### 3.2.1 CornerOrnament — battle-plate L bracket

```css
[data-theme="vesmirna-bitva"] [data-position] {
  position: absolute;
  width: var(--asset-corner-size, 40px);
  height: var(--asset-corner-size, 40px);
  background-image: var(--asset-corner);
  background-size: contain;
  background-repeat: no-repeat;
  filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.6))
          drop-shadow(0 0 8px var(--theme-glow-hellfire));
  pointer-events: none;
  z-index: 2;
}

[data-theme="vesmirna-bitva"] [data-position="tl"] { top: -6px; left: -6px; transform: rotate(0deg); }
[data-theme="vesmirna-bitva"] [data-position="tr"] { top: -6px; right: -6px; transform: scaleX(-1); }
[data-theme="vesmirna-bitva"] [data-position="bl"] { bottom: -6px; left: -6px; transform: scaleY(-1); }
[data-theme="vesmirna-bitva"] [data-position="br"] { bottom: -6px; right: -6px; transform: scale(-1, -1); }
```

#### 3.2.2 Spark burst — CSS `::before` na corner ornamentech

```css
[data-theme="vesmirna-bitva"] [data-position]::before {
  content: '';
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  background: radial-gradient(circle, var(--theme-plasma-bright), var(--theme-ember-burn) 60%, transparent 100%);
  box-shadow: 0 0 4px var(--theme-plasma);
  pointer-events: none;
  opacity: 0;
  animation: spark-fly 1.2s ease-out infinite;
}

/* Staggered delay — 4 rohy * N panelů → každý roh jiný offset, vznik random feel */
[data-theme="vesmirna-bitva"] [data-position="tl"]::before { animation-delay: 0s;   --spark-x: -12px; --spark-y: -16px; }
[data-theme="vesmirna-bitva"] [data-position="tr"]::before { animation-delay: 2.4s; --spark-x:  12px; --spark-y: -16px; }
[data-theme="vesmirna-bitva"] [data-position="bl"]::before { animation-delay: 4.8s; --spark-x: -12px; --spark-y:  16px; }
[data-theme="vesmirna-bitva"] [data-position="br"]::before { animation-delay: 7.2s; --spark-x:  12px; --spark-y:  16px; }

/* Panel-level offset — různé panely mají různý "rytmus" sparků */
[data-theme="vesmirna-bitva"] [data-frame-panel="right"] [data-position]::before { animation-duration: 1.4s; animation-delay: 3.6s; }
[data-theme="vesmirna-bitva"] .novinky [data-position]::before { animation-duration: 1.6s; animation-delay: 5.2s; }

@keyframes spark-fly {
  0%   { opacity: 0; transform: translate(0, 0) scale(0.4); }
  4%   { opacity: 0.95; }
  16%  { opacity: 0.85; }
  100% { opacity: 0; transform: translate(var(--spark-x, 12px), var(--spark-y, 16px)) scale(1.2); }
}
```

**Pozn.** Long animation duration (10–12s) s krátkým "active window" (4–16% = ~0.5s viditelná jiskra) = sparky burnout < 1s, pak ~10s pauza. Per panel = max 1 jiskra v daný okamžik.

#### 3.2.3 Alarm pulse na všech panelech

```css
@keyframes alarm-pulse {
  0%, 100% {
    border-color: var(--theme-gunmetal-edge);
    box-shadow:
      inset 0 1px 0 rgba(180, 190, 200, 0.06),
      inset 0 -2px 8px rgba(0, 0, 0, 0.7),
      inset 0 0 0 1px rgba(184, 16, 28, 0.15),
      0 22px 50px rgba(0, 0, 0, 0.6);
  }
  50% {
    border-color: var(--theme-hellfire-bright);
    box-shadow:
      inset 0 1px 0 rgba(180, 190, 200, 0.06),
      inset 0 -2px 8px rgba(0, 0, 0, 0.7),
      inset 0 0 0 1px rgba(255, 80, 64, 0.55),
      0 0 28px var(--theme-glow-hellfire-strong),
      0 22px 50px rgba(0, 0, 0, 0.6);
  }
}

[data-theme="vesmirna-bitva"] [data-frame-panel],
[data-theme="vesmirna-bitva"] .welcome-card,
[data-theme="vesmirna-bitva"] .novinky-panel {
  animation: alarm-pulse 1.4s ease-in-out infinite;
}
```

#### 3.2.4 Heart-monitor divider — SVG inline approach

CSS-only approach **NEFUNGUJE** pro animovaný ECG spike (vyžaduje `stroke-dasharray` animaci na SVG path). Řešení: **inline SVG v decorations.css** přes `mask-image` nebo `<svg>` v markup.

**Cleanest path:** vytvořit React komponentu `HeartMonitorDivider` (3 řádky JSX + 1 SVG path) a renderovat v RightPanel mezi sekcemi.

**ALE** spec 5 říká žádný shared edit. Alternativní řešení:
- Použít `data-divider="heart-monitor"` atribut v existujícím dividerů (pokud existuje)
- NEBO: CSS-only solution s `background-image: url("data:image/svg+xml...")` + `animation` na background-position (animace přes background image transformations je ale omezená)

**Doporučení:** prozatím **statický SVG flatline + spike** (žádná animace, jen ozdobné). Pokud user chce animovaný ECG, samostatný patch.

```css
[data-theme="vesmirna-bitva"] .section-divider,
[data-theme="vesmirna-bitva"] [data-section-divider] {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="..."><path d="M0 12 L80 12 L88 12 L92 4 L96 20 L100 8 L104 16 L108 12 L120 12 L200 12" stroke="%23b8101c" stroke-width="1" fill="none"/></svg>');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  height: 24px;
  width: 100%;
  opacity: 0.85;
}
```

#### 3.2.5 ALERT panel — medailon-frame jako hazard wrapper (R1)

```css
[data-theme="vesmirna-bitva"] .alert-panel { /* container */ }

[data-theme="vesmirna-bitva"] .alert-panel .alert-frame {
  width: 160px;
  height: 160px;
  background-image: var(--asset-medailon-frame);
  background-size: contain;
  background-repeat: no-repeat;
  position: relative;
  margin: 0 auto 14px;
  filter: drop-shadow(0 0 24px rgba(184, 16, 28, 0.5));
}

[data-theme="vesmirna-bitva"] .alert-panel .hazard-triangle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 64px;
  height: 64px;
  animation: triangle-flash 1.4s ease-in-out infinite;
}

@keyframes triangle-flash {
  0%, 100% { fill-opacity: 0.35; filter: drop-shadow(0 0 8px rgba(255, 80, 64, 0.5)); }
  50% { fill-opacity: 0.65; filter: drop-shadow(0 0 16px rgba(255, 80, 64, 0.8)); }
}
```

**Hazard triangle SVG markup** se renderuje uvnitř ALERT panelu. Otázka: existuje již v base layoutu nebo musíme přidat?

**Předpoklad:** ALERT panel je **nový element specifický pro vesmirna-bitva**, takže ho nemůžeme renderovat shared. Možnosti:
- A) Přidat ALERT panel JSX do `IkarosLayout.tsx` jako další `data-theme-decoration="alert"` block (gated CSS na vesmirna-bitva) — minor shared edit
- B) Pure CSS — nakreslit hazard triangle jako pseudo-element s `clip-path` polygon + `::after` vykřičník

**Doporučení: B (pure CSS s clip-path).** Žádný shared edit, plně CSS-only.

```css
[data-theme="vesmirna-bitva"] .alert-panel::after {
  content: '!';
  position: absolute;
  /* ... pseudo-element triangle drawn with clip-path or border tricks */
}
```

**ALE** — RightPanel komponenta vůbec nemá `.alert-panel` element. ALERT je nový sub-element pro vesmirna-bitva. **Řešení:** přidat ALERT panel jako `data-theme-decoration="alert"` block v `IkarosLayout.tsx` (analog k `data-theme-decoration="petals"` na řádku 431), gated CSS visibility per theme.

**Toto JE shared edit** (1 nový JSX block v IkarosLayout, ~10 řádků). Je to minor a oddělitelný (analog k existujícímu petals pattern), takže by mělo být akceptovatelné.

**Q-1 implementační:** vytvořit `data-theme-decoration="alert"` v IkarosLayout? (Předpoklad: **ANO**, analog k petals.)

#### 3.2.6 Status strip pod welcome card

```css
[data-theme="vesmirna-bitva"] .welcome-card::after {
  content: '';
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 36px;
  background: linear-gradient(180deg, rgba(20, 14, 16, 0.95), rgba(8, 4, 6, 0.97));
  border: 1px solid var(--theme-gunmetal-edge);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7), inset 0 0 0 1px rgba(184, 16, 28, 0.2);
  /* contents přes ::after, ale jen 1 pseudo — potřebuji víc */
}
```

**Problém:** `welcome-card::after` je už použito pro něco jiného (verifikovat v base CSS), a navíc 1 pseudo nestačí na reticle + text + chevrony.

**Řešení:** `data-theme-decoration="status-strip"` block v IkarosLayout (analog k petals), gated CSS. **Q-2 implementační:** přidat `<div data-theme-decoration="status-strip">` v layoutu (1 nový JSX block, ~10 řádků).

---

## 4. Pre-implementační rozhodnutí (Q-1 + Q-2)

Před začátkem editace `IkarosLayout.tsx`:

| Q | Otázka | Návrh |
|---|---|---|
| Q-1 | Přidat `<div data-theme-decoration="alert">` block v `IkarosLayout.tsx` (jen pro vesmirna-bitva render ALERT panelu) | **ANO** — analog k existujícímu `data-theme-decoration="petals"` na řádku 431. Minimalistický shared edit (~10 řádků JSX). CSS visibility gating přes `[data-theme="vesmirna-bitva"] [data-theme-decoration="alert"] { display: block }`. |
| Q-2 | Přidat `<div data-theme-decoration="status-strip">` block v `IkarosLayout.tsx` (status strip pod welcome card) | **ANO** — stejný pattern. Statický strip s 4 child spans: `<span class="reticle">`, `<span class="status-text">`, `<span class="chevron">×2`. |

**Pokud user schválí oba (Q-1 + Q-2):** přibude ~20 řádků JSX v `IkarosLayout.tsx` (po vzoru existujícího `petals` patternu). Žádný behavior change pro ostatní skiny.

**Pokud user chce čistě CSS-only (žádný shared edit):** alternativa = pseudo-elementy + JS-free, ale UX omezení (ALERT panel by neměl reálné texty, status strip by byl jen visuál bez chevronů). **Nedoporučuji** — vesmirna-bitva by ztratila ~30% své charakteristiky.

---

## 5. Implementační kroky (pořadí)

### Krok 1 — Asset pipeline (5 min)
1. `npm run themes:optimize` — generuje 13 WebP
2. Vytvořit `scripts/finalize-vesmirna-bitva-assets.mjs`
3. `node scripts/finalize-vesmirna-bitva-assets.mjs` — resize na finální rozměry
4. Verifikovat `public/themes/vesmirna-bitva/decor/` obsahuje 13 souborů

### Krok 2 — Tokens (10 min)
1. Přepsat `src/themes/themes/vesmirna-bitva/index.ts` per spec 4.10
2. `npm run typecheck` — verifikovat build pass

### Krok 3 — Fonts (2 min)
1. Přidat 4 fonty do `index.html` (Saira Stencil One, Chakra Petch, Inter Tight, Special Elite)

### Krok 4 — Layout decorations (15 min)
1. Přidat `data-theme-decoration="alert"` block v `IkarosLayout.tsx` (Q-1)
2. Přidat `data-theme-decoration="status-strip"` block (Q-2)
3. Verifikovat: ostatní skiny nevidí tyto bloky (CSS `display: none` jako default)

### Krok 5 — Decorations CSS (45 min)
1. Přepsat `decorations.css` per spec 4 (kompletní rewrite)
2. Implementovat 15 sekcí (background, topbar, sidebar, welcome, status strip, right panel, novinky, nav icons, buttons, forms, corners, dividers, animace, reduced-motion, responsive)

### Krok 6 — Manual visual QA (15 min)
1. `npm run dev`
2. Přepnout na vesmirna-bitva skin
3. Projít dashboard, novinky, diskuze, profil — vizuální kontrola
4. Test reduced-motion (system setting + emulated v devtools)
5. Test mobile breakpoint (responsive devtools mode)
6. Test ostatních 20 skinů — žádná regrese

### Krok 7 — Final cleanup + spec update (5 min)
1. Otestuj `npm run build` (production build)
2. Aktualizuj spec sekci "Status" na ✅ Implementováno
3. Update `docs/roadmap-fe.md` (11/21 skinů asset-grade)
4. Update `docs/themes/vesmirna-bitva.md` s finální vizí

### Krok 8 — Git commit + push
1. Commit message: `feat(themes/vesmirna-bitva): krok 1.0n — battle station HUD skin upgrade`
2. Push branch

**Celkem odhad: ~100 min implementace + ~20 min QA = ~2 hodiny.**

---

## 6. Soubory změněné

| Soubor | Typ změny | LOC |
|---|---|---|
| `src/themes/themes/vesmirna-bitva/index.ts` | Rewrite | ~50 → ~150 |
| `src/themes/themes/vesmirna-bitva/decorations.css` | Rewrite | ~22 → ~750 |
| `index.html` | 4-font URL append | +1 řádek |
| `src/app/layout/IkarosLayout/IkarosLayout.tsx` | +2 decoration blocks (Q-1, Q-2) | +~20 |
| `scripts/finalize-vesmirna-bitva-assets.mjs` | New file | ~70 |
| `public/themes/vesmirna-bitva/decor/*.webp` | 13 new files | (binární) |
| `docs/arch/phase-1/spec-1.0n-vesmirna-bitva-upgrade.md` | Status update | 1 řádek |
| `docs/roadmap-fe.md` | Tick item | 1 řádek |
| `docs/themes/vesmirna-bitva.md` | Update finální vize | ~50 |

**Soubory dotčené globálně:** `index.html` (font URLs), `IkarosLayout.tsx` (2 decoration blocks). Vše ostatní scoped per téma.

---

## 7. Test plán

### 7.1 Vizuální QA
- Dashboard vesmirna-bitva (desktop + mobile)
- Profil, diskuze, články pages
- Skin switcher (přepnout na temna-cerven, pak zpět — ověřit clean state)

### 7.2 Regrese — 20 ostatních skinů
- `npm run dev`, cyklit přes všech 21 skinů přes ThemeSwitcher
- Žádné CSS leakage z vesmirna-bitva selectorů (vše scoped)

### 7.3 Reduced-motion
- DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`
- Verifikovat: alarm pulse zastavené, spark burst neviditelný, ECG statický, reticle nestátí, triangle flash zastavený
- Hover transitions zachované, button click feedback funguje

### 7.4 Mobile (Chrome devtools, iPhone 14, Pixel 7)
- Layout neláme
- Hamburger menu funguje
- Welcome card medailon centrovaný nad textem
- Status strip pod cardem čitelný
- ALERT panel kompaktní
- Nav ikony 28×28 čitelné

### 7.5 Accessibility
- Lighthouse accessibility score ≥ 95
- Color contrast WCAG AA pro text vs background
- Focus rings viditelné (hellfire border)
- ARIA labels na decorative elements (aria-hidden="true")

### 7.6 Performance
- Bundle size delta < +10KB CSS (gzipped)
- Lighthouse performance score nezměněný
- 60 FPS animation na low-end mobile (alarm pulse + spark burst současně)

---

## 8. Roll-back plán

Pokud po merge zjištěny kritické issues:
1. Revert PR (single commit, snadné)
2. Vesmirna-bitva se vrátí na stub state (původní ~22 LOC decorations.css)
3. Žádný impact na 20 ostatních skinů (vše scoped)

---

## 9. Open questions before implementation

| # | Otázka | Status |
|---|---|---|
| Q-1 | Přidat `data-theme-decoration="alert"` block do IkarosLayout? | Předpoklad ANO (10 řádků JSX) |
| Q-2 | Přidat `data-theme-decoration="status-strip"` block do IkarosLayout? | Předpoklad ANO (10 řádků JSX) |

**Pokud user souhlasí s Q-1 + Q-2:** spuštění implementace per Krok 1-8.
**Pokud user chce čistě CSS-only:** prodiskutovat omezení a alternativy.
