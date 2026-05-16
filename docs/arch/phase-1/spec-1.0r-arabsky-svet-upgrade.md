# Spec 1.0r — Arabský svět visual upgrade

**Status:** ✅ Implementováno
**Datum:** 2026-05-11
**Rozsah:** FE skin upgrade — `[data-theme="arabsky-svet"]` izolace, žádný globální dopad
**Repo:** `Projekt-ikaros-FE`, větev `feat/krok-1.0r-arabsky-svet-upgrade` (vytvoří se při impl plánu)
**Velikost:** odhad ~3 soubory změna (`index.ts`, `decorations.css`, `public/themes/arabsky-svet/`) + 14 nových assetů + 3 dodané (logo + medailon + background) = 17 souborů celkem
**Autor:** PJ + Claude
**Souvisí:** [spec-1.0q-africke-upgrade.md](spec-1.0q-africke-upgrade.md) (tier-1 structure precedent, explicitně se ODLIŠUJE — žádné sandstone + bronze + kente + mudcloth + adinkra; žádná savana / horizon / baobab), [spec-1.0p-indiane-upgrade.md](spec-1.0p-indiane-upgrade.md) (struktura), [spec-1.0o-severske-runy-upgrade.md](spec-1.0o-severske-runy-upgrade.md) (struktura), [spec-1.0b-theme-visuals.md](spec-1.0b-theme-visuals.md)

**Reference:**
- `assets-source/themes/arabsky-svet/background.png` — noční palácová scenérie: tyrkysová báň + minarety + krescent + Plejády, mašrabíja rám okolo výhledu, bordó-vínové sametové závěsy po stranách (baked-in static), perské koberce v popředí, mosazné lucerny visící z horních rohů + brass narghile/dallah v dolních rozích, palmy date palm po stranách ✅ **user dodal 2026-05-11**
- `assets-source/themes/arabsky-svet/logo.png` — horizontální banner: tmavé patinované dřevo s mauresque multifoil borderem + zlaté ornamenty s vsazenými drahokamy (rubíny, smaragdy, tyrkysy), vlevo kulatý medailon s andělem-křídlem, vpravo „Projekt Ikaros" v elegantním script fontu, vícebodové zlato-cream rohové ornamenty ✅ **user dodal**
- `assets-source/themes/arabsky-svet/medailon.png` — čtvercový rám z tmavého ořechového dřeva s **multifoil (čtyřlistý) okenním rámem** + zlato-mosazné ornamenty s drahokamy v rozích, ažurová geometric mřížka uvnitř, velký cream anděl-křídlo silhouette uprostřed ✅ **user dodal**
- Bude vygenerováno: `public/themes/arabsky-svet/decor/_asset-prompts.md` (14 prompty pro AI generaci)

**Reference mockup (vzor cílové kvality):**
- Plně realizovaný design od uživatele zobrazující paletu, ornamenty, layout panelů, welcome card s medailonem, sidebar s navigací (NAVIGACE / VESMÍRY / CHAT / DIMENSIONÁLNÍ HOSPODA), novinky pásmo s lampovou ikonou. Tento mockup je **kvalitativní benchmark** — cílem skinu je se k němu přiblížit.

---

## 0. Princip — „Arabský svět", noc nad sultánovým palácem

> **Stojíš v zatlumené komnatě nejtajnější části Šahrijárova paláce, hodinu po půlnoci. Hedvábné závěsy bordó samet visí nad oknem, za nimiž v dálce zlato-tyrkysová báň mešity stoupá z města zalité měsícem a tisícem světel. V rohu kouří narghile pomalou vlnitou stuhou, vedle ní stojí mosazná dallah s ještě teplou kávou. Na perském koberci leží rozházené polštáře a okvětní lístky růží — někdo tu byl těsně před tebou. Z lampy géniem stoupá tenký proužek kouře. Vzduch voní ambrou, růžovou vodou a kávou. Šeherezáda kdesi vypráví třiapadesátý sen.**

Skin musí *dýchat smyslností a luxusem* — exotika, touha, peníze a ženy jsou hlavní leitmotivy. 1001 nocí jako příběhy o **lásce, magii, nocích a snech, jež se splní**. Vstupuješ tam, kam normální lidé nesmějí — voyeur v komnatě, kde čas zpomalil.

**Inspirační kotvy:** *Edmund Dulac* iluminace 1001 nocí (zlaté margínalie + sapfír + tyrkys), *Léon Bakst* kostýmy Ballet Russes (Šeherezáda 1910), Frederic Leighton orientalistické malby (lehkost hedvábí + zlato), Isfahan Šejk Lutfollah mešity (zlato-tyrkysová báň, perská mosaika), Topkapi Saray paláce (perforované mašrabíja, mukarnasy), perské miniatury (margínalie, drobné figurky, zlato), Damascus mosaika (zellige + mother-of-pearl), Disney *Aladdin* (1992) atmosféra (ale **NE** kreslený styl), *Lawrence of Arabia* (1962) cinematic night shots, *The Thief of Bagdad* (1940) art direction.

**NE** Marvel Disney kreslený Aladdin styl. **NE** turistický „Marrákeš pohlednice" (riad terakota + sluneční dvůr). **NE** vědecká astronomie / kalifova studovna (předchozí brainstorming škrtnut). **NE** Alhambra denní bílá vápencová (chladnější, méně tajemné). **NE** africké sandstone + savana + adinkra. **NE** indiánské tribal + iron studs. **NE** severské ice + wolf. **NE** generická D&D pergamen. **NE** politicky necitlivá karikatura, žádná stereotypní pseudoarabská písmena říkající nesmysl, žádné explicitní postavy v BG.

**Strict isolation:** vše scoped přes `[data-theme="arabsky-svet"]`. Zbylých 21 témat = nulová regrese. (Memory rule: žádné sdílení / recyklace ornamentů s ostatními skiny — Arabský svět má vlastní vizuální slovník: mauresque multifoil zlaté ornamenty s drahokamy, mukarnasová římsa, mašrabíja girih hvězdy, růžové okvětní lístky drift, kouř z narghile, lampa génia, hedvábná tkaní damascene.)

---

## 1. Cíl

Po `themeId === 'arabsky-svet'` má dashboard vypadat jako **noční komnata sultánova paláce** zalitá luxusem 1001 nocí: hluboké půlnoční pozadí (`#0a0e2c`) s dodaným BG palácové scenérie skrze tmavě indigové panely s **mauresque multifoil zlatým borderem** + **4× zlatý ornament s vsazenými drahokamy v rozích každého panelu** (master TL mirror přes CSS, převzaté přesně z medailonu uživatele), **welcome card jako „odhrnutý hedvábný závěs do tajné komnaty"** (tmavě indigový panel s tyrkysovým multifoil borderem + zlato-rubín-smaragd corner ornaments + persian rug strip dole + scattered rose petals + Šeherezádin signature dole), **mukarnasová římsa** (voštinová stalaktitová struktura) pod topbarem (statická, mosazná), **mašrabíja hairline pod topbarem** (girih 8-cípé hvězdy), **horizon-mihrab divider mezi sekcemi sidebaru** (graduovaný horizontální gradient od tyrkysové přes zlato po tyrkysovou — alternativa africké horizon-glow), **7 ornament nav medailonů** s tematickými symboly (otevřený manuskript / brk na polštáři / dallah s párou / svinutý svitek se sultánskou tugrou / perská miniatura / olejová lampa génia / vodní dýmka) — idle dark wood + zlatá ryté hrany, hover = warm saffron glow, active = **zlatá horizon gradient + arabesque vine left-border + Hamsa stamp**, **růžové okvětní lístky drift** (3 vrstvy parallax částic shora-dolů diagonálně, 90s/120s/150s), **kouř z narghile** (vlnitá ribbon stoupá z pravého dolního rohu, SVG path morph 8s), **lampa génia v rohu UI panelu** s mikro-puff kouřem každých 8s a warm caustic glow patch dolů, **Šeherezádin signature self-draw** (italic kaligrafie ve welcome card se sama napíše při načtení, 2s ease-out, jen 1× per session), **multifoil watermarks** (girih 8-cípé hvězdy v rozích sekcí, opacity 6–10%, statické).

Pravý panel = **MIX layout** (odchylka od mockupů, ale rozšíření globálního admin rozhodnutí, z memory `project_admin_panel_decision.md`):
1. **ADMINISTRACE** (nahoře — skin selector + uživatelé)
2. **MOJE DISKUZE** (uprostřed)
3. **MOJE SVĚTY** (dole)

