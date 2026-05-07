# Téma: Severské runy

**ID:** `severske-runy`  
**Referenční obrázek:** [assets/severske-runy.png](assets/severske-runy.png)

---

## Atmosféra

Severský runový kámen trůní uprostřed zasněžené vesnice. Dračí hlavy střeží sloupy, pochodně hořejí v mrazivém vzduchu. Vegvísir — vikingský kompas — svítí na kameni jako maják. Havrani kroužejí. Pocit drsné severské cti, staré magie run a nezkrotné vůle přežít zimu i bitvu.

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#080c10` | Hlavní pozadí — tmavá ledová čerň |
| `--bg-secondary` | `#0c1018` | Sidebary — tmavý kámen/dřevo |
| `--bg-card` | `#101520` | Karty — kamenné desky |
| `--bg-card-hover` | `#161e28` | Hover stav karet |
| `--accent-ice` | `#4ab0d0` | Primární ledová modrá — aktivní prvky, text |
| `--accent-ice-bright` | `#70d0f0` | Světlá led, glow |
| `--accent-ice-dim` | `#205870` | Tlumená led, bordury |
| `--accent-torch` | `#c08030` | Sekundární — pochodeň/amber, teplo |
| `--accent-torch-bright` | `#e0a040` | Hover pochodeň |
| `--accent-iron` | `#5a6070` | Železo — kovové bordury |
| `--accent-iron-bright` | `#7a8090` | Světlé železo |
| `--text-primary` | `#c8d8e8` | Hlavní text — chladná bílá |
| `--text-secondary` | `#5888a8` | Sekundární — ledově modrá |
| `--text-muted` | `#304050` | Vypnuté prvky |
| `--border-stone` | `#202830` | Kamenná bordura |
| `--border-iron` | `#3a4858` | Železná bordura |
| `--border-ice` | `#4ab0d040` | Ledová bordura (průhledná) |
| `--border-knotwork` | `#2a3840` | Tmavá bordura pro knoflíkový vzor |

---

## Tlačítka (3D efekt)

Kamenné/železné desky s runami. Těžké, robustní, seversky přímočaré.

```
Tvar:      border-radius: 3px — téměř pravoúhlé (tesaný kámen)
Normální:  tmavý kamenný gradient + železná bordura + chladný stín dole
Hover:     ledový blue glow (0 0 10px #4ab0d0) + translateY(-2px)
Active:    translateY(2px) — těžký dopad sekery
Primární:  ledový gradient (tmavá → ice blue) + silná iron bordura
Aktivní nav: ice blue bg + bílý text + ice blue left-border (4px) + subtle ice glow
```

---

## Dekorativní prvky

- **Dračí hlavy:** SVG dračí/vlčí hlavy na vrcholu obou sidebaru (pouze dekorativní)
- **Rampouchy:** CSS `::before` prvky visící ze spodku top-bar a horních okrajů panelů
- **Knoflíkový vzor (knotwork):** SVG nebo CSS border-image na panelech — nordický pletenec
- **Vegvísir:** Vikingský kompas jako dekorativní ornament (středový panel, pravý panel)
- **Runové ikony:** Nahrazení standardních ikon runovými symboly (✦ ᚱ ᚢ ᚾ variace)
- **Nordic kruh:** Kulatý rám loga stylizován jako železný/kamenný kruh s knotwork vnitřním prstencem — zachovává standardní kulatý formát loga
- **Nordic šipky:** Oddělovače sekcí jako `→→ ✦ ←←` styl (viz admin message)
- **Havran:** Dekorativní v background scéně (neinteraktivní)
- **Pochodně:** Amber glow efekty v rozích sidebaru (radial-gradient)

---

## Typografie

- **Logo:** Norse nebo Cinzel — epický, runový feeling (ne cursive, ale majuskulní serif)
- **Nadpisy:** Uncial Antiqua nebo IM Fell English — historický, nordický
- **Navigace:** Uppercase, letter-spacing 3px — jako vytesaný do kamene
- **Text:** Lora nebo EB Garamond — čitelný, historický
- **Admin kurzíva:** Ice blue italic + nordické šipky po stranách (`→→ ✦ text ✦ ←←`)

---

## Rozdíly od ostatních témat

| Vlastnost | Nemrtví | Příroda | Severské runy |
|-----------|---------|---------|--------------|
| Materiál | Vlhký kámen | Živé dřevo | Tesaný kámen + železo |
| Primární akcent | Toxická zelená | Lesní zelená | Ledová modrá |
| Sekundární | — | Smaragd | Amber pochodeň |
| Zvíře | Kostlivec | Víla | Havran + drak |
| Atmosféra | Smrt a rozklad | Živá příroda | Drsná čest + mráz |
| Logo frame | Skeletal | Listový věnec | Vikingský štít |

---

## Poznámky pro implementaci

- Rampouchy: CSS `clip-path` nebo SVG — nepravidelné špičky visící ze spodního okraje top-bar
- Dračí hlavy: SVG absolutně pozicované na `top: 0` obou sidebaru, `pointer-events: none`
- Knotwork bordura: SVG `pattern` jako `border-image` na panelech
- Vegvísir SVG: dekorativní v pravém panelu (compass rose — 8 paprscích)
- Logo kruh: železný/kamenný kruh s knotwork ornamentem — `border` + SVG knotwork ring overlay
- Pochodeňový ambient: `radial-gradient` v rozích — `#c0803020` warm glow
- Ice ambient: `radial-gradient` ze středu top — `#4ab0d010` chladný nádech
- ID souboru: `severske-runy` (bez háčku v ID pro CSS kompatibilitu)
