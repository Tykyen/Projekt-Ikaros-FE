# Spec 1.0r follow-up — Arabský svět richness upgrade (D = A + B + minimal C)

**Status:** ✅ Implementováno
**Datum:** 2026-05-11
**Rozsah:** FE refinement upgrade — `[data-theme="arabsky-svet"]` izolace, žádný globální dopad
**Předchozí spec:** [`spec-1.0r-arabsky-svet-upgrade.md`](spec-1.0r-arabsky-svet-upgrade.md) ✅ implementováno commit `d25c2d9`
**Velikost:** odhad ~2 soubory změna (`index.ts` + `decorations.css`), žádné nové assety, jen CSS + inline SVG
**Autor:** PJ + Claude
**Souvisí:** uživatel zhodnotil 1.0r commit jako „základ správně ale nedostatečně bohatý"

---

## 0. Princip — bohatství materiálu, dramatičnost scény

Současné 1.0r má **tier-1 strukturu** (paleta, fonty, layout, motifs) ale **plochý materiálový pocit**. Cíl follow-upu: povýšit z „skin se základem orientu" na **tier-1 sultánskou komnatu, která dýchá zlatem a hedvábím**.

**Čtyři vrstvy refinementu (direction D + uživatelova prioritní oprava):**

| Vrstva | Co přidá | Vizuální dopad |
|---|---|---|
| **🔥 0 — 3D tlačítka** (NEJVYŠŠÍ PRIORITA) | Reliéfní button styling napříč nav + header + add buttons — výrazný emboss, hover lift, active press, multi-layer inset highlights | Tlačítka přestanou být ploché ploškové panely — budou fyzicky **vystoupená** ze surface, jako tepaná mosaz |
| **A — Hedvábí a zlato** | Damask wallpaper + silk shimmer + multi-layer border na panelech | Panely přestanou být ploché CSS surfaces — budou „látkový" pocit |
| **B — Theatrum mihrab** | Lomený oblouk welcome card + backlit medailon + flourish brackets + mukarnas uvnitř | Welcome card se stane DRAMATICKOU SCÉNOU, ne jen panelem |
| **C — Drahokamy decentně** | Gem inset PJ badge + drobné accent gems v rozích buttonů | Mikro-detaily, které posílí "šperkařský poklad" pocit bez chaosu |

**Princip nepoškodit, co funguje:** všechny současné motivy (rose petals drift, narghile smoke, lamp + caustic, Hamsa, arabesque vine, signature self-draw, multifoil corners) **zůstávají beze změny**. Tohle je **aditivní vrstva**, ne přepis.

---

## 1. Cíl

Po 1.0r-followup má skin `arabsky-svet` vypadat jako:
- Welcome card = **rozdvinutý mihrab oblouk** s backlit zlatým halo za medailonem, ornamentální flourish brackets okolo signaturní řádky, mukarnas mini-cornice uvnitř horní hrany, sloupcový aspect po stranách
- Panely (sidebar / right / novinky) = **damaškové hedvábné povrchy** s velmi subtilním ornamentálním pattern (4-6% opacity) + diagonal silk sheen overlay + multi-layer border (gold-turquoise-gold trio místo single 1px)
- Section titles (NAVIGACE, VESMÍRY) = **kaligrafické svinky** před a za uppercase textem (inline SVG flourish)
- Nav buttons = corner gem accent dots v rozích (rubín TL, smaragd BR) + bohatší hover sheen
- PJ badge = drahokamový inset (1 gem uprostřed badge nebo subtle gem corners)
- Lamp + caustic glow = light leak na okolí (subtle warm ambient kolem welcome corner)
- Active nav = bigger arabesque vine + brighter Hamsa pulse

---

## 2. Návrh řešení

### 2.0 [🔥 PRIORITY] 3D tlačítka — kompletní reliéfní upgrade

**Problém:** Současné nav/header/add tlačítka mají jen 1px border + subtle inset highlight + 2px drop shadow. Vypadají ploché jako CSS divy, ne jako tepaná mosaz. Uživatel označil za "hrozně placatá a divná".

**Cíl:** Tlačítka musí vypadat jako **fyzicky vystoupená** ze surface — jako tepaná zlato-mosazná destička s embossed okrajem, vrchním reflex highlight a deep drop shadow.

#### 2.0.1 Nav buttons (sidebar `[class*="btn3d"]` + `[class*="navItem"]`)

