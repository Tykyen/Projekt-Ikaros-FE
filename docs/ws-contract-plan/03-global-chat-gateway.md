# 03 — Globální chat (GlobalChatGateway)

Hospoda + Rozcestí I–III. Specifikum: gateway **nemá `handleConnection`** — presence se registruje výhradně přes `@SubscribeMessage` joiny, a **identita (`userId`, `username`) přichází z klientského payloadu, ne z JWT**. To je největší odlišnost od world chatu a hlavní bezpečnostní osa této oblasti.

**BE:** `modules/global-chat/global-chat.gateway.ts`, `global-chat.service.ts`
**FE:** `features/chat/components/ChatRoom.tsx`, `api/useGlobalChat.ts`, `api/usePresenceHeartbeat.ts`, `pages/RozcestiPage.tsx`

---

## A. Presence join/leave — identita z payloadu 🔴

> `chat:hospoda:join { username, userId }` a `chat:room:join { room, username, userId }` berou identitu z payloadu. Tolerantní handshake + payloadová identita = teoretický spoofing presence (přihlásit se jako cizí jméno). Blast radius nízký (jen presence/whisper směrování), ale musí být vědomě potvrzeno.

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| GCH-01 | `chat:hospoda:join { username, userId }` — `userId` z payloadu se použije pro join `user:{userId}` roomu. **Tím si klient sám určuje, do kterého per-user roomu vstoupí** → mohl by odposlouchávat cizí whispery zadáním cizího userId. Ověřit, zda BE validuje `userId` proti JWT (pokud token je), nebo zda je to otevřený vektor `[auto]` | `AU` `LK` | M4 | 🐛🔴 W-10 |
| GCH-02 | `chat:room:join { room, username, userId }` — `room` mimo `RoomKey` (`hospoda`/`rozcesti-1..3`) se ignoruje. Ověřit whitelist (nelze joinnout libovolný string jako místnost) `[auto]` | `AU` | M3 | ✅L1 |
| GCH-03 | Multi-room (4.2d): jeden socket přítomný ve víc místnostech zároveň; per-socket `PresenceRecord.rooms: Set<RoomKey>`. Ověřit, že leave z jedné místnosti neodebere presence z ostatních `[auto]` | `LC` | M3 | ✅L1 |
| GCH-04 | `chat:presence` payload parita: BE posílá `{ userId?, username, avatarUrl?, characterName?, characterAvatarUrl?, action, reason? }`. FE `ChatRoom:238` to konzumuje. Ověřit, že `reason` (`timeout`/`disconnect`/`explicit`) FE rozlišuje (timeout → overlay auto-odhlášení) `[auto]` | `PL` | M2 | ✅L1 |
| GCH-05 | Příchod/odchod se ukládá i jako systémová zpráva (`isSystem:true`, TTL 1 h) doručená běžným `chat:message` → vidí ji i pozdější příchozí. Ověřit, že systémová zpráva nese `isSystem` a FE ji renderuje odlišně `[auto]` | `PL` | M1 | ✅L1 |

