# Fantasy skin — asset prompty (5.7b)

> Skin `fantasy` potřebuje **1 asset: pozadí**. Ornamenty (zlatý filigrán) řeší
> `decorations.css` přes CSS/SVG — negenerují se. Design: [spec-5.7b-fantasy.md](./spec-5.7b-fantasy.md).

**Styl skinu:** vznešená high fantasy — *elfí síň za hvězdné noci*. Rivendell / Lothlórien:
zlatý filigrán, smaragdové světlo, slonovinové oblouky, klid a honosnost. **Ne** bitevní
dramatika, **ne** generická D&D fantasy.

**Generátor:** ChatGPT (GPT-4o image) nebo Midjourney v6.1. Výstup PNG → uloží se a převede na webp.

---

## 🎨 STYLE GUIDE (závazné)

### Reference look
Elfí architektura v údolí za hvězdné noci — štíhlé bílé a zlaté věže, vysoké úzké
gotizující oblouky, vodopády, mlžné údolí, hvězdná obloha se smaragdovým nádechem.
Atmosféra **klidná, vznešená, magická** — světlo zlatých oken, jemná mlha.

**Inspirace:** Rivendell (Jackson LOTR) × Alphonse Mucha (art-nouveau filigrán) ×
nočního pohledu na katedrálu × elfí ilustrace bez kýče.

**NE:** bitvy, draci, ohně. NE hnědý pergamen. NE Hogwarts. NE neon. NE fialová obloha
(to je skin `ikaros`). NE jasně denní světlo — je noc.

### Master paleta (přesné hex)

| Role | Hex |
|---|---|
| Noční podklad | `#0b1510` / `#13251c` |
| Zlato (filigrán, okna, světlo) | `#e3c66b` · jiskra `#f6e4a0` |
| Smaragd (světlo, vitráže, mlha) | `#6fd3a8` |
| Slonová kost (kámen, věže) | `#f0e8d4` |
| Hvězdy | jemně bílo-zlaté |

**Zakázané barvy:** fialová/purpurová (skin ikaros), neonové tóny, sytá červeň/oranž
(ohně — to je „epická hrdinská"), studená ocelová modř.

---

## 📦 ASSET 1/1 — `background.png` (pozadí skinu)

**Účel:** pozadí světa se skinem `fantasy` (vrství se pod glass panely + obsah).
**Cílová cesta:** `assets-source/themes/fantasy/background.png` → převod na
`public/themes/backgrounds/fantasy.webp` + `thumbnails/fantasy.webp`.
**Rozměr:** široké panorama, **1920×900** px (poměr ~2.13:1; pokryje hero i celou plochu).

### Prompt

```
A wide panoramic matte painting of an elven valley at starry night, high fantasy,
in the style of Rivendell and Lothlórien. Slender ivory-and-gold elven towers with
tall narrow arches rise among misty cliffs and soft waterfalls. Warm golden light
glows from arched windows. The night sky is deep emerald-tinged black (#0b1510)
scattered with delicate white-gold stars and a faint emerald aurora near the horizon.
Subtle art-nouveau golden filigree feel in the architecture. The lower third is
darker and atmospheric (foreground in shadow) so UI content stays readable; the
center has a gentle glow. Calm, noble, serene mood — no battle, no fire, no dragons.
Painterly, elegant, cinematic depth, soft volumetric mist. --ar 2.13:1 --v 6.1
```

### Negative
`purple, violet, neon, fire, flames, dragons, battle, characters, people, text,
watermark, brown parchment, Hogwarts, daylight, harsh sunlight, steel blue, cyberpunk,
city skyscrapers, modern buildings, logo`

### Schvalovací kritéria
- [ ] Noční scéna, podklad temně smaragdově-černý (`#0b1510`)
- [ ] Dominuje zlato + slonová kost + smaragd; žádná fialová
- [ ] Spodní třetina tmavší (čitelnost obsahu nad pozadím)
- [ ] Klidná vznešená nálada — žádná akce, žádné postavy
- [ ] Široké panorama, bez ořezových artefaktů po stranách

---

## 🔁 Workflow

1. Vygeneruj pozadí dle promptu (ChatGPT Image / MJ v6.1), stáhni PNG.
2. Ulož do `assets-source/themes/fantasy/background.png`.
3. Dej vědět — převedu na `webp` (background + thumbnail) a zapojím do skinu (impl 5.7b).
