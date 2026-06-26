# Spec 16.2 — `2d6+` (otevřený / eskalující hod DrD+) + katalog & preset `d6+`/`2d6+`

**Status:** ✅ **SPEC SCHVÁLEN 2026-06-26** (PJ) — glyf `2d6+` = varianta A (`2k6﹢`). Manuální
picker IN scope pro obě kostky. → impl. plán → *potvrzení* → kód.
**Rozsah:** **FE only.** Nová roll-engine primitiva `rollExploding2d6` + zařazení `d6+` a `2d6+`
do katalogu zakládání světa (`DICE`) a do presetů systémů (`drd16`, `drd-plus`). **Bez BE**
(payload zůstává generický volný objekt, žádná migrace `World.dice`).
**Repo:** `Projekt-ikaros-FE`, commit na `main`. · **Autor:** PJ + Claude · **Datum:** 2026-06-26
**Souvisí:** [spec-2.3b-dice-presets.md](../phase-2/spec-2.3b-dice-presets.md) (presety) ·
[spec-16.2b-mapa-drd16.md](spec-16.2b-mapa-drd16.md) (precedent `d6+` engine, §6) ·
`chat/dice/lib/rollEngine.ts` · `tactical-map/utils/rollFromSheet.ts`.

> **Mechanika dodána uživatelem** (NErekonstruováno z paměti — viz CH-023). Pravidla i oba
> početní příklady níže jsou doslovně od PJ, ověřené při brainstormingu.

---

## 1. Proč

