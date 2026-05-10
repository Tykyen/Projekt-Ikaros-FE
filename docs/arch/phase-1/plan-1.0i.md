# Plán 1.0i — Pergamen visual upgrade

**Datum:** 2026-05-10
**Status:** ⏳ Čeká na schválení
**Spec:** [`spec-1.0i-pergamen-upgrade.md`](spec-1.0i-pergamen-upgrade.md) v3 ✅
**Audit:** [`audit-1.0i-pergamen.md`](audit-1.0i-pergamen.md) — 3 BLOCKER + 6 HIGH zapracováno do specu (B3, H3, H4 padly po vizuální revizi assetů)
**Pořadí prací:** Pre-flight → Folder rename → Asset konverze → Tokens → Decorations → Mobile breakpoints → A11y polish → Test sweep

---

## 0. Pre-flight

### 0.1 Vstupní assety (assets-source/themes/pergament/) — STAV K 2026-05-10

| Asset | Status | Cílové rozměry |
|---|---|---|
| `logo.png` | ✅ dodáno | zachovat ~540×140 (logo banner) |
| `medailon.png` | ✅ dodáno | zachovat ~480×580 |
| `big-book.png` | ✅ dodáno | zachovat ~600×340 |
| `corner-tl.png` | ✅ dodáno | resize 256×256 |
| `icon-uvodnik.png` | ✅ dodáno | resize 96×96 |
| `icon-vytvorit-svet.png` | ✅ dodáno (svitek se stuhou) | resize 96×96 |
| `icon-diskuze.png` | ✅ dodáno | resize 96×96 |
| `icon-clanky.png` | ✅ dodáno (brk s kapkou) | resize 96×96 |
| `icon-galerie.png` | ✅ dodáno | resize 96×96 |
| `icon-napoveda.png` | ✅ dodáno | resize 96×96 |
| `icon-hospoda.png` | ✅ dodáno | resize 96×96 |
| `wax-seal.png` | ✅ dodáno | resize 96×96 |
| `bookmark.png` | ✅ dodáno | resize 96×320 (vertical) |
| `divider-seal.png` | ✅ dodáno | resize 32×32 |
| ~~iluminated-v.png~~ | ✅ **NEPOTŘEBA** (CSS-only `::first-letter`) | – |

**Public BG** `public/themes/backgrounds/pergamen.webp` ✅ existuje, neměníme.

### 0.2 Verifikace v kódu

- [x] `data-nav-key` atribut **už existuje** v `IkarosLayout.tsx:83` (NavItem) i `:150` (chat rooms)
- [x] Nav keys: `uvodnik`, `napoveda`, `diskuze`, `clanky`, `galerie`, `vytvorit-svet`, `hospoda` (chat sekce)
- [x] `<span className={s.titleAccent}>` **už existuje** v `DashboardPage.tsx:47` (žádný shared edit)
- [x] `pergamenTheme` je v registry (registry.ts:8 import, :34 mapping)
- [x] Cinzel + Lora + IM Fell English fonty — verifikovat v `theme.css` (krok 0)
- [x] **Žádný edit** v `IkarosLayout`, `IkarosCard`, `CornerOrnament`, `WelcomeHero`, shared komponentách

### 0.3 Akcepční podmínka regrese

20 ostatních témat (modré nebe, zlatý standard, sci-fi, bílá, vesmirna-lod, magie, priroda, …) **vizuálně identické** s pre-1.0i. Verifikace: `npm run dev` → manuálně cyklit dropdown switcher.

### 0.4 Audit-derived constraints (musí dodržet implementace)

