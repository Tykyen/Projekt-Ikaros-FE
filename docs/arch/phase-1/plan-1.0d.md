# Plán 1.0d — Sci-fi visual upgrade

**Datum:** 2026-05-09
**Status:** ⏳ Čeká na schválení
**Spec:** `docs/arch/phase-1/spec-1.0d-sci-fi-upgrade.md` ✅
**Pořadí prací:** Pre-flight → Asset optimize → Tokens → Decorations → Google Fonts link → Test → Mobil-desktop sweep

---

## 0. Pre-flight checklist

### 0.1 Assety
- [x] `assets-source/themes/backgrounds/sci-fi.png` (2.4 MB, dropnut 2026-05-09 10:15)
- [x] `assets-source/themes/sci-fi/logo.png` (68 KB)
- [x] `assets-source/themes/sci-fi/andel-medallion.png` (81 KB, přejmenováno z `medaillon`)

### 0.2 Verifikováno v kódu
- [x] `themes/themes/sci-fi/{index.ts, decorations.css}` existují (baseline 1.0a)
- [x] `optimize-theme-assets.mjs` umí decor target (po 1.0c rozšíření)
- [x] `IkarosLayout.tsx`, `DashboardPage.tsx`, `IkarosCard`, `CornerOrnament`, `UserAvatar` — beze změn
- [x] `index.html` Google Fonts link existuje pro Cinzel + Lora + Great Vibes — přidat Orbitron + Rajdhani
- [x] `currentUserAtom`, `World.ownerId`, PJ badge logic z 1.0c stále univerzální

### 0.3 Akceptační podmínka regrese
- Modré nebe + zlatý standard + 18 ostatních témat **vizuálně beze změny**

---

## 1. Pořadí commitů

| # | Změna | Soubory | Commit |
|---|---|---|---|
| 1 | Asset optimize | (`themes:optimize` → 3× webp) | `chore(assets): krok 1.0d #1 — sci-fi background + logo + medailon` |
| 2 | Token model | `src/themes/themes/sci-fi/index.ts` | `feat(themes): krok 1.0d #2 — sci-fi luxury tokens (cyan + magenta dual-tone)` |
| 3 | Decorations CSS | `src/themes/themes/sci-fi/decorations.css` | `feat(themes): krok 1.0d #3 — sci-fi glass panely + HUD brackets + dual-tone ornaments` |
| 4 | Google Fonts link | `index.html` | `feat(fonts): krok 1.0d #4 — Orbitron + Rajdhani pro sci-fi` |

---

## 2. Asset optimize (commit #1)

```bash
npm run themes:optimize
```

Očekávaný output:
```
✓ sci-fi.png → sci-fi.webp (~XX KB)              # background, 1920×1080 q=80
✓ sci-fi/logo.png → decor/logo.webp (~XX KB)
✓ sci-fi/andel-medallion.png → decor/andel-medallion.webp (~XX KB)
```

Vygeneruje:
- `public/themes/backgrounds/sci-fi.webp` (přepíše stávající)
- `public/themes/sci-fi/decor/logo.webp` (nový)
- `public/themes/sci-fi/decor/andel-medallion.webp` (nový)

---

## 3. Token model — `src/themes/themes/sci-fi/index.ts` (commit #2)

**Plný přepis** z baseline (~50 řádků) na luxury verzi (~115 řádků). Pattern z 1.0c, paleta cyan/magenta.

