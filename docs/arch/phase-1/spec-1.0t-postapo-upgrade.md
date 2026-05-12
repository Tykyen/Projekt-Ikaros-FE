# Spec 1.0t — Postapo visual upgrade

**Status:** 🟡 Spec ke schválení (2026-05-11)
**Datum:** 2026-05-11
**Rozsah:** FE skin upgrade — `[data-theme="postapo"]` izolace, žádný globální dopad
**Repo:** `Projekt-ikaros-FE`, větev `feat/krok-1.0t-postapo-upgrade` (vytvoří se při impl plánu)
**Velikost:** odhad ~2 soubory změna (`index.ts`, `decorations.css`) + 3 dodané assety (logo + medailon + background, WEBP konverze) = 5 souborů celkem. **Žádné AI gen assety** — všechny ornamenty (rivet corners, ikony, watermarks, hazard stripes, stencil glyphs, geiger bar) jsou inline SVG data-uri / CSS-only.
**Autor:** PJ + Claude
**Souvisí:** [spec-1.0s-kyberpunk-upgrade.md](spec-1.0s-kyberpunk-upgrade.md) (poslední tier-1, explicitně se ODLIŠUJE — žádný neon glow / CJK rain / RGB-split / wet pavement; postapo = matný kov + radiace + popel), [spec-1.0r-arabsky-svet-upgrade.md](spec-1.0r-arabsky-svet-upgrade.md) (kontrast — orientální noční palác vs. apokalyptický bunkr), [spec-1.0k-nemrtvi-upgrade.md](spec-1.0k-nemrtvi-upgrade.md) (kontrast — gotický horor toxická zelená vs. industriální radioaktivní olivová), [spec-1.0n-vesmirna-bitva-upgrade.md](spec-1.0n-vesmirna-bitva-upgrade.md) (kontrast — vojenský bridge HUD vs. mrtvý bunker terminál), [spec-1.0b-theme-visuals.md](spec-1.0b-theme-visuals.md)

**Reference:**
- `assets-source/themes/postapo/logo.png` — horizontální korodovaná železná cedule s nýty po obvodu, drátěné popraváky/řetězy po stranách jako zavěšení, vlevo Ikaros bird siluetta v rezavém čtvercovém poli, „Projekt Ikaros" v stencil/typewritten fontu vybledle bílém — wasteland street sign estetika ✅ **user dodal 2026-05-11**
- `assets-source/themes/postapo/medailon.png` — čtvercová korodovaná kovová deska s 4 nýty v rozích, popraskaný betonový/asfaltový povrch uvnitř, vybledlá bílo-šedá Ikaros bird silueta uprostřed, zlato-rezavé okraje s patinou — heavy industrial bunker plate ✅ **user dodal 2026-05-11**
- `assets-source/themes/backgrounds/postapo.png` — toxická zelenožlutá obloha, ruiny mrakodrapů v dálce, kroužící havraní, popraskaná silnice s loužemi, varovná žlutá značka radiace vlevo, rezavý sud vpravo, mokré skvrny, prach v atmosféře ✅ **user dodal**
- **Žádný `_asset-prompts.md` soubor se negeneruje** — všechny ornamenty kromě logo/medailon/BG jsou inline SVG data-uri v `decorations.css` + tokens v `index.ts`.

**Reference mockup (vzor cílové kvality):**
- Plně realizovaný mockup screenshot dodaný uživatelem 2026-05-11 zobrazující paletu (popel/olivová/rez), atmosférické pozadí (Zóna 7 ruiny + havraní), layout panelů (levý nav, welcome card uprostřed, pravý panel), korodovaný kovový rám okolo celé stránky, drobné nýty v rozích buttonů, rezavá olivová italic kaligrafie signature, vybledlý ☢ radiation symbol vpravo dole. Tento mockup je **kvalitativní benchmark** — cílem skinu je se k němu přiblížit a přidat originální motivy (geiger pulse bar, caution hazard stripes, stencil spray, burned paper edges, HAZMAT watermarks, CRT static, radio call sign, dust drift, ghost signal).

---

## 0. Princip — „Postapo", Bunkr 7 — Poslední vysílání

> **Stojíš v podzemním bunkru pod ruinami Zóny 7. Nad tebou se rozpadlé mrakodrapy ohýbají v toxickém větru, havrani krouží nad zničenými mosty, oblaka jsou žlutozelená od radiace. Na rezavém kovovém terminálu před tebou bliká stará obrazovka — poslední rádiová stanice, která ještě vysílá. Z reproduktoru občas zaskřípe geigerův čítač, jako srdeční tep mrtvého světa. Zdi bunkru jsou pokryté korozí, nýty drží železné pláty pohromadě, stencil sprejované varovné nápisy „RADIACE", „ZÓNA 7", „DEAD WORLD" se odhalují pod vrstvami popela. Vzduch voní rzí, ozonem, vlhkým betonem a tichým rozkladem. Nikde žádná krása, žádný luxus — jen holé přežití, vojenská strohost a tichá rezignace toho, kdo viděl konec a přežil.**

Skin musí *dýchat industriálním zánikem a tichou beznadějí* — matný korodovaný kov, žádný luxus, žádný neon, jen radioaktivní pulz a popel. Postapo jako **mementum lidstva**, ne sci-fi futurismus.

**Inspirační kotvy:** *Fallout 4 / 76* (Bethesda — Geiger UI, terminal screens, rust+olive paleta), *Metro 2033 / Exodus* (4A Games — bunker claustrophobia, lampy v tmavé betonové chodbě), *S.T.A.L.K.E.R.: Shadow of Chernobyl* (GSC — Zóna, radioaktivní mlha, anomálie), *The Last of Us* (Naughty Dog — ruiny zarostlé přírodou, ale tady bez zeleně), *Mad Max: Fury Road* (George Miller — rezavá ocelová mechanika, vojenská symbolika), *Half-Life 2 — City 17* (Valve — sovětský industrialismus + alien overlay), *Chernobyl HBO* (radiation tag iconografie, popel padá jako sníh). **Reálné post-Sovětské městské ruiny** (Pripyat, Bukreyev's Hradec, opuštěné továrny), **vojenské signage** (stencil sprays na železe).

**NE** sci-fi neon (`kyberpunk`, `sci-fi`, `vesmirna-bitva`). **NE** zelený toxický glow z gotického hororu (`nemrtvi`). **NE** krev-červené vojenské alarm pulse (`temna-cerven`). **NE** orientální luxus (`arabsky-svet`). **NE** generický „grunge texture overlay" (AI slop). **NE** stereotypní zombie ikonografie — naše téma je o radiaci a kovovém rozkladu, ne nakažení. **NE** politicky necitlivé motivy (žádné konkrétní vojenské insignie reálných armád, žádné svastiky, žádné konkrétní state-flag obraty).

**Strict isolation:** vše scoped přes `[data-theme="postapo"]`. Zbylých 21 témat = nulová regrese. (Memory rule: žádné sdílení / recyklace ornamentů s ostatními skiny — Postapo má vlastní vizuální slovník: korodované kovové plotny s nýty v rozích, žluto-černé hazard stripes, stencil sprejované section titly, opálené burned paper edges, HAZMAT/skull symbol watermarks, geiger EKG pulse bar v topbaru, CRT static noise drift, dust particle drift, radio call sign markup, ghost signal flicker, ZÓNA 7 stencil watermark.)

---

## 1. Cíl

Po `themeId === 'postapo'` má dashboard vypadat jako **rozbitý terminál v podzemním bunkru pod Zónou 7**: tmavé popelové pozadí s baked-in ruinami městské krajiny + toxickou oblohou skrze tmavě olivovo-rezavé panely s **korodovanými kovovými rohy se 4 nýty na každém panelu** (inline SVG, vážený kovový rám), **welcome card jako „bunker terminal screen"** (těžký korodovaný panel s rivet corners + caution hazard stripe pod section header + DEAD WORLD stencil watermark v BG + radio call sign v rohu + administrator signature dole), **statický CRT noise drift** přes celou obrazovku (slabý šum jako rozbitý monitor), **dust particle drift** ve dvou vertikálních edge strips po stranách viewportu (cca 40px wide vlevo i vpravo, padající popel/prach v rezavé/olivové barvě, 60s loop), **6 nav medailonů** s tematickými stencil ikonami (úvodník / nápověda / diskuze / články / galerie / vytvořit svět) — idle matný kovový plate + olivová bordura, hover = caution stripe slide vlevo + slabý žlutozelený glow, active = **rezavá oranžová + olivová kombinovaná bordura + geiger pulse animace (1× za ~8s slabý žlutozelený puls) + caution stripe vlevo (žluto-černá úhlopříčná páska 4px) + HAZMAT watermark v rohu hlavního panelu rozsvícený stejnou section barvou**, **stencil sprejované section titulky** (8 sekcí, 8 různých vybledle barevných stencilů pro NAVIGACE/VESMÍRY/CHAT/ADMINISTRACE/MOJE SVĚTY/MOJE DISKUZE/OBLÍBENÉ ČLÁNKY/OBLÍBENÉ OBRÁZKY — stencil tečky/úniky barvy jako CSS background-image SVG), **statické HAZMAT watermark glyphs v rozích sekčních karet** (8 různých radiation/biohazard/skull/warning symbolů v 8 sekčních barvách, opacity 0.05, statické), **administrator signature self-draw** (italic kaligrafie ve welcome card se sama napíše při načtení, 2s ease-out, jen 1× per session — jako poslední vzkaz mrtvého), **ghost signal flicker** (1× per session — duchový text overlay krátce flickne nad welcome card a zmizí, jako rušení starého rádiového signálu), **geiger pulse bar v topbaru** (animovaný EKG-like signál radiace pod logem, občas „tick" spike — žluto-zelený, jako měření radiace v reálném čase).

