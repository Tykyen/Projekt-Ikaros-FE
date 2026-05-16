# Spec 4.2a — Rozcestí (roleplay chat `/chat/rozcesti`)

**Status:** ✅ Implementováno (2026-05-16)
**Rozsah:** FE (znovupoužití chat infry, 3 routy, styly/lokace) + BE (rozšíření `global-chat` o kanály)
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (BE), větev `feat/krok-4.2a-rozcesti`
**Velikost:** odhad ~14 FE souborů (~600 ř. nového + refaktor ChatRoom) + ~6 BE souborů (~120 ř.)
**Autor:** PJ + Claude
**Datum:** 2026-05-16
**Souvisí:** roadmapa `docs/roadmap-fe.md` (Fáze 4, krok 4.2), spec 4.1 (`spec-4.1.md`), BE `Projekt-ikaros/docs/websocket-api.md` §3 GlobalChatGateway

---

## 1. Cíl

Postavit **Rozcestí** — atmosférickou roleplay chat místnost na routě `/chat/rozcesti`,
`/chat/rozcesti2`, `/chat/rozcesti3` (Rozcestí I.–III.). Tři **nezávislé** místnosti
běžící současně, každá s vlastní historií a přítomnými. Místnost má **prostředí** —
zvolený styl (Fantasy / Sci-fi / Mystika) a v něm jednu z 20 **lokací**, jejíž
ilustrace tvoří pozadí chatu a jejíž slovní popis je dostupný v rozbalovacím panelu.
Roleplay bez kostek a mechanik — „hra na jeden večer".

Krok je rozdělen: **4.2a** = funkční Rozcestí (tento spec). **4.2b** = dotažení vazby
na profil postavy (viz §5).

---

## 2. Kontext / motivace

Krok 4.1 postavil Hospodu — jeden globální kanál. Sidebar už má položky Rozcestí I.–III.,
ale `disabled` s popiskem „Brzy — krok 4.2". Routy `/chat/rozcesti*` neexistují, BE zná
jen jeden globální kanál. Starý Matrix měl Rozcestí funkční (SignalR), odtud migrujeme
ilustrace, mapování lokací a slovní popisy — **ne kód** (jiný stack).

Rozdíl proti Hospodě: Hospoda je 1 nekonečná místnost, Rozcestí jsou 3 oddělené scény
s vizuálním prostředím. Roleplay potřebuje, aby všichni v místnosti viděli **stejné
místo** — proto je styl i lokace stav sdílený přes WS, ne lokální volba.

---

## 3. Audit současného stavu

### 3.1 Backend — `Projekt-ikaros`

- `modules/global-chat/` — `GlobalChatGateway` + `Service` + `Controller`, prefix
  `/api/global-chat`. Zná **jeden** globální `channelId` (Hospoda).
- WS eventy 4.1: `chat:hospoda:join` / `chat:hospoda:leave` / `ikaros:whisper` (→ BE),
  `chat:presence` / `chat:message` / `chat:message:deleted` (BE →).
- `AppGateway` — `room:join` / `room:leave`, room pattern `^[a-z]+:[a-zA-Z0-9]+$`.
- `chatmessages` schéma — `channelId` pole už existuje (zprávy se filtrují dle něj),
  `color` uvolněn na volný `String` (oprava z 4.1 §10).
- **Chybí:** evidence víc globálních kanálů, stav prostředí místnosti (styl + lokace),
  WS event pro změnu prostředí.

### 3.2 Frontend — `Projekt-ikaros-FE`

