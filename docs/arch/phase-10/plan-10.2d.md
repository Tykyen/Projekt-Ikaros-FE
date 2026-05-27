# Plan 10.2d — Tokeny (PC + NPC, drag&drop, optimistic move)

**Spec:** [`spec-10.2d.md`](spec-10.2d.md)
**Status:** 📝 návrh — čeká na schválení
**Velikost:** **L** (~14 nových souborů, ~5 modifikací, ~45 unit/integration testů)
**Cíl:** První interaktivní vrstva mapy. Render tokenů (PC + NPC postavy + Bestie) + drag&drop + 3-sekční spawn UI + optimistic move.

**Závisí na:** 10.2d-prep-A (per-system schema engine, `MapToken.systemStats`), 10.2d-prep-B (bestiář CRUD + `useBestiar` hook)

---

## 0 — Pre-implementační rozhodnutí (čeká na vyjasnění před C1)

### 0.1 Permission gate — „moje postava"

⚠️ **Zjištění:** `WorldMembership.characterIds` neexistuje. Členství drží jen `characterPath?: string` (singular path, např. `postavy/jan-novak`).

**Workaround pro MVP** (bez BE zásahu):
- `MapToken.characterSlug` (existuje, z 9.1 sjednocení Page+Character) ← matchneme proti `pathToSlug(member.characterPath)` (poslední segment)
- `useMyCharacterSlugs(worldId): string[]` — derivace `members.find(m.userId === me).characterPath → slug` → singleton array (`[]` pokud bez postavy)
- `useTokenPermissions(token, me, mySlugs, scene)` — `mySlugs.includes(token.characterSlug)` = moje

🔀 **Alternativa:** rozšířit BE `WorldMembership` o `characterIds: string[]`. Defer 10.2e.

📚 **Why workaround OK:** projekt design je _1 primární postava per member per svět_ (charPath singular). Edge case více postav — BE 403 chytí.

### 0.2 NPC postavy zdroj v paletě

NPC postavy = `Character{kind:'persona', isNpc:true}` z Pages (9.1). Potřebujeme `useNpcCharacters(worldId)` hook — list všech NPC postav světa. Pokud takový hook neexistuje, vytvoříme: query `GET /api/pages?worldId=&kind=persona&isNpc=true` (existing endpoint? Ověřit C1).

### 0.3 Spawn default hex

`findFirstFreeHex(tokens, start={q:0,r:0})` — spirálový BFS. Snadná implementace, lepší UX než tupý overlap.

### 0.4 `token.add` payload tvar (post-prep-A)

Po refactoru z prep-A `MapToken.systemStats` je discriminator + payload:
```ts
// PC nebo NPC postava
{ type: 'token.add', token: {
  characterId,  // resolved from characterSlug v BE
  characterSlug,
  isNpc: boolean,  // false = PC, true = NPC postava
  templateId: undefined,  // postavy nemají template
  q, r,
  systemStats: copyFromCharacter(character.systemStats),
  inCombat: false,
}}

// Bestie
{ type: 'token.add', token: {
  characterId: 'bestie:' + bestieId,  // placeholder syntactical id
  characterSlug: '',
  isNpc: true,
  templateId: bestieId,
  q, r,
  systemStats: snapshotFromBestie(bestie.systemStats),  // BE kopíruje
  inCombat: false,
  instanceName: bestie.name + ' #N',  // numbered instance
}}
```

BE `token.add` handler resolves `characterId` z `characterSlug` (PC/NPC) nebo vygeneruje placeholder (bestie). Snapshot logic pro bestii bere staty z `NpcTemplate` BE-side.

---

## 1 — Pořadí commitů (přímo na `main` per [[feedback_work_on_main]])

