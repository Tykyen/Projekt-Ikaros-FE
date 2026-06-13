# Navigace & routování — vede každý odkaz na živou cestu a chrání každá cesta to, co má?

> **Účel:** vzít **navigační kostru** aplikace — definice rout (`createBrowserRouter`), parametry,
> guardy a **všechny odkazy/přesměrování** roztroušené po FE — a tvrdě ověřit, že drží jako **jeden
> konzistentní graf**: každý `to`/`navigate` cíl má **živou routu**, každá routa má **správný guard a
> parametr**, žádný odkaz v menu není **mrtvý** (404), žádná chráněná cesta nemá **díru** (leak) a router
> a odkazy si **neodporují**. Cílová otázka:
> „když uživatel klikne kamkoli v UI nebo zadá hlubokou URL — **dostane se tam, kam má, a jen tam, kam
> smí**, nebo narazí na 404 / prosákne obsah / skončí ve smyčce?"
>
> Desátý sourozenec [`bug-plan/`](../bug-plan/README.md), [`ws-contract-plan/`](../ws-contract-plan/README.md),
> [`role-plan/`](../role-plan/README.md), [`form-schema-plan/`](../form-schema-plan/README.md),
> [`cache-plan/`](../cache-plan/README.md), [`state-consistency-plan/`](../state-consistency-plan/README.md),
> [`cascade-delete-plan/`](../cascade-delete-plan/README.md), [`db-integrity-plan/`](../db-integrity-plan/README.md)
> a [`seed-scenario-plan/`](../seed-scenario-plan/README.md). Je to **statický breadth-first sweep jedné
> starosti** (navigační integrita) napříč všemi moduly — jako prvních osm — ale s **vlastní spustitelnou
> vrstvou**: tool diffne path-set proti link-setu a render-testy projedou každou routu, takže nálezy jsou
> **strojově prokázané**, ne jen vyčtené.
>
> **Stav:** zahájeno 2026-06-13. Plán napsán, sweep nezačal. Nálezy → [`../nav-audit.md`](../nav-audit.md) (ID `NAV-xx`).

---

## Proč samostatný plán (co ostatní audity míjí)

Předchozí audity řežou systém po **datech a stavu**: kontrakt API ([bug](../bug-audit.md)), oprávnění
([role](../role-audit.md)), tvar formuláře ([form-schema](../form-schema-audit.md)), cache, real-time,
mazání, integrita DB. **Žádný neaudituje vrstvu mezi uživatelem a stránkou — navigační graf.** A přesně
tam žije vlastní třída chyb, kterou žádný datový sweep nevidí:

| Slepá skvrna | Příklad reálného rizika v Ikarovi | Dopad |
|---|---|---|
| **Mrtvý odkaz v menu** | nav generátor skládá `to` magickým stringem; routa se přejmenuje → odkaz míří na nic | 🟠 klik → 404, feature „zmizela" |
| **Orphan routa** | routa existuje, ale žádné menu/tlačítko na ni nevede → dosažitelná jen ručním zadáním URL | 🟡 mrtvý kód / skrytá feature |
| **Stínění routou** | nová world routa přidaná **za** wiki catch-all `:slug` → tiše ji spolkne wiki viewer | 🔴 feature nedostupná, bez chyby |
| **Param mismatch** | path má `:slug`, stránka čte `useParams().id` → `undefined` → prázdná/rozbitá stránka | 🟠 bílá stránka |
| **Díra v guardu** | world child routa bez `memberOnly()` → obsah světa dosažitelný nečlenem přes URL | 🔴 leak obsahu |
| **Špatná role na routě** | `minWorldRole` na routě nesedí se záměrem feature → over-block (frustrace) nebo leak | 🟠/🔴 |
| **Mrtvý redirect** | post-action `navigate('/...')` po smazání míří na neexistující cestu → 404 místo návratu | 🟠 |
| **Skrytí ≠ zákaz** | nav položku skryju (`hiddenNavItems`) → odkaz zmizí, ale routa zůstává dosažitelná URL | 🟡/🔴 leak |
| **Refresh ≠ klik** | hluboká URL funguje klikem (in-memory stav), ale po F5 spadne (loader nezná kontext) | 🟠 sdílený link nefunguje |
| **Open-redirect** | login intent uloží `//evil.com` → po loginu odejde mimo aplikaci | 🔴 bezpečnost |

