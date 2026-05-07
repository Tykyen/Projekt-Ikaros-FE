# Prompty pro generování čistých backgroundů (21 témat)

Tento soubor obsahuje 21 ready-to-paste promptů pro ChatGPT (DALL·E 3) — každý vygeneruje **čistou scénu bez UI** pro background dané stránky.

---

## Workflow

1. Otevři ChatGPT, vyber model schopný generovat obrázky (GPT-4o / GPT-5 s image gen).
2. Zkopíruj **celý prompt** dané sekce níže (včetně CONSTRAINTS).
3. Stáhni vygenerovaný obrázek.
4. Ulož do: `c:\Matrix\ProjektIkaros\Projekt-ikaros-FE\docs\themes\assets\backgrounds\<id>.png`
   - Příklad: `backgrounds/modre-nebe.png`, `backgrounds/zlaty-standard.png`, …
5. Já si je sám zkonvertuji do WebP a pohlídám velikost.

## Univerzální specifikace (platí pro všechny)

- **Rozlišení:** 1920×1080 (16:9, landscape) — když umožní GPT vyšší (např. 2560×1440), tím lépe
- **Formát:** PNG (já optimalizuji na WebP ~250 KB)
- **Aspect ratio:** wide cinematic 16:9
- **Kompozice:** atmosférická, vizuálně bohatá NA OKRAJÍCH, ale **střed plochy nesmí mít jediný dominantní fokus** (na střed sedí UI obsahový panel — pokud tam bude třeba portrét postavy uprostřed, panel ho překryje)
- **Bez:** UI panelů, tlačítek, textu, ikon, dropdownu, "Projekt Ikaros" titulku, žádného Ikaros pták-loga
- **Pták Ikaros** může být součástí scény (jako silueta letící v dálce, hologram, fresca…), ale **ne v rámečku jako logo**

## Univerzální CONSTRAINTS blok (přidej na konec každého promptu)

```
CONSTRAINTS:
- 16:9 cinematic landscape, 1920x1080
- NO user interface, NO panels, NO buttons, NO text, NO logos, NO HUD, NO icons
- NO "Projekt Ikaros" title text anywhere
- Avoid one single dominant focal element in the dead center of the frame
- Wide atmospheric composition, rich detail at edges, breathable middle area
- High-quality concept art / digital painting style unless specified otherwise
```

---

## 1. `modre-nebe`

```
Wide 16:9 cinematic fantasy concept art background.
A grand fantasy castle with multiple ornate gothic spires and golden domed towers, set against a deep navy blue sky transitioning to warm golden sunset clouds at the horizon. Heroic medieval fantasy realm, painted in rich oil-painting style. Distant mountains, a few stars beginning to twinkle. Lighting: dawn/dusk golden hour with deep navy upper sky.
Color palette: deep navy #0a1428, royal gold #c89a30, warm sunset #d8a040, distant cloud whites.
Style: epic fantasy matte painting, cinematic, painterly.
[+ univerzální CONSTRAINTS blok]
```

## 2. `zlaty-standard`

```
Wide 16:9 cinematic background of pure deep cosmic darkness.
A near-black void with subtle silhouettes of an astronomical orrery (mechanical solar system model) floating in distance, faint golden constellations, ancient brass star charts as ghostly overlays. Almost monochromatic — black, deep charcoal, with rich gold accents only as starlight.
Lighting: extremely low-key, single warm gold point lights.
Color palette: pitch black #050505, rich gold #d4af37, warm amber #b8860b. NO blue, NO purple.
Style: minimalist cosmic luxury, prestigious, like an antique observatory at midnight.
[+ univerzální CONSTRAINTS blok]
```

## 3. `sci-fi`

```
Wide 16:9 cinematic sci-fi concept art.
Interior corridor of a civilian space station — sleek dark panels, holographic data projections shimmering on side walls, cyan accent lighting along floor and ceiling seams, occasional magenta highlights. Distant view of stars and a planet through a transparent panel at the end of the corridor. Clean futuristic, NOT military.
Lighting: cool cyan ambient with magenta secondary.
Color palette: dark navy #050810, cyan #00d8e8, magenta accents #e020c0.
Style: cinematic sci-fi concept art, sleek, atmospheric, lots of breathing room.
[+ univerzální CONSTRAINTS blok]
```

## 4. `bila`

