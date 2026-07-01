# GURPS skiny — implementační brief (1 agent = 1 skin)

Cíl: `styles/gurps-skins/<id>.css` = skin `<id>` pro systém **GURPS 4E** přes všechny povrchy.
**Rodina 8 skinů** (playbook §2) — TENTÝŽ svět napříč systémy: tvůj skin má vypadat jako
sourozenec `drdh-skins/<id>.css` + `drdplus-skins/<id>.css` + `drd16-skins/<id>.css`, jen
přeložený do GURPS listu/panelů. **NEvymýšlej identitu — PŘEVEZMI ji z galerie + rodiny.**

## GURPS specifika (POZOR — liší se od pergamenových systémů)
- GURPS deník je **TMAVÝ „cold-steel" list** (ne pergamen). Třídy `.gurps-*`, tokeny `--gurps-*`
  (viz `styles/gurps.css` — PŘEČTI CELÝ). List NENÍ `--dd-*`/`--mx-*`, má vlastní `--gurps-*`.
- Panely (combat/bestie) + embedy konzumují **`--dd-embed-*`** (tokenizované `--g-*` →
  `var(--dd-embed-*, literál)`) — TY je definuj na `[ds][dsk]`.

## Scope / compound selector (KAŽDÉ pravidlo nese prefix)
- **List override:** `[data-diary-system='gurps'][data-diary-skin='<id>'] .gurps-dashboard { … }`
  (0,2,0 přebije default `[data-diary-system='gurps']` z gurps.css). Sem: `--gurps-*` override + font.
- **List ornament:** `[data-diary-system='gurps'][data-diary-skin='<id>'] .g-card { … }` atd.
- **Panel + embed tokeny:** `[data-diary-system='gurps'][data-diary-skin='<id>'] { … }`
  (BEZ `.gurps-dashboard` — panely/embed chrome je dědí z předka, hashované module třídy).
- Jen CSS/SVG, žádný JS. Regrese-safe (jen přidáváš overrides).

## Vstupy — PŘEČTI než začneš
1. **Galerie (schválený vizuální kontrakt):** `c:\tmp\gurps-skins-gallery.html` — najdi
   `<style>` blok `[data-skin=<id>]` (tokeny + signature ornament). TO je závazný vzhled
   (paleta, fonty, tvar — uživatel schválil). Anime = SVĚTLÝ (bílé cel-karty na pastelové duze).
2. **Rodinný vzor (STEJNÝ skin, struktura + signature TVAR):** `styles/drdh-skins/<id>.css`
   (nejčerstvější) + `styles/drdplus-skins/<id>.css`. Převezmi signature ornament
   (chamfer/nýty/filigrán/tracerie/scanline/…), tvarový jazyk, `@import` fontů, jak dělá `--dd-embed-*`.
3. **GURPS list (co přebíjíš):** `styles/gurps.css` — třídy + tokeny:
   - root `.gurps-dashboard` (font + `--gurps-*` tokeny)
   - hlavička `.g-head` · `.g-brand .gg` (BRAND — signature) `.g-brand .sub/.ed` · `.g-field label/.v` · `.chip .k/.n`
   - sekce `.g-card` (+ `> h3`, `.tag`, `.hint`) ← SEM signature ornament (rohy/rám/…)
   - atributy `.g-attr` (`.lab`, `.num`, `.pt`) · sekundární/HP/FP `.g-box` (`.k`, `.val`, `.g-box.hp`, `.g-box.fp`)
   - `.g-kv .row` · aktivní obrana `.g-adef .d` (`.n`,`.k`,`.frm`) · tabulky `.g-tbl` (`th`,`td`,`.num`,`.dodge`,`.accent`)
   - zbroj `.armor .dr` · dovednosti (v `.g-tbl`) · traity `.g-traits .g-trait-col` (`h4 .badge`, `li`, `tone-accent/hp/fp`)
   - poznámky `.g-textarea`/`.g-notes-ro` · shrnutí `.g-summary .row` (`.tot`, `.v`, `.v.neg`)
