# 09 — WS role-gating (identita / role / membership v gatewayích)

Real-time vrstva z pohledu **oprávnění** — ne lifecycle (to řeší [ws-contract-plan](../ws-contract-plan/README.md)),
ale: **odkud gateway bere identitu** (JWT `client.data.userId` vs klientský payload) a **jestli ctí
stejný role/membership gate jako REST** (`PC` osa, `DD` last-line). Tahle oblast **neduplikuje**
ws-audit — přebírá jeho nálezy a dívá se na ně rolovou optikou. Hlavní reference: W-3, W-10, N-8.

**BE:** všech 12 gatewayů (`*.gateway.ts`), `app.gateway` (`room:join`)
**FE:** `features/chat/api/socket.ts` (singleton), useSocketEvent, room-join hooky

> 🔑 **Princip:** WS je další **dveře** ke stejným zdrojům (oblast 00 RM-30). Pokud REST endpoint má
> role gate, ale gateway emit/join ho nemá, je to leak stejné třídy jako zapomenutý search filtr.

---

## A. Identita — JWT vs payload (`BY` — anti-spoofing)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| WR-01 | **Pravidlo:** každý handler, který rozhoduje dle identity, bere `client.data.userId` z JWT handshake, **nikdy** `payload.userId`. Grepnout všechny `@SubscribeMessage` a ověřit zdroj identity `[auto]` | `BY` | M1 | ⬜ |
| WR-02 | **W-3 (ws-audit):** `chat:channel:join` bral identitu z payloadu → spoof presence/role. Ověřit stav opravy (identita z JWT) `[auto]` | `BY` | M5 | ⬜ |
| WR-03 | **W-10 (ws-audit):** global chat `user:{id}` join z payloadu → leak privátních zpráv. Ověřit stav opravy (`user:{client.data.userId}` z JWT) `[auto]` | `BY` `LK` | M5 | ⬜ |
| WR-04 | `sound:play` (N-9) — role check `resolveChannelPresenceRole(channelId, client.data.userId)`, ne payload. Red-team: spoof userId PJ → 403 (vazba CH-11) `[auto]` | `BY` | M8 | ⬜ |
| WR-05 | Per-user room `user:{id}` — server joinne z JWT při connect (Chat/Worlds/Maps/Ikaros gateway). Tolerantní gateway bez JWT → bez user roomu (ne pád). Ověřit, že per-user citlivé eventy jdou jen do JWT-ověřeného roomu `[auto]` | `BY` `LK` | M1 | ⬜ |

---

## B. Membership / role gate v room join (`PC` `LK`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| WR-06 | **N-8 (přijaté riziko):** `app.gateway room:join` ([app.gateway.ts]) validuje jen regex formátu, **ne membership** → klient joinne `world:{cizíId}` a dostává `weather:updated`. Riziko = jen počasí (kosmetika), akceptováno. Ověřit, že do `world:{id}` neteče **nic citlivějšího** než počasí `[auto]` | `LK` `PC` | M1 | ⬜ |
| WR-07 | `chat:{channelId}` join — ctí `hasChannelAccess` (CH-17)? Hráč bez přístupu ke kanálu nesmí dostávat `chat:message`. Red-team: join cizího kanálu `[auto]` | `PC` `ST` | M8 | 🐛 R-04 (POTVRZENO — `room:join` jen regex, viz registr) |
| WR-08 | `map:join {sceneId}` — read-access check (assertCanReadScene)? Hráč nepřiřazený ke scéně nesmí dostávat `map:operation` `[auto]` | `PC` `OW` | M5 | ⬜ |
| WR-09 | **Inventura: co teče do `world:{id}`** (RM-28 aplikace na WS) — `world:*`, `chat:channel:*`, `emote:*`, `universe:updated`, `weather:updated`. Ověřit, že žádný z nich nenese per-role/AKJ citlivá data všem v roomu (vazba W-4) `[auto]` | `PC` `LK` | M1 | ⬜ |

---

