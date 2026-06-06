# Spec 10.2d-prep-B — Bestiář (refactor 8.4 NpcTemplate → 3-scope Bestie)

**Status:** ✅ HOTOVO (2026-05-27) — **pivot vůči původnímu spec'u**: místo refactoru 8.4 implementováno jako **standalone modul `bestiae` vedle existujícího 8.4 `npc-templates`**. 8.4 zůstává pro NPC postava šablony (s deníkem); bestie je separate koncept (jen statblok, žádný deník).

> **Revize 2026-06-06:** obrázek bestie v `BestieEditorModal` dostal upload souboru (§5 počítala se `useUploadImage`, ale MVP to odložilo na text URL). Nově přes sdílenou `HeroUploadCard` (compact, bez výřezu/focal) — klik/drag&drop nahraje soubor přes `useUploadImage`, fallback „Vložit URL ručně" zachován. `imageUrl` zůstává string → žádná BE/schema změna. `HeroUploadCard` dostala aditivní prop `uploadCta` (default beze změny).
**Modul:** bestiář / standalone vedle 8.4
**Velikost:** **M-L** (2 BE commity + 1 FE commit — viz git log)
**Závisí na:** 10.2d-prep-A (per-system schema engine, `SystemStatsValidator`, DrD2 bestie schema)

⚠️ **Důležité:** krok **8.4 už je dokončen** (2026-05-23) jako „NPC šablona" (`npcTemplates` collection + `NPCDirectoryPage`). 10.2d-prep-B **NENÍ nový modul** — je to **refactor 8.4** zarovnaný na vyjasnění Bestie ≠ NPC postava ([[project-npc-vs-bestie]]).

---

## 1. Účel

Refactor existing 8.4 (`npc-templates`) do **Bestiáře**: standalone library statbloků pro spawn tokenů na taktickou mapu, **bez deníku**. NPC postavy se nově tvoří přes Pages UI z 9.1 (s `isNpc=true`, jako PC postavy).

Změny:
1. **Rename**: `npcTemplates` → `bestiae` (BE collection, modul, FE stránka)
2. **3-scope** (z existing 2-scope): `system` (admin-managed) / `user` (NEW, PJ napříč světy) / `world` (per-svět)
3. **Per-system staty**: fixed pole (maxHp/armor/injury/movement/initiativeBase) → `systemStats` přes prep-A engine
4. **Drop**: `diarySchema, diaryData, originTemplateId` (bestie ≠ NPC postava, žádný deník)
5. **Spawn-on-map path**: `token.add { isNpc:true, bestieId }` přímo z bestiáře, bez Character creation (deprecate flow A z 8.4)
6. **Klonování mezi scope** (nahrazuje existing `import` global→world)
7. **NPC postava cesta**: CreateCharacterModal flow A (import z npcTemplate) **odstraněn** — NPC postavy se tvoří přes Pages UI 9.1 stejně jako PC

Po 10.2d-prep-B:
- BE `bestiae` modul s 3-scope CRUD + clone
- FE stránka `BestiarPage` (přejmenovaná `NPCDirectoryPage`) s 3 taby
- 10.2d může používat `useBestiar()` hook pro paletu spawn UI

## 2. Scope

### V scope

#### BE — Refactor 8.4 npc-templates → bestiae

**Rename:**
- `backend/src/modules/npc-templates/` → `backend/src/modules/bestiae/`
- `npcTemplates` Mongo collection → `bestiae`
- `NpcTemplate*` třídy/typy → `Bestie*`
- Endpoint `/api/npc-templates` → `/api/bestiae`
- Admin endpoint `/api/admin/npc-templates` → `/api/admin/bestiae`

**Schema refactor** (`bestie.schema.ts`):
```ts
@Schema({ timestamps: true, collection: 'bestiae' })
class BestieSchemaClass {
  @Prop({ required: true, enum: ['system', 'user', 'world'], index: true }) scope: string;
  @Prop({ required: true, index: true }) systemId: string;  // 'drd2', 'dnd5e'
  @Prop({ index: true, sparse: true }) ownerUserId?: string;  // pro scope='user'
  @Prop({ index: true, sparse: true }) worldId?: string;       // pro scope='world'
  @Prop({ required: true }) name: string;
  @Prop() imageUrl?: string;
  @Prop({ default: '' }) notes: string;
  @Prop({ type: [Object], default: [] }) abilities: Array<{ label: string; value: string }>;
  @Prop({ type: Object, default: {} }) systemStats: Record<string, unknown>;
  @Prop() clonedFromId?: string;
  @Prop({ type: Date, default: null }) deletedAt: Date | null;  // zachováno (soft-delete z 8.4)
  // Odstraněno: diarySchema, diaryData, originTemplateId, maxHp, armor, injury, movement, initiativeBase
}
```

