# Plán 1.0g — Vesmírná loď visual upgrade

**Datum:** 2026-05-09
**Status:** ⏳ Čeká na schválení
**Spec:** `docs/arch/phase-1/spec-1.0g-vesmirna-lod-upgrade.md` ✅
**Audit:** Frontend-design audit 2026-05-09 — 6 doporučení zapracováno do specu před plánem
**Pořadí prací:** Pre-flight → `data-nav-key` edit → Asset gen + optimize → Tokens → Decorations → Test → Mobil-desktop sweep

---

## 0. Pre-flight checklist

### 0.1 Assety k vygenerování (uživatel mimo commit pipeline)

- [ ] `assets-source/themes/vesmirna-lod/icon-uvodnik.png` (256×256, transparent)
- [ ] `assets-source/themes/vesmirna-lod/icon-vytvorit-svet.png`
- [ ] `assets-source/themes/vesmirna-lod/icon-diskuze.png`
- [ ] `assets-source/themes/vesmirna-lod/icon-clanky.png`
- [ ] `assets-source/themes/vesmirna-lod/icon-galerie.png`
- [ ] `assets-source/themes/vesmirna-lod/icon-napoveda.png`
- [ ] `assets-source/themes/vesmirna-lod/icon-hospoda.png`

Prompty + style guide (60/30/10 ratio, amber max 1 spot per ikona, hospoda recolor) viz `public/themes/vesmirna-lod/decor/_asset-prompts.md`.

### 0.2 Assety k ZACHOVÁNÍ beze změny

- [x] `public/themes/backgrounds/vesmirna-lod.webp` — uživatel zakázal měnit
- [x] `public/themes/vesmirna-lod/decor/logo.webp` — uživatel zakázal měnit
- [x] `public/themes/vesmirna-lod/decor/andel-medallion.webp` — uživatel zakázal měnit

### 0.3 Verifikováno v kódu

- [x] `themes/themes/vesmirna-lod/{index.ts, decorations.css}` existují (baseline z předchozí iterace)
- [x] `IkarosLayout.tsx` `NavItem` **nemá** `data-nav-key` atribut → bude přidán v commitu #1
- [x] `optimize-theme-assets.mjs` umí decor target (po 1.0c rozšíření)
- [x] `IkarosCard`, `CornerOrnament`, `UserAvatar` — beze změn
- [x] `index.html` Google Fonts: Orbitron + Rajdhani existují (přidány v 1.0d) — vesmirna-lod je sdílí, žádný nový import

### 0.4 Akcepční podmínka regrese

Modré nebe + zlatý standard + sci-fi + bílá + 16 ostatních témat **vizuálně identické** s pre-1.0g stavem. Verifikace v `npm run dev` ručně + Themes/Gallery storybook.

### 0.5 Audit-derived constraints (musí dodržet implementace)

| # | Pravidlo | Kde se ověří |
|---|---|---|
| A1 | Andel medailon: jen 4 cyan rivet body, ŽÁDNÝ plný plate | `decorations.css` sekce 8 |
| A2 | Section title: chevron POUZE vlevo (`>>> NAV`), ne sandwich | `decorations.css` sekce 9 |
| A3 | Amber budget cap: max 2 amber výskyty per panel (corner BR + section title) | review CSS před commitem |
| A4 | Mobile: 2px amber left-edge stripe na cards zůstává na všech viewportech | `decorations.css` sekce 16 |
| A5 | Asset color ratio 60/30/10 (steel/cyan/amber), amber max 1 spot per ikona | review PNG před `themes:optimize` |
| A6 | Hospoda mug: pivo amber/zlato uvnitř, cyan glow jen na rim | review PNG před optimize |

---

## 1. Pořadí commitů

| # | Změna | Soubory | Commit |
|---|---|---|---|
| 1 | NavItem `data-nav-key` atribut (blocking — bez něho 7 assetů nejde napojit) | `src/app/layout/IkarosLayout/IkarosLayout.tsx` | `feat(layout): krok 1.0g #1 — data-nav-key atribut na NavItem (theme hook)` |
| 2 | 7× nav icon assetů (po user generation) | `assets-source/themes/vesmirna-lod/*.png` + `themes:optimize` → 7× webp | `chore(assets): krok 1.0g #2 — vesmirna-lod 7 nav icon webp` |
| 3 | Token model — cyan + amber dual-tone | `src/themes/themes/vesmirna-lod/index.ts` | `feat(themes): krok 1.0g #3 — vesmirna-lod luxury tokens (cyan + amber)` |
| 4 | Decorations CSS — corner plates, chamfered, stencil title, nav ikony, mobile stripe | `src/themes/themes/vesmirna-lod/decorations.css` | `feat(themes): krok 1.0g #4 — vesmirna-lod industrial hangár chrome` |

**Důležité pořadí:** #1 musí být PŘED #4 (CSS selector `[data-nav-key]` jinak nematchuje). #2 může být kdykoli mezi #1 a #4, ale prakticky doporučuji #2 → #3 → #4 (assety dostupné už při token přepisu).

---

## 2. Commit #1 — `data-nav-key` atribut

### 2.1 Edit `IkarosLayout.tsx`

**Diff:**

