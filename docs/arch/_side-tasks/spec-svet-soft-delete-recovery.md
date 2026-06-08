# Spec — Soft-delete světa s 30denní obnovou (recovery)

> Samostatný lifecycle úkol. Vzor: account self-delete ([[project_self_deletion_architecture]], `plan-N6b-self-deletion.md`). Stav: **✅ IMPLEMENTOVÁNO (2026-06-08)** — vč. plného cascade, cron cleanup, account-vazby, FE delete tab + admin recovery panel. BE jest 110 (9 recovery), FE build ✓.

## Implementováno (rozhodnuto „vše teď, bez odložených dluhů")
- Schema `deletedAt`/`deletedBy` + repo `findDeleted`/`findExpiredDeleted`.
- `WorldsService.softDelete` (+timestamp, idempotence), `restore` (Admin-only, 30d okno→410 Gone, optional newOwnerId = převzetí), `listDeleted`.
- Controller `POST /worlds/:id/restore`, `GET /worlds/deleted`.
- `WorldHardDeleteService` — **centralizovaný cascade** přes ~40 world-scoped kolekcí (1 seznam, generický `deleteMany({worldId})` + subdocy bez worldId přes characterId).
- `WorldCleanupCron` (denně 03:30) — po 30d hard-delete + emit `world.hardDeleted`.
- Chat: `world.restored` @OnEvent (un-soft-delete); **fix:** world-level soft-delete už NEnuluje `content` zpráv (recovery-safe).
- **Account-vazba:** `@OnEvent('user.deletion.hardDeleted')` → soft-delete vlastněných světů (pojistka při sebrání PJ účtu).
- FE: tab „Smazat svět" (WorldSettings, PJ+Admin) + admin „Smazané světy" panel (zbývá X dní + Obnovit) + hooky `useWorldLifecycle`. Nápověda aktualizována.
- **Follow-up** (transfer ownership self-service request hráče, reminder mail) ponecháno — nebyly v zadání; převzetí přes `newOwnerId` při admin restore HOTOVO.

## Motivace
Smazání světa je dnes nevratné z pohledu uživatele (`isActive: false`, žádná obnova). Riziko: PJ omylem nebo ve vzteku smaže svět → ztráta veškerého obsahu (stránky, postavy, chat, mapy…). Cíl = **pojistka proti ztrátě dat**:
- Hráči můžou zažádat o obnovení / převzetí světa, když PJ odejde.
- Při sebrání PJ účtu se světy neztratí.

## Záměr (potvrzeno s PJ)
- **PJ (vlastník) i Admin/Superadmin** smí svět smazat tlačítkem → svět zmizí z provozu, **data zůstanou** (soft-delete).
- **Obnovit umí jen Admin/Superadmin**, do **30 dní** → svět do původního stavu. PJ musí o obnovu požádat.
- Po **30 dnech** se svět **trvale smaže** (hard-delete) i s daty.

## Současný stav (ověřeno)
- `WorldsService.softDelete` ([worlds.service.ts:1484](../../../../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L1484)): `isActive: false` + emit `world.deleted`. Permission `canAdminWorld` = **Admin/Superadmin NEBO world PJ**.
- `world.schema`: má `isActive` (default true), `ownerId`. **Nemá** `deletedAt`/`deletedBy`.
- `isActive: false` skryje svět ze **všech** GET (findBySlug / findByOwner / public list) — zmizí z provozu ✓.
- `world.deleted` konzumenti: `chat.service` (`softDeleteByWorldId` channels+messages — **taky soft**, data zůstanou ✓), `worlds.gateway` (WS `world:deleted` emit).
- **Žádná** restore metoda, **žádný** retenční timestamp, **žádný** hard-delete cleanup.

→ Polovina infrastruktury existuje (soft cascade). Chybí: timestamp, recovery, cron cleanup, FE.

## Návrh — BE

