# race / 04-mazani — checkpoint RUN-2026-07-11-1213

Styl: race-condition (15.). Registr: `docs/race-condition-audit.md` (prefix RC-).
Oblast: `docs/race-condition-plan/04-mazani.md` — soft-delete race · create v smazaném světě · orphan při delete↔create.
Záběr osy: PH (phantom/orphan) · DP (double-processing) · AT (atomicita) v mazání. Cílová L (plán) = L3.

## Pokrytí (staticky L1-L3 na HEAD)
- `WorldHardDeleteService.hardDelete()` + `WorldCleanupCron.sweep()`
- `WorldsService.softDelete()` / `restore()`
- `ChatService.createGroup/deleteGroup/createChannel/deleteChannel/sendMessage`
- `CharacterSubdocsService` (5 lazy-create getterů + `rollbackIfParentGone`)
- `CharactersService.assertCanManage` + `PagesService.assertCanWrite/isWorldActive`
- `ScheduledMessagesJob.sendDue()` + `MongoScheduledMessageRepository.findDue/setStatus`
- `GameEventReminderJob.sendReminders()` + `processWindow`

## Stav stávajících D1-D6 (ověřeno kódem — všechny DRŽÍ, L4)
| ID | Stav na HEAD | Kotva |
|---|---|---|
| RC-D1 | ✅ `rollbackIfParentGone` v 5 lazy-create getterech | character-subdocs.service.ts:75-87, volání 215/384/431/519/593 |
| RC-D2 | ✅ `isWorldActive` re-check po save (pages) + `assertCanManage` isActive gate (characters) | pages.service.ts:369-379, 1236-1270 · characters.service.ts:90-98 |
| RC-D3 | ✅ re-check kanálu po `messageRepo.save` → soft-delete orphan + 404 | chat.service.ts:1423-1438 |
| RC-D4 | ✅ idempotentní delete (2× → 404, žádné 500) | chat.service.ts:609-639 |
| RC-D6 | ✅ re-check scény po `setCurrentScene` (řešeno v world-operations, mimo tento soubor) | — |

## Změna od RUN-2026-06-20 (minulý checkpoint)

### RC-D7 — ✅ OPRAVENO od minule (bylo 🆕 L2)
`WorldHardDeleteService.hardDelete()` nyní na začátku re-ověří stav světa a přeskočí,
pokud byl mezitím obnoven:
```
// world-hard-delete.service.ts:141-147
// RC-D7 (plný audit 2026-06-20) — restore-race: jediný caller je cron ...
if (!world || !world.deletedAt) {
  return;
}
```
Restore během recovery okna (`deletedAt=null`) → kaskáda se neprovede. Kritický 🔴 nález uzavřen.

**Reziduum (známý no-tx limit, ne nový nález):** mezi kontrolou `deletedAt` (:145) a vlastní
kaskádou `deleteMany` (:189-191) zůstává úzké TOCTOU okno — restore přesně v tomto ms by pořád
smazal živý svět. Pravděpodobnost mizivá (cron 1×/den 03:30 vs. ruční admin restore v témž okamžiku),
bez tx/locku neuzavíratelné (třída D-028 multi-instance / TLA+ limit z README). Ponecháno jako
dokumentovaný strop, ne akční nález.

## Nálezy tohoto běhu

