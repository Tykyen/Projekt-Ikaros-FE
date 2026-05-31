# Spec 10.2j — Viditelný hod kostkou na mapě

## Účel
Přinést na taktickou mapu **viditelný hod kostkou**: když PJ nebo hráč hodí, kostky
mu vletí na plochu (overlay), výsledek se zapíše do **logu hodů** a — dle nastavení
světa — uvidí ho i ostatní. Mapa má **vlastní izolovaný dice prostor** oddělený od
chatu; sdílí s ním pouze **engine a vzhled** kostek z kroku 6.3 (žádná sdílená data
ani logy).

## Architektonický kontext (odchylka od roadmapy — záměr)
Roadmapa u 10.2j počítala s **3D overlayem přes lazy-load `three.js`**. To se
**zahazuje**:
- FE 6.3 (hod kostkou v chatu) **už má hotový 3D hod přes CSS transforms** —
  `DiceRollOverlay` (tumble→settle→show), polyhedrální modely, 22 skinů / 1601
  textur, per-typ skin mapping. Vyladěné, v produkci.
- Legacy mapa v `c:\Matrix\Matrix` renderovala kostky rovněž přes CSS.
- Přidat `three.js` = nová těžká závislost + **druhý** rendering kostek + **druhý**
  skin systém vedle 6.3 = duplicita.

**Rozhodnutí:** `three.js` se nepřidává. Map dice **reusuje 6.3 CSS rendering**
(`rollEngine`, `dicePayload`, `diceSkins`, `diceTargets`, modely, `DiceRollOverlay`).
Roadmapa 10.2j se opraví (odebrat zmínku o `three`). Schváleno uživatelem
(brainstorming 2026-05-31).

---

## Princip — izolovaný map dice prostor
- **Chat tlačítko → chat** (beze změny). **Map tlačítka → mapa.**
- Mapa má vlastní log, vlastní persistenci, vlastní per-user clear, vlastní
  visibility (z nastavení světa). Nic z toho se nemíchá s chatem.
- Sdílí se jen **knihovna kostek z 6.3** (`src/features/world/chat/dice/lib/*`,
  `components/DiceRollOverlay.tsx`, modely, `SkinPickerPanel`). Pokud je nutné kód
  reuse-nout přes hranici feature, vytáhne se sdílená část do neutrální cesty
  (`src/features/world/_shared/dice/` nebo ponechat v `chat/dice/lib` a importovat).
  Volba interface vrstvy se doladí v implementačním plánu — **bez kopírování kódu**.

💡 *Reuse = stejné komponenty/lib voláme z mapy i z chatu. Žádná duplicita logiky
hodu ani textur.*

---

## Část j-1 — Datová vrstva (persistovaná historie)

Hody scény jsou **persistované** (přežijí refresh, dorovnají po reconnectu — stejně
jako efekty/fog přes operations model). NE ephemeral jako `map:spotlight`.

### Tvar záznamu hodu
```ts
interface MapDiceRoll {
  id: string;            // FE-generated, stabilní (jako u efektů)
  byUserId: string;      // kdo hodil
  rollerName: string;    // zobrazené jméno (postava / PJ / NPC / bestie)
  tokenId?: string;      // token, za který se hází (skill/init), optional
  rollerKind: 'pc' | 'pj' | 'npc' | 'bestie';  // pro visibility filtr
  category: 'skill' | 'initiative' | 'custom';  // typ hodu (per-system kategorie)
  dicePayload: DicePayload;  // reuse z 6.3 — discriminated union (fate/generic/pool/mixed/d100)
  rolledAt: string;      // ISO timestamp
}
```

### Uložení
- Per-scéna, **cap ~50 nejnovějších** hodů (proti bloatu scene dokumentu). Starší
  padají z hlavy fronty.
- Realizace přes **operations model** (nová op `dice.roll` + případně
  `dice.clear-all` viz níže). BE atomic append s capem (`$push` + `$slice: -50`).
- 📚 *cap = držím jen N nejnovějších; starší se ořežou, panel není nekonečný.*

### Operace
- **`dice.roll`** (kdokoli ≥ člen světa s právem house): append `MapDiceRoll` do
  `scene.diceRolls` (atomic, cap). Broadcast `map:operation` všem ve scéně (overlay
  + log si každý klient filtruje sám dle visibility).
- Clear je **per-user view**, NE operace (viz j-3). Žádný destruktivní broadcast.

⚠️ **Authorization:** `dice.roll` musí ověřit, že `byUserId` = volající (anti-spoof),
a u `tokenId` (skill/init za token), že volající má na ten token právo (PC = vlastník,
NPC/bestie = PJ). Detail v plánu + `OperationsAuthorizer`.

