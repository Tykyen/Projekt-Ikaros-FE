# Plán 1.0h — Příroda visual upgrade

**Datum:** 2026-05-09
**Status:** ⏳ Čeká na schválení
**Spec:** [`spec-1.0h-priroda-upgrade.md`](spec-1.0h-priroda-upgrade.md) ✅
**Audit:** [`audit-1.0h-priroda.md`](audit-1.0h-priroda.md) — 1 BLOCKER (B1) + 9 HIGH zapracováno do specu
**Pořadí prací:** Pre-flight → Asset konverze → Tokens → Decorations → Test → Mobil-desktop sweep

---

## 0. Pre-flight

### 0.1 Vstupní assety (assets-source/themes/priroda/)

- [x] `logo.png` ✅ dodáno
- [x] `medailon.png` ✅ dodáno
- [x] `corner-tl.png` ✅ dodáno
- [x] `icon-leaf.png` ✅ dodáno
- [x] `icon-hospoda.png` ✅ dodáno
- [x] `icon-uvodnik.png` ✅ dodáno
- [ ] `icon-napoveda.png` ⚠️ **REGENERACE NUTNÁ** (audit B1 — 3D render outlier). Updated prompt v `_asset-prompts.md`.
- [x] `assets-source/themes/backgrounds/priroda.png` ✅ existuje
- [x] `assets-source/themes/references/priroda.png` ✅ existuje (cíl mockup)

### 0.2 Verifikace v kódu

- [x] `data-nav-key` atribut **už existuje** v `IkarosLayout.tsx:83` (NavItem) i `:150` (chat rooms)
- [x] Nav keys: `uvodnik`, `napoveda`, `diskuze`, `clanky`, `galerie`, `vytvorit-svet`, `hospoda` (chat sekce)
- [x] `<span className={s.titleAccent}>` **už existuje** v `DashboardPage.tsx:47` (žádný shared edit)
- [x] `prirodaTheme` je v registry (registry.ts:7), thumbnail path nastaven
- [x] Cinzel + Lora + IM Fell English fonty — verifikovat v `index.html` (krok 1)
- [x] Žádný edit v `IkarosLayout`, `IkarosCard`, `CornerOrnament`, `WelcomeHero`, shared komponentách

### 0.3 Akcepční podmínka regrese

20 ostatních témat (modré nebe, zlatý standard, sci-fi, bílá, vesmirna-lod, magie, …) **vizuálně identické** s pre-1.0h. Verifikace: `npm run dev` → manuálně cyklit dropdown switcher.

### 0.4 Audit-derived constraints (musí dodržet implementace)

| # | Pravidlo | Kde se ověří |
|---|---|---|
| C1 | Topbar zlaté cedulky: TMAVÝ text `#3d2914` | `decorations.css` sekce topbar |
| C2 | `--theme-text-muted: #b8a070` (ne `#a09060` — WCAG fail) | `index.ts` |
| C3 | Welcome `min-height: clamp(420px, 60vh, 720px)` | `decorations.css` sekce welcome |
| C4 | Corner ornaments `pointer-events: none`, `z-index: 0` | `decorations.css` sekce corners |
| C5 | Section title decoration **CSS-only**, ne `❦` glyph | `decorations.css` sekce section-title |
| C6 | Mobile: corner `display: none` v drawer mode | `decorations.css` mobile sekce |
| C7 | Topbar buttony pod 768px = icon-only s `aria-label` | `decorations.css` mobile sekce |
| C8 | `reducedMotion: 'safe'` v `prirodaTheme` objektu | `index.ts` |
| C9 | NavItem touch target ≥48px na mobile | `decorations.css` mobile sekce |
| C10 | `icon-leaf-32.webp` existuje pro mobile | konverze pipeline |
| C11 | Focus visible na zlatých cedulkách: emerald outline fallback | `decorations.css` accessibility sekce |

---

## 1. Pořadí commitů

| # | Změna | Soubory | Commit message |
|---|---|---|---|
| **1** | Konverze PNG→WEBP (manuální nebo `themes:optimize` pokud script existuje) | `public/themes/priroda/decor/*.webp` + `public/themes/backgrounds/priroda.webp` + `public/themes/thumbnails/priroda.webp` | `chore(themes/priroda): krok 1.0h #1 — convert source PNGs to webp` |
| **2** | Plný přepis `index.ts` (paleta + tokens + assety + reducedMotion) | `src/themes/themes/priroda/index.ts` | `feat(themes/priroda): krok 1.0h #2 — full token model rewrite` |
| **3** | Plný přepis `decorations.css` (chrome, corners, NavItem, topbar, hero-accent) | `src/themes/themes/priroda/decorations.css` | `feat(themes/priroda): krok 1.0h #3 — full decorations rewrite` |
| **4** | Mobile + tablet breakpointy (768px, 1024px, 1280px) v decorations | `src/themes/themes/priroda/decorations.css` | `feat(themes/priroda): krok 1.0h #4 — mobile + tablet breakpoints` |
| **5** | Accessibility polish — focus visible, reduced motion, scrollbar | `src/themes/themes/priroda/decorations.css` | `feat(themes/priroda): krok 1.0h #5 — a11y polish` |
| **6** | (Optional, po regeneraci `icon-napoveda`) — nahradit 1 asset | `public/themes/priroda/decor/icon-napoveda.webp` | `chore(themes/priroda): krok 1.0h #6 — regen icon-napoveda` |

