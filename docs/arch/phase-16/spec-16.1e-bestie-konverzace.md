# Spec 16.1e — Bestie v konverzaci (perzistentní soubojové instance)

**Status:** ✅ Spec schválena autorem 2026-06-24 (R1–R6 + O1–O4 zafixovány) → následuje `frontend-design` audit → implementační plán → kód.
**Rozsah:** BE (nový perzistentní stav na konverzaci + atomické operace + WS) **i** FE (combat-tracker-lite rail, HP editace, spawn). Reuse mapového vzoru.
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (BE), commit na `main` (žádná feature větev — viz feedback)
**Velikost:** odhad ~14–18 souborů (BE 6–7, FE 8–11) — rozšířeno o roster PC/NPC + lišta nad konverzací
**Autor:** PJ + Claude
**Datum:** 2026-06-24
**Souvisí:** roadmap2.md:346–351 (16.1e) · spec-16.1.md (rail, hody — 16.1a-c) · taktická mapa 10.2 (MapToken bestie instance, BestiePanelView, InitiativeBar) · `project_bestie_token_instance` · `project_npc_vs_bestie`

> ⚠️ **Tato karta vědomě boří hranici spec-16.1 sekce 5**, která říkala: „HP/staty perzistence bestie v chatu — instance s HP žije na mapě, chat je roll-only". 16.1e přidává perzistentní bestie instance s HP **i do chatu** — na základě zpětné vazby testerů (souboj se odehrává v chatu, ne vždy na mapě).

---

## 1. Cíl

V konverzaci, kde běží souboj, má PJ **nahoře lištu bojovníků** (jako iniciativní lišta nad taktickou mapou) — **PC, NPC i bestie**, v boji / mimo boj, řazené dle iniciativy. Na každém **„i" otevře v pravém boku** jeho deník (postava/NPC) nebo statblok (bestie). **Bestie** lze přidat **ve více kopiích**, měnit jim **životy** a **uložit do konverzace** (perzistence napříč session) — protože nemají deník. PC/NPC drží stav v deníku, do rosteru jdou jako reference. **Bez gridu, fog a pohybu** (to zůstává na mapě).

---

## 2. Kontext / motivace

PC a NPC drží stav v **deníku** (charakterové subdokumenty) — chat na nich už umí házet (16.1a/b). **Bestie fungují jinak** — jsou to nezávislé **instance bez deníku** (`project_bestie_token_instance`). Na mapě je bestie instance `MapToken` se snapshotem `health.current`, vlastními `notes`/`abilities`, editovatelným HP. V chatu dnes (16.1c, [BestieRollPanel.tsx](../../../src/features/world/chat/components/rail/BestieRollPanel.tsx)) je bestie jen **read-only statblok z katalogu** — `buildBestieToken(bestie, 0, 0)` se vyrobí na místě a zahodí; žádná perzistence, žádné HP. Tester vede souboj v chatu a nemá kam zapsat, že „skřet #2 má 4 životy z 12".

16.1e tuhle mezeru zavírá: bestie instance = stejný model jako mapový token, ale **scope = konverzace** místo scény.

---

## 3. Audit současného stavu (kódem ověřeno 2026-06-24)

### 3.1 Mapový vzor (zdroj pravdy k reuse)
- **Token instance** [buildSpawnToken.ts `buildBestieToken`](../../../src/features/world/tactical-map/utils/buildSpawnToken.ts) — z katalogové bestie staví token: `templateId=bestie.id`, `systemStats={...bestie.systemStats, 'health.current': hp}`, snapshot `abilities`/`notes`, seed `currentHp/maxHp/baseHp/armor/injury/initiative`. Pro chat instanci je shape **téměř totožný, jen bez `q/r`**.
- **HP editace + autosave** [MatrixBestiePanel.tsx](../../../src/features/world/tactical-map/components/token-panel/system-panels/MatrixBestiePanel.tsx) — debounce 500 ms `scheduleSave` → `useTokenUpdate.mutate({ tokenId, patch })`; derived `health.current = clamp(maxHP + armor − injury, 0, maxHP)`. **Vzor autosave přenosný 1:1.**
- **Statblok UI** [BestieStatblock.tsx](../../../src/features/world/tactical-map/components/tokens/BestieStatblock.tsx) — props `{ token, systemId, canEdit, stats, onStatsChange, abilities, onAbilitiesChange, notes, onNotesChange, disabled, onRollAbility }`. Plně řízený rodičem → **použitelný i pro chat instanci.**
- **Iniciativa řazení** [initiativeOrder.ts `sortByInitiativeDesc`](../../../src/features/world/tactical-map/utils/initiativeOrder.ts) + vizuál položky [InitiativeBarItem.tsx](../../../src/features/world/tactical-map/components/initiative/InitiativeBarItem.tsx) (kruhový portrét, HP-tier border). Reuse vizuálu, ne combat stavu.
- **Token update mutace** [useTokenUpdate.ts](../../../src/features/world/tactical-map/hooks/useTokenUpdate.ts) — optimistic apply + rollback + invalidate. **Vzor pro chat instance mutaci.**

