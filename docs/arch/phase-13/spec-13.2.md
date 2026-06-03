# Spec 13.2 — Notifikační centrum

> Stav: **13.2 hotové** (2026-06-03). 13.2a = Souhrn chatů (`GET /chat/feed` +
> WS `chat:feed:bump`). 13.2b = Události (reuse Pošty — systémové zprávy,
> `inbox?system=true` + `systemUnread`; listener doplnil svět + přiřazení
> postavy) + Ke zpracování (reuse pending-actions, podmíněná rolí) + tab bar +
> složený badge. 13.2c = PWA push (manifest + vanilla SW `public/sw.js`,
> `usePush` VAPID flow, `PushToggle`) — **reálné doručení vyžaduje HTTPS/server,
> lokálně neověřitelné**. Nahrazuje původní roadmapní 13.2 „Push notifikace".

## 0. Geneze / proč odchylka od roadmapy

Roadmapa měla 13.2 = čistě PWA push (service worker, VAPID, manifest). Uživatel
ale chce **jedno místo, kde vidí dění z celé platformy relevantní pro něj** —
především **„veškeré zprávy v chatech ze všech jeho světů"**, dál schvalovací
dění a přiřazení postavy.

To je jiná featura než push transport. Push má smysl **navrch** hotového centra
(pošle stejné události i mimo appku) — proto se nezahazuje, jen odsouvá.

### Klíčové upřesnění (potvrzeno uživatelem)

- Chat feed chce **jako hráč / PJ**, ne jako admin/superadmin. Tedy **osobní
  agregace** zpráv ze světů, kde je členem — **ne** dohled nad cizími světy.
  Vidí jen to, na co má přístup i dnes (jen sesbírané na jedno místo) → žádný
  cross-world leak, žádná nová admin práva.

## 1. Cíl

Notifikační centrum = jedna obrazovka/drawer + badge v `IkarosLayout`, agregující
**dění relevantní pro přihlášeného uživatele jako příjemce** ze **dvou zdrojů**:

| Zdroj | Co | Mechanismus | Stav |
|---|---|---|---|
| **B. Souhrn chatů** | zprávy napříč kanály, kam mám přístup (mé světy, role hráč/PJ) | read-model: agregační endpoint + WS živě | **nové** |
| **C. Události** | co se stalo **mně**: postava přiřazena; **moje** žádost o svět / **můj** článek / diskuze / obrázek byly schváleny | **reuse `IkarosMessages` (Pošta) — systémové zprávy** (`senderId='system'`) | částečně existuje |

> **Rozhodnutí 2026-06-03 (varianta A):** Schválení článku/galerie/diskuze už
> dnes posílá autorovi **systémovou zprávu do Pošty** (`notifyUser` →
> `msgService.create` se `SYSTEM_SENDER`). Pilíř C proto **nezavádí nový
> `Notification` model** (zavrženo — duplicita), ale:
> 1. doplní systémovou zprávu i pro **schválení světa** (`world.access.approved`)
>    a **přiřazení postavy** (nový event) — aby i ty měly trvalý záznam;
> 2. záložka „Události" = **přehled systémových zpráv** (`senderId='system'`),
>    sdílí data s Poštou (jen filtr), žádné druhé úložiště.

### Pilíř A — podmíněná záložka „Ke zpracování" (upřesněno 2026-06-03)

Po ping-pongu ustáleno takto:

- **Záložka „Ke zpracování" = reuse `pending-actions`**, ale **podmíněná rolí**:
  zobrazí se **jen uživatelům, co mají co schvalovat** (PJ/PomocnyPJ, správci
  diskuzí/článků, admin) — prakticky `pending count > 0` resp. `byType` neprázdné.
- **Běžný hráč** bez schvalovacích práv záložku **nevidí** → jeho centrum =
  Chaty + Události.
- Je skoro zadarmo (data, badge i renderery už existují); pravopanelový
  `pending-actions` badge zůstává, centrum ho jen zrcadlí v záložce.
- Patří do **13.2b** (s pilířem C). 13.2a (chat feed) se jí netýká.

## 2. Architektonická rozhodnutí

1. **Chat se NEpersistuje jako notifikace.** Každá zpráva × N příjemců by
   zahltila DB. Pilíř B je **read-model** nad existujícími `chat_messages` +
   WS živé doručení (klient už dostává `chat:message` do `user:{id}` /
   `chat:{channelId}` roomů).
2. **Pilíř B kopíruje stávající chat access** — nesmí vrátit nic, co uživatel
   nevidí i dnes (visibility kanálu, whisper `visibleTo`, mentions). SSOT =
   stávající channel-access logika v `chat.service` (reuse, neduplikovat).
3. **Události (C) = nový lehký `Notification` model** (malý objem: events, ne
   chat). `{ userId, type, title, body, url, read, createdAt }`. Plněn
   `@OnEvent` listenery na vybrané doménové eventy.
4. **Push (13.2c) navrch** — až bude, jen přidá druhý „výstup" pro pilíř C
   (a volitelně mentions z B). Žádný přepis.

## 3. BE kontrakt (nové)

### 3a. Souhrn chatů (pilíř B)

- `GET /chat/feed?before=&limit=` → poslední zprávy napříč **mými přístupnými
  kanály** (všechny mé světy), seřazeno desc dle `_id`, paginace přes `before`.
  - Položka nese `worldId`, `worldName`, `channelId`, `channelName` (kvůli
    grupování ve FE) + standardní `ChatMessage`.
  - Access: server odvodí množinu kanálů z členství requestera + channel
    visibility (reuse). Nikdy nevrací cizí/nedostupné.
