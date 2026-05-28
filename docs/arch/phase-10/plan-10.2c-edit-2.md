# Plan 10.2c-edit-2 — Map Library full snapshot + per-PJ ownership

**Spec:** [`docs/arch/maps/library-snapshot/`](../../../../Projekt-ikaros/docs/arch/maps/library-snapshot/index.md) (v Projekt-ikaros repu)
**Status:** 📝 návrh — čeká na schválení
**Velikost:** **L** (~3 nové FE, ~2 nové BE, ~6 modifikací, migrace skript, ~18 testů, 5 nových op types)

> **Sekvence:** spustit AŽ PO dokončení `plan-10.2c-edit-1` — oba mění `MapOperation` discriminated union; merge konflikty se snadno vyhne sériovým postupem.

---

## 1 — Pořadí commitů

| Commit | Co | Klíčové soubory | Závisí na |
|---|---|---|---|
| **C1** | BE — migrace skript (ownerId backfill přes Tyky) + dry-run logging | `backend/scripts/migrate-map-templates-ownerid.ts` | — |
| **C2** | BE — `MapTemplate` schema změna (`ownerId` required, `timestamps`) | `backend/.../schemas/map-template.schema.ts` | C1 (migrace musí proběhnout v dev DB) |
| **C3** | BE — repository `findByOwner` + index `{ownerId, updatedAt}` | `backend/.../repositories/map-templates.repository.ts` + interface | C2 |
| **C4** | BE — controller filter + ownership guards + DTO + PC token strip | `backend/.../map-templates.controller.ts` + `dto/create-map-template.dto.ts` + spec | C3 |
| **C5** | BE — 5 nových op types v `MapOperation` union (interfaces) | `backend/.../interfaces/map-operation.interface.ts` + FE `types.ts` | — |
| **C6** | BE — 5 nových handler cases v `MapOperationsService` + authorizer PJ-only + tests | `map-operations.service.ts` + `.spec.ts` | C5 |
| **C7** | FE — `ConfirmModal` v `shared/ui` (pokud chybí) — sdílené s edit-1 | `Projekt-ikaros-FE/src/shared/ui/ConfirmModal.tsx` + index export | — |
| **C8** | FE — `MapLibraryModal` save mutation rozšíření (full snapshot) | `Projekt-ikaros-FE/.../pj-panel/MapLibraryModal.tsx` | C4 |
| **C9** | FE — `MapLibraryModal` load mutation rozšíření (sekvence 7 ops + confirm) | `MapLibraryModal.tsx` | C5, C6, C7, C8 |
| **C10** | FE — `MapTemplate` typescript interface update + `MapOperation` union | `Projekt-ikaros-FE/.../types.ts` | C5 |
| **C11** | Integrace test roundtrip save → load BE | `__tests__/integration/map-library.spec.ts` | C6, C8, C9 |
| **C12** | E2E test cross-world přenos (pokud framework existuje) nebo unit ekvivalent | `__tests__/e2e/...` nebo unit | C11 |
| **C13** | Migrace produkční DB (manuální commit s deploy notes) | deploy notes | C2, C12 |
| **C14** | Status update — memory `project_takticka_mapa_library` (nový), roadmap | memory + `roadmap-fe.md` | C13 |

Velikostně: **C6** (5 handlerů + cascade authorize) a **C9** (UX flow s confirm + retry) nejtěžší. **C1** rizikový (real DB write — musí být dry-run první).

---

## 2 — Detail změn

### C1 — Migrace skript

```ts
// backend/scripts/migrate-map-templates-ownerid.ts
import { connect } from 'mongoose';
import { config } from 'dotenv';

async function main() {
  config();
  const conn = await connect(process.env.MONGODB_URI!);
  const db = conn.connection.db;

  const tyky = await db.collection('users').findOne({ email: 'tykytanjunior@gmail.com' });
  if (!tyky) throw new Error('Superadmin user (Tyky) nenalezen — abort');

  const tykyId = tyky._id.toString();

  const dryRun = process.argv.includes('--dry-run');
  const filter = { ownerId: { $exists: false } };

  if (dryRun) {
    const count = await db.collection('mapTemplates').countDocuments(filter);
    console.log(`[DRY-RUN] Would update ${count} templates → owner=${tykyId}`);
    return;
  }

  const now = new Date();
  const result = await db.collection('mapTemplates').updateMany(filter, {
    $set: { ownerId: tykyId, createdAt: now, updatedAt: now },
  });

  console.log(`Updated ${result.modifiedCount} templates → owner=${tykyId}`);

  // Audit
  const remaining = await db.collection('mapTemplates').countDocuments(filter);
  if (remaining > 0) throw new Error(`Migrace neúplná: ${remaining} dokumentů stále bez ownerId`);

  console.log('✓ Migrace OK');
  await conn.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
```

