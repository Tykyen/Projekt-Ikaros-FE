# Plán 6.3-fix — Oprava orientace dosednutí 3D kostek

**Spec:** [spec-6.3-fix-dice-orientation.md](spec-6.3-fix-dice-orientation.md) (schváleno PJ 2026-06-15)
**Přístup:** runtime derivace TARGETS z jednoho zdroje geometrie. Aplikace i interpolace v konzumentech **beze změny** — měníme jen hodnoty.

---

## Zvolená technika (ověřená empiricky)

TARGETS pro každou tvář = Euler `{rx,ry,rz}` odvozené z **inverzní rotační matice tváře**, dekomponované pro pořadí `rotateX·rotateY·rotateZ` (= pořadí, v němž konzumenti CSS aplikují). Ověřeno na všech 56 tvářích D6/D8/D10/D12/D20 → max reziduum **1,2 × 10⁻⁶°**.

💡 Proč ne reverse-order CSS string: overlay settle fázi interpoluje rx/ry/rz lineárně v JS ([DiceRollOverlay.tsx:342](../../../src/features/world/chat/dice/components/DiceRollOverlay.tsx#L342)). Zachováním `{rx,ry,rz}` formátu se overlay ani RollingDiceScene **nemusí sahat** → nejmenší možný zásah a riziko.

---

## Kroky

### 1. `lib/rotationMath.ts` (nový, ~40 ř.)
Čisté helpery (bez DOM): `matMul`, `Rx/Ry/Rz` (3×3, stupně), `compose(ops)`, `transpose`, `decomposeXYZ(M) → {rx,ry,rz}`. Přesně ty, co jsem použil v ověřovacím skriptu. Reusable i testem.

### 2. `lib/faceRotations.ts` (nový, ~30 ř.)
Jediný zdroj geometrie tváří — `FACE_ROTATIONS: Record<'d6'|'d8'|'d10'|'d12'|'d20', Op[][]>`, kde `Op = ['x'|'y'|'z', deg]`. Hodnoty **zrcadlí** existující CSS/inline transformy (bez `translateZ`, který orientaci nemění):
- d6 ← inline v [D6Model.tsx](../../../src/features/world/chat/dice/components/models/D6Model.tsx) (`rotateY 0/180/90/-90`, `rotateX 90/-90`).
- d8/d10/d12/d20 ← [polyhedralDice.css](../../../src/features/world/chat/dice/components/models/polyhedralDice.css) (`.dN-face-K`).

⚠️ Komentář v souboru: „tyto rotace MUSÍ odpovídat CSS `.dN-face-K`; změna CSS ⇒ změna zde ⇒ test to ohlídá".

### 3. `lib/diceTargets.ts` (úprava)
- `D6/D8/D10/D12/D20_TARGETS` = `FACE_ROTATIONS[type].map(ops => decomposeXYZ(transpose(compose(ops))))`.
- **Beze změny:** `D4_TARGETS` (tetraedr, mimo rozsah), `FATE_TARGETS`, `targetForGeneric`, `targetForFate`, typy. Konzumenti se nedotknou.
- Opravit zavádějící „quaternion" komentář ([:9](../../../src/features/world/chat/dice/lib/diceTargets.ts#L9)) na realitu (Euler inverze).

### 4. `lib/diceTargets.spec.ts` (nový test)
Pro **každou tvář každého typu** D6/D8/D10/D12/D20: `tilt(apply(TARGETS[i]), faceMatrix[i]) < 0,5°` (apply = `Rx·Ry·Rz`, tilt = odklon normály od +Z). Toto je anti-regresní brána — kdokoli rozhodí geometrii nebo generátor, test zčervená. Navíc 1 sanity test, že D12 tvář 6 a D20 tvář 19 (dříve 148°/158°) jsou teď < 0,5°.

### 5. Ověření
- `npm run build` (tsc -b) zelený — [project_fe_build_preexisting_errors].
- `npx vitest run diceTargets` zelený (FE bez globals, explicit importy — [project_fe_test_precommit]).
- `mobil-desktop` skill: vizuálně hod D20/D12 na mobilu i desktopu (dosedá tváří čelem).

### 6. `docs/dluhy.md` (zápis souvisejících nálezů, neopravujeme teď)
- 🔴 Kostky bez čísla při výpadku Cloudinary (`!faceImg` ≠ „načteno") + chybí `onError` fallback.
- ⚠️ `public/textures/` ~99 % nevyužitá kopie (544 cloudinary vs 5 lokálních URL) — nedokončená migrace.
- ⚠️ `texturePreloader` mrtvý pro cloudinary skiny (sbírá jen `/textures/`).
- 💡 follow-up: CSS face transformy generovat z `faceRotations` (úplná eliminace drift) — větší refaktor modelů, mimo tento fix.

---

## Rozsah zásahu
| Soubor | Akce | ~ř. |
|---|---|---|
| `lib/rotationMath.ts` | nový | 40 |
| `lib/faceRotations.ts` | nový | 30 |
| `lib/diceTargets.ts` | úprava (derivace + komentář) | ~30 změn |
| `lib/diceTargets.spec.ts` | nový | 50 |
| `docs/dluhy.md` | zápis | — |

**Bez zásahu:** modely, CSS, RollingDiceScene, DiceRollOverlay, DiceMessage, BE. Žádná data migrace.

## Rizika
- **faceRotations ≠ CSS** (překlep při opisu) → test reziduum > 0,5° hned chytí. Nízké.
- **Gimbal v dekompozici** → ověřeno na všech 56 tvářích (max 1,2e-6°), žádná tvář není v singularitě. Nehrozí.
- Settle-fáze interpolace může jít „delší cestou" do nové cílové hodnoty → kosmetika letícího hodu, neviditelné. Zanedbatelné.