```diff
 type NavItemDef = {
+  key: string;
   label: string;
   to: string;
   icon: ReactNode;
   end?: boolean;
 };

 const PRIMARY_NAV: NavItemDef[] = [
-  { label: 'Úvodník',       to: '/',                      end: true, icon: <Home size={18} /> },
-  { label: 'Nápověda',      to: '/ikaros/napoveda',                  icon: <HelpCircle size={18} /> },
-  { label: 'Diskuze',       to: '/ikaros/diskuze',                   icon: <MessageSquare size={18} /> },
-  { label: 'Články',        to: '/ikaros/clanky',                    icon: <BookOpen size={18} /> },
-  { label: 'Galerie',       to: '/ikaros/galerie',                   icon: <ImageIcon size={18} /> },
-  { label: 'Vytvořit svět', to: '/ikaros/vytvorit-svet',             icon: <PlusCircle size={18} /> },
+  { key: 'uvodnik',       label: 'Úvodník',       to: '/',                      end: true, icon: <Home size={18} /> },
+  { key: 'napoveda',      label: 'Nápověda',      to: '/ikaros/napoveda',                  icon: <HelpCircle size={18} /> },
+  { key: 'diskuze',       label: 'Diskuze',       to: '/ikaros/diskuze',                   icon: <MessageSquare size={18} /> },
+  { key: 'clanky',        label: 'Články',        to: '/ikaros/clanky',                    icon: <BookOpen size={18} /> },
+  { key: 'galerie',       label: 'Galerie',       to: '/ikaros/galerie',                   icon: <ImageIcon size={18} /> },
+  { key: 'vytvorit-svet', label: 'Vytvořit svět', to: '/ikaros/vytvorit-svet',             icon: <PlusCircle size={18} /> },
 ];

-function NavItem({ to, end, icon, label, onClick }: NavItemDef & { onClick?: () => void }) {
+function NavItem({ key: _key, to, end, icon, label, onClick, navKey }: NavItemDef & { onClick?: () => void; navKey: string }) {
   return (
     <NavLink
       to={to}
       end={end}
+      data-nav-key={navKey}
       onClick={onClick}
       className={({ isActive }) => clsx(s.navItem, isActive && s.navItemActive)}
     >
       <span className={s.navItemIcon}>{icon}</span>
       <span className={s.navItemLabel}>{label}</span>
     </NavLink>
   );
 }
```

**Pozn.:** `key` je React reserved prop, takže se nedá rozprostřít přes `{...item}`. Řeším přejmenováním na `navKey` v render volání:

```diff
-          {PRIMARY_NAV.map((item) => (
-            <NavItem key={item.to} {...item} onClick={onNav} />
-          ))}
+          {PRIMARY_NAV.map((item) => (
+            <NavItem key={item.to} navKey={item.key} {...item} onClick={onNav} />
+          ))}
```

### 2.2 Edit Hospoda v `CHAT_ROOMS` mapě

```diff
           {CHAT_ROOMS.map((room, idx) => (
             <NavLink
               key={room.key}
               to={room.to}
+              data-nav-key={room.key}
               onClick={onNav}
               className={({ isActive }) => clsx(s.navItem, isActive && s.navItemActive)}
             >
```

### 2.3 Akcepční ověření

- [ ] V devtools `<a data-nav-key="uvodnik">` na 7 elementech (úvodník, nápověda, diskuze, články, galerie, vytvořit-svet, hospoda)
- [ ] Žádná regrese — všechna ostatní témata mají `data-nav-key` ignorovaný (selektor neexistuje v jejich CSS)
- [ ] TypeScript build prochází (`key` field povinný v `NavItemDef`)

---

## 3. Commit #2 — Asset optimize (po user generation)

```bash
npm run themes:optimize
```

Očekávaný output:
```
✓ vesmirna-lod/icon-uvodnik.png       → decor/icon-uvodnik.webp       (~XX KB)
✓ vesmirna-lod/icon-vytvorit-svet.png → decor/icon-vytvorit-svet.webp (~XX KB)
✓ vesmirna-lod/icon-diskuze.png       → decor/icon-diskuze.webp       (~XX KB)
✓ vesmirna-lod/icon-clanky.png        → decor/icon-clanky.webp        (~XX KB)
✓ vesmirna-lod/icon-galerie.png       → decor/icon-galerie.webp       (~XX KB)
✓ vesmirna-lod/icon-napoveda.png      → decor/icon-napoveda.webp      (~XX KB)
✓ vesmirna-lod/icon-hospoda.png       → decor/icon-hospoda.webp       (~XX KB)
```

Cílová velikost per ikona: <30 KB.

**Pre-commit gate (audit constraints A5, A6):**
- [ ] Vizuálně přerevidovat 7 PNG před optimize: dodržen 60/30/10 ratio, amber max 1 spot per ikona
- [ ] Hospoda mug: pivo amber, ne cyan; cyan glow jen na rimu/handle

Pokud některá ikona drift mimo style guide → re-roll v MJ než commit. Cena re-rollu (~5 minut) << cena slátaného setu.

---

## 4. Commit #3 — Token model `index.ts`

