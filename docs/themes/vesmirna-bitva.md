# Téma: Vesmírná bitva

**ID:** `vesmirna-bitva`
**Status:** ✅ Implementováno (1.0n, 2026-05-11)
**Spec:** [`docs/arch/phase-1/spec-1.0n-vesmirna-bitva-upgrade.md`](../arch/phase-1/spec-1.0n-vesmirna-bitva-upgrade.md)

---

## Atmosféra

**Můstek poškozeného bitevního křižníku v akutním boji.** Klaxon vyje, červené nouzové LED bliká, panely jsou pancéřové ocelové desky s nýty a podpálenými hranami, jiskry padají z rohů. *Brutální, nebezpečný, beznadějný* — člověk ví, že může padnout a zemřít, ale dělá svou práci. **Damage control v aktivní bitvě.**

**Klíčový rozdíl od Vesmírné lodi:** vesmirna-lod = clean military hangár v klidu (cyan/amber dual-tone). Vesmírná bitva = pancéřovaný můstek pod palbou s hellfire-red + plasma-orange + lava ohni.

---

## Barevná paleta (1.0n — hellfire/gunmetal)

| Role | Hex | Použití |
|------|-----|---------|
| `--theme-bulkhead-deep` | `#06030a` | Hlavní pozadí — void s warm undertone |
| `--theme-bulkhead-mid` | `#0e0408` | Sidebary, secondary surface |
| `--theme-bulkhead-card` | `#160a10` | Karty — bulkhead steel |
| `--theme-hellfire` | `#b8101c` | Primární akcent — bojová červená |
| `--theme-hellfire-bright` | `#d4111c` | Hover / active |
| `--theme-hellfire-incand` | `#e8202a` | Incandescent, alarm peak |
| `--theme-plasma` | `#ff5040` | Sekundární highlight — hot edge |
| `--theme-plasma-bright` | `#ff7050` | Peak spark |
| `--theme-ember-burn` | `#ff5028` | Ohořelé hrany — orange-red ember |
| `--theme-gunmetal` | `#3a3e44` | Kovová neutrální base |
| `--theme-gunmetal-bright` | `#a4acb4` | Highlight rim |
| `--theme-gunmetal-edge` | `rgba(124, 132, 140, 0.32)` | Borders |
| `--theme-text-pale` | `#d8d2d0` | Hlavní text — popelavá ocel |
| `--theme-text-muted` | `#988a86` | Sekundární |

---

## Typografie (1.0n — Q-2 A)

- **Logo:** kombinovaný banner (image asset) — stencil "Projekt Ikaros" s vestavěným angel-medallion kruhem vlevo
- **Display / heading:** **Saira Stencil One** — autentický vojenský stencil
- **Sub / labels:** **Chakra Petch** — technický mono-flair, HUD readouts
- **Body:** **Inter Tight** — čitelný, stísněný, bez sci-fi sterility
- **Signature script:** **Special Elite** — damaged typewriter (jako vojenský zápis na poškozeném teletypu lodi)

---

## Signature elementy

### 1. Battle-plate corner brackety (4 rohy každého panelu)
- Pancéřová ocelová L bracket s 5 nýty
- Vnější hrana **ohořelá** (lava ember `#ff5028` → char `#1a0608`) s wisps tmavého kouře
- Malý red-LED bod v inner corner (`#ff2030`)
- Master `corner-tl.webp` mirrored CSS `scaleX/Y` na ostatní 3 rohy

### 2. Destroyer schematic strip (nad welcome card)
- Wireframe top-down destroyer-class lodi v hellfire-red liniích
- **3 X marks** v damage zónách (bow, mid-engine, aft port)
- Technical blueprint feel, transparent background

### 3. Welcome card medailon (rectangular self-framed tactical display)
- Anděl Ikaros uvnitř pancéřového gunmetal rámu s úhlovými rohy
- Vnitřní **red-LED rim glow** kolem display area
- Krevně-červené ambient světlo za andělem
- 220×290 desktop (3:4 ratio, NE čtverec)

### 4. Header HUD status strip (mezi logem a header buttony)
- Flex-fill HUD pruh přímo v hlavičce, natáhne se mezi logo a `HeaderLoggedIn` buttony
- Vlevo: targeting reticle 22×22 (animace `reticle-sweep 8s linear infinite`)
- Uprostřed: text "VŠECHNY SYSTÉMY V POHOTOVOSTI" — Saira Stencil One 12px letter-spacing 0.5em, hellfire-bright + glow
- Vpravo: 2× hazard chevron SVG
- Bottom 1px LED strip s `vb-led-pulse 1.4s` animací (sync s header alarm pulse)
- **Mobile (≤768px):** skryté (málo místa v headeru)

### 5. ALERT panel — VYŘAZEN (Q-16)
- Původně signature element pravého sidebaru (R1, medailon-frame okolo hazard triangle)
- Po implementaci shledáno uživatelem jako **moc rušivé** (pulsovalo v dolním pravém rohu napořád)
- Odstraněno kompletně. `medailon-frame.webp` zůstává v `decor/` jako nepoužitý asset — kandidát na repurposing později.

### 6. Heart-monitor divider (mezi sekcemi)
- SVG inline flatline s **ECG spike uprostřed**
- Hellfire-red `#b8101c` stroke, plasma glow

