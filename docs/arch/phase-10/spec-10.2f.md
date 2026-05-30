# Spec 10.2f — Iniciativa (taktická mapa)

*Stav: ✅ IMPLEMENTOVÁNO (2026-05-30) ve 3 sub-krocích f-1/f-2/f-3. Krok roadmapy `10.2f`. Plán: [plan-10.2f.md](plan-10.2f.md).*

## 1. Účel

Horní full-width **iniciativní lišta** + **combat tracker**. Jádro = **pořadí tahů**: kdo je na řadě, kdo jde po něm, kolikáté kolo. PJ řídí boj, hráč ho čte.

Inspirace vzhledem: starý Matrix (`C:\Matrix\Matrix\frontend\src\components\Map\MapToolbar.tsx`) — řada kruhových portrétů s číselným badgem pořadí, barevný border = HP tier.

## 2. Co je hotové (nestaví se znovu)

- **Datový model:** `MapToken.inCombat: boolean`, `.initiative: number`, `.initiativeBase: number` ([types.ts:61-63](../../../src/features/world/tactical-map/types.ts)).
- **Combat subdoc:** `scene.combat: CombatState` (`isActive`, `round`, `currentTokenId`, `order: string[]`, `endOfTurnEffects[]`) — [types.ts:111-127](../../../src/features/world/tactical-map/types.ts).
- **Operace (BE atomic + FE patcher):** `combat.start { orderTokenIds }`, `combat.turn { tokenId? }`, `combat.end`, `combat.effect.add/remove` — [applyOperationToScene.ts:226-293](../../../src/features/world/tactical-map/utils/applyOperationToScene.ts).
  - `combat.start`: `round=1`, `currentTokenId = orderTokenIds[0]`, `order = orderTokenIds`.
  - `combat.turn` bez `tokenId`: posun na další v `order`, po posledním `round++`.
  - `combat.turn { tokenId }`: skok na konkrétní token (beze změny round).
  - `combat.end`: `combat = null`.
- ~~**`inCombat` toggle:** badge „V BOJI / MIMO BOJ" v TokenInfoPanel (10.2c-edit-4)~~ — **OPRAVA (2026-05-30): toggle reálně NEexistoval** (roadmapa 10.2c-edit-4 ho deklarovala, ale nebyl implementován). Doplněn v rámci f-1: tlačítko „⚔ V boji / Mimo boj" v `actions` panelu tokenu (TacticalMapView → TokenInfoPanel header), PJ-only, přes `useTokenUpdate { patch: { inCombat } }`.
- **`TokenLayer`** už dostává `activeTurnTokenId = scene.combat?.currentTokenId` → ring „na tahu" na mapě (zlatý `--map-token-ring-active-turn`).
- **Theme:** `--map-toolbar-bg`, `--map-toolbar-bg-solid`, `--map-toolbar-text`, `--map-token-ring-active-turn` (gold).

⇒ **10.2f = čistě nová UI vrstva nad hotovou logikou.** Žádné BE změny.

## 3. Komponenty (nové)

```
components/initiative/
  InitiativeBar.tsx        — horní full-width lišta; orchestruje stav
  InitiativeBarItem.tsx    — jeden bojovník (portrét, badge pořadí, jméno, init)
  InitiativeControls.tsx   — PJ ovládání: Zahájit/Ukončit boj, Další tah, kolo, Přeřadit, Hodit iniciativu
  InitiativeBar.module.css
hooks/
  useCombat.ts             — derivace seřazeného seznamu + mutace combat.* ops
```

`InitiativeBar` se renderuje v [TacticalMapView.tsx](../../../src/features/world/tactical-map/TacticalMapView.tsx) jako overlay `top:0; left:0; right:0` (nad PIXI canvasem, mimo transform root).

## 4. Chování — dva stavy