| Commit | Co | Klíčové soubory | Závisí na |
|---|---|---|---|
| **C1** | Operation patcher idempotency + ordering queue | `applyOperationToScene.ts` mod., `useMapScene.ts` mod., test fixtures | — |
| **C2** | TokenLayer + TokenSprite (render-only) + stagger | `TokenLayer.tsx`, `TokenSprite.tsx`, `tokenStaggerOffset.ts`, `useTokenTexture.ts` | C1 |
| **C3** | Selection state + integrace do TacticalMapView | mod. `TacticalMapView.tsx` | C2 |
| **C4** | useTokenDrag + drag&drop interakce + optimistic move | `useTokenDrag.ts`, `useTokenPermissions.ts`, `useMyCharacterSlugs.ts`, mod. `TokenSprite.tsx` | C3 |
| **C5** | PJ spawn UI sekce 1 — PC: `AddPcTokenButton` + integrace `MemberAssignmentTable` | `AddPcTokenButton.tsx`, mod. `MemberAssignmentTable.tsx`, `findFirstFreeHex.ts` | C4 |
| **C6** | PJ spawn UI sekce 2 — NPC postavy: `NpcCharactersPalette` + `useNpcCharacters` hook | `NpcCharactersPalette.tsx`, `useNpcCharacters.ts` | C4 |
| **C7** | PJ spawn UI sekce 3 — Bestie: `BestiePalette` (čte `useBestiar` z prep-B) | `BestiePalette.tsx` | C4 + prep-B done |
| **C8** | Integrace 3 sekcí do `MapPjPanel` | mod. `MapPjPanel.tsx` | C5, C6, C7 |
| **C9** | Token context menu (right-click → remove) | `TokenContextMenu.tsx`, mod. `TokenSprite.tsx` | C4 |
| **C10** | BE `token.add` resolve enhancement (characterSlug → characterId; bestie snapshot) | mod. `map-operations.service.ts` | C8 |
| **C11** | Tests + mobil-desktop audit + status + roadmap | `__tests__/*`, mod. spec/plan/roadmap | C9, C10 |

**Velikostně:** C2 + C4 jsou nejtěžší (PixiJS sprite + drag math). C1 je drobné, ale critical (idempotency korektnost). C5–C8 jsou paralelizovatelné (3 palette sekce nezávislé). C11 je nejdelší časově (testy).

⚠️ **Žádný commit nesmí pushnout částečnou implementaci** ([[feedback_no_debt]]) — každý commit je end-to-end (kód + případné testy odpovídající scope).

---

## 2 — Detail změn

### C1 — Operation patcher idempotency + ordering queue

**Modifikace `utils/applyOperationToScene.ts`**:
- Přidat early return: `if (op.seqNumber !== undefined && op.seqNumber <= scene.lastSeqNumber) return scene`
- 📚 _Idempotency check: pokud dorazí stejná op víckrát (re-broadcast, optimistic + WS echo), aplikujeme jen jednou._
- ⚠️ Aktuálně signature je `(scene, op)` — rozšíříme na `(scene, op, seqNumber?)` (volitelné, BC).

**Modifikace `hooks/useMapScene.ts`**:
- Mezi WS event listener a setQueryData přidat **op queue** — pole pending ops, seřazené dle `seqNumber`
- Aplikace strictly seqNumber-ordered (skip pokud gap → trigger refetch missing range přes existing `getMapOperationsSince`)
- Optimistic update (z C4 mutation) — apply lokálně se synthetic seqNumber = `scene.lastSeqNumber + 0.5` (neukládá se do scene state; jen marker)

**Test fixtures** (`__tests__/applyOperationToScene.idempotency.test.ts`):
- Same op aplikovaná 2× → state stabilní
- Out-of-order ops (seq 5 přijde před 3) → buffer + apply v pořadí

### C2 — TokenLayer + TokenSprite (render-only)

**Nový `components/tokens/TokenLayer.tsx`**:
```tsx
interface Props {
  tokens: MapToken[];
  config: HexConfig;
  theme: MapThemeColors;
  selectedTokenId: string | null;
  onSelect: (tokenId: string | null) => void;
  canDrag: (token: MapToken) => boolean;
  onMove: (tokenId: string, q: number, r: number) => void;
}
export function TokenLayer({ tokens, config, theme, ... }: Props) {
  const offsets = useMemo(() => computeStaggerOffsets(tokens), [tokens]);
  return (
    <pixiContainer label="tokens-layer">
      {tokens.map(t => (
        <TokenSprite key={t.id} token={t} offset={offsets[t.id]} ... />
      ))}
    </pixiContainer>
  );
}
```

**Nový `components/tokens/TokenSprite.tsx`** (render-only verze v C2; drag callbacks doplníme v C4):
- `Container` z `pixiContainer` v PixiJS v8 idiom
- Position: `axialToPixel(token.q, token.r, size) + origin + staggerOffset`
- Children:
  - `pixiGraphics` ring — `draw` callback per stav (default/selected/active)
  - `pixiSprite` (pokud texture loaded) NEBO `pixiGraphics` fallback kruh + `pixiText` iniciály
  - `pixiText` label pod tokenem
