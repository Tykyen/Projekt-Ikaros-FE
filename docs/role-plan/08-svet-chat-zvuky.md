# 08 — Svět: chat / zvuky / emoty

Real-time komunikace světa. Klíčová osa je **`ST`** (přístup ke kanálu závisí na `accessMode`:
`members` = whitelist, `role` = dle membership role) a **`PC`** (kanál teče REST i WS — oba musí ctít
stejný access). Plus dvě historické pasti: N-19 (unread badge tekl Čtenáři na kanály bez přístupu),
N-20 (linked channel members ignoroval roli). Zvuky mají vlastní role gate (sound:play = PomocnyPJ).

**BE:** `chat` (controller, service, gateway), `sounds`, `emotes`
**FE:** `features/world/chat` (ChannelView, WorldChatRoom), zvuky, emote picker

> Sourozenec [bug-plan/07-svet-chat](../bug-plan/07-svet-chat.md) a [ws-audit](../ws-audit.md) (W-xx).
> Tady role/state/path hrany; čistě WS lifecycle → oblast 09 + ws-audit.

---

## A. Kanály — accessMode jako gate (`ST` `PA`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| CH-01 | `hasChannelAccess` ([chat.service.ts:99]) — `accessMode='members'` → `allowedMemberIds` whitelist; `accessMode='role'` → `hasAccessGivenMembership` (role práh). Ověřit oba módy `[auto]` | `ST` | M1 | ⬜ |
| CH-02 | `accessMode='public'` (pokud existuje) → všichni členové. Ověřit default mód a co vidí Ctenar `[auto]` | `ST` | M1 | ⬜ |
| CH-03 | Red-team: hráč mimo `allowedMemberIds` (members kanál) `GET /channels/:id/messages` → 403. Ověřit, že FE kanál neukáže a BE drží `[auto]` | `ST` `OW` | M8 | ⬜ |
| CH-04 | Red-team: hráč pod prahem (role kanál) → 403 na messages i send `[auto]` | `ST` | M8 | ⬜ |

---

## B. Správa kanálů (`PA`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| CH-05 | `canManageChat` ([chat.service.ts:86]) = GlobalAdmin \|\| role>=PomocnyPJ(4) → create/update/delete kanálu + skupiny. Hráč → 403 `[auto]` | `PA` | M4 | ⬜ |
| CH-06 | `assertWorldChannel` ([chat.service.ts:76]) — operace odmítne globální kanál (worldId chybí). Ověřit, že world chat akce nezasáhnou global chat `[auto]` | `DD` | M1 | ⬜ |
| CH-07 | FE — tlačítka správy kanálu jen PomocnyPJ+. Parita `[auto]` | `PA` | M1 | ⬜ |

---

## C. Unread / linked channels — leak filtry (`LK` `ST`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| CH-08 | **N-19 regrese:** `broadcastUnreadUpdate` ([chat.service.ts:1214]) musí vyloučit i **Ctenar** bez přístupu, ne jen Zadatel. Jinak Čtenář dostane `chat:unread` badge pro kanál, kam nemá. Ověřit filtr dle skutečného `hasChannelAccess` `[auto]` | `LK` `ST` | M1 | ✅L2 ([:1237](../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L1237) — `hasAccessGivenMembership`, stejná logika jako čtení; N-19 fix drží) |
| CH-09 | **N-20 regrese:** `syncLinkedChannelMembers` ([chat.service.ts:1443]) musí brát roli, ne jen skupinu. PomocnyPJ+ s `group=null` nesmí být odstraněn z linked „members" kanálu (jinak 403 na messages) `[auto]` | `ST` `OR` | M1 | ⬜ |
| CH-10 | Red-team: po změně role/skupiny člena se unread/access přepočítá? (přidání do role kanálu → vidí; odebrání → přestane). Ověřit propagaci `[auto]` | `ST` | M1 | ⬜ |

---

## D. Zvuky (`PA`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| CH-11 | `sound:play`/`sound:stop` (WS) → role gate `canManageChat` (PomocnyPJ+); identita z **JWT** `client.data.userId`, ne payload (N-9). Red-team: hráč spoofne userId PJ → musí 403 (identita z JWT) `[auto]` | `PA` `BY` | M8 | ⬜ |
| CH-12 | `sounds.assertCanManageWorld` ([sounds.service.ts:25]) = PomocnyPJ+ → world sound CRUD; `assertIsAdmin` ([:44]) = GlobalAdmin → global sound. Dva prahy `[auto]` | `EN` `PA` | M2 | ⬜ |
| CH-13 | FE — sound board (pustit zvuk všem) jen PomocnyPJ+. Parita `[auto]` | `PA` | M1 | ⬜ |

