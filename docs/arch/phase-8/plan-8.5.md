# Plán 8.5 — Dynamické šablony deníku (EXTENDED scope)

> **Stav:** návrh — Auto Mode pokračuje • **Datum:** 2026-05-23
> Spec: [spec-8.5.md](spec-8.5.md)
> Workflow: spec ✅ → **plán (zde)** → kód
> Scope rozhodnutí: extended ANO (D-DIARY-1/2/4/6 do scope; D-DIARY-3 nové typy bloků a D-DIARY-5 auto-rename migrace zůstávají mimo)

---

## 0. Zjištění z auditu (vstup do plánu)

| # | Zjištění | Dopad |
|---|---|---|
| Z-1 | BE `diary-schema-versions` má JEN GET endpointy (`worlds.controller.ts:417-450`). Žádný POST. | B1 = nový POST endpoint + service `createDiarySchemaVersion`. |
| Z-2 | `createWorld` ukládá `preset.schema` jen do `world_settings.diarySchema`, tabulku verzí nechá prázdnou (`worlds.service.ts:332-336`). | B2 = `diaryVersionsRepo.create()` při createWorld + system change. |
| Z-3 | PATCH `/diary` přijímá `Record<string, unknown>` bez DTO (`character-subdocs.controller.ts:53-69`). | B3 = `UpdateCharacterDiaryDto` s nested validací `personalDiarySchema`. |
| Z-4 | `customData` nikdy nedrops klíče smazaných bloků — DB bloat. | B4 = `coerceCustomData` filter v service `updateDiary` + `getDiary`. |
| Z-5 | `DiaryTab.tsx:58` čte `diary.personalDiarySchema ?? []` — žádný fallback na svět-level. Postava bez override = prázdný deník. | F8 = `useActiveDiarySchema` + fallback v DiaryTab. |
| Z-6 | `DiaryBlockView` je lokální komponenta v DiaryTab.tsx — nelze reuse v preview. | F6 = extrahovat do `components/DiaryBlockView.tsx` (named export). |
| Z-7 | `SchemaBlock` BE má `key, label, type, config, order` — nemá `id`. `CustomDiaryBlock` (character-diary) má `id` (UUID). | F2 = na FE `DiarySchemaBlock` přidá `id?: string` (volitelný, BE neuloží — UI ho generuje pro stable reference). |
| Z-8 | Presety dnes obsahují jen `number / text / textarea`. UI rozšiřujeme o `stat / bar / list`. Mapping v rendereru. | F2/F6 = switch case ošetří všech 6 typů. |
| Z-9 | Route `/svet/:worldSlug/admin/*` existuje pattern (8.4 adresar-postav). | F11 = `sablona-deniku` route přidá vedle. |
| Z-10 | `WorldLayout.tsx` má sekci ADMINISTRACE — 8.4 tam přidal položky. | F11 = nav item „Šablona deníku" (BookText ikona). |
| Z-11 | `Tabs`, `ConfirmDialog`, `Modal`, `Input`, `Button`, `Badge` jsou v `shared/ui`. | Reuse, žádné nové sdílené UI. |
| Z-12 | BE má uncommitted změny v `character-subdocs` (mentioned v 8.4 planu Z-11). Před commitem 8.5 BE změn ověřit stav. | Commit BE musí stage **jen** `diary-schema-versions/`, `worlds/`, `character-subdocs/` soubory měněné v 8.5. |
| Z-13 | `system-presets` má seed `dnd5e.preset.ts` + další. Při system change BE už schéma přepíše — jen ho musíme i verzovat. | B2 covered. |

---

## 1. Pořadí implementace

