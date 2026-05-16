# Spec 1.0p — Indiánské visual upgrade

**Status:** ✅ Implementováno
**Datum:** 2026-05-11
**Rozsah:** FE skin upgrade — `[data-theme="indiane"]` izolace, žádný globální dopad
**Repo:** `Projekt-ikaros-FE`, větev `feat/krok-1.0p-indiane-upgrade` (vytvoří se při impl plánu)
**Velikost:** odhad ~3 soubory změna (`index.ts`, `decorations.css`, `public/themes/indiane/`) + 13 nových assetů (všechny dodány a optimalizovány) + dva opravy slug/typo již provedeny
**Autor:** PJ + Claude
**Souvisí:** [spec-1.0o-severske-runy-upgrade.md](spec-1.0o-severske-runy-upgrade.md) (tier-1 structure precedent), [spec-1.0j-hospoda-upgrade.md](spec-1.0j-hospoda-upgrade.md) (wood + iron precedent — explicitně se ODLIŠUJE), [spec-1.0b-theme-visuals.md](spec-1.0b-theme-visuals.md)

**Reference (✅ všechny assety dodány a optimalizovány do `public/themes/indiane/decor/`):**
- `public/themes/backgrounds/indiane.webp` — prairie soumrak s dreamcatcherem visícím z větve vlevo, totemy vpravo na kopci, tipi v dálce, hory, vysoká tráva, dramatická obloha ✅ (existuje, **zachováno**)
- `logo.webp` — tmavá patinovaná dřevěná cedule s vyřezaným tribal cik-cak ornamentem po obvodu, železné rohové studs s nail heads, vlevo kruhový medailon (anděl s křídly v tmavém kruhu), vpravo „Projekt Ikaros" v ornamentálním serif fontu ✅ **user dodal**
- `medailon.webp` — čtvercový dřevěný rám se železnými rohovými brackety + nail studs + carved diamond pattern, černý vnitřek s bílo-krémovou siluetou anděla s velkými křídly ✅ **user dodal**
- `corner-tl.webp` (256×256) — železný L-shaped bracket s 5 nail studs + carved diamond tribal pattern podél obou hran ✅
- `medailon-frame.webp` (800×600) — oválný dřevěný rám se 4 železnými mounting brackety na N/E/S/W pozicích (každý se 3 nail studs), tribal cik-cak carving po obvodu, transparentní vnitřek ✅
- `drum-pictograph.webp` (720×540) — oválná napnutá kůže (cream-tan, přirozené záhyby) s 4 Medicine Wheel pictogramy: vlk (N), orel (E), had (S), bizon (W) + spirálové slunce uprostřed, vše v iron-oxide red ✅
- `icon-*.webp` (7× 96×96) — kruhové carved-oak medailony s tribal cik-cak rim + 4 iron nail studs (N/E/S/W) + centrální pictograph:
  - **uvodnik** — vycházející slunce (prairie gold paprsky + buffalo-blood semicircle)
  - **vytvorit-svet** — tipi (cream cone s crossed poles + malované rudé slunce)
  - **diskuze** — kruh-rada (7 sedících figur kolem ohně)
  - **clanky** — kožený svitek s pictogramy (bizon + sun spiral + ruka)
  - **galerie** — petroglyph na kameni (sun spiral + antilope + hand)
  - **napoveda** — sova (cream tělo, rust-red křídla, prairie-gold oči)
  - **hospoda** — táborový oheň (3 crossed logs + flames)
- `feather-stamp.webp` (96×96) — stylizované orlí pero (rust-red tip → cream střed → dark patina base + 3 sage-turquoise korálky na kožené šňůrce u základny) ✅
- `decor-fire-stones.webp` (1200×300) — kruh 8-10 zvětralých prairie kamenů s ohněm uprostřed, embers, prairie grass tufts, eagle feather ✅
- `petroglyph-divider.webp` (800×80) — vodorovný zvětralý sandstone slab s pecked petroglyfy (sun spiral, buffalo, hand, eagle, antilope) ✅
- [`public/themes/indiane/decor/_asset-prompts.md`](../../../public/themes/indiane/decor/_asset-prompts.md) — asset prompty (✅ použito pro generování)

---

## 0. Princip — Strážci horizontu, prérie před západem

> **Stojíš na vysoké prérijní planině za soumraku. Nad horizontem hoří nebe — žhavé oranžovo-rudé, jako kdyby země sama dýchala oheň. V dálce vidíš siluety totemů na kopci, tipi nad řekou, a dreamcatcher pomalu houpající se na větvi nad tebou. Vítr žene suchou trávu. Daleko od tady, na východě, ještě nevyšlo žádné kolo vozu — západ se sem zatím nedostal. Tahle země ještě patří lidem, kteří chodili po ní tisíc let. Tady se rozhodne, kdo si pamatuje, odkud přišel.**

Skin musí *dýchat tichou posvátnou vážností* — pomalu, kontemplativně, s respektem k zemi. **Není to romantický „western"**, není to historická knížka — je to vzpomínka na svět, který existoval, než byl rozparcelován.

**Inspirační kotvy:** *Howard Terpning* (Plains-Indian paintings) × *Frank Frazetta* prairie scenes × Lakota / Cheyenne / Dakota tradiční umění (winter counts, ledger art, pictograph hides) × *Dances with Wolves* (Costner, 1990) buffalo plain cinematography × Stardew Valley journal artwork (organická melancholie) × Anasazi / Fremont rock art × *The Revenant* (Iñárritu, 2015) prairie light.

**NE** Hollywood western / saloon / cowboy / kovbojský klobouk (`hospoda` je krčma, ne saloon). **NE** Disney Pocahontas / Hollywood Indian stereotype (žádné nadměrné peří, žádné válečné dekorace). **NE** kreslený totemový pán / Looney Tunes. **NE** „tribal tattoo" maori/polynéský pattern (Lakota-Cheyenne má svůj vlastní geometrický jazyk: cik-cak + diamondy, ne spirály). **NE** neon turquoise (`#5fc8d0` je tlumená šalvějová, ne svítící). **NE** generická D&D pergamen estetika (`pergamen` je studovna). **NE** spagheti western prairie (Sergio Leone). **NE** výrazně tmavá ossuary (`nemrtvi`). **NE** brass + burgundy (`hospoda`). **NE** royal gold + black (`zlaty-standard`). **NE** Marvel Black Panther (Wakanda — africké). **NE** politicky necitlivá karikatura.

