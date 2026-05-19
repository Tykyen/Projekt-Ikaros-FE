# Historický skin — asset prompty (5.7j)

> Skin `historie` potřebuje **1 asset: pozadí**. Ornamenty (zlatý damašek) řeší
> `decorations.css`. Design: [spec-5.7j-historicky.md](./spec-5.7j-historicky.md).

**Styl skinu:** renesance / barokní dvůr — *opulentní sál ve světle svící*.

**Generátor:** ChatGPT (GPT-4o image) nebo Midjourney v6.1.

---

## 🎨 STYLE GUIDE (závazné)

### Reference look
Široký pohled do barokního dvorního sálu — těžké sametové závěsy, olejomalby ve
zlatých rámech na stěnách, svícny s plameny, mahagonový nábytek, štukové stropy.
Tlumená vinná červeň, staré matné zlato, teplé šero osvětlené svícemi. Atmosféra
**opulentní, vznešená, historicky věrná**.

**Inspirace:** barokní zámecký sál × renesanční olejomalba × portrétní galerie.
Bez postav (portréty na zdech jsou ok).

**NE:** elfí fantasy se smaragdem (`fantasy`), gotická krev (`dark-fantasy`),
mosazný steampunk, neon, syté/jasné barvy, moderní prvky.

### Master paleta (přesné hex)

| Role | Hex |
|---|---|
| Tmavě hnědý podklad | `#160d0c` / `#241612` |
| Staré matné zlato (rámy, štuk) | `#bd9a4e` · jiskra `#ddc079` |
| Vinná červeň (samet, závěsy) | `#8a3b3a` |
| Slonovinová (světlo svící, štuk) | `#e6dcc6` |

**Zakázané barvy:** smaragdová zeleň, neon, fialová, cyan, kyselá žlutá, jasné tóny.

---

## 📦 ASSET 1/1 — `background.png` (pozadí skinu)

**Cílová cesta:** `assets-source/themes/historie/background.png` → `historie.webp`.
**Rozměr:** široké panorama, **1920×900** px.

### Prompt

```
A wide panoramic interior of a baroque court hall — heavy velvet curtains, oil
paintings in golden frames on the walls, lit candelabra, mahogany furniture,
stucco ceilings. Muted wine-red (#8a3b3a) velvet, old matte gold (#bd9a4e)
frames and stucco, warm candle-lit gloom. The base tone is dark warm brown
(#160d0c). The lower third is darker and atmospheric so UI content stays
readable; warm golden glow near the center. Opulent, noble, historically
authentic mood — no people (wall portraits are fine). Painterly, cinematic
depth, Renaissance oil-painting feel. --ar 2.13:1 --v 6.1
```

### Negative
`emerald, neon, purple, cyan, acid yellow, fantasy elves, gothic, brass steampunk,
bright colors, modern, people in foreground, text, watermark, logo`

### Schvalovací kritéria
- [ ] Barokní sál, olejomalby, svícny; podklad tmavě hnědý (`#160d0c`)
- [ ] Vinná červeň + staré matné zlato; žádný smaragd, neon ani syté barvy
- [ ] Opulentní, vznešená, historicky věrná atmosféra
- [ ] Spodní třetina tmavší (čitelnost obsahu)
- [ ] Široké panorama bez ořezových artefaktů

---

## 🔁 Workflow

1. Vygeneruj pozadí, stáhni PNG.
2. Ulož do `assets-source/themes/historie/background.png`.
3. Dej vědět — převedu na `webp` a zapojím (impl 5.7j).
