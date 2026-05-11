# Spec 1.0s — Kyberpunk visual upgrade

**Status:** 🟡 Spec ke schválení (2026-05-11)
**Datum:** 2026-05-11
**Rozsah:** FE skin upgrade — `[data-theme="kyberpunk"]` izolace, žádný globální dopad
**Repo:** `Projekt-ikaros-FE`, větev `feat/krok-1.0s-kyberpunk-upgrade` (vytvoří se při impl plánu)
**Velikost:** odhad ~2 soubory změna (`index.ts`, `decorations.css`) + 3 dodané assety (logo + medailon + background, WEBP konverze) = 5 souborů celkem. **Žádné AI gen assety** — všechny ornamenty (HUD brackets, ikony, watermarks, rain, glyphs) jsou inline SVG data-uri / CSS-only.
**Autor:** PJ + Claude
**Souvisí:** [spec-1.0r-arabsky-svet-upgrade.md](spec-1.0r-arabsky-svet-upgrade.md) (tier-1 structure precedent, explicitně se ODLIŠUJE — žádné rose petals / mukarnas / narghile / mašrabíja / 1001-nocí hedvábí), [spec-1.0n-vesmirna-bitva-upgrade.md](spec-1.0n-vesmirna-bitva-upgrade.md) (kontrast — vesmírná bitva = vojenský HUD, kyberpunk = streetová neonová tržnice), [spec-1.0d-sci-fi-upgrade.md](spec-1.0d-sci-fi-upgrade.md) (kontrast — sci-fi = sterilní korporátní glass, kyberpunk = gritty street), [spec-1.0b-theme-visuals.md](spec-1.0b-theme-visuals.md)

**Reference:**
- `assets-source/themes/kyberpunk/logo.png` — horizontální banner: tmavá HUD plaketa s neonovým cyan+magenta okrajem, decorative HUD circuit detaily v rozích (hexagon, scanline pattern), vlevo kulatý neonový medailon s anděl-křídlem silhouette, „PROJEKT IKAROS" v sci-fi neon fontu cyan+magenta gradient ✅ **user dodal**
- `assets-source/themes/kyberpunk/medailon.png` — vertikální panel 3:4: tmavé pozadí s subtle scanline texture, cyan+magenta neon HUD rámec (cyan TL/BR rohy, magenta TR/BL rohy, geometrické HUD bracket detaily), velký bílo-cyan anděl-křídlo silhouette uprostřed ✅ **user dodal**
- `assets-source/themes/backgrounds/kyberpunk.png` — cinematic noční megalopole: tmavá obloha s purpurovo-magenta-cyan paletou, létající auto, mrakodrapy s neon billboardy + ohromnými neon nápisy, mokré dlažby s neon odlesky, **obří neonový fénix/anděl hologram** s rozepnutými křídly v cyan+magenta gradientu nad mrakodrapy uprostřed/vpravo, déšť, depth atmosphere. ✅ **user dodal 2026-05-11**
- **Žádný `_asset-prompts.md` soubor se negeneruje** — všechny ornamenty kromě logo/medailon/BG jsou inline SVG data-uri v `decorations.css` + tokens v `index.ts`.

**Reference mockup (vzor cílové kvality):**
- Plně realizovaný mockup screenshot dodaný uživatelem 2026-05-11 zobrazující paletu (cyan+magenta+purple), atmosférické pozadí (megalopole + anděl hologram), layout panelů (levý nav, welcome card uprostřed, pravý ADMINISTRACE), magenta horizontální hairline přes welcome card, signature "Příjemnou zábavu přeje administrátor." v cyan italic kaligrafii. Tento mockup je **kvalitativní benchmark** — cílem skinu je se k němu přiblížit a přidat originální motivy (sparse rain, section-coloring stripe, broken neon flicker, CJK watermarks).

---

## 0. Princip — „Kyberpunk", noc v Akihabara 2099

> **Stojíš na mokré ulici v centru Neo-Tokia, hodinu po půlnoci. Déšť padá lehce ale neustále, mokré dlažby odráží neonové reklamy přilehlých storefrontů — laudry, ramen, robo-doll, holo-bar. Vysoko nad mrakodrapy se vznáší obří hologram anděla z modrofialového světla, tak velký že přesahuje celé město. Létající auta proudí mezi billboardy v různých výškách. Z kanálu v zemi stoupá pára. Někde za rohem hraje city-pop z 2027 z popraskaného reproduktoru. Vadná neonová cedule „ラーメン" bliká 1× za pár sekund. Asijské znaky padají po stěnách jako digitální déšť. Vzduch voní deštěm, neonem, syntetickou kuchyní a ozonem z přehořívajících transformátorů. Žiješ v budoucnosti, kterou si lidé na začátku 21. století představovali — a víc.**

Skin musí *dýchat streetovou kulturou a noční energií mládí* — multikolorová neonová tržnice, ne sterilní korporátní HUD. Kyberpunk jako **vize budoucnosti za mnoho staletí** kde se lidstvo posunulo do dimensionálního světla, ale městská ulice zůstala lidská, špinavá, plná příběhů.

**Inspirační kotvy:** *Blade Runner 2049* (Roger Deakins cinematography — purple/magenta/cyan vrstvy), *Cyberpunk 2077* (Night City — multibarevný neon v paralelních proudech, asijský urban undertone), *Ghost in the Shell* (1995 + 2017 — neonová Hong-Kong inspirace, japonské znaky jako prostředí), *Akira* (1988 — neon-tube nápisy, hi-tech low-life), *Tron: Legacy* (2010 — vertikální neon strips, dark + glow), *Mass Effect: Citadel* (Wards — multilevel neon ulice), Yoji Shinkawa concept art (Metal Gear Solid), Syd Mead pro Blade Runner. **Akihabara IRL** (Tokyo Electric Town — vrstvené neon ceduly, kanji billboards, otaku culture).

**NE** sterilní sci-fi glass panels (to dělá `sci-fi`). **NE** vojenský HUD + amber/cyan dual-tone (to dělá `vesmirna-lod` + `vesmirna-bitva`). **NE** alarm klaxon pulse + targeting reticle (`vesmirna-bitva`). **NE** scanline HUD overlay (`vesmirna-bitva`). **NE** Matrix-zelený digital rain (klišé — náš déšť je vícebarevný a typografický). **NE** generický „purple gradient on white" (AI slop). **NE** stereotypní pseudoasijské znaky které nic neznamenají — všechny CJK znaky musí být skutečné a smysluplné. **NE** politicky necitlivé motivy.

**Strict isolation:** vše scoped přes `[data-theme="kyberpunk"]`. Zbylých 21 témat = nulová regrese. (Memory rule: žádné sdílení / recyklace ornamentů s ostatními skiny — Kyberpunk má vlastní vizuální slovník: neon HUD rámce s cyan+magenta bracket rohy, section-color-coded vertikální stripe, broken neon flicker, RGB-split chromatic hover, sparse typografický rain v okrajích, CJK znakové watermarks, spray-tag drips, wet-pavement reflection pod welcome cardem.)