> 💡 **Kořen (jako každý audit má jeden):** FE **nemá centrální definici cest** — žádné `routes.ts` /
> `paths.ts` / path-builder. Router ([`router.tsx`](../../src/app/router.tsx) `createBrowserRouter`) a
> **~87 magických stringů** `to="/svet/${slug}/…"` roztroušených po komponentách jsou **dva nezávislé
> zdroje pravdy**. Drift mezi nimi je tichý — ukáže se až runtime 404. Audit ho zviditelní strojově a
> rozhodne, jestli zavést sdílený kontrakt cest.

📚 **Co je „guard" / „catch-all" / „orphan routa":** guard = wrapper co před vykreslením stránky ověří
přihlášení/roli (jinak redirect/403). Catch-all = routa `*` nebo `:slug`, co chytí všechno neodchycené
předtím (pozor na pořadí). Orphan routa = existuje v routeru, ale nikdo na ni neodkazuje.

---

## Prior art (co už existuje a co míjí)

> ⚠️ Část nástrojů už **existuje** — stavíme na nich, neduplikujeme.

| Artefakt | Co dělá | Co míjí |
|---|---|---|
| [`scripts/route-audit.mjs`](../../scripts/route-audit.mjs) (`npm run audit:routes`) | **HTTP API** drift: FE `api.get/post(...)` vs BE `@Controller` routy | **client-side routování** (React Router) — definice rout, menu odkazy, guardy, params; jiná vrstva |
| `useBrokenLinks` + `classifyPageLink` (PageViewer) | wiki **obsahové** odkazy: přepíše staré Matrix `/slug` → `/svet/:slug/slug`, hlásí broken | jen obsah stránek, ne **systémová nav / router** |
| [propadlé-odkazy audit](../../../Projekt-ikaros/) (paměť `project_propadle_odkazy_audit`) | absolutní odkazy na umírající starý web | jen externí/legacy, ne interní router↔odkaz drift |
| `WorldMembershipGuard.spec.tsx`, `WorldLayout.spec.tsx` | bodové testy guardu a layout stavů | **systematické** pokrytí všech rout/guardů/odkazů |

> 💡 **Pozice tohoto auditu:** je to **router-vrstva**, kterou žádný existující nástroj nepokrývá.
> `route-audit.mjs` řeší API kontrakt (BE), `useBrokenLinks` obsah stránek — tenhle audit řeší **kostru
> mezi nimi**: router ↔ menu ↔ guard ↔ param. Sdílené povrchy (role na routě, externí odkazy) **křížově
> odkazuje** (M2), nezdvojuje.

---

## Kontrolní osy (17 — 7 jádrových + 6 hloubkových + 4 nadstavba)

### Jádro (tvrzeno na celém grafu)
| Osa | Zkr | Otázka | Cross-ref |
|---|---|---|---|
| **Route–Link drift** | `DR` | každý `to`/`navigate`/`<Navigate>` cíl má **živou** `path`; každá `path` má aspoň 1 vstup (jinak orphan) | nový |
| **Param contract** | `PA` | segment `:x` v path == klíč `useParams().x`; typ (slug vs id) sedí; chybějící/neexistující param → **graceful** | form-schema |
| **Guard coverage** | `GC` | každá routa, co **má** být chráněná, MÁ guard (auth/role/membership); žádná nechráněná díra (leak) | role · auth-policy |
| **Role-gate správnost** | `RG` | `minWorldRole`/`roles` na routě sedí se **záměrem feature** a s [role-audit](../role-audit.md) verdikty (R-xx) | role |
| **Ordering / shadowing** | `OR` | specifické **před** parametrickými; `:slug` catch-all nestíní žádnou routu; routa **po** catch-all = mrtvá | nový |
| **Dead link** | `DL` | odkaz z nav generátoru / tlačítka míří na **existující a dosažitelnou** cestu (ne 404, ne nečekané 403) | nový |
| **Redirect integrity** | `RI` | legacy `<Navigate>` + **post-action** `navigate()` cíle resolvují na živou routu; žádná smyčka | nový |

