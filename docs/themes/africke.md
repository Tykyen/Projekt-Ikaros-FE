# Téma: Africké

**ID:** `africke`  
**Referenční obrázek:** [assets/africke.png](assets/africke.png)

---

## Atmosféra

Africká savana při zlatém západu slunce. Akácie, kamenné monolity se spirálovými vzory, hliněné chýše. Kmenová maska střeží sidebar, barevný štít chrání pravý panel, djembe buben a táborový oheň dole zahřívají scénu. Pocit pradávné moudrosti, kmenového společenství a nekonečné africké krajiny.

Klíčový rozdíl od Indiánského: **Indiáni = frontier hybridní, Afrika = čistě původní, kmenová, pradávná.**

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#0e0804` | Hlavní pozadí — tmavý eben |
| `--bg-secondary` | `#160c06` | Sidebary — tmavý mahagon |
| `--bg-card` | `#1e1208` | Karty — tmavé dřevo (tmavší než jiné témata) |
| `--bg-card-hover` | `#261808` | Hover stav karet |
| `--accent-amber` | `#c8880a` | Primární zlatá savana — ikony, bordury, text |
| `--accent-amber-bright` | `#e8a820` | Hover zlatá, západ slunce |
| `--accent-terracotta` | `#c04818` | Kmenová červeň — štít, dekor, aktivní |
| `--accent-terracotta-bright` | `#e05820` | Světlá terracotta |
| `--accent-ochre` | `#a06010` | Okrová hlína — sekundární bordury |
| `--accent-fire` | `#e06010` | Táborový oheň — ambient glow |
| `--text-primary` | `#d4a060` | Hlavní text — teplá zlatavá |
| `--text-secondary` | `#806030` | Sekundární text — zemitá |
| `--text-muted` | `#403018` | Vypnuté prvky |
| `--border-ebony` | `#2a1808` | Ebenová bordura |
| `--border-amber` | `#c8880a50` | Zlatá bordura (průhledná) |
| `--border-geometric` | viz dekor | Geometrický vzor — viz dekorativní prvky |

---

## Tlačítka (3D efekt)

Vyřezávané ebenové tlačítko s africkým geometrickým vzorem. Těžké, starožitné, přírodní.

```
Tvar:      border-radius: 3px — téměř pravoúhlé (tesané dřevo)
Normální:  tmavě ebenový gradient + zlatá amber bordura + teplý zemitý stín
Hover:     amber/fire glow + translateY(-2px) + bordura zesvětlí
Active:    translateY(2px) — dopad bubnové paličky
Primární:  terracotta gradient + zlatá bordura
Aktivní nav: amber left-border (4px) + zlatý text + geometrický dekor vpravo
```

---

## Dekorativní prvky

- **Kmenová maska:** Vysoká úzká dřevěná maska na levém sidebaru — SVG nebo background-image
- **Africký štít:** Červenohnědý štít s geometrickými vzory na pravém panelu — SVG
- **Djembe buben:** Africký buben dole vlevo — background-image detail
- **Táborový oheň:** Animované plameny dole uprostřed (`@keyframes flicker`) — CSS nebo SVG
- **Africké geometrické vzory:** Panelové bordury — trojúhelníky, cikcak, spirály jako `border-image` SVG pattern
- **Kamenný monolit:** V background scéně — spirálové vzory (background-image)
- **Hliněná nádoba:** Dekorativní dole vpravo (background-image)
- **Bílé peří:** Dekorativní detail na pravé straně
- **Oštěp:** Tenký oštěp na pravém panelu — background-image detail
- **Korálky:** Barevné africké korálky — dekorativní strings na sidebaru (barevnější než u Indiánů)
- **Maska ikona:** "TYKY" v headeru má ikonu africké masky — speciální varianta

---

## Typografie

- **Logo:** Cinzel nebo Trajan Pro — majestátní, nadčasový
- **Nadpisy:** IM Fell English nebo Lora Bold — teplý historický serif
- **Navigace:** Uppercase, letter-spacing 2px, serif — jako vytesané do kamene
- **Text:** Lora — čitelný, přírodní
- **Admin kurzíva:** Zlatá italic cursive — jako namalované na kůži
- **"Projekt Ikaros" v textu:** Amber (`--accent-amber-bright`)

---

## Rozdíly od Indiánského

| Vlastnost | Indiánské | Africké |
|-----------|-----------|---------|
| Prostředí | Frontier západ | Africká savana |
| Dekor 1 | Lapač snů | Kmenová maska |
| Dekor 2 | Playing cards | Djembe buben |
| Sekundární akcent | Tyrkysová | Terracotta |
| Geometrie | Indiánské korálky | Africké vzory |
| Karty | Světlý pergamen/kůže | Tmavé dřevo |
| Oheň | Torch/lucerna | Táborový oheň |
| Pocit | Hybridní frontier | Čistě kmenový |

---

## Poznámky pro implementaci

- Africký geometrický pattern: SVG `<pattern>` — opakující se trojúhelníky + cikcak v barvách `#c8880a`, `#c04818`, `#a06010`
- Táborový oheň: SVG `<fire />` komponenta s `@keyframes flicker` — absolutně pozicovaná dole
- Maska: SVG nebo PNG, absolutně pozicovaná na levém sidebaru, `pointer-events: none`
- Karty jsou tmavé (ne pergamen) — text musí být světlý `--text-primary`
- Logo kruh: ebenový tmavý kruh s africkým geometrickým vzorem jako border ornament
- Fire ambient: `radial-gradient(ellipse at bottom, #e0601030 0%, transparent 60%)` — teplý glow zdola
- Maska ikona pro "TYKY": speciální SVG ikonka nahrazující standardní user ikonu v headeru