### 3.2 Chat rail (kam to sedí)
- [ChatContextRail.tsx](../../../src/features/world/chat/components/rail/ChatContextRail.tsx) — stavový stroj: PJ má `presence` (ChannelMemberPanel + RailEntitySearch), `diary`, `bestie` (read-only). Hráč má rovnou svůj `DiaryRollPanel`.
- [BestieRollPanel.tsx](../../../src/features/world/chat/components/rail/BestieRollPanel.tsx) — dnes read-only katalog. **16.1e ho rozšíří o tlačítko „⚔️ Přidat do souboje" a doplní nový combat mód.**
- [useChatDiaryRoll.ts](../../../src/features/world/chat/components/rail/useChatDiaryRoll.ts) — most hod→konverzace s atribucí (`kind: 'bestie'` už existuje: `overrideName`+`overrideAvatarUrl`). **Reuse pro hody instance.**

### 3.3 ChatChannel model (kam ukládat — BE)
- Schema [chat-channel.schema.ts] — pole `groupId/worldId/name/.../type/imageUrl/linkedMemberUserId`; soft-delete `isDeleted` + world cascade restore už řeší konverzaci.
- `updateChannel` (whitelist DTO, full-field) + WS `chat.channel.updated` → leak-safe signál `{ worldId }` na room `world:{worldId}`.
- **Field-drift checklist (5 míst):** schema · interface · DTO · service · repository `toEntity` whitelist (`project_be_field_checklist`).
- Room join: `chat:channel:join` → klienti v room `chat:{channelId}` (presence). **Tady budou žít bestie WS signály.**

---

## 4. Návrh řešení

### 4.0 Klíčová rozhodnutí (řeší 4 otevřené otázky z roadmapy)

