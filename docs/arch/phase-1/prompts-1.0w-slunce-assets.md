# Asset prompty 1.0w — Slunce

**Cíl:** 2 raster ornament assety pro skin „Slunce" — sluneční koróna roh (4× per panel přes mirror) + plamenný disc (centerpiece welcome card).

**Existující assety (user už dodal):**
- ✅ `assets-source/themes/slunce/logo.png` — blazing gold frame s anděl + "Projekt Ikaros" calligraphy
- ✅ `assets-source/themes/slunce/medailon.png` — gold sun-crown frame, anděl v plamenech, sun-ray glyfa

**Společný kontext (zkopíruj na začátek každého promptu):**

> Tvořím dekorativní asset pro web UI skin „Slunce" — antický sluneční kult v pouštních ruinách, hořící deity, dramatic apocalyptic heat.
>
> **Paleta** (odvozeno z dodaného loga + medailonu):
> - obsidian black `#0c0a08`
> - blazing gold `#ffb800` (hlavní)
> - ember red-orange `#ff4d1c`
> - sun-white core `#fff6c2`
> - copper-bronze `#b8741a`
> - charcoal `#1a1410`
> - ruby-red accent (jako drahokamy v medailonu) `#c81818`
>
> **Atmosféra:** energická, ohnivá, silná, dramatic. Hostile heat. Egyptian sun cult, pouštní obelisk, ancient temple ruin. **NE** soft, NE pastel, NE cute. Lehkost přichází z polotransparentního glow, NE z barvy.
>
> **Style direction:** realistic 3D render gold + flame, dramatic light source from upper-right (slunce), engraved metallic detail. AAA fantasy game asset.

---

## ☀️ Prompt 1 — Sun Corona Ray Corner (`sun-corner.webp`)

**Specs:** 256×256 px, transparent PNG. Master TL roh, ostatní 3 přes CSS scaleX/Y mirror (jako magie ametyst).

```
[Společný kontext výše]

Vygeneruj transparent PNG (256×256): sluneční koróna corner ornament —
radiating gold sun-rays z levého-horního rohu, jako ancient sun deity carved
into temple stone.

- Hlavní motiv: stylizovaná **sluneční koróna kvadrant** — 5-7 zlatých paprsků
  radiate z levého-horního rohu směrem dolů-vpravo do centra panelu
- Paprsky: tenké → široké → tenké (jako sluneční flares), vystupují z malého
  centrálního "ohniska" v rohu, blazing gold #ffb800 s ember-orange #ff4d1c
  glow ke špičkám
- Centrální ohnisko: malý sluneční disk (~25px) s sun-white #fff6c2 core
  a engraved Egyptian-style sun glyph (kruh + krátké paprsky), copper-bronze
  rim
- Ruby-red drahokamy (2-3 ks) drobně umístěné mezi paprsky jako akcenty
- Subtle heat-distortion halo kolem paprsků (gold-orange glow fade)
- Pozadí: ABSOLUTNĚ TRANSPARENTNÍ
- Drop shadow: ember-gold corona halo (warm tones, NE chladné)
- Composition: clustered v upper-left quadrantu, lower-right prázdný

Style:
- Engraved/embossed metallic gold, NE flat 2D vector
- Ember inner glow svítí přes paprsky
- Like temple bas-relief carving + magical fire
- Inspirace: Egyptian Ra sun disk + ancient solar cult amulet

DŮLEŽITÉ:
- Žádný text
- Žádný background
- Transparent edges
- Energetic feel — paprsky vyzařují, NE jen kreslené
- HOT colors only (gold/ember/red) — žádná modrá, fialová, zelená
- Master pro TL roh — ostatní 3 rohy budou přes CSS scaleX(-1)/scaleY(-1) mirror
```

**Po stažení:** `assets-source/themes/slunce/sun-corner.png`

---

## 🔥 Prompt 2 — Flame Disc Centerpiece (`flame-disc.webp`)

**Specs:** 512×512 px, transparent PNG. Centerpiece welcome card, rotace 90s CW + flame flicker animation.

