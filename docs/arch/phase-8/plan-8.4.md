# Plán 8.4 — NPC šablony + bestiář + dluhy

> **Stav:** návrh — Auto Mode pokračuje • **Datum:** 2026-05-23
> Spec: [spec-8.4.md](spec-8.4.md) (vč. §12 EXTENDED)
> Workflow: spec ✅ → **plán (zde)** → kód

---

## 0. Zjištění z auditu (vstup do plánu)

| # | Zjištění | Dopad |
|---|---|---|
| Z-1 | BE `npc-templates` modul kompletní + má testy; chybí jen `movement` / `initiativeBase` v DTO. | Krok B1 = drobný patch. |
| Z-2 | BE `importToWorld` slepě kopíruje libovolnou šablonu (i z cizího světa). | Krok B2 = guard `tpl.worldId !== null → 403`. |
| Z-3 | Schéma `NpcTemplate` nemá `deletedAt` → hard delete. | Krok B3 = soft-delete + repo filtry + restore + trash + hard. |
| Z-4 | Globální `worldId=null` šablonu dnes nelze přes API vytvořit (controller pod `:worldId`). | Krok B4 = `AdminNpcTemplatesController` pod `/admin/npc-templates`. |
| Z-5 | FE `useUploadContentImage` v `features/ikaros/api/`, používá 12 souborů napříč `features/world` i jinde. | Krok F0 = přesun do `shared/api/useUploadImage` + update 12 importů. |
| Z-6 | FE má `Tabs`, `ConfirmDialog`, `Modal`, `Button`, `Input`, `Badge`, `UserAvatar` v `shared/ui`. | Reuse, žádné nové sdílené UI. |
| Z-7 | `NPCDirectoryPage` je dnes pouhý stub (`WorldStubPage area="npc-directory"`). Existuje 4 další stuby (`WorldStubPage` pořád ponechán). | Krok F4 = přepsat na složku. Stub komponentu **neodstraňovat** — jiné stránky ji pořád používají. |
| Z-8 | Route `/svet/:slug/admin/adresar-postav` v `router.tsx:263-273` má `WorldMembershipGuard PJ` + Sa/Admin fallback. Existující — beze změny. | Krok F4 nemění routing. |
| Z-9 | Pro D-NPC-5 chybí route `/ikaros/administrace/npc-bestiar`. Sa/Admin section v router.tsx existuje. | Krok F8 přidá route. |
| Z-10 | `useUploadContentImage` neukládá `worldId` — upload je multi-tenant uniformní. Žádný refactor BE nutný. | F0 = jen FE rename. |
| Z-11 | BE má v repu uncommitted změny v `character-subdocs/*` od jiné práce. | Commit BE musí stage **explicitně jen `npc-templates`** soubory. |

---

## 1. Pořadí implementace

```
B1  BE: movement + initiativeBase v DTO/controller
B2  BE: importToWorld guard worldId === null
B3  BE: soft-delete + restore + trash + hard delete
B4  BE: AdminNpcTemplatesController + service.*Global metody
B5  BE: testy
─── commit BE ───
F0  FE: useUploadImage shared + migrace 12 importů
F1  FE: typy npcTemplates.types
F2  FE: API hooks
F3  FE: ikony/utilities (statRow helper, defaults)
F4  FE: NPCDirectoryPage složka — page + tabs + search
F5  FE: NpcTemplateCard
F6  FE: NpcTemplateModal (s D&D abilities)
F7  FE: ImportConfirmModal + PreviewTemplateModal
F8  FE: TrashTab (soft-delete UI) + restore/hard hooks
F9  FE: GlobalNpcAdminPage + route v Administraci
F10 FE: testy
F11 mobil-desktop + napoveda + roadmap + dluh.md
─── commit FE ───
```

---

## 2. BE kroky (B1–B5)

Repo: `C:\Matrix\ProjektIkaros\Projekt-ikaros\backend` (main). Stage explicitně jen `src/modules/npc-templates/**`.

### B1 — DTO movement + initiativeBase

Soubory:
- `dto/create-npc-template.dto.ts`
- `dto/update-npc-template.dto.ts`
- `npc-templates.controller.ts` (update mapping)

### B2 — Import guard

Soubor: `npc-templates.service.ts:importToWorld` — přidat throw na ne-null `tpl.worldId`.

### B3 — Soft-delete

- `schemas/npc-template.schema.ts`: `@Prop deletedAt: Date | null`.
- `interfaces/npc-template.interface.ts`: `deletedAt: Date | null`.
- `interfaces/npc-templates-repository.interface.ts`: rozšířit o `findDeletedByWorld(worldId)`.
- `repositories/npc-templates.repository.ts`:
  - `findByWorld` → `{ worldId, deletedAt: null }`.
  - `findGlobal` → `{ worldId: null, deletedAt: null }`.
  - `findById` → bez filtru `deletedAt` (kvůli restore).
  - `findDeletedByWorld(worldId)` → `{ worldId, deletedAt: { $ne: null } }` (PJ může listovat svůj koš). Pro `worldId === null` → global trash, ale to využije až admin controller.
  - `findDeletedGlobal()` → `{ worldId: null, deletedAt: { $ne: null } }`.