### ♻️ RC-D8 — [PH] 🟠 deleteGroup vs createChannel → orphan kanál v smazané skupině (STÁLE OTEVŘENO)
**Kde:** `chat.service.ts:519-554` (createChannel) + `:442-483` (deleteGroup)
**Úryvek (createChannel — chybí re-check skupiny po save, vzor RC-D3):**
```
519  async createChannel(groupId, dto, requester) {
524    const group = await this.groupRepo.findById(groupId);   // skupina existuje
...
537    const channel = await this.channelRepo.save({ groupId, worldId: group.worldId, ... });
549    this.eventEmitter.emit('chat.channel.created', ...);     // BEZ re-checku skupiny
553    return channel;
```
`deleteGroup` pořídí snapshot kanálů (`findByGroupId`, :458), smaže je + skupinu (:473). Nový kanál
uložený PO snapshotu, ale PŘED `groupRepo.delete` přežije se `groupId` na smazanou skupinu → orphan
(nezobrazí se v sidebaru, zprávy do něj mizí). `ChatGroup` nemá `isDeleted` flag.
**Dopad:** 🟠 osiřelý ChatChannel s dangling groupId; data ztracena. Dočistí se až hard-delete světa.
**Návrh:** po `channelRepo.save` re-ověřit `groupRepo.findById(groupId)`; při zmizení soft-delete
kanálu + 404 (vzor RC-D3/D1).
**Úroveň:** L2 (statická; gate repro = PR-D8 z minula neproveden). Klasifikace: ♻️ recurring (neopraveno od RUN-2026-06-20).

### ♻️ RC-D9 — [DP] 🟡 ScheduledMessagesJob: read-then-set bez atomického claimu → double-send (STÁLE OTEVŘENO)
**Kde:** `scheduled-messages.job.ts:24-47` + `scheduled-message.repository.ts:27-37` (findDue) / `:61-67` (setStatus)
**Úryvek:**
```
24  @Cron(CronExpression.EVERY_MINUTE)
26    const due = await this.repo.findDue(new Date());   // { status:'pending', sendAt:{$lte} }
27    for (const m of due) {
29      await this.chatService.sendMessage(...);          // async, yielding
37      await this.repo.setStatus(m.id, 'sent');          // až PO odeslání
```
Žádný atomický claim (`findOneAndUpdate {pending}→{processing}`), `@Cron` bez `preventOverlap`.
Dva DP scénáře: (a) restart mezi `sendMessage` (OK) a `setStatus('sent')` → po restartu zpráva
znovu `pending` → 2× odeslána; (b) cron overlap při backlogu >60s → dva běhy čtou tytéž `pending`.
**Dopad:** 🟡 naplánovaná zpráva doručena 2×. Restart-scénář reálný kdykoli.
**Návrh:** atomický claim `findOneAndUpdate({status:'pending', sendAt:{$lte:now}}, {$set:{status:'processing'}})`
jako iterátor; nebo `preventOverlap:true` + recovery scan zaseknutých `processing`.
**Úroveň:** L2 (statická). Klasifikace: ♻️ recurring (neopraveno od RUN-2026-06-20).

### 🆕 RC-D10 — [PH] 🟡 Chat create v soft-smazaném světě (RC-D2 fix nechal chat nekrytý)
**Kde:** `chat.service.ts:382-402` (createGroup) · `:519-554` (createChannel) · `:1233-1438` (sendMessage) · guard `canManageChat` :111-122
**Popis:**
RC-D2 opravil „create v soft-smazaném světě" pro `pages` (`assertCanWrite`+`isWorldActive`) a
`characters` (`assertCanManage` čte `isActive`). Chat create cesty ale kontrolují jen membership roli
přes `canManageChat` — **NEčtou `world.isActive`/`deletedAt`**:
```
111  private async canManageChat(requester, worldId): Promise<boolean> {
115    if (worldAdminBypass(requester, worldId)) return true;
116    const membership = await this.membershipRepo.findByUserAndWorld(requester.id, worldId);
120    if (!membership) return false;
121    return membership.role >= WorldRole.PomocnyPJ;   // žádný world-active check
```
`createGroup`/`createChannel`/`sendMessage` tak uloží entitu i do světa s `deletedAt` (30denní
soft-delete okno; kanály se cascade-mažou až při hard-delete). Stejná třída jako RC-D2 (phantom dítě
v mrtvém světě), jen neopravená pro chat modul. Kořen shodný s RC-D2: `worldsRepo.findById` (BaseMongo)
nefiltruje `isActive`, a chat guard ho nečte vůbec.
**Reachability:** jen PomocnyPJ+ (nebo elevovaný admin) přes přímé API — svět je ze soft-deletu v UI 404,
takže není to běžná cesta; ale membership+worldId stačí. Race-úhel: soft-delete během otevřeného chatu
→ zpráva/skupina do právě umírajícího světa.
**Dopad:** 🟡 phantom chat entity (group/channel/message) v soft-smazaném světě; při obnově se objeví,
jinak dočistí hard-delete. Ne datová ztráta prvního řádu, ale nekonzistence proti RC-D2 kontraktu.
**Návrh:** přidat `world.isActive && !deletedAt` check do `canManageChat` (nebo re-check po save u
sendMessage, vzor RC-D2/RC-D3) — sjednotit s pages/characters.
**Úroveň:** L2 (statická). Klasifikace: 🆕 new.