```
Wide 16:9 ethereal soft watercolor background.
A peaceful pale sky with soft cream and ivory clouds, golden sun rays filtering down from upper edge. Distant hint of celestial light, dreamlike serene atmosphere. Almost no dark areas — entire frame is light, airy, gentle.
Lighting: bright soft daylight from above, warm golden tint.
Color palette: cream #fbf6e9, ivory #f4ecd8, soft gold #c4a057, crystal blue accents #8ab4d8.
Style: minimalist watercolor / soft pastel painting, very light overall, calm.
[+ univerzální CONSTRAINTS blok]
```

## 5. `vesmirna-lod`

```
Wide 16:9 hard sci-fi concept art.
Interior of a massive military spacecraft hangar — exposed metal beams, cargo containers, hanging chains, scaffolding, distant docked fighter craft silhouettes. Industrial, utilitarian, NO civilian feel. Cyan emergency lighting strips along floor, amber warning lights on equipment.
Lighting: industrial low-key, cyan + amber dual.
Color palette: deep black #060810, cyan #00b8e0, amber accents #d8a020.
Style: military hard sci-fi, cinematic concept art, gritty but clean.
[+ univerzální CONSTRAINTS blok]
```

## 6. `priroda`

```
Wide 16:9 fantasy nature concept art.
Enchanted dark ancient forest at twilight — massive moss-covered tree trunks, glowing emerald-green crystal formations growing from the ground, twisted vines, drifting fireflies, soft mist. A few exposed tree roots in foreground. Mystical, primeval, magical.
Lighting: green crystal glow + soft moonlight filtering through canopy.
Color palette: deep forest green #0a1810, dark wood brown #2a1810, glowing emerald #20d090, muted amber moss highlights.
Style: lush fantasy nature painting, atmospheric, painterly detail.
[+ univerzální CONSTRAINTS blok]
```

## 7. `pergamen`

```
Wide 16:9 painterly historical scene.
Interior of an ancient candlelit library — open leather-bound tomes on a wooden table, parchment scrolls, quill pens, brass candlesticks with melted wax, distant tall bookshelves dissolving into warm shadow. Warm sepia tones, no people. Historical, scholarly, intimate.
Lighting: warm candlelight, very low-key, golden glow.
Color palette: warm parchment cream #e8d8a8, dark wood brown #2a1808, sepia ink #4a2810, candle gold #d8a040.
Style: classical oil painting / Dutch Golden Age aesthetic, historical, painterly.
[+ univerzální CONSTRAINTS blok]
```

## 8. `nemrtvi`

```
Wide 16:9 dark horror fantasy concept art.
Underground gothic crypt — stone sarcophagi, broken skulls scattered, hanging rusted chains, cobwebs, occasional toxic green-flame torches in iron sconces. Cracked stone walls. Eerie, oppressive, supernatural death.
Lighting: sickly toxic green flame light + deep black shadows.
Color palette: charcoal black #0a0808, stone gray #2a2a2a, toxic green flame #20c040, rust orange #6a3008.
Style: gothic horror painting, atmospheric, dread-inducing.
[+ univerzální CONSTRAINTS blok]
```

## 9. `ctyri-zivly`

```
Wide 16:9 fantasy elemental composition.
A symbolic composite scene divided into four quadrants flowing together: top = sky/clouds with lightning (air), bottom = solid stone/earth, left = burning flames, right = flowing water. Connected by golden ethereal threads radiating from a central glowing point. Mystical balance of elements. NO single dominant element — all four equal.
Lighting: dramatic multi-directional, each quadrant lit by its own element.
Color palette: fire orange-red #d8401a, water teal-blue #20a0c8, earth brown-green #604018, air sky-white #e8f0f8, gold connectors #d4af37.
Style: fantasy elemental concept art, painterly, mythological.
[+ univerzální CONSTRAINTS blok]
```

## 10. `vesmirna-bitva`

```
Wide 16:9 cinematic war sci-fi.
Massive space battle in deep space — distant exploding warship, streaks of red laser fire across the void, debris field, war fleet silhouettes. Foreground: dark cockpit-edge framing the chaos. Red emergency alert tint over everything. Cinematic, urgent, military crisis.
Lighting: red alarm tint dominates, occasional white laser flash.
Color palette: pure black #000000, alarm red #c8101a, white-hot explosions, dark blood-red shadows.
Style: cinematic military space opera concept art, intense, dramatic.
[+ univerzální CONSTRAINTS blok]
```

## 11. `hospoda`