- [`router.tsx:152`](../../../src/app/router.tsx) — route `chat` (Hospoda), `requireAuth`. Žádné `chat/rozcesti*`.
- [`ChatRoom.tsx`](../../../src/features/chat/components/ChatRoom.tsx) — kompozice chatu, hardcoded `ROOM_NAME = 'Interdimenzionální hospoda'`, eventy `chat:hospoda:*`. **Není parametrizovaný** na místnost.
- `MessageList`, `MessageItem`, `ChatInput`, `UserList`, `TypingIndicator` — komponenty zprávy/lišty, vázané na props → znovupoužitelné.
- [`useGlobalChat.ts`](../../../src/features/chat/api/useGlobalChat.ts) — React Query hooky, dnes bez parametru kanálu.
- [`IkarosLayout.tsx:86-96`](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx) — `CHAT_ROOMS`, Rozcestí I.–III. `disabled: true` + badge „Brzy".
- [`CharacterSection.tsx`](../../../src/features/profile/components/CharacterSection.tsx) — „Postava v Rozcestí": `characterName` (≤64 zn.), `characterBio` (≤1000 zn.), avatar postavy. **Už existuje** — 4.2a ji jen čte.

### 3.3 Migrovaná aktiva (hotová)

- `public/images/rozcesti/` — **60 ilustrací `.webp`**: 20 fantasy (root), 20 v `mystic/`, 20 v `scifi/`.
- Starý Matrix `pages/Ikaros/IkarosChat.tsx` — mapování `ROZCESTI_PLACES` (id → název → soubor) a `descriptions/{fantasy,scifi,mystic}.ts` (60 popisů, klíče `'1'`–`'20'`). Migrují se jako data, ne kód.

### 3.4 Nesrovnalosti

| # | Nález | Návrh řešení |
|---|---|---|
| 1 | Roadmapa: „pole Postava v Rozcestí ≤200 zn." do Osobní karty. `CharacterSection` už pole postavy má (`characterName` + `characterBio` 1000 zn.). | **Rozhodnuto autorem:** žádné nové pole. Rozcestí čte existující `characterName`/`characterBio`. Limit 200 z roadmapy se ruší. |
| 2 | Starý kód: styl synchronizovaný (`SetRoomStyle`), lokace **lokální** (jen `useState`). Roadmapa zmiňuje „synchronizace stylu". | **Rozhodnuto autorem:** synchronizovat styl **i lokaci** (sdílený stav místnosti) — roleplay scéna je pro všechny stejná. |
| 3 | Obrázky ve starém kódu `.png`, migrované jsou `.webp`. Názvy souborů jinak sedí. | Mapování lokací přepsat na `.webp`; fantasy v rootu, scifi/mystic v podsložkách. |
| 4 | WS eventy 4.1 jsou pojmenované natvrdo `chat:hospoda:*`. | **Rozhodnuto autorem:** NEpřejmenovávat. Hospoda zůstává na `chat:hospoda:*` beze změny. Rozcestí dostane vlastní sadu `chat:room:*` (kanál-agnostickou) — viz §4.5. |

---

## 4. Návrh řešení

### 4.1 Kanály a routy

| Route | Kanál (`channelId`) | Sidebar |
|---|---|---|
| `/chat` | `hospoda` (beze změny) | Hospoda |
| `/chat/rozcesti` | `rozcesti-1` | Rozcestí I. |
| `/chat/rozcesti2` | `rozcesti-2` | Rozcestí II. |
| `/chat/rozcesti3` | `rozcesti-3` | Rozcestí III. |

Všechny `requireAuth`. Tři Rozcestí jsou nezávislá — vlastní historie zpráv (filtr dle
`channelId`), vlastní seznam přítomných, vlastní stav prostředí.

### 4.2 Struktura souborů (FE)

```
src/features/chat/
├── pages/
│   ├── ChatPage.tsx           # beze změny (Hospoda)
│   └── RozcestiPage.tsx       # NOVÉ — čte :roomId z routy, předá channelId + meta
├── components/
│   ├── ChatRoom.tsx           # REFAKTOR — parametrizace props (channelId, roomName, environment?)
│   ├── RozcestiHeader.tsx     # NOVÉ — výběr stylu + lokace + tlačítko 📖
│   ├── RozcestiDescription.tsx# NOVÉ — rozbalovací panel se slovním popisem lokace
│   └── (MessageList, MessageItem, ChatInput, UserList, TypingIndicator — beze změny)
├── api/
│   └── useGlobalChat.ts       # REFAKTOR — hooky přijmou channelId
├── lib/
│   ├── rozcestiPlaces.ts      # NOVÉ — mapování 60 lokací (id, název, soubor, styl)
│   └── rozcestiDescriptions/  # NOVÉ — fantasy.ts / scifi.ts / mystic.ts (migrované popisy)
└── *.module.css
```

