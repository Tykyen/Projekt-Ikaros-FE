# Checkpoint — race / 03-role

Styl: race-condition (15.) · prefix `RC-` · registr `docs/race-condition-audit.md` · oblast `docs/race-condition-plan/03-role.md`
RUN 2026-07-11-1213 · READ-ONLY · hloubka L2-L3 (statika + analýza interleave, bez nového deterministického repro)
BE: `Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts` (+ `repositories/world-membership.repository.ts`)
Pozn.: e2e `roles.race.e2e-spec.ts` RC-R1..R4 procházejí (zadáno).

## Re-verifikace dřívějších nálezů proti HEAD

| ID | Verdikt HEAD | Citace |
|---|---|---|
| RC-R1 (WS last-PJ) | ✅ DRŽÍ — `world.ownerId===membership.userId` → `WORLD_OWNER_ROLE_IMMUTABLE`, owner je vždy PJ → ≥1 PJ | worlds.service.ts:1492 |
| RC-R2 (CD playerCount) | ✅ DRŽÍ — atomický `updateRoleIfChanged` (`findOneAndUpdate {_id, role:{$ne}}`, `new:false`) → inc jen při reálném přechodu; i neidempotentní souběh (Ctenar→Hrac ∥ Ctenar→PomocnyPJ) konverguje, `prev` je zachyceno atomicky per-op | worlds.service.ts:1512-1536 · world-membership.repository.ts:167-182 |
| RC-R3 (TOCTOU transfer) | ⚠️ ČÁSTEČNĚ — viz níže ♻️ | worlds.service.ts:2148-2182 |
| RC-R4 (DP double-approve) | ✅ DRŽÍ — unique `{userId,worldId}` + E11000 ošetřeno v tx větvi i sekvenčním fallbacku (single-instance prod) | schema:117 · worlds.service.ts:972-984, 1032-1039 |
| RC-R5 (SR stale-role) | ✅ částečně — role requestera čtena fresh per-request z DB (ne z JWT); ale check-then-act okno viz 🆕 RC-R6 | worlds.service.ts:1469 |

## Nálezy

### 🆕 RC-R6 — authz TOCTOU v `updateMemberRole` ceiling (TOCTOU/SR, 🟠 nízká zneužitelnost, L2)
Cíl (`membership`) čten na :1460, ceiling authz rozhoduje z **zastaralého** `membership.role` (:1500), ale atomický zápis `updateRoleIfChanged(id, role)` filtruje POUZE `role:{$ne:targetRole}` — NEváže from-roli, kterou ceiling autorizoval (repo:173). Mezi readem a zápisem se cílová role může zvednout nad strop requestera → PomocnyPJ smí zdemotovat člena, který byl mezitím povýšen na PJ (update proběhne bezpodmínečně z jakékoli from-role). Ceiling-invariant „nesmíš měnit člena s rolí ≥ své" pod souběhem neplatí. Stejný kořen jako celý audit: read-modify-write bez atomické DB podmínky — jenže tady na AUTHZ predikátu, ne na counteru. Fix vzor: zahrnout očekávanou from-roli do filtru `findOneAndUpdate` (`{_id, role: expectedFrom}`) nebo re-verifikace po zápisu. Zneužitelnost nízká (vyžaduje souběžné legitimní povýšení načasované do okna, timing útočník neřídí).

### ♻️ RC-R3 residual — transferOwnership TOCTOU re-checkem nezavřen úplně (TOCTOU/PH, 🟠 úzké, L2)
Fix (re-check `stillMember` po zápisu ownerId + rollback, :2164) kryje interleave „leave mezi read↔write transferu". Zbývá symetrické okno: `leave(newOwner)` přečte svět se **starým** ownerId (guard `world.ownerId===requester.id` na :1956 tak neblokuje co-PJ), a jeho `membershipRepo.delete` commitne AŽ PO re-check readu transferu (:2164) → transfer uspěje, poté delete → `world.ownerId` → uživatel BEZ membershipu = vlastník-duch (přesně invariant, který měl RC-R3 chránit). Rollback je navíc best-effort (`.catch(()=>undefined)`, :2172). Plné uzavření = transakce nebo atomický guard leave proti aktuálnímu `world.ownerId`.

### 🆕 minor — dvojitý transferOwnership (WS, 🟡, L2)
2 souběžné transfery téhož ownera na X a Y: oba projdou isOwner (:2104), oba demotují starého ownera→PomocnyPJ (:2143), last-writer-wins na `ownerId` (X∨Y). Re-checky projdou (X i Y členové → žádný duch), ale jeden transfer vrátí `updated` se svým ownerId, který v DB nevyhrál (lživý success), a zůstane bludný co-PJ. Bez ducha, invariant „1 owner-člen" drží; nízká pravděpodobnost (týž owner 2× naráz).

### 🟢 pozn. — playerCount inc mimo transakci (AT/partial-failure)
`updateRoleIfChanged` a `worldsRepo.increment(playerCount)` (:1533-1536) nejsou atomicky spřažené; pád mezi nimi → counter o 1 vedle. Známý „soft" derived counter (DI-05), $inc komutativní, souběh sám drift nezpůsobí. Pouze crash-window, ne race. Bez akce.

## Závěr
Opravené závody R1/R2/R4/R5 na HEAD drží. R3 fix je částečný (♻️ residual ghost-owner okno). Nový L2 nález RC-R6 (authz TOCTOU v ceiling — atomický update neváže from-roli). Vše L2 (statika/analýza); deterministické repro (Barrier/Gate) nenapsáno — READ-ONLY. Fixy gated souhlasem.
