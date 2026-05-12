# Spec 1.0u — Magie a kouzla visual upgrade

**Datum:** 2026-05-11
**Status:** 🟡 ke schválení (REV2 — refactored po feedbacku z aktuálního screenshotu)
**Skin:** `magie` (Magie a kouzla)
**Branch:** `main` (direct commit po dokončení, vzorem `1.0s` kyberpunk / `1.0t` postapo)
**Scope:** `[data-theme="magie"]` — žádný globální dopad

---

## 1. Koncept & atmosféra

> **„Kouzelnická síň, kde tlačítka levitují jako enchanted artefakty z mágovi knihovny."**

User explicitně potvrdil: **stávající 3D glassmorphic styl tlačítek je THE foundation** — pill rounded shape, gold-bordered, translucent dark BG přes který prosvítá magie pozadí (mág + krystaly + aurora). Tento spec ho **dotahuje a rozšiřuje** na všechna tlačítka napříč shellem (header + levý panel + pravý panel).

**Mysticita** přichází z:
- Glassmorphic backdrop-blur (BG prosvítá skrz panely i tlačítka)
- Polished 3D bevel (deeper shadows, dual-tone border zlato+ametyst inset)
- Pomalý subtle pohyb (levitate, drift, rotate — 25-120s loops, žádný flicker)
- Iridescence (hue-shift accent gradient, ametyst+gold+silver harmony)

**Cíl:** Skin musí vypadat **přiměřeně magicky** — ne kýčově, ne uměle. Refined-elegant.

---

## 2. Color palette

User feedback: **zlato z loga zůstává primárním border accentem**, ametyst posunut na hover glow + decorative ornaments.

| Token | Barva | Role |
|---|---|---|
| `--magie-night-violet` | `#0a0418` | BG base, deep frame |
| `--magie-velvet` | `#160a2e` | Surface base |
| `--magie-royal` | `#241048` | Surface lift |
| `--magie-gold-antique` | `#d4a017` | **Primary border + active accent** (z loga) |
| `--magie-gold-bright` | `#f5c853` | Hover/focus border |
| `--magie-gold-deep` | `#7a5a08` | Pressed inset |
| `--magie-amethyst` | `#9d4edd` | **Hover glow + active inner + decorative** |
| `--magie-amethyst-bright` | `#c77dff` | Sparkle, particles, comet |
| `--magie-amethyst-deep` | `#5a189a` | Active inner background |
| `--magie-silver-moon` | `#d4d8ff` | Secondary text, corner shimmer, section accent |
| `--magie-aurora-teal` | `#2dd4bf` | Jemný section accent (vesmíry/světy) |
| `--magie-rose-mist` | `#ff8fc7` | Jemný section accent (chat/diskuze) |
| `--magie-pearl` | `#f4f0ff` | Body text na tmavém |

---

## 3. Typography — 100% unikátní 5-font sada

**Audit:** všechny ostatní skiny (20×) byly proskenovány — žádný z 4 níže vybraných fontů (Quintessential, Macondo, Sorts Mill Goudy, Mea Culpa) **není použit nikde jinde**. Cinzel Decorative je jen logo fallback (baked do raster loga).

| Role | Font | Účel | Unique? |
|---|---|---|---|
| Logo (fallback) | **Cinzel Decorative** | baked do raster loga, fallback only | sdílí s modre-nebe/zlaty-standard (jen fallback, neviditelný) |
| Display heading | **Quintessential** | section titles + welcome H1, characterful flourish serif s magical-book feelingem | ✅ **unikátní** |
| Section accent | **Macondo** | section accent labels (welcome, novinky, signature lead-in) — playful magical handwriting, lehkost+hravost | ✅ **unikátní** |
| Body | **Sorts Mill Goudy** | běžný text, elegant antique book serif s krásnými italics | ✅ **unikátní** |
| Signature | **Mea Culpa** | administrator signature — extra-thin elegant cursive, éterický closing flourish | ✅ **unikátní** |

**Pairing rationale:**
- Quintessential (flourish) + Sorts Mill Goudy (clean) — display vs body kontrast, jako iluminovaný titulek vs hand-set sazba
- Macondo (handwritten) jako sekundární accent — láme dva serify, dodává hravosti
- Mea Culpa (thin cursive) — kontrast k Macondo, signature je formálnější rukopis

