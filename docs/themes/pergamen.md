# Téma: Pergamen

**ID:** `pergamen`  
**Referenční obrázek:** [assets/pergamen.png](assets/pergamen.png)

---

## Atmosféra

Starověká knihovna při svitu svíček. Regály plné knih, gotická okna, teplé světlo luceren. Hlavní obsah je zobrazen doslova na stránkách **otevřené knihy** — jako by uživatel listoval starým tomem. Sidebary jsou z tmavého mahagonového dřeva. Inkoust, brk, kompas, staré mapy. Žádná technologie, žádná magie — čistá učenost a příběh.

**Unikátní UI metafora: otevřená kniha jako hlavní content container.**

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#1a0e06` | Hlavní pozadí — tmavá knihovna |
| `--bg-secondary` | `#241508` | Sidebary — mahagonové dřevo |
| `--bg-card` | `#e8d8a8` | Karty / stránky knihy — pergamen |
| `--bg-card-dark` | `#c8a878` | Tmavší pergamen — okraje stránek |
| `--bg-card-hover` | `#f0e0b8` | Hover — světlejší pergamen |
| `--accent-crimson` | `#8a1a10` | Temně červená — logo bg, aktivní prvky |
| `--accent-crimson-bright` | `#b02018` | Hover červená |
| `--accent-amber` | `#d08020` | Zlatohnědá — bordury, ikony |
| `--accent-amber-warm` | `#e09030` | Teplá zlatá — svíčkové světlo |
| `--text-on-parchment` | `#2a1a08` | Text na pergamenu — tmavý inkoust |
| `--text-on-parchment-sec` | `#5a3a18` | Sekundární text — sepia |
| `--text-on-dark` | `#d8c090` | Text na tmavém bg (sidebary) |
| `--text-muted` | `#806040` | Vypnuté prvky |
| `--border-wood` | `#4a2e10` | Dřevěná bordura |
| `--border-ink` | `#2a1a0880` | Inkoustová bordura na pergamenu |
| `--border-gold-thin` | `#d0802040` | Tenká zlatá linka na tlačítkách |

---

## Tlačítka (3D efekt)

Dřevěné tlačítko s vyřezávaným efektem. Tmavé dřevo, zlatohnědá bordura, teplý stín jako od svíčky.

```
Tvar:      border-radius: 4px — mírně zaoblené (ručně tesané dřevo)
Normální:  tmavě hnědý gradient (mahagon) + tenká zlatá bordura + spodní stín (teplý)
Hover:     zesvětlení dřeva + translateY(-2px) + crimson left-accent
Active:    translateY(1px) + stín zmenšen
Primární:  temně červený (crimson) gradient — jako knihařský kožený hřbet
Aktivní nav: amber left-border (4px) + teplá zlatá text + svíčkový glow
```

---

## Dekorativní prvky

- **Otevřená kniha:** Hlavní content area je `background-image` otevřené knihy — text "sedí na stránce"
- **Pergamenová textura:** `background-image` nebo CSS noise na kartách — aged paper look
- **Ohnuté rohy stránek:** CSS `::after` efekt na rozích pergamenových karet
- **Svíčkový glow:** Teplý oranžový radial-gradient jako osvětlení ze svíček
- **Brk a kalamář:** Dekorativní v pravém panelu (background-image detail)
- **Kompas/navigace:** Dekorativní ornament v prostředí
- **Knižní spona:** Dekorativní prvek mezi stránkami (středová osa otevřené knihy)
- **Tenká zlatá linka:** Pod nadpisy sekcí — jako podtržení inkoustem

---

## Typografie

- **Logo:** IM Fell English nebo Libre Baskerville Italic — knižní serif cursive
- **Nadpisy:** Lora Bold nebo Playfair Display — klasický serif
- **Navigace:** Serif, sentence case, letter-spacing 1px
- **Text:** Lora nebo Garamond — maximálně čitelný knižní font
- **Admin kurzíva:** Elegant handwriting (`Dancing Script` nebo `Tangerine`) — jako rukopis
- **Barva "Projekt Ikaros" v textu:** Crimson (`--accent-crimson`) — zvýrazněný název

---

## Unikátní UI vlastnosti

- **Obsah na stránce knihy:** `.card` elementy mají pergamenový background místo tmavého
- **Tmavý text na světlém pozadí:** Invertovaná logika uvnitř karet (jako Bílá téma, ale jen na kartách)
- **Dvousloupec = dvě stránky:** Layout může simulovat levou a pravou stránku otevřené knihy
- **Sidebary = dřevěné police:** Tmavé, knihovnické — protiklad světlých stránek

---

## Rozdíly od ostatních témat

| Vlastnost | Příroda | Pergamen |
|-----------|---------|---------|
| Materiál | Dřevo + kameny | Kůže + papír + dřevo |
| Karty | Tmavé dřevo | Světlý pergamen |
| Text na kartách | Světlý | Tmavý (inkoust) |
| Magie | Přírodní (krystaly) | Žádná — čistě analogové |
| Světlo | Sluneční paprsky | Svíčky a lucerny |
| Metafora | Enchanted forest | Stará knihovna |

---

## Poznámky pro implementaci

- Pergamenová textura: CSS `background-image` s noise/grain filtrem nebo SVG feTurbulence
- Otevřená kniha hero: background-image na hlavní content oblasti
- Klíčový problém: text musí být čitelný na světlém pergamenu — použít `--text-on-parchment`
- Logo má tmavě červený čtvercový rámeček okolo ikony — jako knižní kožená deska
- Pravý panel: dekorativní rekvizity (brk, svíčka) jako background-image
- Svíčkový glow: `radial-gradient(ellipse at bottom, #d0801020 0%, transparent 70%)` na panelech