```
Wide 16:9 medieval tavern interior painting.
Cozy fantasy tavern — heavy wooden beams overhead, hanging iron lanterns with candle flames, wooden tables in soft shadow, distant fireplace glow on right side, hanging guild banners on rear wall, kegs and barrels. No people. Warm, inviting, adventurer's hangout.
Lighting: warm amber candlelight, fireplace glow, deep wood shadows.
Color palette: dark walnut wood #2a1810, warm amber lantern #d89040, copper accents #b87830, parchment off-white tones for banners.
Style: fantasy RPG tavern concept art, warm, painterly, atmospheric.
[+ univerzální CONSTRAINTS blok]
```

## 12. `severske-runy`

```
Wide 16:9 Norse fantasy concept art.
Exterior of a frozen Viking longhouse — wooden carved gables with intricate knotwork patterns, ice-covered stone walls, amber torches in iron brackets flickering, snow-covered ground, frozen mountain peaks in distance. Aurora borealis (deep ice-blue and faint amber) shimmers in the night sky. Dragon-head wood carvings on roof eaves.
Lighting: cold blue moonlight + warm amber torch flames + aurora glow.
Color palette: ice blue #4a90c8, deep midnight #0a1830, amber torches #d8a040, snow white, dark wood.
Style: Norse mythology painting, cinematic, atmospheric.
[+ univerzální CONSTRAINTS blok]
```

## 13. `indiane`

```
Wide 16:9 Wild West Native American fusion painting.
Sunset over an open prairie — silhouetted totem poles on a distant hill, a dreamcatcher hanging from a branch in the foreground (slightly off-center), tall grass swaying, distant tipis, mountains in distance. Warm golden hour with turquoise sky transitioning. Spiritual, wide-open, peaceful.
Lighting: warm golden sunset, long shadows.
Color palette: ochre #c87830, turquoise sky #4ab0c8, bone white #e8d8a8, warm desert browns, deep sunset red #a04020.
Style: Native American spiritual painting / Wild West concept art, warm, expansive.
[+ univerzální CONSTRAINTS blok]
```

## 14. `africke`

```
Wide 16:9 African savanna painting.
African savanna at dusk — silhouetted baobab trees, distant acacia trees, a small campfire glowing on the right with smoke rising, tribal geometric patterns carved into stones in foreground. Warm earth tones dominate. Spiritual, ancestral, deeply rooted in the land.
Lighting: deep orange sunset sky transitioning to dark earth tones, campfire warm glow.
Color palette: deep ebony #1a0e08, sunset orange #c84818, tribal red #a02810, earth brown #604018, bone white accents.
Style: African concept art, painterly, spiritual.
[+ univerzální CONSTRAINTS blok]
```

## 15. `arabsky-svet`

```
Wide 16:9 Arabian Nights orientalist painting.
Interior of a luxurious Arabian palace — pointed arched windows showing a crescent moon and starry purple-night sky, golden lanterns hanging on chains, deep teal-tiled walls with intricate gold arabesque patterns, burgundy velvet curtains framing the windows, an ornate Persian carpet on stone floor, a hookah with smoke curling, elegant brass vases. NO people.
Lighting: warm golden lantern light + cool moonlight from windows.
Color palette: deep teal #082028, burgundy #6a0820, rich gold #c8900a, purple-night sky #4a1860.
Style: orientalist romantic painting, opulent, mysterious, Arabian Nights aesthetic.
[+ univerzální CONSTRAINTS blok]
```

## 16. `kyberpunk`

```
Wide 16:9 cyberpunk megacity nightscape.
Rain-soaked neon megalopolis at night — towering skyscrapers covered in neon signs (mostly Asian glyphs), flying vehicles in distance, a giant glowing holographic Ikaros bird projection rising between buildings (NOT as a logo — as ambient hologram), wet asphalt reflecting cyan and magenta neon. Dense atmospheric rain.
Lighting: cyan + magenta neon dominates, electric purple sky.
Color palette: deep navy #050810, cyan #00d8e8, magenta #e020c0.
Style: cyberpunk concept art (Blade Runner / Ghost in the Shell influence), atmospheric, wet, neon-drenched.
[+ univerzální CONSTRAINTS blok]
```

## 17. `postapo`

