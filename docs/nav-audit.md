# Nav audit — registr nálezů (navigace & routování)

> 10. styl auditu. Plán: [`nav-plan/`](nav-plan/README.md). Cílová otázka: *vede každý odkaz na živou
> cestu a chrání každá cesta to, co má?* ID nálezů `NAV-xx`.
>
> **Stav:** zahájeno 2026-06-13. Sweep nezačal — registr drží zatím jen seed kandidáty (hypotézy).

## Osy

`DR` route–link drift · `PA` param contract · `GC` guard coverage · `RG` role-gate · `OR` ordering/shadowing ·
`DL` dead link · `RI` redirect integrity · `VR` visibility vs reachability · `DP` deep-link/refresh ·
`IR` intent round-trip · `MP` mobile parita · `EX` external/propadlé · `HP` help parita ·
**Nadstavba:** `BP` BE-parita guardu (cross-stack) · `RX` reachability (crawl) · `FZ` fuzz robustnost · `TE` teeth (mutace)

## Závažnost

🔴 leak / mrtvá feature / bezpečnost · 🟠 rozbitý odkaz / prázdná stránka · 🟡 dluh / kosmetika / mrtvý kód

## Úrovně jistoty

L1 přečteno · L2 tool diff · L3 + param/guard/shadowing · L4 + render test · L5 + e2e proklik ·
L6-matrix exhaustivní tabulka guardů · L6-crawl reachability · L7-stack FE↔BE parita · L7-teeth mutace

---

## Registr