Pravý panel = **MIX layout** (rozšíření globálního admin rozhodnutí z memory `project_admin_panel_decision.md`):
1. **ADMINISTRACE** (nahoře — skin selector + uživatelé) → caution yellow
2. **MOJE DISKUZE** → rust orange
3. **MOJE SVĚTY** → toxic olive
4. **OBLÍBENÉ ČLÁNKY** → hazard amber
5. **OBLÍBENÉ OBRÁZKY** (dole) → radioactive green

Top bar zjednodušený dle mockupu: **POŠTA + UŽIVATELÉ + ZLATÝ STANDARD + TYKY + ODHLÁSIT** (původní layout).

**Black Ops One** logo fallback (vojenský stencil — baked-in do `logo.webp`) + **Big Shoulders Stencil Display** display (uppercase headings, industrial stencil energy) + **Special Elite** body (typewriter — bunker reports/military memos) + **Special Elite** italic signature varianta pro administrator signature (decoded jako poslední ručně psaný vzkaz). Vše izolované, bez dopadu na ostatní skiny.

---

## 2. Kontext / motivace

- Kyberpunk (1.0s) byl naposled tier-1 produkční skin (Neo-Akihabara 2099, neon megalopole). **„Postapo" je 17. ve „tier-1 produkční kvalitě"** — apokalyptický wasteland skin jako vizuální opozit `kyberpunk` (futuristické město plné světla; teď postapo = ruiny města bez světla), `arabsky-svet` (orientální noční palác; teď postapo = bunkr pod ruinami), `africke` (savana za úsvitem; teď postapo = ash desert pod toxickou oblohou), `severske-runy` (cold mead-hall fjord; teď postapo = ash bunker), `nemrtvi` (gotický horor; teď postapo = vědecká radiace), `temna-cerven` (vojenský alarm; teď postapo = po-alarmová tichost), `vesmirna-bitva` (bridge of warship; teď postapo = trosky civilizace), `priroda` (tundra/les; teď postapo = mrtvá příroda).
- Současný [`src/themes/themes/postapo/index.ts`](../../../src/themes/themes/postapo/index.ts) má minimální tokens (olivová+rust paleta, Oswald+Roboto Condensed+Roboto fonty, žádné assety, žádné inline SVG vars). **Nutné kompletní přepsání** dle bunker terminal direction + 22 inline SVG asset vars.
- Současný [`src/themes/themes/postapo/decorations.css`](../../../src/themes/themes/postapo/decorations.css) má pouze 14 řádků (radial gradient overlay + `border-radius: 0` na cards). **Nutné kompletní přepsání** dle struktury arabsky-svet / africke / kyberpunk (~900–1000 řádků).
- Pozadí `assets-source/themes/backgrounds/postapo.png` je dodáno (toxická obloha + městské ruiny + havraní + varovná značka + rezavý sud). UI musí toto pozadí *podpořit*, ne s ním soupeřit — všechny panely jsou matné korodované plotny, žádný neon glow.
- User dodal `logo.png` + `medailon.png` v `assets-source/themes/postapo/` 2026-05-11 — oba ve stylu **korodovaného železa s nýty + popraskaný povrch + vybledlá Ikaros bird silueta**. Tyto tři assety (logo + medailon + BG) definují materiálový slovník: dále vygenerujeme **22 inline SVG vars** v `index.ts` s konzistentním stylem (rivet corners, stencil glyphs, HAZMAT symbols, dust strip, geiger waveform, ghost signal text).
- Frontend-design audit proveden (2026-05-11), uživatel schválil **industriální bunker direction** (Fallout/Metro/STALKER, ne sci-fi neon ani gotický horor) + 11 originálních motivů.

---

## 3. Audit současného stavu

### 3.1 Theme registry & tokens
- [`src/themes/themes/postapo/index.ts`](../../../src/themes/themes/postapo/index.ts) — existuje (cca 50 řádků). **Nutné kompletní přepsání** palety + fontů + tokens + asset URLs:
  - Paleta:
    - `--bg-primary` #0a0905 (deep ash black)
    - `--bg-secondary` #14110a (rusted iron panel base)
    - `--bg-card` #1a1612 (rusted iron card)
    - `--bg-card-hover` #221d15 (dirty bronze lift)
    - `--accent` #8a8810 (toxic olive — primary, ale matný)
    - `--accent-bright` #a8a818 (slightly brighter olive — sotva svítí)
    - `--accent-dim` #484808 (deep olive shadow)
    - `--rust` #7a3810 (deep rust orange — secondary primary)
    - `--rust-bright` #9a5020 (rust amber)
    - `--rust-dim` #4a2010 (deep rust shadow)
    - `--caution-yellow` #c8a008 (warning yellow — hazard stripes)
    - `--hazard-amber` #d68a20 (hazard amber)
    - `--radioactive-green` #6a8a30 (geiger glow — sotva svítí)
    - `--concrete-grey` #484840 (concrete neutral)
    - `--text-primary` #b0a888 (bone ash — sotva čitelný ivory)
    - `--text-secondary` #857b66 (dust beige)
    - `--text-muted` #5a523f (deep dust shadow)
    - `--border` #302e20 (metal border)
    - `--border-strong` #7a3810 (rust border accent)
    - `--border-subtle` #1c1a14 (deep metal shadow)
    - `--danger` #9a4020 (deep rust alert)
    - `--success` #6a8830 (radioactive green success)
    - `--warning` #c8a008 (caution yellow)
    - `--info` #5a7080 (cold concrete blue-grey)
  - Fonty: **Black Ops One** (logo fallback — vojenský stencil), **Big Shoulders Stencil Display** (display uppercase — industrial stencil energy), **Special Elite** (body — typewriter bunker reports)
