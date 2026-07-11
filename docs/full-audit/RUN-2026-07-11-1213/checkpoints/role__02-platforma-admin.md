# Checkpoint — role / 02 Platforma-admin

RUN: RUN-2026-07-11-1213 · READ-ONLY hloubkový audit · oblast `docs/role-plan/02-platforma-admin.md`
Registr: `docs/role-audit.md` (prefix R-) · Osy: `PA` `ES` `EN` `LK` `OW` `DD` · Metody M1 (static read) + M2 (kontrakt FE↔BE)

## Dosažená vs cílová L
- **Dosaženo: L2** (statické čtení guard/assert obou stran + ověřená kontrakt-parita FE↔BE) plošně přes A–E.
- Cíl plánu: role body L2+, bezpečnost (ES/OW/LK) L3+. **L3 pokryto existujícími specy** (nespouštěny v tomto běhu): `admin/helpers/hierarchy.spec.ts`, `admin.service.spec.ts` (admin 13/13 +5 R-05 dle registru jest 2225/2225). M8 red-team neproveden (read-only).

## Výsledek: BEZ NOVÝCH NÁLEZŮ (L2)
Oblast 02 byla plně sweepnutá (vlna 1+2); od té doby se admin povrch **rozrostl** (bulk akce, Podporovatel, friendships, growth/costs, username-requests) — všechny nové endpointy jsou správně gated a hierarchii vynucuje service. Všechny PL body ✅ nebo ♻️ známé.

## Pokrytí bodů plánu

### A. Admin endpointy & guardy
- **PL-01 ✅ L2** — `AdminController` třídní `@UseGuards(JwtAuthGuard)` [admin.controller.ts:57-58]; KAŽDÝ endpoint má navíc `AdminGuard` NEBO `RolesGuard+@Roles`. Žádný jen JwtAuthGuard. Nové endpointy (`supporter`, `bulk-*`, `friendships*`, `stats/*`, `username-requests*`) = `AdminGuard`. `AdminGuard` = `role > Admin → 403` [admin.guard.ts:17].
- **PL-02 ✅ L2 ♻️R-05** — `PATCH admin-permissions` = `RolesGuard+@Roles(Superadmin,Admin)` [admin.controller.ts:252-254]; service [admin.service.ts:693-714] Admin bez `canManageAdmins` → 403, flag `canManageAdmins` smí měnit jen Superadmin (`SUPERADMIN_ONLY_FLAG`). Guard permisivní, service autoritativní (DD).
- **PL-03 ✅ L2** — oba `RolesGuard` v admin (admin-permissions, recent-pages) mají `@Roles(...)`. RM-15 drží.
- **PL-04 ✅ L2** — `updateUserRole`→`assertCanChangeRole` [hierarchy.ts:44]: self→403 SELF_MODIFICATION; Admin nesmí měnit roli admina ani povyšovat na admin role (Superadmin/Admin). `createUser` používá stejný check (dummy target). `bulkRoleChange` iteruje `updateUserRole` → hierarchie per-user.
- **PL-05 ✅ L2** — ban/unban/create/audit-log/stats/friendships = `AdminGuard`; ban/delete přes `assertCanModerate` (admin-na-admin blok, DELETE/UNDELETE navíc `canModerateContent`). Žádný neprosákne na PJ/Spravce.
- **PL-06 ✅ L2 ♻️area00-K2** — `GET recent-pages` = `@Roles(Superadmin,Admin)` [admin.controller.ts:400-404]; mrtvý legacy `UserRole.PJ(3)` odstraněn (komentář R-01/N-14). Service `getRecentPages` bez PJ větve [admin.service.ts:837-842].

### B. Granular adminPermissions
- **PL-07/08/09/10 ✅ L2 ♻️R-05** — `canManageAdmins` gatuje admin-permissions delegaci (service enforce); `canModerateContent` gatuje user DELETE/UNDELETE [hierarchy.ts:98-105]; `canEditPlatformPages` = nikde nečten → **FE toggle skryt** [UsersTable.tsx:368-369], BE field ponechán (dluh). FE: `canManageAdmins` toggle jen Superadmin, `canModerateContent` i Admin-manager [UsersTable.tsx:91-97,329-367]. Klamavé UI vyřešeno.

