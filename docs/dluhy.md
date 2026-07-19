# Technické dluhy

> Soubor obsahuje **pouze otevřené a odložené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k **2026-07-19**. Vyřešené se **mažou** (historie v git logu + chybový deník ✅ ŘEŠENÍ): 16. 7. D-064/D-065/D-067; 17. 7. undo `scene.image`, `npm audit` kritické, `chatSkin` gate (rozhodnuto: prémiové motivy nebudou), a **7 z 8 „🔴" v D-AUDIT** (byly opravené už od 12.–13. 7., jen to nikdo nezapsal — viz CH-081); 18. 7. **D-DATA-SYNC-ZBYTKY (a)** — legacy HTTP route `GET /characters/directory` + import `OptionalJwtAuthGuard` smazány (část b = herní sémantika HP mapování přesunuta do **Odložené** jako `D-HP-MAP-SYSTEMS`); 19. 7. **D-DROBNE-2026-07-13** rozpuštěno — DrdPlus injury strop 3×mez zavřen jako **kosmetika/WONTFIX** (ověřeno proti HEAD: TM panel `DrdPlusBestiePanel:125` už deltu posílá; „bonus" chat nález je slepý — chat bestie = **combatant**, nemá `injuryDelta` cestu vůbec, celý `systemStats` patch je last-write-wins jako u všech combatant editů → sladění jen injury neúměrné, zásahy se navíc neztrácejí), HP-deník lost-update přesunut do **Odložené** jako `D-DIARY-HP-DELTA`; 19. 7. **D-SEC-GAP-2026-07-11 rozpuštěn** (byl to sběrný kontejner na 7 nesouvisejících položek, nešel řešit jako celek) → **Account-enumeration odepsán** (`{available}` prozrazuje existenci účtu **by design**, throttle 10/min je jediná možná mitigace a je nasazen — nic k udělání), **Erasure obsahu zpráv** sloučeno pod trigger [[D-063]] (advokát/spolek), zbytek rozštěpen na samostatné dluhy: `D-SENTRY-DSN` (Otevřené, akce uživatele), `D-NAMESORT` (Otevřené BE), `D-FE-ERROR-STATES` (Otevřené FE), `D-ECON-FLOAT-MIGRACE` + `D-MEILI-CZ` (Odložené); 19. 7. **D-NAMESORT vyřešen** — fold řadicí klíč (`common/utils/name-sort.ts`: `foldSortKey` + `sortKeyPlugin`) do 8 katalogů (7× `nameSort` z `name`, riddles `questionSort` z `question`), index, 9 sort-sitů přepnuto, backfill `scripts/backfill-name-sort/` (dry-run default); users VYNECHÁN dle výstrahy. Deploy: spustit backfill `--apply` + po každém native-driver seedu znovu (hook jim nefires); 19. 7. **D-FE-ERROR-STATES vyřešen a smazán** — „prázdno/defaulty místo chyby" napříč FE (~44 souborů): 4× tichá ztráta dat (WorldHeadlineAdminPage/WorldEntitySchemaEditorPage/ArticleEditorPage editor nad defaulty → Uložit přepíše DB; GroupMembersPage emblem spread nad `groupImages ?? {}`) + falešná nepřítomnost (TotpCard „2FA vypnuto", WorldMembersPage, InvitePanel, ~11 listů, 3 pickery) + ~19 komunitních katalogů plain `<p>`→`ErrorState`+retry; klíč = guard `isError && !data` (cache přežije background-refetch blip). Combat panely ověřeny bezpečné (`if(!diary)` chytá chybu), `placeholderData:[]` → jen `isError` chytá; `SecuritySection` = WONTFIX (BE duplicitu odmítne). tsc+eslint+55 dotčených speců ✓ (chybový deník ✅ ŘEŠENÍ 19. 7.); 19. 7. **D-LAUNCH-GAP-2026-07-11 rozpuštěn** (sběrný launch-hardening kontejner, nešel jako celek — 3 ze 4 částí blokované): **chromatik vyřešen** — mrtvý `@chromatic-com/storybook` smazán z `package.json`+`.storybook/main.ts` (žádný CLI/token/workflow nikdy neexistoval) → zmizel kořen ESM/CJS race „D-033" na Node 24 (`npm i` −9 balíčků; build+lint+vitest ✓); axe zůstává `todo` (flip → no-op bez storybook testů v CI + vizuální brána se rozhodnutím nestaví); **OPS hardening** = není FE code-dluh, vlastní `docs/ops-runbook.md` (BE repo) → z FE dluhů odstraněno (neduplikovat — viz db-integrity drift); **SMTP async bounce** odepsán **WONTFIX** (přes free Gmail SMTP fakticky nejde; async detekce chce placenou transakční službu s webhooky — revidovat při přechodu na Resend/Postmark/SES); **širší e2e** = přijatý baseline (1 smoke v CI stačí pro pre-launch hobby fázi; plná sada = roadmap, ne dluh).
>
> ⚠️ **Než něco z tohoto souboru začneš řešit, ověř to proti HEAD.** Dnešek (CH-079→CH-081) ukázal, že popisy dluhů systematicky **podceňují i nadceňují** rozsah a že položky mohou být dávno hotové. Report z auditu je snímek v čase, ne stav; **zdroj pravdy je kód**.

