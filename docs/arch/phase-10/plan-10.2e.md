# Plan 10.2e — Staty tokenu

**Spec:** [`spec-10.2e.md`](spec-10.2e.md) (varianta A: HTML modal)
**Status:** 📝 návrh — čeká na schválení
**Velikost:** **M-L** (~10 nových souborů, ~3 modifikace, ~15 testů)

---

## 1 — Pořadí commitů

| Commit | Co | Klíčové soubory | Závisí na |
|---|---|---|---|
| **C1** | `tokenIsBestie` helper + types refinement | `utils/tokenIsBestie.ts` | — |
| **C2** | `TokenHpBar` PixiJS render v `TokenSprite` | `tokens/TokenHpBar.tsx` mod. `TokenSprite.tsx` | C1 |
| **C3** | `TokenStatbarModal` (HTML, EntitySchemaForm editable) | `tokens/TokenStatbarModal.tsx` + CSS | prep-A `EntitySchemaForm` |
| **C4** | `useTokenUpdate` mutation hook (optimistic + invalidate) | `hooks/useTokenUpdate.ts` | C1 |
| **C5** | TacticalMapView wire — selectedTokenId → modal | mod. `TacticalMapView.tsx` | C3, C4 |
| **C6** | BE map-operations.service token.update → character sync | mod. `map-operations.service.ts` | — (BE) |
| **C7** | `PcPalette` v PJ panelu | `pj-panel/PcPalette.tsx` | C1 |
| **C8** | `NpcCharacterPalette` v PJ panelu | `pj-panel/NpcCharacterPalette.tsx` | C1 |
| **C9** | MapPjPanel wire PC + NPC sekce | mod. `MapPjPanel.tsx` | C7, C8 |
| **C10** | Testy (tokenIsBestie, HpBar tier, Modal) | `__tests__/*` | C1, C2, C3 |
| **C11** | Status update + roadmap | `spec-10.2e.md` + `roadmap-fe.md` | C10 |

Velikostně: C3 + C6 nejtěžší (form integrace + BE sync logic). C7/C8 paralelizovatelné.

---

## 2 — Detail změn

### C1 — tokenIsBestie helper

```ts
// utils/tokenIsBestie.ts
export function tokenIsBestie(token: { characterId: string; templateId?: string }): boolean {
  return Boolean(token.templateId) || token.characterId.startsWith('bestie:');
}
```

### C2 — TokenHpBar

Sub-Graphics v `TokenSprite` pod label. Render pokud `combatBehavior='damageable'` field v token.systemStats existuje + má `.current`/`.max`. Bar 24×4px, color tier per percent.

### C3 — TokenStatbarModal

HTML Modal (size='md'), header s avatarem + name + status tag, body `<EntitySchemaForm>` (editable když `canEdit`), footer Cancel/Save. Internal state pro pending changes; save volá `useTokenUpdate.mutate` s patch.

### C4 — useTokenUpdate

```ts
export function useTokenUpdate(sceneId: string, worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { tokenId: string; patch: Partial<MapToken> }) =>
      postMapOperation(sceneId, { type: 'token.update', tokenId: payload.tokenId, patch: payload.patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) }),
  });
}
```

### C5 — TacticalMapView wire

```tsx
{selectedTokenId && scene && (
  <TokenStatbarModal
    token={scene.tokens.find(t => t.id === selectedTokenId)!}
    schema={tokenSchema}
    canEdit={canEditToken(selectedToken)}
    onClose={() => setSelectedTokenId(null)}
  />
)}
```

### C6 — BE character sync v token.update

V `applyAtomic` case `token.update`:
- Po atomic update tokenu, pokud `!tokenIsBestie(token)` a `op.patch.systemStats`:
  - Lookup character (přes characterId) → `charactersService.updatePartialSystemStats(characterId, patch.systemStats)`
  - 1 BE service call inline. Žádná samostatná operation (transparent z FE).

⚠️ **Předpoklad:** `CharactersService.updatePartialSystemStats(id, patch)` existuje nebo bude přidán jako side commit. Pokud Character schema ještě nemá `systemStats` (krok 8.x), defer celý sync — pak token.update jen tokenu, žádný side-effect.

### C7 — PcPalette

```tsx
function PcPalette({ worldId, scene }) {
  const members = useWorldMembers(worldId);
  return (
    <ul>
      {members.data?.filter(m => m.characterPath).map(m => (
        <li key={m.id}>
          <button onClick={() => spawn(m)} disabled={alreadySpawned(m)}>
            + {m.user?.username ?? m.characterPath}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

Spawn: token.add s `characterId` resolved z `member.characterPath` (BE handler resolve characterSlug → characterId).

### C8 — NpcCharacterPalette

Query `Character.where(worldId, isNpc:true, kind:'persona')`. Endpoint: pravděpodobně `GET /api/worlds/:wid/characters?isNpc=true`. Pokud neexistuje, defer (rovnou pages list).

⚠️ **TBD během impl:** zda existing characters API umí filter. Pokud ne, fallback: použít `GET /api/worlds/:wid/pages?kind=persona&isNpc=true`.

### C9 — MapPjPanel wire

Sekce v PJ panelu (vedle existing Bestiar):
```
- Aktivní scény
- Rozmístění hráčů
- PC (NEW)
- NPC postavy (NEW)
- Bestiář — spawn na mapu
```

### C10 — Testy

- `tokenIsBestie.test.ts` (3 testy)
- `TokenHpBar.test.tsx` (4 testy — tier colors)
- `TokenStatbarModal.test.tsx` (4 testy — render, edit, save, read-only)
- `useTokenUpdate.test.ts` (2 testy — mutation + invalidate)

Total ~13 testů.

### C11 — Status + roadmap

`spec-10.2e.md` → ✅ HOTOVO. `roadmap-fe.md` 10.2e odškrtnout.

---

## 3 — Otevřená rozhodnutí

| # | Rozhodnutí | Návrh | Důsledek |
|---|---|---|---|
| 1 | Character sync nyní vs defer | Soft mode: skip pokud `CharactersService.updatePartialSystemStats` neexistuje | Bez sync UX horší (PJ musí ručně updatnout v Pages); akceptováno MVP |
| 2 | NPC palette endpoint | Try characters API; fallback pages filter | Pokud nic, NPC palette skip; defer |
| 3 | Health current/max sync timing | Inline v stejné BE service call | Atomic; pokud sync fail, token.update rollback |

## 4 — Risk register

- **Character.systemStats prázdné** — pokud Character schéma ne-má pole `systemStats` (krok 8.x reload defer), sync skip. MVP impl s try/catch + console.warn.
- **NPC palette neexistuje** — fallback rendering "NPC postavy se tvoří přes Pages" link.
- **HP bar render při schema bez `health.current/max`** — guard: pokud schema neobsahuje `combatBehavior='damageable'`, skip render.

---

**Po dokončení 10.2e**: pokračujeme 10.2f (initiative tracker / combat) nebo image upload edit scény (dluh).
