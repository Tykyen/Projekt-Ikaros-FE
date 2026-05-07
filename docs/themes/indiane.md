# Téma: Indiánské

**ID:** `indiane`  
**Referenční obrázek:** [assets/indiane.png](assets/indiane.png)

---

## Atmosféra

Hranice divokého západu při dramatickém západu slunce. Kovbojové na koních, teepee, saloon, blesky v bouřkovém nebi. Indiánské motivy prostupují vším — lapače snů, peří, korálkové bordury, tyrkysová barva. Hybrid dvou světů: frontier Amerika + původní kultura. Pocit svobody, nebezpečí, ztracených horizontů a staré moudrosti.

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#120a04` | Hlavní pozadí — tmavé zvětralé dřevo |
| `--bg-secondary` | `#1a1008` | Sidebary — staré saloonové prkna |
| `--bg-card` | `#d4a870` | Karty — starý pergamen/kůže |
| `--bg-card-dark` | `#b08050` | Tmavší kůže — okraje karet |
| `--bg-card-hover` | `#e0bc88` | Hover — světlejší pergamen |
| `--accent-sunset` | `#d06010` | Západ slunce — primární oranžová |
| `--accent-sunset-bright` | `#f08020` | Světlý západ, hover |
| `--accent-sunset-dim` | `#803010` | Temný západ, bordury |
| `--accent-turquoise` | `#208080` | Tyrkysová — indiánský akcent, admin text |
| `--accent-turquoise-bright` | `#30a0a0` | Světlá tyrkys, hover |
| `--accent-terracotta` | `#c04820` | Hlína/cihlová — "Projekt Ikaros" text |
| `--accent-gold-west` | `#c8900a` | Zlatá — kapesní hodinky, mince, bordury |
| `--text-on-leather` | `#2a1808` | Text na kůži/pergamenu — tmavý |
| `--text-on-leather-sec` | `#604020` | Sekundární text na kůži |
| `--text-on-dark` | `#c8900a` | Text na tmavém dřevu — zlatohnědá |
| `--text-muted` | `#503020` | Vypnuté prvky |
| `--border-wood` | `#3a1e08` | Dřevěná bordura |
| `--border-leather` | `#805030` | Kožená bordura |
| `--border-bead` | viz dekor | Korálkové bordury — viz dekorativní prvky |

---

## Tlačítka (3D efekt)

Saloonové dřevěné tlačítko — robustní, zvětralé, s koženým nádechem.

```
Tvar:      border-radius: 4px — mírně zaoblené (ruční tesání)
Normální:  tmavý dřevěný gradient + kožená bordura + teplý zemitý stín
Hover:     sunset oranžový glow + translateY(-2px) + bordura oranžoví
Active:    translateY(2px) — těžký western dopad
Aktivní nav: oranžová/sunset left-border (4px) + zlatý text + `>` šipka vpravo
Primární:  sunset gradient (tmavý → oranžový) + zlatá bordura
```

---

## Dekorativní prvky

- **Lapače snů (dreamcatcher):** SVG lapač snů s visícím peřím — levý sidebar (top) a pravý panel
- **Peří:** Visící indiánská pera z lapačů snů — CSS animace jemného pohybu
- **Korálkové bordury:** Řada malých barevných korálků (červená, modrá, tyrkysová, bílá) jako `border-image` nebo SVG pattern na horizontálních oddělovačích
- **Západ slunce background:** Dramatický oranžovo-červený západ s blesky, teepee, saloon
- **Kapesní hodinky:** Zlaté hodinky dole vpravo (background-image detail)
- **Hrací karty + kostky:** Dole ve scéně — western gambling rekvizity
- **Lucerna:** Starý petroleum lampáš dole vlevo (background-image)
- **Šipka `>`:** Navigační prvky mají `>` jako indikátor — frontier styl
- **Kulatý logo medailon:** Tmavý kruh se sunset zlatým rámem + peří-ornament okolo

---

## Typografie

- **Logo:** Rye nebo Playfair Display — western serif s patinou
- **Nadpisy:** Lora Bold nebo IM Fell English — teplý historický serif
- **Navigace:** Uppercase, letter-spacing 2px, bez ikony (jen text + `>`)
- **Text:** Lora — čitelný, knižní, teplý
- **Admin kurzíva:** Tyrkysová italic — indiánský kontrast k zemitým tónům
- **"Projekt Ikaros" v textu:** Terracotta (`--accent-terracotta`)

---

## Rozdíly od Hospody a Pergamenu

| Vlastnost | Hospoda | Pergamen | Indiánské |
|-----------|---------|---------|-----------|
| Prostředí | Středověká krčma | Studovna | Frontier západ |
| Primární akcent | Crimson | Crimson/zlatá | Sunset oranžová |
| Sekundární | Amber | — | Tyrkysová |
| Dekor | Cechovní banner | Brk, kompas | Lapač snů, peří, korálek |
| Karta bg | Pergamen | Pergamen | Kůže/kožený pergamen |
| Kultura | Evropská | Evropská | Americká (hybrid) |

---

## Poznámky pro implementaci

- Korálkové bordury: SVG `<pattern>` s malými kruhy v barvách `#c04820`, `#208080`, `#c8900a`, `#f0f0f0`
- Dreamcatcher: SVG komponenta `<Dreamcatcher />` — kruh + paprsčité nitě + visící peří
- Peří animace: `@keyframes feather-sway { 0%,100% { rotate: -3deg } 50% { rotate: 3deg } }`
- Světlé karty (kůže) — tmavý text stejně jako Hospoda/Pergamen
- Logo kruh: sunset zlatý rám + miniaturní peří dekorace okolo kruhu (SVG)
- `>` navigační šipky: CSS `::after` content na nav items
- Teplý ambient: `radial-gradient` sunset oranžová ze středu top oblasti