```
Wide 16:9 post-apocalyptic wasteland concept art.
Ruined city in radioactive zone — broken skyscrapers tilting, twisted metal debris, rusted radiation warning signs, dead trees, toxic yellow-green sky with thick smog clouds, ravens circling. Cracked concrete in foreground. Hopeless, desolate, abandoned.
Lighting: sickly diffuse daylight through smog, no sun visible.
Color palette: ash gray #383830, toxic olive-yellow #8a8810, rust orange-brown #7a3810, concrete gray #484840. DESATURATED — no bright colors.
Style: post-apocalyptic concept art (Fallout / The Last of Us influence), gritty, desaturated.
[+ univerzální CONSTRAINTS blok]
```

## 18. `temna-cerven`

```
Wide 16:9 gothic vampire cathedral interior.
Interior of a massive gothic cathedral lit only by blood-red light — towering stone arches, a huge rose window glowing crimson at the rear, dripping black candles in iron candelabras, bats flying near the ceiling, deep pure-black shadows. Vampire aristocracy aesthetic — elegant, dangerous, NOT cheap horror.
Lighting: blood-red glow from rose window + black candle flames, EXTREMELY low-key, mostly black.
Color palette: pure black #050203, blood red #8a0010, bright crimson #c00018, very dim crimson #400008. ABSOLUTELY no other colors.
Style: gothic vampire painting, elegant darkness, cathedral atmosphere.
[+ univerzální CONSTRAINTS blok]
```

## 19. `magie`

```
Wide 16:9 dark wizard's tower interior concept art.
Interior of a sorcerer's sanctum — a robed wizard silhouette in the distance holding a glowing orb, a massive luminous arcane circle/astrolabe rotating slowly behind, a giant purple crystal obelisk in the right of frame, levitating smaller crystals scattered, an open glowing grimoire, candle flames, distant gothic tower windows showing aurora night sky.
Lighting: purple arcane glow dominates + golden candle warmth + cool aurora through windows.
Color palette: deep midnight #060410, vivid arcane purple #8020d0, gold #c8900a, magenta crystal tips #c030a0, teal accent #20a8d0.
Style: dark fantasy mage tower concept art, mystical, painterly.
[+ univerzální CONSTRAINTS blok]
```

## 20. `mesic`

```
Wide 16:9 ethereal moonlit fairy tale fantasy painting.
A massive full silver moon dominating the sky over a fantasy fairy-tale castle silhouette with multiple slim spires, reflective lake in foreground mirroring the moon, blue night flowers (bellflowers/lilies) blooming along the lakeshore, soft waterfalls cascading on left and right, lanterns with warm soft light at the edges, scattered twinkling stars. NO gold tones.
Lighting: cool silver moonlight dominates, occasional warm lantern accents.
Color palette: midnight blue #06091a, silver-white moon #e8f0ff, moonbeam blue #6090e0, deep navy. NO GOLD.
Style: ethereal fantasy moonlight painting, dreamlike, romantic.
[+ univerzální CONSTRAINTS blok]
```

## 21. `slunce`

```
Wide 16:9 ancient solar wasteland concept art.
A massive blazing orange sun dominating the horizon over a desert wasteland — ancient stone monoliths, ruined obelisks, distant pyramid silhouettes, cracked dry earth in foreground, ravens circling in orange sky, distant dragon skull half-buried. Apocalyptic heat, ancient sun-worship civilization. Intense warm tones.
Lighting: blinding solar glow from horizon, deep amber atmosphere everywhere.
Color palette: scorched black #120c04, deep amber-gold #c88010, blazing solar orange #f07818, rust crimson #6a1808. NO BLUE, NO GREEN.
Style: ancient apocalyptic solar civilization painting, hot, dry, painterly.
[+ univerzální CONSTRAINTS blok]
```

---

## Co dělat když GPT vygeneruje něco s UI navzdory promptu

GPT občas přidá HUD/text/panely. V tom případě:
- Zopakuj prompt s důrazem: "I REPEAT — NO user interface, NO text, NO logos, just the environment scene."
- Pokud i pak nepomůže, řekni: "Inpaint and remove all text, panels, and UI elements from the image — replace with continuation of the surrounding environment."

## Až dodáš všech 21

Řekni mi a já:
1. Zkonvertuji PNG → WebP (~250 KB cíl)
2. Optimalizuji rozlišení na 1920×1080
3. Přejmenuji thumbnaily na ASCII slugy (`Modré nebe.png` → `thumbnails/modre-nebe.png`)
4. Vyplním `<id>-bg` cestu do theme registru v kódu
