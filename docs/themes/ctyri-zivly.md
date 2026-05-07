# Téma: Čtyři živly

**ID:** `ctyri-zivly`  
**Referenční obrázek:** [assets/ctyri-zivly.png](assets/ctyri-zivly.png)

---

## Atmosféra

Čtyři prastaré síly v rovnováze. Oheň burácí vlevo, voda a vzduch tančí vpravo, země drží vše pohromadě. Panely jsou z tmavého kamene s kořeny, živly prostupují jako živé energie. Fénix jako symbol Ikarose — zrozený z ohně, překračující všechny živly. Pocit elementální magie, kosmické rovnováhy a prvotní síly přírody.

---

## Barevná paleta — 4 živly + unifikující zlatá

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#100c08` | Hlavní pozadí — tmavá zemitá čerň |
| `--bg-secondary` | `#181208` | Sidebary — tmavý kámen |
| `--bg-card` | `#1a1510` | Karty — kamenná deska |
| `--bg-card-hover` | `#221c14` | Hover stav karet |
| **OHEŇ** |
| `--fire-primary` | `#e86020` | Oranžová — primární oheň |
| `--fire-bright` | `#ff8030` | Světlý oheň, glow |
| `--fire-dim` | `#803010` | Tlumený oheň |
| **VODA** |
| `--water-primary` | `#2080d0` | Modrá — voda/led |
| `--water-bright` | `#40a0f0` | Světlá voda, glow |
| `--water-dim` | `#104060` | Tmavá voda |
| **ZEMĚ** |
| `--earth-primary` | `#4a6020` | Tmavá zelená — země |
| `--earth-bright` | `#6a8830` | Světlá země |
| `--earth-dim` | `#283010` | Humus |
| **VZDUCH** |
| `--air-primary` | `#c0d8e8` | Stříbrná bílá — vzduch |
| `--air-bright` | `#e0f0ff` | Čistý vzduch, glow |
| **UNIFIKUJÍCÍ** |
| `--accent-gold` | `#c8900a` | Zlatá — UI prvky, bordury, unifikátor |
| `--accent-gold-bright` | `#e8b020` | Hover zlatá |
| `--text-primary` | `#d8c090` | Hlavní text — teplá zlatavá |
| `--text-secondary` | `#7a6040` | Sekundární text |
| `--text-muted` | `#403020` | Vypnuté prvky |
| `--border-stone` | `#302818` | Kamenná bordura |
| `--border-gold` | `#c8900a50` | Zlatá bordura (průhledná) |

---

## Živly jako zóny UI

Živly nejsou náhodně — každý má svou zónu:

```
┌─────────────────────────────────────────────┐
│              VZDUCH (header)                 │
├──────────┬──────────────────────┬────────────┤
│          │                      │            │
│  OHEŇ   │      ZEMĚ            │    VODA   │
│ (levý   │    (střed/main)      │  (pravý   │
│sidebar) │                      │  panel)   │
│          │                      │            │
├──────────┴──────────────────────┴────────────┤
│              ZEMĚ (footer/bottom)            │
└─────────────────────────────────────────────┘
```

---

## Tlačítka (3D efekt)

Zlatá bordura jako unifikátor, tmavý kamen jako základ. Hover barva závisí na živlu sekce.

```
Tvar:      border-radius: 5px — kamenné ale mírně organické
Normální:  tmavý kamenný gradient + zlatá bordura + zemitý stín
Hover (obecný): zlatý glow + translateY(-2px)
Hover (fire zóna): oranžový glow
Hover (water zóna): modrý glow  
Aktivní nav: zlatý left-border + zlatý text + elemental glow dle pozice
Primární btn: zlatý gradient — element-neutrální
```

---

## Dekorativní prvky

- **Oheň vlevo:** Animated flame gradient na levém okraji sidebaru (CSS `@keyframes flame`)
- **Voda vpravo:** Animated water swirl na pravém panelu (CSS nebo SVG animation)
- **Kořeny/viny:** Organické kořenové bordury na panelech (jako Příroda, ale tmavší)
- **4-živlový mandala:** Kruhový symbol v pravém dolním rohu — oheň/voda/vzduch/země v kruhu
- **Fénix logo:** Vícebarevný fénix — oranžová/zlatá/tyrkysová křídla (speciální logo varianta)
- **Kamenné desky:** Textura panelů — tmavý kámen s prasklinami
- **Vzduchové víry:** Jemné swirl animace v header oblasti

---

## Typografie

- **Logo:** Cinzel Decorative nebo Trajan Pro — epický, nadčasový serif
- **Nadpisy:** IM Fell English — historický, elementální
- **Navigace:** Uppercase, letter-spacing 2px, serif
- **Text:** Lora — čitelný, přírodní
- **Admin kurzíva:** Zelená/tyrkysová italic — zemitá energie

---

## Poznámky pro implementaci

- Flame animace: `@keyframes` na pseudo-elementu — gradient oranžová→červená, translateY + opacity
- Water animace: SVG `animateTransform` nebo CSS `@keyframes` rotace na vodním swirl elementu
- 4-živlový symbol: SVG komponenta v pravém panelu
- Fénix logo: speciální SVG varianta s vícebarevnými vrstvami
- Zlatá jako unifikátor: všechny interaktivní prvky mají `--accent-gold` borduru bez ohledu na živlovou zónu
- `--fire-primary` / `--water-primary` atd. se používají POUZE pro environmentální efekty, ne pro UI
- Pozor na výkon: flame + water animace mohou být náročné — použít `will-change: transform`
