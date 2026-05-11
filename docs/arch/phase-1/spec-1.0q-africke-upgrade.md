# Spec 1.0q — Africké visual upgrade („Země předků")

**Status:** 🟡 Spec ke schválení (2026-05-11)
**Datum:** 2026-05-11
**Rozsah:** FE skin upgrade — `[data-theme="africke"]` izolace, žádný globální dopad
**Repo:** `Projekt-ikaros-FE`, větev `feat/krok-1.0q-africke-upgrade` (vytvoří se při impl plánu)
**Velikost:** odhad ~3 soubory změna (`index.ts`, `decorations.css`, `public/themes/africke/`) + 13 nových assetů + 2 dodané (logo + medailon) = 15 souborů celkem
**Autor:** PJ + Claude
**Souvisí:** [spec-1.0p-indiane-upgrade.md](spec-1.0p-indiane-upgrade.md) (tier-1 structure precedent, explicitně se ODLIŠUJE — žádné iron studs, žádné tribal cik-cak, žádné Medicine Wheel pictogramy), [spec-1.0o-severske-runy-upgrade.md](spec-1.0o-severske-runy-upgrade.md) (struktura), [spec-1.0b-theme-visuals.md](spec-1.0b-theme-visuals.md)

**Reference:**
- `public/themes/backgrounds/africke.webp` — savana za úsvitu/soumrakem, baobaby vlevo+vpravo, carved monolity uprostřed scény, hliněné nádoby s tribal vzory, malé ohniště vpravo dole, akáciové stromy v dálce, dramatická oranžovo-amber obloha ✅ **existuje, zachováno**
- `public/themes/thumbnails/africke.webp` — thumbnail pro skin selector ✅ **existuje, zachováno**
- `assets-source/themes/africke/logo.png` — horizontální banner: kente weave pozadí (vertikální zlato-bronz pruhy na tmavém pozadí), vlevo kulatý medailon s andělem v kresbě, vpravo „Projekt Ikaros" v elegantním script fontu (Allura/Pinyon styling), zlato-cream rohové ornamenty ✅ **user dodal**
- `assets-source/themes/africke/medailon.png` — čtvercový rám z patinovaného dřeva s **carved bronze diamond ornamenty** v rozích (4-point diamond + triangles motiv), tmavý černo-šedý kamenný/leather vnitřek, velký zlato-cream anděl-křídlo silhouette uprostřed ✅ **user dodal**
- Bude vygenerováno: `public/themes/africke/decor/_asset-prompts.md` (13 prompty pro AI generaci)

---

## 0. Princip — „Země předků", savana za úsvitem

> **Stojíš na okraji nekonečné savany, právě když slunce začíná lízat horizont. Mezi vyprahlou trávou stojí monolithy — kámen vyrytý dlouhými prsty předků. Akácie roztahují tenké větve nad tvou hlavou, baobaby stojí jako pomníky času, který nestárne. Vzduch se tetelí horkem, ze suchého popela ohniště ještě stoupá tenký proužek kouře. Tady neexistuje pojem „nekonečno" jako abstrakce — je to to, co vidíš, když se otočíš. A pod každým krokem ti šeptá země: byl jsi tu vždy.**

Skin musí *dýchat klidem prastaré země* — pomalu, kontemplativně, s vážností předků. **Není to safari**, není to romantizovaná „Afrika z dokumentu" — je to vzpomínka na svět starší než hranice mapy.

**Inspirační kotvy:** *Sebastião Salgado* (Genesis — savana, kmeny, krajiny), *Marlene Dumas* africké portréty (cream + ochre patina), Ife/Benin bronz (12.–16. století Nigérie), Mali Bògòlanfini (mudcloth — geometrické tkané vzory), Ašanti Adinkra symboly (Sankofa, Gye Nyame, Adinkrahene), Dogon kosmologie (žebříky, hvězdy), *Out of Africa* (Pollack, 1985) cinematic dawn shots, Stardew Valley journal artwork (organická melancholie), Anglické sepia photographs prvního průzkumu (Burton, Speke).

**NE** Marvel Black Panther / Wakanda futurismus. **NE** Disney Lion King kreslený styl. **NE** safari turismus / khaki & deštníky. **NE** Hollywood „tribal warrior" stereotype (žádné nadměrné válečné dekorace). **NE** Arabský palác (`arabsky-svet` má burgundy + turquoise + arabesque — severní Afrika, oddělené). **NE** Indiánské tribal cik-cak diamondy + Medicine Wheel pictogramy + iron nail studs (`indiane`). **NE** politicky necitlivá karikatura, žádné stereotypní masky-pop. **NE** generická D&D pergamen (`pergamen`). **NE** burgundy/brass (`hospoda`). **NE** dark ossuary (`nemrtvi`).

**Strict isolation:** vše scoped přes `[data-theme="africke"]`. Zbylých 21 témat = nulová regrese. (Memory rule: žádné sdílení / recyklace ornamentů s ostatními skiny — Země předků má vlastní vizuální slovník: kente weave bandy, carved bronze diamond corners, mudcloth geometric stripes, adinkra watermarks, pískovcová stéla, baobab + akáciové siluety.)

---

## 1. Cíl

Po `themeId === 'africke'` má dashboard vypadat jako **savana za úsvitem na hraně Země předků**: hluboké zemité pozadí (`#100804`) prosvítající skrze tmavé patinované dřevěné panely s **kente weave bandem** podél horní a dolní hrany, **carved bronze diamond corner ornaments ve všech 4 rozích každého panelu** (master TL mirror přes CSS, převzaté přesně z medailonu uživatele), **welcome card jako vyrytá pískovcová stéla** (vertikální/horizontální tablet s rytým textem, carved bronze diamonds po levé+pravé straně, mudcloth band na dolní hraně, monolith silhouette watermark v pozadí), **acacia-canopy silueta v topbaru** (velmi tlumená, jen větvení, žádné listí), **baobab-corner silueta** v horní levé části BG, **horizon-glow divider mezi sekcemi sidebaru** (graduovaný horizontální gradient od průhledné přes amber přes průhlednou — vzdálené slunce za horizontem, NE čára ani ornament), **7 carved sandstone tablet nav medailonů** s rytými symboly (vycházející slunce / baobab / Akoma srdce / papyrus / oko / Sankofa / ohniště) — idle sandstone + aged-gold ryté hrany, hover = warm sunset glow, active = **rozjasněný horizon gradient + aged-gold left-border**, **heat shimmer** (jemné chvění vzduchu v horní třetině pozadí, 8s cycle), **diagonal dust drift** (řídké prachové částice zleva doprava, různé velikosti, 12–18s/jednotka), **acacia shadow sway** (silueta větví v topbaru se houpá 2°, 12s cycle), **sun ascending** (horizon-glow divider jednou vystoupá zdola nahoru při načtení stránky, 2s ease-out, jen 1× per session), **adinkra watermarks** (4–5 symbolů jako transparent watermarks v rozích panelů, opacity 6–10 %, kontextové: Sankofa pro úvodník/zpět, Gye Nyame pro home, Adinkrahene pro administrace, Akoma pro diskuze).

