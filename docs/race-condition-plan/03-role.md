# 03 — Souběžné změny rolí / členství

> Test: [`roles.race.e2e-spec.ts`](../../../Projekt-ikaros/backend/test/race/roles.race.e2e-spec.ts).
> **Hotovo:** race 3/3 zelený, worlds unit 117/117 (R2 opraveno; R1/R4 vyvráceny).

## Nálezy

| ID | Třída | Verdikt | Fix |
|---|---|---|---|
| **RC-R1** | TOCTOU/WS 🟠 | ✅ DRŽÍ — „svět bez PJ" přes demote je **nedosažitelné**: roli vlastníka nelze měnit ([worlds.service.ts:1258](../../../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L1258) `WORLD_OWNER_ROLE_IMMUTABLE`) → ≥1 PJ vždy. 2 souběžné demote vlastníka → oba 403. **Hypotéza vyvrácena.** | — |
| **RC-R2** | CD 🟡 | 🐛 POTVRZENO (playerCount +2 místo +1) — `wasPlayer` se počítal z readu před zápisem; 2 idempotentní Ctenar→Hrac → oba `$inc(+1)` | ✅ `updateRoleIfChanged(id, role)` = `findOneAndUpdate({_id, role:{$ne}})` vrací stav PŘED změnou nebo null → inc jen při skutečném přechodu |
| **RC-R3** | TOCTOU 🟠 | ⬜ analýza — `transferOwnership` ([:1804](../../../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L1804)) dělá non-atomic read+update přes 2 memberships + world bez tx; souběžný leave by mohl nechat vlastníka bez membershipu. Nižší priorita (vzácný souběh), deterministicky netestováno. | navrženo: tx nebo re-verify po update |
| **RC-R4** | DP — | ✅ DRŽÍ — double-approve → 1 membership (unique `{userId,worldId}`), žádné 500 | — |
| **RC-R5** | SR — | ✅ pravděpodobně — autorizace čte roli **fresh per-request** z DB (ne z JWT) → demote-while-acting se projeví; analýza, netestováno | — |

## Metodika
- **RC-R2:** `Barrier(2)` na `membershipRepo.update` → oba requesty přečtou roli Ctenar před zápisem → reprodukce driftu. Po fixu jde cesta přes `updateRoleIfChanged` (atomický conditional) → druhý request vrátí null → bez inkrementu.