### Hloubka (skok ze čtení na prokázání)
| Osa | Zkr | Konkrétní tah | Co reálně chytí |
|---|---|---|---|
| **Visibility vs reachability** | `VR` | skrytá nav položka (`hiddenNavItems`) — routa **pořád** dosažitelná URL? skrytí ≠ guard | leak skryté feature / dluh politiky |
| **Deep-link / refresh** | `DP` | přímý vstup / F5 na hlubokou URL = stejný výsledek jako klik; guard+loader běží bez in-memory stavu | „sdílený link nefunguje", SPA-only nav |
| **Intent round-trip** | `IR` | `requireAuth` → `/?openLogin=1` → login → **návrat** na zamýšlenou cestu; open-redirect guard (`//evil.com`) | bezpečnost + UX po loginu |
| **Mobile parita** | `MP` | mobilní drawer = **stejná** dosažitelná nav jako desktop (mobil-desktop pravidlo) | feature jen-desktop / jen-mobil |
| **External / propadlé** | `EX` | externí odkazy (custom headline) bezpečné (`rel=noopener`, ext ikona); žádný absolutní odkaz na umírající starý web | [propadlé-odkazy] cross-ref |
| **Help / Nápověda parita** | `HP` | odkazy a popsané cesty v `/ikaros/napoveda` míří na **živé** routy | [napoveda] skill drift |

### Nadstavba (Maximum+ — strop hloubky)
| Osa | Zkr | Konkrétní tah | Co reálně chytí |
|---|---|---|---|
| **BE-parita guardu** | `BP` | pro každou guardovanou routu: BE endpointy, co stránka volá, hradí **≥ stejnou** roli | 👑 leak: FE schová, BE servíruje (přímé URL/API) |
| **Reachability (crawl)** | `RX` | empirický graf z živého prokliku vs statický path-set; 0 console/404/smyček | mrtvý klik jen s reálnými daty; routa nedosažitelná žádnou cestou |
| **Fuzz robustnost** | `FZ` | náhodná/zlomyslná URL → nikdy crash/bílá/smyčka, vždy stránka nebo graceful 404/403 | param edge (unicode, `../`, extrémní délka) |
| **Teeth (mutace)** | `TE` | zmutuj guard (`>=`→`>`, prohoď role) → nav testy **musí** zčervenat | audit-divadlo (testy svítí zeleně i s rozbitým guardem) |

`DR`/`DL`/`RI` jsou osy **konzistence grafu** (vede odkaz někam?). `PA`/`OR` osy **mechaniky routeru**
(rozparsuje se to a vykreslí?). `GC`/`RG`/`VR` osy **bezpečnosti** (chrání to, co má?). `DP`/`MP`/`IR`/`EX`/`HP`
osy **reálné zkušenosti** (funguje to po F5, na mobilu, z mailu, z nápovědy?). `BP`/`RX`/`FZ`/`TE` jsou
**nadstavba** — `BP` posouvá audit z FE na **celý stack** (důkaz, že přístupová cesta neprosakuje ani na
BE), `RX` měří **empirickou** dosažitelnost, `FZ` **robustnost** proti zlým vstupům, `TE` dokazuje, že
audit **má zuby**.

---

## Metody ověření + úrovně jistoty

| Kód | Metoda | Nástroj |
|---|---|---|
| **M1** | Statické čtení — router.tsx, nav generátory, `useParams` | Read/Grep |
| **M-SCAN** | **Tool diff** — [`scripts/nav-audit.mjs`](tools/nav-scan.md): path-set z routeru × link-set z FE → orphan routy + dead links + param mismatch | node skript |
| **M-RENDER** | **Render test** — vitest + `MemoryRouter`: mountni každou routu (vykreslí, ne 404/crash); guard negativně (špatná role → 403/redirect) | vitest |
| **M-E2E** | **Proklik v prohlížeči** — Playwright projde celé menu reálně, 0 dead clicks, deep-link/refresh | Playwright |
| **M-MATRIX** | **Pravdivostní tabulka guardů** — každá identita × každá chráněná routa → přesný výsledek (render/403/redirect), exhaustivně | vitest parametrizovaně |
| **M-PARITY** | **FE↔BE parita** — pro každou guardovanou routu ověř, že BE endpointy, co stránka volá, jsou guardované ≥ stejnou rolí | čtení BE + mapování |
| **M-CRAWL** | **Živý crawler** — Playwright proleze app jako každá role, empirický graf dosažitelnosti vs statický + 0 console/404 | Playwright spider |
| **M-FUZZ** | **Fuzz URL** — náhodné/zlomyslné cesty → app nikdy nespadne/nezbělá/nezacyklí | fast-check |
| **M-MUT** | **Mutation testing** — zmutuj guard/router → nav testy musí zčervenat (mají zuby?) | Stryker |
| **M2** | Cross-ref — sdílené nálezy s [role](../role-audit.md) (RG) / [propadlé-odkazy] (EX) / [napoveda] (HP) | čtení |

