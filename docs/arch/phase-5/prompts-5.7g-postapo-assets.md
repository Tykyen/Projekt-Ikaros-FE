# Post-apokalypsa skin — asset prompty (5.7g)

> Skin `apokalypsa` potřebuje **1 asset: pozadí**. Ornamenty (prorůstající listoví)
> řeší `decorations.css`. Design: [spec-5.7g-postapo.md](./spec-5.7g-postapo.md).

**Styl skinu:** zarůstající ruiny — *město pohlcené přírodou*. Tlumené, vybledlé,
melancholické.

**Generátor:** ChatGPT (GPT-4o image) nebo Midjourney v6.1.

---

## 🎨 STYLE GUIDE (závazné)

### Reference look
Široký pohled na město pohlcené přírodou — popraskaný beton, mrakodrapy bez oken,
mech a břečťan prorůstající ruinami, vzrostlé stromy v ulicích, tlumené denní
šero. Příroda v tichosti vítězí. Atmosféra **melancholická, tichá, vybledlá**.

**Inspirace:** The Last of Us × *I Am Legend* zarostlé město × opuštěná
Pripjať. Bez postav.

**NE:** vznešený smaragd / zlatá fantasy (`fantasy`), neon, jedovatě zelená záře
(radioaktivní — jiný směr), syté barvy, jasné barvy, gore.

### Master paleta (přesné hex)

| Role | Hex |
|---|---|
| Tmavý podklad | `#10130e` / `#1b211a` |
| Mechová zeleň (vegetace) | `#7e9c5c` · jiskra `#a8c47e` |
| Rezavá hněď (kov, beton) | `#a06840` |
| Vybledlá šedá (obloha, beton) | `#d4d4c6` |

**Zakázané barvy:** neonová zeleň, jedovatá zeleň, fialová, cyan, zlatá, syté tóny.

---

## 📦 ASSET 1/1 — `background.png` (pozadí skinu)

**Cílová cesta:** `assets-source/themes/apokalypsa/background.png` → `apokalypsa.webp`.
**Rozměr:** široké panorama, **1920×900** px.

### Prompt

```
A wide panoramic view of a city reclaimed by nature, post-apocalyptic. Cracked
concrete, windowless skyscrapers overgrown with moss and ivy, grown trees in the
streets, broken glass. Muted, faded daylight under an overcast sky. Mossy green
(#7e9c5c) vegetation creeping over rusty-brown (#a06840) concrete and steel. The
overall tone is dark desaturated grey-green (#10130e). The lower third is darker
and atmospheric so UI content stays readable. Melancholic, silent, faded mood —
no people, no gore. Painterly, cinematic depth, soft haze.
--ar 2.13:1 --v 6.1
```

### Negative
`neon, toxic green, glowing green, emerald, gold, purple, cyan, bright colors,
saturated, fantasy castle, people, characters, gore, text, watermark, sunny,
clear blue sky, logo`

### Schvalovací kritéria
- [ ] Zarostlé město, mech/břečťan na betonu; podklad tmavě šedozelený (`#10130e`)
- [ ] Tlumené, vybledlé — žádné syté ani neonové barvy
- [ ] Melancholická, tichá atmosféra; bez postav
- [ ] Spodní třetina tmavší (čitelnost obsahu)
- [ ] Široké panorama bez ořezových artefaktů

---

## 🔁 Workflow

1. Vygeneruj pozadí, stáhni PNG.
2. Ulož do `assets-source/themes/apokalypsa/background.png`.
3. Dej vědět — převedu na `webp` a zapojím (impl 5.7g).
