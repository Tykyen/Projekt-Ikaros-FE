# 06 — Svět: základ, členové, nastavení

Pokrývá celý životní cyklus světa: tvorbu, viditelnost dle accessMode, membership flow (join/request/approve/reject), hierarchii world rolí (Zadatel→Ctenar→Hrac→Korektor→PomocnyPJ→PJ), nastavení světa (tabs, AKJ, theme, headline), skupiny členů, pravidla, novinky a universe:updated WS signál.

**BE:** `worlds` (controller, service, gateway, repositories, schemas, DTOs, diary-schema-versions), `universe` (gateway), `world-news` (controller, service)
**FE:** `features/world` — WorldLayout shell, WorldContext, WorldMembershipGuard, WorldDashboardPage, WorldMembersPage, WorldSettingsPage (tabs), WorldNewsPage, WorldStubPage; routy `/svet/:worldSlug`, `/hraci`, `/nastaveni`, `/novinky`, `/skupina/:groupKey`, `/pravidla`, `/admin/headline`, `/ikaros/vytvorit-svet`

---

## A. Vytvoření & detail světa

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SZ-01 | `POST /worlds` vytvoří svět, seedne PJ membership (role=5), währy, počasí, diarySchema a Gregorian kalendář `[auto]` | M3 | ⬜ |
| SZ-02 | `POST /worlds` při kolizi slugu vrátí 409 WORLD_SLUG_TAKEN `[auto]` | M3 | ⬜ |
| SZ-03 | `POST /worlds` vynucuje kvótu MAX_ACTIVE_WORLDS_PER_OWNER (30) pro Ikarus; Admin/Superadmin bez limitu `[auto]` | M3 | ⬜ |
| SZ-04 | `GET /worlds/slug/:slug` vrátí 404 (ne 403) pro private svět bez přístupu — neprozradí existenci `[auto]` | M3 | ⬜ |
| SZ-05 | `GET /worlds/slug/:slug` vrátí private svět pro platného člena a pro žadatele s pending AR `[auto]` | M3 | ⬜ |
| SZ-06 | `GET /worlds/slug/:slug` vrátí public/open svět anonymnímu uživateli (OptionalJwtAuthGuard) `[auto]` | M1 | ⬜ |
| SZ-07 | `GET /worlds/slug-available?slug=` vrací `{ available: boolean }` bez autentizace; min 2, max 40 znaků, jen `[a-z0-9-]` `[auto]` | M3 | ⬜ |
| SZ-08 | Odpověď `GET /worlds/:id` a `/slug/:slug` vždy obsahuje pole `owner` (username, avatarUrl); smazaný owner → undefined bez chyby `[auto]` | M3 | ⬜ |
| SZ-09 | `PATCH /worlds/:id/slug` atomicky přejmenuje slug; starý slug přidá do `previousSlugs`; URL `/svet/old-slug` zůstane funkční přes `findByCurrentOrPreviousSlug` `[auto]` | M1 | ⬜ |
| SZ-10 | `PATCH /worlds/:id/slug` vyžaduje PomocnyPJ+ (resp. canEditWorldData); Hráč dostane 403 `[auto]` | M4 | ⬜ |
| SZ-11 | `PATCH /worlds/:id` — sanitizeThemeOverrides: propustí jen klíče `--theme-*`, max 60 položek, value string ≤ 200 znaků; ostatní tiše zahodí `[auto]` | M1 | ⬜ |
| SZ-12 | `PATCH /worlds/:id` s `themeBackgroundUrl: null` nebo `''` smaže pozadí přes `$unset` (ne uloží prázdný řetězec) `[auto]` | M1 | ⬜ |
| SZ-13 | Změna `system` při `PATCH /worlds/:id` archivuje aktivní diary verzi a vytvoří novou s prestem nového systému `[auto]` | M3 | ⬜ |
| SZ-14 | `DELETE /worlds/:id` je soft delete (isActive=false); vyžaduje PJ nebo Admin `[auto]` | M4 | ⬜ |
| SZ-15 | FE `CreateWorldPage` — live slug-availability check při psaní; neumožní submit obsazeného / nevalidního slugu `[auto]` | M2 | ⬜ |
| SZ-16 | FE `useWorld(worldKey)` správně rozliší ObjectId (24 hex) vs. slug a volá správný endpoint `[auto]` | M1 | ⬜ |

---

