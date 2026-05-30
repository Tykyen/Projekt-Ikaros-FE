# Implementační plán 10.2f — Iniciativa

*Spec: [spec-10.2f.md](spec-10.2f.md). Stav: ✅ HOTOVO (2026-05-30) — f-1 + f-2 + f-3 implementovány a otestovány.*

## Fázování (kompletní funkční sub-kroky)

Rozděleno tak, aby každý sub-krok byl **samostatně funkční celek** (žádná polovičatá impl. — `feedback_no_debt`). Pořadí dle priority „pořadí tahů = alfa omega":

| Sub-krok | Obsah | BE zásah? |
|---|---|---|
| **10.2f-1** | Iniciativní lišta + combat tracker (jádro pořadí tahů) | ne (FE only) |
| **10.2f-2** | Přeřazení / hod iniciativy během aktivního boje se zachováním kola | ano (1 op rozšíření) |
| **10.2f-3** | Spotlight (červený broadcast kruh) | ano (1 WS event) |

f-1 je plnohodnotné MVP (nastav iniciativy ručně/hodem → zahaj boj → tahy/kola/„na tahu"). f-2 a f-3 jsou oddělitelná rozšíření. **Potvrď, zda jedeme všechny tři za sebou, nebo jen f-1 a zbytek později.**

---

## 10.2f-1 — Iniciativní lišta + combat tracker (FE)

### A. Theme — ring barvy
- [`src/themes/_shared/map-tokens.css`] přidat `--map-token-ring-spotlight: #ff3b3b` (zatím nepoužito v f-1, ale definovat) a zesílit „na tahu": glow proměnnou `--map-token-ring-active-turn-glow`. Per-skin override volitelně.
- **„Na tahu" glow & pulse** — v [TokenSprite.tsx](../../../src/features/world/tactical-map/components/tokens/TokenSprite.tsx) `drawRing`: pro `isActiveTurn` přidat druhý širší poloprůhledný ring (glow) + jemný `alpha`/`scale` pulse (rAF nebo @pixi/react tick). Aby byl token na tahu nepřehlédnutelný.

### B. Pan-to-token — `centerOnHex`
- [useViewportPanZoom.ts](../../../src/features/world/tactical-map/hooks/useViewportPanZoom.ts) přidat `centerOnHex(q, r, opts?)` analogicky k `fitToViewport` (řádky 282-303):
  - `pixel = axialToPixel(q, r, config.size)` + `originX/Y`; `offsetX = viewW/2 - pixel.x*zoom`, `offsetY = viewH/2 - pixel.y*zoom`; zoom ponechat.
  - **Tween ~250ms** — interpolace offsetu přes rAF (ease-out). Export v result objektu.
- Test: výpočet offsetu (token ve středu) v [__tests__/useViewportPanZoom.test.tsx](../../../src/features/world/tactical-map/hooks/__tests__/useViewportPanZoom.test.tsx).

### C. `useCombat` hook
- Nový [hooks/useCombat.ts]. Vstup: `scene`, `worldId`. Vrací:
  - `combatants` — Stav A (`combat==null`): `tokens.filter(inCombat).sort(initiative desc, jméno)`. Stav B: `combat.order` namapované na tokeny (přeskoč chybějící).
  - `isActive`, `round`, `currentTokenId`.
  - mutace (mutation pattern dle [useTokenUpdate.ts](../../../src/features/world/tactical-map/hooks/useTokenUpdate.ts) — optimistic + invalidate): `start()` (`combat.start { orderTokenIds }`), `nextTurn()` (`combat.turn {}`), `jumpTo(tokenId)` (`combat.turn { tokenId }`), `end()` (`combat.end`).
  - `rollInitiative()` — pro každý `inCombat` token: `roll = randInt(dle systemDefaultDice z map-systems pluginu) + token.initiativeBase`; zapíše přes `token.update { patch: { initiative } }`; (přeřazení order řeší f-2 pokud boj běží, jinak se projeví v sortu Stavu A okamžitě).
- Test: sort, derivace combatants A/B, mapování ops.

### D. `InitiativeBarItem`
- Nový [components/initiative/InitiativeBarItem.tsx]. Props: `token`, `order` (index), `isCurrent`, `canEditInit`, `onClick`, `onOpenInfo`, `onJumpTo?`.
- Portrét (kruh, `characterData.imageUrl`, fallback iniciály — reuse `getInitials` z TokenSprite, vyextrahovat do `utils/`).
- **HP-tier border 2px** — barva z `systemStats` damageable pole; reuse tier logiku z [TokenHpBar.tsx](../../../src/features/world/tactical-map/components/tokens/TokenHpBar.tsx) (vyextrahovat `hpTierColor(stats, schema)` do `utils/hpTier.ts` + test, použít na obou místech).
- **Badge pořadí** bottom-right, barva = HP tier.
- `InitiativeInput` (číslo) — port [C:\Matrix\Matrix\frontend\src\components\Map\InitiativeInput.tsx]; editovatelný dle `canEditInit`, jinak read-only. Změna → `token.update { patch: { initiative } }`.
- Jméno truncate. `isCurrent` → zlatý highlight. PJ: malé „⏱" tlačítko = `onJumpTo`.

### E. `InitiativeControls` (PJ)
- Nový [components/initiative/InitiativeControls.tsx]. Stav A: „Hodit iniciativu", „Zahájit boj". Stav B: „Kolo {round}", „Další tah", „Ukončit boj", („Přeřadit"/„Hodit" → f-2). Render jen pro `isPj`.

### F. `InitiativeBar` + zapojení
- Nový [components/initiative/InitiativeBar.tsx] + `.module.css`. Empty (`combatants.length===0` && `!isActive`) → `null`. Layout `top:0;left:0;right:0`, `--map-toolbar-bg-solid`, `overflow-x:auto`.
- Zapojit v [TacticalMapView.tsx] jako overlay (vedle `MapPjPanel`, mimo PIXI). Předat `centerOnHex` (klik → pan), `isPj`, `onOpenInfo={setOpenedTokenId}`.
- Responsive CSS: desktop 40px portréty / tablet kompakt / mobil ≤768 32px + scroll + ovládání pod lištou.
- Testy: empty=hidden, A vs B render, klik→pan callback.

### G. Audit
- Skill `mobil-desktop`, build + testy zelené.

---

## 10.2f-2 — Reorder / hod během boje (BE + FE)

- **BE** (`Projekt-ikaros` backend, maps operations): rozšířit combat op o zachování kola. Volba (rozhodne se při čtení BE kódu): nová op `combat.reorder { orderTokenIds }` (přepíše `order`, ponechá `round`/`currentTokenId` pokud token zůstává), **nebo** `combat.start` + optional `round?`. + authorizer PJ-only + test.
- **FE**: zrcadlo v [types.ts](../../../src/features/world/tactical-map/types.ts) `MapOperation` + [applyOperationToScene.ts](../../../src/features/world/tactical-map/utils/applyOperationToScene.ts) case + test. `useCombat`: `reorder()` aktivní za boje; tlačítka v `InitiativeControls` Stav B.

---

## 10.2f-3 — Spotlight (BE WS + FE)

- **BE**: ephemeral WS event `map:spotlight { tokenId }` v MapsGateway (PJ-only, broadcast scéně; není v operation logu — pomíjivé). Ověřit, zda lze reuse `ping` infra (10.2m ještě nestaveno).
- **FE**: `useMapSocket` listener → lokální state `spotlightTokenId` (auto-clear ~3s). `TokenSprite` ring stav „spotlight" = červený pulse (`--map-token-ring-spotlight`). `InitiativeBar` klik (PJ) → emit; (hráč) → jen lokální. Test.

---

## Pořadí stavby
B (centerOnHex) → A (theme/glow) → C (useCombat) → D → E → F → G; pak f-2, f-3.

## Klíčové reuse / pozory
- 💡 Mutation hooky kopírují optimistic+invalidate pattern z `useTokenUpdate` — žádný nový boilerplate.
- ⚠️ `hpTierColor` a `getInitials` dnes žijí uvnitř komponent — vyextrahovat do `utils/` se sdíleným testem, ať lišta a token nemají divergentní logiku.
- ⚠️ `combat.start` resetuje `round=1` — proto reorder za boje (f-2) NESMÍ jít přes `combat.start`.
