# Theme System — Iterace B: Zbylých 18 témat + visual regression + a11y audit

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementovat zbývajících 18 platformových témat (`sci-fi`, `vesmirna-lod`, `priroda`, `pergamen`, `nemrtvi`, `ctyri-zivly`, `vesmirna-bitva`, `hospoda`, `severske-runy`, `indiane`, `africke`, `arabsky-svet`, `kyberpunk`, `postapo`, `magie`, `mesic`, `slunce`, `zlaty-standard`), přidat visual regression testing přes Storybook + axe a provést WCAG AA contrast audit pro všech 21 témat. Po dokončení = fáze 1.0 kompletně uzavřena.

**Architecture:** Šablona z Iterace A (bila / temna-cerven). Pro každé téma vznikne `src/themes/themes/<id>/index.ts` s paletou + `decorations.css` s ornamenty/animacemi. Registry agreguje všechny themes. Visual regression využívá Storybook `addon-test` (už nainstalován). Accessibility audit ověřuje kontrast každé palety vůči WCAG AA contrast 4.5:1 pro tělo textu.

**Tech Stack:** TypeScript, CSS modules, Vitest + jsdom, Storybook 10 + addon-a11y + addon-test, axe-core (přes addon-a11y).

**Spec:** [docs/superpowers/specs/2026-05-07-theme-system-design.md](../specs/2026-05-07-theme-system-design.md) §11 Iterace B
**Předchozí plán:** [Iterace A](2026-05-07-theme-system-iterace-a.md)

---

## Předpoklady před spuštěním

- Iterace A merged do `main` (nebo branch `feat/theme-system-iterace-a` mergnutý)
- 21 background WebP v `public/themes/backgrounds/<id>.webp` (vygenerováno Iterace A Task 17)
- 21 thumbnail WebP v `public/themes/thumbnails/<id>.webp` (dtto)
- 35+ unit testů z Iterace A passující
- Branch: vytvoř `feat/theme-system-iterace-b` na začátku

```bash
git checkout main
git pull
git checkout -b feat/theme-system-iterace-b
```

---

## File Structure

```
src/themes/themes/
├── modre-nebe/        (existuje z Iterace A)
├── bila/              (existuje z Iterace A)
├── temna-cerven/      (existuje z Iterace A)
├── sci-fi/                 ← NOVÉ
│   ├── index.ts
│   └── decorations.css
├── vesmirna-lod/           ← NOVÉ
├── priroda/                ← NOVÉ
├── pergamen/               ← NOVÉ
├── nemrtvi/                ← NOVÉ
├── ctyri-zivly/            ← NOVÉ
├── vesmirna-bitva/         ← NOVÉ
├── hospoda/                ← NOVÉ
├── severske-runy/          ← NOVÉ
├── indiane/                ← NOVÉ
├── africke/                ← NOVÉ
├── arabsky-svet/           ← NOVÉ
├── kyberpunk/              ← NOVÉ
├── postapo/                ← NOVÉ
├── magie/                  ← NOVÉ
├── mesic/                  ← NOVÉ
├── slunce/                 ← NOVÉ
└── zlaty-standard/         ← NOVÉ

scripts/
└── audit-theme-contrast.mjs  ← NOVÉ (WCAG AA check)

src/themes/__tests__/
└── (existing tests + visual regression artifacts)
```

**Modifikované:**
- `src/themes/registry.ts` — registrace 18 nových témat
- `package.json` — `audit:contrast` skript

---

## Společný template (referenční — neopisovat doslovně, používá se ad-hoc per téma)

Každý theme `index.ts` používá tento tvar (s paletou specifickou per téma):

```ts
import type { Theme } from '../../types';

export const xxxTheme: Theme = {
  id: '<id>',
  name: '<UI název>',
  scope: 'both',
  atmosphere: '<krátký popis pro tooltip>',
  vars: {
    // ── REQUIRED tokens (validuje registry.test.ts) ──
    '--bg-primary':       '#...',
    '--bg-secondary':     '#...',
    '--bg-card':          '#...',
    '--bg-card-hover':    '#...',
    '--accent':           '#...',
    '--accent-bright':    '#...',
    '--accent-dim':       '#...',
    '--accent-soft':      'rgba(...)',
    '--text-primary':     '#...',
    '--text-secondary':   '#...',
    '--text-muted':       '#...',
    '--border':           '#...',
    '--border-subtle':    '#...',
    '--border-strong':    '#...',
    '--success':          '#...',
    '--warning':          '#...',
    '--danger':           '#...',
    '--info':             '#...',
    // ── Sémantické tokeny (zavedeny v Iterace A Task 30b) ──
    '--text-on-accent':       '#ffffff',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(0,0,0,0.6)',
    '--success-soft':         'rgba(...)',
    '--success-soft-border':  'rgba(...)',
    '--warning-soft':         'rgba(...)',
    '--warning-soft-border':  'rgba(...)',
    '--danger-soft':          'rgba(...)',
    '--danger-soft-border':   'rgba(...)',
    '--danger-focus-ring':    'rgba(...)',
    // ── Font fallback chains ──
    '--font-logo':        '"...", "Cinzel", Georgia, serif',
    '--font-display':     '"...", Georgia, serif',
    '--font-body':        '"Lora", Georgia, serif',
  },
  fonts: {
    logo: '...',
    display: '...',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/<id>.webp',
  background: '/themes/backgrounds/<id>.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe' | 'heavy',
};
```

**Sémantické tokeny** (`--text-on-accent`, `--bg-overlay`, `--success-soft`, atd.) zavedené v Iterace A Task 30b — **každé téma musí mít stejnou sadu**. Jejich konkrétní hodnoty per téma najdeš v každém Task konkrétně.

**Decorations.css** baseline pro každé téma (rozšířit dle `docs/themes/<id>.md`):

```css
/* ── <Téma jméno> — dekorativní vrstva ── */

[data-theme="<id>"] {
  /* Fallback gradient (když background image chybí — pro safety) */
  background-image:
    radial-gradient(ellipse at 50% 0%, rgba(<accent-rgb>, 0.15) 0%, transparent 60%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

/* (Theme-specific decorations dle docs/themes/<id>.md) */
```

---

# M11: Implementace 6 témat — Batch 1

## Task B-1: Sci-fi téma

**Files:**
- Create: `src/themes/themes/sci-fi/index.ts`
- Create: `src/themes/themes/sci-fi/decorations.css`

**Source of truth:** [docs/themes/sci-fi.md](../../themes/sci-fi.md)

- [ ] **Step 1: Create `src/themes/themes/sci-fi/index.ts`**

```ts
import type { Theme } from '../../types';

export const sciFiTheme: Theme = {
  id: 'sci-fi',
  name: 'Sci-fi',
  scope: 'both',
  atmosphere: 'Civilní vesmírná stanice — cyan + magenta neon',
  vars: {
    '--bg-primary':       '#080c14',
    '--bg-secondary':     '#0c1220',
    '--bg-card':          '#0f1628',
    '--bg-card-hover':    '#141e32',
    '--accent':           '#00c8ff',
    '--accent-bright':    '#40d8ff',
    '--accent-dim':       '#006888',
    '--accent-soft':      'rgba(0, 200, 255, 0.15)',
    '--text-primary':     '#d0e8ff',
    '--text-secondary':   '#5090b0',
    '--text-muted':       '#2a4060',
    '--border':           '#0f2030',
    '--border-subtle':    '#0a1820',
    '--border-strong':    '#00c8ff',
    '--success':          '#3ecf8e',
    '--warning':          '#f5a623',
    '--danger':           '#f06060',
    '--info':             '#00c8ff',
    '--text-on-accent':       '#04101a',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(0, 8, 16, 0.7)',
    '--success-soft':         'rgba(62, 207, 142, 0.12)',
    '--success-soft-border':  'rgba(62, 207, 142, 0.4)',
    '--warning-soft':         'rgba(245, 166, 35, 0.12)',
    '--warning-soft-border':  'rgba(245, 166, 35, 0.4)',
    '--danger-soft':          'rgba(240, 96, 96, 0.12)',
    '--danger-soft-border':   'rgba(240, 96, 96, 0.4)',
    '--danger-focus-ring':    'rgba(240, 96, 96, 0.3)',
    '--font-logo':        '"Orbitron", "Exo 2", sans-serif',
    '--font-display':     '"Rajdhani", "Exo 2", sans-serif',
    '--font-body':        '"Inter", "Roboto", sans-serif',
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

- [ ] **Step 2: Create `src/themes/themes/sci-fi/decorations.css`**

```css
/* ── Sci-fi — civilní stanice, chamfered HUD ── */

