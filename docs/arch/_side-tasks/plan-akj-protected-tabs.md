# Implementační plán — AKJ chráněné záložky

**Vychází z:** [spec-akj-protected-tabs.md](spec-akj-protected-tabs.md) (schválený model 2026-06-02)
**Režim:** jeden zátah, vnitřně 4 části (A→D), commit po každé části.
**Status:** ✅ KOMPLETNĚ HOTOVO A+B+C+D (2026-06-02, BE+FE typecheck/lint/testy zelené). D (odstranění privateContent + 'soukrome' tab) provedeno opatrně s mapou a ověřením — ~20 souborů, 0 regresí. Iterace UI: override = obrázek (HeroUploadCard) + text + table; page-level AccessPanel + AkjCreateModal smazány (mrtvý kód).

---

## Datový tvar (finální)

```ts
// FE: pages.types.ts | BE: page.interface.ts (zrcadlově)
export interface AkjTab {
  id: string;                       // crypto.randomUUID na FE při tvorbě
  name: string;                     // „Dvůr", „Královna", „PJ informace"
  level?: number;                   // clearance práh; promítne se do access jako {type:'AKJ'}
  order: number;
  access: AccessRequirement[];      // REUSE; OR logika; prázdné = jen PJ
  contentOverride?: {               // sparse — vyplněné pole přepíše základ, prázdné dědí
    imageUrl?: string;
    content?: string;               // rich-text HTML
    table?: PageTable;
    infoBlocks?: InfoBlock[];
    sections?: PageSection[];
  };
}
// Page: + akjTabs?: AkjTab[]
```

---

## ČÁST A — Datový model + BE gate (enforcement)

**Cíl:** `akjTabs` projde celým BE řetězcem a BE **filtruje** nedostupné záložky z GET response.

### A1. Typy (zrcadlově FE+BE)
- BE `page.interface.ts` — nový `AkjTab` interface + `Page.akjTabs?`
- FE `pages.types.ts` — totéž (sdílený tvar)

### A2. BE schema + DTO + sanitace + mapper (pozor [[project_be_field_checklist]])
- `page.schema.ts` — `@Prop([MixedArraySubSchema]) akjTabs` (default `[]`)
- `create-page.dto.ts` — `AkjTabDto` + `ContentOverrideDto` (nested validace, `@ValidateNested`, `@Type`, reuse `AccessRequirementDto`); `UpdatePageDto` dědí přes `PartialType` (beze změny)
- `pages.service.ts` — `sanitizeAkjTabs()`: sanitizuje `contentOverride.content` (rich-text), `table` (sanitizeTable), `sections[].content`, `infoBlocks` value. Volat v `create` i `update`.
- **`pages.repository.ts` `toEntity()`** — explicitně mapovat `akjTabs` VČETNĚ celého `contentOverride` (ne jen content!) a `access[]`. ⚠️ Bez toho se GET tiše zahodí.

### A3. BE gate — per-tab filtr (KLÍČOVÉ, opravuje návrh průzkumu)
- Nová privátní metoda `filterAkjTabsForViewer(page, userId, worldId, platformRole)`:
  - PJ / platform Admin+ → vrať všechny záložky
  - jinak: pro každou `tab` vyhodnoť `tab.access` **stejnou logikou jako `assertAccess`** (clearance `membership.akj >= level` / `UserId` match / `Role` / `AKJType`), OR. Nesplněné → **odstraň z response**.
  - PomocnyPJ NEMÁ auto-bypass (jen co splní přes access) — viz [[project_akj_protected_tabs]].
- Zavolat v `findBySlug` (a `findByWorld`/directory akjTabs neposílá — lehká projekce, OK).
- Refaktor: vytáhnout jádro vyhodnocení jedné `AccessRequirement[]` z `assertAccess` do sdílené `passesAccess(reqs, membership, platformRole)`, použít v `assertAccess` i `filterAkjTabsForViewer` (DRY).

### A4. BE testy (`pages.service.spec.ts`)
- akjTabs projdou create→GET (mapper nezahazuje)
- hráč s clearance 3 dostane jen záložky ≤3; clearance 5 dostane víc
- hráč s UserId grantem dostane jmenovitou záložku i bez clearance
- hráč bez ničeho → `akjTabs: []` (prázdné, ne undefined leak)
- PJ dostane všechny; PomocnyPJ jen splněné
- sanitace: `<script>` v contentOverride.content se odstraní

---

## ČÁST B — Viewer (zobrazení záložek)

**Cíl:** AKJ záložky se zobrazí v liště, render = merge override ?? základ.