**Strict isolation:** vše scoped přes `[data-theme="indiane"]`. Zbylých 21 témat = nulová regrese. (Memory rule: žádné sdílení / recyklace ornamentů s ostatními skiny — indián má vlastní vizuální slovník: tribal cik-cak diamondy, Medicine Wheel pictogramy, korálkové stringy, kožené texture, petroglyfy.)

---

## 1. Cíl

Po `themeId === 'indiane'` má dashboard vypadat jako **prérijní planina za soumrakem se Strážci horizontu**: tmavé pálené zemité pozadí (`#2a1208`) prosvítající skrze ručně vyřezané dřevěné panely, **patinované dřevěné side panely s tribal cik-cak carved okraji**, **železné rohové brackety + nail studs ve všech 4 rozích každého panelu** (master TL mirror přes CSS), **welcome card jako oválný šamanský buben** (aspect ~1.4:1, ne čistý kruh — text se musí vejít) v dřevěném `medailon-frame` rámu se 4 N/E/S/W mounting brackety, **uvnitř bubnu napnutá kožená kůže s 4 Medicine Wheel pictogramy** (vlk N / orel E / had S / bizon W + spirálové slunce uprostřed) jako pozadí pod text vrstvou s opacity ~0.35, **decor-fire-stones jako warm decor pruh dole** (analogicky hospoda decor-table-clutter — kruh kamenů s ohněm), **petroglyph-divider mezi sekcemi panelů** (sandstone slab s pecked petroglyfy), **7 carved-oak nav medailonů** s pictogramy (rising sun / tipi / council circle / scroll / petroglyph / owl / campfire) — idle wood + iron rivets, hover = warm gold glow, active = **stoupající kouř + řada korálků jako left-border**, **vznášejí se konstelace nad horizontem** v noční části BG (5-7 CSS dots, opacity ~0.4, statické), **subtle bead-string visící z topbaru** (CSS-only inline SVG, lehký sway 8s), **drum-beat pulse welcome card** (10s scale 1.000→1.005 — tlukoucí srdce kmene), **hearth glow zdola** (8s breathe, warm orange ze středu prairie ohně). Pravý panel = **ADMINISTRACE** (skin selector + uživatelé NAHOŘE — odchylka od mockupů, z memory `project_admin_panel_decision.md`) + **MOJE DISKUZE / MOJE SVĚTY** (uprostřed). Top bar zjednodušený: **Pošta + Tyky + Odhlásit** (Uživatelé + Skin selector přesunuty do pravého panelu). **Cinzel Decorative** logo + **Cinzel** nav UPPERCASE + **Spectral** body + **Caveat italic** signature v sage-turquoise. Vše izolované, bez dopadu na ostatní skiny.

---

## 2. Kontext / motivace

- Severské runy (1.0o) zavedly naposled tier-1 produkční skin (Carved Saga mead-hall). **Indián je 13. ve „tier-1 produkční kvalitě"** — Prairie-Sacred aesthetic jako vizuální opozit `hospoda` (warm tavern wood + brass + burgundy) i `severske-runy` (cold mead-hall wood + iron + ice-blue). Plně využívá **dual akcent** (buffalo-blood + prairie-gold + tlumená sage-turquoise pro „posvátné momenty" — vítaný text a signature) — vyhne se kolizi s `priroda` (emerald + gold) a `nemrtvi` (teal-green ghost-pulse).
- Současný [`decorations.css`](../../../src/themes/themes/indiane/decorations.css) má jen 15 řádků stub (background tint + 4px card border-radius). Skin viditelně neodlišený — vypadá jako varianta default tématu.
- Současný [`index.ts`](../../../src/themes/themes/indiane/index.ts) má základní tokens (oranžovo-hnědá paleta, Rye logo font, Lora body). **Rye je saloon-western font, off-brand vůči „prérii před západem"** — vizuální nesoulad. Q-typografie uživatel vybral **Cinzel Decorative + Cinzel + Spectral + Caveat** (Carved & Spoken). Chybí materiálové tokens (wood, iron, leather, bone, sage), chybí asset URLs.
- Stará dokumentace [`docs/themes/indiane.md`](../../themes/indiane.md) popisuje **frontier hybrid Wild West** (saloon, kovbojové, kapesní hodinky, hrací karty). **User explicitně odhodil** tento směr ve prospěch čisté prérijní indiánské kultury *před* příchodem západu (souhlas dán 2026-05-11). Doc se uzavře v post-implementaci.
- User dodal logo + medailon (založené na ručně-carved tribal styling) — oba ve stylu tmavé patinované dřevo + železné rohové studs + tribal cik-cak diamond carving. 13 AI assetů vygenerovaných v ChatGPT (DALL-E 3) drží stejný stylistický slovník — vizuální konzistence balíku je dokonalá (audit hotov).
- Po dokončení bude **13 skinů** s „asset-grade" upgradem (zlatý standard, sci-fi, bílá, modré nebe, vesmírná loď, příroda, pergamen, hospoda, nemrtví, temná červeň, čtyři živly, vesmírná bitva, severské runy, indián) → projekt bližší dokončené Fázi 1.

---

## 3. Audit současného stavu

### 3.1 Theme registry & tokens
- [`src/themes/themes/indiane/index.ts`](../../../src/themes/themes/indiane/index.ts) — existuje, definuje základní paletu (`#d4a870` warm leather BG, `#97460c` accent, `#208080` info turquoise), fonty Rye + Lora. **Nutné kompletní přepsání palety + fontů + tokens** podle Q&A rozhodnutí:
  - Paleta: burnt-earth `#2a1208`, wood-dark `#3a1e08`, wood-mid `#5a3318`, wood-highlight `#8a5828`, iron-stud-dark `#1a1410`, buffalo-blood `#c8501c`, buffalo-bright `#e86028`, flame `#ff8030`, prairie-gold `#d4a050`, prairie-gold-bright `#f0c870`, sage-turquoise `#5fc8d0`, sage-turquoise-deep `#3a8088`, cream-leather `#f0e0c0`, bone-white `#e8d8b8`
  - Fonty: **Cinzel Decorative** (logo fallback), **Cinzel** (display/nav), **Spectral** (body), **Caveat** (signature italic). Rye se odstraní (saloon-western, off-brand).
- Asset URL proměnné chybí — nutné přidat (`--asset-logo`, `--asset-medailon`, `--asset-corner`, `--asset-medailon-frame`, `--asset-drum-pictograph`, 7× `--asset-icon-*`, `--asset-feather-stamp`, `--asset-fire-stones`, `--asset-petroglyph-divider`).

