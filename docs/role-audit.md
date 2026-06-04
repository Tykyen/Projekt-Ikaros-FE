# Role audit — registr nálezů oprávnění (FE gating ↔ BE guard)

> Centrální registr nálezů z [`role-plan/`](role-plan/README.md). ID `R-xx`.
> Sourozenec [`bug-audit.md`](bug-audit.md) (logika) a [`ws-audit.md`](ws-audit.md) (real-time),
> ale výhradně pro **autorizační vrstvu**: sedí frontendové gating proti backendovým guardům?
> Stav: zahájeno 2026-06-04 (plán + oblast 00, zkoušky probíhají).

---

## TL;DR (2026-06-04)

> **Stav: rozjeto.** Plán [`role-plan/`](role-plan/README.md) — 10 oblastí, páteř = **matice
> role × akce** (prázdná buňka = nepokrytá kombinace). Cíl: maximalizovat `[auto]` pokrytí, ať
> lidská testovací skupina dostane co nejčistší stav.
>
> | ID | Závažnost | Oblast | Podstata | Stav |
> |---|---|---|---|---|
> | **R-04** | 🔴 vysoká | 08/09 | Restricted world chat zprávy tečou přes WS `room:join` (jen regex) bez access checku — REST gated, WS ne (PC leak) | ✅ opraveno (+5 testů) |
> | **R-03** | 🔴 vysoká | 03 | `updateMemberRole` nemá strop — PomocnyPJ povýší sebe/kohokoli na PJ a demotuje PJ/ownera (vertikální eskalace, insider) | ✅ opraveno (+3 testy) |
> | **R-02** | 🟡 nízká | 05 | Account permission vrstva (`isWorldStaff`) bez GlobalAdmin bypassu — platform Admin non-member dostane 403, jinde projde | ✅ opraveno (+3 testy) |
> | **R-06** | 🟡 nízká | 06 | FE timeline route povoluje Ctenar, BE vyžaduje Hrac → Ctenar dostal 403 na načtené stránce + matoucí kód | ✅ opraveno (FE+BE) |
> | **R-05** | 🟡 nízká | 02 | Granular `adminPermissions`: `canManageAdmins` + `canEditPlatformPages` se v UI přepínají, ale BE je nevynucuje (jen `canModerateContent` funguje) — klamavé toggly | ✅ opraveno (A, +5 testů) |
> | **R-01** | 🟡 nízká | 00 | FE prahy `role <= 3` cílí na globálního PJ(3), který FE enum nezná (D-053 ho zrušila) — vestigiální past | ✅ opraveno |
>
> **2. audit vlna (2026-06-04):** K-R5 → **R-05 ✅ opraveno (varianta A)** (canManageAdmins wired: gatuje admin-permissions endpoint, Admin-manager smí delegovat moderaci; canEditPlatformPages skryt — mrtvý) · HN-10 → **R-06 ✅ opraveno** (FE route Hrac práh + BE rozlišený kód) · **SM-06 ✅ konzistentní** (moderace AR owner-only) · **K-R2 ✅ konzistentní** (PomocnyPJ tab-filter BE-autoritativní).
>
> **Stav oprav (2026-06-04):** **VŠECH 6 nálezů opraveno + ověřeno** (R-01…R-06). BE: tsc 0, **plný jest 1905/1905** (115 suites, +16 nových testů). FE: tsc 0, eslint čistý, WorldLayout 5/5. Runtime (real-time R-04, `nest start` DI) = lidský/dev test. Git neřešen (commituje uživatel).
>
> **Ověřeno vzorně (bez díry):** MA-06/07/08/09 (`operations-authorizer` field-level/isLocked/ownership/dice
> spoof — vše drží, L2) · PO-09 (write-settings staff-only, controller volá assert před update) ·
> **SP-01/SP-02** (search **i embedding** filtruje `findVisibleSlugs` na sjednocený výsledek — N-35 kryje oba; jen `count`-před-filtrem UX nit) ·
> **PO-11/PO-12** (N-22 obchod `isShared` hráči ✅ · N-24 `listPurchases` všechny postavy hráče + cizí `characterId` ignorován = IDOR-safe) ·
> **SM-06 / K-R2** (moderace AR owner-only · AKJ tab filtr BE-autoritativní — obojí konzistentní).
>
> **Kandidáti z inventury (k ověření):** viz sekce níže.

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
