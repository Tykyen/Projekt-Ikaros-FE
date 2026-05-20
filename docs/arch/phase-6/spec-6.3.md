# Spec 6.3 — Hod kostkou ve světovém chatu

**Status:** 🟡 Návrh k odsouhlasení (v2 — rozšířeno o 3D)
**Rozsah:** FE (roll engine + dice picker v composeru + **3D rolling animace v chatu** + skin systém ~30 skinů × 7 typů kostek) + BE (`WorldMembership.diceSkinMapping`, `ChatMessage.diceSkin` + `ChatMessage.dicePayload`, drobné validace)
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros`
**Velikost:** odhad ~30 FE souborů / ~3400 ř. + ~6 BE souborů / ~250 ř. + ~1820 statických textur (`public/textures/`). Nová dependency: `three` + `@react-three/fiber` (lazy chunk).
**Autor:** PJ + Claude
**Datum:** 2026-05-20 (v2 2026-05-20)
**Souvisí:** [spec-6.1.md](spec-6.1.md), [spec-6.2.md](spec-6.2.md), [roadmap-fe.md](../../roadmap-fe.md) (Fáze 6.3 + návaznost 10.2j), BE modul `chat`, BE modul `worlds` (`World.dice`).

> Cíl: vrátit do platformy **hod kostkou** ze starého Matrixu — pickerem nad `World.dice` whitelist; roll engine pokrývá Fate / generic XdN / pool / mixed / d100; výsledek se v chatu vykreslí jako **3D rolling animace → settled state** (sdílený engine s 10.2j mapou, kterou 6.3 připravuje k extrakci).

## Změny v2 (2026-05-20)

- Rozšířeno: **3D rolling animace v chatu** (původně 2D). Důvod: vstupní materiál ze starého Matrixu (9 modelů `D*Model.tsx`, `DiceLogic.ts` TARGETS) **už je 3D** — stripování bylo zbytečná práce.
- Rolling animace přehrávána **jen pro čerstvý hod** (≤ 5 s od `createdAt`). Refresh / scroll back v historii = settled state bez animace. Žádný WS „roll started" event — synchronizace přes `createdAt` timestamp v zprávě.
- Skin picker karty **3D cube náhled** (port `FateDicePicker` ze starého Matrixu).
- 10.2j (mapa) tím přebírá menší kus: zbývá drag-drop kostky na mapu + `DiceJailTray` + WS `map:dice-rolled` broadcast + extrakce sdílených modulů do `features/dice/`.

## Změny v3 (2026-05-20) — CSS 3D místo WebGL

Po inspekci modelů zjištěno, že **starý Matrix nepoužívá three.js** — kostky jsou **čisté CSS 3D transforms** (`rotateY()`, `transformStyle: preserve-3d`, [D6Model.tsx](C:/Matrix/Matrix/frontend/src/components/Map/Dice/models/D6Model.tsx)). Důsledky:

- ❌ Zrušena dependency `three` + `@react-three/fiber` (původní odhad +150 KB gzipped).
- ❌ Zrušen lazy chunk `DiceMessageScene.lazy.tsx` + Suspense fallback — modely jsou lehké React komponenty, žádný runtime overhead.
- ❌ Zrušen WebGL fallback / detection — CSS 3D funguje od Chrome 12, Safari 4, Firefox 16.
- ✅ Rolling animace = CSS `@keyframes` (chaos rotace) → CSS `transition` do TARGETS z `diceTargets.ts`. Slerp simulujeme přes `cubic-bezier` easing.
- ✅ Bundle size impact = ~0 KB (jen vlastní komponenty + textury).
- ✅ Performance lepší než three.js pro malé počty kostek (3-5 v zprávě, ~30 v skin pickeru) — DOM 3D nepotřebuje accelerated GPU.

10.2j (mapa) si později může 3D upgradovat na three.js, pokud bude potřebovat full-screen scénu s post-process bloomem nebo fyzikou kostek na bitevní mapě. Chat 6.3 to nepotřebuje.

---

## 0. Názvosloví

Dědí z [spec-6.1.md §0](spec-6.1.md). Nově:

- **Hod (roll)** = jedna akce hráče → jedna zpráva v chatu se `isDiceRoll: true`. Engine generuje FE, BE jen rozpozná regexem.
- **Skin** = vizuální sada textur pro celou rodinu kostek (např. `core-ivory`, `elemental-flame`). Každý skin pokrývá Fate (3 tváře: +/−/0) + d4/d6/d8/d10/d12/d20/d100 (texturové overrides, `webp`).
- **Skin mapping** = volba skinu **per typ kostky** + per uživatel v daném světě (`{ default: 'core-ivory', '1d20': 'core-obsidian' }`). Jeden hráč může mít jiný d20 než d6.
- **Pool roll** = víc kostek stejného nebo různého typu jedním kliknutím (mixed). XdN nebo `{ d6: 2, d20: 1 }`.
- **Rolling animace** = three.js / `@react-three/fiber` 3D rotace + dopad kostky na settled tvář. Trvá ~1.4 s. Přehraje se jen u čerstvého hodu (≤ 5 s od `createdAt`).
- **Settled state** = kostky stojí na výsledných tvářích (statický 3D render, žádná animace). Default render pro historii + reduced-motion.

---

## 1. Cíl

Hod kostkou v `/svet/:worldSlug/chat`:

1. **6.3a Picker** — tlačítko 🎲 v composeru otevře dice picker, který nabízí kostky **z whitelistu `World.dice`** (5.3a). Picker zná Fate, d4, d6, d8, d10, d12, d20, d100, pool-X, mixed.
2. **6.3b Roll engine** — port `diceHelpers.ts` ze starého Matrixu; vrátí strukturovaný výsledek + textovou reprezentaci zprávy ve formátu `Hod Kostkou (3d6): [2,4,1] = +7` (BE už rozpoznává).
3. **6.3c Pool prompt** — modal pro výběr počtu kostek u `pool-d*` a `mixed` typů (+/− stepper per typ).
4. **6.3d 3D rendering hodu v `MessageItem`** — pokud `isDiceRoll`, místo prostého textu se renderuje `<DiceMessage>` s 3D scénou (`@react-three/fiber`): u čerstvého hodu rolling animace → settled state; u staršího hodu rovnou settled. Mimo 3D scénu: skill label/modifier chip, zvýrazněný total, Přetlak (Fate).
5. **6.3e Skin systém** — port ~30 skinů (5 kategorií: core / elemental / draconic / undead / nature) z `C:/Matrix/Matrix/frontend/src/components/Map/Dice/fateDiceSkins.ts`. Textury v `public/textures/`. Picker skinu per typ kostky uložený v `WorldMembership.diceSkinMapping`. Picker karty mají **3D cube náhled** (port `FateDicePicker`). Render zprávy používá **skin uložený se zprávou** (ne aktuální preference diváka — viz §4.2).
6. **6.3f Guards** — BE už ošetřuje, FE jen UX: smazat dice zprávu může jen PJ/Admin (skrýt 🗑 ostatním), edit ✎ skrytý úplně, dice se nepočítají do unread.

---

## 2. Kontext / motivace

Starý Matrix měl plnohodnotný dice systém: roll engine, vizuálně rozpoznatelné kostky, picker skinů (~30 designů, 5 kategorií), per-typ-kostky volba. PJ rozhodnutí (2026-05-20):

- **Skin systém v 6.3 plný** — žádný „postupný roll-out skinů" (ne 2 default + 28 odložit). PJ na to byl ve starém Matrixu zvyklý a aktivně skiny mění; degradovaná verze by frustrovala.
- **Persistence per uživatel v daném světě** — `WorldMembership.diceSkinMapping` (Record). Analogicky `chatColor`/`chatFont` z 6.2f.
- **Pool roll = modal**, ne inline (mixed roll potřebuje stepper × více typů kostek; inline by se to nevešlo).
- **3D animace házení v 6.3 ANO** (revize 2026-05-20). Vstupní materiál ze starého Matrixu je 3D — stripping na 2D byla zbytečná práce. 10.2j si vezme jen drag-drop na mapu + WS broadcast, dice engine se sdílí mezi chat a mapou.

⚠️ **Nesrovnalost najitá při auditu** ([DiceLogic.ts:11](C:/Matrix/Matrix/frontend/src/components/Map/Dice/DiceLogic.ts#L11) starého Matrixu): hod si v payloadu nese `skinMapping` rolleru — důvod je *„used by other players to render the correct skin"*. Hráč A s Obsidian skin a hráč B s Ivory musí oba vidět **A‑skin** na A-hodu, ne každý svůj. Bez zafixování v payloadu by si měnit svůj skin přemalovávalo cizí historii. **Řešení:** spolu se zprávou se ukládá `diceSkin` (jen skin použitý odesílatelem v okamžiku hodu) + plný `dicePayload` (faces, total atd.) — viz §4.2.

---

## 3. Audit současného stavu

### 3.1 Backend — co `chat` modul **už umí**

| Endpoint / chování | Stav |
|---|---|
| Regex detekce v `sendMessage`: `/^(🎲\s*HOD\s+FATE:|Hod\s+Kostkou)/i` → `isDiceRoll: true` ([chat.service.ts:621](../../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L621)) | ✅ |
| `editMessage` blokuje `isDiceRoll` → `CHAT_DICE_NOT_EDITABLE` | ✅ (přidáno v 6.2c) |
| `deleteMessage` dice = jen PJ/Admin (`CHAT_DICE_FORBIDDEN`) | ✅ |
| Unread count ignoruje `isDiceRoll` zprávy | ✅ |
| Pole `clientNonce` (6.2h) — pro idempotenci optimistic send | ✅ |
| `WorldMembership.chatColor` / `chatFont` / `chatFontSize` (6.2f) — vzor pro `diceSkinMapping` | ✅ |
| `World.dice: string[]` — whitelist kostek světa (5.3a) | ✅ |

### 3.2 Backend — nesrovnalosti k opravě v 6.3

| # | Nález | Řešení v 6.3 |
|---|---|---|
| **N1** | `ChatMessage` nemá `dicePayload` ani `diceSkin`. Bez payloadu FE musí re-parsovat textový tvar zprávy (křehké). Bez `diceSkin` ostatní hráči vidí dice cizíma barvama. | Aditivní `dicePayload?: DicePayload` + `diceSkin?: string` na schema/interface/repository/DTO/whitelist v `sendMessage`. Schema povolí volný objekt (žádný nested schema kvůli flexibilitě — Fate vs. mixed vs. d100 mají různý tvar payloadu). |
| **N2** | `WorldMembership` nemá `diceSkinMapping`. | Aditivní `@Prop({ type: Object, default: null }) diceSkinMapping: Record<string, string> \| null;` + update v `appearance` PATCH (6.2f endpoint rozšířit nebo nový — viz §4.7). |
| **N3** | Regex pro `isDiceRoll` může chytit zprávu kde uživatel ručně napíše „Hod Kostkou:" do textu (false positive). | **Posílení:** BE bude `isDiceRoll: true` přiřazovat **jen pokud existuje `dicePayload` v DTO** (povinný marker pro „toto je opravdu hod"). Regex zůstane jako fallback pro legacy / kompatibilitu, ale primární signál = `dicePayload != null`. |
| **N4** | `CreateMessageDto` neobsahuje `dicePayload` / `diceSkin`. | Přidat optional pole; `dicePayload` jako `@IsObject() @IsOptional()` (validace tvaru se dělá lehce — vyšší riziko nepřinese, payload je read-only render data). |

### 3.3 Frontend — co máme

| Místo | Stav |
|---|---|
| `ChannelComposer` (6.2) — má attach, NPC, RP date, vzhled, mentions popovery | ✅ — přidat 🎲 tlačítko |
| `MessageItem` (fáze 4) — generický renderer | ✅ — přidat větev `isDiceRoll → <DiceMessage />` |
| `useOptimisticSend` (6.2h) — pending → swap | ✅ — bere DTO, jen rozšířit o `dicePayload`/`diceSkin` v payloadu |
| `useMembershipAppearance` (6.2f) — GET/PATCH `chatColor`/`Font` | ✅ — rozšířit o `diceSkinMapping` (jedno API místo dvou) |

### 3.4 Frontend — co dostavíme ve `features/world/chat/dice/`

Nová podsložka `dice/` pod `features/world/chat/`. Sdílení s mapou (10.2j): roll engine + skiny + DiceMessage budou později **zvednuté** do `features/dice/` nebo `shared/dice/` (viz §7 — extrakce v 10.2j).

### 3.5 Vstup ze starého Matrixu (`C:/Matrix/Matrix/frontend`)

| Soubor | Port? | Pozn. |
|---|---|---|
| `src/utils/diceHelpers.ts` (229 ř.) | ✅ port 1:1 | Roll engine + format. Drobné refactory: TS-safe, ESM. |
| `src/components/Map/Dice/fateDiceSkins.ts` (913 ř.) | ✅ port dat | Definice ~30 skinů a textur. `getSkinsByCategory()`, `CATEGORY_LABELS`. |
| `src/components/Map/Dice/diceTexturePreloader.ts` (80 ř.) | ✅ port | Lazy preload textur per skin. Důležité kvůli 1820 souborům. |
| `src/components/Map/Dice/FateDicePicker.tsx` (270 ř.) | ✅ port s úpravami | Layout (panel + tabs kategorií + grid skin karet) + 3D cube preview v kartách. „Vězení" (jail) **nepřenášíme** v 6.3 — dluh `D-NEW-dice-jail`. |
| `src/components/Map/Dice/models/*Model.tsx` (9 souborů, ~600 ř.) | ✅ port | 3D modely pro three.js — D4/D6/D8/D10/D12/D20/D100Tens/Fate/FateSkin. Použity v `DiceMessage` + skin pickeru. |
| `src/components/Map/Dice/DiceLogic.ts` (137 ř.) | ✅ port | TARGETS (rotace per tvář) + `rollFateDice` / `calcTotal` / `fateFaceValue`. |
| `src/components/Map/Dice/DiceOverlay.tsx` (411 ř.) | ⚠️ částečný port | Orchestrace rolling animace → settled. Vyhodit mapové specifika (cursor drop, drag). Vytvořit z toho komponentu `<RollingDiceScene>` pro `DiceMessage`. |
| `src/components/Map/Dice/DiceJailTray.tsx` | ❌ ne | Bonus feature, 10.2j nebo dluh. |
| `src/styles/fateDiceSkins.scss` (390 ř.) | ✅ port | Picker panel/grid/card styly + 3D cube CSS pro preview. Konverze SCSS → CSS Modules. |
| `public/textures/*.webp` (1820 souborů, ~50–80 MB) | ✅ port | Skopírovat do `Projekt-ikaros-FE/public/textures/`. Lazy load přes `diceTexturePreloader.ts`. |

⚠️ **Pozor — `public/textures/` je velký kus assets.** Před portem ověřit (a) jestli git LFS / Vercel build size limity nás netrkly, (b) jestli vůbec všechny textury používáme (některé skiny mohou být polo-rozdělané — `materialImg` chybí). Ad-hoc strategie: skopírovat vše, v `npm run build` zkontrolovat bundle a případně očesat per-skin (dluh `D-NEW-dice-texture-trim`).

---

## 4. Návrh řešení

### 4.1 Struktura souborů (přírůstek)

```
src/features/world/chat/
├── components/
│   ├── ChannelComposer.tsx                # ROZŠÍŘENO — přidat 🎲 tlačítko + DicePickerPopover anchor
│   └── ...
├── dice/                                  # NOVÁ podsložka
│   ├── components/
│   │   ├── DiceButton.tsx                 # 🎲 v composer toolbaru
│   │   ├── DicePickerPopover.tsx          # 6.3a — picker kostek z World.dice
│   │   ├── DicePickerPopover.module.css
│   │   ├── PoolPromptModal.tsx            # 6.3c — počty per typ
│   │   ├── PoolPromptModal.module.css
│   │   ├── SkinPickerPanel.tsx            # 6.3e — kategorie + grid skin karet (s 3D náhledem)
│   │   ├── SkinPickerPanel.module.css
│   │   ├── DiceMessage.tsx                # 6.3d — wrapper render hodu v MessageItem
│   │   ├── DiceMessage.module.css
│   │   ├── DiceMessageScene.lazy.tsx      # NOVĚ — lazy chunk s @react-three/fiber Canvas
│   │   ├── DiceMessageScene.tsx           # vlastní 3D scéna — rolling → settled (lazy-loaded)
│   │   ├── DiceMessageFallback.tsx        # statický 2D fallback pro reduced-motion / load failure
│   │   ├── RollingDiceScene.tsx           # orchestrace rolling stavu (extrakt z DiceOverlay)
│   │   └── models/                        # NOVĚ — 3D modely portované ze starého Matrixu
│   │       ├── D4Model.tsx
│   │       ├── D6Model.tsx
│   │       ├── D8Model.tsx
│   │       ├── D10Model.tsx
│   │       ├── D12Model.tsx
│   │       ├── D20Model.tsx
│   │       ├── D100TensModel.tsx
│   │       ├── FateModel.tsx
│   │       └── FateSkinModel.tsx
│   ├── api/
│   │   └── useDiceSkinMapping.ts          # GET/PATCH WorldMembership.diceSkinMapping
│   ├── lib/
│   │   ├── rollEngine.ts                  # 6.3b — port diceHelpers.ts (Fate, generic, pool, mixed, d100)
│   │   ├── rollEngine.spec.ts             # unit testy seedovaných hodů
│   │   ├── formatMessage.ts               # textová reprezentace hodu pro `content`
│   │   ├── diceSkins.ts                   # 6.3e — port fateDiceSkins.ts (data)
│   │   ├── texturePreloader.ts            # 6.3e — port diceTexturePreloader.ts
│   │   ├── diceTargets.ts                 # NOVĚ — port DiceLogic.ts TARGETS (rotace per tvář)
│   │   ├── dicePayload.ts                 # typy DicePayload + builder z roll resultu
│   │   ├── isFreshRoll.ts                 # NOVĚ — `Date.now() - createdAt < 5000` (rolling vs. settled)
│   │   └── worldDiceCatalog.ts            # mapování World.dice klíčů → labels + glyphy
└── ...

public/textures/
└── *.webp                                 # ~1820 souborů ze starého Matrixu
```

### 4.2 BE — schéma a DTO

**`world-membership.schema.ts`** ([world-membership.schema.ts:28](../../../../Projekt-ikaros/backend/src/modules/worlds/schemas/world-membership.schema.ts#L28)):

```ts
/** Krok 6.3e — per-svět volba skinu kostek per typ (např. { default: 'core-ivory', '1d20': 'core-obsidian' }). */
@Prop({ type: Object, default: null })
diceSkinMapping: Record<string, string> | null;
```

**`chat-message.schema.ts`** (přírůstek):

```ts
/** Krok 6.3d — strukturovaná data hodu pro 2D render (faces, total, type, ...). Schema volný objekt — různé typy hodů mají různý tvar. */
@Prop({ type: Object, default: null })
dicePayload: Record<string, unknown> | null;

