# Téma: Zlatý standard

**ID:** `zlaty-standard`  
**Referenční obrázek:** [assets/zlaty-standard.png](assets/zlaty-standard.png)

---

## Atmosféra

Absolutní luxus a vznešenost. Černý vesmír jako plátno, zlaté ornamenty jako rám obrazu. Velká spirální galaxie, planety, oslňující věž — vše obklopeno zlatem. Pocit královského řádu, exkluzivity a moci. Žádné kompromisy — vše je zlaté, vše je precizní. Toto je prémiová úroveň.

Klíčový rozdíl od Modrého nebe: kde Modré nebe je **tajemné a vznešené**, Zlatý standard je **okázalý a dominantní**.

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#050508` | Hlavní pozadí — téměř čistá čerň |
| `--bg-secondary` | `#0a0a0f` | Sidebary, panely |
| `--bg-card` | `#0c0c12` | Karty, modaly |
| `--bg-card-hover` | `#121220` | Hover stav karet |
| `--accent-gold` | `#d4a017` | Primární zlatá — sytá, teplá |
| `--accent-gold-bright` | `#f0c040` | Glow, hover, aktivní prvky |
| `--accent-gold-dim` | `#8a6510` | Tlumená zlatá, sekundární bordury |
| `--text-primary` | `#f0e8d0` | Hlavní text — teplá bílá |
| `--text-secondary` | `#907840` | Sekundární text — zlatavá |
| `--text-muted` | `#504030` | Vypnuté prvky |
| `--border-gold` | `#d4a01760` | Zlaté bordury (průhledné) |
| `--border-gold-strong` | `#d4a017` | Silné zlaté bordury — výrazné |
| `--border-subtle` | `#1a1510` | Jemné oddělovače |

> **Bez modrých akcentů** — čistě černozlatá paleta, žádná `--accent-blue`.

---

## Tlačítka (3D efekt)

Silnější 3D efekt než Modré nebe. Zlatá bordura je tlustší, vnitřní stín výraznější, glow při hover intenzivnější.

```
Normální:  čistě černý gradient + silná zlatá bordura + zlatý box-shadow dole
Hover:     zlatý glow roste (0 0 12px #d4a017) + translateY(-2px)
Active:    translateY(1px) + glow zesláblý
Primární:  zlatý gradient uvnitř tlačítka (ne jen bordura)
Aktivní nav: zlatý left-border (4px) + zlatý text + subtle zlatý bg
```

---

## Dekorativní prvky

- **Rohové ornamenty:** Výraznější než Modré nebe — větší, více detailů, zlaté svítí
- **Diamantové oddělovače:** `◆` zlaté, větší, top/bottom každého panelu
- **Astronomický ornament:** Zlatý orrery/celestiální diagram (pravý panel) — unikátní pro toto téma
- **Hvězdné pozadí:** Hustší než Modré nebe, více zářících bodů
- **Galaxy hero:** Spirální galaxie viditelná v pozadí střední oblasti
- **Zlaté linky:** Tenké zlaté horizontal linky pod nadpisy sekcí

---

## Typografie

- **Logo:** Cinzel Decorative — stejný font, ale zlatý (#d4a017) místo bílého
- **Nadpisy:** Cinzel — silnější weight než Modré nebe
- **Navigace:** Uppercase, letter-spacing 3px — více vzdušné
- **Text:** Lato — teplá bílá `#f0e8d0`
- **Kurzíva (admin message):** Zlatá kurzíva — `font-style: italic`, `color: --accent-gold`

---

## Rozdíly od Modrého nebe (přehled)

| Vlastnost | Modré nebe | Zlatý standard |
|-----------|-----------|----------------|
| Pozadí | Tmavá námořní modř | Čistá čerň |
| Akcent 2 | Modrá (#4a9eca) | Žádný — pouze zlatá |
| Bordury | Střední tloušťka | Silné, výrazné |
| Ornament | Standardní rohy | Rohy + orrery diagram |
| Pocit | Tajemný, vznešený | Okázalý, královský |
| Tlačítka | Zlatá bordura | Zlatý gradient uvnitř |

---

## Poznámky pro implementaci

- Pravý panel má unikátní dekoraci — astronomický kruh (SVG nebo background-image)
- Zlatý glow na elementech je výraznější — `text-shadow` i `box-shadow` s `#d4a017`
- Header tlačítka mají silnější zlatou borduru než v Modrém nebi
- Logo ikaros je zlatý (ne bílý) — `filter: sepia(1) saturate(3) hue-rotate(10deg)` nebo samostatná varianta
