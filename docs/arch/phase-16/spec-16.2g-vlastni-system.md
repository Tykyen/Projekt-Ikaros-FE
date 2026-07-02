# 16.2g — Vlastní systém (meta-systém): engine pro deník/bestii/mapu/chat/skiny na míru

**Status:** F1 + F2 + F6 HOTOVO (2026-07-02, čeká živé ověření + BE restart) · F3 render funguje fallbackem · F4 (kostky) čeká · **Vytvořeno:** 2026-07-02
**Rozsah odsouhlasen:** celé (Úroveň 3), po krocích F1–F6, žádný dluh.

> **F6 dokončeno 2026-07-02** — 8 skinů generic (blokové karty) napříč VŠEMI povrchy.
> Generic byl mimo skin engine → tokenizace navíc (F1 skinů): `--gen-*` list
> (`DiaryTab.module`), `--dd-embed-*` bestie panel, `generic` do `:is()` seznamů
> 5 embed modulů, baseline `[data-diary-system='generic']` blok. Pak 8×
> `styles/generic-skins/<id>.css` (fan-out) + signature readout/obal TM + chat
> obal `:has()` (8× v railShell) + `BestieRollPanel` do DiarySkinScope.
> **Render-audit Chrome headless 8/8 všech povrchů** (deník/readout/dicelog/
> orchestrace/obal TM/obal chat PC+bestie); past §9.18 (chat obal) opravena.
> MLP = světlý/bílý+duhový (přání uživatele). Zbývá F4 (vlastní kostky).

> **F2 dokončeno 2026-07-02** — bestie schema builder + render na TM a v chatu.
> **Zjištění z průzkumu:** deník i bestie na taktické mapě a v chatu už fungovaly
> fallbackem (generic `DiaryTab` / `BestiePanelView` z `generic:token`). Reálná
> práce byla jen **editor šablony bestie (B)**: nová BE kolekce
> `entity_schema_versions` (per-svět verzované `SystemEntitySchema.sections`) +
> modul (repo/service/controller/DTO) + `SystemStatsValidator` `*WithSchema`
> metody + `BestiaeService` world-scoped validace. FE: hook `useResolvedEntitySchema`
> (world custom → jinak registry fallback; token fallbackuje na world `bestie`),
> napojený do `BestieStatblock` (mapa+chat), `BestiePanelView`, `BestieEditorModal`;
> editor `EntitySchemaEditor` + tab „Šablona bestie" (jen `vlastni`, PJ+);
> `generic/bestie.json` fallback. Ověřeno: BE typecheck+prettier+eslint, FE tsc +
> 853 testů + eslint. **Nutný BE restart** (nová kolekce/modul). Hody z bestie
> zůstávají 4dF (mechanika = F4).

> **F1 dokončeno 2026-07-02** — čistě FE (BE `config` je volný objekt, `expression`
> projde bez BE změny). Ověřeno: `tsc -b`, 341 testů, `eslint`. Živý vizuál po deployi.
> Odhalen a opraven hlubší nález: **formula featura byla mrtvá end-to-end** — `expression`
> se ztrácela v `flattenSchemaBlock`/`nestSchemaBlock`, editor ji neuměl zadat,
> `numericContext` se nikde nestavěl. Vše propojeno.
**Vazby:** [roadmap2.md:526-527] · [sablona-denik-per-system.md](./sablona-denik-per-system.md) · spec-8.1 (deník bloky) · spec-8.5 (editor schématu)

---

## Účel

Dát PJ/hráči **nástroje**, kterými si za běhu poskládá **vlastní herní systém od nuly** —
deník, bestii, combat na taktické mapě, chat i skin — bez toho, aby my psali dedikovaný
kód pro každý systém. Meta-systém = **generický schema-driven engine** povýšený tak, aby
jeho výstup vypadal jako plnohodnotný systém, ne jako tabulka polí.

Most k Fázi 21 (komunitní tvorba a sdílení systémů).

### Klíčový rozdíl oproti dedikovaným systémům
Dedikované systémy (D&D, Shadowrun, JaD…) = napevno napsané React komponenty
(`sheets/<id>/*.tsx`, `shared.ts` pro combat math). **Vlastní systém je opak** — vše se
renderuje z datového schématu za běhu. Proto nejtěžší nebude deník (skoro hotový), ale
**generizovat combat (F3) a skiny (F6)**.

---

## Architektura (co už existuje, na čem stavíme)

