# Plan 10.2c-edit-1 — Scene Assignment UX + Security audit

**Spec:** [`docs/arch/maps/scene-assignment-ux/`](../../../../Projekt-ikaros/docs/arch/maps/scene-assignment-ux/index.md) (v Projekt-ikaros repu)
**Status:** 📝 návrh — čeká na schválení
**Velikost:** **M** (~4 nové FE soubory, ~6 modifikací, ~12 testů, 1 nová BE op type)

---

## 1 — Pořadí commitů

| Commit | Co | Klíčové soubory | Závisí na |
|---|---|---|---|
| **C1** | BE `assertCanReadScene` v `OperationsAuthorizer` + unit testy | `backend/.../operations-authorizer.service.ts` + `.spec.ts` | — |
| **C2** | BE — guard `GET /maps/:id` (JwtAuthGuard + assertCanReadScene) + integration test | `backend/.../maps.controller.ts` + spec | C1 |
| **C3** | BE — `scene.deactivate` op typ v interface union | `backend/.../interfaces/map-operation.interface.ts` + FE `types.ts` | — |
| **C4** | BE — `scene.deactivate` handler v `MapOperationsService` (atomic + cascade) + tests | `backend/.../operations/map-operations.service.ts` + `.spec.ts` | C3 |
| **C5** | BE — WS broadcast `map:operation` + `world:operation` × N + `map:reassigned` × N | `backend/.../maps.gateway.ts` (nebo příslušný emitter) | C4 |
| **C6** | FE — `ActiveScenesList` redesign (klikatelný řádek + ✕ deactivate + confirm) | `Projekt-ikaros-FE/src/features/world/tactical-map/components/pj-panel/ActiveScenesList.tsx` + CSS | C3 (FE union), C5 (WS) |
| **C7** | FE — `MapEmptyState` redesign (fetch postav, render karet, WS listener) | `Projekt-ikaros-FE/.../components/MapEmptyState.tsx` + CSS | C5 |
| **C8** | FE — `useReassignmentListener` update (handle `newSceneId: null` → invalidace active scene query) | `Projekt-ikaros-FE/.../hooks/useReassignmentListener.ts` | C7 |
| **C9** | Testy FE (ActiveScenesList klik + deactivate confirm; MapEmptyState render postav; useReassignmentListener `null` branch) | `__tests__/*` | C6, C7, C8 |
| **C10** | Status update — memory `project_takticka_mapa_assignment` doplnit poznámku o gate audit; roadmap mark 10.2c-edit-1 done | memory + `roadmap-fe.md` | C9 |

Velikostně: **C4 + C5** nejtěžší (cascade + multi-channel WS). **C1 + C2** quick wins.

---

## 2 — Detail změn

### C1 — `assertCanReadScene`

```ts
// backend/src/modules/maps/operations/operations-authorizer.service.ts
async assertCanReadScene(user: RequestUser, scene: MapScene): Promise<void> {
  // Admin+Superadmin globální bypass — konzistence s assertCanManage
  if (user.role <= UserRole.ADMIN) return;

  const membership = await this.membershipRepo.findOne({
    userId: user.id,
    worldId: scene.worldId,
  });

  if (!membership) {
    throw new ForbiddenException({
      code: 'MAP_FORBIDDEN_OTHER_SCENE',
      message: 'Tuto scénu nemáš přiřazenou',
    });
  }

  // PJ ve světě → ✓
  if (user.role <= UserRole.PJ) return;

  // Hráč — jen vlastní currentSceneId
  if (membership.currentSceneId === scene.id) return;

  throw new ForbiddenException({
    code: 'MAP_FORBIDDEN_OTHER_SCENE',
    message: 'Tuto scénu nemáš přiřazenou',
  });
}
```

Unit testy pokrývají 8 scénářů z `tests.md`.

### C2 — `GET /maps/:id` guard

```ts
@Get(':id')
@UseGuards(JwtAuthGuard)
async findById(
  @Param('id') id: string,
  @CurrentUser() user: RequestUser,
) {
  const scene = await this.mapsRepo.findById(id);
  if (!scene) {
    throw new NotFoundException({ code: 'MAP_SCENE_NOT_FOUND', message: 'Scéna nenalezena' });
  }
  await this.authorizer.assertCanReadScene(user, scene);
  return this.service.findById(id);  // enriched
}
```

### C3 — Op type v union

**BE** `interfaces/map-operation.interface.ts`:
```ts
| { type: 'scene.deactivate' }
```