Top bar zjednodušený: **Pošta + Tyky + Odhlásit** (Uživatelé + Skin selector přesunuty do pravého panelu).

**Pinyon Script** logo fallback (script font, baked-in do `logo.webp`) + **Cinzel Decorative** display (uppercase headings, carved palace inscription) + **Cormorant Garamond** body (humanistický manuskript) + **Tangerine** signature italic v tyrkysové (Šeherezádin podpis). Vše izolované, bez dopadu na ostatní skiny.

---

## 2. Kontext / motivace

- Africké (1.0q) bylo naposled tier-1 produkční skin (Země předků, savana za úsvitem). **„Arabský svět" je 15. ve „tier-1 produkční kvalitě"** — bagdádsko-perský palác jako vizuální opozit `africke` (sub-saharská prastará Afrika; teď arabský = severo-arabský palác, žádné sandstone / kente / adinkra), `indiane` (warm wood + iron + leather + tribal; teď arabský = silk + brass + jewels + arabesque), `severske-runy` (cold mead-hall + ice + wolves; teď arabský = warm night + lanterns + smoke), `hospoda` (medieval tavern + brass + warm hearth; teď arabský = palace harem + multifoil + cooler indigo base).
- Současný [`src/themes/themes/arabsky-svet/index.ts`](../../../src/themes/themes/arabsky-svet/index.ts) má minimální tokens. **Nutné kompletní přepsání** dle harém direction.
- Současný [`src/themes/themes/arabsky-svet/decorations.css`](../../../src/themes/themes/arabsky-svet/decorations.css) má pouze stub. **Nutné kompletní přepsání** dle struktury indiane / africke (~900 řádků).
- Pozadí `background.png` (user dodal 2026-05-11) je dramatické a tier-1 kvality — noční scenérie palácové komnaty s mašrabíja rámem, baked-in samet závěsy, krescent, palmy, koberce, lucerny, brass props. UI musí toto pozadí *podpořit*, ne s ním soupeřit. Mašrabíja overlay z předchozího brainstormingu je **redundantní** (BG už má baked-in mašrabíja rám) — odstraněno.
- User dodal `logo.png` + `medailon.png` v `assets-source/themes/arabsky-svet/` — oba ve stylu tmavý ořech + zlaté mauresque ornamenty s drahokamy. Tyto dva assety + dodaný background definují materiálový slovník: dále vygenerujeme **14 AI assetů** v ChatGPT (DALL-E 3 / GPT-image) s konzistentním stylem.
- Po dokončení bude **15 skinů** s „asset-grade" upgradem → projekt bližší dokončené Fázi 1.
- Frontend-design audit proveden (2026-05-11), uživatel zamítl intelektuální „kalifův hvězdář" pivot a potvrdil **maximalistický harém** direction: hedvábí + zlato + kouř + káva + růže + láska + magie + sny.

---

## 3. Audit současného stavu

### 3.1 Theme registry & tokens
- [`src/themes/themes/arabsky-svet/index.ts`](../../../src/themes/themes/arabsky-svet/index.ts) — existuje (cca 50 řádků). **Nutné kompletní přepsání** palety + fontů + tokens + asset URLs:
  - Paleta: midnight-night `#0a0e2c`, midnight-indigo `#0e1a3a`, velvet-bordo `#5a1828` → `#7a1828`, damask-rose `#c8385a`, saffron-gold `#e8b040`, patinated-gold `#a87830`, polished-gold `#e8c060`, pearl-ivory `#f0e4c8`, turquoise-mistus `#1a8a8a` → `#2ac4c4`, royal-purple `#4a1850`, smoke-gray `#3a3548`, ruby-crystal `#a8283c`, emerald-jewel `#1a6a4a`
  - Fonty: **Pinyon Script** (logo fallback — narrow Spencerian), **Cinzel Decorative** (display headings — carved palace inscription), **Cormorant Garamond** (body — humanistický manuskript), **Tangerine** (signature italic — Šeherezádin podpis)
- Asset URL proměnné chybí — nutné přidat (`--asset-logo`, `--asset-andel-medallion`, `--asset-corner` (multifoil gold ornament), `--asset-mukarnas-cornice`, `--asset-narghile`, `--asset-genie-lamp`, `--asset-caustic-glow`, `--asset-carpet-strip`, `--asset-rose-petal-near/mid/far`, 7× `--asset-icon-*`).
- Atmosphere string z původního se přepíše na **„Arabský svět — noční komnata sultánova paláce, mašrabíja výhled na zlato-tyrkysovou báň, hedvábí + zlato + kouř + káva + růžové okvětní lístky"**.
- Theme `name` zůstává **„Arabský svět"** (zachováno dle preference uživatele 2026-05-11), `id: 'arabsky-svet'` zachován.

### 3.2 Decorations
- [`src/themes/themes/arabsky-svet/decorations.css`](../../../src/themes/themes/arabsky-svet/decorations.css) — minimální stub. **Žádné panely, žádné NavItem styly, žádné dekorace, žádné mikrointerakce, žádné motion.** Skin viditelně nedokončený. **Nutné kompletní přepsání** dle struktury indiane / africke / severske-runy (~900–1000 řádků).

