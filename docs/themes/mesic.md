# Téma: Měsíc

**ID:** `mesic`  
**Referenční obrázek:** [assets/mesic.png](assets/mesic.png)

---

## Atmosféra

Půlnoční pohádka pod úplňkem. Obří stříbrný měsíc osvětluje gotické věže, kaskády vodopádů, modré noční květiny a kamenný most nad zrcadlovým jezerem. Lucerny vrhají teplé záblesky do jinak chladného světla. Projekt Ikaros jako měsíční království — éterický, snivý, romantický. Žádné zlato, žádná agrese — jen stříbro a noc.

**Nejéteričtější téma kolekce — glassmorphism panely, stříbrná filigránová ornamentika, hvězdný třpyt.**

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#06091a` | Hlavní pozadí — půlnoční čerň |
| `--bg-secondary` | `#0a1028` | Sidebary — tmavá noc |
| `--bg-card` | `#0e163a` | Karty — glassmorphism základ |
| `--bg-card-hover` | `#121e48` | Hover stav karet |
| `--accent-silver` | `#b8cce8` | Stříbrná — bordury, ikony, dekor |
| `--accent-silver-bright` | `#d8ecff` | Světlé stříbro — hover, hvězdné body |
| `--accent-silver-dim` | `#405880` | Tlumené stříbro — subtilní bordury |
| `--accent-moon` | `#6090e0` | Měsíční modrá — "Projekt Ikaros" text, aktivní |
| `--accent-moon-glow` | `#80b0ff` | Měsíční záře — hover glow |
| `--accent-moon-dim` | `#203060` | Tmavá měsíční — dim bordury |
| `--text-primary` | `#e8f0ff` | Hlavní text — chladná bílá |
| `--text-secondary` | `#6880b0` | Sekundární text — tlumená modrá |
| `--text-muted` | `#1e2a48` | Vypnuté prvky |
| `--border-silver` | `#b8cce850` | Stříbrná bordura (průhledná) |
| `--border-silver-strong` | `#b8cce8` | Silná stříbrná bordura — panely |
| `--border-moon` | `#6090e030` | Měsíční bordura (velmi průhledná) |

> **Žádné zlato:** Čistě stříbrná + měsíční modrá. Žádná zlatá, žádná magenta, žádná červená.

---

## Tlačítka (3D efekt)

Éterická stříbrná destička — lehká jako měsíční světlo.

```
Tvar:      border-radius: 6px — jemně zaoblené
           ✦ Hvězdné body v rozích (::before/::after — stříbrný, 6px)
Normální:  tmavý navy gradient + stříbrná filigránová bordura + subtilní stín
Hover:     měsíční glow (0 0 14px #6090e0) + translateY(-2px) + bordura zesvětlí
Active:    translateY(2px) — tichý měsíční dopad
Primární:  o tón světlejší navy gradient + silnější stříbrná bordura
Aktivní nav: glassmorphism bg (backdrop-blur) + bílý/stříbrný text + ✦ vlevo
```

---

## Dekorativní prvky

- **Stříbrná filigránová ornamentika:** Jemné rohy na všech panelech — tenké stříbrné linie tvořící florální/hvězdné vzory (ne těžká arabesque — vzdušná, delikátní)
- **✦ Hvězdné body:** Malé čtyřcípé hvězdy (`✦`) v rozích a jako oddělovače sekcí — stříbrné
- **Glassmorphism panely:** `backdrop-filter: blur(10px); background: rgba(10, 16, 40, 0.85)` — panely jsou poloprůhledné, skrz ně prosvítá background
- **Obří měsíc:** Dominantní bílý úplněk v center-top background scény — `filter: blur(0.5px) brightness(1.2)`
- **Hvězdné nebe:** Jemné bílé tečky po celém bg — `@keyframes twinkle { 0%, 100% { opacity: 0.6 } 50% { opacity: 1 } }` s různými delays
- **Modré noční květiny:** Modré zvonky/lilie podél spodního okraje background scény
- **Lucerny:** Teplé světlé body v rozích scény (background-image detail) — kontrast k chladnému měsíčnímu světlu
- **Vodopády:** Po stranách background scény — subtilní
- **Logo kruh:** Tmavě modrý kruh s stříbrným filigránovým prstencem, hvězdné body v kardinálních směrech
- **Logo bird:** Bílý Ikaros s měsíčním glow — `filter: drop-shadow(0 0 8px #d8ecff)`
- **Odlesk vodní hladiny:** CSS `::after` overlay se světlým gradientem ze spodku — odlesk měsíce na vodě

---

## Typografie

- **Logo:** Romantická fantasy kurzíva — Great Vibes, Tangerine nebo Cinzel — plynulá, pohádková
- **"Projekt Ikaros" v logu:** Stříbrno-bílá kurzíva — flowing script
- **Nadpisy:** Cinzel nebo Playfair Display — elegantní, ušlechtilý serif
- **Navigace:** Uppercase, letter-spacing 2px, light serif nebo sans-serif — jako lunární nápisy
- **Text:** Lora nebo EB Garamond — čitelný, poetický
- **Admin kurzíva:** Stříbrno-modrá italic — jako psaní měsíčním inkoustem
- **"Projekt Ikaros" v textu:** Měsíční modrá (`--accent-moon`)

---

## Rozdíly od ostatních témat

| Vlastnost | Modré nebe | Magie | Měsíc |
|-----------|-----------|-------|-------|
| Zlato | Dominantní | Ornament | **Žádné** |
| Hlavní barva | Navy + gold | Fialová + gold | Stříbrná + navy |
| Ornament | Zlaté florální rohy | ◆ Diamanty | ✦ Filigránové hvězdy |
| Panely | Solid tmavé | Solid tmavé | **Glassmorphism** |
| Atmosféra | Fantasy hrad (den?) | Arcane věž | Pohádková noc |
| Unikátní | Modré nebe/mraky | Arcane kruh, krystal | Obří měsíc, hvězdný třpyt |
| Pocit | Vznešený, heroický | Záhadný, arcane | Éterický, romantický |

---

## Poznámky pro implementaci

- Glassmorphism: `backdrop-filter: blur(10px) saturate(1.2); background: rgba(10, 16, 40, 0.82); border: 1px solid rgba(184, 204, 232, 0.3)`
- Hvězdný třpyt: CSS `@keyframes twinkle` na pseudo-elementech — `box-shadow: 2px 3px 0 #fff, 8px 12px 0 #b8cce8...` — stovky různě umístěných teček
- ✦ hvězdný bod: Unicode `✦` nebo SVG — `color: var(--accent-silver-bright); font-size: 10px`
- Filigránový roh: SVG `<path>` — tenká stříbrná linie se závojem florálního vzoru, `stroke: #b8cce8; stroke-width: 0.8; fill: none`
- Měsíční záře na bg: `radial-gradient(circle at 50% 15%, rgba(120, 160, 240, 0.15) 0%, transparent 60%)` — jemná záře kolem měsíce
- Vodní odlesk: `::after` na body — `background: linear-gradient(to top, rgba(96, 144, 224, 0.08) 0%, transparent 30%)`
- Logo script: Google Fonts "Great Vibes" nebo "Dancing Script" — načíst z CDN
- Pozor na glassmorphism výkon: testovat na mid-range zařízeních, případně `@media (prefers-reduced-motion)` fallback bez blur