### B1. Merge helper
- `lib/mergeAkjTab.ts` — `resolveAkjTabContent(basicPage, tab)` → vrátí efektivní `{ imageUrl, content, table, infoBlocks, sections }` (override ?? basic per pole). Unit test.

### B2. Záložky do layoutů
- `OstatniLayout.tsx` — refaktor: extrahovat render „content+sidebar+sekce" do reusable `PageBody` přijímající resolved data (dnes bere `page` přímo). AKJ tab pak renderuje `PageBody` s merged daty + `AkjDecryptedBanner`.
- `LokaceLayout.tsx`, `PostavaLayout.tsx` — přidat `page.akjTabs` (už BE-filtrované) do `Tabs` items za základní záložky; render přes `PageBody`.
- Záložky jsou **read-only ve vieweru** (editace v editoru) — žádný dirty-guard potřeba pro AKJ taby.

### B3. FE testy
- layout s 2 akjTabs vykreslí 2 navíc taby; merge dědí obrázek když override prázdný; přepíše když vyplněný.

---

## ČÁST C — Editor (správa záložek)

**Cíl:** PJ vytvoří/upraví AKJ záložku, nastaví přístup (level + hráči + role), přepíše obsah.

### C1. Form state
- `usePageEditorState.ts` — `akjTabs: AkjTab[]` do `PageEditorFormState`, default `[]`, `pageToFormState` → `page.akjTabs ?? []`.
- `PageEditor.tsx` submit payload — přidat `akjTabs: state.akjTabs` do create i update.

### C2. Nový panel `AkjTabsPanel.tsx` (nahrazuje roli `AccessPanel`)
- Seznam záložek (přidat/smazat/řadit `order`).
- Per záložka: název, level (number, volitelný), **přístup** (reuse vzor z `AccessPanel`: role select + clearance + whitelist hráčů z `useWorldMembers`), + override editory (obrázek URL, RichText content, table, sekce — co necháš prázdné, dědí).
- Tlačítko „PJ informace" = přidá záložku s `access:[{type:'Role',value:PomocnyPJ}]`.
- `AccessPanel` (page-level) — ponechat pro zámek **základní** stránky (zpětná kompat), nebo sloučit? → Ponechat zvlášť: page-level = kdo vidí stránku vůbec; AkjTabsPanel = záložky navíc.

### C3. FE testy
- panel přidá/smaže záložku; „PJ informace" předvyplní role access; submit obsahuje akjTabs.

---

## ČÁST D — Migrace privateContent → „PJ informace"

**Cíl:** zrušit paralelní systém skrývání.

### D1. Migrace dat (BE skript)
- Pro každou Page s `privateContent` || `privateInfoBlocks` → vytvoř `akjTab { name:'PJ informace', access:[{Role:PomocnyPJ}], contentOverride:{ content: privateContent, infoBlocks: privateInfoBlocks } }`; vynuluj stará pole.
- Idempotentní (skip pokud už „PJ informace" záložka existuje).

### D2. Odstranění starého renderu
- `SoukromeTab.tsx` + `privateContent`/`privateInfoBlocks` render v `PostavaLayout` → odstranit (nahrazeno AKJ záložkou).
- `PostavaPanel` private editor → odstranit (přesun do AkjTabsPanel).
- `filterPrivateForViewer` (BE) → po migraci nepotřebné, odstranit.
- ⚠️ Sjednotit s `characterTabVisibility` — ponechat jako default per-typ (mimo scope D), neřešit teď.

### D3. Verifikace
- migrační skript na kopii dat; zpětná kontrola že žádná Page nemá zbylé privateContent; FE už pole nečte.

---

## Pořadí + ověření
A (BE základ + gate, otestovat) → B (viewer) → C (editor) → D (migrace). Po každé části: typecheck + lint + testy zelené (BE hook = typecheck+lint, testy ručně viz [[feedback_be_precommit_prettier]]; FE bez hooku, vitest ručně [[project_fe_test_precommit]]). FE NIKDY prettierem ([[feedback_fe_no_prettier]]). Po B/C `mobil-desktop` skill. Na konec `napoveda` skill. Git commituje user ([[feedback_git_manual]]).

## Otevřené k potvrzení
1. **C2** — ponechat page-level `AccessPanel` vedle nového `AkjTabsPanel` (doporučeno), nebo sloučit do jednoho?
2. **Pilot** — zapnout AKJ taby ve VŠECH layoutech hned (Ostatni/Lokace/Postava), nebo začít jen Postava/NPC a wiki/galerie doplnit potom?