---

## Otevřené

### D-063 — Identita správce (spolek) + zpracovatelé nedoplněni na legal stránkách (20A)
**Soubor:** `src/features/ikaros/pages/PrivacyPage.tsx:35-200`, `ContactPage.tsx:27-52` — placeholdery `[DOPLNIT: …]`
**Problém:** Zásady OÚ (`/soukromi`), Kontakt (`/kontakt`) a Podmínky nemají doplněnou totožnost správce: chybí název spolku, IČO, sídlo, spisová značka + soud spolkového rejstříku a kontaktní/provozní e-mail (pro uživatele i orgány). Navíc seznam zpracovatelů v Zásadách OÚ má u části služeb (hosting, SMTP, AI/LLM, error tracking, platební brána) nepotvrzené konkrétní poskytovatele + jejich EU/třetí-země status a transfer mechanismus (DPF vs. SCC).
**Dopad:** Vysoký (blokuje **veřejné spuštění**) — GDPR čl. 13 vyžaduje totožnost správce, DSA čl. 11/12 kontaktní místa; bez nich nelze web pustit veřejně. NEblokuje implementaci ani beta.
**Řešení:** Až uživatel/advokát dodá údaje spolku, nahradit všechny `[DOPLNIT]` (grep `dopisat` / `DOPLNIT`), potvrdit seznam zpracovatelů a u každé US služby uvést DPF/SCC. Poté bumpnout verzi dokumentů.
**Kdy:** Před veřejným spuštěním (spolek se teprve zakládá). Součást Přílohy C (20.1–20.3). **Blokováno na vstupu uživatele/advokáta.**
**⤷ Sloučeno sem (stejný trigger):** plná **content-erasure zpráv** — dnes se při mazání účtu odstraní PII, ale **autorství + obsah zpráv zůstávají** (`users.repository.ts:266-300` drží `username/usernameLower/displayName`, tombstone `'Smazaný účet'` je jen zobrazovací vrstva v `users.service.ts:180`). ROZHODNUTO 2026-07-17 držet dnešní stav; plná content-erasure = právní rozhodnutí → otevře se **s advokátem u zakládání spolku**, stejný trigger jako výše.

---

### D-AUDIT-2026-07-11 — zbylé nálezy plného auditu (46 stylů)
> Stav **ověřený proti HEAD 17. 7.**, ne opsaný z reportu (ten je snímek k 11. 7. — viz CH-081). **Žádná 🔴 nezbyla.**

**🟠 Realtime / škála** (zbytek SCALE-RT po opravě 17. 7. — strukturální, chce diskuzi):
- **presence room-scoping** — `presence.gateway:107,153,157` `server.emit('presence:update')` jde **globálně všem** → O(N²) při N online. Mění, kdo koho vidí online → produktové.
- **Redis-backed presence** ([[D-NEW-chat-presence-scale]], D-051) — in-memory presence × více instancí BE.
- **connection cap per IP** — bez stropu; per-USER/IP napříč sockety chce Redis (per-socket bucket ne — socket je sticky).
- **`volatile.emit` na ephemeral** (typing/ping/ruler/presence) — drop místo bufferování pro pomalé klienty.

