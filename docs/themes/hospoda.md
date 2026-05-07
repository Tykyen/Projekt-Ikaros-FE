# Téma: Hospoda

**ID:** `hospoda`  
**Referenční obrázek:** [assets/hospoda.png](assets/hospoda.png)

---

## Atmosféra

Teplá středověká krčma plná dobrodružství. Doutnající krb, dřevěné trámy, svíčky, soudky piva, dobrodruzi u stolu. Projekt Ikaros jako cechová nástěnka — guild banner visí hrdě, výhlášky na pergamenu, mapa na stole. Pocit bezpečí, kamarádství a nového dobrodružství za rohem. Tady se plánují výpravy a sdílejí příběhy.

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#120a04` | Hlavní pozadí — tmavé dřevo |
| `--bg-secondary` | `#1a1008` | Sidebary — tmavší dřevěné desky |
| `--bg-card` | `#e8d4a0` | Karty — starý pergamen/nástěnka |
| `--bg-card-dark` | `#c4aa78` | Tmavší pergamen — okraje |
| `--bg-card-hover` | `#f0e0b0` | Hover — světlejší pergamen |
| `--accent-crimson` | `#8a1520` | Cechovní burgundy — banner, primární tlačítka |
| `--accent-crimson-bright` | `#b01828` | Hover červená |
| `--accent-amber` | `#c8800a` | Zlatohnědá — svíčky, bordury, ikony |
| `--accent-amber-warm` | `#e09820` | Teplá zlatá — hover, svíčkové světlo |
| `--accent-copper` | `#8a5020` | Měď — kovové prvky, nýty |
| `--text-on-parchment` | `#2a1808` | Text na pergamenu — tmavý inkoust |
| `--text-on-parchment-sec` | `#604030` | Sekundární text — sépiový |
| `--text-on-dark` | `#d4a060` | Text na tmavém dřevu |
| `--text-muted` | `#604020` | Vypnuté prvky |
| `--border-wood` | `#3a1e08` | Dřevěná bordura |
| `--border-copper` | `#6a3810` | Měděná bordura (kovové nýty) |
| `--border-parchment` | `#a07840` | Okraj pergamenu |

---

## Unikátní UI prvky (jen toto téma)

### Cechovní banner (místo logo image)
- Purpurový/crimson visící banner s zlatou třásní a siluetou Ikarose
- SVG komponenta — přepis standardního logo image
- Efekt mírného houpe (`@keyframes sway`)

### Tavern notice board (pravý panel)
```
┌─────────────────────┐
│ 🍺 DNEŠNÍ SPECIÁL  │
│ Elfí ale za půlku! │
├─────────────────────┤
│ 🍺 IKAROS ALE      │
└─────────────────────┘
```
- Parchmentové útržky připnuté na dřevěnou nástěnku
- Rotace o pár stupňů (jak to visí na hřebíku)
- Pouze dekorativní

### Bottom props
- D20 kostky, zlaté mince, svinutá mapa, váčky zlata — dekorativní background-image

---

## Tlačítka (3D efekt)

Dřevěné taverní tlačítko s kovovými nýty. Teplé, robustní, přátelské.

```
Tvar:      border-radius: 6px — mírně zaoblené (opracované dřevo)
Normální:  tmavý dřevěný gradient + měděná bordura + teplý stín
Hover:     zesvětlení + translateY(-2px) + amber glow
Active:    translateY(2px) — jako klepnutí na dřevěný pult
Primární:  crimson gradient (cechovní) + zlatá bordura + subtle fringe efekt
Aktivní nav: amber left-border + zlatý text + svíčkový glow
```

---

## Dekorativní prvky

- **Dřevěné desky:** Pannely mají dřevěnou texturu s viditelnými letokruhy a trámy
- **Kovové nýty:** CSS `box-shadow` nebo `::before` body v rozích panelů — jako nýty v dřevu
- **Parchmenová nástěnka:** Hlavní obsah na světlém pergamenu (jako Pergamen téma, ale rustikálnější)
- **Lucerny:** Dekorativní v rozích sidebaru (background-image)
- **Svíčkový ambient:** Teplý radial-gradient overlay — oranžové světlo ze zdola
- **Cechovní banner:** SVG s houpe animací v logo oblasti
- **Taverní vyhlášky:** Rotované parchmentové útržky v pravém panelu

---

## Typografie

- **Logo:** Almendra nebo MedievalSharp — knižní, středověký
- **Nadpisy:** Lora Bold nebo Playfair Display — serif, teplý
- **Navigace:** Sentence case, mírný serif, přátelský (ne uppercase agresivně)
- **Text:** Lora — čitelný, knižní
- **Admin kurzíva:** Červená italic cursive — jako inkoust na pergamenu

---

## Rozdíly od Pergamenu

| Vlastnost | Pergamen | Hospoda |
|-----------|---------|---------|
| Prostředí | Tichá studovna | Hlučná krčma |
| Tón | Učenost, klid | Veselí, kamarádství |
| Logo | Standardní rámec | Cechovní banner |
| Pravý panel | Čistý | Taverní vyhlášky |
| Dekor | Brk, kompas | D20, pivo, mapy |
| Svíčky | Studijní | Hospodské (víc) |
| Primární akcent | Crimson + knižní | Crimson + amber |

---

## Poznámky pro implementaci

- Banner komponenta: SVG `<Banner />` s `@keyframes sway { 0%,100% { rotate: -1deg } 50% { rotate: 1deg } }`
- Taverní vyhlášky: absolute positioned `<div>` s `transform: rotate(-3deg)` a `rotate(2deg)` alternativně
- Kovové nýty: `::before` + `::after` pseudoelementy v rozích karet — malé kruhy `#6a3810`
- Světlý text na tmavém dřevu (sidebary) + tmavý inkoust na světlém pergamenu (karty)
- D20 props: background-image pouze v dolní části stránky, `pointer-events: none`
- Teplý ambient: `radial-gradient(ellipse at bottom center, #e0800020 0%, transparent 60%)`