**Plný přepis** současných ~65 řádků na luxury verzi ~140 řádků. Pattern z 1.0d sci-fi, paleta cyan + amber.

```ts
import type { Theme } from '@/themes/types';

const decor = '/themes/vesmirna-lod/decor';

export const vesmirnaLodTheme: Theme = {
  id: 'vesmirna-lod',
  name: 'Vesmírná loď',
  scope: 'both',
  atmosphere: 'Vojenský hangár vesmírné lodi — cyan + amber dual-tone, plate-metal panely, industrial corner plates, rivety',
  vars: {
    // ── Luxury tokens (spec 1.0g) — cyan primary + amber accent ──

    '--theme-bg-overlay':
      'radial-gradient(circle at 18% 22%, rgba(0, 184, 232, 0.18) 0%, transparent 40%), ' +
      'radial-gradient(circle at 85% 80%, rgba(232, 160, 32, 0.14) 0%, transparent 35%), ' +
      'linear-gradient(180deg, rgba(4, 8, 14, 0.45) 0%, rgba(4, 8, 14, 0.65) 100%)',

    '--theme-surface':         'rgba(8, 16, 26, 0.82)',
    '--theme-surface-strong':  'rgba(4, 10, 18, 0.94)',
    '--theme-surface-soft':    'rgba(14, 28, 44, 0.55)',

    '--theme-border':          'rgba(0, 184, 232, 0.72)',
    '--theme-border-soft':     'rgba(0, 184, 232, 0.30)',
    '--theme-border-amber':    'rgba(232, 160, 32, 0.62)',
    '--theme-border-cyan':     'rgba(0, 184, 232, 0.55)',

    '--theme-text':         '#d6e6f2',
    '--theme-text-muted':   '#7a98ad',
    '--theme-heading':      '#5dd5ff',

    '--theme-accent':              '#00b8e8',
    '--theme-accent-bright':       '#5dd5ff',
    '--theme-accent-cyan':         '#00b8e8',
    '--theme-accent-amber':        '#e8a020',
    '--theme-accent-amber-bright': '#ffc24a',

    '--theme-glow-cyan':         'rgba(0, 184, 232, 0.45)',
    '--theme-glow-cyan-strong':  'rgba(0, 184, 232, 0.70)',
    '--theme-glow-amber':        'rgba(232, 160, 32, 0.42)',
    '--theme-glow-amber-strong': 'rgba(232, 160, 32, 0.65)',
    '--theme-glow-magenta':      'rgba(232, 160, 32, 0.42)', // alias amber → magenta token (kompat 1.0c CSS)
    '--theme-glow-gold':         'rgba(232, 160, 32, 0.42)',
    '--theme-shadow':            'rgba(0, 4, 8, 0.88)',

    '--theme-nav-hover-bg':   'rgba(0, 184, 232, 0.12)',
    '--theme-nav-active-bg':  'linear-gradient(90deg, rgba(0, 184, 232, 0.32) 0%, rgba(8, 22, 36, 0.55) 100%)',

    // ── Legacy tokeny (mapped na luxury) ──
    '--bg-primary':       '#040810',
    '--bg-secondary':     '#0a141e',
    '--bg-card':          'var(--theme-surface)',
    '--bg-card-hover':    'var(--theme-surface-soft)',
    '--accent':           'var(--theme-accent)',
    '--accent-bright':    'var(--theme-accent-bright)',
    '--accent-dim':       '#005878',
    '--accent-soft':      'var(--theme-border-soft)',
    '--text-primary':     'var(--theme-text)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       '#4d6878',
    '--border':           'var(--theme-border-soft)',
    '--border-subtle':    'rgba(0, 184, 232, 0.16)',
    '--border-strong':    'var(--theme-border)',
    '--success':          '#3ecf8e',
    '--success-soft':         'rgba(62, 207, 142, 0.12)',
    '--success-soft-border':  'rgba(62, 207, 142, 0.4)',
    '--warning':          '#e8a020',
    '--warning-soft':         'rgba(232, 160, 32, 0.12)',
    '--warning-soft-border':  'rgba(232, 160, 32, 0.4)',
    '--danger':           '#f06060',
    '--danger-soft':          'rgba(240, 96, 96, 0.12)',
    '--danger-soft-border':   'rgba(240, 96, 96, 0.4)',
    '--danger-focus-ring':    'rgba(240, 96, 96, 0.3)',
    '--info':             'var(--theme-accent)',
    '--text-on-accent':   '#04101a',
    '--text-on-danger':   '#050508',
    '--bg-overlay':       'rgba(4, 8, 14, 0.7)',

    // ── Typography ── (zachovat současné, jen přesné mapping)
    '--font-logo':    '"Orbitron", "Russo One", sans-serif',
    '--font-display': '"Rajdhani", "Exo 2", sans-serif',
    '--font-body':    '"Roboto Condensed", "Roboto", sans-serif',
    '--font-script':  '"Rajdhani", system-ui, sans-serif',

    // ── Layout chrome (slim header pattern) ──
    '--header-h':            '56px',
    '--header-bg':           '#040810',
    '--frame-pad-y':         '40px',
    '--frame-pad-x':         '18px',
    '--sidebar-w':           '280px',

    '--asset-logo-w':         '180px',
    '--asset-logo-w-mobile':  '150px',
    '--logo-img-display':     'block',
    '--logo-fallback-display':'none',

    // ── Existující assety (ZACHOVAT) ──
    '--asset-logo':            `url('${decor}/logo.webp')`,
    '--asset-andel-medallion': `url('${decor}/andel-medallion.webp')`,

    // ── Nové nav ikony (7) ──
    '--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
    '--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
    '--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
    '--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
    '--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
    '--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
    '--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,
  },
  fonts: {
    logo: 'Orbitron',
    display: 'Rajdhani',
    body: 'Roboto Condensed',
  },
  thumbnail: '/themes/thumbnails/vesmirna-lod.webp',
  background: '/themes/backgrounds/vesmirna-lod.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
```