```ts
import type { Theme } from '@/themes/types';

const decor = '/themes/sci-fi/decor';

export const sciFiTheme: Theme = {
  id: 'sci-fi',
  name: 'Sci-fi',
  scope: 'both',
  atmosphere: 'Futuristic command HUD — cyan + magenta neon, holographic glass panely, sci-fi typografie',
  vars: {
    // ──────────────────────────────────────────────
    // Luxury tokens (spec 1.0d) — cyan + magenta dual-tone
    // ──────────────────────────────────────────────

    // Background overlay — radial cyan + magenta ambient + linear darken
    '--theme-bg-overlay':
      'radial-gradient(circle at 22% 18%, rgba(22, 217, 255, 0.20) 0%, transparent 38%), ' +
      'radial-gradient(circle at 82% 76%, rgba(176, 38, 255, 0.16) 0%, transparent 32%), ' +
      'linear-gradient(180deg, rgba(2, 7, 17, 0.42) 0%, rgba(2, 7, 17, 0.62) 100%)',

    // Glass surfaces
    '--theme-surface':         'rgba(3, 12, 22, 0.78)',
    '--theme-surface-strong':  'rgba(2, 8, 16, 0.92)',
    '--theme-surface-soft':    'rgba(8, 28, 48, 0.55)',

    // Borders
    '--theme-border':          'rgba(22, 217, 255, 0.72)',
    '--theme-border-soft':     'rgba(22, 217, 255, 0.32)',
    '--theme-border-magenta':  'rgba(176, 38, 255, 0.55)',
    '--theme-border-cyan':     'rgba(22, 217, 255, 0.55)',  // alias pro 1.0c btn3d active

    // Text
    '--theme-text':         '#e8f6ff',
    '--theme-text-muted':   '#93aebe',
    '--theme-heading':      '#7eeaff',

    // Accents
    '--theme-accent':          '#16d9ff',
    '--theme-accent-bright':   '#7eeaff',
    '--theme-accent-cyan':     '#16d9ff',
    '--theme-accent-magenta':  '#b026ff',

    // Glow
    '--theme-glow-cyan':         'rgba(22, 217, 255, 0.42)',
    '--theme-glow-cyan-strong':  'rgba(22, 217, 255, 0.65)',
    '--theme-glow-magenta':      'rgba(176, 38, 255, 0.38)',
    '--theme-glow-gold':         'rgba(22, 217, 255, 0.42)',  // override gold = cyan v sci-fi
    '--theme-shadow':            'rgba(0, 0, 0, 0.85)',

    // Nav interactive
    '--theme-nav-hover-bg':   'rgba(22, 217, 255, 0.10)',
    '--theme-nav-active-bg':  'linear-gradient(90deg, rgba(22, 217, 255, 0.28) 0%, rgba(5, 18, 32, 0.55) 100%)',

    // ──────────────────────────────────────────────
    // Legacy tokeny — namapované na luxury
    // ──────────────────────────────────────────────

    '--bg-primary':       '#020711',
    '--bg-secondary':     '#04101e',
    '--bg-card':          'var(--theme-surface)',
    '--bg-card-hover':    'var(--theme-surface-soft)',
    '--accent':           'var(--theme-accent)',
    '--accent-bright':    'var(--theme-accent-bright)',
    '--accent-dim':       '#076b8f',
    '--accent-soft':      'var(--theme-border-soft)',
    '--text-primary':     'var(--theme-text)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       '#607888',
    '--border':           'var(--theme-border-soft)',
    '--border-subtle':    'rgba(22, 217, 255, 0.16)',
    '--border-strong':    'var(--theme-border)',
    '--success':          '#3ecf8e',
    '--success-soft':     'rgba(62, 207, 142, 0.12)',
    '--success-soft-border': 'rgba(62, 207, 142, 0.4)',
    '--warning':          '#f5a623',
    '--warning-soft':     'rgba(245, 166, 35, 0.12)',
    '--warning-soft-border': 'rgba(245, 166, 35, 0.4)',
    '--danger':           '#f06060',
    '--danger-soft':      'rgba(240, 96, 96, 0.12)',
    '--danger-soft-border': 'rgba(240, 96, 96, 0.4)',
    '--danger-focus-ring': 'rgba(240, 96, 96, 0.3)',
    '--info':             'var(--theme-accent)',
    '--text-on-accent':   '#04101a',
    '--text-on-danger':   '#050508',
    '--bg-overlay':       'rgba(0, 8, 16, 0.7)',

    // ── Typography ──
    '--font-logo':        '"Orbitron", "Rajdhani", system-ui, sans-serif',
    '--font-display':     '"Orbitron", "Rajdhani", system-ui, sans-serif',
    '--font-body':        '"Rajdhani", "Inter", system-ui, sans-serif',
    '--font-script':      '"Rajdhani", system-ui, sans-serif',

    // ── Layout chrome ──
    '--header-h':         '88px',
    '--header-bg':        '#020711',
    '--frame-pad-y':      '40px',
    '--frame-pad-x':      '18px',
    '--sidebar-w':        '280px',

    // ── Logo asset ──
    '--asset-logo':           `url('${decor}/logo.webp')`,
    '--asset-logo-w':         '260px',
    '--asset-logo-w-mobile':  '200px',
    '--logo-img-display':     'block',
    '--logo-fallback-display':'none',

    // ── Welcome andel medallion (PNG, varianta II) ──
    '--asset-andel-medallion': `url('${decor}/andel-medallion.webp')`,
  },
  fonts: {
    logo: 'Orbitron',
    display: 'Rajdhani',
    body: 'Inter',
  },
  thumbnail: '/themes/thumbnails/sci-fi.webp',
  background: '/themes/backgrounds/sci-fi.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
```

---

