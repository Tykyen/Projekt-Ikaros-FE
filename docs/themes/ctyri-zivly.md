# Téma: Čtyři živly

**ID:** `ctyri-zivly`
**Stav:** ✅ 1.0m upgrade hotový (2026-05-11)
**Spec:** [spec-1.0m-ctyri-zivly-upgrade.md](../arch/phase-1/spec-1.0m-ctyri-zivly-upgrade.md)
**Plán:** [plan-1.0m.md](../arch/phase-1/plan-1.0m.md)
**Asset prompty:** [prompts-1.0m-ctyri-zivly-assets.md](../arch/phase-1/prompts-1.0m-ctyri-zivly-assets.md)
**Referenční obrázek:** [ctyri-zivly.png](../../assets-source/themes/references/ctyri-zivly.png)

---

## Atmosféra

**Pactum Quattuor — Posvátný pakt čtyř živlů zpečetěný Ikarosem-fénixem skrze čtyři kardinální gemy.** Heraldická chivalric reliquary aesthetic — leštěné stříbro-ocel jako strukturální kostra, **teplý bronz/vermeil s gold-leaf engravingem jako dominantní ornament**, čtyři cabochon gemy (rubín=oheň, safír=voda, smaragd=země, topaz=vzduch) v midpointech každého rámu, **fénix-sigil** jako pátý sjednocující prvek. Nálada: **muzejní artefakt pražského hradu**, slavnostní moment elementární rovnováhy, vznešená vědomá síla.

**Inspirační kotvy:** Diablo IV Sanctuary kovaná řemeslná kvalita × Dragon Age: Inquisition heraldic UI × Witcher 3 alchymistické gem-set medailony × Elden Ring sacred geometric ornaments × Renaissance court relikviáře 15.-16. století × středověká heraldická tradice kardinálních drahokamů.

---

## Barevná paleta

### Theme tokens (signature)

| Token | Hex | Použití |
|---|---|---|
| `--theme-steel-deep` | `#13141a` | Hlavní pozadí (forged dark steel) |
| `--theme-steel-mid` | `#1a1d26` | Sidebars |
| `--theme-steel-niche` | `#1c2230` | Inner shield niche (match asset background) |
| `--theme-steel-card` | `#252830` | Cards |
| `--theme-silver-bright` | `#e8ecf0` | Silver highlight |
| `--theme-silver-base` | `#c8ccd2` | Silver base (rámy) |
| `--theme-silver-shadow` | `#5a5e66` | Silver shadow |
| `--theme-bronze-deep` | `#5a4220` | Bronze shadow |
| `--theme-bronze-warm` | `#b08840` | Bronze base (dominant ornamental) |
| `--theme-bronze-bright` | `#d4a850` | Bronze highlight |
| `--theme-gold-leaf` | `#e8c860` | Gold-leaf engraving (signature accent) |
| `--theme-phoenix-radiance` | `#ffe8a8` | Phoenix warm halo (sjednotitel) |
| `--theme-phoenix-glow` | `#ffd680` | Phoenix incandescent |
| `--theme-ruby` | `#c8202a` | OHEŇ cabochon |
| `--theme-ruby-glow` | `#f04050` | OHEŇ incandescent (Cardinal Pulse) |
| `--theme-sapphire` | `#2050b0` | VODA cabochon |
| `--theme-sapphire-glow` | `#4080e0` | VODA highlight |
| `--theme-emerald` | `#2a8050` | ZEMĚ cabochon |
| `--theme-emerald-glow` | `#50b070` | ZEMĚ highlight |
| `--theme-topaz` | `#e8d480` | VZDUCH cabochon |
| `--theme-topaz-glow` | `#fff0c0` | VZDUCH prism |
| `--theme-text-pale` | `#e8dac0` | Hlavní text (parchment warm) |

### WCAG kontrast (audit pass)