Spuštění: `pnpm tsx backend/scripts/migrate-map-templates-ownerid.ts --dry-run` → review → bez `--dry-run` ostře.

### C2 — Schema update

```ts
@Schema({ timestamps: true, collection: 'mapTemplates' })
export class MapTemplateSchemaClass {
  @Prop({ required: true, index: true }) ownerId: string;
  @Prop({ required: true, minlength: 1, maxlength: 100 }) name: string;
  @Prop({ required: true, minlength: 1 }) imageUrl: string;
  @Prop({ type: Object, default: { size: 40, originX: 0, originY: 0, showGrid: true } })
  config: Record<string, unknown>;
  @Prop({ type: [MixedArraySubSchema], default: [] }) npcTemplates: Record<string, unknown>[];
  @Prop({ type: [MixedArraySubSchema], default: [] }) tokens: Record<string, unknown>[];
  @Prop({ type: [MixedArraySubSchema], default: [] }) effects: Record<string, unknown>[];
  @Prop({ default: false }) fogEnabled: boolean;
  @Prop({ type: [MixedArraySubSchema], default: [] }) revealedHexes: Record<string, unknown>[];
  @Prop({ type: [String], default: [] }) activeSoundIds: string[];
  // createdAt + updatedAt via timestamps: true
}

// Schema index
MapTemplateSchema.index({ ownerId: 1, updatedAt: -1 });
```

Odebrat `lastModified` field (nahrazeno `updatedAt`).

### C3 — Repository

```ts
// interfaces/map-templates-repository.interface.ts
export interface IMapTemplatesRepository {
  findAll(): Promise<MapTemplate[]>;
  findByOwner(ownerId: string): Promise<MapTemplate[]>;
  findById(id: string): Promise<MapTemplate | null>;
  create(payload: Partial<MapTemplate>): Promise<MapTemplate>;
  replace(id: string, payload: Partial<MapTemplate>): Promise<void>;
  delete(id: string): Promise<boolean>;
}
```

Implementace `findByOwner`:
```ts
async findByOwner(ownerId: string): Promise<MapTemplate[]> {
  return this.model.find({ ownerId }).sort({ updatedAt: -1 }).lean().exec();
}
```

### C4 — Controller + DTO

`dto/create-map-template.dto.ts`:
```ts
export class CreateMapTemplateDto {
  @IsString() @MinLength(1) @MaxLength(100) name: string;
  @IsString() @MinLength(1) imageUrl: string;
  @IsObject() config: Record<string, unknown>;
  @IsOptional() @IsArray() tokens?: unknown[];
  @IsOptional() @IsArray() npcTemplates?: unknown[];
  @IsOptional() @IsArray() effects?: unknown[];
  @IsOptional() @IsBoolean() fogEnabled?: boolean;
  @IsOptional() @IsArray() revealedHexes?: unknown[];
  @IsOptional() @IsArray() @IsString({ each: true }) activeSoundIds?: string[];
}
```

`map-templates.controller.ts` — všechny metody:

```ts
@Get()
@UseGuards(JwtAuthGuard)
async findAll(@CurrentUser() user: RequestUser) {
  if (user.role <= UserRole.ADMIN) return this.repo.findAll();
  return this.repo.findByOwner(user.id);
}

@Get(':id')
@UseGuards(JwtAuthGuard)
async findById(@Param('id') id: string, @CurrentUser() user: RequestUser) {
  const tpl = await this.repo.findById(id);
  if (!tpl) throw new NotFoundException({ code: 'MAP_TEMPLATE_NOT_FOUND', ... });
  if (user.role > UserRole.ADMIN && tpl.ownerId !== user.id) {
    throw new ForbiddenException({ code: 'MAP_TEMPLATE_FORBIDDEN_OWNER', ... });
  }
  return tpl;
}

@Post()
@UseGuards(JwtAuthGuard)
async create(@Body() dto: CreateMapTemplateDto, @CurrentUser() user: RequestUser) {
  if (user.role > UserRole.PJ) {
    throw new ForbiddenException({ code: 'MAP_TEMPLATE_FORBIDDEN', ... });
  }
  return this.repo.create({
    ...dto,
    ownerId: user.id,
    tokens: filterOutPcTokens(dto.tokens ?? []),
  });
}

@Put(':id')
@UseGuards(JwtAuthGuard)
@HttpCode(204)
async replace(@Param('id') id, @Body() dto, @CurrentUser() user) {
  const existing = await this.repo.findById(id);
  if (!existing) throw new NotFoundException(...);
  if (user.role > UserRole.PJ) throw new ForbiddenException({ code: 'MAP_TEMPLATE_FORBIDDEN', ... });
  if (user.role > UserRole.ADMIN && existing.ownerId !== user.id) {
    throw new ForbiddenException({ code: 'MAP_TEMPLATE_FORBIDDEN_OWNER', ... });
  }
  const { ownerId, ...cleanDto } = dto;  // strip ownerId from body
  await this.repo.replace(id, {
    ...cleanDto,
    tokens: filterOutPcTokens(cleanDto.tokens ?? []),
  });
}

@Delete(':id')
@UseGuards(JwtAuthGuard)
@HttpCode(204)
async delete(@Param('id') id, @CurrentUser() user) {
  const existing = await this.repo.findById(id);
  if (!existing) throw new NotFoundException(...);
  if (user.role > UserRole.PJ) throw new ForbiddenException({ code: 'MAP_TEMPLATE_FORBIDDEN', ... });
  if (user.role > UserRole.ADMIN && existing.ownerId !== user.id) {
    throw new ForbiddenException({ code: 'MAP_TEMPLATE_FORBIDDEN_OWNER', ... });
  }
  await this.repo.delete(id);
}
```

Helper `filterOutPcTokens`:
```ts
function filterOutPcTokens(tokens: unknown[]): unknown[] {
  return tokens.filter((t): t is { isNpc: true } =>
    typeof t === 'object' && t !== null && (t as Record<string, unknown>).isNpc === true,
  );
}
```

### C5 — Op type union přírůstky

**BE** `interfaces/map-operation.interface.ts`:
```ts
| { type: 'scene.fog.replace'; fogEnabled: boolean; revealedHexes: HexCoord[] }
| { type: 'scene.effects.replace'; effects: MapEffect[] }
| { type: 'scene.npc-templates.replace'; npcTemplates: NpcTemplate[] }
| { type: 'scene.tokens.replace-npc'; tokens: MapToken[] }  // pouze NPC; PC zůstávají
| { type: 'scene.sounds.set'; activeSoundIds: string[] }
```

**FE** stejné v `types.ts`.

### C6 — Op handlers

```ts
// map-operations.service.ts cases:

case 'scene.fog.replace': {
  await this.authorizer.assertCanManageScene(user, scene);
  const inverse = { type: 'scene.fog.replace', fogEnabled: scene.fogEnabled, revealedHexes: scene.revealedHexes };
  await this.mapsRepo.atomicSetFog(scene.id, op.fogEnabled, op.revealedHexes);
  // log + broadcast
  return { ..., inverse };
}

case 'scene.effects.replace': {
  // ... atomic replace `effects` pole
}

case 'scene.npc-templates.replace': {
  // ... atomic replace `npcTemplates`
}

case 'scene.tokens.replace-npc': {
  await this.authorizer.assertCanManageScene(user, scene);
  // Server-side strip: jistota že přicházejí jen NPC
  const npcOnly = op.tokens.filter(t => t.isNpc === true);
  const inverse = { type: 'scene.tokens.replace-npc', tokens: scene.tokens.filter(t => t.isNpc === true) };
  // Atomic: zachovat PC tokeny, replace NPC
  const pcTokens = scene.tokens.filter(t => !t.isNpc);
  await this.mapsRepo.atomicSetTokens(scene.id, [...pcTokens, ...npcOnly]);
  // log + broadcast
}

case 'scene.sounds.set': {
  // ... atomic set activeSoundIds
}
```

Každý handler:
- PJ-only authorize
- snapshot inverse (předchozí pole)
- atomic mongo update
- log + WS broadcast
- return `{ applied: true, seqNumber, inverse }`

### C7 — `ConfirmModal`