### 🆕 RC-D11 — [DP] 🟢 GameEventReminderJob: stejný read-then-mark bez atomického claimu → duplicitní připomínka
**Kde:** `game-event-reminder.job.ts:32-92`
**Úryvek:**
```
32  @Cron('*/15 * * * *')
...
60      events = await this.gameEventRepo.findUpcoming(from, to, reminderField); // gate = flag nenastaven
70    for (const event of events) {
74        await this.pushService.notifyUsers(...);          // push
83        await this.gameEventRepo.markReminderSent(event.id, reminderField); // až PO pushi
```
Identická třída jako RC-D9 (idempotence gate app-level, ne atomická). Restart mezi `notifyUsers` a
`markReminderSent`, nebo cron overlap, → připomínka odeslána 2×.
**Dopad:** 🟢 duplicitní push notifikace (přechodná, ne persistovaná zpráva) — nižší severita než RC-D9.
Okno menší (cron 15 min, široké 2h okno), restart-scénář reálný.
**Návrh:** atomický claim `markReminderSent` conditional (`findOneAndUpdate {flag:false}→{flag:true}`)
PŘED pushem, push jen když claim uspěl; nebo `preventOverlap`.
**Úroveň:** L2 (statická). Klasifikace: 🆕 new.

## Reziduální / benigní (bez akčního nálezu)
- `WorldsService.softDelete`/`restore` (:1829-1909) = check-then-act read→`update` bez atomické
  podmínky. Souběh softDelete×2 / restore×2 = idempotentní last-write-wins (deletedAt bool+timestamp),
  `world.deleted`/`world.restored` cascade idempotentní. softDelete vs restore se vzájemně vylučují přes
  `deletedAt` guard. Benigní — neescaluji.

## Dosažená vs cílová L
| Nález | Dosaženo | Cíl |
|---|---|---|
| D1-D6 (stávající) | L4 (fix + bariéra zelená z předchozích běhů) | L4 ✅ |
| RC-D7 | ✅ opraveno (kód L4; gate repro PR-D7 neproveden) | L3 |
| RC-D8 (♻️) | L2 (statická) | L3 (gate PR-D8) |
| RC-D9 (♻️) | L2 (statická) | L3 (gate PR-D9) |
| RC-D10 (🆕) | L2 (statická) | L3 (gate) |
| RC-D11 (🆕) | L2 (statická) | L3 (gate) |

## PROOF-REQUEST (živá infra, neproveden — READ-ONLY audit)
- **PR-D10:** seed svět → soft-delete → přímé `createChannel`/`sendMessage` jménem PJ → ověř 404/reject,
  ne uložená entita v `deletedAt` světě (analogie RC-D2 db-lifecycle testu).
- **PR-D11 / PR-D9:** 2× souběžné `sendReminders()` / `sendDue()` (`Promise.all`) → ověř push/zpráva 1×, ne 2×.
- **PR-D8:** gate na `channelRepo.save`; mezitím `deleteGroup` → ověř `chatchannels.count({groupId})===0`.
