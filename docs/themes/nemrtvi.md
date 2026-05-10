# Téma: Nemrtví

**ID:** `nemrtvi`
**Stav:** ✅ 1.0k upgrade hotový (2026-05-10)
**Spec:** [spec-1.0k-nemrtvi-upgrade.md](../arch/phase-1/spec-1.0k-nemrtvi-upgrade.md)
**Plán:** [plan-1.0k.md](../arch/phase-1/plan-1.0k.md)
**Asset prompty:** [prompts-1.0k-nemrtvi-assets.md](../arch/phase-1/prompts-1.0k-nemrtvi-assets.md)
**Referenční obrázek:** [assets/nemrtvi.png](assets/nemrtvi.png)

---

## Atmosféra

**Sedlec Kostnice o půlnoci. Opuštěná nekromantická kapitula.** Blackened iron + weathered ivory bone + cracked dark stone + teal-ghost-green phosphorescence. Krypta dýchá pomalu, jako by spala. End-of-world dread, beznaděj, smrt — *svět končí*.

**Inspirační kotvy:** Bloodborne UI/architecture × Dark Souls 3 Cathedral of the Deep × Diablo IV crypts × Sedlec Kostnice (Kutná Hora) × Albrecht Dürer woodcuts × Goya Black Paintings.

---

## Barevná paleta

### Theme tokens (signature)

| Token | Hex | Použití |
|---|---|---|
| `--theme-stone-deep` | `#0c0d0a` | Obsidián, hlavní pozadí |
| `--theme-stone-mid` | `#13140f` | Midnight slate |
| `--theme-iron-cold` | `#2a2520` | Blackened iron border |
| `--theme-iron-warm` | `#3a3128` | Mírně teplejší iron |
| `--theme-bone-ivory` | `#cdc098` | Weathered ivory text + symboly |
| `--theme-bone-ivory-bright` | `#e8d8a8` | Heading highlight |
| `--theme-ghost-teal` | `#5fc8a8` | Klidná phosphorescence (border, accent) |
| `--theme-ghost-radium` | `#7cffae` | Hover/active emise (radium-bright) |
| `--theme-ghost-dim` | `#2a6856` | Lichen-verdigris |
| `--theme-blood-rust` | `#7a1814` | Oxidovaná stará krev (rare accent) |

### Hybrid akcent (Q&A 3 B)