**Idle state — 3D embossed mosazová destička:**

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="btn3d"],
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="navItem"]:not([class*="navItemIcon"]) {
  position: relative;
  /* MULTI-STOP GRADIENT — simuluje zakřivený povrch */
  background:
    linear-gradient(180deg,
      rgba(58, 42, 88, 0.75) 0%,      /* top — světlejší (highlighted edge) */
      rgba(26, 26, 68, 0.92) 40%,     /* upper mid */
      rgba(14, 14, 44, 0.96) 60%,     /* lower mid — tmavší */
      rgba(20, 20, 56, 0.92) 100%);   /* bottom — slight back-reflect */
  border: 1px solid var(--theme-patinated-gold);
  color: var(--theme-pearl-ivory);
  font-family: var(--font-body);
  font-size: 15px;
  letter-spacing: 0.02em;
  padding: 12px 16px;          /* vyšší vertical padding pro lepší proporci */
  border-radius: 4px;
  transition: all 200ms ease-out;
  min-height: 48px;
  overflow: hidden;

  /* MULTI-LAYER 3D BUTTON SHADOW STACK */
  box-shadow:
    /* TOP HIGHLIGHT — světelný reflex shora */
    inset 0 1px 0 rgba(232, 192, 96, 0.35),
    inset 0 2px 0 rgba(232, 192, 96, 0.12),

    /* LEFT HIGHLIGHT — light catches edge */
    inset 1px 0 0 rgba(232, 192, 96, 0.18),

    /* BOTTOM SHADOW INSIDE — emboss depth */
    inset 0 -2px 4px rgba(0, 0, 0, 0.45),
    inset 0 -1px 0 rgba(0, 0, 0, 0.55),

    /* RIGHT SHADOW — physical 3D */
    inset -1px 0 2px rgba(0, 0, 0, 0.30),

    /* OUTER DROP SHADOWS — float above surface */
    0 1px 0 rgba(168, 120, 48, 0.40),     /* top reflect on surface */
    0 2px 0 rgba(74, 40, 24, 0.65),       /* hard bottom edge — like real button thickness */
    0 4px 8px rgba(0, 0, 0, 0.45),        /* mid blur shadow */
    0 8px 16px rgba(0, 0, 0, 0.25);       /* far shadow */
}
```

**Hover state — button rises:**

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="btn3d"]:hover,
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="navItem"]:not([class*="navItemIcon"]):hover {
  background:
    linear-gradient(180deg,
      rgba(74, 56, 108, 0.85) 0%,
      rgba(38, 38, 88, 0.94) 40%,
      rgba(22, 22, 60, 0.96) 60%,
      rgba(28, 28, 72, 0.92) 100%);
  border-color: var(--theme-polished-gold);
  color: var(--theme-polished-gold);
  transform: translateY(-2px);

  box-shadow:
    /* Brighter highlights */
    inset 0 1px 0 rgba(232, 192, 96, 0.55),
    inset 0 2px 0 rgba(232, 192, 96, 0.22),
    inset 1px 0 0 rgba(232, 192, 96, 0.30),

    /* Stronger emboss */
    inset 0 -2px 4px rgba(0, 0, 0, 0.50),
    inset 0 -1px 0 rgba(0, 0, 0, 0.60),
    inset -1px 0 2px rgba(0, 0, 0, 0.35),

    /* Drop shadow grew (button is higher) */
    0 1px 0 rgba(232, 192, 96, 0.50),
    0 3px 0 rgba(74, 40, 24, 0.70),       /* bottom edge thicker */
    0 6px 12px rgba(0, 0, 0, 0.55),
    0 12px 24px rgba(0, 0, 0, 0.30),
    0 0 16px var(--theme-glow-saffron);   /* warm halo */
}
```

**Active (pressed) state — button sinks in:**

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="btn3d"]:active,
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="navItem"]:not([class*="navItemIcon"]):active {
  transform: translateY(1px);

  box-shadow:
    /* Highlights reduced */
    inset 0 1px 0 rgba(232, 192, 96, 0.15),
    inset 1px 0 0 rgba(232, 192, 96, 0.08),

    /* Stronger inner shadow — pressed in */
    inset 0 2px 6px rgba(0, 0, 0, 0.65),
    inset 0 -1px 0 rgba(0, 0, 0, 0.40),

    /* Drop shadow nearly gone — button is down */
    0 1px 0 rgba(74, 40, 24, 0.40),
    0 2px 4px rgba(0, 0, 0, 0.40);
}
```

**Active state (navItemActive — current page):**

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="btn3dActive"],
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="navItemActive"] {
  background:
    linear-gradient(180deg,
      rgba(232, 176, 64, 0.45) 0%,         /* saffron horizon top */
      rgba(168, 120, 48, 0.55) 30%,        /* patinated gold mid */
      rgba(58, 42, 88, 0.85) 70%,
      rgba(14, 14, 44, 0.92) 100%);
  border-color: var(--theme-polished-gold);
  color: var(--theme-pearl-ivory);
  text-shadow: 0 0 10px var(--theme-glow-saffron-strong);

  box-shadow:
    inset 0 1px 0 rgba(255, 240, 200, 0.40),
    inset 0 2px 0 rgba(232, 192, 96, 0.25),
    inset 1px 0 0 rgba(232, 192, 96, 0.32),

    inset 0 -2px 4px rgba(0, 0, 0, 0.40),
    inset 0 -1px 0 rgba(74, 40, 24, 0.65),
    inset -1px 0 2px rgba(0, 0, 0, 0.25),

    0 1px 0 rgba(232, 192, 96, 0.55),
    0 2px 0 rgba(74, 40, 24, 0.70),
    0 4px 8px rgba(0, 0, 0, 0.45),
    0 0 18px var(--theme-glow-saffron);
}
```