```
B1  BE: POST /worlds/:id/diary-schema-versions + service createDiarySchemaVersion
B2  BE: seed verze 1 v createWorld + dotrz na změnu world.system
B3  BE: UpdateCharacterDiaryDto + nested CustomDiaryBlockDto
B4  BE: coerceCustomData filter (read + write)
B5  BE: extended D-DIARY-1/2 — service helpers (bulk reset overrides, key remap utility)
B6  BE: testy (createVersion happy + archive, createWorld seed, DTO validace, customData filter)
─── commit BE ───
F1  FE: typy diarySchema.types.ts + extend characters.types
F2  FE: utils schemaMappers (flatten/nest) + schemaValidation
F3  FE: API hooks (6 hooks: list, version, active, create, updatePersonal, resetPersonal)
F4  FE: extrakce DiaryBlockView → samostatná komponenta
F5  FE: DiarySchemaEditor sdílená komponenta (3-panel)
F6  FE: BlockRow + BlockConfigPanel + SchemaPreview + SchemaVersionPicker
F7  FE: WorldDiarySchemaEditorPage (orchestrátor, save flow, version picker)
F8  FE: DiaryTab — fallback + override akce + DiarySchemaEditorModal
F9  FE: route + nav v WorldLayout
F10 FE: extended — diff viewer (D-DIARY-4) + bulk reset action (D-DIARY-2) + JSON export/import (D-DIARY-6)
F11 FE: testy
F12 mobil-desktop audit + napoveda + roadmap + dluh.md
─── commit FE ───
```

---

## 2. BE kroky (B1–B6)

Repo: `C:\Matrix\ProjektIkaros\Projekt-ikaros\backend` (main).
Stage explicitně jen soubory měněné v 8.5 (worlds/, character-subdocs/, případně systemPresets pokud rozšíříme).

### B1 — POST `/worlds/:id/diary-schema-versions`

Soubory:
- `src/modules/worlds/dto/create-diary-schema-version.dto.ts` (NEW)
- `src/modules/worlds/diary-schema-versions/diary-schema-versions.repository.ts` (existuje — případně doplnit `archive(id)`)
- `src/modules/worlds/worlds.service.ts` (přidat `createDiarySchemaVersion(worldId, dto, requester)`)
- `src/modules/worlds/worlds.controller.ts` (přidat `@Post(':id/diary-schema-versions')`)

DTO:
```ts
export class SchemaBlockDto {
  @IsString() @IsNotEmpty() key: string;
  @IsString() @IsNotEmpty() label: string;
  @IsString() @IsIn(['stat','bar','list','text','number','textarea']) type: string;
  @IsOptional() @IsObject() config?: Record<string, unknown>;
  @IsInt() @Min(0) order: number;
  @IsOptional() @IsString() layoutArea?: string;
  @IsOptional() @IsString() id?: string;  // stable UUID (volitelný)
}

export class CreateDiarySchemaVersionDto {
  @IsArray() @ArrayMaxSize(50)
  @ValidateNested({ each: true }) @Type(() => SchemaBlockDto)
  schema: SchemaBlockDto[];
}
```

Service logika:
```ts
async createDiarySchemaVersion(worldId, dto, requester) {
  await this.assertCanManage(worldId, requester);  // PJ+
  const world = await this.repo.findById(worldId);
  const last = await this.diaryVersionsRepo.findLastVersion(worldId);
  const newVersion = last + 1;

  // archivace aktuální aktivní (pokud existuje)
  if (last > 0) {
    await this.diaryVersionsRepo.archive(worldId, last);  // updateOne archivedAt: now
  }

  const created = await this.diaryVersionsRepo.create({
    worldId, version: newVersion, system: world.system,
    schema: dto.schema, archivedAt: null,
  });
  await this.settingsRepo.upsert(worldId, { diarySchema: dto.schema });
  return created;
}
```

Repo `archive(worldId, version)`:
```ts
return this.model.updateOne({ worldId, version }, { archivedAt: new Date() });
```

Controller:
```ts
@Post(':id/diary-schema-versions')
async createDiarySchemaVersion(
  @Param('id') worldId, @Body() dto: CreateDiarySchemaVersionDto, @CurrentUser() user,
) {
  return this.worldsService.createDiarySchemaVersion(worldId, dto, user);
}
```

### B2 — Seed verze 1 + system change

`worlds.service.ts:createWorld` (kolem 332-336):
```ts
const preset = this.systemPresetsService.findOne(world.system);
const schema = preset?.schema ?? [];
await this.settingsRepo.upsert(world.id, { diarySchema: schema });
await this.diaryVersionsRepo.create({
  worldId: world.id, version: 1, system: world.system,
  schema, archivedAt: null,
});
```

