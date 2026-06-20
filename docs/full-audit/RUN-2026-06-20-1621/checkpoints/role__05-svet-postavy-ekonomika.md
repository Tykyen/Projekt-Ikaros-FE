# role / 05-svet-postavy-ekonomika — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem vyčerpávajícím statickým čtením (M1 + M2):

**BE:**
- `characters.service.ts` — `assertCanManage`, `findBySlug`, `assertSubdocAccess`, `update`, `isWorldStaff`
- `characters.controller.ts` — všechny endpointy, jejich guardy a asserty
- `character-accounts.service.ts` — všechny 4 `assert*` funkce, `isStaff`, `isStaffOrOwner`
- `character-accounts.controller.ts` — přiřazení assertů na každý endpoint
- `bestiae.service.ts` — `assertCanRead`, `assertCanWrite`, `assertCanManageWorld`, `isGlobalAdmin`
- `bestiae.controller.ts` — (dle service vzorce, bez samostatné kontroly; service autoritativní)
- `campaign.service.ts` — `getWorldRole`, `resolveScope`, `resolveShopScope`, `canModify`
- `campaign.controller.ts` — nákup, storno, `listPurchases`, shop CRUD
- `campaign-purchase.service.ts` — `purchase` (ownership check), `refund` (staff/own check), `listPurchases`
- `world-currencies.service.ts` — `assertMember`, `assertCanAdmin`, `assertCanEdit`, `isMetadataOnlyEdit`
- `world-currencies.controller.ts` — GET/PUT/POST guardy

**FE:**
- `CharacterDirectory.tsx` — `canManage` práh
- `PostavaLayout.tsx` — `canEdit`, `canSeePrivate` práh
- `MyPurchasesPanel.tsx` — `canRefund` logika
- `SettingsAccountSection.tsx` — `isPJ` práh
- `CurrencyPage.tsx` — `canEdit` / `canAddOrDelete` prahy

**Osy:** PA, ES, OW, OR, BY, EN — všechny prošly M1/M2 čtením.

## Dosažená L vs cílová L

| Oblast | Cílová L | Dosažená L | Pozn. |
|---|---|---|---|
| PO-01 create/delete (assertCanManage = PJ+) | L2 | **L2** | BE čistý (PJ); FE canManage=PJ ✅ |
| PO-01 update (assertCanManage vs update path) | L2 | **L2 + NÁLEZ** | BE update = PomocnyPJ+; FE schová edit PomocnyPJ → OR drift |
| PO-02 findBySlug owner/public | L2 | **L2** | PomocnyPJ+|owner=plná; ostatní=public ✅ |
| PO-03 red-team PATCH cizí | L4 | PROOF-REQUEST | M8 bez živé infry |
| PO-04 assertSubdocAccess per-typ | L2 | **L2** | Lokace=PomocnyPJ+; Persona=PomocnyPJ+|owner ✅ |
| PO-05 N-10 action=read vs write | L2 | **L2** | `_options` parametr EXISTUJE ale je nevyužit — viz NÁLEZ |
| PO-06 red-team deník cizí | L4 | PROOF-REQUEST | |
| PO-07 assertReadAccess účet | L2 | **L2** | owner|staff ✅ (R-02 opraveno) |
| PO-08 assertCanAdjust + allowSelfAdjust | L2 | **L2** | logika sedí ✅ |
| PO-09 assertWriteSettingsAccess staff-only | L3+ | **L2** | staff-only ✅; red-team (M8) = PROOF-REQUEST |
| PO-10 delete primary-only | L2 | **L2** | primaryOwnerId check ✅ |
| PO-11 resolveShopScope N-22 | L2 | **L2** | hráč→isShared ✅ |
| PO-12 listPurchases N-24 | L2 | **L2** | dle vlny 2 ✅ |
| PO-13 red-team storno cizí | L4 | PROOF-REQUEST | |
| PO-14 POST shopitems bez role-gate | L1 | **L1** | přijatý dluh (by-design) |
| PO-15 MyPurchasesPanel canRefund | L2 | **L2** | `isStaff||account.allowPlayerSelfAdjust` ✅ |
| PO-16 měny 2 prahy | L2 | **L2** | assertCanAdmin(PJ+) / assertCanEdit(PomocnyPJ+) ✅ |
| PO-17 assertMember čtení měn | L2 | **L2** | každý člen ✅ |
| PO-18 assertCanRead bestiae 3-scope | L2 | **L2** | system=všichni; user=owner|GA; world=member ✅ |
| PO-19 assertCanWrite system→GA | L2 | **L2** | ✅ dle vlny 2 |
| PO-20 red-team cizí user-scope bestie | L4 | PROOF-REQUEST | |
| PO-21 spawn membership | L1 | L1 | oblast 07 |

