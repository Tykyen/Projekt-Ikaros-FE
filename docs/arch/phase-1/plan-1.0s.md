# Plán 1.0s — Kyberpunk visual upgrade

**Datum:** 2026-05-11
**Spec:** [`spec-1.0s-kyberpunk-upgrade.md`](spec-1.0s-kyberpunk-upgrade.md) 🟡 ke schválení společně s tímto plánem
**Asset prompty:** ❌ **žádné** — kyberpunk používá inline SVG, ne AI gen WEBP
**Branch:** `main` (přímý commit po dokončení, dle vzoru `1.0p`/`1.0q`/`1.0r`)
**Single PR** — kompletní skin v jednom kroku

---

## 0. Pre-flight ✅

| Item | Status | Poznámka |
|---|---|---|
| 3 PNG zdrojové assety | ✅ | `assets-source/themes/kyberpunk/{logo,medailon}.png` + `assets-source/themes/backgrounds/kyberpunk.png` |
| Vizuální audit dodaných assetů | ✅ | Logo + medailon konzistentní HUD neon styling, background cinematic tier-1 (megalopole + fénix hologram) |
| Layout audit (`IkarosLayout.tsx`) | ⏳ | Ověřit, že pravý panel umí 5 sekcí (administrace + světy + diskuze + 2× oblíbené) |
| `PanelCorners` injectuje `<CornerOrnament position="tl\|tr\|bl\|br" />` | ⏳ | Ověřit, hook pro corner-bracket inline SVG |
| Frontend-design audit | ✅ | 2026-05-11, schválen Akihabara/HK 2099 noční déšť direction (street culture, ne sterilní military sci-fi) |
| User otázky (BG / section-coloring / rain / glitch) | ✅ | A / C / B / B (2026-05-11) |
| Inline SVG approach schválen | ✅ | 2026-05-11, žádné AI gen WEBP, 0 ChatGPT prompts |
| Spec schválen | 🟡 | Ke schválení s tímto plánem |

**Assety celkem (3):**

| Asset | Zdroj | Cíl | Status |
|---|---|---|---|
| `logo.webp` | `assets-source/themes/kyberpunk/logo.png` | `public/themes/kyberpunk/decor/logo.webp` | ⏳ konvert |
| `medailon.webp` | `assets-source/themes/kyberpunk/medailon.png` | `public/themes/kyberpunk/decor/medailon.webp` | ⏳ konvert |
| `kyberpunk.webp` (BG) | `assets-source/themes/backgrounds/kyberpunk.png` | `public/themes/backgrounds/kyberpunk.webp` | ⏳ konvert (1920×1080 cover) |

**Inline SVG vars (22 — všechny v `index.ts`, žádné externí soubory):**

| Var | Účel |
|---|---|
| `--asset-corner-bracket` | cyan+magenta HUD L-bracket (master TL, 4× per panel přes scaleX/Y mirror) |
| `--asset-rain-strip` | vertikální sloupec padajících CJK + binárních znaků (data-uri SVG s repeat-y) |
| `--asset-cjk-light` | 光 — světlo (NAVIGACE) |
| `--asset-cjk-universe` | 宇 — vesmír (VESMÍRY) |
| `--asset-cjk-voice` | 声 — hlas (CHAT) |
| `--asset-cjk-order` | 制 — řád (ADMINISTRACE) |
| `--asset-cjk-world` | 界 — svět (MOJE SVĚTY) |
| `--asset-cjk-talk` | 話 — rozhovor (MOJE DISKUZE) |
| `--asset-cjk-text` | 文 — text (OBLÍBENÉ ČLÁNKY) |
| `--asset-cjk-image` | 画 — obraz (OBLÍBENÉ OBRÁZKY) |
| `--asset-icon-uvodnik` | domeček neon outline glyph |
| `--asset-icon-vytvorit-svet` | globus s meridian linkami |
| `--asset-icon-diskuze` | speech bubble s 3 tečkami |
| `--asset-icon-clanky` | scroll/datapad glyph |
| `--asset-icon-galerie` | hologram krystal/diamond |
| `--asset-icon-napoveda` | query mark glyph |
| `--asset-icon-hospoda` | neon beer glass (Dimenzionální hospoda) |
| `--asset-icon-administrace` | gear/admin glyph |
| `--asset-icon-moje-svety` | multi-globe glyph |
| `--asset-icon-moje-diskuze` | multi-bubble glyph |
| `--asset-icon-oblibene-clanky` | pin+scroll glyph |
| `--asset-icon-oblibene-obrazky` | pin+hologram glyph |
| `--asset-signature-script` | administrator signature kaligrafie SVG path (self-draw stroke-dasharray) |
| `--asset-plus-neon` | neon „+" glyph pro „přidat" tlačítka |

