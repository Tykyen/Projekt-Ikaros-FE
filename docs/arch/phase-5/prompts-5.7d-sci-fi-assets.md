# Sci-Fi skin — asset prompty (5.7d)

> Skin `vesmir` (žánr Sci-Fi) potřebuje **1 asset: pozadí**. Ornamenty (scan linka,
> rohové značky) řeší `decorations.css`. Design: [spec-5.7d-sci-fi.md](./spec-5.7d-sci-fi.md).

**Styl skinu:** hard sci-fi — *můstek hvězdné lodi*. Čisté, technické, sterilní.
**Ne** neon, **ne** špinavé sci-fi.

**Generátor:** ChatGPT (GPT-4o image) nebo Midjourney v6.1. Výstup PNG → převede se na webp.

---

## 🎨 STYLE GUIDE (závazné)

### Reference look
Široký pohled na můstek vesmírné lodi — čisté kovové panely, prosklená kupole
do vesmíru s hvězdami a vzdálenou planetou, technické linky a navigační HUD prvky.
Ledově modré a cyan tóny, chladné světlo. Atmosféra **sterilní, klidná, přesná**.

**Inspirace:** *Interstellar* (Endurance) × *2001: A Space Odyssey* (čistota) ×
NASA fotografie. Bez postav.

**NE:** neonová synthwave (`ikaros`), fialová, zlato, gotika, špína/rez, cyberpunk
město, jasné teplé světlo, generická AI sci-fi.

### Master paleta (přesné hex)

| Role | Hex |
|---|---|
| Vesmírný podklad | `#070b12` / `#0f1826` |
| Ledová cyan (HUD, linky, světlo panelů) | `#4fd4e4` · jiskra `#9af0fa` |
| Chladná modrá (kov, vzdálená planeta) | `#5b8fd6` |
| Chladná bílá (panely, hvězdy) | `#dde6ef` |

**Zakázané barvy:** fialová/purpurová, neon růžová, zlatá, zelená, teplé tóny.

---

## 📦 ASSET 1/1 — `background.png` (pozadí skinu)

**Účel:** pozadí světa se skinem `vesmir`.
**Cílová cesta:** `assets-source/themes/vesmir/background.png` → `vesmir.webp`.
**Rozměr:** široké panorama, **1920×900** px.

### Prompt

```
A wide panoramic interior view of a clean hard sci-fi spaceship bridge. Smooth
brushed-metal panels in icy blue and cool grey, a large curved glass dome opening
onto deep space — stars and a distant blue planet (#5b8fd6). Thin cyan HUD lines
and subtle navigation holograms (#4fd4e4 glow). Cold, sterile, precise lighting;
near-black space (#070b12). The lower third is darker and atmospheric so UI
content stays readable; gentle cyan glow near the center. Calm, clinical, vast
mood — no people, no neon signage, no clutter. Painterly-realistic, cinematic
depth, in the style of Interstellar and 2001: A Space Odyssey. --ar 2.13:1 --v 6.1
```

### Negative
`neon, purple, violet, pink, gold, green, fantasy, gothic, rust, dirt, grime,
cyberpunk city, people, characters, text, watermark, warm light, bright daylight,
clutter, logo`

### Schvalovací kritéria
- [ ] Interiér lodi + kupole do vesmíru; podklad téměř černý (`#070b12`)
- [ ] Ledová cyan + chladná modrá + bílá; žádná fialová, neon ani teplé tóny
- [ ] Čisté, sterilní — žádná špína, rez, neonové cedule
- [ ] Spodní třetina tmavší (čitelnost obsahu)
- [ ] Široké panorama bez ořezových artefaktů

---

## 🔁 Workflow

1. Vygeneruj pozadí dle promptu, stáhni PNG.
2. Ulož do `assets-source/themes/vesmir/background.png`.
3. Dej vědět — převedu na `webp` a zapojím (impl 5.7d).