**Google Fonts URL bude přidán do `index.html` (jedním tagem load 4 fonty + Cinzel Decorative subset):**
```
https://fonts.googleapis.com/css2?family=Quintessential&family=Macondo&family=Sorts+Mill+Goudy:ital@0;1&family=Mea+Culpa&family=Cinzel+Decorative:wght@400;700&display=swap
```

---

## 4. ⭐ HERO MOTIV — Polished glassmorphic btn3d (foundation extension)

**Kontext:** sdílený modul `src/themes/_shared/btn3d.module.css` poskytuje `btn3d`, `btn3dActive`, `btn3dPrimary`. Používají ho:
- `headerBtn` (pošta, Tyky, odhlásit) — top
- `navItem` (Úvodník, Vytvořit svět, Diskuze, …) — levý panel
- `rightAddBtn` (Přidat) — pravý panel
- ostatní 3 místa kde `composes: btn3d`

**Magie scope:** všechny tyto cílíme přes `[data-theme="magie"] [class*="btn3d"]`. Override CSS custom property values (zlato+ametyst paleta), přidáme `backdrop-filter`, deeper bevel, dual-layer border.

### 4.1. Idle state (default)

```css
[data-theme="magie"][data-shell="ikaros"] [class*="btn3d"] {
  /* Glass base */
  background:
    linear-gradient(180deg, rgba(36, 16, 72, 0.40) 0%, rgba(10, 4, 24, 0.55) 100%);
  backdrop-filter: blur(8px) saturate(140%);
  -webkit-backdrop-filter: blur(8px) saturate(140%);

  /* Dual-layer border: gold outer + amethyst inset */
  border: 1px solid rgba(212, 160, 23, 0.50);
  box-shadow:
    inset 0 0 0 1px rgba(157, 78, 221, 0.18),  /* amethyst inner ring */
    inset 0 1px 0 0 rgba(245, 200, 110, 0.18),  /* top highlight */
    inset 0 -2px 0 0 rgba(0, 0, 0, 0.50),      /* bottom dark */
    0 3px 6px -1px rgba(0, 0, 0, 0.55),
    0 6px 12px -3px rgba(10, 4, 24, 0.55);

  color: var(--magie-silver-moon);
  font-family: var(--font-display);  /* Quintessential */
  /* zachovává shared padding/radius/transform/transition */
}
```

### 4.2. Hover state

```css
[data-theme="magie"] [class*="btn3d"]:hover:not(:disabled) {
  background:
    linear-gradient(180deg, rgba(60, 24, 110, 0.60) 0%, rgba(20, 8, 40, 0.75) 100%);
  border-color: var(--magie-gold-bright);
  color: var(--magie-pearl);
  transform: translateY(-3px);
  box-shadow:
    inset 0 0 0 1px rgba(157, 78, 221, 0.45),
    inset 0 1px 0 0 rgba(255, 230, 160, 0.30),
    inset 0 -2px 0 0 rgba(0, 0, 0, 0.55),
    0 5px 10px -2px rgba(0, 0, 0, 0.65),
    0 10px 18px -5px rgba(157, 78, 221, 0.40),  /* amethyst halo */
    0 12px 24px -8px rgba(212, 160, 23, 0.30);  /* gold halo */
}
```

### 4.3. Active state (current route, selected — uživatel zvolil „zlato + ametyst inner glow")

```css
[data-theme="magie"] [class*="btn3dActive"] {
  background:
    radial-gradient(ellipse 80% 100% at 50% 50%, rgba(90, 24, 154, 0.55) 0%, rgba(36, 16, 72, 0.85) 70%),
    linear-gradient(180deg, rgba(60, 24, 110, 0.85) 0%, rgba(20, 8, 40, 0.92) 100%);
  border-color: var(--magie-gold-antique);
  color: var(--magie-pearl);
  text-shadow: 0 0 8px rgba(212, 160, 23, 0.55);
  box-shadow:
    inset 0 0 0 1px rgba(212, 160, 23, 0.55),        /* gold rim inset */
    inset 0 0 14px 2px rgba(157, 78, 221, 0.45),     /* amethyst inner glow */
    inset 0 2px 4px 0 rgba(0, 0, 0, 0.55),           /* top dark (pressed) */
    0 0 0 1px rgba(212, 160, 23, 0.30),              /* gold outer rim */
    0 0 16px 0 rgba(157, 78, 221, 0.35);             /* amethyst halo */
}
```

### 4.4. Primary CTA (Přihlásit se / save)