- **Klid:** `--theme-ghost-teal` (#5fc8a8) — chladná phosphorescence, harmonizuje s medailonem
- **Hover/active:** `--theme-ghost-radium` (#7cffae) — radium-bright pulse, "kostnice se probudí při interakci"

### WCAG kontrast

- Bone-ivory `#cdc098` na obsidián `#0c0d0a` → **10.8:1** ✅ AAA
- Teal-ghost `#5fc8a8` na obsidián `#0c0d0a` → **9.2:1** ✅ AAA
- Radium-bright `#7cffae` na obsidián `#0c0d0a` → **13.5:1** ✅ AAA

---

## Typografie

| Role | Font | Důvod |
|---|---|---|
| Logo | **UnifrakturCook** | Blackletter, baked-in v `logo.webp` asset |
| Display | **New Rocker** | Dark Souls / Bloodborne UI font, gotický blackletter s broken serifs |
| Body | **IM Fell DW Pica** | Old letterpress s ink-bleed, "kniha co prožila staletí v kryptě" |
| Drop-cap "V" | UnifrakturCook | Gravitas, harmonizuje s logem |
| Signature italic | IM Fell DW Pica italic | Mortuální tón |

**Žádný overlap** s pergamenem (Petit Formal Script, EB Garamond), hospodou (Almendra, Spectral, Pirata One, Henny Penny), přírodou (Cormorant, Crimson, Tangerine), zlatým standardem (Cinzel, Lato, Great Vibes).

---

## Dekorativní prvky

### Assety (12 souborů v `public/themes/nemrtvi/decor/`)

| # | Asset | Účel |
|---|---|---|
| 1 | `logo.webp` | Header logo (horizontal banner, baked-in text) |
| 2 | `medailon.webp` | Anděl v iron+skull rámu |
| 3 | `corner-tl.webp` | Master TL roh, mirror přes CSS na ostatní 3 |
| 4 | `divider-skull.webp` | Femur s lebkou (oddělovač sekcí v panelech) |
| 5 | `skull-arch.webp` | Archa lebek nad welcome card (signature element) |
| 6–12 | `icon-*.webp` | 7 ossuary nav medailonů (lancet arch s ghost-light niche) |

### CSS-only prvky

- **Bone drop-cap "V"** v prvním odstavci welcome card — UnifrakturCook + multi-stack ghost-glow shadow
- **Ghost-pulse** záře z horní třetiny obrazovky (8s loop, opacity 0.6→1.0→0.6)
- **Drifting dust motes** (3 staggered particles, 30s linear)
- **Hover edge-light** teal-glow na NavItem / buttons
- **Active recess-into-stone** (inset shadow + radium-bright text)

### Žádné CSS-only votive candles, žádný atmospheric clutter strip

(Per Q&A — out of scope této specifikace; zůstává čistý kamenný feel.)

---

## Layout & komponenty

| Element | Treatment |
|---|---|
| **Topbar** | Solid blackened iron, no transparency, no backdrop-filter, iron-cold hairline pod |
| **Logo** | `logo.webp` 460×52px desktop / 260×52px mobile |
| **Header buttons** | Stone tablet styling, bone-ivory text, hover = teal edge-light |
| **Sidebar L+R** | Glassmorphism stone panel, **žádné corner ornamenty** (Q&A 8B) |
| **Welcome card** | Glassmorphism + 4 corner-tl ornamenty + skull-arch crown + bone drop-cap "V" + medailon vlevo |
| **Novinky panel** | Glassmorphism + 4 menší corner-tl ornamenty (80px desktop) |
| **Section dividery** | `divider-skull` mezi sekcemi v panelech |
| **NavItem** | Stone-tablet, hover = teal edge-light, active = recess-into-stone (statický) |
| **Nav ikony** | 7 unikátních ossuary medailonů (lancet arch s teal-niche) |
| **CTAs ("+", "PŘIDAT NOVINKU")** | CSS-only stone button, žádný custom asset |

---

## Animace & motion

| Element | Animace | Reduced-motion |
|---|---|---|
| Ghost-pulse (shora) | 8s ease-in-out loop, opacity 0.6→1.0→0.6 | vypnuto, statická opacity 0.7 |
| Drifting dust motes | 30s/42s staggered linear | vypnuto |
| Hover (NavItem, buttons) | 280ms transition border + color + box-shadow | vypnuto |
| Active NavItem | static (žádné keyframes) | static |
| Klik (CTA) | 150ms scale 0.96 | **zachováno** (UX feedback) |

`reducedMotion: 'heavy'` — vše se zastaví, atmosféra zůstane.

**Žádné swing, sway, flutter, candle flicker, brass shine sweep** — to jsou pergamen/hospoda signatury. Nemrtví je **statický** (per Q&A 9A — "krypta dýchá pomalu, jako by spala").

---

## Rozdíly od ostatních skinů

| Aspekt | Pergamen | Hospoda | **Nemrtví** |
|---|---|---|---|
| dominantní materiál | pergamen + zlato | dub + mosaz | **blackened iron + bone** |
| světlo | warm candle gold | warm hearth amber | **cold teal-ghost green** |
| signature ornament | wax seal + corner ornaments | iron clasp + brass stamp | **skull-arch + bone divider** |
| nálada | scholarly clean | lived-in cozy | **dread + smrt + konec světa** |
| signature anim | banner flutter, candle flicker | hearth pulse, brass shine | **ghost-pulse + statika** |

---

## Implementační poznámky

- Assety: `assets-source/themes/nemrtvi/*.png` → `public/themes/nemrtvi/decor/*.webp` přes `npm run themes:optimize` + `node scripts/finalize-nemrtvi-assets.mjs`
- CSS scoping: vše přes `[data-theme="nemrtvi"]`, žádný globální dopad
- Theme tokens v [`src/themes/themes/nemrtvi/index.ts`](../../src/themes/themes/nemrtvi/index.ts)
- Decorations v [`src/themes/themes/nemrtvi/decorations.css`](../../src/themes/themes/nemrtvi/decorations.css) (~700 řádků, 23 sekcí)
- Google Fonts: UnifrakturCook + New Rocker + IM Fell DW Pica přidány do [`index.html`](../../index.html)