| # | Pravidlo | Kde se ověří |
|---|---|---|
| C1 | Atmosférický overlay = **pouze darken**, žádné radial color tints (audit H2) | `decorations.css` sekce overlay |
| C2 | Big-book `opacity: 0.30` + `mix-blend-mode: multiply` (audit B1) | `decorations.css` welcome card |
| C3 | Welcome body krémový text PŘES big-book overlay → **WCAG ≥4.5:1** | DevTools color picker |
| C4 | Bookmark `position: absolute; top: 24px; right: -16px` (zvenku, audit B2) | `decorations.css` welcome card |
| C5 | Wax seal CTA **pouze na PŘIDAT NOVINKU**, ne na ZOBRAZIT VŠE (audit H5) | `decorations.css` CTA sekce |
| C6 | Iluminated V = **CSS-only** `::first-letter` na `welcomeHeading`, IM Fell English 3.5em | `decorations.css` heading sekce |
| C7 | Welcome `min-height: clamp(420px, 60vh, 720px)` | `decorations.css` welcome |
| C8 | Corner ornaments `pointer-events: none`, `z-index: 0` | `decorations.css` corners |
| C9 | Mobile: corner `display: none` v drawer mode | `decorations.css` mobile |
| C10 | Mobile (≤768px): big-book + bookmark + V drop-cap zmenšeno (V → 2.5em) | `decorations.css` mobile |
| C11 | Topbar buttony pod 768px = icon-only s `aria-label` | `decorations.css` mobile |
| C12 | `reducedMotion: 'safe'` v `pergamenTheme` objektu | `index.ts` |
| C13 | NavItem touch target ≥48px na mobile | `decorations.css` mobile |
| C14 | Focus visible: zlatý outline 2px + glow | `decorations.css` a11y |
| C15 | `--theme-text-muted: #b8a070` (audit ne #a09060 — WCAG fail) | `index.ts` |
| C16 | Symbol mapping `vytvorit-svet`=svitek, `clanky`=brk (audit H7 — reálný stav) | spec sekce 1.7 |

---

## 1. Pořadí commitů

| # | Změna | Soubory | Commit message |
|---|---|---|---|
| **1** | Folder rename `pergament` → `pergamen` | `assets-source/themes/pergament/` (12 PNG souborů) → `pergamen/` | `chore(themes/pergamen): krok 1.0i #1 — rename source folder pergament→pergamen` |
| **2** | Asset konverze (`themes:optimize` + nový `finalize-pergamen-assets.mjs`) | `public/themes/pergamen/decor/*.webp` (14 souborů) | `chore(themes/pergamen): krok 1.0i #2 — convert + resize source PNGs to webp` |
| **3** | Plný přepis `index.ts` (paleta + tokens + assety + reducedMotion) | `src/themes/themes/pergamen/index.ts` | `feat(themes/pergamen): krok 1.0i #3 — full token model rewrite` |
| **4** | Plný přepis `decorations.css` (chrome, corners, NavItem, topbar, welcome) | `src/themes/themes/pergamen/decorations.css` | `feat(themes/pergamen): krok 1.0i #4 — full decorations rewrite` |
| **5** | Mobile + tablet breakpointy (480/768/1024/1280px) | `src/themes/themes/pergamen/decorations.css` | `feat(themes/pergamen): krok 1.0i #5 — mobile + tablet breakpoints` |
| **6** | A11y polish — focus visible, reduced motion, scrollbar, drop-cap responzivita | `src/themes/themes/pergamen/decorations.css` | `feat(themes/pergamen): krok 1.0i #6 — a11y + drop-cap polish` |

**Po každém commitu:** spustit `npm run typecheck` (musí projít) + manuální zkontrolování v dev serveru.

---

## 2. Krok 1 — Folder rename (detail)

### 2.1 Operace

```powershell
# Z root directory
git mv assets-source/themes/pergament assets-source/themes/pergamen
```

### 2.2 Verifikace

```powershell
# Žádné zbylé reference na "pergament" v kódu / scriptech / docs
Select-String -Pattern "pergament" -Path "src/**/*.ts","src/**/*.tsx","scripts/**/*.mjs" -Recurse
# (Hits v docs/arch/phase-1/spec-1.0i + prompts-1.0i jsou OK — historický záznam.)
```

### 2.3 Po commitu

`git status` → `assets-source/themes/pergamen/` má 14 PNG, `pergament/` neexistuje.

---

## 3. Krok 2 — Asset konverze (detail)

### 3.1 Cílové soubory

Po `themes:optimize` + `finalize-pergamen-assets.mjs`:

| Zdroj (assets-source/themes/pergamen/) | Cíl (public/themes/pergamen/decor/) | Encode + resize |
|---|---|---|
| `logo.png` | `logo.webp` | zachovat orig (cwebp -q 92 -alpha_q 100) |
| `medailon.png` | `medailon.webp` | zachovat orig (cwebp -q 92 -alpha_q 100) |
| `big-book.png` | `big-book.webp` | zachovat orig (cwebp -q 90 -alpha_q 100) |
| `corner-tl.png` | `corner-tl.webp` | resize 256×256 + sharpen sigma 0.4 |
| `icon-uvodnik.png` | `icon-uvodnik.webp` | resize 96×96 + sharpen sigma 0.4 |
| `icon-vytvorit-svet.png` | `icon-vytvorit-svet.webp` | resize 96×96 + sharpen sigma 0.4 |
| `icon-diskuze.png` | `icon-diskuze.webp` | resize 96×96 + sharpen sigma 0.4 |
| `icon-clanky.png` | `icon-clanky.webp` | resize 96×96 + sharpen sigma 0.4 |
| `icon-galerie.png` | `icon-galerie.webp` | resize 96×96 + sharpen sigma 0.4 |
| `icon-napoveda.png` | `icon-napoveda.webp` | resize 96×96 + sharpen sigma 0.4 |
| `icon-hospoda.png` | `icon-hospoda.webp` | resize 96×96 + sharpen sigma 0.4 |
| `wax-seal.png` | `wax-seal.webp` | resize 96×96 + sharpen sigma 0.4 |
| `bookmark.png` | `bookmark.webp` | resize 96×320 (`fit: contain`) |
| `divider-seal.png` | `divider-seal.webp` | resize 32×32 + sharpen sigma 0.6 (mini, potřebuje extra ostrost) |

**Background `pergamen.webp`** — neměníme.
**Thumbnail `pergamen.webp`** v `public/themes/thumbnails/` — neexistuje, vytvořit z reference (nebo skip).

### 3.2 Pipeline

**Krok A:** `npm run themes:optimize` (existující skript) — vytvoří initial WebP konverze v `public/themes/pergamen/decor/` (zachová orig rozměry).

**Krok B:** Spustit nový `scripts/finalize-pergamen-assets.mjs` (klon `finalize-priroda-assets.mjs`):

```js
const TASKS = [
  { in: 'corner-tl.webp',     out: 'corner-tl.webp',     w: 256, h: 256 },
  { in: 'icon-uvodnik.webp',  out: 'icon-uvodnik.webp',  w: 96,  h: 96  },
  { in: 'icon-vytvorit-svet.webp', out: 'icon-vytvorit-svet.webp', w: 96, h: 96 },
  { in: 'icon-diskuze.webp',  out: 'icon-diskuze.webp',  w: 96,  h: 96  },
  { in: 'icon-clanky.webp',   out: 'icon-clanky.webp',   w: 96,  h: 96  },
  { in: 'icon-galerie.webp',  out: 'icon-galerie.webp',  w: 96,  h: 96  },
  { in: 'icon-napoveda.webp', out: 'icon-napoveda.webp', w: 96,  h: 96  },
  { in: 'icon-hospoda.webp',  out: 'icon-hospoda.webp',  w: 96,  h: 96  },
  { in: 'wax-seal.webp',      out: 'wax-seal.webp',      w: 96,  h: 96  },
  { in: 'bookmark.webp',      out: 'bookmark.webp',      w: 96,  h: 320, fit: 'contain' },
  { in: 'divider-seal.webp',  out: 'divider-seal.webp',  w: 32,  h: 32, sharper: true },
];
```

### 3.3 Akcepční podmínka

`ls public/themes/pergamen/decor/` → 14 `.webp` souborů (logo, medailon, big-book, corner-tl, 7× icon-*, wax-seal, bookmark, divider-seal). Žádný neexistuje > 200 KB (kromě big-book ~250 KB).

---

## 4. Krok 3 — `index.ts` přepis (detail)

Plný overwrite stávajícího `src/themes/themes/pergamen/index.ts` (51 řádků → cca 130 řádků dle vzoru `priroda`).

### 4.1 Struktura tokenů

Viz spec sekce 3 — **Tokens (CSS vars)**. Klíčové bloky:

```ts
import type { Theme } from '@/themes/types';

const decor = '/themes/pergamen/decor';

export const pergamenTheme: Theme = {
  id: 'pergamen',
  name: 'Pergamen',
  scope: 'both',
  atmosphere:
    'Klášterní skriptórium 13. století okem Tolkienova kronikáře — pergamen + dřevo + zlatá iluminace + burgundy pečetě',
  vars: {
    // Luxury overlay (audit H2 — pure darken, žádné color tints)
    '--theme-bg-overlay':
      'linear-gradient(180deg, rgba(20, 14, 4, 0.55) 0%, rgba(20, 14, 4, 0.72) 100%)',

    // Surfaces (tmavé dřevo)
    '--theme-surface':        'rgba(40, 26, 12, 0.84)',
    '--theme-surface-strong': 'rgba(28, 18, 8, 0.94)',
    '--theme-surface-soft':   'rgba(58, 38, 18, 0.55)',

    // Borders + accents (zlato + burgundy)
    '--theme-border':         'rgba(212, 169, 70, 0.62)',
    '--theme-border-soft':    'rgba(212, 169, 70, 0.30)',
    '--theme-border-burgundy':'rgba(138, 26, 16, 0.55)',

    // Text (audit C15 — muted #b8a070 ne #a09060)
    '--theme-text':            '#e8d8a0',
    '--theme-text-muted':      '#b8a070',
    '--theme-heading':         '#d4a946',
    '--theme-text-on-gold':    '#3d2914',
    '--theme-text-on-burgundy':'#f0e0b8',

    // Accents
    '--theme-accent-gold':       '#d4a946',
    '--theme-accent-gold-bright':'#f0c860',
    '--theme-accent-burgundy':   '#8a1a10',
    '--theme-accent-burgundy-bright': '#a83020',

    // Glows
    '--theme-glow-gold':         'rgba(212, 169, 70, 0.45)',
    '--theme-glow-gold-strong':  'rgba(212, 169, 70, 0.70)',
    '--theme-glow-burgundy':     'rgba(138, 26, 16, 0.40)',
    '--theme-shadow':            'rgba(20, 14, 4, 0.88)',

    // Nav hover/active
    '--theme-nav-hover-bg':   'rgba(138, 26, 16, 0.14)',
    '--theme-nav-active-bg':
      'linear-gradient(90deg, rgba(138, 26, 16, 0.45) 0%, rgba(40, 26, 12, 0.55) 100%)',

    // Legacy mapping
    '--bg-primary':       '#1a0e04',
    '--bg-secondary':     '#28190a',
    '--bg-card':          'var(--theme-surface)',
    '--accent':           'var(--theme-accent-burgundy)',
    '--accent-bright':    'var(--theme-accent-burgundy-bright)',
    '--accent-dim':       '#601008',
    '--accent-soft':      'var(--theme-border-soft)',
    '--text-primary':     'var(--theme-text)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       '#806040',
    '--border':           'var(--theme-border-soft)',
    '--border-subtle':    'rgba(212, 169, 70, 0.16)',
    '--border-strong':    'var(--theme-border)',
    '--success':              '#3a8a4e',
    '--success-soft':         'rgba(58, 138, 78, 0.14)',
    '--success-soft-border':  'rgba(58, 138, 78, 0.4)',
    '--warning':              '#d4a946',
    '--warning-soft':         'rgba(212, 169, 70, 0.14)',
    '--warning-soft-border':  'rgba(212, 169, 70, 0.4)',
    '--danger':               '#8a1a10',
    '--danger-soft':          'rgba(138, 26, 16, 0.14)',
    '--danger-soft-border':   'rgba(138, 26, 16, 0.4)',
    '--danger-focus-ring':    'rgba(138, 26, 16, 0.3)',
    '--info':                 'var(--theme-accent-gold)',
    '--text-on-accent':       'var(--theme-text-on-burgundy)',
    '--text-on-danger':       '#f0e0b8',
    '--bg-overlay':           'rgba(20, 14, 4, 0.7)',

    // Typography
    '--font-logo':    '"IM Fell English", "Cinzel", Georgia, serif',
    '--font-display': '"Cinzel", Georgia, serif',
    '--font-body':    '"Lora", "EB Garamond", Georgia, serif',
    '--font-script':  '"IM Fell English", "Lora", Georgia, serif',

    // Layout chrome
    '--header-h':            '56px',
    '--header-bg':            '#28190a',
    '--frame-pad-y':         '40px',
    '--frame-pad-x':         '18px',
    '--sidebar-w':           '280px',

    '--asset-logo-w':         '240px',
    '--asset-logo-w-mobile':  '180px',
    '--logo-img-display':     'block',
    '--logo-fallback-display':'none',

    // Asset URLs
    '--asset-logo':              `url('${decor}/logo.webp')`,
    '--asset-andel-medallion':   `url('${decor}/medailon.webp')`,
    '--asset-bigbook':           `url('${decor}/big-book.webp')`,
    '--asset-bookmark':          `url('${decor}/bookmark.webp')`,
    '--asset-wax-seal':          `url('${decor}/wax-seal.webp')`,
    '--asset-divider-seal':      `url('${decor}/divider-seal.webp')`,

    '--asset-corner':            `url('${decor}/corner-tl.webp')`,
    '--asset-corner-size':       '120px',
    '--asset-corner-size-mobile':'64px',
    '--frame-corner-inset':      '8px',

    // 7 unikátních pečetí
    '--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
    '--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
    '--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
    '--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
    '--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
    '--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
    '--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,
  },
  fonts: {
    logo: 'IM Fell English',
    display: 'Cinzel',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/pergamen.webp',
  background: '/themes/backgrounds/pergamen.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
```

### 4.2 Akcepční podmínka

`npm run typecheck` projde, žádné chyby v `Theme` typu.

---

## 5. Krok 4 — `decorations.css` přepis (detail)

Plný overwrite stávajícího `src/themes/themes/pergamen/decorations.css` (29 řádků → cca 650 řádků dle priroda vzoru).

### 5.1 Sekce (pořadí v souboru)

1. **Background-color fallback** — `[data-theme="pergamen"] { background-color: var(--bg-primary) }`
2. **Atmosférický overlay** — `::before` na shell, jen darken (audit H2)
3. **Topbar slim 56px** — dřevěná deska + zlatá hairline
4. **Logo banner** — `var(--asset-logo)` v topbaru
5. **Header buttons** — dřevěné cedulky se zlatým rámečkem + zlatý uppercase Cinzel
6. **Glass panely** — `[data-frame-panel]` tmavé dřevo + zlatý border + corner ornamenty
7. **Welcome card** — clamp height + **big-book** decorative layer (B1) + **iluminated V drop-cap** (CSS-only) + **bookmark** zvenku (B2) + medailon
8. **Andel medailon** — desktop 240×290, mobile 96×116
9. **Section title** — zlatý Cinzel + gradient rule s drobnou pečetí uprostřed (`divider-seal.webp`)
10. **NavItem (btn3d)** — dřevo gradient + burgundy active fill
11. **Pravý panel** — ThemeSwitcher trigger + empty hints + **wax seal** na PŘIDAT NOVINKU (H5)
12. **PJ badge** — zlatý + burgundy inner ring
13. **Welcome heading + signature** — italic IM Fell English se zlatou
14. **Nav ikony — 7 unikátních pečetí** přes `data-nav-key`
15. **Novinky panel** — wax seal CTA
16. **Focus visible** — zlatý ring
17. **Scrollbar styling**
18. **Tablet (≤1279px)** — menší corner
19. **Mobile (≤768px)** — corner mobile size, big-book + bookmark + V drop-cap zmenšeno, drawer bez corner, header icon-only
20. **Reduced motion**

### 5.2 Klíčové selektory (zkrácený výtah)

```css
/* Atmosférický overlay (C1) */
[data-theme="pergamen"][data-shell="ikaros"]::before {
  content: '';
  position: fixed;
  inset: 0;
  background: var(--theme-bg-overlay);
  pointer-events: none;
  z-index: 0;
}

/* Welcome card big-book (C2) */
[data-theme="pergamen"] [data-frame-panel="card"]::before {
  /* ::before už používá corner — pro big-book použijeme nový selektor */
}
[data-theme="pergamen"] [data-frame-panel="card"] [data-bigbook-layer] {
  /* Pokud takový element neexistuje, přidat jej do welcome card přes pseudo prvek nebo data-attr.
     Alternativa: vložit <img data-bigbook-layer> do DashboardPage, ale to porušuje "žádný shared edit".
     → ŘEŠENÍ: použijeme druhý ::before na child element (např. .welcomeBody) přes ::before */
}

/* Reálná implementace big-book přes ::after na welcome inner */
[data-theme="pergamen"] [data-frame-panel="card"]::after {
  /* už použito pro corner TR mirror. Konflikt! */
}
```

> ⚠️ **Implementační challenge**: priroda využívá `::before` (corner TL) + `::after` (corner TR mirror). Nemáme volný pseudo-element pro big-book na samotném panelu. **Řešení:**
>
> **Možnost A** (preferovaná, žádný shared edit): aplikovat big-book na **child** welcome card. Konkrétně welcome obsahuje wrapper `[class*="welcomeContent"]` nebo podobný. Použijeme `::before` na child.
>
> **Možnost B** (fallback): zabalit corner ornamenty do separátního pseudo-elementu pomocí `background-image` s multi-layer (corner TL + corner TR jako 2 background-images na 1 ::before). Pak ::after volný pro big-book.
>
> **Verifikace v krok 4**: nahlédnout do React komponenty welcome card (DashboardPage.tsx) a najít vhodný child wrapper. Pokud žádný neexistuje, použít Možnost B.

```css
/* Bookmark zvenku (C4) */
[data-theme="pergamen"] [data-frame-panel="card"] {
  position: relative;
  overflow: visible; /* aby bookmark mohl vyčuhovat */
}
[data-theme="pergamen"] [data-frame-panel="card"] [data-bookmark]::before {
  /* Stejné dilema — bez data-bookmark v DOM. Možnost: aplikovat na samotný card inner element */
}
```

> ⚠️ Druhý implementační challenge: bookmark potřebuje DOM hook. Pokud DOM neumožňuje, **fallback**: použít `<img>` nebo `::before` na some child element. Verifikace v krok 4 spolu s big-book.

```css
/* Iluminated V drop-cap (C6) — CSS-only, bezpečné */
[data-theme="pergamen"] [class*="welcomeHeading"]::first-letter,
[data-theme="pergamen"] h1::first-letter {
  font-family: var(--font-script);
  font-size: 3.5em;
  line-height: 0.85;
  color: var(--theme-accent-gold-bright);
  float: left;
  padding: 0 8px 0 0;
  margin-top: 4px;
  text-shadow: 0 0 8px var(--theme-glow-gold), 0 1px 0 rgba(0,0,0,0.4);
  -webkit-text-stroke: 0.5px var(--theme-accent-gold);
}

/* Wax seal CTA — pouze na PŘIDAT NOVINKU (C5) */
[data-theme="pergamen"] [class*="rightAddBtn"]::before,
[data-theme="pergamen"] [class*="addNovinkuBtn"]::before {
  content: '';
  display: inline-block;
  width: 24px;
  height: 24px;
  background-image: var(--asset-wax-seal);
  background-size: contain;
  background-repeat: no-repeat;
  margin-right: 8px;
  vertical-align: middle;
}
[data-theme="pergamen"] [class*="rightAddBtn"] [class*="plusIcon"],
[data-theme="pergamen"] [class*="addNovinkuBtn"] [class*="plusIcon"] {
  display: none; /* skrýt lucide + ikonu */
}

/* Section divider — pečeť uprostřed gradientu */
[data-theme="pergamen"] [class*="sectionTitle"]::after {
  content: '';
  display: block;
  margin: 6px auto 0;
  height: 12px;
  background:
    linear-gradient(90deg, transparent 0%, var(--theme-accent-gold) 35%, transparent 50%, var(--theme-accent-gold) 65%, transparent 100%) 0 50% / 100% 1px no-repeat,
    var(--asset-divider-seal) center center / 12px 12px no-repeat;
}

/* 7 pečetí přes data-nav-key (priroda pattern) */
[data-theme="pergamen"] [data-nav-key] [class*="navItemIcon"] {
  width: 22px;
  height: 22px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  filter: drop-shadow(0 0 3px var(--theme-glow-burgundy));
}
[data-theme="pergamen"] [data-nav-key] [class*="navItemIcon"] svg { display: none; }

[data-theme="pergamen"] [data-nav-key="uvodnik"]       [class*="navItemIcon"] { background-image: var(--asset-icon-uvodnik); }
[data-theme="pergamen"] [data-nav-key="vytvorit-svet"] [class*="navItemIcon"] { background-image: var(--asset-icon-vytvorit-svet); }
[data-theme="pergamen"] [data-nav-key="diskuze"]       [class*="navItemIcon"] { background-image: var(--asset-icon-diskuze); }
[data-theme="pergamen"] [data-nav-key="clanky"]        [class*="navItemIcon"] { background-image: var(--asset-icon-clanky); }
[data-theme="pergamen"] [data-nav-key="galerie"]       [class*="navItemIcon"] { background-image: var(--asset-icon-galerie); }
[data-theme="pergamen"] [data-nav-key="napoveda"]      [class*="navItemIcon"] { background-image: var(--asset-icon-napoveda); }
[data-theme="pergamen"] [data-nav-key="hospoda"]       [class*="navItemIcon"] { background-image: var(--asset-icon-hospoda); }
```

### 5.3 Akcepční podmínka

- `npm run dev` → přepnout na pergamen → vizuálně srovnatelné s obrázkem 2 z zadání
- 7 pečetí viditelných v sidebar, každá rozlišitelná
- Iluminated V drop-cap viditelné v „Vítej" nadpisu (zlaté, IM Fell English, drop-cap pozice)
- Bookmark visí zvenku TR welcome card, žádná kolize s corner
- Wax seal vlevo „PŘIDAT NOVINKU" tlačítka

---

## 6. Krok 5 — Mobile + tablet breakpointy

Sekce 18-19 v decorations.css.

### 6.1 Tablet (1024–1279px)
- Corner ornament redukce: `--asset-corner-size: 96px` na pravém sidebaru
- Big-book scale 80% (`width: clamp(360px, 65%, 480px)`)

### 6.2 Mobile (≤768px)
- Corner ornament: `--asset-corner-size: 64px`
- Big-book: `display: none`
- Bookmark: `display: none`
- Iluminated V drop-cap: `font-size: 2.5em`
- Medailon: `width: 96px; height: 116px`
- Drawer mode: corner `display: none` v drawer
- Header buttons: icon-only s `aria-label`
- NavItem: `min-height: 48px`
- NavItem icon: `width: 18px; height: 18px`

### 6.3 Mobile (≤480px)
- Tyky + Odhlásit do hamburger menu (existující IkarosLayout pattern)

### 6.4 Akcepční podmínka

DevTools responsive mode na 320/375/768/1024/1280 → žádný overflow, žádný overlap, text čitelný.

---

## 7. Krok 6 — A11y polish

### 7.1 Focus visible
```css
[data-theme="pergamen"] [class*="navItem"]:focus-visible,
[data-theme="pergamen"] [class*="btn3d"]:focus-visible,
[data-theme="pergamen"] [class*="showAllLink"]:focus-visible,
[data-theme="pergamen"] [class*="rightAddBtn"]:focus-visible,
[data-theme="pergamen"] [class*="headerBtn"]:not([class*="headerBtnIcon"]):not([class*="headerBtnLabel"]):focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px var(--bg-primary),
    0 0 0 4px var(--theme-accent-gold),
    0 0 14px var(--theme-glow-gold-strong);
}
```

### 7.2 Reduced motion
```css
@media (prefers-reduced-motion: reduce) {
  [data-theme="pergamen"] * {
    animation: none !important;
    transition: none !important;
  }
}
```

### 7.3 Scrollbar
```css
[data-theme="pergamen"] [data-frame-panel] {
  scrollbar-color: var(--theme-accent-gold) var(--theme-surface);
  scrollbar-width: thin;
}
[data-theme="pergamen"] [data-frame-panel]::-webkit-scrollbar { width: 8px; }
[data-theme="pergamen"] [data-frame-panel]::-webkit-scrollbar-track { background: var(--theme-surface); }
[data-theme="pergamen"] [data-frame-panel]::-webkit-scrollbar-thumb { background: var(--theme-accent-gold); border-radius: 4px; }
```

### 7.4 Akcepční podmínka

- Lighthouse a11y score ≥95
- Tab navigace přes všechny interaktivní prvky → vidíme zlatý focus ring
- DevTools `prefers-reduced-motion: reduce` → žádné transitions

---

## 8. Test plán (po commitech)

### 8.1 Manuální QA — viewport sweep
| Viewport | Co kontrolovat |
|---|---|
| 1440×900 | Plný layout vs. obrázek 2 mockup |
| 1280×800 | Corner ornamenty 120px, big-book 600px, bookmark zvenku |
| 1024×768 | Tablet — corner 96px na pravém sidebaru |
| 768×1024 | Mobile začátek — big-book hidden, bookmark hidden, V 2.5em |
| 375×667 | Mobile — drawer, header icon-only, nav touch ≥48px |
| 320×568 | Mobile small — hamburger menu, vše čitelné |

### 8.2 WCAG audit
Chrome DevTools → Lighthouse → Accessibility → score ≥95
Manuální color picker na:
- Welcome body PŘES big-book → ≥4.5:1
- Header button text → ≥4.5:1
- Section title → ≥3:1
- NavItem klid + active → ≥4.5:1

### 8.3 Regression test
Přepnout v ThemeSwitcher na 5 random skinů: priroda → vesmirna-lod → sci-fi → kyberpunk → magie → modre-nebe.
Každý vizuálně identický s pre-1.0i.

### 8.4 Mobile-desktop sweep
Po dokončení implementace spustit skill `mobil-desktop` (memory rule: každá UI úprava).

---

## 9. Risk register (impl-specific)

| Riziko | Pravděpodobnost | Mitigace |
|---|---|---|
| **Big-book DOM hook** — welcome card nemá vhodný child wrapper pro big-book pseudo-element | Vysoká | Možnost B v krok 4 (multi-layer ::before pro corner). Pokud i to selže, edit DashboardPage.tsx (jen 1 atribut) |
| **Bookmark DOM hook** — stejné jako big-book | Vysoká | Stejná strategie |
| **`::first-letter` nefunguje na inline `<h1>` s `<span>`** uvnitř | Střední | Test v dev. Fallback: aplikovat `::first-letter` na `<span>` uvnitř, nebo split-span via DashboardPage (1 atribut edit) |
| **Wax seal `::before` na rightAddBtn** koliduje s existujícím lucide ikonou v komponentě | Střední | Hide lucide přes `[class*="plusIcon"] { display: none }`, viz dříve |
| **Mobile big-book hidden** ale `<img>` element zůstane v DOM = zbytečný download | Nízká | Použít `display: none` na container; image nestáhne se až do první visible state — OR lazy load |
| **Folder rename git mv** na Windows může selhat při file lock | Nízká | Před rename: zavřít všechny editory, retry, fallback `git rm` + `git add` |
| **`themes:optimize` nemusí podporovat decor pipeline** | Nízká | Verifikovat v krok 0, fallback ad-hoc node skript |

---

## 10. Time estimate

| Krok | Estimovaný čas |
|---|---|
| Pre-flight | 10 min |
| 1. Folder rename | 5 min |
| 2. Asset konverze (script + verify) | 20 min |
| 3. Tokens rewrite | 15 min |
| 4. Decorations rewrite | 90 min (nejvíc — DOM hook diskuze, big-book řešení) |
| 5. Mobile breakpoints | 30 min |
| 6. A11y polish | 20 min |
| Test sweep | 30 min |
| **CELKEM** | **~3.5 hod** |

---

## 11. Out of scope (znovu připomínka)

- Žádný edit shared komponent (`IkarosLayout`, `IkarosCard`, `CornerOrnament`, `WelcomeHero`, `DashboardPage`) **bez explicitní diskuze**
- Žádný edit shared CSS modulů
- Žádný edit `theme.css` (fonts už nahrané)
- Žádné nové stránky / komponenty
- Žádný edit BG image, žádný iluminated V asset (CSS-only)

---

## 12. Po implementaci

1. ✅ `git status` — všech 6 commits clean
2. ✅ `npm run typecheck` — 0 errors
3. ✅ `npm run dev` → manuální QA dle sekce 8
4. ✅ Mobile-desktop sweep (skill `mobil-desktop`)
5. ✅ Screenshoty — uložit do `docs/arch/phase-1/screenshots-1.0i/` (volitelné)
6. ✅ Označit spec status jako ✅ Implementováno
7. ✅ Vytvořit feature branch + push (pokud user souhlasí)