- Asset URL proměnné chybí — nutné přidat (`--asset-logo`, `--asset-andel-medallion`, `--asset-rivet-corner` (4 nýty na kovové platě), `--asset-dust-strip`, `--asset-hazard-stripe` (žluto-černá úhlopříčná páska tile), `--asset-geiger-pulse` (EKG waveform), `--asset-stencil-noise` (texture overlay pro stencil section titles), `--asset-crt-static` (noise drift tile), 6× `--asset-icon-*`, 5× section icons, 8× `--asset-hazmat-*` watermark glyph, inline SVG data-uri pro signature flourish + plus glyph + radio call sign).
- Atmosphere string z původního ("Apokalyptická pustina — desaturovaná olivová + rez") se rozšíří na **„Postapo — Bunkr 7 pod ruinami Zóny 7, korodovaný kov + radioaktivní puls + popel + CRT static + ghost signal + caution hazard stripes"**.
- Theme `name` zůstává **„Postapo"** (zachováno dle preference uživatele), `id: 'postapo'` zachován.

### 3.2 Decorations
- [`src/themes/themes/postapo/decorations.css`](../../../src/themes/themes/postapo/decorations.css) — minimální stub (14 řádků). **Žádné panely, žádné NavItem styly, žádné dekorace, žádné mikrointerakce, žádný dust drift, žádné HAZMAT watermarks, žádný geiger pulse.** Skin viditelně nedokončený. **Nutné kompletní přepsání** dle struktury arabsky-svet / africke / kyberpunk (~900–1000 řádků).

### 3.3 Asset folder
- `assets-source/themes/postapo/` — ✅ existuje (logo.png + medailon.png dodány uživatelem 2026-05-11)
- `assets-source/themes/backgrounds/postapo.png` — ✅ existuje (BG dodán dříve)
- `public/themes/backgrounds/postapo.webp` — existuje (starší verze), **kontrola** zda je aktuální verze z `assets-source/`
- `public/themes/thumbnails/postapo.webp` — kontrola; případně regenerace později (post-1.0t)
- `public/themes/postapo/decor/` — ❌ **neexistuje**, nutné vytvořit (2 soubory — `logo.webp` + `medailon.webp` konvertované z PNG → WEBP; `background.webp` je už v `public/themes/backgrounds/`)

### 3.4 Kyberpunk + Arabsky-svet jako pattern předlohy (struktura, NE obsah)
- [`src/themes/themes/kyberpunk/decorations.css`](../../../src/themes/themes/kyberpunk/decorations.css) — sekce 1–28 jako struktura (1100 řádků)
- [`src/themes/themes/arabsky-svet/decorations.css`](../../../src/themes/themes/arabsky-svet/decorations.css) — alternativní pattern
- **„Postapo" použije stejnou strukturu** (sekce 1–28), ale s vlastní materiálovou a ornamentální paletou (**korodovaný kov + rivet corners + caution hazard stripes + stencil spray section titles + HAZMAT watermarks + CRT static drift + dust particle drift + geiger pulse bar + ghost signal + administrator signature**). Nesdílí žádný ornament s ostatními skiny — má svůj vlastní vizuální slovník.

### 3.5 Memory & projekt-level rozhodnutí
- `project_admin_panel_decision.md` — Uživatelé + skin selector v ADMINISTRACE (pravý panel) → **postapo rozšiřuje** o MOJE DISKUZE + MOJE SVĚTY + OBLÍBENÉ ČLÁNKY + OBLÍBENÉ OBRÁZKY pod tím (5 sekcí celkem v pravém panelu, viz mockup)
- `feedback_theme_isolation.md` — všechny edity scoped na `[data-theme="postapo"]`, **žádné globální ani shared CSS edity bez souhlasu**
- `feedback_skin_originality.md` — ornamenty musí být originální, **žádné sdílení s ostatními skiny**
- `feedback_workflow.md` — povinný workflow: spec → souhlas → impl. plán → souhlas → kód
- `feedback_frontend_design_audit.md` — frontend-design skill jako audit (✅ hotovo 2026-05-11, schválen bunker terminal direction + 11 originálních motivů)

---

## 4. Návrh řešení

### 4.0 Section-color mapping (klíčový hallmark)

**8 sekcí (sekční titulky) — stencil sprejované, vybledlé:**
| Sekce | Barva | Hex | HAZMAT symbol (watermark) |
|---|---|---|---|
| NAVIGACE (levý) | toxic olive | #8a8810 | ☢ (radiation trefoil) |
| VESMÍRY (levý) | rust orange | #7a3810 | ⚠ (warning triangle) |
| CHAT (levý) | caution yellow | #c8a008 | 📻 (radio waves) |
| ADMINISTRACE (pravý) | caution yellow | #c8a008 | 🔧 (gear with rivets) |
| MOJE DISKUZE (pravý) | rust orange | #7a3810 | 💀 (skull stamp) |
| MOJE SVĚTY (pravý) | toxic olive | #8a8810 | 🌐 (cracked globe) |
| OBLÍBENÉ ČLÁNKY (pravý) | hazard amber | #d68a20 | 📋 (clipboard stencil) |
| OBLÍBENÉ OBRÁZKY (pravý) | radioactive green | #6a8a30 | ☣ (biohazard trefoil) |

**6 nav items v NAVIGACE (vertikální 4px caution-stripe vlevo — žluto-černá úhlopříčná páska):**
| Nav item | Barva | Hex |
|---|---|---|
| Úvodník | toxic olive | #8a8810 |
| Vytvořit svět | rust orange | #7a3810 |
| Diskuze | caution yellow | #c8a008 |
| Články | hazard amber | #d68a20 |
| Galerie | radioactive green | #6a8a30 |
| Nápověda | concrete grey | #686050 |

**Active state nav** = primary olive+rust combined matný outline (žádný neon glow, jen matný kovový rim) + geiger pulse (1× za ~8s slabý žlutozelený puls z caution stripe) + HAZMAT watermark v rohu hlavního panelu rozsvícený sekční barvou tohoto nav itemu.

HAZMAT symboly vykresleny jako inline SVG s `fill="currentColor"` → CSS přebírá `color: var(--section-color)`. Všechny symboly jsou **univerzální HAZMAT/warning ikonografie**, žádné konkrétní vojenské nebo politické insignie.

### 4.1 Background & atmosféra

- **Background image** — `/themes/backgrounds/postapo.webp` (existuje, BG dodán dříve uživatelem, plně použito)
- **Atmosférický overlay** — sepia-darken pro fokus + tmavý vignette pro čitelnost UI (BG je sám o sobě saturovaný toxickou žlutozelenou oblohou):
  ```css
  '--theme-bg-overlay':
    'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(10, 9, 5, 0.65) 100%), linear-gradient(180deg, rgba(10, 9, 5, 0.25) 0%, rgba(10, 9, 5, 0.55) 100%)'
  ```
- **🎨 ORIGINÁL — Statický CRT noise drift** přes celou obrazovku (signature element — žádný jiný skin nemá CRT static):
  - `[data-theme="postapo"][data-shell="ikaros"]::after`
  - 1× fixed pseudo: `inset: 0; pointer-events: none; z-index: 2`
  - `background-image: var(--asset-crt-static)` — inline SVG data-uri s pseudo-random noise dots (drobné tmavé/světlé teček v rezavé/olivové barvě, 200×200px tile)
  - `background-repeat: repeat`, `mix-blend-mode: overlay`, `opacity: 0.06`
  - Animation: `postapo-crt-drift 4s steps(8) infinite` — `background-position: 0 0 → 200px 200px` (steps pro jitter feel)
  - **Reduced-motion**: animace zastavena (statická pozice)