**FE** `tactical-map/types.ts` — stejný přírůstek do FE union.

**Inverse type** (pro 10.2m, neimplementuje se teď, jen rezervujeme jméno):
```ts
| { type: 'scene.activate-with-members'; previousMemberIds: string[] }
```

### C4 — `scene.deactivate` handler

```ts
// map-operations.service.ts case 'scene.deactivate':
case 'scene.deactivate': {
  await this.authorizer.assertCanManageScene(user, scene);

  // Atomic CAS: aktivní → neaktivní, jinak no-op
  const updateResult = await this.mapsRepo.atomicSetInactive(scene.id);
  if (!updateResult.modified) {
    return { applied: false, seqNumber: scene.lastSeqNumber ?? 0 };
  }

  // Cascade unassign — najdi memberships
  const memberships = await this.membershipRepo.findByWorldAndScene(
    scene.worldId,
    scene.id,
  );
  const affectedUserIds = memberships.map(m => m.userId);

  // Pro každého: atomic unassign + world op
  for (const memb of memberships) {
    await this.membershipRepo.atomicUnsetCurrentScene(memb.userId, scene.worldId, scene.id);
    await this.worldOps.append(scene.worldId, {
      type: 'member.unassign',
      userId: memb.userId,
    }, user.id);
  }

  // Per-scene log
  const opEntry = await this.opsLog.append(scene.id, {
    type: 'scene.deactivate',
    affectedUserIds,
  }, user.id);

  // WS broadcasts
  this.emitMapOperation(scene.id, opEntry);
  for (const userId of affectedUserIds) {
    this.emitMapReassigned(userId, { newSceneId: null });
  }
  // world:operation eventy už emitl worldOps.append

  return { applied: true, seqNumber: opEntry.seqNumber, affectedUserIds };
}
```

### C5 — WS broadcasts

V `maps.gateway.ts` (nebo dedicated emitter service):

- `emitMapOperation(sceneId, op)` → existuje, jen volat
- `emitMapReassigned(userId, payload)` → existuje (z `member.assignToScene`), jen reuse
- `emitWorldOperation(worldId, op)` → existuje

Žádný nový kanál, jen sloučení existujících.

### C6 — `ActiveScenesList` redesign

```tsx
// pj-panel/ActiveScenesList.tsx
import { useConfirm } from '@/shared/ui';
import { useMyMembership } from '../../hooks/...';

export function ActiveScenesList({ worldId }: Props) {
  const { scenes } = useActiveScenes(worldId);
  const myMembership = useMyMembership(worldId);  // existuje?
  const assignMutation = useAssignToScene(worldId);
  const deactivateMutation = useDeactivateScene(worldId);
  const confirm = useConfirm();

  return (
    <ul className={styles.list}>
      {scenes.map(scene => {
        const isCurrent = myMembership?.currentSceneId === scene.id;
        return (
          <li
            key={scene.id}
            className={cn(styles.item, isCurrent && styles.itemCurrent)}
            aria-current={isCurrent ? 'true' : undefined}
          >
            <button
              className={styles.row}
              onClick={() => !isCurrent && assignMutation.mutate({ userId: 'self', sceneId: scene.id })}
              disabled={isCurrent}
            >
              <span className={styles.name}>{scene.name}</span>
              {isCurrent && <span className={styles.badge}>Zde jsem</span>}
            </button>
            <button
              className={styles.deactivate}
              aria-label="Deaktivovat scénu"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Deaktivovat scénu?',
                  body: 'Tato scéna přestane být aktivní a všichni přiřazení hráči ji ztratí. Pokračovat?',
                  confirmLabel: 'Deaktivovat',
                  variant: 'danger',
                });
                if (ok) deactivateMutation.mutate(scene.id);
              }}
            >
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  );
}
```

Nový hook `useDeactivateScene(worldId)`:
```ts
const qc = useQueryClient();
return useMutation({
  mutationFn: (sceneId: string) =>
    postMapOperation(sceneId, { type: 'scene.deactivate' }),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: activeScenesQueryKey(worldId) });
  },
});
```

### C7 — `MapEmptyState` redesign