Pokud neexistuje, vytvořit (sdílené s edit-1 — `useConfirm` hook):

```tsx
// shared/ui/ConfirmModal.tsx
export function ConfirmModal({ open, title, body, confirmLabel, cancelLabel, variant, onConfirm, onCancel }: Props) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm" footer={...}>
      <p>{body}</p>
    </Modal>
  );
}

// hook
export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null);
  const confirm = (opts: ConfirmOpts) => new Promise<boolean>(resolve => setState({ ...opts, resolve }));
  const node = state ? (
    <ConfirmModal
      open
      {...state}
      onConfirm={() => { state.resolve(true); setState(null); }}
      onCancel={() => { state.resolve(false); setState(null); }}
    />
  ) : null;
  return { confirm, node };
}
```

### C8 — `MapLibraryModal` save

Změna body POST requestu:
```ts
return api.post<MapTemplate>('/map-templates', {
  name: saveName.trim(),
  imageUrl: scene.imageUrl,
  config: scene.config,
  tokens: scene.tokens.filter(t => t.isNpc === true),
  npcTemplates: scene.npcTemplates ?? [],
  effects: scene.effects ?? [],
  fogEnabled: scene.fogEnabled ?? false,
  revealedHexes: scene.revealedHexes ?? [],
  activeSoundIds: scene.activeSoundIds ?? [],
});
```

### C9 — `MapLibraryModal` load se sekvencí

```ts
const loadMutation = useMutation({
  mutationFn: async (template: MapTemplate): Promise<void> => {
    if (!scene) throw new Error('Žádná aktivní scéna');

    const ok = await confirm({
      title: 'Načíst šablonu?',
      body: 'Tohle přepíše aktuální scénu, vše současné se ztratí. Pokračovat?',
      confirmLabel: 'Načíst',
      variant: 'danger',
    });
    if (!ok) return;

    const ops: MapOperation[] = [
      { type: 'scene.image', imageUrl: template.imageUrl },
      { type: 'scene.config', config: template.config },
      { type: 'scene.fog.replace', fogEnabled: template.fogEnabled, revealedHexes: template.revealedHexes },
      { type: 'scene.effects.replace', effects: template.effects },
      { type: 'scene.npc-templates.replace', npcTemplates: template.npcTemplates },
      { type: 'scene.tokens.replace-npc', tokens: template.tokens },
      { type: 'scene.sounds.set', activeSoundIds: template.activeSoundIds },
    ];

    let appliedCount = 0;
    try {
      for (const op of ops) {
        await postMapOperation(scene.id, op);
        appliedCount++;
      }
    } catch (e) {
      throw new Error(
        `Načtení selhalo po ${appliedCount}/${ops.length} operacích. Scéna může být v částečném stavu.`,
      );
    }
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) });
    onClose();
  },
  onError: (e) => setError(e instanceof Error ? e.message : 'Načtení selhalo'),
});
```

### C10 — FE types

```ts
// types.ts
export interface MapTemplate {
  id: string;
  ownerId: string;
  name: string;
  imageUrl: string;
  config: MapSceneConfig;
  npcTemplates: NpcTemplate[];
  tokens: MapToken[];
  effects: MapEffect[];
  fogEnabled: boolean;
  revealedHexes: HexCoord[];
  activeSoundIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type MapOperation =
  | ...existing...
  | { type: 'scene.fog.replace'; fogEnabled: boolean; revealedHexes: HexCoord[] }
  | { type: 'scene.effects.replace'; effects: MapEffect[] }
  | { type: 'scene.npc-templates.replace'; npcTemplates: NpcTemplate[] }
  | { type: 'scene.tokens.replace-npc'; tokens: MapToken[] }
  | { type: 'scene.sounds.set'; activeSoundIds: string[] };
```

### C11 — Roundtrip integrační test

