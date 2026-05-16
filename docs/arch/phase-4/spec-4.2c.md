# Spec 4.2c — Chat: presence & přítomnost

Vylepšení presence pro Hospodu i Rozcestí. Spojuje původní side-task „self-include"
(uživatel se po vstupu hned vidí v seznamu) s balíkem požadavků na příchod/odchod,
počty v navigaci a auto-odhlášení po nečinnosti.

## Kontext (co už existuje)

- BE `GlobalChatGateway` — `connectedUsers: Map<socketId, {lastSeen, username, userId, room}>`.
- Join/leave: `registerPresence` / `unregisterPresence` → broadcast `chat:presence`
  přes `client.to(channel)` (= všem v místnosti **kromě** odesílatele).
- `room-info` REST vrací `channelId` + `getPresence(room)`.
- FE `ChatRoom` — `handlePresence` tvoří systémové hlášky „X vstupuje/odchází do místnosti".
- `CleanupInactiveUsersJob` — `@Cron(EVERY_HOUR)`, threshold 60 min, volá
  `cleanupInactive` → `socket.disconnect(true)` + smaže presence.

## §1 — Self-include (původní side-task)

Joinera BE zaeviduje až po jeho `room:join`, ale `room-info` REST se na FE
stáhne dřív (FE z něj bere `channelId`). Joiner se proto v seznamu neobjeví
do refreshe.

**Řešení (FE):** `ChatRoom` — v `users` memo přidat aktuálního uživatele, pokud
v seznamu chybí. Logicky je přítomný od mountu místnosti.

## §2 — Tlačítko „Odejít"

**FE only.** V hlavičce `ChatRoom` (vedle počtu Přítomní) tlačítko „Odejít".
Klik → navigace na `/` (Úvodník). Leave se emitne sám — odnavigování odmountuje
`ChatRoom`, cleanup effect už `chat:*:leave` posílá. Žádná BE změna.

Mobil: tlačítko jen ikona (bez popisku), aby se hlavička nepřeplnila.

## §3 — Narativní oznámení příchodu/odchodu

**FE only.** `handlePresence` generuje hlášku podle `room`. Texty v novém
lib helperu `lib/presenceMessages.ts` (`presenceLine(room, action, name)`).

Návrh textů (k doladění v review):

| | Příchod | Odchod |
|---|---|---|
| Hospoda | `🍺 Dveře krčmy zavrzaly — vchází {jméno}.` | `{jméno} dopíjí a opouští krčmu.` |
| Rozcestí | `Na rozcestí se objevuje {jméno}.` | `{jméno} se vydává dál a mizí v dáli.` |

⚠️ Joiner svou *vlastní* příchozí hlášku nevidí (BE `client.to()` ji posílá jen
ostatním). To je v pořádku — vlastní příchod si uvědomuje sám. §1 řeší jen
seznam, ne hlášku.

## §4 — Počet lidí v levém nav (per místnost)

Počet přítomných u položek Hospoda / Rozcestí I.–III. v sidebaru, živě.

**Problém:** počet se dnes drží per-channel. Aby ho viděl i člověk mimo
místnost (v nav), musí ho BE broadcastovat **globálně**.

**BE:**
- Nový WS event `chat:rooms:presence` — payload `{ [room]: number }` pro
  všechny místnosti. Broadcast `server.emit(...)` (všem socketům) po každém
  `registerPresence` / `unregisterPresence` / cleanup.
- Nový REST `GET /global-chat/rooms/presence` → stejný objekt (initial load).

**FE:**
- Hook `useRoomPresenceCounts` — REST seed + `chat:rooms:presence` WS update.
- `IkarosLayout` `SidebarContent` — u každé položky `CHAT_ROOMS` badge s počtem
  (reuse `s.navItemBadge`). Nula = badge skrytý.

## §5 — Auto-odhlášení po 60 min nečinnosti

Měřeno **od přítomnosti** (otevřená/aktivní záložka), ne od psaní → potřeba
heartbeat z FE.

**FE:**
- `ChatRoom` — `setInterval` posílá `chat:heartbeat` co 5 min, dokud je
  místnost otevřená. Zavřená/uspaná záložka heartbeat zastaví → po 60 min
  cleanup zabere.
- Po vlastním odhlášení (`chat:presence` leave s mým `userId`) `ChatRoom`
  zobrazí překryvný stav „Byl jsi odhlášen pro neaktivitu" + tlačítko
  „Vrátit se" (znovu joinuje).

**BE:**
- Nový `@SubscribeMessage('chat:heartbeat')` → aktualizuje `lastSeen` záznamu
  socketu.
- `cleanupInactive` — **přestat odpojovat socket** (`socket.disconnect(true)`).
  ⚠️ Socket je sdílený celou aplikací (mail, online presence, friendships) —
  jeho shození kvůli chat-nečinnosti shodí i tyto funkce. Nově jen: smazat
  presence záznam + broadcast `chat:presence` leave + `chat:rooms:presence`.
- `CleanupInactiveUsersJob` cron `EVERY_HOUR` → `EVERY_5_MINUTES` (jinak se
  odpojení rozjede na 60–120 min místo ~60–65 min).

## Nalezené dluhy (mimo scope, řeší skill `dluh`)

- `IkarosLayout` „Chat (N)" — `N` je počet **nepřečtené pošty**
  (`useUnreadCount`), ne chatu. Matoucí. (§4 přidá per-místnost počty, ale
  nadpis sekce neopravuje.)

## Mimo scope

- Krok 4.2b (karta postavy v presence) — samostatný krok.
- `lastSeen` refresh při psaní zprávy — heartbeat (§5) pokrývá nečinnost
  dostatečně, extra refresh při zprávě není potřeba.

## Responsive

- §2 tlačítko: desktop ikona+popisek, mobil jen ikona.
- §4 badge v nav: drawer i desktop sidebar (stejný `SidebarContent`).
- Po implementaci ověřit skillem `mobil-desktop`.

## Testy

- BE: `chat:heartbeat` aktualizuje `lastSeen`; `cleanupInactive` neodpojuje
  socket; `chat:rooms:presence` broadcast po join/leave; `rooms/presence` REST.
- FE: `presenceLine` texty per room/action; self-include v `users`;
  `useRoomPresenceCounts` seed + update.

## Stav

- [x] Schváleno
- [x] Implementováno (2026-05-16)