---

## 5. Commit #4 — Decorations CSS

**Plný přepis** současných ~78 řádků na ~280 řádků. 17 sekcí dle spec 1.0g sekce 3.

### 5.1 Kostra (zkrácená, plný kód v commitu)

```css
/* ── Vesmírná loď — vojenský hangár (spec 1.0g + audit 1.0g)
   Cyan + amber dual-tone, plate-metal panely, asymmetric corner plates,
   chamfered topbar buttons, stencil section title, 7 nav icon assety.
   Scoped přes [data-theme="vesmirna-lod"]. */

[data-theme="vesmirna-lod"] {
  background-color: #040810;
}

/* 1. Atmosférický overlay */
[data-theme="vesmirna-lod"][data-shell="ikaros"]::before {
  content: '';
  position: fixed;
  inset: 0;
  background: var(--theme-bg-overlay);
  pointer-events: none;
  z-index: 0;
}

/* 2. Topbar — slim 56px, double-rule cyan + amber */
[data-theme="vesmirna-lod"][data-shell="ikaros"] > header {
  position: relative;
  border-bottom: 1px solid var(--theme-border-cyan);
}
[data-theme="vesmirna-lod"][data-shell="ikaros"] > header::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: -4px;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--theme-accent-amber) 20%, var(--theme-accent-amber) 80%, transparent 100%);
  opacity: 0.55;
  pointer-events: none;
  filter: drop-shadow(0 0 6px var(--theme-glow-amber));
}

/* 3. Logo banner — zachovat asset, cyan glow */
[data-theme="vesmirna-lod"] header [class*="logoImg"] {
  width: var(--asset-logo-w);
  height: calc(var(--header-h) - 12px);
  background-image: var(--asset-logo);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: left center;
  filter: drop-shadow(0 0 8px var(--theme-glow-cyan));
}

/* 4. Glass panely — plate-metal + chamfered TR + inner cyan glow */
[data-theme="vesmirna-lod"] [data-frame-panel="sidebar"],
[data-theme="vesmirna-lod"] [data-frame-panel="right"],
[data-theme="vesmirna-lod"] [data-frame-panel="card"],
[data-theme="vesmirna-lod"] [data-frame-panel="novinky"] {
  position: relative;
  background: linear-gradient(135deg, rgba(8, 22, 36, 0.85) 0%, rgba(4, 10, 18, 0.95) 100%);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid var(--theme-border);
  border-radius: 0;
  /* Chamfered TR roh — 14×14 ořez */
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%);
  isolation: isolate;
  box-shadow:
    inset 0 0 0 4px rgba(0, 184, 232, 0.10),
    0 5px 25px rgba(0, 4, 8, 0.7),
    inset 0 0 24px rgba(0, 184, 232, 0.06);
}

/* 5. Industrial corner plates — TL cyan, BR amber warning stripe */
[data-theme="vesmirna-lod"] [data-frame-panel="sidebar"]::before,
[data-theme="vesmirna-lod"] [data-frame-panel="right"]::before,
[data-theme="vesmirna-lod"] [data-frame-panel="card"]::before,
[data-theme="vesmirna-lod"] [data-frame-panel="novinky"]::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 36px; height: 24px;
  background:
    radial-gradient(circle at 18% 50%, var(--theme-accent-cyan) 0 2px, transparent 3px),
    radial-gradient(circle at 82% 50%, var(--theme-accent-cyan) 0 2px, transparent 3px),
    linear-gradient(135deg, rgba(20, 40, 60, 0.95), rgba(8, 22, 36, 0.95));
  border-right: 1px solid var(--theme-border-cyan);
  border-bottom: 1px solid var(--theme-border-cyan);
  filter: drop-shadow(0 0 4px var(--theme-glow-cyan));
  pointer-events: none;
  z-index: 3;
}
[data-theme="vesmirna-lod"] [data-frame-panel="sidebar"]::after,
[data-theme="vesmirna-lod"] [data-frame-panel="right"]::after,
[data-theme="vesmirna-lod"] [data-frame-panel="card"]::after,
[data-theme="vesmirna-lod"] [data-frame-panel="novinky"]::after {
  content: '';
  position: absolute;
  bottom: 0; right: 0;
  width: 36px; height: 24px;
  background:
    repeating-linear-gradient(45deg,
      var(--theme-accent-amber) 0 4px,
      #0a0e14 4px 8px);
  border-left: 1px solid var(--theme-border-amber);
  border-top: 1px solid var(--theme-border-amber);
  filter: drop-shadow(0 0 4px var(--theme-glow-amber));
  pointer-events: none;
  z-index: 3;
  opacity: 0.85;
}

/* 6. Rivety — reaktivace CornerOrnament markupu na malé cyan body, žádná animace */
[data-theme="vesmirna-lod"] [data-frame-panel] [class*="ornament"] {
  display: block;
  width: 6px; height: 6px;
  background: radial-gradient(circle, var(--theme-accent-cyan) 0%, transparent 70%);
  border: none;
  border-radius: 50%;
  filter: drop-shadow(0 0 3px var(--theme-glow-cyan));
  z-index: 5;
  pointer-events: none;
  opacity: 0.85;
  /* Pozn.: po prečtení A3 (amber budget cap) — žádné amber rivety, jen cyan */
}
[data-theme="vesmirna-lod"] [data-frame-panel] [class*="ornament"][data-position="tl"] { top: 6px; left: 6px; }
[data-theme="vesmirna-lod"] [data-frame-panel] [class*="ornament"][data-position="tr"] { top: 6px; right: 18px; }
[data-theme="vesmirna-lod"] [data-frame-panel] [class*="ornament"][data-position="bl"] { bottom: 6px; left: 6px; }
[data-theme="vesmirna-lod"] [data-frame-panel] [class*="ornament"][data-position="br"] { bottom: 6px; right: 6px; }

/* 7. Welcome card dominantní */
[data-theme="vesmirna-lod"] [data-frame-panel="card"] {
  min-height: 60vh;
}

/* 8. Andel medailon — minimální rivet frame (audit A1: ŽÁDNÝ plný plate) */
[data-theme="vesmirna-lod"] [data-andel-medallion] {
  position: relative;
  width: 240px;
  height: 240px;
  background-image: var(--asset-andel-medallion);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  flex-shrink: 0;
  filter: drop-shadow(0 0 18px var(--theme-glow-cyan));
}
/* 4 cyan rivet body v rozích slot containeru */
[data-theme="vesmirna-lod"] [data-andel-medallion]::before,
[data-theme="vesmirna-lod"] [data-andel-medallion]::after {
  content: '';
  position: absolute;
  width: 6px; height: 6px;
  background: radial-gradient(circle, var(--theme-accent-cyan) 0%, transparent 70%);
  filter: drop-shadow(0 0 3px var(--theme-glow-cyan));
  pointer-events: none;
}
[data-theme="vesmirna-lod"] [data-andel-medallion]::before { top: 4px; left: 4px; }
[data-theme="vesmirna-lod"] [data-andel-medallion]::after  { bottom: 4px; right: 4px; }
/* Dva další rivet body přes background-image radial gradients
   (TR + BL pozice) — abychom neporušili "max 2 pseudoelementy per element" */
[data-theme="vesmirna-lod"] [data-andel-medallion] {
  background-image:
    radial-gradient(circle at calc(100% - 7px) 7px, var(--theme-accent-cyan) 0 3px, transparent 4px),
    radial-gradient(circle at 7px calc(100% - 7px), var(--theme-accent-cyan) 0 3px, transparent 4px),
    var(--asset-andel-medallion);
  background-size: auto, auto, contain;
  background-repeat: no-repeat, no-repeat, no-repeat;
  background-position: top right, bottom left, center;
}

/* 9. Section title — amber stencil + chevron POUZE vlevo (audit A2) */
[data-theme="vesmirna-lod"] [class*="sectionTitle"] {
  color: var(--theme-accent-amber);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-family: var(--font-display);
  font-weight: 600;
  text-shadow: 0 0 6px var(--theme-glow-amber);
  position: relative;
  padding-left: 2.4em;
}
[data-theme="vesmirna-lod"] [class*="sectionTitle"]::before {
  content: '>>> ';
  position: absolute;
  left: 0;
  color: var(--theme-accent-amber);
  letter-spacing: 0;
}
[data-theme="vesmirna-lod"] [class*="sectionTitle"]::after {
  content: '';
  display: block;
  margin-top: 4px;
  height: 1px;
  background: linear-gradient(90deg, var(--theme-accent-cyan) 0%, transparent 100%);
  filter: drop-shadow(0 0 3px var(--theme-glow-cyan));
}

/* 10. NavItem (btn3d) — plate-metal, aktivní = cyan fill + amber 3px left rule */
[data-theme="vesmirna-lod"] [class*="btn3d"] {
  --btn-bg-1: rgba(10, 24, 38, 0.92);
  --btn-bg-2: rgba(4, 12, 22, 0.92);
  --btn-border: var(--theme-border-soft);
  --btn-color: var(--theme-text);
  --btn-shadow:
    inset 0 1px 0 0 rgba(0, 184, 232, 0.10),
    inset 0 -2px 4px 0 rgba(0, 4, 8, 0.85),
    0 2px 5px 0 rgba(0, 4, 8, 0.7);
}
[data-theme="vesmirna-lod"] [class*="btn3d"]:hover:not(:disabled):not([class*="btn3dDisabled"]) {
  --btn-bg-1: rgba(18, 42, 62, 0.95);
  --btn-bg-2: rgba(6, 20, 34, 0.98);
  --btn-border: var(--theme-accent);
  --btn-color: var(--theme-accent-bright);
  --btn-translate: -2px;
  --btn-shadow:
    inset 0 1px 0 0 rgba(0, 184, 232, 0.18),
    inset 0 -2px 4px 0 rgba(0, 4, 8, 0.85),
    0 0 14px var(--theme-glow-cyan),
    0 4px 7px 0 rgba(0, 4, 8, 0.7);
  text-shadow: 0 0 8px var(--theme-glow-cyan);
}
[data-theme="vesmirna-lod"] [class*="btn3dActive"],
[data-theme="vesmirna-lod"] [class*="navItemActive"] {
  --btn-bg-1: rgba(0, 184, 232, 0.32);
  --btn-bg-2: rgba(8, 22, 36, 0.55);
  --btn-border: var(--theme-accent);
  --btn-color: #ffffff;
  --btn-translate: 0;
  --btn-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.10),
    inset 0 -2px 4px 0 rgba(0, 4, 8, 0.55),
    inset 3px 0 0 0 var(--theme-accent-amber),       /* amber 3px left rule */
    0 0 16px var(--theme-glow-cyan);
  text-shadow: 0 0 10px var(--theme-glow-cyan-strong);
}

/* 11. Pravý panel kompakt (kopie sci-fi pattern) */
[data-theme="vesmirna-lod"] [data-frame-panel="right"] [class*="navItem"]:not([class*="navItemIcon"]):not([class*="navItemLabel"]),
[data-theme="vesmirna-lod"] [data-frame-panel="right"] [class*="showAllLink"] {
  padding: 6px 12px;
  font-size: var(--text-xs);
  letter-spacing: 0.04em;
}
[data-theme="vesmirna-lod"] [data-frame-panel="right"] [class*="sectionTitle"] {
  padding: var(--sp-1) var(--sp-2);
  font-size: 0.66rem;
}
[data-theme="vesmirna-lod"] [data-frame-panel="right"] [class*="rightPanelInner"],
[data-theme="vesmirna-lod"] [data-frame-panel="right"] [class*="navList"] {
  gap: 4px;
}

/* 12. Header buttons — chamfered 5-úhelník + uppercase */
[data-theme="vesmirna-lod"] [class*="headerBtn"] {
  letter-spacing: 0.14em;
  font-size: 0.72rem;
  padding: 6px 14px;
  min-height: 0;
  clip-path: polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px);
}
[data-theme="vesmirna-lod"] [class*="headerBtn"] [class*="avatar"] {
  width: 18px;
  height: 18px;
}

/* 13. PJ badge — cyan chip + amber inner ring */
[data-theme="vesmirna-lod"] [data-pj-badge] {
  background: linear-gradient(180deg, var(--theme-accent-bright), var(--theme-accent));
  color: var(--bg-primary);
  border: 1px solid var(--theme-accent);
  box-shadow:
    0 0 8px var(--theme-glow-cyan),
    inset 0 0 0 1px var(--theme-accent-amber),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.20);
  text-shadow: none;
}

/* 14. Welcome heading + signature */
[data-theme="vesmirna-lod"] [class*="titleAccent"] {
  text-shadow: 0 0 10px var(--theme-glow-cyan);
  border-bottom: 2px solid var(--theme-accent-amber);
  padding-bottom: 2px;
}
[data-theme="vesmirna-lod"] [class*="signature"] {
  font-family: 'Rajdhani', system-ui, sans-serif;
  font-weight: 300;
  font-style: italic;
  letter-spacing: 0.10em;
  color: var(--theme-accent-amber);
  font-size: 22px;
}
[data-theme="vesmirna-lod"] [class*="signature"]::after {
  content: '';
  display: inline-block;
  width: 60px;
  height: 6px;
  margin-left: 14px;
  vertical-align: middle;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 6'><rect x='0' y='1' width='9' height='4' fill='%23e8a020'/><rect x='14' y='1' width='9' height='4' fill='%23e8a020'/><rect x='28' y='1' width='9' height='4' fill='%23e8a020'/><rect x='42' y='1' width='9' height='4' fill='%23e8a020'/></svg>");
  background-size: contain;
  background-repeat: no-repeat;
  filter: drop-shadow(0 0 5px var(--theme-glow-amber));
}

/* 15. Nav ikony — 7 assetů přes data-nav-key */
[data-theme="vesmirna-lod"] [data-nav-key] [class*="navItemIcon"] {
  width: 22px;
  height: 22px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  filter: drop-shadow(0 0 4px var(--theme-glow-cyan));
}
[data-theme="vesmirna-lod"] [data-nav-key] [class*="navItemIcon"] svg {
  display: none; /* lucide ikona schovaná, místo ní webp */
}
[data-theme="vesmirna-lod"] [data-nav-key="uvodnik"]       [class*="navItemIcon"] { background-image: var(--asset-icon-uvodnik); }
[data-theme="vesmirna-lod"] [data-nav-key="vytvorit-svet"] [class*="navItemIcon"] { background-image: var(--asset-icon-vytvorit-svet); }
[data-theme="vesmirna-lod"] [data-nav-key="diskuze"]       [class*="navItemIcon"] { background-image: var(--asset-icon-diskuze); }
[data-theme="vesmirna-lod"] [data-nav-key="clanky"]        [class*="navItemIcon"] { background-image: var(--asset-icon-clanky); }
[data-theme="vesmirna-lod"] [data-nav-key="galerie"]       [class*="navItemIcon"] { background-image: var(--asset-icon-galerie); }
[data-theme="vesmirna-lod"] [data-nav-key="napoveda"]      [class*="navItemIcon"] { background-image: var(--asset-icon-napoveda); }
[data-theme="vesmirna-lod"] [data-nav-key="hospoda"]       [class*="navItemIcon"] { background-image: var(--asset-icon-hospoda); }

/* 16. Focus-visible — box-shadow ring (ne outline kvůli pseudoelementům) */
[data-theme="vesmirna-lod"] [class*="navItem"]:focus-visible,
[data-theme="vesmirna-lod"] [class*="headerBtn"]:focus-visible,
[data-theme="vesmirna-lod"] [class*="btn3d"]:focus-visible,
[data-theme="vesmirna-lod"] [class*="showAllLink"]:focus-visible,
[data-theme="vesmirna-lod"] [class*="rightAddBtn"]:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px var(--bg-primary),
    0 0 0 4px var(--theme-accent-cyan),
    0 0 14px var(--theme-glow-cyan-strong);
}

/* 17. Mobile (≤768px) — zjednodušení + KEEP-ON-MOBILE marker (audit A4) */
@media (max-width: 768px) {
  [data-theme="vesmirna-lod"] [data-frame-panel="sidebar"],
  [data-theme="vesmirna-lod"] [data-frame-panel="right"],
  [data-theme="vesmirna-lod"] [data-frame-panel="card"],
  [data-theme="vesmirna-lod"] [data-frame-panel="novinky"] {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    clip-path: none;                /* chamfery off */
    border-left: 2px solid var(--theme-accent-amber);  /* KEEP-ON-MOBILE identity marker */
    box-shadow:
      inset 0 0 0 1px rgba(0, 184, 232, 0.18),
      0 4px 14px rgba(0, 4, 8, 0.7);
  }
  [data-theme="vesmirna-lod"] [data-frame-panel]::before,
  [data-theme="vesmirna-lod"] [data-frame-panel]::after,
  [data-theme="vesmirna-lod"] [data-frame-panel] [class*="ornament"] {
    display: none;                  /* corner plates + rivety hidden */
  }
  [data-theme="vesmirna-lod"] [data-frame-panel="card"] {
    min-height: 0;                  /* welcome card auto height */
  }
  [data-theme="vesmirna-lod"] [data-andel-medallion] {
    width: 180px;
    height: 180px;
  }
  [data-theme="vesmirna-lod"] [class*="signature"] {
    font-size: 18px;
  }
  [data-theme="vesmirna-lod"] [class*="signature"]::after {
    display: none;
  }
  [data-theme="vesmirna-lod"] [class*="headerBtn"] {
    padding: 8px 10px;
    font-size: 0.7rem;
    clip-path: none;                /* chamfered buttons off na mobilu */
  }
}

/* 18. Reduced motion */
@media (prefers-reduced-motion: reduce) {
  [data-theme="vesmirna-lod"] * {
    animation: none !important;
    transition: none !important;
  }
}
```

