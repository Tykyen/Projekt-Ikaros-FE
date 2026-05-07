# Téma: Temná červeň

**ID:** `temna-cerven`  
**Referenční obrázek:** [assets/temna-cerven.png](assets/temna-cerven.png)

---

## Atmosféra

Gotická katedrála při svitu krvavých svící. Obří kamenné oblouky, rozetové okno, netopýři kroužící ve výšinách. Krev — nebo jen světlo svíček? Projekt Ikaros jako upíří šlechta — elegantní, vznešená, smrtelně nebezpečná. Fleur-de-lis jako erb rodu. Žádná jiná barva než černá a krev.

**Nejmonochromatičtější téma: absolutně čistě černá + krvavě červená. Nic jiného.**

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#080404` | Hlavní pozadí — krvavá čerň |
| `--bg-secondary` | `#100608` | Sidebary — tmavě krvavá |
| `--bg-card` | `#140808` | Karty — nejtmavší |
| `--bg-card-hover` | `#1c0c0c` | Hover stav karet |
| `--accent-blood` | `#8a0010` | Primární krev — bordury, ikony |
| `--accent-blood-bright` | `#c00018` | Světlá krev — hover, "Projekt Ikaros" text |
| `--accent-blood-glow` | `#e00020` | Krevní glow — Ikaros bird, aktivní prvky |
| `--accent-blood-dim` | `#400008` | Tmavá krev — subtilní bordury |
| `--accent-crimson-mid` | `#6a0010` | Střední červená — section headers |
| `--text-primary` | `#d0a0a0` | Hlavní text — bledě načervenalá |
| `--text-secondary` | `#704040` | Sekundární text — vybledlá krev |
| `--text-muted` | `#301818` | Vypnuté prvky |
| `--border-blood` | `#8a001040` | Krevní bordura (průhledná) |
| `--border-blood-strong` | `#8a0010` | Silná krevní bordura |
| `--border-gothic` | `#200808` | Subtilní gotická bordura |

> **Nulová chromatická diverzita:** Jediné barvy jsou černá a odstíny červené. Žádná zlatá, žádná modrá, žádná zelená.

---

## Tlačítka (3D efekt)

Gotická kamenná deska s krevní bordurou. Elegantní a smrtelná.

```
Tvar:      border-radius: 3px — téměř pravoúhlé (gotický kámen)
           Jemné gotické rohové ornamenty (::before/::after)
Normální:  tmavý gradient + krevní bordura + temný stín
Hover:     krevní glow (0 0 12px #8a0010) + translateY(-2px) + bordura zesvětlí
Active:    translateY(2px) — těžký dopad
Primární:  tmavě krevní gradient + silná krevní bordura
Aktivní nav: krevní bg + světle červený text + ⚜ ikona svítí
```

---

## Dekorativní prvky

- **⚜ Fleur-de-lis:** Nahrazuje VŠECHNY navigační ikony — jedna ikona pro vše (upíří erb)
- **Krvavý Ikaros:** Logo bird svítí krvavě červeně — `filter: drop-shadow(0 0 8px #c00018)`
- **Netopýři:** SVG netopýři v rozích panelů a v background scéně — dekorativní
- **Gotické rohové ornamenty:** Subtilní gotické florální rohy na kartách (ne zlaté — temně červené)
- **Krevní kapky:** CSS `::after` na spodních okrajích některých panelů — kapající krev
- **Gotická katedrála:** Background-image — obří gotické oblouky, rozetové okno, červené světlo
- **Rozetové okno:** Viditelné v background scéně — krvavě červené vitrážové okno
- **Svíčky:** Červeně tónované svíčky po stranách v background scéně
- **Logo kruh:** Tmavě krevní kruh s gotickým ornamentálním prstencem — minimalista

---

## Typografie

- **Logo:** MedievalSharp nebo Cinzel — gotický, vznešený serif
- **Nadpisy:** IM Fell English nebo Cinzel — historický, temný
- **Navigace:** Uppercase, letter-spacing 2px, serif — jako erb rodu
- **Text:** Lora nebo EB Garamond — čitelný, historický
- **Admin kurzíva:** Krevně červená italic — jako psaní krví
- **"Projekt Ikaros" v textu:** Bright blood (`--accent-blood-bright`)

---

## Rozdíly od Nemrtvých a Vesmírné bitvy

| Vlastnost | Nemrtví | Vesmírná bitva | Temná červeň |
|-----------|---------|----------------|-------------|
| Červená | Není (zelená) | Neonová urgence | Krevní elegance |
| Styl | Death metal krypta | Vojenská krize | Upíří šlechta |
| Ikony nav | Lebky | Standardní | ⚜ Fleur-de-lis |
| Prostředí | Krypta s kostlivci | Vesmírná bitva | Gotická katedrála |
| Dekor | Řetězy, lebky | Alert panel | Netopýři, kapky krve |
| Pocit | Hrůza, rozklad | Urgence, panika | Temná elegance |
| Saturace | Střední | Střední | **Nulová** (jen červená) |

---

## Poznámky pro implementaci

- ⚜ Fleur-de-lis: SVG ikona nahrazuje VŠECHNY `<Icon />` komponenty v navigaci pro toto téma
- Krevní kapky: CSS `clip-path` nebo SVG drip pattern na spodním okraji vybraných panelů
- Netopýři: SVG `<Bat />` komponenta, absolutně pozicovaná, `pointer-events: none`
- Krvavý Ikaros: CSS `filter: drop-shadow(0 0 6px #c00018) sepia(1) hue-rotate(300deg)`
- Monochromacie: při code review ověřit že žádná non-red/non-black barva neunikla
- Gothic ornament rohy: CSS `::before`/`::after` — SVG gotický florální tvar, tmavě červená
- Background: gotická katedrála s červeným ambientem — `background-blend-mode: multiply` pro ztmavení
- Kapající krev animace: `@keyframes drip { 0% { height: 0 } 100% { height: 20px } }` na thin pseudo-elementech
