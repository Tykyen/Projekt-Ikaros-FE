# Mystery skin — asset prompty (5.7i)

> Skin `mystery` potřebuje **1 asset: pozadí**. Ornamenty (déšť) řeší
> `decorations.css`. Design: [spec-5.7i-mystery.md](./spec-5.7i-mystery.md).

**Styl skinu:** detektivní noir — *deštivá ulice, žluté světlo lampy, mlha*.

**Generátor:** ChatGPT (GPT-4o image) nebo Midjourney v6.1.

---

## 🎨 STYLE GUIDE (závazné)

### Reference look
Široký pohled na deštivou městskou ulici za noci — mokrá dlažba odrážející žluté
světlo pouliční lampy, mlha a cigaretový kouř, staré činžovní domy, kontrastní
noirové stíny. Šedomodrá tma proťatá teplým jantarem lampy. Atmosféra **chladná,
tajemná, melancholická** — film noir.

**Inspirace:** klasický film noir × deštivá ulice 40. let × pouliční lampa
v mlze. Bez postav (nanejvýš vzdálená silueta).

**NE:** neon, syté barvy, fialová, cyberpunk město, fantasy, jasné světlo,
moderní mrakodrapy, gore.

### Master paleta (přesné hex)

| Role | Hex |
|---|---|
| Šedomodrý noční podklad | `#0c0f14` / `#161b24` |
| Jantar pouliční lampy | `#d8a24a` · jiskra `#f0c878` |
| Studená noirová modř (stíny, mlha) | `#5e7488` |
| Kalná bílá (mlha, světlo) | `#d2d4d8` |

**Zakázané barvy:** neon, fialová, cyan, syté tóny, zelená, krvavě rudá.

---

## 📦 ASSET 1/1 — `background.png` (pozadí skinu)

**Cílová cesta:** `assets-source/themes/mystery/background.png` → `mystery.webp`.
**Rozměr:** široké panorama, **1920×900** px.

### Prompt

```
A wide panoramic view of a rainy city street at night, film noir. Wet cobblestone
reflecting the warm yellow glow of a street lamp (#d8a24a), fog and cigarette
smoke drifting, old tenement buildings, high-contrast noir shadows. The night is
grey-blue (#0c0f14) cut by the warm amber lamp light. The lower third is darker
and atmospheric so UI content stays readable. Cold, mysterious, melancholic mood
— no people (a distant silhouette at most). Painterly, cinematic depth, 1940s
film noir, volumetric fog. --ar 2.13:1 --v 6.1
```

### Negative
`neon, purple, cyan, saturated colors, fantasy, cyberpunk, modern skyscrapers,
bright daylight, people closeup, gore, text, watermark, logo`

### Schvalovací kritéria
- [ ] Deštivá noirová ulice, pouliční lampa; podklad šedomodrý (`#0c0f14`)
- [ ] Žlutý jantar lampy + studená modř; žádný neon ani syté barvy
- [ ] Mlha, kontrastní noirové stíny, melancholie
- [ ] Spodní třetina tmavší (čitelnost obsahu)
- [ ] Široké panorama bez ořezových artefaktů

---

## 🔁 Workflow

1. Vygeneruj pozadí, stáhni PNG.
2. Ulož do `assets-source/themes/mystery/background.png`.
3. Dej vědět — převedu na `webp` a zapojím (impl 5.7i).
