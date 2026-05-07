# Téma: Modré nebe

**ID:** `modre-nebe`  
**Referenční obrázek:** [assets/modre-nebe.png](assets/modre-nebe.png)

---

## Atmosféra

Epická fantasy noc. Temná obloha plná hvězd, vzdálená svítící věž/hrad uprostřed kosmické mlhoviny. Pocit vznešenosti, tajemství a dobrodružství. Zlaté ornamentální detaily jako symbol kvality a řemesla. Svět je velký, tajemný — a ty jsi jeho součástí.

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#070f1e` | Hlavní pozadí stránky |
| `--bg-secondary` | `#0d1a2e` | Sidebary, panely |
| `--bg-card` | `#0f1f38` | Karty, modaly |
| `--bg-card-hover` | `#152540` | Hover stav karet |
| `--accent-gold` | `#c9a84c` | Zlaté akcenty, bordury, ikony |
| `--accent-gold-light` | `#e8c96e` | Hover zlatých prvků |
| `--accent-blue` | `#4a9eca` | Aktivní prvky, linky, info |
| `--accent-blue-glow` | `#6ab8e8` | Glow efekty, aktivní stav |
| `--text-primary` | `#e8e8f0` | Hlavní text |
| `--text-secondary` | `#8899aa` | Sekundární text, popisky |
| `--text-muted` | `#4a5a6a` | Vypnuté prvky |
| `--border-gold` | `#c9a84c40` | Zlaté bordury (průhledné) |
| `--border-subtle` | `#1e3050` | Jemné oddělovače |

---

## Tlačítka (3D efekt)

Tlačítka mají výrazný 3D look — tmavý panel s zlatou bordurou, vnitřní světlo nahoře, stín dole. Při hover se zvedají (translateY), při click klesají.

```
Normální:  tmavý gradient + zlatá bordura + box-shadow (spodní zlatý stín)
Hover:     zesvětlení + translateY(-2px) + silnější glow
Active:    translateY(1px) + slabší stín (efekt mačkání)
Primární:  zlatá bordura + modrý glow uvnitř
Aktivní nav: modrý gradient zleva doprava + ikona svítí modře
```

---

## Dekorativní prvky

- Rohové ornamentální rohy na kartách a panelech (zlatá SVG/CSS)
- Diamantový oddělovač (`◆`) mezi sekcemi
- Jemné hvězdné pozadí (CSS radial-gradient nebo SVG noise)
- Kosmická mlhovina v hero oblasti (background-image)
- Tenká zlatá linka pod headerem

---

## Typografie

- **Logo:** Serif cursive (např. Cinzel Decorative nebo Playfair Display)
- **Nadpisy:** Cinzel nebo IM Fell English — epický fantasy feeling
- **Navigace:** Uppercase, letter-spacing 2px, sans-serif
- **Text:** Lato nebo Inter — čitelný, moderní

---

## Ikony

Outlined ikony v sidebaru, zlatá barva při aktivním stavu, šedá při neaktivním.

---

## Poznámky pro implementaci

- Background stránky: tmavý gradient + subtle noise texture
- Hero oblast (střed): prostor pro velký background obrázek (castle/cosmic)
- Sidebary: `--bg-secondary` s zlatými bordurou na vnitřní hraně
- Karty: průhledný tmavý background s zlatou bordurou a rohovými ornamentyToto je **výchozí téma** platformy (zobrazí se před přihlášením a jako fallback).