`worlds.service.ts:updateWorld` (kolem 404-412 kde se hraje s system change) — po `settingsRepo.upsert({ diarySchema })` přidat:
```ts
const last = await this.diaryVersionsRepo.findLastVersion(world.id);
if (last > 0) await this.diaryVersionsRepo.archive(world.id, last);
await this.diaryVersionsRepo.create({
  worldId: world.id, version: last + 1, system: nextSystem,
  schema: nextSchema, archivedAt: null,
});
```

### B3 — `UpdateCharacterDiaryDto`

Soubor: `src/modules/character-subdocs/dto/update-character-diary.dto.ts` (NEW)

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
  @IsOptional() @ValidateNested({ each: true }) @Type(() => CustomDiaryBlockDto)
  @IsArray() @ArrayMaxSize(50)
  personalDiarySchema?: CustomDiaryBlockDto[] | null;

  @IsOptional() @IsObject() customData?: Record<string, unknown>;

  @IsOptional() @IsArray() sections?: any[]; // sjednotit s PageSection (krok 7)
}
```

`character-subdocs.controller.ts:53-69` body type `@Body() dto: UpdateCharacterDiaryDto`.

⚠️ Důležité: `personalDiarySchema: null` musí být explicitně povolené (reset override). Zvážit custom validator `@IsOptional() + @ValidateIf(o => o.personalDiarySchema !== null)`.

### B4 — `coerceCustomData` filter

Soubor: `src/modules/character-subdocs/character-subdocs.service.ts` (helper + použití v `updateDiary` + `getDiary`).

Helper:
```ts
private coerceCustomData(
  customData: Record<string, unknown> | undefined,
  schema: { key: string }[] | undefined,
): Record<string, unknown> {
  if (!customData || !schema) return {};
  const allowed = new Set(schema.map(b => b.key));
  return Object.fromEntries(Object.entries(customData).filter(([k]) => allowed.has(k)));
}
```

V `updateDiary`:
```ts
async updateDiary(characterId, dto, requester) {
  const existing = await this.diaryRepo.findByCharacterId(characterId);
  const schema = dto.personalDiarySchema ?? existing?.personalDiarySchema ?? await this.getWorldActiveSchema(...);
  const nextCustomData = this.coerceCustomData(dto.customData ?? existing.customData, schema);
  return this.diaryRepo.update(characterId, { ...dto, customData: nextCustomData });
}
```

V `getDiary` (read side):
```ts
async getDiary(characterId, requester) {
  const diary = await this.diaryRepo.findByCharacterId(characterId);
  const schema = diary?.personalDiarySchema ?? await this.getWorldActiveSchema(...);
  return { ...diary, customData: this.coerceCustomData(diary.customData, schema) };
}
```

`getWorldActiveSchema(worldId)` helper čte `world_settings.diarySchema` (live aktivní).

### B5 — Extended BE helpers (D-DIARY-1/2)

D-DIARY-2 bulk reset:
- Service `worlds.service.ts: resetAllPersonalDiarySchemas(worldId, requester)`.
- Asserts PJ+. Najde všechny postavy ve světě s `personalDiarySchema != null` a updatuje `personalDiarySchema = null`.
- Endpoint `POST /worlds/:id/characters/reset-personal-schemas`.

D-DIARY-1 key remap (jen utility, ne endpoint):
- Service `character-subdocs.service.ts: remapCustomDataKeys(characterId, mapping: Record<string, string>)`.
- Renames keys v `customData`. Volá se z FE jako přídavná akce při key rename v editoru, ne automaticky.
- Endpoint `POST /worlds/:id/characters/:slug/diary/remap` body `{ mapping: Record<string,string> }`.

### B6 — BE testy

`diary-schema-versions.service.spec.ts` rozšířit:
- `createDiarySchemaVersion` první call → verze 1, žádný archive.
- Druhý call → verze 2, verze 1 dostane `archivedAt`.
- Non-PJ → `ForbiddenException`.
- DTO `type: 'invalid'` → 400.
- `schema.length > 50` → 400.

`worlds.service.spec.ts`:
- `createWorld` → `diaryVersionsRepo.create` voláno s verzí 1.
- `updateWorld` se změnou `system` → další verze v tabulce + archive předchozí.

`character-subdocs.service.spec.ts`:
- `updateDiary` filter neznámých klíčů v `customData`.
- `updateDiary` přijme `personalDiarySchema` v DTO (typed).
- `updateDiary` s `personalDiarySchema: null` → reset (DB má `null`).
- `getDiary` read-side filter — DB má extra klíče, response čistá.
- `remapCustomDataKeys` přejmenuje klíče.

`worlds.service.spec.ts` (extended):
- `resetAllPersonalDiarySchemas` updatuje N postav, vrátí count.

---

## 3. FE kroky (F1–F12)

Repo: `c:\Matrix\ProjektIkaros\Projekt-ikaros-FE` (main).

### F1 — Typy

Soubor: `src/features/world/pages/api/diarySchema.types.ts` (NEW)

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
  id?: string;           // UUID — stable reference přes rename `key`
  key: string;
  label: string;
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

Žádná breaking změna v `characters.types.ts` — `SchemaBlock` zůstává (legacy/BE-compat), `DiarySchemaBlock` je nová bohatší struktura.

### F2 — Utils

Soubor: `src/features/world/pages/WorldDiarySchemaEditorPage/utils/schemaMappers.ts` (NEW)

```ts
export function flattenSchemaBlock(b: DiarySchemaBlock): CustomDiaryBlock {
  return {
    id: b.id ?? b.key,
    type: b.type, label: b.label,
    description: b.config?.description,
    maxValue: b.config?.maxValue,
    minValue: b.config?.minValue,
    color: b.config?.color,
    options: b.config?.options,
    order: b.order,
    layoutArea: b.config?.layoutArea,
  };
}

