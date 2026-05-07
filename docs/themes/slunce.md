# Téma: Slunce

**ID:** `slunce`  
**Referenční obrázek:** [assets/slunce.png](assets/slunce.png)

---

## Atmosféra

Spálená země pod vládou oslňujícího slunce. Obří žhnoucí koule ovládá obzor nad troskami starověké civilizace — kamenné monolity, puklá pouštní zem, kroužící vrány, lebka draka v prachu. Temné uhelné panely s jantarovými bordurama jako desky starodávného chrámu. Projekt Ikaros jako sluneční božstvo — nemilosrdné, věčné, spalující. Zlato je horké, ne studené — amber, ne platinum.

**Nejteplejší téma kolekce — vše je amber, žhnoucí oranž, popálená čerň. Žádná modrá, žádné stříbro.**

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#120c04` | Hlavní pozadí — spálená čerň |
| `--bg-secondary` | `#180e06` | Sidebary — uhelná hnědočerň |
| `--bg-card` | `#1e1408` | Karty — tmavý kámen |
| `--bg-card-hover` | `#261a0c` | Hover stav karet |
| `--accent-amber` | `#c88010` | Primární amber — bordury, ikony, text |
| `--accent-amber-bright` | `#e8a020` | Hover amber, glow |
| `--accent-amber-dim` | `#604008` | Tlumená amber — subtilní bordury |
| `--accent-solar` | `#d06010` | Sluneční oranž — section ikony, ☀ symbol |
| `--accent-solar-glow` | `#f07818` | Intenzivní sluneční záře — max glow |
| `--accent-crimson` | `#6a1808` | Temně rudá — detailní ornamenty, bannery |
| `--text-primary` | `#e8c070` | Hlavní text — teplá zlatavá krémová |
| `--text-secondary` | `#806030` | Sekundární text — tmavá amber |
| `--text-muted` | `#381e08` | Vypnuté prvky |
| `--border-amber` | `#c8801040` | Amber bordura (průhledná) |
| `--border-amber-strong` | `#c88010` | Silná amber bordura — panely |
| `--border-stone` | `#2a1e0c` | Kamenná bordura — subtilní |

> **Monochromatická tepelná paleta:** Amber, oranž a temná hnědočerň. Nulová přítomnost modrých, zelených nebo fialových tónů.

---

## Tlačítka (3D efekt)

Kamenná deska starodávného chrámu — těžká, vypálená sluncem.

```
Tvar:      border-radius: 2px — takřka pravoúhlé (kamenná deska)
           Jemné kamenné rohové úkosy (border-corner cut, ne florální)
Normální:  tmavý hnědočerný gradient + amber bordura + kamenný stín
Hover:     sluneční glow (0 0 14px #c88010) + translateY(-2px) + bordura zesvětlí
Active:    translateY(3px) — těžký kamenný dopad
Primární:  gradient s lehkým amber nádechem + silná amber bordura
Aktivní nav: amber/gold bg + tmavý text + ☀ symbol svítí plně
```

---

## Dekorativní prvky

- **☀ Sluneční symbol:** Ikonografický prvek celého tématu — stylizované sluneční kolo/kompas s paprsky jako nav item ikony a oddělovače sekcí (nahrazuje standardní ikony)
- **Puklá kamenná textura:** CSS noise/crack overlay na panelech — `background-image: url("cracks.svg"); opacity: 0.06` — jemné praskliny jako starověký kámen
- **Rohové kamenné rámy:** Čtvercové rohové úkosy na panelech — ne florální, ale kamenicky opracované (jednoduché diagonální cut)
- **Obří slunce:** Dominantní žhnoucí koule top-center background scény — pulsující glow animace `@keyframes solar-pulse { 0%, 100% { filter: blur(2px) brightness(1) } 50% { filter: blur(3px) brightness(1.2) } }`
- **Kamenné monolity:** Antické sloupy/stély v background scéně — siluety
- **Puklá zemská kůra:** Foreground textura — rozpraskané pouštní dlaždice (background-image)
- **Kroužící vrány:** Siluety ptáků v oranžovém nebi (background-image detail)
- **Dračí/beraní lebka:** Dekorativní detail vpravo dole v background scéně
- **Červený prapor:** Tmavě rudý banner po levé straně scény (background-image)
- **Logo kruh:** Tmavě hnědý kruh s amber kamenným ornamnetálním rámem — sluneční paprsky kolem kruhu
- **Logo bird:** Amber/zlatý Ikaros — `filter: drop-shadow(0 0 10px #e8a020) sepia(0.3)`
- **Tepelné vlnění:** CSS `@keyframes heat-shimmer` — velmi jemný `scaleY` warp na bg overlay, `animation: heat-shimmer 4s ease-in-out infinite`

---

## Typografie

- **Logo:** Trajan Pro nebo Cinzel — monumentální, antický kapitálkový serif
- **"Projekt Ikaros" v logu:** Amber bold, uppercase — jako vytesané do kamene
- **Nadpisy:** Cinzel nebo Playfair Display Bold — historický, velkolepý
- **Navigace:** Uppercase, letter-spacing 3px, serif — jako chrámové nápisy
- **Text:** Lora nebo EB Garamond — čitelný, historický
- **Admin kurzíva:** Amber-zlatá italic — jako psaní žhavým stylusem
- **"Projekt Ikaros" v textu:** Světlá amber (`--accent-amber-bright`)

---

## Rozdíly od ostatních témat

| Vlastnost | Zlatý standard | Postapo | Slunce |
|-----------|---------------|---------|--------|
| Zlatá | Studená rich gold | Olivová (ne zlatá) | **Teplá amber** |
| Textura | Čistá | Koroze, rez | Prasklý kámen |
| Prostředí | Prázdná čerň | Zóna radiace | Antické ruiny |
| Ikony nav | Zlaté standardní | Olivové standardní | **☀ Sluneční symbol** |
| Atmosféra | Luxus, prestiž | Apokalyptická resignace | Antická velikost |
| Glow | Zlatý | Téměř žádný | **Sluneční oranž** |
| Pocit | Bankovní trezor | Bunkr | Starověký chrám |

---

## Poznámky pro implementaci

- Crack texture: SVG generovaný pattern — `<path>` s nepravidelnými liniemi, `stroke: #c8801015; fill: none`; jako `background-image: url("data:image/svg+xml,...")`
- Solar pulse: `filter: drop-shadow(0 0 40px #f07818) drop-shadow(0 0 80px #d06010)` na bg sun image — pulsuje brightness
- Tepelné vlnění: velmi subtilní — `transform: scaleY(1.002)` na `::before` overlay, takřka neviditelné ale atmosférické
- ☀ symbol: SVG s centrálním kruhem + 8 paprsků — `stroke: var(--accent-solar); fill: none; stroke-width: 1.5`
- Logo paprsky: `box-shadow: 0 0 0 4px var(--accent-amber), 0 0 20px var(--accent-solar-glow)` — corona efekt
- Kamenné rohy: `clip-path: polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)` — antický kamenný cut
- Žádný `backdrop-filter` — stone panels jsou solid, ne skleněné (opak Měsíce)
- Ambient light overlay: `background: radial-gradient(ellipse at 50% 0%, rgba(208, 96, 16, 0.12) 0%, transparent 60%)` — sluneční záře shora dolů
