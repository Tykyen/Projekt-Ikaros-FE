# WS contract plán — hloubková kontrola WebSocket vrstvy Ikaros

> **Účel:** systematicky projít **celý real-time stack** (Socket.IO, 12 gatewayů, ~47 příchozích + ~44 odchozích eventů, FE socket vrstva) a ověřit, že **kontrakt mezi BE emitem a FE listenerem skutečně sedí** — nejen názvem eventu, ale i **payloadem, roomem, autorizací a lifecycle chováním**.
>
> Tohle je sourozenec [`bug-plan/`](../bug-plan/README.md) zaměřený výhradně na WS. Bug-plan testuje REST/logiku/role; WS contract plán testuje to, co bug-plan i `audit:ws` **systematicky míjejí** — reálnou shodu real-time přenosu.
>
> **Stav:** zahájeno 2026-06-04. Nálezy → [`../ws-audit.md`](../ws-audit.md) (ID `W-xx`).

---

## Proč samostatný plán (a proč `audit:ws` nestačí)

Nástroj `npm run audit:ws` ([`scripts/ws-audit.mjs`](../../scripts/ws-audit.mjs)) je **regexový párovač názvů eventů**. Umí jen:

- najít FE `socket.on('x')` bez BE emitu `'x'` → mrtvý listener,
- najít FE `socket.emit('x')` bez BE `@SubscribeMessage('x')` → zahozený emit.

**Co `audit:ws` ze své podstaty NEodhalí** (a co je proto jádro tohoto plánu):

| Slepá skvrna `audit:ws` | Příklad reálného rizika |
|---|---|
| **Payload shape** — vidí jen název, ne tvar dat | BE emituje `{ requesterId }`, FE čte `event.from` → listener běží, ale data jsou `undefined` |
| **Room targeting** — neví, kdo je v roomu | event jde do `world:{id}`, ale klient nikdy neudělal `room:join` → tiše nic nepřijde |
| **Auth / role gate** — nevidí guard logiku | handler joinne room bez membership checku (N-8) → leak |
| **Lifecycle / reconnect** — statická analýza | po reconnectu se room nere-joinne → klient „oslepne" bez chyby |
| **Dedup / idempotence** | optimistic zpráva + WS echo se nezdedupují → duplikát |
| **Podmíněný emit** | `@OnEvent` existuje, ale `if` uvnitř ho nikdy nepustí |
| **Dynamické názvy** (`${x}`) | přeskakuje heuristika |

> 💡 **Závěr:** zelený `audit:ws` je **nutná, ne postačující** podmínka. „0 mrtvých listenerů" neznamená „real-time funguje" — znamená jen „názvy eventů se potkávají". Tenhle plán tlačí kontrolu o vrstvu níž: **na payload, room a čas**.

---

## Osy kontroly (WS-specifické)

Každý event se prověřuje podél **6 os**. Ne každý bod testuje všech 6 — u každého kontrolního bodu je uvedeno, kterou osu řeší.

| Osa | Zkratka | Otázka | Jak ověřit |
|---|---|---|---|
| **Existence páru** | `EX` | Má emit svůj listener a naopak? | `audit:ws` + grep |
| **Payload parita** | `PL` | Sedí tvar payloadu BE emit ↔ FE listener (klíče, typy, optional)? | čtení obou stran + test |
| **Room targeting** | `RM` | Jde event do roomu, ve kterém příjemce reálně je? Kdo do roomu vstupuje a kdy? | trasování `room:join` |
| **Auth / role** | `AU` | Ověřuje handler JWT z handshake a roli ze serveru (ne z payloadu)? | čtení guardu |
| **Lifecycle** | `LC` | Connect/disconnect cleanup; **re-join po reconnectu**; multi-tab dedup | čtení + test |
| **Leak-safety** | `LK` | Nenese event citlivá data do širšího roomu, než smí příjemce vidět? | čtení payloadu + room |

---

## Metody ověření (jak `[auto]` body kontroluju)

Přejato z bug-planu kvůli konzistenci, s důrazem na WS.

| Kód | Metoda | Nástroj |
|---|---|---|
| **M1** | Statické čtení — handler/listener logika, payload shape, edge cases | Read/Grep |
| **M2** | Kontrakt — BE emit payload ↔ FE listener očekávání (klíč po klíči) | skill `type-sync` + ruční diff |
| **M3** | Cílený test — spustit existující gateway/hook test | `jest` / `vitest` |
| **M4** | Auth gate — JWT handshake, role-resolve ze serveru, room access | skill `auth-policy` |
| **M5** | WS kontrakt — emit/listener vs. [`websocket-api.md`](../../../Projekt-ikaros/docs/websocket-api.md) | skill `socket-contract` |
| **M6** | Baseline — `audit:ws` + plný gateway test run | npm scripty |
| **M7** | **Gap-fill test** — napsat chybějící gateway/hook test, spustit, ověřit zelený | `jest` / `vitest` |
| **M8** | **Round-trip** — emit na jedné straně → ověřit doručení druhé (mock socket / 2 klienti) | `jest` round-trip |

