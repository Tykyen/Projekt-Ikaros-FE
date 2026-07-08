# Spec 17.13 — Dedikovaná nápověda mapových panelů (Orchestrace + Efekty & kreslení)

**Status:** 🚧 Rozpracováno
**Rozsah:** FE only (`Projekt-ikaros-FE`). Žádné BE změny.
**Navazuje na:** [spec-13.6](../phase-13/spec-13.6-napoveda-in-situ.md) (in-situ nápověda: `WorldHelpButton` + `WorldHelpModal` + sdílené bloky `@/shared/ui/help`), [spec-10.2n](../phase-10/spec-10.2n.md) (orchestrace: accordion palety + přístup/viditelnost).
**Cíl uživatele:** „Orchestrace ať má vlastní nápovědu — co všechno je ve scéně, jak scénu nastavit, co orchestrace dokáže a jak s ní pracovat." + (navazující) „Také nápověda by měla být v efektech."

> **Rozšířeno (2026-07-08):** stejný vzor „?" → `WorldHelpModal` aplikován i na panel **Efekty & kreslení** (viz §3e). Dedikovaná nápověda mapových panelů je tedy sdílený mechanismus, ne jednorázovka pro orchestraci.

---

## 1. Problém

Panel `⚙ Orchestrace` (`MapPjPanel`) je režisérský pult PJ: scény, aktivní set PC/NPC/bestií, spawn, přístup hráčů, knihovna, import. Dnes existuje jen **jeden** mapový cheat-sheet ([TacticalMapHelp](../../../src/features/world/help/content/TacticalMapHelp.tsx)) dostupný přes „?" v iniciativní liště, kde je orchestrace shrnutá do jednoho řádku. To je málo — PJ potřebuje **kontextovou, dedikovanou** nápovědu přímo u panelu, ne schovanou mezi ostatní mapové nástroje.

**Nesrovnalost v zadání (prokomunikováno + potvrzeno):** uživatel psal „aby hráč věděl", ale panel Orchestrace vidí **jen PJ** (`isPJ` = owner světa / elevated admin / world-role ≥ `PomocnyPJ`, [TacticalMapView.tsx:2518](../../../src/features/world/tactical-map/TacticalMapView.tsx#L2518)). Nápověda tedy cílí na **PJ**. Uvnitř je jemnější gate: tvorbu scén (+ Nová / Knihovna / Načíst přípravu / Import UVTT) smí jen **striktní PJ** (`isPjStrict`, role ≥ `PJ`), kdežto edit scény a přiřazení hráčů smí i `PomocnyPJ`. Nápověda tento rozdíl zohledňuje.

## 2. Řešení

**Vlastní tlačítko „?" v hlavičce panelu Orchestrace** (vedle „—" minimalizace a chevronu) → otevře `WorldHelpModal` (size `lg`) s novým dedikovaným obsahem `OrchestraceHelp`. Reuse hotového in-situ vzoru z 13.6; obsah se skládá ze sdílených bloků `@/shared/ui/help`.

📌 **Proč vlastní `<button>` a ne `WorldHelpButton`:** `WorldHelpButton` nese base třídu `.helpBtn` (34×34, kulaté, světové tokeny `--surface-2`/`--accent`), která do kompaktní mono-hlavičky panelu (tokeny `--map-ui-accent-rgb`, `--font-mono`) nesedí. Nová hlavičková varianta drží tvarový jazyk hlavičky — stylovaná shodně s `.minBtn`, ikona lucide `HelpCircle`.

## 3. Komponenty

### 3a. `src/features/world/tactical-map/components/pj-panel/OrchestraceHelp.tsx` (nová)
Čistě prezentační, props `{ canManageScenes: boolean }` (= `isPjStrict` — rozliší, co smí jen plný PJ). Struktura (osnova odsouhlasena):

1. **Úvod** (`s.intro`) — 1–2 věty co panel je.
2. **Slovníček** (`TermGrid`) — scéna, aktivní scéna, aktivní set, přiřazení hráče, více scén paralelně, mlha/viditelnost.
3. **Rychlý start** (`StepList`) — od prázdné mapy k hotové scéně s tokeny (otevři → vytvoř scénu → nastav → naplň aktivní set → spawn → rozmísti/řiď → přiřaď hráče → (ulož)).
4. **Aktivní scény** (`HelpSubAccordion`) — akce nad scénou i u řádku (+ Nová, Knihovna, Načíst přípravu, Import UVTT, ⚙ Upravit, 🧹 Vyčistit, ✕ Deaktivovat, přepnutí sebe). Akce tvorby scén označené „jen plný PJ" (dle `canManageScenes`).
5. **PC / NPC / Bestiář** (`HelpSubAccordion`) — aktivní set vs katalog, spawn klik/drag, multi u NPC/bestií, × odebrání ze setu.
6. **Řízení scény** (`HelpSubAccordion`) — tokeny (přesun/zámek/HP), iniciativa & boj, mlha/LoS, efekty; odkaz „víc v nápovědě mapy".
7. **CalloutBox** (`tip`) — víc scén paralelně / skrytá příprava; kdo co vidí (PJ vs PomocnyPJ).