/** Krok 6.3e — skin použitý odesílatelem v okamžiku hodu (zafixované). null = default. */
@Prop({ type: String, default: null })
diceSkin: string | null;
```

**`CreateMessageDto`**:

```ts
@IsOptional()
@IsObject()
dicePayload?: Record<string, unknown>;

@IsOptional()
@IsString()
@MaxLength(64)
diceSkin?: string;
```

**`chat.service.ts` — `sendMessage`:**

```ts
const isDiceRoll = !!dto.dicePayload || (dto.content
  ? DICE_REGEX.test(dto.content.trim())
  : false);

const message = await this.messageRepo.save({
  // ... existující pole
  isDiceRoll,
  dicePayload: dto.dicePayload ?? null,
  diceSkin: dto.diceSkin ?? null,
});
```

**`AppearanceDto` / endpoint pro membership** — rozšířit o `diceSkinMapping?: Record<string, string> | null` (kvůli per-typ mapě nedělíme na samostatný endpoint, žije s `chatColor`/`Font`).

**Repository `toEntity` mapper** — povinný update v [chat-message.repository.ts:196](../../../../Projekt-ikaros/backend/src/modules/chat/repositories/chat-message.repository.ts#L196) + world-membership repository, jinak tichá ztráta polí (memory `project_chat_channel_field_checklist`).

📚 **Proč `dicePayload` jako volný objekt, ne dedikovaný schema?** Fate má `{ faces: ['+','+','-','0'], total: 1 }`, mixed má `{ rolls, faceTypes, sum }`, d100 má `{ tens, ones, total }`. Pevné schema by se buď stalo unionem s discriminatorem (komplikace), nebo bychom zploštili pole a ztratili sémantiku. Volný objekt + TS typy na FE = pragmatický kompromis. Riziko: zlobivý klient pošle nesmysl. Mitigace: `isDiceRoll` je odvozený od existence `dicePayload`, ale render na FE má fallback na textový `content` (žádný crash).

### 4.3 6.3b — Roll engine (`rollEngine.ts`)

Port `diceHelpers.ts` 1:1 + drobná čistka. API:

```ts
export type RollType =
  | 'fate' | 'd100'
  | 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20'
  | `pool-d${number}` | 'mixed';