### Viditelnost — „v boji" + „mimo boj" sekce (REVIZE 2026-05-30)
*Doplněno dle starého Matrixu na žádost uživatele.* Lišta má dvě sekce:
- **V boji**: **PC tokeny VŽDY** (nelze vyřadit — hráčské postavy jsou trvale aktivní; u PC se proto nezobrazuje toggle „V boji/Mimo boj") + **NPC/bestie s `inCombat=true`**. Sortované živě dle iniciativy, s pořadím, barevné. Vidí **PJ i hráč**.
- **Mimo boj** (jen **NPC/bestie** s `inCombat=false`, za oddělovačem 🕊, ztlumené): vidí **jen PJ** (PC zde nikdy nejsou).
- `isPcToken = !isNpc && !bestie` (util). `useCombat.combatants = PC ∪ inCombat`, `bench = non-PC ∧ !inCombat`.
- Toggle „V boji/Mimo boj" v panelu tokenu jen pro NPC/bestie.
- Lišta skrytá jen když pro danou roli není co zobrazit.

### Živé pořadí (REVIZE 2026-05-30, user feedback)
- **`combatants` = `inCombat` tokeny sortované ŽIVĚ dle `initiative` desc** — i za běžícího boje. `combat.order` snapshot se pro zobrazení **NEpoužívá**.
  - **Bod 1:** změna čísla iniciativy → pořadí se přepočítá automaticky (žádné manuální „Přeřadit").
  - **Bod 3:** token nově zařazený do boje (`inCombat=true`) se objeví v liště **hned**, i uprostřed boje.
- `nextTurn()` počítá další tah z živého pořadí: najdi `currentTokenId`, jdi na další; po posledním → `round+1`. Posílá **explicitní `tokenId` + `round`** (`combat.turn { tokenId, round }`) — FE řídí pořadí tahů.
- BE `combat.turn` rozšířen o optional `round` override; validace `tokenId` uvolněna z „v order" na „existuje na scéně". `combat.reorder` (f-2) a tlačítko „Přeřadit" **odstraněny** (živý sort je nahrazuje).

### Stav A — boj NEAKTIVNÍ (`combat == null`)
- Sekce „v boji" zobrazuje tokeny `inCombat === true`, **sortované client-side dle `initiative` desc** (tie-break: jméno).
- PJ vidí tlačítko **„Zahájit boj"** → `combat.start { orderTokenIds: <aktuální sorted ids> }`.
- Badge pořadí = pozice v sortu (1, 2, 3…), ale je to jen náhled — závazné pořadí vznikne až startem.

### Stav B — boj AKTIVNÍ (`combat.isActive`)
- Lišta zobrazuje tokeny v pořadí **`combat.order`** (snapshot ze startu).
- **Highlight `currentTokenId`** — zlatý glow ring + pulse (na řadě).
- Round counter: „Kolo {combat.round}".
- PJ ovládání: **„Další tah"** (`combat.turn {}`), **„Ukončit boj"** (`combat.end`).
- Klik na konkrétní položku → kromě pan-to-token i PJ může **přeskočit na něj** (`combat.turn { tokenId }`) — viz rozhodnutí §8.

### Společné (oba stavy)
- **Klik na položku** (tělo) = **pan-to-token** (vycentruje token, plynulý tween ~250ms) + **spotlight** (§4a). Funguje PJ i hráči (hráči jen lokálně, viz §6).
- **„i" badge** na položce = otevřít deník/info (`onOpenInfo`, stejně jako na mapě).
- Token, který přestane být `inCombat` nebo je odebrán, ze Stavu A zmizí; ve Stavu B zůstává v `order` dokud boj neskončí (řeší §8).

### 4a. Spotlight (červený kruh) — „ukazováček" PJ
- **PJ** klikne na položku → token na mapě dostane **červený pulsující kruh**, **broadcast všem** (~3 s, pak zhasne) → hráči vidí, o koho PJ mluví. Klíčové u bestií (víc stejných na mapě).
- Implementace broadcastu přes WS (reuse/propojení s `ping` infrastrukturou — 10.2m; pokud ping op ještě nebude, lehký dedikovaný spotlight op/event vyřeší impl. plán).
- **Hráč** klikne → jen lokální pan + lokální zvýraznění (nebroadcastuje).
- Ring stav je nezávislý na zlatém „na tahu" (`currentTokenId`) a fialovém „selected". Nový theme token `--map-token-ring-spotlight` (červená).

**Barvy ringů (potvrzeno 2026-05-30):** „na tahu" (`currentTokenId`) = **zlatý + výrazný glow & pulse** — token na tahu musí být na mapě nepřehlédnutelný. Spotlight = **červený** dočasný puls. Selected = fialový. Tři odlišné signály, tři barvy.

## 5. Položka lišty (`InitiativeBarItem`) — vzhled

Port z Matrix `.mx-map-token-item`:
- Kruhový portrét (`characterData.imageUrl`, fallback iniciály) ~40px.
- **Border 2px = HP tier barva** (zelená `#4CAF50` / žlutá `#ffb300` / červená `#d32f2f` / šedá mrtvý) — tier z `systemStats` damageable pole (reuse logika [TokenHpBar.tsx](../../../src/features/world/tactical-map/components/tokens/TokenHpBar.tsx)).
- **Badge pořadí** bottom-right corner, 20×20px, kruh, `background = HP barva`, text pořadí.
- Jméno pod/vedle portrétu, truncate.
- **Na tahu** (`currentTokenId`): zlatý glow ring + lehký scale/pulse.
- **InitiativeInput** (číslo): editovatelný dle permission (§6), jinak read-only číslo.

## 6. Oprávnění

| Akce | Kdo |
|---|---|
| Zahájit / ukončit boj, Další tah, skok na token | PJ (`>= PomocnyPJ`) |
| Editovat `initiative` (input) | PJ všem; hráč jen vlastní PC token |
| Měnit `inCombat` | PJ (přes TokenInfoPanel, už hotové) |
| Klik = pan-to-token, „i" = deník | PJ i hráč |

Lišta je pro hráče jinak **read-only**.

## 7. Pan-to-token

Nová funkce v [useViewportPanZoom.ts](../../../src/features/world/tactical-map/hooks/useViewportPanZoom.ts) — `centerOnHex(q, r)` / `panToToken(token)`: spočítá `axialToPixel` + offset tak, aby token byl ve středu viewportu (zoom ponechá). Navazuje na existující `fitToViewport`. Plynulý (CSS/rAF tween, ne skok) — viz §8.

## 8. Rozhodnutí (potvrzeno 2026-05-30)

1. **Zadávání iniciativy** *(REVIZE dle user feedbacku 2026-05-30)* — **hromadný hod z lišty zrušen**. Iniciativa se zadává:
   - **Ručně** přes `InitiativeInput` na položce (PJ všem, hráč vlastní PC; bestie přes pole „Init aktuální" v panelu).
   - **Individuálním hodem z postavy** — tlačítko „⚡ Iniciativa" v panelu tokenu (`SheetInitiativeButton`) hodí kostku systému; výsledek se **propíše do `token.initiative`** (přes `performSheetRoll` → `useTokenUpdate`, detekce dle labelu „Iniciativa"). Tím se hod objeví v liště.
   - **Přeřazení za boje:** tlačítko **„⇅ Přeřadit"** přepíše `combat.order` dle aktuálních hodnot, **zachová kolo** (op `combat.reorder`, jediný zásah do ops/patcheru). Hromadná kostka 🎲 odstraněna z `InitiativeControls`.
2. **Skok na token (Stav B)** — klik na položku = pan + spotlight; **skok „na tah" jen přes dedikované PJ tlačítko** na položce (`combat.turn { tokenId }`), ne omylem klikem.
3. **Pan** — plynulý tween ~250ms.
4. **Spotlight** — viz §4a; červený broadcast kruh při PJ kliku.

## 9. Mimo rozsah 10.2f

- **Skupiny / frakce** (řeší orchestr; viz D-064).
- **Token grafický polish** (glow ring, větší HP bar) — samostatný krok po 10.2f.
- **`endOfTurnEffects` UI** (damage-over-time efekty) — ops existují, ale UI patří k 10.2g (efekty). Combat tracker MVP bez nich.
- **3D dice overlay** hodu za iniciativu — to je 10.2j. V 10.2f je **numerický hod** (výsledek se zapíše do `token.initiative`), bez 3D animace.

## 10. Responsive (povinné — `base.md`, skill `mobil-desktop`)

- **Desktop (>1024px):** plná lišta, portréty 40px, jména viditelná.
- **Tablet (769–1024):** kompaktnější, jména truncate kratší.
- **Mobil (≤768px):** lišta horizontálně scrollovatelná (`overflow-x:auto`), portréty menší (~32px), PJ ovládání do kompaktního menu/řádku pod tím. Pan-to-token musí fungovat i touch.

## 11. Testy

- `useCombat` — sort dle initiative desc + tie-break, derivace next-token, mapování na `combat.*` ops.
- `InitiativeBarItem` — HP tier barva, badge pořadí, highlight na tahu, permission edit gate.
- `InitiativeBar` — empty (žádný inCombat) = hidden; stav A vs B render; klik = pan + spotlight callback.
- `centerOnHex` — výpočet offsetu (token ve středu).
- Přeřazení — `combat.reorder`/`keepRound` zachová `round`; hod za iniciativu zapíše `initiative` + přeřadí.
- Spotlight — PJ klik broadcastuje, hráč klik nebroadcastuje; ring zhasne po timeoutu.

## 12. Po implementaci

- Zaškrtnout `10.2f` v `docs/roadmap-fe.md`.
- Skill `mobil-desktop` audit.
- Skill `napoveda` (nová funkčnost boje na mapě).
