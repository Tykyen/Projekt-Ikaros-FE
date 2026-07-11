# ws · 05-friendships (FriendshipsGateway)

RUN-2026-07-11-1213 · READ-ONLY · prefix `W-` · registr `docs/ws-audit.md`
Záběr: `backend/src/modules/friendships/{friendships.gateway.ts, friendships.service.ts, friendships.gateway.spec.ts}` + FE `src/features/friendships/hooks/useFriendshipsSocket.ts`, `api/useFriendshipMutations.ts`
Hloubka: L2–L3 (statický kontrakt + existující gateway spec pokrývá payload; testy nespuštěny tento běh).

## Souhrn
- **1 nový nález (⚪ kosmetika / 🟡 nízká):** `friendship.unblock` bez WS mostu — zrcadlo W-1.
- **Bez regrese** oproti registru: W-1 (`friend:blocked` most) i W-2 (zúžený `SimplePayload`) v kódu drží, kryté testem.
- K-1 zůstává vyvrácena — gateway resolvuje `username` serverem a emituje `{ from/by: { username } }`.

## Ověření známých nálezů (♻️, NEhlásit jako nové)
- **W-1** ✅ drží. Gateway `@OnEvent('friendship.blocked')` → `friend:blocked { blockerId, blockedId }` oběma stranám ([friendships.gateway.ts:86-94](../../../../Projekt-ikaros/backend/src/modules/friendships/friendships.gateway.ts#L86)). Service emit [friendships.service.ts:371](../../../../Projekt-ikaros/backend/src/modules/friendships/friendships.service.ts#L371). FE listener [useFriendshipsSocket.ts:73-77](../../../src/features/friendships/hooks/useFriendshipsSocket.ts#L73). Payload parita `{ blockerId, blockedId }` ↔ `BlockedPayload` sedí. Spec test `friendships.gateway.spec.ts:94-102`.
- **W-2** ✅ drží. `SimplePayload = { friendshipId }` ([useFriendshipsSocket.ts:19-21](../../../src/features/friendships/hooks/useFriendshipsSocket.ts#L19)); `canceled`/`removed` emit jen `{ friendshipId }` ([friendships.gateway.ts:69,75](../../../../Projekt-ikaros/backend/src/modules/friendships/friendships.gateway.ts#L69)). Handlery payload nečtou (jen invalidace). Bez driftu.

## Body plánu — re-verifikace
- **FRND-01/02** ✅L3 — `friend:request:incoming` emit `{ friendshipId, from:{username} }` ↔ FE `IncomingPayload`; `accepted` `{ friendshipId, by:{username} }` ↔ `AcceptedPayload`. Parita klíč-po-klíči sedí; spec asserty na obsah (`spec:35-38,48-51`). Username resolvuje server (`usersService.publicProfile`, fallback `'Uživatel'`).
- **FRND-03/04/05** ✅ — `declined`/`canceled`/`removed` diskrétní (jen invalidace), FE klíče nečte → drift neexistuje (typ zúžen, W-2).
- **FRND-06/07** ✅L3 — směrování: `incoming`→`user:{recipientId}`, `accepted/declined`→`user:{requesterId}`; `removed` větví dle `wasPending` (`canceled` jen příjemci / `friend:removed` oběma). Kryto `spec:67-92`.
- **FRND-08** ✅L2 — gateway sdílí `user:{id}` room z ChatGateway (jeden namespace `/`, jeden handshake). Beze změny.
- **FRND-09 → W-1** ✅ vyřešeno (viz výše).
- **FRND-10/11** ✅ — hook přes `useSocketEvent` + `useSocketReconnect` (reconnect-safe, S-05 refetch). Invalidace cílí `['pending-actions']`/`['friendship-status']`/`['friends']`/`['friends','outgoing']`. Pozn.: `['friends']` je prefix → pokrývá i `['friends','blocked']` (block-list) a `['friends','outgoing']`.

## 🆕 Nový nález

### W-FR-NEW-1 — `unblock()` neemituje žádný event → bez WS reflexe (⚪/🟡 nízká)
- **Osa:** `EX`
- **Soubor:** [friendships.service.ts:375-377](../../../../Projekt-ikaros/backend/src/modules/friendships/friendships.service.ts#L375)
  ```ts
  async unblock(blockerId: string, blockedId: string): Promise<void> {
    await this.blocksRepo.remove(blockerId, blockedId);
  }   // ← žádný this.events.emit(...)
  ```
- **Symptom:** Odblokování nemá real-time reflexi. `block()` emituje `friendship.blocked` oběma stranám (W-1 fix), ale `unblock()` neemituje nic → zrcadlo je nekompletní. Blokujícího **jiné taby** (a jiná zařízení) neobnoví block-list (`['friends','blocked']`) ani `friendship-status` — zůstanou stale do ručního refreshe. Akční tab se obnoví přes vlastní mutaci (`useUnblockUser`, `useFriendshipMutations.ts:119`), takže single-tab OK.
- **Root cause:** W-1 doplnil most jen pro `blocked`; `unblock` byl už předtím bez emitu a most se pro něj nikdy nepřidal. FE nemá `friend:unblocked` listener (konzistentní absence).
- **Klasifikace:** 🆕 (v registru není — W-1 pokrývá výhradně `friendship.blocked`). Nízká/kosmetika: block-list se v praxi zřídka drží ve dvou tabech; odblokovanému se push záměrně nechce (stejná logika jako blokovanému u W-1).
- **Návrh (k rozhodnutí, neopravovat tiše):** buď (a) přijmout jako vědomý dluh (symetricky s „blokovanému nepushujeme"), nebo (b) `this.events.emit('friendship.unblocked', { blockerId, blockedId })` + `@OnEvent` most → `friend:unblocked` do `user:{blockerId}` (jen blokujícímu, pro multi-tab konzistenci) + FE listener invaliduje `['friends']`/`['friendship-status']`.

## Klasifikace
- ♻️ W-1, W-2 — známé, opravené, drží. NEhlásit jako nové.
- 🔓 — žádná regrese.
- 🆕 — W-FR-NEW-1 (unblock bez WS reflexe), nízká/kosmetika.