### 4.3 Stav prostředí místnosti

Každé Rozcestí má **prostředí** = `{ style: 'fantasy'|'scifi'|'mystic', placeId: '1'..'20' }`.
Je to **stav místnosti**, ne uživatele — sdílený přes WS všem přítomným.

- Při vstupu (`join`) BE pošle aktuální prostředí v room-info / odpovědi.
- Změna v záhlaví (`RozcestiHeader`) → `emit('chat:room:environment', { channelId, style, placeId })`.
- BE prostředí uloží (in-memory na kanál) a broadcastne `chat:room:environment` všem v `chat:{channelId}`.
- FE na event přepne pozadí + nabídku lokací.
- Default nové/prázdné místnosti: `fantasy` / `1`.

**Kdo smí měnit prostředí (rozhodnuto autorem):** jen uživatel s platformovou funkcí —
globální role `Superadmin`, `Admin`, `SpravceClanku`, `SpravceGalerie`, `SpravceDiskuzi`.
Běžný `Uživatel` selecty vidí jako read-only (disabled). Gating na FE dle
`currentUser.role`; BE handler `chat:room:environment` ověří roli a změnu od
neoprávněného odmítne (autorita je BE, FE disabled je jen UX).

### 4.4 Vzhled (před impl. plánem proběhne `frontend-design` audit)

- Pozadí chatu = ilustrace aktivní lokace, ztmavená gradient overlayem (čitelnost zpráv) — princip ze starého Matrixu, ale přes naše `--theme-*` tokeny.
- Záhlaví: název místnosti + 2 selecty (styl, lokace) + tlačítko 📖. Počet přítomných.
- 📖 panel: rozbalovací, slovní popis lokace, serif, `--theme-surface-soft`.
- Zprávy: stejný „řádkový deník" jako Hospoda (čas · jméno · obsah), seskupování, whisper odlišení — reuse `MessageList`/`MessageItem`.
- Mobil: selecty stylu/lokace se sbalí, „přítomní" do chipu/sheetu (jako Hospoda). Ověří `mobil-desktop`.

### 4.5 Backend — `Projekt-ikaros`

1. **Víc kanálů.** `GlobalChatService` — registr povolených `channelId`
   (`hospoda`, `rozcesti-1/2/3`). REST a WS operují nad `channelId` z requestu.
   `room-info` / `messages` přijmou `channelId` (query / param).
2. **WS eventy pro Rozcestí — nová sada, Hospoda beze změny.** Hospoda nadále jede
   na `chat:hospoda:join/leave`. Rozcestí dostane kanál-agnostické `chat:room:join/leave`
   s payloadem `{ channelId, username, userId }`. Obě sady volají **stejnou** service
   logiku (presence, room join) — liší se jen názvem eventu a tím, že `chat:room:*`
   nese `channelId`. `chat:hospoda:*` kód 4.1 se nedotýká.
3. **Prostředí místnosti.** Nový handler `chat:room:environment` (in-memory mapa
   `channelId → { style, placeId }`); ověří roli odesílatele, uloží, broadcastne
   stejnojmenným eventem. Hospoda prostředí nemá.
4. **`websocket-api.md` §3** — zaktualizovat o nové eventy + Rozcestí kanály.
5. **Whisper** — beze změny, funguje per `user:{id}`.