| ID | Osa | Záv. | Routa / odkaz | Nález | Úroveň | Stav |
|---|---|---|---|---|---|---|
| NAV-01 | `DL`/`RI` | 🟠 | `navigate('/ikaros/svety')` [useWorldSocket.ts:75](../src/features/world/hooks/useWorldSocket.ts#L75) | po události `world:deleted` (svět smazán pod nohama) naviguje na **`/ikaros/svety`**, ale routa je **`/ikaros/vesmiry`** → uživatel skončí na 404 (`*`) místo seznamu světů. Fix: `vesmiry`. | L2 scan + L1 čtení | ✅ opraveno |
| NAV-02 | `OR`/`VR`/`GC` | 🟠 | route `admin/sablona-deniku` [router.tsx:308](../src/app/router.tsx#L308) | **dvojkolejnost po migraci** (admin nástroje 2026-05-25 přesunuty do Nastavení tabů): stránka žije jako Settings tab [WorldSettingsPage.tsx:132](../src/features/world/pages/WorldSettingsPage/WorldSettingsPage.tsx#L132) (`minRole PJ` **+ `minSystem=custom`**), ale stará routa zůstala s `WorldMembershipGuard(PJ)` **bez** system gate → editor schématu deníku dosažitelný přímou URL i na **preset** světě, kde ho tab schovává. Routa navíc orphan (0 odkazů). | L2 scan + L1 čtení | ✅ opraveno |
| NAV-03 | `DR`/`VR` | 🟠 | route `admin/emotes` (world) [router.tsx:319](../src/app/router.tsx#L319) | **orphan: „Custom emoty světa" nedosažitelné klikáním** — routa + stránka existují (guard PomocnyPJ+), ale **žádný odkaz/navigate** nikde → PJ správu emotů světa nenajde, jen přímou URL. Buď chybí nav entry, nebo mrtvý leftover. | L2 scan + L1 čtení | ✅ opraveno |
| NAV-04 | `RG`/`VR`/`DL` | 🟠 | nav „Kalendář" vs route `kalendar` [worldNavConfig.ts:217](../src/features/world/lib/worldNavConfig.ts#L217) | **nav nad-inzeruje:** buildWorldNav přidává „Kalendář" **všem** členům (top-level, bez role gate) + toolbox audience `['hrac','pj']`, ale routa = `memberOnly(PomocnyPJ)` → **Hráč i Čtenář kliknou a tiše je to odhodí na dashboard** (matice: Hrac/Ctenar → `r`). Route enforcement OK, chybí role gate v navu. | L6 matice + L1 | ✅ opraveno |
| NAV-05 | `RG`/`VR`/`DL` | 🟠 | nav „Časová osa"/„Počasí" vs routy `timeline`/`pocasi` [worldNavConfig.ts:188](../src/features/world/lib/worldNavConfig.ts#L188) | buildWorldNav ukazuje Časovou osu + Počasí **Čtenáři**, ale routy = `memberOnly(Hrac)` → **Čtenář kliknutím bounce na dashboard** (matice: Ctenar → `r`). Stejný kořen jako NAV-04 (nav negate roli routy). | L6 matice + L1 | ✅ opraveno |
| NAV-06 | `BP` | 🔴 | FE `scenare` = PomocnyPJ(4) ↔ BE `campaign` modul | 👑 **LEAK: BE campaign/storyboard nemá žádný role-floor.** `getWorldRole` ([campaign.service.ts:73](../../Projekt-ikaros/backend/src/modules/campaign/campaign.service.ts#L73)) falbackuje **i nečlena na Hrac**; `createScenario`/`createStoryline` ([:580](../../Projekt-ikaros/backend/src/modules/campaign/campaign.service.ts#L580)/[:442](../../Projekt-ikaros/backend/src/modules/campaign/campaign.service.ts#L442)) bez asserce → **kdokoli přihlášený (i nečlen světa) může přes přímé API zakládat/editovat storyboard entity**, ač FE feature je za PomocnyPJ. Blast omezený (self-owned, read jen own/shared), ale tenant-boundary porušen. | L2 ověřeno + jest | ✅ opraveno |
| NAV-07 | `BP` | 🟠 | FE `admin/stranky` = PJ(5) ↔ BE pages write = PomocnyPJ(4) | nesoulad: BE `assertCanWrite` ([pages.service.ts:826](../../Projekt-ikaros/backend/src/modules/pages/pages.service.ts#L826)) = `role >= PomocnyPJ`, FE admin tabulka = PJ → **PomocnyPJ může CRUD stránek přes API**, ač FE správu stránek ukazuje až PJ. Rozhodnout, která strana je kanonická (BE doc přiznává „PomocnyPJ+"). | L2 ověřeno | ✅ opraveno (FE→PomocnyPJ, parita s BE) |
| NAV-08 | `BP` | 🟠 | FE `admin/kalendare` = PJ(5) ↔ BE calendar-config write = PomocnyPJ(4) | tentýž vzor jako NAV-07: `assertCanWrite` ([world-calendar-config.service.ts:356](../../Projekt-ikaros/backend/src/modules/world-calendar-config/world-calendar-config.service.ts#L356)) = PomocnyPJ → PomocnyPJ může multi-config kalendáře CRUD přes API, FE až PJ. | L2 ověřeno | ✅ opraveno (FE→PomocnyPJ, parita s BE) |
| NAV-09 | `BP`/`IS` | 🟠 | FE `admin/headline`/`nastaveni` ↔ BE `GET worlds/:id/settings` | side-finding: `getSettings` ([worlds.service.ts:959](../../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L959)) **nemá member check** → jakýkoli přihlášený přečte `world_settings` **libovolného** světa (headline, nav config, AKJ úrovně) cross-tenant. Mutace settings je správně PJ-only. Read leak (cross-svět). | L2 ověřeno + jest | ✅ opraveno (filtrovaný read) |

---

## Opravy (2026-06-14)

**FE (Fáze A, ověřeno: testy 82/82 + `tsc -b` + `audit:nav` čistý):**
- **NAV-01** — [useWorldSocket.ts:75](../src/features/world/hooks/useWorldSocket.ts#L75) `svety`→`vesmiry`.
- **NAV-02 + NAV-03** — smazány orphan routy `admin/sablona-deniku` (+ guard drift) a `admin/emotes` z [router.tsx](../src/app/router.tsx); „Emoty světa" přidána jako záložka v Nastavení ([WorldSettingsPage.tsx](../src/features/world/pages/WorldSettingsPage/WorldSettingsPage.tsx), minRole PomocnyPJ). Šablona deníku už záložka byla → kanonický přístup = Nastavení.
- **NAV-04 + NAV-05** — [worldNavConfig.ts](../src/features/world/lib/worldNavConfig.ts) `buildWorldNav` dostal `canAccess(minRole)`; `kalendar` (PomocnyPJ), `timeline`/`pocasi` (Hrac) se ukážou jen když na ně uživatel dosáhne. [WorldLayout.tsx](../src/app/layout/WorldLayout/WorldLayout.tsx) předává predikát (parita s route guardem). + opraven pre-existující bug v `worldNavConfig.spec` (neúplný hidden seznam).

**FE (NAV-07/08, ověřeno: tsc -b + nav testy + scanner):**
- **NAV-07/08** — FE routy `admin/stranky` + `admin/kalendare` a Settings tab „Kalendáře" sníženy z PJ na **PomocnyPJ** (parita s BE write floor; FE už nelže o přístupu). U stránek nelze jít opačně (PomocnyPJ legitimně edituje stránky jinde); aditivní změna bez bezpečnostní regrese.

**BE (ověřeno: campaign jest 52/52, worlds jest 141/141, typecheck + eslint + prettier):**
- **NAV-06** — [campaign.service.ts `getWorldRole`](../../Projekt-ikaros/backend/src/modules/campaign/campaign.service.ts) už **nefalbackuje nečlena na Hrac** → nečlen dostane `ForbiddenException` (zavírá cross-tenant write hole napříč storyboard/pavučina/obchod). Test upraven.
- **NAV-09** — nový [`getSettingsForRequester`](../../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts) na HTTP hranici: člen/Admin = plný settings, nečlen viditelného (public/open) světa = **veřejně bezpečný subset** (stripnuto akjTypes/diarySchema/menuTemplates/lastInfo/pjChatPersona — interní), nečlen `private` světa = 404. Interní `getSettings` (chat persona, znaky skupin) zůstal plný. Controller volá nový gate.

## Seed kandidáti (hypotézy → verdikt při běhu)

> Každý běh povýší na `🐛 NAV-xx` (potvrzeno), `✅ shoda` (false alarm) nebo `⚖️ by-design`.

| ID | Osa | Hyp. záv. | Hypotéza | Oblast | Stav |
|---|---|---|---|---|---|
| K-NAV1 | `DR`/`OR` | 🟠 | žádný centrální path modul → router + ~87 magických stringů = 2 zdroje pravdy; tool vyčíslí drift (kořen) | 01/02 | 🐛 → NAV-01/02/03 |
| K-NAV2 | `OR` | 🔴→✅ | **MÝTUS:** RR v7 matchuje podle **rankingu** (specificity), ne pořadí → „static za `:slug` = mrtvá" neplatí. Scan: 0 ambiguit, jen 1 bare-dynamic (`:slug`) ve world shellu → 0 stínění. **Render test empiricky potvrdil** (static `pravidla` přebije `:slug` i když deklarovaný první). Komentáře „musí být poslední" jsou cargo-cult (neškodné). | 02 | ✅ shoda |
| K-NAV3 | `GC`/`VR` | 🔴 | skrytá nav položka (`hiddenNavItems`) skryje jen odkaz, routa zůstává dosažitelná URL → leak nebo by-design? | 03/05 | ⬜ |
| K-NAV4 | `GC` | 🔴 | každá world child routa musí mít guard; world index záměrně bez → ověř, že žádná jiná díra | 03 | ⬜ |
| K-NAV5 | `PA` | 🟠 | `useParams` klíč == path segment; `:slug` napříč 3 routami, `:groupKey` decode; mismatch → prázdná stránka | 02 | ⬜ |
| K-NAV6 | `RG` | 🟠 | route role (kalendar/timeline/pocasi/admin/*) — **route enforcement OK** (matice 60/60 sedí se záměrem), ale **nav nad-inzeruje** role-gated položky → NAV-04/05 | 03/06 | 🐛 → NAV-04/05 |
| K-NAV7 | `DL` | 🟠→✅ | nav generátory (buildWorldNav/PRIMARY_NAV/CHAT_ROOMS/toolbox): **všechny `to` cíle resolvují**; `magicky-system`/`technologie` = wiki `:slug` (by-design); dead link NAV-01 přišel z hooku, ne z generátoru | 01 | ✅ generátory čisté |
| K-NAV8 | `RI` | 🟡 | legacy redirect `sprava-udalosti → ../akce` značený „1 měsíc" → po expiraci dluh; `/postava/:slug` necyklí | 04 | ⬜ |
| K-NAV9 | `RI` | 🟠 | ~15 post-action `navigate()` (po create/delete) cílí na živou routu | 04 | ⬜ |
| K-NAV10 | `IR`/`EX` | 🟡 | intent round-trip + open-redirect guard (`//evil.com`); custom headline externí `rel=noopener` | 04/07 | ⬜ |
| K-NAV11 | `DP` | 🟠 | deep-link/F5 na `/svet/:slug/postava/:slug` → guard+loader běží bez in-memory stavu; refresh == klik | 05 | ⬜ |
| K-NAV12 | `MP` | 🟡 | mobilní drawer renderuje `buildFullWorldNav` stejně jako desktop; nic jen-desktop | 05 | ⬜ |
| K-NAV13 | `HP` | 🟡 | odkazy v `/ikaros/napoveda` na živé routy (cross-ref [napoveda]) | 07 | ⬜ |
| K-NAV14 | `BP` | 🔴 | 👑 BE endpointy hradí ≥ FE roli. **OK:** timeline/pocasi/denik-pj/sablona-deniku/emotes + mutace kalendar/headline. **Leak:** campaign bez floor (NAV-06), pages/calendar-config PomocnyPJ<PJ (NAV-07/08), GET settings open (NAV-09). BE hradí jen service-asercemi, ne dekorátory. | 08 | 🐛 → NAV-06..09 |
| K-NAV15 | `RX`/`FZ` | 🟠 | crawler najde mrtvý klik / nedosažitelnou routu jen za reálných dat; fuzz `:slug`/`:id` → žádný crash/bílá | 09 | ⬜ |
| K-NAV16 | `TE` | 🟡 | mutace guardu → render/matrix testy musí zčervenat (jinak pokrytí = divadlo) | 09 | ⬜ |

## Cross-ref

- [role-audit.md](role-audit.md) — `RG`/`BP` (route role ↔ R-xx verdikty, BE enforcement), R-20 (platform Admin ve světě)
- [bug-audit.md](bug-audit.md) — `BP` (`route-audit.mjs` mapuje FE→BE API, vstup pro paritu), HTTP drift
- BE repo `Projekt-ikaros/backend/src` — `BP` (BE guardy `@UseGuards`/`@Roles` pro paritu)
- paměť `project_propadle_odkazy_audit` — `EX` (absolutní odkazy na starý web)
- skill `napoveda` — `HP` (Nápověda odkazuje na živé routy)
