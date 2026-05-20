# Design audit 6.3 — Hod kostkou ve světovém chatu (`frontend-design`)

**Verze 2 (2026-05-20)** — 3D rolling animace v chatu po rozhodnutí PJ. Předchozí 2D návrh přepsán v sekcích 3 (skin picker preview), 6 (DiceMessage), 9 (motion), 11 (návaznost 10.2j), 12 (rozhodnutí D1).

Výstup `frontend-design` auditu pro krok 6.3. Vstup do §4 specu ([spec-6.3.md](spec-6.3.md)) a do `plan-6.3.md`.

Navazuje na [design-6.1.md](design-6.1.md) (depeše + nit kanálu) a [design-6.2.md](design-6.2.md) (operátorský psací stůl + signature čára). **6.3 rozšiřuje stávající jazyk, ne staví paralelní.**

---

## 1. Koncept 6.3 — „Razítko osudu"

V deníku 6.2 je každá depeše papír — má hlavičku, podpis, případně razítka (NPC, RP datum). 6.3 přidává **razítko osudu** — verdiktovou pečeť, kterou PJ (nebo hráč) přitiskne na depeši svým hodem kostkou. Hod je vizuálně **těžší** než běžná zpráva, protože v RP je to **moment** — sázka, na kterou se čeká, výsledek, který mění příběh.

Klíčová napětí, která jsme řešili:

| Konflikt | Řešení |
|---|---|
| Hod = herní moment vs. zachovat řádkový deník bez bublin | **Tabulka výpočtu inline v zprávě** — kostky vlevo, total vpravo. Žádné karty s borderem (to by trhalo deník). Vsazený panel s `color-mix(--ch-accent 4% transparent)` pozadím = decentní, ale rozpoznatelný. |
| Skin systém (~30 designů × 7 typů kostek) vs. přemalování UI cizími barvami | **Skin barví jen tváře kostek, nikdy ne nit kanálu, signature čáru, akcenty UI.** Nit kanálu z 6.2 zůstává univerzální komunikační vrstva. |
| Vstupní materiál ze starého Matrixu má 3D CSS cube + three.js modely | **Vyhazujeme 3D pro chat.** Skin karty = 2D náhled. Three.js patří 10.2j (mapa). Zachováváme jen styl pickeru a paletu skinů. |
| Picker musí být rychlý (Fate jedním klikem) i bohatý (Pool/Mixed/Skiny) | **Třístupňová architektura**: razítko 🎲 v toolbaru → popover (rychlá volba) → modal (Pool/Skin). Komplexní volby jsou vždy o krok dál, rychlá vždy 1 klik. |
| Default skin core-obsidian (tmavý) vs. potřeba kontrastu na tmavém UI | **Vnitřní glow** — kostka má tmavé tělo, ale glyfy svítí cyan (`#a8d5ff`) s drobným blur glow. Ne neon-rave, ale **CRT terminál pohled**. |

---

## 2. Signature 6.3 — „kruhová pečeť"

6.2 mělo signature čáru pod composerem. **6.3 přidává kruhovou pečeť** vedle podpisu hozené zprávy.

```
[avatar] PJ_Maly · 12:34 · ⊚ k20    ← pečeť 14×14 px, glyf typu kostky
         ↑                ↑
         existující       NOVÉ 6.3
```

- **Pečeť** = kruh 14×14 px, `border: 1px solid --ch-accent`, výplň `color-mix(--ch-accent 18% transparent)`, uvnitř glyf typu kostky (`F` pro Fate, `20` pro k20, `%` pro k%, `M` pro mixed). Font glyfu = `Iceland`, 9 px, `--ch-accent`.
- **Hover na pečeti** → tooltip „Hod k20, Magie +2 → +18" + glow border.
- **Klik na pečeti** → rozbalí/sbalí tabulku výpočtu (užitečné v dlouhém vlákně, kde user chce přehled bez čísel).

📚 **Proč pečeť, ne emoji 🎲?** Emoji je sémanticky šum (každý OS ho rendruje jinak, na desktopu vypadá hračka). Pečeť je **brand element** — sjednocený glyf v Ikaros paletě, čitelný z desktopu i mobilu.

To je věc, kterou si user 6.3 zapamatuje. Skin-agnostická (pečeť žije v `--ch-accent`, ne v barvě skinu).

---

## 3. DicePickerPopover — anatomie

Razítko 🎲 v toolbaru composeru (jako ostatní razítka 6.2: 32×32 kontejner, ikona lucide `Dices` 18 px). Klik → popover **přímo pod razítkem**, ne floating modal.

