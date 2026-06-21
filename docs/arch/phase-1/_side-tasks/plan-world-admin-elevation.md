# Plán — Elevation admin pravomocí ve světě

**Spec:** [spec-world-admin-elevation.md](spec-world-admin-elevation.md) (D-1..D-7 schváleno)
**Datum:** 2026-06-21
**Status:** 📝 Návrh plánu — čeká potvrzení

Pořadí: **BE jádro → BE převod 45 bran → BE API/audit/logout → FE**. BE a FE se necommitují v jedné dávce (`feedback_no_mixed_be_fe_batch`). Po BE změnách restart (`feedback_be_restart_required`).

---

## Fáze 0 — BE jádro (skeleton, zatím beze změny chování)

**Cíl:** infrastruktura existuje, ale dokud žádná brána nevolá helper, chování je identické.

### 0.1 Kolekce `world_elevations`
Nový modul dle vzoru `trusted-devices/`:
```
backend/src/modules/world-elevations/
├── world-elevations.module.ts        # @Global (helper potřebuje guard napříč moduly)
├── world-elevations.service.ts       # activate / deactivate / listWorldIdsForUser / deleteAllForUser
├── schemas/world-elevation.schema.ts # { userId, worldId, activatedAt }, collection 'world_elevations'
├── repositories/world-elevations.repository.ts
└── interfaces/world-elevation.interface.ts
```
- Index `{ userId: 1, worldId: 1 }` unique (idempotentní activate). **Žádný TTL** (D-3).
- Service metody:
  - `activate(userId, worldId)` → upsert.
  - `deactivate(userId, worldId)` → delete one.
  - `listWorldIdsForUser(userId): Promise<string[]>` → pro guard.
  - `deleteAllForUser(userId)` → logout hook.

### 0.2 Rozšířit `RequestUser`
[common/interfaces/request-user.interface.ts](../../../../../Projekt-ikaros/backend/src/common/interfaces/request-user.interface.ts):
```ts
elevatedWorldIds?: string[];   // naplní JwtAuthGuard, jen pro role <= Admin
```

### 0.3 Guard naplní stav
[common/guards/jwt-auth.guard.ts](../../../../../Projekt-ikaros/backend/src/common/guards/jwt-auth.guard.ts) `canActivate` — už dělá `usersRepo.findById`. Hned za tím:
```ts
if (request.user && request.user.role <= UserRole.Admin) {
  request.user.elevatedWorldIds =
    await this.elevationService.listWorldIdsForUser(userId);
}
```
⚠️ **Jen pro `role <= Admin`** — běžných uživatelů se extra lookup netýká (výkon).
- DI: `WorldElevationsModule` je `@Global`, takže guard si službu injectne.
- `OptionalJwtAuthGuard` (používá `/worlds/slug/:slug`, `/:id`) — stejné rozšíření, pokud user existuje.

### 0.4 Helper
Nový [common/utils/world-elevation.ts](../../../../../Projekt-ikaros/backend/src/common/utils/world-elevation.ts):
```ts
export function worldAdminBypass(user: RequestUser, worldId: string): boolean {
  return user.role <= UserRole.Admin && !!user.elevatedWorldIds?.includes(worldId);
}
```

**Verifikace F0:** `npx tsc -b` 0, `npx jest --maxWorkers=2` beze změny (žádný test se nehne, helper nikde nevolán).

---

## Fáze 1 — BE převod ~45 bran na helper

**Cíl:** všech ~45 `if (requester.role <= UserRole.Admin)` ve world-scoped kontextu → `worldAdminBypass(requester, worldId)`. Mechanická, jeden modul = jeden commitovatelný krok.

### 1.1 Centrální funkce první (kaskádují na nejvíc volajících)
| Funkce | Soubor:ř. | Dopad |
|---|---|---|
| `getWorldRole` | campaign.service.ts:68 | campaign, characters, gm-notes, accounts, purchase |
| `canManageChat` + `isWorldManagerByUserId` + `assertCanViewWorldChat` | chat.service.ts:100/123/216 | celý chat vč. mazání zpráv (§3.5) |
| `canReadMap` / `assertCanManageMap` | maps.service.ts:66/85 | mapy |
| operations-authorizer (5×) | maps/operations-authorizer.service.ts:57/200/246/278/308 | token/scene operace |
| `isGlobalAdmin` | game-events.service.ts:55 | game-events |
| `assertCanWrite` | pages.service.ts:958 | stránky |

⚠️ **Pozor na signaturu:** některé funkce dnes berou jen `userRole: UserRole` (např. `canReadMap`, `getWorldRole`, emotes/sounds asserty), ne celý `RequestUser`. Helper potřebuje `RequestUser` (kvůli `elevatedWorldIds`). → protáhnout `RequestUser` (nebo `elevatedWorldIds`) do těch signatur. To je hlavní mechanická práce a hlavní riziko (drift volajících).

### 1.2 Zbylé moduly (inline `role<=Admin`)
calendars, world-currencies (2×), world-page-templates, world-weather (3×), weather-generator-set (3×), timeline (2×), world-news, world-export, world-gm-notes, world-calendar-config (2×), worlds.service (`updateMemberRole`:1263, `assertMember`:1918), dungeon-maps, emotes (2×), sounds (3× — pozor: `assertIsAdmin` u **globálních** zvuků NENÍ world-scoped → nechat), world-maps, universe, character-accounts/isWorldStaff (R-02).