4. **Panel + embed baseline (co přebíjíš na `[ds][dsk]`):** `styles/diary-skins.css` blok
   `[data-diary-system='gurps']` (hledej „GURPS 4E — panel + EMBED baseline"). Přebij CELOU
   `--dd-embed-*` sadu + `--dd-hpfill-grad`/`--dd-fpfill-grad`.

## Token mapování galerie → produkce GURPS
| galerie `[data-skin]` | list `--gurps-*` | panel/embed `--dd-embed-*` |
|---|---|---|
| `--accent` | `--gurps-accent` | `--dd-embed-accent`, `--dd-embed-title`, `--dd-embed-neutral` |
| `--ink` | `--gurps-ink` | `--dd-embed-text` |
| `--dim` | `--gurps-ink-dim` | `--dd-embed-muted` |
| `--surface`/`--surface2` | `--gurps-panel`, `--gurps-panel-2` | `--dd-embed-surface` (OPAQUE gradient!), `--dd-embed-chip-bg` |
| `--line`/`--line2` | `--gurps-line`, `--gurps-line-strong` | `--dd-embed-line`, `--dd-embed-border` |
| `--hp` | `--gurps-hp` | `--dd-hpfill-grad` (lin-grad), `--dd-embed-neg` |
| `--fp` | `--gurps-fp` | `--dd-fpfill-grad` |
| `--pos`/`--neg` | — | `--dd-embed-pos` / `--dd-embed-neg` |
| fonty | `.gurps-dashboard { font-family }` + na `.g-brand .gg`/`h3`/`.g-attr .num` kde galerie mění | `--dd-embed-num-font`, `--dd-embed-title-font` |

**Sémantika drží:** životy=červená/rose, kladný hod=zelená, záporný=červená — i ve studené paletě.
Akcent = barevný charakter skinu (cyan/zlato/růžová/…).

## EMBED (`--dd-embed-*`) — obal TM / dice readout / dicelog / orchestrace / chat rail
Definuj PLNOU sadu na `[ds][dsk]`: `--dd-embed-surface` (VŽDY **OPAQUE** plný gradient — jinak
log prosvítá mapu), `-border -line -text -muted -title -chip-bg -accent -num-font -title-font
-pos -neg -neutral` + `--dd-hpfill-grad` + `--dd-fpfill-grad`. Vzor: `drdh-skins/<id>.css` sekce
„EMBED plochy". Readout/obal-TM dědí per-skin TVAR z centrálních `:is(...)` (orchestrátor přidal
gurps) — ty jen dodej barvy/tokeny.

## Ornament policy (§3) — TVRDÉ
- **Signature TVAR** (`::before/::after`, clip-path, SVG, glow) SMÍŠ jen na: **list** (`.gurps-dashboard`,
  `.g-card`, `.g-brand .gg`) · combat/bestie panel (řeší module — neřeš) · obal TM/readout (centrální).
- **dicelog + orchestrace + chat obal = JEN barva/font** (žádný `::before/::after` — baseline `--dd-embed-*` je obarví).
- GURPS nemá pečeť/erb jako DrDH — signature dej na `.g-card` (rohy/rám/scanline dle skinu) + `.g-brand .gg` (brand).

## Anime = SVĚTLÝ (uživatel 2× zdůraznil)
`anime` (MLP) = světlá pastelová duha + bílé cel-„samolepkové" karty (ink obrys #16162e + tvrdý
spodní cel-stín) + duhové medailony/podtržení + ✦. `--gurps-ink` tmavý (#2a2350) na světlém.
Embed surface taky světlý-pastel OPAQUE. Vzor: `drdh-skins/anime.css`.

## Self-check (POVINNÝ — NErenderuj Chrome, build dělá orchestrátor centrálně)
1. Všechny `var(--x)` mají fallback `var(--x, <hodnota>)`.
2. Definoval jsi CELOU `--dd-embed-*` sadu + `--dd-hpfill-grad`/`--dd-fpfill-grad` (grep baseline × tvůj soubor).
3. Přebil jsi klíčové `--gurps-*` (accent/ink/ink-dim/line/line-strong/panel/panel-2/hp/fp) + font.
4. ŽÁDNÝ `*/` uvnitř CSS komentáře (`--a-*/-b` rozbije build). Embed surface OPAQUE.
5. KAŽDÉ pravidlo nese compound prefix `[data-diary-system='gurps'][data-diary-skin='<id>']`.

## Výstup (report)
Co jsi vytvořil, paleta/fonty/signature (dle galerie+rodiny), potvrzení self-checku 1–5. NEcommituj, NErenderuj.