### 3.2 Decorations
- [`src/themes/themes/indiane/decorations.css`](../../../src/themes/themes/indiane/decorations.css) — 15 řádků, jen background gradient + 4px card border-radius. **Žádné panely, žádné NavItem styly, žádné dekorace, žádné mikrointerakce.** Skin viditelně nedokončený. **Nutné kompletní přepsání** dle struktury hospoda / severske-runy / nemrtvi (~800–1000 řádků).

### 3.3 Asset folder
- `assets-source/themes/indiane/` — ✅ existuje s 15 soubory (přejmenován z `indiani` během 1.0p přípravy, typo `rum-pictograph.png` → `drum-pictograph.png` opraveno)
- `assets-source/themes/backgrounds/indiane.png` — ✅ existuje
- `public/themes/backgrounds/indiane.webp` — ✅ existuje (prairie soumrak)
- `public/themes/indiane/decor/` — ✅ vytvořeno, 15 webp + `_asset-prompts.md` (po `npm run themes:optimize` + `node scripts/finalize-indiane-assets.mjs`)

### 3.4 Předchozí stručný design doc
- [`docs/themes/indiane.md`](../../themes/indiane.md) — staří **odhozený** vize (frontier hybrid Wild West). Bude přepsán post-implementace.

### 3.5 Hospoda + Severské runy jako pattern předlohy
- [`src/themes/themes/hospoda/decorations.css`](../../../src/themes/themes/hospoda/decorations.css) — 913 řádků, **wood + iron + brass + burgundy + parchment** materiály
- [`src/themes/themes/severske-runy/decorations.css`](../../../src/themes/themes/severske-runy/decorations.css) — 649 řádků, **wood + iron + bronze + ice-blue + stone** materiály
- [`src/themes/themes/nemrtvi/decorations.css`](../../../src/themes/themes/nemrtvi/decorations.css) — 955 řádků, **iron + bone + ghost-teal** materiály
- **Indiánský použije stejnou strukturu** (sekce 1–22), ale s vlastní materiálovou a ornamentální paletou (**wood + iron + leather + bead + petroglyph stone + bone**). Nesdílí žádný ornament s předchozími — má svůj vlastní vizuální slovník (tribal cik-cak diamond carving, Medicine Wheel pictogramy, korálkové stringy).

### 3.6 Memory & projekt-level rozhodnutí
- `project_admin_panel_decision.md` — Uživatelé + skin selector v ADMINISTRACE (pravý panel) → **odchylka od mockupů, indián potvrzuje**
- `feedback_theme_isolation.md` — všechny edity scoped na `[data-theme="indiane"]`, **žádné globální ani shared CSS edity bez souhlasu**
- `feedback_skin_originality.md` — ornamenty musí být originální, **žádné sdílení s ostatními skiny**
- `feedback_workflow.md` — povinný workflow: spec → souhlas → impl. plán → souhlas → kód
- `feedback_frontend_design_audit.md` — frontend-design skill jako audit (✅ hotovo v konverzaci 2026-05-11)

---

## 4. Návrh řešení

### 4.1 Background & atmosféra

- **Background image** — `/themes/backgrounds/indiane.webp` (✅ existuje, prairie soumrak, **neměníme**)
- **Atmosférický overlay** — pure linear darken pro čitelnost UI (background je už warm/oranžový, jen mírné dodání kontrastu):
  ```css
  '--theme-bg-overlay':
    'linear-gradient(180deg, rgba(26, 12, 4, 0.45) 0%, rgba(26, 12, 4, 0.65) 100%)'
  ```