```tsx
// components/MapEmptyState.tsx
export function MapEmptyState({ worldId }: { worldId: string }) {
  const { data: characters } = useMyCharactersInWorld(worldId);

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>PJ ti ještě nepřiřadil scénu</h2>
      <p className={styles.lead}>
        Až tě PJ přiřadí, scéna se objeví automaticky. Mezitím můžeš zkontrolovat své postavy:
      </p>

      {characters && characters.length > 0 ? (
        <ul className={styles.cards}>
          {characters.map(c => (
            <li key={c.id} className={styles.card}>
              <img src={c.portraitUrl} alt="" className={styles.portrait} />
              <div>
                <div className={styles.name}>{c.name}</div>
                {c.summary && <div className={styles.summary}>{c.summary}</div>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>V tomto světě zatím nemáš žádné postavy.</p>
      )}
    </div>
  );
}
```

Nový hook `useMyCharactersInWorld(worldId)`:
```ts
return useQuery({
  queryKey: ['characters', 'mine', worldId],
  queryFn: () => getCharactersByWorld(worldId, { ownerId: 'self' }),  // pokud BE endpoint umí, jinak filter klient-side
  enabled: !!worldId,
});
```

### C8 — `useReassignmentListener` update

Současný kód předpokládá, že `newSceneId` je truthy. Doplnit:

```ts
const handler = (payload: { newSceneId: string | null }) => {
  if (payload.newSceneId === null) {
    // Hráč byl unassign → invalidace active scene query → empty state
    qc.invalidateQueries({ queryKey: activeMapSceneQueryKey(worldId) });
    return;
  }
  // Existující path
  navigate(`/svet/${worldId}/takticka-mapa`);
  qc.invalidateQueries({ queryKey: activeMapSceneQueryKey(worldId) });
};
```

### C9 — Testy

| Test | Soubor | Co kryje |
|---|---|---|
| `assertCanReadScene` × 8 scénářů | `operations-authorizer.spec.ts` | C1 unit |
| `GET /maps/:id` 401/403/200 | `maps.controller.spec.ts` | C2 integration |
| `scene.deactivate` happy path | `map-operations.service.spec.ts` | C4 |
| `scene.deactivate` no-op idempotent | `map-operations.service.spec.ts` | C4 |
| `scene.deactivate` cascade WS | `maps.gateway.spec.ts` | C5 |
| `ActiveScenesList` render + klik | `ActiveScenesList.spec.tsx` | C6 |
| `ActiveScenesList` deactivate confirm | `ActiveScenesList.spec.tsx` | C6 |
| `MapEmptyState` postavy render | `MapEmptyState.spec.tsx` | C7 |
| `MapEmptyState` zero state | `MapEmptyState.spec.tsx` | C7 |
| `useReassignmentListener` newSceneId=null | `useReassignmentListener.spec.ts` | C8 |

### C10 — Status update

- Memory `project_takticka_mapa_assignment` → doplnit "GET /maps/:id má JwtAuthGuard + assertCanReadScene od 10.2c-edit-1"
- `roadmap-fe.md` → 10.2c-edit-1 ✅

---

## 3 — Commit messages template

```
feat(10.2c-edit-1): <co> — <proč krátce>
```

Příklady:
- `feat(10.2c-edit-1): assertCanReadScene authorizer + tests`
- `feat(10.2c-edit-1): GET /maps/:id guard — JwtAuthGuard + assertCanReadScene`
- `feat(10.2c-edit-1): scene.deactivate op + cascade unassign`
- `feat(10.2c-edit-1): ActiveScenesList klikatelný + deactivate confirm`
- `feat(10.2c-edit-1): MapEmptyState redesign — postavy hráče`

---

## 4 — Pre-flight check

- [ ] Memory `feedback_be_precommit_prettier` — před BE commitem `prettier --write`
- [ ] Memory `feedback_be_restart_required` — BE restart po každé serverside změně (atomic update test)
- [ ] Commit přímo na `main` (memory `feedback_work_on_main`)
- [ ] Mobil + desktop ověření (skill `mobil-desktop`) po C6/C7
- [ ] Nápověda update (skill `napoveda`) po dokončení — UI změna v PJ panelu

---

## 5 — Otevřené body k vyřešení během C1/C2

1. **Existence `assertCanManage` admin bypass** — ověřit zda Admin+Superadmin tam má bypass přes role check nebo přes membership. `assertCanReadScene` musí být konzistentní.
2. **`useMyMembership(worldId)`** hook — existuje ve FE? Jinak vytvořit (využije `GET /worlds/:id/members/me` nebo cache z worldStub).
3. **`useConfirm()` ze shared/ui** — existuje? Pokud ne, vytvořit `ConfirmModal` komponentu (sdílí s plánem 10.2c-edit-2).