## Nálezy

### R-RUN-01 — [OR/PA] `assertSubdocAccess` `_options.action` je mrtvý parametr — READ stavby != WRITE nemá efekt · Kde: `characters.service.ts:153` (parametr `_options?: { action?: 'read' | 'write' }` s prefixem `_` = záměrně ignorován) · Dopad: Spec 9.2 říká kalendář Lokace má být read-accessible hráči (member), ale kód to neimplementuje — parametr action se nečte, větev Lokace vždy vyžaduje PomocnyPJ+ bez ohledu na akci. N-10 fix (R-14 z vlny 2) uzavřel jako „záměr 8.1-FIR", takže toto je POTVRZENÍ toho stavu. De facto: spec 9.2 (read=member) je ignorován, 8.1-FIR (PomocnyPJ+) vyhrál. Parametr je zbytečný dead-code. · Návrh: Smazat `_options` parametr (jde o dead-code drift); nebo implementovat, pokud se spec 9.2 znovu otevře. Stávající chování (PomocnyPJ+ vždy) = záměr. · L1 · ♻️ (reinforce R-14 závěru) · Závažnost: ⚪ kosmetika/dluh

### R-RUN-02 — [OR/PA] FE `CharacterDirectory` `canManage = PJ(5)` — ale BE `update` povoluje PomocnyPJ(4) · Kde: FE `CharacterDirectory.tsx:156` (`userRole >= WorldRole.PJ`) vs BE `characters.service.ts:282` (`isStaff = membership.role >= WorldRole.PomocnyPJ` uvnitř `update`) · Dopad: PomocnyPJ(4) NA FE nevidí tlačítko „Nová postava" ani „Upravit" v adresáři (OR bloker) — ale `PATCH /characters/:slug` ho BE pustí (PomocnyPJ editovat smí). FE over-restrictuje vůči tomu, co BE povolí. Vytvoření nové postavy (POST) naopak správně vyžaduje PJ (assertCanManage:102 `role < WorldRole.PJ`). Tedy: create/delete=PJ správně obojí. Ale edit=PomocnyPJ na BE × edit button skryt FE (PJ+ práh). PomocnyPJ musí editovat přes přímé URL nebo v PageEditor. · Návrh: Buď (a) rozdělit `canManage` na `canCreate` (PJ) a `canEdit` (PomocnyPJ) v CharacterDirectory + odhalit „Upravit" PomocnyPJ; nebo (b) zvednout BE update na PJ (align BE→FE) — záleží na product spec. · L2 · 🆕 · Závažnost: 🟡 nízká (OR bloker pro PomocnyPJ, ne bezpečnostní)