export interface RollResult {
  type: RollType;
  faces: (number | '+' | '-' | '0')[];   // raw hozené hodnoty
  faceTypes?: string[];                     // pro mixed: 'd6' | 'd20' per face
  sum: number;                              // bez modifieru
  total: number;                            // sum + modifier
  label?: string;
  modifier?: number;
  // d100 specifika
  tens?: number;
  ones?: number;
}

export function roll(type: RollType, opts?: {
  count?: number;                           // pool / generic XdN
  mixedCounts?: Record<string, number>;     // mixed
  label?: string;
  modifier?: number;
}): RollResult;
```

`formatMessage.ts`:

```ts
export function formatRollMessage(r: RollResult): string;
// → 'Hod Kostkou (3d6): [2,4,1] = +7' nebo 'Hod Kostkou: [+] [-] [ ] [+] = Magie (+2) +1 = +3'
```

Formát zachovává shape, který BE regex (`/^Hod\s+Kostkou/i`) rozpozná. Detaily formátu drží shodu se starým Matrixem (`formatFateMessage`, `formatGenericDiceMessage`) — `Přetlak` mapping ([diceHelpers.ts:122](C:/Matrix/Matrix/frontend/src/utils/diceHelpers.ts#L122)) zůstává **u Fate** (jako ve starém Matrixu).

⚠️ **Random source.** `Math.random()` je dost pro RPG; pro „dice cheating audit" by bylo lepší crypto. **Odložíme** — dluh `D-NEW-dice-secure-rng`, není v rozsahu 6.3.

### 4.4 6.3a — Dice picker v composeru

`DicePickerPopover` — popover anchoraný na `DiceButton` v `ChannelComposer`:

```
┌─────────────────────────────┐
│ Hod kostkou                 │
├─────────────────────────────┤
│ ▸ Fate (4dF)                │  ← rychlé výchozí
│ ▸ k4   k6   k8              │  ← rychlá volba dle World.dice
│ ▸ k10  k12  k20             │
│ ▸ k%                        │
├─────────────────────────────┤
│ ◇ Pool (více kostek)…       │  ← otevře PoolPromptModal
│ ◇ Mixed (různé kostky)…     │
├─────────────────────────────┤
│ Label: [___]  Mod: [+0]     │  ← společné pro všechny
│ ⚙ Vzhled mých kostek        │  ← otevře SkinPickerPanel
└─────────────────────────────┘
```

**Filtrace dle `World.dice`** — `worldDiceCatalog.ts` mapuje `World.dice` (např. `['fate', 'd6', 'd20']`) na seznam dostupných typů v pickeru. Klíče v `World.dice` respektují konvenci pickeru: `'fate' | 'd4' | … | 'd20' | 'd100'`. Pokud svět nemá v `dice` nic → picker ukáže prázdný stav „PJ tomuto světu zatím nedovolil kostky" (link do správy světa pro PJ).

⚠️ **Stav `World.dice` po 5.3a** — schema má pole `dice: string[]` ([world.schema.ts:18](../../../../Projekt-ikaros/backend/src/modules/worlds/schemas/world.schema.ts#L18)), default `[]`. Existující světy mohou mít prázdno. 6.3 nepřidává backfill — PJ si v editaci světa (5.3a) musí kostky zaškrtnout sám. Dluh `D-NEW-dice-default-set` (option: default `['fate','d6','d20']` pro nový svět, dořešit ve fázi 5).

**Flow odeslání:**

1. User klik typ kostky (nebo Pool/Mixed s vyplněným modalem).
2. FE zavolá `roll(type, { count, label, modifier })` → `RollResult`.
3. `formatRollMessage(result)` → `content` string.
4. `buildDicePayload(result)` → `dicePayload` objekt.
5. Send DTO: `{ content, dicePayload, diceSkin: getActiveSkin(type), clientNonce }`.
6. Optimistic insert (6.2h) → render přes `DiceMessage` ihned, swap po BE echo.

### 4.5 6.3c — Pool prompt modal

`PoolPromptModal`:

```
┌──────────────────────────────────┐
│ Pool roll                        │
├──────────────────────────────────┤
│  k4   [ − ]   3   [ + ]          │
│  k6   [ − ]   0   [ + ]          │
│  k8   [ − ]   0   [ + ]          │
│  k10  [ − ]   2   [ + ]          │
│  k12  [ − ]   0   [ + ]          │
│  k20  [ − ]   1   [ + ]          │
│  k%   [ − ]   0   [ + ]          │
│                                  │
│  Label: [___]  Mod: [+0]         │
│  Celkem kostek: 6                │
│                                  │
│           [Zrušit] [Hodit]       │
└──────────────────────────────────┘
```

- Steppery 0–20 per typ.
- Filtrace dle `World.dice` — typy mimo whitelist disabled / hidden.
- „Hodit" volá `roll('mixed', { mixedCounts, label, modifier })`.
- Mobilní layout: 1 column místo 2.

### 4.6 6.3d — 3D rendering hodu v `MessageItem`

`MessageItem` ([`MessageItem.tsx`](../../../src/features/chat/components/MessageItem.tsx)) dostane novou větev:

```tsx
if (message.isDiceRoll && message.dicePayload) {
  return <DiceMessage message={message} />;
}
// fallback: pokud chybí payload (legacy), render content jako monospace text
```

**`DiceMessage` wrapper** (eager) — rozhoduje co renderovat:

```tsx
const isFresh = isFreshRoll(message.createdAt);  // ≤ 5 s
const reducedMotion = useReducedMotion();
const phase = isFresh && !reducedMotion ? 'rolling' : 'settled';