Pravý panel = **ADMINISTRACE** (skin selector + uživatelé NAHOŘE — odchylka od mockupů, z memory `project_admin_panel_decision.md`) + **MOJE DISKUZE / MOJE SVĚTY** (uprostřed). Top bar zjednodušený: **Pošta + Tyky + Odhlásit** (Uživatelé + Skin selector přesunuty do pravého panelu).

**Allura** logo (script font, baked-in do `logo.webp`) + **Yeseva One** display (uppercase headings, carved into stone feel) + **Gentium Plus** body (humanistický klid) + **Italianno** signature italic v aged-gold (souznění s logem). Vše izolované, bez dopadu na ostatní skiny.

---

## 2. Kontext / motivace

- Indián (1.0p) byl naposled tier-1 produkční skin (Strážci horizontu, prairie soumrak). **„Země předků" je 14. ve „tier-1 produkční kvalitě"** — sub-saharská prastará Afrika jako vizuální opozit `indiane` (warm wood + iron + leather + tribal cik-cak; teď africké = sandstone + bronze + kente + mudcloth, žádné iron studs, žádné cik-cak), `arabsky-svet` (palác, burgundy + arabesque; teď africké = savana, zemité tóny, žádný palác), `severske-runy` (cold mead-hall + ice; teď africké = warm horizon + dust).
- Současný [`src/themes/themes/africke/index.ts`](../../../src/themes/themes/africke/index.ts) má 50 řádků s minimálními tokens (eben/amber/terracotta paleta, Cinzel/IM Fell English/Lora fonty). **Cinzel je už použit indiánem + arabským = off-brand pro africké**, výměna za **Allura + Yeseva One + Gentium Plus + Italianno** dává Zemi předků vlastní typografický slovník (žádný jiný skin v projektu tyto 4 fonty nepoužívá).
- Současný [`src/themes/themes/africke/decorations.css`](../../../src/themes/themes/africke/decorations.css) má jen 14 řádků stub (background gradient + 3px card border-radius). Skin viditelně neodlišený — vypadá jako varianta default tématu.
- Pozadí `africke.webp` je už dramatické (savana s monolity, baobaby, akácie, ohniště) — žádná regenerace BG potřebná. UI musí toto pozadí *podpořit*, ne s ním soupeřit.
- User dodal `logo.png` + `medailon.png` v `assets-source/themes/africke/` (založené na kente weave + carved bronze diamond styling) — oba ve stylu patinované dřevo + zlato-bronz tribal ornamenty. Tyto dva assety definují materiálový slovník: dále vygenerujeme **13 AI assetů** v ChatGPT (DALL-E 3 / GPT-image) s konzistentním stylem.
- Po dokončení bude **14 skinů** s „asset-grade" upgradem → projekt bližší dokončené Fázi 1.
- Frontend-design audit proveden (2026-05-11): nabídnuty 3 directions (Bronz předků / Velký horizont / Vetkané příběhy), uživatel zvolil fúzi **B + náznak C** = „Velký horizont s vetkanou pamětí".

---

## 3. Audit současného stavu

### 3.1 Theme registry & tokens
- [`src/themes/themes/africke/index.ts`](../../../src/themes/themes/africke/index.ts) — existuje (50 řádků, minimal). Definuje paletu (`#0e0804` BG, `#c8880a` accent), fonty Cinzel + IM Fell English + Lora. **Nutné kompletní přepsání palety + fontů + tokens + asset URLs** dle rozhodnutí:
  - Paleta: earth-deep `#100804`, earth-shadow `#2a1408`, earth-laterite `#6a2810`, horizon-dawn `#f4a050`, horizon-sun `#ffd078`, earth-ochre `#8a5028`, earth-dust `#c89878`, acacia-bark `#5a3018`, sky-cobalt `#1a3858`, aged-gold `#c8881a`, aged-gold-bright `#e8b840`, bronze-warm `#b87830`, bronze-deep `#5a3210`, cream `#f0e0c0`, sand-pale `#d4a060`
  - Fonty: **Allura** (logo fallback — script), **Yeseva One** (display headings — distinct slab serif), **Gentium Plus** (body — humanistický klid), **Italianno** (signature italic — tence kurzívní). Cinzel se odstraní (off-brand vůči africkému, používá indián + arabský).
- Asset URL proměnné chybí — nutné přidat (`--asset-logo`, `--asset-andel-medallion` (= medailon), `--asset-corner` (carved bronze diamond), `--asset-stele-frame`, `--asset-mudcloth-band`, `--asset-baobab-corner`, `--asset-acacia-canopy`, `--asset-monolith-watermark`, 7× `--asset-icon-*`).
- Atmosphere string z „Africká savana — eben, amber, terracotta, kmenové vzory" se přepíše na **„Země předků — savana za úsvitem, sandstone + carved bronze + kente weave bandy + mudcloth band, monolithy a baobaby na horizontu"**.
- Theme `name` z „Africké" se přepíše na **„Země předků"**.

### 3.2 Decorations
- [`src/themes/themes/africke/decorations.css`](../../../src/themes/themes/africke/decorations.css) — 14 řádků, jen background gradient + 3px card border-radius. **Žádné panely, žádné NavItem styly, žádné dekorace, žádné mikrointerakce, žádné motion.** Skin viditelně nedokončený. **Nutné kompletní přepsání** dle struktury indiane / hospoda / severske-runy (~800–1000 řádků).

### 3.3 Asset folder
- `assets-source/themes/africke/` — ✅ existuje (logo.png, medailon.png dodány uživatelem 2026-05-11)
- `public/themes/backgrounds/africke.webp` — ✅ existuje (savana scéna, **zachováno**)
- `public/themes/thumbnails/africke.webp` — ✅ existuje
- `public/themes/africke/decor/` — ❌ **neexistuje**, nutné vytvořit (15 souborů — 13 AI gen + logo + medailon konvertované z PNG → WEBP)

### 3.4 Indiane + Severské runy jako pattern předlohy (struktura, NE obsah)
- [`src/themes/themes/indiane/decorations.css`](../../../src/themes/themes/indiane/decorations.css) — sekce 1–22 jako struktura
- [`src/themes/themes/severske-runy/decorations.css`](../../../src/themes/themes/severske-runy/decorations.css) — alternativní pattern
- **„Země předků" použije stejnou strukturu** (sekce 1–22), ale s vlastní materiálovou a ornamentální paletou (**sandstone + bronze + kente + mudcloth + adinkra + baobab/acacia silhouette**). Nesdílí žádný ornament s ostatními skiny — má svůj vlastní vizuální slovník.

### 3.5 Memory & projekt-level rozhodnutí
- `project_admin_panel_decision.md` — Uživatelé + skin selector v ADMINISTRACE (pravý panel) → **odchylka od mockupů, africké potvrzuje**
- `feedback_theme_isolation.md` — všechny edity scoped na `[data-theme="africke"]`, **žádné globální ani shared CSS edity bez souhlasu**
- `feedback_skin_originality.md` — ornamenty musí být originální, **žádné sdílení s ostatními skiny**
- `feedback_workflow.md` — povinný workflow: spec → souhlas → impl. plán → souhlas → kód
- `feedback_frontend_design_audit.md` — frontend-design skill jako audit (✅ hotovo v konverzaci 2026-05-11, vybrána fúze B+C)

