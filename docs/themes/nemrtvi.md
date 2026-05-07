# Téma: Nemrtví

**ID:** `nemrtvi`  
**Referenční obrázek:** [assets/nemrtvi.png](assets/nemrtvi.png)

---

## Atmosféra

Gotická krypta při svitu zeleně planoucích svíček. Kamenné oblouky, náhrobek uprostřed, kostlivci jako strážci po stranách, smrtka v rohu. Toxické nekromantické světlo. Vše je z kamene, rzi a starých kostí. Pocit smrtelnosti, temné magie a nemrtvé armády. Nikdo sem nepřichází živý — nebo aspoň ne dlouho.

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#0a0c08` | Hlavní pozadí — tmavá kamenná čerň |
| `--bg-secondary` | `#101410` | Sidebary — vlhký kámen |
| `--bg-card` | `#141810` | Karty — kamenné desky |
| `--bg-card-hover` | `#1a2018` | Hover stav karet |
| `--accent-toxic` | `#30c060` | Primární nekromantická zelená — svíčky, aktivní prvky |
| `--accent-toxic-glow` | `#50e080` | Zelený glow (nekromantická energie) |
| `--accent-toxic-dim` | `#186030` | Tlumená zelená, sekundární bordury |
| `--accent-bone` | `#c8b888` | Kost/sloní kost — sekundární akcent, text |
| `--accent-rust` | `#6a3a10` | Rez — kovové prvky, řetězy |
| `--accent-rust-bright` | `#8a5020` | Světlejší rez — hover kovových prvků |
| `--text-primary` | `#c0b890` | Hlavní text — vybledlá kost |
| `--text-secondary` | `#607050` | Sekundární text — mech na kameni |
| `--text-muted` | `#303828` | Vypnuté prvky |
| `--border-stone` | `#282e20` | Kamenná bordura |
| `--border-rust` | `#5a3010` | Rezavá kovová bordura |
| `--border-toxic` | `#30c06030` | Nekromantická bordura (průhledná) |

---

## Tlačítka (3D efekt)

Kamenné desky s rezavými kovovými okovy. Těžké, nehybné, jako náhrobní deska.

```
Tvar:      border-radius: 2px — téměř pravoúhlé (kamenné)
Normální:  tmavý kamenný gradient + rezavá kovová bordura + těžký spodní stín
Hover:     zelený glow na okraji + translateY(-2px) + bordura zezelení
Active:    translateY(2px) — těžký dopad jako kamenná deska
Primární:  tmavě zelený gradient (nekromantický) + toxický glow
Aktivní nav: zelený left-border (3px) + toxicky zelený text + lebka ikona
```

---

## Dekorativní prvky

- **Lebky:** Ikonky v navigaci místo standardních symbolů (SVG lebky), v rozích panelů
- **Lebky v headeru:** Miniaturní lebky na okrajích header oblasti
- **Řetězy:** Dekorativní prvky okolo panelů — CSS nebo SVG chain pattern
- **Kamenná textura:** `background-image` na všech panelech — mokrý kámen s prasklinami
- **Zelené svíčky:** Dekorativní v rozích sidebaru (background-image svíček se zeleným plamenem)
- **Kostlivec/Smrtka:** Dekorativní figure vpravo (background-image detail)
- **Kapající efekt:** CSS `::after` na spodních okrajích panelů — jako kapající vosk nebo sliz
- **+ křížové tlačítko:** `+` ve tvaru kříže/dýky (CSS transform nebo SVG)
- **Nekromantický glow:** Zelený radial-gradient v rozích krypt jako zdroj energie

---

## Typografie

- **Logo:** MedievalSharp nebo UnifrakturMaguntia — gotická lomená písma
- **Nadpisy:** Cinzel nebo IM Fell English — těžký historický serif
- **Navigace:** Uppercase, letter-spacing 2px, serif — jako kamenný nápis
- **Text:** Lora nebo EB Garamond — čitelný ale historický
- **Admin kurzíva:** Italic zelená — jako nekromantický rukopis
- **"Projekt Ikaros" v textu:** Toxická zelená (`--accent-toxic`)

---

## Rozdíly od ostatních témat

| Vlastnost | Příroda | Pergamen | Nemrtví |
|-----------|---------|---------|---------|
| Materiál | Dřevo + kamen | Papír + kůže | Kámen + rez + kosti |
| Primární akcent | Zelená (živá) | Červená + zlatá | Zelená (toxická/mrtvá) |
| Světlo | Sluneční | Svíčky (teplé) | Svíčky (zelené/toxické) |
| Dekor | Organický | Knižní | Lebky + řetězy |
| Pocit | Živá příroda | Učenost | Smrt a rozklad |
| Ikony nav | Listy, příroda | Brk, kniha | Lebky, kříže |

---

## Poznámky pro implementaci

- Kamenná textura: CSS `background-image` s tmavým noise nebo SVG crack pattern
- Řetězy: SVG `pattern` jako `border-image` nebo absolute positioned SVG
- Nekromantický glow: `box-shadow: 0 0 20px #30c06060` na aktivních prvcích
- Kapající efekt: CSS `clip-path` nebo SVG mask na spodních okrajích panelů
- Lebka ikony: SVG sada nahrazující standardní ikony pro toto téma
- Logo: skeletal/ghost verze ptáka Ikarose — průhledný, obrysový
- Zelené svíčky: animated `flicker` keyframe na pseudo-elementech
- Pravý panel: Smrtka jako background-image detail (pouze dekorativní)