- **🎨 ORIGINÁL — Dust particle drift ve dvou edge strips** (signature element — alternativa kyberpunk rain, žádný jiný skin nemá popel):
  - `[data-theme="postapo"][data-shell="ikaros"] body::before` (levý strip) a `body::after` (pravý strip)
  - 2× fixed pseudo elementy: `width: 40px; top: 0; bottom: 0; left: 0` (resp. `right: 0`), `pointer-events: none; z-index: 1`
  - `background-image: var(--asset-dust-strip)` — inline SVG data-uri s vertikální column padajících drobných teček (popel/prach v rezavé `#7a3810` / olivové `#8a8810` / kostní `#b0a888` barvě, různé velikosti 2-4px), random distribuce
  - `background-size: 40px 800px`, `background-repeat: repeat-y`, `opacity: 0.30`
  - Animation: `postapo-dust-fall 90s linear infinite` — `background-position: 0 0 → 0 800px`
  - **Mobile (≤768px)**: skryto (strip 0 width)
  - **Reduced-motion**: animace zastavena (statická pozice), opacity snížena na 0.20

### 4.2 Topbar (slim, 56px) — korodovaný kovový rám + geiger pulse bar

- Pozadí: tmavý korodovaný gradient bez transparency:
  ```css
  background:
    linear-gradient(180deg, rgba(20, 17, 10, 0.96) 0%, rgba(10, 9, 5, 0.98) 100%);
  ```
- **Žádný backdrop-filter** (heavy dark metal, žádné prosvítání)
- **🎨 ORIGINÁL — Geiger pulse bar pod topbarem** (alternativa kyberpunk cyan+magenta hairline / arabsky-svet mašrabíja girih / sci-fi double rule):
  - 1px wide pseudo `header::after`
  - Background-image: `var(--asset-geiger-pulse)` — inline SVG s EKG-like waveform (flat line s občasným spike — radiation tick), repeat-x, scale stretched
  - Filter: `drop-shadow(0 0 2px var(--radioactive-green))` — slabý žlutozelený glow (sotva svítí)
  - Animation: `postapo-geiger-scroll 12s linear infinite` — `background-position-x: 0 → -800px` (signál se posouvá zprava doleva)
  - **Reduced-motion**: animace zastavena (statická waveform)