---

## 4. Návrh řešení

### 4.1 Background & atmosféra

- **Background image** — `/themes/backgrounds/africke.webp` (✅ existuje, savana scéna, **neměníme**)
- **Atmosférický overlay** — radial-gradient pro fokus + linear darken pro čitelnost UI (background je už warm/oranžový, dodáme jen jemný kontrast a vignette):
  ```css
  '--theme-bg-overlay':
    'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(16, 8, 4, 0.45) 100%), linear-gradient(180deg, rgba(16, 8, 4, 0.30) 0%, rgba(16, 8, 4, 0.55) 100%)'
  ```
- **🎨 Heat shimmer overlay** (signature element — žádný jiný skin nemá animovaný vzduch):
  - `[data-theme="africke"][data-shell="ikaros"]::before` — SVG turbulence filter na transparentním vrstvení v top třetině obrazovky
  - Implementace: inline SVG `feTurbulence` + `feDisplacementMap` jako `background`, mix-blend-mode: overlay, opacity 0.06
  - Animation: `africke-heat-shimmer 8s ease-in-out infinite` — turbulence seed nebo opacity 0.04 → 0.08 → 0.04
  - `height: 35vh; pointer-events: none; z-index: 0;`
  - **Reduced-motion vypíná** (statická 0.04 opacity)
- **🎨 Acacia canopy silhouette v topbaru** (statická silueta větvení):
  - `[data-theme="africke"][data-shell="ikaros"] > header::after` — `background-image: var(--asset-acacia-canopy)`
  - Position: absolute, top -8px, left 0, width 100%, height 60px
  - Opacity: 0.35, mix-blend-mode: multiply
  - **Acacia sway** — `animation: africke-acacia-sway 12s ease-in-out infinite` — `transform: rotate(-2deg → +2deg → -2deg)`, transform-origin: top center
  - **Reduced-motion vypíná** (statická rotace 0deg)
- **🎨 Baobab corner silhouette** (decentní silueta baobabu v levém horním rohu BG):
  - `[data-theme="africke"][data-shell="ikaros"]::after` — `background-image: var(--asset-baobab-corner)`
  - Position: fixed, top 60px, left 0, width 220px, height 320px (jen kmen + 3 spirálovité větve)
  - Opacity: 0.18, pointer-events: none, z-index: 0
  - **Skryto na mobile (≤768px)** — vyrušuje
- **🎨 Diagonal dust drift** (řídké prachové částice):
  - `[data-theme="africke"][data-shell="ikaros"] > div[data-dust-layer]` — inline SVG layer nebo CSS-only s 3 vrstvami particles (small/medium/large)
  - Implementace: 3× `background-image` s data-uri SVG (různě veliké tečky `circle` s opacity 0.15–0.4), různé `animation-duration` (12s/15s/18s)
  - Animation: `africke-dust-drift Xs linear infinite` — `background-position: 0 0 → +400px -150px` (diagonální posun zleva doprava + lehce dolů, jako vítr přes savanu)
  - **Reduced-motion vypíná** (statické particles bez posunu)
- **🎨 Sun ascending** (jednorázová animace při načtení — horizon-glow divider v sidebaru vystoupá zdola nahoru):
  - Applied to: `[data-theme="africke"] [data-divider-key="horizon-glow"]`
  - Animation: `africke-sun-ascending 2s ease-out 1` (jen 1× per session)
  - `transform: translateY(20px) opacity 0 → translateY(0) opacity 1`
  - **Reduced-motion** — instant `opacity: 1, translateY(0)` (žádná animace)

### 4.2 Topbar (slim, 56px) — patinované dřevo + kente hairline

- Pozadí: tmavý gradient bez transparency (page-chrome je neprůhledný):
  ```css
  background:
    linear-gradient(180deg, #2a1408 0%, #100804 100%);
  ```
- **Žádný backdrop-filter** (heavy carved wood, žádné prosvítání)
- **Kente hairline** pod topbarem (alternativa indián prairie-gold hairline):
  - 2px gradient pásek vertikálních proužků: `linear-gradient(90deg, transparent 0, var(--theme-aged-gold) 6px, var(--theme-bronze-warm) 12px, var(--theme-aged-gold) 18px, transparent 24px)` repeating
  - Opacity 0.65, `filter: drop-shadow(0 0 4px var(--theme-glow-gold))`