### 1.3 Lint guard proti regresi
- Skript/eslint pravidlo: `role <= UserRole.Admin` (a `<= 2`) ve `modules/<world-scoped>/**` = chyba, musí přes `worldAdminBypass`.
- Whitelist: global chat dice (worldId=null), sounds globální, platform admin moduly (admin/, users/).
- Cíl: nová brána nemůže vzniknout mimo režim + důkaz, že se na žádnou nezapomnělo.

**Verifikace F1:** `tsc -b` 0; existující testy se obrátí (admin BEZ elevace už neprojde world bránou) — **upravit dotčené testy** + přidat „elevated projde / de-elevated 403" páry. `npx jest --maxWorkers=2` zelené.

---

## Fáze 2 — BE API + audit + logout

### 2.1 Endpointy (worlds.controller nebo nový elevation.controller)
- `POST /worlds/:worldId/elevation` (JwtAuthGuard) → jen `role<=Admin`, jinak 403. `activate` + audit. Vrací `{ elevated: true }`.
- `DELETE /worlds/:worldId/elevation` → `deactivate` + audit. `{ elevated: false }`.
- Stav pro FE: přibalit `elevated: boolean` do `GET /worlds/my` položek (worlds.service `findMyWorlds`) a do `GET /worlds/slug/:slug` detailu (pro WorldLayout). Lehčí než zvláštní GET.

### 2.2 Audit
[admin_audit_log](../../../../../Projekt-ikaros/backend/src/modules/admin/schemas/admin-audit-log.schema.ts): `action: 'world.elevation.activated' | 'world.elevation.revoked'`, `targetType:'world'`, `targetId: worldId`, `actorId`.

### 2.3 Logout hook
- `auth.service.logoutAll(userId)` → + `elevationService.deleteAllForUser(userId)`.
- `auth.service.logout(refreshToken)` (single) → dekódovat userId z payloadu, pokud lze → `deleteAllForUser`. (Ověřit, že `RefreshTokenPayload` nese userId; jinak elevation padá jen na logout-all + ruční toggle.)

**Verifikace F2:** nové controller/service testy (activate→elevated, deactivate→ne, non-admin→403, logout→smazáno, audit zapsán).

---

## Fáze 3 — FE

⚠️ Samostatná dávka (necommitovat s BE).

### 3.1 API + stav
- `src/features/world/api/useWorldElevation.ts` — `useElevateWorld(worldId)` (POST), `useDeElevateWorld` (DELETE), invalidace `worlds/my` + world detail.
- `elevated` číst z world-status (rozšířený `MyWorldEntry` / world detail v [shared/types](../../../../src/shared/types/index.ts)).

### 3.2 Oprava driftu (jádro)
- [WorldLayout.tsx:312-317](../../../../src/app/layout/WorldLayout/WorldLayout.tsx#L312) `isPJ`/`isPJForNav`: nahradit `currentUser.role <= UserRole.Admin` → `isElevatedHere` (elevated v tomto světě). Owner a membership větve zůstávají.
- [WorldMembershipGuard.tsx:50](../../../../src/features/admin/components/WorldMembershipGuard.tsx#L50): `fallbackGlobalRoles` bypass → podmínit `isElevatedHere`.
- Prověřit ostatní FE místa s `role <= UserRole.Admin` ve world kontextu (router.tsx memberOnly, worldNavConfig) — stejný princip.

### 3.3 UI toggle
- Komponenta `AdminElevationToggle` v hlavičce světa (vedle názvu), viditelná jen `role <= Admin`.
  - de-elevated: 🔓 „Aktivovat admin pravomoci" → confirm → POST.
  - elevated: 🔒 „Složit pravomoci" + vizuální badge/rámeček, že jsem v admin režimu.
- Po toggle: refetch práv (cache invalidace) → UI se překreslí do/ze správného pohledu.
- `mobil-desktop` po grafické úpravě.

**Verifikace F3:** `npm run build` (tsc -b) zelený; FE testy (vitest, explicit importy) pro toggle + guard.

---

## Fáze 4 — dokumentace + uzavření

- **role-audit.md R-20:** přepsat z „admin natvrdo bez moci" → „admin moc uspaná, elevovatelná per-svět" + odkaz na tuto spec.
- **`funkce`** (docs/funkce/): nová schopnost elevation + že admin moc ve světě je nově podmíněná.
- **`napoveda`**: admin/superadmin workflow „nahození práv" (krátký výtah pro hráče-adminy).
- **`slovnicek`**: heslo „Elevation / nahození práv".
- spec status → ✅ Implementováno.

---

## Rizika
- **R1 — zapomenutá brána** (45 míst): mitigace = lint guard §1.3 (nula přímých `role<=Admin`).
- **R2 — signatura `userRole` vs `RequestUser`** (§1.1): nutno protáhnout `elevatedWorldIds` do funkcí co braly jen roli; riziko širokého diffu volajících. Mitigace: `tsc` chytí.
- **R3 — testy:** ~desítky existujících testů spoléhá „admin projde". Všechny se obrátí na „de-elevated admin neprojde". Velký, ale mechanický update.
- **R4 — výkon guardu:** +1 lookup; omezeno na `role<=Admin`. OK.
- **R5 — global chat dice / globální zvuky / admin moduly** nesmí spadnout do režimu (nejsou world-scoped) — whitelist.

## Otevřené k potvrzení před kódem
1. Pořadí OK? (BE F0→F2, pak FE F3) — nebo chceš nejdřív vidět jen drift-fix part?
2. Endpoint umístění: rozšířit `worlds.controller` vs nový `elevation.controller`? (navrhuju worlds.controller — méno modulů).
3. `elevated` stav do `/worlds/my` + world detail (navrhuju), nebo separátní GET?
