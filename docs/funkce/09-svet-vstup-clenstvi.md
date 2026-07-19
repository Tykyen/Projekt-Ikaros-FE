# 09 — Svět: vstup, dashboard, členství & role

Hloubková, kódem ověřená inventura. Pokrývá vše kolem vstupu do světa, úvodní stránky, životního cyklu členství, rolí a governance.

## Klíčové enumy (ověřeno v kódu)

**Globální role** (`UserRole`, FE `src/shared/types/index.ts:6`, BE `backend/src/modules/users/interfaces/user.interface.ts:1`) — POZOR, číselně INVERTOVANÉ (nižší číslo = vyšší moc):
`Superadmin=1, Admin=2, PJ=3, Korektor=4, Hrac=5, Ctenar=6, Zadatel=7, Zakaz=8, Ikarus=9, SpravceClanku=10, SpravceGalerie=11, SpravceDiskuzi=12`. Proto se v BE píše `requester.role <= UserRole.Admin` = „Superadmin nebo Admin". (Globální PJ/Korektor/Hrac/Ctenar/Zadatel hodnoty 3–7 jsou legacy z migrace, governance světa je řízena world rolí, ne těmito.)

**Světová role** (`WorldRole`, FE `src/shared/types/index.ts:359`, BE `backend/src/modules/worlds/interfaces/world-membership.interface.ts:9`) — vzestupné, vyšší = víc moci:
`Zadatel=0, Ctenar=1, Hrac=2, Korektor=3, PomocnyPJ=4, PJ=5`. Default nového membership = `Hrac` (schema), ale lifecycle (join/approve) zakládá `Ctenar`.

**Přístupový režim světa** (`accessMode`, ověřeno `AccessModeTab.tsx:11`, BE `joinPublic`/`requestAccess`):
- `public` = „Veřejný" — kdokoli rovnou vstoupí (role Čtenář), bez schválení.
- `open` = „Veřejný se schválením" — svět je vidět, vstup přes žádost schválenou PJ.
- `private` = „Soukromý" — svět vidí jen členové + žadatelé (+ platform Admin); vstup přes žádost.
- `closed` = „Uzavřený" — nikdo nový nevstoupí ani žádostí; stávající členové zůstávají.

---

## A. Detail světa před vstupem (index route)

### WorldDashboardPage (index světa)
- **Co to je** Index stránka světa `/svet/:worldSlug`. Větví render podle `useWorldStatus` (non-member / pending-access / member). Pro člena renderuje dashboard, pro ostatní hero + info + CTA.
- **Kde** Route `/svet/:worldSlug` index (router `router.tsx:234`), bez membership guardu (shell je veřejný, řízeno BE `OptionalJwtAuthGuard`).
- **Kdo**
  - FE: shell veřejný (anon povolen). Status řeší `useWorldStatus` (`useWorldStatus.ts`).
  - BE: `GET /worlds/slug/:slug` a `GET /worlds/:id` přes `OptionalJwtAuthGuard` → `findBySlugForRequester`/`findByIdForRequester` (`worlds.service.ts:183-229`). `applyDetailScope`: private + anon = **404**; private + non-member non-admin bez pending AR = **404**; private + member/pending/Admin = OK; public/open vidí kdokoli (i anon).
