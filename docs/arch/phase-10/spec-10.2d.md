# Spec 10.2d — Tokeny (PC + NPC, drag&drop, optimistic move)

**Status:** ✅ HOTOVO (2026-05-27) — MVP scope (token render + drag&drop + Bestie spawn); PC/NPC spawn UI + right-click menu + drag-from-palette defer 10.2e/10.2m
**Modul:** taktická mapa
**Velikost:** **L** (cca 12 nových souborů, 3 modifikace, ~40 testů)
**Závisí na:** 10.2a (renderer + viewport), 10.2b (hex math), 10.2c (scene load + WS + ops API), 10.2-prep-1 (BE Operations API), 10.2-prep-3 (plugin registry), **10.2d-prep-A (per-system schema engine — `systemStats` na MapToken), 10.2d-prep-B (bestiář NpcTemplate, 3-scope)**

---

## 1. Účel

Vizualizace **tokenů** na scéně + interakce. Po 10.2c jsme tokeny načítali ze `scene.tokens`, ale nerendrovali. 10.2d:

1. Renderuje **3 typy tokenů** v PixiJS vrstvě `layer-tokens`: PC, NPC postavy, Bestie [[project-npc-vs-bestie]].
2. PJ má **3-sekční paletu spawn UI**:
   - PC: `[+ token]` button v MemberAssignmentTable (per hráč)
   - NPC postavy: list `Character.where(worldId, isNpc=true)` z 9.1 Pages
   - Bestie: list z bestiáře (10.2d-prep-B) — sekce User + World + System
3. Hráč i PJ může **přetáhnout** token na jiný hex (snap-to-grid).
4. Movement je **optimistický** — UI hned reaguje, server commit v pozadí; rollback při error.
5. **Selection** state (klik na token = vybrán) — připravuje UI pro 10.2e (statbar) a 10.2g (paleta efektů).

Po 10.2d hráč otevře mapu → vidí svůj token + ostatní + může s nimi (pokud má právo) hýbat. NPC postavy + Bestie PJ rozmisťuje. Iniciativa/HP bar/efekty ještě nejsou (10.2e/f/g).

📚 **3 typy entit na mapě** (mirror [[project-npc-vs-bestie]]):

| Typ | Datový zdroj | Token discriminator | Klik na token |
|---|---|---|---|
| **PC** | `Character{isNpc:false}` z 9.1 Pages | `MapToken{isNpc:false}` | Otevři Character/deník |
| **NPC postava** | `Character{isNpc:true}` z 9.1 Pages | `MapToken{isNpc:true, templateId:undef}` | Otevři Character/deník |
| **Bestie** | `NpcTemplate` z bestiáře (10.2d-prep-B) | `MapToken{isNpc:true, templateId:<id>}` | Otevři statblok modal (10.2e) |

📚 **Per-system staty**: token drží `systemStats` per `world.system` (10.2d-prep-A engine). Render statů per-system přes `<EntityStatbar schema={...}>` v 10.2e; v 10.2d jen jméno + ring + avatar.

## 2. Scope

### V scope

#### Render

- **`TokenLayer`** komponenta — renderuje `scene.tokens` array do `layer-tokens` Containeru (z 10.2a). Mapuje každý token na `TokenSprite` child.
- **`TokenSprite`** komponenta — per-token vizuál:
  - `Sprite` z `token.characterData.imageUrl` (PC) nebo per-template imageUrl (NPC) přes `Assets.load` (Texture.from cache)
  - Fallback `Graphics` kruh + iniciály když imageUrl chybí nebo loaduje
  - `Graphics` ring (barva dle stavu: default / selected / `combat.currentTokenId` glow — combat ring je placeholder, full v 10.2f)
  - `Text` label pod tokenem (instanceName ?? characterData.name)
  - **HP bar** placeholder (žádný render v 10.2d; 10.2e doplní)
  - Pozice: `axialToPixel(token.q, token.r, config.size) + originX/Y`
- **Multi-token stagger** — pokud ≥2 tokeny na stejném (q,r), offsetneme je do malého kruhu (radius = size/4, equal angle distribution). MVP heuristika; čistší řešení v 10.2m polishing.