- Logo vlevo z `logo.webp` (horizontal banner s baked-in textem + kente weave pozadí + script „Projekt Ikaros"): šíře `--asset-logo-w: 360px` desktop / `280px` tablet / `220px` mobile
- Pravé tlačítka (POŠTA, TYKY, ODHLÁSIT — zjednodušeno, Uživatelé + Skin selector se přesunou do pravého panelu) = **pískovcové tablet ledger** s aged-gold okrajem:
  - Background: `linear-gradient(180deg, #2a1408 0%, #100804 100%)`
  - Border: 1px earth-ochre `#8a5028`
  - Text: aged-gold `#c8881a` uppercase **Yeseva One**, letter-spacing 0.10em
  - Hover: border → aged-gold-bright `#e8b840`, text → cream `#f0e0c0`, warm sunset glow `0 0 14px var(--theme-glow-gold-strong)`
- **Mobile (≤768px)**: ikony only, label hidden přes `aria-label`
- **Mobile (≤480px)**: TYKY + ODHLÁSIT do hamburger drawer (existující pattern)

### 4.3 Sidebar levý — NAVIGACE / VESMÍRY / CHAT

- Frame: pískovcová deska s **carved bronze diamond corners ve 4 rozích** (převzaté přesně z medailonu):
  - Background: `linear-gradient(160deg, rgba(58, 30, 8, 0.90) 0%, rgba(42, 20, 8, 0.95) 100%)` (sandstone tone)
  - Border: 1px earth-ochre `#8a5028`
  - Box-shadow inner: 1px earth-dust `rgba(200, 152, 120, 0.18)` (subtle inner rim — pískovcová zrnitost)
  - Box-shadow outer: deep `0 6px 22px rgba(16, 8, 4, 0.70)`
- **Corner ornament** — `corner-tl.webp` (carved bronze diamond) na všech 4 rozích (master TL, mirror přes CSS `transform: scaleX(-1) / scaleY(-1)` na ostatní 3 rohy):
  - Size: 72×72px desktop, 52×52px tablet, 38×38px mobile
  - `position: absolute; pointer-events: none; z-index: 1; filter: drop-shadow(0 1px 2px rgba(16, 8, 4, 0.65));`
- **Section titles** ("NAVIGACE", "VESMÍRY", "CHAT") — **Yeseva One** uppercase, aged-gold:
  ```css
  color: var(--theme-aged-gold);
  font-family: var(--font-display);
  font-weight: 400;  /* Yeseva One je už dramatický */
  letter-spacing: 0.18em;
  text-shadow: 0 1px 2px rgba(16, 8, 4, 0.75);
  ```
  + **horizon-glow divider** jako `::after` pseudo pod section title (alternativa indián petroglyph-divider / hospoda beer-foam):
  - `background: linear-gradient(90deg, transparent 0%, var(--theme-horizon-dawn) 25%, var(--theme-horizon-sun) 50%, var(--theme-horizon-dawn) 75%, transparent 100%); height: 2px; opacity: 0.55; filter: drop-shadow(0 0 6px var(--theme-glow-gold));`
  - data-divider-key="horizon-glow" attribute pro sun-ascending animaci (sekce 4.1)
- **NavItem** ([class*="btn3d"]) — pískovcové tablet s aged-gold border + cream text:
  - Idle: sandstone gradient + 1px earth-ochre border + cream text + subtle inner rim glow
  - Hover: warm sunset glow `0 0 12px var(--theme-glow-gold)`, text → aged-gold-bright `#e8b840`, `translateY(-1px)` lift
  - **Active** ([class*="btn3dActive"], [class*="navItemActive"]):
    - Background: `linear-gradient(90deg, rgba(244, 160, 80, 0.40) 0%, rgba(42, 20, 8, 0.85) 100%)` (horizon-dawn washy gradient)
    - **🎨 ORIGINÁL — Left-border = aged-gold + bronze stitch pattern** (vertikální gradient stitches, NE plná linka, NE indián korálky):
      ```css
      &::before {
        content: '';
        position: absolute;
        left: 0; top: 4px; bottom: 4px;
        width: 3px;
        background: repeating-linear-gradient(
          180deg,
          var(--theme-aged-gold) 0,
          var(--theme-aged-gold) 8px,
          transparent 8px,
          transparent 11px,
          var(--theme-bronze-warm) 11px,
          var(--theme-bronze-warm) 14px,
          transparent 14px,
          transparent 17px
        );
        filter: drop-shadow(0 0 3px var(--theme-glow-gold));
      }
      ```
    - **🎨 ORIGINÁL — Adinkra watermark stamp** (`::after` pseudo, 1 symbol per active state):
      ```css
      &::after {
        content: '';
        position: absolute;
        right: 8px; top: 50%;
        width: 24px; height: 24px;
        background-image: var(--asset-adinkra-active-stamp);  /* inline SVG data-uri Sankofa */
        background-size: contain;
        opacity: 0.18;
        transform: translateY(-50%);
        pointer-events: none;
      }
      ```
    - Text: cream `#f0e0c0`, glow `0 0 8px var(--theme-glow-gold)`
- Touch target ≥48px mobile

### 4.4 Sidebar pravý — ADMINISTRACE „high seat" + Moje diskuze / Moje světy

- **Order (odchylka od mockupů, dle Q-admin uživatel + memory `project_admin_panel_decision.md`):**
  1. **ADMINISTRACE** (nahoře):
     - Section title „ADMINISTRACE" v aged-gold Yeseva One + horizon-glow divider
     - **Adinkrahene watermark** (3 soustředné kruhy) jako subtle stamp v levém horním rohu sekce — symbol „leadership/greatness", opacity 0.08
     - **Skin selector** (ThemeSwitcher) — sandstone tablet button s aged-gold border + caret, hover sunset glow
     - **Uživatelé** — link/button stejný styling
  2. **MOJE DISKUZE** (uprostřed) — sekce s navigations + „+" přidat tlačítko (Akoma adinkra ikona)
  3. **MOJE SVĚTY** (níže) — sekce s navigations + „+" přidat tlačítko (Akoma adinkra ikona)
  4. **OBLÍBENÉ ČLÁNKY** + **OBLÍBENÉ OBRÁZKY** (zachováno z předchozích skinů)
- Frame: stejný jako sidebar levý (sandstone + 4× carved bronze diamond corner)
- **„+" tlačítka** (rightAddBtn):
  - Background: `linear-gradient(180deg, rgba(244, 160, 80, 0.55) 0%, rgba(42, 20, 8, 0.85) 100%)` (horizon-dawn)
  - Border: 1px aged-gold-bright `#e8b840`
  - **`::before` pseudo s adinkra Akoma stamp** (28×28px inline SVG):
    ```css
    background-image: var(--asset-adinkra-akoma);  /* data-uri Akoma srdce */
    margin-right: 8px;
    transition: transform 200ms ease;
    ```
  - Hover: brighter horizon + gold glow, adinkra stamp scale 1.08 + opacity 1.0 (z idle 0.85)
  - Active: stamp scale 0.94 (klik feedback)
- **Empty hints** ("Žádné diskuze") — **Italianno** italic v aged-gold `#c8881a`, opacity 0.75, font-size 18px

### 4.5 Welcome card — Vyrytá pískovcová stéla (signaturní element)

- **Material:** pískovcová stéla (sandstone slab) s rytým textem + carved bronze diamond ornaments po levé+pravé straně + mudcloth band na dolní hraně
- **Tvar:** obdélník s mírně zaoblenými rohy, `border-radius: 6px` (jen vrchol skutečného pískovce — ostré, ne moderní)
  - `aspect-ratio: 16 / 7` desktop, fallback `min-height: clamp(380px, 50vh, 540px)` desktop
  - Padding: 48px vertikální, 100px horizontální (text musí mít dýchat)
- **Background — vrstvy** (z dola nahoru):
  1. Sandstone base — gradient `linear-gradient(180deg, #c89878 0%, #8a5028 100%)` s subtle CSS noise filter pro zrnitost (`filter: contrast(1.05)` + inline SVG `feTurbulence` mask)
  2. `background-image: var(--asset-monolith-watermark)` — silueta monolitu jako pozadí (cream silhouette), opacity 0.12, position center-right
  3. Vyrytý text shadow effect přes `text-shadow: 0 1px 0 rgba(255, 240, 200, 0.30), 0 -1px 0 rgba(16, 8, 4, 0.50)` — text vypadá jako rytý do kamene
- **🎨 ORIGINÁL — Carved bronze diamonds po stranách**:
  - 2 ornamenty (`corner-tl.webp` style) — pozice absolutně, jeden vlevo střed, jeden vpravo střed
  - Size: 56×56px desktop, 40×40px tablet, skryto na mobile (≤480px)
  - `filter: drop-shadow(0 2px 4px rgba(16, 8, 4, 0.65))`
- **🎨 ORIGINÁL — Mudcloth band na dolní hraně**:
  - Element: `[data-frame-panel="card"] [data-welcome="bottom"]::before` nebo welcome card `::after`
  - `background-image: var(--asset-mudcloth-band)` — horizontální tkaný geometric pásek
  - Width: 100% panelu, height: 24px desktop, 16px mobile
  - Opacity: 0.85
  - Position: absolute, bottom 8px (uvnitř paddingu)
- **Text styling uvnitř stély:**
  - **welcomeTitle** ("Vítej v Projektu Ikaros.") — **Yeseva One**, color `#2a1408` (dark text na sandstone), text-shadow rytí (viz výše)
  - **titleAccent** ("Projektu Ikaros.") — **Yeseva One** weight 400, color earth-laterite `#6a2810` (kontrast vůči title)
  - **paragraph** (2 odstavce) — **Gentium Plus** color earth-shadow `#2a1408`, line-height 1.7
  - **signature** ("Příjemnou zábavu přeje administrátor.") — **Italianno** italic, color aged-gold `#c8881a` (souznění s logem), font-size 30px, text-align center
- **Box-shadow** — deep stone shadow:
  ```css
  box-shadow:
    inset 0 0 0 1px rgba(58, 30, 8, 0.30),
    inset 0 0 80px rgba(58, 30, 8, 0.15),
    0 16px 40px -8px rgba(16, 8, 4, 0.85),
    0 24px 60px -12px rgba(16, 8, 4, 0.55);
  ```
- **Aged-gold hairline** pod welcomeTitle (jako rytá linka):
  ```css
  &::after {
    content: '';
    display: block;
    margin-top: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--theme-aged-gold-bright), transparent);
    opacity: 0.65;
  }
  ```
- **Žádný pulse** — stéla je kámen, kámen nepulsuje. Klid je signaturní vlastnost tohoto skinu.

### 4.6 Heraldický medailon (mimo welcome stélu — header logo to už pokrývá)

- `--asset-andel-medallion` = `medailon.webp` (čtvercový rám s andělem + carved bronze diamond corners)
- **Použití**: pouze fallback / případný overlay kdyby `[data-andel-medallion]` div existoval v některém layoutu (zachováno pro budoucí use)

### 4.7 Decor — Acacia canopy v topbaru (warm decor pruh nahoře)

- Element: `[data-theme="africke"][data-shell="ikaros"] > header::after` (popsáno v sekce 4.1)
- Asset: `acacia-canopy.webp` (1200×60, transparent, jen větvení siluety)
- **Mobile (≤768px)**: skryto NEBO výška snížena na 32px

### 4.8 PJ badge

- **Mosazný štítek** s carved bronze diamond border:
  - Background: `linear-gradient(180deg, var(--theme-aged-gold-bright), var(--theme-aged-gold))`
  - Color: `#2a1408` (dark on gold)
  - Border: 1px bronze-deep `#5a3210`
  - Box-shadow: `0 0 8px var(--theme-glow-gold), inset 0 0 0 1px var(--theme-bronze-warm), inset 0 1px 0 0 rgba(255, 240, 200, 0.32)`
  - Font: **Yeseva One** weight 400, letter-spacing 0.10em

### 4.9 Nav ikony — 7 carved sandstone tablet medailonů

- `[data-theme="africke"] [data-nav-key] [class*="navItemIcon"]` styling:
  - Width/height: 22px desktop, 18px mobile
  - `background-size: contain; background-repeat: no-repeat; background-position: center;`
  - `filter: drop-shadow(0 0 3px var(--theme-glow-gold));`
- Mapping přes `data-nav-key`:
  ```css
  [data-nav-key="uvodnik"]       → var(--asset-icon-uvodnik)       /* vycházející slunce nad horizontem */
  [data-nav-key="vytvorit-svet"] → var(--asset-icon-vytvorit-svet) /* baobab silueta */
  [data-nav-key="diskuze"]       → var(--asset-icon-diskuze)       /* Akoma adinkra srdce */
  [data-nav-key="clanky"]        → var(--asset-icon-clanky)        /* papyrus svitek s ručně psaným textem */
  [data-nav-key="galerie"]       → var(--asset-icon-galerie)       /* stylizované oko (Wedjat-like, ale africké) */
  [data-nav-key="napoveda"]      → var(--asset-icon-napoveda)      /* Sankofa adinkra (pták s hlavou otočenou zpět) */
  [data-nav-key="hospoda"]       → var(--asset-icon-hospoda)       /* ohniště se 3 kameny */
  ```
- Lucide SVG ikony skryty: `[class*="navItemIcon"] svg { display: none; }`

### 4.10 Adinkra watermarks (decentní, kontextové)

- **🎨 ORIGINÁL — Adinkra symboly jako watermark v rozích panelů** (alternativa indián bead-string, severske rune-circle-floor):
  - Implementace: inline SVG data-uri proměnné v `index.ts` — `--asset-adinkra-sankofa`, `--asset-adinkra-gye-nyame`, `--asset-adinkra-adinkrahene`, `--asset-adinkra-akoma`, `--asset-adinkra-active-stamp` (Sankofa)
  - Per-section použití přes `[data-section-key]` attribute na panelech (uvodnik → Sankofa, home → Gye Nyame, administrace → Adinkrahene, diskuze → Akoma)
  - Position: absolute, top-right roh panelu, 32×32px desktop, 24×24px mobile
  - Opacity: 0.08 (sotva viditelné, easter-egg pro pozorné)
  - **Žádná animace** — symboly jsou tiché jako stará moudrost
- Inline SVG fallback pokud asset nedodán

### 4.11 Novinky panel (dole)

- Background: tmavý pískovcový panel (consistency s ostatními panely), text v cream `#f0e0c0`
- Title „Novinky" — **Yeseva One** color horizon-dawn `#f4a050` weight 400, text-shadow subtle
- Empty hint — **Italianno** italic v aged-gold opacity 0.75, font-size 18px
- „Přidat novinku" tlačítko = stejný style jako rightAddBtn (adinkra Akoma stamp::before)

### 4.12 Section titles + horizon-glow divider

- Section title typo: **Yeseva One** UPPERCASE, color aged-gold, letter-spacing 0.18em
- `::after` pseudo s horizon-glow gradient (height 2px, opacity 0.55, position pod title, filter drop-shadow glow)
- Při prvním načtení stránky: sun-ascending animace (2s ease-out, 1×)

### 4.13 Animace inventář & reduced-motion

**Celkem 4 ambient + 1 one-shot:**

| # | Animace | Element | Trvání | Reduced-motion |
|---|---------|---------|--------|----------------|
| 1 | heat-shimmer | `::before` shell pseudo | 8s ease-in-out infinite | vypnout (statická opacity 0.04) |
| 2 | dust-drift | `[data-dust-layer]` (3 vrstvy) | 12s / 15s / 18s linear infinite | vypnout (statické particles, žádný posun) |
| 3 | acacia-sway | topbar `::after` | 12s ease-in-out infinite | vypnout (rotation 0deg fixed) |
| 4 | sun-ascending | `[data-divider-key="horizon-glow"]` | 2s ease-out 1 (jen 1× per session) | vypnout (instant opacity 1) |
| 5 | adinkra-stamp-feedback | `:active::after` na buttonech | 200ms ease | vypnout (instant) |

**Klíčový princip:** **welcome stéla NEPULSUJE** (na rozdíl od indián drum-beat). Kámen je trvalý. Klid je signaturní hodnota tohoto skinu.

**Reduced-motion media query:**
```css
@media (prefers-reduced-motion: reduce) {
  [data-theme="africke"] *,
  [data-theme="africke"][data-shell="ikaros"]::before,
  [data-theme="africke"][data-shell="ikaros"] > header::after,
  [data-theme="africke"] [data-dust-layer],
  [data-theme="africke"] [data-divider-key="horizon-glow"] {
    animation: none !important;
    transition: none !important;
  }
}
```

### 4.14 Scrollbar styling

- Track: earth-shadow `var(--theme-earth-shadow)` `#2a1408`
- Thumb: aged-gold `var(--theme-aged-gold)` `#c8881a`, border-radius 4px, width 8px
- Hover thumb: aged-gold-bright `#e8b840`

### 4.15 Focus visible (a11y)

- Outline: `none` (replaced by box-shadow ring)
- Box-shadow: `0 0 0 2px var(--bg-primary), 0 0 0 4px var(--theme-horizon-dawn), 0 0 14px var(--theme-glow-gold)`
- Applied to: nav items, btn3d, headerBtn, rightAddBtn, addBtn, showAllLink

### 4.16 Forced colors (Windows high contrast)

- Logo, medailon, corner-tl, stele-frame, mudcloth-band, baobab-corner, acacia-canopy, monolith-watermark, 7× nav ikon, adinkra watermarks: `forced-color-adjust: none` aby vypadaly v high contrast normálně

---

## 5. Mobile degradace (≤768px)

- **Welcome stéla** → border-radius zachován (6px je už malé), aspect-ratio se uvolní (`aspect-ratio: auto`), padding redukce na 32px vert / 24px horiz
- Carved bronze diamonds po stranách stély → skryté pro ≤480px (zachováno 480–768px ve scale 0.7)
- Monolith watermark v pozadí stély → opacity 0.06 (z 0.12, mobilní BG je vytíženější)
- Corner ornaments panelů → 38×38px (z 72×72px desktop)
- Baobab corner silhouette → **skryto** (vyrušuje na úzké)
- Heat shimmer → opacity 0.03 (z 0.06, méně rušivé)
- Dust drift → jen 1 vrstva (z 3) — performance + rušivost
- Acacia canopy → height 32px (z 60px), opacity 0.25
- Touch target min-height 48px na nav items
- Header buttons → icon-only, label hidden
- Logo width → 220px (z 360px desktop)
- `--frame-pad-x: 12px` (z 18px)
- Horizon-glow divider → height 1.5px (z 2px)
- Mudcloth band → height 16px (z 24px)

---

## 6. A11y & contrast audit

| Kombinace | Ratio | Status |
|-----------|-------|--------|
| `#100804` BG × `#f0e0c0` cream text | ~14.5 | ✅ AAA |
| `#100804` BG × `#c8881a` aged-gold text | ~5.8 | ✅ AA |
| `#100804` BG × `#f4a050` horizon-dawn accent | ~7.5 | ✅ AAA |
| `#100804` BG × `#e8b840` aged-gold-bright | ~9.2 | ✅ AAA |
| `#c89878` sandstone BG × `#2a1408` dark text (stéla) | ~7.8 | ✅ AAA |
| `#c89878` sandstone BG × `#6a2810` earth-laterite | ~5.2 | ✅ AA |
| `#c89878` sandstone BG × `#c8881a` aged-gold | ~2.1 | ⚠️ POUZE pro dekorativní (signature Italianno ≥24px) |
| `#2a1408` panel × `#c8881a` aged-gold text | ~4.4 | ✅ AA |

**Klíčové:** aged-gold `#c8881a` na sandstone welcome stéle má nízký kontrast (2.1) — proto je vyhrazen pouze pro:
- **Signature italic** (Italianno 30px+ — italic + size = OK pro WCAG „large text" výjimku)
- **Empty hints** (sub-text mimo welcome stélu, na dark sandstone BG = OK)

**Aged-gold NIKDY ne pro:**
- Body text v stéle (paragraph)
- Section titles uvnitř stély
- Nav item labels

### Reduced motion audit
Všech 5 animací má fallback `animation: none !important` v `@media (prefers-reduced-motion: reduce)` — žádný blok skinu nezávisí kriticky na animaci.

---

## 7. Soubory a změny

| Soubor | Akce | Velikost |
|--------|------|----------|
| [`src/themes/themes/africke/index.ts`](../../../src/themes/themes/africke/index.ts) | **Kompletní přepis** — paleta, fonty (Allura + Yeseva One + Gentium Plus + Italianno), 15 asset URLs, layout vars, inline SVG adinkra data-uri | ~200 řádků (z 50) |
| [`src/themes/themes/africke/decorations.css`](../../../src/themes/themes/africke/decorations.css) | **Kompletní přepis** — 22 sekcí dle indián/severske vzoru | ~900 řádků (z 14) |
| [`public/themes/africke/decor/*.webp`](../../../public/themes/africke/decor/) | **Vytvořit** — 15 souborů (13 AI gen + logo + medailon) | nový adresář |
| [`public/themes/africke/decor/_asset-prompts.md`](../../../public/themes/africke/decor/_asset-prompts.md) | **Vytvořit** — 13 prompty pro ChatGPT generaci | nový soubor |
| [`scripts/finalize-africke-assets.mjs`](../../../scripts/finalize-africke-assets.mjs) | **Vytvořit** — resize/convert pipeline (PNG → WEBP, optimize) | ~80 řádků |
| [`assets-source/themes/africke/`](../../../assets-source/themes/africke/) | ✅ **Existuje** (logo.png + medailon.png + 13 AI gen PNG po doplnění) | 15 PNG souborů po dokončení |

**Mimo scope:**
- Globální CSS (žádné edity)
- Shell layout komponenty (žádné edity)
- Ostatní 21 skinů (nulová regrese)
- Theme registry [`src/themes/themes/index.ts`](../../../src/themes/themes/index.ts) (africké už registrován, žádný edit)
- TypeScript typy (žádný edit)
- Background `public/themes/backgrounds/africke.webp` (zachováno, ne edit)
- Thumbnail `public/themes/thumbnails/africke.webp` (zachováno, ne edit)

---

## 8. Asset list

| # | Asset | Cesta | Rozměr | Status |
|---|-------|-------|--------|--------|
| 1 | logo | `public/themes/africke/decor/logo.webp` | ~1200×280 | ✅ user dodal (.png → convert) |
| 2 | medailon | `public/themes/africke/decor/medailon.webp` | ~600×600 | ✅ user dodal (.png → convert) |
| 3 | corner-tl | `public/themes/africke/decor/corner-tl.webp` | 256×256 | ⏳ AI gen — carved bronze diamond ornament |
| 4 | stele-frame | `public/themes/africke/decor/stele-frame.webp` | 1200×500 | ⏳ AI gen — pískovcová stéla rám (volitelně inline CSS) |
| 5 | mudcloth-band | `public/themes/africke/decor/mudcloth-band.webp` | 1200×48 | ⏳ AI gen — tkaný geometric horizontální pásek |
| 6 | baobab-corner | `public/themes/africke/decor/baobab-corner.webp` | 440×640 | ⏳ AI gen — silueta baobab (jen kmen + 3 větve) |
| 7 | acacia-canopy | `public/themes/africke/decor/acacia-canopy.webp` | 1200×120 | ⏳ AI gen — silueta akáciových větví (jen větvení) |
| 8 | monolith-watermark | `public/themes/africke/decor/monolith-watermark.webp` | 800×600 | ⏳ AI gen — silueta monolitu (kámen s carved markings) |
| 9 | icon-uvodnik | `public/themes/africke/decor/icon-uvodnik.webp` | 96×96 | ⏳ AI gen — vycházející slunce nad horizontem (sandstone tablet) |
| 10 | icon-vytvorit-svet | `public/themes/africke/decor/icon-vytvorit-svet.webp` | 96×96 | ⏳ AI gen — baobab silueta (sandstone tablet) |
| 11 | icon-diskuze | `public/themes/africke/decor/icon-diskuze.webp` | 96×96 | ⏳ AI gen — Akoma adinkra srdce (sandstone tablet) |
| 12 | icon-clanky | `public/themes/africke/decor/icon-clanky.webp` | 96×96 | ⏳ AI gen — papyrus svitek s psaným textem (sandstone tablet) |
| 13 | icon-galerie | `public/themes/africke/decor/icon-galerie.webp` | 96×96 | ⏳ AI gen — stylizované africké oko (sandstone tablet) |
| 14 | icon-napoveda | `public/themes/africke/decor/icon-napoveda.webp` | 96×96 | ⏳ AI gen — Sankofa adinkra pták (sandstone tablet) |
| 15 | icon-hospoda | `public/themes/africke/decor/icon-hospoda.webp` | 96×96 | ⏳ AI gen — ohniště se 3 kameny (sandstone tablet) |

**Adinkra watermarks** (Sankofa, Gye Nyame, Adinkrahene, Akoma) — **inline SVG data-uri v `index.ts`**, nejsou separate webp soubory (5. asset by porušil 15-limit, a SVG je lehčí).

**Celkem 15 souborů**, odhad ~350 KB po WEBP optimalizaci.

---

## 9. Originální motivy (žádný jiný skin nemá)

1. **Vyrytá pískovcová stéla jako welcome card** + monolith silhouette watermark v pozadí — žádný jiný skin nemá stélu (indián má drum oval, severské má stone tablet s runami, hospoda má pivní cedule); africká stéla je rytá, statická, signaturně klidná
2. **Carved bronze diamond corners** (převzato z medailonu uživatele) — 4 rohy panelů + 2 boční ornamenty welcome stély; alternativa indián iron-nail-studs, severské wolfshield, nemrtví bone-corner
3. **Kente weave hairline** pod topbarem (vertikální gold+bronz proužky) — alternativa indián prairie-gold hairline, severské bronze hairline
4. **Mudcloth band na dolní hraně welcome stély** (tkaný geometric pásek) — vetkaná paměť předků
5. **Heat shimmer overlay** (SVG turbulence, 8s) — žádný jiný skin nemá animovaný vzduch
6. **Diagonal dust drift** (3 vrstvy částic zleva doprava, 12s/15s/18s) — alternativa severské sníh (vertikální), nemrtví ghost-mist (statická), žádný jiný skin nemá diagonální drift
7. **Acacia canopy v topbaru se sway-animací** (12s, 2° rotation) — alternativa indián bead-string sway, severské rune-circle, hospoda lustru
8. **Sun ascending one-shot** (horizon-glow divider vystoupá 1× při načtení) — žádný jiný skin nemá one-shot animation; podtrhuje pocit „úsvitu nového dne"
9. **Adinkra watermarks** (4 kontextové symboly v rozích panelů, opacity 0.08, statické) — alternativa indián constellation overlay, severské zachované carved knot-seal; africké má autentickou Ašanti symboliku
10. **Aged-gold + bronze stitch left-border** na active nav (alternativa indián korálky, severské ice-line)
11. **Welcome stéla NEPULSUJE** — záměrně bez animace, podtrhuje princip „kámen předků nepulsuje, on je"

---

## 10. Akceptační kritéria

- [ ] **AC-1**: Po `themeId === 'africke'` má dashboard hluboké zemité pozadí (`#100804`) s heat shimmer overlay v top třetině 8s breathing, žádný globální dopad na ostatní 21 skinů
- [ ] **AC-2**: Logo v topbaru je `logo.webp` (kente weave banner s baked-in script „Projekt Ikaros"), šířka 360px desktop / 280px tablet / 220px mobile
- [ ] **AC-3**: Sidebary mají sandstone panely s `corner-tl.webp` carved bronze diamond ornamenty ve 4 rozích (master TL mirror), 1px earth-ochre border, deep box-shadow
- [ ] **AC-4**: Welcome card je vyrytá pískovcová stéla (aspect 16:7 desktop) s monolith-watermark v pozadí, carved bronze diamonds po levé+pravé straně, mudcloth band na dolní hraně
- [ ] **AC-5**: Text v stéle — title v **Yeseva One** dark color, titleAccent v **Yeseva One** earth-laterite, paragraph v **Gentium Plus** dark, signature v **Italianno italic** aged-gold
- [ ] **AC-6**: 7 nav ikon = `icon-*.webp` přes `data-nav-key` mapping, 22×22px desktop, drop-shadow gold glow
- [ ] **AC-7**: Active nav má **aged-gold + bronze stitch pattern** jako left-border (vertikální dashed) + **adinkra Sankofa watermark** stamp v pravém okraji (opacity 0.18)
- [ ] **AC-8**: Pravý panel obsahuje ADMINISTRACE (skin selector + uživatelé + Adinkrahene watermark) nahoře + Moje diskuze (Akoma watermark) + Moje světy (Akoma watermark) uprostřed (odchylka od mockupů, dle memory)
- [ ] **AC-9**: „+" tlačítka (rightAddBtn / addBtn) mají adinkra Akoma stamp jako `::before` ikonu, hover scale 1.08
- [ ] **AC-10**: Section titles + horizon-glow divider pod nimi (height 2px desktop, 1.5px mobile, gradient amber)
- [ ] **AC-11**: Acacia canopy silueta v topbaru s 12s sway animation (skryto/redukováno mobile)
- [ ] **AC-12**: Baobab corner silueta v levém horním rohu BG, opacity 0.18 (skryto mobile)
- [ ] **AC-13**: Heat shimmer overlay v top 35vh, 8s cycle, opacity 0.06 desktop / 0.03 mobile
- [ ] **AC-14**: Diagonal dust drift (3 vrstvy desktop / 1 vrstva mobile), 12s/15s/18s linear
- [ ] **AC-15**: Sun ascending one-shot animace na horizon-glow divideru při načtení stránky (1× per session, 2s ease-out)
- [ ] **AC-16**: Adinkra watermarks (Sankofa/Gye Nyame/Adinkrahene/Akoma) v rozích relevantních panelů, opacity 0.08
- [ ] **AC-17**: PJ badge je mosazný štítek s aged-gold gradient + dark text + bronze-warm inset border
- [ ] **AC-18**: Mobile (≤768px) — welcome stéla zachová obdélník, carved diamonds po stranách scaled 0.7 (skryté ≤480px), baobab + acacia canopy redukováno, dust drift 1 vrstva, heat shimmer opacity 0.03
- [ ] **AC-19**: Reduced-motion — všech 5 animací má `animation: none !important` fallback
- [ ] **AC-20**: Forced colors — všechny carved/decorative assety mají `forced-color-adjust: none`
- [ ] **AC-21**: Focus visible — všechny interaktivní prvky mají box-shadow ring (horizon-dawn outer + glow)
- [ ] **AC-22**: WCAG contrast — všechny primární text kombinace ≥ AA (cream na earth-deep AAA, aged-gold na earth-deep AA, dark text na sandstone stéle AAA)
- [ ] **AC-23**: Animace inventář splňuje plán (5 typů, žádná chaotická interakce, welcome stéla nepulsuje záměrně)
- [ ] **AC-24**: Original motifs splněny (11 položek, sekce 9) — žádné sdílení s ostatními skiny
- [ ] **AC-25**: `npm run lint:colors` projde (žádné hardcoded barvy mimo CSS var)
- [ ] **AC-26**: `npm run audit:contrast` projde (žádné WCAG fails)
- [ ] **AC-27**: Screenshots na 3 viewportech (mobile 375px / tablet 1024px / desktop 1920px) zachycené a uložené v `docs/arch/phase-1/_screenshots/`

---

## 11. Mimo scope (explicitně)

- Globální CSS edity (žádné)
- Shell layout komponenty (žádné)
- Ostatní 21 skinů (nulová regrese, ne edit, ne dotyk)
- Backend / API změny (žádné)
- Theme registry [`src/themes/themes/index.ts`](../../../src/themes/themes/index.ts) (africké už registrován)
- TypeScript typy (žádný edit)
- Nové komponenty (theme skin — pouze CSS + tokens)
- Background regeneration (zachováno současné `africke.webp`)
- Thumbnail regeneration (zachováno současné `africke.webp`)
- `docs/themes/africke.md` přepis (volitelné, post-implementace, ne v 1.0q — pokud existuje)
- Backend i18n (žádný)

---

## 12. Rizika & mitigace

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|------------------|-------|----------|
| UI rám „přerazí" krásu BG (savana je už dramatická) | V | V | Sandstone panely v earth-shadow tónu (sjednocené s BG, ne kontrastní), border 1px, carving jen v rozích (corner 72px), žádné iron-stud silver-na-tmavém kontrasty |
| Text v stéle se nevejde / je nečitelný (sandstone vs dark text) | M | V | Sandstone gradient `#c89878 → #8a5028` má AAA kontrast s dark text `#2a1408` (7.8 ratio), padding x>y, aspect-ratio 16:7 dává prostor |
| Animační chaos — 4 ambient + 1 one-shot je hodně | M | S | Striktně 5 typů s jasnými rolemi (heat / dust / acacia / sun-ascending / stamp-feedback), všechny reduced-motion fallback, dust mobile redukce na 1 vrstvu |
| Aged-gold nízký kontrast na sandstone stéle | V | S | Vyhrazen pouze pro decorative accent (titleAccent) + signature Italianno 30px+; NIKDY pro body text |
| Heat shimmer performance impact (SVG turbulence) | M | M | Opacity 0.06 max, jen v top 35vh, animace přes opacity (NE seed regen který je GPU-heavy), reduced-motion vypíná |
| Diagonal dust drift performance (3 vrstvy) | M | M | Mobile redukce na 1 vrstvu, CSS-only background-position animation (GPU accelerated), žádný JS |
| Konflikt s `indiane` (oba teplé zemité skiny) | M | V | Indián = wood + iron + leather + buffalo-blood (warm wood materials); africké = sandstone + bronze + kente + horizon-dawn (kámen + tkanina materials) — jasné materiálové oddělení |
| Konflikt s `arabsky-svet` (oba „africké" v širším smyslu) | N | S | Arabský = palác + arabesque + burgundy + turquoise (severní Afrika, středomořský), africké = savana + sandstone + sub-saharská (kente + adinkra + mudcloth) — odlišný materiálový + kulturní jazyk |
| Adinkra symboly necitlivé kulturní použití | N | V | Použito jako universal-symbolic ornamenty (moudrost, kontinuita), nikoli jako kult-religious náboženské symboly; opacity 0.08 (decentní, ne ostentativní) |
| Welcome stéla statická = nudná | N | M | Statika je záměrná designová volba (klid předků); ambient motion (dust + heat shimmer + acacia sway) okolo stély dodává život BEZ pulse |
| Asset balík nekonzistentní | N | V | Stylistický direction (sandstone + bronze + carved + earth-tone) pevně definovaný v `_asset-prompts.md`, vše AI gen má unified prompt skeleton |

---

## 13. Workflow & schválení

Dle [base.md](../../../.claude/rules/base.md) + memory `feedback_workflow.md`:

1. ✅ **Brainstorming** — koncept „Země předků" prodiskutován + odsouhlasen (2026-05-11): name, direction B+C fúze, welcome stéla A, motion plný balík, asset scope Premium 15
2. ✅ **Frontend-design audit** — proveden (2026-05-11), 3 directions nabídnuty (Bronz předků / Velký horizont / Vetkané příběhy), vybrána fúze B+C s carved bronze diamonds z medailonu uživatele
3. ⏭️ **Asset prompty + generování** — bude vytvořeno `_asset-prompts.md` s 13 prompty po schválení specu
4. 🟡 **Unified spec** — **TENTO DOKUMENT** (čeká na schválení)
5. ⏭️ **Implementační plán** — po schválení spec
6. ⏭️ **Potvrzení plánu** — po dodání plánu
7. ⏭️ **Implementace** — kód (`index.ts` + `decorations.css` + asset konvert pipeline)
8. ⏭️ **Post-impl** — `roadmap-fe.md` update, `dluhy.md` review, screenshots, akceptace

---

## 14. Otázky vyřešeny

| # | Otázka | Rozhodnutí |
|---|--------|-----------|
| Q-koncept | Jdeme čistou sub-saharskou linkou (žádný palác / safari)? | ✅ ANO — „Země předků", savana za úsvitem, prastará moudrost |
| Q-direction | A (Bronz předků) / B (Velký horizont) / C (Vetkané příběhy) / fúze? | ✅ FÚZE B+C — „Velký horizont s vetkanou pamětí" |
| Q-name | Skin name v UI? | ✅ „Země předků" (id zůstává `africke`) |
| Q-welcome | Welcome card styl (stéla / bronze / canvas / brána)? | ✅ A — vyrytá pískovcová stéla s carved bronze diamonds po stranách + mudcloth band |
| Q-motion | Klidná / živá / plný balík? | ✅ PLNÝ BALÍK (heat shimmer + dust drift + acacia sway + sun ascending) + reduced-motion fallback |
| Q-assets | Lean / Standard / Premium? | ✅ PREMIUM (15 = 13 AI gen + logo + medailon) |
| Q-typografie | Cinzel je off-brand (indián+arabský) — co místo? | ✅ Allura + Yeseva One + Gentium Plus + Italianno (žádný jiný skin nemá) |
| Q-admin | Pravý panel obsah? | ✅ ADMINISTRACE (skin + uživatelé) nahoře, Moje diskuze/světy uprostřed — dle memory |
| Q-adinkra | Adinkra symboly použít? | ✅ ANO, decentně (4 watermarks per kontext, opacity 0.08), inline SVG data-uri (ne separate assety) |
| Q-pulse | Pulsuje welcome stéla jako indián drum? | ❌ NE — kámen je trvalý, klid je signaturní hodnota tohoto skinu (záměrná designová volba) |

---

**Status:** 🟡 **Čeká na schválení uživatelem.**
Po souhlasu → `_asset-prompts.md` + impl. plán `plan-1.0q.md` → po souhlasu → kód.
