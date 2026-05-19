# Dark Fantasy skin — asset prompty (5.7c)

> Skin `dark-fantasy` potřebuje **1 asset: pozadí**. Ornamenty (krvavá vignette) řeší
> `decorations.css` (CSS/SVG). Design: [spec-5.7c-dark-fantasy.md](./spec-5.7c-dark-fantasy.md).

**Styl skinu:** gotická dark fantasy — *katedrála krkavců pod krvavým měsícem*.
Temná vznešenost, ne kýčovitá krvavá řež.

**Generátor:** ChatGPT (GPT-4o image) nebo Midjourney v6.1. Výstup PNG → převede se na webp.

---

## 🎨 STYLE GUIDE (závazné)

### Reference look
Široký pohled na gotickou katedrálu v noci — lomené oblouky, štíhlé věže, chrliče,
hejno krkavců na obloze, **krvavý měsíc** za mlhou. Studené stříbřité měsíční světlo
na kameni, krvavě rudá záře v oknech. Atmosféra **temně vznešená, ponurá, tichá**.

**Inspirace:** Bloodborne (gotická architektura) × Caspar David Friedrich (osamělá
ponurost) × havraní silueta proti měsíci. Žádné postavy.

**NE:** neon, fialová obloha (skin `ikaros`), zlato/smaragd (skin `fantasy`),
přehnaná krev/gore, jasné denní světlo, generická AI fantasy.

### Master paleta (přesné hex)

| Role | Hex |
|---|---|
| Noční podklad | `#0c0608` / `#1a0e12` |
| Krvavě rudá (měsíc, okna, záře) | `#b51e2e` · jiskra `#e0433f` |
| Studené stříbro (měsíční svit na kameni) | `#c8ccd6` |
| Popelavá / kostní bílá (mlha, kámen) | `#ddd6d2` |

**Zakázané barvy:** fialová/purpurová, zlatá/smaragdová, neon, teplé denní tóny.

---

## 📦 ASSET 1/1 — `background.png` (pozadí skinu)

**Účel:** pozadí světa se skinem `dark-fantasy`.
**Cílová cesta:** `assets-source/themes/dark-fantasy/background.png` → `dark-fantasy.webp`.
**Rozměr:** široké panorama, **1920×900** px.

### Prompt

```
A wide panoramic matte painting of a gothic cathedral at night under a blood-red
moon, dark fantasy. Tall pointed arches, slender spires, gargoyles silhouetted
against a misty sky. A scattered flock of ravens in flight. The blood-red moon
(#b51e2e glow) hangs behind thin fog. Cold silver moonlight (#c8ccd6) catches the
stone; faint blood-red light glows in the cathedral windows. The night sky and
foreground are near-black (#0c0608). The lower third is darker and atmospheric so
UI content stays readable; gentle glow near the center. Solemn, dark, noble,
silent mood — no people, no gore. Painterly, cinematic depth, volumetric fog.
--ar 2.13:1 --v 6.1
```

### Negative
`purple, violet, neon, gold, emerald, green, daylight, sunlight, people, characters,
blood splatter, gore, text, watermark, cyberpunk, modern buildings, bright colors, logo`

### Schvalovací kritéria
- [ ] Noční scéna, podklad téměř černý (`#0c0608`)
- [ ] Krvavě rudý měsíc + studené stříbrné světlo na kameni; žádná fialová ani zlatá
- [ ] Gotická katedrála + krkavci; bez postav, bez gore
- [ ] Spodní třetina tmavší (čitelnost obsahu)
- [ ] Široké panorama bez ořezových artefaktů

---

## 🔁 Workflow

1. Vygeneruj pozadí dle promptu, stáhni PNG.
2. Ulož do `assets-source/themes/dark-fantasy/background.png`.
3. Dej vědět — převedu na `webp` a zapojím (impl 5.7c).