---

## 2. Krok 1 — Asset konverze (detail)

### 2.1 Cílové soubory

| Zdroj | Cíl | Encode |
|---|---|---|
| `assets-source/themes/priroda/logo.png` | `public/themes/priroda/decor/logo.webp` | `cwebp -q 92 -alpha_q 100` |
| `assets-source/themes/priroda/medailon.png` | `public/themes/priroda/decor/medallion.webp` | `cwebp -q 92 -alpha_q 100` |
| `assets-source/themes/priroda/corner-tl.png` | `public/themes/priroda/decor/corner-tl.webp` | `cwebp -q 90 -alpha_q 100` |
| `assets-source/themes/priroda/icon-leaf.png` | `public/themes/priroda/decor/icon-leaf-64.webp` | resize 64×64 + sharpen + `cwebp -q 90 -alpha_q 100` |
| `assets-source/themes/priroda/icon-leaf.png` | `public/themes/priroda/decor/icon-leaf-32.webp` | resize 32×32 + USM + `cwebp -q 90 -alpha_q 100` |
| `assets-source/themes/priroda/icon-hospoda.png` | `public/themes/priroda/decor/icon-hospoda.webp` | resize 96×96 + `cwebp -q 90 -alpha_q 100` |
| `assets-source/themes/priroda/icon-uvodnik.png` | `public/themes/priroda/decor/icon-uvodnik.webp` | resize 96×96 + `cwebp -q 90 -alpha_q 100` |
| `assets-source/themes/priroda/icon-napoveda.png` | `public/themes/priroda/decor/icon-napoveda.webp` | resize 96×96 + `cwebp -q 90 -alpha_q 100` |
| `assets-source/themes/backgrounds/priroda.png` | `public/themes/backgrounds/priroda.webp` | resize max 1920w + `cwebp -q 88` |
| `assets-source/themes/references/priroda.png` | `public/themes/thumbnails/priroda.webp` | resize 480×270 + `cwebp -q 80` |

### 2.2 Pipeline volba

- **A) Existující script** `scripts/optimize-theme-assets.mjs` — pokud podporuje `priroda` target, použít.
- **B) Manuálně přes ImageMagick + cwebp** (Windows: stáhnout libwebp binary).
- **C) Sharp (Node)** — pokud script nepokrývá, napsat ad-hoc Node script v `scripts/`.

→ **Implementace ověří dostupnost (A) jako první**. Pokud script neumí priroda → rozšíříme jeho config nebo spustíme (C).

---

## 3. Krok 2 — `index.ts` přepis

Plný overwrite stávajícího `src/themes/themes/priroda/index.ts` (51 řádků → cca 130 řádků dle vzoru `vesmirna-lod`).

### 3.1 Struktura

```ts
import type { Theme } from '@/themes/types';
const decor = '/themes/priroda/decor';

export const prirodaTheme: Theme = {
  id: 'priroda',
  name: 'Příroda',
  scope: 'both',
  atmosphere: 'Zakletý prastarý les při západu slunce — dřevo, břečťan, smaragdové krystaly, zlato',
  vars: {
    // ── 1. Atmosférický overlay ──
    // ── 2. Glass surfaces ──
    // ── 3. Borders ──
    // ── 4. Text ──
    // ── 5. Accents (emerald + gold) ──
    // ── 6. Glow ──
    // ── 7. Nav hover/active ──
    // ── 8. Legacy mapping ──
    // ── 9. Typography ──
    // ── 10. Layout chrome ──
    // ── 11. Asset URLs ──
  },
  fonts: {
    logo: 'Cinzel',
    display: 'Cinzel',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/priroda.webp',
  background: '/themes/backgrounds/priroda.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
```

### 3.2 Detail tokenů — viz spec sekce 2.1–2.5 (po audit fixes)

---

## 4. Krok 3 — `decorations.css` přepis

Plný overwrite. Struktura:

```css
/* ── Příroda — zakletý prastarý les ── */

/* 1. Background + atmosphere */
[data-theme="priroda"] {
  background-image: var(--theme-bg-overlay), url(...);
  background-color: var(--bg-primary);
}

/* 2. Topbar (slim 56px, dřevo, zlaté cedulky s tmavým textem) */
[data-theme="priroda"] .topbar { ... }
[data-theme="priroda"] .topbar-button { ... }

/* 3. Sidebar panel base + corner ornaments (raster + scaleX/Y mirror) */
[data-theme="priroda"] .panel { position: relative; ... }
[data-theme="priroda"] .panel::before { /* corner TL */ }
[data-theme="priroda"] .panel::after  { /* corner TR (scaleX -1) */ }
/* BL + BR via wrapper or absolute <i> elements */

/* 4. Section title (CSS-only zlatý gradient rule s leafy ::before/::after) */
[data-theme="priroda"] .section-title { ... }
[data-theme="priroda"] .section-title::after { /* zlatý gradient line */ }

/* 5. NavItem (default leaf icon + speciální 3) */
[data-theme="priroda"] [data-nav-key]::before { background-image: var(--asset-icon-leaf); }
[data-theme="priroda"] [data-nav-key="hospoda"]::before  { background-image: var(--asset-icon-hospoda); }
[data-theme="priroda"] [data-nav-key="uvodnik"]::before  { background-image: var(--asset-icon-uvodnik); }
[data-theme="priroda"] [data-nav-key="napoveda"]::before { background-image: var(--asset-icon-napoveda); }
/* aktivní stav, hover, focus */

/* 6. Welcome card (clamp height, medailon, hero-accent span) */
[data-theme="priroda"] .welcome-card { min-height: clamp(420px, 60vh, 720px); ... }
[data-theme="priroda"] .titleAccent { font-family: var(--font-script); font-style: italic; color: var(--theme-accent-gold); }

/* 7. Buttony (PŘIDAT NOVINKU, ZOBRAZIT VŠE) */
/* 8. Scrollbar styling */
/* 9. Focus visible (emerald fallback na zlatých cedulkách) */
/* 10. Reduced motion */
/* 11. Mobile breakpoints (1280, 1024, 768, 480) */
```

---

## 5. Krok 4–5 — Breakpointy + a11y

Detail dle specu sekce 5 + 7b.

---

## 6. Test (krok 6)

### 6.1 Manuální checklist

- [ ] `npm run dev` → dashboard s `data-theme="priroda"` vizuálně shoduje s `references/priroda.png` (±10%)
- [ ] Cyklit přes všech 21 témat v dropdownu — žádné regrese, switching plynulý
- [ ] Resize 1920 → 1280 → 1024 → 768 → 480 → 360 — layout neumírá, corner ornaments zmenšené, sidebary do drawer dle plánu
- [ ] Tab navigace — focus visible na všech NavItem + topbar buttonech (emerald outline kde zlatý glow zmizí)
- [ ] DevTools → Rendering → Emulate `prefers-reduced-motion: reduce` — žádné transitions
- [ ] DevTools → Lighthouse Accessibility ≥ 95 (kontrasty)

### 6.2 Skill `mobil-desktop`

Per project rule: po každé grafické úpravě UI použít skill `mobil-desktop`. Spustím po commitech 1–5.

---

## 7. Risk register

| Risk | Mitigace |
|---|---|
| `optimize-theme-assets.mjs` neumí priroda target | Rozšířit config, fallback na manuální cwebp |
| Corner ornament BL+BR vyžaduje wrapping element a panely takovou strukturu nemají | Použít absolutní `<i>` divy v `decorations.css` přes `::before`/`::after` na inner element, nebo akceptovat že máme jen TL+TR (2 rohy stačí pro vizuální dojem) |
| Cinzel font není v `index.html` jako Google Font | Přidat link tag, scope na `font-display: swap` |
| `data-nav-key="hospoda"` je v chat sekci, ne v hlavní nav — selektor stejný, ale CSS na něj musí být `[data-theme="priroda"] .chat-list [data-nav-key="hospoda"]` (nebo univerzální `[data-nav-key="hospoda"]::before` který chytí oboje) | Univerzální selektor + scope check |
| `icon-napoveda` regenerace nedorazí včas | Skin půjde live s aktuálním (3D) napovedou; commit #6 nahradí — žádný blocker pro merge |

---

## 8. Definition of Done

Per spec sekce 8 + audit constraints C1–C11. Klíčové:

- [ ] DoD specu splněn
- [ ] C1–C11 audit constraints ověřeny
- [ ] `mobil-desktop` skill bez nálezů
- [ ] 20 ostatních témat regrese-free (manuální QA)
- [ ] Žádný `git diff` v `src/shared`, `src/app/layout`, `WelcomeHero` ekvivalent