| Vrstva | Stav | Kde |
|---|---|---|
| `world.system = 'vlastni'` (brána) | ✅ | [systems.ts:25,29](../../../src/features/ikaros/pages/CreateWorldPage/constants/systems.ts) |
| Tab „Šablona deníku" (jen pro `vlastni`) | ✅ | [WorldSettingsPage.tsx:169-178](../../../src/features/world/pages/WorldSettingsPage/WorldSettingsPage.tsx) |
| Editor schématu (bloky/config/preview) | ✅ | [WorldDiarySchemaEditorPage](../../../src/features/world/pages/WorldDiarySchemaEditorPage/) |
| Verzované uložení world schématu | ✅ BE kolekce `diary_schema_versions` (worldId, version, schema[], archivedAt) | BE `diary-schema-versions.*` |
| View render 9 typů bloků | ✅ | [DiaryBlockView.tsx](../../../src/features/world/pages/CharacterDetailPage/components/DiaryBlockView.tsx) |
| Formula engine (`+ − * / %`, závorky, ref na pole) | ✅ | [diaryFormula.ts](../../../src/features/world/pages/CharacterDetailPage/components/diaryFormula.ts) |
| Per-postava override `personalDiarySchema` | ✅ modal v DiaryTab | [DiaryTab.tsx](../../../src/features/world/pages/CharacterDetailPage/components/DiaryTab.tsx) |
| Fallback `vlastni` → `genericPreset` | ✅ (přes `resolveSystemId` → není v registry → generic) | [systemId.ts](../../../src/features/world/systemId.ts) · [presets/generic.ts](../../../src/features/world/pages/CharacterDetailPage/diary-systems/presets/generic.ts) |

### Typy bloků (`DiaryBlockType`)
`stat` · `bar` · `list` · `text` · `number` · `textarea` · `image` · `relation` (odkaz na postavu) · `formula` (computed).
Blok: `{ id, key, label, type, config?, order }`, `config`: `{ description, minValue, maxValue, color, options[], layoutArea, imageUrl, expression }`.
Data postavy: flat `CharacterDiary.customData` (klíč = block.id/key), delta patch `{ customDataPatch: {...} }`.

---

## Fázování (odsouhlaseno)

| Fáze | Obsah | Staví na |
|---|---|---|
| **F1** | **Deník builder na 100 %** — tento spec, detailně níže. | ~70 % hotové |
| F2 | Bestie builder — user-editovatelné bestie schéma (per svět/user) + generický render + spawn na mapu. | 3-scope bestie |
| F3 | Combat / TM readout — generický combat panel řízený `combatBehavior` per pole (HP lišta, iniciativa, staty). | `combatBehavior` v BE schema |
| F4 | Kostky / hod — uživatel definuje kostkovou mechaniku + resolver + dicelog. | `evalFormula`, `onRoll` kontrakt |
| F5 | Chat obal — vlastní systém v chatu (readout + hod). | F4 + `DiaryTab` single-source |
| F6 | Skiny — vizuál napříč povrchy. | skin rodiny (16.2c) |

**Otevřené (rozhodnout u příslušné fáze):** F6 — vlastních 8 originál skinů vs. výběr z 8 rodin (návrh: výběr z rodin + neutrální „builder" default). F4 — hloubka definice mechaniky.

---

## F1 — Deník builder na 100 %

**Cíl:** PJ založí svět „Vlastní Systém" → poskládá deník (včetně vizuální struktury a
dopočtů) → hráč vyplní hodnoty **všech** typů polí → uloží → zobrazí. Bez rozbitých typů,
bez matoucího prázdného stavu.

### F1a — Oprava edit hodnot (🔴 jádro)
[SchemaValueEditor.tsx:125](../../../src/features/world/pages/CharacterDetailPage/components/editors/SchemaValueEditor.tsx) dnes padá na obyčejný `<input>` string
fallback pro 4 typy. Doplnit specializované editory:

- **`number`** → `<input type="number">` s `min`/`max` (dnes spadne do string fallbacku,
  ztrácí číselnou sémantiku). Sjednotit s větví `stat`/`bar`.
- **`textarea`** → `<textarea rows={4}>` (dnes jednořádkový input).
- **`relation`** → **reuse existujícího pickeru** ([LinkPicker](../../../src/shared/ui/LinkPicker/LinkPickerPopover.tsx) / [PagePicker](../../../src/features/world/components/PagePicker/PagePicker.tsx)); ukládá **slug** postavy (jak čeká [DiaryBlockView.tsx:38-41](../../../src/features/world/pages/CharacterDetailPage/components/DiaryBlockView.tsx)). **Žádná nová kopie pickeru** ([[project_link_picker_shared]]).
- **`formula`** → **NErenderovat editovatelný input** (je computed z jiných polí). V edit
  módu zobrazit read-only náhled výsledku + popisek „dopočítává se". Zamezit přepisu
  `customData[formula.key]` uživatelem (dnes ho edit ukládá jako string → koruptuje eval kontext).