### 3.3 Asset folder
- `assets-source/themes/arabsky-svet/` — ✅ existuje (logo.png + medailon.png + background.png dodány uživatelem 2026-05-11)
- `public/themes/backgrounds/arabsky-svet.webp` — ⚠️ může existovat (původní BG byl označen jako „není dobrý"), **přepíše se** novým z `assets-source/`
- `public/themes/thumbnails/arabsky-svet.webp` — kontrola; pokud existuje, případně regenerace později (post-1.0r)
- `public/themes/arabsky-svet/decor/` — ❌ **neexistuje**, nutné vytvořit (17 souborů — 14 AI gen + logo + medailon + background konvertované z PNG → WEBP)

### 3.4 Africké + Indiane jako pattern předlohy (struktura, NE obsah)
- [`src/themes/themes/africke/decorations.css`](../../../src/themes/themes/africke/decorations.css) — sekce 1–27 jako struktura
- [`src/themes/themes/indiane/decorations.css`](../../../src/themes/themes/indiane/decorations.css) — alternativní pattern
- **„Arabský svět" použijí stejnou strukturu** (sekce 1–27), ale s vlastní materiálovou a ornamentální paletou (**multifoil zlato s drahokamy + mukarnasová římsa + mašrabíja hairline + rose petals + narghile smoke + genie lamp + Šeherezádin signature**). Nesdílí žádný ornament s ostatními skiny — má svůj vlastní vizuální slovník.

### 3.5 Memory & projekt-level rozhodnutí
- `project_admin_panel_decision.md` — Uživatelé + skin selector v ADMINISTRACE (pravý panel) → **arabsky-svet rozšiřuje** o MOJE DISKUZE + MOJE SVĚTY pod tím (3 sekce, viz rozšíření v memory 2026-05-11)
- `feedback_theme_isolation.md` — všechny edity scoped na `[data-theme="arabsky-svet"]`, **žádné globální ani shared CSS edity bez souhlasu**
- `feedback_skin_originality.md` — ornamenty musí být originální, **žádné sdílení s ostatními skiny**
- `feedback_workflow.md` — povinný workflow: spec → souhlas → impl. plán → souhlas → kód
- `feedback_frontend_design_audit.md` — frontend-design skill jako audit (✅ hotovo 2026-05-11, uživatel zamítl intelektuální pivot, potvrzen maximalistický harém)

---

## 4. Návrh řešení

### 4.1 Background & atmosféra

- **Background image** — `/themes/backgrounds/arabsky-svet.webp` (✅ user dodal `assets-source/themes/arabsky-svet/background.png`, **konverze PNG → WEBP** přes pipeline, plně nahrazuje stávající BG pokud existoval)
- **Atmosférický overlay** — radial-gradient pro fokus + linear darken pro čitelnost UI (BG je už cinematic dramatic):
  ```css
  '--theme-bg-overlay':
    'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(10, 14, 44, 0.45) 100%), linear-gradient(180deg, rgba(10, 14, 44, 0.20) 0%, rgba(10, 14, 44, 0.45) 100%)'
  ```
- **🎨 ORIGINÁL — Růžové okvětní lístky drift** (signature element — žádný jiný skin nemá padající okvětní lístky):
  - `[data-theme="arabsky-svet"][data-shell="ikaros"] body::after` — 3 vrstvy parallax částic (CSS-only přes 3× `background-image` data-uri SVG s rose petals + gold flakes mix)
  - Implementace:
    - **Near layer** (větší, opacity 0.55): rose petals damask rose `#c8385a` + gold flakes `#e8b040` mix, 8–12px, 6 částic per 800×800 tile
    - **Mid layer** (střední, opacity 0.40): 5–8px, 6 částic per 240×240 tile
    - **Far layer** (drobné, opacity 0.30): 3–5px, 4 částic per 180×180 tile
  - Animation: `arabsky-petal-near 90s linear infinite`, `arabsky-petal-mid 120s linear infinite`, `arabsky-petal-far 150s linear infinite`
  - Background-position posun: `0 0 → +280px +900px` (diagonální shora-zleva dolů-doprava, simuluje gravitaci + jemný vítr)
  - **Reduced-motion vypíná** (statické particles bez posunu)
- **🎨 ORIGINÁL — Kouř z narghile** (vlnitá SVG ribbon stoupá z pravého dolního rohu):
  - Asset: `narghile-smoke.svg` (vertikální SVG path s `feTurbulence` mask) NEBO inline SVG v decorations.css
  - Position: `fixed; bottom: 0; right: 0; width: 180px; height: 60vh; opacity: 0.45; mix-blend-mode: screen;`
  - Animation: `arabsky-narghile-smoke 8s ease-in-out infinite` — path morph nebo `background-position` shift (stoupá nahoru s mírnou vlnou)
  - Color: smoke-gray `#3a3548` → fade to transparent v horní třetině
  - **Mobile (≤768px)**: skryto NEBO opacity 0.25 (vyrušuje na úzké)
  - **Reduced-motion**: static smoke shape v idle position, opacity 0.35
- **🎨 ORIGINÁL — Lampa génia s mikro-puff kouřem** (visící mosazná lampa v pravém horním rohu hlavního panelu, plus caustic glow patch dolů):
  - Asset: `genie-lamp.webp` (180×320, mosazná lampa s perforacemi, řetěz nahoře)
  - Position: `absolute; top: -20px; right: 20px; width: 90px; height: 160px;`
  - Filter: `drop-shadow(0 4px 12px rgba(232, 192, 96, 0.40))`
  - Animation: `arabsky-lamp-sway 14s ease-in-out infinite` — `transform: rotate(±0.4deg)`, transform-origin: top center
  - **Mikro-puff kouře z hrdla lampy** — drobný SVG element nad lampou, opacity 0 → 0.7 → 0 over 1.5s, intervaly 8s mezi puffy
  - Animation: `arabsky-genie-puff 8s ease-in-out infinite` (1.5s puff visible, 6.5s pauza)
  - **Caustic glow patch pod lampou** — radial-gradient `var(--asset-caustic-glow)` 240×320, opacity 0.45 → 0.65 breathe 4s
  - Animation: `arabsky-caustic-breathe 4s ease-in-out infinite`
  - **Reduced-motion**: rotation 0deg, puff hidden, glow static at opacity 0.55
- **🎨 ORIGINÁL — Multifoil watermarks** (girih 8-cípé hvězdy v rozích sekcí):
  - Inline SVG data-uri proměnné v `index.ts` — `--asset-girih-star-8`, `--asset-girih-cross`, `--asset-girih-pentagon`
  - Per-section použití přes `[data-section-key]` attribute na panelech (administrace → girih-star-8, diskuze → girih-cross, světy → girih-pentagon)
  - Position: absolute, top-right roh panelu, 32×32px desktop, 24×24px mobile
  - Opacity: 0.06–0.08
  - **Žádná animace** — symboly jsou tiché jako šepot

### 4.2 Topbar (slim, 56px) — patinované tmavé dřevo + mukarnasová římsa + mašrabíja hairline

- Pozadí: tmavý gradient bez transparency (page-chrome je neprůhledný):
  ```css
  background:
    linear-gradient(180deg, #1a0a08 0%, #0a0508 100%);
  ```
- **Žádný backdrop-filter** (heavy carved wood, žádné prosvítání)
- **🎨 ORIGINÁL — Mukarnasová římsa** pod horní hranou topbaru (voštinová stalaktitová struktura visící dolů, statická, mosazná):
  - Asset: `mukarnas-cornice.webp` (1920×80, transparentní, mosazná řada stalaktitů)
  - Position: `absolute; top: 0; left: 0; right: 0; height: 32px; opacity: 0.85;`
  - **Mobile (≤768px)**: skryto NEBO výška snížena na 18px, opacity 0.70
- **🎨 ORIGINÁL — Mašrabíja hairline pod topbarem** (girih 8-cípé hvězdy + zlaté pruhy, alternativa africké kente weave + indián prairie-gold hairline):
  - 2px gradient pásek s girih pattern: `linear-gradient(90deg, transparent 0, var(--theme-polished-gold) 4px, var(--theme-patinated-gold) 8px, var(--theme-polished-gold) 12px, transparent 16px, transparent 24px)` repeating
  - Opacity 0.70, `filter: drop-shadow(0 0 4px var(--theme-glow-saffron))`
- Logo vlevo z `logo.webp` (horizontal banner s baked-in textem + dark wood + multifoil zlato ornamenty + script „Projekt Ikaros"): šíře `--asset-logo-w: 360px` desktop / `280px` tablet / `220px` mobile
- Pravé tlačítka (POŠTA, TYKY, ODHLÁSIT — zjednodušeno, Uživatelé + Skin selector se přesunou do pravého panelu) = **dark wood plaque s gold border**:
  - Background: `linear-gradient(180deg, #1a0a08 0%, #0a0508 100%)`
  - Border: 1px patinated-gold `#a87830`
  - Text: polished-gold `#e8c060` uppercase **Cinzel Decorative**, letter-spacing 0.12em
  - Hover: border → polished-gold `#e8c060`, text → pearl-ivory `#f0e4c8`, warm saffron glow `0 0 14px var(--theme-glow-saffron-strong)`
- **Mobile (≤768px)**: ikony only, label hidden přes `aria-label`
- **Mobile (≤480px)**: TYKY + ODHLÁSIT do hamburger drawer (existující pattern)

### 4.3 Sidebar levý — NAVIGACE / VESMÍRY / CHAT / DIMENSIONÁLNÍ HOSPODA

- Frame: tmavě indigový panel s **multifoil zlato-tyrkysový border** + **4× zlatý ornament s drahokamy v rozích** (převzaté přesně z medailonu):
  - Background: `linear-gradient(160deg, rgba(14, 26, 58, 0.88) 0%, rgba(10, 14, 44, 0.94) 100%)` (midnight-indigo tone)
  - Border: 1px patinated-gold `#a87830`
  - Inner border (multifoil): `box-shadow: inset 0 0 0 1px rgba(26, 138, 138, 0.30)` (turquoise tone)
  - Box-shadow outer: deep `0 6px 22px rgba(10, 14, 44, 0.70)`
- **Corner ornament** — `corner-tl.webp` (zlatý multifoil ornament s vsazenými drahokamy) na všech 4 rozích (master TL, mirror přes CSS `transform: scaleX(-1) / scaleY(-1)` na ostatní 3 rohy):
  - Size: 72×72px desktop, 52×52px tablet, 38×38px mobile
  - `position: absolute; pointer-events: none; z-index: 5; filter: drop-shadow(0 1px 2px rgba(10, 14, 44, 0.65));`
- **Section titles** ("NAVIGACE", "VESMÍRY", "CHAT") — **Cinzel Decorative** uppercase, polished-gold:
  ```css
  color: var(--theme-polished-gold);
  font-family: var(--font-display);
  font-weight: 400;  /* Cinzel Decorative carved-stone feel */
  letter-spacing: 0.18em;
  text-shadow: 0 1px 2px rgba(10, 14, 44, 0.75);
  ```
  + **horizon-mihrab divider** jako `::after` pseudo pod section title (alternativa africké horizon-glow / indián petroglyph-divider / hospoda beer-foam):
  - `background: linear-gradient(90deg, transparent 0%, var(--theme-turquoise-mistus) 25%, var(--theme-polished-gold) 50%, var(--theme-turquoise-mistus) 75%, transparent 100%); height: 2px; opacity: 0.65; filter: drop-shadow(0 0 6px var(--theme-glow-turquoise));`
- **NavItem** ([class*="btn3d"]) — tmavý wood plaque s patinated-gold border + ivory text:
  - Idle: midnight-indigo gradient + 1px patinated-gold border + pearl-ivory text + subtle inner rim glow
  - Hover: warm saffron glow `0 0 12px var(--theme-glow-saffron)`, text → polished-gold `#e8c060`, `translateY(-1px)` lift
  - **Active** ([class*="btn3dActive"], [class*="navItemActive"]):
    - Background: `linear-gradient(90deg, rgba(232, 176, 64, 0.32) 0%, rgba(10, 14, 44, 0.85) 100%)` (saffron horizon)
    - **🎨 ORIGINÁL — Left-border = arabesque vine s rubínovým krystalem na konci** (alternativa africké aged-gold + bronze stitch / indián korálky):
      ```css
      &::before {
        content: '';
        position: absolute;
        left: 0; top: 4px; bottom: 4px;
        width: 4px;
        background-image: var(--asset-arabesque-vine);  /* inline SVG data-uri */
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center top;
        filter: drop-shadow(0 0 3px var(--theme-glow-saffron));
      }
      ```
      *Inline SVG: zlatý šlahoun arabesky se 2 listy + rubínový krystal `#a8283c` jako koncová tečka.*
    - **🎨 ORIGINÁL — Hamsa stamp** (Hand of Fatima, talisman ochrany — `::after` pseudo):
      ```css
      &::after {
        content: '';
        position: absolute;
        right: 8px; top: 50%;
        width: 24px; height: 24px;
        background-image: var(--asset-hamsa-stamp);  /* inline SVG data-uri */
        background-size: contain;
        opacity: 0.22;
        transform: translateY(-50%);
        pointer-events: none;
      }
      ```
    - Text: pearl-ivory `#f0e4c8`, glow `0 0 8px var(--theme-glow-saffron)`
- Touch target ≥48px mobile

### 4.4 Sidebar pravý — ADMINISTRACE + MOJE DISKUZE + MOJE SVĚTY (mix layout)

- **Order (dle Q-admin uživatel + memory `project_admin_panel_decision.md` rozšíření pro arabsky-svet):**
  1. **ADMINISTRACE** (nahoře):
     - Section title „ADMINISTRACE" v polished-gold Cinzel Decorative + horizon-mihrab divider
     - **Girih star-8 watermark** (8-cípá hvězda) jako subtle stamp v levém horním rohu sekce, opacity 0.07
     - **Skin selector** (ThemeSwitcher) — dark wood plaque button s patinated-gold border + caret, hover saffron glow
     - **Uživatelé** — link/button stejný styling
  2. **MOJE DISKUZE** (uprostřed) — sekce s navigations + „+" přidat tlačítko (rose stamp ikona)
     - **Girih cross watermark** v rohu, opacity 0.07
  3. **MOJE SVĚTY** (dole) — sekce s navigations + „+" přidat tlačítko (rose stamp ikona)
     - **Girih pentagon watermark** v rohu, opacity 0.07
  4. **OBLÍBENÉ ČLÁNKY** + **OBLÍBENÉ OBRÁZKY** (zachováno z předchozích skinů)
- Frame: stejný jako sidebar levý (midnight-indigo + 4× multifoil corner ornament)
- **„+" tlačítka** (rightAddBtn):
  - Background: `linear-gradient(180deg, rgba(232, 176, 64, 0.55) 0%, rgba(10, 14, 44, 0.85) 100%)` (saffron horizon)
  - Border: 1px polished-gold `#e8c060`
  - **`::before` pseudo s rose-stamp** (28×28px inline SVG damask rose silhouette):
    ```css
    background-image: var(--asset-rose-stamp);
    margin-right: 8px;
    transition: transform 200ms ease;
    ```
  - Hover: brighter saffron + gold glow, rose stamp scale 1.08 + opacity 1.0 (z idle 0.85)
  - Active: stamp scale 0.94 (klik feedback)
- **Empty hints** ("Žádné diskuze") — **Tangerine** italic v turquoise-mistus `#1a8a8a`, opacity 0.75, font-size 20px

### 4.5 Welcome card — „Odhrnutý hedvábný závěs do tajné komnaty" (signaturní element)

- **Material:** tmavě indigový panel s tyrkysovým multifoil borderem + zlato-rubín-smaragd corner ornaments + persian rug strip dole + scattered rose petals + Šeherezádin signature dole
- **Tvar:** obdélník s mírně zaoblenými rohy, `border-radius: 8px`
  - `aspect-ratio: 16 / 7` desktop, fallback `min-height: clamp(380px, 50vh, 540px)` desktop
  - Padding: 48px vertikální, clamp(20px, 6vw, 100px) horizontální (text musí mít prostor dýchat)
- **Background — vrstvy** (zdola nahoru):
  1. Midnight-indigo base — gradient `linear-gradient(180deg, var(--theme-midnight-indigo) 0%, var(--theme-midnight-night) 100%)` s subtle silk texture noise (`filter: contrast(1.05)`)
  2. `background-image: var(--asset-rose-petals-scatter)` — scattered rose petals jako pozadí (subtle), opacity 0.18, position center-bottom
  3. Vnitřní subtle glow z levého horního rohu (jako by lampa svítila): radial-gradient `rgba(232, 192, 96, 0.10) 0%, transparent 60%`
- **🎨 ORIGINÁL — Tyrkysový multifoil border + 4 zlato-rubín-smaragd corner ornaments**:
  - Outer border: 1px turquoise-mistus `#1a8a8a` s box-shadow inset multifoil pattern
  - 4 corner ornaments (`corner-tl.webp` style) — pozice absolutně v rozích welcome card, scaleX/Y mirror přes CSS
  - Size: 80×80px desktop, 56×56px tablet, 40×40px mobile
  - `filter: drop-shadow(0 2px 4px rgba(10, 14, 44, 0.65))`
- **🎨 ORIGINÁL — Persian rug strip na dolní hraně**:
  - Element: `[data-frame-panel="card"]::after`
  - `background-image: var(--asset-carpet-strip)` — horizontální tkaný perský koberec pásek (bordo + tyrkys + zlato motivy)
  - Width: calc(100% - 48px), height: 16px desktop / 12px mobile
  - Opacity: 0.90
  - Position: absolute, bottom 16px (uvnitř paddingu), left/right 24px
- **🎨 ORIGINÁL — Scattered rose petals** (4–6 lístků v subtle layoutu po obvodu welcome card):
  - Inline SVG nebo PNG asset `rose-petal-scatter.webp` jako `::before` background-image
  - Opacity 0.35, statické (animace už dělá viewport-wide drift)
- **Heraldický medailon vlevo** (`[data-andel-medallion]`) — větší dominantní čtverec (medailon.webp = ořechové dřevo s multifoil okenním rámem + andělem):
  - 192×192px desktop, 144×144px tablet, 112×112px mobile
  - `background-image: var(--asset-andel-medallion)`, contain, no-repeat, center
  - `flex-shrink: 0; filter: drop-shadow(0 4px 14px rgba(10, 14, 44, 0.75))`
- **Text styling uvnitř welcome card:**
  - **welcomeTitle** ("Vítej v Projektu Ikaros.") — **Cinzel Decorative** weight 400, color pearl-ivory `#f0e4c8`, text-shadow `0 1px 2px rgba(10, 14, 44, 0.75)`, font-size clamp(28px, 4vw, 44px), letter-spacing 0.02em
  - **titleAccent** ("Projektu Ikaros.") — **Cinzel Decorative** weight 700, color turquoise-mistus `#1a8a8a` (kontrast vůči ivory title)
  - **paragraph** (2 odstavce) — **Cormorant Garamond** color pearl-ivory `#f0e4c8`, line-height 1.7, font-size 15px
  - **🎨 ORIGINÁL — signature self-draw** ("Příjemnou zábavu přeje Šeherezáda.") — **Tangerine** italic, color turquoise-mistus `#1a8a8a`, font-size 32px, text-align center
    - SVG path s stroke-dasharray + dashoffset animace: signature se sama napíše při loadu welcome card
    - Animation: `arabsky-signature-draw 2s ease-out 1` (jen 1× per session)
    - Position: pod paragraph, mezi 2 kaligrafickými svinky (decoration: `::before` flourish vlevo + `::after` flourish vpravo)
- **Box-shadow** — deep night shadow:
  ```css
  box-shadow:
    inset 0 0 0 1px rgba(26, 138, 138, 0.30),
    inset 0 0 80px rgba(10, 14, 44, 0.25),
    0 16px 40px -8px rgba(10, 14, 44, 0.85),
    0 24px 60px -12px rgba(10, 14, 44, 0.55);
  ```
- **Turquoise hairline** pod welcomeTitle (jako rytá linka):
  ```css
  &::after {
    content: '';
    display: block;
    margin-top: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--theme-turquoise-mistus), transparent);
    opacity: 0.65;
  }
  ```
- **Žádný pulse** — komnata je statická, magická bez nutnosti dýchat. Pulsování by snižovalo voyeur pocit.

### 4.6 Heraldický medailon (mimo welcome — header logo to už pokrývá)

- `--asset-andel-medallion` = `medailon.webp` (čtvercový multifoil rám s andělem)
- **Použití**: pouze ve welcome card (sekce 4.5)

### 4.7 Decor — Mukarnasová římsa v topbaru + Lampa génia v UI rohu

- **Mukarnasová římsa** — popsáno v 4.2 (`> header` `::before` element nebo absolute-positioned div)
- **Lampa génia** — popsáno v 4.1 (hlavní panel, absolute top-right)

### 4.8 PJ badge

- **Zlatý štítek s drahokamovým akcentem**:
  - Background: `linear-gradient(180deg, var(--theme-polished-gold), var(--theme-patinated-gold))`
  - Color: `#1a0a08` (dark on gold)
  - Border: 1px ruby-crystal `#a8283c` (drahokamové orámování)
  - Box-shadow: `0 0 8px var(--theme-glow-saffron), inset 0 0 0 1px var(--theme-patinated-gold), inset 0 1px 0 0 rgba(240, 228, 200, 0.32)`
  - Font: **Cinzel Decorative** weight 700, letter-spacing 0.10em

### 4.9 Nav ikony — 7 tematických ornament medailonů

- `[data-theme="arabsky-svet"] [data-nav-key] [class*="navItemIcon"]` styling:
  - Width/height: 22px desktop, 18px mobile
  - `background-size: contain; background-repeat: no-repeat; background-position: center;`
  - `filter: drop-shadow(0 0 3px var(--theme-glow-saffron));`
- Mapping přes `data-nav-key`:
  ```css
  [data-nav-key="uvodnik"]       → var(--asset-icon-uvodnik)       /* otevřený iluminovaný manuskript (Šeherezádin svitek) */
  [data-nav-key="vytvorit-svet"] → var(--asset-icon-vytvorit-svet) /* husí brk na hedvábném polštáři */
  [data-nav-key="diskuze"]       → var(--asset-icon-diskuze)       /* dallah konvice s párou (vůně kávy = hovor) */
  [data-nav-key="clanky"]        → var(--asset-icon-clanky)        /* svinutý svitek s mosazným pečetidlem (sultánská tugra) */
  [data-nav-key="galerie"]       → var(--asset-icon-galerie)       /* perská miniatura v multifoil rámu */
  [data-nav-key="napoveda"]      → var(--asset-icon-napoveda)      /* olejová lampa génia (Aladdin-style) — moudrost z lampy */
  [data-nav-key="hospoda"]       → var(--asset-icon-hospoda)       /* vodní dýmka (narghile) — místo setkávání = kuřácký salon */
  ```
- Lucide SVG ikony skryty: `[class*="navItemIcon"] svg { display: none; }`

### 4.10 Girih watermarks (decentní, kontextové)

- **🎨 ORIGINÁL — Girih symboly jako watermark v rozích panelů** (alternativa africké adinkra / indián bead-string / severské rune-circle):
  - Implementace: inline SVG data-uri proměnné v `index.ts` — `--asset-girih-star-8` (8-cípá hvězda), `--asset-girih-cross` (kříž), `--asset-girih-pentagon` (pětiúhelník), `--asset-girih-decagon` (10-úhelník — rare)
  - Per-section použití přes `[data-section-key]` attribute na panelech (administrace → girih-star-8, diskuze → girih-cross, světy → girih-pentagon)
  - Position: absolute, top-right roh panelu, 32×32px desktop, 24×24px mobile
  - Opacity: 0.07 (sotva viditelné, easter-egg pro pozorné)
  - **Žádná animace** — symboly jsou tiché šepoty
- Inline SVG fallback pokud asset nedodán

### 4.11 Novinky panel (dole)

- Background: tmavý midnight-indigo panel (consistency s ostatními panely), text v pearl-ivory `#f0e4c8`
- Title „Novinky" — **Cinzel Decorative** color turquoise-mistus `#1a8a8a` weight 400, text-shadow subtle
- **Ikona lucerny vlevo u nadpisu** (inline SVG nebo `::before` background-image lucerny mosazné)
- Empty hint — **Tangerine** italic v turquoise opacity 0.75, font-size 20px
- „Přidat novinku" tlačítko = stejný style jako rightAddBtn (rose stamp ::before)

### 4.12 Section titles + horizon-mihrab divider

- Section title typo: **Cinzel Decorative** UPPERCASE, color polished-gold, letter-spacing 0.18em
- `::after` pseudo s horizon-mihrab gradient (height 2px, opacity 0.65, position pod title, filter drop-shadow turquoise glow)
- **Žádná one-shot animace** (na rozdíl od africké sun-ascending — arabský má signature self-draw místo toho)

### 4.13 Animace inventář & reduced-motion

**Celkem 4 ambient + 1 one-shot:**

| # | Animace | Element | Trvání | Reduced-motion |
|---|---------|---------|--------|----------------|
| 1 | rose-petal-drift (3 vrstvy) | `body::after` | 90s / 120s / 150s linear infinite | vypnout (statické particles) |
| 2 | narghile-smoke | `[data-decor="narghile"]` fixed | 8s ease-in-out infinite | vypnout (static smoke shape, opacity 0.35) |
| 3 | genie-lamp-sway + caustic-breathe | hlavní panel `::before/::after` | 14s + 4s ease-in-out infinite | vypnout (rotation 0deg, glow static 0.55) |
| 4 | genie-puff (mikro-detail) | lampa `::after` | 8s ease-in-out infinite (1.5s visible) | vypnout (puff hidden) |
| 5 | signature-self-draw | welcome `[data-signature-draw]` SVG path | 2s ease-out 1 (jen 1× per session) | vypnout (instant visible) |

**Klíčový princip:** **welcome card NEPULSUJE** (na rozdíl od indián drum-beat). Komnata je magická bez nutnosti dýchat. Klid voyera je signaturní hodnota tohoto skinu.

**Reduced-motion media query:**
```css
@media (prefers-reduced-motion: reduce) {
  [data-theme="arabsky-svet"] *,
  [data-theme="arabsky-svet"][data-shell="ikaros"]::before,
  [data-theme="arabsky-svet"][data-shell="ikaros"]::after,
  [data-theme="arabsky-svet"][data-shell="ikaros"] body::after,
  [data-theme="arabsky-svet"][data-shell="ikaros"] [data-decor="narghile"],
  [data-theme="arabsky-svet"][data-shell="ikaros"] [data-decor="genie-lamp"],
  [data-theme="arabsky-svet"] [data-signature-draw] {
    animation: none !important;
    transition: none !important;
  }
}
```

### 4.14 Scrollbar styling

- Track: midnight-night `var(--theme-midnight-night)` `#0a0e2c`
- Thumb: patinated-gold `var(--theme-patinated-gold)` `#a87830`, border-radius 4px, width 8px
- Hover thumb: polished-gold `var(--theme-polished-gold)` `#e8c060`

### 4.15 Focus visible (a11y)

- Outline: `none` (replaced by box-shadow ring)
- Box-shadow: `0 0 0 2px var(--bg-primary), 0 0 0 4px var(--theme-turquoise-mistus), 0 0 14px var(--theme-glow-saffron)`
- Applied to: nav items, btn3d, headerBtn, rightAddBtn, addBtn, showAllLink

### 4.16 Forced colors (Windows high contrast)

- Logo, medailon, corner-tl, mukarnas-cornice, narghile, genie-lamp, caustic-glow, carpet-strip, rose-petals (3 vrstvy), 7× nav ikon, girih watermarks: `forced-color-adjust: none` aby vypadaly v high contrast normálně

---

## 5. Mobile degradace (≤768px)

- **Welcome card** → border-radius zachován (8px je už malé), aspect-ratio se uvolní (`aspect-ratio: auto`), padding redukce na 32px vert / 24px horiz
- 4 corner ornaments welcome card → 40×40px (z 80×80px desktop)
- Persian rug strip → height 12px (z 16px desktop)
- Scattered rose petals → opacity 0.20 (z 0.35 desktop, mobilní BG je vytíženější)
- Corner ornaments panelů → 38×38px (z 72×72px desktop)
- Mukarnasová římsa → height 18px (z 32px), opacity 0.70
- Mašrabíja hairline → height 1.5px (z 2px)
- Rose petals drift → jen 1 vrstva (z 3) — performance + rušivost
- Narghile smoke → opacity 0.25 (z 0.45), width 120px (z 180px)
- Genie lamp → 60×100px (z 90×160px), case glow patch 160×210 (z 240×320)
- Touch target min-height 48px na nav items
- Header buttons → icon-only, label hidden
- Logo width → 220px (z 360px desktop)
- `--frame-pad-x: 12px` (z 18px)
- Horizon-mihrab divider → height 1.5px (z 2px)

---

## 6. A11y & contrast audit

| Kombinace | Ratio | Status |
|-----------|-------|--------|
| `#0a0e2c` BG × `#f0e4c8` pearl-ivory text | ~16.2 | ✅ AAA |
| `#0a0e2c` BG × `#e8c060` polished-gold text | ~9.4 | ✅ AAA |
| `#0a0e2c` BG × `#e8b040` saffron-gold | ~8.1 | ✅ AAA |
| `#0a0e2c` BG × `#a87830` patinated-gold | ~5.2 | ✅ AA |
| `#0a0e2c` BG × `#1a8a8a` turquoise-mistus | ~4.6 | ✅ AA |
| `#0a0e2c` BG × `#2ac4c4` turquoise bright | ~7.8 | ✅ AAA |
| `#0e1a3a` panel × `#f0e4c8` pearl-ivory text | ~14.5 | ✅ AAA |
| `#0e1a3a` panel × `#e8c060` polished-gold | ~8.5 | ✅ AAA |
| `#0e1a3a` panel × `#1a8a8a` turquoise headline | ~4.2 | ✅ AA |
| `#c8385a` damask-rose × white (rare hover) | ~3.8 | ⚠️ POUZE dekorativní |

**Klíčové:** damask-rose `#c8385a` má nízký kontrast jako primární text — proto je vyhrazen pouze pro:
- **Decorative accents** (rose petal silhouettes — nehraje roli text)
- **Ruby crystals** v ornamentech (decoration, ne text)
- **Hover states** kde je rose pouze indikační, ne čitelnostní

**Damask-rose NIKDY ne pro:**
- Body text
- Section titles
- Nav item labels

### Reduced motion audit
Všech 5 animací má fallback `animation: none !important` v `@media (prefers-reduced-motion: reduce)` — žádný blok skinu nezávisí kriticky na animaci.

---

## 7. Soubory a změny

| Soubor | Akce | Velikost |
|--------|------|----------|
| [`src/themes/themes/arabsky-svet/index.ts`](../../../src/themes/themes/arabsky-svet/index.ts) | **Kompletní přepis** — paleta, fonty (Pinyon Script + Cinzel Decorative + Cormorant Garamond + Tangerine), 17 asset URLs, layout vars, inline SVG girih + hamsa + arabesque-vine + rose-stamp data-uri | ~220 řádků (z ~50) |
| [`src/themes/themes/arabsky-svet/decorations.css`](../../../src/themes/themes/arabsky-svet/decorations.css) | **Kompletní přepis** — 27 sekcí dle africké/indián/severske vzoru | ~950 řádků (z ~stub) |
| [`public/themes/arabsky-svet/decor/*.webp`](../../../public/themes/arabsky-svet/decor/) | **Vytvořit** — 17 souborů (14 AI gen + logo + medailon + background konvert z `assets-source/`) | nový adresář |
| [`public/themes/arabsky-svet/decor/_asset-prompts.md`](../../../public/themes/arabsky-svet/decor/_asset-prompts.md) | **Vytvořit** — 14 prompty pro ChatGPT generaci | nový soubor |
| [`public/themes/backgrounds/arabsky-svet.webp`](../../../public/themes/backgrounds/arabsky-svet.webp) | **Přepsat / vytvořit** — z `assets-source/themes/arabsky-svet/background.png` přes konvert pipeline | nahrazuje stávající |
| [`scripts/finalize-arabsky-svet-assets.mjs`](../../../scripts/finalize-arabsky-svet-assets.mjs) | **Vytvořit** — resize/convert pipeline (PNG → WEBP, optimize) | ~80 řádků |
| [`assets-source/themes/arabsky-svet/`](../../../assets-source/themes/arabsky-svet/) | ✅ **Existuje** (logo.png + medailon.png + background.png + 14 AI gen PNG po doplnění) | 17 PNG souborů po dokončení |

**Mimo scope:**
- Globální CSS (žádné edity)
- Shell layout komponenty (žádné edity)
- Ostatní 21 skinů (nulová regrese)
- Theme registry [`src/themes/themes/index.ts`](../../../src/themes/themes/index.ts) (arabsky-svet už registrován, žádný edit)
- TypeScript typy (žádný edit)
- Thumbnail `public/themes/thumbnails/arabsky-svet.webp` (zachováno; volitelně regenerace později, post-1.0r)
- Memory edit `project_admin_panel_decision.md` (✅ už doplněno o arabsky-svet mix layout 2026-05-11)

---

## 8. Asset list

| # | Asset | Cesta | Rozměr | Status |
|---|-------|-------|--------|--------|
| 1 | logo | `public/themes/arabsky-svet/decor/logo.webp` | ~1200×280 | ✅ user dodal (.png → convert) |
| 2 | medailon | `public/themes/arabsky-svet/decor/medailon.webp` | ~600×600 | ✅ user dodal (.png → convert) |
| 3 | background | `public/themes/backgrounds/arabsky-svet.webp` | ~2560×1440 | ✅ user dodal (.png → convert, **přepisuje stávající BG**) |
| 4 | corner-tl | `public/themes/arabsky-svet/decor/corner-tl.webp` | 256×256 | ⏳ AI gen — zlatý multifoil ornament s vsazenými drahokamy (převzato z medailon styling) |
| 5 | mukarnas-cornice | `public/themes/arabsky-svet/decor/mukarnas-cornice.webp` | 1920×80 | ⏳ AI gen — voštinová mosazná stalaktitová struktura horizontální |
| 6 | narghile-smoke | `public/themes/arabsky-svet/decor/narghile-smoke.webp` | 180×800 | ⏳ AI gen — vertikální vlnitá kouřová ribbon transparent, smoke-gray |
| 7 | genie-lamp | `public/themes/arabsky-svet/decor/genie-lamp.webp` | 180×320 | ⏳ AI gen — mosazná visící lampa s perforacemi (Aladdin-style), řetěz nahoře, transparent BG |
| 8 | caustic-glow | `public/themes/arabsky-svet/decor/caustic-glow.webp` | 400×500 | ⏳ AI gen — radiální mosazný caustic light patch (jako kdyby světlo padalo přes perforace lampy) |
| 9 | carpet-strip | `public/themes/arabsky-svet/decor/carpet-strip.webp` | 1200×60 | ⏳ AI gen — horizontální tkaný perský koberec pásek (bordo + tyrkys + zlato) |
| 10 | icon-uvodnik | `public/themes/arabsky-svet/decor/icon-uvodnik.webp` | 96×96 | ⏳ AI gen — otevřený iluminovaný manuskript (sandstone tile) |
| 11 | icon-vytvorit-svet | `public/themes/arabsky-svet/decor/icon-vytvorit-svet.webp` | 96×96 | ⏳ AI gen — husí brk na hedvábném polštáři |
| 12 | icon-diskuze | `public/themes/arabsky-svet/decor/icon-diskuze.webp` | 96×96 | ⏳ AI gen — dallah konvice s párou |
| 13 | icon-clanky | `public/themes/arabsky-svet/decor/icon-clanky.webp` | 96×96 | ⏳ AI gen — svinutý svitek s mosazným pečetidlem (sultánská tugra) |
| 14 | icon-galerie | `public/themes/arabsky-svet/decor/icon-galerie.webp` | 96×96 | ⏳ AI gen — perská miniatura v multifoil rámu |
| 15 | icon-napoveda | `public/themes/arabsky-svet/decor/icon-napoveda.webp` | 96×96 | ⏳ AI gen — olejová lampa génia (Aladdin-style) |
| 16 | icon-hospoda | `public/themes/arabsky-svet/decor/icon-hospoda.webp` | 96×96 | ⏳ AI gen — vodní dýmka (narghile) |
| 17 | rose-petals-scatter | `public/themes/arabsky-svet/decor/rose-petals-scatter.webp` | 800×400 | ⏳ AI gen — scattered damask rose petals na transparentním pozadí (pro welcome card BG vrstvu) |

**Inline SVG (žádné assets):**
- **Girih watermarks** (Star-8, Cross, Pentagon, Decagon) — 4 symboly v `index.ts` jako data-uri
- **Hamsa stamp** (Hand of Fatima) pro active nav — outline SVG
- **Arabesque vine** pro active nav left-border — šlahoun s 2 listy + rubínový krystal `#a8283c` na konci
- **Rose stamp** pro rightAddBtn `::before` — damask rose silhouette
- **3× rose-petal SVG data-uri vrstvy** pro viewport drift (near/mid/far)
- **Šeherezádin signature SVG path** pro self-draw animaci ve welcome card

**Celkem 17 souborů** (z toho 3 ✅ dodány user), odhad ~420 KB po WEBP optimalizaci.

---

## 9. Originální motivy (žádný jiný skin nemá)

1. **„Odhrnutý hedvábný závěs do tajné komnaty" welcome card** + scattered rose petals BG + Šeherezádin signature self-draw + persian rug strip + tyrkysový multifoil border + 4× zlato-rubín-smaragd corner ornaments — žádný jiný skin nemá voyeurský welcome (afričan má stélu, indián má buben, severský má arch, hospoda má cedule)
2. **Multifoil zlato-mosazné corner ornaments s vsazenými drahokamy** (převzato z medailon stylingu uživatele) — 4 rohy panelů + welcome card; alternativa africké carved bronze diamonds, indián iron-nail-studs, severské wolfshield, nemrtví bone-corner
3. **Mukarnasová římsa pod topbarem** (voštinová stalaktitová struktura, statická, mosazná) — alternativa africké kente weave hairline, indián wood-grain hairline, severské iron strap
4. **Mašrabíja girih hairline** (8-cípé hvězdy + zlaté pruhy v repeating pattern) — alternativa africké kente, indián prairie-gold, severské bronze hairline
5. **Růžové okvětní lístky drift** (3 vrstvy parallax částic shora-dolů diagonálně, 90s/120s/150s) — alternativa africké diagonal dust drift (savana wind), severské snow fall (vertikální), žádný jiný skin nemá růžové + zlaté okvětní lístky padající jako sen
6. **Kouř z narghile** (vlnitá SVG ribbon stoupá z pravého dolního rohu, 8s) — žádný jiný skin nemá kouř; signaturní pro „Arabský svět"
7. **Lampa génia v rohu UI panelu** s mikro-puff kouřem každých 8s + warm caustic glow patch (4s breathe) — žádný jiný skin nemá lampu génia
8. **Šeherezádin signature self-draw** ve welcome card (SVG path stroke-dasharray + dashoffset animace, 2s ease-out, 1× per session) — alternativa africké sun ascending; arabský má signature self-draw
9. **Girih watermarks** (4 kontextové symboly v rozích panelů, opacity 0.07, statické) — alternativa africké adinkra, indián constellation overlay, severské carved knot-seal; arabský má autentickou islámskou geometric symboliku
10. **Arabesque vine left-border** na active nav s rubínovým krystalem na konci — alternativa africké aged-gold + bronze stitch, indián korálky, severské ice-line
11. **Hamsa stamp** (Hand of Fatima) v rohu active nav — alternativa africké Sankofa stamp; talisman ochrany v 1001 nocích
12. **Welcome card NEPULSUJE** — záměrně bez animace (na rozdíl od indián drum-beat); voyeur pocit klidu komnaty je signaturní hodnota tohoto skinu
13. **Mix layout pravého panelu** (ADMINISTRACE nahoře + MOJE DISKUZE + MOJE SVĚTY) — rozšíření globálního admin rozhodnutí specifické pro tento skin
14. **„Příjemnou zábavu přeje Šeherezáda."** signature místo „administrátoři" — narrativní hluboké rozhodnutí, podtrhuje 1001 nocí kontext

---

## 10. Akceptační kritéria

- [ ] **AC-1**: Po `themeId === 'arabsky-svet'` má dashboard hluboké půlnoční pozadí (`#0a0e2c`) s dodaným BG palácové scenérie, **žádný globální dopad** na ostatní 21 skinů
- [ ] **AC-2**: Logo v topbaru je `logo.webp` (tmavý ořech + multifoil zlato + drahokamy + baked-in script „Projekt Ikaros"), šířka 360px desktop / 280px tablet / 220px mobile
- [ ] **AC-3**: Sidebary mají midnight-indigo panely s `corner-tl.webp` zlato-multifoil ornamenty ve 4 rozích (master TL mirror), 1px patinated-gold border, deep box-shadow + multifoil inset border
- [ ] **AC-4**: Welcome card je „odhrnutý hedvábný závěs" (aspect 16:7 desktop) s scattered rose petals BG, tyrkysový multifoil border, 4× corner ornaments, persian rug strip dole
- [ ] **AC-5**: Text v welcome — title v **Cinzel Decorative** pearl-ivory, titleAccent v **Cinzel Decorative** turquoise-mistus, paragraph v **Cormorant Garamond** ivory, signature v **Tangerine** turquoise (self-draw animace 1× per session)
- [ ] **AC-6**: 7 nav ikon = `icon-*.webp` přes `data-nav-key` mapping (7 témat: manuskript / brk / dallah / svitek / miniatura / lampa / narghile), 22×22px desktop, drop-shadow saffron glow
- [ ] **AC-7**: Active nav má **arabesque vine left-border** s rubínovým krystalem + **Hamsa stamp** v pravém okraji (opacity 0.22)
- [ ] **AC-8**: Pravý panel obsahuje ADMINISTRACE (skin selector + uživatelé + girih-star-8 watermark) nahoře + MOJE DISKUZE (girih-cross) uprostřed + MOJE SVĚTY (girih-pentagon) dole (mix layout dle memory rozšíření)
- [ ] **AC-9**: „+" tlačítka (rightAddBtn / addBtn) mají rose stamp jako `::before` ikonu, hover scale 1.08
- [ ] **AC-10**: Section titles + horizon-mihrab divider pod nimi (height 2px desktop, 1.5px mobile, gradient turquoise → gold → turquoise)
- [ ] **AC-11**: Mukarnasová římsa pod horní hranou topbaru (statická voštinová struktura, mosazná, opacity 0.85; mobile redukce na 0.70)
- [ ] **AC-12**: Mašrabíja girih hairline pod topbarem (2px gradient, opacity 0.70, saffron glow)
- [ ] **AC-13**: Růžové okvětní lístky drift (3 vrstvy desktop / 1 vrstva mobile), 90s/120s/150s linear
- [ ] **AC-14**: Kouř z narghile v pravém dolním rohu (vlnitá SVG ribbon, 8s ease-in-out, opacity 0.45 desktop / 0.25 mobile)
- [ ] **AC-15**: Lampa génia v pravém horním rohu hlavního panelu se 14s sway animation + mikro-puff každých 8s + caustic glow 4s breathe
- [ ] **AC-16**: Šeherezádin signature self-draw na welcome card při načtení stránky (1× per session, 2s ease-out, SVG path animace)
- [ ] **AC-17**: Girih watermarks (Star-8 / Cross / Pentagon / Decagon) v rozích relevantních panelů, opacity 0.07
- [ ] **AC-18**: PJ badge je zlatý štítek s ruby-crystal border + dark text + saffron glow
- [ ] **AC-19**: Mobile (≤768px) — welcome card zachová obdélník, corner ornaments scaled 50% (z 80 na 40), rose petals drift 1 vrstva, narghile smoke opacity 0.25, genie lamp 60×100px, mukarnasová římsa redukováno
- [ ] **AC-20**: Reduced-motion — všech 5 animací má `animation: none !important` fallback
- [ ] **AC-21**: Forced colors — všechny carved/decorative assety mají `forced-color-adjust: none`
- [ ] **AC-22**: Focus visible — všechny interaktivní prvky mají box-shadow ring (turquoise outer + saffron glow)
- [ ] **AC-23**: WCAG contrast — všechny primární text kombinace ≥ AA (pearl-ivory na midnight-night AAA, polished-gold na midnight AAA, turquoise headline na midnight AA)
- [ ] **AC-24**: Animace inventář splňuje plán (5 typů, žádná chaotická interakce, welcome card nepulsuje záměrně)
- [ ] **AC-25**: Original motifs splněny (14 položek, sekce 9) — žádné sdílení s ostatními skiny
- [ ] **AC-26**: `npm run lint:colors` projde (žádné hardcoded barvy mimo CSS var)
- [ ] **AC-27**: `npm run audit:contrast` projde (žádné WCAG fails)
- [ ] **AC-28**: Screenshots na 3 viewportech (mobile 375px / tablet 1024px / desktop 1920px) zachycené a uložené v `docs/arch/phase-1/_screenshots/`

---

## 11. Mimo scope (explicitně)

- Globální CSS edity (žádné)
- Shell layout komponenty (žádné)
- Ostatní 21 skinů (nulová regrese, ne edit, ne dotyk)
- Backend / API změny (žádné)
- Theme registry [`src/themes/themes/index.ts`](../../../src/themes/themes/index.ts) (arabsky-svet už registrován)
- TypeScript typy (žádný edit)
- Nové komponenty (theme skin — pouze CSS + tokens)
- Thumbnail regeneration `public/themes/thumbnails/arabsky-svet.webp` (zachováno, volitelně post-1.0r)
- `docs/themes/arabsky-svet.md` přepis (volitelné, post-implementace, ne v 1.0r — pokud existuje)
- Backend i18n (žádný)
- Změna textu „Příjemnou zábavu přeji administrátoři" → „přeje Šeherezáda" v UI komponentě (toto je text v `WelcomeCard` komponentě — POZOR: pokud chce user změnit, je to mimo skin scope a vyžaduje edit shared komponenty; **DEFAULT: zachováme „administrátoři"**, signature self-draw aplikujeme na existující text)

---

## 12. Rizika & mitigace

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|------------------|-------|----------|
| BG je už dramatický → UI rám „přerazí" jeho krásu | V | V | Midnight-indigo panely v tónu sjednoceném s BG, border 1px, multifoil ornamenty jen v rozích (corner 72px), žádné velké kontrastní bloky |
| Mašrabíja overlay z předchozího brainstormingu byl naplánován ale BG už mašrabíja má baked-in | — | — | ✅ **Odstraněno** (sekce 4.1 ne má fixed mashrabiya overlay) |
| Animační chaos — 5 animací je hodně | V | S | Striktně 5 typů s jasnými rolemi (petal drift / narghile smoke / lamp sway+caustic / lamp puff / signature draw), všechny reduced-motion fallback, narghile smoke skryto na mobile |
| Damask-rose nízký kontrast jako text | V | S | Vyhrazen pouze pro decorative accents (rose petals, ruby crystals) — NIKDY pro body text |
| Růžové okvětní lístky drift performance (3 vrstvy + parallax) | M | M | Mobile redukce na 1 vrstvu, CSS-only background-position animation (GPU accelerated), žádný JS |
| Narghile smoke SVG morph performance | M | M | Jednoduchá path morph s `feTurbulence` (cached filter), opacity max 0.45, reduced-motion vypíná |
| Konflikt s `africke` (oba „warm exotic" skiny) | M | V | Africké = savana + sandstone + carved bronze + adinkra (sub-saharská prastará); arabský = palác + multifoil zlato + drahokamy + narghile + rose petals (severo-arabský luxus) — jasné materiálové + kulturní oddělení |
| Konflikt s `hospoda` (oba „warm cozy interior") | M | S | Hospoda = středověký dub + mosaz + krčmářský papír + heraldika (česká krčma); arabský = noční palácová komnata + tmavé ořechové dřevo + zlato + drahokamy + hedvábí (sultánský palác) — odlišný materiálový + kulturní jazyk |
| Pseudoarabská kaligrafie necitlivé použití | N | V | Žádná pseudoarabská písmena ve skinu (vše buď latinka, nebo decorative geometric girih); kaligrafický flourish ve welcome je čistě dekorativní svinka, ne pseudo-arabské znaky |
| Welcome card statická = nudná | N | M | Statika je záměrná designová volba (voyeur klid komnaty); ambient motion (rose petals + narghile + lamp + signature draw) okolo welcome dodává život BEZ pulse |
| Asset balík nekonzistentní | N | V | Stylistický direction (dark wood + multifoil zlato + drahokamy + smoke-gray + saffron + turquoise + rose) pevně definovaný v `_asset-prompts.md`, vše AI gen má unified prompt skeleton |
| BG soubor velký (~3 MB PNG) | V | M | Konvert PNG → WEBP přes pipeline, target ≤ 600 KB, quality 85, progressive load |

---

## 13. Workflow & schválení

Dle [base.md](../../../.claude/rules/base.md) + memory `feedback_workflow.md`:

1. ✅ **Brainstorming** — koncept „Arabský svět" prodiskutován + odsouhlasen (2026-05-11): name, direction = maximalistický harém (zamítnut intelektuální „kalifův hvězdář" pivot), welcome = „odhrnutý hedvábný závěs", motion plný balík, asset scope Premium 17, mix layout pravého panelu
2. ✅ **Frontend-design audit** — proveden (2026-05-11), 3 directions nabídnuty (Hvězdář kalifova dvora / Šeptající zahrada / Tisíc a jedna stránka), uživatel zamítl a navrátil k „Harém sultána Šahrijára"
3. ✅ **Background dodán** — `assets-source/themes/arabsky-svet/background.png` (2026-05-11)
4. ✅ **Memory rozšíření** — `project_admin_panel_decision.md` doplněn o mix layout pro arabsky-svet (2026-05-11)
5. 🟡 **Unified spec** — **TENTO DOKUMENT** (čeká na schválení)
6. ⏭️ **Asset prompty + generování** — bude vytvořeno `_asset-prompts.md` s 14 prompty po schválení specu
7. ⏭️ **Implementační plán** — po schválení spec
8. ⏭️ **Potvrzení plánu** — po dodání plánu
9. ⏭️ **Implementace** — kód (`index.ts` + `decorations.css` + asset konvert pipeline)
10. ⏭️ **Post-impl** — `roadmap-fe.md` update, `dluhy.md` review, screenshots, akceptace

---

## 14. Otázky vyřešeny

| # | Otázka | Rozhodnutí |
|---|--------|-----------|
| Q-koncept | Jdeme intelektuální astronom nebo maximalistický harém? | ✅ MAXIMALISTICKÝ HARÉM — exotika, touha, peníze, ženy, hedvábí, kouř, káva, růže, láska, magie, sny |
| Q-name | Skin name v UI? | ✅ „Arabský svět" (zachováno, id `arabsky-svet`) |
| Q-direction | Marocký riad / Bagdádsko-perský / Andaluský / Mughalský? | ✅ BAGDÁDSKO-PERSKÝ NOČNÍ PALÁC (potvrzeno mockupem + BG) |
| Q-welcome | Welcome card styl (manuskript / mihrab / astrolab / silk-curtain-reveal)? | ✅ „Odhrnutý hedvábný závěs do tajné komnaty" — scattered rose petals + persian rug strip + tyrkysový multifoil border + signature self-draw |
| Q-motion | Klidná / živá / plný balík? | ✅ PLNÝ BALÍK (5 animací — rose petals drift + narghile smoke + lamp sway+caustic + lamp puff + signature self-draw) + reduced-motion fallback |
| Q-assets | Lean / Standard / Premium? | ✅ PREMIUM (17 = 14 AI gen + logo + medailon + background) |
| Q-typografie | Kombinace 4 fontů? | ✅ Pinyon Script + Cinzel Decorative + Cormorant Garamond + Tangerine (žádný jiný skin nemá) |
| Q-admin | Pravý panel obsah? | ✅ MIX (ADMINISTRACE nahoře + MOJE DISKUZE + MOJE SVĚTY pod tím) — odchylka od mockupů + rozšíření globálního rozhodnutí, dle memory |
| Q-girih | Girih symboly použít? | ✅ ANO, decentně (4 symboly per kontext: Star-8 / Cross / Pentagon / Decagon, opacity 0.07), inline SVG data-uri (ne separate assety) |
| Q-pulse | Pulsuje welcome card jako indián drum? | ❌ NE — komnata je statická a magická, voyeur klid je signaturní hodnota tohoto skinu (záměrná designová volba) |
| Q-silhouette | Postava (konkubína) v BG mašrabíji? | ❌ NE — naznačená přítomnost přes objekty (rozházené polštáře, dýmka, růže, lampy) je silnější než explicit zobrazení; BG zůstává prázdný komnatový pohled |
| Q-narghile | Vodní dýmka je AI cliché nebo signature? | ✅ SIGNATURE (kouř z narghile je #1 wow-moment); uživatel explicitně potvrdil „kouř z dýmek a vůně kávy" jako hlavní leitmotiv |
| Q-mashrabiya-overlay | Overlay mašrabíja přes celý viewport (z předchozího brainstormingu)? | ❌ ZRUŠENO — BG už má mašrabíja rám baked-in, overlay by konfliktoval |
| Q-signature-text | „přeje administrátoři" / „přeje Šeherezáda"? | ✅ ZACHOVAT „administrátoři" (text je v shared `WelcomeCard` komponentě, edit by byl mimo skin scope); signature self-draw aplikujeme na existující text |

---

**Status:** ✅ Implementováno
Po souhlasu → `_asset-prompts.md` + impl. plán `plan-1.0r.md` → po souhlasu → kód.
