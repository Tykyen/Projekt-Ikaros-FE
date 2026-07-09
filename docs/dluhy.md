# Technické dluhy

> Soubor obsahuje **pouze otevřené a odložené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k 2026-06-27.

---

## Otevřené

> **Dluhy z inventury funkcí (2026-06-18).** Devět seskupených `D-NEW-INV-*` níže vzniklo z kódem ověřené inventury [`docs/funkce/`](funkce/00-prehled.md). Master tracker + mapování na fáze: `docs/roadmap2.md` → **Průřez Ú**. Cíl: na konci Etapy II 0 otevřených. (Rychlé doc/text fixy se řeší zvlášť, ne tady.)

### D-066 — Moderace: dvě plochy nedotažené (bestie report + deník/chat enforcement)
**Soubor:** FE bestie detail (report tlačítko chybí) · BE `characters`/`chat` enforcement listenery (M2/M3/M4 log-only)
**Problém:** (a) `bestie` má plný BE enforcement (B5-BE: skrýt/smazat/revert) i položku v `ReportTargetType`, ale **NEMÁ FE `ReportButton`** — bestii nelze nahlásit (enforcement je nedosažitelný). (b) `character_diary` a `chat_message`: report jde odeslat, ban autora (M5/M6) funguje, ale **content-level zásah (M2/M3 skrýt, M4 smazat) je jen `logWarn`/TODO** — konkrétní deník/zpráva se reálně neskryje/nesmaže (subdoc / WS gateway, B4b/B5-BE je vědomě odložily).
**Dopad:** Nízký/střední — „nahlašování všude" je z 9 ploch splněné; chybí bestie (report) a plné vynucení u 2 soukromých ploch. Ban autora funguje všude.
**Řešení:** (a) přidat `ReportButton targetType="bestie"` do bestie detailu (BE ready). (b) doplnit enforcement: deník = skrýt/smazat subdoc (přes character-subdocs), chat = smazat zprávu přes gateway; nebo vědomě ponechat account-level-only a zdokumentovat.
**Kdy:** Navazující na 20.1; bestie report brzy (levné), enforcement soukromých ploch dle potřeby.

---