> **M8 je WS specialita:** u kritických cest nestačí „BE emituje" + „FE poslouchá" zvlášť — chceme **jeden test, který pošle event a ověří, že přišel se správným payloadem do správného roomu**. To je jediný způsob, jak chytit payload drift natvrdo.

---

## Úrovně jistoty (L1–L4)

| Úroveň | Co znamená | Důkaz |
|---|---|---|
| **L1** | přečteno (M1) — kód *vypadá* správně | nejslabší |
| **L2** | kontrakt ověřen (M2/M4/M5) — názvy, payload klíče, role sedí staticky | strukturální |
| **L3** | existující test pokrývá cestu a je zelený (M3) | chování zajištěno |
| **L4** | **doplněn round-trip / gap-fill test** (M7/M8) a je zelený | nová trvalá pojistka |

**Kritická real-time cesta na L1 = nedostatečné** → eskalovat na M8. Cíl plánu: každý event s vlivem na hru/bezpečnost na **L3+**, payload-drift kandidáti na **L4**.

---

## Baseline (globální health, mimo oblasti)

| Check | Repo | Stav (předpoklad) | Pozn. |
|---|---|---|---|
| `npm run audit:ws` | FE | ✅ čistý (dle bug-auditu) | jen parita názvů — viz slepé skvrny výše |
| `jest` gateway specs | BE | ⚠️ 6/12 gatewayů má test | díry: maps, emotes, universe, ikaros-messages, character-accounts, base |
| FE socket hook testy | FE | 🔴 0 dedikovaných | žádný `useSocketEvent`/hook socket test |
| `tsc --noEmit` | FE+BE | ✅ | dle bug-auditu |

⚠️ **Pasti prostředí** (z paměti projektu, platí i tady):
- Po BE změně gatewaye **nestačí FE refresh** — BE drží starý bundle bez `nest --watch` restartu.
- BE `jest` potřebuje mongodb-memory-server; `exit 0` neznamená zelené — čti `Tests: X failed`.
- FE vitest: spouštět `--project '!storybook'` (storybook projekt visí na playwright).
- Sdílený socket: **jedna Socket.IO instance** napříč všemi gateway (namespace `/`). Disconnect = ovlivní všechny gateway naráz.

---

## Inventura gatewayů (BE) — co existuje

> Stav k 2026-06-04. Ověřeno čtením `backend/src` (mimo worktrees). **FriendshipsGateway i PresenceGateway už EXISTUJÍ** (N-4/N-5 opraveno) — kontrolujeme jejich správnost, ne jejich absenci.

| # | Gateway | Soubor | Příchozí (`@SubscribeMessage`) | Odchozí (`@OnEvent`→emit) | Lifecycle | Test |
|---|---|---|---|---|---|---|
| 1 | BaseGateway | `gateways/base.gateway.ts` | — | — | log only, `setMaxListeners(32)` | ❌ |
| 2 | AppGateway | `gateways/app.gateway.ts` | `room:join`, `room:leave` | — | — | ✅ basic |
| 3 | PresenceGateway | `modules/presence/presence.gateway.ts` | `presence:idle`, `presence:active` | — | JWT povinný, snapshot on connect | ✅ 7 |
| 4 | ChatGateway | `modules/chat/chat.gateway.ts` | `chat:channel:join/leave`, `typing:start/stop`, `sound:play/stop` | message/channel/group/unread (12×) | JWT tolerantní, `user:{id}`, presence cleanup | ✅ ~30 |
| 5 | GlobalChatGateway | `modules/global-chat/global-chat.gateway.ts` | `chat:hospoda:*`, `chat:room:*`, `ikaros:whisper`, `chat:reaction:toggle`, `chat:heartbeat` | global message/deleted/reaction (3×) | disconnect leaveAll | ✅ ~35 |
| 6 | FriendshipsGateway | `modules/friendships/friendships.gateway.ts` | — | `friend:request:*`, `friend:removed` (4 OnEvent) | sdílí `user:{id}` z ChatGateway | ✅ 6 |
| 7 | WorldsGateway | `modules/worlds/worlds.gateway.ts` | — | `world:*`, `world:membership:*`, `world:access-*` (8×) | JWT tolerantní, `user:{id}` | ✅ 4 |
| 8 | MapsGateway | `modules/maps/maps.gateway.ts` | `map:join/leave/join-world`, `map:spotlight/ping` + **legacy** | `weather:updated` + emit helpery (operation/member/reassigned) | JWT **povinný** (error event), `user:{id}` | ❌ |
| 9 | UniverseGateway | `modules/universe/universe.gateway.ts` | — | `universe:updated` (leak-safe signál) | — | ❌ |
| 10 | EmotesGateway | `modules/emotes/emotes.gateway.ts` | — | `emote:created/deleted/updated` (+ `-global`) | — | ❌ |
| 11 | IkarosMessagesGateway | `modules/ikaros-messages/ikaros-messages.gateway.ts` | — | `ikaros:new-message` | JWT tolerantní, `user:{id}` | ❌ |
| 12 | CharacterAccountsGateway | `modules/character-subdocs/character-accounts.gateway.ts` | — | `account:transfer:received` | — | ❌ |