---

## Část j-2 — Spouštěče hodu (vstupní body)

Všechny tři → zápis do map logu + overlay tomu, kdo hází (ostatním dle visibility).

1. **Schopnost** — z **existujících** sheet/deník tlačítek postavy (token modal →
   DiaryTab / per-system sheet). Tlačítka už produkují `dicePayload`; na mapě je
   nasměrujeme na `dice.roll` (category `skill`) místo chatu.
2. **Iniciativa** — 🎲 tlačítko v **iniciativní liště** (10.2f už existuje). Dnes
   nastaví hodnotu iniciativy; nově navíc vyšle vizuální `dice.roll`
   (category `initiative`).
3. **Vlastní hod** — **nové samostatné tlačítko** v map dice UI. Reuse 6.3
   `DicePickerPopover` (výběr typu kostky z `World.dice` whitelistu + label + modifier),
   category `custom`.

💡 *Schopnost/iniciativa = kontextové hody navázané na token. Vlastní hod = freeform,
nezávislý na tokenu.*

---

## Část j-3 — Log hodů (UI panel)

Port vzhledu legacy `DiceLog` (glassmorphism, blur, color-coded ±), **scoped pod
`[data-theme]`** (theme izolace — žádné globální edity).

### Umístění
- **Plovoucí panel vlevo dole, NAD orchestračním panelem** (`MapPjPanel`),
  symetricky k tomu, jak Efekty plují nad Zobrazením (zoom) vpravo dole.
- **NE** nový `MapDockStack` item, **NE** samostatný orchestrační panel.
- Otvíratelný / sbalitelný (LS persist, jako ostatní map UI).

⚠️ Hráč nemá `MapPjPanel` (PJ-only). U hráče log poletí na společném `bottom-left`
anchoru na pozici, kde by panel byl — ne „nad ničím". Anchor řešit sdílenou CSS
proměnnou (offset dle přítomnosti PJ panelu).