```css
[data-theme="magie"] [class*="btn3dPrimary"] {
  background: linear-gradient(180deg, var(--magie-gold-bright) 0%, var(--magie-gold-antique) 100%);
  border-color: rgba(255, 240, 200, 0.65);
  color: #1a0a30;  /* dark ink on gold */
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.25);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 245, 210, 0.55),
    inset 0 -2px 0 0 rgba(90, 60, 8, 0.40),
    0 4px 10px -2px rgba(212, 160, 23, 0.55),
    0 8px 18px -4px rgba(157, 78, 221, 0.30);
}
```

### 4.5. Disabled

Zachovat shared `.btn3dDisabled` (opacity 0.4). Žádný override.

### 4.6. Why this works across header + nav + right panel

Všechna 3 místa používají `composes: btn3d`, takže výsledný DOM element má class `... btn3d_xxx ...`. Selektor `[class*="btn3d"]` chytí všechna z nich — **jeden styl, tři místa, konzistentní**.

**Topbar harmonization:** doplnit drobný override aby topbar buttons měly stejnou font-size/padding jako nav items (dnes mohou být nepatrně širší) — checked v IkarosLayout.module.css.

---

## 5. Glassmorphic Crystal Panels (sidebar + cards)

User feedback: středně průhledné (~55-65%) + backdrop-blur(14px) saturate(150%).

```css
[data-theme="magie"][data-shell="ikaros"] [data-frame-panel="sidebar"],
[data-theme="magie"][data-shell="ikaros"] [data-frame-panel="right"] {
  background:
    linear-gradient(160deg, rgba(36, 16, 72, 0.55) 0%, rgba(10, 4, 24, 0.65) 100%);
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  border: 1px solid rgba(212, 160, 23, 0.35);
  border-radius: 6px;
  box-shadow:
    inset 0 0 0 1px rgba(157, 78, 221, 0.12),
    0 8px 32px rgba(10, 4, 24, 0.55);
}
```

**Fallback:** browsers bez `backdrop-filter` dostanou silnější opacity (0.85 místo 0.55) přes `@supports not (backdrop-filter: blur(1px)) { ... }`.

---

## 6. ✦ Originální dekorativní motivy

### M1 — Faceted Amethyst Corner Crystal (RASTER) ✦

**Asset:** `ametyst-corner.webp` (256×256, transparent). Master TL roh, ostatní 3 přes `transform: scaleX/Y mirror`.

**Animace:** subtle levitation `translateY(-2px → +2px)` 6s ease-in-out infinite alternate, **phase offset** každý roh (0s / 1.5s / 3s / 4.5s).

**Liší se od:** kyberpunk HUD bracket (inline SVG L-shape), arabsky-svet mihrab arch, africke fan, postapo rivet corner — všechny inline SVG flat. **Magie = real 3D ametyst raster s fasetami a refrakcí.**

### M2 — Spell-Book Scrying Disc (welcome card centerpiece, RASTER) ✦

**Asset:** `spell-disc.webp` (512×512, transparent). Centerpiece za welcome textem.

**Animace:** pomalá rotace 90s linear infinite (CW). Opacity 0.18, `mix-blend-mode: screen`.

**Liší se od:** žádný jiný skin nemá rotující arcane composition v centru welcome card.

### M3 — Floating Arcane Sigils (per-section watermark, inline SVG) ✦

8× unikátní arcane sigil = kruhová kompozice s runovými glyfy (concentric circle composition). Statické, opacity 0.06, per-section barva (currentColor → section-color hot-swap).

**Sigily:**
| Sekce | Sigil |
|---|---|
| NAVIGACE | kruh s 8 paprsky + centrální okem |
| VESMÍRY | orbitální kruh + planety |
| CHAT | triquetra v kruhu |
| ADMINISTRACE | hexagram + dva kruhy |
| MOJE SVĚTY | zemská sféra + meridiány |
| MOJE DISKUZE | penta-spirála |
| OBLÍBENÉ ČLÁNKY | knižní pečeť |
| OBLÍBENÉ OBRÁZKY | oko v trojúhelníku |

### M4 — Iridescent Section Underline (hue-shift gradient) ✦

Section title underline = animovaný `linear-gradient` s hue-shift (gold → amethyst → silver → teal → rose → gold). 12s ease-in-out infinite. 1px hairline + 4px drop-shadow.

### M5 — Levitating navItem (individuální phase offset) ✦

NavItem baseline má **individuální phase offset** (`animation-delay: calc(var(--nav-i) * 0.7s)`) → karty nepulzují unisono. `magie-levitate` keyframes: `translateY(0 → -1px → 0)` 5s ease-in-out infinite alternate.