### Schema (world)
- `deletedAt?: Date | null` (default null) — kdy soft-smazáno; null = aktivní.
- `deletedBy?: string | null` — userId iniciátora (audit + „kdo smazal").

### Soft-delete (`softDelete`)
- Permission beze změny: PJ vlastník + Admin/Superadmin (`canAdminWorld`).
- `update(id, { isActive: false, deletedAt: now, deletedBy: requester.id })`.
- Emit `world.deleted` (stávající soft cascade — chat atd.). **Nedestruktivní.**
- Idempotence: už smazaný → 400/no-op.

### Restore (`restore`) — NOVÉ
- Permission: **jen Admin/Superadmin** (`requester.role <= UserRole.Admin`) — ne PJ.
- Guard: svět musí být soft-deleted (`deletedAt != null`) a v okně (`now - deletedAt <= 30 dní`); po okně 410/už hard-smazán.
- `update(id, { isActive: true, deletedAt: null, deletedBy: null })`.
- Emit `world.restored` → nový `@OnEvent` v chat.service: **un-soft-delete** channels+messages (`restoreByWorldId`).
- ⚠️ Konzistence: restore musí vrátit VŠE, co soft-delete cascade zhaslo. Audit konzumentů `world.deleted` → ke každému párový restore.

### Hard-delete cleanup (cron) — NOVÉ
- `WorldCleanupCron.sweep` (denně, vzor `AccountCleanupCron`): světy `deletedAt < now - 30d` → hard-delete.
- Emit `world.hardDeleted` → moduly @OnEvent **trvale** mažou world-scoped data (event-driven, vyhne se DI cyklu — vzor [[project_self_deletion_architecture]]).
- ⚠️ **Rozsah cascade** = všechny world-scoped kolekce (pages, characters, character_subdocs, worldnews, chat, calendars, maps, game-events, world-settings, memberships, …). Soupis + per-modul `@OnEvent('world.hardDeleted')` handler = největší část impl; řešit po krocích, ale cíl = úplný úklid.
- Nakonec smaž samotný `world` dokument.

## Návrh — FE
- **Delete tlačítko** (PJ + Admin) — ověřit, kde dnes je (world settings?), doplnit potvrzovací dialog s textem: „Svět zmizí. Obnovit do 30 dní umí jen administrátor — napiš mu."
- **Admin recovery panel** (ADMINISTRACE): seznam soft-deleted světů — název, vlastník, `deletedAt`, **zbývá X dní**, tlačítko **Obnovit**. Reuse admin tabulkový vzor (ne nový vizuál).
- GET pro admin: nový endpoint `GET /worlds/deleted` (Admin only) — vrací soft-deleted světy (běžný GET je `isActive:true` filtruje pryč).

## Permission matice
| Akce | PJ (vlastník) | Admin/Superadmin | Hráč |
|---|---|---|---|
| Smazat svět (soft) | ✅ | ✅ | ❌ |
| Obnovit (do 30 dní) | ❌ (požádá Admina) | ✅ | ❌ |
| Vidět seznam smazaných | ❌ | ✅ | ❌ |

## MVP vs follow-up
**MVP:** schema, soft-delete + deletedAt/deletedBy, restore (Admin), cron hard-delete, FE delete dialog + admin recovery panel, cascade hlavních kolekcí.
**Follow-up (samostatné):**
- **Převzetí světa** (transfer ownership při obnově — hráč přebere po odchodu PJ).
- **Vazba na smazání účtu** — hard-delete PJ účtu → jeho světy soft-delete (ne ztratit). Rozšíření `AccountCleanupCron`.
- Reminder mail PJ („svět bude za 7 dní trvale smazán").

## Otevřené body (potvrď při schválení)
1. **Délka okna 30 dní** — OK, nebo jiná?
2. **Hard cleanup cascade** — cíl je smazat úplně všechna world-scoped data. Souhlas, že to může být víceкrokové (nejdřív hlavní kolekce, pak doplnit)? Nebo musí být kompletní hned?
3. **Převzetí světa hráčem** + **account-deletion vazba** — potvrzuji jako **follow-up** (ne MVP). OK?