- Text-pale `#e8dac0` na steel-deep `#13141a` → **~12.6:1** ✅ AAA
- Silver-base `#c8ccd2` na steel-deep → **~10.4:1** ✅ AAA
- Gold-leaf `#e8c860` na steel-deep → **~9.8:1** ✅ AAA
- Bronze-bright `#d4a850` na steel-deep → **~7.5:1** ✅ AAA
- Bronze-warm `#b08840` na steel-deep → **~5.1:1** ✅ AA
- Phoenix-radiance `#ffe8a8` na steel-deep → **~14.2:1** ✅ AAA
- Ruby `#c8202a` na steel-deep → **~4.3:1** ✅ AA Large (decorative use)

---

## Typografie

| Role | Font | Důvod |
|---|---|---|
| Logo | User-provided (baked-in v `logo.webp`) | Gothic blackletter s ohňo-vodním gradientem na písmenech |
| Display | **MedievalSharp** | Rytířský gothic-fantasy, ostře řezaný — distinct od UnifrakturCook (nemrtví), Pirata One (hospoda/temna-cerven), New Rocker (nemrtví) |
| Body | **Cardo** | Renaissance roman — distinct od EB Garamond (pergamen), Cormorant (priroda/temna-cerven), Spectral (hospoda) |
| Signature italic | **Pinyon Script** | Copperplate — sdíleno, distinct od Italianno (temna-cerven/pergamen), Tangerine (priroda), Great Vibes (zlatý) |
| Drop-cap "V" | MedievalSharp | Konzistence s display + heraldická gravitas |

**Žádný overlap** s nemrtvi (UnifrakturCook + New Rocker + IM Fell DW Pica), temna-cerven (Pirata One + Cormorant + Italianno + Marcellus SC), pergamen (Petit Formal Script + EB Garamond + IM Fell English), hospoda (Pirata One + Almendra + Spectral + Henny Penny).

---

## Dekorativní prvky

### Assety (16 souborů v `public/themes/ctyri-zivly/decor/`)

| # | Asset | Účel |
|---|---|---|
| 1 | `logo.webp` | Header logo (gothic blackletter "Projekt Ikaros" v medailonu s 4 kardinálními gemy) — user-provided |
| 2 | `medailon.webp` | Ikaros-fénix v heraldickém square framu s quartered fire/water/earth/air pozadím — user-provided |
| 3 | `corner-tl.webp` | Master TL roh, silver fleur-de-lis spike s bronzovým lemem a 2 mikro gemy (mirror přes CSS na ostatní 3 rohy) |
| 4 | `cardinal-ruby.webp` | Rubín cabochon v silver-bronze settingu s plamínkovými motifs — left midpoint = OHEŇ |
| 5 | `cardinal-sapphire.webp` | Safír cabochon s vodními swirls — right midpoint = VODA |
| 6 | `cardinal-emerald.webp` | Smaragd cabochon s laurel motifs — bottom midpoint = ZEMĚ |
| 7 | `cardinal-topaz.webp` | Topaz cabochon s air swirls — top midpoint = VZDUCH |
| 8 | `compass.webp` | Compass of Four mandala — silver vnější prsten + bronzový vnitřní s alchymistickými glyfy + central phoenix-sigil |
| 9 | `divider-chain.webp` | Stříbrný řetěz s gem-clusterem (4 mikro gemy) — major section divider |
| 10–16 | `icon-*.webp` × 7 | 7 nav medailonů ve sdíleném heraldic-shield frame (úvodník, vytvořit svět, diskuze, články, galerie, nápověda, hospoda) |

### CSS-only prvky (signature)

- **Gold-leaf drop-cap "V"** v prvním odstavci welcome card — MedievalSharp + phoenix-radiance halo (multi-stack text-shadow)
- **Quartered Aurora drift** — 4 mlhové vrstvy v rozích body (ruby-TL, topaz-TR, sapphire-BR, emerald-BL), 45s ease-in-out drift, opacity 0.06
- **Phoenix Ember orbit** — 12×12 radial-gradient ember obíhající square path po vnitřním obvodu welcome cardu, 11s linear infinite, phoenix-radiance glow
- **Cardinal Pulse** — 4 cardinal gemy pulzují postupně (rubín → safír → smaragd → topaz), 6s loop, každý 8% glow + 4% peak brightness boost
- **Compass rotation** — 90s linear infinite slow rotation v pravém panelu
- **Minor dividery** — CSS-only 1px bronze gradient + centrální rubínová cabochon dot (bez assetu)
- **Bronze inlay korunovační linie** — 1px gradient pod topbarem
- **Heraldic shield button styling** — header buttons s bronzovým borderem + thin gold inlay underline pod textem
- **Ruby cabochon dot** — 6px ::before na aktivním NavItem (signature element)
- **Film grain** — SVG noise filter (160×160 tile, opacity 0.18, mix-blend overlay) jako fixed inset z-index 1000