**🟠 Ostatní otevřené** (severity dle reportu — NEnafukovat na 🔴):
- **RC-E8** `removeFromInventory` full-sections `$set` → lost update souběžného nákupu. `campaign-purchase.removeFromInventory` (volají `refund` + kompenzace `purchaseSequentialFallback`) → `character-subdocs.updateInventory` → `inventoryRepo.update` (přepis celých sekcí). *(RC-E7 `changeCurrency` ✅ vyřešen 17. 7. povinným `expectedUpdatedAt` → 409 `ACCOUNT_CONFLICT`; E8 je tatáž třída, jiný uzel — chce stejný zámek nebo `$pull` místo přepisu sekcí.)* Severity 🟠 dle `race__01-ekonomika.md:16` (*„proto 🟠 ne 🔴"*). ⚠️ Nezaměňovat s `refund()`/`$inc` — ty atomické **jsou**.
- **DUN-1** systemStats validace přeskočena pro alias-systémy (drd-plus/coc) — sníženo 🔴→🟠 (report:84): PJ-scoped, hráč zápis nemá → ne exploit.
- **25 PERF-BE — zbytek po opravě 17. 7.** (`enrichMembers` N+1 ✅ vyřešen batch `publicProfilesByIds`): **`autoIndex` ON v prod** (155 index buildů/start) — ⚠️ vypnutí je jednořádkové, ale bez `syncIndexes` kroku v deploji by **nové indexy v produkci nikdy nevznikly** = tiše horší než dnešek; dnešní dopad je jen pomalejší start, ne díra → chce samostatnou dávku s deploy krokem. Dále: **N+1 `notifyUsers`/`getUnreadCounts`** (neověřeno do hloubky), **`GET /worlds+pages` bez limitu/projekce** (paginace = může být breaking pro FE). **`compression` NEPATŘÍ do kódu** — Caddy to udělá v Go efektivněji než Node event loop; patří do Caddyfile (`encode gzip zstd`), který ale není v repu → viz OPS runbook `docs/ops-runbook.md` (BE repo).
- **db-integrity** — ⚠️ **kořen opraven 17. 7.**: `WORLD_SCOPED` v `db-integrity-plan/tools/integrity-scan.md` byl **duplikát** seznamu z `world-hard-delete.service.ts` a zamrzl na 13. 6. → rozešel se na **28 vs. 46 kolekcí**, takže scan na 18 z nich hlásil 0 orphanů *ne protože je čisto, ale protože se nedíval*. Dokument teď na kód odkazuje jako na zdroj pravdy místo kopie. **Zbývá: rerun scanu** proti běžícímu Mongu s plným seznamem (čísla z `proof__db.md` jsou pravdivá jen pro dřívějších 28 kolekcí) + zvážit `characterId`-styl subdoc scan pro user-scoped kolekce (♻️ přesah CD-RUN-14/15). *(Indexy moderation kolekcí ✅ hotové.)*
- **AR-META-1** `anti-regression-map.json` = 0 ručních guardů (vše string-match auto-discovery); F-20 tiše degradoval G3→G0, R-02 G3→G2; CI guard (jen crit/high) to nechytá.

**⚪ NEOTVÍRAT jako 🔴 — report si to sám vyvrátil (report:82-85 „KOREKCE severity"):**
- **N-TM-01 / S-RUN-07** socket-swap listener leak — sníženo 🔴 → latentní nízké: oba spouštěče `reconnectSocket()` mapu **odmountují** → listenery se uklidí. *„Reálný trigger dnes NEEXISTUJE."*
- **RC-P3** slug souběh 500→409 — **není reálný** (izolace 5/5, E11000→409 funguje).

**Blokováno na uživateli:** DB zálohy — `db-backup.yml` hotový, cron **záměrně vynechán** (bez off-site cíle by zálohy zaplnily tentýž disk, na kterém běží Mongo; byly disk incidenty 07/2026). Volba **B2 / R2 / scp** (runbook §6) → pak rclone krok + `schedule:`.

**Neproběhlé proof-vrstvy** (report:66): `+teeth` Stryker, `+load`, `+perf` live, `+render`, `+fault`, `+authz-runtime`. SLO S1–S4 neměřené.
**Kdy:** 🟠 při práci na dané ploše nebo jako samostatná dávka; zálohy po volbě cíle; SLO guard při dalším výkonovém zátahu.

---

## Odložené (čeká na trigger)

### D-HP-MAP-SYSTEMS — token→deník HP sync chybí u 5 systémů (blokováno herní sémantikou)
*(dřív D-DATA-SYNC-ZBYTKY část b; část a — smazání legacy route — vyřešena 2026-07-18)*
**Soubory:** BE `maps/operations/token-hp-diary-map.ts` (sync mapa), spouštěč `map-operations.service.ts:798`.
**Stav:** HP z tokenu na taktické mapě se do deníku propíše jen u systémů s jednoznačným mapováním (dnes `matrix`). Přeskočeno u: shadowrun (odvozenina `sr_attr_bod`+`sr_cond_phys`), fae/fate (stress boxy = pole), drdplus (pásma zranění), drd2 (3 zdroje); + pole `systemStats`/`injury`/`initiative` nemají v deníku domov. **Doplnit dřív = mrtvý kód:** jediný FE producent `patch.currentHp` pro PC/NPC je `TokenSystemSheet.tsx:429` (matrix), pro ostatní 4 rodiny žádný caller neexistuje. Asymetrie: FE `resolveCharacterHp` ty rodiny číst umí, BE je zapsat ne.
**Trigger:** vznikne FE caller (`patch.currentHp` pro non-matrix PC/NPC) **a** padne produktové rozhodnutí o herní sémantice: SR fyzický vs. omračovací track? DrdPlus `currentHp=0` → `val=mez` nebo `3×mez`? fae/fate který stress box? drd2 který ze 3 zdrojů?
**Co bude potřeba:** per-system zápisové mapování v `token-hp-diary-map.ts` dle rozhodnuté sémantiky (naráz s callerem, ne půlku).

### D-DIARY-HP-DELTA — Deník PC: souběžné HP úpravy = last-write-wins (chybí server-side delta)
*(dřív část D-DROBNE-2026-07-13; sesterský injury-strop nález zavřen jako kosmetika 2026-07-19)*
**Soubory:** BE `character-diary.repository.ts:61-85` (`updateWithCustomDataPatch` = atomický `findOneAndUpdate` s flat `$set`); FE producenti absolutní hodnoty (`GurpsCombatPanel` → `{gurps_hp:'7'}` apod.).
**Stav:** repo zápis je atomický, ale **neexistuje server-side delta cesta pro deník** → HP přiletí jako absolutní hodnota spočítaná na klientovi ze **stale cache** → dva souběžné zásahy (PJ dá damage + hráč edituje) = last-write-wins, jeden zásah tiše zmizí. Bestie **tokeny** to mají vyřešené (`hpDelta`/`injuryDelta` na `token.update`, aggregation pipeline + race e2e); **deník ne** (asymetrie: FE `resolveCharacterHp` číst umí, BE zapsat deltou ne). Na rozdíl od zavřeného injury-stropu to **NENÍ kosmetika** — reálná ztráta zásahu.
**Trigger:** stížnost na „zmizelé HP" v boji, nebo souběžná editace deníku začne bolet.
**Co bude potřeba (rozhodnutí + BE, naráz — ne půlku):** jedna ze tří cest — (a) generický `customDataDelta` (naráží na string hodnoty + JSON pole → schema-driven typová brána), (b) jen HP klíče (úzké, bezpečné), (c) dodělat D-073 `expectedUpdatedAt` (dnes half-wired: `updatedAt` se vrací, nikde neověřuje). **Doporučeno (c)** — optimistic-lock chrání všechny deník patche, ne jen HP.

### D-066 — Nástěnka náborů filtruje client-side; paginace + BE facety až naráz
**Soubory:** FE `src/features/ikaros/pages/NaboryPage.tsx` (`useNabory` → celý aktivní seznam), `src/features/ikaros/lib/nabory.ts` (`filterNabory`); BE `GET /nabory` (bez query filtru).
**Stav:** 19.3b přidalo filtry systém+žánr, filtruje se **klient-side nad celým aktivním seznamem**. BE query filtr byl **vědomě zamítnut** (spec 19.3 §12.5): nástěnka potřebuje i po zafiltrování celý seznam, aby poznala, které volby nemají jediný lístek (zešednutí `optEmpty`) — server-side filtr by si vyžádal druhý request nebo facety a byl by dnes mrtvý kód. Při desítkách lístků je současné řešení správné; při stovkách poroste payload a čas do prvního renderu (filtr sám zůstane svižný, je v paměti).
**Trigger:** nástěnka překročí ~200–300 aktivních lístků, nebo `GET /nabory` začne být viditelně pomalý. Sledovat po spuštění 19.3 naživo.
**Co bude potřeba (naráz, ne půlku):** BE `GET /nabory?system=&genre=&strana=&mode=&q=&page=` + **facet counts** (počty per systém/žánr jedním průchodem agregací) → FE zahodí `present` sety a čte counts z BE (bonus: „D&D 5e (12)"). **Pozor:** filtr bez facet counts rozbije zešednutí prázdných voleb — proto obojí v jednom kroku.

### D-NEW-UM02-private-media-delivery — Privátní média mají veřejnou Cloudinary URL
**Soubory:** BE `upload.service.ts` (upload type), `images.controller.ts` (proxy); FE render privátních obrázků (mapy, AKJ, chat)
**Stav:** Cloudinary assety se nahrávají jako `type: 'upload'` (public). Privátní obsah (AKJ obrázky ve stránkách, privátní mapy `visibleToPlayerIds`, přílohy privátních zpráv) má veřejnou URL → kdo zná link, stáhne i bez oprávnění. BE access správně filtruje JSON odpovědi, ale URL samotná není chráněná. **Vědomě akceptováno (upload/media audit UM-02, 2026-06-14):** publicId je 20+ znaků náhodný (enumerace nemožná), únik vyžaduje aktivní sdílení oprávněným uživatelem. Pro single-svět hobby provoz je obscurity dostatečná.
**Trigger:** veřejný / komerční / multi-tenant provoz, kdy svět/postavy uvidí cizí lidé a obscurity přestane stačit (riziko hromadného scrape).
**Co bude potřeba:** rozhodnout (a) proxy endpoint s ACL pro NE-TipTap média (mapy/page.imageUrl/chat — jdou přes komponenty) vs (b) Cloudinary `authenticated` type + signed delivery URL (čistší, ale re-upload migrace ~3000+ assetů + signed URL expirace rozbije TipTap embedy). **Pozor:** AKJ obrázky vložené přímo v TipTap HTML (`section.content`) nezavře ani jedna varianta bez přepsání uloženého obsahu — known gap.

### D-NEW-UM10-storage-quota — Žádná per-user storage kvóta na uploady
**Soubory:** BE `upload.controller.ts` (rate-limit ✓ hotový), chybí storage tracking
**Stav:** Upload routy mají rate-limit (`@Throttle` 20/min/IP — UM-10, 2026-06-14), což brání rychlému spamu; creation capy (2026-07-12) omezují počty entit. Chybí ale **kumulativní per-user kvóta** (celková velikost nahraného obsahu) → trpělivý uživatel může postupně zaplnit Cloudinary úložiště.
**Trigger:** Cloudinary se blíží limitu free/placeného tieru, nebo komerční provoz s neznámými uživateli.
**Co bude potřeba:** sledovat součet `size` per uživatel (kolekce/agregace), gate v upload service při překročení. Souvisí D-19.2-BYTES.

### D-NEW-PC21-embedding-model-host — Embedding modely fyzicky hostovat (zbývá OPS krok)
**Soubor:** BE `backend/src/modules/search/embedding-search.service.ts:370-396` + `docker-compose.prod.yml` + `.env.example`
**Stav:** konfigurační část hotová (model URL přepsatelné přes env). **Zbývá jen OPS krok** (mimo kód): nahrát model soubory na vlastní hosting a přepsat env vars — nelze bez přístupu k souborům modelů.
**Trigger:** příprava ostrého provozu se sémantickým search, nebo nedostupnost `patrikzplzne.cz` ([[project_server_swap]]).
**Co bude potřeba:** stáhnout 4 model soubory, nahrát na vlastní úložiště, nastavit 4 env vars v GitHub vars / serverovém `.env`. **Akce uživatele.**

### D-NEW-chat-presence-scale — In-memory presence světového chatu × více instancí BE
**Soubory:** BE `chat/chat-presence.service.ts`
**Stav:** presence v `Map` v paměti procesu — pro single-instance BE správné rozhodnutí. Crony už mají `CronLockService` (2026-07-12), presence je poslední per-instance stav.
**Trigger:** nasazení víc instancí BE (load balancer / horizontální scaling).
**Infra ready:** Redis + Socket.IO Redis adapter opt-in (`SOCKET_IO_REDIS=1`). Chybí migrace presence Map → Redis hash (~8-16 h). **Dělat dřív = mrtvý kód.**

### D-NEW-color-tokens — Hardcoded barvy → theme tokeny (chrome drift)
**Plán:** [n2-color-mapping.md](n2-color-mapping.md).
**Zbývá (~1622 nálezů ve ~160 souborech):** vizuální projití per komponenta napříč 2–3 tématy (proto **ne v automatickém commitu** — riziko rozbití skinů bez živé kontroly). Top cíle: `TemplateEditorModal`, `NotificationCenter`, `PostavaLayout`…
**Trigger:** sjednocení vzhledu / nový skin odhalí drift. **Měření:** `npm run lint:colors`.

### D-19.1-RETENCE — Pravá week-over-week kohortní retence (chybí historie aktivity)
**Soubory:** BE `admin-growth.service.ts` (`buildRetention`) · `users` schema.
**Stav:** retence jen jako snapshot k dnešku; pravá retence T→T+1 nejde — v DB jen přepisovaný `lastSeenAt`, žádná historie návratů. Zpětný backfill nemožný.
**Trigger:** až bude potřeba skutečná retenční křivka v čase.
**Co bude potřeba:** týdenní append-only snapshot aktivity (`{ userId, isoWeek }`) — zapne pravou retenci od nasazení dál. Nový tracking = samostatné produktové rozhodnutí. Spec [19.1 §8](arch/phase-19/spec-19.1.md).

### D-19.2-BYTES — Velikost obrázkových blobů: zbývá FE posílání + agregace
**Soubory:** FE create/update formuláře entit s obrázkem; BE agregace.
**Stav:** BE strana hotová (2026-07-13): upload endpointy vracejí `bytes`, všech ~14 image schémat má `imageBytes`/`bytes` pole vč. toEntity; server-side toky (galerie, avatary) ukládají hned. **Zbývá:** (a) FE-driven toky `imageBytes` z upload response do create/update DTO zatím NEposílají (pole zůstává prázdné); (b) agregace per svět/uživatel pro měření (podmínka kvót UM-10); (c) staré bloby bez bytes (retroaktivně nejde).
**Trigger:** až bude potřeba přesná velikost per svět/uživatel (kvóty UM-10).
**Co bude potřeba:** protáhnout `bytes` z upload response do entit ve FE formulářích (mapy, bestie, stránky, emoty, světy, rostliny…); pozor na pár imageUrl+imageBytes (výměna obrázku bez bytes = stale hodnota). Spec [19.2 §7](arch/phase-19/spec-19.2.md).

### D-DICE-SERVER-RNG — Autoritativní hod na serveru (follow-up po Cestě A)
**Soubory:** BE `common/dice/dice-payload.validator.ts` (dnešní očista) + FE roll engine `chat/dice/lib/rollEngine.ts` (455 ř.) + `diceNotation.ts` (`@` předurčený výsledek pro 3D).
**Stav:** GI díra „klient je autorita nad total" zavřena Cestou A 2026-07-12. NEzavřené zbytky: (a) re-rolling (hráč hází lokálně dokola, pošle „šťastný" validní hod); (b) cílené podvody uvnitř systémových hodů (2d6+/roll-under/percentile/mixed); (c) kosmetická pod-pole (d100 `tens`/`ones`, `crit`, `breakdown`) se nevalidují proti faces.
**Trigger:** potřeba kompetitivní/turnajové integrity (dnes hobby + moderující PJ = přijatelné).
**Co bude potřeba:** Cesta B — FE pošle záměr, server hodí svým RNG, FE 3D přehraje přes `@` notaci. Vyžaduje port roll enginu na BE — pozor na `2d6+` (`sum≠Σfaces`) a nesčítání modifieru u GURPS/CoC/flat.

### D-MEILI-CZ — MeiliSearch: čeština padá na default Latin pipeline (bez stemmingu)
*(dřív součást D-SEC-GAP, „technické"; přeformulováno 2026-07-17 — „chybí český stemming" bylo zavádějící)*
**Soubory:** BE `meili-search.service.ts:40-62`, `embedding-search.service.ts:38`, `docker-compose.prod.yml:64`.
**Stav:** stemming pro češtinu v Meili **neexistuje** (není zapomenutý přepínač — čeština není v Charabii mezi jazyky s dedikovanou tokenizací). `localizedAttributes` (locale `ces`) chce server **v1.10+**, běží **v1.6** — a ani po upgradu by stemming nepřidal, jen zafixoval detekci jazyka. ⚠️ Tichý skew: klient `meilisearch@^0.58` cílí na server v1.15.
**Trigger:** až CZ fulltext začne viditelně bolet (relevance komunitních katalogů).
**Co bude potřeba (jedna z voleb):** (1) `synonyms` + `stopWords` (dnes tam nejsou; ruční kurace), (2) upgrade v1.6→v1.10+, (3) zapnout `EmbeddingSearchService` (kód existuje, vypnutý `EMBEDDING_ENABLED=0` kvůli ~2,46 GB RSS, viz [[rss_memory_embedding]]).

---

> _(Shop-purchase atomicita přesunuta jako `FA` cíl do
> [`seed-scenario-plan/00-cross-cutting.md`](seed-scenario-plan/00-cross-cutting.md) — opraví se tam s důkazem rollbacku.)_
