# Spec 6.3-fix6 — 2D snímek hodu = materiálová placka (sjednocení s 3D)

**Status:** 🟢 Implementováno 2026-06-19 (čeká vizuální ověření na živém hodu)
**Rozsah:** FE only — render 2D historie hodu v chatu
**Repo:** `Projekt-ikaros-FE`
**Autor:** PJ + Claude · 2026-06-19
**Souvisí:** [spec-6.3-fix4](spec-6.3-fix4-real-3d-dice.md) (3D materiály), [spec-6.3-fix5](spec-6.3-fix5-dice-ghost-warmup.md)

> Cíl: 2D snímek hodu v chatu vypadá jako **ta kostka, kterou jsem hodil** — stejný materiál jako 3D overlay i picker, jen s číslem hozené tváře.

---

## 1. Problém

2D snímek hodu v chatové historii **neodpovídá hozené kostce** („toto nejsou kostky, kterými házím"). První kostka navíc vypadá nesmyslně (d8 = trojúhelník ve fotce).

## 2. Root cause (ověřeno čtením kódu)

Po [spec-6.3-fix4](spec-6.3-fix4-real-3d-dice.md) existují **dva nekompatibilní systémy ID skinů**:

| Systém | Soubor | ID | Použití |
|---|---|---|---|
| **3D materiály** (živé) | [dice3dMaterials.ts](../../../src/features/world/chat/dice/lib/dice3dMaterials.ts) | `kamen-obsidian`, `kov-…` | picker, 3D overlay, ukládá se do `ChatMessage.diceSkin` |
| **2D skiny** (mrtvé) | [diceSkins.ts](../../../src/features/world/chat/dice/lib/diceSkins.ts) | `core-obsidian`, `elemental-…` | jen 2D historie chatu |

- Send flow uloží do zprávy **materiál ID** ([useDiceSkinMapping.ts:31](../../../src/features/world/chat/dice/api/useDiceSkinMapping.ts#L31)).
- 2D render volá `getDiceSkin('kamen-obsidian')` → v 2D skinech **neexistuje** → fallback na `core-obsidian` ([diceSkins.ts:918](../../../src/features/world/chat/dice/lib/diceSkins.ts#L918)).

➡️ **2D historie je trvale zamrzlá na `core-obsidian`** bez ohledu na zvolený materiál. Stovky cloudinary per-číslo obrázků starého systému jsou navíc mrtvý balast.

## 3. Řešení — placka z materiálu (reuse picker chip)

2D snímek přestane používat starý 2D skin systém a místo toho vykreslí **materiálovou placku** ve stylu picker chipu ([DicePickerPopover.tsx:223](../../../src/features/world/chat/dice/components/DicePickerPopover.tsx#L223)), jen s číslem hozené tváře.

### 3.1 Vizuál (frontend-design audit)

Reuse design jazyka `.chip` z [DicePickerPopover.module.css](../../../src/features/world/chat/dice/components/DicePickerPopover.module.css#L115-L214):

- **kruh**, materiál přes `object-fit: cover` (`materialPreviewUrl(materialId)`)
- **radiální tmavý scrim** pod číslem (čitelnost na světlém i tmavém materiálu)
- **číslo** = hozená tvář, font `Iceland`, bílé, tmavý `text-shadow`
- žádná barva čísla per materiál — scrim + stín stačí (ověřeno na světlém k10/k12 v pickeru)

### 3.2 Zdroj materiálu

`materialId = resolveMaterialId(message.diceSkin)` → platný materiál vždy:
- nový hod → přesně zvolený materiál (shoda s 3D),
- legacy zpráva (`core-*`) / `null` → default `kamen-obsidian`, nikdy prázdno.

### 3.3 Více kostek / typy

`buildDieDefs(payload)` (mapování payload → kostky) **zůstává**. Render každé kostky = jedna placka:
- `pool` / `mixed` → N placek v řadě,
- `d100` → 2 placky (desítky + jednotky),
- `fate` → placka se symbolem `+ / − / 0` místo čísla.

### 3.4 Beze změny

Total box, label chip (`Magie +2`), subtitle (`součet hodu`), overpressure — **nedotčené**.

## 4. Mimo rozsah

| Položka | Důvod |
|---|---|
| Smazání starého 2D skin systému (`diceSkins.ts`, cloudinary obrázky, `cdnImage`, `RollingDie` 3D model) | Po přepnutí renderu se stane mrtvým → samostatný cleanup (dluh), ne v tomto kroku (risk: skin picker preview může část ještě číst — ověřit). |
| Rolling animace 2D kostky v chatu | Už dnes vypnutá (`rolling=false`); placka je statická. |
| „Hod se nepropsal" | Samostatný bug (optimistic send / WS), řeší se zvlášť. |
| Změna BE/WS/`ChatMessage.diceSkin` kontraktu | `diceSkin` už nese materiál ID; jen ho začneme správně číst. |

## 5. Akceptační kritéria

- [ ] 2D snímek v chatu zobrazuje **materiál zvolené kostky** (shoda s 3D overlay i picker chipem). _(ověřit na živo)_
- [ ] Číslo na placce = hozená tvář, čitelné na světlém i tmavém materiálu. _(ověřit na živo)_
- [x] Pool/mixed/d100/fate renderují správný počet placek (`buildDieDefs` nezměněn) se správnými hodnotami (`faceLabel`: 10→0, 0→00, fate +/−/0).
- [x] Legacy zprávy (`core-*` / bez skinu) → `resolveMaterialId` → default `kamen-obsidian`, žádný prázdný/rozbitý render.
- [x] `tsc -b` zelený; dice testy zelené (139/139).
- [x] `mobil-desktop` — `.scene` flex-wrap + `.row` wrap → bez horizontálního scrollu na 375/768/1440 (statická CSS analýza; vizuál placky čeká na živý hod).

## 6. Implementace

- [DiceFaceChip.tsx](../../../src/features/world/chat/dice/components/DiceFaceChip.tsx) + [.module.css](../../../src/features/world/chat/dice/components/DiceFaceChip.module.css) — nová kruhová placka: `materialPreviewUrl` + scrim + glyf (`Iceland`), `faceLabel`.
- [DiceMessageScene.tsx](../../../src/features/world/chat/dice/components/DiceMessageScene.tsx) — `RollingDie`+`getDiceSkin` → `DiceFaceChip` + `resolveMaterialId(skinId)`; `buildDieDefs` zachován.
- [DiceMessage.tsx](../../../src/features/world/chat/dice/components/DiceMessage.tsx) — odpadl `rolling` prop.

✅ **Cleanup zmrtvělého kódu HOTOVÝ (2026-06-19, dluh D-NEW-DICE-2D-LEGACY uzavřen):** smazána celá mrtvá galaxie starého 2D skin systému — `RollingDiceScene.tsx`(+css), celý `components/models/`, `lib/diceSkins.ts`, `cdnImage.ts`, `texturePreloader.ts`, `diceTargets.ts`, `faceRotations.ts`, `rotationMath.ts` + jejich `.spec`. Ověřeno: skin picker už jede na materiálech (`materialPreviewUrl`), `pickRepresentativeImg`/`getSkinsByCategory` neměly konzumenta. `DieType` přesunut do `DiceFaceChip.tsx`. `tsc -b` zelený, žádný visící import. Ponecháno (mimo rozsah, nezávislé na skinu): `DiceMessageFallback`, `isFreshRoll`, `formatMessage`, `rollEngine`.

---

**Po schválení:** impl. plán (nová `DiceFaceChip` placka, napojení v `DiceMessageScene`, fallback materiál, dotčené soubory) → potvrzení → kód → `mobil-desktop` → zvážit cleanup dluh starého skin systému.