export function nestCustomBlock(b: CustomDiaryBlock): DiarySchemaBlock {
  return {
    id: b.id,
    key: slugify(b.label) || b.id,  // fallback
    label: b.label, type: b.type as DiaryBlockType,
    order: b.order,
    config: {
      description: b.description,
      maxValue: b.maxValue, minValue: b.minValue,
      color: b.color, options: b.options,
      layoutArea: b.layoutArea,
    },
  };
}
```

Soubor: `src/features/world/pages/WorldDiarySchemaEditorPage/utils/schemaValidation.ts`

```ts
export interface SchemaError { blockIndex?: number; field: string; message: string }

export function validateSchema(blocks: DiarySchemaBlock[]): SchemaError[] {
  const errors: SchemaError[] = [];
  const keysSeen = new Set<string>();
  blocks.forEach((b, i) => {
    if (!b.label.trim()) errors.push({ blockIndex: i, field: 'label', message: 'Label nesmí být prázdný' });
    if (!/^[a-z][a-z0-9_]*$/.test(b.key)) errors.push({ blockIndex: i, field: 'key', message: 'Klíč musí začínat písmenem (a-z), pak a-z 0-9 _' });
    if (keysSeen.has(b.key)) errors.push({ blockIndex: i, field: 'key', message: `Duplicitní klíč "${b.key}"` });
    keysSeen.add(b.key);
    if ((b.type === 'bar' || b.type === 'stat' || b.type === 'number') &&
      b.config?.minValue != null && b.config?.maxValue != null &&
      b.config.maxValue <= b.config.minValue)
      errors.push({ blockIndex: i, field: 'maxValue', message: 'Max musí být > Min' });
    if (b.type === 'list' && (!b.config?.options || b.config.options.length < 2))
      errors.push({ blockIndex: i, field: 'options', message: 'List musí mít ≥ 2 položky' });
  });
  if (blocks.length > 50) errors.push({ field: 'schema', message: 'Max 50 bloků' });
  return errors;
}
```

### F3 — API hooks

Soubory:
- `api/useDiarySchemaVersions.ts`
- `api/useDiarySchemaVersion.ts`
- `api/useActiveDiarySchema.ts` (derived nad useDiarySchemaVersions + jeden version fetch)
- `api/useCreateDiarySchemaVersion.ts`
- `api/useUpdatePersonalDiarySchema.ts`
- `api/useResetPersonalDiarySchema.ts`

Pattern reuse z 8.4. `apiClient.get/post/patch` z `shared/api/client`.

`useActiveDiarySchema(worldId)`:
```ts
export function useActiveDiarySchema(worldId: string) {
  const versionsQ = useDiarySchemaVersions(worldId);
  const active = useMemo(() => {
    if (!versionsQ.data) return undefined;
    return [...versionsQ.data].sort((a,b) => b.version - a.version).find(v => v.archivedAt === null);
  }, [versionsQ.data]);
  const versionQ = useDiarySchemaVersion(worldId, active?.version);
  return { ...versionQ, activeMeta: active, isLoading: versionsQ.isLoading || versionQ.isLoading };
}
```

### F4 — Extrakce `DiaryBlockView`

Soubor: `src/features/world/pages/CharacterDetailPage/components/DiaryBlockView.tsx` (NEW)

Vyjmout `DiaryBlockView` z `DiaryTab.tsx`. Named export. Props beze změny (`block: CustomDiaryBlock, value: unknown`).

Update import v `DiaryTab.tsx`.

### F5 — `DiarySchemaEditor` sdílená komponenta

Soubor: `src/features/world/pages/WorldDiarySchemaEditorPage/components/DiarySchemaEditor.tsx`

```tsx
interface Props {
  value: DiarySchemaBlock[];
  onChange: (next: DiarySchemaBlock[]) => void;
  readOnly?: boolean;
  context: 'world' | 'character';
}
```

3-panel layout:
```tsx
<div className={s.editor}>
  <BlockList blocks={value} active={activeId} onSelect={setActiveId} onReorder={...} onAdd={...} readOnly={readOnly} />
  <BlockConfigPanel block={activeBlock} onChange={updateActive} onDelete={removeActive} readOnly={readOnly} />
  <SchemaPreview blocks={value} />