**Migrace dat** (krok C2 v plánu):
- Existing `npcTemplates` docs: 
  - `worldId === null` → `scope='system', systemId='drd2'` (default; admin může pak refilovat)
  - `worldId !== null` → `scope='world', systemId='drd2'`
  - Žádné `scope='user'` v migraci (chronologicky neexistovalo, lze ručně klonovat)
  - Fixed pole → `systemStats: { 'health.max': maxHp, 'armor': armor, 'injury': injury, 'movement': movement, 'initiative.base': initiativeBase }`
  - Drop `diarySchema`, `diaryData`, `originTemplateId` (info už není potřeba; pro audit můžeme uložit do `clonedFromId` pokud existed)

**Service změny:**
- `findVisible(systemId, userId, worldId?)` — visibility query 3-scope (spec §3 prep-B-old, zachováno)
- Drop `findByWorld`, `findGlobal`, `importToWorld` (nahrazeno `clone` + `findVisible`)
- Refactor `createFromTemplate` (CreateCharacterModal flow A) — **odstranit** (NPC postavy se tvoří přes Pages 9.1)
- Add `clone(sourceId, target)` (general purpose pro všechny scope kombinace)
- Validate `systemStats` přes prep-A `SystemStatsValidator.validateForCreate(stats, systemId, 'bestie')`

**Authorization** (jako spec-prep-B-old, §3.5):
- scope='system' write = nikdo přes API (admin endpoint only)
- scope='user' write = jen owner
- scope='world' write = PJ+ v daném světě
- Sa/Admin global → ne automatic override (consistent s rest of platform)

**Spawn-on-map endpoint:** Volání přes existing `POST /maps/:sceneId/operations { type: 'token.add', token: {...} }` (BE side resolve bestie staty). Token.add BE handler:
- Pokud `op.token.isNpc && op.token.templateId` → lookup `bestieRepo.findById(templateId)`, snapshot `systemStats` z bestie do tokenu (override pokud klient poslal explicit systemStats)
- Set `instanceName = bestie.name + ' #N'` (N = počet existing tokenů s tímto templateId v scéně + 1)
- ⚠️ **Vyžaduje rozšíření** `MapOperationsService.applyAtomic('token.add')` — toto je v plan-10.2d-prep-B C5 (BE-side update do `MapsModule`)

#### FE — Refactor NPCDirectoryPage → BestiarPage

**Rename:**
- `src/features/world/pages/NPCDirectoryPage/` → `src/features/world/pages/BestiarPage/`
- Komponenty `NpcTemplate*` → `Bestie*`
- Route `/svet/:worldId/admin/adresar-postav` → `/svet/:worldId/bestiar` (přesun z admin do top-nav PJ+)
- Admin route `/ikaros/admin/npc-bestiar` → `/ikaros/admin/bestiar` (Sa/Admin globální bestiář)

**Struktura zachována** (existing patterns), úpravy:
- 3 taby (current: global/local; new: Můj / Tohoto světa / Systémové)
- `BestieEditorModal` (current: `NpcTemplateEditModal`) — staty přes `<EntitySchemaForm schema={bestieSchema}>` (prep-A engine)
- Drop `PreviewTemplateModal` import flow (nahrazeno klonováním)
- Drop „Vytvořit z šablony" → Character creation (nebyl součást 8.4 FE; pokud byl, drop)
- Existing `useUploadImage`, drag&drop abilities, soft-delete + koš + restore — **zachovat**

**Hooks:**
- `useBestiar(worldId, systemId)` — replace existing `useNpcTemplates(worldId)`
- `useBestieMutations()` — replace existing mutation hooks

**API klient:**
- `bestiarApi.ts` — replace `npcTemplatesApi.ts`; endpointy renamed; `list/get/create/update/delete/clone`

#### FE — Removal: CreateCharacterModal flow A

8.4 mělo cestu A: NPC postava se vytváří přes `CreateCharacterModal` s import šablony.

