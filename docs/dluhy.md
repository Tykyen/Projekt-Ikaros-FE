# Technické dluhy

> Soubor obsahuje **pouze otevřené a odložené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k **2026-07-19**. Vyřešené se **mažou** 
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

### D-RT-SCALE — Realtime broadcast/škála (presence globálně · žádný connection cap)
*(dřív „🟠 Realtime / škála" v D-AUDIT-2026-07-11)*
**Soubory:** BE `presence.gateway.ts:84,107,153,157`, `socket-io.adapter.ts:92-98`, `ws-rate-limit.ts`.
**Stav (zbylé 2 body, sdílený trigger = škála):**
- **presence room-scoping** — `presence.gateway.ts:107/153/157` `this.server.emit('presence:update')` broadcastuje **všem** připojeným socketům (`:84` nový příchozí `client.broadcast.emit` taky globálně, jen bez sebe), žádná `.to(room)` → O(N²) při N online **a** mění, kdo koho vidí online (**produktové rozhodnutí**, ne jen výkon → čeká na vstup).
- **connection cap per IP/uživatel** — žádný strop; `socket-io.adapter.ts:92` gate řeší jen ban/deleted účet, `ws-rate-limit` limituje frekvenci EVENTŮ na už navázaném socketu, ne počet socketů. Per-user/IP strop napříč sockety chce Redis (per-socket bucket nestačí — socket je sticky, multi-tab je záměrně podporovaný) → **mrtvý kód na 1 instanci**.
**Redis-backed presence** je stejný trigger → sledováno v [[D-NEW-chat-presence-scale]] (+ D-051), zde neduplikuji.
**Trigger:** roste počet souběžně online (broadcast bolí), nebo nasazení víc instancí BE.
**Co bude potřeba:** scope presence emitů na svět/skupinu room; per-user connection cap přes Redis. Produktové: kdo koho vidí online.

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

### D-PERF-BE — Katalog `GET /worlds`+`/pages` bez limitu (paginace)
*(dřív „25 PERF-BE" v D-AUDIT-2026-07-11)*
**Soubory:** BE `worlds.controller.ts:54` `@Get()` → `worlds.repository.findAll()` (VŠECHNY aktivní světy bez limitu/projekce), obdobně `GET /pages`.
**Stav:** katalog vrací celý seznam aktivních světů jedním requestem. Při SLO cíli 500 světů = velký payload + čas do renderu. **Vědomě neděláno teď:** paginace je **breaking pro FE** (katalog čeká celý seznam kvůli klient-side filtru/řazení) → chce koordinovanou FE+BE změnu, ne tichý BE limit.
**Trigger:** katalog naroste (viditelně pomalý `/worlds`), nebo škála 500 světů.
**Co bude potřeba (naráz, ne půlku):** BE `?page=&limit=` + projekce lehkých polí + FE přechod na stránkovaný katalog.

### D-DB-BACKUP-CRON — DB zálohy: cron záměrně vynechán (blokováno na uživateli)
*(dřív „Blokováno na uživateli" v D-AUDIT-2026-07-11)*
**Soubory:** BE `db-backup.yml` (workflow hotový), chybí `schedule:` + rclone krok.
**Stav:** `db-backup.yml` hotový, cron **záměrně vynechán** — bez off-site cíle by zálohy zaplnily tentýž disk, na kterém běží Mongo (byly disk incidenty 07/2026).
**Trigger:** uživatel zvolí off-site cíl.
**Co bude potřeba:** volba **B2 / R2 / scp** (ops-runbook §6) → rclone krok + `schedule:`. **Akce uživatele.**

---

> _(Shop-purchase atomicita přesunuta jako `FA` cíl do
> [`seed-scenario-plan/00-cross-cutting.md`](seed-scenario-plan/00-cross-cutting.md) — opraví se tam s důkazem rollbacku.)_
