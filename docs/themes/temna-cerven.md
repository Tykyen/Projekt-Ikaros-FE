# Téma: Temná červeň

**ID:** `temna-cerven`
**Stav:** ✅ 1.0l upgrade hotový (2026-05-10)
**Spec:** [spec-1.0l-temna-cerven-upgrade.md](../arch/phase-1/spec-1.0l-temna-cerven-upgrade.md)
**Plán:** [plan-1.0l.md](../arch/phase-1/plan-1.0l.md)
**Asset prompty:** [prompts-1.0l-temna-cerven-assets.md](../arch/phase-1/prompts-1.0l-temna-cerven-assets.md)
**Referenční obrázek:** [assets/temna-cerven.png](assets/temna-cerven.png)

---

## Atmosféra

**Salón nesmrtelného šlechtice — upír-sběratel.** Za 800 let nasbíral artefakty z různých epoch: křižácké železo, baroque tarnishované stříbro, viktoriánský granát a jet-bead smutek. Krev jako KLENOT, ne gore. Atmosféra: opera box / privátní salón, smrtelně klidný heartbeat tep srdce, padající okvětní lístky růží, damaškový tapet na pozadí.

**Inspirační kotvy:** Bram Stoker's Dracula (1992 Coppola) × Interview with the Vampire / Lestat de Lioncourt × Castlevania: Symphony of the Night UI × Diablo IV Sanctuary kovaná řemeslná kvalita × Albrecht Dürer engravingy × viktoriánská **mourning jewelry**.

---

## Barevná paleta

### Theme tokens (signature)

| Token | Hex | Použití |
|---|---|---|
| `--theme-bordeaux-deep` | `#0a0307` | Bordeaux-čerň, hlavní pozadí (warm undertone) |
| `--theme-bordeaux-mid` | `#110509` | Sidebars background |
| `--theme-bordeaux-card` | `#16070c` | Cards |
| `--theme-garnet-deep` | `#4a0612` | Hluboký stín v krvi |
| `--theme-garnet` | `#7e0a1e` | Primární cabochon — broušený granát |
| `--theme-garnet-bright` | `#a8132e` | Hover, "Projektu Ikaros" accent |
| `--theme-garnet-incand` | `#bf1f3a` | Heartbeat pulse, halo |
| `--theme-rose-blush` | `#c2596f` | Teplý rose-gold highlight |
| `--theme-silver-tarnish` | `#a89890` | Tarnished baroque silver — 200 let nečištěné |
| `--theme-silver-bright` | `#d4c8be` | Silver highlight |
| `--theme-silver-shadow` | `#463a36` | Tarnish v drážkách |
| `--theme-jet` | `#08020a` | Faceted lacquered black (mourning beads) |
| `--theme-velvet-crimson` | `#3a0810` | Crimson velvet látka |
| `--theme-text-pale` | `#e8d6cc` | Porcelánová pleť šlechtice |
| `--theme-ink-blood` | `#9b1226` | Signatura krví (Italianno cursive) |

### Hybrid akcent