#### 2.0.2 Header buttons (POŠTA, TYKY, ODHLÁSIT)

Stejný 3D systém, mírně menší proporce + uppercase:

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] > header [class*="headerBtn"],
[data-theme="arabsky-svet"][data-shell="ikaros"] > header button:not([class*="logo"]) {
  background:
    linear-gradient(180deg,
      rgba(58, 30, 8, 0.95) 0%,
      rgba(30, 18, 8, 0.97) 50%,
      rgba(20, 10, 4, 0.98) 100%);
  border: 1px solid var(--theme-patinated-gold);
  color: var(--theme-polished-gold);
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 10px 18px;
  border-radius: 3px;
  transition: all 200ms ease-out;

  box-shadow:
    inset 0 1px 0 rgba(232, 192, 96, 0.30),
    inset 0 2px 0 rgba(232, 192, 96, 0.10),
    inset 1px 0 0 rgba(232, 192, 96, 0.15),
    inset 0 -2px 3px rgba(0, 0, 0, 0.45),
    inset 0 -1px 0 rgba(0, 0, 0, 0.55),
    0 1px 0 rgba(168, 120, 48, 0.35),
    0 2px 0 rgba(60, 30, 8, 0.70),
    0 3px 6px rgba(0, 0, 0, 0.50);
}

[data-theme="arabsky-svet"][data-shell="ikaros"] > header [class*="headerBtn"]:hover,
[data-theme="arabsky-svet"][data-shell="ikaros"] > header button:not([class*="logo"]):hover {
  border-color: var(--theme-polished-gold);
  color: var(--theme-pearl-ivory);
  transform: translateY(-1px);

  box-shadow:
    inset 0 1px 0 rgba(232, 192, 96, 0.45),
    inset 0 2px 0 rgba(232, 192, 96, 0.18),
    inset 1px 0 0 rgba(232, 192, 96, 0.25),
    inset 0 -2px 3px rgba(0, 0, 0, 0.50),
    inset 0 -1px 0 rgba(0, 0, 0, 0.60),
    0 2px 0 rgba(232, 192, 96, 0.45),
    0 4px 0 rgba(60, 30, 8, 0.70),
    0 6px 12px rgba(0, 0, 0, 0.55),
    0 0 14px var(--theme-glow-saffron-strong);
}