return (
  <div className={s.diceMessage}>
    {labelChip}
    <Suspense fallback={<DiceMessageFallback payload={message.dicePayload} skin={message.diceSkin} />}>
      <DiceMessageScene payload={message.dicePayload} skin={message.diceSkin} phase={phase} />
    </Suspense>
    {totalBox}
    {subtitle}  {/* součet hodu + Přetlak */}
  </div>
);
```

**Lazy chunk** (`DiceMessageScene.lazy.tsx`):

```tsx
const DiceMessageScene = React.lazy(() => import('./DiceMessageScene'));
```

→ `three` + `@react-three/fiber` + 9 modelů spadnou do separátního chunku, který se načítá **jen když user otevře chat se hodem**. Statický fallback (CSS dlaždice ze starého návrhu 2D) vykryje:
- první render před načtením chunku (Suspense fallback),
- prohlížeč bez WebGL podpory (catch),
- `prefers-reduced-motion: reduce`.

**`DiceMessageScene` layout:**

```
[avatar] PJ_jméno · čas · 📅 RP datum · ⊚k20
         ┌─ tabulka výpočtu (color-mix 4% accent bg) ──────────────┐
         │ ╭─ Magie +2 ─╮                                          │
         │                                                          │
         │  ┌────────────────┐                       ┌──────┐      │
         │  │                │                       │      │      │
         │  │  [3D canvas]   │                       │  +3  │      │
         │  │  kostky        │                       │      │      │
         │  │  (rolling →    │                       └──────┘      │
         │  │   settled)     │                                      │
         │  │                │                                      │
         │  └────────────────┘                                      │
         │                                                          │
         │  součet hodu: +1                       Přetlak ⚡ 1      │
         └──────────────────────────────────────────────────────────┘