## C. Leak-safe signály (`LK`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| WR-10 | `universe:updated`, `chat:feed:bump`, `chat:channel:created` (W-4 fix), `chat:group:created` — emitují jen `{worldId}` signál, ne metadata. Klient refetchuje **server-filtrovaný** GET. Ověřit, že žádný nese plný objekt skrytého zdroje `[auto]` | `LK` | M5 | ⬜ |
| WR-11 | `world:access-requested` → `user:{ownerId}` (ne world room — žadatel není člen); `world:access-approved` → `user:{requesterId}`. Ověřit room targeting (per-user, ne broadcast) `[auto]` | `LK` `RM` | M5 | ⬜ |
| WR-12 | Whisper (`ikaros:whisper`/global) → `user:{toUserId}`; FE filtruje dle channelId (W/N-31). Ověřit, že šeptaná zpráva neteče do špatné místnosti na sdíleném socketu `[auto]` | `LK` `OW` | M5 | ⬜ |

---

## D. Matice persona × WS akce

| WS akce / persona | guest(no JWT) | člen bez přístupu | člen s přístupem | PomocnyPJ | PJ |
|---|---|---|---|---|---|
| connect + `user:{id}` room | ❌(no room) | ✅ | ✅ | ✅ | ✅ |
| `room:join world:{id}` (počasí) | ✅* | ✅* | ✅ | ✅ | ✅ |
| `chat:channel:join` (zprávy) | ❌ | ⛔ⁿ | ✅ | ✅ | ✅ |
| `map:join scene` (operace) | ❌ | ⛔ⁿ | ✅ᵒ | ✅ | ✅ |
| `sound:play` (všem) | ❌ | ⛔ | ⛔ | ✅ | ✅ |
| dostat whisper | ❌ | jen adresát | jen adresát | jen adresát | jen adresát |

`*` N-8 přijaté riziko (počasí kosmetika). `ⁿ` = **musí** být odmítnuto, ale ověřit (WR-07/08 — třída W-3).
`ᵒ` = jen přiřazená scéna.

> **Delta parity (WS role):**
> - WR-02/03 identita z payloadu — **✅** (W-3/W-10 opraveno), potvrdit
> - WR-06 room:join world bez membership — **⚖️ přijaté riziko** (N-8, jen počasí)
> - WR-07/08 chat/map join access gate — **⚠️ ověřit** (třída W-3 — pustí WS, co REST zakáže?)
> - ostatní → vyplnit + cross-ref ws-audit.

---

## Vztah k ws-audit

Tahle oblast **nereplikuje** [ws-audit.md](../ws-audit.md). Bere jeho potvrzené nálezy s rolovým
dopadem (W-3 spoofing role, W-10 leak privátních eventů, W-4 metadata leak) a ověřuje je optikou
„sedí WS gate s REST/role gate?". Nové WS-only nálezy (payload shape, reconnect, dedup) patří do
ws-auditu jako `W-xx`; role-specifické rozpory FE↔BE/REST↔WS sem jako `R-xx`.

---

## Test coverage gaps

- WR-07/08 — round-trip test „hráč bez přístupu join → nedostane eventy" (chat + map). Třída W-3.
- WR-01 — statický sweep všech `@SubscribeMessage`: zdroj identity (JWT vs payload).
- Per-user room izolace (WR-05/12) — whisper neteče cizímu socketu.

---

## Známá rizika

- **RW-1 (`PC`/WR-07/08)** — **WS jako obcházka REST gate:** pokud `chat:channel:join`/`map:join` nemá
  access check shodný s REST, hráč dostane real-time data zdroje, kam přes REST nesmí. Třída W-3.
- **RW-2 (`BY`/WR-01)** — identita z payloadu = spoofing. W-3/W-10 opraveny, ale pravidlo musí platit pro
  **všech 12 gatewayů** — grep, ne namátka.
- **RW-3 (`LK`/WR-06)** — N-8 je akceptován jen proto, že do `world:{id}` teče pouze počasí. Pokud sem
  kdokoli přidá citlivější world event, riziko se mění z kosmetiky na leak → přehodnotit membership gate.