</div>
```

CSS Grid `grid-template-columns: 280px 1fr 320px` (desktop) → `1fr` stack (mobile).

### F6 — Subkomponenty editoru

Soubory v `components/`:
- `BlockList.tsx` + `BlockRow.tsx` — drag&drop list (HTML5 native, fallback ▲▼ pro touch).
- `BlockConfigPanel.tsx` — conditional fields podle `block.type`.
- `SchemaPreview.tsx` — `blocks.map(flattenSchemaBlock).map(b => <DiaryBlockView block={b} value={dummyValueFor(b)} />)`.
- `SchemaVersionPicker.tsx` — dropdown verzí.

`dummyValueFor(b)`:
```ts
switch (b.type) {
  case 'stat': case 'number': return b.config?.minValue ?? 0;
  case 'bar': return b.config?.minValue ?? 0;
  case 'list': return b.config?.options?.[0] ?? '';
  case 'text': case 'textarea': return '…';
}
```

### F7 — `WorldDiarySchemaEditorPage`

Soubor: `WorldDiarySchemaEditorPage.tsx`

Orchestrátor:
```tsx
const { worldId } = useWorldContext();
const versionsQ = useDiarySchemaVersions(worldId);
const [selectedVersion, setSelectedVersion] = useState<number | null>(null); // null = aktivní
const activeVersion = computeActiveVersion(versionsQ.data);
const viewVersion = selectedVersion ?? activeVersion?.version;
const detailQ = useDiarySchemaVersion(worldId, viewVersion);
const [draft, setDraft] = useState<DiarySchemaBlock[]>([]);
useEffect(() => { if (detailQ.data) setDraft(detailQ.data.schema); }, [detailQ.data]);

const isViewingArchive = viewVersion !== activeVersion?.version;
const isDirty = !deepEqual(draft, detailQ.data?.schema);
const createMut = useCreateDiarySchemaVersion(worldId);

async function handleSave() {
  const errors = validateSchema(draft);
  if (errors.length) { toast.error(errors[0].message); return; }
  await createMut.mutateAsync({ schema: draft });
  toast.success(`Šablona uložena jako verze ${last + 1}`);
}

