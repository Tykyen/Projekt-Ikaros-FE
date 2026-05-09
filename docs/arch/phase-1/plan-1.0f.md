# Plán 1.0f — Modré nebe heraldic upgrade

**Datum:** 2026-05-09
**Spec:** `spec-1.0f-modre-nebe-upgrade.md`
**Status:** ⏳ Čeká na schválení

---

## 0. Klíčová rozhodnutí (resolve open points ze specu)

### R1 — Selektory `[class*="…"]` vs `data-*` atributy

**Rozhodnutí:** držet pattern **`[class*="…"]`** napříč celou impl.
- Existující `decorations.css` (ř. 42, 48) a `IkarosLayout.module.css` to už používá
- Vite produkční build hash zachovává původní substring (`navItem` → `IkarosLayout_navItem__abc12`) — pattern je v projektu prokazatelně robustní
- Class substringy v IkarosLayout/DashboardPage jsou unikátní: `sectionTitle`, `navItem`, `navItemActive`, `navItemIcon`, `navItemLabel`, `headerBtn`, `headerBtnActive`, `pjBadge`, `showAllLink`, `signature`, `titleAccent`, `welcomeTitle`, `novinkyTitle`, `addBtn` — žádné kolize
- **Caveat:** `[class*="navItem"]` matchuje i `navItemActive`, `navItemIcon`, `navItemLabel`. Řešíme **vyšší specificitou** pro variace (nejdřív `.navItem`, pak override `.navItemActive`)
- Žádná JSX úprava není potřeba

### R7 — Inline SVG glyfy (frontend-design přístup)