### C. Správci obsahu & ikaros obsah
- **PL-11/12/13 ✅ L2 (parita FE↔BE)** — BE `ADMIN_ROLES`: články `[Superadmin,Admin,SpravceClanku]` [ikaros-articles.service.ts:31], galerie `[…,SpravceGalerie]` [ikaros-gallery.service.ts:29], diskuze `[…,SpravceDiskuzi]` [ikaros-discussions.service.ts:29]. FE `REVIEWER_ROLES` = **identické** [ArticleDetailPage.tsx:38 / GalleryDetailPage.tsx:29 / DiscussionDetailPage.tsx:37]. assertAdmin na approve/reject/findPending/bulk. `assertAdmin` mezi-typové: SpravceGalerie neprojde na článek (jiný set).
- **PL-14 ✅ L2 ♻️R-10** — žádné `UserRole.PJ` v REVIEWER_ROLES (odebráno + komentář, TS drift pryč).
- **PL-15 ✅ L2 (parita)** — events `assertCanWrite` = **jen Superadmin/Admin** (ne Spravce) [ikaros-events.service.ts:35]; FE `canManage = Admin||Superadmin` [IkarosEventCard.tsx:51-53]. Read/RSVP = každý přihlášený (class JwtAuthGuard).
- **PL-16 📝 ♻️doc-fix** — ikaros read (OptionalJwt): anon na non-Published → 403 ARTICLE_ACCESS_DENIED, moderationHidden → 404 [ikaros-articles.service.ts:257-283]. Filtr v service, ne FE. (403-vs-404 = známý plán/kód doc-fix SP-07/PL-16.)

### D. Diskuze visibility & ownership
- **PL-17 ✅ L2** — `canAccessDiscussion` [ikaros-discussions.service.ts:121] = admin || (approved && (open||creator||manager||invited)); pending vidí creator/manager (FIX-64). findById/getPosts/addPost všechny gate (addPost R-RUN-01 fix). 403 (známý doc-fix chce 404).
- **PL-18 ✅ L2** — patch/invite = `isManagerOrAdmin`; cizí → 403.
- **PL-19 ✅ L2** — reject/addManager/removeManager = `assertCreatorOrAdmin`; manager (ne creator) reject nesmí (jen creator/admin). reject navíc jen pending (FIX-65).
- **PL-20 ✅ L2** — FE DiscussionDetailPage gate přes REVIEWER_ROLES + BE 404/403.

## Ověřené vstupní brány (health)
- FE `/admin`, `/admin/chat`, dungeon-builder, emotes = `RoleGuard [Superadmin,Admin]` [router.tsx:256,266,277,287] — parita s AdminGuard.
- `ASSIGNABLE_ROLES` = [Superadmin,Admin,SpravceDiskuzi/Clanku/Galerie,Ikarus] — žádné legacy 3-8 [userRoleLabels.ts:28].
- data-export `/me` = JwtAuthGuard self-service (ne admin); upload = JwtAuthGuard generic; images `GET *` bez guardu = veřejné servírování obrázků (mimo role-osu; případný proxy/SSRF spadá do ext-32).

## Drobné observace (NE nové R — low/by-design, k evidenci)
- **Obs-A (`PA`, low/by-design)** — `setSupporter` [admin.service.ts:192] nemá self/hierarchy guard: Admin smí udělit „Podporovatel" sobě i Superadminovi. Podporovatel = freemium kosmetika/limity (19.4), ne bezpečnostní hranice; explicitně „napříč rolemi"; auditováno (SUPPORTER_GRANT/REVOKE). Bez eskalace/leaku. FE tlačítko rovněž bez `disabled={isSelf}` [UsersTable.tsx:266-283]. Doporučení: ponechat, případně kosmeticky doplnit self-disable.
- **♻️ RP-2 / R-01 (vestigiální)** — `@IsEnum(UserRole)` na `UpdateRoleDto` přijme legacy 3-8; Admin by přes přímé API mohl nastavit roli 3/8. Neškodné (žádný BE práh na 3/8; ban je přes `bannedAt`, ne role=8). Známá past, ponechání legacy enumu = samostatný cleanup mimo rozsah.

## PROOF-REQUESTy
- Žádný nový. (Existující L3 pokrytí: `hierarchy.spec.ts`, `admin.service.spec.ts` — dle registru zelené; v tomto read-only běhu nespouštěno.)
- Volitelně M8 (mimo tento běh): Admin bez `canManageAdmins` → `PATCH admin-permissions` na jiného Admina → 403 (ověřuje R-05 enforce). Registr uvádí +5 testů = pokryto.
