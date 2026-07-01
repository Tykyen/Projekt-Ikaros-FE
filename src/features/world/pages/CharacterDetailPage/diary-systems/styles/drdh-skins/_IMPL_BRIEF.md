# DrDH skiny — implementační brief (sdílený, 1 agent = 1 skin)

Cíl: `styles/drdh-skins/<id>.css` = skin `<id>` pro systém **Dračí Hlídka (drdh)** přes
všechny povrchy. **Rodina 8 skinů** (playbook §2) — TENTÝŽ svět napříč systémy:
tvůj skin má vypadat jako sourozenec `drdplus-skins/<id>.css` + `drd16-skins/<id>.css`,
jen přeložený do listu/panelů DrDH. NEvymýšlej identitu — PŘEVEZMI ji z rodiny + galerie.

## Scope / compound selector (past §9.13)
- List override: `[data-diary-system='drdh'][data-diary-skin='<id>'] .drdh-sheet { … }`
  (compound 0,2,0 přebije default `[data-diary-system='drdh']` z `drdh.css`).
- Panel + embed tokeny: `[data-diary-system='drdh'][data-diary-skin='<id>'] { … }`
  (BEZ `.drdh-sheet` — combat/bestie panel + embed chrome je dědí z předka, hashované module třídy).
- Signature ornamenty: `[data-diary-system='drdh'][data-diary-skin='<id>'] .<třída> { … }`.
- **KAŽDÉ pravidlo nese ten prefix.** Jen CSS/SVG, žádný JS. Regrese-safe (jen přidáváš overrides).

## Vstupy — PŘEČTI než začneš
1. **Galerie (vizuální kontrakt, schválený uživatelem):** `c:\tmp\drdh-skins-gallery.html` —
   najdi svou sekci `--skin-<id>` (palety: scifi ~ř.275, fantasy 301, horror 328,
   steampunk 354, nature 381, minimal 408, retro 434, anime 460). Přečti CELÝ blok svého
   skinu: `--parch/--ink*/--accent*/--parch-edge` + `--input-bg/--chip-bg/--seal*/--title/
   --btn-*/--wrap-*/--logrow-*` + fonty (`--fdisp/--fhead/--fbody/--fnum`) + signature (`.sig-<id>`).
   TOHLE je závazný vzhled — paleta, fonty, tvar. Uživatel ho schválil.
2. **Rodinný vzor (STEJNÝ skin jiných systémů — struktura + signature TVAR):**
   `styles/drdplus-skins/<id>.css` (nejbohatší) + `styles/drd16-skins/<id>.css`.
   Převezmi: signature ornament (chamfer/nýty/scanline/…), tvarový jazyk, jak řeší
   fonty na třídách, jak mapuje `--dd-*` panel tokeny, jak dělá `--dd-embed-*`.
3. **DrDH list (co přebíjíš — třídy + tokeny):** `styles/drdh.css` — PŘEČTI CELÝ.
   Tokeny `--drdh-*` (viz mapování níž). Třídy listu (na ně jdou barvy+ornament):
   root `.drdh-sheet .sheet` · hero `.hero .erb .erb-glyph .erb-banner .ribbon .ident-line`
   · sekce nadpis `.panel .panel-h .seal` (`.seal` = kruhový pečetní medailon = SIGNATURE)
   · `.field .spec-lock` · staty `.attr-head .attrs .attr-row .a-name .a-deg .a-mod`
   · `.hud .mega .mega-h .hp-row .hp-cur/-sep/-max/-death .calc` · `.skill-pts`
   · zdroj (per-povolání) `.res-pair .r-cur/-sep/-max .adr-track .adr-cell .adr-foot
   .res-note .res-wrap .res-box .res-mini .costume-list .crow .prizen-times .box`
   · tabulky `.tbl .l .del .add-btn` · schopnosti `.ability-list .ability-card
   .ability-head .ability-name .ability-desc`.
