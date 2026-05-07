# Téma: Arabský svět

**ID:** `arabsky-svet`  
**Referenční obrázek:** [assets/arabsky-svet.png](assets/arabsky-svet.png)

---

## Atmosféra

Arabská noc pod srpkem měsíce. Modrá mešita s minarety září na purpurovém nebi, zlaté světlo luceren osvětluje ulice. Vše je zahaleno do bohatých burgundy tónů a zlatých arabesk. Perzský koberec na podlaze, dýmka vpravo, orientální vázy. Pocit tisíce a jedné noci — tajemství, luxusu, magie Orientu a bezčasové krásy islámské kultury.

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#100608` | Hlavní pozadí — tmavá burgundy čerň |
| `--bg-secondary` | `#1a0810` | Sidebary — hluboká burgundy |
| `--bg-card` | `#082028` | Karty — hluboká tyrkysová/teal (!) |
| `--bg-card-hover` | `#0c2830` | Hover stav karet |
| `--accent-gold` | `#c8900a` | Primární zlatá — arabesky, bordury, ikony |
| `--accent-gold-bright` | `#e8b020` | Hover zlatá, světelný glow |
| `--accent-gold-ornate` | `#f0c840` | Nejsvětlejší zlatá — ornamentální detaily |
| `--accent-teal` | `#208878` | Tyrkysová — "Projekt Ikaros" text, admin |
| `--accent-teal-bright` | `#30b090` | Světlá tyrkys, hover |
| `--accent-burgundy` | `#6a0820` | Burgundy — sametové prvky, záclony |
| `--accent-purple` | `#4a1860` | Fialová — noční nebe, magie |
| `--text-primary` | `#e8d0a0` | Hlavní text — teplá zlatavá bílá |
| `--text-secondary` | `#806040` | Sekundární text |
| `--text-muted` | `#402820` | Vypnuté prvky |
| `--border-gold` | `#c8900a60` | Zlatá bordura (průhledná) |
| `--border-gold-strong` | `#c8900a` | Silná zlatá bordura — arabesque rám |
| `--border-burgundy` | `#6a082040` | Burgundy bordura |

> **Unikátní barevný kontrast:** Sidebary jsou burgundy tmavé, karty jsou hluboce tyrkysové — dva velmi odlišné tmavé tóny.

---

## Tlačítka (3D efekt)

Zlatem lemované orientální tlačítko. Bohaté, sametové, luxusní.

```
Tvar:      border-radius: 6px — mírně zaoblené (orientální)
           Volitelně: špičatý horní oblouk (Islamic pointed arch) na větších panelech
Normální:  burgundy gradient + zlatá arabesque bordura + teplý stín
Hover:     zlatý glow (0 0 12px #c8900a) + translateY(-2px) + bordura zesvětlí
Active:    translateY(1px) — sametový dopad
Primární:  tmavý burgundy gradient + silná zlatá bordura + arabesque ornament
Aktivní nav: zlatý left-border (3px) + zlatý text + miniaturní arabesque dekor vpravo
```

---

## Dekorativní prvky

- **Islámský oblouk (pointed arch):** Horní okraje panelů mají špičatý arabský oblouk — CSS `clip-path` nebo border-radius kombinace
- **Arabesque vzory:** Zlaté geometrické/florální islámské vzory jako `border-image` na panelech — nejkomplexnější ornamentika v celé kolekci
- **Zlatá lucerna:** Ikona pro "Novinky" sekci + visící lucerny v background scéně
- **Dýmka (hookah/narghile):** Dekorativní vpravo dole — background-image detail
- **Orientální vázy:** Zlaté vázy dole vpravo
- **Perzský koberec:** Složitý vzorovaný koberec dole v scéně (background-image)
- **Závěsy/záclony:** Burgundy sametové záclony po stranách (background overlay)
- **Srpek měsíce:** V background nebi (background-image)
- **Arabesque oddělovače:** Sekce odděleny ornamentálními zlatými linkami `⟨◆ →→ ←← ◆⟩`
- **Hvězdné nebe:** Fialovo-purpurová obloha s hvězdami (background gradient + stars)

---

## Typografie

- **Logo:** Cinzel Decorative nebo Scheherazade (arabsky inspirovaný serif) — zlaté
- **Nadpisy:** Lora Bold nebo Playfair Display — elegantní, luxusní
- **Navigace:** Sentence case nebo uppercase, letter-spacing 1px, serif
- **Text:** Lora — čitelný, teplý
- **Admin kurzíva:** Tyrkysová italic + arabesque ornament po stranách (`✦ →→ text ←← ✦`)
- **"Projekt Ikaros" v textu:** Tyrkysová (`--accent-teal-bright`)

---

## Rozdíly od ostatních témat

| Vlastnost | Zlatý standard | Hospoda | Arabský svět |
|-----------|---------------|---------|-------------|
| Pozadí sidebary | Čistá čerň | Tmavé dřevo | Hluboká burgundy |
| Karty | Tmavé | Pergamen světlý | Hluboká tyrkysová |
| Ornamentika | Zlaté rohové dekor | Kovové nýty | Arabesque komplexní |
| Oblouky | Rovné | Rovné | Islamický pointed arch |
| Sekundární | — | Amber | Tyrkysová |
| Rekvizity | Hvězdná mapa | D20, pivo | Dýmka, koberec, vázy |

---

## Poznámky pro implementaci

- Arabesque border: SVG `<pattern>` s islamickým geometrickým vzorem — nejednotlivé rohové dekor ale **celý border jako pattern**
- Pointed arch: CSS `clip-path: polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)` na panel hlavičkách
- Logo kruh: zlatý arabesque ornament jako border ring — nejkomplexnější verze loga v kolekci
- Tyrkysová karta na tmavém burgundy sidebaru: zajistit dostatečný kontrast pro text
- Dýmka SVG: absolutně pozicována vpravo dole, `pointer-events: none`, `opacity: 0.8`
- Hvězdný ambient: CSS `radial-gradient` + malé bílé tečky (`::before` scattered)
- Záclony: `::before`/`::after` na body elementu — burgundy gradient zleva a zprava