---

## E. Emoty (`PA` `ST`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| CH-14 | `emotes.assertIsMember` ([emotes.service.ts:33]) = member && role>Zadatel → použít emote; `assertWorldCanManage` ([:50]) = PomocnyPJ+ → CRUD world emote `[auto]` | `PA` | M4 | ⬜ |
| CH-15 | Global vs world emote (paměť: `emote:*` i `-global`). Ověřit, že world emote CRUD je PomocnyPJ+, global je GlobalAdmin `[auto]` | `EN` `PA` | M1 | ⬜ |
| CH-16 | Red-team: hráč CRUD world emote → 403 `[auto]` | `PA` | M8 | ⬜ |

---

## F. Path-consistency: kanál přes REST i WS (`PC`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| CH-17 | Kanál teče dvěma dveřmi: REST `getMessages`/`sendMessage` (`hasChannelAccess`) **a** WS `chat:{channelId}` room. Ověřit, že **oba** ctí stejný access — WS join bez REST přístupu = leak `[auto]` | `PC` `ST` | M5 | 🐛 R-04 (POTVRZENO — WS room:join bez access checku, viz registr) |
| CH-18 | Red-team: hráč bez přístupu ke kanálu pošle `chat:channel:join chat:{id}` → musí být odmítnut/nedostat zprávy (W-3 třída — presence z JWT, ne payload). Detail oblast 09 `[auto]` | `PC` `BY` | M8 | ⬜ |
| CH-19 | `chat:channel:created` do `world:{id}` — leak-safe signál `{worldId}` (W-4 fix), ne metadata skrytého kanálu. Ověřit, že FE refetch je server-filtrovaný `[auto]` | `PC` `LK` | M5 | ⬜ |

---

## G. Matice persona × akce (chat/zvuky/emoty)

| Akce / persona | guest | Zadatel | Ctenar | Hrac | Korektor | PomocnyPJ | PJ | GlobalAdmin |
|---|---|---|---|---|---|---|---|---|
| číst veřejný kanál | 🚫 | ⛔ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| číst `members` kanál (ve whitelistu) | 🚫 | ⛔ | ✅ˢ | ✅ˢ | ✅ˢ | ✅ | ✅ | ✅ |
| číst `role` kanál (nad prahem) | 🚫 | ⛔ | ✅ˢ | ✅ˢ | ✅ˢ | ✅ | ✅ | ✅ |
| dostat unread badge (bez přístupu) | — | ⛔ | ⛔ | ⛔ | ⛔ | — | — | — |
| create/edit kanál | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| `sound:play` (všem) | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| použít emote | 🔒 | ⛔ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CRUD world emote | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| CRUD global emote/sound | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ |

`ˢ` = jen pokud splní accessMode (whitelist nebo role práh). „dostat unread badge bez přístupu" musí
být všude ⛔ (N-19).

> **Delta parity (chat/zvuky):**
> - CH-08 unread Ctenar leak — **✅** (N-19), potvrdit filtr dle `hasChannelAccess`
> - CH-09 linked channel role — **✅** (N-20), potvrdit
> - CH-11 sound spoof — **✅** (N-9 JWT), potvrdit red-team
> - CH-17/18 kanál REST vs WS access — **⚠️ PC** (W-3 třída, ověřit join gate)
> - ostatní → vyplnit.

---

## Test coverage gaps

- `hasChannelAccess` × accessMode × role (CH-01) — kompletní matice (members/role/public).
- CH-17/18 WS join access parita s REST (W-3 třída) — round-trip test.
- Red-team M8: members kanál bez whitelistu (CH-03), sound spoof (CH-11), world emote hráč (CH-16).
- N-19/N-20 regrese — ověřit existující testy pokrývají Ctenar leak a role-based linked sync.

---

## Známá rizika

- **RC-1 (`PC`/CH-17)** — kanál má dvoje dveře (REST + WS join). WS join gate (`resolveChannelPresenceRole`)
  musí být stejně přísný jako REST `hasChannelAccess`. Pokud WS pustí join bez access check, hráč dostane
  zprávy kanálu, kam přes REST nesmí (W-3 třída). **Nejvyšší priorita oblasti.**
- **RC-2 (`LK`/CH-08)** — unread badge je tichý leak: prozradí existenci/aktivitu kanálu, kam člen nemá
  (N-19). Filtr musí být dle skutečného `hasChannelAccess`, ne jen role>Zadatel.
- **RC-3 (`ST`/CH-09)** — linked channel sync dle skupiny ignoroval roli (N-20) → PomocnyPJ vypadl z
  members kanálu. Ověřit, že role přebíjí skupinu u staff.