[data-theme="arabsky-svet"][data-shell="ikaros"] > header [class*="headerBtn"]:active {
  transform: translateY(0);
  box-shadow:
    inset 0 1px 0 rgba(232, 192, 96, 0.15),
    inset 0 2px 6px rgba(0, 0, 0, 0.65),
    inset 0 -1px 0 rgba(0, 0, 0, 0.40),
    0 1px 3px rgba(0, 0, 0, 0.40);
}
```

#### 2.0.3 „+" tlačítka (rightAddBtn / addBtn)

3D mosazný kabošon vzhled — bohatší než nav buttons (premium):

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="rightAddBtn"],
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="addBtn"]:not([class*="btn3d"]) {
  position: relative;
  background:
    linear-gradient(180deg,
      rgba(255, 220, 140, 0.70) 0%,        /* polished gold top */
      rgba(232, 176, 64, 0.85) 30%,        /* saffron mid */
      rgba(168, 120, 48, 0.90) 60%,        /* patinated gold lower */
      rgba(120, 80, 32, 0.92) 100%);       /* brass deep bottom */
  border: 1px solid var(--theme-polished-gold);
  color: var(--theme-text-on-gold);          /* dark walnut text na zlatě */
  padding: 8px 14px 8px 38px;
  border-radius: 4px;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  transition: all 200ms ease-out;

  box-shadow:
    /* SUPER strong highlight — mosaz reflexivní */
    inset 0 1px 0 rgba(255, 250, 220, 0.75),
    inset 0 2px 0 rgba(255, 240, 200, 0.40),
    inset 1px 0 0 rgba(255, 240, 200, 0.30),

    /* Bottom emboss */
    inset 0 -2px 3px rgba(74, 40, 24, 0.55),
    inset 0 -1px 0 rgba(60, 30, 8, 0.75),
    inset -1px 0 0 rgba(74, 40, 24, 0.40),

    /* Drop shadow s warm halo */
    0 1px 0 rgba(232, 192, 96, 0.60),
    0 2px 0 rgba(74, 40, 24, 0.70),
    0 4px 8px rgba(0, 0, 0, 0.40),
    0 0 12px var(--theme-glow-saffron);
}

[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="rightAddBtn"]:hover {
  background:
    linear-gradient(180deg,
      rgba(255, 240, 180, 0.85) 0%,
      rgba(255, 208, 96, 0.95) 30%,
      rgba(200, 152, 56, 0.95) 60%,
      rgba(140, 96, 40, 0.95) 100%);
  transform: translateY(-2px);

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 240, 0.90),
    inset 0 2px 0 rgba(255, 240, 200, 0.55),
    inset 1px 0 0 rgba(255, 240, 200, 0.45),
    inset 0 -2px 3px rgba(74, 40, 24, 0.60),
    inset 0 -1px 0 rgba(60, 30, 8, 0.80),

    0 2px 0 rgba(232, 192, 96, 0.70),
    0 4px 0 rgba(74, 40, 24, 0.75),
    0 6px 14px rgba(0, 0, 0, 0.50),
    0 0 22px var(--theme-glow-saffron-strong);
}

[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="rightAddBtn"]:active {
  transform: translateY(1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 240, 200, 0.30),
    inset 0 2px 6px rgba(74, 40, 24, 0.70),
    inset 0 -1px 0 rgba(60, 30, 8, 0.55),
    0 1px 2px rgba(0, 0, 0, 0.40);
}
```

#### 2.0.4 Skin selector (ZLATÝ STANDARD ▼)

Stejný styling jako header buttons (popsáno v 2.0.2).

#### 2.0.5 PJ badge (3D coin-like)

Drahokamový mosazný coin:

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="pjBadge"],
[data-theme="arabsky-svet"][data-shell="ikaros"] [data-role-badge="pj"] {
  background:
    radial-gradient(ellipse 100% 100% at 50% 30%,
      rgba(255, 240, 200, 0.80) 0%,
      rgba(232, 192, 96, 0.95) 40%,
      rgba(168, 120, 48, 1) 75%,
      rgba(120, 80, 32, 1) 100%);
  color: var(--theme-text-on-gold);
  border: 1px solid var(--theme-ruby-crystal);
  border-radius: 3px;
  padding: 3px 10px 3px 16px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.10em;
  text-transform: uppercase;

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 240, 0.75),
    inset 0 -1px 0 rgba(74, 40, 24, 0.55),
    inset 1px 0 0 rgba(255, 240, 200, 0.30),
    inset -1px 0 0 rgba(60, 30, 8, 0.35),

    0 1px 0 rgba(232, 192, 96, 0.55),
    0 2px 4px rgba(0, 0, 0, 0.40),
    0 0 10px var(--theme-glow-saffron);
}
```

#### 2.0.6 Show-all links + showAllLink

Drobné decorative buttons s mírně reliéfním pocitem (ne plný 3D, jen subtle):

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="showAllLink"],
[data-theme="arabsky-svet"][data-shell="ikaros"] a[class*="showAll"] {
  display: inline-block;
  padding: 4px 10px;
  border: 1px solid rgba(168, 120, 48, 0.50);
  border-radius: 3px;
  background: linear-gradient(180deg, rgba(14, 26, 58, 0.50), rgba(10, 14, 44, 0.70));
  box-shadow:
    inset 0 1px 0 rgba(232, 192, 96, 0.15),
    0 1px 2px rgba(0, 0, 0, 0.30);
  /* ... text styling zůstává */
}
```

---

### 2.1 [A] Damask wallpaper pattern na panelech

**Implementace:** Inline SVG data-uri tile v `index.ts` jako `--asset-damask-pattern`. Aplikace na `[data-frame-panel]` jako BG layer s opacity 0.05.

```ts
// V index.ts — orientální damask pattern (subtle islamic geometric tile)
const DAMASK_PATTERN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80' fill='none' stroke='%23e8b040' stroke-width='0.8' opacity='0.5'><path d='M40 4 L52 16 L64 16 L56 28 L64 40 L52 40 L40 64 L28 40 L16 40 L24 28 L16 16 L28 16 Z'/><circle cx='40' cy='40' r='4'/><path d='M4 40 L16 40 M64 40 L76 40 M40 4 L40 16 M40 64 L40 76'/></svg>\")";
```