---

## 1. Cíl

Po `themeId === 'kyberpunk'` má dashboard vypadat jako **noční ulice Neo-Akihabary 2099** zalitá multibarevnými neony: hluboké půlnoční pozadí s baked-in megalopolí + anděl hologramem skrze tmavě fialovo-magenta panely s **neonovým cyan+magenta HUD bracket rámcem v rozích každého panelu** (master TL mirror přes CSS, převzaté přesně z medailonu uživatele), **welcome card jako „neonovou výlohou v dešti"** (tmavý panel s cyan+magenta HUD ornament rohem + magenta horizontální hairline divider uprostřed + wet pavement reflection gradient pod kartou + administrator signature dole), **sparse typografický neonový déšť** ve dvou vertikálních edge strips po stranách viewportu (cca 50px wide vlevo i vpravo, mezi nav panelem a hlavním obsahem; padající CJK znaky + binární v cyklujících neonových barvách, 1 vrstva 80s), **6 nav medailonů** s tematickými HUD ikonami (úvodník / nápověda / diskuze / články / galerie / vytvořit svět) — idle dark plate + cyan/magenta HUD outline, hover = RGB-split chromatic aberration + warm glow, active = **kombinovaný cyan+magenta neon outline + broken neon flicker (60ms blackout 1× za ~15s) + section-color vertikální stripe vlevo (4px) + CJK watermark v rohu hlavního panelu rozsvícený stejnou section barvou**, **section-color-coded sekční titulky** (8 sekcí, 8 různých neonových barev pro NAVIGACE/VESMÍRY/CHAT/ADMINISTRACE/MOJE SVĚTY/MOJE DISKUZE/OBLÍBENÉ ČLÁNKY/OBLÍBENÉ OBRÁZKY), **statické CJK watermarks v rozích sekčních karet** (8 různých kanji v 8 sekčních barvách, opacity 0.04, statické), **administrator signature self-draw** (italic kaligrafie ve welcome card se sama napíše při načtení, 2s ease-out, jen 1× per session).

Pravý panel = **MIX layout** (dle reference mockup dodaného uživatelem 2026-05-11, rozšíření globálního admin rozhodnutí z memory `project_admin_panel_decision.md`):
1. **ADMINISTRACE** (nahoře — skin selector + uživatelé) → cyan
2. **MOJE SVĚTY** (uprostřed) → magenta
3. **MOJE DISKUZE** → green
4. **OBLÍBENÉ ČLÁNKY** → yellow
5. **OBLÍBENÉ OBRÁZKY** (dole) → purple

Top bar zjednodušený dle mockupu: **POŠTA + UŽIVATELÉ + ZLATÝ STANDARD + TYKY + ODHLÁSIT** (původní layout).

**Audiowide** logo fallback (kruhové neon-tube křivky, 80s arcade DNA, baked-in do `logo.webp`) + **Bebas Neue** display (uppercase headings, condensed graffiti-poster energy) + **Share Tech Mono** body (CRT terminal feel) + **Audiowide** italic signature varianta pro administrator signature (decoded jako neon storefront sign). Vše izolované, bez dopadu na ostatní skiny.

---

## 2. Kontext / motivace

- Arabský svět (1.0r) byl naposled tier-1 produkční skin (sultánův palác, 1001 nocí). **„Kyberpunk" je 16. ve „tier-1 produkční kvalitě"** — futuristický neonový streetový skin jako vizuální opozit `arabsky-svet` (orientální noční palác, warm gold/turquoise; teď kyberpunk = futurní streetový noční purple/magenta/cyan), `africke` (savana za úsvitem; teď kyberpunk = městská noc), `severske-runy` (cold mead-hall fjord; teď kyberpunk = neon megalopole), `sci-fi` (sterilní korporátní HUD; teď kyberpunk = gritty street HUD), `vesmirna-lod` (vojenský hangár; teď kyberpunk = civilní střetová kultura), `vesmirna-bitva` (bridge of warship; teď kyberpunk = noční tržnice).
- Současný [`src/themes/themes/kyberpunk/index.ts`](../../../src/themes/themes/kyberpunk/index.ts) má minimální tokens (cyan+magenta paleta, Orbitron+Exo2+Roboto fonty, žádné assety). **Nutné kompletní přepsání** dle Akihabara direction.
- Současný [`src/themes/themes/kyberpunk/decorations.css`](../../../src/themes/themes/kyberpunk/decorations.css) má pouze 23 řádků (radial gradient overlay + clip-path na cards + hover box-shadow). **Nutné kompletní přepsání** dle struktury arabsky-svet / africke (~900–1000 řádků).
- Pozadí `background.png` (uživatel dodá) bude dramatické tier-1 kvality — noční scenérie megalopole s anděl hologramem mezi mrakodrapy, fialovo-magenta-cyan paleta, baked-in neon billboards + asijské znaky + flying cars + wet streets. UI musí toto pozadí *podpořit*, ne s ním soupeřit.
- User dodal `logo.png` + `medailon.png` v `assets-source/themes/kyberpunk/` — oba ve stylu tmavé HUD plakety + neon cyan/magenta bracket outline + anděl-křídlo silhouette. Tyto dva assety + dodaný background definují materiálový slovník: dále vygenerujeme **14 AI assetů** v ChatGPT (DALL-E 3 / GPT-image) s konzistentním stylem.
- Frontend-design audit proveden (2026-05-11), uživatel schválil **gritty street culture direction** (Akihabara/HK 2099 noční déšť, ne sterilní military sci-fi) + zúženou volbu otevřených bodů na 4 klíčové (BG, section-coloring, digital rain, glitch intenzita).
- Uživatel rozhodl 2026-05-11:
  - Section-coloring → varianta **C (hybrid)** — primary cyan+magenta pro active state, drobný 4px barevný section-tag stripe vlevo + 8 různě obarvených sekčních titulků
  - Digital rain → varianta **B (sparse rain v edge strips)** — 1 vrstva ve dvou vertikálních pásech (~50px vlevo+vpravo), zachovaný hallmark bez přesycení BG
  - Glitch/Flicker → varianta **B (středně střízlivé)** — broken neon flicker jen na active nav (1× za ~15s), RGB-split jen na hover, žádný random glitch napříč nav
- Po dokončení bude **16 skinů** s „asset-grade" upgradem → projekt bližší dokončené Fázi 1.

---

## 3. Audit současného stavu

