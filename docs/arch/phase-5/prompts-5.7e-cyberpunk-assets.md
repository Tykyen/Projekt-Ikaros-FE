# Cyberpunk skin — asset prompty (5.7e)

> Skin `cyberpunk` potřebuje **1 asset: pozadí**. Ornamenty (hazard šrafy) řeší
> `decorations.css`. Design: [spec-5.7e-cyberpunk.md](./spec-5.7e-cyberpunk.md).

**Styl skinu:** corpo dystopie — *korporátní megablok za noci*. Kyselá žluť +
černá, ostré, agresivní. **Ne** romantický neonový déšť.

**Generátor:** ChatGPT (GPT-4o image) nebo Midjourney v6.1.

---

## 🎨 STYLE GUIDE (závazné)

### Reference look
Široký pohled na korporátní megablok / brutalistickou věž za noci — masivní tmavé
betonové a kovové fasády, ostrá **kyselá žlutá** neonová světla a varovné značky,
žluto-černé hazard pruhy, drony. Atmosféra **chladná, agresivní, korporátní** —
bez romantiky. Cyberpunk 2077 corpo distrikt.

**Inspirace:** Cyberpunk 2077 (Arasaka corpo) × brutalistická architektura ×
varovná průmyslová grafika. Bez postav.

**NE:** fialová/purpurová (`ikaros`), cyan (`vesmir`), teplé zlato (`fantasy`),
růžová, romantický deštivý Blade Runner, generická AI cyberpunk, postavy.

### Master paleta (přesné hex)

| Role | Hex |
|---|---|
| Uhelný podklad | `#0a0a08` / `#16160f` |
| Kyselá žluť (neon, značky, světlo) | `#f0d020` · jiskra `#fff04a` |
| Chladná ocel (kov, beton) | `#7d8a96` |
| Kovová bílá | `#e6e4d8` |

**Zakázané barvy:** fialová, cyan/tyrkysová, růžová, teplé zlato, zelená.

---

## 📦 ASSET 1/1 — `background.png` (pozadí skinu)

**Cílová cesta:** `assets-source/themes/cyberpunk/background.png` → `cyberpunk.webp`.
**Rozměr:** široké panorama, **1920×900** px.

### Prompt

```
A wide panoramic night view of a corporate cyberpunk megablock — massive
brutalist concrete-and-metal towers, sharp acid-yellow (#f0d020) neon lights and
warning signage, yellow-and-black hazard stripes on industrial edges. A few
drones in the sky. The base is coal-black (#0a0a08); cool steel-grey concrete.
Cold, aggressive, corporate mood — no romance, no rain glamour. The lower third
is darker and atmospheric so UI content stays readable; sharp yellow glow
accents. No people. Painterly-realistic, hard-edged, cinematic, in the style of
Cyberpunk 2077 corpo districts. --ar 2.13:1 --v 6.1
```

### Negative
`purple, violet, magenta, pink, cyan, teal, gold, warm gold, green, rain,
romantic neon, blade runner mood, people, characters, text, watermark, fantasy,
bright daylight, logo`

### Schvalovací kritéria
- [ ] Noční korporátní megablok; podklad uhelně černý (`#0a0a08`)
- [ ] Kyselá žlutá + ocelová šeď; žádná fialová, cyan, růžová ani teplé zlato
- [ ] Ostré, agresivní, korporátní — bez romantiky a deště
- [ ] Spodní třetina tmavší (čitelnost obsahu)
- [ ] Široké panorama bez ořezových artefaktů

---

## 🔁 Workflow

1. Vygeneruj pozadí, stáhni PNG.
2. Ulož do `assets-source/themes/cyberpunk/background.png`.
3. Dej vědět — převedu na `webp` a zapojím (impl 5.7e).