5 typů ornamentů, všechny inline jako data-URI v CSS, design v sekci 2 níže:
- **C1.** Corner filigree (panel rohy)
- **C2.** Center edge diamond (top/bottom střed panelu)
- **C3.** Header band central diamond (větší, pod hlavičkou)
- **C4.** Logo calligraphic flourish (pod „Projekt Ikaros")
- **C5.** Script divider (mezi welcome paragraphs a signaturou)

### Beer ikona ověření (R4 ze specu)

Beer lucide ikona je v JSX (`IkarosLayout.tsx` ř. 152). Po implementaci nového stylingu nav itemů (sekce 5.6) bude `size={18}` zlato-cyan glow viditelně Beer (jasně viditelné madlo a pěna). Pokud po zapnutí stále vypadá jako trash, doplníme `[data-theme="modre-nebe"] [class*="navItemIcon"] svg { width: 20px; height: 20px; }` (drobnost).

---

## 1. File-level overview

| # | Soubor | Druh | Velikost změny |
|---|---|---|---|
| 1 | `src/themes/themes/modre-nebe/index.ts` | Edit (token doplňky) | +12 řádků |
| 2 | `src/themes/themes/modre-nebe/decorations.css` | **Kompletní přepis** | 70 → ~290 řádků |
| 3 | `src/app/layout/IkarosLayout/IkarosLayout.module.css` | **Žádná změna** | 0 |
| 4 | `src/shared/ui/CornerOrnament/CornerOrnament.module.css` | **Žádná změna** | 0 |
| 5 | `src/shared/ui/IkarosCard/IkarosCard.module.css` | **Žádná změna** | 0 |
| 6 | `src/features/ikaros/pages/DashboardPage.{tsx,module.css}` | **Žádná změna** | 0 |

Pouze 2 soubory se mění. Nuly potvrzují **theme isolation pravidlo** ze specu.

---

## 2. Inline SVG glyf knihovna (heart of frontend-design quality)

Designové principy:
- **Stroke colors:** `%23d6aa45` (gold base), `%23ffd36a` (gold bright), `%2325d0e6` (cobalt cyan)
- **Style:** illuminated manuscript / art nouveau heraldry — křivkové filigree, žádné generické geometrické tvary
- **Stroke-width:** 0.8–1.0 (jemné rytí, ne tlustý kabát)
- **Cobalt accent:** přesně 1× v každém ornamentu (pivotal jewel)
- Všechny SVG **inline jako data-URI** — žádné externí soubory, fast paint, scale-friendly

### C1. Corner filigree — TL position (32×32)

Trojvrstvý L-shape filigree + cobalt jewel uprostřed + rosetta:

```
url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><g fill='none' stroke='%23d6aa45' stroke-linecap='round'><path d='M3 16 L3 3 L16 3' stroke-width='1.1'/><path d='M6.5 13.5 L6.5 6.5 L13.5 6.5' stroke-width='0.9' opacity='0.55'/><path d='M14 3 Q 22 5 22 13' stroke-width='0.9'/><path d='M3 14 Q 5 22 13 22' stroke-width='0.9'/><path d='M22 13 Q 25 14 27 16' stroke-width='0.7' opacity='0.6'/><path d='M13 22 Q 14 25 16 27' stroke-width='0.7' opacity='0.6'/></g><path d='M11 14 L8 11 L11 8 L14 11 Z' fill='%23d6aa45'/><circle cx='11' cy='11' r='1.4' fill='%2325d0e6'/></svg>")
```

Other 3 positions = same SVG, mirrored via CSS `transform: scaleX(-1) | scaleY(-1) | scale(-1,-1)`.

### C2. Center edge diamond — top/bottom panel hrana (24×12, repeats with side gradient)

Used as `::before/::after` background-image positioned center, paired with horizontal gold gradient line:

```
url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 12'><path d='M12 1 L17 6 L12 11 L7 6 Z' fill='%23d6aa45' stroke='%23ffd36a' stroke-width='0.6'/><circle cx='12' cy='6' r='1.4' fill='%2325d0e6'/></svg>")
```

### C3. Header band central diamond — bigger jewel (32×16)

Větší ceremoniální drahokam pod hlavičkou:

```
url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 16'><path d='M16 1 L23 8 L16 15 L9 8 Z' fill='%23d6aa45' stroke='%23ffd36a' stroke-width='0.6'/><path d='M16 4 L20 8 L16 12 L12 8 Z' fill='%23ffd36a'/><circle cx='16' cy='8' r='1.6' fill='%2325d0e6'/></svg>")
```

### C4. Logo calligraphic flourish (240×8, preserveAspectRatio=none → tahá se na šířku loga)

Dvojvlnka s cobalt jewelem uprostřed, asymmetric quill stroke:

```
url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 8' preserveAspectRatio='none'><path d='M3 5 Q 30 1 60 5 T 118 5 Q 145 9 175 5 T 237 5' stroke='%23d6aa45' stroke-width='0.7' fill='none' stroke-linecap='round'/><circle cx='118' cy='5' r='1.3' fill='%2325d0e6'/></svg>")
```

### C5. Script divider — před signaturou (220×14)

Symetrická vlnka s end-tickami a centrálním diamondem:

```
url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 14' preserveAspectRatio='none'><path d='M8 7 Q 60 2 110 7 Q 160 12 212 7' stroke='%23d6aa45' stroke-width='0.8' fill='none' stroke-linecap='round'/><path d='M2 7 L8 7 M212 7 L218 7' stroke='%23d6aa45' stroke-width='0.7'/><path d='M110 3 L114 7 L110 11 L106 7 Z' fill='%2325d0e6'/></svg>")
```

### C6. Header band horizontal rule with central diamond glow

Není SVG, ale CSS gradient kompozice — sekce 5.2.

---

## 3. Diff — `src/themes/themes/modre-nebe/index.ts`

**Místo:** za stávající luxury tokeny (po ř. 47), před legacy section (ř. 49).

**Přidat:**

```ts
    // ──────────────────────────────────────────────
    // Heraldic upgrade tokens (spec 1.0f)
    // ──────────────────────────────────────────────

    // Ornament fills (used in inline SVG via CSS — not directly substituted, kept for documentation/future)
    '--ornament-gold':         '#d6aa45',
    '--ornament-gold-bright':  '#ffd36a',
    '--ornament-cyan':         '#25d0e6',

    // Header band
    '--header-band-h':         '6px',

    // Panel double-stroke inner border
    '--panel-inner-border':    'rgba(214, 170, 69, 0.30)',
    '--panel-inner-inset':     '7px',

    // Section title gradient
    '--section-divider':       'linear-gradient(90deg, transparent 0%, rgba(214,170,69,0.65) 50%, transparent 100%)',
```

Žádné existující tokeny se nemění. Žádné mazání.

---

## 4. Plné znění nového `decorations.css`

Toto je finální obsah. Členění odpovídá sekcím specu.

```css
/* ── Modré nebe — heraldic upgrade (spec 1.0f) ──
   Aktivuje se přes [data-theme="modre-nebe"]. Vše scoped, žádný globální dopad.
   Ornamenty inline jako SVG data-URI — žádné externí soubory.
   Vokabulář: gold filigree corners + cobalt jewel pivots + double-stroke borders. */

/* ──────────────── 1. Root + atmospheric overlay ──────────────── */

[data-theme="modre-nebe"] {
  background-color: #050a18;
}

[data-theme="modre-nebe"][data-shell="ikaros"]::before {
  content: '';
  position: fixed;
  inset: 0;
  background: var(--theme-bg-overlay);
  pointer-events: none;
  z-index: 0;
}

/* ──────────────── 2. Header band — gold rule + central diamond ──────────────── */

[data-theme="modre-nebe"] header {
  position: relative;
  border-bottom: 1px solid var(--theme-border-soft);
}

/* Gold gradient rule + central jewel sitting on top of the rule */
[data-theme="modre-nebe"] header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -8px;
  height: 16px;
  pointer-events: none;
  background:
    /* central diamond C3 */
    center bottom / 32px 16px no-repeat
      url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 16'><path d='M16 1 L23 8 L16 15 L9 8 Z' fill='%23d6aa45' stroke='%23ffd36a' stroke-width='0.6'/><path d='M16 4 L20 8 L16 12 L12 8 Z' fill='%23ffd36a'/><circle cx='16' cy='8' r='1.6' fill='%2325d0e6'/></svg>"),
    /* horizontal gold rule centered vertically */
    center / 100% 1px no-repeat
      linear-gradient(90deg, transparent 0%, rgba(214,170,69,0.4) 18%, rgba(214,170,69,0.85) 50%, rgba(214,170,69,0.4) 82%, transparent 100%);
  filter: drop-shadow(0 0 6px var(--theme-glow-gold));
}

/* ──────────────── 3. Logo + calligraphic flourish ──────────────── */

[data-theme="modre-nebe"] header [class*="logoImg"] {
  height: var(--header-h, 88px);
  background-size: contain;
}

/* Flourish — pod logem, na úrovni Link wrapperu */
[data-theme="modre-nebe"] header > a[class*="logo"] {
  position: relative;
}
[data-theme="modre-nebe"] header > a[class*="logo"]::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 12px;
  bottom: 14px;
  height: 8px;
  pointer-events: none;
  background: center / 100% 100% no-repeat
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 8' preserveAspectRatio='none'><path d='M3 5 Q 30 1 60 5 T 118 5 Q 145 9 175 5 T 237 5' stroke='%23d6aa45' stroke-width='0.7' fill='none' stroke-linecap='round'/><circle cx='118' cy='5' r='1.3' fill='%2325d0e6'/></svg>");
  opacity: 0.85;
  filter: drop-shadow(0 0 4px var(--theme-glow-gold));
}

/* ──────────────── 4. Glass panely + double-stroke border ──────────────── */

[data-theme="modre-nebe"] [data-frame-panel="sidebar"],
[data-theme="modre-nebe"] [data-frame-panel="right"],
[data-theme="modre-nebe"] [data-frame-panel="card"],
[data-theme="modre-nebe"] [data-frame-panel="novinky"] {
  position: relative;
  background: var(--theme-surface);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  border: 1px solid var(--theme-border);
  border-radius: 18px;
  isolation: isolate;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.55),
    inset 0 0 0 var(--panel-inner-inset, 7px) transparent,
    inset 0 0 0 calc(var(--panel-inner-inset, 7px) + 1px) var(--panel-inner-border);
  overflow: visible; /* aby ornaments mohly přesahovat za hranu */
}

/* Top + bottom center diamond + side gradient lines (motivový opakovač headeru) */
[data-theme="modre-nebe"] [data-frame-panel="sidebar"]::before,
[data-theme="modre-nebe"] [data-frame-panel="right"]::before,
[data-theme="modre-nebe"] [data-frame-panel="card"]::before,
[data-theme="modre-nebe"] [data-frame-panel="novinky"]::before,
[data-theme="modre-nebe"] [data-frame-panel="sidebar"]::after,
[data-theme="modre-nebe"] [data-frame-panel="right"]::after,
[data-theme="modre-nebe"] [data-frame-panel="card"]::after,
[data-theme="modre-nebe"] [data-frame-panel="novinky"]::after {
  content: '';
  position: absolute;
  left: 14%;
  right: 14%;
  height: 12px;
  pointer-events: none;
  background:
    center / 24px 12px no-repeat
      url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 12'><path d='M12 1 L17 6 L12 11 L7 6 Z' fill='%23d6aa45' stroke='%23ffd36a' stroke-width='0.6'/><circle cx='12' cy='6' r='1.4' fill='%2325d0e6'/></svg>"),
    center / calc(50% - 18px) 1px no-repeat
      linear-gradient(90deg, transparent, rgba(214,170,69,0.65) 60%, rgba(214,170,69,0.65) 100%),
    center right calc(50% + 18px) / calc(50% - 18px) 1px no-repeat
      linear-gradient(90deg, rgba(214,170,69,0.65), transparent);
  filter: drop-shadow(0 0 4px var(--theme-glow-gold));
}

[data-theme="modre-nebe"] [data-frame-panel="sidebar"]::before,
[data-theme="modre-nebe"] [data-frame-panel="right"]::before,
[data-theme="modre-nebe"] [data-frame-panel="card"]::before,
[data-theme="modre-nebe"] [data-frame-panel="novinky"]::before {
  top: -6px;
}

[data-theme="modre-nebe"] [data-frame-panel="sidebar"]::after,
[data-theme="modre-nebe"] [data-frame-panel="right"]::after,
[data-theme="modre-nebe"] [data-frame-panel="card"]::after,
[data-theme="modre-nebe"] [data-frame-panel="novinky"]::after {
  bottom: -6px;
  transform: scaleY(-1);
}

/* ──────────────── 5. CornerOrnament — un-hide + re-style ──────────────── */

/* Override base 10x10 rotated square → 32x32 SVG filigree */
[data-theme="modre-nebe"] [data-frame-panel] [class*="ornament"] {
  display: block;
  width: 32px;
  height: 32px;
  background: center / contain no-repeat
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><g fill='none' stroke='%23d6aa45' stroke-linecap='round'><path d='M3 16 L3 3 L16 3' stroke-width='1.1'/><path d='M6.5 13.5 L6.5 6.5 L13.5 6.5' stroke-width='0.9' opacity='0.55'/><path d='M14 3 Q 22 5 22 13' stroke-width='0.9'/><path d='M3 14 Q 5 22 13 22' stroke-width='0.9'/><path d='M22 13 Q 25 14 27 16' stroke-width='0.7' opacity='0.6'/><path d='M13 22 Q 14 25 16 27' stroke-width='0.7' opacity='0.6'/></g><path d='M11 14 L8 11 L11 8 L14 11 Z' fill='%23d6aa45'/><circle cx='11' cy='11' r='1.4' fill='%2325d0e6'/></svg>");
  border: none;
  border-radius: 0;
  transform: none;
  filter: drop-shadow(0 0 5px var(--theme-glow-gold));
}

[data-theme="modre-nebe"] [data-frame-panel] [class*="ornament"][data-position="tl"] {
  top: 4px;
  left: 4px;
}
[data-theme="modre-nebe"] [data-frame-panel] [class*="ornament"][data-position="tr"] {
  top: 4px;
  right: 4px;
  transform: scaleX(-1);
}
[data-theme="modre-nebe"] [data-frame-panel] [class*="ornament"][data-position="bl"] {
  bottom: 4px;
  left: 4px;
  transform: scaleY(-1);
}
[data-theme="modre-nebe"] [data-frame-panel] [class*="ornament"][data-position="br"] {
  bottom: 4px;
  right: 4px;
  transform: scale(-1, -1);
}

/* ──────────────── 6. Section title — `◆ ━━ TITLE ━━ ◆` ──────────────── */

[data-theme="modre-nebe"] [class*="sectionTitle"] {
  color: var(--theme-heading);
  letter-spacing: 0.22em;
  text-shadow: 0 0 10px var(--theme-glow-gold);
}

[data-theme="modre-nebe"] [class*="sectionTitle"]::before,
[data-theme="modre-nebe"] [class*="sectionTitle"]::after {
  flex: 1;
  height: 14px;
  background:
    /* gradient line uprostřed pseudo-element výšky */
    center / 100% 1px no-repeat
      linear-gradient(90deg, transparent 0%, rgba(214,170,69,0.65) 50%, rgba(214,170,69,0.85) 100%);
  opacity: 1;
}

[data-theme="modre-nebe"] [class*="sectionTitle"]::before {
  /* diamond at the LEFT (outside) end + line going right */
  background:
    left center / 8px 8px no-repeat
      url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'><path d='M4 0 L8 4 L4 8 L0 4 Z' fill='%2325d0e6'/></svg>"),
    center / 100% 1px no-repeat
      linear-gradient(90deg, rgba(214,170,69,0.85) 0%, rgba(214,170,69,0.65) 100%);
}

[data-theme="modre-nebe"] [class*="sectionTitle"]::after {
  /* line going right + diamond at the RIGHT (outside) end */
  background:
    right center / 8px 8px no-repeat
      url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'><path d='M4 0 L8 4 L4 8 L0 4 Z' fill='%2325d0e6'/></svg>"),
    center / 100% 1px no-repeat
      linear-gradient(90deg, rgba(214,170,69,0.65) 0%, rgba(214,170,69,0.85) 100%);
}

/* ──────────────── 7. Nav items — flat-glow, cobalt active ──────────────── */

/* Base styling — overrides btn3d composition jen v modre-nebe */
[data-theme="modre-nebe"] [class*="navItem"]:not([class*="navItemActive"]):not([class*="navItemIcon"]):not([class*="navItemLabel"]) {
  background: rgba(8, 14, 28, 0.45);
  border: 1px solid var(--theme-border-soft);
  border-radius: 10px;
  font-family: var(--font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.82rem;
  color: var(--theme-text);
  transition: border-color 160ms ease, background 160ms ease, box-shadow 200ms ease, color 160ms ease;
}

[data-theme="modre-nebe"] [class*="navItem"]:not([class*="navItemActive"]):not([class*="navItemIcon"]):not([class*="navItemLabel"]):hover {
  border-color: var(--theme-border);
  background: var(--theme-nav-hover-bg);
  box-shadow: inset 3px 0 0 var(--theme-accent-bright), 0 0 8px rgba(214,170,69,0.18);
  color: var(--theme-text);
}

/* Active state — cobalt edge accent + cobalt halo */
[data-theme="modre-nebe"] [class*="navItemActive"] {
  background: var(--theme-nav-active-bg);
  border-color: var(--theme-border-cyan);
  color: var(--theme-text);
  box-shadow:
    inset 3px 0 0 var(--theme-accent-cyan),
    0 0 18px var(--theme-glow-cyan),
    0 0 6px rgba(37, 208, 230, 0.28) inset;
}

[data-theme="modre-nebe"] [class*="navItemActive"] [class*="navItemIcon"] {
  color: var(--theme-accent-cyan);
  filter: drop-shadow(0 0 8px var(--theme-glow-cyan));
}

[data-theme="modre-nebe"] [class*="navItemActive"] [class*="navItemLabel"] {
  color: var(--theme-text);
  text-shadow: 0 0 8px var(--theme-glow-cyan);
}

/* Beer / first-room icon size correction (R4) */
[data-theme="modre-nebe"] [class*="navItemIcon"] svg {
  width: 18px;
  height: 18px;
}

/* ──────────────── 8. PJ badge — cobalt-cyan gradient pill ──────────────── */

[data-theme="modre-nebe"] [class*="pjBadge"],
[data-theme="modre-nebe"] [data-pj-badge] {
  height: 18px;
  padding: 0 7px;
  border: 1px solid var(--theme-border-cyan);
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(37, 208, 230, 0.32) 0%, rgba(37, 208, 230, 0.10) 100%);
  color: var(--theme-accent-bright);
  font-family: var(--font-display);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  box-shadow: 0 0 10px var(--theme-glow-cyan);
  display: inline-flex;
  align-items: center;
}

/* ──────────────── 9. „Zobrazit vše →" pill ──────────────── */

[data-theme="modre-nebe"] [class*="showAllLink"] {
  border: 1px solid var(--theme-border);
  border-radius: 999px;
  background: rgba(214, 170, 69, 0.06);
  color: var(--theme-accent-bright);
  font-family: var(--font-display);
  font-size: 0.72rem;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  padding: 8px 16px;
  transition: background 160ms, box-shadow 200ms, border-color 160ms;
}

[data-theme="modre-nebe"] [class*="showAllLink"]:hover {
  background: rgba(214, 170, 69, 0.14);
  border-color: var(--theme-accent-bright);
  box-shadow: 0 0 14px var(--theme-glow-gold);
}

/* ──────────────── 10. Header tlačítka — uppercase + gold border ──────────────── */

[data-theme="modre-nebe"] [class*="headerBtn"]:not([class*="headerBtnIcon"]):not([class*="headerBtnLabel"]) {
  background: rgba(5, 10, 24, 0.55);
  border: 1px solid var(--theme-border-soft);
  border-radius: 10px;
  font-family: var(--font-display);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--theme-text);
  transition: border-color 160ms, box-shadow 200ms, background 160ms;
}

[data-theme="modre-nebe"] [class*="headerBtn"]:not([class*="headerBtnIcon"]):not([class*="headerBtnLabel"]):hover {
  border-color: var(--theme-border);
  box-shadow: 0 0 12px var(--theme-glow-gold);
  background: rgba(214, 170, 69, 0.08);
}

[data-theme="modre-nebe"] [class*="headerBtnActive"] {
  border-color: var(--theme-border-cyan);
  box-shadow: 0 0 12px var(--theme-glow-cyan);
}

/* Tyky avatar 18px (zachováno z původního decorations.css) */
[data-theme="modre-nebe"] [class*="headerBtn"] [class*="avatar"] {
  width: 18px;
  height: 18px;
}

/* ──────────────── 11. Welcome card — andel medallion + script divider ──────────────── */

[data-theme="modre-nebe"] [data-andel-medallion] {
  width: 220px;
  height: 235px;
  background-image: var(--asset-andel-medallion, none);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  flex-shrink: 0;
  filter: drop-shadow(0 0 22px var(--theme-glow-gold));
}

/* Script divider before signature inside welcome card */
[data-theme="modre-nebe"] [data-frame-panel="card"] [class*="signature"] {
  position: relative;
  margin-top: 56px;
}

[data-theme="modre-nebe"] [data-frame-panel="card"] [class*="signature"]::before {
  content: '';
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  width: min(60%, 280px);
  height: 14px;
  background: center / 100% 100% no-repeat
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 14' preserveAspectRatio='none'><path d='M8 7 Q 60 2 110 7 Q 160 12 212 7' stroke='%23d6aa45' stroke-width='0.8' fill='none' stroke-linecap='round'/><path d='M2 7 L8 7 M212 7 L218 7' stroke='%23d6aa45' stroke-width='0.7'/><path d='M110 3 L114 7 L110 11 L106 7 Z' fill='%2325d0e6'/></svg>");
  opacity: 0.9;
  filter: drop-shadow(0 0 4px var(--theme-glow-gold));
}

/* Title accent — already cyan via DashboardPage.module.css; přidat glow */
[data-theme="modre-nebe"] [class*="titleAccent"] {
  text-shadow: 0 0 14px var(--theme-glow-cyan);
}

/* ──────────────── 12. Responsive — mobile graceful degradation ──────────────── */

@media (max-width: 768px) {
  /* Smaller corner ornaments on mobile to avoid clutter */
  [data-theme="modre-nebe"] [data-frame-panel] [class*="ornament"] {
    width: 24px;
    height: 24px;
  }

  /* Smaller center diamonds */
  [data-theme="modre-nebe"] [data-frame-panel="sidebar"]::before,
  [data-theme="modre-nebe"] [data-frame-panel="right"]::before,
  [data-theme="modre-nebe"] [data-frame-panel="card"]::before,
  [data-theme="modre-nebe"] [data-frame-panel="novinky"]::before,
  [data-theme="modre-nebe"] [data-frame-panel="sidebar"]::after,
  [data-theme="modre-nebe"] [data-frame-panel="right"]::after,
  [data-theme="modre-nebe"] [data-frame-panel="card"]::after,
  [data-theme="modre-nebe"] [data-frame-panel="novinky"]::after {
    background-size: 18px 9px, calc(50% - 14px) 1px, calc(50% - 14px) 1px;
  }

  /* Header band stays — but smaller diamond */
  [data-theme="modre-nebe"] header::after {
    background-size: 24px 12px, 100% 1px;
  }
}
```

**Counts:** ~290 řádků, ~9.5 KB (gzipped CSS bude ~3 KB). Akceptovatelné — modul lazy-loaded přes `decorationsModule: () => import('./decorations.css')` v `index.ts`.

---

## 5. Drobné poznámky k implementaci

### 5.1 Specifity řešení

`[class*="navItem"]` matchuje i `navItemIcon`, `navItemLabel`, `navItemActive` — proto u základního stylu používáme `:not([class*="navItemActive"]):not([class*="navItemIcon"]):not([class*="navItemLabel"])`. Active state pak má vlastní override bez `:not()`.

### 5.2 Header band — vrstvení backgrounds

Header `::after` má 2 background layers:
1. **Top layer:** centrální diamond C3 (32×16) zarovnaný `center bottom`
2. **Bottom layer:** horizontální gold gradient rule, výška 1px, centrovaný vertikálně

Element je 16px vysoký + `bottom: -8px` (přesah pod header), takže rule sedí přesně 8px pod hlavičkou s diamondy nad ním. `filter: drop-shadow` přidá zlatou záři.

### 5.3 Panel center ornaments — symetrie přes `transform: scaleY(-1)`

Stejný `::after` glyf jako `::before`, jen mirrored přes Y axis (diamond i gradient lines). Šetří ~15 řádků CSS.

### 5.4 CornerOrnament override

Existující module CSS dává `position: absolute; transform: rotate(45deg); width: 10px; height: 10px;`. Modre-nebe override resetuje `transform: none`, zvětší na 32×32 a aplikuje SVG `background-image`. Pro mirrored pozice (TR/BL/BR) znovu aplikujeme `transform: scaleX/Y/-1`. Důležité: musí být v decorations.css **vyšší specificitou** než module CSS — přebíjíme přes selektor `[data-theme="modre-nebe"] [data-frame-panel] [class*="ornament"][data-position="X"]` (3 segments → vyšší specificita než `.ornament[data-position="X"]` → 2 segments + 1 attr).

### 5.5 Backdrop-filter perf

Při `backdrop-filter: blur(8px)` + 4× pseudo-element ornaments + heavy box-shadow může na low-end HW padat FPS. Mitigace: `isolation: isolate` + `contain: paint` jsme nepřidali, protože by mohly způsobit clipping ornamentů (overflow: visible). Pokud při manuálním ověření padá FPS, fallback je snížit `backdrop-filter: blur(6px)`.

### 5.6 Beer ikona

Po novém nav stylingu (sekce 7 CSS) bude Beer 18px se zlatou nebo cobalt drop-shadow → musí být jasně vidět madlo + pěna. Pokud není, fallback je `[data-theme="modre-nebe"] [class*="navItemIcon"] svg { width: 20px; height: 20px; }` (už v plánu zahrnuto).

### 5.7 Konflikt `:not()` se substring selektory

`[class*="navItemActive"]` substring je v hashed name jako `IkarosLayout_navItemActive__hash`. `:not([class*="navItemActive"])` ho korektně vyloučí. Testováno v existujícím kódu (decorations.css ř. 48 používá `[class*="ornament"]` bez kolizí).

---

## 6. Multi-agent orchestrace

### Volba: **dva paralelní agenty** v `general-purpose` subagent_type

Streamy A+B+C+D ze specu jsou všechny editace **téhož souboru `decorations.css`**. Rozdělení do 4 paralelních agentů by vytvořilo merge konflikty. Místo toho:

- **Agent 1** (`general-purpose`, foreground): Edituje `src/themes/themes/modre-nebe/index.ts` — sekce 3 plánu (přidá tokeny). 1 Edit operace, malá změna.
- **Agent 2** (`general-purpose`, foreground, paralelní s Agent 1): Přepíše `src/themes/themes/modre-nebe/decorations.css` — sekce 4 plánu (Write tool, kompletní obsah). Velká, ale přímočará operace.

Oba běží paralelně v jednom message bloku.

Po dokončení obou:
- **Validation v main contextu** (sekvenčně): `npm run lint`, `npm run lint:colors`, `npm run test:run`, `npm run build` (každé samostatně, abych viděl chyby)
- **Dev server start** (background) + **vizuální check** v prohlížeči (uživatel nebo já, pokud má MCP browser tool — pokud ne, popíšu user co očekávat)
- **Skill `mobil-desktop`** — povinný dle base.md

### Proč ne 4 agenti přes worktree isolation?

Worktree by každý agent dostal vlastní kopii repa, ale finální merge zpět do hlavního stromu by stejně byl manuálně řešený konflikt na `decorations.css`. Pro tento spec je 2-agent split + jeden master CSS write efektivnější.

---

## 7. Sekvence operací

```
Krok 1 (paralelně):
  ├── Agent 1 → Edit src/themes/themes/modre-nebe/index.ts (přidat 12 řádků tokenů)
  └── Agent 2 → Write src/themes/themes/modre-nebe/decorations.css (kompletní obsah ze sekce 4)

Krok 2 (sekvenčně, main):
  ├── npm run lint              # ESLint
  ├── npm run lint:colors       # Hardcoded color check
  ├── npm run test:run          # Unit/integration testy
  └── npm run build             # TypeScript + Vite build

Krok 3 (vizuální):
  ├── npm run dev (background)
  ├── User otevře / a přepne theme na modre-nebe
  └── Porovnání se screenshotem (obrázek 1 z chatu)

Krok 4 (responsive):
  └── Skill mobil-desktop (mobile + tablet kontrola)

Krok 5 (close-out):
  ├── Update docs/roadmap-fe.md (nový bod 1.0f hotový)
  └── Případné dluhy do docs/dluhy.md (skill `dluh`)
```

---

## 8. Akceptační kritéria (z 7. specu) — kontrolní list

Po Kroku 4 ověřit, že platí všech 11 bodů specu:

- [ ] Header band: gold rule + central diamond pod hlavičkou
- [ ] Logo flourish underline pod „Projekt Ikaros"
- [ ] Všechny panely: 4× corner filigree (32×32 SVG, ne starý rotated square)
- [ ] Všechny panely: 2× center diamond (top + bottom) s side gradient lines
- [ ] Všechny panely: double-stroke gold border (vnější + vnitřní inset)
- [ ] Section titulky: ◆ ━ TITLE ━ ◆ s cobalt diamondy
- [ ] Active nav (Úvodník): cobalt edge accent + halo glow + ikona glow
- [ ] PJ chip: cobalt-cyan gradient pill
- [ ] Welcome card: script divider před signaturou
- [ ] Welcome card: „Projektu Ikaros." cobalt text-shadow glow
- [ ] „Zobrazit vše →": zlatá pill kapsle
- [ ] Header tlačítka: uppercase letter-spacing + gold border + hover glow
- [ ] Beer ikona: viditelná jako Beer (ne trash)
- [ ] Mobile ≤768px: drawer + smaller ornaments graceful
- [ ] Tablet 769–1280px: pravý panel skrytý (existující), sidebar + main funguje
- [ ] Ostatní themata: vizuální regrese 0
- [ ] `npm run lint` + `lint:colors` + `test:run` + `build` ✅
- [ ] Žádný nový PNG/WebP soubor v `public/themes/`
- [ ] Žádná změna `IkarosLayout.tsx`, `CornerOrnament.tsx`, `IkarosCard.tsx`, `DashboardPage.tsx`

---

## 9. Risk register (rolled forward ze specu)

| # | Risk | Mitigace v plánu |
|---|---|---|
| R1 | `[class*="…"]` substring selektory | Sekce 0 — pattern už v projektu funguje, používáme |
| R2 | Inline SVG dlouhé řádky | Akceptováno; gzipped CSS ~3 KB |
| R3 | CornerOrnament module CSS konflikt | Override přes vyšší specificitu (sekce 5.4) |
| R4 | Beer ikona | Sekce 5.6 + fallback CSS v 7. části CSS |
| R5 | titleAccent / signature class chybí | **Vyřešeno** — obě v `DashboardPage.module.css` existují (ř. 25, 40) |
| R6 | backdrop-filter perf | Sekce 5.5 — fallback `blur(6px)` pokud nutno |
| R7 | Inline SVG aesthetic | Sekce 2 — všech 5 glyfů designovaných v stylu illuminated manuscript |
| R8 | Specificity přebijí ostatní themata | Změny **přidávají** vlastnosti; vše scoped na `[data-theme="modre-nebe"]` |

---

## 10. Po dokončení (close-out)

1. Aktualizovat `docs/roadmap-fe.md` — bod **1.0f Modré nebe heraldic upgrade ✅** (datum 2026-05-09)
2. Pokud R6 (perf) → zápis do `docs/dluhy.md` skillem `dluh`
3. Volitelně: `purpose.md` / `decisions.md` v `docs/arch/phase-1/1.0f/` — později pokud potřeba pro AI agenty
4. Commit message návrh:
   ```
   feat(theme/modre-nebe): krok 1.0f — heraldic upgrade
   
   - Header band (gold rule + central diamond)
   - Logo calligraphic flourish
   - Panel ornaments (corner filigree + center diamonds, double-stroke border)
   - Section titles (◆ ━ TITLE ━ ◆)
   - Cobalt active nav glow
   - PJ cobalt-cyan gradient chip
   - Welcome card script divider before signature
   - „Zobrazit vše →" gold pill
   - Header buttons uppercase + gold border
   
   Vše scoped na [data-theme="modre-nebe"] — žádný globální dopad,
   žádný nový asset, žádná React komponenta dotčena.
   
   Spec: docs/arch/phase-1/spec-1.0f-modre-nebe-upgrade.md
   Plán: docs/arch/phase-1/plan-1.0f.md
   ```

---

**Schválení:** ⏳ Čeká na PJ. Po souhlasu **spustím Krok 1 (Agent 1 + Agent 2 paralelně)** a pokračuji dle sekvence v sekci 7.