- `service.ts`:
  - `remove(id, worldId)` → soft (update `deletedAt: new Date()`).
  - `restore(id, worldId)` → update `deletedAt: null`. NotFound když entity neexistuje nebo `deletedAt === null`.
  - `hardRemove(id, worldId)` → `repo.deleteByIdAndWorld`.
  - `findDeleted(worldId)` → `repo.findDeletedByWorld`.
- `controller.ts`:
  - `GET /trash` → `findDeleted(worldId)`.
  - `POST /:id/restore` → `restore`.
  - `DELETE /:id/hard` → `hardRemove`.
  - Pořadí dekorátorů: PJ+ guard přes `assertCanManage`.

### B4 — AdminNpcTemplatesController

Soubor: `admin-npc-templates.controller.ts` (nový).

```ts
@Controller('admin/npc-templates')
@UseGuards(JwtAuthGuard)
class AdminNpcTemplatesController {
  @Get() findAllGlobal()          // jen worldId=null, deletedAt: null
  @Get('trash') findTrashGlobal() // jen worldId=null, deletedAt: { $ne: null }
  @Get(':id') findOneGlobal(id)
  @Post() createGlobal(dto, user)
  @Put(':id') updateGlobal(id, dto, user)
  @Delete(':id') removeGlobal(id, user)         // soft
  @Post(':id/restore') restoreGlobal(id, user)
  @Delete(':id/hard') hardRemoveGlobal(id, user) // trvalé
}
```

Guard přes service.assertGlobalAdmin: `userRole > UserRole.Admin → 403`.

Service rozšíření: `createGlobal/updateGlobal/removeGlobal/restoreGlobal/hardRemoveGlobal/findDeletedGlobal/findOneGlobal` — všechny constraintnuté na `worldId === null`.

Module registrace: `npc-templates.module.ts` přidat `AdminNpcTemplatesController` do `controllers`.

### B5 — Testy

`npc-templates.service.spec.ts` — rozšířit:
- ✅ `movement` / `initiativeBase` create + update.
- ✅ Import guard 403 pro non-null worldId.
- ✅ Soft-delete: `remove` nastaví `deletedAt`, `findAll` ji nevrátí.
- ✅ Restore: `restore` smaže `deletedAt`.
- ✅ Hard delete: `hardRemove` reálně smaže.
- ✅ Restore na ne-smazané entity → NotFound.
- ✅ Global: `createGlobal` ukládá `worldId: null`.
- ✅ Global admin guard: ne-admin → 403.

---

## 3. FE kroky (F0–F11)

Repo: `C:\Matrix\ProjektIkaros\Projekt-ikaros-FE` (main).

### F0 — Shared upload hook

- Vytvořit `src/shared/api/useUploadImage.ts` (= obsah starého `useUploadContentImage`).
- `src/shared/api/index.ts` přidat `export { useUploadImage } from './useUploadImage'` + `export type { UploadImageResult }`.
- 12 souborů: změnit import na `import { useUploadImage } from '@/shared/api'`. Rename volání `useUploadContentImage()` → `useUploadImage()`.
- Smazat `src/features/ikaros/api/useUploadContentImage.ts`.
- Update mocks v `__tests__` souborech (vi.mock path).

### F1 — Typy

`src/features/world/pages/NPCDirectoryPage/api/npcTemplates.types.ts` — viz spec §3.1 + přidat `deletedAt: string | null`.

### F2 — Hooky

`src/features/world/pages/NPCDirectoryPage/api/`:

- `useNpcTemplates.ts` — list aktivních world šablon (filtr `!t.deletedAt` na FE jako safety).
- `useGlobalNpcTemplates.ts` — list aktivních global.
- `useDeletedNpcTemplates.ts` — `GET /worlds/:worldId/npc-templates/trash`.
- `useNpcTemplateMutations.ts` — `useCreate`, `useUpdate`, `useDelete` (soft), `useImport`, `useRestore`, `useHardDelete`.
- `useAdminGlobalNpc.ts` — `useGlobalList`, `useGlobalDeletedList`, `useGlobalCreate`, `useGlobalUpdate`, `useGlobalDelete`, `useGlobalRestore`, `useGlobalHardDelete`.

Cache klíče:
- `['npc-templates', worldId]` — aktivní world.
- `['npc-templates', worldId, 'trash']` — koš world.
- `['npc-templates', 'global']` — aktivní global.
- `['npc-templates', 'global', 'trash']` — koš global.

### F3 — Utility

`src/features/world/pages/NPCDirectoryPage/utils/`:
- `normalize.ts` — diacritic strip (kopie z `CharactersPage/utils/normalize.ts` nebo lift do `shared/utils/`).
- `statDefaults.ts` — `{ maxHp: 5, armor: 0, injury: 0, movement: 5, initiativeBase: 0, abilities: [], notes: '' }`.
- `statIcons.tsx` — mapping pole → lucide ikona (Heart, Shield, HeartCrack, Footprints, Zap).

