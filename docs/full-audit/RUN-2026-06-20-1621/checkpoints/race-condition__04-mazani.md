# race-condition / 04-mazani — checkpoint RUN-2026-06-20-1621

## Pokrytí

Kód prošel staticky (L1-L3) na HEAD:
- `WorldHardDeleteService.hardDelete()` + `WorldCleanupCron.sweep()`
- `WorldsService.softDelete()` + `restore()`
- `ChatService.deleteGroup()`, `deleteChannel()`, `createChannel()`, `sendMessage()`
- `CharacterSubdocsService` (všech 5 lazy-create getterů + `onCharacterDeleted`)
- `CharactersService.delete()`
- `PagesService.delete()`, `assertCanWrite()`, `isWorldActive()`
- `ScheduledMessagesJob.sendDue()` + `MongoScheduledMessageRepository.findDue()`/`setStatus()`
- `GameEventReminderJob.sendReminders()` + `markReminderSent()`
- Existující race testy (`deletion.race.e2e-spec.ts`, `db-lifecycle.race.e2e-spec.ts`)

Osa záběru: PH (phantom/orphan) + DP (double-processing) + AT (atomicita) v oblasti mazání.

Existující nálezy D1–D6 ověřeny kódem — všechny opraveny a odpovídají HEAD.

## Dosažená L vs cílová L

| Nález | Dosaženo | Cíl (plan) |
|---|---|---|
| D1–D6 (stávající) | L4 (fix + bariéra zelená) | L4 ✅ |
| RC-D7 (nový) | L2 (statická analýza, bez gate repro) | L3 (gate test) |
| RC-D8 (nový) | L2 (statická analýza, bez gate repro) | L3 (gate test) |
| RC-D9 (nový) | L1 (hypotéza, bez repro) | L3 (gate test) |

Cílová L pro oblast 04 v plánu = L3. Nové nálezy RC-D7/D8 jsou L2, RC-D9 je L1.
L5-teeth (Stryker mutace) na opravených D1-D6 = PROOF-REQUEST (živá infra).

## Nálezy

### RC-D7 — [PH] 🟠 WorldCleanupCron: restore vs cron → hard-delete žijícího světa
**Kde:** `world-cleanup.cron.ts:32-44` + `world-hard-delete.service.ts:88-124`
**Popis:**
`WorldCleanupCron.sweep()` volá `findExpiredDeleted(cutoff)` → vrátí seznam světů do paměti.
Poté iteruje a volá `hardDelete(w.id)` pro každý. `hardDelete()` NEKONTROLUJE `isActive`/`deletedAt`
před zahájením kaskády deleteMany. Okno závodu:
1. `sweep()` přečte svět W (deletedAt < cutoff) do in-memory pole.
2. Admin zavolá `restore(W)` → DB: `{ isActive: true, deletedAt: null }`.
3. Cron iteruje dál a zavolá `hardDelete(W.id)` → kaskáda smaže VŠECHNA data žijícího světa.
**Dopad:** 🔴 irreverzibilní ztráta dat (celý svět + ~35 kolekcí) po restore v recovery okně.
**Návrh:** `hardDelete()` by měl na začátku re-ověřit `{ deletedAt: { $ne: null } }` — pokud
`deletedAt` je null (svět obnoven), přeskočit. Nebo cron může před `hardDelete` ověřit aktuální
stav: `const w2 = await this.worldsRepo.findById(w.id); if (!w2?.deletedAt) continue;`.
**Úroveň:** L2 🆕

### RC-D8 — [PH] 🟠 deleteGroup vs createChannel → orphan kanál v smazaném kanálu (skupině)
**Kde:** `chat.service.ts:419-451` (deleteGroup) + `chat.service.ts:487-522` (createChannel)
**Popis:**
`deleteGroup()`: (1) `findByGroupId(groupId)` → snapshot kanálů, (2) soft-delete zpráv + delete kanálů,
(3) `groupRepo.delete(groupId)`.
`createChannel()`: (1) `findById(groupId)` — skupina existuje, (2) `channelRepo.save(...)`.
Okno závodu: nový kanál se uloží (`channelRepo.save`) POTÉ, co `deleteGroup` pořídil snapshot,
ale PŘED tím, než smaže skupinu → nový kanál přežije se `groupId` odkazujícím na smazanou skupinu
(orphan, nikdy dočistěný). `ChatGroup` nemá `isDeleted` příznak; `createChannel` nekontroluje skupinu
po save (vzor RC-D3 chybí).
**Dopad:** 🟠 orphan ChatChannel s dangling groupId (nezobrazí se v sidebar listu, ale existuje v DB;
zprávy do něj jdou, ale nikdy zobrazeny → data ztracena).
**Návrh:** Po `channelRepo.save` re-ověřit existenci skupiny (`groupRepo.findById`); pokud zmizela,
soft-delete nového kanálu + 404 (vzor RC-D3/D1).
**Úroveň:** L2 🆕

