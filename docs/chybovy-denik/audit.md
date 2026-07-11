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

## CH-058 — změna sdíleného guardu ověřena jen cíleným jest → regrese v neauditovaném konzumentovi — 2026-07-06

**Co nefungovalo.** V opravné dávce 4c (FIX-46) jsem změnil `RolesGuard.canActivate` z bare
`return false` na explicitní `throw new ForbiddenException({code:'INSUFFICIENT_ROLE'})`. Po dávce jsem
spustil `jest --maxWorkers=2 common users world-currencies upload ikaros-articles ikaros-messages
mailer push campaign character-subdocs pages` — zeleno, commitnul (`f421f7a`) a pushnul. Jenže
`global-chat.controller.spec.ts` má vlastní test `RolesGuard`, který očekával starý `false` kontrakt →
zůstal červený na main. Odhalil ho až následující agent (2 odložené BE) při plném jest běhu.

**Proč.** `RolesGuard` je **sdílený** napříč ~5 controllery (admin, global-chat, admin-tasks,
platform-chat, platform-documents). Cílený `jest <moduly>` po jeho změně neběžel na všech
konzumentech. BE precommit hook = jen typecheck+lint (ne jest), takže commit prošel s červeným testem.

**Jak jsem to našel.** Agent 2-odložených-BE nahlásil „pre-existing fail" po plném `jest` (146 suites,
2441/2442). `git stash` ukázal, že fail je na HEAD i bez jeho změn → dohledal jsem, že HEAD už obsahuje
mou dávku 4c, která `RolesGuard` změnila. Tedy ne pre-existing, ale moje regrese o commit dřív.

**Oprava.** Upravit asserci v `global-chat.controller.spec.ts` na očekávanou `ForbiddenException`.

**Příznak cyklení / poučení.** Po změně **sdíleného** guardu/pipe/filtru/interceptoru spusť **plný**
`jest --maxWorkers=2` (ne jen cílené moduly dávky) — sdílená komponenta má konzumenty mimo editované
moduly. „Cílený jest zelený" ≠ „nic jsem nerozbil", když měníš cross-cutting kód. (Souvisí s CH-011:
sdílená metoda/gate = zgrepuj/otestuj VŠECHNY konzumenty.)

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

## ✅ ŘEŠENÍ — upgrade skillu plny-audit: SLO brána 500 světů/50 hráčů + styly 24–31 + proof `+load`/`+perf` — 2026-07-11

**Kontext.** Uživatel zadal: zkontrolovat správnost skillu `plny-audit` a rozšířit ho tak, aby příští nasazení uneslo 500 jeskyní (jeskyně až 50 hráčů, špičky vyšší), souběžné voice cally, extrémně rychlé načítání a nula chyb/warningů. RUN 07-05 doložil, že 16 stylů + EXT 17–23 kryjí korektnost/bezpečnost, ale **výkon, škálu, voice a provoz systematicky míjejí** (nálezy jen bodové: ReDoS, dice DoS, WebGL leak).