### R-RUN-03 — [ES/DD] `characters.controller.ts` `GET /characters` a `GET /directory` bez membership gate — vrací seznam všech postav světa bez ověření členství · Kde: `characters.controller.ts:36-56` (`@Get() findAll` + `@Get('directory') getDirectory` — oba mají `@UseGuards(JwtAuthGuard)` ale žádný assertMember/assertCanRead) vs `characters.service.ts:109` (`findByWorld` a `getDirectory` = jen `findByWorld` bez membership check) · Dopad: Jakýkoli přihlášený uživatel (globálně, mimo svět) může volat `GET /worlds/:worldId/characters` nebo `GET /worlds/:worldId/characters/directory` a dostat seznam všech postav cizího světa (jména, slugy, imageUrl, isNpc, userId). Nejde o leak obsahu (jen public view), ale leak existence a metadat postav nepřidruženého světa. Srovnej: `findBySlug` i `assertSubdocAccess` oba member-check dělají; listing ne. · Návrh: Přidat `assertMember` (nebo `isWorldMember` check) do `findByWorld` a `getDirectory` — nebo alespoň ověřit, že svět je public (pro veřejné světy OK, pro soukromé = leak). Vzor: world-currencies service `assertMember` (worldId, userId). · L2 · 🆕 · Závažnost: 🟠 střední (metadatový leak pro soukromé světy)

### R-RUN-04 — [BY] `bestiae.service.ts` `assertCanRead` world-scope: propustí člena ANY role (i Zadatel(0)) · Kde: `bestiae.service.ts:243-254` (`if (!member) throw; // ok`) — member check nevylučuje Zadatel(0, pending) · Dopad: Pending člen (Zadatel) s validním JWT projde `assertCanRead` pro world-scope bestii — vidí seznam bestií světa jemuž je pending. Jinde (campaign.service `getWorldRole`, campaign.controller) pending vyhazuje `NOT_A_MEMBER`. Bestiae jsou méně citlivé než kampaňová data, ale nekonzistence. · Návrh: Přidat `member.role >= WorldRole.Ctenar` podmínku nebo alespoň `member.role > WorldRole.Zadatel` v bestiae world-scope read. Vzor ostatních modulů. · L1 · 🆕 · Závažnost: 🟡 nízká (Zadatel vidí world bestie světa, do nějž čeká na přijetí)

### R-RUN-05 — [OR] FE `SettingsAccountSection.tsx:32` `isPJ = userRole >= WorldRole.PomocnyPJ` — label říká „jen PJ" ale `isPJ` propouští PomocnyPJ · Kde: `SettingsAccountSection.tsx:32` (`const isPJ = (userRole ?? -1) >= WorldRole.PomocnyPJ`) + label `:167` `<h3>Nastavení účtu (jen PJ)</h3>` + hint `:160` `Změny může provést jen PJ.` · Dopad: Hlášky klamou (říkají „jen PJ") ale BE skutečně povoluje PomocnyPJ+ (`assertWriteSettingsAccess` → `isStaff` = PomocnyPJ+); FE gating je tedy správný (PomocnyPJ dostane editable form). Jde o label/UX drift, ne bezpečnostní díru. · Návrh: Opravit labely z „jen PJ" → „PJ / pomocný PJ" (konzistentně s opravou R-02 hláška v BE). · L1 · 🆕 · Závažnost: ⚪ kosmetika

## PROOF-REQUEST

| # | Co spustit | Co dokazuje |
|---|---|---|
| PR-01 | `PATCH /worlds/:id/characters/:cizíSlug` jako hráč (JWT hráče, cizí slug) → očekáváno 403 | PO-03 red-team OW: vlastník nemůže editovat cizí postavu (service update `isStaff||isOwner`) |
| PR-02 | `GET /worlds/:id/characters/:cizíCharSlug/diary` jako hráč (cizí postava) → očekáváno 403 | PO-06 red-team OW: deník cizí postavy |
| PR-03 | `POST /campaign/purchases/:id/refund` jako hráč pro cizí purchase.id → očekáváno 403 | PO-13 red-team OW: storno cizího nákupu |
| PR-04 | `PATCH /worlds/:id/accounts/:id` s `{allowPlayerSelfAdjust:true}` jako hráč (JWT) → očekáváno 403 | PO-09 red-team ES: hráč si nesmí sám udělit self-adjust |
| PR-05 | `GET /worlds/:id/characters` bez membership (cizí svět) → zda vrátí seznam nebo 403 | R-RUN-03 ověření: listing bez member gate |
| PR-06 | `GET /bestiae?worldId=X` jako Zadatel(0) → zda vrátí world-scope bestie | R-RUN-04 ověření: Zadatel visible |
