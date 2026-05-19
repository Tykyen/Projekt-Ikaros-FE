# Western skin — asset prompty (5.7l)

> Skin `western` potřebuje **1 asset: pozadí**. Ornamenty (prach) řeší
> `decorations.css`. Design: [spec-5.7l-western.md](./spec-5.7l-western.md).

**Styl skinu:** městečko na hranici — *prašná dřevěná ulice za soumraku*.

**Generátor:** ChatGPT (GPT-4o image) nebo Midjourney v6.1.

---

## 🎨 STYLE GUIDE (závazné)

### Reference look
Široký pohled na prašnou ulici pohraničního westernového městečka za soumraku —
dřevěné fasády, salón s verandou, kůl na uvázání koní, prach ve vzduchu, dlouhé
teplé světlo zapadajícího slunce. Opotřebované vybledlé dřevo. Atmosféra
**teplá, prašná, opravdová, klidná**.

**Inspirace:** klasický western × pohraniční městečko 19. století × prašná hlavní
ulice za soumraku. Bez postav.

**NE:** mosazný průmysl steampunk (`steampunk`), barokní zlato (`historie`),
zarostlé ruiny (`apokalypsa`), neon, syté barvy, moderní prvky.

### Master paleta (přesné hex)

| Role | Hex |
|---|---|
| Tmavě hnědý podklad | `#171009` / `#241a10` |
| Soumrační oranž (světlo slunce) | `#cf8a44` · jiskra `#e8ad6c` |
| Vyprahlá šalvěj (keře, stín) | `#8a8a64` |
| Písková (prach, dřevo) | `#e6d8bc` |

**Zakázané barvy:** neon, fialová, cyan, smaragdová zeleň, mosazná, jasné tóny.

---

## 📦 ASSET 1/1 — `background.png` (pozadí skinu)

**Cílová cesta:** `assets-source/themes/western/background.png` → `western.webp`.
**Rozměr:** široké panorama, **1920×900** px.

### Prompt

```
A wide panoramic view of a dusty frontier western town main street at dusk —
wooden building facades, a saloon with a porch, hitching posts, dust hanging in
the air, long warm light of the setting sun. Weathered, faded timber. Warm
sepia-brown tones, dusk sky in dusky orange (#cf8a44). Dry sage (#8a8a64)
shrubs. The base tone is dark warm brown (#171009). The lower third is darker
and atmospheric so UI content stays readable; warm glow near the horizon. Warm,
dusty, authentic, calm mood — no people. Painterly, cinematic depth, classic
western. --ar 2.13:1 --v 6.1
```

### Negative
`neon, purple, cyan, emerald, brass, gold baroque, steampunk, overgrown ruins,
saturated colors, modern, people, characters, text, watermark, logo`

### Schvalovací kritéria
- [ ] Prašná dřevěná westernová ulice za soumraku; podklad tmavě hnědý (`#171009`)
- [ ] Soumrační oranž + vybledlé dřevo + vyprahlá šalvěj; žádný neon ani syté barvy
- [ ] Teplá, prašná, opravdová atmosféra; bez postav
- [ ] Spodní třetina tmavší (čitelnost obsahu)
- [ ] Široké panorama bez ořezových artefaktů

---

## 🔁 Workflow

1. Vygeneruj pozadí, stáhni PNG.
2. Ulož do `assets-source/themes/western/background.png`.
3. Dej vědět — převedu na `webp` a zapojím (impl 5.7l — poslední skin).
