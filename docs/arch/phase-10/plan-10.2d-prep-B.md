# Plan 10.2d-prep-B — Bestiář (refactor 8.4 → 3-scope Bestiae)

**Spec:** [`spec-10.2d-prep-B.md`](spec-10.2d-prep-B.md)
**Status:** 📝 návrh — čeká na schválení
**Velikost:** **M-L** (~refactor 8.4; ~12 nových souborů, ~20 modifikací, ~35 testů)
**Závisí na:** 10.2d-prep-A (per-system schema engine — `EntitySchemaForm`, `SystemStatsValidator`, DrD2 bestie schema)

⚠️ **Toto je refactor existujícího 8.4 modulu, ne nový modul.**

---

## 0 — Pre-implementační verifikace (před C1)

### 0.1 CreateCharacterModal — má „import šablony" flow?

`grep -r "createFromTemplate\|fromTemplate\|importFromNpc"` v FE — ověřit, jestli existuje cesta NpcTemplate → Character. Pokud ano, identifikovat všechny call sites + odebrat v C8.

### 0.2 Pages UI 9.1 — podporuje `isNpc` při create?

`grep -r "isNpc" src/features/world/pages/` — ověřit, že je možné vytvořit Character{isNpc:true} přes Pages UI bez NpcTemplate. Pokud ne → mini extension (separate krátký commit C0.2-extension).

### 0.3 Production data — kolik existujících npcTemplates?

`db.npcTemplates.count()` — ověřit volume před migrací. Pokud >100, migrace musí být robustní (batch + retry); pokud minimal, single-pass stačí.

### 0.4 Existing tokens s `templateId` ref?

`db.maps.find({"tokens.templateId": {$exists: true, $ne: null}}).count()` — pokud ne-nula, migrace musí zachovat ID. Collection rename Mongo zachovává `_id` automaticky → OK.

---

## 1 — Pořadí commitů (přímo na `main`)

| Commit | Co | Repo | Klíčové soubory | Závisí na |
|---|---|---|---|---|
| **C0** | Pre-impl verifikace (0.1-0.4) — produktem zápis výsledků do tohoto plánu | — | — | — |
| **C1** | BE schema refactor + nová bestie.schema.ts | BE | `bestiae/schemas/bestie.schema.ts` | C0 + prep-A done |
| **C2** | BE migrace skript (npcTemplates → bestiae) | BE | `migrations/migrate-npc-templates-to-bestiae.ts` | C1 |
| **C3** | BE rename modul: `git mv npc-templates bestiae` + rename tříd | BE | celý `bestiae/` modul | C1 |
| **C4** | BE service refactor — visibility 3-scope + drop createFromTemplate + add clone | BE | `bestiae.service.ts` | C3 |
| **C5** | BE controller + admin controller refactor — endpointy renamed | BE | `bestiae.controller.ts`, `admin-bestiae.controller.ts` | C4 |
| **C6** | BE `MapOperationsService.token.add` — bestie snapshot logic | BE | `map-operations.service.ts` | C4 |
| **C7** | BE migrace dat (run skript na dev DB + verify) | BE | manual + ověření | C2, C5 |
| **C8** | FE rename: `NPCDirectoryPage` → `BestiarPage` + komponenty | FE | celý `BestiarPage/` adresář | C5 |
| **C9** | FE BestieEditorModal — replace fixed inputs `<EntitySchemaForm>` | FE | `BestieEditorModal.tsx` | C8 + prep-A done |
| **C10** | FE CloneBestieModal + bestiar/hooks/api klient | FE | nové soubory v `bestiar/` | C8 |
| **C11** | FE BestiarPage 3 taby + integrace | FE | `BestiarPage.tsx` | C9, C10 |
| **C12** | FE route + top-nav link + redirect ze starého URL | FE | `router.tsx`, `TopNav.tsx` | C11 |
| **C13** | FE CreateCharacterModal — drop import flow (z C0.1 výsledku) | FE | `CreateCharacterModal.tsx` | C0.1 |
| **C14** | (Conditional) Pages UI `isNpc` toggle pokud chybí (z C0.2) | FE | Pages create form | C0.2 |
| **C15** | Tests update (BE + FE) + roadmap-fe.md update + skill napoveda | both | `__tests__/*`, `roadmap-fe.md` | C13, C14 |