- `eventMode='static'` + `cursor='pointer'` (v C4 přepíšeme dle canDrag)

**Nový `hooks/useTokenTexture.ts`**:
```ts
export function useTokenTexture(imageUrl?: string): {
  texture: Texture | null;
  status: 'idle' | 'loading' | 'loaded' | 'error';
} {
  const [state, setState] = useState({ texture: null, status: 'idle' });
  useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;
    setState(s => ({ ...s, status: 'loading' }));
    Assets.load(resolveImageUrl(imageUrl))
      .then(tex => !cancelled && setState({ texture: tex, status: 'loaded' }))
      .catch(() => !cancelled && setState({ texture: null, status: 'error' }));
    return () => { cancelled = true; };
  }, [imageUrl]);
  return state;
}
```

**Nový `utils/tokenStaggerOffset.ts`**:
```ts
export function computeStaggerOffsets(tokens: MapToken[]): Record<string, Point> {
  const byCell = new Map<string, MapToken[]>();
  for (const t of tokens) {
    const key = `${t.q},${t.r}`;
    if (!byCell.has(key)) byCell.set(key, []);
    byCell.get(key)!.push(t);
  }
  const out: Record<string, Point> = {};
  for (const [, group] of byCell) {
    if (group.length === 1) {
      out[group[0].id] = { x: 0, y: 0 };
      continue;
    }
    const radius = 12; // px
    group.forEach((t, i) => {
      const angle = (i / group.length) * 2 * Math.PI;
      out[t.id] = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
  }
  return out;
}
```

### C3 — Selection state + integrace

**Modifikace `TacticalMapView.tsx`**:
- `const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)`
- Render `<TokenLayer ... selectedTokenId={selectedTokenId} onSelect={setSelectedTokenId} canDrag={() => false} onMove={() => {}} />`
- ESC key listener → deselect
- Klik na canvas backdrop (mimo tokeny) → deselect

⚠️ **C3 nesplňuje akceptaci „drag funguje"** — to přijde v C4. C3 jen integruje render + selection. End-to-end commit ([[feedback_no_debt]]): selection samotná je celá feature.

### C4 — Drag & drop + optimistic move

**Nový `hooks/useTokenDrag.ts`**:
```ts
export function useTokenDrag({ canDrag, onMove, viewport, config }: Args) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const handlePointerDown = (e: PointerEvent, token: MapToken) => {
    if (!canDrag(token)) return;
    setDragState({ token, startQ: token.q, startR: token.r, ghostPos: ... });
  };
  const handlePointerMove = (e) => { /* update ghost */ };
  const handlePointerUp = (e) => {
    const mapaSpace = screenToMapa(e, viewport);
    const { q, r } = pixelToAxial(mapaSpace.x - config.originX, mapaSpace.y - config.originY, config.size);
    onMove(dragState.token.id, q, r);
    setDragState(null);
  };
  // Escape key listener → cancel drag
  return { dragState, handlers: { onPointerDown, ... } };
}
```

**Nový `hooks/useTokenPermissions.ts`**:
```ts
export function useTokenPermissions(
  scene: MapScene | null,
  myUserRole: WorldRole,
  mySlugs: string[],
): (token: MapToken) => boolean {
  return useCallback((token: MapToken) => {
    if (!scene) return false;
    if (scene.isLocked && myUserRole < WorldRole.PomocnyPJ) return false;
    if (
      scene.combat?.isActive &&
      scene.combat.currentTokenId !== token.id &&
      myUserRole < WorldRole.PomocnyPJ
    ) return false;
    if (myUserRole >= WorldRole.PomocnyPJ) return true;
    return mySlugs.includes(token.characterSlug);
  }, [scene, myUserRole, mySlugs]);
}
```

**Nový `hooks/useMyCharacterSlugs.ts`**:
```ts
export function useMyCharacterSlugs(worldId: string, currentUserId: string): string[] {
  const members = useWorldMembers(worldId);
  return useMemo(() => {
    const me = members.data?.find(m => m.userId === currentUserId);
    if (!me?.characterPath) return [];
    const slug = me.characterPath.split('/').pop();
    return slug ? [slug] : [];
  }, [members.data, currentUserId]);
}
```