### 5.2 Audit gates v kódu (review checklist)

- [ ] A1: `[data-andel-medallion]` má jen 4 cyan rivet body (2× `::before/::after` + 2× background-image radial), žádný plate background
- [ ] A2: `sectionTitle::before` = `'>>> '` jen vlevo, žádný `::after { content: ' <<<' }`
- [ ] A3: každý panel má amber jen v `::after` (BR plate) + amber ve `sectionTitle` color = 2 výskyty. Žádný amber rivet.
- [ ] A4: `@media (max-width: 768px)` má `border-left: 2px solid var(--theme-accent-amber)` na 4 panelech

---

## 6. Test plán

### 6.1 Manuální vizuální check

- [ ] `npm run dev`, ThemeSwitcher → **Vesmírná loď**
- [ ] Background = stávající hangár webp (nezměněno) ✅
- [ ] Logo banner ve slim 56px headeru, cyan glow ✅
- [ ] Header buttons chamfered 5-úhelník, uppercase, hover amber outline ✅
- [ ] Glass panely chamfered TR, plate-metal gradient, cyan border ✅
- [ ] TL corner plate cyan + 2 rivety; BR corner plate amber warning stripe — všechny 4 panely ✅
- [ ] CornerOrnament rivety → 4× malé cyan body (žádná animace) ✅
- [ ] Welcome card dominantní (≥ 60vh desktop) ✅
- [ ] Andel medailon: 4 cyan rivet body v rozích slot containeru, ŽÁDNÝ plate (audit A1) ✅
- [ ] Section title `>>> NAVIGACE` (chevron jen vlevo, audit A2), amber stencil + cyan rule pod ✅
- [ ] Aktivní Úvodník = cyan fill + amber 3px left rule + cyan glow ✅
- [ ] Pravý panel kompaktní jako sci-fi ✅
- [ ] PJ badge cyan chip + amber inner ring ✅
- [ ] Welcome heading "Projektu Ikaros." cyan glow + amber underline ✅
- [ ] Signature italic amber + 4× amber square end-marker ✅
- [ ] **7 nav ikon viditelné** přes `data-nav-key` (úvodník, vytvořit-svět, diskuze, články, galerie, nápověda, hospoda) ✅

