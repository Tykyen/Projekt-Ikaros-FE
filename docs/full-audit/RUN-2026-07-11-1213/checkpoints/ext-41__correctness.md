# ext-41 — Korektnost cross-instance/čas/číslo · dosažená L3

## Topologie: prod = 1 BE replika (docker-compose.prod.yml:77), ale SOCKET_IO_REDIS=1 → škálování plánováno.
Cross-instance nálezy jsou LATENTNÍ dnes, 🔴 při přidání 2. repliky. Brána PŘED škálováním.

## 🔴 double-send (read-then-act bez atomického claimu):
- `chat/scheduled-messages.job.ts:24-37` findDue(pending) → send → setStatus odděleně → 2 repliky pošlou 2×. `setStatus` (repo:66) je prostý $set bez pending filtru.
- `game-events/game-event-reminder.job.ts:32` findUpcoming → push → markReminderSent (bezpodm $set repo:95) → 2× push.
FIX: findOneAndUpdate({status:'pending'|[field]:{$ne:true}},{$set sending/sent}) PŘED akcí; status enum +'sending' + reaper na uvízlé. Test: cross-instance/*.race.e2e-spec (2× souběžně → 1 odeslání).

## 🔴 float měna:
- `character-account.schema.ts:22` balance:number (Double); `$inc:{balance:delta}` (repo:89,115), rate 0.01/0.1 (world-currencies:167). Overdraft guard SÁM atomický (findOneAndUpdate balance:$gte, RC-E1 ✅), ale float drift → invariant balance=Σdelta se rozjede + `$gte` na hraně odmítne/pustí špatně. changeCurrency přepočet historie násobí drift.
FIX: integer-cents (balanceMinor:int + currency.minorUnits) NEBO Decimal128 + migrace. Test: 1000×$inc(+0.01)==10.00.

## 🔴 timeZone chybí:
- `global-chat/camp-rotation.job.ts:19` `0 0,12 * * *` bez timeZone → běží UTC ne Prague. FIX: `timeZone:'Europe/Prague'`. (health heartbeat kosmetika.)

## ⭐ distributed lock chybí u sweep cronů (world-cleanup, account-cleanup, clean-messages) → 2× cascade/emit/Cloudinary delete. FIX: Redis SET NX PX lock / @RunOncePerCluster util.

## ⭐ offset-paginace bez _id tiebreaku: world-news.repository:79 (date je STRING!), content-reports:66, ikaros-discussion-posts:43, admin-audit-log:38. FIX: sort({key:-1,_id:-1}). Chat/ikaros-messages OK (keyset _id cursor).

## 🟢 slug/collation N/A — slugy kebab-case validované, žádná auto-latinizace.

## Fix status: camp-rotation timeZone = FIXNU (triv). Atomický claim scheduled-msg+reminder = FIXNU (BE test-first). _id tiebreak = FIXNU (BE). Distributed lock + integer-cents = STŘEDNÍ/migrace → zvážit/dluh + prodiskutovat.