```
       🎲 ← anchor
       ▼
┌────────────────────────────────────────┐
│  Hodit kostkou                          │
├────────────────────────────────────────┤
│  ╭───╮  ╭───╮  ╭───╮                  │
│  │ F │  │ 4 │  │ 6 │                  │  ← rychlá volba (jen z World.dice)
│  ╰───╯  ╰───╯  ╰───╯                  │
│   Fate   k4    k6                       │
│                                         │
│  ╭───╮  ╭───╮  ╭───╮                  │
│  │ 8 │  │ 10│  │ 12│                  │
│  ╰───╯  ╰───╯  ╰───╯                  │
│   k8    k10    k12                      │
│                                         │
│  ╭───╮  ╭───╮                          │
│  │ 20│  │ % │                          │
│  ╰───╯  ╰───╯                          │
│   k20    k%                             │
├────────────────────────────────────────┤
│  ⊞ Pool…           ⊟ Mixed…            │  ← komplexní hody
├────────────────────────────────────────┤
│  Popis:  [_______________]              │  ← Magie / Vnímání / ...
│  Mod:    [+0]                           │
├────────────────────────────────────────┤
│  ⚙ Vzhled mých kostek                   │  ← otevře SkinPickerPanel
└────────────────────────────────────────┘
```

### Kruhové dlaždice (`DiceTypeChip`)