return (
  <div>
    <Header>
      <SchemaVersionPicker versions={versionsQ.data} selected={viewVersion} onSelect={setSelectedVersion} />
      {!isViewingArchive && <Button onClick={handleSave} disabled={!isDirty || createMut.isPending}>Uložit jako verzi {last+1}</Button>}
      {isViewingArchive && <Button onClick={() => { setSelectedVersion(null); setDraft(detailQ.data!.schema); }}>Obnovit jako novou verzi</Button>}
    </Header>
    <DiarySchemaEditor value={draft} onChange={setDraft} readOnly={isViewingArchive} context="world" />
  </div>
);
```

### F8 — `DiaryTab` fallback + override akce

`DiaryTab.tsx`:

```tsx
const { data: diary } = useCharacterDiary(worldId, slug);
const { data: activeSchema, activeMeta } = useActiveDiarySchema(worldId);
const blocks = (diary.personalDiarySchema ?? activeSchema?.schema.map(flattenSchemaBlock) ?? []).sort(...);
const isOverride = diary.personalDiarySchema != null;
```

`DiaryTabEdit` přidat sekci nahoře:

```tsx
<section className={s.overrideSection}>
  {isOverride ? (
    <>
      <Badge>🔓 Vlastní šablona aktivní</Badge>
      <Button onClick={() => setSchemaModalOpen(true)}>✏️ Upravit šablonu</Button>
      <Button variant="secondary" onClick={handleResetOverride}>↺ Vrátit ke světové</Button>
    </>
  ) : (
    <Button onClick={handleEnableOverride}>✏️ Vlastní šablona deníku</Button>
  )}
</section>

<DiarySchemaEditorModal
  open={schemaModalOpen}
  initialValue={diary.personalDiarySchema!}
  onSave={(next) => updatePersonalMut.mutate({ personalDiarySchema: next })}
  onClose={() => setSchemaModalOpen(false)}
/>
```

`handleEnableOverride`: confirm modal → `updatePersonalMut.mutate({ personalDiarySchema: activeSchema?.schema.map(flattenSchemaBlock) ?? [] })`.

`handleResetOverride`: confirm modal → `resetPersonalMut.mutate()` (PATCH s `personalDiarySchema: null`).

`DiarySchemaEditorModal` wrapper:
```tsx
<Modal open={open} onClose={onClose} size="xl">
  <DiarySchemaEditor value={draft} onChange={setDraft} context="character" />
  <Footer><Button onClick={onClose}>Zrušit</Button><Button onClick={() => onSave(draft)}>Uložit</Button></Footer>
