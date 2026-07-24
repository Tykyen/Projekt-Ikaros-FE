# Spec 27.1 — Pět zlatých cest FE↔BE e2e (certifikace jádra)

**Status:** Draft v3 — čeká na schválení · **rozděleno:** produkční vazba ④ vyčleněna do samostatné karty **27.1b** (autor 2026-07-24). Tato spec = jen certifikační infra.
**Rozsah:** BE 5 golden-path e2e + FE 2 Playwright cesty (①②) + doc registr — testovací/certifikační infrastruktura, **žádná produkční změna chování**
**Repo:** `Projekt-ikaros` (BE e2e) + `Projekt-ikaros-FE` (Playwright, doc) — commit přímo na `main`
**Velikost:** BE ~7 souborů / ~800 ř · FE ~4 soubory / ~300 ř · doc 1 soubor
**Autor:** PJ + Claude
**Datum:** 2026-07-24
**Souvisí:** 23.7 (CI brány, deploy jen po zelené) · **27.1b (vazba ④, dokončí řetěz)** · 27.3 (scope registr A/B/C) · 27.4 (SLO brána)

---

## 1. Cíl

Certifikovat **5 zlatých cest** — ucelených uživatelských průchodů přes víc modulů — jako automatické e2e testy, které běží v CI a blokují deploy (brána z 23.7). Dnes se moduly testují izolovaně; regrese vznikají na *švech* mezi nimi. Zlatá cesta = jeden test, který sváže moduly do řetězu a ověří, že happy-path průchod produktem drží.