⚠️ **Verify before drop:** zkontrolovat zda `CreateCharacterModal` má branch „import z NpcTemplate". Pokud ano, dropnout import sekci; NPC postavy se tvoří jako PC (manual input + Pages route s `kind:'persona', isNpc:true`).

🚨 **Pokud Pages UI 9.1 neumožňuje vytvořit Character{isNpc:true}** — což si musím ověřit v plán fázi — pak musíme:
- A) Doplnit Pages UI o `isNpc` toggle při create (pravděpodobně už existuje)
- B) Ponechat zúženou variantu CreateCharacterModal pro NPC creation (bez import sekce)

Plán fáze C0 = ověřit + rozhodnout.

### Mimo scope

- Spawn z bestiáře do scény UI palette — to je 10.2d
- System bestiarium seed (oficiální D&D MM, CoC) — separate curation
- Import externí formáty (D&D Beyond) — future
- User bestiář sharing — future
- Bestie statblok overlay v boji — 10.2e
- Advanced abilities (damage formulas) — defer 10.2f+

## 3. Klíčová rozhodnutí

### 3.1 Rename strategy — full rename + git mv

Filesystem `git mv backend/src/modules/npc-templates backend/src/modules/bestiae`. Mongo collection rename = migrace skript (`db.npcTemplates.renameCollection('bestiae')` + index recreate).

⚠️ **Risk**: existing tokeny s `templateId` ref na npcTemplate id — id stays same (just collection rename), ale token.templateId field zůstává platný. Pokud production tokeny ještě nejsou (10.2 not deployed), žádný problém.

### 3.2 Migrace existing dat

Aktuální data v `npcTemplates`:
- Production volume: minimal (8.4 hotové 2026-05-23, ne masově plněné)
- Migrace skript `migrate-npc-templates-to-bestiae.js`:
  ```js
  db.npcTemplates.find().forEach(doc => {
    const scope = doc.worldId ? 'world' : 'system';
    const systemStats = {
      'health.max': doc.maxHp,
      'health.current': doc.maxHp,
      'health.base': doc.maxHp,
      'armor': doc.armor,
      'injury': doc.injury,
      'movement': doc.movement,
      'initiative.base': doc.initiativeBase,
      'initiative.current': doc.initiativeBase,
    };
    db.bestiae.insertOne({
      ...doc,
      scope, systemId: 'drd2', systemStats,
      maxHp: undefined, armor: undefined, injury: undefined, movement: undefined, initiativeBase: undefined,
      diarySchema: undefined, diaryData: undefined, originTemplateId: undefined,
    });
  });
  db.npcTemplates.drop();
  ```
- Run jako jednorázový script při deploy

### 3.3 Drop diarySchema / diaryData

Existing 8.4 NpcTemplate má `diarySchema` (pole pro deníkové bloky) a `diaryData` (default deník data). Bestie nemá deník → drop. Pokud existing data obsahují deníkové info, drop = data loss.

⚠️ User confirmation: v 8.4 deníkové bloky v npcTemplate byly pro „výchozí staty Character{isNpc:true}". Pokud tato data jsou irelevantní (NPC postavy se nově tvoří přes Pages UI, nepoužívají NpcTemplate jako zdroj), data loss je OK.

🔀 **Alt zvažováno**: zachovat diarySchema/diaryData v bestii pro „pokud někdo chce přepojit bestii na NPC postavu". Zamítnuto — kontradiktorní s clean separation. Bestie je bestie.

### 3.4 Spawn-on-map flow

`POST /maps/:sceneId/operations { type: 'token.add', token: { isNpc:true, templateId: bestieId, q, r } }`. BE handler:
1. Validate authorization (PJ+ pro spawn)
2. Lookup bestie podle templateId
3. Authorize read na bestii (visibility query check)
4. Snapshot `systemStats` z bestie do tokenu (kopie, ne ref)
5. Set `instanceName` (auto-numbered: "Goblin #1", "Goblin #2", ...)
6. Validate via `SystemStatsValidator` (mirror current world.system schema)
7. Append do `scene.tokens`

⚠️ **Open Q**: pokud bestie je `scope='user'` (PJovo), ale spawnuje se ve světě X kde PJ není owner — visibility query odmítne. **Návrh**: visibility povolí user-scope vlastní PJovi (ownerUserId=current), takže PJ může do svých světů spawnnout bestie ze svého personal pool. To je vlastně cíl user scope.