### 3.1 Theme registry & tokens
- [`src/themes/themes/kyberpunk/index.ts`](../../../src/themes/themes/kyberpunk/index.ts) — existuje (cca 50 řádků). **Nutné kompletní přepsání** palety + fontů + tokens + asset URLs:
  - Paleta:
    - `--bg-primary` #08051a (deep midnight blue-purple)
    - `--bg-secondary` #0d0a25 (slightly lifted panel)
    - `--bg-card` #110c2e
    - `--bg-card-hover` #1a1140
    - `--accent` #00f0ff (electric cyan — primary brand)
    - `--accent-bright` #5cffff
    - `--accent-dim` #008090
    - `--magenta` #ff0080 (hot pink — secondary primary)
    - `--magenta-bright` #ff5cb0
    - `--purple` #b400ff (section accent)
    - `--green` #00ff80 (section accent)
    - `--yellow` #c8ff00 (section accent)
    - `--pink` #ff60d0 (section accent)
    - `--text-primary` #e4f7ff
    - `--text-secondary` #7a90b8
    - `--text-muted` #3a4060
    - `--border` #1f1840
    - `--border-strong` #ff0080
    - `--danger` #ff2050
    - `--success` #00ff80
    - `--warning` #c8ff00
    - `--info` #00f0ff
  - Fonty: **Audiowide** (logo fallback — kruhové neon-tube křivky, 80s arcade), **Bebas Neue** (display uppercase headings — condensed graffiti-poster energy), **Share Tech Mono** (body — CRT terminal mono)
- Asset URL proměnné chybí — nutné přidat (`--asset-logo`, `--asset-andel-medallion`, `--asset-corner` (cyan+magenta neon HUD bracket), `--asset-rain-strip`, 6× `--asset-icon-*`, `--asset-wet-reflection`, inline SVG data-uri pro CJK watermarks + section stripe + spray-tag drip + administrator signature).
- Atmosphere string z původního ("Neonová megalopole v dešti — cyan + magenta") se rozšíří na **„Kyberpunk — noční ulice Neo-Akihabary 2099, megalopole + anděl hologram + sparse digital rain + multibarevné neon ceduly + broken neon flicker + RGB-split"**.
- Theme `name` zůstává **„Kyberpunk"** (zachováno dle preference uživatele), `id: 'kyberpunk'` zachován.

### 3.2 Decorations
- [`src/themes/themes/kyberpunk/decorations.css`](../../../src/themes/themes/kyberpunk/decorations.css) — minimální stub (23 řádků). **Žádné panely, žádné NavItem styly, žádné dekorace, žádné mikrointerakce, žádný digital rain, žádné CJK watermarks, žádný flicker.** Skin viditelně nedokončený. **Nutné kompletní přepsání** dle struktury arabsky-svet / africke (~900–1000 řádků).

### 3.3 Asset folder
- `assets-source/themes/kyberpunk/` — ✅ existuje (logo.png + medailon.png dodány uživatelem 2026-05-11)
- `assets-source/themes/backgrounds/kyberpunk.png` — ✅ dodán uživatelem 2026-05-11 (BG je ve sdílené složce backgrounds dle stávající konvence projektu)
- `public/themes/backgrounds/kyberpunk.webp` — existuje (starší verze), **přepíše se** novým z `assets-source/`
- `public/themes/thumbnails/kyberpunk.webp` — existuje; kontrola; pokud existuje, případně regenerace později (post-1.0s)
- `public/themes/kyberpunk/decor/` — ❌ **neexistuje**, nutné vytvořit (2 soubory — `logo.webp` + `medailon.webp` konvertované z PNG → WEBP; `background.webp` jde do `public/themes/backgrounds/`)

### 3.4 Arabsky-svet + Africke jako pattern předlohy (struktura, NE obsah)
- [`src/themes/themes/arabsky-svet/decorations.css`](../../../src/themes/themes/arabsky-svet/decorations.css) — sekce 1–27 jako struktura
- [`src/themes/themes/africke/decorations.css`](../../../src/themes/themes/africke/decorations.css) — alternativní pattern
- **„Kyberpunk" použije stejnou strukturu** (sekce 1–27), ale s vlastní materiálovou a ornamentální paletou (**neon HUD bracket rámce s cyan+magenta + sparse typografický rain + broken neon flicker + RGB-split + section-color stripe + wet pavement reflection + CJK watermarks + administrator signature**). Nesdílí žádný ornament s ostatními skiny — má svůj vlastní vizuální slovník.

### 3.5 Memory & projekt-level rozhodnutí
- `project_admin_panel_decision.md` — Uživatelé + skin selector v ADMINISTRACE (pravý panel) → **kyberpunk rozšiřuje** o MOJE SVĚTY + MOJE DISKUZE + OBLÍBENÉ ČLÁNKY + OBLÍBENÉ OBRÁZKY pod tím (5 sekcí celkem v pravém panelu, viz mockup)
- `feedback_theme_isolation.md` — všechny edity scoped na `[data-theme="kyberpunk"]`, **žádné globální ani shared CSS edity bez souhlasu**
- `feedback_skin_originality.md` — ornamenty musí být originální, **žádné sdílení s ostatními skiny**
- `feedback_workflow.md` — povinný workflow: spec → souhlas → impl. plán → souhlas → kód
- `feedback_frontend_design_audit.md` — frontend-design skill jako audit (✅ hotovo 2026-05-11, schválen Akihabara/HK 2099 noční déšť direction)

---

## 4. Návrh řešení

### 4.0 Section-color mapping (klíčový hallmark)

**8 sekcí (sekční titulky) — varianta C hybrid:**
| Sekce | Barva | Hex | CJK znak (watermark) |
|---|---|---|---|
| NAVIGACE (levý) | electric cyan | #00f0ff | 光 (světlo) |
| VESMÍRY (levý) | hot magenta | #ff0080 | 宇 (vesmír) |
| CHAT (levý) | acid green | #00ff80 | 声 (hlas) |
| ADMINISTRACE (pravý) | electric cyan | #00f0ff | 制 (řád) |
| MOJE SVĚTY (pravý) | hot magenta | #ff0080 | 界 (svět) |
| MOJE DISKUZE (pravý) | acid green | #00ff80 | 話 (rozhovor) |
| OBLÍBENÉ ČLÁNKY (pravý) | acid yellow | #c8ff00 | 文 (text) |
| OBLÍBENÉ OBRÁZKY (pravý) | electric purple | #b400ff | 画 (obraz) |

**6 nav items v NAVIGACE (vertikální 4px section-tag stripe vlevo):**
| Nav item | Barva | Hex |
|---|---|---|
| Úvodník | electric cyan | #00f0ff |
| Vytvořit svět | hot magenta | #ff0080 |
| Diskuze | acid green | #00ff80 |
| Články | acid yellow | #c8ff00 |
| Galerie | electric purple | #b400ff |
| Nápověda | hot pink | #ff60d0 |

