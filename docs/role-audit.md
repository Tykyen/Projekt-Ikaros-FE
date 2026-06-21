# Role audit — registr nálezů oprávnění (FE gating ↔ BE guard)

> Centrální registr nálezů z [`role-plan/`](role-plan/README.md). ID `R-xx`.
> Sourozenec [`bug-audit.md`](bug-audit.md) (logika) a [`ws-audit.md`](ws-audit.md) (real-time),
> ale výhradně pro **autorizační vrstvu**: sedí frontendové gating proti backendovým guardům?
> Stav: zahájeno 2026-06-04 (plán + oblast 00, zkoušky probíhají).

---

## TL;DR (2026-06-04)

> **Stav: 100% sweep DOKONČEN + všechny nálezy opraveny (2026-06-05).** Plán [`role-plan/`](role-plan/README.md)
> — 10 oblastí, ~200 bodů projito (1. cílená vlna + 2. hloubkový sweep všech ⬜ bodů přes 10 paralelních
> agentů, verdikty proti reálnému kódu). **19 nálezů (R-01…R-19) + area00-K2 — VŠECHNY opraveny + ověřeny;**
> 7 položek zaevidováno jako přijatý dluh (low/by-design). Sweep odhalil **3 kritické/vysoké bezpečnostní
> díry, které cílená 1. vlna minula** (R-07 mrtvý account-state gate, R-08 nevynucený ban, R-11 neautentizovaný
> dump mapy) — proto měl 100% smysl. BE: tsc 0, **plný jest ~1909/1909**. FE: tsc 0, eslint čistý.
>
> | ID | Závažnost | Oblast | Podstata | Stav |
> |---|---|---|---|---|
> | **R-11** | 🔴🔴 KRITICKÁ | 07 | `GET /maps?worldId=` **bez `@UseGuards`** → anonymní dump celé taktické mapy (tokeny, HP, pozice, fog, kostky) jakéhokoli světa | ✅ opraveno (+2 testy) |
> | **R-07** | 🔴🔴 KRITICKÁ | 01 | Account-state gate v `JwtAuthGuard` je **mrtvý kód** (`request.user?.sub`, ale strategy vrací `.id`) → smazaný/pending účet s 7d tokenem projde na vše | ✅ opraveno (+ spec mock fix) |
> | **R-08** | 🔴 vysoká | 01 | **Ban se nikde nevynucuje** — `bannedAt` se nastaví, ale login ani guard ho nečtou → zabanovaný uživatel dál pracuje; FE `BANNED` handler mrtvý | ✅ opraveno (+1 test) |
> | **R-09** | 🟠 střední | 04 | `GET /pages` (`findByWorld`) neaplikuje page-level `assertAccess` → vrací obsah AKJ-chráněných stránek (latentní — bez FE konzumenta) | 🐛 potvrzeno |
> | **R-10** | 🟡 nízká | 02 | FE `ArticleDetailPage` REVIEWER_ROLES obsahuje neexistující `UserRole.PJ` (N-14 regrese; runtime neškodné, ale drift + build chyba) | 🐛 potvrzeno |
> | **R-04** | 🔴 vysoká | 08/09 | Restricted world chat zprávy tečou přes WS `room:join` (jen regex) bez access checku — REST gated, WS ne (PC leak) | ✅ opraveno (+5 testů) |
> | **R-03** | 🔴 vysoká | 03 | `updateMemberRole` nemá strop — PomocnyPJ povýší sebe/kohokoli na PJ a demotuje PJ/ownera (vertikální eskalace, insider) | ✅ opraveno (+3 testy) |
> | **R-02** | 🟡 nízká | 05 | Account permission vrstva (`isWorldStaff`) bez GlobalAdmin bypassu — platform Admin non-member dostane 403, jinde projde | ✅ opraveno (+3 testy) |
> | **R-06** | 🟡 nízká | 06 | FE timeline route povoluje Ctenar, BE vyžaduje Hrac → Ctenar dostal 403 na načtené stránce + matoucí kód | ✅ opraveno (FE+BE) |
> | **R-05** | 🟡 nízká | 02 | Granular `adminPermissions`: `canManageAdmins` + `canEditPlatformPages` se v UI přepínají, ale BE je nevynucuje (jen `canModerateContent` funguje) — klamavé toggly | ✅ opraveno (A, +5 testů) |
> | **R-01** | 🟡 nízká | 00 | FE prahy `role <= 3` cílí na globálního PJ(3), který FE enum nezná (D-053 ho zrušila) — vestigiální past | ✅ opraveno |
> | **R-20** | ⚖️ politika | 03 | Platformový Admin/Superadmin **vyřazen z governance světů** (rozhodnutí uživatele 2026-06-13); pojistka = jen `restore` opuštěného světa. **2026-06-21 přepracováno na ELEVATION** (moc uspaná, per-svět nahoditelná) — viz doplněk níže | ✅ aplikováno → ✅ elevation (BE+FE) |
>
> **2. audit vlna (2026-06-04):** K-R5 → **R-05 ✅ opraveno (varianta A)** (canManageAdmins wired: gatuje admin-permissions endpoint, Admin-manager smí delegovat moderaci; canEditPlatformPages skryt — mrtvý) · HN-10 → **R-06 ✅ opraveno** (FE route Hrac práh + BE rozlišený kód) · **SM-06 ✅ konzistentní** (moderace AR owner-only) · **K-R2 ✅ konzistentní** (PomocnyPJ tab-filter BE-autoritativní).
>
> **Stav oprav (2026-06-04):** **VŠECH 6 nálezů opraveno + ověřeno** (R-01…R-06). BE: tsc 0, **plný jest 1905/1905** (115 suites, +16 nových testů). FE: tsc 0, eslint čistý, WorldLayout 5/5. Runtime (real-time R-04, `nest start` DI) = lidský/dev test. Git neřešen (commituje uživatel).
>
> ---
>
> **Doplněk 2026-06-13 — R-20 (politická změna, ne bug): platformový Admin/Superadmin vyřazen z governance světů.**
> Rozhodnutí uživatele: svět je doména PJ; Admin do něj nesahá (kromě obnovy opuštěného světa). BE [`worlds.service`](../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts) —
> odebrán admin bypass ze **4 bran**:
> - `assertCanModerateAccessRequests` → přijetí/odmítnutí žádosti **vlastník NEBO člen role PJ** (co-PJ; dřív owner|admin, PomocnyPJ ne). Brána je nově `async` (dotahuje membership).
> - `canAdminWorld` → **jen world PJ** (dřív admin|PJ); kaskáduje na: nastavení světa, soft-delete, **správa členů**
>   (přes `canManageMembers`), **update světa** name/žánr/systém (přes `canEditWorldData`).
> - `transferOwnership` → **jen vlastník**. · `updateCalendarDefaults` → **PomocnyPJ+**.
>
> **Ponecháno jako pojistka (admin-only, beze změny):** `restore` + `listDeleted`. Admin smí obnovit **JEN**
> soft-smazaný svět (po zániku účtu PJ se world auto-soft-smaže `owner-safeguard` listenerem `user.deletion.hardDeleted`)
> v 30denním okně + dosadit nového PJ (`restore(newOwnerId)`). Na živém světě `restore` hodí „svět není smazán" →
> admin nula moci. Admin si ponechává **read** viditelnost (`applyDetailScope`/`assertMember`) — musí svět vidět, aby ho obnovil.
>
> **Ověřeno:** BE tsc 0, **plný jest 1997 pass** (1 fail = pre-existing rulebook seed `pages-world-seed`, mimo), eslint čistý.
> 2 testy obráceny (admin už nesmí update/reject) + 3 admin-Forbidden (approve/role/transfer) + 1 co-PJ-smí-moderovat. **Necommitnuto (git ručně).**
> **Rozsah:** jen `worlds.service` governance; admin bypassy v jiných modulech (pages/chat/maps **obsah**) = samostatný budoucí průchod.
>
> **FE (2026-06-13) — sjednoceno s BE:** odebrána admin→PJ inflace ze 2 governance komponent:
> [`WorldSettingsPage`](../Projekt-ikaros-FE/src/features/world/pages/WorldSettingsPage/WorldSettingsPage.tsx) (`effectiveRole`) a
> [`MembersTab`](../Projekt-ikaros-FE/src/features/world/pages/WorldSettingsPage/tabs/MembersTab.tsx) (`viewerRole`) → platform admin bez world-staff role **nevidí** management taby ani role/odebrání/skupiny → žádné 403 tlačítko.
> **Ponecháno:** `showFullNav`/`isGlobalAdmin` ve `WorldLayout` (admin **vidí** svět = read) a `isPJ`/`isPJForNav` (obsah: Nová stránka, Deník PJ — BE pages adminovi pořád dovolí, jiný scope). Approve/reject žádostí žije v inboxu „Zpracovat" (`WorldAccessRequestRenderer`) — gatuje BE doručením majiteli/PJ, ne admin flag → beze změny.
> FE build (tsc -b) 0, eslint čistý, 8/8 WorldSettingsPage+MemberRow specs zelené (1 nesouvisející pre-existing fail `worldNavConfig` — Mapy nav).
>
> **DOPLNĚK 2026-06-21 — R-20 PŘEPRACOVÁNO na ELEVATION model (rozhodnutí uživatele).**
> R-20 „admin natvrdo bez moci" nahrazeno modelem **elevation („nahození práv")**: platform Admin/Superadmin
> má world pravomoci JEN když si je per-svět vědomě aktivuje (toggle); jinak se chová jako hráč. Sjednocuje
> dříve roztříštěný admin bypass (~45 bran ve 20 modulech) pod jeden vědomý přepínač + audit.
> Spec: [spec-world-admin-elevation.md](arch/phase-1/_side-tasks/spec-world-admin-elevation.md).
> - **BE:** kolekce `world_elevations`, guard plní `requester.elevatedWorldIds`, helper `worldAdminBypass(user, worldId)`
>   nahradil VŠECH ~45 přímých `role <= Admin` ve world-scoped branách; `POST/DELETE/GET /worlds/:id/elevation`;
>   audit `admin_audit_log` (`WORLD_ELEVATION_ACTIVATED/REVOKED`); logout elevaci skládá; WS (maps.gateway) +
>   cross-user (chat `isWorldManagerByUserId`) čtou elevaci z DB. **Lint guard** `scripts/check-elevation-bypass.mjs`
>   (zapojen v `lint:check`) brání vzniku nového přímého bypassu.
> - **FE:** `world.elevated` enrich; `isPJ`/`isPJForNav`/`navBypass`/`showFullNav` (WorldLayout) i `WorldMembershipGuard`
>   fallback nově podmíněny `world.elevated`; toggle zámku v hlavičce světa (`AdminElevationToggle`).
> - **Výjimky (elevation-exempt v kódu):** platform akce mimo svět (restore/listDeleted, upload, globální novinky/chat/zvuky,
>   cross-world šablony, bestiář system/user scope). **Korekce:** de-elevated admin vidí metadata světa (shell), gated je obsah.
> - **Ověřeno:** BE tsc + jest 2225/2225 + lint:check; FE build + testy. **Po BE změně restart.**
>
> **Ověřeno vzorně (bez díry):** MA-06/07/08/09 (`operations-authorizer` field-level/isLocked/ownership/dice
> spoof — vše drží, L2) · PO-09 (write-settings staff-only, controller volá assert před update) ·
> **SP-01/SP-02** (search **i embedding** filtruje `findVisibleSlugs` na sjednocený výsledek — N-35 kryje oba; jen `count`-před-filtrem UX nit) ·
> **PO-11/PO-12** (N-22 obchod `isShared` hráči ✅ · N-24 `listPurchases` všechny postavy hráče + cizí `characterId` ignorován = IDOR-safe) ·
> **SM-06 / K-R2** (moderace AR owner-only · AKJ tab filtr BE-autoritativní — obojí konzistentní).
>
> **Kandidáti z inventury (k ověření):** viz sekce níže.