> Žádná DB migrace. Prostředí je in-memory (přežije restart resetem na default — pro
> „hru na jeden večer" akceptovatelné). Zprávy už `channelId` mají.

### 4.6 Migrace dat lokací

`rozcestiPlaces.ts` — z `ROZCESTI_PLACES` starého Matrixu, přípony `.png`→`.webp`,
fantasy bez prefixu cesty, scifi/mystic do podsložek. `rozcestiDescriptions/*.ts` —
doslovná kopie 60 popisů ze starého `descriptions/{fantasy,scifi,mystic}.ts` (klíče
`'1'`–`'20'`). Ověří se, že každý `placeId` má obrázek i popis (60/60).

---

### 4.7 Design (výstup `frontend-design` auditu)

Koncept: **„divadelní scéna"**. Hospoda je krčma — jeden pokoj. Rozcestí je jeviště,
na kterém se mění kulisy. Tomu odpovídají rozhodnutí:

- **Ilustrace = scéna, ne dekorace v panelu.** Obrázek lokace je pozadím **celé**
  místnosti (`.room`), ne uvnitř panelu zpráv. Dvojitý overlay: vinětový gradient
  (čitelnost zpráv) + jemný grain/noise (pergamenová textura Ikara). Změna lokace =
  **crossfade 400 ms**, scéna „přejede" jako stmívačka — ne tvrdý cut.
- **Panely jsou závoj nad scénou.** Sloupec zpráv i „přítomní" mají poloprůhledné
  pozadí (`color-mix(--theme-surface ~80%, transparent)` + `backdrop-filter: blur`),
  aby ilustrace prosvítala a držela atmosféru. Čitelnost zpráv má přednost — kontrast
  textu se nesmí propadnout pod scénou.
- **Záhlaví = cedule, ne syrové `<select>`.** Název místnosti vlevo (`--font-display`
  Cinzel). Ovladače scény vpravo jako dvě stylizované „kartuše" (rámované štítky na
  `--theme-surface-strong`, ne nativní select look) — styl s ikonou (🏰 Fantasy /
  🚀 Sci-fi / 🔮 Mystika) a lokace. 📖 jako pečeť/knoflík, aktivní stav zvýrazněn.
- **Read-only pro běžného `Uživatele`.** Kartuše bez oprávnění = „zamčená cedule":
  ztlumená, ikona zámku, tooltip „Prostředí scény mění správci". Žádné disabled-šedé
  nativní selecty.
- **📖 panel = accordion shora.** Rozbalí se pod záhlavím (ne modal), slovní popis
  `--font-body` serif, `--leading-loose`, `max-width ~64ch` pro čitelnost. Animace
  `max-height`+`opacity` ~240 ms.
- **3 styly = 3 nálady, jeden layout.** UI se per styl **nepřebarvuje** — drží
  `--theme-*` aktivního platformového theme. Jediná odchylka: tint vinětového overlaye
  se jemně posune (fantasy = teplá sépie, sci-fi = chladná ocel, mystika = fialovo-šedá).
  Tint overlaye, ne tokeny.
- **Motion vstupu:** scéna fade-in ~300 ms, pak zprávy stagger (reuse Hospoda).
- **Mobil:** ovladače scény se sbalí do tlačítka „Scéna" → sheet (jako „přítomní");
  📖 panel přes celou šířku. Ověří `mobil-desktop`.

## 5. Out of scope (→ 4.2b / později)

