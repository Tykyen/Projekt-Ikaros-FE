# Plán 1.0m — Čtyři živly visual upgrade

**Datum:** 2026-05-11
**Status:** ✅ Implementováno (2026-05-11)
**Spec:** [`spec-1.0m-ctyri-zivly-upgrade.md`](spec-1.0m-ctyri-zivly-upgrade.md) ✅
**Asset prompty:** [`prompts-1.0m-ctyri-zivly-assets.md`](prompts-1.0m-ctyri-zivly-assets.md) ✅
**Pořadí prací:** Pre-flight → Asset pipeline → Tokens → Decorations → Animace → Admin panel polish → Mobile breakpoints → A11y polish → Test sweep
**Branch:** `feat/krok-1.0m-ctyri-zivly-upgrade`
**Single PR** — kompletní skin v jednom kroku

**Schválené Q-rozhodnutí ze specu:** Q-1 A, Q-2 A, Q-3 A, Q-4 A, Q-5 C.

---

## 0. Pre-flight

### 0.1 Vstupní assety (✅ všechny dodány)

| Asset | Status | Zdroj | Cílové rozměry |
|---|---|---|---|
| `logo.png` | ✅ user dodal | `assets-source/themes/ctyri-zivly/logo.png` | zachovat orig |
| `medailon.png` | ✅ user dodal | `…/medailon.png` | zachovat orig (square) |
| `corner-tl.png` | ✅ AI gen | `…/corner-tl.png` | resize 256×256 |
| `cardinal-ruby.png` | ✅ AI gen | `…/cardinal-ruby.png` | resize 128×128 |
| `cardinal-sapphire.png` | ✅ AI gen | `…/cardinal-sapphire.png` | resize 128×128 |
| `cardinal-emerald.png` | ✅ AI gen | `…/cardinal-emerald.png` | resize 128×128 |
| `cardinal-topaz.png` | ✅ AI gen | `…/cardinal-topaz.png` | resize 128×128 |
| `compass.png` | ✅ AI gen | `…/compass.png` | resize 384×384 |
| `divider-chain.png` | ✅ AI gen | `…/divider-chain.png` | resize 800×128 |
| `icon-uvodnik.png` | ✅ AI gen | `…/icon-uvodnik.png` | resize 96×96 |
| `icon-vytvorit-svet.png` | ✅ AI gen | `…/icon-vytvorit-svet.png` | resize 96×96 |
| `icon-diskuze.png` | ✅ AI gen | `…/icon-diskuze.png` | resize 96×96 |
| `icon-clanky.png` | ✅ AI gen | `…/icon-clanky.png` | resize 96×96 |
| `icon-galerie.png` | ✅ AI gen | `…/icon-galerie.png` | resize 96×96 |
| `icon-napoveda.png` | ✅ AI gen | `…/icon-napoveda.png` | resize 96×96 |
| `icon-hospoda.png` | ✅ AI gen | `…/icon-hospoda.png` | resize 96×96 |

**Public BG** `public/themes/backgrounds/ctyri-zivly.webp` ✅ existuje, **neměníme**.
**Thumbnail** `public/themes/thumbnails/ctyri-zivly.webp` ⚠️ ověřit existence v 0.4.

### 0.2 Folder convention ✅ OK

Source folder má lowercase slug: `assets-source/themes/ctyri-zivly/` (✅ správně, žádný rename).

### 0.3 Verifikace v kódu (žádný shared edit kromě Phoenix Ember wrapperu)

- [x] `data-shell="ikaros"` na root — existuje
- [x] `data-frame-panel="topbar|sidebar|right|card|novinky"` — existuje
- [x] `data-nav-item`, `data-nav-key="<key>"` — existuje
- [x] `data-corner="tl|tr|bl|br"` — existuje (CornerOrnament komponenta)
- [x] `data-andel-medallion` — existuje
- [x] `data-section-title`, `data-section-divider` — existuje
- [x] `ctyriZivlyTheme` je v registry ([`registry.ts`](../../../src/themes/registry.ts))
- [ ] **Phoenix Ember orbit wrapper** — případně přidat `<div data-theme-decoration="ember-orbit">` do [`IkarosLayout.tsx`](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx) s globální gating v [`reset.css`](../../../src/themes/_shared/reset.css). **Předpoklad pro plán:** ne, ember orbit implementovat čistě v CSS `::before/::after` na `.hero-card` selektoru — žádný shared edit potřeba.