> **Výsledek A — NÁLEZ W-10 (VYSOKÁ, leak privátních zpráv):** `registerPresence` joinuje `client.join(\`user:${userId}\`)` z **payloadového** `userId` ([global-chat.gateway.ts:262](../../../Projekt-ikaros/backend/src/modules/global-chat/global-chat.gateway.ts#L262)), bez ověření proti JWT. Útočník pošle cizí `userId` → vstoupí do cizího `user:{id}` roomu → dostává **whispery, poštu, friend eventy, unread, transfery** oběti. `room` whitelist (`isRoomKey`) ✅ je v pořádku, ale `userId` join je díra. **Fix: joinnout `user:{client.data.userId}` z JWT, ne z payloadu.**

---

## B. Heartbeat & auto-odhlášení

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| GCH-06 | `chat:heartbeat` (FE `usePresenceHeartbeat:18`, á 5 min) bez payloadu — BE obnoví `lastSeen` socketu. Ověřit, že BE handler `{}` payload toleruje (žádná destrukturace, co by spadla na undefined) `[auto]` | `PL` | M1 | ✅L1 |
| GCH-07 | Cron cleanup á 5 min odebere socket s `lastSeen` > 60 min → `chat:presence leave reason:'timeout'` + `chat:rooms:presence`. Socket se **neodpojuje** (sdílený). Ověřit, že timeout neshodí celou app, jen presence `[auto]` | `LC` | M3 | ✅L1 |
| GCH-08 | Opuštění stránky **neodhlašuje** z místnosti (jen explicit leave / 60min timeout / disconnect socketu). Ověřit, že navigace pryč nevolá leave (úmyslné — multi-room persistence) `[auto]` | `LC` | M1 | ✅L1 |

---

## C. Whisper — `ikaros:whisper`

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| GCH-09 | `ikaros:whisper { toUserId, content?, color?, room?, replyToId?, attachments? }` — deleguje `service.sendWhisper()`. Ověřit, že emit jde **jen** do `user:{toUserId}` a `user:{odesílatel}` roomů (ne do `chat:{room}`) → nikdo třetí whisper nevidí `[auto]` | `RM` `LK` | M3 | ✅L1 |
| GCH-10 | **N-31:** whisper jde přes `user:{id}` room, ne přes `chat:{channelId}`. FE musí filtrovat dle `channelId`/`room`, aby se whisper nezobrazil ve špatně otevřené místnosti. Ověřit FE filtr (`ChatRoom`) `[auto]` | `PL` `RM` | M2 | ✅L2 |
| GCH-11 | `content` smí být prázdné, má-li whisper `attachments` (4.3b). Ověřit, že BE nevyžaduje content při příloze a FE to odešle `[auto]` | `PL` | M3 | ✅L1 |
| GCH-12 | `attachments` musí pocházet z `POST /global-chat/upload` (BE ověří doménu Cloudinary + folder `global-chat/`). Ověřit, že whisper s podvrženou cizí URL přílohy se odmítne `[auto]` | `AU` `LK` | M4 | ✅L1 |
| GCH-13 | `replyToId` (4.3a) — odkaz na zprávu; ověřit, že BE validuje existenci/scope (nelze odpovědět na zprávu z cizí místnosti) `[auto]` | `PL` | M3 | ⚠️ |

> **Výsledek C:** Whisper směrování N-31 ✅ — jde do `user:{id}` roomů účastníků (ne `chat:{room}`), FE filtruje. **Pozn. k W-10:** whisper leak nehrozí *legitimnímu* třetímu, ALE útočník přes W-10 (join cizího `user:{id}`) whispery **odposlechne** — proto je W-10 vysoká. `replyToId` scope validace `⚠️` k doložení.

---

## D. Reakce — `chat:reaction:toggle`

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| GCH-14 | `chat:reaction:toggle { room?, messageId, emoji }` → `service.toggleReaction()`; druhá stejná reakce odebere. `emoji` max 16 znaků. Ověřit limit a toggle idempotenci `[auto]` | `PL` | M3 | ✅L1 |
| GCH-15 | `chat:message:reaction` payload `{ messageId, channelId, reactions: Record<emoji, userId[]> }`. FE `ChatRoom:237` patchuje reakce. Round-trip parita `reactions` mapy `[auto]` | `PL` | M2 | ✅L1 |
| GCH-16 | **Whisper reakce leak:** u whisperu smí reagovat jen účastník a `chat:message:reaction` jde jen do `user:{id}` účastníků (ne do `chat:{room}`). Ověřit, že reakce na whisper neleakne třetí straně `[auto]` | `RM` `LK` | M3 | ✅L2 |

> **Výsledek D:** Reakce ✅ — `chat:message:reaction` větví whisper (`visibleTo` → `user:{id}` účastníků) vs veřejná (`chat:{channelId}`), [global-chat.gateway.ts:443-448](../../../Projekt-ikaros/backend/src/modules/global-chat/global-chat.gateway.ts#L443). Stejná W-10 výhrada (útočník v cizím user roomu vidí i reakce na whispery).

---

## E. Counts & prostředí

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| GCH-17 | `chat:rooms:presence` (`Record<RoomKey, number>`) broadcast **všem** po každém join/leave/cleanup; FE `useGlobalChat:71` plní odznaky v navigaci. **N-30:** initial stav přes REST `GET /rooms/presence` má `JwtAuthGuard` → FE volá jen pro přihlášené (jinak 401 spam). Ověřit, že broadcast i REST jsou konzistentní `[auto]` | `PL` `AU` | M3 | ✅L2 |
| GCH-18 | `chat:rooms:presence` broadcast jde i neautentizovaným socketům (je to plošný `server.emit`)? Ověřit, zda počty místností nejsou citlivé (pravděpodobně OK, ale doložit) `[auto]` | `LK` | M1 | ✅L1 |
| GCH-19 | `chat:room:environment { room, style, placeId }` — emit po REST `PUT /rooms/:room/environment` (za `RolesGuard`, jen platformová funkce). FE `RozcestiPage:59` aplikuje styl/lokaci. In-memory na BE → **restart serveru resetuje** na default `{ style:'fantasy', placeId:'1' }`. Ověřit, že FE po restartu BE nedrží stale prostředí (refetch při joinu) `[auto]` | `PL` `LC` | M2 | ⚠️ |
| GCH-20 | `chat:message:deleted` (global) `{ messageId, channelId }` do `chat:{channelId}`; FE `ChatRoom:236` mark deleted. Parita s world chatem (stejný event, jiný zdroj) `[auto]` | `PL` | M2 | ✅L2 |

> **Výsledek E:** Counts (N-30) ✅ — REST `GET /rooms/presence` za JwtAuthGuard, FE volá jen přihlášený, broadcast `chat:rooms:presence` konzistentní. `chat:message:deleted` payload sdílí tvar s world chatem. GCH-19 (environment in-memory reset po restartu BE) `⚠️` — kosmetický stale stav, k doložení refetch při joinu.

---

## Test coverage gaps

- `global-chat.gateway.spec.ts` (~35 testů) pokrývá presence/whisper/reactions — ověřit, zda testuje **spoofing `userId` z payloadu** (GCH-01) a **whisper leak filtr** (GCH-09/16).
- Environment reset po restartu (GCH-19) netestováno — in-memory stav.
- Heartbeat/60min timeout (GCH-07) — ověřit pokrytí cron cleanup cesty.

## Známá rizika (předběžná)

- **GCH-01 (payloadová identita):** klient deklaruje `userId` v `chat:hospoda:join` a tím se zařadí do `user:{userId}` roomu. Pokud BE nevaliduje proti JWT, je to vektor na odposlech cizích whisperů (které jdou do `user:{toUserId}`). **Nejvyšší priorita ověření v této oblasti** — buď je tam validace, nebo je to reálný leak, ne jen kosmetika jako N-8.
- **GCH-19 (environment in-memory):** restart BE tiše resetuje prostředí Rozcestí; klienti připojení přes reconnect uvidí default, dokud nepřijde nový `PUT`. Kosmetické, ale matoucí.