## B. Membership & join flow

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SZ-17 | `POST /worlds/:id/join` na public světě vytvoří membership role Ctenar (1); closed = 403 WORLD_CLOSED; non-public = 400 WORLD_NOT_PUBLIC `[auto]` | M3 | ⬜ |
| SZ-18 | `POST /worlds/:id/join` při duplicate membership vrátí 409 WORLD_ALREADY_MEMBER; existující pending AR vrátí 409 PENDING_ACCESS_REQUEST `[auto]` | M3 | ⬜ |
| SZ-19 | `POST /worlds/:id/access-request` na open/private světě vytvoří AccessRequest a emituje `world.access.requested` event `[auto]` | M3 | ⬜ |
| SZ-20 | `POST /worlds/:worldId/access-requests/:requestId/approve` (owner/Admin) — transakční flow: membership.save + AR.delete atomicky; fallback na sekvenční path při chybějícím replica setu `[auto]` | M3 | ⬜ |
| SZ-21 | `approve` non-ownerem/non-adminem = 403; AR patřící jinému světu = 404 `[auto]` | M4 | ⬜ |
| SZ-22 | `POST /worlds/:id/request-character` — Čtenář se přesune na Zadatel (idempotent); Hráč+ = 400; non-member = 404 `[auto]` | M3 | ⬜ |
| SZ-23 | `DELETE /worlds/:worldId/members/:membershipId` — vlastník světa nemůže odejít (400 BAD_REQUEST); jiný člen sám sebe může, PomocnyPJ+ může odebrat kohokoliv `[auto]` | M4 | ⬜ |
| SZ-24 | `PATCH /worlds/:id/owner` — předání vlastnictví: nový owner → PJ, starý owner → PomocnyPJ; nový owner musí být člen `[auto]` | M3 | ⬜ |
| SZ-25 | FE `useWorldStatus` kombinuje `useMyWorlds` + `useMyAccessRequests` → tři stavy: member/pending-access/non-member; žádné falsy u Zadatel memberships `[auto]` | M1 | ⬜ |
| SZ-26 | FE `WorldDashboardPage` větví rendering: member → WorldDashboard; pending-access → AccessRequestPending; non-member → JoinCTA; 404/error → WorldNotFound `[auto]` | M1 | ⬜ |
| SZ-27 | FE `MembershipTab` správně blokuje odchod vlastníka (isOwner=true → zobrazí jen sekci Předat svět); ne-vlastník PJ může odejít `[human]` | M4 | ⬜ |
| SZ-28 | FE `MembershipTab` — kandidáti na transfer vlastnictví filtrují jen členy s rolí Hráč+ (ne Zadatel/Čtenář); SELECT zobrazí `user.username` nebo fallback `[auto]` | M1 | ⬜ |

---