### Mobilní redukce

- **Compass mandala** hidden na ≤480px (přesahuje úzký panel)
- **Phoenix Ember orbit** hidden na ≤480px (rušilo by v úzkém prostoru)
- **Major dividers** (chain): hidden na ≤480px, použijeme jen CSS minor divider
- **Drop-cap "V"** zmenšeno z 4.2em → 2.8em na ≤480px
- **Cardinal gem markers** 60px → 48px na ≤768px, 36px na ≤480px
- **Andel medailon** 220 → 160 → 128px (desktop/tablet/mobile)

---

## Layout & komponenty

| Element | Treatment |
|---|---|
| **Topbar** | Solid steel-mid + bronze inlay korunovační linie spodní hrany + heraldic shield buttons |
| **Logo** | `logo.webp` 480px desktop / 280px mobile — phoenix-radiance drop-shadow filter |
| **Header buttons** | Heraldic shield: bronze border + steel-card bg + gold-leaf text + thin gold inlay underline; hover = phoenix-radiance + bronze-bright border |
| **Sidebar L+R** | Steel-mid bg + alchymistický glyph subtle pattern (opacity 0.05) + 4 corner-tl ornaments |
| **Welcome card** | Steel-card + radial phoenix-radiance subtle aura + double-border (silver outer + 2px bronze inset) + 4 corner ornaments + **4 cardinal gem markers** v midpointech + medailon vlevo (220×220) + gold-leaf drop-cap "V" + Phoenix Ember orbit + Pinyon Script italic závěr |
| **Novinky panel** | Stejný materiál jako welcome (4 corner ornaments menší) |
| **Section dividery** | Major: `divider-chain` (silver+gem-cluster); minor: CSS-only bronze gradient + ruby cabochon dot |
| **NavItem** | Heraldic štít, hover = bronze warm glow + translateY(-1px), active = bronze-bright inset border-left 3px + bronze inset bg + gold-leaf text + ruby cabochon dot ::before |
| **Nav ikony** | 7 unikátních heraldic-shield medailonů ve sdíleném framu; hover = phoenix-radiance drop-shadow |
| **CTAs** ("+", "PŘIDAT NOVINKU") | Bronze gradient (bright→warm→deep) + silver-bright outer border + gold-leaf inner border + gold-leaf MedievalSharp uppercase text; hover = phoenix-radiance outer glow + translateY(-2px) |
| **PJ badge** | Pinyon Script gold-leaf cursive |

### ADMINISTRACE pravý panel (Q-1 A)

Per project memory `project_admin_panel_decision.md` + Q-1 A — pravý panel obsahuje:
1. **ADMINISTRACE** nahoře — ThemeSwitcher (skin selector, restyled jako bronze heraldic dropdown) + Uživatelé/Přátelé link
2. **Default sekce pod** — MOJE DISKUZE + MOJE SVĚTY + OBLÍBENÉ ČLÁNKY + OBLÍBENÉ OBRÁZKY (žádný shared edit)
3. **Compass of Four mandala** dole (220×220 desktop, 180×180 tablet, hidden mobile) — 90s slow rotation

---

## Animace & motion

