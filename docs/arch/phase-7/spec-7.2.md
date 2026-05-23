# Spec 7.2 — Page editor (`/svet/:worldSlug/nova-stranka` + `/edit/:slug`)

> **Stav:** návrh k schválení • **Autor:** Claude + PJ • **Datum:** 2026-05-21
> Roadmap: [docs/roadmap-fe.md](../../roadmap-fe.md) řádek 1162+
> Návazný spec: [spec-7.1.md](spec-7.1.md) (viewer + AKJ banner navigace)

---

## 1 — Účel

Nahradit stub `PageEditorPage` plnohodnotným editorem wiki stránek. Pokrývá tvorbu (`/nova-stranka`) i úpravu (`/edit/:slug`) stránky **všech 7 typů**. Member-facing PJ/PomocnyPJ+ tool.

Aktivuje psaní obsahu pro modul `pages` (BE už hotov včetně CRUD/access/AKJ types). Bez 7.2 zatím není jak naplnit svět wiki stránkami (kromě 5 seed stránek z `pages-world-seed.listener`).

## 2 — Rozsah

### In-scope (7.2a–f z roadmapy + 7.2g–j rozšíření)

**Z roadmap-fe.md:**
- **7.2a** Rich-text editor (reuse `RichTextEditor` + image upload)
- **7.2b** Identita: title, type (7), menu, hero+`bigImage`, slug (auto z title)
- **7.2c** Datové šablony (Stát/Město/Noviny/Projekty/Postava…) → naplní `table`, config-driven
- **7.2d** Sekce: add/remove/reorder collapsible `sections[]`
- **7.2e** AccessRequirements UI + **AKJ creation flow** + checkbox auto-create meta stránky (z 7.1 odložené)
- **7.2f** Auto-save draftu (reuse `useDraftAutoSave`)

**Rozšíření (schválené v brainstormingu 2026-05-21):**
- **7.2g** `[[wikilink]]` autocomplete v TipTap (písmena `[[` → dropdown stránek)
- **7.2h** `Ctrl/Cmd+S` save shortcut
- **7.2i** Type-switch warning modal — varování při ztrátě dat jiného typu
- **7.2j** Live preview split view — toggle, editor | viewer side-by-side
- **7.2k** Optimistic concurrency control — `expectedUpdatedAt` v PATCH, BE 409 pokud mezitím update + FE modal „Refresh / Přepsat"
- **7.2l** Plný form draft do localStorage (ne jen `content`) — proti ztrátě dat při refresh

**Type-specific panely** (conditionally dle type):
- Galerie → editor `galleryImages[]` (add/remove/reorder, upload)
- Obrazovka → editor `videos[]` (YouTube URL parse, title, reorder)
- Seznam → editor `menu[]` (label + PagePicker na stránku světa, reorder) — žádné externí URL; lze odkázat i na zatím neexistující stránku (vzor SmartCellInput v Atributech); auto-label z title vybrané stránky pokud label prázdný
- Noviny → editor `customData` (klíče Stát/Vydavatel/Datum)
- Lokace/Rodokmen → hero + bigImage toggle (standard)

### Mimo rozsah

- **Hierarchie stránek** (parent-child strom) — BE ji nemá, mimo MVP
- **Verzování / historie** — mimo MVP
- **Konfliktní detekce** (dva PJ editují stejnou stránku současně) — odložit, low priority
- **Inline link picker mimo TipTap** — pokryjeme `[[wikilink]]` jen v contentu
- **Markdown import/export** — mimo MVP
- **PC/NPC/Deník** → fáze 8
- **Hromadné akce** (smazat všechny stránky typu X) → 7.4 admin

## 3 — Architektura

### Soubory (nové)