(Reálně 24 vars; tabulka výše zobrazuje 24 řádků — některé inline SVG mohou sdílet helper template literal v index.ts.)

---

## 1. Kroky implementace

### Krok 1 — Konvert PNG → WEBP (jen 3 raster assety)

**1.1** Spustit existující pipeline:
```bash
npm run themes:optimize
```

To zpracuje:
- `assets-source/themes/kyberpunk/logo.png` → `public/themes/kyberpunk/decor/logo.webp`
- `assets-source/themes/kyberpunk/medailon.png` → `public/themes/kyberpunk/decor/medailon.webp`
- `assets-source/themes/backgrounds/kyberpunk.png` → `public/themes/backgrounds/kyberpunk.webp` (1920×1080 cover)

**Žádný `finalize-kyberpunk-assets.mjs` skript NETVOŘÍME** — pro kyberpunk není potřeba (nemáme AI gen ornamenty/ikony k resize).

**Verify:**
```bash
ls public/themes/kyberpunk/decor/        # → logo.webp, medailon.webp
ls public/themes/backgrounds/kyberpunk.webp   # → existuje, ~200–400 KB
```

---

### Krok 2 — Google Fonts: doplnit v `index.html`

V [`index.html`](../../../index.html) ověřit, zda existující Google Fonts URL obsahuje 3 nové fonty pro Kyberpunk:

- `Audiowide` (logo — již potenciálně bundled v původním kyberpunk skinu, ověřit)
- `Bebas+Neue` (display headings)
- `Share+Tech+Mono` (body + mono)

**Akce:** Grep `index.html` na tyto family, doplnit chybějící do existující `<link>` URL (mergovat parametry do jednoho linku, ne přidat nový tag).

Pozn.: původní kyberpunk skin importoval `Orbitron`, `Exo 2`, `Rajdhani`, `Roboto`, `Inter` — pokud nejsou potřeba pro jiné skiny, lze ponechat (decline-deletes only). Změnou stávajícího `index.ts` přepneme defaulty na nové fonty, staré zůstanou pro případné použití jinde.

---

### Krok 3 — `src/themes/themes/kyberpunk/index.ts` — kompletní přepis

Velikost: ~250–280 řádků (z ~50). Většina objemu = inline SVG data-uri vars.

#### 3.1 Header komentář
```ts
/**
 * Kyberpunk — Neo-Akihabara 2099, noční ulice v dešti.
 *
 * Streetová kultura, multibarevné neony, mokré dlažby + neon odlesky.
 * Section-color-coded navigace (6 barev), broken neon flicker, RGB-split
 * chromatic aberration, sparse typografický rain v edge strips, CJK watermarks.
 *
 * Spec: docs/arch/phase-1/spec-1.0s-kyberpunk-upgrade.md
 * Plan: docs/arch/phase-1/plan-1.0s.md
 *
 * Žádné AI gen WEBP — všechny ornamenty inline SVG data-uri.
 */
```

#### 3.2 Base properties
- `id: 'kyberpunk'` — zachovat
- `name: 'Kyberpunk'` — zachovat
- `scope: 'both'` — zachovat
- `atmosphere:` — přepsat na `'Kyberpunk — noční ulice Neo-Akihabary 2099, megalopole + fénix hologram + sparse digital rain + multibarevné neon ceduly + broken neon flicker'`
- `reducedMotion: 'safe'` (4 animace mají reduced-motion fallback — rain, flicker, RGB-split, signature self-draw)
- `thumbnail: '/themes/thumbnails/kyberpunk.webp'` — zachovat (existuje, regenerace post-1.0s)
- `background: '/themes/backgrounds/kyberpunk.webp'` — zachovat (přepíše se novým z user dodal)