### 3.5 Migrace route `adresar-postav` → `bestiar`

8.4 route `/svet/:worldId/admin/adresar-postav` se přesouvá do **PJ top-nav** (ne admin sub-page) jako `/svet/:worldId/bestiar`. Důvod: bestiář je primary PJ tool, ne admin nastavení. Visibility gate `>= PomocnyPJ`.

Existing redirect: starý URL → nový (next 30 dní pro user bookmarks; pak drop).

### 3.6 NPC postava cesta (mimo prep-B scope, ale ovlivňuje)

Po prep-B refactoru: NPC postavy se tvoří **přes Pages UI 9.1** (krok `Page` s `kind:'persona', isNpc:true`).

⚠️ **Verify** v plán fázi (C0):
- Existuje v Pages UI `isNpc` toggle při create?
- Pokud ne, je to mírný blocker — Pages UI rozšíření je samostatný side-task (~1 commit)

Pokud blocker, dodáme **prep-B-extension**: krátké rozšíření CreateCharacterModal/PagesPage o `isNpc` toggle při create. Mimo prep-B core, ale součást migration plan.

## 4. Datový model

```ts
// FE: src/features/world/bestiar/types.ts
export type BestieScope = 'system' | 'user' | 'world';

export interface Bestie {
  id: string;
  scope: BestieScope;
  systemId: string;
  ownerUserId?: string;
  worldId?: string;
  name: string;
  imageUrl?: string;
  notes: string;
  abilities: Array<{ label: string; value: string }>;
  systemStats: Record<string, unknown>;
  clonedFromId?: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BestiarResponse {
  system: Bestie[];
  user: Bestie[];
  world: Bestie[];
}

export interface CreateBestiePayload {
  scope: 'user' | 'world';
  systemId: string;
  worldId?: string;
  name: string;
  imageUrl?: string;
  notes?: string;
  abilities?: Array<{ label: string; value: string }>;
  systemStats: Record<string, unknown>;
}

export interface CloneBestiePayload {
  scope: 'user' | 'world';
  worldId?: string;
  newName?: string;
}
```

## 5. Soubory (refactor + nové)

```
# BE — RENAME
backend/src/modules/npc-templates/  → backend/src/modules/bestiae/
├─ schemas/npc-template.schema.ts  → bestie.schema.ts (schema refactor)
├─ interfaces/                      → interfaces/ (rename types)
├─ repositories/                    → repositories/
├─ dto/                             → dto/ (add Clone DTO; refactor Create/Update)
├─ npc-templates.controller.ts      → bestiae.controller.ts
├─ admin-npc-templates.controller.ts → admin-bestiae.controller.ts
├─ npc-templates.service.ts         → bestiae.service.ts (refactor — visibility, clone, drop createFromTemplate)
├─ npc-templates.module.ts          → bestiae.module.ts
└─ npc-templates.service.spec.ts    → bestiae.service.spec.ts (full rewrite — testy refactored flow)

# BE — NEW
backend/src/migrations/
└─ migrate-npc-templates-to-bestiae.ts  # data migrace skript

# BE — MODIFIKACE
backend/src/modules/maps/operations/map-operations.service.ts
  # token.add handler — bestie snapshot logic

# FE — RENAME
src/features/world/pages/NPCDirectoryPage/  → src/features/world/pages/BestiarPage/
├─ NPCDirectoryPage.tsx             → BestiarPage.tsx
├─ NPCDirectoryPage.module.css      → BestiarPage.module.css
├─ AdminGlobalNpcPage.tsx           → AdminGlobalBestiarPage.tsx
├─ components/                      → components/ (rename komponent files)
│  ├─ NpcTemplateEditModal.tsx     → BestieEditorModal.tsx (use EntitySchemaForm)
│  ├─ PreviewTemplateModal.tsx     → DROP (nahrazeno klonováním)
│  └─ ... ostatní rename
├─ api/                             → api/ (bestiarApi.ts)
├─ utils/                           → utils/
└─ __tests__/                       → __tests__/ (refactor)

# FE — NEW
src/features/world/bestiar/
├─ types.ts                         # Bestie typy
├─ hooks/
│  ├─ useBestiar.ts                 # 3-tab query
│  ├─ useBestieMutations.ts
│  └─ useCurrentWorldSystem.ts
└─ components/
   └─ CloneBestieModal.tsx           # nový clone modal

# FE — MODIFIKACE
src/features/world/router.tsx        # routes rename
src/features/world/components/TopNav.tsx  # link Bestiář pro PJ+
src/features/world/components/CreateCharacterModal.tsx  # drop „import šablony" sekce pokud existuje
```