**Active state nav** = primary cyan+magenta combined neon outline (jako v mockupu, konzistentní s logem) + broken neon flicker (60ms blackout 1× za ~15s) + CJK watermark v rohu hlavního panelu rozsvícený sekční barvou tohoto nav itemu (cyan pro Úvodník, magenta pro Vytvořit svět, etc.).

CJK znaky vybrány smysluplně (skutečné slova v japonském psaní), žádné dekorativní šum-znaky.

### 4.1 Background & atmosféra

- **Background image** — `/themes/backgrounds/kyberpunk.webp` (⚠️ user dodá `assets-source/themes/kyberpunk/background.png`, **konverze PNG → WEBP** přes pipeline, plně nahrazuje stávající BG)
- **Atmosférický overlay** — radial-gradient pro fokus + linear darken pro čitelnost UI (BG je sám o sobě bohatě saturovaný):
  ```css
  '--theme-bg-overlay':
    'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(8, 5, 26, 0.50) 100%), linear-gradient(180deg, rgba(8, 5, 26, 0.20) 0%, rgba(8, 5, 26, 0.55) 100%)'
  ```
- **🎨 ORIGINÁL — Sparse typografický neonový déšť ve dvou edge strips** (signature element — žádný jiný skin nemá padající CJK znaky):
  - `[data-theme="kyberpunk"][data-shell="ikaros"] body::before` (levý strip) a `body::after` (pravý strip)
  - 2× fixed pseudo elementy: `width: 50px; top: 0; bottom: 0; left: 0` (resp. `right: 0`), `pointer-events: none; z-index: 1`
  - `background-image: var(--asset-rain-strip)` — inline SVG data-uri s vertikální column padajících CJK znaků + binárních 01 + ASCII glyphs (kanji 電脳神光夢街夜影龍, katakana サイバー, hiragana, 0/1), random barvy z palette (cyan/magenta/green/yellow/purple/pink), opacity 0.65 per znak
  - `background-size: 50px auto`, `background-repeat: repeat-y`, `mix-blend-mode: screen`, `opacity: 0.45`
  - Animation: `kyberpunk-rain-fall 80s linear infinite` — `background-position: 0 0 → 0 1200px`
  - **Mobile (≤768px)**: skryto (strip 0 width)
  - **Reduced-motion**: animace zastavena (statická pozice), opacity snížena na 0.30
- **🎨 ORIGINÁL — Subtle wet pavement gradient pod welcome cardem** (vertical mirror+blur — viz 4.5)

### 4.2 Topbar (slim, 56px) — tmavá HUD plaketa + cyan+magenta hairline

- Pozadí: tmavý gradient bez transparency (page-chrome je neprůhledný):
  ```css
  background:
    linear-gradient(180deg, rgba(8, 5, 26, 0.95) 0%, rgba(13, 10, 37, 0.98) 100%);
  ```
- **Žádný backdrop-filter** (heavy dark chrome, žádné prosvítání)
- **🎨 ORIGINÁL — Cyan+magenta neon hairline pod topbarem** (alternativa africké kente weave / arabsky-svet mašrabíja girih / sci-fi double rule):
  - 1px linear-gradient `linear-gradient(90deg, var(--accent) 0%, var(--magenta) 50%, var(--accent) 100%)` s `filter: drop-shadow(0 0 4px var(--accent)) drop-shadow(0 0 6px var(--magenta))` — duální cyan-magenta neon glow
- Logo vlevo z `logo.webp` (horizontal HUD plaketa s baked-in textem + cyan+magenta neon outline + anděl-křídlo medailon + sci-fi HUD circuit detaily): šíře `--asset-logo-w: 360px` desktop / `280px` tablet / `220px` mobile
- Pravé tlačítka (POŠTA, UŽIVATELÉ, ZLATÝ STANDARD, TYKY, ODHLÁSIT) = **dark HUD plate s cyan border**:
  - Background: `linear-gradient(180deg, rgba(13, 10, 37, 0.85) 0%, rgba(8, 5, 26, 0.90) 100%)`
  - Border: 1px solid var(--accent) (cyan)
  - Text: var(--text-primary) #e4f7ff uppercase **Bebas Neue**, letter-spacing 0.10em
  - Hover: border → magenta, text → white, **RGB-split chromatic aberration** na text (`text-shadow: 1px 0 var(--magenta), -1px 0 var(--accent)`), neon glow `0 0 12px var(--magenta-bright)`
  - **ZLATÝ STANDARD** button má speciální accent — jeho border je magenta v idle (premium feel), drop-shadow gold tint na hover je škrtnuto v kyberpunku (kontextově nesedí), nahrazeno magenta-purple gradient glow
- **Mobile (≤768px)**: ikony only, label hidden přes `aria-label`
- **Mobile (≤480px)**: TYKY + ODHLÁSIT + ZLATÝ STANDARD do hamburger drawer (existující pattern)

### 4.3 Sidebar levý — NAVIGACE / VESMÍRY / CHAT

- Frame: tmavě indigový panel s **cyan+magenta neon HUD bracket rohy** + **section-color-coded titulky**:
  - Background: `linear-gradient(160deg, rgba(13, 10, 37, 0.88) 0%, rgba(8, 5, 26, 0.94) 100%)`
  - Border: 1px solid var(--accent) (cyan, 0.55 opacity)
  - Inner border: `box-shadow: inset 0 0 0 1px rgba(255, 0, 128, 0.18)` (subtle magenta inner accent)
  - Box-shadow outer: deep `0 6px 22px rgba(8, 5, 26, 0.85)`
- **🎨 ORIGINÁL — Corner HUD bracket** — inline SVG data-uri (`--asset-corner-bracket` v `index.ts`): cyan+magenta neon HUD bracket — geometric L-shape s circuit detail (polyline path s `stroke="currentColor"` × 2 vrstvy: cyan vnější + magenta vnitřní offset 2px). Na všech 4 rozích (master TL, mirror přes CSS `transform: scaleX(-1) / scaleY(-1)` na ostatní 3 rohy):
  - Size: 72×72px desktop, 52×52px tablet, 38×38px mobile
  - `position: absolute; pointer-events: none; z-index: 5; filter: drop-shadow(0 0 6px var(--accent)) drop-shadow(0 0 8px var(--magenta))`
  - SVG path: ~24 vector body, 2 KB → zabaleno do data-uri inline, žádný HTTP request
- **Section titles** ("NAVIGACE" cyan, "VESMÍRY" magenta, "CHAT" green) — **Bebas Neue** uppercase, barva dle section-color mapping:
  ```css
  color: var(--section-color);  /* per-section CSS var */
  font-family: var(--font-display);  /* Bebas Neue */
  font-weight: 400;
  letter-spacing: 0.18em;
  text-shadow: 0 0 8px var(--section-color);
  ```
  + **horizon-neon divider** jako `::after` pseudo pod section title (alternativa africké horizon-glow / arabsky-svet mihrab):
  - `background: linear-gradient(90deg, transparent 0%, var(--section-color) 50%, transparent 100%); height: 1px; opacity: 0.85; filter: drop-shadow(0 0 4px var(--section-color))`