⚠️ **Velikostně:** C8 (FE rename) je největší (~20 souborů přejmenovat + adjust imports). C7 (migrace dev DB) je rizikové (data integrity).
⚠️ **`feedback_be_restart_required`:** restart `nest --watch` po C1, C3, C4, C5, C6.
⚠️ **`feedback_be_precommit_prettier`:** před BE commitem `pnpm prettier --write`.
⚠️ **`feedback_no_debt`:** C8 musí přejmenovat VŠE end-to-end (žádné dangling imports k NPCDirectoryPage).

---

## 2 — Detail změn

### C0 — Pre-impl verifikace

Manual investigation, výstup = poznamenat do tohoto plánu (Section 0). Žádný commit (or empty commit s výsledky pokud chceme).

### C1 — BE schema refactor

**Nový `backend/src/modules/npc-templates/schemas/bestie.schema.ts`** (zatím ve starém modulu, rename v C3):
```ts
@Schema({ timestamps: true, collection: 'bestiae' })
export class BestieSchemaClass {
  @Prop({ required: true, enum: ['system', 'user', 'world'], index: true }) scope: 'system' | 'user' | 'world';
  @Prop({ required: true, index: true }) systemId: string;
  @Prop({ index: true, sparse: true }) ownerUserId?: string;
  @Prop({ index: true, sparse: true }) worldId?: string;
  @Prop({ required: true }) name: string;
  @Prop() imageUrl?: string;
  @Prop({ default: '' }) notes: string;
  @Prop({ type: [Object], default: [] }) abilities: Array<{ label: string; value: string }>;
  @Prop({ type: Object, default: {} }) systemStats: Record<string, unknown>;
  @Prop() clonedFromId?: string;
  @Prop({ type: Date, default: null }) deletedAt: Date | null;
}
export const BestieSchema = SchemaFactory.createForClass(BestieSchemaClass);
BestieSchema.index({ scope: 1, systemId: 1 });
BestieSchema.index({ scope: 1, ownerUserId: 1, systemId: 1 });
BestieSchema.index({ scope: 1, worldId: 1, systemId: 1 });
```

Old `npc-template.schema.ts` zatím zachováno (smaže C3).

⚠️ ⚠️ Mongo collection jméno definuje schema. Pokud old schema `collection: 'npcTemplates'` a new `collection: 'bestiae'` jsou ve stejnou dobu loaded, oba se zaregistrují (different collection). Bez problémů, ale stale schema reference v ostatních modulech musí být refactored v C3.

### C2 — Migrační skript

**`backend/src/migrations/migrate-npc-templates-to-bestiae.ts`** (runnable přes `nest start --entryFile migrations/migrate-npc-templates-to-bestiae`):
```ts
import { connect, model } from 'mongoose';

async function migrate() {
  await connect(process.env.MONGO_URL);
  const oldDocs = await model('NpcTemplate').find().lean();
  console.log(`Migrating ${oldDocs.length} npcTemplates → bestiae...`);
  
  const newDocs = oldDocs.map(doc => ({
    _id: doc._id,  // preserve ID (token.templateId refs zůstanou platné)
    scope: doc.worldId ? 'world' : 'system',
    systemId: 'drd2',  // default; admin retroaktivně může upravit u system entries
    worldId: doc.worldId ?? undefined,
    ownerUserId: undefined,
    name: doc.name,
    imageUrl: doc.imageUrl,
    notes: doc.notes ?? '',
    abilities: doc.abilities ?? [],
    systemStats: {
      'health.max': doc.maxHp ?? 5,
      'health.current': doc.maxHp ?? 5,
      'health.base': doc.maxHp ?? 5,
      armor: doc.armor ?? 0,
      injury: doc.injury ?? 0,
      movement: doc.movement ?? 5,
      'initiative.base': doc.initiativeBase ?? 0,
      'initiative.current': doc.initiativeBase ?? 0,
    },
    clonedFromId: doc.originTemplateId,  // zachovat klonování audit trail
    deletedAt: doc.deletedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    // Drop: diarySchema, diaryData, originTemplateId (uloženo do clonedFromId), maxHp, armor, ...
  }));
  
  if (newDocs.length > 0) {
    await model('Bestie').insertMany(newDocs);
  }
  console.log('Done. Drop old collection? (manual: db.npcTemplates.drop())');
}

migrate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
```

