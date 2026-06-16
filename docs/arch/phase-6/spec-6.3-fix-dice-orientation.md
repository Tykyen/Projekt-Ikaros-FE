# Spec 6.3-fix — Oprava orientace dosednutí 3D kostek

**Status:** ✅ Implementováno (2026-06-15) — TARGETS inverze + onError fallback textur (nález 1) + preloader cloudinary (nález 3); build ✓, test 64/64 ✓
**Rozsah:** FE only — kalibrace cílových rotací kostek (`diceTargets.ts` + aplikace v `RollingDiceScene` / `DiceRollOverlay`) + unit test
**Repo:** `Projekt-ikaros-FE`
**Velikost:** odhad ~3 soubory / ~120 ř. (+1 test)
**Autor:** PJ + Claude
**Datum:** 2026-06-15
**Souvisí:** [spec-6.3.md](spec-6.3.md) (§4.6 3D rendering, §0 settled state)

> Cíl: D12 a D20 musí po dohození dosednout **hozenou tváří čelem k divákovi**, ne nakloněné/hranou. Dnes ~polovina tváří dosedne otočená až o 158° → vypadá jako tenká čára nebo placka. Důvod: cílové rotace nejsou matematickou inverzí CSS transformů tváří.

---

## 1. Problém (potvrzeno vizuálně + výpočtem)

Hráč hodí D20 → výsledek 19 → kostka dosedne **otočená o 158°** (tvář 19 míří od diváka), v overlay vidíme jen cyan „čáru". Reprodukováno na screenshotech PJ (D20=19, další hody zploštělé na pruh).

Výpočet reziduálního náklonu (odklon normály hozené tváře od diváka; `0°` = tvář přesně čelem):

| Kostka | Tváří | Špatně dosedá | Max náklon |
|---|---|---|---|
| D6 | 6 | 0 | 0° ✅ |
| D8 | 8 | 0 | 0° ✅ |
| D10 | 10 | 0 | 0° ✅ |
| **D12** | 12 | **5** (tváře 2,3,4,5,6) | **148°** ✗ |
| **D20** | 20 | **10** (tváře 6–10, 16–20) | **158°** ✗ |

Rozbité jsou **právě tváře, které mají v CSS `rotateZ(180deg)`** ([polyhedralDice.css](../../../src/features/world/chat/dice/components/models/polyhedralDice.css) `.d12-face-2..6`, `.d20-face-6..10/16..20`).

## 2. Příčina (root cause)

3D rotace nejsou komutativní — záleží na pořadí os. Každá tvář je v CSS umístěná složenou rotací, např. `.d20-face-19 { rotateY(252) rotateX(-52.62) rotateZ(180) }`. Aby tvář dosedla čelem, musí `cube` dostat **přesnou inverzi** té rotace.