- **🎨 ORIGINÁL — CJK watermark v levém horním rohu sekce** (8 různých kanji, viz tabulka v 4.0):
  - Inline SVG data-uri proměnné v `index.ts` — 8 var-ů (`--asset-cjk-light`, `--asset-cjk-universe`, atd.)
  - Position: absolute, top 8px, left 8px, 28×28px desktop, 20×20px mobile
  - Color: var(--section-color), opacity 0.04 (statické) → 0.10 při hover sekce, 0.18 při aktivní nav položce s odpovídající section barvou
- **NavItem** ([class*="btn3d"]) — tmavý HUD plate s neon outline + ivory text:
  - Idle: dark gradient + 1px solid var(--accent) (cyan) border + text-primary #e4f7ff + subtle inner rim glow
  - **🎨 ORIGINÁL — Section-color vertikální stripe vlevo** (4px wide, 80% výšky, centrovaný):
    ```css
    &::before {
      content: '';
      position: absolute;
      left: 0; top: 10%; bottom: 10%;
      width: 4px;
      background: var(--section-color);  /* per-item, see 4.0 */
      filter: drop-shadow(0 0 4px var(--section-color));
      opacity: 0.75;
    }
    ```
  - Hover: text-primary → white, **RGB-split chromatic aberration** na text (`text-shadow: 1px 0 var(--magenta), -1px 0 var(--accent)`), section-color stripe opacity → 1.0, `translateY(-1px)` lift, neon glow `0 0 14px var(--accent)` + `0 0 18px var(--magenta)`
  - **Active** ([class*="btn3dActive"], [class*="navItemActive"]):
    - Background: `linear-gradient(90deg, rgba(0, 240, 255, 0.20) 0%, rgba(255, 0, 128, 0.20) 100%)` (cyan→magenta horizon)
    - Border: 1px solid var(--accent), inner border 1px solid var(--magenta)
    - Section-color stripe expands → 6px wide, opacity 1.0
    - **🎨 ORIGINÁL — Broken neon flicker** — 60ms blackout 1× za ~15s (animation `kyberpunk-neon-flicker 15s infinite` — keyframes: 0% opacity 1.0, 99.6% opacity 1.0, 99.7% opacity 0.0, 99.8% opacity 1.0, 100% opacity 1.0; net 60ms blackout)
    - Text: white #ffffff, glow `0 0 8px var(--accent), 0 0 12px var(--magenta)`
    - **🎨 ORIGINÁL — CJK watermark v rohu hlavního panelu** rozsvícený section-color tohoto active nav itemu (přes `[data-active-nav]` attribute na main shell → CSS var override pro `--accent-cjk`)
- Touch target ≥48px mobile
- **Reduced-motion**: flicker animace vypnuta (constant opacity 1.0), RGB-split na hover vypnuto

### 4.4 Sidebar pravý — ADMINISTRACE + MOJE SVĚTY + MOJE DISKUZE + OBLÍBENÉ ČLÁNKY + OBLÍBENÉ OBRÁZKY (mix layout)

- **Order (dle mockupu dodaného uživatelem 2026-05-11 + memory `project_admin_panel_decision.md` rozšíření):**
  1. **ADMINISTRACE** (nahoře, cyan section):
     - Section title „ADMINISTRACE" v cyan Bebas Neue + horizon-neon divider
     - **CJK watermark 制 (řád)** v rohu, cyan opacity 0.04
     - **Skin selector** (ThemeSwitcher) — dark HUD plate button s cyan border + caret, hover magenta glow
     - **Uživatelé** — link/button stejný styling
  2. **MOJE SVĚTY** (uprostřed, magenta section) — sekce s navigations + „+" přidat tlačítko
     - **CJK watermark 界 (svět)** v rohu, magenta opacity 0.04
  3. **MOJE DISKUZE** (green section) — sekce s navigations + „+" přidat tlačítko
     - **CJK watermark 話 (rozhovor)** v rohu, green opacity 0.04
  4. **OBLÍBENÉ ČLÁNKY** (yellow section)
     - **CJK watermark 文 (text)** v rohu, yellow opacity 0.04
  5. **OBLÍBENÉ OBRÁZKY** (purple section, dole)
     - **CJK watermark 画 (obraz)** v rohu, purple opacity 0.04
- Frame: stejný jako sidebar levý (dark HUD plate + 4× cyan+magenta HUD bracket corner)
- **„+" tlačítka** (rightAddBtn):
  - Background: `linear-gradient(180deg, rgba(0, 240, 255, 0.25) 0%, rgba(255, 0, 128, 0.20) 100%)` (cyan→magenta horizon)
  - Border: 1px solid var(--accent)
  - **`::before` pseudo s neon „+" glyph** (24×24px inline SVG plus icon s neon glow):
    ```css
    background-image: var(--asset-plus-neon);
    margin-right: 8px;
    transition: filter 200ms ease;
    ```
  - Hover: border → magenta, brighter cyan+magenta glow, plus glyph scale 1.08
  - Active: stamp scale 0.94 (klik feedback)
- **Empty hints** ("Žádné diskuze", "Žádné světy", "Žádné oblíbené") — **Audiowide** italic v var(--text-secondary) #7a90b8, opacity 0.75, font-size 16px

### 4.5 Welcome card — „Neonová výloha v dešti" (signaturní element)

- **Material:** tmavý panel s cyan+magenta HUD bracket rohy + magenta horizontální hairline divider uprostřed + wet pavement reflection gradient pod kartou + administrator signature dole
- **Tvar:** obdélník s mírně zaoblenými rohy, `border-radius: 8px`
  - `aspect-ratio: 16 / 7` desktop, fallback `min-height: clamp(380px, 50vh, 540px)` desktop
  - Padding: 48px vertikální, clamp(20px, 6vw, 100px) horizontální (text musí mít prostor dýchat)
- **Background — vrstvy** (zdola nahoru):
  1. Dark base — gradient `linear-gradient(180deg, rgba(17, 12, 46, 0.92) 0%, rgba(8, 5, 26, 0.96) 100%)` s subtle scanline texture noise (`filter: contrast(1.05)`)
  2. Vnitřní subtle glow z levého horního rohu (jako by se neon odrážel od přilehlé výlohy): radial-gradient `rgba(0, 240, 255, 0.12) 0%, transparent 60%`
  3. Vnitřní subtle glow z pravého dolního rohu (magenta accent): radial-gradient `rgba(255, 0, 128, 0.10) 0%, transparent 50%`