#### 3.3 Přepsat `vars` — všechny tokens

**Smazat staré legacy `--bg-*`, `--accent-*` přímé hex hodnoty.**

**Nové tokens (skupiny):**

```ts
vars: {
  // Background vrstvy
  '--bg-primary':       '#08051a',  // deep midnight blue-purple
  '--bg-secondary':     '#0d0a25',
  '--bg-card':          '#110c2e',
  '--bg-card-hover':    '#1a1140',
  '--bg-overlay':       'rgba(8, 5, 26, 0.80)',

  // Primary brand (logo-konzistentní)
  '--accent':           '#00f0ff',  // electric cyan — primary
  '--accent-bright':    '#5cffff',
  '--accent-dim':       '#008090',
  '--accent-soft':      'rgba(0, 240, 255, 0.15)',

  // Secondary primary (logo-konzistentní)
  '--magenta':          '#ff0080',  // hot pink — secondary
  '--magenta-bright':   '#ff5cb0',
  '--magenta-dim':      '#800040',
  '--magenta-soft':     'rgba(255, 0, 128, 0.15)',

  // Section accents (pro 8 sekcí + 6 nav items)
  '--purple':           '#b400ff',
  '--green':            '#00ff80',
  '--yellow':           '#c8ff00',
  '--pink':             '#ff60d0',

  // Text
  '--text-primary':     '#e4f7ff',
  '--text-secondary':   '#7a90b8',
  '--text-muted':       '#3a4060',
  '--text-on-accent':   '#04101a',
  '--text-on-danger':   '#050508',

  // Borders
  '--border':           '#1f1840',
  '--border-subtle':    '#0d0a25',
  '--border-strong':    '#ff0080',

  // Status
  '--success':          '#00ff80',
  '--warning':          '#c8ff00',
  '--danger':           '#ff2050',
  '--info':             '#00f0ff',
  '--success-soft':         'rgba(0, 255, 128, 0.12)',
  '--success-soft-border':  'rgba(0, 255, 128, 0.40)',
  '--warning-soft':         'rgba(200, 255, 0, 0.12)',
  '--warning-soft-border':  'rgba(200, 255, 0, 0.40)',
  '--danger-soft':          'rgba(255, 32, 80, 0.16)',
  '--danger-soft-border':   'rgba(255, 32, 80, 0.40)',
  '--danger-focus-ring':    'rgba(255, 32, 80, 0.30)',

  // Glow utility tokens
  '--glow-cyan':        '0 0 8px rgba(0, 240, 255, 0.85)',
  '--glow-magenta':     '0 0 8px rgba(255, 0, 128, 0.85)',
  '--glow-cyan-strong': '0 0 16px rgba(0, 240, 255, 1.0)',
  '--glow-magenta-strong': '0 0 16px rgba(255, 0, 128, 1.0)',

  // Atmosférický overlay (BG je už cinematic-dramatic)
  '--theme-bg-overlay':
    'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(8, 5, 26, 0.50) 100%), linear-gradient(180deg, rgba(8, 5, 26, 0.20) 0%, rgba(8, 5, 26, 0.55) 100%)',

  // Fonts
  '--font-logo':        '"Audiowide", "Orbitron", sans-serif',
  '--font-display':     '"Bebas Neue", "Russo One", sans-serif',
  '--font-body':        '"Share Tech Mono", "JetBrains Mono", monospace',

  // ===== INLINE SVG ASSET VARS (~22) =====
  // Master HUD bracket corner (master TL, mirror přes CSS scaleX/Y na ostatní 3 rohy)
  '--asset-corner-bracket': "url(\"data:image/svg+xml,...\")",  // viz krok 3.4

  // Sparse rain strip (vertikální CJK + binární)
  '--asset-rain-strip':     "url(\"data:image/svg+xml,...\")",

  // 8× CJK watermarks (fill currentColor)
  '--asset-cjk-light':      "url(\"data:image/svg+xml,...\")",  // 光
  '--asset-cjk-universe':   "url(\"data:image/svg+xml,...\")",  // 宇
  '--asset-cjk-voice':      "url(\"data:image/svg+xml,...\")",  // 声
  '--asset-cjk-order':      "url(\"data:image/svg+xml,...\")",  // 制
  '--asset-cjk-world':      "url(\"data:image/svg+xml,...\")",  // 界
  '--asset-cjk-talk':       "url(\"data:image/svg+xml,...\")",  // 話
  '--asset-cjk-text':       "url(\"data:image/svg+xml,...\")",  // 文
  '--asset-cjk-image':      "url(\"data:image/svg+xml,...\")",  // 画

  // 6× nav medailon ikony (stroke currentColor)
  '--asset-icon-uvodnik':       "url(\"data:image/svg+xml,...\")",
  '--asset-icon-vytvorit-svet': "url(\"data:image/svg+xml,...\")",
  '--asset-icon-diskuze':       "url(\"data:image/svg+xml,...\")",
  '--asset-icon-clanky':        "url(\"data:image/svg+xml,...\")",
  '--asset-icon-galerie':       "url(\"data:image/svg+xml,...\")",
  '--asset-icon-napoveda':      "url(\"data:image/svg+xml,...\")",

  // 5× pravý panel section ikony + 1× chat
  '--asset-icon-hospoda':       "url(\"data:image/svg+xml,...\")",
  '--asset-icon-administrace':  "url(\"data:image/svg+xml,...\")",
  '--asset-icon-moje-svety':    "url(\"data:image/svg+xml,...\")",
  '--asset-icon-moje-diskuze':  "url(\"data:image/svg+xml,...\")",
  '--asset-icon-oblibene-clanky':  "url(\"data:image/svg+xml,...\")",
  '--asset-icon-oblibene-obrazky': "url(\"data:image/svg+xml,...\")",

  // Signature self-draw (administrator script)
  '--asset-signature-script': "url(\"data:image/svg+xml,...\")",

  // Neon „+" glyph
  '--asset-plus-neon':        "url(\"data:image/svg+xml,...\")",
},
fonts: {
  logo: 'Audiowide',
  display: 'Bebas Neue',
  body: 'Share Tech Mono',
},
```

