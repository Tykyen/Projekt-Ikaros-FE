# Technické dluhy

> Soubor obsahuje **pouze otevřené a odložené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k 2026-06-01.

---

## Otevřené

### D-NEW-SYS-DIARY-DRIFT — Dračí Hlídka: nesladěné id mezi nabídkou systémů a deníkem
**Soubor:** `src/features/ikaros/pages/CreateWorldPage/constants/systems.ts` (RPG_SYSTEMS) ↔ `src/features/world/pages/CharacterDetailPage/diary-systems/registry.ts` + `presets/drdh.ts`
**Problém:** **Jeden systém (Dračí Hlídka) má dvě různá id.** Nabídka při vytvoření světa ho ukládá jako `world.system = 'draci-hlidka'`, ale jeho deník je registrovaný pod klíčem **`drdh`** (`drdh.ts`: `id: 'drdh'`, `name: 'Dračí Hlídka'`; `types.ts` whitelist zná jen `drdh`). Diary registry nezná `draci-hlidka` → **svět vytvořený jako Dračí Hlídka svůj deník nenajde a dostane prázdné/generic schema.** (Žádný samostatný „Dračí Doupě Hero" neexistuje — `drdh` JE Dračí Hlídka.)
**Dopad:** Střední — funkční bug: existující/nové světy „Dračí Hlídka" nemají svůj deníkový list. Blokuje dotažení systému (roadmap2 16.2h).
**Řešení:** Sjednotit na **jedno** id napříč vrstvami (nabídka systems.ts · FE diary registry/types/preset · BE `system-presets` + export-schemas). Doporučeno sladit deník na `draci-hlidka` (id z nabídky, které se ukládá do `world.system`) — nebo přidat alias `draci-hlidka → drdh` v registry. Ověřit migraci případných existujících světů.
**Kdy:** Před rozjezdem fáze 16.2 (hloubková podpora systémů). Zaznamenáno i v `docs/roadmap2.md` (16.2 drift blok + otevřená otázka #10).

---

> **Dluhy z inventury funkcí (2026-06-18).** Devět seskupených `D-NEW-INV-*` níže vzniklo z kódem ověřené inventury [`docs/funkce/`](funkce/00-prehled.md). Master tracker + mapování na fáze: `docs/roadmap2.md` → **Průřez Ú**. Cíl: na konci Etapy II 0 otevřených. (Rychlé doc/text fixy se řeší zvlášť, ne tady.)

### D-NEW-INV-SEC — Inventura: bezpečnostní nálezy účtu/světa
**Soubory:** auth `register.dto.ts` (heslo `@MinLength(6)` vs reset/změna 8); `users.controller` nechráněný `GET /users/profile/:id`; `worlds.service.ts` `updateMyTheme` (sanitizace `themeUserOverrides`); `campaign.controller` `POST /scenarios`; chat persona render-time (FE) vs push/feed payload.
**Problém:** drobné, ale reálné mezery — nekonzistentní min. délka hesla; veřejný profil endpoint bez friend-only/tombstone gate (možný leak); `themeUserOverrides` bez serverové sanitizace; storyboard scénář vytvoří i hráč přímým POST (chybí role-floor); render-time PJ persona může mimo chat (push/feed/export) odhalit reálné jméno.
**Dopad:** Nízký–střední; část je leak k ověření.
**Řešení:** heslo sjednotit na 8; ověřit a případně zavřít/sloučit veřejný profil endpoint; sanitizovat overrides na BE; role-floor scénářům; aplikovat personu i na serverové cesty.
**Kdy:** Fáze 14. Zdroj: `docs/funkce/` kap. 01/02/10/13/15.

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

### D-NEW-INV-PROFILE — Inventura: profil & seznam uživatelů
**Soubory:** FE profil „Moje diskuze/články/galerie" (stub „fáze 3"), `usersTabs` `visibleTabsForRole`/`defaultTabForRole` (`void role`), `displayName` validace, `FriendsTab` `worldsCount=0`.
**Problém:** komunitní sekce profilu jsou prázdné placeholdery, ač moduly jinde fungují; per-role taby `/ikaros/uzivatele` ignorují roli (mrtvý param); `displayName` bez min/regex; počet světů u přátel natvrdo 0.
**Dopad:** Nízký — kosmetika + nedotažená featura.
**Řešení:** napojit sekce na existující moduly; implementovat per-role taby nebo odstranit mrtvý param; validace displayName; doplnit worldsCount do friend shape.
**Kdy:** Fáze 15.6 / 16.4. Zdroj: kap. 02.

### D-NEW-INV-WIKI — Inventura: tabulky ve vieweru + seed↔menu
**Soubory:** FE `OstatniLayout.tsx` (readonly `RichTextEditor` bez `enableTable`) a další read layouty; BE seed referenčních stránek vs. FE `buildWorldNav` (hardcoded „Informace").
**Problém:** inline `<table>` v `page.content` se ve čtení zahodí (editor je umí, viewer ne) → PJ vloží tabulku, hráč ji nevidí; smazaná seedovaná stránka (`pravidla`/`magicky-system`/`technologie`) zůstává jako mrtvý odkaz v menu „Informace" (seed a menu jsou 2 nepropojené vrstvy).
**Dopad:** Střední — ztráta obsahu při čtení.
**Řešení:** přidat `enableTable` do readonly vieweru (nebo zakázat v editoru / převést na sekce); ošetřit smazanou seed-stránku v menu. Pozn.: [[project_page_content_no_tables]] to dnes drží jako vědomý stav.
**Kdy:** Fáze 15.5. Zdroj: kap. 11.

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

### D-NEW-INV-CASCADE — Inventura: kaskády & čas — ✅ z větší části VYŘEŠENO 2026-06-20
**✅ Opraveno (plný audit 14.9, 2026-06-20):**
- `world-calendar-config` delete nulluje dangling `worldSettings.timelineCalendarSlug` (CD-RUN-2).
- `ikaros-events` soft-delete (`isActive=false`, **bez jakékoli obnovy**) → **hard delete + `media.orphaned`** (CD-RUN-4b); `game-events` delete byl už čistý (tvrdé + blob cleanup) — „soft-delete akcí bez cleanup" se týkal jen ikaros-events.
- `/akce` přidáno do menu „Svět" (skrývatelné `id:'akce'`, spec 12.3 R2 akt.).
- legacy `/sprava-udalosti` redirect **smazán** (expiroval); `LegacyCalendersController` `/calenders` překlep **smazán** (eventy přes character-subdocs `PUT calendar`).
**Otevřené (zbytek, mimo 14.9):** in-game datum (advance-day v Počasí) se nepromítne do „Dnes" v `/kalendar` — sjednotit zdroj in-game data.
**Dopad:** Nízký — zbývá jen UX (in-game datum).
**Kdy:** zbytek mimo 14.9. Zdroj: kap. 15.

### D-NEW-INV-CLEANUP — Inventura: úklid kódu (drift & mrtvé)
**Soubory:** BE `user.interface.ts` (UserRole legacy 3–8), `UsersTable.tsx` (`canEditPlatformPages` mrtvý flag), 3× content service (`Tyky` bypass), `admin.service.ts` (`getUsers` in-memory filtr), `meili-search.service.ts` (tichý fail), favorites toggly (duplicitní), `AuditLogTab.tsx` vs `admin-audit-log.interface.ts` (label drift).
**Problém:** BE `UserRole` stále drží legacy world role (3–8), FE už vyhodil (drift po D-053); `canEditPlatformPages` se ukládá, ale nikde nevynucuje; admin bypass přes username `=== 'Tyky'`; `getUsers` filtruje až po vytažení stránky (nekonzistentní paginace); MeiliSearch bez Dockeru vrací prázdno bez chyby; favorites toggle zkopírovaný v 3 modulech; audit-log labely se rozcházejí FE↔BE.
**Dopad:** Nízký — maintainability + 1 provozní past (Meili).
**Řešení:** vyčistit BE enum; odstranit mrtvý flag; bypass přes roli/flag; paginace v DB dotazu; surface Meili health/chybu; centralizovat favorites; sjednotit audit-log labely.
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
**Stav (2026-06-16):** `npm run lint:colors` hlásí **2340**, ale rozbor ukázal, že jde o dvě věci:
**1271 datové identity** (kostkové skiny `/chat/dice/` 454 + herní systémy `/diary-systems/` 817) = záměrně fixní napříč tématy, **patří do ALLOW** (stejně jako vyňatý `tactical-map/system-panels`), NE tokenizovat; **1069 skutečný chrome drift** ve 160 souborech k tokenizaci na theme-aware tokeny.
**Bezpečný první krok (bez vizuálu):** rozšířit `ALLOW` v `scripts/lint-no-hardcoded-colors.mjs` o `/chat/dice/lib/`+`/chat/dice/components/models/`+`polyhedralDice.css`+`/diary-systems/styles/`+`/diary-systems/sheets/` → číslo spadne na ~1069. (Dice UI pickery do ALLOW NE — jsou chrome.)
**Zbytek:** vizuální projití per komponenta napříč 2–3 tématy (proto ne v automatickém commitu). Top cíle: `TemplateEditorModal`(34), `NotificationCenter`(28), `PostavaLayout`(27)…
**Trigger:** sjednocení vzhledu / nový skin odhalí drift. **Měření:** `npm run lint:colors`.