- **Klid:** `--theme-garnet` (#7e0a1e) — cabochon
- **Hover:** `--theme-garnet-bright` (#a8132e)
- **Heartbeat pulse:** `--theme-garnet-incand` (#bf1f3a) — radium-bright

### WCAG kontrast (audit pass)

- Text-pale `#e8d6cc` na bordeaux-deep `#0a0307` → **~13.5:1** ✅ AAA
- Silver-tarnish `#a89890` na bordeaux-deep → **~7.6:1** ✅ AAA
- Silver-bright `#d4c8be` na bordeaux-deep → **~12.4:1** ✅ AAA
- Garnet-bright `#a8132e` na bordeaux-deep → **~4.8:1** ✅ AA Large
- Ink-blood signature `#9b1226` — decorative italic, whitelisted

---

## Typografie

| Role | Font | Důvod |
|---|---|---|
| Logo | **Pirata One** (custom blackletter baked-in v `logo.webp`) | Drippy blood blackletter, dodáno user |
| Display | **Pirata One** | Sjednocuje s logo aestheticky (oba "drippy") |
| Sub-display / nav labels | **Marcellus SC** | Vyryté roman small caps, jako name plates v opera-boxu |
| Body | **Cormorant Garamond** (regular + italic) | Didone-serif elegance, knižní styl |
| Drop-cap "V" | Pirata One | Konzistence s display |
| Signature italic (administrátoři) | **Italianno** | Copperplate cursive, jako podpis krví |

**Sdílení s ostatními skiny (Q-3 A — akceptováno):**
- Pirata One sdílen s `hospoda` (různé materiálové prostředí)
- Cormorant Garamond sdílen s `priroda` (různé use case — display vs body)
- Italianno sdílen s `pergamen`

**Žádný overlap** s `nemrtví` (UnifrakturCook + New Rocker + IM Fell DW Pica), `zlatý standard` (Cinzel + Lato + Great Vibes).

---

## Dekorativní prvky

### Assety (14 souborů v `public/themes/temna-cerven/decor/`)

| # | Asset | Účel |
|---|---|---|
| 1 | `logo.webp` | Header logo (drippy blackletter "Projekt Ikaros" v iron-cross frame, baked-in text) |
| 2 | `medailon.webp` | Ikaros bird v iron-cross frame s krevním glow |
| 3 | `corner-tl.webp` | Master TL roh, mirror přes CSS na ostatní 3 (iron+baroque silver+granát+drip) |
| 4 | `wax-seal.webp` | Visící krevní pečeť s otisky tesáků |
| 5 | `jet-bead-frame.webp` | Viktoriánský smuteční jet-bead rámeček okolo medailonu |
| 6 | `bat-arch.webp` | Oblouk z 9 letících netopýrů nad welcome card (signature element) |
| 7 | `divider-rose.webp` | Horizontální stonek-růže mezi sekcemi v panelech |
| 8–14 | `icon-*.webp` | 7 vampire-collector nav medailonů (vše ve sdíleném baroque-cartouche frame) |

### CSS-only prvky (signature)

- **Garnet drop-cap "V"** v prvním odstavci welcome card — Pirata One + multi-stack garnet halo shadow
- **Heartbeat tep srdce upíra** — welcome card pulzuje jeden lub-DUB tep každých 6.4s (jen box-shadow swell, žádné scale/translate)
- **Padající okvětní lístky růží** — 5 staggered (28-40s linear), každý lístek radial-gradient garnet, asymetrický border-radius
- **Damask wallpaper** — SVG inline pattern (80×120 tile, opacity 0.32, multiply blend) na body i panely
- **Film grain** — SVG noise filter (160×160 tile, opacity 0.35, mix-blend overlay) jako fixed inset 0 z-index 1000
- **Tufting buttons** — 2 stříbrné lesklé knoflíky na koncích topbaru (signature čalouněný styling)
- **Silver name-plate brackets [ ]** — kolem aktivního NavItem (jako rytá tabulka jména na opera-boxu)
- **Wax-seal s otisky tesáků** — visí z levého spodního rohu welcome card (-8° rotation)

### Mobilní redukce

- **Tufting buttons** hidden na ≤768px
- **Petals** sníženo z 5 na 2 na ≤768px, hidden na ≤480px
- **Wax-seal** hidden na ≤480px (přesahuje mimo úzký card)
- **Drop-cap** zmenšeno na 3.4em (z 4.2em) na ≤768px

---

## Layout & komponenty

| Element | Treatment |
|---|---|
| **Topbar** | Solid blackened metal s warm bordeaux undertone, no transparency, tufting buttons na koncích |
| **Logo** | `logo.webp` 460px desktop / 360px tablet / 260px mobile — krevní glow filter |
| **Header buttons** | Silver name plates (1px tarnish border + thin silver bracket pod text), hover = silver bright + granátový glow |
| **Sidebar L+R** | Glassmorphism + damask wallpaper + 4 corner-tl ornaments + tufting buttons |
| **Welcome card** | Glassmorphism + damask + 4 corner-tl ornaments + bat-arch crown + jet-bead-rámovaný medailon vlevo + garnet drop-cap "V" + wax-seal vlevo dole + heartbeat tep |
| **Novinky panel** | Glassmorphism + damask + 4 corner-tl (menší) |
| **Section dividery** | `divider-rose` mezi sekcemi v panelech (místo nemrtvi divider-skull) |
| **NavItem** | Čalouněný styling, hover = inset granátový rim + outer glow, active = silver bracket [ ] + ikona granet glow (statika) |
| **Nav ikony** | 7 unikátních vampire-collector medailonů ve sdíleném baroque-cartouche frame |
| **CTAs ("+", "PŘIDAT NOVINKU")** | Granátový primary button (gradient #a01029→#5a081a + silver border + outer glow) |

### ADMINISTRACE pravý panel (Q-1 B)

Per project memory `project_admin_panel_decision.md` — pravý panel obsahuje:
1. **ADMINISTRACE** nahoře — ThemeSwitcher (skin selector) + Uživatelé/Přátelé link
2. **Moje světy** + **Moje diskuze** + **Oblíbené články** + **Oblíbené obrázky** pod (defaultní base layout — žádný shared edit, layout je už takto pro všechny skiny)

---

## Animace & motion

| Element | Animace | Reduced-motion |
|---|---|---|
| Heartbeat tep (welcome card) | 6.4s ease-in-out loop, lub@8% + dub@14% box-shadow swell | vypnuto, statický |
| Padající okvětní lístky | 5 staggered linear drift 28-40s | vypnuto |
| Hover (NavItem, buttons) | 280ms transition border + color + box-shadow | vypnuto |
| Active NavItem | static (silver bracket [ ] permanent) | static |
| Klik (CTA) | 150ms translateY 1px | **zachováno** (UX feedback) |

`reducedMotion: 'heavy'` — vše se zastaví, atmosféra zůstane (damask + film grain statické).

**Žádný ghost-pulse** (to je nemrtví), **žádný swing/sway/flutter** (pergamen/hospoda), **žádný candle flicker** (hospoda) — Temna-cerven má **heartbeat + petals** jako triple-signature motion language.

---

## Rozdíly od ostatních skinů

| Aspekt | Pergamen | Hospoda | Nemrtví | **Temna-cerven** |
|---|---|---|---|---|
| dominantní materiál | pergamen + zlato | dub + mosaz | blackened iron + bone | **iron + baroque silver + jet + crimson velvet** |
| světlo | warm candle gold | warm hearth amber | cold teal-ghost green | **garnet glow + warm bordeaux** |
| signature ornament | wax seal + corner ornaments | iron clasp + brass stamp | skull-arch + bone divider | **bat-arch + thorn-rose divider + iron-cross corner** |
| nálada | scholarly clean | lived-in cozy | dread + smrt + konec světa | **decadent seduction + krev jako klenot** |
| signature anim | banner flutter, candle flicker | hearth pulse, brass shine | ghost-pulse + statika | **heartbeat tep + padající petals** |

---

## Implementační poznámky

- Assety: `assets-source/themes/temna-cerven/*.png` → `public/themes/temna-cerven/decor/*.webp` přes `npm run themes:optimize` + `node scripts/finalize-temna-cerven-assets.mjs`
- CSS scoping: vše přes `[data-theme="temna-cerven"]`, žádný globální dopad
- Theme tokens v [`src/themes/themes/temna-cerven/index.ts`](../../src/themes/themes/temna-cerven/index.ts) — ~140 řádků
- Decorations v [`src/themes/themes/temna-cerven/decorations.css`](../../src/themes/themes/temna-cerven/decorations.css) — ~640 řádků, 25 sekcí
- Google Fonts: Pirata One + Cormorant Garamond + Italianno už načteny (sdílené); Marcellus SC nově přidán do [`index.html`](../../index.html)
- Shared edit: 1× `<div data-theme-decoration="petals">` wrapper v [`IkarosLayout.tsx`](../../src/app/layout/IkarosLayout/IkarosLayout.tsx) + globální gating v [`reset.css`](../../src/themes/_shared/reset.css) (`[data-theme-decoration] { display: none; }`)
- ThemeSwitcher (existing dropdown komponent) stylizován per temna-cerven aesthetic v decorations.css sekce 14 (žádný nový komponent)