- **🎨 ORIGINÁL — 4× cyan+magenta HUD bracket corner ornaments** (inline SVG, stejný `--asset-corner-bracket` jako u sidebar v 4.3):
  - Outer border: 1px solid var(--accent), inner box-shadow inset 1px var(--magenta)
  - 4 corner ornaments pozice absolutně v rozích welcome card, scaleX/Y mirror přes CSS
  - Size: 80×80px desktop, 56×56px tablet, 40×40px mobile
  - `filter: drop-shadow(0 0 6px var(--accent)) drop-shadow(0 0 8px var(--magenta))`
- **🎨 ORIGINÁL — Magenta horizontální hairline divider uprostřed welcome card** (signature element z mockupu):
  - Element: `[data-frame-panel="card"]::before`
  - Position: absolute, top 50%, left 24px, right 24px, height 1px
  - Background: `linear-gradient(90deg, transparent 0%, var(--magenta) 20%, var(--magenta) 80%, transparent 100%)`
  - Filter: `drop-shadow(0 0 4px var(--magenta)) drop-shadow(0 0 8px var(--magenta-bright))`
  - Opacity: 0.85
- **🎨 ORIGINÁL — Wet pavement reflection pod welcome cardem** (vertical mirror+blur gradient):
  - Element: `[data-frame-panel="card"]::after`
  - Position: absolute, top 100%, left 0, right 0, height 80px
  - Background: `linear-gradient(180deg, rgba(255, 0, 128, 0.18) 0%, transparent 100%)` + 2nd layer `linear-gradient(180deg, rgba(0, 240, 255, 0.12) 0%, transparent 100%)`
  - Filter: `blur(8px)`
  - Mix-blend-mode: screen
  - Opacity: 0.65
  - Mobile (≤768px): height 40px
- **Heraldický medailon vlevo** (`[data-andel-medallion]`) — větší dominantní čtverec (medailon.webp = dark scanline panel s cyan+magenta neon HUD bracket + anděl-křídlo silhouette):
  - 192×192px desktop, 144×144px tablet, 112×112px mobile
  - `background-image: var(--asset-andel-medallion)`, contain, no-repeat, center
  - `flex-shrink: 0; filter: drop-shadow(0 4px 14px rgba(8, 5, 26, 0.85))`
- **Text styling uvnitř welcome card:**
  - **welcomeTitle** ("Vítej v Projektu Ikaros.") — **Bebas Neue** weight 400, color var(--text-primary) #e4f7ff, text-shadow `0 0 4px rgba(0, 240, 255, 0.40)`, font-size clamp(28px, 4vw, 44px), letter-spacing 0.02em, uppercase
  - **titleAccent** ("Projektu Ikaros.") — **Bebas Neue** weight 700, color var(--accent) #00f0ff (cyan accent vůči ivory title), text-shadow `0 0 8px var(--accent), 0 0 12px var(--accent-bright)`
  - **paragraph** (2 odstavce) — **Share Tech Mono** color var(--text-primary), line-height 1.7, font-size 15px
  - **🎨 ORIGINÁL — administrator signature self-draw** ("Příjemnou zábavu přeje administrátor.") — **Audiowide** italic, color var(--accent), text-shadow `0 0 6px var(--accent)`, font-size 24px, text-align center
    - SVG path s stroke-dasharray + dashoffset animace: signature se sama napíše při loadu welcome card
    - Animation: `kyberpunk-signature-draw 2s ease-out 1` (jen 1× per session)
    - Position: pod paragraph, mezi 2 neon-tube flourish liniemi (decoration: `::before` flourish vlevo + `::after` flourish vpravo)
- **Box-shadow** — deep night shadow + neon halo:
  ```css
  box-shadow:
    inset 0 0 0 1px rgba(0, 240, 255, 0.30),
    inset 0 0 80px rgba(8, 5, 26, 0.30),
    0 16px 40px -8px rgba(0, 240, 255, 0.25),
    0 24px 60px -12px rgba(255, 0, 128, 0.20),
    0 32px 80px -16px rgba(8, 5, 26, 0.85);
  ```
- **Cyan hairline** pod welcomeTitle (jako rytá HUD linka):
  ```css
  &::after {
    content: '';
    display: block;
    margin-top: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    filter: drop-shadow(0 0 4px var(--accent));
    opacity: 0.85;
  }
  ```

### 4.6 Novinky card

- Stejný material a HUD bracket rohy jako welcome card, ale bez magenta hairline divider a bez wet pavement reflection (pouze welcome card má signature treatment)
- Title "📰 Novinky" → emoji nahrazen neon ikona inline SVG (clipboard/news glyph s cyan glow), text v Bebas Neue, color var(--text-primary)
- Empty state: "Zatím žádné novinky." v Share Tech Mono opacity 0.65

### 4.7 Mikrointerakce & motion

- **Broken neon flicker** (active nav) — `kyberpunk-neon-flicker 15s infinite`:
  ```css
  @keyframes kyberpunk-neon-flicker {
    0%, 99.6%, 99.8%, 100% { opacity: 1.0; filter: brightness(1.0); }
    99.7% { opacity: 0.0; filter: brightness(0.3); }  /* 60ms blackout */
  }
  ```
- **RGB-split chromatic aberration** (hover na nav, topbar buttons):
  ```css
  text-shadow: 1px 0 var(--magenta), -1px 0 var(--accent);
  transition: text-shadow 150ms ease;
  ```
- **Signature self-draw** — SVG path s stroke-dasharray:
  ```css
  @keyframes kyberpunk-signature-draw {
    from { stroke-dashoffset: 100%; }
    to { stroke-dashoffset: 0; }
  }
  ```
- **Sparse rain** — `kyberpunk-rain-fall 80s linear infinite` (viz 4.1)
- **Reduced-motion** (`prefers-reduced-motion: reduce`):
  - Rain animace zastavena, statická pozice, opacity snížena na 0.30
  - Neon flicker disabled (constant opacity 1.0)
  - RGB-split disabled (constant text bez shadow split)
  - Signature self-draw disabled (instant full path visible)

### 4.8 Layout shell

- `<body data-shell="ikaros" data-theme="kyberpunk">` — všechny dekorace scoped pod tímto kombinovaným selectorem (zachová robustní isolation od ostatních témat).
- Right panel mix-layout řeší stávající `RightPanel.tsx` komponenta s `data-section-key` attribute na každé sekci → CSS bere `var(--section-color)` z dat-mapování v decorations.css.
- Žádné JS změny — vše čisté CSS na úrovni tématu.

---

## 5. Assety

