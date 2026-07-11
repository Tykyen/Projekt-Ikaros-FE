# checkpoint race / 00-cross-cutting — RUN-2026-07-11-1213 · L2-L3 (statika)

READ-ONLY. Prefix RC-. Registr: `docs/race-condition-audit.md`. Plán: `docs/race-condition-plan/00-cross-cutting.md`.
BE HEAD (nespuštěno — harness by dal L4, zde statická L2-L3).

## Stav infrastruktury (harness / proof-vrstvy)
- Harness `race-barrier.ts` (Barrier/Gate/withBarrier/withGate) + `app-factory.ts` (lazy require) + 7 spec souborů = **L3 hotové**. Race e2e 26/26 dle registru.
- **M-TLA:** `tla/money.cfg` UŽ EXISTUJE (od minule chyběl) — `CONSTANTS a1/a2/a3, MaxAmount 2, InitBalance 3`, `INVARIANT NoOverdraft`+`TypeOK`, `CHECK_DEADLOCK FALSE`. ⚠️ Ověřuje JEN NoOverdraft; **MoneyConserved vědomě vynechán** (Debit zmenšuje sumu) → zachování při čistém transferu formálně NEpokryto (dokumentováno v cfg, „money_transfer_only.tla" mimo scope). TLC běh sám nedoložen → **PROOF-REQ zůstává** (spustit `java -jar tla2tools.jar -config money.cfg money.tla`, ověřit zelený).
- **M-MUT (Stryker):** `stryker.conf.json` on-demand, `npx stryker run` stále nedoložen → **PROOF-REQ**.
- **M-MODEL (fast-check):** `economy.model.race.e2e-spec.ts` pořád jen **I1** (`balance=Σdelta`); I2 conservation / I3 idempotence / I4 krytí neimplementovány = **RC-RUN-06 stále open**.

## 🔓 Přetrvávající nálezy z minulého cross-cutting běhu (RUN-2026-06-20) — VŠECHNY stále na HEAD, neopraveno
- **RC-RUN-01 [LU] 🟠** `character-accounts.service.ts:227-289` `changeCurrency(convert:true)`: read `getAccount` → přepočet → `replaceMoneyFields($set)` bez session/podmínky. Souběžný `adjust` mezi read↔write → `balance≠Σdelta` (single-instance tiše).
- **RC-RUN-02 [LU] 🟠** `character-accounts.service.ts:708/726/748` `addCoOwner`/`removeCoOwner`/`transferPrimaryOwnership` + **:859 `onCharacterDeleted`** — všechny read `ownerCharacterIds` → `$set` celého pole. Dva souběžné → jeden co-owner zmizí. Fix = `$addToSet`/`$pull`.
- **RC-RUN-04 [LU] 🟠** `character-accounts.service.ts:480-502` `undoLastOnce` fallback (non-replSet, řádek 470) = read + `$set(transactions.slice(0,-1))` bez session. Na single-instance prod (majorita) vrací původní RC-E3 zranitelnost. Fix = `$pop`+`$inc`.
- **RC-RUN-03 [AT] 🟠 ♻️** `worlds.service.create` multi-step (world→membership→currencies→weather→calendar) bez `withTransaction` → pád = svět bez PJ/seedů. = **DI-04** (db-integrity/cascade audit) — křížově, nezdvojovat.
- **RC-RUN-05 [DP] 🟡** `campaign-purchase.service.ts` refund brzký `status!=='active'` check je ne-atomická návnada; jediná záruka = `markRefundedIfActive`. Architektonické riziko (ne aktivní bug).

## 🆕 RC-RUN-07 [LU] — SYSTÉMOVÝ append-přes-read-then-`$set`-celého-pole mimo peněžní cestu
Atomický CAS (`$push`/`$addToSet`) je nasazen POUZE na peněžní cestě (`appendTransaction*`). Zbytek codebase appenduje do polí idiomem „read entity → `[...arr, new]` → `repo.update($set celého pole)". Dva souběžné appendy stejného dokumentu ze zastaralého snímku → druhý `$set` přemaže první → **ztracený prvek** (LU). Reprezentativní (ověřeno = read+full-array `$set`):
- 🟠 `game-events.service.ts:421` comments append · **:373 confirmedBy** (RSVP) · **:559 reactToComment** (`comments.slice()`+`$set`) · :553 reakce — dvě akce na týž event → ztráta komentáře / RSVP / reakce. Repo `update` = `$set` celého patche.
- 🟠 `chat.service.ts:2226` `allowedMemberIds:[...channel.allowedMemberIds,userId]` (join kanálu → ztráta členství = access) · :1638 attachments.
- 🟠 `ikaros-discussions.service.ts:711 managerIds` · :769 joinRequestIds · :423/:809 invitedUserIds — ztráta manažera/žádosti/pozvánky (governance).
- 🟡 `global-chat.service.ts:608` reactions (whisper reaction) · `ikaros-gallery.service.ts:600/642` favorites/pinned · `ikaros-articles.service.ts:717/759` favorites/pinned · `ikaros-discussions.service.ts:458/501/686` favorites/pinned/liked — kosmetický drift lajku/oblíbené/reakce.
- L2 statika (bez barrier repro). Fix vzor = `$push`/`$addToSet`/`$pull` na konkrétní pole (analogie RC-E4 inventář). Priorita: confirmedBy/comments/allowedMemberIds/managerIds (viditelná ztráta dat/přístupu), zbytek 🟡.

## ♻️ Nález(y) pokryté jinde (nezdvojovat)
- **Cross-instance atomický claim** (double-send scheduled-messages/reminder jobs, chybějící distributed lock u sweep cronů) = **ext-41 (styl 41)** — `scheduled-messages.job:24`, `game-event-reminder.job:32`.
- **Float měna** (`balance:number`, `$inc` drift, `balance=Σdelta` se rozjede) = **ext-41 + race-01 (RC-E-float)**. RC-RUN-01/04 jsou LU okno, nezaměňovat s float třídou.

## Verdikt
Cross-cutting infra L3+ solidní (Barrier/Gate, cfg doplněno). Otevřené: 2 PROOF-REQ (TLC běh, Stryker běh) + RC-RUN-06 (model jen I1). Nový systémový nález **RC-RUN-07** (append-LU napříč non-money moduly) — root identický s RC-E4/RC-P2/RC-RUN-02, atomický CAS se nepropagoval. Fixy peněžní/access cesty gated souhlasem, BE-only, netriviální (dluh D-8.6-replica-set + CAS refactor). Registr přepsat NEMÁM (read-only) — nález předat k zápisu RC-RUN-07.