Test (`migrate-npc-templates-to-bestiae.spec.ts`):
- Mock dataset (3 templates, 1 world + 2 global) → migrate → expect 3 bestiae s correct scope a systemStats
- Soft-deleted → preserved deletedAt
- originTemplateId → clonedFromId

### C3 — BE rename modul

```bash
git mv backend/src/modules/npc-templates backend/src/modules/bestiae
```

Pak rename všech tříd v souborech:
- `NpcTemplate*` → `Bestie*` (search/replace)
- `npc-template*` → `bestie*` (filenames, identifiers)
- `npcTemplates` → `bestiae` (collection refs, route paths)
- Smazat old `npc-template.schema.ts` (replace s `bestie.schema.ts` z C1)

⚠️ Update všechny imports napříč projektem (≥30 míst pravděpodobně). Test: `tsc` musí být clean.

`app.module.ts` — `NpcTemplatesModule` → `BestiaeModule`.

### C4 — BE service refactor

`bestiae.service.ts` (refactor z původního):
- **Drop methods**: `findByWorld`, `findGlobal`, `importToWorld`, `createFromTemplate`
- **New methods**: `findVisible(systemId, userId, worldId?)`, `clone(sourceId, target)`
- **Modify**: `create(dto, userId)` — handle 3-scope (`user` vs `world`); validate systemStats via prep-A
- **Authorize matrix** (spec §3.5):
  - `assertCanWrite(bestie, userId)` helper

```ts
async findVisible(systemId, userId, worldId?) {
  return this.repo.find({
    systemId,
    deletedAt: null,
    $or: [
      { scope: 'system' },
      { scope: 'user', ownerUserId: userId },
      ...(worldId ? [{ scope: 'world', worldId }] : []),
    ],
  });
}

async clone(sourceId, dto, currentUserId) {
  const source = await this.repo.findById(sourceId);
  if (!source) throw new NotFoundException();
  await this.assertCanRead(source, currentUserId);
  await this.assertCanWriteTargetScope(dto, currentUserId);
  return this.repo.create({
    scope: dto.scope, systemId: source.systemId,
    ownerUserId: dto.scope === 'user' ? currentUserId : undefined,
    worldId: dto.scope === 'world' ? dto.worldId : undefined,
    name: dto.newName ?? `${source.name} (kopie)`,
    imageUrl: source.imageUrl, notes: source.notes,
    abilities: [...source.abilities],
    systemStats: { ...source.systemStats },
    clonedFromId: source.id,
  });
}
```

Test (`bestiae.service.spec.ts` — full rewrite):
- 3-scope visibility filter
- Create user OK + worldId-less
- Create world bez worldId → 400
- Create world jako Hrac → 403
- Update system → 403
- Update cizí user → 403
- Clone system → user → bestie created, clonedFromId set
- Validate systemStats invalid (např. armor jako string) → 400

### C5 — BE controller refactor

`bestiae.controller.ts`:
- `GET /api/bestiae?systemId=&worldId=` — visibility
- `GET /api/bestiae/:id`
- `POST /api/bestiae`
- `PATCH /api/bestiae/:id`
- `DELETE /api/bestiae/:id` (soft-delete)
- `POST /api/bestiae/:id/restore`
- `DELETE /api/bestiae/:id/hard` (admin/owner)
- `POST /api/bestiae/:id/clone`
- `GET /api/bestiae/trash` (soft-deleted list)

`admin-bestiae.controller.ts` (`/api/admin/bestiae`):
- Sa/Admin može CRUD na `scope='system'` entries (existing 8.4 pattern, just rename + scope filter)

Test (e2e): lifecycle scenarios.

### C6 — BE token.add bestie snapshot

