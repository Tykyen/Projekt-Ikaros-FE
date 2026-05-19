# Steampunk skin — asset prompty (5.7f)

> Skin `steampunk` potřebuje **1 asset: pozadí**. Ornamenty (stoupající pára) řeší
> `decorations.css`. Design: [spec-5.7f-steampunk.md](./spec-5.7f-steampunk.md).

**Styl skinu:** parní metropole — *měděné komíny, vzducholodě, jantarový smog*.

**Generátor:** ChatGPT (GPT-4o image) nebo Midjourney v6.1.

---

## 🎨 STYLE GUIDE (závazné)

### Reference look
Široký pohled na viktoriánskou parní metropoli za soumraku — střechy a komíny
chrlící páru, **vzducholodě** plující nad městem, mosazné a měděné konstrukce,
potrubí, ozubená kola. Smogová mlha prosvícená jantarovým světlem zapadajícího
slunce. Atmosféra **průmyslová, teplá, rozmáchlá**.

**Inspirace:** viktoriánský Londýn × vzducholodě × měděné potrubí a kotle.
Bez postav.

**NE:** zlato/smaragd fantasy (`fantasy`), kyselá neonová žlutá (`cyberpunk`),
fialová (`ikaros`), čisté sci-fi, neon, generická AI steampunk.

### Master paleta (přesné hex)

| Role | Hex |
|---|---|
| Tmavě hnědý podklad | `#16100a` / `#241a10` |
| Leštěná mosaz (konstrukce, světlo) | `#c8893a` · jiskra `#e6b260` |
| Měděná patina (zelenkavý kov) | `#5fa890` |
| Pergamenová / smog | `#e8dcc4` |

**Zakázané barvy:** fialová, neonová žlutá, čistá cyan, smaragdová zeleň, růžová.

---

## 📦 ASSET 1/1 — `background.png` (pozadí skinu)

**Cílová cesta:** `assets-source/themes/steampunk/background.png` → `steampunk.webp`.
**Rozměr:** široké panorama, **1920×900** px.

### Prompt

```
A wide panoramic view of a Victorian steampunk metropolis at dusk — rooftops and
tall chimneys belching steam, airships drifting above the city, brass and copper
pipework and gears on the buildings. Smoggy fog lit by warm amber light of the
setting sun. Polished brass (#c8893a) catches the light; patches of green copper
patina (#5fa890). The base tones are dark warm brown (#16100a). The lower third
is darker and atmospheric so UI content stays readable; warm amber glow near the
center. Industrial, warm, sweeping mood — no people. Painterly, cinematic depth,
volumetric steam and smog. --ar 2.13:1 --v 6.1
```

### Negative
`purple, violet, neon, acid yellow, cyan, emerald, pink, clean sci-fi, fantasy
castle, people, characters, text, watermark, modern city, bright daylight, logo`

### Schvalovací kritéria
- [ ] Parní metropole, komíny, vzducholodě; podklad tmavě hnědý (`#16100a`)
- [ ] Mosaz + měděná patina + jantarový smog; žádná fialová ani neon
- [ ] Průmyslová viktoriánská atmosféra, bez postav
- [ ] Spodní třetina tmavší (čitelnost obsahu)
- [ ] Široké panorama bez ořezových artefaktů

---

## 🔁 Workflow

1. Vygeneruj pozadí, stáhni PNG.
2. Ulož do `assets-source/themes/steampunk/background.png`.
3. Dej vědět — převedu na `webp` a zapojím (impl 5.7f).