```
[Společný kontext výše]

Vygeneruj transparent PNG (512×512): plamenný kruh / fire scrying disc —
okrouhlá kompozice s flame tendrils a ancient solar glyphs, pro welcome card
centerpiece. Egyptian-deity drama.

Vrstvy (od vnějšku dovnitř):
1. Vnější prsten: tenký gold kruh (#ffb800) s 12 plamennými tendrils
   vystupujícími ven (jako solar flares), velikost ~480px ⌀. Ember-red #ff4d1c
   ke špičkám flares.
2. Druhý prsten: 8 Egyptian-style sluneční glyfy okolo obvodu (sun disk,
   ankh, eye of Ra, scarab, etc — abstraktní stylizace, NE čitelné hieroglyfy),
   blazing gold engraved, propojené tenkými copper-bronze líniemi
3. Třetí prsten: 4 ruby-red drahokamy v cardinálech (N/E/S/W), embedded
   v gold setting
4. Vnitřní hexagram nebo solární osmicípá hvězda (linkové, NE výplň): tenké
   sun-white #fff6c2 linky s gold glow
5. Centrální medailon: malé blazing slunce s plameny radiating z něj
   (NE krystal jako magie, NE měsíc jako mesic — sun disc + flame tendrils)

Style:
- Tenké linkové line-art s strong glow (gold + ember)
- Barvy: blazing gold #ffb800 hlavní stroke, ember-red #ff4d1c flare tips,
  sun-white #fff6c2 highlights, ruby-red #c81818 gem accents
- Vnitřní glow: hot ember halo z centra, fading orange ke krajům
- Transparent edges
- Composition: ZCELA centrované v 512×512 canvas
- Style reference: Egyptian solar disk + fire elemental + temple seal ring
- DIFFERENT FROM magie spell-disc (which is purple/silver arcane) — tohle
  je HOT/GOLD/EMBER ancient sun-cult seal

Atmosféra: pocit, že to lze rotovat — radiálně-symetrická kompozice s
energetickým ohnivým feelingem. **Energetic ale ne chaotic** — ancient solar
deity calmly burning.

DŮLEŽITÉ:
- Žádný čitelný text (žádná latinka, ne čísla) — jen abstraktní solar glyphs
- Žádné lidské postavy ani anděli
- Žádný background — POUZE concentric kompozice + alpha
- Stroke weight: tenké linky (1-2px), čisté
- Transparency uvnitř kruhů (každý prstenec viditelný, ale neopaque fill)
- HOT palette only — gold/ember/red/sun-white. NO blue, purple, green, silver.
- Final detail: jako AAA fantasy game UI element
```

**Po stažení:** `assets-source/themes/slunce/flame-disc.png`

---

## ⚠️ Pokud první iterace nesedí

**Pro sun-corner:**
- „Make the rays more dramatic — longer and more radiating outward."
- „Brighter ember at the ray tips — currently too uniformly gold."
- „Central sun disk should have more engraved Egyptian glyph detail."
- „Move all elements closer to the corner — currently too spread out."

**Pro flame-disc:**
- „More flame tendrils on the outer ring — make them feel like fire not just lines."
- „Brighter sun-white core — currently too uniformly gold."
- „Egyptian glyphs should be more abstract and stylized — less literal."
- „Add more ember-orange glow throughout — currently feels too cold-gold."

---

## ✅ Checklist před předáním Claude k implementaci

- [ ] `assets-source/themes/slunce/sun-corner.png` (256×256, transparent, hot gold/ember/red)
- [ ] `assets-source/themes/slunce/flame-disc.png` (512×512, transparent, hot solar ring)
- [ ] Vše transparent (otevři v Preview, ověř že není bílé)
- [ ] Palette match (gold + ember + ruby, NE modrá, NE fialová, NE stříbro)
- [ ] Energy match — dramatic ancient deity, NE soft/pastel

**Po splnění checklistu** → dej mi vědět a spustím Fázi A konverzí WEBP + implementaci.