- 56×56 px desktop, 48×48 px mobil.
- `border-radius: 50%`, `border: 1.5px solid --theme-border-soft`, výplň `--theme-surface-2`.
- Uvnitř glyf typu kostky — `Iceland` 22 px (24 pro k20, 18 pro k%) v `--theme-text-dim`.
- **Hover:** border `--ch-accent`, glyf `--ch-accent`, lift `translateY(-2px)`, `box-shadow: 0 6px 14px color-mix(in srgb, var(--ch-accent) 24%, transparent)`. Drobné `transform: rotate(-3deg) → rotate(3deg)` 600 ms ease (kostka „se rolí pod prstem").
- **Aktivní (po kliku)**: ne — picker zavírá popover a okamžitě posílá. Žádný persistent active state.
- **Disabled (mimo `World.dice`)**: nezobrazí se vůbec. (Žádný „dim disabled" — zbytečně zaplevelí.)

### Sekce „Pool / Mixed"

- Plain text odkazy, ne tlačítka.
- ⊞ / ⊟ ikony 14 px před labelem (lucide `Plus` / `Layers`).
- Hover: text `--ch-accent`, podtržení gradient `transparent → --ch-accent → transparent`.

### Inputs Popis + Mod

- `--input-style-compact` (existující token z 6.2).
- Mod input = 48 px wide, `text-align: center`, monospace, povolen znak `+−` ručně psané (`/^[+-]?\d*$/`).
- Popis a Mod jsou **persistent v rámci popoveru** — pokud user zadá Mod `+2` a pak klikne k20, hod má modifier 2. Po odeslání se Popis/Mod vynulují (jako 6.2 RP date).

### Footer „⚙ Vzhled mých kostek"

- Plain link, ne button. `--theme-text-dim`, hover `--ch-accent`.
- Klik otevře `SkinPickerPanel` jako modal **nad** popoverem (popover zůstává otevřený pod modálem).

### Prázdný stav (`World.dice` = `[]`)

```
┌────────────────────────────────────────┐
│  Hodit kostkou                          │
├────────────────────────────────────────┤
│                                         │
│   ⊘ Pro tento svět nejsou nastaveny     │
│      žádné kostky.                      │
│                                         │
│   [Otevřít nastavení světa →]           │  ← jen PJ/Pomocný PJ
│                                         │
└────────────────────────────────────────┘
```

- CTA tlačítko jen pro `canManageWorld` (PJ/PomPJ). Hráč vidí jen sdělení bez CTA.
- Žádný klientský fallback `['fate','d6','d20']` — rozhodnuto v specu §8.

### Otevření / zavření

- Slide-down 140 ms, `easeOutCubic`, `transform-origin: top center`. `transform: translateY(-8px) scale(0.96) → 0 / 1`.
- Esc / klik mimo / klik na typ kostky → zavře.

---

## 4. PoolPromptModal — anatomie

Otevřený přes „⊞ Pool…" / „⊟ Mixed…" v pickeru. **Modal**, ne popover — komplexní vstup zaslouží plochu.

```
┌──────────────────────────────────────────────────────────┐
│  Hodit více kostek                                    ✕  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│    ╭───────╮       ╭───────╮       ╭───────╮             │
│    │   4   │       │   6   │       │   8   │             │   ← grid 4×2 typy kostek
│    │  k4   │       │  k6   │       │  k8   │             │
│    │ − 0 + │       │ − 2 + │       │ − 0 + │             │
│    ╰───────╯       ╰───────╯       ╰───────╯             │
│                                                          │
│    ╭───────╮       ╭───────╮       ╭───────╮             │
│    │   10  │       │   12  │       │   20  │             │
│    │  k10  │       │  k12  │       │  k20  │             │
│    │ − 0 + │       │ − 0 + │       │ − 1 + │             │
│    ╰───────╯       ╰───────╯       ╰───────╯             │
│                                                          │
│    ╭───────╮       ╭───────╮                             │
│    │   %   │       │   F   │                             │
│    │  k%   │       │ Fate  │                             │
│    │ − 0 + │       │ − 0 + │                             │
│    ╰───────╯       ╰───────╯                             │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Popis: [______________]    Mod: [+0]                    │
│                                                          │
│  ◉ Celkem 3 kostky                                       │
├──────────────────────────────────────────────────────────┤
│                                  [Zrušit]  [Hodit ▸]     │
└──────────────────────────────────────────────────────────┘
```

### Karty typu kostky

- 96×112 px desktop, 88×96 px mobil.
- `--theme-surface-2` pozadí, `border: 1px solid --theme-border-soft`, `--radius-md`.
- Uvnitř: velký glyf typu (`Iceland` 28 px, `--theme-text-dim`), label pod ním (`--font-body` 12 px), stepper `− [count] +` na spodním okraji.
- **Aktivní (count > 0):** border `--ch-accent`, glyf `--ch-accent`, výplň `color-mix(--ch-accent 8% transparent)`. Tlumený glow `box-shadow: 0 0 0 1px color-mix(--ch-accent 30% transparent)`.
- **Disabled (mimo `World.dice`):** `opacity: 0.35`, stepper neaktivní, kurzor `not-allowed`. Tooltip „PJ tento typ kostky pro svět nepovolil".

### Stepper

- 24×24 buttony − / +, mezi nimi count `Iceland` 16 px `--theme-text`.
- Long-press / hold = continuous increment (250 ms repeat) — pro pool 10 kostek user nemusí kliknout 10×.
- Range 0–20 per typ.

### Bottom bar

- „Celkem 3 kostky" — `--font-body` 13 px `--theme-text-dim`. Aktualizováno live.
- **„Hodit ▸"** = primary button, `--ch-accent` background, **disabled při totál = 0**.

### Layout responsivně

- Desktop: grid 3 sloupce × 3 řádky (8 typů + prázdná buňka v rohu).
- Tablet: 3 × 3 (stejné).
- Mobil ≤ 480 px: grid 2 × 4 (8 typů), modal full-screen, sticky bottom bar s „Hodit ▸".

---

## 5. SkinPickerPanel — anatomie

Modal nad pickerem. Otevírá se přes „⚙ Vzhled mých kostek" v pickeru, **nebo** klik pravým na kostku v `DiceMessage` (kontextové menu „Změnit skin pro k20").

```
┌────────────────────────────────────────────────────────────────────┐
│  Vzhled kostek                                                  ✕  │
├────────────────────────────────────────────────────────────────────┤
│  Typ kostky:                                                       │
│  [Výchozí ✓]  [Fate]  [k4]  [k6]  [k8]  [k10]  [k12]  [k20]  [k%]  │  ← chips, scroll-x na mobilu
├──────────────┬─────────────────────────────────────────────────────┤
│              │                                                     │
│  Základní   ▸│   ╭──────╮  ╭──────╮  ╭──────╮  ╭──────╮            │
│  Živelné     │   │   F  │  │   F  │  │   F  │  │   F  │            │
│  Dračí       │   │      │  │      │  │      │  │      │            │
│  Nemrtví     │   │      │  │  ✓  │  │      │  │      │            │  ← ✓ medailonek
│  Příroda     │   │      │  │      │  │      │  │      │            │
│              │   ├──────┤  ├──────┤  ├──────┤  ├──────┤            │
│              │   │ Ivory│  │Obsidi│  │Steel │  │Bone  │            │
│              │   │   ⚜ │  │  ✧  │  │  ⚒  │  │  ☠  │            │  ← ornament
│              │   ╰──────╯  ╰──────╯  ╰──────╯  ╰──────╯            │
│              │                                                     │
│              │   ╭──────╮  ╭──────╮                                │
│              │   │   F  │  │   F  │   …                            │
│              │   │      │  │      │                                │
│              │   ╰──────╯  ╰──────╯                                │
│              │                                                     │
└──────────────┴─────────────────────────────────────────────────────┘
```

### Top bar — Typy kostek

- Chips, `--radius-pill`, height 32 px.
- „Výchozí" = fallback skin pro všechny typy, které nemají vlastní volbu. Default chip vždy první + má ikonku ✓ vlevo když má hodnotu.
- **Aktivní chip:** `--ch-accent` background, `--theme-surface` text. Ostatní `--theme-surface-2` background, `--theme-text-dim` text.
- Pod chip rowem v drobném textu „Vyber skin pro tento typ kostky" (`--font-body` 11 px).

### Sidebar — Kategorie

- Vertikální seznam vlevo, 140 px wide desktop. Mobil: horizontální chips nad gridem (sklouzne nahoru).
- Položky: Základní (core) → Živelné (elemental) → Dračí (draconic) → Nemrtví (undead) → Příroda (nature).
- **Aktivní kategorie:** `border-left: 3px solid --ch-accent`, text `--theme-text`, `--theme-surface-2` background. Ostatní `--theme-text-dim`.
- Vedle názvu malé počítadlo skinů `(8)`, `--theme-text-dim`.

### Skin karta (`SkinCard`) — v2 — 3D cube náhled

```
╭───────────────╮
│   ╭───╮       │
│   │ 20│       │  ← 3D cube náhled (70×70 px), pomalu rotuje
│   ╰───╯       │
│               │
├───────────────┤
│  Ivory Etched │  ← jméno, Cinzel 13 px
│       ⚜       │  ← ornament, 16 px, opacity 0.5
╰───────────────╯
```

- 140×180 px desktop, 110×140 px mobil.
- Tělo: `--theme-surface-2`, `--radius-lg` (8 px), `border: 1px solid --theme-border-soft`.
- Vrchní 2/3 = **3D cube preview** — port z `FateDicePicker.tsx` (SkinCard) + portované modely `<D4Model>`/`<D6Model>`/.../`<FateSkinModel>` dle aktivního „Typ kostky" chipu.
- Idle rotace: pomalu rotuje y-osou 360° / 6 s (cca otáčka za 6 sekund). Hover = rychlejší rotace (360° / 2.5 s) + lift.
- Spodní 1/3 = jméno (`Cinzel` 13 px `--theme-text`) + ornament (`skin.ornamentChar`, `--font-body` 16 px, `--theme-text-dim` opacity 0.5).
- **Hover:** lift `translateY(-3px)`, border `--ch-accent`, `box-shadow: 0 12px 28px color-mix(--ch-accent 22% transparent)`. Drobné `transform: rotate(0.6deg)` (tilt — sběratelská karta) na kartě (ne na cube).
- **Aktivní (vybraná pro daný typ):** border `--ch-accent` 2 px, `box-shadow: 0 0 0 3px color-mix(--ch-accent 12% transparent), inset 0 0 24px color-mix(--ch-accent 6% transparent)`. ✓ medailonek vpravo nahoře (kruh 22 px `--ch-accent`, ✓ uvnitř `--theme-surface`).

⚠️ **3D cube v každé kartě = N canvas instancí.** Pro grid 20 skinů × 3D canvas = drahá scéna. Optimalizace:
- **Jeden sdílený Canvas** přes celý grid (port pattern starého Matrixu — všechny modely v jednom Canvas, pozice per-card).
- Lazy mount kategorie — jen aktivní kategorie má modely v scéně. Změna kategorie = swap.
- Reduced-motion = vypne idle rotaci (kostka stojí static face).

### Layout responsivně

- Desktop: sidebar 140 px + grid `repeat(auto-fill, minmax(140px, 1fr))` × auto rows. Modal 800×600.
- Tablet: sidebar 120 px + grid `minmax(120px, 1fr)`. Modal 90vw × 80vh.
- Mobil ≤ 768 px: sidebar zmizí, kategorie jako horizontální chips nad gridem. Grid `minmax(110px, 1fr)`. Modal full-screen.

### Preload chování

- Při otevření kategorie → `preloadSkin(skin.id)` pro každý skin v kategorii (batch `new Image()`).
- Hover na kartě → idempotentní preload (no-op pokud už cached).
- Při změně „Typ kostky" chipu → preload jen face pro daný typ (ne všechny tváře skinu).

📚 **Proč 2D náhled, ne 3D CSS cube ze starého Matrixu?** Tři důvody: (1) cube vyžaduje rotaci a preview tváře, kterou hráč hodí. To je vícevrstvý DX dluh — různé skiny mají různě připravené tváře (některé jen front, jiné všech 6). (2) 3D cube v 140 px kartě se přemalovává s každou rotací — performance hit. (3) **Hod kostkou je 2D moment v chatu** (settled face). Konzistence: picker ukazuje to, co user uvidí.

---

## 6. DiceMessage — anatomie (v2 — 3D rolling)

Tabulka výpočtu **vsazená do depeše**, ne separátní karta. Drží řádkový charakter deníku 6.2. Místo 2D dlaždic = **3D scéna** (`@react-three/fiber`), která rolí čerstvý hod a usazuje se do settled state.

```
[avatar] PJ_Maly · 12:34 · ⊚ k20                  ← řádek hlavičky (signature pečeť 6.3)
         ┌─ tabulka výpočtu ──────────────────────────────────────┐
         │                                                         │
         │  ╭─ Magie +2 ─╮                                         │  ← label sticker
         │                                                         │
         │  ┌────────────────────────────┐         ┌──────┐       │
         │  │                            │         │      │       │
         │  │  [3D canvas — kostky se    │         │  +3  │       │  ← total
         │  │   točí 1.4 s, pak settled] │         │      │       │
         │  │                            │         └──────┘       │
         │  └────────────────────────────┘                         │
         │                                                         │
         │  součet hodu: +1                  Přetlak ⚡ 1           │
         │                                                         │
         └─────────────────────────────────────────────────────────┘
```

### Container

- Žádný border, jen drobný background panel: `background: color-mix(in srgb, var(--ch-accent) 4%, transparent)`, `--radius-md`, padding 12×16.
- **Levá nit:** `border-left: 2px solid color-mix(--ch-accent 35% transparent)` — slabší než reply nit, ale rozpoznatelná. Drží konzistenci s deníkem.
- Margin-top 4 px od hlavičky zprávy, margin-bottom 0.

### Label sticker (volitelný)

- Pokud `payload.label` neprázdný: `Magie +2`, malý chip.
- `--radius-pill`, `padding: 2px 10px`, background `color-mix(--ch-accent 10% transparent)`, `border: 1px solid color-mix(--ch-accent 30% transparent)`, text `--ch-accent` `Cinzel` 12 px.
- Modifier zobrazený inline za labelem: `Magie  +2`. Záporný `Magie  −1`.
- Pokud label chybí ale modifier ano: jen chip `+2`.

### 3D scéna (`DiceMessageScene`)

- Canvas 280×140 px desktop, 240×120 mobil. `position: relative`, `pointer-events: auto` (kontextové menu pravým klikem).
- **Kamera:** ortografická, lehce shora (10° pitch). Žádná perspektiva — kostky působí jako stojící na podložce, ne v hloubce.
- **Světlo:** `ambientLight` intenzita 0.6 + `directionalLight` shora-šikmo intenzita 0.8 + soft shadow (`shadow-map-size: 256` — levné, dostatečné).
- **Pozadí canvasu:** `<color attach="background" args={['transparent']} />` → canvas dýchá s tmavým container backgroundem.
- **Pozice kostek:** vlevo → vpravo, středy 60 px (desktop) / 52 px (mobil) od sebe. Centrované horizontálně. Pool/Mixed wrap do druhé řady při ≥ 6 kostek.
- **Per kostka komponenta:** dle `payload.type` → `<D4Model>`, `<D6Model>`, `<D8Model>`, `<D10Model>`, `<D12Model>`, `<D20Model>`, `<D100TensModel>`, `<FateSkinModel>`. Props `{ faceValue, skin, phase }`.
- **Skin textura:** `useLoader(THREE.TextureLoader, skin[`d20_${value}Img`])`. Lazy load + cache (idempotentní).

### Fázování (`phase` prop)

#### `phase === 'rolling'` (čerstvý hod ≤ 5 s)

```
t=0 ms:    všechny kostky scale 0.5, opacity 0 → mount in
t=0–1000:  random rotace na 3 osách (~720° celkem)
           + drobný bounce y-axis (kostka „skáče")
t=1000–1400: ease-out interpolace do TARGETS rotace pro výsledek
t=1400+:   settled bounce scale 1 → 1.06 → 1 (240 ms) + glow flash
```

- Stagger mezi kostkami: **80 ms** (poslední kostka domít cca v 1.7–1.8 s).
- `useFrame` v komponentě modelu — `quaternion` interpolace přes lerp / slerp.
- Glow flash při settled = drobný emisivní pulz materiálu (`emissiveIntensity 0 → 0.6 → 0`).

#### `phase === 'settled'` (starší hod nebo reduced-motion)

- Kostky rovnou v TARGETS rotaci pro výsledek (žádná animace).
- Mount fade-in `opacity 0 → 1` 120 ms (60 ms reduced-motion).
- Žádné rotace, žádný bounce, žádný glow flash.

### Glow stav per hodnota (v 3D materiálu)

V settled state model dostane drobný emissive accent dle hodnoty:

- **Fate `+`:** emissive cyan `#22d3ee` × 0.2.
- **Fate `−`:** emissive rose `#f43f5e` × 0.2.
- **Fate blank:** žádný emissive.
- **Generic, hodnota ≥ 75 % max:** emissive cyan × 0.25 (kritický úspěch). Pro k20 = 15–20. Pro k% = 75–100.
- **Generic, hodnota = 1 na k20 / k%:** emissive rose × 0.25 (botch).
- **Mixed:** dle stejných pravidel per typ.

📚 **Proč emissive a ne post-process glow?** Post-process (UnrealBloom) v `@react-three/fiber` je heavy + zatahuje další deps. Emissive material je „free" — výsledek je drobný innenwärmender effekt, ne velký halo. Pro malý canvas v zprávě stačí. (Velký halo by 10.2j řešilo na mapě s post-process.)

### Fallback (statický 2D — `DiceMessageFallback`)

Vykreslen v Suspense fallback + při WebGL load failure + při `prefers-reduced-motion` (rolling odpadá, ale Suspense fallback krátce probleskne — bez pohybu = OK).

```
┌──────────────────────────────────────────┐
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐                    │
│  │ +│ │ −│ │  │ │ +│                    │
│  └──┘ └──┘ └──┘ └──┘                    │
└──────────────────────────────────────────┘
```

- 2D dlaždice 40×40 / 32×32 (jako v původním 2D návrhu).
- `background-image: url(skin[`facePlusImg`])` nebo gradient fallback.
- Žádný motion, žádný glow — fallback je „rezerva", ne plnohodnotný render.
- Reuse styly z původního `DieFace.module.css`.

### Lazy chunk strategie

- `DiceMessageScene` importován přes `React.lazy(() => import('./DiceMessageScene'))`.
- **Preload trigger:** v `WorldChatPage` mount → `requestIdleCallback(() => import('./DiceMessageScene'))`. Chunk se začne stahovat tiše, než user uvidí první dice zprávu.
- Pokud user otevře chat a hned tam je hod, Suspense fallback (statický 2D) se zobrazí na 200–600 ms (network + parse), pak swap na 3D.

### Total box

- Vpravo od tváří, oddělený automatickou mezerou (`margin-left: auto` při dostatku místa, jinak wrap pod tváře na mobilu).
- 72×56 px desktop, 60×48 mobil.
- `border-radius: --radius-md`, `border: 1.5px solid currentColor`, background `color-mix(in srgb, currentColor 8%, transparent)`.
- Total číslo: `Iceland` 32 px desktop / 26 px mobil. Včetně znaku (`+3`, `−1`, `0`).
- **currentColor** = barva podle znaménka:
  - Total ≥ +3: cyan `--dice-positive` + glow `0 0 12px --dice-positive`.
  - Total ≤ −3: rose `--dice-negative` + glow `0 0 12px --dice-negative`.
  - Total v rozsahu −2..+2: bílá `--theme-text` bez glow.
  - Total 0: bílá `--theme-text-dim` (nuda).
- **Flash animace mount:** `transform: scale(0.7) → scale(1.12) → scale(1)`, 320 ms ease-out, delay = `(faces.length × 60ms) + 100ms`.
- Drobný pulz každých 4 s (`opacity 1 → 0.92 → 1`) — total „dýchá", zpráva žije.

### Subtitle (pod tvářemi + totalem)

- Levá strana: „součet hodu: +1" — `--font-body` 11 px `--theme-text-dim` monospace (`Iceland`). Zobrazuje **bez modifieru** — kontrolní hodnota pro PJ.
- Pravá strana: Přetlak — jen pro Fate, jen pokud total ≥ 7. Ikona ⚡ + číslo `Iceland` 13 px, **pulse 1.4 s** glow `--ch-accent`.

### Akce na hover (✎ / 🗑)

- ✎ = **nikdy** (dice edit blokuje BE).
- 🗑 = jen pro PJ/Admin.
- Reakce a reply = standardně dostupné (jako 6.2). Reply na hod = „cituji tvůj hod a komentuji" — zajímavý RP nástroj.

### Pravým klikem na tvář (desktop) → kontextové menu

```
┌────────────────────────────┐
│ Změnit skin pro k20 …      │  → otevře SkinPickerPanel s pre-set typu „k20"
│ Hodit znovu (Fate)         │  → zopakuje hod stejného typu (PJ feature)
│ Kopírovat výsledek         │  → schránka („+3")
└────────────────────────────┘
```

Mobil: long-press na tvář = stejné menu jako bottom-sheet.

---

## 7. Typografie

Display fonty 6.3 jsou **nové** v projektu — load přes Google Fonts:

```css
/* index.html nebo global */
@import url('https://fonts.googleapis.com/css2?family=Iceland&family=Cinzel:wght@500;600&display=swap');

:root {
  /* 6.3 display */
  --font-dice-numeric: 'Iceland', 'Major Mono Display', monospace;
  --font-dice-label: 'Cinzel', 'Cormorant Garamond', serif;
}
```

**`Iceland`** — sci-fi monospaced display Google Font. Použito pro: total v `DiceMessage`, glyfy v `DiceTypeChip` v pickeru a kartách v pool modalu, počty v stepperu, subscript typu v mixed kostkách, „součet hodu" hodnotu a Přetlak číslo, glyf v signature pečeti. **Nikde ne pro body text.** Cca 18 použití.

**`Cinzel`** — distinctive display serif. Použito pro: jméno skinu v `SkinCard`, label chip v `DiceMessage` (`Magie +2`). Drží „sběratelský / kostelní" feel — pasuje k mystickému RPG nátiskem.

Body font (Ikaros default, dědí z platformy) = ostatní text v 6.3 (instrukce, tooltips, popisky).

⚠️ **Pozor: žádný gradient na textu.** Žádný `background-clip: text` cliché. Glow ano (decentní), gradient ne.

📚 **Proč Iceland, ne Inter / Roboto?** Iceland je CRT/sci-fi font s velmi distinctive shapes — `5` a `S` jsou jednoznačné, `0` má slot uprostřed. Pro RPG kostky (kde čitelnost čísla je všechno) je to ideál. Plus ladí s Matrix rain background.

---

## 8. Paleta

```css
:root {
  /* 6.3 dice paleta — žije ve fialovém Ikaros UI, ale akcent kostek = cyan
     (synthwave duál fialová + cyan, kontrast pro "kostkový" moment) */
  --dice-positive:        #22d3ee;   /* cyan — kladné, úspěch, total ≥ +3 */
  --dice-positive-glow:   0 0 12px color-mix(in srgb, var(--dice-positive) 60%, transparent);

  --dice-negative:        #f43f5e;   /* rose (ne čistá rudá — synthwave) — záporné, botch, total ≤ −3 */
  --dice-negative-glow:   0 0 12px color-mix(in srgb, var(--dice-negative) 60%, transparent);

  --dice-zero:            #94a3b8;   /* muted slate — neutrální, Fate blank, total 0 */
  --dice-mixed-subtype:   #a78bfa;   /* světlá fialová pro mixed subscript "d6" / "d20" — odlišení od totalu */

  /* Tabulka výpočtu pozadí v DiceMessage */
  --dice-tray-bg:         color-mix(in srgb, var(--ch-accent) 4%, transparent);
  --dice-tray-rail:       color-mix(in srgb, var(--ch-accent) 35%, transparent);

  /* Default skin (core-obsidian) tile fallback — když chybí textura */
  --dice-tile-bg:         radial-gradient(circle at 35% 25%, #2a2a35, #0a0a14 70%, #000000);
  --dice-tile-border:     #1f1f2a;
  --dice-tile-glyph:      #a8d5ff;
  --dice-tile-glow:       0 0 6px color-mix(in srgb, #a8d5ff 55%, transparent);
}
```

⚠️ **Skin barví jen tváře a glyf uvnitř `DieFace`.** Nit kanálu, signature pečeť, `--ch-accent` zůstávají v Ikaros paletě. Skin = textura kostky, ne theme.

---

## 9. Motion principy (v2 — 3D rolling)

Klíčový moment 6.3 = **3D rolling hodu**. Jeden orchestrovaný moment > deset rozházených micro-interakcí.

| Element | Animace | Trvání | Easing |
|---|---|---|---|
| **3D kostka rolling** (rolling phase) | random rotace 3 osy, ~720° + y-bounce | 0–1000 ms | linear (chaos) |
| **3D kostka settle** (rolling phase) | slerp do TARGETS quaternion pro výsledek | 1000–1400 ms | ease-out cubic |
| **3D kostka settled bounce** | scale 1 → 1.06 → 1 | 240 ms (po settle) | ease-out |
| **3D kostka glow flash** | emissiveIntensity 0 → 0.6 → finální | 240 ms (po settle) | ease-out |
| **Stagger mezi kostkami** | delay 80 ms per kostka | — | — |
| Total v `DiceMessage` | scale 0.7 → 1.12 → 1 + opacity 0 → 1 | 320 ms | `ease-out` |
| Delay totalu | `(faces × 80ms) + 1500ms` (po posledním settle) | — | — |
| Total glow pulse | opacity 1 → 0.92 → 1 | 4 s | linear (loop) |
| Přetlak ⚡ pulse | glow intensity 1.0 → 1.3 → 1.0 | 1.4 s | ease-in-out (loop) |
| Picker open | translateY −8 + scale 0.96 → 0/1 | 140 ms | ease-out-cubic |
| `DiceTypeChip` hover rotate | rotate(-3deg) → rotate(3deg) → rotate(0) | 600 ms | ease |
| `SkinCard` hover | translateY −3 + rotate 0.6deg + shadow | 180 ms | ease-out |
| `SkinCard` idle 3D cube rotation | rotate Y 360° | 6 s (loop) | linear |
| `SkinCard` hover 3D cube rotation | rotate Y 360° | 2.5 s (loop) | linear |
| `SkinCard` active | sustained glow + ✓ medallion | — | — |
| **Settled state mount (history hod)** | opacity 0 → 1 | 120 ms | ease-out |

⚠️ **`prefers-reduced-motion`:**
- `DiceMessage` → phase = `settled` enforced (žádný rolling). Mount fade 60 ms.
- `SkinCard` 3D cube → idle rotace zakázána (kostka stojí static face).
- Pulse loops (total, Přetlak) zakázané.
- Picker open / hover micro-animace degradují na `transition: opacity 80ms`.

📚 **Proč slerp do TARGETS, ne random settle?** Aby kostka ukázala **správnou tvář** odpovídající výsledku z `dicePayload`. Pure random by ukázala náhodnou tvář (a hráč by neviděl deklarovaný výsledek). TARGETS quaternions (`diceTargets.ts`) jsou per typ + per hodnota přepočítané ze starého Matrixu (`DiceLogic.ts`). Slerp z chaotické rotace do cíle = vizuálně „kostka dopadne do dané pozice".

---

## 10. Skin care — vizuální jazyk jednotlivých kategorií

Pět kategorií z `fateDiceSkins.ts` (~30 skinů celkem). Tabulka, jak je vnímat vizuálně — protože když budeme s portováním seškrtávat textury (dluh `D-NEW-dice-texture-trim`), musíme vědět, který skin má jakou „náladu" a v naší paletě sedí.

| Kategorie | Charakter | Reprezentativní skin | UI feedback v Ikaros |
|---|---|---|---|
| **Základní (core)** | Klasické RPG kostky — ivory, obsidian, steel, bone, blackred. Nejvíc textur. | core-obsidian | ✅ default; konzervativní, ladí se vším |
| **Živelné (elemental)** | Oheň, voda, vzduch, země, blesk. Saturated gradient + glow. | elemental-flame | ✅ pro hráče s preferencí dramatu |
| **Dračí (draconic)** | Šupiny, drahokamy, zlato, ohnivý drak. Textury organic. | draconic-emerald | ⚠️ může být zdobné, dobré pro fantasy svět |
| **Nemrtví (undead)** | Kost, vlhká hlína, démonický fialový. Tmavé, „špinavé" textury. | undead-bone | ✅ horror RPG vibe — možnost; tmavý ladí s Ikaros |
| **Příroda (nature)** | Dřevo, kámen, mech, listí. Organic textures. | nature-oak | ✅ Druid / přírodní svět |

⚠️ **Vyhnout se neon-rave skinům.** Pokud port najde skin jako „elemental-rainbow" / „cosmic-trippy" / cokoli s extrémním saturated rainbow — nezahrnujeme. (Z auditu starého Matrixu nic takového nevidím, ale check při portu.)

---

## 11. Návaznost na 10.2j (kostky na mapě) — v2

Co 6.3 design **přenese** do 10.2j (sdílení s mapou):

- ✅ Paleta `--dice-positive` / `--dice-negative` / `--dice-zero`.
- ✅ Fonty `Iceland` / `Cinzel`.
- ✅ Skin systém (data + preloader + `SkinPickerPanel` komponenta).
- ✅ Signature pečeť (kruhový glyf) pro „toto byl hod v mapě".
- ✅ Total flash + glow animace.
- ✅ **Roll engine** (`rollEngine.ts`, `formatMessage.ts`, `dicePayload.ts`) — sdílený mezi chat ↔ mapa.
- ✅ **3D modely** (`models/D*Model.tsx`, `FateSkinModel.tsx`) — sdílené.
- ✅ **TARGETS quaternions** (`diceTargets.ts`) — sdílené.
- ✅ **3D rolling logika** (`RollingDiceScene.tsx`) — extrahovaná v 10.2j do `features/dice/`.

Co 10.2j **nově přidá**:

- ❌ Drag & drop kostky na battle mapu (mouse / touch).
- ❌ Velký 3D canvas full-mapa overlay (cca 800×600), perspektivní kamera, post-process bloom.
- ❌ WS `map:dice-rolled` broadcast — všichni klienti v mapě uvidí stejný hod animovaně, ne jen kreslitel.
- ❌ Fyzika dopadů (cannon-es / rapier) — pokud PJ chce reálnou fyziku na mapě, je to 10.2j; chat 6.3 má procedural rotaci.
- ❌ `DiceJailTray` (vězení skinů — bonus z auditu starého Matrixu).

**Refaktoring v 10.2j:** moduly `features/world/chat/dice/lib/` (engine, skiny, modely, TARGETS) → `features/dice/` (sdílené). Komponentní vrstva `DiceMessageScene` zůstává v chat-specifické složce (orientovaná inline malý canvas), `MapDiceScene` v map-specifické (full-screen orchestrace). Refaktoring je v 10.2j roadmap položce.

---

## 12. Rozhodnutí (uzavřeno během auditu)

| # | Rozhodnutí | Důvod |
|---|---|---|
| ~~**D1**~~ | ~~2D náhled v skin kartě, žádný 3D CSS cube.~~ → **D1' (v2): 3D náhled v skin kartě**, port `FateDicePicker` SkinCard ze starého Matrixu. Jeden sdílený Canvas přes celou kategorii (performance). | Soulad s 3D `DiceMessage`; vstupní materiál už 3D — stripping byl zbytečný. |
| **D2** | **Default skin = core-obsidian**. | Synthwave / dark UI Ikaros; tmavá kostka + cyan glyf = nejlepší kontrast a brand soulad. |
| **D3** | **Iceland** pro číselný total, **Cinzel** pro skin jména / label chip. | Distinctive fonts, ne overused; sci-fi kost vs. sběratelský feel. Žádný gradient text. |
| **D4** | **Signature pečeť** (kruhový glyf vedle podpisu) jako hlavní identifikátor hodu v deníku. | Brand element, OS-konzistentní (ne emoji), klikatelný (toggle tabulky). |
| **D5** | **Tabulka výpočtu inline** v zprávě, ne karta s borderem. | Drží řádkový charakter deníku 6.2, není vytržená cizina. |
| **D6** | **`--dice-positive` / `--dice-negative` cyan + rose**, ne čistá zelená / červená. | Synthwave paleta. Zelená kolide s status indikátory v Ikaros (online), čistá rudá vypadá web-1.0. |
| **D7** | **3D rolling + slerp do TARGETS + glow flash** jako orchestraný moment, ne micro-animace na všem. Reduced-motion → settled state. | „One well-orchestrated moment > deset rozházených". Hod je událost. |
| **D7'** | **Rolling jen ≤ 5 s od `createdAt`**. Starší hod → settled. Žádný WS „roll started" event — každý klient rozhoduje sám dle timestampu. | Konzistence s optimistic send (6.2h), žádná retroaktivní animace při scrollu historie. |
| **D7''** | **Lazy chunk `DiceMessageScene`** + idle preload v `WorldChatPage` mount. Statický 2D fallback při Suspense / WebGL failure / reduced-motion. | Bundle size — `three` + `@react-three/fiber` ~150 KB gzipped nesmí postihnout iniciální load. |
| **D8** | **`prefers-reduced-motion` degradace na opacity-only**, žádný shimmer / pulse loops. | Accessibility default. |
| **D9** | **Skin preview = jedna tvář per aktivní typ kostky chip**. Když user na chip „k20", náhledy se přepnou na d20-style tváří. | Picker ukazuje to co user uvidí v hodu. |
| **D10** | **Pravý klik / long-press na tvář v `DiceMessage`** otvírá kontextové menu (změna skinu / kopírovat). | Power-user feature bez šumu v hlavním UI. |

---

## 13. Otevřené otázky (do `plan-6.3.md`)

Žádné. Audit uzavřel všechny vizuální otázky. Plán může jít na technický „jak to poskládat".