### 0.4 Thumbnail audit

```powershell
Test-Path public/themes/thumbnails/ctyri-zivly.webp
```

Pokud chybí: vygenerovat z `medailon.png` (resize 320×320, square crop), uložit jako `public/themes/thumbnails/ctyri-zivly.webp` přes finalize script.

### 0.5 ADMINISTRACE pravý panel (Q-1 A)

Per project memory `project_admin_panel_decision.md` + Q-1 A: pravý panel obsahuje:
1. ADMINISTRACE sekce nahoře (ThemeSwitcher dropdown + UŽIVATELÉ link) — existující komponent, jen stylizace
2. Pod ní defaultní sekce (MOJE DISKUZE, MOJE SVĚTY, OBLÍBENÉ ČLÁNKY, OBLÍBENÉ OBRÁZKY) — žádný shared edit
3. Compass mandala (`compass.webp`) dole pod posledním sekcí — render přes CSS `::after` pseudo-element na panelu (žádný shared edit)

**Žádný nový komponent** se nevytváří. Pokud `<ThemeSwitcher>` ještě není v ADMINISTRACE sekci, ověřit v 0.4. (Pokud chybí, je to feature ostatních skinů, nikoli ctyri-zivly bug — out of scope.)

### 0.6 Audit existující ThemeSwitcher umístění

```powershell
Get-ChildItem -Recurse src -Include *.tsx | Select-String -Pattern "ThemeSwitcher" -SimpleMatch
```

Cíl: ověřit, kde se rendruje. Pokud už je v pravém panelu (admin section), pak jen CSS stylizace skrz `[data-theme="ctyri-zivly"]` selector. Pokud ne, **out of scope pro 1.0m** (řešilo by se v separátním cleanup specu).

### 0.7 Font dostupnost

Per spec 4.11, ctyri-zivly potřebuje **3 fonty**:

| Font | Status v index.html | Akce |
|---|---|---|
| **MedievalSharp** | ❌ NENÍ načten | **přidat** do Google Fonts URL |
| **Cardo** | ❌ NENÍ načten | **přidat** do Google Fonts URL |
| **Pinyon Script** | ❌ NENÍ načten | **přidat** do Google Fonts URL |

**Akce:** přidat `family=MedievalSharp&family=Cardo:ital,wght@0,400;0,700;1,400&family=Pinyon+Script` do existujícího Google Fonts URL v [`index.html`](../../../index.html) (vložit abecedně).

### 0.8 Akcepční podmínka regrese

20 ostatních témat (pergamen, hospoda, modré nebe, zlatý standard, sci-fi, bílá, nemrtví, temná červeň, …) **vizuálně identické** s pre-1.0m. Verifikace: `npm run dev` → manuálně cyklit dropdown switcher přes všech 21 témat → spot-check.

### 0.9 Audit-derived constraints (musí dodržet implementace)