```
src/features/world/pages/PageEditor/
├── PageEditorPage.tsx              # entry — nahrazuje stub
├── PageEditorPage.module.css
├── PageEditor.tsx                  # presenter (state shell)
├── PageEditor.module.css
├── PageEditorSkeleton.tsx          # loading state
├── PageEditorSkeleton.module.css
├── panels/
│   ├── IdentityPanel.tsx           # 7.2b — title, type, slug, hero, bigImage, isWoodWide
│   ├── IdentityPanel.module.css
│   ├── ContentPanel.tsx            # 7.2a — RichTextEditor wrapper + draft restore
│   ├── ContentPanel.module.css
│   ├── SectionsPanel.tsx           # 7.2d — sections editor (drag-reorder)
│   ├── SectionsPanel.module.css
│   ├── TablePanel.tsx              # 7.2c — table editor + template picker
│   ├── TablePanel.module.css
│   ├── GalleryPanel.tsx            # type=Galerie
│   ├── GalleryPanel.module.css
│   ├── VideosPanel.tsx             # type=Obrazovka
│   ├── VideosPanel.module.css
│   ├── MenuPanel.tsx               # type=Seznam
│   ├── MenuPanel.module.css
│   ├── CustomDataPanel.tsx         # type=Noviny (Stát/Vydavatel/Datum)
│   ├── CustomDataPanel.module.css
│   ├── AccessPanel.tsx             # 7.2e — accessRequirements + AKJ creation
│   └── AccessPanel.module.css
├── components/
│   ├── CollapsiblePanel.tsx        # reuse shell pro každý panel
│   ├── CollapsiblePanel.module.css
│   ├── EditorTopBar.tsx            # breadcrumbs + save status + preview toggle
│   ├── EditorTopBar.module.css
│   ├── EditorStickyBar.tsx         # sticky bottom — Uložit / Náhled / Smazat
│   ├── EditorStickyBar.module.css
│   ├── RestoreDraftModal.tsx       # reuse pattern z ArticleEditorPage
│   ├── RestoreDraftModal.module.css
│   ├── TypeSwitchWarningModal.tsx  # 7.2i — warning při type change
│   ├── TypeSwitchWarningModal.module.css
│   ├── AkjCreateModal.tsx          # 7.2e — modal pro nový AKJ (+ auto-meta checkbox)
│   ├── AkjCreateModal.module.css
│   ├── DeletePageModal.tsx         # confirm pro smazání
│   ├── LivePreviewPane.tsx         # 7.2j — split view pravá strana
│   ├── LivePreviewPane.module.css
│   ├── WikilinkSuggestion.tsx      # 7.2g — TipTap suggestion render
│   └── WikilinkSuggestion.module.css
├── hooks/
│   ├── usePageEditorState.ts       # centralized form state (reducer)
│   ├── useSlugAutoGen.ts           # auto-gen slug z title
│   ├── useTypeSwitchGuard.ts       # detekce ztráty dat při type change
│   └── useWikilinkExtension.ts     # 7.2g — TipTap extension wrapper
├── lib/
│   ├── slugify.ts                  # cs-friendly slugify
│   ├── pageTemplates.ts            # 7.2c — config-driven šablony
│   ├── pageValidation.ts           # validace před save
│   └── youtubeParse.ts             # YouTube URL → videoId
└── index.ts

src/features/world/pages/api/
├── useCreatePage.ts                # POST /worlds/:worldId/pages
├── useUpdatePage.ts                # PATCH /worlds/:worldId/pages/:id
└── useDeletePage.ts                # DELETE /worlds/:worldId/pages/:id
```

📚 *Důvod centralizovaného state reduceru: form má ~15 polí (page entity), spread state mezi panely = nepřehledné. Reducer s diskrétními actions je čitelnější + testovatelnější.*

### Routy

Žádná změna v `router.tsx` (`/svet/:worldSlug/nova-stranka` a `/edit/:slug` už existují, jen stub se nahradí).

### Datový tok

```
PageEditorPage
  ├─ useParams() → slug? (undefined = new mode)
  ├─ useWorldContext() → worldId, worldSlug, world, userRole
  ├─ usePage(worldId, slug)  (jen v edit mode)
  ├─ useWorldSettings(worldId) → AKJ types, AKJ levels (z 5.3d)
  ├─ useCreatePage / useUpdatePage / useDeletePage mutace
  ├─ useUpdateAkjTypes (krok 5.3d — pro AKJ creation)
  ├─ useCreatePage (pro auto-create meta stránky AKJ)
  └─ render:
      ├─ permissions check → WorldRole >= PomocnyPJ jinak Navigate
      ├─ loading edit mode → PageEditorSkeleton
      └─ PageEditor (centralized state + panely + sticky bars)
```

