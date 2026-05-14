# Plán D-053b — Per-world membership guard

**Vychází z:** [spec-d053b-membership-guard.md](spec-d053b-membership-guard.md)
**Datum:** 2026-05-14

---

## Aktuální stav (audit před implementací)

### BE — `MapsService` ([backend/src/modules/maps/maps.service.ts](../../../../../../Projekt-ikaros/backend/src/modules/maps/maps.service.ts))
- `assertCanManage(userId, userRole, worldId)` už **má membership-based check** (D-053 ho přidalo).
- `moveToken(sceneId, dto, userId, userRole)` a `removeToken(sceneId, tokenId, userId, userRole)` **stále** používají `userRole <= UserRole.PJ` (globální). World PJ daného světa, který by měl být povolen jako *non-self token mover*, dnes propadne na `MAP_TOKEN_NOT_OWNER` 403.

### FE
- `WorldContext` ([src/features/world/context/WorldContext.tsx](../../../../src/features/world/context/WorldContext.tsx)) poskytuje `userRole: WorldRole | null` a `loading: boolean` — perfektní zdroj.
- `RoleGuard` ([src/features/admin/components/RoleGuard.tsx](../../../../src/features/admin/components/RoleGuard.tsx)) — globální only.
- `router.tsx` — 2 per-world admin routes pod `WorldLayout`: `admin/stranky`, `admin/adresar-postav`. Plus `admin/dungeon-builder` v `IkarosLayout` (NE per-world; komentář D-053b u něj je matoucí — zůstává Sa/Admin).

## Kroky

| # | Krok | Soubory |
|---|---|---|
| 1 | **BE** — vyměnit `userRole <= UserRole.PJ` v `moveToken/removeToken` za membership check (využít `assertCanManage` jako predikát) | `maps.service.ts` |
| 2 | **BE** — testy: 4 scénáře (Sa, Admin, world-PJ daného světa, world-PJ jiného světa) | `maps.service.spec.ts` |
| 3 | **FE** — nová komponenta `WorldMembershipGuard` (loading → Spinner, fallbackGlobalRoles → bypass, membership >= minWorldRole → pass, jinak ForbiddenPage) | `src/features/admin/components/WorldMembershipGuard.tsx` (nový) |
| 4 | **FE** — `router.tsx`: 2 per-world routes na nový guard, odstranit TODO komentáře. `admin/dungeon-builder` zůstává `RoleGuard` (NE per-world); přepsat komentář aby přestal odkazovat na D-053b. | `src/app/router.tsx` |
| 5 | **FE** — testy: parametrizovaný test pro `WorldMembershipGuard` (5 scénářů — anon, Sa, Admin, PJ daného světa, Hrac daného světa) | `WorldMembershipGuard.test.tsx` (nový) |
| 6 | **Cleanup** — `dluhy.md` D-053b uzavřít, spec/plán označit Done | `docs/dluhy.md`, oba spec/plán md |

## Otevřená rozhodnutí (z bodu spec §5)

| Q | Rozhodnutí pro tento plán |
|---|---|
| Q1: worldId odvodit z mapId | ✅ Ano — service interní lookup, klient nemění. |
| Q2: WorldMembershipGuard vedle RoleGuard | ✅ Vedle. RoleGuard zůstává pro platformní routes. |
| Q3: Loading → Spinner | ✅ Ano. |
| Q4: Pending (Žadatel) implicit deny | ✅ Pending nikdy nepustí přes `minWorldRole={WorldRole.PJ}`. |
| Q5: Forbidden místo redirect | ✅ ForbiddenPage. |

## Akceptační kritéria (převzato ze specu §7)

- [x] Audit stavu před implementací — hotov.
- [x] BE: world PJ může hýbat tokeny v daném světě.
- [x] BE: world PJ jiného světa → 403 (`MAP_TOKEN_NOT_OWNER`).
- [x] BE testy zelené (+4 nové scénáře, celkem 40/40 maps modul).
- [x] FE: `WorldMembershipGuard` existuje + **7 testů** zelených (1 nad spec — pending implicit deny).
- [x] FE: 2 per-world admin routes migrovány (`admin/stranky`, `admin/adresar-postav`).
- [x] FE: TODO komentáře v `router.tsx` k D-053b odstraněny / aktualizovány (DungeonBuilderPage je platformový, nepatří k D-053b).
- [x] `docs/dluhy.md` D-053b přesunut z Otevřené pryč.
