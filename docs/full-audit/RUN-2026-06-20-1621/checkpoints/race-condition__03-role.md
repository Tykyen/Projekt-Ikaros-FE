# race-condition / 03-role — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Auditor: agent (read-only, HEAD).

## Pokrytí

Prošel jsem veškerý kód oblasti 03-role:

- `worlds.service.ts` — `updateMemberRole` (L1240–1310), `leave` (L1647–1697), `transferOwnership` (L1818–1912), `approveAccessRequest` (L713–800), `approveAccessRequestSequentialFallback` (L807–831), `rejectAccessRequest` (L837–866), `requestAccess` (L629–672), `joinPublic` (L573–622)
- `world-membership.repository.ts` — `updateRoleIfChanged` (L167–182), `delete` v `base-mongo.repository.ts` (L37–41)
- `world-membership.schema.ts` — unique indexy `{userId,worldId}`
- `world-access-request.schema.ts` — unique index `{worldId,userId}`
- `test/race/roles.race.e2e-spec.ts` — RC-R1, RC-R2, RC-R3, RC-R4 testy
- Registr `race-condition-audit.md` — RC-R1 až RC-R5

## Dosažená L vs cílová L

| ID | Stav v registru | Ověřeno kódem HEAD | Dosažená L |
|----|-----------------|-------------------|------------|
| RC-R1 | ✅ drží (owner immutable L1258) | ✅ kód sedí | L3 (deterministický test) |
| RC-R2 | ✅ opraveno (`updateRoleIfChanged` L1279) | ✅ kód sedí — atomic `{role:{$ne}}` + `{new:false}` | L4 (fix + bariéra zelená) |
| RC-R3 | ✅ opraveno (re-check po zápisu ownerId L1886) | ✅ kód sedí — rollback + 400 | L4 (fix + gate zelená) |
| RC-R4 | ✅ drží (unique index + E11000 handling) | ✅ kód sedí | L3 (deterministický test) |
| RC-R5 | ✅ pravděpodobně (analýza, role fresh per-request) | ✅ každý handler volá `findByUserAndWorld` na začátku | L2 (analýza, netestováno) |

Cílová L = L3 (bariéra/gate). Nové nálezy níže jsou L1 (hypotéza) a L2 (analýza).

## Nálezy

### ♻️ Potvrzené z registru (vše ✅, sedí na kódu HEAD)

Všechny RC-R1..R5 jsou v kódu skutečně implementovány tak, jak registr tvrdí.
Žádná discrepance mezi registrem a HEAD.

---

### 🆕 Nové nálezy (přes registr)

**RC-RUN-01 — [CD] `leave()` double-decrement: `playerCount` podteče při souběžném double-leave/kick hráče**
- Kde: `worlds.service.ts:1685–1688`
- Popis: `leave()` nejdříve čte membership `findById` (L1651), pak volá `membershipRepo.delete(membershipId)` (L1685) — **návratová hodnota bool je ignorována** — a poté na základě `membership.role` z předchozího readu podmíněně decrementuje `playerCount` (L1687–1688). Dva souběžné requesty (double-self-leave, nebo PJ kick + self-leave ve stejný moment) oba projdou initial `findById` guard, oba provedou `delete` (druhý vrátí false, ale nikdo to nekontroluje), oba najdou `membership.role === WorldRole.Hrac`, oba volají `worldsRepo.increment(..., -1)` → `playerCount -= 2` místo -1. Vzor identický s RC-R2 před fixem — tam šlo o `wasPlayer` ze zastaralého readu; zde jde o `membership.role` z readu PŘED delete.
- Dopad: `playerCount` podteče (může být záporný). Stejná třída CD jako RC-R2, ale v cestě `leave`. Méně pravděpodobný souběh než RC-R2, ale technicky reprodukovatelný Barrier/Gate testem.
- Návrh: analogicky RC-R2 fix — změnit `delete` tak, aby vracel předchozí dokument (nebo použít atomický `findOneAndDelete`), a decrement provést JEN pokud dokument byl skutečně smazán a měl roli Hrac. Alternativně zkontrolovat návratový bool: `const deleted = await this.membershipRepo.delete(membershipId); if (!deleted) throw new NotFoundException(...)` — druhý concurrent request dostane 404 a neproceduje k decrement.
- L1 (hypotéza, bez testu)
- 🆕