#### Spawn

3-sekční paleta v `MapPjPanel`:

- **Sekce 1 — PC tokeny:** v existujícím `MemberAssignmentTable` přidat `[+]` button per hráč; klik → `token.add { isNpc:false, characterSlug, systemStats: defaults(world.system, 'token'), q, r:findFirstFreeHex() }`. Hráč si token nespawnuje sám (MVP); PJ orchestruje.

- **Sekce 2 — NPC postavy:** list `Character.where(worldId, isNpc=true, kind='persona')` (z 9.1 Pages). Per řádek `[Spawnout]` button → `token.add { isNpc:true, templateId:undef, characterSlug:characterPage.slug, systemStats: copyFromCharacter(character.systemStats) }`. NPC postavy mají vlastní deník/staty z Character entity.

- **Sekce 3 — Bestie:** `useBestiar(worldId, world.system)` hook (refactored 8.4 v 10.2d-prep-B) → 3 pod-sekce (Můj / Svět / Systémový). Per řádek `[Spawnout]` button → `token.add { isNpc:true, templateId:bestie.id, q, r }`. BE handler dohledá bestii, snapshot `systemStats`, set `characterId='bestie:'+id`, auto-numbered `instanceName`.

- **Token quick-remove** — pravý klik na token → context menu „Smazat" → `token.remove`. MVP jen pro PJ (gate v assertCanDo BE).

💡 **Snapshot semantics u bestií** [[project-bestiar-design]]: BE kopíruje `systemStats` z bestie do tokenu při spawn. Pozdější edit bestie v bestiáři NEovlivní existující tokeny.

#### Interakce

- **Drag&drop**:
  - `pointerdown` na sprite → start drag, lift `zIndex+1`, alpha 0.8, kurzor `grabbing`
  - `pointermove` → token follow kurzor v mapa-space (`screen → mapa` přes inverse viewport transform)
  - `pointerup` → `pixelToAxial(mouse)` → snap; optimistic `applyOperationToScene` local + `postMapOperation token.move`
  - Při error (server reject — permission/locked scene): rollback (token vrátit na původní q/r) + toast „Pohyb neuložen: {reason}"
  - **Lock guard**: pokud `scene.isLocked && !isPJ` → drag disabled (cursor `not-allowed`)
- **Select**:
  - klik (bez drag) na token → lokální `selectedTokenId` state v `TacticalMapView`; ring přepne na `tokenRingSelected` barvu
  - klik na prázdný hex / Escape → deselect

#### Permissions (klient gate, BE má autoritativní)

- **Hráč** může táhnout jen tokeny kde `token.characterId ∈ moje postavy` (`useMyCharacters` lookup proti `members.where(user=me).characterIds`)
- **PJ** (`>= PomocnyPJ`) může táhnout cokoli
- Combat gate: pokud `scene.combat.isActive && combat.currentTokenId !== token.id && !isPJ` → drag disabled. Visuální: token zšeří se (alpha 0.5).
- 📚 _Zatím v 10.2d combat ještě neexistuje (10.2f), takže gate je dormant — připravený, ale neaktivovaný._

### Mimo scope

- HP bar render (10.2e — bar barva dle currentHp/maxHp)
- Initiative ring (10.2f — currentTokenId glow má placeholder, ale logic nepoužívá)
- Token statbloky overlay (10.2e — modal s armor/movement/abilities)
- Sprite atlas (10.2-prep-3-d — MVP používá raw `Assets.load`)
- Per-system render hook (10.2-prep-3 plugin slot — `renderTokenOverlay(token)` placeholder, žádný systém ho v MVP nedrží)
- Combat turn enforcement (10.2f)
- Effects/fog interakce s tokeny (10.2g/h)
- Path measure A* (10.2m)
- Undo (10.2m)
- NPC template editor (open question 4 — defer)

## 3. Klíčová rozhodnutí

### 3.1 Drag math — mapa-space, ne screen-space