| # | Pravidlo | Kde se ověří |
|---|---|---|
| T1 | Atmosférický overlay = phoenix-radiance halo shora + steel-deep grounding zdola + vinyl vignette + Quartered Aurora 4 rohy + film grain (5 vrstev) | `decorations.css` body |
| T2 | **Quartered Aurora drift** — 4 radial gradients v 4 rozích body, 45s ease-in-out alternate, ±20px X / ±10px Y / opacity 0.06→0.10 | `decorations.css` body::before |
| T3 | **Phoenix Ember orbit** — 8×8px radial-gradient ember obíhající square path po vnitřním obvodu `.hero-card`, 11s linear infinite | `decorations.css` welcome ::before |
| T4 | **Cardinal Pulse** — 4 cardinal gem assets pulzují postupně (rubín → safír → smaragd → topaz), 6s loop, každý 0.4s glow expansion | `decorations.css` welcome cardinal markers |
| T5 | **Film grain** SVG noise filter, opacity 0.18 (jemnější než temna-cerven), mix-blend overlay, fixed inset 0, z-index 1000 | `decorations.css` body::after |
| T6 | Topbar `background-color: solid steel-mid` + bronze inlay line podél spodní hrany (1px gradient) | `decorations.css` topbar |
| T7 | Welcome card double-border: 1px silver-bright outer + 2px bronze-warm inset | `decorations.css` welcome |
| T8 | Welcome + Novinky **mají** 4 corner-tl ornaments (mirror via CSS); ostatní panely **NE** (sidebar L+R mají 4 corner ornaments menší velikosti) | `decorations.css` panels |
| T9 | Welcome card **4 cardinal gemy** v midpointech (TOP topaz, RIGHT sapphire, BOTTOM emerald, LEFT ruby) absolute positioned | `decorations.css` welcome cardinals |
| T10 | **Drop-cap "V"** — MedievalSharp 4.2em (desktop), gold-leaf gradient text-color, phoenix-radiance text-shadow halo (Q-2 A) | `decorations.css` welcome drop-cap |
| T11 | Active NavItem = bronze-bright `border-left: 3px solid` + inset bronze-shadow + gold-leaf text + small ruby cabochon dot 4px ::before | `decorations.css` NavItem |
| T12 | Hover NavItem/CTA = bronze warm glow box-shadow + brightens k bronze-bright + translateY(-1px) | `decorations.css` hover |
| T13 | "+" tlačítka + "PŘIDAT NOVINKU" = bronze gradient CTA — `bronze-deep → bronze-warm → bronze-deep` + silver-bright outer + gold-leaf inner border + gold-leaf text MedievalSharp uppercase | `decorations.css` CTA |
| T14 | **Pravý panel = ADMINISTRACE nahoře + default sekce pod + Compass mandala dole** (Q-1 A) | DOM (no edit) + `decorations.css` |
| T15 | **Compass mandala** v pravém panelu — `compass.webp` 220×220 desktop / 180×180 tablet / hidden ≤480px, `compass-rotate 90s linear infinite` (Q-3 A) | `decorations.css` right panel ::after |
| T16 | Medailon v welcome card vlevo, čtvercový 200×200 / 160×160 / 128×128 (desktop/tablet/mobile) s phoenix-radiance ambient glow filter | `decorations.css` welcome medailon |
| T17 | Section dividers (Q-5 C): mix — `divider-chain.webp` mezi major sekcemi (Novinky title + content; ADMINISTRACE → default sekce); 1px bronze gradient line s drobnou cabochon dot ::before pro menší detail | `decorations.css` |
| T18 | Nav ikony render přes CSS `background-image: var(--asset-icon-{key})` na `[data-nav-key="<key>"] > .icon` — žádný shared edit | `decorations.css` nav items |
| T19 | Italic závěr ("Příjemnou zábavu přeji administrátoři.") — Pinyon Script 1.4em, gold-leaf color | `decorations.css` welcome italic |
| T20 | NavItem section labels (NAVIGACE, VESMÍRY, CHAT) — MedievalSharp uppercase, bronze-warm, letter-spacing 3px, 1px bronze-inlay underline | `decorations.css` section title |
| C21 | Mobile (≤768px): Compass hidden ≤480px, gemy 60px→36px, ember 8px→6px, dividers hidden, drop-cap 4.2→2.8em | `decorations.css` mobile |
| C22 | NavItem touch target ≥48px na mobile | `decorations.css` mobile |
| C23 | `reducedMotion: 'heavy'` v `ctyriZivlyTheme` objektu (už nastaveno) | `index.ts` |
| C24 | Reduced motion vypíná Quartered Aurora drift, Phoenix Ember orbit, Cardinal Pulse, Compass rotation. Hover transitions zachovat (UX feedback). | `decorations.css` reduced-motion |
| C25 | Focus visible: bronze-bright outline 2px + phoenix-radiance halo | `decorations.css` a11y |
| C26 | `lint:colors` clean — žádné hardcoded barvy mimo `index.ts` tokens | `npm run lint:colors` |

---

## 1. Asset pipeline

### 1.1 Krok 1 — WebP konverze

```powershell
npm run themes:optimize
```

**Výstup:** `public/themes/ctyri-zivly/decor/*.webp` (16 souborů: logo + medailon + 14 AI)

**Pozn.:** AI assety mají transparent PNG, žádný chroma-key trick potřeba.

### 1.2 Krok 2 — Finalize script (resize na cílové rozměry)

Vytvořit `scripts/finalize-ctyri-zivly-assets.mjs` per `finalize-temna-cerven-assets.mjs` pattern:

