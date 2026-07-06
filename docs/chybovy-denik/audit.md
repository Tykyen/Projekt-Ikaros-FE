# Chybový deník — oblast: plný audit / kvalita

## ✅ ŘEŠENÍ — plný audit RUN-2026-07-05 (28 oprav nasazeno) — 2026-07-06

**Co zabralo.** Noční `plny-audit` na HEAD (FE 213d05f3 / BE fadecaec). Fáze B = 3 vlny agentů
(1 agent = 1 oblast, sonnet), přičemž **agenti oblastí si sami udělali pod-fan-out** (1 oblast →
až 5 pod-agentů přes background) — pokrytí se tím dramaticky prohloubilo, nechal jsem je. ~130
nálezů napříč všemi 110 oblastmi + 7 rozšířených stylů (a11y/secret/dep/type/bundle/injection/dead).

**Opravy = 3 dávky, delegované implementaci mechanicky dle přesné spec, git dělám sám.** BE dávka 1
(7 bezpečnostních) a dávka 2 (21 IDOR/leaky/funkční) → **ověřeno tsc+lint+jest, commit+push na main**
(`eca83da`, `13d7d32`). FE dávka 3 (30 souborů) → ověřeno, **necommit** (uživatel commituje FE ručně).

**Proč správně.** Nejvíc kritických děr bylo **cross-cutting vzor**, ne izolovaný nález: WS
`room:join user:` gate chyběl → odposlech cizích DM; **stejný IDOR vzor** napříč campaign (20 metod)/
maps/characters; **stejný leak vzor** napříč articles/gallery/discussions favorites; elevation drift
v ~20 FE komponentách. Oprava = najít vzor a projet všechny výskyty (agent doložil sesterský správný
vzor u každého). Ke každé opravě pojistka G≥2 (kód + srovnání se sesterským vzorem + zelené testy).

**Jak ověřeno.** Každá dávka: `npx tsc --noEmit` + `npm run lint:check` + cílené `jest --maxWorkers=2` /
`vitest --project '!storybook'`; BE precommit hook (typecheck+lint) při commitu; META brána
`audit:regression --ci` = EXIT 0 (žádná regrese, každý opravený důležitý nález má G≥2). Agenti dopsali
i regresní testy pro dříve nekryté cesty (campaign IDOR, maps, transfer).

**Zhodnocení — dobře:** delegování mechanické implementace dle přesné spec šetřilo kontext a nebylo
míchání BE+FE (BE agenti sériově, pak FE); commit až po ověření (ne slepě); riskantní BE (soft-delete
world guard, elevation governance, reserved-slug) vědomě ODLOŽENO na ráno místo nočního rizika.
**Špatně / pozor:** BE e2e 73/134 fail = jen infra (lokální Mongo standalone ne replSet) — málem
vypadalo jako 73 regresí; nutno číst PŘÍČINU, ne počet. FIX-7 push hijack řeší přes duplicate-key
(500 místo 4xx) — funkční, ale ne elegantní. Necommitnutý FE balík (30 souborů) je velký na revizi —
příště zvážit menší commity/dávky i u necommitovaného FE.

## CH-011 — gate v service volané i interně → 403 regrese chat kanálů — 2026-06-20

**Co nefungovalo.** R-RUN-02 fix: přidal jsem world-gate (`accessMode` member-only)
přímo do `CharactersService.getDirectory()`. Rozbilo to e2e `seed-scenario-isolation`
test „chat: člen vidí kanál B" — PJ (člen!) dostával **403** na `GET /worlds/:id/chat/groups`.

**Proč.** `getDirectory()` má **dva konzumenty**: (a) HTTP controller (s user kontextem),
(b) `chat.service.getGroupsWithChannels()` ho volá **interně** pro enrich postav —
`charactersService.getDirectory(worldId)` BEZ user. Můj gate → privátní svět + žádný
user → `ForbiddenException` → celé `getGroupsWithChannels` spadlo na 403. Brána ve
service volané i interně = past.