---

## Vlna 2 — hloubkový 100% sweep (10 oblastí, 10 agentů) — zbylé nálezy

> Plný sweep všech ⬜ bodů napříč 00–09 (paralelní agenti, verdikty proti reálnému kódu). Kritické
> (R-07/R-08/R-11) výše. Zde **zbylé** potvrzené + kandidátní. `[ja]` = ověřeno mnou čtením,
> `[agent]` = z agenta s `soubor:řádek`, k doověření při opravě.

**🟠 STŘEDNÍ (leak / herní bloker):**
- **R-12** ✅ **opraveno** — `dungeon-maps` `findByWorld`/`findById` read-gate (PJ, `assertCanManage`) + threading user; +2 testy.
- **R-13** ✅ **opraveno** — `world:operation` přesunut do PJ-only roomu `world-ops:{id}` (pomlčka rozbije regex generického `room:join`); join/leave/emit, FE beze změny.
- **R-09** ✅ **opraveno** — `GET /pages` (`findByWorld`) doplněn per-page `assertAccess` filtr (+ threading role); listing už neleakuje obsah chráněných stránek.
- **R-14** ⚖️→🟡 **přeřazeno** — BE `assertSubdocAccess` Lokace = PomocnyPJ+ je **ZÁMĚR** (8.1-FIR 2026-05-24 vědomě přebíjí spec 9.2, [characters.service.ts:148](../Projekt-ikaros/backend/src/modules/characters/characters.service.ts#L148)). Ne bug; zbývá jen FE: skrýt Lokace kalendář tab non-staff (nízká UX).
- **R-15** ✅ **opraveno** — mrtvý globální `role > UserRole.PJ(3)` gate odstraněn ze `scenario-templates`+`map-templates` (per-owner privátní knihovna, owner checks zůstávají); specs aktualizovány. ⚠️ mírné uvolnění práva (PJ-only→přihlášený), flagnuto.

**🟡 NÍZKÉ (parity / UX / drift) — ✅ FE várka DOTAŽENA:**
- **R-19** ✅ owner self-leave kód `WORLD_OWNER_CANNOT_LEAVE` (BE).
- **R-10** ✅ FE `ArticleDetailPage` REVIEWER_ROLES bez `UserRole.PJ`.
- **R-16** ✅ favorite hvězda gate na PomocnyPJ+ (`PageHeader.tsx`).
- **R-17** ✅ scene-create buttony (Knihovna/Nová/Načíst) gate na PJ(5) (`MapPjPanel.tsx`) — align FE→BE.
- **R-18** ✅ route prahy `/kalendar`→PomocnyPJ, `/pocasi`→Hrac (`router.tsx`).
- **R-14** ✅ Lokace kalendář tab skryt non-staff (`LokaceLayout.tsx`); BE staff-only = záměr 8.1-FIR.
- **area00-K2** ✅ mrtvá `@Roles(…UserRole.PJ)` z `recent-pages` odstraněna.

**Přijatý dluh (low / by-design / k rozhodnutí — NEopraveno, zaevidováno):**
- WR-09-B — `worlds.gateway` emituje plný `membership` objekt do `world:{id}` místo `{worldId}` signálu (leak-safe konzistence, nízká).
- WR-08 — `map:join` jen membership, ne scene-assignment (marginální; závisí, zda REST scény gatuje stejně).
- PO-14 — `POST shopitems` bez role-gate (ale per-owner privátní, FE skrývá; by-design jako ostatní campaign entity).
- PO-10 — primary-owner delete účtu UI skryto <PomocnyPJ (možná záměr 8.6 Q8.4).
- area00-K3 — `?? WorldRole.Zadatel(0)` fallback v 5 FE souborech (latentní, dnes neškodné).
- area00-K4 — WeatherSetsModal `isGlobalAdmin || true` (FE DD gap, BE autoritativní).
- D-MAP-D — žádné per-role utajení HP (`enrichTokens` posílá HP všem; chybějící featura, ne bug).
- **Drobné/dluh:** D-MAP-D (žádné per-role utajení HP — `enrichTokens` posílá HP všem), WR-09-B (plný membership objekt do `world:{id}` místo signálu), WR-08 (`map:join` bez scene-assignment checku), PO-14 (`POST shopitems` bez role-gate, ale privátní), PO-10 (primary-owner delete UI skryto), area00-K3 (`?? Zadatel(0)` fallback), area00-K4 (WeatherSetsModal `||true`), area00-K2 (mrtvé legacy `@Roles(…PJ)`).

**📝 Doc fixy (kód OK, plán/matice nepřesné):** SP-07/PL-16/PL-17 (403 vs 404 — kód dle auth-leak-policy správně, plán chce 404), PO-17 (Zadatel měny **čte**), C08-1 (`all` kanál = Hrac+, ne Ctenar), MA-10/MA-14 (fog=PomocnyPJ, scene-log hráč vlastní scénu).

**✅ Ověřeno bez díry (vlna 2, výběr):** WS identita z JWT napříč 12 gatewayi (WR-01..05), whisper izolace (WR-12), leak-safe signály (WR-10), chat accessMode/sound N-9/emote prahy (CH-01..19), bestiae 3-scope (PO-18..20), game-events groupOnly **404** anti-leak (HN-03), deník PJ per-PJ izolace (HN-17), timeline/weather prahy, RolesGuard sweep (žádný bez @Roles, RM-15).

---

## Baseline — health checks

| Check | Repo | Výsledek | Pozn. |
|---|---|---|---|
| `npm run audit:routes` | FE | ⬜ ověřit | jen existence FE↔BE, **ne role** |
| `tsc --noEmit` | FE+BE | ⬜ ověřit | |
| guard/auth jest specs | BE | ⬜ inventura | oblast 00 |
| FE guard testy (`WorldMembershipGuard`/`RoleGuard`) | FE | ⬜ inventura | oblast 00 |

---

## Nejostřejší kandidáti (z inventury, k potvrzení)

> Hypotézy z hloubkového čtení při psaní plánu. **Nejsou potvrzené nálezy** — nejvyšší priorita
> ověření. Potvrzené se přesunou níž jako `R-xx`. Lekce z bug-auditu (N-10/N-14): u role nálezů
> **vždy ověřit enum + komentář + bypass větev**, ne věřit prvnímu dojmu agenta.

| Kandidát | Oblast | Podstata | Osa |
|---|---|---|---|
| **K-R1** ✅→R-01 | 00 | FE `role <= 3` práh vs zúžený FE enum (D-053). Potvrzeno čtením → R-01. | `EN` |
| **K-R2** | 04 | AKJ: PomocnyPJ má **page-level** bypass, ale **ne tab-level** auto-bypass — sedí FE filtru? | `BY` |
| **K-R3** | 05 | `assertCanAdjust` + `allowPlayerSelfAdjust` — FE skryje „Storno" hráči bez práva, ale dovolí klik když `true`? (vazba na N-23) | `PA` `OR` |
| **K-R4** | 07 | `operations-authorizer` `allowedPlayerFields` ↔ FE `useTokenPermissions` — pole 1:1? (vazba na N-26/N-29) | `OR` `ES` |
| **K-R5** | 02 | `adminPermissions` (canManageAdmins/ModerateContent/EditPlatformPages) — má FE granular gating, nebo jen `role <= Admin`? | `PA` |
| **K-R6** | 03 | owner pravidla: FE blokuje odchod ownera ↔ BE 400 WORLD_OWNER_CANNOT_LEAVE — obě strany? | `PA` |
| **K-R7** | 06 | `game-events` `groupOnly` → BE 404 (anti-leak) ↔ FE skryje událost jiné skupiny? | `LK` |

---

## Potvrzené nálezy

### R-01 — FE práh `role <= 3` cílí na globálního PJ(3), který FE enum nezná ⚠️ (vestigiální, nízká)
- **Oblast / bod:** [00](role-plan/00-role-model-guardy.md)
- **Soubor:** FE [WorldLayout.tsx:272](../Projekt-ikaros-FE/src/app/layout/WorldLayout/WorldLayout.tsx#L272) (`currentUser.role <= 3`) ↔ FE enum [index.ts:6](../Projekt-ikaros-FE/src/shared/types/index.ts#L6) (zná jen 1,2,9–12) ↔ BE enum [user.interface.ts:1](../Projekt-ikaros/backend/src/modules/users/interfaces/user.interface.ts#L1) (drží legacy 3–8)
- **Symptom:** Práh `role <= 3` ve výpočtu `isPJForNav`/`isPJ` má reprezentovat „Superadmin/Admin/PJ". Globální PJ má hodnotu 3, jenže D-053 ([index.ts:1-5](../Projekt-ikaros-FE/src/shared/types/index.ts#L1)) globální PJ zrušil a migroval na Ikarus(9). FE enum hodnotu 3 vůbec nedefinuje. Práh tedy fakticky znamená jen `Superadmin(1) || Admin(2)` — a funguje **jen** proto, že globální roli 3 dnes nikdo nemá.
- **Root cause:** Cleanup D-053 zúžil enum, ale prahové konstanty `<= 3` zůstaly z doby, kdy byl PJ globální role. BE enum legacy hodnoty 3–8 nesmazal (jen je migrace přestala přiřazovat; `Zakaz=8` se aktivně přiřazuje při banu).
- **Osa:** `EN`
- **Dopad:** Žádný v provozu (nikdo nemá globální roli 3). **Latentní past:** kdyby kdokoli v budoucnu přiřadil globální roli na hodnotu 3, tiše dostane PJ-nav bez membershipu. Čitelnost: práh `<= 3` mate (vypadá, že 3 něco znamená).
- **Návrh:** Nahradit magický `<= 3` explicitním `role <= UserRole.Admin` (= `<= 2`); odstranit komentářovou zmínku o PJ. Volitelně: BE vyčistit legacy enum hodnoty 3–7 (ponechat `Zakaz`). Kosmetické + obrana proti budoucí pasti.
- **Stav:** ✅ **opraveno** — [WorldLayout.tsx:274,300](../Projekt-ikaros-FE/src/app/layout/WorldLayout/WorldLayout.tsx#L274) `<= 3` → `<= UserRole.Admin` (oba `isPJForNav` i `isPJ`), komentář opraven. Behavior-identical (nikdo nemá globální roli 3). BE legacy enum (3–8) **ponechán** — `Zakaz(8)` se aktivně přiřazuje při banu, mazat 3–7 je samostatný cleanup mimo rozsah. Ověřeno: FE tsc 0, eslint čistý, WorldLayout 5/5.

### R-11 — `GET /maps?worldId=` je neautentizovaný → anonymní dump taktické mapy 🐛🔴🔴 (KRITICKÁ — leak)
- **Oblast / bod:** [07](role-plan/07-svet-mapa.md) MA-01..03 (přístupová vrstva)
- **Soubor:** [maps.controller.ts:56-63](../Projekt-ikaros/backend/src/modules/maps/maps.controller.ts#L56) (`@Get() findByWorld` — **žádný `@UseGuards`**, třída `@Controller('maps')` taky bez class-guardu) — kontrast hned **další** endpoint [:71-72](../Projekt-ikaros/backend/src/modules/maps/maps.controller.ts#L71) `@Get('active')` má `@UseGuards(JwtAuthGuard)`
- **Symptom:** `GET /maps?worldId=<id>` (i `?isActive=true` → `findActiveScenes`) je **bez autentizace**. `toEntity` mapper vrací plné scény: tokeny (`currentHp/maxHp`, pozice, `notes`), `revealedHexes` (fog), NPC šablony, `diceRolls`. → kdokoli bez přihlášení stáhne kompletní taktickou mapu jakéhokoli světa jen podle worldId.
- **Dopad:** Neautentizovaný únik veškerého herního stavu mapy (skryté pozice nepřátel, fog, HP, poznámky). Nejde jen o membership — je to úplně otevřené. Závažné.
- **Root cause:** Endpoint zřejmě vznikl před zavedením auth guardů a nikdy nedostal `@UseGuards`; sousední `active` ho má → kopírovací opomenutí.
- **Osa:** `LK` — neautentizovaný leak
- **Návrh:** Přidat `@UseGuards(JwtAuthGuard)` na `findByWorld` (nebo class-level) + membership read-check (`assertCanReadScene`/member-of-world) jako u ostatních map endpointů. **Pozor na FE konzumenty** (`useActiveScenes`/orchestrátor) — ověřit, že posílají token (měli by, jsou za login). Malá, kritická oprava.
- **Stav:** ✅ **opraveno** — `findByWorld` dostal `@UseGuards(JwtAuthGuard)` + `@CurrentUser`; service `findByWorld`/`findActiveScenes` přes `assertStaff` (GlobalAdmin || PomocnyPJ+). `getScenes` (all) nemá FE konzumenta, `getActiveScenes` jen PJ orchestrátor → bez dopadu. +2 testy (hráč→403, admin→OK). Plný jest 1908/1908.

### R-07 — Account-state gate v `JwtAuthGuard` je mrtvý kód (`sub` vs `id`) 🐛🔴🔴 (KRITICKÁ — auth bypass)
- **Oblast / bod:** [01](role-plan/01-auth-ucet-guest.md) AU-08/AU-09 (RA-1)
- **Soubor:** [jwt-auth.guard.ts:30](../Projekt-ikaros/backend/src/common/guards/jwt-auth.guard.ts#L30) (`const userId = request.user?.sub`) ↔ [jwt.strategy.ts:19-27](../Projekt-ikaros/backend/src/modules/auth/strategies/jwt.strategy.ts#L19) (`validate` vrací `{ id: payload.sub, … }` — **bez `sub`**)
- **Symptom:** Passport ukládá návratovou hodnotu `validate()` do `request.user`, tj. `{ id, email, username, role, characterPath }`. Guard ale čte `request.user?.sub` → **vždy `undefined`** → celý blok `if (userId) { … }` (řádky 31-55: kontrola `isDeleted`→401 DELETED, `deletionRequestedAt`→401 DELETION_PENDING, `updateLastSeen`) se **nikdy neprovede**.
- **Dopad:** Per-request account-state gate je **mrtvý**. Uživatel, který má platný access token (TTL **7 dní**, `auth.module.ts`) a pak se **smaže** (self-delete) nebo je **naplánován ke smazání**, projde na **každý** `@UseGuards(JwtAuthGuard)` endpoint celý týden. Přesně scénář, kvůli kterému gate vznikl (paměť `project_self_deletion_architecture`: „gate v JwtAuthGuard ne JwtStrategy, 7d token"). Login sám smazaný účet blokuje ([auth.service.ts:165](../Projekt-ikaros/backend/src/modules/auth/auth.service.ts#L165)), ale **už vydaný token** ne.
- **Root cause:** Drift `sub`/`id`. `@CurrentUser` i controllery čtou správně `.id`; jen guard zůstal na `.sub`. Test maskoval mockem `makeContext({ sub })`, který reálná strategy nikdy nevyrobí (mock drift — zelený test, mrtvá produkce).
- **Osa:** `ST` `LK` — eskalace/bypass
- **Návrh:** [jwt-auth.guard.ts:30](../Projekt-ikaros/backend/src/common/guards/jwt-auth.guard.ts#L30) `request.user?.sub` → `request.user?.id` (+ opravit typovou anotaci `{ sub?: string }` → `{ id?: string }`). Opravit spec mock na `{ id }`, jinak drift zůstane skrytý. **1 řádek, ale kritický.**
- **Stav:** ✅ **opraveno** — [jwt-auth.guard.ts:30](../Projekt-ikaros/backend/src/common/guards/jwt-auth.guard.ts#L30) `request.user?.sub` → `.id` (+ typ + komentář); spec mock `{ sub }` → `{ id }` (jinak by drift zůstal skrytý). Gate teď reálně blokuje smazaný/pending. Plný jest 1908/1908.

### R-08 — Ban se nikde nevynucuje (`bannedAt` set, nikdy nečten) 🐛🔴 (VYSOKÁ — banned user dál pracuje)
- **Oblast / bod:** [01](role-plan/01-auth-ucet-guest.md) AU-10
- **Soubor:** [admin.service.ts:379](../Projekt-ikaros/backend/src/modules/admin/admin.service.ts#L379) (ban **nastaví** `bannedAt`) ↔ login [auth.service.ts:164-186](../Projekt-ikaros/backend/src/modules/auth/auth.service.ts#L164) (čte jen `isDeleted`+`deletionRequestedAt`, **ne `bannedAt`**) ↔ `JwtAuthGuard`/`JwtStrategy` (ban nekontrolují) ↔ FE [client.ts:46](../Projekt-ikaros-FE/src/shared/api/client.ts#L46) (handler kódu `BANNED`, který BE nikdy nepošle)
- **Symptom:** Grep `bannedAt`/`'BANNED'`/`banCache.get` v BE: `bannedAt` se jen **zapisuje** (ban/unban v admin.service) a kontroluje na konflikt; **nikde se nečte pro blok přístupu**. `banCache.get()` se nevolá vůbec. Zabanovaný uživatel (`bannedAt` set, `isDeleted=false`) se **přihlásí** (login ban neřeší) a s tokenem dál používá celou platformu.
- **Dopad:** Celá ban funkcionalita (admin UI, `UserBanCacheService`, FE `BANNED` handler) je **bez efektu**. Admin „zabanuje", uživatel nepozná rozdíl. Bezpečnostní/moderátorská díra.
- **Root cause:** Ban enforcement nebyl nikdy zapojen do login flow ani do account-state gate (který je navíc mrtvý — R-07).
- **Osa:** `ST` `LK`
- **Návrh:** (1) login [auth.service.ts:164](../Projekt-ikaros/backend/src/modules/auth/auth.service.ts#L164) — po `isDeleted` přidat `if (user.bannedAt) → 401 BANNED`; (2) po opravě R-07 přidat ban check i do `JwtAuthGuard` (per-request, kvůli 7d tokenu — banned za běhu) → 401 `BANNED`. Pak FE `client.ts` handler ožije.
- **Stav:** ✅ **opraveno** — ban check v login ([auth.service.ts:171](../Projekt-ikaros/backend/src/modules/auth/auth.service.ts#L171)) i per-request v `JwtAuthGuard` (po R-07) → 401 `BANNED`; FE handler ožil. +1 guard test.

### R-09 — `GET /pages` (`findByWorld`) neaplikuje page-level `assertAccess` 🐛 (střední — leak, latentní)
- **Oblast / bod:** [04](role-plan/04-svet-stranky-akj.md) SP-10
- **Soubor:** [pages.service.ts:100-114](../Projekt-ikaros/backend/src/modules/pages/pages.service.ts#L100) (`findByWorld` volá jen `filterAkjTabsForViewer`, ne `assertAccess`) vs [pages.service.ts:128](../Projekt-ikaros/backend/src/modules/pages/pages.service.ts#L128) (`findBySlug` `assertAccess` má)
- **Symptom:** `findByWorld(worldId, type, userId)` ořízne jen AKJ **taby**, ale **nefiltruje page-level** `accessRequirements` → vrací plné `content`/`plainText`/`title` i u stránek chráněných page-level AKJ. Každý člen světa přes `GET /worlds/:id/pages` dostane obsah chráněných stránek.
- **Dopad:** Přímý API leak page-level chráněného obsahu. **Latentní** — FE listingy volají `/directory` (stub bez obsahu), plný `GET /pages` žádný FE konzument nepoužívá; riziko je přímé volání API tokenem.
- **Osa:** `LK` `PC` `DD`
- **Návrh:** Ve `findByWorld` při zadaném `userId` silent-skip stránek, kde `assertAccess` selže (vzor `findVisibleSlugs`/`findBacklinks`). Sjednotí 6. „dveře" listingu se zbytkem.
- **Stav:** 🐛 potvrzeno.

### R-10 — FE `ArticleDetailPage` REVIEWER_ROLES obsahuje neexistující `UserRole.PJ` 🐛 (nízká — drift / N-14 regrese)
- **Oblast / bod:** [02](role-plan/02-platforma-admin.md) PL-11/PL-14
- **Soubor:** [ArticleDetailPage.tsx:32-37](../Projekt-ikaros-FE/src/features/ikaros/pages/ArticleDetailPage.tsx#L32) (`REVIEWER_ROLES` = `[Superadmin, Admin, UserRole.PJ, SpravceClanku]`) ↔ FE enum [index.ts:6-13](../Projekt-ikaros-FE/src/shared/types/index.ts#L6) (PJ **neexistuje**) ↔ BE [ikaros-articles.service.ts:28](../Projekt-ikaros/backend/src/modules/ikaros/ikaros-articles.service.ts#L28) (`ADMIN_ROLES` = `[Superadmin, Admin, SpravceClanku]`, bez PJ)
- **Symptom:** FE má v reviewerech navíc `UserRole.PJ`, který globální FE enum nedefinuje → `UserRole.PJ === undefined` → REVIEWER_ROLES = `[1,2,undefined,10]`. Runtime neškodné (`undefined` nematchne žádnou roli), ale: (a) drift vůči BE (BE PJ nepovoluje), (b) komentář ř.29-31 lže („PJ smí schvalovat"), (c) `UserRole.PJ` je TS chyba pod app tsconfigem (můj `tsc --noEmit` to minul kvůli project references — pre-existing build dluh). Galerie/diskuze čisté = vzor.
- **Osa:** `EN` `PA` — N-14 (globální PJ do platformy nepatří)
- **Návrh:** Smazat `UserRole.PJ` z REVIEWER_ROLES + opravit komentář. Triviální.
- **Stav:** 🐛 potvrzeno.

### R-04 — Restricted world chat: zprávy tečou přes WS `room:join` bez access checku 🐛🔴 (VYSOKÁ — PC leak)
- **Oblast / bod:** [08](role-plan/08-svet-chat-zvuky.md) CH-17 · [09](role-plan/09-ws-role-gating.md) WR-07
- **Soubor:** [chat.gateway.ts:244-248](../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L244) (`chat.message.created` → emit `chat:message` do `chat:{channelId}`) ← vstup do roomu přes [app.gateway.ts:12-22](../Projekt-ikaros/backend/src/gateways/app.gateway.ts#L12) (`room:join`, **jen regex**) ↔ REST [chat.service.ts:584](../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L584) (`hasChannelAccess`)
- **Symptom:** World kanál s `accessMode='members'` (whitelist) nebo `'role'` (práh) je v **REST** správně gated (`getMessages`/`sendMessage`/`getChannelPresence` → `hasChannelAccess`, 403). Ale **WS** zprávy se emitují do roomu `chat:{channelId}`, do kterého se vstupuje **generickým `room:join`** (AppGateway) — ten validuje jen regex formátu, **žádný** JWT/membership/channel-access check. Kdokoli, kdo zná `channelId`, emitne `room:join chat:{channelId}` a začne dostávat živé `chat:message` / `:updated` / `:deleted` restricted kanálu.
- **Root cause:** `room:join` (N-8) je na `AppGateway` bez auth. N-8 byl **přijaté riziko** s odůvodněním „do `world:{id}` teče jen počasí (kosmetika)" — to **neplatí** pro `chat:{channelId}`, kde teče reálný obsah zpráv. Dedikovaný `chat:channel:join` ([chat.gateway.ts:80](../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L80)) sice bere JWT+roli, ale řeší jen **presence** — skutečné připojení k message roomu jde mimo něj generickým `room:join`.
- **Realistický scénář:** hráč odebraný z `members` kanálu (nebo demotovaný pod `role` práh), který má `channelId` v FE cache → dál `room:join` a poslouchá. ChannelId není hádatelný, ale bývalý člen/účastník ho zná.
- **Osa:** `PC` `LK`
- **Závažnost:** 🔴 vysoká — real-time únik obsahu restricted kanálů (PJ-only / role-gated konverzace). REST dveře zamčené, WS dveře otevřené = učebnicový path-consistency leak.
- **Návrh:** `room:join` pro `chat:` prefix musí ověřit `hasChannelAccess` + JWT identitu — buď dedikovaný `chat:room:join` handler s access gate (a generický `room:join` zakázat pro `chat:`), nebo access check uvnitř `room:join` dle prefixu. Sjednotit s ws-audit (třída W-3/N-8). Round-trip test M8.
- **Stav:** ✅ **opraveno** (approach A — gate v BE, FE kontrakt beze změny). `ChatService.canJoinChannelRoom(channelId, userId?)` ([chat.service.ts:113](../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L113)) — world kanál vyžaduje `hasChannelAccess`, globální/neznámé pustí (vlastní model). `AppGateway.room:join` ([app.gateway.ts:18](../Projekt-ikaros/backend/src/gateways/app.gateway.ts#L18)) gatuje `chat:` prefix přes ověřený `client.data.userId` (JWT); `world:` zůstává (N-8). GatewaysModule→ChatModule (bez cyklu, forwardRef pojistka). FE beze změny (`ChannelView` dál `room:join chat:{id}`). Ověřeno: tsc 0, **plný jest 1900/1900** (+5 app.gateway gate testů), DI bez cyklu. Real-time doručení = lidský test. Cross-ref [ws-audit.md](ws-audit.md).

### R-03 — `updateMemberRole` bez stropu role → PomocnyPJ se povýší na PJ 🐛🔴 (VYSOKÁ — vertikální eskalace)
- **Oblast / bod:** [03](role-plan/03-svet-membership.md) SM-10
- **Soubor:** [worlds.service.ts:1196-1236](../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L1196) (`updateMemberRole`) ← [worlds.controller.ts:380](../Projekt-ikaros/backend/src/modules/worlds/worlds.controller.ts#L380); guard [canManageMembers:1763](../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L1763)
- **Symptom:** `updateMemberRole` ověří jen `canManageMembers` (= GlobalAdmin \|\| PJ \|\| **PomocnyPJ(4)**), pak rovnou `membershipRepo.update(membershipId, { role })` s **klientem zadanou** cílovou rolí (`dto.role`, `@IsEnum(WorldRole)` → 5 je validní). **Chybí jakýkoli vztah požadované role k roli requestera.**
- **Důsledky:**
  1. **Eskalace nahoru:** PomocnyPJ(4) nastaví `role=PJ(5)` sobě nebo komukoli → získá plnou správu světa (mazání světa, postavy, mapa world-ops, AKJ tab-bypass…).
  2. **Sabotáž nahoru:** PomocnyPJ demotuje stávajícího PJ nebo **ownera** (žádná owner-ochrana role).
  3. **Self-target:** žádná kontrola, že requester nemění vlastní membership.
- **Root cause:** `canManageMembers` rozhoduje jen o roli **requestera**, ne o **cílové** roli ani o roli **cílového** člena. Vzor „nesmíš udělit/sebrat roli ≥ své vlastní" v kódu chybí.
- **Osa:** `ES`
- **Závažnost:** 🔴 vysoká, ale **insider** (vyžaduje už roli PomocnyPJ — netýká se hráče/anonyma). Blast radius = jeden svět.
- **Návrh:** Ve `updateMemberRole` doplnit strop: requester smí nastavit cílovou roli jen `< vlastní role` (GlobalAdmin/owner bypass), a nesmí měnit roli členu s rolí `>= vlastní`. Zvážit owner-ochranu (ownera nelze demotovat nikým kromě owner-transferu). Red-team test M8 (PomocnyPJ → role=5).
- **Dopad na `updateMemberAkj`/`group`:** ✅ ověřeno — **netýká se.** `group` je jen label (ne oprávnění); `akj` je clearance, ale PomocnyPJ stránky stejně bypassuje page-level → self-raise je moot. Eskalace je výhradně přes `role`.
- **Stav:** 🐛 potvrzeno — **bezpečnostní priorita**, neopravovat bez tvého souhlasu.

### R-02 — Account permission vrstva bez GlobalAdmin bypassu ⚠️ (BY nekonzistence, nízká)
- **Oblast / bod:** [05](role-plan/05-svet-postavy-ekonomika.md) PO-07..10
- **Soubor:** [characters.service.ts:58-64](../Projekt-ikaros/backend/src/modules/characters/characters.service.ts#L58) (`isWorldStaff` = jen `membership.role >= PomocnyPJ`, bez `role <= Admin` větve) → volá ho [character-accounts.service.ts:652](../Projekt-ikaros/backend/src/modules/character-subdocs/character-accounts.service.ts#L652) ve všech `assert*` (adjust/read/settings/delete)
- **Symptom:** Celá ekonomická permission vrstva postav je **member-only**. Platform Admin/Superadmin, který **není** členem světa, dostane 403 na čtení/úpravu/mazání účtu postavy — všude jinde v kódu GlobalAdmin obchází (`if (role <= Admin) return`, např. sousední [`assertCanManage:71`](../Projekt-ikaros/backend/src/modules/characters/characters.service.ts#L71)). `isWorldStaff` navíc dostává jen `(worldId, userId)`, ne globální roli → bypass ani udělat nejde bez změny signatury.
- **Vedlejší:** `assertWriteSettingsAccess` komentář + hláška říkají „**jen PJ**" ([:614-618](../Projekt-ikaros/backend/src/modules/character-subdocs/character-accounts.service.ts#L614)), ale `isStaff` propustí už **PomocnyPJ(4)**. Nesoulad dokumentace vs kód.
- **Rozsah:** `isWorldStaff` se používá i v [campaign-purchase.service.ts:279](../Projekt-ikaros/backend/src/modules/campaign/services/campaign-purchase.service.ts#L279) (`listPurchases`) a [:91/:231](../Projekt-ikaros/backend/src/modules/campaign/services/campaign-purchase.service.ts#L91) → R-02 se týká **celé ekonomiky** (účty + nákupy), ne jen účtů. Platform Admin non-member nevidí nákupy jako staff.
- **Osa:** `BY` `DD`
- **Závažnost:** 🟡 nízká — admin se může do světa přidat; ekonomika je world-interní. Ale je to nekonzistence vůči zbytku (a možná záměr — k rozhodnutí).
- **Návrh:** (a) buď doplnit GlobalAdmin bypass do account assertů (předat roli do `isWorldStaff` nebo přidat větev v `assert*`), (b) nebo potvrdit jako záměr (ekonomika jen pro členy) a opravit klamavý komentář „jen PJ" → „PomocnyPJ+". Plus `updateAccountSettings` service nemá vlastní guard (spoléhá na controller — `DD` last-line dluh).
- **Stav:** ✅ **opraveno** — `isWorldStaff(worldId, userId, globalRole?)` admin bypass (konzistentně s `getWorldRole`), role protažena z controllerů do account asertů (`assertReadAccess/WriteContent/WriteSettings/Delete/CanAdjust/adjust`) + campaign-purchase (`purchase/refund/listPurchases`); hláška „jen PJ" → „PJ/pomocný PJ (staff)". Ověřeno: tsc 0, jest 178 dotčených + 3 nové bypass testy. *(Optional param = fail-safe: bez role žádný bypass.)*

### R-06 — FE timeline route povoluje Ctenar, BE vyžaduje Hrac → parita/UX 🐛 (nízká)
- **Oblast / bod:** [06](role-plan/06-svet-herni-nastroje.md) HN-10
- **Soubor:** FE [router.tsx:246](../Projekt-ikaros-FE/src/app/router.tsx#L246) `memberOnly(p(TimelinePage))` (default práh **Ctenar(1)**) ↔ BE [timeline.service.ts:247-273](../Projekt-ikaros/backend/src/modules/timeline/timeline.service.ts#L247) `assertMember` (vyžaduje **Hrac(2)**), chybný kód [:269](../Projekt-ikaros/backend/src/modules/timeline/timeline.service.ts#L269)
- **Symptom:** Ctenar(1) projde FE route guardem na `/timeline`, stránka se načte, ale `getTimeline` vrátí **403** (BE timeline read = Hrac+). Ctenar dostane chybu/prázdno místo aby byl gated dřív. Navíc BE hodí kód `PENDING_MEMBERSHIP` ("Pending členství nemá přístup") — Ctenar **není** pending (pending = Zadatel(0)), takže hláška mate.
- **Root cause:** Timeline má **odlišný** read práh (Hrac) než zbytek world sub-rout (Ctenar přes `memberOnly`). FE route guard ten rozdíl nereflektuje. Error kód kopíruje vzor ze Zadatel větve.
- **Osa:** `OR` `PA` `EN`
- **Závažnost:** 🟡 nízká — jen Ctenar UX (chyba na timeline), žádný security/leak dopad.
- **Návrh:** (a) FE `timeline` route → `memberOnly` s `minWorldRole: Hrac` (gate Ctenar dřív), **nebo** (b) snížit BE timeline read na Ctenar (produktové: má read-only Ctenar vidět timeline?). + opravit kód pro role 1 na `INSUFFICIENT_ROLE` místo `PENDING_MEMBERSHIP`. Malá FE+BE změna.
- **Stav:** ✅ **opraveno** (varianta a — align FE k BE, timeline zůstává Hrac+). FE: `memberOnly` parametrizován o `minWorldRole`, `timeline` route dostal `WorldRole.Hrac` ([router.tsx:246](../Projekt-ikaros-FE/src/app/router.tsx#L246)) → Ctenar redirectnut na dashboard, nenarazí na 403. BE: `assertMember` rozlišuje Zadatel→`PENDING_MEMBERSHIP` vs Ctenar→`INSUFFICIENT_ROLE` ([timeline.service.ts:267](../Projekt-ikaros/backend/src/modules/timeline/timeline.service.ts#L267)). Ověřeno: FE tsc 0 + eslint, BE tsc 0 + jest timeline 59/59.

### R-05 — Granular `adminPermissions`: 2 ze 3 flagů se nevynucují (klamavé toggly) ⚠️ (nízká)
- **Oblast / bod:** [02](role-plan/02-platforma-admin.md) PL-07..10 (kandidát K-R5)
- **Soubor:** BE [admin.service.ts:644-654](../Projekt-ikaros/backend/src/modules/admin/admin.service.ts#L644) (setter merge všech 3) · jediný **read/gate** = [hierarchy.ts:100](../Projekt-ikaros/backend/src/modules/admin/helpers/hierarchy.ts#L100) (`canModerateContent` pro user DELETE/UNDELETE) ↔ FE [UsersTable.tsx:298](../Projekt-ikaros-FE/src/features/admin/users/components/UsersTab/UsersTable.tsx#L298) (Superadmin přepíná všechny 3) + badge „A+" [:173](../Projekt-ikaros-FE/src/features/admin/users/components/UsersTab/UsersTable.tsx#L173)
- **Symptom:** Superadmin v UI přepíná 3 granular práva, ale BE čte (vynucuje) **jen `canModerateContent`** (gate na smazání/obnovení uživatele Adminem). `canManageAdmins` a `canEditPlatformPages` se na BE **nikde nečtou** (grep `.canManageAdmins`/`.canEditPlatformPages` = jen setter + FE display). Admin s `canManageAdmins=true` stejně nesmí spravovat jiné adminy (`assertCanModerate`/`assertCanChangeRole` blokují admin-na-admin bezpodmínečně; admin-permissions endpoint je `@Roles(Superadmin)`). `canEditPlatformPages` nemá vůbec žádný konzument.
- **Root cause:** D-033 zavedlo granular práva, ale jen `canModerateContent` se dotáhlo do guardů; `canManageAdmins`/`canEditPlatformPages` zůstaly jako UI bez backendu.
- **Osa:** `PA` `DD`
- **Závažnost:** 🟡 nízká — žádný security dopad (flagy nic **nepovolují** navíc, jen klamou UI „udělil jsem právo"). Riziko je matoucí správa + falešný pocit delegace.
- **Návrh (k rozhodnutí):** (a) **dotáhnout** — `canManageAdmins` → povolit Adminovi s flagem spravovat admin-permissions/moderovat adminy (uvolnit `@Roles(Superadmin)` na flag); `canEditPlatformPages` → gate editace ikaros/platform stránek; (b) **skrýt/odstranit** 2 nefunkční toggly; (c) **označit WIP**. Doporučuju (a) pro `canManageAdmins` (má smysl) + (b/c) pro `canEditPlatformPages` dokud feature není.
- **Stav:** ✅ **opraveno (varianta A)**:
  - `canManageAdmins` **dotaženo** — admin-permissions endpoint uvolněn z `@Roles(Superadmin)` na `Superadmin|Admin`, service vynucuje flag ([admin.service.ts:615](../Projekt-ikaros/backend/src/modules/admin/admin.service.ts#L615), `actor` načten plně kvůli `adminPermissions`). Admin-manager smí delegovat **jen `canModerateContent`**; `canManageAdmins` (mintit další managery) smí měnit **jen Superadmin** (`SUPERADMIN_ONLY_FLAG`). Self-target + target=Admin gate zůstávají.
  - `canEditPlatformPages` **skryt** v UI ([UsersTable.tsx](../Projekt-ikaros-FE/src/features/admin/users/components/UsersTab/UsersTable.tsx)) — BE flag nikde nevynucuje, žádná feature; ponechán v interface jako dluh (ne mazán).
  - FE: perms toggly vidí Superadmin (vše) i Admin-manager (jen moderace).
  - Ověřeno: BE tsc 0 + jest admin 13/13 (+5 nových) + plný 1905/1905; FE tsc 0 + eslint.

---

## Vypořádané / by-design / přijaté riziko

*(zatím prázdné — plní se při exekuci)*

---

## Legenda

- ⬜ navrženo / netestováno · ✅ ověřeno OK · 🐛 potvrzený nález · ⚠️ dluh / nejisté · ⚖️ by-design
- Závažnost: 🔴 vysoká (eskalace/leak) · 🟠 střední (bloker/parita) · 🟡 nízká · ⚪ kosmetika