**CSS aplikace:**
```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [data-frame-panel="sidebar"]::before,
[data-theme="arabsky-svet"][data-shell="ikaros"] [data-frame-panel="right"]::before,
[data-theme="arabsky-svet"][data-shell="ikaros"] [data-frame-panel="novinky"]::before {
  content: '';
  position: absolute;
  inset: 1px;
  background-image: var(--asset-damask-pattern);
  background-size: 80px 80px;
  background-repeat: repeat;
  opacity: 0.05;
  pointer-events: none;
  z-index: 0;
  border-radius: 5px;
}
```

**Pozor:** panely už mají `position: relative` (z 1.0r). Damask vrstva je `z-index: 0`, content musí být `z-index: 1+`. Nemusí kolidovat s corners (z-index: 5).

### 2.2 [A] Silk shimmer overlay

Diagonal sheen gradient přes celý panel, mix-blend-mode soft-light.

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [data-frame-panel="sidebar"],
[data-theme="arabsky-svet"][data-shell="ikaros"] [data-frame-panel="right"],
[data-theme="arabsky-svet"][data-shell="ikaros"] [data-frame-panel="novinky"] {
  background-image:
    linear-gradient(135deg,
      rgba(232, 192, 96, 0.04) 0%,
      rgba(168, 40, 60, 0.02) 35%,
      rgba(232, 192, 96, 0.04) 70%,
      rgba(26, 138, 138, 0.03) 100%),
    /* + původní gradient */
    linear-gradient(160deg, rgba(14, 26, 58, 0.88) 0%, rgba(10, 14, 44, 0.94) 100%);
}
```

### 2.3 [A] Multi-layer border (gold + turquoise + gold trio)

Box-shadow stacking pro 3 vrstvy borderu (místo single 1px).

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [data-frame-panel="sidebar"],
[data-theme="arabsky-svet"][data-shell="ikaros"] [data-frame-panel="right"],
[data-theme="arabsky-svet"][data-shell="ikaros"] [data-frame-panel="novinky"] {
  /* border zůstává 1px patinated-gold (outer line) */
  border: 1px solid var(--theme-patinated-gold);
  box-shadow:
    /* nová: middle turquoise + inner gold layers */
    inset 0 0 0 3px rgba(10, 14, 44, 0.5),                 /* spacer 1 */
    inset 0 0 0 4px rgba(26, 138, 138, 0.45),              /* middle turquoise */
    inset 0 0 0 5px rgba(10, 14, 44, 0.5),                 /* spacer 2 */
    inset 0 0 0 6px rgba(168, 120, 48, 0.50),              /* inner gold */
    /* původní deep shadow ven */
    0 6px 22px rgba(10, 14, 44, 0.70);
}
```

### 2.4 [B] Theatrum mihrab — welcome card přepracování

**Lomený arch tvar:** velký border-radius na top edges (40% horní polovina + 8% spodní rohy).

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [data-frame-panel="card"],
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="welcomeCard"] {
  /* Nový mihrab tvar: lomené topy + rovné spodní rohy */
  border-radius: 100px 100px 8px 8px;
  /* mihrab depth: inner gradient temnější uvnitř arch */
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%,
      rgba(232, 192, 96, 0.12) 0%,
      transparent 50%),
    radial-gradient(ellipse at top left, rgba(232, 192, 96, 0.10) 0%, transparent 60%),
    linear-gradient(180deg, var(--theme-midnight-indigo) 0%, var(--theme-midnight-night) 100%);
}
```

**Backlit medailon halo:**

```css
[data-theme="arabsky-svet"] [data-frame-panel="card"] [data-andel-medallion] {
  /* Halo přes box-shadow + outline glow */
  filter: drop-shadow(0 4px 14px rgba(10, 14, 44, 0.75))
          drop-shadow(0 0 32px rgba(232, 176, 64, 0.45));
}
```

**Mukarnas mini-cornice uvnitř welcome card** (horní hrana, malá voštinová římsa):

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [data-frame-panel="card"] [class*="welcomeBody"]::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 24px;
  background-image: var(--asset-mukarnas-cornice);
  background-size: 96px 24px;
  background-repeat: repeat-x;
  background-position: center top;
  opacity: 0.50;
  pointer-events: none;
  z-index: 1;
}
```

*Poznámka: pokud nelze inject `::before` na welcomeBody, alternativně použít `[data-frame-panel="card"]::before` overload (ale to už drží rose-petals-scatter — pak vrstvit).*