**Jak jsem to našel.** Bisekce přes `git stash push <soubory>` + e2e běh: vyloučil jsem
postupně skupiny (ne-moje soubory → presence → worlds skupina → characters → service vs
controller → neutralizace gate-body). Pak `grep getDirectory src/` odhalil interní volání
v `chat.service.ts:279`. Klíč: **bisekce stash+e2e** + grep všech konzumentů metody.

**Oprava.** Gate vytažen do samostatné `assertCanViewDirectory()` volané JEN z HTTP
controlleru; `getDirectory()` zůstává bez brány (interní enrich projde). e2e 21/21 zelené.

**Příznak cyklení / poučení.** Nevolaná metoda „nemůže" rozbít jiný test → ŠPATNÝ předpoklad;
metoda BYLA volaná interně. **Před přidáním guardu do service metody zgrepuj VŠECHNY její
konzumenty** (ne jen HTTP controller). Gate patří na HTTP vrstvu, ne do sdílené service.

## ✅ ŘEŠENÍ — plný audit RUN-2026-06-20-1621 (16 stylů × 103 oblastí) + 6 oprav — 2026-06-20

**Co zabralo.** Skill `plny-audit` puštěn „od začátku" na HEAD (FE 96460577 / BE fb0f8b0).
Fáze B = vyčerpávající fan-out **1 agent = 1 oblast** ve vlnách po ~8–13 (sonnet), každý agent
read-only + zapsal checkpoint do `docs/full-audit/RUN-2026-06-20-1621/checkpoints/` (103/103) a
vrátil jen TL;DR → orchestrátorův kontext zůstal lehký. Proof: e2e seed-scenario + race (26/26) ✅,
META brána (`audit:regression --ci`) 0 regresí ✅. Záchyt ~14 🔴 / ~75 🟠 / ~260 🟡.

**Proč to byl správný směr.**
- Fan-out s checkpointy = paralelizace bez zahlcení kontextu (skill to přímo předepisuje).
- **Verifikace KAŽDÉHO agentního nálezu čtením kódu PŘED opravou** — chytila false-positive:
  agent tvrdil „banUser nerevokuje refresh tokeny → zabanovaný refreshuje 30 d", ale
  `admin.service.banUser` **revokuje** (`refreshTokenRepo.revokeAllForUser`). Kdybych opravoval
  naslepo dle agentních TL;DR, přidal bych zbytečný kód a falešně hlásil 🔴 fix.
- Opravil jsem jen **bezpečné izolované** nálezy s regresním testem (XSS customData, addPost authz,
  admin permission, daysInMonth crash, search `?q=`, hasPendingDeletion). Architektonické/OPS/+db
  (reconnectSocket, WS leak-safe, WorldHardDelete blob, RC-D7, Tyky, TOTP_ENC_KEY, DI-*) jsem
  NEopravoval — gated na uživatele (base.md: neopravuj tiše riskantní).

**Jak ověřeno.** BE typecheck ✅ + jest discussions/pages 125 + admin 37; FE eslint + build (tsc-b+vite)
+ vitest calendarEngine 17. Vše working tree, NEcommitnuto (git na uživateli).

**Zhodnocení — dobře/špatně.**
- 👍 Dobře: fan-out tempo, checkpoint resumabilita, verifikace před opravou, oddělení A (sám) / B (gated).
- 👎 Drobně špatně: jednou jsem `cp` přepsal skutečný jest e2e výstup vlastním echem (ztráta počtu
  testů, ne výsledku — exit byl 0). Poučení: NEpřepisovat soubor, do kterého už směřoval běh.
- ⚠️ Past pro příště: **agentní TL;DR = hypotéza, ne fakt.** Sonnet auditoři občas přehlédnou
  protistranu (revokace, existující guard). Vždy dočíst dotčený kód, než se sáhne na opravu.