```

**3D scéna detaily:**

- Canvas velikost: 280 × 140 px desktop, 240 × 120 mobil. Inline v zprávě, ne fullscreen.
- Kamera: ortografická, lehce shora (10° pitch), bez perspektivního zkreslení.
- Ambient + 1 directional light, soft shadow pod kostkami.
- Background: `transparent` (canvas dýchá s `--dice-tray-bg`).
- Per kostka komponenta: dle `payload.type` → `<D4Model>` / `<D6Model>` / … / `<FateSkinModel>`, props `{ faceValue, skin }`.
- Pozice kostek v scéně: vlevo → vpravo, 60 px mezi středy, scale 1.0 na desktop / 0.85 mobil. Pool/Mixed wrap do dvou řad nad 6 kostek.

**Rolling animace (`phase === 'rolling'`)**:

- Trvání: 1.4 s.
- 0–1.0 s: kostka rotuje náhodně (3 osy, `~720°` celkem) + lehký bouncing transform.
- 1.0–1.4 s: ease-out interpolace do TARGETS rotace pro výsledek z `payload.faces[i]`.
- Stagger mezi kostkami: 80 ms (poslední kostka domít cca v 1.7 s).
- Po settled: drobný settle bounce `scale 1 → 1.06 → 1` (240 ms) + glow flash.

**Settled state (`phase === 'settled'`)** — kostka rovnou v TARGETS rotaci pro výsledek. Žádná animace, jen mount fade-in 120 ms.

**Reduced motion** — `phase === 'settled'` enforced, mount fade-in zkrácen na 60 ms.

📚 **Proč jen ≤ 5 s rolling?** Když user scrolluje historii chatu, nechceme přehrávat rolling na pět zpráv najednou — vizuální chaos, hluk. Cut-off 5 s pokryje: (a) optimistic insert odesílatele, (b) WS broadcast příjemci, kteří byli online. Kdo otevře chat o minutu později, vidí kostky stojící. Stejné jako optimistic send fade (6.2h).

📚 **Proč `skin uložený se zprávou` a ne `skin diváka`?** Když hráč A hodí svou Obsidian kostkou, hráč B (s Ivory skinem) musí na A-hodu vidět **Obsidian**, ne Ivory. Jinak by si fluktuací svých voleb mátl celý chat. Skin je součást „vzhledu zprávy", stejně jako barva textu (6.2f).

⚠️ **Bundle size impact** — `three` + `@react-three/fiber` cca 150 KB gzipped. Lazy chunk zaručí, že iniciální bundle Ikaros nepostihne; chunk se loaduje až při prvním vykreslení dice zprávy (typicky: user otevře chat = WS přinese poslední zprávy = pokud je mezi nimi hod, chunk se začne stahovat). Aby user nečekal sekundu na canvas, **`DiceMessageScene` se preloadne** při mountu `WorldChatPage` (idle prefetch přes `requestIdleCallback`).

### 4.7 6.3e — Skin systém + picker skinů

**Data — `diceSkins.ts`:**

Port `fateDiceSkins.ts` 1:1. Struktura skinu:

```ts
interface DiceSkin {
  id: string;                                  // 'core-ivory'
  name: string;                                // 'Ivory Etched'
  category: 'core' | 'elemental' | 'draconic' | 'undead' | 'nature';
  bgGradient: string;                          // CSS gradient fallback
  borderColor: string;
  shadowColor: string;
  symbolColor: string;
  symbolShadow?: string;
  borderRadius?: string;
  ornamentChar?: string;
  fontFamily?: string;
  // Texturové overrides per face per die type
  facePlusImg?: string; faceMinusImg?: string; faceBlankImg?: string;
  d6_1Img?: string; ...
  d20_20Img?: string;
}
```

**Preloader** (`texturePreloader.ts`):

```ts
const preloaded = new Set<string>();
export function preloadSkin(skinId: string): void { /* batch new Image() src */ }
```

- Hover na skin kartě → preload.
- Při výběru typu kostky v pickeru → preload skinů aktivní kategorie.
- Při render `DiceMessage` → preload skinu zprávy (idempotentní).

**`SkinPickerPanel`** (přes „⚙ Vzhled mých kostek" v `DicePickerPopover` nebo samostatný button v composeru):

```
┌──────────────────────────────────────────────┐
│ Vzhled kostek                            ✕   │
├──────────────────────────────────────────────┤
│ Typ kostky:                                  │
│ [Všechny] [Fate] [k4] [k6] [k8]              │
│ [k10] [k12] [k20] [k%]                       │
├──────────────────────────────────────────────┤
│ Kategorie:                                   │
│ [Základní] [Živelné] [Dračí] [Nemrtví] [Přír]│
├──────────────────────────────────────────────┤
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐                  │
│  │  │ │✓ │ │  │ │  │ │  │                  │
│  └──┘ └──┘ └──┘ └──┘ └──┘                  │
│  Ivory  Obsidi  Steel  Bone   ...           │
└──────────────────────────────────────────────┘
```

- „Typ kostky" tab — výběr pro **který typ** uživatel volí skin. `default` = fallback pro typy bez vlastní volby. Per-typ mapping (`{ default: 'core-ivory', '1d20': 'core-obsidian' }`).
- „Kategorie" tab — filtr seznamu skinů.
- Klik na skin kartu → uloží do `WorldMembership.diceSkinMapping[typ] = skinId`, panel zůstává otevřený (uživatel může klepat víc).
- Skin karta: **2D náhled** typické tváře (např. d20 → 20, d6 → 6, Fate → `+`). Žádné 3D CSS cuby (vyhozeno).

**`useDiceSkinMapping`:**

```ts
export function useDiceSkinMapping(worldId: string) {
  const { mapping, mutate } = useMembershipAppearance(worldId); // 6.2f rozšíření
  const getSkin = useCallback((type: string) =>
    mapping?.diceSkinMapping?.[type] ?? mapping?.diceSkinMapping?.default ?? 'core-ivory',
  [mapping]);
  return { mapping, getSkin, setSkin: (type, id) => mutate({ ...mapping, diceSkinMapping: { ...mapping.diceSkinMapping, [type]: id } }) };
}
```

⚠️ **Vězení skinů (jail)** — bonusovou featuru ze starého Matrixu ([FateDicePicker.tsx:75](C:/Matrix/Matrix/frontend/src/components/Map/Dice/FateDicePicker.tsx#L75)) **vynecháváme v 6.3**. Dluh `D-NEW-dice-jail` — pokud PJ chce, dořeší se v 10.2j s celým mapovým dice systémem.

### 4.8 6.3f — Guards

| Co | Stav | Akce v 6.3 |
|---|---|---|
| Edit dice zprávy | BE blokuje (`CHAT_DICE_NOT_EDITABLE`) | FE: skrýt ✎ tlačítko v `MessageItem` pokud `isDiceRoll` |
| Smazání dice zprávy | BE blokuje neadminům (`CHAT_DICE_FORBIDDEN`) | FE: skrýt 🗑 pro non-PJ/Admin |
| Unread count | BE ignoruje | OK |
| Reakce na dice zprávy | BE povoluje | OK — dice je zpráva jako každá jiná pro reakce / reply (PJ může citovat hod a komentovat) |

### 4.9 Composer integrace

`ChannelComposer` ([ChannelComposer.tsx](../../../src/features/world/chat/components/ChannelComposer.tsx)) toolbar dostane nové tlačítko 🎲 **vedle 📎 (attach)**, levá strana toolbaru:

```
[📎] [🎲] [🎭NPC] [📅] [🎨] [😊]    ... [Send]
```

`DiceButton.onClick` → otevře `DicePickerPopover` (anchor = tlačítko, pozice = above).

📚 **Proč popover, ne modal?** Picker je „rychlá volba" (Fate jedním klikem = nejčastější use case). Modal by každý hod přerušil flow. Pool / Mixed / Skiny si modal otevřou až ze submenu pickeru — pro náročnější use cases.

---

## 5. UX / responsivita

| Breakpoint | Picker | Pool modal | DiceMessage |
|---|---|---|---|
| **Mobil ≤ 768 px** | Popover full-width bottom-sheet (slide-up) | Full-screen modal, 1-column steppery | Dlaždice 32 × 32 px, max 8 v řádku → wrap |
| **Tablet 769–1024 px** | Popover 320 px anchored | Centered modal 90vw max 480 px | Dlaždice 36 × 36 px |
| **Desktop > 1024 px** | Popover 320 px anchored | Centered modal 480 px | Dlaždice 40 × 40 px |

Skin picker = vždy modal (nutná plocha pro grid skinů × kategorie × typy).

Touch terče ≥ 44 px (steppery v pool modalu, skin karty).

`mobil-desktop` audit povinný po implementaci.

---

## 6. Akceptační kritéria

### 6.3a — Picker
- [ ] 🎲 tlačítko v composeru otevře popover s rychlými typy kostek + Pool/Mixed.
- [ ] Picker zobrazuje **jen** kostky z `World.dice`. Svět s `dice: []` zobrazí prázdný stav.
- [ ] Klik na typ kostky bez modifieru/labelu okamžitě hodí a odešle zprávu.

### 6.3b — Roll engine
- [ ] Fate vrací 4 hody z `{−1, 0, 1}`, total 0 pro „seeded" testovaný vzorek.
- [ ] Generic `d20` vrací 1–20.
- [ ] `pool-d6` s count=3 vrací 3 hody.
- [ ] `mixed` se `{ d6: 2, d20: 1 }` vrací 3 hody, `faceTypes` má délku 3.
- [ ] `d100` vrací tens + ones, total v rozmezí 1–100, 00+0 → 100.
- [ ] `formatRollMessage` produkuje string, který BE regex `/^Hod\s+Kostkou/i` rozpozná.
- [ ] Přetlak mapping aktivní pro Fate v rozsahu ≥ 7.

### 6.3c — Pool modal
- [ ] Modal otevřený přes „Pool…" / „Mixed…" v pickeru.
- [ ] Steppery +/− 0–20 per typ; disabled pro typy mimo `World.dice`.
- [ ] „Celkem kostek" počítadlo aktualizováno live.
- [ ] „Hodit" disabled při total = 0.

### 6.3d — Rendering
- [ ] Dice zpráva renderována jako `DiceMessage`, ne plain text (pokud `dicePayload` přítomný).
- [ ] Čerstvý hod (≤ 5 s od `createdAt`) → 3D rolling animace → settled state (~1.7 s celkem).
- [ ] Starší hod (> 5 s nebo prefers-reduced-motion) → 3D settled state bez rolling.
- [ ] Kostky používají skin uložený se zprávou (`message.diceSkin`), ne aktuální preference diváka.
- [ ] Total zvýrazněn (větší font, accent color dle znamení).
- [ ] Skill label + modifier viditelný pokud zadán.
- [ ] Lazy chunk `DiceMessageScene` se loaduje až při prvním render dice zprávy (Network tab ukáže chunk).
- [ ] Při load failure / prohlížeč bez WebGL → fallback statický 2D render (žádný crash).
- [ ] Legacy dice zpráva (bez `dicePayload`) se vykreslí jako monospace text — žádný crash.

### 6.3e — Skiny
- [ ] `SkinPickerPanel` otevřený z pickeru i v `MessageItem` přes „⚙".
- [ ] Per-typ-kostky volba ukládá do `WorldMembership.diceSkinMapping`.
- [ ] Hod používá skin **odesílatele v okamžiku hodu** (uložený v `ChatMessage.diceSkin`).
- [ ] Při změně skinu se starší zprávy v historii nepřemalují.
- [ ] Hover na skin kartě preloadne textury (network panel ukáže `webp` requesty).

### 6.3f — Guards
- [ ] ✎ tlačítko skryté pro dice zprávy.
- [ ] 🗑 skryté pro non-PJ/Admin u dice zpráv.
- [ ] Dice zprávy nezvyšují unread badge konverzace.

### Cross-cutting
- [ ] `mobil-desktop` audit OK.
- [ ] `npm run typecheck` zelený.
- [ ] `npm run test` (FE) — rollEngine unit testy zelené (seeded `Math.random` mock).
- [ ] BE: `chat.service.spec.ts` přidat test pro `dicePayload` + `diceSkin` v `sendMessage`.
- [ ] BE: `world-membership` test pro `diceSkinMapping` persist.

---

## 7. Mimo rozsah / dluhy

| Položka | Důvod odložení | Cíl |
|---|---|---|
| Drag-drop kostky na bitevní mapu | Mapová interakce, ne chat | 10.2j |
| WS broadcast `map:dice-rolled` (synchronizace hodů přes mapu) | Patří mapě, ne chatu | 10.2j |
| Extrakce sdílených modulů z `features/world/chat/dice/` do `features/dice/` (sdílení s mapou) | Refaktoring až s druhým konzumentem | 10.2j |
| Vězení skinů (jail) | Bonus, není v 6.3 roadmapě | Dluh `D-NEW-dice-jail` |
| Sound efekt hodu (cinkání kostek) | Vázané na fázi 13.3 (zvuky) | Fáze 13.3 |
| Default `World.dice` pro nový svět | Fáze 5 — nepatří do chatu | Dluh `D-NEW-dice-default-set` |
| Trim nepoužitých textur (1820 souborů) | Optimalizace, řešit po měření | Dluh `D-NEW-dice-texture-trim` |
| Crypto random (`crypto.getRandomValues`) | Bezpečnost, current MVP postačí | Dluh `D-NEW-dice-secure-rng` |
| Plnohodnotná fyzika kostek (cannon.js / rapier) | Současné rolling = procedural rotace, ne reálná fyzika. Stačí. | mimo MVP |
| Bonus skinů (nové texty mimo 5 kategorií) | Žádné nové skiny v 6.3 — port jen toho co existuje | nikdy / fáze 13 |

---

## 8. Rozhodnutí PJ (2026-05-20)

1. **Composer toolbar na mobilu** = `📎 🎲 😊` viditelné + `⋮` overflow s `🎭 NPC` / `📅 RP` / `🎨 vzhled`. Desktop ponechá všechno přímo. → implementace v 6.3 (`ChannelComposer` rozšíření).
2. **Prázdné `World.dice`** = picker zobrazí prázdný stav „PJ tomuto světu zatím nedovolil kostky" + CTA „Otevřít nastavení světa" (link na 5.3a) — viditelný **jen PJ/Pomocný PJ**, hráč vidí jen prázdný stav. **Žádný klientský fallback.**
3. **Default skin** = `core-obsidian` (černý, ladí s tmavým Ikaros UI). Užito jako fallback v `useDiceSkinMapping` (`mapping?.[type] ?? mapping?.default ?? 'core-obsidian'`).

---

**Po schválení tohoto spec:**
1. Spustím `frontend-design` skill jako design audit (vizuál pickeru, skin karet, `DiceMessage`).
2. Napíšu `plan-6.3.md` s konkrétními úkoly (BE migrace bez data migration; FE poskládat soubory; copy textur).
3. Implementace → mobil-desktop audit → `napoveda` update → zaškrtnutí 6.3 v roadmapě.