| # | Otázka z roadmapy | Rozhodnutí | Důvod |
|---|---|---|---|
| **R1** | Instance na `ChatChannel`, nebo vlastní kolekce? | **Embedded pole `bestieInstances[]` na `ChatChannel`** | Parita s `MapScene.tokens` (embedded). Combat-tracker-lite = málo instancí (pár bestií / souboj), žádné cross-konverzační querování. Soft-delete + world cascade konverzace už hotové → instance jedou s ní zadarmo. Žádný nový modul/kolekce. |
| **R2** | Iniciativa / řazení? | **ANO — číslo `initiative` per instance + auto-sort desc** (reuse `sortByInitiativeDesc`). **BEZ** round/turn/„čí tah" pointeru. | Instance shape (token) ji už nese, sort util existuje → nízký náklad. „Čí tah" plátno = mapa; chat je jen seznam. |
| **R3** | Viditelnost HP hráčům? | **Per-typ přepínač `showHpPc` / `showHpNpc` / `showHpBestie` — parita s mapou 1:1** (ne per-instance toggle). **Dvě úrovně:** world default v **nastavení světa** (vzor [MapDefaultsTab](../../../src/features/world/pages/WorldSettingsPage/tabs/MapDefaultsTab.tsx)) + per-konverzace override (vzor [EditSceneModal](../../../src/features/world/tactical-map/components/pj-panel/EditSceneModal.tsx) per-scéna). | Tak to dělá mapa (ověřeno: [TokenSprite.tsx:484-490](../../../src/features/world/tactical-map/components/tokens/TokenSprite.tsx#L484)). Konzistence napříč nástroji; PJ to zná z mapy. |
| **R4** | Sdílí combat tracker s mapou, nebo samostatný? | **Úplně oddělený** (potvrzeno autorem). Reuse **komponent a utilit** (BestieStatblock, InitiativeBarItem vizuál, sort, builder, useChatDiaryRoll), ale stav žije **nezávisle na `ChatChannel`** — žádný sdílený runtime se scénou. | Mapa combat je vázaná na scénu/hex/fog. Souboj v chatu ≠ souboj na mapě (jiné kolbiště). |
| **R5** | *(rozšíření 2026-06-24)* Co je v trackeru? | **Plný combat roster: PC + NPC + bestie**, každý s přepínačem **v boji / mimo boj** (vzor `InitiativeBar` combatants vs. bench). | Autor: „nahoře osoby v boji/mimo boj + NPC". Tracker jen s bestiemi je polovičatý. |
| **R6** | *(O4, 2026-06-24)* Kola / „čí je na řadě"? | **ANO — počítadlo kol + turn pointer, ale gated za „boj aktivní"** (PJ spustí boj → zafixuje iniciativu, běží kola/tahy; před tím jen roster). Reuse mapového `useCombat` (`active`/`round`/currentId). | Autor: „počítadlo neviditelné dokud nezačne boj; PJ aktivuje boj → udělá iniciativu a pracuje s ní". Mapový vzor 1:1. |

### 4.1 Datový model — `ChatCombatant` (embedded pole `combatants[]` na ChatChannel)

Jeden sjednocený roster (R5). Discriminated union dle původu HP:
- **`kind: 'character'`** (PC i NPC) — HP/staty drží **deník postavy**; v rosteru je jen **reference** (slug) + iniciativa + v boji/mimo. HP se čte **live z deníku**, nic se neduplikuje (vzor mapy: PC/NPC token nemá `systemStats`, HP řeší `resolveCharacterHp`).
- **`kind: 'bestie'`** — bestie nemá deník → nese **vlastní perzistentní instanci** (snapshot z katalogu, editovatelné HP). Tohle je jádro 16.1e.

```ts
type ChatCombatant = {
  id: string;            // UUID (BE generuje při add)
  initiative: number;    // R2 — řazení desc nahoře
  inCombat: boolean;     // R5 — v boji (lišta) vs. mimo boj (bench)
  isNpc?: boolean;       // u 'character' rozlišuje PC/NPC → visibility flag (R3)
} & (
  | { kind: 'character'; characterSlug: string }   // PC/NPC: HP z deníku live
  | {                                              // bestie: perzistentní instance
      kind: 'bestie';
      bestieId: string;        // ref na Bestie katalog (templateId)
      name: string;            // snapshot, PJ může přejmenovat („Skřet #2")
      imageUrl?: string;       // snapshot
      systemStats: Record<string, unknown>; // snapshot, editovatelné (health.current/max)
      abilities: { name: string; description: string }[]; // snapshot
      notes: string;           // instance poznámky
    }
);
```

> ⚠️ HP bestie nedržíme v duplicitních fixed polích (`currentHp/maxHp`) — **single source = `systemStats['health.current'|'health.max']`** (jako mapa po fix D-066/10.2d). PC/NPC HP **vůbec neukládáme** na konverzaci — žije v deníku, jinak vzniká druhá pravda.

**Stav boje (R6)** — vedle `combatants[]` na `ChatChannel`:
```ts
interface ChatCombatState {
  active: boolean;            // PJ spustil boj? (před tím jen roster, žádné kolo/pointer)
  round: number;             // počítadlo kol (od 1 po aktivaci)
  currentCombatantId?: string; // čí je tah
}
```
Vzor = mapový [useCombat](../../../src/features/world/tactical-map/hooks) (`active`/`round`/`currentTokenId`) — reuse logiky řazení a posunu tahu, oddělený stav (R4).

### 4.2 BE — atomické operace nad rosterem (NE přes `updateChannel`)

Vzor = mapa operations (`POST /map/:sceneId/operation` s atomic `$push/$set/$pull`), **ne** full-array replace přes `updateChannel` (ten by byl race-prone při paralelní editaci HP).

| Endpoint | Operace | Mongo | Gating |
|---|---|---|---|
| `POST /chat/channels/:id/combatants` | add (postava ze rosteru / bestie z katalogu) | `$push` | PomocnyPJ+ |
| `PATCH /chat/channels/:id/combatants/:cid` | update (HP/stats/abilities/notes/initiative/inCombat/name — dle kind) | `$set: { 'combatants.$[c].key': v }` | PomocnyPJ+ |
| `DELETE /chat/channels/:id/combatants/:cid` | remove | `$pull` | PomocnyPJ+ |
| `PATCH /chat/channels/:id/combat` | boj: start / další tah / konec (R6: `active`/`round`/`currentCombatantId`) | `$set` | PomocnyPJ+ |

- Add `bestie`: BE načte katalogovou bestii (world+system scope, access check), vyrobí snapshot (server-side `buildBestieInstance`), `$push`.
- Add `character`: jen reference (slug + init + inCombat) — žádný snapshot HP.
- `systemStats` patch (jen bestie) validovat per-system (`SystemStatsValidatorService` soft-mode — jako token).
- Field-drift: schema + interface + DTO + service + repository `toEntity` whitelist (`combatants`).

### 4.3 BE — viditelnost HP (R3) + WS signál (leak-safe)

**Visibility config** — nová pole na konverzaci, **parita s mapou** (per-typ, dvě úrovně):
- **World default:** rozšířit nastavení světa (vedle map defaults `showHpPc/Npc/Bestie`) o ekvivalent pro chat, NEBO **sdílet stejné world-level flagy** (mapa i chat čtou jeden default). *Volba k potvrzení (O3) — sdílení je míň polí, ale sváže dva nástroje.*
- **Per-konverzace override:** `chatCombatConfig: { showHpPc?, showHpNpc?, showHpBestie? }` na `ChatChannel` (chybí = world default). Edituje PJ z trackeru.

**GET roster** — dedikovaný `GET /chat/channels/:id/combatants`, **server-filtrovaný dle role + visibility**: hráč dostane combatanty, ale HP/staty jen u typů s viditelností `true` (gate `showHp{Pc|Npc|Bestie}` jako [TokenSprite.tsx:484](../../../src/features/world/tactical-map/components/tokens/TokenSprite.tsx#L484)); PJ vše. Armor/skryté staty hráči nikdy.

**WS** — nový event `chat:combat:updated { channelId }` na room `chat:{channelId}` (účastníci přes `chat:channel:join`). Leak-safe signál → klient refetchne roster GET s access checkem.

### 4.4 FE — UX: lišta nahoře + „i" otevírá bok (potvrzeno autorem 2026-06-24, viz screenshot)

**Vzor = mapový `InitiativeBar` + `onOpenInfo`. Tracker neřeší editaci sám — je vstupní bod do bočního railu, kde už deník/statblok je. „Nic víc."**

1. **Vodorovná lišta NAD konverzací** = `ChatInitiativeBar` (reuse vizuálu [InitiativeBarItem](../../../src/features/world/tactical-map/components/initiative/InitiativeBarItem.tsx)):
   - portréty combatantů `inCombat`, seřazené dle iniciativy (desc, `sortByInitiativeDesc`), HP-tier border, badge pořadí;
   - **každá položka má ikonu „i"** → otevře combatanta v **pravém boku** (jako dnes na screenshotu);
   - **vidí ji i hráč** (read-only; HP-tier dle R3 visibility — typy se skrytým HP bez baru).
   - **Stav boje (R6):** před aktivací jen roster (žádné kolo/pointer). PJ tlačítko **„⚔️ Začít boj"** → zafixuje iniciativu, `round=1`, zvýrazní `currentCombatantId`; **„Další tah"** posune pointer (přetočení = `round+1`); **„Konec boje"** → zpět na roster. **Počítadlo kol / „na řadě" se zobrazí až po aktivaci** (autor: PJ ví, že tam je; hráč nevidí pořád).
2. **Pravý bok (rail) = reuse stávajícího panelu, podle typu:**
   - **postava / NPC** → `DiaryRollPanel` (přesně panel ze screenshotu — ŽIVOTY/ÚNAVA/schopnosti; HP live z deníku, editace jako dnes). Tracker tím dává PJ **rychlý přístup ke všem deníkům v boji**.
   - **bestie** → statblok **s editací** (`BestieStatblock` `canEdit` pro PJ: HP/stats/abilities/notes + autosave vzor `MatrixBestiePanel`). Tady žije HP perzistence instance. *(Pozn.: katalogový náhled bestie z `RailEntitySearch` před přidáním zůstává read-only — editace až po přidání do boje.)*
   - schopnost v boku → hod do konverzace (`useChatDiaryRoll`, atribuce = jméno+obrázek combatanta).
3. **Správa rosteru** (PJ): přidat do boje člena z **Přítomní** (PC/NPC) nebo bestii přes `RailEntitySearch`; per-combatant **v boji ⇄ mimo boj** toggle, iniciativa, 🗑 odebrat. Umístění (mini-akce na liště vs. v panelu Přítomní) → doladit ve `frontend-design`.

**Hráč:** lištu nahoře vidí, „i" mu otevře v boku **svůj** deník (jako dnes) nebo viditelnou bestii read-only. Žádná správa rosteru.

> 🎨 Přesný vizuál lišty + umístění správy → **`frontend-design` audit mezi spec a implementačním plánem** (autor chce vidět „jak to bude fungovat").

### 4.5 FE — mutace + cache

- Nový hook `useChannelCombatants(channelId)` (GET, server-filtrovaný) + `useCombatantMutation` (add/update/remove) s **optimistic apply + rollback** (vzor `useTokenUpdate`).
- WS `chat:combat:updated` listener → invalidate roster query (s `useSocketReconnect` re-join `chat:{channelId}`, `project_ws_security_patterns`).
- Autosave debounce 500 ms (parita s mapou).

### 4.6 Reuse builder (sdílený seed)

Extrahovat seed logiku z `buildBestieToken` do sdíleného `bestieSnapshotFrom(bestie)` (HP/abilities/notes/systemStats) — volá ho mapový `buildBestieToken` (+ q/r/token pole) i BE `buildBestieInstance` (bez pozice). Jeden zdroj seed semantiky.

---

## 5. Out of scope

- **Grid / fog / pohyb / hex** — zůstává na mapě (hranice roadmapy).
- **Sdílení runtime stavu s mapovou scénou** — úplně oddělené (R4); roster v chatu ≠ tokeny na mapě.
- **Bestie-instance z běžící mapy s aktuálním HP** (import živého tokenu do chatu) — případná pozdější nadstavba.
- **Signature dice skin bestie** — stále out of scope (jako spec-16.1 R3); hod bere skin házejícího.
- **PC/NPC HP perzistence na konverzaci** — postavy/NPC v rosteru jsou jen **reference**; HP/staty zůstávají v deníku (single source, autor: „deník je vždy jediný zdroj, vše se propisuje"). 16.1e perzistuje jen bestie (nemají deník).

---

## 6. Acceptance kritéria

1. ✅ PJ přidá do boje **bestii** z katalogu → vznikne perzistentní instance na konverzaci; **postavu/NPC** z Přítomných → reference (HP z deníku).
2. ✅ PJ přidá **víc kopií téže bestie** (každá vlastní HP/iniciativu/jméno).
3. ✅ PJ edituje HP bestie-instance → uloží se (autosave) a přežije reload stránky i odhlášení (perzistence na `ChatChannel`). HP postavy/NPC se edituje v jejich deníku (vidět i na listu/mapě).
4. ✅ Lišta **nad konverzací** ukazuje combatanty `inCombat` seřazené dle iniciativy (desc); PJ přepíná v boji ⇄ mimo boj a edituje iniciativu.
5. ✅ Klik na **„i"** u položky → otevře v pravém boku deník (postava/NPC) nebo statblok (bestie, editovatelný PJ).
6. ✅ Hod schopnosti z boku → zpráva do aktivní konverzace, atribuovaná jménem+obrázkem combatanta.
7. ✅ Viditelnost HP per typ (`showHpPc/Npc/Bestie`, R3): hráč na liště vidí HP-tier jen u povolených typů; world default jde nastavit v nastavení světa + per-konverzace override.
8. ✅ PJ combatanta odstraní → zmizí z lišty i z DB (bestie i z perzistence).
8b. ✅ Před „Začít boj" je jen roster (žádné kolo/pointer). PJ spustí boj → `round=1` + „na řadě"; „Další tah" posouvá pointer a po přetočení zvýší kolo; „Konec boje" vrátí roster (R6).
9. ✅ Změny se propíšou ostatním účastníkům konverzace přes WS (leak-safe: hráč filtrovaný roster dle R3).
10. ✅ Atomická operace HP nepřepíše paralelní změnu jiného combatanta (per-instance `$set`, ne full replace).
11. ✅ Lišta i bok fungují na mobilu i desktopu (overlay/scrim vzor jako stávající rail).
12. ✅ `npm run build` (tsc -b) prochází; BE typecheck+lint; vitest pokrytí (builder seed · mutace optimistic+rollback · gating PJ vs hráč · HP visibility filtr per typ · sort · roster discriminated union).

---

## 7. Test plán

- **FE vitest:** `bestieSnapshotFrom` seed · `useBestieInstanceMutation` optimistic+rollback · rail mód switch (presence↔combat↔instance) · gating (hráč read-only, vidí jen hpVisible) · sort dle iniciativy · hod instance → správná atribuce.
- **BE jest:** add/update/remove operace (atomic) · access gating (Hrac→403 na mutaci) · GET filtr `hpVisibleToPlayers` per role · systemStats validace · field-drift (toEntity vrací `bestieInstances`). `--maxWorkers=2` (`project_be_test_mongo_flaky`).
- **Smoke (ruční):** PJ vede souboj — přidá 3× skřeta, ubírá HP, hodí schopnost, jednomu zapne viditelnost → ověřit na druhém účtu (hráč) že vidí jen toho jednoho; reload → HP drží.
- **`mobil-desktop`** po grafice. **`funkce` + `napoveda`** po dokončení (změna funkčnosti chatu). **`frontend-design`** mezi spec a impl. plánem (combat-tracker UI).

---

## 8. Riziko & rollback

| Riziko | Dopad | Mitigace |
|---|---|---|
| Full-array replace HP → race při paralelní editaci | přepsání | atomické `$set` per-instance (R/4.2), ne `updateChannel` |
| Hráč vidí skryté instance / armor | leak | GET server-filtr dle `hpVisibleToPlayers` + role; armor read-only nikdy hráči (vzor mapa) |
| `toEntity` zapomene `bestieInstances` | tichá ztráta při GET | field-drift checklist 5 míst (`project_be_field_checklist`), začít od mapperu |
| `systemStats` schema drift bestie | validace 400 | soft-mode validátor (skip bez schématu) — jako token |
| Duplicitní `id` při rychlém spawnu | update zasáhne víc instancí | BE generuje UUID (ne klient); na mapě řešeno pending-id, tady server-side |
| WS bez reconnect re-join | po výpadku stale | `useSocketReconnect` re-join `chat:{channelId}` (`project_ws_security_patterns`) |

**Rollback:** aditivní — nové pole (default `[]`), nové endpointy, nový rail mód. Vypnutí = skrýt tlačítko „Souboj"/„Přidat do souboje"; data zůstanou neškodně. Žádná destruktivní migrace.

---

## 9. Otázky k autorovi

Rozhodnutí dle dialogu 2026-06-24 (R1–R5 v 4.0) — **potvrzená autorem:**
- **R1** ✅ embedded `combatants[]` na ChatChannel (víc bestií najednou v konverzaci).
- **R2** ✅ iniciativa nahoře jako mapa (seřazený seznam).
- **R3** ✅ HP viditelnost = per-typ jako mapa (`showHpPc/Npc/Bestie`), nastavitelné v nastavení světa.
- **R4** ✅ úplně oddělené od taktické mapy.
- **R5** ✅ roster = PC + NPC + bestie, v boji/mimo boj; „i" otevírá deník/statblok v boku.

Doladění **potvrzená autorem 2026-06-24:**
- **O1** ✅ Hráč na liště u viditelného typu vidí jen **portrét + HP-tier**, ne plné staty/schopnosti nepřítele.
- **O2** ✅ Přidat do boje smí jen **PomocnyPJ+** (ne hráč).
- **O3** ✅ World default HP-viditelnosti **samostatně pro chat** (nesdílet s mapou). *Deník zůstává jediný hlavní zdroj — propisuje se; výjimky by si PJ řešil poznámkou, mimo scope.*
- **O4** ✅ **Počítadlo kol + „na řadě" ANO**, ale gated za „Začít boj" (R6) — neviditelné dokud PJ boj nespustí.

> 📌 **Napříč specem platí (autor):** *deník postavy/NPC je vždy jediný zdroj — vše se do něj propisuje.* Roster na něj jen odkazuje.

---

**Všechny otázky vyřešené. Další krok:** `frontend-design` audit (vizuál lišty `ChatInitiativeBar` + ovládání boje + umístění správy rosteru, ať vidíš „jak to bude fungovat") → teprve pak implementační plán (BE moduly + FE komponenty / file diff / hooky).