## 6. Bezpečnost

- BE visibility query autoritativní; klient nedostane out-of-scope bestii
- Authorize per scope v service (jako spec-prep-B-old §3.5)
- Migrace skript — admin-only run, žádné API exposure
- File upload prochází existing `files` modul s auth
- `systemStats` validate proti prep-A schema (strict mode reject unknown)
- Spawn-on-map gate: PJ+ + visibility check pro source bestii

## 7. Testovací scénáře

### BE Unit

- `bestiae.service.spec.ts` refactored:
  - Visibility 3-scope filter
  - Create user/world s authorization
  - Clone system→user/world
  - Drop test pro createFromTemplate (test now expects 404 nebo deprecated)
  - Validate systemStats invalid → 400

### BE E2E

- POST /api/bestiae → 201
- GET /api/bestiae?systemId=&worldId= → respekuje visibility
- Lifecycle create → update → soft-delete → restore → hard-delete
- Clone system → user → kopie

### BE Migration

- Mock data set s mix worldId null/value → run migration → verify bestiae collection has correct scope/systemStats shape

### FE Unit

- `useBestiar` — query klíče, refetch
- `BestiarPage` — 3 taby, search, akce
- `BestieEditorModal` — `<EntitySchemaForm>` integration
- `CloneBestieModal` — scope/world selector

### FE Integration

- Render BestiarPage s mock data → 3 taby
- Klik Vytvořit → modal → save → list refresh
- Klik Klonovat system → user → user tab new entry

### FE Migration (rename)

- Old route redirect to new route
- Old component imports updated everywhere

## 8. Open questions

1. **CreateCharacterModal — má import flow A?** Verify v C0; pokud ano, drop tu sekci.
2. **Pages UI 9.1 podporuje `isNpc` toggle při create?** Verify v C0; pokud ne, mini extension (1 commit, asi mimo prep-B scope nebo na samém konci).
3. **Existing tokens s `templateId` ref** — ověřit, jestli production data existují. Pokud ano, migrace ID-preserving = OK (collection rename zachová `_id`).
4. **`scope='system'` migrace** — existing global npcTemplates (worldId=null) jsou typicky admin-created. Mapování na `scope='system'` znamená že obyčejný PJ je nemůže editovat — to bylo i v 8.4 (admin endpoint). OK.
5. **Backward compat URL** — staré bookmarks na `/svet/:id/admin/adresar-postav` → redirect na `/svet/:id/bestiar` (30 dní, pak drop).
6. **Per-world bestie sharing mezi sebou** — bestie scope='world' viditelná jen členům daného světa. World A vs World B mají separate bestiae. PJ s user-scope může nosit napříč.

## 9. Akceptační kritéria

- [ ] BE `bestiae` modul (rename z `npc-templates`)
- [ ] Schema refactored (3-scope, systemStats, drop diary/origin fields)
- [ ] Migrace skript funguje (mock data → bestiae collection)
- [ ] Visibility query 3-scope
- [ ] CRUD endpointy + authorization
- [ ] Clone endpoint
- [ ] BE `token.add` handler integrate bestie snapshot
- [ ] FE `BestiarPage` (rename z `NPCDirectoryPage`)
- [ ] 3 taby s daty + search + akce
- [ ] `BestieEditorModal` používá `<EntitySchemaForm>` z prep-A
- [ ] `CloneBestieModal` scope selector
- [ ] Route rename + redirect
- [ ] Top-nav link Bestiář (PJ+ gate)
- [ ] CreateCharacterModal — drop import flow (pokud existoval)
- [ ] 40+ testů zelených (BE + FE)
- [ ] tsc -b + vite build clean, BE tsc + lint clean
- [ ] Migrace skript ověřen (mock data set)
- [ ] mobil + desktop layouts (skill `mobil-desktop`)
- [ ] Nápověda update (skill `napoveda` — bestiář jako primary PJ tool)
- [ ] Roadmap-fe: 8.4 sekce update s odkazem na refactor v 10.2d-prep-B
