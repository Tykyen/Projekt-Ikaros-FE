# Spec 16.6 — One-shot v Campu: zamčené žánry, rotace lokace, uložení/načtení hry

**Status:** 🟡 Návrh k schválení
**Rozsah:** FE + BE — Camp (globální chat) jako místo pro hru na jeden večer. Zamčený žánr per Camp (default fantasy/mystery/sci-fi) · auto-rotace lokace ve 12:00 a 00:00 · dočasný staff override do dalšího okna · uložení/načtení „hry" (scéna + pár posledních zpráv jako kotva, 1 slot per hráč).
**Autor:** PJ + Claude
**Datum:** 2026-07-05
**Souvisí:** [spec-4.2a](../phase-4/spec-4.2a.md) (Camp = původní „Rozcestí", sdílené prostředí, STAFF_ROLES), [[project_rozcesti_camp_rename]] (rename), BE `global-chat` modul, [[feedback_be_restart_required]].
**Vychází z:** dialog s autorem (2026-07-05). **Vědomý pivot proti roadmapě:** 16.6 v `roadmap2.md` mluvila o „uložení taktické scény + rozestavení". Autor to explicitně **odmítl** — uložení = **chatový log** (kdo co řekl), ne taktická mapa. Roadmapa se sladí (§4.8).

---

## 1. Cíl

Camp jsou 3 veřejné roleplay místnosti pro **hru na jeden večer**. Tři novinky:

1. **Zamčený žánr per Camp.** Camp I = fantasy, II = mystery (`mystic`), III = sci-fi jako **default**. Hráč nemění nic; scénu řídí správci. **Název Campu = žánr** — „Fantasy camp / Mystery camp / Sci-fi camp" (místo „Camp I./II./III."); v hlavičce místnosti se název řídí *aktuálním* žánrem (staff override → název se přepne + odznáček „dočasně").
2. **Živá scéna.** Lokace se **sama mění ve 12:00 a 00:00** (náhodně z 20 v rámci žánru). Správce může ručně přehodit lokaci i žánr, ale jen **dočasně — do dalšího okna**, pak se scéna vrátí na default.
3. **Uložení / načtení hry.** Hráč si uloží **jednu** hru = snímek scény + pár posledních zpráv („kde jsme skončili"). Později ji načte → scéna se přepne na uloženou a nad živým logem se ukáže blok „Tady jste skončili". Parta naváže a hraje veřejně dál; kdokoli se může přidat nebo koukat.

---

## 2. Rozsah

| Sub | Část | Stav |
|---|---|---|
| **16.6a** | Default žánr per Camp (`CAMP_DEFAULT_GENRE`) + admin-nastavitelný override defaultu (trvalé přerozdělení „víc fantasy") | 🟡 nový |
| **16.6a** | Auto-rotace lokace cronem ve 12:00 a 00:00 (náhodná lokace v default žánru, `startHere` reset) | 🟡 nový |
| **16.6a** | Staff ruční override (styl+lokace) = dočasná odchylka do dalšího okna (žádný timestamp — cron přepíše) | 🟡 nový |
| **16.6a** | FE `CampHeader`: žánr = štítek Campu (ne volný select pro nikoho); staff override lokace i žánru; hráč read-only | 🟡 úprava |
| **16.6a** | Přejmenování „Camp I./II./III." → „Fantasy/Mystery/Sci-fi camp" (nav + hlavička + BE `ROOM_DEFS`); interní klíče `camp-1/2/3` + routy `/chat/camp*` beze změny (vzor [[project_hospoda_putyka_rename]]) | 🟡 úprava |
| **16.6a** | Dynamický název hlavičky dle aktuálního žánru; **nav = stabilní domovský žánr** (nemění se override — jinak duplicitní „Fantasy camp" v menu) | 🟡 nový |
| **16.6b** | DB entita `CampSavedGame` — 1 slot per hráč (upsert), snímek env + posledních N zpráv | 🟡 nový |
| **16.6b** | BE API: save / get / load / delete uložené hry | 🟡 nový |
| **16.6b** | Sdílený stav místnosti `startHere` (in-memory) + WS broadcast při načtení | 🟡 nový |
| **16.6b** | FE: tlačítka „Uložit hru" / „Načíst hru" + blok „Tady jste skončili" nad živým logem | 🟡 nový |

### Mimo scope

- **Taktická mapa / rozestavení tokenů** — autor explicitně nechce (pivot). Uložení je jen chat + scéna.
- **Soukromé/instancované Campy** — Camp zůstává veřejný, `RoomKey` je pevný enum (`hospoda|camp-1|camp-2|camp-3`); dynamické místnosti = velká přestavba, nestavíme.
- **Víc slotů uložených her per hráč** — záměrně **1** (přepisovatelný). Historie/pojmenované sloty = možné rozšíření.
- **Perzistence živého prostředí místnosti do DB** — zůstává in-memory (restart = reset na default, jako 4.2a). Do DB jdou jen uložené hry.
- **Načtení do konkrétní scény / re-injekce starých zpráv jako živých** — blok „kde jste skončili" je read-only kontext, ne živé zprávy (řešilo by TTL/ID/řazení — křehké).

---

## 3. Audit současného stavu (reuse)

**BE (`Projekt-ikaros/backend/src/modules/global-chat/`):**
- **Prostředí = in-memory na gateway** — `getEnvironment(room)` / `setEnvironment(room, dto)` ([global-chat.gateway.ts]), broadcast `chat:room:environment`. **Rozšíříme** in-memory stav o `startHere` a přidáme rotaci; default logika se posune z „fantasy/1" na „default žánr per room".
- **Cron infra existuje** — `@nestjs/schedule`, `@Cron(CronExpression...)` v [clean-messages.job.ts](../../../../Projekt-ikaros/backend/src/modules/global-chat/clean-messages.job.ts). Rotaci postavíme jako nový `@Cron('0 0,12 * * *')` job.
- **`SetRoomEnvironmentDto`** — `style ∈ {fantasy,scifi,mystic}` + `placeId /^([1-9]|1[0-9]|20)$/`. Reuse pro validaci.
- **`getMessages(key, userId, {before, limit})`** — už umí `limit` → snímek posledních N zpráv zadarmo.
- **`ROOM_STAFF_ROLES`** (controller) + `RolesGuard`/`@Roles` — write gate prostředí. Reuse pro override. `GuestOrMemberGuard` — host smí jen Hospodu (Camp mu 403).
- **TTL zpráv 1 h** — `MESSAGE_TTL_MS = HOUR_MS`, každá zpráva `expiresAt = now + 1h` (Mongo TTL index); `CleanMessagesJob` (každé 2 h) je jen záloha + Cloudinary úklid příloh. → uložení = záchrana logu před smazáním.
- **`ROOM_DEFS`** (service) drží `{ key, name }` globálních kanálů → sem míří rename názvů. **`CAMP_ROUTES`** (FE `campRooms.ts`) + **`CHAT_ROOMS`** (`IkarosLayout`) drží zobrazené názvy v nav.

**FE (`src/features/chat/`):**
- **`CampPage.tsx`** — `CampRoom`, `canEdit = STAFF_ROLES.includes(user.role)`, env přes React Query (`useRoomEnvironment`/`useSetRoomEnvironment`), WS `chat:room:environment`. **Upravíme** default a přidáme save/load + `startHere`.
- **`CampHeader.tsx`** — dnes 2 selecty (styl + lokace), read-only zámek bez oprávnění. **Upravíme:** žánr = štítek Campu; staff override; přidáme tlačítka hry.
- **`campPlaces.ts`** — `CAMP_PLACES[style]` (20 lokací/styl), `RoomStyle`, `findPlace`, `placeImageUrl`. Reuse; přidáme mapu `camp-N → default žánr` a helper náhodné lokace.
- **`campRooms.ts`** — `CAMP_ROUTES` (segment → room+name). Reuse.
- **`useGlobalChat.ts`** — query klíče per room, `chatQueryKeys`. Přidáme hooky save/get/load hry.
- **`MessageList`/`ChatRoom`** — render logu. Blok „Tady jste skončili" vložíme nad živý seznam.

---

## 4. Návrh řešení

### 4.1 Model žánru + rotace (16.6a)

**Default žánr per Camp** (nový kontrakt, jediný zdroj pravdy na BE, zrcadlo na FE):

```
camp-1 → fantasy   |   camp-2 → mystic (mystery)   |   camp-3 → scifi
```

- **Trvalé přerozdělení** („víc fantasy hráčů"): admin přepíše default žánr Campu (perzistentní, drží napořád). Malé nastavení — 3 hodnoty. → `GET/PUT /global-chat/rooms/defaults` (Admin+). Bez override = konstanta výše.
- **Auto-rotace (cron `0 0,12 * * *`):** pro každý Camp nastaví `env = { style: defaultGenre(room), placeId: náhodné 1..20 }` a `startHere = null`; broadcast `chat:room:environment` (+ event pro reset bloku). Tím se **každé okno** scéna vrátí na default žánr a náhodnou lokaci — a jakýkoli ruční override „dojede".
- **Ruční staff override** (`PUT .../environment`, STAFF): nastaví libovolný `style`+`placeId` in-memory. Žije jen do dalšího tiku cronu (max 12 h) — **žádný timestamp netrackujeme**.
- **Restart BE:** in-memory stav se ztratí → gateway vrátí `{ default žánr, placeId '1' }`; nejbližší okno srovná na náhodnou. Přijatelné (4.2a princip).

**FE `CampHeader`:**
- **Žánr** = **štítek Campu** (ikona + „Fantasy"/„Mystery"/„Sci-fi"), ne volný `<select>` pro hráče. Staff dostane přepínač žánru (override) — vizuálně odlišený jako „dočasná změna scény" (přerušovaný odznáček „⟳ dočasně").
- **Lokace** = select jen pro staff; hráč vidí jen název (read-only, „Scénu řídí správci", už existuje).

**Názvy (rename + dynamika):**
- Helper `genreLabel(style) → 'Fantasy camp' | 'Mystery camp' | 'Sci-fi camp'` (FE) + zrcadlo v BE `ROOM_DEFS` (default názvy).
- **Hlavička místnosti** (`roomName` do `ChatRoom`): odvozená z *aktuálního* žánru (env.style) → při override se přepne. `CampPage`/`CampRoom` název dopočítá z env, ne z `CAMP_ROUTES`.
- **Nav (`CHAT_ROOMS`, `IkarosLayout`) + `CAMP_ROUTES`:** statické default názvy (Fantasy/Mystery/Sci-fi camp) podle domovského žánru Campu — **nemění se** dočasným override (rozhodnutí A: menu = stabilní identita). Routy/klíče beze změny.

### 4.2 Uložení / načtení hry (16.6b)

**DB entita `CampSavedGame`** (nová kolekce, 1 doc per hráč — unikátní `userId`):

```ts
CampSavedGame {
  userId: string;            // unikát → 1 slot; save = upsert (přepíše)
  room: RoomKey;             // ze které místnosti uloženo (camp-1/2/3)
  style: RoomStyle;          // scéna v okamžiku uložení
  placeId: string;           // '1'..'20'
  messages: SavedChatLine[]; // snímek posledních N (viz níže) — NE živé reference
  savedAt: Date;
}
SavedChatLine {              // zobrazitelný snímek, ne cizí live entita
  senderName: string;        // characterName || senderName v okamžiku uložení
  content: string;
  color: string | null;
  createdAt: string;
}
```

- **N = 20** posledních zpráv (laditelné). „Aspoň pár posledních věcí z logu" (autor) — 20 je kotva, ne celý log. Systémové/whisper zprávy vynechat.
- Snímek je **immutable kopie** (jméno + text + barva + čas), aby se nerozbil, když se autor/postava později změní nebo smaže.

**BE API:**

| Metoda | Endpoint | Kdo | Co |
|---|---|---|---|
| POST | `/global-chat/rooms/:room/save-game` | přihlášený člen | snímek posledních N zpráv místnosti + aktuální env → upsert userova slotu |
| GET | `/global-chat/saved-game` | přihlášený člen | vrátí userovu uloženou hru nebo `null` |
| POST | `/global-chat/saved-game/load` | přihlášený člen | nastaví env místnosti (kde uživatel je) na uložené `style`+`placeId`, publikuje `startHere` (snímek zpráv) → WS broadcast; vrátí načtenou hru |
| DELETE | `/global-chat/saved-game` | přihlášený člen | smaže slot |

- **Načtení mění sdílené prostředí** — vědomá **výjimka z „hráči nemění scénu"**: hráč smí načíst **svou vlastní** kotvu (je to zahájení jeho hry, ne svévolné přepínání). Load je jinak dočasný override (dojede do dalšího okna jako každý override).
- **`startHere` = sdílený in-memory stav místnosti** (`{ messages, byUserName, at }`), broadcast při načtení → **vidí ho všichni přítomní** (nový příchozí ví, kde parta skončila = „přidat se / koukat"). Reset při dalším okně cronu nebo novém load.
- Host (anon) nemá save/load (member-only), jako upload (4.2a/15.8).

**FE:**
- **`useSavedGame()`** — `get` (query), `save`/`load`/`delete` (mutace, invalidace). WS `chat:room:startHere` (nebo rozšířený environment event) → `startHere` do query cache místnosti.
- **`CampHeader`**: tlačítka **„Uložit hru"** (💾, disabled když prázdný log) a **„Načíst hru"** (📂, disabled když nemám uloženou hru). Po uložení toast „Hra uložená".
- **Blok „Tady jste skončili"** = read-only sekce nad `MessageList` (odlišená hlavička + čas uložení + řádky snímku), když má místnost `startHere`. Vizuálně jasně oddělený od živých zpráv (šedší, „archivní"). Zavírací (×) lokálně.

### 4.3 Dotčené soubory

```
# BE — global-chat
backend/src/modules/global-chat/
├── global-chat.gateway.ts            # in-memory env: default žánr per room; + startHere stav; broadcast
├── global-chat.service.ts            # defaultGenre(room); náhodná lokace; snapshot posledních N; saved-game CRUD
├── global-chat.controller.ts         # + save/get/load/delete saved-game; + GET/PUT rooms/defaults (Admin)
├── camp-rotation.job.ts              # NOVÝ — @Cron('0 0,12 * * *') rotace lokace + reset startHere
├── schemas/camp-saved-game.schema.ts # NOVÝ — CampSavedGame (unique userId)
├── dto/save-game.dto.ts              # NOVÝ (room)
└── dto/camp-defaults.dto.ts          # NOVÝ (admin default žánr per room)

# FE — chat
src/features/chat/
├── pages/CampPage.tsx                # default žánr z campPlaces; startHere; save/load flow
├── components/CampHeader.tsx         # žánr = štítek Campu; staff override; tlačítka Uložit/Načíst hru
├── components/StartHereBlock.tsx     # NOVÝ — blok „Tady jste skončili" nad logem
├── components/ChatRoom.tsx / MessageList  # zapojení StartHereBlock
├── lib/campPlaces.ts                 # + CAMP_DEFAULT_GENRE (camp-N → RoomStyle) + randomPlaceId()
├── lib/types.ts                      # + CampSavedGame, SavedChatLine, StartHere; WS event typ
└── api/useGlobalChat.ts (+ useSavedGame.ts)  # hooky save/get/load/delete + WS startHere
```

### 4.4 mobil-desktop + funkce + nápověda

- **`mobil-desktop`:** štítek žánru + tlačítka hry v hlavičce Campu na mobilu (sbalení do sheetu „Scéna" jako dnes); blok „Tady jste skončili" na úzkém displeji.
- **`funkce`:** docs/funkce — Camp: zamčený žánr, auto-rotace scény, uložení/načtení hry (kdo smí, 1 slot).
- **`napoveda`:** sekce Camp — jak funguje střídání scén (12:00/00:00), že scénu mění správci, jak si uložit a načíst hru.

---

## 5. Bezpečnost (auth-leak-policy)

- **Změna scény (styl/lokace)** = STAFF only (`RolesGuard`/`@Roles`, dnešní gate). Hráč PUT environment → 403.
- **Default žánr** (`rooms/defaults`) = Admin+ (`AdminGuard`). Hráč/staff bez admin → 403.
- **Save/load/delete hry** = přihlášený **člen** (ne host); load smí měnit env **jen přes vlastní slot** (ne libovolné env) → není to obcházení staff gate. Host (anon) → 403 (member-only).
- **Snímek zpráv** v uložené hře respektuje, co uživatel v Campu reálně vidí (Camp je veřejný, whisper se do snímku nedává).
- **`startHere`** nese jen zobrazitelný snímek (jméno+text+barva+čas), žádné userId/PII navíc nad rámec toho, co je v živém logu.

---

## 6. Akceptační kritéria

1. Camp I/II/III mají zamčený default žánr (fantasy/mystery/sci-fi); hráč nevidí volný přepínač žánru, scéna je pro něj read-only.
2. Ve 12:00 a 00:00 se v každém Campu **sama změní lokace** na náhodnou (v rámci žánru) a `startHere` se vyresetuje; propíše se všem přítomným přes WS.
3. Staff ruční změna lokace/žánru drží **jen do dalšího okna**, pak se scéna vrátí na default žánr + náhodnou lokaci.
4. Admin umí přepsat default žánr Campu (trvalé přerozdělení); po dalším okně rotace respektuje nový default.
5. Hráč „Uložit hru" → uloží se snímek scény + posledních ~20 zpráv do jeho **jediného** slotu (další uložení přepíše).
6. Hráč „Načíst hru" → scéna Campu se přepne na uloženou (žánr+lokace) a nad živým logem se ukáže blok „Tady jste skončili" (těch ~20 zpráv, read-only); vidí ho všichni přítomní.
7. Načtení smí hráč jen ze **svého** slotu; nejde jím nastavit libovolné cizí env (není obcházení staff gate). Host (anon) save/load nemá (403).
8. Blok „Tady jste skončili" je jasně odlišený od živých zpráv a jde lokálně zavřít; zmizí i při dalším okně rotace.
9. Uložená hra **přežije restart BE** (DB); živé prostředí místnosti se po restartu resetuje na default (akceptováno).
10. Responsivní (`mobil-desktop`); FE `lint`/`lint:colors`/`tsc -b`/`build`/`test:run` ✓; BE `tsc`+`lint`+jest ✓.
11. Testy FE (default žánr per room, štítek vs staff override, save/load flow, StartHereBlock render) + BE (rotace cron logika, snapshot N, saved-game upsert 1-slot, load mění env + broadcast, auth 403 host/hráč).
12. `funkce` + `napoveda` + `roadmap2.md` (pivot) aktualizovány.

---

## 7. Test plán

**BE (Jest):** default žánr per room; náhodná lokace v rámci žánru; snapshot posledních N (vynechá whisper/system); `CampSavedGame` upsert = 1 slot (druhé save přepíše, ne přidá); load nastaví env + `startHere` + broadcast; auth (host 403, hráč PUT env 403, hráč load vlastní OK, admin defaults OK); rotace job přepíše env + reset startHere.
**FE (Vitest + RTL):** `campPlaces` — `CAMP_DEFAULT_GENRE` mapuje 3 Campy, `randomPlaceId` v rozsahu; `CampHeader` — hráč žánr read-only (štítek), staff override select; save tlačítko disabled u prázdného logu, load disabled bez slotu; `StartHereBlock` render + zavření; WS `startHere` → blok naskočí.
**Manuální smoke (2 účty):** staff změní lokaci → projeví se u druhého; hráč uloží+načte → scéna přepne u obou, blok naskočí; host nemá tlačítka hry.

---

## 8. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| Cron rotace přepíše scénu uprostřed běžící hry | Jistá (okno) | Přeruší atmosféru | Záměr featury (scéna žije); parta si hru uloží/načte; okna 2×/den jsou předvídatelná (12:00/00:00) |
| Načtení hry přepíše scénu ostatním ve veřejném Campu | Střední | Ruší cizí | Akceptováno autorem (veřejný prostor, „přidat se / koukat"); load = dočasný override do okna |
| In-memory env/startHere ztráta při restartu | Jistá | Scéna → default | Akceptováno (4.2a); uložené hry v DB přežijí |
| Snapshot drží smazaný obsah/jméno | Nízká | Zastaralý kontext | Snímek je immutable kopie (záměr „kde jsme skončili"), ne live; PII neroste |
| Whole-doc clobber saved-game (2 zařízení) | Nízká | Ztráta slotu | Upsert klíčovaný `userId` (idempotentní) |

**Rollback:** aditivní (nová kolekce + nový cron job + nová FE tlačítka/blok; úprava defaultu žánru). Revert commitu; `CampSavedGame` kolekce osiří (neškodí). CampHeader zpět na volný styl select.

---

## 9. Rozhodnutí autora (z dialogu 2026-07-05)

1. **Pivot:** uložení = **chatový log** (kdo co řekl), ne taktická scéna/rozestavení. ✅
2. **Žánr per Camp:** default I=fantasy, II=mystery, III=sci-fi; **není tvrdý zámek** — admin smí přerozdělit (víc fantasy) přes trvalý default. ✅
3. **Rotace:** náhodná lokace, **pevná okna 12:00 a 00:00**; ruční staff změna platí **do dalšího okna**, pak zpět na default. ✅
4. **Camp zůstává veřejný** — žádné soukromé instance; k běžící hře se veřejní hráči přidají / koukají. ✅
5. **Uložení = kotva, ne obnova session:** scéna + pár posledních zpráv („kde jsme skončili"), **1 slot per hráč**. ✅
6. **Načtení:** scéna se přepne na uloženou + blok „Tady jste skončili" nad živým logem; hráč smí načíst **svou** hru (výjimka z „hráči nemění scénu"). ✅
7. **Přejmenování** „Camp I./II./III." → „Fantasy/Mystery/Sci-fi camp"; interní klíče + routy beze změny. Když staff dočasně přehodí žánr, **název hlavičky se změní** (dynamický). ✅ (2026-07-05)
8. **Nav = stabilní domovský žánr** (varianta A) — menu se dočasným override nepřepisuje (jinak duplicitní názvy). Dynamika jen v hlavičce místnosti. ✅ (2026-07-05)
9. **Implementace:** BE jako celek (provázaný modul), FE paralelně přes agenty (odděleně od BE — [[feedback_no_mixed_be_fe_batch]]). ✅ (2026-07-05)

---

**Po schválení specu:** `frontend-design` návrh pro nové prvky (štítek žánru, tlačítka hry, blok „Tady jste skončili"), pak implementační plán `plan-16.6.md` (přesný file diff FE + BE), pak kód.