## 4. Decorations CSS — `src/themes/themes/sci-fi/decorations.css` (commit #3)

**Plný přepis.** ~150 řádků. Struktura:

```css
/* ── Sci-fi — futuristic command HUD (spec 1.0d)
   Aktivuje se přes [data-theme="sci-fi"]. UI je CSS-native:
   holografické glass panely, HUD bracket rohy, cyan + magenta dual-tone,
   sci-fi typografie, žádné zlato. */

[data-theme="sci-fi"] {
  background-color: #020711;
}

/* ── 1. Atmosférický overlay ── */
[data-theme="sci-fi"][data-shell="ikaros"]::before {
  content: '';
  position: fixed;
  inset: 0;
  background: var(--theme-bg-overlay);
  pointer-events: none;
  z-index: 0;
}

/* ── 2. Glass panely + HUD brackets ── */
[data-theme="sci-fi"] [data-frame-panel="sidebar"],
[data-theme="sci-fi"] [data-frame-panel="right"],
[data-theme="sci-fi"] [data-frame-panel="card"],
[data-theme="sci-fi"] [data-frame-panel="novinky"] {
  position: relative;
  background: linear-gradient(135deg, rgba(6, 15, 30, 0.85) 0%, rgba(2, 6, 12, 0.95) 100%);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid var(--theme-border);
  border-radius: 4px;
  isolation: isolate;
  box-shadow:
    0 5px 25px rgba(0, 0, 0, 0.8),
    inset 0 0 24px rgba(22, 217, 255, 0.06);
}

/* HUD brackets — top-left + bottom-right rohy */
[data-theme="sci-fi"] [data-frame-panel="sidebar"]::before,
[data-theme="sci-fi"] [data-frame-panel="right"]::before,
[data-theme="sci-fi"] [data-frame-panel="card"]::before,
[data-theme="sci-fi"] [data-frame-panel="novinky"]::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  width: 30px;
  height: 30px;
  border-top: 2px solid var(--theme-accent-cyan);
  border-left: 2px solid var(--theme-accent-cyan);
  filter: drop-shadow(0 0 6px var(--theme-glow-cyan));
  pointer-events: none;
  z-index: 3;
}
[data-theme="sci-fi"] [data-frame-panel="sidebar"]::after,
[data-theme="sci-fi"] [data-frame-panel="right"]::after,
[data-theme="sci-fi"] [data-frame-panel="card"]::after,
[data-theme="sci-fi"] [data-frame-panel="novinky"]::after {
  content: '';
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 30px;
  height: 30px;
  border-bottom: 2px solid var(--theme-accent-cyan);
  border-right: 2px solid var(--theme-accent-cyan);
  filter: drop-shadow(0 0 6px var(--theme-glow-cyan));
  pointer-events: none;
  z-index: 3;
}

/* ── 3. CornerOrnament dual-tone — TL/BR cyan, TR/BL magenta ── */
[data-theme="sci-fi"] [class*="ornament"] {
  background: var(--theme-accent-cyan);
  border: 1px solid var(--theme-accent-cyan);
  filter: drop-shadow(0 0 8px var(--theme-glow-cyan));
}
[data-theme="sci-fi"] [class*="ornament"][data-position="tr"],
[data-theme="sci-fi"] [class*="ornament"][data-position="bl"] {
  background: var(--theme-accent-magenta);
  border-color: var(--theme-accent-magenta);
  filter: drop-shadow(0 0 8px var(--theme-glow-magenta));
}

/* ── 4. Welcome andel medallion (PNG sci-fi anděl) ── */
[data-theme="sci-fi"] [data-andel-medallion] {
  position: relative;
  width: 200px;
  height: 215px;
  background-image: var(--asset-andel-medallion, none);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  flex-shrink: 0;
  filter: drop-shadow(0 0 18px var(--theme-glow-cyan));
}
[data-theme="sci-fi"] [data-andel-medallion]::before,
[data-theme="sci-fi"] [data-andel-medallion]::after {
  content: '';
  position: absolute;
  left: 50%;
  width: 12px;
  height: 12px;
  background: var(--theme-accent-cyan);
  transform: translateX(-50%) rotate(45deg);
  box-shadow: 0 0 10px 2px var(--theme-glow-cyan);
}
[data-theme="sci-fi"] [data-andel-medallion]::before { top: -7px; }
[data-theme="sci-fi"] [data-andel-medallion]::after  { bottom: -7px; }

/* ── 5. Section title — cyan gradient line, žádné ◆ diamondy ── */
[data-theme="sci-fi"] [class*="sectionTitle"] {
  color: var(--theme-heading);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-family: var(--font-display);
  text-shadow: 0 0 10px var(--theme-glow-cyan);
}
/* Base CSS [class*="sectionTitle"]::before/::after = gradient line s var(--theme-accent), což je v sci-fi cyan → automaticky funguje */

/* ── 6. Header logo banner ── */
[data-theme="sci-fi"] header [class*="logoImg"] {
  width: var(--asset-logo-w);
  height: var(--header-h);
  background-image: var(--asset-logo);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: left center;
  filter: drop-shadow(0 0 12px var(--theme-glow-cyan));
  -webkit-mask-image: radial-gradient(ellipse 95% 85% at center, black 60%, transparent 100%);
  mask-image: radial-gradient(ellipse 95% 85% at center, black 60%, transparent 100%);
}

/* ── 7. 3D btn3d override (header + nav + showAllLink) ── */
[data-theme="sci-fi"] [class*="btn3d"] {
  --btn-bg-1: rgba(8, 22, 36, 0.92);
  --btn-bg-2: rgba(3, 10, 18, 0.92);
  --btn-border: var(--theme-border-soft);
  --btn-color: var(--theme-text);
  --btn-shadow:
    inset 0 1px 0 0 rgba(22, 217, 255, 0.12),
    inset 0 -2px 4px 0 rgba(0, 0, 0, 0.85),
    0 2px 5px 0 rgba(0, 0, 0, 0.7);
}
[data-theme="sci-fi"] [class*="btn3d"]:hover:not(:disabled):not([class*="btn3dDisabled"]) {
  --btn-bg-1: rgba(15, 40, 60, 0.95);
  --btn-bg-2: rgba(5, 18, 32, 0.98);
  --btn-border: var(--theme-accent);
  --btn-color: var(--theme-accent-bright);
  --btn-translate: -2px;
  --btn-shadow:
    inset 0 1px 0 0 rgba(22, 217, 255, 0.20),
    inset 0 -2px 4px 0 rgba(0, 0, 0, 0.85),
    0 0 14px var(--theme-glow-cyan),
    0 4px 7px 0 rgba(0, 0, 0, 0.7);
  text-shadow: 0 0 8px var(--theme-glow-cyan);
}
[data-theme="sci-fi"] [class*="btn3dActive"],
[data-theme="sci-fi"] [class*="navItemActive"] {
  --btn-bg-1: rgba(22, 217, 255, 0.28);
  --btn-bg-2: rgba(5, 18, 32, 0.55);
  --btn-border: var(--theme-accent);
  --btn-color: #ffffff;
  --btn-translate: 0;
  --btn-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.10),
    inset 0 -2px 4px 0 rgba(0, 0, 0, 0.55),
    inset 3px 0 0 0 var(--theme-accent),
    0 0 16px var(--theme-glow-cyan);
  text-shadow: 0 0 10px var(--theme-glow-cyan-strong);
}

/* Header buttons — drobné jemnější padding + uppercase */
[data-theme="sci-fi"] [class*="headerBtn"] {
  letter-spacing: 0.14em;
  font-size: 0.72rem;
}

/* ── 8. PJ badge — cyan chip ── */
[data-theme="sci-fi"] [data-pj-badge] {
  background: linear-gradient(180deg, var(--theme-accent-bright), var(--theme-accent));
  color: var(--bg-primary);
  border: 1px solid var(--theme-accent);
  box-shadow:
    0 0 8px var(--theme-glow-cyan),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.25);
  text-shadow: none;
}

/* ── 9. Welcome heading — cyan glow na .titleAccent (scoped) ── */
[data-theme="sci-fi"] [class*="titleAccent"] {
  text-shadow: 0 0 10px var(--theme-glow-cyan);
}

/* ── 10. Reduced motion safe ── */
@media (prefers-reduced-motion: reduce) {
  [data-theme="sci-fi"] * {
    transition: none !important;
  }
}
```