Jenže [diceTargets.ts](../../../src/features/world/chat/dice/lib/diceTargets.ts) ukládá cíl jen jako trojici `{rx, ry, rz}` a aplikuje ji **vždy** v pevném pořadí `rotateX(rx) rotateY(ry) rotateZ(rz)` ([RollingDiceScene.tsx:61](../../../src/features/world/chat/dice/components/RollingDiceScene.tsx#L61), [DiceRollOverlay.tsx:445](../../../src/features/world/chat/dice/components/DiceRollOverlay.tsx#L445)). Pro tváře s `rz:180` toto pořadí **není** inverzí CSS transformu (`Rz` nekomutuje s `Rx`/`Ry`) → zbude reziduální náklon ≈ 2× úhel sklonu tváře.

📚 **Proč D8/D10 fungují, i když mají taky `rz:180` tváře?** Jejich TARGETS jsou parametrizované jinak — překlopení řeší přes `rx` (`144.74 = 180−35.26`) místo `rz:180`, čímž se pevné pořadí `Rx·Ry·Rz` náhodou trefí do inverze. D12/D20 dostaly `rz:180` přímo → minou. Tedy nejde o náhodu — jde o **dva nekonzistentní způsoby zápisu téhož**, z nichž jeden je matematicky špatně.

⚠️ Komentář v [diceTargets.ts:9](../../../src/features/world/chat/dice/lib/diceTargets.ts#L9) mluví o „převodu na quaterniony" — ten se ale nikdy neděje, port aplikuje Euler úhly naivně. Komentář je zavádějící.

## 3. Řešení — varianta A (přesná inverze)

Cílová orientace kostky = **skutečná inverze rotace tváře**, deterministicky pro všechny tváře.

### 3.1 Princip

Pro tvář se složenou rotací `R = op₁ · op₂ · … · opₙ` platí `R⁻¹ = opₙ⁻¹ · … · op₁⁻¹` (obrácené pořadí, opačné úhly). V CSS to znamená cílový transform kostky:

```
face:   rotateY(a) rotateX(b) rotateZ(c)
cube:   rotateZ(-c) rotateX(-b) rotateY(-a)      ← obrácené pořadí + záporné úhly
```

Tím je `cube · face = identita` → tvář vždy přesně čelem, bez ohledu na kombinaci os.

### 3.2 Single source of truth

Kořen problému je, že CSS face transformy a TARGETS jsou **dvě oddělené ručně psané kopie téže geometrie**, které se rozešly. Fix proto zavede jeden zdroj:

- **`faceRotations.ts`** (nový) — pro každý typ kostky a tvář pole rotačních ops `[['y', 252], ['x', -52.62], ['z', 180]]`, zrcadlí přesně CSS/inline transformy modelů (bez `translateZ`, který orientaci nemění).
- Z něj se generuje cílová orientace jako **přesná inverze** (obrácené pořadí + negace úhlů) — buď jako CSS string, nebo jako přepočtené `{rx,ry,rz}` (rozhodne impl. plán; preferuji CSS string kvůli žádné gimbal singularitě).
- `diceTargets.ts` TARGETS se z tohoto zdroje **odvodí** (nebo nahradí), takže se víc nemůžou rozejít.

### 3.3 Rozsah aplikace

- **Settled stav** (finální dosednutí — co divák vidí): přesná inverze. Toto je jádro opravy.
- **Settling animace** (0,4 s dolet do cíle): ponechat stávající lerp, jen koncový snap míří na přesnou inverzi. Drobná nepřesnost během letu je neviditelná.
- Dotčená místa: `RollingDiceScene` (chat) + `DiceRollOverlay` (fullscreen).

## 4. Mimo rozsah

| Položka | Důvod |
|---|---|
| **D4 (tetraedr)** | Tetraedr se nečte „tváří čelem", ale stojící na podstavě s číslem u vrcholu — metrika tvář-čelem je pro něj nevhodná. Vizuálně OK (potvrzeno screenshotem D4=1). Nesahat. |
| **Fate** | V chatu se renderuje jako 2D obrázek správné tváře (ne přes TARGETS), v overlay má vědomý workaround `{0,0,0}` + symbol na přední tvář. Dosedá správně; „nekutálí se" je samostatné design téma, ne bug orientace. |
| **D6/D8/D10** | Už dosedají správně (0° náklon). Fix je nesmí rozbít → pohlídá test. |
| Cloudinary→lokální textury, mrtvý preloader, prázdné kostky při výpadku textury | Samostatné nálezy (N1–N3 z auditu) — zapsat do `dluhy.md`, řešit zvlášť. |
| Zavádějící „quaternion" komentář | Opravit textaci při zásahu (zadarmo). |

## 5. Akceptační kritéria

- [ ] **Unit test** `diceTargets.spec.ts` (nebo `faceRotations.spec.ts`): pro **každou tvář každého typu** (D6/D8/D10/D12/D20) je reziduální náklon `cube · face` **< 0,5°**. Toto je tvrdá brána proti regresi — přesně ten výpočet, co odhalil bug.
- [ ] D20 hod 19 (a 6–10, 16–20) dosedne tváří čelem k divákovi (vizuálně ověřeno).
- [ ] D12 hod 2–6 dosedne tváří čelem.
- [ ] D6/D8/D10 beze změny (regresní část testu zelená).
- [ ] D4 + Fate beze změny.
- [ ] `npm run build` (tsc -b) zelený.
- [ ] `mobil-desktop` audit (vizuál hodu na obou).

## 6. Otevřené otázky pro PJ

Žádné blokující. Volitelné rozhodnutí v impl. plánu: reprezentace cíle (CSS string vs přepočtené Euler `{rx,ry,rz}`) — vyberu CSS string (přesný, bez singularit), pokud nebudou námitky.

---

**Po schválení tohoto spec:**
1. Napíšu `plan-6.3-fix-dice-orientation.md` (konkrétní mapování ops + soubory).
2. Implementace → unit test → `mobil-desktop` audit.
3. Zapíšu související nálezy (cloudinary/preloader) do `dluhy.md`.