| Element | Animace | Reduced-motion |
|---|---|---|
| Quartered Aurora drift (body) | 45s ease-in-out alternate, ±10px translate + opacity 0.85→1.0 | vypnuto, statický |
| Phoenix Ember orbit (welcome card) | 11s linear infinite, square path po vnitřním obvodu | vypnuto, ember `display: none` |
| Cardinal Pulse (4 gemy) | 6s ease-in-out infinite, sekvenční (rubín 0–25%, safír 25–50%, smaragd 50–75%, topaz 75–100%) | vypnuto, statický |
| Compass rotation (right panel) | 90s linear infinite | vypnuto, statický |
| Hover (NavItem, buttons) | 280ms transition border + color + box-shadow | zachováno (UX feedback) |
| Active NavItem | static (bronze-bright border-left + ruby cabochon dot permanent) | static |
| Klik (CTA) | 150ms translateY 2px → 0px | **zachováno** (UX feedback) |

`reducedMotion: 'heavy'` — všechny atmosférické animace vypnuté, hover/focus transitions zachovány pro UX.

**Triple signature motion:** **Quartered Aurora drift + Phoenix Ember orbit + Cardinal Pulse** — žádný overlap s heartbeat (temna-cerven), petals (temna-cerven), ghost-pulse (nemrtví), banner flutter (pergamen), candle flicker (hospoda).

---

## Rozdíly od ostatních skinů

| Aspekt | Pergamen | Hospoda | Nemrtví | Temna-cerven | **Čtyři živly** |
|---|---|---|---|---|---|
| dominantní materiál | pergamen + zlato | dub + mosaz | iron + bone | iron + baroque silver + jet + crimson velvet | **leštěné stříbro-ocel + warm bronze/vermeil + 4 cardinal cabochon gems** |
| světlo | warm candle gold | warm hearth amber | cold teal-ghost green | garnet glow + bordeaux | **phoenix-radiance gold-white + 4-color gem refraction** |
| signature ornament | wax seal + corner | iron clasp + brass stamp | skull-arch + bone divider | bat-arch + thorn-rose + iron-cross corner | **fleur-de-lis spike corner + 4 cardinal gem markers + Compass of Four mandala** |
| nálada | scholarly clean | lived-in cozy | dread + smrt | decadent seduction + krev jako klenot | **sacred reliquary + heroic radiance + slavnostní pakt** |
| signature anim | banner flutter, candle flicker | hearth pulse, brass shine | ghost-pulse + statika | heartbeat tep + padající petals | **Quartered Aurora drift + Phoenix Ember orbit + Cardinal Pulse** |

---

## Implementační poznámky

- Assety: `assets-source/themes/ctyri-zivly/*.png` → `public/themes/ctyri-zivly/decor/*.webp` přes `npm run themes:optimize` + `node scripts/finalize-ctyri-zivly-assets.mjs`
- CSS scoping: vše přes `[data-theme="ctyri-zivly"]`, žádný globální dopad (per memory `feedback_theme_isolation`)
- Theme tokens v [`src/themes/themes/ctyri-zivly/index.ts`](../../src/themes/themes/ctyri-zivly/index.ts) — ~190 řádků
- Decorations v [`src/themes/themes/ctyri-zivly/decorations.css`](../../src/themes/themes/ctyri-zivly/decorations.css) — ~1020 řádků, 21 sekcí
- Google Fonts: MedievalSharp + Cardo + Pinyon Script nově přidány do [`index.html`](../../index.html) (Pinyon Script sdíleno)
- Shared edit: 1 řádek v [`IkarosCard.tsx`](../../src/shared/ui/IkarosCard/IkarosCard.tsx) — `<div data-theme-decoration="ember-orbit">` wrapper se renderuje pouze pro `variant="welcome"`, gated globálně přes existující `[data-theme-decoration] { display: none; }` v [`reset.css`](../../src/themes/_shared/reset.css)
- ThemeSwitcher (existing dropdown komponent) stylizován per ctyri-zivly aesthetic v `decorations.css` sekce 16 (žádný nový komponent)
- Cardinal gem markers — 4 různé assety pro 4 živly, každý na vlastním ::before/::after místě (welcome card ::before = topaz/TOP, welcome card ::after = sapphire/RIGHT, andel-medallion ::after = ruby/LEFT, ember-orbit wrapper ::before = emerald/BOTTOM, ember-orbit wrapper ::after = orbiting ember)
