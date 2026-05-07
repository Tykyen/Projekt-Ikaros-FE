# Téma: Bílá

**ID:** `bila`  
**Referenční obrázek:** [assets/bila.png](assets/bila.png)

---

## Atmosféra

Nebeská čistota. Bílé mramorové oblouky s flowing závěsy, za nimi pohled na stříbrné věže v denním světle, modré nebe, zelená příroda. Andělský, éterický pocit. Vše je světlé, vzdušné a čisté. Protiklad všech tmavých témat — žádná drama, jen krása a klid.

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#f5f2ed` | Hlavní pozadí — teplá krémová bílá |
| `--bg-secondary` | `#ede8e0` | Sidebary, panely |
| `--bg-card` | `#faf8f5` | Karty, modaly — čistá bílá |
| `--bg-card-hover` | `#f0ece5` | Hover stav karet |
| `--accent-gold` | `#c8a96e` | Jemná zlatá — bordury, oddělovače |
| `--accent-gold-dim` | `#e0d0b0` | Velmi jemná zlatá — rohy, rámečky |
| `--accent-blue` | `#4a80b0` | Modrá — aktivní prvky, linky, "Projekt Ikaros" text |
| `--accent-blue-soft` | `#6a9fc8` | Hover modrá |
| `--accent-crystal` | `#a8c8e8` | Křišťálová světle modrá — rohové diamanty |
| `--text-primary` | `#2a2420` | Hlavní text — tmavý pro kontrast |
| `--text-secondary` | `#6a5a50` | Sekundární text — teplá šedá |
| `--text-muted` | `#a09080` | Vypnuté prvky |
| `--border-soft` | `#d8cfc0` | Jemné bordury — hlavní |
| `--border-gold` | `#c8a96e60` | Zlaté bordury (průhledné) |
| `--border-subtle` | `#ede8e0` | Velmi jemné oddělovače |

> **Jediné světlé téma** — vše je invertované oproti tmavým tématům.

---

## Tlačítka (3D efekt)

Jemný 3D efekt — bílé/krémové tlačítko se stínem dole, bez agresivního glowu. Elegantní a subtilní.

```
Normální:  bílý/krémový gradient + jemná zlatá bordura + světlý box-shadow dole
Hover:     lehké ztmavení bg + translateY(-2px) + bordura zlatší
Active:    translateY(1px) + shadow zmenšen
Primární:  světle modrý gradient (--accent-blue-soft → --accent-blue)
Aktivní nav: levý border modrý (3px) + modrý text + velmi lehký modrý bg
```

---

## Dekorativní prvky

- **Rohové diamanty:** Malé křišťálové modré diamanty v rozích karet (`◆` nebo SVG)
- **Rámeček karty:** Picture-frame styl — tenká zlatá dvojitá bordura s rohovými ozdobami
- **Oddělovače:** Tenká zlatá horizontální linka pod nadpisy sekcí
- **Logo:** Bílá holubice/anděl na světlém pozadí — outline verze loga
- **Ikonky v nav:** Elegantní outline, teplá šedá — pero pro Články, domeček pro Úvodník
- **Quill ikona:** Sekcí "Novinky" — brk/pero místo tech ikonky
- **Floral background:** Bílé mramorové sloupy, flowing závěsy, příroda (background-image)

---

## Typografie

- **Logo:** Playfair Display nebo IM Fell English — elegantní serif cursive, tmavší
- **Nadpisy:** Lora nebo Cormorant Garamond — knižní serif
- **Navigace:** Sentence case (ne uppercase), letter-spacing 1px, jemný serif
- **Text:** Georgia nebo Lora — čitelný knižní styl
- **Admin kurzíva:** Elegant cursive, modrá barva — jako rukopis

---

## Rozdíly od ostatních témat

| Vlastnost | Tmavá témata | Bílá |
|-----------|-------------|------|
| Pozadí | Tmavé | Světlé, krémové |
| Text | Světlý | Tmavý |
| Akcenty | Zlatá/cyan/neon | Jemná zlatá + soft modrá |
| Glow | Výrazný | Žádný / velmi jemný stín |
| Atmosféra | Tajemná / dramatická | Čistá, éterická, klidná |
| Dekor | Ornamentální / tech | Křišťál + picture frame |

---

## Poznámky pro implementaci

- Invertovaná barevná logika — pozadí světlé, text tmavý (na rozdíl od všech ostatních)
- Žádný `box-shadow` s barevným glow — pouze `rgba(0,0,0,0.1)` stíny
- `filter: drop-shadow()` na křišťálových rohových ozdobách (subtilní)
- Logo Ikarose — potřebuje tmavou variantu (tmavá holubice na světlém bg)
- Background-image: bílá architektura, příroda, denní světlo
- Pozor na kontrast — text musí být dostatečně tmavý (WCAG AA)