Reused bloky: `TermGrid`, `StepList`, `HelpSubAccordion`, `CalloutBox` z `@/shared/ui/help`; nadpisy přes `s.sectionTitle` z `WorldHelp.module.css` (konzistence s `TacticalMapHelp`/`ChatHelp`).

### 3b. `MapPjPanel.tsx` (úprava)
- `useState` `helpOpen`.
- V `<header>` mezi `.title` a `.minBtn` vložit `<button className={styles.helpBtn}>` s `HelpCircle` (18px), `onClick` `stopPropagation` + `setHelpOpen(true)`, `aria-label="Nápověda k orchestraci"`.
- Render `<WorldHelpModal open={helpOpen} onClose title="Orchestrace — nápověda" size="lg"><OrchestraceHelp canManageScenes={isPjStrict} /></WorldHelpModal>`.
- Import `WorldHelpModal` z `@/features/world/help`, `HelpCircle` z `lucide-react`.

### 3c. `MapPjPanel.module.css` (úprava)
- `.helpBtn` — kopie stylu `.minBtn` (barva `--map-ui-accent-rgb`, hover pozadí), rozměr na ikonu (`display:inline-flex`, `padding:2px 4px`). Umístěno u „—" (hlavička je `space-between`; `.minBtn` má `margin-left:auto` → `.helpBtn` bude těsně vedle vlevo od něj — pořadí DOM title → helpBtn → minBtn → chevron).

### 3d. `WorldSection.tsx` (zrcadlo do globální nápovědy)
Rozšířit stávající `MapFeature "Scény a orchestrace"` ([:519](../../../src/features/ikaros/pages/HelpPage/sections/WorldSection.tsx#L519)) o pojem **aktivní set** (kdo je na scéně k dispozici) a stručný workflow naplnění scény. Bez duplicit — detaily zůstávají v in-situ modalu.

### 3e. Efekty & kreslení — „?" nápověda (rozšíření 2026-07-08)
Stejný vzor pro dock **Efekty & kreslení** (`MapToolDock`, id `tools-effects`).

- **`EfektyKresleniHelp.tsx`** (`components/effects/`) — role-aware přes `audience: HelpAudience` (`pj` | `hrac`), ne `canManageScenes`. Panel totiž na rozdíl od orchestrace vidí **i hráč** (ale jen sekci Kreslení, a jen když PJ u scény zapnul `allowPlayerDrawing`; efekty jsou PJ-only). Obsah:
  - `pj`: sekce **Efekty** (barevná pole, bariéra/DC, výbuch/oblast oheň-plyn-kouř, šablona kužel/linie/koule/čtverec, guma, koš) + **Kreslení** (čára/šipka/kruh/text, barva, 👁 Všichni / 🔒 Jen PJ, Smazat moje/vše) + callout „Hráči smí kreslit anotace".
  - `hrac`: jen **Kreslení** + callout, že efekty dělá PJ.
- **`MapToolDock.tsx`** — opt-in prop `onHelp?`. Header přepsán z `<button>` na `<div role="button">` (aby šlo vnořit „?" tlačítko — button-in-button je nevalidní); přidán keyboard handler (Enter/Space toggle). „?" (`HelpCircle`) se renderuje jen když `onHelp` je předán → ostatní docky (Mlha, Zobrazení) beze změny.
- **`MapToolDock.module.css`** — `.headerActions` + `.help` (tokeny `--map-ui-accent-rgb`); mobil touch terč 34px.
- **`TacticalMapView.tsx`** — state `effectsHelpOpen`; `onHelp` jen na dock `tools-effects`; `WorldHelpModal` (size `lg`) s `EfektyKresleniHelp audience={isPJ ? 'pj' : 'hrac'}`.

## 4. Akceptační kritéria

1. V hlavičce panelu Orchestrace je „?" tlačítko; klik otevře modal, nezmění stav rozbaleno/sbaleno panelu (stopPropagation).
2. Modal ukazuje všech 7 bloků; akce tvorby scén označené „jen plný PJ" jen když `canManageScenes=false` (PomocnyPJ) → jinak bez omezení.
3. Patička modalu „Plná nápověda →" míří na `/ikaros/napoveda?sekce=svet` (nová záložka).
4. `WorldSection` rozšířen o aktivní set + workflow.
5. Token-only, žádné hardcoded barvy; `lint:colors` bez nových nálezů.
6. Responsivní (mobil 375 / desktop) — tlačítko i modal; `mobil-desktop` ✓.
7. `npm run build` ✓, `eslint` dotčených ✓, `npm run test:run` ✓.

## 5. Test plán

- `OrchestraceHelp` — `canManageScenes=false` ukazuje poznámku „jen plný PJ" u akcí tvorby scén; `true` ne.
- Smoke: `MapPjPanel` s „?" se vyrenderuje; klik otevře modal (mock).
- Regrese: stávající `MapPjPanel` testy dál procházejí.

---

> Osnova + forma odsouhlaseny uživatelem (2026-07-07) před spec. Po implementaci: `mobil-desktop` + skill `napoveda` (zrcadlo) + skill `funkce` (změna funkčnosti: nová nápověda) + roadmap-fe.