### RC-D9 — [DP] 🟡 ScheduledMessagesJob: read-then-set bez atomického claimu → double-send
**Kde:** `scheduled-messages.job.ts:25-47` + `scheduled-message.repository.ts:27-36` (findDue) + `:61-67` (setStatus)
**Popis:**
`sendDue()` (@Cron EVERY_MINUTE):
1. `findDue(now)` → čte `{ status: 'pending', sendAt: { $lte: now } }`.
2. Pro každou zprávu: `sendMessage()` (async, yielding) → `setStatus('sent')`.
Žádný atomický claim krok (`findOneAndUpdate { status: 'pending' } → { status: 'processing' }`).
Dva scénáře DP:
  (a) **Restart** mezi `sendMessage()` (OK) a `setStatus('sent')` → na restart znovu `status:'pending'` → double-send.
  (b) **Cron overlap**: NestJS `@Cron` bez `preventOverlap` — pokud `sendDue` trvá >60s (velký backlog
      nebo pomalý `ChatService.sendMessage`), druhý běh spustí souběžně a přečte stejné `pending` zprávy.
      Obě instance zavolají `sendMessage` pro stejné zprávy.
**Dopad:** 🟡 duplikované zprávy v chatu (PJ/uživatel dostane naplánovanou zprávu 2×). Pravděpodobnost
nízká (backlog by musel být velký), ale restart-scénář je reálný kdykoli.
**Návrh:** Atomický claim: `findOneAndUpdate({ status:'pending', sendAt:{$lte:now} }, { $set:{status:'processing'} })` jako iterátor — každý takový call vrátí právě 1 zprávu a atomicky ji zamkne. Při selhání po claim = `status:'failed'` (nebo timeout retry). Alternativa: `preventOverlap: true` v dekorátoru + after-restart recovery scan `{ status:'processing', updatedAt:{$lt: now-2m} } → reset na pending`.
**Úroveň:** L1 🆕

## Pokrytí stávajících D1-D6 (ověřeno kódem)

| ID | Stav v kódu | Ověřeno |
|---|---|---|
| RC-D1 | ✅ `rollbackIfParentGone` ve všech 5 lazy-create getterech (character-subdocs.service.ts:75-87) | Kód L4 |
| RC-D2 | ✅ `assertCanWrite` + `isWorldActive` po save (pages.service.ts:924-959) + characters gate | Kód L4 |
| RC-D3 | ✅ Re-check kanálu po `messageRepo.save` (chat.service.ts:1087-1102) | Kód L4 |
| RC-D4 | ✅ Idempotentní delete (2× 404 bez 500) | Kód L4 |
| RC-D6 | ✅ `handleAssignToScene` + `handleBulkAssign` re-check po `setCurrentScene` (world-operations.service.ts:247-254, 380-391) | Kód L4 |

## PROOF-REQUEST

**PR-D7:** Deterministický gate test `WorldCleanupCron.sweep()` vs `WorldsService.restore()`:
- Gate na `hardDelete.hardDelete` entry point (před prvním `deleteMany`).
- A: sweep načte expirovaný svět W, dosáhne gate.
- B: restore W → `{ deletedAt: null, isActive: true }`.
- A: pokračuje → ověř `worlds.countDocuments({ _id: W.id })` — svět nesmí zmizet po restore.
- Živá infra (NestJS + MongoMemoryReplSet).

**PR-D8:** Deterministický gate test `deleteGroup` vs `createChannel`:
- Gate na `channelRepo.save` v `createChannel`.
- A: `createChannel` ověří skupinu (existuje), dosáhne gate.
- B: `deleteGroup` smaže skupinu i kanály.
- A: uloží nový kanál → ověř `chatgroups.countDocuments({ _id: groupId }) === 0` a `chatchannels.countDocuments({ groupId }) === 0`.
- Živá infra.

**PR-D9:** DP test `ScheduledMessagesJob`:
- Seed 1 pending scheduled message.
- Spustit `sendDue()` 2× souběžně (`Promise.all`).
- Ověř `chatmessages.countDocuments({ channelId })` === 1 (ne 2).
- Živá infra (chatService mock nebo real).

**PR-L5-D1-D3 (Stryker teeth):** Mutace fixů v `rollbackIfParentGone`, RC-D3 re-check, RC-D2 `isWorldActive` — odebráním podmínky musí gate testy zčervenat.