**Modifikace `TokenSprite.tsx`** (add drag handlers + permission-driven cursor):
- `eventMode='static'`, `cursor={canDrag ? 'grab' : 'not-allowed'}`
- `onPointerDown`, `onPointerMove`, `onPointerUp` napojené z `useTokenDrag`
- Click vs drag detection: pokud `pointerup` bez `move` během N ms / dx → treat jako click (selection); jinak drop

**Optimistic update flow** v `TacticalMapView.tsx`:
- `const moveMutation = useMutation({ mutationFn: postMapOperation, onMutate: optimisticPatch, onError: rollback })`
- `onMove(tokenId, q, r)` → `moveMutation.mutate({ type: 'token.move', tokenId, q, r })`
- onMutate: `queryClient.setQueryData(mapSceneKey, prev => applyOperationToScene(prev, op))` + ulož `context = { previous: prev }`
- onError: `queryClient.setQueryData(mapSceneKey, context.previous)` + toast „Pohyb neuložen"

### C5 — PJ spawn UI

**Nový `utils/findFirstFreeHex.ts`**:
```ts
export function findFirstFreeHex(
  occupiedTokens: MapToken[],
  start: HexCoord = { q: 0, r: 0 },
): HexCoord {
  const occupied = new Set(occupiedTokens.map(t => `${t.q},${t.r}`));
  // Spirálový BFS od start
  const visited = new Set<string>();
  const queue: HexCoord[] = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    const key = `${cur.q},${cur.r}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (!occupied.has(key)) return cur;
    for (const dir of AXIAL_DIRECTIONS) {
      queue.push({ q: cur.q + dir.q, r: cur.r + dir.r });
    }
  }
  return start; // fallback (nikdy nedosáhne)
}
```

**Nový `components/pj-panel/AddPcTokenButton.tsx`**:
```tsx
interface Props {
  member: WorldMembership;
  scene: MapScene;
  worldId: string;
}
export function AddPcTokenButton({ member, scene, worldId }: Props) {
  const mutation = useMutation({
    mutationFn: (op: MapOperation) => postMapOperation(scene.id, op),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) }),
  });
  const handleAdd = () => {
    const { q, r } = findFirstFreeHex(scene.tokens);
    const slug = member.characterPath?.split('/').pop();
    if (!slug) return; // member bez postavy → disable button
    mutation.mutate({
      type: 'token.add',
      token: {
        id: `_pending_${Date.now()}`, // BE replace s ObjectId
        characterId: '__unresolved__', // BE resolve z characterPath
        characterSlug: slug,
        q, r,
        isNpc: false,
        currentHp: 0, maxHp: 0, baseHp: 0, // BE defaultuje z postavy
        armor: 0, baseArmor: 0, injury: 0,
        initiative: 0, initiativeBase: 0,
        inCombat: false, movement: 0,
        abilities: [], customData: {},
      } as MapToken,
    });
  };
  return (
    <button
      disabled={!member.characterPath || mutation.isPending}
      onClick={handleAdd}
      title={!member.characterPath ? 'Hráč nemá postavu' : 'Přidat token'}
    >+</button>
  );
}
```

⚠️ **BE side-fix needed**: `token.add` payload from FE má placeholder `id` a `characterId`. BE musí v `token.add` op handleru:
- generate ObjectId pro token.id
- resolve characterId z characterSlug + worldId (lookup `Page.where(slug, worldId, isCharacter)`)
- defaultovat HP/armor/movement z `Character.stats`

🚨 **TBD během implementace**: ověřit, že BE `MapOperationsService.applyAtomic` `token.add` handler tohle dělá. Pokud ne, je to BE patch (mimo 10.2d FE scope, ale rozhodne se hned po C5 zda zařadit jako blocker nebo BE follow-up commit). [[project_be_field_checklist]]

**Nový `components/pj-panel/NpcTemplatePalette.tsx`**:
- Renderuje `scene.npcTemplates` jako list cards
- Každá card: avatar + name + `[Spawnout]` button
- Click „Spawnout" → `token.add { isNpc:true, templateId: tmpl.id, q, r: findFirstFreeHex(), ... }` (default staty z template)

**Modifikace `MemberAssignmentTable.tsx`**:
- Přidat `<AddPcTokenButton>` vedle existujícího selectu

**Modifikace `MapPjPanel.tsx`**:
- Přidat sekci `<NpcTemplatePalette scene={currentScene} ... />`

### C6 — Token context menu

**Nový `components/tokens/TokenContextMenu.tsx`** (HTML overlay, ne PixiJS):
- Anchor: lokální stav `{tokenId, x, y} | null` v TacticalMapView
- Render: `<div style={{position:'absolute', left:x, top:y}}>` s buttony
- MVP položky:
  - „Smazat" (PJ only) → `token.remove`
  - další položky placeholder pro 10.2e+ (Edit, Show stats)

**Modifikace `TokenSprite.tsx`**:
- `onRightDown` (PixiJS event) → callback up s {tokenId, e.global.x, e.global.y}

### C7 — Tests + finalize

**Test soubory** (`__tests__/`):
- `tokenStaggerOffset.test.ts` — 1, 2, 3, 6 tokeny na hexu
- `findFirstFreeHex.test.ts` — spirálový BFS
- `useMyCharacterSlugs.test.ts` — derivace ze members
- `useTokenPermissions.test.ts` — PJ all true, hráč jen own, locked/combat gates
- `useTokenDrag.test.ts` — pointer sequence → onMove callback
- `useMapScene.idempotency.test.ts` — same op 2×, out-of-order ops
- `TokenLayer.integration.test.tsx` — render N tokens, click select, drag emits move

**Modifikace `roadmap-fe.md`**: odškrtnout `10.2d` checkbox.
**Modifikace `spec-10.2d.md`**: status → ✅ HOTOVO + sumarizace commitů.

---

## 3 — Otevřená rozhodnutí

| # | Rozhodnutí | Návrh | Důsledek pokud změna |
|---|---|---|---|
| 1 | characterPath singular vs. characterIds | MVP workaround `characterPath → slug` | Pokud BE rozšíření preferujeme: 10.2d se odloží do toho BE patche (+1-2h) |
| 2 | NPC paleta zdroj | Jen `scene.npcTemplates` | Pokud globální `NpcTemplate` (8.4) chceme zařadit → další commit C5b |
| 3 | findFirstFreeHex jako MVP spawn | Ano | Pokud user chce „spawn na hex kde teď je PJ kurzor" → BE musí přijmout origin z FE click event |
| 4 | Token.add FE-side placeholder ID + BE resolve | TBD ověřit existing BE handler v C5 | Pokud BE neresolvuje → BE follow-up commit (1-2h) |
| 5 | HP bar in 10.2d? | NE, defer 10.2e | Pokud user chce hned → +1 commit do 10.2d (~30 min) |
| 6 | Animation snap on drop | NE, instant | Polishing 10.2m |

## 4 — Risk register

- **PixiJS v8 pointer events** — drag flow je nontriviální (canvas pointer capture, ghost). Riziko: pixi event handling neumí lift pointer mid-drag → switch na DOM document listeners pro `pointermove/up` (capture phase, viewport coord transform).
- **Texture cache leak** — switch scény ponechá staré textures v `Assets` cache. MVP přijatelné; cleanup defer.
- **Optimistic conflict** — paralelní drag dvou usery na stejný token (PJ + hráč) → flicker. Server seqNumber je autoritativní; WS broadcast vrátí klient do správného stavu.
- **BE `token.add` resolve** (Open #4) — pokud BE neumí resolve `characterPath → characterId + defaultStats`, blocker. Mitigace: test v early C5, fallback FE musí dohledat z `Page` API (pomalejší, ale možné).

## 5 — Testovací matice (akceptační kritéria → testy)

| Akceptační kritérium (spec §9) | Test typ | Soubor |
|---|---|---|
| TokenLayer renderuje tokeny | integration | `TokenLayer.integration.test.tsx` |
| Sprite vs fallback | unit | `useTokenTexture.test.ts` |
| Klik = select | integration | `TokenLayer.integration.test.tsx` |
| Drag PC token (hráč) | integration | `TokenLayer.integration.test.tsx` |
| Drag cizí token (hráč) | integration | `useTokenPermissions.test.ts` (canDrag false) |
| Drag PJ (any) | integration | `useTokenPermissions.test.ts` |
| Locked + !isPJ → no drag | unit | `useTokenPermissions.test.ts` |
| + button → token.add | integration | `AddPcTokenButton.test.tsx` |
| NPC paleta spawnout | integration | `NpcTemplatePalette.test.tsx` |
| Right-click → remove | integration | `TokenContextMenu.test.tsx` |
| Stagger 2 tokenů | unit | `tokenStaggerOffset.test.ts` |
| 40+ testů zelených | — | celá `__tests__/` složka |
| tsc -b + vite build clean | — | manual check po C7 |
