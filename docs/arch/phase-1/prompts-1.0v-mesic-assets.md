# Asset prompty 1.0v — Měsíc

**Cíl:** 5 raster ornament assetů pro skin „Měsíc" — 4 měsíční fáze (rohy panelů) + 1 lunární disc (centerpiece welcome card).

**Existující assety (user už dodal):**
- ✅ `assets-source/themes/mesic/logo.png` — stříbrný rám s anděl + "Projekt Ikaros" calligraphy
- ✅ `assets-source/themes/mesic/medailon.png` — silver feathered frame, anděl, hvězdy + crescent moon symboly uvnitř

**Společný kontext (zkopíruj na začátek každého promptu):**

> Tvořím dekorativní asset pro magický web UI skin „Měsíc" — klidná lunární zahrada, fairy-tale pohádkové království pod úplňkem.
>
> **Paleta** (odvozeno z dodaného loga + medailonu):
> - midnight cobalt-night `#0a1430`
> - moonlight silver `#d4d8ff`
> - pearl white `#f4f8ff`
> - cobalt blue accent `#3d6cfa`
> - soft cream `#f5efd6` (jen jako jemné akcenty)
>
> **Atmosféra:** klidná, jemná, snová, refined. Wedding-under-moonlight elegance. **NE** dramatic, NE energetic, NE harsh. Lehkost přes polotransparenci + soft glow + delicate detail.
>
> **Style direction:** realistic 3D render gemstone/silver, soft moonlight inner glow, fantasy fairy-tale, **NOT cartoon, NOT flat 2D, NOT cyberpunk neon**. Light source from upper-left.

---

## 🌒 Prompt 1 — Waxing Crescent (TL roh, `moon-phase-tl.webp`)

**Specs:** 256×256 px, transparent PNG (alpha channel), 4:1 alpha cleanup expected

```
[Společný kontext výše]

Vygeneruj transparent PNG (256×256): rostoucí měsíční srpek (waxing crescent)
zasazený do levého-horního rohu kompozice jako luxury gemstone ornament.

- Hlavní srpek: stříbrný light-pearl s subtle inner moonlight glow, fasety
  jako broušený moonstone gemstone, srpek "opening" směrem dolů-vpravo
  (centrum panelu). Velikost ~70% rámu, umístěný v levém horním kvadrantu.
- Drobné stříbrné hvězdy (3-5 ks) seskupené kolem srpku jako konstelace
- Jemný cobalt-blue (#3d6cfa) inner reflection na fasetách
- Tenké stříbrné filigree wire wrap u základny (jako jemná lunární klenotnická
  obruba — NE těžké zlato, jen tenké stříbro)
- Pozadí: ABSOLUTNĚ TRANSPARENTNÍ
- Drop shadow: jemné moonlight halo (silver glow rozpitý fade)
- Composition: clustered v upper-left quadrantu, lower-right quadrant prázdný

Inspirace: lunární moonstone gemstone + crescent jewel + fairy-tale wedding ring.
Style: realistic 3D fantasy gem render, AAA game asset quality.

DŮLEŽITÉ:
- Žádný text, žádné typografie, žádné runy
- Žádný background prvek — jen srpek + drobné hvězdy + jejich glow halo
- Transparent edges, no white halo bleeding
- Subtle, NE flashy nebo neon
```

**Po stažení:** `assets-source/themes/mesic/moon-phase-tl.png`

---

## 🌕 Prompt 2 — Full Moon (TR roh, `moon-phase-tr.webp`)

```
[Společný kontext výše]

Vygeneruj transparent PNG (256×256): úplněk (full moon) zasazený do
pravého-horního rohu kompozice jako luxury celestial ornament.

- Hlavní motiv: úplněk — stříbrno-pearl koule s viditelnými lunárními kratery
  (subtle, jako MoonStone gem), velikost ~65% rámu, umístěná v pravém horním
  kvadrantu
- Soft moonlight glow halo kolem (silver, fading)
- Drobné stříbrné hvězdy + 1-2 cobalt-blue konstelační body kolem
- Tenká stříbrná filigree obruba ve tvaru lunárního prstenu kolem úplňku
- Pozadí: ABSOLUTNĚ TRANSPARENTNÍ
- Drop shadow: silver-cobalt halo (rozpitý glow)
- Composition: úplněk v upper-right quadrantu, lower-left quadrant prázdný

Inspirace: úplněk přes broušený moonstone, fairy-tale lunar deity, refined
celestial jewelry.
Style: realistic 3D fantasy render, soft and serene (NE dramatic).

DŮLEŽITÉ:
- Žádný text, žádné runy
- Žádný background prvek
- Transparent edges
- Subtle nuance, NE harsh
```

**Po stažení:** `assets-source/themes/mesic/moon-phase-tr.png`

---

## 🌘 Prompt 3 — Waning Crescent (BL roh, `moon-phase-bl.webp`)

```
[Společný kontext výše]

Vygeneruj transparent PNG (256×256): ubývající měsíční srpek (waning crescent)
zasazený do levého-dolního rohu kompozice.

- Hlavní srpek: stříbrný light-pearl s soft moonlight inner glow, fasety
  moonstone gemstone, srpek "opening" směrem nahoru-vpravo (centrum panelu).
  Velikost ~70% rámu, umístěný v levém dolním kvadrantu (zrcadlený oproti
  TL waxing).
- Drobné stříbrné hvězdy (3-5 ks) seskupené kolem
- Cobalt-blue inner reflection
- Tenká stříbrná filigree wire wrap u základny (zrcadlený vůči TL)
- Pozadí: ABSOLUTNĚ TRANSPARENTNÍ
- Drop shadow: silver moonlight halo
- Composition: lower-left quadrant, upper-right prázdný

Note: tohle je VARIANTA TL ale zrcadlená a srpek otočený (opačná fáze cyklu).

DŮLEŽITÉ:
- Žádný text, žádné runy
- Žádný background
- Transparent edges
```