- **4.2b:** vizuální napojení postavy z profilu do Rozcestí — zobrazení
  `characterName`/`characterBio` u uživatele v `UserList` (tooltip / sheet „karta postavy").
  Není v 4.2a, protože vyžaduje, aby BE presence nesla i data postavy.
- Perzistence prostředí místnosti do DB (zůstává in-memory).
- Reply, reakce, přílohy — krok 4.3.
- Infinite scroll do historie.
- Vlastní lokace / nahrávání ilustrací uživateli.
- Privátní/zamčené Rozcestí, kapacita místnosti, vyhazování hráčů.

---

## 6. Acceptance kritéria

1. `/chat/rozcesti`, `/chat/rozcesti2`, `/chat/rozcesti3` zobrazí Rozcestí I.–III.
2. Tři místnosti jsou nezávislé — zpráva v jedné se neobjeví v jiné; oddělené seznamy přítomných.
3. Záhlaví umí přepnout styl (Fantasy/Sci-fi/Mystika) a lokaci (20 na styl).
4. Změna stylu/lokace se přes WS propíše všem přítomným v místnosti (sdílené prostředí).
    Selecty smí ovládat jen role s platformovou funkcí; běžný `Uživatel` je má read-only.
5. Pozadí chatu odpovídá zvolené lokaci (ilustrace `.webp`); 📖 panel ukáže slovní popis.
6. Všech 60 lokací má funkční obrázek i popis.
7. Veřejné zprávy, whisper, presence, typing fungují v Rozcestí stejně jako v Hospodě.
8. Sidebar: Rozcestí I.–III. už nejsou `disabled`, vedou na správné routy, badge „Brzy" pryč.
9. Chat respektuje aktivní platformový theme (tokeny `--theme-*`).
10. Funguje na mobilu i desktopu (ověří `mobil-desktop`).
11. Hospoda (`/chat`) funguje beze změny i po refaktoru `ChatRoom` / WS eventů.
12. Nápověda (`/ikaros/napoveda`) aktualizována o sekci Rozcestí.

---

## 7. Test plán

**FE (Vitest + RTL):**
- `rozcestiPlaces.test.ts` — 60 lokací, každá má obrázek (cesta) i popis; styly mají po 20.
- `RozcestiHeader.test.tsx` — změna stylu resetuje lokaci na `1`, emituje WS event.
- `RozcestiPage.test.tsx` — `:roomId` → správný `channelId` + meta; neznámé `roomId` → fallback/404.
- `ChatRoom.test.tsx` — rozšířit o parametrizovaný režim (channelId, environment).

**BE (Jest):**
- `global-chat.service.spec.ts` — registr kanálů, zprávy filtrované dle `channelId`.
- gateway test — `chat:room:environment` broadcast; `chat:room:join` s `channelId`.

**Manuální smoke (2 účty / 2 prohlížeče):**
- Vstup do Rozcestí I. ze 2 účtů; změna lokace u jednoho se projeví u druhého.
- Izolace: zpráva v Rozcestí I. není v Rozcestí II. ani v Hospodě.
- Whisper, typing, presence; theme switch; mobil 375/768/1440.
- Regrese Hospody.

---

## 8. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| Refaktor WS eventů (`chat:hospoda:*` → `chat:room:*`) rozbije Hospodu | Stř. | Regrese 4.1 | Smoke Hospody v AC #11; varianta s aliasem starých názvů |
| In-memory prostředí se ztratí při restartu BE | Jistá | Místnost spadne na default | Akceptováno — „hra na jeden večer", default fantasy/1 |
| `ChatRoom` refaktor zavleče regresi do zpráv/whisper | Stř. | UX | Komponenty zpráv (`MessageList`…) zůstávají beze změny; mění se jen kompozice |
| Chybějící obrázek/popis u některé lokace | Nízká | Prázdné pozadí/panel | Test `rozcestiPlaces.test.ts` ověří 60/60 |

**Rollback:** revert větve `feat/krok-4.2a-rozcesti`; sidebar zpět na `disabled`. Žádná migrace dat.

---

## 9. Rozhodnutí autora

1. **Sdílené prostředí:** synchronizovat styl **i lokaci** přes WS — všichni v místnosti
   vidí stejnou scénu. ✅
2. **Kdo smí měnit prostředí:** jen uživatel s platformovou funkcí — `Superadmin`,
   `Admin`, `SpravceClanku`, `SpravceGalerie`, `SpravceDiskuzi`. Běžný `Uživatel` ne. ✅
3. **WS eventy:** `chat:hospoda:*` se NEpřejmenovává. Rozcestí dostane vlastní sadu
   `chat:room:*`, Hospoda zůstává beze změny. ✅

---

**Po schválení specu:** spustím `frontend-design` audit (vzhled Rozcestí — záhlaví,
pozadí, 📖 panel), pak napíšu implementační plán `plan-4.2a.md` (přesný file diff FE + BE).
