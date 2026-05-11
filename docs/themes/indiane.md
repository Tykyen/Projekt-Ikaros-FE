# Téma: Indiánské — „Strážci horizontu"

**ID:** `indiane`
**Spec:** [spec-1.0p-indiane-upgrade.md](../arch/phase-1/spec-1.0p-indiane-upgrade.md)
**Plan:** [plan-1.0p.md](../arch/phase-1/plan-1.0p.md)
**Asset prompty:** [_asset-prompts.md](../../public/themes/indiane/decor/_asset-prompts.md)
**Stav:** ✅ Implementováno (krok 1.0p, 2026-05-11)

> **Pozn:** staré frontier hybrid Wild West vize (saloon + kovbojové + karty) byly **odhozeny** 2026-05-11 — nahrazeny čistou prairie linkou „svět před západem".

---

## Atmosféra

Prairie soumrak. Vysoká planina, žhavé nebe nad horizontem. Tipi v dálce, totemy na kopci, dreamcatcher houpající se ve větru. Žádný saloon, žádné kovboje. Tato země ještě patří lidem, kteří po ní chodili tisíc let — svět *před* tím, než ho rozparcelovali. Tichá posvátná vážnost, ne romantický „western".

**Inspirace:** Howard Terpning (Plains-Indian paintings) × Frank Frazetta prairies × Lakota/Cheyenne/Dakota tradiční umění × *Dances with Wolves* (1990) × Anasazi/Fremont rock art.

**NE:** Hollywood western / Disney Pocahontas / „Hollywood Indian" stereotyp / maori tribal patterns / neon turquoise.

---

## Barevná paleta (klíčové role)

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#2a1208` | Hlavní pozadí — tmavá pálená zem |
| `--theme-wood-dark` | `#3a1e08` | Patinované dřevo panelů |
| `--theme-buffalo-blood` | `#c8501c` | Primární akcent (active nav, danger) |
| `--theme-flame` | `#ff8030` | Nejteplejší jiskra plamene |
| `--theme-prairie-gold` | `#d4a050` | Sekundární akcent (text na dřevě, ornamenty) |
| `--theme-sage-turquoise` | `#5fc8d0` | Decorative-only — titleAccent + signature italic + empty hints |
| `--theme-leather-cream` | `#f0e0c0` | Napnutá kůže šamanského bubnu (welcome BG) |
| `--theme-bone-white` | `#e8d8b8` | Pictogramy, kostí |

**Korálkový cyklus** (left-border na active nav): buffalo-blood / sage-turquoise / prairie-gold / cream-leather.

---

## Typografie (Carved & Spoken)

- **Logo:** `Cinzel Decorative` (ornamentální majuskule — match logo asset)
- **Display / nav UPPERCASE:** `Cinzel`
- **Body:** `Spectral` (organický serif)
- **Signature italic:** `Caveat` (sage-turquoise, 24–28px)

---

## Originální motivy (žádný jiný skin nemá)

1. **Šamanský oválný buben jako welcome card** (aspect 1.55:1) v `medailon-frame` dřevěném rámu se 4 nail-stud brackety. Drum-pictograph s 4 Medicine Wheel pictogramy (vlk N / orel E / had S / bizon W + sun spiral) přes ::before s opacity 0.40.
2. **Drum-beat pulse** welcome card (10s scale 1.000→1.008 — „tlukoucí srdce kmene").
3. **Korálkový left-border na active nav** (CSS radial-gradient cyklus 12 korálků R/T/G/C) místo plné linky.
4. **Spirit smoke ze active nav** (`::after` pseudo, 6s loop, „obětní kouř indikuje vybranou cestu").
5. **Bead-string visící z topbaru** (CSS inline SVG vertikální řetízek 12 korálků, 8s sway).
6. **Hearth glow zdola** (radial-gradient warm flame, 8s breathe, „země dýchá oheň").
7. **Constellation overlay** (5–7 prairie-gold dots opacity 0.55, statické, v top třetině BG).
8. **Petroglyph-divider** pod section titles (sandstone slab s pecked glyfy).
9. **Feather-stamp** na „+" tlačítkách (orlí pero s tyrkysovými korálky), hover rotuje +8°.

---

## Asset list (15 ks v [public/themes/indiane/decor/](../../public/themes/indiane/decor/))

- `logo.webp`, `medailon.webp` (user dodal)
- `corner-tl.webp` (256×256, master TL, mirror přes CSS)
- `medailon-frame.webp` (800×600, oval pro welcome buben)
- `drum-pictograph.webp` (720×540, napnutá kůže s Medicine Wheel)
- 7× `icon-*.webp` (96×96, carved-oak medailony): uvodnik (slunce), vytvorit-svet (tipi), diskuze (rada), clanky (svitek), galerie (petroglyph), napoveda (sova), hospoda (oheň)
- `feather-stamp.webp` (96×96), `decor-fire-stones.webp` (1200×300), `petroglyph-divider.webp` (800×80)

**Style guide pro retrogeneraci:** [public/themes/indiane/decor/_asset-prompts.md](../../public/themes/indiane/decor/_asset-prompts.md) — 13 ChatGPT/DALL-E promptů + paleta + materiálové popisy.

---

## Animace inventář (5 typů, všechny `reduced-motion` fallback)

| # | Animace | Trvání | Element |
|---|---------|--------|---------|
| 1 | `indiane-hearth-breathe` | 8s | `[data-shell="ikaros"]::after` |
| 2 | `indiane-drum-beat` | 10s | `[data-frame-panel="card"]` |
| 3 | `indiane-bead-sway` | 8s | `> header::before` |
| 4 | `indiane-spirit-smoke` | 6s | active nav `::after` |
| 5 | feather-stamp rotate/scale | transition | `+` tlačítka `:hover/:active` |

---

## Mobile degradace (≤768px)

- Welcome buben → obdélník `border-radius: 24px`, animation off
- Bead-string + constellation → skryté
- Hearth glow → 30vh (z 60vh)
- Decor fire-stones → 120px (≤480px skryto)
- Header buttons → icon-only
- Touch target ≥48px

---

## Pravý panel — ADMINISTRACE order

Odchylka od mockupů ([memory: project_admin_panel_decision.md](../../C:/Users/arafo/.claude/projects/c--Matrix-ProjektIkaros-Projekt-ikaros-FE/memory/project_admin_panel_decision.md)):
1. **ADMINISTRACE** (skin selector + uživatelé) — nahoře
2. **MOJE DISKUZE** + **MOJE SVĚTY** — uprostřed
3. **OBLÍBENÉ ČLÁNKY** + **OBLÍBENÉ OBRÁZKY** — dole
