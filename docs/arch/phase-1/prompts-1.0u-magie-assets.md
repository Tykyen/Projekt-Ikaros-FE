# Asset prompty 1.0u — Magie a kouzla

**Cíl:** 2 raster hero ornamenty pro skin „Magie a kouzla" — generovat v ChatGPT (DALL-E / image gen).

**Společný kontext (zkopíruj na začátek každého promptu):**

> Tvořím dekorativní asset pro magický web UI skin „Magie a kouzla". Paleta vychází z dodaného loga a medailonu: **fialová+ametyst** (`#9d4edd`, `#c77dff`, `#5a189a`), **antické zlato** (`#d4a017`, `#f5c853`), **noční fialová base** (`#0a0418`, `#160a2e`). Atmosféra: 3D fasetovaný ametyst, jemný vnitřní glow, mystická elegance, **lehkost a vznášení** (NE těžké gothic). Vyhni se kýčovým hvězdičkám, hrubým neonům, plochým kreslícím stylům.

---

## 🔮 Prompt 1 — Ametystový krystal v rohu panelu (`ametyst-corner.webp`)

**Specs:**
- Rozměr: **256×256 px**, **transparent background** (PNG with alpha)
- Použití: 4× per panel (master TL, ostatní 3 mirror přes CSS scale)
- Animace: subtle levitation 6s
- Cíl: 3D fasetovaný drahokam jako roh kouzelnické knihovny

**Prompt do ChatGPT:**

```
[Společný kontext výše]

Vygeneruj transparent PNG (256×256, 4:1 alpha cleanup): elegantní 3D fasetovaný
ametystový krystal v levém horním rohu kompozice (L-shape arrangement),
s několika sekundárními menšími krystaly seskupenými kolem hlavního:

- Hlavní krystal: ostře geometricky broušený (gem-cut, hexagonal facets jako
  bishop's tower nebo crystal point), výška ~70% rámu, fialově-ametystový
  s viditelnými fasetami a lomem světla, vnitřní soft glow (#c77dff)
- 2-3 menší krystaly: kratší/širší shards, seskupené u hlavního, ametyst+silver
- Drobné zlaté akcenty (jakoby kovová obruba / wire wrap na bázi krystalu) —
  antique gold #d4a017, jen drobně
- Pozadí: ABSOLUTNĚ TRANSPARENTNÍ (žádné rectangle, žádný shadow box)
- Drop shadow: jemný ametyst halo kolem krystalů (rozpitý glow, ne crisp shadow)
- Style: realistic 3D render, fantasy gemstone, NOT cartoon, NOT flat 2D
- Light source: from upper-left, illuminating facets
- Composition: clustered in upper-left quadrant of 256×256 canvas, leaving
  lower-right quadrant empty (this is the inside corner of a panel)

Inspirace: ametystová geoda fragment + crystal cathedral fantasy, finální
quality jako AAA game asset.

DŮLEŽITÉ:
- Žádný text, žádná typografie
- Žádné runy nebo glyfy uvnitř krystalu
- Žádné hvězdy nebo sparkle effects okolo (sparkles přidám v CSS samostatně)
- Žádné background prvky — jen krystaly + jejich glow halo
- Transparent edges (žádný white halo bleeding)
```

**Po stažení:**
- Uložit jako `assets-source/themes/magie/ametyst-corner.png`
- Pokud má neideální transparency: cleanup v Photoshop/Figma → re-export PNG
- Konverze: `cwebp -q 92 -alpha_q 100 ametyst-corner.png -o ametyst-corner.webp`

---

## 📜 Prompt 2 — Spell-Book Scrying Disc (`spell-disc.webp`)

**Specs:**
- Rozměr: **512×512 px**, **transparent background** (PNG with alpha)
- Použití: centerpiece za welcome textem, rotace 90s
- Cíl: kouzelnický pečetní disk z grimoáru — concentric kruhy, runové glyfy, arcane geometrie

