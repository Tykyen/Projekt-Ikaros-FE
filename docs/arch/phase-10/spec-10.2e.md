# Spec 10.2e — Staty tokenu (HP bar + statbar overlay + sync)

**Status:** ✅ HOTOVO (2026-05-27) — soft mode pro Character sync (Character.systemStats reload v 8.x defer)
**Modul:** taktická mapa / token statbar
**Velikost:** **M-L** (~10 nových souborů, ~3 modifikace, ~15 testů)
**Závisí na:** 10.2a–d (token render), 10.2d-prep-A (schema engine, EntityStatbar)

---

## 1. Účel

Token statbar UX — vizualizace HP + možnost edituvat staty během boje:

1. **HP bar přímo na tokenu** (PixiJS) — barva podle %; viditelný i bez interakce
2. **Statbar overlay** (HTML modal/side-panel) — klik na token otevře plný statblok přes `<EntityStatbar editable>` (z prep-A)
3. **Token update** — změny stat → `token.update` op (Operations API z 10.2-prep-1)
4. **Sync se staty postavy**:
   - Token z PC/NPC postavy (Character{isNpc:false/true}): změna `health.current` na tokenu → také update `Character.systemStats.health.current`
   - Token z bestiáře (`templateId` set): snapshot semantics — žádný sync (instance má vlastní staty, bestie zůstane nezměněna)
5. **PC/NPC spawn UI** v PJ panelu (rozšíření 10.2d palette) — vedle Bestie sekce přidat „PC" + „NPC postavy" sekce

Po 10.2e: PJ klikne token → vidí staty → změní HP / aplikuje damage → změny se propagují (token + postava, kde dává smysl).

## 2. Scope

### V scope

#### Token render

- **HP bar na sprite tokenu** — pod label, kompaktní progress bar (12×3px), barva tier:
  - green > 60%, yellow > 30%, red ≤ 30%
  - Render přes PixiJS Graphics (žádný HTML overlay v PixiJS canvas)
  - Optional — schovat pokud `combatBehavior='damageable'` field chybí v schema (BC s ne-damageable systémy)

#### Statbar overlay (HTML modal)

- **`TokenStatbarModal`** — klik na token → otevři modal/sidepanel
  - Header: avatar + jméno + status tag (MIMO BOJ / V BOJI)
  - Body: `<EntityStatbar schema={tokenSchema} value={token.systemStats} editable={canEdit}>`
  - Footer: zavřít + (PJ) „Smazat token" tlačítko
- Editable matrix:
  - PJ (`isPj || isGlobalAdmin`) → edituje cokoli
  - Hráč → edituje jen svůj token (mySlugs match)
  - Bestie token: PJ edit, hráč view-only
- Save: per-change `token.update` op s patch `{ systemStats: {...changed} }`

#### Sync se staty postavy (Character)

- Pokud token má `characterId` ne-placeholder (tj. PC nebo NPC postava — NE bestie):
  - Po `token.update` s `systemStats` patch → **BE-side** propaguje patch do `Character.systemStats`
  - Změna v Character UI (8.x) → token reflektuje při enrichTokens
- Bestie token (`templateId` set, `characterId='bestie:...'`): žádný sync

⚠️ **Implementace sync**: BE map-operations.service v `token.update` handler po atomic update tokenu volá `CharactersService.updatePartialSystemStats(token.characterId, patch.systemStats)`. Pokud characterId placeholder, skip.

#### PC + NPC postava spawn UI v PJ panelu

Rozšíření 10.2d `MapPjPanel` (vedle `BestiePalette`):
- **`PcPalette`** — list členů světa (`useWorldMembers`); per člen tlačítko „+" → spawne token s `characterId` z member.character (lookup přes Pages API). Pokud člen bez postavy, disable.
- **`NpcCharacterPalette`** — list `Character.where(worldId, isNpc:true, kind:'persona')`; klik na NPC → spawne token s characterId.

### Mimo scope

- Damage formula / auto-calc HP po damage (10.2f combat)
- Initiative tracker UI (10.2f)
- Effects on tokens (status conditions, buffs) — 10.2g
- Health regeneration / end-of-turn ticks — 10.2f
- Bidirectional WS sync (BE token.update → BE character.update → WS broadcast updated character) — 10.2i (real-time)

## 3. Klíčová rozhodnutí

### 3.1 HP bar in PixiJS (ne HTML)

Důvod: HP bar musí zoom/pan synchronizovaně s tokenem. HTML overlay by potřeboval manual sync. PixiJS Graphics jednodušší.

### 3.2 Statbar overlay = HTML modal, ne in-canvas

Edit form s inputy je natively HTML. PixiJS pro display, HTML pro edit. Modal otevírá při click na token.

### 3.3 Sync logic na BE

Token → Character sync musí být atomic. BE map-operations po token.update volá CharactersService inline. WS broadcast token.update + character.update (2 events).

🔀 **Alt**: FE volá obě API (token + character) paralelně. Risk: rollback při jedné fail. Zamítnuto — BE má authoritativně sync v jednou transakci.

