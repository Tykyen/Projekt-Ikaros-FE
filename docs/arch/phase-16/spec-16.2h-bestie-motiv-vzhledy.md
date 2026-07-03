# Spec 16.2h — Bestie: motivové vzhledy karty (12 world motivů)

> **Stav:** NÁVRH — čeká na schválení. Nekódit před schválením + impl plánem.
> **Zdroj vizuálů:** [`docs/bestiar-motivy.md`](../../bestiar-motivy.md) — 12 hotových HTML prototypů (`scratchpad/bestie-<motiv>.html`), fáze 1 ✅.
> **Navazuje na:** 16.2b/d (bestiář pilíř), 5.7 (world motivy / `data-theme`), 16.2c (skin engine deníku).

## 1. Účel

Karta bestie v bestiáři (`/svet/<slug>/bestiar`) dnes vypadá všude stejně (hardcoded fialová generic + custom drd16/fate). Cíl: **karta dostane vzhled ("kabátek") podle MOTIVU světa** (`data-theme`) — 12 originálních tvarových jazyků (Pečeť, Popínavý rám, Hologram, …), plus **rozbalovací detail** s plným listem bestie a nové pole **popis**.

**Dvě osy (nemíchat):**
- **MOTIV** (`data-theme`, 12) = vzhled: tvar + ornament + barvy/fonty.
- **SYSTÉM** (`systemStats` + schema, 14) = jaká pole se zobrazí.
- Karta = *tvar(motiv)* naplněný *poli(systém)*.

## 2. Schválená rozhodnutí (2026-07-03)

1. **Nové BE pole `description`** (veřejný popis, jak bytost vypadá/se chová) na entitě Bestie. `notes` se stává **GM poznámkami (jen PJ)**. Popis 2 úrovně: sbaleno (2 řádky, clamp) / plné v detailu.
2. **Zrušit `Drd16BestieCard` + `FateBestieCard`** — nahradit JEDNOU univerzální motiv-aware `BestieCard`. Pergamen drd16 / sépie fate zaniknou; napříč systémy jednotný motivový engine.
3. **Pilotní postup:** nejdřív 1 motiv (**dark-fantasy / Pečeť**) end-to-end (komponenta + disclosure + schema detail + 1 CSS skin + `description`), ověřit naživo → pak škálovat zbylých 11.

## 3. Architektura

### 3.1 Komponenta
Jedna `BestieCard` se **společným skeletonem** (napříč motivy):
- **Sbaleno:** portrét · jméno · typ/četnost · **popis** (2 řádky) · akce (Upravit/Klonovat/Smazat) · rozbalovací šipka. Žádné staty.
- **Rozbaleno** (disclosure, `useState`/`[data-open]`): **Popis** → **Boj** (HP bar + klíčové obrany) → **Útoky** → **Vlastnosti** → **Tělo/pohyb** → **Smysly** → **Výskyt a ekologie** → **Schopnosti** → **Poznámky (jen PJ)**.
- Sekce rozbaleného se generují **ze schématu systému** (read-only render `systemStats` dle `bestie.json`; nový read-renderer nebo reuse `EntitySchemaForm` v `disabled` režimu bez formu). Prázdná / nulová pole se **skrývají**.

### 3.2 Skin mechanika (motiv → vzhled)
- **Barvy/fonty:** výhradně `--theme-*` tokeny (kaskáda z `.shell[data-theme]`). Žádné hardcoded barvy.
- **Tvar + ornament:** per-motiv CSS **scoped `[data-theme='<id>'] .bestieCard { … }`** (12 sekcí). Ornamenty (hexagon sigil, úponky, hologram scan, šerifská hvězda…) = SVG přes CSS `background`/`mask` data-URI, nebo `::before/::after`, případně sdílená lehká **ornament vrstva** v komponentě řízená `data-theme` (jen když CSS nestačí — např. animace matrix rain/kola).
- **Kotva (neměnné napříč motivy):** mechanika rozbalování + boční textová tlačítka. Zbytek volný per motiv.

### 3.3 Datový model (BE — samostatný krok)
- Bestie entita: **+ `description: string`** (default `''`). Field-drift checklist: schema · DTO · service · `toEntity` mapper (viz `project_be_field_checklist`). Migrace není nutná (nové pole default prázdné).
- `notes` beze změny (nově sémanticky „GM poznámky, jen PJ"); rozbalený detail je renderuje jen pro role ≥ PJ.

### 3.4 Viditelnost
- **Poznámky (`notes`) jen PJ+**; popis + staty + útoky + schopnosti vidí i hráč. (Gate dle role ve WorldContextu.)

## 4. Rozsah

**JE součástí:**
- Univerzální `BestieCard` (sbaleno + rozbaleno), schema-driven detail, `description` pole (BE+FE), 12 CSS motiv-skinů, migrace pryč od drd16/fate custom karet, `BestieEditorModal` doplní pole `description` (odděleně od `notes`).
- Mobil i desktop.

**NENÍ součástí (pozdější):**
- Skin edit modalu do 12 motivů (modal zůstane funkční, kosmeticky sladěný na tokeny; plný per-motiv modal až po kartách — nebo samostatný bod).
- Chat/mapa embed varianty bestie (ty mají vlastní panely).

## 5. Postup (kroky — detailně rozpadne impl plán)

- **K1 (pilot):** `description` BE pole + FE typ; univerzální `BestieCard` skeleton s disclosure + schema read-detail; **dark-fantasy** CSS skin; `BestieEditorModal` + popis. Render-ověření naživo (Svět vil = drdplus).
- **K2:** ověřit na 2–3 dalších systémech (jiná pole) že detail sedí; doladit read-renderer.
- **K3:** zbylých 11 motiv-skinů (CSS), po dávkách, render-ověření každého.
- **K4:** odstranit `Drd16BestieCard`/`FateBestieCard` + reference; ověřit drd16/fate světy.
- **K5:** mobil-desktop; `funkce` + `napoveda` (nové pole popis, rozbalování, motivový vzhled); commit.

## 6. Otevřené technické body (vyřeší plán)
- Read-renderer detailu: nový lehký komponent vs. `EntitySchemaForm disabled`. (Preferováno: nový read-only, kvůli vzhledu.)
- Ornamenty: kde CSS data-URI stačí a kde nutná JS vrstva (matrix rain, točící se kola = animace).
- Konflikt s existujícím `data-diary-skin` engine (16.2c) — bestiář jede na `data-theme` (world motiv), ne na per-systém diary skin; ověřit, že se nebijí.

## 7. Kotva kvality
`docs/bestiar-motivy.md` = zdroj pravdy vzhledů + technické pasti (cache-bust při render-ověření, unikátní CSS třídy, `getComputedStyle` diagnostika, vegetace/neon jako absolute jen v hlavičce).