</Modal>
```

### F9 — Route + nav

`src/app/router.tsx` — přidat lazy import + route pod world section.

```tsx
const WorldDiarySchemaEditorPage = lazy(() => import('@/features/world/pages/WorldDiarySchemaEditorPage'));
// ...
{
  path: 'admin/sablona-deniku',
  element: (
    <WorldMembershipGuard minWorldRole={WorldRole.PJ} fallbackGlobalRoles={[UserRole.Sa, UserRole.Admin]}>
      <WorldDiarySchemaEditorPage />
    </WorldMembershipGuard>
  ),
}
```

`src/app/layout/WorldLayout/WorldLayout.tsx` — položka v ADMINISTRACE sekci:
```tsx
{ to: 'admin/sablona-deniku', label: 'Šablona deníku', icon: BookText, role: 'pj' }
```

### F10 — Extended: diff viewer + bulk reset + JSON

D-DIARY-4 — Diff viewer:
- Komponenta `SchemaDiffPanel` v editoru: při zobrazení archivované verze vedle preview ukáže `+ přidáno / − odebráno / ~ změněno` proti aktuální aktivní.
- Detekce přes `id` (stable), fallback na `key`.

D-DIARY-2 — Bulk reset:
- Tlačítko v `WorldDiarySchemaEditorPage` headeru: `[ ⚠️ Resetovat overrides u všech postav ]` (visible jen PJ+).
- Confirm dialog: „Odstraní vlastní šablonu deníku u všech postav ve světě. Hromadná operace, nevratná pro jednotlivé postavy."
- Volá `POST /worlds/:id/characters/reset-personal-schemas` (B5 endpoint).
- Toast „Resetováno X postav".

D-DIARY-6 — JSON export/import:
- Header buttony `[ ⬇ Export JSON ]` / `[ ⬆ Import JSON ]`.
- Export: `Blob` z `JSON.stringify(draft, null, 2)` + download attr.
- Import: `<input type="file" accept=".json">` → parse → validate → setDraft.

### F11 — Testy

Soubory v `__tests__/`:
- `useDiarySchemaVersions.spec.ts`
- `useCreateDiarySchemaVersion.spec.ts`
- `useUpdatePersonalDiarySchema.spec.ts`
- `useActiveDiarySchema.spec.ts` — derived logika
- `schemaMappers.spec.ts` — round-trip
- `schemaValidation.spec.ts` — duplicate key, regex, list bez options, max < min
- `DiarySchemaEditor.spec.tsx` — add/remove/reorder, edit config
- `WorldDiarySchemaEditorPage.spec.tsx` — empty state, version picker → read-only, save flow, dirty check
- `BlockConfigPanel.spec.tsx` — render dle type
- `SchemaPreview.spec.tsx` — render dummy
- `SchemaDiffPanel.spec.tsx` — diff detekce
- `DiaryTab.spec.tsx` (rozšířit) — fallback + override akce + reset

### F12 — Polish

- `mobil-desktop` skill audit → log do PR.
- `napoveda` skill → aktualizovat `/ikaros/napoveda`:
  - Nová stránka „Šablona deníku" pro PJ.
  - Sekce „Role a oprávnění" — PJ může editovat schéma deníku světa.
- `docs/roadmap-fe.md` — krok 8.5 zaškrtnout (4 položky).
- `dluh.md` — doplnit D-DIARY-3 + D-DIARY-5 (zbylé dluhy).

---

## 4. Commit strategie

**BE commit:**
```
feat(8.5): dynamické šablony deníku — POST verze, seed v1, customData coerce
```
Body popisuje 8.5-BE-1..5, +N testů, soubory.

**FE commit:**
```
feat(8.5): editor šablony deníku světa + per-postava override
```
Body popisuje editor, fallback, extended (diff/bulk/json), nové route + nav.

**Doctype:** komity přímo na main (memory feedback_work_on_main.md).

---

## 5. Acceptance kontrola (před commit FE)

- [ ] `npm test` v FE — vše green
- [ ] `npm test` v BE — vše green
- [ ] `npm run lint` — clean
- [ ] `npm run build` (FE) — proběhne
- [ ] Manual smoke: vytvoř svět → admin/sablona-deniku → přidej blok → ulož → reload → blok tam je → verze v history → další verze
- [ ] Manual smoke: postava → DiaryTab → fallback (postava bez override vidí svět-level bloky) → klik „Vlastní šablona" → klik „Vrátit ke světové"
- [ ] `mobil-desktop` skill spuštěn
- [ ] `napoveda` skill spuštěn

---

## 6. Riziková místa

| # | Riziko | Mitigace |
|---|--------|----------|
| R-1 | BE má uncommitted změny v `character-subdocs` od jiné práce. Commit musí stage explicitně. | Před commitem `git status`, jen 8.5 cesty. |
| R-2 | Worlds modul je velký + má mnoho consumerů. Změna v `createWorld` ovlivní vše. | B2 přidává jen volání navíc, neměním existující chování settings.upsert. |
| R-3 | `personalDiarySchema: null` v DTO — některé validátory `@IsOptional` `null` ignorují. | Použít `@ValidateIf(o => o.personalDiarySchema !== undefined)` nebo custom. |
| R-4 | Drag&drop na mobilu — HTML5 nefunguje spolehlivě. | Fallback `▲▼` šipky na touch device. |
| R-5 | Existující postavy bez `personalDiarySchema` ve světě bez `diary_schema_versions` (před seed fix). | F8 fallback `?? []` neselže, jen ukáže prázdno. PJ vytvoří první verzi přes editor. |
| R-6 | Změna `personalDiarySchema` key bez `id` ztratí customData. | UI varovný dialog při key rename. |
| R-7 | Bulk reset (D-DIARY-2) je destruktivní. | Confirm dialog + jasná hláška o nevratnosti. |
| R-8 | Diff viewer (D-DIARY-4) na složitých schématech může být zmatený. | Default jen `+/-/~` ikony, žádné side-by-side full schémata. |
