# Prompty pro asset ornamenty chatu — 12 skinů (krok 6.1)

Pro design `design-6.1.md` §9. Asset = **bezešvá dlaždicová textura panelu chatu**
(`--chat-panel-texture`). Sedí pod text zpráv → musí být **velmi tmavá, nízkokontrastní,
bez ohniska**. Jeden asset per skin.

## Společné technické zadání (přilep ke každému promptu)

> Seamless tileable texture, 512×512 px, edges wrap perfectly on all sides. Extremely
> dark and low-contrast — this sits *behind* white UI text and must never compete with
> it. No text, no letters, no logos, no people, no focal subject, no bright spots or
> light sources, even flat lighting. Abstract background surface only. Subtle grain,
> PNG. Motif barely visible, like a watermark.

Výstup: `public/themes/chat-textures/<skin>.png` (nebo `.webp`). Po dodání je zapojím
přes per-skin `decorations.css`.

---

## 1. ikaros — *Fialové synthwave, neonové město, déšť kódu*

> Dark violet synthwave underlay. A faint perspective grid receding to a horizon, plus
> drifting specks of digital rain and distant stars. Deep indigo-black base (#0c0820),
> hairline neon-violet grid lines (#a96cff) at ~6% opacity. Retro-futuristic, calm.

## 2. fantasy — *Vznešená elfí síň, zlatý filigrán, smaragdové světlo*

> Dark forest-green underlay with delicate gold filigree — interlacing vines and leaf
> scrollwork, like elven engraving. Base near-black green (#0b1510), filigree in muted
> gold (#e3c66b) at ~5% opacity. Elegant, organic, symmetrical.

## 3. dark-fantasy — *Gotická katedrála pod krvavým měsícem, studené stříbro*

> Near-black gothic underlay — faint cracked stone and pointed-arch tracery, a hint of
> raven feathers. Base almost black (#0c0608), tracery in cold silver-grey (#ddd6d2)
> at ~4% opacity, a barely-there crimson bruise (#b51e2e). Cold, severe, sacred.

## 4. vesmir — *Můstek hvězdné lodi, ledově modré panely*

> Dark spacecraft hull underlay — brushed-metal panel seams and a faint hexagonal
> lattice. Base deep blue-black (#070b12), seams and hex grid in ice-blue (#4fd4e4) at
> ~5% opacity. Clean, technical, cold.

## 5. cyberpunk — *Korporátní megablok, kyselý žlutý neon, varovné šrafy*

> Coal-black industrial underlay — faint diagonal hazard stripes and thin circuit
> traces. Base near-black warm (#0a0a08), stripes and traces in acid yellow (#f0d020)
> at ~4% opacity. Gritty, corporate-dystopian, harsh.

## 6. steampunk — *Parní metropole, měděné komíny, jantarový smog*

> Dark copper-brown underlay — engraved brass gears, cogs and rivet rows, like an old
> mechanism plate. Base dark brown (#16100a), engraving in muted copper (#c8893a) at
> ~5% opacity. Victorian-industrial, intricate, warm.

## 7. apokalypsa — *Město pohlcené přírodou, mech na betonu*

> Dark concrete underlay reclaimed by nature — faint cracked concrete with creeping
> moss and lichen patches. Base dark grey-green (#10130e), moss in muted sage
> (#7e9c5c) at ~5% opacity. Quiet, overgrown, desaturated.

## 8. horor — *Opuštěné sídlo, slábnoucí svíčka, prach*

> Near-black underlay — faded, peeling damask wallpaper, water stains and dust. Base
> almost black (#090807), damask pattern in tarnished gold-brown (#c89a52) at ~3%
> opacity, very degraded. Decayed, oppressive, dim.

## 9. mystery — *Deštivá noirová ulice, žluté světlo lampy v šedomodré mlze*

> Dark noir underlay — rain streaks running down a foggy windowpane, soft grey-blue
> haze. Base dark slate (#0c0f14), streaks and fog in muted steel-grey (#d2d4d8) at
> ~5% opacity, faint warm amber tint (#d8a24a). Moody, rainy, atmospheric.

## 10. historie — *Barokní dvorní sál, vinná červeň, staré zlato, mahagon*

> Very dark baroque underlay — ornate damask brocade scrollwork. Base deep wine-brown
> (#160d0c), brocade in old gold (#bd9a4e) at ~5% opacity with a wine-red undertone.
> Opulent, courtly, candle-lit.

## 11. moderni — *Útulný večerní interiér, teplé světlo lampy, dřevo a textil*

> Warm dark underlay — soft woven linen / textile weave, very fine and even. Base dark
> warm brown (#15110d), weave in muted tan (#c87e54) at ~4% opacity. Cozy, tactile,
> understated.

## 12. western — *Prašné pohraniční městečko, vybledlé dřevo, soumrak*

> Dark weathered-wood underlay — aged plank grain with knots and fine cracks, dusty.
> Base dark warm brown (#171009), grain in faded amber-tan (#cf8a44) at ~5% opacity.
> Rugged, sun-bleached, frontier.

---

## Pozn.

- Hodnoty opacity v promptu jsou *cíl výsledného dojmu* — model je nedodrží přesně, po
  dodání textury si krytí doladím v CSS (`opacity` / `mix-blend-mode`).
- Volitelný druhý asset (motiv pravého seamu sidebaru) zatím neřešíme — CSS-only seam
  stačí; prompty dodám, pokud po implementaci budeš chtít víc.