**RC-RUN-02 — [DP] `joinPublic()` double-join → 500 místo 409 při souběžném vstupu**
- Kde: `worlds.service.ts:592–618`, `base-mongo.repository.ts:18–22`
- Popis: `joinPublic()` dělá check-then-act: `findByUserAndWorld` (L592) → `membershipRepo.save` (L612). Dva souběžné requesty oba najdou `existing = null`, oba zavolají `save`. Druhý `save` narazí na unique index `{userId,worldId}` (world-membership.schema.ts:85) a MongoDB vyhodí E11000. Základní `BaseMongoRepository.save` (base-mongo.repository.ts:18–22) E11000 **nechytá** → propaguje jako 500 Internal Server Error. Srovnej: `accessRequestRepo.create` E11000 explicitně chytá a vrací 409 (world-access-request.repository.ts:79–88); `approveAccessRequest` E11000 chytá a fetchuje existing (worlds.service.ts:762–773). `joinPublic` tuto ochranu postrádá.
- Dopad: double-join veřejného světa → druhý request dostane 500 (nepěkný UX + Sentry noise). Membership nevznikne duplicitně (unique index to zabrání), ale chyba není client-friendly.
- Návrh: v `joinPublic()` obalit `membershipRepo.save` try/catch na E11000 → vrátit existing membership nebo vyhodit 409 ConflictException. Vzor: `approveAccessRequestSequentialFallback` (worlds.service.ts:807–831).
- L2 (analýza, bez testu; severity nízká — správnost dat je zachována, jen špatný HTTP kód)
- 🆕

**RC-RUN-03 — [AT] `transferOwnership` rollback není atomický — okno mezi `worldsRepo.update(ownerId=old)` a `membershipRepo.update(role=PJ)` pro starého vlastníka**
- Kde: `worlds.service.ts:1890–1899`
- Popis: Rollback v RC-R3 opravě (L1890–1899) dělá dvě operace: `worldsRepo.update(ownerId=old)` pak `membershipRepo.update(role=PJ)`. Mezi těmito dvěma zápisy existuje okno, kde `world.ownerId` ukazuje zpět na starého vlastníka, ale jeho role je stále `PomocnyPJ` (viz L1864–1868 — demote na PomocnyPJ proběhlo před zápisem ownerId). Pokud server spadne nebo request je přerušen v tomto mezikroku, svět má staré `ownerId` ale vlastník má roli PomocnyPJ — nikoliv PJ. Původní vlastník tak nemá PJ roli, přestože je znovu vlastníkem.
- Dopad: vzácný, vyžaduje crash v rollback okně. Svět má vlastníka s PomocnyPJ rolí — neblokuje správu (owner bypass lze dodat), ale je to nekonzistentní stav. Závažnost nízká.
- Návrh: rollback jako transakce nebo zajistit, že role starého vlastníka se změní zpět DŘÍVE než `ownerId` se vrátí (pořadí: role první, ownerId druhý). Nebo přidat post-podmínkový check `world.ownerId === requester.id ⟹ membership.role === PJ`.
- L1 (hypotéza, analytická)
- 🆕

## Analýza RC-R5 (SR — stale role)

RC-R5 je v registru jako "✅ pravděpodobně — analýza". Ověřeno HEAD: každý handler voláním `findByUserAndWorld` čte roli FRESH z DB — NE z JWT claims. Guard je per-request z DB. Typ SR selhání (demote + okamžité zneužití) má okno pouze v rámci jediného HTTP requestu mezi `findByUserAndWorld` (čtení role) a samotnou akcí — Node.js single-thread, no await between those two → prakticky nereprodukovatelné. RC-R5 = ✅ drží, L2 analýza dostatečná.

## PROOF-REQUEST

**PROOF-REQUEST-01 (RC-RUN-01)**
Typ: L3 deterministická bariéra.
Co dokázat: Barrier(2) na `membershipRepo.delete` → dva souběžné `leave` Hráče → `playerCount` po závodě = `before - 1` (ne `before - 2`).
Kde: přidat test do `test/race/roles.race.e2e-spec.ts`.
Prerekvizita: přidat Hráče přes `addMember('leave-race', WorldRole.Hrac)`, změřit `playerCount` před a po závodě.
Blokátor: živá DB (replSet harness); existující harness stačí.

**PROOF-REQUEST-02 (RC-RUN-02)**
Typ: L3 deterministický `Promise.allSettled` (stress).
Co dokázat: dva souběžné `POST /api/worlds/:id/join` → oba vrátí 2xx nebo 409, žádný 500; `worldmemberships` count = 1.
Kde: přidat test do `test/race/roles.race.e2e-spec.ts` nebo nový spec.
Blokátor: potřeba svět s `accessMode:'public'` v seedu.