- WS: žádný nový event nutný — klient už dostává `chat:message` (user/channel
  room). Centrum jen poslouchá a invaliduje/prependuje feed.
- ⚠️ `chat-message.repository` má **explicitní `toEntity` whitelist** — nová pole
  (worldName/channelName) řešit v agregační vrstvě (lookup), ne v message
  mapperu.

### 3b. Události + Notification model (pilíř C)

- Nový modul `notifications`: schema `Notification` + repo + service +
  controller.
- `GET /notifications?before=&limit=` → mé notifikace desc.
- `GET /notifications/unread-count` → `{ count }` (pro badge).
- `POST /notifications/read` `{ ids?: string[] }` → mark-read (prázdné = vše).
- Listenery (`@OnEvent`) → `notifications.service.create(userId, payload)`:
  - `world.membership.changed` (postava přiřazena) → notifikace **hráči**:
    „Byla ti přiřazena postava … ve světě …". (Filtrovat jen na změnu
    `characterPath` z prázdna → hodnota; ne každou změnu členství.)
  - `world.access.approved` / `world.access.rejected` → **žadateli**.
  - article/gallery/discussion „approved" (dohledat přesné eventy v impl. plánu)
    → **autorovi**.
- WS: nový event `notification:new` do `user:{userId}` → FE invaliduje
  unread-count + feed. (Doplnit do `chat.gateway` nebo nového gateway; ověřit
  v `socket-contract` skillu + `docs/websocket-api.md`.)

## 4. FE architektura

Nový feature modul `src/features/notifications/`:

- `api/useChatFeed.ts` — TanStack Query (infinite/`before`), klíč
  `['chat-feed']`; WS listener `chat:message` → prepend/invalidate.
- `api/useNotifications.ts` — feed událostí (`/notifications`) + `useNotificationsUnread()`
  (`/notifications/unread-count`, WS `notification:new` invalidace) + `markRead` mutace.
- Centrum UI — **drawer/panel** otevíraný z headeru (ikona zvonku) se **dvěma
  záložkami**: „Chaty" (B) · „Události" (C).
  - Volba drawer (ne plná stránka): konzistentní s Poštou; rychlý přístup
    odkudkoli; funguje mobil i desktop.
- **Badge** v headeru = zvonek s počtem = `chat unread` + `notifications unread`.
  (Přesné složení dořešit v impl. plánu — ať se nezdvojuje s existující Pošta
  badge. `pending-actions` badge v pravém panelu zůstává oddělený.)
- Typy v `src/features/notifications/types.ts` zrcadlí BE (žádný DTO drift,
  ověřit `type-sync`).

## 5. Bezpečnost (auth-leak-policy)

- `GET /chat/feed`: vrací **jen** kanály, kam má requester přístup. Test: hráč
  světa A nesmí dostat zprávu ze světa B, kde není; whisper `visibleTo` se
  respektuje; ne-member dostane prázdno (ne 403 leak existence).
- `GET /notifications*`: jen vlastní (`userId == requester`).
- `auth-policy` skill po implementaci chráněných volání.

## 6. Responsive (base.md)

- Drawer: full-width sheet ≤768, postranní panel >1024. Záložky scrollovatelné.
- Zvonek v headeru viditelný i v mobilním layoutu (vedle Pošty).
- `mobil-desktop` audit po každém UI kroku.

## 7. Rozsah / sub-kroky (pořadí dle priority uživatele)

- **13.2a — Souhrn chatů (pilíř B):** BE `GET /chat/feed` (access-safe) + FE
  centrum shell (drawer + záložky) se záložkou „Chaty" + zvonek badge (zatím jen
  chat unread). *Uživatelova #1 priorita — ověřitelné lokálně hned.*
- **13.2b — Notifikační jádro (pilíře A + C):** BE `notifications` modul +
  listenery (přiřazení postavy, schválení) + WS `notification:new`; FE záložky
  „Ke zpracování" (reuse pending) + „Události"; badge složí všechny zdroje.
- **13.2c — PWA push (později):** `vite-plugin-pwa`, SW, VAPID subscribe,
  `notificationclick` deep-link; push navrch pilíře C. (Pův. roadmapní 13.2.)

Každý sub-krok je samostatně dokončitelný a funkční (žádné polotovary).

## 8. Mimo rozsah (vědomě)

- **Push transport** — viz 13.2c, vyžaduje HTTPS/server (uživatel teď neověří).
- **Mark-read pro chat feed** — chat má vlastní unread mechaniku per kanál;
  feed ji jen zobrazuje, nezavádí druhý read-stav (zváženo v impl. plánu).
- **Dohled nad cizími světy** (moderace) — vědomě NE; centrum je osobní.

## 9. Akceptační kritéria

- [ ] Zvonek v headeru s badge (chat unread) otevírá centrum (drawer), mobil i desktop.
- [ ] Záložka „Chaty": zprávy ze **všech mých světů**, žádná z cizích/nedostupných.
- [ ] Whisper/visibleTo respektováno; ne-member nedostane nic.
- [ ] Nová zpráva přiteče živě (WS) bez reloadu.
- [ ] (13.2b) Přiřazení postavy → událost hráči; schválení → událost autorovi/žadateli.
- [ ] (13.2b) Mark-read funguje; badge klesá.
- [ ] Žádný TS error (`tsc --noEmit`), vitest zelený; `auth-policy` + `mobil-desktop` + `socket-contract` projity.