- **🎨 Hearth glow zdola** (signature element, breath of prairie fire):
  - `[data-theme="indiane"][data-shell="ikaros"]::after` — radial-gradient warm flame záře zespoda obrazovky
  - `background: radial-gradient(ellipse at 50% 100%, rgba(255, 128, 48, 0.30) 0%, rgba(200, 80, 28, 0.14) 35%, transparent 65%);`
  - `height: 60vh; mix-blend-mode: screen;`
  - `animation: indiane-hearth-breathe 8s ease-in-out infinite;` — opacity 0.55 → 1.0 → 0.55 (efektivně 0.16 → 0.30 reálné opacity — „země dýchá oheň")
  - `pointer-events: none; z-index: 0;`
  - **Reduced-motion vypíná** (sekce 4.13)
- **🎨 Constellation overlay** (statické CSS dots nad horizontem):
  - 5–7 prairie-gold (`#d4a050`) tečky s `radial-gradient` na fixed pozicích v top třetině obrazovky, opacity 0.4
  - Žádná animace — „mikro-easter-egg pro pozorné"
  - `position: fixed; pointer-events: none; z-index: 0;`
  - Skryto na mobile (≤768px) — vyrušuje na malé obrazovce

### 4.2 Topbar (slim, 56px) — patinované dřevo + tribal hairline

- Pozadí: tmavý gradient bez transparency (page-chrome je neprůhledný, vyřezané dřevo gravitas):
  ```css
  background:
    linear-gradient(180deg, #3a1e08 0%, #2a1208 100%),
    repeating-linear-gradient(
      90deg,
      transparent 0,
      transparent 40px,
      rgba(90, 51, 24, 0.10) 40px,
      rgba(90, 51, 24, 0.10) 41px
    );
  ```
  (subtle wood-grain texture vertikálními pruhy à la 40px)
- **Žádný backdrop-filter** (heavy carved wood, žádné prosvítání)
- **Prairie-gold hairline** pod topbarem (1px, gradient `transparent → #d4a050 → transparent`, opacity 0.55, `filter: drop-shadow(0 0 4px var(--theme-glow-gold))`)
- Logo vlevo z `logo.webp` (horizontal banner s baked-in textem): šíře `--asset-logo-w: 360px` desktop / `280px` tablet / `220px` mobile
- Pravé tlačítka (POŠTA, TYKY, ODHLÁSIT — zjednodušeno, Uživatelé + Skin selector se přesunou do pravého panelu) = **dřevěné cedule s prairie-gold okrajem**:
  - Background: `linear-gradient(180deg, #3a1e08 0%, #2a1208 100%)`
  - Border: 1px wood-mid `#5a3318`
  - Text: prairie-gold `#d4a050` uppercase **Cinzel**, letter-spacing 0.12em
  - Hover: border → prairie-gold-bright `#f0c870`, text → cream-leather `#f0e0c0`, warm gold glow `0 0 14px var(--theme-glow-gold-strong)`
- **Mobile (≤768px)**: ikony only, label hidden přes `aria-label`
- **Mobile (≤480px)**: TYKY + ODHLÁSIT do hamburger drawer (existující pattern)

### 4.3 Sidebar levý — NAVIGACE / VESMÍRY / CHAT

- Frame: tmavá patinovaná dřevěná deska s **iron nail studs ve 4 rozích**:
  - Background: `linear-gradient(160deg, rgba(58, 30, 8, 0.92) 0%, rgba(42, 18, 8, 0.96) 100%)`
  - Border: 1px wood-mid `#5a3318`
  - Box-shadow inner: 1px wood-highlight `rgba(138, 88, 40, 0.18)` (subtle inner rim)
  - Box-shadow outer: deep `0 6px 22px rgba(26, 12, 4, 0.65)`
- **Corner ornament** — `corner-tl.webp` na všech 4 rozích (master TL, mirror přes CSS `transform: scaleX(-1) / scaleY(-1)` na ostatní 3 rohy):
  - Size: 80×80px desktop, 56×56px tablet, 40×40px mobile
  - `position: absolute; pointer-events: none; z-index: 1; filter: drop-shadow(0 1px 2px rgba(26, 12, 4, 0.6));`
- **Section titles** ("NAVIGACE", "VESMÍRY", "CHAT") — **Cinzel** uppercase, prairie-gold s text-shadow:
  ```css
  color: var(--theme-prairie-gold);
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.16em;
  text-shadow: 0 1px 2px rgba(26, 12, 4, 0.7);
  ```
  + **petroglyph-divider** asset jako `::after` pseudo pod section title (place of beer-foam u hospody):
  - `background-image: var(--asset-petroglyph-divider); height: 12px; opacity: 0.85;`
  - margin 4px nad/pod
- **NavItem** ([class*="btn3d"]) — vyřezávané dřevěné cedulky s iron border + prairie-gold text:
  - Idle: dark wood gradient + 1px wood-mid border + prairie-gold text + subtle inner rim glow
  - Hover: warm gold glow `0 0 12px var(--theme-glow-gold)`, text → prairie-gold-bright `#f0c870`, `translateY(-1px)` lift
  - **Active** ([class*="btn3dActive"], [class*="navItemActive"]):
    - Background: `linear-gradient(90deg, rgba(200, 80, 28, 0.45) 0%, rgba(58, 30, 8, 0.85) 100%)` (buffalo-blood washy gradient)
    - **🎨 ORIGINÁL — Left-border = řada korálků** (CSS radial-gradient pattern, ne plná linka):
      ```css
      &::before {
        content: '';
        position: absolute;
        left: 0; top: 4px; bottom: 4px;
        width: 4px;
        background:
          radial-gradient(circle at 50% 6%,  var(--theme-bead-red)       1.5px, transparent 2px),
          radial-gradient(circle at 50% 18%, var(--theme-bead-turquoise) 1.5px, transparent 2px),
          radial-gradient(circle at 50% 30%, var(--theme-bead-gold)      1.5px, transparent 2px),
          radial-gradient(circle at 50% 42%, var(--theme-bead-cream)     1.5px, transparent 2px),
          /* opakuje se vertikálně */
          ...
      }
      ```
      — barvy: buffalo-blood `#c8501c`, sage-turquoise `#5fc8d0`, prairie-gold `#d4a050`, cream-leather `#f0e0c0` v cyklu
    - **🎨 ORIGINÁL — Spirit smoke ze active nav** (`::after` pseudo, místo brass-sweep / candle-flicker):
      ```css
      &::after {
        content: '';
        position: absolute;
        left: 50%; bottom: 100%;
        width: 40px; height: 30px;
        background: linear-gradient(180deg, rgba(240, 224, 192, 0.18) 0%, transparent 100%);
        filter: blur(8px);
        transform: translateX(-50%) translateY(0);
        animation: indiane-spirit-smoke 6s ease-out infinite;
        pointer-events: none;
      }
      @keyframes indiane-spirit-smoke {
        0%   { transform: translateX(-50%) translateY(0)    scale(1);   opacity: 0.6; }
        70%  { transform: translateX(-50%) translateY(-20px) scale(1.4); opacity: 0.2; }
        100% { transform: translateX(-50%) translateY(-30px) scale(1.6); opacity: 0;   }
      }
      ```
    - Text: cream-leather `#f0e0c0`, glow `0 0 8px var(--theme-glow-gold)`
- Touch target ≥48px mobile

### 4.4 Sidebar pravý — ADMINISTRACE „high seat" + Moje diskuze / Moje světy

- **Order (odchylka od mockupů, dle Q-admin uživatel + memory `project_admin_panel_decision.md`):**
  1. **ADMINISTRACE** (nahoře):
     - Section title „ADMINISTRACE" v prairie-gold Cinzel + petroglyph-divider
     - **Skin selector** (ThemeSwitcher) — patinované dřevo button s prairie-gold border + caret, hover gold glow
     - **Uživatelé** — link/button stejný styling
  2. **MOJE DISKUZE** (uprostřed) — sekce s navigations + „+" přidat tlačítko (feather-stamp asset)
  3. **MOJE SVĚTY** (níže) — sekce s navigations + „+" přidat tlačítko (feather-stamp asset)
  4. **OBLÍBENÉ ČLÁNKY** + **OBLÍBENÉ OBRÁZKY** (zachováno z hospoda)
- Frame: stejný jako sidebar levý (patinované dřevo + 4× corner-tl)
- **„+" tlačítka** (rightAddBtn):
  - Background: `linear-gradient(180deg, rgba(200, 80, 28, 0.55) 0%, rgba(58, 30, 8, 0.85) 100%)` (buffalo-blood)
  - Border: 1px prairie-gold-bright `#f0c870`
  - **`::before` pseudo s feather-stamp.webp** (28×28px):
    ```css
    background-image: var(--asset-feather-stamp);
    margin-right: 8px;
    transition: transform 150ms ease;
    ```
  - Hover: brighter buffalo + gold glow, feather rotuje `transform: rotate(8deg)` při hover
  - Active: feather scale 0.92 (klik feedback)
- **Empty hints** ("Žádné diskuze") — **Caveat italic** v sage-turquoise `#5fc8d0`, opacity 0.7, font-size 13px

### 4.5 Welcome card — Šamanský buben (oval, ne kruh)

- **Material:** napnutá kožená kůže + dřevěný oválný rám `medailon-frame.webp` (4× nail stud brackety na N/E/S/W)
- **Tvar:** oval, `aspect-ratio: 1.4 / 1`, `border-radius: 50%` (s aspect ratio = oval)
  - `min-height: clamp(420px, 60vh, 720px)` desktop
  - Padding: 40px vertikální, 80px horizontální (text se musí vejít)
- **Background — vrstvy** (z dolu nahoru):
  1. Cream-leather base `#f0e0c0` (napnutá kůže)
  2. `background-image: var(--asset-drum-pictograph)` (4 Medicine Wheel pictogramy + sun spiral) — **opacity 0.45** přes CSS `mask` nebo `::before` pseudo, aby text byl čitelný přes ně
  3. `background-image: var(--asset-medailon-frame)` jako outer frame (overlay)
- **🎨 ORIGINÁL — Drum-beat pulse** (10s scale, tlukoucí srdce kmene):
  ```css
  animation: indiane-drum-beat 10s ease-in-out infinite;
  @keyframes indiane-drum-beat {
    0%, 100% { transform: scale(1.000); }
    50%      { transform: scale(1.005); }
  }
  ```
- **Text styling uvnitř bubnu:**
  - **welcomeTitle** ("Vítej v Projektu Ikaros.") — **Cinzel** weight 600, color `#2a1208` (dark text na světlé kůži), text-shadow `0 1px 0 rgba(255, 240, 200, 0.4)`
  - **titleAccent** ("Projektu Ikaros.") — **Cinzel Decorative**, color sage-turquoise `#5fc8d0` (souznění s mockupem)
  - **paragraph** (2 odstavce) — **Spectral** color `#3a1e08`, line-height 1.7
  - **signature** ("Příjemnou zábavu přeje administrátor.") — **Caveat** italic, color sage-turquoise `#5fc8d0`, font-size 22px, text-align center
- **Box-shadow** — deep wood frame shadow:
  ```css
  box-shadow:
    inset 0 0 0 1px rgba(90, 51, 24, 0.30),
    inset 0 0 60px rgba(90, 51, 24, 0.10),
    0 16px 40px -8px rgba(26, 12, 4, 0.85),
    0 24px 60px -12px rgba(26, 12, 4, 0.55);
  ```
- **Prairie-gold hairline** pod welcomeTitle (jako knižní pravítko):
  ```css
  &::after {
    content: '';
    display: block;
    margin-top: 10px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--theme-prairie-gold-bright), transparent);
    opacity: 0.6;
  }
  ```

### 4.6 Heraldický medailon (mimo welcome buben — header logo to už pokrývá)

- `--asset-andel-medallion` = `medailon.webp` (čtvercový rám s andělem)
- **Použití**: pouze fallback / případný overlay kdyby `[data-andel-medallion]` div existoval v některém layoutu (zachováno pro budoucí use)

### 4.7 Decor — Fire stones (warm decor pruh dole)

- Element: `[data-frame-panel="dashboard"]::before` nebo `body::after` (zjistit existující slot v shell — patrně přes `[data-decor="bottom"]`)
- Asset: `decor-fire-stones.webp` (1200×300, transparent)
- Position: `fixed`, `bottom: 0`, `left: 50%`, `transform: translateX(-50%)`, `width: 1200px`, `max-width: 100vw`, `height: 300px`, `pointer-events: none`, `z-index: 1`
- Opacity: 0.85 (subtle ale viditelné)
- **Mobile (≤768px)**: skryto NEBO výška snížena na 180px

### 4.8 PJ badge

- **Kožený štítek** s vyšitým „PJ" stitch pattern:
  - Background: `linear-gradient(180deg, var(--theme-prairie-gold-bright), var(--theme-prairie-gold))`
  - Color: `#2a1208` (dark on gold)
  - Border: 1px wood-mid `#5a3318`
  - Box-shadow: `0 0 8px var(--theme-glow-gold), inset 0 0 0 1px var(--theme-buffalo-blood), inset 0 1px 0 0 rgba(255, 240, 200, 0.30)`
  - Font: Cinzel weight 700, letter-spacing 0.10em

### 4.9 Nav ikony — 7 carved-oak medailonů

- `[data-theme="indiane"] [data-nav-key] [class*="navItemIcon"]` styling:
  - Width/height: 22px desktop, 18px mobile
  - `background-size: contain; background-repeat: no-repeat; background-position: center;`
  - `filter: drop-shadow(0 0 3px var(--theme-glow-gold));`
- Mapping přes `data-nav-key`:
  ```css
  [data-nav-key="uvodnik"]       → var(--asset-icon-uvodnik)
  [data-nav-key="vytvorit-svet"] → var(--asset-icon-vytvorit-svet)
  [data-nav-key="diskuze"]       → var(--asset-icon-diskuze)
  [data-nav-key="clanky"]        → var(--asset-icon-clanky)
  [data-nav-key="galerie"]       → var(--asset-icon-galerie)
  [data-nav-key="napoveda"]      → var(--asset-icon-napoveda)
  [data-nav-key="hospoda"]       → var(--asset-icon-hospoda)
  ```
- Lucide SVG ikony skryty: `[class*="navItemIcon"] svg { display: none; }`

### 4.10 Bead-string visící z topbaru (CSS-only sway)

- **🎨 ORIGINÁL — bead-string sway** (alternativa hospoda lustru, severske rune-circle-floor):
  - `[data-theme="indiane"][data-shell="ikaros"] > header::before` pseudo
  - Krátký řetízek 12 korálků (red/turquoise/gold/cream cyklus) visící z bottom-left rohu topbaru
  - Implementace: inline SVG `data-uri` v `background-image` nebo CSS-only `radial-gradient` stack vertikálně
  - Sway animation `8s ease-in-out infinite`, rotation `-2deg → +2deg → -2deg`
  - `transform-origin: top center;`
  - **Skryto na mobile (≤768px)** (vyrušuje na úzké)
- Position: absolute, top of viewport, left ~24px (sloup vlevo od logo)

### 4.11 Novinky panel (dole)

- Background: stejný jako welcome buben (napnutá kůže) **NEBO** patinované dřevo se subtle kožený insert
  - Rozhodnutí: patinované dřevo (sjednocení s panely), text v cream-leather `#f0e0c0`
- Title „Novinky" — **Cinzel** color buffalo-blood `#c8501c` weight 600, text-shadow subtle
- Empty hint — **Caveat italic** v sage-turquoise opacity 0.7
- „Přidat novinku" tlačítko = stejný style jako rightAddBtn (feather-stamp::before)

### 4.12 Section titles + petroglyph-divider

- Section title typo: **Cinzel** UPPERCASE, color prairie-gold, letter-spacing 0.16em
- `::after` pseudo s petroglyph-divider.webp (height 12px, opacity 0.85, position pod title)

### 4.13 Animace inventář & reduced-motion

**Celkem 4 ambient + 1 click-feedback:**

| # | Animace | Element | Trvání | Reduced-motion |
|---|---------|---------|--------|----------------|
| 1 | hearth-breathe | `::after` shell pseudo | 8s ease-in-out infinite | vypnout (statická opacity 0.7) |
| 2 | drum-beat | welcome card | 10s ease-in-out infinite | vypnout (scale 1.000 fixed) |
| 3 | bead-string-sway | topbar `::before` | 8s ease-in-out infinite | vypnout (rotation 0deg fixed) |
| 4 | spirit-smoke | active nav `::after` | 6s ease-out infinite | vypnout (opacity 0 = neviditelné, neutralní fallback) |
| 5 | smoke-click-feedback | `:active::before` | 1s fade out | vypnout (žádný feedback) |

**Reduced-motion media query:**
```css
@media (prefers-reduced-motion: reduce) {
  [data-theme="indiane"] *,
  [data-theme="indiane"][data-shell="ikaros"]::after,
  [data-theme="indiane"][data-shell="ikaros"] > header::before,
  [data-theme="indiane"] [data-frame-panel="card"],
  [data-theme="indiane"] [class*="btn3dActive"]::after,
  [data-theme="indiane"] [class*="navItemActive"]::after {
    animation: none !important;
    transition: none !important;
  }
}
```

### 4.14 Scrollbar styling

- Track: dark wood `var(--theme-wood-dark)` `#3a1e08`
- Thumb: prairie-gold `var(--theme-prairie-gold)` `#d4a050`, border-radius 4px, width 8px
- Stitch dots pattern (kožený detail): TBD — pokud jednoduché, jinak skip

### 4.15 Focus visible (a11y)

- Outline: `none` (replaced by box-shadow ring)
- Box-shadow: `0 0 0 2px var(--bg-primary), 0 0 0 4px var(--theme-buffalo-bright), 0 0 14px var(--theme-glow-buffalo)`
- Applied to: nav items, btn3d, headerBtn, rightAddBtn, addBtn, showAllLink

### 4.16 Forced colors (Windows high contrast)

- Welcome buben, corner-tl, nail studs, nav ikony, bead-string, petroglyph-divider, decor-fire-stones: `forced-color-adjust: none` aby vypadaly v high contrast normálně

---

## 5. Mobile degradace (≤768px)

- **Welcome buben** → obdélník s `border-radius: 24px`, animation drum-beat **vypnuto** (vyrušuje na malé obrazovce při scrollu)
- Pictogramy uvnitř bubnu — **drum-pictograph background opacity snížena na 0.25** (mobile menší šíře = text by jinak nečitelný)
- Corner-tl → 40×40px (z 80×80px desktop)
- Bead-string sway → **skryto** (vyrušuje na úzké)
- Hearth glow → height 30vh (z 60vh)
- Constellation overlay → **skryto**
- Decor-fire-stones → height 180px (z 300px) NEBO skryto pro ≤480px
- Touch target min-height 48px na nav items
- Header buttons → icon-only, label hidden
- Logo width → 220px (z 360px desktop)
- `--frame-pad-x: 12px` (z 18px)
- Petroglyph-divider → výška 8px (z 12px)

---

## 6. A11y & contrast audit

| Kombinace | Ratio | Status |
|-----------|-------|--------|
| `#2a1208` BG × `#f0e0c0` cream-leather text | ~9.5 | ✅ AAA |
| `#2a1208` BG × `#d4a050` prairie-gold text | ~5.5 | ✅ AA |
| `#2a1208` BG × `#c8501c` buffalo accent | ~4.2 | ✅ AA Large (18px+ / bold) |
| `#2a1208` BG × `#5fc8d0` sage-turquoise | ~7.2 | ✅ AAA |
| `#f0e0c0` welcome bg × `#2a1208` dark text | ~14.0 | ✅ AAA |
| `#f0e0c0` welcome bg × `#5fc8d0` sage accent | ~1.8 | ⚠️ POUZE pro dekorativní (signature italic ≥22px) |
| `#3a1e08` panel × `#d4a050` gold text | ~4.6 | ✅ AA |

**Klíčové:** sage-turquoise `#5fc8d0` na cream-leather welcome card má nízký kontrast (1.8) — proto je vyhrazen pouze pro:
- **Decorative accent** v „Projektu Ikaros." (titleAccent, 32px+ size, ne primární text)
- **Signature italic** (22px+ size, Caveat — italic + size = OK pro WCAG „large text" výjimku)
- **Empty hints** (sub-text mimo welcome buben, na dark wood BG = OK)

**Sage NIKDY ne pro:**
- Body text v bubnu (paragraph)
- Section titles
- Nav item labels

### Reduced motion audit
Všech 5 animací má fallback `animation: none !important` v `@media (prefers-reduced-motion: reduce)` — žádný blok skinu nezávisí kriticky na animaci.

---

## 7. Soubory a změny

| Soubor | Akce | Velikost |
|--------|------|----------|
| [`src/themes/themes/indiane/index.ts`](../../../src/themes/themes/indiane/index.ts) | **Kompletní přepis** — paleta, fonty (Cinzel Decorative + Cinzel + Spectral + Caveat), 14 asset URLs, layout vars | ~180 řádků (z 50) |
| [`src/themes/themes/indiane/decorations.css`](../../../src/themes/themes/indiane/decorations.css) | **Kompletní přepis** — 22 sekcí dle hospoda/severske vzoru | ~900 řádků (z 15) |
| [`public/themes/indiane/decor/*.webp`](../../../public/themes/indiane/decor/) | ✅ **Hotovo** (15 souborů — 13 nových + logo + medailon) | — |
| [`public/themes/indiane/decor/_asset-prompts.md`](../../../public/themes/indiane/decor/_asset-prompts.md) | ✅ **Hotovo** (13 prompty pro retro-generaci) | — |
| [`scripts/finalize-indiane-assets.mjs`](../../../scripts/finalize-indiane-assets.mjs) | ✅ **Hotovo** (resize pipeline) | ~75 řádků |
| [`assets-source/themes/indiane/`](../../../assets-source/themes/indiane/) | ✅ **Hotovo** (přejmenováno z `indiani`, drum typo opraven) | 15 PNG souborů |
| [`docs/themes/indiane.md`](../../themes/indiane.md) | **Post-implementace přepis** — uzavře starý frontier hybrid vize, přepíše na „Strážci horizontu" | volitelné |

**Mimo scope:**
- Globální CSS (žádné edity)
- Shell layout komponenty (žádné edity)
- Ostatní 21 skinů (nulová regrese)
- Theme registry [`src/themes/themes/index.ts`](../../../src/themes/themes/index.ts) (indián už registrován, žádný edit)
- TypeScript typy (žádný edit)

---

## 8. Asset list (✅ vše hotovo)

| # | Asset | Cesta | Rozměr | Status |
|---|-------|-------|--------|--------|
| 1 | logo | `public/themes/indiane/decor/logo.webp` | 1880×~400 | ✅ user dodal |
| 2 | medailon | `public/themes/indiane/decor/medailon.webp` | 590×~580 | ✅ user dodal |
| 3 | corner-tl | `public/themes/indiane/decor/corner-tl.webp` | 256×256 | ✅ AI gen |
| 4 | medailon-frame | `public/themes/indiane/decor/medailon-frame.webp` | 800×600 | ✅ AI gen |
| 5 | drum-pictograph | `public/themes/indiane/decor/drum-pictograph.webp` | 720×540 | ✅ AI gen |
| 6 | icon-uvodnik | `public/themes/indiane/decor/icon-uvodnik.webp` | 96×96 | ✅ AI gen |
| 7 | icon-vytvorit-svet | `public/themes/indiane/decor/icon-vytvorit-svet.webp` | 96×96 | ✅ AI gen |
| 8 | icon-diskuze | `public/themes/indiane/decor/icon-diskuze.webp` | 96×96 | ✅ AI gen |
| 9 | icon-clanky | `public/themes/indiane/decor/icon-clanky.webp` | 96×96 | ✅ AI gen |
| 10 | icon-galerie | `public/themes/indiane/decor/icon-galerie.webp` | 96×96 | ✅ AI gen |
| 11 | icon-napoveda | `public/themes/indiane/decor/icon-napoveda.webp` | 96×96 | ✅ AI gen |
| 12 | icon-hospoda | `public/themes/indiane/decor/icon-hospoda.webp` | 96×96 | ✅ AI gen |
| 13 | feather-stamp | `public/themes/indiane/decor/feather-stamp.webp` | 96×96 | ✅ AI gen |
| 14 | decor-fire-stones | `public/themes/indiane/decor/decor-fire-stones.webp` | 1200×300 | ✅ AI gen |
| 15 | petroglyph-divider | `public/themes/indiane/decor/petroglyph-divider.webp` | 800×80 | ✅ AI gen |

**Celkem 15 souborů, ~330 KB**.

---

## 9. Originální motivy (žádný jiný skin nemá)

1. **Šamanský oválný buben jako welcome card** + Medicine Wheel pictogramy (vlk N / orel E / had S / bizon W + sun spiral) přes asset `drum-pictograph` s opacity 0.45 pod text
2. **Aktivní nav left-border = řada korálků** (CSS radial-gradient cyklus red/turquoise/gold/cream) místo plné linky
3. **Spirit smoke ze active nav** (`::after` pseudo s gradient + blur, 6s loop) — alternativa hospoda candle-flicker / brass-sweep
4. **Drum-beat pulse welcome card** (10s scale 1.000→1.005, „tlukoucí srdce kmene") — žádný jiný skin nemá tepoucí welcome
5. **Constellation overlay nad horizontem** (5–7 CSS dots, opacity 0.4, statické) — easter-egg
6. **Bead-string visící z topbaru** (CSS-only, 8s sway) — alternativa hospoda lustru / severske rune-circle-floor
7. **Petroglyph-divider mezi sekcemi** (pecked sandstone slab) místo hospoda iron-clasp / pivní pěna
8. **Feather-stamp jako „+" CTA ikona** (orlí pero s tyrkysovými korálky) — alternativa hospoda brass-stamp

---

## 10. Akceptační kritéria

- [ ] **AC-1**: Po `themeId === 'indiane'` má dashboard tmavé pálené zemité pozadí (`#2a1208`) s warm hearth glow zdola breathing 8s, **žádný globální dopad** na ostatní 21 skinů
- [ ] **AC-2**: Logo v topbaru je `logo.webp` (cedule banner s baked-in textem), šířka 360px desktop / 280px tablet / 220px mobile
- [ ] **AC-3**: Sidebary mají patinované dřevěné panely s `corner-tl.webp` ornamenty ve 4 rozích (master TL mirror), 1px wood-mid border, deep box-shadow
- [ ] **AC-4**: Welcome card je oválný šamanský buben (aspect 1.4:1) s `medailon-frame.webp` rámem + `drum-pictograph.webp` jako napnutá kůže pod text vrstvou (opacity 0.45), drum-beat pulse 10s
- [ ] **AC-5**: Text v bubnu — title v **Cinzel** dark color, titleAccent v **Cinzel Decorative** sage-turquoise, paragraph v **Spectral** dark, signature v **Caveat italic** sage-turquoise
- [ ] **AC-6**: 7 nav ikon = `icon-*.webp` přes `data-nav-key` mapping, 22×22px desktop, drop-shadow gold glow
- [ ] **AC-7**: Active nav má **řadu korálků** jako left-border (CSS radial-gradient pattern) + **spirit smoke** stoupající (`::after` 6s loop)
- [ ] **AC-8**: Pravý panel obsahuje ADMINISTRACE (skin selector + uživatelé) nahoře + Moje diskuze + Moje světy uprostřed (odchylka od mockupů, dle memory)
- [ ] **AC-9**: „+" tlačítka (rightAddBtn / addBtn) mají `feather-stamp.webp` jako `::before` ikonu, hover rotuje feather +8deg
- [ ] **AC-10**: Section titles + petroglyph-divider pod nimi (height 12px desktop, 8px mobile)
- [ ] **AC-11**: Decor-fire-stones jako pruh dole (1200px width, 300px height desktop, 180px mobile, opacity 0.85)
- [ ] **AC-12**: Bead-string visící z topbaru s 8s sway animation (skryto mobile)
- [ ] **AC-13**: Constellation overlay (5-7 prairie-gold dots, opacity 0.4, statické) v top třetině obrazovky (skryto mobile)
- [ ] **AC-14**: Hearth glow zdola (60vh desktop, 30vh mobile, 8s breathing)
- [ ] **AC-15**: PJ badge je kožený štítek s prairie-gold gradient + dark text + buffalo-blood inset border
- [ ] **AC-16**: Mobile (≤768px) — welcome buben → obdélník border-radius 24px, drum-beat vypnuto, bead-string + constellation skryté, header buttons icon-only
- [ ] **AC-17**: Reduced-motion — všechny 5 animací mají `animation: none !important` fallback
- [ ] **AC-18**: Forced colors — corner-tl, nail studs, nav ikony, bead-string, petroglyph-divider, drum-pictograph mají `forced-color-adjust: none`
- [ ] **AC-19**: Focus visible — všechny interaktivní prvky mají box-shadow ring (buffalo-bright outer + glow)
- [ ] **AC-20**: WCAG contrast — všechny primární text kombinace ≥ AA (cream-leather na dark wood AAA, prairie-gold na dark wood AA, dark text na cream-leather AAA)
- [ ] **AC-21**: Animace inventář splňuje plán (5 typů, žádná chaotická interakce)
- [ ] **AC-22**: Original motifs splněny (8 položek, sekce 9) — žádné sdílení s ostatními skiny
- [ ] **AC-23**: `npm run lint:colors` projde (žádné hardcoded barvy mimo CSS var)
- [ ] **AC-24**: `npm run audit:contrast` projde (žádné WCAG fails)
- [ ] **AC-25**: Screenshots na 3 viewportech (mobile 375px / tablet 1024px / desktop 1920px) zachycené a uložené v `docs/arch/phase-1/_screenshots/`

---

## 11. Mimo scope (explicitně)

- Globální CSS edity (žádné)
- Shell layout komponenty (žádné)
- Ostatní 21 skinů (nulová regrese, ne edit, ne dotyk)
- Backend / API změny (žádné)
- Theme registry [`src/themes/themes/index.ts`](../../../src/themes/themes/index.ts) (indián už registrován)
- TypeScript typy (žádný edit)
- Nové komponenty (theme skin — pouze CSS + tokens)
- `docs/themes/indiane.md` přepis (volitelné, post-implementace, ne v 1.0p)
- Backend i18n (žádný)

---

## 12. Rizika & mitigace

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|------------------|-------|----------|
| UI rám „přerazí" krásu BG | M | V | Tloušťka border 2px, carving jen v rozích (corner-tl 80px), nail studs jen 4 v rozích — dle frontend-design audit |
| Text v ovalu se nevejde | M | V | Aspect 1.4:1 (oval širší než vysoký), padding-x > padding-y, min-height clamp |
| Animační chaos | M | S | Striktně 5 typů s jasnými rolemi (hearth / drum-beat / bead-sway / smoke active / smoke click), všechny reduced-motion fallback |
| Sage-turquoise nízký kontrast na bubnu | V | S | Vyhrazen pouze pro decorative accent (titleAccent 32px+) + signature italic 22px+; NIKDY pro body text |
| Mobile welcome buben oval ořezává text | V | V | Mobile přepnutí na obdélník border-radius 24px (sekce 5) |
| Spirit smoke vyrušuje při scrollu | N | S | Smoke je v aktivním nav `::after`, ne na celé stránce — pouze 1 prvek najednou |
| Drum-beat 10s pulse je pozorný | N | M | Scale 1.000→1.005 je sotva znatelné, podvědomé „dýchá to" pocit |
| Asset balík nekonzistentní | N | V | ✅ audit po dodání — všech 13 assetů má stejné dřevo + tribal cik-cak + iron studs |
| Konflikt s `priroda` paletou (emerald + gold) | N | S | Indián má buffalo-blood + prairie-gold (warm), priroda má emerald (cold green) — jasná separace |
| Konflikt s `nemrtvi` ghost-pulse | N | S | Indián má hearth glow zdola warm flame, nemrtvi má ghost-breathe shora teal — opposite v poloze + barvě |

---

## 13. Workflow & schválení

Dle [base.md](../../../.claude/rules/base.md) + memory `feedback_workflow.md`:

1. ✅ **Brainstorming** — koncept „Strážci horizontu" prodiskutován + odsouhlasen (2026-05-11)
2. ✅ **Frontend-design audit** — proveden (2026-05-11), 8 mikro-detailů identifikováno, swap bead-divider→petroglyph-divider
3. ✅ **Asset prompty + generování** — 13 AI assetů + 2 user assety hotovo (2026-05-11)
4. 🟡 **Unified spec** — **TENTO DOKUMENT** (čeká na schválení)
5. ⏭️ **Implementační plán** — po schválení spec
6. ⏭️ **Potvrzení plánu** — po dodání plánu
7. ⏭️ **Implementace** — kód (`index.ts` + `decorations.css`)
8. ⏭️ **Post-impl** — `roadmap-fe.md` update, `dluhy.md` review, screenshots, akceptace

---

## 14. Otázky vyřešeny

| # | Otázka | Rozhodnutí |
|---|--------|-----------|
| Q-koncept | Jdeme čistou prérijní linkou (žádný saloon / Wild West)? | ✅ ANO — „Strážci horizontu", svět před západem |
| Q-welcome | Welcome card oval / kruh / obdélník? | ✅ OVAL (aspect 1.4:1) v dřevěném `medailon-frame` rámu |
| Q-animace | Klidná nebo živá varianta? | ✅ ŽIVÁ (hearth glow + drum-beat + bead-sway + spirit smoke) |
| Q-typografie | Carved & Spoken / Frontier Hand / Strict Sage? | ✅ A — Carved & Spoken (Cinzel Decorative + Cinzel + Spectral + Caveat) |
| Q-assets | Minimal / Standard / Rich? | ✅ RICH (13 nových + 2 dodané = 15 celkem) |
| Q-paleta | Tyrkys jako primární nebo decorative? | ✅ DECORATIVE — sage-turquoise vyhrazen pro titleAccent + signature + empty hints |
| Q-asset-swap | bead-divider CSS vs. petroglyph asset? | ✅ petroglyph-divider asset (frontend-design audit doporučení) |
| Q-admin | Pravý panel obsah? | ✅ ADMINISTRACE (skin + uživatelé) nahoře, Moje diskuze/světy uprostřed — dle memory |
| Q-mobile-welcome | Welcome oval ořezává text na mobile | ✅ Mobile přepnutí na obdélník border-radius 24px |

---

**Status:** ✅ Implementováno
Po souhlasu → impl. plán `plan-1.0p.md` → po souhlasu → kód.