**Pozn. k bracket-rohům:** používám `top: -2px; left: -2px` (offset přes border) aby svorky vyčuhovaly přes hranu panelu — to dělá HUD efekt. Box-shadow na panelu je `inset` dovnitř + drop ven → svorky drop-shadow přidá outer glow.

**Pozn. k anděl medailonu:** uživatel poslal PNG → použiju ho. Cyan/magenta diamondy nahoře/dole z 1.0c pattern (jen barvy cyan).

---

## 5. Google Fonts — `index.html` (commit #4)

**Jediná globální change v 1.0d.** Přidat Orbitron + Rajdhani do existujícího `<link>`:

```diff
     <link
       rel="stylesheet"
-      href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;500;600;700&family=Great+Vibes&family=Lora:ital,wght@0,400;0,700;1,400&display=swap"
+      href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;500;600;700&family=Great+Vibes&family=Lora:ital,wght@0,400;0,700;1,400&family=Orbitron:wght@400;500;600;700&family=Rajdhani:wght@400;500;600;700&display=swap"
     />
```

Načte se ~30 KB navíc pro celou apku. Ostatní témata fonty nepoužijí — overhead akceptován (alternativa = runtime JS injekce, complexity > benefit).

---

## 6. Test plán

### 6.1 Manuální vizuální check
- [ ] `npm run dev`, přepnout ThemeSwitcher na **Sci-fi**
- [ ] Background = nový kosmický city ✅
- [ ] Glass panely se 4px radius + HUD brackets v levém-horním + pravém-dolním rohu, cyan glow ✅
- [ ] CornerOrnament dual-tone — TL/BR cyan, TR/BL magenta ✅
- [ ] Welcome andel medailon (sci-fi PNG) + cyan diamondy nahoře/dole ✅
- [ ] „Projektu Ikaros." cyan + glow ✅
- [ ] Section title bez `◆`, jen cyan gradient line + cyan text-shadow ✅
- [ ] Aktivní Úvodník = full cyan gradient + glow + 3px left bar ✅
- [ ] Header logo banner sci-fi varianta ✅
- [ ] Header buttons cyan border, hover cyan glow ✅
- [ ] PJ badge cyan chip ✅
- [ ] Fonty Orbitron (logo, nadpisy) + Rajdhani (display, body) ✅