**Pozor:** **NEPŘEKRÝVÁ** shared `btn3d` hover `translateY(-3px)` — levitate je idle micro-motion, hover přidává navíc.

### M6 — Sparkle Orbit (active nav) ✦

Active nav item má 3 tiny sparkle dots (2px, ametyst+silver fills) obíhající jeho perimetr. CSS `@keyframes` rotace + offset-path. 6s loop, opacity 0.7, phase 0°/120°/240°.

### M7 — Administrator Signature (Mea Culpa + self-draw) ✦

Welcome card signature = "Příjemnou zábavu přeje administrátor." v **Mea Culpa** extra-thin cursive + SVG flourish self-draw (stroke-dasharray animace 2.5s ease-out 1). Mea Culpa má thin weight ~ jako pavoučí brk inkoust — perfektně lehký a éterický.

### Odsunuto na later polish (mimo M1.0u scope)

- ~~Drifting wisps~~ (vznášející prach + iskry) — pěkné, ale risk performance/distract. Lze přidat 1.0u-followup.
- ~~Comet streak~~ (shooting wisp) — sympatický moment delightu, ale komplikuje welcome card. Lze přidat 1.0u-followup.

---

## 7. Section accent mapping

| Sekce | Section barva | Důvod |
|---|---|---|
| NAVIGACE (levý) | gold-antique | hlavní navigace = primární zlato |
| VESMÍRY (levý) | aurora-teal | světy/dimenze |
| CHAT (levý) | rose-mist | komunikace |
| ADMINISTRACE (pravý) | gold-antique | královská autorita |
| MOJE SVĚTY (pravý) | aurora-teal | světy |
| MOJE DISKUZE (pravý) | rose-mist | rozhovor |
| OBLÍBENÉ ČLÁNKY (pravý) | gold-antique | archiv vzácností |
| OBLÍBENÉ OBRÁZKY (pravý) | silver-moon | galerie |

**Section barva ovlivňuje:**
- section title color (`Quintessential`)
- section accent label color (`Macondo`)
- iridescent underline base hue
- sigil watermark color
- section right-panel icon color

**Nav-item barva (6× v NAVIGACE):**
| Nav item | Barva |
|---|---|
| Úvodník | gold-antique (primární) |
| Vytvořit svět | aurora-teal |
| Diskuze | rose-mist |
| Články | gold-bright |
| Galerie | silver-moon |
| Nápověda | amethyst-bright |

**Nav-item barva ovlivňuje:** ikona color, hover glow tint (jemně), active sparkle orbit color.

**Aktivní stav border zůstává VŽDY gold-antique** napříč všemi sekcemi (sekce barva neovlivňuje active border) — koheze s logem.

---

## 8. Assety

### 8.1. Raster (5 celkem — 3 existující + 2 nové)

| Asset | Zdroj | Cíl | Status |
|---|---|---|---|
| `logo.webp` | `assets-source/themes/magie/logo.png` | `public/themes/magie/decor/logo.webp` | ⏳ konvert |
| `medailon.webp` | `assets-source/themes/magie/medailon.png` | `public/themes/magie/decor/medailon.webp` | ⏳ konvert |
| `magie.webp` (BG) | existuje | `public/themes/backgrounds/magie.webp` | ✅ ponechat |
| **`ametyst-corner.webp`** | ChatGPT (prompt 1) → `assets-source/themes/magie/ametyst-corner.png` | `public/themes/magie/decor/ametyst-corner.webp` | 🆕 ke generování |
| **`spell-disc.webp`** | ChatGPT (prompt 2) → `assets-source/themes/magie/spell-disc.png` | `public/themes/magie/decor/spell-disc.webp` | 🆕 ke generování |

### 8.2. Inline SVG (cca 16 vars v `index.ts`)

| Var | Účel |
|---|---|
| `--asset-sigil-nav` až `--asset-sigil-image` | 8× arcane sigil per section |
| `--asset-icon-uvodnik` až `--asset-icon-hospoda` | 7× nav medailon ikony |
| `--asset-icon-administrace` až `--asset-icon-oblibene-obrazky` | 5× pravý panel section ikony |
| `--asset-signature-flourish` | signature self-draw SVG path |
| `--asset-plus-magic` | „+" tlačítko glyph (ametyst plus + sparkle) |
| `--asset-sparkle-dot` | 3× sparkle orbit dot |

---

## 9. Motion philosophy