#### 3.4 Inline SVG paths — konkrétní obsah

**Princip:** všechny SVG paths psány s `stroke="currentColor"` (line-art ikony) nebo `fill="currentColor"` (CJK watermarks), aby CSS přes `color: var(--section-color)` mohl měnit barvu hot-swap. URL-encoded přes `encodeURIComponent` helper.

Vzor pro corner bracket:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <polyline points="4,28 4,4 28,4" stroke="#00f0ff" stroke-width="2"/>
  <polyline points="8,32 8,8 32,8" stroke="#ff0080" stroke-width="1"/>
  <circle cx="6" cy="6" r="2" fill="#00f0ff"/>
  <line x1="4" y1="14" x2="14" y2="4" stroke="#ff0080" stroke-width="0.5" opacity="0.6"/>
</svg>
```

Vzor pro CJK watermark (光 — světlo):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <text x="32" y="48" font-family="serif" font-size="56" fill="currentColor"
        text-anchor="middle" font-weight="900">光</text>
</svg>
```

Vzor pro nav ikona (domeček — Úvodník):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <path d="M16 4 L4 14 L4 28 L12 28 L12 20 L20 20 L20 28 L28 28 L28 14 Z"
        stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
</svg>
```

Helper v index.ts:
```ts
const svgDataUri = (svg: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(svg.trim())}")`;
```

→ pak `--asset-corner-bracket: svgDataUri('<svg>...</svg>')`.

---

### Krok 4 — `src/themes/themes/kyberpunk/decorations.css` — kompletní přepis

Velikost: ~900–1000 řádků. Struktura 27 sekcí dle `arabsky-svet/decorations.css` / `africke/decorations.css`.

#### Header komentář (citace 9 originálních motivů)

#### Sekce 1 — Background atmosféra
- Body background image + atmosférický overlay
- `[data-theme="kyberpunk"]` selector root

#### Sekce 2 — Sparse rain (body::before levý strip, body::after pravý strip)
- 50px wide, fixed positioned, animation 80s linear
- Mobile (≤768px): hidden
- Reduced-motion: animation paused

#### Sekce 3 — Topbar (header element)
- Dark gradient bg + cyan+magenta hairline pod
- Logo banner positioning
- Right action buttons (POŠTA, UŽIVATELÉ, ZLATÝ STANDARD, TYKY, ODHLÁSIT)
- ZLATÝ STANDARD speciální magenta-purple gradient glow (kontextově sedí — viz Q2 ve spec)
- Hover: RGB-split text-shadow

#### Sekce 4 — Levý sidebar panel
- Dark gradient + 4× HUD bracket corner
- Section titles (NAVIGACE/VESMÍRY/CHAT) + per-section color + horizon-neon divider
- CJK watermark v rohu sekce (光/宇/声)

#### Sekce 5 — NavItem styling
- Idle: dark plate + cyan border + section-color 4px stripe vlevo
- Hover: RGB-split + neon glow + section stripe brightening
- Active: cyan+magenta combined outline + broken neon flicker animace

#### Sekce 6 — Pravý sidebar panel (5 sekcí mix layout)
- Stejný frame jako levý + 4× HUD bracket
- ADMINISTRACE (cyan) → CJK 制
- MOJE SVĚTY (magenta) → CJK 界
- MOJE DISKUZE (green) → CJK 話
- OBLÍBENÉ ČLÁNKY (yellow) → CJK 文
- OBLÍBENÉ OBRÁZKY (purple) → CJK 画
- „+" tlačítka s neon plus glyph

#### Sekce 7 — Welcome card
- Dark bg + scanline texture noise + 2× inner radial glow
- 4× HUD bracket corner ornaments
- Magenta horizontal hairline divider uprostřed
- Wet pavement reflection `::after` pod kartou
- Medailon vlevo (192×192 desktop)
- Title (Bebas Neue uppercase) + accent (cyan glow) + body (Share Tech Mono)
- Administrator signature self-draw (Audiowide italic, cyan)

#### Sekce 8 — Novinky card
- Stejný material jako welcome card, bez signature/hairline divider/wet pavement

#### Sekce 9 — Form controls (input, select, checkbox, radio)
- Dark plate + cyan border + magenta focus glow
- Placeholder text-secondary

#### Sekce 10 — Buttons (primary, secondary, danger, ghost)
- Primary: cyan+magenta gradient
- Secondary: dark plate + cyan border
- Danger: magenta gradient
- Ghost: text only + hover glow

#### Sekce 11 — Skin selector dropdown
- Dark plate + cyan border + caret
- Open: magenta border + glow

#### Sekce 12 — Loading states / spinners
- Cyan neon spinner glyph

#### Sekce 13 — Toasts / notifications
- Dark plate + sectional accent color

#### Sekce 14 — Modal / dialog
- Dark plate + HUD bracket corners + cyan border

#### Sekce 15 — Tabs / nav strips
- Bottom border slide animation (cyan→magenta)

#### Sekce 16 — Tooltips
- Dark plate + cyan glow + Share Tech Mono

#### Sekce 17 — Badges / chips
- Section-color bg + dark text

#### Sekce 18 — Tables / lists
- Dark rows + cyan hover stripe

#### Sekce 19 — Avatars
- Cyan circle + HUD bracket detail

#### Sekce 20 — Code blocks / pre
- Share Tech Mono + dark plate + cyan accent

#### Sekce 21 — Scrollbars (Webkit)
- Dark track + cyan thumb + magenta on hover

#### Sekce 22 — Animace (@keyframes)
- `kyberpunk-rain-fall` (background-position 0 0 → 0 1200px, 80s linear)
- `kyberpunk-neon-flicker` (60ms blackout 1× za 15s)
- `kyberpunk-signature-draw` (stroke-dashoffset 100% → 0, 2s ease-out)

#### Sekce 23 — Reduced-motion overrides
- All 3 animace disabled
- RGB-split hover disabled
- Rain opacity snížena na 0.30

#### Sekce 24 — Mobile responsive (≤768px)
- Rain hidden
- HUD brackets resize
- Logo resize
- Topbar buttons icon-only

#### Sekce 25 — Mobile small (≤480px)
- Welcome card padding compressed
- Hamburger drawer pattern

#### Sekce 26 — Print styles
- BG hidden, dark text na bílém (fallback)

#### Sekce 27 — Hi-DPI / retina overrides
- HUD bracket SVG sharper rendering

---

### Krok 5 — Vizuální QA

**5.1** Spustit dev server:
```bash
npm run dev
```

**5.2** Přepnout na kyberpunk skin v pravém panelu ADMINISTRACE → KYBERPUNK.

**5.3** Vizuální check (postupně, screenshot do `docs/arch/phase-1/_screenshots/kyberpunk-{welcome,sidebar,zoom}.png`):

- [ ] **Welcome card** — magenta hairline divider, cyan+magenta corner brackets, wet pavement reflection pod kartou, medailon vlevo, administrator signature self-draw animace běží 1× při loadu
- [ ] **Levý sidebar** — NAVIGACE cyan title, VESMÍRY magenta title, CHAT green title, každý nav item má unikátní section-color stripe 4px vlevo
- [ ] **Pravý sidebar** — ADMINISTRACE cyan, MOJE SVĚTY magenta, MOJE DISKUZE green, OBLÍBENÉ ČLÁNKY yellow, OBLÍBENÉ OBRÁZKY purple
- [ ] **CJK watermarks** v rozích každé sekce, subtle 0.04 opacity
- [ ] **Sparse rain** vlevo a vpravo viewportu (50px strips), padá pomalu (80s loop)
- [ ] **Hover RGB-split** funguje na nav items + topbar buttons
- [ ] **Active broken neon flicker** — 60ms blackout 1× za ~15s
- [ ] **Topbar** — logo vlevo, akce vpravo (POŠTA / UŽIVATELÉ / ZLATÝ STANDARD / TYKY / ODHLÁSIT), cyan+magenta hairline pod

**5.4** Mobil (≤768px) v DevTools:
- [ ] Levý + pravý sidebar drawer pattern funguje
- [ ] Sparse rain skrytý
- [ ] HUD brackets zmenšené
- [ ] Touch targets ≥48px

**5.5** Mobil small (≤480px):
- [ ] TYKY + ODHLÁSIT + ZLATÝ STANDARD v hamburger drawer
- [ ] Welcome card padding compressed
- [ ] Medailon nad textem (column layout)

**5.6** Reduced-motion (DevTools → Rendering → Emulate prefers-reduced-motion: reduce):
- [ ] Rain animace zastavena (static)
- [ ] Flicker disabled (constant opacity)
- [ ] RGB-split hover disabled
- [ ] Signature self-draw → instant full path

**5.7** Spustit `mobil-desktop` skill (povinné per CLAUDE.md / base.md).

---

### Krok 6 — Theme isolation check

```bash
# Zbylé 21 témat = nulová regrese
git diff --stat HEAD~1 HEAD  # ověř že žádné jiné theme/ soubory nejsou modifikované
```

Sanity check: změny SMÍ být POUZE v:
- `src/themes/themes/kyberpunk/index.ts`
- `src/themes/themes/kyberpunk/decorations.css`
- `public/themes/kyberpunk/decor/logo.webp` (nový)
- `public/themes/kyberpunk/decor/medailon.webp` (nový)
- `public/themes/backgrounds/kyberpunk.webp` (přepsaný)
- `index.html` (Google Fonts URL doplnění — pokud Audiowide/Bebas Neue/Share Tech Mono chybí)
- `docs/arch/phase-1/spec-1.0s-kyberpunk-upgrade.md` (nový)
- `docs/arch/phase-1/plan-1.0s.md` (nový)

**Žádné jiné soubory.**

---

### Krok 7 — Audit dokument

Vytvořit `docs/arch/phase-1/audit-1.0s-kyberpunk.md` s checklistem pro uživatele (česky):

- [ ] Atmosféra — sedí Akihabara/HK 2099 noční déšť feel?
- [ ] 9 originálních motivů — všech 9 funguje a jsou vidět?
- [ ] Section-coloring — 6 nav items + 8 sekcí v různých barvách?
- [ ] Broken neon flicker rytmus — vhodný (15s interval)?
- [ ] RGB-split hover čitelný (nesnižuje příliš čtení)?
- [ ] Sparse rain rušivý / vhodný?
- [ ] Welcome card hierarchie funguje?
- [ ] ZLATÝ STANDARD magenta-purple gradient (alternativa gold) sedí?
- [ ] Mobile — neon detaily čitelné?

---

### Krok 8 — Commit + post-impl

**8.1** Commit message:
```
feat(themes/kyberpunk): krok 1.0s — Kyberpunk skin upgrade