> ⚠️ **Nekonzistence handshake:** PresenceGateway a MapsGateway vyžadují JWT **tvrdě** (bez tokenu = ignor/error), zbytek je **tolerantní** (bez tokenu socket projde bez `user:{id}` roomu). To je legitimní, ale **musí se ověřit, že tolerantní gateway nikam neposílají per-user citlivá data klientovi bez ověřené identity.** → osa `AU`/`LK`, oblast 01.

---

## Room mapa (kdo do roomu vstupuje a co tam teče)

| Room | Vstup (kde FE joinne) | Co tam teče | Riziko |
|---|---|---|---|
| `user:{userId}` | **server automaticky** při connect (Chat/Worlds/Maps/Ikaros gateway z JWT) | whisper, `chat:unread`, `chat:feed:bump`, `friend:*`, `world:access-*`, `ikaros:new-message`, `account:transfer:received`, `presence` (?), `map:reassigned` | per-user — kdo nemá JWT, nemá room → tiše nedostane |
| `chat:{channelId}` | `room:join chat:{id}` (ChatRoom, ChannelView) | `chat:message`, `chat:typing`, `chat:presence`, `chat:sound:*`, reactions | hráč bez přístupu nesmí být v roomu (access check?) |
| `world:{worldId}` | `room:join world:{id}` (WorldChatRoom, useUniverseSocket, useMapWeather) | `world:*`, `chat:channel:*`, `chat:group:*`, `emote:*`, `universe:updated`, `weather:updated` | **N-8: join bez membership** → leak počasí/membership |
| `{sceneId}` | `map:join {sceneId}` (useMapSocket) | `map:operation`, `map:spotlight`, `map:pinged`, `map:rulered`, `map:member-*`, legacy | read-access check v `map:join` |

> 🔑 **Klíčová otázka pro celý plán:** je klient v roomu, do kterého mu BE posílá? Mnoho eventů jde do `world:{id}`, ale `room:join world:{id}` dělá jen **WorldChatRoom / universe / weather hook**. Hráč na stránce světa **mimo chat/mapu** možná v roomu není → `world:updated`, `emote:*`, membership eventy mu nedorazí. To je systematický kandidát na nález (oblast 06, 09).

---

## Index oblastí

| # | Oblast | Gateway / vrstva | Hlavní osy |
|---|---|---|---|
| 01 | [Připojení, handshake, rooms](01-pripojeni-handshake-rooms.md) | Base/App + handshake všech | `AU` `RM` `LC` |
| 02 | [World chat](02-world-chat-gateway.md) | ChatGateway | `PL` `RM` `AU` |
| 03 | [Globální chat](03-global-chat-gateway.md) | GlobalChatGateway | `PL` `LC` `LK` |
| 04 | [Presence & OnlineDot](04-presence-online.md) | PresenceGateway | `LC` `PL` `RM` |
| 05 | [Přátelství](05-friendships.md) | FriendshipsGateway | `PL` `RM` |
| 06 | [Světy & univerzum](06-worlds-universe.md) | Worlds + Universe | `RM` `LK` `PL` |
| 07 | [Taktická mapa](07-maps.md) | MapsGateway | `LC` `AU` `PL` `RM` |
| 08 | [Emoty, pošta, účty](08-emotes-messages-accounts.md) | Emotes + Ikaros + Accounts | `RM` `PL` |
| 09 | [FE socket vrstva](09-frontend-socket-vrstva.md) | singleton, useSocketEvent, reconnect | `LC` `EX` |

---

## Legenda statusů

- ⬜ netestováno
- ✅ ověřeno OK (status `✅L3` apod. drží i úroveň jistoty)
- 🐛 nalezena chyba → zapsáno do [`../ws-audit.md`](../ws-audit.md) (`W-xx`)
- ⚠️ podezřelé / nejisté / dluh
- ⏭️ blokované nebo čistě `[human]`

---

## Pracovní postup zkoušek

1. **Baseline** — `audit:ws` + plný gateway test run, zapsat stav.
2. **Oblast po oblasti** — projít body, u každého doplnit status + úroveň + `soubor:řádek` důkaz.
3. **Payload-drift kandidáti první** (`PL` osa) — to je nejpravděpodobnější třída tichých bugů, kterou `audit:ws` nevidí.
4. **Round-trip testy (M8)** na kritické cesty bez pokrytí (maps, emotes, ikaros-messages, accounts).
5. **Nález → `W-xx` do [`../ws-audit.md`](../ws-audit.md)** s `soubor:řádek` + návrhem; neopravovat tiše (viz pravidlo projektu).