`map-operations.service.ts` rozšíření `applyAtomic` case `token.add`:
```ts
case 'token.add': {
  let token = { ...op.token, id: new ObjectId().toHexString() };
  
  if (token.isNpc && token.templateId) {
    // Bestie spawn: snapshot staty z bestiáře
    const bestie = await this.bestiaeService.findById(token.templateId);
    if (!bestie || bestie.deletedAt) throw new BadRequestException('Bestie not found');
    await this.bestiaeService.assertCanRead(bestie, currentUserId);
    
    token = {
      ...token,
      characterId: `bestie:${bestie.id}`,
      characterSlug: bestie.id,
      systemStats: { ...bestie.systemStats },
      instanceName: `${bestie.name} #${this.countTokensWithTemplate(scene, bestie.id) + 1}`,
    };
  }
  
  // Validate proti world.system schema
  const schema = registry.get(world.system, 'token');
  const result = validator.validateForCreate(token.systemStats, world.system, 'token');
  if (!result.valid) throw new BadRequestException({ errors: result.errors });
  token.systemStats = result.filled;
  
  scene.tokens.push(token);
  break;
}
```

Test (`map-operations.service.spec.ts` rozšíření):
- `token.add` s `templateId` → token má systemStats = copy z bestie, characterId placeholder, instanceName auto
- Bestie deleted → 400
- Bestie out-of-scope → 403

### C7 — BE migrace dev DB

Manual ops (one-shot):
1. Backup current dev DB
2. Run `pnpm run migrate:npc-templates-to-bestiae` (proper npm script)
3. Verify: `db.bestiae.count() === db.npcTemplates.count_before`
4. Verify random doc: scope + systemStats shape correct
5. Drop old collection: `db.npcTemplates.drop()` (after verifikation)

⚠️ Production deploy: run migrace skript jako součást deploy pipeline (pre-app-start hook).

### C8 — FE rename NPCDirectoryPage → BestiarPage

```bash
git mv src/features/world/pages/NPCDirectoryPage src/features/world/pages/BestiarPage
```

Rename files:
- `NPCDirectoryPage.tsx` → `BestiarPage.tsx`
- `NPCDirectoryPage.module.css` → `BestiarPage.module.css`
- `AdminGlobalNpcPage.tsx` → `AdminGlobalBestiarPage.tsx`
- `components/NpcTemplateEditModal.tsx` → `BestieEditorModal.tsx`
- `components/PreviewTemplateModal.tsx` → **DROP** (nahrazeno CloneBestieModal)
- atd.

Search/replace:
- `NpcTemplate` → `Bestie` (in JSX, types, imports)
- `npcTemplates` → `bestiae` (route, api paths)
- `useNpcTemplates` → `useBestiar`

Update all consumer imports (router, top-nav, …).

Test: `tsc -b` clean, vite build clean, existing testů updated.

### C9 — FE BestieEditorModal s EntitySchemaForm

`BestieEditorModal.tsx` (refactor `NpcTemplateEditModal`):
- Replace explicit `<input type="number">` for maxHp/armor/etc. with `<EntitySchemaForm schema={drd2BestieSchema} value={systemStats} onChange={setSystemStats}>`
- Keep avatar upload + name field (universal mimo schema)
- Keep abilities editor (universal — schema má `abilities` jako `list` type, ale lokální custom editor je možný)
- Validate via `validateForCreate` (prep-A FE mirror)

Test (`BestieEditorModal.spec.tsx` update):
- Render → schema form fields přítomné (MAX HP, Zbroj, atd. = DrD2 baseline labels)
- Fill + save → API call s correct payload
- Validation error → render inline

### C10 — FE CloneBestieModal + hooks/api

`src/features/world/bestiar/` (new subdir parallel s `pages/BestiarPage/`):
- `types.ts` — Bestie typy (spec §4)
- `hooks/useBestiar.ts`, `useBestieMutations.ts`, `useCurrentWorldSystem.ts`
- `api/bestiarApi.ts`
- `components/CloneBestieModal.tsx`

⚠️ Důvod `pages/BestiarPage/` vs `bestiar/`: page vs feature directory. Conventions v repo — TBD při C8 (existing v 8.4 byla `pages/NPCDirectoryPage`, pojďme follow same).

### C11 — FE BestiarPage 3 taby + integrace

`BestiarPage.tsx`:
- Header: title + `[Vytvořit novou]` button
- `<BestiarTabs>` 3 taby (Můj / Tohoto světa / Systémové)
- Search input
- List `<BestieCardSummary>` per tab
- Modaly: BestieEditorModal, CloneBestieModal

Use hooks: `useBestiar`, `useBestieMutations`.

Test (`BestiarPage.spec.tsx`):
- Render 3 taby s counts
- Switch tab → list mění
- Klik Create → modal open

### C12 — FE route + top-nav + redirect

`router.tsx`:
```tsx
<Route path="/svet/:worldId/bestiar" element={<RequireRole minRole={WorldRole.PomocnyPJ}><BestiarPage /></RequireRole>} />
<Route path="/svet/:worldId/admin/adresar-postav" element={<Navigate to="../bestiar" replace />} />
```

`TopNav.tsx`: link „Bestiář" (PJ+ visible).

### C13 — FE CreateCharacterModal cleanup

Pokud C0.1 zjištění říká „CreateCharacterModal má import šablony" → odebrat tu sekci. Pokud ne, žádné změny.

### C14 — Pages UI `isNpc` toggle (conditional)

Pokud C0.2 zjištění říká „Pages UI neumožňuje `isNpc=true` při create" → přidat toggle do CreateCharacterModal nebo PagesPage create form. Mimo prep-B, ale součást migration.

### C15 — Tests + finalize

Aktualizace všech testů (rename references, refactor flows). Update:
- `roadmap-fe.md`: 
  - Sekce 8.4: pridat poznámku „**Refactored v 10.2d-prep-B do Bestiáře — viz [spec-10.2d-prep-B.md]**"
  - Sekce 10.2: 10.2d-prep-A + 10.2d-prep-B + 10.2d entries (z předchozího update)
- `skill napoveda` — update help pages (bestiář jako new PJ tool)
- Status 10.2d-prep-B spec → ✅ HOTOVO

---

## 3 — Otevřená rozhodnutí

| # | Rozhodnutí | Návrh | Důsledek |
|---|---|---|---|
| 1 | Page-vs-feature directory: `pages/BestiarPage/` vs `bestiar/` | Follow existing 8.4 pattern: `pages/BestiarPage/` | Pokud chceme čistší: refactor na `bestiar/` (větší rename) |
| 2 | Mongo collection drop timing | C7 manual after migrace verify | Risk: forget drop → stale data orphan |
| 3 | Production migrace strategy | Run pre-app-start v deploy pipeline | Alt: standalone script + manual trigger |
| 4 | Existing `originTemplateId` → `clonedFromId` | Yes, preserve audit trail | Slight semantic shift OK |
| 5 | Stary URL redirect — 30 dní | OK | After 30d drop redirect (cleanup) |

## 4 — Risk register

- **Existing tokens.templateId ref break** — verifikace v C0.4. Pokud production tokens existují, Mongo collection rename zachovává `_id` (rename preserves ids). Risk LOW.
- **Pages UI `isNpc` toggle missing** — C0.2. Pokud chybí, mini extension nutná pre-deploy. Risk MEDIUM (verify early).
- **Migrace script bug** — data loss. Mitigace: dev DB test + verify count match + backup before run.
- **CreateCharacterModal flow A drop** — pokud uživatelé masově používali, UX disruption. Mitigace: skill `napoveda` update s pokyny „NPC postavy nově tvořte přes Pages".
- **Class name conflicts during rename** — IDE tooling může selhat na duplicate types (old + new schema souběžně). Mitigace: C3 (rename modul) musí být atomic single commit.
- **Schema validator (prep-A) může reject migrated data** — pokud existing npcTemplate má hodnoty mimo schema constraints (např. maxHp=0 ale schema vyžaduje min=1). Mitigace: pre-migrate validation pass + manual review odchylek.

## 5 — Testovací matice → akceptace

| Akceptační kritérium (spec §9) | Test typ | Soubor |
|---|---|---|
| BE `bestiae` modul renamed | TS | `tsc -b` clean |
| Schema 3-scope | unit | `bestiae.service.spec.ts` |
| Migrace skript | unit + manual | `migrate-npc-templates-to-bestiae.spec.ts` |
| Visibility 3-scope query | unit | service |
| CRUD + authorization | e2e | controller |
| Clone | unit + e2e | service + controller |
| BE `token.add` bestie snapshot | unit | `map-operations.service.spec.ts` |
| FE `BestiarPage` renamed | integration | `BestiarPage.spec.tsx` |
| 3 taby s daty | integration | page |
| `BestieEditorModal` `<EntitySchemaForm>` | integration | modal |
| `CloneBestieModal` scope selector | integration | modal |
| Route rename + redirect | smoke | router test |
| Top-nav link PJ+ | integration | TopNav |
| CreateCharacterModal cleanup | integration | modal |
| 35+ testů | — | full suite |
| mobil + desktop layouts | manual | `mobil-desktop` |
| Nápověda update | — | `napoveda` |

---

**Po dokončení 10.2d-prep-B** → 10.2d (tokens + paleta) start. Paleta `BestiePalette` sekce čte `useBestiar(worldId, world.system).world + .user + .system`.