**Akceptace F1a:** každý z 9 typů má v edit módu správný ovládací prvek; `formula` nejde
přepsat; hodnoty se uloží přes `customDataPatch` a zobrazí ve view.

### F1b — Zpevnění id `vlastni`/`generic`
Dnes `vlastni` funguje jen **náhodou fallbacku** (`resolveSystemId('vlastni')` → není v
registry → `genericPreset`). Udělat vazbu **explicitní**:
- Přidat alias `vlastni: 'generic'` do `SYSTEM_ALIASES` v [systemId.ts:20](../../../src/features/world/systemId.ts).
- Ověřit/rozšířit parity test registru (`diary-systems/__tests__/registry.test.ts`), ať
  `vlastni` deterministicky rezolvuje na `generic` napříč vrstvami.
- **Nepřejmenovávat** `world.system` v DB — `vlastni` zůstává uloženou hodnotou.

### F1c — Vizuální struktura deníku (`layoutArea`)
Datový model už `config.layoutArea` má, ale editor ho nezpřístupňuje → deník je plochý
seznam. Zpřístupnit v editoru **skupinu/sekci bloku** (`layoutArea` jako volitelný název
sekce) a ve view/edit bloky do sekcí seskupit. Umožní PJ postavit strukturovaný list
(„Atributy", „Boj", „Vybavení"), ne jen výčet.

### F1d — Prázdný stav a start
Svět `vlastni` startuje bez schématu (záměr — BE nemá preset, viz [systems.ts:2-4](../../../src/features/ikaros/pages/CreateWorldPage/constants/systems.ts)).
Dnes je prázdný editor bez vodítka. Přidat:
- Smysluplný **prázdný stav** editoru + „Přidat první blok".
- **2–3 startovní generic šablony** (fantasy / sci-fi / minimal) k jednorázovému vložení
  jako výchozí bod — čistě `DiarySchemaBlock[]` fixtures na FE, žádná grafika (ta je F6).
  *(Pozn.: klonovat NELZE z dedikovaných systémů — jsou React kód, ne schéma.)*

### F1 — mimo rozsah (pozdější fáze)
Bestie/combat/chat/skiny pro vlastní systém = F2–F6. F1 nechává `vlastni` na taktické
mapě/bestii na dosavadním `DiaryTab` fallbacku (deník ano, combat panel ne).

### Akceptační kritéria F1 (celé)
1. PJ vytvoří svět „Vlastní Systém" → v Nastavení vidí „Šablona deníku".
2. Vloží startovní šablonu **nebo** poskládá bloky od nuly; použije sekce (`layoutArea`)
   i `formula` pole.
3. Hráč otevře deník postavy → v edit módu vyplní **všechny** typy (vč. `number`,
   `textarea`, `relation` přes picker); `formula` se dopočítá a nejde přepsat.
4. Uloží → view zobrazí správně, sekce seskupené; per-postava override funguje.
5. `tsc -b` · `npm run build` · `eslint` · relevantní testy (SchemaValueEditor, DiaryTab,
   registry parity) zelené. Ověřeno `mobil-desktop`.
6. `funkce` + `napoveda` aktualizovány (změna funkčnosti — vlastní deník použitelný).

### Reuse (žádné nové kopie)
`DiarySchemaEditor` · `DiaryBlockView` · `evalFormula` · `LinkPicker`/`PagePicker` ·
`makeCdAccess` · `SectionListEditor`.

### Rizika
- **Data-korupce formula polem** (F1a) — dnes reálná; edit ho ukládá do stejného
  `customData`, odkud eval čte kontext. Fix = read-only + neukládat.
- **Picker vrací jiný identifikátor než slug** — ověřit v impl plánu, že reuse picker dává
  slug postavy ([[project_directory_id_vs_character_id]]).

---

## Rozhodnutí (decisions)
- **D-VS-1:** `vlastni` = uložená DB hodnota, `generic` = engine id; sjednoceno **aliasem**,
  ne přejmenováním (F1b). Neriskujeme migraci existujících světů.
- **D-VS-2:** startovní šablony jen jako `DiarySchemaBlock[]` fixtures (F1d), ne dedikovaný
  kód — drží princip „engine, ne obsah".
- **D-VS-3:** combat/bestie/chat/skiny vlastního systému = samostatné fáze; F1 je čistě
  deník, aby schéma polí bylo spolehlivý základ pro F2+.