- **Co jde dělat / co kdo vidí**
  - **anon**: vidí public/open svět (hero + info + JoinCTA s „Přihlásit se a vstoupit/požádat"); na private/nepřístupný svět vidí **401 „Nejdřív se přihlas"** (`ErrorState`) + CTA Přihlásit (login intent → návrat), NE „svět neexistuje". Leak-safe rozlišení na **FE** dle `isAuthenticatedAtom` (BE pořád vrací 404). (15.6, 2026-06-21.)
  - **non-member (přihlášený)**: hero + `WorldDetailInfo` + `JoinCTA` (`JoinCTA.tsx`).
  - **pending-access**: hero + info + `AccessRequestPending` banner (datum podání + „Zrušit žádost").
  - **member**: hero + `WorldDashboard` (3 sloupce) + `WorldToolboxPanel` (nápověda) + `WorldAboutPanel`.
  - 404/error → `WorldNotFound` (= `ErrorState`: anonym 401 „přihlas se", přihlášený nečlen čitelné 404 — vyřešen i dřívější nečitelný text).
- **Hranice** Status (`useWorldStatus`) se počítá z `useMyWorlds` + `useMyAccessRequests` na FE — pro anon obojí prázdné, takže anon je vždy `non-member`. Anon nemůže provést akci; JoinCTA mu otevře login (`saveLoginIntent` + `openLoginModalAtom`).
- **Stav** ✅
- **Kód** FE `src/features/world/pages/WorldDashboardPage/WorldDashboardPage.tsx:24`, `JoinCTA.tsx`, `AccessRequestPending.tsx`, `useWorldStatus.ts`. BE `worlds.controller.ts:102-123`, `worlds.service.ts:199` (`applyDetailScope`).

### JoinCTA — vstup / žádost
- **Co to je** CTA blok pro non-membery; varianty dle `accessMode`.
- **Co jde dělat**
  - `public` → „Vstoupit do světa" → `useJoinWorld` → `POST /worlds/:id/join` → membership `Ctenar`.
  - `open` / `private` → **dvě volby (15.10 fáze C, var. A):** **„Chci hrát"** = mini-formulář (jméno postavy + krátká poznámka pro PJ) → `useRequestAccess` s `characterDraft` → approve vytvoří **živou stránku postavy + roli Hráč**; **„Jen číst"** → prostá žádost (`characterDraft` prázdný) → approve dá `Ctenar` (dnešní chování).
  - `closed` → bez tlačítka, info „Uzavřený svět".
  - anon → tlačítko místo akce otevře login modal.
- **Hranice/co neumí** Návrh postavy = jen **jméno + poznámka** (data u žádosti, ne živá `Page` — ta vzniká až při approve PJ-em, viz Schválení). Přímé pozvání konkrétního hráče / pozvací odkaz řeší **„Přidat hráče"** na stránce Hráči (15.10 fáze B), ne JoinCTA. Výběr role při vstupu není — vždy Čtenář nebo (s postavou) Hráč.
- **Stav** ✅
- **Kód** FE `JoinCTA.tsx:28` (charMode formulář), `useWorldJoin.ts` (`useRequestAccess` s `characterDraft`). BE `joinPublic` (`worlds.service.ts:573`), `requestAccess` (charDraft trim/limit).

### Sdílení světa — ShareButton (15B.6)
- **Co to je** Tlačítko „Sdílet" v hlavičce detailu světa; šíří pozvánkovou URL `/svet/:slug`. Sdílí se holá URL (žádné API klíče / OAuth) — náhled (obrázek + titulek) si síť stáhne z OG meta tagů cílové stránky (15B.2 `<Seo>`).
- **Kde** Pravý horní roh `WorldDetailHero` (řádek badges, flow layout). Renderuje se pro **všechny statusy** (member i non-member), protože hero je sdílený. Žádné role gating — pozvánková URL je veřejná podstata kroku.
- **Kdo** Kdokoli vidí hero (anon i člen). Čistě FE, **žádný BE endpoint** — sdílí se URL, BE se neúčastní.
- **Co jde dělat**
  - **Mobil/PWA** (`navigator.share` dostupné) → klik = **nativní share sheet** (uživatel sám vybere FB/WhatsApp/IG/…). Zrušení sheetu (`AbortError`) = tiše bez chyby.
  - **Desktop** (bez Web Share API) → klik otevře `KebabMenu`: **Kopírovat odkaz** (`navigator.clipboard` + toast „Odkaz zkopírován") · **Facebook** (`facebook.com/sharer`) · **X** (`twitter.com/intent/tweet`). Sharer-URL se otevírá `window.open(..., 'noopener,noreferrer')` (obrana proti reverse tabnabbingu).
- **Hranice / co neumí** Sdílí **jen detail světa** — u světa se zapnutým veřejným nahlížením (22.4 níže) si příjemce prohlédne i vitrínové sekce. **Negeneruje** per-svět OG kartu (náhled = `world.imageUrl`, když svět obrázek má; jinak brand logo). Žádné pozvánky e-mailem ani invite-link s předschválením (to řeší JoinCTA — „kdo má odkaz, může požádat"). Sdílení achievementů je vědomě mimo záběr (roadmapa).
- **Zvláštnosti** Web Share API i Clipboard API vyžadují secure context (HTTPS/localhost) + user gesture (klik) — splněno. `navigator.share` na desktopu většinou chybí → menu fallback. Brand ikony (Facebook/Twitter) lucide nemá → vlastní inline SVG glyfy.
- **Stav** ✅
- **Kód** FE `src/shared/ui/ShareButton/ShareButton.tsx`, integrace `WorldDetailHero.tsx:21,29`. Reuse `KebabMenu`, `sonner` toast, `metaDescription` (`@/shared/seo`).

### Veřejné nahlížení — výkladní skříň světa (22.4)
- **Co to je** Per-svět opt-in přepínač `publicShowcase` (default vyp.): anonym/nečlen si smí **read-only** prohlédnout vitrínové sekce světa. Bezpečnostní kontrakt: **anonym vidí NEJVÝŠE to, co člen v roli Čtenář**, a nemá žádnou mutaci.
- **Kde** Zapíná se v Nastavení světa → tab Přístup (druhý panel „Veřejné nahlížení (výkladní skříň)", confirm dialog při zapnutí). Vitrínové sekce: `novinky`, `stranky`, wiki `:slug` (vč. `pravidla`), `postavy` (adresář), `mapa` (vesmír), `mapy` (atlas), `bestiar`. Anon/nečlen dostane místo plné nav lišty `ShowcaseBar` (horizontální pilulky + CTA „Přidat se" → index s JoinCTA).
- **Kdo**
  - Přepínač: **jen PJ** (`canAdminWorld` — BE `worlds.service.ts` blok 22.4 v `update()`); Korektor/PomocnýPJ 403. Na private světě 400 `SHOWCASE_PRIVATE_WORLD`; přechod světa na private flag **automaticky shodí**.
  - Čtení: FE guard `WorldMembershipGuard` prop `allowShowcase` (router helper `showcaseOrMember`, jen routy výše); BE = tvrdá hranice: per-routa `OptionalJwtAuthGuard` + brána `assertShowcaseViewable(world)` (`common/utils/showcase.ts`) → anon bez vitríny / neexistující svět = **403 `SHOWCASE_DISABLED`** (anti-enumeration). Anon jede **cestou nejnižšího člena**: pages = člen bez clearance (AKJ tab filtr, `accessRequirements` → 403), mapy = hráčská cesta `userId=null` (`isPublic` mapy, `stripForPlayer`), bestie = jen world+system scope (osobní nikdy).
- **Co jde dělat** Anon čte obsah vitrínových sekcí; vše ostatní (chat, taktická mapa, voice, zvuky, obchod, převodník, akce, pavučina + role-gated timeline/kalendář/deník PJ/nastavení) zůstává member-only. Mutace pro anonyma všude 401. SEO: sitemap přidává vitrínové sekce + wiki stránky (bez AKJ/moderationHidden, strop 200/svět, `seo.service.ts`); prerender whitelist v nginx pokrývá vitrínové cesty; `PageViewer` nese `<Seo>` s `noindex` mimo vitrínu.
- **Hranice / co neumí** Per-svět přepínač, žádný per-stránka výběr (AKJ řeší per-stránka utajení). Detail postavy (`postava/:slug`), plný seznam pages (`GET /pages`), backlinks, atlas detailní správa = member-only beze změny. Vesmírná mapa je PIXI → pro boty prázdná (není v sitemap sekcích). Sekce-listy (stranky/bestiar…) zatím nemají vlastní `<Seo>` title (jen wiki viewer).
- **Zvláštnosti** FE api klient: 401 requestu **bez Authorization hlavičky** se tiše rejectne (žádný refresh pokus ani kick na login) — jinak by member-only fetch na vitrínové stránce anonyma vykopl (`client.ts` blok 22.4). Mongoose past: anon větve NIKDY nepouští `undefined` do query (`findByUserAndWorld`/`findVisible`) — viz chybový deník be.md 2026-07-15.
- **Stav** ✅ (kód + testy; čeká commit + živé ověření)
- **Kód** FE `src/app/router.tsx` (`showcaseOrMember`), `WorldMembershipGuard.tsx` (`allowShowcase`), `src/features/world/components/ShowcaseBar/ShowcaseBar.tsx`, `AccessModeTab.tsx` (toggle), `WorldLayout.tsx` (`showShowcaseBar`), `client.ts` (anon 401), `PageViewer.tsx` (`<Seo>`), `default.conf.template` (prerender whitelist). BE `world.schema.ts` (`publicShowcase`), `worlds.service.ts` (governance + auto-drop), `common/utils/showcase.ts`, `pages.controller.ts` (`GET :slug` Optional) + `pages.service.ts` (`findBySlug` anon větev), `world-maps.controller.ts`/`.service.ts` (`assertShowcaseView`), `bestiae.controller.ts`/`.service.ts` (anon list/detail), `seo.service.ts` (vitrínové URL). Testy `backend/test/showcase.e2e-spec.ts` (14 testů vč. invariantu anon ⊆ Čtenář).

---

## B. Member dashboard (3 sloupce — spec 5.2)

### WorldDashboard
- **Co to je** Úvodní obrazovka člena. Mřížka: dlaždice **Hráči** (počet hrajících) + box **Akce** (game events), dlaždice **Chat** (badge nepřečtené) + box **Novinky**, pravý sloupec **Oblíbené stránky** (přes celou výšku).
- **Kde** Render uvnitř `WorldDashboardPage` při `status === 'member'`.
- **Kdo** Jen člen (zobrazí se pouze při member statu); data čtena member-gated endpointy.
- **Co jde dělat** Proklik na `…/hraci`, `…/chat`; přehled nejbližších akcí, posledních novinek, oblíbených stránek. „Hráči" počítá `members.filter(isWorldPlayer)`.
- **Hranice** Dlaždice/sloupce jsou jen přehledové + navigační — žádná editace odtud. Počet „Hráči" = `isWorldPlayer` (postava NEBO staff Korektor+), ne hrubý počet členů.
- **Stav** ✅
- **Kód** FE `WorldDashboard.tsx:21`, sloupce `WorldDashboard/columns/*`, `isWorldPlayer.ts`.

---

## C. Členství — životní cyklus

### Vstup do public světa (join)
- **Akce** `POST /worlds/:id/join` (JwtAuthGuard). Vznikne `WorldMembership` role `Ctenar`, `akj:0`. Emit `world.membership.changed`.
- **Hranice/chyby** `WORLD_CLOSED` (403, closed), `WORLD_NOT_PUBLIC` (400, open/private → musíš přes access-request), `WORLD_ALREADY_MEMBER` (409), `PENDING_ACCESS_REQUEST` (409, máš nevyřízenou žádost).
- **Kód** `worlds.service.ts:573`.

### Žádost o vstup (open/private)
- **Akce** `POST /worlds/:id/access-request` (volitelné tělo `RequestAccessDto`) → vytvoří `WorldAccessRequest` (pre-membership, samostatná kolekce, unique index user+world). **15.10 fáze C:** volitelné pole `characterDraft { name, note? }` = návrh postavy („Chci hrát"); prázdné = prostá žádost. Emit `world.access.requested` (→ pending-actions / push PJ).
- **Hranice/chyby** `WORLD_CLOSED` (403), `WORLD_IS_PUBLIC` (400, public → použij /join), `WORLD_ALREADY_MEMBER` (409). Duplicitní AR = Conflict (unique index).
- **Zrušení vlastní žádosti** `DELETE /worlds/:id/access-request` (204) → `cancelAccessRequest`. 404 `ACCESS_REQUEST_NOT_FOUND` když není.
- **Kód** `worlds.service.ts:629` (request), `:678` (cancel), FE `AccessRequestPending.tsx`.

### Schválení / zamítnutí žádosti (PJ)
- **Co to je** PJ vyřizuje pending AR. UI je na **třech místech (15.10 fáze A):** (1) platformový **Zpracovat / pending-actions** panel (`WorldAccessRequestRenderer`, napříč **vlastními** světy = owner/co-PJ), (2) sekce **„Čekající žádosti"** na stránce Hráči světa, (3) **zvoneček + drawer** v hlavičce světa (rychlý přístup odkudkoli, `WorldRequestsBell`/`WorldRequestsDrawer`). Všechny sdílí `RequestsList` / stejné approve/reject endpointy.
- **Kdo** BE `assertCanModerateAccessRequests` (`worlds.service.ts`): **vlastník světa NEBO člen role `PJ`** (co-PJ) **NEBO elevovaný platform Admin/Superadmin** (`worldAdminBypass`, FIX-19). PomocnyPJ pořád nemůže. **15.10 co-PJ fix:** dřív co-PJ měl právo schválit, ale žádost ve frontě neviděl (`WorldAccessRequestProvider.scopeForUser` scopoval jen `findByOwnerId`) → opraveno na „vlastník NEBO člen role ≥ PJ". **R-20 scope fix (2026-07-19):** `scopeForUser` dřív vracel pro platform Admin/Superadmin `undefined` = **globální scope přes VŠECHNY světy** — adminovi svítily ve frontě žádosti i tam, kde je jen hráč/nečlen. Rozešlo se se schvalovací bránou (ta platform roli bez elevace dává 403). Opraveno: **žádný globální bypass** — Admin/Superadmin má stejný scope jako každý (owner/co-PJ); dohled nad cizím světem jen přes elevaci. FE renderer bez vlastního role gate — gating čistě BE.
- **Co jde dělat**
  - Přijmout **prostou žádost** → `POST /worlds/:worldId/access-requests/:requestId/approve` → smaže AR + vytvoří membership `Ctenar` (Mongo tx / sekvenční fallback D-061). Emit `world.access.approved` + `world.membership.changed`.
  - Přijmout **žádost s postavou** (`characterDraft`, 15.10 fáze C) → tentýž endpoint → `pagesService.create` živou Page „Postava hráče" (owner = žadatel) + membership **`Hrac`** + `characterPath` + smaže AR. „Jedno schválení pustí dovnitř i schválí postavu."
  - Odmítnout → `POST …/reject` → smaže AR; žadatel může požádat znovu. Emit `world.access.rejected`.
- **Per-world fronta** `GET /worlds/:id/pending-actions` (multi-typ, moderátor-gated) napájí sekci na stránce Hráči + drawer + badge (dlaždice/zvoneček).
- **Hranice** Prostá žádost → `Ctenar`; s postavou → `Hrac`. Žádný „reader-only" mezirežim (přijmout s postavou = rovnou Hráč). 403 `FORBIDDEN`, 404 `ACCESS_REQUEST_NOT_FOUND`.
- **Stav** ✅
- **Kód** FE `WorldAccessRequestRenderer.tsx`, `useWorldJoin.ts`, `WorldRequests/` (RequestsList/Bell/Drawer), `useWorldPendingActions.ts`. BE `approveAccessRequest` + `approveAccessRequestWithCharacter`, `getWorldPendingActions`, `world-access-request.provider.ts` (scope fix).

### Žádost o postavu — ❌ ZRUŠENO (D-065, 2026-07-16)
- **Co bývalo** `POST /worlds/:id/request-character` (D-062): Čtenář požádá o postavu → role klesla na `Zadatel`(0) + emit `world.character.requested`.
- **Proč pryč** Slepá kostra: **žádný FE ji nevolal** (nikdy nevzniklo tlačítko) a event **neměl listenera** (slíbená „PJ pending action" neexistovala). 15.10 var. A cestu ke hraní pokryla líp — „Chci hrát" v JoinCTA (access-request s `characterDraft` → rovnou `Hrac` + živá Page). Smazán endpoint, service metoda i error kód `ALREADY_HAS_CHARACTER_ROLE`.
- **Co zůstalo a proč** Role **`Zadatel`(0) v enumu zůstává** — nikdo ji už nepřiřazuje, ale má dvě živé funkce: (1) FE ji na 11 místech používá jako sentinel „žádná role" (`userRole ?? WorldRole.Zadatel` = spodní mez oprávnění); (2) `role === Zadatel` checky (chat/emotes/sounds/game-events/timeline/maps) drží venku historická data z `migrate:d053` (staré `Pending` → 0). Nejsou mrtvý kód, jsou pojistka — viz hlavička `world-membership.interface.ts`.
- **Dnešní cesta ke hraní** „Chci hrát" → access-request s postavou → `Hrac`. Viz sekce Žádost o vstup výše.

### Pozvánky do světa (15.10 fáze B)
- **Co to je** PJ proaktivně přidá hráče — cílenou pozvánkou konkrétního uživatele NEBO pozvacím odkazem. Entita `WorldInvite` (`kind: 'user' | 'link'`).
- **Kde** Tlačítko **„Přidat hráče"** na stránce Hráči (jen PJ) → modal `InvitePanel`. Pozvaný přijímá v platformové frontě „Ke zpracování" (renderer `WorldInviteRenderer`). Odkaz se přijímá na route `/invite/:token`.
- **Kdo** Create/list/revoke: BE `assertCanModerateAccessRequests` (vlastník / co-PJ / elevovaný Admin). Přijetí cílené: jen adresát (`invitedUserId === já`); odkaz: kdokoli přihlášený.
- **Co jde dělat**
  - **Pozvat uživatele** → `POST /worlds/:id/invites {kind:'user', invitedUserId}` → pozvánka pozvanému (pending-action `world_invite` + WS `world:invite-received` toast). Přijmout → `…/accept` → membership `Ctenar`; Odmítnout → `…/decline`.
  - **Pozvací odkaz** → `POST … {kind:'link', expiresInDays?, maxUses?}` → token; přijetí `POST /worlds/invite-token/:token/accept` → `Ctenar` (pre-approved, bez schvalování).
  - **Přehled + revoke** → `GET /worlds/:id/invites`, `DELETE …/:inviteId` (status → `revoked`).
- **Hranice/co neumí** Role po přijetí vždy `Ctenar` (PJ pak povýší). Nelze pozvat existujícího člena ani duplicitně (`WORLD_ALREADY_MEMBER` / `PENDING_INVITE`, partial-unique index). Odkaz: expirace + `maxUses` + revoke; vypršelý/vyčerpaný/zrušený → 410 (`INVITE_EXPIRED`/`INVITE_EXHAUSTED`/`INVITE_INACTIVE`). E-mailová pozvánka neregistrovanému NENÍ (odkaz sdílí PJ sám). Souhlas příjemce vždy povinný — žádné „tvrdé přidání".
- **Zvláštnosti** Odkaz login-required (`/invite/:token` přes `requireAuth` → login-intent → accept po přihlášení). Token `randomBytes(24)`, sparse-unique index.
- **Stav** ✅
- **Kód** FE `InvitePanel/`, `WorldInviteRenderer/`, `useWorldInvites.ts`, `pages/InvitePage/`, `useWorldInviteSocket.ts`. BE `world-invite.schema.ts`, `world-invite.repository.ts`, `world-invite.provider.ts`, `createInvite`/`acceptUserInvite`/`declineUserInvite`/`acceptLinkInvite`/`revokeInvite` (`worlds.service.ts`), controller `/worlds/:id/invites*` + `/worlds/invite-token/:token/accept`.

### Odchod / odebrání člena
- **Akce** `DELETE /worlds/:worldId/members/:membershipId`. Self = odchod; cizí = odebrání. BE `leave` (`worlds.service.ts:1647`): self vždy smí (kromě vlastníka), cizí jen `canManageMembers` (PomocnyPJ+).
- **Hranice** Vlastník světa nemůže odejít (`WORLD_OWNER_CANNOT_LEAVE`, 400) — musí svět nejdřív předat. `assertMembershipInWorld` (N-18) ověří, že membership patří danému světu. Hráč (role 2) sníží `playerCount`.
- **Stav** ✅

---

## D. WorldMembershipGuard (FE) & ochrana sub-rout

- **Co to je** FE per-world guard. Logika přesně: `loading` → Spinner; `user.role ∈ fallbackGlobalRoles` → projde (Sa/Admin bypass); `worldRole >= minWorldRole` → projde; jinak `redirectTo` (silent redirect) nebo `ForbiddenPage`.
- **Kde** `src/features/admin/components/WorldMembershipGuard.tsx`. Wrapper `memberOnly()` v routeru (`router.tsx:104`) nastavuje default `minWorldRole=Ctenar`, `fallbackGlobalRoles=[Superadmin,Admin]`, `redirectTo='/svet/:worldSlug'` (non-member přesměrován na index, ne na 403).
- **Role gating sub-rout** (router.tsx:236-335) — minWorldRole na route:
  - `Ctenar` (default memberOnly): chat, novinky, stranky, postavy, mapa, mapy, takticka-mapa, bestiar, akce, pavucina, obchod, zvuky, prevodnik-men, nastaveni, **hraci**, pravidla, **skupina/:groupKey**, wiki `:slug`.
  - `Hrac`: timeline, pocasi (parita s BE assertMember = Hrac).
  - `PomocnyPJ`: kalendar, scenare, denik-pj, admin/stranky, admin/kalendare.
  - `PJ`: admin/headline.
- **Zdroj `userRole`** `WorldContext.userRole` = skutečná membership role nebo `null` (WorldLayout `:353`). Pro Sa/Admin BEZ membershipu je `null` → projde JEN přes `fallbackGlobalRoles`. WorldLayout navíc derivuje `isPJ`/`isPJForNav` (owner / `role<=Admin` / membership PomocnyPJ+) pro zobrazení PJ položek v nav.
- **Hranice/co neumí** Guard porovnává jen `>= minWorldRole` — žádné per-akci jemné gating (to dělá BE). Sa/Admin bypass je čistě FE shortcut na render; BE drží vlastní (přísnější, R-20) hranice. Pozor na rozpor: route `kalendar` má FE gate `PomocnyPJ`, ale guard pustí i Sa/Admin bez membershipu — BE pak ale může vrátit 403 (governance R-20).
- **Stav** ✅
- **Kód** `WorldMembershipGuard.tsx:38`, `router.tsx:104`, `WorldLayout.tsx:277-353`.

---

## E. Role uvnitř světa — přidělování (PJ)

### Správa členů — Nastavení světa → tab „Členové" (MembersTab)
- **Co to je** Hlavní místo správy členů: inline editace role / skupiny / AKJ / přiřazené postavy + odebrání. NE stránka „Hráči" (ta je read-only adresář).
- **Kde** `/svet/:slug/nastaveni#clenove` (tab v `WorldSettingsPage`). Tab viditelný od `PomocnyPJ` (`WorldSettingsPage.tsx:81`).
- **Kdo**
  - FE: tab gate `minRole PomocnyPJ`; `viewerRole = skutečná world role` (R-20 — platform Admin bez staff role NEVIDÍ PJ akce, `MembersTab.tsx:57`).
  - BE: každé pole vlastní endpoint, gate `canManageMembers` = PomocnyPJ+ nebo membership PJ **nebo elevovaný platform Admin/Superadmin** (FIX-19 — `canAdminWorld` teď zahrnuje `worldAdminBypass`, `:2176`).
- **Co jde dělat (na řádku, `MemberRow.tsx`)**
  - **Role** select. Hierarchie: vlastní řádek needitovatelný; PomocnyPJ nemůže měnit role ≥ PomocnyPJ (vidí jen role < PomocnyPJ v selectu); povýšení na PJ → confirm dialog „Povýšit na PJ?".
  - **Skupina** select z `customGroups` nebo „bez skupiny".
  - **AKJ** select (z `akjTypes`) nebo number input (když svět AKJ úrovně nedefinoval).
  - **Postava** přiřazení/odpojení PC (select PC postav, `canAssignCharacter` = PomocnyPJ+ nebo self). Tlačítko „+" = vytvořit novou postavu pro člena (PJ-only, naviguje do PageEditoru `?type=PostavaHrace&owner=`).
  - **Odebrat** člena (confirm), nelze sebe (→ tab Členství), nelze PJ.
  - **Skupiny a barvy** (`GroupColorEditor`) jen pro PJ+ (zakládání skupin, barva, znak).
- **BE role-ceiling (R-03)** `updateMemberRole` (`worlds.service.ts:1227`): vlastníkovu roli nelze měnit (`WORLD_OWNER_ROLE_IMMUTABLE`, → jen transfer); kdo není globální Admin ani owner nesmí udělit roli ≥ své vlastní ani měnit člena s rolí ≥ své (`WORLD_ROLE_CEILING`). Atomický `updateRoleIfChanged` + `playerCount` drift fix.
- **Hranice/co neumí** Žádné bulk akce (po jednom členovi). Žádná historie změn rolí. AKJ free-input bez horního stropu. Platform Admin/Superadmin tu nemá governance moc, pokud si ji pro tento svět vědomě **nenahodí** (elevace) — de-elevovaný je jako nečlen (viz sekce I; do 2026-07-05 to platilo i po nahození, FIX-19 mezeru zavřel).
- **Stav** ✅
- **Kód** FE `WorldSettingsPage/tabs/MembersTab.tsx`, `components/MemberRow.tsx`, `useUpdateMember.ts`, `useRemoveMember.ts`. BE `worlds.controller.ts:398-476`, `worlds.service.ts:1227` (role), `:1312` (group), `:1417` (akj).

### Předání světa & odchod — tab „Členství" (MembershipTab)
- **Kde** `/svet/:slug/nastaveni#clenstvi`, tab od `Ctenar`.
- **Co jde dělat**
  - **Předat svět** (jen vlastník, sekce „Předat svět"): vybere člena (Hráč+) → `PATCH /worlds/:id/owner`. Nový vlastník → PJ, původní → PomocnyPJ. Pak může původní odejít.
  - **Odejít ze světa** (Ctenar+, ne vlastník) → `DELETE …/members/:id` self.
- **BE transferOwnership** (`worlds.service.ts:2037`): jen skutečný vlastník (NE platform Admin, ani elevovaný — jediná governance akce, kterou elevace neobchází). Nový vlastník musí být člen (`WORLD_TRANSFER_NOT_MEMBER`), ne sám sobě. Re-check po zápisu (TOCTOU rollback) — pokud nový vlastník mezitím odešel, vrátí ownership zpět.
- **Hranice** Vlastník nemůže odejít bez předání. Kandidáti na vlastníka = jen Hráč+ (Ctenar nelze předat).
- **Stav** ✅
- **Kód** FE `tabs/MembershipTab.tsx`, `useTransferOwnership.ts`. BE `worlds.service.ts:1818`.

---

## F. Správa hráčů — stránka „Hráči" (WorldMembersPage)

- **Co to je** Adresář členů + **domov správy hráčů** (15.10). Vedení (PJ, Pomocní PJ) nahoře, pak skupiny, „Bez skupiny" a nově sekce **„Nováčci"** (Čtenáři/Žadatelé bez postavy — dřív skrytí). Karty členů mají **online tečku** (`OnlineDot`).
- **Kde** `/svet/:slug/hraci` (router `:276`), nav položka „Hráči". memberOnly (Ctenar+).
- **Kdo** FE Ctenar+ (memberOnly). BE `GET /worlds/:id/members` přes `OptionalJwtAuthGuard` + `findByIdForRequester` (N-7 — private nečlen = 404). PJ-only prvky (žádosti, „Přidat hráče") gated `isPJ` (FE) + BE moderátor gate.
- **Co jde dělat**
  - Všichni: prohlížet karty (avatar, jméno, role, online tečka, „Hraje za" postavu), proklik na postavu. **Nováčci** = členové mimo `isWorldPlayer` (bez postavy, ne-staff) — vidí je každý.
  - **PJ (15.10 fáze A+B):** nahoře sekce **„Čekající žádosti"** (`RequestsList` — Přijmout/Odmítnout inline, vč. žádostí s postavou) + tlačítko **„Přidat hráče"** (→ `InvitePanel`, pozvat uživatele / vytvořit odkaz).
- **Hranice/co neumí** Měnění rolí, skupin, vyhazování zůstává v Nastavení (tab Členové). Odtud jen: schválit/odmítnout žádost + pozvat. Rychlý přístup k žádostem i mimo tuto stránku = zvoneček/drawer v hlavičce světa (15.10 fáze A).
- **Stav** ✅
- **Kód** FE `pages/WorldMembersPage/WorldMembersPage.tsx` (sekce žádosti/Nováčci + „Přidat hráče"), `MemberCard.tsx` (OnlineDot), `WorldRequests/`, `InvitePanel/`. BE `worlds.service.ts` (getMembers, getWorldPendingActions).

---

## G. Skupiny (GroupMembersPage)

- **Co to je** Autogenerovaná stránka jedné skupiny — seznam hrajících členů skupiny (postava + avatar, proklik). „Nezařazení" = členové s postavou bez skupiny.
- **Kde** `/svet/:slug/skupina/:groupKey` (router `:279`), memberOnly. Nav vzniká pod záložkou „Informace" (12.3).
- **Kdo** FE Ctenar+. Editace znaku (emblem) jen `userRole >= PJ` a jen pro reálnou skupinu (ne „Nezařazení").
- **Co jde dělat**
  - Prohlížet členy skupiny (jméno postavy, avatar, role, proklik na postavu).
  - PJ: nahrát/změnit **znak skupiny** (`uploadImage` → `useUpdateWorldSettings` `groupImages[group]`). Znak je single source → enrich do ikony linkovaného chat kanálu.
- **Co skupina je** Pojmenovaná party/frakce (`customGroups` ve `WorldSettings`) s barvou (`groupColors`) a znakem (`groupImages`). Zakládá ji PJ v tabu Členové (GroupColorEditor). Barva odlišuje v chatu/seznamech. Skupina se váže na chat kanál — přiřazení do skupiny synchronizuje `allowedMemberIds` linked kanálu (emit `world.membership.changed`, D-NEW-channel-group-sync).
- **Hranice/co neumí** Skupina není role ani oprávnění — je to vizuální/organizační label + chat vazba. Členství ve skupině je 1:1 (jeden member = jedna skupina, `membership.group` string). Stránka skupiny je read-only kromě znaku. „Nezařazení" nemá kanál ani znak.
- **Stav** ✅
- **Kód** FE `pages/GroupMembersPage/GroupMembersPage.tsx`, `lib/groupMembers.ts`, `GroupColorEditor`. BE `updateMemberGroup` (`worlds.service.ts:1312`), `world-settings.schema.ts`.

---

## H. Přítomnost / online (presence)

- **Co to je** Dvě oddělené vrstvy:
  1. **Real-time WS presence** (online / idle / offline) — globální, ne per-svět.
  2. **REST „aktivní nedávno"** — `GET /presence/online` vrací userIds aktivní za posledních 25 h (heartbeat `lastSeenAt`).
- **Kde** Online indikátor (`OnlineDot`) u uživatelů/avatarů napříč platformou. Per-svět „Panel Přítomní" žije v **chat** modulu (`ChannelMemberPanel` / `WorldChatRoom`) — PJ-only panel, mimo rozsah této kapitoly (viz kapitola Chat).
- **Kdo** WS: identita z JWT v handshake (`presence.gateway.ts:123`). REST `/presence/online`: JwtAuthGuard (každý přihlášený).
- **Jak funguje (WS, `presence.gateway.ts`)** In-memory registry `userId → set socketů` (single-instance). Při connect: snapshot stavu (`presence:snapshot`) novému klientovi + broadcast `presence:update` online. Idle per-socket: user je idle ⟺ všechny jeho sockety idle (W-11). Disconnect posledního socketu → `presence:update offline`. FE `usePresenceInit` (`usePresence.ts:25`) poslouchá snapshot/update + activity tracker (5 min nečinnosti → `presence:idle`, návrat → `presence:active`, `visibilitychange`).
- **Hranice/co neumí**
  - WS presence je **single-instance** (in-memory) — multi-instance vyžaduje Redis adapter (dluh D-051 „chat-presence-scale").
  - REST práh 25 h = „byl tu dnes/včera", ne živá online — hrubý signál.
  - Presence není world-scoped (vidíš globální online stav, ne „kdo je právě v tomto světě").
- **Stav** 🚧 (funkční single-instance; škálování = dluh)
- **Kód** BE `presence.service.ts`, `presence.controller.ts`, `presence.gateway.ts`. FE `src/shared/presence/usePresence.ts`, `OnlineDot.tsx`.

---

## I. Governance — Elevation („nahození práv") & soft-delete / restore světa

### Elevation — admin moc uspaná, per-svět nahoditelná (nahradila R-20 „natvrdo bez moci", 2026-06-21)
- **Co to je:** platform Admin/Superadmin má world pravomoci **uspané** — chová se jako jeho world membership role (nebo nečlen). Plnou moc PJ získá JEN po vědomém **nahození** pro daný svět; pak ji zase složí.
- **Kde:** toggle zámku/štítu v hlavičce světa (`AdminElevationToggle`) — „Aktivovat admina" / „Admin režim". Viditelný platform adminovi i mimo full nav.
- **Princip (BE):** kolekce `world_elevations` `{userId, worldId}`, guard plní `requester.elevatedWorldIds` (jen pro `role<=Admin`), helper `worldAdminBypass(user, worldId)` (`common/utils/world-elevation.ts`) nahradil VŠECH ~45 přímých `role <= Admin` ve world-scoped branách (worlds/pages/chat/maps/campaign/characters/calendars/timeline/weather/news/currencies/emotes/sounds/universe/gm-notes/bestiae).
- **✅ OPRAVENO 2026-07-05 (FIX-19, RUN-2026-07-05) — governance mezera.** `canAdminWorld` (`worlds.service.ts:2161`) měl parametry `requester`/`world` **nepoužité** (`_requester`/`_world`) — vracel true jen pro membership ≥ PJ, elevaci vůbec nečetl. Elevovaný admin tak v UI viděl "Admin režim ZAPNUT" i tab Nastavení, ale každá skutečná mutace (uložit nastavení, upravit člena, smazat svět, změnit výchozí kalendář) spadla na BE 403 — elevace pokrývala čtení/chat/mapu/postavy, ale ne **governance** (settings/mazání/šablona deníku/správa členů). Teď `canAdminWorld` nejdřív zkusí `worldAdminBypass`, pak membership ≥ PJ — elevovaný admin/superadmin dostane skutečnou PJ moc přes `canAdminWorld` a (skrz něj) i `canManageMembers`/`canEditWorldData`. `assertCanModerateAccessRequests` (schvalování žádostí) a `updateCalendarDefaults` dostaly stejný `worldAdminBypass` check zvlášť (nejely přes `canAdminWorld`).
- **Kdo smí elevovat:** jen platform Admin/Superadmin (`assertCanElevate` → jinak 403). `POST/DELETE/GET /worlds/:worldId/elevation`.
- **Cross-user / WS:** chat `isWorldManagerByUserId` (`:114`) a `maps.gateway` čtou elevaci z DB (`isElevated`) — nemají `requester.elevatedWorldIds` (WS mimo HTTP guard).
- **Audit:** každé nahození/složení → `admin_audit_log` (`WORLD_ELEVATION_ACTIVATED/REVOKED`, targetType `world`), event-driven `world.elevation.changed`.
- **Životnost:** bez časové expirace (on/off); **logout elevaci skládá** (`auth.service` → `deactivateAllForUser`); hard-delete účtu uklidí.
- **Read v de-elevated:** admin-nečlen na private světě nevidí OBSAH (pages/chat/settings = jako nečlen), ale vidí **shell** (název) pro toggle. „Vidět jako hráč" = obsah, ne existence/jméno.
- **Důsledky v UI:** `WorldSettingsPage` (`effectiveRole = WorldRole.PJ`, když `world.elevated`, jinak skutečná world role — `WorldSettingsPage.tsx:253-256`) i `WorldLayout` `isPJ`/`isPJForNav`/`navBypass`/`showFullNav` a `WorldMembershipGuard` fallback jsou podmíněny `world.elevated` — tab se teď zobrazí PŘESNĚ tehdy, když BE akci i povolí (FIX-19 srovnal FE zobrazení s BE realitou).
- **Lint guard:** `scripts/check-elevation-bypass.mjs` (v `lint:check`) brání novému přímému `role <= Admin` ve world modulech (výjimky přes `// elevation-exempt`).
- **Jediná moc mimo elevaci** = **restore** opuštěného soft-smazaného světa (platform akce mimo world runtime).
- **Stav:** ✅ funguje (BE jest 2225/2225 + lint guard + FE build/testy zelené). **Po BE změně restart.**
- **Kód:** BE `modules/world-elevations/*`, `common/utils/world-elevation.ts`, `worlds.service.ts` (`elevate`/`deElevate`/`getElevationStatus`/`enrichElevation`/`applyDetailScope`), `worlds.controller.ts`; FE `features/world/api/useWorldElevation.ts`, `features/world/components/AdminElevationToggle.tsx`, `WorldLayout.tsx`, `WorldMembershipGuard.tsx`.

### Soft-delete světa — tab „Smazat svět" (DeleteWorldTab)
- **Kde** `/svet/:slug/nastaveni#smazat`, tab od `PJ` (`WorldSettingsPage.tsx:177`).
- **Akce** `DELETE /worlds/:id` → `softDelete` (`worlds.service.ts:1779`). Gate `canAdminWorld` = membership ≥ PJ **nebo elevovaný platform Admin/Superadmin** (FIX-19, viz výše — dřív jen membership PJ). Nastaví `isActive:false, deletedAt, deletedBy`. Data ZŮSTÁVAJÍ (nedestruktivní cascade přes `world.deleted` event — chat softDelete atd.). 30denní okno na obnovu.
- **Hranice** `WORLD_ALREADY_DELETED` (400). Po 30 dnech cron hard-delete (`world-cleanup.cron.ts` + `world-hard-delete.service.ts`). PJ (nebo elevovaný admin) smaže, ale obnovit už NEMŮŽE (jen Admin/Superadmin přes recovery panel, i bez elevace).
- **✅ OPRAVENO 2026-07-05 (FIX-17, RUN-2026-07-05) — soft-smazaný svět přestal být "živý" přes ID.** Nový guard `assertWorldActive` (`worlds.service.ts:222`) vyhodí 404 `WORLD_NOT_FOUND` na všech read/join/edit cestách (detail, settings, join/access-request, schválení/zamítnutí, členství, role/skupina/postava člena, kalendářní defaults, diary schema…) KROMĚ `restore`/`listDeleted`. Dřív soft-smazaný svět zůstal pro ne-admina dosažitelný přímou cestou (`GET`/`PATCH` na známé ID) — membership se při soft-delete nemaže, takže bývalý člen mohl dál číst interní settings (persona, AKJ) nebo se pokusit o zápis. Pro kohokoli mimo recovery flow je smazaný svět teď neexistující.
- **Zvláštnost vs. memory** Memory `feedback`/index uvádí „PJ maže". Kód: gate je `canAdminWorld` = membership ≥ PJ nebo elevovaný Admin/Superadmin (od FIX-19). UI text DeleteWorldTab „PJ vlastník i Admin" je tak přesnější než dřív — platí ale jen pro **elevovaného** Admina, ne pro kohokoli s globální rolí Admin bez aktivního nahození. Viz Nesrovnalosti.

### Restore světa — Admin recovery panel (mimo svět)
- **Akce** `POST /worlds/:id/restore` (`worlds.service.ts:1598`) + `GET /worlds/deleted` (`:1636`). JEN Admin/Superadmin (`requester.role <= UserRole.Admin`); PJ vlastník NEMŮŽE — musí o obnovu požádat Admina. Okno 30 dní (`RECOVERY_WINDOW_MS`), po něm `WORLD_RECOVERY_EXPIRED` (410). Volitelný `newOwnerId` = převzetí světa po odchodu PJ. Emit `world.restored` (un-soft-delete dat). UI v platformovém Admin panelu (`useWorldLifecycle.ts` `useDeletedWorlds`/`useRestoreWorld`).
- **Stav** ✅
- **Kód** FE `tabs/DeleteWorldTab.tsx`, `useWorldLifecycle.ts`. BE `worlds.service.ts:1770` (softDelete), `:1813` (restore), `:1853` (listDeleted).

---

## J. Nastavení světa — přehled tabů & gating (kontext)

`WorldSettingsPage` (`/svet/:slug/nastaveni`) — viditelnost tabů řízena skutečnou world rolí, **nebo** aktivní elevací (`world.elevated` → `effectiveRole = PJ`, viz sekce I):

| Tab | minRole | Pozn. |
|---|---|---|
| Základní info, Přístup, Šablony, Vzhled | Korektor | metadata + accessMode |
| Členové, AKJ úrovně, PJ v chatu, Emoty světa, Kalendáře | PomocnyPJ | správa členů, AKJ, persona |
| Postavy & NPC, Hlavní lišta, Smazat svět | PJ | |
| Šablona deníku | PJ + `system=custom` | minSystem gate |
| Můj vzhled, Členství | Ctenar | self-service |

- **Přístup tab (AccessModeTab)** přepíná `accessMode` přes `PATCH /worlds/:id` (gate `canAdminWorld`?). Přechod na „Uzavřený" má confirm. BE `update` (`worlds.service.ts`).
- **Kód** `WorldSettingsPage.tsx:65-183`.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

1. ✅ VYŘEŠENO 2026-07-05 (FIX-19, RUN-2026-07-05) — **DeleteWorldTab text vs. realita.** Do 2026-06-18 šlo jen o nepřesný JSDoc komentář (text „PJ vlastník i Admin" byl tehdy prostě špatně, BE Admina nepouštěl vůbec). Skutečná mezera byla hlubší: i PO zavedení elevace (2026-06-21) `canAdminWorld` elevaci ignoroval (nepoužité parametry) — elevovaný Admin dostal 403 i s aktivním "Admin režimem". Teď `canAdminWorld` čte `worldAdminBypass` → text „PJ vlastník i Admin" je konečně pravdivý, ale jen pro **elevovaného** Admina (ne pro kohokoli s globální rolí Admin bez nahození).

2. ✅ VYŘEŠENO 2026-07-15 (15.10) — **„Hráči" stránka bez akcí PJ.** Stránka byla read-only adresář; teď nese sekci „Čekající žádosti" (schválit/odmítnout, vč. přihlášek s postavou) + „Přidat hráče" (pozvat / odkaz) + online tečky + sekci Nováčci. Měnění rolí/vyhazování zůstává v Nastavení#clenove (záměrně).

2b. ✅ VYŘEŠENO 2026-07-15 (15.10) — **co-PJ neviděl frontu žádostí.** `WorldAccessRequestProvider.scopeForUser` scopoval pending frontu jen `findByOwnerId` → co-PJ (člen role ≥ PJ) měl právo schválit (`assertCanModerateAccessRequests`), ale žádost ve frontě „Zpracovat" vůbec neviděl. Opraveno: scope = „vlastník NEBO člen role ≥ PJ" (sjednoceno s gate). Provider + nový world-scoped `getWorldPendingActions` sdílí stejný scope.

3. **Approve žádostí = PJ, ne PomocnyPJ.** `assertCanModerateAccessRequests` (`:1048`) pouští owner + membership PJ + (od FIX-19) elevovaný Admin/Superadmin. PomocnyPJ (který jinak spravuje členy přes `canManageMembers`) žádosti o vstup schvalovat pořád NEMŮŽE. Asymetrie vůči ostatní správě členů — záměr? Pro průvodce explicitně uvést.

4. **`assertMember` práh = Hrac, ne Ctenar.** Content read gate `assertMember` (`:1934`) odmítá role < `Hrac`(2), tj. i `Ctenar`(1) — „Pending členství nemá přístup". Ale FE memberOnly routy (chat, stránky, mapa…) mají `minWorldRole=Ctenar`. Pokud konkrétní BE endpoint použije `assertMember` (timeline/pocasi/diary-schema), Čtenář dostane 403 i když ho FE guard pustil. Většina obsahových modulů má vlastní gate (Ctenar+), ale pro moduly volající `assertMember` to znamená Čtenář = bez přístupu. K ověření per-modul (mimo tuto kapitolu).

5. ✅ VYŘEŠENO 2026-06-21 (elevation), doplněno 2026-07-05 (FIX-19) — **FE guard fallback Sa/Admin vs. BE.** Drift „FE pustí admina, BE 403kuje" odstraněn: `WorldMembershipGuard` fallback i `WorldLayout` (`isPJ`/`showFullNav`) jsou nově podmíněny `world.elevated`. De-elevated admin = jako nečlen na obou stranách; po nahození (toggle) projde vším. **Zbytek gapu:** `WorldSettingsPage` sama ukazovala tab elevovanému adminovi už od 2026-06-21, ale `canAdminWorld` na BE elevaci do 2026-07-05 nečetl vůbec (viz sekce I, FIX-19) — takže tab byl vidět, ale uložení spadlo na 403. Teď FE i BE souhlasí. Zbývá drobnost: router-level `memberOnly` fallback (router.tsx) elevaci ještě nečte — ale BE je autoritativní, takže max zobrazí prázdnou stránku, ne reálný leak.

6. **Presence škálování (D-051).** WS presence je in-memory single-instance; v multi-instance prod (PM2 cluster / víc podů) by online stav byl per-instance nekonzistentní. Sledováno jako dluh. Stav funkce proto 🚧.

7. **`accessMode` názvosloví je matoucí.** `public` = bez schválení, `open` = SE schválením. Intuitivně by „open" znělo jako „bez schválení". Dáno historicky; v UI je to přeloženo správně (PillChips labely), ale v kódu/API je to past při čtení.