## C. World role & oprávnění

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SZ-29 | Hierarchie: Zadatel(0) < Ctenar(1) < Hrac(2) < Korektor(3) < PomocnyPJ(4) < PJ(5); číselné hodnoty odpovídají DB hodnotám po migraci D-053 `[auto]` | M1 | ⬜ |
| SZ-30 | `canAdminWorld` = globální Admin+ NEBO membership.role >= PJ(5); `canManageMembers` přidá PomocnyPJ(4); `canEditWorldData` přidá Korektor(3) `[auto]` | M1 | ⬜ |
| SZ-31 | BE `PATCH .../role` vyžaduje PomocnyPJ+ — Hráč dostane 403; role enumeration odolá hodnotám mimo 0–5 `[auto]` | M4 | ⬜ |
| SZ-32 | BE `getMembers` — endpoint bez JwtAuthGuard: kdokoli (anon) může listovat členy světa (veřejné info); neobsahuje `createdBy` ani interní pole `[human]` | M4 | ⬜ |
| SZ-33 | `WorldMembershipGuard` — loading → Spinner; Superadmin/Admin s `fallbackGlobalRoles` projde bez membership; Hráč je deny pro minWorldRole=PJ `[auto]` | M3 | ⬜ |
| SZ-34 | `WorldMembershipGuard` s `redirectTo=':worldSlug'` nahradí token a redirectuje non-membera na index (ne ForbiddenPage) `[auto]` | M1 | ⬜ |
| SZ-35 | FE `WorldLayout` — `isPJ` flag vychází z `world.ownerId === currentUser.id` NEBO `currentUser.role <= 3` NEBO `membership.role >= PomocnyPJ(4)` — 10.2l fix; členové PomocnyPJ vidí PJ-only nav položky `[auto]` | M1 | ⬜ |
| SZ-36 | FE `WorldLayout` — `showFullNav` = svět existuje AND načtení hotovo AND (member NEBO globální admin); non-member/anon vidí jen EXIT + název světa `[auto]` | M3 | ⬜ |
| SZ-37 | `assertMember` (diary schema přístup) odmítne Zadatel(0) membery i když jsou v DB (403 „Pending členství nemá přístup") `[auto]` | M4 | ⬜ |
| SZ-38 | FE `WorldContext` — `isPJ` derivovaný v `WorldLayout` se nemění po socket eventu (stale); pro runtime PJ změní roli přes `updateMemberRole`, FE re-fetchuje membership `[human]` | M4 | ⬜ |

---

## D. Nastavení světa

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SZ-39 | `PUT /worlds/:worldId/settings` — guard `canAdminWorld` (PJ+); charakterTabVisibility whitelist filtrace na serveru (defense-in-depth) `[auto]` | M4 | ⬜ |
| SZ-40 | `PUT /worlds/:worldId/settings/akj-types` — guard `canManageMembers` (PomocnyPJ+); uloží `akjTypes`; Hráč dostane 403 `[auto]` | M4 | ⬜ |
| SZ-41 | `PATCH /worlds/:worldId/calendar-defaults` — guard PomocnyPJ+ (nebo Admin+); neexistující calendarConfigSlug vrátí 404 CALENDAR_CONFIG_NOT_FOUND `[auto]` | M4 | ⬜ |
| SZ-42 | `sanitizeUpdateSettingsDto` přepíše `lastInfo.updatedAt` serverovým časem; `null` = smaže oznámení `[auto]` | M1 | ⬜ |
| SZ-43 | FE `WorldSettingsPage` — tab gating dle role: Ctenar vidí jen „Můj vzhled" + „Členství"; Korektor +Základní info/Přístup/Šablony/Vzhled; PomocnyPJ +Členové/AKJ; PJ +kompletní tab set `[auto]` | M3 | ⬜ |
| SZ-44 | FE `AccessModeTab` — přepnutí na „Uzavřený" vyžaduje ConfirmDialog; změna se okamžitě uloží (PATCH /worlds/:id); lokální stav `mode` resetuje na aktuální `world.accessMode` `[human]` | M1 | ⬜ |
| SZ-45 | FE `AkjTab` — `AkjLevelEditor` čte z `settingsQuery.data?.akjTypes`; při uložení volá `PUT .../settings/akj-types`; neúspěch zobrazí toast `[auto]` | M2 | ⬜ |
| SZ-46 | FE `MyThemeTab` — `PUT /worlds/:worldId/members/me/theme` uloží `themeAdjust` + `themeUserOverrides` jen pro přihlášeného člena; non-member dostane 403 `[auto]` | M4 | ⬜ |
| SZ-47 | FE `ThemeTab` — `themeBackgroundUrl: null` při mazání pozadí (ne `''`) aby BE volalo `$unset` `[auto]` | M2 | ⬜ |
| SZ-48 | Persist test: změna theme (A→B→A) zachová všechna uživatelská override (`themeUserOverrides`) — delta merge, ne full replace `[human]` | M1 | ⬜ |

---

## E. Členové / skupiny / pravidla / headline / novinky

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SZ-49 | FE `WorldMembersPage` — Zadatel (role=0) se nezobrazí v adresáři; vedení (PJ/PomocnyPJ) v oddělených sekcích; skupiny z `settings.customGroups`; barvy skupin `[auto]` | M3 | ⬜ |
| SZ-50 | FE `WorldMembersPage` — člen bez skupiny nebo se skupinou mimo `customGroups` padne do sekce „Bez skupiny" `[auto]` | M3 | ⬜ |
| SZ-51 | FE `WorldMembersPage` — smazaný uživatel (člen bez `user`) renderuje fallback jméno bez pádu `[human]` | M1 | ⬜ |
| SZ-52 | BE `getMembers` — `enrichMembers` při `publicProfile` chybě nechá membership bez `user` (catch tiše); žádný throw `[auto]` | M3 | ⬜ |
| SZ-53 | BE `WorldNewsService.findMany` — `scope=active` je veřejné bez autentizace; `scope=archived`/`all` vyžaduje PomocnyPJ+ světa nebo globální Admin+ `[auto]` | M4 | ⬜ |
| SZ-54 | BE `WorldNewsService.create` — `worldId=null` smí jen Admin/Superadmin; `worldId` s platným světem smí PomocnyPJ+ toho světa `[auto]` | M4 | ⬜ |
| SZ-55 | BE `WorldNewsService.update` — `worldId` je immutable; pokus o změnu = 400 WORLD_NEWS_WORLD_ID_IMMUTABLE `[auto]` | M1 | ⬜ |
| SZ-56 | BE `WorldNewsController.findById` nemá JwtAuthGuard — anonymní přístup k detailu novinky záměrně veřejný; `createdBy` pole je odstraněno funkcí `toPublic` `[auto]` | M4 | ⬜ |
| SZ-57 | FE `WorldNewsPage` — `canManage` flag = globální Admin+ NEBO `userRole >= PomocnyPJ`; non-PJ členové vidí jen aktivní novinky (bez archiv tabu, bez tlačítka Nové) `[auto]` | M4 | ⬜ |
| SZ-58 | FE `WorldNewsPage` — paginace (10 na stranu); scope přepínání zachovává `worldId` v query; glob. novinky (`news.worldId === null`) nelze editovat PJ světa (pouze Admin) `[auto]` | M1 | ⬜ |
| SZ-59 | FE `buildFullWorldNav` respektuje `settings.hiddenNavItems`; esenciální položky (Přehled, Stránky, Novinky, Pravidla) nelze skrýt `[auto]` | M1 | ⬜ |
| SZ-60 | FE `WorldLayout` — `worldNavConfig` custom headline (`settings.customHeadline`) se renderuje vedle systémové nav; prázdný headline = fallback na systémovou nav `[human]` | M1 | ⬜ |

---

## F. WS signály a real-time

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SZ-61 | BE `WorldsGateway.handleWorldUpdated` emituje `world:updated` do `world:{id}` roomu s plným world objektem; `handleWorldDeleted` emituje `world:deleted` `[auto]` | M3 | ⬜ |
| SZ-62 | BE `WorldsGateway` — `world:access-requested` jde do `user:{ownerId}` (ne do world roomu — žadatel není člen); `world:access-approved` do `user:{requesterId}` `[auto]` | M3 | ⬜ |
| SZ-63 | BE `UniverseGateway.handleUniverseUpdated` emituje jen `{ worldId }` bez mapy (prevence visibility leak); klient musí re-fetchovat přes `GET /universe` `[auto]` | M1 | ⬜ |
| SZ-64 | FE `useWorldAccessSocket` — `world:access-approved` invaliduje `worlds/my`, `worlds/my-access-requests` a `worlds/{worldId}`; `world:access-requested` invaliduje `pending-actions` `[auto]` | M5 | ⬜ |
| SZ-65 | FE `WorldsGateway.handleConnection` — JWT token z `client.handshake.auth.token` → join `user:{sub}` room; neplatný token = socket bez user roomu (bez pádu) `[auto]` | M5 | ⬜ |

---

## Test coverage gaps

- `WorldsController.spec.ts` pokrývá jen `findAll` a definici — chybí testy pro join, access-request, approve/reject, members, settings endpointy (controller vrstva)
- `worlds.gateway.spec.ts` neobsahuje testy pro `handleMembershipChanged`, `handleMembershipRemoved`, `handleAccessCancelled`
- `world-news.service.spec.ts` existuje ale neověřuje `assertCanReadScope` pro scope=archived bez tokenu (401 path)
- `WorldNewsPage` nemá spec soubor pro interaktivní chování (archivace, delete confirm dialog, scope přepínání)
- `WorldLayout.spec.tsx` neověřuje, zda isPJ flag funguje pro PomocnyPJ membership (jen ownership a admin bypass)
- `WorldMembershipGuard` nemá test pro `redirectTo` s `:worldSlug` tokenem
- Žádný test pro persist-across-variants (theme A→B→A)
- Žádný test pro `findByCurrentOrPreviousSlug` (previousSlugs lookup v repository)

---

## Známá rizika

- **R1 (M4) BE `GET /worlds/:id/members` bez JwtAuthGuard** — endpoint vrací seznam členů (vč. username, avatarUrl, role, group) komukoli bez autentizace. Pro private světy to odhaluje metadata členů anonymnímu útočníkovi, který zná worldId. Nutno ověřit, zda je to záměr nebo auth-leak (D-063 pattern).
- **R2 (M5) Race WS vs. HTTP** — `world:access-approved` event dorazí k žadateli a FE invaliduje `worlds/my`; pokud BE ještě nezapsal membership (tx commit race v sekvenčním fallbacku), první re-fetch vrátí status `pending-access` místo `member`. FE stav chvíli klame uživatele.
- **R3 (M4) isPJ stale v WorldContext** — `isPJ` v `WorldLayout` se počítá jednorázově z `membership.role` při mountu. Pokud PJ demotuje sebe (přes transferOwnership), vlastní prohlížeč zůstane s `isPJ=true` až do page reload — ukazuje PJ-only nav a umožňuje volání endpointů, které BE odmítne 403.