| Úroveň | Co znamená | Důkaz |
|---|---|---|
| **L1** | staticky přečteno — vypadá konzistentně | nejslabší |
| **L2** | **tool diff** zelený — path-set ↔ link-set, orphan routy + dead links **vyčísleny** (0 nečekaných) | strojový smoke |
| **L3** | + `PA` (param contract) + `GC` (guard coverage) + `OR` (shadowing) ověřeno čtením/scanem | mechanika + bezpečnost |
| **L4** | + **render test**: každá routa se vykreslí; guard negativní case → 403/redirect; deep-link/refresh; param edge (neexistující slug → graceful) | prokázaný běh |
| **L5** | + **e2e proklik**: reálná navigace klikáním přes celé menu (desktop+mobil), 0 dead clicks, intent round-trip | externí pravda |
| **L6-matrix** | + **pravdivostní tabulka guardů** zelená: každá identita × každá chráněná routa → přesný výsledek (žádný vzorek) | exhaustivní bezpečnost |
| **L6-crawl** | + **živý crawler**: empirický graf dosažitelnosti == statický; 0 console error / 404 / smyček během průchodu | empirická pravda |
| **L7-stack** | + **FE↔BE parita**: 0 rout, kde je BE guard volnější než FE → access-control prokázán přes celý stack | cross-stack důkaz |
| **L7-teeth** | + **mutation testing**: nav testy prokazatelně **zčervenají** při zmutovaném guardu/routeru | důkaz síly testu |

**Cíl (varianta Maximum):** jádro (`DR`/`PA`/`GC`/`RG`/`OR`/`DL`/`RI`) na **L4** (tool + render);
`MP`/`IR`/`DP` klíčové cesty na **L5** (e2e proklik); `M-SCAN` jako **CI guard**. `EX`/`HP` na L2–L3.

**Cíl (varianta Maximum+):** navíc — guardy na **L6-matrix** (exhaustivní tabulka), reachability na
**L6-crawl** (spider), **L7-stack** (FE↔BE parita — celý stack neprosakuje), celý audit projde
**L7-teeth** (mutace = má zuby). To je strop: hlubší už není kam jít.

---

## Baseline + pasti prostředí

| Check | Stav | Pozn. |
|---|---|---|
| Centrální path modul (`routes.ts`/`paths.ts`) | ⬜ **NEEXISTUJE** | kořen — router + ~87 magických stringů = 2 zdroje pravdy |
| `nav-audit.mjs` (path-set × link-set diff) | ⬜ postavit (oblast 00) | rozšiřuje vzor `route-audit.mjs` |
| Render harness (MemoryRouter projede routy) | ⬜ postavit (oblast 00) | reuse `WorldMembershipGuard.spec` vzor |
| Playwright | ⬜ ověřit jestli v repu | e2e proklik (L5) |
| `vitest` bez globals, fireEvent | ✅ | paměť `project_fe_test_precommit` |
| FE build `npm run build` (tsc -b) | ✅ k 2026-06-05 | před push ověřit, paměť `project_fe_build_preexisting_errors` |

