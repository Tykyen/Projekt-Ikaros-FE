# Technické dluhy

> Soubor obsahuje **pouze otevřené a odložené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k 2026-06-27.

---

## Otevřené

> **Dluhy z inventury funkcí (2026-06-18).** Devět seskupených `D-NEW-INV-*` níže vzniklo z kódem ověřené inventury [`docs/funkce/`](funkce/00-prehled.md). Master tracker + mapování na fáze: `docs/roadmap2.md` → **Průřez Ú**. Cíl: na konci Etapy II 0 otevřených. (Rychlé doc/text fixy se řeší zvlášť, ne tady.)

### D-16.2F-DRDPLUS-CHAT-BESTIE-SKIN — DrD+ bestie v chatu se neoskinuje
**Soubory:** `src/features/world/chat/components/rail/BestieInstancePanel.tsx` + `BestieRollPanel.tsx` — drdplus větev bestie panelu v chatu.
**Problém:** drdplus bestie v chatu se renderuje BEZ `DiarySkinScope` (vnější `<aside>` nese jen `data-diary-system`, ne `data-diary-skin`) → compound selektor skinu `[data-diary-system='drdplus'][data-diary-skin='X']` nesedne a bestie zůstane na default vzhledu bez ohledu na zvolený skin. Nekonzistence: na mapě (TokenSystemSheet) je drdplus bestie scoped správně, v chatu ne. Stejnou mezeru měl drd2 — opravená v 16.2f obalením `DiarySkinScope`; drdplus zbývá.
**Dopad:** Nízký — kosmetika; bestie v chatu nedrží zvolený skin (jen u drdplus).
**Řešení:** obalit `DrdPlusChatBestiePanel` v obou souborech `<DiarySkinScope worldId={worldId}>…</DiarySkinScope>` (vzor drd16/matrix/drd2 větve). ~4 řádky/soubor.
**Kdy:** při příští práci na drdplus skinech / chatu, nebo v rámci uzávěru drdplus skinů (jejich `mobil-desktop`/funkce/napoveda je taky pending).

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
