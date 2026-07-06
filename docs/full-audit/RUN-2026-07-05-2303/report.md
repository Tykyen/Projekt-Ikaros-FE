# Plný audit (hloubková brána) — RUN 2026-07-05 → 07-06 (FE 213d05f3 / BE fadecaec→eca83da…)

> Noční běh na žádost uživatele. Režim: **opravy agresivní** (bezpečné/jednoznačné napravit, nejasné
> na ráno) · **FE necommit** · **BE commit+push na main** · **+db** jen prod → ⏭️.
> **Detail všech nálezů: [`findings-raw.md`](findings-raw.md)** · checkpointy v `checkpoints/` (78 jednotek).

## TL;DR
- **Pokrytí: kompletní** — všech 110 area souborů + 16 README napříč 16 audity, 3 vlny agentů + hluboký pod-fan-out (1 oblast → až 5 pod-agentů) + 7 rozšířených stylů (a11y/secret/dep/type/bundle/injection/dead-code).
- **Nálezů: ~130** — 🔴 kritické ~22 · ⭐ vysoké ~32 · ~ střední/nízké/dead/doc ~76.
- **Vstupní brána:** FE build ✅ · BE typecheck ✅ · BE jest 2353/2353 ✅ · FE vitest **3485/3486 (1 fail = BASE-01)**.
- **Opravy hotové:**
  - **BE dávka 1** — 7 bezpečnostních fixů, commit `eca83da`, **pushnuto** ✅
  - **BE dávka 2** — 21 fixů (20 IDOR + leaky + funkční), commit `13d7d32`, **pushnuto** ✅
  - **FE dávka 3** — 30 souborů (eslint linkify=CI gate, error-code parse ×23, contrast 3 motivy, vite minify, calendar loop), ověřeno (eslint 0 / contrast 32/32 / vitest 309/309 / build OK), **necommitnuto** (k tvé revizi) 🌙
- **Proof-vrstvy:** e2e ⏭️ (lokální Mongo standalone, ne replSet) · +db ⏭️ (prod bez souhlasu) · +teeth ⏭️ (Stryker config rozbitý RC-CC1) · +formal dostupný, nepouštěn.
- **META brána (audit:regression --ci):** ✅ **EXIT 0 — žádná regrese** (každý opravený důležitý nález má pojistku G≥2). Pozn.: 3 opravené 🔴 jsou G0 (bez dedikované pojistky) → doplnit regresní testy.

## Infra
| Komponenta | Stav |
|---|---|
| FE HEAD | `213d05f3` (main) — necommitnuté FE opravy k revizi |
| BE HEAD | `fadecaec` → `eca83da` (dávka 1) → +dávka 2 (main, pushnuto) |
| Docker | ✅ ikaros-mongo (mongo:7, **standalone** — ne replSet) / meili / redis |
| Lokální Mongo `ikaros` | ✅ běží, **EMPTY** |
| Java 1.8 + tla2tools.jar | ✅ (formal nepouštěn) · Stryker ✅ instalován (config rozbitý) |

## 🔴 TOP kritické nálezy (výběr — plný seznam ve findings-raw)
| ID | Repo | Popis | Stav |
|---|---|---|---|
| SEC-01/14 | BE | `room:join` bez gate `user:`/globální kanál → odposlech cizích DM/Camp bez přihlášení | ✅ opraveno (dávka 1) |
| SEC-11 | BE | `import type` na emote DTO → emoty nejdou vytvořit (400 pro všechny) | ✅ opraveno (dávka 1) |
| SEC-12/13 | BE | shop create/update bez role-gate → hráč self-publishne do veřejného obchodu | ✅ opraveno (dávka 1) |
| SEC-28 | BE | ReDoS: neescapovaný regex v user-search | ✅ opraveno (dávka 1) |
| SEC-15 | BE | convert CP→NPC nechá starou userId → bývalý hráč nakupuje „za" NPC | ✅ opraveno (dávka 1) |
| SEC-05 | BE | ban bypass v reactivateDeletion/refresh | ✅ opraveno (dávka 1) |
| SEC-18 | BE | push subscribe hijack cizí subscription | ✅ opraveno (dávka 1) |
| SEC-02 | BE | campaign cross-world IDOR (20 metod) — číst/měnit/mazat cizí svět dle ID | ✅ opraveno (dávka 2+2b) |
| SEC-03 | BE | maps cross-world IDOR (delete/activate/replace scény) | ✅ opraveno (dávka 2) |
| SEC-07 | BE | characters findByUser/findOne bez view-gate (leak private world) | ✅ opraveno (dávka 2) |
| SEC-22 | BE | galerie/diskuze favorites bez visibility filtru (leak Draft/Pending) | ✅ opraveno (dávka 2) |
| SEC-19 | BE | finance/inventory update bez isNpc gate | ✅ opraveno (dávka 2) |
| SEC-17 | BE | transfer účtů bez krytí → peníze z ničeho | ✅ opraveno (dávka 2) |
| SEC-25 | BE | dungeon-maps DTO bez dekorátorů → endpointy 400 + exportTemplate 500 | ✅ opraveno (dávka 2) |
| FUNC-02 | BE | timeline „odstranit obrázek" nikdy nesmaže | ✅ opraveno (dávka 2+2b) |
| SEC-20 | BE | **soft-smazaný svět zůstává živý** přes ID cestu (join/edit/access) | 🌙 RÁNO (mění mnoho cest — chce test) |
| SEC-21 | BE | self-service char assign → identity spoofing v chatu | 🌙 RÁNO |
| SEC-26 | BE | elevace nepokrývá worlds governance (settings/členové/kalendář) | 🌙 RÁNO |
| SEC-23 | BE | reserved-slug → stránka „mapa/obchod" tiše nedosažitelná | 🌙 RÁNO |
| SEC-24 | FE | vite@8 → `esbuild.drop` no-op → `console.*` v prod bundlu | 🌙 FE (necommit) |
| N-45 | FE | eslint chyba `linkify.tsx` → CI merge gate na main padá | 🌙 FE (necommit) |
| FUNC-01 | FE | CalendarPage nekonečná smyčka při months=[] → zamrzne tab | 🌙 FE (necommit) |