### 2.5 [B] Section title flourish brackets

Inline SVG ornamentální swirl jako `::before` a `::after` na section titles.

```ts
// V index.ts
const FLOURISH_LEFT =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 16' fill='none' stroke='%23a87830' stroke-width='1.2' stroke-linecap='round'><path d='M2 8 Q12 2 22 8 Q26 10 30 8 Q34 6 38 8 Q42 10 46 8'/><circle cx='46' cy='8' r='1.5' fill='%23a87830'/></svg>\")";

const FLOURISH_RIGHT =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 16' fill='none' stroke='%23a87830' stroke-width='1.2' stroke-linecap='round'><circle cx='2' cy='8' r='1.5' fill='%23a87830'/><path d='M2 8 Q6 6 10 8 Q14 10 18 8 Q22 6 26 8 Q36 14 46 8'/></svg>\")";
```

**CSS:**
```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="sectionTitle"]::before {
  content: '';
  display: inline-block;
  width: 48px;
  height: 14px;
  margin-right: 12px;
  vertical-align: middle;
  background-image: var(--asset-flourish-left);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center right;
  opacity: 0.75;
}

/* `::after` flourish-right ALE už existuje `::after` pro horizon-mihrab divider.
   Řešení: použít `::after` jen pro divider, flourish-right inject jako inline SVG vedle textu */
```

**Pozor:** Section title má jen 1× `::after` (horizon-mihrab divider). Nelze stacknout. Řešení A: použít `::before` jen pro flourish-left a do welcome welcome wrap text se SVG flourishes inline. Řešení B: použít wrapper.

Pragmatický kompromis: **přidat flourish jen vlevo (`::before`)** + horizon-mihrab divider (`::after`) zůstává. Pravý flourish vynechat NEBO udělat jako element uvnitř titulu (vyžaduje úpravu komponenty — mimo scope).

### 2.6 [B] Welcome title font upgrade

Bohatší typografická hierarchie:

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="welcomeTitle"] {
  font-weight: 700;
  letter-spacing: 0.04em;
  text-shadow:
    0 1px 2px rgba(10, 14, 44, 0.75),
    0 0 24px rgba(232, 176, 64, 0.25);
  text-transform: uppercase;
}
```

### 2.7 [B] Signature flourish brackets

Kaligrafické svinky před a za signaturou.

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="welcomeSignature"]::before {
  content: '';
  display: inline-block;
  width: 60px;
  height: 16px;
  margin-right: 16px;
  vertical-align: middle;
  background-image: var(--asset-flourish-left);
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.85;
}

[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="welcomeSignature"]::after {
  content: '';
  display: inline-block;
  width: 60px;
  height: 16px;
  margin-left: 16px;
  vertical-align: middle;
  background-image: var(--asset-flourish-right);
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.85;
}
```

### 2.8 [C] PJ badge gem inset

Drobný drahokam uprostřed badge — inline SVG s ruby cabochon.

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="pjBadge"]::before,
[data-theme="arabsky-svet"][data-shell="ikaros"] [data-role-badge="pj"]::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 4px;
  vertical-align: middle;
  background: radial-gradient(circle, #d8485c 0%, #a8283c 60%, transparent 100%);
  border-radius: 50%;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.5);
}
```

### 2.9 [C] Corner gem accent na nav buttons

**Žádné** — corner gemy by zahltily nav buttony. Kompromis: **pouze active nav** dostane bigger arabesque vine + brighter Hamsa pulse animation (1× per 3s subtle opacity puls).

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="btn3dActive"]::after,
[data-theme="arabsky-svet"][data-shell="ikaros"] [class*="navItemActive"]::after {
  opacity: 0.30;
  animation: arabsky-hamsa-pulse 3s ease-in-out infinite;
}

@keyframes arabsky-hamsa-pulse {
  0%, 100% { opacity: 0.22; }
  50%      { opacity: 0.40; }
}
```

### 2.10 Light leak from genie lamp

Subtle warm ambient kolem welcome card horní pravé hrany (jako by lampa skutečně osvětlovala scénu).

```css
[data-theme="arabsky-svet"][data-shell="ikaros"] main {
  /* Posílit light leak — radial gradient v top-right */
  background:
    radial-gradient(circle at calc(100% - 60px) 80px,
      rgba(232, 192, 96, 0.06) 0%,
      transparent 25%);
}
```

---

## 3. Animace inventář (po follow-up)

**Celkem 6 ambient + 1 one-shot:**

