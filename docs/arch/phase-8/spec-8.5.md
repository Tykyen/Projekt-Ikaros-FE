# Spec 8.5 — Dynamické šablony deníku (`/svet/:worldSlug/admin/sablona-deniku`)

**Stav:** 🟡 návrh k odsouhlasení (2026-05-23)
**Datum:** 2026-05-23
**Závisí na:** 8.1b (DiaryTab — view/edit dynamických bloků existuje, dnes čte jen `personalDiarySchema`), BE modul `diary-schema-versions` (jen GET endpointy — POST přidáváme v 8.5), `system-presets` (mapping `world.system` → seed schématu).

---

## 1. Cíl

PJ správa **šablony deníku světa** + per-postava override. Stránka `WorldDiarySchemaEditorPage` (nová, není stub) plně slouží jako:

1. **Editor aktivní verze schématu světa** — drag&drop bloky `stat / bar / list / text` s konfigurací (label, min/max, barva, options, layoutArea). Uložení = vytvoří novou verzi v `diary_schema_versions` (předchozí se archivuje, `world_settings.diarySchema` updatuje na novou). Inkrementuje `version`.
2. **Historie verzí** — read-only přepínač starších archivovaných verzí (jen prohlížení + „obnovit do nové verze" akce).
3. **Per-postava override** — v `DiaryTab` postavy přibude akce „Použít vlastní šablonu deníku" — zkopíruje aktivní svět-level schéma do `personalDiarySchema` postavy a otevře editor *na úrovni postavy* (sdílená komponenta).
4. **DiaryTab fallback** — pokud postava nemá `personalDiarySchema`, načti aktivní verzi schématu světa a vykresli (dnes fallback chybí, postava bez override zobrazí prázdno).
5. **BE fixy 8.5-BE-1..4** uvnitř téhož kroku — POST endpoint pro novou verzi, seed verze 1 při tvorbě světa, DTO validace pro `personalDiarySchema`, coerce `customData` na známé klíče.

**Mimo cíl:**
- Verzování `personalDiarySchema` — per-postava override není verzovaný (drží jen aktuální stav). Důvod: postava má jednoho vlastníka, history má smysl jen pro svět.
- Auto-migrace `customData` při změně schématu světa **na všech existujících postavách**. 8.5 řeší jen *coerce při čtení / zápisu* (filter unknown keys). Hromadný rebind „přejmenované klíče" = mimo MVP (D-DIARY-5).
- Validace, že `world.system` change generuje novou verzi schématu z přesetu. Dnes BE [worlds.service.ts:404-412](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L404-L412) přepisuje `world_settings.diarySchema` při změně systému; v 8.5 to napojíme na tabulku verzí (přidá verzi N+1 odvozenou z presetu).
- Nové bloky pro speciality (image, formula, computed) — out of scope, řeší D-DIARY-3.

---

## 2. Sub-úkol A — BE fixy uvnitř 8.5

### 2.1 8.5-BE-1: POST nová verze schématu (admin write)

**Problém:** [worlds.controller.ts:417-450](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/worlds/worlds.controller.ts#L417-L450) má jen GET endpointy. Admin nedokáže uložit nové schéma — celý editor je dnes nemožný.

**Změna — controller:**

```ts
@Post(':id/diary-schema-versions')
@MinWorldRole(WorldRole.PJ)
async createDiarySchemaVersion(
  @Param('id') worldId: string,
  @Body() dto: CreateDiarySchemaVersionDto,
  @CurrentUser() user,
): Promise<DiarySchemaVersion>
```

**Service — `createDiarySchemaVersion(worldId, dto, requester)`:**

1. `assertCanManage` (PJ+).
2. `lastVersion = await repo.findLastVersion(worldId)` → `version = lastVersion + 1`.
3. Aktuální `world_settings.diarySchema` (= dosud aktivní) ulož jako archivovanou verzi (`archivedAt: now()`, version = lastVersion). Pokud lastVersion === 0 (žádná tabulková verze ještě), skip archive.
4. Vytvoř novou verzi v `diary_schema_versions` s `archivedAt: null`, `version = lastVersion + 1`, `schema = dto.schema`, `system = world.system`.
5. Update `world_settings.diarySchema = dto.schema` (live aktivní).
6. Return novou verzi.

**DTO:**

```ts
export class SchemaBlockDto {
  @IsString() @IsNotEmpty() key: string;
  @IsString() @IsNotEmpty() label: string;
  @IsString() @IsIn(['stat', 'bar', 'list', 'text', 'number', 'textarea']) type: string;
  @IsOptional() @IsObject() config?: Record<string, unknown>;
  @IsInt() @Min(0) order: number;
  @IsOptional() @IsString() layoutArea?: string;
}

export class CreateDiarySchemaVersionDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => SchemaBlockDto)
  @ArrayMaxSize(50) schema: SchemaBlockDto[];
}
```

**Pozn. ke `type`:** dnes presety drží jen `number | text | textarea`. UI editor používá vyšší úroveň názvu „stat / bar / list / text". Mapování:

| UI label | BE `type` | Význam |
|----------|-----------|--------|
| Statistika | `number` (případně `stat`) | celé / desetinné číslo |
| Pruh (HP/Energie) | `bar` | progress bar s `min`, `max`, `color` |
| Seznam | `list` | enum (jeden z `options[]`) |
| Text | `text` / `textarea` | krátký / dlouhý text |

DTO `@IsIn` whitelistuje všech 6 (BE backwards compat se `number`, `text`, `textarea` z presetů; nové `stat`, `bar`, `list` z UI). FE pro render používá `block.type` přes switch.

### 2.2 8.5-BE-2: Seed verze 1 při tvorbě světa

[worlds.service.ts:332-336](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L332-L336) ukládá preset.schema **jen do `world_settings`**, tabulka `diary_schema_versions` zůstane prázdná. Po tvorbě nového světa `GET /worlds/:id/diary-schema-versions` vrátí `[]`, ale aktivní schéma existuje. Inkonzistence.

**Změna v `worlds.service.createWorld`:**

```ts
const preset = this.systemPresetsService.findOne(world.system);
const schema = preset?.schema ?? [];
await this.settingsRepo.upsert(world.id, { diarySchema: schema });
await this.diaryVersionsRepo.create({
  worldId: world.id,
  version: 1,
  system: world.system,
  schema,
  archivedAt: null,
});
```

Stejné při změně `world.system` ([worlds.service.ts:404-412](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L404-L412)) — nový preset = nová verze. **Důvod:** PJ vidí historii „svět přepnut z DrD na D&D" jako verze.

### 2.3 8.5-BE-3: PATCH `/diary` DTO + `personalDiarySchema` validace

[character-subdocs.controller.ts:53-69](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/character-subdocs/character-subdocs.controller.ts#L53-L69) přijímá `Record<string, unknown>` bez validace. PJ může submit-nout cokoliv, dnes BE nic nekontroluje. Pro `personalDiarySchema` chceme stejnou validaci jako pro svět-level schéma.

**Změna:**

```ts
export class CustomDiaryBlockDto {
  @IsString() id: string;
  @IsString() @IsIn(['stat','bar','list','text','number','textarea']) type: string;
  @IsString() label: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() maxValue?: number;
  @IsOptional() @IsNumber() minValue?: number;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) options?: string[];
  @IsInt() @Min(0) order: number;
  @IsOptional() @IsString() layoutArea?: string;
}

export class UpdateCharacterDiaryDto {
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CustomDiaryBlockDto)
  @ArrayMaxSize(50) personalDiarySchema?: CustomDiaryBlockDto[];
  @IsOptional() @IsObject() customData?: Record<string, unknown>;
  @IsOptional() @IsArray() sections?: PageSectionDto[]; // sjednotit s 7.x
}
```

Controller signatura `@Body() dto: UpdateCharacterDiaryDto`. Service downstream beze změny (přijme typed objekt místo plain record).

### 2.4 8.5-BE-4: Coerce `customData` na známé klíče (čtení i zápis)

**Problém:** [character-diary.repository.ts:76](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/character-subdocs/repositories/character-diary.repository.ts#L76) vrací `customData` jak je. Pokud admin smaže blok `staminaMax` ze schématu, hodnota zůstane v DB navždy → bloat + možné konflikty při budoucím re-add bloku se stejným `id` ale jiným `type`.

**Změna v service `updateDiary`:**

1. Načti aktuální `personalDiarySchema` (po update — když ho update nese, použij ho; jinak existující z DB).
2. Pokud `personalDiarySchema` chybí, načti aktivní verzi schématu světa.
3. Sestav `allowedKeys = schema.map(b => b.id ?? b.key)`.
4. Filtruj `customData` — `Object.fromEntries(Object.entries(payload.customData ?? {}).filter(([k]) => allowedKeys.includes(k)))`.
5. Při čtení (`getDiary`) — stejný filter aplikuj na response, ne na DB write. Důvod: nondestruktivní — pokud admin omylem smaže blok a hned ho vrátí, hodnoty se vrátí. Permanentní vyčištění = explicit endpoint (mimo MVP).

**Důvod read-side filter:** UI tak nikdy nedostane "duch" klíče. Render čistý.

### 2.5 BE testy

`diary-schema-versions.service.spec.ts` (rozšířit):

- ✅ `createDiarySchemaVersion` — first call (no prior) vytvoří verzi 1, `archivedAt: null`.
- ✅ `createDiarySchemaVersion` — druhý call → verze 2 active, verze 1 dostane `archivedAt`.
- ✅ `createDiarySchemaVersion` — non-PJ → `ForbiddenException`.
- ✅ DTO validace — `type: 'invalid'` → 400.
- ✅ DTO validace — schema array > 50 → 400.

`worlds.service.spec.ts`:

- ✅ `createWorld` — `diaryVersionsRepo.create` byl volán s verzí 1 a preset schématem.
- ✅ Změna `world.system` (update) → další verze v tabulce.

`character-subdocs.service.spec.ts`:

- ✅ `updateDiary` filter `customData` odřízne unknown klíče.
- ✅ `updateDiary` přijme `personalDiarySchema` v DTO.
- ✅ `getDiary` read-side filter — DB má extra klíče, response je nemá.

---

## 3. Sub-úkol B — FE typy + API hooks

### 3.1 Typy

`src/features/world/pages/api/diarySchema.types.ts` (nový):

```ts
export type DiaryBlockType = 'stat' | 'bar' | 'list' | 'text' | 'number' | 'textarea';

export interface DiaryBlockConfig {
  description?: string;
  minValue?: number;
  maxValue?: number;
  color?: string;
  options?: string[];
  layoutArea?: string;
}

export interface DiarySchemaBlock {
  key: string;            // identifikátor (slug), unique v schématu
  label: string;          // viditelný název
  type: DiaryBlockType;
  config?: DiaryBlockConfig;
  order: number;
}

export interface DiarySchemaVersion {
  id: string;
  worldId: string;
  version: number;
  system: string;
  schema: DiarySchemaBlock[];
  archivedAt: string | null;
  createdAt: string;
}

export interface DiarySchemaVersionMeta {
  version: number;
  system: string;
  archivedAt: string | null;
  createdAt: string;
}
```

`CustomDiaryBlock` v `characters.types.ts` zůstává — to je „rozbalený" tvar bloku na úrovni postavy s flatten config. Pro **postavu** rendrujeme `CustomDiaryBlock`, pro **svět** `DiarySchemaBlock`. Mapper `flattenSchemaBlock(block: DiarySchemaBlock): CustomDiaryBlock` + `nestCustomBlock(block: CustomDiaryBlock): DiarySchemaBlock`.

### 3.2 Hooks

`src/features/world/pages/api/`:

| Hook | Endpoint | Klíč | Invalidace |
|------|----------|------|------------|
| `useDiarySchemaVersions(worldId)` | `GET /worlds/:id/diary-schema-versions` | `['diary-schema', worldId, 'list']` | — |
| `useDiarySchemaVersion(worldId, version)` | `GET /worlds/:id/diary-schema-versions/:version` | `['diary-schema', worldId, version]` | — |
| `useActiveDiarySchema(worldId)` | derived: poslední verze podle `version DESC`, `archivedAt === null` z listu | `['diary-schema', worldId, 'active']` (computed) | — |
| `useCreateDiarySchemaVersion(worldId)` | `POST /worlds/:id/diary-schema-versions` | — | `['diary-schema', worldId, '*']` |
| `useUpdatePersonalDiarySchema(worldId, slug)` | `PATCH /worlds/:id/characters/:slug/diary` (body: `{ personalDiarySchema }`) | — | `['character-diary', worldId, slug]` |
| `useResetPersonalDiarySchema(worldId, slug)` | `PATCH .../diary` (body: `{ personalDiarySchema: null }`) | — | `['character-diary', worldId, slug]` |

`useActiveDiarySchema` je tenká utilita nad `useDiarySchemaVersions` — neudělá vlastní fetch, čte z cache list a vybere aktivní. To kombinujeme s `useDiarySchemaVersion(worldId, activeVersion)` pro plný detail.

### 3.3 Validace

Vstup do `useCreateDiarySchemaVersion`:
- `schema.length <= 50`.
- Každý blok: `label.trim() != ''`, `key.trim() != ''`, `key` matchuje `/^[a-z][a-z0-9_]*$/` (slug).
- `key` unikátní v rámci schématu (FE-side check; BE má unique index per kolekci, ne per pole).
- `type` v whitelistu.
- `config.options` (pro `list`) — neprázdné, ≥ 2 položky.
- `config.maxValue > minValue` (pro `bar` i `stat`).
- `order` sekvenční 0..n-1 (FE auto-fix při submit).

---

## 4. Sub-úkol C — UI: `WorldDiarySchemaEditorPage`

### 4.1 Cesta + route

Route `/svet/:worldSlug/admin/sablona-deniku` — nová, přidat do [src/app/router.tsx](src/app/router.tsx) pod sekci ADMINISTRACE světa (vedle `adresar-postav`).

Guard: `WorldMembershipGuard minWorldRole=PJ + fallbackGlobalRoles=[Sa, Admin]` (stejný pattern jako 8.4 NPCDirectoryPage).

Lazy import.

Struktura:

```
src/features/world/pages/WorldDiarySchemaEditorPage/
  index.ts
  WorldDiarySchemaEditorPage.tsx
  WorldDiarySchemaEditorPage.module.css
  api/
    useDiarySchemaVersions.ts
    useDiarySchemaVersion.ts
    useCreateDiarySchemaVersion.ts
  components/
    DiarySchemaEditor.tsx       # sdíleno se per-postava editorem
    DiarySchemaEditor.module.css
    BlockRow.tsx                # jeden blok v drag listu
    BlockConfigPanel.tsx        # pravý panel s editem aktivního bloku
    SchemaVersionPicker.tsx     # přepínač verzí (history)
    SchemaPreview.tsx           # live preview
  utils/
    schemaMappers.ts            # flatten / nest mezi DiarySchemaBlock × CustomDiaryBlock
    schemaValidation.ts
  __tests__/
    DiarySchemaEditor.spec.tsx
    schemaMappers.spec.ts
```

### 4.2 Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Šablona deníku světa            v3 (aktivní) ▾   [+ Nová verze]│
│                                                                   │
│ ┌──── Bloky ─────┐   ┌──── Konfigurace ────┐   ┌── Náhled ─────┐ │
│ │ ⋮⋮ Síla   stat │   │  Label: Síla         │   │ ❤️ HP    [50] │ │
│ │ ⋮⋮ HP     bar  │←  │  Klíč:  sila         │   │ 🛡 Zbroj [3]  │ │
│ │ ⋮⋮ Zbroj  stat │   │  Typ:   stat ▾       │   │ 💪 Síla  [12] │ │
│ │ ⋮⋮ Stav   list │   │  Min: 0   Max: 30    │   │ Stav: živý ▾  │ │
│ │ + Přidat blok  │   │  Popis: ...          │   │ ...           │ │
│ └────────────────┘   │  [Smazat blok]       │   └───────────────┘ │
│                      └──────────────────────┘                     │
│                                                                   │
│ [ Zrušit ]                            [ Uložit jako verzi 4 ]    │
└──────────────────────────────────────────────────────────────────┘
```

### 4.3 Editor stavu — dvouvrstvý

- **Načtený stav** = data z poslední aktivní verze (read-only reference, pro diff hlášku „Žádné změny" disabled submit).
- **Pracovní stav** = lokální editovaná kopie (`useState<DiarySchemaBlock[]>`). Submit → `useCreateDiarySchemaVersion`.

Dirty detekce: deep-equal mezi načteným a pracovním stavem. Pokud `false` → submit disabled + tooltip „Žádné změny".

Při kliknutí na verzi v historii (která není aktivní): editor přepne do **read-only** módu, panel konfigurace nezobrazuje editovatelná pole; submit nahradí akce „Obnovit jako verzi N+1" (= zkopíruje schéma archivované verze do pracovního stavu a přepne na aktivní mode).

### 4.4 Drag & drop pořadí bloků

Stejný pattern jako 8.4 D-NPC-2 (HTML5 native drag, žádná dep):

```tsx
<div draggable onDragStart={...} onDragOver={...} onDrop={...}>
  <GripVertical /> {block.label} <Chip>{block.type}</Chip>
</div>
```

Klávesnice: `ArrowUp / ArrowDown` na focused grip posouvá pozici. `Enter` aktivuje blok do `BlockConfigPanel`.

### 4.5 BlockConfigPanel — editor aktivního bloku

Pole podle `block.type`:

| Pole | Typy | Validace |
|------|------|----------|
| Label | všechny | trim required |
| Klíč (slug) | všechny | trim required, regex `^[a-z][a-z0-9_]*$`, unique |
| Typ | všechny | enum `DiaryBlockType` |
| Popis | všechny | volitelný textarea |
| Min / Max | `stat`, `bar`, `number` | čísla, max > min |
| Barva | `bar` | color picker, default `--accent` |
| Options | `list` | dynamický seznam stringů, ≥ 2 |
| Layout area | všechny | volitelný text input (např. „statistiky", „dovednosti") — UI v rendereru postavy seskupí bloky podle layoutArea |

Akce: `[Smazat blok]` (hard-remove z pracovního stavu, ne BE).

### 4.6 SchemaPreview

Renderuje pracovní stav stejným kódem jako `DiaryTab` view (komponenta `DiaryBlockView`). Reuse:

- Extract `DiaryBlockView` z `DiaryTab.tsx` do samostatného `components/DiaryBlockView.tsx` v shared `CharacterDetailPage/components/` → impotrovatelné odjinud.
- V preview hodnoty bloků dummy: number `0`, list `options[0]`, bar `min`, text `'…'`.

Drobný shim — preview přijímá `DiarySchemaBlock[]`, ne `CustomDiaryBlock[]`. Mapper `flattenSchemaBlock` v `utils/schemaMappers.ts`.

### 4.7 SchemaVersionPicker

Dropdown nahoře vpravo:

```
v3 (aktivní)       — 2026-05-23
v2 (archivováno)   — 2026-05-12
v1 (archivováno)   — 2026-05-01
```

Click → načte detail (`useDiarySchemaVersion`) → editor přepne na read-only s tlačítkem „Obnovit jako novou verzi".

### 4.8 Akce „+ Nová verze"

Aktuálně **NEzakládá** prázdnou verzi — pouze odemkne editor (pokud byl read-only z historie). Save submitne `POST` s pracovním stavem; verze se inkrementuje serverem.

Pokud schéma ještě neexistuje (po seed bug fix už nemůže nastat, ale defensive): tlačítko `[ + Nová verze ]` vytvoří první verzi z empty pole.

### 4.9 Stavy stránky

- **Loading** (list verzí): skeleton.
- **Error** (oba fetche nezávisle): inline error + retry.
- **Empty schema** (= dvě verze s prázdným `schema: []`): hláška „Šablona deníku zatím nemá žádné bloky." + CTA `[+ Přidat blok]`.
- **Po úspěšném save**: toast `Šablona uložena jako verze N` → invalidace list → editor zobrazuje novou verzi jako aktivní.

### 4.10 Mobile

- Tři sloupce kolabují vertikálně na ≤ 768px (Bloky → Konfigurace → Náhled).
- Drag&drop na touch — `pointerdown` + `pointermove` (HTML5 drag na mobilu omezený). Fallback: `▲ ▼` šipky na řádku bloku pro mobil. Detekce přes `matchMedia('(hover: none)')`.
- `BlockConfigPanel` na mobilu jako bottom sheet (fixed `position: fixed; bottom: 0; height: 60vh`).
- `mobil-desktop` audit po implementaci.

---

## 5. Sub-úkol D — Per-postava override v `DiaryTab`

### 5.1 Fallback čtení

[DiaryTab.tsx:58](src/features/world/pages/CharacterDetailPage/components/DiaryTab.tsx#L58) — `blocks = diary.personalDiarySchema ?? []`.

**Změna:**

```ts
const { data: activeSchema } = useActiveDiarySchema(worldId);
const blocks = (diary.personalDiarySchema ?? activeSchema?.schema.map(flattenSchemaBlock) ?? []).sort(...);
const isOverride = diary.personalDiarySchema != null;
```

`isOverride` zobrazí banner: „Tato postava používá vlastní šablonu deníku."

### 5.2 Akce na DiaryTab v edit módu

Nová sekce **Šablona deníku** v `DiaryTabEdit` (nahoře, nad sekcemi):

- Pokud `isOverride === false`: tlačítko `[ ✏️ Vlastní šablona ]` → confirm modal „Zkopíruje aktuální šablonu světa do této postavy. Postava poté nebude reagovat na změny šablony světa, dokud override nezrušíš." → na confirm: `useUpdatePersonalDiarySchema(worldId, slug)` s kopií `activeSchema`.
- Pokud `isOverride === true`: dva chips „🔓 Vlastní šablona aktivní" + tlačítka:
  - `[ ✏️ Upravit ]` → otevře `DiarySchemaEditorModal` (sdílená komponenta `DiarySchemaEditor` v modal wrapperu) s pracovním stavem = personalDiarySchema. Save → `useUpdatePersonalDiarySchema`.
  - `[ ↺ Vrátit ke světové ]` → confirm „Smaže vlastní šablonu, deník se vrátí k šabloně světa." → `useResetPersonalDiarySchema` (PATCH s `personalDiarySchema: null`).

### 5.3 Sdílená komponenta `DiarySchemaEditor`

```tsx
interface Props {
  value: DiarySchemaBlock[];
  onChange: (next: DiarySchemaBlock[]) => void;
  readOnly?: boolean;
  context: 'world' | 'character';   // jen pro popisek banneru
}
```

Layout 3-sloupcový jako §4.2, ale bez `SchemaVersionPicker` (per-postava override není verzovaný). Mode `'character'` skryje akci „Uložit jako verzi N+1" — místo toho použije onChange handover na rodiče (DiaryTab modal wrapper). Modal wrapper drží submit/cancel buttony.

---

## 6. Sub-úkol E — Sdílení `DiaryBlockView`

[DiaryTab.tsx:75-82](src/features/world/pages/CharacterDetailPage/components/DiaryTab.tsx#L75-L82) — `DiaryBlockView` je dnes lokální. Extrahovat do `src/features/world/pages/CharacterDetailPage/components/DiaryBlockView.tsx` (export named) → reuse v `SchemaPreview` (8.5) i v původním `DiaryTabView`.

Aby preview nemusel obsahovat `CharacterDiary` (= dummy data + schema mix), `DiaryBlockView` přijímá:

```tsx
interface DiaryBlockViewProps {
  block: CustomDiaryBlock;
  value: unknown;          // dummy v preview
}
```

Žádná breaking změna, jen přesun export + import path.

---

## 7. Routing + Guards

`router.tsx` — nový lazy import:

```ts
const WorldDiarySchemaEditorPage = lazy(
  () => import('@/features/world/pages/WorldDiarySchemaEditorPage'),
);
```

Route (vedle `adresar-postav`):

```tsx
{
  path: 'admin/sablona-deniku',
  element: (
    <WorldMembershipGuard minWorldRole={WorldRole.PJ} fallbackGlobalRoles={[UserRole.Sa, UserRole.Admin]}>
      <WorldDiarySchemaEditorPage />
    </WorldMembershipGuard>
  ),
}
```

Vstup z [src/app/layout/WorldLayout/WorldLayout.tsx](src/app/layout/WorldLayout/WorldLayout.tsx) — přidat nav položku do ADMINISTRACE sekce pro PJ+ — „Šablona deníku" (ikona `BookText` z lucide).

---

## 8. Mobile / Desktop

`mobil-desktop` skill po implementaci:

- Třípanelový editor → vertikální stack na ≤ 768px (Bloky / Konfigurace bottom sheet / Náhled pod blocky).
- Drag handle touch-friendly (≥ 40 × 40 px hit area).
- `▲ ▼` šipky pro mobil (fallback drag).
- `BlockConfigPanel` bottom sheet s `60vh` výšku + swipe down zavřít.
- `SchemaPreview` na mobilu pod editorem, ne vedle.
- Per-postava editor v `DiaryTab` jako full-screen modal na mobile.

---

## 9. Testy

**FE:**

| Soubor | Případy |
|--------|---------|
| `useDiarySchemaVersions.spec.ts` | fetch, cache klíč, derived `useActiveDiarySchema` |
| `useCreateDiarySchemaVersion.spec.ts` | success + invalidace, chyba |
| `useUpdatePersonalDiarySchema.spec.ts` | success, reset (null), invalidace `character-diary` |
| `schemaMappers.spec.ts` | flatten + nest round-trip, edge cases (chybí config) |
| `schemaValidation.spec.ts` | duplicate key, invalid regex, list bez options, max < min |
| `DiarySchemaEditor.spec.tsx` | add block, remove block, reorder (drag mock + keyboard), edit config, validace |
| `WorldDiarySchemaEditorPage.spec.tsx` | empty state, version picker → read-only, save flow, dirty check |
| `DiaryTab.spec.tsx` (rozšířit) | fallback na svět-level schéma, akce „Vlastní šablona", reset override |
| `BlockConfigPanel.spec.tsx` | render dle type, validace inputs |
| `SchemaPreview.spec.tsx` | render dummy data z různých typů bloků |

**BE:** viz §2.5.

---

## 10. Otevřené body / D-rozhodnutí (Auto Mode defaulty)

- **D1:** Editor schématu světa je **dedikovaná stránka** `/admin/sablona-deniku`, ne modal. Důvod: 3-panelový layout potřebuje šířku + persistent URL pro deep-link na verzi. Per-postava override je modal (méně časté, krátké editace).
- **D2:** Verzování je **monotónně rostoucí** (`version DESC`). Žádné větvení (branchování) ani merge. PJ může „obnovit verzi 1 jako verzi 5" — zkopíruje schéma, verze 5 se stane aktivní.
- **D3:** Per-postava override **není verzovaný**. Drží jen aktuální stav. Důvod: malá rate změn, jeden vlastník, history nemá business value. Pokud chce PJ rollback → vrátí postavu na svět-level + znovu klikne „Vlastní šablona" (= nový clone aktuální verze).
- **D4:** `customData` keys jsou identifikovány přes `block.key` (= slug). Při renamu bloku **se hodnota neztratí**, ale **přemapuje se** — bloky mají stabilní `id` (UUID v `CustomDiaryBlock`) a `key` separátně. UI generuje `key` ze `label` jen při create; rename labelu nemění `key`. Pro svět-level `DiarySchemaBlock` nemáme dnes `id`, jen `key` — **musíme přidat** `id?: string` (volitelně, BE backwards compat) a frontend ho generuje při create bloku. Bez `id` rename `key` = nový blok (stará data se ztratí filterem 8.5-BE-4). Toto je **trade-off** — UI ho ošetří hláškou „Změna klíče smaže existující data postav" + confirm dialog.
- **D5:** Defaultní `type` při add-block = `stat`. Defaultní `config` = `{ minValue: 0, maxValue: 100 }` pro stat/bar/number. List default `options: ['Volba A', 'Volba B']`.
- **D6:** `system-presets` mapping → `block.type`. Dnes preset má jen `number/text/textarea`. Nové `stat/bar/list` se v BE seedu nevyrobí, ale admin je může přidat ručně přes editor. Roadmapa zmiňuje „stat/bar/list/text" → tyto 4 typy v UI. `number/textarea` z presetů zůstávají kompatibilní (mapping `number → stat`, `textarea → text`).
- **D7:** Layout area = volitelný free-text grouping. Renderer postavy seskupí bloky se stejným `layoutArea` do jedné sekce. Bez area = sekce „Atributy" (default). Žádné předdefinované labelované areas — flexibilita pro PJ.
- **D8:** Sdílená `DiarySchemaEditor` komponenta používaná v 2 kontextech (world page, character modal) — props `context: 'world' | 'character'` + `readOnly`. Žádné kompozice subkomponent přes children, jeden orchestrátor.

---

## 11. Tracked dluhy (po implementaci → `dluh.md`)

- **D-DIARY-1:** Hromadná migrace `customData` napříč postavami při rename `key` bloku ve schématu světa (8.5 to neřeší — řeší jen na úrovni filtru read/write).
- **D-DIARY-2:** Bulk-update `personalDiarySchema` přes všechny postavy ve světě (admin akce „aplikovat aktuální šablonu světa na všechny postavy a smazat všechny overrides"). Out of scope, ale užitečné pro PJ při velké změně schématu.
- **D-DIARY-3:** Nové typy bloků — `image`, `formula` (computed value), `relation` (link na jinou postavu). Out of scope, design později.
- **D-DIARY-4:** Diff viewer mezi verzemi schématu („verze 3 vs 2: + Stamina, − Mana, label Síla → Strength").
- **D-DIARY-5:** Auto-rename detekce — když admin přejmenuje `key` v editoru, FE nabídne „Přejmenovat existující hodnoty z `staminaMax` na `endurance` na N postavách?" Out of scope (komplexní migrace).
- **D-DIARY-6:** Export / import schématu jako JSON soubor (sdílení schémat mezi světy ručně).

---

## 12. EXTENDED scope — všechny dluhy uvnitř 8.5? (rozhodnutí uživatele)

Vzor 8.4 měl explicitní extension „uživatel řekl vše do scope". Pro 8.5 **default zůstává:** dluhy D-DIARY-1..6 mimo scope, řeší jen §1 cíle + §2 BE fixy + §3-7 FE work.

Pokud uživatel řekne „všechny dluhy do scope" → D-DIARY-1, D-DIARY-2, D-DIARY-4, D-DIARY-6 jsou rozumně dosažitelné (D-DIARY-3 = nové typy bloků a D-DIARY-5 = komplexní migrace zůstávají out of scope i v extended).

---

## 13. Akceptační kritéria (definition of done)

- [ ] BE 8.5-BE-1 — `POST /worlds/:id/diary-schema-versions` (PJ+), archivuje předchozí + inkrementuje verzi
- [ ] BE 8.5-BE-2 — `createWorld` + system change vytváří verzi v tabulce
- [ ] BE 8.5-BE-3 — `UpdateCharacterDiaryDto` s validací `personalDiarySchema`
- [ ] BE 8.5-BE-4 — `customData` coerce filter (read + write)
- [ ] FE typy + hooks v `api/diarySchema.types.ts` + 6 hook souborů
- [ ] `WorldDiarySchemaEditorPage` s 3-panelovým editorem, drag&drop pořadí, version picker, save flow
- [ ] `DiarySchemaEditor` sdílená mezi world page + character modal
- [ ] `DiaryTab` fallback na aktivní svět-level schéma (postava bez override)
- [ ] `DiaryTab` akce „Vlastní šablona" + „Vrátit ke světové" + edit modal
- [ ] `DiaryBlockView` extrahováno do shared komponenty (reuse v preview)
- [ ] Route `/svet/:worldSlug/admin/sablona-deniku` + nav v `WorldLayout` ADMINISTRACE
- [ ] FE testy zelené (§9)
- [ ] BE testy zelené (§2.5)
- [ ] `mobil-desktop` audit splněn (3-panel → vertikální stack, drag fallback)
- [ ] `napoveda` skill spuštěn — nová stránka pro PJ (`/ikaros/napoveda`) + sekce „Role a oprávnění" (PJ může editovat schéma deníku světa)
- [ ] `docs/roadmap-fe.md` 8.5 zaškrtnuto, `dluh.md` doplněn (§11)