## 🌙 Necháno na ráno (vyžaduje tvé rozhodnutí / vyšší riziko)
- **SEC-10** `GET /worlds` vrací private/closed světy komukoli — **produktové rozhodnutí** (katalog veřejný vs filtrovat)?
- **EC-VAL-2 / EC-RUN-A** `fields` field-mapping mrtvé end-to-end — dodělat FE `setError`, nebo smazat z BE kontraktu?
- **SEC-20/21/26/23** — kritické BE, ale mění chování mnoha cest (soft-delete guard, elevation governance, reserved-slug denylist) → chci na ně tvůj klid + ověření, ne slepě přes noc.
- **N-RUN-07 DELETE /users/:id** — legacy hard-delete bypass; FE ho nevolá → doporučuju endpoint odstranit, ale mazání API nechávám na tvé potvrzení.
- **CI workflow leaky** (`set-user-email.yml` má reálný email natvrdo v gitu, `export-ikaros-users.yml` dumpuje emaily do Actions logu) — potřebuje i úklid git historie / rotaci, ne jen edit.
- **Proof-vrstvy**: rozjet `MongoMemoryReplSet`/`--replSet` → plná e2e; opravit RC-CC1 → Stryker teeth; +db orphan/blob scan (prod read-only s tvým souhlasem).

## Per audit (souhrn stavu)
| Audit | Oblastí | Klíčové | Nové 🆕 |
|---|---|---|---|
| bug | 14 | auth ban, WS staleness, refresh race, soft-delete world, reserved-slug, backlinks | ~40 |
| role | 10 | elevation drift ~20 komponent, shop gate, self-promote, favorites leak | ~25 |
| ws-contract | 9 | room:join user: (SEC-01), reconnect gaps, room:leave konflikt, kontrakt drift | ~20 |
| error-contract | 9 | csMessage regrese, fields dead, errorCodes stale, FE data.code parse ×15+ | ~18 |
| cascade-delete | 1 | blob leak world-hard-delete (6 kolekcí), orphan cleanup mezery | ~7 |
| db-integrity | 1 | FK graf drift, index inventura (M-SCAN ⏭️ bez DB) | ~5 |
| upload-media | 1 | blob leak chatchannels/bestiae/scene.image, chybová hláška max 50MB | ~9 |
| state-consistency | 1 | reconnect refetch gaps (weather/admin-chat/presence) | ~6 |
| race-condition | 1 | toggleReaction/combat CAS, Stryker/TLA infra rozbité | ~4 |
| prod-config | 9 | FRONTEND_URL/BACKEND_BASE_URL CORS, JWT TTL, model_cache, esbuild drop | ~15 |
| log-hygiene | 10 | mailer email, push endpoint, CI email dumps, raw Error, scanner missing | ~12 |
| form-schema | 11 | (pokryto per-doménově; NumberField/schema-form validace mrtvá) | částečně |
| cache | 13 | reconnect neinvaliduje messages (world/admin chat), key drift | ~5 |
| nav | 1 | (nedokončeno do plné hloubky) | — |
| seed-scenario | 1 | (e2e harness ⏭️ replSet) | — |
| anti-regression | 7 | META brána — spustit v Fázi D | — |

## Proof-vrstvy (Fáze C) — stav
| Vrstva | Stav | Jak odblokovat |
|---|---|---|
| +e2e | ⏭️ 73/134 fail = infra | lokální Mongo standalone → `docker run mongo --replSet` nebo MongoMemoryReplSet |
| +db | ⏭️ EMPTY / prod | seed lokální DB, nebo explicitní souhlas s prod read-only |
| +teeth (Stryker) | ⏭️ blokováno | opravit `backend/stryker.conf.json` jest.configFile (RC-CC1) |
| +formal (TLC) | dostupné, nepouštěno | `java -jar c:/tmp/tla2tools.jar` na `.tla` modely |

## Doporučené pořadí dořešení (ráno)
1. **Ověřit deploy dávek 1+2** (GitHub Actions prošel? BE restart?).
2. **FE dávka** (eslint linkify = CI gate! → pak error-code parse batch → contrast → elevation → vite minify).
3. **SEC-20/21/26/23** (kritické BE, s klidem + testy).
4. **Rozhodnout SEC-10, EC-fields, DELETE /users/:id.**
5. **CI workflow leaky + git historie.**
6. **Proof: replSet e2e + Stryker RC-CC1 + prod +db (se souhlasem).**
7. `funkce` + `napoveda` skill po opravách měnících funkčnost.
