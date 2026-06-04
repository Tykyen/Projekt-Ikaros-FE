# 05 — Přátelství (FriendshipsGateway)

N-4 doplnil most EventEmitter2 → Socket.IO (`friendship.*` → `friend:*`). Gateway nemá `handleConnection` — spoléhá na `user:{id}` room z ChatGateway. Tady ověřujeme **správnost mostu**, a hlavně **payload paritu**, protože z inventury vychází nejostřejší drift kandidát celého auditu.

**BE:** `modules/friendships/friendships.gateway.ts`, `friendships.service.ts`
**FE:** `features/friendships/hooks/useFriendshipsSocket.ts`

---

## A. Payload parita — `requesterId/recipientId` vs `from/by` 🔴🔴

> **Inventura napřímo:**
> - BE emit `friend:request:incoming` payload = `{ friendshipId, requesterId, recipientId }` (friendships.gateway:36–42)
> - FE listener `useFriendshipsSocket:36` čte = `{ friendshipId, from }`
>
> `requesterId` ↔ `from`, `recipientId` ↔ nic. **Pokud FE čte `event.from` → `undefined`.** `audit:ws` to nevidí (názvy eventů sedí). Tohle je přesně třída tichého bugu, kvůli které plán existuje.

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| FRND-01 | **Doložit reálný payload `friend:request:incoming`**: čtení BE emitu + FE handleru vedle sebe. Sedí klíče (`requesterId` vs `from`)? Pokud ne — používá FE ten klíč k něčemu (toast jméno, optimistic), nebo jen `invalidateQueries` (pak `undefined` neškodí)? `[auto]` | `PL` | M2 | ✅L3 |
| FRND-02 | `friend:request:accepted` — BE `{ friendshipId, requesterId, recipientId }` → `user:{requesterId}`; FE `:42` čte `{ friendshipId, by }`. Stejný drift (`by` vs `accepted-by` = recipientId?). Doložit `[auto]` | `PL` | M2 | ✅L3 |
| FRND-03 | `friend:request:declined` (`:48`) a `friend:request:canceled` (`:53`) — stejná kontrola `by`. Ověřit, zda toast „X tě odmítl/zrušil" zobrazuje jméno (potřebuje `by`) nebo generický text (nepotřebuje) `[auto]` | `PL` | M2 | ⚠️L3 |
| FRND-04 | `friend:removed` (`:57`) — BE emituje **oběma** stranám (`user:{requesterId}` i `user:{recipientId}`); FE čte `{ friendshipId, by }`. Ověřit, že obě strany dostanou event a refetchnou seznam přátel `[auto]` | `PL` `RM` | M2 | ✅L3 |
| FRND-05 | **Pokud FE payload klíče nepoužívá** (jen invaliduje) → drift je neškodný, ale **dluh** (matoucí, křehké při budoucí změně na „toast se jménem"). Pokud používá → **bug `W-xx`** (toast bez jména / undefined v UI). Rozhodnout a zapsat `[auto]` | `PL` | M1 | ✅ |

> **Výsledek A (K-1 VYVRÁCENA):** Gateway **resolvuje username serverem** (`usersService.publicProfile`) a emituje `{ from: { username } }` / `{ by: { username } }` — **přesně** to, co FE čte ([friendships.gateway.ts:38-51](../../../Projekt-ikaros/backend/src/modules/friendships/friendships.gateway.ts#L38) ↔ [useFriendshipsSocket.ts:9-20](../../src/features/friendships/hooks/useFriendshipsSocket.ts#L9)). Inventura agenta zaměnila **interní** `FriendshipEvent {requesterId, recipientId}` (`@OnEvent` vstup) za **odchozí** emit — gateway je překládá. `incoming`/`accepted` payload se reálně používá v toastech a je pokrytý testy na **obsah** (`friendships.gateway.spec.ts:35-38,48-51`).
> ⚠️ **Drobný dluh (FRND-03):** FE typ `SimplePayload` deklaruje `by: { username }`, ale `friend:request:canceled`/`friend:removed` emity `by` **neposílají** (jen `{ friendshipId }`). Handler ho nečte → neškodné, ale matoucí typ. Viz `W-2`.

---

## B. Room targeting & směrování

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| FRND-06 | `friend:request:incoming` jde **jen** příjemci (`user:{recipientId}`) — žadatel ho nedostane. `friend:request:accepted` jde **jen** žadateli (`user:{requesterId}`). Ověřit, že směrování není prohozené (žadatel by jinak dostal „máš novou žádost" od sebe) `[auto]` | `RM` | M3 | ✅L3 |
| FRND-07 | `friendship.removed` rozlišuje `wasPending` → pending storno jde jako `friend:request:canceled` jen příjemci; oboustranné odebrání jako `friend:removed` oběma. Ověřit větvení dle `wasPending` `[auto]` | `RM` `PL` | M3 | ✅L3 |
| FRND-08 | **Závislost na ChatGateway `user:{id}`:** FriendshipsGateway sám `user:{id}` nejoinuje. Pokud by se ChatGateway connection nespustila (jiný namespace? jiný socket?), friend eventy nedorazí. Ověřit, že obě gateway sdílí **tutéž** instanci/namespace a `user:{id}` z chat handshake platí i pro friend emity `[auto]` | `RM` `LC` | M1 | ✅L2 |
| FRND-09 | `blocked` event: BE service emituje `friendship.blocked` (zmíněno v N-4), ale gateway most pro `friend:blocked` v inventuře chybí. Ověřit, zda blokace má WS reflexi, nebo se projeví až po manuálním refetchi (gap) `[auto]` | `EX` | M1 | 🐛 W-1 |

> **Výsledek B:** Směrování i `wasPending` větvení pokryto testy (`friendships.gateway.spec.ts:67-92`) → ✅L3. `user:{id}` join potvrzen v [chat.gateway.ts:50](../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L50) (sdílený socket, jeden handshake). **FRND-09 = potvrzený gap (`W-1`):** [friendships.service.ts:313](../../../Projekt-ikaros/backend/src/modules/friendships/friendships.service.ts#L313) emituje `friendship.blocked`, ale gateway pro něj **nemá `@OnEvent`** a FE **nemá listener** → blokace/odblokování bez real-time reflexe (konzistentní absence na obou stranách).

---

## C. FE reakce & lifecycle

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| FRND-10 | `useFriendshipsSocket` mountuje se jednou v IkarosLayout (per session). Ověřit, že listenery přežijí navigaci mezi stránkami (ne unmount/remount při každém routu) a po reconnectu se znovu navážou přes `useSocketEvent` `[auto]` | `LC` | M1 | ✅L2 |
| FRND-11 | Toast „nová žádost o přátelství" + invalidace `friendships` + „Zpracovat" tabu. Ověřit, že invalidace cílí správné query keys (incoming requests, friend list) `[auto]` | `EX` | M1 | ✅L1 |
| FRND-12 | Idempotence multi-tab: dva taby → dva toasty na jednu žádost. Akceptovatelné, nebo dedup? Doložit chování (CONN-10 souvislost) `[human]` | `LC` | M1 | ⏭️ |

> **Výsledek C:** `useFriendshipsSocket` přes `useSocketEvent` (re-register na socket swap, oblast 09) → reconnect-safe. Invalidace cílí `['pending-actions']`/`['friendship-status']`/`['friends']`/`['friends','outgoing']` — konzistentní s query keys feature. Multi-tab dvojí toast = `[human]` (přijatelné, CONN-10).

---

## Test coverage gaps

- `friendships.gateway.spec.ts` (6 testů, N-4) ověřuje, že se eventy emitují na správné roomy — **ale testuje payload klíče?** Pokud testy jen kontrolují název eventu + room, drift `requesterId`/`from` projde i přes zelený test. Ověřit asserce na payload obsah (FRND-01..04).
- **FE `useFriendshipsSocket` nemá test** — žádné ověření, že FE handler reálně zpracuje BE payload. Gap-fill M7: mock socket → emit BE-tvar payloadu → ověřit toast/invalidaci.

## Známá rizika (předběžná)

- **FRND-01..05 (payload klíče):** nejpravděpodobnější reálný nález auditu. Buď FE klíče nepoužívá (dluh + zapsat), nebo používá (bug). V obou případech to `audit:ws` označil za „čisté", což demonstruje, proč tenhle plán existuje.
- **FRND-09 (`blocked` bez mostu):** blokace možná nemá real-time reflexi — odblokovaný/zablokovaný uživatel uvidí změnu až po refreshi. Potvrdit jako gap nebo by-design.
