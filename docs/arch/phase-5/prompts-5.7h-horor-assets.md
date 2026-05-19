# Horor skin — asset prompty (5.7h)

> Skin `horor` potřebuje **1 asset: pozadí**. Ornamenty (chvějivá svíčka, vignette)
> řeší `decorations.css`. Design: [spec-5.7h-horor.md](./spec-5.7h-horor.md).

**Styl skinu:** strašidelný dům — *opuštěné sídlo, jediná svíčka, tma*.

**Generátor:** ChatGPT (GPT-4o image) nebo Midjourney v6.1.

---

## 🎨 STYLE GUIDE (závazné)

### Reference look
Široký pohled do nitra opuštěného sídla v noci — prázdná chodba či pokoj,
prach, pavučiny, polorozpadlý nábytek pod plachtami, jediná **svíčka** vrhající
slabé chvějivé jantarové světlo do hluboké tmy. Atmosféra **tísnivá, tichá,
klaustrofobní**.

**Inspirace:** klasický strašidelný dům × světlo svíčky ve tmě × opuštěný
viktoriánský interiér. Bez postav, bez příšer.

**NE:** gotická katedrála / krvavě rudá (`dark-fantasy`), neon, syté barvy,
gore, krev, jasné světlo, příšery, postavy.

### Master paleta (přesné hex)

| Role | Hex |
|---|---|
| Téměř černý podklad | `#090807` / `#14110d` |
| Slábnoucí jantar svíčky | `#c89a52` · jiskra `#e8c884` |
| Chorobná šeď (prach, plachty) | `#8a8478` |
| Špinavá bílá | `#ccc6ba` |

**Zakázané barvy:** krvavě rudá, neon, fialová, cyan, zelená, syté tóny.

---

## 📦 ASSET 1/1 — `background.png` (pozadí skinu)

**Cílová cesta:** `assets-source/themes/horor/background.png` → `horor.webp`.
**Rozměr:** široké panorama, **1920×900** px.

### Prompt

```
A wide panoramic interior of an abandoned haunted mansion at night — an empty
hallway or room, dust, cobwebs, decayed furniture under white sheets. A single
candle casts a weak, flickering amber light (#c89a52) into deep darkness; most of
the scene is near-black (#090807). Sickly grey (#8a8478) dust and sheets. Heavy
shadow swallows the edges. The lower third is darker so UI content stays
readable. Oppressive, silent, claustrophobic mood — no people, no monsters, no
gore. Painterly, cinematic depth, candlelit chiaroscuro. --ar 2.13:1 --v 6.1
```

### Negative
`blood red, gore, neon, purple, cyan, green, gothic cathedral, bright light,
saturated colors, monsters, people, characters, text, watermark, daylight, logo`

### Schvalovací kritéria
- [ ] Interiér opuštěného sídla, svíčka; podklad téměř černý (`#090807`)
- [ ] Slábnoucí jantar + chorobná šeď; žádná krvavě rudá, neon ani syté barvy
- [ ] Tísnivá, klaustrofobní atmosféra; bez postav, bez gore
- [ ] Tma pohlcuje okraje; spodní třetina tmavší (čitelnost obsahu)
- [ ] Široké panorama bez ořezových artefaktů

---

## 🔁 Workflow

1. Vygeneruj pozadí, stáhni PNG.
2. Ulož do `assets-source/themes/horor/background.png`.
3. Dej vědět — převedu na `webp` a zapojím (impl 5.7h).