Cesty:
① pozvánka → členství → postava
② postava → deník → chat → hod
③ mapa → token → iniciativa → výsledek
④ wiki → scénář → událost → kronika **(v 27.1 jako „4 uzly v jednom světě"; reálný řetěz referencí přidá 27.1b)**
⑤ komunitní položka → schválení → klon do světa

⚠️ Cesta ④ dnes nemá datové vazby mezi uzly (ověřeno grepem: žádné `scenarioId`/`gameEventId`). 27.1 ji proto certifikuje jako **„4 moduly fungují v jednom světě"**. Založení vazby (aby ④ byl skutečný referenční řetěz) je samostatná karta **27.1b** — ne dluh, naplánovaná práce. golden-path-4 test se po 27.1b jen **povýší** (přidá se assert řetězu), nezahazuje se.

---

## 2. Kontext / motivace

Rešerše ROI #3: kritické propojení produktu je hlavní diferenciátor (síla propojení 84 %), a přesně tam vznikají cross-repo regrese (pravděpodobnost 50 %, dopad 90 %). Dnes máme 1 FE smoke happy-path + BE e2e po modulech (33 speců). Chybí testy, které moduly svazují — když se rozbije šev (např. přijatá pozvánka nevytvoří membership se správnou rolí), žádný dnešní test to nechytí.

Před pouštěním kohort A/B (28.1) musí být jádro certifikované: „těchto 5 věcí funguje od začátku do konce a deploy je nepustí, když se rozbijí".

---

## 3. Audit současného stavu

### 3.1 BE (`Projekt-ikaros/backend/test/`)
- 33 e2e speců, in-memory Mongo (`mongodb-memory-server`), sériově (`maxWorkers:1`, timeout 120 s), spouští `npm run test:e2e`. V CI job `backend-e2e` z 23.7 (glob `.e2e-spec.ts$` → nové specy se chytnou automaticky).
- **Páteř** `test/helpers/seed-scenario.ts` → `buildCanonicalWorld(app, conn, {suffix})` staví přes reálné HTTP endpointy řetěz **user→svět→člen(access-request→approve→role)→stránka→postava→chat→mapa** a vrací `CanonicalSeed` se všemi ID. Ideální základ všech cest. (Pozn.: karta píše „páteře 16/16" — páteř má **7 kroků**, řetězec „16/16" v kódu ani docs neexistuje → oprava textu roadmapy v §4.6.)
- Helpery: `helpers/auth.ts` (registerUser/loginUser/authHeader), `helpers/db.ts` (startTestDb/startTestReplDb/clearAllCollections), `helpers/app-factory.ts` (createTestApp).

### 3.2 Pokrytí 5 cest dnes
| Cesta | Stav | Mezera |
|---|---|---|
| ① | částečné | invite endpointy 0 e2e (pokryta jen access-request varianta členství) |
| ② | nejslabší | deník API se v e2e nevolá; hod jen jako `it.failing` útok (dice forge) |
| ③ | částečné→dobré | token+HP silné; iniciativa jen `it.failing` turn-gate |
| ④ | slabé | scénář 0 e2e, kronika 0 e2e; žádná datová vazba mezi uzly (řeší 27.1b) |
| ⑤ | pokryté | `scene-template-share.e2e-spec.ts` = plný flow pro scény; ostatní typy šablon ne |

### 3.3 FE (`Projekt-ikaros-FE/e2e/`)
- 4 soubory: `smoke.spec.ts` (login→svět→mapa), `persona.spec.ts` (onboarding), `mock-api.ts` (`page.route` catch-all na `**/api/**`, statické fixtures, socket.io abortován), `fixtures.ts`.
- Testuje proti **mock-API**, žádný backend. CI job `frontend-e2e` (build → `vite preview` → `playwright test`) z 23.7.
- Cesty ①② FE test nemají; mock pokrývá jen login/worlds/tactical-map.

### 3.4 Ověřené endpointy (happy-path REST existuje pro všechny uzly)
| Uzel | Route | Pozn. |
|---|---|---|
| invite+accept | `POST /worlds/:id/invites` → `POST /worlds/:worldId/invites/:inviteId/accept` | cílená (`kind:'user'`) deterministická; role po přijetí = Čtenář |
| deník zápis | `PATCH /worlds/:worldId/characters/:slug/diary` | `customDataPatch` (delta merge) |
| hod | `POST /worlds/:worldId/chat/channels/:channelId/messages` s `dicePayload` | **klient RNG**, server sanituje/přepočítá `total`; e2e pošle `faces`, ověří dopočet |
| iniciativa | `POST .../chat/channels/:channelId/combatants` → `PATCH .../combat` (`op:'start'\|'turn'\|'end'`) | roster per konverzace, PJ+ |
| scénář | `POST /campaign/scenarios?worldId=<id>` | worldId = **query**; PomocnyPJ+ |
| kronika | `POST /timeline` (`worldId`,`year/month/day`,`title`,`text` v **body**) | PJ+ |

⚠️ **Past — umístění `worldId` se liší:** path (invite/deník/chat) · query (campaign) · body (timeline). Impl plán to ohlídá per krok.

---

## 4. Návrh řešení

### 4.1 BE — 5 golden-path e2e speců
Nová složka `backend/test/golden/`. Každá cesta = 1 spec, top-level `describe('[GOLDEN ①] …')` (tag pro čitelnost CI reportu). Základ = `buildCanonicalWorld` + **golden helpery** (nové kroky), které NErozšiřují páteř (páteř zůstává minimální smoke — ne každý test potřebuje deník/hod).

Nové helpery → `test/helpers/golden-steps.ts`:
`inviteUserAndAccept` · `writeDiaryEntry` · `rollDiceInChat` · `addCombatant`+`advanceTurn` · `createScenario` · `createTimelineEntry`.

| Spec | Řetěz | Klíčové asserty (šev, ne jen 2xx) |
|---|---|---|
| `golden-path-1-invite-member-character.e2e-spec.ts` | PJ vytvoří invite `kind:'user'` pro hráče → hráč `accept` → vznikne membership (role Čtenář) → PJ povýší na Hráč → hráč vytvoří/dostane postavu | membership existuje s **správnou rolí**; postava vázaná na membera; cizí uživatel invite přijmout nemůže (403) |
| `golden-path-2-character-diary-chat-dice.e2e-spec.ts` | postava (seed) → `PATCH diary` (customDataPatch) → chat zpráva → hod (`dicePayload.faces`) | deník `customData` obsahuje zapsaný klíč; zpráva `isDiceRoll:true` a server **dopočítal `total`** z faces; nesmyslný payload → 400 |
| `golden-path-3-map-token-initiative-result.e2e-spec.ts` | mapa (seed) → `token.add` op → `combatants add` (2×) → `combat start` (pořadí) → `combat turn` → HP výsledek přes `maps/:id/operations` hpDelta | `currentCombatantId` se posune; HP se sníží a **naclampuje** (ne pod 0); GET mapy vrátí konzistentní stav |
| `golden-path-4-wiki-scenario-event-chronicle.e2e-spec.ts` | wiki page (seed) → `POST /campaign/scenarios` → `POST /game-events` → `POST /timeline` — **4 nezávislé uzly v jednom světě** (§4.4) | každý uzel 2xx + čitelný GET; všechny nesou stejný `worldId`; cizí svět je nevidí (tenant izolace). **TODO(27.1b):** povýšit na assert řetězu referencí |
| ⑤ | **re-use** `scene-template-share.e2e-spec.ts` — přidat do jeho describe tag `[GOLDEN ⑤]` + zaregistrovat v §4.5. Nový soubor NEtvoříme (flow je kompletní). | beze změny testu |

### 4.2 FE — 2 Playwright cesty ①②
Dle karty jen ①② (③ = PIXI mapa, ④/⑤ = PJ nástroje — BE e2e je pokryje líp; FE mock by testoval jen že UI zavolá endpoint, nízká hodnota za vysokou cenu mocku).

- `e2e/golden-path-1.spec.ts` — přijetí pozvánky (přes `?invite=<token>` nebo UI) → vstup do světa → vytvoření postavy. UI průchod, ověří že se vyrenderují správné obrazovky a zavolají správné endpointy.
- `e2e/golden-path-2.spec.ts` — otevřít postavu → deník (zápis) → chat → hodit kostkou → vidět výsledek hodu v chatu.
- Rozšíření `e2e/mock-api.ts`: routy pro invites, membership, characters, diary, chat messages (vč. `isDiceRoll`), dice. **Realističtější fixtures** (karta): mock vrací data konzistentní s BE tvarem (dicePayload s total, deník customData).
- `e2e/fixtures.ts`: `TEST_CHARACTER`, `TEST_DIARY`, `TEST_CHAT_MESSAGE`, `TEST_DICE_ROLL`, `TEST_INVITE`.

📚 FE Playwright zde netestuje BE logiku (proti mocku), ale **průchodnost UI** — že klik po kliku dojde od pozvánky k postavě bez rozbitého routingu/guardu/lazy chunku. BE e2e testuje logiku švů. Dvě různé jistoty.

### 4.3 CI — bez nové konfigurace
Oba joby z 23.7 chytnou nové specy globem:
- BE `backend-e2e` → `golden/*.e2e-spec.ts` automaticky.
- FE `frontend-e2e` → `e2e/*.spec.ts` automaticky.
Deploy gate „jen po zelené" (23.7) tím pádem golden paths **automaticky brání deploy**, když zčervenají. Žádný nový workflow. Ověříme jen, že joby nové specy vidí a jsou zelené.

### 4.4 Cesta ④ v 27.1 = „4 uzly v jednom světě"
golden-path-4 vytvoří wiki page (seed), scénář, game-event a timeline záznam ve stejném světě a ověří: každý uzel 2xx, GET vrací data, **všechny nesou stejný `worldId`**, cizí svět je nevidí (tenant izolace). Neověřuje referenční řetěz mezi uzly — ten vznikne až vazbou v **27.1b**, kdy se do testu přidá assert „potomek nese ID rodiče". Test je psaný tak, aby to povýšení byl přídavek, ne přepis.

### 4.5 Doc registr — `docs/golden-paths.md` (FE repo)
Minimální certifikační registr (předstupeň 27.3): tabulka 5 cest — stav (CERTIFIKOVÁNO), odkaz na test soubor, seznam uzlů. U ④ poznámka: „certifikováno jako 4 moduly v jednom světě; referenční řetěz čeká na 27.1b". Zdroj pravdy „co je certifikované jádro".

### 4.6 Oprava roadmapy
`docs/roadmap3.md` karta 27.1: text „seed-scenario páteře 16/16" → „seed-scenario páteře (7 kroků)". Přidat kartu 27.1b (vazba ④). Po dokončení zaškrtnout 27.1 `- [x]`.

---

## 5. Out of scope
- **Produkční vazba ④ (scénář→událost→kronika)** — samostatná karta **27.1b** (spec-27.1b.md).
- ③④⑤ na FE Playwright (jen ①② dle karty).
- Rozšíření cesty ⑤ na další typy šablon (page/map/scenario-templates, name-sets, bestiae) — 27.3 scope, ne teď.
- Oprava `it.failing` bezpečnostních děr (dice forge, turn-gate) — to je 27.5 pentest. Golden paths testují **férový** happy-path, ne útok.
- Server-side RNG pro hod (dnes klient) — vědomý dluh BE, mimo 27.1.
- Load/perf proof (27.4).

---

## 6. Acceptance kritéria
1. ✅ BE: 4 nové golden-path specy (①②③④) zelené v `npm run test:e2e`.
2. ✅ BE: ⑤ = `scene-template-share` otagován `[GOLDEN ⑤]`, zůstává zelený.
3. ✅ BE: každý spec assertuje aspoň jeden **šev** (ne jen 2xx) — role po invite, dopočet total, posun tahu+clamp HP, společný worldId+tenant izolace ④.
4. ✅ FE: 2 Playwright cesty ①② zelené proti rozšířenému mock-API.
5. ✅ CI: oba joby vidí nové specy a jsou zelené (ověří uživatel na CI / lokálně).
6. ✅ `docs/golden-paths.md` registr existuje, 5 cest se stavem (④ s poznámkou o 27.1b).
7. ✅ Roadmapa: „16/16" opraveno, karta 27.1b založena, karta 27.1 `- [x]`.
8. ✅ `funkce` + `napoveda` aktualizace (změna = nová certifikační vrstva; pravděpodobně jen `funkce` poznámka o e2e pokrytí — potvrdí skill).

---

## 7. Test plán
- BE: `cd backend && npm run test:e2e` — 4 nové + scene-template-share zelené; celá sada nezčervená (žádná regrese).
- FE: `npm run test:e2e` (Playwright) — smoke + persona + 2 golden zelené.
- Manuální: žádný živý průchod nutný (testy jsou samy ověřením); FE Playwright běží proti buildu, ne dev serveru.
- Determinismus: 3× po sobě zelené (hod přes fixní faces, ne náhoda; iniciativa fixní pořadí).

---

## 8. Riziko & rollback
| Riziko | Mitigace |
|---|---|
| `worldId` na špatném místě (path/query/body) → 400/404 | tabulka §3.4; helper per uzel s explicitním umístěním |
| Hod: test čeká server RNG, který neexistuje | test posílá `faces`, ověřuje jen dopočet `total` (§4.2) |
| Cesta ④ vypadá jako řetěz, ale uzly nejsou provázané | v 27.1 explicitně jen „4 uzly v jednom světě"; řetěz = 27.1b |
| FE mock rozšíření rozbije stávající smoke (sdílený catch-all) | nové routy před default fallbackem; smoke test regres-check |
| Combat/dice DTO drift oproti realitě | endpointy ověřeny čtením controllerů (§3.4); impl plán potvrdí DTO |
| Flaky e2e (listen/close race jako v 23.7) | sériově `maxWorkers:1`; determinismus 3× |

**Rollback:** čistě aditivní (nové test soubory + doc). Revert = smazat `test/golden/`, `e2e/golden-path-*.spec.ts`, doc, vrátit mock-api/fixtures. Žádný produkční kód se nemění.

---

## 9. Rozhodnutí autora (2026-07-24)
1. **Cesta ④ vazby:** ✅ ROZHODNUTO — vazba se zakládá, ale jako **samostatná karta 27.1b** (ne dluh, ne součást 27.1). 27.1 certifikuje ④ jako „4 uzly v jednom světě".
2. **FE rozsah:** ✅ ROZHODNUTO — jen ①② (autor delegoval „nejlepší variantu").

Zbytek delegováno / rozhodnuto v §4 (struktura složek, tagy, re-use ⑤, žádný nový CI workflow, doc registr).

---

**Po schválení specu napíšu implementační plán** (přesné CLI / file diff). Navržené pořadí (nemíchat BE+FE v dávce):
1. **BE zátah — 5 golden-path e2e** (①②③④⑤ tag) + golden helpery.
2. **FE zátah — 2 Playwright cesty ①②** + mock-api/fixtures.
3. **Doc/uzávěr** — `golden-paths.md`, roadmap oprava+zaškrt+karta 27.1b, `funkce`+`napoveda`.