```ts
// __tests__/integration/map-library.spec.ts
describe('Map Library roundtrip', () => {
  it('save → load = identical state (kromě PC tokens)', async () => {
    // Setup scéna A se vším
    const sceneA = await createScene({ ...withTokensEffectsFog });

    // Save template
    const tpl = await api.post('/map-templates', { ... });

    // Vytvořit prázdnou scénu B
    const sceneB = await createScene({ imageUrl: '', tokens: [], ... });

    // Apply load sekvence
    for (const op of loadSequence(tpl)) {
      await api.post(`/maps/${sceneB.id}/operations`, op);
    }

    // Verify
    const result = await api.get(`/maps/${sceneB.id}`);
    expect(result.imageUrl).toBe(sceneA.imageUrl);
    expect(result.config).toEqual(sceneA.config);
    expect(result.tokens.filter(t => t.isNpc)).toEqual(sceneA.tokens.filter(t => t.isNpc));
    expect(result.tokens.filter(t => !t.isNpc)).toEqual([]);  // PC nepřenášené
    expect(result.effects).toEqual(sceneA.effects);
    expect(result.fogEnabled).toBe(sceneA.fogEnabled);
    expect(result.revealedHexes).toEqual(sceneA.revealedHexes);
  });
});
```

### C12 — E2E test

Pokud projekt nemá E2E framework, ekvivalent jako integration/component test. Otevřená otázka v `ai-notes.md`.

### C13 — Produkční migrace

Deploy note:
1. Backup `mapTemplates` collection
2. Spustit `pnpm tsx scripts/migrate-map-templates-ownerid.ts --dry-run`
3. Review output
4. Spustit bez `--dry-run`
5. Verify `db.mapTemplates.countDocuments({ ownerId: { $exists: false } })` === 0
6. Deploy nová verze BE + FE

### C14 — Status update

Nová memory `project_takticka_mapa_library`:
```md
Map Library (mapTemplates) je per-PJ private, cross-world (žádný worldId), full snapshot.

Klíčové vlastnosti:
- ownerId required, immutable (server-side enforced)
- Admin+Superadmin vidí všechny (bypass)
- Save ukládá vše KROMĚ PC tokenů (filtered server-side, defense in depth)
- Load = sekvence 7 ops (image, config, fog, effects, npc-templates, tokens.replace-npc, sounds)
- Sekvence není transakční — částečný stav povolený, klient toast + retry
- Confirm dialog před load (přepíše aktuální scénu)

How to apply: Při dotazu na šablony filtrovat per user.id (BE controller). Při save/load
respektovat PC token strip (FE + BE).

Souvisí: [[project_takticka_mapa_assignment]] (per-player scene routing).
```

`roadmap-fe.md` → 10.2c-edit-2 ✅.

---

## 3 — Commit messages template

```
feat(10.2c-edit-2): <co>
```

Příklady:
- `feat(10.2c-edit-2): migrace skript mapTemplates ownerId backfill`
- `feat(10.2c-edit-2): MapTemplate schema — ownerId required + timestamps`
- `feat(10.2c-edit-2): map-templates controller per-PJ filter + ownership guards`
- `feat(10.2c-edit-2): 5 nových op types — fog/effects/npc-templates/tokens-npc/sounds`
- `feat(10.2c-edit-2): MapLibraryModal full snapshot save/load + confirm`

---

## 4 — Pre-flight check

- [ ] Memory `feedback_be_precommit_prettier` — prettier před každým BE commitem
- [ ] Memory `feedback_be_restart_required` — restart BE po schema změně
- [ ] Memory `feedback_persist_across_variants` — povinný persistence test (save→GET→load→GET roundtrip)
- [ ] Migrace na dev DB **PŘED** schema PR (jinak `required: true` zláme load)
- [ ] Commit přímo na `main` (memory `feedback_work_on_main`)
- [ ] Mobil + desktop ověření po C8/C9 (skill `mobil-desktop`)
- [ ] Nápověda update (skill `napoveda`) po dokončení — nové behavior v knihovně map

---

## 5 — Otevřené body k vyřešení během C1–C7

1. **`ConfirmModal` v shared/ui** — ověřit existenci; pokud chybí, vytvořit jako C7 (sdílí s plan-10.2c-edit-1).
2. **Cypress vs Playwright** — projekt používá který E2E framework? `__tests__/e2e/` nebo `cypress/` nebo `playwright/` dir hledat. Pokud nic, C12 jako component test.
3. **`assertCanManageScene`** — existuje v authorizeru? Pokud ne, kopírovat pattern z `assertCanReadSceneLog`.
4. **Mongo bulk-insert pro `tokens.replace-npc`** — preferovat `$set` celého pole, ne `$pull` + `$push` (atomicita).
5. **Verze migračního skriptu pro CI** — má smysl udělat z toho idempotent Nest CLI command? Otevřené, mimo MVP.