Viewport má `zoom` a `offsetX/Y` (z 10.2a `useViewportPanZoom`). Drag dělá:
1. `pointerdown` zachytí `(screenX, screenY)` a `token.q, token.r`
2. `pointermove` → `mouseMapaSpace = (screenX - viewport.offsetX) / viewport.zoom`
3. Token Container `position = mouseMapaSpace` (PixiJS root container už má scale = zoom transform; pozice tokenu žije v mapa-space)
4. `pointerup` → `pixelToAxial(mouseMapaSpace.x - originX, mouseMapaSpace.y - originY, size)` → `{q, r}` (cube-round už v 10.2b)

📚 _Mapa-space = abstraktní souřadnice mapy (px), nezávislé na zoom. Viewport transformuje mapa-space → screen-space. Token positions hold v mapa-space; PixiJS scaling viewport Containeru handles zoom._

### 3.2 Optimistic update — jen `token.move`

`token.move` je **idempotent** na `(tokenId, q, r)` → klidně aplikujeme lokálně a server WS broadcast nezpůsobí double-apply (`applyOperationToScene` patcher zkontroluje `seqNumber > scene.lastSeqNumber`; pokud op seqNumber je z naší vlastní mutation, je shodný/menší → skip).

`token.add` a `token.remove` **NEjsou** optimistic v MVP — čekáme na server response (potřebujeme reálný `token.id` z BE). Spinner indikátor v UI „spawning…".

⚠️ **Race**: pokud user drag-and-drop několikrát rychle za sebou (3 různé hexy), `useMutation` může mít in-flight ops paralelně. BE Operations API garantuje seqNumber ordering, ale FE musí postupně aplikovat. **Řešení**: queue v `useMapScene` patcher — incoming WS ops bufferují, aplikují strictly seqNumber-ordered.

### 3.3 Selection state — UI-only, lokální

`selectedTokenId: string | null` žije v `TacticalMapView` (`useState`). NENÍ v `scene` data (selection je per-user UI, ne shared state). Předáváme dolů do `TokenLayer` jako prop pro render variant ringu.

### 3.4 Image loading — `Assets.load` + fallback

PixiJS v8 `Assets.load(url)` vrátí Promise<Texture>. Pro token sprite:
- Wrapper hook `useTokenTexture(imageUrl)` — `Promise.resolve | useState<Texture | null>`
- Při loading: render `Graphics` placeholder kruh + `Text` iniciály (první písmeno jména)
- Při error: stejný fallback + console.warn

PIXI Assets má vnitřní cache; opakované volání na shodný URL nevolá síť. ⚠️ Při switch scény (různé tokeny) staré textury sedí v cache — minor memory; cleanup v 10.2m.

### 3.5 Spawn flow — paleta s tlačítkem, drag-from-palette defer

`MapPjPanel` má 3 sekce (PC / NPC postavy / Bestie). Spawn = klik `[Spawnout]` (nebo `[+]` u PC) → BE `token.add` op s `q,r` z `findFirstFreeHex(scene.tokens, {0,0})`. PJ pak token přetáhne kam chce (drag&drop §3.1).

⚠️ **Drag-from-palette → canvas defer:** HTML drag API neproniká do PixiJS canvasu nativně; potřebné kombinace pointerdown na palette + document pointermove + elementFromPoint detekce. MVP klik+button funguje stejně rychle, jen 1 extra drag. Drag-from-palette polishing 10.2m.

🔀 **Alt zamítnuto:** modální dialog „Spawn token" s polem pro hex souřadnice — krkolomné UX.

🔀 **Alternativa odmítnutá**: modální dialog „Spawn NPC" s polem pro hex souřadnice — krkolomné UX.

### 3.6 PC token spawn — PJ ovládá

PJ ručně klikne `+` u hráče v `MemberAssignmentTable`. Default: token.add na (0, 0) s `characterId` z `member.user.characters[0]` nebo (pokud má víc) dropdown výběr postavy.