```javascript
import sharp from 'sharp';
import path from 'node:path';
import { stat, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const DECOR = path.resolve('public/themes/ctyri-zivly/decor');

const TASKS = [
  { in: 'corner-tl.webp',          out: 'corner-tl.webp',          w: 256,  h: 256 },
  { in: 'cardinal-ruby.webp',      out: 'cardinal-ruby.webp',      w: 128,  h: 128 },
  { in: 'cardinal-sapphire.webp',  out: 'cardinal-sapphire.webp',  w: 128,  h: 128 },
  { in: 'cardinal-emerald.webp',   out: 'cardinal-emerald.webp',   w: 128,  h: 128 },
  { in: 'cardinal-topaz.webp',     out: 'cardinal-topaz.webp',     w: 128,  h: 128 },
  { in: 'compass.webp',            out: 'compass.webp',            w: 384,  h: 384 },
  { in: 'divider-chain.webp',      out: 'divider-chain.webp',      w: 800,  h: 128, fit: 'contain', sharper: true },
  { in: 'icon-uvodnik.webp',       out: 'icon-uvodnik.webp',       w: 96,   h: 96 },
  { in: 'icon-vytvorit-svet.webp', out: 'icon-vytvorit-svet.webp', w: 96,   h: 96 },
  { in: 'icon-diskuze.webp',       out: 'icon-diskuze.webp',       w: 96,   h: 96 },
  { in: 'icon-clanky.webp',        out: 'icon-clanky.webp',        w: 96,   h: 96 },
  { in: 'icon-galerie.webp',       out: 'icon-galerie.webp',       w: 96,   h: 96 },
  { in: 'icon-napoveda.webp',      out: 'icon-napoveda.webp',      w: 96,   h: 96 },
  { in: 'icon-hospoda.webp',       out: 'icon-hospoda.webp',       w: 96,   h: 96 },
];

async function processOne({ in: inFile, out: outFile, w, h, sharper, fit }) {
  const inPath = path.join(DECOR, inFile);
  const outPath = path.join(DECOR, outFile);
  if (!existsSync(inPath)) {
    console.warn(`✗ ${inFile} neexistuje, skip`);
    return;
  }
  const buf = await readFile(inPath);
  let pipeline = sharp(buf)
    .resize(w, h, { fit: fit || 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  pipeline = sharper
    ? pipeline.sharpen({ sigma: 0.6, m1: 1.0, m2: 0.5 })
    : pipeline.sharpen({ sigma: 0.4 });

  const outBuf = await pipeline.webp({ quality: 90, alphaQuality: 100 }).toBuffer();
  await writeFile(outPath, outBuf);

  const s = await stat(outPath);
  console.log(`✓ ${inFile} → ${outFile} (${w}×${h}, ${(s.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log('🪙 Finalize ctyri-zivly assets…');
  for (const task of TASKS) {
    await processOne(task);
  }
  console.log('✅ Hotovo.');
}

main().catch((e) => { console.error(e); process.exit(1); });
```

**Spustit:** `node scripts/finalize-ctyri-zivly-assets.mjs`

### 1.3 Krok 3 — Thumbnail generování (pokud chybí per 0.4)

Pokud `public/themes/thumbnails/ctyri-zivly.webp` neexistuje, přidat task do finalize scriptu:

```javascript
{ in: '../decor/medailon.webp', out: '../../thumbnails/ctyri-zivly.webp', w: 320, h: 320, sharper: true }
```

Nebo vygenerovat manuálně přes sharp.

---

## 2. Theme tokens — `index.ts`

**Soubor:** [`src/themes/themes/ctyri-zivly/index.ts`](../../../src/themes/themes/ctyri-zivly/index.ts)

**Akce:** Kompletní přepis. Cca ~120 řádků. Struktura:

```typescript
import type { Theme } from '@/themes/types';

export const ctyriZivlyTheme: Theme = {
  id: 'ctyri-zivly',
  name: 'Čtyři živly',
  scope: 'both',
  atmosphere: 'Pactum Quattuor — heraldická reliquář-mřížka s 4 cardinal gemy a phoenix-radiance unifierem',
  vars: {
    // === Pozadí ===
    '--bg-primary':         '#13141a',
    '--bg-secondary':       '#1a1d26',
    '--bg-card':            '#252830',
    '--bg-card-hover':      '#2c2f38',

    // === Accent (bronze-warm jako hybrid primary accent) ===
    '--accent':             '#b08840',
    '--accent-bright':      '#d4a850',
    '--accent-dim':         '#5a4220',
    '--accent-soft':        'rgba(176, 136, 64, 0.16)',

    // === Text ===
    '--text-primary':       '#e8dac0',
    '--text-secondary':     '#98886a',
    '--text-muted':         '#5a4a38',

    // === Border ===
    '--border':             '#3a3024',
    '--border-subtle':      '#2a241c',
    '--border-strong':      '#b08840',

    // === Status colors (mapped on element gems) ===
    '--success':            '#2a8050',   // emerald = země
    '--warning':            '#e8d480',   // topaz = vzduch
    '--danger':             '#c8202a',   // ruby = oheň
    '--info':               '#2050b0',   // sapphire = voda

    '--text-on-accent':         '#13141a',
    '--text-on-danger':         '#ffffff',
    '--bg-overlay':             'rgba(8, 10, 16, 0.7)',
    '--success-soft':           'rgba(42, 128, 80, 0.16)',
    '--success-soft-border':    'rgba(42, 128, 80, 0.4)',
    '--warning-soft':           'rgba(232, 212, 128, 0.14)',
    '--warning-soft-border':    'rgba(232, 212, 128, 0.4)',
    '--danger-soft':            'rgba(200, 32, 42, 0.14)',
    '--danger-soft-border':     'rgba(200, 32, 42, 0.4)',
    '--danger-focus-ring':      'rgba(200, 32, 42, 0.3)',

    // === Theme signature tokens ===
    '--theme-steel-deep':       '#13141a',
    '--theme-steel-mid':        '#1a1d26',
    '--theme-steel-niche':      '#1c2230',
    '--theme-steel-card':       '#252830',
    '--theme-silver-bright':    '#e8ecf0',
    '--theme-silver-base':      '#c8ccd2',
    '--theme-silver-shadow':    '#5a5e66',
    '--theme-bronze-deep':      '#5a4220',
    '--theme-bronze-warm':      '#b08840',
    '--theme-bronze-bright':    '#d4a850',
    '--theme-gold-leaf':        '#e8c860',
    '--theme-phoenix-radiance': '#ffe8a8',
    '--theme-phoenix-glow':     '#ffd680',
    '--theme-ruby':             '#c8202a',
    '--theme-ruby-glow':        '#f04050',
    '--theme-sapphire':         '#2050b0',
    '--theme-sapphire-glow':    '#4080e0',
    '--theme-emerald':          '#2a8050',
    '--theme-emerald-glow':     '#50b070',
    '--theme-topaz':            '#e8d480',
    '--theme-topaz-glow':       '#fff0c0',
    '--theme-text-pale':        '#e8dac0',
    '--theme-text-muted':       '#98886a',

    // === Asset URLs ===
    '--asset-logo':              'url(/themes/ctyri-zivly/decor/logo.webp)',
    '--asset-medailon':          'url(/themes/ctyri-zivly/decor/medailon.webp)',
    '--asset-corner':            'url(/themes/ctyri-zivly/decor/corner-tl.webp)',
    '--asset-cardinal-ruby':     'url(/themes/ctyri-zivly/decor/cardinal-ruby.webp)',
    '--asset-cardinal-sapphire': 'url(/themes/ctyri-zivly/decor/cardinal-sapphire.webp)',
    '--asset-cardinal-emerald':  'url(/themes/ctyri-zivly/decor/cardinal-emerald.webp)',
    '--asset-cardinal-topaz':    'url(/themes/ctyri-zivly/decor/cardinal-topaz.webp)',
    '--asset-compass':           'url(/themes/ctyri-zivly/decor/compass.webp)',
    '--asset-divider-chain':     'url(/themes/ctyri-zivly/decor/divider-chain.webp)',
    '--asset-icon-uvodnik':      'url(/themes/ctyri-zivly/decor/icon-uvodnik.webp)',
    '--asset-icon-vytvorit-svet':'url(/themes/ctyri-zivly/decor/icon-vytvorit-svet.webp)',
    '--asset-icon-diskuze':      'url(/themes/ctyri-zivly/decor/icon-diskuze.webp)',
    '--asset-icon-clanky':       'url(/themes/ctyri-zivly/decor/icon-clanky.webp)',
    '--asset-icon-galerie':      'url(/themes/ctyri-zivly/decor/icon-galerie.webp)',
    '--asset-icon-napoveda':     'url(/themes/ctyri-zivly/decor/icon-napoveda.webp)',
    '--asset-icon-hospoda':      'url(/themes/ctyri-zivly/decor/icon-hospoda.webp)',

    // === Fonts ===
    '--font-logo':     '"MedievalSharp", "Cinzel", Georgia, serif',
    '--font-display':  '"MedievalSharp", "Cinzel", Georgia, serif',
    '--font-body':     '"Cardo", "EB Garamond", Georgia, serif',
    '--font-italic':   '"Pinyon Script", "Italianno", cursive',
  },
  fonts: {
    logo: 'MedievalSharp',
    display: 'MedievalSharp',
    body: 'Cardo',
  },
  thumbnail: '/themes/thumbnails/ctyri-zivly.webp',
  background: '/themes/backgrounds/ctyri-zivly.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
```

---

## 3. Decorations — `decorations.css`

**Soubor:** [`src/themes/themes/ctyri-zivly/decorations.css`](../../../src/themes/themes/ctyri-zivly/decorations.css)

**Akce:** Kompletní přepis. Cca ~700 řádků, ~25 sekcí (struktura jako temna-cerven). Vše scoped přes `[data-theme="ctyri-zivly"]`.

### Sekce struktura:
1. **Globální body + overlay** (5-vrstvý gradient + Quartered Aurora 4 rohy)
2. **Body::before** — Quartered Aurora drift animation (45s ease-in-out alternate)
3. **Body::after** — Film grain overlay (SVG noise, fixed, z-index 1000)
4. **Topbar** — solid steel-mid + bronze inlay line + logo styling
5. **Header buttons** — heraldic shield-button (bronze border + steel-card bg + gold-leaf text)
6. **Sidebar L (NAVIGACE)** — steel-mid bg + 4 corner ornaments (corner-tl mirror) + alchemic glyph subtle pattern
7. **Section labels** (NAVIGACE/VESMÍRY/CHAT) — MedievalSharp uppercase, bronze-warm, letter-spacing 3px + bronze-inlay underline
8. **NavItem (level 1)** — heraldic styling, hover bronze glow + translateY, active bronze-bright border-left + ruby cabochon dot
9. **Nav icons (7)** — each `[data-nav-key="<key>"] .icon::before` s `background-image: var(--asset-icon-<key>)`, hover phoenix-radiance drop-shadow filter, active brightness(1.15) pulse
10. **Welcome card layout** — steel-card bg + phoenix-radiance subtle radial + double-border (1px silver + 2px bronze)
11. **Welcome card — 4 corner ornaments** (`corner-tl` + 3× mirror přes CSS)
12. **Welcome card — 4 cardinal gem markers** (absolute positioned, top/right/bottom/left midpoint)
13. **Welcome card — medailon** (left, 200/160/128 desktop/tablet/mobile, phoenix-radiance filter)
14. **Welcome card — Phoenix Ember orbit** (`::before` 8×8px radial-gradient, square path animation 11s linear infinite, Q-4 A)
15. **Welcome card — Cardinal Pulse** (sequential @keyframes na 4 gemech, 6s loop)
16. **Welcome card — drop-cap "V"** (MedievalSharp, gold-leaf gradient text, phoenix-radiance text-shadow halo, Q-2 A)
17. **Welcome card — italic závěr** (Pinyon Script, gold-leaf color)
18. **Novinky panel** — stejný styling jako welcome (4 corner ornaments menší + double-border)
19. **Novinky — section divider** — `divider-chain` background-image mezi headlinou a content (Q-5 C major divider)
20. **Sidebar R (ADMINISTRACE + base)** — steel-mid bg + 4 corner ornaments (menší)
21. **ADMINISTRACE section** — section label styling + ThemeSwitcher restyling (bronze trigger + steel-card dropdown panel s mini-shields)
22. **Right panel Compass mandala** — `::after` background-image `compass.webp` na panelu, 220/180/hidden, `compass-rotate 90s linear infinite` (Q-3 A)
23. **Default sections** (MOJE DISKUZE, MOJE SVĚTY) — heraldic NavItem level-2 styling + minor dividers (CSS 1px bronze gradient line + ruby cabochon dot ::before, Q-5 C minor divider)
24. **CTAs** (primary "PŘIDAT NOVINKU", "+"; secondary "ZOBRAZIT VŠE →") — bronze gradient + double-border + gold-leaf text + hover phoenix-radiance outer glow
25. **Hover/focus + reduced-motion + mobile breakpoints + a11y**

### Klíčové @keyframes:

```css
@keyframes aurora-drift {
  0% { transform: translate(-10px, -5px); opacity: 0.06; }
  100% { transform: translate(10px, 5px); opacity: 0.10; }
}

@keyframes ember-orbit {
  0%   { top: 8px;        left: 8px; }
  25%  { top: 8px;        left: calc(100% - 16px); }
  50%  { top: calc(100% - 16px); left: calc(100% - 16px); }
  75%  { top: calc(100% - 16px); left: 8px; }
  100% { top: 8px;        left: 8px; }
}

@keyframes cardinal-pulse-ruby {
  0%, 100% { filter: brightness(1); }
  6.67%, 26.67% { filter: brightness(1) drop-shadow(0 0 8px var(--theme-ruby-glow)); }
  16.67% { filter: brightness(1.25) drop-shadow(0 0 14px var(--theme-ruby-glow)); }
}

@keyframes cardinal-pulse-sapphire {
  0%, 100% { filter: brightness(1); }
  31.67%, 51.67% { filter: brightness(1) drop-shadow(0 0 8px var(--theme-sapphire-glow)); }
  41.67% { filter: brightness(1.25) drop-shadow(0 0 14px var(--theme-sapphire-glow)); }
}

@keyframes cardinal-pulse-emerald {
  0%, 100% { filter: brightness(1); }
  56.67%, 76.67% { filter: brightness(1) drop-shadow(0 0 8px var(--theme-emerald-glow)); }
  66.67% { filter: brightness(1.25) drop-shadow(0 0 14px var(--theme-emerald-glow)); }
}

@keyframes cardinal-pulse-topaz {
  0%, 100% { filter: brightness(1); }
  81.67%, 100% { filter: brightness(1) drop-shadow(0 0 8px var(--theme-topaz-glow)); }
  91.67% { filter: brightness(1.25) drop-shadow(0 0 14px var(--theme-topaz-glow)); }
}

@keyframes compass-rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

### Reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  [data-theme="ctyri-zivly"] [data-frame-panel="card"]::before,
  [data-theme="ctyri-zivly"] .cardinal-ruby,
  [data-theme="ctyri-zivly"] .cardinal-sapphire,
  [data-theme="ctyri-zivly"] .cardinal-emerald,
  [data-theme="ctyri-zivly"] .cardinal-topaz,
  [data-theme="ctyri-zivly"] [data-frame-panel="right"]::after,
  [data-theme="ctyri-zivly"] body::before {
    animation: none !important;
  }
}
```

---

## 4. Shared edits — minimal

### 4.1 `index.html` (Google Fonts)

```diff
- <link href="https://fonts.googleapis.com/css2?family=...existing fonts..." rel="stylesheet">
+ <link href="https://fonts.googleapis.com/css2?family=Cardo:ital,wght@0,400;0,700;1,400&family=MedievalSharp&family=Pinyon+Script&family=...existing fonts..." rel="stylesheet">
```

Konkrétní pozice: vložit `Cardo`, `MedievalSharp`, `Pinyon+Script` abecedně mezi existující.

### 4.2 `docs/themes/ctyri-zivly.md` (přepis dle Pactum Quattuor)

Stejný pattern jako `docs/themes/temna-cerven.md` po 1.0l. Sekce: Atmosféra, Barevná paleta (s WCAG), Typografie, Dekorativní prvky (assety + CSS-only), Layout & komponenty, Animace & motion, Rozdíly od ostatních skinů, Implementační poznámky. **Generuje se až po implementaci** (poslední krok).

### 4.3 Žádné jiné shared edity

- Žádný `<div data-theme-decoration="ember-orbit">` wrapper — Phoenix Ember implementován čistě v CSS `::before` na `.hero-card`
- Žádný nový React komponent
- Žádná úprava `IkarosLayout.tsx` / `reset.css`

---

## 5. Pořadí implementačních kroků

| # | Krok | Soubor / akce | Trvání |
|---|---|---|---|
| 1 | Asset pipeline — WebP konverze | `npm run themes:optimize` | 30s |
| 2 | Vytvořit `finalize-ctyri-zivly-assets.mjs` | `scripts/finalize-ctyri-zivly-assets.mjs` | 5min |
| 3 | Spustit finalize | `node scripts/finalize-ctyri-zivly-assets.mjs` | 10s |
| 4 | Thumbnail gen (pokud chybí) | finalize task | součást #3 |
| 5 | Google Fonts | `index.html` | 2min |
| 6 | Tokens | `src/themes/themes/ctyri-zivly/index.ts` přepis | 15min |
| 7 | Decorations base — sekce 1-9 (body, topbar, sidebar, nav) | `decorations.css` | 40min |
| 8 | Welcome card — sekce 10-17 (layout, gems, animace, drop-cap) | `decorations.css` | 60min |
| 9 | Novinky + Pravý panel — sekce 18-23 (admin, compass, default sections, dividery) | `decorations.css` | 40min |
| 10 | CTAs + hover/focus + reduced-motion + mobile + a11y — sekce 24-25 | `decorations.css` | 30min |
| 11 | Manual smoke test — `npm run dev` na desktop + mobile + reduced-motion + ostatní 20 skinů | browser | 25min |
| 12 | `npm run lint:colors` + `npm run lint` + případné fixy | terminal | 10min |
| 13 | Přepis `docs/themes/ctyri-zivly.md` per nový koncept | docs | 20min |
| 14 | Final review + commit + PR draft | git | 15min |

**Celkový odhad:** ~4.5h coding + ~0.5h verifikace.

---

## 6. Verifikační testy

### 6.1 Vizuální (manuální)
- ✅ Desktop 1440px / 1280px / 1024px — welcome card má 4 cardinal gemy v midpointech, medailon vlevo, drop-cap "V", Phoenix Ember orbit běží
- ✅ Tablet 768px — gemy a corner ornaments zmenšené, Compass mandala stále viditelná
- ✅ Mobile 480px / 360px — Compass hidden, gemy 36px, drop-cap 2.8em, dividery hidden
- ✅ Reduced-motion: Quartered Aurora statická, Phoenix Ember vypnut, Cardinal Pulse zastavený, Compass static
- ✅ Hover na NavItem: bronze glow + translateY
- ✅ Active NavItem: bronze-bright border-left + ruby cabochon dot
- ✅ CTA hover: phoenix-radiance outer glow + bronze brightens

### 6.2 Regrese (ostatní 20 skinů)
- ✅ Po build: skin selector dropdown projde všech 21 skinů, žádná vizuální regrese na ostatních

### 6.3 A11y
- ✅ Keyboard nav: focus rings bronze-bright + phoenix-radiance halo viditelné
- ✅ Lighthouse axe scan: 0 violations
- ✅ WCAG kontrast: text-pale na steel-deep = 12.6:1 ✅ AAA (potvrdit v devtools)

### 6.4 Build & lint
- ✅ `npm run lint:colors` clean
- ✅ `npm run lint` clean
- ✅ `npm run build` success
- ✅ `npm run typecheck` clean

---

## 7. Out of scope (per spec sekce 10)

- Změny shared layoutu (žádný edit `IkarosLayout.tsx` / `reset.css`)
- Změny ostatních skinů
- Změny backendu
- Nová ThemeSwitcher komponenta (pouze stylizace existující)
- Změny background image
- Změny do `SkinSelector` komponenty (pokud neexistuje, řeší se separátním specem)

---

## 8. Definition of Done

- [ ] 16 assetů v `public/themes/ctyri-zivly/decor/` (cwebp -q 90 -alpha_q 100)
- [ ] Tokens v `index.ts` kompletní (paleta + assety + fonty)
- [ ] Decorations.css ~700 řádků, 25 sekcí, scoped přes `[data-theme="ctyri-zivly"]`
- [ ] Google Fonts (MedievalSharp + Cardo + Pinyon Script) loaded v `index.html`
- [ ] 3 signature animace fungují (Quartered Aurora drift, Phoenix Ember orbit, Cardinal Pulse)
- [ ] Compass mandala v pravém panelu rotuje 90s (Q-3 A)
- [ ] ADMINISTRACE + default sekce + Compass (Q-1 A)
- [ ] Drop-cap "V" MedievalSharp gold-leaf (Q-2 A)
- [ ] Phoenix Ember square path orbit (Q-4 A)
- [ ] Dividery: chain mezi major + CSS-only mezi minor (Q-5 C)
- [ ] Reduced motion vypíná animace, zachovává estetiku
- [ ] Mobile responsive 320-1440px
- [ ] WCAG AAA pro text-pale na steel-deep
- [ ] `lint:colors` + `lint` + `typecheck` + `build` clean
- [ ] Žádná regrese na ostatních 20 skinech
- [ ] `docs/themes/ctyri-zivly.md` přepsáno per Pactum Quattuor
- [ ] Commit + PR draft

---

**Po schválení plánu** → exekuce per sekce 5 (krok #1–#14).