### D-064 — FE `vitest run` suite-wide rozbitý („failed to find current suite")
**Soubor:** `vitest.config.ts` (auto-merge root `vite.config.ts` s `react()` pluginem) — projevuje se na VŠECH ~466 test souborech.
**Problém:** `vitest run` selže identicky na všech suitách („Vitest failed to find the current suite", 0 testů) i na souborech, kterých se nikdo nedotkl. Ověřeno na čistém běhu (smazaná cache, bez souběžnosti). NENÍ regrese z 20.1–20.3 — padá i na weather/calendar/tactical-map. Odpovídá známému gotcha (react() plugin se auto-merguje do vitest configu → rozbitý test context; pravděpodobně Node 24 / rozpracovaný working tree).
**Dopad:** Vysoký pro vývoj — **celý FE unit test runner nejede**; featury 20.1–20.3 ověřeny jen `tsc -b` (build gate) + logika zvlášť, ne vitestem. Produkci neblokuje.
**Řešení:** Prošetřit `vitest.config.ts` merge s root vite (viz komentář v souboru + memory `vitest_config_gotchas`) — izolovat vitest config od `react()` pluginu / ověřit Node verzi. Dokud nejede, FE se ověřuje `tsc`.
**Kdy:** Brzy — blokuje FE TDD/regresní síť.

---

### D-065 — Moderace: revert odvolání (unban) nerozlišuje zdroj banu
**Soubor:** `backend/src/modules/users/moderation-enforcement.listener.ts` (`moderation.revert` větev M5/M6)
**Problém:** Když se odvolání proti moderačnímu banu vyhoví (`overturned`), listener účet odbanuje bez ohledu na to, jestli byl mezitím nezávisle zabanován adminem z jiného důvodu → mohl by odbanovat účet, který má zůstat zabanovaný. Edge case (zalogováno), moderace = zdroj pravdy.
**Dopad:** Nízký — vyžaduje souběh moderačního banu + nezávislého admin banu na stejném účtu + overturn odvolání.
**Řešení:** Ukládat zdroj/důvod banu (`bannedBy` už existuje) a revert unbanovat jen pokud aktuální ban pochází z moderace (`decisionId`/zdroj shoda), jinak jen zalogovat.
**Kdy:** Až se moderace ostře používá; nízká priorita.

---

### D-063 — Identita správce (spolek) + zpracovatelé nedoplněni na legal stránkách (20A)
**Soubor:** `src/features/ikaros/pages/PrivacyPage.tsx`, `ContactPage.tsx`, `CodeOfConductPage.tsx`, `TermsPage.tsx` — placeholdery `[DOPLNIT: …]`
**Problém:** Zásady OÚ (`/soukromi`), Kontakt (`/kontakt`) a Podmínky nemají doplněnou totožnost správce: chybí název spolku, IČO, sídlo, spisová značka + soud spolkového rejstříku a kontaktní/provozní e-mail (pro uživatele i orgány). Navíc seznam zpracovatelů v Zásadách OÚ má u části služeb (hosting, SMTP, AI/LLM, error tracking, platební brána) nepotvrzené konkrétní poskytovatele + jejich EU/třetí-země status a transfer mechanismus (DPF vs. SCC).
**Dopad:** Vysoký (blokuje **veřejné spuštění**) — GDPR čl. 13 vyžaduje totožnost správce, DSA čl. 11/12 kontaktní místa; bez nich nelze web pustit veřejně. NEblokuje implementaci ani beta.
**Řešení:** Až uživatel/advokát dodá údaje spolku, nahradit všechny `[DOPLNIT]` (grep `dopisat` / `DOPLNIT`), potvrdit seznam zpracovatelů a u každé US služby uvést DPF/SCC. Poté bumpnout verzi dokumentů.
**Kdy:** Před veřejným spuštěním (spolek se teprve zakládá). Součást Přílohy C (20.1–20.3).

---

### D-R-AUDIT-CREATE-TX — create() světa není transakční (poloprázdný svět při seed-failu)
**Soubor:** `backend/src/modules/worlds/worlds.service.ts:425-481` — `create()`
**Problém:** Netransakční řetěz ~7 kroků (world → PJ membership → měny → počasí → kalendář → diarySchema → verze) bez rollbacku. Když spadne krok PO membershipu, HTTP vrátí 500, ale svět+membership už persistují → poloprázdný svět + matoucí chyba. Kontrast: `approveAccessRequest` transakci MÁ (D-061).
**Dopad:** Nízký/střední — seedy jsou defaulty (backfillovatelné); owner (membership) vzniká vždy PŘED seedy, takže „tvůrce nemá všechny věci" ≠ ztráta vlastnictví.
**Řešení:** (a) Mongo `session.withTransaction` přes všechny služby (velké — nutno protáhnout session), nebo (b) lehčí pojistka: obalit post-membership seed kroky `try/catch` + `logWarn` (svět nikdy neskončí bez membershipu, seed-fail jen zaloguje místo 500). Doporučení: (b) hned, (a) později.
**Kdy:** nízká priorita; NENÍ potvrzený aktivní bug (orchestrace „nemá věci" byla FE owner-bypass, ne spadlý seed — audit 2026-07-05).

---

### D-17.8-A11Y-BACKLOG — Přístupnost: odložené vrstvy nad rámec 17.8 v1
**Hotovo 2026-07-05 (většina backlogu):**
- (1) ✅ **`eslint-plugin-jsx-a11y` ve `warn`** — `eslint.config.js`; 34 pravidel z `flatConfigs.recommended` downgradováno na warn. Instalováno `--legacy-peer-deps` (plugin 6.10.2 deklaruje peer eslint ≤9, projekt má eslint 10; flat config fakticky funguje — ověřeno `--print-config`).
- (2) ✅ **sdílený `useFocusTrap`** (`shared/ui/useFocusTrap.ts`, extrakce z `Modal`) → napojen na `Modal` (refactor, 2 efekty→1), `NotificationCenter`, oba mobilní drawery v `IkarosLayout` (+`inert` na zavřený drawer) a mobilní drawer ve `WorldLayout` (+Escape, dřív chyběl). Duplicitní lokální `CalendarPage/hooks/useFocusTrap` smazán, `DayDetailDrawer` sjednocen na sdílený.
- (3) ✅ **`KebabMenu` roving-tabindex** — šipky ↑↓ (wrap, přeskočí disabled) + Home/End, jen aktivní položka v tab pořadí; +2 testy (8/8).
- (4) ✅ **borderline aria-label** — DrdPlus gender toggle (♀/♂). **Audit (agent) našel 0 prázdných icon-only tlačítek** v diary/combat/chat listech → migrace na `IconButton` NENÍ a11y oprava (všechna tlačítka už mají jméno), jen kosmetika. `IconButton` má nulovou adopci; migrace přeřazena na nízkoprio (viz níže).

**Zbývá (zúžený, nízká priorita):**
- **IconButton adopce** — ~16 ručních `<button>+lucide` (chat: `ChannelItem/Group/View`, `EmoteCard`, rail `*Panel`…) má aria-label, ale neadoptovalo primitiv. Čistě konzistenční refactor; POZOR `IconButton .iconBtn` = ghost/transparent styl → migrace MĚNÍ vzhled → nutný `mobil-desktop` per skin, ne slepě.
- **Storybook axe** (`.storybook/preview.tsx`) — zůstává `test:'todo'`. Přepnutí na `error` je **no-op**, dokud jsou storybook component testy mimo `vitest run` (D-033, ESM/CJS race) → axe se v CI nespouští. Trigger: browser-mode axe v CI (vyřešení D-033) + ověřená čistota 14 stories.
- **Focus trap do in-app overlayů** (nad rámec původního znění dluhu, objev auditu 2026-07-05): `WorldChatRoom` mobilní sidebar + scrim, `ChatContextRail` (bez Escape/trap/dialog), `MapNotebookOverlay` + `TokenInfoPanel` (mají Escape+`role=dialog`, chybí trap/restore). Sdílený `useFocusTrap` je připraven — chybí napojení. **Odloženo:** vyžaduje živý mobilní/mapový test (trap ve špatně posouzeném kontextu zhorší UX), proto ne naslepo.
**Dopad:** Nízký — základní a11y funguje, hlídá lint. Roadmap 17.8 značené 🔁 (průběžné).
**Kdy:** IconButton+overlaye při příští práci na daných plochách (s `mobil-desktop`); axe s D-033.

---

### D-NEW-INV-SEC — persona-on-server (PJ persona neprosakuje do server cest)
> Zbytek INV-SEC (heslo 6→8 FE+BE, scenarios role-floor, themeUserOverrides sanitizace; profil endpoint byl už opravený) **vyřešen 2026-06-27** — viz git log.
**Soubory:** BE `push.service` (push payload), news/feed, export + resolver PJ persony.
**Problém:** render-time PJ persona (FE) se neaplikuje na **serverové** cesty → push notifikace / feed / export může prosáknout reálné jméno PJ místo persony.
**Dopad:** Nízký — leak reálného jména PJ mimo chat.
**Řešení:** aplikovat personu i na serverové cesty (cross-cutting). **Kdy:** Fáze 14. Zdroj: kap. 13.

### D-NEW-INV-PUSH — Inventura: web push spam + chybějící deep-link
**Soubory:** BE `global-chat.service.ts` (`notifyAll` na každou zprávu), `ikaros-news.service` (`notifyAll` bez `url`), `push.service`; FE `public/sw.js` (deep-link připraven); pošta `ikaros-messages` (bez push).
**Problém:** globální chat pushuje **každou** zprávu **všem** (spam-vektor, bez throttlingu/opt-out/exclude odesílatele); push payloady nemají `url` → klik otevře jen `/` místo cílové místnosti/novinky; pošta nepushuje vůbec; jediný přepínač zapne/vypne vše (žádné per-typ předvolby).
**Dopad:** Střední — push prakticky nepoužitelný pro aktivní uživatele.
**Řešení:** `url` do payloadu; throttle + opt-out + vyloučit odesílatele u chatu; push i pro poštu; per-typ předvolby.
**Kdy:** Fáze 14.8 / 15.1 (PWA). Zdroj: kap. 04/05. Souvisí [[project_web_push_chat_status]].

### D-NEW-INV-ADMIN-UI — Inventura: BE endpointy bez FE (admin/účet)
**Soubory:** BE `users.controller` reset-password (Superadmin), `admin.controller` `POST /admin/users`, `data-export.controller` `/me`, `auth` `logout-all`; FE chybí.
**Problém:** funkční BE endpointy nemají FE: admin reset hesla, založení uživatele, GDPR export vlastních dat, „odhlásit všechna zařízení". Změna cizího e-mailu adminem neexistuje vůbec.
**Dopad:** Střední — GDPR export z UI nedostupný; admin operace jen přes API/skripty.
**Řešení:** doplnit FE konzumenty + admin formuláře; zvážit endpoint pro adminskou změnu e-mailu.
**Kdy:** Fáze 14.7 (export) / 20.2 (GDPR). Zdroj: kap. 01/08.

### D-NEW-INV-PROFILE — worldsCount + komunitní stuby profilu
> `displayName` trim (FE+BE) + `void role` (vyjasněn jako záměr 12.1) **vyřešeno 2026-06-27** — viz git log.
**Soubory:** FE `FriendsTab` (`worldsCount=0` natvrdo), FE profil „Moje diskuze/články/galerie" (stub „fáze 3").
**Problém:** počet světů u přátel natvrdo 0 (chce BE doplnit count do friend shape); komunitní sekce profilu jsou prázdné placeholdery, ač moduly jinde fungují.
**Dopad:** Nízký — kosmetika + nedotažená featura.
**Řešení:** doplnit worldsCount do friend shape (BE); napojit sekce na existující moduly. **Kdy:** Fáze 15.6 / 16.4. Zdroj: kap. 02.

### D-NEW-INV-DATA-SYNC — Inventura: konzistence dat postav/měn
**Soubory:** BE `map-operations.service.ts` (token→Character sync TODO), `world-currencies` `updateCurrencies` (full-replace), `character-subdocs.service.ts` (finance/inventory create vs. read), `characters.repository.ts` (legacy `/characters/directory`).
**Problém:** staty/HP tokenu PC/NPC se z mapy nepropíšou do listiny postavy (žijí v `diary.customData`); `updateCurrencies` přepisuje celou sadu (riziko ztráty měn bez delta merge); subdoc finance/výbava se zakládají i pro NPC/Lokaci, ale `getFinance`/`getInventory` je pro ně blokuje 404 → orphan data; legacy adresářový endpoint zůstává vedle Pages directory (dvojí zdroj).
**Dopad:** Střední — tichá nekonzistence.
**Řešení:** dotáhnout token↔Character sync; delta merge měn; nezakládat nepoužitelné subdoky (nebo je zpřístupnit); odstranit legacy directory.
**Kdy:** Fáze 16.2. Zdroj: kap. 12/14.

### D-NEW-INV-MAPS — Inventura: taktická mapa nedotažené
**Soubory:** BE `maps`/`map-operations` (undo `inverse=null` u `scene.deactivate`, `member.bulkAssignToScene`; combat order), `world-maps.service.ts:47` (role práh PJ).
**Problém:** undo neúplné (některé operace nelze vrátit); role-prahy nejednotné (atlas „Mapy" = PJ, ale taktická mapa/zvuky/deník = PomocnyPJ); combat order má dvojí zdroj pravdy (`scene.combat.order` vs. live-sort dle initiative); „A* pohyb" reálně jen dosah, ne pathfinding přes překážky.
**Dopad:** Nízký–střední — UX pasti pro PJ.
**Řešení:** doplnit inverse pro chybějící operace; sjednotit role-prahy; vyjasnit jediný zdroj combat order; pathfinding buď doplnit (17.x), nebo opravit spec (rychlý fix).
**Kdy:** Fáze 17.x. Zdroj: kap. 14.

### D-NEW-INV-CLEANUP — Inventura: úklid kódu (drift & mrtvé)
> audit-log labely (FE `AdminAuditAction` srovnáno s BE, +16 akcí) **sjednoceny 2026-06-27** — viz git log.
**Soubory:** BE `user.interface.ts` (UserRole legacy 3–8), `UsersTable.tsx` (`canEditPlatformPages` mrtvý flag), 3× content service (`Tyky` bypass), `admin.service.ts` (`getUsers` in-memory filtr), `meili-search.service.ts` (tichý fail), favorites toggly (duplicitní).
**Problém:** BE `UserRole` stále drží legacy world role (3–8), FE už vyhodil (drift po D-053); `canEditPlatformPages` se ukládá, ale nikde nevynucuje; admin bypass přes username `=== 'Tyky'`; `getUsers` filtruje až po vytažení stránky (nekonzistentní paginace); MeiliSearch bez Dockeru vrací prázdno bez chyby; favorites toggle zkopírovaný v 3 modulech.
**Dopad:** Nízký — maintainability + 1 provozní past (Meili).
**Řešení:** vyčistit BE enum; odstranit mrtvý flag; bypass přes roli/flag; paginace v DB dotazu; surface Meili health/chybu; centralizovat favorites.
**Kdy:** Fáze 14.9. Zdroj: kap. 02/06/08.

---

---

> _(Shop-purchase atomicita přesunuta jako `FA` cíl do
> [`seed-scenario-plan/00-cross-cutting.md`](seed-scenario-plan/00-cross-cutting.md) — opraví se tam s důkazem rollbacku.)_

---

## Odložené (čeká na trigger)

### D-NEW-UM02-private-media-delivery — Privátní média mají veřejnou Cloudinary URL
**Soubory:** BE `upload.service.ts` (upload type), `images.controller.ts` (proxy); FE render privátních obrázků (mapy, AKJ, chat)
**Stav:** Cloudinary assety se nahrávají jako `type: 'upload'` (public). Privátní obsah (AKJ obrázky ve stránkách, privátní mapy `visibleToPlayerIds`, přílohy privátních zpráv) má veřejnou URL → kdo zná link, stáhne i bez oprávnění. BE access správně filtruje JSON odpovědi, ale URL samotná není chráněná. **Vědomě akceptováno (upload/media audit UM-02, 2026-06-14):** publicId je 20+ znaků náhodný (enumerace nemožná), únik vyžaduje aktivní sdílení oprávněným uživatelem. Pro single-svět hobby provoz je obscurity dostatečná.
**Trigger:** veřejný / komerční / multi-tenant provoz, kdy svět/postavy uvidí cizí lidé a obscurity přestane stačit (riziko hromadného scrape).
**Co bude potřeba:** rozhodnout (a) proxy endpoint s ACL pro NE-TipTap média (mapy/page.imageUrl/chat — jdou přes komponenty) vs (b) Cloudinary `authenticated` type + signed delivery URL (čistší, ale re-upload migrace ~3000+ assetů + signed URL expirace rozbije TipTap embedy). **Pozor:** AKJ obrázky vložené přímo v TipTap HTML (`section.content`) nezavře ani jedna varianta bez přepsání uloženého obsahu — known gap.

### D-NEW-UM10-storage-quota — Žádná per-user storage kvóta na uploady
**Soubory:** BE `upload.controller.ts` (rate-limit ✓ hotový), chybí storage tracking
**Stav:** Upload routy mají rate-limit (`@Throttle` 20/min/IP — UM-10, 2026-06-14), což brání rychlému spamu. Chybí ale **kumulativní per-user kvóta** (celková velikost nahraného obsahu) → trpělivý uživatel může postupně zaplnit Cloudinary úložiště.
**Trigger:** Cloudinary se blíží limitu free/placeného tieru, nebo komerční provoz s neznámými uživateli.
**Co bude potřeba:** sledovat součet `size` per uživatel (kolekce/agregace), gate v upload service při překročení.

### D-NEW-PC21-embedding-model-host — Embedding modely fyzicky hostovat (zbývá OPS krok)
**Soubor:** BE `backend/src/modules/search/embedding-search.service.ts:370-396` + `docker-compose.prod.yml` + `.env.example`
**Stav:** Production-config audit **PC-21 — konfigurační část HOTOVÁ:** model URL (granite107/278 ONNX+tokenizer) jsou teď explicitní a přepsatelné přes env (`EMBEDDING_GRANITE*_ONNX_URL`/`_TOKENIZER_URL`) v compose i `.env.example` (default = `www.patrikzplzne.cz`). Skrytá závislost zviditelněna. **Zbývá jen OPS krok** (mimo kód): nahrát model soubory na vlastní hosting (Cloudinary/S3/BE image) a přepsat ty env vars — to nelze udělat bez přístupu k souborům modelů.
**Trigger:** příprava ostrého provozu se sémantickým search, nebo nedostupnost `patrikzplzne.cz` ([[project_server_swap]] — sourozenec `newmatrix.patrikzplzne.cz` je mrtvý).
**Co bude potřeba:** stáhnout 4 model soubory, nahrát na vlastní úložiště, nastavit 4 env vars v GitHub vars / serverovém `.env`.

### D-NEW-chat-presence-scale — In-memory presence světového chatu × více instancí BE
**Soubory:** BE `chat/chat-presence.service.ts`
**Stav:** `ChatPresenceService` drží presence konverzací v `Map` v paměti procesu. Pro
single-instance BE (aktuální stav — žádné repliky, `SOCKET_IO_REDIS` vypnuté) je to
**správné rozhodnutí** — nulová latence, žádná infra závislost. Stejný vzor jako
in-memory rate-limiter (D-028).
**Trigger:** nasazení víc instancí BE (load balancer / horizontální scaling) — presence
by se mezi instancemi neviděla (BE-1 vidí jen své sockety, BE-2 své).
**Infra ready:** Redis je v projektu (`ioredis`, `@socket.io/redis-adapter`, RedisModule,
docker-compose), Socket.IO Redis adapter je opt-in přes `SOCKET_IO_REDIS=1` v
`backend/src/socket-io.adapter.ts`. Chybí jen migrace samotné presence z `Map` na Redis
hash (~8-16 h: refactor join/leave/list na ioredis hash/set + TTL cleanup + failover
fallback na Map + testy).
**Kdy:** Při přechodu na multi-instance BE. **Dělat dřív = mrtvý kód** pro neexistující infru.

### D-NEW-color-tokens — Hardcoded barvy → theme tokeny (chrome drift)
**Plán:** [n2-color-mapping.md](n2-color-mapping.md) (mapa kategorií + tokeny + postup).
> Bezpečný krok (ALLOW datové dirs → `lint:colors` 4397→1622) **hotov 2026-06-27** — viz git log.
**Zbývá (skutečný chrome drift, ~1622 ve ~160 souborech):** vizuální projití per komponenta napříč 2–3 tématy (proto **ne v automatickém commitu** — riziko rozbití skinů bez živé kontroly). Top cíle: `TemplateEditorModal`, `NotificationCenter`, `PostavaLayout`…
**Trigger:** sjednocení vzhledu / nový skin odhalí drift. **Měření:** `npm run lint:colors`.

### D-19.1-RETENCE — Pravá week-over-week kohortní retence (chybí historie aktivity)
**Soubory:** BE `backend/src/modules/admin/admin-growth.service.ts` (`buildRetention`) · zdroj `users` schema.
**Stav:** 19.1 dodává retenci jen jako **snapshot k dnešku** (aktivace / lepkavost WAU/MAU / survival kohorty podle `createdAt` × aktuální `lastSeenAt`). **Pravá retence T→T+1** (kolik uživatelů registrovaných v týdnu T bylo aktivních v T+1) **NEJDE** — v DB je per-user jen **jeden přepisovaný** `lastSeenAt` (a `lastLoginAt`), žádná historie návratů; analytics je bez `userId` (GDPR), presence in-memory. Zpětný backfill nemožný.
**Trigger:** až bude potřeba skutečná retenční křivka v čase.
**Co bude potřeba:** lehký **týdenní append-only snapshot** aktivity (`{ userId, isoWeek }` unique, nebo denní rollup `lastSeenAt`) — zapne pravou retenci **od nasazení dál** (ne zpětně). Malý nový tracking → samostatné produktové rozhodnutí (dnes vědomě cesta A bez trackingu). Spec [19.1 §8](arch/phase-19/spec-19.1.md).

### D-19.2-BYTES — Velikost obrázkových blobů v bytech (dnes jen počty)
**Soubory:** BE upload cesta (`upload/upload.service.ts` `UploadedImage`) + image schémata (gallery, world-maps, maps, emotes, pages, bestiae, world, avatary).
**Stav:** 19.2 měří storage jako **počet souborů** per typ/svět — **velikost v bytech se u obrázků do DB neukládá** (schémata drží jen `imageUrl`/`publicId`). Přesné byty známe jen u **chat příloh** (`attachments[].size`) a **admin PDF** (`sizeBytes`); celkový skutečný objem dává jen **Cloudinary `api.usage()`** (account-level, ne per-svět).
**Trigger:** až bude potřeba přesná velikost per svět/uživatel (nutná podmínka pro **vynucování kvót** — navazující krok 19.2).
**Co bude potřeba:** ukládat `bytes` (z Cloudinary `result.bytes` / `file.size`) do image schémat při uploadu. Retroaktivně nepokryje staré bloby (jen od nasazení). Spec [19.2 §7](arch/phase-19/spec-19.2.md).

---

## Vyřešené

### D-16.2F-DRDPLUS-CHAT-BESTIE-SKIN — DrD+ bestie v chatu se neoskinuje · ✅ 2026-07-05
**Kde:** `src/features/world/chat/components/rail/BestieInstancePanel.tsx` + `BestieRollPanel.tsx` (drdplus větev).
**Kořen:** drdplus bestie v chatu se renderovala BEZ `DiarySkinScope` → na potomka nevzniklo `data-diary-skin`, takže `--dd-*` skin tokeny (z `diary-skins.css`) se neinjektly a panel `.root` spadl na pergamen fallbacky (`var(--dd-*, <default>)`) = default vzhled bez ohledu na skin. Zavádějící komentář tvrdil „self-contained, `.root` má vlastní --dd-*", ale ty byly v 16.2d odebrány (mapa je zdroj pravdy: `TokenSystemSheet` drdplus obaluje `DiarySkinScope` správně).
**Oprava:** obaleno `<DiarySkinScope worldId={worldId}>` v obou souborech (vzor drd2/drd16). Komentáře opraveny. Ověřeno: `npm run build` ✓.

### D-NEW-ANON-HEADER-OVERFLOW — Anon hlavička přetékala na úzkém mobilu · ✅ 2026-07-03
**Kde:** `src/themes/ThemeSwitcher.module.css` + `IkarosLayout.tsx` (`HeaderLoggedOut`).
**Kořen:** ThemeSwitcher trigger držel plný název motivu (~108 px) a na mobilu se neskrýval (nemá `.headerBtnLabel`), takže anon hlavička přetékala ~42 px; „Registrace" navíc po skrytí labelu zůstávalo prázdné tlačítko.
**Oprava:** `@media (max-width:768px)` v ThemeSwitcheru skryje název motivu (zůstane jen šipka; výběr běží přes rozbalovací nabídku) → trigger 108→32 px; „Registrace" dostalo ikonu `UserPlus` (na mobilu ikona místo prázdna). Ověřeno měřením: `scrollWidth === clientWidth` na 360/375/768, `hOverflow=false`, žádný `_headerNav`/`_headerBtn` offender.