| # | Animace | Trvání | Změna |
|---|---|---|---|
| 1 | rose-petal-drift (3 vrstvy) | 90s/120s/150s | beze změny |
| 2 | narghile-smoke | 8s | beze změny |
| 3 | genie-lamp-sway | 14s | beze změny |
| 4 | caustic-breathe | 4s | beze změny |
| 5 | signature-self-draw | 2s one-shot | beze změny |
| 6 | **hamsa-pulse** (NEW) | 3s ease-in-out | NOVÁ — active nav Hamsa subtle opacity pulse |

Reduced-motion vypíná hamsa-pulse (opacity static 0.30).

---

## 4. Soubory a změny

| Soubor | Akce | Velikost změny |
|--------|------|----------|
| [`src/themes/themes/arabsky-svet/index.ts`](../../../src/themes/themes/arabsky-svet/index.ts) | **Přidat 3 inline SVG konstanty** (DAMASK_PATTERN, FLOURISH_LEFT, FLOURISH_RIGHT) + 3 nové CSS var | +30 řádků |
| [`src/themes/themes/arabsky-svet/decorations.css`](../../../src/themes/themes/arabsky-svet/decorations.css) | **Přepsat sekce 6, 10, 17, 20** (3D buttons system: header / nav / „+" / PJ badge) + **doplnit 9 nových pravidel** (damask BG, silk shimmer, multi-layer border, mihrab arch, backlit medailon, mukarnas v welcome, section flourish, signature brackets, hamsa-pulse) | +350 řádků (3D systém je velký) |

**Mimo scope:**
- Globální CSS (žádné)
- Shell layout komponenty (žádné)
- Nové assety (žádné — vše inline SVG nebo CSS)
- Ostatní 21 skinů (nulová regrese)
- Theme registry (žádný edit)
- Mihrab arch přes clip-path (problematické s box-shadow — používáme border-radius)
- Section title right-side flourish (vyžadovalo by úpravu komponenty)

---

## 5. Akceptační kritéria

### 3D tlačítka (priority 0)
- [ ] **AC-0a**: Nav buttons (`btn3d` / `navItem`) mají reliéfní 3D vzhled — multi-stop gradient, top highlight (saffron @ 35% + 12%), bottom emboss (black @ 45% + 55%), drop shadow stack (0 2px 0 brass + 0 4px 8px black + 0 8px 16px black)
- [ ] **AC-0b**: Nav hover → translateY(-2px), brighter highlights, gold halo
- [ ] **AC-0c**: Nav active (pressed) → translateY(1px), inner pressed shadow, no drop shadow
- [ ] **AC-0d**: Nav active state (current page) → saffron gradient top, gold border, glow halo
- [ ] **AC-0e**: Header buttons (POŠTA/TYKY/ODHLÁSIT) mají 3D embossed style, mírně menší
- [ ] **AC-0f**: „+" tlačítka mají premium mosazný kabošon 3D — saffron→patinated gold gradient, super strong top highlight (cream 75%), warm glow halo
- [ ] **AC-0g**: PJ badge je 3D mosazný coin s radial gradient + ruby border
- [ ] **AC-0h**: Show-all links mají subtle 3D border + slight inset (méně dramatic než nav)
- [ ] **AC-0i**: Všechny 3D states (hover/active/focus) jsou plynulé `transition: all 200ms ease-out`

### Direction D refinement
- [ ] **AC-1**: Panely (sidebar / right / novinky) mají damask wallpaper pattern v BG @ 5% opacity
- [ ] **AC-2**: Panely mají diagonal silk shimmer overlay (subtle saffron + ruby + saffron + turquoise gradient)
- [ ] **AC-3**: Panely mají multi-layer border (outer 1px gold + inset turquoise + inner gold) přes box-shadow stack
- [ ] **AC-4**: Welcome card má mihrab arch shape (border-radius 100px na horních rozích)
- [ ] **AC-5**: Welcome card má backlit medailon halo (saffron radial drop-shadow ~24px blur za medailonem)
- [ ] **AC-6**: Welcome card má mukarnas mini-cornice uvnitř horní hrany (subtle 60% width, opacity 0.50)
- [ ] **AC-7**: Section titles mají flourish-left bracket před uppercase textem
- [ ] **AC-8**: Welcome signature má flourish brackets před a za textem
- [ ] **AC-9**: Welcome title má upgrade (uppercase, weight 700, letter-spacing 0.04em, gold glow shadow)
- [ ] **AC-10**: PJ badge má ruby gem inset před textem (8×8 radial gradient)
- [ ] **AC-11**: Active nav má hamsa-pulse 3s subtle (opacity 0.22 → 0.40 → 0.22)
- [ ] **AC-12**: Genie lamp má light leak ambient v hlavním panelu (subtle warm radial v top-right)
- [ ] **AC-13**: Reduced-motion vypíná hamsa-pulse (static 0.30)
- [ ] **AC-14**: WCAG contrast — všechny nové textové kombinace zůstávají ≥ AA (žádné nové text barvy nepřibyly)
- [ ] **AC-15**: Welcome text čitelnost zachována — damask/shimmer texturyJSOU NA PANELECH, ne pod text content
- [ ] **AC-16**: Žádný globální dopad — všechny změny scoped na `[data-theme="arabsky-svet"]`

---

## 6. Rizika & mitigace

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|------------------|-------|----------|
| Damask pattern + silk shimmer + multi-layer border = vizuální chaos | M | V | Striktní opacity (damask 0.05, shimmer 0.04, border insety 0.45-0.5), žádný překryv pod text content |
| Multi-layer border konfliktuje s corner ornaments (z-index) | M | M | Box-shadow je inset, corner ornaments z-index 5 → zůstanou nad shadow |
| Mihrab border-radius 100px může lookat divně na úzkých viewportech | V | M | Mobile media query → border-radius redukce na 40px |
| Mukarnas uvnitř welcome card konfliktuje s rose-petals-scatter (`::before`) | V | V | Použít nový `[data-decor="welcome-mukarnas"]` element NEBO welcomeBody `::before` (pokud má position relative) — fallback CSS pomocí container query |
| Section title flourish-left `::before` kolize s adinkra/girih watermark `::before` | M | M | Watermark je na `[data-section-key]` (parent), flourish na `[class*="sectionTitle"]` (child) — různé elementy, OK |
| Hamsa pulse 3s může být příliš výrazné | N | M | Opacity ramp 0.22 → 0.40 je velmi jemný; pokud uživatel řekne stop, snadno škrtneme |
| PJ badge gem inset změní layout (margin-right) | N | S | Použít `display: inline-block` + `vertical-align: middle` (žádný layout shift) |
| Light leak ambient zhorší čitelnost textu pod lampou | N | S | Gradient 25% reach, opacity 0.06 — minimální |
| Welcome title uppercase změní accessibility (`text-transform: uppercase` zachovává původní HTML pro screen readers) | N | N | Browser standard, žádný a11y problém |

---

## 7. Originální motivy přidané v 1.0r-followup

12. **Damask wallpaper pattern** na panelech (subtle SVG geometric islamic tile) — žádný jiný skin nemá ornamental wallpaper na panel BG
13. **Silk shimmer diagonal overlay** — žádný jiný skin nemá diagonal saffron+ruby+turquoise sheen
14. **Multi-layer border** (outer gold + middle turquoise + inner gold trio) — žádný jiný skin nemá 3-vrstvý ornamental border přes box-shadow stack
15. **Mihrab arch welcome card** (border-radius 100px na horních rozích, lomený oblouk) — žádný jiný skin nemá architectural arch shape welcome
16. **Backlit medailon saffron halo** — žádný jiný skin nemá backlit drop-shadow glow za medailonem
17. **Mukarnas mini-cornice uvnitř welcome card** (interní voštinová římsa) — africké má acacia canopy v topbaru, severské má rune circle, ale uvnitř welcome card nikdo
18. **Kaligrafické flourish brackets** na section titles + signature — žádný jiný skin nemá ornamental swirl brackets okolo textu

---

## 8. Workflow & schválení

1. ✅ **Brainstorming** — proveden 2026-05-11 (Direction D: A + B + minimal C)
2. 🟡 **Spec follow-up** — **TENTO DOKUMENT** (čeká na schválení)
3. ⏭️ **Implementace** — po schválení (index.ts + decorations.css, jeden commit)
4. ⏭️ **Re-screenshots** — 3 viewporty + zoom
5. ⏭️ **Lint + contrast audit**
6. ⏭️ **Commit + push** na origin/main (samostatný commit fix(themes/arabsky-svet): 1.0r-followup richness)

---

**Status:** ✅ Implementováno
Po souhlasu → kód v jednom passu (žádný separátní impl. plán dokument — změny jsou aditivní, žádné nové assety).

---

### Hlavní rizikové místo

**Mukarnas mini-cornice ve welcome card** — `[data-frame-panel="card"]::before` už drží rose-petals-scatter. Musíme přidat mukarnas na jiný element. Řešení v implementaci:
- Inject přes `[class*="welcomeBody"]::before` (pokud welcomeBody existuje v DOM)
- Fallback: nový pseudo na child první element (`[data-frame-panel="card"] > *:first-child::before`)
- Nouzové řešení: vynechat mukarnas mini-cornice z follow-upu (acceptable trade-off)

V implementaci ověřím DOM strukturu welcome card a vyberu nejlepší selector.
