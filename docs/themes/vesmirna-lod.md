# Téma: Vesmírná loď

**ID:** `vesmirna-lod`  
**Referenční obrázek:** [assets/vesmirna-lod.png](assets/vesmirna-lod.png)

---

## Atmosféra

Pohled z interiéru obrovského vojenského hangáru vesmírné lodi. Přes masivní otevřený dok vidět vesmír a velkou bojovou loď. Dole pracují technici, žluté výstražné světla, ocelové walkways. Pocit masivního měřítka, průmyslové síly a vojenské disciplíny. Toto není civilní stanice — je to válečná loď.

Klíčový rozdíl od Sci-fi: **Sci-fi = civilní high-tech, Vesmírná loď = militaristická průmyslová síla.**

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#080b10` | Hlavní pozadí — tmavá ocelová čerň |
| `--bg-secondary` | `#0c1018` | Sidebary, panely — gunmetal |
| `--bg-card` | `#101520` | Karty, modaly |
| `--bg-card-hover` | `#151c28` | Hover stav karet |
| `--accent-cyan` | `#00b8e8` | Primární cyan — HUD prvky, text, bordury |
| `--accent-cyan-glow` | `#30d0ff` | Glow efekty, hover |
| `--accent-amber` | `#e8a020` | Sekundární — průmyslové světlo, warning, akcenty |
| `--accent-amber-glow` | `#ffb830` | Amber hover/glow |
| `--text-primary` | `#c8d8e8` | Hlavní text — studená šedavá bílá |
| `--text-secondary` | `#4878a0` | Sekundární text |
| `--text-muted` | `#283848` | Vypnuté prvky |
| `--border-cyan` | `#00b8e840` | Cyan bordury (průhledné) |
| `--border-cyan-strong` | `#00b8e8` | Aktivní HUD bordury |
| `--border-amber` | `#e8a02040` | Amber warning bordury |
| `--border-subtle` | `#0f1820` | Jemné oddělovače |

---

## Tlačítka (3D efekt)

Pravoúhlé bracket rohy místo chamfer. Militaristický styl — pevný, robustní, žádná elegance.

```
Tvar:      Ostré pravoúhlé rohy — žádný border-radius, žádný clip-path
           Rohové L-bracket dekorace (CSS ::before/::after)
Normální:  tmavý gunmetal bg + cyan bordura + L-bracket rohy
Hover:     cyan glow + translateY(-2px) + amber accent na jednom rohu
Active:    translateY(1px) + glow zesláblý
Primární:  tmavý cyan gradient + silná cyan bordura
Aktivní nav: cyan left-border (4px) + cyan text + L-bracket na levém rohu
```

---

## Dekorativní prvky

- **L-bracket rohy:** Na všech panelech — tenké L-shape CSS v rozích (vojenský HUD styl)
- **Horizontální scan linka:** Pohybující se přes panely (CSS animation, opacity 0.05)
- **Amber warning akcenty:** Malé oranžové prvky — warning stripe pattern na okrajích
- **Tech readouts:** Drobná data v rozích (souřadnice, ID lodi — dekorativní text)
- **Hangar background:** Obrovský vojenský dok s otevřeným vesmírem (background-image)
- **Logo:** Dvouřádkový bold stencil — "PROJEKT / IKAROS" (ne jednořádkový cursive)

---

## Typografie

- **Logo:** Orbitron Bold nebo Russo One — dvouřádkový, uppercase, stencil feel
- **Nadpisy:** Rajdhani Bold nebo Exo 2 — silný, militaristický
- **Navigace:** Uppercase, monospace, letter-spacing 3px — jako vojenské kódy
- **Text:** Roboto Condensed — kompaktní, funkční
- **Admin kurzíva:** Cyan cursive — překvapivý kontrast vůči militaristickému prostředí

---

## Rozdíly od Sci-fi

| Vlastnost | Sci-fi | Vesmírná loď |
|-----------|--------|-------------|
| Sekundární akcent | Magenta/fialová | Amber/oranžová |
| Prostředí | Civilní stanice (útulné) | Vojenský hangár (masivní) |
| Rohy panelů | Chamfered (45°) | L-bracket (pravoúhlé) |
| Logo | Jednořádkový cursive | Dvouřádkový stencil bold |
| Dekor | HUD + hologram | HUD + warning stripes |
| Pocit | High-tech elegantní | Průmyslová síla |

---

## Poznámky pro implementaci

- L-bracket rohy: `::before` / `::after` pseudoelementy na kartách
- Amber warning: `repeating-linear-gradient` diagonální stripe na horní hraně panelů
- Logo: needs stacked two-line layout (`flex-direction: column`)
- Background: velký tmavý hangár s modrým/černým výhledem do vesmíru
- Scan animation: `@keyframes scan { 0% { top: 0 } 100% { top: 100% } }` na pseudo-elementu
- Žádné zaoblené rohy nikde (`border-radius: 0` jako globální reset pro toto téma)