### 6.2 Regrese ostatních témat

- [ ] **Modré nebe** — vizuálně identické s pre-1.0g
- [ ] **Zlatý standard** — vizuálně identické
- [ ] **Sci-fi** — vizuálně identické (pozor na sdílené `[data-frame-panel]::before` definice)
- [ ] **Bílá** — vizuálně identické
- [ ] 3 random další (hospoda/magie/postapo) — quick spot check
- [ ] Themes/Gallery storybook → All Themes

### 6.3 Mobil-desktop sweep (skill `mobil-desktop`)

- [ ] **375×667** (iPhone SE) — drawer, panely pod sebou, **2px amber left-edge stripe viditelný** (keep-on-mobile A4), corner plates skryté, andel 180×180, čitelný text
- [ ] **768×1024** (iPad) — tablet 2-sloupcový, corner plates ON
- [ ] **1440×900** (desktop) — full 3-sloupcový, vše ON, welcome card ≥ 60vh

### 6.4 Reduced motion

- [ ] DevTools → Rendering → Emulate `prefers-reduced-motion: reduce` → žádné animace, žádné transitions

### 6.5 Lint / build / tests / contrast

- [ ] `npm run lint`
- [ ] `npm run lint:colors`
- [ ] `npm run audit:contrast` — vesmirna-lod prochází WCAG AA
- [ ] `npm run test:run`
- [ ] `npm run build`