[data-theme="sci-fi"] {
  background-image:
    radial-gradient(ellipse at 50% 0%, rgba(0, 200, 255, 0.12) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 100%, rgba(192, 32, 224, 0.08) 0%, transparent 60%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

/* Chamfered (zkosené) rohy panelů a tlačítek */
[data-theme="sci-fi"] .card,
[data-theme="sci-fi"] [class*="card"],
[data-theme="sci-fi"] button {
  clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  border-radius: 0;
}

/* Scan-line efekt na panelech (CRT feel) */
[data-theme="sci-fi"] .card::before,
[data-theme="sci-fi"] [class*="card"]::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 3px,
    rgba(0, 200, 255, 0.03) 3px,
    rgba(0, 200, 255, 0.03) 4px
  );
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  [data-theme="sci-fi"] button:hover {
    box-shadow: 0 0 15px rgba(0, 200, 255, 0.6);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/sci-fi/
git commit -m "feat(themes): add sci-fi theme"
```

---

## Task B-2: Vesmírná loď téma

**Files:**
- Create: `src/themes/themes/vesmirna-lod/index.ts`
- Create: `src/themes/themes/vesmirna-lod/decorations.css`

**Source of truth:** [docs/themes/vesmirna-lod.md](../../themes/vesmirna-lod.md)

- [ ] **Step 1: Create `src/themes/themes/vesmirna-lod/index.ts`**

```ts
import type { Theme } from '../../types';

export const vesmirnaLodTheme: Theme = {
  id: 'vesmirna-lod',
  name: 'Vesmírná loď',
  scope: 'both',
  atmosphere: 'Vojenský hangár vesmírné lodi — cyan + amber, L-bracket HUD',
  vars: {
    '--bg-primary':       '#080b10',
    '--bg-secondary':     '#0c1018',
    '--bg-card':          '#101520',
    '--bg-card-hover':    '#151c28',
    '--accent':           '#00b8e8',
    '--accent-bright':    '#30d0ff',
    '--accent-dim':       '#005878',
    '--accent-soft':      'rgba(0, 184, 232, 0.15)',
    '--text-primary':     '#c8d8e8',
    '--text-secondary':   '#4878a0',
    '--text-muted':       '#283848',
    '--border':           '#0f1820',
    '--border-subtle':    '#0a131a',
    '--border-strong':    '#00b8e8',
    '--success':          '#3ecf8e',
    '--warning':          '#e8a020',
    '--danger':           '#f06060',
    '--info':             '#00b8e8',
    '--text-on-accent':       '#04101a',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(0, 6, 12, 0.7)',
    '--success-soft':         'rgba(62, 207, 142, 0.12)',
    '--success-soft-border':  'rgba(62, 207, 142, 0.4)',
    '--warning-soft':         'rgba(232, 160, 32, 0.12)',
    '--warning-soft-border':  'rgba(232, 160, 32, 0.4)',
    '--danger-soft':          'rgba(240, 96, 96, 0.12)',
    '--danger-soft-border':   'rgba(240, 96, 96, 0.4)',
    '--danger-focus-ring':    'rgba(240, 96, 96, 0.3)',
    '--font-logo':        '"Orbitron", "Russo One", sans-serif',
    '--font-display':     '"Rajdhani", "Exo 2", sans-serif',
    '--font-body':        '"Roboto Condensed", "Roboto", sans-serif',
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

- [ ] **Step 2: Create `src/themes/themes/vesmirna-lod/decorations.css`**

```css
/* ── Vesmírná loď — vojenský hangár, L-bracket rohy ── */

[data-theme="vesmirna-lod"] {
  background-image:
    radial-gradient(ellipse at 50% 0%, rgba(0, 184, 232, 0.10) 0%, transparent 50%),
    radial-gradient(ellipse at 90% 100%, rgba(232, 160, 32, 0.06) 0%, transparent 50%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

/* Žádné zaoblené rohy globálně */
[data-theme="vesmirna-lod"] .card,
[data-theme="vesmirna-lod"] [class*="card"],
[data-theme="vesmirna-lod"] button {
  border-radius: 0;
}

/* L-bracket rohy na panelech */
[data-theme="vesmirna-lod"] .card,
[data-theme="vesmirna-lod"] [class*="card"] {
  position: relative;
}
[data-theme="vesmirna-lod"] .card::before,
[data-theme="vesmirna-lod"] [class*="card"]::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 12px;
  height: 12px;
  border-top: 2px solid var(--accent);
  border-left: 2px solid var(--accent);
  pointer-events: none;
}
[data-theme="vesmirna-lod"] .card::after,
[data-theme="vesmirna-lod"] [class*="card"]::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-bottom: 2px solid var(--accent);
  border-right: 2px solid var(--accent);
  pointer-events: none;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/vesmirna-lod/
git commit -m "feat(themes): add vesmirna-lod theme"
```

---

## Task B-3: Příroda téma

**Files:**
- Create: `src/themes/themes/priroda/index.ts`
- Create: `src/themes/themes/priroda/decorations.css`

**Source of truth:** [docs/themes/priroda.md](../../themes/priroda.md)

- [ ] **Step 1: Create `src/themes/themes/priroda/index.ts`**

```ts
import type { Theme } from '../../types';

export const prirodaTheme: Theme = {
  id: 'priroda',
  name: 'Příroda',
  scope: 'both',
  atmosphere: 'Zakletý les — dřevo, smaragdové krystaly, sluneční paprsky',
  vars: {
    '--bg-primary':       '#1a1208',
    '--bg-secondary':     '#231a0a',
    '--bg-card':          '#2a1e0c',
    '--bg-card-hover':    '#332510',
    '--accent':           '#4a8a30',
    '--accent-bright':    '#68b040',
    '--accent-dim':       '#244818',
    '--accent-soft':      'rgba(74, 138, 48, 0.18)',
    '--text-primary':     '#e8d8a0',
    '--text-secondary':   '#8a7040',
    '--text-muted':       '#504030',
    '--border':           '#4a3018',
    '--border-subtle':    '#2a1e0c',
    '--border-strong':    '#00c090',
    '--success':          '#68b040',
    '--warning':          '#d4900a',
    '--danger':           '#c04030',
    '--info':             '#4a8a30',
    '--text-on-accent':       '#0a1808',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(10, 8, 4, 0.65)',
    '--success-soft':         'rgba(104, 176, 64, 0.14)',
    '--success-soft-border':  'rgba(104, 176, 64, 0.4)',
    '--warning-soft':         'rgba(212, 144, 10, 0.14)',
    '--warning-soft-border':  'rgba(212, 144, 10, 0.4)',
    '--danger-soft':          'rgba(192, 64, 48, 0.14)',
    '--danger-soft-border':   'rgba(192, 64, 48, 0.4)',
    '--danger-focus-ring':    'rgba(192, 64, 48, 0.3)',
    '--font-logo':        '"Cinzel", "Uncial Antiqua", Georgia, serif',
    '--font-display':     '"IM Fell English", "Lora", Georgia, serif',
    '--font-body':        '"Lora", Georgia, serif',
  },
  fonts: {
    logo: 'Cinzel',
    display: 'IM Fell English',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/priroda.webp',
  background: '/themes/backgrounds/priroda.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
```

- [ ] **Step 2: Create `src/themes/themes/priroda/decorations.css`**

```css
/* ── Příroda — zakletý les, smaragdové krystaly ── */

[data-theme="priroda"] {
  background-image:
    radial-gradient(ellipse at 50% 0%, rgba(212, 144, 10, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse at 50% 100%, rgba(0, 192, 144, 0.08) 0%, transparent 70%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

/* Organicky zaoblené karty */
[data-theme="priroda"] .card,
[data-theme="priroda"] [class*="card"] {
  border-radius: 6px;
  border: 1px solid var(--border);
}

@media (prefers-reduced-motion: no-preference) {
  [data-theme="priroda"] button:hover {
    box-shadow: 0 0 12px rgba(0, 192, 144, 0.4);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/priroda/
git commit -m "feat(themes): add priroda theme"
```

---

## Task B-4: Pergamen téma

**Files:**
- Create: `src/themes/themes/pergamen/index.ts`
- Create: `src/themes/themes/pergamen/decorations.css`

**Source of truth:** [docs/themes/pergamen.md](../../themes/pergamen.md)

- [ ] **Step 1: Create `src/themes/themes/pergamen/index.ts`**

> **Pozn:** Pergamen má karty SVĚTLÉ (pergamen) na tmavém pozadí — `--bg-card` je světlý, ostatní tmavý. Tomu odpovídají i sémantické text tokeny (`--text-on-accent` zde tmavý ne bílý).

```ts
import type { Theme } from '../../types';

export const pergamenTheme: Theme = {
  id: 'pergamen',
  name: 'Pergamen',
  scope: 'both',
  atmosphere: 'Starověká knihovna — pergamen, svíčky, inkoust',
  vars: {
    '--bg-primary':       '#1a0e06',
    '--bg-secondary':     '#241508',
    '--bg-card':          '#e8d8a8',
    '--bg-card-hover':    '#f0e0b8',
    '--accent':           '#8a1a10',
    '--accent-bright':    '#b02018',
    '--accent-dim':       '#601008',
    '--accent-soft':      'rgba(138, 26, 16, 0.18)',
    '--text-primary':     '#2a1a08',
    '--text-secondary':   '#5a3a18',
    '--text-muted':       '#806040',
    '--border':           '#4a2e10',
    '--border-subtle':    '#3a1e08',
    '--border-strong':    '#d08020',
    '--success':          '#3a8a4e',
    '--warning':          '#d08020',
    '--danger':           '#8a1a10',
    '--info':             '#3060a0',
    '--text-on-accent':       '#f0e0b8',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(20, 10, 4, 0.7)',
    '--success-soft':         'rgba(58, 138, 78, 0.16)',
    '--success-soft-border':  'rgba(58, 138, 78, 0.4)',
    '--warning-soft':         'rgba(208, 128, 32, 0.16)',
    '--warning-soft-border':  'rgba(208, 128, 32, 0.4)',
    '--danger-soft':          'rgba(138, 26, 16, 0.16)',
    '--danger-soft-border':   'rgba(138, 26, 16, 0.4)',
    '--danger-focus-ring':    'rgba(138, 26, 16, 0.3)',
    '--font-logo':        '"IM Fell English", "Libre Baskerville", Georgia, serif',
    '--font-display':     '"Lora", "Playfair Display", Georgia, serif',
    '--font-body':        '"Lora", "EB Garamond", Georgia, serif',
  },
  fonts: {
    logo: 'IM Fell English',
    display: 'Lora',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/pergamen.webp',
  background: '/themes/backgrounds/pergamen.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
```

- [ ] **Step 2: Create `src/themes/themes/pergamen/decorations.css`**

```css
/* ── Pergamen — knihovna, světlé pergamen karty na tmavém dřevě ── */

[data-theme="pergamen"] {
  background-image:
    radial-gradient(ellipse at 50% 0%, rgba(208, 128, 32, 0.20) 0%, transparent 60%),
    radial-gradient(ellipse at 50% 100%, rgba(138, 26, 16, 0.10) 0%, transparent 70%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

/* Pergamenové karty — světlé, mírně zaoblené */
[data-theme="pergamen"] .card,
[data-theme="pergamen"] [class*="card"] {
  border-radius: 4px;
  border: 1px solid var(--border-strong);
  box-shadow: 0 4px 12px rgba(20, 10, 4, 0.4);
}

/* Tenká zlatá linka pod nadpisy */
[data-theme="pergamen"] h1::after,
[data-theme="pergamen"] h2::after {
  content: '';
  display: block;
  width: 60%;
  height: 1px;
  background: var(--border-strong);
  margin-top: var(--sp-2);
  opacity: 0.5;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/pergamen/
git commit -m "feat(themes): add pergamen theme (light cards on dark wood)"
```

---

## Task B-5: Nemrtví téma

**Files:**
- Create: `src/themes/themes/nemrtvi/index.ts`
- Create: `src/themes/themes/nemrtvi/decorations.css`

**Source of truth:** [docs/themes/nemrtvi.md](../../themes/nemrtvi.md)

- [ ] **Step 1: Create `src/themes/themes/nemrtvi/index.ts`**

```ts
import type { Theme } from '../../types';

export const nemrtviTheme: Theme = {
  id: 'nemrtvi',
  name: 'Nemrtví',
  scope: 'both',
  atmosphere: 'Gotická krypta — toxická zelená, kámen, lebky',
  vars: {
    '--bg-primary':       '#0a0c08',
    '--bg-secondary':     '#101410',
    '--bg-card':          '#141810',
    '--bg-card-hover':    '#1a2018',
    '--accent':           '#30c060',
    '--accent-bright':    '#50e080',
    '--accent-dim':       '#186030',
    '--accent-soft':      'rgba(48, 192, 96, 0.18)',
    '--text-primary':     '#c0b890',
    '--text-secondary':   '#607050',
    '--text-muted':       '#303828',
    '--border':           '#282e20',
    '--border-subtle':    '#181c14',
    '--border-strong':    '#30c060',
    '--success':          '#50e080',
    '--warning':          '#c8b888',
    '--danger':           '#8a1a10',
    '--info':             '#30c060',
    '--text-on-accent':       '#0a1808',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(0, 8, 0, 0.7)',
    '--success-soft':         'rgba(80, 224, 128, 0.14)',
    '--success-soft-border':  'rgba(80, 224, 128, 0.4)',
    '--warning-soft':         'rgba(200, 184, 136, 0.16)',
    '--warning-soft-border':  'rgba(200, 184, 136, 0.4)',
    '--danger-soft':          'rgba(138, 26, 16, 0.18)',
    '--danger-soft-border':   'rgba(138, 26, 16, 0.4)',
    '--danger-focus-ring':    'rgba(138, 26, 16, 0.3)',
    '--font-logo':        '"MedievalSharp", "UnifrakturMaguntia", Georgia, serif',
    '--font-display':     '"Cinzel", "IM Fell English", Georgia, serif',
    '--font-body':        '"Lora", "EB Garamond", Georgia, serif',
  },
  fonts: {
    logo: 'MedievalSharp',
    display: 'Cinzel',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/nemrtvi.webp',
  background: '/themes/backgrounds/nemrtvi.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
```

- [ ] **Step 2: Create `src/themes/themes/nemrtvi/decorations.css`**

```css
/* ── Nemrtví — krypta, toxická zelená ── */

[data-theme="nemrtvi"] {
  background-image:
    radial-gradient(ellipse at 50% 30%, rgba(48, 192, 96, 0.10) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 100%, rgba(0, 16, 0, 0.6) 0%, transparent 70%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

/* Téměř pravoúhlé karty (kamenné) */
[data-theme="nemrtvi"] .card,
[data-theme="nemrtvi"] [class*="card"] {
  border-radius: 2px;
  border: 1px solid var(--border-strong);
}

@media (prefers-reduced-motion: no-preference) {
  [data-theme="nemrtvi"] button:hover {
    box-shadow: 0 0 16px rgba(48, 192, 96, 0.6);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/nemrtvi/
git commit -m "feat(themes): add nemrtvi theme (gothic crypt, toxic green)"
```

---

## Task B-6: Čtyři živly téma

**Files:**
- Create: `src/themes/themes/ctyri-zivly/index.ts`
- Create: `src/themes/themes/ctyri-zivly/decorations.css`

**Source of truth:** [docs/themes/ctyri-zivly.md](../../themes/ctyri-zivly.md)

- [ ] **Step 1: Create `src/themes/themes/ctyri-zivly/index.ts`**

> **Pozn:** Toto téma má 4 elementální barvy (oheň/voda/země/vzduch) jako EXTRA tokeny mimo standardní paletu. Zlatá je unifying accent.

```ts
import type { Theme } from '../../types';

export const ctyriZivlyTheme: Theme = {
  id: 'ctyri-zivly',
  name: 'Čtyři živly',
  scope: 'both',
  atmosphere: 'Elementální mandala — oheň, voda, země, vzduch + zlatá unifikace',
  vars: {
    '--bg-primary':       '#100c08',
    '--bg-secondary':     '#181208',
    '--bg-card':          '#1a1510',
    '--bg-card-hover':    '#221c14',
    '--accent':           '#c8900a',
    '--accent-bright':    '#e8b020',
    '--accent-dim':       '#604808',
    '--accent-soft':      'rgba(200, 144, 10, 0.16)',
    '--text-primary':     '#d8c090',
    '--text-secondary':   '#7a6040',
    '--text-muted':       '#403020',
    '--border':           '#302818',
    '--border-subtle':    '#1c1810',
    '--border-strong':    '#c8900a',
    '--success':          '#6a8830',
    '--warning':          '#e86020',
    '--danger':           '#c04020',
    '--info':             '#2080d0',
    '--text-on-accent':       '#100c08',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(8, 6, 4, 0.7)',
    '--success-soft':         'rgba(106, 136, 48, 0.16)',
    '--success-soft-border':  'rgba(106, 136, 48, 0.4)',
    '--warning-soft':         'rgba(232, 96, 32, 0.14)',
    '--warning-soft-border':  'rgba(232, 96, 32, 0.4)',
    '--danger-soft':          'rgba(192, 64, 32, 0.14)',
    '--danger-soft-border':   'rgba(192, 64, 32, 0.4)',
    '--danger-focus-ring':    'rgba(192, 64, 32, 0.3)',
    /* ── Elementální tokeny (extra, mimo standardní paletu) ── */
    '--fire-primary':         '#e86020',
    '--water-primary':        '#2080d0',
    '--earth-primary':        '#4a6020',
    '--air-primary':          '#c0d8e8',
    '--font-logo':        '"Cinzel Decorative", "Trajan Pro", Georgia, serif',
    '--font-display':     '"IM Fell English", "Cinzel", Georgia, serif',
    '--font-body':        '"Lora", Georgia, serif',
  },
  fonts: {
    logo: 'Cinzel Decorative',
    display: 'IM Fell English',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/ctyri-zivly.webp',
  background: '/themes/backgrounds/ctyri-zivly.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
```

- [ ] **Step 2: Create `src/themes/themes/ctyri-zivly/decorations.css`**

```css
/* ── Čtyři živly — elementální zóny + zlatá unifikace ── */

[data-theme="ctyri-zivly"] {
  background-image:
    radial-gradient(ellipse at 0% 50%, rgba(232, 96, 32, 0.10) 0%, transparent 30%),
    radial-gradient(ellipse at 100% 50%, rgba(32, 128, 208, 0.10) 0%, transparent 30%),
    radial-gradient(ellipse at 50% 0%, rgba(192, 216, 232, 0.06) 0%, transparent 30%),
    radial-gradient(ellipse at 50% 100%, rgba(74, 96, 32, 0.10) 0%, transparent 30%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

[data-theme="ctyri-zivly"] .card,
[data-theme="ctyri-zivly"] [class*="card"] {
  border-radius: 5px;
  border: 1px solid var(--border-strong);
}

@media (prefers-reduced-motion: no-preference) {
  [data-theme="ctyri-zivly"] button:hover {
    box-shadow: 0 0 12px rgba(200, 144, 10, 0.5);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/ctyri-zivly/
git commit -m "feat(themes): add ctyri-zivly theme (4 elements + gold unifier)"
```

---

## Task B-7: Registrovat batch 1 (6 témat) do registry

**Files:**
- Modify: `src/themes/registry.ts`

- [ ] **Step 1: Replace `src/themes/registry.ts` content** with:

```ts
import type { Theme, ThemeId, ThemeScope } from './types';
import { modreNebeTheme } from './themes/modre-nebe';
import { bilaTheme } from './themes/bila';
import { temnaCervenTheme } from './themes/temna-cerven';
import { sciFiTheme } from './themes/sci-fi';
import { vesmirnaLodTheme } from './themes/vesmirna-lod';
import { prirodaTheme } from './themes/priroda';
import { pergamenTheme } from './themes/pergamen';
import { nemrtviTheme } from './themes/nemrtvi';
import { ctyriZivlyTheme } from './themes/ctyri-zivly';

export const DEFAULT_THEME: ThemeId = 'modre-nebe';

export const THEMES: Partial<Record<ThemeId, Theme>> = {
  'modre-nebe':   modreNebeTheme,
  'bila':         bilaTheme,
  'temna-cerven': temnaCervenTheme,
  'sci-fi':       sciFiTheme,
  'vesmirna-lod': vesmirnaLodTheme,
  'priroda':      prirodaTheme,
  'pergamen':     pergamenTheme,
  'nemrtvi':      nemrtviTheme,
  'ctyri-zivly':  ctyriZivlyTheme,
};

export function getTheme(id: string): Theme {
  return (THEMES as Record<string, Theme>)[id] ?? THEMES[DEFAULT_THEME]!;
}

export function listThemes(scope?: ThemeScope): Theme[] {
  const all = Object.values(THEMES).filter(Boolean) as Theme[];
  if (!scope) return all;
  return all.filter((t) => t.scope === scope || t.scope === 'both');
}
```

- [ ] **Step 2: Run registry tests — must pass for all 9 themes**

```bash
npm run test:run -- registry.test
```

Expected: 7/7 pass. The "every theme has required CSS variables" test now validates 9 themes.

- [ ] **Step 3: Commit**

```bash
git add src/themes/registry.ts
git commit -m "feat(themes): register batch 1 (sci-fi, vesmirna-lod, priroda, pergamen, nemrtvi, ctyri-zivly)"
```

---

# M12: Implementace 6 témat — Batch 2

## Task B-8: Vesmírná bitva téma

**Files:**
- Create: `src/themes/themes/vesmirna-bitva/index.ts`
- Create: `src/themes/themes/vesmirna-bitva/decorations.css`

**Source of truth:** [docs/themes/vesmirna-bitva.md](../../themes/vesmirna-bitva.md)

- [ ] **Step 1: Create `src/themes/themes/vesmirna-bitva/index.ts`**

```ts
import type { Theme } from '../../types';

export const vesmirnaBitvaTheme: Theme = {
  id: 'vesmirna-bitva',
  name: 'Vesmírná bitva',
  scope: 'both',
  atmosphere: 'Bojový alarm — červená, černá, urgence',
  vars: {
    '--bg-primary':       '#050305',
    '--bg-secondary':     '#0a0508',
    '--bg-card':          '#0f0508',
    '--bg-card-hover':    '#150810',
    '--accent':           '#c01818',
    '--accent-bright':    '#e02020',
    '--accent-dim':       '#600808',
    '--accent-soft':      'rgba(192, 24, 24, 0.18)',
    '--text-primary':     '#e0c0c0',
    '--text-secondary':   '#804040',
    '--text-muted':       '#402020',
    '--border':           '#150808',
    '--border-subtle':    '#0a0404',
    '--border-strong':    '#c01818',
    '--success':          '#3ecf8e',
    '--warning':          '#e05010',
    '--danger':           '#e02020',
    '--info':             '#5ba4f5',
    '--text-on-accent':       '#ffffff',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(0, 0, 0, 0.75)',
    '--success-soft':         'rgba(62, 207, 142, 0.12)',
    '--success-soft-border':  'rgba(62, 207, 142, 0.4)',
    '--warning-soft':         'rgba(224, 80, 16, 0.14)',
    '--warning-soft-border':  'rgba(224, 80, 16, 0.4)',
    '--danger-soft':          'rgba(224, 32, 32, 0.16)',
    '--danger-soft-border':   'rgba(224, 32, 32, 0.4)',
    '--danger-focus-ring':    'rgba(224, 32, 32, 0.3)',
    '--font-logo':        '"Orbitron", "Russo One", sans-serif',
    '--font-display':     '"Rajdhani", "Exo 2", sans-serif',
    '--font-body':        '"Roboto Condensed", "Roboto", sans-serif',
  },
  fonts: {
    logo: 'Orbitron',
    display: 'Rajdhani',
    body: 'Roboto Condensed',
  },
  thumbnail: '/themes/thumbnails/vesmirna-bitva.webp',
  background: '/themes/backgrounds/vesmirna-bitva.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
```

- [ ] **Step 2: Create `src/themes/themes/vesmirna-bitva/decorations.css`**

```css
/* ── Vesmírná bitva — alarm, červená urgence ── */

[data-theme="vesmirna-bitva"] {
  background-image:
    radial-gradient(ellipse at 50% 30%, rgba(192, 24, 24, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 100%, rgba(0, 0, 0, 0.8) 0%, transparent 70%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

/* Pravoúhlé bojové karty */
[data-theme="vesmirna-bitva"] .card,
[data-theme="vesmirna-bitva"] [class*="card"],
[data-theme="vesmirna-bitva"] button {
  border-radius: 0;
}

@media (prefers-reduced-motion: no-preference) {
  [data-theme="vesmirna-bitva"] button:hover {
    box-shadow: 0 0 20px rgba(192, 24, 24, 0.6);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/vesmirna-bitva/
git commit -m "feat(themes): add vesmirna-bitva theme"
```

---

## Task B-9: Hospoda téma

**Files:**
- Create: `src/themes/themes/hospoda/index.ts`
- Create: `src/themes/themes/hospoda/decorations.css`

**Source of truth:** [docs/themes/hospoda.md](../../themes/hospoda.md)

- [ ] **Step 1: Create `src/themes/themes/hospoda/index.ts`**

> **Pozn:** Hospoda má karty SVĚTLÉ (pergamen) jako Pergamen téma — `--bg-card` světlý, ostatní tmavé.

```ts
import type { Theme } from '../../types';

export const hospodaTheme: Theme = {
  id: 'hospoda',
  name: 'Hospoda',
  scope: 'both',
  atmosphere: 'Středověká krčma — dřevo, pergamen, cechovní banner',
  vars: {
    '--bg-primary':       '#120a04',
    '--bg-secondary':     '#1a1008',
    '--bg-card':          '#e8d4a0',
    '--bg-card-hover':    '#f0e0b0',
    '--accent':           '#8a1520',
    '--accent-bright':    '#b01828',
    '--accent-dim':       '#600810',
    '--accent-soft':      'rgba(138, 21, 32, 0.18)',
    '--text-primary':     '#2a1808',
    '--text-secondary':   '#604030',
    '--text-muted':       '#604020',
    '--border':           '#3a1e08',
    '--border-subtle':    '#2a1808',
    '--border-strong':    '#c8800a',
    '--success':          '#3a8a4e',
    '--warning':          '#c8800a',
    '--danger':           '#8a1520',
    '--info':             '#3060a0',
    '--text-on-accent':       '#f0e0b0',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(20, 10, 4, 0.7)',
    '--success-soft':         'rgba(58, 138, 78, 0.16)',
    '--success-soft-border':  'rgba(58, 138, 78, 0.4)',
    '--warning-soft':         'rgba(200, 128, 10, 0.16)',
    '--warning-soft-border':  'rgba(200, 128, 10, 0.4)',
    '--danger-soft':          'rgba(138, 21, 32, 0.16)',
    '--danger-soft-border':   'rgba(138, 21, 32, 0.4)',
    '--danger-focus-ring':    'rgba(138, 21, 32, 0.3)',
    '--font-logo':        '"Almendra", "MedievalSharp", Georgia, serif',
    '--font-display':     '"Lora", "Playfair Display", Georgia, serif',
    '--font-body':        '"Lora", Georgia, serif',
  },
  fonts: {
    logo: 'Almendra',
    display: 'Lora',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/hospoda.webp',
  background: '/themes/backgrounds/hospoda.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
```

- [ ] **Step 2: Create `src/themes/themes/hospoda/decorations.css`**

```css
/* ── Hospoda — středověká krčma ── */

[data-theme="hospoda"] {
  background-image:
    radial-gradient(ellipse at 50% 100%, rgba(224, 152, 32, 0.20) 0%, transparent 60%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

[data-theme="hospoda"] .card,
[data-theme="hospoda"] [class*="card"] {
  border-radius: 6px;
  border: 1px solid var(--border-strong);
  box-shadow: 0 4px 12px rgba(20, 10, 4, 0.4);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/hospoda/
git commit -m "feat(themes): add hospoda theme (medieval tavern)"
```

---

## Task B-10: Severské runy téma

**Files:**
- Create: `src/themes/themes/severske-runy/index.ts`
- Create: `src/themes/themes/severske-runy/decorations.css`

**Source of truth:** [docs/themes/severske-runy.md](../../themes/severske-runy.md)

- [ ] **Step 1: Create `src/themes/themes/severske-runy/index.ts`**

```ts
import type { Theme } from '../../types';

export const severskeRunyTheme: Theme = {
  id: 'severske-runy',
  name: 'Severské runy',
  scope: 'both',
  atmosphere: 'Vikingský runový kámen — led, železo, pochodně',
  vars: {
    '--bg-primary':       '#080c10',
    '--bg-secondary':     '#0c1018',
    '--bg-card':          '#101520',
    '--bg-card-hover':    '#161e28',
    '--accent':           '#4ab0d0',
    '--accent-bright':    '#70d0f0',
    '--accent-dim':       '#205870',
    '--accent-soft':      'rgba(74, 176, 208, 0.16)',
    '--text-primary':     '#c8d8e8',
    '--text-secondary':   '#5888a8',
    '--text-muted':       '#304050',
    '--border':           '#3a4858',
    '--border-subtle':    '#202830',
    '--border-strong':    '#4ab0d0',
    '--success':          '#3ecf8e',
    '--warning':          '#c08030',
    '--danger':           '#c04040',
    '--info':             '#4ab0d0',
    '--text-on-accent':       '#04101a',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(0, 4, 8, 0.7)',
    '--success-soft':         'rgba(62, 207, 142, 0.12)',
    '--success-soft-border':  'rgba(62, 207, 142, 0.4)',
    '--warning-soft':         'rgba(192, 128, 48, 0.16)',
    '--warning-soft-border':  'rgba(192, 128, 48, 0.4)',
    '--danger-soft':          'rgba(192, 64, 64, 0.14)',
    '--danger-soft-border':   'rgba(192, 64, 64, 0.4)',
    '--danger-focus-ring':    'rgba(192, 64, 64, 0.3)',
    '--font-logo':        '"Cinzel", "Norse", Georgia, serif',
    '--font-display':     '"Uncial Antiqua", "IM Fell English", Georgia, serif',
    '--font-body':        '"Lora", "EB Garamond", Georgia, serif',
  },
  fonts: {
    logo: 'Cinzel',
    display: 'Uncial Antiqua',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/severske-runy.webp',
  background: '/themes/backgrounds/severske-runy.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
```

- [ ] **Step 2: Create `src/themes/themes/severske-runy/decorations.css`**

```css
/* ── Severské runy — Viking, led + železo ── */

[data-theme="severske-runy"] {
  background-image:
    radial-gradient(ellipse at 50% 0%, rgba(74, 176, 208, 0.10) 0%, transparent 50%),
    radial-gradient(ellipse at 0% 100%, rgba(192, 128, 48, 0.10) 0%, transparent 40%),
    radial-gradient(ellipse at 100% 100%, rgba(192, 128, 48, 0.10) 0%, transparent 40%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

[data-theme="severske-runy"] .card,
[data-theme="severske-runy"] [class*="card"] {
  border-radius: 3px;
  border: 1px solid var(--border-strong);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/severske-runy/
git commit -m "feat(themes): add severske-runy theme (Viking ice + iron)"
```

---

## Task B-11: Indiánské téma

**Files:**
- Create: `src/themes/themes/indiane/index.ts`
- Create: `src/themes/themes/indiane/decorations.css`

**Source of truth:** [docs/themes/indiane.md](../../themes/indiane.md)

- [ ] **Step 1: Create `src/themes/themes/indiane/index.ts`**

> **Pozn:** Karty jsou SVĚTLÉ kožené (jako Pergamen).

```ts
import type { Theme } from '../../types';

export const indianeTheme: Theme = {
  id: 'indiane',
  name: 'Indiánské',
  scope: 'both',
  atmosphere: 'Frontier západ — sunset, lapač snů, korálky, tyrkysová',
  vars: {
    '--bg-primary':       '#120a04',
    '--bg-secondary':     '#1a1008',
    '--bg-card':          '#d4a870',
    '--bg-card-hover':    '#e0bc88',
    '--accent':           '#d06010',
    '--accent-bright':    '#f08020',
    '--accent-dim':       '#803010',
    '--accent-soft':      'rgba(208, 96, 16, 0.18)',
    '--text-primary':     '#2a1808',
    '--text-secondary':   '#604020',
    '--text-muted':       '#503020',
    '--border':           '#805030',
    '--border-subtle':    '#3a1e08',
    '--border-strong':    '#c8900a',
    '--success':          '#3a8a4e',
    '--warning':          '#c8900a',
    '--danger':           '#a83838',
    '--info':             '#208080',
    '--text-on-accent':       '#f0e0b8',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(20, 10, 4, 0.7)',
    '--success-soft':         'rgba(58, 138, 78, 0.16)',
    '--success-soft-border':  'rgba(58, 138, 78, 0.4)',
    '--warning-soft':         'rgba(200, 144, 10, 0.16)',
    '--warning-soft-border':  'rgba(200, 144, 10, 0.4)',
    '--danger-soft':          'rgba(168, 56, 56, 0.16)',
    '--danger-soft-border':   'rgba(168, 56, 56, 0.4)',
    '--danger-focus-ring':    'rgba(168, 56, 56, 0.3)',
    '--font-logo':        '"Rye", "Playfair Display", Georgia, serif',
    '--font-display':     '"Lora", "IM Fell English", Georgia, serif',
    '--font-body':        '"Lora", Georgia, serif',
  },
  fonts: {
    logo: 'Rye',
    display: 'Lora',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/indiane.webp',
  background: '/themes/backgrounds/indiane.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
```

- [ ] **Step 2: Create `src/themes/themes/indiane/decorations.css`**

```css
/* ── Indiánské — frontier sunset ── */

[data-theme="indiane"] {
  background-image:
    radial-gradient(ellipse at 50% 0%, rgba(208, 96, 16, 0.20) 0%, transparent 60%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

[data-theme="indiane"] .card,
[data-theme="indiane"] [class*="card"] {
  border-radius: 4px;
  border: 1px solid var(--border-strong);
  box-shadow: 0 4px 12px rgba(20, 10, 4, 0.4);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/indiane/
git commit -m "feat(themes): add indiane theme (frontier west)"
```

---

## Task B-12: Africké téma

**Files:**
- Create: `src/themes/themes/africke/index.ts`
- Create: `src/themes/themes/africke/decorations.css`

**Source of truth:** [docs/themes/africke.md](../../themes/africke.md)

- [ ] **Step 1: Create `src/themes/themes/africke/index.ts`**

```ts
import type { Theme } from '../../types';

export const africkeTheme: Theme = {
  id: 'africke',
  name: 'Africké',
  scope: 'both',
  atmosphere: 'Africká savana — eben, amber, terracotta, kmenové vzory',
  vars: {
    '--bg-primary':       '#0e0804',
    '--bg-secondary':     '#160c06',
    '--bg-card':          '#1e1208',
    '--bg-card-hover':    '#261808',
    '--accent':           '#c8880a',
    '--accent-bright':    '#e8a820',
    '--accent-dim':       '#604008',
    '--accent-soft':      'rgba(200, 136, 10, 0.16)',
    '--text-primary':     '#d4a060',
    '--text-secondary':   '#806030',
    '--text-muted':       '#403018',
    '--border':           '#2a1808',
    '--border-subtle':    '#1a0c04',
    '--border-strong':    '#c8880a',
    '--success':          '#6a8830',
    '--warning':          '#c04818',
    '--danger':           '#a83838',
    '--info':             '#3060a0',
    '--text-on-accent':       '#0e0804',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(8, 4, 2, 0.7)',
    '--success-soft':         'rgba(106, 136, 48, 0.16)',
    '--success-soft-border':  'rgba(106, 136, 48, 0.4)',
    '--warning-soft':         'rgba(192, 72, 24, 0.14)',
    '--warning-soft-border':  'rgba(192, 72, 24, 0.4)',
    '--danger-soft':          'rgba(168, 56, 56, 0.16)',
    '--danger-soft-border':   'rgba(168, 56, 56, 0.4)',
    '--danger-focus-ring':    'rgba(168, 56, 56, 0.3)',
    '--font-logo':        '"Cinzel", "Trajan Pro", Georgia, serif',
    '--font-display':     '"IM Fell English", "Lora", Georgia, serif',
    '--font-body':        '"Lora", Georgia, serif',
  },
  fonts: {
    logo: 'Cinzel',
    display: 'IM Fell English',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/africke.webp',
  background: '/themes/backgrounds/africke.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
```

- [ ] **Step 2: Create `src/themes/themes/africke/decorations.css`**

```css
/* ── Africké — savana, kmenové vzory ── */

[data-theme="africke"] {
  background-image:
    radial-gradient(ellipse at 50% 100%, rgba(224, 96, 16, 0.18) 0%, transparent 60%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

[data-theme="africke"] .card,
[data-theme="africke"] [class*="card"] {
  border-radius: 3px;
  border: 1px solid var(--border-strong);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/africke/
git commit -m "feat(themes): add africke theme (savanna tribal)"
```

---

## Task B-13: Arabský svět téma

**Files:**
- Create: `src/themes/themes/arabsky-svet/index.ts`
- Create: `src/themes/themes/arabsky-svet/decorations.css`

**Source of truth:** [docs/themes/arabsky-svet.md](../../themes/arabsky-svet.md)

- [ ] **Step 1: Create `src/themes/themes/arabsky-svet/index.ts`**

> **Pozn:** Unikátní paleta — sidebary burgundy, karty hluboká tyrkysová.

```ts
import type { Theme } from '../../types';

export const arabskySvetTheme: Theme = {
  id: 'arabsky-svet',
  name: 'Arabský svět',
  scope: 'both',
  atmosphere: 'Arabský palác — burgundy, tyrkysová, zlato, arabesque',
  vars: {
    '--bg-primary':       '#100608',
    '--bg-secondary':     '#1a0810',
    '--bg-card':          '#082028',
    '--bg-card-hover':    '#0c2830',
    '--accent':           '#c8900a',
    '--accent-bright':    '#e8b020',
    '--accent-dim':       '#604808',
    '--accent-soft':      'rgba(200, 144, 10, 0.18)',
    '--text-primary':     '#e8d0a0',
    '--text-secondary':   '#806040',
    '--text-muted':       '#402820',
    '--border':           '#6a0820',
    '--border-subtle':    '#3a0410',
    '--border-strong':    '#c8900a',
    '--success':          '#208878',
    '--warning':          '#c8900a',
    '--danger':           '#a83838',
    '--info':             '#208878',
    '--text-on-accent':       '#100608',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(12, 4, 8, 0.75)',
    '--success-soft':         'rgba(32, 136, 120, 0.16)',
    '--success-soft-border':  'rgba(32, 136, 120, 0.4)',
    '--warning-soft':         'rgba(200, 144, 10, 0.16)',
    '--warning-soft-border':  'rgba(200, 144, 10, 0.4)',
    '--danger-soft':          'rgba(168, 56, 56, 0.16)',
    '--danger-soft-border':   'rgba(168, 56, 56, 0.4)',
    '--danger-focus-ring':    'rgba(168, 56, 56, 0.3)',
    '--font-logo':        '"Cinzel Decorative", "Scheherazade", Georgia, serif',
    '--font-display':     '"Lora", "Playfair Display", Georgia, serif',
    '--font-body':        '"Lora", Georgia, serif',
  },
  fonts: {
    logo: 'Cinzel Decorative',
    display: 'Lora',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/arabsky-svet.webp',
  background: '/themes/backgrounds/arabsky-svet.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
```

- [ ] **Step 2: Create `src/themes/themes/arabsky-svet/decorations.css`**

```css
/* ── Arabský svět — burgundy + teal + zlato ── */

[data-theme="arabsky-svet"] {
  background-image:
    radial-gradient(ellipse at 50% 0%, rgba(74, 24, 96, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 100%, rgba(106, 8, 32, 0.30) 0%, transparent 70%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

[data-theme="arabsky-svet"] .card,
[data-theme="arabsky-svet"] [class*="card"] {
  border-radius: 6px;
  border: 1px solid var(--border-strong);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/arabsky-svet/
git commit -m "feat(themes): add arabsky-svet theme (Arabian palace)"
```

---

## Task B-14: Registrovat batch 2 (6 témat)

**Files:**
- Modify: `src/themes/registry.ts`

- [ ] **Step 1: Update `src/themes/registry.ts`** — add 6 new imports and 6 new entries:

```ts
import type { Theme, ThemeId, ThemeScope } from './types';
import { modreNebeTheme } from './themes/modre-nebe';
import { bilaTheme } from './themes/bila';
import { temnaCervenTheme } from './themes/temna-cerven';
import { sciFiTheme } from './themes/sci-fi';
import { vesmirnaLodTheme } from './themes/vesmirna-lod';
import { prirodaTheme } from './themes/priroda';
import { pergamenTheme } from './themes/pergamen';
import { nemrtviTheme } from './themes/nemrtvi';
import { ctyriZivlyTheme } from './themes/ctyri-zivly';
import { vesmirnaBitvaTheme } from './themes/vesmirna-bitva';
import { hospodaTheme } from './themes/hospoda';
import { severskeRunyTheme } from './themes/severske-runy';
import { indianeTheme } from './themes/indiane';
import { africkeTheme } from './themes/africke';
import { arabskySvetTheme } from './themes/arabsky-svet';

export const DEFAULT_THEME: ThemeId = 'modre-nebe';

export const THEMES: Partial<Record<ThemeId, Theme>> = {
  'modre-nebe':     modreNebeTheme,
  'bila':           bilaTheme,
  'temna-cerven':   temnaCervenTheme,
  'sci-fi':         sciFiTheme,
  'vesmirna-lod':   vesmirnaLodTheme,
  'priroda':        prirodaTheme,
  'pergamen':       pergamenTheme,
  'nemrtvi':        nemrtviTheme,
  'ctyri-zivly':    ctyriZivlyTheme,
  'vesmirna-bitva': vesmirnaBitvaTheme,
  'hospoda':        hospodaTheme,
  'severske-runy':  severskeRunyTheme,
  'indiane':        indianeTheme,
  'africke':        africkeTheme,
  'arabsky-svet':   arabskySvetTheme,
};

export function getTheme(id: string): Theme {
  return (THEMES as Record<string, Theme>)[id] ?? THEMES[DEFAULT_THEME]!;
}

export function listThemes(scope?: ThemeScope): Theme[] {
  const all = Object.values(THEMES).filter(Boolean) as Theme[];
  if (!scope) return all;
  return all.filter((t) => t.scope === scope || t.scope === 'both');
}
```

- [ ] **Step 2: Run tests**

```bash
npm run test:run -- registry.test
```
Expected: 7/7 pass with 15 themes validated.

- [ ] **Step 3: Commit**

```bash
git add src/themes/registry.ts
git commit -m "feat(themes): register batch 2 (vesmirna-bitva, hospoda, severske-runy, indiane, africke, arabsky-svet)"
```

---

# M13: Implementace 6 témat — Batch 3 (final)

## Task B-15: Kyberpunk téma

**Files:**
- Create: `src/themes/themes/kyberpunk/index.ts`
- Create: `src/themes/themes/kyberpunk/decorations.css`

**Source of truth:** [docs/themes/kyberpunk.md](../../themes/kyberpunk.md)

- [ ] **Step 1: Create `src/themes/themes/kyberpunk/index.ts`**

```ts
import type { Theme } from '../../types';

export const kyberpunkTheme: Theme = {
  id: 'kyberpunk',
  name: 'Kyberpunk',
  scope: 'both',
  atmosphere: 'Neonová megalopole v dešti — cyan + magenta',
  vars: {
    '--bg-primary':       '#050810',
    '--bg-secondary':     '#080c18',
    '--bg-card':          '#0a1020',
    '--bg-card-hover':    '#0f1830',
    '--accent':           '#00d8e8',
    '--accent-bright':    '#40f0ff',
    '--accent-dim':       '#006878',
    '--accent-soft':      'rgba(0, 216, 232, 0.15)',
    '--text-primary':     '#c8e8f8',
    '--text-secondary':   '#5090b0',
    '--text-muted':       '#203040',
    '--border':           '#0c1830',
    '--border-subtle':    '#080c18',
    '--border-strong':    '#e020c0',
    '--success':          '#3ecf8e',
    '--warning':          '#f5a623',
    '--danger':           '#e020c0',
    '--info':             '#00d8e8',
    '--text-on-accent':       '#04101a',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(0, 4, 12, 0.8)',
    '--success-soft':         'rgba(62, 207, 142, 0.12)',
    '--success-soft-border':  'rgba(62, 207, 142, 0.4)',
    '--warning-soft':         'rgba(245, 166, 35, 0.12)',
    '--warning-soft-border':  'rgba(245, 166, 35, 0.4)',
    '--danger-soft':          'rgba(224, 32, 192, 0.16)',
    '--danger-soft-border':   'rgba(224, 32, 192, 0.4)',
    '--danger-focus-ring':    'rgba(224, 32, 192, 0.3)',
    '--font-logo':        '"Orbitron", "Exo 2", sans-serif',
    '--font-display':     '"Exo 2", "Rajdhani", sans-serif',
    '--font-body':        '"Roboto", "Inter", sans-serif',
  },
  fonts: {
    logo: 'Orbitron',
    display: 'Exo 2',
    body: 'Roboto',
  },
  thumbnail: '/themes/thumbnails/kyberpunk.webp',
  background: '/themes/backgrounds/kyberpunk.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
```

- [ ] **Step 2: Create `src/themes/themes/kyberpunk/decorations.css`**

```css
/* ── Kyberpunk — neonová megalopole ── */

[data-theme="kyberpunk"] {
  background-image:
    radial-gradient(ellipse at 30% 30%, rgba(0, 216, 232, 0.10) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 70%, rgba(224, 32, 192, 0.10) 0%, transparent 50%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

/* Magenta card borders (override default) */
[data-theme="kyberpunk"] .card,
[data-theme="kyberpunk"] [class*="card"] {
  clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  border-radius: 0;
  border: 1px solid var(--border-strong);
}

@media (prefers-reduced-motion: no-preference) {
  [data-theme="kyberpunk"] button:hover {
    box-shadow: 0 0 20px rgba(0, 216, 232, 0.6);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/kyberpunk/
git commit -m "feat(themes): add kyberpunk theme (neon megacity)"
```

---

## Task B-16: Postapo téma

**Files:**
- Create: `src/themes/themes/postapo/index.ts`
- Create: `src/themes/themes/postapo/decorations.css`

**Source of truth:** [docs/themes/postapo.md](../../themes/postapo.md)

- [ ] **Step 1: Create `src/themes/themes/postapo/index.ts`**

```ts
import type { Theme } from '../../types';

export const postapoTheme: Theme = {
  id: 'postapo',
  name: 'Postapo',
  scope: 'both',
  atmosphere: 'Apokalyptická pustina — desaturovaná olivová + rez',
  vars: {
    '--bg-primary':       '#0c0c08',
    '--bg-secondary':     '#141410',
    '--bg-card':          '#1a1a14',
    '--bg-card-hover':    '#202018',
    '--accent':           '#8a8810',
    '--accent-bright':    '#a8a818',
    '--accent-dim':       '#484808',
    '--accent-soft':      'rgba(138, 136, 16, 0.18)',
    '--text-primary':     '#b0a888',
    '--text-secondary':   '#686050',
    '--text-muted':       '#383830',
    '--border':           '#302e20',
    '--border-subtle':    '#1c1c14',
    '--border-strong':    '#7a3810',
    '--success':          '#6a8830',
    '--warning':          '#7a3810',
    '--danger':           '#9a4020',
    '--info':             '#5a7080',
    '--text-on-accent':       '#0c0c08',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(0, 0, 0, 0.7)',
    '--success-soft':         'rgba(106, 136, 48, 0.14)',
    '--success-soft-border':  'rgba(106, 136, 48, 0.4)',
    '--warning-soft':         'rgba(122, 56, 16, 0.16)',
    '--warning-soft-border':  'rgba(122, 56, 16, 0.4)',
    '--danger-soft':          'rgba(154, 64, 32, 0.14)',
    '--danger-soft-border':   'rgba(154, 64, 32, 0.4)',
    '--danger-focus-ring':    'rgba(154, 64, 32, 0.3)',
    '--font-logo':        '"Oswald", "Bebas Neue", sans-serif',
    '--font-display':     '"Roboto Condensed", "Oswald", sans-serif',
    '--font-body':        '"Roboto", "Source Sans Pro", sans-serif',
  },
  fonts: {
    logo: 'Oswald',
    display: 'Roboto Condensed',
    body: 'Roboto',
  },
  thumbnail: '/themes/thumbnails/postapo.webp',
  background: '/themes/backgrounds/postapo.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
```

- [ ] **Step 2: Create `src/themes/themes/postapo/decorations.css`**

```css
/* ── Postapo — desaturovaná pustina ── */

[data-theme="postapo"] {
  background-image:
    radial-gradient(ellipse at 50% 50%, rgba(138, 136, 16, 0.06) 0%, transparent 50%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

/* Pravoúhlé karty */
[data-theme="postapo"] .card,
[data-theme="postapo"] [class*="card"],
[data-theme="postapo"] button {
  border-radius: 0;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/postapo/
git commit -m "feat(themes): add postapo theme (desaturated wasteland)"
```

---

## Task B-17: Magie téma

**Files:**
- Create: `src/themes/themes/magie/index.ts`
- Create: `src/themes/themes/magie/decorations.css`

**Source of truth:** [docs/themes/magie.md](../../themes/magie.md)

- [ ] **Step 1: Create `src/themes/themes/magie/index.ts`**

```ts
import type { Theme } from '../../types';

export const magieTheme: Theme = {
  id: 'magie',
  name: 'Magie a kouzla',
  scope: 'both',
  atmosphere: 'Kouzelnická věž — fialová + zlato + krystaly',
  vars: {
    '--bg-primary':       '#060410',
    '--bg-secondary':     '#0c0618',
    '--bg-card':          '#100820',
    '--bg-card-hover':    '#160c2c',
    '--accent':           '#c8900a',
    '--accent-bright':    '#e8b020',
    '--accent-dim':       '#604808',
    '--accent-soft':      'rgba(200, 144, 10, 0.18)',
    '--text-primary':     '#e0d0f8',
    '--text-secondary':   '#806090',
    '--text-muted':       '#302040',
    '--border':           '#3a2050',
    '--border-subtle':    '#1c1030',
    '--border-strong':    '#8020d0',
    '--success':          '#3ecf8e',
    '--warning':          '#e8b020',
    '--danger':           '#c030a0',
    '--info':             '#20a8d0',
    '--text-on-accent':       '#06010c',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(4, 0, 12, 0.75)',
    '--success-soft':         'rgba(62, 207, 142, 0.12)',
    '--success-soft-border':  'rgba(62, 207, 142, 0.4)',
    '--warning-soft':         'rgba(232, 176, 32, 0.14)',
    '--warning-soft-border':  'rgba(232, 176, 32, 0.4)',
    '--danger-soft':          'rgba(192, 48, 160, 0.14)',
    '--danger-soft-border':   'rgba(192, 48, 160, 0.4)',
    '--danger-focus-ring':    'rgba(192, 48, 160, 0.3)',
    '--font-logo':        '"Cinzel Decorative", "MedievalSharp", Georgia, serif',
    '--font-display':     '"Cinzel", "IM Fell English", Georgia, serif',
    '--font-body':        '"Lora", "EB Garamond", Georgia, serif',
  },
  fonts: {
    logo: 'Cinzel Decorative',
    display: 'Cinzel',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/magie.webp',
  background: '/themes/backgrounds/magie.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
```

- [ ] **Step 2: Create `src/themes/themes/magie/decorations.css`**

```css
/* ── Magie — arcane fialová + zlato ── */

[data-theme="magie"] {
  background-image:
    radial-gradient(ellipse at 30% 30%, rgba(128, 32, 208, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 70%, rgba(32, 168, 208, 0.08) 0%, transparent 50%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

[data-theme="magie"] .card,
[data-theme="magie"] [class*="card"] {
  border-radius: 4px;
  border: 1px solid var(--border-strong);
}

@media (prefers-reduced-motion: no-preference) {
  [data-theme="magie"] button:hover {
    box-shadow: 0 0 16px rgba(128, 32, 208, 0.5);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/magie/
git commit -m "feat(themes): add magie theme (wizard sanctum)"
```

---

## Task B-18: Měsíc téma

**Files:**
- Create: `src/themes/themes/mesic/index.ts`
- Create: `src/themes/themes/mesic/decorations.css`

**Source of truth:** [docs/themes/mesic.md](../../themes/mesic.md)

- [ ] **Step 1: Create `src/themes/themes/mesic/index.ts`**

> **Pozn:** Glassmorphism téma — backdrop-filter, žádné zlato.

```ts
import type { Theme } from '../../types';

export const mesicTheme: Theme = {
  id: 'mesic',
  name: 'Měsíc',
  scope: 'both',
  atmosphere: 'Měsíční pohádkové království — stříbrná + glassmorphism',
  vars: {
    '--bg-primary':       '#06091a',
    '--bg-secondary':     '#0a1028',
    '--bg-card':          '#0e163a',
    '--bg-card-hover':    '#121e48',
    '--accent':           '#6090e0',
    '--accent-bright':    '#80b0ff',
    '--accent-dim':       '#203060',
    '--accent-soft':      'rgba(96, 144, 224, 0.18)',
    '--text-primary':     '#e8f0ff',
    '--text-secondary':   '#6880b0',
    '--text-muted':       '#1e2a48',
    '--border':           '#405880',
    '--border-subtle':    '#202c3c',
    '--border-strong':    '#b8cce8',
    '--success':          '#3ecf8e',
    '--warning':          '#d4b878',
    '--danger':           '#e08080',
    '--info':             '#6090e0',
    '--text-on-accent':       '#04081a',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(0, 4, 16, 0.65)',
    '--success-soft':         'rgba(62, 207, 142, 0.12)',
    '--success-soft-border':  'rgba(62, 207, 142, 0.4)',
    '--warning-soft':         'rgba(212, 184, 120, 0.14)',
    '--warning-soft-border':  'rgba(212, 184, 120, 0.4)',
    '--danger-soft':          'rgba(224, 128, 128, 0.14)',
    '--danger-soft-border':   'rgba(224, 128, 128, 0.4)',
    '--danger-focus-ring':    'rgba(224, 128, 128, 0.3)',
    '--font-logo':        '"Great Vibes", "Tangerine", "Cinzel", Georgia, serif',
    '--font-display':     '"Cinzel", "Playfair Display", Georgia, serif',
    '--font-body':        '"Lora", "EB Garamond", Georgia, serif',
  },
  fonts: {
    logo: 'Great Vibes',
    display: 'Cinzel',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/mesic.webp',
  background: '/themes/backgrounds/mesic.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
```

- [ ] **Step 2: Create `src/themes/themes/mesic/decorations.css`**

```css
/* ── Měsíc — glassmorphism panely ── */

[data-theme="mesic"] {
  background-image:
    radial-gradient(circle at 50% 15%, rgba(120, 160, 240, 0.15) 0%, transparent 60%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

/* Glassmorphism karty */
[data-theme="mesic"] .card,
[data-theme="mesic"] [class*="card"] {
  border-radius: 6px;
  border: 1px solid rgba(184, 204, 232, 0.3);
  background: rgba(14, 22, 58, 0.82);
  backdrop-filter: blur(10px) saturate(1.2);
}

/* Vodní odlesk overlay */
[data-theme="mesic"]::after {
  content: '';
  position: fixed;
  inset: 0;
  background: linear-gradient(to top, rgba(96, 144, 224, 0.06) 0%, transparent 30%);
  pointer-events: none;
  z-index: 0;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/mesic/
git commit -m "feat(themes): add mesic theme (glassmorphism moon)"
```

---

## Task B-19: Slunce téma

**Files:**
- Create: `src/themes/themes/slunce/index.ts`
- Create: `src/themes/themes/slunce/decorations.css`

**Source of truth:** [docs/themes/slunce.md](../../themes/slunce.md)

- [ ] **Step 1: Create `src/themes/themes/slunce/index.ts`**

```ts
import type { Theme } from '../../types';

export const slunceTheme: Theme = {
  id: 'slunce',
  name: 'Slunce',
  scope: 'both',
  atmosphere: 'Spálená země pod sluncem — amber + černá, antické ruiny',
  vars: {
    '--bg-primary':       '#120c04',
    '--bg-secondary':     '#180e06',
    '--bg-card':          '#1e1408',
    '--bg-card-hover':    '#261a0c',
    '--accent':           '#c88010',
    '--accent-bright':    '#e8a020',
    '--accent-dim':       '#604008',
    '--accent-soft':      'rgba(200, 128, 16, 0.18)',
    '--text-primary':     '#e8c070',
    '--text-secondary':   '#806030',
    '--text-muted':       '#381e08',
    '--border':           '#2a1e0c',
    '--border-subtle':    '#180c04',
    '--border-strong':    '#c88010',
    '--success':          '#6a8830',
    '--warning':          '#d06010',
    '--danger':           '#a83838',
    '--info':             '#c88010',
    '--text-on-accent':       '#120c04',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(8, 4, 0, 0.75)',
    '--success-soft':         'rgba(106, 136, 48, 0.14)',
    '--success-soft-border':  'rgba(106, 136, 48, 0.4)',
    '--warning-soft':         'rgba(208, 96, 16, 0.16)',
    '--warning-soft-border':  'rgba(208, 96, 16, 0.4)',
    '--danger-soft':          'rgba(168, 56, 56, 0.16)',
    '--danger-soft-border':   'rgba(168, 56, 56, 0.4)',
    '--danger-focus-ring':    'rgba(168, 56, 56, 0.3)',
    '--font-logo':        '"Cinzel", "Trajan Pro", Georgia, serif',
    '--font-display':     '"Cinzel", "Playfair Display", Georgia, serif',
    '--font-body':        '"Lora", "EB Garamond", Georgia, serif',
  },
  fonts: {
    logo: 'Cinzel',
    display: 'Cinzel',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/slunce.webp',
  background: '/themes/backgrounds/slunce.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
```

- [ ] **Step 2: Create `src/themes/themes/slunce/decorations.css`**

```css
/* ── Slunce — antické ruiny pod sluncem ── */

[data-theme="slunce"] {
  background-image:
    radial-gradient(ellipse at 50% 0%, rgba(208, 96, 16, 0.18) 0%, transparent 60%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

[data-theme="slunce"] .card,
[data-theme="slunce"] [class*="card"] {
  border-radius: 2px;
  border: 1px solid var(--border-strong);
  clip-path: polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px);
}

@media (prefers-reduced-motion: no-preference) {
  [data-theme="slunce"] button:hover {
    box-shadow: 0 0 14px rgba(200, 128, 16, 0.5);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/slunce/
git commit -m "feat(themes): add slunce theme (solar wasteland)"
```

---

## Task B-20: Zlatý standard téma

**Files:**
- Create: `src/themes/themes/zlaty-standard/index.ts`
- Create: `src/themes/themes/zlaty-standard/decorations.css`

**Source of truth:** [docs/themes/zlaty-standard.md](../../themes/zlaty-standard.md)

- [ ] **Step 1: Create `src/themes/themes/zlaty-standard/index.ts`**

```ts
import type { Theme } from '../../types';

export const zlatyStandardTheme: Theme = {
  id: 'zlaty-standard',
  name: 'Zlatý standard',
  scope: 'both',
  atmosphere: 'Královský luxus — pure black + rich gold, no blue',
  vars: {
    '--bg-primary':       '#050508',
    '--bg-secondary':     '#0a0a0f',
    '--bg-card':          '#0c0c12',
    '--bg-card-hover':    '#121220',
    '--accent':           '#d4a017',
    '--accent-bright':    '#f0c040',
    '--accent-dim':       '#8a6510',
    '--accent-soft':      'rgba(212, 160, 23, 0.18)',
    '--text-primary':     '#f0e8d0',
    '--text-secondary':   '#907840',
    '--text-muted':       '#504030',
    '--border':           '#1a1510',
    '--border-subtle':    '#0a0808',
    '--border-strong':    '#d4a017',
    '--success':          '#3ecf8e',
    '--warning':          '#d4a017',
    '--danger':           '#c04040',
    '--info':             '#d4a017',
    '--text-on-accent':       '#050508',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(0, 0, 0, 0.8)',
    '--success-soft':         'rgba(62, 207, 142, 0.12)',
    '--success-soft-border':  'rgba(62, 207, 142, 0.4)',
    '--warning-soft':         'rgba(212, 160, 23, 0.16)',
    '--warning-soft-border':  'rgba(212, 160, 23, 0.4)',
    '--danger-soft':          'rgba(192, 64, 64, 0.14)',
    '--danger-soft-border':   'rgba(192, 64, 64, 0.4)',
    '--danger-focus-ring':    'rgba(192, 64, 64, 0.3)',
    '--font-logo':        '"Cinzel Decorative", "Cinzel", Georgia, serif',
    '--font-display':     '"Cinzel", "Playfair Display", Georgia, serif',
    '--font-body':        '"Lato", "Lora", Georgia, serif',
  },
  fonts: {
    logo: 'Cinzel Decorative',
    display: 'Cinzel',
    body: 'Lato',
  },
  thumbnail: '/themes/thumbnails/zlaty-standard.webp',
  background: '/themes/backgrounds/zlaty-standard.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
```

- [ ] **Step 2: Create `src/themes/themes/zlaty-standard/decorations.css`**

```css
/* ── Zlatý standard — královský luxus ── */

[data-theme="zlaty-standard"] {
  background-image:
    radial-gradient(ellipse at 50% 50%, rgba(212, 160, 23, 0.05) 0%, transparent 70%),
    linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background-color: var(--bg-primary);
}

[data-theme="zlaty-standard"] .card,
[data-theme="zlaty-standard"] [class*="card"] {
  border: 2px solid var(--border-strong);
}

[data-theme="zlaty-standard"] h1::before,
[data-theme="zlaty-standard"] h2::before {
  content: '◆';
  color: var(--accent);
  margin-right: var(--sp-2);
  font-size: 0.7em;
}

@media (prefers-reduced-motion: no-preference) {
  [data-theme="zlaty-standard"] button:hover {
    box-shadow: 0 0 12px rgba(212, 160, 23, 0.6);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/themes/themes/zlaty-standard/
git commit -m "feat(themes): add zlaty-standard theme (royal luxury)"
```

---

## Task B-21: Registrovat batch 3 — finální registrace všech 21 témat

**Files:**
- Modify: `src/themes/registry.ts`

- [ ] **Step 1: Replace `src/themes/registry.ts` content** with final version (all 21 themes):

```ts
import type { Theme, ThemeId, ThemeScope } from './types';
import { modreNebeTheme } from './themes/modre-nebe';
import { bilaTheme } from './themes/bila';
import { temnaCervenTheme } from './themes/temna-cerven';
import { sciFiTheme } from './themes/sci-fi';
import { vesmirnaLodTheme } from './themes/vesmirna-lod';
import { prirodaTheme } from './themes/priroda';
import { pergamenTheme } from './themes/pergamen';
import { nemrtviTheme } from './themes/nemrtvi';
import { ctyriZivlyTheme } from './themes/ctyri-zivly';
import { vesmirnaBitvaTheme } from './themes/vesmirna-bitva';
import { hospodaTheme } from './themes/hospoda';
import { severskeRunyTheme } from './themes/severske-runy';
import { indianeTheme } from './themes/indiane';
import { africkeTheme } from './themes/africke';
import { arabskySvetTheme } from './themes/arabsky-svet';
import { kyberpunkTheme } from './themes/kyberpunk';
import { postapoTheme } from './themes/postapo';
import { magieTheme } from './themes/magie';
import { mesicTheme } from './themes/mesic';
import { slunceTheme } from './themes/slunce';
import { zlatyStandardTheme } from './themes/zlaty-standard';

export const DEFAULT_THEME: ThemeId = 'modre-nebe';

// Plný registry — všech 21 témat. Pořadí = pořadí v dropdown switcheru.
export const THEMES: Record<ThemeId, Theme> = {
  'modre-nebe':     modreNebeTheme,
  'zlaty-standard': zlatyStandardTheme,
  'sci-fi':         sciFiTheme,
  'vesmirna-lod':   vesmirnaLodTheme,
  'vesmirna-bitva': vesmirnaBitvaTheme,
  'kyberpunk':      kyberpunkTheme,
  'postapo':        postapoTheme,
  'priroda':        prirodaTheme,
  'pergamen':       pergamenTheme,
  'hospoda':        hospodaTheme,
  'nemrtvi':        nemrtviTheme,
  'temna-cerven':   temnaCervenTheme,
  'ctyri-zivly':    ctyriZivlyTheme,
  'magie':          magieTheme,
  'severske-runy':  severskeRunyTheme,
  'indiane':        indianeTheme,
  'africke':        africkeTheme,
  'arabsky-svet':   arabskySvetTheme,
  'mesic':          mesicTheme,
  'slunce':         slunceTheme,
  'bila':           bilaTheme,
};

export function getTheme(id: string): Theme {
  return (THEMES as Record<string, Theme>)[id] ?? THEMES[DEFAULT_THEME];
}

export function listThemes(scope?: ThemeScope): Theme[] {
  const all = Object.values(THEMES);
  if (!scope) return all;
  return all.filter((t) => t.scope === scope || t.scope === 'both');
}
```

> **Změna:** `Partial<Record<...>>` → `Record<...>` (všech 21 nyní povinné). Removed `!` non-null assertion.

- [ ] **Step 2: Run all tests**

```bash
npm run test:run
```
Expected: vše projde. The registry test "every theme has required CSS variables" now validates 21 themes.

- [ ] **Step 3: Commit**

```bash
git add src/themes/registry.ts
git commit -m "feat(themes): register batch 3 + finalize all 21 themes"
```

---

# M14: Visual regression + Accessibility audit

## Task B-22: Stories pro všechna 21 témat (theme gallery)

**Files:**
- Create: `src/themes/ThemeGallery.stories.tsx`

This task creates a Storybook story that shows ALL 21 themes side-by-side via the theme decorator. Useful for visual regression catching.

- [ ] **Step 1: Create `src/themes/ThemeGallery.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { listThemes } from './registry';

function ThemePreview({ themeId, themeName }: { themeId: string; themeName: string }) {
  return (
    <div data-theme={themeId} style={{ padding: 24, minHeight: 220, border: '1px solid #333' }}>
      <h3 style={{ color: 'var(--text-primary)', marginTop: 0 }}>{themeName}</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <button style={{ padding: '8px 16px', background: 'var(--accent)', color: 'var(--text-on-accent)', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Primary
        </button>
        <button style={{ padding: '8px 16px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer' }}>
          Secondary
        </button>
      </div>
      <div style={{ padding: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4 }}>
        <p style={{ color: 'var(--text-primary)', margin: 0 }}>Tělo textu</p>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 13 }}>Sekundární text</p>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Themes/Gallery',
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj;

export const AllThemes: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, padding: 16 }}>
      {listThemes().map((t) => (
        <ThemePreview key={t.id} themeId={t.id} themeName={t.name} />
      ))}
    </div>
  ),
};
```

- [ ] **Step 2: Verify Storybook builds**

```bash
npx storybook build --output-dir storybook-static
rm -rf storybook-static
```

Build must succeed. If it fails, fix imports/exports.

- [ ] **Step 3: Commit**

```bash
git add src/themes/ThemeGallery.stories.tsx
git commit -m "feat(storybook): theme gallery story — all 21 themes side-by-side"
```

---

## Task B-23: WCAG AA contrast audit script

**Files:**
- Create: `scripts/audit-theme-contrast.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create `scripts/audit-theme-contrast.mjs`** with this exact content:

```js
import path from 'node:path';
import { readdir, readFile } from 'node:fs/promises';

// WCAG contrast formula
function relLuminance(hex) {
  const rgb = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!rgb) return 0;
  const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map((h) => {
    const v = parseInt(h, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg, bg) {
  const L1 = relLuminance(fg);
  const L2 = relLuminance(bg);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

const PAIRS = [
  { fg: '--text-primary',   bg: '--bg-primary',   min: 4.5, label: 'body text on primary bg' },
  { fg: '--text-primary',   bg: '--bg-card',      min: 4.5, label: 'body text on card' },
  { fg: '--text-secondary', bg: '--bg-primary',   min: 4.5, label: 'secondary text on primary bg' },
  { fg: '--accent',         bg: '--bg-primary',   min: 3.0, label: 'accent on primary (UI)' },
  { fg: '--text-on-accent', bg: '--accent',       min: 4.5, label: 'on-accent text' },
  { fg: '--text-on-danger', bg: '--danger',       min: 4.5, label: 'on-danger text' },
];

async function audit() {
  const themesDir = path.resolve('src/themes/themes');
  const themeDirs = (await readdir(themesDir, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let totalIssues = 0;

  for (const id of themeDirs) {
    const indexPath = path.join(themesDir, id, 'index.ts');
    const content = await readFile(indexPath, 'utf8');

    const vars = {};
    const re = /'(--[\w-]+)':\s+'(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))'/g;
    let m;
    while ((m = re.exec(content))) {
      const [, key, value] = m;
      vars[key] = value;
    }

    const issues = [];
    for (const pair of PAIRS) {
      const fg = vars[pair.fg];
      const bg = vars[pair.bg];
      if (!fg || !bg) continue;
      // Skip rgba values (only check hex pairs for now)
      if (!fg.startsWith('#') || !bg.startsWith('#')) continue;
      const ratio = contrast(fg, bg);
      const min = pair.min;
      if (ratio < min) {
        issues.push(`  ✗ ${pair.label}: ${fg} on ${bg} = ${ratio.toFixed(2)}:1 (need ≥${min})`);
      }
    }

    if (issues.length > 0) {
      console.log(`\n${id}:`);
      issues.forEach((i) => console.log(i));
      totalIssues += issues.length;
    } else {
      console.log(`✓ ${id}`);
    }
  }

  console.log(`\n${totalIssues > 0 ? `\n${totalIssues} contrast issue(s) found.` : '\nAll themes pass WCAG AA.'}`);
  if (totalIssues > 0) process.exit(1);
}

audit().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add npm script in `package.json`**

```json
"audit:contrast": "node scripts/audit-theme-contrast.mjs"
```

- [ ] **Step 3: Run audit**

```bash
npm run audit:contrast
```

If any theme reports contrast issues, fix them by adjusting the relevant `--text-*` or `--bg-*` token in that theme's `index.ts`.

**Common fixes:**
- `--text-secondary` too low contrast → darken/lighten until ≥ 4.5:1
- `--text-on-accent` mismatch with `--accent` → for light accents, use dark text; for dark accents, use white

If audit detects issues, iterate: fix one theme, re-run audit, fix next, etc.

- [ ] **Step 4: Commit**

```bash
git add scripts/audit-theme-contrast.mjs package.json src/themes/themes/
git commit -m "feat(a11y): WCAG AA contrast audit + fix theme contrast issues"
```

(If no themes needed fixing, the second `git add src/themes/themes/` is no-op — commit only the script.)

---

## Task B-24: Run all tests + final manual smoke

- [ ] **Step 1: Run full test suite**

```bash
npm run test:run
```
Expected: all tests pass.

- [ ] **Step 2: Run lint:colors**

```bash
npm run lint:colors
```
Expected: PASS.

- [ ] **Step 3: Run audit:contrast**

```bash
npm run audit:contrast
```
Expected: PASS (all 21 themes).

- [ ] **Step 4: Build Storybook**

```bash
npx storybook build --output-dir storybook-static
rm -rf storybook-static
```
Expected: success.

- [ ] **Step 5: Run dev server + manual quick-check**

```bash
npm run dev
```

Open `http://localhost:5173`, click ThemeSwitcher in header. Cycle through ALL 21 themes — verify:
- Each thumbnail loads
- Selecting a theme changes background image + colors
- No JavaScript errors in console
- ThemeSwitcher closes after selection
- localStorage persists across reload

If anything fails, identify which theme + commit a fix. Otherwise, kill dev server.

- [ ] **Step 6: No commit needed** unless fixes were applied. If fixes applied:

```bash
git add <fixed-files>
git commit -m "fix(themes): manual smoke test fixes"
```

---

# M15: PR + close

## Task B-25: Push branch + open PR

- [ ] **Step 1: Push**

```bash
git push -u origin feat/theme-system-iterace-b
```

- [ ] **Step 2: Open PR (if `gh` available)**

```bash
gh pr create --title "feat: Theme system Iterace B — 18 remaining themes + a11y audit" --body "$(cat <<'EOF'
## Summary
- 18 nových témat: sci-fi, vesmirna-lod, priroda, pergamen, nemrtvi, ctyri-zivly, vesmirna-bitva, hospoda, severske-runy, indiane, africke, arabsky-svet, kyberpunk, postapo, magie, mesic, slunce, zlaty-standard
- Theme gallery story (visual regression baseline)
- WCAG AA contrast audit script + fixes
- Final registry: všech 21 témat povinně registrovaných (Record<ThemeId, Theme>, no Partial)

## Spec
docs/superpowers/specs/2026-05-07-theme-system-design.md

## Plan
docs/superpowers/plans/2026-05-07-theme-system-iterace-b.md

## Test plan
- [ ] \`npm run test:run\` — všechny testy prošly
- [ ] \`npm run lint:colors\` — žádné hardcoded barvy
- [ ] \`npm run audit:contrast\` — WCAG AA splněno pro všech 21 témat
- [ ] \`npx storybook build\` — Storybook se postaví
- [ ] Manual: ThemeSwitcher cyklus přes všech 21 témat — každé loadne thumbnail + background + barvy

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

If `gh` not available, output the PR creation URL:
```
https://github.com/Tykyen/Projekt-Ikaros-FE/pull/new/feat/theme-system-iterace-b
```

- [ ] **Step 3: Final report**

Report back with:
- Total commits ahead of main (should be ~25)
- Test count (should be 35+ passing)
- WCAG AA status (all 21 pass)
- PR URL (or branch reference)

---

## Co dál po Iteraci B

Fáze 1.0 = **kompletně hotovo**. ✅

Roadmapa pokračuje fází 1.1 (Login formulář) — viz `docs/roadmap-fe.md`. Theme system je připraven pro:
- Fázi 5.0 — World themes (architektura už ready, jen vyplnit `world.themeId` v BE + WorldLayout)
- Custom themes (out of scope, future)
- Time-of-day automatic switching (out of scope)