⚠️ **Pasti (z paměti + recon):**
- 🔴 **`:slug` wiki catch-all je poslední** ([router.tsx](../../src/app/router.tsx) ~ř. 355) — jakákoli **nová** world routa přidaná **za** něj je tiše stíněná. Tool musí hlídat pořadí, ne jen existenci.
- **World index bez guardu** je **záměr** (pre-join / join dashboard, [`WorldDashboardPage`]) — `GC` to nesmí hlásit jako díru. Naopak: ověř, že **žádná jiná** world routa guard nepostrádá.
- **Skrytí ≠ guard** — `hiddenNavItems` schová jen **odkaz**, routa žije dál. `VR` musí rozhodnout politiku (je to leak, nebo OK „skrytý, ne zakázaný"?). Cross-ref [project_world_informace_reference_pages], [project_akj_locked_tabs_visible].
- **3 vrstvy guardu** ([recon](00-cross-cutting.md)): `requireAuth` loader (auth) · `RoleGuard` (globální role, vrací 403) · `WorldMembershipGuard`/`memberOnly()` (world role, redirect/403). `RG` cross-ref [role-audit] **R-20** (platform Admin nemá moc ve světě) — fallback `[Superadmin, Admin]` v `memberOnly()` to nesmí porušit.
- **slug vs id** — world scope jede na `worldSlug` (ne ObjectId); `:id` jen platformové (články/galerie/uživatel). `PA` hlídá konzistenci, past z paměti `project_directory_id_vs_character_id`.
- **api.get obaluje params** ([project_api_client_params_contract]) — netýká se routeru, ale nepleť API query s route params při scanu.
- **FE bez prettieru** ([feedback_fe_no_prettier]) — tooling formátuj `eslint --fix`, ne prettier.

---

## Seed kandidáti (hypotézy — verdikt až při běhu)

> Běh každý povýší na `🐛 NAV-xx`, `✅ shoda` nebo `⚖️ by-design`. Detail → [`../nav-audit.md`](../nav-audit.md).

- **K-NAV1** `DR`/`OR` 🟠 — žádný centrální path modul → router + ~87 magických stringů = 2 zdroje pravdy; tool diff **vyčíslí** drift (orphan routy + dead links). Kořen. Oblast 01/02.
- **K-NAV2** `OR` 🔴 — wiki catch-all `:slug` na konci world sub-rout; nová world routa přidaná **za** něj = tiše mrtvá. Strukturální křehkost + guard v toolu. Oblast 02.
- **K-NAV3** `GC`/`VR` 🔴 — skrytá nav položka (`hiddenNavItems`) skryje jen odkaz, routa zůstává `memberOnly` — leak „skryté" feature URL, nebo by-design? Rozhodnout politiku. Oblast 03/05.
- **K-NAV4** `GC` 🔴 — každá world child routa MUSÍ mít `memberOnly`/guard; world index je záměrně bez — ověř, že **žádná jiná** díra. Oblast 03.
- **K-NAV5** `PA` 🟠 — `useParams` klíč == path segment; `:slug` napříč 3 routami (edit/postava/wiki), `:groupKey` + decode; mismatch → undefined → prázdná stránka. Oblast 02.
- **K-NAV6** `RG` 🟠 — route role (kalendar=PomocnyPJ, timeline/pocasi=Hrac, admin/*=PJ) musí sednout s [role-audit](../role-audit.md) verdikty i s předpokladem stránky; drift = leak/over-block. Oblast 03/06.
- **K-NAV7** `DL` 🟠 — nav generátory (buildWorldNav, PRIMARY_NAV, CHAT_ROOMS, headlineToNavGroups, buildGroupNavEntries) — každý `to` proti path-setu; HIDEABLE klíče (`magicky-system`, `technologie`) jsou wiki `:slug`, ne dedikované routy → ověř mapování. Oblast 01.
- **K-NAV8** `RI` 🟡 — legacy redirect `sprava-udalosti → ../akce` značený „1 měsíc" ([router.tsx](../../src/app/router.tsx) ~ř. 257) — po expiraci dluh; ověř datum + `/postava/:slug` legacy redirect necyklí do wiki catch-all. Oblast 04.
- **K-NAV9** `RI` 🟠 — všech ~15 post-action `navigate()` (po create/delete světa/článku/stránky/galerie) cílí na živou routu; smazání světa → `/`, create → `/svet/:slug`. Oblast 04.
- **K-NAV10** `IR`/`EX` 🟡 — requireAuth intent round-trip + open-redirect guard (`isSafeRelativePath`, `//evil.com` test existuje); custom headline externí odkazy `rel=noopener` + ext ikona. Oblast 04/07.
- **K-NAV11** `DP` 🟠 — deep-link/F5 na `/svet/:slug/postava/:slug`: guard+loader běží bez in-memory stavu (WorldLayout čte slug z URL); refresh == klik. Oblast 05.
- **K-NAV12** `MP` 🟡 — mobilní hamburger drawer (WorldLayout) renderuje `buildFullWorldNav` stejně jako desktop; žádná položka jen-desktop. Oblast 05.
- **K-NAV13** `HP` 🟡 — odkazy v Nápovědě (`/ikaros/napoveda`) na živé routy; cross-ref [napoveda]. Oblast 07.
- **K-NAV14** `BP` 🔴 — 👑 každá guardovaná routa: BE endpointy stránky hradí ≥ stejnou roli; podezřelé řádově `kalendar`/`timeline`/`pocasi`/`denik-pj`/`admin/*` (FE world-role vs BE guard). Leak přes přímé URL/API. Oblast 08.
- **K-NAV15** `RX`/`FZ` 🟠 — živý crawler najde mrtvý klik / nedosažitelnou routu jen za reálných dat; fuzz `:slug`/`:id` (unicode, `../`, délka) → žádný crash/bílá. Oblast 09.
- **K-NAV16** `TE` 🟡 — mutace guardu (`>=`→`>`, prohoď role v `memberOnly`) → render/matrix testy musí zčervenat; jinak je pokrytí divadlo. Oblast 09.

---

## Index oblastí (10)

| # | Oblast | Jádro povrchu | Osy |
|---|---|---|---|
| 00 | [Cross-cutting](00-cross-cutting.md) | tooling (`nav-scan`), render harness, axis katalog, path-normalizace, guard vrstvy, pasti | všechny |
| 01 | [Nav generátory](01-nav-generatory.md) | buildWorldNav · buildFullWorldNav · PRIMARY_NAV · CHAT_ROOMS · headlineToNavGroups · buildGroupNavEntries · HIDEABLE | `DR` `DL` |
| 02 | [Router strom + params](02-router-params.md) | path-set z router.tsx, ordering/shadowing, param contract, catch-all 404 | `OR` `PA` `DR` |
| 03 | [Guardy + role + membership](03-guardy.md) | requireAuth · RoleGuard · WorldMembershipGuard/memberOnly · coverage · index výjimka | `GC` `RG` `VR` |
| 04 | [Redirecty + post-action navigace](04-redirecty.md) | legacy `<Navigate>` · ~15 navigate() po akci · intent round-trip · open-redirect | `RI` `IR` |
| 05 | [Deep-link / refresh / mobil](05-deeplink-mobil.md) | F5 na hluboké URL · neexistující slug/id → graceful · mobilní drawer parita | `DP` `PA` `MP` |
| 06 | [Role-gate cross-ref](06-role-gate.md) | route role ↔ [role-audit] R-xx · leak/over-block · fallback Sa/Admin | `RG` |
| 07 | [Externí + Nápověda + propadlé](07-externi-napoveda.md) | custom headline externí · open-redirect · [napoveda] + [propadlé-odkazy] cross-ref | `EX` `HP` |
| 08 | [FE↔BE parita guardů](08-be-parita.md) 👑 | mapování route→BE endpointy stránky → BE guard ≥ FE guard; cross-repo leak | `BP` |
| 09 | [Robustnost + zuby](09-robustnost-zuby.md) | živý crawler (reachability) · fuzz URL · mutation testing nav testů | `RX` `FZ` `TE` |

---

## Legenda statusů

- ⬜ netestováno · ✅ ověřeno OK · 🐛 nález → [`../nav-audit.md`](../nav-audit.md) (`NAV-xx`) · ⚠️ podezřelé · ⏭️ blokované/`[human]`
- `K-NAVx` seed kandidát (hypotéza)

## Pracovní postup

1. **Tooling** — postav [`scripts/nav-audit.mjs`](tools/nav-scan.md): extrahuj path-set z routeru + link-set z FE, normalizuj params, diff → orphan routy + dead links + param mismatch (L2). Oblast 00.
2. **Render harness** — vitest + MemoryRouter co projede každou routu (vykreslí / guard negativně). Oblast 00.
3. **Sweep jádra (L2→L4)** — oblasti 01–04: generátory → router/params → guardy → redirecty; každá osa scanem + render testem.
4. **Hloubka (L4→L5)** — oblast 05: deep-link/refresh/mobil e2e; oblast 06: role cross-ref; oblast 07: externí + nápověda.
5. **Maximum+ (L6→L7)** — oblast 03/06: pravdivostní tabulka guardů (L6-matrix); oblast 08: **FE↔BE parita** (L7-stack, 👑); oblast 09: crawler (L6-crawl) + fuzz + mutation (L7-teeth).
6. **CI guard** — `nav-audit.mjs` + matrix test do CI/precommit, aby drift nikdy nevrátil tiše.
7. **Nález → `NAV-xx`** s **osa / routa nebo odkaz / reprodukce / vratné?**; neopravovat tiše, opravy gated (souhlas).