**Princip kyberpunk skinu**: protože celá estetika je geometricky-vektorová (neon outline, HUD brackets, glyphs), VŠECHNY ornamenty kromě uživatelem dodaných raster brand assetů (logo + medailon + BG) jdou implementovat jako **inline SVG data-uri / CSS-only** přímo v `index.ts` + `decorations.css`. Tím se získá:
- **Section-color hot-swap přes `currentColor`** — jedna ikona, 6 barev podle nav itemu (bez 6× duplikovaných WEBP souborů)
- **Žádné HTTP requesty** za decor assety
- **Ostrý hi-DPI vždy** (vektor)
- **Konzistence s neon-line estetikou** (rastr by zaváděl blur)
- **0 prompts pro ChatGPT** (žádný `prompts-1.0s.md` soubor)
- **Minimální zátěž uživatele** (jen 3 raster assety celkem)

### 5.1 Dodané uživatelem — raster, baked-in (✅ existují v `assets-source/themes/kyberpunk/`)
1. `logo.png` — horizontální HUD plaketa + neon anděl + „PROJEKT IKAROS" ✅ → konverze do `public/themes/kyberpunk/decor/logo.webp`
2. `medailon.png` — vertikální 3:4 HUD panel + anděl-křídlo silhouette ✅ → konverze do `public/themes/kyberpunk/decor/medailon.webp`
3. `background.png` (v `assets-source/themes/backgrounds/`) — cinematic noční megalopole + fénix/anděl hologram cyan+magenta ✅ → konverze do `public/themes/backgrounds/kyberpunk.webp`

### 5.2 Inline SVG data-uri ornamenty (žádné externí soubory, vše v `index.ts` jako CSS var)
1. **`--asset-corner-bracket`** — cyan+magenta L-shape HUD bracket (polyline path × 2 vrstvy, ~24 vector body). Použito v: sidebar levý 4× rohy, sidebar pravý 4× rohy, welcome card 4× rohy, Novinky card 4× rohy. Master TL, mirror přes CSS scaleX/Y.
2. **`--asset-rain-strip`** — vertikální column padajících CJK + binárních znaků (kanji 電脳神光夢街夜影龍, katakana サイバー, hiragana, 0/1) v 6 cyklujících neonových barvách, opacity per znak 0.65. Použito v: body::before (levý strip 50px) + body::after (pravý strip 50px), repeat-y, animace 80s linear.
3. **8× CJK watermark glyph** (`--asset-cjk-{name}`):
   - `--asset-cjk-light` (光 — světlo, NAVIGACE cyan)
   - `--asset-cjk-universe` (宇 — vesmír, VESMÍRY magenta)
   - `--asset-cjk-voice` (声 — hlas, CHAT green)
   - `--asset-cjk-order` (制 — řád, ADMINISTRACE cyan)
   - `--asset-cjk-world` (界 — svět, MOJE SVĚTY magenta)
   - `--asset-cjk-talk` (話 — rozhovor, MOJE DISKUZE green)
   - `--asset-cjk-text` (文 — text, OBLÍBENÉ ČLÁNKY yellow)
   - `--asset-cjk-image` (画 — obraz, OBLÍBENÉ OBRÁZKY purple)
   - Inline SVG path s `fill="currentColor"` → CSS pak nastaví barvu přes `color: var(--section-color)`
4. **6× nav medailon ikona** (`--asset-icon-{name}`) — `stroke="currentColor"` line-art glyph uvnitř circle frame:
   - `--asset-icon-uvodnik` — domeček s neon outline (Úvodník)
   - `--asset-icon-vytvorit-svet` — globus s meridian linkami (Vytvořit svět)
   - `--asset-icon-diskuze` — bublina s 3 tečkami (Diskuze)
   - `--asset-icon-clanky` — datapad/scroll glyph (Články)
   - `--asset-icon-galerie` — hologram krystal/diamond (Galerie)
   - `--asset-icon-napoveda` — query mark glyph (Nápověda)