**Prompt do ChatGPT:**

```
[Společný kontext výše]

Vygeneruj transparent PNG (512×512, alpha): mystický kouzelnický „scrying disc"
nebo „spell seal" — okrouhlá kompozice s concentric kruhy a arcane glyfy,
jako pečeť z knihy stínů.

Vrstvy (od vnějšku dovnitř):
1. Vnější prsten: tenký ametystový kruh s drobnými zlatými ornamenty (~480px ⌀)
2. Druhý prsten: 12 fialových/zlatých run/glyfů rovnoměrně rozmístěných po obvodu
   (fantasy runové znaky, ne čitelné — abstraktní geometrické symboly)
3. Třetí prsten: tenčí kruh s 4 ametystovými krystaly v cardinálech (N/E/S/W)
4. Vnitřní hexagram nebo pentagram (linkový, ne výplň): jemné stříbrné linky
   propojující body
5. Centrální medailon: drobný stylizovaný anděl-křídlo nebo abstraktní fialový
   krystal květ (subtle, NE dominantní — má prosvítat skrz welcome text)

Style:
- Tenké linkové line-art s glow (ne výplně)
- Barvy: ametystová fialová #9d4edd jako hlavní stroke, akcenty antique gold
  #d4a017, jemné silver-moon #d4d8ff highlights
- Vnitřní glow: měkký ametystový halo z centra, fading ke krajům
- Transparent edges, NE white background
- Composition: ZCELA centrované v 512×512 canvas
- Style reference: alchymistický disc, esoterická pečeť, fantasy spellbook circle

Atmosféra: pocit, že to lze rotovat — radiálně-symetrická kompozice, žádný
„top" nebo „bottom", rovnoměrně rozprostřeno.

DŮLEŽITÉ:
- Žádný čitelný text (žádná latinka, ne čísla) — jen abstraktní glyfy
- Žádné lidské postavy
- Žádný background — POUZE concentric kompozice + alpha
- Stroke weight: tenké linky (1-2px), čisté, NE rough/sketchy
- Transparency uvnitř kruhů (každý prstenec viditelný, ale neopaque fill)
- Final detail: jako AAA fantasy game UI element, vysoká kvalita
```

**Po stažení:**
- Uložit jako `assets-source/themes/magie/spell-disc.png`
- Cleanup transparency v Photoshop/Figma pokud potřeba
- Konverze: `cwebp -q 92 -alpha_q 100 spell-disc.png -o spell-disc.webp`

---

## ⚠️ Pokud první iterace nesedí

ChatGPT image gen je nedeterministický. Pokud výsledek nevyhovuje:

**Pro ametyst-corner.webp:**
- „Make the crystals more geometric and faceted, less rounded/organic."
- „Brighter inner glow on the main amethyst point."
- „More antique gold metallic accents at the crystal bases (not just purple)."
- „Move all crystals closer together — clustered, not scattered."

**Pro spell-disc.webp:**
- „Make the runes more abstract — less like real letters, more like sigils."
- „Brighter central glow that fades outward."
- „Add subtle silver highlights on the inner geometric shape."
- „More breathing room between rings — currently feels cluttered."

---

## ✅ Checklist před předáním Claude k implementaci

- [ ] `assets-source/themes/magie/ametyst-corner.png` — uložen, ~256×256, transparent
- [ ] `assets-source/themes/magie/spell-disc.png` — uložen, ~512×512, transparent
- [ ] Oba transparent (otevři v Photoshop/Preview, ověř že nejsou bílé background)
- [ ] Palette odpovídá briefu (ametyst+gold+silver, ne třeba modrá nebo zelená)
- [ ] Style match — ametyst-corner = 3D fasetovaný, spell-disc = line-art radiální

**Po splnění checklistu** → dej vědět a spustím Fázi A2 (konverze WEBP) → Fáze B-G (implementace).