DrD+ jede na **otevřeném hodu 2k6+** — jiná mechanika než nafukovací `d6+` (DrD 1.6).
Potřebujeme ji jako **engine primitivu hned**, aby ji pozdější TM combat panel pro DrD+
(roadmap2 ř. 503 „mapa jen onRoll fallback") jen zavolal přes `kind: '2d6+'`. Zároveň se
`d6+` (už v enginu od 16.2b, ale chybí v zakládacím formuláři) a `2d6+` zviditelní jako
**doporučené kostky** u příslušných systémů.

## 2. `2d6+` — pravidla (zdroj pravdy)

1. Hoď **2k6**.
2. **Trigger eskalace jen na dvojici** — `2×6` nebo `2×1`. Jakýkoli jiný úvodní hod = **prostý
   součet**, konec (žádná eskalace).
3. **`2×6` → eskalace nahoru:** házej dál **po jedné** kostce:
   - padne **4/5/6** → výsledek **+1** a házej dál,
   - padne **1/2/3** → **stop** (kostka se ukáže, ale nepřičítá).
4. **`2×1` → eskalace dolů:** házej dál **po jedné**:
   - padne **1/2/3** → výsledek **−1** a házej dál,
   - padne **4/5/6** → **stop**.
   - Výsledek **může jít do záporu**.
5. Pokračovací kostka **nepřičítá svou hodnotu** — určuje jen znaménko kroku (±1) a zda
   pokračovat. (Liší se tím od `d6+`, který přičítá celou hozenou hodnotu.)

**Příklad A (nahoru):** `2×6`, pak `4, 6, 1` → 12 +1 +1 stop = **14**.
**Příklad B (dolů):** `2×1`, pak `1, 3, 1, 2, 3, 5` → 2 −1−1−1−1−1 stop = **−3**.

### `d6+` vs `2d6+` (proč nesmí sdílet funkci)

| | `d6+` (nafukovací k6) | `2d6+` (otevřený hod) |
|---|---|---|
| Kostky | 1 | 2 |
| Trigger | padne 6 | dvojice 2×6 nebo 2×1 |
| Co se přičítá | **hodnota** kostky | **±1** za pokračovací kostku |
| Směr | jen nahoru | nahoru i **dolů (i záporný)** |

## 3. Algoritmus `rollExploding2d6()`

```
d1 = d6; d2 = d6
base = d1 + d2
cascade = []           // pokračovací kostky (pro zobrazení)
delta = 0
if d1==6 && d2==6:     // nahoru
  do (cap 50): f=d6; cascade.push(f); if f>=4 delta+=1 else break
else if d1==1 && d2==1: // dolů
  do (cap 50): f=d6; cascade.push(f); if f<=3 delta-=1 else break
sum = base + delta
rolls = [d1, d2, ...cascade]   // pár + kaskáda; type='2d6+'
```

- **Cap 50** proti teoretické nekonečné smyčce (jako `d6+`).
- Pokračovací kostka se **vždy hodí aspoň jednou** při triggeru; první „stop" face ukončí
  bez změny (`2×6`+`2` = 12; `2×1`+`5` = 2).
- `rolls` drží **všechny** hozené kostky (pár + kaskáda vč. stop kostky) — kvůli 3D vizuálu
  a rozpisu v dice logu. Pořadí: nejdřív pár, pak kaskáda.

## 4. Dotčené vrstvy (vertical slice)

| Vrstva | Soubor | Změna |
|---|---|---|
| Roll engine | `chat/dice/lib/rollEngine.ts` | `+rollExploding2d6()`; `RollKind` `+'2d6+'`; **centralizace** — `rollGenericDice` dispatchne `'d6+'`→`rollExplodingD6`, `'2d6+'`→`rollExploding2d6` (jinak by `+` spadl na default k20) |
| Payload | `chat/dice/lib/dicePayload.ts` | `GenericDicePayload['type']` `+'2d6+'` (reuse generic builder) |
| 3D notace | `chat/dice/lib/diceNotation.ts` | větev `'2d6+'` → `group(6, faces)` (N viditelných k6) |
| **Manuální picker** | `chat/dice/lib/worldDiceCatalog.ts` | `DICE_CATALOG` `+'d6+'` (label `k6+`), `+'2d6+'` (label `2k6+`); `KEY_ALIASES` `'d6+'→'d6+'`, `'2d6+'→'2d6+'` (+ tolerance `k6+`,`2k6+`) |
| **Picker UI** | `chat/dice/components/DicePickerPopover.tsx` | **beze změny** — `performRoll` jede přes `rollGenericDice` (díky centralizaci výše). Skin `getSkin('d6+'/'2d6+')` → default materiál (bezpečné) |
| Sheet roll (TM) | `tactical-map/utils/rollFromSheet.ts` | `RollKind` má `'2d6+'`; non-fate jde přes `rollGenericDice` → primitivy. Stávající `d6+` větev lze zjednodušit (centralizace) |
| Sheet roll (chat) | `chat/dice/lib/rollFromDiary.ts` | `DiaryRollKind` `+'2d6+'`; non-fate přes `rollGenericDice`; aktualizovat stálý komentář o `+`/k20 |
| Dice log rozpis | `tactical-map/components/dice/DiceLogPanel.tsx` | rozpis kaskády `2d6+` (mirror `d6+`) |
| Zpráva (text) | `chat/dice/lib/formatMessage.ts` | ověřit, že `2d6+` projde generickou cestou |
| Katalog světa | `CreateWorldPage/constants/dice.ts` | `DICE` `+'d6+','2d6+'`; `DICE_DESCRIPTIONS` |
| Presety | `CreateWorldPage/constants/systemDicePresets.ts` | `drd16` `+'d6+'`; `drd-plus` `['d6','2d6']→['d6','2d6+']` |
| Testy | `rollEngine.spec.ts`, `systemDicePresets.spec.ts` (auto) | jednotky pro escalation up/down/none + cap |
| Spec presetů | `spec-2.3b-dice-presets.md` | aktualizovat tabulku |

### Manuální picker — labely/glyfy dlaždic

Dlaždice v pickeru jsou kruhové (glyf ve fontu Iceland + malý `label`). Návrh:

| key | `label` | `glyph` | `glyphSize` |
|---|---|---|---|
| `d6+` | `k6+` | `6+` | `md` |
| `2d6+` | `2k6+` | `2k6﹢` *(nebo `⚅⚅`)* | `sm` |

> Glyf `2d6+` je dlouhý — finální podoba k odsouhlasení (viz otevřená otázka). `d6` zůstává
> glyf `6`, takže `6+` ho čitelně odliší.

## 5. Presety — cílový stav

| `id` | původní | nový |
|---|---|---|
| `drd16` | `d6, d10, d100 / procenta` | `d6, **d6+**, d10, d100 / procenta` |
| `drd-plus` | `d6, 2d6` | `d6, **2d6+**` (statické `2d6` nahrazeno eskalujícím) |

> `2d6` zůstává v katalogu `DICE` (jiné systémy ho mají v presetu — `drd2`). Mění se jen
> preset `drd-plus`.

## 6. Tooltipy (`DICE_DESCRIPTIONS`)

- `d6+`: „Nafukovací k6 (DrD 1.6): padne-li 6, házíš znovu a **přičteš** hodnotu. Jen nahoru."
- `2d6+`: „Otevřený hod (DrD+): 2k6; dvojice 2×6 eskaluje **+1**, 2×1 eskaluje **−1** (i do záporu)."

## 7. Manuální picker — chování

`d6+` i `2d6+` jsou **normální položky pickeru** (rozhodnutí PJ — „nové kostky jsou vždy
v ručním pickeru"). Zobrazení je **gated `World.dice` whitelistem** jako u všech ostatních
kostek: u `drd16`/`drd-plus` je tam dá preset automaticky, jiný svět si je PJ povolí
v nastavení. Hod z pickeru → `rollGenericDice` → správná primitiva → generický payload →
3D overlay (kaskáda jako N viditelných k6) + zpráva.

## 8. Mimo rozsah

- **TM combat panel pro DrD+** (vlastní `Drd*PlusCombatPanel`, tlačítka, iniciativa) =
  pozdější krok („pak v TM"). Tenhle spec dodává jen **rollovatelnou primitivu** + picker.
- **BE** — payload generický volný objekt; žádná migrace `World.dice`.
- **Skin per `d6+`/`2d6+`** — sdílí default materiál (getSkin fallback); žádná nová skin
  rodina.

## 9. Definition of done

1. `rollExploding2d6` dává přesně příklady A (=14) i B (=−3) při daných hodech (unit test
   s mockovaným RNG); non-double = prostý součet; cap drží.
2. `2d6+` i `d6+` rollovatelné **z manuálního pickeru** (gated whitelistem) i přes
   `performSheetRoll`/`rollDiaryRequest` (kind); payload generický, dice log rozepíše kaskádu.
3. `DICE` má `d6+` i `2d6+` s tooltipem; presety dle §5; `systemDicePresets.spec` zelený.
4. `npm run build` (tsc -b) ✓, vitest ✓, eslint 0. Picker + formulář OK na mobilu i desktopu
   (`mobil-desktop`).
