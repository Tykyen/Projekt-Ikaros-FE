# Téma: Postapo (Apokalypsa)

**ID:** `postapo`  
**Referenční obrázek:** [assets/postapo.png](assets/postapo.png)

---

## Atmosféra

Zóna 7 Radiace. Zničené mrakodrapy, rozpadlé mosty, toxická oblačnost, havrани nad troskami. Panely jsou z korodovaných kovových plátů s nýty. Vše je opotřebené, poškrábané, rezavé. Ikaros přežil — ale sotva. Žádná krása, žádný luxus — jen holé přežití a tiché memento toho, co bylo.

**Nejdesaturovanější téma kolekce — žádné jasné barvy, vše je utlumené.**

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#0c0c08` | Hlavní pozadí — popelová čerň |
| `--bg-secondary` | `#141410` | Sidebary — tmavý korozivní kov |
| `--bg-card` | `#1a1a14` | Karty — tmavá ocelová deska |
| `--bg-card-hover` | `#202018` | Hover stav karet |
| `--accent-toxic` | `#8a8810` | Primární toxická olivová — radiace, text |
| `--accent-toxic-bright` | `#a8a818` | Hover olivová, glow (velmi slabý) |
| `--accent-toxic-dim` | `#484808` | Tlumená olivová — bordury |
| `--accent-rust` | `#7a3810` | Rez — panelové bordury, nýty |
| `--accent-rust-bright` | `#9a5020` | Světlejší rez |
| `--accent-concrete` | `#484840` | Beton — neutrální plochy |
| `--accent-radiation` | `#606008` | Radiační žlutozelená — ☢ symbol, warn |
| `--text-primary` | `#b0a888` | Hlavní text — špinavá krémová |
| `--text-secondary` | `#686050` | Sekundární text — prach |
| `--text-muted` | `#383830` | Vypnuté prvky |
| `--border-metal` | `#302e20` | Kovová bordura — základní |
| `--border-rust` | `#5a3010` | Rezavá bordura — opotřebovaná |
| `--border-toxic` | `#8a881020` | Toxická bordura (velmi průhledná) |

> **Žádné jasné/neonové barvy** — vše má maximálně 60% saturace. Olivová a rez jsou jediné "akcenty".

---

## Tlačítka (3D efekt)

Korozivní kovová deska s nýty v rozích. Těžká, opotřebená, vojenská.

```
Tvar:      border-radius: 0 — přísně pravoúhlé (kovová deska)
Normální:  tmavý kovový gradient (s noise texturou) + rezavá bordura + kovový stín
Hover:     velmi slabý toxic olivový glow + translateY(-2px) + rez zesvětlí
Active:    translateY(3px) — těžký kovový dopad
Primární:  olivový gradient (tmavý) + rezavá bordura — přežití, ne krása
Aktivní nav: rezavý left-border (4px) + olivový text + nýty zůstávají
```

---

## Dekorativní prvky

- **Korozivní kov:** Noise/grain texture + rust overlay na všech panelech (`background-image` nebo CSS filter)
- **Nýty/šrouby:** CSS `::before`/`::after` v rozích panelů — malé tmavé kruhy s kovovým glow
- **Radiační symbol ☢:** Na "Zlatý standard" dropdownu + dekorativní v pravém panelu (vybledlý)
- **ZÓNA 7 RADIACE:** Text/sign v background scéně (background-image)
- **Geiger kruh:** Dekorativní kruhový měřič vpravo dole — SVG s animovanou ručičkou
- **Praskliny/škrábance:** CSS `::before` s crack pattern overlay na kartách (opacity 0.1)
- **Korodované potrubí:** Dekorativní podél okrajů sidebaru (background-image)
- **Ikaros bird:** Poškrábená, vybledlá verze loga — `filter: grayscale(0.6) contrast(0.8)`
- **Havrани:** V background scéně létající (background-image detail)
- **Logo kruh:** Korodovaný kovový kruh — rez, škrábance, bez ornamentů

---

## Typografie

- **Logo:** Oswald nebo Bebas Neue — kondenzovaný, průmyslový — text vypadá opotřebeně
- **Nadpisy:** Roboto Condensed nebo Oswald — vojenský, funkční
- **Navigace:** Uppercase, letter-spacing 2px, sans-serif — jako vojenský formulář
- **Text:** Roboto nebo Source Sans Pro — čistý ale bez personality
- **Admin kurzíva:** Olivová italic — jako psaní inkoustem v bunkru
- **"Projekt Ikaros" v textu:** Olivová (`--accent-toxic-bright`) — přežívající barva

---

## Rozdíly od Vesmírné bitvy a Nemrtvých

| Vlastnost | Nemrtví | Vesmírná bitva | Postapo |
|-----------|---------|----------------|---------|
| Akcent | Toxická zelená (živá) | Červená (urgence) | Olivová (mrtvá) |
| Kov | Kámen + rez | Čistá čerň | Korozivní plát |
| Atmosféra | Nadpřirozená smrt | Vojenská krize | Lidský zánik |
| Saturace | Střední | Střední | **Minimální** |
| Glow | Toxický zelený | Červený alarm | Téměř žádný |
| Dekor | Lebky, řetězy | Alert panel | ☢ symbol, nýty |
| Pocit | Gotický horor | Bojová urgence | Apokalyptická rezignace |

---

## Poznámky pro implementaci

- Rust/noise texture: CSS `background-image: url("noise.svg")` + `background-blend-mode: multiply`
- Nýty: `width: 8px; height: 8px; border-radius: 50%; background: #302e20; box-shadow: inset 0 1px 2px rgba(255,255,255,0.1)`
- Geiger SVG: animovaná ručička `@keyframes geiger { 0% { rotate: -20deg } 100% { rotate: 20deg } }` s random timing
- Logo filter: `filter: grayscale(0.5) sepia(0.3) contrast(0.9)` — vybledlý vzhled
- Žádný `box-shadow` s barevným glow — pouze `rgba(0,0,0,0.5)` kovové stíny
- Praskliny: SVG crack pattern jako `::before` overlay, `opacity: 0.08`
- Celková saturace UI: všechny barvy by měly projít `filter: saturate(0.6)` kontrolou