## ✅ ŘEŠENÍ — audit přístupových práv (26 agentů) + 6 ověřených oprav (IDOR + počítadlo + orchestrace) — 2026-07-05

**Kontext.** Uživatel hlásil 3 pozorování z živé appky: admin „Celkem světů: 2" (ač světů víc), owner světa nevidí panel Orchestrace na taktické mapě, a viditelnost světů ve Vesmírech. Rozpletl jsem to na **3 nezávislé kořeny** a rozšířil na plný audit práv (Workflow, 26 agentů, 63 controllerů, adversariální verifikace nálezů).

**Co zabralo — 3 kořeny + 6 oprav.**
1. **`worldsRepo.findAll()` je DISCOVERY filtr** (`isActive:true` + `accessMode ∈ {public,open}`), MISUSE na 2 místech: admin počítadlo (`admin-stats.service`) a startup dice/theme backfill (`worlds.service.onApplicationBootstrap`) → podpočet a přeskočení private/closed světů. Fix = nové repo metody `countAll()` + `findAllUnfiltered()` (`{deletedAt:null}`); admin i backfill přepojeny.
2. **Orchestrace = owner-bypass drift.** `TacticalMapView.isPJ` i `WorldMembershipGuard` se opíraly JEN o `membership.role`, kdežto `WorldLayout`/`WorldContext.isPJ` mají owner-bypass (`world.ownerId === currentUser.id`). Owner, jehož membership dočasně chybí/nedoteklo, tak ztratil PJ nástroje na mapě, i když nav ho bral jako PJ. + `matrix-world.seed` zakládal svět **bez** owner membershipu. Fix = owner-bypass do isPJ+guardu + idempotentní `ensureOwnerMembership` v seedu (backfill i pro už seedované).
3. **HIGH IDOR batch** (cross-tenant, kdokoli přihlášený i nečlen private světa): `GET characters/by-user` (celý deník cizí postavy), `GET pages/data` (obchází world+AKJ gate), `GET bestiae?worldId=` (bestiář cizího světa), články přes „oblíbené" (Draft/Pending). Fix = membership/status brány **kopírující existující vzory** (`findBySlug` redakce, `assertCanViewWorld`+per-page `assertAccess`, `assertCanReadWorld` extrahovaný z `assertCanRead`, status filtr).

**Proč to byl správný směr.**
- **Každý agentní nález ověřen čtením reálného kódu PŘED patchem**: potvrzena redakce `toPublicView` (strhává diaryData), ověřeno že tightěné endpointy nemají FE konzumenty (bezpečné zpřísnění), a **chycen pre-existující rozbitý bestiae spec** (chyběl DI provider `EntitySchemaVersionsService` — padalo 7/7, opraveno mimochodem).
- Fixy **reuse existujících bran** — žádný nový bezpečnostní model, jen doplnění chybějícího volání; každý fix nese regresní test.

**Jak ověřeno.** BE typecheck 0 + jest per modul (characters 34, pages 52, bestiae 7, articles 33, admin-stats/worlds 140), eslint 0. FE `tsc -b` 0 + eslint 0. ⚠️ **Nutný BE restart** (nový bundle + Matrix seed backfill při startu) **+ FE deploy**.

**Zhodnocení — dobře/špatně.**
- 👍 Rozplétání 3 symptomů na 3 kořeny místo jedné hypotézy; adversariální workflow; verifikace čtením před patchem; oprava pre-existujícího rozbitého specu; fixy jako mirror existujících vzorů (nízké riziko).
- 👎 Chybná mezidiagnóza orchestrace — viz [CH-057](proces.md#ch-057) („de-elevovaný admin, nahoď se", než uživatel upřesnil, že jde o majitele).
- ⚠️ Zbývá (gated): MEDIUM leaky (universe, world-news/:id, atlas map, pages/directory, characters roster+players), PLAUSIBLE doověření, Vesmíry model #3 (změna modelu → spec), `create()` atomicita (transakce).
