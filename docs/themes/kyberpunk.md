# Téma: Kyberpunk

**ID:** `kyberpunk`  
**Referenční obrázek:** [assets/kyberpunk.png](assets/kyberpunk.png)

---

## Atmosféra

Deštivá noc v neonové megalopoli. Mrakodrapy s asijskými neonovými nápisy, létající vozidla, obří holografický Ikaros vznáší se nad městem jako digitální božstvo. Déšť se odráží od mokrého asfaltu. Cyan a magenta — dvě neonové barvy které definují celý svět. Žádná příroda, žádná minulost — jen budoucnost, korporace a digitální underground.

**Klíčový rozdíl od Sci-fi:** Sci-fi = funkční tech uvnitř stanice. Kyberpunk = ulice, neon, déšť, anarchie.

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#050810` | Hlavní pozadí — absolutní tmavost |
| `--bg-secondary` | `#080c18` | Sidebary — tmavá navy |
| `--bg-card` | `#0a1020` | Karty — tmavý panel |
| `--bg-card-hover` | `#0f1830` | Hover stav karet |
| `--accent-cyan` | `#00d8e8` | Primární cyan — nav items, ikony, text |
| `--accent-cyan-glow` | `#40f0ff` | Cyan glow |
| `--accent-cyan-dim` | `#006878` | Tlumená cyan |
| `--accent-magenta` | `#e020c0` | Primární magenta — headers, card borders, logo ring |
| `--accent-magenta-glow` | `#ff40e0` | Magenta glow |
| `--accent-magenta-dim` | `#701060` | Tlumená magenta |
| `--text-primary` | `#c8e8f8` | Hlavní text — studená modrobílá |
| `--text-cyan` | `#00d8e8` | Cyan text — nav items, aktivní |
| `--text-magenta` | `#e020c0` | Magenta text — headers sekcí |
| `--text-muted` | `#203040` | Vypnuté prvky |
| `--border-cyan` | `#00d8e840` | Cyan bordura (průhledná) |
| `--border-cyan-strong` | `#00d8e8` | Aktivní cyan bordura |
| `--border-magenta` | `#e020c060` | Magenta bordura (průhledná) |
| `--border-magenta-strong` | `#e020c0` | Aktivní magenta bordura — karty |

> **Záměrné rozdělení:** Navigace/ikony = CYAN. Sekce-headery/card-borders/logo = MAGENTA.

---

## Tlačítka (3D efekt)

Chamfered cyberpunk styl — agresivnější neon než Sci-fi, výraznější glow.

```
Tvar:      clip-path: polygon(8px 0%, 100% 0%, calc(100%-8px) 100%, 0% 100%)
           (chamfer — stejný jako Sci-fi ale tmavší základ)
Normální:  tmavý panel + cyan bordura + slabý cyan glow
Hover:     cyan glow exploduje (0 0 20px #00d8e8) + translateY(-2px)
Active:    translateY(1px) + glow slábne
Primární:  magenta bordura (!) místo cyan — kontrast
Aktivní nav: cyan bg (subtle) + cyan text + cyan left chamfer glow
```

---

## Dekorativní prvky

- **Chamfered rohy:** Na všech panelech — stejný systém jako Sci-fi ale výraznější neon
- **Rain efekt:** CSS `::before` s animovanými vertikálními čárkami — déšť (opacity 0.3)
- **Obří hologram:** Ikaros jako glowing holografická figura v background scéně
- **Neonové nápisy:** Asijské znaky v background-image (neinteraktivní)
- **Logo:** Cyan kruh + magenta neonový vnější ring (double ring — unikátní)
- **Logo text:** "PROJEKT" bílý bold, "IKAROS" cyan bold — uppercase, tech font
- **Magenta card borders:** Hlavní obsah karty má magenta borduru (ne cyan)
- **HUD rohy:** L-bracket chamfer kombinace na větších panelech
- **Létající vozidla:** V background scéně (background-image)
- **Mokrý asfalt:** Background reflection overlay — neon se odráží

---

## Typografie

- **Logo:** Orbitron ExtraBold — uppercase, maximálně technický
- **Nadpisy:** Exo 2 nebo Rajdhani — agresivní, kompaktní
- **Navigace:** Uppercase, letter-spacing 2px, monospace nebo Orbitron
- **Text:** Roboto nebo Inter — čistý, funkční
- **Admin kurzíva:** Magenta italic — kontrast vůči cyan prostředí
- **Sekce headery:** Magenta uppercase (NAVIGACE, VESMÍRY, CHAT)

---

## Rozdíly od Sci-fi a Vesmírné bitvy

| Vlastnost | Sci-fi | Vesmírná bitva | Kyberpunk |
|-----------|--------|----------------|-----------|
| Primární | Cyan | Červená | Cyan |
| Sekundární | Magenta | — | Magenta (silnější) |
| Prostředí | Stanice interior | Vesmír | Déšť + ulice |
| Card border | Cyan | Červená | **Magenta** |
| Header barva | Cyan | Červená | **Magenta** |
| Logo ring | Cyan | Červená | **Magenta** |
| Unikátní | Hologram diagram | Alert panel | Obří hologram + déšť |
| Atmosféra | Funkční tech | Krize | Underground neon |

---

## Poznámky pro implementaci

- Rain: CSS `@keyframes rain` — translateY na thin pseudo-element lines, random delays
- Double logo ring: vnější `box-shadow: 0 0 0 3px #e020c0` + vnitřní `border: 2px solid #00d8e8`
- Magenta card borders: `.card { border-color: var(--border-magenta-strong) }` — přepis cyan výchozí
- Cyan sekce headery přepsány na magenta: `--section-header-color: var(--accent-magenta)`
- Hologram bg: background-image s glowing bird figurou, `mix-blend-mode: screen`
- Neon reflection: `::after` na body — gradient overlay ze spodku s neon barvami
- Pozor: jasný neon na tmavém bg — kontrast je vysoký, ale testovat WCAG AA pro text