**Po stažení:** `assets-source/themes/mesic/moon-phase-bl.png`

---

## 🌑 Prompt 4 — New Moon Silhouette (BR roh, `moon-phase-br.webp`)

```
[Společný kontext výše]

Vygeneruj transparent PNG (256×256): nový měsíc (new moon — dark silhouette
s subtle outline) zasazený do pravého-dolního rohu.

- Hlavní motiv: nový měsíc — kruhová silueta v tmavém cobalt-night (#0a1430),
  s tenkým stříbrno-pearl outline (jako solar eclipse "ring of light"), velikost
  ~65% rámu, umístěná v pravém dolním kvadrantu
- Subtle silver-cobalt corona halo kolem (jemný light ring jako poslední záblesk
  zatmění)
- 4-6 drobných stříbrných hvězd kolem (víc než ostatní fáze — nová luna je
  noc bez měsíčního světla, hvězdy jsou jasnější)
- Tenká filigree wire wrap kolem siluety
- Pozadí: ABSOLUTNĚ TRANSPARENTNÍ
- Drop shadow: cobalt-silver halo (chladnější než úplněk)
- Composition: lower-right quadrant, upper-left prázdný

Style: zatmělý úplněk, mystický, NE strašidelný. Refined, celestial event.

DŮLEŽITÉ:
- Žádný text, žádné runy
- Žádný background
- Transparent edges
- Center kruhu má být DARKER než glow okolo (silueta) — to je hlavní rozdíl
  oproti TR úplňku
```

**Po stažení:** `assets-source/themes/mesic/moon-phase-br.png`

---

## 🌌 Prompt 5 — Lunar Disc Centerpiece (`moon-disc.webp`)

**Specs:** 512×512 px, transparent PNG, rotace 180s CCW (2× pomalejší než magie spell-disc + opačný směr).

```
[Společný kontext výše]

Vygeneruj transparent PNG (512×512): mystický lunární disc / celestial scrying
mirror — okrouhlá kompozice pro welcome card centerpiece. Refined fairy-tale
fantasy.

Vrstvy (od vnějšku dovnitř):
1. Vnější prsten: tenký stříbrný kruh s 12 lunárních fází okolo obvodu
   (mini crescents/úplňky střídavě), velikost ~480px ⌀
2. Druhý prsten: 8 zodiakálních souhvězdí jako tenké tečkované konstelace
   (Beran, Býk, … abstraktní — jen tečky a spojnice), spojené tenkými
   stříbrnými líniemi
3. Třetí prsten: 4 lunární crescents v cardinálech (N/E/S/W), jako moonstone
   gemstones
4. Vnitřní hexagram nebo pentagram (linkový, NE výplň): tenké pearl-white linky
5. Centrální medailon: drobný úplněk + cloud wisps okolo (NE krystal jako magie)

Style:
- Tenké linkové line-art s soft glow (silver + cobalt)
- Barvy: silver moonlight #d4d8ff hlavní stroke, cobalt-blue #3d6cfa akcenty,
  pearl-white #f4f8ff highlights
- Vnitřní glow: měkký silver halo z centra, fading ke krajům
- Transparent edges, NE white background
- Composition: ZCELA centrované v 512×512 canvas
- Style reference: alchymistický lunar disc, fairy-tale celestial seal, NE
  arcane spellbook circle (to je magie). Tohle je celestial astronomy chart.

Atmosféra: pocit, že to lze rotovat ZPOMALU — radiálně-symetrická kompozice,
calm, contemplative.

DŮLEŽITÉ:
- Žádný čitelný text (žádná latinka, ne čísla) — jen lunární a astronomické
  glyfy
- Žádné lidské postavy ani anděli
- Žádný background — POUZE concentric kompozice + alpha
- Stroke weight: tenké linky (1-2px), čisté
- Transparency uvnitř kruhů (každý prstenec viditelný, ale neopaque fill)
- Final detail: jako AAA fantasy game UI element
- Subtle pastel palette, NE saturated
```

**Po stažení:** `assets-source/themes/mesic/moon-disc.png`

---

## ⚠️ Pokud první iterace nesedí

**Pro moon-phase-* corner:**
- „Make the silver more refined, less metallic — softer like pearl glow."
- „Brighter cobalt-blue reflection on the moonstone facets."
- „Smaller stars, more delicate — currently feel too prominent."
- „Move all elements closer to the [corner] — leaving more empty space in opposite corner."

**Pro moon-disc:**
- „Make the rings more spaced — currently cluttered."
- „Less saturated colors — more pearl/silver, less blue."
- „Center moon should be softer, fading not solid."
- „Constellation lines should be more subtle, almost invisible."

---

## ✅ Checklist před předáním Claude k implementaci

- [ ] `assets-source/themes/mesic/moon-phase-tl.png` (waxing crescent, 256×256, transparent)
- [ ] `assets-source/themes/mesic/moon-phase-tr.png` (full moon, 256×256, transparent)
- [ ] `assets-source/themes/mesic/moon-phase-bl.png` (waning crescent, 256×256, transparent)
- [ ] `assets-source/themes/mesic/moon-phase-br.png` (new moon silhouette, 256×256, transparent)
- [ ] `assets-source/themes/mesic/moon-disc.png` (lunar disc, 512×512, transparent)
- [ ] Vše transparent (otevři v Preview, ověř že není bílé)
- [ ] Palette match (silver + cobalt + pearl, NE růžová, NE zlatá)

**Po splnění checklistu** → dej mi vědět a spustím Fázi A konverzí WEBP + implementaci.