🔀 **Alternativa zvažována**: auto-spawn při `member.assignToScene` (BE side-effect). **Zamítnuto**: hráč může mít více postav, PJ chce vybrat; někdy chce přiřadit usera „jako pozorovatele" bez tokenu (např. když hraje za NPC v dané scéně). Manual spawn = výslovné.

### 3.7 Permission gate — duplicitní (klient + BE)

BE `OperationsAuthorizer.assertCanDo()` autoritativně blokuje (vrací 403). Klient gate je UX pomoc — disable cursor, no drag start. Důvod: cheap UX feedback, bez 403 roundtripu.

📚 _Pro hráče: zjistím "moje" tokens přes `members.find(u=me).characterIds.includes(token.characterId)`. Pro PJ: `userRole >= WorldRole.PomocnyPJ` → all._

### 3.8 Where to store "moje postavy"?

Hook `useMyCharacterIds(worldId): string[]` — derivovaný ze `useWorldMembers(worldId).find(m.userId === currentUserId).characterIds`. Memoizovaný.

⚠️ `WorldMembership.characterIds` existuje? Pokud ne (kontrola nutná), je to **pre-existing dluh** — buď doplníme v BE schema (out of scope 10.2d), nebo derivujeme z `Page.characterRef` lookup (pomalejší). **TBD během plán fáze** — než začneme kód, ověřím existující schema.

## 4. Datový model

Žádné nové typy — `MapToken`, `MapSceneNpc`, `MapOperation` už existují z 10.2c. Možná drobné rozšíření:

```ts
// types.ts — případně přidat (TBD plán fáze):
export interface MyCharacterRef {
  characterId: string;
  characterSlug: string;
  name: string;
  imageUrl?: string;
}
```

## 5. UI komponenty (nové soubory)

```
src/features/world/tactical-map/
├─ components/
│  ├─ tokens/
│  │  ├─ TokenLayer.tsx              # iteruje scene.tokens → TokenSprite
│  │  ├─ TokenSprite.tsx             # per-token render (sprite/fallback + ring + label)
│  │  ├─ TokenContextMenu.tsx        # right-click menu (Smazat, atd.)
│  │  └─ TokenLayer.module.css       # ghost preview, context menu styling
│  └─ pj-panel/
│     ├─ NpcTemplatePalette.tsx      # paleta NPC šablon + spawn button
│     └─ AddPcTokenButton.tsx        # + tlačítko v MemberAssignmentTable
├─ hooks/
│  ├─ useTokenDrag.ts                # pointerdown/move/up → onDrop callback
│  ├─ useTokenTexture.ts             # Assets.load + fallback state
│  ├─ useMyCharacterIds.ts           # derivace moje postavy
│  └─ useTokenPermissions.ts         # canDrag(token) helper
└─ utils/
   └─ tokenStaggerOffset.ts          # multi-token na hexu → offset positions
```

Modifikace:
- `TacticalMapView.tsx` — render `<TokenLayer scene={scene} selectedTokenId={...} onSelect={...} />` do layer-tokens; selection state useState
- `MapPjPanel.tsx` — přidat `<NpcTemplatePalette>` sekci
- `MemberAssignmentTable.tsx` — přidat `<AddPcTokenButton>` vedle dropdownu
- `applyOperationToScene.ts` — zkontrolovat že 4 token ops (add/move/remove/update) jsou plně pokryté + ošetří stagger recompute

## 6. Bezpečnost

- Klient gate je UX, ne security boundary — BE `OperationsAuthorizer.assertCanDo()` je autoritativní (403 při unauthorized op)
- WS broadcast `map:operation` dorazí všem v `map:join`-ed scéně → token positions všech jsou veřejné v rámci scény (předpokládaný design — scéna = sdílený game state)
- Token sprite imageUrl prochází existujícím `resolveImageUrl()` (auth headers)
- Multi-character users: client filtr „moje" postavy bezpečně přes member.characterIds; BE check matches

## 7. Testovací scénáře

### Unit