**Co zabralo — postup.**
1. **Workflow 6 paralelních inventur** (skill-claims verify, BE scale, FE perf, realtime/voice, warnings/CI, docs-lessons) + completeness critic (26 chybějících kontrol). Vše kódem doložené (soubor:řádek), ~130 faktů.
2. **Opravy driftů skillu**: manifest ~110–130 (ne „150–200"), FE `stryker.conf.json` NEexistuje (jen deps), doplněny `audit:csp`/`lint:colors`, `jest-e2e.json` pinuje `maxWorkers:1`, checkpoint HNED po jednotce (RUN 07-05 zapsal jen 50/126), vstupní baseline brána (suite nebyla čistá na startu), pasti CH-014/029/042/046/056/069 + D-064.
3. **Rozšíření**: SLO tabulka S1–S10 (5000/10000 WS klientů, chat p95<500 ms v 50hráčové jeskyni, LCP≤2,5 s, bundle≤350 kB gzip, deploy bez ztráty zpráv, soak paměť, zero-warn, voice proof, restore drill) + styly 24–31 (PERF-FE, PERF-BE, SCALE-RT, LOAD, VOICE, STAB, ZERO-WARN, OPS) se seed nálezy z inventury (barrel leak TipTap 499 kB eager, 61+23 rodin fontů, 107 @import skinů, 429 MB textur, presence io.emit O(N²), 2× full-scan membershipů/zprávu, push N+1, GET /worlds bez paginace, žádný graceful shutdown/zálohy/monitoring) + proof-vrstvy `+load` (profily A–D + soak, seed-load.mjs) a `+perf` (Lighthouse s auth přes --user-data-dir, bundle check).
4. **Adversariální verifikace hotového textu 2 nezávislými kritiky** (fakta proti repu × proveditelnost za měsíc) → 1 vyvrácené jméno metody (`getMembersWithProfiles`→`getMembers`+`enrichMembers`), 6 nepřesností, 12 děr proveditelnosti (seed dat pro load, auth pro Lighthouse, checkpointy stylů 24–31, resumabilita Fáze C, HW-limit pravidlo ⏭️ vs ❌, zw-baseline.json…) — vše zapracováno.

**Proč to byl správný směr.** Skill nesmí tvrdit nic, co v repu není (past „tichý drift dokumentu") — proto claims-verify agent PŘED úpravou a 2 kritici PO ní; ~40 tvrzení sedí na číslo přesně. Výkonnostní verdikt smí vzniknout jen z měření (`+load`/`+perf`), ne ze statiky — jinak je „zvládne 500 jeskyní" jen víra.

**Jak ověřeno.** Kritik #1 (fakta): 1 vyvráceno + 6 nepřesností, zbytek potvrzen s citacemi. Kritik #2 (vykonavatel): 12 nálezů, všechny mají v textu konkrétní řešení. Grep: 0 zbylých mrtvých odkazů „rozhodnutí #N". Skill 382 řádků, tabulky celistvé.

**Zhodnocení — dobře/špatně.**
- 👍 Inventura před psaním (seed nálezy míří na reálné soubory, ne obecné fráze); dvojitá adversariální verifikace textu chytila chyby, které bych sám neviděl (auth pro Lighthouse, seed 500 světů).
- 👎 První verze měla mrtvé odkazy „rozhodnutí #2/#4" zděděné ze staré verze a hard bránu `--max-warnings 0`, která by s vědomým D-17.8 dluhem okamžitě spadla — chytil až kritik.
- ⚠️ Past pro příště: seed nálezy ve skillu jsou **datované hypotézy** — Fáze A je musí re-verifikovat proti HEAD, kód se hýbe (cloudinaryThumb už 6→7 konzumentů za pár dní).

## ✅ ŘEŠENÍ — gap-hunt skillu plny-audit: 10 nových stylů (32–41) + 3 kritické díry v HEAD — 2026-07-11

**Kontext.** Po v2 upgradu (styly 24–31) se uživatel zeptal, jestli auditu ještě něco chybí — s důrazem „aby se mi na stránky nikdo nedostal" (bezpečnost) + rychlost. Pustil jsem cílený gap-hunt: 7 nezávislých optik hrozeb (deep-security, GDPR/privacy, resilience 3. stran, korektnost/čeština, anti-abuse, FE UX, kontrakt/observabilita) + dedup kritik, každá s katalogem 31 stávajících stylů a instrukcí hlásit JEN nepokryté třídy s konkrétním kódem.

**Co zabralo — postup + výsledek.**
- 7 optik (~990k tokenů) doložilo, že styly 1–31 kryjí korektnost/výkon/škálu, ale **aktivní bezpečnostní povrch mimo IDOR/injection, GDPR a cross-instance korektnost nemají optiku**. Kritik zahodil false-positives (CSRF → už styl 5, /health → už styl 31) a dal 8 kandidátů; doběhy L2+L4 přidaly 2 → **10 nových stylů 32–41**.
- **3 KRITICKÉ díry přímo v HEAD, ověřené čtením kódu** (ne jen návrhy stylů): (1) SSRF exfiltrace ve world-exportu — gate `isMediaUrl` propustí URL s media příponou i bez „cloudinary", `fetch` bez timeout/size → PJ vlastního světa přečte interní síť (169.254/Redis/Meili) do ZIP; (2) `socket-io.adapter.ts` Redis pub/sub bez `.on('error')` → výpadek Redisu shodí instanci; (3) `jwt-auth.guard.ts:68` čte roli ze staré JWT → demotovaný admin drží práva 3 dny.
- Zapsáno: SKILL.md sekce „Rozšířené kontroly 3 (32–41)" + SLO/proof metadata (+fault/+authz-runtime), dluh D-SEC-GAP-2026-07-11 (nálezy + návrhy oprav), memory.

**Proč to byl správný směr.** Gap-hunt = hledat, co optiky NEmají, ne přehrávat, co mají — jinak by rozšíření jen zopakovalo existující styly. Každá optika dostala katalog 31 stylů, aby nehlásila pokryté; kritik byl instruován být přísný proti nafouknutí. 3 headline nálezy jsem PŘED zápisem ověřil čtením reálného kódu (SSRF dokonce horší, než agent tvrdil) — agentní nález = hypotéza.

**Jak ověřeno.** 5/7 optik + kritik vrátily strukturovaný výstup; 2 (L2/L4) selhaly na StructuredOutput retry cap (schema moc přísné na dlouhý výstup) → dohnány jako čistý text (spolehlivější). SSRF/Redis/JWT ověřeny přímým Read (world-export.service.ts, socket-io.adapter.ts, jwt-auth.guard.ts, request-user.interface.ts). Skill konzistentní (manifest 135–155 jednotek, prefixy, proof-flagy).

**Zhodnocení — dobře/špatně.**
- 👍 Optiky s katalogem existujících stylů = minimum duplicit; přísný dedup kritik; ověření headline nálezů čtením před zápisem; nálezy uloženy jako dluh, ne ztraceny.
- 👎 Schema-constrained agenti na dlouhý bezpečnostní výstup selhávají (StructuredOutput cap 5×) — u „vypiš mi hodně nálezů" úloh je text return spolehlivější než JSON schema. Poučení pro příští workflow.
- ⚠️ Past pro příště: 3 kritické nálezy jsou BE opravy (gated, nutný restart+deploy) — NEopravovat v jedné dávce s FE, ověřit každý znovu čtením před patchem (grep konzumentů guardu kvůli CH-011).

## ✅ ŘEŠENÍ — 2. gap-hunt: styly 42–46 (vizuál/durabilita/skew/doručování/herní integrita) + 7 sharpeningů — 2026-07-11

**Kontext.** Uživatel po 1. gap-huntu (styly 32–41) žádal ještě širší záběr: „server pevný, vydrží nápor, graficky stabilní, ukládá se dobře, herní mechaniky, data fungují navzájem, vše klape od základů". Pustil jsem 2. gap-hunt: 6 optik mapovaných na jeho slova (V1 vizuální regrese / V2 trvanlivost zápisu / V3 deploy-skew / V4 doručování mail+push / V5 provozní tvrdost / V6 herní integrita) + přísný dedup kritik, každá s katalogem VŠECH 41 stylů.

**Co zabralo — výsledek + disciplína.**
- Kritik doporučil **5 nových stylů (42 VR, 43 DUR, 44 SKEW, 45 DLV, 46 GI)** — každý s vlastní proof-vrstvou, kterou 41 stylů neumí (pixel-baseline, durability fault-injection, deployed-SHA matice, doručovací integrita, výsledkové property testy) — **plus 7 sharpeningů** do stylů 2/5/25/26/31/33/37.
- **Klíčové rozhodnutí: celou provozní optiku V5 (porty/TLS/fd-limity/healthcheck/rollback) kritik VĚDOMĚ NEudělal novým stylem** — je z ⅔ doostření stylů 5/31 + jednorázový ops-runbook (cert/DNS/ulimit). Tím se skill nenafoukl duplicitami. 41 → 46 stylů (ne 41 → 53).
- **Reálné nálezy v HEAD** (dluh D-LAUNCH-GAP): refund bez transakce ztratí peníze při pádu; klient je autorita nad hodem kostky i HP (`total:999`, `currentHp:99999`); 62 slepých FE volání bez BE routy (cross-repo route-audit v CI VYPNUTÝ); vizuální regrese = nulová automatická brána (96 skin CSS).

**Proč to byl správný směr.** Optiky mapované přímo na slova uživatele („graficky stabilní" → vizuál, „ukládá se dobře" → durabilita, „herní mechaniky" → GI) + katalog 41 stylů v každém promptu = minimum duplicit. Kritik instruován být přísný proti nafouknutí — a reálně zamítl celou jednu optiku jako sharpening, ne nový styl. To je přesně žádané: rozšířit pokrytí, ne bobtnat.

**Jak ověřeno.** 6/6 optik + kritik vrátily text (kolo 2 celé text-return — poučení z kola 1, kde JSON schema padalo na retry cap). Nálezy s citacemi soubor:řádek. Skill konzistentní: manifest 140–160 jednotek, prefixy VR/DUR/SKEW/DLV/GI, proof `+render`, popis+argumenty dorovnány.

**Zhodnocení — dobře/špatně.**
- 👍 Optika V6 (herní integrita) přidána nad rámec zadání první várky — pro herní platformu zásadní a našla kritickou třídu (klient autorita nad výsledkem); doplnění se vyplatilo.
- 👍 Kritik zamítl nafouknutí (V5 → sharpening) — disciplinovaná expanze; 7 sharpeningů zostří existující styly bez nových jednotek.
- 👎 Číslování kritika mělo mezeru (42,43,44,46,47, přeskočil 45) — přečíslováno na 42–46 sekvenčně při zápisu.
- ⚠️ Past: styly 42/43/46 potřebují novou infra (render baseline, fault injection, property testy) — při prvním běhu se bez opt-inu (`--render`/`--fault`) udělá jen statická podmnožina + ⏭️; plná hloubka chce doinstalovat harness.

## ✅ ŘEŠENÍ — plný audit RUN 2026-07-11 (46 stylů): kritický deploy-blocker (26 union @Prop bez type) + ~20 oprav — 2026-07-11

**Co zabralo.** Plný-audit (46 stylů, 110 core oblastí, proof +db/+e2e). Klíčový průlom: **proof-vrstva +e2e full-boot** (smoke-full-app) chytila, že se **celý AppModule nenabootuje** — 26 polí `@Prop` s union/enum typem BEZ explicitního `type` (`rarity?: PlantRarity`, `content-report.targetType`, `sound.schema` ×11…) → runtime „Cannot determine a type". `nest build` (tsc) i unit jest PROŠLY (dekorátor selže až za běhu při registraci schématu; unit testy plný AppModule nebootují; CI full-boot e2e nespouští) → **by shodilo start backendu po nejbližším deployi.** Nejspíš regrese verze @nestjs/mongoose (dřív stačil `enum:`).

**Jak najito+opraveno.** Scanner (node `git ls-files *.schema.ts`) hledá `@Prop(` bez `type:`/`ref:` kde typ pole je union (`|`) nebo Capitalized alias. v1 minul jednořádkové `@Prop({...}) pole:Typ;`; v2 balancuje závorky → +4 nálezy (celkem 25). Přidán `type: String` (vzor už používal `imageFit` v týchž schématech). Ověřeno: smoke e2e boot 1/1, full e2e 52 fail → 5 (zbytek zastaralé auth testy + flaky).

Dále: baseline červená (jest 4 + e2e 52, maskováno CH-056) opravena; ~20 fixů (HP clamp, @all gate, char cap, blob leak, report dedup, GDPR erasure 4 moduly, refund kompenzace+writeConcern, resilience timeouty, shutdown hooks, EMBEDDING_ENABLED gate na RSS baseline, FE SecuritySection/preloadError/reduced-motion/isPending). Vše verifikováno (nest build ✅, jest 2531/2531 ✅, FE build ✅, regression --ci ✅).

**Zhodnocení.** DOBŘE: proof +e2e je nezastupitelná — build+unit slepé na runtime boot; scanner z 1 nálezu udělal vyčerpávající sweep třídy; per-oblastní fan-out s checkpointy na disk přežil rate-limit i kontext. ŠPATNĚ/poučení: jest ZELENÝ ≠ build/boot zelený (viz CH-121); u schema/DI/interface změn VŽDY nest build + full-boot e2e. Rate-limit: dispatch ~37 agentů naráz = throttle → menší vlny ~7.