### 6.2 Regrese ostatních témat
- [ ] **Modré nebe** — vizuálně identické s pre-1.0d
- [ ] **Zlatý standard** — vizuálně identické s post-1.0c
- [ ] **Hospoda, magie, postapo** — quick spot check (3 random)
- [ ] Storybook gallery: Themes/Gallery → All Themes

### 6.3 Mobil-desktop sweep (`mobil-desktop` skill)
- [ ] 375×667 (iPhone SE) — drawer, panely pod sebou, HUD brackets viditelné, čitelný text, PJ badge nepřetéká
- [ ] 768×1024 (iPad) — 2-sloupcový
- [ ] 1440×900 (desktop) — full 3-sloupcový

### 6.4 Lint / build / tests / contrast
- [ ] `npm run lint`
- [ ] `npm run lint:colors`
- [ ] `npm run audit:contrast` (sci-fi musí stále projít WCAG AA)
- [ ] `npm run test:run` (140 testů)
- [ ] `npm run build`

---

## 7. Po dokončení

- [ ] Roadmap-fe.md — přidat řádek **1.0d — Sci-fi visual upgrade ✅**
- [ ] Případné dluhy v `docs/dluhy.md`
- [ ] Pokud po vizuální kontrole user řekne, že magenta je moc křiklavá → fallback patch (3 řádky CSS — zrušit `data-position="tr|bl"` override)

---

## 8. Risks / open

| # | Risk | Mitigace |
|---|---|---|
| R1 | `backdrop-filter: blur(10px)` na 4 panelech | Stejné jako 1.0c — degraduje gracefully |
| R2 | Google Fonts overhead pro všechna témata | Akcept; jediná globální change |
| R3 | HUD brackets `::before/::after` na `[data-frame-panel]` přebijí CornerOrnament? | Ne — CornerOrnament je `<span>` element s vlastními `::before/::after` možnostmi nepoužitými; oba systémy koexistují |
| R4 | `data-position="tr"` magenta override matchuje **všechny** ornamenty v sci-fi | Akcept — všechny sci-fi panely mají dual-tone, konzistence design |
| R5 | Sci-fi welcome anděl PNG nemusí ladit s cyan/magenta paletou (záleží na tom, co user poslal) | Pokud nesedí, doladíme `filter: hue-rotate()` nebo požádám o jiný PNG |
| R6 | `audit:contrast` může selhat pro cyan text na cyan glow background | Ověřím v 6.4 |

---

## 9. Co NEDĚLÁM

- ❌ Edit shared komponent (`IkarosCard`, `CornerOrnament`, `UserAvatar`, `IkarosLayout`)
- ❌ Edit globálních CSS modulů (`IkarosLayout.module.css`, `DashboardPage.module.css`)
- ❌ Globální `:root` tokeny (vše per-theme)
- ❌ Změna BE / API / typů / rout
- ❌ Animace
- ❌ Tweaks ostatních 20 témat

---

**Schválení:** ⏳ Čeká na PJ. Po souhlasu spustím commits #1 → #4 v pořadí.