## 4 — 7.2a Rich-text editor (ContentPanel)

- Reuse `RichTextEditor` ([src/shared/ui/RichTextEditor/](../../../src/shared/ui/RichTextEditor/))
- Image upload přes `useUploadContentImage` (existující hook, `POST /upload/content-image`)
- Standardní funkce: B/I/H2/H3/quote/list/link (z BubbleMenu) + tabulky přes TipTap table extension (musí existovat — TBD §10)
- **7.2g `[[wikilink]]` extension** — nový TipTap extension v `useWikilinkExtension.ts`:
  - Suggestion plugin (`@tiptap/suggestion`) zachytává `[[` typing
  - Dropdown z `usePagesDirectory(worldId)` fuzzy match (reuse `fuzzyMatch.ts` z 7.1)
  - Klik → vloží `<a href="<slug>">title</a>`
  - Esc / klik mimo = zavře
- **Draft restore modal** stejný pattern jako ArticleEditorPage:
  - `useDraftAutoSave('page-draft:{userId}:{worldId}:{pageId|new}', content)`
  - Při mount, pokud existuje draft → modal „Pokračovat s draftem?"

## 5 — 7.2b Identita stránky (IdentityPanel)

Pole:
- **Title** (string, required, max 200, MAX_TITLE konstanta)
- **Type** (select 7 hodnot — Lokace, Noviny, Seznam, Galerie, Rodokmen, Obrazovka, Ostatní)
- **Slug** (auto-gen z title přes `useSlugAutoGen`, manuálně editovatelný)
- **Hero obrázek** (URL input + upload tlačítko)
- **`bigImage`** checkbox („Velký hero nahoře místo sidebaru")
- **`isWoodWide`** checkbox („Součást Wood-Wide lore")
- **`order`** number input (sort pořadí v adresáři, default 0)

**Slug logika (useSlugAutoGen):**
- New mode: slug se aktualizuje z title přes `slugify()` **pouze pokud user slug ručně nemodifikoval**
- Po ručním edit slug zamrzne — flag `slugManuallyEdited`
- Edit mode: slug **neměníme automaticky** (změna = breaking links). Manuální edit s inline warningem („Změna slug rozbije odkazy z jiných stránek")

📚 *slugify cs-friendly: NFD diacritic fold → lowercase → mezery+nealfanum → dash → trim. Reuse v `lib/slugify.ts` (může se hodit i jinde).*

## 6 — 7.2c Datové šablony (TablePanel)

### `lib/pageTemplates.ts`

```ts
export interface PageTemplate {
  key: string;
  label: string;
  /** Pro který typ stránky relevantní. `*` = univerzální. */
  forTypes: PageType[] | '*';
  headers: string[];
  /** Volitelný defaultní popisek (placeholder). */
  description?: string;
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    key: 'stat',
    label: 'Stát',
    forTypes: ['Lokace', 'Ostatní'],
    headers: ['Hlavní město', 'Měna', 'Rozloha', 'Vláda', 'Obyvatel'],
  },
  {
    key: 'mesto',
    label: 'Město',
    forTypes: ['Lokace'],
    headers: ['Stát', 'Obyvatel', 'Vůdce', 'Specialita'],
  },
  {
    key: 'noviny',
    label: 'Noviny — vydavatelské meta',
    forTypes: ['Noviny'],
    headers: ['Stát', 'Vydavatel', 'Datum vydání', 'Číslo vydání'],
  },
  {
    key: 'projekt',
    label: 'Projekt',
    forTypes: ['Ostatní'],
    headers: ['Patron', 'Status', 'Datum zahájení', 'Cíl'],
  },
  {
    key: 'frakce',
    label: 'Frakce / Skupina',
    forTypes: ['Ostatní', 'Lokace'],
    headers: ['Vůdce', 'Sídlo', 'Počet členů', 'Filozofie'],
  },
];
```

PJ může psát i vlastní `table.headers` ručně (template = quick-start, ne povinné).

### UI

- Dropdown „Použít šablonu…" v TablePanel (filtrovaný dle aktuálního `type`)
- Klik → naplní `table.headers` + warning modal pokud už `headers.length > 0` (přepíše)
- Inline editor: 2-sloupec textových inputů (header | value), add/remove/reorder řádek (šipky ↑↓ stejně jako MenuPanel)
- `table.title` rich-text (SmartCellInput) — podporuje inline odkazy na stránky světa včetně zatím neexistujících; viewer renderuje přes `dangerouslySetInnerHTML` a `useBrokenLinks` označí broken odkazy v title
- `table.title` volitelné

## 7 — 7.2d Sekce (SectionsPanel)

- Seznam `sections[]` se sortable handlem (drag-drop reorder přes `@dnd-kit/sortable` — už používáme v 6.5)
- Per-section: `title` input, `content` RichTextEditor (mini), `items[]` (volný odrážkový list s `text`/`quantity`/`note`)
- Add/Remove tlačítka, default `isCollapsed: true` pro view
- ID generuje `crypto.randomUUID()` (browser native)

## 8 — 7.2e Přístupová práva + AKJ creation flow (AccessPanel)

### UI struktura

Sekce „Přístupová práva" obsahuje:

1. **UserId whitelist** — search input s autocomplete uživatelů světa (z `useWorldMembers`); chips s odebráním
2. **AKJ level** — dropdown s úrovněmi z `world.settings.akjTypes[]` (z `useWorldSettings`); volitelně tlačítko „+ Nový AKJ"
3. **Role** — dropdown s `WorldRole` enum (Čtenář / Hráč / Korektor / PomocnyPJ / PJ); jen 1 hodnota (min role)

Renderuje seznam aktuálních `accessRequirements[]` chips: `[type] [value]` + odebrání.

### AKJ creation modal (7.2e) — s detekcí existence

Tlačítko „+ Nový AKJ" otevře `AkjCreateModal`. Modal kombinuje **vyhledávání existujících** s **tvorbou nového**:

**Sekce 1 — Hledat existující AKJ** (nahoře):
- Searchbox `Najít AKJ podle názvu nebo úrovně…`
- Fuzzy-matchuje `world.settings.akjTypes` (reuse `fuzzyMatch.ts` z 7.1)
- Pokud match: list karet `{name} • level {N}` s tlačítkem „Použít tento"
- Klik „Použít tento" → přidá `{type: 'AKJType', value: existingKey}` do form state, zavře modal

**Sekce 2 — Vytvořit nový AKJ** (pod searchem):
- **Name** input (např. „Tajemství kruhu")
- **Level** number input (default = max existující + 1)
- **Checkbox „Vytvořit i meta stránku"** (default ✅ zapnuto)
- Tlačítko **„Vytvořit nový"** (disabled pokud name prázdné nebo collision)

**Inline detekce duplicit (live při psaní name):**
- **Exact match** (case-insensitive na `name`) → varovný banner v Sekci 2:
  „⚠️ AKJ s názvem `<name>` už existuje (level Y). Použij existující nahoře, nebo zvol jiný název."
  + tlačítko „Použít existující" jako shortcut
  + tlačítko „Vytvořit nový" se **disabled**
- **Substring match** (3+ znaků) → mírnější nápověda dole: „Možná myslíš: {name1}, {name2}…" (klikatelné chip → vybere existující)

**Submit flow „Vytvořit nový":**
1. Klient-side pre-check: pokud `name` matchuje existující exact → error toast + scroll na search (defensive — UI to už disabluje, ale guard pro race)
2. `key = slugify(name)`; pokud `world.settings.akjTypes.some(a => a.key === key)` (slug collision přes různý name s normalizací) → auto-suffix `${key}-2`, `${key}-3` (najít first free)
3. Zavolá `useUpdateAkjTypes` s rozšířeným `akjTypes[]`
4. Přidá `{type: 'AKJType', value: key}` do `accessRequirements` aktuálně editované stránky
5. Pokud checkbox → zavolá `useCreatePage`:
   ```ts
   {
     slug: `akj-${key}`,
     title: `AKJ ${name}`,
     type: 'Ostatní',
     content: `<p>Meta stránka úrovně přístupového klíče <strong>${name}</strong> (level ${level}). Doplň informace pro PJ.</p>`,
     accessRequirements: [{type: 'AKJType', value: key}],
   }
   ```
   - Pokud meta page slug už existuje (`POST` vrátí 409 `PAGE_SLUG_TAKEN`) → silent skip, toast „AKJ vytvořen, meta stránka už existovala — nevytvořena znovu"
6. Toast „AKJ vytvořen, meta stránka založena" + close modal

⚠️ **Stale state:** pokud user smaže AKJ ve WorldSettings mezi createm a save editované stránky, `accessRequirements` ukazuje na neexistující key. BE permisivně přijme (key je string); FE detekuje při dalším render a chip ukáže „⚠️ AKJ byl smazán" + možnost odebrat.

📚 *Důvod proč meta stránka i přes auto-create je `Ostatní` typ, ne nový `AKJ` typ — rozhodnuto v 7.1 brainstormingu (varianta A). Žádný nový BE enum, žádná migrace.*

### AccessPanel — primární AKJ výběr

Akj výběr v hlavním panelu (mimo modal) je rovněž primárně **dropdown existujících**:
- Select s `akjTypes[]` z `useWorldSettings`
- Sekundární tlačítko „+ Nový AKJ" otevře `AkjCreateModal`
- Tj. user nejdřív zkusí najít existující (rychlejší flow), modal je až když potřebuje opravdu nový

📚 *Pattern „existence first, creation as fallback" — minimalizuje accidentální duplicity.*

## 9 — 7.2f Auto-save (reuse z 3.2)

- `useDraftAutoSave('page-draft:{userId}:{worldId}:{pageId|new}', content, {debounceMs: 3000})`
- Restore modal pattern stejný jako [ArticleEditorPage.tsx:269](../../../src/features/ikaros/pages/ArticleEditorPage.tsx#L269)
- `clearLocalDraft()` po úspěšném BE save

⚠️ **Pozn.:** Auto-save ukládá jen `content` (TipTap HTML), ne celý form state. Ostatní pole (sections, table, …) se ztratí při refresh. Pro full-form draft by bylo potřeba serialize celého state → localStorage. **Návrh:** jen content, ostatní pole stejně musíš save manuálně. Pokud feedback → rozšíříme.

## 10 — 7.2g `[[wikilink]]` autocomplete v TipTap

`useWikilinkExtension.ts` vrací TipTap extension:

```ts
import Suggestion from '@tiptap/suggestion';
import { Extension } from '@tiptap/core';

export function createWikilinkExtension(deps) {
  return Extension.create({
    name: 'wikilink',
    addProseMirrorPlugins() {
      return [
        Suggestion({
          char: '[[',
          items: ({ query }) => fuzzyRank(deps.directory(), query, 8),
          render: () => ({...}),  // vlastní WikilinkSuggestion React render
        }),
      ];
    },
  });
}
```

Klik na položku vloží link node `<a href="<slug>">title</a>` na pozici cursor. Esc/ klik mimo zavře dropdown.

⚠️ **TBD §11:** ověřit, jestli `@tiptap/suggestion` je už v `package.json` (možná přijde z mentions v 6.x). Pokud ne, install.

## 11 — 7.2h `Ctrl/Cmd+S` save shortcut

- Globální keydown listener na editor page (mount/unmount)
- `e.preventDefault()` (prohlížeč nepokoušej se save HTML)
- Volá `handleSaveDraft()` nebo `handleSubmit()` dle current state
- Disabled když je open modal (RestoreDraft, AkjCreate, atd.)

## 12 — 7.2i Type-switch warning modal

`useTypeSwitchGuard` hook:

```ts
function useTypeSwitchGuard(currentType, nextType, state) {
  const lostData = computeLostData(currentType, nextType, state);
  // např. switch z Galerie na Lokace → galleryImages se nezobrazí
  return {
    needsConfirmation: lostData.length > 0,
    lostDataLabels: lostData,  // ['10 obrázků v galerii', '3 videa', …]
  };
}
```

Při změně `type` v IdentityPanel:
- Pokud `needsConfirmation` → otevřít `TypeSwitchWarningModal` s listem „Co se ztratí:" + Pokračovat/Zrušit
- Při Pokračovat: type se přepne (data zůstávají v memory, jen neviditelná). Při save dál existují v BE objektu. **Konzervativní default.**

🔀 *Alternativa:* při switch data **smazat** z form state. Tady volím konzervativní (zachovat, neviditelná) — pokud se PJ vrátí na původní type, data jsou tam.

## 13 — 7.2j Live preview split view

- Toggle „Náhled" v EditorTopBar (default off)
- Při on: layout se rozdělí horizontálně 50/50 — vlevo editor, vpravo viewer (`<PageViewer page={virtualPage} />`)
- `virtualPage` = current form state mappovaný na `Page` shape
- Aktualizuje se live (debounce 300ms aby TipTap typing nelagovalo)
- Mobile (<1024px): toggle skrytý, jen v desktop view

⚠️ **Důsledek:** PageViewer musí umět pracovat s ne-persisted page (no `id`, fake `createdAt`/`updatedAt`). Ověřit — props už berou Page, jen `id` může být prázdný. AKJ banner lookup v directory selže, ale to jen ne-naviguje — neproblém.

## 14 — Validace + save (lib/pageValidation.ts)

Před `useCreatePage` / `useUpdatePage`:
- `title.trim()` !== '' (required)
- `slug` matchuje regex `^[a-z0-9-]+$` (required, server taky validuje)
- `type` ∈ `ALL_PAGE_TYPES`
- `accessRequirements` neobsahuje duplicitní (UserId+value, AKJType+value, …)
- `galleryImages` URLs jsou valid (regex http(s))
- `videos` mají platný `youtubeVideoId`
- `menu` nemá prázdné labels
- `sections` nemají prázdné id/title

Error → toast + scroll na první invalid panel.

## 15 — Permissions

- Edit/Create vyžaduje `WorldRole >= PomocnyPJ` (BE `assertCanWrite` + FE guard)
- FE check v PageEditorPage: `if (userRole < PomocnyPJ) return <Navigate to=".." />` (nevidíme stránku ani pokud user trefí URL)
- WorldMembershipGuard v routeru už blokuje non-members; tady jen role escalation

## 16 — Acceptance criteria

### Z roadmapy (7.2a–f)
- [ ] `/svet/:worldSlug/nova-stranka` zobrazí prázdný editor pro PomocnyPJ+
- [ ] `/svet/:worldSlug/edit/:slug` načte existující stránku, hydrate form
- [ ] RichTextEditor + image upload + tabulky
- [ ] Identity: title, type, slug auto-gen + manual override, hero+bigImage, isWoodWide
- [ ] Datová šablona: dropdown s 5+ presets → naplní table.headers
- [ ] Sekce: add/remove/drag-reorder; per-section content + items[]
- [ ] AccessRequirements: UserId whitelist, AKJ dropdown, Role dropdown; chips display + remove
- [ ] AKJ creation modal: name+level+checkbox; po save přidá k `accessRequirements`; volitelně auto-create meta stránky `akj-<key>`
- [ ] Auto-save TipTap obsahu do localStorage, restore modal při mount
- [ ] Save vytvoří/aktualizuje stránku, naviguje na viewer
- [ ] Smazat stránku (jen edit mode) + confirm modal → redirect na list

### Rozšíření (7.2g–l)
- [ ] **7.2g** `[[` v editoru → dropdown stránek; klik vloží link
- [ ] **7.2h** `Ctrl/Cmd+S` triggeruje save (disabled v inputech/modalech)
- [ ] **7.2i** Type-switch warning modal pokud user mění type a má data jiného typu
- [ ] **7.2j** Toggle „Náhled" zobrazí live preview vedle editoru (desktop only); debounce 300ms + memo PageViewer
- [ ] **7.2k** Optimistic concurrency: PATCH posílá `expectedUpdatedAt`; BE vrací 409 PAGE_CONFLICT pokud došlo k mezitím update; FE modal „Refresh / Přepsat" — vyřešen risk souběžné editace
- [ ] **7.2l** Plný form draft do localStorage (ne jen content): sections/table/galleryImages/videos/menu/customData/accessRequirements; debounce 3s; restore modal nabízí celý draft

### AKJ existence handling (7.2e)
- [ ] AkjCreateModal má sekci „Hledat existující" s fuzzy match
- [ ] Inline detekce duplicit při psaní name (exact warn + disabled, substring nápověda)
- [ ] Slug collision auto-suffix (-2, -3) pokud `slugify(name)` koliduje
- [ ] Meta page collision (slug `akj-<key>` existuje) → silent skip + toast
- [ ] Stale AKJ chip (`accessRequirements` ukazuje na smazaný AKJ) → vizuální warning + možnost odebrat
- [ ] AccessPanel má primární dropdown existujících AKJ, modal je až sekundární

### Type-specific panely
- [ ] Galerie: editor `galleryImages[]` (add URL/upload, caption, reorder)
- [ ] Obrazovka: editor `videos[]` (YouTube URL parse, title, reorder)
- [x] Seznam: editor `menu[]` (label + PagePicker, reorder); auto-label z title vybrané stránky když je label prázdné; lze odkázat na „zatím neexistující" stránku (slug se odvodí přes `slugify`, link se spáruje po vytvoření stránky)
- [ ] Noviny: customData inputy pro Stát/Vydavatel/Datum
- [ ] Panely conditionally viditelné dle current `type`

### Crosscut
- [ ] beforeunload warning při neuložených změnách (z `useDraftAutoSave`)
- [ ] mobil-desktop audit (collapsible panely fungují na mobilu)
- [ ] napoveda update (PageEditor jako ✅, AKJ creation flow popis)

## 17 — Otevřené otázky / TBD

*Všechny TBD body z původní verze byly přesunuty do scope Fáze 0 — řeší se v rámci 7.2, ne odloženy.*

1. ✅ **`@tiptap/suggestion` package** → Fáze 0 ověření; install pokud chybí
2. ✅ **TipTap table extension** → Fáze 0 ověření; doplnit do `extensions.ts` pokud chybí
3. ✅ **`@dnd-kit/sortable`** → potvrzeno hotové (6.5)
4. ✅ **`useWorldMembers` API** → Fáze 0 ověření; vytvořit pokud chybí
5. ✅ **Image upload pro hero** → rozhodnuto: reuse `useUploadContentImage` (žádný separátní endpoint)

## 18 — Dluhy odložené

*Doplněno 2026-05-21: rizikové dluhy zařazeny do scope (7.2k, 7.2l). Zbývají jen ty, které jsou mimo MVP nebo patří do jiné fáze.*

| Dluh | Důvod | Cíl |
|---|---|---|
| Hierarchie stránek (parent-child) | BE nemá field, žádný incident | Future |
| Verzování / historie stránek | Drahé BE rozšíření, není ztráta dat | Future |
| Markdown import/export | Nice-to-have, mimo MVP | Future |
| Hromadné akce | Konzistentně s roadmapou → 7.4 admin | 7.4 |

**Vyřešené v rámci 7.2 (přesun ze starého §18):**
- ~~Konfliktní detekce~~ → **7.2k** v scope
- ~~Plný form draft~~ → **7.2l** v scope
- ~~AKJ duplicity~~ → **7.2e** rozšířen o existence handling
- ~~AKJ slug collision~~ → **7.2e** auto-suffix logika

## 19 — Závislosti

- **3.2** — RichTextEditor, useDraftAutoSave, useUploadContentImage → potvrzeno hotové
- **5.3d** — AkjType, useUpdateAkjTypes, useWorldSettings → potvrzeno hotové
- **6.5** — `@dnd-kit/sortable` → potvrzeno hotové
- **7.1** — Page types, pages.types.ts, usePage, usePagesDirectory, PageViewer (pro 7.2j live preview)
- **D-072** — BE DTO opraven o AKJType (commit `4b85edcb`) → potvrzeno hotové

---

**Stav workflow:** brainstorming hotový, **čekám na schválení této spec**. Poté: implementační plán → potvrzení → kód.