### 3.4 Editovat tokenStats vs characterStats — kde je primary

Token drží snapshot characterStats při spawn (10.2d BE handler). Po spawn:
- **Edit v boji** = edit tokenu (krátkodobé buffy/damage) → sync zpět do character
- **Edit mimo boj** = edit character (postava growth) → tokeny nemají auto-refresh (defer 10.2i WS)

### 3.5 Bestie nesync (snapshot)

Token z bestiáře má vlastní stat copy. PJ může editovat během boje, bestie šablona nezměněna. Memory: [[project-bestiar-design]] explicit.

## 4. Datový model

Žádné nové BE fields. Existing:
- `MapToken.systemStats` (10.2d-prep-A) — primary storage
- `Character.systemStats` (defer plně populated, kostra existuje)
- `MapToken.characterId` — identifikátor: `bestie:{id}` = bestie, jinak Character `_id`

## 5. UI komponenty (nové)

```
src/features/world/tactical-map/
├─ components/
│  ├─ tokens/
│  │  ├─ TokenHpBar.tsx              # PixiJS HP bar pod label
│  │  └─ TokenStatbarModal.tsx       # HTML modal s EntityStatbar editable
│  └─ pj-panel/
│     ├─ PcPalette.tsx               # spawn PC tokeny členů světa
│     └─ NpcCharacterPalette.tsx     # spawn NPC postavy z Pages
├─ hooks/
│  └─ useTokenUpdate.ts              # mutation hook s optimistic + character sync (BE)
└─ utils/
   └─ tokenIsBestie.ts               # discriminator: characterId.startsWith('bestie:')
```

Modifikace:
- `TokenSprite.tsx` — render `<TokenHpBar>` pod label
- `TacticalMapView.tsx` — selectedTokenId → `<TokenStatbarModal>` open
- `MapPjPanel.tsx` — přidat `<PcPalette>` + `<NpcCharacterPalette>` sekce
- BE `map-operations.service.ts.token.update` — character sync logic

### 5.1 Spawn placement UX (10.2c-edit-9a)

Token spawn z palety **musí** umožnit PJ vybrat cílový hex (ne fallback na první volný od (0,0)). Dva paralelní vstupy:

1. **HTML5 drag & drop** — palette item je `draggable`, `onDragStart` zapíše `SpawnPayload` do `dataTransfer` (custom MIME `application/x-ikaros-token` + `text/plain` fallback). `TacticalMapView` viewport má `onDragOver` (preventDefault pokud má spawn payload) + `onDrop` (čte payload, počítá `screenToHex(clientX, clientY, rect, panZoom, config)` → `token.add` op).
2. **Placement mode** (klik v paletě → klik na hex) — fallback pro touch device a uživatele, co netáhnou. `usePlacementMode` hook drží state machine `{active, payload, multi}`. PC = `multi=false` (jeden klik = spawn + reset). NPC + Bestie = `multi=true` (banner zůstává, ESC = konec). `MapPlacementBanner` zobrazuje název umisťované entity + Zrušit tlačítko.

Fallback při kolizi (cílový hex obsazený): `findFirstFreeHex(scene.tokens, target)` — spirálový BFS **od pointed hex** (ne od (0,0)). User dostane token blízko zamýšlené pozice.

Real-time: `token.add` op jde standardním pipeline `postMapOperation` → BE atomic + WS broadcast `map:operation` → všichni v scene room dostanou v `useMapScene.onOperation` → `applyOperationToScene` → ostatní vidí token okamžitě (žádný extra setup).

```
src/features/world/tactical-map/
├─ components/
│  └─ MapPlacementBanner.tsx       # fixed top-center banner pro placement mode
├─ hooks/
│  └─ usePlacementMode.ts          # state machine + ESC binding
└─ utils/
   ├─ screenToHex.ts               # client coords → axial hex (sjednocený výpočet)
   ├─ spawnPayload.ts              # typed dataTransfer payload
   └─ buildSpawnToken.ts           # PC/NPC/Bestie → MapToken factory
```

### 5.2 Token modal — varianty a per-hráč view (10.2c-edit-9b/9c)

Token modal (`TokenStatbarModal`) má **3 varianty** podle (kind tokenu, view mode):

| Token kind | View mode | UI |
|---|---|---|
| **Bestie** | PJ | `BestieStatblock` (edit form per-system staty + `bestie.notes` read-only) |
| **Bestie** | hráč | `BestieStatblock` (read-only `EntityStatbar`, žádné notes) |
| **PC / NPC** | PJ / vlastník PC | Tabs `Staty` / `Deník` / `Poznámky` (edit) |
| **PC / NPC** | hráč na cizí token | `LimitedView` (jméno, status badge, HP %, zranění) — žádné tabs |

