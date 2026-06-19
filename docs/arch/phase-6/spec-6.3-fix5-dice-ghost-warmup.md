# Spec 6.3-fix5 — Ghost warmup roll (kostka „jde až na podruhé")

**Status:** 🟢 Implementováno 2026-06-19 (čeká ověření na živé mapě: první hod napoprvé + ghost neviditelný)
**Rozsah:** FE only — bugfix render enginu 3D kostky
**Repo:** `Projekt-ikaros-FE`
**Autor:** PJ + Claude · 2026-06-19
**Souvisí:** [spec-6.3-fix4](spec-6.3-fix4-real-3d-dice.md) (zavedení 3D enginu + warmup)

> Cíl: první hod kostkou na taktické mapě se zobrazí **napoprvé**. Konec „někdy to jde až na podruhé".

---

## 1. Problém

Na taktické mapě se 3D kostka **občas nezobrazí napoprvé** — hráč musí hodit dvakrát. „Někdy" = časově závislé → race.

## 2. Root cause (ověřeno čtením kódu)

3D engine (`@drdreo/dice-box-threejs`) má **flaky úplně první `roll()`** — fyzikální svět / renderer se plně rozjede až prvním reálným hodem.

Existující `warmup` ([DiceRollOverlay.tsx](../../../src/features/world/chat/dice/components/DiceRollOverlay.tsx), [DiceBox3D.tsx](../../../src/features/world/chat/dice/components/DiceBox3D.tsx)) nahřívá **jen `initialize()`** (renderer, scéna, assety) — `box.roll()` během warmupu **nikdy neproběhne**, protože warmup mountuje engine s `active=false` a `rollNow()` má `if (!active) return`.

➡️ Důsledek: tvůj první reálný hod je **fakticky úplně první `roll()`** na enginu → trefí flaky-first → ztratí se. Druhý hod už trefí teplý engine. Warmup tedy zmírnil *jiné* okno (lazy-load chunku), ale kořen — flaky první `roll()` — nechal nedotčený.

## 3. Řešení — ghost warmup roll

Warmup po dokončení `initialize()` provede **jeden neviditelný skutečný `roll()`** (ghost). Tím se „spotřebuje" flaky první hod už při otevření mapy. Hráčův první reálný hod je pak fakticky druhý → spolehlivý.

### 3.1 Pravidla ghost rollu

- **Neviditelný:** host canvas je skrytý, dokud neběží *reálný* hod (`active`). Ghost se odkutálí mimo zrak.
- **Tichý:** žádný readout, žádný `onComplete` ven do overlay, žádný zvuk (`sounds:false` už je).
- **Best-effort, nikdy nepřekáží:** když hráč hodí reálně dřív, než ghost doběhne, **reálný hod má vždy přednost** — zruší ghost a proběhne normálně. Ghost nikdy nesmí spolknout ani zdržet reálný hod.
- **Jen jednou:** ghost se spustí max. jednou na životnost enginu (po prvním `ready`).
- **Jen tam, kde warmup=true** (taktická mapa). Chat beze změny (žádný eager 3D pro běžné uživatele).

### 3.2 Mimo rozsah

| Položka | Důvod |
|---|---|
| Změna chatu / provideru | Warmup zapíná jen mapa; chat nemá eager 3D. |
| Změna WS/BE kontraktu | Čistě klientský render-timing. |
| Fallback bez WebGL | Beze změny — ghost běží jen když `webgl && warmup`. |

## 4. Akceptační kritéria

- [ ] První hod na taktické mapě se zobrazí napoprvé (opakovaně, i hned po otevření mapy). _(ověřit na živo)_
- [ ] Ghost kostka není **nikdy** vidět ani slyšet (žádný problesk uprostřed mapy při otevření). _(ověřit na živo)_
- [x] Hod reálně dřív, než ghost doběhne → reálný hod proběhne korektně (`rollNow` zruší ghost: `isGhostRef=false` + `clearDice`).
- [x] Chat (bez warmupu) beze změny chování (`warmup` prop neprochází z provideru → `warmup=undefined` → ghost se nespustí).
- [x] Bez WebGL → fallback beze změny (ghost běží jen pod `warmup && webgl`, mount3d se bez WebGL nenastaví).
- [x] `tsc -b` zelený; dice + tactical-map testy zelené (566/566).
- [ ] `mobil-desktop` audit (overlay na mobilu i desktopu).

## 5. Implementace

- [DiceBox3D.tsx](../../../src/features/world/chat/dice/components/DiceBox3D.tsx) — `warmup` prop, `isGhostRef`/`ghostDoneRef`, `runGhostRoll()` (max 1×), `onRollComplete` ghost-větev (uklidí, nepropaguje), `rollNow` ruší ghost, host `.hidden` když `!active`.
- [DiceBox3D.module.css](../../../src/features/world/chat/dice/components/DiceBox3D.module.css) — `.hidden { opacity: 0 }`.
- [DiceRollOverlay.tsx](../../../src/features/world/chat/dice/components/DiceRollOverlay.tsx) — předání `warmup` do `LazyDiceBox3D`.

📌 Mimo rozsah (vědomě): **chat** stále nemá warmup → tam „až na podruhé" přetrvává (žádný eager WebGL pro běžné uživatele, stejně jako fix4). Pokud bude vadit, řešit zvlášť.

---

**Po schválení:** impl. plán (kde dr/jak skrýt host, ghost-state flagy, přednost reálného hodu) → potvrzení → kód → `mobil-desktop`.