### 7. Console-panel button nav ikony (7 ikon)
- Sdílený gunmetal frame se 4 nýty v rozích + spodní red-LED backlight
- Vyrytý symbol uvnitř (carved engraving feel)
- Per nav-key: `uvodnik` (book+quill), `vytvorit-svet` (star+plus), `diskuze` (comm bubbles), `clanky` (closed book s star emblémem), `galerie` (monitor frame), `napoveda` (otazník v kruhu), `hospoda` (whiskey tumbler)

---

## Signature animace (motion language)

| Animace | Délka | Cíl | Reduced-motion |
|---|---|---|---|
| **Alarm pulse** (klaxon) | 1.4s loop | Všechny panely (border + glow swell) | vypnuto (static state s hellfire hint) |
| **Spark burst** | 8s loop, 16% visible window | Corner brackety (1 per roh, staggered) | `display: none` |
| **LED strip pulse** | 1.4s loop | Topbar bottom edge + status-strip bottom edge | static opacity 0.7 |
| **Reticle sweep** | 8s linear | Targeting reticle v status stripu (v headeru) | vypnuto |

**Žádné swing, sway, flutter, heartbeat, candle flicker, brass shine, petals, blood drip** — to jsou jiné skiny. Vesmirna-bitva má **4-element battle motion language** (po vyřazení ALERT panelu Q-16).

---

## Tlačítka

```
Tvar:      border-radius 2px — přísně angular (battle-plate)
Normální:  tmavě gunmetal gradient + 1px gunmetal-edge border + inner highlight nahoře
Hover:     plasma-bright text + 1px hellfire inset rim + 0 0 18px hellfire glow
Active:    translateY(1px) — stisknutí bojového tlačítka
Primární:  hellfire gradient (#c8121c → #6e0a14) + outer glow + inner gunmetal highlight
Aktivní nav: gunmetal-edge bracket [ ] po stranách + LED zesílí v console button ikoně
```

---

## Rozdíly od Sci-fi, Vesmírné lodi, Temné červeně

| Vlastnost | Sci-fi | Vesmírná loď | Temná červeň | **Vesmírná bitva** |
|---|---|---|---|---|
| Primární barva | Cyan + magenta | Cyan + amber | Garnet + silver tarnish | **Hellfire-red + gunmetal** |
| Stav lodi | Command HUD, klid | Clean hangar, klid | Privátní salón | **Damage control, aktivní boj** |
| Hlavní materiál | Holographic glass | Clean plate metal | Baroque iron + silver | **Battle-scarred gunmetal s lava emberem** |
| Signature panel | — | — | Bat-arch crown | **ALERT panel (oktagonal frame + hazard)** |
| Signature motion | — | — | Heartbeat + petals + drip | **Alarm pulse + spark burst + reticle sweep** |
| Typografie | Orbitron clean | Orbitron clean | Pirata One blackletter | **Saira Stencil One military** |
| Atmosféra | Optimistic command | Disciplined calm | Decadent seduction | **Brutal danger, hopelessness** |

---

## Asset inventář (13 souborů)

User dodal (2):
- `logo.webp` — kombinovaný banner (angel medallion + stencil text)
- `medailon.webp` — rectangular self-framed tactical display

AI gen (11):
- `corner-tl.webp` (master TL, mirror přes CSS)
- `medailon-frame.webp` (oktagonal, **NEPOUŽITÝ po Q-16** — kandidát na repurposing)
- `destroyer-schematic.webp` (welcome card crown)
- `targeting-reticle.webp` (status strip v hlavičce)
- 7× console-panel button ikony

Pipeline: `assets-source/themes/vesmirna-bitva/*.png` → `npm run themes:optimize` → `public/themes/vesmirna-bitva/decor/*.webp` → `node scripts/finalize-vesmirna-bitva-assets.mjs` (resize na finální rozměry).

---

## Implementační poznámky

- **Strict isolation:** vše scoped přes `[data-theme="vesmirna-bitva"]`. 20 ostatních témat nemá žádnou regresi.
- **DOM injection:** `IkarosLayout.tsx` má 1 nový `<div data-theme-decoration="status-strip">` block uvnitř `<header>` (gated CSS visibility, jen pro tento skin). Po Q-16 byl ALERT panel block odstraněn.
- **Spark burst** = CSS `::before` pseudo na existujících `CornerOrnament[data-position]` spans (4 rohy × N panelů), žádný DOM injection.
- **Reduced-motion:** alarm pulse, spark burst, LED pulse, reticle sweep — všechno vypnuto. Hover transitions + click feedback zachovány.

---

## Technický dluh

- **`medailon-frame.webp` nepoužitý** — po vyřazení ALERT panelu (Q-16) zůstal asset v `decor/` ale není nikde referencovaný v CSS. Kandidát na repurposing později (např. avatar frame v ADMINISTRACE, command crest, decorative emblém v Settings). Volitelně lze asset odstranit ze `assets-source/themes/vesmirna-bitva/` + smazat z `public/themes/vesmirna-bitva/decor/`.
- **Status strip typewriter rotace hlášek** — aktuálně statický text "VŠECHNY SYSTÉMY V POHOTOVOSTI" (per Q-14). Snadný patch (~+20 LOC CSS keyframes + textContent rotation).