- `tokenStaggerOffset(tokens, q, r) → Point[]` — 1 token: žádný offset; 3 tokeny: 120° rozestup
- `useTokenDrag` — pointer sequence → onDrop callback s konečným hexem
- `useTokenPermissions(token, me, members, scene) → boolean` — PJ true; hráč jeho own true; cizí false; locked scene + !isPJ → false; combat current ≠ token → false
- `useMyCharacterIds` — vrátí characterIds membera = me
- `applyOperationToScene` — token.add zvedne array; token.move změní (q,r); token.remove vymaže; token.update mergne patch; seqNumber stará op → skip (idempotency)

### Integration

- Render `<TokenLayer>` s 3 tokeny → 3 sprites v scenegraph
- Click na token → `selectedTokenId` set → ring přepne barvu
- Drag PC token (jako hráč) → optimistic apply + `postMapOperation` mock volán s `token.move`
- Drag cizí token (jako hráč) → drag se nestartuje
- Drag PJ token (jako PJ) → start drag funguje
- `MapPjPanel` PJ klikne `+ token` → `token.add` mutation volaná s default origin
- NPC paleta → klik „Spawnout" → `token.add` s `isNpc:true, templateId`

### Manual smoke

⚠️ User aktuálně nemá tester k dispozici — manual smoke se odloží. Akceptace přes unit + integration tests.

## 8. Open questions

1. **Stagger animation** — když 2. token přijde na obsazený hex, posunout staré tokeny animovaně? **MVP: bez animace** (instant reposition). Polishing 10.2m.
2. **NPC drag-from-palette** — HTML drag → PixiJS canvas je netriviální (§3.5). **MVP: klik + Spawnout na (0,0), PJ přetáhne** (defer drag UX).
3. **PC spawn default hex** — (0,0) může kolidovat s ostatními. Lepší: najít první volný hex spirálou kolem středu (BFS). **MVP: prostě (0,0)** + PJ ručně rozmístí.
4. **NPC template editor** — kdo a kdy edituje `MapSceneNpc.maxHp` atd.? V 10.2c jsme říkali „spec 10.2d" — ale je to spíš overlay nad tokenem (10.2e). **Návrh**: defer NPC editor do 10.2e (rozšíříme statbar overlay i pro NPC tokens).
5. **`WorldMembership.characterIds`** — existuje pole? Pokud ne, derivace přes `pages.where(characterRef.userId === me)` lookup (pomalejší). **Ověřit v plán fázi.**
6. **Stagger heuristika** — radius = `size/4` × kruhový pattern. Alt: spiral, grid? **MVP: kruh**.
7. **Drag cancel** — klávesa Escape během drag → vrátit token? **MVP: ano** (Escape listener na document během drag).
8. **Optimistic conflict** — hráč move token, paralelně PJ move stejný token z PJ panelu. Server zpracuje v pořadí, ale klient vidí flicker. **MVP: ok**, WS broadcast je autoritativní.

## 9. Akceptační kritéria

- [ ] `TokenLayer` renderuje všechny `scene.tokens` jako sprity v `layer-tokens`
- [ ] Token s `characterData.imageUrl` → sprite; bez imageUrl → fallback kruh + iniciály
- [ ] Klik na token → `selectedTokenId` set; ring barva přepne
- [ ] Drag PC tokenu (hráč) → optimistic update + WS commit
- [ ] Drag cizího tokenu (hráč) → cursor `not-allowed`, drag se nezačne
- [ ] PJ drag jakéhokoli tokenu → funguje
- [ ] Locked scéna + !isPJ → token drag disabled
- [ ] PJ klikne `+` v MemberAssignmentTable → spawne PC token na (0,0)
- [ ] PJ klikne na NPC šablonu v palette + „Spawnout" → spawne NPC token na (0,0)
- [ ] Right-click na token (jako PJ) → context menu „Smazat" → `token.remove`
- [ ] 2 tokeny na stejném hexu → stagger offset (žádný overlap)
- [ ] 40+ testů zelených (unit + integration)
- [ ] tsc -b + vite build clean

---

**Pozn.:** 10.2e (statbar/HP bar/iniciativa preview) navazuje hned po 10.2d. 10.2d záměrně nepokrývá HP bar, abychom udrželi PR scope rozumný.
