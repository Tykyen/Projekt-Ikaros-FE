# Spec 10.2n — Orchestrace: accordion palety + Přístup/viditelnost (per-scéna i per-hráč)

## Účel
Redesign PJ orchestrátora ([MapPjPanel](../../../src/features/world/tactical-map/components/pj-panel/MapPjPanel.tsx))
pro reálné herní počty (10+ bestií, 5 NPC, 10 PC) a převzetí role „kdo co vidí":

1. **Spawn palety jako accordiony** — PC / NPC / Bestiář sbalitelné, počet v hlavičce,
   default sbalené → konec nekonečného a vnořeného scrollu.
2. **Smazat „Rozmístění hráčů"** (`MemberAssignmentTable`), nahradit přehledem
   **„Přístup a viditelnost"** — per scéna ukazuje přiřazené hráče s přepínači
   👁 skrýt / 🔒 zamknout, **per-hráč** i **„na všechny"**.

## Stav před krokem

| Vrstva | Stav |
|--------|------|
| `scene.isHidden` / `scene.isLocked` (per scéna, bool) | ✅ typ + BE |
| Op `scene.state {isHidden,isLocked}` + reducer + test | ✅ hotovo |
| Hráč: zámek blokuje drag tokenů | ✅ [useTokenPermissions.ts:26](../../../src/features/world/tactical-map/hooks/useTokenPermissions.ts#L26) |
| Hráč: skrytá scéna → plachta „Mapa skrytá" | ✅ [MapHiddenOverlay](../../../src/features/world/tactical-map/components/MapHiddenOverlay.tsx) + [TacticalMapView.tsx:1137-1140](../../../src/features/world/tactical-map/TacticalMapView.tsx#L1137-L1140) |
| Badge 🚫/🔒 na řádku scény | ✅ [ActiveScenesList.tsx:63-72](../../../src/features/world/tactical-map/components/pj-panel/ActiveScenesList.tsx#L63-L72) |
| Per-player assignment (`member.assignToScene`, `currentSceneId`) | ✅ hotovo |
| **PJ přepínač pro `scene.state`** | ❌ chybí — nikdo op nevolá |
| **Per-hráč override (skrýt/zamknout jen někomu)** | ❌ neexistuje (nový BE) |
| **Accordion palety** | ❌ |

💡 *Per-scéna lock/hide je z ~90 % hotové (data, overlay, gating) — chybí jen tlačítka.
Per-hráč je jediná genuinně nová BE práce.*

---

## n-1 — Accordion spawn palety (čistě FE)

Tři sekce (PC / NPC / Bestiář) přejdou z „vždy rozbaleno" na **sbalitelné**:

- Hlavička = klikací řádek: chevron `▸/▾` + název + **počet aktivních** v `.count` chipu
  (např. `Bestiář (10)`). Počet = délka `activeList` v dané paletě (už počítané uvnitř).
- Default **sbalené** (stejný princip jako celý panel a log hodů). Otevřený stav per sekce
  v `localStorage` (`ikr-map-pal-{pc|npc|bestie}`).
- Rozbalená sekce ukáže stávající obsah palety beze změny (search + „z katalogu" + list).
- ⚠️ **Vnořený scroll pryč:** protože je rozbalená max. pár sekcí, vnitřní `.list`
  `max-height: 200px` může zůstat, ale reálně se aktivuje jen u jedné → žádné „scroll ve scrollu".

**Komponenty:**
- Nový lehký `<PaletteAccordion title count>` wrapper (nebo rozšířit `.section` v `MapPjPanel`).
  Drží otevřený stav + a11y (`aria-expanded`, klávesy Enter/Space — vzor existující header).
- Počet musí být dostupný v `MapPjPanel` → palety vystaví `activeCount` (callback / lift),
  nebo accordion dostane count přímo z palety. **Detail do plánu** (kloním se: paleta hlásí
  count přes `onCountChange`, ať se logika filtru nekopíruje).

---

## n-2 — Smazat „Rozmístění hráčů"

- Odstranit sekci + komponentu `MemberAssignmentTable` (+ `.module.css`) z [MapPjPanel.tsx:248-258](../../../src/features/world/tactical-map/components/pj-panel/MapPjPanel.tsx#L248-L258).
- ⚠️ **Přiřazení NEMÍ zmizet jako logika** — hráč bez `currentSceneId` dostane 404 → prázdno
  ([useMapScene.ts:102-107](../../../src/features/world/tactical-map/hooks/useMapScene.ts#L102-L107)).
  Skrytí/zámek působí jen na přiřazené hráče. Proto přiřazení **přebírá nový board** (n-3):
  „kdo je na které scéně" = kdo ji vidí.
- `handleAssign` / `handleUnassign` / `mutation` (`member.assignToScene`/`unassign`) **zůstávají**
  — jen je volá board, ne tabulka.

---

## n-3 — Přehled „Přístup a viditelnost"

Nahrazuje tabulku. **Per aktivní scéna** karta:

```
▾ Map                              👁 vše   🔒 vše
    🧝 Aragorn                       👁      🔓
    🧙 Gandalf                       🚫      🔒      ← override (liší se od default)
    + přiřadit hráče ▾
▸ Náměstí  🚫 🔒                    👁 vše   🔒 vše
```

**Sémantika:**
- **Hlavička scény → „👁 vše" / „🔒 vše"** = per-scéna default (`scene.isHidden`/`isLocked`).
  Toggle volá hotovou op `scene.state`. Toto je tvoje „na všechny".
- **Řádek hráče → 👁/🚫 a 🔓/🔒** = per-hráč override (n-4). Když override == default, nezobrazuje
  se jako odlišný (chip „override" jen když se liší).
- **Efektivní stav hráče** = `override ?? scéna-default`.
- **„+ přiřadit hráče"** = picker hratelných členů světa, kteří nejsou na této scéně →
  `member.assignToScene`. Odebrání hráče ze scény (× u řádku) → `member.unassign`.
- Karty scén sbalitelné (jako accordion); skrytá/zamčená scéna nese read-only mini-badge v hlavičce.

**„na všechny" chování:** „👁 vše"/„🔒 vše" nastaví per-scéna default **a vynuluje per-hráč
overrides** daného pole (aby „skrýt všem" fakt skrylo všem). Implementace = `scene.state` +
reset overrides (detail do plánu — buď sweep `scene.playerState{…:null}`, nebo nová op
`scene.playerState.clear`).

**Zdroj dat:** `useWorldMembers` (hratelní = `Hrac…PomocnyPJ`, jako dnešní tabulka) ×
`useActiveScenes` → seskupení podle `currentSceneId`.

---

## n-4 — Per-hráč override (NOVÝ BE + FE)

### Datový model (BE)
`MapScene` rozšířit o:
```ts
playerStates: Array<{ userId: string; isHidden?: boolean; isLocked?: boolean }>; // default []
```
- ⚠️ **Field-drift checklist** (paměť `project_be_field_checklist`): schema + DTO + service +
  **`toEntity` mapper** (jinak GET zahodí). Začít od mapperu.
- FE `types.ts`: přidat `playerStates` do `MapScene`.

### Operace (BE + FE)
Nová PJ-only op:
```ts
| { type: 'scene.playerState'; userId: string; isHidden?: boolean | null; isLocked?: boolean | null }
```
- `bool` = nastav override, `null` = smaž override pole (fallback na default), `undefined` = beze změny.
- BE: DTO + operations registry + `applyAtomic` (upsert/pull v `playerStates`) + `computeInverse`
  (undo) + authorizer **PJ-only** (jako `scene.state`).
- FE: `applyOperationToScene` nový `case 'scene.playerState'` (mirror) + test
  (vzor [applyOperationToScene.test.ts:214](../../../src/features/world/tactical-map/utils/__tests__/applyOperationToScene.test.ts#L214)).

### Resolution + real-time (FE)
- **Varianta B (zvolená):** `playerStates` se posílá **všem** klientům na scéně; každý si spočítá
  `effective(me)`. Patcher zpracuje op uniformně, žádné cílené eventy. WS broadcast `scene` room
  dorovná hráče i PJ.
  - 🔀 *Varianta A (server projektuje per-requester) zavržena — komplexní cílené WS eventy.*
  - ⚠️ *Expozice: hráč v payloadu uvidí pole `playerStates` (booly o skrytí/zámku). Necitlivé,
    žádný nový exploit. Pozice tokenů ve skryté scéně jsou v payloadu už dnes (pre-existující,
    mimo scope — případně dluh).*
- **Player view:** [TacticalMapView.tsx:1137-1140](../../../src/features/world/tactical-map/TacticalMapView.tsx#L1137-L1140)
  `showHidden`/`showLocked` → `effHidden = playerStates.find(me)?.isHidden ?? scene.isHidden` (dtto lock).
- **Gating:** [useTokenPermissions.ts:26](../../../src/features/world/tactical-map/hooks/useTokenPermissions.ts#L26)
  `scene.isLocked` → efektivní lock pro `me`. **BE autoritativní** — `OperationsAuthorizer`
  `token.move` musí respektovat efektivní lock daného uživatele (ne jen `scene.isLocked`).

---

## Mimo scope (defer / dluh)
- Per-token `isLocked` (D-066, už zapsáno).
- Skrytí pozic tokenů ve skryté scéně z network payloadu (pre-existující; kandidát na dluh).
- Per-scéna počasí (defer z 10.2i, nesouvisí).

## Definition of done
- [ ] Accordion: PC/NPC/Bestiář sbalitelné, počet v hlavičce, default sbalené, LS persist
- [ ] `MemberAssignmentTable` smazána; přiřazení funguje z nového boardu
- [ ] Board „Přístup a viditelnost": per-scéna 👁/🔒 (`scene.state`), „+ přiřadit", × odebrat
- [ ] Per-hráč override: BE `playerStates` + op `scene.playerState` (DTO/registry/applyAtomic/inverse/authorizer)
- [ ] FE patcher `scene.playerState` + efektivní hidden/locked v player view i gatingu
- [ ] BE `token.move` authorizer respektuje per-hráč lock
- [ ] „na všechny" nastaví default + vynuluje overrides pole
- [ ] Testy: accordion toggle, board (assign/override), `scene.playerState` patcher, BE authorizer + applyAtomic
- [ ] `mobil-desktop` audit (panel levý dolní, toggly = touch-friendly)
- [ ] `napoveda` aktualizována (orchestrace, přístup/viditelnost)
- [ ] roadmapa: 10.2n přidáno a zaškrtnuto

## Otevřené body k potvrzení
1. **„na všechny" reset overrides** — souhlas, že hromadné tlačítko přebije i individuální overrides? (ano = intuitivní „všem stejně")
2. **Číslo kroku** `10.2n` ok? (10.2 byla uzavřená v 10.2m; tohle je dodatečné rozšíření)
3. **Přiřazení** zůstává **manuální** přes board (`+ přiřadit`), bez auto-assign — ano?