### F4 — NPCDirectoryPage

`src/features/world/pages/NPCDirectoryPage/NPCDirectoryPage.tsx`:
- `useSearchParams()` na `tab`, `q`.
- Tři taby: `Mé šablony`, `Globální bestiář`, `Koš` (poslední skryt pokud trash list je prázdný).
- Search input nad gridem.
- „Importováno" Set z `worldTemplates.map(t => t.originTemplateId).filter(Boolean)`.
- Akce na global kartě: click → preview modal, button → import confirm.
- Akce na world kartě: click → edit modal, kebab → smazat (soft).
- Akce na trash kartě: `[ ↶ Obnovit ]` + `[ ⨯ Smazat trvale ]`.

### F5 — NpcTemplateCard

`components/NpcTemplateCard.tsx` + `.module.css`:
- Props: `template`, `variant: 'world' | 'global-bestiary' | 'trash'`, `onClick?`, `onAction?`.
- Layout viz spec §4.5.

### F6 — NpcTemplateModal

`components/NpcTemplateModal.tsx`:
- Props: `open`, `onClose`, `mode: 'create' | 'edit' | 'global-create' | 'global-edit'`, `worldId?` (null pro global), `template?` (pro edit).
- `mode` určuje, kterou mutation použít (přes prop nebo derived).
- D&D abilities editor (HTML5, viz spec §12.2).
- Reuse `useUploadImage`.
- Validace + reset on close.

### F7 — Import + Preview

`components/ImportConfirmModal.tsx` — viz spec §6.
`components/PreviewTemplateModal.tsx` — viz spec §12.3.

### F8 — Trash (uvnitř NPCDirectoryPage)

- Tab „Koš (N)" — viditelný jen pokud `N > 0`.
- Karty mají disabled-look CSS class.
- Hard delete přes `ConfirmDialog danger`.

### F9 — GlobalNpcAdminPage

`src/features/ikaros/pages/GlobalNpcAdminPage/`:
- Page komponenta v admin layoutu.
- Tabs: aktivní + koš (jen pro global).
- Reuse `NpcTemplateCard variant='world'` (přejmenovat na neutrální `'editable'`?) a `NpcTemplateModal mode='global-*'`.
- Route do `router.tsx` pod administrace: `/ikaros/administrace/npc-bestiar` s `PrivateRoute minRole={UserRole.Admin}`.

### F10 — Testy

Per spec §9 + rozšíření o:
- `useGlobalNpcAdmin.spec.ts` — admin endpointy.
- `TrashTab.spec.tsx` (case v `NPCDirectoryPage.spec.tsx`) — restore, hard delete.
- `PreviewTemplateModal.spec.tsx` — render + import button.
- `shared/api/useUploadImage.spec.ts` (migrate existující testy z ikaros location).

### F11 — Audity + dokumentace

- `mobil-desktop` skill na `NPCDirectoryPage` + `GlobalNpcAdminPage` + modaly.
- `napoveda` skill: doplnit do `/ikaros/napoveda` sekci „NPC šablony a bestiář".
- `roadmap-fe.md` — zaškrtnout 8.4 odrážky.
- `dluh.md` — uzavřít D-NPC-1..5 (s odkazem na commit).

---

## 4. Commit strategie

**Memory `feedback_work_on_main.md`:** přímo na main, žádné feature větve.

Dva commity:

1. **BE** v `Projekt-ikaros/`: `feat(npc-templates): movement/init DTO, import guard, soft-delete, admin controller`
   Stage **explicitně** jen `backend/src/modules/npc-templates/**` (jiné staged uncommitted změny v `character-subdocs` nemíchat).

2. **FE** v `Projekt-ikaros-FE/`: `feat(8.4): NPC šablony + bestiář + soft-delete + admin bestiář + shared upload hook`
   Stage všechno nepoškozené (jen 8.4 a navazující).

---

## 5. Rizika a mitigace

| Riziko | Mitigace |
|--------|----------|
| BE testy refaktor break (existing spec) | Kontrolovat po každé fázi, fixovat existující testy v rámci téhož commitu. |
| 12 souborů migrace upload hooku — zapomenutý import | Po migraci `grep useUploadContentImage` musí být 0 hitů. |
| Globální `worldId=null` šablony v existující DB | Žádné nejsou (nezvládnutelné z UI dosud). Migrace bezpečná. |
| `deletedAt` na existujících záznamech | Default `null` přes schema → existující dokumenty se za soft-deleted nepovažují. Bezpečné. |
| Sa/Admin nemá `assertGlobalAdmin` helper | Pokud chybí, použít přímou `userRole <= UserRole.Admin` kontrolu (vzor v existující `assertCanManage`). |
| `Tabs` shared UI — neznámé API | Před F4 přečíst `shared/ui/Tabs`. |