Akihabara/HK 2099 noční déšť. Inline SVG approach (žádné AI gen WEBP).
9 originálních motivů: sparse rain edge strips, section-color stripe,
broken neon flicker, RGB-split hover, magenta hairline divider, wet
pavement reflection, CJK watermarks, signature self-draw, cyan+magenta
HUD bracket corners.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**8.2** Post-impl checklist:
- [ ] `mobil-desktop` skill spuštěn
- [ ] `dluh` skill — žádné dluhy (nebo zapsat thumbnail regeneraci)
- [ ] `docs/roadmap-fe.md` — zaškrtnout 1.0s
- [ ] `docs/dluhy.md` — uzavřít dluhy které 1.0s vyřešil
- [ ] Screenshots do `docs/arch/phase-1/_screenshots/kyberpunk-{welcome,sidebar,zoom}.png`

---

## 2. Pořadí implementace (vrstvy)

Doporučené pořadí pro rychlou validaci:

1. **Krok 1** — konverze PNG → WEBP (1 npm příkaz, ~30 sekund)
2. **Krok 2** — Google Fonts v `index.html` (~2 minuty)
3. **Krok 3.1–3.3** — `index.ts` base + tokens (kostra bez inline SVG)
4. **Krok 4 sekce 1** — `decorations.css` BG + atmosférický overlay → **vizuální milestone: BG s overlay viditelný**
5. **Krok 3.4** + **Krok 4 sekce 3** — HUD bracket inline SVG + topbar → **vizuální milestone: topbar plný styling**
6. **Krok 4 sekce 4–5** — levý sidebar + NavItem → **vizuální milestone: section-coloring viditelný**
7. **Krok 4 sekce 6** — pravý sidebar → **vizuální milestone: kompletní shell**
8. **Krok 4 sekce 7–8** — welcome card + Novinky → **vizuální milestone: hero content**
9. **Krok 3.4** zbytek + **Krok 4 sekce 2** — všechny ostatní inline SVG + sparse rain → **vizuální milestone: full atmosphere**
10. **Krok 4 sekce 9–21** — form controls / buttons / dropdowns / scrollbars
11. **Krok 4 sekce 22–23** — animace + reduced-motion
12. **Krok 4 sekce 24–25** — mobile responsive
13. **Krok 5** — vizuální QA + screenshots
14. **Krok 6** — theme isolation check
15. **Krok 7** — audit dokument
16. **Krok 8** — commit + post-impl

---

## 3. Riziko & mitigation

| Risk | Mitigation |
|---|---|
| Inline SVG paths jsou rozsáhlé v `index.ts` → soubor ~280 řádků | Použít helper `svgDataUri()` + raw multi-line template strings, gzip smaže rozdíl |
| Section-color CSS var nemusí propagovat hluboko (per-nav-item) | Použít CSS custom property scope inheritance — set na `.navItem` parent dle `[data-nav-key]` attribute |
| Broken neon flicker animace může způsobit FOUT-like flash při loadu | Initial state opacity 1.0, flicker keyframe začíná až po 100% (cycle restart) |
| ZLATÝ STANDARD magenta gradient může matovat s ostatními premium UI | Magenta gradient + extra outer rim glow zachová „premium" pocit i bez goldu |
| Welcome card wet reflection může zasahovat do Novinky card pod ní | Reflection výška jen 80px desktop / 40px mobile + opacity fade-out 0% na konci |

---

## 4. Schválení

- [ ] PJ schválil plán (čeká 2026-05-11)
- [x] Spec schválen (čeká spolu s tímto plánem)
- [x] Asset audit hotov (3 raster ✅, 22 inline SVG plán)

Po schválení → kód.