### Obsah
- Mají ho **PJ i hráč**.
- **PJ** vidí všechny hody scény (pc/pj/npc/bestie).
- **Hráč** vidí: vždy **své** hody + ostatní dle `World.diceVisibility` (viz j-4).
- Položka: jméno, kostky (faces, color-coded), součet/výsledek, kategorie (chip:
  „Schopnost" / „Iniciativa" / „Vlastní"), čas. „Veličiny" hráče = jeho výsledky
  hodů napříč kategoriemi.
- Newest first, recent entry blikne (`log-flash`).

### Clear — per-user view (NE destruktivní)
- „Promazat" = **schovej mi to z mého panelu**, pro PJ i hráče stejně.
- Realizace: per-user `clearedBefore` timestamp v **localStorage**
  (`ikr-map-dice-cleared-<sceneId>`). Panel filtruje `roll.rolledAt > clearedBefore`.
- **Nepropisuje se nikomu jinému.** Každý má vlastní viditelný log podle svých potřeb.
- Přežije refresh (LS). Data hodů zůstávají ve scéně (cap je maže globálně, ne clear).

💡 *Proč per-user a ne destruktivní op: smysl je, aby každý sledoval své hody. PJ má
vidět všechny — kdyby hráčův clear mazal data, PJ by o ně přišel.*

---

## Část j-4 — Viditelnost hodů (nastavení světa)

Visibility je **world-level**, NE per-scéna. Řídí **overlay na ploše i log** zároveň
— když svět zakáže hody NPC/bestií, hráč je neuvidí ani jako vlétnutí kostek na
plochu, ani jako záznam v logu.

### Schema
Nové pole na `World`:
```ts
interface WorldDiceVisibility {
  showPjRolls: boolean;        // hráči vidí PJ hody — default false
  showNpcBestieRolls: boolean; // hráči vidí hody NPC + bestií — default false
  showTeammateRolls: boolean;  // hráči vidí hody spoluhráčů — default true
}
// World.diceVisibility?: WorldDiceVisibility
```
- „Dodatkové" / režijní hody PJ spadají pod `showPjRolls` (žádná čtvrtá kategorie).
- **Hráč vždy vidí své vlastní hody** — nelze vypnout.
- PJ vždy vidí vše.

### UI
- 3 přepínače v **Základní info** tabu nastavení světa
  (`WorldSettingsPage/tabs/BasicInfoTab.tsx`), hned **pod „Kostky / mechaniky"**
  (`World.dice` whitelist) — veškerá kostková konfigurace pohromadě.

### Filtr (FE, sdílený helper)
```
canSeeRoll(roll, viewer, world.diceVisibility):
  if viewer is PJ: true
  if roll.byUserId === viewer.userId: true            // vlastní vždy
  switch roll.rollerKind:
    'pj':            showPjRolls
    'npc' | 'bestie': showNpcBestieRolls
    'pc':            showTeammateRolls
```
Stejný helper použije **overlay** (zobrazit/nezobrazit cizí hod na ploše) i **log**.

📚 *world-level = jedno nastavení pro celý svět, platí na všech scénách. Per-jeskyně
toggly se neдělají.*

---

## Část j-5 — Viditelný hod na ploše (overlay)

- Reuse 6.3 `DiceRollOverlay` (CSS 3D, tumble→settle→show, ~4–5 s, pak zmizí).
- **Tomu, kdo hází**, se overlay spustí **vždy** (i kdyby visibility cizím bránila).
- **Ostatním** se overlay spustí jen pokud `canSeeRoll(...) === true`.
- Respekt `prefers-reduced-motion` (6.3 už řeší).
- Spuštění reaktivně na příchozí `dice.roll` op (čerstvý záznam → overlay), s
  guardem proti re-trigger při catch-up/replay starých opů (overlay jen pro hody
  mladší než N sekund / jen pro ty, co dorazí live, ne při initial load).

⚠️ **Catch-up guard:** po reconnectu/refresh se replayuje historie hodů — NESMÍ to
spustit overlay pro staré hody. Overlay jen pro op přijatou live po mountu
(timestamp gate + „seen ids" set).

---

## Část j-6 — Set kostek + Vězení

- **Připravený set + skin picker** = reuse 6.3 `SkinPickerPanel` (22 skinů, per-typ
  skin mapping z `useDiceSkinMapping`). Dostupné z map dice UI.
- **Vězení pro kostky** (`DiceJailTray`) — port z legacy. Dočasné „uvěznění" skinu
  (nepoužije se při hodu). Persist v localStorage `ikr-jailed-dice`.
- **Vězení i skin mapping = uživatelská preference, sdílená napříč chat + mapa**
  (NE per-scéna). Co si uvězním/nastavím v chatu, platí i na mapě a naopak.

💡 *Vězení = „tenhle skin teď nechci, ale nechci ho mazat" — schová ho z výběru.*

---

## Část j-7 — WS / Operations

- Nový op typ **`dice.roll`** (persistovaný přes `map:operation`, room `{sceneId}`).
  DTO + registry + `applyAtomic` (append+cap) + `computeInverse` (no-op nebo pop —
  hody nejsou undo-relevantní; rozhodne plán) + FE patcher case.
- **Reconnect catch-up funguje zdarma** — `dice.roll` je standardní op se
  `seqNumber`, projde existující gap-detection / catch-up cestou (10.2c / 10.2i).
- Nepřidává se ephemeral event — na rozdíl od `map:spotlight` chceme persistenci.

---

## Část j-8 — Per-system kategorie hodů

- Kategorie hodu (`skill` / `initiative` / `custom`) a jejich popisky/dostupnost
  jsou **per-system** přes `map-systems/` plugin registry.
- FATE / Matrix: *Hod schopnosti*, *Iniciativa*, *vlastní hod*. Jiné systémy = jiná
  sada (definováno v jejich pluginu, `defaultDice` / `rollSkill` už existují jako
  stub z 10.2-prep-3).
- Vlastní hod (`custom`) je univerzální napříč systémy.

---

## Out of scope (vědomě)
- **`three.js` / WebGL 3D kostky** — reuse CSS 6.3 (viz Architektonický kontext).
- **Per-scéna visibility** — visibility je world-level.
- **Destruktivní clear (broadcast)** — clear je per-user view.
- **Persistence napříč session na BE pro overlay** — overlay je čistě live efekt;
  persistuje se jen log (záznamy).
- **Oprava FATE plus↔mínus bugu v chatu** — záměrně odloženo na **konec** kroku
  10.2j (záznam v `docs/dluhy.md`, [otevřeno 2026-05-31]).

## Napojení / závislosti
- **6.3** (dice engine + skiny + overlay) — reuse.
- **10.2-prep-1 / 10.2c / 10.2i** — operations model, catch-up, patcher.
- **10.2f** — iniciativní lišta (spouštěč iniciativa).
- **8 / token modal** — sheet tlačítka schopností (spouštěč skill); deníky na mapě
  (10.2l) prohloubí, ale token modal DiaryTab už je dostupný.

## Mobil / desktop
Po dokončení UI (log panel, dice picker, jail, world settings toggly) spustit
`mobil-desktop` audit (log panel + dice picker + jail musí fungovat na mobilu i
desktopu).

## Nápověda
Po dokončení spustit skill `napoveda` — doplnit hod kostkou na mapě + world dice
visibility nastavení do `/ikaros/napoveda`.
