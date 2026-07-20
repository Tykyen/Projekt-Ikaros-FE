# 00 — Cross-cutting (harness, seed-builder, assertion mřížka)

> Společná infrastruktura pro všechny režimy běhu (happy / fault / race / isolation / parametric).
> Cokoli, co nepatří jednomu kroku páteře, žije tady. Cíl: scénář se píše jako **deklarace kroků**, ne
> jako 700 řádků fetch+assert (vzor [`backend-smoke-test.ts`](../../../Projekt-ikaros/scripts/backend-smoke-test.ts) je proceduralní — tohle bude skládané z helperů).

---

## A) Harness — co upravit, než scénář poběží

### A1. Replica set (BLOKER pro `FA`/`RC`)
[`test/helpers/db.ts:11`](../../../Projekt-ikaros/backend/test/helpers/db.ts#L11) startuje `MongoMemoryServer` =
**standalone**. Mongo **transakce vyžadují replica set** → každá service cesta s `session.startTransaction()`
(membership approve, finance transfer, kaskádní fixy [DI-04](../db-integrity-audit.md)) v testu buď tiše
neběží transakčně, nebo hodí `Transaction numbers are only allowed on a replica set member`.

**Oprava:** přidat variantu `startTestReplDb()` přes `MongoMemoryReplSet`:

```ts
// test/helpers/db.ts — přidat (původní startTestDb ponechat pro rychlé unit e2e)
import { MongoMemoryReplSet } from 'mongodb-memory-server';

export async function startTestReplDb(): Promise<TestDb> {
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongo.getUri();
  return { mongo, uri, stop: async () => { await mongo.stop(); } };
}
```

a [`createTestApp`](../../../Projekt-ikaros/backend/test/helpers/app-factory.ts#L45) flag `replSet?: boolean`
→ vybere builder. Scénář ho zapne. ⚠️ Replica-set memory server je **pomalejší start** (~pár s) → seed
scénář drž v jednom `describe` s `beforeAll` (ne per-test fresh DB).

### A2. devDeps k doplnění
| Balík | Pro | Stav |
|---|---|---|
| `socket.io-client` | wire-level `RT` (L5) — druhý aktor poslouchá broadcast | ⬜ |
| `@stryker-mutator/core` (+ `@stryker-mutator/jest-runner`) | `M-MUT` L5-teeth | ⬜ |

### A3. Observabilita hook (`OB`)
Před `app.init()` zaregistruj spy na Nest `Logger` (nebo custom logger) → kolekce error/warn logů. Po
každém **happy** kroku assert prázdné. Pro tichý ValidationPipe drop: u vybraných create volání pošli
**pole navíc** (`__bogus: 1`) → po zápisu assert, že v DB **není** (drop proběhl) — to je očekávané; nález
je opačný směr (pole, co tam **být mělo**, zmizelo → testuje se per-uzel `SE`).

---

## B) Seed-builder (P1) — kanonický svět jako fixture

Jeden builder, deterministický, vrací handle na všechna ID. Sdílený všemi režimy. Skládá se z atomických
kroků, aby šel zastavit kdekoli (pro `FA`) nebo zdvojit (pro `RC`/`IS`).

```ts
// test/helpers/seed-scenario.ts (návrh API)
export interface Seed {
  pj: AuthSession;          // zakladatel světa (PJ)
  hrac: AuthSession;        // hráč
  worldId: string;
  worldSlug: string;
  membershipId: string;     // hráčův membership po approve
  pageSlug: string;
  personaPageSlug: string;  // page typu persona → vyrobí Character
  characterId: string;      // PC hráče
  npcId: string;
  chatGroupId: string;      // „kanál"
  chatChannelId: string;    // „konverzace"
  messageId: string;
  sceneId: string;
  tokenId: string;
}

// Granulární kroky (každý vrací delta) — páteř je jejich sekvence:
buildUsers(app)            // 01: register PJ + hráč
createWorld(app, pj)       // 02: POST /api/worlds  (+ assert seed side-effecty)
joinAndApprove(app, …)     // 03: hráč access-request → PJ approve → role Hrac
assignCharacter(app, …)    // 03: PATCH .../members/:id/character → auto konverzace
createPage(app, …)         // 04: POST /api/worlds/:w/pages
createPersonaPage(app, …)  // 04: persona page → Character side-effect
createCharacter(app, …)    // 05: PC + NPC (+ subdocy)
createChat(app, …)         // 06: group + channel + message
createScene(app, …)        // 07: scéna + token + assign hráči
```

> 💡 **Proč granulární:** `FA` potřebuje „postav až po krok K, pak vynuť pád K+1". `IS` potřebuje „postav
> dvakrát". `PB` potřebuje „postav s jiným systémem". Monolitický seed by to neuměl.

API cesty (z controllerů, ověřeno reconem):

| Krok | Metoda + cesta | Controller |
|---|---|---|
| register | `POST /api/auth/register` | auth.controller |
| login | `POST /api/auth/login` | auth.controller |
| svět | `POST /api/worlds` · `DELETE /api/worlds/:id` | worlds.controller:124/199 |
| access-request | `POST /api/worlds/:id/access-request` | worlds.controller:241 |
| approve | `POST /api/worlds/:worldId/access-requests/:requestId/approve` | worlds.controller:269 |
| role | `PATCH /api/worlds/:worldId/members/:membershipId/role` | worlds.controller:393 |
| přiřaď postavu | `PATCH /api/worlds/:worldId/members/:membershipId/character` | worlds.controller |
| odeber člena | `DELETE /api/worlds/:worldId/members/:membershipId` | worlds.controller:327 |
| stránka | `POST /api/worlds/:worldId/pages` | pages.controller |
| postava | `POST /api/worlds/:worldId/characters` | characters.controller |
| chat group | `POST /api/worlds/:worldId/chat/groups` · `DELETE …/:groupId` | chat.controller:71/113 |
| chat channel | `POST /api/worlds/:worldId/chat/groups/:groupId/channels` | chat.controller:126 |
| chat message | `POST /api/worlds/:worldId/chat/channels/:channelId/messages` | chat.controller:216 |
| mapa | `POST /maps` (`?worldId`) | maps.controller |

> ⚠️ Cesty + řádky **ověřit při psaní** proti aktuálnímu kódu (recon, ne zaručeně přesné řádky). Modul,
> který scénář potřebuje, importovat přes `createTestApp({ modules: [...] })` — nebo plný `AppModule`
> (pomalejší, ale realističtější; circular-dep past viz [`dluhy.md`](../dluhy.md) komentář v app-factory).

---

## C) Assertion helpery (P2) — mřížka tvrzení nad živým `connection`

`createTestApp` vrací `connection` ([app-factory:87](../../../Projekt-ikaros/backend/test/helpers/app-factory.ts#L87))
= živá `mongoose.Connection` → **přímý dotaz na DB v testu** = L4 bez externího scanu.

```ts
// test/helpers/assert-state.ts (návrh)
const col = (conn, name) => conn.db.collection(name);

// SE: child/side-effect existuje (a má správný tvar)
expectExists(conn, 'worldmemberships', { worldId, role: 'PomocnyPJ'|'Hrac'|… });

// SE/CARD: přesně N dokumentů (kardinalita subdoců)
expectCount(conn, 'character_diaries', { characterId }, 1);

// IN: žádný orphan — child s parentem, který neexistuje (podmnožina integrity-scan)
expectNoOrphans(conn, [
  ['pages', 'worldId', 'worlds'],
  ['characters', 'worldId', 'worlds'],
  ['character_diaries', 'characterId', 'characters'],
  ['worldmemberships', 'currentSceneId', 'mapScenes'],   // RR/CD-04
  // …reuse seznamu z integrity-scan.md
]);

// INV: counter == real count
expectCounterMatches(conn, 'worlds', worldId, 'playerCount',
  () => col(conn,'worldmemberships').countDocuments({ worldId, role: 'Hrac' }));

// CL: po smazání — celý strom pryč (0 dokumentů s worldId napříč WORLD_SCOPED)
expectWorldFullyDeleted(conn, worldId);   // volá expectNoOrphans + count==0
```

```ts
// AC: negativní volání (špatná role / cizí svět) → očekávaný status
async function expect403(app, method, path, token, body?) {
  const res = await request(app.getHttpServer())[method](path)
    .set(authHeader(token)).send(body ?? {});
  expect([401, 403, 404]).toContain(res.status);  // leak-safe: 404 i 403 OK
}
```

> 💡 **Sdílení s db-integrity:** `expectNoOrphans` přebírá **stejný FK seznam** jako
> [`integrity-scan.md`](../db-integrity-plan/tools/integrity-scan.md) (WORLD_SCOPED + character subdocs +
> RR refs) — jeden zdroj pravdy, scénář ho jen pouští **v kompozici po každém kroku**, scan ho pouští
> jednorázově nad celou DB. Nezdvojovat seznam → vytáhnout do sdíleného modulu.

---

## D) Fault injection mechanika (`FA`, P3)

Cíl: spustit failure větev, kterou happy-path nikdy nespustí, a ověřit, že stav po pádu je konzistentní.

```ts
// Příklad: persona page tvoří Character PŘED page save (DI-04). Vynuť pád page save:
const pagesRepo = app.get(PagesRepository);
jest.spyOn(pagesRepo, 'save').mockRejectedValueOnce(new Error('boom'));

await request(app.getHttpServer())
  .post(`/api/worlds/${worldId}/pages`)
  .set(authHeader(pj.accessToken))
  .send({ /* persona page dto */ })
  .expect(500);

// Assert rollback: žádná osiřelá postava ani subdocy nevznikly
expectCount(conn, 'characters', { worldId, slug: attemptedSlug }, 0);
expectNoOrphans(conn, [['character_diaries','characterId','characters'], …]);
```

Cíle fault injection (1 spy na kaskádu):
- **02 svět:** pád na `currencies`/`calendar` save → svět úplný-nebo-čistý (DI-04 worlds.create).
- **04 persona page:** pád page save po character create → 0 orphanů (DI-04 pages.create rollback fix).
- **03 approve:** pád uprostřed approve (membership + playerCount + případně chat) → konzistentní.
- **09 hard-delete:** pád na kolekci #15 z ~40 (`safeDelete` best-effort) → mezistav (CD-06 `TX`).
- **Obchod (campaign-purchase):** ✅ pokryto `RC-E5` v [`economy.race.e2e-spec.ts:317`](../../../Projekt-ikaros/backend/test/race/economy.race.e2e-spec.ts#L317) (rollback inventáře i účtu) + `withTransaction` v [`campaign-purchase.service.ts:248`](../../../Projekt-ikaros/backend/src/modules/campaign/services/campaign-purchase.service.ts#L248).

---

## E) Souběh mechanika (`RC`, P3)

```ts
// Double-approve / double-join naráz → přesně jeden uspěje, žádný dup membership
const [a, b] = await Promise.allSettled([
  request(app.getHttpServer()).post(joinPath).set(authHeader(hrac.accessToken)),
  request(app.getHttpServer()).post(joinPath).set(authHeader(hrac.accessToken)),
]);
expectCount(conn, 'worldmemberships', { worldId, userId: hrac.userId }, 1);  // unique {userId,worldId}
```

Cíle: double-join, double-approve, paralelní `POST page` se stejným slugem (`{worldId,slug}` unique),
double-`DELETE world` (idempotence). ⚠️ Bez replica setu může unique index chytit dup až na write —
ověřit, že chytí (ne app-level race window). Sdílí povrch s [K-DI11-IDX](../db-integrity-audit.md).

---

## F) Tenant izolace (`IS`, P4)

```ts
// Postav 2 kanonické světy. Identita ze světa A nesmí vidět nic ze světa B.
const seedA = await buildCanonicalWorld(app, { suffix: 'A' });
const seedB = await buildCanonicalWorld(app, { suffix: 'B' });

// PJ-A čte zdroje světa B → leak-safe (403/404/prázdno), nikdy obsah
await expect403(app, 'get', `/api/worlds/${seedB.worldId}/pages`, seedA.pj.accessToken);
await expect403(app, 'get', `/api/worlds/${seedB.worldId}/chat/groups`, seedA.pj.accessToken);
await expect403(app, 'post', `/api/worlds/${seedB.worldId}/characters`, seedA.pj.accessToken, {…});
// hráč světa A nevidí mapu/člena/news světa B …
```

Pokrývá leak-safe vzory (universe signal, locked AKJ, chat access, R-20 admin) **v kompozici**. R-20:
platform admin (samostatná identita) → assert **nemá** governance moc ve světě B (approve/transfer/delete).

---

## G) L5 vrstvy

### G1. `M-INFRA` — reálná docker infra (blob pravda)
Memory-mongo nevidí Cloudinary → blob leak (K-CD1/2/3) **fyzicky nezachytí**. L5-infra běh: reálná
`docker compose up` (mongo rs0 + Meili + Redis) + **Cloudinary test-folder** (env override na izolovaný
prefix). Po hard-delete světa assert: blob na Cloudinary **fakt zmizel** (list API), Meili index **fakt
purgnut**. ⚠️ Nesmí špinit prod folder ([project_server_swap] cíl = `www.projekt-ikaros.com`) — vlastní
test prefix + cleanup.

### G2. `M-MUT` — mutation testing (má scénář zuby?)
Stryker zmutuje BE kód (např. smaže `playerCount +1`, obrátí guard podmínku) a ověří, že **scénář
zčervená**. Zelený scénář nad zmutovaným kódem = scénář tu chybu **netestuje** → díra v mřížce. Zúžit
Stryker `mutate` na moduly na kritické cestě (worlds/pages/characters/chat/maps), jinak běh hodiny.

---

## H) Teardown & idempotence (`ID`)

- Mezi režimy `clearAllCollections(connection)` ([`db.ts:22`](../../../Projekt-ikaros/backend/test/helpers/db.ts#L22)) — čistý start.
- **Idempotence test:** spusť celou páteř **2×** za sebou v jedné DB (bez clear) → druhý běh buď čistě
  uspěje (jiné slugy/usernames přes deterministický suffix), nebo **deterministicky 409** na unique →
  assert žádný dup, žádný partial. Deterministický seed = stejný vstup → stejný výsledek (žádné
  `Date.now()`/random v fixture klíčích bez seedu).
- `afterAll(() => testApp.close())` — zavře app + zastaví mongo (jinak висící handle, jest neukončí).

---

## I) Mapování os → kroky (která osa žije na kterém uzlu)

| Krok ↓ \ Osa → | EX | SE | AC | IN | RT | ID | CL | FA | RC | IS | RB | OB | TM |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 Uživatel | ● | | ● | | | ● | | | ● | | | ● | |
| 02 Svět | ● | ● | ● | ● | | | | ● | | | | ● | |
| 03 Člen | ● | ● | ● | ● | ● | | | ● | ● | | | | |
| 04 Stránka | ● | ● | ● | ● | | | | ● | ● | | | ● | |
| 05 Postava | ● | ● | ● | ● | | | | | ● | | | | |
| 06 Chat | ● | ● | ● | ● | ● | | | | | | | | |
| 07 Mapa | ● | ● | ● | ● | ● | | | | | | | | |
| 08 Opráv.+izol. | | | ● | | | | | | | ● | | | |
| 09 Mazání | | | ● | ● | ● | | ● | ● | ● | | ● | | ● |
| 10 Migrace | ● | ● | | ● | | | | | | | | | |
| 11 Parametr. | ● | ● | ● | ● | | ● | | | | | | | |

● = osa se na uzlu aktivně tvrdí. Prázdno = neaplikuje se / pokryto jinde. `OB` běží **průřezově** všude (logger hook).