- **Pomalé** (5-120s loops; nic decorative pod 4s)
- **Soft easing** (`ease-in-out`, ne linear, žádný flicker)
- **Layered phase offsets** — nav items, corner crystals, sparkle orbits — všechno offsetované
- **Reduced-motion: safe** — všechny dekorativní animace zastavené, opacity snížena, drift/rotate OFF

---

## 10. Spatial composition

- Sidebar panely = floating glass slabs (backdrop-blur, lift 4px od headeru)
- Welcome card = padding-heavy, text generously spaced (1.7 line-height)
- Section titles = **Quintessential**, Title Case, letter-spacing 0.08em (méně rozjetá než kyberpunk; Quintessential je už characterful sám o sobě)
- Section accent labels (např. „Vesmíry", „Chat (0)") = **Macondo**, mírně rotovaná baseline (transform: rotate(-0.5deg)) pro rukopisný feeling

---

## 11. Co se NEDĚLÁ

- ❌ Žádné jasné neonové laser glows (to je kyberpunk)
- ❌ Žádné runy na kamenech (to je severske-runy)
- ❌ Žádné gold-on-midnight geometrické rámy (zlaty-standard)
- ❌ Žádný flicker, žádný blackout efekt
- ❌ Žádné HUD plakety s hard-edge borders — okraje vždy soft / blurred / faceted
- ❌ Žádné kýčové kreslené hvězdy nebo emoji-style sparkles
- ❌ Žádné AI-generated 3D modely mimo 2 hero raster ornamenty
- ❌ **Nepřepisuje shared `btn3d.module.css`** — jen overrides přes CSS vars + selektor scoped na magie

---

## 12. Responsive (mobile)

**≤768px:**
- Backdrop-blur intenzita snížena na 10px (perf)
- Arcane sigil watermark menší (32×32 místo 48×48)
- Ametyst corner krystal `--asset-corner-size-mobile: 40px`
- Spell-disc scrying centerpiece menší + opacity 0.10
- Sparkle orbit na active nav vypnuté (perf)
- Welcome card padding kompaktnější
- Topbar buttons icon-only kde label `display: none`

**≤480px:**
- Ametyst corner ještě menší (32px)
- Medailon menší (112px)
- Backdrop-blur snížen na 6px

---

## 13. Otevřené otázky

| ID | Otázka | Doporučení |
|---|---|---|
| Q1 | **Topbar harmonization** — má topbar font-size sjednotit s nav items (může se zmenšit), nebo zachovat dnešní velikost? | Zachovat dnešní (header je viděl, nav je čtený) |
| Q2 | **Backdrop-filter Firefox fallback** — je acceptable že FF stable < 103 (rare) dostane silnější opacity místo blur? | ANO — graceful degradation |
| Q3 | **Welcome card spell-disc** — bude na pozadí *celé* karty, nebo jen *medailon* sloupce? | Celé karty (centerpiece za textem, viz M2) |
| Q4 | **Iridescent underline** — hue cycle 5 barev (gold+amethyst+silver+teal+rose) nebo užší (gold+amethyst+silver, 3 barvy)? | 5 barev, signature magie motiv |

---

## 14. Akceptační kritéria

- [ ] Skin scoped na `[data-theme="magie"]`, žádný globální dopad
- [ ] **Polished glassmorphic btn3d** funguje konzistentně na header + sidebar + pravý panel
- [ ] 2 hero raster assety vygenerované (ametyst-corner + spell-disc) a integrované jako WEBP
- [ ] Cca 16 inline SVG data-uri vars v `index.ts`
- [ ] 7 originálních motivů (M1-M7) implementováno
- [ ] 4-font typografie načítaná (Quintessential, Macondo, Sorts Mill Goudy, Mea Culpa + Cinzel Decorative fallback) — Google Fonts link
- [ ] Mobile breakpointy fungují (≤768px, ≤480px)
- [ ] Reduced-motion safe (`prefers-reduced-motion: reduce`)
- [ ] WCAG: contrast ratio ≥ 4.5:1 pro body text na všech glass surfaces (testovat s BG image overlay)
- [ ] `backdrop-filter` fallback for non-supporting browsers (`@supports`)
- [ ] Build pass: `bun run build` bez TypeScript errors
- [ ] Vizuální kontrola na desktop + mobile per `mobil-desktop` skill

---

**Po schválení tohoto spec:** napíšu `plan-1.0u.md` (impl. plán) a `prompts-1.0u-magie-assets.md` (2 prompty pro ChatGPT — ametyst-corner + spell-disc) ve společném balíku ke schválení.