---

## 7. Po dokončení

- [ ] Roadmap-fe.md — přidat řádek **1.0g — Vesmírná loď visual upgrade ✅**
- [ ] Dluhy v `docs/dluhy.md` (pokud nějaké odhalí impl)
- [ ] Spec sekce 7 — odškrtnout schválení + impl checkboxy
- [ ] Pokud `data-nav-key` přístup chytí někdo v kód reviewu jako anti-pattern → diskutovat alternativu (např. `useMatch` hook + podmíněný `data-*`); akceptovat rollback opce před mergem

---

## 8. Risks / open

| # | Risk | Mitigace |
|---|---|---|
| R1 | `clip-path` chamfer zlikviduje `box-shadow` outer glow na panelech | Glow přes `filter: drop-shadow` na wrap containeru, NEBO akceptovat ztrátu outer glow (chamfer je vyšší priorita) |
| R2 | `data-nav-key` na NavLink = shared file edit; ostatní themes mohou neúmyslně chytit selektor | Selektory v 17 dalších themes nepoužívají `[data-nav-key]` → ověřeno; vesmirna-lod CSS scoped pod `[data-theme="vesmirna-lod"]` → izolace platí |
| R3 | 7 nav ikon nesoulad (MJ drift) | Style guide v `_asset-prompts.md` (60/30/10, amber max 1 spot); pre-commit gate review per ikona |
| R4 | Hospoda mug nečte se jako pivo | Recolor instrukce explicitní — pivo amber/zlato uvnitř, cyan jen na rim. Pokud MJ stále drift → re-roll s exaggerovaným "amber-golden beer" |
| R5 | Mobile keep-on-marker 2px amber left stripe → kolize s left-aligned sidebar drawer animací | Test na 375px viewport; pokud kolize, marker se přesune na top edge |
| R6 | `audit:contrast` cyan text na amber stripe | Stripe je 2px, nepřebíjí read flow textu; ověříme v 6.5 |
| R7 | `clip-path` chamfered buttons nemají hover outline (clip ořeže box-shadow rim) | Akceptujeme; focus-visible se renderuje přes `box-shadow` na wrap, ne outline |

---

## 9. Co NEDĚLÁM

- ❌ Edit shared komponent kromě `IkarosLayout.tsx` `NavItem` (commit #1, jediný justifikovaný — bez něho nelze napojit 7 ikon)
- ❌ Edit `IkarosCard`, `CornerOrnament`, `UserAvatar`, `IkarosLayout.module.css`, `DashboardPage.module.css`
- ❌ Globální `:root` tokeny
- ❌ Změna BE / API / typů / rout
- ❌ Animace (skin je staticky industriální)
- ❌ Tweaks ostatních 20 témat
- ❌ Změna background / logo / andel-medallion souborů (uživatel zakázal)
- ❌ Generation 7 PNG ikon — to dělá uživatel, plán jen popisuje pipeline po doručení

---

## 10. Schvalovací sekvence

1. ⏳ **PJ schvaluje plán** ← tady jsme
2. PJ vygeneruje 7 PNG dle `_asset-prompts.md`, drop do `assets-source/themes/vesmirna-lod/`
3. PJ řekne "GO" → spustím commits #1 → #4 v pořadí
4. Po každém commitu krátká vizuální zpětná vazba (zejm. po #4)
5. Test sekce 6 → fix/iterate → roadmap update
