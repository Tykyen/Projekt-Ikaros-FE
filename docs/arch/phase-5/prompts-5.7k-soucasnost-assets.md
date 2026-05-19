# Současnost skin — asset prompty (5.7k)

> Skin `moderni` potřebuje **1 asset: pozadí**. Ornamenty (světlo lampy) řeší
> `decorations.css`. Design: [spec-5.7k-soucasnost.md](./spec-5.7k-soucasnost.md).

**Styl skinu:** každodenní útulno — *útulný obývací pokoj za večera*.

**Generátor:** ChatGPT (GPT-4o image) nebo Midjourney v6.1.

---

## 🎨 STYLE GUIDE (závazné)

### Reference look
Široký pohled do útulného současného obývacího pokoje za večera — teplé světlo
stojací lampy, dřevěné police s knihami, měkká pohovka a textil, hrnek na stolku,
rostliny. Tlumené teplé zemšté tóny, večerní šero. Atmosféra **klidná, lidská,
příjemná** — žádné drama.

**Inspirace:** útulný skandinávský interiér za večera × teplé světlo lampy ×
obytný prostor. Bez postav.

**NE:** dramatické žánry, neon, syté/jasné barvy, fantasy, sci-fi, denní jasné
světlo (je večer), prázdná sterilní místnost.

### Master paleta (přesné hex)

| Role | Hex |
|---|---|
| Tmavě hnědý večerní podklad | `#15110d` / `#221c15` |
| Teplá terakota (světlo lampy, textil) | `#c87e54` · jiskra `#e3a378` |
| Šalvějová zeleň (rostliny, textil) | `#7d9478` |
| Krémová (světlo, stěny) | `#e6ddcd` |

**Zakázané barvy:** neon, fialová, cyan, kyselá žlutá, syté/jasné tóny.

---

## 📦 ASSET 1/1 — `background.png` (pozadí skinu)

**Cílová cesta:** `assets-source/themes/moderni/background.png` → `moderni.webp`.
**Rozměr:** široké panorama, **1920×900** px.

### Prompt

```
A wide panoramic interior of a cozy contemporary living room in the evening —
warm light from a floor lamp, wooden shelves with books, a soft sofa and
textiles, a mug on a side table, a few plants. Muted warm earthy tones, evening
gloom. Warm terracotta (#c87e54) lamp light, sage-green (#7d9478) plants and
fabric, cream walls. The base tone is dark warm brown (#15110d). The lower third
is darker and atmospheric so UI content stays readable; warm glow near the lamp.
Calm, human, pleasant mood — no people, no drama. Painterly, cozy, soft evening
light, Scandinavian-cozy interior. --ar 2.13:1 --v 6.1
```

### Negative
`neon, purple, cyan, saturated colors, fantasy, sci-fi, drama, bright daylight,
empty sterile room, people, characters, text, watermark, logo`

### Schvalovací kritéria
- [ ] Útulný současný obývací pokoj za večera; podklad tmavě hnědý (`#15110d`)
- [ ] Teplá terakota + šalvějová zeleň; žádné syté ani neonové barvy
- [ ] Klidná, lidská, příjemná atmosféra; bez postav
- [ ] Spodní třetina tmavší (čitelnost obsahu)
- [ ] Široké panorama bez ořezových artefaktů

---

## 🔁 Workflow

1. Vygeneruj pozadí, stáhni PNG.
2. Ulož do `assets-source/themes/moderni/background.png`.
3. Dej vědět — převedu na `webp` a zapojím (impl 5.7k).