**View mode derivace** přes `tokenViewMode(token, currentUserId, isPJ, mySlugs)`:
- `pj` — PJ + globální admin
- `owner` — hráč, jehož postava odpovídá `token.characterSlug` (PC, ne NPC)
- `limited` — anon nebo hráč na cizí PC/NPC/bestii

**Deník + Poznámky reuse:** `TokenDiaryTab` / `TokenNotesTab` jsou tenké wrappery kolem existujících `DiaryTab` / `NotesTab` z `CharacterDetailPage`. Žádný copy-paste — embed s `slug={token.characterSlug}`, `mode='edit'` (canEdit) / `'view'`. `DiaryTab` má vlastní sticky save bar; `NotesTab` má autosave 800ms.

**Bestie:** lookup šablony přes `bestiarQueryKey(worldId, systemId)` v query cache (BestiePalette ji loadla). Pokud cache miss, statblok funguje (čerpá ze `token.systemStats`), jen se neukáže `bestie.notes`.

**Dirty guard:** Sledování dirty state pro Deník + Poznámky tab. Pokus o zavření modálu s neuloženými změnami → confirm dialog „Máš neuložené změny v Deníku / Poznámkách. Opravdu zavřít?".

**Security:** Tabs UI = UX gating, ne security. BE `PATCH /characters/:slug/diary` autorizuje samostatně (PJ + vlastník). Kdyby si hráč forcnul tab limited→full, BE odpoví 403.

**Známé omezení:** Deník/Poznámky nemají WS broadcast (žádný `character.diary.update` event). Dva PJ v stejném modalu pro stejnou postavu uvidí změny až po refetch. Defer 10.2i.

```
src/features/world/tactical-map/
├─ components/tokens/
│  ├─ TokenStatbarModal.tsx         # přepsaný (3 varianty + tabs + LimitedView)
│  ├─ TokenDiaryTab.tsx             # wrapper kolem DiaryTab
│  ├─ TokenNotesTab.tsx             # wrapper kolem NotesTab
│  └─ BestieStatblock.tsx           # statblok + bestie.notes (PJ only)
└─ utils/
   └─ tokenViewMode.ts              # pj | owner | limited derivace
```

## 6. Bezpečnost

- BE token.update authorization přes existing OperationsAuthorizer (PJ all, hráč jen own characterSlug match)
- Character sync je server-side (BE volá CharactersService inline) — žádný extra auth check (token edit už autorizovaný)

## 7. Testovací scénáře

### Unit

- `tokenIsBestie('bestie:abc')` → true; `tokenIsBestie('507f...')` → false
- TokenHpBar — render damageable progress per percent tier (green/yellow/red)
- TokenStatbarModal — render schema fields, save calls token.update

### Integration

- Klik na token (PJ) → modal open → edit HP → save → token.update s patch
- Klik na token (hráč na cizí) → modal read-only
- BE token.update s sync — token + character oba updated
- BE token.update bestie — jen token, character intact

## 8. Open questions

1. **Sync timing** — BE okamžitě nebo defer (queued)? **MVP: okamžitě** v stejné transakci.
2. **Character WS broadcast** — pokud character updated, broadcast na Pages WS channel? **MVP: ne** (Pages 9.x nemá WS); refresh on Pages reload.
3. **Statbar modal vs sidepanel** — overlay nebo side dock? **MVP: modal** (consistent s ostatními modaly).

## 9. Akceptační kritéria

- [ ] HP bar viditelný na všech damageable tokenech
- [ ] Klik na token (PJ) → modal s edit form
- [ ] PJ změna stat → token.update + (pokud postava) character.update
- [ ] Hráč cizí token → modal read-only
- [ ] PC palette spawne PC token členů
- [ ] NPC palette spawne NPC postava token
- [x] **10.2c-edit-9a** — drag&drop palety→hex funguje (PC/NPC/Bestie)
- [x] **10.2c-edit-9a** — placement mode (klik→klik) funguje, ESC ruší
- [x] **10.2c-edit-9a** — kolize: spawn na obsazený hex → fallback `findFirstFreeHex` od targetu (ne (0,0))
- [x] **10.2c-edit-9a** — real-time broadcast (spawn vidí ostatní bez refresh)
- [x] **10.2c-edit-9b** — Token modal tabs Staty / Deník / Poznámky pro PC/NPC
- [x] **10.2c-edit-9b** — Deník = embedded `DiaryTab` reuse, edit inline (sticky bar)
- [x] **10.2c-edit-9b** — Poznámky = embedded `NotesTab` reuse, autosave 800ms
- [x] **10.2c-edit-9b** — Per-hráč view: PJ = full, vlastník PC = full, hráč cizí token = limited (jméno + HP %, bez deníku)
- [x] **10.2c-edit-9c** — Bestie modal varianta = `BestieStatblock` (per-system schema + bestie.notes pro PJ), bez tabs
- [x] **10.2c-edit-9b/9c** — Dirty guard: zavřít modal s neuloženými změnami → confirm
- [ ] Bestie token edit → bez character sync
- [ ] ~15 testů zelených
- [ ] mobil/desktop layout audit