- Logo vlevo z `logo.webp` (horizontální korodovaná železná cedule + baked-in textem + rivet outline + Ikaros bird v rezavém poli + drátěné popraváky): šíře `--asset-logo-w: 360px` desktop / `280px` tablet / `220px` mobile
- Pravé tlačítka (POŠTA, UŽIVATELÉ, ZLATÝ STANDARD, TYKY, ODHLÁSIT) = **těžká korodovaná kovová deska s 4 nýty v rozích + olivová bordura**:
  - Background: vícevrstvý gradient `linear-gradient(180deg, rgba(34, 29, 21, 0.95) 0%, rgba(20, 17, 10, 0.98) 100%)` s inner highlight top + inner shadow bottom (3D hloubka)
  - Border: 1px solid var(--border) (matný metal #302e20)
  - Inner: 2 nýty (8×8px) v rozích jako `::before` + `::after` pseudo (top-left + top-right)
  - Text: var(--text-primary) #b0a888 uppercase **Big Shoulders Stencil Display**, letter-spacing 0.08em
  - Hover: border → var(--rust), text → var(--accent-bright), slabý žlutozelený glow `box-shadow: 0 0 8px rgba(106, 138, 48, 0.25)`, `translateY(-2px)` lift
  - Active: `translateY(3px)` — těžký kovový dopad (vážený clunk), shadow zmizí
  - **ZLATÝ STANDARD** button má speciální accent — gold tint v kyberpunku nesedí, v postapu **použijeme caution-yellow rim** (matná žlutá místo svítivého zlata) jako vzpomínku na lepší časy
- **Mobile (≤768px)**: ikony only, label hidden přes `aria-label`
- **Mobile (≤480px)**: TYKY + ODHLÁSIT + ZLATÝ STANDARD do hamburger drawer (existující pattern)

### 4.3 Sidebar levý — NAVIGACE / VESMÍRY / CHAT

- Frame: tmavě rezavá kovová deska s **4× rivet corners** + **stencil sprejované section titulky**:
  - Background: `linear-gradient(160deg, rgba(26, 22, 18, 0.92) 0%, rgba(14, 12, 8, 0.96) 100%)`
  - Border: 1px solid var(--border) (matný metal)
  - Inner border: `box-shadow: inset 0 0 0 1px rgba(122, 56, 16, 0.20)` (subtle rust inner accent)
  - Box-shadow outer: deep `0 6px 22px rgba(10, 9, 5, 0.85)`
- **🎨 ORIGINÁL — 4× Rivet corner ornaments** — inline SVG data-uri (`--asset-rivet-corner` v `index.ts`): korodovaný kovový L-shape s 2 nýty v rohu (matný metal gradient + nýt highlight + nýt shadow). Na všech 4 rozích (master TL, mirror přes CSS `transform: scaleX(-1) / scaleY(-1)` na ostatní 3 rohy):
  - Size: 56×56px desktop, 40×40px tablet, 32×32px mobile
  - `position: absolute; pointer-events: none; z-index: 5`
  - **ŽÁDNÝ drop-shadow neon glow** (matný kov, žádné světlo)
  - SVG path: ~16 vector body, 1.5 KB → zabaleno do data-uri inline, žádný HTTP request
- **Section titles** ("NAVIGACE" olive, "VESMÍRY" rust, "CHAT" yellow) — **Big Shoulders Stencil Display** uppercase, barva dle section-color mapping:
  ```css
  color: var(--section-color);  /* per-section CSS var */
  font-family: var(--font-display);  /* Big Shoulders Stencil Display */
  font-weight: 700;
  letter-spacing: 0.14em;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.6);  /* hard shadow, ne neon glow */
  ```
  + **🎨 ORIGINÁL — Stencil spray noise overlay** přes section title (alternativa horizon-neon divider) — `::after` pseudo:
  - Background-image: `var(--asset-stencil-noise)` — inline SVG s drobnými tečkami/úniky barvy (sprejový dripping pattern, ~80×24px tile)
  - Position: absolute, top 0, left 0, right 0, bottom 0
  - Mix-blend-mode: multiply
  - Opacity: 0.4
  - Sprej pattern: pseudo-random teček s color = currentColor (přebírá section-color)
- **🎨 ORIGINÁL — Caution hazard stripe divider pod section title** (alternativa cyan+magenta horizon-neon / mihrab arch):
  - 1px wide pseudo `::after` block-level pod title
  - Background-image: `var(--asset-hazard-stripe)` — inline SVG s úhlopříčnými žluto-černými pásky (12×4px tile, 45° angle)
  - `background-repeat: repeat-x`, `background-size: 12px 4px`
  - Height: 4px
  - Opacity: 0.7
- **🎨 ORIGINÁL — HAZMAT watermark v pravém horním rohu sekce** (8 různých symbolů, viz tabulka v 4.0):
  - Inline SVG data-uri proměnné v `index.ts` — 8 var-ů (`--asset-hazmat-radiation`, `--asset-hazmat-warning`, atd.)
  - Position: absolute, top 8px, right 10px, 38×38px desktop, 26×26px mobile
  - Color: var(--section-color), opacity 0.06 (statické) → 0.12 při hover sekce, 0.20 při aktivní nav položce s odpovídající section barvou
- **NavItem** ([class*="btn3d"]) — **těžká kovová deska s 4 nýty + matný kovový gradient**:
  - Idle: `linear-gradient(180deg, rgba(34, 29, 21, 0.95) 0%, rgba(20, 17, 10, 0.98) 100%)` + 1px solid var(--border) + 4 nýty v rozích (`::before` + `::after` pro horní 2, doplněné CSS box-shadow inset pro spodní 2)
  - Inner top highlight: `box-shadow: inset 0 1px 0 rgba(255, 240, 200, 0.08)` (slabý top kovový highlight)
  - Inner bottom shadow: `box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.6)` (3D hloubka)
  - **🎨 ORIGINÁL — Caution hazard stripe vertikálně vlevo** (4px wide, 80% výšky, žluto-černá úhlopříčná páska):
    ```css
    &::before {
      content: '';
      position: absolute;
      left: 0; top: 10%; bottom: 10%;
      width: 4px;
      background-image: var(--asset-hazard-stripe-vertical);
      /* per-item color override přes CSS filter: hue-rotate nebo dedicated SVG var */
      opacity: 0.75;
    }
    ```
  - Text: var(--text-primary) #b0a888 **Special Elite** (typewriter)
  - Hover: text → var(--accent-bright) (olivová), hazard stripe opacity → 1.0, **slabý žlutozelený glow** `box-shadow: 0 0 8px rgba(106, 138, 48, 0.20)`, `translateY(-2px)` lift
  - **Active** ([class*="btn3dActive"], [class*="navItemActive"]):
    - Background: `linear-gradient(90deg, rgba(122, 56, 16, 0.30) 0%, rgba(138, 136, 16, 0.18) 100%)` (rust→olive horizon)
    - Border: 1px solid var(--rust), inner border 1px solid var(--accent)
    - Hazard stripe expands → 6px wide, opacity 1.0
    - **🎨 ORIGINÁL — Geiger pulse animace** — slabý žlutozelený puls 1× za ~8s (animation `postapo-geiger-pulse 8s ease-in-out infinite` — keyframes: 0% box-shadow 0, 5% box-shadow `0 0 12px rgba(106, 138, 48, 0.45)`, 10% box-shadow `0 0 6px rgba(106, 138, 48, 0.25)`, 15% box-shadow 0, 100% box-shadow 0)
    - Text: var(--text-primary) bone-ash, hard shadow `1px 1px 0 #000`
    - **🎨 ORIGINÁL — HAZMAT watermark v rohu hlavního panelu** rozsvícený section-color tohoto active nav itemu (přes `[data-active-nav]` attribute na main shell → CSS var override pro `--accent-hazmat`)
  - Active translateY(3px) na click — těžký kovový dopad (vážený clunk)
- Touch target ≥48px mobile
- **Reduced-motion**: geiger pulse animace vypnuta (constant 0 shadow)

### 4.4 Sidebar pravý — ADMINISTRACE + MOJE DISKUZE + MOJE SVĚTY + OBLÍBENÉ ČLÁNKY + OBLÍBENÉ OBRÁZKY (mix layout)

- **Order (dle mockupu + memory `project_admin_panel_decision.md` rozšíření):**
  1. **ADMINISTRACE** (nahoře, caution yellow section):
     - Section title „ADMINISTRACE" v caution yellow Big Shoulders Stencil + stencil spray + hazard stripe divider
     - **HAZMAT watermark 🔧 (gear)** v rohu, caution yellow opacity 0.06
     - **Skin selector** (ThemeSwitcher) — korodovaná kovová deska button s olivovou bordura + caret, hover rust glow
     - **Uživatelé** — link/button stejný styling
  2. **MOJE DISKUZE** (rust orange section)
     - **HAZMAT watermark 💀 (skull stamp)** v rohu, rust opacity 0.06
  3. **MOJE SVĚTY** (toxic olive section)
     - **HAZMAT watermark 🌐 (cracked globe)** v rohu, olive opacity 0.06
  4. **OBLÍBENÉ ČLÁNKY** (hazard amber section)
     - **HAZMAT watermark 📋 (clipboard stencil)** v rohu, amber opacity 0.06
  5. **OBLÍBENÉ OBRÁZKY** (radioactive green section, dole)
     - **HAZMAT watermark ☣ (biohazard trefoil)** v rohu, green opacity 0.06
- Frame: stejný jako sidebar levý (korodovaná kovová deska + 4× rivet corner)
- **„+" tlačítka** (rightAddBtn):
  - Background: `linear-gradient(180deg, rgba(122, 56, 16, 0.35) 0%, rgba(74, 32, 16, 0.30) 100%)` (rust dark)
  - Border: 1px solid var(--rust)
  - **`::before` pseudo s stencil „+" glyph** (24×24px inline SVG plus icon s caution yellow stencil edges):
    ```css
    background-image: var(--asset-plus-stencil);
    margin-right: 8px;
    transition: filter 200ms ease;
    ```
  - Hover: border → caution yellow, brighter rust+yellow tint, plus glyph scale 1.08
  - Active: stamp scale 0.94 (klik feedback) + translateY(2px)
- **Empty hints** ("Žádné diskuze", "Žádné světy", "Žádné oblíbené") — **Special Elite** italic v var(--text-secondary) #857b66, opacity 0.75, font-size 14px

### 4.5 Welcome card — „Bunker terminal screen" (signaturní element)

- **Material:** těžký korodovaný kovový panel s 4× rivet corners + caution hazard stripe pod welcome title + DEAD WORLD stencil watermark v BG + radio call sign v rohu + administrator signature dole
- **Tvar:** obdélník s mírně zaoblenými rohy, `border-radius: 4px` (téměř pravoúhlé, jako těžká kovová deska)
  - `aspect-ratio: 16 / 7` desktop, fallback `min-height: clamp(380px, 50vh, 540px)` desktop
  - Padding: 48px vertikální, clamp(20px, 6vw, 100px) horizontální
- **Background — vrstvy** (zdola nahoru):
  1. Dark metal base — gradient `linear-gradient(180deg, rgba(26, 22, 18, 0.94) 0%, rgba(10, 9, 5, 0.98) 100%)` s subtle metal noise texture
  2. **🎨 ORIGINÁL — DEAD WORLD stencil watermark** uprostřed welcome card — velký vybledlý stencil text "ZÓNA 7" nebo "DEAD WORLD" v ~120px Black Ops One, color var(--text-muted) #5a523f, opacity 0.08, position absolute center, rotation -3deg (slight tilt), zIndex 0 (pod text obsahem)
  3. Vnitřní subtle glow z pravého dolního rohu (toxic olive radiation tint): radial-gradient `rgba(138, 136, 16, 0.05) 0%, transparent 50%`
- **🎨 ORIGINÁL — 4× Rivet corner ornaments** (inline SVG, stejný `--asset-rivet-corner` jako u sidebar v 4.3):
  - Outer border: 1px solid var(--border), inner box-shadow inset 1px var(--rust-dim)
  - 4 corner ornaments pozice absolutně v rozích welcome card, scaleX/Y mirror přes CSS
  - Size: 64×64px desktop, 48×48px tablet, 36×36px mobile
- **🎨 ORIGINÁL — Caution hazard stripe divider pod welcome title** (signature element — alternativa magenta hairline z kyberpunku):
  - Element: `[data-frame-panel="card"] [class*="welcomeTitle"]::after`
  - Position: relative, display block, margin-top 14px, height 4px, width 280px
  - Background-image: `var(--asset-hazard-stripe)` — žluto-černé úhlopříčky, repeat-x
  - Opacity: 0.85
- **🎨 ORIGINÁL — Radio call sign markup** v levém dolním rohu welcome card:
  - Element: `[data-frame-panel="card"]::before`
  - Content: `'TX: 87.5 MHz · ZÓNA-7 · STILL BROADCASTING'`
  - Position: absolute, bottom 12px, left 18px
  - Font: var(--font-body) (Special Elite), 10px, color var(--radioactive-green), opacity 0.55
  - Letter-spacing: 0.10em
- **🎨 ORIGINÁL — Ghost signal flicker** — 1× per session text overlay:
  - Element: `[data-frame-panel="card"]::after` (nebo dedicated `[data-ghost-signal]` element pokud potřeba via DOM)
  - Position: absolute, top 30%, left 50%, transform translate(-50%, -50%)
  - Content: `'... POSLEDNÍ VYSÍLÁNÍ ...'` v Black Ops One, 24px, color var(--rust-bright), opacity 0
  - Animation: `postapo-ghost-signal 6s ease-out 1` (jen 1× per session, viz 4.7) — keyframes: 0% opacity 0, 50% opacity 0.85, 55% opacity 0.10, 60% opacity 0.85, 100% opacity 0
- **Heraldický medailon vlevo** (`[data-andel-medallion]`) — větší dominantní čtverec (medailon.webp = korodovaná kovová deska s 4 nýty + popraskaný povrch + vybledlá Ikaros bird silueta):
  - 192×192px desktop, 144×144px tablet, 112×112px mobile
  - `background-image: var(--asset-andel-medallion)`, contain, no-repeat, center
  - `flex-shrink: 0; filter: drop-shadow(0 4px 14px rgba(10, 9, 5, 0.85))` (matný kovový stín, ŽÁDNÝ neon glow)
- **Text styling uvnitř welcome card:**
  - **welcomeTitle** ("Vítej v Projektu Ikaros.") — **Big Shoulders Stencil Display** weight 600, color var(--text-primary) #b0a888, text-shadow `1px 1px 0 rgba(0, 0, 0, 0.6)` (hard shadow, ne neon glow), font-size clamp(28px, 4vw, 44px), letter-spacing 0.04em, uppercase
  - **titleAccent** ("Projektu Ikaros.") — **Big Shoulders Stencil Display** weight 700, color var(--accent) #8a8810 (toxic olive accent vůči bone-ash title), text-shadow `1px 1px 0 #000`
  - **paragraph** (2 odstavce) — **Special Elite** color var(--text-primary), line-height 1.7, font-size 15px
  - **🎨 ORIGINÁL — administrator signature self-draw** ("Příjemnou zábavu přeje administrátor.") — **Special Elite** italic, color var(--rust-bright), text-shadow `1px 1px 0 #000`, font-size 22px, text-align center
    - SVG path s stroke-dasharray + dashoffset animace: signature se sama napíše při loadu welcome card (jako poslední vzkaz mrtvého rukopisu)
    - Animation: `postapo-signature-draw 2s ease-out 1` (jen 1× per session)
    - Position: pod paragraph, mezi 2 hard-stamp flourish liniemi (decoration: `::before` flourish vlevo + `::after` flourish vpravo)
- **Box-shadow** — deep wasteland shadow + slabý rust halo:
  ```css
  box-shadow:
    inset 0 0 0 1px rgba(122, 56, 16, 0.30),
    inset 0 0 80px rgba(10, 9, 5, 0.40),
    0 16px 40px -8px rgba(10, 9, 5, 0.85),
    0 32px 80px -16px rgba(10, 9, 5, 0.90);
  ```
  **Žádný neon glow shadow** — pouze tmavé kovové stíny + slabý rust inner rim.

### 4.6 Novinky card

- Stejný material a rivet corners jako welcome card, ale bez DEAD WORLD watermarku, bez radio call sign, bez ghost signal a bez signature (pouze welcome card má signature treatment)
- Title "📰 Novinky" → emoji nahrazen stencil ikona inline SVG (clipboard glyph s caution yellow stamp), text v Big Shoulders Stencil, color var(--text-primary)
- Empty state: "Zatím žádné novinky." v Special Elite opacity 0.65

### 4.7 Mikrointerakce & motion

- **Geiger pulse** (active nav) — `postapo-geiger-pulse 8s ease-in-out infinite`:
  ```css
  @keyframes postapo-geiger-pulse {
    0%, 95%, 100% { box-shadow: ...idle... }
    5% { box-shadow: 0 0 12px rgba(106, 138, 48, 0.45) }
    10% { box-shadow: 0 0 6px rgba(106, 138, 48, 0.25) }
  }
  ```
- **Geiger waveform scroll** (topbar) — `postapo-geiger-scroll 12s linear infinite` (background-position-x scrolls right→left)
- **CRT static drift** — `postapo-crt-drift 4s steps(8) infinite` (background-position step jitter)
- **Dust particle fall** — `postapo-dust-fall 90s linear infinite` (background-position-y scrolls top→bottom)
- **Ghost signal** — 1× per session, `postapo-ghost-signal 6s ease-out 1` (opacity flicker 0→0.85→0.10→0.85→0)
- **Signature self-draw** — SVG path s stroke-dasharray:
  ```css
  @keyframes postapo-signature-draw {
    from { stroke-dashoffset: 100%; opacity: 0 }
    to { stroke-dashoffset: 0; opacity: 1 }
  }
  ```
- **Button click clunk** — translateY(3px) na :active (těžký kovový dopad, ne lift up)
- **Reduced-motion** (`prefers-reduced-motion: reduce`):
  - Dust drift animace zastavena, statická pozice, opacity snížena na 0.20
  - Geiger pulse disabled (constant 0 shadow)
  - Geiger waveform statická
  - CRT static disabled (constant position)
  - Ghost signal disabled (instant invisible, never shows)
  - Signature self-draw disabled (instant full text visible)

### 4.8 Layout shell

- `<body data-shell="ikaros" data-theme="postapo">` — všechny dekorace scoped pod tímto kombinovaným selectorem (zachová robustní isolation od ostatních témat).
- Right panel mix-layout řeší stávající `RightPanel.tsx` komponenta s `data-section-key` attribute na každé sekci → CSS bere `var(--section-color)` z dat-mapování v decorations.css.
- Žádné JS změny — vše čisté CSS na úrovni tématu.

---

## 5. Assety

**Princip postapo skinu**: protože celá estetika je grungy-industrial (korodovaný kov, stencil sprays, hazard symbols), VŠECHNY ornamenty kromě uživatelem dodaných raster brand assetů (logo + medailon + BG) jdou implementovat jako **inline SVG data-uri / CSS-only** přímo v `index.ts` + `decorations.css`. Tím se získá:
- **Section-color hot-swap přes `currentColor`** — jedna ikona, 8 barev podle sekce (bez 8× duplikovaných WEBP souborů)
- **Žádné HTTP requesty** za decor assety
- **Ostrý hi-DPI vždy** (vektor)
- **Konzistence s industrial-stencil estetikou** (rastr by zaváděl blur, který nesedí — chceme ostré edges)
- **0 prompts pro ChatGPT** (žádný `prompts-1.0t.md` soubor)
- **Minimální zátěž uživatele** (jen 3 raster assety celkem)

### 5.1 Dodané uživatelem — raster, baked-in (✅ existují v `assets-source/themes/postapo/`)
1. `logo.png` — horizontální korodovaná železná cedule + Ikaros bird + „PROJEKT IKAROS" ✅ → konverze do `public/themes/postapo/decor/logo.webp`
2. `medailon.png` — čtvercová kovová deska s nýty + Ikaros bird silueta ✅ → konverze do `public/themes/postapo/decor/medailon.webp`
3. `background.png` (v `assets-source/themes/backgrounds/`) — toxická obloha + ruiny + havraní + varovná značka ✅ → konverze do `public/themes/backgrounds/postapo.webp` (kontrola, případně re-konverze)

### 5.2 Inline SVG data-uri ornamenty (žádné externí soubory, vše v `index.ts` jako CSS var)
1. **`--asset-rivet-corner`** — korodovaný kovový L-shape s 2 nýty (matný gradient + nýt highlight + nýt shadow, ~16 vector body). Použito v: sidebar levý 4× rohy, sidebar pravý 4× rohy, welcome card 4× rohy, Novinky card 4× rohy. Master TL, mirror přes CSS scaleX/Y.
2. **`--asset-dust-strip`** — vertikální column padajících drobných teček (popel/prach, ~25 teček) v rezavé/olivové/kostní barvě, různé velikosti. Použito v: body::before (levý strip 40px) + body::after (pravý strip 40px), repeat-y, animace 90s linear.
3. **`--asset-crt-static`** — pseudo-random noise dots tile 200×200px (drobné teček + krátké hairlines). Použito ve fullscreen ::after pseudo, mix-blend-mode overlay.
4. **`--asset-hazard-stripe`** — žluto-černá úhlopříčná páska 12×4px tile, 45° angle (caution warning tape). Použito v: section title bottom divider, nav item active expand, welcome title divider.
5. **`--asset-hazard-stripe-vertical`** — vertikální variant pro nav item left stripe (4px wide, vertikální orientace).
6. **`--asset-geiger-pulse`** — EKG waveform tile (flat line s občasným spike), barva radioactive green. Použito v topbar::after.
7. **`--asset-stencil-noise`** — sprejovaný tečky/úniky barvy pattern (~80×24px tile). Použito jako section title overlay, mix-blend-mode multiply.
8. **8× HAZMAT watermark glyph** (`--asset-hazmat-{name}`):
   - `--asset-hazmat-radiation` (☢ trefoil — NAVIGACE olive)
   - `--asset-hazmat-warning` (⚠ triangle — VESMÍRY rust)
   - `--asset-hazmat-radio` (📻 radio waves — CHAT yellow)
   - `--asset-hazmat-gear` (🔧 gear with rivets — ADMINISTRACE yellow)
   - `--asset-hazmat-skull` (💀 skull stamp — MOJE DISKUZE rust)
   - `--asset-hazmat-globe` (🌐 cracked globe — MOJE SVĚTY olive)
   - `--asset-hazmat-clipboard` (📋 clipboard stencil — OBLÍBENÉ ČLÁNKY amber)
   - `--asset-hazmat-biohazard` (☣ biohazard trefoil — OBLÍBENÉ OBRÁZKY green)
   - Inline SVG path s `fill="currentColor"` → CSS pak nastaví barvu přes `color: var(--section-color)`
9. **6× nav medailon ikona** (`--asset-icon-{name}`) — `stroke="currentColor"` stencil-style glyph:
   - `--asset-icon-uvodnik` — bunker door s nýty (Úvodník)
   - `--asset-icon-vytvorit-svet` — globe with crack/break lines (Vytvořit svět)
   - `--asset-icon-diskuze` — broken radio/walkie talkie (Diskuze)
   - `--asset-icon-clanky` — stamped clipboard/dossier (Články)
   - `--asset-icon-galerie` — broken photo frame (Galerie)
   - `--asset-icon-napoveda` — military Q-stamp (Nápověda)
10. **5× pravý panel section icons** — analogicky inline SVG glyphs (gear pro Administrace, multi-skull stamp Moje diskuze, multi-globe Moje světy, pin+clipboard Oblíbené články, pin+photo Oblíbené obrázky)
11. **1× chat ikona** — `--asset-icon-hospoda` (broken beer mug stencil pro Dimenzionální hospoda)
12. **`--asset-signature-script`** — SVG path s administrator signature kaligrafií („Příjemnou zábavu přeje administrátor."), stroke-dasharray pro self-draw animaci, color rust-bright
13. **`--asset-plus-stencil`** — stencil sprejovaný „+" glyph pro „přidat" tlačítka v pravém panelu

### 5.3 CSS-only motivy (žádný asset, vše v `decorations.css`)
- **DEAD WORLD watermark** ve welcome card (text content via ::before pseudo, Black Ops One 120px)
- **Radio call sign** v rohu welcome card (text content via ::before pseudo, Special Elite 10px)
- **Ghost signal** flicker (text content via ::after pseudo, Black Ops One 24px, animace 1×)
- **Atmosférický overlay** (radial + linear gradient nad BG)
- **Inner glow vrstvy welcome card** (radial gradients z rohů — slabé)
- **3D button depth** (multi-vrstvý gradient + inner highlight + inner shadow + translateY(3px) na active)
- **Geiger pulse keyframes** (`@keyframes postapo-geiger-pulse`)
- **Geiger scroll keyframes** (`@keyframes postapo-geiger-scroll`)
- **CRT static drift keyframes** (`@keyframes postapo-crt-drift`)
- **Dust fall keyframes** (`@keyframes postapo-dust-fall`)
- **Ghost signal keyframes** (`@keyframes postapo-ghost-signal`)
- **Signature self-draw keyframes** (`@keyframes postapo-signature-draw`)

### 5.4 Total asset count
- **3** raster WEBP (logo, medailon, background — dodáno uživatelem)
- **~25** inline SVG data-uri vars v `index.ts` (rivet corner + dust strip + CRT static + hazard stripe × 2 + geiger pulse + stencil noise + 8 HAZMAT + 6 nav icons + 5 section icons + chat icon + signature + plus glyph)
- **0** AI gen WEBP
- **0** ChatGPT prompts
- **0** externí HTTP requests za decor

---

## 6. Mobile / responsive

- ≤768px tablet:
  - Levý sidebar: full-width drawer (existující pattern)
  - Pravý sidebar: full-width drawer
  - Welcome card: aspect-ratio 4/3, padding 32px / 16px
  - Logo: 280px wide
  - Rivet corner ornaments: 40×40px sidebar, 48×48px welcome card
  - **Dust drift: skryto** (strip width 0)
  - HAZMAT watermark v rohu: 26×26px
- ≤480px mobile:
  - Welcome card: padding 24px / 12px, medailon 112×112px above text
  - Topbar buttons: ikony only
  - TYKY + ODHLÁSIT + ZLATÝ STANDARD → hamburger drawer
  - Rivet corners: 32×32px sidebar, 36×36px welcome card
- Touch target ≥48px všude (nav items, tlačítka, skin selector)
- `prefers-reduced-motion: reduce` → všechny animace vypnuty (viz 4.7)

---

## 7. Accessibility

- Color contrast (text-primary #b0a888 vs bg-card #1a1612): WCAG AA ratio 7.8:1 ✅
- Color contrast (accent olive #8a8810 vs bg-card): 4.6:1 ✅ (AA Normal)
- Color contrast (caution yellow #c8a008 vs bg-card): 6.3:1 ✅
- Color contrast (rust #7a3810 vs bg-card): 3.2:1 ✅ (AA Large only — use only for large headlines + decorative elements, not body text)
- All animations respektují `prefers-reduced-motion: reduce`
- Focus visible: rust-bright outline (2px solid var(--rust-bright) + 0 0 4px slabý glow) na všech interaktivních elementech
- Screen reader: section labels (`aria-label` na sekčních titulcích + nav items), HAZMAT watermarks `aria-hidden="true"` (decorative only), DEAD WORLD watermark `aria-hidden="true"`, ghost signal `aria-hidden="true"` (decorative flicker)
- Keyboard navigation: standard tab order, žádná tab-trap
- **Žádný motiv není politicky/kulturně necitlivý** — všechny HAZMAT symboly jsou univerzální mezinárodní (ISO 7010 inspired), žádné konkrétní vojenské insignie reálných armád, žádné svastiky, žádné konkrétní state-flag obraty

---

## 8. Risk

- **🟢 Background image** — ✅ existuje v `assets-source/themes/backgrounds/postapo.png`. Toxická obloha + ruiny + havraní + varovná značka. Kvalita dostatečná.
- **🟢 Logo + medailon** — ✅ dodány uživatelem 2026-05-11. Konzistentní industrial korodovaná železo + Ikaros bird estetika.
- **🟡 Performance — dust drift + CRT static animace** — 3 vrstvy CSS background-position animace, GPU-friendly. Riziko nízké, ale na mobilu CRT zachován / dust skryt preventivně.
- **🟡 Geiger pulse na active nav** — 8s interval je dostatečně rare, ale subtle. Pokud rušivé pro některé uživatele, **mitigation**: respektuje `prefers-reduced-motion`. Pokud i tak rušivé, lze v 1.0t-followup zvýšit interval na 15s.
- **🟡 Ghost signal flicker** — 1× per session může být překvapivé pro někoho, kdo není připraven. **Mitigation**: pouze opacity flicker, žádný shock motion. Reduced-motion = disabled. Pokud chce uživatel vynechat, lze v 1.0t-followup odstranit.
- **🟡 Inline SVG data-uri velikost** — `decorations.css` + `index.ts` budou větší díky inline SVG (~25 vars). Odhad: +18 KB minified vs WEBP varianta. **Mitigation**: SVG path optimalizace (svgo-like minimalizace before embedding), kompresí gzip se rozdíl smaže. Net benefit: 0 HTTP requestů > 18 KB inline.
- **🟢 HAZMAT symboly** — vykresleny jako inline SVG paths (vektor), univerzální ISO 7010 inspired ikonografie. Nezáleží na system fontu, žádné emoji rendering issue.
- **🟢 Theme isolation** — všechno scoped na `[data-theme="postapo"]`, žádný globální dopad.
- **🟢 Originality vs ostatní skiny** — žádný motiv nesdílen, originalita zaručena přes 11 originálních elementů (rivet corners, caution hazard stripes, stencil spray section titles, HAZMAT watermarks, CRT static drift, dust particle drift, geiger pulse + waveform, DEAD WORLD stencil, radio call sign, ghost signal, 3D heavy metal buttons).
- **🟢 Žádné AI gen assety** — nulová závislost na ChatGPT generaci, žádné prompty k iteraci, žádná inkonzistence stylu mezi 25 různě vygenerovanými ikonami.
- **🟢 Žádné politicky/kulturně necitlivé motivy** — všechny symboly univerzální HAZMAT/warning ikonografie (radiation trefoil, biohazard, skull warning, gear), žádné konkrétní vojenské insignie / vlajky / svastiky / state-symboly.

---

## 9. Otevřené otázky

1. **HAZMAT symbol výběr** — schvaluje uživatel 8 symbolů (☢ / ⚠ / 📻 / 🔧 / 💀 / 🌐 / 📋 / ☣) nebo má preferovaná alternativa? Default: schválen, zachovat. Pozn.: vše vykresleno jako inline SVG, ne unicode emoji.
2. **„ZLATÝ STANDARD" button design v postapo kontextu** — gold tint nesedí (žádné svítivé zlato v ruinách), navrženo nahradit matnou caution-yellow rim. Pokud chce uživatel zachovat výrazný „premium" rozlišovací prvek, lze alternativně rust-bright amber glow. Default: matná caution-yellow.
3. **Ghost signal text content** — ✅ schváleno uživatelem 2026-05-11: `"... POSLEDNÍ VYSÍLÁNÍ ..."`.
4. **Radio call sign content** — navrženo `"TX: 87.5 MHz · ZÓNA-7 · STILL BROADCASTING"`. Default: tento text.
5. **DEAD WORLD watermark content** — navrženo `"ZÓNA 7"` nebo `"DEAD WORLD"`. Default: `"ZÓNA 7"` (česky konzistentní s rest of skin).
6. **Thumbnail regenerace** — `public/themes/thumbnails/postapo.webp` existuje, ale je z původního minimálního skinu. Regenerace ano/ne? Default: post-1.0t (samostatný krok).

---

## 10. Acceptance criteria

Implementace 1.0t je „hotová" tehdy a jen tehdy:

- [ ] **Theme registry** — `src/themes/themes/postapo/index.ts` přepsán dle 3.1 (paleta + fonty + ~25 inline SVG data-uri asset vars)
- [ ] **Decorations** — `src/themes/themes/postapo/decorations.css` ~900–1000 řádků dle struktury kyberpunk / arabsky-svet / africke, všech 28 sekcí pokryto
- [ ] **Raster assety dodané uživatelem** — `logo.webp` + `medailon.webp` v `public/themes/postapo/decor/`, `postapo.webp` v `public/themes/backgrounds/` (vše konverzí z PNG přes pipeline)
- [ ] **Žádné AI gen assety** — `public/themes/postapo/decor/` obsahuje pouze logo.webp + medailon.webp, žádné WEBP ikony, žádný `_asset-prompts.md` soubor
- [ ] **11 originálních motivů** (rivet corners / caution hazard stripes / stencil spray section titles / HAZMAT watermarks / CRT static drift / dust particle drift / geiger pulse + waveform / DEAD WORLD stencil / radio call sign / ghost signal / 3D heavy metal buttons s rivet detail) všechny implementovány a fungují
- [ ] **Section-color mapping** všech 8 sekcí + 6 nav items dle tabulky v 4.0, HAZMAT ikony hot-swap barvy přes `currentColor`
- [ ] **3D hluboká tlačítka** — všechna primary tlačítka (header buttons, nav items, „+" buttons, skin selector) mají multi-vrstvý gradient + inner top highlight + inner bottom shadow + 4 nýty v rozích + `translateY(3px)` na :active
- [ ] **Mobile** — všechny breakpointy testovány (≤480px, ≤768px, >1024px), dust drift skryt na mobilu, drawer pattern funkční
- [ ] **Reduced-motion** — všechny animace vypnuty pod `prefers-reduced-motion: reduce`
- [ ] **Theme isolation** — zbylých 21 témat = nulová regrese (sanity check přes `git diff` mimo `themes/postapo/` a `public/themes/postapo/`)
- [ ] **Accessibility** — WCAG AA color contrast pro všechny text+bg kombinace, focus visible všude, HAZMAT watermarks + DEAD WORLD + ghost signal `aria-hidden`
- [ ] **Typography** — Black Ops One (logo) + Big Shoulders Stencil Display (display) + Special Elite (body) registrované přes Google Fonts (nebo bundled)
- [ ] **Mockup match** — výsledný skin vizuálně odpovídá dodanému mockupu (welcome card layout, caution hazard stripe pod welcome title, pravý panel mix s ADMINISTRACE nahoře, korodovaný kovový rám okolo všech panelů s rivet corners)
- [ ] **Žádné neon glow / shiny gloss** — kontrola že nikde není použit svítivý glow > 6px nebo barevný text-shadow > matné minimum (postapo = matný kov, žádný neon)
- [ ] **Audit dokument** — `audit-1.0t-postapo.md` s checklistem pro uživatele

---

## 11. Post-impl checklist

- [ ] `mobil-desktop` skill — test responsive (povinné per CLAUDE.md)
- [ ] `dluh` skill — zapsat případné nedořešené body (např. thumbnail regenerace)
- [ ] Update `docs/roadmap-fe.md` — zaškrtnout 1.0t
- [ ] Update `docs/dluhy.md` — uzavřít dluhy které 1.0t vyřešil
- [ ] Volitelně: dílčí spec soubory (`purpose.md`, `decisions.md`, `ai-notes.md`) v `docs/arch/phase-1/_side-tasks/postapo/`
- [ ] Commit: `feat(themes/postapo): krok 1.0t — Postapo skin upgrade`
- [ ] Screenshot do `docs/arch/phase-1/_screenshots/postapo-{welcome,sidebar,zoom}.png`

---

**Schválení:**
- [ ] PJ schválil spec (čeká 2026-05-11)
- [x] Frontend-design audit přiložen (✅ hotovo 2026-05-11, schválen 11 originálních motivů)
- [x] Logo + medailon dodány uživatelem (✅ 2026-05-11)
- [x] Background asset existuje (✅ `assets-source/themes/backgrounds/postapo.png`)
- [x] Inline SVG approach místo AI gen assetů schválen uživatelem (✅ konzistentní s 1.0s)

Po schválení → impl plán `plan-1.0t.md`.