4. **Panel + embed baseline (co přebíjíš na `[ds][dsk]`):** `styles/diary-skins.css` blok
   `[data-diary-system='drdh']` (hledej „16b-skiny — DrDH"). Obsahuje PLNÝ seznam `--dd-*`
   panel tokenů + `--dd-embed-*`. Tvůj skin je má PŘEBÍT (i konfliktní tokeny co baseline
   záměrně vynechala — `--dd-ink`, `--dd-parch-1`, `--dd-parch-edge`, `--dd-card-bg`,
   `--dd-input-bg`, `--dd-line-soft`, `--dd-rule`, `--dd-hpfill-grad`, `--dd-seal-grad`,
   `--dd-seal-ink/-bd/-line/-soft`, `--dd-ink-soft/-deep`; ty na compound scope MŮŽEŠ sjednotit
   — je to záměr reskinu).

## Token mapování galerie (generic) → produkce DrDH
| galerie | list `--drdh-*` | panel `--dd-*` |
|---|---|---|
| `--parch` (plocha) | `--drdh-parch-tex` (+ slož `--drdh-parch-0/-1/-2`) | `--dd-parch-tex`, `--dd-panel-bg` |
| `--ink / -soft / -faint` | `--drdh-ink / -ink-soft / -ink-faint` | `--dd-ink / -ink-soft / -ink-2 / -ink-head / -ink-faint / -ink-deep` |
| `--accent / -hi / -deep` | `--drdh-gold / -gold-hi / -gold-deep` (+ `--drdh-brass`) | `--dd-gold / -gold-hi / -gold-deep`, `--dd-accent-grad*` |
| `--parch-edge` | `--drdh-parch-edge` | `--dd-line`, `--dd-parch-edge` |
| fonty | `--drdh-font-display / -head / -body` | `--dd-font-display / -head / -body` |
| životy (sémantika) | `--drdh-hp / -hp-cur` | `--dd-crimson*`, `--dd-hpfill-grad`, `--dd-body/-blood` |
| sekundární zdroj | `--drdh-res / -res-alt` | `--dd-adr*` (adrenalin), `--dd-resfill-grad` |
| magie | `--drdh-spell` | `--dd-sapphire*`, `--dd-res2fill-grad` |
| odolnosti bestií | — | `--dd-res-rez` (safír) / `--dd-res-imu` (smaragd) / `--dd-res-slab` (crimson) — DRŽ sémantiku |
| zbraně | — | `--dd-watk-grad` (útok crimson), `--dd-wdef-grad` (obrana) |

**Sémantika drží napříč skiny:** životy = červená/nebezpečí (i ve studené paletě nech
teplý/rose signál); odolnosti rez/imu/slab = safír/smaragd/crimson význam. Akcent (`--accent`)
= barevný charakter skinu (cyan/měď/růžová…).

## EMBED (`--dd-embed-*`) — obal TM / dice readout / dicelog / orchestrace / chat rail
Definuj PLNOU sadu na `[ds][dsk]`: `--dd-embed-surface` (VŽDY **OPAQUE** plný gradient —
jinak log prosvítá na mapu, past §9), `-border -line -text -muted -title -chip-bg -accent
-num-font -title-font -pos` (kladný hod/úspěch) `-neg` (záporný/neúspěch) `-neutral`.
Vzor: rodinný `drdplus-skins/<id>.css` sekce „EMBED plochy".

## Ornament policy (§3) — TVRDÉ
- **Signature TVAR** (`::before/::after`, clip-path, SVG, glow) SMÍŠ jen na: **list**
  (`.drdh-sheet`, `.panel`, `.seal`, `.ribbon`, `.erb`) · **combat/bestie panel** · **obal
  v TM** (`TokenInfoPanel` — per-skin `:has()`/compound, viz níž) · **dice readout** (kostka).
- **dicelog + orchestrace + chat obal (rail) = JEN barva/font.** ŽÁDNÝ `::before/::after`
  ornament. (Baseline `--dd-embed-*` je obarví — nepřidávej tvar.)
- DrDH signature = **kruhová pečeť-medailon** (`.seal`) + **stuhový banner** (`.ribbon`) +
  **štítový erb DH** (`.erb`). Tvůj skin přebásní JEJICH tvar do své rodiny (scifi→chamfer
  pečeť, steampunk→ozubené kolo-pečeť, anime→hvězda/srdíčko-pečeť…), ale drží FUNKCI.

## Obal/chrome per-skin (past §9.18 — NEJSNÁZ zapomenuté)
Obal panelu v TM (`TokenInfoPanel.module.css`) a chat rail NEDOSÁHNOU na per-skin tokeny
z potomka. Baseline `--dd-embed-*` (na `[ds][dsk]`) je obarví — to STAČÍ pro barvu.
Pokud chceš per-skin TVAR na obalu TM/readout, cíl přes compound
`.panel[data-diary-system='drdh'][data-diary-skin='<id>']` (vzor: `TokenInfoPanel.module.css`
`.panel[data-diary-system='drdplus'][data-diary-skin='fantasy']`) — ale to je NAD rámec
tvého souboru (jiný modul). Tvůj úkol: `drdh-skins/<id>.css` = list + panel tokeny + embed
tokeny + list ornament. Obal-TM per-skin tvar řeší orchestrátor centrálně (neřeš).

## Anime = SVĚTLÝ (uživatel 2× zdůraznil)
Skin `anime` (MLP) je **světlý pastel** — `--parch` světlé (#ffe3f4/#dbecff/#fbf3ff),
`--ink` tmavý (#2a2350) NA světlém. NE tmavé pozadí. Embed surface taky světlý-pastel
opaque (ne void). Toto je tvrdý požadavek.

## Fonty
`@import url(...)` Google Fonts NAHOŘE (CSS spec) — dle galerie/rodiny svého skinu.
Pak swap na `--drdh-font-*` + `--dd-font-*` + na konkrétních třídách kde galerie mění font.

## Self render-verify (POVINNÝ — jinak tiše-rozbitý kód, past §9.17)
1. `npm run build` — SÁM (PostCSS striktní; chytne `*/` v komentáři + syntax).
2. **List render:** postav harness `c:\tmp\drdh-skin-<id>-verify.html`:
   - `<link rel="stylesheet" href="…/styles/drdh.css">` + `<link … href="…/drdh-skins/<id>.css">`
     (font `@import` v CSS se načte).
   - `<body>` wrapper `<div data-diary-system="drdh" data-diary-skin="<id>">` → uvnitř
     LIST markup s produkčními třídami. Markup vytáhni z `c:\tmp\drdh-denik-audit.html`
     (schválený deník prototyp = produkční třídy `.drdh-sheet .sheet .hero .erb .ribbon
     .panel .panel-h .seal .attr-row .tbl .ability-card` …). Zkopíruj jeho `<body>` obsah,
     jen obal wrapperem s `data-diary-*`.
   - Chrome headless: `--headless=new --disable-gpu --screenshot=out.png
     --window-size=1280,2400 --virtual-time-budget=3000 --user-data-dir=<tmp>` (past: min okno
     ~482px). Otevři PNG, POROVNEJ s galerií svého skinu (paleta/font/signature sedí?).
3. **Panel/embed tokeny — statická kontrola:** ověř, že jsi definoval VŠECHNY `--dd-*` a
   `--dd-embed-*` tokeny, které baseline `[data-diary-system='drdh']` uvádí (grep baseline
   seznam × tvůj soubor). Chybějící token = panel/embed padne na baseline (fantasy) barvu.
   (Plný render panelů/embedu na mapě dělá orchestrátor v závěrečné kontrole — ty ověř list
   renderem + tokeny staticky.)
4. Doděláš → doladíš dokud list render nesedí s galerií. NEcommituj.

## Pasti §9 (shrnutí)
- `var(--x)` VŽDY s fallbackem (`var(--x, #hex)`), jinak prázdné → transparent.
- `*/` uvnitř CSS komentáře rozbije build — pozor na `--a-b-*/-c`.
- Embed surface OPAQUE.
- Corner/rohový SVG token NEEXISTUJE → ornament na embed = inline (u tebe se netýká —
  embed bez tvaru; jen list má tvar přes `.drdh-*` třídy).
- Fallback = původní hodnota tam, kde přebíjíš var() od baseline.

## Výstup (report)
Co jsi vytvořil, jaká paleta/fonty/signature (dle galerie+rodiny), potvrzení: build ✓,
list render sedí s galerií (+ PNG cesta), všechny baseline `--dd-*`/`--dd-embed-*` tokeny
přebity. NEcommituj.