5. **5× pravý panel section icons** — analogicky inline SVG glyphs (gear pro Administrace, multi-globe Moje světy, multi-bubble Moje diskuze, pin+scroll Oblíbené články, pin+hologram Oblíbené obrázky)
6. **1× chat ikona** — `--asset-icon-hospoda` (neon beer glass glyph pro Dimenzionální hospoda)
7. **`--asset-signature-script`** — SVG path s administrator signature kaligrafií („Příjemnou zábavu přeje administrátor."), stroke-dasharray pro self-draw animaci
8. **`--asset-plus-neon`** — neon „+" glyph pro „přidat" tlačítka v pravém panelu

### 5.3 CSS-only motivy (žádný asset, vše v `decorations.css`)
- **Section-color vertikální stripe** vlevo od nav items (4px CSS background)
- **Magenta horizontal hairline divider** uprostřed welcome card (linear-gradient)
- **Wet pavement reflection** pod welcome cardem (blur+gradient `::after`)
- **Cyan+magenta hairline pod topbarem** (linear-gradient 1px)
- **Broken neon flicker keyframes** (`@keyframes kyberpunk-neon-flicker`)
- **RGB-split chromatic aberration** (`text-shadow: 1px 0 var(--magenta), -1px 0 var(--accent)`)
- **Horizon-neon divider** pod section titles (linear-gradient + drop-shadow)
- **Atmosférický overlay** (radial + linear gradient nad BG)
- **Inner glow vrstvy welcome card** (radial gradients z rohů)

### 5.4 Total asset count
- **3** raster WEBP (logo, medailon, background — dodá uživatel)
- **~22** inline SVG data-uri vars v `index.ts` (corner bracket + rain + 8 CJK + 6 nav icons + 5 section icons + chat icon + signature + plus glyph)
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
  - HUD bracket corners: 52×52px
  - **Sparse rain: skryto** (strip width 0)
  - CJK watermark v rohu: 20×20px
- ≤480px mobile:
  - Welcome card: padding 24px / 12px, medailon 112×112px above text
  - Topbar buttons: ikony only
  - TYKY + ODHLÁSIT + ZLATÝ STANDARD → hamburger drawer
  - HUD bracket corners: 38×38px
- Touch target ≥48px všude (nav items, tlačítka, skin selector)
- `prefers-reduced-motion: reduce` → všechny animace vypnuty (viz 4.7)

---

## 7. Accessibility

- Color contrast (text-primary #e4f7ff vs bg-card #110c2e): WCAG AAA ratio 17.2:1 ✅
- Color contrast (accent #00f0ff vs bg-card): 13.4:1 ✅
- Color contrast (magenta #ff0080 vs bg-card): 7.1:1 ✅ (AA Large)
- All animations respektují `prefers-reduced-motion: reduce`
- Focus visible: cyan neon outline (1px solid var(--accent) + 0 0 4px glow) na všech interaktivních elementech
- Screen reader: section labels (`aria-label` na sekčních titulcích + nav items), CJK watermarks `aria-hidden="true"` (decorative only)
- Keyboard navigation: standard tab order, žádná tab-trap
- Žádný použitý znak v `lang="ja"` blokech není politicky/kulturně necitlivý — všechny vybrány jako common smysluplné kanji

---

## 8. Risk

- **🟢 Background image** — ✅ dodán uživatelem v `assets-source/themes/backgrounds/kyberpunk.png` (2026-05-11). Cinematic kvality, fénix/anděl hologram + neonová megalopole. Impl plán uvolněn.
- **🟡 Performance — sparse rain animace** — 1 vrstva CSS background-position animace 80s linear, GPU-friendly. Riziko nízké, ale na mobilu skryto preventivně.
- **🟡 Broken neon flicker** — některé uživatele může rušit i s 15s intervalem. **Mitigation**: respektuje `prefers-reduced-motion`. Pokud i tak rušivé, lze v 1.0s-followup zvýšit interval na 30s.
- **🟡 RGB-split chromatic aberration na text** — může snížit čitelnost při dlouhém hover. **Mitigation**: aplikováno jen na hover (ne focus), text se vrací na normální při blur. Žádný čtecí text nepoužívá RGB-split (jen interactive elements).
- **🟡 Inline SVG data-uri velikost** — `decorations.css` + `index.ts` budou větší díky inline SVG (~22 vars). Odhad: +15 KB minified vs WEBP varianta. **Mitigation**: SVG path optimalizace (svgo-like minimalizace before embedding), kompresí gzip se rozdíl smaže. Net benefit: 0 HTTP requestů > 15 KB inline.
- **🟢 CJK znaky** — vykresleny jako inline SVG paths (vektor), nezáleží na system fontu → tofu fallback NENÍ riziko.
- **🟢 Theme isolation** — všechno scoped na `[data-theme="kyberpunk"]`, žádný globální dopad.
- **🟢 Originality vs ostatní skiny** — žádný motiv nesdílen, originalita zaručena přes 9 originálních elementů (rain, section-stripe, flicker, RGB-split, magenta hairline divider, wet pavement, CJK watermarks, signature, neon HUD brackets).
- **🟢 Žádné AI gen assety** — nulová závislost na ChatGPT generaci, žádné prompty k iteraci, žádná inkonzistence stylu mezi 14 různě vygenerovanými ikonami.

---

## 9. Otevřené otázky

1. **CJK znak výběr** — schvaluje uživatel 8 znaků (光 / 宇 / 声 / 制 / 界 / 話 / 文 / 画) nebo má preferovaná alternativa? Default: schválen, zachovat.
2. **„ZLATÝ STANDARD" button design v kyberpunk kontextu** — gold tint nesedí, navrženo nahradit magenta-purple gradient glow. Pokud chce uživatel zachovat výrazný „premium" rozlišovací prvek, lze alternativně rim s rainbow neon outline (cyan+magenta+yellow+green). Default: magenta-purple gradient.
3. **Thumbnail regenerace** — `public/themes/thumbnails/kyberpunk.webp` existuje, ale je z původního minimálního skinu. Regenerace ano/ne? Default: post-1.0s (samostatný krok).

---

## 10. Acceptance criteria

Implementace 1.0s je „hotová" tehdy a jen tehdy:

- [ ] **Theme registry** — `src/themes/themes/kyberpunk/index.ts` přepsán dle 3.1 (paleta + fonty + ~22 inline SVG data-uri asset vars)
- [ ] **Decorations** — `src/themes/themes/kyberpunk/decorations.css` ~900–1000 řádků dle struktury arabsky-svet / africke, všech 27 sekcí pokryto
- [ ] **Raster assety dodané uživatelem** — `logo.webp` + `medailon.webp` v `public/themes/kyberpunk/decor/`, `kyberpunk.webp` v `public/themes/backgrounds/` (vše konverzí z PNG přes pipeline)
- [ ] **Žádné AI gen assety** — `public/themes/kyberpunk/decor/` obsahuje pouze logo.webp + medailon.webp, žádné WEBP ikony, žádný `_asset-prompts.md` soubor
- [ ] **9 originálních motivů** (rain edge strips / section-color stripe / broken neon flicker / RGB-split hover / magenta hairline divider / wet pavement reflection / CJK watermarks / signature self-draw / cyan+magenta HUD bracket corners) všechny implementovány a fungují
- [ ] **Section-color mapping** všech 8 sekcí + 6 nav items dle tabulky v 4.0, ikony hot-swap barvy přes `currentColor`
- [ ] **Mobile** — všechny breakpointy testovány (≤480px, ≤768px, >1024px), rain skryt na mobilu, drawer pattern funkční
- [ ] **Reduced-motion** — všechny animace vypnuty pod `prefers-reduced-motion: reduce`
- [ ] **Theme isolation** — zbylých 21 témat = nulová regrese (sanity check přes `git diff` mimo `themes/kyberpunk/` a `public/themes/kyberpunk/`)
- [ ] **Accessibility** — WCAG AA color contrast pro všechny text+bg kombinace, focus visible všude, CJK watermarks `aria-hidden`
- [ ] **Typography** — Audiowide (logo) + Bebas Neue (display) + Share Tech Mono (body) registrované přes Google Fonts (nebo bundled)
- [ ] **Mockup match** — výsledný skin vizuálně odpovídá dodanému mockupu (welcome card layout, magenta hairline, pravý panel mix, cyan+magenta neon outline na nav items)
- [ ] **Audit dokument** — `audit-1.0s-kyberpunk.md` s checklistem pro uživatele

---

## 11. Post-impl checklist

- [ ] `mobil-desktop` skill — test responsive (povinné per CLAUDE.md)
- [ ] `dluh` skill — zapsat případné nedořešené body (např. thumbnail regenerace)
- [ ] Update `docs/roadmap-fe.md` — zaškrtnout 1.0s
- [ ] Update `docs/dluhy.md` — uzavřít dluhy které 1.0s vyřešil
- [ ] Volitelně: dílčí spec soubory (`purpose.md`, `decisions.md`, `ai-notes.md`) v `docs/arch/phase-1/_side-tasks/kyberpunk/`
- [ ] Commit: `feat(themes/kyberpunk): krok 1.0s — Kyberpunk skin upgrade`
- [ ] Screenshot do `docs/arch/phase-1/_screenshots/kyberpunk-{welcome,sidebar,zoom}.png`

---

**Schválení:**
- [ ] PJ schválil spec (čeká 2026-05-11)
- [x] Frontend-design audit přiložen (✅ hotovo 2026-05-11)
- [x] User otázky 1–4 zodpovězeny — BG=A, section-coloring=C, rain=B, glitch=B (✅ hotovo 2026-05-11)
- [x] Logo + medailon dodány uživatelem (✅ 2026-05-11)
- [x] Background asset dodán uživatelem (✅ 2026-05-11, `assets-source/themes/backgrounds/kyberpunk.png`)
- [x] Inline SVG approach místo AI gen assetů schválen uživatelem (✅ 2026-05-11)

Po schválení → impl plán `plan-1.0s.md`.
